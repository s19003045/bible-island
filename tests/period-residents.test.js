import {upgradedModelFor} from '../src/human-motion-data.js';
import {characterClips} from './helpers/character-clips.js';
import {residentFootContact} from '../src/resident-locomotion.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from 'three';
import {geometryLoader} from './helpers/load-gltf-geometry.js';
import {blenderModels} from '../src/blender-manifest.js';
import {createResidentInstance} from '../src/blender-assets.js';
import {createHistoricalScene} from '../src/historical-scenes.js';
import {historicalScenes} from '../src/historical-data.js';

const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});globalThis.document={createElement:()=>({getContext:()=>ctx})};
const ids=['roman-woman','wilderness-resident','wilderness-woman','wilderness-child','ordinary-priest','iron-resident','iron-woman','temple-singer','bronze-artisan','brick-laborer'],cache=new Map();
function asset(id){if(!cache.has(id))cache.set(id,(async()=>{const b=await readFile(new URL('../public/'+blenderModels[id].src,import.meta.url));return geometryLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');})());return cache.get(id);}
function person(modelId){const height=modelId.endsWith('woman')?1.64:modelId==='wilderness-child'?1.12:modelId==='ordinary-priest'?1.725:1.7;return {id:'review-person',modelId,scale:height/1.7,state:{position:[0,0,0],yaw:0,time:0,stride:0,idleAction:'Idle',visible:true}};}
function points(root,material,bone=null){const result=[];root.traverse(m=>{if(!m.isSkinnedMesh||!material(m.material.name))return;const p=m.geometry.attributes.position,si=m.geometry.attributes.skinIndex,sw=m.geometry.attributes.skinWeight,index=bone?m.skeleton.bones.findIndex(b=>b.name===bone):-1;for(let i=0;i<p.count;i++)if(!bone||[0,1,2,3].some(k=>si.getComponent(i,k)===index&&sw.getComponent(i,k)>.99))result.push([m,i]);});return result;}
function sample(root,vertices){root.updateMatrixWorld(true);root.traverse(m=>{if(m.isSkinnedMesh)m.skeleton.update();});return vertices.map(([m,i])=>m.localToWorld(m.getVertexPosition(i,new THREE.Vector3())));}
function connectedBoxes(root,material){
 const boxes=[];root.traverse(m=>{
  if(!m.isMesh||m.material.name!==material)return;
  const p=m.geometry.attributes.position,parent=[],position=[],byPoint=new Map(),index=m.geometry.index,vertex=[];
  for(let i=0;i<p.count;i++){const v=new THREE.Vector3().fromBufferAttribute(p,i),key=v.toArray().map(n=>Math.round(n*1e5)).join(':');if(!byPoint.has(key)){const id=parent.length;byPoint.set(key,id);parent.push(id);position.push(v);}vertex.push(byPoint.get(key));}
  const find=x=>parent[x]===x?x:(parent[x]=find(parent[x]));const link=(a,b)=>{a=find(a);b=find(b);if(a!==b)parent[b]=a;};
  for(let i=0;i<index.count;i+=3){link(vertex[index.getX(i)],vertex[index.getX(i+1)]);link(vertex[index.getX(i)],vertex[index.getX(i+2)]);}
  const groups=new Map();position.forEach((v,i)=>{const id=find(i);if(!groups.has(id))groups.set(id,new THREE.Box3());groups.get(id).expandByPoint(v);});boxes.push(...groups.values());
 });return boxes;
}

test('all ten new clothing types contain real independent declared skeletal performances',async()=>{
 for(const id of ids){
  const gltf=await asset(id);assert.deepEqual(gltf.animations.map(c=>c.name).sort(),characterClips(id));
  assert.ok(Math.abs(gltf.animations.find(c=>c.name==='Walk').duration-(blenderModels[id].walkDuration||1))<1e-5);
  for(const [action,bone] of [['Idle','spine'],['LookAround','head'],['Interact','forearmL'],['Talk','forearmL']]){
    const a=person(id);a.state.idleAction=action;a.state.talking=action==='Talk';const instance=createResidentInstance(gltf,a);instance.update(0);
    const initial=instance.root.getObjectByName(bone).quaternion.clone();a.state.time=.37;instance.update(.37);
    assert.ok(initial.angleTo(instance.root.getObjectByName(bone).quaternion)>(action==='Idle'?.001:.01),id+'/'+action);instance.dispose();
  }
 }
});

test('actual garments distinguish women, ordinary priests, singers and labourers with continuous exposed shoulder skin',async()=>{
  const woman=await asset('roman-woman'),priest=await asset('ordinary-priest'),singer=await asset('temple-singer'),labor=await asset('brick-laborer');
  assert.ok(points(woman.scene,n=>n==='roman-woman-cloth').some(([m,i])=>m.geometry.attributes.position.getY(i)<.18),'actual long garment reaches the lower shin');
  assert.ok(points(priest.scene,n=>n==='linen-garment-cloth','head').length>500,'priest has cloth headgear');
  assert.equal(points(singer.scene,n=>n==='linen-garment-cloth','head').length,0,'singer is not dressed as the priest');
  const priestMaterials=[];priest.scene.traverse(o=>{if(o.isMesh)priestMaterials.push(o.material.name);});
  for(const name of ['sash-blue','sash-purple','sash-red'])assert.ok(priestMaterials.includes(name));assert.ok(!priestMaterials.some(n=>/gold|gem|bronze|leather/.test(n)));
  for(const gltf of [priest,singer]){
    const sleeves=connectedBoxes(gltf.scene,'linen-garment-cloth');
    assert.ok(sleeves.some(b=>b.max.x<-.12&&b.min.y<.86&&b.max.y>1.37),'left long sleeve is one cloth surface across the elbow');
    assert.ok(sleeves.some(b=>b.min.x>.12&&b.min.y<.86&&b.max.y>1.37),'right long sleeve is one cloth surface across the elbow');
  }
  const laborMaterials=[];labor.scene.traverse(o=>{if(o.isMesh)laborMaterials.push(o.material.name);});assert.ok(laborMaterials.includes('labor-wrap-cloth'));assert.ok(!laborMaterials.includes('tunic'));
  const laborMeshes=[];labor.scene.updateMatrixWorld(true);labor.scene.traverse(o=>{if(o.isMesh)laborMeshes.push(o);if(o.isSkinnedMesh)o.skeleton.update();});
  for(const [x,y] of [[0,1.13],[-.07,1.25],[.07,1.25]]){
    const ray=new THREE.Raycaster(new THREE.Vector3(x,y,3),new THREE.Vector3(0,0,-1));assert.equal(ray.intersectObjects(laborMeshes,false)[0]?.object.material.name,'skin','the exposed chest surface is skin, not a coloured garment');
  }
  // Find a connected physical surface spanning both arms and the torso, rather
  // than trusting a part name or counting overlapping shoulder balls.
  assert.ok(connectedBoxes(labor.scene,'skin').some(b=>b.min.x<-.29&&b.max.x>.29&&b.min.y<.90&&b.max.y>1.35),'torso and both bare arms form a connected surface');
  const a=person('brick-laborer'),instance=createResidentInstance(labor,a),root=instance.root;
  const wrists=['L','R'].map(side=>({arm:points(root,n=>n==='skin','forearm'+side).filter(([m,i])=>m.geometry.attributes.position.getY(i)<.91),hand:points(root,n=>n==='skin','hand'+side).filter(([m,i])=>m.geometry.attributes.position.getY(i)>.82)}));
  for(const action of ['Idle','Walk','LookAround','Interact','Talk'])for(let i=0;i<8;i++){
    a.state.stride=action==='Walk'?1:0;a.state.idleAction=action;a.state.talking=action==='Talk';a.state.time=i*.31;if(action==='Walk')a.state.position[2]+=.8*root.scale.x*.31;instance.update(.31);
    for(const wrist of wrists){const arm=sample(root,wrist.arm),hand=sample(root,wrist.hand);const gap=Math.min(...arm.map(p=>Math.min(...hand.map(q=>p.distanceTo(q)))));assert.ok(gap<.015,'bare wrist surfaces stay in contact in '+action);}
  }
  instance.dispose();
});

test('every new body keeps its actual support foot on ascending and descending ground using its own dimensions',async()=>{
 for(const id of ids)for(const slope of [.30,-.30]){
  const a=person(id);a.state.stride=1;const def=blenderModels[id],instance=createResidentInstance(await asset(id),a,0,{groundAt:(x,z)=>slope*z}),root=instance.root;
  const soles=['L','R'].map(side=>{return points(root,()=>true,'foot'+side);});assert.ok(soles.every(p=>p.length));
  for(let i=0;i<40;i++){
    const t=i/40,z=(def.cycleDistance??.8)*root.scale.x*t;a.state.position=[0,slope*z,z];a.state.time=t;instance.update(i?1/40:0);
    for(let side=0;side<2;side++){const gait=root.userData.gaitPhase??t,contact=blenderModels[id].motionVersion===2?residentFootContact('Walk',gait*1.2,side?'R':'L',gait):((t+side*.5)%1<.58?'flat':'swing'),minGap=Math.min(...sample(root,soles[side]).map(p=>(p.y-slope*p.z)/Math.sqrt(1.09)));assert.ok(minGap>-.005,id+' avoids ground penetration '+JSON.stringify({slope,i,t,gait,minGap,modelScale:root.scale.x,contact}));if(contact!=='swing')assert.ok(minGap<.006,id+' support foot remains grounded');}
  }
  instance.dispose();
 }
});

test('all five actual scenes select period-specific nearby people without changing dialogue IDs or navigation control',async()=>{
 const expected={tabernacle:{weaver:'wilderness-resident',priest:'ordinary-priest','camp-parent':'wilderness-resident'},solomon:{'bronze-worker':'bronze-artisan',singer:'temple-singer','temple-visitor':'iron-resident'},herod:{pilgrim:'resident','stone-worker':'resident-worker',listener:'resident'},jerusalem:{householder:'jerusalem-life-resident','water-carrier':'jerusalem-life-carrier','street-vendor':'jerusalem-life-elder'}};
 for(const [id,people] of Object.entries(expected)){
  const s=createHistoricalScene(id,null,{blenderAssets:true,assetLoader:asset});assert.equal(await s.detailedResidents.ready,true);const seeds=s.npcSystem.agents.map(a=>a.seed);
  for(const [personId,modelId] of Object.entries(people)){
    const a=s.people.find(a=>a.id===personId),p=[...a.state.position],camera=[p[0]+2,p[1]+1.6,p[2]+3];s.converse(personId);s.animate(0,camera);s.animate(.3,camera);
    const instance=s.detailedResidents.visible.get(a);assert.ok(instance,personId);assert.equal(instance.root.userData.modelId,upgradedModelFor(modelId));assert.ok(instance.actions.get('Talk').getEffectiveWeight()>.85);assert.deepEqual(a.state.position,p);
  }
  const women=s.npcSystem.agents.filter(a=>a.actor.modelId.endsWith('woman'));assert.ok(women.length);assert.ok(women.every(a=>Math.abs(a.actor.scale*1.7-1.64)<1e-6));
  const a=women[0].actor,p=a.state.position;s.converse(null);s.animate(0,[p[0]+1,p[1]+1.5,p[2]+2]);assert.equal(s.detailedResidents.visible.get(a)?.root.userData.modelId,a.modelId);
  assert.deepEqual(s.npcSystem.agents.map(a=>a.seed),seeds);assert.ok(s.detailedResidents.visible.size<=8);s.dispose();
 }
 for(const segment of ['bricks','passover','crossing','all']){
  const s=createHistoricalScene('exodus',null,{segment,blenderAssets:true,assetLoader:asset});assert.equal(await s.detailedResidents.ready,true);
  const allowed=new Set(['brick-laborer','wilderness-resident','wilderness-woman','wilderness-child'].map(upgradedModelFor));assert.ok(s.npcSystem.agents.every(a=>allowed.has(a.actor.modelId)));
  const a=s.people[0],p=[...a.state.position],camera=[p[0]+1,p[1]+1.6,p[2]+3];s.converse(a.id);s.animate(0,camera);s.animate(.2,camera);
  assert.equal(s.detailedResidents.visible.get(a)?.root.userData.modelId,a.modelId);assert.deepEqual(a.state.position,p);assert.ok(s.npcSystem.agents.every(a=>a.radius===a.actor.collisionRadius));s.dispose();
 }
});

test('clothing assumptions and primary sources are part of the existing scene evidence shown to readers',()=>{
  assert.match(historicalScenes.tabernacle.limits,/大祭司/);assert.match(historicalScenes.exodus.limits,/年代、法老或角色身分/);assert.match(historicalScenes.herod.limits,/人口比例/);
  assert.ok(historicalScenes.solomon.sources.some(s=>s.url.includes('/312/2CH.5.12-14.CSBT')));assert.ok(historicalScenes.exodus.sources.some(s=>s.url==='https://www.metmuseum.org/art/collection/search/544649'));
});
