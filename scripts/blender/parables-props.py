"""Original modern Parables teaching comparisons. Defaults to isolated prototype metadata.
PARABLES_OFFICIAL_BUILD only changes these three reports;does not run main builder.
No full-builder import or historical-object identity. Requires original helpers
selected by build.py. Met/HUC images were not inspected or copied.
"""
p_base=material('parables-modern-dark-neutral-base',(.175,.225,.215),.98)
p_soil=material('parables-original-cut-loam',(.245,.142,.072),1)
p_compact=material('parables-original-compacted-path',(.345,.270,.174),1)
p_rock=material('parables-original-continuous-rock-bed',(.345,.360,.326),1)
p_shallow=material('parables-original-selected-shallow-soil',(.385,.237,.100),1)
p_green=material('parables-original-cereal-like-leaf',(.200,.284,.125),1)
p_straw=material('parables-original-selected-grain-head',(.490,.362,.150),1)
p_thorn=material('parables-original-woody-thorn-comparison',(.207,.145,.084),1)
p_pad=material('parables-modern-separated-counting-pads',(.345,.380,.347),.98)
p_counter=material('parables-modern-equal-neutral-counter',(.510,.369,.208),.97)
p_clay=material('parables-original-open-lamp-comparison',(.470,.246,.111),.97)
p_bottle=material('parables-original-ordinary-empty-oil-bottle',(.355,.225,.135),.99)
p_wood=material('parables-original-selected-torch-staff',(.205,.116,.051),.98)
p_cup=material('parables-original-concept-reservoir-cup',(.350,.262,.153),.98)
p_fibre=material('parables-original-unlit-absorbent-bundle',(.395,.328,.200),1)
p_stand=material('parables-explicit-modern-socket-support',(.235,.295,.280),.84,.15)

def p_box(name,cx,cf,w,d,bottom,top,mat):
    return box_surface(name,(cx,(bottom+top)/2,cf),(w,top-bottom,d),mat,0)

def p_color(o,mat,scale=.06):
    c=o.data.color_attributes.get('surface')
    if c is None:c=o.data.color_attributes.new(name='surface',type='FLOAT_COLOR',domain='POINT')
    for i,v in enumerate(o.data.vertices):
        n=1+scale*(.55*sin(v.co.x*151+v.co.y*97+v.co.z*73)+.35*sin(v.co.z*467-v.co.x*53))
        c.data[i].color=(*(max(0,min(1,a*n)) for a in mat.diffuse_color[:3]),1)

def p_union(name,obs,mat):
    # Actual original mesh union at botanical branch joins,not hidden overlap.
    main=obs[0];bpy.ops.object.select_all(action='DESELECT');main.select_set(True);bpy.context.view_layer.objects.active=main
    for other in obs[1:]:
        mod=main.modifiers.new('original-real-connected-branch-union','BOOLEAN');mod.operation='UNION';mod.solver='EXACT';mod.object=other;bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(other,do_unlink=True)
    main.name=name;p_color(main,mat,.13)
    for f in main.data.polygons:f.use_smooth=True
    return main

def p_leaf(name,base,tip,width,thickness,mat):
    # A closed original lens with finite root and tip faces,not a two-sided card.
    a=Vector(xyz(*base));b=Vector(xyz(*tip));along=(b-a).normalized();side=Vector((0,1,0));side=(side-along*side.dot(along)).normalized();normal=along.cross(side).normalized();vs=[];fs=[]
    for j in range(9):
        t=j/8;spread=max(.06,sin(pi*t))
        centre=a+(b-a)*t+Vector((0,0,.012*sin(pi*t)))
        for k in range(8):
            q=2*pi*k/8;vs.append(tuple(centre+side*width*.5*spread*cos(q)+normal*thickness*.5*spread*sin(q)))
    fs.append(tuple(reversed(range(8))))
    for j in range(8):
        for k in range(8):fs.append((j*8+k,j*8+(k+1)%8,(j+1)*8+(k+1)%8,(j+1)*8+k))
    fs.append(tuple(64+k for k in range(8)))
    return sam_mesh(name,vs,fs,mat,.10)

