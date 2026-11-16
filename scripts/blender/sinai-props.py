"""Three original Sinai/wilderness teaching comparisons, prepared but not live.

Read with docs/review/SINAI-RESEARCH-START.md. Exodus 16, Exodus 17 and Exodus
19–20 remain separate moments, not adjacent sights in one actual mapped camp.
There is no identified mountain, excavated omer, botanical identification,
capacity claim, miraculous mechanism, inscription, tablet or divine likeness.
All shapes, quantities, routes and the removable modern guide are teaching
choices. The ordinary bowl's material/proportion is a general pottery comparison,
not a copy or identification of the Met's regional comparison vessel 34.126.12.
"""

sinai_clay = material('sinai-ordinary-unglazed-earthenware', (.429, .296, .188), .97)
sinai_clay_rim = material('sinai-earthenware-rim-tone', (.498, .356, .233), .98)
sinai_flake_mat = material('sinai-white-teaching-flakes', (.795, .777, .695), .99)
sinai_mat_fibre = material('sinai-plain-display-fibre', (.398, .337, .235), 1)
sinai_mat_edge = material('sinai-bound-display-fibre', (.279, .231, .154), 1)
sinai_stone_mat = material('sinai-original-rough-rock', (.327, .299, .253), .99)
sinai_pebble_mat = material('sinai-original-loose-stone', (.401, .366, .297), 1)
sinai_earth_mat = material('sinai-dry-ground-section', (.401, .329, .230), 1)
sinai_water_mat = material('sinai-exposed-water-comparison', (.143, .309, .310), .18)
sinai_water_mat.node_tree.nodes.get('Principled BSDF').inputs['Transmission Weight'].default_value = .37
sinai_water_mat.node_tree.nodes.get('Principled BSDF').inputs['IOR'].default_value = 1.333
sinai_map_mat = material('sinai-original-space-map-ground', (.383, .326, .246), 1)
sinai_guide_mat = material('sinai-modern-teaching-guide-teal', (.012, .348, .391), .75)
sinai_tent_mat = material('sinai-schematic-camp-cloth', (.515, .456, .346), .99)
sinai_tent_wood = material('sinai-schematic-support-wood', (.231, .151, .075), .98)


def sinai_closed_grid(name, bounds, nx, nf, height, bottom, mat, variation=.06):
    """Authored upper surface with sides and an actual closed bottom."""
    x0, x1, f0, f1 = bounds
    vs = []; fs = []
    for lower in [False, True]:
        for j in range(nf+1):
            f = f0+(f1-f0)*j/nf
            for i in range(nx+1):
                x = x0+(x1-x0)*i/nx
                vs.append(xyz(x, bottom if lower else height(x, f), f))
    count = (nx+1)*(nf+1)
    for lower in [0, 1]:
        for j in range(nf):
            for i in range(nx):
                q = lower*count+j*(nx+1)+i
                face = (q, q+1, q+nx+2, q+nx+1)
                fs.append(tuple(reversed(face)) if lower else face)
    edge = (list(range(nx+1)) + [j*(nx+1)+nx for j in range(1, nf+1)]
            + [nf*(nx+1)+i for i in range(nx-1, -1, -1)]
            + [j*(nx+1) for j in range(nf-1, 0, -1)])
    for a, b in zip(edge, edge[1:]+edge[:1]):
        fs.append((a, b, b+count, a+count))
    return mesh(name, vs, fs, mat, variation=variation)


