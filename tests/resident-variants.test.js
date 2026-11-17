import {characterClips} from './helpers/character-clips.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createResidentInstance,residentModelFor} from '../src/blender-assets.js';
import {residentFootContact} from '../src/resident-locomotion.js';
import {blenderModels} from '../src/blender-manifest.js';
import {createHistoricalScene} from '../src/historical-scenes.js';

const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});globalThis.document={createElement:()=>({getContext:()=>ctx})};
const loaded=new Map();
function asset(id){if(!loaded.has(id))loaded.set(id,(async()=>{const b=await readFile(new URL('../public/'+blenderModels[id].src,import.meta.url));return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');})());return loaded.get(id);}
function actor(id,scale=1){return {id,scale,state:{position:[0,0,0],yaw:0,time:.1,stride:0,visible:true,idleAction:'Idle'}};}
function vertices(root,filter){const result=[];root.traverse(m=>{if(m.isSkinnedMesh&&filter(m))for(let i=0;i<m.geometry.attributes.position.count;i++)result.push([m,i]);});return result;}
function sample(root,points){root.updateMatrixWorld(true);root.traverse(m=>{if(m.isSkinnedMesh)m.skeleton.update();});return points.map(([m,i])=>m.localToWorld(m.getVertexPosition(i,new THREE.Vector3())));}

test('actual child export changes skeletal/body proportions rather than shrinking an adult uniformly',async()=>{
  const adult=(await asset('resident-worker')).scene,child=await asset('resident-child');adult.updateMatrixWorld(true);child.scene.updateMatrixWorld(true);
  const measure=(root,a,b)=>root.getObjectByName(a).getWorldPosition(new THREE.Vector3()).distanceTo(root.getObjectByName(b).getWorldPosition(new THREE.Vector3()));
  const headRatio=measure(child.scene,'neck','head')/measure(adult,'neck','head');
  const legRatio=measure(child.scene,'thighL','footL')/measure(adult,'thighL','footL');
  assert.ok(Math.abs(headRatio-legRatio)>.1,'head and legs have different scale factors');
  const bounds=new THREE.Box3().setFromObject(child.scene);assert.ok(Math.abs(bounds.max.y-1.10)<.005);assert.ok(Math.abs(bounds.min.y)<.003);
  assert.deepEqual(child.animations.map(c=>c.name).sort(),characterClips('resident-child'));
  const a=actor(undefined,1.1/1.7),instance=createResidentInstance(child,a);instance.update(0);
  const actualBounds=new THREE.Box3().setFromPoints(sample(instance.root,vertices(instance.root,()=>true)));
  assert.equal(residentModelFor(a),'resident-child');assert.ok(Math.abs(actualBounds.max.y-1.10)<.02);instance.dispose();
});

test('child gait plants real short-sole vertices and follows both ramp directions at its own stride length',async()=>{
 const gltf=await asset('resident-child'),distance=blenderModels['resident-child'].cycleDistance;
 for(const slope of [0,.30,-.30]){
  const a=actor(undefined,1.1/1.7);a.state.time=0;a.state.stride=1;
  const groundAt=(x,z)=>slope*z,instance=createResidentInstance(gltf,a,0,{groundAt}),root=instance.root;
  const soles=['L','R'].map(side=>vertices(root,m=>m.material.name==='leather').filter(([m,i])=>{
    if(m.geometry.attributes.position.getY(i)>.002)return false;
    const indices=m.geometry.attributes.skinIndex,weights=m.geometry.attributes.skinWeight,bone=m.skeleton.bones.findIndex(b=>b.name==='foot'+side);
    return [0,1,2,3].some(k=>indices.getComponent(i,k)===bone&&weights.getComponent(i,k)>.99);
  }));assert.ok(soles.every(p=>p.length>10));
  let previous;
  for(let i=0;i<60;i++){
    const t=i/60,z=distance*root.scale.x*t;a.state.position=[0,groundAt(0,z),z];a.state.time=t;instance.update(i?1/60:0);
    for(let side=0;side<2;side++){
      const gait=root.userData.gaitPhase??t,phase=(gait+side*.5)%1,contact=residentFootContact('Walk',gait*1.2,side?'R':'L',gait),points=sample(root,soles[side]);
      const gaps=points.map(p=>(p.y-groundAt(p.x,p.z))/Math.sqrt(1+slope*slope));assert.ok(gaps.every(gap=>gap>-.004));if(contact!=='swing')assert.ok(Math.abs(Math.min(...gaps))<.005,'heel, flat or toe support touches the slope');
      if(slope===0&&side===0&&phase>.1&&phase<.4){if(previous)points.forEach((p,j)=>assert.ok(p.distanceTo(previous[j])<.0008,'child support foot stays planted'));previous=points;}else if(side===0)previous=null;
    }
  }
  instance.dispose();
 }
});

test('actual carrier fingers maintain handle contact and the hollow jug stays upright through all five actions',async()=>{
  const gltf=await asset('resident-carrier'),a=actor('water-carrier'),instance=createResidentInstance(gltf,a),root=instance.root;
  assert.deepEqual(gltf.animations.map(c=>c.name).sort(),characterClips('resident-carrier'));
  const handle=vertices(root,m=>m.name.startsWith('carried-jug-handle')),body=vertices(root,m=>m.name.startsWith('carried-jug-body'));
  const fingers=Array.from({length:4},(_,j)=>vertices(root,m=>m.name.startsWith('curled-grip-finger-'+j)));
  assert.ok(handle.length&&body.length&&fingers.every(v=>v.length));
  const low=body.filter(([m,i])=>m.geometry.attributes.position.getY(i)<.5501),high=body.filter(([m,i])=>m.geometry.attributes.position.getY(i)>.9399);
  assert.ok(low.length&&high.length);
  for(const action of ['Idle','Walk','LookAround','Interact','Talk'])for(let i=0;i<12;i++){
    a.state.stride=action==='Walk'?1:0;a.state.idleAction=action;a.state.talking=action==='Talk';a.state.time=i*.31;
    if(action==='Walk')a.state.position[2]+=.8*root.scale.x*.31;
    instance.update(.31);
    const handles=sample(root,handle);
    for(const finger of fingers){const p=sample(root,finger);const nearest=Math.min(...p.map(v=>Math.min(...handles.map(h=>v.distanceTo(h)))));assert.ok(nearest<.020,`${action} finger contact gap ${nearest}`);}
    const average=points=>points.reduce((v,p)=>v.add(p),new THREE.Vector3()).multiplyScalar(1/points.length),axis=average(sample(root,high)).sub(average(sample(root,low))).normalize();
    assert.ok(axis.dot(new THREE.Vector3(0,1,0))>.999,'load-bearing arm does not swing the jug sideways');
    assert.equal(residentModelFor(a),'resident-carrier');
  }
  const meshes=[];root.traverse(o=>{if(o.isMesh)meshes.push(o);});assert.ok(meshes.every(m=>m.userData.actorId==='water-carrier'));
  instance.dispose();
});

test('Jerusalem replaces carrier and four authored child silhouettes while preserving named dialogue and independent behaviour',async()=>{
  const city=createHistoricalScene('jerusalem',null,{blenderAssets:true,assetLoader:asset});assert.equal(await city.detailedResidents.ready,true);
  const children=city.npcSystem.agents.filter(a=>a.actor.scale<.9);assert.equal(children.length,4);
  for(const child of children){const p=child.actor.state.position;city.animate(0,[p[0],p[1]+1.4,p[2]+2]);const instance=city.detailedResidents.visible.get(child.actor);assert.ok(instance);assert.equal(instance.root.userData.modelId,'resident-child');}
  const carrier=city.people.find(p=>p.id==='water-carrier'),p=[...carrier.state.position],seeds=city.npcSystem.agents.map(a=>a.seed);
  assert.equal(city.npcSystem.agents.find(a=>a.actor===carrier).radius,.49);
  city.converse('water-carrier');city.animate(0,[p[0]+1,p[1]+1.6,p[2]+3]);
  const instance=city.detailedResidents.visible.get(carrier);assert.ok(instance);assert.equal(instance.root.userData.modelId,'jerusalem-carrier');
  city.animate(.2,[p[0]+1,p[1]+1.6,p[2]+3]);assert.deepEqual(carrier.state.position,p);assert.deepEqual(city.npcSystem.agents.map(a=>a.seed),seeds);
  assert.ok(instance.actions.get('Talk').getEffectiveWeight()>.7,'conversation smoothly blends into its gesture');assert.ok(city.detailedResidents.visible.size<=8);assert.equal(city.people.length,3);
  city.dispose();assert.equal(carrier.blenderVisual,false);
});