def p_cereal(name,x,f,bottom,height,young=False):
    stem=tube(name+'-stem',[(x,bottom,f),(x,bottom+height*.55,f),(x,bottom+height*.87,f)], [.0036,.0031,.0025],p_green,sides=10)
    obs=[stem]
    for sign,level in [(-1,.28),(1,.48)]:
        a=(x,bottom+height*level,f);b=(x+sign*(.024 if young else .034),bottom+height*(level+.24),f+.012*sign)
        obs.append(p_leaf(name+'-thick-leaf'+str(sign),a,b,.014 if young else .019,.0018,p_green))
    if not young:
        h=bottom+height*.79
        head=sam_lathe(name+'-original-not-identified-grain-head',[(0,h),(.007,h),(.012,h+.006),(.010,h+.018),(.007,h+.026),(.001,h+.030),(0,h+.030)],p_green,cx=x,cz=f,steps=16)
        # Joined as one closed plant; local head colour is a surface distinction.
        obs.append(head)
    plant=p_union(name,obs,p_green)
    if not young:
        c=plant.data.color_attributes.get('surface')
        for i,v in enumerate(plant.data.vertices):
            if v.co.z>bottom+height*.81:
                n=1+.10*sin(v.co.z*1500+v.co.x*270)
                c.data[i].color=(*(a*n for a in p_straw.diffuse_color[:3]),1)
    return plant

def p_thorn_bush(name,x,f,bottom):
    obs=[tube(name+'-stem',[(x,bottom,f),(x,bottom+.008,f),(x+.007,bottom+.055,f),(x-.003,bottom+.120,f)],[.0045,.0045,.0038,.002],p_thorn,sides=10)]
    for k,(sign,h,df) in enumerate([(-1,.040,.012),(1,.063,-.013),(-1,.082,-.012)]):
        start=(x+.004,bottom+h,f);tip=(x+sign*.045,bottom+h+.025,f+df)
        obs.append(tube(name+'-branch'+str(k),[start,tip],[.003,.0017],p_thorn,sides=8))
        for t in [.48,.78]:
            a=tuple(start[j]*(1-t)+tip[j]*t for j in range(3));b=(a[0]+sign*.007,a[1]+.017,a[2]+.005)
            obs.append(tube(name+'-thorn'+str(k)+str(t),[a,b],[.0018,.00025],p_thorn,sides=6))
    return p_union(name,obs,p_thorn)

def p_cut_root_marks(o,cx,cf,w,d,bottom,top,mat):
    # Vertex-colour schematic on the real section face. No physical root mesh.
    c=o.data.color_attributes.get('surface')
    for i,v in enumerate(o.data.vertices):
        if abs(v.co.y+cf+d/2)<1e-5:
            x=v.co.x;h=v.co.z
            bands=min(abs(x-(cx+.035*sin((top-h)*23)+offset)) for offset in [-w*.23,w*.18])
            if bands<.010 and bottom+.01<h<top-.003:c.data[i].color=(.56,.40,.20,1)

def p_section_soil(name,cx,cf,w,d,bottom,top,mat,roots=False):
    # Subdivided front/back allow real-material stratification and schematic
    # colour roots without extra thin geometry. All side/floor caps are closed.
    nx,ny,nz=24,2,14;vs=[];fs=[];lookup={}
    def v(i,j,k):
        key=(i,j,k)
        if key not in lookup:lookup[key]=len(vs);vs.append(xyz(cx-w/2+w*i/nx,bottom+(top-bottom)*k/nz,cf-d/2+d*j/ny))
        return lookup[key]
    for k in range(nz):
        for i in range(nx):
            fs.extend([(v(i,0,k),v(i+1,0,k),v(i+1,0,k+1),v(i,0,k+1)),(v(i,ny,k),v(i,ny,k+1),v(i+1,ny,k+1),v(i+1,ny,k))])
    for k in range(nz):
        for j in range(ny):fs.extend([(v(0,j,k),v(0,j,k+1),v(0,j+1,k+1),v(0,j+1,k)),(v(nx,j,k),v(nx,j+1,k),v(nx,j+1,k+1),v(nx,j,k+1))])
    for j in range(ny):
        for i in range(nx):fs.extend([(v(i,j,0),v(i,j+1,0),v(i+1,j+1,0),v(i+1,j,0)),(v(i,j,nz),v(i+1,j,nz),v(i+1,j+1,nz),v(i,j+1,nz))])
    o=sam_mesh(name,vs,fs,mat,.17,False)
    if roots:p_cut_root_marks(o,cx,cf,w,d,bottom,top,mat)
    return o

