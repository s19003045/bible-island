"""Original modern Samaria teaching assets. This file never imports/runs the full builder.
Uses existing original helpers from an isolated runner or the authorised main builder.
Default prototype_only=True; SAMARIA_OFFICIAL_BUILD affects only these three reports.
Selected functional comparisons,not museum copies or identified Gospel objects.
Only one modern front-section translation; no road/care runtime operations.
"""
sam_base=material('samaria-modern-neutral-display',(.322,.369,.354),.96)
sam_clay=material('samaria-original-matte-water-jar',(.436,.261,.148),.97)
sam_earth=material('samaria-original-selected-slope-earth',(.400,.323,.224),1)
sam_marker=material('samaria-modern-neutral-reading-marker',(.265,.343,.338),.96)
sam_pot1=material('samaria-original-ordinary-small-container',(.489,.322,.195),.99)
sam_pot2=material('samaria-original-ordinary-tall-container',(.392,.252,.151),.99)
sam_tray=material('samaria-modern-true-bottom-tray',(.392,.423,.374),.96)
sam_disc=material('samaria-modern-uninscribed-neutral-metal',(.498,.494,.451),.6,.62)
sam_cloth=material('samaria-original-folded-cloth-comparison',(.484,.447,.349),1)

def sam_bezier(p0,p1,p2,p3,steps):
    out=[]
    for i in range(steps+1):
        t=i/steps;u=1-t
        p=tuple(u*u*u*p0[k]+3*u*u*t*p1[k]+3*u*t*t*p2[k]+t*t*t*p3[k] for k in range(2))
        d=tuple(3*u*u*(p1[k]-p0[k])+6*u*t*(p2[k]-p1[k])+3*t*t*(p3[k]-p2[k]) for k in range(2))
        l=math.hypot(*d);out.append((p,(-d[1]/l,d[0]/l)))
    return out

def sam_mesh(name,vs,fs,mat,variation=.06,smooth=True):
    o=mesh(name,vs,fs,mat,variation=variation)
    for p in o.data.polygons:p.use_smooth=smooth
    return o

def sam_lathe(name,profile,mat,cx=0,cz=0,start=0,end=2*pi,steps=72):
    # Profile follows outer bottom-axis -> exterior -> rim -> interior -> floor-axis.
    # Poles are single vertices,not degenerate coincident rings. Half cut caps
    # enclose only the material section,never the empty cavity.
    vs=[];loops=[];fs=[]
    full=abs(end-start-2*pi)<1e-6;n=steps if full else steps+1
    for r,h in profile:
        if abs(r)<1e-10:loops.append([len(vs)]);vs.append(xyz(cx,h,cz));continue
        loop=[]
        for k in range(n):
            a=start+(end-start)*k/steps;f=r*sin(a)
            if not full and k in [0,steps]:f=0
            loop.append(len(vs));vs.append(xyz(cx+r*cos(a),h,cz+f))
        loops.append(loop)
    for j in range(len(profile)-1):
        a,b=loops[j],loops[j+1]
        for k in range(steps):
            kk=(k+1)%n
            if len(a)==1 and len(b)==1:continue
            if len(a)==1:fs.append((a[0],b[k],b[kk]))
            elif len(b)==1:fs.append((a[k],b[0],a[kk]))
            else:fs.append((a[k],b[k],b[kk],a[kk]))
    if not full:
        for k in [0,steps]:fs.append(tuple(loop[0] if len(loop)==1 else loop[k] for loop in loops))
    return sam_mesh(name,vs,fs,mat)

def sam_jar_profile():
    a=sam_bezier((.090,.025),(.120,.025),(.145,.085),(.145,.130),16)
    b=sam_bezier((.145,.130),(.145,.155),(.155,.180),(.155,.205),10)
    c=sam_bezier((.155,.205),(.155,.265),(.090,.280),(.090,.340),24)
    d=[((.090,.340+.045*i/6),(-1,0)) for i in range(1,7)]
    outer=a+b[1:]+c[1:]+d
    inner=[(p[0]+.012*n[0],p[1]+.012*n[1]) for p,n in b+c[1:]+d]
    heel=[p for p,n in sam_bezier((.075,.050),(.110,.050),(.133,.095),(.133,.130),16)]
    return [(0,.025)]+[p for p,n in outer]+list(reversed(inner))+list(reversed(heel[:-1]))+[(0,.050)]

