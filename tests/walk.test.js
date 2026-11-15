import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import * as THREE from 'three';
import {createWalkModel} from '../src/walk-model.js';
import {createWalkControls} from '../src/walk-controls.js';
import {createHistoricalScene} from '../src/historical-scenes.js';
import {walkSpawn,walkFloor,freshMission,missionEvent,missionStage,vesselDefinitions} from '../src/walk-data.js';
import {peopleByIsland} from '../src/people-data.js';

const context=new Proxy({},{get:()=>()=>{},set:()=>true});
globalThis.document=Object.assign(new EventTarget(),{createElement:()=>({width:256,height:256,getContext:()=>context}),querySelector:()=>null,activeElement:null,pointerLockElement:null});
globalThis.window=new EventTarget();

test('walking is swept against walls and stops at the public-area boundary',()=>{
  const model=createWalkModel([{min:[.5,0,-2],max:[.7,2,2]}],[{x1:-4,x2:4,z1:-3,z2:3}],()=>0);
  const stopped=model.move([-3,0,0],10,0);assert.ok(stopped[0]<.5-model.radius+.001);assert.ok(stopped[0]>0);
  const edge=model.move([-3,0,0],-20,0);assert.ok(edge[0]>=-4+model.radius);
  assert.equal(model.valid(.6,0),false);assert.equal(model.heightAt(10,0),null);
});

test('actual city geometry permits continuous routes to residents and the courtyard, with no table clipping',()=>{
  const scene=createHistoricalScene('jerusalem',null),model=scene.walkModel;
  assert.ok(model.valid(walkSpawn[0],walkSpawn[2]));assert.equal(model.valid(-33.4,25.6),false);
  for(const target of [[0,8,0],[-42,10.73,1.4],[-34.7,10.28,27.6],[-34.7,10.28,26.8],[-34,10.21,24]]) {
    const route=model.path(walkSpawn,target);assert.ok(route.length>1);let position=[...walkSpawn],iterations=0;
    for(const point of route) {
      assert.ok(model.valid(point[0],point[2]));
      while(Math.hypot(point[0]-position[0],point[2]-position[2])>=.15) {
        const dx=point[0]-position[0],dz=point[2]-position[2],length=Math.hypot(dx,dz),distance=Math.min(length,1.85/30);
        const next=model.move(position,dx/length*distance,dz/length*distance);
        assert.ok(Math.hypot(next[0]-position[0],next[2]-position[2])>.0001,'route must be traversable, not just connected in a graph');
        assert.ok(Math.abs(next[1]-model.sampleGround(next[0],next[2],next[1]).height)<.00001,'feet stay on the ground or a legal step');position=next;assert.ok(++iterations<10000);
      }
    }
    assert.ok(Math.hypot(position[0]-target[0],position[2]-target[2])<.5);
  }
  assert.equal(scene.objects.length,2);scene.dispose();
});

test('movement uses eye height, blocks during conversation, and releases held keys on focus loss',()=>{
  const canvas=Object.assign(new EventTarget(),{focus(){},setPointerCapture(){}}),camera=new THREE.PerspectiveCamera();
  const control=createWalkControls(camera,canvas);control.start(createWalkModel());
  assert.ok(Math.abs(camera.position.y-control.position[1]-1.65)<.001);
  const event=new Event('keydown',{cancelable:true});Object.defineProperty(event,'code',{value:'KeyW'});document.dispatchEvent(event);
  control.update(.05);const first=control.position;assert.ok(first[0]<walkSpawn[0]);
  control.block(true);control.update(1);assert.deepEqual(control.position,first);
  control.block(false);control.update(1);assert.deepEqual(control.position,first,'conversation must clear held movement');
  document.dispatchEvent(event);window.dispatchEvent(new Event('blur'));control.update(1);assert.deepEqual(control.position,first);
  control.dispose();
});

test('the short journey requires listening, both distinct objects, follow-up and a correct reflection',()=>{
  let m=freshMission();assert.equal(missionStage(m),0);assert.equal(missionEvent(m,{type:'reflect',correct:true}).complete,false);
  m=missionEvent(m,{type:'answer',person:'water-carrier',topic:'water'});assert.equal(m.listen,false);
  m=missionEvent(m,{type:'answer',person:'water-carrier',topic:'hills'});assert.equal(missionStage(m),1);
  m=missionEvent(m,{type:'inspect',id:vesselDefinitions[0].id});m=missionEvent(m,{type:'inspect',id:vesselDefinitions[0].id});assert.equal(m.observed.length,1);
  m=missionEvent(m,{type:'inspect',id:vesselDefinitions[1].id});assert.equal(missionStage(m),2);
  m=missionEvent(m,{type:'answer',person:'householder',topic:'courtyard'});assert.equal(m.ask,false);
  m=missionEvent(m,{type:'answer',person:'householder',topic:'courtyard',followup:true});assert.equal(missionStage(m),3);
  assert.equal(missionEvent(m,{type:'reflect',correct:false}).complete,false);m=missionEvent(m,{type:'reflect',correct:true});assert.equal(missionStage(m),4);
});

test('frequent replanning at a low frame rate keeps moving forward instead of returning to grid nodes',()=>{
  const canvas=Object.assign(new EventTarget(),{focus(){},setPointerCapture(){}}),camera=new THREE.PerspectiveCamera();
  const control=createWalkControls(camera,canvas);control.start(createWalkModel());
  for(let i=0;i<100;i++){control.navigate([6,8,0]);control.update(.05);}
  assert.ok(control.position[0]<12,'repeated replans must make sustained progress');control.dispose();
});

test('automatic walking yields to a passing NPC without cancelling the route or flooding obstacle messages',()=>{
  let blocked=true,messages=0;const canvas=Object.assign(new EventTarget(),{focus(){},setPointerCapture(){}}),camera=new THREE.PerspectiveCamera();
  const control=createWalkControls(camera,canvas,{constrainMove:(from,to)=>blocked?from:to,onMessage:()=>messages++});control.start(createWalkModel());control.navigate([12,8,0]);
  for(let i=0;i<60;i++)control.update(.05);assert.deepEqual(control.position,walkSpawn);assert.ok(control.navigating);assert.equal(messages,0);
  blocked=false;for(let i=0;i<20;i++)control.update(.05);assert.ok(control.position[0]<19);control.dispose();
});

test('all Jerusalem dialogue voice cues match the authored text and ship with local audio files',()=>{
  const manifest=JSON.parse(readFileSync(new URL('../src/voice-manifest.json',import.meta.url)));
  for(const p of peopleByIsland.jerusalem) {
    const entry=manifest[p.id];assert.ok(statSync(new URL(`../public/${entry.src}`,import.meta.url)).size>100000);
    const text={greeting:p.greeting};for(const t of p.topics){text[t.id]=t.answer;if(t.followup)text[t.id+'-followup']=t.followup.answer;}
    assert.deepEqual(Object.keys(entry.clips).sort(),Object.keys(text).sort());let end=0;
    for(const [key,cue] of Object.entries(entry.clips)){assert.equal(cue.text,text[key]);assert.ok(cue.start>=0&&cue.end>cue.start&&cue.end<=entry.duration);assert.ok(cue.start>=end-.1);end=cue.end;}
  }
});
