"""Original modern Passion teaching comparisons. Isolated construction source.
All concrete forms/dimensions are selected,not a sacred cup,original tomb plan,
crucifixion engineering or copied museum image. No ritual/execution operation.
"""
pa_base=material('passion-modern-neutral-support',(.230,.290,.275),.98)
pa_clay=material('passion-original-plain-open-cup',(.385,.227,.126),.98)
pa_crust=material('passion-original-unscored-bread-crust',(.490,.294,.110),1)
pa_crumb=material('passion-original-broken-crumb-comparison',(.620,.454,.245),1)
pa_patch=material('passion-modern-separated-reading-patches',(.345,.382,.345),.97)
pa_symbol=material('passion-modern-equal-status-neutral-symbols',(.245,.275,.250),.94)
pa_rock=material('passion-original-selected-rock-surface',(.390,.363,.303),1)
pa_floor=material('passion-modern-continuous-floor-support',(.300,.344,.317),.98)

def pa_box(name,cx,cf,w,d,bottom,top,mat):return box_surface(name,(cx,(bottom+top)/2,cf),(w,top-bottom,d),mat,0)

def pa_colour(o,mat,amount=.08):
    c=o.data.color_attributes.get('surface')
    if c is None:c=o.data.color_attributes.new(name='surface',type='FLOAT_COLOR',domain='POINT')
    for i,v in enumerate(o.data.vertices):
        n=1+amount*(.55*sin(v.co.x*123+v.co.y*97+v.co.z*173)+.3*sin(v.co.x*311-v.co.z*227))
        c.data[i].color=(*(max(0,min(1,n*a)) for a in mat.diffuse_color[:3]),1)

def pa_extrude_front(name,outline,back,front,mat,rough_front=False):
    # A real closed material profile,including concave U apertures. Actual
    # triangulation is explicit;never a filled rectangular fake doorway.
    from mathutils.geometry import tessellate_polygon
    pts=[Vector((x,h,0)) for x,h in outline];tri=tessellate_polygon([pts]);lookup={tuple(v):i for i,v in enumerate(pts)};ids=[tuple(v if isinstance(v,int) else lookup[tuple(v)] for v in t) for t in tri];n=len(outline)
    vs=[xyz(x,h,f) for f in [back,front] for x,h in outline];fs=[]
    for t in ids:
        fs.append(tuple(reversed(t)))
        if rough_front:
            x=sum(outline[i][0] for i in t)/3;h=sum(outline[i][1] for i in t)/3;f=front-.0028*(.55+.45*sin(x*117+h*83));idx=len(vs);vs.append(xyz(x,h,f))
            for a,b in zip(t,t[1:]+t[:1]):fs.append((n+a,n+b,idx))
        else:fs.append(tuple(n+i for i in t))
    for k in range(n):j=(k+1)%n;fs.append((k,j,n+j,n+k))
    o=sam_mesh(name,vs,fs,mat,.12,False);return o

def pa_extrude_plan(name,outline,bottom,top,mat):
    # Reuse profile extrusion with axes rotated into the horizontal plane.
    from mathutils.geometry import tessellate_polygon
    pts=[Vector((x,f,0)) for x,f in outline];n=len(pts);lookup={tuple(v):i for i,v in enumerate(pts)};ts=[tuple(v if isinstance(v,int) else lookup[tuple(v)] for v in t) for t in tessellate_polygon([pts])];vs=[xyz(x,h,f) for h in [bottom,top] for x,f in outline];fs=[]
    for t in ts:fs.extend([tuple(reversed(t)),tuple(n+i for i in t)])
    for k in range(n):j=(k+1)%n;fs.append((k,j,n+j,n+k))
    return sam_mesh(name,vs,fs,mat,.08,False)

def pa_cup_profile():
    a=sam_bezier((.032,.025),(.052,.025),(.055,.052),(.055,.073),14)
    b=sam_bezier((.055,.073),(.055,.100),(.060,.120),(.060,.140),18)
    inside=[(p[0]+.010*n[0],p[1]+.010*n[1]) for p,n in b]
    heel=[p for p,n in sam_bezier((.025,.039),(.041,.039),(.045,.052),(.045,.073),12)]
    return [(0,.025)]+[p for p,n in a+b[1:]]+list(reversed(inside))+list(reversed(heel[:-1]))+[(0,.039)]

