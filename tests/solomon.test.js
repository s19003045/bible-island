import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {createHistoricalScene} from '../src/historical-scenes.js';
import {createCharacterController} from '../src/character-controller.js';
import {solomonPOIs,solomonSpawn,solomonAllowed,solomonObjects} from '../src/solomon-exploration.js';
import {peopleByIsland} from '../src/people-data.js';
import {personForMode,freshLearning,learningRecord} from '../src/learning-model.js';
import {readExploration,observeObject,writeExploration} from '../src/exploration-progress.js';
import {walkMarkup} from '../src/walk-ui.js';
import {freshMission} from '../src/walk-data.js';
import {scriptureLinks} from '../src/scripture.js';
import {PerspectiveCamera} from 'three';
import {createWalkControls} from '../src/walk-controls.js';
const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});globalThis.document=Object.assign(new EventTarget(),{createElement:()=>({getContext:()=>ctx}),querySelector:()=>null,activeElement:null});globalThis.window=new EventTarget();
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);

test('Solomon court routes reach every display while inner rooms, altar and worktables stay solid',()=>{
 const scene=createHistoricalScene('solomon',null),model=scene.walkModel;
 assert.ok(model.valid(solomonSpawn[0],solomonSpawn[2]));
 for(const [x,z] of [[11,0],[24,-2],[28.8,-2],[32,-12],[14.1,0],[22,12]])assert.equal(model.valid(x,z),false,`${x},${z}`);
 for(const poi of solomonPOIs)for(const p of poi.slots)assert.ok(model.valid(p[0],p[2]),poi.id);
 for(const object of solomonObjects){
  const route=model.path(solomonSpawn,object.approach);assert.ok(route.length>1);let position=[...solomonSpawn];
  for(const point of route){let tries=0;while(distance(point,position)>.08){const d=distance(point,position),amount=Math.min(.06,d),next=model.move(position,(point[0]-position[0])/d*amount,(point[2]-position[2])/d*amount);assert.ok(distance(next,position)>.00001,'path must be physically traversable');position=next;assert.ok(++tries<1000);}}
  assert.ok(distance(position,object.approach)<.45);
 }
 scene.roof.visible=false;assert.equal(model.valid(11,0),false,'cutaway never opens a walking portal');scene.dispose();
});

test('actual Solomon flight remains grounded up and down, with smooth visual height at 30, 60 and 120 fps',()=>{
 const scene=createHistoricalScene('solomon',null),model=scene.walkModel;
 for(const fps of [30,60,120]){
  const c=createCharacterController(model);c.reset([19,.31,0]);let up=false,down=false,snap=false,previous=c.visualPosition[1];
  for(const direction of [-1,1])for(let i=0;i<fps*2;i++){
   const amount=direction*1.6/fps*c.speedFactor(direction,0);c.update(1/fps,amount,0);
   assert.equal(c.state.isGrounded,true);assert.ok(Math.abs(c.position[1]-model.heightAt(c.position[0],c.position[2]))<.001);
   assert.ok(Math.abs(c.visualPosition[1]-previous)<.09,'visual frame must not pop at a riser');previous=c.visualPosition[1];
   up ||=c.state.animation==='stairs-up';down ||=c.state.animation==='stairs-down';snap ||=c.state.groundSnapApplied;
   if(c.state.verticalDirection>0&&c.state.slopeAngle>1)assert.equal(c.state.speedFactor,.8);
  }
  assert.ok(up&&down&&snap);assert.ok(c.position[0]>18.5);assert.ok(Math.abs(c.position[1]-.31)<.001);
 }
 scene.dispose();
});

test('35 Solomon agents retain independent role journeys, capacity and social distance for 120 seconds',()=>{
 const scene=createHistoricalScene('solomon',null),s=scene.npcSystem,visits=new Map(s.agents.map(a=>[a.key,new Set()]));let social=0;
 assert.equal(s.agents.length,35);assert.equal(new Set(s.agents.map(a=>a.seed)).size,35);
 for(let i=0;i<2400;i++){
  s.update(.05,{player:solomonSpawn});
  for(const [j,a] of s.agents.entries()){
   const p=a.actor.state.position;assert.ok(solomonAllowed(a,p),a.key);assert.ok(scene.walkModel.valid(p[0],p[2],p[1]));
   if(a.poi)visits.get(a.key).add(a.poi.id);if(a.partner)social++;
   assert.ok(distance(p,solomonSpawn)>=a.radius+.32+.024);
   for(const b of s.agents.slice(j+1))assert.ok(distance(p,b.actor.state.position)>=a.radius+b.radius+.024);
  }
  for(const poi of s.pois)assert.ok(s.reservations.get(poi.id).size<=poi.capacity);
 }
 assert.ok(social>0);assert.ok([...visits.values()].every(v=>v.size>=1));assert.ok([...visits.values()].filter(v=>v.size>1).length>=32,'most agents should reach a second distinct POI within two minutes');s.suspend();assert.ok([...s.reservations.values()].every(r=>r.size===0));scene.dispose();
});

