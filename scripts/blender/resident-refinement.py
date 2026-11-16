"""Metre-scale anatomy and a baked two-bone gait, shared by adult visual types.
The geometric choices describe an original teaching character, not a scanned person.
"""
from mathutils import Matrix

def refine_profile(profile,steps=4):
    result=[]
    for j in range(len(profile)-1):
        p0=profile[max(0,j-1)];p1=profile[j];p2=profile[j+1];p3=profile[min(len(profile)-1,j+2)]
        for k in range(steps):
            t=k/steps;entry=[p1[0]+(p2[0]-p1[0])*t]
            for c in range(1,len(p1)):
                entry.append(.5*(2*p1[c]+(-p0[c]+p2[c])*t+(2*p0[c]-5*p1[c]+4*p2[c]-p3[c])*t*t+(-p0[c]+3*p1[c]-3*p2[c]+p3[c])*t*t*t))
            result.append(tuple(entry))
    return result+[profile[-1]]

def adult_foot(side,sign):
    # Heel, instep, metatarsal area and individual toes replace the oval lump.
    profile=[(-.057,.003,.060,.003),(-.048,.035,.061,.032),(-.010,.041,.066,.038),
             (.045,.047,.060,.034),(.105,.050,.049,.023),(.155,.043,.040,.016),(.186,.030,.037,.011),(.201,.004,.035,.004)]
    vs=[];fs=[];n=24
    for j,(f,rx,y,ry) in enumerate(profile):
        for k in range(n):
            a=k*2*pi/n;vs.append(xyz(sign*.095+rx*cos(a),y+ry*sin(a),f))
            if j:fs.append(((j-1)*n+k,(j-1)*n+(k+1)%n,j*n+(k+1)%n,j*n+k))
    fs.extend([tuple(reversed(range(n))),tuple((len(profile)-1)*n+k for k in range(n))])
    mesh('anatomical-foot-'+side,vs,fs,skin,[{'foot'+side:1}]*len(vs),.025)
    for toe in range(5):
        x=sign*.095-sign*(.028-toe*.015)
        ellipsoid('toe-'+side+str(toe),(x,.036,.186-toe*.004),(.0105-toe*.001,.0105-toe*.0008,.025-toe*.0025),skin,'foot'+side,seg=12,rows=8)
    outline=[(-.032,-.060),(.030,-.060),(.044,-.008),(.052,.075),(.051,.164),(.039,.208),(.014,.222),(-.029,.212),(-.050,.175),(-.053,.085),(-.043,.005)]
    vs=[xyz(sign*.095-sign*x,y,f) for y in [0,.021] for x,f in outline];count=len(outline)
    fs=[tuple(reversed(range(count))),tuple(range(count,count*2))]
    fs.extend((k,(k+1)%count,(k+1)%count+count,k+count) for k in range(count))
    sole=mesh('layered-sandal-sole-'+side,vs,fs,leather,[{'foot'+side:1}]*len(vs),.04)
    bevel=sole.modifiers.new('rounded-leather-edge','BEVEL');bevel.width=.002;bevel.segments=2
    bpy.context.view_layer.objects.active=sole;bpy.ops.object.modifier_apply(modifier=bevel.name)
    # Comparative leather strap type; placement is an artistic reconstruction.
    for f,cy,ry,rx in [(.055,.059,.033,.048),(.132,.044,.020,.046)]:
        points=[]
        for u in [-1,-.95,-.75,-.4,0,.4,.75,.95,1]:
            x=u*.052;y=.025 if abs(u)==1 else cy+ry*math.sqrt(max(0,1-(x/rx)**2))+.003
            points.append((sign*.095+x,y,f))
        tube('sandal-cross-strap-'+side+str(f),points,[.0055]*len(points),leather,'foot'+side,8)
    tube('sandal-heel-strap-'+side,[(sign*.095-.038,.025,-.033),(sign*.095-.035,.079,-.04),(sign*.095,.10,-.044),(sign*.095+.035,.079,-.04),(sign*.095+.038,.025,-.033)], [.005]*5,leather,'foot'+side,8)

def refine_face(head):
    for v in head.data.vertices:
        x,y,z=v.co;f=-y
        if f<.015:continue
        def gaussian(cx,cz,sx,sz):return exp(-((x-cx)/sx)**2-((z-cz)/sz)**2)
        d=0
        for sign in [-1,1]:
            d-=.0045*gaussian(sign*.031,1.583,.019,.014)
            d+=.0035*gaussian(sign*.044,1.548,.023,.018)
            d+=.0025*gaussian(sign*.030,1.605,.025,.009)
        d+=.003*gaussian(0,1.512,.026,.014)+.003*gaussian(0,1.481,.028,.012)
        v.co.y-=d*min(1,(f-.015)/.04)
    head.data.update()

def planted_walk(t,frame):
    # A 0.464 m stroke over 58% of a one-second cycle plants a foot at 0.8 m/s.
    # Both feet briefly support the body. No behavioural timer is introduced.
    rest_hip=rig.data.bones['thighL'].head_local
    adult_length=sum((Vector(xyz(*bones[name][1]))-Vector(xyz(*bones[name][0]))).length for name in ['thighL','shinL'])
    leg_scale=(rig.data.bones['thighL'].length+rig.data.bones['shinL'].length)/adult_length
    shift=-.05*rest_hip.z+.006*leg_scale*cos(4*pi*t)
    rig.pose.bones['hips'].location.y=shift
    rig.pose.bones['hips'].keyframe_insert(data_path='location',frame=frame)
    bpy.context.view_layer.update()
    for side,sign,phase in [('L',-1,t%1),('R',1,(t+.5)%1)]:
        if phase<.58:f=.232-.464*phase/.58;lift=0
        else:
            u=(phase-.58)/.42;s=u*u*(3-2*u);f=-.232+.464*s;lift=.075*sin(pi*u)**2
        hip=rig.data.bones['thigh'+side].head_local.copy();hip.z+=shift
        ankle=rig.data.bones['foot'+side].head_local.copy();ankle.y-=f*leg_scale;ankle.z+=lift*leg_scale
        upper=rig.data.bones['thigh'+side];lower=rig.data.bones['shin'+side]
        l1=upper.length;l2=lower.length;delta=ankle-hip;distance=min(delta.length,l1+l2-.00001);axis=delta.normalized()
        bend=Vector((0,-1,0));bend=(bend-axis*bend.dot(axis)).normalized()
        along=(l1*l1-l2*l2+distance*distance)/(2*distance)
        knee=hip+axis*along+bend*math.sqrt(max(0,l1*l1-along*along))
        for name,start,end in [('thigh'+side,hip,knee),('shin'+side,knee,ankle)]:
            bone=rig.data.bones[name];alignment=(bone.tail_local-bone.head_local).rotation_difference(end-start)
            rig.pose.bones[name].matrix=Matrix.Translation(start)@alignment.to_matrix().to_4x4()@bone.matrix_local.to_quaternion().to_matrix().to_4x4()
            rig.pose.bones[name].keyframe_insert(data_path='rotation_euler',frame=frame)
            bpy.context.view_layer.update()
        foot=rig.data.bones['foot'+side]
        rig.pose.bones['foot'+side].matrix=Matrix.Translation(ankle)@foot.matrix_local.to_quaternion().to_matrix().to_4x4()
        rig.pose.bones['foot'+side].keyframe_insert(data_path='rotation_euler',frame=frame)
        bpy.context.view_layer.update()