def pa_loaf(name,cx,cf,half=None,shift=0):
    # The whole and complementary halves have identical exterior rings. A
    # selected wavy split is shared exactly;the two closed cut caps have
    # opposite winding. This is a static modern comparison,not ritual action.
    from mathutils.geometry import tessellate_polygon
    profile=[(0,.025),(.080,.025),(.119,.031),(.125,.046),(.117,.058),(.080,.067),(0,.070)]
    start,end,steps=(0,2*pi,72) if half is None else ((0,pi,36) if half=='right' else (pi,2*pi,36));full=half is None;n=steps if full else steps+1;vs=[];loops=[];fs=[];crumb=[]
    def warped(x,f,h):return xyz(cx+x+.0045*sin(f*83)+.0015*sin(h*700+f*45)+shift,h,cf+f)
    for r,h in profile:
        if r==0:
            if half is not None and h==.025:loops.append([]);continue
            loops.append([len(vs)]);vs.append(warped(0,0,h));continue
        row=[]
        for k in range(n):
            a=start+(end-start)*k/steps;scale=1+.025*sin(3*a)+.017*sin(7*a+.6);x=r*sin(a)*scale;f=r*cos(a)*scale
            if not full and k in [0,steps]:x=0
            row.append(len(vs));vs.append(warped(x,f,h))
        loops.append(row)
    for a,b in zip(loops,loops[1:]):
        if not a:
            # A true half-foot polygon closes along the common end-to-end
            # chord. No degenerate canonical bottom axis is warped into a fold.
            ps=[Vector((vs[i][0],vs[i][1],0)) for i in b];lookup={tuple(v):i for i,v in enumerate(ps)}
            for t in tessellate_polygon([ps]):
                ids=[v if isinstance(v,int) else lookup[tuple(v)] for v in t];fs.append(tuple(b[i] for i in ids))
            continue
        for k in range(steps):
            j=(k+1)%n
            if len(a)==1:fs.append((a[0],b[k],b[j]))
            elif len(b)==1:fs.append((a[k],b[0],a[j]))
            else:fs.append((a[k],b[k],b[j],a[j]))
    if not full:
        # Canonical unwarped section boundary from positiveF bottom outward,
        # through top axis,then negativeF. Both halves share this exact cap.
        pos=[];neg=[]
        for j,(r,h) in enumerate(profile):
            if r==0:
                if loops[j]:pos.append((loops[j][0],0,h))
                continue
            ap=0;an=pi;rp=r*(1+.025*sin(3*ap)+.017*sin(7*ap+.6));rn=r*(1+.025*sin(3*an)+.017*sin(7*an+.6))
            ip=loops[j][0] if half=='right' else loops[j][-1];inn=loops[j][-1] if half=='right' else loops[j][0]
            pos.append((ip,rp,h));neg.append((inn,-rn,h))
        canonical=pos+list(reversed(neg));points=[Vector((f,h,0)) for i,f,h in canonical];lookup={tuple(v):i for i,v in enumerate(points)}
        for t in tessellate_polygon([points]):
            ids=[v if isinstance(v,int) else lookup[tuple(v)] for v in t];corners=[canonical[i][0] for i in ids];f=sum(canonical[i][1] for i in ids)/3;h=sum(canonical[i][2] for i in ids)/3;mid=len(vs);vs.append(warped(0,f,h));crumb.extend(corners+[mid])
            for a,b in zip(corners,corners[1:]+corners[:1]):fs.append((a,b,mid) if half=='right' else (b,a,mid))
    o=sam_mesh(name,vs,fs,pa_crust,.14)
    # Flat material floor must not average with the steep fracture cap.
    # Preserve every coordinate/triangle;only split the floor shading normals.
    if half is not None:
        for p in o.data.polygons:
            if all(abs(o.data.vertices[i].co.z-.025)<1e-6 for i in p.vertices):p.use_smooth=False
        o.data.update()
    if not full:
        c=o.data.color_attributes.get('surface')
        for i in set(crumb):
            v=o.data.vertices[i].co;n=1+.05*sin(v.z*931+v.y*317)
            c.data[i].color=(*(a*n for a in pa_crumb.diffuse_color[:3]),1)
    return o

