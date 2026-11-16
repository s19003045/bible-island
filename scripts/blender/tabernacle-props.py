"""Called by build-assets.py inside Blender. Three original, inspectable craft assets.

Scripture governs materials/counts, not the exact reconstructed curves, dye tones,
loom support, gold cutaway, mortise shape or modern teaching model dimensions.
"""
import math

acacia=material('acacia-core',(.19,.099,.042),.9)
acacia_grain=material('acacia-grain',(.11,.054,.024),.94)
silver=material('cast-silver',(.56,.56,.53),.33,.88)
gold=material('gold-cover',(.63,.36,.082),.32,.88)
bronze=material('worked-bronze',(.37,.19,.075),.38,.82)
linen=material('fine-linen',(.63,.57,.43),.97)
dye_blue=material('blue-thread',(.075,.14,.19),.97)
dye_purple=material('purple-thread',(.14,.074,.14),.97)
dye_scarlet=material('scarlet-thread',(.30,.065,.043),.97)

def box_surface(name,center,size,mat,bevel=.003):
    bpy.ops.mesh.primitive_cube_add(size=1,location=xyz(*center))
    obj=bpy.context.object;obj.name=name
    obj.scale=(size[0],size[2],size[1])
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        mod=obj.modifiers.new('worked-edge','BEVEL');mod.width=bevel;mod.segments=3
        bpy.ops.object.modifier_apply(modifier=mod.name)
    obj.data.materials.append(mat)
    colors=obj.data.color_attributes.new(name='surface',type='FLOAT_COLOR',domain='POINT')
    for i,v in enumerate(obj.data.vertices):
        n=1+.035*sin(v.co.z*61+v.co.x*41)+.025*sin(v.co.x*251+v.co.y*67)
        colors.data[i].color=(*(min(1,c*n) for c in mat.diffuse_color[:3]),1)
    # Flat broad surfaces and rounded edges remain readable under oblique light.
    for p in obj.data.polygons:p.use_smooth=len(p.vertices)!=4
    return obj

def parent_parts(name,objects):
    parent=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(parent)
    for obj in objects:obj.parent=parent
    return parent

def finish_static(s,asset_id,height):
    # One mesh per material limits calls; named groups survive for articulation.
    bpy.context.window.scene=s
    groups={}
    for obj in list(s.objects):
        if obj.type=='MESH':groups.setdefault((obj.data.materials[0],obj.parent),[]).append(obj)
    for (mat,parent),objs in groups.items():
        bpy.ops.object.select_all(action='DESELECT')
        for obj in objs:obj.select_set(True)
        bpy.context.view_layer.objects.active=objs[0];bpy.ops.object.join()
        obj=bpy.context.object;obj.name=asset_id+'-'+mat.name
    export_asset(s,asset_id,asset_id+'.glb')
    report['assets'][asset_id]['height']=height
    report['assets'][asset_id]['teaching_model']=True

# A sample loom frame, deliberately not claimed as the actual tabernacle loom.
woven_scene=new_scene('Tabernacle — thread and interlaced cloth teaching sample')
for h in [.032,.708]:box_surface('sample-crossbar',(0,h,0),(.98,.047,.07),acacia)
for x in [-.467,.467]:box_surface('sample-upright',(x,.37,0),(.045,.70,.07),acacia)
for x in [-.37,.37]:box_surface('sample-foot',(x,.015,0),(.19,.03,.23),acacia)

nx,nz=40,26;x0,x1=-.419,.419;z0,z1=.073,.664
dx=(x1-x0)/(nx-1);dz=(z1-z0)/(nz-1)
colors=[linen,dye_blue,dye_purple,dye_scarlet]

def woven_ribbon(name,points,width,thick,mat,warp):
    vs=[];fs=[]
    for j,(x,z,f) in enumerate(points):
        # Thin elliptical-diamond section. The lifted crossings are geometry.
        for a in [0,pi/2,pi,3*pi/2]:
            w=cos(a)*width/2;d=sin(a)*thick/2
            vs.append(xyz(x+(w if warp else 0),z+(0 if warp else w),f+d))
        if j:
            for k in range(4):fs.append(((j-1)*4+k,(j-1)*4+(k+1)%4,j*4+(k+1)%4,j*4+k))
    fs.extend([tuple(reversed(range(4))),tuple((len(points)-1)*4+k for k in range(4))])
    return mesh(name,vs,fs,mat,variation=.05)