def sinai_flake(name, center, seed, slope=(0, 0)):
    """A closed irregular thin plate; this is no identified natural substance."""
    vs = []; fs = []; n = 8
    angle = seed*2.399963
    rx = .0105*(1+.13*sin(seed*1.7)); rf = .0067*(1+.12*cos(seed*2.1))
    for lower in [False, True]:
        for k in range(n):
            a = 2*pi*k/n
            outline = 1+.13*sin(a*3+seed)+.06*sin(a*5-seed*.3)
            dx = rx*cos(a)*outline; df = rf*sin(a)*outline
            x = center[0]+dx*cos(angle)-df*sin(angle)
            f = center[2]+dx*sin(angle)+df*cos(angle)
            h = (center[1]+slope[0]*(x-center[0])+slope[1]*(f-center[2])
                 +.0008*sin(a*2+seed)-(.0014 if lower else 0))
            vs.append(xyz(x, h, f))
    top = len(vs); vs.append(xyz(center[0], center[1]+.0012, center[2]))
    base = len(vs); vs.append(xyz(center[0], center[1]-.0002, center[2]))
    for k in range(n):
        j = (k+1)%n
        fs.extend([(top, k, j), (base, n+j, n+k), (k, n+k, n+j, j)])
    obj = mesh(name, vs, fs, sinai_flake_mat, variation=.035)
    for face in obj.data.polygons:
        face.use_smooth = False
    return obj


# Exodus 16: one ordinary container versus two of the identical container.
# Every displayed portion uses the same 96 invented flakes, never an asserted
# mass, volume, plant species or archaeological omer measuring standard.
sinai_manna_scene = new_scene('Sinai — ordinary bowls and teaching portions, Exodus 16')
mat = sinai_closed_grid('manna-plain-fibre-display-mat', (-.550, .550, -.375, .375), 40, 26,
    lambda x, f: .008+.0012*sin(x*99)*sin(f*87), .003, sinai_mat_fibre, .085)
mat_parts = [mat]
for f in [-.369, .369]:
    pts = [(-.544+i*1.088/64, .010, f+.0009*sin(i*2)) for i in range(65)]
    mat_parts.append(tube('manna-mat-bound-long-edge', pts, [.0024]*65, sinai_mat_edge, sides=6))
for x in [-.544, .544]:
    pts = [(x+.0009*sin(i*2), .010, -.369+i*.738/48) for i in range(49)]
    mat_parts.append(tube('manna-mat-bound-short-edge', pts, [.0024]*49, sinai_mat_edge, sides=6))
parent_parts('sinai-manna-display-mat', mat_parts)

sinai_manna_bowl_profile = [(0, .012), (.085, .012), (.121, .034),
    (.153, .082), (.171, .145), (.170, .159), (.161, .166),
    (.151, .163), (.146, .148), (.136, .094), (.110, .051), (.075, .032), (0, .032)]
sinai_manna_bowl_profile = [(r, h*1.4-.0068) for r, h in sinai_manna_bowl_profile]
for label, cx, cf in [('one-portion', -.340, 0),
                      ('two-portions-first', .252, -.193),
                      ('two-portions-second', .252, .193)]:
    bowl = pottery_profile('manna-identical-ordinary-bowl-'+label,
                            sinai_manna_bowl_profile, sinai_clay, n=64, tool=False)
    bowl.location = xyz(cx, 0, cf)
    bowl_parts = [bowl]
    pts = [(cx+.165*cos(2*pi*k/64), .163*1.4-.0068, cf+.165*sin(2*pi*k/64)) for k in range(65)]
    bowl_parts.append(tube('manna-plain-thickened-rim', pts, [.0022]*65, sinai_clay_rim, sides=6))
    parent_parts('sinai-manna-'+label+'-container', bowl_parts)
    flakes = []
    for i in range(96):
        layer = i//32; j = i%32; a = j*2.399963+layer*.7
        r = .116*math.sqrt((j+.5)/32)
        # Match the actual inside profile, including the slope under each flake.
        if r <= .075:
            floor_h = .032; grade = 0
        elif r <= .110:
            grade = .019/.035; floor_h = .032+(r-.075)*grade
        else:
            grade = .043/.026; floor_h = .051+(r-.110)*grade
        floor_h = floor_h*1.4-.0068; grade *= 1.4
        h = floor_h+.0030+layer*.0030
        flakes.append(sinai_flake('manna-invented-thin-flake',
            (cx+r*cos(a), h, cf+r*sin(a)), i+.7, (grade*cos(a), grade*sin(a))))
    parent_parts('sinai-manna-'+label+'-teaching-flakes', flakes)
