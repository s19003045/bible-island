import {upgradedModelFor} from '../src/human-motion-data.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createHistoricalScene} from '../src/historical-scenes.js';
import {intertestamentSegments as chapters,intertestamentFloor as floor,intertestamentObjects as objects,intertestamentPOIs as pois} from '../src/intertestament-exploration.js';
import {intertestamentPeople as people} from '../src/intertestament-content.js';
import {createWalkControls} from '../src/walk-controls.js';
import {createCharacterController} from '../src/character-controller.js';
import {setNarrativeChapter,stateChapter,narrativeChapterPicker} from '../src/narrative-chapters.js';
import {personForMode,freshLearning,learningEvent,learningRecord} from '../src/learning-model.js';
import {learningComparison} from '../src/learning-ui.js';
import {peopleMarkup} from '../src/people-ui.js';
import {freshMission} from '../src/walk-data.js';
import {blenderModels} from '../src/blender-manifest.js';
import {setArtifactSeparation} from '../src/artifact-inspection.js';
import {createVessel} from '../src/vessels.js';
import {themeById} from '../src/content.js';
const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});
globalThis.document=Object.assign(new EventTarget(),{createElement:()=>({getContext:()=>ctx}),querySelector:()=>null,activeElement:null});globalThis.window=new EventTarget();
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
const load=async id=>{const b=await readFile(new URL('../public/'+blenderModels[id].src,import.meta.url));return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};

test('three separate New Testament settings show only their intended resident and observation object',()=>{
 assert.deepEqual(themeById.get('intertestament').stops.map(s=>s.id),['road','coin','scroll']);
 const markers=['intertestament-rural-road-context','intertestament-generic-public-forecourt','intertestament-speaking-audiences-context'];
 for(const [i,c] of chapters.entries()){
  const s=createHistoricalScene('intertestament',null,{segment:c.id});assert.equal(s.segment,c.id);assert.deepEqual(s.people.map(p=>p.id),[c.person]);assert.equal(s.npcSystem.agents.length,13);assert.equal(s.objects.length,1);assert.equal(s.objects[0].segment,c.id);
  for(const [j,name] of markers.entries())assert.equal(!!s.scene.getObjectByName(name),i===j);assert.equal(!!s.scene.getObjectByName('intertestament-original-background-steps'),c.id==='scroll');
  const m=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),scale=new THREE.Vector3();s.scene.traverse(o=>{if(!o.isMesh)return;assert.ok(o.geometry.attributes.position.array.every(Number.isFinite));if(o.isInstancedMesh)for(let j=0;j<o.count;j++){o.getMatrixAt(j,m);m.decompose(p,q,scale);assert.ok([scale.x,scale.y,scale.z].every(n=>Number.isFinite(n)&&n>0));}});
  assert.ok(s.walkModel.valid(c.spawn[0],c.spawn[2]));for(const poi of pois(c.id))for(const slot of poi.slots)assert.ok(s.walkModel.valid(slot[0],slot[2]));assert.ok(s.walkModel.path(c.spawn,s.objects[0].approach).length>1);assert.equal(s.walkModel.valid(1,-38),false,'background steps are not an invented barracks tour');s.dispose();
 }
});

test('the rural dry drain has real lowered terrain and the public ground remains on the smooth collision surface',()=>{
 const s=createHistoricalScene('intertestament',null,{segment:'road'}),ground=s.scene.getObjectByName('intertestament-public-ground');s.scene.updateMatrixWorld(true);
 const y=(x,z)=>new THREE.Raycaster(new THREE.Vector3(x,10,z),new THREE.Vector3(0,-1,0)).intersectObject(ground)[0]?.point.y;
 assert.ok(y(-22,5)-y(-25,5)>.75);for(const [x,z] of [[-10,3],[12,18],[22,-10]])assert.ok(Math.abs(y(x,z)-floor('road',x,z))<.012);s.dispose();
});

test('chapter selection and three modes keep other islands and their notes independent',()=>{
 const state={selected:'intertestament',mode:'child',narrativeSegments:{paul:'letter'},mission:freshMission(),learning:freshLearning(),explorationSeen:{paul:['paul-textiles']}};
 for(const c of chapters){assert.ok(setNarrativeChapter(state,'intertestament',c.id));assert.equal(stateChapter(state),c.id);assert.equal((peopleMarkup(state).match(/data-person=/g)||[]).length,1);const nav=narrativeChapterPicker('intertestament',c.id);assert.equal((nav.match(/data-narrative-segment=/g)||[]).length,3);if(c.id==='scroll'){assert.match(nav,/ACT\.21\.37-40\.CSBT/);assert.match(nav,/ACT\.22\.1-2\.CSBT/);}}
 assert.equal(stateChapter(state,'paul'),'letter');assert.deepEqual(state.explorationSeen.paul,['paul-textiles']);assert.match(learningComparison({...state,mode:'study'}),/保羅宣教之旅/);
 let data=learningEvent(freshLearning(),'paul','study',{type:'note',text:'保留札記'}).data;data=learningEvent(data,'intertestament','study',{type:'inspect',id:'road'}).data;data=learningEvent(data,'intertestament','study',{type:'answer',id:'road',choice:'reconstruction'}).data;assert.deepEqual(learningRecord(data,'intertestament','study').completed,['road']);assert.deepEqual(learningRecord(data,'intertestament','child').completed,[]);assert.equal(learningRecord(data,'paul','study').note,'保留札記');
});

