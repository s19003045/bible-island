import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createHistoricalScene} from '../src/historical-scenes.js';
import {nehemiahSegments,nehemiahFloor,nehemiahObjects,nehemiahPOIs,nehemiahReadingPhases} from '../src/nehemiah-exploration.js';
import {nehemiahPeople} from '../src/nehemiah-content.js';
import {createWalkControls} from '../src/walk-controls.js';
import {createCharacterController} from '../src/character-controller.js';
import {stateChapter,setNarrativeChapter,stateNarrativePhase,setNarrativePhase,narrativeChapterPicker} from '../src/narrative-chapters.js';
import {explorationFor} from '../src/exploration-data.js';
import {personForMode,freshLearning,learningEvent,learningRecord} from '../src/learning-model.js';
import {peopleMarkup} from '../src/people-ui.js';
import {walkMarkup} from '../src/walk-ui.js';
import {freshMission} from '../src/walk-data.js';
import {blenderModels} from '../src/blender-manifest.js';
import {setArtifactSeparation} from '../src/artifact-inspection.js';
import {createVessel} from '../src/vessels.js';
import {themeById} from '../src/content.js';
const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});globalThis.document=Object.assign(new EventTarget(),{createElement:()=>({getContext:()=>ctx}),querySelector:()=>null,activeElement:null});globalThis.window=new EventTarget();
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
const load=async id=>{const b=await readFile(new URL('../public/'+blenderModels[id].src,import.meta.url));return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};
const cases=nehemiahSegments.flatMap(c=>(nehemiahReadingPhases[c.id]||[{id:null}]).map(p=>({c,phase:p.id})));

test('Nehemiah uses eight distinct scene states with later workers and gates absent from earlier moments',()=>{
 assert.deepEqual(themeById.get('nehemiah').stops.map(s=>s.id),['wall','gate','scroll']);
 const counts=[4,9,13,13,9,9,9,15],states=['damaged','damaged','work','half','complete','complete','gates','gates'];
 for(const [i,{c,phase}] of cases.entries()){
  const s=createHistoricalScene('nehemiah',null,{segment:c.id,phase});assert.equal(s.segment,c.id);assert.equal(s.phase,phase);assert.deepEqual(s.people.map(p=>p.id),[c.person]);assert.equal(s.npcSystem.agents.length,counts[i]);assert.equal(s.objects.length,1);assert.equal(s.objects[0].segment,c.id);assert.ok(s.scene.getObjectByName('nehemiah-wall-state-'+states[i]));assert.equal(!!s.scene.getObjectByName('nehemiah-installed-door-leaves'),states[i]==='gates');assert.equal(!!s.scene.getObjectByName('nehemiah-original-reading-platform'),c.id==='scroll');
  const day=s.scene.background.getHex();s.setTime(true);assert.equal(s.scene.background.getHex(),day,'reading-time light is independent of arbitrary display toggles');s.setTime(false);assert.equal(s.scene.background.getHex(),day);assert.equal(day===0x394650,phase==='survey');
  const m=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),scale=new THREE.Vector3();s.scene.traverse(o=>{if(!o.isMesh)return;assert.ok(o.geometry.attributes.position.array.every(Number.isFinite));if(o.isInstancedMesh)for(let j=0;j<o.count;j++){o.getMatrixAt(j,m);m.decompose(p,q,scale);assert.ok([scale.x,scale.y,scale.z].every(n=>Number.isFinite(n)&&n>0));}});
  assert.ok(s.walkModel.valid(c.spawn[0],c.spawn[2]));for(const poi of nehemiahPOIs(c.id,phase))for(const slot of poi.slots)assert.ok(s.walkModel.valid(slot[0],slot[2]));assert.ok(s.walkModel.path(c.spawn,s.objects[0].approach).length>1);assert.equal(s.walkModel.valid(4,-32),false,'background gate is not an invented continuous night-tour path');s.dispose();
 }
});

test('closed-gap wall states have continuous real masonry on both sides of the authored gate opening',()=>{
 for(const phase of ['watch','unfinished-gates','wall-complete','gates']){const s=createHistoricalScene('nehemiah',null,{segment:'gate',phase});s.scene.updateMatrixWorld(true);const meshes=[];s.scene.traverseVisible(o=>{if(o.isMesh&&!o.userData.people)meshes.push(o);});for(const x of [-63,-50,-31,-13,-6,-2,9,12,17,34,53,73]){const terrain=[s.scene.getObjectByName('nehemiah-public-ground'),s.scene.getObjectByName('nehemiah-layered-city-hills')],base=new THREE.Raycaster(new THREE.Vector3(x,100,-32),new THREE.Vector3(0,-1,0)).intersectObjects(terrain,false)[0].point.y;assert.ok([.5,.8,1.15].some(h=>new THREE.Raycaster(new THREE.Vector3(x,base+h,-36),new THREE.Vector3(0,0,1),0,8).intersectObjects(meshes,false).length),phase+' no unintended wall breach at '+x);}const opening=new THREE.Raycaster(new THREE.Vector3(4,nehemiahFloor('gate',4,-32)+1,-36),new THREE.Vector3(0,0,1),0,8);assert.equal(opening.intersectObjects(meshes,false).length,0,'authored gate opening remains real');s.dispose();}
});

