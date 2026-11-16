"""Original Nehemiah teaching comparisons, using shared authored helpers.

Read the complete NEHEMIAH-IMPLEMENTATION-PLAN and NEHEMIAH-RESEARCH-START.
Night inspection, public proposal, later work sections, different completion
states, and the first-day reading are separate readings, never one live scene.
Stone bonds, timber joints, door/bar samples, platform and blank sheet format
are original modern teaching choices, not an excavated wall/gate/platform or
Ezra's original scroll. No ancient writing, weapons, counted people, seals,
precise city plan, 52-second game, forced emotion, festival booths or portrait.
Only one runtime teaching layer per asset; fixed door, fixed side bar sample,
and fixed rolled/expanded blank sections have no extra runtime animation.
Requires the shared original helpers plus sinai_closed_grid.
Default exports retain prototype metadata. The official builder explicitly sets
NEHEMIAH_OFFICIAL_BUILD only around this file; no existing asset uses that flag.
"""

neh_wood = material('nehemiah-original-ordinary-wood', (.292, .196, .106), .96)
neh_darkwood = material('nehemiah-original-wood-edge', (.163, .104, .049), .99)
neh_lightwood = material('nehemiah-original-pale-wood', (.402, .292, .175), .97)
neh_stone = material('nehemiah-original-rough-stone', (.393, .362, .304), .99)
neh_stone_light = material('nehemiah-original-pale-stone', (.470, .432, .360), 1)
neh_stone_dark = material('nehemiah-original-dark-stone', (.315, .299, .261), 1)
neh_ground = material('nehemiah-modern-recessed-fixture', (.470, .455, .408), .98)
neh_teal = material('nehemiah-modern-section-indicator', (.117, .309, .334), .86)
neh_teal_light = material('nehemiah-modern-pale-section-indicator', (.363, .474, .469), .92)
neh_ochre = material('nehemiah-modern-reading-ochre', (.486, .345, .174), .94)
neh_fibre = material('nehemiah-original-plain-load-wrap', (.430, .362, .250), .99)
neh_rope = material('nehemiah-original-plain-load-cord', (.230, .180, .108), 1)
neh_sheet = material('nehemiah-modern-blank-curved-sheet', (.754, .724, .629), .96)


def neh_flat(obj):
    for p in obj.data.polygons:
        p.use_smooth = False
    return obj


def neh_recess(name, center, width, depth, rim, floor, wall, mat):
    """A closed cavity shell with exact rectangular walls and a true inner floor."""
    x, h, f = center; vs = []; fs = [(3, 2, 1, 0)]
    for w, d, z in [(width, depth, 0), (width, depth, rim),
                    (width-2*wall, depth-2*wall, rim),
                    (width-2*wall, depth-2*wall, floor)]:
        vs.extend([xyz(x-w/2, h+z, f-d/2), xyz(x+w/2, h+z, f-d/2),
                   xyz(x+w/2, h+z, f+d/2), xyz(x-w/2, h+z, f+d/2)])
    for j in range(3):
        for k in range(4):
            fs.append((j*4+k, j*4+(k+1)%4, (j+1)*4+(k+1)%4, (j+1)*4+k))
    fs.append((12, 13, 14, 15))
    o = neh_flat(mesh(name, vs, fs, mat, variation=.05))
    o['inner_floor_m'] = h+floor; o['outer_bottom_m'] = h
    o['wall_thickness_m'] = wall
    return o


