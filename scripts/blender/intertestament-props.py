"""Three original modern Intertestament teaching comparisons; no external media.

Read INTERTESTAMENT-RESEARCH-START and IMPLEMENTATION-PLAN in full. Three
separate NT situations, not one itinerary or a comprehensive intertestamental
history. Roads are selected modern materials, never a universal Judaean four-
layer section. Coin is an original 230mm teaching disc, not a museum enlargement,
Tiberius portrait, Gospel original, Latin legend, calibrated mass or alloy. The
language comparison concerns different recipients; fixed blank writing material
is external comparison, not Paul reading. No ancient letters, numbered people,
map, administrative office, violence, flip/unroll mechanism or downloaded mesh.
Default isolated exports retain prototype metadata. The official builder sets
INTERTESTAMENT_OFFICIAL_BUILD only around this script; no other script consumes it.
Uses the existing material/mesh/xyz/new_scene/box_surface/parent_parts and
finish_static helpers. Only road/audience have one vertical teaching layer.
"""

it_wood=material('intertestament-original-matte-wood',(.325,.240,.151),.95)
it_edge=material('intertestament-original-dark-wood',(.178,.128,.079),.98)
it_soil=material('intertestament-original-selected-earth',(.374,.284,.196),1)
it_fill=material('intertestament-original-selected-fill',(.443,.354,.244),1)
it_stone_mat=material('intertestament-original-grey-stone',(.401,.409,.378),.99)
it_pale=material('intertestament-original-pale-gravel',(.533,.503,.426),1)
it_dark=material('intertestament-original-dark-gravel',(.282,.295,.278),1)
it_teal=material('intertestament-modern-comparison-teal',(.116,.310,.327),.9)
it_light=material('intertestament-modern-neutral-panel',(.611,.600,.541),.95)
it_ochre=material('intertestament-modern-comparison-ochre',(.495,.359,.183),.96)
it_silver=material('intertestament-modern-silver-grey-disc',(.545,.561,.559),.48,.76)
it_sheet=material('intertestament-modern-blank-sheet',(.773,.740,.636),.96)
it_flatmat=material('intertestament-modern-flat-material-sample',(.616,.530,.390),.98)


def it_flat(o):
    for p in o.data.polygons:p.use_smooth=False
    return o


def it_prism(name,outline,bottom,top,mat):
    n=len(outline);vs=[xyz(x,h,f) for h in [bottom,top] for x,f in outline]
    fs=[tuple(reversed(range(n))),tuple(range(n,2*n))]
    fs.extend((k,(k+1)%n,n+(k+1)%n,n+k) for k in range(n))
    return it_flat(mesh(name,vs,fs,mat,variation=.035))


def it_recess(name,x,f,width,depth,bottom,floor,rim,wall,mat):
    vs=[];fs=[(3,2,1,0)]
    for w,d,h in [(width,depth,bottom),(width,depth,rim),
                   (width-2*wall,depth-2*wall,rim),(width-2*wall,depth-2*wall,floor)]:
        vs.extend([xyz(x-w/2,h,f-d/2),xyz(x+w/2,h,f-d/2),
                   xyz(x+w/2,h,f+d/2),xyz(x-w/2,h,f+d/2)])
    for j in range(3):
        for k in range(4):fs.append((j*4+k,j*4+(k+1)%4,(j+1)*4+(k+1)%4,(j+1)*4+k))
    fs.append((12,13,14,15))
    o=it_flat(mesh(name,vs,fs,mat,variation=.055));o['inner_floor_m']=floor;o['wall_thickness_m']=wall
    return o


