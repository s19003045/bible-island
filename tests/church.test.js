import {upgradedModelFor} from '../src/human-motion-data.js';
import test from 'node:test';import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
import * as THREE from 'three';import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createHistoricalScene} from '../src/historical-scenes.js';
import {blenderModels} from '../src/blender-manifest.js';import {createVessel} from '../src/vessels.js';import {setArtifactSeparation} from '../src/artifact-inspection.js';
import {churchSegments as chapters,churchReadingPhases} from '../src/church-exploration.js';
import {churchPeople as people} from '../src/church-content.js';
import {setNarrativeChapter,stateNarrativePhase,setNarrativePhase,narrativeChapterPicker} from '../src/narrative-chapters.js';
import {freshLearning,learningEvent,learningRecord,personForMode} from '../src/learning-model.js';
import {learningComparison} from '../src/learning-ui.js';import {peopleMarkup} from '../src/people-ui.js';import {freshMission} from '../src/walk-data.js';import {themeById} from '../src/content.js';
const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});globalThis.document=Object.assign(new EventTarget(),{createElement:()=>({getContext:()=>ctx}),querySelector:()=>null,activeElement:null});globalThis.window=new EventTarget();
const load=async id=>{assert.ok(blenderModels[id],id+' registered');const b=await readFile(new URL('../public/'+blenderModels[id].src,import.meta.url));return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};
test('Church keeps old keys, cross-place phase memory, exact CSBT links and independent learning gates',()=>{
 assert.deepEqual(themeById.get('church').stops.map(s=>s.id),['gathering','table','road']);assert.match(themeById.get('church').stops[2].reference,/11:19–30/);
 const state={selected:'church',mode:'child',narrativeSegments:{parables:'lamp'},narrativePhases:{parables:{lamp:'door'}},mission:freshMission(),learning:freshLearning(),explorationSeen:{samaria:['samaria-jar']}};
 setNarrativeChapter(state,'church','gathering');setNarrativePhase(state,'church','response');setNarrativeChapter(state,'church','road');setNarrativePhase(state,'church','aid');setNarrativeChapter(state,'church','gathering');assert.equal(stateNarrativePhase(state),'response');assert.equal(stateNarrativePhase(state,'parables'),'door');
 for(const [i,c]of chapters.entries()){setNarrativeChapter(state,'church',c.id);const html=narrativeChapterPicker('church',c.id,stateNarrativePhase(state));assert.equal((html.match(/data-narrative-segment=/g)||[]).length,3);assert.equal((html.match(/data-narrative-phase=/g)||[]).length,[4,3,3][i]);assert.ok(html.includes('bible.com/zh-TW/bible/312/'));assert.equal((peopleMarkup(state).match(/data-person=/g)||[]).length,1);}
 assert.match(learningComparison({...state,mode:'study'}),/耶路撒冷/);assert.deepEqual(state.explorationSeen.samaria,['samaria-jar']);
 let d=learningEvent(freshLearning(),'parables','study',{type:'note',text:'保留比喻札記'}).data;
 assert.equal(learningEvent(d,'church','child',{type:'answer',id:'gathering',choice:1}).feedback.kind,'blocked');d=learningEvent(d,'church','child',{type:'observe',id:'gathering'}).data;d=learningEvent(d,'church','child',{type:'answer',id:'gathering',choice:1}).data;assert.deepEqual(learningRecord(d,'church','child').completed,['gathering']);
 assert.equal(learningEvent(d,'church','study',{type:'answer',id:'road',choice:'text'}).feedback.kind,'blocked');d=learningEvent(d,'church','study',{type:'inspect',id:'road'}).data;d=learningEvent(d,'church','study',{type:'answer',id:'road',choice:'text'}).data;assert.deepEqual(learningRecord(d,'church','study').completed,['road']);assert.deepEqual(learningRecord(d,'church','general').completed,[]);assert.equal(learningRecord(d,'parables','study').note,'保留比喻札記');
});
test('Church all 24 cues match actual personForMode, returned characters and canonical audio',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../src/voice-manifest.json',import.meta.url))),provenance=JSON.parse(await readFile(new URL('../docs/review/CHURCH-VOICE-PROVENANCE.json',import.meta.url)));
 for(const p of people){const expected={greeting:p.greeting};for(const t of p.topics){expected[t.id]=t.answer;if(t.followup)expected[t.id+'-followup']=t.followup.answer;}const child=personForMode(p,'church','child');expected['child-greeting']=child.greeting;for(const t of child.topics){expected['child-'+t.id]=t.answer;expected['child-'+t.id+'-followup']=t.followup.answer;}const take=provenance.takes.find(t=>t.id===p.id),voice=manifest[p.id],bytes=await readFile(new URL('../public/'+voice.src,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),take.mp3_sha256);assert.equal(take.audio.original_characters.map(c=>c.text).join(''),take.request.text);assert.equal(take.request.speed,1);assert.equal(take.request.outputFormat,undefined);assert.equal(voice.duration,take.mp3_duration);assert.ok(bytes.length>1000000);assert.deepEqual(Object.keys(voice.clips).sort(),Object.keys(expected).sort());let previous=0;for(const [id,c]of Object.entries(voice.clips)){assert.equal(c.text,expected[id]);assert.deepEqual(c,take.clips[id]);assert.ok(c.start>=previous-.061&&c.end>c.start&&c.end<=voice.duration);previous=c.end;}}
});

