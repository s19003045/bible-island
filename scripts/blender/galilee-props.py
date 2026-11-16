"""Original modern Galilee comparisons, isolated prototype by default.
Requires existing helper functions, does not import/execute the whole builder.
The approved final GALILEE-ASSET-BRIEF supplies the selected modern dimensions.
No unseen ancient-boat image/technical diagram, SBF plan, ancient inscription,
identified Gospel boat/house/synagogue, patient, tools or original joinery copy.
"""
gal_base=material('galilee-modern-neutral-display',(.333,.365,.354),.96)
gal_wood=material('galilee-original-selected-shell-wood',(.324,.212,.110),.94)
gal_rib=material('galilee-original-selected-frame-wood',(.391,.284,.159),.95)
gal_keel=material('galilee-original-selected-keel-wood',(.245,.158,.083),.96)
gal_support=material('galilee-modern-visible-bearing-saddles',(.177,.295,.302),.95)
gal_plaster=material('galilee-original-earth-wall-comparison',(.534,.451,.337),.99)
gal_floor=material('galilee-original-floor-comparison',(.423,.348,.258),1)
gal_beam=material('galilee-original-selected-roof-beams',(.285,.183,.086),.97)
gal_cover=material('galilee-modern-supported-cover-comparison',(.479,.393,.263),.99)
gal_soil=material('galilee-modern-selected-soil-layer',(.357,.292,.196),1)
gal_fine=material('galilee-modern-fine-surface-layer',(.426,.372,.244),1)
gal_tray=material('galilee-modern-stone-comparison-trays',(.377,.400,.367),.96)
gal_dark=material('galilee-original-dark-stone-comparison',(.177,.184,.174),1)
gal_light=material('galilee-original-light-stone-comparison',(.607,.565,.463),1)


def gal_flat(o):
    for p in o.data.polygons:p.use_smooth=False
    return o


def gal_grain(o,mat,axis='X',bands=False):
    colours=o.data.color_attributes.get('surface')
    for i,v in enumerate(o.data.vertices):
        x,y,z=v.co;along=x if axis=='X' else y;across=y if axis=='X' else x
        n=1+.055*sin(across*435+z*47+sin(along*12)*.55)+.026*sin(across*1003+z*21)
        if bands:n*=1+.048*sin(math.floor((abs(y)+.00001)/.050)*2.3)
        colours.data[i].color=(*(max(0,min(1,c*n)) for c in mat.diffuse_color[:3]),1)
    return o


def gal_cross_prism(name,profile,x,width,mat):
    """Single closed extrusion of an actual possibly concave F/Y section."""
    n=len(profile);vs=[xyz(xx,h,f) for xx in [x-width/2,x+width/2] for f,h in profile]
    fs=[tuple(reversed(range(n))),tuple(range(n,2*n))]
    for k in range(n):fs.append((k,(k+1)%n,(k+1)%n+n,k+n))
    return gal_flat(mesh(name,vs,fs,mat,variation=.065))


def gal_curve(f):
    t=max(0,abs(f)-.080);h=.125+.325*(t/.220)**2
    slope=(1 if f>=0 else -1)*2*.325*t/(.220**2)
    norm=math.sqrt(1+slope*slope)
    return (f,h),(-slope/norm,1/norm)


def gal_offset(f,offset):
    p,n=gal_curve(f);return (p[0]+n[0]*offset,p[1]+n[1]*offset)


# The removable rib endpoint is an explicit shared knot of the hull mesh.
gal_rib_f=.080+.220*math.sqrt(.300/.325)
gal_positive=[.080*i/16 for i in range(17)]+[.080+(gal_rib_f-.080)*i/128 for i in range(1,129)]+[gal_rib_f+(.300-gal_rib_f)*i/16 for i in range(1,17)]
gal_fs=[-f for f in reversed(gal_positive[1:])]+gal_positive


