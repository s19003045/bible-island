import {upgradedModelFor} from '../src/human-motion-data.js';
import {createVessel} from '../src/vessels.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createHistoricalScene} from '../src/historical-scenes.js';
import {exileSegments,exileFloor,exileObjects,exilePOIs} from '../src/exile-exploration.js';
import {exilePeople,exileHistorical} from '../src/exile-content.js';
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
const checkInstanceScales=scene=>{const m=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),scale=new THREE.Vector3();scene.traverse(o=>{if(!o.isInstancedMesh)return;for(let i=0;i<o.count;i++){o.getMatrixAt(i,m);m.decompose(p,q,scale);assert.ok([scale.x,scale.y,scale.z].every(v=>Number.isFinite(v)&&v>0),o.name+' instance '+i+' has usable geometry');}});};
const load=async id=>{const b=await readFile(new URL('../public/'+blenderModels[id].src,import.meta.url));return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};

test('Exile chapters retain legacy stop IDs while separating overview, retrospective reading and poetry and separate their actors, objects and landscape',()=>{
 assert.deepEqual(themeById.get('exile').stops.map(s=>s.id),['road','canal','home']);
 const preview=createHistoricalScene('exile',null,{segment:'road'}),ground=preview.scene.getObjectByName('exile-public-ground');assert.equal(ground.geometry.attributes.color.count,ground.geometry.attributes.position.count,'vertex-colored near terrain has actual surface colours');assert.ok(ground.geometry.attributes.color.array.every(c=>c>.05));preview.dispose();
 for(const c of exileSegments){const s=createHistoricalScene('exile',null,{segment:c.id}),m=s.walkModel;checkInstanceScales(s.scene);assert.equal(s.segment,c.id);assert.deepEqual(s.people.map(p=>p.id),[c.person]);assert.equal(s.objects.length,1);assert.equal(s.objects[0].segment,c.id);assert.equal(s.npcSystem.agents.length,13);const marker=s.scene.getObjectByName('exile-chapter-'+c.id);assert.ok(marker);assert.equal(!!s.scene.getObjectByName('exile-sequence-context'),c.id==='road');assert.equal(!!s.scene.getObjectByName('exile-generic-waterbank-context'),c.id==='canal');assert.equal(!!s.scene.getObjectByName('exile-letter-and-orchard-context'),c.id==='home');assert.equal(s.config.cutaway,false);assert.ok(m.valid(c.spawn[0],c.spawn[2]));for(const p of exilePOIs(c.id))for(const q of p.slots)assert.ok(m.valid(q[0],q[2]),c.id+' '+p.id);assert.ok(m.path(c.spawn,s.objects[0].approach).length>1);assert.equal(m.valid(-27,-15),false,'background work is outside the public observation route');assert.equal(m.valid(0,-27),false,'background settlement is outside the public route');s.dispose();}
 for(const word of ['約雅敬','約雅斤','西底加','迦巴魯河','果園','七十年'])assert.ok(exileHistorical.limits.includes(word));
});

test('chapter changes isolate modes, dialogue, readings and observations without resetting other islands',()=>{
 const state={selected:'exile',mode:'child',exodusSegment:'passover',narrativeSegments:{paul:'square'},actor:null,mission:freshMission(),learning:freshLearning(),explorationSeen:{paul:['paul-textiles']}};
 for(const c of exileSegments){assert.ok(setNarrativeChapter(state,'exile',c.id));assert.equal(stateChapter(state),c.id);assert.equal(stateChapter(state,'paul'),'square');assert.equal(stateChapter(state,'exodus'),'passover');assert.equal(explorationFor('exile',c.id).objects.length,1);assert.equal((peopleMarkup(state).match(/data-person=/g)||[]).length,1);assert.match(walkMarkup(state),new RegExp(c.person));const nav=narrativeChapterPicker('exile',c.id);assert.match(nav,/被擄巴比倫/);assert.match(nav,/2KI\.|EZK\.|JER\./);assert.doesNotMatch(nav,/押解赴羅馬/);}
 assert.equal(setNarrativeChapter(state,'exile','ship'),false);let record=state.explorationSeen;for(const o of exileObjects)record=observeObject(record,'exile',o.id);assert.deepEqual(record.exile,exileObjects.map(o=>o.id));assert.deepEqual(record.paul,['paul-textiles']);let saved;const storage={setItem:(k,v)=>saved=v,getItem:()=>saved};writeExploration(storage,record);assert.deepEqual(readExploration(storage),record);
 let data=learningEvent(freshLearning(),'paul','study',{type:'note',text:'保留札記'}).data;data=learningEvent(data,'exile','study',{type:'inspect',id:'canal'}).data;data=learningEvent(data,'exile','study',{type:'answer',id:'canal',choice:'reconstruction'}).data;assert.deepEqual(learningRecord(data,'exile','study').completed,['canal']);assert.deepEqual(learningRecord(data,'exile','child').completed,[]);assert.equal(learningRecord(data,'paul','study').note,'保留札記');
});

