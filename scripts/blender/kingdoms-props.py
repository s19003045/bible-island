"""Original Kingdoms teaching assets, built with the shared Blender helpers.

Read docs/review/KINGDOMS-RESEARCH-START.md in full. These modern reading objects
are not excavated documents, seats, cult images, altars, gate plans or standards.
No readable ancient text, coins, precise map, horned altar, plating method,
false bottom, cheating mechanism, calibrated unit or sacrifice is supplied.
Gold is a selected display colour, not identification of either original calf.
All measurement objects belong to a separately named Amos 8:4-6 extension;
the generic public gate expresses Amos 5's setting, not an identified speech.
Requires the shared authoring helpers plus sinai_closed_grid/abraham_fieldstone.
"""

kingdom_wood = material('kingdom-original-reading-wood', (.325, .222, .120), .96)
kingdom_wood_edge = material('kingdom-reading-wood-grain', (.185, .115, .055), .99)
kingdom_neutral = material('kingdom-modern-neutral-fixture', (.186, .243, .257), .87)
kingdom_pale = material('kingdom-modern-pale-fixture', (.477, .462, .406), .96)
kingdom_request = material('kingdom-modern-request-marker', (.413, .324, .195), .94)
kingdom_advice = material('kingdom-modern-two-advice-markers', (.369, .370, .300), .96)
kingdom_response = material('kingdom-modern-response-marker', (.246, .325, .333), .93)
kingdom_gold = material('kingdom-selected-gold-colour-not-fabrication', (.570, .356, .100), .64, .64)
kingdom_gold_dark = material('kingdom-selected-gold-hoof-and-detail', (.312, .206, .074), .72, .48)
kingdom_stone = material('kingdom-original-gate-stone', (.400, .370, .301), .99)
kingdom_stone_pale = material('kingdom-original-pale-gate-stone', (.462, .425, .348), .98)
kingdom_clay = material('kingdom-ordinary-grain-container-clay', (.397, .251, .149), .96)
kingdom_pan_metal = material('kingdom-selected-plain-pan-metal', (.318, .267, .168), .65, .54)
kingdom_rope = material('kingdom-selected-balance-cord', (.306, .269, .185), .98)
kingdom_weight = material('kingdom-uninscribed-comparison-weight', (.272, .276, .248), .97)
kingdom_grain = material('kingdom-selected-grain-sample', (.497, .380, .192), .96)
kingdom_clear = material('kingdom-modern-transparent-capacity-layer', (.296, .461, .467), .27)
bs = kingdom_clear.node_tree.nodes.get('Principled BSDF')
bs.inputs['Transmission Weight'].default_value = .45
bs.inputs['Alpha'].default_value = .24
bs.inputs['IOR'].default_value = 1.44
kingdom_clear.surface_render_method = 'DITHERED'


def kingdom_tray(name, center, width, depth, rim, floor, mat):
    """A closed, rounded rectangular shell with a genuine inner floor."""
    x0, h0, f0 = center; n = 96; vs = []; fs = []
    sections = [(.955, 0), (1, .008), (1, rim-.012), (.990, rim),
                (.930, rim), (.920, rim-.013), (.903, floor)]
    for j, (radius, height) in enumerate(sections):
        for k in range(n):
            a = k*2*pi/n
            xx = math.copysign(abs(cos(a))**.25, cos(a))
            ff = math.copysign(abs(sin(a))**.25, sin(a))
            vs.append(xyz(x0+width*.5*radius*xx, h0+height,
                          f0+depth*.5*radius*ff))
            if j:
                fs.append(((j-1)*n+k, (j-1)*n+(k+1)%n, j*n+(k+1)%n, j*n+k))
    bottom = len(vs); vs.append(xyz(x0, h0, f0))
    inside = len(vs); vs.append(xyz(x0, h0+floor, f0))
    for k in range(n):
        fs.extend([(bottom, (k+1)%n, k), (inside, 6*n+k, 6*n+(k+1)%n)])
    obj = mesh(name, vs, fs, mat, variation=.065)
    # The broad planar floors remain visually flat under oblique inspection.
    for face in list(obj.data.polygons)[6*n:]: face.use_smooth = False
    return obj


def kingdom_base(name, width=1.30, depth=.90):
    return sinai_closed_grid(name, (-width/2, width/2, -depth/2, depth/2), 24, 16,
        lambda x, f: .017+.0004*sin(x*51+f*33), 0, kingdom_pale, .07)


