import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {blenderModels} from '../src/blender-manifest.js';
import {createResidentInstance,selectDetailedResidents} from '../src/blender-assets.js';
import {createMotionCourse,motionScenarios} from '../src/motion-course.js';
import {createHumanLocomotion} from '../src/human-locomotion.js';
import {humanMotionProfiles} from '../src/human-motion-data.js';
import {humanSteering,turnHumanBody} from '../src/human-navigation.js';

const cache=new Map();
async function asset(role){if(!cache.has(role)){const b=await readFile(new URL('../public/models/jerusalem-pilot/'+role+'.glb',import.meta.url));cache.set(role,await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),''));}return cache.get(role);}
function person(role='resident'){const d=blenderModels['jerusalem-'+role];return {id:'audit-'+role,modelId:'jerusalem-'+role,motionProfile:role,scale:d.height/1.7,state:{position:[0,0,0],yaw:0,time:0,stride:1,walkDistance:0,visible:true,idleAction:'Idle'}};}
function footPoints(root,side){
 const points=[];root.traverse(mesh=>{if(!mesh.isSkinnedMesh)return;const foot=root.getObjectByName('foot'+side),indices=new Set(mesh.skeleton.bones.map((b,i)=>{while(b&&b!==foot)b=b.parent;return b===foot?i:-1;}).filter(i=>i>=0)),{position,skinIndex,skinWeight}=mesh.geometry.attributes;
 for(let i=0;i<position.count;i++){let total=0;for(let k=0;k<4;k++)if(indices.has(skinIndex.getComponent(i,k)))total+=skinWeight.getComponent(i,k);if(total>.999)points.push([mesh,i]);}});return points;
}
function sample(root,points){root.updateMatrixWorld(true);return points.map(([m,i])=>m.localToWorld(m.getVertexPosition(i,new THREE.Vector3())));}

test('pilot rigs have actual weighted spine, clavicle, toe, eye and articulated free fingers, sourced from distinct real captures',async()=>{
 for(const role of ['resident','carrier','elder']){
  const gltf=await asset(role),weighted=new Set();gltf.scene.traverse(m=>{if(!m.isSkinnedMesh)return;const {skinIndex,skinWeight}=m.geometry.attributes;for(let i=0;i<skinIndex.count;i++)for(let k=0;k<4;k++)if(skinWeight.getComponent(i,k)>.001)weighted.add(m.skeleton.bones[skinIndex.getComponent(i,k)].name);});
  for(const name of ['spine','spineUpper','chest','clavicleL','clavicleR','toeL','toeR','eyeL','eyeR','lidL','fingerL0A','fingerL0B'])assert.ok(weighted.has(name),role+' weighted '+name);
  const d=blenderModels['jerusalem-'+role];assert.equal(d.motionVersion,3);assert.match(d.motionSource,role==='elder'?/07_04/:/07_01/);
  const walk=gltf.animations.find(c=>c.name==='Walk');assert.ok(Math.abs(walk.duration-d.walkDuration)<.0001);assert.ok(walk.tracks.some(t=>t.name.startsWith('toeL.')));
 }
});

test('three pilot gaits keep complete deforming toes above flat and both slope directions',async()=>{
 for(const role of ['resident','carrier','elder'])for(const slope of [0,.25,-.25]){
  const actor=person(role),d=blenderModels[actor.modelId],ground=(_x,z)=>slope*z,instance=createResidentInstance(await asset(role),actor,0,{groundAt:ground}),root=instance.root,feet=['L','R'].map(s=>footPoints(root,s));assert.ok(feet.every(p=>p.length>30));
  const locomotion=createHumanLocomotion(person(role),d);let supported=0;
  for(let i=0;i<=140;i++){
   const z=i*d.cycleDistance/120;actor.state.position=[0,ground(0,z),z];actor.state.walkDistance=z;actor.state.time=i*d.walkDuration/120;instance.update(i?d.walkDuration/120:0);
   for(let j=0;j<2;j++){
    const gaps=sample(root,feet[j]).map(p=>p.y-ground(p.x,p.z)),low=Math.min(...gaps),phase=root.userData.gaitPhase,contact=locomotion.contact('Walk',phase*d.walkDuration,j?'R':'L',phase);
    assert.ok(low>-.001,`${role} slope${slope} frame${i} full toe penetration ${low}`);
    if(contact!=='swing'){supported++;assert.ok(low<.003,`${role} ${contact} support gap ${low}`);}
   }
  }
  assert.ok(supported>100);instance.dispose();
 }
});

test('all six comparison courses use real POIs and preserve turning clearance, stair descent and personal space',()=>{
 for(const scenario of Object.keys(motionScenarios)){
  const actor=person(),course=createMotionCourse(actor,scenario);let maxY=0,maxX=0,minGap=Infinity,talk=0,maxFrameTurn=0,descended=false;
  for(let i=0;i<3600;i++){const yaw=actor.state.yaw;course.update(1/60);const p=actor.state.position;maxY=Math.max(maxY,p[1]);if(maxY===.54&&p[1]<.01)descended=true;maxX=Math.max(maxX,Math.abs(p[0]));maxFrameTurn=Math.max(maxFrameTurn,Math.abs(actor.state.yaw-yaw));if(actor.state.talking)talk++;if(course.extra)minGap=Math.min(minGap,Math.hypot(p[0]-course.extra.state.position[0],p[2]-course.extra.state.position[2]));}
  assert.equal(course.system.agents[0].visits.size,2,scenario+' reaches both POIs');assert.ok(maxFrameTurn<.04,scenario+' smooth heading');
  if(scenario==='stairs'){assert.equal(maxY,.54);assert.ok(descended,'descends again after reaching upper landing');}
  if(scenario==='curve')assert.ok(maxX>1.1,'actually rounds collision box');
  if(scenario==='avoid')assert.ok(minGap>=course.system.agents.reduce((n,a)=>n+a.radius,.025)-.00001,'actual swept separation');
  if(scenario==='talk')assert.ok(talk>600,'sustained conversation hold');course.dispose();
 }
});

