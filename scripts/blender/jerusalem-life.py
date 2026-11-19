"""Near-view Jerusalem life pilot. Owns ONLY new jerusalem-life outputs.

Blender 4.5 LTS. --geometry-only builds an isolated QA source for first review.
Recorded motion provenance is kept separately from authored role adaptations.
"""
import bpy, math, pathlib, json, hashlib, sys, runpy, statistics, functools, struct
from mathutils import Vector, Matrix, Quaternion
from mathutils.bvhtree import BVHTree
ROOT=pathlib.Path(__file__).resolve().parents[2]
SOURCE=ROOT/'assets/blender/jerusalem-pilot.blend'
OUT=ROOT/'public/models/jerusalem-life';META=ROOT/'assets/blender/jerusalem-life';QA=ROOT/'.qa/jerusalem-life'
P=runpy.run_path(str(ROOT/'scripts/blender/jerusalem-pilot.py'))
H=runpy.run_path(str(ROOT/'scripts/blender/human-motion-rollout.py'))
clamp=P['clamp'];smooth=P['smooth'];mix=P['mix'];rad=math.radians
reset=P['reset'];set_world=P['set_world'];parent_head=P['parent_head'];align=P['align'];leg_solve=P['leg_solve']
FPS=60
ROLE_IDS={'resident':'jerusalem-life-resident','carrier':'jerusalem-life-carrier','elder':'jerusalem-life-elder'}

def vec(v):return v if isinstance(v,Vector) else Vector(v)
def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def weights(w):
    w={k:v for k,v in w.items() if v>1e-7};w=dict(sorted(w.items(),key=lambda kv:-kv[1])[:4]);total=sum(w.values());return {k:v/total for k,v in w.items()}
def blend_weights(a,b,u):
    return weights({n:a.get(n,0)*(1-u)+b.get(n,0)*u for n in set(a)|set(b)})
def linear_sample(rows,u):
    u=clamp(u);x=u*(len(rows)-1);a=int(x);b=min(a+1,len(rows)-1);return vec(rows[a]).lerp(vec(rows[b]),x-a)

def fabric_images():
    """Portable packed image maps, not Blender-only procedural shaders."""
    import numpy as np
    folder=META/'materials';folder.mkdir(parents=True,exist_ok=True);N=512
    yy,xx=np.mgrid[0:N,0:N]/N;weft=np.sin(xx*math.tau*64);warp=np.sin(yy*math.tau*64)
    h=.5+.14*weft+.14*warp+.05*np.sin((xx+yy)*math.tau*17)
    shade=.95+.035*weft+.035*warp+.018*np.sin(xx*199+yy*373)
    gy,gx=np.gradient(h);normal=np.stack((-gx*1.8,-gy*1.8,np.ones_like(h)),axis=-1);normal/=np.linalg.norm(normal,axis=-1,keepdims=True)
    images={}
    for name,values in [('woven-colour',np.stack((shade,shade,shade,np.ones_like(h)),axis=-1)),('woven-normal',np.concatenate((normal*.5+.5,np.ones((N,N,1))),axis=-1))]:
        image=bpy.data.images.new(name,width=N,height=N,alpha=True);image.colorspace_settings.name='Non-Color' if 'normal' in name else 'sRGB';image.pixels.foreach_set(values.astype('float32').ravel());image.filepath_raw=str(folder/(name+'.png'));image.file_format='PNG';image.save();image.pack();images[name]=image
    return images

def tinted_fabric(image,colour,name):
    """Bake the source palette into a portable sRGB image, not shader math."""
    import numpy as np
    values=np.empty(len(image.pixels),dtype=np.float32);image.pixels.foreach_get(values);rgba=values.reshape((-1,4));rgb=rgba[:,:3];linear=np.where(rgb<=.04045,rgb/12.92,((rgb+.055)/1.055)**2.4);linear*=np.asarray(colour[:3]);rgb[:]=np.where(linear<=.0031308,linear*12.92,1.055*np.maximum(linear,0)**(1/2.4)-.055)
    out=bpy.data.images.new(name,width=image.size[0],height=image.size[1],alpha=True);out.colorspace_settings.name='sRGB';out.pixels.foreach_set(rgba.ravel());out.pack();return out


def make_material(name,colour,roughness=.65,fabric=None):
    mat=bpy.data.materials.new(name);mat.diffuse_color=(*colour[:3],1);mat.use_nodes=True;bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*colour[:3],1);bs.inputs['Roughness'].default_value=roughness
    if name.endswith('skin'):
        bs.inputs['Subsurface Weight'].default_value=.035;bs.inputs['Roughness'].default_value=.52;bs.inputs['Subsurface Radius'].default_value=(1,.45,.25)
    if fabric:
        nodes=mat.node_tree.nodes;links=mat.node_tree.links
        tex=nodes.new('ShaderNodeTexImage');tex.image=tinted_fabric(fabric['woven-colour'],colour,name+'-woven-colour');links.new(tex.outputs['Color'],bs.inputs['Base Color'])
        norm=nodes.new('ShaderNodeTexImage');norm.image=fabric['woven-normal'];nm=nodes.new('ShaderNodeNormalMap');nm.inputs['Strength'].default_value=.22;links.new(norm.outputs['Color'],nm.inputs['Color']);links.new(nm.outputs[0],bs.inputs['Normal'])
    else:
        attr=mat.node_tree.nodes.new('ShaderNodeVertexColor');attr.layer_name='surface';mat.node_tree.links.new(attr.outputs['Color'],bs.inputs['Base Color'])
    return mat