finish_static(sinai_manna_scene, 'sinai-manna', .226)
report['assets']['sinai-manna']['interpretation'] = (
    'Exodus 16 one-portion and two-portion visual comparison; identical ordinary '
    'bowls and 96 invented white flakes per displayed portion are teaching choices; '
    'no botanical identification, capacity, excavated omer or standard-measure claim')
report['assets']['sinai-manna']['display_flakes_per_portion'] = 96
report['assets']['sinai-manna']['display_portion_groups'] = [1, 2]


# Original rock surface. Its shallow exposed depressions are geometric surface
# choices, not a tunnel, plumbing, hidden reservoir or explanation of the event.
sinai_rock_center = (-.175, -.110)
sinai_rock_profile = [(0, .278, .230), (.09, .340, .270), (.23, .358, .291),
    (.39, .368, .279), (.55, .337, .261), (.70, .307, .237),
    (.83, .260, .205), (.94, .191, .154), (1.0, .109, .089)]


def sinai_rock_surface(t, a):
    for index in range(len(sinai_rock_profile)-1):
        p = sinai_rock_profile[index]; q = sinai_rock_profile[index+1]
        if p[0] <= t <= q[0]:
            v = (t-p[0])/(q[0]-p[0])
            rx = p[1]+(q[1]-p[1])*v; rf = p[2]+(q[2]-p[2])*v
            break
    else:
        rx, rf = sinai_rock_profile[-1][1:]
    rough = .014*sin(5*a+t*11)+.007*sin(13*a-t*19)+.0035*sin(29*a+t*31)
    # Three discontinuous shallow fracture depressions are visible from outside.
    grooves = 0
    for az, depth in [(pi/2, .018), (2.42, .014), (4.18, .012)]:
        target = az+.055*sin(t*7+az)
        da = math.atan2(sin(a-target), cos(a-target))
        grooves += depth*math.exp(-(da/.055)**2)*sin(pi*t)**2
    radius = 1+rough-grooves
    cx = (1 if cos(a) >= 0 else -1)*abs(cos(a))**.80
    cf = (1 if sin(a) >= 0 else -1)*abs(sin(a))**.84
    x = sinai_rock_center[0]+rx*cx*radius+.014*sin(t*5)
    f = sinai_rock_center[1]+rf*cf*radius
    h = .018+.472*t+.006*sin(7*a+t*2)*sin(pi*t)
    return (x, h, f)


def sinai_thick_sheet(name, upper, width_count, mat, thickness=.0018):
    """Close a gridded ribbon along its edges, retaining actual sheet thickness."""
    vs = [xyz(*p) for p in upper]; fs = []
    vs += [xyz(p[0], p[1]-thickness, p[2]) for p in upper]
    count = len(upper); rows = count//width_count
    for lower in [0, 1]:
        for j in range(rows-1):
            for i in range(width_count-1):
                q = lower*count+j*width_count+i
                face = (q, q+1, q+width_count+1, q+width_count)
                fs.append(tuple(reversed(face)) if lower else face)
    edge = (list(range(width_count))
            + [j*width_count+width_count-1 for j in range(1, rows)]
            + [(rows-1)*width_count+i for i in range(width_count-2, -1, -1)]
            + [j*width_count for j in range(rows-2, 0, -1)])
    for a, b in zip(edge, edge[1:]+edge[:1]):
        fs.append((a, b, b+count, a+count))
    return mesh(name, vs, fs, mat, variation=.045)


sinai_water_scene = new_scene('Sinai — original rock and exposed flow, Exodus 17')
ground = sinai_closed_grid('water-modern-dry-ground-section', (-.55, .55, -.40, .40), 44, 28,
    lambda x, f: .009+.0004*sin(x*43+f*31), 0, sinai_earth_mat, .12)
