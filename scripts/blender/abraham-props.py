"""Original Abraham narrative teaching objects, authored entirely as geometry.

Genesis names an altar, hospitality and a well agreement; these shapes, materials,
vessel counts and the well's modern cutaway are explicitly teaching choices.
No identified find, specified altar stone, later altar law or excavated well is
being reconstructed. There are no inscriptions, seals, horns or injured animals.
This file runs after return-props.py / paul-props.py in build-assets.py.
"""

abraham_stones = [
    material('abraham-stone-warm-grey', (.365, .338, .280), .98),
    material('abraham-stone-sand-grey', (.455, .413, .332), .99),
    material('abraham-stone-cool-grey', (.320, .326, .305), .99),
    material('abraham-stone-weathered-tan', (.410, .365, .286), 1),
]
abraham_clay = material('abraham-selected-buff-earthenware', (.455, .320, .203), .96)
abraham_dark_clay = material('abraham-selected-dark-earthenware', (.250, .180, .113), .97)
abraham_water = material('abraham-clean-water-comparison', (.185, .310, .285), .20)
abraham_water.node_tree.nodes.get('Principled BSDF').inputs['Transmission Weight'].default_value = .42
abraham_water.node_tree.nodes.get('Principled BSDF').inputs['IOR'].default_value = 1.333
abraham_milk = material('abraham-dairy-comparison', (.740, .693, .555), .46)
abraham_reed = material('abraham-reed-fibre', (.420, .330, .191), .99)
abraham_reed_light = material('abraham-pale-reed-fibre', (.545, .443, .278), .99)
abraham_rope = material('abraham-undated-fibre-rope', (.332, .263, .160), 1)
abraham_bread = material('abraham-baked-flatbread', (.600, .371, .163), .96)
abraham_silt = material('abraham-well-floor-sediment', (.245, .224, .179), 1)


def abraham_fieldstone(name, center, size, seed, mat):
    """Closed, uneven fieldstone with a rounded shoulder and broad broken faces.

    The asymmetry is continuous over its surface, rather than a displaced cube
    with sharpened edges. Lower and upper fans close the solid stone itself.
    """
    vs = []; fs = []; n = 24
    levels = [(-.50, .53), (-.46, .73), (-.35, .91), (-.18, .99),
              (.04, 1.0), (.24, .95), (.39, .84), (.47, .66), (.50, .48)]
    for row, (h, radius) in enumerate(levels):
        for k in range(n):
            a = 2*pi*k/n
            ripple = (1 + .093*sin(3*a+seed*1.7) + .053*sin(7*a-seed*.8+h*3)
                      + .018*sin(13*a+row*2.1+seed))
            cx = (1 if cos(a) >= 0 else -1)*abs(cos(a))**(.78+.16*sin(seed*.7))
            cf = (1 if sin(a) >= 0 else -1)*abs(sin(a))**(.80+.13*cos(seed*.9))
            x = center[0] + size[0]*.5*radius*cx*ripple + size[0]*.022*sin(seed+h*4)
            f = center[2] + size[2]*.5*radius*cf*ripple
            z = center[1] + size[1]*(h + .040*sin(5*a+seed)*sin(pi*row/(len(levels)-1)))
            vs.append(xyz(x, z, f))
            if row:
                q = row*n+k
                fs.append((q-n, row*n+(k+1)%n-n, row*n+(k+1)%n, q))
    lower = len(vs); vs.append(xyz(center[0], center[1]-size[1]*.50, center[2]))
    upper = len(vs); vs.append(xyz(center[0], center[1]+size[1]*.50, center[2]))
    for k in range(n):
        fs.append((lower, (k+1)%n, k))
        fs.append((upper, (len(levels)-1)*n+k, (len(levels)-1)*n+(k+1)%n))
    obj = mesh(name, vs, fs, mat, variation=.18)
    # Exposed fracture planes stay legible rather than smoothing into cushions.
    for face in obj.data.polygons:
        face.use_smooth = False
    colors = obj.data.color_attributes['surface']
    for i, v in enumerate(obj.data.vertices):
        x, y, z = v.co
        pale = .07*sin(x*81+y*37+seed)*sin(z*93+seed)
        stain = -.14*max(0, sin(x*23-y*39+seed*2))**5
        colors.data[i].color = (*(max(.015, min(1, c*(1+pale+stain)))
                                 for c in colors.data[i].color[:3]), 1)
    return obj


