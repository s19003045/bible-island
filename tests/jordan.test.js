import {upgradedModelFor} from '../src/human-motion-data.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createHistoricalScene} from '../src/historical-scenes.js';
import {createCharacterController} from '../src/character-controller.js';
import {createResidentInstance} from '../src/blender-assets.js';
import {blenderModels} from '../src/blender-manifest.js';
import {jordanFloor,jordanSpawn,jordanObjects,jordanPOIs} from '../src/jordan-exploration.js';
import {jordanLearning,jordanHistorical} from '../src/jordan-content.js';
import {freshLearning,learningEvent,learningRecord} from '../src/learning-model.js';
import {observeObject,readExploration,writeExploration} from '../src/exploration-progress.js';
import {scriptureLinks} from '../src/scripture.js';
import {peopleByIsland} from '../src/people-data.js';
import {personForMode} from '../src/learning-model.js';
const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});globalThis.document={createElement:()=>({getContext:()=>ctx})};
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
const load=async id=>{const b=await readFile(new URL('../public/'+blenderModels[id].src,import.meta.url));return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};

test('Jordan has a continuous walkable bank, three reachable objects and a permanently closed Ark precinct',()=>{
 const s=createHistoricalScene('jordan',null),m=s.walkModel;assert.equal(s.config.cutaway,false);assert.equal(s.roof.children.length,0);
 assert.ok(s.scene.getObjectByName('jordan-continuous-valley'));assert.ok(!s.scene.children.some(o=>o.name.includes('water-wall')));
 assert.ok(m.valid(...[jordanSpawn[0],jordanSpawn[2]]));
 for(const d of jordanObjects){const path=m.path(jordanSpawn,d.approach);assert.ok(path.length>0,d.id);let p=[...jordanSpawn];for(const q of path){let tries=0;while(distance(p,q)>.05){const n=distance(p,q),v=Math.min(n,.07),next=m.move(p,(q[0]-p[0])/n*v,(q[2]-p[2])/n*v);assert.ok(distance(next,p)>.000001,d.id+' route traversable');p=next;assert.ok(++tries<150);}}assert.ok(distance(p,d.approach)<.9);}
 for(const p of [[0,-15],[3,-12],[-2,-18]]){assert.equal(m.valid(...p),false);s.roof.visible=false;assert.equal(m.valid(...p),false);}
 for(const poi of jordanPOIs)for(const p of poi.slots)assert.ok(m.valid(p[0],p[2]),poi.id);s.dispose();
});

test('actual Jordan slopes keep the character grounded and visually smooth uphill and downhill at three frame rates',()=>{
 const s=createHistoricalScene('jordan',null);
 for(const fps of [30,60,120]){
  const c=createCharacterController(s.walkModel,{constrainMove:(from,to)=>s.npcSystem.constrainPlayer(from,to)});c.reset([-31,jordanFloor(-31),8]);let down=false,up=false,slow=false,previous=c.visualPosition[1];
  for(let i=0;i<fps*44;i++){
   const factor=c.speedFactor(.1,0);c.update(1/fps,1.5/fps*factor,0);assert.equal(c.state.isGrounded,true);assert.ok(Math.abs(c.position[1]-jordanFloor(c.position[0]))<.001);assert.ok(Math.abs(c.visualPosition[1]-previous)<.045);previous=c.visualPosition[1];
   down ||=c.state.groundSnapApplied;up ||=c.state.verticalDirection>0||c.state.verticalVelocity>0;slow ||=factor===.8;
  }
  assert.ok(down&&up&&slow);assert.ok(c.position[0]>26);
 }
 s.dispose();
});

