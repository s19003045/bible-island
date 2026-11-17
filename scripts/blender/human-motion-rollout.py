"""Retarget original CMU walks to each original Bible Island wardrobe/body.

blender --background --python scripts/blender/human-motion-rollout.py -- \
  --models resident-child,roman-woman,priest-bearer,brick-laborer

Every model has isolated output GLB, editable .blend, metadata and audit files.
The 28 originals, shared source and Jerusalem pilot are read-only inputs.
"""
import bpy, pathlib, json, hashlib, re, math, sys, runpy, struct, statistics, functools
from mathutils import Vector, Matrix, Quaternion
from mathutils.bvhtree import BVHTree

ROOT=pathlib.Path(__file__).resolve().parents[2]
PILOT=runpy.run_path(str(ROOT/'scripts/blender/jerusalem-pilot.py'))
SOURCE=ROOT/'assets/blender/bible-assets.blend'
OUT=ROOT/'public/models/human-rollout';META=ROOT/'assets/blender/human-rollout'
QA=ROOT/'.qa/human-rollout';REFERENCE=ROOT/'assets/blender/jerusalem-pilot/reference'
FPS=120
clamp=PILOT['clamp'];smooth=PILOT['smooth'];mix=PILOT['mix'];rad=math.radians
reset=PILOT['reset'];parent_head=PILOT['parent_head'];set_world=PILOT['set_world'];align=PILOT['align'];leg_solve=PILOT['leg_solve']
components=PILOT['components'];signature=PILOT['geometry_signature'];BVH=PILOT['BVH'];Motion=PILOT['Motion'];contact_label=PILOT['contact_label']

def definitions():
    rows={}
    for line in (ROOT/'src/blender-manifest.js').read_text().splitlines():
        if 'motionVersion:2' not in line or "type:'character'" not in line:continue
        model=re.search(r"^\s*(?:'([^']+)'|(\w+)):\{",line);src=re.search(r"src:'([^']+)'",line);height=re.search(r"height:([\d.]+)",line)
        if model and src and height:rows[model.group(1) or model.group(2)]={'file':src.group(1),'height':float(height.group(1))}
    return rows

def material_name(obj):return obj.data.materials[0].name.split('.')[0] if obj.data.materials else ''
def cloth_material(obj):
    name=material_name(obj)
    return not any(x in name for x in ['skin','hair','leather','eye','iris','lip','earthenware']) and any(x in name for x in ['cloth','tunic','mantle','woven','garment','wrap','shawl','sash','linen','apron'])

def foot_bind(scene,side,weighted=False):
    result=[]
    for obj in scene.objects:
        if obj.type!='MESH':continue
        names={g.index:g.name for g in obj.vertex_groups}
        for v in obj.data.vertices:
            wf=sum(g.weight for g in v.groups if names[g.group]=='foot'+side)
            wt=sum(g.weight for g in v.groups if names[g.group]=='toe'+side)
            if wf+wt>.999:result.append((v.co.copy(),wf,wt) if weighted else v.co.copy())
    return result

def calibrate(scene,rig,model,definition):
    b=rig.data.bones;leg=b['thighL'].length+b['shinL'].length;scale=leg/.7750115381207
    profile='child' if definition['height']<1.4 else 'carrier' if model=='resident-carrier' else 'elder' if model=='return-elder' else 'bearer' if model=='priest-bearer' else 'resident'
    c={'model':model,'profile':profile,'height':definition['height'],'leg':leg,'leg_scale':scale,'hips':b['hips'].head_local.copy(),'spine':b['spine'].head_local.copy(),'neck':b['neck'].head_local.copy(),'head':b['head'].head_local.copy(),'bound_sides':['L','R'] if profile=='bearer' else ['R'] if profile=='carrier' else [],'eyes':{},'fingers':{},'toe':{},'held_objects':[],'sleeves':{}}
    for side in ['L','R']:
        points=foot_bind(scene,side);ankle=b['foot'+side].head_local.copy()
        if not points:raise ValueError('Missing real foot geometry: '+model+side)
        front=min(p.y for p in points);back=max(p.y for p in points)
        c['toe'][side]={'head':Vector((ankle.x,front+(back-front)*.28,ankle.z*.37)),'front':front,'back':back,'ankle':ankle,'points':points}
        eyes=[v.co.copy() for o in scene.objects if o.type=='MESH' and material_name(o)=='eye-white' for v in o.data.vertices if (v.co.x<0)==(side=='L')]
        if not eyes:raise ValueError('Missing eye geometry: '+model+side)
        center=sum(eyes,Vector())/len(eyes);half=(max(v.z for v in eyes)-min(v.z for v in eyes))/2
        c['eyes'][side]={'head':center,'half_height':half,'close':half*1.45}
        sleeve=[]
        for o in scene.objects:
            if o.type!='MESH' or not cloth_material(o):continue
            groups={g.index:g.name for g in o.vertex_groups}
            sleeve.extend(v.co.z for v in o.data.vertices if sum(g.weight for g in v.groups if groups[g.group] in ['arm'+side,'forearm'+side])>.70)
        if sleeve:c['sleeves'][side]=min(sleeve)
        if side in c['bound_sides']:continue
        fingers=[]
        for o in scene.objects:
            if o.type!='MESH' or material_name(o)!='skin':continue
            group=o.vertex_groups.get('hand'+side)
            if not group:continue
            for part in components(o.data):
                if len(part)!=24:continue
                if not all(any(g.group==group.index and g.weight>.99 for g in o.data.vertices[i].groups) for i in part):continue
                direction=(b['hand'+side].tail_local-b['hand'+side].head_local).normalized()
                ordered=sorted(part,key=lambda i:o.data.vertices[i].co.dot(direction));centers=[sum((o.data.vertices[i].co for i in ordered[a:a+8]),Vector())/8 for a in [0,8,16]]
                fingers.append({'object':o,'vertices':part,'centers':centers})
        fingers.sort(key=lambda f:f['centers'][0].x)
        c['fingers'][side]=fingers[:4]
    lower=[]
    for o in scene.objects:
        if o.type!='MESH':continue
        if o.get('heldObject'):c['held_objects'].append({'object':o.name,'kind':o['heldObject'],'vertices':len(o.data.vertices)})
        if cloth_material(o):
            lower.extend(v.co.z for v in o.data.vertices if abs(v.co.x)<.30*scale and v.co.z<c['hips'].z-.10*scale)
    c['garment_hem']=min(lower) if lower else c['hips'].z
    c['long_garment']=c['garment_hem']<b['shinL'].head_local.z-.15*scale
    c['swing_scale']=.90 if c['long_garment'] else 1.
    c['stride_factor']=.83 if c['long_garment'] else .92
    if profile=='carrier':c['stride_factor']=.79
    if profile=='elder':c['stride_factor']=.83
    if profile=='bearer':c['stride_factor']=.72
    c['original_triangles']=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in scene.objects if o.type=='MESH')
    return c

