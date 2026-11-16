"""Original child proportions and a held-vessel resident for Early Roman scenes.
Executed in build-assets.py; no external geometry or uniform adult scale shortcut.
"""

def clone_character(source,title):
    target=new_scene(title);copies={}
    for original in source.objects:
        copy=original.copy();copy.data=original.data.copy();target.collection.objects.link(copy);copies[original]=copy
    for original,copy in copies.items():
        copy.parent=copies.get(original.parent)
        if copy.type=='ARMATURE':copy.animation_data_clear()
        for modifier in copy.modifiers:
            if modifier.type=='ARMATURE':modifier.object=copies[modifier.object]
    return target,next(o for o in target.objects if o.type=='ARMATURE')

def child_point(p):
    # Deliberately non-uniform: a 0.20 m head on a 1.10 m teaching child,
    # with shorter lower limbs/arms and narrower shoulders, rather than a tiny adult.
    knots=[(0,0),(.105,.075),(.49,.295),(.88,.55),(1.04,.665),(1.35,.855),(1.47,.90),(1.52,.932),(1.582,.984),(1.71,1.10)]
    h=p.z
    for (a,b),(c,d) in zip(knots,knots[1:]):
        if h<=c:
            z=b+(h-a)/(c-a)*(d-b);break
    else:z=1.10+(h-1.71)*.8
    width=.68+.14*max(0,min(1,(h-1.35)/.12))
    depth=.66+.12*max(0,min(1,(h-1.35)/.12))
    # A fuller cheek/forehead and shallower lower face, with less nasal projection.
    if h>1.47 and p.y<-.075:depth-=.09*exp(-((h-1.545)/.045)**2)
    return Vector((p.x*width,p.y*depth,z))

def reshape_character(target,armature,point):
    for obj in target.objects:
        if obj.type=='MESH':
            for v in obj.data.vertices:v.co=point(v.co)
            obj.data.update()
    bpy.context.view_layer.objects.active=armature;armature.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
    for bone in armature.data.edit_bones:
        bone.head=point(bone.head);bone.tail=point(bone.tail)
    bpy.ops.object.mode_set(mode='OBJECT');armature.select_set(False)

def character_actions(target,armature,carrying=False,activity=None):
    global rig
    previous=rig;rig=armature
    for name,seconds in durations.items():
        action=bpy.data.actions.new(target.name.split(' — ')[0]+'-'+name)
        armature.animation_data_create();armature.animation_data.action=action
        for frame in range(1,seconds*30+2,1 if name=='Walk' else 3):
            target.frame_set(frame);t=(frame-1)/30;phase=2*pi*t/seconds
            for bone in armature.pose.bones:
                bone.rotation_mode='XYZ';bone.rotation_euler=(0,0,0);bone.location=(0,0,0)
            armature.pose.bones['spine'].rotation_euler.x=.006*sin(phase)
            armature.pose.bones['head'].rotation_euler.y=.045*sin(phase)
            if name=='Walk':
                planted_walk(t,frame)
                for s,sign in [('L',1),('R',-1)]:
                    if carrying and s=='R':continue
                    armature.pose.bones['arm'+s].rotation_euler.x=-.20*sin(phase)*sign
                    armature.pose.bones['forearm'+s].rotation_euler.x=-.10
            elif name=='LookAround':armature.pose.bones['head'].rotation_euler.y=.30*sin(phase)
            elif name in ['Talk','Interact']:
                for s,sign in [('L',1),('R',-1)]:
                    if carrying and s=='R':continue
                    armature.pose.bones['arm'+s].rotation_euler.x=-.18-.10*sin(phase+sign)
                    armature.pose.bones['forearm'+s].rotation_euler.x=-.45-.15*sin(phase+sign*.6)
                armature.pose.bones['head'].rotation_euler.x=.04*sin(phase*2)
                if name=='Interact' and activity=='labor':
                    armature.pose.bones['spine'].rotation_euler.x=.14+.045*sin(phase)
                    for s,offset in [('L',0),('R',.35)]:
                        armature.pose.bones['arm'+s].rotation_euler.x=-.52-.12*sin(phase+offset)
                        armature.pose.bones['forearm'+s].rotation_euler.x=-.65+.15*sin(phase+offset)
            for bone in armature.pose.bones:
                bone.keyframe_insert(data_path='rotation_euler',frame=frame,group=bone.name)
                if bone.name=='hips':bone.keyframe_insert(data_path='location',frame=frame,group=bone.name)
        action.use_fake_user=True
        track=armature.animation_data.nla_tracks.new();track.name=name
        strip=track.strips.new(name,1,action);strip.action_frame_start=1;strip.action_frame_end=seconds*30+1;track.mute=True
    armature.animation_data.action=None
    for bone in armature.pose.bones:bone.rotation_euler=(0,0,0);bone.location=(0,0,0)
    rig=previous