def it_stone(name,x,h,f,sx,sh,sf,seed,mat):
    outline=[(-.42,-.5),(.41,-.5),(.5,-.36),(.5,.40),(.37,.5),(-.41,.5),(-.5,.34),(-.5,-.38)]
    vs=[];n=len(outline);fs=[]
    for j,(hh,q) in enumerate([(0,.91),(.20,1),(.64,.98),(1,.78)]):
        for k,(xx,ff) in enumerate(outline):
            v=q*(.985+.015*sin(seed*1.73+k*2.1+j*.7))
            vs.append(xyz(x+sx*xx*v,h+sh*hh,f+sf*ff*v))
            if j:fs.append(((j-1)*n+k,(j-1)*n+(k+1)%n,j*n+(k+1)%n,j*n+k))
    fs.extend([tuple(reversed(range(n))),tuple(3*n+k for k in range(n))])
    return it_flat(mesh(name,vs,fs,mat,variation=.12))


def it_gravel_grid(prefix,x0,x1,f0,f1,height,nx,nf):
    parts=[]
    for ix in range(nx):
        for iz in range(nf):
            j=ix*nf+iz;sx=(x1-x0)/nx;sf=(f1-f0)/nf
            x=x0+sx*(ix+.5)+sx*.045*sin(j*1.9);f=f0+sf*(iz+.5)+sf*.04*cos(j*2.3)
            parts.append(it_stone(prefix,x,height,f,sx*.82,.010+.007*(.5+.5*sin(j*2.8)),sf*.80,j,
                                   [it_stone_mat,it_pale,it_dark][j%3]))
    return parts


def it_curved_sheet(name,profile,cx,cf,width,thickness,mat):
    # Profile is (front,height), extruded along X. True local normal thickness.
    n=len(profile);nx=8;vs=[];fs=[]
    for side in [-1,1]:
        for j in range(nx+1):
            x=cx-width/2+width*j/nx
            for i,(f,h) in enumerate(profile):
                a=Vector(profile[max(0,i-1)]);b=Vector(profile[min(n-1,i+1)])
                t=(b-a).normalized();normal=Vector((-t.y,t.x))*side*thickness/2
                vs.append(xyz(x,h+normal.y,cf+f+normal.x))
    count=(nx+1)*n
    for side in [0,1]:
        for j in range(nx):
            for i in range(n-1):
                q=side*count+j*n+i;face=(q,q+1,q+n+1,q+n)
                fs.append(tuple(reversed(face)) if side else face)
    edge=list(range(n))+[j*n+n-1 for j in range(1,nx+1)]+[nx*n+i for i in range(n-2,-1,-1)]+[j*n for j in range(nx-1,0,-1)]
    for a,b in zip(edge,edge[1:]+edge[:1]):fs.append((a,b,b+count,a+count))
    o=mesh(name,vs,fs,mat,variation=.018);o['normal_thickness_m']=thickness
    return o


def it_disc_relief(x,y,face):
    r=math.hypot(x,y)
    if face==0:
        # Authored generic angular silhouette, deliberately no historic hairstyle.
        poly=[(-.038,-.055),(.021,-.055),(.025,-.036),(.041,-.026),(.039,-.009),(.054,-.004),(.049,.006),(.039,.019),(.034,.042),(.018,.059),(-.006,.062),(-.028,.051),(-.037,.029),(-.032,.004),(-.022,-.022),(-.030,-.040)]
        inside=False;dist=1
        for a,b in zip(poly,poly[1:]+poly[:1]):
            if (a[1]>y)!=(b[1]>y) and x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]:inside=not inside
            ab=Vector((b[0]-a[0],b[1]-a[1]));ap=Vector((x-a[0],y-a[1]));t=max(0,min(1,ap.dot(ab)/ab.length_squared));dist=min(dist,(ap-ab*t).length)
        q=max(0,min(1,(dist if inside else -dist)/.004+.5));head=.0028*q*q*(3-2*q)
        band=.00065*max(0,1-abs(r-.095)/.005)
        return head+band
    # Original nonalphabetic modern geometry, not a Roman reverse person/die.
    circle=.0015*max(0,1-abs(r-.052)/.009)
    window=.0013*max(0,1-abs(x+.018)/.034)*max(0,1-abs(y-.010)/.045)
    return circle+window+.00065*max(0,1-abs(r-.095)/.005)


