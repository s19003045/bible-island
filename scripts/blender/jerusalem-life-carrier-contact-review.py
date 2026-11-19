"""Read-only, discrete actual-mesh contact review of the carrier work clips.

Run with Blender 4.5, --background --threads 4 --python-exit-code 1.
Source/GLB/common builders are never saved or changed. Surface vertex samples
are not continuous collision or triangle-intersection certification.
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
REVIEW = runpy.run_path(str(ROOT/'scripts/blender/jerusalem-life-anatomy-review.py'))
PLAN = [('SetDown', [.2,.4,.7], 'R'), ('PickUp', [.3,.6,.9], 'R'),
        ('Pour', [.4,.6], 'R'), ('Fill', [.2,.6,.8], 'L')]
TOLERANCE = .0005


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def coords(v):
    return [round(float(x), 9) for x in v]


def components(vertices, polygons):
    """Separate actual disconnected prop surfaces, without welding/capping."""
    parent = list(range(len(vertices)))
    def root(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i
    for f in polygons:
        for i in f[1:]:
            parent[root(i)] = root(f[0])
    parts = {}
    for f in polygons:
        parts.setdefault(root(f[0]), []).append(f)
    result = []
    for fs in parts.values():
        indices = sorted(set(i for f in fs for i in f))
        edges = {}
        vol = 0.
        for f in fs:
            for j,a in enumerate(f):
                e=tuple(sorted((a,f[(j+1)%len(f)])))
                edges[e]=edges.get(e,0)+1
            for j in range(1,len(f)-1):
                vol += vertices[f[0]].dot(vertices[f[j]].cross(vertices[f[j+1]]))/6
        result.append({'bvh': BVHTree.FromPolygons(vertices,fs),
                       'vertices':len(indices), 'polygons':len(fs),
                       'bounds_world':[[min(vertices[i][a] for i in indices) for a in range(3)],
                                       [max(vertices[i][a] for i in indices) for a in range(3)]],
                       'closed_two_faces_per_edge':all(n==2 for n in edges.values()),
                       'boundary_edges':sum(n==1 for n in edges.values()),
                       'signed_volume_m3':vol,
                       'winding':1 if vol>0 else -1})
    return result


def dipper_contact(scene, graph):
    prop,skin=scene.objects['carrier-dipper'],scene.objects['carrier-arms-and-hands']
    p,s=prop.evaluated_get(graph),skin.evaluated_get(graph)
    pm,sm=p.to_mesh(),s.to_mesh()
    try:
        vertices=[p.matrix_world@v.co for v in pm.vertices]
        parts=components(vertices,[list(f.vertices) for f in pm.polygons])
        names={g.index:g.name for g in skin.vertex_groups}
        samples=[]
        for v in sm.vertices:
            weights=sorted(v.groups,key=lambda g:-g.weight)
            name=next((names[g.group] for g in weights if g.weight>.25 and
                       names[g.group].startswith(('fingerL','thumbL','handL'))),None)
            if name is not None:
                name=name[:-1] if name.startswith(('fingerL','thumbL')) else name
                samples.append((name,s.matrix_world@v.co))
        result=[]
        for part in parts:
            bvh=part.pop('bvh');rows={}
            for name,point in samples:
                nearest,normal,_,distance=bvh.find_nearest(point)
                # Closed components can be wound either way. Open bowl wall
                # normals are left as authored; its signed volume is NOT an
                # inside/outside classifier.
                sign=part['winding'] if part['closed_two_faces_per_edge'] else 1
                signed=(point-nearest).dot(normal)*sign
                row=rows.setdefault(name,{'sampled_vertices':0,'nearest_distance_m':999,
                                          'vertices_within_2mm':0,'negative_normal_vertices_over_0_5mm':0,
                                          'maximum_negative_normal_depth_m':0})
                row['sampled_vertices']+=1
                row['nearest_distance_m']=min(row['nearest_distance_m'],distance)
                row['vertices_within_2mm']+=int(distance<=.002)
                if signed < -TOLERANCE:
                    row['negative_normal_vertices_over_0_5mm']+=1
                if -signed>row['maximum_negative_normal_depth_m']:
                    row['maximum_negative_normal_depth_m']=-signed
                    row['worst_world']=coords(point)
                    row['nearest_world']=coords(nearest)
                    row['normal_world']=coords(normal*sign)
            part['components']=rows
            part['classification']='closed solid local nearest-surface sign' if part['closed_two_faces_per_edge'] else 'open hollow wall: local-normal candidates only'
            result.append(part)
        return {'scope':'Actual evaluated left palm/finger/thumb vertices versus disconnected actual dipper components; no mesh editing, capping, or welding. Discrete poses only.',
                'tolerance_m':TOLERANCE,'actual_surface_parts':result}
    finally:
        p.to_mesh_clear();s.to_mesh_clear()


def select_pose(scene,rig,clip,phase):
    for track in rig.animation_data.nla_tracks:
        track.mute=True
    action=next(a for a in bpy.data.actions if a.name.endswith('-'+clip))
    rig.animation_data.action=action
    start,end=action.frame_range
    frame=start+(end-start)*phase
    scene.frame_set(math.floor(frame),subframe=frame%1)
    graph=bpy.context.evaluated_depsgraph_get();graph.update()
    return graph,frame,action.name


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--out',default='.qa/jerusalem-life/reviewer-carrier-motion-contact')
    ap.add_argument('--source',default='assets/blender/jerusalem-life/carrier.blend')
    ap.add_argument('--render',action='store_true')
    ap.add_argument('--samples',type=int,default=24)
    args=ap.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
    source=ROOT/args.source;out=ROOT/args.out;out.mkdir(parents=True,exist_ok=True)
    source_sha=sha(source)
    meta_path=ROOT/'assets/blender/jerusalem-life/carrier-motion.json'
    meta=json.loads(meta_path.read_text())
    assert source_sha==meta['editable_source']['sha256'],'Source differs from metadata.'
    snapshot=out/'reviewer-source-snapshot.blend'
    shutil.copyfile(source,snapshot)
    assert sha(source)==sha(snapshot)==source_sha,'Source changed while snapshotting.'
    bpy.ops.wm.open_mainfile(filepath=str(snapshot))
    scene=bpy.context.scene
    rig=next(o for o in scene.objects if o.type=='ARMATURE')
    report={'schema_version':1,'scope':'Eleven discrete final-source evaluated mesh poses; no continuous or full triangle intersection certification.',
            'source':str(source.relative_to(ROOT)),'source_sha256':source_sha,
            'metadata_sha256':sha(meta_path),'metadata_source_matches':True,'threshold_m':TOLERANCE,
            'poses':[],'renders':[]}
    for clip,phases,side in PLAN:
        for phase in phases:
            graph,frame,action=select_pose(scene,rig,clip,phase)
            row={'clip':clip,'phase':phase,'frame':frame,'action':action,'active_contact_side':side}
            bw=REVIEW['bones_world'](rig,graph)
            prop='jugGripR' if side=='R' else 'dipperGripL'
            row['marker_distance_m']=(bw['handGrip'+side][0]-bw[prop][0]).length
            if side=='R':
                row['handle']=REVIEW['evaluated_grip'](scene,graph,'carrier')
                row['jug_wall']=REVIEW['jug_shell_contact'](scene,graph,'carrier')
                depths=[r['maximum_penetration_m_unthresholded_if_closed'] for r in row['handle']['digits'].values()]
                depths += [r['maximum_local_negative_normal_depth_m'] for r in row['jug_wall']['digits'].values()]
            else:
                row['dipper']=dipper_contact(scene,graph)
                depths=[r['maximum_negative_normal_depth_m'] for p in row['dipper']['actual_surface_parts'] for r in p['components'].values()]
            row['maximum_local_negative_normal_depth_m']=max(depths,default=0)
            report['poses'].append(row)
            (out/'audit-initial.json').write_text(json.dumps(report,indent=2)+'\n')
            print('CARRIER_CONTACT_POSE',clip,phase,'max_mm',round(row['maximum_local_negative_normal_depth_m']*1000,6),flush=True)
    if args.render:
        for o in scene.objects:
            if o.get('work_only'):
                o.hide_render=o.name not in ['carrier-dipper','carrier-water-stream']
        camera=REVIEW['STUDIO'](scene,1.71,args.samples)
        scene.render.resolution_x=720;scene.render.resolution_y=720
        for clip,phase,side in [('SetDown',.7,'R'),('Fill',.6,'L'),('Pour',.6,'R')]:
            select_pose(scene,rig,clip,phase)
            hand=rig.pose.bones['hand'+side]
            target=rig.matrix_world@(hand.head+(hand.tail-hand.head).normalized()*.075)
            # Perspective remains orthographic studio; front/outer sees the
            # actual retained vessel rather than an isolated disembodied hand.
            offset=Vector((1.5,-.8,.45)) if side=='R' else Vector((-1.2,-1.4,.6))
            camera.location=target+offset
            camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
            camera.data.ortho_scale=.38 if side=='R' else .30
            scene.render.filepath=str(out/(clip.lower()+'-'+str(phase)+'-actual-contact.png'))
            bpy.ops.render.render(write_still=True)
            report['renders'].append({'clip':clip,'phase':phase,'side':side,'file':str(pathlib.Path(scene.render.filepath).relative_to(ROOT))})
    report['snapshot_sha256_after']=sha(snapshot)
    report['snapshot_unchanged']=sha(snapshot)==source_sha
    report['original_source_sha256_after']=sha(source)
    report['original_source_unchanged_since_snapshot']=sha(source)==source_sha
    assert report['snapshot_unchanged']
    (out/'audit.json').write_text(json.dumps(report,indent=2)+'\n')
    print('CARRIER_CONTACT_REVIEW_READY',source_sha,flush=True)


if __name__=='__main__':
    main()
