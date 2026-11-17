import {upgradedModelFor} from '../src/human-motion-data.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createHistoricalScene} from '../src/historical-scenes.js';
import {sinaiSegments,sinaiFloor,sinaiObjects,sinaiPOIs} from '../src/sinai-exploration.js';
import {sinaiPeople,sinaiHistorical} from '../src/sinai-content.js';
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

test('Sinai chapters retain legacy stop IDs in chronological order and separate their actors, objects and landscape',()=>{
 assert.deepEqual(themeById.get('sinai').stops.map(s=>s.id),['manna','water','mountain']);
 const preview=createHistoricalScene('sinai',null,{segment:'manna'}),ground=preview.scene.getObjectByName('sinai-observation-ground');assert.equal(ground.geometry.attributes.color.count,ground.geometry.attributes.position.count,'vertex-colored near terrain has actual surface colours');assert.ok(ground.geometry.attributes.color.array.every(c=>c>.05));preview.dispose();
 for(const c of sinaiSegments){const s=createHistoricalScene('sinai',null,{segment:c.id}),m=s.walkModel;assert.equal(s.segment,c.id);assert.deepEqual(s.people.map(p=>p.id),[c.person]);assert.equal(s.objects.length,1);assert.equal(s.objects[0].segment,c.id);assert.equal(s.npcSystem.agents.length,13);const marker=s.scene.getObjectByName('sinai-chapter-'+c.id);assert.ok(marker);assert.equal(!!s.scene.getObjectByName('sinai-ex17-original-rock'),c.id==='water');assert.equal(!!s.scene.getObjectByName('sinai-modern-teaching-guide'),c.id==='mountain');assert.equal(s.config.cutaway,false);assert.ok(m.valid(c.spawn[0],c.spawn[2]));for(const p of sinaiPOIs(c.id))for(const q of p.slots)assert.ok(m.valid(q[0],q[2]),c.id+' '+p.id);assert.ok(m.path(c.spawn,s.objects[0].approach).length>1);assert.equal(m.valid(-25,-14),false,'rock work area is outside public route');assert.equal(m.valid(0,-28),false,'mountain ascent is not a public route');s.dispose();}
 for(const word of ['現代山址','現代教學圖層','綜合教學角色','民 20'])assert.ok(sinaiHistorical.limits.includes(word));
});

test('chapter changes isolate modes, dialogue, readings and observations without resetting other islands',()=>{
 const state={selected:'sinai',mode:'child',exodusSegment:'passover',narrativeSegments:{paul:'square'},actor:null,mission:freshMission(),learning:freshLearning(),explorationSeen:{paul:['paul-textiles']}};
 for(const c of sinaiSegments){assert.ok(setNarrativeChapter(state,'sinai',c.id));assert.equal(stateChapter(state),c.id);assert.equal(stateChapter(state,'paul'),'square');assert.equal(stateChapter(state,'exodus'),'passover');assert.equal(explorationFor('sinai',c.id).objects.length,1);assert.equal((peopleMarkup(state).match(/data-person=/g)||[]).length,1);assert.match(walkMarkup(state),new RegExp(c.person));const nav=narrativeChapterPicker('sinai',c.id);assert.match(nav,/西奈與曠野/);assert.match(nav,/EXO\./);assert.doesNotMatch(nav,/押解赴羅馬/);}
 assert.equal(setNarrativeChapter(state,'sinai','ship'),false);let record=state.explorationSeen;for(const o of sinaiObjects)record=observeObject(record,'sinai',o.id);assert.deepEqual(record.sinai,sinaiObjects.map(o=>o.id));assert.deepEqual(record.paul,['paul-textiles']);let saved;const storage={setItem:(k,v)=>saved=v,getItem:()=>saved};writeExploration(storage,record);assert.deepEqual(readExploration(storage),record);
 let data=learningEvent(freshLearning(),'paul','study',{type:'note',text:'保留札記'}).data;data=learningEvent(data,'sinai','study',{type:'inspect',id:'water'}).data;data=learningEvent(data,'sinai','study',{type:'answer',id:'water',choice:'reconstruction'}).data;assert.deepEqual(learningRecord(data,'sinai','study').completed,['water']);assert.deepEqual(learningRecord(data,'sinai','child').completed,[]);assert.equal(learningRecord(data,'paul','study').note,'保留札記');
});

test('mountain overview frames both the near camp and the actual highest terrain instead of clipping the mountain',()=>{
 const s=createHistoricalScene('sinai',null,{segment:'mountain'}),g=s.scene.getObjectByName('sinai-original-landscape-mountain').geometry.attributes.position,peak=new THREE.Vector3();for(let i=0;i<g.count;i++)if(g.getY(i)>peak.y)peak.fromBufferAttribute(g,i);
 for(const aspect of [.64,1.61]){const c=new THREE.PerspectiveCamera(39,aspect,.1,1800);c.position.fromArray(s.config.target).add(new THREE.Vector3(...s.config.overview));c.lookAt(new THREE.Vector3(...s.config.target));c.updateMatrixWorld();for(const p of [peak,new THREE.Vector3(0,sinaiFloor('mountain',0,7),7)]){const projected=p.clone().project(c);assert.ok(Math.abs(projected.y)<1,'camp and peak both lie in the actual vertical field of view');assert.ok(Math.abs(projected.x)<1);}}
 s.dispose();
});