test('three crowds retain individual clocks, POI capacities, social distances and occasional conversations over 360 seconds',()=>{
 for(const c of chapters){const s=createHistoricalScene('intertestament',null,{segment:c.id}),n=s.npcSystem;assert.equal(new Set(n.agents.map(a=>a.seed)).size,13);assert.equal(new Set(n.agents.map(a=>a.timer)).size,13);let social=false;
  for(let f=0;f<7200;f++){n.update(.05,{player:c.spawn});for(const [i,a] of n.agents.entries()){const p=a.actor.state.position;assert.ok(s.walkModel.valid(p[0],p[2]));assert.ok(Math.abs(p[1]-floor(c.id,p[0],p[2]))<.001);assert.ok(a.speedFactor>=.85&&a.speedFactor<=1.15);assert.ok(distance(p,c.spawn)>=a.radius+.32+.024);social ||=!!a.partner;for(const b of n.agents.slice(i+1))assert.ok(distance(p,b.actor.state.position)>=a.radius+b.radius+.024);}for(const p of n.pois)assert.ok(n.reservations.get(p.id).size<=p.capacity);}
  assert.ok(n.agents.every(a=>a.visits.size>=2));assert.ok(social);s.dispose();
 }
});

test('player routes through the moving crowds complete and continuous descending ground stays snapped at 30, 60 and 120 fps',()=>{
 for(const c of chapters){const s=createHistoricalScene('intertestament',null,{segment:c.id}),n=s.npcSystem;for(let i=0;i<1600;i++)n.update(.05);const canvas=Object.assign(new EventTarget(),{focus(){}}),walk=createWalkControls(new THREE.PerspectiveCamera(),canvas,{constrainMove:(a,b)=>n.constrainPlayer(a,b),navigationObstacles:()=>n.agents.map(a=>({position:a.actor.state.position,radius:a.radius+.32+.07}))}),spawn=n.safePlayerSpawn(c.spawn),destination=s.objects[0].approach;assert.ok(spawn);walk.start(s.walkModel,spawn);assert.ok(walk.navigate(destination));
  for(let i=0;i<4800&&distance(walk.position,destination)>.65;i++){n.update(.05,{player:walk.position});walk.update(.05);assert.ok(walk.groundState.isGrounded);for(const a of n.agents)assert.ok(distance(walk.position,a.actor.state.position)>=a.radius+.32+.024);}assert.ok(distance(walk.position,destination)<.65,c.id+' route completes');walk.dispose();
  for(const fps of [30,60,120]){const motor=createCharacterController(s.walkModel);motor.reset([17,floor(c.id,17,23),23]);const start=motor.position[1];let previous=motor.visualPosition[1];for(let i=0;i<fps*12;i++){const dz=-1.7/fps;motor.update(1/fps,0,dz*motor.speedFactor(0,dz));assert.ok(motor.state.isGrounded);assert.ok(Math.abs(motor.visualPosition[1]-previous)<.035);previous=motor.visualPosition[1];}assert.ok(motor.position[1]<start-.03);}s.dispose();
 }
});

test('actual GLB objects can be seen from every approach without an architectural occluder',async()=>{
 for(const c of chapters){const s=createHistoricalScene('intertestament',null,{segment:c.id,blenderAssets:true,assetLoader:load});await s.objects[0].root.userData.assetReady;await s.detailedResidents.ready;s.scene.updateMatrixWorld(true);const o=s.objects[0],eye=new THREE.Vector3(...o.approach).add(new THREE.Vector3(0,1.62,0)),delta=new THREE.Vector3(...o.lookAt).sub(eye);assert.ok(distance(o.approach,o.position)<=3.2);const blockers=s.occluders.filter(mesh=>{for(let n=mesh;n;n=n.parent)if(n===o.root)return false;return true;});assert.equal(new THREE.Raycaster(eye,delta.clone().normalize(),.08,delta.length()).intersectObjects(blockers,false).length,0);s.dispose();}
});

