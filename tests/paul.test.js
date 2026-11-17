import {upgradedModelFor} from '../src/human-motion-data.js';
import {characterClips} from './helpers/character-clips.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createHistoricalScene} from '../src/historical-scenes.js';
import {paulSegments,paulFloor,paulObjects,paulPOIs} from '../src/paul-exploration.js';
import {paulPeople,paulHistorical} from '../src/paul-content.js';
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
const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});globalThis.document=Object.assign(new EventTarget(),{createElement:()=>({getContext:()=>ctx}),querySelector:()=>null,activeElement:null});globalThis.window=new EventTarget();
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
const load=async id=>{const b=await readFile(new URL('../public/'+blenderModels[id].src,import.meta.url));return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};

test('three journeys select genuinely different cities with their own ground, water, actors and reachable objects',()=>{
 for(const c of paulSegments){const s=createHistoricalScene('paul',null,{segment:c.id}),m=s.walkModel;assert.equal(s.segment,c.id);assert.deepEqual(s.people.map(p=>p.id),[c.person]);assert.equal(s.objects.length,1);assert.equal(s.objects[0].segment,c.id);assert.equal(s.npcSystem.agents.length,15);assert.ok(s.scene.getObjectByName('paul-city-'+c.city));assert.equal(s.config.cutaway,false);assert.equal(s.roof.children.length,0);
  const ocean=s.scene.getObjectByName('paphos-open-water'),river=s.scene.getObjectByName('philippi-river-teaching-course'),theatre=s.scene.getObjectByName('ephesus-earlier-theatre-type');assert.equal(!!ocean,c.id==='ship');assert.equal(!!river,c.id==='square');assert.equal(!!theatre,c.id==='letter');if(ocean)assert.ok(ocean.geometry.parameters.width>1500);if(river){const a=river.geometry.attributes.position,centers=[];for(let i=0;i<a.count;i+=2)centers.push((a.getX(i)+a.getX(i+1))/2);assert.ok(Math.max(...centers)-Math.min(...centers)>6,'actual river surface meanders');assert.ok(s.scene.getObjectByName('philippi-shaped-riverbanks'));assert.ok(Math.abs(a.getZ(0))>900,'river endpoints stay beyond the scene fog');s.scene.updateMatrixWorld(true);for(const row of [120,140,160,170]){const z=a.getZ(row*2),x=(a.getX(row*2)+a.getX(row*2+1))/2,ray=new THREE.Raycaster(new THREE.Vector3(x,50,z),new THREE.Vector3(0,-1,0)),hit=ray.intersectObjects(s.occluders,false)[0];assert.ok(hit);assert.equal(hit.object,river,'far terrain never bridges above the river');}}
  assert.ok(m.valid(...[c.spawn[0],c.spawn[2]]));for(const p of paulPOIs(c.id))for(const q of p.slots)assert.ok(m.valid(q[0],q[2]),c.id+' '+p.id);
  assert.ok(m.path(c.spawn,s.objects[0].approach).length>1);assert.equal(m.valid(-22,18),false,'water is outside walkable ground');assert.equal(m.valid(43,26),false,'houses are not a walk-through plane');
  if(c.id==='ship'){assert.ok(m.path(c.spawn,[-25,.8,-1]).length>1);assert.ok(Math.abs(m.heightAt(-25,-1)-.8)<1e-6,'pier has physical ground');const boat=s.scene.getObjectByName('paphos-merchant-ship-comparison');assert.ok(boat);assert.equal(boat.scale.x,12);}
  s.dispose();
 }
 assert.match(paulHistorical.limits,/第一世紀末/);assert.match(paulHistorical.limits,/呂底亞/);assert.match(paulHistorical.limits,/羅馬/);
});

test('journey navigation, readings and observation records stay isolated from the other chapter islands',()=>{
 const state={selected:'paul',mode:'child',exodusSegment:'passover',narrativeSegments:{'second-temple':'work'},actor:null,mission:freshMission(),learning:freshLearning(),explorationSeen:{jordan:['jordan-stones']}};
 for(const c of paulSegments){assert.ok(setNarrativeChapter(state,'paul',c.id));assert.equal(stateChapter(state),c.id);assert.equal(stateChapter(state,'second-temple'),'work');assert.equal(stateChapter(state,'exodus'),'passover');assert.equal(explorationFor('paul',c.id).objects.length,1);assert.equal((peopleMarkup(state).match(/data-person=/g)||[]).length,1);assert.match(walkMarkup(state),new RegExp(c.person));const nav=narrativeChapterPicker('paul',c.id);assert.match(nav,/押解赴羅馬/);assert.match(nav,/本次行程/);assert.match(nav,/ACT\.27\.CSBT/);assert.ok(nav.includes(c.route));}
 assert.equal(setNarrativeChapter(state,'paul','work'),false);let record=state.explorationSeen;for(const o of paulObjects)record=observeObject(record,'paul',o.id);assert.deepEqual(record.paul,paulObjects.map(o=>o.id));assert.deepEqual(record.jordan,['jordan-stones']);let saved;const storage={setItem:(k,v)=>saved=v,getItem:()=>saved};writeExploration(storage,record);assert.deepEqual(readExploration(storage),record);
 let data=learningEvent(freshLearning(),'second-temple','study',{type:'note',text:'保留札記'}).data;data=learningEvent(data,'paul','study',{type:'inspect',id:'letter'}).data;data=learningEvent(data,'paul','study',{type:'answer',id:'letter',choice:'research'}).data;assert.deepEqual(learningRecord(data,'paul','study').completed,['letter']);assert.deepEqual(learningRecord(data,'paul','child').completed,[]);assert.equal(learningRecord(data,'second-temple','study').note,'保留札記');
});