def abraham_water_disc(name, radius, height, mat, x=0, f=0):
    """A two-millimetre liquid sheet, never a cylinder filling an interior."""
    profile = [(0, height-.002), (radius, height-.002),
               (radius, height), (radius*.78, height+.0006), (0, height)]
    obj = pottery_profile(name, profile, mat, n=64, tool=False)
    obj.location = xyz(x, 0, f)
    return obj


def abraham_woven_strip(name, points, width, thickness, mat, along_front):
    """Flat solid fibre strip; over/under crossings are actual geometry."""
    vs = []; fs = []
    for j, (x, h, f) in enumerate(points):
        for w, dh in [(-width/2, -thickness/2), (width/2, -thickness/2),
                      (width/2, thickness/2), (-width/2, thickness/2)]:
            vs.append(xyz(x+(w if along_front else 0), h+dh,
                          f+(0 if along_front else w)))
        if j:
            for k in range(4):
                fs.append(((j-1)*4+k, (j-1)*4+(k+1)%4,
                           j*4+(k+1)%4, j*4+k))
    fs.extend([tuple(reversed(range(4))), tuple((len(points)-1)*4+k for k in range(4))])
    return mesh(name, vs, fs, mat, variation=.09)


def abraham_flatbread(name, center, radii, seed):
    """Closed bread with thickness, low blisters and vertex-coloured bake marks."""
    vs = [xyz(center[0], center[1]+radii[1], center[2])]; fs = []
    n = 56; rows = 16
    for j in range(1, rows):
        t = pi*j/rows
        for k in range(n):
            a = 2*pi*k/n
            outline = 1+.032*sin(5*a+seed)+.023*sin(9*a-seed)
            x = radii[0]*sin(t)*cos(a)*outline
            f = radii[2]*sin(t)*sin(a)*outline
            top = max(0, cos(t))
            blister = .0045*top*sin(pi*sin(t))*(.5+.5*sin(x*97+f*73+seed))**3
            h = radii[1]*cos(t)+blister
            vs.append(xyz(center[0]+x, center[1]+h, center[2]+f))
            if j > 1:
                q = 1+(j-1)*n+k; p = 1+(j-2)*n+k
                fs.append((p, 1+(j-2)*n+(k+1)%n, 1+(j-1)*n+(k+1)%n, q))
    bottom = len(vs); vs.append(xyz(center[0], center[1]-radii[1], center[2]))
    for k in range(n):
        fs.append((0, 1+k, 1+(k+1)%n))
        fs.append((bottom, 1+(rows-2)*n+(k+1)%n, 1+(rows-2)*n+k))
    obj = mesh(name, vs, fs, abraham_bread, variation=.035)
    colors = obj.data.color_attributes['surface']
    for i, v in enumerate(obj.data.vertices):
        x, y, h = v.co
        patch = max(0, sin(x*79-y*61+seed)*sin(x*43+y*91-seed))**4
        scale = 1-.58*patch+.07*sin(x*173+y*133)
        colors.data[i].color = (.600*scale, .371*scale, .163*scale, 1)
    return obj


# Genesis 12:6–9: a low, uncrowned altar-type construction. Stone choice and
# arrangement are illustrative; the passage does not supply this stonework plan.
abraham_altar_scene = new_scene('Abraham — low altar teaching type, Genesis 12:6–9')
abraham_altar_base = []; abraham_altar_middle = []; abraham_altar_top = []
for row in range(3):
    for col in range(4):
        seed = row*4+col+.6
        x = (col-1.5)*.292 + .010*sin(seed*2)
        f = (row-1)*.281 + .008*sin(seed*3)
        abraham_altar_base.append(abraham_fieldstone(
            'altar-foundation-fieldstone-%02d' % (row*4+col+1),
            (x, .081, f), (.292+.011*sin(seed), .162, .281+.011*cos(seed)),
            seed, abraham_stones[(row+col)%4]))
