"""Original articulated life sheep, independent of the human character rigs.

Requires ewe_scene from our original abraham-animals.py. Copy only authored
source data: no downloaded animal, archaeological breed, flock count or selected
king is inferred. The body, neck, head, tail and cloven hooves reuse that source;
segmented legs follow its proportions with independent joints and flat soles.
A slow four-beat Walk is in place. Its 1.2 s cycle corresponds to 0.24 m forward
travel (+Z in the exported glTF), in unscaled model metres. At instance scale s,
advance clip time by actual world distance / (0.24*s) * 1.2 seconds, with one
quarter-cycle swing and three supporting feet.
Graze bends the neck and head without making a person select or anoint an animal.
No human skeleton, action list, existing ewe scene or source mesh is mutated.
"""
from mathutils import Matrix

if 'ewe_scene' not in globals():
    raise RuntimeError('Author abraham-animals.py before david-animal.py')

david_flock_scene = new_scene('David — original articulated life sheep, 1 Samuel 16 comparison')
david_flock_rig_data = bpy.data.armatures.new('david-flock-original-quadruped-skeleton')
david_flock_rig = bpy.data.objects.new('david-flock-sheep-rig', david_flock_rig_data)
david_flock_scene.collection.objects.link(david_flock_rig)
bpy.context.view_layer.objects.active = david_flock_rig
david_flock_rig.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')

# Sixteen quadruped bones are independent of the project's human skeleton.
david_flock_bone_specs = {
    'sheep-body': ((0, .46, 0), (0, .65, 0), None),
    'sheep-neck': ((0, .47, .16), (0, .64, .36), 'sheep-body'),
    'sheep-head': ((0, .64, .36), (0, .56, .563), 'sheep-neck'),
    'sheep-tail': ((0, .48, -.355), (0, .32, -.410), 'sheep-body'),
}
david_flock_legs = {}
for label, side, fore, offset in [('front-left', -1, 1, 0), ('rear-left', -1, -1, .25),
                                 ('front-right', 1, 1, .5), ('rear-right', 1, -1, .75)]:
    x = side*.13; f = fore*.255; bend = -1 if fore == 1 else 1
    hip = Vector(xyz(x, .43, f)); knee = Vector(xyz(x, .24, f+bend*.030))
    ankle = Vector(xyz(x, .045, f+.006)); toe = Vector(xyz(x, .025, f+.022))
    upper = 'sheep-'+label+'-upper'; lower = 'sheep-'+label+'-lower'; foot = 'sheep-'+label+'-hoof'
    david_flock_bone_specs[upper] = ((x, .43, f), (x, .24, f+bend*.030), 'sheep-body')
    david_flock_bone_specs[lower] = ((x, .24, f+bend*.030), (x, .045, f+.006), upper)
    david_flock_bone_specs[foot] = ((x, .045, f+.006), (x, .025, f+.022), lower)
    david_flock_legs[label] = dict(x=x, f=f, bend=bend, hip=hip, knee=knee, ankle=ankle,
        upper=upper, lower=lower, foot=foot, offset=offset, l1=(knee-hip).length, l2=(ankle-knee).length)
for name, (head, tail, parent) in david_flock_bone_specs.items():
    b = david_flock_rig_data.edit_bones.new(name); b.head = xyz(*head); b.tail = xyz(*tail)
    if parent: b.parent = david_flock_rig_data.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT')
for pb in david_flock_rig.pose.bones: pb.rotation_mode = 'QUATERNION'


def david_flock_mesh_components(data):
    """Connected source components distinguish the torso from its separate neck."""
    neighbors = [set() for _ in data.vertices]
    for e in data.edges:
        a, b = e.vertices; neighbors[a].add(b); neighbors[b].add(a)
    unseen = set(range(len(data.vertices))); out = []
    while unseen:
        seed = unseen.pop(); stack = [seed]; component = [seed]
        while stack:
            for q in neighbors[stack.pop()]:
                if q in unseen: unseen.remove(q); component.append(q); stack.append(q)
        out.append(component)
    return out


def david_flock_weight(obj, names):
    for group in list(obj.vertex_groups): obj.vertex_groups.remove(group)
    groups = {n: obj.vertex_groups.new(name=n) for n in set(names)}
    indices = {n: [] for n in groups}
    for i, name in enumerate(names): indices[name].append(i)
    for name, ids in indices.items(): groups[name].add(ids, 1, 'REPLACE')


