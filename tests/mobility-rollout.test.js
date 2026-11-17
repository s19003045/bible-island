import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {themes} from '../src/content.js';
import {createHistoricalScene} from '../src/historical-scenes.js';
import {createWalkControls} from '../src/walk-controls.js';
import {mobilityFor} from '../src/mobility.js';
import {scoreForScene} from '../src/soundtrack.js';
import {narrativeChapters} from '../src/narrative-chapters.js';
const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});globalThis.document=Object.assign(new EventTarget(),{createElement:()=>({getContext:()=>ctx}),querySelector:()=>null,activeElement:null});globalThis.window=new EventTarget();
test('all 24 islands and each authored chapter support sound, run and bounded airborne movement',()=>{
 let count=0;
 for(const theme of themes)for(const chapter of narrativeChapters[theme.id]||[{id:null}]){
  assert.ok(mobilityFor(theme.id));assert.ok(scoreForScene([theme.id,chapter.id].filter(Boolean).join(':')));
  const scene=createHistoricalScene(theme.id,null,{segment:chapter.id}),npc=scene.npcSystem,spawn=npc.safePlayerSpawn(scene.exploration.spawn);assert.ok(spawn,theme.id+' safe spawn');assert.equal(typeof npc.constrainAirPlayer,'function',theme.id+' airborne collision');
  const canvas=Object.assign(new EventTarget(),{focus(){}}),walk=createWalkControls(new THREE.PerspectiveCamera(),canvas,{constrainMove:(a,b,f)=>f?.airborne?npc.constrainAirPlayer(a,b):npc.constrainPlayer(a,b)});
  walk.start(scene.walkModel,spawn,{mobility:true});assert.equal(walk.toggleRun(),true);assert.equal(walk.jump(),true);let airborne=false;
  for(let i=0;i<120;i++){walk.update(1/60);airborne ||=!walk.groundState.isGrounded;assert.ok(walk.position.every(Number.isFinite));}
  assert.ok(airborne,theme.id+'/'+chapter.id+' jump leaves ground');assert.equal(walk.groundState.isGrounded,true);assert.ok(Math.abs(walk.position[1]-spawn[1])<.001);assert.equal(walk.groundState.running,true);
  walk.setAxis(0,1);for(let i=0;i<60;i++){walk.update(1/60);assert.ok(scene.walkModel.sampleGround(walk.position[0],walk.position[2]),theme.id+' stays in public area');}
  walk.dispose();scene.dispose();count++;
 }
 assert.ok(count>=60,'really visits all chapter configurations: '+count);
});
