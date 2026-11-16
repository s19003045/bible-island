import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createHistoricalScene} from '../src/historical-scenes.js';
import {davidSegments,davidFloor,davidObjects,davidPOIs} from '../src/david-exploration.js';
import {davidPeople,davidHistorical} from '../src/david-content.js';
import {createWalkControls} from '../src/walk-controls.js';
import {createCharacterController} from '../src/character-controller.js';
import {stateChapter,setNarrativeChapter,narrativeChapterPicker,stateNarrativePhase,setNarrativePhase} from '../src/narrative-chapters.js';
import {explorationFor} from '../src/exploration-data.js';
import {observeObject,readExploration,writeExploration} from '../src/exploration-progress.js';
import {personForMode,freshLearning,learningEvent,learningRecord} from '../src/learning-model.js';
import {peopleMarkup} from '../src/people-ui.js';
import {walkMarkup} from '../src/walk-ui.js';
import {freshMission} from '../src/walk-data.js';
import {blenderModels} from '../src/blender-manifest.js';
import {setArtifactSeparation} from '../src/artifact-inspection.js';
import {themeById} from '../src/content.js';
import {davidArkPhases} from '../src/david-exploration.js';
import {setDavidArtifactPhase} from '../src/artifact-phases.js';
import {createVessel} from '../src/vessels.js';
const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});globalThis.document=Object.assign(new EventTarget(),{createElement:()=>({getContext:()=>ctx}),querySelector:()=>null,activeElement:null});globalThis.window=new EventTarget();
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
const load=async id=>{const b=await readFile(new URL('../public/'+blenderModels[id].src,import.meta.url));return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};

test('three chapters isolate their landscape, actors, open routes and original teaching objects',()=>{
 assert.deepEqual(themeById.get('david').stops.map(s=>s.id),['sheep','city','ark']);
 for(const c of davidSegments){const s=createHistoricalScene('david',null,{segment:c.id});assert.equal(s.segment,c.id);assert.deepEqual(s.people.map(p=>p.id),[c.person]);assert.equal(s.objects.length,1);assert.equal(s.objects[0].segment,c.id);assert.equal(s.npcSystem.agents.length,13);assert.ok(s.scene.getObjectByName('david-chapter-'+c.id));assert.equal(!!s.flock,c.id==='sheep');for(const p of davidPOIs(c.id))for(const q of p.slots)assert.ok(s.walkModel.valid(q[0],q[2]),c.id+' '+p.id);assert.equal(s.config.cutaway,false);assert.equal(s.walkModel.valid(-26,-12),false);s.dispose();}
 for(const word of ['三個月','六步','米甲','Warren','無名居民','原創','豎琴'])assert.ok(davidHistorical.limits.includes(word),word);
});

test('four ark moments are mutually exclusive in fallback, loaded scene and inspection assets',async()=>{
 const phases=['cart','pause','carry','tent'];
 for(const phase of phases){
  const state={selected:'david',narrativeSegments:{david:'ark'}};assert.ok(setNarrativePhase(state,'david',phase));assert.equal(stateNarrativePhase(state),phase);const nav=narrativeChapterPicker('david','ark',phase);assert.equal((nav.match(/data-narrative-phase=/g)||[]).length,4);assert.match(nav,/停留三個月/);if(phase==='carry')for(const url of ['2SA.6.12-16','EXO.25.10-22','1CH.15.11-15'])assert.ok(nav.includes(url+'.CSBT'));
  const fallback=createVessel('david-ark',{phase}),inspect=createVessel('david-ark',{phase,blenderAssets:true,assetLoader:load});await inspect.userData.assetReady;
  const scene=createHistoricalScene('david',null,{segment:'ark',phase,blenderAssets:true,assetLoader:load});await scene.objects[0].root.userData.assetReady;await scene.detailedResidents.ready;assert.equal(scene.phase,phase);assert.equal(scene.exploration.moment.id,phase);
  for(const root of [fallback,inspect,scene.objects[0].root]){assert.equal(root.userData.narrativePhase,phase);for(const p of phases)assert.equal(root.getObjectByName('david-ark-phase-'+p)?.visible,p===phase);}
  for(const p of phases)assert.equal(!!scene.scene.getObjectByName('david-moment-'+p),p===phase);
  setDavidArtifactPhase(inspect,'bogus');assert.equal(inspect.userData.narrativePhase,'cart');inspect.userData.releaseBlender();scene.dispose();
 }
 assert.equal(setNarrativePhase({selected:'david',narrativeSegments:{david:'sheep'}},'david','tent'),false);assert.equal(stateNarrativePhase({selected:'paul'}),null);
});