def pa_rock_box(name,bounds,rough_axis=None,rough_side=None):
    # Flat bearing/mating faces and limited inward original exterior facets.
    # Edges remain anchored. Nominal50mm thickness leaves>=40mm QA margin.
    lo=[bounds[k][0] for k in range(3)];hi=[bounds[k][1] for k in range(3)];N=[max(2,min(18,round((hi[k]-lo[k])/.035))) for k in range(3)];vs=[];fs=[];index={}
    def v(i,j,k):
        key=(i,j,k)
        if key not in index:
            q=[lo[a]+(hi[a]-lo[a])*key[a]/N[a] for a in range(3)]
            if rough_axis is not None and key[rough_axis]==(0 if rough_side<0 else N[rough_axis]) and all(0<key[a]<N[a] for a in range(3) if a!=rough_axis):q[rough_axis]-=rough_side*.0025*(.55+.45*sin(q[0]*133+q[1]*91+q[2]*117))
            index[key]=len(vs);vs.append(xyz(q[0],q[1],q[2]))
        return index[key]
    for j in range(N[1]):
        for k in range(N[2]):fs.extend([(v(0,j,k),v(0,j+1,k),v(0,j+1,k+1),v(0,j,k+1)),(v(N[0],j,k),v(N[0],j,k+1),v(N[0],j+1,k+1),v(N[0],j+1,k))])
    for i in range(N[0]):
        for k in range(N[2]):fs.extend([(v(i,0,k),v(i,0,k+1),v(i+1,0,k+1),v(i+1,0,k)),(v(i,N[1],k),v(i+1,N[1],k),v(i+1,N[1],k+1),v(i,N[1],k+1))])
    for i in range(N[0]):
        for j in range(N[1]):fs.extend([(v(i,j,0),v(i+1,j,0),v(i+1,j+1,0),v(i,j+1,0)),(v(i,j,N[2]),v(i,j+1,N[2]),v(i+1,j+1,N[2]),v(i+1,j,N[2]))])
    return sam_mesh(name,vs,fs,pa_rock,.13,False)

def pa_finish(s,aid,meaning,layer=None):
    bpy.context.window.scene=s;bpy.context.view_layer.update();d=bpy.context.evaluated_depsgraph_get();d.update();ps=[o.evaluated_get(d).matrix_world@v.co for o in s.objects if o.type=='MESH' for v in o.evaluated_get(d).data.vertices];lo=[min(v[k] for v in ps) for k in range(3)];hi=[max(v[k] for v in ps) for k in range(3)];finish_static(s,aid,hi[2]);report['assets'][aid].update({'prototype_only':not globals().get('PASSION_OFFICIAL_BUILD',False),'source_scene':s.name,'dimensions_blender_xyz_m':[hi[k]-lo[k] for k in range(3)],'bottom_m':lo[2],'top_m':hi[2],'semantic_groups':[o.name for o in s.objects if o.type=='EMPTY'],'runtime_operations':1 if layer else 0,'main_layer':layer,'translation_gltf_xyz_m':[0,0,.18] if layer else None,'interpretation':meaning,'units':'metres;BlenderZup/glTFYup'});assert abs(lo[2])<1e-6 and report['assets'][aid]['triangles']<=30000 and report['assets'][aid]['bytes']<=1600000

def pa_table():
    s=new_scene('Passion — original ordinary cup and static bread comparison')
    parent_parts('passion-table-modern-base',[pa_box('table-complete-modern-support',0,0,1.15,.80,0,.025,pa_base)])
    parent_parts('passion-table-fixed-cup',[sam_lathe('table-original-ordinary-open-cup',pa_cup_profile(),pa_clay,cx=-.38,cz=-.15,steps=64)])
    parent_parts('passion-table-fixed-whole-loaf',[pa_loaf('table-original-whole-loaf',-.18,.13)])
    parent_parts('passion-table-fixed-broken-piece-a',[pa_loaf('table-original-complementary-piece-a',.27,.015,'left',-.025)])
    parent_parts('passion-table-fixed-broken-piece-b',[pa_loaf('table-original-complementary-piece-b',.27,.015,'right',.025)])
    pa_finish(s,'passion-table','Static original modern whole/broken-bread and ordinary cup comparison. Cup115mm on25mm support gives140mm overall,not an invented pedestal. Whole loaf plus2pieces are parallel teaching display copies,not3simultaneous originalloaves. No sacredcup,Princetonshape copy,menu,seating,ritualgame or modelledliquid.')