# Source meshes are copied in world rest coordinates, then skinned to this rig.
# The previous static finish joins by material, so source limb skin is replaced
# by real separately bending segments while its original hooves are retained.
for source in ewe_scene.objects:
    if source.type != 'MESH': continue
    mat_name = source.data.materials[0].name
    parent_name = source.parent.name if source.parent else ''
    if not parent_name and mat_name.startswith('ewe-face-and-legs'): continue
    obj = source.copy(); obj.data = source.data.copy(); obj.parent = None
    obj.name = 'david-flock-source-'+source.name
    obj.matrix_world = Matrix.Identity(4)
    david_flock_scene.collection.objects.link(obj)
    for v in obj.data.vertices: v.co = source.matrix_world@v.co
    if parent_name == 'ewe-head':
        names = ['sheep-head']*len(obj.data.vertices)
        # Close the authored tapered face's two small end loops.
        bm = bmesh.new(); bm.from_mesh(obj.data)
        edges = [e for e in bm.edges if e.is_boundary]
        if edges:
            bmesh.ops.holes_fill(bm, edges=edges, sides=64)
            bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
            bm.to_mesh(obj.data)
        bm.free()
    elif parent_name == 'ewe-tail':
        names = ['sheep-tail']*len(obj.data.vertices)
    elif mat_name.startswith('ewe-split-hooves'):
        names = []
        for v in obj.data.vertices:
            if v.co.z < .008: v.co.z = 0
            side = 'left' if v.co.x < 0 else 'right'
            fore = 'front' if -v.co.y > 0 else 'rear'
            names.append('sheep-'+fore+'-'+side+'-hoof')
    else:
        names = ['sheep-body']*len(obj.data.vertices)
        for ids in david_flock_mesh_components(obj.data):
            mean_front = sum(-obj.data.vertices[i].co.y for i in ids)/len(ids)
            if mean_front > .20:
                for i in ids: names[i] = 'sheep-neck'
    david_flock_weight(obj, names)

for label, leg in david_flock_legs.items():
    x, f, bend = leg['x'], leg['f'], leg['bend']
    tube('david-flock-'+label+'-upper-leg', [(x, .43, f), (x, .24, f+bend*.030)],
        [.043, .032], ewe_skin, bone=leg['upper'], sides=16)
    tube('david-flock-'+label+'-lower-leg-with-hock',
        [(x, .24, f+bend*.030), (x, .15, f+bend*.012), (x, .045, f+.006)],
        [.032, .021, .023], ewe_skin, bone=leg['lower'], sides=16)
    ellipsoid('david-flock-'+label+'-closed-knee', (x, .24, f+bend*.030),
        (.033, .034, .033), ewe_skin, bone=leg['lower'], seg=16, rows=10)

# One mesh per actual surface material; vertex-group bone assignments survive.
groups = {}
for obj in list(david_flock_scene.objects):
    if obj.type == 'MESH': groups.setdefault(obj.data.materials[0], []).append(obj)
for mat, objects in groups.items():
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects: obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]; bpy.ops.object.join()
    obj = bpy.context.object; obj.name = 'david-flock-sheep-'+mat.name
    mod = obj.modifiers.new('original-quadruped-deformation', 'ARMATURE'); mod.object = david_flock_rig
    obj.parent = david_flock_rig

david_flock_rest = {b.name: b.matrix_local.copy() for b in david_flock_rig_data.bones}


def david_flock_bone_target(name, new_head, new_tail):
    b = david_flock_rig_data.bones[name]
    q = (b.tail_local-b.head_local).rotation_difference(new_tail-new_head)
    return Matrix.Translation(new_head)@q.to_matrix().to_4x4()@Matrix.Translation(-b.head_local)@david_flock_rest[name]


def david_flock_step(t, leg):
    """A continuous stance trajectory cancels 0.2 m/s forward world travel."""
    p = (t/1.2-leg['offset']) % 1; duty = .75
    if p < duty:
        return .09-.24*p, 0.0, True
    q = (p-duty)/(1-duty)
    h00 = 2*q**3-3*q*q+1; h10 = q**3-2*q*q+q
    h01 = -2*q**3+3*q*q; h11 = q**3-q*q
    forward = h00*(-.09)+h10*(-.06)+h01*.09+h11*(-.06)
    return forward, .050*sin(pi*q)**2, False