def neh_stone_block(name, center, size, seed, mat):
    """Original faceted stone: irregular sides, genuine flat bearing faces.

    Exact top/bottom bearing planes make support inspectable. This authored
    eight-sided outline and selected stagger are not a dated masonry bond.
    """
    outline = [(-.42, -.50), (.42, -.50), (.50, -.42), (.50, .42),
               (.42, .50), (-.42, .50), (-.50, .42), (-.50, -.42)]
    vs = []; fs = []; n = len(outline)
    for j, (h, scale) in enumerate([(-.5, .94), (-.38, 1), (0, .986), (.38, 1), (.5, .94)]):
        for k, (x, f) in enumerate(outline):
            # Inward-only surface irregularity preserves nonintersection bounds.
            q = scale*(.985+.015*sin(seed*1.7+k*2.3+j*.6))
            vs.append(xyz(center[0]+size[0]*x*q, center[1]+size[1]*h,
                          center[2]+size[2]*f*q))
            if j:
                fs.append(((j-1)*n+k, (j-1)*n+(k+1)%n, j*n+(k+1)%n, j*n+k))
    fs.extend([tuple(reversed(range(n))), tuple(4*n+k for k in range(n))])
    return neh_flat(mesh(name, vs, fs, mat, variation=.095))


def neh_beam(name, a, b, width, depth, mat):
    """Closed rectangular timber between two authored points."""
    av, bv = Vector(xyz(*a)), Vector(xyz(*b)); t = (bv-av).normalized()
    ref = Vector((0, 1, 0)) if abs(t.y) < .9 else Vector((1, 0, 0))
    u = (ref-t*ref.dot(t)).normalized(); v = t.cross(u).normalized(); vs = []
    for p in [av, bv]:
        for su, sv in [(-1,-1), (1,-1), (1,1), (-1,1)]:
            vs.append(tuple(p+u*su*width/2+v*sv*depth/2))
    return neh_flat(mesh(name, vs, [(3,2,1,0),(4,5,6,7),(0,1,5,4),
        (1,2,6,5),(2,3,7,6),(3,0,4,7)], mat, variation=.07))


def neh_bar_bore(name, x, h, f):
    """Closed square bracket with an actual through bore along X."""
    vs = []; fs = []
    for xx, radius in [(x-.011,.030),(x+.011,.030),(x+.011,.014),(x-.011,.014)]:
        vs.extend([xyz(xx,h-radius,f-radius), xyz(xx,h-radius,f+radius),
                   xyz(xx,h+radius,f+radius), xyz(xx,h+radius,f-radius)])
    for j in range(4):
        for k in range(4):
            fs.append((j*4+k,j*4+(k+1)%4,((j+1)%4)*4+(k+1)%4,((j+1)%4)*4+k))
    return neh_flat(mesh(name,vs,fs,neh_darkwood,variation=.07))


def neh_panel(name, center, width, height, thickness, angle, mat):
    """A solid modern marker panel, tilted in the height/front plane."""
    cx, ch, cf = center; vs = []
    for side in [-1, 1]:
        for x, y in [(-width/2,-height/2),(width/2,-height/2),
                     (width/2,height/2),(-width/2,height/2)]:
            vs.append(xyz(cx+x, ch+y*cos(angle)-side*thickness*sin(angle)/2,
                          cf+y*sin(angle)+side*thickness*cos(angle)/2))
    return neh_flat(mesh(name,vs,[(3,2,1,0),(4,5,6,7),(0,1,5,4),
        (1,2,6,5),(2,3,7,6),(3,0,4,7)],mat,variation=.035))


def neh_sheet_strip(name, profile, center_x, center_f, length, thickness, mat, nf=6):
    """Extruded curved strip with true normal thickness and closed edge faces.

    Profile is an open polyline in (relative X, absolute height). For the rolled
    pieces the line is a spaced spiral, not a filled cylinder or end-cap disc.
    """
    n = len(profile); vs = []; fs = []
    for lower in [False, True]:
        for j in range(nf+1):
            f = center_f-length/2+length*j/nf
            for i, (x, h) in enumerate(profile):
                a = Vector(profile[max(0,i-1)]); b = Vector(profile[min(n-1,i+1)])
                tangent = (b-a).normalized(); normal = Vector((-tangent.y,tangent.x))
                offset = normal*thickness*(.5 if not lower else -.5)
                vs.append(xyz(center_x+x+offset.x, h+offset.y, f))
    count = n*(nf+1)
    for side in [0, 1]:
        for j in range(nf):
            for i in range(n-1):
                q = side*count+j*n+i; face = (q,q+1,q+n+1,q+n)
                fs.append(tuple(reversed(face)) if side else face)
    edge = (list(range(n))+[j*n+n-1 for j in range(1,nf+1)]
            +[nf*n+i for i in range(n-2,-1,-1)]
            +[j*n for j in range(nf-1,0,-1)])
    for a,b in zip(edge,edge[1:]+edge[:1]):fs.append((a,b,b+count,a+count))
    o = mesh(name,vs,fs,mat,variation=.022)
    o['normal_thickness_m'] = thickness
    return o