parent_parts('sinai-water-dry-ground', [ground])
vs = []; fs = []; nr = 27; n = 72
for row in range(nr+1):
    t = row/nr
    for k in range(n):
        vs.append(xyz(*sinai_rock_surface(t, k*2*pi/n)))
        if row:
            fs.append(((row-1)*n+k, (row-1)*n+(k+1)%n, row*n+(k+1)%n, row*n+k))
fs.extend([tuple(reversed(range(n))), tuple(nr*n+k for k in range(n))])
rock = mesh('water-original-solid-fractured-rock', vs, fs, sinai_stone_mat, variation=.19)
for face in rock.data.polygons:
    face.use_smooth = False
parent_parts('sinai-water-original-rock-surface', [rock])

upper = []
for j in range(38):
    t = .755*(1-j/37)
    a = pi/2+.026*sin(t*8)
    half_width = (.040+.009*sin(j*.37))*min(1, .20+j/5)
    for k in range(7):
        x, h, f = sinai_rock_surface(t, a+(k/6-.5)*2*half_width)
        upper.append((x, h+.0010, f+.0040+.0006*sin(j*.7+k)))
rock_flow = sinai_thick_sheet('water-visible-sheet-on-outer-rock', upper, 7,
                              sinai_water_mat, .0014)
upper = []
for j in range(55):
    t = j/54
    x = -.175+.602*t+.022*sin(t*pi*2)*sin(pi*t)
    f = .125+.195*t+.019*sin(pi*t)
    dx = .602+.044*pi*cos(t*pi*2)*sin(pi*t)+.022*pi*sin(t*pi*2)*cos(pi*t)
    df = .195+.019*pi*cos(pi*t)
    length = math.sqrt(dx*dx+df*df); nx = -df/length; nf = dx/length
    rounded_end = math.sqrt(max(.0002, 1-(max(0, t-.78)/.22)**2))
    half_width = (.017+.026*t+.005*sin(t*5*pi))*rounded_end
    for k in range(9):
        side = (k/8-.5)*2*half_width
        h = .012+.0004*sin(j*.8+k*1.2)
        upper.append((x+nx*side, h, f+nf*side))
ground_flow = sinai_thick_sheet('water-fully-exposed-ground-route', upper, 9,
                                sinai_water_mat, .0024)
parent_parts('sinai-water-exposed-flow-comparison', [rock_flow, ground_flow])
pebbles = []
for i, (x, f, size) in enumerate([(.237, .179, .045), (.350, .247, .032), (.014, .340, .038)]):
    obj = ellipsoid('water-loose-original-pebble', (x, .025, f), (size, .016, size*.65),
                    sinai_pebble_mat, seg=16, rows=8)
    for face in obj.data.polygons:
        face.use_smooth = False
    pebbles.append(obj)
parent_parts('sinai-water-loose-ground-stones', pebbles)
finish_static(sinai_water_scene, 'sinai-water', .490)
report['assets']['sinai-water']['interpretation'] = (
    'Exodus 17 only; original solid rock, shallow fracture shapes and externally '
    'visible water route are teaching choices, not an identified modern rock, '
    'hidden mechanism, archaeological discovery or explanation of the miracle')


def sinai_map_height(x, f):
    """Invented spatial diagram, independent of any modern mountain contours."""
    peak = .522*math.exp(-((x+.125)/.260)**2-((f+.252)/.194)**2)
    shoulder = .173*math.exp(-((x-.174)/.248)**2-((f+.289)/.204)**2)
    foot = .067*math.exp(-((x+.10)/.49)**2-((f+.052)/.204)**2)
    rugged = .018*sin(x*33+f*21)*sin(x*13-f*24)*min(1, (peak+shoulder)*3)
    return .023+peak+shoulder+foot+rugged