class Surface:
    def __init__(self,name,mat):self.name=name;self.mat=mat;self.v=[];self.f=[];self.w=[];self.uv=[]
    def vertex(self,p,w,uv=(0,0)):
        self.v.append(tuple(p));self.w.append(weights(w));self.uv.append(uv);return len(self.v)-1
    def face(self,ids):self.f.append(tuple(ids))
    def rings(self,rows,weight_fn,uv_fn=None,closed=True):
        base=len(self.v);segments=len(rows[0])
        for j,row in enumerate(rows):
            for i,p in enumerate(row):self.vertex(p,weight_fn(j,i,p),uv_fn(j,i,p) if uv_fn else (i/segments,j/max(1,len(rows)-1)))
        for j in range(len(rows)-1):
            for i in range(segments if closed else segments-1):self.face((base+j*segments+i,base+j*segments+(i+1)%segments,base+(j+1)*segments+(i+1)%segments,base+(j+1)*segments+i))
    def object(self,scene,rig):
        mesh=bpy.data.meshes.new(self.name);mesh.from_pydata(self.v,[],self.f);mesh.update();o=bpy.data.objects.new(self.name,mesh);scene.collection.objects.link(o);mesh.materials.append(self.mat)
        groups={}
        for i,w in enumerate(self.w):
            for n,a in w.items():
                if n not in groups:groups[n]=o.vertex_groups.new(name=n)
                groups[n].add([i],a,'REPLACE')
        uv=mesh.uv_layers.new(name='UVMap')
        for p in mesh.polygons:
            p.use_smooth=True
            for li in p.loop_indices:uv.data[li].uv=self.uv[mesh.loops[li].vertex_index]
        col=mesh.color_attributes.new(name='surface',type='FLOAT_COLOR',domain='POINT');base=self.mat.diffuse_color
        for i,e in enumerate(col.data):
            p=self.v[i];noise=1+.014*math.sin(p[0]*281+p[1]*177+p[2]*391);e.color=tuple(clamp(base[k]*noise,0,1) for k in range(3))+(1,)
        mod=o.modifiers.new('life-skin','ARMATURE');mod.object=rig;o.parent=rig;return o


def tube(surface,path,radii,wfn,segments=16,flat=1,cap=True,frameX=None):
    rows=[];lastX=None
    for j,p in enumerate(path):
        p=vec(p);axis=(vec(path[min(j+1,len(path)-1)])-vec(path[max(0,j-1)])).normalized();ref=vec(frameX) if frameX is not None else Vector((1,0,0))
        if abs(axis.dot(ref))>.92:ref=Vector((0,1,0))
        X=(ref-axis*ref.dot(axis)).normalized();Y=axis.cross(X).normalized()
        if lastX is not None and X.dot(lastX)<0:X=-X;Y=-Y
        lastX=X;rx,ry=radii[j] if isinstance(radii[j],tuple) else (radii[j],radii[j]*flat)
        rows.append([p+X*(rx*math.cos(math.tau*i/segments))+Y*(ry*math.sin(math.tau*i/segments)) for i in range(segments)])
    start=len(surface.v);surface.rings(rows,lambda j,i,p:wfn(j,p))
    if cap:
        ends=cap if isinstance(cap,tuple) else (True,True)
        if ends[0]:surface.face(tuple(start+i for i in range(segments-1,-1,-1)))
        if ends[1]:surface.face(tuple(start+(len(path)-1)*segments+i for i in range(segments)))

def ellipse(surface,center,scale,bone,segments=32,rows=18):
    c=vec(center);r=vec(scale);rings=[]
    for j in range(rows+1):
        phi=math.pi*(j+.001)/(rows+.002);rings.append([c+Vector((r.x*math.sin(phi)*math.cos(math.tau*i/segments),r.y*math.sin(phi)*math.sin(math.tau*i/segments),r.z*math.cos(phi))) for i in range(segments)])
    surface.rings(rings,lambda j,i,p:{bone:1})

def torso_weights(z):
    if z<1.00:return {'hips':1}
    if z<1.17:return blend_weights({'spine':1},{'spineUpper':1},smooth((z-1.06)/.13))
    return blend_weights({'spineUpper':1},{'chest':1},smooth((z-1.19)/.13))


