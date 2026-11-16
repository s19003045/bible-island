"""Original Exile teaching objects, built with the shared Blender helpers.

Read docs/review/EXILE-RESEARCH-START.md in full, including the root agent's
direct CSBT 2 Kings 24 follow-up. Four selected reading moments are not four
equal populations, a measured route, or a continuous family itinerary.
The generic water section does not identify Chebar with Psalm 137's setting.
The house/orchard is neither an excavated house nor proof of equal property,
immediate stability, voluntary migration, or universal prosperity. The blank
folding panels are contemporary reading equipment, not Jeremiah's substrate.
No ancient writing, captive tokens, seals, hydraulic mechanism, identified
river, exact house, forced music, marriage/fertility scoring, or divine image.

Uses shared original mesh/material/tube/ellipsoid/pottery/box/parent/finish
helpers and sinai_closed_grid. All dimensions are modern teaching choices.
"""

exile_wood = material('exile-modern-oiled-reading-wood', (.275, .181, .095), .95)
exile_wood_edge = material('exile-reading-wood-fine-grain', (.147, .089, .039), .99)
exile_fixture = material('exile-modern-slate-fixture', (.185, .255, .263), .89)
exile_pale = material('exile-modern-warm-pale-fixture', (.579, .551, .478), .96)
exile_blue = material('exile-modern-blue-reading-marker', (.123, .331, .363), .87)
exile_sand = material('exile-modern-ochre-reading-marker', (.502, .352, .174), .95)
exile_muted = material('exile-modern-grey-reading-marker', (.364, .384, .359), .95)
exile_earth_low = material('exile-original-lower-soil-section', (.325, .237, .161), 1)
exile_earth_mid = material('exile-original-middle-soil-section', (.458, .350, .227), 1)
exile_earth_top = material('exile-original-topsoil-section', (.252, .207, .133), 1)
exile_water = material('exile-generic-contained-water-volume', (.077, .246, .281), .19)
exile_bs = exile_water.node_tree.nodes.get('Principled BSDF')
exile_bs.inputs['Transmission Weight'].default_value = .24
exile_bs.inputs['IOR'].default_value = 1.333
exile_wall_mat = material('exile-original-ordinary-house-wall', (.522, .411, .286), .99)
exile_wall_inner = material('exile-original-house-interior-tone', (.587, .480, .346), .99)
exile_floor_mat = material('exile-original-ordinary-house-floor', (.389, .302, .203), .99)
exile_bark = material('exile-original-unidentified-plant-wood', (.242, .170, .085), 1)
exile_leaf = material('exile-original-unidentified-plant-leaf', (.215, .293, .139), 1)
exile_leaf_lit = material('exile-original-plant-leaf-variation', (.323, .365, .167), 1)
exile_fruit = material('exile-original-unidentified-fruit-cue', (.457, .258, .111), .97)
exile_reed = material('exile-original-bank-plant', (.366, .365, .173), 1)


def exile_flat(obj):
    for p in obj.data.polygons:
        p.use_smooth = False
    return obj


def exile_slab(name, bounds, lower, upper, mat, nx=14, nf=10):
    return exile_flat(sinai_closed_grid(name, bounds, nx, nf,
        (upper if callable(upper) else lambda x, f: upper), lower, mat, .055))


def exile_recess(name, center, width, depth, height, floor, wall, mat):
    """One manifold rectangular shell, with distinct outer and inner bottoms.

    center is (x, lower height, front); floor and height are measured upward
    from the lower height. The cavity's exact straight walls ease clearance QA.
    """
    cx, h0, cf = center
    ringspec = [(width, depth, 0), (width, depth, height),
                (width-2*wall, depth-2*wall, height),
                (width-2*wall, depth-2*wall, floor)]
    vs = []; fs = []
    for w, d, h in ringspec:
        vs.extend([xyz(cx-w/2, h0+h, cf-d/2),
                   xyz(cx+w/2, h0+h, cf-d/2),
                   xyz(cx+w/2, h0+h, cf+d/2),
                   xyz(cx-w/2, h0+h, cf+d/2)])
    fs.append((3, 2, 1, 0))
    for j in range(3):
        for k in range(4):
            fs.append((j*4+k, j*4+(k+1)%4, (j+1)*4+(k+1)%4, (j+1)*4+k))
    fs.append((12, 13, 14, 15))
    obj = exile_flat(mesh(name, vs, fs, mat, variation=.055))
    obj['inner_floor_height_m'] = h0+floor
    obj['outer_bottom_height_m'] = h0
    obj['wall_thickness_m'] = wall
    return obj