def gal_wall(name,axis,c,lo,hi,bottom,top,sign):
    nx=max(3,round((hi-lo)/.035));nz=max(2,round((top-bottom)/.035));vs=[];fs=[]
    for side in [0,1]:
        for j in range(nz+1):
            h=bottom+(top-bottom)*j/nz
            for i in range(nx+1):
                p=lo+(hi-lo)*i/nx;relief=0
                if side and 0<i<nx and 0<j<nz:relief=.00045*(.6+.4*sin(i*1.7+j*.7))*sin(pi*i/nx)*sin(pi*j/nz)
                q=c+sign*((.5 if side else -.5)*.030+relief)
                vs.append(xyz(p,h,q) if axis=='X' else xyz(q,h,p))
    count=(nx+1)*(nz+1)
    for side in [0,1]:
        for j in range(nz):
            for i in range(nx):
                a=side*count+j*(nx+1)+i;face=(a,a+1,a+nx+2,a+nx+1);fs.append(face if side else tuple(reversed(face)))
    edge=list(range(nx+1))+[j*(nx+1)+nx for j in range(1,nz+1)]+[nz*(nx+1)+i for i in range(nx-1,-1,-1)]+[j*(nx+1) for j in range(nz-1,0,-1)]
    for a,b in zip(edge,edge[1:]+edge[:1]):fs.append((a,b,b+count,a+count))
    return gal_flat(mesh(name,vs,fs,gal_plaster,variation=.09))


def gal_roundrect(w,d,r,arc=12):
    points=[]
    for x,f,a in [(w/2-r,d/2-r,0),(-w/2+r,d/2-r,pi/2),(-w/2+r,-d/2+r,pi),(w/2-r,-d/2+r,3*pi/2)]:
        for k in range(arc+1):
            t=a+k*pi/(2*arc);points.append((x+r*cos(t),f+r*sin(t)))
    return points


def gal_tray_shell(name,cx):
    loops=[]
    for w,d,r,h in [(.440,.500,.020,.025),(.440,.500,.020,.070),(.408,.468,.004,.070),(.408,.468,.004,.041)]:
        loops.append([xyz(cx+x,h,f) for x,f in gal_roundrect(w,d,r)])
    n=len(loops[0]);vs=[v for loop in loops for v in loop];fs=[tuple(reversed(range(n)))]
    for j in range(3):
        for k in range(n):fs.append((j*n+k,j*n+(k+1)%n,(j+1)*n+(k+1)%n,(j+1)*n+k))
    fs.append(tuple(3*n+k for k in range(n)))
    return gal_flat(mesh(name,vs,fs,gal_tray,variation=.035))


def gal_stone(name,cx,mat,phase):
    loops=[]
    levels=[(.041,.280,.300,.025),(.045,.298,.327,.035),(.064,.310,.340,.041),(.105,.308,.337,.041),(.128,.294,.320,.037),(.131,.280,.300,.030)]
    for j,(h,w,d,r) in enumerate(levels):
        loop=[]
        for k,(x,f) in enumerate(gal_roundrect(w,d,r,arc=18)):
            a=math.atan2(f,x);rough=0 if j==0 else .00075*sin(7*a+phase)*sin(pi*j/(len(levels)-1))
            loop.append(xyz(cx+x+rough*cos(a),h,f+rough*sin(a)))
        loops.append(loop)
    n=len(loops[0]);vs=[v for loop in loops for v in loop];fs=[tuple(reversed(range(n)))]
    for j in range(len(loops)-1):
        for k in range(n):fs.append((j*n+k,j*n+(k+1)%n,(j+1)*n+(k+1)%n,(j+1)*n+k))
    fs.append(tuple((len(loops)-1)*n+k for k in range(n)))
    o=gal_flat(mesh(name,vs,fs,mat,variation=.13));o['solid_material_boundary']=True;o['interpretation']='Original ordinary solid comparison piece; colour does not date a building'
    return o


