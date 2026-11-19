import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {solveHandContact,createHandContacts} from '../src/human-hand-contact.js';
import {createPoseOverlay} from '../src/human-pose-overlay.js';

function fixture(){
  const root=new THREE.Group();root.position.set(7,3,-4);root.rotation.y=.7;root.scale.setScalar(.93);
  const bone=(name,parent,position)=>{const b=new THREE.Bone();b.name=name;b.position.fromArray(position);parent.add(b);return b;};
  const hips=bone('hips',root,[0,1,0]),arm=bone('armR',hips,[-.2,.4,0]);
  const forearm=bone('forearmR',arm,[-.04,-.26,.09]),hand=bone('handR',forearm,[.01,-.20,.15]);
  hand.rotation.set(.15,.5,.08);
  const grip=bone('handGripR',hand,[.01,-.05,.025]);grip.rotation.set(.1,.4,0);
  root.updateMatrixWorld(true);
  const target=bone('jugGripR',root,root.worldToLocal(grip.getWorldPosition(new THREE.Vector3())).toArray());
  target.quaternion.copy(root.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(grip.getWorldQuaternion(new THREE.Quaternion())));
  root.updateMatrixWorld(true);
  return {root,hips,arm,forearm,hand,grip,target,contact:{side:'R',handSocket:'handGripR',targetSocket:'jugGripR'}};
}

test('post-grounding arm solve restores actual transformed grip without lifting the grounded prop or collision root',()=>{
  const {root,hips,grip,target,contact}=fixture(),position=root.position.clone(),rotation=root.quaternion.clone(),prop=target.matrixWorld.clone();
  hips.position.y-=.10;root.updateMatrixWorld(true);
  assert.ok(grip.getWorldPosition(new THREE.Vector3()).distanceTo(target.getWorldPosition(new THREE.Vector3()))>.09);
  const result=solveHandContact(root,contact);
  assert.ok(result.error<1e-6);assert.equal(result.reachable,true);
  assert.ok(grip.getWorldQuaternion(new THREE.Quaternion()).angleTo(target.getWorldQuaternion(new THREE.Quaternion()))<1e-6);
  assert.deepEqual(root.position,position);assert.deepEqual(root.quaternion.toArray(),rotation.toArray());assert.deepEqual(target.matrixWorld,prop);
  assert.ok(result.elbowAngle<Math.PI-.05,'elbow must not lock straight');
});

test('unreachable contact stays finite, preserves bone lengths and reports error rather than dragging a prop',()=>{
  const {root,arm,forearm,hand,target,contact}=fixture();target.position.x-=3;root.updateMatrixWorld(true);
  const lengths=[arm.position.length(),forearm.position.length(),hand.position.length()],prop=target.position.clone();
  const result=solveHandContact(root,contact);
  assert.equal(result.reachable,false);assert.ok(result.error>2);
  assert.deepEqual([arm.position.length(),forearm.position.length(),hand.position.length()],lengths);assert.deepEqual(target.position,prop);
  for(const bone of [arm,forearm,hand])assert.ok(bone.quaternion.toArray().every(Number.isFinite));
});

test('contact windows release the hand outside the authored grip interval and support paused exact-pose correction',()=>{
  const {root,hips,hand,contact}=fixture();hips.position.y-=.05;
  const update=createHandContacts(root,{lifeClips:{Fill:{duration:4}},handContacts:{Fill:[{...contact,window:[.25,.75]}]}});
  const original=hand.quaternion.clone();assert.deepEqual(update({clip:'Fill',time:0}),[]);assert.deepEqual(hand.quaternion.toArray(),original.toArray());
  assert.ok(update({clip:'Fill',time:2})[0].error<1e-6);
  const held=hand.quaternion.clone();assert.ok(update({clip:'Fill',time:2})[0].error<1e-6);assert.ok(hand.quaternion.angleTo(held)<1e-6);
  assert.deepEqual(update({clip:'Fill',time:4}),[]);
});

test('carrying overlays preserve planted hips and root even if an author mistakenly includes their tracks in the mask',()=>{
  const {root,hips,hand}=fixture();root.name='root';
  const clip=new THREE.AnimationClip('CarrySmall',1,[
    new THREE.VectorKeyframeTrack('root.position',[0,1],[0,0,0,50,20,30]),
    new THREE.VectorKeyframeTrack('hips.position',[0,1],[0,0,0,0,5,0]),
    new THREE.QuaternionKeyframeTrack('handR.quaternion',[0,1],[0,0,0,1,0,Math.sin(.2),0,Math.cos(.2)]),
  ]);
  const base=root.position.clone(),hip=hips.position.clone(),pose=createPoseOverlay(root,clip,['root','hips','handR']);
  pose(.5);assert.deepEqual(root.position,base);assert.deepEqual(hips.position,hip);assert.ok(Math.abs(hand.quaternion.y-Math.sin(.1))<1e-6);
  hand.quaternion.identity();pose(.5);assert.ok(Math.abs(hand.quaternion.y-Math.sin(.1))<1e-6,'same-time sampling must overwrite the restored base pose');
});
