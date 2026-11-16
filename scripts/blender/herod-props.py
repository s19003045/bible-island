"""Early Roman architectural teaching types, not scans or measured reconstructions.
Margin dressing: IAA Wilson's Arch report (2011). Boundary: War 5.5.2.
Corinthian comparison: Antiquities 15.11.5 describes the SOUTH royal portico;
it does not establish the order of John's Solomon's Portico.
"""
herod_lime=material('herod-pale-limestone',(.61,.56,.46),.95)
herod_recess=material('herod-worked-recess',(.47,.43,.35),.97)
herod_trace=material('herod-tool-trace',(.50,.46,.38),1)
herod_base=material('modern-diagram-base',(.36,.34,.28),.98)

ashlar_scene=new_scene('Herod — drafted margins and joint teaching sample')
box_surface('modern-sample-plinth',(0,.014,0),(.94,.028,.42),herod_base,.003)
for index,x in enumerate([-.22,.22]):
    before=set(ashlar_scene.objects)
    # The broad border is the real recessed face, below a slightly proud boss.
    stone=box_surface('ashlar-body',(x,.214,0),(.435,.372,.34),herod_lime,.002)
    boss=box_surface('dressed-central-face',(x,.214,.175),(.355,.292,.018),herod_lime,.003)
    for line in range(23):
        x0=x-.166+line*.015
        for segment in range(3):
            start=.083+segment*.087+.003*sin(line*1.7)
            tube('fine-chisel-trace',[(x0,start,.1841),(x0+.002,start+.055,.1843)],
                 [.0005,.00035],herod_trace,sides=4)
    # Short dressing strokes on the recessed bands remain separate from the boss.
    for line in range(20):
        x0=x-.194+line*.020
        for y in [.047,.382]:
            tube('drafted-border-stroke',[(x0,y,.1702),(x0+.007,y+.004,.1703)],
                 [.00045,.00035],herod_recess,sides=4)
    joint=parent_parts('ashlar-'+('left' if index==0 else 'right'),[o for o in ashlar_scene.objects if o not in before])
    joint['component']='drafted-ashlar';joint['margin_width']=.040
finish_static(ashlar_scene,'herod-stone',.400)

boundary_scene=new_scene('Herod — boundary, ascent and inner wall schematic')
box_surface('modern-diagram-plinth',(0,.02,0),(.98,.04,.72),herod_base,.004)
box_surface('outer-zone-floor',(0,.047,.235),(.94,.014,.20),herod_lime,.001)
box_surface('raised-zone-floor',(0,.064,-.045),(.94,.048,.34),herod_lime,.001)
before=set(boundary_scene.objects)
for j in range(7):
    x=-.42+j*.14
    box_surface('boundary-upright',(x,.147,.175),(.034,.186,.039),herod_lime,.003)
for y in [.084,.224]:box_surface('boundary-rail',(0,y,.175),(.89,.027,.044),herod_lime,.002)
# Unlettered block: no invented inscription is passed off as archaeological text.
box_surface('unlettered-marker',(-.28,.272,.175),(.082,.08,.025),herod_lime,.002)
rail=parent_parts('boundary-layer',[o for o in boundary_scene.objects if o not in before])
rail['component']='low-stone-boundary';rail['schematic']=True
# Fourteen treads recall the textual ascent, but the diagram deliberately does
# not assign one uniform scale to this entire composite of different elements.
for j in range(14):
    top=.088+(j+1)*.012
    tread=box_surface('boundary-ascent-tread',(0,(top+.04)/2,.11-j*.018),(.22,top-.04,.0185),herod_lime,.0005)
    tread['component']='ascent-tread';tread['step_index']=j
box_surface('inner-landing',(0,.24,-.1725),(.25,.032,.085),herod_lime,.001)
for sign in [-1,1]:
    for row in range(4):
        for col in range(2):
            box_surface('inner-court-wall',(sign*(.185+col*.16),.104+row*.147,-.275),(.156,.143,.08),herod_lime,.001)