child_scene,child_rig=clone_character(worker_scene,'Judean child — original age-neutral teaching proportions')
reshape_character(child_scene,child_rig,child_point)
# Re-sculpt the face rather than retaining the adult jaw, brows and nose.
for obj in list(child_scene.objects):
    if obj.type!='MESH' or not obj.vertex_groups.get('head'):continue
    index=obj.vertex_groups['head'].index;bm=bmesh.new();bm.from_mesh(obj.data);deform=bm.verts.layers.deform.verify()
    bmesh.ops.delete(bm,geom=[v for v in bm.verts if v[deform].get(index,0)>.99],context='VERTS')
    bm.to_mesh(obj.data);bm.free()
    if not len(obj.data.vertices):bpy.data.objects.remove(obj,do_unlink=True)
before=set(child_scene.objects)
rings('child-cheek-jaw-cranium',refine_profile([(.902,.024,.027,.016),(.912,.036,.038,.014),(.937,.052,.049,.010),(.968,.065,.061,.003),(1.005,.066,.066,0),(1.035,.062,.066,-.003),(1.065,.055,.060,-.005),(1.089,.037,.042,-.005),(1.100,.004,.005,-.005)]),skin,80,0,lambda x,z,f:{'head':1})
ellipsoid('child-nose-bridge',(0,.987,.064),(.007,.015,.010),skin,'head')
ellipsoid('child-nose-tip',(0,.974,.075),(.010,.007,.010),skin,'head',20,10)
for sign in [-1,1]:
    ellipsoid('child-ear'+str(sign),(sign*.065,.997,-.003),(.012,.024,.013),skin,'head',20,12)
    ellipsoid('child-ear-recess'+str(sign),(sign*.071,.997,.003),(.004,.014,.006),lip,'head',16,10)
    ellipsoid('child-eye'+str(sign),(sign*.025,1.008,.061),(.012,.005,.006),eye,'head',24,10)
    ellipsoid('child-iris'+str(sign),(sign*.025,1.008,.067),(.0045,.0045,.0015),iris,'head',16,10)
    pupil=ellipsoid('child-pupil'+str(sign),(sign*.025,1.008,.0685),(.002,.002,.0008),iris,'head',12,8)
    for color in pupil.data.color_attributes['surface'].data:color.color=(.003,.002,.001,1)
    for edge in [-1,1]:
        tube('child-lid'+str(sign)+str(edge),[(sign*.025+(t-4)*.003,1.008+edge*sin(pi*t/8)*.0055,.064+sin(pi*t/8)*.0035) for t in range(9)],[.0017]*9,skin,'head',6)
    tube('child-brow'+str(sign),[(sign*.010,1.025,.064),(sign*.025,1.028,.063),(sign*.040,1.024,.057)],[.0015,.002,.0012],hair,'head',8)
tube('child-upper-lip',[(-.016,.951,.061),(0,.953,.068),(.016,.951,.061)],[.0013,.002,.0013],lip,'head',8)
tube('child-lower-lip',[(-.015,.949,.062),(0,.947,.068),(.015,.949,.062)],[.0013,.0023,.0013],lip,'head',8)
rings('child-hair-cap',refine_profile([(1.050,.061,.066,-.004),(1.068,.058,.063,-.005),(1.090,.040,.045,-.005),(1.102,.004,.005,-.005)]),hair,64,.0007,lambda x,z,f:{'head':1})
for obj in set(child_scene.objects)-before:
    mod=obj.modifiers.new('resident-deformation','ARMATURE');mod.object=child_rig;obj.parent=child_rig
for mat in [skin,cloth,leather,hair,eye,iris,lip]:
    objs=[o for o in child_scene.objects if o.type=='MESH' and o.data.materials[0]==mat]
    if not objs:continue
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:o.select_set(True)
    bpy.context.view_layer.objects.active=objs[0];bpy.ops.object.join();bpy.context.object.name='child-'+mat.name+'-surface'
