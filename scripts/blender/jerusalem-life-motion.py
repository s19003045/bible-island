"""Authoring/bake for the NEW three-role Jerusalem-life pilot only.

Recorded base gait, captured action timing, authored workspace/hand contacts and
planted turns are separate in metadata. Actor root translation/yaw is external.
"""
import bpy,math,pathlib,json,sys,runpy,functools,csv,hashlib,statistics,struct
from mathutils import Vector,Matrix,Quaternion
ROOT=pathlib.Path(__file__).resolve().parents[2];G=runpy.run_path(str(ROOT/'scripts/blender/jerusalem-life.py'));P=G['P'];H=G['H'];META=G['META'];OUT=G['OUT'];QA=G['QA'];FPS=60
vec=G['vec'];clamp=G['clamp'];smooth=G['smooth'];mix=G['mix'];rad=math.radians;reset=G['reset'];align=G['align'];set_world=G['set_world'];parent_head=G['parent_head'];leg_solve=G['leg_solve']
REFERENCE=META/'reference';WALK_REFERENCE=ROOT/'assets/blender/jerusalem-pilot/reference'
DURATIONS={'Idle':5.4,'Walk':None,'StartWalk':.8,'StopWalk':.9,'TurnLeft':1.45,'TurnRight':1.45,'LookAround':6.2,'Talk':4.6,'Interact':3.4,'Listen':4.8,'StartWalkL':.8,'StartWalkR':.8,'StopWalkL':.9,'StopWalkR':.9,'TurnLeft45':1.2,'TurnRight45':1.2,'TurnLeft90':1.45,'TurnRight90':1.45,'TurnLeft180':2.4,'TurnRight180':2.4,'StairUp':3.,'StairDown':2.,'Inspect':3.4,'Receive':3.1,'CarrySmall':4.2,'PlaceSmall':3.1,'SetDown':3.6,'Fill':4.8,'PickUp':3.4,'Pour':2.8,'Arrange':4.6,'Offer':3.4}
ROLE_WORK={'resident':['Inspect','Receive','CarrySmall','PlaceSmall'],'carrier':['SetDown','Fill','PickUp','Pour'],'elder':['Arrange','Offer']}
CARRY_BONES=['spineUpper','chest','clavicleL','clavicleR','armL','armR','forearmL','forearmR','handL','handR','propParcel','parcelGripL','parcelGripR']+[prefix+side+str(i)+suffix for side in ['L','R'] for i in range(4) for suffix in ['A','B','C'] for prefix in ['finger']]+['thumb'+side+suffix for side in ['L','R'] for suffix in ['A','B','C']]


def config(scene,rig,role):
    b=rig.data.bones;leg=b['thighL'].length+b['shinL'].length
    c={'model':'jerusalem-life-'+role,'profile':role,'height':1.71,'leg':leg,'leg_scale':leg/.7750115381207,'hips':b['hips'].head_local.copy(),'spine':b['spine'].head_local.copy(),'neck':b['neck'].head_local.copy(),'head':b['head'].head_local.copy(),'bound_sides':['R'] if role=='carrier' else [],'sleeves':{},'fingers':{},'toe':{},'long_garment':False,'swing_scale':1.,'garment_follow':{},'role':role}
    for side in ['L','R']:
        points=H['foot_bind'](scene,side);ankle=b['foot'+side].head_local.copy();c['toe'][side]={'ankle':ankle,'points':points,'head':b['toe'+side].head_local.copy(),'front':min(p.y for p in points),'back':max(p.y for p in points)}
    c['foot_points']={s:H['foot_bind'](scene,s) for s in ['L','R']};c['weighted_feet']={s:H['foot_bind'](scene,s,True) for s in ['L','R']};c['hand_rest']={s:b['hand'+s].matrix_local.copy() for s in ['L','R']};c['hand_grip_local']={s:b['hand'+s].matrix_local.inverted()@b['handGrip'+s].head_local for s in ['L','R']}
    c['hand_normal_rest']={s:-(b['hand'+s].matrix_local.to_3x3()@Vector((0,0,1))) for s in ['L','R']}
    return c


def new_motion(c,cache):
    slow=c['role']=='elder';name='07_04' if slow else '07_01'
    if name not in cache:cache[name]=P['BVH'](WALK_REFERENCE/(name+'.bvh'))
    crop=(226,397) if slow else (55,186);m=P['Motion'](cache[name],*crop,c['role']);m.sample=functools.lru_cache(maxsize=8192)(m.sample);P0=m.source_start['p'];source_leg=(P0['LeftUpLeg']-P0['LeftLeg']).length+(P0['LeftLeg']-P0['LeftFoot']).length;m.scale=c['leg']/source_leg;m.stride_scale=.86 if slow else .79 if c['role']=='carrier' else .92;m.duration=m.capture_seconds*(1.10 if c['role']=='carrier' else 1.);m.distance=abs(-(m.source_end['p']['Hips'].y-m.source_start['p']['Hips'].y)*m.scale)*m.stride_scale;m.config=c
    return m


def body_delta(rig,name):return rig.pose.bones[name].matrix.to_3x3()@rig.data.bones[name].matrix_local.to_3x3().inverted()
def wrist_frame(rig,side,position,direction,palm_normal):
    y=vec(direction).normalized();n=vec(palm_normal);n=(n-y*n.dot(y)).normalized();z=-n;x=y.cross(z).normalized();z=x.cross(y).normalized();R=Matrix((x,y,z)).transposed();rig.pose.bones['hand'+side].matrix=Matrix.Translation(position)@R.to_4x4();bpy.context.view_layer.update()

