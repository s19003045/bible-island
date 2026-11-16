import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createHistoricalScene} from '../src/historical-scenes.js';
import {nativitySegments as chapters,nativityFloor as floor,nativityObjects as objects,nativityPOIs as pois,nativityWalkConfig} from '../src/nativity-exploration.js';
import {nativityPeople as people} from '../src/nativity-content.js';
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
import {createNativityObject} from '../src/nativity-objects.js';
import {themeById} from '../src/content.js';
const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});
globalThis.document=Object.assign(new EventTarget(),{createElement:()=>({getContext:()=>ctx}),querySelector:()=>null,activeElement:null});globalThis.window=new EventTarget();
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
const load=async id=>{const b=await readFile(new URL('../public/'+blenderModels[id].src,import.meta.url));return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};

test('loading fallback exposes the outside, cavity floor, rim and underside with front-facing surfaces',()=>{
 const root=createNativityObject('nativity-manger');root.updateMatrixWorld(true);
 const hit=(from,dir)=>new THREE.Raycaster(new THREE.Vector3(...from),new THREE.Vector3(...dir)).intersectObject(root,true)[0];
 const side=hit([2,.24,0],[-1,0,0]);assert.ok(side&&side.point.x>.54&&side.face.normal.x>.9);
 const floor=hit([0,1,0],[0,-1,0]);assert.ok(floor&&Math.abs(floor.point.y-.06)<1e-6&&floor.face.normal.y>.9);
 const rim=hit([.52,1,0],[0,-1,0]);assert.ok(rim&&Math.abs(rim.point.y-.48)<1e-6&&rim.face.normal.y>.9);
 const bottom=hit([0,-1,0],[0,1,0]);assert.ok(bottom&&Math.abs(bottom.point.y)<1e-6&&bottom.face.normal.y<-.9);
 root.traverse(o=>{o.geometry?.dispose();if(o.material)o.material.dispose();});
});

test('birth, growth and adult homecoming have distinct adult-scale contexts with reachable objects',()=>{
 assert.deepEqual(themeById.get('nativity').stops.map(s=>s.id),['manger','home','tools']);
 assert.match(themeById.get('nativity').book,/Mark 6:1-6/);
 const markers=['nativity-luke-birth-reading-context','nativity-nazareth-daily-life-comparison','nativity-adult-homecoming-context'];
 for(const [i,c] of chapters.entries()){
  const s=createHistoricalScene('nativity',null,{segment:c.id});assert.equal(s.segment,c.id);assert.deepEqual(s.people.map(p=>p.id),[c.person]);assert.equal(s.npcSystem.agents.length,13);assert.equal(s.objects.length,1);
  for(const [j,name] of markers.entries())assert.equal(!!s.scene.getObjectByName(name),i===j);
  const m=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),scale=new THREE.Vector3();s.scene.traverse(o=>{if(!o.isMesh)return;assert.ok(o.geometry.attributes.position.array.every(Number.isFinite));if(o.isInstancedMesh)for(let j=0;j<o.count;j++){o.getMatrixAt(j,m);m.decompose(p,q,scale);assert.ok([scale.x,scale.y,scale.z].every(n=>Number.isFinite(n)&&n>0));}});
  assert.ok(s.walkModel.valid(...[c.spawn[0],c.spawn[2]]));for(const poi of pois(c.id))for(const slot of poi.slots)assert.ok(s.walkModel.valid(slot[0],slot[2]));assert.ok(s.walkModel.path(c.spawn,s.objects[0].approach).length>1);s.dispose();
 }
});

