import test from 'node:test';
import assert from 'node:assert/strict';
import {createLifeLocomotion,timeForProgress} from '../src/human-life-locomotion.js';

// Numerical controller fixture; exported-asset geometry is a separate gate.
function fixture(){
  const contacts={L:[[0,.4,'flat'],[.4,1,'swing']],R:[[0,.5,'swing'],[.5,1,'flat']]};
  const clips=Object.fromEntries(['Idle','Walk','StairUp','StairDown','Talk','Listen','Fill','Interact','LookAround'].map(name=>[name,{duration:1,distance:1,loop:true,contacts}]));
  for(const [side,phase] of [['L',.14],['R',.64]]){
    clips['StartWalk'+side]={duration:.8,distance:.25,entryPhase:phase,exitPhase:phase,progress:[[0,0],[.2,0],[1,1]],contacts};
    clips['StopWalk'+side]={duration:.9,distance:.35,entryPhase:phase,progress:[[0,0],[.5,.75],[1,1]],contacts};
  }
  for(const side of ['Left','Right'])for(const degrees of [45,90,180])clips[`Turn${side}${degrees}`]={duration:1.4,angularProgress:[[0,0],[.2,0],[.8,1],[1,1]],contacts};
  const actor={visualMotion:{phase:.14},state:{position:[0,0,0],yaw:0,time:0,walkDistance:0,animationSpeed:1,behavior:{state:'travel',startAge:0,motionIntent:{remaining:5,slope:0}}}};
  const observer=createLifeLocomotion(actor,{cycleDistance:1,lifeClips:clips});
  const step=(distance,dt=1/60)=>{actor.state.position[2]+=distance;actor.state.walkDistance+=distance;actor.state.time+=dt;actor.state.behavior.startAge+=dt;const snapshot=JSON.stringify(actor.state);const result=observer.update(dt);assert.equal(JSON.stringify(actor.state),snapshot,'visual observer must not move the motor or tick AI');return result;};
  return {actor,observer,step};
}

test('baked displacement inversion preserves anticipation plateau and monotonic progress',()=>{
  const samples=[[0,0],[.2,0],[.6,.7],[1,1]];assert.equal(timeForProgress(samples,0),0);
  let previous=-1;for(let i=0;i<=100;i++){const t=timeForProgress(samples,i/100);assert.ok(t>=previous&&t<=1);previous=t;}
  assert.ok(timeForProgress(samples,.01)>.2);assert.equal(timeForProgress(samples,.7),.6);
});

test('start transfers weight without translation, stop plays while the collision motor is still approaching',()=>{
  const {actor,step,observer}=fixture();
  let motion=step(0);assert.equal(motion.clip,'StartWalkL');assert.ok(motion.time>0);assert.deepEqual(actor.state.position,[0,0,0]);
  for(let i=0;i<60;i++)motion=step(1/60);
  assert.equal(motion.clip,'Walk');
  actor.state.behavior.motionIntent.remaining=.3;motion=step(.01);assert.match(motion.clip,/^StopWalk[LR]$/);assert.ok(motion.time>0&&motion.time<.9);
  const time=motion.time;actor.state.behavior.motionIntent.remaining=.12;motion=step(.01);assert.ok(motion.time>time);
  actor.state.behavior.state='rest';for(let i=0;i<60;i++)motion=step(0);assert.equal(motion.clip,'Idle');
  const frozen=observer.update(0);assert.deepEqual(observer.update(0),frozen);
});

test('work progress stays exact through a dialogue interruption and listening differs from speaking',()=>{
  const {actor,step}=fixture();actor.state.activity={clip:'Fill',progress:.43,aligning:false,paused:true};actor.state.talking=true;
  let motion=step(0);assert.equal(motion.clip,'Fill');assert.equal(motion.time,.43);
  for(let i=0;i<90;i++){motion=step(0);assert.equal(motion.time,.43);}
  delete actor.state.activity;actor.state.dialogueCue={mode:'listening'};assert.equal(step(0).clip,'Listen');
  actor.state.dialogueCue.mode='speaking';assert.equal(step(0).clip,'Talk');
});

test('actual slope direction selects up/down clips, and a large stationary turn uses a stepped half-turn',()=>{
  const {actor,step}=fixture();for(let i=0;i<60;i++)step(1/60);
  actor.state.behavior.motionIntent.slope=.25;assert.equal(step(.02).clip,'StairUp');
  actor.state.behavior.motionIntent.slope=-.25;assert.equal(step(.02).clip,'StairDown');
  actor.state.behavior.desiredYaw=Math.PI;actor.state.yaw=.02;const motion=step(0);assert.equal(motion.clip,'TurnRight180');assert.ok(motion.time>0);
});