box_surface('schematic-gateway-lintel',(0,.622,-.275),(.23,.14,.08),herod_lime,.002)
finish_static(boundary_scene,'herod-boundary',.692)
report['assets']['herod-boundary']['ascent_treads']=14
report['assets']['herod-boundary']['uniform_scale']=False

portico_scene=new_scene('Herod — Corinthian comparison, not an identified Solomon Portico capital')
# A short shaft segment; the tall columns in the scene are not this model's scale.
profile=[(0,0),(.126,0),(.126,.215),(.135,.224),(.135,.242),(.128,.249),
         (.135,.29),(.150,.38),(.167,.49),(.185,.59),(.211,.651),(.213,.669),(0,.669)]
pottery_profile('shaft-and-capital-bell',profile,herod_lime,n=80,tool=False)

def carved_leaf(name,angle,base,height,spread):
    # Solid folded surfaces with lobed edges, raised midrib and outward curling tip.
    vs=[];fs=[];rows,cols=18,10
    for back in [False,True]:
        for j in range(rows+1):
            t=j/rows
            width=spread*(sin(pi*t)**.67+.06)*(1+.13*sin(t*7*pi))
            for k in range(cols+1):
                u=-1+2*k/cols
                y=base+height*t-.009*abs(u)*sin(5*pi*t)**2
                bell=.135
                for (r0,y0),(r1,y1) in zip(profile[5:12],profile[6:13]):
                    if y0<=y<=y1:bell=r0+(r1-r0)*(y-y0)/(y1-y0);break
                radius=bell+.002+.055*t**5+.013*(1-abs(u))*sin(pi*t)
                radius+=.003*cos(u*4*pi)*sin(pi*t)
                radius-=.003 if back else 0
                tangent=u*width
                vs.append(xyz(radius*cos(angle)-tangent*sin(angle),y,radius*sin(angle)+tangent*cos(angle)))
    side=(rows+1)*(cols+1)
    for back in [0,1]:
        offset=back*side
        for j in range(rows):
            for k in range(cols):
                a=offset+j*(cols+1)+k;face=(a,a+1,a+cols+2,a+cols+1)
                fs.append(tuple(reversed(face)) if back else face)
    edge=list(range(cols+1))+[j*(cols+1)+cols for j in range(1,rows+1)]
    edge+=list(range(side-2,rows*(cols+1)-1,-1))+[j*(cols+1) for j in range(rows-1,0,-1)]
    for a,b in zip(edge,edge[1:]+edge[:1]):fs.append((a,b,b+side,a+side))
    return mesh(name,vs,fs,herod_lime,variation=.055)

for row in range(2):
    for j in range(8):
        a=2*pi*(j+row*.5)/8
        leaf=carved_leaf('acanthus-comparison-leaf',a,.251+row*.11,.235+row*.015,.055)
        leaf['component']='carved-acanthus-leaf';leaf['leaf_row']=row
        group=parent_parts('acanthus-row-'+str(row)+'-leaf-'+str(j),[leaf]);group['component']='acanthus-leaf'
for j in range(4):
    a=pi/4+j*pi/2;points=[]
    for k in range(25):
        t=k/24;radius=.17+.125*t;points.append((radius*cos(a),.48+.145*t,radius*sin(a)))
    for k in range(49):
        t=k/48;turn=t*2.2*pi;radius=.295+.032*(1-.8*t)*sin(turn)
        points.append((radius*cos(a),.657-.032*(1-.8*t)*cos(turn),radius*sin(a)))
    tube('corner-volute',points,[.0065]*(len(points)-18)+[.0065*(1-.7*i/17) for i in range(18)],herod_lime,sides=8)
box_surface('lower-abacus',(0,.685,0),(.47,.040,.47),herod_lime,.004)
box_surface('upper-abacus',(0,.7325,0),(.53,.055,.53),herod_lime,.004)
finish_static(portico_scene,'herod-capital',.760)
report['assets']['herod-capital']['comparison_order']='Corinthian; south royal portico reference only'
report['assets']['herod-capital']['leaf_rows']=2
