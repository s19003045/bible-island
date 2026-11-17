import {upgradedModelFor} from '../src/human-motion-data.js';
import {characterClips} from './helpers/character-clips.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createHistoricalScene} from '../src/historical-scenes.js';
import {abrahamSegments,abrahamFloor,abrahamObjects,abrahamPOIs} from '../src/abraham-exploration.js';
import {abrahamPeople,abrahamHistorical} from '../src/abraham-content.js';
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

test('Abraham chapters retain legacy stop IDs in chronological order and separate their actors, objects and witness group',()=>{
 assert.deepEqual(themeById.get('abraham').stops.map(s=>s.id),['altar','tent','well']);
 const preview=createHistoricalScene('abraham',null,{segment:'altar'}),ground=preview.scene.getObjectByName('abraham-camp-ground');assert.equal(ground.geometry.attributes.color.count,ground.geometry.attributes.position.count,'vertex-colored near terrain has actual surface colours');assert.ok(ground.geometry.attributes.color.array.every(c=>c>.05));preview.dispose();
 for(const c of abrahamSegments){const s=createHistoricalScene('abraham',null,{segment:c.id}),m=s.walkModel;assert.equal(s.segment,c.id);assert.deepEqual(s.people.map(p=>p.id),[c.person]);assert.equal(s.objects.length,1);assert.equal(s.objects[0].segment,c.id);assert.equal(s.npcSystem.agents.length,13);const marker=s.scene.getObjectByName('abraham-chapter-'+c.id);assert.ok(marker);assert.equal(marker.userData.witnessCount,c.id==='well'?7:0);assert.equal(s.config.cutaway,false);assert.ok(m.valid(c.spawn[0],c.spawn[2]));for(const p of abrahamPOIs(c.id))for(const q of p.slots)assert.ok(m.valid(q[0],q[2]),c.id+' '+p.id);assert.ok(m.path(c.spawn,s.objects[0].approach).length>1);assert.equal(m.valid(-27,-9),false,'tent and guy line footprint is not walkable');s.dispose();}
 for(const word of ['夏甲','四角','絕對年代','綜合教學角色'])assert.ok(abrahamHistorical.limits.includes(word));
});

test('chapter changes isolate modes, dialogue, readings and observations without resetting other islands',()=>{
 const state={selected:'abraham',mode:'child',exodusSegment:'passover',narrativeSegments:{paul:'square'},actor:null,mission:freshMission(),learning:freshLearning(),explorationSeen:{paul:['paul-textiles']}};
 for(const c of abrahamSegments){assert.ok(setNarrativeChapter(state,'abraham',c.id));assert.equal(stateChapter(state),c.id);assert.equal(stateChapter(state,'paul'),'square');assert.equal(stateChapter(state,'exodus'),'passover');assert.equal(explorationFor('abraham',c.id).objects.length,1);assert.equal((peopleMarkup(state).match(/data-person=/g)||[]).length,1);assert.match(walkMarkup(state),new RegExp(c.person));const nav=narrativeChapterPicker('abraham',c.id);assert.match(nav,/列祖旅程/);assert.match(nav,/GEN\./);assert.doesNotMatch(nav,/押解赴羅馬/);}
 assert.equal(setNarrativeChapter(state,'abraham','ship'),false);let record=state.explorationSeen;for(const o of abrahamObjects)record=observeObject(record,'abraham',o.id);assert.deepEqual(record.abraham,abrahamObjects.map(o=>o.id));assert.deepEqual(record.paul,['paul-textiles']);let saved;const storage={setItem:(k,v)=>saved=v,getItem:()=>saved};writeExploration(storage,record);assert.deepEqual(readExploration(storage),record);
 let data=learningEvent(freshLearning(),'paul','study',{type:'note',text:'保留札記'}).data;data=learningEvent(data,'abraham','study',{type:'inspect',id:'well'}).data;data=learningEvent(data,'abraham','study',{type:'answer',id:'well',choice:'research'}).data;assert.deepEqual(learningRecord(data,'abraham','study').completed,['well']);assert.deepEqual(learningRecord(data,'abraham','child').completed,[]);assert.equal(learningRecord(data,'paul','study').note,'保留札記');
});