for row in range(3):
    for col in range(3):
        seed = 17+row*3+col
        abraham_altar_middle.append(abraham_fieldstone(
            'altar-interlocked-middle-stone-%02d' % (row*3+col+1),
            ((col-1)*.378+.009*sin(seed), .245, (row-1)*.268),
            (.378+.010*cos(seed), .176, .270), seed, abraham_stones[(col+2*row+1)%4]))
for row in range(2):
    for col in range(3):
        seed = 31+row*3+col
        abraham_altar_top.append(abraham_fieldstone(
            'altar-distinct-top-stone-%02d' % (row*3+col+1),
            ((col-1)*.371, .414, (row-.5)*.385),
            (.368+.008*sin(seed), .172, .378), seed, abraham_stones[(row+col+2)%4]))
parent_parts('abraham-altar-foundation', abraham_altar_base)
parent_parts('abraham-altar-middle-stones', abraham_altar_middle)
parent_parts('abraham-altar-top', abraham_altar_top)
finish_static(abraham_altar_scene, 'abraham-altar', .500)
report['assets']['abraham-altar']['interpretation'] = (
    'Genesis 12:6–9 altar teaching type; selected irregular stone and low arrangement, '
    'not a specified stone material, identified altar, or later altar-law reconstruction')
report['assets']['abraham-altar']['removable_group'] = 'abraham-altar-top'


# Genesis 18:1–15: two breads are a display choice, not a conversion of three seahs
# into loaf counts. Hollow vessels, mat weave and basket openings remain inspectable.
abraham_hospitality_scene = new_scene('Abraham — hospitality teaching objects, Genesis 18:1–15')
abraham_mat_parts = []
nx = 22; nf = 16
for i in range(nx):
    x = -.493+i*.986/(nx-1)
    points = [(x, .007+.0021*cos(pi*(j*.5+i)), -.350+j*.700/30) for j in range(31)]
    abraham_mat_parts.append(abraham_woven_strip(
        'hospitality-mat-longitudinal-strip', points, .024, .0018,
        abraham_reed if i%3 else abraham_reed_light, True))
for j in range(nf):
    f = -.350+j*.700/(nf-1)
    # Match the warp's phase at crossings, with opposite lift.
    points = [(-.493+i*.986/42, .007-.0021*cos(pi*(i*.5+j)), f)
              for i in range(43)]
    abraham_mat_parts.append(abraham_woven_strip(
        'hospitality-mat-cross-strip', points, .024, .0018,
        abraham_reed_light if j%4 else abraham_reed, False))
for f in [-.366, .366]:
    abraham_mat_parts.append(tube('hospitality-mat-bound-edge',
        [(-.511+i*1.022/40, .009, f+.001*sin(i*2)) for i in range(41)],
        [.003]*41, abraham_rope, sides=6))
parent_parts('abraham-hospitality-woven-mat', abraham_mat_parts)

basin = pottery_profile('hospitality-basin-real-inner-wall-and-floor',
    [(0, .014), (.111, .014), (.154, .031), (.184, .074),
     (.195, .116), (.192, .124), (.181, .125), (.176, .116),
     (.169, .081), (.142, .043), (.105, .031), (0, .031)],
    abraham_clay, n=72, tool=False)
basin.location = xyz(-.272, 0, .122)
parent_parts('abraham-hospitality-washing-basin', [basin])
parent_parts('abraham-hospitality-clean-water', [abraham_water_disc(
    'hospitality-basin-thin-water-surface', .150, .061, abraham_water, -.272, .122)])

dairy = pottery_profile('hospitality-dairy-vessel-real-interior',
    [(0, .014), (.059, .014), (.081, .029), (.096, .075),
     (.099, .137), (.083, .200), (.065, .237), (.065, .257),
     (.057, .263), (.049, .256), (.051, .237), (.070, .194),
     (.085, .134), (.081, .075), (.057, .038), (0, .037)],
    abraham_dark_clay, n=64, tool=False)
dairy.location = xyz(-.261, 0, -.240)
dairy_handle = tube('hospitality-selected-dairy-strap-handle',
    [(-.261-.072-.048*sin(pi*j/18), .225-.130*j/18, -.240) for j in range(19)],
    [.010]*19, abraham_dark_clay, sides=8)
