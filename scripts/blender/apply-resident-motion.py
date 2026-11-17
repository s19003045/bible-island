"""Stage a motion-only upgrade of selected original character scenes.

blender --background --python scripts/blender/apply-resident-motion.py -- --out .qa/motion-integrated
Never overwrites the official blend, report or GLBs. Review the staged files first.
Original gestures are sampled in seconds before converting Euler rigs to quaternion.
"""
import bpy, json, pathlib, struct, hashlib, sys, math
from mathutils import Quaternion

ROOT=pathlib.Path(__file__).resolve().parents[2]
module={};path=ROOT/'scripts/blender/resident-motion-upgrade.py';exec(compile(path.read_text(),str(path),'exec'),module)

def restore_pose(rig):
    for bone in rig.pose.bones:
        bone.location=(0,0,0);bone.rotation_euler=(0,0,0);bone.rotation_quaternion=(1,0,0,0);bone.scale=(1,1,1)

def sample_originals(scene,rig):
    fps=scene.render.fps/scene.render.fps_base;data={}
    tracks=list(rig.animation_data.nla_tracks)
    for track in tracks:track.mute=True
    rig.animation_data.action=None
    for name in ['Idle','Interact','LookAround','Talk']:
        track=next(t for t in tracks if t.name==name);strip=track.strips[0];action=strip.action
        start,end=strip.action_frame_start,strip.action_frame_end;seconds=(end-start)/fps;count=round(seconds*60)
        restore_pose(rig);rig.animation_data.action=action;frames=[]
        for i in range(count+1):
            f=start+(end-start)*i/count;scene.frame_set(math.floor(f),subframe=f%1);bpy.context.view_layer.update()
            frames.append({bone.name:(tuple(bone.location),tuple(bone.matrix_basis.to_quaternion()),tuple(bone.scale)) for bone in rig.pose.bones})
        data[name]={'duration_s':seconds,'sample_fps':60,'frames':frames}
    rig.animation_data.action=None;restore_pose(rig);return data

def add_originals(scene,rig,originals):
    for name,original in originals.items():
        action=bpy.data.actions.new('MotionV2-original-'+name);action.use_fake_user=True;rig.animation_data.action=action;previous={}
        for i,frame in enumerate(original['frames']):
            sample_frame=1+i*scene.render.fps/original['sample_fps'];scene.frame_set(math.floor(sample_frame),subframe=sample_frame%1)
            for name_bone,(location,rotation,scale) in frame.items():
                bone=rig.pose.bones[name_bone];q=Quaternion(rotation)
                if name_bone in previous and q.dot(previous[name_bone])<0:q.negate()
                previous[name_bone]=q.copy();bone.location=location;bone.rotation_quaternion=q;bone.scale=scale
                bone.keyframe_insert(data_path='location',frame=1+i*scene.render.fps/original['sample_fps']);bone.keyframe_insert(data_path='rotation_quaternion',frame=1+i*scene.render.fps/original['sample_fps']);bone.keyframe_insert(data_path='scale',frame=1+i*scene.render.fps/original['sample_fps'])
        for layer in action.layers:
            for strip in layer.strips:
                for bag in getattr(strip,'channelbags',[]):
                    for curve in bag.fcurves:
                        for key in curve.keyframe_points:key.interpolation='LINEAR'
        track=rig.animation_data.nla_tracks.new();track.name=name;strip=track.strips.new(name,1,action);strip.action_frame_start=1;strip.action_frame_end=1+(len(original['frames'])-1)*scene.render.fps/original['sample_fps'];track.mute=True;rig.animation_data.action=None

# Actual barefoot-support reach diagnosis: constant new5 pelvis lowering, no rest edit.
MOTION_PELVIS_HEIGHT_BIAS_METRES={'ordinary-priest': -0.0057, 'brick-laborer': -0.0057, 'priest-bearer': -0.0057, 'egypt-grain-worker': -0.0057, 'egypt-householder': -0.0056}