def p_finish(s,aid,meaning,layer=None,offset=None):
    bpy.context.window.scene=s;bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get();deps.update();ps=[o.evaluated_get(deps).matrix_world@v.co for o in s.objects if o.type=='MESH' for v in o.evaluated_get(deps).data.vertices];lo=[min(v[k] for v in ps) for k in range(3)];hi=[max(v[k] for v in ps) for k in range(3)]
    finish_static(s,aid,hi[2]);report['assets'][aid].update({'prototype_only':not bool(globals().get('PARABLES_OFFICIAL_BUILD',False)),'source_scene':s.name,'bottom_m':lo[2],'top_m':hi[2],'dimensions_blender_xyz_m':[hi[k]-lo[k] for k in range(3)],'semantic_groups':[o.name for o in s.objects if o.type=='EMPTY'],'main_layer':layer,'translation_gltf_xyz_m':offset,'runtime_operations':1 if layer else 0,'interpretation':meaning,'units':'metres;BlenderZup/glTFYup'})
    assert abs(lo[2])<1e-6 and report['assets'][aid]['triangles']<=30000 and report['assets'][aid]['bytes']<=1600000

def p_build_soil():
    s=new_scene('Parables — modern soil depth and receiving comparison')
    parent_parts('parables-soil-modern-base',[p_box('soil-real-base',0,0,1.15,.75,0,.025,p_base)])
    parent_parts('parables-soil-fixed-compacted-path',[p_section_soil('soil-compact-road-section',-.4375,-.030,.190,.48,.025,.087,p_compact)])
    rock=p_section_soil('soil-continuous-real-rock-bed',-.1925,0,.250,.56,.025,.127,p_rock)
    parent_parts('parables-soil-fixed-continuous-rock-bed',[rock])
    shallow=p_section_soil('soil-twenty-mm-shallow-layer',-.1925,0,.250,.56,.127,.147,p_shallow,True)
    seedlings=[p_cereal('soil-short-selected-shoot-'+str(k+1),x,f,.147,.058,True) for k,(x,f) in enumerate([(-.240,.065),(-.135,-.060)])]
    g=parent_parts('parables-soil-modern-shallow-layer',[shallow]+seedlings);g['teaching_lift_m']=.14;g['translation_gltf_xyz_m']=[0,.14,0]
    thornsoil=p_section_soil('soil-thorn-real-soil-depth',.0775,0,.240,.60,.025,.145,p_soil,True);parent_parts('parables-soil-fixed-thorn-soil',[thornsoil])
    parent_parts('parables-soil-fixed-thorn-growth',[p_thorn_bush('soil-original-thorn-shrub-'+str(k+1),x,f,.145) for k,(x,f) in enumerate([(.035,.13),(.125,-.10)])])
    deep=p_section_soil('soil-deeper-real-soil-layer',.3775,0,.310,.62,.025,.155,p_soil,True);parent_parts('parables-soil-fixed-deeper-soil',[deep])
    parent_parts('parables-soil-fixed-cereal-like-growth',[p_cereal('soil-original-cereal-like-'+str(k+1),x,f,.155,h) for k,(x,f,h) in enumerate([(.295,.16,.145),(.365,-.08,.135),(.445,.10,.140),(.490,-.18,.130)])])
    p_finish(s,'parables-soil','Four different-sized original modern comparisons,not an original contiguous field. Selected20mm shallow soil over102mm continuous rock,130mm deeper soil,schematic vertex-colour root marks and original finite-thickness plant forms. Not an identified ancient species,root excavation,agricultural prescription or yield proof. No seed enlargement modelled.','parables-soil-modern-shallow-layer',[0,.14,0])
    report['assets']['parables-soil']['nonvolumetric_root_marks']='Original section-face vertex-colour schematic only;not physical measured root geometry'
    report['assets']['parables-soil']['selected_section_depths_m']={'compacted':.062,'continuous_rock':.102,'shallow_soil':.020,'thorn_soil':.120,'deeper_soil':.130}

