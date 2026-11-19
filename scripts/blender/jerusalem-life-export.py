"""Package NEW Jerusalem-life assets only; staging is explicitly not release.

Consumes the reproducible geometry/motion drafts. No prior GLB, blend, manifest,
shared report, or runtime code is changed. Blender 4.5 LTS, ordinary glTF2 skins.
"""
import bpy,math,pathlib,json,sys,runpy,hashlib,struct,statistics
from mathutils import Vector,Matrix
ROOT=pathlib.Path(__file__).resolve().parents[2];M=runpy.run_path(str(ROOT/'scripts/blender/jerusalem-life-motion.py'));G=M['G'];QA=M['QA'];META=M['META'];OUT=M['OUT'];P=M['P'];FPS=M['FPS']

def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def xyzw(q):return [q.x,q.y,q.z,q.w]
def glb_doc(path):
 data=path.read_bytes();size=struct.unpack_from('<I',data,12)[0];return json.loads(data[20:20+size])
def to_gltf(v):return [v[0],v[2],-v[1]]

def remove_carry_lowerbody(action,keep):
 for layer in action.layers:
  for strip in layer.strips:
   for bag in strip.channelbags:
    for curve in list(bag.fcurves):
     if not any(curve.data_path.startswith('pose.bones["'+name+'"]') for name in keep):bag.fcurves.remove(curve)

def static_prop(scene,rig,role,meshname,filename):
 """Export the SAME evaluated mesh at its actor-local table/basin rest pose."""
 M['reset'](rig);bpy.context.view_layer.update();source=scene.objects[meshname];graph=bpy.context.evaluated_depsgraph_get();evaluated=source.evaluated_get(graph);mesh=bpy.data.meshes.new_from_object(evaluated,preserve_all_data_layers=True,depsgraph=graph);o=bpy.data.objects.new(filename,mesh);scene.collection.objects.link(o);o.matrix_world=source.matrix_world.copy();bpy.ops.object.select_all(action='DESELECT');o.select_set(True);path=OUT/(filename+'.glb');bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_animations=False,export_yup=True,export_extras=True);bounds=[o.matrix_world@v.co for v in o.data.vertices];bpy.data.objects.remove(o,do_unlink=True);return {'file':'models/jerusalem-life/'+path.name,'bytes':path.stat().st_size,'sha256':sha(path),'sourceMesh':meshname,'actorLocalBounds':{'minimum':[min(to_gltf(v)[i] for v in bounds) for i in range(3)],'maximum':[max(to_gltf(v)[i] for v in bounds) for i in range(3)]},'surfaceMinimumY':min(v.z for v in bounds)}

def portable_materials(scene):
 for o in scene.objects:
  if o.type!='MESH':continue
  for mat in o.data.materials:
   if not mat.use_nodes:continue
   mixes=[n for n in mat.node_tree.nodes if n.type=='MIX_RGB' and n.blend_type=='MULTIPLY']
   if not mixes:continue
   original=next(n.image for n in mat.node_tree.nodes if n.type=='TEX_IMAGE' and 'woven-colour' in n.image.name)
   image=G['tinted_fabric'](original,list(mat.diffuse_color),mat.name+'-portable-colour');tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image;bs=mat.node_tree.nodes.get('Principled BSDF');mat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])

def repair_tunic_cap(scene,rig,role):
    old=next(o for o in scene.objects if o.type=='MESH' and o.name.endswith('tunic-final'))
    if old.get('life_tunic_cap_revision',0)>=2:return
    material=old.data.materials[0];M['reset'](rig);bpy.context.view_layer.update();bpy.data.objects.remove(old,do_unlink=True);G['continuous_cloth'](scene,rig,{'tunic':material},role)


def weighted_counts(scene):
 counts={}
 for o in scene.objects:
  if o.type!='MESH':continue
  names={g.index:g.name for g in o.vertex_groups}
  for v in o.data.vertices:
   for g in v.groups:
    if g.weight>1e-5:counts[names[g.group]]=counts.get(names[g.group],0)+1
 return counts

