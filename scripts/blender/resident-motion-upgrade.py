"""Original adult motion prototype. Import defines helpers only; never builds/exports.

17-bone hierarchy and geometry stay unchanged. Foot is one rigid bone: heel/flat/toe
roll uses actual skinned sandal support vertices, not a fictitious toe joint.
All clips are in-place. The consumer applies the supplied external root curve once.
Validated target initially: one 1.71 m composite resident on a level ground plane.
"""
import math
from mathutils import Vector, Matrix, Quaternion

MOTION_FPS=60
MOTION_CYCLE_SECONDS=1.2
MOTION_CYCLE_DISTANCE_METRES=.9

def motion_smooth(x):
    x=max(0.,min(1.,x));return x*x*(3.-2.*x)

def motion_mix(a,b,u):return a+(b-a)*u

def motion_pitch(phase):
    p=phase%1
    if p<.08:return math.radians(-10)*(1-motion_smooth(p/.08))
    if p<.43:return 0.
    if p<.60:return math.radians(14)*motion_smooth((p-.43)/.17)
    u=(p-.60)/.40
    # Leave toe support smoothly, recover the sole, and arrive heel first.
    if u<.32:return motion_mix(math.radians(14),math.radians(-3),motion_smooth(u/.32))
    return motion_mix(math.radians(-3),math.radians(-10),motion_smooth((u-.32)/.68))

def motion_walk_foot(phase,scale):
    p=phase%1
    if p<.60:
        f=(.27-.90*p)*scale;lift=0.
        contact='heel' if p<.08 else 'flat' if p<.43 else 'toe'
        return f,lift,motion_pitch(p),contact,p
    u=(p-.60)/.40
    # Cubic Hermite reaches the next stroke with the same -.90/cycle velocity.
    h00=2*u**3-3*u*u+1;h10=u**3-2*u*u+u;h01=-2*u**3+3*u*u;h11=u**3-u*u
    f=(h00*(-.27)+h10*(-.36)+h01*(.27)+h11*(-.36))*scale
    lift=.065*scale*math.sin(math.pi*u)**2
    return f,lift,motion_pitch(p),'swing',p

def motion_walk_body(phase,scale):
    a=2*math.pi*phase
    return {'height_offset':(-.026-.019*math.cos(2*a))*scale,'lateral':-.018*scale*math.sin(a),'pelvis_yaw':.035*math.sin(a),'pelvis_roll':.012*math.sin(a),'shoulder_yaw':-.030*math.sin(a),'lean':.018,'arms':.18*math.cos(a),'elbow':-.10,'head_yaw':-.010*math.sin(a),'head_pitch':.006*math.cos(2*a)}

def motion_neutral_body(scale=1):return {'height_offset':-.003*scale,'lateral':0.,'pelvis_yaw':0.,'pelvis_roll':0.,'shoulder_yaw':0.,'lean':.008,'arms':0.,'elbow':-.075,'head_yaw':0.,'head_pitch':0.}

def motion_blend_body(a,b,t):return {k:motion_mix(a[k],b[k],t) for k in a}