test('per-chapter moments retain separate choices and cannot change David or other island/mode progress',()=>{
 const state={selected:'nehemiah',mode:'child',narrativeSegments:{david:'ark',paul:'square'},narrativePhases:{david:'carry'},mission:freshMission(),learning:freshLearning(),explorationSeen:{paul:['paul-textiles']}};
 for(const c of nehemiahSegments){assert.ok(setNarrativeChapter(state,'nehemiah',c.id));assert.equal(stateChapter(state),c.id);assert.equal(explorationFor('nehemiah',c.id).objects.length,1);assert.equal((peopleMarkup(state).match(/data-person=/g)||[]).length,1);
  for(const phase of nehemiahReadingPhases[c.id]||[]){assert.ok(setNarrativePhase(state,'nehemiah',phase.id));assert.equal(stateNarrativePhase(state),phase.id);const nav=narrativeChapterPicker('nehemiah',c.id,phase.id);assert.equal((nav.match(/data-narrative-phase=/g)||[]).length,nehemiahReadingPhases[c.id].length);assert.match(nav,/NEH\./);assert.match(walkMarkup(state),/時刻脈絡與經文/);assert.match(walkMarkup(state),new RegExp(c.person));}
 }
 assert.equal(stateNarrativePhase(state),null);setNarrativeChapter(state,'nehemiah','wall');assert.equal(stateNarrativePhase(state),'sections');setNarrativeChapter(state,'nehemiah','gate');assert.equal(stateNarrativePhase(state),'gates');assert.equal(setNarrativePhase(state,'nehemiah','cart'),false);assert.equal(stateNarrativePhase(state,'david'),'carry');assert.equal(stateChapter(state,'paul'),'square');assert.deepEqual(state.explorationSeen.paul,['paul-textiles']);
 let data=learningEvent(freshLearning(),'paul','study',{type:'note',text:'保留札記'}).data;data=learningEvent(data,'nehemiah','study',{type:'inspect',id:'wall'}).data;data=learningEvent(data,'nehemiah','study',{type:'answer',id:'wall',choice:'reconstruction'}).data;assert.deepEqual(learningRecord(data,'nehemiah','study').completed,['wall']);assert.deepEqual(learningRecord(data,'nehemiah','child').completed,[]);assert.equal(learningRecord(data,'paul','study').note,'保留札記');
});

test('all eight resident groups keep individual seeds, staggered decisions, POI capacity and social distances',()=>{
 for(const {c,phase} of cases){const s=createHistoricalScene('nehemiah',null,{segment:c.id,phase}),n=s.npcSystem;assert.equal(new Set(n.agents.map(a=>a.seed)).size,n.agents.length);assert.equal(new Set(n.agents.map(a=>a.timer)).size,n.agents.length);let social=false;
  for(let f=0;f<4800;f++){n.update(.05,{player:c.spawn});for(const [i,a] of n.agents.entries()){const p=a.actor.state.position;assert.ok(s.walkModel.valid(p[0],p[2]));assert.ok(Math.abs(p[1]-nehemiahFloor(c.id,p[0],p[2]))<.001);assert.ok(a.speedFactor>=.85&&a.speedFactor<=1.15);assert.ok(distance(p,c.spawn)>=a.radius+.32+.024);social ||=!!a.partner;for(const b of n.agents.slice(i+1))assert.ok(distance(p,b.actor.state.position)>=a.radius+b.radius+.024);}for(const p of n.pois)assert.ok(n.reservations.get(p.id).size<=p.capacity);}
  assert.ok(n.agents.every(a=>a.visits.size>=2));if(n.agents.length>=9)assert.ok(social);if(phase==='survey')assert.ok(n.pois.every(p=>p.action!=='Interact'),'the night observation has no construction work POI');s.dispose();
 }
});

