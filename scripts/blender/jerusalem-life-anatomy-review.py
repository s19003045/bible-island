"""Independent read-only anatomy review of actual Jerusalem-life meshes.

blender --background --threads 4 --python scripts/blender/jerusalem-life-anatomy-review.py -- \
  --roles resident,carrier,elder --geometry --views front,side,rear,hand-front,hand-outer,hand-palm

The geometry source is never saved or exported. Hand-palm is an explicitly
isolated view: clothing/head/legs are hidden in memory to expose the medial
surface. Measurements distinguish evaluated meshes from skeletal proxies.
Static rest inspection does not validate motion, skin/cloth clearance, or grip.
"""
import argparse
import hashlib
import json
import math
import pathlib
import runpy
import shutil
import sys

import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ROOT = pathlib.Path(__file__).resolve().parents[2]
STUDIO = runpy.run_path(str(ROOT / 'scripts/blender/human-motion-review.py'))['studio']


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def unit(v):
    return v.normalized() if v.length > 1e-10 else Vector((0, 0, 0))


def angle(a, b):
    return math.degrees(math.acos(max(-1, min(1, unit(a).dot(unit(b))))))


def xyz(v):
    return [round(float(x), 8) for x in v]


def bones_world(rig, graph):
    evaluated = rig.evaluated_get(graph)
    return {b.name: (evaluated.matrix_world @ b.head, evaluated.matrix_world @ b.tail,
                     evaluated.matrix_world.to_3x3() @ b.matrix.to_3x3())
            for b in evaluated.pose.bones}


def evaluated_nails(scene, graph, role, bones):
    """Actual nail position and surface normal, corrected for polygon winding.

    A nail's geometric displacement from its distal phalanx determines dorsal
    direction. Raw polygon winding alone is not an anatomical orientation test.
    """
    obj = scene.objects.get(role + '-nails')
    if obj is None:
        return {'error': 'No nail mesh'}
    evaluated = obj.evaluated_get(graph)
    mesh = evaluated.to_mesh()
    normal_matrix = evaluated.matrix_world.to_3x3().inverted().transposed()
    sums = {}
    try:
        groups = {g.index: g.name for g in obj.vertex_groups}
        for poly in mesh.polygons:
            influences = {}
            for i in poly.vertices:
                for g in mesh.vertices[i].groups:
                    influences[groups[g.group]] = influences.get(groups[g.group], 0) + g.weight
            if not influences:
                continue
            name = max(influences, key=influences.get)
            item = sums.setdefault(name, {'normal': Vector((0, 0, 0)), 'center': Vector((0, 0, 0)), 'area': 0, 'polygons': 0})
            world_normal = unit(normal_matrix @ poly.normal)
            world_center = evaluated.matrix_world @ poly.center
            item['normal'] += world_normal * poly.area
            item['center'] += world_center * poly.area
            item['area'] += poly.area
            item['polygons'] += 1
        result = {}
        for name, v in sums.items():
            center = v['center'] / max(v['area'], 1e-12)
            raw_normal = unit(v['normal'])
            a, b = bones[name][:2]
            axis = unit(b-a)
            displacement = center-a-axis*(center-a).dot(axis)
            position_dorsal = unit(displacement)
            outward = raw_normal if raw_normal.dot(position_dorsal) >= 0 else -raw_normal
            result[name] = {'dorsal_normal_world': xyz(outward),
                            'raw_polygon_normal_world': xyz(raw_normal),
                            'dorsal_by_actual_nail_displacement_world': xyz(position_dorsal),
                            'nail_axis_clearance_m': displacement.length,
                            'raw_winding_points_inward': raw_normal.dot(position_dorsal) < 0,
                            'centroid_world': xyz(center), 'area_source_m2': v['area'], 'polygons': v['polygons']}
        return result
    finally:
        evaluated.to_mesh_clear()