def motion_spec(clip,t,scale):
    """External root/facing and world-space flat-foot origins before body removal."""
    T=MOTION_CYCLE_SECONDS;v=MOTION_CYCLE_DISTANCE_METRES/T*scale
    if clip=='Walk':
        p=t/T;root_f=v*t;feet={}
        for side,phase in [('L',p),('R',p+.5)]:
            f,h,pitch,c,ph=motion_walk_foot(phase,scale);feet[side]={'flat_f':root_f+f,'lift':h,'pitch':pitch,'yaw':0.,'contact':c,'phase':ph}
        return root_f,0.,motion_walk_body(p,scale),feet
    if clip=='StartWalk':
        u=t/.6;root_f=v*.6*(u**3-.5*u**4);target=.45*scale;feet={}
        if u<.20:
            lf=0.;lh=0.;lp=math.radians(12)*motion_smooth(u/.20);lc='toe' if u>0 else 'flat'
        elif u<.90:
            w=(u-.20)/.70;lf=target*motion_smooth(w);lh=.065*scale*math.sin(math.pi*w)**2
            lp=motion_mix(math.radians(12),math.radians(-10),motion_smooth(w));lc='swing'
        else:
            lf=target;lh=0.;lp=motion_pitch(.05*(u-.90)/.10);lc='heel'
        rp=motion_pitch(.55)*motion_smooth((u-.55)/.45)
        feet['L']={'flat_f':lf,'lift':lh,'pitch':lp,'yaw':0.,'contact':lc,'phase':None}
        feet['R']={'flat_f':0.,'lift':0.,'pitch':rp,'yaw':0.,'contact':'toe' if u>.55 else 'flat','phase':None}
        body=motion_blend_body(motion_neutral_body(scale),motion_walk_body(.05,scale),motion_smooth(u))
        body['lateral']+=.012*scale*math.sin(math.pi*u)
        return root_f,0.,body,feet
    if clip=='StopWalk':
        u=t/.6;root_f=v*.6*(u-u**3+.5*u**4);target=.225*scale;feet={}
        lp=motion_pitch(.05)*(1-motion_smooth(u/.30));feet['L']={'flat_f':target,'lift':0.,'pitch':lp,'yaw':0.,'contact':'heel' if u<.30 else 'flat','phase':None}
        if u<.10:
            rf=-target;rh=0.;rp=motion_mix(motion_pitch(.55),math.radians(14),motion_smooth(u/.10));rc='toe'
        elif u<.90:
            w=(u-.10)/.80;rf=motion_mix(-target,target,motion_smooth(w));rh=.060*scale*math.sin(math.pi*w)**2;rp=motion_mix(math.radians(14),math.radians(-7),motion_smooth(w));rc='swing'
        else:
            rf=target;rh=0.;rp=math.radians(-7)*(1-motion_smooth((u-.90)/.10));rc='heel' if u<1 else 'flat'
        feet['R']={'flat_f':rf,'lift':rh,'pitch':rp,'yaw':0.,'contact':rc,'phase':None}
        body=motion_blend_body(motion_walk_body(.05,scale),motion_neutral_body(scale),motion_smooth(u));body['lateral']-=.012*scale*math.sin(math.pi*u)
        return root_f,0.,body,feet
    if clip in ['TurnLeft','TurnRight']:
        u=t/1.2;direction=1 if clip=='TurnRight' else -1;angle=direction*math.pi/4;root_yaw=angle*motion_smooth((u-.12)/.76)
        first='R' if direction==1 else 'L';feet={}
        for side in ['L','R']:
            a,b=(.14,.46) if side==first else (.55,.87);w=max(0,min(1,(u-a)/(b-a)));yaw=angle*motion_smooth(w)
            feet[side]={'flat_f':0.,'lift':.035*scale*math.sin(math.pi*w)**2 if a<u<b else 0.,'pitch':math.radians(-5)*math.sin(2*math.pi*w) if a<u<b else 0.,'yaw':yaw,'contact':'swing' if a<u<b else 'flat','phase':None,'turn_flat_center':True}
        body=motion_neutral_body(scale);body['height_offset']-=.012*scale*math.sin(math.pi*u)**2;body['lateral']=-direction*.017*scale*math.sin(2*math.pi*u);body['pelvis_yaw']=-direction*.025*math.sin(math.pi*u);body['shoulder_yaw']=direction*.035*math.sin(math.pi*u);body['head_yaw']=direction*.08*math.sin(math.pi*u);body['elbow']=-.075-.025*math.sin(math.pi*u)
        return 0.,root_yaw,body,feet
    raise ValueError(clip)

def motion_rest_foot_points(scene,rig,side):
    name='foot'+side;out=[]
    for o in scene.objects:
        if o.type!='MESH' or not o.vertex_groups.get(name):continue
        i=o.vertex_groups[name].index
        for v in o.data.vertices:
            if any(g.group==i and g.weight>.99999 for g in v.groups):out.append(o.matrix_world@v.co)
    if not out:raise ValueError('No rigid foot support vertices '+name)
    return out

