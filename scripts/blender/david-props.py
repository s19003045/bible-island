"""Original David teaching assets, built with the shared Blender helpers.

Read docs/review/DAVID-RESEARCH-START.md. These are modern desk comparisons,
not identified pasture, breed, oil horn, palace, waterwork, ark or tent remains.
The sheep copies our authored abraham-animals.py mesh as a life illustration;
no imported animal, archaeological phenotype or sacrificial animal is supplied.
The covered ark diagram uses cross-book EXO.25.10–22 and 1CH.15.11–15 alongside
2SA.6; dimensions are miniature display choices, never a new cubit conversion.
No cherub likeness, uncovered sacred contents, removable poles, death action,
six bearers, royal-selection game, attack route or future Temple appears.

Ark phases occupy the SAME display origin, not a continuous procession. glTF
has no core node-visibility switch: all four phase nodes are exported with
explicit extras, and the later UI MUST show only its selected phase. After
export this authored Blender scene defaults to phase 1 for safe previews.
Requires main helpers, sinai_closed_grid / sinai_thick_sheet, abraham_fieldstone,
and the original ewe_scene already authored by abraham-animals.py.
"""

david_horn_outer = material('david-selected-keratin-horn-outer', (.335, .242, .133), .89)
david_horn_inner = material('david-selected-keratin-horn-inner', (.415, .320, .198), .94)
david_oil_mat = material('david-unspecified-oil-comparison', (.308, .202, .073), .22)
david_oil_mat.node_tree.nodes.get('Principled BSDF').inputs['Transmission Weight'].default_value = .24
david_oil_mat.node_tree.nodes.get('Principled BSDF').inputs['IOR'].default_value = 1.46
david_ground_mat = material('david-modern-desk-ground', (.385, .330, .241), 1)
david_fixture_mat = material('david-modern-comparison-fixture', (.174, .230, .244), .91)
david_stone_mat = material('david-original-rough-construction-stone', (.386, .352, .282), .99)
david_stone_light = material('david-original-pale-construction-stone', (.453, .402, .315), 1)
david_timber_mat = material('david-selected-timber-comparison', (.273, .164, .076), .97)
david_grain_mat = material('david-timber-grain-lines', (.148, .085, .036), .99)
david_cover_mat = material('david-modern-uninscribed-ark-cover', (.337, .369, .311), .99)
david_tent_mat = material('david-selected-tent-canvas', (.481, .421, .312), .99)
david_ring_mat = material('david-cross-book-fixed-ring-comparison', (.470, .301, .104), .48, .55)


def david_plate(name, width=1.3, depth=.90):
    return sinai_closed_grid(name, (-width/2, width/2, -depth/2, depth/2), 28, 18,
        lambda x, f: .010+.0006*sin(x*61+f*47), 0, david_ground_mat, .09)


def david_copy_life_sheep():
    """Copy authored source data; keep the source ewe unchanged and inspectable."""
    if 'ewe_scene' not in globals():
        raise RuntimeError('Author abraham-animals.py before david-props.py; no external animal is loaded')
    source = ewe_scene
    destination = bpy.context.scene
    root = bpy.data.objects.new('david-shepherd-sheep', None); destination.collection.objects.link(root)
    copies = {}
    for old in source.objects:
        if old.type not in ['MESH', 'EMPTY']:
            continue
        new = old.copy()
        if old.data:
            new.data = old.data.copy()
        new.name = 'david-shepherd-'+old.name
        if old.name == 'ewe-head': new.name = 'david-shepherd-sheep-head'
        if old.name == 'ewe-tail': new.name = 'david-shepherd-sheep-tail'
        destination.collection.objects.link(new); copies[old] = new
        # Real flat contact patches on both cloven toes; copied source only.
        if old.type == 'MESH' and any(m and m.name.startswith('ewe-split-hooves') for m in old.data.materials):
            for vertex in new.data.vertices:
                if vertex.co.z < .008:
                    vertex.co.z = .0015
    for old, new in copies.items():
        new.parent = copies.get(old.parent, root)
        new.matrix_parent_inverse = old.matrix_parent_inverse.copy()
        new.matrix_basis = old.matrix_basis.copy()
    root.location = xyz(-.245, .010, -.040)
    root.rotation_euler.z = pi/2
    root.scale = (.68, .68, .68)
    root['original_source'] = 'scripts/blender/abraham-animals.py'
    root['interpretation'] = 'Original life illustration; breed, sex, scale and coat are selected, not an identified biblical flock'
    return root


