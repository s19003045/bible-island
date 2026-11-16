"""Original undated patriarchal narrative residents; no named likeness,
occupational uniform or claim that a recovered garment dates Genesis.
"""
patriarch_cloth=material('patriarch-chosen-earth-woven-cloth',(.38,.325,.245),.99)
patriarch_wrap=material('patriarch-chosen-dark-shoulder-wrap',(.245,.225,.185),.99)
host_cloth=material('camp-host-long-woven-cloth',(.39,.285,.215),.99)
host_cover=material('camp-host-pale-shoulder-cover',(.44,.40,.32),.99)
well_cloth=material('well-keeper-belted-cloth',(.30,.31,.255),.99)
well_beard=material('well-keeper-grey-brown-hair',(.145,.125,.095),.97)

patriarch_scene,patriarch_rig=clone_character(worker_scene,'Patriarchal narrative traveler — selected wrap, not Abram likeness')
remove_clothing(patriarch_scene);weighted_garment(patriarch_cloth,.31);sash(patriarch_wrap)
vs=[];fs=[];ws=[]
for j in range(25):
    t=j/24;h=.88+t*.48
    for i in range(17):
        u=-1+i/8;x=u*.205;f=-.155-.008*cos(u*pi*3+t)
        vs.append(xyz(x,h,f));ws.append(cloth_weights(x,h,f))
        if i and j:fs.append(((j-1)*17+i-1,(j-1)*17+i,j*17+i,j*17+i-1))
mesh('traveler-back-shoulder-wrap',vs,fs,patriarch_wrap,ws,.04)
# Individually weighted selvedge fringes on the rear overwrap, clear of the arms.
for i in range(17):
    x=-.16+i*.02
    tube('traveler-wrap-selvedge',[(x,.88,-.16),(x+.004,.86,-.169),(x-.002,.84,-.17)],[.0018,.0017,.001],patriarch_wrap,'spine',6)
continuous_return_arms(patriarch_scene)
finish_type(patriarch_scene,patriarch_rig,'patriarch-traveler','patriarch-traveler.glb',1.71)

camp_host_scene,camp_host_rig=clone_character(worker_scene,'Camp host — individual proportions, long garment and shoulder cover')
remove_clothing(camp_host_scene);reshape_character(camp_host_scene,camp_host_rig,woman_point)
weighted_garment(host_cloth,.18,point=woman_point);sash(host_cover,woman_point);head_shawl(host_cover,woman_point,short=True)
before=set(camp_host_scene.objects)
ellipsoid('host-gathered-hair',(0,1.57,-.119),(.052,.054,.04),hair,'head',32,16)
for obj in set(camp_host_scene.objects)-before:
    for v in obj.data.vertices:v.co=woman_point(v.co)
continuous_return_arms(camp_host_scene,woman_point)
finish_type(camp_host_scene,camp_host_rig,'camp-host','camp-host.glb',1.65)

well_keeper_scene,well_keeper_rig=clone_character(worker_scene,'Well keeper — new facial hair and practical belted garment')
remove_clothing(well_keeper_scene);weighted_garment(well_cloth,.48);sash(patriarch_wrap)
# Shaped front beard, not a sphere around the lower head.
vs=[];fs=[]
for j in range(21):
    t=j/20;h=1.429+t*.100;half=.014+.047*sin(t*pi/2)
    for i in range(33):
        u=-1+i/16;x=u*half;f=.072+.022*(1-u*u)+.002*sin(i*.8+j*.5)
        vs.append(xyz(x,h-(.013*(1-abs(u)/.48) if t>.7 and abs(u)<.48 else 0),f))
        if i and j:fs.append(((j-1)*33+i-1,(j-1)*33+i,j*33+i,j*33+i-1))
mesh('well-keeper-front-beard',vs,fs,well_beard,[{'head':1}]*len(vs),.06)
continuous_return_arms(well_keeper_scene)
finish_type(well_keeper_scene,well_keeper_rig,'well-keeper','well-keeper.glb',1.71)