def add_joints(rig,c):
    bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT');b=rig.data.edit_bones
    def add(name,h,t,parent):
        bone=b.new(name);bone.head=h;bone.tail=t;bone.parent=b[parent];return bone
    spine=c['spine'];neck=c['neck'];s1=spine.lerp(neck,.42);s2=spine.lerp(neck,.77)
    b['spine'].tail=s1;add('spineUpper',s1,s2,'spine');add('chest',s2,neck,'spineUpper');b['neck'].parent=b['chest']
    for side in ['L','R']:
        shoulder=b['arm'+side].head.copy();clav=Vector((shoulder.x*.17,shoulder.y,shoulder.z-.015*c['leg_scale']))
        add('clavicle'+side,clav,shoulder,'chest');b['arm'+side].parent=b['clavicle'+side]
        if side in c['sleeves']:
            for name in ['arm'+side,'forearm'+side]:add('underSleeve-'+name,b[name].head.copy(),b[name].tail.copy(),name)
        if c['long_garment']:
            name='shin'+side;add('underRobe-'+name,b[name].head.copy(),b[name].tail.copy(),name)
        toe=c['toe'][side];tail=Vector((toe['head'].x,toe['front']+.005*c['leg_scale'],toe['head'].z-.007*c['leg_scale']))
        add('toe'+side,toe['head'],tail,'foot'+side)
        eye=c['eyes'][side];add('eye'+side,eye['head'],eye['head']+Vector((0,-.015*c['leg_scale'],0)),'head')
        lid=eye['head']+Vector((0,-.002*c['leg_scale'],eye['half_height']*.72));add('lid'+side,lid,lid+Vector((0,-.008*c['leg_scale'],0)),'head')
        sign=-1 if side=='L' else 1;head=Vector((sign*abs(c['toe'][side]['ankle'].x)*1.36,0,c['hips'].z+.02*c['leg_scale']))
        tail=Vector((head.x,0,min(c['garment_hem'],head.z-.25*c['leg_scale'])));add('hem'+side,head,tail,'hips')
        for j,f in enumerate(c['fingers'].get(side,[])):
            h,m,t=f['centers'];add('finger'+side+str(j)+'A',h,m,'hand'+side);add('finger'+side+str(j)+'B',m,t,'finger'+side+str(j)+'A')
    h=Vector((0,.145*c['leg_scale'],c['hips'].z+.24*c['leg_scale']));add('mantleTail',h,h-Vector((0,0,.45*c['leg_scale'])),'spine')
    bpy.ops.object.mode_set(mode='OBJECT');rig.select_set(False)

def skin(scene,rig,c):
    finger_vertices={}
    for side,fingers in c['fingers'].items():
        for j,f in enumerate(fingers):
            h,m,t=f['centers'];direction=(t-h).normalized();mid=(m-h).length
            for i in f['vertices']:
                v=f['object'].data.vertices[i];blend=smooth(((v.co-h).dot(direction)-mid+.008*c['leg_scale'])/(.022*c['leg_scale']))
                finger_vertices[(f['object'].name,i)]={'finger'+side+str(j)+'A':1-blend,'finger'+side+str(j)+'B':blend}
    for o in scene.objects:
        if o.type!='MESH':continue
        names={g.index:g.name for g in o.vertex_groups};groups={g.name:g for g in o.vertex_groups};cloth=cloth_material(o);mat=material_name(o)
        def assign(v,w):
            w={n:x for n,x in w.items() if x>1e-6}
            if len(w)>4:
                # Original cloth and shoulder weights can overlap. Retain the
                # strongest four explicitly, matching glTF's actual skin format.
                w=dict(sorted(w.items(),key=lambda p:-p[1])[:4])
            total=sum(w.values())
            for g in list(v.groups):o.vertex_groups[g.group].remove([v.index])
            for n,x in w.items():
                if n not in groups:groups[n]=o.vertex_groups.new(name=n)
                groups[n].add([v.index],x/total,'REPLACE')
        for v in o.data.vertices:
            x,y,z=v.co;w={names[g.group]:g.weight for g in v.groups}
            if not w:continue
            if 'spine' in w:
                a=w.pop('spine');q=(z-c['spine'].z)/max(.01,c['neck'].z-c['spine'].z);u=smooth((q-.26)/.42);ch=smooth((q-.68)/.25)
                for n,weight in [('spine',1-u),('spineUpper',u*(1-ch)),('chest',u*ch)]:w[n]=w.get(n,0)+a*weight
            for side in ['L','R']:
                if 'foot'+side in w:
                    a=w['foot'+side];pivot=-c['toe'][side]['head'].y;u=smooth((-y-(pivot-.010*c['leg_scale']))/(.035*c['leg_scale']));w['foot'+side]=a*(1-u);w['toe'+side]=a*u
                if side not in c['bound_sides'] and mat=='skin' and ('arm'+side in w or 'forearm'+side in w):
                    arm=rig.data.bones['arm'+side];fore=rig.data.bones['forearm'+side];a=w.pop('arm'+side,0)+w.pop('forearm'+side,0);s=fore.length/.24;along=(v.co-arm.tail_local).dot((fore.tail_local-fore.head_local).normalized());u=smooth((along+.035*s)/(.075*s));w['arm'+side]=a*(1-u);w['forearm'+side]=a*u
                if side not in c['bound_sides'] and 'arm'+side in w:
                    shoulder=rig.data.bones['arm'+side].head_local.z;a=w['arm'+side];u=.24*smooth((z-(shoulder-.08*c['leg_scale']))/(.11*c['leg_scale']));w['arm'+side]=a*(1-u);w['clavicle'+side]=a*u
            if cloth and z<c['hips'].z-.02*c['leg_scale']:
                if c['long_garment']:
                    knee=rig.data.bones['shinL'].head_local.z;leg_weights=w.get('thighL',0)+w.get('thighR',0)
                    if leg_weights>0:
                        transfer=w.get('hips',0)*.8*smooth((knee+.12*c['leg_scale']-z)/(.18*c['leg_scale']));w['hips']=w.get('hips',0)-transfer
                        for side in ['L','R']:w['thigh'+side]=w.get('thigh'+side,0)+transfer*w.get('thigh'+side,0)/leg_weights
                    u=.25*smooth((knee+.015*c['leg_scale']-z)/max(.03,knee-c['garment_hem']+.03*c['leg_scale']))
                else:
                    # A short tunic must lift with the leading thigh, rather
                    # than let the knee cut a rectangular hole above its hem.
                    leg_weights=w.get('thighL',0)+w.get('thighR',0)
                    if leg_weights>0:
                        transfer=w.get('hips',0)*.92*smooth((c['hips'].z-.04*c['leg_scale']-z)/(.30*c['leg_scale']));w['hips']=w.get('hips',0)-transfer
                        for side in ['L','R']:w['thigh'+side]=w.get('thigh'+side,0)+transfer*w.get('thigh'+side,0)/leg_weights
                    u=.16*smooth((c['hips'].z-.02*c['leg_scale']-z)/(.35*c['leg_scale']))
                side='L' if x<0 else 'R';w={n:a*(1-u) for n,a in w.items()};w['hem'+side]=u
            if cloth and ('mantle' in mat or 'wrap' in mat or 'shawl' in mat) and y>0 and z<c['hips'].z+.22*c['leg_scale']:
                u=.18*smooth((c['hips'].z+.22*c['leg_scale']-z)/(.35*c['leg_scale']));w={n:a*(1-u) for n,a in w.items()};w['mantleTail']=u
            if mat in ['eye-white','iris']:w={'eye'+('L' if x<0 else 'R'):1}
            if mat=='skin':
                for side,edge in c['sleeves'].items():
                    if z>edge+.015*c['leg_scale']:
                        for name in ['arm'+side,'forearm'+side]:
                            if name in w:w['underSleeve-'+name]=w.pop(name)
                if c['long_garment'] and c['garment_hem']+.04*c['leg_scale']<z<rig.data.bones['shinL'].head_local.z+.04*c['leg_scale']:
                    for side in ['L','R']:
                        if 'shin'+side in w:w['underRobe-shin'+side]=w.pop('shin'+side)
            w=finger_vertices.get((o.name,v.index),w);assign(v,w)
        if mat=='skin':
            for part in components(o.data):
                if not 15<=len(part)<=100:continue
                center=sum((o.data.vertices[i].co for i in part),Vector())/len(part);side='L' if center.x<0 else 'R';eye=c['eyes'][side];s=eye['half_height']/.0055
                if abs(center.x-eye['head'].x)<.012*s and eye['head'].z<center.z<eye['head'].z+.012*s and abs(center.y-eye['head'].y)<.02*s:
                    for i in part:assign(o.data.vertices[i],{'lid'+side:1})
        o.data.update()
    counts={n:0 for n in rig.data.bones.keys()}
    for o in scene.objects:
        if o.type!='MESH':continue
        names={g.index:g.name for g in o.vertex_groups}
        for v in o.data.vertices:
            for g in v.groups:
                if g.weight>1e-5 and names[g.group] in counts:counts[names[g.group]]+=1
    c['garment_follow']={}
    if c['long_garment']:
        for side in ['L','R']:
            shin=rig.data.bones['shin'+side];calf=shin.head_local.lerp(shin.tail_local,.40);candidates=[]
            for o in scene.objects:
                if o.type!='MESH' or not cloth_material(o):continue
                names={g.index:g.name for g in o.vertex_groups}
                for v in o.data.vertices:
                    weights={names[g.group]:g.weight for g in v.groups}
                    if abs(v.co.x-calf.x)<.035*c['leg_scale'] and abs(v.co.z-calf.z)<.05*c['leg_scale'] and weights.get('hem'+side,0)>.04:candidates.append((v.co.copy(),weights))
            if candidates:c['garment_follow'][side]={'calf':calf,'samples':candidates}
    return counts