def pa_context():
    s=new_scene('Passion — original separated settings and companions reading diagram')
    parent_parts('passion-context-modern-base',[pa_box('context-complete-modern-support',0,0,1.15,.80,0,.025,pa_base)])
    for key,x,f,h in [('garden',-.275,-.19,.060),('night-courtyard',.275,-.19,.080),('morning-governor',-.275,.19,.100),('field-symbol',.275,.19,.065)]:parent_parts('passion-context-fixed-'+key,[pa_box('context-'+key+'-thick-separate-patch',x,f,.46,.30,.025,h,pa_patch)])
    tree=[(-.400,.060),(-.380,.060),(-.380,.080),(-.355,.088),(-.375,.092),(-.360,.107),(-.383,.101),(-.390,.115),(-.398,.101),(-.420,.107),(-.406,.092),(-.425,.088),(-.400,.080)]
    parent_parts('passion-context-fixed-garden-tree-symbol',[pa_extrude_front('context-original-modern-tree-silhouette',tree,-.126,-.114,pa_symbol)])
    profile=[(0,.060),(.011,.060),(.012,.061),(.012,.069),(.011,.070),(0,.070)]
    parent_parts('passion-context-fixed-garden-three',[sam_lathe('context-equal-reading-counter-'+str(i+1),profile,pa_symbol,cx=x,cz=-.22,steps=24) for i,x in enumerate([-.360,-.325,-.290])])
    parent_parts('passion-context-fixed-garden-separate-one',[sam_lathe('context-equal-reading-counter-separate',profile,pa_symbol,cx=-.180,cz=-.120,steps=24)])
    x=.275;f=-.19;u=[(x-.085,f-.070),(x+.085,f-.070),(x+.085,f+.070),(x+.070,f+.070),(x+.070,f-.055),(x-.070,f-.055),(x-.070,f+.070),(x-.085,f+.070)]
    parent_parts('passion-context-fixed-courtyard-outline',[pa_extrude_plan('context-modern-courtyard-U-outline',u,.080,.125,pa_symbol)])
    x=-.275;portal=[(x-.080,.100),(x-.050,.100),(x-.050,.130),(x+.050,.130),(x+.050,.100),(x+.080,.100),(x+.080,.145),(x-.080,.145)]
    parent_parts('passion-context-fixed-governor-outline',[pa_extrude_front('context-modern-plain-portal-outline',portal,.184,.196,pa_symbol)])
    x=.275;cross=[(x-.006,.065),(x+.006,.065),(x+.006,.108),(x+.025,.108),(x+.025,.120),(x+.006,.120),(x+.006,.135),(x-.006,.135),(x-.006,.120),(x-.025,.120),(x-.025,.108),(x-.006,.108)]
    parent_parts('passion-context-fixed-modern-cross-symbol',[pa_extrude_front('context-explicit-modern-single-material-cross-symbol',cross,.1825,.1975,pa_symbol)])
    pa_finish(s,'passion-context','Four separated modern reading patches for garden,nightcouncil,morninggovernor andfield.3samecounters plusseparate1only show selected companion relation;notallpopulation,distanceorancientstations. Plain equal-material silhouettes are modern symbols,notoriginalbuildings,trees,woodjoints,nails,bodyorweapons. No bridges,mapnavigation or executionoperation.')


def pa_tomb():
    s=new_scene('Passion — non-located original chamber and modern front dissection')
    parent_parts('passion-tomb-modern-floor-base',[pa_box('tomb-continuous35mm-modern-base-and-inner-floor',0,0,1.15,.80,0,.035,pa_floor)])
    for key,bounds,axis,side in [('left',[[-.40,-.35],[.035,.400],[-.39,.16]],0,-1),('right',[[.35,.40],[.035,.400],[-.39,.16]],0,1),('back',[[-.35,.35],[.035,.400],[-.39,-.34]],2,-1),('roof',[[-.40,.40],[.400,.450],[-.39,.16]],1,1)]:parent_parts('passion-tomb-fixed-'+key+'-rock',[pa_rock_box('tomb-original-'+key+'-closed-rock',bounds,axis,side)])
    parent_parts('passion-tomb-fixed-side-platform',[pa_rock_box('tomb-original-empty-side-platform',[[.13,.35],[.035,.110],[-.29,.10]])])
    outline=[(-.40,.035),(-.112,.035),(-.112,.265),(.112,.265),(.112,.035),(.40,.035),(.40,.450),(-.40,.450)]
    g=parent_parts('passion-tomb-modern-front-section',[pa_extrude_front('tomb-original-connected-U-front-material',outline,.16,.21,pa_rock,True)]);g['teaching_slide_m']=.18;g['translation_gltf_xyz_m']=[0,0,.18];g['modern_display_layer_not_stone_door']=True
    pa_finish(s,'passion-tomb','Original non-located approx1:10modern chamber comparison,not originaltombengineering. Continuous35mm modern support doublesas real innerfloor;nominal50mm shell,emptyplatform andtrue224x230mm portal. ModernUfront movesZ+.18onfloorwith10mmfrontmargin;fixedside/backwalls independently supportroof. Never a rollingstone,groove,hinge,sealingdoor or causeofresurrection. No body,bones,nails,ossuaryorborrowedgravecloth.','passion-tomb-modern-front-section')
    report['assets']['passion-tomb'].update({'selected_body_dimensions_m':[.80,.60,.450],'selected_clear_chamber_x_y_z_m':[.70,.365,.50],'selected_clear_portal_width_height_m':[.224,.230],'modern_continuous_floor_thickness_m':.035,'selected_open_front_margin_m':.010,'nominal_shell_thickness_m':.050,'required_sampled_min_shell_thickness_m':.040})

for aid,fn in [('passion-table',pa_table),('passion-context',pa_context),('passion-tomb',pa_tomb)]:
    if aid in globals().get('PASSION_ISOLATED_ONLY_IDS',('passion-table','passion-context','passion-tomb')):fn()