def david_flock_pose(clip, t):
    bones = david_flock_rig.pose.bones
    body_z = (-.012+.0015*cos(2*pi*t/1.2*4)) if clip == 'Walk' else .0012*sin(2*pi*t/4) if clip == 'Idle' else 0
    body_transform = Matrix.Translation((0, 0, body_z))
    bones['sheep-body'].matrix = body_transform@david_flock_rest['sheep-body']
    bpy.context.view_layer.update()
    upper_targets = {}; lower_targets = {}; feet = {}
    for label, leg in david_flock_legs.items():
        forward, lift, stance = david_flock_step(t, leg) if clip == 'Walk' else (0, 0, True)
        hip = leg['hip']+Vector((0, 0, body_z))
        ankle = leg['ankle']+Vector((0, -forward, lift))
        delta = ankle-hip; distance = delta.length
        if not abs(leg['l1']-leg['l2']) < distance < leg['l1']+leg['l2']:
            raise RuntimeError('Unreachable original sheep foot target: '+label)
        u = delta/distance; perpendicular = Vector((0, -u.z, u.y))
        along = (leg['l1']**2-leg['l2']**2+distance**2)/(2*distance)
        offset = math.sqrt(max(0, leg['l1']**2-along**2))
        # +front is Blender -Y. Opposite stifle/knee bends stay explicit.
        knee = hip+u*along-perpendicular*(leg['bend']*offset)
        upper_targets[leg['upper']] = david_flock_bone_target(leg['upper'], hip, knee)
        lower_targets[leg['lower']] = david_flock_bone_target(leg['lower'], knee, ankle)
        feet[leg['foot']] = Matrix.Translation(ankle-leg['ankle'])@david_flock_rest[leg['foot']]
    for name, matrix in upper_targets.items(): bones[name].matrix = matrix
    bpy.context.view_layer.update()
    for name, matrix in lower_targets.items(): bones[name].matrix = matrix
    bpy.context.view_layer.update()
    for name, matrix in feet.items(): bones[name].matrix = matrix
    bpy.context.view_layer.update()
    if clip == 'Graze':
        q = min(t/1.25, (5-t)/1.25, 1); q = max(0, q); blend = q*q*(3-2*q)
        neck_angle = 1.80*blend; head_angle = -.60*blend+.012*sin(t*2*pi*1.6)*blend
    else:
        neck_angle = .007*sin(t*2*pi/(4 if clip == 'Idle' else 1.2))
        head_angle = .018*sin(t*2*pi/(4 if clip == 'Idle' else 1.2))
    neck_head = david_flock_rig_data.bones['sheep-neck'].head_local
    neck_transform = body_transform@Matrix.Translation(neck_head)@Matrix.Rotation(neck_angle, 4, 'X')@Matrix.Translation(-neck_head)
    bones['sheep-neck'].matrix = neck_transform@david_flock_rest['sheep-neck']
    bpy.context.view_layer.update()
    head_head = david_flock_rig_data.bones['sheep-head'].head_local
    bones['sheep-head'].matrix = neck_transform@Matrix.Translation(head_head)@Matrix.Rotation(head_angle, 4, 'X')@Matrix.Translation(-head_head)@david_flock_rest['sheep-head']
    tail_head = david_flock_rig_data.bones['sheep-tail'].head_local
    tail_period = 4 if clip == 'Idle' else 1.2 if clip == 'Walk' else 5
    bones['sheep-tail'].matrix = body_transform@Matrix.Translation(tail_head)@Matrix.Rotation(.10*sin(t*2*pi/tail_period*2), 4, 'Z')@Matrix.Translation(-tail_head)@david_flock_rest['sheep-tail']
    bpy.context.view_layer.update()


david_flock_actions = {}
for clip, seconds in [('Idle', 4), ('Walk', 1.2), ('Graze', 5)]:
    action = bpy.data.actions.new('david-flock-'+clip)
    david_flock_rig.animation_data_create(); david_flock_rig.animation_data.action = action
    for frame in range(1, round(seconds*30)+2):
        david_flock_scene.frame_set(frame)
        david_flock_pose(clip, (frame-1)/30)
        for pb in david_flock_rig.pose.bones:
            pb.keyframe_insert(data_path='location', frame=frame, group=pb.name)
            pb.keyframe_insert(data_path='rotation_quaternion', frame=frame, group=pb.name)
            pb.keyframe_insert(data_path='scale', frame=frame, group=pb.name)
    # The measured stance samples are linear, with no bezier overshoot below soil.
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for fc in bag.fcurves:
                    for key in fc.keyframe_points: key.interpolation = 'LINEAR'
    action.use_fake_user = True
    track = david_flock_rig.animation_data.nla_tracks.new(); track.name = clip
    strip = track.strips.new(clip, 1, action); strip.action_frame_start = 1; strip.action_frame_end = round(seconds*30)+1
    track.mute = True
    david_flock_actions[clip] = action

david_flock_rig.animation_data.action = None
for pb in david_flock_rig.pose.bones: pb.matrix_basis.identity()
david_flock_scene.frame_set(1)
david_flock_scene.frame_end = 151
david_flock_rig['original_source'] = 'scripts/blender/abraham-animals.py'
david_flock_rig['interpretation'] = 'Original life sheep; selected proportions, coat and gait, no identified biblical breed or flock'
david_flock_rig['walk_cycle_distance_m'] = .24
david_flock_rig['walk_cycle_seconds'] = 1.2
david_flock_rig['walk_forward_gltf_axis'] = '+Z'
david_flock_rig['walk_stance_fraction'] = .75
david_flock_rig['walk_root_motion'] = False
export_asset(david_flock_scene, 'david-flock-sheep', 'david-flock-sheep.glb', True)
report['assets']['david-flock-sheep'].update({
    'animations': ['Idle', 'Walk', 'Graze'], 'height': .750, 'teaching_model': True,
    'reused_original_source': 'scripts/blender/abraham-animals.py',
    'bones': 16, 'walk_cycle_seconds': 1.2, 'walk_cycle_distance_m': .24,
    'walk_speed_m_per_second': .20, 'walk_forward_gltf_axis': '+Z',
    'walk_stance_fraction': .75, 'walk_root_motion': False,
    'interpretation': 'Original animated life illustration; selected breed-neutral shape, gait and scale; not an identified biblical animal or selection ritual',
})
