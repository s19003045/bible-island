import test from 'node:test';
import assert from 'node:assert/strict';
import {createNPCActivities} from '../src/npc-activities.js';
import {createNPCSystem} from '../src/npc-system.js';
import {createWalkModel} from '../src/walk-model.js';
import {createMotion} from '../src/people-motion.js';

function fixture(count=1){
  const events=[],actors=Array.from({length:count},(_,i)=>({id:'worker-'+i,role:'resident',scale:1,motionProfile:'resident',state:createMotion([2*i,0,-2])}));
  const plans=Object.fromEntries(actors.map(a=>[a.id,{id:'water-round',stops:[
    {pois:['water'],target:[0,0,.5],phases:[{id:'set-down',clip:'SetDown',duration:.4,label:'放下水罐',prop:'lowering'},{id:'fill',clip:'Fill',duration:1,label:'盛水',prop:'ground'},{id:'pick-up',clip:'PickUp',duration:.4,label:'提起水罐',prop:'lifting'}]},
    {pois:['delivery'],target:[0,0,4.5],phases:[{id:'deliver',clip:'Inspect',duration:.5,label:'交付',prop:'hand'}]},
  ]}]));
  const activities=createNPCActivities(plans,{onEvent:e=>events.push(e)});
  const poi=(id,z)=>({id,action:'Interact',weight:1,capacity:1,slots:[[0,0,z]],lookAt:[0,z+.5],tags:['resident'],dwell:[1,2]});
  const system=createNPCSystem({actors,pois:[poi('water',0),poi('delivery',4)],model:createWalkModel([],[{x1:-4,x2:4,z1:-5,z2:7}],()=>0),activities,socialProbability:0,spawnExclusion:null});
  return {activities,system,actors,events};
}

test('actual navigation reaches the work socket before a complete purposeful multi-phase routine',()=>{
  const {system,activities,events,actors}=fixture();let working=false;
  for(let i=0;i<1800;i++){
    system.update(1/60);const a=system.agents[0],activity=actors[0].state.activity;
    if(activity){working=true;assert.ok(Math.hypot(actors[0].state.position[0],actors[0].state.position[2]-(activity.station==='water'?0:4))<.05);}
    if(activities.inspect(a).completed>=2)break;
  }
  assert.ok(working);assert.equal(activities.inspect(system.agents[0]).completed,2);
  assert.deepEqual(events.filter(e=>e.type==='activity-phase').map(e=>e.phase),['set-down','fill','pick-up','deliver']);
  system.dispose();assert.equal(actors[0].state.activity,undefined);
});

test('dialogue freezes the actual working pose and facing, then resumes without repeating or skipping a handoff',()=>{
  const {system,actors,events}=fixture(),actor=actors[0];
  for(let i=0;i<1200&&!(actor.state.activity?.phase==='fill'&&actor.state.activity.progress>.2);i++)system.update(1/60);
  assert.equal(actor.state.activity?.phase,'fill');
  const settledYaw=actor.state.yaw;system.update(1/60);assert.equal(actor.state.yaw,settledYaw,'working body must not keep easing a grounded prop around');
  const elapsed=actor.state.activity.elapsed,yaw=actor.state.yaw,position=[...actor.state.position];actor.state.talking=true;
  for(let i=0;i<180;i++)system.update(1/60,{camera:[3,1.6,-3]});
  assert.equal(actor.state.activity.elapsed,elapsed);assert.equal(actor.state.activity.prop,'ground');assert.equal(actor.state.activity.paused,true);
  assert.equal(actor.state.yaw,yaw);assert.deepEqual(actor.state.position,position);
  actor.state.talking=false;system.update(1/60);assert.ok(actor.state.activity.elapsed>elapsed);
  const snapshot=JSON.stringify(actor.state.activity);system.update(0);assert.equal(JSON.stringify(actor.state.activity),snapshot);
  for(let i=0;i<90;i++)system.update(1/60);
  assert.equal(events.filter(e=>e.type==='activity-phase'&&e.phase==='set-down').length,1);
  system.suspend();assert.equal(actor.state.activity,undefined);assert.ok([...system.reservations.values()].every(r=>!r.size));system.dispose();
});

test('busy stations retain capacity through work and characters have separate routine progress',()=>{
  const {system,activities,actors}=fixture(2);let bothServed=false;
  for(let i=0;i<3600;i++){
    system.update(1/60);
    for(const p of system.pois)assert.ok(system.reservations.get(p.id).size<=p.capacity);
    assert.ok(actors.filter(a=>a.state.activity?.station==='water').length<=1);
    const a=actors[0].state.position,b=actors[1].state.position;assert.ok(Math.hypot(a[0]-b[0],a[2]-b[2])>=.605-1e-6);
    if(system.agents.every(a=>activities.inspect(a).completed>0)){bothServed=true;break;}
  }
  assert.ok(bothServed,'both workers actually complete a station, not just reserve it');system.dispose();
});

test('suspending a scene releases the station but permits returning to unfinished work without repeating its handoff',()=>{
  const {system,actors,events}=fixture(),actor=actors[0];
  for(let i=0;i<1200&&!(actor.state.activity?.phase==='fill'&&actor.state.activity.progress>.3);i++)system.update(1/60);
  assert.equal(actor.state.activity?.phase,'fill');const elapsed=actor.state.activity.elapsed;
  system.suspend();assert.equal(actor.state.activity,undefined);assert.ok([...system.reservations.values()].every(r=>!r.size));
  for(let i=0;i<900&&!actor.state.activity;i++)system.update(1/60);
  assert.equal(actor.state.activity?.phase,'fill');assert.ok(actor.state.activity.elapsed>=elapsed);
  assert.equal(events.filter(e=>e.type==='activity-phase'&&e.phase==='set-down').length,1);
  assert.equal(events.filter(e=>e.type==='activity-phase'&&e.phase==='fill').length,1);system.dispose();
});
