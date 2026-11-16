"""Original metre-scale teaching assets. Run with Blender 4.5 LTS, no add-ons/network.

blender --background --factory-startup --python scripts/blender/build-assets.py
Editable scenes, GLB exports and a machine-readable build report are generated together.
Front is Blender -Y, exported glTF +Z. Anatomy/cloth/handles are authored surfaces.
"""
import bpy, bmesh, math, json, pathlib, hashlib, sys
from mathutils import Vector
from math import sin, cos, pi, exp

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / 'public/models'
SOURCE = ROOT / 'assets/blender'
QA = ROOT / '.qa'
for p in [OUT, SOURCE, QA]: p.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.context.preferences.filepaths.save_version=0
for s in list(bpy.data.scenes):
    if s != bpy.context.scene: bpy.data.scenes.remove(s)

def material(name, color, roughness=.86, metallic=0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    bs = m.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value = (*color, 1)
    color_node=m.node_tree.nodes.new('ShaderNodeVertexColor');color_node.layer_name='surface'
    m.node_tree.links.new(color_node.outputs['Color'],bs.inputs['Base Color'])
    bs.inputs['Roughness'].default_value = roughness
    bs.inputs['Metallic'].default_value = metallic
    return m

skin = material('skin', (.40, .235, .145), .78)
cloth = material('tunic', (.38, .29, .19), .97)
mantle = material('mantle', (.235, .27, .245), .98)
leather = material('leather', (.115, .068, .035), .9)
hair = material('hair', (.045, .029, .021), .95)
eye = material('eye-white', (.47, .42, .33), .44)
iris = material('iris', (.047, .033, .021), .55)
lip = material('lip', (.27, .13, .09), .88)
clay = material('earthenware', (.40, .205, .115), .93)
chalk = material('chalk', (.66, .59, .45), .97)

def xyz(x, h, f=0): return (x, -f, h)
def mesh(name, verts, faces, mat, weights=None, variation=0):
    data = bpy.data.meshes.new(name)
    data.from_pydata(verts, [], faces)
    data.update()
    bm = bmesh.new(); bm.from_mesh(data)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(data); bm.free()
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    data.materials.append(mat)
    for p in data.polygons: p.use_smooth = True
    color = data.color_attributes.new(name='surface', type='FLOAT_COLOR', domain='POINT')
    for i,v in enumerate(data.vertices):
        x,y,z=v.co; n=1+variation*(sin(x*137+y*63+z*91)*.55+sin(z*277+x*81)*.3)
        color.data[i].color=(*(min(1,c*n) for c in mat.diffuse_color[:3]),1)
    if weights:
        groups = {n:obj.vertex_groups.new(name=n) for n in {n for w in weights for n in w}}
        for i,w in enumerate(weights):
            for name,value in w.items():
                if value > 0: groups[name].add([i], value, 'REPLACE')
    return obj

def rings(name, profile, mat, n=48, folds=0, weight=None, center=(0,0), variation=.02):
    # profile entries: height, X radius, front/back radius, front displacement.
    vs=[]; fs=[]; ws=[]
    for j,(z,rx,ry,offset) in enumerate(profile):
        for k in range(n):
            a=2*pi*k/n
            ripple=folds*(.65*sin(12*a+z*.6)+.35*sin(21*a-z*1.8))
            x=center[0]+(rx+ripple)*cos(a)
            f=center[1]+offset+(ry+ripple*.75)*sin(a)
            vs.append(xyz(x,z,f))
            if weight: ws.append(weight(x,z,f))
            if j: fs.append(((j-1)*n+k,(j-1)*n+(k+1)%n,j*n+(k+1)%n,j*n+k))
    return mesh(name,vs,fs,mat,ws if weight else None,variation)

def ellipsoid(name, center, scale, mat, bone=None, seg=24, rows=14):
    vs=[];fs=[]
    for j in range(rows+1):
        t=pi*j/rows
        for k in range(seg):
            a=2*pi*k/seg
            vs.append(xyz(center[0]+scale[0]*sin(t)*cos(a),center[1]+scale[1]*cos(t),center[2]+scale[2]*sin(t)*sin(a)))
            if j:fs.append(((j-1)*seg+k,(j-1)*seg+(k+1)%seg,j*seg+(k+1)%seg,j*seg+k))
    return mesh(name,vs,fs,mat,[{bone:1}]*len(vs) if bone else None)

def tube(name, points, radii, mat, bone=None, sides=10):
    vs=[]; fs=[]
    pts=[Vector(xyz(*p)) for p in points]; previous_u=None
    for j,p in enumerate(pts):
        tangent=(pts[min(j+1,len(pts)-1)]-pts[max(0,j-1)]).normalized()
        if previous_u is None:
            reference=Vector((1,0,0)) if abs(tangent.x)<.85 else Vector((0,1,0))
            u=reference-tangent*reference.dot(tangent)
        else:u=previous_u-tangent*previous_u.dot(tangent)
        u.normalize();previous_u=u.copy();v=tangent.cross(u).normalized()
        for k in range(sides):
            a=k*2*pi/sides
            vs.append(tuple(p+radii[j]*(u*cos(a)+v*sin(a))))
            if j:fs.append(((j-1)*sides+k,(j-1)*sides+(k+1)%sides,j*sides+(k+1)%sides,j*sides+k))
    fs.extend([tuple(reversed(range(sides))),tuple((len(pts)-1)*sides+k for k in range(sides))])
    return mesh(name,vs,fs,mat,[{bone:1}]*len(vs) if bone else None)

def new_scene(name):
    s=bpy.data.scenes.new(name);bpy.context.window.scene=s
    s.unit_settings.system='METRIC';s.unit_settings.scale_length=1
    s.render.fps=30
    return s

scene=new_scene('Judean resident — composite adult, Early Roman setting')
rigdata=bpy.data.armatures.new('resident-skeleton')
rig=bpy.data.objects.new('resident-rig',rigdata);bpy.context.collection.objects.link(rig)
bpy.context.view_layer.objects.active=rig;rig.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
bones={
 'root':((0,0,0),(0,.15,0),None),
 'hips':((0,.88,0),(0,1.04,0),'root'),
 'spine':((0,1.04,0),(0,1.35,0),'hips'),
 'neck':((0,1.35,0),(0,1.47,0),'spine'),
 'head':((0,1.47,0),(0,1.68,0),'neck'),
}
for side,sign in [('L',-1),('R',1)]:
    bones.update({
      'arm'+side:((sign*.205,1.35,0),(sign*.27,1.08,.015),'spine'),
      'forearm'+side:((sign*.27,1.08,.015),(sign*.28,.84,.025),'arm'+side),
      'hand'+side:((sign*.28,.84,.025),(sign*.28,.73,.025),'forearm'+side),
      'thigh'+side:((sign*.092,.88,0),(sign*.095,.49,0),'hips'),
      'shin'+side:((sign*.095,.49,0),(sign*.095,.105,0),'thigh'+side),
      'foot'+side:((sign*.095,.105,0),(sign*.095,.055,.17),'shin'+side),
    })
for name,(h,t,parent) in bones.items():
    b=rigdata.edit_bones.new(name);b.head=xyz(*h);b.tail=xyz(*t)
    if parent:b.parent=rigdata.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT');rig.select_set(False)

def cloth_weights(x,z,f):
    if z>=1.02:return {'spine':min(1,(z-1.02)/.16),'hips':1-min(1,(z-1.02)/.16)}
    leg=max(0,min(.72,(.98-z)/.45)); side='L' if x<0 else 'R'
    # Half-width blend near centre prevents a rigid split down the tunic front.
    q=min(1,abs(x)/.09)
    return {'hips':1-leg,'thigh'+side:leg*(.5+.5*q),'thigh'+('R' if side=='L' else 'L'):leg*(.5-.5*q)}

exec(compile((ROOT/'scripts/blender/resident-refinement.py').read_text(),str(ROOT/'scripts/blender/resident-refinement.py'),'exec'),globals())

# Knee-length woven tunic: shaped shoulder opening, tied waist and gravity folds.
rings('tunic-body',refine_profile([(.47,.235,.148,0),(.49,.236,.149,0),(.60,.225,.14,0),(.77,.207,.13,0),(.93,.178,.115,0),(.97,.164,.108,0),(1.02,.176,.12,0),(1.15,.20,.13,0),(1.28,.211,.126,0),(1.36,.191,.108,0),(1.39,.187,.101,0),(1.42,.065,.052,0)]),cloth,80,.0075,cloth_weights)
rings('hem-seam',[(.476,.237,.151,0),(.487,.237,.151,0)],cloth,64,.0075,cloth_weights)
rings('neck-opening',[(1.415,.071,.055,0),(1.423,.064,.052,0)],cloth,48,0,lambda x,z,f:{'spine':1})
rings('neck',[(1.365,.054,.052,0),(1.43,.048,.046,0),(1.485,.05,.048,0)],skin,32,0,lambda x,z,f:{'neck':1})
rings('belt',[(.964,.172,.12,0),(.99,.172,.12,0)],leather,64,.001,lambda x,z,f:{'hips':1})
tube('belt-tie',[(-.008,.981,.125),(.015,.955,.137),(.012,.84,.145)],[.006,.005,.0035],leather,'hips')

for side,sign in [('L',-1),('R',1)]:
    # Deltoid and sleeve are surfaces, with a separate open cuff.
    sleeve=rings('sleeve-'+side,refine_profile([(1.398,.004,.006,0),(1.38,.044,.056,0),(1.34,.070,.075,.005),(1.25,.063,.067,.01),(1.135,.054,.058,.012)]),cloth,48,.003,lambda x,z,f,s=side:{'arm'+s:1},center=(sign*.205,0))
    for v in sleeve.data.vertices:v.co.x+=sign*max(0,1.36-v.co.z)*.22
    tube('upper-arm-'+side,[(sign*.257,1.19,.012),(sign*.268,1.08,.015)],[.047,.039],skin,'arm'+side,16)
    ellipsoid('elbow-transition-'+side,(sign*.268,1.08,.015),(.039,.041,.037),skin,'forearm'+side,seg=20,rows=12)
    tube('forearm-'+side,[(sign*.268,1.085,.015),(sign*.272,1.035,.019),(sign*.277,.96,.022),(sign*.28,.865,.025),(sign*.28,.837,.025)],[.040,.041,.035,.026,.025],skin,'forearm'+side,24)
    ellipsoid('palm-'+side,(sign*.28,.799,.025),(.034,.060,.021),skin,'hand'+side)
    for j in range(4):
        x=sign*.28+(j-1.5)*.016
        length=[.070,.081,.076,.058][j]
        tube('finger-'+side+str(j),[(x,.775,.026),(x,.75,.03),(x,.775-length,.039)],[.008,.007,.0055],skin,'hand'+side,8)
    tube('thumb-'+side,[(sign*.25,.823,.032),(sign*.231,.787,.043),(sign*.233,.761,.06)],[.011,.01,.007],skin,'hand'+side,10)
    tube('calf-'+side,[(sign*.095,.51,0),(sign*.095,.34,-.006),(sign*.095,.095,.002)],[.057,.055,.030],skin,'shin'+side,20)
    adult_foot(side,sign)

# Continuous shaped cranium and face. A non-spherical jaw, cheekbones, brow and muzzle
# replace the prior ball head; ears, eyelids, lips and nose are separately sculpted.
headprof=[(1.466,.034,.039,.025),(1.48,.047,.047,.028),(1.505,.064,.061,.013),(1.54,.076,.078,.002),(1.58,.079,.087,-.002),(1.62,.076,.085,-.005),(1.66,.067,.074,-.008),(1.69,.047,.053,-.009),(1.706,.004,.005,-.009)]
head_surface=rings('head-sculpt',refine_profile(headprof),skin,80,0,lambda x,z,f:{'head':1});refine_face(head_surface)
ellipsoid('nose-bridge',(0,1.565,.084),(.011,.027,.014),skin,'head')
ellipsoid('nose-tip',(0,1.539,.098),(.015,.011,.014),skin,'head',24,12)
for sign in [-1,1]:
    ellipsoid('nostril-wing'+str(sign),(sign*.013,1.536,.091),(.009,.007,.009),skin,'head',16,8)
    ellipsoid('nostril'+str(sign),(sign*.010,1.532,.101),(.003,.0018,.002),lip,'head',12,6)
    ellipsoid('ear'+str(sign),(sign*.079,1.564,-.003),(.016,.032,.018),skin,'head',20,12)
    ellipsoid('inner-ear'+str(sign),(sign*.087,1.563,.006),(.006,.020,.009),lip,'head',16,10)
    # Eyes stay small within the adult 225 mm head. No oversized cartoon eyeballs.
    ellipsoid('eye'+str(sign),(sign*.031,1.582,.075),(.0145,.0055,.008),eye,'head',24,10)
    ellipsoid('iris'+str(sign),(sign*.031,1.582,.082),(.006,.006,.002),iris,'head',16,10)
    pupil=ellipsoid('pupil'+str(sign),(sign*.031,1.582,.084),(.0025,.0025,.001),iris,'head',16,10)
    for c in pupil.data.color_attributes['surface'].data:c.color=(.003,.002,.001,1)
    for edge in [-1,1]:
        pts=[(sign*.031+(t-4)*.0036,1.582+edge*sin(pi*t/8)*.006,.079+sin(pi*t/8)*.004) for t in range(9)]
        tube('eyelid'+str(sign)+str(edge),pts,[.0025]*9,skin,'head',6)
    tube('brow'+str(sign),[(sign*.012,1.602,.079),(sign*.031,1.608,.077),(sign*.052,1.600,.066)],[.0035,.004,.002],hair,'head',8)
tube('upper-lip',[(-.025,1.512,.078),(-.010,1.516,.084),(0,1.514,.086),(.010,1.516,.084),(.025,1.512,.078)],[.002,.003,.0025,.003,.002],lip,'head',8)
tube('lower-lip',[(-.024,1.509,.079),(0,1.506,.086),(.024,1.509,.079)],[.002,.0035,.002],lip,'head',8)
rings('hair-cap',refine_profile([(1.637,.077,.086,-.008),(1.66,.071,.078,-.008),(1.69,.051,.057,-.009),(1.71,.008,.009,-.009)]),hair,64,.0008,lambda x,z,f:{'head':1})
for sign in [-1,1]:
    tube('sideburn'+str(sign),[(sign*.071,1.654,.007),(sign*.075,1.61,.013),(sign*.070,1.573,.031)],[.011,.009,.004],hair,'head',10)

# A rectangular mantle rests across the left shoulder and down the back.
vs=[];fs=[];ws=[]
for j in range(23):
    z=1.355-j*.031
    for k in range(17):
        t=k/16; x=-.20+t*.40
        f=-.142-.012*sin(t*pi)-.009*sin(t*10*pi+z)
        if j<3:f+=j*.004
        vs.append(xyz(x,z-.035*abs(t-.5)*2,f))
        ws.append(cloth_weights(x,z,f))
        if j and k:fs.append(((j-1)*17+k-1,(j-1)*17+k,j*17+k,j*17+k-1))
mantle_obj=mesh('rectangular-mantle',vs,fs,mantle,ws,.02)
sol=mantle_obj.modifiers.new('woven-thickness','SOLIDIFY');sol.thickness=.003
bpy.context.view_layer.objects.active=mantle_obj;bpy.ops.object.modifier_apply(modifier=sol.name)

# Join by material reduces browser draw calls while keeping deformation weights.
for mat in [skin,cloth,mantle,leather,hair,eye,iris,lip]:
    objs=[o for o in scene.objects if o.type=='MESH' and o.data.materials[0]==mat]
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:o.select_set(True)
    bpy.context.view_layer.objects.active=objs[0];bpy.ops.object.join()
    obj=bpy.context.object;obj.name=mat.name+'-surface'
    mod=obj.modifiers.new('resident-deformation','ARMATURE');mod.object=rig
    obj.parent=rig

actions=[]
durations={'Idle':4,'Walk':1,'LookAround':5,'Interact':3,'Talk':3}
for name,seconds in durations.items():
    action=bpy.data.actions.new(name);rig.animation_data_create();rig.animation_data.action=action
    for frame in range(1,seconds*30+2,1 if name=='Walk' else 3):
        scene.frame_set(frame)
        t=(frame-1)/30;phase=2*pi*t/seconds
        for b in rig.pose.bones:
            b.rotation_mode='XYZ';b.rotation_euler=(0,0,0);b.location=(0,0,0)
        rig.pose.bones['spine'].rotation_euler.x=.006*sin(phase)
        rig.pose.bones['head'].rotation_euler.y=.035*sin(phase)
        if name=='Walk':
            planted_walk(t,frame)
            for s,sign in [('L',1),('R',-1)]:
                stride=sin(phase)*sign
                rig.pose.bones['arm'+s].rotation_euler.x=-.20*stride
                rig.pose.bones['forearm'+s].rotation_euler.x=-.10
        elif name=='LookAround':rig.pose.bones['head'].rotation_euler.y=.30*sin(phase)
        elif name in ['Talk','Interact']:
            for s,sign in [('L',1),('R',-1)]:
                rig.pose.bones['arm'+s].rotation_euler.x=-.18-.10*sin(phase+sign)
                rig.pose.bones['forearm'+s].rotation_euler.x=-.45-.15*sin(phase+sign*.6)
            rig.pose.bones['head'].rotation_euler.x=.04*sin(phase*2)
        for b in rig.pose.bones:
            b.keyframe_insert(data_path='rotation_euler',frame=frame,group=b.name)
            if b.name=='hips':b.keyframe_insert(data_path='location',frame=frame,group=b.name)
    action.use_fake_user=True
    track=rig.animation_data.nla_tracks.new();track.name=name
    strip=track.strips.new(name,1,action);strip.action_frame_start=1;strip.action_frame_end=seconds*30+1
    track.mute=True
    actions.append(action)
rig.animation_data.action=None
for b in rig.pose.bones:b.rotation_euler=(0,0,0);b.location=(0,0,0)

report={'blender':bpy.app.version_string,'source':'assets/blender/bible-assets.blend','assets':{}}
def export_asset(scene, asset_id, filename, animations=False):
    bpy.context.window.scene=scene;bpy.ops.object.select_all(action='DESELECT')
    objs=[o for o in scene.objects if o.type in ['MESH','ARMATURE','EMPTY']]
    for o in objs:o.select_set(True)
    armatures=[o for o in scene.objects if o.type=='ARMATURE' and o.animation_data]
    if animations:
        for armature in armatures:
            for tr in armature.animation_data.nla_tracks:tr.mute=False
    bpy.ops.export_scene.gltf(filepath=str(OUT/filename),export_format='GLB',use_selection=True,use_active_scene=True,export_animations=animations,export_animation_mode='NLA_TRACKS',export_nla_strips=True,export_force_sampling=True,export_anim_slide_to_zero=True,export_skins=animations,export_yup=True,export_apply=False,export_extras=True)
    if animations:
        for armature in armatures:
            for tr in armature.animation_data.nla_tracks:tr.mute=True
    triangles=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in objs if o.type=='MESH')
    report['assets'][asset_id]={'file':'models/'+filename,'bytes':(OUT/filename).stat().st_size,'sha256':hashlib.sha256((OUT/filename).read_bytes()).hexdigest(),'triangles':triangles,'animations':list(durations) if animations else []}