parent_parts('abraham-hospitality-dairy-vessel', [dairy, dairy_handle])
parent_parts('abraham-hospitality-dairy-contents', [abraham_water_disc(
    'hospitality-visible-dairy-surface', .078, .154, abraham_milk, -.261, -.240)])

# Open shallow basket: spaced spokes and horizontal bindings, with no solid wall.
abraham_basket_parts = []
for i in range(18):
    a = 2*pi*i/18
    points = []
    for j in range(13):
        t = j/12
        points.append((.221+.249*t*cos(a), .018+.080*t**3, .038+.231*t*sin(a)))
    abraham_basket_parts.append(tube('hospitality-basket-radial-fibre', points,
        [.0033]*len(points), abraham_reed_light, sides=5))
for row in range(8):
    t = .18+row*.82/7
    points = [(.221+.249*t*cos(2*pi*k/64),
               .018+.080*t**3+.0015*sin(18*2*pi*k/64),
               .038+.231*t*sin(2*pi*k/64)) for k in range(65)]
    abraham_basket_parts.append(tube('hospitality-basket-woven-binding', points,
        [.0028 if row < 7 else .0045]*65, abraham_reed, sides=5))
parent_parts('abraham-hospitality-open-basket', abraham_basket_parts)
for name, center, radii, seed in [
    ('first', (.178, .078, .127), (.118, .019, .092), 1.3),
    ('second', (.284, .082, -.068), (.115, .021, .090), 3.9),
]:
    parent_parts('abraham-hospitality-'+name+'-flatbread', [
        abraham_flatbread('hospitality-solid-'+name+'-flatbread', center, radii, seed)])
finish_static(abraham_hospitality_scene, 'abraham-hospitality', .263)
report['assets']['abraham-hospitality']['interpretation'] = (
    'Genesis 18:1–15 hospitality comparison; vessel forms, woven display and two '
    'thick breads are teaching choices; two breads do not convert the stated flour quantity')
report['assets']['abraham-hospitality']['bread_count_is_teaching_choice'] = True


def abraham_well_stone(name, angle0, angle1, bottom, top, seed, mat):
    """Closed annular wedge with distinct outer AND inner wall surfaces.

    A beveled eight-point radial section is swept along the curved block. End
    faces close each stone, while the well's central shaft stays entirely empty.
    """
    vs = []; fs = []; steps = 10
    ri = .354; ro = .568
    section = [(ri+.014, bottom), (ro-.014, bottom),
               (ro, bottom+.014), (ro, top-.017), (ro-.016, top),
               (ri+.016, top), (ri, top-.014), (ri, bottom+.014)]
    for j in range(steps+1):
        a = angle0+(angle1-angle0)*j/steps
        for k, (r, h) in enumerate(section):
            shift = .0032*sin(7*a+seed*2)+.0017*sin(23*a-seed+k)
            z = max(0, h+.0020*sin(13*a+seed+k*.27)*sin(pi*j/steps))
            vs.append(xyz((r+shift)*cos(a), z, (r+shift)*sin(a)))
            if j:
                fs.append(((j-1)*8+k, (j-1)*8+(k+1)%8,
                           j*8+(k+1)%8, j*8+k))
    fs.extend([tuple(reversed(range(8))), tuple(steps*8+k for k in range(8))])
    obj = mesh(name, vs, fs, mat, variation=.115)
    for face in obj.data.polygons:
        face.use_smooth = len(face.vertices) == 4
    return obj


# Genesis 21:22–34: modern sectional teaching model, not a claimed location,
# excavated well or reconstruction of an evidenced lifting mechanism.
abraham_well_scene = new_scene('Abraham — modern well-agreement section, Genesis 21:22–34')
abraham_well_lower = []; abraham_well_section = []; abraham_well_rim = []
for course, (bottom, top) in enumerate([(0, .183), (.193, .379), (.389, .575), (.588, .765)]):
    for i in range(12):
        a = 2*pi*i/12
        # Upper wall omits a front 90-degree sector, exposing the actual shaft.
        # A complete removable upper ring explicitly bridges the modern cutaway.
        if course in [1, 2] and i in [2, 3, 4]:
            continue
        offset = 0 if course%2 == 0 else pi/12
        stone = abraham_well_stone(
            'well-annular-course-%d-stone-%02d' % (course+1, i+1),
            a+offset+.010, a+offset+2*pi/12-.010, bottom, top,
            43+course*12+i, abraham_stones[(i+course)%4])
        if course == 3:
            abraham_well_rim.append(stone)
        elif course == 0:
            abraham_well_lower.append(stone)
        else:
            abraham_well_section.append(stone)
