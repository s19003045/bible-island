"""Acquire and measure bounded motion references, without changing assets.

python3 scripts/blender/jerusalem-life-reference-research.py --fetch-indexes
python3 scripts/blender/jerusalem-life-reference-research.py --fetch-clips
blender --background --python scripts/blender/jerusalem-life-reference-research.py -- --analyze

Downloads and reports are confined to the new Jerusalem-life/reference folder.
CMU's public HTTP endpoint is retained because its HTTPS certificate currently
fails validation. The pinned BVH mirror uses verified HTTPS; no TLS checks are
disabled. Existing captures, generators and application files are read-only.
"""
import argparse, concurrent.futures, csv, datetime, gc, hashlib, json, math, pathlib, re, sys, urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT/'assets/blender/jerusalem-life/reference'
MIRROR = 'https://raw.githubusercontent.com/una-dinosauria/cmu-mocap/09a07f54f3bbb58797325f009282d0b2048a2871'
CLIPS = {
    '16_11': 'walk, veer left',
    '16_17': 'walk, 90-degree left turn',
    '16_19': 'walk, 90-degree right turn',
    '16_33': 'slow walk, stop',
    '36_02': 'walk forward, turn around, walk back',
    '83_27': 'walk forward stepping up stairs',
    '83_08': 'medium step forward and down',
    '79_16': 'buying something',
    '79_25': 'moving heavy box',
    '143_10': 'Walk And Pick up Tool Box',
}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def fetch_one(item):
    filename,url,kind = item
    path = OUT/filename
    if not path.exists():
        data = urllib.request.urlopen(url,timeout=25).read()
        if len(data)<100:
            raise ValueError('Unexpectedly short response: '+url)
        tmp = path.with_suffix(path.suffix+'.part')
        tmp.write_bytes(data)
        tmp.replace(path)
    return {'file':filename,'url':url,'kind':kind,'bytes':path.stat().st_size,'sha256':sha(path)}


def fetch(items):
    OUT.mkdir(parents=True,exist_ok=True)
    previous = OUT/'source-downloads.json'
    records = json.loads(previous.read_text())['files'] if previous.exists() else []
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for record in pool.map(fetch_one,items):
            records = [r for r in records if r['file']!=record['file']]
            records.append(record)
            print('REFERENCE_FETCH',record['file'],record['bytes'],flush=True)
    previous.write_text(json.dumps({'retrieved_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'pinned_bvh_revision':'09a07f54f3bbb58797325f009282d0b2048a2871',
        'transport_note':'Official CMU HTTP endpoint because its HTTPS certificate fails validation; pinned BVH mirror verified HTTPS. No TLS verification disabled.',
        'files':sorted(records,key=lambda r:r['file'])},indent=2)+'\n')


def mean_filter(values, radius):
    sums=[0.0]
    for value in values:
        sums.append(sums[-1]+value)
    return [(sums[min(len(values),i+radius+1)]-sums[max(0,i-radius)])/
            (min(len(values),i+radius+1)-max(0,i-radius)) for i in range(len(values))]


def runs(flags, gap=0, minimum=1):
    spans=[]
    for i,flag in enumerate(flags):
        if flag and (not spans or i-spans[-1][1]>gap+1):spans.append([i,i])
        elif flag:spans[-1][1]=i
    return [s for s in spans if s[1]-s[0]+1>=minimum]