def exile_marker(name, x, h, f, rx, rf, thickness, mat, skew=0):
    """A low, solid, deliberately non-human modern event marker."""
    vs = []; fs = []; n = 40
    for lower in [True, False]:
        for k in range(n):
            a = 2*pi*k/n
            shape = 1+.045*sin(3*a+skew)
            vs.append(xyz(x+rx*cos(a)*shape, h+(0 if lower else thickness),
                          f+rf*sin(a)*shape))
    for k in range(n):
        fs.append((k, (k+1)%n, n+(k+1)%n, n+k))
    fs.extend([tuple(reversed(range(n))), tuple(range(n, 2*n))])
    return exile_flat(mesh(name, vs, fs, mat, variation=.045))


def exile_finish(scene, aid, interpretation, layer, motion):
    bpy.context.window.scene = scene
    bpy.context.view_layer.update()
    deps = bpy.context.evaluated_depsgraph_get(); deps.update()
    points = [o.evaluated_get(deps).matrix_world@v.co
              for o in scene.objects if o.type == 'MESH'
              for v in o.evaluated_get(deps).data.vertices]
    low = [min(p[i] for p in points) for i in range(3)]
    high = [max(p[i] for p in points) for i in range(3)]
    finish_static(scene, aid, round(high[2], 6))
    report['assets'][aid].update({
        'prototype_only': False, 'interpretation': interpretation,
        'source_scene': scene.name, 'bottom_m': low[2], 'top_m': high[2],
        'dimensions_blender_xyz_m': [high[i]-low[i] for i in range(3)],
        'semantic_groups': [o.name for o in scene.objects if o.type == 'EMPTY'],
        'modern_removable_layer': layer,
        'modern_layer_translation_gltf_xyz_m': motion,
        'units': 'metres; Blender Z / glTF Y is height'})
    assert abs(low[2]) < 1e-6 and high[2] <= .8
    assert report['assets'][aid]['triangles'] <= 30000
    assert report['assets'][aid]['bytes'] <= 1600000


# 2 Kings 24–25: four selected reading moments, not population counters or a map.
exile_sequence_scene = new_scene('Exile — original modern event tray, 2 Kings 24–25')
parent_parts('exile-sequence-modern-support', [box_surface(
    'sequence-modern-support-slab', (0, .009, 0), (1.20, .018, .90), exile_wood, .006)])
sequence_floor = .034
sequence_insert_top = .048
sequence_specs = [
    ('jehoiachin-deportation', -.327, .205, .430, .310, exile_blue),
    ('later-siege-destruction', .251, .170, .470, .370, exile_sand),
    ('left-land-and-later-egypt', -.303, -.225, .480, .300, exile_muted),
    ('jehoiachin-late-release', .287, -.250, .390, .250, exile_pale)]
sequence_shells = []
sequence_insert_groups = []
for label, x, f, w, d, mat in sequence_specs:
    shell = exile_recess('sequence-actual-recess-'+label, (x, .018, f),
                         w, d, .060, .016, .018, exile_fixture)
    shell['modern_reading_moment'] = label
    parent_parts('exile-sequence-recess-'+label, [shell])
    insert = box_surface('sequence-solid-lifting-insert-'+label,
        (x, .041, f), (w-.046, .014, d-.046), mat, .0015)
    insert['side_clearance_m'] = .005
    parts = [insert]
    if label == 'jehoiachin-deportation':
        parts.append(exile_marker('sequence-first-plain-oval', x-.018,
            sequence_insert_top, f+.005, .109, .065, .025, exile_pale, 1))
        parts.append(box_surface('sequence-first-modern-inset-bar',
            (x+.028, .081, f+.005), (.119, .016, .018), exile_blue, .003))
    elif label == 'later-siege-destruction':
        for dx, df, length in [(-.072, .030, .156), (.060, -.037, .121)]:
            parts.append(box_surface('sequence-later-distinct-low-band',
                (x+dx, .063, f+df), (length, .030, .052), exile_pale, .004))
    elif label == 'left-land-and-later-egypt':
        # Two disjoint topic panels: no arrows, journey line or measured places.
        parts.append(exile_marker('sequence-left-land-topic-panel', x-.110,
            sequence_insert_top, f+.012, .069, .074, .020, exile_pale, 3))
        parts.append(box_surface('sequence-later-egypt-topic-panel',
            (x+.080, .060, f-.013), (.123, .024, .122), exile_sand, .007))
    else:
        ring = pottery_profile('sequence-late-release-modern-open-ring',
            [(.047, 0), (.063, 0), (.068, .008), (.066, .022),
             (.051, .022), (.047, .016), (.047, 0)], exile_blue, n=48, tool=False)
        ring.location = xyz(x-.047, sequence_insert_top, f); parts.append(ring)
        parts.append(box_surface('sequence-late-release-low-comparison-tab',
            (x+.080, .058, f-.010), (.063, .020, .075), exile_muted, .004))
    g = parent_parts('exile-sequence-event-'+label, parts)
    g['interpretation'] = 'Selected modern reading moment; form/count is not population, distance, or archaeological evidence'
    sequence_insert_groups.append(g)
