"""Original small ewe comparison. No breed/age/ancient phenotype identification.
Four legs with cloven hooves, distinct hocks, muzzle, ears and a continuous fleece
surface. Head/tail are separate scene nodes for per-instance grazing idles.
"""
ewe_scene=new_scene('Seven ewes witness group — one original animal type, not a sacrifice')
ewe_fleece=material('ewe-natural-fleece',(.48,.435,.35),.99)
ewe_skin=material('ewe-face-and-legs',(.255,.235,.195),.95)
ewe_hoof=material('ewe-split-hooves',(.095,.087,.069),.97)
ewe_eye=material('ewe-eye',(.024,.020,.015),.41)
body=ellipsoid('ewe-torso',(0,.46,0),(.215,.25,.39),ewe_fleece,seg=48,rows=32)
for v in body.data.vertices:
    p=v.co;delta=.004*sin(p.x*132+p.y*79+p.z*91)+.003*sin(p.z*187-p.x*63)
    normal=Vector((p.x/.215,(p.y)/.39,(p.z-.46)/.25)).normalized()
    p+=normal*delta
ellipsoid('ewe-neck',(0,.56,.30),(.125,.18,.15),ewe_fleece,seg=32,rows=24)
for side in [-1,1]:
    for fore in [-1,1]:
        z=fore*.255
        tube('ewe-leg',[(side*.13,.43,z),(side*.135,.29,z-.025),(side*.13,.15,z-.01),(side*.13,.045,z+.006)],[.043,.032,.021,.023],ewe_skin,sides=16)
        for toe in [-1,1]:ellipsoid('ewe-cloven-hoof',(side*.13+toe*.013,.025,z+.022),(.012,.025,.035),ewe_hoof,seg=16,rows=10)
head=bpy.data.objects.new('ewe-head',None);ewe_scene.collection.objects.link(head);head.location=xyz(0,.64,.36)
bpy.context.view_layer.update()
before=set(ewe_scene.objects)
vs=[];fs=[]
# A tapered long face with a narrower nose, rather than a round mascot muzzle.
for j,(f,h,rx,rz) in enumerate([(.29,.65,.025,.045),(.32,.66,.068,.090),(.37,.65,.076,.100),(.42,.62,.061,.088),(.48,.58,.045,.060),(.53,.565,.037,.039),(.555,.56,.026,.023),(.563,.56,.004,.004)]):
    for i in range(32):
        angle=i*2*pi/32;vs.append(xyz(rx*cos(angle),h+rz*sin(angle),f))
        if j:fs.append(((j-1)*32+i,(j-1)*32+(i+1)%32,j*32+(i+1)%32,j*32+i))
mesh('ewe-tapered-long-face',vs,fs,ewe_skin,variation=.035)
for side in [-1,1]:
    ellipsoid('ewe-ear',(side*.108,.665,.335),(.067,.018,.031),ewe_skin,seg=24,rows=12)
    ellipsoid('ewe-eye',(side*.067,.666,.406),(.007,.007,.006),ewe_eye,seg=16,rows=10)
    ellipsoid('ewe-nostril',(side*.022,.559,.552),(.006,.004,.003),ewe_eye,seg=16,rows=10)
for obj in set(ewe_scene.objects)-before:obj.parent=head;obj.matrix_parent_inverse=head.matrix_world.inverted()
tail=bpy.data.objects.new('ewe-tail',None);ewe_scene.collection.objects.link(tail);tail.location=xyz(0,.48,-.355)
bpy.context.view_layer.update()
obj=tube('ewe-wool-tail',[(0,.48,-.35),(0,.40,-.39),(0,.32,-.41)],[.04,.034,.018],ewe_fleece,sides=20);obj.parent=tail;obj.matrix_parent_inverse=tail.matrix_world.inverted()
finish_static(ewe_scene,'abraham-ewe',.757)