def arm_solve(rig,side,target,palm_normal=None,hand_direction=None,max_wrist_angle=rad(22),bend_hint=None):
    """Two-bone arm solve preserving limb lengths and a bent elbow plane."""
    upper=rig.data.bones['arm'+side];lower=rig.data.bones['forearm'+side];A=parent_head(rig,upper.name);wanted=vec(target);D=wanted-A;reach=D.length;l1=upper.length;l2=lower.length;length=clamp(reach,abs(l1-l2)+.008,(l1+l2)*.992);W=A+D.normalized()*length;axis=(W-A).normalized();sign=-1 if side=='L' else 1
    pole=vec(bend_hint) if bend_hint is not None else Vector((sign*.55,.15,-1));pole=(pole-axis*pole.dot(axis)).normalized();along=(l1*l1-l2*l2+length*length)/(2*length);E=A+axis*along+pole*math.sqrt(max(0,l1*l1-along*along));align(rig,upper.name,A,E-A);bpy.context.view_layer.update();align(rig,lower.name,E,W-E);bpy.context.view_layer.update();fore=(W-E).normalized();direction=fore if hand_direction is None else vec(hand_direction).normalized();angle=fore.angle(direction)
    if angle>max_wrist_angle:direction=fore.lerp(direction,max_wrist_angle/angle).normalized()
    normal=vec(palm_normal) if palm_normal is not None else Vector((-sign,-.12,0));wrist_frame(rig,side,W,direction,normal)
    return {'wrist_target_error_m':(W-wanted).length,'shoulder_wrist_reach_m':reach,'chain_length_m':l1+l2,'elbow_flexion_rad':math.pi-math.acos(clamp((l1*l1+l2*l2-length*length)/(2*l1*l2),-1,1)),'wrist_angle_rad':fore.angle(direction)}


def relax_fingers(rig,role,strength=0):
    for side in ['L','R']:
        if role=='carrier' and side=='R':continue
        for j in range(4):
            for suffix,angle in [('A',8),('B',12),('C',7)]:
                rig.pose.bones['finger'+side+str(j)+suffix].rotation_quaternion=Quaternion((1,0,0),rad(angle)*strength)
        for suffix,angle in [('A',8),('B',10),('C',8)]:rig.pose.bones['thumb'+side+suffix].rotation_quaternion=Quaternion((1,0,0),rad(angle)*strength)


def restrained_free_arms(rig,m,phase,amount):
    c=m.config;body=body_delta(rig,'chest');inverse=body.inverted();rows={}
    if amount<1e-8:return rows
    for side,sign in [('L',-1),('R',1)]:
        if side in c['bound_sides']:continue
        arm=rig.pose.bones['arm'+side];fore=rig.pose.bones['forearm'+side];dir=inverse@(arm.tail-arm.head).normalized();abduction=clamp(math.atan2(sign*dir.x,-dir.z),rad(3),rad(13));flexion=clamp(math.atan2(-dir.y,-dir.z),rad(-24),rad(28));target=Vector((sign*math.sin(abduction)*math.cos(flexion),-math.sin(flexion),-math.cos(abduction)*math.cos(flexion)))
        rest=(rig.data.bones['arm'+side].tail_local-rig.data.bones['arm'+side].head_local).normalized();target=rest.lerp(target,amount).normalized();A=parent_head(rig,'arm'+side);align(rig,'arm'+side,A,body@target);bpy.context.view_layer.update()
        # Slight flexion is always retained instead of a locked mannequin elbow.
        source_angle=(inverse@(fore.tail-fore.head).normalized()).angle(target);bend=mix(rad(12),clamp(source_angle,rad(12),rad(31)),amount);pole=Vector((-sign*.12,-1,0));pole=(pole-target*pole.dot(target)).normalized();fdir=(target*math.cos(bend)+pole*math.sin(bend)).normalized();E=parent_head(rig,'forearm'+side);align(rig,'forearm'+side,E,body@fdir);bpy.context.view_layer.update();W=parent_head(rig,'hand'+side);palm=body@(Matrix.Rotation(-sign*rad(80),3,'Z')@Vector((0,-1,0)));wrist_frame(rig,side,W,body@fdir,palm);rows[side]={'elbow_flexion_rad':bend,'upper_arm_abduction_rad':abduction,'wrist_angle_rad':0.}
    return rows


def prop_follow_hand(rig):
    if 'propJug' not in rig.pose.bones:return
    D=rig.pose.bones['handR'].matrix@rig.data.bones['handR'].matrix_local.inverted();rig.pose.bones['propJug'].matrix=D@rig.data.bones['propJug'].matrix_local;bpy.context.view_layer.update()


def base_pose(scene,rig,m,phase=0,amount=0):
    c=m.config;row=H['pose'](scene,rig,m,phase,amount,points=c['foot_points'],weighted_points=c['weighted_feet']);row['free_arms']=restrained_free_arms(rig,m,phase,amount);relax_fingers(rig,c['role'],0)
    rig.pose.bones['propParcel'].scale=(.00001,)*3
    for name in ['propDipper','waterStream']:
        if name in rig.pose.bones:rig.pose.bones[name].scale=(.00001,)*3
    prop_follow_hand(rig)
    if amount==0 and 'neutral_body' not in c:c['neutral_body']={n:rig.pose.bones[n].matrix.copy() for n in ['hips','spine','spineUpper','chest','neck','head']}
    return row


def foot_floor_correction(rig,c,targets):
    for side,target,R in targets:
        Df=rig.pose.bones['foot'+side].matrix@rig.data.bones['foot'+side].matrix_local.inverted();Dt=rig.pose.bones['toe'+side].matrix@rig.data.bones['toe'+side].matrix_local.inverted();bottom=min((Df@v).z*wf+(Dt@v).z*wt for v,wf,wt in c['weighted_feet'][side])
        if bottom<.0024:target.z+=.0024-bottom;leg_solve(rig,side,target,R)


def planted_legs(rig,c,targets=None):
    if targets is None:targets=[(side,c['toe'][side]['ankle'].copy(),Matrix.Identity(3)) for side in ['L','R']]
    for side,target,R in targets:leg_solve(rig,side,target,R)
    foot_floor_correction(rig,c,targets);bpy.context.view_layer.update()