test('each city sustains independent POI journeys and keeps social spacing against NPCs and the player',()=>{
 for(const c of paulSegments){const s=createHistoricalScene('paul',null,{segment:c.id}),n=s.npcSystem;assert.equal(new Set(n.agents.map(a=>a.seed)).size,15);assert.equal(new Set(n.agents.map(a=>a.timer)).size,15);let social=false;
  for(let frame=0;frame<4800;frame++){n.update(.05,{player:c.spawn});for(const [j,a] of n.agents.entries()){const p=a.actor.state.position;assert.ok(s.walkModel.valid(p[0],p[2]));assert.ok(Math.abs(p[1]-paulFloor(c.id,p[0],p[2]))<.001);assert.ok(a.speedFactor>=.85&&a.speedFactor<=1.15);assert.ok(distance(p,c.spawn)>=a.radius+.32+.024);social ||=!!a.partner;for(const b of n.agents.slice(j+1))assert.ok(distance(p,b.actor.state.position)>=a.radius+b.radius+.024,'non-overlapping city residents');}for(const p of n.pois)assert.ok(n.reservations.get(p.id).size<=p.capacity);}
  assert.ok(n.agents.every(a=>a.visits.size>=2),c.city+' all residents continue visiting new destinations');assert.ok(social);s.dispose();
 }
});

test('the actual player controller reaches each observation table through a settled moving crowd and descends without floating',()=>{
 for(const c of paulSegments){const s=createHistoricalScene('paul',null,{segment:c.id}),n=s.npcSystem;for(let i=0;i<2400;i++)n.update(.05);
  const canvas=Object.assign(new EventTarget(),{focus(){}}),walk=createWalkControls(new THREE.PerspectiveCamera(),canvas,{constrainMove:(a,b)=>n.constrainPlayer(a,b),navigationObstacles:()=>n.agents.map(a=>({position:a.actor.state.position,radius:a.radius+.32+.07}))}),spawn=n.safePlayerSpawn(c.spawn),destination=s.objects[0].approach;assert.ok(spawn);walk.start(s.walkModel,spawn);assert.ok(walk.navigate(destination));
  for(let i=0;i<4800&&distance(walk.position,destination)>.65;i++){n.update(.05,{player:walk.position});walk.update(.05);assert.ok(walk.groundState.isGrounded);for(const a of n.agents)assert.ok(distance(walk.position,a.actor.state.position)>=a.radius+.32+.024);}
  assert.ok(distance(walk.position,destination)<.65,c.city+' actual route completes');walk.dispose();
  for(const fps of [30,60,120]){const motor=createCharacterController(s.walkModel),start=c.id==='square'?[8,paulFloor(c.id,8,31),31]:[30,paulFloor(c.id,30,-16),-16];motor.reset(start);let previous=motor.visualPosition[1];for(let i=0;i<fps*8;i++){const dx=c.id==='square'?-1.7/fps:0,dz=c.id==='square'?0:1.7/fps,f=motor.speedFactor(dx,dz);motor.update(1/fps,dx*f,dz*f);assert.ok(motor.state.isGrounded);assert.ok(Math.abs(motor.visualPosition[1]-previous)<.035);previous=motor.visualPosition[1];}assert.ok(motor.position[1]<start[1]-.25,'descending changes physical ground height');}
  s.dispose();
 }
});

