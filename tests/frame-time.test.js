import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {frameStepSeconds,frameSimulationSteps} from '../src/frame-time.js';
import {createHistoricalScene} from '../src/historical-scenes.js';
import {createWalkControls} from '../src/walk-controls.js';
const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});
globalThis.document=Object.assign(new EventTarget(),{createElement:()=>({getContext:()=>ctx}),querySelector:()=>null,activeElement:null});
globalThis.window=new EventTarget();
test('1, 4 and 10 FPS retain real walking speed through the crowded Herod stair approach',()=>{
 const results=[];
 for(const fps of [60,10,4,1]){
  const scene=createHistoricalScene('herod'),npc=scene.npcSystem,canvas=Object.assign(new EventTarget(),{focus(){}});
  const walk=createWalkControls(new THREE.PerspectiveCamera(),canvas,{constrainMove:(a,b)=>npc.constrainPlayer(a,b),navigationObstacles:()=>npc.agents.map(a=>({position:a.actor.state.position,radius:a.radius+.32+.07}))});
  walk.start(scene.walkModel,npc.safePlayerSpawn(scene.exploration.spawn));assert.ok(walk.navigate(scene.objects.find(o=>o.id==='herod-boundary').approach));
  let distance=0,last=1000,climbing=false;
  for(let frame=1;frame<=fps*20;frame++){
   const now=1000+frame*1000/fps,dt=frameStepSeconds(now,last);last=now;
   for(const step of frameSimulationSteps(dt)){
    npc.update(step,{player:walk.position});const before=[...walk.position];walk.update(step);
    distance+=Math.hypot(walk.position[0]-before[0],walk.position[2]-before[2]);
    assert.ok(walk.groundState.isGrounded);climbing ||=walk.groundState.isClimbingStairs;
    for(const a of npc.agents)assert.ok(Math.hypot(walk.position[0]-a.actor.state.position[0],walk.position[2]-a.actor.state.position[2])>=a.radius+.32+.02);
   }
  }
  assert.ok(climbing);assert.ok(distance>26&&distance<38);results.push(distance);
  // A suspended tab does not replay a ten-second jump through the stairway.
  const before=[...walk.position];for(const step of frameSimulationSteps(frameStepSeconds(last+10000,last)))walk.update(step);assert.ok(Math.hypot(walk.position[0]-before[0],walk.position[2]-before[2])<.5);
  walk.dispose();scene.dispose();
 }
 for(const distance of results.slice(1))assert.ok(Math.abs(distance-results[0])<1.5,JSON.stringify(results));
});

test('fractional callback times and tiny steps keep complete public routes active',()=>{
 for(const [id,options,objects]of [['letters',{segment:'reading',phase:'exchange'},['letters-reading']],['herod',{},['herod-boundary','herod-stone','herod-capital']]]){
  const scene=createHistoricalScene(id,null,options),npc=scene.npcSystem,canvas=Object.assign(new EventTarget(),{focus(){}}),messages=[];
  const walk=createWalkControls(new THREE.PerspectiveCamera(),canvas,{constrainMove:(a,b)=>npc.constrainPlayer(a,b),navigationObstacles:()=>npc.agents.map(a=>({position:a.actor.state.position,radius:a.radius+.32+.07})),onMessage:m=>messages.push(m)});
  walk.start(scene.walkModel,npc.safePlayerSpawn(scene.exploration.spawn));
  for(const objectId of objects){const destination=scene.objects.find(o=>o.id===objectId).approach;assert.ok(walk.navigate(destination));let last=1000;
   for(let frame=0;frame<16000&&Math.hypot(walk.position[0]-destination[0],walk.position[2]-destination[2])>.65;frame++){
    const now=last+(frame%17===0?.0003:frame%3===0?16.7:33.4);
    for(const step of frameSimulationSteps(frameStepSeconds(now,last)))walk.update(step);
    last=now;assert.ok(walk.groundState.isGrounded);
   }
   assert.ok(Math.hypot(walk.position[0]-destination[0],walk.position[2]-destination[2])<.65,objectId+' '+walk.position);
  }
  assert.deepEqual(messages,[]);walk.dispose();scene.dispose();
 }
});

test('separate visual commits preserve NPC behaviour and transforms across slow multi-step frames',()=>{
 const traditional=createHistoricalScene('jerusalem'),batched=createHistoricalScene('jerusalem'),camera=[20,9.7,0];
 const peopleTransforms=scene=>{const result=[];scene.scene.traverse(o=>{if(o.isInstancedMesh&&o.userData.people)result.push(Array.from(o.instanceMatrix.array));});return result;};
 for(let frame=0;frame<12;frame++){
  for(const step of frameSimulationSteps(.25)){traditional.animate(step,camera);batched.simulate(step,camera);}
  batched.pose(.25,camera);
 }
 assert.deepEqual(batched.npcSystem.agents.map(a=>[a.actor.state.position,a.actor.state.yaw,a.timer,a.state,a.poi?.id]),traditional.npcSystem.agents.map(a=>[a.actor.state.position,a.actor.state.yaw,a.timer,a.state,a.poi?.id]));
 assert.deepEqual(peopleTransforms(batched),peopleTransforms(traditional));traditional.dispose();batched.dispose();
});