test('Jordan residents and procession retain spacing for two minutes and reach distinct POIs within four minutes',()=>{
 const s=createHistoricalScene('jordan',null),n=s.npcSystem;assert.equal(n.agents.length,37);assert.equal(new Set(n.agents.map(a=>a.seed)).size,37);const previous=new Map(n.agents.map(a=>[a.key,a.actor.state.position[0]]));let social=false;
 for(let i=0;i<2400;i++){
  n.update(.05,{player:jordanSpawn,camera:[-45,5,25],isVisible:()=>true});
  for(const [j,a] of n.agents.entries()){
   const p=a.actor.state.position;assert.ok(Math.abs(p[1]-jordanFloor(p[0]))<.001);assert.ok(distance(p,jordanSpawn)>=a.radius+.32+.024);social ||=!!a.partner;
   if(a.role==='convoy'){assert.ok(p[0]>=previous.get(a.key)-.000001);previous.set(a.key,p[0]);assert.ok(Math.abs(p[2])<7.7);}
   else assert.ok(p[2]>=10&&p[2]<=28);
   for(const b of n.agents.slice(j+1))assert.ok(distance(p,b.actor.state.position)>=a.radius+b.radius+.024,'no cross-system overlap');
  }
  for(const p of n.pois)assert.ok(n.reservations.get(p.id).size<=p.capacity);
 }
 assert.ok(social);
 // Long bank journeys can still be en route after two minutes. Check everyone
 // reaches a place, then continue the same simulation rather than shortening it.
 assert.ok(n.agents.filter(a=>a.visits.size>=1).length>=Math.ceil(n.agents.length*.9),'most reach their first stop within two minutes');
 for(let i=0;i<2400;i++)n.update(.05,{player:jordanSpawn,camera:[-45,5,25],isVisible:()=>true});
 assert.ok(n.agents.every(a=>a.visits.size>=2));n.suspend();assert.ok([...n.reservations.values()].every(p=>p.size===0));s.dispose();
});

test('all Jordan general and child recordings match exact text and returned timestamps in three real local MP3 files',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../src/voice-manifest.json',import.meta.url))),provenance=JSON.parse(await readFile(new URL('../docs/review/JORDAN-VOICE-PROVENANCE.json',import.meta.url)));
 for(const p of peopleByIsland.jordan){
  const expected={greeting:p.greeting};for(const t of p.topics){expected[t.id]=t.answer;if(t.followup)expected[t.id+'-followup']=t.followup.answer;}
  const child=personForMode(p,'jordan','child');expected['child-greeting']=child.greeting;for(const t of child.topics){expected['child-'+t.id]=t.answer;expected['child-'+t.id+'-followup']=t.followup.answer;}
  const take=provenance.takes.find(t=>t.id===p.id),entry=manifest[p.id];assert.deepEqual(Object.keys(entry.clips).sort(),Object.keys(expected).sort());assert.equal(take.audio.original_characters.map(c=>c.text).join(''),take.request.text);assert.equal(take.local.speed,1);
  const mp3=await readFile(new URL('../public/'+entry.src,import.meta.url));assert.ok(mp3.length>900000);let end=0;
  for(const [key,c] of Object.entries(entry.clips)){assert.equal(c.text,expected[key]);assert.ok(c.start>=end-.06&&c.end>c.start&&c.end<=entry.duration);assert.deepEqual(c,take.clips[key]);end=c.end;}
 }
});

test('real Jordan GLBs show twelve separate grounded stones, a lower bed and a closed drape with two carrying poles',async()=>{
 const stones=await load('jordan-stones'),bed=await load('jordan-bed'),cover=await load('jordan-carrying');stones.scene.updateMatrixWorld(true);
 const pieces=[];stones.scene.traverse(o=>{if(/^memorial-stone-\d+$/.test(o.name))pieces.push(o);});assert.equal(pieces.length,12);
 for(const o of pieces){const b=new THREE.Box3().setFromObject(o);assert.ok(Math.abs(b.min.y)<.01);assert.ok(b.max.y>.3);}
 bed.scene.updateMatrixWorld(true);const meshes=[];bed.scene.traverse(o=>{if(o.isMesh)meshes.push(o);});
 const heights=[-.65,0,.65].map(x=>new THREE.Raycaster(new THREE.Vector3(x,2,0),new THREE.Vector3(0,-1,0)).intersectObjects(meshes,false)[0]?.point.y);assert.ok(heights[0]>heights[1]+.18&&heights[2]>heights[1]+.18);
 const poles=[];cover.scene.traverse(o=>{if(o.isMesh&&o.material.name==='jordan-carrying-pole-wood')poles.push(o);});assert.equal(poles.length,1);
 const p=poles[0].geometry.attributes.position;assert.ok([...Array(p.count).keys()].every(i=>Math.abs(p.getX(i))>.20&&Math.abs(p.getX(i))<.23));assert.ok(new THREE.Box3().setFromObject(poles[0]).getSize(new THREE.Vector3()).z>1.6);
 const cloth=[];cover.scene.traverse(o=>{if(o.isMesh&&o.material.name==='jordan-blue-covering-cloth')cloth.push(o);});assert.equal(cloth.length,1);assert.ok(cloth[0].geometry.index.count>6000);
});