def analyze():
    # Existing parser is imported read-only. No capture, rig or source is saved.
    import runpy
    from mathutils import Vector
    parser=runpy.run_path(str(ROOT/'scripts/blender/jerusalem-pilot.py'))['BVH']
    metres_per_unit=(1/.45)*2.54/100
    source_records=json.loads((OUT/'source-downloads.json').read_text())['files']
    source_before={r['file']:sha(OUT/r['file']) for r in source_records}
    assert all(source_before[r['file']]==r['sha256'] for r in source_records)
    results=[]
    for clip,label in CLIPS.items():
        capture=parser(OUT/(clip+'.bvh'))
        frames=capture.frames[1:]  # Index0 is the converter's added T-pose.
        fps=60 if clip.startswith('79_') else 120
        dt=1/fps;n=len(frames);radius=max(1,round(fps*.035))
        root=[f['p']['Hips']*metres_per_unit for f in frames]
        xyz=[mean_filter([p[k] for p in root],radius) for k in range(3)]
        positions=[Vector((xyz[0][i],xyz[1][i],xyz[2][i])) for i in range(n)]
        speed=[0.0]+[(positions[i]-positions[i-1]).xy.length*fps for i in range(1,n)]
        speed[0]=speed[1];speed=mean_filter(speed,radius)
        yaw=[]
        for f in frames:
            forward=f['r']['Hips']@Vector((0,-1,0));angle=math.atan2(forward.x,-forward.y)
            if yaw:
                while angle-yaw[-1]>math.pi:angle-=math.tau
                while angle-yaw[-1]<-math.pi:angle+=math.tau
            yaw.append(angle)
        yaw=mean_filter(yaw,radius)
        yawrate=[0.0]+[(yaw[i]-yaw[i-1])*fps for i in range(1,n)]
        contacts={};contact_intervals={}
        for side,foot,toe in [('L','LeftFoot','LeftToeBase'),('R','RightFoot','RightToeBase')]:
            a=[f['p'][foot]*metres_per_unit for f in frames]
            b=[f['p'][toe]*metres_per_unit for f in frames]
            low=[min(a[i].z,b[i].z) for i in range(n)]
            v=[0.0]+[min((a[i]-a[i-1]).length,(b[i]-b[i-1]).length)*fps for i in range(1,n)]
            v=mean_filter(v,radius)
            window=round(fps*.16)
            localfloor=[min(low[max(0,i-window):min(n,i+window+1)]) for i in range(n)]
            flags=[low[i]<=localfloor[i]+.025 and v[i]<.32 for i in range(n)]
            contacts[side]=flags
            contact_intervals[side]=[{'bvh_zero_based_inclusive':[a+1,b+1],
                'time_s':[a*dt,b*dt]} for a,b in runs(flags,gap=round(fps*.025),minimum=round(fps*.08))]
        def crop(a,b,kind):
            a=max(0,a);b=min(n-1,b)
            return {'kind':kind,'bvh_zero_based_inclusive':[a+1,b+1],
                'native_amc_one_based_inclusive':[a+1,b+1],
                'time_s':[a*dt,b*dt],'duration_s':(b-a)*dt,
                'root_horizontal_path_m':sum((positions[j]-positions[j-1]).xy.length for j in range(a+1,b+1)),
                'root_net_horizontal_m':(positions[b]-positions[a]).xy.length,
                'root_vertical_change_m':positions[b].z-positions[a].z,
                'pelvis_heading_change_deg':math.degrees(yaw[b]-yaw[a]),
                'contact_at_start':{s:bool(contacts[s][a]) for s in contacts},
                'contact_at_end':{s:bool(contacts[s][b]) for s in contacts}}
        turns=[]
        for a,b in runs([abs(v)>math.radians(15) for v in yawrate],gap=round(fps*.2),minimum=round(fps*.12)):
            a=max(0,a-round(fps*.1));b=min(n-1,b+round(fps*.1))
            if abs(yaw[b]-yaw[a])>=math.radians(20):turns.append(crop(a,b,'measured turning candidate'))
        rest=runs([v<.12 for v in speed],gap=round(fps*.04),minimum=round(fps*.22))
        stops=[crop(max(0,a-round(fps*.6)),min(n-1,b),'deceleration into kinematic rest candidate')
               for a,b in rest if a>round(fps*.4) and max(speed[max(0,a-round(fps*.6)):a])>.25]
        starts=[crop(a,min(n-1,b+round(fps*.65)),'kinematic rest into acceleration candidate')
                for a,b in rest if b<n-round(fps*.4) and max(speed[b:min(n,b+round(fps*.65))])>.25]
        hand_tracks=[]
        for i in range(0,n,max(1,round(fps*.25))):
            hands={side:list(frames[i]['p'][name]*metres_per_unit-root[i]) for side,name in [('L','LeftHand'),('R','RightHand')]}
            hand_tracks.append({'bvh_zero_based_frame':i+1,'time_s':i*dt,'root_z_m':root[i].z,'hands_relative_root_m':hands})
        amc_frames=[int(x.strip()) for x in (OUT/(clip+'.amc')).read_text().splitlines() if x.strip().isdigit()]
        assert len(amc_frames)==n,('Native/BVH sample mismatch',clip,len(amc_frames),n)
        hand_extrema={}
        for side,name in [('L','LeftHand'),('R','RightHand')]:
            low=min(range(n),key=lambda i:frames[i]['p'][name].z)
            high=max(range(n),key=lambda i:frames[i]['p'][name].z)
            hand_extrema[side]={'minimum_world_height_m':frames[low]['p'][name].z*metres_per_unit,
                'minimum_bvh_zero_based_frame':low+1,'maximum_world_height_m':frames[high]['p'][name].z*metres_per_unit,
                'maximum_bvh_zero_based_frame':high+1}
        action_metrics=None
        if clip=='143_10':
            baseline=sum(p.z for p in root[:round(fps*.3)])/round(fps*.3)
            lean=[]
            relative={side:[(f['p'][name]-f['p']['Hips']).z*metres_per_unit for f in frames]
                      for side,name in [('L','LeftHand'),('R','RightHand')]}
            for f in frames:
                forward=f['r']['Hips']@Vector((0,-1,0));forward.z=0;forward.normalize()
                trunk=f['p']['Neck']-f['p']['Hips']
                lean.append(math.degrees(math.atan2(trunk.dot(forward),trunk.z)))
            def keyframe(i):
                return {'bvh_zero_based_frame':i+1,'native_amc_one_based_frame':i+1,'time_s':i*dt,
                    'hips_world_height_m':root[i].z,'hips_drop_from_initial_baseline_m':baseline-root[i].z,
                    'trunk_forward_lean_deg':lean[i],
                    'hands_relative_pelvis_height_m':{s:relative[s][i] for s in relative},
                    'hands_world_height_m':{s:relative[s][i]+root[i].z for s in relative},
                    'kinematic_contact_candidate':{s:bool(contacts[s][i]) for s in contacts}}
            lowhip=min(range(n),key=lambda i:root[i].z)
            maxlean=max(range(n),key=lambda i:lean[i])
            extrema={s:{'minimum_relative_height':keyframe(min(range(n),key=lambda i:relative[s][i])),
                        'maximum_relative_height':keyframe(max(range(n),key=lambda i:relative[s][i]))}
                     for s in relative}
            action_metrics={'initial_hips_baseline_m':baseline,'minimum_hips':keyframe(lowhip),
                'maximum_forward_lean':keyframe(maxlean),'relative_hand_extrema':extrema,
                'selected_keyframes':[keyframe(i-1) for i in [121,141,161,181,182,201,221,241,341,361,381,395,411,431,451,471]],
                'pickup_candidate':crop(120,240,'walk-into-left-hand pickup body reference'),
                'limits':['The measured ground reach is performed by source LeftHand. Existing right-hand jug grasp requires deliberate mirroring/side swap or authored right-arm adaptation.',
                    'The source pickup includes forward root travel and changing foot support. Reversing the whole clip would reverse walking, not produce a valid stationary setdown.',
                    'A reverse of isolated upper-body reach with authored planted legs, workspace hand constraints and prop attachment timing is an authored setdown adaptation, not captured setdown.']}
        report={'id':clip,'official_label':label,'official_index':'https://mocap.cs.cmu.edu/search.php?subjectnumber='+clip.split('_')[0],
            'bvh_sha256':sha(OUT/(clip+'.bvh')),'amc_sha256':sha(OUT/(clip+'.amc')),
            'captured_samples':n,'bvh_header_fps':1/capture.dt,'effective_fps':fps,
            'fps_basis':'CMU official subject index, native AMC sample count matches BVH excluding added T-pose',
            'timing_override_required':abs(1/capture.dt-fps)>1,
            'source_metres_per_unit':metres_per_unit,'source_metres_basis':'Official CMU info: (1/0.45)*2.54 centimetres per source unit',
            'whole_capture':crop(0,n-1,'all capture samples, added T-pose excluded'),
            'turn_candidates':turns,'start_candidates':starts,'stop_candidates':stops,
            'measured_hand_height_extrema':hand_extrema,
            'body_action_metrics':action_metrics,
            'kinematic_contact_candidates':contact_intervals,'quarter_second_hand_root_samples':hand_tracks,
            'limits':['Contacts inferred from smoothed ankle/toe displacement and local-height minima; not measured force or a retargeted foot sole.',
                'Coordinates use existing parser conversion: reflected X; Y-up/+Z travel becomes Z-up/-Y travel. Signed yaw must be mapped deliberately at retarget.',
                'Raw capture does not provide a tracked historical prop, finger grasp, age-specific performance or verified load mass.']}
        results.append(report)
        with (OUT/(clip+'-measurements.csv')).open('w',newline='') as stream:
            writer=csv.writer(stream);writer.writerow(['bvh_zero_based_frame','time_s','root_x_m','root_y_m','root_z_m','pelvis_heading_deg','horizontal_speed_m_s','contact_proxy_L','contact_proxy_R'])
            for i,p in enumerate(positions):writer.writerow([i+1,i*dt,*p,math.degrees(yaw[i]),speed[i],int(contacts['L'][i]),int(contacts['R'][i])])
        print('REFERENCE_ANALYZED',clip,n,fps,json.dumps(report['whole_capture']),flush=True)
        del capture,frames
        gc.collect()
    unchanged=all(sha(OUT/name)==value for name,value in source_before.items())
    assert unchanged,'Reference source changed during analysis'
    output={'schema_version':1,'source_files_unchanged':unchanged,'verified_source_sha256':source_before,'analysis_method':'read-only existing BVH parser; added T-pose skipped; source units; official per-subject FPS; deterministic kinematic heuristics',
        'clips':results,'limits':['Crop candidates require visual review before production use; no claim of force-derived contact.','Source dates, objects and labels do not establish first-century historical gesture or wardrobe authenticity.']}
    (OUT/'measurements.json').write_text(json.dumps(output,indent=2)+'\n')


