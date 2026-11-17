import {upgradedModelFor} from '../src/human-motion-data.js';
import {characterClips} from './helpers/character-clips.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createHistoricalScene} from '../src/historical-scenes.js';
import {josephSegments,josephFloor,josephObjects,josephPOIs} from '../src/joseph-exploration.js';
import {josephPeople,josephHistorical} from '../src/joseph-content.js';
import {createWalkControls} from '../src/walk-controls.js';
import {createCharacterController} from '../src/character-controller.js';
import {stateChapter,setNarrativeChapter,narrativeChapterPicker} from '../src/narrative-chapters.js';
import {explorationFor} from '../src/exploration-data.js';
import {observeObject,readExploration,writeExploration} from '../src/exploration-progress.js';
import {personForMode,freshLearning,learningEvent,learningRecord} from '../src/learning-model.js';
import {peopleMarkup} from '../src/people-ui.js';
import {walkMarkup} from '../src/walk-ui.js';
import {freshMission} from '../src/walk-data.js';
import {blenderModels} from '../src/blender-manifest.js';
import {setArtifactSeparation} from '../src/artifact-inspection.js';
import {themeById} from '../src/content.js';
const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});globalThis.document=Object.assign(new EventTarget(),{createElement:()=>({getContext:()=>ctx}),querySelector:()=>null,activeElement:null});globalThis.window=new EventTarget();
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
const load=async id=>{const b=await readFile(new URL('../public/'+blenderModels[id].src,import.meta.url));return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};

test('Joseph chapters retain legacy stop IDs in chronological order and separate their actors, objects and landscape',()=>{
 assert.deepEqual(themeById.get('joseph').stops.map(s=>s.id),['caravan','grain','family']);
 const preview=createHistoricalScene('joseph',null,{segment:'caravan'}),ground=preview.scene.getObjectByName('joseph-observation-ground');assert.equal(ground.geometry.attributes.color.count,ground.geometry.attributes.position.count,'vertex-colored near terrain has actual surface colours');assert.ok(ground.geometry.attributes.color.array.every(c=>c>.05));preview.dispose();
 for(const c of josephSegments){const s=createHistoricalScene('joseph',null,{segment:c.id}),m=s.walkModel;assert.equal(s.segment,c.id);assert.deepEqual(s.people.map(p=>p.id),[c.person]);assert.equal(s.objects.length,1);assert.equal(s.objects[0].segment,c.id);assert.equal(s.npcSystem.agents.length,13);const marker=s.scene.getObjectByName('joseph-chapter-'+c.id);assert.ok(marker);assert.equal(!!s.scene.getObjectByName('joseph-dry-pit-interior'),c.id==='caravan');assert.equal(!!s.scene.getObjectByName('joseph-grain-work-building'),c.id==='grain');assert.equal(s.config.cutaway,false);assert.ok(m.valid(c.spawn[0],c.spawn[2]));for(const p of josephPOIs(c.id))for(const q of p.slots)assert.ok(m.valid(q[0],q[2]),c.id+' '+p.id);assert.ok(m.path(c.spawn,s.objects[0].approach).length>1);assert.equal(m.valid(-24,-5),false,'deep pit is outside the public observation route');s.dispose();}
 for(const word of ['法老姓名','陪葬藝術','綜合教學人物','創 47'])assert.ok(josephHistorical.limits.includes(word));
});

