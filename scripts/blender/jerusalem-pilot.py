"""Three isolated Jerusalem movement pilots, retargeted from licensed CMU BVH.

Run with Blender 4.5 LTS:
  blender --background --python scripts/blender/jerusalem-pilot.py

Never rewrites the shared bible-assets.blend, current GLBs, or runtime manifest.
Original wardrobe geometry/vertex colours are preserved. Motion capture supplies
the base gait; contact correction, transitions and role variants are authored.
"""
import bpy, math, pathlib, json, hashlib, re, sys, statistics
from mathutils import Vector, Matrix, Quaternion

ROOT=pathlib.Path(__file__).resolve().parents[2]
SOURCE=ROOT/'assets/blender/bible-assets.blend'
OUT=ROOT/'public/models/jerusalem-pilot'
META=ROOT/'assets/blender/jerusalem-pilot'
REFERENCE=ROOT/'assets/blender/jerusalem-pilot/reference/07_01.bvh'
FPS=120

def clamp(x,a=0.,b=1.):return max(a,min(b,x))
def smooth(x):x=clamp(x);return x*x*(3-2*x)
def mix(a,b,u):return a+(b-a)*u
def rad(d):return math.radians(d)

WALK_CONTACT={'L':[[0,.04,'swing'],[.04,.14,'heel'],[.14,.43,'flat'],[.43,.62,'toe'],[.62,1,'swing']], 'R':[[0,.12,'toe'],[.12,.54,'swing'],[.54,.64,'heel'],[.64,.93,'flat'],[.93,1,'toe']]}

def contact_label(phase,side):
    phase=phase%1
    return next(label for lo,hi,label in WALK_CONTACT[side] if lo<=phase<hi)

def transition_contacts(name):
    out={}
    for side in ['L','R']:
        intervals=[];last=None
        for i in range(1001):
            u=i/1000
            phase=.04+u*.45 if name=='StartWalk' else .49+u*.46 if name=='StopWalk' else .05+u
            label=contact_label(phase,side)
            if label!=last:
                if intervals:intervals[-1][1]=u
                intervals.append([u,1,label]);last=label
        out[side]=intervals
    return out

def geometry_signature(scene):
    h=hashlib.sha256()
    for obj in sorted((o for o in scene.objects if o.type=='MESH'),key=lambda o:o.name):
        # Names get Blender suffixes on clone; hash physical surfaces only.
        for v in obj.data.vertices:h.update((','.join(format(x,'.9g') for x in v.co)+';').encode())
        for mat in obj.data.materials:h.update(mat.name.split('.')[0].encode())
        surface=obj.data.color_attributes.get('surface')
        if surface:
            for entry in surface.data:h.update((','.join(format(x,'.9g') for x in entry.color)+';').encode())
    return h.hexdigest()

class BVH:
    def __init__(self,path):
        text=path.read_text();head,motion=text.split('MOTION',1)
        self.names=[];self.parent={};self.offset={};self.channels={};self.values=[]
        tokens=re.findall(r'[{}]|[^\s{}]+',head);i=0;stack=[];current=None
        while i<len(tokens):
            token=tokens[i];i+=1
            if token in ['HIERARCHY']:continue
            if token in ['ROOT','JOINT']:
                current=tokens[i];i+=1;self.names.append(current)
                self.parent[current]=stack[-1] if stack else None
            elif token=='End':
                i+=1;current=(stack[-1] if stack else 'ROOT')+'End'
                self.names.append(current);self.parent[current]=stack[-1]
            elif token=='{':stack.append(current)
            elif token=='}':stack.pop();current=stack[-1] if stack else None
            elif token=='OFFSET':self.offset[current]=Vector(tuple(map(float,tokens[i:i+3])));i+=3
            elif token=='CHANNELS':
                count=int(tokens[i]);i+=1;self.channels[current]=tokens[i:i+count];i+=count
        lines=motion.strip().splitlines();self.dt=float(lines[1].split(':')[1]);self.values=[list(map(float,line.split())) for line in lines[2:]]
        self.frames=[]
        # Reflection preserves the historical rig's L/R naming convention:
        # source +X is Left, whereas the existing rig calls -X Left.
        # Source Y-up and +Z travel -> Blender Z-up and -Y travel.
        self.C=Matrix(((-1,0,0),(0,0,-1),(0,1,0)))
        for row in self.values:
            matrices={};positions={};rotations={};c=0
            for name in self.names:
                T=Matrix.Translation(self.offset[name]);R=Matrix.Identity(4)
                for channel in self.channels.get(name,[]):
                    value=row[c];c+=1;axis=channel[0]
                    if channel.endswith('position'):
                        v=Vector((0,0,0));v['XYZ'.index(axis)]=value;T@=Matrix.Translation(v)
                    else:R@=Matrix.Rotation(rad(value),4,axis)
                local=T@R;parent=self.parent[name];world=matrices[parent]@local if parent else local;matrices[name]=world
                positions[name]=self.C@world.translation
                rotations[name]=self.C@world.to_3x3()@self.C.inverted()
            self.frames.append({'p':positions,'r':rotations})
    def sample(self,frame):
        a=int(math.floor(frame));u=frame-a;b=min(len(self.frames)-1,a+1);a=max(0,a)
        A=self.frames[a];B=self.frames[b]
        return {'p':{n:A['p'][n].lerp(B['p'][n],u) for n in self.names},'r':{n:A['r'][n].to_quaternion().slerp(B['r'][n].to_quaternion(),u).to_matrix() for n in self.names}}

