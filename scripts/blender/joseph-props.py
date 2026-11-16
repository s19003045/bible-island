"""Original Joseph teaching objects; no identified biblical finds or royal date.

Granary function comparisons: Met 20.3.11, Museo Egizio Suppl.8651, and the ARCE
funerary-model discussion recorded in docs/review/JOSEPH-RESEARCH-START.md.
Their storage, carrying, pouring and recording functions inform this independent
layout. A funerary model is not an engineering plan or evidence of Joseph's date.
All cargo forms, quantities, textiles and modern cutaways are teaching choices.
"""

joseph_fibre = material('joseph-undyed-woven-fibre', (.405, .340, .237), .99)
joseph_wrap_fibre = material('joseph-pale-wrapping-fibre', (.555, .475, .336), .99)
joseph_rope_mat = material('joseph-comparison-fibre-cord', (.245, .192, .110), 1)
joseph_wood = material('joseph-unspecified-timber', (.255, .157, .077), .96)
joseph_wood_dark = material('joseph-timber-grain', (.135, .081, .038), .99)
joseph_clay = material('joseph-comparison-earthenware', (.412, .265, .157), .98)
joseph_resin = material('joseph-unidentified-resin-comparison', (.246, .120, .045), .74)
joseph_mud = material('joseph-mud-masonry-comparison', (.408, .322, .226), 1)
joseph_plaster = material('joseph-earth-plaster-comparison', (.568, .483, .359), 1)
joseph_floor = material('joseph-courtyard-earth', (.325, .266, .188), 1)
joseph_grain = material('joseph-unspecified-grain', (.568, .405, .171), .97)
joseph_grain_light = material('joseph-pale-grain-kernels', (.668, .503, .248), .98)
joseph_red_cloth = material('joseph-selected-muted-cloth', (.354, .164, .117), .99)
joseph_plain_cloth = material('joseph-selected-plain-cloth', (.565, .515, .411), .99)
joseph_bread_mat = material('joseph-travel-bread', (.516, .322, .142), .97)
joseph_unwritten = material('joseph-uninscribed-recording-surface', (.563, .452, .289), 1)


def joseph_soft_sack(name, center, rx, rf, height, mat, open_top=True, seed=0, n=56):
    """A thick folded cloth container with an actual inner wall and inner floor."""
    outer = [(.002, .48), (.025, .78), (.10, .96), (.23, 1.0),
             (.39, .99), (.55, .94), (.69, .83), (.79, .62),
             (.88, .42), (.96, .34), (1.0, .35)]
    profile = [(h*height, r) for h, r in outer]
    if open_top:
        profile += [(height-.004, .31), (.94*height, .29), (.87*height, .36),
                    (.78*height, .55), (.67*height, .76), (.53*height, .87),
                    (.37*height, .91), (.18*height, .84), (.024, .50)]
    else:
        profile += [(height+.009, .20), (height+.012, .065)]
    vs = []; fs = []
    for row, (h, r) in enumerate(profile):
        for k in range(n):
            a = k*2*pi/n
            gathered = .004+.009*(h/height)**3
            fold = gathered*(.70*sin(11*a+seed)+.30*sin(19*a-h*21))
            cx = (1 if cos(a) >= 0 else -1)*abs(cos(a))**.76
            cf = (1 if sin(a) >= 0 else -1)*abs(sin(a))**.79
            x = center[0]+(rx*r+fold)*cx
            f = center[2]+(rf*r+fold*.75)*cf
            z = center[1]+h+.0015*sin(5*a+seed)*min(1, h/.025)
            vs.append(xyz(x, z, f))
            if row:
                fs.append(((row-1)*n+k, (row-1)*n+(k+1)%n,
                           row*n+(k+1)%n, row*n+k))
    fs.extend([tuple(reversed(range(n))), tuple((len(profile)-1)*n+k for k in range(n))])
    return mesh(name, vs, fs, mat, variation=.105)


