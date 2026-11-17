import {upgradedModelFor} from '../src/human-motion-data.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createHistoricalScene} from '../src/historical-scenes.js';
import {galileeSegments as chapters,galileeFloor as floor,galileeObjects as objects,galileePOIs as pois,galileeWalkConfig,galileeReadingPhases} from '../src/galilee-exploration.js';
import {galileePeople as people} from '../src/galilee-content.js';
import {createWalkControls} from '../src/walk-controls.js';
import {createCharacterController} from '../src/character-controller.js';
import {setNarrativeChapter,stateChapter,narrativeChapterPicker,setNarrativePhase,stateNarrativePhase} from '../src/narrative-chapters.js';
import {personForMode,freshLearning,learningEvent,learningRecord} from '../src/learning-model.js';
import {learningComparison} from '../src/learning-ui.js';
import {peopleMarkup} from '../src/people-ui.js';
import {freshMission} from '../src/walk-data.js';
import {blenderModels} from '../src/blender-manifest.js';
import {setArtifactSeparation} from '../src/artifact-inspection.js';
import {createVessel} from '../src/vessels.js';
import {createGalileeObject} from '../src/galilee-objects.js';
import {themeById} from '../src/content.js';
const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});
globalThis.document=Object.assign(new EventTarget(),{createElement:()=>({getContext:()=>ctx}),querySelector:()=>null,activeElement:null});globalThis.window=new EventTarget();
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
const load=async id=>{const b=await readFile(new URL('../public/'+blenderModels[id].src,import.meta.url));return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};

test('lake work, gathering and house access have distinct adult-scale contexts with reachable objects',()=>{
 assert.deepEqual(themeById.get('galilee').stops.map(s=>s.id),['boat','synagogue','house']);
 assert.match(themeById.get('galilee').book,/Mark 1:16-28;2:1-12;4:35-41/);
 const markers=['galilee-shore-work-context','galilee-gathering-context','galilee-house-access-context'];
 for(const [i,c] of chapters.entries()){
  const s=createHistoricalScene('galilee',null,{segment:c.id});assert.equal(s.segment,c.id);assert.deepEqual(s.people.map(p=>p.id),[c.person]);assert.equal(s.npcSystem.agents.length,13);assert.equal(s.objects.length,1);
  for(const [j,name] of markers.entries())assert.equal(!!s.scene.getObjectByName(name),i===j);
  const m=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),scale=new THREE.Vector3();s.scene.traverse(o=>{if(!o.isMesh)return;assert.ok(o.geometry.attributes.position.array.every(Number.isFinite));if(o.isInstancedMesh)for(let j=0;j<o.count;j++){o.getMatrixAt(j,m);m.decompose(p,q,scale);assert.ok([scale.x,scale.y,scale.z].every(n=>Number.isFinite(n)&&n>0));}});
  assert.ok(s.walkModel.valid(...[c.spawn[0],c.spawn[2]]));for(const poi of pois(c.id))for(const slot of poi.slots)assert.ok(s.walkModel.valid(slot[0],slot[2]));assert.ok(s.walkModel.path(c.spawn,s.objects[0].approach).length>1);s.dispose();
 }
});