test('chapter changes isolate modes, dialogue, readings and observations without resetting other islands',()=>{
 const state={selected:'joseph',mode:'child',exodusSegment:'passover',narrativeSegments:{paul:'square'},actor:null,mission:freshMission(),learning:freshLearning(),explorationSeen:{paul:['paul-textiles']}};
 for(const c of josephSegments){assert.ok(setNarrativeChapter(state,'joseph',c.id));assert.equal(stateChapter(state),c.id);assert.equal(stateChapter(state,'paul'),'square');assert.equal(stateChapter(state,'exodus'),'passover');assert.equal(explorationFor('joseph',c.id).objects.length,1);assert.equal((peopleMarkup(state).match(/data-person=/g)||[]).length,1);assert.match(walkMarkup(state),new RegExp(c.person));const nav=narrativeChapterPicker('joseph',c.id);assert.match(nav,/約瑟與埃及/);assert.match(nav,/GEN\./);assert.doesNotMatch(nav,/押解赴羅馬/);}
 assert.equal(setNarrativeChapter(state,'joseph','ship'),false);let record=state.explorationSeen;for(const o of josephObjects)record=observeObject(record,'joseph',o.id);assert.deepEqual(record.joseph,josephObjects.map(o=>o.id));assert.deepEqual(record.paul,['paul-textiles']);let saved;const storage={setItem:(k,v)=>saved=v,getItem:()=>saved};writeExploration(storage,record);assert.deepEqual(readExploration(storage),record);
 let data=learningEvent(freshLearning(),'paul','study',{type:'note',text:'保留札記'}).data;data=learningEvent(data,'joseph','study',{type:'inspect',id:'family'}).data;data=learningEvent(data,'joseph','study',{type:'answer',id:'family',choice:'reconstruction'}).data;assert.deepEqual(learningRecord(data,'joseph','study').completed,['family']);assert.deepEqual(learningRecord(data,'joseph','child').completed,[]);assert.equal(learningRecord(data,'paul','study').note,'保留札記');
});

test('thirteen residents sustain individual POI decisions, separation and short social encounters',()=>{
 for(const c of josephSegments){const s=createHistoricalScene('joseph',null,{segment:c.id}),n=s.npcSystem;assert.equal(new Set(n.agents.map(a=>a.seed)).size,13);assert.equal(new Set(n.agents.map(a=>a.timer)).size,13);let social=false;
  for(let frame=0;frame<4800;frame++){n.update(.05,{player:c.spawn});for(const [j,a] of n.agents.entries()){const p=a.actor.state.position;assert.ok(s.walkModel.valid(p[0],p[2]));assert.ok(Math.abs(p[1]-josephFloor(c.id,p[0],p[2]))<.001);assert.ok(a.speedFactor>=.85&&a.speedFactor<=1.15);assert.ok(distance(p,c.spawn)>=a.radius+.32+.024);social ||=!!a.partner;for(const b of n.agents.slice(j+1))assert.ok(distance(p,b.actor.state.position)>=a.radius+b.radius+.024);}for(const p of n.pois)assert.ok(n.reservations.get(p.id).size<=p.capacity);}
  assert.ok(n.agents.every(a=>a.visits.size>=2),c.id+' all residents keep visiting different POIs');assert.ok(social);s.dispose();
 }
});

test('actual player controller reaches each object through a moving crowd and stays grounded on descending public paths',()=>{
 for(const c of josephSegments){const s=createHistoricalScene('joseph',null,{segment:c.id}),n=s.npcSystem;for(let i=0;i<2400;i++)n.update(.05);const canvas=Object.assign(new EventTarget(),{focus(){}}),walk=createWalkControls(new THREE.PerspectiveCamera(),canvas,{constrainMove:(a,b)=>n.constrainPlayer(a,b),navigationObstacles:()=>n.agents.map(a=>({position:a.actor.state.position,radius:a.radius+.32+.07}))}),spawn=n.safePlayerSpawn(c.spawn),destination=s.objects[0].approach;assert.ok(spawn);walk.start(s.walkModel,spawn);assert.ok(walk.navigate(destination));
  for(let i=0;i<4800&&distance(walk.position,destination)>.65;i++){n.update(.05,{player:walk.position});walk.update(.05);assert.ok(walk.groundState.isGrounded);for(const a of n.agents)assert.ok(distance(walk.position,a.actor.state.position)>=a.radius+.32+.024);}assert.ok(distance(walk.position,destination)<.65,c.id+' route completes');walk.dispose();
  for(const fps of [30,60,120]){const motor=createCharacterController(s.walkModel),x=c.id==='grain'?17:25,z=-15;motor.reset([x,josephFloor(c.id,x,z),z]);const start=motor.position[1];let previous=motor.visualPosition[1];for(let i=0;i<fps*8;i++){const dx=c.id==='grain'?-1.7/fps:0,dz=c.id==='grain'?0:1.7/fps,f=motor.speedFactor(dx,dz);motor.update(1/fps,dx*f,dz*f);assert.ok(motor.state.isGrounded);assert.ok(Math.abs(motor.visualPosition[1]-previous)<.035);previous=motor.visualPosition[1];}assert.ok(motor.position[1]<start-.2);}s.dispose();
 }
});

