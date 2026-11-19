"""Read-only structural/source verification for the frozen Jerusalem pilot.
Writes only the new thin asset report, never GLBs, blends, runtime or manifests.
"""
import pathlib,json,hashlib,struct,math
ROOT=pathlib.Path(__file__).resolve().parents[2];META=ROOT/'assets/blender/jerusalem-life'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def glb(path):
 data=path.read_bytes();assert data[:4]==b'glTF' and struct.unpack_from('<I',data,8)[0]==len(data);size=struct.unpack_from('<I',data,12)[0];return json.loads(data[20:20+size]),data[28+size:]
def accessor(doc,blob,index):
 a=doc['accessors'][index];v=doc['bufferViews'][a['bufferView']];component={5120:('b',1),5121:('B',1),5122:('h',2),5123:('H',2),5125:('I',4),5126:('f',4)}[a['componentType']];n={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[a['type']];fmt='<'+component[0]*n;start=v.get('byteOffset',0)+a.get('byteOffset',0);stride=v.get('byteStride',n*component[1]);return [struct.unpack_from(fmt,blob,start+i*stride)for i in range(a['count'])]
def verify():
 assets={};checks=[]
 def check(ok,label):checks.append({'pass':bool(ok),'check':label})
 for role in ['resident','carrier','elder']:
  meta=json.loads((META/(role+'-motion.json')).read_text());path=ROOT/'public'/meta['file'];source=ROOT/meta['editable_source']['file'];doc,blob=glb(path);weighted={};triangles=0;maxWeightError=0.;vertices=0
  for node in doc['nodes']:
   if 'mesh' not in node:continue
   for p in doc['meshes'][node['mesh']]['primitives']:
    triangles+=doc['accessors'][p['indices']]['count']//3;vertices+=doc['accessors'][p['attributes']['POSITION']]['count']
    if 'skin'not in node:continue
    skin=doc['skins'][node['skin']];joints=accessor(doc,blob,p['attributes']['JOINTS_0']);weights=accessor(doc,blob,p['attributes']['WEIGHTS_0'])
    for js,ws in zip(joints,weights):
     maxWeightError=max(maxWeightError,abs(sum(ws)-1))
     for j,w in zip(js,ws):
      if w>1e-5:name=doc['nodes'][skin['joints'][j]]['name'];weighted[name]=weighted.get(name,0)+1
  check(sha(path)==meta['sha256'],role+' actual GLB SHA');check(sha(source)==meta['editable_source']['sha256'],role+' editable source SHA');check(max(path.stat().st_size,source.stat().st_size)<32*1024*1024,role+' each object below32MiB');check(triangles<130000,role+' near-view130k triangle budget');check(maxWeightError<.00001,role+' real skin weights normalized')
  check(any(n.get('extras',{}).get('life_tunic_cap_revision')==2 for n in doc['nodes']),role+' repaired sleeve opening revision2')
  required=['clavicleL','clavicleR','spine','spineUpper','chest','jaw','eyeL','eyeR','lidL','lidR','toeL','toeR']+[f'{kind}{side}{i}{s}'for side in ['L','R']for kind in ['finger']for i in range(4)for s in ['A','B','C']]+[f'thumb{side}{s}'for side in ['L','R']for s in ['A','B','C']]
  check(all(weighted.get(n,0)>0 for n in required),role+' actual weighted anatomy and face joints')
  names=[a['name']for a in doc['animations']];check(set(names)==set(meta['lifeClips']),role+' actual clip names match metadata')
  durationErrors=[]
  for a in doc['animations']:
   duration=max(accessor(doc,blob,s['input'])[-1][0]for s in a['samplers']);durationErrors.append(abs(duration-meta['lifeClips'][a['name']]['duration']))
  check(max(durationErrors)<.0001,role+' actual clip durations match')
  statics=meta.get('staticProps',{})
  for name,item in statics.items():check(sha(ROOT/'public'/item['file'])==item['sha256'],role+' '+name+' static prop SHA')
  assets[role]={k:meta[k]for k in ['id','baseModelId','file','bytes','sha256','height_m','motionProfile','cycle_distance_m','cycle_seconds','editable_source','attention','staticProps','continuity']};assets[role].update(animations=names,actualTriangles=triangles,actualVertices=vertices,actualWeightedVertices=weighted,maximumSkinWeightSumError=maxWeightError,maximumDurationError=max(durationErrors),metadataFile=str((META/(role+'-motion.json')).relative_to(ROOT)))
 preserved={}
 for folder in ['human-rollout','jerusalem-pilot']:
  previous=json.loads((ROOT/'assets/blender'/folder/'build-report.json').read_text())
  for name,item in previous['assets'].items():
   candidates=[(item['file'],item['sha256'])]
   if item.get('original_file'):candidates.append((item['original_file'],item['original_glb_sha256']))
   for rel,expected in candidates:actual=sha(ROOT/'public'/rel);preserved['public/'+rel]=actual;check(actual==expected,'preserved '+rel)
 for rel,expected in [('assets/blender/bible-assets.blend',json.loads((ROOT/'assets/blender/human-rollout/build-report.json').read_text())['source_shared_blend_sha256']),('assets/blender/jerusalem-pilot.blend',next(iter(assets.values()))and json.loads((META/'resident-motion.json').read_text())['original_pilot_source_sha256'])]:actual=sha(ROOT/rel);preserved[rel]=actual;check(actual==expected,'preserved '+rel)
 report={'schema_version':1,'status':'runtime-verified-pilot','frozen':True,'scope':'Three Jerusalem roles only; user visual acceptance precedes any all-island rollout.','assets':assets,'checks':checks,'allStructuralChecksPass':all(c['pass']for c in checks),'preservedInputs':preserved,'sourceScripts':{str(p.relative_to(ROOT)):sha(p)for p in sorted((ROOT/'scripts/blender').glob('jerusalem-life*.py'))},'integrationEvidence':{'owner':'root integration agent','testsFile':'tests/jerusalem-life-assets.test.js','assetScenariosPassed':6,'runtimeReviewFile':'assets/blender/jerusalem-life/runtime-review.json','limits':'Finite sampled CPU skinning and runtime routes plus WebGL review; not a continuous intersection proof for every mesh triangle.'},'authoringLimits':['Actual CMU07 adult walk/slow-walk retargets; role/age are authored adaptations, not recorded carriers or elders.','Turn yaw timing is recorded reference; planted feet are authored. Starts/stops and work contacts are authored from the documented references.','Stairs use CMU83 swing envelope with07gait and explicit9cm/.225 two-step normalization, not an unmodified recorded stair sequence.','Cloth has real thickness and skinned folds, not fabric simulation. Jaw is small speech-state motion, not phoneme lip synchronization.']}
 (META/'build-report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'checks':len(checks),'allPass':report['allStructuralChecksPass'],'assets':{r:{'sha256':a['sha256'],'triangles':a['actualTriangles'],'clips':len(a['animations'])}for r,a in assets.items()}}));return report
if __name__=='__main__':verify()