def motion_roll_target(rig,side,points,spec,root_f,root_yaw,scale):
    ankle=rig.data.bones['foot'+side].head_local.copy();C=Vector((ankle.x,ankle.y,0));R=Matrix.Rotation(spec['pitch'],3,'X')
    mn=min((R@(p-C)).z for p in points);pv=[p for p in points if abs((R@(p-C)).z-mn)<1e-7];K=sum(pv,Vector())/len(pv)
    yaw=spec['yaw'];Y=Matrix.Rotation(yaw,3,'Z');center=Vector((C.x,-spec['flat_f'],0))
    if spec.get('turn_flat_center'):center=Y@C
    contact=center+Y@Vector((K.x-C.x,K.y-C.y,0))
    Aw=contact+Y@(R@(ankle-K))+Vector((0,0,spec['lift']))
    inverse=Matrix.Rotation(-root_yaw,3,'Z');local=inverse@(Aw-Vector((0,-root_f,0)));localR=inverse@Y@R
    weight=0. if spec['contact']=='swing' else 1.
    if spec['phase'] is not None:
        p=spec['phase'];weight=motion_smooth(p/.08) if p<.08 else 1-motion_smooth((p-.43)/.17) if .43<=p<.60 else weight
    return local,localR,{'kinematic_IK_contact_weight_not_ground_force':weight,'contact_world_blender_xyz_m':list(contact),'flat_reference_world_blender_xyz_m':list(center),'pivot_rest_blender_xyz_m':list(K),'pitch_radians':spec['pitch'],'foot_world_yaw_radians':yaw,'support_vertex_count':len(pv),'selected_support_rest_min_z_m':min(p.z for p in pv),'contact':spec['contact'],'phase':spec['phase'],'desired_clearance_m':spec['lift']}

def motion_set_world(rig,name,position,rotation):
    b=rig.data.bones[name];rig.pose.bones[name].matrix=Matrix.Translation(position)@rotation.to_4x4()@b.matrix_local.to_quaternion().to_matrix().to_4x4()

def motion_parent_head(rig,name):
    b=rig.data.bones[name]
    return (rig.pose.bones[b.parent.name].matrix@b.parent.matrix_local.inverted())@b.head_local if b.parent else b.head_local.copy()