def joseph_cord_ring(name, center, rx, rf, height, mat=joseph_rope_mat, turns=1):
    points = []
    for k in range(64*turns+1):
        a = 2*pi*k/64
        cx = (1 if cos(a) >= 0 else -1)*abs(cos(a))**.76
        cf = (1 if sin(a) >= 0 else -1)*abs(sin(a))**.79
        points.append((center[0]+rx*cx, center[1]+height+.0025*sin(2*a)
                       + (.005*k/64 if turns > 1 else 0), center[2]+rf*cf))
    return tube(name, points, [.0032]*len(points), mat, sides=7)


def joseph_grain_mound(name, center, rx, rf, height, seed=0, kernels=36):
    """Closed irregular mound, supplemented by individual inspectable kernels."""
    vs = [xyz(center[0], center[1]+height, center[2])]; fs = []
    seg = 40; rows = 9
    def surface(r, a):
        return center[1]+height*max(0, 1-r*r)**1.35+.0015*sin(a*11+seed)*r
    for j in range(1, rows+1):
        r = j/rows
        for k in range(seg):
            a = 2*pi*k/seg
            edge = 1+.025*sin(a*7+seed)+.014*sin(a*13-seed)
            vs.append(xyz(center[0]+rx*r*cos(a)*edge, surface(r, a),
                          center[2]+rf*r*sin(a)*edge))
            if j > 1:
                a0 = 1+(j-2)*seg+k; a1 = 1+(j-2)*seg+(k+1)%seg
                b0 = 1+(j-1)*seg+k; b1 = 1+(j-1)*seg+(k+1)%seg
                fs.append((a0, a1, b1, b0))
    bottom = len(vs); vs.append(xyz(center[0], center[1]-.003, center[2]))
    for k in range(seg):
        fs.append((0, 1+k, 1+(k+1)%seg))
        fs.append((bottom, 1+(rows-1)*seg+(k+1)%seg, 1+(rows-1)*seg+k))
    parts = [mesh(name+'-continuous-pile', vs, fs, joseph_grain, variation=.14)]
    for i in range(kernels):
        a = i*2.399963+seed; r = .92*math.sqrt((i+.5)/max(1, kernels))
        x = center[0]+rx*r*cos(a); f = center[2]+rf*r*sin(a)
        obj = ellipsoid(name+'-individual-kernel', (x, surface(r, a)+.0028, f),
                        (.0085, .0031, .0037),
                        joseph_grain_light if i%3 else joseph_grain, seg=8, rows=4)
        for v in obj.data.vertices:
            dx = v.co.x-x; dy = v.co.y+f
            v.co.x = x+dx*cos(a)-dy*sin(a)
            v.co.y = -f+dx*sin(a)+dy*cos(a)
        parts.append(obj)
    return parts


def joseph_lump(name, center, scale, seed):
    obj = ellipsoid(name, center, scale, joseph_resin, seg=14, rows=8)
    for v in obj.data.vertices:
        x, y, z = v.co
        factor = 1+.065*sin(x*141+y*167+z*113+seed)
        v.co.x = center[0]+(x-center[0])*factor
        v.co.y = -center[2]+(y+center[2])*factor
        v.co.z = center[1]+(z-center[1])*factor
    for face in obj.data.polygons:
        face.use_smooth = False
    return obj


def joseph_folded_cloth(name, center, width, depth, mat, seed=0):
    """One continuous folded sheet with curved return folds and real thickness."""
    vs = []; fs = []; n = 28
    path = []
    # Three runs, joined by semicircular folded ends, never stacked solid boxes.
    for layer in range(3):
        direction = 1 if layer%2 == 0 else -1
        for j in range(17):
            f = direction*(-depth/2+depth*j/16)
            path.append((f, .008+layer*.016))
        if layer < 2:
            edge = direction*depth/2
            for j in range(1, 9):
                a = pi*j/8
                path.append((edge+direction*.008*sin(a), .016+layer*.016-.008*cos(a)))
    for row, (f, h) in enumerate(path):
        for i in range(n+1):
            u = i/n; x = center[0]+(u-.5)*width
            crease = .0025*sin(u*12*pi+seed)*(.45+.55*sin(pi*u))
            vs.append(xyz(x, center[1]+h+crease, center[2]+f+.003*sin(u*8*pi+seed)))
            if row and i:
                q = row*(n+1)+i
                fs.append((q-n-2, q-n-1, q, q-1))
    obj = mesh(name, vs, fs, mat, variation=.065)
    solid = obj.modifiers.new('actual-folded-fabric-thickness', 'SOLIDIFY'); solid.thickness = .002
    bpy.context.view_layer.objects.active = obj; bpy.ops.object.modifier_apply(modifier=solid.name)
    return obj


