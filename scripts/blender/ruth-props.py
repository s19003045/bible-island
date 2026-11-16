"""Original modern teaching objects for Ruth 2–4, prepared for later integration.

Read docs/review/RUTH-RESEARCH-START.md in full before authoring. Met 1977.234.23
is a harvesting-tool comparison; Tel Dan illustrates public gathering near an
entrance; LOC/IAA exhibits 88–89 illustrate sole/fastening construction in much
later footwear. None supplies Ruth's grain morphology, field, gate, shoe, exact
date or this layout. These assets copy none of those ensembles or lacing plans.
No gleaner uses a sickle, no night-bed action appears, no six-ephah conversion is
made, and no document, stamp, ancient writing or woman removing a shoe appears.
All dimensions, crop details, quantities, shoe fastenings and removable layers
are original teaching choices, not archaeological identifications.
Requires the shared build helpers plus sinai_closed_grid / sinai_thick_sheet.
"""

ruth_straw = material('ruth-selected-mature-cereal-straw', (.469, .355, .164), .99)
ruth_ear_mat = material('ruth-selected-cereal-ear', (.490, .340, .126), .98)
ruth_grain_mat = material('ruth-unspecified-cereal-kernels', (.624, .451, .205), .98)
ruth_chaff_mat = material('ruth-selected-thin-chaff', (.590, .487, .297), 1)
ruth_rope_mat = material('ruth-undated-fibre-tie', (.260, .204, .116), 1)
ruth_reed_mat = material('ruth-selected-collection-fibre', (.419, .338, .200), 1)
ruth_soil_mat = material('ruth-modern-field-display-ground', (.333, .283, .193), 1)
ruth_tray_mat = material('ruth-modern-removable-display-trays', (.163, .235, .247), .83)
ruth_cloth_mat = material('ruth-ordinary-shawl-teaching-choice', (.471, .425, .336), .99)
ruth_wood_mat = material('ruth-unspecified-harvest-handle', (.235, .140, .066), .96)
ruth_iron_mat = material('ruth-harvest-blade-comparison', (.141, .134, .112), .77, .35)
ruth_stone_mat = material('ruth-original-gate-space-stone', (.370, .344, .291), .99)
ruth_map_mat = material('ruth-modern-gathering-map-ground', (.447, .391, .295), 1)
ruth_marker_mat = material('ruth-modern-position-markers', (.045, .284, .309), .83)
ruth_discussion_mat = material('ruth-modern-discussion-markers', (.402, .218, .121), .86)
ruth_leather_mat = material('ruth-ordinary-shoe-sole-comparison', (.201, .112, .056), .93)
ruth_insole_mat = material('ruth-ordinary-shoe-inner-layer', (.299, .185, .099), .97)
ruth_strap_mat = material('ruth-original-shoe-fastening-straps', (.255, .138, .067), .91)


def ruth_p(v):
    return (v.x, v.z, -v.y)


def ruth_kernel(name, center, axis=(0, 1, 0), length=.012, width=.003, mat=None, n=6):
    """Closed pointed kernel with a real longitudinal body, not a painted dot."""
    c = Vector(xyz(*center)); tangent = Vector(xyz(*axis)).normalized()
    ref = Vector((1, 0, 0)) if abs(tangent.x) < .85 else Vector((0, 1, 0))
    u = (ref-tangent*ref.dot(tangent)).normalized(); v = tangent.cross(u).normalized()
    vs = []; fs = []; profile = [(-.35, .65), (-.10, 1), (.18, .92), (.38, .55)]
    for row, (t, r) in enumerate(profile):
        for k in range(n):
            a = 2*pi*k/n
            vs.append(tuple(c+tangent*(t*length)+u*(width*r*cos(a))+v*(width*r*.75*sin(a))))
            if row:
                fs.append(((row-1)*n+k, (row-1)*n+(k+1)%n, row*n+(k+1)%n, row*n+k))
    bottom = len(vs); vs.append(tuple(c-tangent*length*.5))
    top = len(vs); vs.append(tuple(c+tangent*length*.5))
    for k in range(n):
        fs.extend([(bottom, (k+1)%n, k), (top, 3*n+k, 3*n+(k+1)%n)])
    return mesh(name, vs, fs, mat or ruth_grain_mat, variation=.085)