def p_build_flock():
    s=new_scene('Parables — modern ninety-nine and separate one reading comparison')
    parent_parts('parables-flock-modern-base',[p_box('flock-closed-real-base',0,0,1.15,.75,0,.030,p_base)])
    parent_parts('parables-flock-fixed-ninety-nine-pad',[p_box('flock-left-support-pad',-.205,0,.680,.640,.030,.065,p_pad)])
    parent_parts('parables-flock-fixed-separate-one-pad',[p_box('flock-right-separate-reading-pad',.380,0,.250,.420,.030,.065,p_pad)])
    profile=[(0,.065),(.020,.065),(.021,.066),(.021,.089),(.020,.090),(0,.090)]
    obs=[];centres=[]
    for row in range(9):
        for col in range(11):
            x=-.485+.056*col;f=-.224+.056*row;idx=len(obs)+1;obs.append(sam_lathe('flock-equal-counter-'+str(idx).zfill(3),profile,p_counter,cx=x,cz=f,steps=24));centres.append([x,.065,f])
    g=parent_parts('parables-flock-fixed-ninety-nine',[*obs]);g['actual_selected_count']=99;g['modern_arrangement']='11columns by9rows,not an ancient counting tool'
    g=parent_parts('parables-flock-fixed-separate-one',[sam_lathe('flock-equal-counter-100',profile,p_counter,cx=.380,cz=.040,steps=24)]);g['actual_selected_count']=1;g['not_returned_to_ninety_nine']=True
    p_finish(s,'parables-flock','Static modern99+1quantity comparison.100exactly equal42mm counters,not sheep miniatures,ancient counting tools,a pen or a physical return route. The separate one never moves into the99. Read onward to home,shared joy andLuke15:7. Existing animated sheep belong to the separate scene,not this asset.')
    report['assets']['parables-flock'].update({'counter_centres_x_bottom_front_m':centres+[[.380,.065,.040]],'counter_diameter_height_m':[.042,.025],'fixed_group_counts':[99,1],'minimum_selected_grid_gap_m':.014})

def p_lamp(name,cx,cf):
    # Original open reservoir with a selected extended lip. No closed wick tunnel
    # or fake black hole. Not copied from a museum image or scaled from Met.
    profile=[(0,.025),(.050,.025),(.095,.052),(.108,.078),(.110,.092),(.098,.092),(.096,.080),(.085,.057),(.040,.039),(0,.039)]
    steps=72;vs=[];loops=[];fs=[]
    for r,h in profile:
        if r==0:loops.append([len(vs)]);vs.append(xyz(cx,h,cf));continue
        lp=[]
        for k in range(steps):
            a=2*pi*k/steps;stretch=1+.30*max(0,sin(a))**12
            lp.append(len(vs));vs.append(xyz(cx+r*cos(a),h,cf+r*sin(a)*stretch))
        loops.append(lp)
    for a,b in zip(loops,loops[1:]):
        for k in range(steps):
            j=(k+1)%steps
            if len(a)==1:fs.append((a[0],b[k],b[j]))
            elif len(b)==1:fs.append((a[k],b[0],a[j]))
            else:fs.append((a[k],b[k],b[j],a[j]))
    return sam_mesh(name,vs,fs,p_clay,.10)

