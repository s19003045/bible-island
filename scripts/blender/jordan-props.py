"""Joshua 3–4 teaching objects: no excavated stones or mapped crossing claim."""
jordan_soil=material('jordan-sediment',(.34,.29,.20),1)
jordan_layer=material('jordan-alluvium-layer',(.23,.205,.16),1)
jordan_stone=material('jordan-unidentified-stone',(.37,.35,.29),1)
jordan_blue=material('jordan-blue-covering-cloth',(.065,.13,.19),.98)
jordan_wood=material('jordan-carrying-pole-wood',(.20,.12,.055),.95)

bed_scene=new_scene('Jordan — compressed bank and dry riverbed cross-section')
vs=[];fs=[];nx,nz=100,12
def bank_height(x):
    t=max(0,min(1,(abs(x)-.21)/.35))
    return .065+.23*t*t*(3-2*t)
for level in [0,1]:
    for j in range(nz+1):
        f=-.34+j*.68/nz
        for i in range(nx+1):
            x=-.77+i*1.54/nx;y=bank_height(x)+.004*sin(x*67+f*29) if not level else .008
            vs.append(xyz(x,y,f))
count=(nx+1)*(nz+1)
for level in [0,1]:
    for j in range(nz):
        for i in range(nx):
            a=level*count+j*(nx+1)+i;face=(a,a+1,a+nx+2,a+nx+1);fs.append(face if not level else tuple(reversed(face)))
perimeter=list(range(nx+1))+[j*(nx+1)+nx for j in range(1,nz+1)]+list(range(count-2,nz*(nx+1)-1,-1))+[j*(nx+1) for j in range(nz-1,0,-1)]
for a,b in zip(perimeter,perimeter[1:]+perimeter[:1]):fs.append((a,b,b+count,a+count))
mesh('closed-modern-valley-section',vs,fs,jordan_soil,variation=.08)
for side in [-1,1]:
    for line in range(3):
        pts=[]
        for i in range(101):
            x=-.767+i*1.534/100;h=.012+(bank_height(x)-.015)*(line+1)/4
            pts.append((x,h,side*.3403))
        tube('sedimentary-comparison-line',pts,[.0012]*len(pts),jordan_layer,sides=5)
finish_static(bed_scene,'jordan-bed',.300)
report['assets']['jordan-bed']['uniform_scale']=False

carrying_scene=new_scene('Jordan — covered carrying model, no opening or revealed sacred contents')
profile=refine_profile([(.002,.179,.289,0),(.018,.183,.293,0),(.12,.184,.294,0),(.27,.183,.292,0),(.335,.176,.285,0),(.354,.158,.263,0),(.363,.002,.003,0)])
vs=[];fs=[];n=96
for j,(h,rx,rf,off) in enumerate(profile):
    for k in range(n):
        a=k*2*pi/n;c=cos(a);s=sin(a);fold=.0025*sin(a*20+h*3)+.001*sin(a*37)
        x=(rx+fold)*(1 if c>=0 else -1)*abs(c)**.25;f=(rf+fold)*(1 if s>=0 else -1)*abs(s)**.25
        vs.append(xyz(x,h,f))
        if j:fs.append(((j-1)*n+k,(j-1)*n+(k+1)%n,j*n+(k+1)%n,j*n+k))
fs.append(tuple(reversed(range(n))));fs.append(tuple((len(profile)-1)*n+k for k in range(n)))
mesh('closed-blue-covering',vs,fs,jordan_blue,variation=.065)
for x in [-.215,.215]:
    tube('wooden-carrying-pole',[(x,.1325,-.83),(x,.1325,.83)],[.012,.012],jordan_wood,sides=20)
    for f in [-.22,.22]:
        # Rings are partly visible below the drape; precise fittings and cloth
        # arrangement are a declared teaching choice, never opened in the UI.
        pts=[(x,.1325+.021*cos(k*2*pi/32),f+.021*sin(k*2*pi/32)) for k in range(33)]
        tube('covered-fitting-ring',pts,[.003]*len(pts),gold,sides=8)
finish_static(carrying_scene,'jordan-carrying',.363)

stones_scene=new_scene('Jordan — twelve original distinct memorial teaching stones')
for i in range(12):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3,radius=1)
    stone=bpy.context.object;stone.name='original-memorial-stone-'+str(i+1)
    sx=.25+(i%3)*.018;sy=.22+(i%4)*.015;h=.36+(i%5)*.035
    for v in stone.data.vertices:
        x,y,z=v.co;irregular=1+.09*sin(x*7+y*5+i)+.06*sin(z*9-x*6+i*.4)
        v.co=(x*sx*irregular,y*sy*irregular,max(0,(z+1)*h*.5+.008*sin(x*19+y*14+i)))
    stone.location=xyz((i%4-1.5)*.66,0,(i//4-1)*.58)
    stone.data.materials.append(jordan_stone)
    color=stone.data.color_attributes.new(name='surface',type='FLOAT_COLOR',domain='POINT')
    for j,v in enumerate(stone.data.vertices):
        variation=1+(i%4-1.5)*.035+.07*sin(v.co.x*61+v.co.y*47+v.co.z*39)
        color.data[j].color=(*(c*variation for c in jordan_stone.diffuse_color[:3]),1)
    for p in stone.data.polygons:p.use_smooth=True
    parent_parts('memorial-stone-'+str(i+1),[stone])
finish_static(stones_scene,'jordan-stones',.500)
report['assets']['jordan-stones']['count']=12
report['assets']['jordan-stones']['use']='Gilgal narrative teaching group; not the separate in-river stones of Joshua 4:9'