test('Solomon recordings exactly match general and child dialogue with local, non-overlapping cue intervals',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../src/voice-manifest.json',import.meta.url)));
 for(const person of peopleByIsland.solomon){
  const entry=manifest[person.id],expected={greeting:person.greeting};
  for(const t of person.topics){expected[t.id]=t.answer;if(t.followup)expected[t.id+'-followup']=t.followup.answer;}
  const child=personForMode(person,'solomon','child');expected['child-greeting']=child.greeting;
  for(const t of child.topics){expected['child-'+t.id]=t.answer;expected['child-'+t.id+'-followup']=t.followup.answer;}
  assert.deepEqual(Object.keys(entry.clips).sort(),Object.keys(expected).sort());assert.ok(statSync(new URL('../public/'+entry.src,import.meta.url)).size>100000);let end=0;
  for(const [key,cue] of Object.entries(entry.clips)){assert.equal(cue.text,expected[key]);assert.ok(cue.start>=end-.06&&cue.end>cue.start&&cue.end<=entry.duration);end=cue.end;}
 }
 for(const o of solomonObjects)assert.ok(scriptureLinks(o.passage).every(p=>p.url.endsWith('.CSBT')));
});

test('Solomon observations coexist with saved camp and city progress, without awarding learning completion',()=>{
 const original={tabernacle:['woven-sample'],jerusalem:['clay-vessel']},records=observeObject(original,'solomon','solomon-sea');
 assert.deepEqual(original,{tabernacle:['woven-sample'],jerusalem:['clay-vessel']});assert.equal(observeObject(records,'solomon','woven-sample'),records);
 let saved;const storage={setItem(k,v){saved=v;},getItem(){return saved;}};writeExploration(storage,records);assert.deepEqual(readExploration(storage),records);
 for(const mode of ['general','child','study']){
  assert.deepEqual(learningRecord(freshLearning(),'solomon',mode).completed,[]);
  const markup=walkMarkup({selected:'solomon',mode,mission:freshMission(),explorationSeen:records});assert.ok(markup.includes('id="walk-learning-return"'));assert.ok(markup.includes('1 / 3'));assert.ok(markup.includes('data-walk-object="pillar-capital"'));assert.ok(!markup.includes('id="walk-guide"'));
 }
});

test('guided walking reaches the sea through a mature crowd rather than waiting forever behind a resting NPC',()=>{
 const scene=createHistoricalScene('solomon',null),s=scene.npcSystem;
 // This late crowd arrangement blocked the original static route indefinitely.
 for(let i=0;i<9600;i++)s.update(.05);
 const canvas=Object.assign(new EventTarget(),{focus(){}}),messages=[];
 const control=createWalkControls(new PerspectiveCamera(),canvas,{onMessage:m=>messages.push(m),constrainMove:(a,b)=>s.constrainPlayer(a,b),navigationObstacles:()=>s.agents.map(a=>({position:a.actor.state.position,radius:a.radius+.39}))});
 // The scene keeps running before entry, so use the same safe arrival lookup as
 // world.startWalking rather than teleport into an NPC now crossing the gate.
 const spawn=s.safePlayerSpawn(solomonSpawn);assert.ok(spawn);
 assert.ok(s.agents.every(a=>distance(spawn,a.actor.state.position)>a.radius+.32+.1));
 control.start(scene.walkModel,spawn);assert.ok(control.navigate(solomonObjects[1].approach));
 for(let i=0;i<2400;i++){
  s.update(.05,{player:control.position});control.update(.05);
  assert.equal(control.groundState.isGrounded,true);
  for(const a of s.agents)assert.ok(distance(control.position,a.actor.state.position)>=a.radius+.32+.024);
 }
 assert.equal(control.navigating,false);assert.ok(distance(control.position,solomonObjects[1].approach)<.5);assert.ok(distance(control.position,solomonObjects[1].position)<=3.2,'route arrival must be within interaction range');assert.deepEqual(messages,[]);
 control.dispose();scene.dispose();
});