def ruth_cereal(name, base, direction, stalk_length, seed=0):
    """Original long-awned cereal diagram; no precise cultivar or find claim."""
    origin = Vector(xyz(*base)); axis = Vector(xyz(*direction)).normalized()
    ref = Vector((1, 0, 0)) if abs(axis.x) < .85 else Vector((0, 1, 0))
    u = (ref-axis*ref.dot(axis)).normalized(); v = axis.cross(u).normalized()
    head = origin+axis*stalk_length
    parts = [tube(name+'-cut-stalk', [ruth_p(origin), ruth_p(origin+axis*stalk_length*.50+u*.0015), ruth_p(head)],
                  [.0014, .0012, .0010], ruth_straw, sides=5)]
    parts.append(tube(name+'-head-axis', [ruth_p(head), ruth_p(head+axis*.061)],
                      [.0010, .0004], ruth_straw, sides=5))
    for j in range(5):
        for side in [-1, 1]:
            a = seed*.23+j*.10
            radial = u*(side*cos(a))+v*(side*.32*sin(a))
            grain_axis = (axis*.78+radial*.62).normalized()
            c = head+axis*(.007+j*.010)+radial*.0038
            parts.append(ruth_kernel(name+'-selected-spikelet', ruth_p(c), ruth_p(grain_axis),
                         .0125, .0028, ruth_ear_mat, n=5))
            start = c+grain_axis*.0057
            end = start+axis*(.028+.004*sin(seed+j))+radial*.009
            parts.append(tube(name+'-selected-awn', [ruth_p(start), ruth_p(end)],
                              [.00024, .000035], ruth_straw, sides=3))
    return parts


def ruth_tied_sheaf(name, x, f, seed):
    parts = []
    for i in range(10):
        a = i*2.399963+seed
        r = .010+.004*(i%3)
        parts += ruth_cereal(name+'-ear', (x+r*cos(a), .015, f+r*sin(a)),
            (.08*cos(a), 1, .06*sin(a)), .294+.025*sin(i*1.7+seed), i+seed)
    # Interior cut straw gives the bundle real bulk where the cord gathers it.
    for i in range(14):
        a = i*2.399963+seed
        pts = [(x+r*cos(a), h, f+r*.86*sin(a)) for h, r in
               [(.015, .012), (.122, .021), (.205, .028), (.278, .038), (.315, .044)]]
        parts.append(tube(name+'-interior-cut-straw', pts,
                          [.0014, .0013, .0012, .0010, .0007], ruth_straw, sides=5))
    for h, rx, rf in [(.122, .026, .024), (.205, .034, .030)]:
        pts = [(x+rx*cos(2*pi*k/48), h+.002*sin(4*pi*k/48), f+rf*sin(2*pi*k/48))
               for k in range(49)]
        parts.append(tube(name+'-fibre-binding', pts, [.0025]*49, ruth_rope_mat, sides=6))
    return parts


def ruth_tray(name, center, width, depth):
    """Modern removable tray: bottom plus four walls enclose a real inner space."""
    x, h, f = center; wall = .009
    parts = [box_surface(name+'-real-floor', (x, h+.004, f), (width, .008, depth), ruth_tray_mat, .002)]
    for pf in [f-depth/2+wall/2, f+depth/2-wall/2]:
        parts.append(box_surface(name+'-end-wall', (x, h+.016, pf),
                     (width, .024, wall), ruth_tray_mat, .002))
    for px in [x-width/2+wall/2, x+width/2-wall/2]:
        parts.append(box_surface(name+'-side-wall', (px, h+.016, f),
                     (wall, .024, depth-wall*2), ruth_tray_mat, .002))
    # A flat projecting tab reads as a contemporary educational insert.
    parts.append(box_surface(name+'-modern-lift-tab', (x-width/2-.018, h+.006, f),
                 (.043, .012, .054), ruth_tray_mat, .003))
    return parts