export_asset(scene,'resident','judean-resident.glb',True)

# The artisan has an actual shorter garment ensemble: the loose mantle is absent.
# It is a teaching clothing choice, not a claimed occupational uniform.
worker_scene=new_scene('Judean artisan — plain tunic without the loose mantle')
copies={}
for original in scene.objects:
    if original.type=='MESH' and original.data.materials[0]==mantle:continue
    copy=original.copy();copy.data=original.data.copy();worker_scene.collection.objects.link(copy);copies[original]=copy
for original,copy in copies.items():
    copy.parent=copies.get(original.parent)
    for modifier in copy.modifiers:
        if modifier.type=='ARMATURE':modifier.object=copies[modifier.object]
export_asset(worker_scene,'resident-worker','judean-worker.glb',True)

# Closed cross-sections include the interior, true rim thickness, foot and bottom.
pot_scene=new_scene('Domestic vessels — typological comparison, not scanned finds')
profile=[(0,0),(.12,0),(.159,.035),(.204,.11),(.232,.20),(.225,.29),(.186,.365),(.115,.415),(.087,.445),(.082,.505),(.096,.519),(.100,.535),(.092,.548),(.074,.548),(.070,.533),(.073,.516),(.065,.50),(.069,.448),(.098,.425),(.169,.372),(.207,.286),(.214,.20),(.185,.116),(.138,.055),(.10,.034),(0,.034)]

