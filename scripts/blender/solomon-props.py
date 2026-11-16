"""Original teaching reconstructions: Kings 6:7–18 and 7:15–26.
No surviving object, ornamental design, cattle breed or absolute cubit is claimed.
"""
cast=material('solomon-cast-bronze',(.34,.18,.068),.4,.82)
recess=material('bronze-recess',(.14,.075,.032),.48,.75)
limestone=material('dressed-limestone',(.54,.48,.37),.95)
cedar=material('cedar-facing',(.24,.11,.043),.94)

def loft_x(name,profile,mat,n=16):
    # Cross-sections along a cast animal's spine, with shaped shoulders and jaw.
    vs=[];fs=[]
    for j,(x,z,rz,rf) in enumerate(profile):
        for k in range(n):
            a=k*2*pi/n;vs.append(xyz(x,z+rz*cos(a),rf*sin(a)))
            if j:fs.append(((j-1)*n+k,(j-1)*n+(k+1)%n,j*n+(k+1)%n,j*n+k))
    fs.extend([tuple(reversed(range(n))),tuple((len(profile)-1)*n+k for k in range(n))])
    return mesh(name,vs,fs,mat,variation=.025)

sea_scene=new_scene('Solomon — sea on twelve cast cattle; miniature 1 to 5')
cardinals=[('east',0),('north',-pi/2),('west',pi),('south',pi/2)]
for direction,angle in cardinals:
    for lane in [-1,0,1]:
        before=set(sea_scene.objects)
        loft_x('cast-ox-torso',[(-.13,.177,.031,.028),(-.10,.182,.048,.040),(-.05,.177,.054,.047),(.015,.189,.061,.047),(.055,.195,.059,.042),(.08,.190,.04,.033)],cast)
        loft_x('cast-ox-neck',[(.055,.18,.05,.032),(.086,.196,.044,.029),(.12,.20,.038,.028),(.145,.19,.033,.026)],cast,12)
        loft_x('cast-ox-head',[(.12,.203,.031,.027),(.15,.193,.036,.029),(.179,.168,.025,.024),(.199,.161,.018,.024)],cast,12)
        for x in [-.09,.047]:
            for f in [-.032,.032]:
                tube('cast-ox-leg',[(x,.145,f),(x+.004,.083,f),(x+.006,.025,f)],[.014,.009,.008],cast,sides=10)
                box_surface('cloven-hoof',(x+.011,.012,f),(.032,.024,.023),cast,.003)
                tube('hoof-cleft',[(x+.028,.012,f-.001),(x+.028,.023,f-.001)],[.0008,.0008],recess,sides=4)
        for sign in [-1,1]:
            tube('cast-ox-horn',[(.13,.225,sign*.024),(.119,.242,sign*.036),(.102,.252,sign*.047),(.10,.259,sign*.05)],[.007,.005,.003,.0007],cast,sides=8)
            mesh('cast-ox-ear',[xyz(.132,.218,sign*.025),xyz(.11,.229,sign*.067),xyz(.096,.211,sign*.055),xyz(.116,.207,sign*.028)],[(0,1,2),(0,2,3)],cast)
            ellipsoid('cast-ox-eye',(.151,.205,sign*.028),(.003,.003,.0018),recess,seg=8,rows=5)
            ellipsoid('cast-ox-nostril',(.192,.17,sign*.020),(.003,.0025,.0018),recess,seg=8,rows=5)
        tube('cast-ox-tail',[(-.128,.184,-.008),(-.146,.161,-.014),(-.15,.105,-.009),(-.144,.06,.003)],[.003,.0025,.002,.004],cast,sides=8)
        group=parent_parts('ox-'+direction+'-'+str(lane+1),[o for o in sea_scene.objects if o not in before])
        group.location=xyz(cos(angle)*.247-sin(angle)*lane*.118,0,sin(angle)*.247+cos(angle)*lane*.118)
        group.rotation_euler.z=-angle
        group['component']='cast-ox';group['cardinal']=direction;group['facing']=[round(cos(angle),6),0,round(sin(angle),6)]

# Rim diameter .9 and bowl height .45 become 4.5 and 2.25 m at scene scale 5.
# Support height .25 (1.25 m) is a separate reconstruction choice.
sea_profile=[(0,.25),(.30,.25),(.33,.30),(.36,.405),(.387,.515),(.422,.625),(.428,.663),(.45,.70),(.435,.70),(.414,.666),(.408,.63),(.372,.52),(.345,.414),(.317,.31),(.285,.265),(0,.265)]
pottery_profile('sea-continuous-shell',sea_profile,cast,n=128,tool=False)
# 10 per cubit × the text's 30-cubit circumference: 300 per row as an explicit
# teaching interpretation, not a measured archaeological count.
for row in range(2):
    for j in range(300):
        a=2*pi*(j+row*.5)/300;r=.423+row*.004
        ellipsoid('sea-gourd-knob',(r*cos(a),.64+row*.017,r*sin(a)),(.003,.004,.003),cast,seg=6,rows=4)
