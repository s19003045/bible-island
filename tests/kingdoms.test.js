import {upgradedModelFor} from '../src/human-motion-data.js';
import {createVessel} from '../src/vessels.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createHistoricalScene} from '../src/historical-scenes.js';
import {kingdomsSegments,kingdomsFloor,kingdomsObjects,kingdomsPOIs} from '../src/kingdoms-exploration.js';
import {kingdomsPeople,kingdomsHistorical} from '../src/kingdoms-content.js';
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
import {setArtifactSeparation,setArtifactReadingLayer} from '../src/artifact-inspection.js';
import {themeById} from '../src/content.js';
const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});globalThis.document=Object.assign(new EventTarget(),{createElement:()=>({getContext:()=>ctx}),querySelector:()=>null,activeElement:null});globalThis.window=new EventTarget();
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
const load=async id=>{const b=await readFile(new URL('../public/'+blenderModels[id].src,import.meta.url));return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};

test('Kingdoms chapters retain legacy stop IDs in chronological order and separate their actors, objects and landscape',()=>{
 assert.deepEqual(themeById.get('kingdoms').stops.map(s=>s.id),['south','north','prophet']);
 const preview=createHistoricalScene('kingdoms',null,{segment:'south'}),ground=preview.scene.getObjectByName('kingdoms-public-ground');assert.equal(ground.geometry.attributes.color.count,ground.geometry.attributes.position.count,'vertex-colored near terrain has actual surface colours');assert.ok(ground.geometry.attributes.color.array.every(c=>c>.05));preview.dispose();
 for(const c of kingdomsSegments){const s=createHistoricalScene('kingdoms',null,{segment:c.id}),m=s.walkModel;assert.equal(s.segment,c.id);assert.deepEqual(s.people.map(p=>p.id),[c.person]);assert.equal(s.objects.length,1);assert.equal(s.objects[0].segment,c.id);assert.equal(s.npcSystem.agents.length,13);const marker=s.scene.getObjectByName('kingdoms-chapter-'+c.id);assert.ok(marker);assert.equal(!!s.scene.getObjectByName('kingdoms-shechem-assembly-context'),c.id==='south');assert.equal(!!s.scene.getObjectByName('kingdoms-bethel-reading-context'),c.id==='north');assert.equal(!!s.scene.getObjectByName('kingdoms-later-public-gate-context'),c.id==='prophet');assert.equal(s.config.cutaway,false);assert.ok(m.valid(c.spawn[0],c.spawn[2]));for(const p of kingdomsPOIs(c.id))for(const q of p.slots)assert.ok(m.valid(q[0],q[2]),c.id+' '+p.id);assert.ok(m.path(c.spawn,s.objects[0].approach).length>1);assert.equal(m.valid(-27,-15),false,'background farm work is outside the public observation route');assert.equal(m.valid(0,-27),false,'gate building is outside the public route');s.dispose();}
 for(const word of ['尼八','約阿施','摩5','摩8','容量','重量','示劍'])assert.ok(kingdomsHistorical.limits.includes(word));
});

test('chapter changes isolate modes, dialogue, readings and observations without resetting other islands',()=>{
 const state={selected:'kingdoms',mode:'child',exodusSegment:'passover',narrativeSegments:{paul:'square'},actor:null,mission:freshMission(),learning:freshLearning(),explorationSeen:{paul:['paul-textiles']}};
 for(const c of kingdomsSegments){assert.ok(setNarrativeChapter(state,'kingdoms',c.id));assert.equal(stateChapter(state),c.id);assert.equal(stateChapter(state,'paul'),'square');assert.equal(stateChapter(state,'exodus'),'passover');assert.equal(explorationFor('kingdoms',c.id).objects.length,1);assert.equal((peopleMarkup(state).match(/data-person=/g)||[]).length,1);assert.match(walkMarkup(state),new RegExp(c.person));const nav=narrativeChapterPicker('kingdoms',c.id);assert.match(nav,/分裂王國與先知/);assert.match(nav,/1KI\.|AMO\./);assert.doesNotMatch(nav,/押解赴羅馬/);}
 assert.equal(setNarrativeChapter(state,'kingdoms','ship'),false);let record=state.explorationSeen;for(const o of kingdomsObjects)record=observeObject(record,'kingdoms',o.id);assert.deepEqual(record.kingdoms,kingdomsObjects.map(o=>o.id));assert.deepEqual(record.paul,['paul-textiles']);let saved;const storage={setItem:(k,v)=>saved=v,getItem:()=>saved};writeExploration(storage,record);assert.deepEqual(readExploration(storage),record);
 let data=learningEvent(freshLearning(),'paul','study',{type:'note',text:'保留札記'}).data;data=learningEvent(data,'kingdoms','study',{type:'inspect',id:'prophet'}).data;data=learningEvent(data,'kingdoms','study',{type:'answer',id:'prophet',choice:'reconstruction'}).data;assert.deepEqual(learningRecord(data,'kingdoms','study').completed,['prophet']);assert.deepEqual(learningRecord(data,'kingdoms','child').completed,[]);assert.equal(learningRecord(data,'paul','study').note,'保留札記');
});