def pottery_profile(name, profile, mat, n=128, tool=True):
    vs=[];fs=[]
    for j,(r,h) in enumerate(profile):
        for k in range(n):
            a=k*2*pi/n
            d=(sin(a*3+h*11)*.0008+sin(a*7-h*29)*.00035)*(1 if r else 0)
            r1=r+d
            if tool:r1+=.00065*sin(h*420)*(1 if r>.11 else .3)
            vs.append(xyz(r1*cos(a),h,r1*sin(a)))
            if j:fs.append(((j-1)*n+k,(j-1)*n+(k+1)%n,j*n+(k+1)%n,j*n+k))
    return mesh(name,vs,fs,mat,variation=.08)

pottery_profile('wheel-thrown-jar',profile,clay)
for sign in [-1,1]:
    # Strap handles join shoulder and neck, with a flat oval section rather than rings.
    vs=[];fs=[]
    for j in range(25):
        t=j/24; x=sign*(.082+.096*sin(pi*t)+.090*t);z=.493-.143*t
        for k in range(12):
            a=k*2*pi/12
            vs.append(xyz(x+cos(a)*.011,z+cos(a)*.013,sin(a)*.025))
            if j:fs.append(((j-1)*12+k,(j-1)*12+(k+1)%12,j*12+(k+1)%12,j*12+k))
    mesh('strap-handle'+str(sign),vs,fs,clay,variation=.06)
