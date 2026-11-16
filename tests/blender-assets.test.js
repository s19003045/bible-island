import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';
import {blenderModels} from '../src/blender-manifest.js';
import {createResidentInstance,selectDetailedResidents,residentAction,attachBlenderObject} from '../src/blender-assets.js';

async function asset(id){const b=await readFile(new URL('../public/'+blenderModels[id].src,import.meta.url));return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');}
const resident=await asset('resident');
const actor=(id,x=0,time=0)=>({id,scale:1,state:{position:[x,0,0],yaw:0,time,stride:0,visible:true,idleAction:'Idle'}});

test('actual Blender exports match their recorded hashes, metre scales, geometry budgets and five animation clips',async()=>{
  const report=JSON.parse(await readFile(new URL('../assets/blender/build-report.json',import.meta.url),'utf8'));
  assert.match(report.blender,/4\.5\./);assert.ok((await stat(new URL('../assets/blender/bible-assets.blend',import.meta.url))).size>100000);
  for(const id of Object.keys(blenderModels)){
    const b=await readFile(new URL('../public/'+blenderModels[id].src,import.meta.url));
    assert.equal(b.readUInt32LE(0),0x46546c67);assert.equal(b.readUInt32LE(4),2);assert.equal(b.readUInt32LE(8),b.length);
    const json=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString());
    assert.match(json.asset.generator,/Blender/);assert.ok(json.buffers.every(v=>!v.uri));assert.ok(!json.images?.length,'no hidden texture/network dependencies');
    assert.equal(json.scenes.length,1,'each export contains only its own scene');
    assert.equal(createHash('sha256').update(b).digest('hex'),report.assets[id].sha256);assert.equal(b.length,report.assets[id].bytes);assert.ok(b.length<(blenderModels[id].byteBudget||750000));
    const gltf=id==='resident'?resident:await asset(id);gltf.scene.updateMatrixWorld(true);
    const size=new THREE.Box3().setFromObject(gltf.scene).getSize(new THREE.Vector3());
    assert.ok(Math.abs(size.y-blenderModels[id].height)<.025,`${id} scale ${size.y}`);
    let triangles=0;gltf.scene.traverse(o=>{if(!o.isMesh)return;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n));assert.ok(o.geometry.attributes.normal);assert.equal(o.geometry.attributes.color.count,o.geometry.attributes.position.count,'authored surface colours survive glTF export');});
    assert.equal(triangles,report.assets[id].triangles);assert.ok(triangles<(blenderModels[id].triangleBudget||18000));
  }
  assert.deepEqual(resident.animations.map(c=>c.name).sort(),['Idle','Interact','LookAround','Talk','Walk']);
});

test('individual skeletons and clocks animate independently, freeze at zero time, and retain clickable moving bodies',()=>{
  const a=actor('householder',0,.1),b=actor('street-vendor',4,.7);a.state.stride=1;b.state.stride=1;
  const one=createResidentInstance(resident,a),two=createResidentInstance(resident,b,1);
  const scene=new THREE.Scene();scene.add(one.root,two.root);one.update(.1);two.update(.1);scene.updateMatrixWorld(true);
  const bone1=one.root.getObjectByName('thighL'),bone2=two.root.getObjectByName('thighL');
  assert.notEqual(bone1,bone2);assert.notDeepEqual(bone1.quaternion.toArray(),bone2.quaternion.toArray());
  const before=bone1.quaternion.toArray(),other=bone2.quaternion.toArray();a.state.time=.65;a.state.position=[0,0,.16];one.update(.2);
  assert.notDeepEqual(bone1.quaternion.toArray(),before);assert.deepEqual(bone2.quaternion.toArray(),other);
  const frozen=bone1.quaternion.toArray();one.update(0);assert.deepEqual(bone1.quaternion.toArray(),frozen);
  a.state.position=[30,2,0];a.state.yaw=.2;one.update(0);scene.updateMatrixWorld(true);
  const meshes=[];one.root.traverse(o=>{if(o.isMesh)meshes.push(o);});
  const ray=new THREE.Raycaster(new THREE.Vector3(30,3.2,3),new THREE.Vector3(0,0,-1));
  assert.ok(ray.intersectObjects(meshes,false).some(h=>h.object.userData.actorId==='householder'));
  assert.equal(residentAction({...a.state,talking:true}),'Talk');assert.equal(residentAction({...a.state,stride:0,idleAction:'Interact'}),'Interact');
  one.dispose();two.dispose();assert.equal(scene.children.length,0);
});

test('detail selection caps eight nearby people, includes the new child/carrier models and prioritises dialogue',()=>{
  const actors=Array.from({length:20},(_,i)=>actor('resident-'+i,i+1));
  const child=actor('child');child.scale=.66;const carrier=actor('water-carrier');const hidden=actor('hidden');hidden.state.visible=false;
  const far=actor('far',60),talker=actor('talker',15);talker.state.talking=true;
  const chosen=selectDetailedResidents([...actors,child,carrier,hidden,far,talker],[0,1.7,0]);
  assert.equal(chosen.length,8);assert.ok(chosen.includes(talker));for(const a of [child,carrier])assert.ok(chosen.includes(a));for(const a of [hidden,far])assert.ok(!chosen.includes(a));
  assert.deepEqual(selectDetailedResidents(actors,null),[]);
  assert.deepEqual(selectDetailedResidents(actors,[0,1.7,0]),selectDetailedResidents(actors,[0,1.7,0]));
});

test('object replacement shares real GLB geometry, releases placeholders once and ignores late completion after disposal',async()=>{
  const gltf=await asset('clay-vessel'),root=new THREE.Group(),geometry=new THREE.BoxGeometry(),material=new THREE.MeshStandardMaterial();
  root.add(new THREE.Mesh(geometry,material));let geometryDisposed=0,materialDisposed=0,ready=0;
  geometry.addEventListener('dispose',()=>geometryDisposed++);material.addEventListener('dispose',()=>materialDisposed++);
  const controller=attachBlenderObject(root,'clay-vessel',()=>ready++,async()=>gltf);assert.equal(await controller.ready,true);
  assert.equal(geometryDisposed,1);assert.equal(materialDisposed,1);assert.equal(ready,1);assert.equal(root.userData.modelSource,'blender');
  const found=[];root.traverse(o=>{if(o.isMesh)found.push(o);});assert.ok(found.every(o=>o.userData.objectId==='clay-vessel'));
  let resolve;const cancelledRoot=new THREE.Group(),cancelled=attachBlenderObject(cancelledRoot,'clay-vessel',()=>{throw new Error('late callback');},()=>new Promise(r=>resolve=r));
  cancelled.dispose();resolve(gltf);assert.equal(await cancelled.ready,false);assert.equal(cancelledRoot.children.length,0);controller.dispose();
});
