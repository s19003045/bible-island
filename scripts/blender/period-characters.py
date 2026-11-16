"""Clothing types tied to narrative contexts, never claimed as exact ancient uniforms.
Executed by build-assets.py. Anatomy is shared; garments are authored here as new
weighted surfaces. All geometry, colours and animations remain local and editable.
"""

period_scenes={}
woman_cloth=material('roman-woman-cloth',(.31,.265,.22),.97)
woman_shawl=material('roman-shawl-cloth',(.24,.27,.25),.98)
wilderness_cloth=material('wilderness-tunic-cloth',(.40,.335,.24),.98)
wilderness_wool=material('wilderness-wool-cloth',(.20,.17,.125),.99)
iron_cloth=material('iron-tunic-cloth',(.38,.33,.25),.98)
iron_wrap=material('iron-wrap-cloth',(.28,.24,.18),.99)
linen_cloth=material('linen-garment-cloth',(.64,.59,.48),.97)
labor_cloth=material('labor-wrap-cloth',(.46,.385,.27),.99)
sash_blue=material('sash-blue',(.09,.17,.23),.98)
sash_purple=material('sash-purple',(.20,.115,.18),.98)
sash_red=material('sash-red',(.31,.10,.065),.98)

def delete_weighted(obj,bones_to_remove):
    groups=[g.index for g in obj.vertex_groups if g.name in bones_to_remove]
    if not groups:return
    bm=bmesh.new();bm.from_mesh(obj.data);layer=bm.verts.layers.deform.verify()
    bmesh.ops.delete(bm,geom=[v for v in bm.verts if sum(v[layer].get(index,0) for index in groups)>.99],context='VERTS')
    bm.to_mesh(obj.data);bm.free();obj.data.update()

def remove_clothing(target,barefoot=False):
    for obj in list(target.objects):
        if obj.type!='MESH':continue
        mat=obj.data.materials[0]
        if mat==cloth or mat==mantle:
            bpy.data.objects.remove(obj,do_unlink=True)
        elif mat==leather:
            delete_weighted(obj,['hips']+(['footL','footR'] if barefoot else []))
            if not len(obj.data.vertices):bpy.data.objects.remove(obj,do_unlink=True)
        elif barefoot and mat==skin:
            # Lower each authored anatomical plantar surface to the floor after
            # removing the leather sole. Keep the ankle pivot above the foot.
            for side in ['L','R']:
                group=obj.vertex_groups.get('foot'+side)
                if not group:continue
                points=[v for v in obj.data.vertices if any(g.group==group.index and g.weight>.99 for g in v.groups)]
                if points:
                    floor=min(v.co.z for v in points)
                    for v in points:v.co.z-=floor
            obj.data.update()
    if barefoot:
        for side,sign in [('L',-1),('R',1)]:
            tube('bare-ankle-transition-'+side,[(sign*.095,.16,-.002),(sign*.095,.10,.002),(sign*.095,.054,.004)],[.031,.030,.029],skin,'shin'+side,24)

def bind_and_join(target,armature):
    bpy.context.window.scene=target
    for obj in target.objects:
        if obj.type!='MESH':continue
        if not any(m.type=='ARMATURE' for m in obj.modifiers):
            mod=obj.modifiers.new('resident-deformation','ARMATURE');mod.object=armature
        obj.parent=armature
    materials={o.data.materials[0] for o in target.objects if o.type=='MESH'}
    for mat in materials:
        objs=[o for o in target.objects if o.type=='MESH' and o.data.materials[0]==mat]
        bpy.ops.object.select_all(action='DESELECT')
        for o in objs:o.select_set(True)
        bpy.context.view_layer.objects.active=objs[0];bpy.ops.object.join();bpy.context.object.name=mat.name+'-surface'