def update_rig(rig,role):
    bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT');b=rig.data.edit_bones
    def put(name,h,t,parent):
        e=b.get(name) or b.new(name);e.head=h;e.tail=t;e.parent=b[parent];return e
    # Correct the source mannequin rest pose, including the first paused frame.
    # Free upper arms fall close to the torso; wrists slightly adduct. Palm roll
    # is anatomical rest orientation, not a transient animation-only correction.
    for side,sign in [('L',-1),('R',1)]:
        if role=='carrier' and side=='R':
            A=b['armR'].head.copy();W=Vector((.30,-.16,1.005));l1=b['armL'].length;l2=b['forearmL'].length;D=W-A;length=D.length;axis=D.normalized();pole=Vector((-.1,1,-.15));pole=(pole-axis*pole.dot(axis)).normalized();along=(l1*l1-l2*l2+length*length)/(2*length);E=A+axis*along+pole*math.sqrt(max(0,l1*l1-along*along));b['armR'].tail=E;b['forearmR'].head=E;b['forearmR'].tail=W;b['handR'].head=W;direction=(W-E).normalized();b['handR'].tail=W+direction*.11;palm=Vector((0,direction.z,-direction.y));palm=-palm if palm.z>0 else palm;b['handR'].align_roll(-palm)
        else:
            A=b['arm'+side].head.copy();l1=b['arm'+side].length;l2=b['forearm'+side].length;E=Vector((sign*.240,.008,A.z-math.sqrt(l1*l1-(.240-abs(A.x))**2-.008**2)));W=Vector((sign*.228,-.018,E.z-math.sqrt(l2*l2-.012**2-.026**2)));b['arm'+side].tail=E;b['forearm'+side].head=E;b['forearm'+side].tail=W;b['hand'+side].head=W;b['hand'+side].tail=W+Vector((0,-.005,-.110));palm=Matrix.Rotation(-sign*rad(80),3,'Z')@Vector((0,-1,0));b['hand'+side].align_roll(-palm)
        eye=(sign*.031,-.060,1.60);put('eye'+side,eye,(eye[0],-.075,eye[2]),'head');put('lid'+side,(eye[0],-.068,1.604),(eye[0],-.077,1.604),'head');put('lidLower'+side,(eye[0],-.068,1.597),(eye[0],-.077,1.597),'head');put('brow'+side,(sign*.033,-.065,1.618),(sign*.058,-.061,1.619),'head');put('lipCorner'+side,(sign*.019,-.060,1.538),(sign*.022,-.064,1.538),'head')
    put('jaw',(0,.008,1.552),(0,-.013,1.487),'head');paths={}
    for side,sign in [('L',-1),('R',1)]:
        wrist=b['hand'+side].head.copy();carrier=role=='carrier' and side=='R';paths[side]=[];D=(b['hand'+side].tail-b['hand'+side].head).normalized();roll=Matrix.Rotation(-sign*rad(80),3,'Z')
        for j,length in enumerate([.070,.080,.075,.058]):
            if carrier:
                study=json.loads((META/'review-grip-study.json').read_text());coords=[Vector(p) for p in study['digits'][j]['coordinates']]
            else:
                offset=Vector((-(j-1.5)*sign*.017,-.003,-.077+(.004 if j==3 else .001 if j==0 else 0)));base=wrist+roll@offset;curl=[.016,.020,.024,.027][j];spread=-sign*[-.003,0,.002,.005][j];coords=[base]
                for frac in [.43,.75,1.]:coords.append(base+roll@Vector((spread*frac,-curl*frac*frac,-length*frac)))
            for k,suffix in enumerate(['A','B','C']):put('finger'+side+str(j)+suffix,coords[k],coords[k+1],'hand'+side if k==0 else 'finger'+side+str(j)+['A','B'][k-1])
            paths[side].append(coords)
        if carrier:thumb=[wrist+Vector((-.021,-.010,-.023)),Vector((.290,-.208,.972)),Vector((.299,-.218,.949)),Vector((.308,-.224,.937))]
        else:thumb=[wrist+roll@v for v in [Vector((sign*.019,-.002,-.025)),Vector((sign*.036,-.003,-.046)),Vector((sign*.043,-.009,-.073)),Vector((sign*.037,-.017,-.091))]]
        for k,suffix in enumerate(['A','B','C']):put('thumb'+side+suffix,thumb[k],thumb[k+1],'hand'+side if k==0 else 'thumb'+side+['A','B'][k-1])
        paths[side].append(thumb);grip=Vector((.315,-.24,.943)) if carrier else wrist+D*.080-(b['hand'+side].matrix.to_3x3()@Vector((0,0,1)))*.013;put('handGrip'+side,grip,grip+Vector((0,-.015,0)),'hand'+side)
    put('propParcel',(0,-.45,.757),(0,-.45,.817),'root')
    for side,sign in [('L',-1),('R',1)]:put('parcelGrip'+side,(sign*.054,-.45,.772),(sign*.054,-.465,.772),'propParcel')
    if role=='carrier':
        put('propJug',(.24,-.24,.55),(.24,-.24,.61),'root');put('jugGripR',(.315,-.24,.943),(.315,-.255,.943),'propJug');put('propDipper',(-.20,-.40,.57),(-.20,-.40,.63),'root');put('dipperGripL',(-.25,-.40,.63),(-.265,-.40,.63),'propDipper');put('waterStream',(.28,-.40,.47),(.28,-.40,.50),'root')
    bpy.ops.object.mode_set(mode='OBJECT');rig.select_set(False);return paths