# Genesis 37 cargo: wrapping, ties and small resin/spice-type containers. The
# model supplies no ancient label, ownership seal, commodity certainty or price.
joseph_cargo_scene = new_scene('Joseph — original caravan cargo comparison, Genesis 37')
core_parts = []
for i, x in enumerate([-.375, -.140]):
    pot = pottery_profile('cargo-inner-open-commodity-container',
        [(0, .016), (.070, .016), (.100, .041), (.108, .151),
         (.102, .242), (.094, .250), (.085, .245), (.084, .226),
         (.092, .145), (.083, .050), (.060, .031), (0, .031)],
        joseph_clay, n=48, tool=False)
    pot.location = xyz(x, 0, .025)
    core_parts.append(pot)
    for j in range(7):
        a = j*2.399; r = .059*math.sqrt(j/7)
        core_parts.append(joseph_lump('cargo-unidentified-resin-type-piece',
            (x+r*cos(a), .202+(j%3)*.013, .025+r*sin(a)),
            (.026, .022, .021), i*7+j))
parent_parts('joseph-cargo-interior-comparison-containers', core_parts)

wrap_parts = [joseph_soft_sack('cargo-folded-outer-wrapping', (-.255, 0, .025),
    .324, .267, .437, joseph_wrap_fibre, open_top=False, seed=1.7, n=64)]
wrap_parts.append(joseph_cord_ring('cargo-gathered-neck-binding', (-.255, 0, .025),
                                 .112, .100, .422, turns=2))
# Two true binding loops follow the cloth body's square-oval sections.
for h, rx, rf in [(.145, .328, .270), (.290, .282, .233)]:
    wrap_parts.append(joseph_cord_ring('cargo-bale-body-binding', (-.255, 0, .025), rx, rf, h))
wrap_parts.append(tube('cargo-loose-binding-tail', [(-.205, .434, .101),
    (-.168, .421, .157), (-.119, .365, .210), (-.091, .274, .236)],
    [.0032]*4, joseph_rope_mat, sides=7))
parent_parts('joseph-cargo-wrap', wrap_parts)

side_parts = [joseph_soft_sack('cargo-separate-bound-cloth-package', (.365, 0, -.205),
    .231, .192, .266, joseph_fibre, open_top=False, seed=3.1)]
side_parts.append(joseph_cord_ring('cargo-side-package-neck-cord', (.365, 0, -.205),
                                 .075, .064, .255))
parent_parts('joseph-cargo-separate-fibre-package', side_parts)
small_pot = pottery_profile('cargo-small-open-comparison-vessel',
    [(0, .004), (.067, .004), (.111, .055), (.117, .140),
     (.098, .201), (.081, .221), (.070, .223), (.068, .208),
     (.083, .189), (.101, .134), (.093, .060), (.057, .024), (0, .024)],
    joseph_clay, n=56, tool=False)
small_pot.location = xyz(.337, 0, .294)
small_parts = [small_pot]
for i in range(6):
    a = i*2.399; r = .049*math.sqrt(i/6)
    small_parts.append(joseph_lump('cargo-visible-comparison-commodity',
        (.337+r*cos(a), .163+(i%2)*.019, .294+r*sin(a)), (.023, .020, .022), i+30))
parent_parts('joseph-cargo-small-vessel', small_parts)
finish_static(joseph_cargo_scene, 'joseph-cargo', .451)
report['assets']['joseph-cargo']['interpretation'] = (
    'Genesis 37 original commodity-type cargo; resin/spice appearance, container '
    'forms and cloth arrangement are comparisons, not identified original goods')
report['assets']['joseph-cargo']['removable_group'] = 'joseph-cargo-wrap'


# Independent storage-and-workflow layout. The front of each bin is lowered as
# a modern cutaway; the full-height rear/side surfaces enclose real empty volume.
joseph_granary_scene = new_scene('Joseph — modern granary function section, Genesis 41')
base = box_surface('granary-solid-thin-ground-slab', (0, .015, 0),
                   (1.40, .030, 1.00), joseph_floor, .007)