test('phase memory, child observation and study answers keep other chapters, modes and island notes independent',()=>{
 const state={selected:'galilee',mode:'child',narrativeSegments:{nehemiah:'wall'},narrativePhases:{nehemiah:{wall:'proposal'}},mission:freshMission(),learning:freshLearning(),explorationSeen:{intertestament:['intertestament-coin']}};
 setNarrativeChapter(state,'galilee','boat');setNarrativePhase(state,'galilee','storm');setNarrativeChapter(state,'galilee','synagogue');setNarrativePhase(state,'galilee','rebuke');assert.equal(stateNarrativePhase(state),'rebuke');setNarrativeChapter(state,'galilee','boat');assert.equal(stateNarrativePhase(state),'storm');assert.equal(stateNarrativePhase(state,'nehemiah'),'proposal');
 for(const c of chapters){setNarrativeChapter(state,'galilee',c.id);assert.equal((peopleMarkup(state).match(/data-person=/g)||[]).length,1);const nav=narrativeChapterPicker('galilee',c.id,stateNarrativePhase(state));assert.equal((nav.match(/data-narrative-segment=/g)||[]).length,3);assert.equal((nav.match(/data-narrative-phase=/g)||[]).length,c.id==='boat'?5:3);}
 assert.deepEqual(state.explorationSeen.intertestament,['intertestament-coin']);assert.match(learningComparison({...state,mode:'study'}),/耶穌降生與成長/);
 let data=learningEvent(freshLearning(),'intertestament','study',{type:'note',text:'保留札記'}).data;assert.equal(learningEvent(data,'galilee','child',{type:'answer',id:'boat',choice:1}).feedback.kind,'blocked');data=learningEvent(data,'galilee','child',{type:'observe',id:'boat'}).data;data=learningEvent(data,'galilee','child',{type:'answer',id:'boat',choice:1}).data;assert.deepEqual(learningRecord(data,'galilee','child').completed,['boat']);assert.deepEqual(learningRecord(data,'galilee','general').completed,[]);assert.deepEqual(learningRecord(data,'galilee','study').completed,[]);assert.equal(learningRecord(data,'intertestament','study').note,'保留札記');
});

test('residents retain POI capacities, individual clocks, smooth travel and social distances during 360 seconds',()=>{
 for(const c of chapters){const s=createHistoricalScene('galilee',null,{segment:c.id}),n=s.npcSystem;assert.equal(new Set(n.agents.map(a=>a.seed)).size,13);assert.equal(new Set(n.agents.map(a=>a.timer)).size,13);let social=false;
  for(let f=0;f<7200;f++){n.update(.05,{player:c.spawn});for(const [i,a] of n.agents.entries()){const p=a.actor.state.position;assert.ok(s.walkModel.valid(p[0],p[2]));assert.ok(Math.abs(p[1]-floor(c.id,p[0],p[2]))<.001);assert.ok(a.speedFactor>=.85&&a.speedFactor<=1.15);assert.ok(distance(p,c.spawn)>=a.radius+.32+.024);social ||=!!a.partner;for(const b of n.agents.slice(i+1))assert.ok(distance(p,b.actor.state.position)>=a.radius+b.radius+.024);}for(const p of n.pois)assert.ok(n.reservations.get(p.id).size<=p.capacity);}
  assert.ok(n.agents.every(a=>a.visits.size>=2));assert.ok(social);s.dispose();
 }
});

test('player paths through crowds and 30/60/120fps descending ground stay grounded and visually smooth',()=>{
 for(const c of chapters){const s=createHistoricalScene('galilee',null,{segment:c.id}),n=s.npcSystem;for(let i=0;i<1600;i++)n.update(.05);const canvas=Object.assign(new EventTarget(),{focus(){}}),walk=createWalkControls(new THREE.PerspectiveCamera(),canvas,{constrainMove:(a,b)=>n.constrainPlayer(a,b),navigationObstacles:()=>n.agents.map(a=>({position:a.actor.state.position,radius:a.radius+.32+.07}))}),spawn=n.safePlayerSpawn(c.spawn),destination=s.objects[0].approach;assert.ok(spawn);walk.start(s.walkModel,spawn);assert.ok(walk.navigate(destination));
  for(let i=0;i<4800&&distance(walk.position,destination)>.65;i++){n.update(.05,{player:walk.position});walk.update(.05);assert.ok(walk.groundState.isGrounded);for(const a of n.agents)assert.ok(distance(walk.position,a.actor.state.position)>=a.radius+.32+.024);}assert.ok(distance(walk.position,destination)<.65);walk.dispose();
  for(const fps of [30,60,120]){const motor=createCharacterController(s.walkModel);motor.reset([17,floor(c.id,17,23),23]);const start=motor.position[1];let previous=motor.visualPosition[1];for(let i=0;i<fps*12;i++){const dz=-1.7/fps;motor.update(1/fps,0,dz*motor.speedFactor(0,dz));assert.ok(motor.state.isGrounded);assert.ok(Math.abs(motor.visualPosition[1]-previous)<.035);previous=motor.visualPosition[1];}assert.ok(motor.position[1]<start-.03);}s.dispose();
 }
});