def p_bundle(name,cx,cf):
    # Closed unlit absorbent-material concept with actual bottom and pleated sides.
    profile=[(0,.519),(.018,.519),(.027,.525),(.028,.545),(.025,.582),(.019,.612),(.006,.620),(0,.620)];vs=[];fs=[];loops=[];n=48
    for r,h in profile:
        if r==0:loops.append([len(vs)]);vs.append(xyz(cx,h,cf));continue
        lp=[]
        for k in range(n):
            a=2*pi*k/n;rr=r*(1+.045*sin(12*a+h*27));lp.append(len(vs));vs.append(xyz(cx+rr*cos(a),h,cf+rr*sin(a)))
        loops.append(lp)
    for a,b in zip(loops,loops[1:]):
        for k in range(n):
            j=(k+1)%n
            if len(a)==1:fs.append((a[0],b[k],b[j]))
            elif len(b)==1:fs.append((a[k],b[0],a[j]))
            else:fs.append((a[k],b[k],b[j],a[j]))
    return sam_mesh(name,vs,fs,p_fibre,.16)

def p_build_light():
    s=new_scene('Parables — original unlit illumination and preparation comparison')
    parent_parts('parables-light-modern-base',[p_box('light-closed-real-base',0,0,1.15,.80,0,.025,p_base)])
    parent_parts('parables-light-fixed-open-lamp',[p_lamp('light-original-open-reservoir-lamp',-.350,.140)])
    parent_parts('parables-light-fixed-empty-oil-bottle',[sam_lathe('light-original-open-ordinary-oil-bottle',sam_pot_profile(.230,.075,.035,.025),p_bottle,cx=-.340,cz=-.190,steps=64)])
    profile=[(0,.025),(.105,.025),(.110,.030),(.110,.038),(.045,.050),(.040,.060),(.040,.145),(.0185,.145),(.0185,.055),(0,.055)]
    parent_parts('parables-light-fixed-modern-real-socket',[sam_lathe('light-explicit-modern-socket-with-inner-floor',profile,p_stand,cx=.245,cz=0,steps=64)])
    staff=sam_lathe('light-original-selected-flat-ended-staff',[(0,.055),(.018,.055),(.018,.505),(0,.505)],p_wood,cx=.245,cz=0,steps=32)
    c=staff.data.color_attributes.get('surface')
    for i,v in enumerate(staff.data.vertices):
        n=1+.065*sin(math.atan2(v.co.y,v.co.x-.245)*16)+.04*sin(v.co.z*75)
        c.data[i].color=(*(a*n*(.83 if .20<v.co.z<.34 else 1) for a in p_wood.diffuse_color[:3]),1)
    parent_parts('parables-light-fixed-staff-and-grip-zone',[staff])
    cup=[(0,.505),(.024,.505),(.047,.525),(.047,.605),(.037,.605),(.037,.529),(.020,.519),(0,.519)]
    parent_parts('parables-light-fixed-concept-open-reservoir-cup',[sam_lathe('light-original-concept-open-oil-reservoir',cup,p_cup,cx=.245,cz=0,steps=64)])
    parent_parts('parables-light-fixed-unlit-absorbent-bundle',[p_bundle('light-original-closed-pleated-absorbent-concept',.245,0)])
    p_finish(s,'parables-light','Three separated original modern functional comparisons:open extended-lip ceramic lamp,ordinary empty bottle,andunlit oil-reservoir torch concept with selected staff/grip/absorbent bundle in an explicit modern true-bottom socket support. Not a museum copy,exactMet enlargement,a Gospel original or a proven ancient wedding apparatus. No oil quantity,burning time,ignition operation or theological oil gauge. Lamp has an open lip,not a claimed closed wick channel. All static.')
    report['assets']['parables-light'].update({'selected_socket_radial_clearance_m':.0005,'selected_staff_bottom_top_m':[.055,.505],'selected_reservoir_bottom_floor_top_m':[.505,.519,.605],'selected_absorbent_bottom_top_m':[.519,.620],'museum_geometry_copied':False})

for aid,fn in [('parables-soil',p_build_soil),('parables-flock',p_build_flock),('parables-light',p_build_light)]:
    if aid in globals().get('PARABLES_BUILD_IDS',['parables-soil','parables-flock','parables-light']):fn()