def components(mesh):
    edges=[[] for _ in mesh.vertices]
    for e in mesh.edges:a,b=e.vertices;edges[a].append(b);edges[b].append(a)
    seen=set();out=[]
    for i in range(len(edges)):
        if i in seen:continue
        todo=[i];seen.add(i);part=[]
        while todo:
            j=todo.pop();part.append(j)
            for k in edges[j]:
                if k not in seen:seen.add(k);todo.append(k)
        out.append(part)
    return out

def clone_scene(source,title):
    target=bpy.data.scenes.new(title);target.render.fps=FPS;target.unit_settings.system='METRIC';copies={}
    bpy.context.window.scene=target
    for original in source.objects:
        if original.type not in ['MESH','ARMATURE','EMPTY']:continue
        copy=original.copy();copy.data=original.data.copy() if original.data else None
        target.collection.objects.link(copy);copies[original]=copy
    for original,copy in copies.items():
        copy.parent=copies.get(original.parent)
        if copy.type=='ARMATURE':copy.animation_data_clear()
        for modifier in copy.modifiers:
            if modifier.type=='ARMATURE':modifier.object=copies[modifier.object]
    return target,next(o for o in target.objects if o.type=='ARMATURE')

def reset(rig):
    for bone in rig.pose.bones:
        bone.rotation_mode='QUATERNION';bone.location=(0,0,0);bone.rotation_quaternion=(1,0,0,0);bone.scale=(1,1,1)

def add_bones(rig):
    bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT');b=rig.data.edit_bones
    def add(name,h,t,parent):
        bone=b.new(name);bone.head=h;bone.tail=t;bone.parent=b[parent];return bone
    b['spine'].tail=(0,0,1.17)
    add('spineUpper',(0,0,1.17),(0,0,1.28),'spine')
    add('chest',(0,0,1.28),(0,0,1.35),'spineUpper');b['neck'].parent=b['chest']
    for side,sign in [('L',-1),('R',1)]:
        add('clavicle'+side,(sign*.035,0,1.335),b['arm'+side].head.copy(),'chest');b['arm'+side].parent=b['clavicle'+side]
        add('toe'+side,(sign*.095,-.145,.039),(sign*.095,-.215,.032),'foot'+side)
        add('eye'+side,(sign*.031,-.075,1.582),(sign*.031,-.09,1.582),'head')
        add('lid'+side,(sign*.031,-.077,1.586),(sign*.031,-.085,1.586),'head')
        add('hem'+side,(sign*.13,0,.90),(sign*.13,0,.47),'hips')
        if not (rig.get('pilot_role')=='carrier' and side=='R'):
            for j in range(4):
                x=sign*.28+(j-1.5)*.016;length=[.070,.081,.076,.058][j]
                add('finger'+side+str(j)+'A',(x,-.026,.775),(x,-.030,.75),'hand'+side)
                add('finger'+side+str(j)+'B',(x,-.030,.75),(x,-.039,.775-length),'finger'+side+str(j)+'A')
    add('mantleTail',(0,.145,1.12),(0,.145,.67),'spine')
    bpy.ops.object.mode_set(mode='OBJECT');rig.select_set(False)