def sam_finish(s,aid,meaning,layer=None):
    bpy.context.window.scene=s;bpy.context.view_layer.update();d=bpy.context.evaluated_depsgraph_get();d.update()
    ps=[o.evaluated_get(d).matrix_world@v.co for o in s.objects if o.type=='MESH' for v in o.evaluated_get(d).data.vertices];lo=[min(p[i] for p in ps) for i in range(3)];hi=[max(p[i] for p in ps) for i in range(3)]
    finish_static(s,aid,round(hi[2],6));report['assets'][aid].update({'prototype_only':not bool(globals().get('SAMARIA_OFFICIAL_BUILD',False)),'source_scene':s.name,'bottom_m':lo[2],'top_m':hi[2],
        'dimensions_blender_xyz_m':[hi[i]-lo[i] for i in range(3)],'interpretation':meaning,'semantic_groups':[o.name for o in s.objects if o.type=='EMPTY'],
        'modern_removable_layer':layer,'modern_layer_translation_gltf_xyz_m':[0,0,.16] if layer else None,'runtime_operations':1 if layer else 0,'units':'metres; BlenderZup / glTFYup'})
    assert abs(lo[2])<1e-6 and report['assets'][aid]['triangles']<=30000 and report['assets'][aid]['bytes']<=1600000

def sam_build_jar():
    s=new_scene('Samaria — original hollow jar and modern front section')
    parent_parts('samaria-jar-modern-base',[box_surface('jar-real-display-base',(0,.0125,0),(1.05,.025,.72),sam_base,0)])
    profile=sam_jar_profile();front=sam_lathe('jar-true-front-half',profile,sam_clay,cx=-.12,start=0,end=pi,steps=36)
    g=parent_parts('samaria-jar-modern-front-section',[front]);g['translation_gltf_xyz_m']=[0,0,.16];g['teaching_slide_m']=.16
    back=sam_lathe('jar-true-fixed-back-half',profile,sam_clay,cx=-.12,start=pi,end=2*pi,steps=36)
    outer=profile[1:58]
    def outer_radius(h):
        for (r0,h0),(r1,h1) in zip(outer,outer[1:]):
            if h0<=h<=h1:return r0+(r1-r0)*(h-h0)/(h1-h0)
        raise ValueError(h)
    low=-outer_radius(.145)+.002;high=-outer_radius(.295)+.002
    path=[p for p,n in sam_bezier((low,.145),(-.220,.145),(-.2375,.170),(-.2375,.215),28)]
    path += [p for p,n in sam_bezier((-.2375,.215),(-.2375,.270),(-.220,.295),(high,.295),28)][1:]
    handle=tube('jar-original-rear-grip-before-real-union',[(-.12,h,z) for z,h in path],[.0075]*len(path),sam_clay,sides=14)
    bpy.ops.object.select_all(action='DESELECT');back.select_set(True);bpy.context.view_layer.objects.active=back
    mod=back.modifiers.new('actual-exact-boolean-union-handle-roots','BOOLEAN');mod.operation='UNION';mod.solver='EXACT';mod.object=handle;bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(handle,do_unlink=True)
    # Boolean-created vertices receive original ceramic colour,not external image data.
    colours=back.data.color_attributes.get('surface')
    for i,v in enumerate(back.data.vertices):
        n=1+.055*sin(v.co.z*63+v.co.x*41)+.025*sin(v.co.z*251+v.co.y*67)
        colours.data[i].color=(*(max(0,min(1,c*n)) for c in sam_clay.diffuse_color[:3]),1)
    g=parent_parts('samaria-jar-fixed-back-and-united-handle',[back]);g['handle_root_heights_m']=[.145,.295];g['handle_tube_diameter_m']=.015;g['original_boolean_union']=True
    sam_finish(s,'samaria-jar','Original modern hollow water-container comparison with selected90mm feet and real rear grip. Not a museum copy,identified Gospel jar,capacity claim or ancient separable vessel. Front half slides on modern base; no breaking or magic water.','samaria-jar-modern-front-section')
    return s

# Road/care construction is added only after the first jar geometric result.
if 'samaria-jar' in globals().get('SAMARIA_BUILD_IDS',['samaria-jar','samaria-road','samaria-care']):sam_build_jar()

