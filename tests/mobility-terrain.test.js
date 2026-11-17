import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createWalkModel} from '../src/walk-model.js';
import {createHistoricalScene} from '../src/historical-scenes.js';
import {createWalkControls} from '../src/walk-controls.js';
import {createCharacterController} from '../src/character-controller.js';
const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});
globalThis.document=Object.assign(new EventTarget(),{createElement:()=>({getContext:()=>ctx}),querySelector:()=>null,activeElement:null});globalThis.window=new EventTarget();
test('running and jumping retain continuous contact on real Herod stairs and all Sinai public slopes',()=>{
 for(const [id,segment] of [['herod',null],['sinai','manna'],['sinai','water'],['sinai','mountain']])for(const fps of [30,60,120]){
  const scene=createHistoricalScene(id,null,{segment}),npc=scene.npcSystem,canvas=Object.assign(new EventTarget(),{focus(){}}),walk=createWalkControls(new THREE.PerspectiveCamera(),canvas,{constrainMove:(a,b,f)=>f?.airborne?npc.constrainAirPlayer(a,b):npc.constrainPlayer(a,b),navigationObstacles:()=>npc.agents.map(a=>({position:a.actor.state.position,radius:a.radius+.32+.07}))});
  walk.start(scene.walkModel,npc.safePlayerSpawn(scene.exploration.spawn),{mobility:true});walk.toggleRun();
  const target=(id==='herod'?scene.objects.find(o=>o.id==='herod-boundary'):scene.objects[0]).approach;assert.ok(walk.navigate(target));let moved=0,previous=walk.position,stairs=false;
  for(let i=0;i<fps*120&&Math.hypot(walk.position[0]-target[0],walk.position[2]-target[2])>.65;i++){
   npc.update(1/fps,{player:walk.position});walk.update(1/fps);const p=walk.position,s=walk.groundState;moved+=Math.hypot(p[0]-previous[0],p[2]-previous[2]);previous=p;stairs ||=s.isClimbingStairs;
   assert.ok(s.isGrounded,id+' stays grounded');assert.ok(Math.abs(s.visualY-p[1])<.32,id+' camera height remains continuous');assert.ok(s.groundNormal[1]>Math.cos(Math.PI/4));
  }
  assert.ok(moved>2,id+' really moves');assert.ok(Math.hypot(walk.position[0]-target[0],walk.position[2]-target[2])<.65,id+' reaches public object: '+JSON.stringify({position:walk.position,target,navigating:walk.navigating}));if(id==='herod')assert.ok(stairs);
  walk.jump();let rose=false,landed=false;for(let i=0;i<fps*2;i++){walk.update(1/fps);rose ||=walk.groundState.jumpPhase==='rising';landed ||=walk.groundState.landed;}
  assert.ok(rose&&landed,id+' jumps and lands');assert.equal(walk.groundState.isGrounded,true);assert.ok(Math.abs(walk.groundState.visualY-walk.position[1])<.001);walk.dispose();scene.dispose();
 }
});
test('jumping cannot bypass a steeper-than-45-degree ground limit or authored observation boundary',()=>{
 const model=createWalkModel([],[{x1:-5,x2:5,z1:-5,z2:5}],(x,z)=>x>0?x*2:0,{proxies:[]}),motor=createCharacterController(model,{config:{jumpEnabled:true}});motor.reset([-1,0,0]);motor.jump();
 for(let i=0;i<300;i++)motor.update(1/120,.03,0);assert.ok(motor.position[0]<.04);assert.equal(motor.state.isGrounded,true);
 motor.reset([-4,0,0]);motor.jump();for(let i=0;i<300;i++)motor.update(1/120,-.03,0);assert.ok(motor.position[0]>=-4.76);assert.equal(motor.state.isGrounded,true);
});
