import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from 'three';
import {geometryLoader} from './helpers/load-gltf-geometry.js';
import {humanRolloutAssets} from '../src/human-rollout-assets.js';
import {createResidentInstance} from '../src/blender-assets.js';
import {createArmPosture} from '../src/human-arm-posture.js';

async function asset(d){const b=await readFile(new URL('../public/'+d.src,import.meta.url));return geometryLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');}
const position=b=>b.getWorldPosition(new THREE.Vector3()),rotation=b=>b.getWorldQuaternion(new THREE.Quaternion());

// Select real thumb-surface vertices in the unposed source. Unlike the runtime
// palm diagnostic, this check cannot pass merely because its assumed normal is
// wrong in the same way as the implementation. These rigs author the thumb on
// the medial side of the neutral hand; it must point FORWARD after relaxation.
function thumbPoints(root,side,height){
 root.updateMatrixWorld(true);
 const wrist=position(root.getObjectByName('hand'+side)),sign=Math.sign(wrist.x),points=[];
 root.traverse(mesh=>{
  if(!mesh.isSkinnedMesh||mesh.material.name!=='skin')return;
  const {position:p,skinIndex:si,skinWeight:sw}=mesh.geometry.attributes;
  for(let i=0;i<p.count;i++){
   if(![0,1,2,3].some(k=>mesh.skeleton.bones[si.getComponent(i,k)].name==='hand'+side&&sw.getComponent(i,k)>.99))continue;
   const vertex=mesh.localToWorld(mesh.getVertexPosition(i,new THREE.Vector3()));
   if((wrist.x-vertex.x)*sign>.041*height/1.71&&vertex.y<wrist.y&&vertex.y>wrist.y-.13*height/1.71)points.push([mesh,i]);
  }
 });
 return points;
}

test('actual left and right thumb surfaces point forward, not backward, in every relaxed wardrobe rig',async()=>{
 for(const [id,d] of Object.entries(humanRolloutAssets)){
  const gltf=await asset(d),a={id,modelId:id,scale:d.height/1.7,state:{position:[0,0,0],yaw:0,time:0,stride:0,walkDistance:0,visible:true}};
  const instance=createResidentInstance(gltf,a),root=instance.root;
  const sides=d.motionProfile==='carrier'||d.motionProfile==='bearer'?['L']:['L','R'];
  const samples=Object.fromEntries(sides.map(side=>[side,thumbPoints(root,side,d.height)]));
  for(const yaw of [0,Math.PI/2,Math.PI]){
   a.state.yaw=yaw;for(let f=0;f<30;f++){a.state.time+=1/60;instance.update(1/60);}
   for(const side of sides){
    assert.ok(samples[side].length>=8,id+' actual thumb samples '+side);
    const wrist=root.getObjectByName('hand'+side),long=new THREE.Vector3(0,1,0).applyQuaternion(rotation(wrist));
    const centroid=samples[side].reduce((sum,[mesh,i])=>sum.add(mesh.localToWorld(mesh.getVertexPosition(i,new THREE.Vector3()))),new THREE.Vector3()).divideScalar(samples[side].length);
    const thumb=centroid.sub(position(wrist));thumb.addScaledVector(long,-thumb.dot(long));
    const forward=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw));
    assert.ok(thumb.dot(forward)>.02*d.height/1.71,`${id} ${side} thumb faces backwards: ${thumb.dot(forward)}`);
   }
  }
  instance.dispose();
 }
});

test('all 28 actual rigs have inward relaxed palms, aligned wrists and continuous walk / talk / idle transitions at near and distant detail',async()=>{
 for(const [id,d] of Object.entries(humanRolloutAssets)){
  const gltf=await asset(d),a={id,modelId:id,scale:d.height/1.7,state:{position:[0,0,0],yaw:0,time:0,stride:0,walkDistance:0,visible:true}};
  const instance=createResidentInstance(gltf,a),root=instance.root,previous=new Map();
  for(let f=0;f<240;f++){
   const moving=f>=60&&f<120;a.state.time=f/60;a.state.talking=f>=135&&f<195;
   if(moving){a.state.walkDistance+=d.cycleDistance/d.walkDuration/60;a.state.position[2]=a.state.walkDistance;}
   const originalPosition=[...a.state.position];instance.update(1/60,{detailed:f%90<60});
   assert.deepEqual(a.state.position,originalPosition,'visual correction does not move controller');
   const report=root.userData.armPosture;assert.ok(report,id+' uses common correction');
   for(const side of report.freeSides){
    const hand=root.getObjectByName('hand'+side),forearm=root.getObjectByName('forearm'+side),direction=position(hand).sub(position(forearm)).normalize();
    const fingerDirection=new THREE.Vector3(0,1,0).applyQuaternion(rotation(hand));
    assert.ok(direction.angleTo(fingerDirection)<.45,id+' wrist stays within 26 degrees including transitions');
    const old=previous.get(side),current=hand.quaternion.clone();if(old)assert.ok(old.angleTo(current)<.40,id+' no abrupt wrist flip');previous.set(side,current);
    if(f===50){const palm=report.hands.find(h=>h.side===side).palm;assert.ok(palm[0]*(side==='L'?1:-1)>.85,id+' palm faces own thigh');}
   }
  }
  instance.dispose();
 }
});

test('carrier and bearer contact arm chains are untouched by free-arm adaptation',async()=>{
 for(const id of ['human-resident-carrier','human-priest-bearer']){
  const gltf=await asset(humanRolloutAssets[id]),root=gltf.scene,adapt=createArmPosture(root,humanRolloutAssets[id]);
  const names=['armR','forearmR','handR'],before=names.map(n=>root.getObjectByName(n).quaternion.clone());
  for(let f=0;f<60;f++)adapt(1/60,{clip:f<30?'Idle':'Talk'});
  for(let i=0;i<names.length;i++)assert.deepEqual(root.getObjectByName(names[i]).quaternion.toArray(),before[i].toArray(),id+' preserves '+names[i]);
 }
 assert.equal(createArmPosture(new THREE.Group(),{motionVersion:4}),null,'authored life IK is not overwritten');
});