sequence_layer = parent_parts('exile-sequence-modern-event-layer', sequence_insert_groups)
sequence_layer['teaching_lift_m'] = .14
sequence_layer['motion_gltf_xyz_m'] = [0, .14, 0]
sequence_layer['motion_only'] = 'Lift vertically; no sliding through slot walls'
# Fine authored wood lines around the exposed support border are real geometry.
grain = []
for f in [-.424, .424]:
    for k in range(3):
        pts = [(-.563+i*.0225, .0184, f+k*.003+.0007*sin(i*.63+k)) for i in range(51)]
        grain.append(tube('sequence-modern-support-wood-grain', pts, [.00045]*51,
                          exile_wood_edge, sides=4))
parent_parts('exile-sequence-support-surface-detail', grain)
exile_finish(exile_sequence_scene, 'exile-sequence',
    'Four different modern recess/insert positions: Jehoiachin deportation; later siege/destruction; those left and later Egypt; Jehoiachin late release. Not a map, equal human groups, one day, full population, or universal return.',
    sequence_layer.name, [0, .14, 0])


# Ezekiel 1 and Psalm 137 are separate readings using one generic spatial model.
exile_waterbank_scene = new_scene('Exile — generic waterbank section, separate Ezekiel 1 / Psalm 137')
parent_parts('exile-waterbank-modern-support', [box_surface(
    'waterbank-modern-base', (0, .009, 0), (1.20, .018, .90), exile_pale, .005)])
floor = exile_slab('waterbank-actual-channel-floor', (-.60, .60, -.43, .43),
                  .018, .080, exile_earth_low, 30, 18)
parent_parts('exile-waterbank-channel-floor', [floor])


def exile_bank_top(x, f, side):
    return .292+.020*sin(x*5.1+.4*side)+.011*cos(x*12-f*6)+.010*(abs(f)-.125)/.305


def exile_bank_plants(side):
    parts = []
    for cluster, (x0, f0) in enumerate([(-.40, side*.337), (.055, side*.375), (.385, side*.300)]):
        h0 = exile_bank_top(x0, f0, side)
        for j in range(5):
            dx = .010*cos(j*2.399); df = .010*sin(j*2.399)
            top = h0+.120+.027*sin(j*2+cluster)
            pts = [(x0+dx, exile_bank_top(x0+dx, f0+df, side), f0+df),
                   (x0+dx+.011*sin(j), (h0+top)*.5, f0+df+.010*cos(j)),
                   (x0+dx+.025*sin(j), top, f0+df+.019*cos(j))]
            parts.append(tube('waterbank-original-unidentified-stem', pts,
                              [.0018, .00125, .0003], exile_reed, sides=6))
            # Closed tapered leaves grow from stems; no identified Psalm tree.
            for q in [-1, 1]:
                parts.append(tube('waterbank-original-narrow-leaf',
                    [pts[1], (pts[1][0]+q*.020, pts[1][1]+.023, pts[1][2]+.014),
                     (pts[1][0]+q*.045, pts[1][1]+.034, pts[1][2]+.020)],
                    [.0007, .0024, .0002], exile_reed, sides=5))
    return parts


for side, name in [(-1, 'fixed-bank'), (1, 'cutaway-bank')]:
    f0, f1 = ((-.43, -.125) if side < 0 else (.125, .43))
    parts = [exile_slab('waterbank-'+name+'-lower-soil', (-.60, .60, f0, f1),
                       .080, .155, exile_earth_low, 30, 8),
             exile_slab('waterbank-'+name+'-middle-soil', (-.60, .60, f0, f1),
                       .155, .236, exile_earth_mid, 30, 8),
             exile_slab('waterbank-'+name+'-closed-topsoil', (-.60, .60, f0, f1),
                       .236, lambda x, f: exile_bank_top(x, f, side), exile_earth_top, 30, 8)]
    parts.extend(exile_bank_plants(side))
    g = parent_parts(('exile-waterbank-fixed-bank' if side < 0
                      else 'exile-waterbank-modern-cutaway-layer'), parts)
    if side > 0:
        g['motion_gltf_xyz_m'] = [0, .12, .25]
        g['teaching_lift_m'] = .12
        g['teaching_lateral_m'] = .25
        g['interpretation'] = 'Modern closed bank section; lateral +front and upward removal, not an ancient movable bank'