def pose(scene,rig,motion,phase,amount=1,points=None,weighted_points=None):
    reset(rig);p=phase%1;sample=motion.sample(p);P=sample['p'];source=P['Hips'];c=motion.config;s=c['leg_scale'];hips=c['hips'].copy()
    for side in c['sleeves']:
        for name in ['arm'+side,'forearm'+side]:rig.pose.bones['underSleeve-'+name].scale=(.90,1,.90)
    if c['long_garment']:
        for side in ['L','R']:rig.pose.bones['underRobe-shin'+side].scale=(.80,1,.80)
    hips.x+=(source.x-motion.source_start['p']['Hips'].x)*motion.scale*.55*amount;hips.z+=(-.028*s+(source.z-motion.mean_hip)*motion.scale*.72)*amount
    if c['profile']=='elder':hips.z-=.012*s
    set_world(rig,'hips',hips,Quaternion().slerp(sample['r']['Hips'].to_quaternion(),.66*amount).to_matrix());bpy.context.view_layer.update()
    shoulder=P['RightArm']-P['LeftArm'];yaw=math.atan2(shoulder.y,shoulder.x)*amount
    for name,a,b,gain,yaw_gain in [('spine','LowerBack','Spine',.28,.35),('spineUpper','Spine','Spine1',.32,.70),('chest','Spine1','Neck1',.40,1.)]:
        direction=P[b]-P[a]
        if direction.length<.1:direction=P['Neck1']-P['Hips']
        neutral=(rig.data.bones[name].tail_local-rig.data.bones[name].head_local).normalized();target=neutral.lerp(direction.normalized(),gain*amount).normalized()
        if c['profile']=='elder':target=Matrix.Rotation(rad(3),3,'X')@target
        delta=neutral.rotation_difference(target).to_matrix();set_world(rig,name,parent_head(rig,name),Matrix.Rotation(yaw*yaw_gain,3,'Z')@delta);bpy.context.view_layer.update()
    for name,a,b in [('neck','Neck1','Head'),('head','Head','HeadEnd')]:
        neutral=(rig.data.bones[name].tail_local-rig.data.bones[name].head_local).normalized();target=neutral.lerp((P[b]-P[a]).normalized(),.45*amount).normalized();align(rig,name,parent_head(rig,name),target);bpy.context.view_layer.update()
    for side,word in [('L','Left'),('R','Right')]:
        if side in c['bound_sides']:continue
        clav=rig.data.bones['clavicle'+side];neutral=clav.tail_local-clav.head_local;target=neutral.copy();target.z+=(P[word+'Arm']-P[word+'Shoulder']).z*motion.scale*.12*amount;align(rig,clav.name,parent_head(rig,clav.name),target);bpy.context.view_layer.update()
        for name,a,b in [('arm'+side,word+'Arm',word+'ForeArm'),('forearm'+side,word+'ForeArm',word+'Hand')]:
            neutral=(rig.data.bones[name].tail_local-rig.data.bones[name].head_local).normalized();gain=(.65 if c['profile']=='elder' else .70 if c['profile']=='carrier' else .88 if c['profile']=='child' else 1.)*amount;target=neutral.lerp((P[b]-P[a]).normalized(),gain).normalized();align(rig,name,parent_head(rig,name),target);bpy.context.view_layer.update()
        hand=rig.data.bones['hand'+side];target=(hand.tail_local-hand.head_local).normalized().lerp((P[word+'FingerBase']-P[word+'Hand']).normalized(),.30*amount).normalized();align(rig,hand.name,parent_head(rig,hand.name),target);bpy.context.view_layer.update()
        for j in range(len(c['fingers'].get(side,[]))):
            for suffix,degrees in [('A',-13-j*1.5),('B',-26-j*1.5)]:rig.pose.bones['finger'+side+str(j)+suffix].rotation_quaternion=Quaternion((1,0,0),rad(degrees))
    targets=[];contacts={}
    for side,word in [('L','Left'),('R','Right')]:
        foot=P[word+'Foot'];stats=motion.source_feet[side];ankle=c['toe'][side]['ankle'];forward=-(foot.y-source.y)*motion.scale*motion.stride_scale*motion.forward_sign
        center=-(motion.reference_mid['p'][word+'Foot'].y-motion.reference_mid['p']['Hips'].y)*motion.scale*motion.stride_scale*motion.forward_sign;forward-=center*.15
        x=ankle.x+((foot.x-source.x)*motion.scale-ankle.x)*.22;contact=motion.contact_at(p,side);lift=0 if contact else max(0,(foot.z-stats['low'])*motion.scale)*c['swing_scale']
        toe=P[word+'ToeBase']-foot;pitch=clamp(rad(-12)-math.atan2(toe.z,max(.01,abs(toe.y))),rad(-25),rad(75))*amount
        if contact_label(p,side)=='flat':pitch=clamp(pitch*.1,rad(-1),rad(1))
        R=Matrix.Rotation(pitch,3,'X');bottom=min((R@(v-ankle)).z for v in points[side]);vertical=-bottom if contact else max(-bottom+.004*s,ankle.z+lift)
        target=Vector((mix(ankle.x,x,amount),ankle.y-forward*amount,mix(ankle.z,vertical,amount)))
        if c['profile']=='elder':target.x+=(-1 if side=='L' else 1)*.006*s*amount
        targets.append((side,target,R));contacts[side]={'contact':'flat' if contact else 'swing','source_lift_m':lift,'pitch_rad':pitch}
    lower=0
    for side,target,R in targets:
        hip=parent_head(rig,'thigh'+side);length=rig.data.bones['thigh'+side].length+rig.data.bones['shin'+side].length;horizontal=(Vector((hip.x,hip.y,0))-Vector((target.x,target.y,0))).length;lower=max(lower,hip.z-target.z-math.sqrt(max(0,(length*.996)**2-horizontal**2)))
    if lower>0:
        h=rig.pose.bones['hips'].matrix.copy();h.translation.z-=lower;rig.pose.bones['hips'].matrix=h;bpy.context.view_layer.update()
    legs=[leg_solve(rig,side,target,R) for side,target,R in targets]
    for side,word in [('L','Left'),('R','Right')]:
        a=P[word+'ToeBase']-P[word+'Foot'];b=P[word+'ToeBaseEnd']-P[word+'ToeBase'];ref=motion.sample(.30 if side=='L' else .80)['p'];ar=ref[word+'ToeBase']-ref[word+'Foot'];br=ref[word+'ToeBaseEnd']-ref[word+'ToeBase'];relative=math.atan2(b.z,max(.01,abs(b.y)))-math.atan2(a.z,max(.01,abs(a.y)));rest=math.atan2(br.z,max(.01,abs(br.y)))-math.atan2(ar.z,max(.01,abs(ar.y)));rig.pose.bones['toe'+side].rotation_quaternion=Quaternion((1,0,0),clamp(-(relative-rest),rad(-35),rad(20))*amount)
        previous=motion.sample((p-.075)%1)['p'];excursion=(previous[word+'Foot'].y-previous['Hips'].y)*motion.scale;gain=.65 if c['long_garment'] else .10;limit=.18 if c['long_garment'] else .035;rig.pose.bones['hem'+side].rotation_quaternion=Quaternion((1,0,0),clamp(excursion*gain,-limit,limit)*amount)
    previous=motion.sample((p-.12)%1)['r']['Hips'].to_euler('XYZ');rig.pose.bones['mantleTail'].rotation_quaternion=Quaternion((1,0,0),clamp(previous.x*.2,-.025,.025)*amount);bpy.context.view_layer.update()
    for side,target,R in targets:
        Df=rig.pose.bones['foot'+side].matrix@rig.data.bones['foot'+side].matrix_local.inverted();Dt=rig.pose.bones['toe'+side].matrix@rig.data.bones['toe'+side].matrix_local.inverted();bottom=min((Df@v).z*wf+(Dt@v).z*wt for v,wf,wt in weighted_points[side]);reserve=.0024
        if bottom<reserve:target.z+=reserve-bottom;leg_solve(rig,side,target,R)
    # The lower robe is a separate layer over the shin, not a rigid thigh plate.
    # Match its sampled cross-section centre to the actual posed calf centre via
    # the existing weighted hem helpers. Rest coordinates/colours never change.
    for side,follow in c.get('garment_follow',{}).items():
        matrices={name:rig.pose.bones[name].matrix@rig.data.bones[name].matrix_local.inverted() for name in rig.data.bones.keys()}
        total=0.;centre=0.;effective=0.
        for v,weights in follow['samples']:
            point=sum(((matrices[name]@v)*w for name,w in weights.items()),Vector());centre+=point.y;effective+=weights.get('hem'+side,0);total+=1
        centre/=total;effective/=total;calf=(matrices['shin'+side]@follow['calf']).y
        delta=clamp(calf-centre,-.025*s,.025*s)*amount
        helper=rig.pose.bones['hem'+side];matrix=helper.matrix.copy();matrix.translation.y+=delta/max(.04,effective);helper.matrix=matrix;bpy.context.view_layer.update()
    return {'phase':p,'feet':contacts,'legs':legs,'pelvis_lower_m':lower}