def directed_attention(rig,u,clip,role):
    pulse=smooth((u-.10)/.18)*(1-smooth((u-.70)/.22));yaw=rad(15 if clip=='LookAround' else 5)*pulse-rad(8)*smooth((u-.66)/.13)*(1-smooth((u-.87)/.13))
    for name,gain in [('head',.72),('neck',.28)]:rig.pose.bones[name].rotation_quaternion=Quaternion((0,0,1),yaw*gain)@rig.pose.bones[name].rotation_quaternion
    if clip=='Listen':rig.pose.bones['head'].rotation_quaternion=Quaternion((1,0,0),rad(3)*math.sin(math.pi*u)**2)@rig.pose.bones['head'].rotation_quaternion
    if clip=='Talk':
        # Small semantic opening only. Runtime selects this only during speech;
        # this is not phoneme recognition or a claim of synchronized lip speech.
        jaw=(.5+.5*math.sin(math.tau*u*7))*(.5+.5*math.sin(math.pi*u))*.055;rig.pose.bones['jaw'].rotation_quaternion=Quaternion((1,0,0),jaw)
        if role!='carrier':
            target=rig.pose.bones['handR'].head+Vector((-.025,-.10,.07))*pulse;arm_solve(rig,'R',target,palm_normal=Vector((-.7,-.35,.10)),bend_hint=Vector((.5,.1,-1)))
    bpy.context.view_layer.update()


