"""Letters24: original modern functional comparisons, isolated only.
All measurements/arrangements chosen for teaching; no original manuscript/tool identity.
"""
le_base=material('letters-modern-neutral-support',(.25,.32,.30),.97)
le_fiber=[material('letters-modern-papyrus-selected-tone-'+str(i),c,1) for i,c in enumerate([(.56,.40,.20),(.61,.45,.24),(.64,.47,.25),(.58,.43,.23)])]
le_wood=material('letters-original-plain-writing-wood',(.34,.21,.105),.98)
le_frame=material('letters-original-plain-wax-frame',(.25,.14,.07),.98)
le_wax=material('letters-original-blank-recessed-wax',(.32,.25,.15),.92)
le_clay=material('letters-original-plain-empty-ink-container',(.29,.17,.10),.97)
le_reed=material('letters-original-plain-ink-reed-comparison',(.48,.33,.15),1)
le_stylus=material('letters-original-plain-pointed-stylus-comparison',(.21,.17,.11),.82)
le_pad=material('letters-modern-separate-reading-ends',(.37,.40,.36),.98)
le_marker=material('letters-modern-neutral-relational-markers',(.23,.27,.25),.98)
le_arrow=material('letters-modern-direction-marker',(.18,.33,.35),.97)
le_blank=material('letters-modern-blank-document-comparison',(.60,.56,.43),1)
le_stand=material('letters-original-modern-reading-stand',(.28,.19,.11),1)

def le_box(name,x,f,w,d,bottom,top,mat):return box_surface(name,(x,(bottom+top)/2,f),(w,top-bottom,d),mat,0)

def le_prism(name,outline,bottom,top,mat):
    from mathutils.geometry import tessellate_polygon
    pts=[Vector((x,f,0)) for x,f in outline];n=len(pts);lookup={tuple(v):i for i,v in enumerate(pts)}
    ts=[tuple(v if isinstance(v,int) else lookup[tuple(v)] for v in t) for t in tessellate_polygon([pts])]
    vs=[xyz(x,h,f) for h in [bottom,top] for x,f in outline];fs=[]
    for t in ts:fs.extend([tuple(reversed(t)),tuple(n+i for i in t)])
    for k in range(n):j=(k+1)%n;fs.append((k,j,n+j,n+k))
    return sam_mesh(name,vs,fs,mat,.07,False)

def le_tray(name,cx,cf):
    # Closed full-bottom rectangular vessel: no false dark surface for the recess.
    outer=[(-.13,-.09),(.13,-.09),(.13,.09),(-.13,.09)];inner=[(-.115,-.075),(.115,-.075),(.115,.075),(-.115,.075)]
    vs=[xyz(cx+x,h,cf+f) for loop,h in [(outer,.025),(outer,.057),(inner,.057),(inner,.037)] for x,f in loop]
    fs=[(3,2,1,0),(12,13,14,15)]
    for i in range(4):j=(i+1)%4;fs.extend([(i,j,4+j,4+i),(4+i,4+j,8+j,8+i),(8+i,8+j,12+j,12+i)])
    return sam_mesh(name,vs,fs,le_frame,.09,False)

def le_flat_floor(o,h):
    for p in o.data.polygons:
        if all(abs(o.data.vertices[i].co.z-h)<1e-6 for i in p.vertices):p.use_smooth=False
    return o

def le_inkpot():
    profile=[(0,.025),(.021,.025),(.025,.028),(.0275,.037),(.0275,.060),(.0275,.075),(.0215,.075),(.0215,.060),(.0215,.038),(.018,.031),(0,.031)]
    return le_flat_floor(sam_lathe('materials-original-empty-open-ink-vessel',profile,le_clay,cx=-.05,cz=-.14,steps=48),.025)

def le_slope(name,cx,cf,w,d,bottom,top,mat,slope=-.5):
    # Top/bottom can each be a height at centre; a constant plane slope in f.
    p=[(-w/2,-d/2),(w/2,-d/2),(w/2,d/2),(-w/2,d/2)]
    vs=[xyz(cx+x,h+slope*f,cf+f) for h in [bottom,top] for x,f in p]
    fs=[(3,2,1,0),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]
    return sam_mesh(name,vs,fs,mat,.07,False)

