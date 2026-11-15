import test from 'node:test';
import assert from 'node:assert/strict';
import {createNPCSystem} from '../src/npc-system.js';
import {createWalkModel} from '../src/walk-model.js';
import {createMotion,angleDelta} from '../src/people-motion.js';
import {createHistoricalScene} from '../src/historical-scenes.js';
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
const actor=(id,x,z=0)=>({id,scale:1,state:createMotion([x,0,z])});
const poi=(id,x,z=0,action='Idle')=>({id,name:id,action,weight:1,capacity:1,slots:[[x,0,z]],lookAt:[x,z+3],dwell:[.5,1],tags:['resident']});
const flat=()=>createWalkModel([],[{x1:-15,x2:15,z1:-8,z2:8}],()=>0);
const context=new Proxy({},{get:()=>()=>{},set:()=>true});
globalThis.document={createElement:()=>({width:256,height:256,getContext:()=>context})};

test('individual seeds, speed factors, animation phases and decision times are independent and reproducible',()=>{
  const build=()=>createNPCSystem({actors:Array.from({length:8},(_,i)=>actor(`a${i}`,-10+i*2)),pois:[poi('left',-12),poi('right',12)],model:flat(),seed:18});
  const a=build(),b=build();
  for(const field of ['seed','speedFactor','timer','socialCheck'])assert.equal(new Set(a.agents.map(a=>a[field])).size,8);
  assert.ok(a.agents.every(a=>a.speedFactor>=.85&&a.speedFactor<=1.15&&a.actor.state.animationSpeed===a.speedFactor));
  assert.equal(new Set(a.agents.map(a=>a.actor.state.time)).size,8);
  for(let i=0;i<100;i++){a.update(.05);b.update(.05);}
  assert.deepEqual(a.agents.map(a=>[a.state,a.actor.state.position,a.poi?.id]),b.agents.map(a=>[a.state,a.actor.state.position,a.poi?.id]));
});

test('POIs reserve capacity during travel, use their actions and never immediately revisit the same POI',()=>{
  const events=[],s=createNPCSystem({actors:[actor('a',-4),actor('b',4)],pois:[poi('west',-6,0,'LookAround'),poi('east',6,0,'Interact'),poi('north',0,5)],model:flat(),seed:77,onEvent:e=>events.push(e)});
  for(let i=0;i<2400;i++) {
    s.update(.05);
    for(const p of s.pois){const r=s.reservations.get(p.id);assert.ok(r.size<=p.capacity);assert.equal(new Set(r.values()).size,r.size);}
  }
  assert.ok(events.filter(e=>e.type==='arrive').length>6,'agents must actually arrive and leave');
  assert.ok(events.some(e=>e.type==='arrive'&&e.action==='Interact'));
  for(const a of s.agents){const goals=events.filter(e=>e.type==='depart'&&e.agent===a.key).map(e=>e.poi);assert.ok(goals.length>2);for(let i=1;i<goals.length;i++)assert.notEqual(goals[i],goals[i-1]);}
  s.dispose();assert.ok([...s.reservations.values()].every(r=>r.size===0));
});

