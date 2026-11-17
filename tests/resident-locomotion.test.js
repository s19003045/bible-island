import test from 'node:test';
import assert from 'node:assert/strict';
import {createResidentLocomotion,residentFootContact} from '../src/resident-locomotion.js';
const actor=()=>({state:{position:[0,0,0],yaw:0,time:.17,stride:1,animationSpeed:1,idleAction:'Idle'}});
test('walk cadence follows actual arc length at varied frame rates and freezes without translation',()=>{
 const phases=[];
 for(const fps of [10,30,60,120]){
  const a=actor(),motion=createResidentLocomotion(a);motion.update(0);let result;
  for(let i=0;i<fps*3;i++){a.state.position[2]+=.75/fps;a.state.time+=1/fps;result=motion.update(1/fps);}
  assert.equal(result.clip,'Walk');phases.push(result.phase);
  assert.ok(Math.abs(result.time-result.phase*1.2)<1e-8);
  const frozen=motion.update(0);for(let i=0;i<10;i++)assert.deepEqual(motion.update(0),frozen);
 }
 for(const phase of phases)assert.ok(Math.abs(phase-phases[0])<1e-10);
});
test('starting, stopping, turning and dialogue are per-character transitions with support and swing stages',()=>{
 const a=actor();a.state.stride=0;const m=createResidentLocomotion(a);assert.equal(m.update(0).clip,'Idle');
 a.state.position[2]=.05;let pose=m.update(.2);assert.equal(pose.clip,'StartWalk');assert.ok(pose.time>0&&pose.time<.6);
 a.state.position[2]=.3;pose=m.update(.3);assert.equal(pose.clip,'Walk');
 assert.equal(m.update(.1).clip,'StopWalk');for(let i=0;i<10;i++)pose=m.update(.1);assert.equal(pose.clip,'Idle');
 a.state.yaw=.1;assert.equal(m.update(.1).clip,'TurnRight');
 a.state.talking=true;assert.equal(m.update(.1).clip,'Talk');
 assert.equal(residentFootContact('Walk',.24,'L',.2),'flat');assert.equal(residentFootContact('Walk',.24,'R',.2),'swing');
 assert.equal(residentFootContact('StartWalk',.3,'L'),'swing');
 assert.equal(residentFootContact('TurnRight',.36,'R'),'swing');assert.equal(residentFootContact('TurnRight',.36,'L'),'flat');
});

test('returning from distant detail preserves gait phase using the NPC accumulated travel, without advancing on camera-only changes',()=>{
 const a=actor();a.state.walkDistance=0;let m=createResidentLocomotion(a);m.update(0);
 a.state.walkDistance=.4;a.state.position[2]=.4;let pose=m.update(.5);const previous=pose.phase;
 a.state.walkDistance+=.27;a.state.position[2]+=.27;
 m=createResidentLocomotion(a);pose=m.update(0);assert.ok(Math.abs(pose.phase-((previous+.27/.9)%1))<1e-10);
 for(let i=0;i<10;i++)assert.deepEqual(m.update(0),pose);
});