def david_horn_center(t):
    return Vector(xyz(.414-.220*(1-t)**2, .031+.310*t, .116+.035*sin(pi*t)))


def david_horn_ring(t, radius, n=48):
    center = david_horn_center(t)
    tangent = Vector((.440*(1-t), -.035*pi*cos(pi*t), .310)).normalized()
    u = Vector((tangent.z, 0, -tangent.x)).normalized(); v = tangent.cross(u).normalized()
    result = []
    for k in range(n):
        a = 2*pi*k/n
        ripple = 1+.011*sin(a*5+t*15)+.005*sin(a*13-t*31)
        result.append(tuple(center+u*(radius*ripple*cos(a))+v*(radius*ripple*sin(a))))
    return result


def david_oil_horn():
    """A connected closed cross-section, wide open mouth and sealed narrow end."""
    vs = []; fs = []; n = 48
    # Outer tip-to-mouth, a true rim, then inner mouth-to-floor.
    rows = [(j/36, .006+.066*(j/36)**1.4, False) for j in range(37)]
    rows += [(j/36, .006+.066*(j/36)**1.4-.0055, True) for j in range(36, 3, -1)]
    for row, (t, r, inside) in enumerate(rows):
        vs += david_horn_ring(t, r, n)
        if row:
            for k in range(n):
                fs.append(((row-1)*n+k, (row-1)*n+(k+1)%n, row*n+(k+1)%n, row*n+k))
    bottom = len(vs); vs.append(tuple(david_horn_center(0)))
    inner_floor = len(vs); vs.append(tuple(david_horn_center(4/36)))
    for k in range(n):
        fs.extend([(bottom, (k+1)%n, k),
                   (inner_floor, (len(rows)-1)*n+k, (len(rows)-1)*n+(k+1)%n)])
    horn = mesh('shepherd-closed-tip-oil-horn-with-real-inner-floor', vs, fs,
                david_horn_outer, variation=.09)
    horn.data.materials.append(david_horn_inner)
    outer_faces = 36*n
    side_faces = (len(rows)-1)*n
    for index, face in enumerate(horn.data.polygons):
        if outer_faces <= index < side_faces or (index >= side_faces and (index-side_faces)%2 == 1):
            face.material_index = 1
    colors = horn.data.color_attributes['surface']
    for index in range(37*n, len(rows)*n):
        variation = 1+.035*sin(index*.37)
        colors.data[index].color = (*(c*variation for c in david_horn_inner.diffuse_color[:3]), 1)
    colors.data[inner_floor].color = (*david_horn_inner.diffuse_color[:3], 1)
    # The principal shape is not perforated as a blowing instrument.
    horn['interpretation'] = 'Ordinary oil-container teaching choice; sealed narrow end, not a playable horn'
    return horn


david_shepherd_scene = new_scene('David — life sheep and ordinary oil horn, 1 Samuel 16')
parent_parts('david-shepherd-modern-display-ground', [david_plate('shepherd-modern-display-ground', 1.30, .90)])
david_copy_life_sheep()
horn = david_oil_horn()
parent_parts('david-shepherd-oil-horn-shell', [horn])
# A thin oil sheet can be hidden separately to inspect the true internal floor.
oil = pottery_profile('shepherd-thin-selected-oil-surface',
    [(0, .271), (.040, .271), (.040, .273), (.029, .2735), (0, .273)],
    david_oil_mat, n=64, tool=False)
oil.location = xyz(.403, 0, .139)
parent_parts('david-shepherd-oil-surface', [oil])
support = [box_surface('shepherd-modern-horn-support-foot', (.302, .021, .135),
    (.174, .020, .132), david_fixture_mat, .004)]