def ruth_heap(name, center, rx, rf, height):
    vs = [xyz(center[0], center[1]+height, center[2])]; fs = []; n = 40; rows = 8
    for j in range(1, rows+1):
        r = j/rows
        for k in range(n):
            a = 2*pi*k/n
            h = center[1]+height*max(0, 1-r*r)**1.3+.0010*r*sin(a*9)
            vs.append(xyz(center[0]+rx*r*cos(a), h, center[2]+rf*r*sin(a)))
            if j > 1:
                fs.append((1+(j-2)*n+k, 1+(j-2)*n+(k+1)%n,
                           1+(j-1)*n+(k+1)%n, 1+(j-1)*n+k))
    bottom = len(vs); vs.append(xyz(center[0], center[1]-.002, center[2]))
    for k in range(n):
        fs.extend([(0, 1+k, 1+(k+1)%n), (bottom, 1+(rows-1)*n+(k+1)%n, 1+(rows-1)*n+k)])
    parts = [mesh(name+'-continuous-pile', vs, fs, ruth_grain_mat, variation=.14)]
    for i in range(28):
        a = i*2.399963; r = .89*math.sqrt((i+.5)/28)
        h = center[1]+height*max(0, 1-r*r)**1.3+.0028
        parts.append(ruth_kernel(name+'-surface-kernel',
            (center[0]+rx*r*cos(a), h, center[2]+rf*r*sin(a)),
            (cos(a), .03, sin(a)), .012, .0030, n=8))
    return parts


# Ruth 2: harvest, deliberately left ears and gathered material are separate.
ruth_gleaning_scene = new_scene('Ruth — harvest, left ears and gleaned collection, Ruth 2')
ground = sinai_closed_grid('gleaning-modern-field-display-ground', (-.65, .65, -.425, .425),
    30, 20, lambda x, f: .011+.0011*sin(x*49+f*39), 0, ruth_soil_mat, .15)
parent_parts('ruth-gleaning-modern-ground', [ground])
harvest_parts = ruth_tied_sheaf('harvest-first-sheaf', -.417, -.170, .4)
harvest_parts += ruth_tied_sheaf('harvest-second-sheaf', -.352, .025, 2.1)
# A small ORIGINAL curved harvesting comparison stays with the main harvest.
# It is no scanned Met object and no gleaner's assigned implement.
vs = []; fs = []; steps = 28
for lower in [False, True]:
    for k in range(steps+1):
        a = -.15+k*1.95/steps
        for r in [.073, .099]:
            vs.append(xyz(-.457+r*cos(a), .020-(.003 if lower else 0), .258+r*sin(a)))
count = (steps+1)*2
for layer in [0, 1]:
    for k in range(steps):
        q = layer*count+2*k; face = (q, q+1, q+3, q+2)
        fs.append(tuple(reversed(face)) if layer else face)
edge = list(range(0, count, 2))+list(range(count-1, 0, -2))
for a, b in zip(edge, edge[1:]+edge[:1]):
    fs.append((a, b, b+count, a+count))
harvest_parts.append(mesh('harvest-original-curved-tool-comparison', vs, fs, ruth_iron_mat, variation=.07))
harvest_parts.append(tube('harvest-original-tool-handle', [(-.384, .020, .247), (-.384, .020, .137)],
                          [.009, .007], ruth_wood_mat, sides=12))
parent_parts('ruth-gleaning-main-harvest', harvest_parts)

