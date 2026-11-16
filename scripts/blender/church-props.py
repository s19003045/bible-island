"""Original modern Church23 comparisons. Isolated only;no original house,cup orparcel identity."""
ch_base=material('church-modern-continuous-neutral-support',(.270,.333,.311),.98)
ch_wall=material('church-original-selected-plain-wall',(.470,.423,.335),1)
ch_wood=material('church-original-plain-supporting-timber',(.276,.186,.111),.98)
ch_panel=material('church-modern-thick-roof-section',(.400,.356,.267),.98)
ch_clay=material('church-original-ordinary-matte-vessels',(.446,.276,.151),.98)
ch_bread=material('church-original-whole-ordinary-bread',(.507,.321,.130),1)
ch_pad=material('church-modern-two-separated-reading-platforms',(.372,.405,.363),.98)
ch_counter=material('church-modern-equal-status-reading-counters',(.237,.274,.253),.95)
ch_arrow=material('church-modern-static-relation-arrow',(.218,.343,.354),.97)
ch_tile=material('church-modern-neutral-teaching-marker',(.516,.497,.414),.98)
ch_cloth=material('church-original-neutral-folded-aid-bulk',(.430,.373,.269),1)

def ch_box(name,x,f,w,d,bottom,top,mat):return box_surface(name,(x,(bottom+top)/2,f),(w,top-bottom,d),mat,0)

def ch_flat_floor(o,height):
    for p in o.data.polygons:
        if all(abs(o.data.vertices[i].co.z-height)<1e-6 for i in p.vertices):p.use_smooth=False
    o.data.update();return o

def ch_vessel_profile(foot,shoulder,mouth,mid,wall,heel):
    # Real axis-bottom/exterior/rim/interior/floor loop;no cap across mouth.
    a=sam_bezier((foot,.025),(shoulder-.015,.025),(shoulder,.047),(shoulder,mid),12)
    b=sam_bezier((shoulder,mid),(shoulder,mid+.020),(mouth,.108),(mouth,.125),16)
    inside=[(p[0]+wall*n[0],p[1]+wall*n[1]) for p,n in b]
    innerheel=[p for p,n in sam_bezier((heel,.039),(shoulder-wall-.010,.039),(shoulder-wall,.052),(shoulder-wall,mid),12)]
    return [(0,.025)]+[p for p,n in a+b[1:]]+list(reversed(inside))+list(reversed(innerheel[:-1]))+[(0,.039)]

def ch_whole_loaf(name,cx,cf):
    # The accepted team's original whole-loaf construction only. No cut cap,
    # collinear split axis,fracture or after-tessellation deformation.
    profile=[(0,.025),(.080,.025),(.119,.031),(.125,.046),(.117,.058),(.080,.067),(0,.070)];N=72;vs=[];loops=[];fs=[]
    for r,h in profile:
        if r==0:loops.append([len(vs)]);vs.append(xyz(cx+.0015*sin(h*700),h,cf));continue
        row=[]
        for k in range(N):
            a=2*pi*k/N;rr=r*(1+.025*sin(3*a)+.017*sin(7*a+.6));x=rr*sin(a);f=rr*cos(a);row.append(len(vs));vs.append(xyz(cx+x+.0045*sin(f*83)+.0015*sin(h*700+f*45),h,cf+f))
        loops.append(row)
    for a,b in zip(loops,loops[1:]):
        for k in range(N):
            j=(k+1)%N
            if len(a)==1:fs.append((a[0],b[k],b[j]))
            elif len(b)==1:fs.append((a[k],b[0],a[j]))
            else:fs.append((a[k],b[k],b[j],a[j]))
    return ch_flat_floor(sam_mesh(name,vs,fs,ch_bread,.13),.025)