parent_parts('joseph-granary-modern-display-base', [base])
wall_parts = []
# Shared rear wall, end walls and divider: two genuinely hollow storage cells.
wall_parts.append(box_surface('granary-rear-wall', (-.230, .286, -.420),
                              (.870, .512, .058), joseph_mud, .005))
for x in [-.652, -.230, .192]:
    wall_parts.append(box_surface('granary-storage-side-or-divider', (x, .286, -.161),
                                  (.048, .512, .512), joseph_mud, .005))
for x in [-.441, -.019]:
    wall_parts.append(box_surface('granary-modern-lowered-front-wall', (x, .105, .096),
                                  (.374, .150, .052), joseph_mud, .005))
    wall_parts.append(box_surface('granary-real-storage-floor', (x, .046, -.160),
                                  (.374, .032, .456), joseph_plaster, .003))
parent_parts('joseph-granary-hollow-storage-cells', wall_parts)

for index, (x, heap_h) in enumerate([(-.441, .213), (-.019, .140)]):
    parent_parts('joseph-granary-stored-grain-'+str(index+1), joseph_grain_mound(
        'granary-bin-'+str(index+1), (x, .064, -.160), .170, .201, heap_h,
        seed=index+2, kernels=42))

roof_parts = []
# Roof/upper carrying floor is built around two true openings, not dark patches.
for x in [-.441, -.019]:
    for f in [-.349, .031]:
        roof_parts.append(box_surface('granary-upper-floor-opening-end', (x, .556, f),
                                      (.408, .030, .148), joseph_plaster, .003))
    for px in [x-.148, x+.148]:
        roof_parts.append(box_surface('granary-upper-floor-opening-side', (px, .556, -.159),
                                      (.112, .030, .232), joseph_plaster, .003))
for x in [-.625, -.257, -.203, .165]:
    roof_parts.append(tube('granary-comparison-support-timber', [(x, .527, -.423), (x, .527, .107)],
                           [.012, .012], joseph_wood, sides=10))
parent_parts('joseph-granary-roof', roof_parts)

# Steps and a partly filled carrier belong to a separate upper-work function.
stair_parts = []
for i in range(7):
    h = .070*(i+1)
    stair_parts.append(box_surface('granary-stair-tread', (-.493, .030+h/2, .450-i*.049),
                                   (.252, h, .056), joseph_mud, .004))
parent_parts('joseph-granary-carrying-stair', stair_parts)
upper_parts = [joseph_soft_sack('granary-upper-carrier-sack', (.102, .573, -.317),
    .058, .065, .076, joseph_fibre, open_top=True, seed=4.3, n=40)]
upper_group = parent_parts('joseph-granary-upper-carrying-area', upper_parts)
upper_group.parent = bpy.data.objects.get('joseph-granary-roof')

# Side courtyard provides a distinct measuring/recording area, without invented
# writing, seal marks, worker uniforms, a pharaoh or a date assignment.
court_parts = [box_surface('granary-recording-courtyard-surface', (.454, .039, -.014),
    (.424, .018, .842), joseph_plaster, .004)]
for f in [-.438, .423]:
    court_parts.append(box_surface('granary-low-courtyard-edge', (.454, .070, f),
                                   (.424, .080, .030), joseph_mud, .004))
parent_parts('joseph-granary-recording-courtyard', court_parts)
record_parts = [box_surface('granary-low-recording-board-support', (.477, .092, .266),
    (.235, .093, .164), joseph_wood, .004)]
board = box_surface('granary-uninscribed-recording-board', (.477, .148, .266),
                    (.255, .014, .185), joseph_unwritten, .002)
board.rotation_euler.x = -.12
record_parts.append(board)
for i in range(2):
    record_parts.append(tube('granary-selected-recording-reed',
        [(.430+i*.023, .166, .195), (.440+i*.023, .166, .318)],
        [.0018, .0012], joseph_wood_dark, sides=6))
parent_parts('joseph-granary-uninscribed-recording-comparison', record_parts)
measure = pottery_profile('granary-open-measuring-container-comparison',
    [(0, .049), (.051, .049), (.072, .075), (.080, .148),
     (.078, .158), (.069, .159), (.066, .148), (.058, .081), (.043, .065), (0, .065)],
    joseph_clay, n=48, tool=False)
