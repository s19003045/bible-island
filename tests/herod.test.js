import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {createHistoricalScene} from '../src/historical-scenes.js';
import {createCharacterController} from '../src/character-controller.js';
import {herodSpawn,herodFloor,herodPOIs,herodAllowed,herodObjects} from '../src/herod-exploration.js';
import {peopleByIsland} from '../src/people-data.js';
import {personForMode,freshLearning,learningRecord} from '../src/learning-model.js';
import {readExploration,observeObject,writeExploration} from '../src/exploration-progress.js';
import {walkMarkup} from '../src/walk-ui.js';
import {freshMission} from '../src/walk-data.js';
import {PerspectiveCamera} from 'three';
import {createWalkControls} from '../src/walk-controls.js';
const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});globalThis.document=Object.assign(new EventTarget(),{createElement:()=>({getContext:()=>ctx}),querySelector:()=>null,activeElement:null});globalThis.window=new EventTarget();
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);

test('Herod public route connects stair, boundary, craft and colonnade while keeping inner courts and displays solid',()=>{
 const s=createHistoricalScene('herod',null),m=s.walkModel;assert.ok(m.valid(herodSpawn[0],herodSpawn[2]));
 for(const [x,z] of [[0,0],[70,0],[80,42],[121,60],[94,-60],[81,46.5],[31,-88]])assert.equal(m.valid(x,z),false,`${x},${z}`);
 for(const poi of herodPOIs)for(const p of poi.slots)assert.ok(m.valid(p[0],p[2]),`${poi.id}/${p}`);
 for(const object of herodObjects){
  const route=m.path(herodSpawn,object.approach);assert.ok(route.length>1,object.id);let position=[...herodSpawn];
  for(const point of route){let tries=0;while(distance(point,position)>.08){const d=distance(point,position),amount=Math.min(.07,d),next=m.move(position,(point[0]-position[0])/d*amount,(point[2]-position[2])/d*amount);assert.ok(distance(position,next)>.00001,'route remains physically traversable');position=next;assert.ok(++tries<2000);}}
  assert.ok(distance(position,object.approach)<.65,object.id);
 }
 s.roof.visible=false;assert.equal(m.valid(70,0),false);s.dispose();
});

test('all 28 Herod approach risers have continuous grounded ascent and descent at 30, 60 and 120 fps',()=>{
 const s=createHistoricalScene('herod',null),m=s.walkModel;
 for(const fps of [30,60,120]){
  const c=createCharacterController(m);c.reset([68,herodFloor(68,130.5),130.5]);let up=false,down=false,snap=false,previous=c.visualPosition[1];
  for(const direction of [-1,1])for(let i=0;i<fps*22;i++){
   const amount=direction*1.85/fps*c.speedFactor(0,direction);c.update(1/fps,0,amount);
   assert.equal(c.state.isGrounded,true);assert.ok(Math.abs(c.position[1]-m.heightAt(c.position[0],c.position[2]))<.001);
   assert.ok(Math.abs(c.visualPosition[1]-previous)<.07,'no abrupt camera height');previous=c.visualPosition[1];
   up ||=c.state.animation==='stairs-up';down ||=c.state.animation==='stairs-down';snap ||=c.state.groundSnapApplied;
   if(c.state.verticalDirection>0&&c.state.slopeAngle>1)assert.equal(c.state.speedFactor,.8);
  }
  assert.ok(up&&down&&snap);assert.ok(c.position[2]>129.5);assert.ok(Math.abs(c.position[1]-.03)<.001);
 }
 s.dispose();
});