test('the actual player walks through every time slice without crowd overlap or descent float at 30, 60 and 120 fps',()=>{
 for(const {c,phase} of cases){const s=createHistoricalScene('nehemiah',null,{segment:c.id,phase}),n=s.npcSystem;for(let i=0;i<1600;i++)n.update(.05);const canvas=Object.assign(new EventTarget(),{focus(){}}),walk=createWalkControls(new THREE.PerspectiveCamera(),canvas,{constrainMove:(a,b)=>n.constrainPlayer(a,b),navigationObstacles:()=>n.agents.map(a=>({position:a.actor.state.position,radius:a.radius+.32+.07}))}),spawn=n.safePlayerSpawn(c.spawn),destination=s.objects[0].approach;assert.ok(spawn);walk.start(s.walkModel,spawn);assert.ok(walk.navigate(destination));
  for(let i=0;i<4800&&distance(walk.position,destination)>.65;i++){n.update(.05,{player:walk.position});walk.update(.05);assert.ok(walk.groundState.isGrounded);for(const a of n.agents)assert.ok(distance(walk.position,a.actor.state.position)>=a.radius+.32+.024);}assert.ok(distance(walk.position,destination)<.65,c.id+' '+phase+' route completes');walk.dispose();
  for(const fps of [30,60,120]){const motor=createCharacterController(s.walkModel);motor.reset([17,nehemiahFloor(c.id,17,23),23]);const start=motor.position[1];let previous=motor.visualPosition[1];for(let i=0;i<fps*12;i++){const dz=-1.7/fps;motor.update(1/fps,0,dz*motor.speedFactor(0,dz));assert.ok(motor.state.isGrounded);assert.ok(Math.abs(motor.visualPosition[1]-previous)<.035);previous=motor.visualPosition[1];}assert.ok(motor.position[1]<start-.08);}s.dispose();
 }
});

test('real GLB observation views have clear approach sightlines for each chapter',async()=>{
 for(const c of nehemiahSegments){const s=createHistoricalScene('nehemiah',null,{segment:c.id,blenderAssets:true,assetLoader:load});await s.objects[0].root.userData.assetReady;await s.detailedResidents.ready;s.scene.updateMatrixWorld(true);const o=s.objects[0],eye=new THREE.Vector3(...o.approach).add(new THREE.Vector3(0,1.62,0)),delta=new THREE.Vector3(...o.lookAt).sub(eye);assert.ok(distance(o.approach,o.position)<=3.2);assert.equal(new THREE.Raycaster(eye,delta.clone().normalize(),.08,delta.length()).intersectObjects(s.occluders,false).length,0);s.dispose();}
});

test('actual GLB and local fallback layers translate in world metres and restore',async()=>{
 for(const d of nehemiahObjects)for(const root of [(await load(d.id)).scene,createVessel(d.id)]){const {part,offset}=blenderModels[d.id].articulation,p=root.getObjectByName(part);assert.ok(p);root.updateMatrixWorld(true);const start=p.getWorldPosition(new THREE.Vector3());assert.ok(setArtifactSeparation(root,part,offset));root.updateMatrixWorld(true);assert.ok(p.getWorldPosition(new THREE.Vector3()).distanceTo(start.clone().add(new THREE.Vector3(...offset)))<1e-6);setArtifactSeparation(root,part,[0,0,0]);root.updateMatrixWorld(true);assert.ok(p.getWorldPosition(new THREE.Vector3()).distanceTo(start)<1e-6);}
});