def weighted_garment(mat,hem=.47,long_sleeve=False,point=lambda p:p):
    profile=[(hem,.262 if hem<.3 else .235,.192 if hem<.3 else .148,0),(hem+.018,.262 if hem<.3 else .236,.192 if hem<.3 else .149,0),(.60,.242 if hem<.3 else .225,.158,0),(.77,.21,.132,0),(.93,.178,.115,0),(.97,.166,.11,0),(1.02,.178,.122,0),(1.15,.20,.132,0),(1.28,.211,.128,0),(1.36,.191,.108,0),(1.39,.187,.101,0),(1.42,.065,.052,0)]
    # Remove interior duplicate levels when a short working wrap is requested.
    profile=[v for j,v in enumerate(profile) if j<2 or v[0]>hem+.018]
    created=[]
    created.append(rings('new-tunic-body',refine_profile(profile),mat,80,.0075,cloth_weights))
    created.append(rings('new-hem-seam',[(hem+.004,profile[0][1]+.002,profile[0][2]+.002,0),(hem+.013,profile[0][1]+.002,profile[0][2]+.002,0)],mat,64,.0075,cloth_weights))
    created.append(rings('new-neck-opening',[(1.414,.071,.056,0),(1.424,.064,.052,0)],mat,48,0,lambda x,z,f:{'spine':1}))
    for side,sign in [('L',-1),('R',1)]:
        if long_sleeve:
            # One continuous cloth surface crosses the elbow. Separate rigid
            # upper/fore sleeves expose a skin gap as soon as the arm bends.
            sleeve=tube('continuous-linen-sleeve-'+side,[(sign*.185,1.385,0),(sign*.210,1.35,.003),(sign*.242,1.25,.010),(sign*.261,1.16,.013),(sign*.268,1.115,.015),(sign*.270,1.08,.016),(sign*.274,1.02,.020),(sign*.279,.91,.024),(sign*.280,.837,.025)],[.035,.069,.068,.059,.054,.050,.045,.036,.031],mat,sides=32)
            groups={name:sleeve.vertex_groups.new(name=name) for name in ['arm'+side,'forearm'+side]}
            for v in sleeve.data.vertices:
                fore=max(0,min(1,(1.14-v.co.z)/.10))
                for name,weight in [('arm'+side,1-fore),('forearm'+side,fore)]:
                    if weight:groups[name].add([v.index],weight,'REPLACE')
        else:
            sleeve=rings('new-sleeve-'+side,refine_profile([(1.398,.004,.006,0),(1.38,.044,.056,0),(1.34,.070,.075,.005),(1.25,.063,.067,.01),(1.135,.054,.058,.012)]),mat,48,.003,lambda x,z,f,s=side:{'arm'+s:1},center=(sign*.205,0))
            for v in sleeve.data.vertices:v.co.x+=sign*max(0,1.36-v.co.z)*.22
        created.append(sleeve)
    for obj in created:
        for v in obj.data.vertices:v.co=point(v.co)
        obj.data.update()
    return created

def sash(mat,point=lambda p:p,coloured=False):
    created=[rings('woven-sash',[(.953,.176,.124,0),(.998,.176,.124,0)],mat,64,.0015,lambda x,z,f:{'hips':1}),tube('sash-hanging-end',[(-.01,.979,.129),(.02,.945,.146),(.025,.78,.151)],[.008,.007,.004],mat,'hips',10)]
    if coloured:
        for j,c in enumerate([sash_blue,sash_purple,sash_red]):created.append(rings('sash-colour-line-'+str(j),[(.961+j*.010,.178,.126,0),(.966+j*.010,.178,.126,0)],c,64,.001,lambda x,z,f:{'hips':1}))
    for obj in created:
        for v in obj.data.vertices:v.co=point(v.co)