def evaluated_grip(scene, graph, role):
    """Actual deformed finger vertices versus the actual jug-handle surface.

    Vertex sampling is not a full triangle/triangle collision proof. Penetration
    is reported only for a closed, consistently wound handle mesh.
    """
    handle = scene.objects.get(role+'-jug-handle')
    skin = scene.objects.get(role+'-arms-and-hands')
    if handle is None or skin is None:
        return None
    h = handle.evaluated_get(graph)
    s = skin.evaluated_get(graph)
    hm, sm = h.to_mesh(), s.to_mesh()
    try:
        vertices = [h.matrix_world @ v.co for v in hm.vertices]
        polygons = [list(p.vertices) for p in hm.polygons]
        bvh = BVHTree.FromPolygons(vertices, polygons)
        edge_counts = {}
        signed_volume = 0.
        for polygon in polygons:
            for i, a in enumerate(polygon):
                edge = tuple(sorted((a, polygon[(i+1) % len(polygon)])))
                edge_counts[edge] = edge_counts.get(edge, 0) + 1
            for i in range(1, len(polygon)-1):
                signed_volume += vertices[polygon[0]].dot(vertices[polygon[i]].cross(vertices[polygon[i+1]]))/6
        closed = all(v == 2 for v in edge_counts.values())
        winding = 1 if signed_volume > 0 else -1
        groups = {g.index: g.name for g in skin.vertex_groups}
        digits = {}
        for v in sm.vertices:
            digit = next((groups[g.group][:-1] for g in sorted(v.groups, key=lambda x: -x.weight)
                          if g.weight > .25 and (groups[g.group].startswith('fingerR') or groups[g.group].startswith('thumbR'))), None)
            if digit is None:
                continue
            point = s.matrix_world @ v.co
            nearest, normal, _, distance = bvh.find_nearest(point)
            signed = (point-nearest).dot(normal)*winding
            d = digits.setdefault(digit, {'sampled_vertices': 0, 'nearest_surface_distance_m': 999,
                                         'vertices_within_2mm': 0, 'inside_vertices_if_closed': 0,
                                         'maximum_penetration_m_if_closed': 0,
                                         'maximum_penetration_m_unthresholded_if_closed': 0})
            d['sampled_vertices'] += 1
            d['nearest_surface_distance_m'] = min(d['nearest_surface_distance_m'], distance)
            d['vertices_within_2mm'] += int(distance <= .002)
            if closed:
                d['maximum_penetration_m_unthresholded_if_closed'] = max(d['maximum_penetration_m_unthresholded_if_closed'], -signed)
            if closed and signed < -.0005:
                d['inside_vertices_if_closed'] += 1
                d['maximum_penetration_m_if_closed'] = max(d['maximum_penetration_m_if_closed'], -signed)
        return {'scope': 'Actual evaluated digit-surface vertex samples against actual evaluated handle BVH; not full triangle intersections or continuous sweep.',
                'inside_count_and_thresholded_max_tolerance_m': .0005,
                'handle_closed_two_faces_per_edge': closed, 'handle_signed_volume_m3': signed_volume,
                'handle_outward_winding_multiplier': winding, 'digits': digits}
    finally:
        h.to_mesh_clear()
        s.to_mesh_clear()