test('gate follow-up uses its own Amos5 reference, rather than the parent topic or Amos8',()=>{
 const p=kingdomsPeople[2],t=p.topics[0],html=peopleMarkup({selected:'kingdoms',mode:'general',actor:p.id,narrativeSegments:{kingdoms:'prophet'},dialogue:[{topic:t.id,isFollowup:true,question:t.followup.question,answer:t.followup.answer,reference:t.followup.reference,passage:t.followup.passage,stop:t.stop}]});
 assert.ok(html.includes('https://www.bible.com/zh-TW/bible/312/AMO.5.21-24.CSBT'));assert.ok(!html.includes('biblegateway.com'));
});

test('thirteen residents sustain individual POI decisions, separation and short social encounters',()=>{
 for(const c of kingdomsSegments){const s=createHistoricalScene('kingdoms',null,{segment:c.id}),n=s.npcSystem;assert.equal(new Set(n.agents.map(a=>a.seed)).size,13);assert.equal(new Set(n.agents.map(a=>a.timer)).size,13);let social=false;
  for(let frame=0;frame<4800;frame++){n.update(.05,{player:c.spawn});for(const [j,a] of n.agents.entries()){const p=a.actor.state.position;assert.ok(s.walkModel.valid(p[0],p[2]));assert.ok(Math.abs(p[1]-kingdomsFloor(c.id,p[0],p[2]))<.001);assert.ok(a.speedFactor>=.85&&a.speedFactor<=1.15);assert.ok(distance(p,c.spawn)>=a.radius+.32+.024);social ||=!!a.partner;for(const b of n.agents.slice(j+1))assert.ok(distance(p,b.actor.state.position)>=a.radius+b.radius+.024);}for(const p of n.pois)assert.ok(n.reservations.get(p.id).size<=p.capacity);}
  assert.ok(n.agents.every(a=>a.visits.size>=2),c.id+' all residents keep visiting different POIs');assert.ok(social);s.dispose();
 }
});

test('actual player controller reaches each object through a moving crowd and stays grounded on descending public paths',()=>{
 for(const c of kingdomsSegments){const s=createHistoricalScene('kingdoms',null,{segment:c.id}),n=s.npcSystem;for(let i=0;i<2400;i++)n.update(.05);const canvas=Object.assign(new EventTarget(),{focus(){}}),walk=createWalkControls(new THREE.PerspectiveCamera(),canvas,{constrainMove:(a,b)=>n.constrainPlayer(a,b),navigationObstacles:()=>n.agents.map(a=>({position:a.actor.state.position,radius:a.radius+.32+.07}))}),spawn=n.safePlayerSpawn(c.spawn),destination=s.objects[0].approach;assert.ok(spawn);walk.start(s.walkModel,spawn);assert.ok(walk.navigate(destination));
  for(let i=0;i<4800&&distance(walk.position,destination)>.65;i++){n.update(.05,{player:walk.position});walk.update(.05);assert.ok(walk.groundState.isGrounded);for(const a of n.agents)assert.ok(distance(walk.position,a.actor.state.position)>=a.radius+.32+.024);}assert.ok(distance(walk.position,destination)<.65,c.id+' route completes');walk.dispose();
  for(const fps of [30,60,120]){const motor=createCharacterController(s.walkModel),x=c.id==='prophet'?25:17,z=c.id==='south'?23:-15;motor.reset([x,kingdomsFloor(c.id,x,z),z]);const start=motor.position[1];let previous=motor.visualPosition[1];for(let i=0;i<fps*12;i++){const dx=c.id==='prophet'?-1.7/fps:0,dz=c.id==='prophet'?0:c.id==='south'?-1.7/fps:1.7/fps,f=motor.speedFactor(dx,dz);motor.update(1/fps,dx*f,dz*f);assert.ok(motor.state.isGrounded);assert.ok(Math.abs(motor.visualPosition[1]-previous)<.035);previous=motor.visualPosition[1];}assert.ok(motor.position[1]<start-.2);}s.dispose();
 }
});

test('arrival view clears actual loaded GLB objects and scenery, enabling close interaction',async()=>{
 for(const c of kingdomsSegments){const s=createHistoricalScene('kingdoms',null,{segment:c.id,blenderAssets:true,assetLoader:load});await s.objects[0].root.userData.assetReady;await s.detailedResidents.ready;s.scene.updateMatrixWorld(true);const object=s.objects[0],eye=new THREE.Vector3(...object.approach).add(new THREE.Vector3(0,1.62,0)),delta=new THREE.Vector3(...object.lookAt).sub(eye);assert.ok(distance(object.approach,object.position)<=3.2);const ray=new THREE.Raycaster(eye,delta.clone().normalize(),.08,delta.length());assert.equal(ray.intersectObjects(s.occluders,false).length,0,c.id+' clear sightline');s.dispose();}
});

