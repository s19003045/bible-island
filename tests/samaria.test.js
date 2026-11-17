import {upgradedModelFor} from '../src/human-motion-data.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createHistoricalScene} from '../src/historical-scenes.js';
import {samariaSegments as chapters,samariaObjects,samariaReadingPhases,samariaFloor} from '../src/samaria-exploration.js';
import {samariaPeople as people} from '../src/samaria-content.js';
import {setNarrativeChapter,stateNarrativePhase,setNarrativePhase,narrativeChapterPicker} from '../src/narrative-chapters.js';
import {freshLearning,learningEvent,learningRecord,personForMode} from '../src/learning-model.js';
import {learningComparison} from '../src/learning-ui.js';
import {peopleMarkup} from '../src/people-ui.js';
import {freshMission} from '../src/walk-data.js';
import {createWalkControls} from '../src/walk-controls.js';
import {blenderModels} from '../src/blender-manifest.js';
import {createVessel} from '../src/vessels.js';
import {setArtifactSeparation} from '../src/artifact-inspection.js';
import {themeById} from '../src/content.js';
const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});
globalThis.document=Object.assign(new EventTarget(),{createElement:()=>({getContext:()=>ctx}),querySelector:()=>null,activeElement:null});globalThis.window=new EventTarget();
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
const load=async id=>{const b=await readFile(new URL('../public/'+blenderModels[id].src,import.meta.url));return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};

test('Samaria chapter and moment memory preserves old progress and distinct observation, answer and reading gates',()=>{
 assert.deepEqual(themeById.get('samaria').stops.map(s=>s.id),['well','road','inn']);assert.match(themeById.get('samaria').stops[2].reference,/33–37/);
 const state={selected:'samaria',mode:'child',narrativeSegments:{galilee:'boat'},narrativePhases:{galilee:{boat:'storm'}},mission:freshMission(),learning:freshLearning(),explorationSeen:{nativity:['nativity-home']}};
 setNarrativeChapter(state,'samaria','well');setNarrativePhase(state,'samaria','hearing');setNarrativeChapter(state,'samaria','inn');setNarrativePhase(state,'samaria','promise');setNarrativeChapter(state,'samaria','well');assert.equal(stateNarrativePhase(state),'hearing');assert.equal(stateNarrativePhase(state,'galilee'),'storm');
 for(const c of chapters){setNarrativeChapter(state,'samaria',c.id);const markup=narrativeChapterPicker('samaria',c.id,stateNarrativePhase(state));assert.equal((markup.match(/data-narrative-segment=/g)||[]).length,3);assert.equal((markup.match(/data-narrative-phase=/g)||[]).length,c.id==='well'?4:3);assert.equal((peopleMarkup(state).match(/data-person=/g)||[]).length,1);}
 assert.match(learningComparison({...state,mode:'study'}),/加利利的湖與村落/);assert.deepEqual(state.explorationSeen.nativity,['nativity-home']);
 let data=learningEvent(freshLearning(),'galilee','study',{type:'note',text:'保留湖岸札記'}).data;assert.equal(learningEvent(data,'samaria','child',{type:'answer',id:'well',choice:2}).feedback.kind,'blocked');data=learningEvent(data,'samaria','child',{type:'observe',id:'well'}).data;data=learningEvent(data,'samaria','child',{type:'answer',id:'well',choice:2}).data;assert.deepEqual(learningRecord(data,'samaria','child').completed,['well']);assert.deepEqual(learningRecord(data,'samaria','general').completed,[]);assert.deepEqual(learningRecord(data,'samaria','study').completed,[]);assert.equal(learningRecord(data,'galilee','study').note,'保留湖岸札記');
});

test('Samaria ten reading moments keep the narrative and parable contexts distinct and freeze without a group clock',()=>{
 const markers=['samaria-well-context','samaria-road-context','samaria-inn-context'];let count=0;
 for(const [index,c] of chapters.entries())for(const phase of samariaReadingPhases[c.id]){count++;const s=createHistoricalScene('samaria',null,{segment:c.id,phase:phase.id});assert.equal(s.phase,phase.id);assert.equal(s.exploration.moment.passage,phase.passage);for(const [i,name] of markers.entries())assert.equal(!!s.scene.getObjectByName(name),i===index);assert.deepEqual(s.people.map(p=>p.id),[c.person]);const before=s.npcSystem.agents.map(a=>({p:[...a.actor.state.position],t:a.actor.state.time}));s.animate(0,[30,20,30]);assert.deepEqual(s.npcSystem.agents.map(a=>({p:[...a.actor.state.position],t:a.actor.state.time})),before);s.dispose();}
 assert.equal(count,10);
});