def gal_finish(s,aid,interpretation,layer=None,scale=1):
    bpy.context.window.scene=s;bpy.context.view_layer.update();d=bpy.context.evaluated_depsgraph_get();d.update()
    ps=[o.evaluated_get(d).matrix_world@v.co for o in s.objects if o.type=='MESH' for v in o.evaluated_get(d).data.vertices]
    lo=[min(p[i] for p in ps) for i in range(3)];hi=[max(p[i] for p in ps) for i in range(3)]
    finish_static(s,aid,round(hi[2],6))
    report['assets'][aid].update({'prototype_only':not bool(globals().get('GALILEE_OFFICIAL_BUILD',False)),
        'isolated_provenance':'Root approved final GALILEE-ASSET-BRIEF,2026-11-17 isolated original prototype',
        'source_scene':s.name,'bottom_m':lo[2],'top_m':hi[2],'dimensions_blender_xyz_m':[hi[i]-lo[i] for i in range(3)],
        'interpretation':interpretation,'semantic_groups':[o.name for o in s.objects if o.type=='EMPTY'],
        'modern_removable_layer':layer,'modern_layer_translation_gltf_xyz_m':[0,.18,0] if layer else None,
        'runtime_operations':1 if layer else 0,'selected_scale':scale,'units':'metres; Blender +Z / glTF +Y'})
    assert abs(lo[2])<1e-6 and hi[2]+(.18 if layer else 0)<=.8
    assert report['assets'][aid]['triangles']<=30000 and report['assets'][aid]['bytes']<=1600000


s=new_scene('Galilee — original outward U hull keel and curved frame comparison')
parent_parts('galilee-hull-modern-base',[box_surface('hull-neutral-thick-base',(0,.0125,0),(1.10,.025,.720),gal_base,.003)])
inner=[gal_curve(f)[0] for f in gal_fs];outer=[gal_offset(f,-.020) for f in gal_fs]
o=gal_cross_prism('hull-true-continuous-20mm-shell',inner+list(reversed(outer)),0,1.020,gal_wood);gal_grain(o,gal_wood,bands=True)
parent_parts('galilee-hull-fixed-continuous-shell',[o])
parent_parts('galilee-hull-fixed-keel',[gal_grain(box_surface('hull-ordinary-keel-comparison',(0,.080,0),(.960,.050,.040),gal_keel,0),gal_keel)])
# Shared polygonal contact knots, so curved saddles and frames have real
# coplanar bearing patches, rather than analytic curves separated by tessellation.
side=[p for p in outer if .022-1e-8<=p[0]<=.220]
side=[(.022,.105)]+[p for p in side if p[0]>.022+1e-8]
left=[(-f,h) for f,h in reversed(side)];top=left+[(-.022,.055),(.022,.055)]+side
profile=top+[(side[-1][0],.025),(-side[-1][0],.025)]
for i,x in enumerate([-.320,.320]):
    o=gal_cross_prism('hull-visible-modern-curved-bearing-'+str(i+1),profile,x,.060,gal_support)
    parent_parts('galilee-hull-modern-saddle-'+str(i+1),[o])
contact=[gal_curve(f)[0] for f in gal_fs if abs(f)<=gal_rib_f+1e-9]
inset=[gal_offset(f,.030) for f in gal_fs if abs(f)<=gal_rib_f+1e-9]
for label,x in [('fixed',-.280),('removable',0)]:
    o=gal_cross_prism('hull-original-whole-U-curved-frame-'+label,contact+list(reversed(inset)),x,.035,gal_rib);gal_grain(o,gal_rib)
    name='galilee-hull-modern-removable-frame' if label=='removable' else 'galilee-hull-fixed-curved-frame'
    g=parent_parts(name,[o])
    if label=='removable':g['teaching_lift_m']=.18;g['motion_gltf_xyz_m']=[0,.18,0]
gal_finish(s,'galilee-hull','Original modern partial outward U hull with true shell,keel and whole curved frames. Curves/material tones,dimensions and two visible modern saddles are selected comparisons,not an ancient boat copy or Gospel boat identification. No locked joinery,crew,sail,paddle,net or boat boarding.','galilee-hull-modern-removable-frame')