test('seven reading windows separate field/visit, home/other-city and adult settings without an invented overnight delay',()=>{
 for(const phase of ['birth','field','visit']){const s=createHistoricalScene('nativity',null,{segment:'manger',phase});assert.equal(s.phase,phase);assert.equal(!!s.flock,phase==='field');assert.equal(!!s.scene.getObjectByName('nativity-separate-night-pasture'),phase==='field');if(phase!=='birth'){s.setTime(false);assert.equal(s.scene.background.getHexString(),'394650');assert.equal(s.exploration.night,true);}else assert.equal(s.exploration.timeLocked,false);s.dispose();}
 for(const phase of ['growth','festival','return']){const s=createHistoricalScene('nativity',null,{segment:'home',phase});assert.equal(s.phase,phase);assert.equal(s.exploration.timeLocked,false);assert.equal(!!s.scene.getObjectByName('nativity-other-city-reading-not-a-temple-house'),phase==='festival');assert.equal(!!s.scene.getObjectByName('nativity-adult-homecoming-context'),false);s.dispose();}
 assert.equal(nativityWalkConfig('tools').phase,null);assert.equal(nativityWalkConfig('tools').timeLocked,false);
});

test('the full-size container has a level real ground contact patch while routes use their smooth floor',()=>{
 const s=createHistoricalScene('nativity',null,{segment:'manger'}),ground=s.scene.getObjectByName('nativity-public-ground');s.scene.updateMatrixWorld(true);
 const y=(x,z)=>new THREE.Raycaster(new THREE.Vector3(x,10,z),new THREE.Vector3(0,-1,0)).intersectObject(ground)[0]?.point.y;
 for(const [x,z] of [[-5,7],[-5.5,6.7],[-4.5,7.3]])assert.ok(Math.abs(y(x,z)-s.objects[0].position[1])<.0002);
 for(const [x,z] of [[-10,3],[12,18],[22,-10]])assert.ok(Math.abs(y(x,z)-floor('manger',x,z))<.003);s.dispose();
});

test('phase memory, child observation and study answers keep other chapters, modes and island notes independent',()=>{
 const state={selected:'nativity',mode:'child',narrativeSegments:{nehemiah:'wall'},narrativePhases:{nehemiah:{wall:'proposal'}},mission:freshMission(),learning:freshLearning(),explorationSeen:{intertestament:['intertestament-coin']}};
 setNarrativeChapter(state,'nativity','manger');setNarrativePhase(state,'nativity','field');setNarrativeChapter(state,'nativity','home');setNarrativePhase(state,'nativity','festival');assert.equal(stateNarrativePhase(state),'festival');setNarrativeChapter(state,'nativity','manger');assert.equal(stateNarrativePhase(state),'field');assert.equal(stateNarrativePhase(state,'nehemiah'),'proposal');
 for(const c of chapters){setNarrativeChapter(state,'nativity',c.id);assert.equal((peopleMarkup(state).match(/data-person=/g)||[]).length,1);const nav=narrativeChapterPicker('nativity',c.id,stateNarrativePhase(state));assert.equal((nav.match(/data-narrative-segment=/g)||[]).length,3);assert.equal((nav.match(/data-narrative-phase=/g)||[]).length,c.id==='tools'?0:3);}
 assert.deepEqual(state.explorationSeen.intertestament,['intertestament-coin']);assert.match(learningComparison({...state,mode:'study'}),/新約時期的聖殿/);
 let data=learningEvent(freshLearning(),'intertestament','study',{type:'note',text:'保留札記'}).data;assert.equal(learningEvent(data,'nativity','child',{type:'answer',id:'manger',choice:1}).feedback.kind,'blocked');data=learningEvent(data,'nativity','child',{type:'observe',id:'manger'}).data;data=learningEvent(data,'nativity','child',{type:'answer',id:'manger',choice:1}).data;assert.deepEqual(learningRecord(data,'nativity','child').completed,['manger']);assert.deepEqual(learningRecord(data,'nativity','general').completed,[]);assert.deepEqual(learningRecord(data,'nativity','study').completed,[]);assert.equal(learningRecord(data,'intertestament','study').note,'保留札記');
});

