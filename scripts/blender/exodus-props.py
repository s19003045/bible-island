"""Exodus 5, 12 and 14 teaching assets. Original surfaces, not excavated finds.
The Met 25.3.108 and the UCLA Egyptology mud-brick study are comparisons only;
neither identifies an Exodus date, workshop, recipe or standard brick dimension.
"""
ex_wood=material('exodus-unspecified-wood',(.25,.14,.065),.95)
ex_grain=material('exodus-wood-grain',(.14,.072,.031),.98)
ex_mud=material('exodus-unfired-mud',(.30,.21,.13),1)
ex_straw=material('exodus-chopped-straw',(.49,.37,.17),1)
ex_linen=material('exodus-wrapping-cloth',(.48,.43,.33),.99)
ex_rope=material('exodus-fibre-cord',(.26,.21,.12),.98)
ex_bread=material('exodus-flat-bread',(.48,.30,.12),.98)
ex_toast=material('exodus-toasted-patches',(.22,.105,.036),1)

brick_scene=new_scene('Exodus — open wooden mould, unfired mud and plant temper')
before=set(brick_scene.objects)
# One open mould, with an extended long-side grip. No hidden bottom panel.
for f in [-.137,.137]:
    box_surface('mould-long-side',(-.24,.06,f),(.464,.12,.034),ex_wood,.003)
    for line in range(5):
        pts=[(-.455+k*.031,.022+line*.018+.0015*sin(k*.8+line),f+(.0172 if f>0 else -.0172)) for k in range(15)]
        tube('mould-long-grain',pts,[.00055]*len(pts),ex_grain,sides=4)