def rewrite_weights(scene,rig):
    counts={name:0 for name in rig.data.bones.keys()}
    for obj in scene.objects:
        if obj.type!='MESH':continue
        names={g.index:g.name for g in obj.vertex_groups};groups={g.name:g for g in obj.vertex_groups}
        def setweights(v,weights):
            for g in list(v.groups):obj.vertex_groups[g.group].remove([v.index])
            total=sum(weights.values())
            for name,w in weights.items():
                if w<1e-5:continue
                if name not in groups:groups[name]=obj.vertex_groups.new(name=name)
                groups[name].add([v.index],w/total,'REPLACE');counts[name]+=1
        mat=obj.data.materials[0].name.split('.')[0] if obj.data.materials else ''
        for v in obj.data.vertices:
            x,y,z=v.co;weights={names[g.group]:g.weight for g in v.groups}
            if not weights:continue
            if 'spine' in weights:
                w=weights.pop('spine');upper=smooth((z-1.12)/.13);chest=smooth((z-1.25)/.08)
                for name,value in [('spine',1-upper),('spineUpper',upper*(1-chest)),('chest',upper*chest)]:weights[name]=weights.get(name,0)+w*value
            for side in ['L','R']:
                if 'foot'+side in weights:
                    w=weights['foot'+side];toe=smooth((-y-.135)/.035)
                    weights['foot'+side]=w*(1-toe);weights['toe'+side]=w*toe
                # Blend skin across the elbow; garments continue to use the arm.
                if mat=='skin' and ('arm'+side in weights or 'forearm'+side in weights):
                    arm=rig.data.bones['arm'+side];fore=rig.data.bones['forearm'+side]
                    w=weights.pop('arm'+side,0)+weights.pop('forearm'+side,0)
                    along=(v.co-arm.tail_local).dot((fore.tail_local-fore.head_local).normalized())
                    f=smooth((along+.035)/.075);weights['arm'+side]=w*(1-f);weights['forearm'+side]=w*f
                if 'arm'+side in weights and z>1.27:
                    w=weights['arm'+side];clav=.24*smooth((z-1.27)/.11)
                    weights['arm'+side]=w*(1-clav);weights['clavicle'+side]=w*clav
            if mat=='tunic' and z<.91:
                hem=.18*smooth((.91-z)/.35);side='L' if x<0 else 'R'
                weights={n:w*(1-hem) for n,w in weights.items()};weights['hem'+side]=hem
            if mat=='mantle' and z<1.10:
                tail=.30*smooth((1.10-z)/.35);weights={n:w*(1-tail) for n,w in weights.items()};weights['mantleTail']=tail
            if mat in ['eye-white','iris']:
                weights={'eye'+('L' if x<0 else 'R'):1}
            setweights(v,weights)
        # Only small disconnected eyelid tubes are assigned, not the head shell.
        if mat=='skin':
            for part in components(obj.data):
                if not 15<=len(part)<=100:continue
                center=sum((obj.data.vertices[i].co for i in part),Vector())/len(part)
                if abs(abs(center.x)-.031)<.012 and 1.582<center.z<1.594 and -.09<center.y<-.07:
                    side='L' if center.x<0 else 'R'
                    for i in part:setweights(obj.data.vertices[i],{'lid'+side:1})
                # Each original four-finger tube is a disconnected 24-vertex
                # surface. Bend it through two genuinely weighted joints.
                if len(part)==24 and .70<center.z<.78 and -.06<center.y<0 and .22<abs(center.x)<.33:
                    side='L' if center.x<0 else 'R';sign=-1 if side=='L' else 1
                    j=min(range(4),key=lambda j:abs(center.x-(sign*.28+(j-1.5)*.016)))
                    A='finger'+side+str(j)+'A';B='finger'+side+str(j)+'B'
                    if A in rig.data.bones:
                        for i in part:
                            v=obj.data.vertices[i];w=smooth((.758-v.co.z)/.022)
                            setweights(v,{A:1-w,B:w})
        obj.data.update()
    counts={name:0 for name in rig.data.bones.keys()}
    for obj in scene.objects:
        if obj.type!='MESH':continue
        names={g.index:g.name for g in obj.vertex_groups}
        for vertex in obj.data.vertices:
            for g in vertex.groups:
                if g.weight>1e-5 and names[g.group] in counts:counts[names[g.group]]+=1
    return counts

def parent_head(rig,name):
    b=rig.data.bones[name]
    return (rig.pose.bones[b.parent.name].matrix@b.parent.matrix_local.inverted())@b.head_local if b.parent else b.head_local.copy()

def set_world(rig,name,position,delta):
    b=rig.data.bones[name];rig.pose.bones[name].matrix=Matrix.Translation(position)@delta.to_4x4()@b.matrix_local.to_quaternion().to_matrix().to_4x4()

def align(rig,name,start,direction):
    b=rig.data.bones[name];R=(b.tail_local-b.head_local).rotation_difference(direction).to_matrix();set_world(rig,name,start,R)

def rigid_foot(scene,side,weighted=False):
    points=[]
    for obj in scene.objects:
        if obj.type!='MESH':continue
        groups={g.index:g.name for g in obj.vertex_groups}
        for v in obj.data.vertices:
            w=sum(g.weight for g in v.groups if groups[g.group] in ['foot'+side,'toe'+side])
            if w>.999:
                if weighted:
                    points.append((v.co.copy(),sum(g.weight for g in v.groups if groups[g.group]=='foot'+side),sum(g.weight for g in v.groups if groups[g.group]=='toe'+side)))
                else:points.append(v.co.copy())
    return points