test('51 Herod people keep independent public-area journeys, capacity and social distance for 120 seconds',()=>{
 const scene=createHistoricalScene('herod',null),s=scene.npcSystem,visits=new Map(s.agents.map(a=>[a.key,new Set()]));let chats=0;
 assert.equal(s.agents.length,51);assert.equal(new Set(s.agents.map(a=>a.seed)).size,51);assert.ok(new Set(s.agents.map(a=>a.timer)).size>45);
 for(let i=0;i<2400;i++){
  s.update(.05,{player:herodSpawn});
  for(const [index,a] of s.agents.entries()){
   const p=a.actor.state.position;assert.ok(herodAllowed(a,p),a.key);assert.ok(scene.walkModel.valid(p[0],p[2],p[1]));assert.ok(a.speedFactor>=.85&&a.speedFactor<=1.15);
   if(a.poi)visits.get(a.key).add(a.poi.id);if(a.partner)chats++;
   assert.ok(distance(p,herodSpawn)>=a.radius+.32+.024);
   for(const b of s.agents.slice(index+1))if(Math.abs(p[1]-b.actor.state.position[1])<1.7)assert.ok(distance(p,b.actor.state.position)>=a.radius+b.radius+.024);
  }
  for(const poi of s.pois)assert.ok(s.reservations.get(poi.id).size<=poi.capacity);
 }
 assert.ok(chats>0);assert.ok([...visits.values()].every(v=>v.size>=1));assert.ok([...visits.values()].filter(v=>v.size>1).length>=35);
 s.suspend();assert.ok([...s.reservations.values()].every(v=>v.size===0));scene.dispose();
});

test('Herod voice cues match all exact general and child lines and their local audio intervals',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../src/voice-manifest.json',import.meta.url)));
 for(const p of peopleByIsland.herod){
  const expected={greeting:p.greeting};for(const t of p.topics){expected[t.id]=t.answer;if(t.followup)expected[t.id+'-followup']=t.followup.answer;}
  const child=personForMode(p,'herod','child');expected['child-greeting']=child.greeting;for(const t of child.topics){expected['child-'+t.id]=t.answer;expected['child-'+t.id+'-followup']=t.followup.answer;}
  const voice=manifest[p.id];assert.deepEqual(Object.keys(voice.clips).sort(),Object.keys(expected).sort());assert.ok(statSync(new URL('../public/'+voice.src,import.meta.url)).size>100000);let end=0;
  for(const [id,cue] of Object.entries(voice.clips)){assert.equal(cue.text,expected[id]);assert.ok(cue.start>=end&&cue.end>cue.start&&cue.end<=voice.duration);end=cue.end;}
 }
});

test('Herod observations and mode return actions preserve existing islands without awarding reading completion',()=>{
 const memory=new Map(),storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)},before={tabernacle:['woven-sample'],solomon:['solomon-sea'],jerusalem:['clay-vessel']};writeExploration(storage,before);
 let observations=readExploration(storage);for(const o of herodObjects)observations=observeObject(observations,'herod',o.id);writeExploration(storage,observations);
 assert.deepEqual(readExploration(storage),{...before,herod:herodObjects.map(o=>o.id)});
 const learning=freshLearning();for(const mode of ['general','child','study']){assert.deepEqual(learningRecord(learning,'herod',mode).completed,[]);const html=walkMarkup({selected:'herod',mode,mission:freshMission(),explorationSeen:observations});assert.match(html,/id="walk-learning-return"/);assert.match(html,/data-walk-object="herod-boundary"/);assert.doesNotMatch(html,/id="walk-reflect"/);}
});


test('guided public walking follows the full Herod approach through moving people without blocking forever',()=>{
 const scene=createHistoricalScene('herod',null),s=scene.npcSystem;for(let i=0;i<2400;i++)s.update(.05);
 const canvas=Object.assign(new EventTarget(),{focus(){}}),walk=createWalkControls(new PerspectiveCamera(),canvas,{constrainMove:(a,b)=>s.constrainPlayer(a,b),navigationObstacles:()=>s.agents.map(a=>({position:a.actor.state.position,radius:a.radius+.32+.07}))});
 const spawn=s.safePlayerSpawn(herodSpawn);assert.ok(spawn);walk.start(scene.walkModel,spawn);const destination=herodObjects.find(o=>o.id==='herod-capital').approach;assert.equal(walk.navigate(destination),true);
 for(let i=0;i<7200&&distance(walk.position,destination)>.65;i++){s.update(.05,{player:walk.position});walk.update(.05);for(const a of s.agents)if(Math.abs(a.actor.state.position[1]-walk.position[1])<1.7)assert.ok(distance(walk.position,a.actor.state.position)>=a.radius+.32+.024);}
 assert.ok(distance(walk.position,destination)<.65,`final ${walk.position}`);assert.equal(walk.groundState.isGrounded,true);walk.dispose();scene.dispose();
});
