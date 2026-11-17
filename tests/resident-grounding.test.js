import {characterClips} from './helpers/character-clips.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createResidentInstance,residentModelFor,mountBlenderResidents} from '../src/blender-assets.js';
import {residentFootContact} from '../src/resident-locomotion.js';
import {blenderModels} from '../src/blender-manifest.js';
import {createHistoricalScene} from '../src/historical-scenes.js';

const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});globalThis.document={createElement:()=>({getContext:()=>ctx})};
async function asset(id){const b=await readFile(new URL('../public/'+blenderModels[id].src,import.meta.url));return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');}
const base=await asset('resident');
const actor=(time=0)=>({id:'householder',scale:1,state:{position:[0,0,0],yaw:0,time,stride:1,visible:true,idleAction:'Idle'}});
function soleVertices(root,side){
  const points=[];root.traverse(m=>{
    if(!m.isSkinnedMesh||m.material.name!=='leather')return;
    const index=m.skeleton.bones.findIndex(b=>b.name==='foot'+side),p=m.geometry.attributes.position,si=m.geometry.attributes.skinIndex,sw=m.geometry.attributes.skinWeight;
    for(let i=0;i<p.count;i++)if(p.getY(i)<.0025){
      for(let k=0;k<4;k++)if(si.getComponent(i,k)===index&&sw.getComponent(i,k)>.99){points.push([m,i]);break;}
    }
  });assert.ok(points.length>10);return points;
}
function positions(root,points){root.updateMatrixWorld(true);root.traverse(m=>{if(m.isSkinnedMesh)m.skeleton.update();});return points.map(([m,i])=>m.localToWorld(m.getVertexPosition(i,new THREE.Vector3())));}

test('actual resident and artisan exports contain the declared planted gait and visibly different garment ensembles',async()=>{
  for(const id of ['resident','resident-worker']){
    const gltf=id==='resident'?base:await asset(id),walk=gltf.animations.find(a=>a.name==='Walk');assert.ok(Math.abs(walk.duration-(blenderModels[id].walkDuration||1))<1e-5);
    assert.ok(walk.tracks.every(t=>Math.abs(t.times[0])<1e-6),'no frozen leading frame');
    const materials=[];gltf.scene.traverse(o=>{if(o.isMesh)materials.push(o.material.name);});assert.equal(materials.includes('mantle'),id==='resident');
    assert.deepEqual(gltf.animations.map(c=>c.name).sort(),characterClips(id));
    for(const [name,bone] of [['Idle','spine'],['LookAround','head'],['Talk','forearmL'],['Interact','forearmR']]){
      const mixer=new THREE.AnimationMixer(gltf.scene),clip=gltf.animations.find(c=>c.name===name);mixer.clipAction(clip).play();mixer.setTime(0);
      const first=gltf.scene.getObjectByName(bone).quaternion.clone();mixer.setTime(.37);
      assert.ok(first.angleTo(gltf.scene.getObjectByName(bone).quaternion)>(name==='Idle'?.001:.01),`${id}/${name} has a real changing pose`);
      mixer.stopAllAction();mixer.uncacheRoot(gltf.scene);
    }
  }
});

test('sole geometry stays on flat ground during stance and planted vertices remain stationary as the NPC advances',()=>{
  const a=actor(.1),instance=createResidentInstance(base,a),root=instance.root,points=soleVertices(root,'L');
  instance.update(.1);const first=positions(root,points);
  for(const p of first)assert.ok(p.y>=-.003&&p.y<.004);
  a.state.position=[0,0,.8*root.scale.x*.1];a.state.time+=.1;instance.update(.1);const second=positions(root,points);
  second.forEach((p,i)=>assert.ok(p.distanceTo(first[i])<.003,'planted foot does not skate with the moving root'));
  const before=root.getObjectByName('hips').getWorldPosition(new THREE.Vector3());
  for(let i=0;i<30;i++)instance.update(0);
  assert.ok(root.getObjectByName('hips').getWorldPosition(new THREE.Vector3()).distanceTo(before)<1e-6,'repeated zero-time updates do not accumulate pelvis/IK offsets');
  positions(root,points).forEach((p,i)=>assert.ok(p.distanceTo(second[i])<1e-6));
  const skeletons=new Set();root.traverse(o=>{if(o.isSkinnedMesh)skeletons.add(o.skeleton);});let released=0;
  for(const skeleton of skeletons){skeleton.computeBoneTexture();skeleton.boneTexture.addEventListener('dispose',()=>released++);}
  instance.dispose();assert.equal(released,skeletons.size,'LOD disposal releases private GPU bone textures');
});

test('actual soles follow ascending and descending stair collision ramps without penetration or floating in either support phase',()=>{
 for(const slope of [.30,-.30]){
  const a=actor(0),groundAt=(x,z)=>slope*z,instance=createResidentInstance(base,a,0,{groundAt}),root=instance.root;
  const points=['L','R'].map(s=>soleVertices(root,s)),scale=root.scale.x;
  for(let i=0;i<60;i++){
    const t=i/60,z=.8*scale*t;a.state.position=[0,groundAt(0,z),z];a.state.time=t;instance.update(i?1/60:0);
    for(let side=0;side<2;side++){
      const phase=root.userData.gaitPhase??t,contact=residentFootContact('Walk',phase*1.2,side?'R':'L',phase),all=positions(root,points[side]);
      const gaps=all.map(p=>(p.y-groundAt(p.x,p.z))/Math.sqrt(1.09));assert.ok(gaps.every(gap=>gap>-.004),'sole stays above the physical ramp');if(contact!=='swing')assert.ok(Math.abs(Math.min(...gaps))<.005,'the actual heel, flat or toe support touches the ramp');
    }
  }
  instance.dispose();
 }
});

test('Herod uses actual nearby adult meshes and role-specific clothing while behaviour and fallback bodies stay intact',async()=>{
  const loaded=new Map(),load=id=>{if(!loaded.has(id))loaded.set(id,asset(id));return loaded.get(id);};
  const scene=createHistoricalScene('herod',null,{blenderAssets:true,assetLoader:load});assert.equal(await scene.detailedResidents.ready,true);
  const person=scene.people.find(a=>a.id==='stone-worker'),seeds=scene.npcSystem.agents.map(a=>a.seed),position=[...person.state.position];
  assert.equal(scene.npcSystem.agents.find(a=>a.actor===person).radius,.33);
  scene.converse('stone-worker');scene.animate(0,[position[0]+2,position[1]+1.7,position[2]+3]);
  const instance=scene.detailedResidents.visible.get(person);assert.ok(instance);assert.equal(instance.root.userData.modelId,'resident-worker');assert.equal(residentModelFor(person),'resident-worker');
  assert.equal(instance.actions.get('Talk').getEffectiveWeight(),1);
  const gesture=instance.root.getObjectByName('forearmL').quaternion.clone();scene.animate(.15,[position[0]+2,position[1]+1.7,position[2]+3]);
  assert.ok(gesture.angleTo(instance.root.getObjectByName('forearmL').quaternion)>.001,'dialogue updates a real independent gesture');
  assert.deepEqual(person.state.position,position,'conversation keeps this NPC in place');
  assert.equal(person.blenderVisual,true);assert.ok(scene.detailedResidents.visible.size<=8);assert.deepEqual(scene.npcSystem.agents.map(a=>a.seed),seeds);
  const body=[];instance.root.traverse(o=>{if(o.isMesh)body.push(o);});assert.ok(body.every(o=>o.userData.actorId==='stone-worker'));
  scene.dispose();assert.equal(person.blenderVisual,false);
  const isolated=actor(),container=new THREE.Scene(),mount=mountBlenderResidents(container,[isolated],()=>{},{assetLoader:async()=>base});
  mount.dispose();await mount.ready;mount.update([0,1.7,3],.1);assert.equal(container.children.length,0,'late models do not resurrect a disposed scene');
});