test('actual GLB objects remain visible from approach and two vertical layers restore in GLB and fallback',async()=>{
 assert.equal(blenderModels['galilee-stones'].articulation,undefined);
 for(const c of chapters){const s=createHistoricalScene('galilee',null,{segment:c.id,blenderAssets:true,assetLoader:load});await s.objects[0].root.userData.assetReady;await s.detailedResidents.ready;s.scene.updateMatrixWorld(true);const o=s.objects[0],eye=new THREE.Vector3(...o.approach).add(new THREE.Vector3(0,1.62,0)),delta=new THREE.Vector3(...o.lookAt).sub(eye),blockers=s.occluders.filter(mesh=>{for(let n=mesh;n;n=n.parent)if(n===o.root)return false;return true;});assert.equal(new THREE.Raycaster(eye,delta.clone().normalize(),.08,delta.length()).intersectObjects(blockers,false).length,0);s.dispose();}
 for(const d of objects.filter(d=>d.id!=='galilee-stones'))for(const root of [(await load(d.id)).scene,createVessel(d.id)]){const {part,offset}=blenderModels[d.id].articulation,p=root.getObjectByName(part);assert.ok(p);root.updateMatrixWorld(true);const start=p.getWorldPosition(new THREE.Vector3());setArtifactSeparation(root,part,offset);root.updateMatrixWorld(true);assert.ok(p.getWorldPosition(new THREE.Vector3()).distanceTo(start.clone().add(new THREE.Vector3(...offset)))<1e-6);setArtifactSeparation(root,part,[0,0,0]);root.updateMatrixWorld(true);assert.ok(p.getWorldPosition(new THREE.Vector3()).distanceTo(start)<1e-6);}
});

test('ordinary first-century resident models stop for dialogue and freeze without a shared clock',async()=>{
 for(const [i,c] of chapters.entries()){const s=createHistoricalScene('galilee',null,{segment:c.id,blenderAssets:true,assetLoader:load});await s.detailedResidents.ready;const a=s.people[0],p=[...a.state.position];assert.equal(a.modelId,upgradedModelFor(['resident-worker','resident','roman-woman'][i]));s.converse(a.id);s.animate(.05,[p[0]+2,p[1]+2,p[2]+3]);assert.deepEqual(a.state.position,p);const clocks=s.npcSystem.agents.map(a=>a.actor.state.time),positions=s.npcSystem.agents.map(a=>[...a.actor.state.position]);s.animate(0,[31,20,25]);assert.deepEqual(s.npcSystem.agents.map(a=>a.actor.state.time),clocks);assert.deepEqual(s.npcSystem.agents.map(a=>a.actor.state.position),positions);s.dispose();}
});

test('all 24 recorded cues match the exact authored and child-derived text and canonical audio hashes',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../src/voice-manifest.json',import.meta.url))),provenance=JSON.parse(await readFile(new URL('../docs/review/GALILEE-VOICE-PROVENANCE.json',import.meta.url)));
 for(const p of people){const expected={greeting:p.greeting};for(const t of p.topics){expected[t.id]=t.answer;if(t.followup)expected[t.id+'-followup']=t.followup.answer;}const child=personForMode(p,'galilee','child');expected['child-greeting']=child.greeting;for(const t of child.topics){expected['child-'+t.id]=t.answer;expected['child-'+t.id+'-followup']=t.followup.answer;}const take=provenance.takes.find(t=>t.id===p.id),voice=manifest[p.id],bytes=await readFile(new URL('../public/'+voice.src,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),take.mp3_sha256);assert.equal(take.audio.original_characters.map(c=>c.text).join(''),take.request.text);assert.equal(take.request.speed,1);assert.equal(take.request.outputFormat,undefined);assert.equal(voice.duration,take.mp3_duration);assert.ok(bytes.length>1000000);assert.deepEqual(Object.keys(voice.clips).sort(),Object.keys(expected).sort());let previous=0;for(const [id,c] of Object.entries(voice.clips)){assert.equal(c.text,expected[id]);assert.deepEqual(c,take.clips[id]);assert.ok(c.start>=previous-.061&&c.end>c.start&&c.end<=voice.duration);previous=c.end;}}
});