test('cross-chapter follow-ups expose CSBT links to the passages they actually discuss',()=>{
 for(const [actor,topic,segment,urls] of [['sinai-road-companion','witness','water',['EXO.17.1-7.CSBT','NUM.20.1-13.CSBT']],['sinai-camp-parent','prepare','mountain',['EXO.19.10-25.CSBT','EXO.24.12-18.CSBT','EXO.31.18.CSBT']]]){const p=sinaiPeople.find(p=>p.id===actor),t=p.topics.find(t=>t.id===topic),html=peopleMarkup({selected:'sinai',mode:'general',actor,narrativeSegments:{sinai:segment},dialogue:[{topic,isFollowup:true,question:t.followup.question,answer:t.followup.answer,reference:t.reference,passage:t.passage,stop:t.stop}]});for(const url of urls)assert.ok(html.includes('https://www.bible.com/zh-TW/bible/312/'+url));}
});

test('thirteen residents sustain individual POI decisions, separation and short social encounters',()=>{
 for(const c of sinaiSegments){const s=createHistoricalScene('sinai',null,{segment:c.id}),n=s.npcSystem;assert.equal(new Set(n.agents.map(a=>a.seed)).size,13);assert.equal(new Set(n.agents.map(a=>a.timer)).size,13);let social=false;
  for(let frame=0;frame<4800;frame++){n.update(.05,{player:c.spawn});for(const [j,a] of n.agents.entries()){const p=a.actor.state.position;assert.ok(s.walkModel.valid(p[0],p[2]));assert.ok(Math.abs(p[1]-sinaiFloor(c.id,p[0],p[2]))<.001);assert.ok(a.speedFactor>=.85&&a.speedFactor<=1.15);assert.ok(distance(p,c.spawn)>=a.radius+.32+.024);social ||=!!a.partner;for(const b of n.agents.slice(j+1))assert.ok(distance(p,b.actor.state.position)>=a.radius+b.radius+.024);}for(const p of n.pois)assert.ok(n.reservations.get(p.id).size<=p.capacity);}
  assert.ok(n.agents.every(a=>a.visits.size>=2),c.id+' all residents keep visiting different POIs');assert.ok(social);s.dispose();
 }
});

test('actual player controller reaches each object through a moving crowd and stays grounded on descending public paths',()=>{
 for(const c of sinaiSegments){const s=createHistoricalScene('sinai',null,{segment:c.id}),n=s.npcSystem;for(let i=0;i<2400;i++)n.update(.05);const canvas=Object.assign(new EventTarget(),{focus(){}}),walk=createWalkControls(new THREE.PerspectiveCamera(),canvas,{constrainMove:(a,b)=>n.constrainPlayer(a,b),navigationObstacles:()=>n.agents.map(a=>({position:a.actor.state.position,radius:a.radius+.32+.07}))}),spawn=n.safePlayerSpawn(c.spawn),destination=s.objects[0].approach;assert.ok(spawn);walk.start(s.walkModel,spawn);assert.ok(walk.navigate(destination));
  for(let i=0;i<4800&&distance(walk.position,destination)>.65;i++){n.update(.05,{player:walk.position});walk.update(.05);assert.ok(walk.groundState.isGrounded);for(const a of n.agents)assert.ok(distance(walk.position,a.actor.state.position)>=a.radius+.32+.024);}assert.ok(distance(walk.position,destination)<.65,c.id+' route completes');walk.dispose();
  for(const fps of [30,60,120]){const motor=createCharacterController(s.walkModel),x=17,z=c.id==='water'?17:-15;motor.reset([x,sinaiFloor(c.id,x,z),z]);const start=motor.position[1];let previous=motor.visualPosition[1];for(let i=0;i<fps*12;i++){const dx=c.id==='manna'?-1.7/fps:0,dz=c.id==='manna'?0:c.id==='water'?-1.7/fps:1.7/fps,f=motor.speedFactor(dx,dz);motor.update(1/fps,dx*f,dz*f);assert.ok(motor.state.isGrounded);assert.ok(Math.abs(motor.visualPosition[1]-previous)<.035);previous=motor.visualPosition[1];}assert.ok(motor.position[1]<start-.2);}s.dispose();
 }
});

test('arrival view clears actual loaded GLB objects and scenery, enabling close interaction',async()=>{
 for(const c of sinaiSegments){const s=createHistoricalScene('sinai',null,{segment:c.id,blenderAssets:true,assetLoader:load});await s.objects[0].root.userData.assetReady;await s.detailedResidents.ready;s.scene.updateMatrixWorld(true);const object=s.objects[0],eye=new THREE.Vector3(...object.approach).add(new THREE.Vector3(0,1.62,0)),delta=new THREE.Vector3(...object.lookAt).sub(eye);assert.ok(distance(object.approach,object.position)<=3.2);const ray=new THREE.Raycaster(eye,delta.clone().normalize(),.08,delta.length());assert.equal(ray.intersectObjects(s.occluders,false).length,0,c.id+' clear sightline');s.dispose();}
});