test('residents retain POI capacities, individual clocks, smooth travel and social distances during 360 seconds',()=>{
 for(const c of chapters){const s=createHistoricalScene('nativity',null,{segment:c.id}),n=s.npcSystem;assert.equal(new Set(n.agents.map(a=>a.seed)).size,13);assert.equal(new Set(n.agents.map(a=>a.timer)).size,13);let social=false;
  for(let f=0;f<7200;f++){n.update(.05,{player:c.spawn});for(const [i,a] of n.agents.entries()){const p=a.actor.state.position;assert.ok(s.walkModel.valid(p[0],p[2]));assert.ok(Math.abs(p[1]-floor(c.id,p[0],p[2]))<.001);assert.ok(a.speedFactor>=.85&&a.speedFactor<=1.15);assert.ok(distance(p,c.spawn)>=a.radius+.32+.024);social ||=!!a.partner;for(const b of n.agents.slice(i+1))assert.ok(distance(p,b.actor.state.position)>=a.radius+b.radius+.024);}for(const p of n.pois)assert.ok(n.reservations.get(p.id).size<=p.capacity);}
  assert.ok(n.agents.every(a=>a.visits.size>=2));assert.ok(social);s.dispose();
 }
});

test('player paths through crowds and 30/60/120fps descending ground stay grounded and visually smooth',()=>{
 for(const c of chapters){const s=createHistoricalScene('nativity',null,{segment:c.id}),n=s.npcSystem;for(let i=0;i<1600;i++)n.update(.05);const canvas=Object.assign(new EventTarget(),{focus(){}}),walk=createWalkControls(new THREE.PerspectiveCamera(),canvas,{constrainMove:(a,b)=>n.constrainPlayer(a,b),navigationObstacles:()=>n.agents.map(a=>({position:a.actor.state.position,radius:a.radius+.32+.07}))}),spawn=n.safePlayerSpawn(c.spawn),destination=s.objects[0].approach;assert.ok(spawn);walk.start(s.walkModel,spawn);assert.ok(walk.navigate(destination));
  for(let i=0;i<4800&&distance(walk.position,destination)>.65;i++){n.update(.05,{player:walk.position});walk.update(.05);assert.ok(walk.groundState.isGrounded);for(const a of n.agents)assert.ok(distance(walk.position,a.actor.state.position)>=a.radius+.32+.024);}assert.ok(distance(walk.position,destination)<.65);walk.dispose();
  for(const fps of [30,60,120]){const motor=createCharacterController(s.walkModel);motor.reset([17,floor(c.id,17,23),23]);const start=motor.position[1];let previous=motor.visualPosition[1];for(let i=0;i<fps*12;i++){const dz=-1.7/fps;motor.update(1/fps,0,dz*motor.speedFactor(0,dz));assert.ok(motor.state.isGrounded);assert.ok(Math.abs(motor.visualPosition[1]-previous)<.035);previous=motor.visualPosition[1];}assert.ok(motor.position[1]<start-.03);}s.dispose();
 }
});

test('actual sheep stay on their translated grazing shelf with individual reserved destinations',async()=>{
 const s=createHistoricalScene('nativity',null,{segment:'manger',phase:'field',blenderAssets:true,assetLoader:load});await s.flock.ready;const f=s.flock;assert.equal(f.animals.length,7);assert.equal(new Set(f.system.agents.map(a=>a.seed)).size,7);
 for(let i=0;i<7200;i++){f.update(.05);s.scene.updateMatrixWorld(true);for(const a of f.animals){const p=a.root.getWorldPosition(new THREE.Vector3());assert.ok(p.x>=-42&&p.x<=-25&&p.z>=-42&&p.z<=-18);assert.ok(Math.abs(s.groundHeight(p.x,p.z)-p.y)<.0001);assert.equal(a.root.userData.modelSource,'blender');}for(const p of f.system.pois)assert.ok(f.system.reservations.get(p.id).size<=p.capacity);}
 assert.ok(f.system.agents.every(a=>a.visits.size>=2));await s.detailedResidents.ready;s.dispose();
});

