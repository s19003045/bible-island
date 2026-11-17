import {characterClips} from './helpers/character-clips.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createHistoricalScene} from '../src/historical-scenes.js';
import {createWalkControls} from '../src/walk-controls.js';
import {createCharacterController} from '../src/character-controller.js';
import {returnFloor,returnObjects,returnSegments,returnPOIs} from '../src/return-exploration.js';
import {returnHistorical,returnPeople} from '../src/return-content.js';
import {chapterById,stateChapter,setNarrativeChapter,chapterForPerson} from '../src/narrative-chapters.js';
import {walkEntry,walkMarkup} from '../src/walk-ui.js';
import {peopleMarkup} from '../src/people-ui.js';
import {freshMission} from '../src/walk-data.js';
import {personForMode,freshLearning,learningRecord,learningEvent} from '../src/learning-model.js';
import {observeObject,readExploration,writeExploration} from '../src/exploration-progress.js';
import {setArtifactSeparation} from '../src/artifact-inspection.js';
import {blenderModels} from '../src/blender-manifest.js';
const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});globalThis.document=Object.assign(new EventTarget(),{createElement:()=>({getContext:()=>ctx}),querySelector:()=>null,activeElement:null});globalThis.window=new EventTarget();
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
const load=async id=>{const b=await readFile(new URL('../public/'+blenderModels[id].src,import.meta.url));return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};

test('return chapters build distinct historical states with matching people, objects and protected inner precinct',()=>{
 const heights=[];
 for(const c of returnSegments){
  const s=createHistoricalScene('second-temple',null,{segment:c.id}),m=s.walkModel;assert.equal(s.segment,c.id);assert.equal(s.people.length,1);assert.equal(s.people[0].id,c.person);assert.equal(s.objects.length,1);assert.equal(s.objects[0].segment,c.id);assert.equal(s.npcSystem.agents.length,13);assert.equal(s.config.cutaway,false);assert.equal(s.roof.children.length,0);assert.ok(s.scene.getObjectByName('return-stage-'+c.id));assert.ok(!s.scene.getObjectByName('return-stage-'+returnSegments.find(t=>t.id!==c.id).id));
  assert.ok(m.valid(c.spawn[0],c.spawn[2]));for(const p of returnPOIs)for(const q of p.slots)assert.ok(m.valid(q[0],q[2]),p.id);
  for(const [x,z] of [[0,-10],[0,9],[-6,-12]]){assert.equal(m.valid(x,z),false);s.roof.visible=false;assert.equal(m.valid(x,z),false);}
  const object=s.objects[0],path=m.path(c.spawn,object.approach);assert.ok(path.length>1);let p=[...c.spawn];
  for(const q of path){let tries=0;while(distance(p,q)>.06){const n=distance(p,q),v=Math.min(n,.065),next=m.move(p,(q[0]-p[0])/n*v,(q[2]-p[2])/n*v);assert.ok(distance(p,next)>.000001,'route remains traversable');p=next;assert.ok(++tries<500);}}assert.ok(distance(p,object.approach)<.6);
  s.scene.updateMatrixWorld(true);const ray=new THREE.Raycaster(new THREE.Vector3(-6,20,-10),new THREE.Vector3(0,-1,0)),meshes=[];s.scene.traverse(o=>{if(o.isMesh&&!o.userData.people)meshes.push(o);});heights.push(ray.intersectObjects(meshes,false)[0].point.y);s.dispose();
 }
 assert.ok(heights[1]>heights[0]+2);assert.ok(heights[2]>heights[1]+4,'actual geometry changes with construction stage');
});