for x in [-.455,-.025]:box_surface('mould-end-board',(x,.06,0),(.034,.12,.24),ex_wood,.003)
grip=box_surface('extended-mould-grip',(-.55,.06,.137),(.19,.048,.046),ex_wood,.01)
frame=parent_parts('brick-frame',[o for o in brick_scene.objects if o not in before]);frame['component']='open-bottom-mould'
for index,(x,w,h,d) in enumerate([(-.24,.392,.094,.23),(.285,.38,.108,.23)]):
    brick=box_surface('unfired-brick',(x,h/2,0),(w,h,d),ex_mud,.006)
    # Small hand-formed irregularities, rather than a perfectly machined block.
    for v in brick.data.vertices:
        v.co.x+=.0008*sin(v.co.y*137+v.co.z*97)
        v.co.y+=.0007*sin(v.co.x*101+v.co.z*63)
    for n in range(38):
        px=x+(n%8-3.5)*.040;pf=(n//8-2)*.040;a=n*2.399
        length=.016+(n%5)*.005
        tube('embedded-plant-fibre',[(px,h-.0015,pf),(px+cos(a)*length,h+.0008,pf+sin(a)*length)],
             [.0011,.0006],ex_straw,sides=5)
# A modest comparison sample beside the brick; no fixed historical mix ratio.
for n in range(24):
    x=.20+(n%6)*.036;f=.21+(n//6)*.018;a=n*2.19
    tube('loose-chopped-straw',[(x,.003+(n%3)*.0015,f),(x+.04*cos(a),.005+(n%3)*.0015,f+.04*sin(a))],
         [.001,.0006],ex_straw,sides=5)
finish_static(brick_scene,'brick-mould',.120)

departure_scene=new_scene('Exodus — flat bread, cloth-wrapped kneading vessel and walking staff')
for loaf in range(3):
    cx=-.29+loaf*.020;cf=-.065+loaf*.015;cy=.010+loaf*.020;radius=.145-loaf*.008
    vs=[];fs=[];segments=64;rings_n=10
    for lower in [False,True]:
        for ring in range(rings_n+1):
            r=radius*ring/rings_n
            for k in range(segments):
                a=k*2*pi/segments;edge=1+.036*sin(3*a+loaf)+.021*sin(7*a-.6)
                x=cx+r*edge*cos(a);f=cf+r*edge*sin(a)
                hump=.010*(1-(r/radius)**2)+.002*sin(x*85+f*47)*(1-r/radius)
                y=cy-(.009+.001*sin(a*3)) if lower else cy+hump+.004
                vs.append(xyz(x,y,f))
    side=(rings_n+1)*segments
    for lower in [0,1]:
        offset=lower*side
        for ring in range(rings_n):
            for k in range(segments):
                a=offset+ring*segments+k;b=offset+ring*segments+(k+1)%segments
                face=(a,b,b+segments,a+segments);fs.append(tuple(reversed(face)) if lower else face)
    for k in range(segments):
        a=rings_n*segments+k;b=rings_n*segments+(k+1)%segments;fs.append((a,b,b+side,a+side))
    bread=mesh('hand-flattened-bread',vs,fs,ex_bread,variation=.12)
    # Irregular toasted colour belongs to the actual surface vertex colours.
    colours=bread.data.color_attributes['surface']
    for i,v in enumerate(bread.data.vertices):
        if v.co.z<cy:continue
        patch=max(0,sin(v.co.x*109+loaf)*sin(v.co.y*93+.7))**5
        c=colours.data[i].color
        colours.data[i].color=(c[0]*(1-.38*patch),c[1]*(1-.50*patch),c[2]*(1-.50*patch),1)

# An illustrative kneading container; neither text nor comparison fixes its wood,
# profile or absolute dimensions. Cloth can be lifted only as a modern cutaway.
vessel_profile=[(0,.025),(.10,.025),(.126,.05),(.158,.108),(.173,.17),(.174,.186),
                (.163,.191),(.151,.177),(.143,.115),(.115,.063),(.085,.044),(0,.044)]
bowl=pottery_profile('illustrative-kneading-vessel',vessel_profile,ex_wood,n=80,tool=False)
bowl.location=xyz(.255,0,-.055)
bowl_group=parent_parts('kneading-vessel',[bowl]);bowl_group['component']='illustrative-kneading-container'
before=set(departure_scene.objects)
cloth_profile=[(.010,.10,.088,0),(.045,.155,.139,0),(.12,.190,.181,0),
           (.185,.197,.192,0),(.222,.125,.119,.008),(.25,.053,.046,.014),(.268,.032,.028,.01)]
dense_cloth=[]
for j in range(len(cloth_profile)-1):
    p0=cloth_profile[max(0,j-1)];p1=cloth_profile[j];p2=cloth_profile[j+1];p3=cloth_profile[min(len(cloth_profile)-1,j+2)]
    for k in range(5):
        t=k/5;entry=[p1[0]+(p2[0]-p1[0])*t]
        for c in range(1,4):entry.append(.5*((2*p1[c])+(-p0[c]+p2[c])*t+(2*p0[c]-5*p1[c]+4*p2[c]-p3[c])*t*t+(-p0[c]+3*p1[c]-3*p2[c]+p3[c])*t*t*t))
        dense_cloth.append(tuple(entry))
dense_cloth.append(cloth_profile[-1])
wrap=rings('gathered-cloth-wrap',dense_cloth,
           ex_linen,n=80,folds=.008,center=(.255,-.055),variation=.065)
ellipsoid('cloth-base',(.255,.012,-.055),(.104,.012,.093),ex_linen,seg=40,rows=12)
ellipsoid('gathered-cloth-knot',(.255,.269,-.044),(.031,.014,.029),ex_linen,seg=24,rows=14)
for side in [-1,1]:
    pts=[(.255+side*(.012+.043*sin(k*pi/24)),.252+.017*sin(k*pi/12),-.041+.018*sin(k*pi/12)) for k in range(25)]
    tube('cloth-knot-loop',pts,[.007]*len(pts),ex_linen,sides=8)
for strand in range(2):
    pts=[]
    for k in range(97):
        a=k/96*2*pi;rr=.055+strand*.003
        pts.append((.255+rr*cos(a),.244+strand*.004,-.041+rr*.85*sin(a)))
    tube('bundle-cord',pts,[.0018]*len(pts),ex_rope,sides=6)
wrap_group=parent_parts('kneading-wrap',[o for o in departure_scene.objects if o not in before]);wrap_group['component']='cloth-wrap-cutaway'
staff_points=[(-.59+i*.049,.018+.003*sin(i*.4),.27+.006*sin(i*.3)) for i in range(25)]
tube('walking-staff',staff_points,[.011-.002*i/24 for i in range(25)],ex_wood,sides=12)
for n in [5,13,20]:ellipsoid('staff-knot',staff_points[n],(.013,.011,.012),ex_wood,seg=12,rows=8)
finish_static(departure_scene,'passover-kit',.283)

crossing_scene=new_scene('Exodus — dry passage and two water walls; modern narrative cutaway')
ex_sand=material('crossing-cutaway-ground',(.40,.32,.20),1)
ex_water=material('crossing-water-volume',(.065,.23,.25),.30,.05)
ex_water.diffuse_color=(*ex_water.diffuse_color[:3],.72)
ex_water.node_tree.nodes['Principled BSDF'].inputs['Alpha'].default_value=.72
ex_water.surface_render_method='DITHERED';ex_water.use_backface_culling=False
ex_foam=material('crossing-water-ridge',(.34,.52,.50),.48)
box_surface('modern-ground-cutaway',(0,.018,0),(1.04,.036,.72),ex_sand,.008)
for side,name in [(-1,'left'),(1,'right')]:
    vs=[];fs=[];nx,ny=64,14
    # Closed water volumes with a rippled inner face, top and outer face.
    for outer in [0,1]:
        for j in range(ny+1):
            t=j/ny
            for i in range(nx+1):
                x=-.51+i*1.02/nx
                top=.37+.014*sin(x*19+side)+.007*sin(x*43)
                y=.036+t*(top-.036)
                f=side*(.345 if outer else .19+.009*sin(x*25+t*7)+.004*sin(x*61-t*11))
                vs.append(xyz(x,y,f))
    count=(nx+1)*(ny+1)
    for outer in [0,1]:
        offset=outer*count
        for j in range(ny):
            for i in range(nx):
                a=offset+j*(nx+1)+i;face=(a,a+1,a+nx+2,a+nx+1)
                fs.append(face)
    perimeter=list(range(nx+1))+[j*(nx+1)+nx for j in range(1,ny+1)]
    perimeter+=list(range(count-2,ny*(nx+1)-1,-1))+[j*(nx+1) for j in range(ny-1,0,-1)]
    for a,b in zip(perimeter,perimeter[1:]+perimeter[:1]):fs.append((a,b,b+count,a+count))
    water=mesh('closed-water-wall',vs,fs,ex_water,variation=.04)
    lines=[]
    for start in [-.38,-.13,.19,.39]:
        pts=[]
        for i in range(9):
            x=start+i*.007
            pts.append((x,.039+.001*sin(x*63),side*(.181+.008*sin(x*25))))
        lines.append(tube('broken-water-edge',pts,[.0008]*len(pts),ex_foam,sides=5))
    group=parent_parts('water-'+name,[water,*lines]);group['component']='narrative-water-wall';group['side']=name
for n in range(3):
    x=-.31+n*.29;f=(n%2-.5)*.08;before=set(crossing_scene.objects)
    # Small wooden adults, about 7.5 heads tall, simply indicate direction.
    rings('teaching-figure-tunic',[(.060,.010,.007,0),(.077,.009,.006,0),(.103,.013,.008,0),(.112,.009,.006,0)],ex_wood,n=12,center=(x,f))
    ellipsoid('teaching-figure-head',(x,.126,f),(.0065,.007,.006),ex_wood,seg=12,rows=8)
    tube('teaching-figure-neck',[(x,.109,f),(x,.122,f)],[.003,.0025],ex_wood,sides=6)
    for sign in [-1,1]:
        tube('teaching-figure-leg',[(x+sign*.005,.062,f),(x+sign*.005,.041,f+sign*.004)], [.003,.0022],ex_wood,sides=6)
        tube('teaching-figure-arm',[(x+sign*.012,.103,f),(x+sign*.014,.078,f+sign*.003)], [.003,.002],ex_wood,sides=6)
        ellipsoid('teaching-figure-foot',(x+sign*.005+.003,.0388,f+sign*.004),(.007,.0028,.003),ex_wood,seg=8,rows=6)
    body=parent_parts('direction-figure-'+str(n),[o for o in crossing_scene.objects if o not in before]);body['component']='modern-direction-figure'
finish_static(crossing_scene,'crossing-ground',.391)
report['assets']['crossing-ground']['uniform_scale']=False
report['assets']['crossing-ground']['use']='inspection cutaway only; full scene water and moving convoy remain separate'