for side in [-1, 1]:
    support.append(tube('shepherd-modern-horn-cradle',
        [(.285, .030, .135+side*.048), (.307, .099, .135+side*.037), (.322, .135, .135+side*.023)],
        [.0055, .0045, .0035], david_fixture_mat, sides=8))
parent_parts('david-shepherd-modern-horn-support', support)
finish_static(david_shepherd_scene, 'david-shepherd', .520)
report['assets']['david-shepherd']['interpretation'] = (
    '1 Samuel 16 life-object comparison; authored ewe copied and uniformly scaled '
    'from abraham-animals.py, with flattened cloven contact patches; no identified '
    'breed, original flock, chosen-king game or blowing-instrument claim')
report['assets']['david-shepherd']['reused_original_source'] = 'scripts/blender/abraham-animals.py'
report['assets']['david-shepherd']['removable_group'] = 'david-shepherd-oil-surface'


def david_city_height(x, f):
    return (.011+.191*math.exp(-((x+.315)/.295)**2-((f+.103)/.350)**2)
            +.022*sin(x*17+f*12)*math.exp(-((x+.30)/.40)**2-((f+.10)/.38)**2))


david_city_scene = new_scene('David — original ridge and wood-stone section, 2 Samuel 5')
terrain = sinai_closed_grid('city-invented-ridge-without-waterway', (-.68, .68, -.45, .45), 44, 30,
                            david_city_height, 0, david_ground_mat, .13)
parent_parts('david-city-original-ridge', [terrain])
fort_parts = []
# A deliberately generic open-front enclosure, unrelated to a measured site.
for row in range(2):
    for col in range(4):
        x = -.569+col*.133
        f = -.270
        h = david_city_height(x, f)+.039+row*.075
        fort_parts.append(abraham_fieldstone('city-generic-ridge-enclosure-rear-stone',
            (x, h, f), (.130, .073, .084), 111+row*4+col,
            david_stone_mat if (row+col)%2 else david_stone_light))
    for side in [-1, 1]:
        x = -.370+side*.248
        for j in range(3):
            f = -.164+j*.108
            h = david_city_height(x, f)+.039+row*.075
            fort_parts.append(abraham_fieldstone('city-generic-enclosure-side-stone',
                (x, h, f), (.085, .073, .105), 129+row*6+j+side,
                david_stone_mat if j%2 else david_stone_light))
parent_parts('david-city-generic-fortress-outline', fort_parts)

section_parts = [box_surface('city-modern-section-floor', (.367, .024, .112),
    (.496, .026, .490), david_fixture_mat, .004)]
for row in range(3):
    for col in range(3):
        x = .188+col*.157
        section_parts.append(abraham_fieldstone('city-section-rear-masonry',
            (x, .055+row*.060, -.086), (.155, .060, .100), 151+row*3+col, david_stone_light))
    for j in range(2):
        section_parts.append(abraham_fieldstone('city-section-return-masonry',
            (.165, .055+row*.060, .037+j*.143), (.100, .060, .140), 169+row*2+j, david_stone_mat))
parent_parts('david-city-stone-construction-section', section_parts)

timber_parts = []
# Selected half-lap comparison: two real complementary half-depth middle pieces.
# This is not a claim that the palace used this particular joinery or dimension.
for x in [.206, .528]:
    timber_parts.append(box_surface('city-longitudinal-full-depth-timber', (x, .247, .112),
        (.232, .060, .090), david_timber_mat, .002))
timber_parts.append(box_surface('city-longitudinal-half-depth-lap', (.367, .232, .112),
    (.090, .030, .090), david_timber_mat, .001))
for f in [-.0345, .2585]:
    timber_parts.append(box_surface('city-transverse-full-depth-timber', (.367, .247, f),
        (.090, .060, .203), david_timber_mat, .002))
timber_parts.append(box_surface('city-transverse-complementary-upper-lap', (.367, .262, .112),
    (.090, .030, .090), david_timber_mat, .001))
for f in [.085, .112, .139]:
    pts = [(.090+j*.0222, .278+.0005*sin(j*.9+f*23), f+.0015*sin(j*.7)) for j in range(26)]
    timber_parts.append(tube('city-selected-longitudinal-grain-line', pts, [.00055]*26,
                             david_grain_mat, sides=4))