test('standing bearer right hands stay at the actual shared pole and bank interlocutors keep their own detailed models',async()=>{
 const s=createHistoricalScene('jordan',null,{blenderAssets:true,assetLoader:load});assert.equal(await s.detailedResidents.ready,true);
 const bearer=await load('priest-bearer');
 for(const side of [-1,1])for(const z of [-16.15,-13.85]){
  const a={modelId:'priest-bearer',scale:1.735/1.7,state:{position:[side*.635,.05,z],yaw:side<0?0:Math.PI,time:0,stride:0,idleAction:'Idle'}};const instance=createResidentInstance(bearer,a,0,{groundAt:()=>.05}),root=instance.root,vertices=[];
  root.traverse(m=>{if(!m.isSkinnedMesh||m.material.name!=='skin')return;const bi=m.skeleton.bones.findIndex(b=>b.name==='handR'),si=m.geometry.attributes.skinIndex,sw=m.geometry.attributes.skinWeight;for(let i=0;i<si.count;i++)if([0,1,2,3].some(k=>si.getComponent(i,k)===bi&&sw.getComponent(i,k)>.99))vertices.push([m,i]);});assert.ok(vertices.length>100);
  for(let i=0;i<30;i++){a.state.time=i*.17;instance.update(.17);root.updateMatrixWorld(true);root.traverse(m=>{if(m.isSkinnedMesh)m.skeleton.update();});const gaps=vertices.map(([m,j])=>{const v=m.localToWorld(m.getVertexPosition(j,new THREE.Vector3()));return Math.abs(Math.hypot(v.x-side*.43,v.y-1.435)-.024);});assert.ok(Math.min(...gaps)<.015,'right hand remains at pole');}
  instance.dispose();
 }
 for(const [id,modelId] of [['jordan-priest','ordinary-priest'],['jordan-parent','wilderness-woman'],['jordan-traveler','wilderness-resident']]){
  const a=s.people.find(p=>p.id===id),p=[...a.state.position];s.converse(id);s.animate(.1,[p[0]+2,p[1]+1.6,p[2]+3]);assert.deepEqual(a.state.position,p);assert.equal(s.detailedResidents.visible.get(a)?.root.userData.modelId,upgradedModelFor(modelId));
 }
 s.dispose();
});

test('Jordan observations, distinct learning modes and uncertain reconstruction never overwrite saved five-island progress',()=>{
 const old={tabernacle:['woven-sample'],jerusalem:['clay-vessel']},records=observeObject(old,'jordan','jordan-stones');assert.deepEqual(old,{tabernacle:['woven-sample'],jerusalem:['clay-vessel']});let saved;const storage={setItem:(k,v)=>saved=v,getItem:()=>saved};writeExploration(storage,records);assert.deepEqual(readExploration(storage),records);
 let data=learningEvent(freshLearning(),'tabernacle','study',{type:'note',text:'保留原札記'}).data;
 for(const mode of ['child','general','study'])assert.deepEqual(learningRecord(data,'jordan',mode).completed,[]);
 const task=jordanLearning.study[0];data=learningEvent(data,'jordan','study',{type:'inspect',id:task.id}).data;data=learningEvent(data,'jordan','study',{type:'answer',id:task.id,choice:'reconstruction'}).data;assert.deepEqual(learningRecord(data,'jordan','study').completed,['river']);assert.equal(learningRecord(data,'tabernacle','study').note,'保留原札記');assert.deepEqual(learningRecord(data,'jordan','child').completed,[]);
 assert.match(jordanHistorical.limits,/900 m/);assert.match(jordanHistorical.limits,/吉甲/);for(const d of jordanObjects)assert.ok(scriptureLinks(d.passage).every(l=>l.url.endsWith('.CSBT')));
});
