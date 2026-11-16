"""Three original Early Roman teaching comparisons, not identified biblical objects.
The ship is a deliberately small construction model, not a measured wreck replica.
"""
ship_wood=material('paul-ship-timber',(.245,.15,.073),.94)
ship_dark=material('paul-ship-rib-wood',(.145,.087,.041),.97)
ship_sail=material('paul-uninscribed-sail',(.62,.56,.42),.99)
ship_rope=material('paul-rigging-rope',(.30,.235,.145),.99)
purple_cloth=material('paul-purple-comparison',(.24,.10,.22),.99)
undyed_cloth=material('paul-undyed-comparison',(.49,.44,.33),.99)
work_silver=material('paul-silver-comparison',(.49,.48,.43),.35,.84)
work_iron=material('paul-tool-iron',(.105,.10,.087),.72,.62)

paul_ship_scene=new_scene('Paul — merchant hull, removable deck, cargo and square sail teaching model')
vs=[];fs=[];nx,nr=64,24
def ship_cross(x,theta,inner=False):
    t=x/.90;width=.29*max(.003,1-t*t)**.56
    base=.025+.115*abs(t)**4
    f=width*sin(theta)*( .94 if inner else 1)
    h=base+.29*(1-cos(theta))*(.96 if inner else 1)+(.015 if inner else 0)
    return xyz(x,h,f)
for inner in [False,True]:
    for i in range(nx+1):
        x=-.90+1.80*i/nx
        for j in range(nr+1):vs.append(ship_cross(x,-pi/2+pi*j/nr,inner))
count=(nx+1)*(nr+1)
for layer in range(2):
    for i in range(nx):
        for j in range(nr):
            q=layer*count+i*(nr+1)+j;face=(q,q+1,q+nr+2,q+nr+1);fs.append(face if layer else tuple(reversed(face)))
for i in range(nx):
    for j in [0,nr]:
        a=i*(nr+1)+j;b=(i+1)*(nr+1)+j;fs.append((a,b,b+count,a+count))
for i in [0,nx]:
    for j in range(nr):
        a=i*(nr+1)+j;fs.append((a,a+1,a+1+count,a+count))
mesh('continuous-outer-and-inner-hull',vs,fs,ship_wood,variation=.09)
for i in range(11):
    x=-.75+i*.15;pts=[]
    for j in range(25):
        v=Vector(ship_cross(x,-1.53+j*3.06/24,True));pts.append((v.x,v.z+.008,-v.y))
    tube('interior-frame-rib',pts,[.009]*len(pts),ship_dark,sides=8)
for theta in [-1.45,-1.05,-.65,.65,1.05,1.45]:
    pts=[]
    for i in range(65):
        v=Vector(ship_cross(-.9+1.8*i/64,theta));pts.append((v.x,v.z,-v.y))
    tube('longitudinal-plank-seam',pts,[.002]*len(pts),ship_dark,sides=5)
deck_parts=[]
for side in [-1,1]:
    for j in range(6):deck_parts.append(box_surface('removable-deck-plank',(-.50+j*.20,.303,side*.195),(.192,.015,.10),ship_wood,.002))
for x in [-.67,.67]:deck_parts.append(box_surface('removable-end-deck',(x,.34,0),(.18,.015,.25),ship_wood,.002))
parent_parts('paul-ship-deck',deck_parts)
tube('merchant-mast',[(0,.05,0),(0,1.12,0)],[.021,.010],ship_dark,sides=16)
tube('square-sail-yard',[(.01,1.02,-.51),(.01,1.02,.51)],[.012,.012],ship_dark,sides=12)
for x in [-.82,.82]:tube('standing-rigging',[(x,.34,0),(0,1.10,0)],[.003,.003],ship_rope,sides=6)
for side in [-1,1]:
    tube('sheet-line',[(.02,1.02,side*.50),(.09,.55,side*.47),(-.67,.35,side*.18)],[.0025]*3,ship_rope,sides=6)
    tube('quarter-steering-oar',[(-.63,.48,side*.20),(-.79,.23,side*.27),(-.88,.08,side*.31)],[.009,.011,.013],ship_dark,sides=10)
    box_surface('steering-blade',(-.88,.11,side*.31),(.09,.13,.018),ship_dark,.004)
vs=[];fs=[];nu,nv=48,32
for j in range(nv+1):
    v=j/nv
    for i in range(nu+1):
        u=i/nu;f=-.48+.96*u;h=.55+.46*v+.025*sin(pi*u)*(1-v);x=.02+.11*sin(pi*u)*sin(pi*v)
        vs.append(xyz(x,h,f))
        if i and j:fs.append(((j-1)*(nu+1)+i-1,(j-1)*(nu+1)+i,j*(nu+1)+i,j*(nu+1)+i-1))