def neh_round_marker(name, x, h, f, rx, rf, thickness, mat):
    vs=[];fs=[];n=40
    for layer in [0,1]:
        for k in range(n):
            a=k*2*pi/n;vs.append(xyz(x+rx*cos(a),h+layer*thickness,f+rf*sin(a)))
    for k in range(n):fs.append((k,(k+1)%n,n+(k+1)%n,n+k))
    fs.extend([tuple(reversed(range(n))),tuple(range(n,2*n))])
    return neh_flat(mesh(name,vs,fs,mat,variation=.04))


def neh_grain(name, bounds, height, count=4):
    x0,x1,f0,f1=bounds;parts=[]
    for k in range(count):
        f=f0+(f1-f0)*(k+1)/(count+1)
        pts=[(x0+(x1-x0)*j/34,height,f+.0005*sin(j*.8+k)) for j in range(35)]
        parts.append(tube(name,pts,[.00045]*35,neh_darkwood,sides=4))
    return parts


def neh_finish(scene, aid, interpretation, layer, lift):
    bpy.context.window.scene=scene;bpy.context.view_layer.update()
    deps=bpy.context.evaluated_depsgraph_get();deps.update()
    pts=[o.evaluated_get(deps).matrix_world@v.co for o in scene.objects if o.type=='MESH'
         for v in o.evaluated_get(deps).data.vertices]
    low=[min(p[i] for p in pts) for i in range(3)];high=[max(p[i] for p in pts) for i in range(3)]
    finish_static(scene,aid,round(high[2],6))
    report['assets'][aid].update({'prototype_only':not bool(globals().get('NEHEMIAH_OFFICIAL_BUILD',False)),'interpretation':interpretation,
        'source_scene':scene.name,'bottom_m':low[2],'top_m':high[2],
        'dimensions_blender_xyz_m':[high[i]-low[i] for i in range(3)],
        'semantic_groups':[o.name for o in scene.objects if o.type=='EMPTY'],
        'modern_removable_layer':layer,'modern_layer_translation_gltf_xyz_m':[0,lift,0],
        'runtime_operations':1,'units':'metres; height Blender +Z / glTF +Y'})
    assert abs(low[2])<1e-6 and high[2]+lift<=.8
    assert report['assets'][aid]['triangles']<=30000 and report['assets'][aid]['bytes']<=1600000


# Nehemiah 2/3: a local teaching sample, not an original gate or night route.
nehemiah_wall_scene=new_scene('Nehemiah — original thick wall and fixed open gate samples')
parent_parts('nehemiah-wall-modern-support',[box_surface('wall-modern-base',
    (0,.009,0),(1.20,.018,.80),neh_lightwood,.005)])
parent_parts('nehemiah-wall-recessed-support-floor',[neh_recess('wall-real-foundation-recess',
    (0,.018,0),1.18,.78,.037,.016,.016,neh_ground)])
for side,cx in [('left',-.325),('right',.325)]:
    parts=[]
    for row in range(4):
        number=3 if row%2==0 else 2;step=.390/number
        for j in range(number):
            x=cx-.195+step*(j+.5);seed=row*11+j+(40 if side=='right' else 0)
            parts.append(neh_stone_block('wall-original-bearing-stone',
                (x,.034+.0825*(row+.5),0),(step-.003,.0825,.180),seed,
                [neh_stone,neh_stone_light,neh_stone_dark][(row+j)%3]))
    parent_parts('nehemiah-wall-'+side+'-closed-section',parts)