def ch_bundle(name,cx,cf):
    # A closed original neutral cloth bulk with true folded side geometry.
    # This does not identify aid content,amount,seals or ancient knotwork.
    N=64;profile=[(.030,.085,.045),(.042,.115,.066),(.063,.120,.070),(.083,.108,.062),(.101,.078,.043)];vs=[xyz(cx,.030,cf)];loops=[[0]];fs=[]
    def signed(v):return (1 if v>=0 else -1)*abs(v)**.68
    for h,rx,rf in profile:
        row=[]
        for k in range(N):
            a=2*pi*k/N;fold=1+(0 if h==.030 else .055*sin(7*a+h*90)+.028*cos(13*a-h*60));row.append(len(vs));vs.append(xyz(cx+rx*signed(cos(a))*fold,h,cf+rf*signed(sin(a))*fold))
        loops.append(row)
    loops.append([len(vs)]);vs.append(xyz(cx+.004,.110,cf-.003))
    for a,b in zip(loops,loops[1:]):
        for k in range(N):
            j=(k+1)%N
            if len(a)==1:fs.append((a[0],b[k],b[j]))
            elif len(b)==1:fs.append((a[k],b[0],a[j]))
            else:fs.append((a[k],b[k],b[j],a[j]))
    return ch_flat_floor(sam_mesh(name,vs,fs,ch_cloth,.12),.030)

def ch_finish(s,aid,meaning,layer=None):
    bpy.context.window.scene=s;bpy.context.view_layer.update();d=bpy.context.evaluated_depsgraph_get();d.update();ps=[o.evaluated_get(d).matrix_world@v.co for o in s.objects if o.type=='MESH' for v in o.evaluated_get(d).data.vertices];lo=[min(v[k] for v in ps) for k in range(3)];hi=[max(v[k] for v in ps) for k in range(3)];finish_static(s,aid,hi[2]);report['assets'][aid].update({'prototype_only':not globals().get('CHURCH_OFFICIAL_BUILD',False),'source_scene':s.name,'dimensions_blender_xyz_m':[hi[k]-lo[k] for k in range(3)],'bottom_m':lo[2],'top_m':hi[2],'semantic_groups':[o.name for o in s.objects if o.type=='EMPTY'],'runtime_operations':1 if layer else 0,'main_layer':layer,'translation_gltf_xyz_m':[0,.16,0] if layer else None,'interpretation':meaning,'units':'metres;BlenderZup/glTFYup'});assert abs(lo[2])<1e-6 and report['assets'][aid]['triangles']<=30000 and report['assets'][aid]['bytes']<=1600000

def ch_house():
    s=new_scene('Church — original local house interior and exterior comparison')
    parent_parts('church-house-modern-continuous-floor',[ch_box('house-modern35mm-floor-base',0,0,1.15,.80,0,.035,ch_base)])
    parent_parts('church-house-fixed-back-wall',[ch_rock_box('house-original-back-wall',[[-.40,.25],[.035,.275],[-.26,-.23]],2,-1)])
    parent_parts('church-house-fixed-left-wall',[ch_rock_box('house-original-left-wall',[[-.40,-.37],[.035,.275],[-.23,.23]],0,-1)])
    outline=[(-.40,.035),(-.135,.035),(-.135,.175),(-.015,.175),(-.015,.035),(.25,.035),(.25,.275),(-.40,.275)]
    parent_parts('church-house-fixed-front-portal',[ch_extrude_front('house-original-true-open-front-portal',outline,.23,.26,ch_wall)])
    parts=[]
    for key,x in [('left',-.28),('right',.16)]:parts.append(parent_parts('church-house-roof-beam-'+key,[ch_box('house-original-'+key+'-short-support-beam',x,0,.035,.52,.275,.295,ch_wood)]))
    parts.append(parent_parts('church-house-roof-panel',[ch_box('house-modern25mm-thick-roof-panel',-.075,0,.65,.52,.295,.320,ch_panel)]))
    g=parent_parts('church-house-modern-roof-section',parts);g['teaching_lift_m']=.16;g['translation_gltf_xyz_m']=[0,.16,0];g['modern_display_suspension_not_ancient_mechanism']=True
    ch_finish(s,'church-house','Original modern approx1:20local house comparison,not original gathering house/upperroom/complete plan. Three fixed faces:front portal,back,left;right open as modern section. Continuous35mmmodernfloor connectsinside/outside. Two20mmbeams genuinely bear front/backwalltops andcarry25mmpanel. Whole roof group liftsY+.16as suspended observation only,not ancient roof machinery. No120/3000occupancy,firetongues,Dura baptistery or known apostle house.',g.name)