test('loaded cargo and granary separate named groups, and storage openings reveal actual grain below',async()=>{
 for(const [id,part,offset] of [['joseph-cargo','joseph-cargo-wrap',.18],['joseph-granary','joseph-granary-roof',.22]]){const root=(await load(id)).scene;root.updateMatrixWorld(true);const node=root.getObjectByName(part);assert.ok(node);const before=node.getWorldPosition(new THREE.Vector3());setArtifactSeparation(root,part,[0,offset,0]);root.updateMatrixWorld(true);assert.ok(Math.abs(node.getWorldPosition(new THREE.Vector3()).y-before.y-offset)<1e-6);}
 const cargo=(await load('joseph-cargo')).scene;setArtifactSeparation(cargo,'joseph-cargo-wrap',blenderModels['joseph-cargo'].articulation.offset);cargo.updateMatrixWorld(true);const cargoMeshes=[];cargo.traverse(o=>{if(o.isMesh)cargoMeshes.push(o);});for(const x of [-.375,-.140]){const ray=new THREE.Raycaster(new THREE.Vector3(x,1,.025),new THREE.Vector3(0,-1,0)),hit=ray.intersectObjects(cargoMeshes,false)[0];assert.ok(hit&&hit.point.y<.3,'sideways cover translation reveals the actual inner containers from above');}
 const root=(await load('joseph-granary')).scene;root.updateMatrixWorld(true);const meshes=[];root.traverse(o=>{if(o.isMesh)meshes.push(o);});for(const [x,y] of [[-.441,.277],[-.019,.204]]){const ray=new THREE.Raycaster(new THREE.Vector3(x,1,-.160),new THREE.Vector3(0,-1,0)),hit=ray.intersectObjects(meshes,false)[0];assert.ok(hit);assert.ok(Math.abs(hit.point.y-y)<.012,'roof opening sees actual grain');ray.ray.origin.y=.43;const inner=ray.intersectObjects(meshes,false)[0];assert.ok(inner&&inner.point.y<.3,'genuine empty room above grain');}
 const provisions=(await load('joseph-provisions')).scene;provisions.updateMatrixWorld(true);assert.ok(provisions.getObjectByName('joseph-provisions-folded-garments-comparison'));assert.ok(provisions.getObjectByName('joseph-provisions-open-grain-sacks'));const size=new THREE.Box3().setFromObject(provisions).getSize(new THREE.Vector3());assert.ok(size.x>.95&&size.y>.32&&size.y<.33);
 const road=createHistoricalScene('joseph',null,{segment:'caravan'});road.scene.updateMatrixWorld(true);const ray=new THREE.Raycaster(new THREE.Vector3(-24,josephFloor('caravan',-24,-5)+2,-5),new THREE.Vector3(0,-1,0));const hit=ray.intersectObjects(road.occluders,false)[0];assert.ok(hit);assert.equal(hit.object.name,'joseph-empty-pit-bottom');assert.ok(hit.point.y<josephFloor('caravan',-24,-5)-3);road.dispose();
});