character_actions(child_scene,child_rig)
child_rig['teachingHeight']=1.10;child_rig['proportions']='nonuniform child head/torso/limb proportions; no age claim'
export_asset(child_scene,'resident-child','judean-child.glb',True)

carrier_scene,carrier_rig=clone_character(worker_scene,'Water carrier — side-held jug with a maintained right-hand grip')
old_bind={b.name:b.matrix_local.copy() for b in carrier_rig.data.bones}
old_lengths={b.name:b.length for b in carrier_rig.data.bones}
bpy.context.view_layer.objects.active=carrier_rig;carrier_rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
for name,head,tail in [
    ('armR',(.205,1.35,0),(.36,1.13,.08)),
    ('forearmR',(.36,1.13,.08),(.34,.99,.23)),
    ('handR',(.34,.99,.23),(.34,.88,.23)),
]:
    bone=carrier_rig.data.edit_bones[name];bone.head=xyz(*head);bone.tail=xyz(*tail)
bpy.ops.object.mode_set(mode='OBJECT');carrier_rig.select_set(False)
transforms={b.name:b.matrix_local@Matrix.Diagonal((1,b.length/old_lengths[b.name],1,1))@old_bind[b.name].inverted() for b in carrier_rig.data.bones}
for obj in carrier_scene.objects:
    if obj.type!='MESH':continue
    groups={g.index:g.name for g in obj.vertex_groups}
    for vertex in obj.data.vertices:
        p=Vector((0,0,0));total=0
        for group in vertex.groups:
            if groups[group.group] in transforms:p+=(transforms[groups[group.group]]@vertex.co)*group.weight;total+=group.weight
        if total:vertex.co=p/total
    if obj.data.materials[0]==skin:
        # Replace the extended right fingers with an actual curled grasp.
        group=obj.vertex_groups.get('handR').index
        bm=bmesh.new();bm.from_mesh(obj.data);deform=bm.verts.layers.deform.verify()
        bmesh.ops.delete(bm,geom=[v for v in bm.verts if v[deform].get(group,0)>.99],context='VERTS')
        bm.to_mesh(obj.data);bm.free()
    obj.data.update()

new_hand=[]
new_hand.append(ellipsoid('carrying-palm',(.34,.949,.23),(.034,.051,.021),skin,'handR'))
for j in range(4):
    x=.34+(j-1.5)*.016;offset=abs(j-1.5)*.003
    new_hand.append(tube('curled-grip-finger-'+str(j),[(x,.930-offset,.232),(x,.919-offset,.267),(x,.895-offset,.272),(x,.894-offset,.249)], [.008,.0075,.007,.006],skin,'handR',10))
new_hand.append(tube('opposed-grip-thumb',[(.315,.968,.235),(.307,.944,.259),(.323,.929,.268)],[.011,.009,.007],skin,'handR',10))

# 0.39 m original teaching jug. Its hollow mouth, handle and supporting hand all
# deform with the SAME hand bone; dialogue never detaches the prop or swings it away.
before=set(carrier_scene.objects)
carry_profile=[(0,0),(.066,0),(.091,.025),(.119,.12),(.123,.20),(.098,.28),(.062,.32),(.053,.36),(.058,.38),(.064,.39),(.054,.39),(.046,.38),(.044,.36),(.052,.33),(.087,.282),(.110,.20),(.107,.12),(.079,.04),(.06,.025),(0,.025)]
jug=pottery_profile('carried-jug-body',carry_profile,clay,n=80)
for v in jug.data.vertices:v.co+=Vector(xyz(.34,.55,.09))
handle=tube('carried-jug-handle',[(.34,.895,.152),(.34,.922,.206),(.34,.928,.252),(.34,.897,.280),(.34,.850,.275),(.34,.810,.191)],[.012,.013,.013,.013,.013,.014],clay,sides=12)
for obj in set(carrier_scene.objects)-before:
    group=obj.vertex_groups.new(name='handR');group.add(list(range(len(obj.data.vertices))),1,'REPLACE')
    obj['heldObject']='water-jug'
    mod=obj.modifiers.new('resident-deformation','ARMATURE');mod.object=carrier_rig;obj.parent=carrier_rig
for obj in new_hand:
    mod=obj.modifiers.new('resident-deformation','ARMATURE');mod.object=carrier_rig;obj.parent=carrier_rig
character_actions(carrier_scene,carrier_rig,True)
carrier_rig['carrying']='original side-held jug; right hand remains engaged in all five actions'
export_asset(carrier_scene,'resident-carrier','judean-carrier.glb',True)