test('waterbank chapter and follow-up preserve distinct Ezekiel and Psalm CSBT destinations',()=>{
 const nav=narrativeChapterPicker('exile','canal');for(const ref of ['EZK.1.1-3.CSBT','PSA.137.CSBT'])assert.ok(nav.includes('https://www.bible.com/zh-TW/bible/312/'+ref));
 const p=exilePeople[1],t=p.topics[0],html=peopleMarkup({selected:'exile',mode:'general',actor:p.id,narrativeSegments:{exile:'canal'},dialogue:[{topic:t.id,isFollowup:true,question:t.followup.question,answer:t.followup.answer,reference:t.followup.reference,passage:t.followup.passage,stop:t.stop}]});
 assert.ok(html.includes('https://www.bible.com/zh-TW/bible/312/PSA.137.1-6.CSBT'));assert.ok(!html.includes('biblegateway.com'));
});

test('thirteen residents sustain individual POI decisions, separation and short social encounters',()=>{
 for(const c of exileSegments){const s=createHistoricalScene('exile',null,{segment:c.id}),n=s.npcSystem;assert.equal(new Set(n.agents.map(a=>a.seed)).size,13);assert.equal(new Set(n.agents.map(a=>a.timer)).size,13);let social=false;
  for(let frame=0;frame<4800;frame++){n.update(.05,{player:c.spawn});for(const [j,a] of n.agents.entries()){const p=a.actor.state.position;assert.ok(s.walkModel.valid(p[0],p[2]));assert.ok(Math.abs(p[1]-exileFloor(c.id,p[0],p[2]))<.001);assert.ok(a.speedFactor>=.85&&a.speedFactor<=1.15);assert.ok(distance(p,c.spawn)>=a.radius+.32+.024);social ||=!!a.partner;for(const b of n.agents.slice(j+1))assert.ok(distance(p,b.actor.state.position)>=a.radius+b.radius+.024);}for(const p of n.pois)assert.ok(n.reservations.get(p.id).size<=p.capacity);}
  assert.ok(n.agents.every(a=>a.visits.size>=2),c.id+' all residents keep visiting different POIs');assert.ok(social);s.dispose();
 }
});

test('actual player controller reaches each object through a moving crowd and stays grounded on descending public paths',()=>{
 for(const c of exileSegments){const s=createHistoricalScene('exile',null,{segment:c.id}),n=s.npcSystem;for(let i=0;i<2400;i++)n.update(.05);const canvas=Object.assign(new EventTarget(),{focus(){}}),walk=createWalkControls(new THREE.PerspectiveCamera(),canvas,{constrainMove:(a,b)=>n.constrainPlayer(a,b),navigationObstacles:()=>n.agents.map(a=>({position:a.actor.state.position,radius:a.radius+.32+.07}))}),spawn=n.safePlayerSpawn(c.spawn),destination=s.objects[0].approach;assert.ok(spawn);walk.start(s.walkModel,spawn);assert.ok(walk.navigate(destination));
  for(let i=0;i<4800&&distance(walk.position,destination)>.65;i++){n.update(.05,{player:walk.position});walk.update(.05);assert.ok(walk.groundState.isGrounded);for(const a of n.agents)assert.ok(distance(walk.position,a.actor.state.position)>=a.radius+.32+.024);}assert.ok(distance(walk.position,destination)<.65,c.id+' route completes');walk.dispose();
  for(const fps of [30,60,120]){const motor=createCharacterController(s.walkModel),x=c.id==='canal'?25:17,z=23;motor.reset([x,exileFloor(c.id,x,z),z]);const start=motor.position[1];let previous=motor.visualPosition[1];for(let i=0;i<fps*12;i++){const dx=c.id==='canal'?-1.7/fps:0,dz=c.id==='canal'?0:-1.7/fps,f=motor.speedFactor(dx,dz);motor.update(1/fps,dx*f,dz*f);assert.ok(motor.state.isGrounded);assert.ok(Math.abs(motor.visualPosition[1]-previous)<.035);previous=motor.visualPosition[1];}assert.ok(motor.position[1]<start-.08);}s.dispose();
 }
});