test('actual Blender objects include an open hull, separable deck, true folded fabric and an open crucible',async()=>{
 const ship=(await load('paul-ship')).scene;ship.updateMatrixWorld(true);const deck=ship.getObjectByName('paul-ship-deck');assert.ok(deck);const before=deck.getWorldPosition(new THREE.Vector3());setArtifactSeparation(ship,'paul-ship-deck',[0,.19,0]);ship.updateMatrixWorld(true);assert.ok(Math.abs(deck.getWorldPosition(new THREE.Vector3()).y-before.y-.19)<1e-6);setArtifactSeparation(ship,'paul-ship-deck',[0,0,0]);ship.updateMatrixWorld(true);
 const timber=[];ship.traverse(o=>{if(o.isMesh&&o.material.name==='paul-ship-timber'&&o.parent!==deck)timber.push(o);});assert.ok(timber.length);const hits=new THREE.Raycaster(new THREE.Vector3(0,.45,0),new THREE.Vector3(0,-1,0)).intersectObjects(timber,false);assert.ok(hits.length);assert.ok(hits[0].point.y<.15,'open hull exposes bottom below the deck');
 const fabric=(await load('paul-textiles')).scene;fabric.updateMatrixWorld(true);const woven=[];fabric.traverse(o=>{if(o.isMesh&&o.material.name==='paul-purple-comparison')woven.push(o);});assert.ok(woven.some(m=>m.geometry.attributes.position.count>5000),'folds and actual thickness have real vertices');const b=new THREE.Box3().setFromObject(fabric);assert.ok(b.max.y>.22&&b.max.x-b.min.x>1);
 const tools=(await load('paul-silverwork')).scene;tools.updateMatrixWorld(true);const meshes=[];tools.traverse(o=>{if(o.isMesh)meshes.push(o);});const bottom=new THREE.Raycaster(new THREE.Vector3(-.39,.5,.13),new THREE.Vector3(0,-1,0)).intersectObjects(meshes,false)[0];assert.ok(bottom);assert.ok(Math.abs(bottom.point.y-.035)<.003,'crucible has an interior floor rather than a solid plug');
});

test('arrival sightlines clear actual local Blender objects so nearby interaction can become available',async()=>{
 for(const c of paulSegments){const s=createHistoricalScene('paul',null,{segment:c.id,blenderAssets:true,assetLoader:load});await s.objects[0].root.userData.assetReady;await s.detailedResidents.ready;s.scene.updateMatrixWorld(true);const object=s.objects[0],eye=new THREE.Vector3(...object.approach).add(new THREE.Vector3(0,1.62,0)),delta=new THREE.Vector3(...object.lookAt).sub(eye);assert.ok(distance(object.approach,object.position)<=3.2);const ray=new THREE.Raycaster(eye,delta.clone().normalize(),.08,delta.length());assert.equal(ray.intersectObjects(s.occluders,false).length,0,c.city+' visible interaction sightline');s.dispose();}
});

test('new city figures have distinct animated rigs, continuous elbows and matching conversation LODs',async()=>{
 const ids=['port-worker','paul-trader','asian-artisan'],assets=await Promise.all(ids.map(load));const rigs=assets.map((a,index)=>{assert.deepEqual(a.animations.map(c=>c.name).sort(),characterClips(ids[index]));const meshes=[];a.scene.traverse(o=>{if(o.isSkinnedMesh)meshes.push(o);});assert.ok(meshes.length>3);const skin=meshes.find(m=>m.material.name==='skin'),sw=skin.geometry.attributes.skinWeight,si=skin.geometry.attributes.skinIndex;let blend=0;for(let i=0;i<si.count;i++){const names=[];for(let k=0;k<4;k++)if(sw.getComponent(i,k)>.01)names.push(skin.skeleton.bones[si.getComponent(i,k)].name);if(['L','R'].some(s=>names.includes('arm'+s)&&names.includes('forearm'+s)))blend++;}assert.ok(blend>=64);return meshes[0].skeleton;});assert.equal(new Set(rigs).size,3);
 for(const [i,c] of paulSegments.entries()){const s=createHistoricalScene('paul',null,{segment:c.id,blenderAssets:true,assetLoader:load});assert.ok(await s.detailedResidents.ready);const a=s.people[0],p=[...a.state.position];s.converse(a.id);for(let t=0;t<20;t++)s.animate(.05,[p[0]+2,p[1]+2,p[2]+3]);assert.deepEqual(a.state.position,p);assert.equal(s.detailedResidents.visible.get(a)?.root.userData.modelId,upgradedModelFor(ids[i]));s.dispose();}
});

test('all 24 city voice cues match general and child dialogue, actual files and returned character timings',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../src/voice-manifest.json',import.meta.url))),provenance=JSON.parse(await readFile(new URL('../docs/review/PAUL-VOICE-PROVENANCE.json',import.meta.url)));
 for(const p of paulPeople){const expected={greeting:p.greeting};for(const t of p.topics){expected[t.id]=t.answer;if(t.followup)expected[t.id+'-followup']=t.followup.answer;}const child=personForMode(p,'paul','child');expected['child-greeting']=child.greeting;for(const t of child.topics){expected['child-'+t.id]=t.answer;expected['child-'+t.id+'-followup']=t.followup.answer;}
  const take=provenance.takes.find(t=>t.id===p.id),voice=manifest[p.id],bytes=await readFile(new URL('../public/'+voice.src,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),take.mp3_sha256);assert.equal(take.audio.original_characters.map(c=>c.text).join(''),take.request.text);assert.equal(take.request.speed,1);assert.equal(voice.duration,take.mp3_duration);assert.ok(bytes.length>1000000);assert.deepEqual(Object.keys(voice.clips).sort(),Object.keys(expected).sort());let previous=0;for(const [id,c] of Object.entries(voice.clips)){assert.equal(c.text,expected[id]);assert.deepEqual(c,take.clips[id]);assert.ok(c.start>=previous-.061&&c.end>c.start&&c.end<=voice.duration);previous=c.end;}
 }
});