lintel=box_surface('wall-original-functional-lintel', (0,.3855,0),
                   (.330,.043,.180),neh_wood,.001)
parent_parts('nehemiah-wall-through-opening-and-lintel',[lintel])
stands=[]
for x in [-.455,.455]:
    for f in [-.052,.052]:stands.append(box_surface('wall-modern-section-contact-pad',
        (x,.3855,f),(.038,.043,.035),neh_teal_light,.001))
parent_parts('nehemiah-wall-fixed-modern-section-supports',stands)
upper=[box_surface('wall-modern-upper-course-carrier',(0,.413,0),
                   (1.080,.012,.215),neh_teal,.001)]
specimens=[]
for j in range(7):
    x=-.462+j*.154;h=.116+.009*sin(j*1.7)
    specimens.append(neh_stone_block('wall-original-upper-course-specimen',
        (x,.419+h/2,0),(.148,h,.185),100+j,
        neh_stone_light if j%2 else neh_stone))
upper.append(parent_parts('nehemiah-wall-original-upper-course-specimens',specimens))
g=parent_parts('nehemiah-wall-modern-section-layer',upper)
g['motion_gltf_xyz_m']=[0,.16,0];g['teaching_lift_m']=.16
g['interpretation']='Modern carrier and selected upper-course samples; not an ancient removable wall mechanism'

# Fixed leaf is completely outside x[-.13,.13], so it never masks the portal.
door=[]
for j in range(3):
    f=.106+.210*(j+.5)/3
    door.append(box_surface('wall-fixed-open-door-plank',(-.145,.196,f),
                            (.018,.300,.068),neh_wood,.001))
for h in [.106,.286]:door.append(box_surface('wall-fixed-door-contact-batten',
    (-.159,h,.211),(.010,.020,.193),neh_darkwood,.001))
door.append(tube('wall-fixed-door-plain-pivot',
    [(-.145,.034,.106),(-.145,.361,.106)],[.006,.006],neh_darkwood,sides=12))
parent_parts('nehemiah-wall-fixed-open-door-leaf',door)
bearings=[]
for h in [.061,.333]:
    ring=pottery_profile('wall-fixed-open-door-bearing-ring',
        [(.0075,0),(.013,0),(.013,.020),(.0075,.020),(.0075,0)],
        neh_lightwood,n=32,tool=False)
    ring.location=xyz(-.145,h-.010,.106);bearings.append(ring)
    bearings.append(box_surface('wall-fixed-bearing-contact-block',
        (-.145,h,.085),(.035,.023,.022),neh_lightwood,.001))
parent_parts('nehemiah-wall-fixed-open-door-bearing',bearings)

samplebase=box_surface('wall-side-function-sample-foot',(.365,.0445,.270),
                      (.380,.021,.140),neh_teal_light,.002)
parent_parts('nehemiah-wall-side-bar-sample-support',[samplebase])
brackets=[]
for x in [.250,.460]:
    brackets.append(neh_bar_bore('wall-side-real-through-bracket',x,.145,.270))
    brackets.append(box_surface('wall-side-bracket-bearing-post',
        (x,.085,.270),(.035,.060,.035),neh_lightwood,.001))
parent_parts('nehemiah-wall-bar-through-brackets',brackets)
parent_parts('nehemiah-wall-fixed-bar-function-sample',[box_surface(
    'wall-side-fixed-bar-through-real-bores',(.365,.140,.270),(.360,.018,.018),neh_wood,.001)])
stones=[]
for j,(x,f) in enumerate([(-.450,.257),(-.335,.285),(.435,-.250)]):
    stones.append(neh_stone_block('wall-selected-grounded-loose-stone',
        (x,.034+.020,f),(.064,.040,.053),160+j,neh_stone_dark))
