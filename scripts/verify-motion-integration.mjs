import {readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {blenderModels} from '../src/blender-manifest.js';
import {createResidentInstance} from '../src/blender-assets.js';
import {residentFootContact} from '../src/resident-locomotion.js';

const directory=resolve(process.argv[2]||'.qa/motion-integrated');
const staged=JSON.parse(await readFile(join(directory,'integration-report.json'),'utf8'));
const report={kind:'actual-staged-GLB-runtime-verification',characters:{},failures:[]};
async function load(path){const b=await readFile(path);return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');}
function meshes(gltf){const entries=new Map();gltf.scene.traverse(o=>{if(o.isMesh)entries.set(o.name,o);});return entries;}
function soleVertices(root,side){
 const result=[];root.traverse(mesh=>{
  if(!mesh.isSkinnedMesh)return;const p=mesh.geometry.attributes.position,si=mesh.geometry.attributes.skinIndex,sw=mesh.geometry.attributes.skinWeight,index=mesh.skeleton.bones.findIndex(b=>b.name==='foot'+side);
  if(index<0)return;let bottom=Infinity;const candidates=[];
  for(let i=0;i<p.count;i++)for(let k=0;k<4;k++)if(si.getComponent(i,k)===index&&sw.getComponent(i,k)>.999){bottom=Math.min(bottom,p.getY(i));candidates.push(i);break;}
  for(const i of candidates)if(p.getY(i)<bottom+.0015)result.push([mesh,i]);
 });return result;
}
for(const [id,metadata]of Object.entries(staged.characters))try{
 const original=await load('public/'+blenderModels[id].src),upgraded=await load(metadata.file),result={};report.characters[id]=result;
 const before=meshes(original),after=meshes(upgraded);assert.deepEqual([...after.keys()].sort(),[...before.keys()].sort());
 for(const [name,mesh]of before){const other=after.get(name);for(const key of ['position','normal','color','skinIndex','skinWeight'])if(mesh.geometry.attributes[key])assert.deepEqual(other.geometry.attributes[key].array,mesh.geometry.attributes[key].array,`${id}/${name}/${key}`);assert.deepEqual(other.geometry.index?.array,mesh.geometry.index?.array);}
 result.restMeshAttributesExact=true;result.clips=upgraded.animations.map(c=>c.name).sort();
 assert.deepEqual(result.clips,['Idle','Interact','LookAround','StartWalk','StopWalk','Talk','TurnLeft','TurnRight','Walk'].sort());
 result.originalGestures={};
 for(const name of ['Idle','Interact','LookAround','Talk']){
  const oldClip=original.animations.find(c=>c.name===name),newClip=upgraded.animations.find(c=>c.name===name);assert.ok(Math.abs(oldClip.duration-newClip.duration)<1e-5);
  const roots=[clone(original.scene),clone(upgraded.scene)],mixers=roots.map((root,i)=>{const m=new THREE.AnimationMixer(root);m.clipAction(i?newClip:oldClip).setLoop(THREE.LoopOnce,1).play();return m;});
  let maxPosition=0,maxAngle=0;
  for(let i=0;i<=60;i++){
   const t=Math.min(oldClip.duration-1e-6,i/60*oldClip.duration);mixers.forEach(m=>m.setTime(t));roots.forEach(root=>root.updateMatrixWorld(true));
   roots[0].traverse(bone=>{if(!bone.isBone)return;const other=roots[1].getObjectByName(bone.name);maxPosition=Math.max(maxPosition,bone.getWorldPosition(new THREE.Vector3()).distanceTo(other.getWorldPosition(new THREE.Vector3())));maxAngle=Math.max(maxAngle,bone.getWorldQuaternion(new THREE.Quaternion()).angleTo(other.getWorldQuaternion(new THREE.Quaternion())));});
  }
  result.originalGestures[name]={duration:oldClip.duration,maxWorldPositionDeltaM:maxPosition,maxWorldAngleDeltaRadians:maxAngle};
  assert.ok(maxPosition<.001,`${id}/${name} original gesture position changed ${maxPosition}`);assert.ok(maxAngle<.002,`${id}/${name} original gesture rotation changed ${maxAngle}`);mixers.forEach(m=>{m.stopAllAction();m.uncacheRoot(m.getRoot());});
 }
 result.terrain=[];
 for(const slope of [0,.3,-.3]){
  const actor={id:'qa',modelId:id,scale:blenderModels[id].height/1.7,state:{position:[0,0,0],yaw:0,time:.15,stride:1,visible:true,idleAction:'Idle'}},floor=(x,z)=>slope*z;
  const instance=createResidentInstance(upgraded,actor,0,{motionVersion:2,metrics:{cycleDistance:metadata.cycle_distance_m},groundAt:floor}),root=instance.root,points=['L','R'].map(side=>soleVertices(root,side));
  assert.ok(points.every(p=>p.length>2));instance.update(0);let minGap=Infinity,maxSupportGap=0,maxFlatAnkleStep=0,previous=null;
  for(let i=1;i<=480;i++){
   const z=i*.75/120;actor.state.position=[0,floor(0,z),z];actor.state.time+=1/120;instance.update(1/120);root.updateMatrixWorld(true);root.traverse(mesh=>{if(mesh.isSkinnedMesh)mesh.skeleton.update();});
   const phase=root.userData.gaitPhase;
   for(let side=0;side<2;side++){
    let footMin=Infinity;for(const [mesh,index]of points[side]){const p=mesh.localToWorld(mesh.getVertexPosition(index,new THREE.Vector3())),gap=p.y-floor(p.x,p.z);footMin=Math.min(footMin,gap);minGap=Math.min(minGap,gap);}
    if(residentFootContact('Walk',phase*1.2,side?'R':'L',phase)!=='swing')maxSupportGap=Math.max(maxSupportGap,Math.abs(footMin));
   }
   const ankle=root.getObjectByName('footL').getWorldPosition(new THREE.Vector3());if(i>240&&phase>.1&&phase<.4&&previous&&previous.phase<phase)maxFlatAnkleStep=Math.max(maxFlatAnkleStep,ankle.distanceTo(previous.ankle));previous={ankle,phase};
  }
  result.terrain.push({slope,frames:480,sampleHz:120,minSoleGapM:minGap,maxSupportGapM:maxSupportGap,maxSteadyFlatAnkleStepM:maxFlatAnkleStep});
  assert.ok(minGap>-.0005,`${id} sole penetrated slope ${slope}: ${minGap}`);assert.ok(maxSupportGap<.002,`${id} support floated ${maxSupportGap}`);assert.ok(maxFlatAnkleStep<.001,`${id} flat support skated ${maxFlatAnkleStep}`);
  const frozen=root.getObjectByName('hips').getWorldPosition(new THREE.Vector3());for(let i=0;i<20;i++)instance.update(0);assert.ok(root.getObjectByName('hips').getWorldPosition(new THREE.Vector3()).distanceTo(frozen)<1e-6);instance.dispose();
 }
 console.log('MOTION_RUNTIME_PASS',id);
}catch(error){report.failures.push({id,error:error.message});console.error('MOTION_RUNTIME_FAIL',id,error.message);}
await writeFile(join(directory,'runtime-verification.json'),JSON.stringify(report,null,2)+'\n');if(report.failures.length)process.exitCode=1;
