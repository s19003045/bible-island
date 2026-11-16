import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {samariaSegments,samariaFloor,samariaObjects,samariaPOIs,samariaReadingPhases} from '../src/samaria-exploration.js';
import {createCharacterController} from '../src/character-controller.js';
import {createSamariaObject} from '../src/samaria-objects.js';
import {createHistoricalScene} from '../src/historical-scenes.js';
const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});
globalThis.document=Object.assign(new EventTarget(),{createElement:()=>({getContext:()=>ctx}),querySelector:()=>null,activeElement:null});globalThis.window=new EventTarget();
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
for(const s of samariaSegments)test(`Samaria integrated ${s.id}: actual ground, safe navigation, independent POI crowd and controller`,()=>{
 const view=createHistoricalScene('samaria',null,{segment:s.id}),scene=view.scene,model=view.walkModel,o=view.objects[0];
 assert.deepEqual(view.people.map(p=>p.id),[s.person]);assert.equal(view.npcSystem.agents.length,13);
 assert.ok(model.valid(s.spawn[0],s.spawn[2]));assert.ok(model.path(s.spawn,o.approach).length>1);
 for(const p of samariaPOIs(s.id))for(const slot of p.slots)assert.ok(model.valid(slot[0],slot[2]),`${s.id} ${p.id}`);
 scene.updateMatrixWorld(true);const meshes=scene.children.filter(m=>m.isMesh&&/samaria-(public-ground|well-ground|open-well|selected-depth)/.test(m.name));
 for(const [x,z] of [[-10,3],[12,18],[22,-4]]){const hit=new THREE.Raycaster(new THREE.Vector3(x,15,z),new THREE.Vector3(0,-1,0)).intersectObjects(meshes)[0];assert.ok(hit&&Math.abs(hit.point.y-samariaFloor(s.id,x,z))<.007,`${s.id} visual/physical floor ${x},${z}: ${hit?.point.y}`);}
 if(s.id==='well'){
  assert.equal(model.valid(-6,-5),false);assert.ok(model.valid(-6,-2.5));const hit=new THREE.Raycaster(new THREE.Vector3(-6,5,-5),new THREE.Vector3(0,-1,0)).intersectObjects(meshes)[0];assert.equal(hit?.object.name,'samaria-selected-depth-well-water');assert.ok(hit.point.y<samariaFloor('well',-6,-5)-2.9);
 }
 if(s.id==='road')for(const fps of [30,60,120])for(const sign of [-1,1]){
  const motor=createCharacterController(model);motor.reset([sign<0?12:-10,samariaFloor('road',sign<0?12:-10,0),0]);let previous=motor.visualPosition[1],snap=false,up=false;
  for(let i=0;i<fps*12;i++){const dx=sign*1.5/fps,speed=motor.speedFactor(dx,0);motor.update(1/fps,dx*speed,0);assert.ok(motor.state.isGrounded);assert.ok(Math.abs(motor.visualPosition[1]-previous)<.012);snap ||=motor.state.groundSnapApplied;up ||=motor.state.speedFactor===.8;previous=motor.visualPosition[1];}
  assert.ok(sign>0?snap:up);
 }
 const npc=view.npcSystem;assert.equal(new Set(npc.agents.map(a=>a.seed)).size,13);assert.equal(new Set(npc.agents.map(a=>a.timer)).size,13);let social=false;
 for(let frame=0;frame<7200;frame++){
  npc.update(.05,{player:s.spawn});for(const [i,a] of npc.agents.entries()){const p=a.actor.state.position;assert.ok(model.valid(p[0],p[2]));assert.ok(Math.abs(p[1]-samariaFloor(s.id,p[0],p[2]))<.001);social ||=!!a.partner;for(const b of npc.agents.slice(i+1))assert.ok(distance(p,b.actor.state.position)>=a.radius+b.radius+.024);}for(const p of npc.pois)assert.ok(npc.reservations.get(p.id).size<=p.capacity);
 }
 assert.ok(npc.agents.every(a=>a.visits.size>=2));assert.ok(social);view.dispose();assert.equal(samariaReadingPhases[s.id].length,s.id==='well'?4:3);
});
test('Samaria loading geometry has real visible inner floors and a movable front section',()=>{
for(const id of samariaObjects.map(o=>o.id)){const root=createSamariaObject(id);root.updateMatrixWorld(true);assert.ok(new THREE.Box3().setFromObject(root).min.y>-.000001);root.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}

const jar=createSamariaObject('samaria-jar');jar.updateMatrixWorld(true);for(const z of [-.02,.02]){const h=new THREE.Raycaster(new THREE.Vector3(-.12,1,z),new THREE.Vector3(0,-1,0)).intersectObject(jar,true)[0];assert.ok(h&&Math.abs(h.point.y-.05)<1e-5);}
const front=jar.getObjectByName('samaria-jar-modern-front-section');assert.ok(front);front.position.z=.16;jar.updateMatrixWorld(true);assert.ok(new THREE.Box3().setFromObject(front).max.z<.36);jar.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
});