parent_parts('nehemiah-wall-grounded-loose-stones',stones)
neh_finish(nehemiah_wall_scene,'nehemiah-wall',
    'Original thick wall/through portal, fixed fully open leaf, functional lintel and separate fixed bar/bore sample. Nehemiah 2 and later 3 are distinct readings. No identified gate, exact circuit, dated bond/joint, original tool, animated door/bar, mallet or basket.',g.name,.16)


# Nehemiah 4/6/7: role comparison plus four different reading-state tabs.
nehemiah_watch_scene=new_scene('Nehemiah — modern work watch and completion comparison tray')
parent_parts('nehemiah-watch-modern-support',[box_surface('watch-modern-base',
    (0,.009,0),(1.20,.018,.70),neh_wood,.005)])
watch_parts=[]
for role,x,mat in [('carry',-.390,neh_ochre),('build',0,neh_teal_light),('watch',.390,neh_ground)]:
    parent_parts('nehemiah-watch-recess-'+role,[neh_recess('watch-real-role-recess-'+role,
        (x,.018,.075),.340,.320,.064,.014,.015,neh_teal)])
    parts=[box_surface('watch-solid-role-insert-'+role,
        (x,.039,.075),(.300,.014,.280),mat,.001)]
    if role=='carry':
        def carry_surface(xx,ff,cx=x):
            return (.046+.038*max(0,1-((xx-cx)/.100)**4)*max(0,1-((ff-.075)/.078)**4)
                    +.0022*sin((xx-cx)*150)*sin((ff-.005)/.140*pi))
        bundle=sinai_closed_grid('watch-original-wrapped-material-load',
            (x-.095,x+.095,.005,.145),22,16,
            carry_surface,.046,neh_fibre,.075)
        parts.append(bundle)
        for dx in [-.047,.047]:
            pts=[]
            for j in range(31):
                ff=.006+j*.138/30
                pts.append((x+dx,carry_surface(x+dx,ff)+.0008,ff))
            pts.append((x+dx,.0478,.144))
            for j in range(1,31):pts.append((x+dx,.0478,.144-j*.134/30))
            # Closed tube caps are embedded in the selected load; it is not a
            # repeated-endpoint tube with coincident internal caps at a seam.
            parts.append(tube('watch-original-material-load-cord',pts,[.0018]*len(pts),neh_rope,sides=6))
    elif role=='build':
        parts.extend([neh_stone_block('watch-original-work-stone-lower',
            (x-.025,.066,.045),(.144,.040,.090),210,neh_stone),
            neh_stone_block('watch-original-work-stone-upper',
            (x-.014,.104,.045),(.095,.036,.066),211,neh_stone_light),
            box_surface('watch-original-ordinary-wood-work-sample',
                (x+.020,.055,.165),(.180,.018,.028),neh_lightwood,.001)])
    else:
        parts.append(box_surface('watch-modern-observation-marker-foot',
            (x,.052,.075),(.170,.012,.110),neh_teal_light,.002))
        parts.append(box_surface('watch-modern-observation-marker-support',
            (x,.075,.075),(.018,.034,.018),neh_darkwood,.001))
        parts.append(neh_panel('watch-modern-angled-observation-marker',
            (x,.115,.080),.126,.070,.010,.30,neh_teal))
    child=parent_parts('nehemiah-watch-role-insert-'+role,parts)
    child['interpretation']='Modern functional comparison; no human pose, population proportion, exact occupation list or weapon command'
    watch_parts.append(child)
rail=box_surface('watch-four-state-independent-modern-carrier',
    (0,.027,-.245),(1.100,.018,.140),neh_lightwood,.002)