class Motion:
    def __init__(self,bvh,start,end,role):
        self.bvh=bvh;self.start=start;self.end=end;self.role=role
        # Actual captured source cycle, resampled with endpoint pose/velocity blend.
        self.capture_seconds=(end-start)*bvh.dt
        self.duration={'resident':self.capture_seconds,'carrier':self.capture_seconds*1.10,'elder':self.capture_seconds*1.21}[role]
        self.stride_scale={'resident':.92,'carrier':.79,'elder':.64}[role]
        self.source_start=bvh.sample(start);self.source_end=bvh.sample(end)
        A=self.source_start['p'];B=self.source_end['p']
        source_leg=(A['LeftUpLeg']-A['LeftLeg']).length+(A['LeftLeg']-A['LeftFoot']).length
        self.scale=.7750115381207/source_leg
        travel=-(B['Hips'].y-A['Hips'].y)*self.scale
        self.distance=abs(travel)*self.stride_scale
        self.forward_sign=1 if travel>0 else -1
        self.mean_hip=sum(bvh.sample(mix(start,end,i/100))['p']['Hips'].z-(B['Hips'].z-A['Hips'].z)*i/100 for i in range(101))/101
        self.source_feet={};self.contact={}
        for side,word in [('L','Left'),('R','Right')]:
            samples=[self.sample(i/240)['p'][word+'Foot'] for i in range(241)]
            low=min(p.z for p in samples);high=max(p.z for p in samples)
            heights=[(p.z-low)*self.scale for p in samples]
            # Source low-ankle phases detect contact. Source FK still supplies the
            # captured heel pitch; runtime IK uses the exported phase table.
            mask=[]
            for i in range(241):
                phase=(i/240+(0 if side=='L' else .5))%1
                mask.append(.04<=phase<.62)
            self.contact[side]=mask;self.source_feet[side]={'low':low,'height':heights,'samples':samples}
        self.reference_mid=bvh.sample((start+end)/2)
    def sample(self,phase):
        p=phase%1;raw=self.bvh.sample(mix(self.start,self.end,p));A=self.source_start;B=self.source_end
        # Remove measured one-cycle drift; bridge the small endpoint mismatch over
        # the final/initial 8%, preserving the captured internal motion.
        blend=.5*smooth((p-.92)/.08) if p>.92 else -.5*(1-smooth(p/.08)) if p<.08 else 0
        result={'p':{},'r':{}}
        for name in self.bvh.names:
            correction=(B['p'][name]-B['p']['Hips'])-(A['p'][name]-A['p']['Hips'])
            # Remove measured capture path and vertical floor drift. Failing to
            # detrend Hips makes a visible pelvis drop at every loop seam.
            result['p'][name]=raw['p'][name]-(B['p']['Hips']-A['p']['Hips'])*p-correction*blend
            qa=A['r'][name].to_quaternion();qb=B['r'][name].to_quaternion()
            if qa.dot(qb)<0:qb.negate()
            drift_rotation=qb@qa.inverted();axis,angle=drift_rotation.to_axis_angle()
            correction_rotation=Quaternion(axis,-angle*blend)
            result['r'][name]=correction_rotation.to_matrix()@raw['r'][name]
        return result
    def contact_at(self,phase,side):return self.contact[side][min(240,round((phase%1)*240))]

def leg_solve(rig,side,target,footR):
    upper=rig.data.bones['thigh'+side];lower=rig.data.bones['shin'+side]
    hip=parent_head(rig,upper.name);delta=target-hip;length=delta.length;l1=upper.length;l2=lower.length
    if length>=l1+l2-.0001:
        # Source-to-character limb proportions differ. Pelvis adjustment below is
        # preferred, this final 0.1 mm reserve prevents numerical full extension.
        target=hip+delta.normalized()*(l1+l2-.0001);delta=target-hip;length=delta.length
    axis=delta.normalized();bend=Vector((0,-1,0));bend=(bend-axis*bend.dot(axis)).normalized()
    along=(l1*l1-l2*l2+length*length)/(2*length)
    knee=hip+axis*along+bend*math.sqrt(max(0,l1*l1-along*along))
    align(rig,upper.name,hip,knee-hip);bpy.context.view_layer.update()
    align(rig,lower.name,knee,target-knee);bpy.context.view_layer.update()
    set_world(rig,'foot'+side,target,footR);bpy.context.view_layer.update()
    return {'side':side,'reach_m':length,'max_reach_m':l1+l2,'knee_flexion_rad':math.pi-math.acos(clamp((l1*l1+l2*l2-length*length)/(2*l1*l2),-1,1))}