def make_head(scene,rig,mats,role):
    skin=Surface(role+'-face',mats['skin']);headrows=[]
    profiles=[(1.476,.027,.033),(1.489,.042,.043),(1.514,.061,.056),(1.545,.070,.066),(1.575,.075,.072),(1.610,.073,.076),(1.645,.074,.079),(1.674,.067,.069),(1.695,.049,.049),(1.707,.005,.006)]
    def prof(z,k):
        for i in range(len(profiles)-1):
            if profiles[i][0]<=z<=profiles[i+1][0]:
                u=(z-profiles[i][0])/(profiles[i+1][0]-profiles[i][0]);p0=profiles[max(0,i-1)][k];p1=profiles[i][k];p2=profiles[i+1][k];p3=profiles[min(len(profiles)-1,i+2)][k]
                return .5*((2*p1)+(-p0+p2)*u+(2*p0-5*p1+4*p2-p3)*u*u+(-p0+3*p1-3*p2+p3)*u*u*u)
        return profiles[-1][k]
    for j in range(51):
        z=mix(1.476,1.707,j/50);rx=prof(z,1);ry=prof(z,2);row=[]
        for i in range(72):
            a=math.tau*i/72;x=rx*math.cos(a);y=.008+ry*math.sin(a);front=max(0,-math.sin(a))**7
            cheek=.006*math.exp(-((abs(x)-.043)/.022)**2-((z-1.572)/.025)**2);socket=.006*math.exp(-((abs(x)-.031)/.017)**2-((z-1.600)/.010)**2);brow=.006*math.exp(-((abs(x)-.031)/.024)**2-((z-1.617)/.008)**2)
            nose=.027*math.exp(-(x/.014)**2-((z-1.573)/.013)**2)+.014*math.exp(-(x/.009)**2-((z-1.600)/.029)**2);muzzle=.004*math.exp(-(x/.027)**2-((z-1.540)/.018)**2)
            y-=front*(cheek-socket+brow+nose+muzzle);row.append(Vector((x,y,z)))
        headrows.append(row)
    def hw(j,i,p):return blend_weights({'head':1},{'jaw':1},.55*smooth((1.543-p.z)/.065))
    skin.rings(headrows,hw);skin.face(tuple(range(71,-1,-1)));skin.face(tuple(50*72+i for i in range(72)));skin.object(scene,rig)
    neck=Surface(role+'-neck-and-trapezius',mats['skin']);path=[(0,.016,z) for z in [1.33,1.37,1.40,1.43,1.47,1.49]];tube(neck,path,[(.071,.047),(.058,.044),(.046,.039),(.040,.035),(.038,.034),(.040,.036)],lambda j,p:blend_weights({'chest':1},{'neck':1},smooth((p.z-1.36)/.10)),segments=40);neck.object(scene,rig)
    ears=Surface(role+'-ears',mats['skin']);crease=Surface(role+'-face-creases',mats['crease'])
    for side,sign in [('L',-1),('R',1)]:
        ellipse(ears,(sign*.078,.009,1.579),(.013,.012,.026),'head',24,16)
        helix=[Vector((sign*(.083+.006*math.cos(a)),.010+.010*math.cos(a),1.579+.023*math.sin(a))) for a in [math.tau*i/40 for i in range(41)]];tube(ears,helix,[.0024]*len(helix),lambda j,p:{'head':1},10)
        inner=[(sign*.087,.003+math.cos(a)*.004,1.579+math.sin(a)*.012) for a in [math.tau*i/32 for i in range(33)]];tube(crease,inner,[.0007]*len(inner),lambda j,p:{'head':1},8)
    ears.object(scene,rig)
    whites=Surface(role+'-eyes',mats['eye-white']);irises=Surface(role+'-irises',mats['iris']);pupils=Surface(role+'-pupils',mats['pupil']);lids=Surface(role+'-eyelids',mats['skin']);brows=Surface(role+'-brows',mats['hair'])
    for side,sign in [('L',-1),('R',1)]:
        cx=sign*.031;cz=1.600;rows=[]
        for j in range(13):
            u=-1+2*j/12;row=[]
            for i in range(33):
                x=-.014+.028*i/32;arch=max(0,1-(x/.014)**2)**.65;z=cz+u*.0045*arch;row.append((cx+x,-.058-.011*arch-.001*(1-u*u)*arch,z))
            rows.append(row)
        whites.rings(rows,lambda j,i,p:{'eye'+side:1},closed=False)
        ellipse(irises,(cx,-.0708,cz),(.0045,.0007,.0045),'eye'+side,32,16);ellipse(pupils,(cx,-.0715,cz),(.0021,.0004,.0021),'eye'+side,24,12)
        for upper in [True,False]:
            path=[]
            for i in range(33):
                x=-.014+.028*i/32;arch=max(0,1-(x/.014)**2)**.65;path.append((cx+x,-.058-.0115*arch,cz+(.0049 if upper else -.0047)*arch))
            tube(lids,path,[.0015 if upper else .0012]*len(path),lambda j,p:{'lid'+side if upper else 'lidLower'+side:1},10)
        brow=[(cx+mix(-.020,.020,i/24),-.060-.008*math.sin(math.pi*i/24),1.617+.003*math.sin(math.pi*i/24)) for i in range(25)];tube(brows,brow,[.0012*(.6+.4*math.sin(math.pi*i/24)) for i in range(25)],lambda j,p:{'brow'+side:1},8)
        if role=='elder':
            for zoff in [.010,.015,.020]:
                path=[(mix(-.047,.047,i/28),-.0675-.004*math.sin(math.pi*i/28),1.617+zoff+.0015*math.sin(math.pi*i/28)) for i in range(29)];tube(crease,path,[.00028]*len(path),lambda j,p:{'head':1},6)
    for s in [whites,irises,pupils,lids,brows]:s.object(scene,rig)
    lips=Surface(role+'-lips',mats['lip']);mouth=Surface(role+'-mouth-line',mats['crease'])
    for upper in [True,False]:
        rows=[]
        for j in range(5):
            u=j/4;row=[]
            for i in range(49):
                x=mix(-.021,.021,i/48);a=x/.021;arch=max(0,1-a*a);edge=1.538+(.004-.0012*math.cos(a*math.pi*2) if upper else -.0040)*arch;z=mix(1.538,edge,u);y=-.056-.013*arch-.0020*math.sin(math.pi*u)*arch;row.append((x,y,z))
            rows.append(row)
        lips.rings(rows,lambda j,i,p:blend_weights({'jaw' if not upper else 'head':1},{'lipCorner'+('L' if p[0]<0 else 'R'):1},.35*smooth((abs(p[0])-.011)/.01)),closed=False)
    path=[(mix(-.020,.020,i/40),-.0695+.0135*(mix(-1,1,i/40)**2),1.538) for i in range(41)];tube(mouth,path,[.00048]*41,lambda j,p:{'head':1},8);lips.object(scene,rig);mouth.object(scene,rig)
    # Hair follows the anatomical crown rather than the old flat cap silhouette.
    hair=Surface(role+'-hair',mats['hair']);rows=[]
    for j in range(22):
        u=j/21;row=[]
        for i in range(72):
            a=math.tau*i/72;front=max(0,-math.sin(a));edge=1.625+.025*front+(.013*front if role=='elder' else 0);z=mix(edge,1.710,u);cap=1-smooth((z-1.708)/.002);width=(prof(min(z,1.707),1)+.0035)*cap;depth=(prof(min(z,1.707),2)+.0035)*cap;wave=.0006*math.sin(a*13+u*19)+.0003*math.sin(a*23-u*8);row.append((math.cos(a)*(width+wave),.008+math.sin(a)*(depth+wave),z))
        rows.append(row)
    hair.rings(rows,lambda j,i,p:{'head':1});hair.face(tuple(21*72+i for i in range(72)));hair.object(scene,rig)
    crease.object(scene,rig)