s=new_scene('Galilee — original one tenth right cutaway home and supported roof')
parent_parts('galilee-roof-modern-base',[box_surface('roof-neutral-thick-base',(0,.0125,0),(1.10,.025,.850),gal_base,.003)])
parent_parts('galilee-roof-fixed-floor',[box_surface('roof-real-inner-floor',(0,.0325,0),(.940,.015,.700),gal_floor,0)])
walls=[]
def gal_w(label,axis,c,lo,hi,bottom,top,sign):
    g=parent_parts('galilee-roof-fixed-wall-'+label,[gal_wall('roof-thick-'+label,axis,c,lo,hi,bottom,top,sign)]);walls.append(g)
gal_w('back','X',-.335,-.470,.470,.040,.360,-1)
gal_w('left','F',-.455,-.320,.320,.040,.360,-1)
gal_w('front-left-jamb','X',.335,-.470,-.055,.040,.245,1)
gal_w('front-right-jamb','X',.335,.055,.470,.040,.245,1)
gal_w('front-left-fill','X',.335,-.470,-.080,.245,.275,1)
gal_w('front-right-fill','X',.335,.080,.470,.245,.275,1)
gal_w('above-lintel','X',.335,-.470,.470,.275,.360,1)
parent_parts('galilee-roof-fixed-walls',walls)
parent_parts('galilee-roof-fixed-lintel',[gal_grain(box_surface('roof-true-door-lintel',(0,.260,.335),(.160,.030,.030),gal_beam,0),gal_beam)])
beams=[]
for i,x in enumerate([-.380,-.190,0,.190,.380]):
    o=gal_grain(box_surface('roof-real-front-back-beam-'+str(i+1),(x,.375,0),(.028,.030,.740),gal_beam,0),gal_beam,axis='F')
    beams.append(parent_parts('galilee-roof-beam-'+str(i+1),[o]))
cover=parent_parts('galilee-roof-thick-cover',[box_surface('roof-supported-10mm-cover',(0,.395,0),(.980,.010,.760),gal_cover,0)])
soil=parent_parts('galilee-roof-thick-soil',[box_surface('roof-selected-20mm-soil-comparison',(0,.410,0),(.980,.020,.760),gal_soil,0)])
fine=parent_parts('galilee-roof-thick-fine-surface',[box_surface('roof-selected-2mm-surface-comparison',(0,.421,0),(.980,.002,.760),gal_fine,0)])
g=parent_parts('galilee-roof-modern-cutaway-layer',beams+[cover,soil,fine]);g['teaching_lift_m']=.18;g['motion_gltf_xyz_m']=[0,.18,0]
gal_finish(s,'galilee-roof','Original modern selected1:10 house-access comparison,front/back bearing walls and open right section. Roof and all beams lift as a modern viewing layer,not an ancient hatch. Selected roof layers,door and dimensions not a measured Gospel house or universal village roof. No identified owner,arch,stairs,hoist,mat or patient.','galilee-roof-modern-cutaway-layer',.1)

s=new_scene('Galilee — side by side original solid stone and true tray comparison')
parent_parts('galilee-stones-modern-base',[box_surface('stones-neutral-thick-base',(0,.0125,0),(1.050,.025,.660),gal_base,.003)])
for label,cx,mat,phase in [('dark',-.255,gal_dark,.4),('light',.255,gal_light,1.2)]:
    parent_parts('galilee-stones-fixed-'+label+'-tray',[gal_tray_shell('stones-real-hollow-'+label+'-tray',cx)])
    parent_parts('galilee-stones-fixed-'+label+'-solid-piece',[gal_stone('stones-original-solid-'+label+'-piece',cx,mat,phase)])
gal_finish(s,'galilee-stones','Original modern ordinary dark/light solid stone pieces in separate true-bottom trays. Side by side,not stacked historical strata. Colour does not date construction. Not original synagogue samples,copy of later columns,ancient inscription or identified first-century synagogue. No removable runtime layer.')