export_asset(pot_scene,'clay-vessel','clay-vessel.glb')

stone_scene=new_scene('Chalk cup — teaching type, late Second Temple context')
stoneprof=[(0,0),(.113,0),(.142,.024),(.148,.054),(.15,.263),(.16,.292),(.16,.317),(.151,.328),(.139,.328),(.135,.312),(.132,.287),(.126,.065),(.106,.037),(0,.037)]
pottery_profile('chalk-cup',stoneprof,chalk,n=96,tool=False)
# Worked vertical fluting is a modelling choice, not an inscription or dating claim.
for j in range(28):
    a=j/28*2*pi;r=.149
    tube('tool-trace'+str(j),[(r*cos(a),.069,r*sin(a)),((r+.001)*cos(a),.16,(r+.001)*sin(a)),(.148*cos(a),.255,.148*sin(a))],[.0008,.0012,.0007],chalk,sides=5)
export_asset(stone_scene,'stone-vessel','stone-vessel.glb')

exec(compile((ROOT/'scripts/blender/resident-variants.py').read_text(),str(ROOT/'scripts/blender/resident-variants.py'),'exec'),globals())
exec(compile((ROOT/'scripts/blender/period-characters.py').read_text(),str(ROOT/'scripts/blender/period-characters.py'),'exec'),globals())
exec(compile((ROOT/'scripts/blender/return-characters.py').read_text(),str(ROOT/'scripts/blender/return-characters.py'),'exec'),globals())
exec(compile((ROOT/'scripts/blender/paul-characters.py').read_text(),str(ROOT/'scripts/blender/paul-characters.py'),'exec'),globals())
exec(compile((ROOT/'scripts/blender/abraham-characters.py').read_text(),str(ROOT/'scripts/blender/abraham-characters.py'),'exec'),globals())
exec(compile((ROOT/'scripts/blender/joseph-characters.py').read_text(),str(ROOT/'scripts/blender/joseph-characters.py'),'exec'),globals())