def reference_progress(clip,start,end,field='pelvis_heading_deg'):
    rows=list(csv.DictReader((REFERENCE/(clip+'-measurements.csv')).open()));samples=[]
    for row in rows:
        f=int(row['bvh_zero_based_frame'])
        if start<=f<=end:samples.append((f,float(row[field])))
    a=samples[0][1];b=samples[-1][1];last=0.;out=[]
    for i,(frame,value) in enumerate(samples):
        q=clamp((value-a)/(b-a)) if abs(b-a)>1e-7 else i/(len(samples)-1);last=max(last,q)
        if i%max(1,len(samples)//30)==0 or i==len(samples)-1:out.append([(frame-start)/(end-start),last])
    out[0]=[0,0];out[-1]=[1,1];return out


def at_curve(curve,u):
    for i in range(len(curve)-1):
        if curve[i][0]<=u<=curve[i+1][0]:return mix(curve[i][1],curve[i+1][1],(u-curve[i][0])/max(1e-8,curve[i+1][0]-curve[i][0]))
    return curve[-1][1]


def turn_pose(scene,rig,m,u,name,angular_curve):
    row=base_pose(scene,rig,m,0,0);c=m.config;degrees=180 if '180' in name else 45 if '45' in name else 90;sign=-1 if 'Left' in name else 1;angle=sign*rad(degrees);fraction=at_curve(angular_curve,u);theta=angle*fraction;steps=4 if degrees==180 else 2;segment=min(steps-1,int(u*steps));q=min(1,u*steps-segment);lead='L' if sign<0 else 'R';moving=lead if segment%2==0 else ('R' if lead=='L' else 'L');anchors={s:c['toe'][s]['ankle'].copy() for s in ['L','R']};yaws={'L':0.,'R':0.}
    for k in range(segment):
        side=lead if k%2==0 else ('R' if lead=='L' else 'L');a=angle*math.ceil((k+1)/2)/(steps/2);anchors[side]=Matrix.Rotation(a,3,'Z')@c['toe'][side]['ankle'];yaws[side]=a
    dest_angle=angle*math.ceil((segment+1)/2)/(steps/2);dest=Matrix.Rotation(dest_angle,3,'Z')@c['toe'][moving]['ankle'];travel=smooth(q);anchors[moving]=anchors[moving].lerp(dest,travel);anchors[moving].z+=.045*math.sin(math.pi*q)**1.3;yaws[moving]=mix(yaws[moving],dest_angle,travel);inverse=Matrix.Rotation(-theta,3,'Z');targets=[]
    for side in ['L','R']:
        target=inverse@anchors[side];R=Matrix.Rotation(yaws[side]-theta,3,'Z');targets.append((side,target,R))
    support='R' if moving=='L' else 'L';h=rig.pose.bones['hips'].matrix.copy();h.translation.x+=(-.014 if support=='L' else .014)*math.sin(math.pi*q);h.translation.z-=.008*math.sin(math.pi*q);rig.pose.bones['hips'].matrix=h;bpy.context.view_layer.update();planted_legs(rig,c,targets);rig.pose.bones['head'].rotation_quaternion=Quaternion((0,0,1),sign*rad(9)*math.sin(math.pi*u));prop_follow_hand(rig);row['root_yaw_rad']=theta;row['turn_swing_side']=moving;return row


def clip_spec(name,m):
    duration=DURATIONS[name] if DURATIONS[name] is not None else m.duration;duration=round(duration*FPS)/FPS;spec={'duration':duration,'distance':0.,'loop':name in ['Walk','Idle','LookAround','Talk','Listen','CarrySmall'],'entryPhase':None,'exitPhase':None,'progress':[[0,0],[1,1]],'angularProgress':[[0,0],[1,1]],'angle':0.,'capture':None}
    if name in ROLE_WORK.get(m.config['role'],[]):spec['capture']='authored workspace/hand contacts; CMU79_16 reach and143_10 bend studied as reference, not directly retargeted work limb/root tracks'
    if name=='CarrySmall':spec['carryBones']=CARRY_BONES
    if m.config['role']=='carrier':spec['handContact']={'R':[[0,1]]}
    if m.config['role']=='carrier' and name in ['SetDown','Fill','PickUp','Pour']:spec['handContact']={'L':[[.10,.90]]} if name=='Fill' else {'R':[[.22,1]]} if name=='PickUp' else {'R':[[0,.78]]} if name=='SetDown' else {'R':[[0,1]]}
    if name in ['Receive','CarrySmall','PlaceSmall']:spec['handContact']={'L':[[.34,1]] if name=='Receive' else [[0,.66]] if name=='PlaceSmall' else [[0,1]],'R':[[.34,1]] if name=='Receive' else [[0,.66]] if name=='PlaceSmall' else [[0,1]]}
    if name=='Walk':spec.update(distance=m.distance,entryPhase=0.,exitPhase=1.,capture='07_04' if m.config['role']=='elder' else '07_01')
    elif name.startswith('StartWalk'):
        right=name.endswith('R');spec.update(distance=m.distance*.25,exitPhase=.64 if right else .14,capture='authored stance-to-capture transition',progress=[[0,0],[.25,.04],[.5,.22],[.75,.56],[1,1]])
    elif name.startswith('StopWalk'):
        right=name.endswith('R');spec.update(distance=m.distance*.20,entryPhase=.64 if right else .14,capture='16_33 studied as deceleration reference; authored support-foot calibrated stop',progress=[[0,0],[.25,.45],[.5,.78],[.75,.95],[1,1]])
    elif name.startswith('Turn'):
        degrees=180 if '180' in name else 45 if '45' in name else 90;sign=-1 if 'Left' in name else 1;source='36_02' if degrees==180 else '16_17' if sign<0 else '16_19';start,end=(1139,1441) if degrees==180 else (148,296) if degrees==45 and sign<0 else (148,451) if sign<0 else (1,410);spec.update(angle=sign*rad(degrees),angularProgress=reference_progress(source,start,end),capture=source+' recorded yaw timing, authored planted feet')
    if name in ['StairUp','StairDown']:spec.update(distance=.8,duration=round(m.duration*1.30*FPS)/FPS,loop=True,entryPhase=0.,exitPhase=1.,stairRiser=.09,stairPitch=.225,verticalDistance=.18 if name=='StairUp' else -.18,capture=('83_27' if name=='StairUp' else '83_08')+' recorded swing envelope + actual07 gait; authored 9cm/.225 two-step normalization, not unmodified staircase capture')
    return spec


def pose_clip(scene,rig,m,name,u,spec):
    if name=='Walk':row=base_pose(scene,rig,m,u,1)
    elif name.startswith(('StartWalk','StopWalk')):row=transition_pose(scene,rig,m,u,name,spec)
    elif name in ['StairUp','StairDown']:row=stairs_pose(scene,rig,m,u,name)
    elif name.startswith('Turn'):row=turn_pose(scene,rig,m,u,name,spec['angularProgress'])
    elif name in ROLE_WORK['resident'] and m.config['role']=='resident':row=resident_work(scene,rig,m,u,name)
    elif name in ROLE_WORK['carrier'] and m.config['role']=='carrier':row=carrier_work(scene,rig,m,u,name)
    elif name in ROLE_WORK['elder'] and m.config['role']=='elder':row=vendor_work(scene,rig,m,u,name)
    else:
        row=base_pose(scene,rig,m,0,0)
        if name=='Listen' and m.config['role']=='resident':rig.pose.bones['propParcel'].scale=(1,1,1)
        directed_attention(rig,u,name,m.config['role'])
        if name in ['Idle','Listen','LookAround','Talk']:
            breath=math.sin(math.tau*u)*.0007+math.sin(math.tau*2*u)*.0002;rig.pose.bones['chest'].scale=(1+breath,1+breath,1)
    if m.config['role']=='carrier' and name in ['SetDown','PickUp','Fill'] and not m.config.get('skip_grip_calibration'):
        row['grip_calibration']=apply_carrier_grip_calibration(rig,m.config,name,u)
    bpy.context.view_layer.update();return row


def apply_carrier_grip_calibration(rig,c,name,u):
    """Layer offline, actual-skin grip corrections onto work clips only.

    Limb lengths, prop motion, feet and other role assets remain unchanged.
    The left marker follows the authored palm socket within the fixed dipper;
    its new local track is exported so post-grounding hand IK retains the grip.
    """
    if 'grip_calibration' not in c:
        c['grip_calibration']=json.loads((META/'carrier-grip-calibration.json').read_text())['clips']
    rows=c['grip_calibration'][name];f=clamp(u)*(len(rows)-1);i=min(len(rows)-2,int(f));q=f-i;a,b=rows[i],rows[i+1]
    shift=Vector(a['handShiftBlender']).lerp(Vector(b['handShiftBlender']),q)
    if name=='Fill' and shift.length>1e-8:
        hand=rig.pose.bones['handL'].matrix.copy();W=hand.translation+shift;R=hand.to_3x3();direction=R@Vector((0,1,0));normal=-(R@Vector((0,0,1)));A=parent_head(rig,'armL');E=W-direction*rig.data.bones['forearmL'].length
        arm_solve(rig,'L',W,normal,direction,max_wrist_angle=math.pi,bend_hint=E-A)
        marker=rig.pose.bones['dipperGripL'].matrix.copy();marker.translation=rig.pose.bones['handGripL'].head;rig.pose.bones['dipperGripL'].matrix=marker;bpy.context.view_layer.update()
    for bone in set(a['fingers'])|set(b['fingers']):
        neutral=rig.pose.bones[bone].rotation_quaternion.copy();Qa=Quaternion(a['fingers'][bone]) if bone in a['fingers'] else neutral;Qb=Quaternion(b['fingers'][bone]) if bone in b['fingers'] else neutral;rig.pose.bones[bone].rotation_quaternion=Qa.slerp(Qb,q)
    return {'source':'carrier-grip-calibration.json','hand_shift_m':list(shift),'scope':'Authored physical finger flexion and actual weighted skin clearance; independent exported surface tests required'}


def torso_posture(rig,c,lean=0.,drop=0.,back=0.):
    """Authored planted work posture; total lean is world, never joint sum."""
    neutral=c.get('neutral_body',{});hips=(neutral['hips'].translation.copy() if neutral else c['hips'].copy())+Vector((0,back,-drop));R0=neutral['hips'].to_3x3()@rig.data.bones['hips'].matrix_local.to_3x3().inverted() if neutral else Matrix.Identity(3);set_world(rig,'hips',hips,Matrix.Rotation(lean*.36,3,'X')@R0);bpy.context.view_layer.update()
    for name,gain in [('spine',.64),('spineUpper',.85),('chest',1.),('neck',.72),('head',.42)]:
        R0=neutral[name].to_3x3()@rig.data.bones[name].matrix_local.to_3x3().inverted() if neutral else Matrix.Identity(3);set_world(rig,name,parent_head(rig,name),Matrix.Rotation(lean*gain,3,'X')@R0);bpy.context.view_layer.update()
    planted_legs(rig,c)


def move_prop(rig,name,position,rotation=None,visible=True):
    if name not in rig.pose.bones:return
    bone=rig.data.bones[name];rig.pose.bones[name].matrix=Matrix.Translation(vec(position))@(rotation or Matrix.Identity(3)).to_4x4()@bone.matrix_local.to_quaternion().to_matrix().to_4x4();rig.pose.bones[name].scale=(1 if visible else .00001,)*3;bpy.context.view_layer.update()


def solve_grip(rig,c,side,target,palm_normal=None,direction=None,weight=1.):
    """Match an actual hand-local socket without changing the prop or root.

    Direction is kept within 22 degrees of the forearm. Wrist offset is solved
    iteratively because forearm direction depends on the requested wrist point.
    """
    before={name:rig.pose.bones[name+side].matrix.copy() for name in ['arm','forearm','hand']};local=c['hand_grip_local'][side];wanted=vec(target);W=wanted-rig.pose.bones['hand'+side].matrix.to_3x3()@local;row={}
    for _ in range(16):
        row=arm_solve(rig,side,W,palm_normal,direction,bend_hint=Vector((-.15 if side=='L' else .15,.2,-1)))
        R=rig.pose.bones['hand'+side].matrix.to_3x3();nextW=wanted-R@local
        if (nextW-W).length<.000001:break
        W=W.lerp(nextW,.55)
    if weight<1:
        for name in ['arm','forearm','hand']:
            dest=rig.pose.bones[name+side].matrix.copy();a=before[name];q=a.to_quaternion().slerp(dest.to_quaternion(),weight);pos=a.translation.lerp(dest.translation,weight);rig.pose.bones[name+side].matrix=Matrix.Translation(pos)@q.to_matrix().to_4x4();bpy.context.view_layer.update()
    row['socket_error_m']=(rig.pose.bones['handGrip'+side].head-wanted).length;return row


def thumb_contact(rig,side,target,weight=1.):
    names=['thumb'+side+s for s in ['A','B','C']];before={n:rig.pose.bones[n].rotation_quaternion.copy() for n in names}
    for _ in range(12):
        for name in reversed(names):
            b=rig.pose.bones[name];tip=rig.pose.bones[names[-1]].tail;pivot=b.head;a=tip-pivot;d=vec(target)-pivot
            if a.length<1e-7 or d.length<1e-7:continue
            q=a.rotation_difference(d);axis,angle=q.to_axis_angle();q=Quaternion(axis,min(angle,.22));b.matrix=Matrix.Translation(pivot)@q.to_matrix().to_4x4()@Matrix.Translation(-pivot)@b.matrix;bpy.context.view_layer.update()
            local=b.rotation_quaternion;axis,angle=local.to_axis_angle();limit=rad(55 if name.endswith('A') else 75 if name.endswith('B') else 65)
            if angle>limit:b.rotation_quaternion=Quaternion(axis,limit);bpy.context.view_layer.update()
    if weight<1:
        for name in names:rig.pose.bones[name].rotation_quaternion=before[name].slerp(rig.pose.bones[name].rotation_quaternion,weight)
        bpy.context.view_layer.update()
    return (rig.pose.bones[names[-1]].tail-vec(target)).length


def resident_work(scene,rig,m,u,name):
    row=base_pose(scene,rig,m,0,0);c=m.config
    reverse=name=='PlaceSmall';q=1-u if reverse else u
    table=Vector((0,-.45,.757));held=Vector((0,-.235,.935));parcel_rest=rig.data.bones['propParcel'].head_local;offset=Vector((0,0,.015))
    if name=='CarrySmall':
        reach=1.;lift=1.;lean=0.;drop=0.;prop=held
    elif name in ['Receive','PlaceSmall']:
        reach=smooth(q/.32);lift=smooth((q-.40)/.46);lean=rad(33)*smooth(q/.28)*(1-smooth((q-.43)/.42));drop=.055*smooth(q/.28)*(1-smooth((q-.43)/.42));prop=table.lerp(held,lift)
    else:
        reach=smooth(u/.25)*(1-smooth((u-.74)/.26));lift=0.;lean=rad(30)*reach;drop=.055*reach;prop=table
    torso_posture(rig,c,lean,drop,back=.018*math.sin(lean));move_prop(rig,'propParcel',prop)
    contact={};center=prop+offset
    for side,sign in [('L',-1),('R',1)]:
        target=center+Vector((sign*.054,0,0));normal=Vector((-sign,-.12,.15));contact[side]=solve_grip(rig,c,side,target,normal,weight=reach)
        contact[side]['thumb_target_error_m']=thumb_contact(rig,side,prop+Vector((sign*.030,-.010,.039)),reach)
    if name=='Inspect':
        # Recorded market-reach rhythm informs a small inspection adjustment;
        # this is an authored household activity, not ancient captured work.
        nudge=.012*math.sin(math.tau*u*2)*math.sin(math.pi*u)**2
        target=rig.pose.bones['handGripR'].head+Vector((nudge,-.006*math.sin(math.pi*u),.003*math.sin(math.pi*u)));solve_grip(rig,c,'R',target,Vector((-.9,-.1,.2)),weight=reach)
    row['work']={'object':'household-parcel','phase':name,'parcel_origin_blender':list(prop),'hands':contact,'authored_total_torso_lean_rad':lean,'hips_drop_m':drop};return row


def vendor_work(scene,rig,m,u,name):
    row=base_pose(scene,rig,m,0,0);c=m.config;reach=smooth(u/.20)*(1-smooth((u-.80)/.20));torso_posture(rig,c,rad(29)*reach,.060*reach)
    center=Vector((0,-.45,.772));move_prop(rig,'propParcel',center-Vector((0,0,.015)))
    if name=='Offer':
        hand=Vector((.03,-.45+.035*math.sin(math.pi*u),.82+.10*math.sin(math.pi*u)));normal=Vector((0,0,1));result=solve_grip(rig,c,'R',hand,normal,weight=reach)
    else:
        result={}
        for side,sign in [('L',-1),('R',1)]:
            target=center+Vector((sign*(.08+.025*math.sin(math.tau*u)),.018*math.sin(math.tau*u+(0 if side=='L' else 1.5)),.018));result[side]=solve_grip(rig,c,side,target,Vector((-sign,-.2,.2)),weight=reach)
    row['work']={'object':'vendor-small-goods','phase':name,'hands':result};return row

def carrier_grip(rig,c,target,weight=1.):
    """Find a wrist-neutral hinge about the top handle, preserving digit lengths.

    The grasp rotates around its actual horizontal bar rather than forcing a
    90-degree wrist bend or moving the jug to conceal a hand/root correction.
    """
    side='R';A=parent_head(rig,'armR');G=vec(target);rest=c['hand_rest']['R'].to_3x3();local=c['hand_grip_local']['R'];l1=rig.data.bones['armR'].length;l2=rig.data.bones['forearmR'].length;Rbody=body_delta(rig,'chest');pole=Rbody@(rig.data.bones['armR'].tail_local-rig.data.bones['armR'].head_local);best=None
    for degrees in range(-100,101,4):
        R=Matrix.Rotation(rad(degrees),3,'X')@rest;W=G-R@local;D=W-A;length=D.length;axis=D.normalized();length0=min(length,(l1+l2)*.992);p=(pole-axis*pole.dot(axis)).normalized();along=(l1*l1-l2*l2+length0*length0)/(2*length0);E=A+axis*along+p*math.sqrt(max(0,l1*l1-along*along));fore=(W-E).normalized();direction=R@Vector((0,1,0));cost=fore.angle(direction)**2+max(0,length-(l1+l2)*.992)**2*400+rad(degrees)**2*.0005
        if best is None or cost<best[0]:best=(cost,R,W,pole,degrees)
    _,R,W,pole,degrees=best;before={n:rig.pose.bones[n].matrix.copy() for n in ['armR','forearmR','handR']};result=arm_solve(rig,'R',W,-(R@Vector((0,0,1))),R@Vector((0,1,0)),bend_hint=pole)
    if weight<1:
        for n in ['armR','forearmR','handR']:
            dst=rig.pose.bones[n].matrix.copy();src=before[n];rig.pose.bones[n].matrix=Matrix.Translation(src.translation.lerp(dst.translation,weight))@src.to_quaternion().slerp(dst.to_quaternion(),weight).to_matrix().to_4x4();bpy.context.view_layer.update()
    result.update(socket_error_m=(rig.pose.bones['handGripR'].head-G).length,handle_hinge_radians=rad(degrees));return result


def carrier_released_arms(rig,c,weight=1.):
    for side,sign in [('L',-1),('R',1)]:
        A=parent_head(rig,'arm'+side);before={n:rig.pose.bones[n+side].matrix.copy() for n in ['arm','forearm','hand']};arm_solve(rig,side,A+Vector((sign*.105,-.035,-.275)),Vector((-sign,-.1,0)),bend_hint=Vector((sign*.2,-.2,-1)))
        if weight<1:
            for n in ['arm','forearm','hand']:
                dst=rig.pose.bones[n+side].matrix.copy();src=before[n];rig.pose.bones[n+side].matrix=Matrix.Translation(src.translation.lerp(dst.translation,weight))@src.to_quaternion().slerp(dst.to_quaternion(),weight).to_matrix().to_4x4();bpy.context.view_layer.update()


def fill_free_right_hand(rig,u):
    """Released arm hangs with a soft elbow while the left hand fills the jug.

    The former short shoulder/wrist target folded a full-length arm sharply.
    Entry/exit blend preserves the already authored neighbouring work poses.
    """
    gain=smooth(u/.12)*(1-smooth((u-.88)/.12));names=['armR','forearmR','handR']+[f'fingerR{i}{s}'for i in range(4)for s in 'ABC']+['thumbR'+s for s in 'ABC'];before={n:rig.pose.bones[n].matrix_basis.copy() for n in names};A=parent_head(rig,'armR')
    row=arm_solve(rig,'R',A+Vector((.105,-.025,-.485)),Vector((-1,-.08,0)),bend_hint=Vector((.12,-.6,-.08)))
    hand=rig.pose.bones['handR'].matrix.to_3x3();D=hand@Vector((0,1,0));normal=-(hand@Vector((0,0,1)));axis=D.cross(normal).normalized()
    for i in range(4):
        for suffix,angle in zip('ABC',[10,23,32]):
            name=f'fingerR{i}{suffix}';align(rig,name,parent_head(rig,name),Quaternion(axis,rad(angle))@D);bpy.context.view_layer.update()
    for suffix,angle in zip('ABC',[12,26,37]):
        name='thumbR'+suffix;align(rig,name,parent_head(rig,name),Quaternion(axis,rad(angle))@D);bpy.context.view_layer.update()
    if gain<1:
        destinations={n:rig.pose.bones[n].matrix_basis.copy() for n in names}
        for n in names:
            a,b=before[n],destinations[n];rig.pose.bones[n].matrix_basis=Matrix.Translation(a.translation.lerp(b.translation,gain))@a.to_quaternion().slerp(b.to_quaternion(),gain).to_matrix().to_4x4();bpy.context.view_layer.update()
    return {'weight':gain,**row}


def stream_between(rig,start,end,visible):
    originalEnd=Vector((.28,-.40,.392));originalLength=.108;direction=vec(start)-vec(end);R=Vector((0,0,1)).rotation_difference(direction.normalized()).to_matrix().to_4x4();S=Matrix.Diagonal((1,1,max(.001,direction.length/originalLength),1));D=Matrix.Translation(end)@R@S@Matrix.Translation(-originalEnd);rig.pose.bones['waterStream'].matrix=D@rig.data.bones['waterStream'].matrix_local
    if not visible:rig.pose.bones['waterStream'].scale=(.00001,)*3
    bpy.context.view_layer.update()


def carrier_work(scene,rig,m,u,name):
    row=base_pose(scene,rig,m,0,0);c=m.config;carry=rig.data.bones['propJug'].head_local.copy();ground=Vector((.28,-.40,0));jugLocal=rig.data.bones['jugGripR'].head_local-carry;dipperRest=rig.data.bones['propDipper'].head_local.copy();dipperLocal=rig.data.bones['dipperGripL'].head_local-dipperRest;hands={}
    if name=='Pour':
        pulse=smooth(u/.24)*(1-smooth((u-.75)/.25));torso_posture(rig,c,rad(8)*pulse,0);tilt=Matrix.Rotation(rad(52)*pulse,3,'X');pivot=carry+Vector((0,0,.32));origin=pivot+tilt@(carry-pivot);move_prop(rig,'propJug',origin,tilt);target=origin+tilt@jugLocal;hands['R']=carrier_grip(rig,c,target);lip=origin+tilt@Vector((0,-.046,.39));stream_between(rig,lip,Vector((carry.x,-.45,.52)),.30<u<.73);row['water_transfer']={'visible':.30<u<.73,'source_blender':list(lip),'destination_blender':[carry.x,-.45,.52]};row['work']={'phase':name,'hands':hands,'jug_origin_blender':list(origin)};return row
    q=1-u if name=='PickUp' else u;lower=smooth(q/.82) if name in ['SetDown','PickUp'] else 1.;lean=rad(78)*lower;drop=.190*lower;torso_posture(rig,c,lean,drop,back=.025*lower)
    if name=='Fill':
        h=rig.pose.bones['hips'].matrix.copy();h.translation.x+=.035*smooth(u/.25)*(1-smooth((u-.75)/.25));rig.pose.bones['hips'].matrix=h;bpy.context.view_layer.update();planted_legs(rig,c)
    carrier_released_arms(rig,c,lower)
    if name=='Fill':row['free_right_hand']=fill_free_right_hand(rig,u)
    origin=carry.lerp(ground,lower);move_prop(rig,'propJug',origin)
    if name in ['SetDown','PickUp']:
        active=1-smooth((q-.78)/.18);hands['R']=carrier_grip(rig,c,origin+jugLocal,active)
    else:
        # A dipper transfers water from the basin to the grounded jug. This is
        # an authored typological activity; the source does not capture water.
        engage=smooth(u/.10)*(1-smooth((u-.90)/.10));scoop=smooth((u-.10)/.18);transfer=smooth((u-.28)/.16);returning=smooth((u-.70)/.20);dip=dipperRest.lerp(Vector((-.20,-.43,.47)),scoop);pour=Vector((.18,-.46,.49));dip=dip.lerp(pour,transfer);dip=dip.lerp(dipperRest,returning);tiltAmount=rad(-65)*smooth((u-.42)/.08)*(1-smooth((u-.68)/.08));tilt=Matrix.Rotation(-tiltAmount*.70,3,'Y')@Matrix.Rotation(tiltAmount*.72,3,'X');move_prop(rig,'propDipper',dip,tilt);normal=Vector((.10,1,-.25));hands['L']=solve_grip(rig,c,'L',dip+tilt@dipperLocal,normal,weight=engage)
        # Closed soft fingers are a role adaptation, not captured BVH fingers.
        relax_fingers(rig,'carrier',.65*engage)
        lip=dip+tilt@Vector((0,.035,.085));stream_between(rig,lip,ground+Vector((0,0,.392)),.47<u<.69);row['water_transfer']={'visible':.47<u<.69,'source_blender':list(lip),'destination_blender':list(ground+Vector((0,0,.392))),'dipper_origin_blender':list(dip),'dipper_tilt_radians':tiltAmount}
    row['work']={'phase':name,'hands':hands,'jug_origin_blender':list(origin),'authored_total_torso_lean_rad':lean,'hips_drop_m':drop};return row

def capture_foot_pose(rig):
    return {s:(rig.pose.bones['foot'+s].head.copy(),rig.pose.bones['foot'+s].matrix.to_3x3()@rig.data.bones['foot'+s].matrix_local.to_3x3().inverted()) for s in ['L','R']}


def transition_pose(scene,rig,m,u,name,spec):
    starting=name.startswith('Start');lead='R' if name.endswith('R') else 'L';other='L' if lead=='R' else 'R';phase=spec['exitPhase'] if starting else spec['entryPhase'];base_pose(scene,rig,m,phase,1);gait=capture_foot_pose(rig);base_pose(scene,rig,m,0,0);rest=capture_foot_pose(rig);distance=spec['distance'];progress=at_curve(spec['progress'],u)
    row=base_pose(scene,rig,m,phase-(1-u)*.35 if starting else phase+u*.23,smooth(u) if starting else 1-smooth(u));targets=[]
    for side in ['L','R']:
        start,R0=rest[side] if starting else gait[side];end,R1=gait[side] if starting else rest[side];endWorld=end-Vector((0,distance,0));q=smooth(clamp((u-.07)/.84));world=start.lerp(endWorld,q);moving=side==lead if starting else side==other
        if moving:world.z+=.035*math.sin(math.pi*q)**1.35
        target=world+Vector((0,distance*progress,0));R=R0.to_quaternion().slerp(R1.to_quaternion(),q).to_matrix();targets.append((side,target,R))
    planted_legs(rig,m.config,targets);prop_follow_hand(rig);row['transition_distance_m']=distance;row['root_distance_progress']=progress;return row


def stair_curve(m,up):
    key='up' if up else 'down'
    if not hasattr(m,'stair_envelopes'):m.stair_envelopes={}
    if key in m.stair_envelopes:return m.stair_envelopes[key]
    filename='83_27' if up else '83_08';bvh=P['BVH'](REFERENCE/(filename+'.bvh'));start,end=(541,901) if up else (121,361);rows=[]
    for i in range(241):
        raw=bvh.sample(mix(start,end,i/240))['p'];rows.append(sum(raw[s+'Foot'].z-raw['Hips'].z for s in ['Left','Right'])/2)
    # Extract one complete recorded swing envelope around its strongest peak;
    # normalization adapts it to a two-step .09m/.225 fixture, with 07 gait
    # horizontal phase. This is honestly an authored stair adaptation.
    lo=min(rows);hi=max(rows);peak=max(range(241),key=rows.__getitem__);left=peak;right=peak
    while left>0 and rows[left]>lo+(hi-lo)*.12:left-=1
    while right<240 and rows[right]>lo+(hi-lo)*.12:right+=1
    if right-left<12:left=max(0,peak-30);right=min(240,peak+30)
    raw=[max(0,rows[i]-min(rows[left],rows[right])) for i in range(left,right+1)];maximum=max(raw) or 1.;curve=[[i/(len(raw)-1),v/maximum] for i,v in enumerate(raw)];curve[0][1]=0;curve[-1][1]=0;m.stair_envelopes[key]=curve;return curve


def stairs_pose(scene,rig,m,u,name):
    up=name=='StairUp';old=m.stride_scale;m.stride_scale*=.8/m.distance;row=base_pose(scene,rig,m,u,1);m.stride_scale=old;c=m.config;curve=stair_curve(m,up);targets=[]
    for side in ['L','R']:
        foot=rig.pose.bones['foot'+side];target=foot.head.copy();R=foot.matrix.to_3x3()@rig.data.bones['foot'+side].matrix_local.to_3x3().inverted();phase=(u+(0 if side=='L' else .5))%1
        if not m.contact_at(u,side):
            swing=((phase-.62)%1)/.42;lift=(.105 if up else .045)*at_curve(curve,clamp(swing));target.z+=lift
        targets.append((side,target,R))
    planted_legs(rig,c,targets);prop_follow_hand(rig);row['stair_adaptation']={'riser_m':.09,'pitch':.225,'cycle_horizontal_distance_m':.8,'direction':'up' if up else 'down','source_swing_envelope':'83_27' if up else '83_08'};return row

def frame_measure(scene,rig,m):
    c=m.config;feet={};joints={};palms={}
    for side in ['L','R']:
        df=rig.pose.bones['foot'+side].matrix@rig.data.bones['foot'+side].matrix_local.inverted();dt=rig.pose.bones['toe'+side].matrix@rig.data.bones['toe'+side].matrix_local.inverted();low=min((df@v).z*wf+(dt@v).z*wt for v,wf,wt in c['weighted_feet'][side]);feet[side]=low
        a=(rig.pose.bones['arm'+side].tail-rig.pose.bones['arm'+side].head).normalized();f=(rig.pose.bones['forearm'+side].tail-rig.pose.bones['forearm'+side].head).normalized();h=(rig.pose.bones['hand'+side].tail-rig.pose.bones['hand'+side].head).normalized();joints[side]={'elbow_flexion_rad':a.angle(f),'wrist_angle_rad':f.angle(h)};palms[side]=list(-(rig.pose.bones['hand'+side].matrix.to_3x3()@Vector((0,0,1))).normalized())
    return {'feet_minimum_m':feet,'joints':joints,'palm_normal_actor_blender':palms}


def intervals(samples,side):
    out=[];last=None
    for i,(u,row) in enumerate(samples):
        low=row['feet_minimum_m'][side];label='flat' if low<.005 else 'swing'
        if label!=last:
            if out:out[-1][1]=u
            out.append([u,1,label]);last=label
    return out


def bake(scene,rig,m,names):
    rig.animation_data_create();report={}
    hidden={o.name:o.hide_viewport for o in scene.objects if o.type=='MESH'}
    for name in hidden:scene.objects[name].hide_viewport=True
    for track in list(rig.animation_data.nla_tracks):
        if track.name in names:rig.animation_data.nla_tracks.remove(track)
    for action in list(bpy.data.actions):
        if any(action.name.endswith('-'+name) for name in names):bpy.data.actions.remove(action)
    for name in names:
        spec=clip_spec(name,m)
        if name.startswith(('StartWalk','StopWalk')):
            starting=name.startswith('Start');lead='R' if name.endswith('R') else 'L';side=('L' if lead=='R' else 'R') if starting else lead;phase=spec['exitPhase'] if starting else spec['entryPhase'];base_pose(scene,rig,m,phase,1);gaitY=rig.pose.bones['foot'+side].head.y;restY=m.config['toe'][side]['ankle'].y;spec['distance']=max(.025,gaitY-restY if starting else restY-gaitY);spec['distanceCalibration']='Root travel preserves planted support foot worldY between actual retargeted gait entry/exit and rest'
        seconds=spec['duration'];count=round(seconds*FPS);action=bpy.data.actions.new('JerusalemLife-'+m.config['role']+'-'+name);action.use_fake_user=True;rig.animation_data.action=action;previous={};measurements=[];authored=[]
        for i in range(count+1):
            u=i/count;frame=i+1;scene.frame_set(frame);row=pose_clip(scene,rig,m,name,u,spec);P['keypose'](rig,frame,previous)
            if i%2==0 or i==count:measurements.append((u,frame_measure(scene,rig,m)));authored.append({'u':u,**row})
        for layer in action.layers:
            for strip in layer.strips:
                for bag in strip.channelbags:
                    for curve in bag.fcurves:
                        for key in curve.keyframe_points:key.interpolation='LINEAR'
        track=rig.animation_data.nla_tracks.new();track.name=name;strip=track.strips.new(name,1,action);strip.action_frame_start=1;strip.action_frame_end=count+1;track.mute=True;rig.animation_data.action=None;spec['contacts']={side:intervals(measurements,side) for side in ['L','R']};spec['sample_fps']=FPS;spec['samples']=[{'u':u,**r} for u,r in measurements];spec['authored_samples']=authored;report[name]=spec;print('LIFE_CLIP',m.config['role'],name,seconds,flush=True)
    for name,value in hidden.items():scene.objects[name].hide_viewport=value
    bpy.context.view_layer.update()
    return report


def main():
    args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [];roles=args[args.index('--roles')+1].split(',') if '--roles' in args else ['resident','carrier','elder'];cache={}
    names=args[args.index('--clips')+1].split(',') if '--clips' in args else ['Idle','Walk','Talk','Listen']
    for role in roles:
        reuse='--reuse' in args;previous=json.loads((QA/(role+'-motion-draft.json')).read_text())['clips'] if reuse else {};bpy.ops.wm.open_mainfile(filepath=str(QA/(role+('-motion-draft.blend' if reuse else '-geometry.blend'))));scene=bpy.context.scene;rig=next(o for o in scene.objects if o.type=='ARMATURE');c=config(scene,rig,role);m=new_motion(c,cache);scene.render.fps=FPS;report=bake(scene,rig,m,names);previous.update(report);report=previous;base_pose(scene,rig,m,0,0);scene.frame_set(1);rig.animation_data.action=None;path=QA/(role+'-motion-draft.blend');bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=str(path),compress=True);(QA/(role+'-motion-draft.json')).write_text(json.dumps({'status':'draft-incomplete-not-runtime-release','role':role,'clips':report,'source':str(path.relative_to(ROOT))},indent=2)+'\n');print('LIFE_DRAFT',role,path.stat().st_size,flush=True)

if __name__=='__main__':main()