test('Samaria actual crowded paths reach all three objects without overlaps or cancelling the route',()=>{
 for(const c of chapters){const s=createHistoricalScene('samaria',null,{segment:c.id}),n=s.npcSystem;for(let i=0;i<1600;i++)n.update(.05);const canvas=Object.assign(new EventTarget(),{focus(){}}),walk=createWalkControls(new THREE.PerspectiveCamera(),canvas,{constrainMove:(a,b)=>n.constrainPlayer(a,b),navigationObstacles:()=>n.agents.map(a=>({position:a.actor.state.position,radius:a.radius+.32+.07}))});const spawn=n.safePlayerSpawn(c.spawn),dest=s.objects[0].approach;assert.ok(spawn);walk.start(s.walkModel,spawn);assert.ok(walk.navigate(dest));for(let i=0;i<4800&&distance(walk.position,dest)>.65;i++){n.update(.05,{player:walk.position});walk.update(.05);assert.ok(walk.groundState.isGrounded);for(const a of n.agents)assert.ok(distance(walk.position,a.actor.state.position)>=a.radius+.32+.024);}assert.ok(distance(walk.position,dest)<.65);walk.dispose();s.dispose();}
});

test('Samaria ordinary detailed residents use independent models and stop for conversation',async()=>{
 for(const [i,c] of chapters.entries()){const s=createHistoricalScene('samaria',null,{segment:c.id,blenderAssets:true,assetLoader:load});await s.detailedResidents.ready;const a=s.people[0],p=[...a.state.position];assert.equal(a.modelId,upgradedModelFor(['roman-woman','resident','resident-worker'][i]));s.converse(a.id);s.animate(.05,[p[0]+2,p[1]+2,p[2]+3]);assert.deepEqual(a.state.position,p);assert.ok(Math.abs(p[1]-samariaFloor(c.id,p[0],p[2]))<.001);s.dispose();}
});

test('Samaria accepted GLBs remain visible and only the jar front translates, then restores',async()=>{
 assert.equal(blenderModels['samaria-road'].articulation,undefined);assert.equal(blenderModels['samaria-care'].articulation,undefined);
 for(const c of chapters){const s=createHistoricalScene('samaria',null,{segment:c.id,blenderAssets:true,assetLoader:load});await s.objects[0].root.userData.assetReady;await s.detailedResidents.ready;s.scene.updateMatrixWorld(true);const o=s.objects[0],eye=new THREE.Vector3(...o.approach).add(new THREE.Vector3(0,1.62,0)),delta=new THREE.Vector3(...o.lookAt).sub(eye),blockers=s.occluders.filter(m=>{for(let n=m;n;n=n.parent)if(n===o.root)return false;return true;});assert.equal(new THREE.Raycaster(eye,delta.clone().normalize(),.08,delta.length()).intersectObjects(blockers,false).length,0);s.dispose();}
 for(const root of [(await load('samaria-jar')).scene,createVessel('samaria-jar')]){const {part,offset}=blenderModels['samaria-jar'].articulation,p=root.getObjectByName(part);assert.ok(p);root.updateMatrixWorld(true);const start=p.getWorldPosition(new THREE.Vector3()),fixed=new Map();root.traverse(o=>{if(o.isMesh&&!p.getObjectById(o.id))fixed.set(o,o.getWorldPosition(new THREE.Vector3()));});setArtifactSeparation(root,part,offset);root.updateMatrixWorld(true);assert.ok(p.getWorldPosition(new THREE.Vector3()).distanceTo(start.clone().add(new THREE.Vector3(...offset)))<1e-6);for(const [m,pos] of fixed)assert.ok(m.getWorldPosition(new THREE.Vector3()).distanceTo(pos)<1e-6);setArtifactSeparation(root,part,[0,0,0]);root.updateMatrixWorld(true);assert.ok(p.getWorldPosition(new THREE.Vector3()).distanceTo(start)<1e-6);}
});

test('Samaria all 24 cues match exact authored and child text, returned characters and canonical audio hashes',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../src/voice-manifest.json',import.meta.url))),provenance=JSON.parse(await readFile(new URL('../docs/review/SAMARIA-VOICE-PROVENANCE.json',import.meta.url)));
 for(const p of people){const expected={greeting:p.greeting};for(const t of p.topics){expected[t.id]=t.answer;if(t.followup)expected[t.id+'-followup']=t.followup.answer;}const child=personForMode(p,'samaria','child');expected['child-greeting']=child.greeting;for(const t of child.topics){expected['child-'+t.id]=t.answer;expected['child-'+t.id+'-followup']=t.followup.answer;}const take=provenance.takes.find(t=>t.id===p.id),voice=manifest[p.id],bytes=await readFile(new URL('../public/'+voice.src,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),take.mp3_sha256);assert.equal(take.audio.original_characters.map(c=>c.text).join(''),take.request.text);assert.equal(take.request.speed,1);assert.equal(take.request.outputFormat,undefined);assert.equal(voice.duration,take.mp3_duration);assert.ok(bytes.length>1000000);assert.deepEqual(Object.keys(voice.clips).sort(),Object.keys(expected).sort());let previous=0;for(const [id,c] of Object.entries(voice.clips)){assert.equal(c.text,expected[id]);assert.deepEqual(c,take.clips[id]);assert.ok(c.start>=previous-.061&&c.end>c.start&&c.end<=voice.duration);previous=c.end;}}
});
