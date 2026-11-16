"""Early Roman composite residents. Newly authored garment meshes, independent
rigs and tracks. No claimed occupational uniform or named biblical likeness.
"""
port_tunic=material('port-worker-sturdy-tunic',(.31,.295,.25),.99)
port_band=material('port-worker-shoulder-band',(.25,.18,.11),.96)
trader_cloth=material('paul-trader-long-cloth',(.33,.285,.25),.99)
trader_wrap=material('paul-trader-shoulder-wrap',(.24,.23,.28),.99)
artisan_tunic=material('asian-artisan-tunic',(.37,.315,.235),.99)
artisan_apron=material('asian-artisan-work-apron',(.20,.135,.075),.96)

port_worker_scene,port_worker_rig=clone_character(worker_scene,'Port worker — short belted working tunic and shoulder band')
remove_clothing(port_worker_scene);weighted_garment(port_tunic,.51);sash(port_band)
continuous_return_arms(port_worker_scene)
# Diagonal shoulder reinforcement follows the torso, not a floating held prop.
vs=[];fs=[];ws=[]
for j in range(25):
    t=j/24;h=.99+t*.37;center=.17-.30*t
    for i in range(7):
        x=center+(i/6-.5)*.055;f=.13+.012*sin(t*pi)
        vs.append(xyz(x,h,f));ws.append(cloth_weights(x,h,f))
        if i and j:fs.append(((j-1)*7+i-1,(j-1)*7+i,j*7+i,j*7+i-1))
mesh('port-shoulder-reinforcement',vs,fs,port_band,ws,.02)
finish_type(port_worker_scene,port_worker_rig,'port-worker','port-worker.glb',1.71)

paul_trader_scene,paul_trader_rig=clone_character(worker_scene,'Cloth trader — long woven garment, layered shoulder wrap and individual proportions')
remove_clothing(paul_trader_scene);reshape_character(paul_trader_scene,paul_trader_rig,woman_point)
weighted_garment(trader_cloth,.18,point=woman_point);sash(trader_wrap,woman_point);head_shawl(trader_wrap,woman_point,short=True)
before=set(paul_trader_scene.objects)
ellipsoid('trader-gathered-hair',(0,1.585,-.115),(.058,.046,.038),hair,'head',32,16)
for side in [-1,1]:
    tube('trader-side-hair',[(side*.074,1.61,-.01),(side*.076,1.565,-.025),(side*.061,1.525,-.065)],[.009,.012,.008],hair,'head',12)
for obj in set(paul_trader_scene.objects)-before:
    for v in obj.data.vertices:v.co=woman_point(v.co)
continuous_return_arms(paul_trader_scene,woman_point)
finish_type(paul_trader_scene,paul_trader_rig,'paul-trader','paul-trader.glb',1.65)

asian_artisan_scene,asian_artisan_rig=clone_character(worker_scene,'Asian artisan — working tunic and a separately weighted apron')
remove_clothing(asian_artisan_scene);weighted_garment(artisan_tunic,.50);sash(port_band)
vs=[];fs=[];ws=[]
for j in range(33):
    t=j/32;h=.43+t*.84;half=.19 if h<1.02 else .105
    for i in range(17):
        u=-1+i/8;x=half*u;f=.175+.095*max(0,min(1,(1.02-h)/.25))+.009*sin(u*4*pi)*(1-t)
        vs.append(xyz(x,h,f));ws.append(cloth_weights(x,h,f))
        if i and j:fs.append(((j-1)*17+i-1,(j-1)*17+i,j*17+i,j*17+i-1))
apron=mesh('weighted-work-apron',vs,fs,artisan_apron,ws,.07);mod=apron.modifiers.new('apron-thickness','SOLIDIFY');mod.thickness=.003;bpy.context.view_layer.objects.active=apron;bpy.ops.object.modifier_apply(modifier=mod.name)
for side in [-1,1]:tube('apron-shoulder-strap',[(side*.085,1.25,.16),(side*.13,1.38,.08),(side*.15,1.32,-.105)],[.012,.014,.012],artisan_apron,'spine',8)
continuous_return_arms(asian_artisan_scene)
finish_type(asian_artisan_scene,asian_artisan_rig,'asian-artisan','asian-artisan.glb',1.71)