test('head-on agents steer apart, turn gradually and cannot penetrate each other or the player',()=>{
  const s=createNPCSystem({actors:[actor('a',-3),actor('b',3)],pois:[poi('west',-6),poi('east',6)],model:flat(),seed:211});
  for(const [i,a] of s.agents.entries()) {const p=s.pois[1-i];a.poi=p;a.slot={index:0,position:p.slots[0]};a.path=s.agents.length?[[...p.slots[0]]]:[];a.state='travel';a.timer=100;a.cooldown=1000;s.reservations.get(p.id).set(a.key,0);}
  let min=Infinity;const player=[0,0,2];
  for(let i=0;i<600;i++) {
    const before=s.agents.map(a=>a.actor.state.yaw);s.update(1/30,{player});
    s.agents.forEach((a,j)=>{assert.ok(Math.abs(angleDelta(before[j],a.actor.state.yaw))<=2.2/30+.0001);assert.ok(distance(a.actor.state.position,player)>=a.radius+.32+.024);});
    min=Math.min(min,distance(...s.agents.map(a=>a.actor.state.position)));
  }
  assert.ok(min>=.605-.001,'capsules never overlap');
  assert.ok(s.agents[0].actor.state.position[0]>2&&s.agents[1].actor.state.position[0]<-2,'head-on agents must pass instead of deadlocking');
  const a=s.agents[0],from=[a.actor.state.position[0]-2,0,a.actor.state.position[2]],to=[a.actor.state.position[0]+2,0,a.actor.state.position[2]];
  const end=s.constrainPlayer(from,to);assert.ok(distance(end,a.actor.state.position)>=a.radius+.32+.024,'player cannot tunnel through an NPC');
  const spawn=s.safePlayerSpawn(a.actor.state.position);assert.ok(spawn&&s.agents.every(b=>distance(spawn,b.actor.state.position)>b.radius+.32+.1),'re-entry chooses an unoccupied spot');
});

test('social encounters draw once at 20%, last 3–6 seconds, face each other, then depart with cooldowns',()=>{
  let attempts=0,successes=0,example;
  for(let seed=1;seed<=600;seed++) {
    const events=[],s=createNPCSystem({actors:[actor('a',-.5),actor('b',.5)],pois:[poi('west',-5),poi('east',5)],model:flat(),seed,onEvent:e=>events.push(e)});
    for(const a of s.agents){a.timer=100;a.cooldown=0;a.socialCheck=0;}
    s.update(.01);const rolls=events.filter(e=>e.type==='social-attempt');assert.equal(rolls.length,1,'one encounter must not roll twice in a frame');attempts++;if(rolls[0].accepted){successes++;example={s,events};}
  }
  assert.ok(successes/attempts>.16&&successes/attempts<.24,`observed ${successes}/${attempts}`);
  const {s,events}=example,start=events.find(e=>e.type==='chat-start');assert.ok(start.duration>=3&&start.duration<=6);
  const held=s.agents.map(a=>[...a.actor.state.position]);
  for(let i=0;i<80;i++)s.update(1/30);
  assert.deepEqual(s.agents.map(a=>a.actor.state.position),held);
  for(const a of s.agents){assert.ok(a.partner);const other=a.partner.actor.state.position,p=a.actor.state.position;assert.ok(Math.abs(angleDelta(a.actor.state.yaw,Math.atan2(other[0]-p[0],other[2]-p[2])))<.02);}
  for(let i=0;i<150;i++)s.update(1/30);
  assert.ok(s.agents.every(a=>!a.partner&&a.cooldown>0));assert.equal(events.filter(e=>e.type==='chat-end').length,2);
  assert.ok(s.agents.every(a=>a.poi),'both resume a POI journey');
});

test('player dialogue interrupts a social pair and holds position; pause freezes per-agent decisions',()=>{
  let s;
  for(let seed=0;seed<100;seed++){s=createNPCSystem({actors:[actor('a',-.5),actor('b',.5)],pois:[poi('west',-5),poi('east',5)],model:flat(),seed});for(const a of s.agents){a.timer=100;a.cooldown=0;a.socialCheck=0;}s.update(.01);if(s.agents[0].partner)break;}
  const a=s.agents[0],m=a.actor.state,p=[...m.position];m.talking=true;s.update(.1,{camera:[p[0],2,p[2]+4]});
  assert.ok(s.agents.every(a=>!a.partner));assert.deepEqual(m.position,p);
  const before=s.agents.map(a=>[a.age,a.timer,a.cooldown,[...a.actor.state.position],a.actor.state.time]);s.update(0);assert.deepEqual(s.agents.map(a=>[a.age,a.timer,a.cooldown,[...a.actor.state.position],a.actor.state.time]),before);
  m.talking=false;for(let i=0;i<100;i++)s.update(.05);assert.ok(distance(p,m.position)>.5);
});

