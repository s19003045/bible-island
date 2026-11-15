import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createWalkModel} from '../src/walk-model.js';
import {createCharacterController} from '../src/character-controller.js';
import {createWalkControls} from '../src/walk-controls.js';
import {createHistoricalScene} from '../src/historical-scenes.js';
import {walkSpawn} from '../src/walk-data.js';
const surfaces=[{x1:-8,x2:8,z1:-3,z2:3}];
const flat=(boxes=[],options={})=>createWalkModel(boxes,surfaces,()=>0,options);
const proxy={id:'fixture-flight',kind:'stairs',x1:0,x2:2,z1:-3,z2:3,axis:'x',start:0,end:2,baseHeight:0,rise:1,riserHeight:.25};
const ramp=()=>createWalkModel([],surfaces,x=>Math.max(0,Math.min(1,x*.5)),{proxies:[proxy]});
const context=new Proxy({},{get:()=>()=>{},set:()=>true});
globalThis.document=Object.assign(new EventTarget(),{createElement:()=>({getContext:()=>context}),querySelector:()=>null,activeElement:null,pointerLockElement:null});globalThis.window=new EventTarget();

test('step offset climbs a legal curb, rejects taller steps and never pops through a low ceiling',()=>{
  const curb={min:[0,-.2,-2],max:[3,.3,2]},model=flat([curb]);
  const end=model.move([-1,0,0],2,0);assert.ok(end[0]>.9);assert.equal(end[1],.3);
  const tall=flat([{...curb,max:[3,.36,2]}]).move([-1,0,0],2,0);assert.ok(tall[0]<=-.24+.001);assert.equal(tall[1],0);
  const lowCeiling=flat([curb,{min:[-2,1.75,-2],max:[3,2,2]}]).move([-1,0,0],2,0);assert.ok(lowCeiling[0]<=-.24+.001);assert.equal(lowCeiling[1],0);
  const configured=flat([curb],{maxStepHeight:.25}).move([-1,0,0],2,0);assert.ok(configured[0]<0,'the configured step offset must be enforced');
  const proxyLimited=createWalkModel([],surfaces,x=>Math.max(0,Math.min(1,x*.5)),{proxies:[proxy],maxStepHeight:.2}).move([-.5,0,0],2,0);assert.ok(proxyLimited[0]<.001,'a ramp proxy cannot bypass its authored riser height limit');
});

test('slope limit uses the ground normal and rejects steep ramps even in tiny movement increments',()=>{
  for(const angle of [30,44,46,60]) {
    const model=createWalkModel([],surfaces,x=>Math.max(0,x)*Math.tan(angle*Math.PI/180));
    let p=[-.5,0,0];for(let i=0;i<150;i++)p=model.move(p,.02,0);
    if(angle<45){assert.ok(p[0]>2);const ground=model.sampleGround(p[0],0,p[1]);assert.ok(Math.abs(ground.slopeAngle-angle)<.0001);assert.ok(Math.abs(Math.hypot(...ground.normal)-1)<.00001);}
    else assert.ok(p[0]<=.001,`${angle} degree ramp cannot be climbed by small steps`);
  }
});

test('ground snap holds feet to stairs while descending, with correct up/down gait and bounded visual lag',()=>{
  const model=ramp(),c=createCharacterController(model);c.reset([-.4,0,0]);let climbed=false,descended=false,snapped=false,maxLag=0,last=c.visualPosition[1];
  for(const direction of [1,-1])for(let i=0;i<180;i++) {
    c.update(1/60,direction*.017,0);
    const p=c.position,g=model.sampleGround(p[0],p[2],p[1]);assert.ok(c.state.isGrounded);assert.ok(Math.abs(p[1]-g.height)<.00001);
    maxLag=Math.max(maxLag,Math.abs(c.visualPosition[1]-p[1]));assert.ok(Math.abs(c.visualPosition[1]-last)<.035,'no camera height spikes');last=c.visualPosition[1];
    climbed ||=c.state.animation==='stairs-up';descended ||=c.state.animation==='stairs-down';snapped ||=c.state.groundSnapApplied&&c.state.verticalVelocity<=-3;
  }
  assert.ok(climbed&&descended&&snapped);assert.ok(maxLag<.055,'descending must not visually hover above the flight');
});