parent_parts('david-city-timber-layer', timber_parts)
finish_static(david_city_scene, 'david-city', .306)
report['assets']['david-city']['interpretation'] = (
    '2 Samuel 5 original ridge, generic enclosure and separate wood-stone '
    'construction comparison; no identified palace, measured topography, '
    'attack route, water shaft, later city wall or proven joinery reconstruction')
report['assets']['david-city']['removable_group'] = 'david-city-timber-layer'


def david_covered_chest(name, center, width=.568, depth=.342, height=.278):
    """Closed modern fabric-covered volume; no opening lid or cherub likeness."""
    x0, h0, f0 = center; vs = []; fs = []; n = 64
    levels = [(0, .94), (.018, 1), (.075, 1.01), (.40, 1), (.78, .99),
              (.94, .99), (1, .94), (1.022, .63)]
    for row, (h, scale) in enumerate(levels):
        for k in range(n):
            a = k*2*pi/n
            cx = (1 if cos(a) >= 0 else -1)*abs(cos(a))**.23
            cf = (1 if sin(a) >= 0 else -1)*abs(sin(a))**.23
            fold = .0023*sin(a*21+h*5)+.0011*sin(a*35-h*11)
            vs.append(xyz(x0+(width*.5*scale+fold)*cx,
                h0+h*height+.0011*sin(a*9)*sin(pi*row/7),
                f0+(depth*.5*scale+fold)*cf))
            if row:
                fs.append(((row-1)*n+k, (row-1)*n+(k+1)%n, row*n+(k+1)%n, row*n+k))
    low = len(vs); vs.append(xyz(x0, h0, f0))
    top = len(vs); vs.append(xyz(x0, h0+height*1.024, f0))
    for k in range(n):
        fs.extend([(low, (k+1)%n, k), (top, 7*n+k, 7*n+(k+1)%n)])
    obj = mesh(name, vs, fs, david_cover_mat, variation=.07)
    obj['cross_book_basis'] = 'Exodus 25:10–22; 1 Chronicles 15:11–15; not all supplied by 2 Samuel 6'
    obj['no_opening_or_pole_removal'] = True
    return obj


def david_fixed_bearing_parts(height):
    parts = []
    for f in [-.202, .202]:
        parts.append(tube('ark-fixed-cross-book-bearing-pole', [(-.594, height, f), (.594, height, f)],
            [.011, .011], david_timber_mat, sides=16))
        for x in [-.183, .183]:
            pts = [(x, height+.021*cos(k*2*pi/40), f+.021*sin(k*2*pi/40)) for k in range(41)]
            parts.append(tube('ark-fixed-cross-book-pole-ring', pts, [.0035]*41, david_ring_mat, sides=6))
    return parts


def david_cart_wheel(name, x, h, f):
    """An actual open-spoked wooden wheel with an annular rim."""
    vs = []; fs = []; n = 48
    section = [(.128, -.014), (.151, -.014), (.157, -.008), (.157, .008),
               (.151, .014), (.128, .014), (.124, .008), (.124, -.008)]
    for j, (r, off) in enumerate(section):
        for k in range(n):
            a = 2*pi*k/n; vs.append(xyz(x+r*cos(a), h+r*sin(a), f+off))
    for j in range(len(section)):
        for k in range(n):
            fs.append((j*n+k, j*n+(k+1)%n, ((j+1)%len(section))*n+(k+1)%n,
                       ((j+1)%len(section))*n+k))
    parts = [mesh(name+'-real-annular-wood-rim', vs, fs, david_timber_mat, variation=.10)]
    for i in range(8):
        a = i*2*pi/8
        parts.append(tube(name+'-open-wood-spoke', [(x+.025*cos(a), h+.025*sin(a), f),
            (x+.128*cos(a), h+.128*sin(a), f)], [.008, .006], david_timber_mat, sides=8))
    parts.append(tube(name+'-wood-hub', [(x, h, f-.027), (x, h, f+.027)],
                      [.029, .029], david_timber_mat, sides=16))
    return parts