def parcel_contact(scene, graph, role):
    """Actual evaluated palms/digits against household-parcel surface.

    The authored ellipsoid has two microscopic open pole rings. Analysis caps
    are allowed only for boundary loops under0.1mm diameter, explicitly logged.
    No asset is changed. This supplies a bounded inside classifier, not a new
    production collision mesh or complete triangle/continuous proof.
    """
    prop, skin = scene.objects.get('household-parcel'), scene.objects.get(role+'-arms-and-hands')
    if prop is None or skin is None:
        return None
    p, s = prop.evaluated_get(graph), skin.evaluated_get(graph)
    pm, sm = p.to_mesh(), s.to_mesh()
    try:
        vertices = [p.matrix_world @ v.co for v in pm.vertices]
        polygons = [list(f.vertices) for f in pm.polygons]
        edges = {}
        for f in polygons:
            for i, a in enumerate(f):
                b = f[(i+1) % len(f)]
                edges.setdefault(tuple(sorted((a,b))), []).append((a,b))
        boundary = [v[0] for v in edges.values() if len(v) == 1]
        raw_closed = not boundary and all(len(v) == 2 for v in edges.values())
        remaining = set(boundary)
        caps = []
        while remaining:
            a, b = next(iter(remaining))
            loop = [a]
            remaining.remove((a,b))
            current = b
            while current != a:
                loop.append(current)
                candidates = [e for e in remaining if e[0] == current]
                if len(candidates) != 1:
                    break
                edge = candidates[0]
                remaining.remove(edge)
                current = edge[1]
            diameter = max((vertices[i]-vertices[j]).length for i in loop for j in loop)
            allowed = current == a and diameter < .0001
            caps.append({'boundary_vertices':len(loop),'diameter_m':diameter,'analysis_cap_added':allowed})
            if allowed:
                polygons.append(list(reversed(loop)))
        analysis_closed = raw_closed or bool(caps) and all(v['analysis_cap_added'] for v in caps)
        volume = 0.
        for f in polygons:
            for i in range(1,len(f)-1):
                volume += vertices[f[0]].dot(vertices[f[i]].cross(vertices[f[i+1]]))/6
        winding = 1 if volume > 0 else -1
        bvh = BVHTree.FromPolygons(vertices, polygons)
        groups = {g.index:g.name for g in skin.vertex_groups}
        rows = {}
        for vertex in sm.vertices:
            group = next((groups[g.group] for g in sorted(vertex.groups,key=lambda g:-g.weight)
                          if g.weight>.5 and groups[g.group].startswith(('handL','handR','fingerL','fingerR','thumbL','thumbR'))),None)
            if group is None:
                continue
            component = group if group.startswith('hand') else group[:-1]
            point = s.matrix_world @ vertex.co
            closest,normal,_,distance = bvh.find_nearest(point)
            signed = (point-closest).dot(normal)*winding
            row = rows.setdefault(component,{'vertices':0,'nearest_surface_distance_m':999,'vertices_within_2mm':0,
                                              'inside_over_0_5mm_vertices':0,'maximum_penetration_m':0})
            row['vertices'] += 1
            row['nearest_surface_distance_m'] = min(row['nearest_surface_distance_m'],distance)
            row['vertices_within_2mm'] += int(distance<=.002)
            if analysis_closed and signed < 0:
                row['inside_over_0_5mm_vertices'] += int(signed<-.0005)
                if -signed > row['maximum_penetration_m']:
                    row['maximum_penetration_m'] = -signed
                    row['worst_point_world'],row['nearest_prop_point_world'] = xyz(point),xyz(closest)
        return {'scope':'Actual evaluated palm/digit vertices versus evaluated household-parcel BVH. Tiny pole boundary analysis caps explicitly logged. Static sample only.',
                'actual_prop_closed':raw_closed,'analysis_classifier_closed':analysis_closed,'tiny_boundary_caps':caps,
                'signed_volume_m3':volume,'inside_tolerance_m':.0005,'components':rows}
    finally:
        p.to_mesh_clear()
        s.to_mesh_clear()


def jug_shell_contact(scene, graph, role):
    """Spot check the jug wall as well as the handle; local signed normals.

    The hollow jug has an open inner-bottom boundary. This reports local wall
    penetration candidates rather than claiming global closed-solid topology.
    """
    prop,skin = scene.objects.get(role+'-jug'),scene.objects.get(role+'-arms-and-hands')
    if prop is None or skin is None:
        return None
    p,s = prop.evaluated_get(graph),skin.evaluated_get(graph)
    pm,sm = p.to_mesh(),s.to_mesh()
    try:
        vertices=[p.matrix_world@v.co for v in pm.vertices]
        polygons=[list(f.vertices)for f in pm.polygons]
        bvh=BVHTree.FromPolygons(vertices,polygons)
        names={g.index:g.name for g in skin.vertex_groups};rows={}
        for v in sm.vertices:
            name=next((names[g.group][:-1]for g in sorted(v.groups,key=lambda g:-g.weight)
                       if g.weight>.5 and names[g.group].startswith(('fingerR','thumbR'))),None)
            if name is None:continue
            point=s.matrix_world@v.co;nearest,normal,_,distance=bvh.find_nearest(point)
            signed=(point-nearest).dot(normal)
            row=rows.setdefault(name,{'sampled_vertices':0,'nearest_distance_m':999,'negative_normal_depth_over_0_5mm_candidates':0,'maximum_local_negative_normal_depth_m':0})
            row['sampled_vertices']+=1;row['nearest_distance_m']=min(row['nearest_distance_m'],distance)
            if signed<-.0005:
                row['negative_normal_depth_over_0_5mm_candidates']+=1
                if -signed>row['maximum_local_negative_normal_depth_m']:
                    row['maximum_local_negative_normal_depth_m']=-signed;row['worst_point_world']=xyz(point);row['nearest_surface_point_world']=xyz(nearest);row['nearest_surface_normal_world']=xyz(normal)
        return {'scope':'Actual evaluated digit vertices against hollow jug surface. Local signed-normal candidates only; open inner bottom prevents a global closed-solid claim.','digits':rows}
    finally:p.to_mesh_clear();s.to_mesh_clear()