measure.location = xyz(.479, 0, -.214)
yard_parts = [measure, joseph_soft_sack('granary-courtyard-filled-carrier', (.329, .048, -.027),
    .073, .071, .151, joseph_fibre, open_top=True, seed=2.1, n=40)]
yard_parts += joseph_grain_mound('granary-courtyard-measure-grain', (.479, .067, -.214),
                                 .052, .052, .034, seed=7, kernels=12)
parent_parts('joseph-granary-measuring-and-carrier-area', yard_parts)
finish_static(joseph_granary_scene, 'joseph-granary', .651)
report['assets']['joseph-granary']['interpretation'] = (
    'Original modern function section informed by Met 20.3.11, Museo Egizio '
    'Suppl.8651 and ARCE funerary-model discussion; no copied ensemble layout, '
    'identified Joseph granary, dynasty, pharaoh, or engineering-plan claim')
report['assets']['joseph-granary']['removable_group'] = 'joseph-granary-roof'
report['assets']['joseph-granary']['modern_cutaway'] = True


# Genesis 45:21–23: grain, folded clothing and travel-food vessels. Their number,
# form and selected cloth colours are not an accounting of the passage's gifts.
joseph_provisions_scene = new_scene('Joseph — return-journey provisions comparison, Genesis 45:21–23')
sack_parts = []
for i, (x, f, rx, rf, h) in enumerate([(-.309, .066, .173, .157, .323),
                                      (-.100, -.205, .127, .121, .230)]):
    sack_parts.append(joseph_soft_sack('provisions-real-hollow-grain-sack', (x, 0, f),
        rx, rf, h, joseph_fibre if i == 0 else joseph_wrap_fibre,
        open_top=True, seed=5+i, n=56))
    sack_parts += joseph_grain_mound('provisions-visible-sack-grain',
        (x, h*.88, f), rx*.31, rf*.31, h*.036, seed=4+i, kernels=16)
    sack_parts.append(joseph_cord_ring('provisions-loose-sack-neck-cord', (x, 0, f),
                                     rx*.36, rf*.36, h*.96))
parent_parts('joseph-provisions-open-grain-sacks', sack_parts)

cloth_parts = []
for layer, mat in enumerate([joseph_plain_cloth, joseph_red_cloth]):
    cloth_parts.append(joseph_folded_cloth('provisions-continuous-folded-cloth',
        (.248, .004+layer*.054, -.213), .451, .285, mat, seed=layer+1))
parent_parts('joseph-provisions-folded-garments-comparison', cloth_parts)

food_bowl = pottery_profile('provisions-travel-food-bowl-real-interior',
    [(0, .008), (.085, .008), (.126, .026), (.156, .073),
     (.166, .111), (.164, .123), (.154, .126), (.148, .115),
     (.140, .079), (.114, .042), (.077, .027), (0, .027)],
    joseph_clay, n=64, tool=False)
food_bowl.location = xyz(.247, 0, .183)
food_parts = [food_bowl]
for i in range(2):
    bread = ellipsoid('provisions-thick-travel-flatbread',
        (.225+i*.032, .066+i*.029, .183-i*.016), (.108, .015, .090),
        joseph_bread_mat, seg=40, rows=12)
    for v in bread.data.vertices:
        x, y, z = v.co
        v.co.z += .002*sin(x*97+y*73)*max(0, (z-.045)/.060)
    colors = bread.data.color_attributes['surface']
    for j, v in enumerate(bread.data.vertices):
        patch = max(0, sin(v.co.x*91+i)*sin(v.co.y*107-i))**5
        colors.data[j].color = (.516*(1-.40*patch), .322*(1-.48*patch), .142*(1-.52*patch), 1)
    food_parts.append(bread)
parent_parts('joseph-provisions-travel-food-vessel', food_parts)
finish_static(joseph_provisions_scene, 'joseph-provisions', .325)
report['assets']['joseph-provisions']['interpretation'] = (
    'Genesis 45:21–23 travel-provision comparison; sack and vessel forms, selected '
    'cloth colours, and display quantities are teaching choices, not royal originals')