left_parts = []
for i, (x, f, angle) in enumerate([(-.085, -.110, .5), (.025, .055, 2.3),
    (-.045, .246, -.4), (.130, -.205, 1.2), (.150, .279, 2.7)]):
    left_parts += ruth_cereal('left-behind-loose-ear', (x, .016, f),
                              (cos(angle), .015, sin(angle)), .055, i+10)
parent_parts('ruth-gleaning-left-ears', left_parts)

collection_parts = []; cx = .410; cf = -.048
for i in range(14):
    a = i*2*pi/14
    pts = [(cx+.166*t*cos(a), .014+.052*t**3, cf+.149*t*sin(a)) for t in [j/10 for j in range(11)]]
    collection_parts.append(tube('gleaning-open-collection-spoke', pts, [.0029]*11, ruth_reed_mat, sides=5))
for row in range(6):
    r = .20+row*.80/5
    pts = [(cx+.166*r*cos(2*pi*k/48), .014+.052*r**3+.001*sin(k*1.7),
            cf+.149*r*sin(2*pi*k/48)) for k in range(49)]
    collection_parts.append(tube('gleaning-open-collection-binding', pts, [.0028]*49, ruth_reed_mat, sides=5))
for i in range(8):
    angle = .25+i*.08
    collection_parts += ruth_cereal('gleaned-collected-ear',
        (.329+i*.013, .041+(i%3)*.003, -.110+(i//4)*.045), (cos(angle), .05, sin(angle)), .065, i+21)
parent_parts('ruth-gleaning-gathered-collection', collection_parts)
finish_static(ruth_gleaning_scene, 'ruth-gleaning', .416)
report['assets']['ruth-gleaning']['interpretation'] = (
    'Ruth 2 modern farming comparison; main harvest, deliberately left ears and '
    'gleaned collection are separate; grain detail, bundle counts, basket and '
    'unassigned harvesting tool are teaching choices, not archaeological prototypes')


# Daylight processing comparison: these contemporary trays are removable layers,
# not a threshing machine or a bed. Shawl remains an independent ordinary cloth.
ruth_grain_scene = new_scene('Ruth — grain processing layers and ordinary shawl, Ruth 2–3')
layer_specs = [('heap', .035, .245), ('chaff', .135, .085),
               ('kernels', .235, -.075), ('ears', .335, -.235)]
for label, h, f in layer_specs:
    parts = ruth_tray('grain-modern-'+label+'-tray', (-.236, h, f), .730, .300)
    if label == 'heap':
        parts += ruth_heap('grain-display-heap', (-.236, h+.012, f+.060), .258, .079, .054)
    elif label == 'chaff':
        for i in range(27):
            x = -.518+(i%9)*.071; pf = f+.012+(i//9)*.038
            a = i*2.399963; upper = []
            for j in range(5):
                t = j/4; dx = (t-.5)*.031
                for k in range(3):
                    df = (k/2-.5)*.010*sin(pi*(.1+.8*t))
                    upper.append((x+dx*cos(a)-df*sin(a), h+.013+.003*sin(pi*t),
                                  pf+dx*sin(a)+df*cos(a)))
            parts.append(sinai_thick_sheet('grain-selected-curved-husk-piece', upper, 3, ruth_chaff_mat, .0008))
    elif label == 'kernels':
        for i in range(42):
            x = -.540+(i%14)*.046; pf = f+.018+(i//14)*.039; a = i*2.399963
            parts.append(ruth_kernel('grain-individual-loose-kernel', (x, h+.012, pf),
                                      (cos(a), .02, sin(a)), .013, .0032, n=8))
    else:
        for i in range(3):
            parts += ruth_cereal('grain-selected-whole-ear', (-.520, h+.014, f-.090+i*.075),
                                  (1, .015, .10*sin(i)), .410, i+30)
    parent_parts('ruth-grain-'+label+'-layer', parts)

upper = []; nx = 30; nf = 40
for j in range(nf+1):
    f = -.325+j*.650/nf
    for i in range(nx+1):
        u = i/nx; x = .403+(u-.5)*.372
        h = .018+.018*sin(pi*u)**2+.004*sin(u*10*pi+f*5)+.003*sin(f*33)
        if j < 5:
            h += .013*(1-j/5)*sin(pi*u)
        upper.append((x, h, f+.003*sin(u*9*pi)))
shawl = sinai_thick_sheet('grain-independent-ordinary-shawl-surface', upper, nx+1, ruth_cloth_mat, .0022)
shawl_parts = [shawl]
for index in [0, nf]:
    pts = [upper[index*(nx+1)+i] for i in range(nx+1)]
    shawl_parts.append(tube('grain-shawl-plain-hem', pts, [.0013]*len(pts), ruth_cloth_mat, sides=5))
parent_parts('ruth-grain-independent-shawl', shawl_parts)
finish_static(ruth_grain_scene, 'ruth-grain', .363)
report['assets']['ruth-grain']['interpretation'] = (
    'Ruth 2–3 modern removable ears/kernels/chaff/heap comparison and independent '
    'ordinary shawl; no night-bed action, ancient machine, load capacity, or '
    'conversion of six measures to six ephahs')
report['assets']['ruth-grain']['removable_groups'] = [
    'ruth-grain-ears-layer', 'ruth-grain-kernels-layer', 'ruth-grain-chaff-layer', 'ruth-grain-heap-layer']


def ruth_sole(name, center, width, length, bottom, thickness, mat):
    """An original sole contour with distinct beveled sides, top and underside."""
    vs = []; fs = []; n = 64
    profile = [(bottom, .94), (bottom+.0015, 1),
               (bottom+thickness-.0015, 1), (bottom+thickness, .95)]
    for row, (h, shrink) in enumerate(profile):
        for k in range(n):
            a = 2*pi*k/n
            x = center[0]+width*.5*cos(a)*(1+.13*sin(a))*shrink+.005*sin(a)
            f = center[1]+length*.5*sin(a)*shrink
            vs.append(xyz(x, h, f))
            if row:
                fs.append(((row-1)*n+k, (row-1)*n+(k+1)%n, row*n+(k+1)%n, row*n+k))
    lower = len(vs); vs.append(xyz(center[0], bottom, center[1]))
    top = len(vs); vs.append(xyz(center[0], bottom+thickness, center[1]))
    for k in range(n):
        fs.extend([(lower, (k+1)%n, k), (top, 3*n+k, 3*n+(k+1)%n)])
    return mesh(name, vs, fs, mat, variation=.11)


# Ruth 4: independent modern gathering diagram; no claim to Bethlehem's gate,
# a surveyed ten-seat plan or the dating/construction of the later LOC footwear.
ruth_witness_scene = new_scene('Ruth — modern gate gathering map and ordinary shoe, Ruth 4')
ground = sinai_closed_grid('witness-modern-gathering-map-base', (-.675, .675, -.450, .450), 34, 22,
    lambda x, f: .012+.0008*sin(x*41+f*33), 0, ruth_map_mat, .095)
parent_parts('ruth-witness-modern-space-map', [ground])
gate_parts = []
for x in [-.495, .015]:
    for row in range(4):
        gate_parts.append(box_surface('witness-original-portal-pier-block', (x, .060+row*.091, -.270),
            (.155, .087, .180), ruth_stone_mat, .005))
for i in range(3):
    gate_parts.append(box_surface('witness-original-flat-portal-top', (-.493+i*.253, .416, -.270),
                                  (.249, .067, .188), ruth_stone_mat, .005))
for x in [-.490, .010]:
    gate_parts.append(box_surface('witness-schematic-side-bench', (x, .043, .069),
                                  (.130, .060, .448), ruth_stone_mat, .004))
parent_parts('ruth-witness-original-gate-and-sitting-space', gate_parts)

marker_parts = []
for x in [-.490, .010]:
    for i in range(5):
        f = -.100+i*.082
        marker_parts.append(tube('witness-modern-elder-position-marker',
            [(x, .073, f), (x, .106, f)], [.010, .007], ruth_marker_mat, sides=8))
        marker_parts.append(ellipsoid('witness-modern-marker-rounded-top', (x, .106, f),
            (.007, .005, .007), ruth_marker_mat, seg=12, rows=6))
parent_parts('ruth-witness-ten-modern-witness-markers', marker_parts)
discussion_parts = []
for x in [-.328, -.151]:
    discussion_parts.append(tube('witness-modern-discussion-position-marker',
        [(x, .013, .182), (x, .060, .182)], [.013, .009], ruth_discussion_mat, sides=8))
    discussion_parts.append(ellipsoid('witness-modern-discussion-marker-top', (x, .061, .182),
        (.009, .006, .009), ruth_discussion_mat, seg=12, rows=6))
parent_parts('ruth-witness-two-modern-discussion-markers', discussion_parts)

# One ordinary selected shoe, enlarged alongside the map for construction study.
# The original two-band arrangement deliberately does not reproduce soleae lacing.
shoe_cx = .427; shoe_cf = .080
sole_parts = [ruth_sole('witness-shoe-outer-sole', (shoe_cx, shoe_cf), .145, .330, .015, .008, ruth_leather_mat),
              ruth_sole('witness-shoe-separate-middle-sole', (shoe_cx, shoe_cf), .141, .323, .0235, .004, ruth_insole_mat)]
for i in range(22):
    a = 2*pi*i/22
    x = shoe_cx+.067*cos(a)*(1+.13*sin(a))+.005*sin(a)
    f = shoe_cf+.154*sin(a)
    sole_parts.append(tube('witness-selected-plain-sole-edge-stitch',
        [(x-.0018*cos(a), .0278, f-.0018*sin(a)),
         (x+.0018*cos(a), .0278, f+.0018*sin(a))], [.00065, .00065], ruth_rope_mat, sides=4))
parent_parts('ruth-witness-shoe-sole-layer', sole_parts)
inner = ruth_sole('witness-shoe-distinct-inner-contact-layer', (shoe_cx, shoe_cf),
                   .135, .314, .028, .0038, ruth_insole_mat)
parent_parts('ruth-witness-shoe-inner-layer', [inner])

strap_parts = []
for index, cf in enumerate([.160, .011]):
    upper = []
    for j in range(25):
        t = j/24
        x = shoe_cx-.067+.134*t
        h = .027+.052*sin(pi*t)**.75
        f = cf+.013*sin(pi*t)*(1 if index == 0 else -1)
        for k in range(5):
            upper.append((x, h, f+(k/4-.5)*.026))
    strap_parts.append(sinai_thick_sheet('witness-original-thick-fixing-band', upper, 5, ruth_strap_mat, .0025))
    for side in [-1, 1]:
        strap_parts.append(box_surface('witness-selected-band-attachment',
            (shoe_cx+side*.063, .033, cf), (.008, .014, .033), ruth_strap_mat, .002))
parent_parts('ruth-witness-shoe-fastening-layer', strap_parts)
finish_static(ruth_witness_scene, 'ruth-witness', .450)
report['assets']['ruth-witness']['interpretation'] = (
    'Ruth 4 modern original gate gathering diagram and ordinary single-shoe '
    'construction comparison; ten witness markers and two discussion markers '
    'are diagram choices, not an ancient seating plan or portraits; sole/strap '
    'parts do not identify a Ruth-period type or copy later Qumran lacing')
report['assets']['ruth-witness']['removable_groups'] = [
    'ruth-witness-shoe-inner-layer', 'ruth-witness-shoe-fastening-layer']
report['assets']['ruth-witness']['witness_marker_count'] = 10
