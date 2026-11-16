"""Original modern Nativity comparisons; isolated prototype by default.
Read the entire final NATIVITY-ASSET-BRIEF, RESEARCH-START and IMPLEMENTATION-
PLAN including the 17 November scope. No museum images, ancient text, portraits,
infant substitute, identified house, stable/cave claim, tools, workshop narrative
or reconstructed family possessions. Manger is empty stone by modern choice;
home is an explicitly selected 1:10 sample; half-lap is modern comparison only.
The official builder sets NATIVITY_OFFICIAL_BUILD only around this script;
default isolated execution retains prototype_only=True. Requires only existing
helpers, never imports/runs the complete project builder.
"""
nat_stone=material('nativity-original-matte-selected-stone',(.442,.418,.354),1)
nat_plaster=material('nativity-original-selected-earth-plaster',(.550,.471,.354),.99)
nat_floor=material('nativity-original-selected-floor',(.440,.371,.283),1)
nat_yard=material('nativity-original-selected-courtyard-earth',(.382,.315,.231),1)
nat_wood=material('nativity-original-selected-wood',(.317,.205,.103),.94)
nat_end=material('nativity-original-selected-cross-grain-wood',(.367,.253,.135),.96)
nat_roof=material('nativity-modern-thick-roof-comparison',(.490,.418,.307),.98)
nat_fixture=material('nativity-modern-neutral-display-base',(.462,.468,.442),.96)
nat_teal=material('nativity-modern-section-edge',(.170,.310,.315),.92)
nat_clay=material('nativity-original-ordinary-container',(.464,.286,.165),.97)


def nat_flat(o):
    for p in o.data.polygons:p.use_smooth=False
    return o


def nat_roundrect(w,d,r,arc=14,straight=14):
    # Corresponding loops share vertices at matching angles/straight fractions.
    points=[]
    corners=[(w/2-r,d/2-r,0),(-w/2+r,d/2-r,pi/2),
             (-w/2+r,-d/2+r,pi),(w/2-r,-d/2+r,3*pi/2)]
    for j,(x,f,a) in enumerate(corners):
        for k in range(arc):
            t=a+k*pi/(2*arc);points.append((x+r*cos(t),f+r*sin(t)))
        end=(x+r*cos(a+pi/2),f+r*sin(a+pi/2))
        xx,ff,aa=corners[(j+1)%4];start=(xx+r*cos(aa),ff+r*sin(aa))
        for k in range(straight):
            t=k/straight;points.append((end[0]*(1-t)+start[0]*t,end[1]*(1-t)+start[1]*t))
    return points


def nat_manger_shell():
    levels=[(0,1.00,.54,.105),(.02,1.014,.554,.112),(.06,1.04,.58,.120),
            (.10,1.065,.605,.130),(.16,1.08,.62,.135),(.24,1.09,.63,.140),
            (.34,1.10,.64,.140),(.42,1.10,.64,.140)]
    loops=[]
    for h,w,d,r in levels:loops.append([(x,h,f) for x,f in nat_roundrect(w,d,r)])
    n=len(loops[0])
    def rim(w,d,r,drop):
        return [(x,.4725+.0075*cos(2*pi*k/n)-drop,f) for k,(x,f) in enumerate(nat_roundrect(w,d,r))]
    loops.extend([rim(1.10,.64,.140,.004),rim(1.098,.638,.139,0),
                  rim(.992,.532,.086,0),rim(.990,.530,.085,.004)])
    for h,w,d,r in reversed(levels[2:]):
        loops.append([(x,h,f) for x,f in nat_roundrect(w-.110,d-.110,r-.055)])
    vs=[xyz(x,h,f) for loop in loops for x,h,f in loop];fs=[]
    fs.append(tuple(reversed(range(n))))
    for j in range(len(loops)-1):
        for k in range(n):fs.append((j*n+k,j*n+(k+1)%n,(j+1)*n+(k+1)%n,(j+1)*n+k))
    fs.append(tuple((len(loops)-1)*n+k for k in range(n)))
    o=mesh('manger-continuous-empty-stone-shell',vs,fs,nat_stone,variation=.10)
    o['interpretation']='Original modern empty stone teaching container, not an identified ancient manger or capacity claim'
    o['nominal_wall_m']=.055;o['inner_floor_m']=.060
    return o