def motion_pose(scene,rig,clip,t,foot_points,scale,carrying=False,pelvis_height_bias_m=0.):
    root_f,yaw,body,spec=motion_spec(clip,t,scale)
    body['height_offset']+=pelvis_height_bias_m
    for b in rig.pose.bones:b.rotation_mode='QUATERNION';b.location=(0,0,0);b.rotation_quaternion=(1,0,0,0);b.scale=(1,1,1)
    hip=rig.data.bones['hips'].head_local+Vector((body['lateral'],0,body['height_offset']))
    Rh=Matrix.Rotation(body['pelvis_yaw'],3,'Z')@Matrix.Rotation(body['pelvis_roll'],3,'Y')@Matrix.Rotation(.006,3,'X')
    motion_set_world(rig,'hips',hip,Rh);bpy_update=__import__('bpy').context.view_layer.update;bpy_update()
    Rs=Matrix.Rotation(body['shoulder_yaw'],3,'Z')@Matrix.Rotation(body['lean'],3,'X')
    motion_set_world(rig,'spine',motion_parent_head(rig,'spine'),Rs);bpy_update()
    motion_set_world(rig,'neck',motion_parent_head(rig,'neck'),Rs);bpy_update()
    H=Matrix.Rotation(body['head_yaw'],3,'Z')@Matrix.Rotation(body['head_pitch'],3,'X')
    motion_set_world(rig,'head',motion_parent_head(rig,'head'),H);bpy_update()
    for side,sign in [('L',1),('R',-1)]:
        if carrying and side=='R':
            # Right chain stays at its original local bind grasp. Parent spine
            # provides gentle body motion; no new swinging arm,elbow or hand.
            continue
        for name,angle in [('arm'+side,sign*body['arms']),('forearm'+side,sign*body['arms']+body['elbow']),('hand'+side,sign*body['arms']+body['elbow']-.015)]:
            R=Matrix.Rotation(body['shoulder_yaw']*.5,3,'Z')@Matrix.Rotation(angle,3,'X');motion_set_world(rig,name,motion_parent_head(rig,name),R);bpy_update()
    feet={};reach=[]
    for side in ['L','R']:
        target,Rf,footdata=motion_roll_target(rig,side,foot_points[side],spec[side],root_f,yaw,scale)
        upper=rig.data.bones['thigh'+side];lower=rig.data.bones['shin'+side];hip=motion_parent_head(rig,upper.name);v=target-hip;distance=v.length;l1=upper.length;l2=lower.length
        if not abs(l1-l2)+1e-6<distance<l1+l2-1e-6:raise ValueError(('unreachable leg without stretch',clip,t,side,distance,l1+l2))
        axis=v.normalized();bend=Vector((0,-1,0));bend=(bend-axis*bend.dot(axis)).normalized();along=(l1*l1-l2*l2+distance*distance)/(2*distance);knee=hip+axis*along+bend*math.sqrt(max(0,l1*l1-along*along))
        for name,start,end in [(upper.name,hip,knee),(lower.name,knee,target)]:
            b=rig.data.bones[name];rot=(b.tail_local-b.head_local).rotation_difference(end-start).to_matrix();motion_set_world(rig,name,start,rot);bpy_update()
        motion_set_world(rig,'foot'+side,target,Rf);bpy_update();feet[side]=footdata
        reach.append({'side':side,'hip_ankle_distance_m':distance,'rest_two_bone_length_m':l1+l2,'knee_flexion_radians':math.pi-math.acos(max(-1,min(1,(l1*l1+l2*l2-distance*distance)/(2*l1*l2)))),'ankle_target_blender_xyz_m':list(target)})
    return {'time_s':t,'external_root_forward_m':root_f,'external_root_yaw_radians':yaw,'feet':feet,'leg_chain':reach,'body':body}