test('chapter state and UI isolate Exodus and return histories while retaining observations and mode records',()=>{
 const state={selected:'second-temple',exodusSegment:'passover',mode:'study',mission:freshMission(),actor:null,explorationSeen:{jordan:['jordan-stones']}};
 for(const c of returnSegments){assert.equal(setNarrativeChapter(state,'second-temple',c.id),true);assert.equal(stateChapter(state),c.id);assert.equal(state.exodusSegment,'passover');assert.equal(chapterForPerson('second-temple',c.person),c.id);assert.equal(chapterById('second-temple',c.id),c);
  const html=walkMarkup(state),entry=walkEntry(true,'second-temple',c.id),people=peopleMarkup(state);assert.equal((entry.match(/data-narrative-segment=/g)||[]).length,3);assert.match(html,new RegExp(`data-walk-person="${c.person}"`));assert.equal((people.match(/data-person=/g)||[]).length,1);assert.match(html,/器物觀察 0 \/ 1/);
 }
 assert.equal(setNarrativeChapter(state,'second-temple','bricks'),false);assert.equal(stateChapter(state),'dedication');assert.equal(stateChapter(state,'exodus'),'passover');
 let records=state.explorationSeen;for(const object of returnObjects)records=observeObject(records,'second-temple',object.id);assert.deepEqual(records['second-temple'],returnObjects.map(o=>o.id),'all three chapter objects are accepted');assert.deepEqual(records.jordan,['jordan-stones']);assert.deepEqual(state.explorationSeen,{jordan:['jordan-stones']});let saved;const storage={setItem:(k,v)=>saved=v,getItem:()=>saved};writeExploration(storage,records);assert.deepEqual(readExploration(storage),records,'all chapter records survive a fresh read');
 let data=learningEvent(freshLearning(),'jordan','study',{type:'note',text:'原札記'}).data;data=learningEvent(data,'second-temple','study',{type:'inspect',id:'foundation'}).data;data=learningEvent(data,'second-temple','study',{type:'answer',id:'foundation',choice:'text'}).data;assert.deepEqual(learningRecord(data,'second-temple','study').completed,['foundation']);assert.deepEqual(learningRecord(data,'second-temple','child').completed,[]);assert.equal(learningRecord(data,'jordan','study').note,'原札記');
 assert.match(returnHistorical.limits,/王令/);assert.match(returnHistorical.limits,/亞達薛西/);assert.match(returnHistorical.limits,/不是現場測繪/);
});

test('each return chapter keeps seeded capacity and social spacing and continues reaching different POIs',()=>{
 for(const c of returnSegments){
  const s=createHistoricalScene('second-temple',null,{segment:c.id}),n=s.npcSystem;assert.equal(new Set(n.agents.map(a=>a.seed)).size,13);assert.equal(new Set(n.agents.map(a=>a.timer)).size,13);let social=false;
  for(let i=0;i<4800;i++){n.update(.05,{player:c.spawn});for(const [j,a] of n.agents.entries()){
   const p=a.actor.state.position;assert.ok(s.walkModel.valid(p[0],p[2]));assert.ok(Math.abs(p[1]-returnFloor(p[0],p[2]))<.001);assert.ok(a.speedFactor>=.85&&a.speedFactor<=1.15);assert.ok(distance(p,c.spawn)>=a.radius+.32+.024);social ||=!!a.partner;
   for(const b of n.agents.slice(j+1))assert.ok(distance(p,b.actor.state.position)>=a.radius+b.radius+.024,c.id+' social spacing');
  }for(const p of n.pois)assert.ok(n.reservations.get(p.id).size<=p.capacity);}
  assert.ok(n.agents.every(a=>a.visits.size>=2),c.id+' sustained POI visits');assert.ok(social);n.suspend();assert.ok([...n.reservations.values()].every(v=>v.size===0));s.dispose();
 }
});