def le_stand_support(name,cx,cf,offset):
    w=.24;d=.035;f=cf+offset;lo=.048;mid=.13-.5*offset
    p=[(-w/2,-d/2),(w/2,-d/2),(w/2,d/2),(-w/2,d/2)]
    vs=[xyz(cx+x,lo,f+v) for x,v in p]+[xyz(cx+x,mid-.5*v,f+v) for x,v in p]
    return sam_mesh(name,vs,[(3,2,1,0),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],le_stand,.08,False)

def le_finish(s,aid,meaning,layer=None):
    bpy.context.window.scene=s;bpy.context.view_layer.update();d=bpy.context.evaluated_depsgraph_get();ps=[o.evaluated_get(d).matrix_world@v.co for o in s.objects if o.type=='MESH' for v in o.evaluated_get(d).data.vertices];lo=[min(v[k] for v in ps) for k in range(3)];hi=[max(v[k] for v in ps) for k in range(3)]
    finish_static(s,aid,hi[2]);report['assets'][aid].update({'prototype_only':not globals().get('LETTERS_OFFICIAL_BUILD',False),'source_scene':s.name,'dimensions_blender_xyz_m':[hi[k]-lo[k] for k in range(3)],'bottom_m':lo[2],'top_m':hi[2],'semantic_groups':[o.name for o in s.objects if o.type=='EMPTY'],'runtime_operations':1 if layer else 0,'main_layer':layer,'translation_gltf_xyz_m':[0,.10,0] if layer else None,'interpretation':meaning,'units':'metres;BlenderZup/glTFYup'})
    assert abs(lo[2])<1e-6 and report['assets'][aid]['triangles']<=30000 and report['assets'][aid]['bytes']<=1600000

def le_materials():
    s=new_scene('Letters — original modern writing material and action comparison')
    parent_parts('letters-materials-modern-base',[le_box('materials-modern25mm-support',0,0,1.15,.80,0,.025,le_base)])
    lower=[];upper=[]
    for i in range(10):
        lower.append(le_box('materials-lower-fiber-strip-'+str(i+1),-.30,.15-.13+(i+.5)*.026,.35,.026,.025,.031,le_fiber[i%4]))
        upper.append(parent_parts('letters-materials-upper-fiber-strip-'+str(i+1),[le_box('materials-upper-fiber-strip-'+str(i+1),-.30-.175+(i+.5)*.035,.15,.035,.26,.031,.037,le_fiber[(i+1)%4])]))
    parent_parts('letters-materials-fixed-lower-fiber-layer',lower)
    g=parent_parts('letters-materials-modern-upper-fiber-layer',upper);g['teaching_lift_m']=.10;g['translation_gltf_xyz_m']=[0,.10,0];g['6mm_each_layer_exaggerated_not_original_paper_thickness']=True;g['orthogonal_glued_not_over_under_weave']=True
    parent_parts('letters-materials-fixed-thin-wood-ink-surface',[le_box('materials-original-blank8mm-wood-ink-face',.18,.22,.24,.16,.025,.033,le_wood)])
    parent_parts('letters-materials-fixed-recessed-wood-wax-frame',[le_tray('materials-original-true-recessed-wax-frame',.25,-.12)])
    parent_parts('letters-materials-fixed-blank-wax-inset',[le_box('materials-original-blank4mm-wax-inset',.25,-.12,.23,.15,.037,.041,le_wax)])
    parent_parts('letters-materials-fixed-empty-open-ink-container',[le_inkpot()])
    # Plain original functional silhouettes,not a measured ancient pen technology.
    reed=[(-.11,-.006),(.084,-.006),(.11,-.003),(.093,0),(.11,.003),(.084,.006),(-.11,.006)]
    stylus=[(-.11,-.005),(.070,-.005),(.11,0),(.070,.005),(-.11,.005)]
    for key,outline,f,mat in [('reed-ink-pen',reed,-.18,le_reed),('pointed-stylus',stylus,-.29,le_stylus)]:parent_parts('letters-materials-fixed-'+key,[le_prism('materials-original-plain-'+key,[(x-.28,z+f) for x,z in outline],.025,.033,mat)])
    le_finish(s,'letters-materials','Original modern function comparison,not Romans16originaldesk or all lettersusingallmaterials.10+10orthogonallyglued strips,NOTinterwoven;6mmeachlayerisdeliberateexaggeration. Upper10stripdescendantsliftY+.10for suspendedsectiononly.8mmblankwoodinkface,true12mmwoodbottom/32mmframe/16mmwaxsurface;emptyordinaryinkvessel6mmfloor/nominal6mmwall. Originalflatlaidreed/stylus silhouettes,not ancienttoolmeasurements. No ancientwriting/Severa/Tertius/Paul/P46copies.',g.name)

