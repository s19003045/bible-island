import test from 'node:test';
import assert from 'node:assert/strict';
import {createNPCFootsteps} from '../src/npc-footsteps.js';
const person=(x=1)=>({scale:1,state:{position:[x,0,0],walkDistance:0},visualFootsteps:{left:'swing',right:'flat',clip:'Walk',speed:1}});
test('individual foot contact transitions create spatial footfalls without a shared beat',()=>{
 const heard=[],steps=createNPCFootsteps((position,actor)=>heard.push(actor)),a=person(),b=person(2);steps.update([a,b],[0,0,0]);
 a.state.walkDistance=.3;a.visualFootsteps.left='heel';assert.equal(steps.update([a,b],[0,0,0]),1);assert.deepEqual(heard,[a]);
 assert.equal(steps.update([a,b],[0,0,0]),0,'unchanged pose does not repeat a footfall');
 b.state.walkDistance=.4;b.visualFootsteps.left='heel';assert.equal(steps.update([a,b],[0,0,0]),1);assert.deepEqual(heard,[a,b]);
});
test('life pilot starts, stops and stair clips retain contact-triggered footstep audio',()=>{
 for(const clip of ['StartWalkL','StartWalkR','StopWalkL','StopWalkR','StairUp','StairDown']){
  const steps=createNPCFootsteps(()=>{}),a=person();a.visualFootsteps.clip=clip;steps.update([a],[0,0,0]);
  a.state.walkDistance=.25;a.visualFootsteps.left='flat';assert.equal(steps.update([a],[0,0,0]),1,clip);
  assert.equal(steps.update([a],[0,0,0]),0,'paused contact must stay silent');
 }
});
test('far, paused, hidden, speaking and budget-dropped contacts are never replayed later',()=>{
 const heard=[],steps=createNPCFootsteps((p,a)=>heard.push(a)),actors=Array.from({length:6},(_,i)=>person(1+i));steps.update(actors,[0,0,0]);
 for(const a of actors){a.state.walkDistance=.3;a.visualFootsteps.left='heel';}assert.equal(steps.update(actors,[0,0,0],{limit:2}),2);assert.equal(steps.update(actors,[0,0,0]),0);
 for(const a of actors)a.visualFootsteps.right='swing';steps.update(actors,[0,0,0]);for(const a of actors){a.state.walkDistance=.8;a.visualFootsteps.right='heel';}
 assert.equal(steps.update(actors,[0,0,0],{enabled:false}),0);assert.equal(steps.update(actors,[0,0,0]),0);
 const far=person(25);steps.update([far],[0,0,0]);far.state.walkDistance=.3;far.visualFootsteps.left='heel';assert.equal(steps.update([far],[0,0,0]),0);far.state.position[0]=1;assert.equal(steps.update([far],[0,0,0]),0);
 steps.reset();assert.equal(steps.update(actors,[0,0,0]),0,'scene changes prime a fresh observer');
 actors[0].visualFootsteps.right='swing';steps.update(actors,[0,0,0]);actors[0].state.talking=true;actors[0].state.walkDistance=1.1;actors[0].visualFootsteps.right='flat';assert.equal(steps.update(actors,[0,0,0]),0);actors[0].state.talking=false;assert.equal(steps.update(actors,[0,0,0]),0);
});