parent_parts('abraham-well-lower-complete-ring', abraham_well_lower)
parent_parts('abraham-well-modern-cutaway-wall', abraham_well_section)
parent_parts('abraham-well-rim', abraham_well_rim)

# Real floor below a thin low water sheet. No solid central cylinder, hidden cap
# at the mouth, or dark-painted surface substitutes for the interior cavity.
floor = pottery_profile('well-true-low-inner-floor',
    [(0, .001), (.351, .001), (.351, .015), (.24, .018), (0, .016)],
    abraham_silt, n=72, tool=False)
parent_parts('abraham-well-inner-floor', [floor])
parent_parts('abraham-well-low-water', [abraham_water_disc(
    'well-low-thin-water-sheet', .347, .072, abraham_water)])
abraham_well_gravel = []
for i in range(7):
    a = i*2.399; r = .14+.12*sin(i*1.7)**2
    abraham_well_gravel.append(abraham_fieldstone('well-floor-small-stone',
        (r*cos(a), .029, r*sin(a)), (.036, .023, .029), 80+i,
        abraham_stones[i%4]))
parent_parts('abraham-well-floor-gravel', abraham_well_gravel)

# An undated earthenware lifting container and fibre rope are comparative choices.
# Its real open mouth, rim thickness and inner floor can be inspected separately.
bucket = pottery_profile('well-selected-open-lifting-container',
    [(0, 0), (.059, 0), (.080, .017), (.091, .135),
     (.091, .160), (.085, .170), (.076, .169), (.075, .154),
     (.075, .132), (.065, .031), (.050, .020), (0, .020)],
    abraham_dark_clay, n=56, tool=False)
bucket.location = xyz(.130, .106, .100)
bucket_parts = [bucket]
for side in [-1, 1]:
    points = [(.130+side*.085, .245+.018*sin(2*pi*k/24),
               .100+.014*cos(2*pi*k/24)) for k in range(25)]
    bucket_parts.append(tube('well-container-rope-lug', points,
        [.007]*25, abraham_dark_clay, sides=6))
bucket_parts.append(tube('well-container-fibre-bail',
    [(.130-.085*cos(pi*k/24), .245+.101*sin(pi*k/24), .100) for k in range(25)],
    [.005]*25, abraham_rope, sides=7))
parent_parts('abraham-well-comparison-container', bucket_parts)

well_rope_parts = []
rope_points = [(.130, .347, .100), (.130, .440, .100), (.128, .580, .100),
               (.120, .716, .080), (.106, .770, -.070), (.083, .782, -.260),
               (.060, .782, -.380), (.080, .778, -.479)]
well_rope_parts.append(tube('well-selected-rope-without-lifting-machine', rope_points,
    [.005]*len(rope_points), abraham_rope, sides=9))
for turn in range(3):
    radius = .040+turn*.011
    points = [(.040+radius*cos(2*pi*k/64), .778+.002*sin(2*pi*k/64),
               -.479+radius*sin(2*pi*k/64)) for k in range(65)]
    well_rope_parts.append(tube('well-rope-loose-coil-on-rim', points,
        [.0042]*65, abraham_rope, sides=6))
parent_parts('abraham-well-comparison-rope', well_rope_parts)
finish_static(abraham_well_scene, 'abraham-well', .787)
report['assets']['abraham-well']['interpretation'] = (
    'Genesis 21:22–34 modern teaching cutaway; annular masonry, rope and container '
    'are comparative choices, not an identified Abraham well or proven lifting installation')
report['assets']['abraham-well']['removable_group'] = 'abraham-well-rim'
report['assets']['abraham-well']['modern_cutaway'] = True
