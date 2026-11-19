import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {themes} from '../src/content.js';
import {blenderModels} from '../src/blender-manifest.js';
import {humanRolloutAssets} from '../src/human-rollout-assets.js';
import {createHistoricalScene} from '../src/historical-scenes.js';
import {narrativeChapters} from '../src/narrative-chapters.js';
import {createResidentInstance} from '../src/blender-assets.js';
import {createHumanLocomotion} from '../src/human-locomotion.js';
import {motionRolesForActors} from '../src/motion-preview-data.js';
import {humanProfileFor} from '../src/human-motion-data.js';
import {prepareResidentGeometry} from '../src/resident-geometry.js';
import {articulatedFootPoints,sampleVertices,wardrobePointSets} from './helpers/human-geometry.js';

const cache=new Map(),hash=b=>createHash('sha256').update(b).digest('hex');
async function asset(id){if(!cache.has(id)){const b=await readFile(new URL('../public/'+blenderModels[id].src,import.meta.url));cache.set(id,await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),''));}return cache.get(id);}
const actor=id=>({id:'audit-'+id,modelId:id,motionProfile:blenderModels[id].motionProfile,scale:blenderModels[id].height/1.7,state:{position:[0,0,0],yaw:0,time:0,stride:1,walkDistance:0,visible:true,idleAction:'Idle'}});
const context=new Proxy({},{get:()=>()=>{},set:()=>true});globalThis.document={createElement:()=>({getContext:()=>context})};

test('all28 era-specific wardrobe geometries survive the real 120Hz human-motion exports and editable source contract',async()=>{
 assert.equal(Object.keys(humanRolloutAssets).length,28);
 for(const [id,d]of Object.entries(humanRolloutAssets)){
  const meta=JSON.parse(await readFile(new URL('../assets/blender/human-rollout/'+d.baseModelId+'-motion.json',import.meta.url),'utf8'));
  const bytes=await readFile(new URL('../public/'+d.src,import.meta.url)),original=await readFile(new URL('../public/'+blenderModels[d.baseModelId].src,import.meta.url));assert.equal(hash(bytes),meta.sha256);assert.equal(hash(original),meta.original_glb_sha256,'original file untouched');
  assert.equal(d.motionVersion,3);assert.ok(bytes.length<d.byteBudget);const source=new URL('../'+(meta.editable_source.file||meta.editable_source),import.meta.url);assert.ok((await stat(source)).size<32*1024*1024);if(meta.editable_source.sha256)assert.equal(hash(await readFile(source)),meta.editable_source.sha256);
  assert.ok(humanProfileFor(actor(id)).speed<=d.cycleDistance/d.walkDuration,'motor respects this wardrobe stride');
  const gltf=await asset(id),before=wardrobePointSets((await asset(d.baseModelId)).scene),after=wardrobePointSets(gltf.scene);assert.deepEqual(after,before,id+' unchanged surfaces/colours');
  assert.deepEqual(gltf.animations.map(c=>c.name).sort(),['Idle','Interact','LookAround','StartWalk','StopWalk','Talk','TurnLeft','TurnRight','Walk']);assert.ok(Math.abs(gltf.animations.find(c=>c.name==='Walk').duration-d.walkDuration)<.0001);
  const weighted=new Set();gltf.scene.traverse(m=>{if(!m.isSkinnedMesh)return;const {skinIndex,skinWeight}=m.geometry.attributes;for(let i=0;i<skinIndex.count;i++)for(let k=0;k<4;k++)if(skinWeight.getComponent(i,k)>.001)weighted.add(m.skeleton.bones[skinIndex.getComponent(i,k)].name);});
  for(const bone of ['spine','spineUpper','chest','toeL','toeR','eyeL','eyeR'])assert.ok(weighted.has(bone),id+' weighted '+bone);
 }
});

test('upgraded standing bearers retain the original right-hand pole contact while attention and breathing animate',async()=>{
 const id='human-priest-bearer',gltf=await asset(id);
 for(const side of [-1,1])for(const z of [-16.15,-13.85]){
  const a=actor(id);Object.assign(a.state,{position:[side*.635,.05,z],yaw:side<0?0:Math.PI,stride:0});
  const instance=createResidentInstance(gltf,a,0,{groundAt:()=>.05}),root=instance.root,vertices=[];
  root.traverse(m=>{if(!m.isSkinnedMesh||m.material.name!=='skin')return;const bi=m.skeleton.bones.findIndex(b=>b.name==='handR'),si=m.geometry.attributes.skinIndex,sw=m.geometry.attributes.skinWeight;for(let i=0;i<si.count;i++)if([0,1,2,3].some(k=>si.getComponent(i,k)===bi&&sw.getComponent(i,k)>.99))vertices.push([m,i]);});assert.ok(vertices.length>100);
  for(let i=0;i<60;i++){
   a.state.time=i*.17;instance.update(.17,{camera:[side*2,1.6,z+3]});
   const gap=Math.min(...sampleVertices(root,vertices).map(v=>Math.abs(Math.hypot(v.x-side*.43,v.y-1.435)-.024)));
   assert.ok(gap<.015,'right hand remains on the actual shared pole: '+gap);
  }
  instance.dispose();
 }
});