def kingdom_finish(scene, aid, interpretation, removable=None):
    bpy.context.window.scene = scene; bpy.context.view_layer.update()
    deps = bpy.context.evaluated_depsgraph_get(); deps.update()
    points = [obj.evaluated_get(deps).matrix_world@v.co
              for obj in scene.objects if obj.type == 'MESH'
              for v in obj.evaluated_get(deps).data.vertices]
    low = [min(p[i] for p in points) for i in range(3)]
    high = [max(p[i] for p in points) for i in range(3)]
    finish_static(scene, aid, round(high[2], 6))
    report['assets'][aid].update({'interpretation': interpretation,
        'prototype_only': False, 'bottom': low[2],
        'dimensions': [high[i]-low[i] for i in range(3)],
        'source_scene': scene.name,
        'semantic_groups': [obj.name for obj in scene.objects if obj.type == 'EMPTY'],
        'modern_removable_layer': removable,
        'modern_layer_lift_m': scene.objects[removable].get('teaching_lift_m') if removable else None,
        'modern_layer_axis': 'glTF +Y; Blender +Z'})
    if report['assets'][aid]['triangles'] > 30000:
        raise RuntimeError(aid+' exceeds 30k triangles')


kingdom_assembly_scene = new_scene('Kingdoms — modern negotiation reading tray, 1 Kings 12:1-24')
tray = kingdom_tray('assembly-modern-recessed-wood-reading-tray', (0, 0, 0),
                    1.30, .90, .075, .028, kingdom_wood)
parent_parts('kingdom-assembly-modern-reading-tray', [tray])
# Modern wood grain follows the exposed border, never inscriptions or cuneiform.
grain_parts = []
for side in [-1, 1]:
    for r in range(4):
        pts = [(-.53+j*.0212, .0754, side*(.441-r*.004)+.0004*sin(j*.7+r)) for j in range(51)]
        grain_parts.append(tube('assembly-modern-tray-border-grain', pts, [.0005]*51,
                                kingdom_wood_edge, sides=4))
parent_parts('kingdom-assembly-modern-wood-surface-grain', grain_parts)

for label, x, f, mat in [('request', -.435, .035, kingdom_request),
                         ('advice-elders', -.115, -.100, kingdom_advice),
                         ('advice-peers', .165, -.100, kingdom_advice),
                         ('response', .435, .035, kingdom_response)]:
    pocket = kingdom_tray('assembly-modern-'+label+'-recess', (x, .029, f),
                          .246, .185, .039, .013, mat)
    # A plain modern marker identifies a reading position; no ancient document.
    token = box_surface('assembly-uninscribed-modern-'+label+'-marker',
        (x, .052, f), (.154, .017, .095), mat, .007)
    g = parent_parts('kingdom-assembly-'+label, [pocket, token])
    g['interpretation'] = 'Modern reading position, not an original seat or document'

parts = [box_surface('assembly-modern-three-date-rail', (0, .092, .275),
                     (1.09, .031, .137), kingdom_neutral, .007)]
for x in [-.33, 0, .33]:
    parts.append(kingdom_tray('assembly-modern-date-recess', (x, .108, .275),
                              .194, .105, .013, .005, kingdom_pale))
    obj = pottery_profile('assembly-modern-plain-date-counter',
        [(0, 0), (.031, 0), (.038, .005), (.038, .019), (.032, .025), (0, .025)],
        kingdom_request, n=48, tool=False)
    obj.location = xyz(x, .114, .275); parts.append(obj)
g = parent_parts('kingdom-assembly-modern-date-layer', parts)
g['interpretation'] = 'Three selected modern date counters, not people, ancient records, or an automatic countdown'
g['teaching_lift_m'] = .14

for label, x, f in [('shechem', -.383, -.306), ('later-jerusalem', .383, -.306)]:
    parts = [box_surface('assembly-modern-place-label-foot', (x, .044, f),
                        (.292, .030, .150), kingdom_neutral, .005)]
    parts.append(box_surface('assembly-modern-blank-place-label', (x, .134, f-.015),
                 (.275, .150, .018), kingdom_pale, .006))
    g = parent_parts('kingdom-assembly-place-'+label, parts)
    g['interpretation'] = 'Modern app-labelled place marker; model separation is not a map or measured journey'
kingdom_finish(kingdom_assembly_scene, 'kingdom-assembly',
    '1 Kings 12:1-24 modern sequence tray: request, two distinct advice positions, response, three date counters and separate Shechem/later Jerusalem markers. No archaeological document, original seat, map, ancient writing, countdown, violence or added labour choice.',
    'kingdom-assembly-modern-date-layer')