test('a reversal brakes immediately and distance matching stays bounded without modifying the controller',()=>{
 const actor=person(),agent={actor,humanProfile:humanMotionProfiles.resident,velocity:[0,1],speed:1,desiredYaw:0};
 const velocity=humanSteering(agent,0,-1,1/60);assert.ok(velocity[1]<1&&velocity[1]>0);turnHumanBody(agent,1/60);assert.ok(Math.abs(actor.state.yaw)<.03);
 for(const speed of [.6,1.1,1.6]){
  const a=person(),d=blenderModels[a.modelId],observer=createHumanLocomotion(a,d);observer.update(0);let motion;
  for(let i=0;i<240;i++){a.state.position[2]+=speed/60;a.state.walkDistance+=speed/60;a.state.time+=1/60;const snapshot=JSON.stringify(a.state);motion=observer.update(1/60);assert.equal(JSON.stringify(a.state),snapshot);}
  assert.equal(motion.clip,'Walk');assert.ok(motion.strideScale>=.8&&motion.strideScale<=1.14);const phase=motion.phase;assert.equal(observer.update(0).phase,phase);
 }
});

test('attention, cloth and blink freeze with time and never consume behaviour randomness or move the motor',async()=>{
 const actor=person(),course=createMotionCourse(actor,'talk'),instance=createResidentInstance(await asset('resident'),actor);let draws=0;actor.state.behavior.random=()=>{draws++;return .5;};
 actor.state.talking=true;
 for(let i=0;i<90;i++){actor.state.time+=1/60;instance.update(1/60,{camera:[2,1.6,2]});}
 assert.equal(draws,0);const snapshot=JSON.stringify(actor.state.position),info={...instance.root.userData.humanPerformance};assert.equal(info.attention,'交談對象');assert.ok(info.headYaw>0);assert.ok(Math.abs(info.cloth)<=humanMotionProfiles.resident.clothResponse);
 const head=instance.root.getObjectByName('head').quaternion.toArray();for(let i=0;i<30;i++)instance.update(0,{camera:[2,1.6,2]});assert.equal(JSON.stringify(actor.state.position),snapshot);assert.deepEqual(instance.root.getObjectByName('head').quaternion.toArray(),head);assert.deepEqual(instance.root.userData.humanPerformance,info);instance.dispose();course.dispose();
});

test('visible nearby pilots get detailed foot solving with the existing eight-person cap',()=>{
 const actors=Array.from({length:12},(_,i)=>({id:'crowd-'+i,scale:1,state:{position:[1,0,2+i*.1],visible:true}})),pilot=person();pilot.state.position=[0,0,8];actors.push(pilot);
 const chosen=selectDetailedResidents(actors,[0,1.6,0],new Set(),8,{viewDirection:[0,0,1]});assert.equal(chosen.length,8);assert.ok(chosen.includes(pilot));
});

test('actual carrier holds the jug through interruption, curved starts, stops and conversation without foot penetration',async()=>{
 const actor=person('carrier'),course=createMotionCourse(actor,'talk'),instance=createResidentInstance(await asset('carrier'),actor,0,{groundAt:course.footFloor}),root=instance.root,feet=['L','R'].map(s=>footPoints(root,s)),handle=[],fingers=[[],[],[],[]];
 root.traverse(m=>{if(!m.isSkinnedMesh)return;const list=m.name.startsWith('carried-jug-handle')?handle:fingers.find((_,i)=>m.name.startsWith('curled-grip-finger-'+i));if(list)for(let i=0;i<m.geometry.attributes.position.count;i++)list.push([m,i]);});assert.ok(handle.length&&fingers.every(f=>f.length));
 const actions=new Set();
 for(let i=0;i<1800;i++){
  course.update(1/60);instance.update(1/60,{camera:[1.5,1.6,0]});actions.add(root.userData.locomotion);
  if(i%12)continue;
  for(const foot of feet){const low=Math.min(...sample(root,foot).map(p=>p.y));assert.ok(low>-.001,'transition complete-foot penetration '+low);}
  const handles=sample(root,handle);for(const finger of fingers){const gap=Math.min(...sample(root,finger).map(p=>Math.min(...handles.map(h=>h.distanceTo(p)))));assert.ok(gap<.021,'carrier grip gap '+gap);}
 }
 // Also interrupt a moving clip with a straight, non-talking stop; POI arrivals
 // can legitimately enter a planted turn instead of the separate stop clip.
 actor.state.talking=false;
 for(let i=0;i<60;i++){actor.state.time+=1/60;actor.state.position[2]+=.8/60;actor.state.walkDistance+=.8/60;instance.update(1/60);}
 actor.state.time+=1/60;instance.update(1/60);actions.add(root.userData.locomotion);
 for(const action of ['StartWalk','Walk','StopWalk','Talk'])assert.ok(actions.has(action),'course exercises '+action);instance.dispose();course.dispose();
});