def it_coin_disc():
    n=160;nr=24;vs=[];fs=[];ringsize=1+nr*n
    for face in [0,1]:
        sign=1 if face==0 else -1
        vs.append(xyz(0,.185,sign*(.007+it_disc_relief(0,0,face))))
        for j in range(1,nr+1):
            r=.115*j/nr
            for k in range(n):
                a=2*pi*k/n;x=r*cos(a);y=r*sin(a)
                vs.append(xyz(x,.185+y,sign*(.007+it_disc_relief(x,y,face))))
        off=face*ringsize
        for k in range(n):
            tri=(off,off+1+k,off+1+(k+1)%n);fs.append(tri if face else tuple(reversed(tri)))
        for j in range(nr-1):
            for k in range(n):
                q=off+1+j*n+k;qn=off+1+j*n+(k+1)%n
                quad=(q,qn,qn+n,q+n);fs.append(quad if face else tuple(reversed(quad)))
    for k in range(n):
        a=1+(nr-1)*n+k;b=1+(nr-1)*n+(k+1)%n;fs.append((a,b,b+ringsize,a+ringsize))
    o=mesh('coin-original-continuous-two-faced-disc',vs,fs,it_silver,variation=.016)
    o['diameter_m']=.230;o['base_thickness_m']=.014
    o['interpretation']='Original modern profile and reverse relief; no ancient writing, historic portrait, museum enlargement or authenticated Gospel coin'
    return o


def it_coin_cradle(name,indices):
    points=sorted([(.115*cos(k*2*pi/160),.185+.115*sin(k*2*pi/160)) for k in indices])
    outline=[(points[0][0],.022)]+points+[(points[-1][0],.022)];vs=[];fs=[];n=len(outline)
    for f in [-.013,.013]:vs.extend(xyz(x,h,f) for x,h in outline)
    fs.extend([tuple(reversed(range(n))),tuple(range(n,2*n))])
    for k in range(n):fs.append((k,(k+1)%n,n+(k+1)%n,n+k))
    return it_flat(mesh(name,vs,fs,it_edge,variation=.05))


def it_finish(scene,aid,interpretation,layer=None,lift=0):
    bpy.context.window.scene=scene;bpy.context.view_layer.update();d=bpy.context.evaluated_depsgraph_get();d.update()
    points=[o.evaluated_get(d).matrix_world@v.co for o in scene.objects if o.type=='MESH' for v in o.evaluated_get(d).data.vertices]
    lo=[min(p[i] for p in points) for i in range(3)];hi=[max(p[i] for p in points) for i in range(3)]
    finish_static(scene,aid,round(hi[2],6))
    report['assets'][aid].update({'prototype_only':not bool(globals().get('INTERTESTAMENT_OFFICIAL_BUILD',False)),'isolated_provenance':'root-approved Intertestament17 brief, isolated original geometry; not yet official',
        'source_scene':scene.name,'bottom_m':lo[2],'top_m':hi[2],'dimensions_blender_xyz_m':[hi[i]-lo[i] for i in range(3)],
        'interpretation':interpretation,'semantic_groups':[o.name for o in scene.objects if o.type=='EMPTY'],
        'modern_removable_layer':layer,'modern_layer_translation_gltf_xyz_m':[0,lift,0] if layer else None,
        'runtime_operations':1 if layer else 0,'units':'metres; Blender +Z / glTF +Y'})
    assert abs(lo[2])<1e-6 and hi[2]+lift<=.8
    assert report['assets'][aid]['triangles']<=30000 and report['assets'][aid]['bytes']<=1600000


# Road: selected earth/aggregate lens and separate alternative, not four strata.
s=new_scene('Intertestament — original road drainage and selected section comparison')
parent_parts('intertestament-road-fixed-base',[box_surface('road-modern-bottom',(0,.011,0),(1.20,.022,.70),it_wood,.004)])
parent_parts('intertestament-road-fixed-roadbed',[it_recess('road-fixed-true-section-bed',0,0,1.08,.320,.022,.085,.130,.016,it_soil)])
fixed=[]
for x0,x1 in [(-.524,-.341),(.001,.524)]:
    fixed.append(box_surface('road-fixed-selected-earth-body',((x0+x1)/2,.117,0),(x1-x0,.064,.288),it_fill,0))
    fixed.extend(it_gravel_grid('road-fixed-grounded-surface-fragment',x0+.004,x1-.004,-.139,.139,.149,max(3,round((x1-x0)/.045)),6))