def gait_pose(scene,rig,motion,phase,amount=1,points=None,weighted_points=None):
    reset(rig);p=phase%1;sample=motion.sample(p);P=sample['p'];root=P['Hips'];role=motion.role
    source_neutral=motion.source_start['p']['Hips'];hips=rig.data.bones['hips'].head_local.copy()
    hips.x+=(root.x-source_neutral.x)*motion.scale*.55*amount
    hips.z+=(-.028+(root.z-motion.mean_hip)*motion.scale*.72)*amount
    if role=='elder':hips.z-=.012
    # Capture supplies subtle pelvis twist, lateral weight transfer and spinal
    # counter-rotation; no shared sine motion controls the body's primary gait.
    H=sample['r']['Hips'];pelvis=Quaternion().slerp(H.to_quaternion(),.66*amount).to_matrix()
    set_world(rig,'hips',hips,pelvis);bpy.context.view_layer.update()
    spine_maps=[('spine','LowerBack','Spine',.28),('spineUpper','Spine','Spine1',.32),('chest','Spine1','Neck1',.40)]
    shoulder_axis=P['RightArm']-P['LeftArm']
    captured_chest_yaw=math.atan2(shoulder_axis.y,shoulder_axis.x)*amount
    for name,a,b,gain in spine_maps:
        direction=P[b]-P[a]
        if direction.length<.1:direction=P['Neck1']-P['Hips']
        target=(rig.data.bones[name].tail_local-rig.data.bones[name].head_local).normalized().lerp(direction.normalized(),gain*amount).normalized()
        if role=='elder':target=Matrix.Rotation(rad(3),3,'X')@target
        # A vertical spine direction alone cannot express axial counter-twist.
        # Read actual recorded shoulder-line yaw and distribute it over3joints.
        yaw_gain={'spine':.35,'spineUpper':.70,'chest':1.}[name]
        delta=(rig.data.bones[name].tail_local-rig.data.bones[name].head_local).rotation_difference(target).to_matrix()
        set_world(rig,name,parent_head(rig,name),Matrix.Rotation(captured_chest_yaw*yaw_gain,3,'Z')@delta)
        bpy.context.view_layer.update()
    for name,a,b in [('neck','Neck1','Head'),('head','Head','HeadEnd')]:
        direction=P[b]-P[a]
        neutral=(rig.data.bones[name].tail_local-rig.data.bones[name].head_local).normalized()
        target=neutral.lerp(direction.normalized(),.45*amount).normalized()
        align(rig,name,parent_head(rig,name),target);bpy.context.view_layer.update()
    for side,word in [('L','Left'),('R','Right')]:
        if role=='carrier' and side=='R':
            # The existing hand and jug are already bound in a physical grasp.
            # Slight shoulder counter-rotation preserves that closed grip.
            rig.pose.bones['clavicleR'].rotation_quaternion=Quaternion((0,1,0),rad(-1.5)*amount)
            bpy.context.view_layer.update();continue
        shoulder=P[word+'Arm']-P[word+'Shoulder']
        clav=rig.data.bones['clavicle'+side];neutral=clav.tail_local-clav.head_local
        # Keep authored shoulder width, use actual captured vertical shoulder lift.
        target=neutral.copy();target.z+=shoulder.z*motion.scale*.12*amount
        align(rig,clav.name,parent_head(rig,clav.name),target);bpy.context.view_layer.update()
        for name,a,b in [('arm'+side,word+'Arm',word+'ForeArm'),('forearm'+side,word+'ForeArm',word+'Hand')]:
            direction=(P[b]-P[a]).normalized();neutral=(rig.data.bones[name].tail_local-rig.data.bones[name].head_local).normalized()
            gain={'resident':1.,'carrier':.70,'elder':.65}[role]*amount
            target=neutral.lerp(direction,gain).normalized();align(rig,name,parent_head(rig,name),target);bpy.context.view_layer.update()
        hand=rig.data.bones['hand'+side];end=P.get(word+'FingerBase',P.get(word+'HandEnd',P[word+'Hand']+Vector((0,0,-1))))
        direction=end-P[word+'Hand']
        if direction.length<.01:direction=hand.tail_local-hand.head_local
        target=(hand.tail_local-hand.head_local).normalized().lerp(direction.normalized(),.3*amount).normalized()
        align(rig,hand.name,parent_head(rig,hand.name),target);bpy.context.view_layer.update()
        for j in range(4):
            for suffix,degrees in [('A',-13-j*1.5),('B',-26-j*1.5)]:
                name='finger'+side+str(j)+suffix
                if name in rig.pose.bones:rig.pose.bones[name].rotation_quaternion=Quaternion((1,0,0),rad(degrees))
    targets=[];contacts={}
    for side,word in [('L','Left'),('R','Right')]:
        source=P[word+'Foot'];stats=motion.source_feet[side]
        forward=-(source.y-root.y)*motion.scale*motion.stride_scale*motion.forward_sign
        # Center the captured ankle stroke on the original ankle bind origin.
        center=-(motion.reference_mid['p'][word+'Foot'].y-motion.reference_mid['p']['Hips'].y)*motion.scale*motion.stride_scale*motion.forward_sign
        forward-=center*.15
        lateral=(source.x-root.x)*motion.scale
        sign=-1 if side=='L' else 1
        x=sign*.095+(lateral-sign*.095)*.22
        contact=motion.contact_at(p,side)
        lift=0 if contact else max(0,(source.z-stats['low'])*motion.scale)
        toe=P[word+'ToeBase']-source
        source_angle=math.atan2(toe.z,max(.01,abs(toe.y)))
        # Blender forward is -Y: a POSITIVE X rotation tips the forefoot down.
        # Captured early-swing ankle recovery reaches ~83deg toe-down; clipping
        # this to16deg produces an artificial high, flat marching foot.
        pitch=clamp(rad(-12)-source_angle,rad(-25),rad(75))*amount
        label=contact_label(p,side)
        if label=='flat':pitch=clamp(pitch*.1,rad(-1),rad(1))
        # Source ankle-to-toe inclination includes the original bind slope.
        R=Matrix.Rotation(pitch,3,'X');ankle=rig.data.bones['foot'+side].head_local.copy()
        transformed=[R@(v-ankle) for v in points[side]];bottom=min(v.z for v in transformed)
        vertical=-bottom if contact else max(-bottom+.004,.105+lift)
        target=Vector((mix(ankle.x,x,amount),ankle.y-forward*amount,mix(.105,vertical,amount)))
        if role=='elder':target.x+=sign*.006*amount
        contacts[side]={'contact':'flat' if contact else 'swing','source_lift_m':lift,'pitch_rad':pitch}
        targets.append((side,target,R))
    # Lower pelvis if necessary before solving knees. Never stretch the leg.
    lower=0
    for side,target,R in targets:
        hip=parent_head(rig,'thigh'+side);l=rig.data.bones['thigh'+side].length+rig.data.bones['shin'+side].length
        horizontal=(Vector((hip.x,hip.y,0))-Vector((target.x,target.y,0))).length
        lower=max(lower,hip.z-target.z-math.sqrt(max(0,(l*.996)**2-horizontal**2)))
    if lower>0:
        h=rig.pose.bones['hips'].matrix.copy();h.translation.z-=lower;rig.pose.bones['hips'].matrix=h;bpy.context.view_layer.update()
    metrics=[leg_solve(rig,side,target,R) for side,target,R in targets]
    for side in ['L','R']:
        # Toe articulation follows source forefoot rotation and is small enough
        # that the sole collision proxy remains meaningful at terrain runtime.
        word='Left' if side=='L' else 'Right'
        a=P[word+'ToeBase']-P[word+'Foot'];b=P[word+'ToeBaseEnd']-P[word+'ToeBase']
        reference=motion.sample(.30 if side=='L' else .80)['p']
        ar=reference[word+'ToeBase']-reference[word+'Foot'];br=reference[word+'ToeBaseEnd']-reference[word+'ToeBase']
        relative=math.atan2(b.z,max(.01,abs(b.y)))-math.atan2(a.z,max(.01,abs(a.y)))
        relative_rest=math.atan2(br.z,max(.01,abs(br.y)))-math.atan2(ar.z,max(.01,abs(ar.y)))
        toe_flex=clamp(-(relative-relative_rest),rad(-35),rad(20))
        rig.pose.bones['toe'+side].rotation_quaternion=Quaternion((1,0,0),toe_flex*amount)
        # Delayed cloth, driven by captured foot excursion, not a physics claim.
        prior=motion.sample((p-.075)%1)['p'];excursion=(prior[('Left' if side=='L' else 'Right')+'Foot'].y-prior['Hips'].y)*motion.scale
        rig.pose.bones['hem'+side].rotation_quaternion=Quaternion((1,0,0),clamp(excursion*.10,-.035,.035)*amount)
    prior=motion.sample((p-.12)%1)['r']['Hips'].to_euler('XYZ')
    rig.pose.bones['mantleTail'].rotation_quaternion=Quaternion((1,0,0),clamp(prior.x*.2,-.025,.025)*amount)
    bpy.context.view_layer.update()
    if weighted_points:
        for side,target,R in targets:
            foot='foot'+side;toe='toe'+side
            Df=rig.pose.bones[foot].matrix@rig.data.bones[foot].matrix_local.inverted()
            Dt=rig.pose.bones[toe].matrix@rig.data.bones[toe].matrix_local.inverted()
            bottom=min((Df@point).z*wf+(Dt@point).z*wt for point,wf,wt in weighted_points[side])
            if bottom<.0013:
                # 120Hz plus1.3mm clearance absorbs subframe quaternion/LBS
                # interpolation curvature; terrain runtime still solves exactsole.
                target.z+=.0013-bottom;leg_solve(rig,side,target,R)
    return {'phase':p,'feet':contacts,'legs':metrics,'pelvis_lower_m':lower}