for i in range(nx):
    x=x0+i*dx
    pts=[]
    for q in range(nz*2-1):
        t=q/2;z=z0+t*dz;pts.append((x,z,.0045*cos(pi*(t+i))))
    woven_ribbon('warp-'+str(i),pts,.015,.005,colors[min(3,i//10)],True)
for j in range(nz):
    pts=[]
    for q in range(nx*2-1):
        t=q/2;x=x0+t*dx;pts.append((x,z0+j*dz,-.0045*cos(pi*(j+t))))
    woven_ribbon('weft-'+str(j),pts,.015,.005,linen,False)
# Loose dyed skeins rest on the frame foot and can be compared with woven cloth.
for i,mat in enumerate([dye_blue,dye_purple,dye_scarlet]):
    pts=[]
    for k in range(97):
        t=k/96*6*pi;pts.append((-.16+i*.16+.05*cos(t),.045+.013*sin(t),.084+.018*sin(t)))
    tube('loose-skein-'+str(i),pts,[.003]*len(pts),mat,sides=6)
finish_static(woven_scene,'woven-sample',.7315)

joint_scene=new_scene('Tabernacle — two tenons, two silver bases and gold cutaway')
boards=[]
boards.append(box_surface('wood-core',(0,.535,0),(.44,.61,.078),acacia,.004))
for x in [-.13,.13]:
    boards.append(box_surface('wood-tenon',(x,.175,0),(.074,.11,.063),acacia,.002))
    # Each base is an actual hollow mortise, constructed from a bottom and walls.
    # It is not a filled silver box with a dark patch pretending to be an opening.
    baseparts=[]
    baseparts.append(box_surface('socket-floor',(x,.025,0),(.237,.05,.25),silver,.004))
    for f in [-.079,.079]:baseparts.append(box_surface('socket-endwall',(x,.10,f),(.237,.10,.092),silver,.003))
    for side in [-1,1]:baseparts.append(box_surface('socket-sidewall',(x+side*.079,.10,0),(.079,.10,.066),silver,.003))
    parent_parts('socket-left' if x<0 else 'socket-right',baseparts)
# Partial surface gold exposes the core intentionally; this is a teaching cutaway.
boards.append(box_surface('gold-cutaway-front',(.081,.535,.043),(.272,.61,.006),gold,.001))
boards.append(box_surface('gold-edge',(.224,.535,0),(.006,.61,.084),gold,.001))
boards.append(box_surface('gold-top',(.081,.843,0),(.272,.006,.084),gold,.001))
for x in [-.201,-.176,-.145,-.11,-.075,-.043]:
    pts=[(x+.0018*sin(k*.8+x*130),.244+k*.0215,.0407) for k in range(28)]
    boards.append(tube('grain-line',pts,[.0007]*len(pts),acacia_grain,sides=4))
# A detached short bar illustrates the accompanying bars without claiming the
# original five-bar spacing or a physically established joinery reconstruction.
boards.append(box_surface('short-bar',(0,.602,-.059),(.59,.031,.030),gold,.002))
parent_parts('joint-board',boards)
finish_static(joint_scene,'board-joint',.846)

basin_scene=new_scene('Tabernacle — bronze laver and foot; silhouette is conjectural')
# One connected cross-section runs down the INNER wall and closes the bottom.
# No cattle, ornamental lily or dimension claim is borrowed from Solomon's sea.
basin_profile=[(0,0),(.225,0),(.245,.025),(.24,.072),(.155,.102),(.117,.142),(.102,.30),(.104,.55),(.118,.64),(.155,.684),(.25,.738),(.35,.855),(.425,1.02),(.465,1.18),(.48,1.215),(.482,1.232),(.471,1.24),(.451,1.235),(.442,1.218),(.435,1.18),(.399,1.025),(.325,.866),(.23,.762),(.135,.712),(0,.712)]
basin=pottery_profile('bronze-laver-connected-wall',basin_profile,bronze,n=128,tool=False)
for v in basin.data.vertices:
    x,y,z=v.co;r=math.hypot(x,y)
    if r>.12 and z>.72:
        d=.0007*sin(x*173+y*97+z*79)*sin(z*137)
        v.co.x*=1+d/r;v.co.y*=1+d/r
# Fine circumferential finishing traces remain subtle and uninscribed.
for h,r in [(.077,.233),(.655,.126),(1.205,.474)]:
    pts=[(r*cos(k*2*pi/96),h,r*sin(k*2*pi/96)) for k in range(97)]
    tube('bronze-finishing-trace',pts,[.0012]*97,bronze,sides=6)
finish_static(basin_scene,'tabernacle-basin',1.24)