def sinai_schematic_tent(name, x, f, mat):
    """Small equal-sized open-front shelters in a modern camp space diagram."""
    base = sinai_map_height(x, f)+.003
    vs = []; fs = []; nx = 8; nf = 9
    for j in range(nf+1):
        pf = f-.065+j*.130/nf
        for i in range(nx+1):
            u = i/nx; px = x-.069+.138*u
            h = base+.069*(1-abs(u-.5)*2)+.001*sin(j*.9+u*5)
            vs.append(xyz(px, h, pf))
            if j and i:
                q = j*(nx+1)+i
                fs.append((q-nx-2, q-nx-1, q, q-1))
    # Back is covered; the front remains a real opening.
    vs += [xyz(x-.069, base, f-.065), xyz(x+.069, base, f-.065), xyz(x, base+.069, f-.065)]
    fs.append((len(vs)-3, len(vs)-2, len(vs)-1))
    obj = mesh(name, vs, fs, mat, variation=.06)
    solid = obj.modifiers.new('schematic-shelter-cloth-thickness', 'SOLIDIFY'); solid.thickness = .0013
    bpy.context.view_layer.objects.active = obj; bpy.ops.object.modifier_apply(modifier=solid.name)
    pole = tube('map-schematic-ridge-support', [(x, base, f+.054), (x, base+.069, f+.054)],
                [.002, .002], sinai_tent_wood, sides=6)
    return [obj, pole]


# Exodus 19–20: mountain, foot and distant camp are symbolic spatial zones.
# The teal ribbon is unmistakably a removable modern teaching layer, no fence.
sinai_boundary_scene = new_scene('Sinai — mountain-foot-camp diagram, Exodus 19–20')
terrain = sinai_closed_grid('boundary-original-mountain-and-foot-terrain',
    (-.700, .700, -.500, .500), 70, 50, sinai_map_height, 0, sinai_map_mat, .14)
colors = terrain.data.color_attributes['surface']
for i, v in enumerate(terrain.data.vertices):
    x, y, z = v.co
    rocky = min(1, max(0, (z-.095)/.43))
    grain = 1+.065*sin(x*83+y*69+z*51)
    colors.data[i].color = ((.383-.130*rocky)*grain, (.326-.085*rocky)*grain,
                           (.246-.025*rocky)*grain, 1)
for face in terrain.data.polygons:
    face.use_smooth = False
parent_parts('sinai-boundary-invented-mountain-and-foot', [terrain])

upper = []
for j in range(69):
    x = -.646+j*1.292/68
    f = .085-.038*cos(x*pi/1.2)
    for k in range(5):
        pf = f+(k/4-.5)*.034
        upper.append((x, sinai_map_height(x, pf)+.012, pf))
guide_parts = [sinai_thick_sheet('boundary-modern-teal-guide-ribbon', upper, 5,
                                sinai_guide_mat, .006)]
for x in [-.646, .646]:
    f = .085-.038*cos(x*pi/1.2); h = sinai_map_height(x, f)+.016
    # Flat modern end tabs underline that this is a diagram overlay, not posts.
    tab = box_surface('boundary-modern-flat-end-tab', (x, h, f),
                       (.051, .008, .051), sinai_guide_mat, .002)
    tab.rotation_euler.z = pi/4
    guide_parts.append(tab)
parent_parts('sinai-boundary-guide', guide_parts)

camp_parts = []
for i, (x, f) in enumerate([(-.439, .350), (-.164, .382), (.146, .338), (.435, .390)]):
    camp_parts += sinai_schematic_tent('boundary-equal-schematic-camp-shelter-'+str(i+1),
                                      x, f, sinai_tent_mat)
parent_parts('sinai-boundary-distant-schematic-camp', camp_parts)
finish_static(sinai_boundary_scene, 'sinai-boundary', .632)
report['assets']['sinai-boundary']['interpretation'] = (
    'Exodus 19–20 original mountain-foot-distant-camp space diagram; invented '
    'terrain, shelter count and distances are teaching choices, not a named '
    'mountain, surveyed camp, ancient fence, monastery or volcanic explanation')
report['assets']['sinai-boundary']['removable_group'] = 'sinai-boundary-guide'
report['assets']['sinai-boundary']['guide_is_modern_teaching_layer'] = True
