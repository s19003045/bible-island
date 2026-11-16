import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { themes } from '../src/content.js';
import { historicalScenes } from '../src/historical-data.js';
import { peopleByIsland, dialogueSource } from '../src/people-data.js';
import { sampleWalk, createMotion, advanceMotion, angleDelta } from '../src/people-motion.js';
import { createHistoricalScene } from '../src/historical-scenes.js';

const context=new Proxy({},{get:()=>()=>{},set:()=>true});
globalThis.document={createElement:()=>({width:256,height:256,getContext:()=>context})};

test('36 scene-specific characters have sourced questions, follow-ups and valid learning destinations',()=>{
  assert.deepEqual(Object.keys(peopleByIsland).sort(),Object.keys(historicalScenes).sort());
  let count=0;
  for(const [island,people] of Object.entries(peopleByIsland)) {
    assert.equal(people.length,3);assert.equal(new Set(people.map(p=>p.id)).size,3);
    const stops=new Set(themes.find(t=>t.id===island).stops.map(s=>s.id));
    for(const p of people) {
      count++;assert.ok(p.era&&p.role&&p.greeting);
      assert.equal(p.topics.length,3);assert.equal(new Set(p.topics.map(t=>t.id)).size,3);
      for(const t of p.topics) {
        assert.ok(stops.has(t.stop));assert.ok(t.reference&&t.answer&&t.question);
        assert.equal(new URL(dialogueSource(t.passage)).protocol,'https:');
        if(t.followup)assert.ok(t.followup.question&&t.followup.answer);
      }
      assert.ok(p.topics.some(t=>t.followup));
    }
  }
  assert.equal(count,36);
});

test('walking stays on its authored route and turns without wrapping to a different location',()=>{
  const route=[[-8,8.52,1.8],[8,8,1.8]],cycle=2*(Math.hypot(16,.52)/.65+2.4);
  let previous=sampleWalk(route,0);
  for(let t=.05;t<cycle*2;t+=.05) {
    const next=sampleWalk(route,t);
    assert.ok(next.position[0]>=-8&&next.position[0]<=8);
    assert.ok(next.position[1]>=8&&next.position[1]<=8.52);
    assert.equal(next.position[2],1.8);
    assert.ok(Math.hypot(...next.position.map((v,i)=>v-previous.position[i]))<.065,'no position jump');
    assert.ok(Math.abs(angleDelta(previous.yaw,next.yaw))<.12,'bounded turn');previous=next;
  }
});

test('conversation holds a walking person, faces the viewer, then resumes from the same place; zero dt freezes motion',()=>{
  const m=createMotion([3,0,0],0,[[0,0,0],[8,0,0]],1);
  advanceMotion(m,1,[3,2,5]);assert.ok(m.position[0]>3);
  m.talking=true;const held=[...m.position],clock=m.routeTime;
  for(let i=0;i<90;i++)advanceMotion(m,1/30,[held[0],2,held[2]+5]);
  assert.deepEqual(m.position,held);assert.equal(m.routeTime,clock);
  assert.ok(Math.abs(angleDelta(m.yaw,0))<.001);
  const frozen=structuredClone(m);advanceMotion(m,0,[99,2,99]);assert.deepEqual(m,frozen);
  m.talking=false;advanceMotion(m,1/30,[0,2,0]);
  assert.ok(m.position[0]>held[0]&&m.position[0]-held[0]<.05);
});

test('the Exodus procession advances and stops at the end without reversing or teleporting',()=>{
  const route=[[-40,0,-3],[60,0,-3]];let previous=-40;
  for(let t=0;t<400;t+=.25) {
    const sample=sampleWalk(route,t,.65,'forward');
    assert.ok(sample.position[0]>=previous);assert.ok(sample.position[0]<=60);
    assert.ok(Math.abs(angleDelta(sample.yaw,Math.PI/2))<.001);previous=sample.position[0];
  }
  assert.equal(previous,60);assert.equal(sampleWalk(route,400,.65,'forward').stride,0);
  const built=createHistoricalScene('exodus',null);
  assert.equal(built.people.find(a=>a.id==='traveler').state.routeMode,'forward');built.dispose();
});

test('all detailed scenes animate real instance matrices and bind only their intended interlocutors',()=>{
  const matrix=new THREE.Matrix4();
  for(const island of Object.keys(peopleByIsland)) {
    const built=createHistoricalScene(island,null);
    assert.deepEqual(built.people.map(a=>a.id),peopleByIsland[island].filter(p=>!built.exploration?.person||p.id===built.exploration.person).map(p=>p.id));
    const actor=built.people[0],head=actor.parts.find(p=>p.bone==='head');
    head.mesh.getMatrixAt(head.index,matrix);const before=[...matrix.elements];
    for(let i=0;i<30;i++)built.animate(1/30,[actor.state.position[0],actor.state.position[1]+2,actor.state.position[2]+5]);
    head.mesh.getMatrixAt(head.index,matrix);assert.notDeepEqual(matrix.elements,before,`${island}: animated geometry`);
    assert.equal(head.mesh.userData.actorInstances[head.index],actor.id);
    built.converse(actor.id);assert.equal(built.people.filter(a=>a.state.talking).length,1);
    const held=[...actor.state.position];built.animate(.5,[held[0],held[1]+2,held[2]+5]);assert.deepEqual(actor.state.position,held);
    built.animate(0,[0,2,0]);head.mesh.getMatrixAt(head.index,matrix);const frozen=[...matrix.elements];
    built.animate(0,[99,2,99]);head.mesh.getMatrixAt(head.index,matrix);assert.deepEqual(matrix.elements,frozen);
    for(const a of built.people) {
      assert.ok(a.parts.length>15);
      for(const part of a.parts) {part.mesh.getMatrixAt(part.index,matrix);assert.ok(matrix.elements.every(Number.isFinite));}
      const offset=built.conversationOffset(a);assert.ok(offset.toArray().every(Number.isFinite));assert.ok(offset.length()>4);
    }
    built.converse(null);assert.equal(built.people.filter(a=>a.state.talking).length,0);built.dispose();
  }
});