def measurements(scene, rig, role):
    graph = bpy.context.evaluated_depsgraph_get()
    graph.update()
    bones = bones_world(rig, graph)
    nails = evaluated_nails(scene, graph, role, bones)
    up, forward = Vector((0, 0, 1)), Vector((0, -1, 0))
    report = {'scope': 'Static evaluated rest pose; skeletal angle proxies plus actual evaluated nail surface normals. No continuous-motion or grip-clearance claim.',
              'coordinate_system': 'Z up, body front -Y, actor L -X, actor R +X',
              'sides': {}, 'evaluated_nail_surfaces': nails}
    for side, sign in [('L', -1), ('R', 1)]:
        A, E = bones['arm' + side][:2]
        _, W = bones['forearm' + side][:2]
        H, T, M = bones['hand' + side]
        upper, fore, hand = E-A, W-E, T-H
        dorsal = unit(M @ Vector((0, 0, 1)))
        palm = -dorsal
        inward = Vector((-sign, 0, 0))
        item = {'shoulder_world': xyz(A), 'elbow_world': xyz(E), 'wrist_world': xyz(W),
                'upper_arm_coronal_abduction_deg': math.degrees(math.atan2(sign*upper.x, -upper.z)),
                'upper_arm_forward_flexion_deg': math.degrees(math.atan2(upper.dot(forward), -upper.z)),
                'elbow_bend_deg_zero_is_straight': angle(upper, fore),
                'wrist_deviation_deg': angle(fore, hand),
                'bone_frame_palm_normal_world': xyz(palm),
                'bone_frame_palm_to_body_inward_deg': angle(palm, inward),
                'bone_frame_palm_forward_dot': palm.dot(forward),
                'bone_frame_mannequin_palm_forward_flag': palm.dot(forward) > math.sqrt(.5),
                'fingers': {}}
        for j in range(4):
            names = ['finger' + side + str(j) + suffix for suffix in 'ABC']
            segments = [bones[name][1] - bones[name][0] for name in names]
            item['fingers'][str(j)] = {'base_world': xyz(bones[names[0]][0]),
                                     'tip_world': xyz(bones[names[-1]][1]),
                                     'segment_sum_m': sum(v.length for v in segments),
                                     'PIP_bend_deg': angle(segments[0], segments[1]),
                                     'DIP_bend_deg': angle(segments[1], segments[2])}
        thumb_names = ['thumb' + side + suffix for suffix in 'ABC']
        thumb_base = bones[thumb_names[0]][0]
        thumb_tip = bones[thumb_names[-1]][1]
        digit_distances = {str(j): (thumb_base-bones['finger'+side+str(j)+'A'][0]).length for j in range(4)}
        actual_dorsals = [Vector(v['dorsal_normal_world']) for k, v in nails.items()
                          if k.startswith('finger' + side)]
        actual_dorsal = unit(sum(actual_dorsals, Vector((0, 0, 0))))
        item.update({'thumb_base_world': xyz(thumb_base), 'thumb_tip_world': xyz(thumb_tip),
                     'thumb_base_to_tip_forward_m': (thumb_tip-thumb_base).dot(forward),
                     'thumb_base_to_digit_MCP_distances_m': digit_distances,
                     'thumb_nearest_digit_index': min(digit_distances, key=digit_distances.get),
                     'actual_nail_mean_dorsal_world': xyz(actual_dorsal),
                     'actual_nail_mean_palm_forward_dot': (-actual_dorsal).dot(forward),
                     'actual_nail_vs_hand_frame_dorsal_deg': angle(actual_dorsal, dorsal)})
        report['sides'][side] = item
    if 'handGripR' in bones and 'jugGripR' in bones:
        report['grip_marker_distance_m'] = (bones['handGripR'][0]-bones['jugGripR'][0]).length
        report['grip_marker_scope'] = 'Marker coincidence only; not actual skin/handle contact.'
    if 'parcelGripL' in bones and 'parcelGripR' in bones:
        report['parcel_marker_distances_m'] = {side:(bones['handGrip'+side][0]-bones['parcelGrip'+side][0]).length
                                               for side in ['L','R']}
        report['parcel_marker_scope'] = 'Marker coincidence only; actual palms/digits are audited separately.'
    report['mesh_counts'] = {o.name: {'vertices': len(o.data.vertices), 'polygons': len(o.data.polygons)}
                             for o in scene.objects if o.type == 'MESH'}
    report['actual_grip_surface_samples'] = evaluated_grip(scene, graph, role)
    report['actual_parcel_surface_samples'] = parcel_contact(scene, graph, role)
    report['actual_jug_shell_surface_samples'] = jug_shell_contact(scene, graph, role)
    return report