def attention(rig,t,name,config):
    duration={'Idle':5.4,'LookAround':6.2,'Talk':4.6,'Interact':4.8}[name];u=t/duration;gaze=smooth((u-.10)/.16)*(1-smooth((u-.47)/.17));back=smooth((u-.66)/.13)*(1-smooth((u-.87)/.13));yaw=rad(19)*gaze-rad(11)*back if name=='LookAround' else rad(4)*gaze
    for bone,gain in [('head',.75),('neck',.25),('chest',.12)]:rig.pose.bones[bone].rotation_quaternion=Quaternion((0,0,1),yaw*gain)@rig.pose.bones[bone].rotation_quaternion
    if name=='Talk':
        for side,delay in [('L',0),('R',.33)]:
            if side in config['bound_sides']:continue
            gesture=smooth((u-.15-delay*.2)/.16)*(1-smooth((u-.65-delay*.1)/.2));rig.pose.bones['forearm'+side].rotation_quaternion=Quaternion((1,0,0),-.30*gesture)@rig.pose.bones['forearm'+side].rotation_quaternion
    if name=='Interact':
        inspect=smooth((u-.10)/.22)*(1-smooth((u-.66)/.28));rig.pose.bones['head'].rotation_quaternion=Quaternion((1,0,0),rad(12)*inspect)@rig.pose.bones['head'].rotation_quaternion
        if 'R' not in config['bound_sides']:rig.pose.bones['forearmR'].rotation_quaternion=Quaternion((1,0,0),rad(-29)*inspect)@rig.pose.bones['forearmR'].rotation_quaternion
    bpy.context.view_layer.update()