test('thirteen camp residents sustain individual POI decisions, separation and short social encounters',()=>{
 for(const c of abrahamSegments){const s=createHistoricalScene('abraham',null,{segment:c.id}),n=s.npcSystem;assert.equal(new Set(n.agents.map(a=>a.seed)).size,13);assert.equal(new Set(n.agents.map(a=>a.timer)).size,13);let social=false;
  for(let frame=0;frame<4800;frame++){n.update(.05,{player:c.spawn});for(const [j,a] of n.agents.entries()){const p=a.actor.state.position;assert.ok(s.walkModel.valid(p[0],p[2]));assert.ok(Math.abs(p[1]-abrahamFloor(c.id,p[0],p[2]))<.001);assert.ok(a.speedFactor>=.85&&a.speedFactor<=1.15);assert.ok(distance(p,c.spawn)>=a.radius+.32+.024);social ||=!!a.partner;for(const b of n.agents.slice(j+1))assert.ok(distance(p,b.actor.state.position)>=a.radius+b.radius+.024);}for(const p of n.pois)assert.ok(n.reservations.get(p.id).size<=p.capacity);}
  assert.ok(n.agents.every(a=>a.visits.size>=2),c.id+' all residents keep visiting different POIs');assert.ok(social);s.dispose();
 }
});

test('actual player controller reaches each object through a moving crowd and stays grounded on descending camp paths',()=>{
 for(const c of abrahamSegments){const s=createHistoricalScene('abraham',null,{segment:c.id}),n=s.npcSystem;for(let i=0;i<2400;i++)n.update(.05);const canvas=Object.assign(new EventTarget(),{focus(){}}),walk=createWalkControls(new THREE.PerspectiveCamera(),canvas,{constrainMove:(a,b)=>n.constrainPlayer(a,b),navigationObstacles:()=>n.agents.map(a=>({position:a.actor.state.position,radius:a.radius+.32+.07}))}),spawn=n.safePlayerSpawn(c.spawn),destination=s.objects[0].approach;assert.ok(spawn);walk.start(s.walkModel,spawn);assert.ok(walk.navigate(destination));
  for(let i=0;i<4800&&distance(walk.position,destination)>.65;i++){n.update(.05,{player:walk.position});walk.update(.05);assert.ok(walk.groundState.isGrounded);for(const a of n.agents)assert.ok(distance(walk.position,a.actor.state.position)>=a.radius+.32+.024);}assert.ok(distance(walk.position,destination)<.65,c.id+' route completes');walk.dispose();
  for(const fps of [30,60,120]){const motor=createCharacterController(s.walkModel),x=c.id==='tent'?-12:25,z=c.id==='tent'?28:-15;motor.reset([x,abrahamFloor(c.id,x,z),z]);const start=motor.position[1];let previous=motor.visualPosition[1];for(let i=0;i<fps*8;i++){const dx=c.id==='tent'?1.7/fps:0,dz=c.id==='tent'?0:1.7/fps,f=motor.speedFactor(dx,dz);motor.update(1/fps,dx*f,dz*f);assert.ok(motor.state.isGrounded);assert.ok(Math.abs(motor.visualPosition[1]-previous)<.035);previous=motor.visualPosition[1];}assert.ok(motor.position[1]<start-.2);}s.dispose();
 }
});

test('actual well and basin have true interiors and both named stone layers can separate',async()=>{
 for(const [id,part,offset] of [['abraham-altar','abraham-altar-top',.18],['abraham-well','abraham-well-rim',.2]]){const root=(await load(id)).scene;root.updateMatrixWorld(true);const node=root.getObjectByName(part);assert.ok(node);const before=node.getWorldPosition(new THREE.Vector3());setArtifactSeparation(root,part,[0,offset,0]);root.updateMatrixWorld(true);assert.ok(Math.abs(node.getWorldPosition(new THREE.Vector3()).y-before.y-offset)<1e-6);}
 const root=(await load('abraham-well')).scene;root.updateMatrixWorld(true);const meshes=[];root.traverse(o=>{if(o.isMesh)meshes.push(o);});const ray=new THREE.Raycaster(new THREE.Vector3(0,1.5,0),new THREE.Vector3(0,-1,0)),hit=ray.intersectObjects(meshes,false)[0];assert.ok(hit);assert.ok(Math.abs(hit.point.y-.072)<.003,'center sees low water rather than a solid cap');ray.ray.origin.y=.06;const bottom=ray.intersectObjects(meshes,false)[0];assert.ok(bottom&&Math.abs(bottom.point.y-.016)<.003,'real floor below the water');
 const hospitality=(await load('abraham-hospitality')).scene;hospitality.updateMatrixWorld(true);const size=new THREE.Box3().setFromObject(hospitality).getSize(new THREE.Vector3());assert.ok(size.x>1&&size.y>.25&&size.y<.28);const bowlMeshes=[];hospitality.traverse(o=>{if(o.isMesh&&o.material.name==='abraham-clean-water-comparison')bowlMeshes.push(o);});assert.ok(bowlMeshes.length,'water is separate from the ceramic interior');
});

