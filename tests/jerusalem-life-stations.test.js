import test from 'node:test';
import assert from 'node:assert/strict';
import {createHistoricalScene} from '../src/historical-scenes.js';
import {lifeStations,stationPoint,createJerusalemActivities,lifePOIs} from '../src/jerusalem-life-stations.js';
import {createNPCSystem} from '../src/npc-system.js';
import {createMotion} from '../src/people-motion.js';
import {createWalkModel} from '../src/walk-model.js';
import {jerusalemAllowed} from '../src/npc-pois.js';
const context=new Proxy({},{get:()=>()=>{},set:()=>true});globalThis.document={createElement:()=>({getContext:()=>context})};

test('real city work stations have level physical contact planes and collision-safe approaches',()=>{
  const scene=createHistoricalScene('jerusalem',null),model=scene.walkModel;
  for(const station of lifeStations){
    const ground=model.sampleGround(station.x,station.z);
    assert.ok(model.valid(station.x,station.z),station.id);assert.ok(Math.abs(ground.height-station.y)<1e-6,station.id+' contact plane');assert.equal(ground.slopeAngle,0);
    const start=[station.x,0,station.z-.6];start[1]=model.heightAt(start[0],start[2]);
    const goal=[station.x,station.y,station.z],path=model.path(start,goal);assert.ok(path.length,station.id+' route');
    // Walk every segment with real small-frame increments, not only the coarse
    // pathfinder probe: false normals used to trap feet just before a low pad.
    let p=start;
    for(const next of [...path,goal]){
      for(let i=0;i<2000&&Math.hypot(p[0]-next[0],p[2]-next[2])>.003;i++){
        const d=Math.hypot(p[0]-next[0],p[2]-next[2]),step=Math.min(.012,d);
        const moved=model.move(p,(next[0]-p[0])/d*step,(next[2]-p[2])/d*step);
        assert.ok(Math.hypot(moved[0]-p[0],moved[2]-p[2])>1e-6,station.id+' blocked '+p);p=moved;
      }
    }
    assert.ok(Math.hypot(p[0]-goal[0],p[2]-goal[2])<.005,station.id);
  }
  scene.dispose();
});

test('a low landing on a sloping street does not invent a steep wall normal before its edge',()=>{
  const floor=(x,z)=>x*.07+(z>=0?.09:0),model=createWalkModel([],[{x1:-3,x2:3,z1:-3,z2:3}],floor,{normalFloor:x=>x*.07});
  const p=[0,0,-.04];let next=p;
  for(let i=0;i<16;i++)next=model.move(next,0,.005);
  assert.ok(next[2]>.035);assert.ok(Math.abs(next[1]-.09)<1e-8);
});

test('all three roles perform actual city work with exact arrival and retain parcel ownership between stations',()=>{
  const scene=createHistoricalScene('jerusalem',null),events=[];
  const actors=scene.people.map(a=>({...a,state:createMotion([...a.state.position])}));
  const activities=createJerusalemActivities({onEvent:e=>events.push(e)});
  const system=createNPCSystem({actors,pois:lifePOIs(),model:scene.walkModel,activities,allowedPosition:(a,p)=>jerusalemAllowed(a,p,scene.walkModel),socialProbability:0,spawnExclusion:null});
  let carrySeen=false;
  for(let i=0;i<6000;i++){
    system.update(.025);
    for(const a of system.agents){
      const work=a.actor.state.activity;
      if(work){const station=lifeStations.find(s=>s.id===work.station);assert.ok(Math.hypot(a.actor.state.position[0]-station.x,a.actor.state.position[2]-station.z)<.005,a.key);}
      if(a.key==='householder'&&a.actor.state.carriedItem&&!work){carrySeen=true;assert.equal(a.actor.state.carriedItem.clip,'CarrySmall');}
    }
    if(system.agents.every(a=>activities.inspect(a).completed>=2))break;
  }
  assert.ok(carrySeen);for(const a of system.agents)assert.ok(activities.inspect(a).completed>=2,a.key+' completed both destinations');
  assert.ok(events.some(e=>e.type==='activity-handoff'&&e.carried==='parcel'));assert.ok(events.some(e=>e.type==='activity-handoff'&&e.carried===null));
  system.dispose();scene.dispose();
});