test('two real GLB and fallback teaching layers lift in world metres and restore while the coin remains whole',async()=>{
 assert.equal(blenderModels['intertestament-coin'].articulation,undefined);
 for(const d of objects.filter(d=>d.id!=='intertestament-coin'))for(const root of [(await load(d.id)).scene,createVessel(d.id)]){const {part,offset}=blenderModels[d.id].articulation,p=root.getObjectByName(part);assert.ok(p);root.updateMatrixWorld(true);const start=p.getWorldPosition(new THREE.Vector3());assert.ok(setArtifactSeparation(root,part,offset));root.updateMatrixWorld(true);assert.ok(p.getWorldPosition(new THREE.Vector3()).distanceTo(start.clone().add(new THREE.Vector3(...offset)))<1e-6);setArtifactSeparation(root,part,[0,0,0]);root.updateMatrixWorld(true);assert.ok(p.getWorldPosition(new THREE.Vector3()).distanceTo(start)<1e-6);}
});

test('actual circular teaching disc has two relief faces, a true thick edge and real blank sheet support is stationary',async()=>{
 const coin=(await load('intertestament-coin')).scene;coin.updateMatrixWorld(true);const disc=coin.getObjectByName('intertestament-coin-observation-disc'),box=new THREE.Box3().setFromObject(disc),size=box.getSize(new THREE.Vector3());assert.ok(Math.abs(size.x-.23)<1e-6&&Math.abs(size.y-.23)<1e-6);assert.ok(size.z>.014);for(const sign of [-1,1])assert.ok(new THREE.Raycaster(new THREE.Vector3(0,.185,sign*.06),new THREE.Vector3(0,0,-sign),0,.12).intersectObject(disc,true).length>0);
 const lang=(await load('intertestament-languages')).scene;lang.updateMatrixWorld(true);const sheet=lang.getObjectByName('intertestament-languages-blank-curved-sheet'),cradle=lang.getObjectByName('intertestament-languages-fixed-roll-cradle');assert.ok(sheet&&cradle);const old=new THREE.Box3().setFromObject(cradle);setArtifactSeparation(lang,blenderModels['intertestament-languages'].articulation.part,[0,.14,0]);lang.updateMatrixWorld(true);assert.ok(new THREE.Box3().setFromObject(cradle).equals(old));const b=new THREE.Box3().setFromObject(sheet);assert.ok(b.max.y-b.min.y>.07);assert.ok(b.min.y>old.min.y&&b.min.y<=old.max.y+.002);
});

test('first-century resident models hold dialogue and keep a frozen frame without shared clocks',async()=>{
 for(const [i,c] of chapters.entries()){const s=createHistoricalScene('intertestament',null,{segment:c.id,blenderAssets:true,assetLoader:load});await s.detailedResidents.ready;const a=s.people[0],p=[...a.state.position];assert.equal(a.modelId,upgradedModelFor(['resident-worker','roman-woman','resident'][i]));assert.ok(s.npcSystem.agents.every(a=>['resident-worker','roman-woman','resident','resident-child'].map(upgradedModelFor).includes(a.actor.modelId)));s.converse(a.id);s.animate(.05,[p[0]+2,p[1]+2,p[2]+3]);assert.deepEqual(a.state.position,p);const clocks=s.npcSystem.agents.map(a=>a.actor.state.time),positions=s.npcSystem.agents.map(a=>[...a.actor.state.position]);s.animate(0,[31,20,25]);assert.deepEqual(s.npcSystem.agents.map(a=>a.actor.state.time),clocks);assert.deepEqual(s.npcSystem.agents.map(a=>a.actor.state.position),positions);s.dispose();}
});

test('all 24 recorded cues match authored and child-derived text, actual audio duration and source hashes',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../src/voice-manifest.json',import.meta.url))),provenance=JSON.parse(await readFile(new URL('../docs/review/INTERTESTAMENT-VOICE-PROVENANCE.json',import.meta.url)));
 for(const p of people){const expected={greeting:p.greeting};for(const t of p.topics){expected[t.id]=t.answer;if(t.followup)expected[t.id+'-followup']=t.followup.answer;}const child=personForMode(p,'intertestament','child');expected['child-greeting']=child.greeting;for(const t of child.topics){expected['child-'+t.id]=t.answer;expected['child-'+t.id+'-followup']=t.followup.answer;}const take=provenance.takes.find(t=>t.id===p.id),voice=manifest[p.id],bytes=await readFile(new URL('../public/'+voice.src,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),take.mp3_sha256);assert.equal(take.audio.original_characters.map(c=>c.text).join(''),take.request.text);assert.equal(take.request.speed,1);assert.equal(take.request.outputFormat,undefined);assert.equal(voice.duration,take.mp3_duration);assert.ok(bytes.length>1000000);assert.deepEqual(Object.keys(voice.clips).sort(),Object.keys(expected).sort());let previous=0;for(const [id,c] of Object.entries(voice.clips)){assert.equal(c.text,expected[id]);assert.deepEqual(c,take.clips[id]);assert.ok(c.start>=previous-.061&&c.end>c.start&&c.end<=voice.duration);previous=c.end;}}
});