finish_static(sea_scene,'solomon-sea',.70)
report['assets']['solomon-sea']['scene_scale']=5
report['assets']['solomon-sea']['cattle']=12
report['assets']['solomon-sea']['bowl_height']=.45
report['assets']['solomon-sea']['rim_diameter']=.90

capital_scene=new_scene('Solomon — capital, interlaced network and pomegranate teaching type')
capital_profile=[(0,0),(.23,0),(.23,.20),(.26,.23),(.305,.31),(.308,.38),(.293,.45),(.24,.49),(.18,.54),(.205,.60),(.245,.68),(.31,.76),(.34,.80),(.322,.80),(.291,.759),(.225,.68),(.185,.603),(.164,.55),(0,.55)]
capital=pottery_profile('capital-lily-shaped-profile',capital_profile,cast,n=96,tool=False)
for v in capital.data.vertices:
    x,y,z=v.co
    if z>.54:
        ripple=.014*((z-.54)/.26)**2*cos(math.atan2(y,x)*6)
        r=math.hypot(x,y)
        if r>.01:v.co.x*=1+ripple/r;v.co.y*=1+ripple/r
for row in range(2):
    z=.315+row*.11;r=.312 if row==0 else .305
    band=[(r*cos(k*2*pi/128),z,r*sin(k*2*pi/128)) for k in range(129)]
    tube('pomegranate-attachment-band',band,[.0025]*129,cast,sides=6)
    for j in range(100):
        a=2*pi*(j+row*.5)/100
        fruit=ellipsoid('capital-pomegranate',(r*cos(a),.315+row*.11,r*sin(a)),(.008,.011,.008),cast,seg=8,rows=5)
        # Small calyx, rather than interpreting the fruit as a plain bead.
        vs=[];fs=[]
        for k in range(10):
            t=k*pi/5;rr=.004 if k%2==0 else .002
            vs.append(xyz(r*cos(a)+rr*cos(t),.329+row*.11+(0 if k%2 else .004),r*sin(a)+rr*sin(t)))
        vs.append(xyz(r*cos(a),.327+row*.11,r*sin(a)))
        for k in range(10):fs.append((10,k,(k+1)%10))
        mesh('pomegranate-calyx',vs,fs,cast)
for j in range(7):
    for diagonal in [-1,1]:
        pts=[]
        for k in range(33):
            t=k/32;a=j*2*pi/7+diagonal*(t-.5)*.65;z=.28+t*.165
            r=.30
            for (r0,z0),(r1,z1) in zip(capital_profile[:13],capital_profile[1:13]):
                if z0<=z<=z1:r=r0+(r1-r0)*(z-z0)/(z1-z0);break
            r+=.004
            pts.append((r*cos(a),z,r*sin(a)))
        tube('capital-network-chain',pts,[.003]*33,cast,sides=6)
finish_static(capital_scene,'pillar-capital',.80)
report['assets']['pillar-capital']['capital_base']=.20
report['assets']['pillar-capital']['capital_height']=.60
report['assets']['pillar-capital']['pomegranates']=200

masonry_scene=new_scene('Solomon — masonry and partial cedar interior-facing teaching cutaway')
for row in range(3):
    for col in range(3):
        x=-.284+col*.284+(row%2)*.036
        block=box_surface('pre-dressed-stone',(x,.097+row*.195,0),(.278,.188,.22),limestone,.004)
        block['component']='dressed-stone'
before=set(masonry_scene.objects)
for j in range(4):
    x=.038+j*.095
    box_surface('cedar-facing-board',(x,.294,.132),(.091,.565,.035),cedar,.002)
    # Shallow, irregular grain is illustrative hand-finished surface detail.
    for line in range(3):
        pts=[(x-.03+line*.029+.001*sin(k*.7+j),.03+k*.021,.151) for k in range(26)]
        tube('cedar-grain',pts,[.0005]*26,acacia_grain,sides=4)
for h in [.06,.52]:box_surface('facing-crosspiece',(.18,h,.164),(.39,.025,.026),cedar,.002)
facing=parent_parts('cedar-facing',[o for o in masonry_scene.objects if o not in before])
facing['component']='cedar-interior-facing';facing['teaching_cutaway']=True
finish_static(masonry_scene,'temple-masonry',.581)