for side in [-1, 1]:
    end = box_surface('waterbank-modern-closed-end-section',
        (side*.589, .151, 0), (.022, .142, .250), exile_fixture, .001)
    parent_parts('exile-waterbank-modern-end-'+('left' if side < 0 else 'right'), [end])
water = exile_slab('waterbank-closed-water-volume', (-.575, .575, -.119, .119),
    .080, lambda x, f: .174+.00065*sin(x*37)*cos(f*40), exile_water, 48, 12)
water['interpretation'] = 'Closed generic water volume; neither measured ancient width nor an identified river'
parent_parts('exile-waterbank-contained-water', [water])
exile_finish(exile_waterbank_scene, 'exile-waterbank',
    'Original generic channel/banks/soil section for separate readings of Ezekiel 1 and Psalm 137. Does not identify their settings, an ancient surveyed river, gate, wheel, palace, mechanism or flow rate.',
    'exile-waterbank-modern-cutaway-layer', [0, .12, .25])


# Jeremiah 29: ordinary house and orchard comparison, not an excavated plan.
exile_dwelling_scene = new_scene('Exile — original house and orchard reading section, Jeremiah 29')
parent_parts('exile-dwelling-modern-support', [box_surface(
    'dwelling-modern-support', (0, .009, 0), (1.25, .018, .90), exile_pale, .005)])
house_floor = exile_slab('dwelling-actual-interior-floor', (-.57, .13, -.29, .36),
    .018, .052, exile_floor_mat, 24, 20)
parent_parts('exile-dwelling-interior-floor', [house_floor])


def exile_house_wall(name, bounds, bottom, top, mat):
    """Closed structural wall prism; original surface relief is separate below."""
    return exile_slab(name, bounds, bottom, top, mat, 20, 6)


# Explicit front jambs + lintel leave an actual through opening x[-.345,-.155]
# and height [.052,.302], not a dark texture in an otherwise solid wall.
walls = []
for name, bounds, bottom, top in [
    ('back', (-.57, .13, -.29, -.25), .052, .405),
    ('left', (-.57, -.53, -.25, .32), .052, .405),
    ('right', (.09, .13, -.25, .32), .052, .405),
    ('front-left-jamb', (-.57, -.345, .32, .36), .052, .405),
    ('front-right-jamb', (-.155, .13, .32, .36), .052, .405),
    ('door-lintel', (-.345, -.155, .32, .36), .302, .405)]:
    wall = exile_house_wall('dwelling-actual-wall-'+name, bounds,
                           bottom, top, exile_wall_mat)
    # Each contacting wall remains its own closed solid. Keeping six child
    # groups avoids treating touching end faces as one welded, nonmanifold shell.
    walls.append(parent_parts('exile-dwelling-wall-'+name, [wall]))
parent_parts('exile-dwelling-thick-walls-and-through-door', walls)
# Discrete shallow masonry/plaster relief is authored, not an archaeological
# bond pattern. It stays on exposed surfaces; no fake inscription is included.
relief = []
for x0, x1 in [(-.556, -.359), (-.141, .116)]:
    for row in range(5):
        h = .089+row*.062
        pts = [(x0+(x1-x0)*j/18, h+.001*sin(j*.91+row), .3605) for j in range(19)]
        relief.append(tube('dwelling-original-front-plaster-relief', pts,
                           [.00075]*19, exile_wall_inner, sides=5))
for row in range(5):
    h = .090+row*.063
    pts = [(.1305, h+.001*sin(j*.8+row), -.235+j*.031) for j in range(18)]
    relief.append(tube('dwelling-original-side-plaster-relief', pts,
                       [.00075]*18, exile_wall_inner, sides=5))
parent_parts('exile-dwelling-original-wall-surface-detail', relief)

roof_parts = []
for j in range(10):
    x = -.5575+j*.075
    roof_parts.append(box_surface('dwelling-solid-roof-plank',
        (x, .418, .035), (.074, .026, .700), exile_wood, .0015))
    for k in [-1, 1]:
        pts = [(x+k*.017+.0009*sin(q*.83+j), .4314,
                -.297+q*.025) for q in range(27)]
        roof_parts.append(tube('dwelling-original-roof-wood-grain', pts,
                               [.00045]*27, exile_wood_edge, sides=4))
for f in [-.185, .255]:
    roof_parts.append(box_surface('dwelling-modern-roof-cross-member',
        (-.220, .442, f), (.738, .022, .027), exile_wood_edge, .001))