def bake_resident_motion(scene,rig,carrying=False,pelvis_height_bias_m=0.,sampling_fps=MOTION_FPS):
    import bpy
    if len(rig.data.bones)!=17:raise ValueError('This isolated prototype expects unchanged resident17 bones')
    scene.render.fps=sampling_fps;scene.render.fps_base=1
    rig.animation_data_clear();rig.animation_data_create();foot_points={s:motion_rest_foot_points(scene,rig,s) for s in ['L','R']};scale=(rig.data.bones['thighL'].length+rig.data.bones['shinL'].length)/.7750115381207
    clips={};durations={'Walk':1.2,'StartWalk':.6,'StopWalk':.6,'TurnLeft':1.2,'TurnRight':1.2}
    for name,seconds in durations.items():
        action=bpy.data.actions.new('MotionV2-'+name);rig.animation_data.action=action;rows=[];last={}
        for i in range(round(seconds*sampling_fps)+1):
            f=i+1;scene.frame_set(f);row=motion_pose(scene,rig,name,i/sampling_fps,foot_points,scale,carrying,pelvis_height_bias_m)
            for b in rig.pose.bones:
                q=b.rotation_quaternion.copy()
                if b.name in last and q.dot(last[b.name])<0:q.negate();b.rotation_quaternion=q
                last[b.name]=q.copy();b.keyframe_insert(data_path='rotation_quaternion',frame=f,group=b.name);b.keyframe_insert(data_path='location',frame=f,group=b.name)
            row['frame']=f;rows.append(row)
        for layer in action.layers:
            for strip in layer.strips:
                for bag in getattr(strip,'channelbags',[]):
                    for curve in bag.fcurves:
                        for k in curve.keyframe_points:k.interpolation='LINEAR'
        action.use_fake_user=True;track=rig.animation_data.nla_tracks.new();track.name=name;strip=track.strips.new(name,1,action);strip.action_frame_start=1;strip.action_frame_end=round(seconds*sampling_fps)+1;track.mute=True;rig.animation_data.action=None
        clips[name]={'duration_s':seconds,'fps':sampling_fps,'samples':rows,'frame_range':[1,round(seconds*sampling_fps)+1],'loop':name=='Walk','external_forward_distance_m':rows[-1]['external_root_forward_m']-rows[0]['external_root_forward_m'],'external_yaw_radians':rows[-1]['external_root_yaw_radians']-rows[0]['external_root_yaw_radians']}
    for b in rig.pose.bones:b.location=(0,0,0);b.rotation_quaternion=(1,0,0,0);b.scale=(1,1,1)
    scene.frame_set(1);bpy.context.view_layer.update()
    return {'sampling_fps':sampling_fps,'pelvis_height_bias_m':pelvis_height_bias_m,'pelvis_height_bias_scope':'new5 only; preserves rest geometry and original4 gestures','carrying_right_bind_grasp_preserved':carrying,'prototype_only':True,'rig':rig.name,'bones':17,'scale_factor_from_rest_leg':scale,'source_geometry_and_rest_bones_unchanged':True,'front':'Blender -Y,glTF +Z;right+X','root_motion':'All five skeleton root bones are constantidentity.In-placepose. Consumer applies samples.external_root_forward_m andexternal_root_yaw_radiansONCEtoactorobject. PositiveglTFYyaw=rightturn;groundY=0.','cycle_seconds':1.2,'cycle_distance_m':MOTION_CYCLE_DISTANCE_METRES*scale,'cycle_speed_m_s':MOTION_CYCLE_DISTANCE_METRES*scale/1.2,'walk_entry_exit_phase':.05,'transition_contract':'StartWalk neutral ->Walkphase.05 at.6s;StopWalk startsWalkphase.05 ->neutral at.6s.TurnLeft/Rightneutral->neutralwhileexternalyawchanges-/+45deg in1.2s. Stopbeforeturnandstartafterturn.Noautomaticruntimeoranyphasecrossfadeclaimed.','consumer_notes':'WalkphaseisactualarcLength/cycleDistance modulo1. ApplyStart/Stop/Turnrootcurvesasdeltafromclipentry,notabsoluteactorcoordinates;afterStartenterWalkatt=.06s(phase.05). Rootdrivesactualtranslation/facingonce.NoIKorcontrollercodeincluded.', 'contact_phases':{'Walk_each_foot_cycle':{'heel_loading':[0,.08],'flat_support':[.08,.43],'toe_push':[.43,.60],'swing':[.60,1]},'R_offset_cycles':.5,'IK_weight':'Smoothkinematiccontactblend0..1,notmeasuredgroundforce.'}, 'foot_support':'One rigidfootbone. Actualfootweightedmeshvertices defineheel/toesupportpivots;pitchandankletranslationgiveheel/load-flat/push-toe then swing.Noinventedtoebone. Contactworldcoordinatesassumeprovidedexternalrootcurveonlevelground;IKmaylocktheseandadaptterrain. Stance60%,swing40%,double-support20%ofcycle.','foot_geometry':{s:{'ankle_rest_blender_xyz_m':list(rig.data.bones['foot'+s].head_local),'rigid_vertices':len(foot_points[s]),'rest_bounds_blender_xyz_m':[[min(p[k] for p in foot_points[s]) for k in range(3)],[max(p[k] for p in foot_points[s]) for k in range(3)]]} for s in ['L','R']},'clips':clips,'limits':['Originalproceduralteachingcharacteranimation,notmotioncapture/clinicalnormalgaitcertification.','Rigidfootrollcannotbendtoe/metatarsaljoints;clothisexistinglinearblendweightswithnofabricphysics.','Onlyoneadultresidentvalidatedbeforeany28human/childretargeting;noformalsourceorpublicGLBupdates.','Levelgroundsupportandfinitebakesamplingonly;runtimeIK/obstacles/stairs/slopesandcontrollerintegrationremainRootwork.']}