def action_set(scene,rig,name,u):
 action=next(a for a in bpy.data.actions if a.name.endswith('-'+name));rig.animation_data.action=action;start,end=action.frame_range;frame=start+(end-start)*u;scene.frame_set(math.floor(frame),subframe=frame%1);bpy.context.view_layer.update()
def bone_snapshot(rig):return {b.name:b.matrix.copy() for b in rig.pose.bones}
def continuity(scene,rig,pairs):
 rows=[]
 for a,b in pairs:
  action_set(scene,rig,a,1);A=bone_snapshot(rig);action_set(scene,rig,b,0);B=bone_snapshot(rig);names=[n for n in A if not n.startswith(('lid','eye')) and n not in ['waterStream','propDipper','dipperGripL']]
  exclusions={'waterStream':'Invisible when not actively pouring; handoff has no rendered stream','propDipper':'Actor work prop / stationary scene proxy visibility handoff','dipperGripL':'Child marker of the same hidden dipper handoff'}
  rows.append({'from':a,'to':b,'maximum_joint_position_difference_m':max((A[n].translation-B[n].translation).length for n in names),'maximum_joint_angle_difference_rad':max(2*math.acos(min(1,abs(A[n].to_quaternion().normalized().dot(B[n].to_quaternion().normalized())))) for n in names),'scope':'Primary body, hands, jug and parcel; hidden station-proxy/stream helpers listed separately','excludedVisibilityHandoffs':exclusions})
 return rows

def grip_metadata(scene,rig,clips):
 # Socket coordinates are bone-local; GLTF conversion does not change a bone's
 # local axes. Relative wrist quaternions are sampled from authored poses.
 sockets={};pose=rig.pose.bones;bones=rig.data.bones
 for side in ['L','R']:
  grip=bones['handGrip'+side];hand=bones['hand'+side];relative=hand.matrix_local.inverted()@grip.matrix_local
  sockets[side]={'handBone':'hand'+side,'socketBone':grip.name,'offsetBoneLocal':list(relative.translation),'socketQuaternionBoneLocal':xyzw(relative.to_quaternion()),'maximumRuntimeWristCorrectionRadians':math.radians(22)}
 for name,c in clips.items():
  if not c.get('handContact'):continue
  orientation={side:[] for side in c['handContact']}
  for i in range(21):
   u=i/20;action_set(scene,rig,name,u)
   for side in orientation:
    target=('jugGripR' if side=='R' else 'dipperGripL') if 'jugGripR' in pose else 'parcelGrip'+side
    q=pose[target].matrix.to_quaternion().inverted()@pose['hand'+side].matrix.to_quaternion();orientation[side].append([u,xyzw(q)])
  c['gripOrientationSamples']=orientation
 return sockets

def authored_contacts(name,spec):
    """Stable support states from authored foot trajectories, not Y noise."""
    if name in ['Walk','StairUp','StairDown']:return P['WALK_CONTACT']
    if name.startswith('Turn'):
        steps=4 if '180' in name else 2;lead='L' if 'Left' in name else 'R'
        def label(u,side):
            segment=min(steps-1,int(u*steps));q=u*steps-segment;moving=lead if segment%2==0 else ('R' if lead=='L' else 'L');return 'swing' if side==moving and .015<q<.985 else 'flat'
    elif name.startswith(('StartWalk','StopWalk')):
        starting=name.startswith('Start');lead='R' if name.endswith('R') else 'L';moving=lead if starting else ('L' if lead=='R' else 'R')
        def label(u,side):
            if side==moving:
                if starting:return 'flat' if u<=.07 or u>=.91 else 'swing'
                return 'flat' if u>=.91 else 'swing'
            return 'flat' if not starting or u<.96 else P['contact_label'](spec['exitPhase'],side)
    else:return {s:[[0,1,'flat']] for s in ['L','R']}
    out={}
    for side in ['L','R']:
        rows=[];last=None
        for i in range(2001):
            u=i/2000;current=label(u,side)
            if current!=last:
                if rows:rows[-1][1]=u
                rows.append([u,1,current]);last=current
        out[side]=rows
    return out


