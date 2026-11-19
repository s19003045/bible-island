import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const root=new URL('../',import.meta.url),runtime={};
const report=JSON.parse(await readFile(new URL('assets/blender/build-report.json',root),'utf8'));
const common=['Idle','Walk','Talk','Listen','Interact','LookAround','StartWalk','StopWalk','TurnLeft','TurnRight','StartWalkL','StartWalkR','StopWalkL','StopWalkR','TurnLeft45','TurnRight45','TurnLeft90','TurnRight90','TurnLeft180','TurnRight180','StairUp','StairDown'];
async function verifiedFile(meta){
  const b=await readFile(new URL('public/'+meta.file,root)),sha=createHash('sha256').update(b).digest('hex');
  if(sha!==meta.sha256)throw Error(meta.file+' metadata/hash mismatch');
  const doc=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString());
  const triangles=doc.meshes.reduce((n,m)=>n+m.primitives.reduce((a,p)=>a+(doc.accessors[p.indices??p.attributes.POSITION].count/3),0),0);
  return {b,sha,doc,triangles};
}
for(const role of ['resident','carrier','elder']){
  const meta=JSON.parse(await readFile(new URL(`assets/blender/jerusalem-life/${role}-motion.json`,root),'utf8'));
  const {b,sha,doc,triangles}=await verifiedFile(meta);
  const required=[...common,...({resident:['Inspect','Receive','CarrySmall','PlaceSmall'],carrier:['SetDown','Fill','PickUp','Pour'],elder:['Arrange','Offer']}[role])];
  for(const name of required)if(!doc.animations.some(a=>a.name===name)||!meta.lifeClips[name])throw Error(role+' missing real clip '+name);
  const handContacts={};
  for(const [name,clip] of Object.entries(meta.lifeClips)){
    handContacts[name]=Object.entries(clip.handContact||{}).flatMap(([side,windows])=>windows.map(window=>({side,window,handSocket:meta.handSockets[side].socketBone,
      targetSocket:role==='carrier'?(side==='R'?'jugGripR':'dipperGripL'):'parcelGrip'+side,
      handRotationSamples:clip.gripOrientationSamples?.[side]})));
  }
  const d={type:'character',src:meta.file,baseModelId:meta.baseModelId,height:meta.height_m,ankleHeight:meta.ankle_height_m,
    cycleDistance:meta.cycle_distance_m,walkDuration:meta.cycle_seconds,motionVersion:4,motionProfile:role,
    triangleBudget:130000,byteBudget:16000000,lifeClips:meta.lifeClips,handContacts,carryBones:meta.props?.parcel?.carryBones,
    props:meta.props,attention:meta.attention,secondaryCloth:meta.secondaryCloth,walkContact:meta.walkContact,clipContacts:meta.clipContacts,
    motionSource:'CMU human motion reference with authored role/work adaptations; not ancient motion capture'};
  runtime[meta.id]=d;
  report.assets[meta.id]={file:meta.file,bytes:b.length,sha256:sha,triangles,animations:doc.animations.map(a=>a.name),motion_version:4,editable_source:meta.editable_source.file};
  for(const [kind,prop] of Object.entries(meta.staticProps||{})){
    const {b,sha,triangles}=await verifiedFile(prop),id='jerusalem-life-'+kind;
    runtime[id]={type:'object',src:prop.file,height:prop.actorLocalBounds.maximum[1]-prop.actorLocalBounds.minimum[1],triangleBudget:20000,byteBudget:1000000};
    report.assets[id]={file:prop.file,bytes:b.length,sha256:sha,triangles,animations:[],editable_source:meta.editable_source.file};
  }
}
await writeFile(new URL('src/jerusalem-life-assets.js',root),'// Generated from actual exported life-pilot GLBs by scripts/prepare-life-motion.mjs.\nexport const jerusalemLifeAssets = '+JSON.stringify(runtime,null,2)+';\n');
await writeFile(new URL('assets/blender/build-report.json',root),JSON.stringify(report,null,2)+'\n');
console.log('Prepared '+Object.keys(runtime).length+' verified life assets');
