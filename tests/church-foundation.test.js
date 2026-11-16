import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {churchSegments,churchReadingPhases,churchWalkConfig,churchFloor,churchPOIs} from '../src/church-exploration.js';
import {createHistoricalScene} from '../src/historical-scenes.js';
import {createCharacterController} from '../src/character-controller.js';
import {createWalkControls} from '../src/walk-controls.js';
const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});
globalThis.document=Object.assign(new EventTarget(),{createElement:()=>({getContext:()=>ctx}),querySelector:()=>null,activeElement:null});globalThis.window=new EventTarget();
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
test('Church ten windows rebuild their actual space, physics, public routes and selected light',()=>{
 let count=0;const spaces=new Set();
 for(const segment of churchSegments)for(const phase of churchReadingPhases[segment.id]){
  count++;spaces.add(phase.space);const c=churchWalkConfig(segment.id,phase.id),v=createHistoricalScene('church',null,{segment:segment.id,phase:phase.id}),m=v.walkModel;
  assert.equal(v.config.space,phase.space);assert.equal(v.phase,phase.id);assert.equal(v.exploration.moment.passage,phase.passage);assert.deepEqual(v.people.map(p=>p.id),[segment.person]);assert.ok(v.scene.getObjectByName('church-reading-moment-'+phase.id));
  for(const name of ['house','meals','antioch'])assert.equal(!!v.scene.getObjectByName('church-space-'+name),name===phase.space);
  assert.ok(m.valid(c.spawn[0],c.spawn[2]));assert.ok(m.path(c.spawn,v.objects[0].approach).length>1);for(const p of churchPOIs(segment.id,phase.id))for(const slot of p.slots)assert.ok(m.valid(slot[0],slot[2]),phase.id+' '+p.id);
  v.scene.updateMatrixWorld(true);const ground=v.scene.getObjectByName('church-public-ground');for(const [x,z]of [[-10,5],[12,18],[15,-4]]){const hit=new THREE.Raycaster(new THREE.Vector3(x,20,z),new THREE.Vector3(0,-1,0)).intersectObject(ground)[0];assert.ok(hit&&Math.abs(hit.point.y-churchFloor(phase.space,x,z))<.006);}
  const p=v.people[0].state.position;assert.ok(Math.abs(p[1]-churchFloor(phase.space,p[0],p[2]))<1e-5,'guide follows phase floor');v.setTime(!phase.night);assert.equal(v.scene.background.getHexString(),phase.night?'394650':'b4bdb8');
  if(phase.space==='house'){assert.ok(m.path(c.spawn,[0,churchFloor('house',0,-13),-13]).length>1,'true room entry');const hit=new THREE.Raycaster(new THREE.Vector3(0,2,-13),new THREE.Vector3(0,-1,0)).intersectObjects(v.scene.children,true)[0];assert.ok(hit&&Math.abs(hit.point.y-churchFloor('house',0,-13))<.006,'physical floor matches visible room');}if(phase.space==='antioch')assert.equal(v.scene.getObjectByName('church-relationship-'+phase.id).userData.direction,phase.id==='aid'?'antioch-to-judea':phase.id==='teaching'?'year-in-antioch':'scattered-outward');
  const before=v.npcSystem.agents.map(a=>[...a.actor.state.position]);v.animate(0,[30,20,30]);assert.deepEqual(v.npcSystem.agents.map(a=>[...a.actor.state.position]),before);v.dispose();
 }
 assert.equal(count,10);assert.equal(spaces.size,3);
});
for(const [segment,phase]of [['gathering','hear'],['table','need'],['road','aid']])test(`Church ${phase}: independent residents, POIs, separation, crowded arrival and grounded slopes`,()=>{
 const c=churchWalkConfig(segment,phase),v=createHistoricalScene('church',null,{segment,phase}),n=v.npcSystem,m=v.walkModel;
 assert.equal(n.agents.length,13);assert.equal(n.pois.length,8);assert.equal(n.pois.reduce((s,p)=>s+p.capacity,0),16);assert.equal(new Set(n.agents.map(a=>a.seed)).size,13);assert.equal(new Set(n.agents.map(a=>a.timer)).size,13);let social=false;
 for(let frame=0;frame<7200;frame++){
  n.update(.05,{player:c.spawn});for(const [i,a]of n.agents.entries()){const p=a.actor.state.position;assert.ok(m.valid(p[0],p[2]));assert.ok(Math.abs(p[1]-churchFloor(c.space,p[0],p[2]))<.001);social ||=!!a.partner;for(const b of n.agents.slice(i+1))assert.ok(dist(p,b.actor.state.position)>=a.radius+b.radius+.024);}for(const p of n.pois)assert.ok(n.reservations.get(p.id).size<=p.capacity);
 }
 assert.ok(n.agents.every(a=>a.visits.size>=2));assert.ok(social);
 const canvas=Object.assign(new EventTarget(),{focus(){}}),walk=createWalkControls(new THREE.PerspectiveCamera(),canvas,{constrainMove:(a,b)=>n.constrainPlayer(a,b),navigationObstacles:()=>n.agents.map(a=>({position:a.actor.state.position,radius:a.radius+.32+.07}))}),spawn=n.safePlayerSpawn(c.spawn),dest=v.objects[0].approach;
 walk.start(m,spawn);assert.ok(walk.navigate(dest));for(let i=0;i<4800&&dist(walk.position,dest)>.65;i++){n.update(.05,{player:walk.position});walk.update(.05);assert.ok(walk.groundState.isGrounded);for(const a of n.agents)assert.ok(dist(walk.position,a.actor.state.position)>=a.radius+.32+.024);}assert.ok(dist(walk.position,dest)<.65);walk.dispose();
 for(const fps of [30,60,120])for(const sign of [-1,1]){const motor=createCharacterController(m);const alongX=['meals','antioch'].includes(c.space),start=sign<0?17:8;motor.reset(alongX?[start,churchFloor(c.space,start,8),8]:[15,churchFloor(c.space,15,start),start]);let prev=motor.visualPosition[1],snap=false,up=false;for(let i=0;i<fps*4;i++){let dx=alongX?sign*1.5/fps:0,dz=alongX?0:sign*1.5/fps;const speed=motor.speedFactor(dx,dz);motor.update(1/fps,dx*speed,dz*speed);assert.ok(motor.state.isGrounded);assert.ok(Math.abs(motor.visualPosition[1]-prev)<.012);snap ||=motor.state.groundSnapApplied;up ||=motor.state.speedFactor===.8;prev=motor.visualPosition[1];}assert.ok(sign<0?snap:up);}
 v.dispose();
});