def make_hands_and_arms(scene,rig,mats,paths,role):
    skin=Surface(role+'-arms-and-hands',mats['skin']);nails=Surface(role+'-nails',mats['nail']);creases=Surface(role+'-hand-creases',mats['crease'])
    for side,sign in [('L',-1),('R',1)]:
        arm=rig.data.bones['arm'+side];fore=rig.data.bones['forearm'+side];hand=rig.data.bones['hand'+side];wrist=hand.head_local;carrier=role=='carrier' and side=='R';D=(hand.tail_local-hand.head_local).normalized();X=hand.matrix_local.to_3x3()@Vector((1,0,0));back=hand.matrix_local.to_3x3()@Vector((0,0,1));roll=Matrix.Rotation(-sign*rad(80),3,'Z')
        centers=[];radii=[]
        for i in range(41):
            u=i/40
            if u<.53:t=u/.53;p=arm.head_local.lerp(arm.tail_local,t);rx=mix(.050,.035,t)+.005*math.sin(math.pi*t);ry=mix(.042,.030,t)
            else:t=(u-.53)/.47;p=fore.head_local.lerp(fore.tail_local,t);rx=mix(.036,.022,t)+.004*math.sin(math.pi*t);ry=mix(.030,.019,t)
            centers.append(p);radii.append((rx,ry))
        # A single continuous forearm–palm loft removes the wrist seam.
        # Rounded palm contour, thenar pad and knuckle webbing replace a flat bar.
        palm=[];radii=[]
        profile=[(0,.022,.019),(.018,.027,.017),(.043,.035,.015),(.065,.035,.013),(.077,.030,.011),(.084,.021,.007)]
        for i in range(25):
            d=.084*i/24
            for k in range(len(profile)-1):
                if profile[k][0]<=d<=profile[k+1][0]:
                    u=smooth((d-profile[k][0])/(profile[k+1][0]-profile[k][0]));rx=mix(profile[k][1],profile[k+1][1],u);ry=mix(profile[k][2],profile[k+1][2],u);break
            palm.append(wrist+D*d);radii.append((rx,ry))
        arm_path=[];arm_radius=[]
        for i in range(41):
            u=i/40
            if u<.53:t=u/.53;p=arm.head_local.lerp(arm.tail_local,t);rx=mix(.047,.035,t)+.005*math.sin(math.pi*t);ry=mix(.040,.030,t)
            else:t=(u-.53)/.47;p=fore.head_local.lerp(fore.tail_local,t);rx=mix(.036,.022,t)+.004*math.sin(math.pi*t);ry=mix(.030,.019,t)
            if carrier and u<.53:
                q=u/.53;p+=(arm.tail_local-arm.head_local).normalized()*(.014*(1-q)**3);rx-=.010*(1-q)**3;ry-=.008*(1-q)**3
            arm_path.append(p);arm_radius.append((rx,ry))
        def arm_palm_weights(j,p):
            if j<36:return blend_weights({'arm'+side:1},{'forearm'+side:1},smooth((j/40-.43)/.20))
            return blend_weights({'forearm'+side:1},{'hand'+side:1},smooth((j-36)/8))
        tube(skin,arm_path+palm[1:],arm_radius+radii[1:],arm_palm_weights,32,cap=True,frameX=X)
        def oval(center,rx,ry,rz,bone):
            rows=[]
            for j in range(17):
                phi=math.pi*(j+.001)/16.002;rows.append([center+X*(rx*math.sin(phi)*math.cos(math.tau*i/24))+back*(ry*math.sin(phi)*math.sin(math.tau*i/24))+D*(rz*math.cos(phi)) for i in range(24)])
            skin.rings(rows,lambda j,i,p:{bone:1})
        # Thenar mound is a shallow inset, avoiding a detached oval bulge.
        oval(wrist+D*.045+X*((-1 if carrier else sign)*.016),.013,.008,.023,'hand'+side)
        for j,coords in enumerate(paths[side]):
            thumb=j==4;name=('thumb'+side) if thumb else ('finger'+side+str(j));r=.0088 if thumb else [.0076,.0078,.0073,.0062][j];path=[linear_sample(coords,i/30) for i in range(31)];radii=[r*(1-.28*i/30)+.0007*math.exp(-((i/30-.33)/.07)**2)+.00045*math.exp(-((i/30-.67)/.06)**2) for i in range(31)]
            def fw(k,p,name=name):
                q=k/30*3;index=min(2,int(q));u=smooth((q-index-.72)/.28);return blend_weights({name+['A','B','C'][index]:1},{name+['A','B','C'][min(2,index+1)]:1},u)
            tube(skin,path,radii,fw,20,frameX=X)
            tip=path[-4];axis=(path[-1]-path[-6]).normalized();normal=(back-axis*back.dot(axis)).normalized();across=axis.cross(normal).normalized();center=tip+normal*(r*.77);rows=[]
            for k in range(7):
                rho=.02+.98*k/6;rows.append([center+across*(rho*r*.61*math.cos(math.tau*i/32))+axis*(rho*.0055*math.sin(math.tau*i/32))+normal*(.0006*(1-rho*rho)) for i in range(32)])
            nails.rings(rows,lambda k,i,p:{name+'C':1});nails.face(tuple(range(len(nails.v)-7*32,len(nails.v)-6*32)))
            for frac in [.33,.67]:
                p=linear_sample(coords,frac);line=[p+X*(r*math.cos(a))-back*(r*.90) for a in [math.pi*.2+math.pi*.6*i/12 for i in range(13)]];tube(creases,line,[.00020]*len(line),lambda k,p,name=name,frac=frac:{name+('A' if frac<.5 else 'B'):1},6)
    skin.object(scene,rig);nails.object(scene,rig);creases.object(scene,rig)