def david_phase_parent(name, parts, order, label, default=False):
    group = parent_parts(name, parts)
    group['phase_order'] = order
    group['phase_id'] = ['cart', 'pause', 'carry', 'tent'][order-1]
    group['phase_label'] = label
    group['default_visible'] = default
    group['mutually_exclusive_phase'] = True
    group['cross_references'] = '2 Samuel 6; Exodus 25:10–22; 1 Chronicles 15:11–15'
    return group


def david_canvas(name, upper, width_count):
    """A fabric surface thickened along its normals, including vertical walls."""
    vs = [xyz(*p) for p in upper]; fs = []; rows = len(upper)//width_count
    for j in range(rows-1):
        for i in range(width_count-1):
            q = j*width_count+i
            fs.append((q, q+1, q+width_count+1, q+width_count))
    obj = mesh(name, vs, fs, david_tent_mat, variation=.065)
    modifier = obj.modifiers.new('actual-canvas-normal-thickness', 'SOLIDIFY')
    modifier.thickness = .0025; modifier.offset = 0
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    return obj


david_ark_scene = new_scene('David — mutually exclusive ark time comparisons, 2 Samuel 6')
david_ark_phases = []

# 1: New cart. Cover leaves any unmodeled details beneath it unspecified.
parts = [david_plate('ark-phase-1-modern-display-base', 1.30, .90)]
for j in range(6):
    parts.append(box_surface('ark-selected-new-cart-deck-plank', (0, .261, -.235+j*.094),
        (.815, .030, .090), david_timber_mat, .003))
for f in [-.183, .183]:
    parts.append(box_surface('ark-selected-cart-frame', (0, .220, f),
        (.815, .056, .045), david_timber_mat, .003))
parts.append(tube('ark-selected-cart-axle', [(0, .172, -.335), (0, .172, .335)],
                  [.017, .017], david_timber_mat, sides=16))
for f in [-.315, .315]:
    parts += david_cart_wheel('ark-selected-cart-wheel', 0, .172, f)
for f in [-.145, .145]:
    parts.append(tube('ark-selected-cart-drawbar', [(.287, .221, f), (.614, .165, f*.55)],
                      [.012, .008], david_timber_mat, sides=10))
parts.append(david_covered_chest('ark-phase-1-uninscribed-covered-volume', (0, .278, 0)))
david_ark_phases.append(david_phase_parent('david-ark-phase-cart', parts, 1, 'New cart; interrupted journey', True))

# 2: Stay at a house. Duration belongs to the later UI text, not three invented
# vessels, six measures, a literal timetable or an identified house plan.
parts = [david_plate('ark-phase-2-modern-display-base', 1.30, .90),
         box_surface('ark-phase-2-generic-house-rear', (0, .240, -.289),
                     (.968, .460, .046), david_stone_light, .005)]
for x in [-.462, .462]:
    parts.append(box_surface('ark-phase-2-generic-house-return', (x, .240, -.096),
        (.045, .460, .340), david_stone_mat, .005))
parts.append(box_surface('ark-phase-2-modern-rest-display', (0, .047, .025),
    (.713, .070, .490), david_fixture_mat, .004))
parts.append(david_covered_chest('ark-phase-2-covered-resting-volume', (0, .083, .025)))
david_ark_phases.append(david_phase_parent('david-ark-phase-pause', parts, 2, 'Separate three-month stay; selected house outline'))

# 3: Later bearing comparison. Fixed poles remain in their rings. Modern stands
# replace any guessed bearer count; six steps never becomes six modeled people.
parts = [david_plate('ark-phase-3-modern-display-base', 1.30, .90),
         david_covered_chest('ark-phase-3-fixed-pole-covered-volume', (0, .194, 0))]
parts += david_fixed_bearing_parts(.269)
for x in [-.410, .410]:
    for f in [-.202, .202]:
        parts.append(tube('ark-phase-3-obvious-modern-display-support', [(x, .011, f), (x, .256, f)],
                          [.009, .007], david_fixture_mat, sides=8))
    parts.append(box_surface('ark-phase-3-modern-display-support-foot', (x, .022, 0),
        (.100, .022, .512), david_fixture_mat, .004))