test('actual GLB objects remain visible from approach and two vertical layers restore in GLB and fallback',async()=>{
 assert.equal(blenderModels['nativity-manger'].articulation,undefined);
 for(const c of chapters){const s=createHistoricalScene('nativity',null,{segment:c.id,blenderAssets:true,assetLoader:load});await s.objects[0].root.userData.assetReady;await s.detailedResidents.ready;s.scene.updateMatrixWorld(true);const o=s.objects[0],eye=new THREE.Vector3(...o.approach).add(new THREE.Vector3(0,1.62,0)),delta=new THREE.Vector3(...o.lookAt).sub(eye),blockers=s.occluders.filter(mesh=>{for(let n=mesh;n;n=n.parent)if(n===o.root)return false;return true;});assert.equal(new THREE.Raycaster(eye,delta.clone().normalize(),.08,delta.length()).intersectObjects(blockers,false).length,0);s.dispose();}
 for(const d of objects.filter(d=>d.id!=='nativity-manger'))for(const root of [(await load(d.id)).scene,createVessel(d.id)]){const {part,offset}=blenderModels[d.id].articulation,p=root.getObjectByName(part);assert.ok(p);root.updateMatrixWorld(true);const start=p.getWorldPosition(new THREE.Vector3());setArtifactSeparation(root,part,offset);root.updateMatrixWorld(true);assert.ok(p.getWorldPosition(new THREE.Vector3()).distanceTo(start.clone().add(new THREE.Vector3(...offset)))<1e-6);setArtifactSeparation(root,part,[0,0,0]);root.updateMatrixWorld(true);assert.ok(p.getWorldPosition(new THREE.Vector3()).distanceTo(start)<1e-6);}
});

test('ordinary first-century resident models stop for dialogue and freeze without a shared clock',async()=>{
 for(const [i,c] of chapters.entries()){const s=createHistoricalScene('nativity',null,{segment:c.id,blenderAssets:true,assetLoader:load});await s.detailedResidents.ready;const a=s.people[0],p=[...a.state.position];assert.equal(a.modelId,['resident','roman-woman','resident-worker'][i]);s.converse(a.id);s.animate(.05,[p[0]+2,p[1]+2,p[2]+3]);assert.deepEqual(a.state.position,p);const clocks=s.npcSystem.agents.map(a=>a.actor.state.time),positions=s.npcSystem.agents.map(a=>[...a.actor.state.position]);s.animate(0,[31,20,25]);assert.deepEqual(s.npcSystem.agents.map(a=>a.actor.state.time),clocks);assert.deepEqual(s.npcSystem.agents.map(a=>a.actor.state.position),positions);s.dispose();}
});

test('all 24 recorded cues match the exact authored and child-derived text and canonical audio hashes',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../src/voice-manifest.json',import.meta.url))),provenance=JSON.parse(await readFile(new URL('../docs/review/NATIVITY-VOICE-PROVENANCE.json',import.meta.url)));
 for(const p of people){const expected={greeting:p.greeting};for(const t of p.topics){expected[t.id]=t.answer;if(t.followup)expected[t.id+'-followup']=t.followup.answer;}const child=personForMode(p,'nativity','child');expected['child-greeting']=child.greeting;for(const t of child.topics){expected['child-'+t.id]=t.answer;expected['child-'+t.id+'-followup']=t.followup.answer;}const take=provenance.takes.find(t=>t.id===p.id),voice=manifest[p.id],bytes=await readFile(new URL('../public/'+voice.src,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),take.mp3_sha256);assert.equal(take.audio.original_characters.map(c=>c.text).join(''),take.request.text);assert.equal(take.request.speed,1);assert.equal(take.request.outputFormat,undefined);assert.equal(voice.duration,take.mp3_duration);assert.ok(bytes.length>1000000);assert.deepEqual(Object.keys(voice.clips).sort(),Object.keys(expected).sort());let previous=0;for(const [id,c] of Object.entries(voice.clips)){assert.equal(c.text,expected[id]);assert.deepEqual(c,take.clips[id]);assert.ok(c.start>=previous-.061&&c.end>c.start&&c.end<=voice.duration);previous=c.end;}}
});