parent_parts('intertestament-road-fixed-selected-surface',fixed)
carrier=box_surface('road-modern-solid-section-carrier',(-.170,.090,0),(.330,.010,.276),it_teal,0)
fill=box_surface('road-selected-fill-volume',(-.170,.122,0),(.328,.054,.274),it_fill,0)
selected=it_gravel_grid('road-selected-grounded-surface-fragment',-.328,-.012,-.132,.132,.149,7,6)
layer=parent_parts('intertestament-road-modern-cutaway-layer',[
    parent_parts('intertestament-road-modern-section-carrier',[carrier]),
    parent_parts('intertestament-road-selected-fill-sample',[fill]),
    parent_parts('intertestament-road-selected-surface-segment',selected)])
layer['motion_gltf_xyz_m']=[0,.16,0];layer['teaching_lift_m']=.16
layer['interpretation']='Modern vertical selected-section carrier, not ancient removable road machinery'
for label,f in [('near',.218),('far',-.218)]:
    parent_parts('intertestament-road-fixed-drain-'+label,[
        box_surface('road-drain-bearing-foundation',(0,.0295,f),(1.08,.015,.091),it_soil,0),
        it_recess('road-real-open-drain-'+label,0,f,1.08,.091,.037,.055,.125,.018,it_stone_mat)])
alt=[box_surface('road-independent-alternative-bearing',(.290,.030,-.306),(.250,.016,.064),it_teal,.001)]
alt.extend(it_gravel_grid('road-alternative-grounded-gravel',.173,.407,-.332,-.280,.038,6,2))
parent_parts('intertestament-road-alternative-surface-sample',alt)
parent_parts('intertestament-road-modern-administration-card',[
    box_surface('road-modern-blank-admin-card',(-.320,.025,.306),(.30,.006,.060),it_light,.001),
    box_surface('road-modern-blank-admin-card-edge',(-.477,.026,.306),(.012,.008,.060),it_teal,.0005)])
it_finish(s,'intertestament-road','LUK2 decree/movement, separate from selected modern earth/gravel section and actual drainage. No unique Judaean four-layer road, identified itinerary, census office, checkpoint, mileage, animal, ancient text or chronological solution.',layer.name,.16)


# Coin: continuous thick original geometry, upright fixed edge cradle, orbit only.
s=new_scene('Intertestament — original two-faced modern coin observation disc')
parent_parts('intertestament-coin-modern-observation-base',[
    box_surface('coin-modern-bottom',(0,.010,0),(.650,.020,.450),it_wood,.004),
    box_surface('coin-modern-cradle-foot',(0,.021,0),(.170,.002,.070),it_teal,.0005)])
parent_parts('intertestament-coin-modern-edge-cradle',[
    it_coin_cradle('coin-left-real-edge-bearing',range(108,113)),
    it_coin_cradle('coin-right-real-edge-bearing',range(128,133))])
parent_parts('intertestament-coin-observation-disc',[it_coin_disc()])
parent_parts('intertestament-coin-modern-reference-panel',[
    box_surface('coin-modern-blank-reference-card',(0,.023,.155),(.365,.006,.090),it_light,.001),
    box_surface('coin-modern-reference-edge',(-.192,.024,.155),(.012,.008,.090),it_teal,.0005)])
it_finish(s,'intertestament-coin','MRK12 image/title question, not Tiberius portrait or unique Gospel denarius. Original 230mm,14mm teaching disc; museum 18mm/3.6g/14–37CE belong only to external source. No calibrated mass, ancient lettering, reverse-person identification, flip or removable layer.')