def render_one(role, args, out):
    source = pathlib.Path(args.source) if args.source else ROOT / ('.qa/jerusalem-life/' + role + '-geometry.blend' if args.geometry
                     else 'assets/blender/jerusalem-life/' + role + '.blend')
    if not source.is_absolute():
        source = ROOT/source
    before = sha(source)
    folder = out / role
    if args.clip:
        folder = folder / (args.clip.lower()+'-'+str(args.phase))
    folder.mkdir(parents=True, exist_ok=True)
    snapshot = folder / 'reviewer-source-snapshot.blend'
    shutil.copyfile(source, snapshot)
    assert sha(snapshot) == before == sha(source), 'Source changed while snapshotting; retry.'
    bpy.ops.wm.open_mainfile(filepath=str(snapshot))
    scene = bpy.context.scene
    rig = next(o for o in scene.objects if o.type == 'ARMATURE')
    # Actual saved pose at its initial frame, no bind/reset replacement.
    for o in scene.objects:
        if o.get('work_only'):
            o.hide_render = not args.show_work
    if rig.animation_data and args.clip:
        for track in rig.animation_data.nla_tracks:
            track.mute = True
        action = next(a for a in bpy.data.actions if a.name == args.clip or a.name.endswith('-'+args.clip))
        rig.animation_data.action = action
        start, end = action.frame_range
        frame = start + (end-start)*args.phase
        scene.frame_set(math.floor(frame), subframe=frame % 1)
    report = measurements(scene, rig, role)
    report.update({'source': str(source.relative_to(ROOT)), 'source_sha256': before,
                   'source_frame': scene.frame_current_final, 'clip_requested': args.clip,
                   'phase_requested': args.phase if args.clip else None,
                   'rig_identity': {k: rig.get(k) for k in ('base_model_id', 'role', 'motion_version')}, 'renders': []})
    if getattr(args,'original_source',None):
        report['original_source'] = args.original_source
        report['original_source_sha256_at_snapshot'] = args.original_source_sha256
    (folder / 'audit-initial.json').write_text(json.dumps(report, indent=2)+'\n')
    camera = STUDIO(scene, 1.71, args.samples)
    scene.render.resolution_x, scene.render.resolution_y = 600, 800
    desired = [] if args.check_only else args.views.split(',')
    for view in desired:
        isolated = view == 'hand-palm'
        original_hidden = {o.name: o.hide_render for o in scene.objects if o.type == 'MESH'}
        if isolated:
            for o in scene.objects:
                if o.type == 'MESH' and not any(token in o.name for token in ('arms-and-hands', 'nails', 'hand-creases', 'review-floor')):
                    o.hide_render = True
        if view in ('front', 'side', 'rear'):
            target = Vector((0, 0, .84))
            position = {'front': (0, -5.1, 1.12), 'side': (5.1, -.20, 1.12), 'rear': (0, 5.1, 1.12)}[view]
            camera.data.ortho_scale = 2.08
        elif view == 'shoulder-side':
            target = rig.matrix_world @ rig.pose.bones['armR'].head + Vector((-.025, 0, .025))
            position = target + Vector((2, -.2, .1))
            camera.data.ortho_scale = .40
        elif view == 'neck-front':
            target = Vector((0, 0, 1.37))
            position = target + Vector((0, -2, .1))
            camera.data.ortho_scale = .55
        elif view.startswith('work-'):
            target = rig.matrix_world @ rig.pose.bones['propParcel'].head + Vector((0,0,.015))
            offsets = {'work-front':(0,-2,.10),'work-side':(2,-.15,.12),'work-top':(.20,-.8,1.2)}
            position = target + Vector(offsets[view])
            camera.data.ortho_scale = .48
        else:
            side = 'L' if view.startswith('left-') else 'R'
            hand = rig.pose.bones['hand' + side]
            target = rig.matrix_world @ (hand.head + unit(hand.tail-hand.head)*.065)
            offsets = {'hand-front': (0, -1.5, .06), 'hand-outer': (1.5, -.5, .06),
                       'grip-inner': (-1.5, -1.0, .08), 'grip-top': (-.8, -1.0, .5),
                       'hand-palm': (-1.5, -1.0, .08), 'left-front': (0, -1.5, .06)}
            position = target + Vector(offsets[view])
            camera.data.ortho_scale = .32 if role != 'carrier' else .38
        camera.location = position
        camera.rotation_euler = (target-camera.location).to_track_quat('-Z', 'Y').to_euler()
        scene.render.filepath = str(folder / ('rest-'+view+'.png' if not args.clip else args.clip.lower()+'-'+str(args.phase)+'-'+view+'.png'))
        bpy.ops.render.render(write_still=True)
        report['renders'].append({'view': view, 'file': str(pathlib.Path(scene.render.filepath).relative_to(ROOT)),
                                  'isolated_in_memory': isolated})
        for name, hidden in original_hidden.items():
            scene.objects[name].hide_render = hidden
    report['source_sha256_after'] = sha(source)
    report['source_unchanged'] = report['source_sha256_after'] == before
    report['reviewed_snapshot_sha256_after'] = sha(snapshot)
    report['reviewed_snapshot_unchanged'] = sha(snapshot) == before
    assert report['reviewed_snapshot_unchanged'], 'Read-only reviewed snapshot unexpectedly changed.'
    (folder / 'audit.json').write_text(json.dumps(report, indent=2)+'\n')
    print('ANATOMY_REVIEW_READY', role, before, len(report['renders']), flush=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--roles', default='resident,carrier,elder')
    parser.add_argument('--geometry', action='store_true')
    parser.add_argument('--source')
    parser.add_argument('--show-work', action='store_true')
    parser.add_argument('--out', default='.qa/jerusalem-life/reviewer-anatomy')
    parser.add_argument('--views', default='front,side,rear,hand-front,hand-outer,hand-palm,left-front')
    parser.add_argument('--samples', type=int, default=24)
    parser.add_argument('--check-only', action='store_true')
    parser.add_argument('--clip')
    parser.add_argument('--phase', type=float, default=0)
    parser.add_argument('--plan', help='Example Receive:.4,.7,1;CarrySmall:.5')
    args = parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
    out = pathlib.Path(args.out)
    if not out.is_absolute():
        out = ROOT / out
    out.mkdir(parents=True,exist_ok=True)
    # A whole requested multi-phase review uses one immutable snapshot, even if
    # the author later replaces the draft atomically while renders are running.
    if args.source:
        original = pathlib.Path(args.source)
        if not original.is_absolute():
            original = ROOT/original
        source_sha = sha(original)
        frozen = out/'reviewer-source-snapshot.blend'
        if original.resolve() != frozen.resolve():
            shutil.copyfile(original,frozen)
        assert source_sha == sha(original) == sha(frozen), 'Draft changed while snapshotting; retry.'
        args.original_source = str(original.relative_to(ROOT))
        args.original_source_sha256 = source_sha
        args.source = str(frozen)
    for role in args.roles.split(','):
        plan = [(None,[args.phase])] if not args.clip else [(args.clip,[args.phase])]
        if args.plan:
            plan = [(entry.split(':')[0],[float(v)for v in entry.split(':')[1].split(',')])for entry in args.plan.split(';')]
        for clip,phases in plan:
            args.clip = clip
            for phase in phases:
                args.phase = phase
                render_one(role, args, out)


if __name__ == '__main__':
    main()