exec(compile((ROOT/'scripts/blender/tabernacle-props.py').read_text(),str(ROOT/'scripts/blender/tabernacle-props.py'),'exec'),globals())
exec(compile((ROOT/'scripts/blender/solomon-props.py').read_text(),str(ROOT/'scripts/blender/solomon-props.py'),'exec'),globals())
exec(compile((ROOT/'scripts/blender/herod-props.py').read_text(),str(ROOT/'scripts/blender/herod-props.py'),'exec'),globals())
exec(compile((ROOT/'scripts/blender/exodus-props.py').read_text(),str(ROOT/'scripts/blender/exodus-props.py'),'exec'),globals())
exec(compile((ROOT/'scripts/blender/jordan-props.py').read_text(),str(ROOT/'scripts/blender/jordan-props.py'),'exec'),globals())
exec(compile((ROOT/'scripts/blender/return-props.py').read_text(),str(ROOT/'scripts/blender/return-props.py'),'exec'),globals())
exec(compile((ROOT/'scripts/blender/paul-props.py').read_text(),str(ROOT/'scripts/blender/paul-props.py'),'exec'),globals())
exec(compile((ROOT/'scripts/blender/abraham-props.py').read_text(),str(ROOT/'scripts/blender/abraham-props.py'),'exec'),globals())
exec(compile((ROOT/'scripts/blender/abraham-animals.py').read_text(),str(ROOT/'scripts/blender/abraham-animals.py'),'exec'),globals())
exec(compile((ROOT/'scripts/blender/joseph-props.py').read_text(),str(ROOT/'scripts/blender/joseph-props.py'),'exec'),globals())