test('eleven reading windows retain distinct time, wave and roof states, with safe public ground',()=>{
 let windows=0;
 for(const c of chapters)for(const phase of galileeReadingPhases[c.id]){
  windows++;const s=createHistoricalScene('galilee',null,{segment:c.id,phase:phase.id});assert.equal(s.phase,phase.id);assert.equal(s.exploration.moment.passage,phase.passage);
  s.setTime(false);assert.equal(s.scene.background.getHexString(),phase.timeLocked?'394650':'b4bdb8');
  const water=s.scene.getObjectByName('galilee-reading-lake');assert.equal(!!water,c.id==='boat');
  if(water){assert.equal(water.userData.waveAmplitude,phase.waves);assert.equal(s.walkModel.valid(-40,5),false);s.animate(.05,[43,30,46]);const before=Array.from(water.geometry.attributes.position.array);s.animate(0,[43,30,46]);assert.deepEqual(Array.from(water.geometry.attributes.position.array),before);s.animate(.05,[43,30,46]);assert.notDeepEqual(Array.from(water.geometry.attributes.position.array),before);const box=new THREE.Box3().setFromObject(water);assert.ok(box.max.y<=.15+phase.waves*1.45+.00001);assert.equal(s.scene.getObjectsByProperty('name','galilee-original-background-boat').length,2);}
  if(c.id==='house'){assert.equal(!!s.scene.getObjectByName('galilee-house-roof-opening'),phase.id!=='crowd');assert.equal(!!s.scene.getObjectByName('galilee-house-unopened-roof'),phase.id==='crowd');}
  const ground=s.scene.getObjectByName('galilee-public-ground');s.scene.updateMatrixWorld(true);
  for(const [x,z] of [[-10,3],[12,18],[22,-10]]){const h=new THREE.Raycaster(new THREE.Vector3(x,10,z),new THREE.Vector3(0,-1,0)).intersectObject(ground)[0];assert.ok(h&&Math.abs(h.point.y-floor(c.id,x,z))<.003);assert.ok(h.face.normal.y>.98);}
  s.dispose();
 }
 assert.equal(windows,11);
});

test('fallback hull inner floor, shell outside and underside have front facing real surfaces',()=>{
 const root=createGalileeObject('galilee-hull');root.updateMatrixWorld(true);
 const hit=(from,dir)=>new THREE.Raycaster(new THREE.Vector3(...from),new THREE.Vector3(...dir)).intersectObject(root,true)[0];
 const bottom=hit([0,-1,0],[0,1,0]);assert.ok(bottom&&Math.abs(bottom.point.y)<1e-6&&bottom.face.normal.y<-.9);
 const inner=hit([.16,1,0],[0,-1,0]);assert.ok(inner&&Math.abs(inner.point.y-.125)<1e-5&&inner.face.normal.y>.9);
 const outer=hit([.16,.09,0],[0,1,0]);assert.ok(outer&&Math.abs(outer.point.y-.105)<1e-5&&outer.face.normal.y<-.9);
 root.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
});

test('house roof is physically closed before access and exposes a real opening only in later windows',()=>{
 for(const phase of ['crowd','roof','authority']){
  const s=createHistoricalScene('galilee',null,{segment:'house',phase});s.scene.updateMatrixWorld(true);
  const hit=new THREE.Raycaster(new THREE.Vector3(5,15,-34),new THREE.Vector3(0,-1,0)).intersectObjects(s.occluders,false)[0];
  assert.ok(hit);assert.ok(phase==='crowd'?hit.point.y>3.5:hit.point.y<1.1,`${phase}: centre ray reaches ${hit.point.y}`);s.dispose();
 }
});