def sam_rr(w,d,r,n=12):
    ps=[]
    for x,z,a in [(w/2-r,d/2-r,0),(-w/2+r,d/2-r,pi/2),(-w/2+r,-d/2+r,pi),(w/2-r,-d/2+r,3*pi/2)]:
        for k in range(n+1):
            t=a+k*pi/(2*n);ps.append((x+r*cos(t),z+r*sin(t)))
    return ps

def sam_loft(name,loops,mat):
    n=len(loops[0]);vs=[xyz(*p) for loop in loops for p in loop];fs=[tuple(reversed(range(n)))]
    for j in range(len(loops)-1):
        for k in range(n):fs.append((j*n+k,j*n+(k+1)%n,(j+1)*n+(k+1)%n,(j+1)*n+k))
    fs.append(tuple((len(loops)-1)*n+k for k in range(n)))
    return sam_mesh(name,vs,fs,mat,smooth=False)

def sam_road_colours(o):
    # Material-only reading paths on the existing closed slope,no extra surface.
    branch=[p for p,n in sam_bezier((.20,.07*sin(.20*3.6)+.015),(.13,.025),(.08,-.070),(.020,-.160),48)]
    def segment_distance(x,z,a,b):
        dx=b[0]-a[0];dz=b[1]-a[1];t=max(0,min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)))
        return math.hypot(x-a[0]-t*dx,z-a[1]-t*dz)
    def smooth(v):
        v=max(0,min(1,v));return v*v*(3-2*v)
    colours=o.data.color_attributes.get('surface')
    soil=(.215,.252,.212);path=(.535,.370,.205)
    for i,v in enumerate(o.data.vertices):
        x,y,h=v.co;z=-y;line=.070*sin(x*3.6)+.015;derivative=.252*cos(x*3.6)
        distance=abs(z-line)/math.sqrt(1+derivative*derivative)
        main=1-smooth((distance-.047)/.026)
        bd=min(segment_distance(x,z,a,b) for a,b in zip(branch,branch[1:]))
        short=1-smooth((bd-.025)/.025)
        blend=max(main,short) if abs(h-(.190-.200*x))<1e-5 else 0
        grain=1+.020*sin(x*170+z*91)+.012*sin(x*59-z*117)
        rgb=[(soil[k]*(1-blend)+path[k]*blend)*grain for k in range(3)]
        colours.data[i].color=(*rgb,1)

def sam_build_road():
    s=new_scene('Samaria — original real slope and neutral reading positions')
    parent_parts('samaria-road-modern-base',[box_surface('road-flat-complete-support-base',(0,.0125,0),(1.10,.025,.720),sam_base,0)])
    nx,nz=40,24;vs=[];fs=[]
    for j in range(nz+1):
        f=-.36+.72*j/nz
        for i in range(nx+1):
            x=-.55+1.1*i/nx;vs.append(xyz(x,.190-.200*x,f))
    for j in range(nz):
        for i in range(nx):
            a=j*(nx+1)+i;fs.append((a,a+1,a+nx+2,a+nx+1))
    edge=list(range(nx+1))+[j*(nx+1)+nx for j in range(1,nz+1)]+[nz*(nx+1)+i for i in range(nx-1,-1,-1)]+[j*(nx+1) for j in range(nz-1,0,-1)]
    bottoms=[]
    for idx in edge:
        v=vs[idx];bottoms.append(len(vs));vs.append((v[0],v[1],.025))
    fs.append(tuple(reversed(bottoms)))
    for a,b,c,d in zip(edge,edge[1:]+edge[:1],bottoms,bottoms[1:]+bottoms[:1]):fs.append((a,b,d,c))
    o=sam_mesh('road-closed-solid-selected-slope',vs,fs,sam_earth,smooth=False)
    sam_road_colours(o)
    parent_parts('samaria-road-fixed-solid-slope',[o])
    for i,(x,f) in enumerate([(-.300,.180),(0,-.160),(.300,.020)]):
        o=sam_lathe('road-neutral-contact-marker-'+str(i+1),[(0,0),(.024,0),(.025,.001),(.025,.013),(.024,.014),(0,.014)],sam_marker,steps=72)
        o.rotation_euler.y=math.atan(.2);o.location=xyz(x,.190-.200*x,f)
        parent_parts('samaria-road-fixed-marker-'+str(i+1),[o])
    sam_finish(s,'samaria-road','Original modern solid11.309932degree slope with3same-colour neutral positions and material paths. Not an ancient map,measured Jericho road,people/ethnic tokens or rescue game. No removable layer.')
    return s