def upgrade_character(scene,rig,asset_id):
    originals=sample_originals(scene,rig)
    for bone in rig.pose.bones:bone.rotation_mode='QUATERNION'
    restore_pose(rig);bpy.context.view_layer.update()
    carrying=asset_id in ['resident-carrier','priest-bearer']
    bias=MOTION_PELVIS_HEIGHT_BIAS_METRES.get(asset_id,0.)
    motion=module['bake_resident_motion'](scene,rig,carrying=carrying,pelvis_height_bias_m=bias,sampling_fps=120 if bias else 60);add_originals(scene,rig,originals)
    motion['pelvis_height_bias_reason']='Measured barefoot support shape: 120Hz reach solve with2mm flex reserve; fixed bias on new5 only.' if bias else 'No adaptation required.'
    restore_pose(rig);scene.frame_set(1);bpy.context.view_layer.update();rig['motion_version']=2;rig['cycle_distance_m']=motion['cycle_distance_m']
    motion['original_gesture_duration_seconds']={name:item['duration_s'] for name,item in originals.items()}
    return motion

def main():
    args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
    if '--out' not in args:raise ValueError('An isolated --out directory is required')
    OUT=(ROOT/args[args.index('--out')+1]).resolve();OUT.mkdir(parents=True,exist_ok=True)
    ids=args[args.index('--ids')+1].split(',') if '--ids' in args else ['resident','resident-worker','resident-child','resident-carrier']
    SOURCE=ROOT/'assets/blender/bible-assets.blend'
    report=json.loads((ROOT/'assets/blender/build-report.json').read_text())
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE));bpy.context.preferences.filepaths.save_version=0
    result={'source_sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'module_sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'characters':{}}
    for asset_id in ids:
        definition=report['assets'][asset_id];binary=(ROOT/'public'/definition['file']).read_bytes()
        document=json.loads(binary[20:20+struct.unpack_from('<I',binary,12)[0]])
        root_names=[document['nodes'][i]['name'] for i in document['scenes'][0]['nodes']]
        rig=next(o for o in bpy.data.objects if o.type=='ARMATURE' and o.name in root_names)
        scene=next(s for s in bpy.data.scenes if rig.name in s.objects);bpy.context.window.scene=scene
        motion=upgrade_character(scene,rig,asset_id)
        bpy.ops.object.select_all(action='DESELECT')
        for o in scene.objects:
            if o.type in ['MESH','ARMATURE','EMPTY']:o.select_set(True)
        for track in rig.animation_data.nla_tracks:track.mute=False
        destination=OUT/pathlib.Path(definition['file']).name
        bpy.ops.export_scene.gltf(filepath=str(destination),export_format='GLB',use_selection=True,use_active_scene=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_nla_strips=True,export_force_sampling=True,export_anim_slide_to_zero=True,export_skins=True,export_yup=True,export_apply=False,export_extras=True)
        for track in rig.animation_data.nla_tracks:track.mute=True
        rig.animation_data.action=None;restore_pose(rig);scene.frame_set(1);bpy.context.view_layer.update()
        definition.update({'bytes':destination.stat().st_size,'sha256':hashlib.sha256(destination.read_bytes()).hexdigest(),'animations':[t.name for t in rig.animation_data.nla_tracks],'motion_version':2,'motion_sample_fps':motion['sampling_fps'],'pelvis_height_bias_m':motion['pelvis_height_bias_m'],'cycle_distance_m':motion['cycle_distance_m'],'cycle_seconds':1.2})
        result['characters'][asset_id]={'file':str(destination),'motion_version':2,'motion_sample_fps':motion['sampling_fps'],'pelvis_height_bias_m':motion['pelvis_height_bias_m'],'cycle_distance_m':motion['cycle_distance_m'],'original_gesture_duration_seconds':motion['original_gesture_duration_seconds'],'animation_names':definition['animations'],'carrying':motion['carrying_right_bind_grasp_preserved']}
        (OUT/(asset_id+'-motion-contract.json')).write_text(json.dumps(motion,indent=2)+'\n')
        print('MOTION_CHARACTER_STAGED',asset_id,definition['bytes'],flush=True)

    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'bible-assets.blend'),compress=True)
    (OUT/'build-report.json').write_text(json.dumps(report,indent=2)+'\n')
    (OUT/'integration-report.json').write_text(json.dumps(result,indent=2)+'\n')
    print('MOTION_UPGRADE_STAGED',len(ids),str(OUT),flush=True)

if __name__=='__main__':main()