def nat_wall(name,axis,center,lo,hi,bottom,top,depth,sign):
    # Thick closed wall with flat bearing perimeter and tiny outward faceting.
    nx=max(3,round((hi-lo)/.025));nz=max(3,round((top-bottom)/.025));vs=[];fs=[]
    for side in [0,1]:
        for j in range(nz+1):
            h=bottom+(top-bottom)*j/nz
            for i in range(nx+1):
                p=lo+(hi-lo)*i/nx;relief=0
                if side and 0<i<nx and 0<j<nz:
                    relief=.00065*(.5+.5*sin(i*1.4+j*.8))*sin(pi*i/nx)*sin(pi*j/nz)
                q=center+sign*((.5 if side else -.5)*depth+relief)
                vs.append(xyz(p,h,q) if axis=='X' else xyz(q,h,p))
    count=(nx+1)*(nz+1)
    for side in [0,1]:
        for j in range(nz):
            for i in range(nx):
                a=side*count+j*(nx+1)+i;face=(a,a+1,a+nx+2,a+nx+1)
                fs.append(face if side else tuple(reversed(face)))
    edge=list(range(nx+1))+[j*(nx+1)+nx for j in range(1,nz+1)]+[nz*(nx+1)+i for i in range(nx-1,-1,-1)]+[j*(nx+1) for j in range(nz-1,0,-1)]
    for a,b in zip(edge,edge[1:]+edge[:1]):fs.append((a,b,b+count,a+count))
    return nat_flat(mesh(name,vs,fs,nat_plaster,variation=.085))


def nat_profile_timber(name,profile,axis,width,mat):
    vs=[];fs=[];n=len(profile)
    for q in [-width/2,width/2]:
        vs.extend(xyz(p,h,q) if axis=='X' else xyz(q,h,p) for p,h in profile)
    fs=[tuple(reversed(range(n))),tuple(range(n,2*n))]
    for k in range(n):fs.append((k,(k+1)%n,n+(k+1)%n,n+k))
    o=nat_flat(mesh(name,vs,fs,mat,variation=.075))
    bpy.context.view_layer.objects.active=o;o.select_set(True)
    bevel=o.modifiers.new('original-inward-dulled-wood-edges','BEVEL');bevel.width=.0006;bevel.segments=3
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    # Original vertex-colour fibre direction; no external bitmap or inscription.
    colours=o.data.color_attributes.get('surface')
    for i,v in enumerate(o.data.vertices):
        transverse=v.co.y if axis=='X' else v.co.x
        grain=1+.065*sin(transverse*430+v.co.z*23)+.025*sin(transverse*911+v.co.z*41)
        colours.data[i].color=(*(min(1,c*grain) for c in mat.diffuse_color[:3]),1)
    return o


def nat_finish(s,aid,interpretation,layer=None):
    bpy.context.window.scene=s;bpy.context.view_layer.update();d=bpy.context.evaluated_depsgraph_get();d.update()
    pts=[o.evaluated_get(d).matrix_world@v.co for o in s.objects if o.type=='MESH' for v in o.evaluated_get(d).data.vertices]
    low=[min(p[i] for p in pts) for i in range(3)];high=[max(p[i] for p in pts) for i in range(3)]
    finish_static(s,aid,round(high[2],6))
    report['assets'][aid].update({'prototype_only':not bool(globals().get('NATIVITY_OFFICIAL_BUILD',False)),'isolated_provenance':'Root-approved final NATIVITY-ASSET-BRIEF, 2026-11-17 isolated prototype only',
        'source_scene':s.name,'bottom_m':low[2],'top_m':high[2],'dimensions_blender_xyz_m':[high[i]-low[i] for i in range(3)],
        'interpretation':interpretation,'semantic_groups':[o.name for o in s.objects if o.type=='EMPTY'],
        'modern_removable_layer':layer,'modern_layer_translation_gltf_xyz_m':[0,.18,0] if layer else None,
        'runtime_operations':1 if layer else 0,'selected_scale':.1 if aid=='nativity-home' else 1,'units':'metres; Blender +Z / glTF +Y'})
    assert abs(low[2])<1e-6 and high[2]+(.18 if layer else 0)<=.8
    assert report['assets'][aid]['triangles']<=30000 and report['assets'][aid]['bytes']<=1600000


s=new_scene('Nativity — original empty thick stone container comparison')
parent_parts('nativity-manger-continuous-empty-shell',[nat_manger_shell()])
nat_finish(s,'nativity-manger','Original modern empty stone container. LUK2 narrative is not denied by an empty object-only teaching model. Material/dimensions not stated in scripture; no infant substitute, lining, hay, animal, cover, identified lodging or removable operation.')