test('exported teaching models retain a clear portal, three exposed cavity floors and a genuinely thick curved sheet',async()=>{
 const wall=(await load('nehemiah-wall')).scene;wall.updateMatrixWorld(true);
 for(const x of [-.08,0,.08])for(const y of [.10,.20,.30])for(const sign of [-1,1])assert.equal(new THREE.Raycaster(new THREE.Vector3(x,y,sign*.38),new THREE.Vector3(0,0,-sign),0,.76).intersectObject(wall,true).length,0,'fixed open leaf and bar do not obstruct the portal');
 const watch=(await load('nehemiah-watch')).scene,{part,offset}=blenderModels['nehemiah-watch'].articulation;setArtifactSeparation(watch,part,offset);watch.updateMatrixWorld(true);
 for(const [role,x] of [['carry',-.390],['build',0],['watch',.390]]){const shell=watch.getObjectByName('nehemiah-watch-recess-'+role);assert.ok(shell);const top=new THREE.Raycaster(new THREE.Vector3(x,.15,.075),new THREE.Vector3(0,-1,0),0,.13).intersectObject(shell,true)[0],bottom=new THREE.Raycaster(new THREE.Vector3(x,0,.075),new THREE.Vector3(0,1,0),0,.10).intersectObject(shell,true)[0];assert.ok(top&&bottom);assert.ok(Math.abs(top.point.y-.032)<2e-6);assert.ok(Math.abs(top.point.y-bottom.point.y-.014)<2e-6,'a true cavity floor has measurable thickness');}
 const reading=(await load('nehemiah-reading')).scene,sheet=reading.getObjectByName('nehemiah-reading-blank-unrolled-sheet'),fixed=reading.getObjectByName('nehemiah-reading-fixed-scroll-cradle');assert.ok(sheet&&fixed);reading.updateMatrixWorld(true);const before=new THREE.Box3().setFromObject(fixed).clone();setArtifactSeparation(reading,blenderModels['nehemiah-reading'].articulation.part,[0,.14,0]);reading.updateMatrixWorld(true);assert.ok(new THREE.Box3().setFromObject(fixed).equals(before),'the sheet cradle keeps its fixed support');
 for(const x of [-.23,-.19,-.15])for(const z of [-.16,-.10,-.04]){const top=new THREE.Raycaster(new THREE.Vector3(x,.4,z),new THREE.Vector3(0,-1,0),0,.2).intersectObject(sheet,true)[0],bottom=new THREE.Raycaster(new THREE.Vector3(x,.245,z),new THREE.Vector3(0,1,0),0,.1).intersectObject(sheet,true)[0];assert.ok(top&&bottom);assert.ok(Math.abs(top.point.y-bottom.point.y-.0025)<2e-6,'blank sheet is a closed thick part');}
 const center=new THREE.Box3().setFromObject(sheet);assert.ok(center.max.y-center.min.y>.02,'ends curve above the readable middle');for(const side of ['left','right']){const roll=reading.getObjectByName('nehemiah-reading-blank-rolled-end-'+side);assert.ok(roll);const box=new THREE.Box3().setFromObject(roll),p=box.getCenter(new THREE.Vector3()),hits=new THREE.Raycaster(new THREE.Vector3(box.min.x-.01,p.y,p.z),new THREE.Vector3(1,0,0),0,.12).intersectObject(roll,true);assert.ok(hits.length>=3,'spaced spiral has multiple real sheet crossings');}
});

test('period resident models preserve held dialogue, individual clocks and a frozen animation frame',async()=>{
 for(const [i,c] of nehemiahSegments.entries()){const s=createHistoricalScene('nehemiah',null,{segment:c.id,blenderAssets:true,assetLoader:load});await s.detailedResidents.ready;const a=s.people[0],p=[...a.state.position];assert.equal(a.modelId,['return-mason','return-elder','return-woman'][i]);assert.ok(s.npcSystem.agents.every(a=>['return-mason','return-elder','return-woman','return-child'].includes(a.actor.modelId)));s.converse(a.id);s.animate(.05,[p[0]+2,p[1]+2,p[2]+3]);assert.deepEqual(a.state.position,p);assert.equal(s.detailedResidents.visible.get(a)?.root.userData.modelId,a.modelId);const clocks=s.npcSystem.agents.map(a=>a.actor.state.time),positions=s.npcSystem.agents.map(a=>[...a.actor.state.position]);s.animate(0,[31,20,25]);assert.deepEqual(s.npcSystem.agents.map(a=>a.actor.state.time),clocks);assert.deepEqual(s.npcSystem.agents.map(a=>a.actor.state.position),positions);s.dispose();}
});

test('all 24 recorded cues match authored and child-derived text with real timing and audio hashes',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../src/voice-manifest.json',import.meta.url))),provenance=JSON.parse(await readFile(new URL('../docs/review/NEHEMIAH-VOICE-PROVENANCE.json',import.meta.url)));
 for(const p of nehemiahPeople){const expected={greeting:p.greeting};for(const t of p.topics){expected[t.id]=t.answer;if(t.followup)expected[t.id+'-followup']=t.followup.answer;}const child=personForMode(p,'nehemiah','child');expected['child-greeting']=child.greeting;for(const t of child.topics){expected['child-'+t.id]=t.answer;expected['child-'+t.id+'-followup']=t.followup.answer;}const take=provenance.takes.find(t=>t.id===p.id),voice=manifest[p.id],bytes=await readFile(new URL('../public/'+voice.src,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),take.mp3_sha256);assert.equal(take.audio.original_characters.map(c=>c.text).join(''),take.request.text);assert.equal(take.request.speed,1);assert.equal(voice.duration,take.mp3_duration);assert.ok(bytes.length>1000000);assert.deepEqual(Object.keys(voice.clips).sort(),Object.keys(expected).sort());let previous=0;for(const [id,c] of Object.entries(voice.clips)){assert.equal(c.text,expected[id]);assert.deepEqual(c,take.clips[id]);assert.ok(c.start>=previous-.061&&c.end>c.start&&c.end<=voice.duration);previous=c.end;}}
});