def make_legs(scene,rig,mats,original_meshes):
    skin=Surface('life-legs',mats['skin'])
    for side in ['L','R']:
        thigh=rig.data.bones['thigh'+side];shin=rig.data.bones['shin'+side];path=[];radii=[]
        for i in range(35):
            u=i/34
            if u<.5:t=u*2;p=thigh.head_local.lerp(thigh.tail_local,t);r=mix(.065,.042,t)
            else:t=(u-.5)*2;p=shin.head_local.lerp(shin.tail_local,t);r=mix(.042,.025,t)+.011*math.sin(math.pi*t)**2
            path.append(p);radii.append((r,r*.88))
        tube(skin,path,radii,lambda j,p:blend_weights({'thigh'+side:1},{'shin'+side:1},smooth((j/34-.44)/.13)),24)
    skin.object(scene,rig)
    # Retain each role's real sandal/foot silhouette and its calibrated toe split.
    for o in original_meshes:
        if o.type!='MESH':continue
        mat=o.data.materials[0].name.split('.')[0] if o.data.materials else '';names={g.index:g.name for g in o.vertex_groups};ids={v.index for v in o.data.vertices if sum(g.weight for g in v.groups if names[g.group] in ['footL','footR','toeL','toeR'])>.999}
        faces=[p for p in o.data.polygons if all(i in ids for i in p.vertices)]
        if not faces:continue
        target=Surface('life-feet-'+mat,mats.get(mat,mats['skin']));mapping={}
        for p in faces:
            new=[]
            for i in p.vertices:
                if i not in mapping:mapping[i]=target.vertex(o.data.vertices[i].co,{names[g.group]:g.weight for g in o.data.vertices[i].groups})
                new.append(mapping[i])
            target.face(new)
        target.object(scene,rig)


def continuous_cloth(scene,rig,mats,role):
    """Deterministic implicit union joins torso/sleeves before 2mm shelling.

    Marching tetrahedra uses bundled NumPy only. No downloaded mesh or add-on.
    The volume is an authoring tool; exported material is an ordinary skinned mesh.
    """
    import numpy as np,bmesh
    step=.005;xs=np.arange(-.37,.375,step);ys=np.arange(-.16,.165,step);zs=np.arange(.455,1.405,step);X,Y,Z=np.meshgrid(xs,ys,zs,indexing='ij')
    width=.173+.020*(1-np.clip((Z-.65)/.35,0,1)**2*(3-2*np.clip((Z-.65)/.35,0,1)))-.030*np.exp(-((Z-.985)/.095)**2)+.020*np.exp(-((Z-1.25)/.17)**2);depth=.110-.018*np.exp(-((Z-.985)/.09)**2);a=np.arctan2(Y/depth,X/width)
    fold=(.0045*np.sin(a*12+.4*np.sin((Z-.47)*5))+.0025*np.sin(a*19-(Z-.47)*3))*(.4+.6*(1-np.exp(-((Z-.985)/.16)**2)))
    def smmin(a,b,k):
        h=np.maximum(k-np.abs(a-b),0)/k;return np.minimum(a,b)-h*h*k*.25
    def smmax(a,b,k):return -smmin(-a,-b,k)
    field=(np.sqrt((X/width)**2+(Y/depth)**2)-1)*.10-fold;field=smmax(field,Z-(1.385-.045*np.clip(abs(X)/.21,0,1)**1.8),.025);field=np.maximum(field,.47-Z-.004*np.sin(a*3+.4))
    armdefs={}
    for side in ['L','R']:
        bone=rig.data.bones['arm'+side];start=bone.head_local.copy();start.x*=.91;start.z-=.006;end=bone.head_local.lerp(bone.tail_local,.67);axis=(end-start).normalized();length=(end-start).length;armdefs[side]=(start,end,axis,length)
        dx=X-start.x;dy=Y-start.y;dz=Z-start.z;t=dx*axis.x+dy*axis.y+dz*axis.z;cx=dx-t*axis.x;cy=dy-t*axis.y;cz=dz-t*axis.z;radius=.063-.009*np.clip(t/length,0,1)
        arm=(np.sqrt(cx*cx+cy*cy+cz*cz)-radius);arm=smmax(arm,-t-.018,.012);arm=np.maximum(arm,t-length);field=smmin(field,arm,.022)
    # Neck opening. Inner authoring faces are removed after remeshing.
    neck=(np.sqrt((X/.053)**2+(Y/.047)**2)-1)*.047;neck=np.maximum(neck,1.320-Z);field=np.maximum(field,-neck)
    offsets=np.array([(0,0,0),(1,0,0),(1,1,0),(0,1,0),(0,0,1),(1,0,1),(1,1,1),(0,1,1)]);shape=np.array(field.shape)-1
    cv=[field[o[0]:o[0]+shape[0],o[1]:o[1]+shape[1],o[2]:o[2]+shape[2]] for o in offsets];out=[]
    for tet in [(0,5,1,6),(0,1,2,6),(0,2,3,6),(0,3,7,6),(0,7,4,6),(0,4,5,6)]:
        code=sum((cv[tet[k]]<0).astype(np.uint8)*(1<<k) for k in range(4))
        for mask in range(1,15):
            cell=np.array(np.nonzero(code==mask)).T
            if not len(cell):continue
            inside=[i for i in range(4) if mask&(1<<i)];outside=[i for i in range(4) if not mask&(1<<i)]
            def edge(i,j):
                ci,cj=tet[i],tet[j];A=cv[ci][tuple(cell.T)];B=cv[cj][tuple(cell.T)];u=A/(A-B);return (cell+offsets[ci]+(offsets[cj]-offsets[ci])*u[:,None])*step+np.array([xs[0],ys[0],zs[0]])
            if len(inside)==1:
                q=[edge(inside[0],j) for j in outside];out.append(np.stack(q,axis=1))
            elif len(inside)==3:
                q=[edge(outside[0],j) for j in inside];out.append(np.stack(q[::-1],axis=1))
            else:
                a,b=inside;c,d=outside;ac,ad,bc,bd=edge(a,c),edge(a,d),edge(b,c),edge(b,d);out.append(np.stack([ac,ad,bd],axis=1));out.append(np.stack([ac,bd,bc],axis=1))
    triangles=np.concatenate(out,axis=0);verts=triangles.reshape((-1,3));mesh=bpy.data.meshes.new('continuous-woven-tunic');mesh.from_pydata(verts.tolist(),[],[tuple(range(i,i+3)) for i in range(0,len(verts),3)]);mesh.update();bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00001);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
    obj=bpy.data.objects.new(role+'-continuous-woven-tunic',mesh);scene.collection.objects.link(obj);bpy.context.view_layer.objects.active=obj;obj.select_set(True)
    sm=obj.modifiers.new('relax-authoring-grid','SMOOTH');sm.factor=.55;sm.iterations=3;bpy.ops.object.modifier_apply(modifier=sm.name)
    dec=obj.modifiers.new('near-view-retopology','DECIMATE');dec.ratio=min(1,26000/max(1,len(mesh.polygons)));bpy.ops.object.modifier_apply(modifier=dec.name)
    bm=bmesh.new();bm.from_mesh(obj.data);remove=[]
    for face in bm.faces:
        p=face.calc_center_median();normal=face.normal
        if p.z<.478 or (p.z>1.318 and (p.x/.055)**2+(p.y/.049)**2<1.10):remove.append(face);continue
        for side,(start,end,axis,length) in armdefs.items():
            t=(p-start).dot(axis)
            if length-.006<t<length+.007 and (p-(start+axis*t)).length<.066:remove.append(face);break
    bmesh.ops.delete(bm,geom=list(set(remove)),context='FACES');bm.to_mesh(obj.data);bm.free();obj.select_set(False)
    # Transfer physically interpretable weights/UVs analytically after union.
    base=Surface(role+'-tunic-final',mats['tunic'])
    for v in obj.data.vertices:
        p=v.co;w=torso_weights(p.z)
        if p.z<.99:
            side='L' if p.x<0 else 'R';u=smooth((.995-p.z)/.10);w=blend_weights({'hips':1},{'thigh'+side:1},u)
        side='L' if p.x<0 else 'R';start,end,axis,length=armdefs[side];t=(p-start).dot(axis);distance=(p-(start+axis*t)).length;u=smooth((abs(p.x)-.125)/.060)*smooth((p.z-1.10)/.10)
        if distance<.10 and t>-.08:w=blend_weights(w,{'arm'+side:1},u)
        base.vertex(p,w,(math.atan2(p.y/.11,p.x/.18)/math.tau*25,p.z/.04))
    for f in obj.data.polygons:base.face(f.vertices)
    bpy.data.objects.remove(obj,do_unlink=True);final=base.object(scene,rig);solid=final.modifiers.new('woven-thickness-2mm','SOLIDIFY');solid.thickness=.002;solid.offset=0;bpy.context.view_layer.objects.active=final;final.select_set(True);bpy.ops.object.modifier_apply(modifier=solid.name);final.select_set(False);final['life_tunic_cap_revision']=2
    return final