sail=mesh('uninscribed-billowed-square-sail',vs,fs,ship_sail,variation=.025);mod=sail.modifiers.new('sail-two-sided-thickness','SOLIDIFY');mod.thickness=.001;bpy.context.view_layer.objects.active=sail;bpy.ops.object.modifier_apply(modifier=mod.name)
for x in [-.23,-.06,.11]:
    for f in [-.07,.07]:
        obj=pottery_profile('cargo-amphora-comparison',[(0,0),(.022,0),(.041,.04),(.038,.10),(.016,.14),(.019,.15),(.012,.15),(.010,.13),(.026,.095),(.027,.05),(0,.02)],clay,n=32,tool=False);obj.location=xyz(x,.09,f)
finish_static(paul_ship_scene,'paul-ship',1.12)
report['assets']['paul-ship']['interpretation']='Original comparative hull and rigging; no identified ship or wreck association'

paul_textiles_scene=new_scene('Paul — purple and undyed folded textile comparisons, not Lydia originals')
for layer,mat in [(0,undyed_cloth),(1,purple_cloth),(2,purple_cloth)]:
    vs=[];fs=[];nu,nv=80,32
    for j in range(nv+1):
        f=-.25+j*.5/nv
        for i in range(nu+1):
            u=i/nu;x=-.53+u*1.06;h=.012+layer*.025+.035*sin(u*3*pi)**2+.003*sin(f*74+x*81)
            vs.append(xyz(x,h,f))
            if i and j:fs.append(((j-1)*(nu+1)+i-1,(j-1)*(nu+1)+i,j*(nu+1)+i,j*(nu+1)+i-1))
    obj=mesh('folded-woven-panel',vs,fs,mat,variation=.045);mod=obj.modifiers.new('actual-cloth-thickness','SOLIDIFY');mod.thickness=.002;bpy.context.view_layer.objects.active=obj;bpy.ops.object.modifier_apply(modifier=mod.name)
    for f in [-.247,.247]:tube('cloth-selvedge',[(-.53+i*1.06/80,.012+layer*.025+.035*sin(i/80*3*pi)**2+.003*sin(f*74+(-.53+i*1.06/80)*81),f) for i in range(81)],[.0015]*81,mat,sides=5)
for x in [-.21,.21]:
    tube('wooden-thread-spindle',[(x,.008,.43),(x,.23,.43)],[.008,.008],ship_wood,sides=12)
    rings('wound-yarn',[(.045,.045,.045,0),(.065,.061,.061,0),(.16,.058,.058,0),(.18,.025,.025,0)],purple_cloth,64,folds=.001,center=(x,.43))
finish_static(paul_textiles_scene,'paul-textiles',.23)

paul_silver_scene=new_scene('Paul — metal workshop tools and unfinished shrine comparison, no identified originals')
pottery_profile('open-crucible',[(0,0),(.07,0),(.095,.02),(.11,.14),(.10,.17),(.079,.17),(.072,.045),(0,.035)],clay,n=64,tool=False).location=xyz(-.39,0,.13)
box_surface('hammer-head',(.05,.055,-.17),(.19,.08,.055),work_iron,.006)
tube('hammer-handle',[(.05,.05,-.17),(.05,.05,.31)],[.016,.012],ship_wood,sides=16)
for side in [-1,1]:tube('metalworking-tong',[(.28+side*.035,.025,-.22),(.29+side*.012,.025,.08),(.29+side*.053,.025,.27)],[.009,.009,.006],work_iron,sides=12)
box_surface('unfinished-small-shrine-base',(-.14,.025,-.34),(.25,.05,.18),work_silver,.004)
for x in [-.23,-.05]:tube('small-shrine-column',[(x,.05,-.30),(x,.23,-.30)],[.012,.012],work_silver,sides=16)
# A hollow opening and a triangular pediment: no invented cult-image likeness.
mesh('small-shrine-pediment',[xyz(-.27,.24,-.30),xyz(-.14,.34,-.30),xyz(-.01,.24,-.30),xyz(-.27,.24,-.36),xyz(-.14,.34,-.36),xyz(-.01,.24,-.36)],[(0,1,2),(3,5,4),(0,3,4,1),(1,4,5,2),(0,2,5,3)],work_silver)
finish_static(paul_silver_scene,'paul-silverwork',.34)