test('the flock has individual reserved destinations, four-foot animations and distance-based gait without human emotes',async()=>{
 const s=createHistoricalScene('david',null,{segment:'sheep',blenderAssets:true,assetLoader:load});await s.flock.ready;await s.detailedResidents.ready;const f=s.flock;assert.equal(f.animals.length,7);assert.equal(new Set(f.system.agents.map(a=>a.seed)).size,7);assert.equal(new Set(f.system.agents.map(a=>a.timer)).size,7);const initial=f.animals.map(a=>[...a.actor.state.position]);let moved=false;
 for(let frame=0;frame<6000;frame++){f.update(.05);for(const [i,a] of f.animals.entries()){const p=a.actor.state.position;assert.ok(f.system.agents[i].speedFactor>=.85&&f.system.agents[i].speedFactor<=1.15);assert.equal(p[1],1.1);if(distance(p,initial[i])>1)moved=true;assert.equal(a.actor.state.socialTalking,false);for(const b of f.animals.slice(i+1))assert.ok(distance(p,b.actor.state.position)>=1.265-1e-6);assert.ok(a.actions.has('Idle')&&a.actions.has('Walk')&&a.actions.has('Graze'));}for(const p of f.system.pois)assert.ok(f.system.reservations.get(p.id).size<=p.capacity);}
 assert.ok(moved);assert.ok(f.system.agents.every(a=>a.visits.size>=2));const clocks=f.animals.map(a=>a.gait);f.update(0);assert.deepEqual(f.animals.map(a=>a.gait),clocks);const a=f.animals[0],before=a.gait,position=[...a.actor.state.position];f.update(.05);const travelled=distance(position,a.actor.state.position);assert.ok(Math.abs(a.gait-before-travelled/.24*1.2)<1e-9);s.dispose();
});

test('wood layer separates and restores actual loaded geometry while the oil horn exposes its inside',async()=>{
 const root=(await load('david-city')).scene,{part,offset}=blenderModels['david-city'].articulation,p=root.getObjectByName(part),start=p.getWorldPosition(new THREE.Vector3());assert.ok(setArtifactSeparation(root,part,offset));root.updateMatrixWorld(true);assert.ok(p.getWorldPosition(new THREE.Vector3()).distanceTo(start.clone().add(new THREE.Vector3(...offset)))<1e-6);setArtifactSeparation(root,part,[0,0,0]);root.updateMatrixWorld(true);assert.ok(p.getWorldPosition(new THREE.Vector3()).distanceTo(start)<1e-6);
 const horn=(await load('david-shepherd')).scene.getObjectByName('david-shepherd-oil-horn-shell');assert.ok(horn);horn.updateWorldMatrix(true,true);assert.ok(new THREE.Box3().setFromObject(horn).getSize(new THREE.Vector3()).y>.2);
});

test('chapter changes isolate modes, dialogue, readings and observations without resetting other islands',()=>{
 const state={selected:'david',mode:'child',exodusSegment:'passover',narrativeSegments:{paul:'square'},actor:null,mission:freshMission(),learning:freshLearning(),explorationSeen:{paul:['paul-textiles']}};
 for(const c of davidSegments){assert.ok(setNarrativeChapter(state,'david',c.id));assert.equal(stateChapter(state),c.id);assert.equal(stateChapter(state,'paul'),'square');assert.equal(stateChapter(state,'exodus'),'passover');assert.equal(explorationFor('david',c.id).objects.length,1);assert.equal((peopleMarkup(state).match(/data-person=/g)||[]).length,1);assert.match(walkMarkup(state),new RegExp(c.person));const nav=narrativeChapterPicker('david',c.id);assert.match(nav,/撒母耳與大衛/);assert.match(nav,/1SA\.|2SA\./);assert.doesNotMatch(nav,/押解赴羅馬/);}
 assert.equal(setNarrativeChapter(state,'david','ship'),false);let record=state.explorationSeen;for(const o of davidObjects)record=observeObject(record,'david',o.id);assert.deepEqual(record.david,davidObjects.map(o=>o.id));assert.deepEqual(record.paul,['paul-textiles']);let saved;const storage={setItem:(k,v)=>saved=v,getItem:()=>saved};writeExploration(storage,record);assert.deepEqual(readExploration(storage),record);
 let data=learningEvent(freshLearning(),'paul','study',{type:'note',text:'保留札記'}).data;data=learningEvent(data,'david','study',{type:'inspect',id:'city'}).data;data=learningEvent(data,'david','study',{type:'answer',id:'city',choice:'reconstruction'}).data;assert.deepEqual(learningRecord(data,'david','study').completed,['city']);assert.deepEqual(learningRecord(data,'david','child').completed,[]);assert.equal(learningRecord(data,'paul','study').note,'保留札記');
});