roof_layer = parent_parts('exile-dwelling-roof-layer', roof_parts)
roof_layer['teaching_lift_m'] = .20
roof_layer['motion_gltf_xyz_m'] = [0, .20, 0]
roof_layer['interpretation'] = 'Removable original teaching roof; not a documented roof system or original house'

bed = exile_recess('dwelling-orchard-actual-recessed-bed', (.385, .018, .020),
    .390, .640, .077, .018, .025, exile_earth_mid)
parent_parts('exile-dwelling-orchard-bed-shell', [bed])


def exile_orchard_soil(x, f):
    return .067+.0015*sin(x*69)*cos(f*53)


soil = exile_slab('dwelling-orchard-contained-soil', (.218, .552, -.272, .312),
    .036, exile_orchard_soil, exile_earth_top, 20, 30)
parent_parts('exile-dwelling-orchard-soil', [soil])
for index, (cx, cf) in enumerate([(.304, -.162), (.467, .176)]):
    h0 = exile_orchard_soil(cx, cf)
    trunk_top = h0+.171+index*.017
    parts = [tube('dwelling-original-orchard-trunk',
        [(cx, h0, cf), (cx-.009, h0+.090, cf+.004),
         (cx+.006, trunk_top, cf-.006)], [.0085, .0065, .003], exile_bark, sides=9)]
    for j in range(5):
        a = j*2.399+index*.4
        leaf_x = cx+.052*cos(a); leaf_f = cf+.055*sin(a)
        leaf_h = trunk_top-.014+.031*sin(j*1.7)
        parts.append(tube('dwelling-original-orchard-branch',
            [(cx-.004, h0+.110, cf+.002),
             ((cx+leaf_x)/2, (h0+.110+leaf_h)/2, (cf+leaf_f)/2),
             (leaf_x, leaf_h, leaf_f)], [.003, .0023, .0008], exile_bark, sides=7))
        parts.append(ellipsoid('dwelling-original-unidentified-foliage',
            (leaf_x, leaf_h+.013, leaf_f), (.034, .024, .033),
            exile_leaf if j%2 else exile_leaf_lit, seg=14, rows=8))
        if j in [1, 3]:
            parts.append(ellipsoid('dwelling-unidentified-fruit-teaching-cue',
                (leaf_x+.007, leaf_h-.008, leaf_f+.010), (.008, .010, .008),
                exile_fruit, seg=12, rows=7))
    plant = parent_parts('exile-dwelling-grounded-orchard-plant-'+str(index+1), parts)
    plant['root_contact_height_m'] = h0
    plant['interpretation'] = 'Original unidentified orchard plant; not an excavated species or a completed equal household plot'


def exile_reading_panel(name, start, end, bottom, top, thickness, mat):
    """True vertical panel thickness perpendicular to its chosen folded face."""
    dx, df = end[0]-start[0], end[1]-start[1]
    length = math.hypot(dx, df); nx, nf = -df/length, dx/length
    vs = []
    for side in [-1, 1]:
        for h, point in [(bottom, start), (bottom, end), (top, end), (top, start)]:
            vs.append(xyz(point[0]+side*nx*thickness/2, h,
                          point[1]+side*nf*thickness/2))
    return exile_flat(mesh(name, vs,
        [(3, 2, 1, 0), (4, 5, 6, 7), (0, 1, 5, 4),
         (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)], mat, variation=.025))


panels = [box_surface('dwelling-modern-reading-panel-foot',
    (.375, .031, -.393), (.420, .026, .076), exile_fixture, .003)]
panels.append(exile_reading_panel('dwelling-modern-reading-panel-sender',
    (.184, -.393), (.355, -.393), .044, .190, .009, exile_blue))
panels.append(exile_reading_panel('dwelling-modern-reading-panel-recipients',
    (.369, -.393), (.536, -.352), .044, .190, .009, exile_pale))
panels.append(tube('dwelling-modern-reading-panel-visible-hinge',
    [(.362, .044, -.393), (.362, .190, -.393)], [.0075, .0075], exile_fixture, sides=12))
panel_group = parent_parts('exile-dwelling-modern-folding-reading-panels', panels)
panel_group['interpretation'] = 'Blank thick contemporary hinged reading panels; app supplies labels, not an original letter substrate, ancient text, or seal'
exile_finish(exile_dwelling_scene, 'exile-dwelling',
    'Original house, through doorway, interior floor, removable roof, recessed orchard bed, grounded unidentified plants and modern folding reading panels. Jeremiah 29 life/planting/long-term communal hope comparison, not excavated plan, original letter, equal property, immediate prosperity or a marriage/fertility game.',
    roof_layer.name, [0, .20, 0])