def make_clothing(scene,rig,mats,role):
    continuous_cloth(scene,rig,mats,role)
    belt=Surface(role+'-belt',mats['leather']);rows=[]
    for z in [.970,.989]:rows.append([(.158*math.cos(math.tau*i/72),.100*math.sin(math.tau*i/72),z) for i in range(72)])
    belt.rings(rows,lambda j,i,p:{'hips':1});belt.object(scene,rig)
    if role=='resident':
        mantle=Surface('resident-wool-mantle',mats['mantle']);rows=[]
        for j in range(37):
            u=j/36;row=[]
            for i in range(41):
                v=i/40;x=mix(-.19,.19,v)*(1-.06*math.sin(math.pi*u));z=mix(.65+.025*math.sin(v*math.pi)+.025*v,1.36-.025*(abs(2*v-1)**1.5),u);y=.115+.008*(1-u)+.004*math.sin(v*math.pi*10)*(1-u*.7);row.append((x,y,z))
            rows.append(row)
        mantle.rings(rows,lambda j,i,p:blend_weights({'mantleTail':1},torso_weights(p[2]),smooth((p[2]-.95)/.35)),lambda j,i,p:(p[0]/.04,p[2]/.04),closed=False);o=mantle.object(scene,rig);solid=o.modifiers.new('wool-thickness-3mm','SOLIDIFY');solid.thickness=.003;solid.offset=0;bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.modifier_apply(modifier=solid.name);o.select_set(False)


def make_props(scene,rig,mats,role):
    if role=='carrier':
        jug=Surface('carrier-jug',mats['earthenware']);profiles=[(0,.044),(.012,.069),(.050,.097),(.12,.117),(.21,.110),(.275,.078),(.318,.043),(.360,.039),(.382,.047),(.390,.046)]
        rows=[]
        for z,r in profiles:rows.append([(.24+r*math.cos(math.tau*i/64),-.24+r*math.sin(math.tau*i/64),.55+z) for i in range(64)])
        for z,r in reversed(profiles[1:]):rows.append([(.24+(r-.006)*math.cos(math.tau*i/64),-.24+(r-.006)*math.sin(math.tau*i/64),.55+z) for i in range(64)])
        jug.rings(rows,lambda j,i,p:{'propJug':1},lambda j,i,p:(i/64,j/(len(rows)-1)));jug.face(tuple(range(63,-1,-1)));o=jug.object(scene,rig);o['prop_kind']='detachable-jug';o['attachment_bone']='propJug'
        handle=Surface('carrier-jug-handle',mats['earthenware']);path=[]
        for i in range(65):
            a=math.tau*i/64;path.append((.315+.070*math.cos(a),-.24,.55+.325+.068*math.sin(a)))
        tube(handle,path,[(.010,.010)]*len(path),lambda j,p:{'propJug':1},20,frameX=(0,1,0));o=handle.object(scene,rig);o['prop_kind']='detachable-jug';o['attachment_bone']='propJug'
        water=Surface('jug-water',mats['water']);center=water.vertex((.24,-.24,.55+.352),{'propJug':1})
        ring=[water.vertex((.24+.032*math.cos(math.tau*i/48),-.24+.032*math.sin(math.tau*i/48),.55+.352),{'propJug':1}) for i in range(48)]
        for i in range(48):water.face((center,ring[i],ring[(i+1)%48]))
        water.object(scene,rig)
        dipper=Surface('carrier-dipper',mats['earthenware']);rows=[]
        for z,r in [(-.01,.024),(0,.031),(.04,.036),(.08,.039),(.09,.041),(.09,.035),(.08,.033),(.01,.026)]:rows.append([(-.20+r*math.cos(math.tau*i/48),-.40+r*math.sin(math.tau*i/48),.57+z) for i in range(48)])
        dipper.rings(rows,lambda j,i,p:{'propDipper':1});dipper.face(tuple(range(47,-1,-1)))
        path=[(-.244-.023*math.cos(math.tau*i/48),-.40,.617+.026*math.sin(math.tau*i/48)) for i in range(49)];tube(dipper,path,[.0048]*49,lambda j,p:{'propDipper':1},12);o=dipper.object(scene,rig);o['work_only']=True;o['scene_prop_identity']='cistern-dipper';o['attachment_bone']='propDipper'
        stream=Surface('carrier-water-stream',mats['water']);tube(stream,[(.28,-.40,z) for z in [.50,.48,.46,.43,.40,.392]],[.0028,.0024,.0022,.0020,.0018,.0015],lambda j,p:{'waterStream':1},12);o=stream.object(scene,rig);o['work_only']=True;o['water_transfer']='dipper-to-jug'
    parcel=Surface('household-parcel' if role=='resident' else 'vendor-small-goods',mats['parcel']);ellipse(parcel,(0,-.45,.772),(.055,.035,.022),'propParcel',32,18);o=parcel.object(scene,rig);o['work_only']=True;o['attachment_bone']='propParcel'