test('thirteen residents sustain individual POI decisions, separation and short social encounters',()=>{
 for(const c of davidSegments){const s=createHistoricalScene('david',null,{segment:c.id}),n=s.npcSystem;assert.equal(new Set(n.agents.map(a=>a.seed)).size,13);assert.equal(new Set(n.agents.map(a=>a.timer)).size,13);let social=false;
  for(let frame=0;frame<4800;frame++){n.update(.05,{player:c.spawn});for(const [j,a] of n.agents.entries()){const p=a.actor.state.position;assert.ok(s.walkModel.valid(p[0],p[2]));assert.ok(Math.abs(p[1]-davidFloor(c.id,p[0],p[2]))<.001);assert.ok(a.speedFactor>=.85&&a.speedFactor<=1.15);assert.ok(distance(p,c.spawn)>=a.radius+.32+.024);social ||=!!a.partner;for(const b of n.agents.slice(j+1))assert.ok(distance(p,b.actor.state.position)>=a.radius+b.radius+.024);}for(const p of n.pois)assert.ok(n.reservations.get(p.id).size<=p.capacity);}
  assert.ok(n.agents.every(a=>a.visits.size>=2),c.id+' all residents keep visiting different POIs');assert.ok(social);s.dispose();
 }
});

test('actual player controller reaches each object through a moving crowd and stays grounded on descending public paths',()=>{
 for(const c of davidSegments){const s=createHistoricalScene('david',null,{segment:c.id}),n=s.npcSystem;for(let i=0;i<2400;i++)n.update(.05);const canvas=Object.assign(new EventTarget(),{focus(){}}),walk=createWalkControls(new THREE.PerspectiveCamera(),canvas,{constrainMove:(a,b)=>n.constrainPlayer(a,b),navigationObstacles:()=>n.agents.map(a=>({position:a.actor.state.position,radius:a.radius+.32+.07}))}),spawn=n.safePlayerSpawn(c.spawn),destination=s.objects[0].approach;assert.ok(spawn);walk.start(s.walkModel,spawn);assert.ok(walk.navigate(destination));
  for(let i=0;i<4800&&distance(walk.position,destination)>.65;i++){n.update(.05,{player:walk.position});walk.update(.05);assert.ok(walk.groundState.isGrounded);for(const a of n.agents)assert.ok(distance(walk.position,a.actor.state.position)>=a.radius+.32+.024);}assert.ok(distance(walk.position,destination)<.65,c.id+' route completes');walk.dispose();
  for(const fps of [30,60,120]){const motor=createCharacterController(s.walkModel),x=17,z=c.id==='sheep'?23:c.id==='city'?-15:15;motor.reset([x,davidFloor(c.id,x,z),z]);const start=motor.position[1];let previous=motor.visualPosition[1];for(let i=0;i<fps*12;i++){const dx=c.id==='ark'?-1.7/fps:0,dz=c.id==='ark'?0:c.id==='sheep'?-1.7/fps:1.7/fps,f=motor.speedFactor(dx,dz);motor.update(1/fps,dx*f,dz*f);assert.ok(motor.state.isGrounded);assert.ok(Math.abs(motor.visualPosition[1]-previous)<.035);previous=motor.visualPosition[1];}assert.ok(motor.position[1]<start-.2);}s.dispose();
 }
});

test('arrival view clears actual loaded GLB objects and scenery, enabling close interaction',async()=>{
 for(const c of davidSegments){const s=createHistoricalScene('david',null,{segment:c.id,blenderAssets:true,assetLoader:load});await s.objects[0].root.userData.assetReady;await s.detailedResidents.ready;s.scene.updateMatrixWorld(true);const object=s.objects[0],eye=new THREE.Vector3(...object.approach).add(new THREE.Vector3(0,1.62,0)),delta=new THREE.Vector3(...object.lookAt).sub(eye);assert.ok(distance(object.approach,object.position)<=3.2);const ray=new THREE.Raycaster(eye,delta.clone().normalize(),.08,delta.length());assert.equal(ray.intersectObjects(s.occluders,false).length,0,c.id+' clear sightline');s.dispose();}
});

test('all 24 new dialogue cues match actual audio, mode text and returned character timestamps',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../src/voice-manifest.json',import.meta.url))),provenance=JSON.parse(await readFile(new URL('../docs/review/DAVID-VOICE-PROVENANCE.json',import.meta.url)));
 for(const p of davidPeople){const expected={greeting:p.greeting};for(const t of p.topics){expected[t.id]=t.answer;if(t.followup)expected[t.id+'-followup']=t.followup.answer;}const child=personForMode(p,'david','child');expected['child-greeting']=child.greeting;for(const t of child.topics){expected['child-'+t.id]=t.answer;expected['child-'+t.id+'-followup']=t.followup.answer;}const take=provenance.takes.find(t=>t.id===p.id),voice=manifest[p.id],bytes=await readFile(new URL('../public/'+voice.src,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),take.mp3_sha256);assert.equal(take.audio.original_characters.map(c=>c.text).join(''),take.request.text);assert.equal(take.request.speed,1);assert.equal(voice.duration,take.mp3_duration);assert.ok(bytes.length>1000000);assert.deepEqual(Object.keys(voice.clips).sort(),Object.keys(expected).sort());let previous=0;for(const [id,c] of Object.entries(voice.clips)){assert.equal(c.text,expected[id]);assert.deepEqual(c,take.clips[id]);assert.ok(c.start>=previous-.061&&c.end>c.start&&c.end<=voice.duration);previous=c.end;}}
});
