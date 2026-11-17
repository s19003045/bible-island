import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {blenderModels} from '../src/blender-manifest.js';
import {createResidentInstance} from '../src/blender-assets.js';
import {residentFootContact} from '../src/resident-locomotion.js';
function footPoints(root,side){
 const points=[];root.traverse(mesh=>{if(!mesh.isSkinnedMesh)return;const index=mesh.skeleton.bones.findIndex(b=>b.name==='foot'+side),{position,skinIndex,skinWeight}=mesh.geometry.attributes;
  for(let i=0;i<position.count;i++)for(let k=0;k<4;k++)if(skinIndex.getComponent(i,k)===index&&skinWeight.getComponent(i,k)>.999){points.push([mesh,i]);break;}
 });return points;
}
test('all28 full foot geometries, including curved bare heels, clear and touch flat/up/down slopes from initial heel contact',async()=>{
 const definitions=Object.entries(blenderModels).filter(([,d])=>d.type==='character');assert.equal(definitions.length,28);
 for(const [id,definition]of definitions){
  assert.equal(definition.motionVersion,2,id);const bytes=await readFile(new URL('../public/'+definition.src,import.meta.url)),gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  for(const slope of [0,.3,-.3]){
   const scale=.993,actor={id:'contact-audit',modelId:id,scale:definition.height/1.7*scale,state:{position:[0,0,0],yaw:0,time:0,stride:1,idleAction:'Idle',visible:true}},ground=(x,z)=>slope*z,instance=createResidentInstance(gltf,actor,0,{groundAt:ground}),root=instance.root,feet=['L','R'].map(side=>footPoints(root,side));assert.ok(feet.every(f=>f.length>20));
   for(let i=0;i<=180;i++){
    const z=i*definition.cycleDistance*scale/120;actor.state.position=[0,ground(0,z),z];actor.state.time=i/120;instance.update(i?1/120:0);root.updateMatrixWorld(true);
    for(let side=0;side<2;side++){
     const gaps=feet[side].map(([mesh,index])=>{const p=mesh.localToWorld(mesh.getVertexPosition(index,new THREE.Vector3()));return p.y-ground(p.x,p.z);}),min=Math.min(...gaps),phase=root.userData.gaitPhase,contact=residentFootContact('Walk',phase*1.2,side?'R':'L',phase);
     assert.ok(min>-.0005,`${id} slope${slope} frame${i} full foot penetration ${min}`);
     if(contact!=='swing')assert.ok(Math.abs(min)<.002,`${id} slope${slope} frame${i} support gap ${min}`);
    }
   }
   instance.dispose();
  }
 }
});