def select_references():
    measured=json.loads((OUT/'measurements.json').read_text())
    by_id={m['id']:m for m in measured['clips']}
    requests=[
        ('turn-left-45-partial','16_17',148,296,'Partial interval of an officially labelled 90-degree turn, measured about 45 degrees. Not a separate native 45-degree capture.'),
        ('turn-left-90','16_17',148,451,'Moving left turn. Retain or deliberately remap root path and foot contacts.'),
        ('turn-right-90','16_19',1,410,'Moving right turn, not in-place rotation.'),
        ('turn-around-180','36_02',1139,1441,'Compact stepping turn, no jumping; both-foot contact candidates at endpoints.'),
        ('walk-stop-right-support','16_33',170,285,'Captured walking deceleration into rest; not a captured start.'),
        ('stairs-ascent','83_27',541,901,'Ascending stair section with changing ground level; not a fixed-floor walk cycle.'),
        ('step-forward-down','83_08',121,361,'One medium forward step down; not a full stair-descent recording.'),
        ('market-right-hand-reach','79_16',301,421,'Market-labelled body/right-hand reach and return. Object/coin/finger contacts must be authored.'),
        ('waist-height-two-hand-transfer','79_25',121,421,'Mostly stationary waist-height two-hand body reference; no verified mass or ground pickup.'),
        ('walk-into-left-hand-pickup','143_10',121,241,'Walking pickup body motion includes substantial heading/root change; left-side reach, not the existing right-hand jug grasp.'),
        ('second-lower-and-rise','143_10',341,471,'Second lower/recovery event; potential setdown adaptation seed. Catalog label does not establish this as captured setdown.'),
        ('planted-lower-recovery-core','143_10',375,425,'Short core with both-foot kinematic contact candidates; blend into authored stationary action, do not reverse whole walking capture.'),
    ]
    crops=[]
    for name,clip,a,b,note in requests:
        meta=by_id[clip];rows=list(csv.DictReader((OUT/(clip+'-measurements.csv')).open()))
        A=rows[a-1];B=rows[b-1]
        xy=lambda row:[float(row['root_x_m']),float(row['root_y_m'])]
        crops.append({'id':name,'source_clip':clip,'official_label':meta['official_label'],
            'bvh_file':str((OUT/(clip+'.bvh')).relative_to(ROOT)),'bvh_sha256':meta['bvh_sha256'],
            'native_amc_sha256':meta['amc_sha256'],'official_index':meta['official_index'],
            'bvh_zero_based_inclusive':[a,b],'native_amc_one_based_inclusive':[a,b],
            'effective_fps':meta['effective_fps'],'bvh_header_fps':meta['bvh_header_fps'],
            'timing_override_required':meta['timing_override_required'],
            'time_s':[(a-1)/meta['effective_fps'],(b-1)/meta['effective_fps']],
            'duration_s':(b-a)/meta['effective_fps'],
            'root_horizontal_path_m':sum(math.dist(xy(rows[i-1]),xy(rows[i])) for i in range(a,b)),
            'root_net_horizontal_m':math.dist(xy(A),xy(B)),
            'root_vertical_change_m':float(B['root_z_m'])-float(A['root_z_m']),
            'pelvis_heading_change_deg':float(B['pelvis_heading_deg'])-float(A['pelvis_heading_deg']),
            'contact_at_start':{s:bool(int(A['contact_proxy_'+s])) for s in ['L','R']},
            'contact_at_end':{s:bool(int(B['contact_proxy_'+s])) for s in ['L','R']},'interpretation':note})
    existing=[]
    for clip in ['07_01','07_04']:
        path=ROOT/'assets/blender/jerusalem-pilot/reference'/(clip+'.bvh')
        existing.append({'file':str(path.relative_to(ROOT)),'sha256':sha(path),
                         'role':'ordinary walking reference' if clip=='07_01' else 'slow walking reference, not elderly capture'})
    result={'schema_version':1,'source': 'CMU Graphics Lab Motion Capture Database; pinned Bruce Hahne BVH conversion',
        'rights_source':'https://mocap.cs.cmu.edu/faqs.php',
        'permission_summary':'CMU permits copying/modification/redistribution; converter adds no restriction. This is a permission notice, not CC0 or a named SPDX license.',
        'credit':'CMU Graphics Lab; mocap.cs.cmu.edu; NSF EIA-0196217; BVH conversion Bruce Hahne (2010).',
        'first_frame_note':'BVH index0 is an added T-pose. Native AMC frame1 maps to BVH zero-based index1. Crops exclude index0.',
        'existing_walk_references_read_only':existing,'selected_crops':crops,
        'authored_adaptation_required':['Fingers/thumb rotations are synthetic editing joints, not captured; author every grasp and prop attachment.',
            'Use original CMU79 index60Hz instead of converter120Hz header; do not rewrite original reference files.',
            'There is no verified elderly performer, historical Jerusalem actor, jug load, receiving coin or period wardrobe capture here.',
            'A dedicated ordinary StartWalk is not established by these references; any blend from stance into locomotion remains authored.',
            'Reverse only an intentionally isolated/reconstrained reach for setdown; reversing full pickup reverses its walking/root turn.',
            'Modern toolbox/market body motions require authored historical prop and workspace contacts; source label does not establish historical authenticity.']}
    (OUT/'selected-crops.json').write_text(json.dumps(result,indent=2)+'\n')
    print('REFERENCE_SELECTIONS',len(crops),flush=True)