s=new_scene('Nativity — modern one tenth home courtyard and supported roof')
parent_parts('nativity-home-modern-base',[box_surface('home-modern-base',(0,.0125,0),(1.10,.025,.80),nat_fixture,.003)])
parent_parts('nativity-home-fixed-floor',[box_surface('home-real-room-floor',(-.17,.0325,0),(.680,.015,.550),nat_floor,0)])
parent_parts('nativity-home-fixed-courtyard',[box_surface('home-real-courtyard-floor',(.350,.0325,0),(.360,.015,.710),nat_yard,0)])
walls=[]
def wallgroup(label,axis,c,lo,hi,bottom,top,sign):
    g=parent_parts('nativity-home-fixed-wall-'+label,[nat_wall('home-original-thick-'+label,axis,c,lo,hi,bottom,top,.025,sign)])
    walls.append(g)
wallgroup('back','X',-.2625,-.51,.17,.040,.360,-1)
wallgroup('left','F',-.4975,-.25,.25,.040,.360,-1)
wallgroup('right','F',.1575,-.25,.25,.040,.360,1)
wallgroup('front-left-jamb','X',.2625,-.51,-.225,.040,.245,1)
wallgroup('front-right-jamb','X',.2625,-.115,.17,.040,.245,1)
wallgroup('front-left-fill','X',.2625,-.51,-.245,.245,.270,1)
wallgroup('front-right-fill','X',.2625,-.095,.17,.245,.270,1)
wallgroup('above-lintel','X',.2625,-.51,.17,.270,.360,1)
parent_parts('nativity-home-fixed-walls',walls)
parent_parts('nativity-home-fixed-door-lintel',[box_surface('home-real-two-ended-door-lintel',(-.17,.2575,.2625),(.150,.025,.025),nat_wood,0)])
beams=[]
for i,x in enumerate([-.43,-.27,-.11,.05]):
    beams.append(parent_parts('nativity-home-roof-beam-'+str(i+1),[box_surface('home-real-roof-bearing-beam',(x,.370,0),(.022,.020,.550),nat_wood,.0004)]))
plate=parent_parts('nativity-home-roof-thick-panel',[box_surface('home-real-thick-teaching-roof',(-.17,.390,0),(.720,.020,.590),nat_roof,.001)])
g=parent_parts('nativity-home-modern-roof-layer',beams+[plate]);g['motion_gltf_xyz_m']=[0,.18,0];g['teaching_lift_m']=.18
g['interpretation']='One modern removable panel with all its beams; fixed walls/lintel/floors/container stay; selected 1:10 teaching dimensions'
pot=pottery_profile('home-ordinary-real-hollow-storage-container',[(0,0),(.022,0),(.027,.006),(.033,.030),(.030,.060),(.022,.078),(.022,.084),(.017,.084),(.017,.078),(.024,.060),(.027,.030),(.020,.009),(0,.009)],nat_clay,n=48,tool=False)
pot.location=xyz(-.39,.040,-.14)
parent_parts('nativity-home-fixed-ordinary-comparison-object',[pot])
nat_finish(s,'nativity-home','Original modern 1:10 room/courtyard comparison for Nazareth everyday growth/return. Not original home or Bethlehem lodging. Jerusalem age12 hearing/questions is separate reading; no teachers/platform, identified family possessions, pit, tools or people.',g.name)

s=new_scene('Nativity — modern complementary half lap timber comparison')
parent_parts('nativity-joinery-modern-base',[box_surface('joinery-modern-base',(0,.015,0),(.950,.030,.620),nat_fixture,.004)])
fixedprofile=[(-.390,.030),(.390,.030),(.390,.190),(.077,.190),(.077,.110),(-.077,.110),(-.077,.190),(-.390,.190)]
upperprofile=[(-.230,.030),(-.077,.030),(-.077,.110),(.077,.110),(.077,.030),(.230,.030),(.230,.190),(-.230,.190)]
parent_parts('nativity-joinery-fixed-lower-timber',[nat_profile_timber('joinery-real-top-notched-X-timber',fixedprofile,'X',.150,nat_wood)])
g=parent_parts('nativity-joinery-modern-upper-timber',[nat_profile_timber('joinery-real-bottom-notched-Z-timber',upperprofile,'F',.150,nat_end)])
g['motion_gltf_xyz_m']=[0,.18,0];g['teaching_lift_m']=.18;g['interpretation']='One entire Z timber with bottom notch lifts; flat joint bears,2mm each-side modern clearance; no cutting/tool mechanism'
nat_finish(s,'nativity-joinery','Original modern half-lap comparison, not MRK6 specified construction, Nazareth ancient technique, original tool or childhood workshop. Fixed top notch and selected upper bottom notch; no letters/tool/weapon/cutting animation or work scoring.',g.name)