# Languages: two modern recipient comparisons, separately fixed blank material.
s=new_scene('Intertestament — modern audiences and separate blank writing materials')
parent_parts('intertestament-languages-fixed-base',[box_surface('languages-modern-bottom',(0,.011,0),(1.10,.022,.70),it_wood,.004)])
parent_parts('intertestament-languages-core-recess',[it_recess('languages-actual-core-recess',0,.160,.960,.290,.022,.037,.066,.012,it_teal)])
rails=[];moving=[]
for label,x,mat in [('commander',-.235,it_light),('crowd',.235,it_ochre)]:
    for f in [.100,.220]:rails.append(box_surface('languages-fixed-comparison-bearing',(x,.0445,f),(.380,.015,.018),it_edge,0))
    parts=[box_surface('languages-solid-modern-carrier',(x,.058,.160),(.420,.012,.234),mat,0)]
    n=40;outline=[(x-.135+.025*cos(k*2*pi/n),.160+.025*sin(k*2*pi/n)) for k in range(n)]
    parts.append(it_prism('languages-modern-speaking-origin',outline,.064,.081,it_teal))
    arrow=[(x-.080,.151),(x+.025,.151),(x+.025,.140),(x+.065,.160),(x+.025,.180),(x+.025,.169),(x-.080,.169)]
    parts.append(it_prism('languages-modern-direction-strip',arrow,.064,.069,it_edge))
    if label=='commander':
        outline=[(x+.105,.133),(x+.135,.133),(x+.135,.187),(x+.105,.187)]
    else:
        outline=[(x+.089,.160),(x+.149,.119),(x+.160,.130),(x+.160,.190),(x+.149,.201)]
    parts.append(it_prism('languages-modern-recipient-field-'+label,outline,.064,.083,it_teal))
    moving.append(parent_parts('intertestament-languages-modern-'+label+'-comparison',parts))
parent_parts('intertestament-languages-fixed-bearing-rails',rails)
layer=parent_parts('intertestament-languages-modern-audience-layer',moving)
layer['motion_gltf_xyz_m']=[0,.14,0];layer['teaching_lift_m']=.14
layer['interpretation']='Two separate modern recipient comparisons lift together; no historic simultaneous speech or counted people'

profile=[(-.105+.160*i/16,.075) for i in range(17)]
for i in range(1,241):
    t=i/240;a=-pi/2+4*pi*t;r=.040-.018*t
    profile.append((.055+r*cos(a),.115+r*sin(a)))
sheet=it_curved_sheet('languages-real-continuous-blank-curved-sheet',profile,-.210,-.200,.420,.0025,it_sheet)
parent_parts('intertestament-languages-blank-curved-sheet',[sheet])
cradle=[]
for f in [-.280,-.175]:cradle.append(box_surface('languages-fixed-blank-sheet-bearing',(-.210,(.022+.07375)/2,f),(.460,.07375-.022,.018),it_edge,0))
parent_parts('intertestament-languages-fixed-roll-cradle',cradle)
flatbase=box_surface('languages-fixed-flat-material-support',(.290,.037,-.205),(.270,.030,.170),it_edge,.001)
flat=box_surface('languages-real-blank-flat-material',(.290,.0535,-.205),(.240,.003,.150),it_flatmat,0)
parent_parts('intertestament-languages-blank-flat-sample',[flatbase,flat])
parent_parts('intertestament-languages-external-writing-comparison',[
    box_surface('languages-modern-external-writing-zone-strip',(-.060,.025,-.327),(.960,.006,.020),it_light,.0005)])
parent_parts('intertestament-languages-modern-zone-annotation',[
    box_surface('languages-modern-blank-core-card',(-.235,.025,.3285),(.420,.006,.035),it_light,.0005),
    box_surface('languages-modern-blank-core-card',(.235,.025,.3285),(.420,.006,.035),it_light,.0005)])
it_finish(s,'intertestament-languages','ACT21:37–40/22:1–2 recipients/languages, Greek and Hebrew as CSBT. One modern audience board layer; separately fixed true-thick blank curved/flat materials with real bearing. No Paul reading, original scroll, ancient script, language=ethnicity/citizenship or population ratio.',layer.name,.14)