exec(compile((ROOT/'scripts/blender/sinai-props.py').read_text(),str(ROOT/'scripts/blender/sinai-props.py'),'exec'),globals())

bpy.context.window.scene=scene
scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'bible-assets.blend'),compress=True)
(SOURCE/'build-report.json').write_text(json.dumps(report,indent=2)+'\n')

# Preview cameras and lighting are deliberately added after saving/exporting assets.
def render_preview(s, target, location, filename, orthographic):
    bpy.context.window.scene=s
    camdata=bpy.data.cameras.new('QA-camera');cam=bpy.data.objects.new('QA-camera',camdata);s.collection.objects.link(cam)
    cam.location=location;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    camdata.type='ORTHO';camdata.ortho_scale=orthographic;s.camera=cam
    s.world=bpy.data.worlds.new('QA-world');s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs[0].default_value=(.16,.16,.16,1)
    for name,loc,energy,size in [('key',(-3,-4,5),450,4),('fill',(3,-2,3),180,3),('rim',(1,3,4),300,3)]:
        d=bpy.data.lights.new(name,'AREA');d.energy=energy;d.shape='DISK';d.size=size
        o=bpy.data.objects.new(name,d);s.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
    s.render.engine='CYCLES';s.cycles.samples=24;s.render.resolution_x=768;s.render.resolution_y=1000;s.render.resolution_percentage=100
    s.render.film_transparent=True;s.render.filepath=str(QA/filename)
    bpy.ops.render.render(write_still=True)