test('arrival view clears actual loaded GLB objects and scenery, enabling close interaction',async()=>{
 for(const c of abrahamSegments){const s=createHistoricalScene('abraham',null,{segment:c.id,blenderAssets:true,assetLoader:load});await s.objects[0].root.userData.assetReady;await s.detailedResidents.ready;s.scene.updateMatrixWorld(true);const object=s.objects[0],eye=new THREE.Vector3(...object.approach).add(new THREE.Vector3(0,1.62,0)),delta=new THREE.Vector3(...object.lookAt).sub(eye);assert.ok(distance(object.approach,object.position)<=3.2);const ray=new THREE.Raycaster(eye,delta.clone().normalize(),.08,delta.length());assert.equal(ray.intersectObjects(s.occluders,false).length,0,c.id+' clear sightline');s.dispose();}
});

test('new human rigs blend elbows and the seven ewe instances have separate moving head nodes',async()=>{
 const ids=['patriarch-traveler','camp-host','well-keeper'],assets=await Promise.all(ids.map(load)),rigs=assets.map((a,index)=>{assert.deepEqual(a.animations.map(c=>c.name).sort(),characterClips(ids[index]));const meshes=[];a.scene.traverse(o=>{if(o.isSkinnedMesh)meshes.push(o);});const skin=meshes.find(m=>m.material.name==='skin'),sw=skin.geometry.attributes.skinWeight,si=skin.geometry.attributes.skinIndex;let blend=0;for(let i=0;i<si.count;i++){const names=[];for(let k=0;k<4;k++)if(sw.getComponent(i,k)>.01)names.push(skin.skeleton.bones[si.getComponent(i,k)].name);if(['L','R'].some(s=>names.includes('arm'+s)&&names.includes('forearm'+s)))blend++;}assert.ok(blend>=64);return meshes[0].skeleton;});assert.equal(new Set(rigs).size,3);
 for(const [i,c] of abrahamSegments.entries()){const s=createHistoricalScene('abraham',null,{segment:c.id,blenderAssets:true,assetLoader:load});await s.detailedResidents.ready;const a=s.people[0],p=[...a.state.position];s.converse(a.id);s.animate(.05,[p[0]+2,p[1]+2,p[2]+3]);assert.deepEqual(a.state.position,p);assert.equal(s.detailedResidents.visible.get(a)?.root.userData.modelId,upgradedModelFor(ids[i]));s.dispose();}
 const s=createHistoricalScene('abraham',null,{segment:'well',blenderAssets:true,assetLoader:load});const animals=s.scene.children.filter(o=>o.name.startsWith('well-witness-ewe-'));assert.equal(animals.length,7);await Promise.all(animals.map(o=>o.userData.assetReady));const heads=animals.map(o=>o.getObjectByName('ewe-head'));assert.ok(heads.every(Boolean));assert.equal(new Set(heads).size,7);s.animate(.25,[0,2,10]);const poses=heads.map(h=>h.rotation.toArray().join(','));assert.equal(new Set(poses).size,7);const held=poses.slice();s.animate(0,[0,2,10]);assert.deepEqual(heads.map(h=>h.rotation.toArray().join(',')),held);s.dispose();
});

test('all 24 new dialogue cues match actual audio, mode text and returned character timestamps',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../src/voice-manifest.json',import.meta.url))),provenance=JSON.parse(await readFile(new URL('../docs/review/ABRAHAM-VOICE-PROVENANCE.json',import.meta.url)));
 for(const p of abrahamPeople){const expected={greeting:p.greeting};for(const t of p.topics){expected[t.id]=t.answer;if(t.followup)expected[t.id+'-followup']=t.followup.answer;}const child=personForMode(p,'abraham','child');expected['child-greeting']=child.greeting;for(const t of child.topics){expected['child-'+t.id]=t.answer;expected['child-'+t.id+'-followup']=t.followup.answer;}const take=provenance.takes.find(t=>t.id===p.id),voice=manifest[p.id],bytes=await readFile(new URL('../public/'+voice.src,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),take.mp3_sha256);assert.equal(take.audio.original_characters.map(c=>c.text).join(''),take.request.text);assert.equal(take.request.speed,1);assert.equal(voice.duration,take.mp3_duration);assert.ok(bytes.length>1000000);assert.deepEqual(Object.keys(voice.clips).sort(),Object.keys(expected).sort());let previous=0;for(const [id,c] of Object.entries(voice.clips)){assert.equal(c.text,expected[id]);assert.deepEqual(c,take.clips[id]);assert.ok(c.start>=previous-.061&&c.end>c.start&&c.end<=voice.duration);previous=c.end;}}
});