def main():
    args = sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else sys.argv[1:]
    parser = argparse.ArgumentParser()
    parser.add_argument('--fetch-indexes',action='store_true')
    parser.add_argument('--fetch-clips',action='store_true')
    parser.add_argument('--analyze',action='store_true')
    parser.add_argument('--select',action='store_true')
    options = parser.parse_args(args)
    if options.fetch_indexes:
        items = [('cmu-subject'+s+'.html','http://mocap.cs.cmu.edu/search.php?subjectnumber='+s,'official clip index')
                 for s in ['16','36','83','13','79','106','91','143']]
        items += [('cmu-faq.html','http://mocap.cs.cmu.edu/faqs.php','official permission'),
                  ('cmu-info.html','http://mocap.cs.cmu.edu/info.php','official units and method'),
                  ('READMEFIRST.txt',MIRROR+'/READMEFIRST.txt','BVH converter permission')]
        fetch(items)
    if options.fetch_clips:
        subjects = sorted(set(clip.split('_')[0] for clip in CLIPS))
        items = [(s+'.asf','http://mocap.cs.cmu.edu/subjects/'+s+'/'+s+'.asf','official original skeleton') for s in subjects]
        for clip in CLIPS:
            subject = clip.split('_')[0]
            items.append((clip+'.amc','http://mocap.cs.cmu.edu/subjects/'+subject+'/'+clip+'.amc','official original motion'))
            items.append((clip+'.bvh',MIRROR+'/data/'+subject.zfill(3)+'/'+clip+'.bvh','pinned BVH conversion'))
        fetch(items)
    if options.analyze:
        analyze()
    if options.select:
        select_references()


if __name__ == '__main__':
    main()