test('loaded Sinai bowls have real inner bottoms, the water is exposed, and the modern guide separates and restores',async()=>{
 const manna=(await load('sinai-manna')).scene;manna.updateMatrixWorld(true);const containers=[];manna.traverse(o=>{if(o.isMesh&&o.material.name==='sinai-ordinary-unglazed-earthenware')containers.push(o);});assert.equal(containers.length,3);
 for(const [x,z] of [[-.34,0],[.252,-.193],[.252,.193]]){const hit=new THREE.Raycaster(new THREE.Vector3(x,.4,z),new THREE.Vector3(0,-1,0)).intersectObjects(containers,false)[0];assert.ok(hit);assert.ok(Math.abs(hit.point.y-.038)<.001,'ray sees true inner bottom rather than a solid capped bowl');}
 const water=(await load('sinai-water')).scene;assert.ok(water.getObjectByName('sinai-water-original-rock-surface'));assert.ok(water.getObjectByName('sinai-water-exposed-flow-comparison'));water.updateMatrixWorld(true);const size=new THREE.Box3().setFromObject(water).getSize(new THREE.Vector3());assert.ok(size.y>.48&&size.y<.50);
 const root=(await load('sinai-boundary')).scene;root.updateMatrixWorld(true);const guide=root.getObjectByName('sinai-boundary-guide'),start=guide.getWorldPosition(new THREE.Vector3());setArtifactSeparation(root,guide.name,[0,.14,0]);root.updateMatrixWorld(true);assert.ok(Math.abs(guide.getWorldPosition(new THREE.Vector3()).y-start.y-.14)<1e-6);setArtifactSeparation(root,guide.name,[0,0,0]);root.updateMatrixWorld(true);assert.ok(guide.getWorldPosition(new THREE.Vector3()).distanceTo(start)<1e-6);
});

test('Sinai residents use the undated wilderness rigs, and mountain clouds move without changing frozen NPC clocks',async()=>{
 for(const [i,c] of sinaiSegments.entries()){const s=createHistoricalScene('sinai',null,{segment:c.id,blenderAssets:true,assetLoader:load});await s.detailedResidents.ready;const a=s.people[0],p=[...a.state.position];assert.equal(a.modelId,upgradedModelFor(i===2?'wilderness-woman':'wilderness-resident'));assert.ok(s.npcSystem.agents.every(a=>['wilderness-resident','wilderness-woman','wilderness-child'].map(upgradedModelFor).includes(a.actor.modelId)));s.converse(a.id);s.animate(.05,[p[0]+2,p[1]+2,p[2]+3]);assert.deepEqual(a.state.position,p);assert.equal(s.detailedResidents.visible.get(a)?.root.userData.modelId,a.modelId);
  if(c.id==='mountain'){const cloud=s.scene.getObjectByName('sinai-unidentified-mountain-cloud-0'),before=cloud.position.clone();s.animate(2,[41,29,45]);assert.ok(cloud.position.distanceTo(before)>.01);const held=cloud.position.clone(),clock=a.state.time;s.animate(0,[31,20,25]);assert.deepEqual(cloud.position,held);assert.equal(a.state.time,clock);}
  s.dispose();
 }
});

test('all 24 new dialogue cues match actual audio, mode text and returned character timestamps',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../src/voice-manifest.json',import.meta.url))),provenance=JSON.parse(await readFile(new URL('../docs/review/SINAI-VOICE-PROVENANCE.json',import.meta.url)));
 for(const p of sinaiPeople){const expected={greeting:p.greeting};for(const t of p.topics){expected[t.id]=t.answer;if(t.followup)expected[t.id+'-followup']=t.followup.answer;}const child=personForMode(p,'sinai','child');expected['child-greeting']=child.greeting;for(const t of child.topics){expected['child-'+t.id]=t.answer;expected['child-'+t.id+'-followup']=t.followup.answer;}const take=provenance.takes.find(t=>t.id===p.id),voice=manifest[p.id],bytes=await readFile(new URL('../public/'+voice.src,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),take.mp3_sha256);assert.equal(take.audio.original_characters.map(c=>c.text).join(''),take.request.text);assert.equal(take.request.speed,1);assert.equal(voice.duration,take.mp3_duration);assert.ok(bytes.length>1000000);assert.deepEqual(Object.keys(voice.clips).sort(),Object.keys(expected).sort());let previous=0;for(const [id,c] of Object.entries(voice.clips)){assert.equal(c.text,expected[id]);assert.deepEqual(c,take.clips[id]);assert.ok(c.start>=previous-.061&&c.end>c.start&&c.end<=voice.duration);previous=c.end;}}
});