def ch_table():
    s=new_scene('Church — original ordinary common meal vessel comparison')
    parent_parts('church-table-modern-base',[ch_box('meal-modern25mm-support',0,0,1.15,.80,0,.025,ch_base)])
    bowl=sam_lathe('meal-original-plain-open-bowl',ch_vessel_profile(.065,.110,.130,.070,.011,.045),ch_clay,cx=-.30,cz=.11,steps=64);ch_flat_floor(bowl,.025);parent_parts('church-table-fixed-open-bowl',[bowl])
    for key,x in [('left',-.17),('right',.045)]:
        cup=sam_lathe('meal-original-plain-cup-'+key,ch_vessel_profile(.024,.040,.045,.072,.010,.015),ch_clay,cx=x,cz=-.19,steps=48);ch_flat_floor(cup,.025);parent_parts('church-table-fixed-cup-'+key,[cup])
    parent_parts('church-table-fixed-whole-bread',[ch_whole_loaf('meal-original-ordinary-whole-loaf',.22,.11)])
    ch_finish(s,'church-table','Static original modern comparison:ordinary open bowl,two same plaincups andone solidwholebread.14mmrealmaterialfloors,selectedwallthicknesses11/10mm. Reuses team-original functional geometry without Passion dinner identity. No ritual,menu,recipe,wine,allocationgame,Princetonimage copy or fixedattendance claim. No splitbread or operation.')

def ch_relations():
    s=new_scene('Church — modern scattering teaching and aid relation diagram')
    parent_parts('church-relations-modern-base',[ch_box('relations-modern30mm-support',0,0,1.15,.80,0,.03,ch_base)])
    for key,x in [('left',-.34),('right',.34)]:
        parent_parts('church-relations-fixed-'+key+'-platform',[ch_box('relations-'+key+'-thick-platform',x,-.085,.28,.35,.03,.065,ch_pad)])
        profile=[(0,.065),(.016,.065),(.018,.067),(.018,.082),(.016,.085),(0,.085)]
        parent_parts('church-relations-fixed-'+key+'-neutral-group',[ch_flat_floor(sam_lathe('relations-'+key+'-same-neutral-counter-'+str(i+1),profile,ch_counter,cx=x+dx,cz=-.085,steps=24),.065) for i,dx in enumerate([-.05,.05])])
    f=-.085;arrow=[(-.14,f),(-.08,f-.05),(-.08,f-.018),(.08,f-.018),(.08,f-.05),(.14,f),(.08,f+.05),(.08,f+.018),(-.08,f+.018),(-.08,f+.05)]
    parent_parts('church-relations-fixed-modern-double-arrow',[ch_extrude_plan('relations-modern15mm-double-arrow',arrow,.03,.045,ch_arrow)])
    parent_parts('church-relations-fixed-neutral-teaching-tile',[ch_box('relations-modern-blank-thick-teaching-tile',-.29,.255,.22,.11,.03,.048,ch_tile)])
    parent_parts('church-relations-fixed-neutral-aid-bundle',[ch_bundle('relations-original-neutral-folded-aid-bulk',.29,.255)])
    ch_finish(s,'church-relations','Static original modern relation diagram,not ancientmap. Separate left combinedreadingend(scattered/Judea)andright SyrianAntioch,not a precise sharedorigin/group or all destinations. Two same counters pergroup are selected groupingmarks,not population. Thick independent modern doublearrow;UI must separately explain outwardscattering,oneyearteaching andaid towardJudea,not originalroute/roundtrip. Blankteachingtile andclosedclothbulk do not authenticate originalletter,package,content,amount,seal orcraft. No runtime movement,rankings or delivery game.')