def apply_attention(rig,t,clip,role):
    # Deterministic directed looks and blinks are part of each actor's own clip.
    # Runtime attention can layer actual targets over these base performances.
    length={'Idle':5.4,'LookAround':6.2,'Talk':4.6,'Interact':4.8}.get(clip,0)
    if not length:return
    u=t/length;gaze=smooth((u-.10)/.16)*(1-smooth((u-.47)/.17))
    back=smooth((u-.66)/.13)*(1-smooth((u-.87)/.13))
    yaw=(rad(19)*gaze-rad(11)*back) if clip=='LookAround' else rad(4)*gaze
    for bone,gain in [('head',.75),('neck',.25),('chest',.12)]:
        pb=rig.pose.bones[bone];pb.rotation_quaternion=Quaternion((0,0,1),yaw*gain)@pb.rotation_quaternion
    # Eye and lid tracks stay neutral: a runtime per-instance attention/blink
    # controller avoids a character blinking on every short walk loop.
    if clip=='Talk':
        for side,delay in [('L',0),('R',.33)]:
            if role=='carrier' and side=='R':continue
            gesture=smooth((u-.15-delay*.2)/.16)*(1-smooth((u-.65-delay*.1)/.2))
            rig.pose.bones['forearm'+side].rotation_quaternion=Quaternion((1,0,0),-.30*gesture)@rig.pose.bones['forearm'+side].rotation_quaternion
    bpy.context.view_layer.update()

def keypose(rig,frame,previous):
    for b in rig.pose.bones:
        q=b.rotation_quaternion.copy()
        if b.name in previous and q.dot(previous[b.name])<0:q.negate();b.rotation_quaternion=q
        previous[b.name]=q.copy()
        for prop in ['location','rotation_quaternion','scale']:b.keyframe_insert(data_path=prop,frame=frame,group=b.name)