# Asset export and QA rendering can be run separately on memory-limited hosts.
if '--no-previews' in sys.argv:
    print('BIBLE_ASSETS_EXPORTED',len(report['assets']))
    sys.exit(0)
render_preview(scene,(0,0,.88),(2.2,-5,2.3),'blender-resident.png',1.95)
render_preview(worker_scene,(0,0,.88),(2.2,-5,2.3),'blender-resident-worker.png',1.95)
render_preview(child_scene,(0,0,.56),(2.2,-5,2.1),'blender-resident-child.png',1.33)
render_preview(carrier_scene,(.06,0,.88),(2.2,-5,2.3),'blender-resident-carrier.png',1.95)
for key,s in period_scenes.items():
    h=report['assets'][key]['height']
    render_preview(s,(0,0,h*.52),(2.2,-5,2.3),'blender-'+key+'.png',h*1.15)
render_preview(pot_scene,(0,0,.27),(1.4,-2,1.3),'blender-clay-vessel.png',.75)
render_preview(woven_scene,(0,0,.37),(1.4,-4,1.7),'blender-woven-sample.png',1.5)
render_preview(joint_scene,(0,0,.42),(1.8,-4,1.8),'blender-board-joint.png',1.03)
render_preview(basin_scene,(0,0,.65),(2.5,-4,3.4),'blender-tabernacle-basin.png',1.62)
render_preview(sea_scene,(0,0,.35),(2.3,-3,1.8),'blender-solomon-sea.png',1.35)
render_preview(capital_scene,(0,0,.40),(2,-4,1.7),'blender-pillar-capital.png',1.12)
render_preview(masonry_scene,(0,0,.30),(1.6,-3,1.5),'blender-temple-masonry.png',1.30)
render_preview(ashlar_scene,(0,0,.20),(1.4,-3,1.3),'blender-herod-stone.png',1.3)
render_preview(boundary_scene,(0,0,.34),(1.6,-3,1.6),'blender-herod-boundary.png',1.60)
render_preview(portico_scene,(0,0,.38),(1.6,-3,1.4),'blender-herod-capital.png',1.10)
render_preview(brick_scene,(-.02,0,.06),(1.2,-2,1.5),'blender-brick-mould.png',1.75)
render_preview(departure_scene,(0,0,.14),(1.1,-2,1.3),'blender-passover-kit.png',1.55)
render_preview(crossing_scene,(0,0,.20),(1.2,-1.8,4.8),'blender-crossing-ground.png',1.95)
render_preview(bed_scene,(0,0,.15),(1.6,-3,2.1),'blender-jordan-bed.png',2.5)
render_preview(carrying_scene,(0,0,.19),(1.6,-3,1.8),'blender-jordan-carrying.png',1.9)
render_preview(stones_scene,(0,0,.23),(1.6,-3,3.3),'blender-jordan-stones.png',4.3)
render_preview(return_masonry_scene,(0,0,.26),(1.6,-3,1.7),'blender-return-masonry.png',2.0)
render_preview(return_scroll_scene,(0,-.3,.07),(1.6,-3,3.4),'blender-return-scroll.png',1.9)
render_preview(return_vessels_scene,(0,0,.14),(1.4,-3,2.1),'blender-return-vessels.png',1.6)
print('BIBLE_ASSETS_COMPLETE',json.dumps(report))
