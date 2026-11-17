import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createWalkModel} from '../src/walk-model.js';
import {createCharacterController} from '../src/character-controller.js';
import {createWalkControls} from '../src/walk-controls.js';
import {createHistoricalScene} from '../src/historical-scenes.js';
const surfaces=[{x1:-30,x2:30,z1:-30,z2:30}];
const flat=boxes=>createWalkModel(boxes,surfaces,()=>0);
const motor=boxes=>{const c=createCharacterController(flat(boxes),{config:{jumpEnabled:true}});c.reset([-1,0,0]);return c;};

test('ballistic jump reaches 0.6m and lands without ground snapping or lingering in air at 30/60/120FPS',()=>{
  for(const fps of [30,60,120]){
    const c=motor([]);c.jump();let apex=0,air=false,landed=false;
    for(let i=0;i<fps*2;i++){c.update(1/fps);apex=Math.max(apex,c.position[1]);if(!c.state.isGrounded){air=true;assert.equal(c.state.groundSnapApplied,false);}landed ||=c.state.landed;}
    assert.ok(apex>.595&&apex<=.60001,`${fps}: ${apex}`);assert.ok(air&&landed);assert.equal(c.position[1],0);assert.equal(c.visualPosition[1],0);assert.equal(c.state.isGrounded,true);
  }
});

test('jump crosses a 0.48m barrier, rejects a high wall and safely steps/falls off its top',()=>{
  for(const height of [.48,2]){
    const c=motor([{min:[0,0,-6],max:[.28,height,6]}]);c.jump();let above=false;
    for(let i=0;i<150;i++){c.update(1/120,2.2/120,0);above ||=c.position[1]>.48;}
    assert.ok(above);if(height<1){assert.ok(c.position[0]>1,JSON.stringify(c.position));assert.ok(Math.abs(c.position[1])<1e-6);}else {assert.ok(c.position[0]<-.23);assert.equal(c.position[1],0);}
  }
});

test('swept head collision cancels ascent and buffered input may jump after touchdown',()=>{
  const c=motor([{min:[-6,2.02,-6],max:[6,2.2,6]}]);c.jump();let apex=0;
  for(let i=0;i<120;i++){c.update(1/120);apex=Math.max(apex,c.position[1]);assert.ok(c.position[1]+1.7<=2.021);}
  assert.ok(apex>.25&&apex<.34);assert.equal(c.position[1],0);
  const b=motor([]);b.jump();let buffered=false,rebounded=false;
  for(let i=0;i<150;i++){if(!buffered&&b.state.verticalVelocity<0&&b.position[1]<.1){b.jump();buffered=true;}b.update(1/120);if(buffered&&b.state.verticalVelocity>2)rebounded=true;}
  assert.ok(buffered&&rebounded);
});

test('fast run has acceleration, normalized diagonal input and immediate dialogue/explicit stop',()=>{
  globalThis.document=Object.assign(new EventTarget(),{activeElement:null,querySelector:()=>null});globalThis.window=new EventTarget();
  const canvas=()=>Object.assign(new EventTarget(),{focus(){}});
  function distance(run,axis=[0,1]){const c=createWalkControls(new THREE.PerspectiveCamera(),canvas());c.start(flat([]),[15,0,0],{mobility:true});if(run)c.toggleRun();c.setAxis(...axis);const start=c.position;for(let i=0;i<180;i++)c.update(1/60);const d=Math.hypot(c.position[0]-start[0],c.position[2]-start[2]);assert.ok(c.groundState.speed<4.501);c.block(true);const p=c.position;c.update(.2);assert.deepEqual(c.position,p);c.dispose();return d;}
  const walk=distance(false),run=distance(true),diagonal=distance(true,[1,1]);assert.ok(run>walk*1.8);assert.ok(Math.abs(run-diagonal)<.01);
});

test('actual Jerusalem yard has a visible floor and barrier; jump enters and exits without crossing the public perimeter',()=>{
  const context=new Proxy({},{get:()=>()=>{},set:()=>true});
  globalThis.document=Object.assign(new EventTarget(),{createElement:()=>({getContext:()=>context})});
  const scene=createHistoricalScene('jerusalem',null),model=scene.walkModel;
  assert.ok(scene.scene.getObjectByName('public-yard-ground'));assert.ok(scene.scene.getObjectByName('public-yard-low-entry'));
  const npc=scene.npcSystem;
  const c=createCharacterController(model,{config:{jumpEnabled:true},constrainMove:(a,b,f)=>f?.airborne?npc.constrainAirPlayer(a,b):npc.constrainPlayer(a,b)});c.reset([21,8.025,-1.1]);
  const approach=model.move(c.position,0,-3);assert.ok(approach[2]>-2.5,'ordinary walking stops at the higher-than-step entry');c.reset(approach);
  c.jump();for(let i=0;i<180;i++)c.update(1/120,.003,-2.2/120);
  assert.ok(c.position[2]<-4,JSON.stringify(c.position));assert.equal(c.state.isGrounded,true);assert.ok(Math.abs(c.position[1]-8.025)<.001,'angled motion leaves the low wall and lands on the yard floor');
  for(let i=0;i<300;i++)c.update(1/120,0,2.2/120);
  c.jump();for(let i=0;i<180;i++)c.update(1/120,0,2.2/120);
  assert.ok(c.position[2]>-2.2,JSON.stringify(c.position));assert.equal(c.state.isGrounded,true);
  c.reset([21,8.025,-5]);for(let i=0;i<300;i++){if(i%90===0)c.jump();c.update(1/120,.04,0);}
  assert.ok(c.position[0]<25,'the high side wall and authored bounds remain solid');scene.dispose();
});