def wrap_panel(mat,point=lambda p:p,edge=False):
    # A rectangular overwrap with a diagonal front fold, actual side thickness
    # and separate front/back surfaces, distinct from the Roman back mantle.
    for back in [False,True]:
        vs=[];faces=[];weights=[]
        for j in range(25):
            t=j/24
            for k in range(25):
                u=k/24;x=-.235+u*.45
                top=1.36-(0 if back else .20*u);h=top*(1-t)+(.59+.13*u)*t
                f=(-1 if back else 1)*(.155+.018*sin(t*pi)+.007*sin(u*12*pi+h))
                vs.append(tuple(point(Vector(xyz(x,h,f)))));weights.append(cloth_weights(x,h,f))
                if j and k:faces.append(((j-1)*25+k-1,(j-1)*25+k,j*25+k,j*25+k-1))
        obj=mesh('folded-overwrap-'+str(back),vs,faces,mat,weights,.045)
        mod=obj.modifiers.new('cloth-thickness','SOLIDIFY');mod.thickness=.0025;bpy.context.view_layer.objects.active=obj;bpy.ops.object.modifier_apply(modifier=mod.name)
    if edge:
        for j in range(13):
            x=-.225+j*.035;h=.59+.13*(j/13)
            obj=tube('short-selvedge-'+str(j),[(x,h,.162),(x+.004,h-.035,.165)],[.0022,.0015],mat,'hips',6)
            for v in obj.data.vertices:v.co=point(v.co)

WOMAN_SCALE=.958
def woman_point(p):
    h=p.z;factor=.92
    if h<1.08:factor=.98
    elif h>1.47:factor=.93-.025*exp(-((h-1.50)/.04)**2)
    if 1.598<h<1.615 and abs(p.x)<.06 and p.y<-.06:h=1.603+(h-1.603)*.7
    return Vector((p.x*factor,p.y*.95,h*WOMAN_SCALE))

def head_shawl(mat,point=lambda p:p,short=False):
    profile=[(1.22 if short else 1.02,.215,.17),(1.38,.17,.14),(1.48,.095,.111),(1.60,.089,.105),(1.69,.053,.069),(1.723,.003,.004)]
    vs=[];faces=[];weights=[];n=49
    for j,(h,rx,ry) in enumerate(profile):
        for k in range(n):
            a=k*pi/(n-1);x=rx*cos(a);f=-ry*sin(a)-.012
            vs.append(tuple(point(Vector(xyz(x,h,f)))));q=max(0,min(1,(h-1.38)/.12));weights.append({'head':q,'spine':1-q})
            if j and k:faces.append(((j-1)*n+k-1,(j-1)*n+k,j*n+k,j*n+k-1))
    obj=mesh('head-and-shoulder-shawl',vs,faces,mat,weights,.035)
    mod=obj.modifiers.new('shawl-thickness','SOLIDIFY');mod.thickness=.0025;bpy.context.view_layer.objects.active=obj;bpy.ops.object.modifier_apply(modifier=mod.name)

def finish_type(target,armature,asset_id,filename,height,activity=None):
    bind_and_join(target,armature);character_actions(target,armature,activity=activity)
    armature['teachingType']=asset_id;armature['clothingStatus']='original teaching choice; see assets/blender/README.md'
    export_asset(target,asset_id,filename,True);report['assets'][asset_id]['height']=height;period_scenes[asset_id]=target

# Adult woman: a long new garment, narrower shoulders and a cloth head/back panel.
# No claim that every woman covered her hair, or that this is a surviving dress.
roman_woman_scene,roman_woman_rig=clone_character(worker_scene,'Roman woman — long tunic and optional teaching shawl')
remove_clothing(roman_woman_scene);reshape_character(roman_woman_scene,roman_woman_rig,woman_point)
weighted_garment(woman_cloth,.18,point=woman_point);sash(woman_cloth,woman_point);head_shawl(woman_shawl,woman_point)
finish_type(roman_woman_scene,roman_woman_rig,'roman-woman','roman-woman.glb',1.65)

# Wilderness family clothing is a narrative type, not a fixed archaeological date.
wilderness_scene,wilderness_rig=clone_character(worker_scene,'Wilderness resident — belted tunic and folded wool overwrap')
remove_clothing(wilderness_scene);weighted_garment(wilderness_cloth,.43);sash(wilderness_cloth);wrap_panel(wilderness_wool)
finish_type(wilderness_scene,wilderness_rig,'wilderness-resident','wilderness-resident.glb',1.71)

