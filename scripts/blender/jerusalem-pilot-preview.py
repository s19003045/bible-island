"""Render isolated pilot gait review frames and measure evaluated sole geometry."""
import bpy, pathlib, json, math, sys
from mathutils import Vector
ROOT=pathlib.Path(__file__).resolve().parents[2]
OUT=ROOT/'.qa/jerusalem-pilot';OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'assets/blender/jerusalem-pilot.blend'))
report={}
for role in ['resident','carrier','elder']:
    scene=next(s for s in bpy.data.scenes if s.name=='Jerusalem pilot — '+role);bpy.context.window.scene=scene
    rig=next(o for o in scene.objects if o.type=='ARMATURE');track=next(t for t in rig.animation_data.nla_tracks if t.name=='Walk')
    for t in rig.animation_data.nla_tracks:t.mute=True
    rig.animation_data.action=track.strips[0].action
    loop_poses=[]
    for frame in [1,track.strips[0].action_frame_end]:
        scene.frame_set(int(frame));deps=bpy.context.evaluated_depsgraph_get();deps.update()
        evaluated=rig.evaluated_get(deps)
        loop_poses.append({bone.name:bone.matrix.copy() for bone in evaluated.pose.bones})
    loop_position=max((loop_poses[0][name].translation-loop_poses[1][name].translation).length for name in loop_poses[0])
    loop_angle=max(loop_poses[0][name].to_quaternion().rotation_difference(loop_poses[1][name].to_quaternion()).angle for name in loop_poses[0])
    footmeshes=[]
    for obj in scene.objects:
        if obj.type!='MESH':continue
        g={x.index:x.name for x in obj.vertex_groups}
        ids=[v.index for v in obj.data.vertices if sum(x.weight for x in v.groups if g[x.group] in ['footL','footR','toeL','toeR'])>.999]
        if ids:footmeshes.append((obj,ids))
    samples=[]
    for i in range(121):
        frame=1+(track.strips[0].action_frame_end-1)*i/120;scene.frame_set(math.floor(frame),subframe=frame%1)
        deps=bpy.context.evaluated_depsgraph_get();low=100
        for obj,ids in footmeshes:
            mesh=obj.evaluated_get(deps).to_mesh()
            low=min(low,min(mesh.vertices[j].co.z for j in ids));obj.evaluated_get(deps).to_mesh_clear()
        samples.append({'phase':i/120,'lowest_sole_m':low})
    counts={name:0 for name in rig.data.bones.keys()}
    for obj in scene.objects:
        if obj.type!='MESH':continue
        names={g.index:g.name for g in obj.vertex_groups}
        for vertex in obj.data.vertices:
            for g in vertex.groups:
                if g.weight>1e-5 and names[g.group] in counts:counts[names[g.group]]+=1
    report[role]={'minimum_sole_m':min(s['lowest_sole_m'] for s in samples),'loop_max_joint_position_difference_m':loop_position,'loop_max_joint_angle_difference_rad':loop_angle,'weighted_vertices':counts,'samples':samples}
    if '--check-only' in sys.argv:
        print('PILOT_REVIEW',role,report[role]['minimum_sole_m'],flush=True)
        continue
    # Soft studio lighting preserves original materials and physical proportions.
    world=bpy.data.worlds.new('pilot-review-world-'+role);world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.33,.37,.41,1);world.node_tree.nodes['Background'].inputs[1].default_value=.5;scene.world=world
    for pos,power,size in [((2,-3,4),500,4),((-3,-1,2),170,3),((1,3,3),260,3)]:
        data=bpy.data.lights.new('review-softbox','AREA');data.energy=power;data.shape='DISK';data.size=size;o=bpy.data.objects.new('review-softbox',data);scene.collection.objects.link(o);o.location=pos;o.rotation_euler=(Vector((0,0,.8))-o.location).to_track_quat('-Z','Y').to_euler()
    plane_mesh=bpy.data.meshes.new('review-floor');plane_mesh.from_pydata([(-5,-5,-.002),(5,-5,-.002),(5,5,-.002),(-5,5,-.002)],[],[(0,1,2,3)]);floor=bpy.data.objects.new('review-floor',plane_mesh);scene.collection.objects.link(floor)
    mat=bpy.data.materials.new('review-sand');mat.diffuse_color=(.27,.24,.19,1);floor.data.materials.append(mat)
    data=bpy.data.cameras.new('review-camera');camera=bpy.data.objects.new('review-camera',data);scene.collection.objects.link(camera);scene.camera=camera;data.type='ORTHO';data.ortho_scale=2.05
    scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
    scene.render.resolution_x=420;scene.render.resolution_y=560;scene.render.resolution_percentage=100
    scene.view_settings.view_transform='AgX';scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False
    for view,pos in [('front',(0,-4,1.12)),('side',(4,-.2,1.12))]:
        camera.location=pos;camera.rotation_euler=(Vector((0,0,.86))-camera.location).to_track_quat('-Z','Y').to_euler()
        for phase in [.0,.25,.5,.75]:
            frame=1+(track.strips[0].action_frame_end-1)*phase;scene.frame_set(math.floor(frame),subframe=frame%1)
            scene.render.filepath=str(OUT/(role+'-'+view+'-'+str(round(phase*100))+'.png'));bpy.ops.render.render(write_still=True)
    print('PILOT_REVIEW',role,report[role]['minimum_sole_m'],flush=True)
(OUT/'sole-check.json').write_text(json.dumps(report,indent=2)+'\n')