test('all28 real articulated soles remain supported on flat, uphill and downhill terrain at their own measured stride',async()=>{
 assert.equal(Object.keys(humanRolloutAssets).length,28);
 for(const [id,d]of Object.entries(humanRolloutAssets))for(const slope of [0,.25,-.25]){
  const a=actor(id),ground=(_x,z)=>slope*z,instance=createResidentInstance(await asset(id),a,0,{groundAt:ground}),feet=['L','R'].map(side=>articulatedFootPoints(instance.root,side)),contact=createHumanLocomotion(actor(id),d);assert.ok(feet.every(points=>points.length>30));
  for(let i=0;i<=140;i++){
   const z=i*d.cycleDistance/120;a.state.position=[0,ground(0,z),z];a.state.walkDistance=z;a.state.time=i*d.walkDuration/120;instance.update(i?d.walkDuration/120:0);
   assert.ok(Math.abs(instance.root.userData.humanPerformance.cloth)<=(d.secondaryCloth?.maxAngle??.08)+.000001,'wardrobe-specific secondary motion limit');
   for(let j=0;j<2;j++){
    const low=Math.min(...sampleVertices(instance.root,feet[j]).map(p=>p.y-ground(p.x,p.z))),phase=instance.root.userData.gaitPhase;
    assert.ok(low>-.001,`${id} slope${slope} frame${i} penetration ${low}`);
    if(contact.contact('Walk',phase*d.walkDuration,j?'R':'L',phase)!=='swing')assert.ok(low<.003,`${id} support gap ${low}`);
   }
  }
  instance.dispose();
 }
});

test('every island and chapter use their own upgraded wardrobes, individual controllers, and scene-specific comparison options',()=>{
 let configurations=0;
 for(const theme of themes)for(const chapter of narrativeChapters[theme.id]||[{id:null}]){
  const scene=createHistoricalScene(theme.id,null,{segment:chapter.id}),actors=scene.actors;assert.ok(actors.length,theme.id+' actors');
  for(const a of actors){assert.equal(blenderModels[a.modelId].motionVersion,theme.id==='jerusalem'&&['householder','water-carrier','street-vendor'].includes(a.id)?4:3,theme.id+' '+a.modelId);assert.ok(a.motionProfile);}
  const roles=motionRolesForActors(actors);assert.ok(Object.keys(roles).length,theme.id+' comparison');for(const r of Object.values(roles)){const life=r.after.startsWith('jerusalem-life-');assert.equal(blenderModels[r.before].motionVersion,life?3:2);assert.equal(blenderModels[r.after].motionVersion,life?4:3);if(life)assert.equal(theme.id,'jerusalem','pilot must not leak into other islands');}
  const seeds=scene.npcSystem.agents.map(a=>a.seed);assert.equal(new Set(seeds).size,seeds.length);
  for(const a of scene.npcSystem.agents){assert.ok(a.humanProfile,theme.id+' independent human controller');assert.ok(a.speedFactor>=.85&&a.speedFactor<=1.15);}
  const p=scene.people[0],position=[...p.state.position];scene.converse(p.id);scene.simulate(.2,[position[0]+2,position[1]+1.6,position[2]+3]);assert.deepEqual(p.state.position,position,'dialogue holds controller');assert.deepEqual(scene.npcSystem.agents.map(a=>a.seed),seeds);
  for(const a of actors.filter(a=>a.role==='ark-bearer')){assert.equal(a.motionProfile,'bearer');assert.ok(!scene.npcSystem.agents.some(n=>n.actor===a),'standing bearers are not wanderers');}
  scene.dispose();configurations++;
 }
 assert.ok(configurations>=60);
});

test('new wardrobes keep their actual colours and skin buffers when the distant geometry is simplified',async()=>{
 for(const id of Object.keys(humanRolloutAssets)){
  const source=await asset(id),reduced=await prepareResidentGeometry(source);let near=0,far=0;
  source.scene.traverse(m=>{if(!m.isMesh)return;const d=reduced.get(m.geometry)||m.geometry;near+=m.geometry.index.count;far+=d.index.count;for(const key of ['position','color','normal','skinIndex','skinWeight'])assert.equal(d.attributes[key],m.geometry.attributes[key],id+' stable '+key);});
  assert.ok(far<near*.65,id+' distant geometry budget');
 }
});
