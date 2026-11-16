"""Original return-period teaching figures. Garment cuts, dyes and faces are
choices, not claimed surviving Yehud uniforms. No Roman mantle or priestly crown.
"""
return_tunic=material('return-woven-tunic',(.365,.305,.215),.99)
return_wrap=material('return-wool-shoulder-wrap',(.255,.24,.195),.99)
return_woman_cloth=material('return-long-garment',(.34,.285,.235),.99)
return_grey=material('return-age-grey-hair',(.16,.15,.125),.97)
return_crease=material('return-age-soft-crease',(.29,.175,.105),.95)

def continuous_return_arms(target,point=lambda p:p):
    # A weighted skin tube crosses the elbow continuously instead of exposing
    # the junction of separately rigid upper/forearm pieces during flexion.
    for obj in target.objects:
        if obj.type=='MESH' and obj.data.materials[0]==skin:delete_weighted(obj,['armL','armR','forearmL','forearmR'])
    for side,sign in [('L',-1),('R',1)]:
        arm=tube('return-continuous-arm-'+side,[(sign*.205,1.35,0),(sign*.242,1.25,.010),(sign*.259,1.18,.013),(sign*.268,1.115,.015),(sign*.270,1.08,.016),(sign*.274,1.02,.020),(sign*.279,.91,.024),(sign*.280,.837,.025)],[.055,.052,.047,.043,.041,.040,.029,.025],skin,sides=32)
        groups={name:arm.vertex_groups.new(name=name) for name in ['arm'+side,'forearm'+side]}
        for v in arm.data.vertices:
            fore=max(0,min(1,(1.14-v.co.z)/.10))
            for name,weight in [('arm'+side,1-fore),('forearm'+side,fore)]:
                if weight:groups[name].add([v.index],weight,'REPLACE')
            v.co=point(v.co)

return_mason_scene,return_mason_rig=clone_character(worker_scene,'Return-period mason — belted working tunic, no invented uniform')
remove_clothing(return_mason_scene);weighted_garment(return_tunic,.48);sash(return_wrap)
# A small shoulder cloth is new weighted geometry, kept clear of working hands.
vs=[];fs=[];ws=[]
for j in range(17):
    t=j/16;h=1.36-.38*t
    for n in range(9):
        u=n/8;x=-.205+u*.115;f=-.141-.006*sin(u*6*pi+t*2)
        vs.append(xyz(x,h,f));ws.append(cloth_weights(x,h,f))
        if j and n:fs.append(((j-1)*9+n-1,(j-1)*9+n,j*9+n,j*9+n-1))
obj=mesh('mason-shoulder-cloth',vs,fs,return_wrap,ws,.03);mod=obj.modifiers.new('cloth-thickness','SOLIDIFY');mod.thickness=.0025;bpy.context.view_layer.objects.active=obj;bpy.ops.object.modifier_apply(modifier=mod.name)
continuous_return_arms(return_mason_scene)
finish_type(return_mason_scene,return_mason_rig,'return-mason','return-mason.glb',1.71)

return_elder_scene,return_elder_rig=clone_character(worker_scene,'Return-period elder — aged face and new long garment')
remove_clothing(return_elder_scene);weighted_garment(return_tunic,.24);sash(return_wrap);wrap_panel(return_wrap)
for obj in return_elder_scene.objects:
    if obj.type=='MESH' and obj.data.materials[0]==hair:
        obj.data.materials[0]=return_grey
        for entry in obj.data.color_attributes['surface'].data:entry.color=return_grey.diffuse_color
# A front-only, shaped beard follows the jaw, not a ring around the entire head.
vs=[];fs=[]
for j in range(19):
    t=j/18;h=1.442+t*.091;w=.019+.042*sin(t*pi/2)
    for n in range(33):
        u=-1+n/16;x=u*w;f=.071+.021*(1-u*u)+.002*sin(n*.8+j*.55)
        if t>.67 and abs(u)<.47:h1=h-.018*(1-abs(u)/.47)
        else:h1=h
        vs.append(xyz(x,h1,f))
        if j and n:fs.append(((j-1)*33+n-1,(j-1)*33+n,j*33+n,j*33+n-1))
mesh('elder-shaped-front-beard',vs,fs,return_grey,[{'head':1}]*len(vs),.06)
for sign in [-1,1]:
    for j in range(2):tube('elder-eye-crease',[(sign*.017,1.571-j*.006,.079),(sign*.034,1.568-j*.006,.080),(sign*.052,1.570-j*.006,.071)],[.0009,.001,.0007],return_crease,'head',6)
continuous_return_arms(return_elder_scene)
finish_type(return_elder_scene,return_elder_rig,'return-elder','return-elder.glb',1.71)

return_woman_scene,return_woman_rig=clone_character(worker_scene,'Return-period woman — long garment and separate shoulder covering')
remove_clothing(return_woman_scene);reshape_character(return_woman_scene,return_woman_rig,woman_point)
weighted_garment(return_woman_cloth,.18,point=woman_point);sash(return_wrap,woman_point);head_shawl(return_wrap,woman_point,short=True)
continuous_return_arms(return_woman_scene,woman_point)
finish_type(return_woman_scene,return_woman_rig,'return-woman','return-woman.glb',1.65)

return_child_scene,return_child_rig=clone_character(child_scene,'Return-period child — independent child proportions and belted tunic')
remove_clothing(return_child_scene);weighted_garment(return_tunic,.47,point=child_point);sash(return_wrap,child_point)
continuous_return_arms(return_child_scene,child_point)
finish_type(return_child_scene,return_child_rig,'return-child','return-child.glb',1.102)