watch_parts.append(parent_parts('nehemiah-watch-four-state-carrier',[rail]))
for label,x in [('half-height',-.405),('closed-gaps-no-doors',-.135),
                ('wall-complete',.135),('gate-management',.405)]:
    parts=[box_surface('watch-modern-separate-state-tab',
        (x,.042,-.245),(.220,.012,.104),neh_ground,.002)]
    if label=='half-height':
        parts.append(neh_stone_block('watch-modern-half-height-profile',
            (x,.066,-.245),(.145,.036,.035),240,neh_stone))
    elif label=='wall-complete':
        parts.append(neh_stone_block('watch-modern-wall-completion-profile',
            (x,.084,-.245),(.145,.072,.035),241,neh_stone_light))
    else:
        for dx in [-.061,.061]:parts.append(box_surface('watch-modern-gate-state-jamb',
            (x+dx,.079,-.245),(.022,.062,.030),neh_lightwood,.001))
        parts.append(box_surface('watch-modern-gate-state-lintel',
            (x,.120,-.245),(.144,.020,.030),neh_wood,.001))
        if label=='gate-management':parts.append(box_surface('watch-modern-installed-leaf-profile',
            (x,.078,-.245),(.094,.060,.012),neh_teal_light,.001))
    phase=parent_parts('nehemiah-watch-phase-'+label,parts)
    phase['interpretation']='One selected modern reading-state tab; not a simultaneous original scene, counted people or days'
    watch_parts.append(phase)
g=parent_parts('nehemiah-watch-modern-comparison-layer',watch_parts)
g['motion_gltf_xyz_m']=[0,.14,0];g['teaching_lift_m']=.14
g['runtime_operations']=1
g['interpretation']='Three role inserts plus independent four-state carrier lift together; fixed shells/base stay'
neh_finish(nehemiah_watch_scene,'nehemiah-watch',
    'Three functional recesses carry/build/watch and separate half-height/closed-gaps-no-doors/wall-complete/gate-management tabs. One lift only. Counts are neither population ratios nor the seven app reading states; no weapons, enemies or 52-second/day counter.',g.name,.14)


# Nehemiah 8: supported platform and original blank curved-sheet comparisons.
nehemiah_reading_scene=new_scene('Nehemiah — original platform blank curves and understanding markers')
parent_parts('nehemiah-reading-modern-support',[box_surface('reading-modern-base',
    (0,.009,0),(1.10,.018,.80),neh_ground,.005)])
fixed=[];moving=[]
for f,parts in [(-.205,fixed),(.015,fixed),(.145,moving)]:
    for x in [-.450,.070]:
        parts.append(box_surface('reading-platform-bearing-foot',
            (x,.0265,f),(.080,.017,.070),neh_lightwood,.001))
        parts.append(box_surface('reading-platform-real-post',
            (x,.1145,f),(.028,.159,.028),neh_wood,.001))
    parts.append(box_surface('reading-platform-real-cross-beam',
        (-.190,.207,f),(.600,.026,.044),neh_darkwood,.001))
    parts.append(neh_beam('reading-platform-diagonal-support',
        (-.450,.060,f),(.070,.184,f),.014,.014,neh_lightwood))
for j in range(6):
    x=-.500+(j+.5)*(.620/6)
    fixed.append(box_surface('reading-fixed-real-deck-plank',
        (x,.231,-.0975),(.620/6-.001,.022,.325),neh_wood,.001))
    moving.append(box_surface('reading-moving-near-deck-plank',
        (x,.231,.130),(.620/6-.001,.022,.120),neh_wood,.001))
fixed.extend(neh_grain('reading-fixed-deck-authored-grain',(-.490,.110,-.247,.052),.2424,10))
moving.extend(neh_grain('reading-moving-deck-authored-grain',(-.490,.110,.082,.178),.2424,4))
moving.append(box_surface('reading-modern-section-indicator-edge',
    (-.190,.235,.196),(.618,.014,.012),neh_teal,.001))