def ch_extrude_front(name, outline, back, front, mat, rough_front=False):
    from mathutils.geometry import tessellate_polygon
    pts = [Vector((x, h, 0)) for x, h in outline]
    tri = tessellate_polygon([pts])
    lookup = {tuple(v): i for i, v in enumerate(pts)}
    ids = [tuple((v if isinstance(v, int) else lookup[tuple(v)] for v in t)) for t in tri]
    n = len(outline)
    vs = [xyz(x, h, f) for f in [back, front] for x, h in outline]
    fs = []
    for t in ids:
        fs.append(tuple(reversed(t)))
        if rough_front:
            x = sum((outline[i][0] for i in t)) / 3
            h = sum((outline[i][1] for i in t)) / 3
            f = front - 0.0028 * (0.55 + 0.45 * sin(x * 117 + h * 83))
            idx = len(vs)
            vs.append(xyz(x, h, f))
            for a, b in zip(t, t[1:] + t[:1]):
                fs.append((n + a, n + b, idx))
        else:
            fs.append(tuple((n + i for i in t)))
    for k in range(n):
        j = (k + 1) % n
        fs.append((k, j, n + j, n + k))
    o = sam_mesh(name, vs, fs, mat, 0.12, False)
    return o

def ch_extrude_plan(name, outline, bottom, top, mat):
    from mathutils.geometry import tessellate_polygon
    pts = [Vector((x, f, 0)) for x, f in outline]
    n = len(pts)
    lookup = {tuple(v): i for i, v in enumerate(pts)}
    ts = [tuple((v if isinstance(v, int) else lookup[tuple(v)] for v in t)) for t in tessellate_polygon([pts])]
    vs = [xyz(x, h, f) for h in [bottom, top] for x, f in outline]
    fs = []
    for t in ts:
        fs.extend([tuple(reversed(t)), tuple((n + i for i in t))])
    for k in range(n):
        j = (k + 1) % n
        fs.append((k, j, n + j, n + k))
    return sam_mesh(name, vs, fs, mat, 0.08, False)

def ch_rock_box(name, bounds, rough_axis=None, rough_side=None):
    lo = [bounds[k][0] for k in range(3)]
    hi = [bounds[k][1] for k in range(3)]
    N = [max(2, min(18, round((hi[k] - lo[k]) / 0.035))) for k in range(3)]
    vs = []
    fs = []
    index = {}

    def v(i, j, k):
        key = (i, j, k)
        if key not in index:
            q = [lo[a] + (hi[a] - lo[a]) * key[a] / N[a] for a in range(3)]
            if rough_axis is not None and key[rough_axis] == (0 if rough_side < 0 else N[rough_axis]) and all((0 < key[a] < N[a] for a in range(3) if a != rough_axis)):
                q[rough_axis] -= rough_side * 0.0025 * (0.55 + 0.45 * sin(q[0] * 133 + q[1] * 91 + q[2] * 117))
            index[key] = len(vs)
            vs.append(xyz(q[0], q[1], q[2]))
        return index[key]
    for j in range(N[1]):
        for k in range(N[2]):
            fs.extend([(v(0, j, k), v(0, j + 1, k), v(0, j + 1, k + 1), v(0, j, k + 1)), (v(N[0], j, k), v(N[0], j, k + 1), v(N[0], j + 1, k + 1), v(N[0], j + 1, k))])
    for i in range(N[0]):
        for k in range(N[2]):
            fs.extend([(v(i, 0, k), v(i, 0, k + 1), v(i + 1, 0, k + 1), v(i + 1, 0, k)), (v(i, N[1], k), v(i + 1, N[1], k), v(i + 1, N[1], k + 1), v(i, N[1], k + 1))])
    for i in range(N[0]):
        for j in range(N[1]):
            fs.extend([(v(i, j, 0), v(i + 1, j, 0), v(i + 1, j + 1, 0), v(i, j + 1, 0)), (v(i, j, N[2]), v(i, j + 1, N[2]), v(i + 1, j + 1, N[2]), v(i + 1, j, N[2]))])
    return sam_mesh(name, vs, fs, ch_wall, 0.13, False)

for fn in [ch_house,ch_table,ch_relations]:fn()