test('arrival view clears actual loaded GLB objects and scenery, enabling close interaction',async()=>{
 for(const c of exileSegments){const s=createHistoricalScene('exile',null,{segment:c.id,blenderAssets:true,assetLoader:load});await s.objects[0].root.userData.assetReady;await s.detailedResidents.ready;s.scene.updateMatrixWorld(true);const object=s.objects[0],eye=new THREE.Vector3(...object.approach).add(new THREE.Vector3(0,1.62,0)),delta=new THREE.Vector3(...object.lookAt).sub(eye);assert.ok(distance(object.approach,object.position)<=3.2);const ray=new THREE.Raycaster(eye,delta.clone().normalize(),.08,delta.length());assert.equal(ray.intersectObjects(s.occluders,false).length,0,c.id+' clear sightline');s.dispose();}
});

test('all three actual GLB and fallback layers lift, separate and restore in authored world units',async()=>{
 for(const id of ['exile-sequence','exile-waterbank','exile-dwelling'])for(const root of [(await load(id)).scene,createVessel(id)]){const {part,offset}=blenderModels[id].articulation,p=root.getObjectByName(part);assert.ok(p);root.updateMatrixWorld(true);const start=p.getWorldPosition(new THREE.Vector3());assert.ok(setArtifactSeparation(root,part,offset));root.updateMatrixWorld(true);assert.ok(p.getWorldPosition(new THREE.Vector3()).distanceTo(start.clone().add(new THREE.Vector3(...offset)))<1e-6);setArtifactSeparation(root,part,[0,0,0]);root.updateMatrixWorld(true);assert.ok(p.getWorldPosition(new THREE.Vector3()).distanceTo(start)<1e-6);}
});

test('actual dwelling GLB has a through doorway and an exposed interior floor beneath the removable roof',async()=>{
 const root=(await load('exile-dwelling')).scene;root.updateMatrixWorld(true);const walls=root.getObjectByName('exile-dwelling-thick-walls-and-through-door'),jamb=root.getObjectByName('exile-dwelling-wall-front-left-jamb'),front=new THREE.Box3().setFromObject(jamb).getCenter(new THREE.Vector3()).z;
 assert.ok(walls&&jamb);for(const x of [-.33,-.25,-.17])for(const y of [.07,.18,.29])for(const sign of [-1,1]){const ray=new THREE.Raycaster(new THREE.Vector3(x,y,front+sign*.09),new THREE.Vector3(0,0,-sign),0,.18);assert.equal(ray.intersectObject(walls,true).length,0,'doorway open from both sides');}
 root.getObjectByName('exile-dwelling-roof-layer').visible=false;const meshes=[];root.traverseVisible(o=>{if(o.isMesh)meshes.push(o);});const hit=new THREE.Raycaster(new THREE.Vector3(-.25,1,0),new THREE.Vector3(0,-1,0)).intersectObjects(meshes,false)[0];assert.ok(hit);assert.ok(Math.abs(hit.point.y-.052)<.001,'removing roof reveals real inner floor, not an opaque cap');
});