def bake(scene,rig,motion):
    rig.animation_data_create();foot_points={s:rigid_foot(scene,s) for s in ['L','R']}
    weighted_points={s:rigid_foot(scene,s,weighted=True) for s in ['L','R']}
    durations={'Walk':motion.duration,'StartWalk':.70,'StopWalk':.76,'TurnLeft':1.28,'TurnRight':1.28,'Idle':5.4,'LookAround':6.2,'Talk':4.6,'Interact':4.8};report={}
    for name,seconds in durations.items():
        action=bpy.data.actions.new('JerusalemPilot-'+motion.role+'-'+name);action.use_fake_user=True;rig.animation_data.action=action;previous={};rows=[];count=round(seconds*FPS)
        for i in range(count+1):
            t=seconds*i/count;scene.frame_set(i+1)
            if name=='Walk':row=gait_pose(scene,rig,motion,t/seconds,points=foot_points,weighted_points=weighted_points)
            elif name=='StartWalk':
                u=t/seconds;row=gait_pose(scene,rig,motion,.04+u*.45,amount=smooth(u),points=foot_points,weighted_points=weighted_points)
            elif name=='StopWalk':
                u=t/seconds;row=gait_pose(scene,rig,motion,.49+u*.46,amount=1-smooth(u),points=foot_points,weighted_points=weighted_points)
            elif name in ['TurnLeft','TurnRight']:
                u=t/seconds;direction=-1 if name=='TurnLeft' else 1
                # Alternating step-turn; actor yaw is owned by runtime exactly once.
                row=gait_pose(scene,rig,motion,.05+u,amount=.23*math.sin(math.pi*u)**2,points=foot_points,weighted_points=weighted_points)
                rig.pose.bones['head'].rotation_quaternion=Quaternion((0,0,1),direction*rad(14)*math.sin(math.pi*u))@rig.pose.bones['head'].rotation_quaternion
                rig.pose.bones['chest'].rotation_quaternion=Quaternion((0,0,1),direction*rad(5)*math.sin(math.pi*u))@rig.pose.bones['chest'].rotation_quaternion
            else:
                row=gait_pose(scene,rig,motion,.0,amount=0,points=foot_points,weighted_points=weighted_points)
                # Two slightly different breathing lobes per long performance.
                breath=math.sin(2*math.pi*t/seconds)*.0012+math.sin(4*math.pi*t/seconds)*.00035
                rig.pose.bones['chest'].scale=(1+breath,1+breath,1)
                apply_attention(rig,t,name,motion.role)
                if name=='Interact':
                    u=t/seconds;inspect=smooth((u-.10)/.22)*(1-smooth((u-.66)/.28))
                    rig.pose.bones['head'].rotation_quaternion=Quaternion((1,0,0),rad(12)*inspect)@rig.pose.bones['head'].rotation_quaternion
                    if motion.role!='carrier':
                        rig.pose.bones['forearmR'].rotation_quaternion=Quaternion((1,0,0),rad(-29)*inspect)@rig.pose.bones['forearmR'].rotation_quaternion
            bpy.context.view_layer.update();keypose(rig,i+1,previous);row['time_s']=t
            if i%3==0 or i==count:rows.append(row)
        for layer in action.layers:
            for strip in layer.strips:
                for bag in getattr(strip,'channelbags',[]):
                    for curve in bag.fcurves:
                        for key in curve.keyframe_points:key.interpolation='LINEAR'
        track=rig.animation_data.nla_tracks.new();track.name=name;strip=track.strips.new(name,1,action);strip.action_frame_start=1;strip.action_frame_end=count+1;track.mute=True;rig.animation_data.action=None
        report[name]={'duration_s':count/FPS,'frames':count+1,'loop':name in ['Walk','Idle','LookAround','Talk','Interact'],'samples':rows}
        print('PILOT_BAKED',motion.role,name,flush=True)
    reset(rig);scene.frame_set(1);bpy.context.view_layer.update();return report