wilderness_woman_scene,wilderness_woman_rig=clone_character(worker_scene,'Wilderness woman — long garment and coarse rectangular covering')
remove_clothing(wilderness_woman_scene);reshape_character(wilderness_woman_scene,wilderness_woman_rig,woman_point)
weighted_garment(wilderness_cloth,.18,point=woman_point);sash(wilderness_cloth,woman_point);head_shawl(wilderness_wool,woman_point,short=True);wrap_panel(wilderness_wool,woman_point)
finish_type(wilderness_woman_scene,wilderness_woman_rig,'wilderness-woman','wilderness-woman.glb',1.65)

wilderness_child_scene,wilderness_child_rig=clone_character(child_scene,'Wilderness child — child proportions and a separate overwrap')
# Keep the child's own face, bones, soles and gait, but replace its garment ensemble.
remove_clothing(wilderness_child_scene);weighted_garment(wilderness_cloth,.47,point=child_point);sash(wilderness_cloth,child_point);wrap_panel(wilderness_wool,child_point)
finish_type(wilderness_child_scene,wilderness_child_rig,'wilderness-child','wilderness-child.glb',1.102)

priest_scene,priest_rig=clone_character(worker_scene,'Ordinary priest — linen tunic sash and cloth headgear')
remove_clothing(priest_scene,barefoot=True);weighted_garment(linen_cloth,.16,long_sleeve=True);sash(linen_cloth,coloured=True)
rings('ordinary-priest-cloth-cap',refine_profile([(1.635,.083,.093,-.008),(1.68,.069,.08,-.009),(1.72,.035,.048,-.009),(1.735,.003,.004,-.009)]),linen_cloth,64,.0015,lambda x,z,f:{'head':1})
finish_type(priest_scene,priest_rig,'ordinary-priest','ordinary-priest.glb',1.735)

iron_scene,iron_rig=clone_character(worker_scene,'First Temple visitor — long belted garment and selvedged overwrap')
remove_clothing(iron_scene);weighted_garment(iron_cloth,.25);sash(iron_cloth);wrap_panel(iron_wrap,edge=True)
finish_type(iron_scene,iron_rig,'iron-resident','iron-resident.glb',1.71)

iron_woman_scene,iron_woman_rig=clone_character(worker_scene,'First Temple woman — long garment and selvedged rectangular covering')
remove_clothing(iron_woman_scene);reshape_character(iron_woman_scene,iron_woman_rig,woman_point)
weighted_garment(iron_cloth,.18,point=woman_point);sash(iron_cloth,woman_point);head_shawl(iron_wrap,woman_point);wrap_panel(iron_wrap,woman_point,edge=True)
finish_type(iron_woman_scene,iron_woman_rig,'iron-woman','iron-woman.glb',1.65)

singer_scene,singer_rig=clone_character(worker_scene,'Levitical singer — plain fine-linen teaching garment')
remove_clothing(singer_scene);weighted_garment(linen_cloth,.19,long_sleeve=True);sash(linen_cloth)
finish_type(singer_scene,singer_rig,'temple-singer','temple-singer.glb',1.71)

bronze_scene,bronze_rig=clone_character(worker_scene,'Bronze artisan — short belted garment with bare lower arms')
remove_clothing(bronze_scene);weighted_garment(iron_cloth,.54);sash(labor_cloth)
finish_type(bronze_scene,bronze_rig,'bronze-artisan','bronze-artisan.glb',1.71,activity='labor')

labor_scene,labor_rig=clone_character(worker_scene,'Brick labourer — original working wrap and uncovered torso')
remove_clothing(labor_scene,barefoot=True)
for obj in labor_scene.objects:
    if obj.type=='MESH' and obj.data.materials[0]==skin:delete_weighted(obj,['armL','armR','forearmL','forearmR'])