test('background water remains between the bed and banks, moves gently, freezes on pause and stays outside navigation',()=>{
 const s=createHistoricalScene('exile',null,{segment:'canal'}),water=s.scene.getObjectByName('exile-original-background-water');assert.ok(water);assert.equal(s.walkModel.valid(-43,0),false);s.scene.updateMatrixWorld(true);const terrain=[s.scene.getObjectByName('exile-public-ground'),s.scene.getObjectByName('exile-landscape-canal')];
 for(const [x,z] of [[-43,0],[-36,20],[-50,-75]]){const hit=new THREE.Raycaster(new THREE.Vector3(x,10,z),new THREE.Vector3(0,-1,0)).intersectObjects(terrain,false)[0];assert.ok(hit);assert.ok(hit.point.y<.28,'water above actual terrain bed');}assert.ok(water.position.y+.016<exileFloor('canal',-30,0),'dry bank higher than waves');
 const start=Array.from(water.geometry.attributes.position.array);s.animate(.2,null);assert.notDeepEqual(Array.from(water.geometry.attributes.position.array),start);const frame=Array.from(water.geometry.attributes.position.array);s.animate(0,null);assert.deepEqual(Array.from(water.geometry.attributes.position.array),frame);let disposed=0;water.material.addEventListener('dispose',()=>disposed++);terrain[0].material.addEventListener('dispose',()=>disposed++);s.dispose();assert.equal(disposed,2,'chapter releases its own water and terrain materials');
});

test('Exile residents use explicitly mapped undated clothing with independent clocks, held dialogue and shared Blender detail',async()=>{
 for(const [i,c] of exileSegments.entries()){const s=createHistoricalScene('exile',null,{segment:c.id,blenderAssets:true,assetLoader:load});await s.detailedResidents.ready;const a=s.people[0],p=[...a.state.position];assert.equal(a.modelId,upgradedModelFor(i===1?'iron-woman':'iron-resident'));assert.ok(s.npcSystem.agents.every(a=>['iron-resident','iron-woman','wilderness-child'].map(upgradedModelFor).includes(a.actor.modelId)));s.converse(a.id);s.animate(.05,[p[0]+2,p[1]+2,p[2]+3]);assert.deepEqual(a.state.position,p);assert.equal(s.detailedResidents.visible.get(a)?.root.userData.modelId,a.modelId);const clocks=s.npcSystem.agents.map(a=>a.actor.state.time),positions=s.npcSystem.agents.map(a=>[...a.actor.state.position]);s.animate(0,[31,20,25]);assert.deepEqual(s.npcSystem.agents.map(a=>a.actor.state.time),clocks);assert.deepEqual(s.npcSystem.agents.map(a=>a.actor.state.position),positions);s.dispose();}
});

test('all 24 new dialogue cues match actual audio, mode text and returned character timestamps',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../src/voice-manifest.json',import.meta.url))),provenance=JSON.parse(await readFile(new URL('../docs/review/EXILE-VOICE-PROVENANCE.json',import.meta.url)));
 for(const p of exilePeople){const expected={greeting:p.greeting};for(const t of p.topics){expected[t.id]=t.answer;if(t.followup)expected[t.id+'-followup']=t.followup.answer;}const child=personForMode(p,'exile','child');expected['child-greeting']=child.greeting;for(const t of child.topics){expected['child-'+t.id]=t.answer;expected['child-'+t.id+'-followup']=t.followup.answer;}const take=provenance.takes.find(t=>t.id===p.id),voice=manifest[p.id],bytes=await readFile(new URL('../public/'+voice.src,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),take.mp3_sha256);assert.equal(take.audio.original_characters.map(c=>c.text).join(''),take.request.text);assert.equal(take.request.speed,1);assert.equal(voice.duration,take.mp3_duration);assert.ok(bytes.length>1000000);assert.deepEqual(Object.keys(voice.clips).sort(),Object.keys(expected).sort());let previous=0;for(const [id,c] of Object.entries(voice.clips)){assert.equal(c.text,expected[id]);assert.deepEqual(c,take.clips[id]);assert.ok(c.start>=previous-.061&&c.end>c.start&&c.end<=voice.duration);previous=c.end;}}
});