def kingdom_calf_head(name, x0, h0, f0):
    vs = []; fs = []; n = 32
    profile = [(.135, .355, .020, .035), (.170, .376, .054, .073),
               (.220, .366, .054, .066), (.276, .342, .046, .044),
               (.320, .328, .053, .032), (.347, .326, .049, .027)]
    for j, (f, h, rx, rh) in enumerate(profile):
        for k in range(n):
            a = k*2*pi/n; vs.append(xyz(x0+rx*cos(a), h0+h+rh*sin(a), f0+f))
            if j: fs.append(((j-1)*n+k, (j-1)*n+(k+1)%n, j*n+(k+1)%n, j*n+k))
    fs.extend([tuple(reversed(range(n))), tuple(5*n+k for k in range(n))])
    return mesh(name, vs, fs, kingdom_gold, variation=.045)


def kingdom_calf_ear(name, x0, h0, f0, side):
    # An actual closed 6 mm ear fold, with a pointed outline and central ridge.
    outline = [(side*.045, .399, .185), (side*.106, .414, .153),
               (side*.143, .408, .174), (side*.107, .391, .211),
               (side*.048, .386, .211)]
    vs = [xyz(x0+x, h0+h+off, f0+f) for off in [-.003, .003] for x,h,f in outline]
    vs += [xyz(x0+side*.090, h0+.407, f0+.184), xyz(x0+side*.090, h0+.396, f0+.184)]
    fs = []
    for k in range(5):
        q = (k+1)%5; fs.extend([(k,q,5+q,5+k), (10,5+k,5+q), (11,q,k)])
    return mesh(name, vs, fs, kingdom_gold, variation=.025)


def kingdom_calf(place, x0, ground=.044):
    parts = [ellipsoid(place+'-original-calf-torso', (x0, ground+.278, -.025),
                       (.115, .113, .205), kingdom_gold, seg=40, rows=26),
             ellipsoid(place+'-original-calf-neck', (x0, ground+.316, .147),
                       (.074, .113, .088), kingdom_gold, seg=28, rows=20),
             kingdom_calf_head(place+'-original-tapered-calf-face', x0, ground, 0),
             ellipsoid(place+'-original-broad-calf-muzzle', (x0, ground+.326, .348),
                       (.054, .029, .019), kingdom_gold, seg=24, rows=14)]
    for side in [-1, 1]:
        parts.append(kingdom_calf_ear(place+'-original-thick-calf-ear', x0, ground, 0, side))
        parts.append(ellipsoid(place+'-selected-calf-eye-detail',
            (x0+side*.052, ground+.390, .230), (.004, .004, .004),
            kingdom_gold_dark, seg=16, rows=10))
        parts.append(ellipsoid(place+'-selected-calf-nostril-detail',
            (x0+side*.026, ground+.333, .366), (.0065, .0045, .0018),
            kingdom_gold_dark, seg=16, rows=8))
        for fore in [-1, 1]:
            f = fore*.137; x = x0+side*.075
            parts.append(tube(place+'-original-calf-leg',
                [(x, ground+.245, f), (x, ground+.145, f-fore*.009), (x, ground+.030, f+.012)],
                [.030, .021, .017], kingdom_gold, sides=16))
            for toe in [-1, 1]:
                hoof = ellipsoid(place+'-original-cloven-contact-hoof',
                    (x+toe*.016, ground+.022, f+.025), (.015, .022, .034),
                    kingdom_gold_dark, seg=16, rows=10)
                for v in hoof.data.vertices:
                    if v.co.z < ground+.006: v.co.z = ground
                parts.append(hoof)
    parts.append(tube(place+'-original-calf-tail',
        [(x0, ground+.312, -.213), (x0+.010, ground+.239, -.267), (x0+.012, ground+.157, -.281)],
        [.012, .009, .005], kingdom_gold, sides=12))
    g = parent_parts('kingdom-sites-'+place+'-calf', parts)
    g['interpretation'] = 'Original modern gold-colour calf silhouette; no recovered original, known size, horn morphology or plating process'
    g['not_sacrificial_animal'] = True
    return g