rings('working-waist-wrap',refine_profile([(.49,.239,.151,0),(.51,.240,.152,0),(.68,.215,.14,0),(.86,.185,.123,0),(.98,.168,.112,0)]),labor_cloth,80,.0075,cloth_weights)
sash(labor_cloth)
torso=rings('anatomical-uncovered-torso',refine_profile([(.91,.152,.105,0),(1.02,.161,.106,0),(1.12,.184,.114,0),(1.24,.203,.119,0),(1.31,.207,.114,0),(1.36,.179,.096,0),(1.42,.054,.047,0)]),skin,80,0,cloth_weights)
for v in torso.data.vertices:
    x,y,z=v.co
    if y<0:v.co.y-=.005*exp(-((abs(x)-.075)/.06)**2-((z-1.235)/.085)**2)
bm=bmesh.new();bm.from_mesh(torso.data);bmesh.ops.holes_fill(bm,edges=[e for e in bm.edges if e.is_boundary],sides=0);bm.to_mesh(torso.data);bm.free()
parts=[torso]
for side,sign in [('L',-1),('R',1)]:
    parts.append(tube('continuous-bare-arm-'+side,[(sign*.145,1.32,0),(sign*.205,1.31,0),(sign*.245,1.24,.01),(sign*.261,1.16,.013),(sign*.268,1.08,.015),(sign*.273,1.02,.019),(sign*.28,.837,.025)],[.054,.067,.055,.046,.040,.040,.026],skin,sides=32))
for arm in parts[1:]:
    bpy.context.view_layer.objects.active=torso
    union=torso.modifiers.new('continuous-shoulder-skin','BOOLEAN');union.operation='UNION';union.solver='EXACT';union.object=arm
    bpy.ops.object.modifier_apply(modifier=union.name);bpy.data.objects.remove(arm,do_unlink=True)
torso.vertex_groups.clear()
blend=torso.vertex_groups.new(name='anatomical-smoothing')
for index,(x,y,h) in enumerate([tuple(v.co) for v in torso.data.vertices]):
    weight=min(max(0,min(1,(h-.92)/.12)),max(0,min(1,(1.41-h)/.06)))
    if weight:blend.add([index],weight,'REPLACE')
smooth=torso.modifiers.new('soft-anatomical-transitions','SMOOTH');smooth.factor=.55;smooth.iterations=3;smooth.vertex_group=blend.name;bpy.ops.object.modifier_apply(modifier=smooth.name)
decimate=torso.modifiers.new('browser-surface-budget','DECIMATE');decimate.ratio=.70;bpy.ops.object.modifier_apply(modifier=decimate.name)
torso.vertex_groups.clear()
# Rebuild the final surface before assigning attributes: Boolean/decimate may
# retain custom-data layers whose handles become invalid as deform data grows.
coordinates=[tuple(v.co) for v in torso.data.vertices];faces=[tuple(p.vertices) for p in torso.data.polygons]
data=bpy.data.meshes.new('continuous-upper-body');data.from_pydata(coordinates,[],faces);data.materials.append(skin);data.update();torso.data=data
for polygon in data.polygons:polygon.use_smooth=True
groups={name:torso.vertex_groups.new(name=name) for name in ['hips','spine','armL','armR','forearmL','forearmR']}
for index,(x,y,h) in enumerate(coordinates):
    arm=max(0,min(1,(abs(x)-.155)/.065));fore=max(0,min(1,(1.115-h)/.07));side='L' if x<0 else 'R'
    spine=max(0,min(1,(h-1.02)/.16));weights={'hips':(1-spine)*(1-arm),'spine':spine*(1-arm)}
    weights['arm'+side]=arm*(1-fore);weights['forearm'+side]=arm*fore
    for name,weight in weights.items():
        if weight:groups[name].add([index],weight,'REPLACE')
color=data.color_attributes.new(name='surface',type='FLOAT_COLOR',domain='POINT')
for entry in color.data:entry.color=skin.diffuse_color
finish_type(labor_scene,labor_rig,'brick-laborer','brick-laborer.glb',1.71,activity='labor')