test('an isolated curb is visually smoothed without moving the physical feet off their supporting surface',()=>{
  const model=flat([{min:[0,-.2,-2],max:[3,.3,2]}]),c=createCharacterController(model);c.reset([-.5,0,0]);let maxFrame=0,previous=0,stepped=false;
  for(let i=0;i<120;i++) {
    c.update(1/60,i<60?.02:0,0);const y=c.visualPosition[1];maxFrame=Math.max(maxFrame,Math.abs(y-previous));previous=y;
    assert.ok(c.state.isGrounded);assert.ok(Math.abs(c.position[1]-model.sampleGround(c.position[0],0,c.position[1]).height)<.00001);
    assert.ok(y>=-.0001&&y<=.30001,'spring must not overshoot');stepped ||=c.state.isClimbingStairs;
  }
  assert.ok(stepped);assert.ok(maxFrame<.07);assert.ok(Math.abs(c.visualPosition[1]-.3)<.0001);
});

test('uphill movement is 0.8x while the state and first-person camera use the separated visual root',()=>{
  const canvas=()=>Object.assign(new EventTarget(),{focus(){},setPointerCapture(){}}),camera=new THREE.PerspectiveCamera(),control=createWalkControls(camera,canvas());
  control.start(ramp(),[.5,.25,0]);control.setAxis(0,-1);control.update(.1);
  assert.ok(Math.abs(control.position[0]-.5-1.85*.8*.1)<.00001);assert.equal(control.groundState.speedFactor,.8);assert.equal(control.groundState.animation,'stairs-up');
  assert.ok(Math.abs(camera.position.y-control.groundState.visualY-1.65)<.00001);assert.ok(camera.position.y<control.position[1]+1.65);
  const before=control.position;control.block(true);for(let i=0;i<30;i++)control.update(1/60);assert.deepEqual(control.position,before);assert.ok(Math.abs(camera.position.y-before[1]-1.65)<.0001,'camera settles during dialogue');control.dispose();
});

test('visual smoothing is stable across frame rates and unsafe drops stop at the ledge',()=>{
  const results=[];
  for(const fps of [30,60,144]){const c=createCharacterController(ramp());c.reset([.1,.05,0]);for(let i=0;i<fps*2;i++)c.update(1/fps,1/fps,0);results.push(c.visualPosition[1]);assert.ok(Math.abs(c.position[0]-2.1)<.00001);}
  assert.ok(Math.max(...results)-Math.min(...results)<.01);
  const model=createWalkModel([],surfaces,x=>x<0?1:0),p=model.move([-.5,1,0],3,0);assert.ok(p[0]<0);assert.equal(p[1],1,'large drops are not mistaken for stairs');
});

test('the rendered Jerusalem stair has a connected ramp proxy and can be walked up and down repeatedly',()=>{
  const scene=createHistoricalScene('jerusalem',null),model=scene.walkModel;
  assert.equal(scene.scene.children.filter(o=>o.name.startsWith('entry-stair-tread-')).length,5);
  const route=model.path(walkSpawn,[21,9.225,7]);assert.ok(route.length>3,'stairs must connect to the existing street');
  const c=createCharacterController(model);c.reset(walkSpawn);let upstairs=false,downstairs=false;
  for(const points of [route,[...route].reverse()])for(const goal of points) {
    let guard=0;
    while(Math.hypot(goal[0]-c.position[0],goal[2]-c.position[2])>.08) {
      const p=c.position,dx=goal[0]-p[0],dz=goal[2]-p[2],d=Math.hypot(dx,dz),v=Math.min(d,1.85/60*c.speedFactor(dx,dz));c.update(1/60,dx/d*v,dz/d*v);
      assert.ok(c.state.isGrounded);assert.ok(++guard<250,'no stair snag');upstairs ||=c.state.animation==='stairs-up';downstairs ||=c.state.animation==='stairs-down';
    }
  }
  assert.ok(upstairs&&downstairs);assert.ok(Math.abs(c.position[1]-walkSpawn[1])<.001);scene.dispose();
});