test('real Jerusalem crowd stays on the mesh without overlap or capacity overflow through a long simulation',()=>{
  const scene=createHistoricalScene('jerusalem',null),s=scene.npcSystem;
  assert.ok(s.agents.length>30);assert.equal(s.agents.filter(a=>a.actor.id).length,3);
  assert.ok(s.pois.reduce((n,p)=>n+p.capacity,0)>s.agents.length,'keep spare slots so the whole crowd cannot reserve every destination');
  for(const p of s.pois){assert.ok(['Idle','LookAround','Interact'].includes(p.action));assert.equal(p.capacity,p.slots.length);for(const q of p.slots)assert.ok(scene.walkModel.valid(q[0],q[2]),`${p.id}: valid standing place`);}
  let arrivals=0,chats=0;const visited=new Map(s.agents.map(a=>[a.key,new Set()]));
  for(let i=0;i<2400;i++) {
    s.update(.05,{player:[20,8.025,0]});
    for(const [j,a] of s.agents.entries()) {
      const p=a.actor.state.position;assert.ok(scene.walkModel.valid(p[0],p[2],p[1]),'body is clear at its actual supporting height');if(a.poi)visited.get(a.key).add(a.poi.id);if(a.state==='rest'&&a.poi)arrivals++;if(a.partner)chats++;
      assert.ok(Math.hypot(...a.velocity)<=a.speed+.00001,'avoidance must respect the assigned individual speed');
      for(const b of s.agents.slice(j+1)){const q=b.actor.state.position,verticalOverlap=p[1]<q[1]+1.7*b.actor.scale&&p[1]+1.7*a.actor.scale>q[1];if(verticalOverlap)assert.ok(distance(p,q)>=a.radius+b.radius+.024,`${a.key} overlaps ${b.key}`);}
      assert.ok(distance(p,[20,8.025,0])>=a.radius+.32+.024);
    }
    for(const p of s.pois)assert.ok(s.reservations.get(p.id).size<=p.capacity);
  }
  assert.ok(arrivals>20);assert.ok(chats>0,'the real crowd must produce visible social interactions');
  assert.ok(visited.get('householder').size>1,'public reservations must not starve the resident out of their own courtyard');
  assert.ok([...visited.values()].filter(p=>p.size>1).length>s.agents.length*.7,'most agents must visit multiple destinations');scene.dispose();
});

test('noticing a nearby player is brief; only an actual dialogue keeps an NPC held indefinitely',()=>{
  const s=createNPCSystem({actors:[actor('a',-4)],pois:[poi('west',-6),poi('east',6)],model:flat(),seed:36}),a=s.agents[0],m=a.actor.state;
  const p=[...m.position];m.attending=true;for(let i=0;i<30;i++)s.update(1/30,{camera:[-2,2,0]});assert.deepEqual(m.position,p);assert.ok(a.held);
  for(let i=0;i<300;i++)s.update(1/30,{camera:[-2,2,0]});assert.equal(a.held,false);assert.ok(distance(p,m.position)>.5);
  m.talking=true;const held=[...m.position];for(let i=0;i<300;i++)s.update(1/30,{camera:[-2,2,0]});assert.deepEqual(m.position,held);assert.ok(a.held);
});

test('residents on different vertical levels do not start a conversation through the floor',()=>{
  const events=[],s=createNPCSystem({actors:[actor('a',-.5),actor('b',.5)],pois:[poi('west',-5),poi('east',5)],model:flat(),onEvent:e=>events.push(e)});
  s.agents[1].actor.state.position[1]=2.5;
  for(const a of s.agents){a.timer=100;a.cooldown=0;a.socialCheck=0;}
  s.update(.05);assert.equal(events.filter(e=>e.type==='social-attempt').length,0);
});