def weight_shoulder_yoke(scene,rig):
    """Clavicle skinning in the actual upper chest, outside sleeve caps.

    Outer sleeves retain full humerus follow to avoid the earlier skin holes;
    this small medial yoke expresses captured shoulder-girdle lift directly.
    """
    for o in scene.objects:
        if o.type!='MESH' or not o.name.endswith('tunic-final') or o.get('life_shoulder_yoke'):continue
        names={g.index:g.name for g in o.vertex_groups}
        for v in o.data.vertices:
            p=v.co;gain=.16*smooth((abs(p.x)-.045)/.070)*(1-smooth((abs(p.x)-.150)/.030))*smooth((p.z-1.20)/.08)
            if gain<1e-6:continue
            w={names[g.group]:g.weight for g in v.groups};name='clavicle'+('L' if p.x<0 else 'R');w=blend_weights(w,{name:1},gain)
            for group in o.vertex_groups:group.remove([v.index])
            for name,value in w.items():
                group=o.vertex_groups.get(name) or o.vertex_groups.new(name=name);group.add([v.index],value,'REPLACE')
        o['life_shoulder_yoke']=True


def build_geometry(role):
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE));bpy.context.preferences.filepaths.save_version=0
    source=next(s for s in bpy.data.scenes if any(o.type=='ARMATURE' and o.name=='jerusalem-'+role+'-rig' for o in s.objects));scene,rig=P['clone_scene'](source,'Jerusalem life — '+role);bpy.context.window.scene=scene;rig.name=ROLE_IDS[role]+'-rig';reset(rig)
    originals=[o for o in scene.objects if o.type=='MESH'];palette={}
    for o in originals:
        for m in o.data.materials:palette[m.name.split('.')[0]]=list(m.diffuse_color)
    for s in list(bpy.data.scenes):
        if s!=scene:bpy.data.scenes.remove(s)
    for a in list(bpy.data.actions):bpy.data.actions.remove(a)
    fabric=fabric_images();mats={name:make_material('life-'+role+'-'+name,col,.88 if name in ['tunic','mantle'] else .66,fabric if name in ['tunic','mantle'] else None) for name,col in palette.items()}
    skincol=palette['skin'];mats['crease']=make_material('life-'+role+'-crease',[x*.58 for x in skincol]);mats['nail']=make_material('life-'+role+'-nail',[mix(x,.45,.10) for x in skincol],.64);mats['pupil']=make_material('life-'+role+'-pupil',[.004,.003,.002],.28);mats['seam']=make_material('life-'+role+'-seam',[x*.80 for x in palette['tunic']],.9);mats['parcel']=make_material('life-'+role+'-parcel',[.24,.18,.11],.9);mats['water']=make_material('life-'+role+'-water',[.075,.11,.105],.20)
    paths=update_rig(rig,role);make_head(scene,rig,mats,role);make_hands_and_arms(scene,rig,mats,paths,role);make_legs(scene,rig,mats,originals);make_clothing(scene,rig,mats,role);make_props(scene,rig,mats,role)
    for o in originals:bpy.data.objects.remove(o,do_unlink=True)
    weight_shoulder_yoke(scene,rig)
    rig['motion_version']=4;rig['role']=role;rig['base_model_id']='jerusalem-'+role;rig['authoring']='New near-view anatomy/wardrobe meshes; actual capture plus authored role adjustments'
    for _ in range(2):bpy.data.orphans_purge(do_local_ids=True,do_linked_ids=True,do_recursive=True)
    scene.render.fps=FPS;scene.unit_settings.system='METRIC';QA.mkdir(parents=True,exist_ok=True);path=QA/(role+'-geometry.blend');bpy.ops.wm.save_as_mainfile(filepath=str(path),compress=True);print('LIFE_GEOMETRY',role,len(rig.data.bones),sum(len(o.data.vertices) for o in scene.objects if o.type=='MESH'),path.stat().st_size,flush=True)
    return scene,rig


def main():
    META.mkdir(parents=True,exist_ok=True);OUT.mkdir(parents=True,exist_ok=True);QA.mkdir(parents=True,exist_ok=True)
    args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [];roles=args[args.index('--roles')+1].split(',') if '--roles' in args else list(ROLE_IDS)
    for role in roles:build_geometry(role)

if __name__=='__main__':main()