test('GLB layers separate in world units and Amos8 extension can hide without hiding the public gate',async()=>{
 for(const id of ['kingdom-assembly','kingdom-sites','kingdom-measures']){const root=(await load(id)).scene,{part,offset}=blenderModels[id].articulation,p=root.getObjectByName(part);assert.ok(p);root.updateMatrixWorld(true);const start=p.getWorldPosition(new THREE.Vector3());assert.ok(setArtifactSeparation(root,part,offset));root.updateMatrixWorld(true);assert.ok(p.getWorldPosition(new THREE.Vector3()).distanceTo(start.clone().add(new THREE.Vector3(...offset)))<1e-6);setArtifactSeparation(root,part,[0,0,0]);root.updateMatrixWorld(true);assert.ok(p.getWorldPosition(new THREE.Vector3()).distanceTo(start)<1e-6);if(id==='kingdom-measures'){const layer=blenderModels[id].readingLayer;assert.ok(setArtifactReadingLayer(root,layer.part,false));let hidden=0,visible=0;root.getObjectByName(layer.part).traverse(o=>{if(o.isMesh)hidden++;});root.traverseVisible(o=>{if(o.isMesh)visible++;});assert.ok(hidden>5);assert.ok(visible>1&&visible<hidden);assert.ok(setArtifactReadingLayer(root,layer.part,true));assert.ok(root.getObjectByName(layer.part).visible);}}
 // The loading fallback honours the same controls before the GLB arrives.
 for(const id of ['kingdom-assembly','kingdom-sites','kingdom-measures']){const root=createVessel(id),{part,offset}=blenderModels[id].articulation;assert.ok(setArtifactSeparation(root,part,offset));if(id==='kingdom-measures')assert.ok(setArtifactReadingLayer(root,blenderModels[id].readingLayer.part,false));}
});

test('Kingdoms residents use explicitly mapped undated clothing with independent clocks, held dialogue and shared Blender detail',async()=>{
 for(const [i,c] of kingdomsSegments.entries()){const s=createHistoricalScene('kingdoms',null,{segment:c.id,blenderAssets:true,assetLoader:load});await s.detailedResidents.ready;const a=s.people[0],p=[...a.state.position];assert.equal(a.modelId,upgradedModelFor(i===0?'iron-woman':'iron-resident'));assert.ok(s.npcSystem.agents.every(a=>['iron-resident','iron-woman','wilderness-child'].map(upgradedModelFor).includes(a.actor.modelId)));s.converse(a.id);s.animate(.05,[p[0]+2,p[1]+2,p[2]+3]);assert.deepEqual(a.state.position,p);assert.equal(s.detailedResidents.visible.get(a)?.root.userData.modelId,a.modelId);const clocks=s.npcSystem.agents.map(a=>a.actor.state.time),positions=s.npcSystem.agents.map(a=>[...a.actor.state.position]);s.animate(0,[31,20,25]);assert.deepEqual(s.npcSystem.agents.map(a=>a.actor.state.time),clocks);assert.deepEqual(s.npcSystem.agents.map(a=>a.actor.state.position),positions);s.dispose();}
});

test('all 24 new dialogue cues match actual audio, mode text and returned character timestamps',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../src/voice-manifest.json',import.meta.url))),provenance=JSON.parse(await readFile(new URL('../docs/review/KINGDOMS-VOICE-PROVENANCE.json',import.meta.url)));
 for(const p of kingdomsPeople){const expected={greeting:p.greeting};for(const t of p.topics){expected[t.id]=t.answer;if(t.followup)expected[t.id+'-followup']=t.followup.answer;}const child=personForMode(p,'kingdoms','child');expected['child-greeting']=child.greeting;for(const t of child.topics){expected['child-'+t.id]=t.answer;expected['child-'+t.id+'-followup']=t.followup.answer;}const take=provenance.takes.find(t=>t.id===p.id),voice=manifest[p.id],bytes=await readFile(new URL('../public/'+voice.src,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),take.mp3_sha256);assert.equal(take.audio.original_characters.map(c=>c.text).join(''),take.request.text);assert.equal(take.request.speed,1);assert.equal(voice.duration,take.mp3_duration);assert.ok(bytes.length>1000000);assert.deepEqual(Object.keys(voice.clips).sort(),Object.keys(expected).sort());let previous=0;for(const [id,c] of Object.entries(voice.clips)){assert.equal(c.text,expected[id]);assert.deepEqual(c,take.clips[id]);assert.ok(c.start>=previous-.061&&c.end>c.start&&c.end<=voice.duration);previous=c.end;}}
});