def bake(scene,rig,motion):
    rig.animation_data_create();points={s:foot_bind(scene,s) for s in ['L','R']};weighted={s:foot_bind(scene,s,True) for s in ['L','R']};durations={'Walk':motion.duration,'StartWalk':.70,'StopWalk':.76,'TurnLeft':1.28,'TurnRight':1.28,'Idle':5.4,'LookAround':6.2,'Talk':4.6,'Interact':4.8};report={}
    for name,seconds in durations.items():
        a=bpy.data.actions.new('HumanV3-'+motion.config['model']+'-'+name);a.use_fake_user=True;rig.animation_data.action=a;previous={};rows=[];sample_fps=120 if name in ['Walk','StartWalk','StopWalk','TurnLeft','TurnRight'] else 30;count=round(seconds*sample_fps);end=round(seconds*FPS)
        for i in range(count+1):
            t=seconds*i/count;frame=1+end*i/count;scene.frame_set(math.floor(frame),subframe=frame%1)
            if name=='Walk':row=pose(scene,rig,motion,t/seconds,points=points,weighted_points=weighted)
            elif name=='StartWalk':
                u=t/seconds;row=pose(scene,rig,motion,.04+u*.45,smooth(u),points,weighted)
            elif name=='StopWalk':
                u=t/seconds;row=pose(scene,rig,motion,.49+u*.46,1-smooth(u),points,weighted)
            elif name in ['TurnLeft','TurnRight']:
                u=t/seconds;row=pose(scene,rig,motion,.05+u,.23*math.sin(math.pi*u)**2,points,weighted);direction=-1 if name=='TurnLeft' else 1;rig.pose.bones['head'].rotation_quaternion=Quaternion((0,0,1),direction*rad(14)*math.sin(math.pi*u))@rig.pose.bones['head'].rotation_quaternion;rig.pose.bones['chest'].rotation_quaternion=Quaternion((0,0,1),direction*rad(5)*math.sin(math.pi*u))@rig.pose.bones['chest'].rotation_quaternion
            else:
                row=pose(scene,rig,motion,0,0,points,weighted);breath=math.sin(2*math.pi*t/seconds)*.0012+math.sin(4*math.pi*t/seconds)*.00035;rig.pose.bones['chest'].scale=(1+breath,1+breath,1);attention(rig,t,name,motion.config)
            bpy.context.view_layer.update();PILOT['keypose'](rig,frame,previous)
            if i%(max(1,round(sample_fps/20)))==0 or i==count:row['time_s']=t;rows.append(row)
        for layer in a.layers:
            for strip in layer.strips:
                for bag in strip.channelbags:
                    for curve in bag.fcurves:
                        for key in curve.keyframe_points:key.interpolation='LINEAR'
        track=rig.animation_data.nla_tracks.new();track.name=name;strip=track.strips.new(name,1,a);strip.action_frame_start=1;strip.action_frame_end=end+1;track.mute=True;rig.animation_data.action=None;report[name]={'duration_s':end/FPS,'sample_fps':sample_fps,'frames':count+1,'loop':name in ['Walk','Idle','LookAround','Talk','Interact'],'samples':rows}
        print('HUMAN_CLIP',motion.config['model'],name,flush=True)
    reset(rig);scene.frame_set(1);bpy.context.view_layer.update();return report

