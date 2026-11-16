import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {parablesSegments,parablesFloor,parablesObjects,parablesPOIs,parablesReadingPhases} from '../src/parables-exploration.js';
import {createCharacterController} from '../src/character-controller.js';
import {createParablesObject} from '../src/parables-objects.js';
import {createHistoricalScene} from '../src/historical-scenes.js';
const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});
globalThis.document=Object.assign(new EventTarget(),{createElement:()=>({getContext:()=>ctx}),querySelector:()=>null,activeElement:null});globalThis.window=new EventTarget();
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
for(const s of parablesSegments)test(`Parables integrated ${s.id}: actual ground, safe navigation, independent POI crowd and controller`,()=>{
 const view=createHistoricalScene('parables',null,{segment:s.id}),scene=view.scene,model=view.walkModel,o=view.objects[0];
 assert.deepEqual(view.people.map(p=>p.id),[s.person]);assert.equal(view.npcSystem.agents.length,13);
 assert.ok(model.valid(s.spawn[0],s.spawn[2]));assert.ok(model.path(s.spawn,o.approach).length>1);
 for(const p of parablesPOIs(s.id))for(const slot of p.slots)assert.ok(model.valid(slot[0],slot[2]),`${s.id} ${p.id}`);
 scene.updateMatrixWorld(true);const meshes=scene.children.filter(m=>m.isMesh&&/parables-public-ground/.test(m.name));
 for(const [x,z] of [[-10,5],[12,18],[15,-4]]){const hit=new THREE.Raycaster(new THREE.Vector3(x,15,z),new THREE.Vector3(0,-1,0)).intersectObjects(meshes)[0];assert.ok(hit&&Math.abs(hit.point.y-parablesFloor(s.id,x,z))<.007,`${s.id} visual/physical floor ${x},${z}: ${hit?.point.y}`);}
 for(const fps of [30,60,120])for(const sign of [-1,1]){
  const motor=createCharacterController(model);motor.reset([15,parablesFloor(s.id,15,sign<0?17:8),sign<0?17:8]);let previous=motor.visualPosition[1],snap=false,up=false;
  for(let i=0;i<fps*5;i++){const dz=sign*1.5/fps,speed=motor.speedFactor(0,dz);motor.update(1/fps,0,dz*speed);assert.ok(motor.state.isGrounded);assert.ok(Math.abs(motor.visualPosition[1]-previous)<.012);snap ||=motor.state.groundSnapApplied;up ||=motor.state.speedFactor===.8;previous=motor.visualPosition[1];}
  assert.ok(sign<0?snap:up);
 }
 const npc=view.npcSystem;assert.equal(new Set(npc.agents.map(a=>a.seed)).size,13);assert.equal(new Set(npc.agents.map(a=>a.timer)).size,13);let social=false;
 for(let frame=0;frame<7200;frame++){
  npc.update(.05,{player:s.spawn});for(const [i,a] of npc.agents.entries()){const p=a.actor.state.position;assert.ok(model.valid(p[0],p[2]));assert.ok(Math.abs(p[1]-parablesFloor(s.id,p[0],p[2]))<.001);social ||=!!a.partner;for(const b of npc.agents.slice(i+1))assert.ok(distance(p,b.actor.state.position)>=a.radius+b.radius+.024);}for(const p of npc.pois)assert.ok(npc.reservations.get(p.id).size<=p.capacity);
 }
 assert.ok(npc.agents.every(a=>a.visits.size>=2));assert.ok(social);view.dispose();assert.equal(parablesReadingPhases[s.id].length,s.id==='lamp'?4:3);
});
test('Parables loading geometry stays supported; movable soil layer carries its shoots',()=>{
 for(const id of parablesObjects.map(o=>o.id)){const root=createParablesObject(id);root.updateMatrixWorld(true);assert.ok(new THREE.Box3().setFromObject(root).min.y>-.000001);root.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}
 const soil=createParablesObject('parables-soil'),layer=soil.getObjectByName('parables-soil-modern-shallow-layer');assert.ok(layer);const before=layer.children.map(o=>o.getWorldPosition(new THREE.Vector3()));layer.position.y=.14;soil.updateMatrixWorld(true);layer.children.forEach((o,i)=>assert.ok(o.getWorldPosition(new THREE.Vector3()).distanceTo(before[i].clone().add(new THREE.Vector3(0,.14,0)))<1e-6));soil.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
});