test('player routes reach actual return objects through moving residents and stay grounded on the approach',()=>{
 for(const c of returnSegments){
  const s=createHistoricalScene('second-temple',null,{segment:c.id}),n=s.npcSystem;for(let i=0;i<2400;i++)n.update(.05);
  const canvas=Object.assign(new EventTarget(),{focus(){}}),walk=createWalkControls(new THREE.PerspectiveCamera(),canvas,{constrainMove:(a,b)=>n.constrainPlayer(a,b),navigationObstacles:()=>n.agents.map(a=>({position:a.actor.state.position,radius:a.radius+.32+.07}))});
  const spawn=n.safePlayerSpawn(c.spawn),destination=s.objects[0].approach;assert.ok(spawn);walk.start(s.walkModel,spawn);assert.equal(walk.navigate(destination),true);
  for(let i=0;i<4800&&distance(walk.position,destination)>.65;i++){n.update(.05,{player:walk.position});walk.update(.05);assert.equal(walk.groundState.isGrounded,true);for(const a of n.agents)assert.ok(distance(walk.position,a.actor.state.position)>=a.radius+.32+.024);}
  assert.ok(distance(walk.position,destination)<.65,c.id+' actual controller arrives');walk.dispose();
  for(const fps of [30,60,120]){const motor=createCharacterController(s.walkModel);motor.reset([-28,returnFloor(-28,37),37]);let previous=motor.visualPosition[1];for(let i=0;i<fps*9;i++){const factor=motor.speedFactor(0,-.1);motor.update(1/fps,0,-1.7/fps*factor);assert.equal(motor.state.isGrounded,true);assert.ok(Math.abs(motor.visualPosition[1]-previous)<.03);previous=motor.visualPosition[1];}assert.ok(motor.position[2]<25);}
  s.dispose();
 }
});

function connectedGroups(geometry){
 const p=geometry.attributes.position,indices=geometry.index.array,parent=new Map(),positions=new Map();
 const key=i=>[p.getX(i),p.getY(i),p.getZ(i)].map(n=>Math.round(n*1e5)).join(',');
 for(let i=0;i<p.count;i++){const k=key(i);if(!parent.has(k))parent.set(k,k);positions.set(k,[p.getX(i),p.getY(i),p.getZ(i)]);}
 const find=k=>{let q=k;while(parent.get(q)!==q)q=parent.get(q);while(parent.get(k)!==k){const t=parent.get(k);parent.set(k,q);k=t;}return q;};
 for(let i=0;i<indices.length;i+=3){const a=find(key(indices[i]));for(let j=1;j<3;j++)parent.set(find(key(indices[i+j])),a);}
 const groups=new Map();for(const [k,v] of positions){const r=find(k);if(!groups.has(r))groups.set(r,[]);groups.get(r).push(v);}return [...groups.values()];
}
test('real return GLBs contain three stone courses, movable timber, curled documents and hollow metallic vessels',async()=>{
 const masonry=(await load('return-masonry')).scene;const stones=[];masonry.traverse(o=>{if(o.isMesh&&o.material.name==='return-rough-stone')stones.push(o);});assert.equal(stones.length,1);const pieces=connectedGroups(stones[0].geometry);assert.equal(pieces.length,9);const rows=new Map();for(const points of pieces){const y=(Math.min(...points.map(p=>p[1]))+Math.max(...points.map(p=>p[1])))/2,key=Math.round(y*1000);rows.set(key,(rows.get(key)||0)+1);}assert.deepEqual([...rows.values()],[3,3,3]);
 const part=masonry.getObjectByName('return-timber-layer');assert.ok(part);masonry.updateMatrixWorld(true);const before=part.getWorldPosition(new THREE.Vector3());assert.equal(setArtifactSeparation(masonry,'return-timber-layer',[0,.18,0]),true);masonry.updateMatrixWorld(true);assert.ok(Math.abs(part.getWorldPosition(new THREE.Vector3()).y-before.y-.18)<1e-6);setArtifactSeparation(masonry,'return-timber-layer',[0,0,0]);masonry.updateMatrixWorld(true);assert.ok(part.getWorldPosition(new THREE.Vector3()).distanceTo(before)<1e-6);
 const scroll=(await load('return-scroll')).scene;scroll.updateMatrixWorld(true);const sheet=scroll.getObjectByName('return-scroll-return-uninscribed-document');assert.ok(sheet);const p=sheet.geometry.attributes.position;assert.ok(p.count>4000);assert.ok(new THREE.Box3().setFromObject(sheet).max.y>.12);
 const vessels=(await load('return-vessels')).scene;vessels.updateMatrixWorld(true);const meshes=[];vessels.traverse(o=>{if(o.isMesh)meshes.push(o);});for(const [x,expected] of [[-.30,.038],[.31,.038*.84]]){const hits=new THREE.Raycaster(new THREE.Vector3(x,1,0),new THREE.Vector3(0,-1,0)).intersectObjects(meshes,false);assert.ok(hits.length);assert.ok(Math.abs(hits[0].point.y-expected)<.004,'actual inner bottom');}
});

