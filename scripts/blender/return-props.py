"""Ezra teaching comparators: no excavated Temple wall, royal original or vessel claim."""
return_stone=material('return-rough-stone',(.46,.415,.335),.98)
return_wood=material('return-undated-timber',(.22,.135,.062),.97)
return_paper=material('return-uninscribed-document',(.52,.44,.30),.99)
return_tie=material('return-document-tie',(.19,.15,.105),.99)
return_gold=material('return-comparison-gold',(.56,.30,.065),.30,.87)
return_silver=material('return-comparison-silver',(.49,.48,.43),.35,.87)

return_masonry_scene=new_scene('Return — three stone courses and one timber teaching layer')
for row in range(3):
    for col in range(3):
        x=(col-1)*.45+(.06 if row%2 else 0)
        stone=box_surface('teaching-stone-course', (x,.075+row*.15,0),(.438,.144,.42),return_stone,.008)
        for v in stone.data.vertices:
            if abs(v.co.z)>.02:v.co.x+=.002*sin(v.co.y*44+v.co.z*37+col+row)
for f in [-.13,.13]:box_surface('teaching-timber',(.03,.48,f),(1.47,.066,.11),return_wood,.006)
parent_parts('return-timber-layer',[o for o in return_masonry_scene.objects if o.name.startswith('teaching-timber')])
finish_static(return_masonry_scene,'return-masonry',.513)
report['assets']['return-masonry']['interpretation']='Ezra 6:4 decree comparison; not an as-built survey or proven seismic system'

return_scroll_scene=new_scene('Return — sealed and unrolled teaching documents without invented writing')
# A continuous thin sheet with curled ends, with no forged script or seal impression.
vs=[];fs=[];nx,nz=96,24
for layer in [0,1]:
    for i in range(nx+1):
        t=i/nx;x=-.54+t*1.08;curl=max(0,(abs(x)-.39)/.15)
        h=.025+.105*curl*curl+(.002 if layer else 0)
        for j in range(nz+1):
            f=-.23+j*.46/nz;vs.append(xyz(x,h+.002*sin(x*13+f*11),f))
count=(nx+1)*(nz+1)
for layer in [0,1]:
    for i in range(nx):
        for j in range(nz):
            q=layer*count+i*(nz+1)+j;face=(q,q+1,q+nz+2,q+nz+1);fs.append(face if layer else tuple(reversed(face)))
perimeter=list(range(nz+1))+[i*(nz+1)+nz for i in range(1,nx+1)]+list(range(count-2,nx*(nz+1)-1,-1))+[i*(nz+1) for i in range(nx-1,0,-1)]
for a,b in zip(perimeter,perimeter[1:]+perimeter[:1]):fs.append((a,b,b+count,a+count))
mesh('uninscribed-unrolled-teaching-sheet',vs,fs,return_paper,variation=.035)
# A second tied roll is a separate comparison state, not a duplicated ancient original.
tube('stored-teaching-roll',[(.06,.064,.40),(.06,.064,.94)],[.059,.059],return_paper,sides=48)
pts=[(.06+.061*cos(i*2*pi/40),.064+.061*sin(i*2*pi/40),.66) for i in range(41)]
tube('stored-roll-tie',pts,[.003]*len(pts),return_tie,sides=8)
finish_static(return_scroll_scene,'return-scroll',.133)

return_vessels_scene=new_scene('Return — two original metallic vessel comparators, not identified temple originals')
# A closed lathe cross-section includes base, outer wall, rim, inner wall and true inner floor.
for label,x,mat,scale in [('gold',-.30,return_gold,1),('silver',.31,return_silver,.84)]:
    profile=[(0,0),(.09,0),(.12,.018),(.17,.06),(.218,.145),(.24,.25),(.242,.275),(.231,.286),(.216,.28),(.215,.258),(.195,.16),(.15,.075),(.09,.038),(0,.038)]
    bowl=pottery_profile('original-'+label+'-bowl',[(r*scale,h*scale) for r,h in profile],mat,n=96,tool=False);bowl.location.x=x
    for j in range(5):
        h=(.08+j*.031)*scale;r=(.177+j*.011)*scale
        pts=[(x+r*cos(i*2*pi/64),h,r*sin(i*2*pi/64)) for i in range(65)]
        tube('selected-metal-working-line',pts,[.0009]*len(pts),mat,sides=5)
finish_static(return_vessels_scene,'return-vessels',.286)