kingdom_sites_scene = new_scene('Kingdoms — physically separated two-place comparison, 1 Kings 12:25-33')
comparison_parts = []
for place, x in [('bethel', -.370), ('dan', .370)]:
    base = box_surface(place+'-plain-modern-separate-display-base', (x, .022, 0),
                       (.560, .044, .860), kingdom_pale, .007)
    parent_parts('kingdom-sites-'+place+'-separate-base', [base])
    kingdom_calf(place, x)
    # Two independent modern back panels: no common court, altar or steel shrine.
    for dx in [-.215, .215]:
        comparison_parts.append(box_surface(place+'-modern-comparison-panel-upright',
            (x+dx, .145, -.360), (.010, .200, .010), kingdom_neutral, .001))
    comparison_parts.append(box_surface(place+'-modern-comparison-panel-crossbar',
        (x, .246, -.360), (.440, .012, .010), kingdom_neutral, .002))
    comparison_parts.append(box_surface(place+'-modern-blank-comparison-panel',
        (x, .148, -.360), (.418, .183, .004), kingdom_clear, .001))
g = parent_parts('kingdom-sites-modern-comparison-layer', comparison_parts)
g['interpretation'] = 'Two separate modern comparison panels; no copied Tel Dan metal altar frame or archaeological inscription'
g['teaching_lift_m'] = .14
kingdom_finish(kingdom_sites_scene, 'kingdom-sites',
    '1 Kings 12:25-33 supplies two calves and two places. These independently based original calf silhouettes, scale, posture, horn omission and gold colour are modern choices. No recovered originals, horned altar, known manufacturing method, shared court, measured geography or devotional/sacrificial action.',
    'kingdom-sites-modern-comparison-layer')


def kingdom_round_profile(name, center, profile, mat, n=64):
    obj = pottery_profile(name, profile, mat, n=n, tool=False)
    obj.location = xyz(*center)
    return obj


def kingdom_pan(name, x, f):
    # Floor at .131; 8 mm bottom and a real rolled 7-9 mm rim.
    return kingdom_round_profile(name, (x, 0, f),
        [(0,.122),(.058,.122),(.093,.130),(.109,.153),(.111,.166),
         (.108,.171),(.102,.171),(.100,.163),(.098,.153),(.084,.139),(.054,.131),(0,.131)],
        kingdom_pan_metal, n=64)


kingdom_measures_scene = new_scene('Kingdoms — public gate and separate Amos 8 capacity-weight comparison')
parent_parts('kingdom-measures-modern-display-base', [kingdom_base('measures-modern-display-base')])
gate_parts = []
for x in [-.535, -.105]:
    for j in range(5):
        gate_parts.append(abraham_fieldstone('measures-original-public-gate-jamb-stone',
            (x, .073+j*.110, -.304), (.113, .110, .140), 320+j+int(x*100),
            kingdom_stone if j%2 else kingdom_stone_pale))
gate_parts.append(box_surface('measures-generic-stone-gate-lintel', (-.320, .629, -.304),
    (.553, .102, .154), kingdom_stone_pale, .005))
g = parent_parts('kingdom-measures-original-public-gate-outline', gate_parts)
g['interpretation'] = 'Amos 5 public setting only; original generic opening, not an identified Amos speech gate, date or excavation plan'
extension_groups = []
container = kingdom_round_profile('measures-ordinary-real-inner-wall-and-floor-container', (-.370,.017,.190),
    [(0,0),(.075,0),(.100,.023),(.124,.110),(.129,.191),(.120,.238),(.112,.250),
     (.102,.250),(.099,.235),(.108,.190),(.105,.115),(.084,.043),(.066,.021),(0,.021)],
    kingdom_clay, n=80)
g = parent_parts('kingdom-measures-hollow-grain-container', [container]); extension_groups.append(g)
g['interpretation'] = 'Selected ordinary container; no excavated ephah, claimed 22 L capacity, universal standard or hidden false bottom'
# Sparse real kernels leave the central inner floor unobstructed for observation.
parts = []
for j in range(18):
    a = 2*pi*j/18; r = .045+.004*sin(j*2.1)
    obj = ellipsoid('measures-selected-grain-sample-kernel',
        (-.370+r*cos(a), .0413+.0015*(j%2), .190+r*sin(a)),
        (.0034,.0033,.0085), kingdom_grain, seg=10, rows=6)
    center = Vector(xyz(-.370+r*cos(a), .0413+.0015*(j%2), .190+r*sin(a)))
    for v in obj.data.vertices:
        dx = v.co.x-center.x; dy = v.co.y-center.y
        v.co.x = center.x+dx*cos(a*.7)-dy*sin(a*.7)
        v.co.y = center.y+dx*sin(a*.7)+dy*cos(a*.7)
    parts.append(obj)