def export_role(role,status):
 source=QA/(role+'-motion-draft.blend');draft=json.loads((QA/(role+'-motion-draft.json')).read_text());bpy.ops.wm.open_mainfile(filepath=str(source));scene=bpy.context.scene;rig=next(o for o in scene.objects if o.type=='ARMATURE');portable_materials(scene);repair_tunic_cap(scene,rig,role);G['weight_shoulder_yoke'](scene,rig);c=M['config'](scene,rig,role);m=M['new_motion'](c,{});clips=draft['clips'];names=list(clips)
 for track in rig.animation_data.nla_tracks:track.mute=True
 if 'CarrySmall' in clips:
  action=next(a for a in bpy.data.actions if a.name.endswith('-CarrySmall'));remove_carry_lowerbody(action,M['CARRY_BONES']);clips['CarrySmall']['carryBones']=M['CARRY_BONES'];clips['CarrySmall']['trackScope']='upper-body and propParcel only; layer over distance-driven Walk'
 for name,spec in clips.items():
  spec['angleRadians']=spec['angle'];spec['contacts']=authored_contacts(name,spec);spec['contactMethod']='Known captured support phases for gait/stairs; authored moving/support-foot windows for transitions/turns. Raw sampled sole heights remain independent collision evidence.'
 handSockets=grip_metadata(scene,rig,clips);pairs=[('Receive','CarrySmall'),('CarrySmall','PlaceSmall')] if role=='resident' else [('SetDown','Fill'),('Fill','PickUp'),('PickUp','Idle')] if role=='carrier' and 'SetDown'in clips else [];links=continuity(scene,rig,pairs)
 rig.animation_data.action=None;M['base_pose'](scene,rig,m,0,0);scene.frame_set(1);bpy.context.view_layer.update();static={}
 if role=='resident':static['parcel']=static_prop(scene,rig,role,'household-parcel','parcel-rest')
 if role=='elder':static['goods']=static_prop(scene,rig,role,'vendor-small-goods','vendor-rest')
 if role=='carrier':static['dipper']=static_prop(scene,rig,role,'carrier-dipper','dipper-rest')
 M['base_pose'](scene,rig,m,0,0);rig.animation_data.action=None;scene.frame_set(1);rig['motion_version']=4;rig['asset_status']=status;rig['capture_source']='CMU07_04' if role=='elder' else 'CMU07_01';rig['cycle_distance_m']=m.distance;rig['cycle_seconds']=clips['Walk']['duration'];rig['base_model_id']='jerusalem-'+role
 bpy.ops.object.select_all(action='DESELECT')
 for o in scene.objects:
  if o.type in ['MESH','ARMATURE','EMPTY']:o.select_set(True)
 for track in rig.animation_data.nla_tracks:track.mute=False
 path=OUT/(role+'.glb');bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,use_active_scene=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_nla_strips=True,export_force_sampling=True,export_anim_slide_to_zero=True,export_skins=True,export_yup=True,export_apply=False,export_extras=True)
 for track in rig.animation_data.nla_tracks:track.mute=True
 rig.animation_data.action=None;M['base_pose'](scene,rig,m,0,0);scene.frame_set(1);bpy.context.preferences.filepaths.save_version=0;blend=META/(role+'.blend');bpy.ops.wm.save_as_mainfile(filepath=str(blend),compress=True)
 assert max(path.stat().st_size,blend.stat().st_size)<32*1024*1024
 doc=glb_doc(path);exportnames=[a['name'] for a in doc.get('animations',[])];assert set(exportnames)==set(names),(exportnames,names)
 attention={'eyes':['eyeL','eyeR'],'lids':['lidL','lidR'],'lowerLids':['lidLowerL','lidLowerR'],'jaw':'jaw','jawMaximumOpenRadians':.055,'jawNotes':'Small weighted jaw opening; no phoneme lip synchronization. Runtime speech state owns playback.','lid_close_displacement_bone_local':{s:list(rig.data.bones['lid'+s].matrix_local.to_3x3().inverted()@Vector((0,0,-.008))) for s in ['L','R']},'eye_close_scale_bone_local':[1,1,.07],'notes':'No baked blink cycle; runtime owns gaze/blink timing.'}
 prop={'parcel':{'id':'household-parcel' if role=='resident' else 'vendor-small-goods','bone':'propParcel','mesh':'household-parcel' if role=='resident' else 'vendor-small-goods','tableOriginLocal':[0,.757,.45],'tableCentreLocal':[0,.772,.45],'reachTargetLocal':[0,.75,.45],'tableSurfaceY':.75,'carriedOriginLocal':[0,.935,.235],'gripBones':{'L':'parcelGripL','R':'parcelGripR'},'visibilityOwner':'runtime activity/carriedItem, not clip alone','stationaryClips':['Inspect','Listen','Arrange','Offer'],'carryBones':M['CARRY_BONES']}}
 if role=='carrier':prop['jug']={'id':'water-jug','bone':'propJug','meshes':['carrier-jug','carrier-jug-handle','jug-water'],'gripBone':'jugGripR','handSocket':'handGripR','localGroundAnchor':[.28,0,.40],'mouthHeight':.39,'independentOfTorso':True,'pourTargetLocal':[.24,.52,.45]}
 meta={'schema_version':4,'id':'jerusalem-life-'+role,'baseModelId':'jerusalem-'+role,'file':'models/jerusalem-life/'+role+'.glb','status':status,'bytes':path.stat().st_size,'sha256':sha(path),'height_m':1.71,'ankle_height_m':statistics.mean(c['toe'][s]['ankle'].z for s in ['L','R']),'motion_version':4,'motionProfile':role,'cycle_distance_m':m.distance,'cycle_seconds':clips['Walk']['duration'],'walkEntryPhase':.14,'startDistanceFraction':.25,'startDuration':.8,'stopDuration':.9,'turnDuration':1.45,'walkContact':clips['Walk']['contacts'],'clipContacts':{n:d['contacts'] for n,d in clips.items()},'lifeClips':{n:{k:v for k,v in d.items() if k not in ['samples','authored_samples']} for n,d in clips.items()},'clips':clips,'handSockets':handSockets,'gripOrientationConvention':'XYZW, targetSocketWorldQuaternion inverse multiplied by handBoneWorldQuaternion; targetWorld * sample = handBoneWorld; multiply socketQuaternionBoneLocal for handGripWorld. Verified against actual GLB Three.js sampling.','props':prop,'staticProps':static,'attention':attention,'secondaryCloth':{'excludeBones':['hemL','hemR'],'maxAngle':.02},'bones':list(rig.data.bones.keys()),'weighted_vertices':weighted_counts(scene),'animations':exportnames,'continuity':links,'editable_source':{'file':str(blend.relative_to(ROOT)),'bytes':blend.stat().st_size,'sha256':sha(blend)},'geometry_source_sha256':sha(QA/(role+'-geometry.blend')),'original_pilot_source_sha256':sha(ROOT/'assets/blender/jerusalem-pilot.blend'),'limits':['Draft staging is not accepted/released and must not be published before visual/continuous geometry gates.','Adult CMU recording is retargeted; carrier and older character are authored role adaptations, not a captured carrier or elder.','Work geometry, object handling and planted turns are authored with recorded motion reference/timing; not captured ancient activity.','Layered authored cloth deformation has 2mm tunic/3mm mantle shells; not fabric simulation.']}
 (META/(role+'-motion.json')).write_text(json.dumps(meta,indent=2)+'\n');print('LIFE_EXPORTED',role,status,path.stat().st_size,blend.stat().st_size,sha(path),flush=True)

def main():
 args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [];roles=args[args.index('--roles')+1].split(',') if '--roles' in args else ['resident','carrier','elder'];status=args[args.index('--status')+1] if '--status'in args else 'staging-incomplete-not-for-publication';OUT.mkdir(exist_ok=True,parents=True);META.mkdir(exist_ok=True,parents=True)
 for role in roles:export_role(role,status)
if __name__=='__main__':main()