test('new return figures have independent rigs and five tracks and stay on their chapter during conversation',async()=>{
 const ids=['return-elder','return-mason','return-woman','return-child'],assets=await Promise.all(ids.map(load));const rigs=assets.map((a,index)=>{const nodes=[];a.scene.traverse(o=>{if(o.isSkinnedMesh)nodes.push(o);});assert.ok(nodes.length>3);assert.deepEqual(a.animations.map(c=>c.name).sort(),characterClips(ids[index]));const skin=nodes.find(m=>m.material.name==='skin');assert.ok(skin);const si=skin.geometry.attributes.skinIndex,sw=skin.geometry.attributes.skinWeight;let blended=0;for(let i=0;i<si.count;i++){const weights=new Map();for(let k=0;k<4;k++)if(sw.getComponent(i,k)>.01)weights.set(skin.skeleton.bones[si.getComponent(i,k)].name,sw.getComponent(i,k));if(['L','R'].some(side=>weights.has('arm'+side)&&weights.has('forearm'+side)))blended++;}assert.ok(blended>=64,'skin crosses both elbows with blended weights');return nodes[0].skeleton;});assert.equal(new Set(rigs).size,4);
 for(const c of returnSegments){const s=createHistoricalScene('second-temple',null,{segment:c.id,blenderAssets:true,assetLoader:load});assert.equal(await s.detailedResidents.ready,true);const a=s.people[0],p=[...a.state.position];s.converse(a.id);for(let i=0;i<20;i++)s.animate(.05,[p[0]+2,p[1]+1.6,p[2]+3]);assert.deepEqual(a.state.position,p);assert.equal(s.detailedResidents.visible.get(a)?.root.userData.modelId,c.id==='foundation'?'return-elder':c.id==='work'?'return-mason':'return-woman');s.dispose();}
});

test('return general and child cue text matches exact generated characters, measured files and timestamp intervals',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../src/voice-manifest.json',import.meta.url))),provenance=JSON.parse(await readFile(new URL('../docs/review/RETURN-VOICE-PROVENANCE.json',import.meta.url)));
 for(const p of returnPeople){const expected={greeting:p.greeting};for(const t of p.topics){expected[t.id]=t.answer;if(t.followup)expected[t.id+'-followup']=t.followup.answer;}const child=personForMode(p,'second-temple','child');expected['child-greeting']=child.greeting;for(const t of child.topics){expected['child-'+t.id]=t.answer;expected['child-'+t.id+'-followup']=t.followup.answer;}
  const take=provenance.takes.find(t=>t.id===p.id),voice=manifest[p.id],bytes=await readFile(new URL('../public/'+voice.src,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),take.mp3_sha256);assert.equal(take.audio.original_characters.map(c=>c.text).join(''),take.request.text);assert.equal(take.request.speed,1);assert.equal(voice.duration,take.mp3_duration);assert.ok(bytes.length>1000000);assert.deepEqual(Object.keys(voice.clips).sort(),Object.keys(expected).sort());let previous=0;for(const [id,c] of Object.entries(voice.clips)){assert.equal(c.text,expected[id]);assert.deepEqual(c,take.clips[id]);assert.ok(c.start>=previous-.061&&c.end>c.start&&c.end<=voice.duration);previous=c.end;}
 }
});