david_ark_phases.append(david_phase_parent('david-ark-phase-carry', parts, 3, 'Later bearing; fixed poles compared across books'))

# 4: Placement in an original open-front tent. No Temple or full Tabernacle plan.
parts = [david_plate('ark-phase-4-modern-display-base', 1.30, .90),
         david_covered_chest('ark-phase-4-covered-placed-volume', (0, .045, -.015))]
parts += david_fixed_bearing_parts(.120)
upper = []; nx = 28; nf = 20
for j in range(nf+1):
    f = -.362+j*.724/nf
    for i in range(nx+1):
        u = i/nx; x = -.625+1.25*u
        h = .452+.222*(1-abs(u-.5)*2)+.0025*sin(u*16*pi+f*9)
        upper.append((x, h, f+.002*sin(u*12*pi)))
parts.append(david_canvas('ark-phase-4-selected-thick-tent-roof', upper, nx+1))
for x in [-.625, .625]:
    upper = []
    for j in range(17):
        h = .025+j*.425/16
        for k in range(21):
            f = -.362+k*.724/20
            upper.append((x+.003*sin(k*.9+h*9), h, f))
    parts.append(david_canvas('ark-phase-4-selected-thick-side-canvas', upper, 21))
upper = []
for j in range(17):
    t = j/16
    for i in range(29):
        u = i/28; x = -.625+1.25*u; roof = .450+.222*(1-abs(u-.5)*2)
        upper.append((x, .025+(roof-.025)*t, -.362+.002*sin(u*12*pi+t*8)))
parts.append(david_canvas('ark-phase-4-selected-thick-rear-canvas', upper, 29))
for x in [-.604, .604]:
    for f in [-.340, .340]:
        parts.append(tube('ark-phase-4-selected-corner-support', [(x, .011, f), (x, .454, f)],
                          [.008, .006], david_timber_mat, sides=10))
for f in [-.340, .340]:
    parts.append(tube('ark-phase-4-selected-ridge-support', [(0, .011, f), (0, .675, f)],
                      [.009, .006], david_timber_mat, sides=10))
parts.append(tube('ark-phase-4-selected-ridge-pole', [(0, .675, -.369), (0, .675, .369)],
                  [.007, .007], david_timber_mat, sides=10))
david_ark_phases.append(david_phase_parent('david-ark-phase-tent', parts, 4, 'Separate placement in an original tent; no later Temple'))

selector = parent_parts('david-ark-time-selector', david_ark_phases)
selector['phase_switch_required_before_display'] = True
selector['default_phase'] = 'david-ark-phase-cart'
selector['not_simultaneous_procession'] = True
finish_static(david_ark_scene, 'david-ark', .682)
report['assets']['david-ark']['interpretation'] = (
    '2 Samuel 6 four mutually exclusive modern time comparisons: new cart, '
    'three-month stay, later fixed-pole bearing and tent placement. Covered '
    'volumes/poles additionally cite Exodus 25:10–22 and 1 Chronicles 15:11–15; '
    'no actual engineering plan, bearer count, pole removal, opened contents, '
    'death mechanism, uninterrupted procession or future Temple is supplied')
report['assets']['david-ark']['phase_groups'] = [g.name for g in david_ark_phases]
report['assets']['david-ark']['default_phase'] = 'david-ark-phase-cart'
report['assets']['david-ark']['phase_ids'] = ['cart', 'pause', 'carry', 'tent']
report['assets']['david-ark']['mutually_exclusive_phases'] = True
report['assets']['david-ark']['phase_switch_required_before_display'] = True
report['assets']['david-ark']['cross_references'] = ['2SA.6.CSBT', 'EXO.25.10-22.CSBT', '1CH.15.11-15.CSBT']

# glTF exports ALL phase geometry above. Blender's prepared preview then shows
# one moment only; the runtime must implement the same group-level switch.
for group in david_ark_phases:
    hidden = group.name != 'david-ark-phase-cart'
    for obj in [group]+list(group.children_recursive):
        obj.hide_render = hidden
        obj.hide_set(hidden)
