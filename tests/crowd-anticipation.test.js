import test from 'node:test';
import assert from 'node:assert/strict';
import {anticipateCrowd} from '../src/crowd-anticipation.js';
import {createNPCSystem} from '../src/npc-system.js';
import {createWalkModel} from '../src/walk-model.js';
import {createMotion,angleDelta} from '../src/people-motion.js';

const person=(id,z,yaw=0)=>({id,motionProfile:'resident',scale:1,state:createMotion([0,0,z],yaw)});
const destination=(id,z)=>({id,name:id,action:'Idle',weight:1,capacity:1,slots:[[0,0,z]],lookAt:[0,z+2],dwell:[2,4],tags:['resident']});

test('a predicted head-on encounter chooses reciprocal sides before personal space is threatened',()=>{
  const a={key:'a',actor:person('a',-1.5),age:0,radius:.29,speed:1};
  const b={key:'b',position:[0,0,1.5],velocity:[0,-1],radius:.29,travelling:true};
  const velocity=anticipateCrowd(a,[b],[0,1],{dt:1/60,canTraverse:()=>true});
  assert.ok(velocity[0]>0,'early lateral intent at 3 m');assert.equal(a.encounter.status,'pass');
  const other={key:'b',actor:person('b',1.5,Math.PI),age:0,radius:.29,speed:1};
  const reverse=anticipateCrowd(other,[{...b,key:'a',position:[0,0,-1.5],velocity:[0,1]}],[0,-1],{dt:1/60,canTraverse:()=>true});
  assert.ok(reverse[0]<0,'oncoming person passes on the opposite world side');
  const side=a.encounter.side;
  for(let i=0;i<30;i++){a.age+=1/60;b.position[0]=Math.sin(i)*.08;anticipateCrowd(a,[b],[.02*Math.sin(i),1],{dt:1/60,canTraverse:()=>true});assert.equal(a.encounter.side,side);}
});

test('a narrow encounter has one stable yielding person and requests a navigable retreat, without randomness',()=>{
  const make=key=>({key,actor:person(key,key==='a'?-1:1),age:0,radius:.29,speed:1,random:()=>{throw Error('no random direction draws');}});
  const a=make('a'),b=make('b');
  for(let i=0;i<60;i++){
    a.age+=1/60;b.age+=1/60;
    anticipateCrowd(a,[{key:'b',position:b.actor.state.position,velocity:[0,-1],radius:.29,travelling:true}],[0,1],{dt:1/60,canTraverse:()=>false});
    anticipateCrowd(b,[{key:'a',position:a.actor.state.position,velocity:[0,1],radius:.29,travelling:true}],[0,-1],{dt:1/60,canTraverse:()=>false});
  }
  assert.equal(a.encounter.yields,false);assert.equal(b.encounter.yields,true);
  assert.equal(a.encounter.retreatRequested,false);assert.equal(b.encounter.retreatRequested,true);
  assert.deepEqual(b.encounter.obstacle.position,a.actor.state.position);
  const snapshot=JSON.stringify(b.encounter);anticipateCrowd(b,[],[0,-1],{dt:0,canTraverse:()=>true});assert.equal(JSON.stringify(b.encounter),snapshot);
});

test('actual anticipated head-on controllers pass, retain turn bounds and swept player / NPC clearance',()=>{
  const actors=[person('a',-3),person('b',3,Math.PI)],pois=[destination('south',-6),destination('north',6)];
  const model=createWalkModel([],[{x1:-3,x2:3,z1:-8,z2:8}],()=>0);
  const system=createNPCSystem({actors,pois,model,anticipation:true,allowRetreat:true,socialProbability:0,spawnExclusion:null});
  system.agents.forEach((a,i)=>{a.poi=pois[1-i];a.slot={index:0,position:a.poi.slots[0]};a.path=[[...a.slot.position]];a.state='travel';system.reservations.get(a.poi.id).set(a.key,0);});
  let passed=false,minGap=Infinity,early=false;
  for(let frame=0;frame<900;frame++){
    const headings=actors.map(a=>a.state.yaw);system.update(1/60,{player:[2,0,0]});
    const [a,b]=actors.map(a=>a.state.position),gap=Math.hypot(a[0]-b[0],a[2]-b[2]);minGap=Math.min(minGap,gap);
    if(gap>2.5&&system.agents.some(a=>a.encounter))early=true;
    for(const [i,agent] of system.agents.entries()){
      assert.ok(Math.abs(angleDelta(headings[i],actors[i].state.yaw))<.04);
      assert.ok(Math.hypot(...agent.velocity)<=agent.speed+1e-6);
      const p=actors[i].state.position;assert.ok(Math.hypot(p[0]-2,p[2])>=agent.radius+.32+.024);
    }
    if(a[2]>2&&b[2]<-2){passed=true;break;}
  }
  assert.ok(early);assert.ok(passed,'both actually continue past each other');assert.ok(minGap>=.605-1e-6);system.dispose();
});

test('an actual single-width corridor clears by backing into a reserved side bay, without overlap',()=>{
  const actors=[person('a',-2.5),person('b',2.5,Math.PI)],pois=[destination('south',-5.5),destination('north',5.5)];
  for(const [id,x,z] of [['north-bay',1.8,4.7],['south-bay',-1.8,-4.7]])pois.push({...destination(id,z),slots:[[x,0,z]],lookAt:[0,z]});
  const model=createWalkModel([],[{x1:-.55,x2:.55,z1:-6,z2:6},{x1:-3,x2:3,z1:4,z2:6.5},{x1:-3,x2:3,z1:-6.5,z2:-4}],()=>0);
  const events=[],system=createNPCSystem({actors,pois,model,anticipation:true,allowRetreat:true,socialProbability:0,spawnExclusion:null,onEvent:e=>events.push(e)});
  system.agents.forEach((a,i)=>{a.poi=pois[1-i];a.slot={index:0,position:a.poi.slots[0]};a.path=model.path(a.actor.state.position,a.slot.position);a.path.push([...a.slot.position]);a.state='travel';system.reservations.get(a.poi.id).set(a.key,0);});
  let cleared=false;
  for(let i=0;i<3600;i++){
    system.update(1/60);const [a,b]=actors.map(a=>a.state.position);
    assert.ok(Math.hypot(a[0]-b[0],a[2]-b[2])>=.605-1e-6);
    for(const p of system.pois)assert.ok(system.reservations.get(p.id).size<=p.capacity);
    if(events.some(e=>e.agent==='a'&&e.type==='arrive'&&e.poi==='north')){cleared=true;break;}
  }
  assert.ok(events.some(e=>e.agent==='b'&&e.type==='yield'),'the lower-priority person takes a real retreat route');
  assert.ok(cleared,'the other person reaches the far side instead of waiting forever');system.dispose();
});