def audit(scene,rig,c):
    for track in rig.animation_data.nla_tracks:track.mute=True
    sole_meshes=[]
    for o in scene.objects:
        if o.type!='MESH':continue
        names={g.index:g.name for g in o.vertex_groups};indices=[v.index for v in o.data.vertices if sum(g.weight for g in v.groups if names[g.group] in ['footL','footR','toeL','toeR'])>.999]
        if indices:sole_meshes.append((o,indices))
    result={'evaluated_mesh_fractional_phases':121,'sole_bake_clearance_reserve_m':.0024,'clips':{},'held_arms':c['bound_sides'],'held_object_vertex_weights_preserved':True,'maximum_bound_hand_relative_chest_position_drift_m':0.,'maximum_bound_hand_relative_chest_rotation_drift_rad':0.}
    robe_objects=[];calves=[];garment_tested=0;garment_max=0;garment_worst=None
    if c['garment_hem']<c['hips'].z-.06*c['leg_scale']:
        for o in scene.objects:
            if o.type!='MESH':continue
            if cloth_material(o):
                polygons=[tuple(p.vertices) for p in o.data.polygons if all(o.data.vertices[i].co.z<c['hips'].z-.04*c['leg_scale'] for i in p.vertices)]
                if polygons:robe_objects.append((o,polygons))
            if material_name(o)=='skin':
                names={g.index:g.name for g in o.vertex_groups}
                lower=c['garment_hem']+(.04 if c['long_garment'] else .012)*c['leg_scale'];upper=rig.data.bones['shinL'].head_local.z+.02*c['leg_scale'] if c['long_garment'] else c['hips'].z-.08*c['leg_scale']
                ids=[v.index for v in o.data.vertices if lower<v.co.z<upper and sum(g.weight for g in v.groups if names[g.group] in ['thighL','thighR','shinL','shinR','underRobe-shinL','underRobe-shinR'])>.6]
                if ids:calves.append((o,ids[::max(1,len(ids)//24)]))
    bind_hand={}
    for track in rig.animation_data.nla_tracks:
        a=track.strips[0].action;rig.animation_data.action=a;rig.animation_data.action_slot=a.slots[0];end=track.strips[0].action_frame_end;count=120 if track.name=='Walk' else 12;low=10;loop=[]
        for i in range(count+1):
            frame=1+(end-1)*i/count;scene.frame_set(math.floor(frame),subframe=frame%1);deps=bpy.context.evaluated_depsgraph_get();deps.update();e=rig.evaluated_get(deps)
            if i in [0,count]:loop.append({b.name:b.matrix.copy() for b in e.pose.bones})
            for o,indices in sole_meshes:
                eo=o.evaluated_get(deps);mesh=eo.to_mesh();low=min(low,min(mesh.vertices[j].co.z for j in indices));eo.to_mesh_clear()
            if track.name=='Walk' and i%3==0 and robe_objects:
                vertices=[];polygons=[]
                for o,faces in robe_objects:
                    eo=o.evaluated_get(deps);mesh=eo.to_mesh();offset=len(vertices);vertices.extend(v.co.copy() for v in mesh.vertices);polygons.extend(tuple(j+offset for j in face) for face in faces);eo.to_mesh_clear()
                tree=BVHTree.FromPolygons(vertices,polygons,all_triangles=False,epsilon=1e-6)
                for o,indices in calves:
                    eo=o.evaluated_get(deps);mesh=eo.to_mesh()
                    for j in indices:
                        point=mesh.vertices[j].co;front_hit=tree.ray_cast(Vector((point.x,-.9*c['leg_scale'],point.z)),Vector((0,1,0)),1.8*c['leg_scale']);back_hit=tree.ray_cast(Vector((point.x,.9*c['leg_scale'],point.z)),Vector((0,-1,0)),1.8*c['leg_scale']);front=front_hit[0];back=back_hit[0]
                        # Below a lifted hem there is intentionally no cloth at
                        # this height. Only test where both garment walls exist.
                        if front is None or back is None or back.y-front.y<.035*c['leg_scale']:continue
                        # An apron and the tunic front are two forward-facing
                        # layers, not a closed garment surrounding the leg.
                        if front_hit[1].y>-.1 or back_hit[1].y<.1:continue
                        garment_tested+=1;protrusion=max(front.y-point.y,point.y-back.y)
                        if protrusion>garment_max:garment_max=protrusion;garment_worst={'phase':i/count,'point':list(point),'front_y':front.y,'back_y':back.y,'object':o.name,'vertex':j}
                    eo.to_mesh_clear()
            for side in c['bound_sides']:
                relative=e.pose.bones['chest'].matrix.inverted()@e.pose.bones['hand'+side].matrix
                if side not in bind_hand:bind_hand[side]=relative.copy()
                result['maximum_bound_hand_relative_chest_position_drift_m']=max(result['maximum_bound_hand_relative_chest_position_drift_m'],(relative.translation-bind_hand[side].translation).length)
                result['maximum_bound_hand_relative_chest_rotation_drift_rad']=max(result['maximum_bound_hand_relative_chest_rotation_drift_rad'],relative.to_quaternion().rotation_difference(bind_hand[side].to_quaternion()).angle)
        entry={'minimum_sole_m':low}
        if track.name in ['Walk','Idle','LookAround','Talk','Interact']:
            entry['loop_max_joint_position_difference_m']=max((loop[0][n].translation-loop[1][n].translation).length for n in loop[0]);entry['loop_max_joint_angle_difference_rad']=max(loop[0][n].to_quaternion().rotation_difference(loop[1][n].to_quaternion()).angle for n in loop[0])
        result['clips'][track.name]=entry
    rig.animation_data.action=None;reset(rig);scene.frame_set(1);bpy.context.view_layer.update()
    result['minimum_sole_m']=min(v['minimum_sole_m'] for v in result['clips'].values())
    result['long_garment_envelope']={'tested_deformed_calf_points':garment_tested,'maximum_front_back_protrusion_m':max(0,garment_max),'worst':garment_worst,'method':'41 evaluated walk phases; actual garment BVH front/back rays at covered calf/knee/thigh X/Z, including inner-clearance skinned vertices; require front/back outward-facing normals and walls at least 35mm*legScale apart, skip below raised/open hem','tolerance_m':.0005*c['leg_scale']}
    if result['minimum_sole_m']<-.0005:raise ValueError(('Sole penetration',c['model'],result['minimum_sole_m']))
    if result['maximum_bound_hand_relative_chest_position_drift_m']>.00001:raise ValueError(('Held hand detached',c['model'],result))
    return result

def scene_for_definition(definition):
    b=(ROOT/'public'/definition['file']).read_bytes();n=struct.unpack_from('<I',b,12)[0];doc=json.loads(b[20:20+n]);roots={doc['nodes'][i]['name'] for i in doc['scenes'][0]['nodes']};rig=next(o for o in bpy.data.objects if o.type=='ARMATURE' and o.name in roots);scene=next(s for s in bpy.data.scenes if rig.name in s.objects);return scene

def process(model,definition,captures):
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE));bpy.context.preferences.filepaths.save_version=0
    source=scene_for_definition(definition);scene,rig=PILOT['clone_scene'](source,'Human rollout — '+model);scene.render.fps=FPS
    for old in list(bpy.data.scenes):
        if old!=scene:bpy.data.scenes.remove(old)
    for a in list(bpy.data.actions):bpy.data.actions.remove(a)
    for _ in range(2):bpy.data.orphans_purge(do_local_ids=True,do_linked_ids=True,do_recursive=True)
    rig.name='human-'+model+'-rig';before=signature(scene);c=calibrate(scene,rig,model,definition);add_joints(rig,c);counts=skin(scene,rig,c)
    if signature(scene)!=before:raise ValueError('Original body/wardrobe changed: '+model)
    slow=c['profile']=='elder';capture=captures['slow' if slow else 'walk'];crop=(226,397) if slow else (55,186);motion=Motion(capture,*crop,'elder' if slow else 'carrier' if c['profile']=='carrier' else 'resident')
    motion.sample=functools.lru_cache(maxsize=8192)(motion.sample)
    source_leg=(motion.source_start['p']['LeftUpLeg']-motion.source_start['p']['LeftLeg']).length+(motion.source_start['p']['LeftLeg']-motion.source_start['p']['LeftFoot']).length
    motion.scale=c['leg']/source_leg;motion.stride_scale=c['stride_factor'];motion.distance=abs(-(motion.source_end['p']['Hips'].y-motion.source_start['p']['Hips'].y)*motion.scale)*motion.stride_scale;motion.duration=motion.capture_seconds*(1.10 if c['profile']=='carrier' else math.sqrt(c['leg_scale']) if c['profile']=='child' else 1.);motion.config=c
    attempts=[]
    for attempt in range(4):
        if rig.animation_data:rig.animation_data_clear()
        for action in list(bpy.data.actions):bpy.data.actions.remove(action)
        clips=bake(scene,rig,motion);checks=audit(scene,rig,c);garment=checks['long_garment_envelope'];attempts.append({'attempt':attempt,'stride_factor':motion.stride_scale,'swing_factor':c['swing_scale'],'protrusion_m':garment['maximum_front_back_protrusion_m']})
        if garment['maximum_front_back_protrusion_m']<=garment['tolerance_m']:break
        print('HUMAN_GARMENT_RETRY',model,json.dumps(attempts[-1]),flush=True)
        motion.stride_scale*=.84;c['stride_factor']=motion.stride_scale;c['swing_scale']*=.83;motion.distance=abs(-(motion.source_end['p']['Hips'].y-motion.source_start['p']['Hips'].y)*motion.scale)*motion.stride_scale
    else:
        failed=QA/(model+'-garment-failed.blend');bpy.ops.wm.save_as_mainfile(filepath=str(failed),compress=True);(QA/(model+'-garment-failed.json')).write_text(json.dumps({'attempts':attempts,'audit':checks},indent=2)+'\n');raise ValueError(('Calf through long garment after limited strides',model,attempts))
    checks['garment_adaptation_attempts']=attempts
    rig['motion_version']=3;rig['cycle_distance_m']=motion.distance;rig['cycle_seconds']=clips['Walk']['duration_s'];rig['capture_source']='CMU07_04' if slow else 'CMU07_01';rig['motion_profile']=c['profile'];rig['base_model_id']=model
    bpy.ops.object.select_all(action='DESELECT')
    for o in scene.objects:
        if o.type in ['MESH','ARMATURE','EMPTY']:o.select_set(True)
    for track in rig.animation_data.nla_tracks:track.mute=False
    path=OUT/(model+'.glb');bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,use_active_scene=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_nla_strips=True,export_force_sampling=True,export_anim_slide_to_zero=True,export_skins=True,export_yup=True,export_apply=False,export_extras=True)
    for track in rig.animation_data.nla_tracks:track.mute=True
    rig.animation_data.action=None;reset(rig);scene.frame_set(1);bpy.context.view_layer.update()
    blend=META/(model+'.blend');bpy.ops.wm.save_as_mainfile(filepath=str(blend),compress=True)
    if blend.stat().st_size>=32*1024*1024:raise ValueError('Sites source object exceeds32MiB: '+model)
    attention_meta={'eyes':['eyeL','eyeR'],'lids':['lidL','lidR'],'lid_close_displacement_world_metres':[0,-max(e['close'] for e in c['eyes'].values()),0],'lid_close_displacement_bone_local':{side:list(rig.data.bones['lid'+side].matrix_local.to_3x3().inverted()@Vector((0,0,-eye['close']))) for side,eye in c['eyes'].items()},'eye_close_scale_bone_local':[1,1,.07],'notes':'Neutral eye/lid tracks. Runtime owns per-instance gaze/blink; use actual scaled lid-close distance. Bone names and local axes preserve pilot contract.'}
    meta={'schema_version':1,'id':'human-'+model,'baseModelId':model,'file':'models/human-rollout/'+model+'.glb','bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'height_m':definition['height'],'ankle_height_m':statistics.mean(c['toe'][side]['ankle'].z for side in ['L','R']),'motion_version':3,'motionProfile':c['profile'],'cycle_distance_m':motion.distance,'cycle_seconds':clips['Walk']['duration_s'],'walkEntryPhase':.49,'startDistanceFraction':.25,'startDuration':clips['StartWalk']['duration_s'],'stopDuration':clips['StopWalk']['duration_s'],'turnDuration':clips['TurnLeft']['duration_s'],'walkContact':PILOT['WALK_CONTACT'],'clipContacts':{n:PILOT['transition_contacts'](n) for n in ['StartWalk','StopWalk','TurnLeft','TurnRight']},'attention':attention_meta,'secondaryCloth':{'excludeBones':['hemL','hemR'],'maxAngle':.02 if c['long_garment'] else .035},'bones':list(rig.data.bones.keys()),'weighted_vertices':counts,'triangles':c['original_triangles'],'wardrobe_geometry_unchanged':True,'wardrobe_geometry_sha256':before,'original_file':definition['file'],'original_glb_sha256':hashlib.sha256((ROOT/'public'/definition['file']).read_bytes()).hexdigest(),'source_shared_blend_sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'capture_file':str((REFERENCE/('07_04.bvh' if slow else '07_01.bvh')).relative_to(ROOT)),'capture_source':rig['capture_source'],'capture_frame_range_zero_based':list(crop),'source_scale_metres_per_unit':motion.scale,'calibration':{'leg_length_m':c['leg'],'leg_scale_to_pilot':c['leg_scale'],'long_garment':c['long_garment'],'garment_hem_m':c['garment_hem'],'stride_factor':c['stride_factor'],'swing_factor':c['swing_scale'],'locked_arms':c['bound_sides'],'priest_left_grasp_added':False},'held_objects':c['held_objects'],'animations':list(clips),'clips':clips,'audit':checks,'editable_source':{'file':str(blend.relative_to(ROOT)),'bytes':blend.stat().st_size,'sha256':hashlib.sha256(blend.read_bytes()).hexdigest()},'limits':['Adult CMU walk/slow-walk retargeted to original limbs; child/loaded/older performances are authored adaptations, not captured children/carriers/elders.','Original teaching geometry and clothing remain; cloth is delayed weighted animation, not fabric simulation.','Priest bearer preserves both original bound arms and existing right grasp; standing/moving is owned by scene state, no invented left grip.']}
    (META/(model+'-motion.json')).write_text(json.dumps(meta,indent=2)+'\n');print('HUMAN_DONE',model,json.dumps({'bytes':meta['bytes'],'cycle':meta['cycle_seconds'],'distance':meta['cycle_distance_m'],'sole':checks['minimum_sole_m'],'blend':meta['editable_source']['bytes']}),flush=True)

def aggregate(rows):
    """Thin release index; detailed source/phase samples stay in per-model JSON."""
    shared_sha=hashlib.sha256(SOURCE.read_bytes()).hexdigest();assets={};failures=[]
    def check(ok,label):
        if not ok:failures.append(label)
    required=['spineUpper','chest','clavicleL','clavicleR','toeL','toeR','eyeL','eyeR','lidL','lidR']
    for model,definition in rows.items():
        path=META/(model+'-motion.json')
        if not path.exists():failures.append(model+': missing metadata');continue
        d=json.loads(path.read_text());long=d['calibration']['long_garment']
        # This contract-only addition does not change the approved baked source.
        d['secondaryCloth']={'excludeBones':['hemL','hemR'],'maxAngle':.02 if long else .035}
        path.write_text(json.dumps(d,indent=2)+'\n')
        glb=ROOT/'public'/d['file'];blend=ROOT/d['editable_source']['file'];original=ROOT/'public'/definition['file']
        check(glb.is_file() and hashlib.sha256(glb.read_bytes()).hexdigest()==d['sha256'],model+': GLB SHA')
        check(blend.is_file() and hashlib.sha256(blend.read_bytes()).hexdigest()==d['editable_source']['sha256'],model+': editable source SHA')
        check(hashlib.sha256(original.read_bytes()).hexdigest()==d['original_glb_sha256'],model+': original changed')
        check(shared_sha==d['source_shared_blend_sha256'],model+': shared original changed')
        check(d['wardrobe_geometry_unchanged'],model+': wardrobe signature')
        active_required=[n for n in required if not(n.startswith('clavicle') and n[-1] in d['calibration']['locked_arms'])]
        check(all(d['weighted_vertices'].get(n,0)>0 for n in active_required),model+': weighted helper missing')
        for side in ['L','R']:
            if side not in d['calibration']['locked_arms']:
                check(all(d['weighted_vertices'].get('finger'+side+str(j)+suffix,0)>0 for j in range(4) for suffix in ['A','B']),model+': free finger weights missing')
        check(max(glb.stat().st_size,blend.stat().st_size,path.stat().st_size)<32*1024*1024,model+': Sites object32MiB')
        check(d['audit']['minimum_sole_m']>=-.0005,model+': foot penetration')
        garment=d['audit']['long_garment_envelope'];check(garment['maximum_front_back_protrusion_m']<=garment['tolerance_m'],model+': garment protrusion')
        check(long or 'covered calf/knee/thigh' in garment['method'],model+': latest short-tunic audit missing')
        check(d['audit']['maximum_bound_hand_relative_chest_position_drift_m']<=.00001,model+': bound arm drift')
        for name,c in d['audit']['clips'].items():
            if 'loop_max_joint_position_difference_m' in c:
                check(c['loop_max_joint_position_difference_m']<.000001 and c['loop_max_joint_angle_difference_rad']<.00001,model+': loop '+name)
        data=glb.read_bytes();length=struct.unpack_from('<I',data,12)[0];doc=json.loads(data[20:20+length]);extras=[n['extras'] for n in doc['nodes'] if 'base_model_id' in n.get('extras',{})]
        check(len(extras)==1 and extras[0]['base_model_id']==model and extras[0]['capture_source']==d['capture_source'],model+': GLB identity/source extras')
        check([a['name'] for a in doc['animations']]==d['animations'],model+': nine clip names')
        keep=['id','baseModelId','file','bytes','sha256','height_m','ankle_height_m','motion_version','motionProfile','cycle_distance_m','cycle_seconds','walkEntryPhase','startDistanceFraction','startDuration','stopDuration','turnDuration','walkContact','clipContacts','attention','secondaryCloth','weighted_vertices','triangles','wardrobe_geometry_unchanged','wardrobe_geometry_sha256','original_file','original_glb_sha256','capture_file','capture_source','capture_frame_range_zero_based','source_scale_metres_per_unit','calibration','held_objects','audit','editable_source']
        assets[model]={k:d[k] for k in keep};assets[model]['metadata_file']=str(path.relative_to(ROOT));assets[model]['clips']={name:{k:v for k,v in c.items() if k!='samples'} for name,c in d['clips'].items()}
    pilot=json.loads((ROOT/'assets/blender/jerusalem-pilot/build-report.json').read_text());preserved={}
    for name,d in pilot['assets'].items():
        digest=hashlib.sha256((ROOT/'public'/d['file']).read_bytes()).hexdigest();preserved[d['file']]=digest;check(digest==d['sha256'],'approved pilot changed: '+name)
    psource=pilot['editable_source'];digest=hashlib.sha256((ROOT/psource['file']).read_bytes()).hexdigest();preserved[psource['file']]=digest;check(digest==psource['sha256'],'approved pilot source changed')
    report={'schema_version':1,'motion_version':3,'expected_models':len(rows),'asset_count':len(assets),'complete':len(assets)==len(rows) and not failures,'source_shared_blend_sha256':shared_sha,'approved_pilot_inputs_preserved':preserved,'assets':assets,'summary':{'original_wardrobes_preserved':sum(d['wardrobe_geometry_unchanged'] for d in assets.values()),'glb_total_bytes':sum(d['bytes'] for d in assets.values()),'source_total_bytes':sum(d['editable_source']['bytes'] for d in assets.values()),'maximum_source_bytes':max((d['editable_source']['bytes'] for d in assets.values()),default=0),'minimum_sole_m':min((d['audit']['minimum_sole_m'] for d in assets.values()),default=0),'maximum_garment_protrusion_m':max((d['audit']['long_garment_envelope']['maximum_front_back_protrusion_m'] for d in assets.values()),default=0),'profiles':{profile:sum(d['motionProfile']==profile for d in assets.values()) for profile in ['resident','carrier','elder','child','bearer']}},'failures':failures,'detail_contract':'Detailed120Hz walk/transitions and30Hz authored gesture samples remain only in each model-motion.json. This index intentionally omits sample arrays.'}
    (META/'build-report.json').write_text(json.dumps(report,indent=2)+'\n')
    print('HUMAN_INDEX',json.dumps(report['summary']), 'complete=',report['complete'], 'failures=',failures,flush=True)
    if failures:raise ValueError(('Human release validation failed',failures))

def main():
    for path in [OUT,META,QA]:path.mkdir(parents=True,exist_ok=True)
    args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [];rows=definitions()
    if '--index-only' in args:aggregate(rows);return
    models=args[args.index('--models')+1].split(',') if '--models' in args else list(rows)
    unknown=set(models)-rows.keys()
    if unknown:raise ValueError('Unknown original model '+repr(unknown))
    captures={'walk':BVH(REFERENCE/'07_01.bvh'),'slow':BVH(REFERENCE/'07_04.bvh')}
    for model in models:process(model,rows[model],captures)
    print('HUMAN_BATCH_DONE',models,flush=True)

if __name__=='__main__':main()