test('Church detailed residents and objects follow every distinct space, stop in dialogue and remain visible',async()=>{
 for(const [segment,phase,modelId]of [['gathering','hear','resident'],['table','need','roman-woman'],['road','aid','resident-worker']]){
  const s=createHistoricalScene('church',null,{segment,phase,blenderAssets:true,assetLoader:load});await s.detailedResidents.ready;assert.ok(s.objects[0].root.userData.assetReady);await s.objects[0].root.userData.assetReady;const a=s.people[0],p=[...a.state.position];assert.equal(a.modelId,upgradedModelFor(modelId));s.converse(a.id);s.animate(.05,[p[0]+2,p[1]+2,p[2]+3]);assert.deepEqual(a.state.position,p);
  s.scene.updateMatrixWorld(true);const o=s.objects[0],eye=new THREE.Vector3(...o.approach).add(new THREE.Vector3(0,1.62,0)),delta=new THREE.Vector3(...o.lookAt).sub(eye),blockers=s.occluders.filter(m=>{for(let n=m;n;n=n.parent)if(n===o.root)return false;return true;});assert.equal(new THREE.Raycaster(eye,delta.clone().normalize(),.08,delta.length()).intersectObjects(blockers,false).length,0);s.dispose();
 }
});
test('Church modern roof section moves every vertex and restores while all fixed vertices stay put',async()=>{
 assert.equal(blenderModels['church-table'].articulation,undefined);assert.equal(blenderModels['church-relations'].articulation,undefined);
 for(const root of [(await load('church-house')).scene,createVessel('church-house')]){
  const {part,offset}=blenderModels['church-house'].articulation,group=root.getObjectByName(part);assert.ok(group);root.updateMatrixWorld(true);const vertices=()=>{const out=new Map();root.traverse(o=>{if(o.isMesh){const p=o.geometry.attributes.position;out.set(o,Array.from({length:p.count},(_,i)=>new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld)));}});return out;},before=vertices();
  setArtifactSeparation(root,part,offset);root.updateMatrixWorld(true);let moving=0,fixed=0;for(const [mesh,ps]of vertices()){const move=!!group.getObjectById(mesh.id),d=new THREE.Vector3(...(move?offset:[0,0,0]));if(move)moving++;else fixed++;ps.forEach((p,i)=>assert.ok(p.distanceTo(before.get(mesh)[i].clone().add(d))<1e-6));}assert.ok(moving&&fixed);setArtifactSeparation(root,part,[0,0,0]);root.updateMatrixWorld(true);for(const [mesh,ps]of vertices())ps.forEach((p,i)=>assert.ok(p.distanceTo(before.get(mesh)[i])<1e-6));
 }
});