def le_delivery():
    s=new_scene('Letters — modern sent companion and recipient relation comparison')
    parent_parts('letters-delivery-modern-base',[le_box('delivery-modern30mm-support',0,0,1.15,.80,0,.030,le_base)])
    for key,x in [('dispatch',-.34),('recipient',.34)]:parent_parts('letters-delivery-fixed-'+key+'-platform',[le_box('delivery-'+key+'-thick-platform',x,-.07,.34,.45,.03,.055,le_pad)])
    profile=[(0,.055),(.020,.055),(.0225,.058),(.0225,.077),(.020,.080),(0,.080)]
    parent_parts('letters-delivery-fixed-two-neutral-sent-companion-marks',[le_flat_floor(sam_lathe('delivery-same-neutral-mark-'+str(i+1),profile,le_marker,cx=x,cz=-.07,steps=32),.055) for i,x in enumerate([-.40,-.28])])
    parent_parts('letters-delivery-fixed-single-collective-recipient-tile',[le_box('delivery-modern-one-collective-reading-tile',.34,-.07,.18,.24,.055,.071,le_blank)])
    arrow=[(-.11,-.088),(.055,-.088),(.055,-.120),(.11,-.07),(.055,-.020),(.055,-.052),(-.11,-.052)]
    parent_parts('letters-delivery-fixed-modern-direction-arrow',[le_prism('delivery-modern18mm-direction-arrow',arrow,.03,.048,le_arrow)])
    parent_parts('letters-delivery-fixed-blank-document-symbol',[le_box('delivery-modern4mm-blank-file-symbol',0,.29,.28,.16,.03,.034,le_blank)])
    le_finish(s,'letters-delivery','Staticoriginalmodernrelations:two same neutralselectedmarks forsent/companion andone collectivemarker forrecipients,not portraits/population. Col4:7-9states dispatch,companion,news,comfort;letterdelivery participationiscontextualinference,not originalhandoverphoto. Separatedplaces/arroware notmap,route/transport/time.4mmblankfileismodernsymbol,not authenticatedoriginalmaterial/form. No seal,address,coin,persontradeor movinghuman.')

def le_reading():
    s=new_scene('Letters — modern separate community reading instruction comparison')
    parent_parts('letters-reading-modern-base',[le_box('reading-modern30mm-support',0,0,1.15,.80,0,.03,le_base)])
    for key,cx in [('left',-.33),('right',.33)]:
        cf=-.05;p='letters-reading-fixed-'+key+'-'
        parent_parts(p+'foot',[le_box('reading-'+key+'-continuous-real-foot',cx,cf,.30,.32,.03,.048,le_stand)])
        for label,offset in [('front',.105),('back',-.105)]:parent_parts(p+label+'-support',[le_stand_support('reading-'+key+'-'+label+'-true-sloping-top-support',cx,cf,offset)])
        parent_parts(p+'sloped-reading-board',[le_slope('reading-'+key+'-15mm-vertical-thick-reading-board',cx,cf,.28,.26,.13,.145,le_wood)])
        parent_parts(p+'blank-document',[le_slope('reading-'+key+'-6mm-vertical-thick-blank-document',cx,cf,.23,.20,.145,.151,le_blank)])
        parent_parts(p+'listening-tile',[le_box('reading-'+key+'-modern-listening-tile',cx,.26,.18,.07,.03,.042,le_pad)])
    f=-.05;arrow=[(-.12,f),(-.065,f-.045),(-.065,f-.015),(.065,f-.015),(.065,f-.045),(.12,f),(.065,f+.045),(.065,f+.015),(-.065,f+.015),(-.065,f+.045)]
    parent_parts('letters-reading-fixed-modern-double-arrow',[le_prism('reading-modern15mm-double-direction-marker',arrow,.03,.045,le_arrow)])
    le_finish(s,'letters-reading','Staticoriginalmodern readingcomparison:two separate stands withrealfeet/frontandbacksupports/slopingboards/blankclosedfiles;not originalapostoliclectern/churchplan. Col4:16instruction firstreadthere,thenLaodicea,andreadlettercomingfromthere;not simultaneoussameletterteleport,same-roomallaudienceor independentproofinstructionswerefulfilled. Thickdoublearrowandlisteningtilesmodern;UIseparatelyexplainsreadingdirections. No inventedreturnlettertext,noP46codexidentity,no readableancientwriting.')

for fn in [le_materials,le_delivery,le_reading]:fn()