parent_parts('nehemiah-reading-fixed-deck-and-posts',fixed)
g=parent_parts('nehemiah-reading-modern-support-layer',moving)
g['motion_gltf_xyz_m']=[0,.14,0];g['teaching_lift_m']=.14
g['interpretation']='Modern cutaway near-side deck plus its own feet/posts/beam/brace; fixed deck and sheet cradle remain supported'

# The expanded sample has curved ends and an independently measurable flat
# middle. Rolled samples are deliberately separate modern comparison sections.
profile=[(-.158,.282),(-.151,.273),(-.138,.265),(-.120,.260),
         (-.100,.25975),(-.060,.25975),(0,.25975),(.060,.25975),
         (.100,.25975),(.120,.260),(.138,.265),(.151,.273),(.158,.282)]
expanded=neh_sheet_strip('reading-real-blank-expanded-curved-sheet',
    profile,-.190,-.100,.200,.0025,neh_sheet,nf=8)
parent_parts('nehemiah-reading-blank-unrolled-sheet',[expanded])
cradles=[]
for x in [-.275,-.105]:cradles.append(box_surface('reading-fixed-expanded-sheet-bearing',
    (x,.25025,-.100),(.022,.0165,.220),neh_lightwood,.0005))
for label,cx,hand in [('left',-.398,-1),('right',.018,1)]:
    spiral=[]
    for i in range(161):
        t=i/160;a=2*pi*2*t;radius=.020+.016*t
        spiral.append((hand*radius*cos(a),.295+radius*sin(a)))
    rolled=neh_sheet_strip('reading-real-blank-spaced-spiral-'+label,
        spiral,cx,-.100,.200,.0025,neh_sheet,nf=6)
    parent_parts('nehemiah-reading-blank-rolled-end-'+label,[rolled])
    # Place a true bearing under the actual lowest authored spiral edge.
    min_h=min(v.co.z for v in rolled.data.vertices)
    bottom_vertices=[v.co for v in rolled.data.vertices if abs(v.co.z-min_h)<1e-7]
    contact_x=sum(v.x for v in bottom_vertices)/len(bottom_vertices)
    cradles.append(box_surface('reading-fixed-roll-bearing-'+label,
        (contact_x,(.242+min_h)/2,-.100),(.024,min_h-.242,.220),neh_lightwood,.0003))
parent_parts('nehemiah-reading-fixed-scroll-cradle',cradles)

reader=[box_surface('reading-modern-reader-position-foot',(-.190,.248,.035),
                    (.105,.012,.038),neh_teal_light,.001)]
reader.append(neh_panel('reading-modern-reader-position-panel',
    (-.190,.271,.036),.082,.040,.008,.18,neh_teal))
parent_parts('nehemiah-reading-modern-reader-marker',reader)
explain=[box_surface('reading-modern-explainer-foot',(.293,.026,.045),
    (.128,.016,.090),neh_teal_light,.002)]
explain.append(box_surface('reading-modern-explainer-marker-support',
    (.293,.049,.045),(.018,.030,.018),neh_darkwood,.001))
explain.append(neh_panel('reading-modern-explainer-distinct-panel',
    (.293,.084,.050),.106,.060,.009,.35,neh_teal))
parent_parts('nehemiah-reading-modern-explainer-markers',explain)
listeners=[]
for j,(x,f,rx,rf) in enumerate([(.250,-.205,.060,.037),(.453,.060,.042,.060),(.340,.267,.073,.032)]):
    listeners.append(neh_round_marker('reading-modern-listener-distinct-low-marker',
        x,.018,f,rx,rf,.017,neh_ochre if j%2 else neh_lightwood))
parent_parts('nehemiah-reading-modern-listener-markers',listeners)
neh_finish(nehemiah_reading_scene,'nehemiah-reading',
    'Original supported platform and fixed cradle with genuinely thick blank expanded/spiral sheet sections; distinct modern reader/explainer/listener markers. One support-side lift, no unroll animation or stairs. Not original platform/scroll/substrate/axis count, named people, compulsory emotion or later festival booths.',g.name,.14)