test('arrival view clears actual loaded GLB objects and scenery, enabling close interaction',async()=>{
 for(const c of josephSegments){const s=createHistoricalScene('joseph',null,{segment:c.id,blenderAssets:true,assetLoader:load});await s.objects[0].root.userData.assetReady;await s.detailedResidents.ready;s.scene.updateMatrixWorld(true);const object=s.objects[0],eye=new THREE.Vector3(...object.approach).add(new THREE.Vector3(0,1.62,0)),delta=new THREE.Vector3(...object.lookAt).sub(eye);assert.ok(distance(object.approach,object.position)<=3.2);const ray=new THREE.Raycaster(eye,delta.clone().normalize(),.08,delta.length());assert.equal(ray.intersectObjects(s.occluders,false).length,0,c.id+' clear sightline');s.dispose();}
});

test('three distinct residents retain blended elbow skin, independent rigs and contextual clothing in conversations',async()=>{
 const ids=['caravan-traveler','egypt-grain-worker','egypt-householder'],assets=await Promise.all(ids.map(load)),rigs=assets.map((a,index)=>{assert.deepEqual(a.animations.map(c=>c.name).sort(),characterClips(ids[index]));const meshes=[];a.scene.traverse(o=>{if(o.isSkinnedMesh)meshes.push(o);});const skin=meshes.find(m=>m.material.name==='skin'),sw=skin.geometry.attributes.skinWeight,si=skin.geometry.attributes.skinIndex;let blend=0;for(let i=0;i<si.count;i++){const names=[];for(let k=0;k<4;k++)if(sw.getComponent(i,k)>.01)names.push(skin.skeleton.bones[si.getComponent(i,k)].name);if(['L','R'].some(s=>names.includes('arm'+s)&&names.includes('forearm'+s)))blend++;}assert.ok(blend>=64);return meshes[0].skeleton;});assert.equal(new Set(rigs).size,3);
 for(const [i,c] of josephSegments.entries()){const s=createHistoricalScene('joseph',null,{segment:c.id,blenderAssets:true,assetLoader:load});await s.detailedResidents.ready;const a=s.people[0],p=[...a.state.position];s.converse(a.id);s.animate(.05,[p[0]+2,p[1]+2,p[2]+3]);assert.deepEqual(a.state.position,p);assert.equal(s.detailedResidents.visible.get(a)?.root.userData.modelId,upgradedModelFor(ids[i]));s.dispose();}
});

test('all 24 new dialogue cues match actual audio, mode text and returned character timestamps',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../src/voice-manifest.json',import.meta.url))),provenance=JSON.parse(await readFile(new URL('../docs/review/JOSEPH-VOICE-PROVENANCE.json',import.meta.url)));
 for(const p of josephPeople){const expected={greeting:p.greeting};for(const t of p.topics){expected[t.id]=t.answer;if(t.followup)expected[t.id+'-followup']=t.followup.answer;}const child=personForMode(p,'joseph','child');expected['child-greeting']=child.greeting;for(const t of child.topics){expected['child-'+t.id]=t.answer;expected['child-'+t.id+'-followup']=t.followup.answer;}const take=provenance.takes.find(t=>t.id===p.id),voice=manifest[p.id],bytes=await readFile(new URL('../public/'+voice.src,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),take.mp3_sha256);assert.equal(take.audio.original_characters.map(c=>c.text).join(''),take.request.text);assert.equal(take.request.speed,1);assert.equal(voice.duration,take.mp3_duration);assert.ok(bytes.length>1000000);assert.deepEqual(Object.keys(voice.clips).sort(),Object.keys(expected).sort());let previous=0;for(const [id,c] of Object.entries(voice.clips)){assert.equal(c.text,expected[id]);assert.deepEqual(c,take.clips[id]);assert.ok(c.start>=previous-.061&&c.end>c.start&&c.end<=voice.duration);previous=c.end;}}
});
