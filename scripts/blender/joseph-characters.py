"""Original Joseph narrative teaching residents. Egyptian waist wraps and
work divisions are comparisons with funerary models, not proof of a dynasty,
ethnicity, named person's face, surviving uniform or dress pattern.
"""
caravan_cloth=material('caravan-chosen-ochre-woven-cloth',(.38,.31,.205),.99)
caravan_wrap=material('caravan-chosen-shoulder-cloth',(.27,.245,.205),.99)
grain_linen=material('egypt-grain-worker-plain-linen-wrap',(.66,.62,.52),.99)
house_linen=material('egypt-householder-chosen-long-linen',(.57,.54,.45),.99)

caravan_scene,caravan_rig=clone_character(worker_scene,'Caravan traveler — composite road observer, not Joseph likeness')
remove_clothing(caravan_scene);weighted_garment(caravan_cloth,.43);sash(caravan_wrap)
vs=[];fs=[];ws=[]
for j in range(29):
    t=j/28;h=.83+t*.55
    for i in range(21):
        u=-1+i/10;x=u*(.18+.02*t);f=-.156-.007*cos(u*3*pi+t)
        vs.append(xyz(x,h,f));ws.append(cloth_weights(x,h,f))
        if i and j:fs.append(((j-1)*21+i-1,(j-1)*21+i,j*21+i,j*21+i-1))
mesh('caravan-folded-back-cover',vs,fs,caravan_wrap,ws,.04)
continuous_return_arms(caravan_scene)
finish_type(caravan_scene,caravan_rig,'caravan-traveler','caravan-traveler.glb',1.71)

def remove_labor_wrap(target):
    for obj in list(target.objects):
        if obj.type=='MESH' and obj.data.materials[0]==labor_cloth:
            bpy.data.objects.remove(obj,do_unlink=True)

# The labour base has actual continuous shoulder/arm skin, already smoothly
# weighted through the elbows. Merely removing a tunic would leave an empty torso.
grain_worker_scene,grain_worker_rig=clone_character(labor_scene,'Egyptian grain worker — plain waist wrap and continuous anatomy')
remove_labor_wrap(grain_worker_scene)
rings('grain-worker-waist-wrapped-linen',refine_profile([(.47,.239,.157,0),(.49,.240,.157,0),(.61,.226,.148,0),(.78,.207,.135,0),(.93,.177,.12,0),(.99,.170,.115,0)]),grain_linen,80,.0065,cloth_weights)
sash(grain_linen)
# An overlapping front flap has its own folded cloth surface; no royal symbols.
vs=[];fs=[];ws=[]
for j in range(25):
    t=j/24;h=.49+t*.49
    for i in range(17):
        u=-1+i/8;x=u*(.135-.025*t);f=.159-.035*t+.006*sin(u*3*pi)*(1-t)
        vs.append(xyz(x,h,f));ws.append(cloth_weights(x,h,f))
        if i and j:fs.append(((j-1)*17+i-1,(j-1)*17+i,j*17+i,j*17+i-1))
mesh('grain-worker-overlapping-wrap-fold',vs,fs,grain_linen,ws,.04)
finish_type(grain_worker_scene,grain_worker_rig,'egypt-grain-worker','egypt-grain-worker.glb',1.71,activity='labor')

householder_scene,householder_rig=clone_character(labor_scene,'Egyptian householder — original long garment and shoulder straps')
remove_labor_wrap(householder_scene);reshape_character(householder_scene,householder_rig,woman_point)
profile=[(.18,.257,.18,0),(.20,.257,.18,0),(.43,.248,.167,0),(.65,.227,.148,0),(.81,.205,.134,0),(.97,.174,.119,0),(1.08,.190,.129,0),(1.20,.212,.132,0),(1.27,.216,.129,0)]
dress=rings('householder-long-linen-body',refine_profile(profile),house_linen,80,.006,cloth_weights)
for v in dress.data.vertices:v.co=woman_point(v.co)
# Two broad ribbons travel continuously over the shoulders, not tube necklaces.
for sign in [-1,1]:
    vs=[];fs=[];ws=[]
    for j in range(33):
        t=j/32;f=.133*cos(t*pi);h=1.255+.135*sin(t*pi)
        for i in range(7):
            x=sign*.14+(i/6-.5)*.055
            vs.append(tuple(woman_point(Vector(xyz(x,h,f)))));ws.append({'spine':1})
            if i and j:fs.append(((j-1)*7+i-1,(j-1)*7+i,j*7+i,j*7+i-1))
    obj=mesh('householder-broad-shoulder-strap',vs,fs,house_linen,ws,.02)
    mod=obj.modifiers.new('linen-thickness','SOLIDIFY');mod.thickness=.002;bpy.context.view_layer.objects.active=obj;bpy.ops.object.modifier_apply(modifier=mod.name)
before=set(householder_scene.objects)
for side in [-1,1]:
    for j in range(5):
        x=side*(.067+j*.003)
        tube('householder-chosen-side-hair',[(x,1.63,-.005),(x*1.12,1.58,-.02),(x*1.1,1.51,-.045)],[.009,.011,.008],hair,'head',12)
ellipsoid('householder-back-hair',(0,1.575,-.10),(.067,.068,.025),hair,'head',32,16)
for obj in set(householder_scene.objects)-before:
    for v in obj.data.vertices:v.co=woman_point(v.co)
finish_type(householder_scene,householder_rig,'egypt-householder','egypt-householder.glb',1.65)