def sam_pot_profile(height,R,foot,mouth):
    top=.025+height;bh=.025+.45*height
    a=sam_bezier((foot,.025),(foot+.020,.025),(R,bh-.040),(R,bh),14)
    b=sam_bezier((R,bh),(R,bh+.040),(mouth+.010,top-.080),(mouth+.010,top-.040),18)
    d=[((mouth+.010,top-.040+.040*i/6),(-1,0)) for i in range(1,7)]
    outer=a+b[1:]+d;inner=[(p[0]+.010*n[0],p[1]+.010*n[1]) for p,n in b+d]
    heel=[p for p,n in sam_bezier((foot*.75,.039),(foot+.010,.039),(R-.010,bh-.040),(R-.010,bh),14)]
    return [(0,.025)]+[p for p,n in outer]+list(reversed(inner))+list(reversed(heel[:-1]))+[(0,.039)]

def sam_build_care():
    s=new_scene('Samaria — original ordinary care entrusted discs and continued responsibility')
    parent_parts('samaria-care-modern-base',[box_surface('care-real-support-base',(0,.0125,0),(1.10,.025,.750),sam_base,0)])
    loops=[]
    for w,d,r,h in [(.620,.330,.022,.025),(.620,.330,.022,.068),(.590,.300,.007,.068),(.590,.300,.007,.043)]:loops.append([(x,h,f+.170) for x,f in sam_rr(w,d,r)])
    parent_parts('samaria-care-fixed-real-bottom-tray',[sam_loft('care-real-continuous-hollow-tray',loops,sam_tray)])
    for i,x in enumerate([-.140,.140]):
        parent_parts('samaria-care-fixed-neutral-disc-'+str(i+1),[sam_lathe('care-original-neutral-thick-disc-'+str(i+1),[(0,.043),(.049,.043),(.050,.044),(.050,.052),(.049,.053),(0,.053)],sam_disc,cx=x,cz=.170,steps=80)])
    for label,x,h,R,foot,mouth,mat in [('small',-.350,.200,.065,.030,.024,sam_pot1),('tall',-.120,.235,.075,.035,.028,sam_pot2)]:
        parent_parts('samaria-care-fixed-'+label+'-empty-container',[sam_lathe('care-original-ordinary-empty-'+label,sam_pot_profile(h,R,foot,mouth),mat,cx=x,cz=-.185,steps=72)])
    loops=[]
    for h,w,d,r in [(.025,.280,.200,.012),(.028,.279,.200,.013),(.031,.262,.186,.017),(.034,.277,.198,.014),(.041,.278,.197,.014),(.044,.263,.186,.017),(.047,.275,.196,.014),(.057,.270,.194,.015),(.060,.254,.180,.018)]:
        loops.append([(.290+x,h,f-.185) for x,f in sam_rr(w,d,r)])
    o=sam_loft('care-original-thick-folded-cloth-envelope',loops,sam_cloth);col=o.data.color_attributes.get('surface')
    for i,v in enumerate(o.data.vertices):
        n=1+.025*sin(v.co.x*1400)+.025*sin(v.co.y*1200)+.035*sin(v.co.z*130)
        col.data[i].color=(*(min(1,c*n) for c in sam_cloth.diffuse_color[:3]),1)
    g=parent_parts('samaria-care-fixed-folded-cloth',[o]);g['folded_envelope_height_m']=.035;g['interpretation']='Selected closed folded-envelope volume with real side creases,not35mm single-layer cloth thickness or fibre simulation'
    sam_finish(s,'samaria-care','Original modern ordinary2empty ceramic containers,folded cloth envelope and2enlarged uninscribed neutral metal discs in a true-bottom tray. Selected functional forms,not Gospel vessels,original coins,medical treatment or a known inn plan. Payment does not define recovery or final return. No removable layer.')
    return s

if 'samaria-road' in globals().get('SAMARIA_BUILD_IDS',['samaria-jar','samaria-road','samaria-care']):sam_build_road()
if 'samaria-care' in globals().get('SAMARIA_BUILD_IDS',['samaria-jar','samaria-road','samaria-care']):sam_build_care()