extension_groups.append(parent_parts('kingdom-measures-selected-grain-sample', parts))
# A visibly modern translucent volume, separately removable. It is not a lining,
# ancient insert, physical measure unit, water, or a disguised second vessel floor.
volume = kingdom_round_profile('measures-modern-transparent-volume-comparison', (-.370,0,.190),
    [(0,.039),(.055,.039),(.079,.064),(.097,.121),(.100,.187),(0,.187)],
    kingdom_clear, n=64)
parts = [volume]
for h,r in [(.064,.080),(.121,.098),(.188,.101)]:
    pts=[(-.370+r*cos(k*2*pi/64),h,.190+r*sin(k*2*pi/64)) for k in range(65)]
    parts.append(tube('measures-modern-transparent-layer-contour',pts,[.0011]*65,kingdom_neutral,sides=6))
g = parent_parts('kingdom-measures-modern-capacity-layer',parts);extension_groups.append(g)
g['interpretation'] = 'Liftable modern transparent capacity comparison; no numeric unit or historical insert'
g['teaching_lift_m'] = .25

parts = [box_surface('measures-selected-balance-cross-foot',(.320,.035,.010),
                     (.290,.035,.260),kingdom_wood,.004),
         tube('measures-selected-balance-upright',[(.320,.050,0),(.320,.550,0)],
              [.016,.012],kingdom_wood,sides=16),
         box_surface('measures-selected-balanced-wood-beam',(.320,.590,0),
                     (.600,.025,.024),kingdom_wood,.003)]
for f in [-.032,.032]:
    parts.append(box_surface('measures-selected-fulcrum-fork',(.320,.568,f),
                            (.023,.108,.017),kingdom_wood,.002))
parts.append(tube('measures-selected-ordinary-fulcrum-pin',[(.320,.590,-.049),(.320,.590,.049)],
                  [.006,.006],kingdom_pan_metal,sides=12))
for f in [-.006,.006]:
    pts=[(.035+j*.015,.603,f+.0005*sin(j*.7)) for j in range(39)]
    parts.append(tube('measures-selected-beam-grain',pts,[.0005]*39,kingdom_wood_edge,sides=4))
extension_groups.append(parent_parts('kingdom-measures-balance-frame',parts))

for side,x in [('left',.080),('right',.560)]:
    g = parent_parts('kingdom-measures-'+side+'-pan',[kingdom_pan('measures-'+side+'-true-hollow-pan',x,0)])
    g['interpretation']='Selected uncalibrated hollow pan, not a known museum original';extension_groups.append(g)
    parts=[tube('measures-'+side+'-top-hanger-connection',[(x,.579,0),(x,.558,0)],
                [.004,.004],kingdom_pan_metal,sides=10)]
    for k in range(3):
        a=2*pi*k/3;f=.104*sin(a);xx=x+.104*cos(a)
        parts.append(tube('measures-'+side+'-real-connected-suspension-cord',
            [(x,.560,0),(xx,.168,f)],[.0025,.0025],kingdom_rope,sides=10))
    extension_groups.append(parent_parts('kingdom-measures-'+side+'-suspension',parts))

parts=[]
for j,(x,f,r,h) in enumerate([(.166,.280,.023,.043),(.292,.280,.028,.053),(.432,.280,.033,.063),(.065,.037,.018,.037)]):
    base=.0175 if j<3 else .131
    parts.append(kingdom_round_profile('measures-ordinary-uninscribed-weight', (x,base,f),
        [(0,0),(r,0),(r,.010),(r*.76,h*.80),(r*.52,h),(0,h)],kingdom_weight,n=16))
extension_groups.append(parent_parts('kingdom-measures-uninscribed-weight-comparison',parts))
g=parent_parts('kingdom-measures-amos8-extension',extension_groups)
g['cross_reference']='Amos 8:4-6 extension, not an Amos 5 object list'
g['interpretation']='Capacity and weight are distinct observations; apparatus, cord count, weights and sizes are selected, no cheating instruction or calibrated equality'
kingdom_finish(kingdom_measures_scene,'kingdom-measures',
    'Amos 5 generic public-gate context; the separately grouped Amos 8:4-6 extension compares container capacity and weight. Original true hollow grain vessel, removable modern volume, two hollow pans, actual connected cords and uninscribed weights. No identified gate/standard, unit conversion, false bottom, cheating mechanism, coin or ancient writing.',
    'kingdom-measures-modern-capacity-layer')
report['assets']['kingdom-measures']['extension_group']='kingdom-measures-amos8-extension'
report['assets']['kingdom-measures']['core_reference']='AMO.5.CSBT'
report['assets']['kingdom-measures']['extension_reference']='AMO.8.4-6.CSBT'