def main():
    if not REFERENCE.exists():raise FileNotFoundError('Licensed CMU reference is required: '+str(REFERENCE))
    OUT.mkdir(parents=True,exist_ok=True);META.mkdir(parents=True,exist_ok=True)
    bvh=BVH(REFERENCE)
    if '--inspect-source' in sys.argv:
        print('BVH_NAMES',bvh.names)
        print('BVH_FRAMES',len(bvh.frames),'DT',bvh.dt)
        for i in range(1,len(bvh.frames),10):
            p=bvh.frames[i]['p'];print('FRAME',i,*[round(p[n].z,4) for n in ['Hips','LeftFoot','RightFoot']],*[round(p[n].y,4) for n in ['Hips','LeftFoot','RightFoot']])
        return
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE));bpy.context.preferences.filepaths.save_version=0
    sources={role:next(s for s in bpy.data.scenes if any(o.type=='ARMATURE' and o.name==rig for o in s.objects)) for role,rig in [('resident','resident-rig'),('carrier','resident-rig.003'),('elder','resident-rig.001')]}
    pilots={role:clone_scene(source,'Jerusalem pilot — '+role) for role,source in sources.items()}
    for scene in list(bpy.data.scenes):
        if scene not in [s for s,r in pilots.values()]:bpy.data.scenes.remove(scene)
    # The central captured cycle avoids both the T-pose and take start/end.
    start,end=55,186
    report={'schema_version':1,'motion_version':3,'source_blend_sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'capture':{'name':'CMU subject07 trial01 walk','source_path':str(REFERENCE.relative_to(ROOT)),'sha256':hashlib.sha256(REFERENCE.read_bytes()).hexdigest(),'fps':1/bvh.dt,'frame_range_zero_based_inclusive':[start,end],'added_T_pose_skipped':True,'license':'CMU free worldwide commercial/noncommercial use; Hahne conversion adds no restrictions','primary_url':'https://mocap.cs.cmu.edu/','conversion_url':'https://sites.google.com/a/cgspeed.com/cgspeed/motion-capture/the-motionbuilder-friendly-bvh-conversion-release-of-cmus-motion-capture-database','mirror_url':'https://raw.githubusercontent.com/una-dinosauria/cmu-mocap/master/data/007/07_01.bvh'},'assets':{},'limits':['CMU captures one adult walking; carrier and elder are authored adaptations, not captured elderly/loaded subjects.','Original low-poly teaching character, not scanned anatomy. Cloth is weighted delayed animation, not fabric simulation.','Neutral transitions are authored from captured poses; runtime must contact-match and blend, not claim perfect arbitrary-phase baked starts/stops.']}
    for role,(scene,rig) in pilots.items():
        bpy.context.window.scene=scene;rig.name='jerusalem-'+role+'-rig';rig['pilot_role']=role
        before_geometry=geometry_signature(scene);add_bones(rig);counts=rewrite_weights(scene,rig)
        after_geometry=geometry_signature(scene)
        if before_geometry!=after_geometry:raise ValueError('Wardrobe geometry or vertex colours changed: '+role)
        capture=bvh;crop=(start,end)
        if role=='elder':
            capture=BVH(REFERENCE.parent/'07_04.bvh');crop=(226,397)
        motion=Motion(capture,*crop,role)
        if role=='elder':motion.duration=motion.capture_seconds;motion.stride_scale=.86;motion.distance=abs(-(motion.source_end['p']['Hips'].y-motion.source_start['p']['Hips'].y)*motion.scale)*motion.stride_scale
        clips=bake(scene,rig,motion)
        rig['motion_version']=3;rig['cycle_distance_m']=motion.distance;rig['cycle_seconds']=motion.duration;rig['capture_source']='CMU07_04' if role=='elder' else 'CMU07_01';rig['role']=role
        bpy.ops.object.select_all(action='DESELECT')
        for o in scene.objects:
            if o.type in ['MESH','ARMATURE','EMPTY']:o.select_set(True)
        for track in rig.animation_data.nla_tracks:track.mute=False
        destination=OUT/(role+'.glb')
        bpy.ops.export_scene.gltf(filepath=str(destination),export_format='GLB',use_selection=True,use_active_scene=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_nla_strips=True,export_force_sampling=True,export_anim_slide_to_zero=True,export_skins=True,export_yup=True,export_apply=False,export_extras=True)
        for track in rig.animation_data.nla_tracks:track.mute=True
        rig.animation_data.action=None;reset(rig);scene.frame_set(1);bpy.context.view_layer.update()
        attention={'eyes':['eyeL','eyeR'],'lids':['lidL','lidR'],'lid_close_displacement_world_metres':[0,-.008,0],'lid_close_displacement_bone_local':{side:list(rig.data.bones['lid'+side].matrix_local.to_3x3().inverted()@Vector((0,0,-.008))) for side in ['L','R']},'eye_close_scale_bone_local':[1,1,.07],'notes':'GLB bones retain local axes from Blender. Aim gaze in world space; glTF front+Z,up+Y. Lids translate down8mm; do not rotate guessed axes. Eye/lid animation tracks are neutral; runtimeownsindependentblinkclock. Upper lids only.'}
        asset={'id':'jerusalem-'+role,'file':'models/jerusalem-pilot/'+role+'.glb','bytes':destination.stat().st_size,'sha256':hashlib.sha256(destination.read_bytes()).hexdigest(),'height_m':1.71,'ankle_height_m':.105,'cycle_distance_m':motion.distance,'cycle_seconds':round(motion.duration*FPS)/FPS,'bones':list(rig.data.bones.keys()),'weighted_vertices':counts,'animations':list(clips),'wardrobe_geometry_unchanged':True,'wardrobe_geometry_sha256':before_geometry,'source_scale_metres_per_unit':motion.scale,'capture_file':str((REFERENCE.parent/('07_04.bvh' if role=='elder' else '07_01.bvh')).relative_to(ROOT)),'capture_frame_range_zero_based':list(crop),'walkContact':WALK_CONTACT,'clipContacts':{name:transition_contacts(name) for name in ['StartWalk','StopWalk','TurnLeft','TurnRight']},'walkEntryPhase':.49,'startDistanceFraction':.25,'startDuration':clips['StartWalk']['duration_s'],'stopDuration':clips['StopWalk']['duration_s'],'turnDuration':clips['TurnLeft']['duration_s'],'attention':attention,'contact_samples':motion.contact,'contact_sample_count':241,'clips':clips}
        report['assets'][role]=asset
        (META/(role+'-motion.json')).write_text(json.dumps(asset,indent=2)+'\n')
        print('PILOT_EXPORTED',role,destination.stat().st_size,flush=True)
    # Purge all source scenes' unused datablocks; source contains many unrelated
    # islands and must not inflate the isolated editable pilot above Sites32MiB.
    used_actions={strip.action for scene,rig in pilots.values() for track in rig.animation_data.nla_tracks for strip in track.strips}
    for action in list(bpy.data.actions):
        if action not in used_actions:bpy.data.actions.remove(action)
    for _ in range(3):bpy.data.orphans_purge(do_local_ids=True,do_linked_ids=True,do_recursive=True)
    editable=ROOT/'assets/blender/jerusalem-pilot.blend';bpy.ops.wm.save_as_mainfile(filepath=str(editable),compress=True)
    report['editable_source']={'file':str(editable.relative_to(ROOT)),'bytes':editable.stat().st_size,'sha256':hashlib.sha256(editable.read_bytes()).hexdigest()}
    (META/'build-report.json').write_text(json.dumps(report,indent=2)+'\n');print('PILOT_DONE',flush=True)

if __name__=='__main__':main()
