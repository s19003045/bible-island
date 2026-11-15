import test from 'node:test';
import {readFileSync,statSync} from 'node:fs';
import {peopleByIsland} from '../src/people-data.js';
import assert from 'node:assert/strict';
import {createHistoricalScene} from '../src/historical-scenes.js';
import {PerspectiveCamera,Vector3,Raycaster,Matrix4} from 'three';
import {createWalkControls} from '../src/walk-controls.js';
import {exodusSegments,exodusObjects,exodusHomeAllowed,crossingPOIs,crossingNPCSurface,exodusFloor} from '../src/exodus-exploration.js';
import {createWalkModel} from '../src/walk-model.js';
import {createConvoySystem} from '../src/convoy-system.js';
import {angleDelta} from '../src/people-motion.js';
import {readExploration,observeObject,writeExploration} from '../src/exploration-progress.js';
import {walkEntry,walkMarkup} from '../src/walk-ui.js';
import {peopleMarkup} from '../src/people-ui.js';
import {freshMission} from '../src/walk-data.js';
import {personForMode,freshLearning,learningRecord} from '../src/learning-model.js';
const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});globalThis.document=Object.assign(new EventTarget(),{createElement:()=>({getContext:()=>ctx}),querySelector:()=>null,activeElement:null});globalThis.window=new EventTarget();
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);

test('each Exodus chapter has its own connected ground, person, object and physical narrative boundary',()=>{
 for(const c of exodusSegments){
  const s=createHistoricalScene('exodus',null,{segment:c.id}),m=s.walkModel;assert.equal(s.people.length,1);assert.equal(s.people[0].id,c.person);assert.equal(s.segment,c.id);assert.equal(s.objects.length,1);assert.ok(m.valid(c.spawn[0],c.spawn[2]));
  for(const other of exodusSegments.filter(o=>o.id!==c.id))assert.equal(m.valid(other.spawn[0],other.spawn[2]),false,`${c.id}/${other.id} is a separate narrative place`);
  const object=s.objects[0],route=m.path(c.spawn,object.approach);assert.ok(route.length>1,object.id);let p=[...c.spawn];
  for(const target of route){let tries=0;while(distance(p,target)>.075){const d=distance(p,target),step=Math.min(.065,d),next=m.move(p,(target[0]-p[0])/d*step,(target[2]-p[2])/d*step);assert.ok(distance(p,next)>.000001,'physical route cannot stall');p=next;assert.ok(++tries<1000);}}
  assert.ok(distance(p,object.approach)<.65);if(c.id==='passover'){assert.ok(p[2]<24.5,'home doorway is traversable');assert.equal(m.valid(-35,21),false,'table remains solid');assert.equal(m.valid(-31,21),false,'house wall remains solid');}
  s.roof.visible=false;if(c.id==='passover')assert.equal(m.valid(-35,17.5),false,'cutaway does not open rear wall');s.dispose();
 }
});

test('work and departure chapters keep separate POI behavior, capacity and social distance for 120 seconds',()=>{
 for(const chapter of ['bricks','passover']){
  const c=exodusSegments.find(c=>c.id===chapter),scene=createHistoricalScene('exodus',null,{segment:chapter}),s=scene.npcSystem;assert.equal(s.agents.length,chapter==='bricks'?19:15);assert.equal(new Set(s.agents.map(a=>a.seed)).size,s.agents.length);
  const visits=new Map(s.agents.map(a=>[a.key,new Set()]));
  for(const poi of s.pois)for(const q of poi.slots)assert.ok(scene.walkModel.valid(q[0],q[2]),poi.id);
  for(let i=0;i<2400;i++){
   s.update(.05,{player:c.spawn});
   for(const [j,a] of s.agents.entries()){
    const p=a.actor.state.position;assert.ok(scene.walkModel.valid(p[0],p[2],p[1]),a.key);if(chapter==='passover')assert.ok(exodusHomeAllowed(a,p));if(a.poi)visits.get(a.key).add(a.poi.id);
    assert.ok(distance(p,c.spawn)>=a.radius+.32+.024);for(const b of s.agents.slice(j+1))assert.ok(distance(p,b.actor.state.position)>=a.radius+b.radius+.024);
   }
   for(const poi of s.pois)assert.ok(s.reservations.get(poi.id).size<=poi.capacity);
  }
  assert.ok([...visits.values()].every(v=>v.size));assert.ok([...visits.values()].filter(v=>v.size>1).length>=s.agents.length*.6);s.suspend();assert.ok([...s.reservations.values()].every(v=>v.size===0));scene.dispose();
 }
});

test('59 crossing people only move forward, avoid the player, reserve capacity and turn smoothly for 120 seconds',()=>{
 const scene=createHistoricalScene('exodus',null,{segment:'crossing'}),s=scene.npcSystem,player=[38,.03,0],previous=new Map(s.agents.map(a=>[a.key,{x:a.actor.state.position[0],yaw:a.actor.state.yaw}]));
 assert.equal(s.agents.length,59);assert.equal(new Set(s.agents.map(a=>a.seed)).size,59);let travel=0;
 for(let i=0;i<2400;i++){
  s.update(.05,{player,camera:[4,1.68,-6.5],isVisible:()=>true});
  for(const [j,a] of s.agents.entries()){
   const p=a.actor.state.position,last=previous.get(a.key);assert.ok(p[0]>=last.x-.000001,a.key+' never reverses');assert.ok(Math.abs(angleDelta(last.yaw,a.actor.state.yaw))<=.110001);assert.ok(a.speedFactor>=.85&&a.speedFactor<=1.15);assert.equal(a.actor.state.animationSpeed,a.speedFactor);
   assert.ok(distance(p,player)>=a.radius+.32+.024);assert.equal(a.partner,null,'no idle chat interrupts the marching group');if(a.state==='travel')travel++;
   for(const b of s.agents.slice(j+1))assert.ok(distance(p,b.actor.state.position)>=a.radius+b.radius+.024);
   previous.set(a.key,{x:p[0],yaw:a.actor.state.yaw});
  }
  for(const poi of s.pois)assert.ok(s.reservations.get(poi.id).size<=poi.capacity);
 }
 assert.ok(travel>10000);assert.ok(s.agents.every(a=>a.actor.state.position[0]>10));s.suspend();assert.ok([...s.reservations.values()].every(v=>v.size===0));scene.dispose();
});

test('convoy pooling never wraps a visible person and re-enters only offscreen with independent timers',()=>{
 const model=createWalkModel([],crossingNPCSurface,exodusFloor,{proxies:[]}),playerModel=createWalkModel([],exodusSegments[2].surfaces,exodusFloor,{proxies:[]}),events=[];
 const actors=Array.from({length:12},(_,i)=>({scale:1,state:{position:[488+i*2,.03,(i%5-2)*2.8],yaw:Math.PI/2,stride:0,time:0}}));
 const s=createConvoySystem({actors,pois:crossingPOIs,model,playerModel,onEvent:e=>events.push(e)});
 for(let i=0;i<1800;i++)s.update(.05,{camera:[4,1.68,0],player:[4,.03,-6.5],isVisible:()=>true});
 assert.ok(s.agents.every(a=>!a.hidden&&a.lap===0));assert.equal(events.filter(e=>e.type==='exit').length,0);
 for(let i=0;i<1500;i++)s.update(.05,{camera:[4,1.68,0],player:[4,.03,-6.5],isVisible:()=>false});
 const exits=events.filter(e=>e.type==='exit'),enters=events.filter(e=>e.type==='enter');assert.ok(exits.length>=8);assert.ok(enters.length>=8);assert.ok(new Set(enters.map(e=>e.time)).size>6);assert.ok(s.agents.filter(a=>a.lap>0).every(a=>a.actor.state.position[0]<100));s.dispose();
});

test('Exodus chapter controls expose one matching person and preserve all three observations without awarding reading',()=>{
 const memory=new Map(),storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)};let records={herod:['herod-boundary'],solomon:['solomon-sea']};
 for(const o of exodusObjects)records=observeObject(records,'exodus',o.id);writeExploration(storage,records);assert.deepEqual(readExploration(storage),records);
 for(const c of exodusSegments)for(const mode of ['general','child','study']){
  const state={selected:'exodus',exodusSegment:c.id,mode,mission:freshMission(),explorationSeen:records,actor:null};
  const html=walkMarkup(state),entry=walkEntry(true,'exodus',c.id),people=peopleMarkup(state);assert.equal((entry.match(/data-exodus-segment=/g)||[]).length,3);assert.match(html,/器物觀察 1 \/ 1/);assert.match(html,new RegExp(`data-walk-person="${c.person}"`));assert.equal((people.match(/data-person=/g)||[]).length,1);assert.match(html,/id="walk-learning-return"/);assert.deepEqual(learningRecord(freshLearning(),'exodus',mode).completed,[]);
 }
});


test('all 24 Exodus recordings preserve exact dialogue and valid local chapter cue intervals',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../src/voice-manifest.json',import.meta.url)));
 for(const p of peopleByIsland.exodus){
  const expected={greeting:p.greeting};for(const t of p.topics){expected[t.id]=t.answer;if(t.followup)expected[t.id+'-followup']=t.followup.answer;}
  const child=personForMode(p,'exodus','child');expected['child-greeting']=child.greeting;for(const t of child.topics){expected['child-'+t.id]=t.answer;if(t.followup)expected['child-'+t.id+'-followup']=t.followup.answer;}
  const voice=manifest[p.id];assert.deepEqual(Object.keys(voice.clips).sort(),Object.keys(expected).sort());assert.ok(statSync(new URL('../public/'+voice.src,import.meta.url)).size>100000);let end=0;
  for(const [id,cue] of Object.entries(voice.clips)){assert.equal(cue.text,expected[id]);assert.ok(cue.start>=end&&cue.end>cue.start&&cue.end<=voice.duration);end=cue.end;}
 }
});


test('guided exploration reaches every chapter object through mature moving crowds without overlap',()=>{
 for(const c of exodusSegments){
  const scene=createHistoricalScene('exodus',null,{segment:c.id}),s=scene.npcSystem;for(let i=0;i<2400;i++)s.update(.05);
  const canvas=Object.assign(new EventTarget(),{focus(){}}),walk=createWalkControls(new PerspectiveCamera(),canvas,{constrainMove:(a,b)=>s.constrainPlayer(a,b),navigationObstacles:()=>s.agents.filter(a=>!a.hidden).map(a=>({position:a.actor.state.position,radius:a.radius+.32+.07}))});
  const spawn=s.safePlayerSpawn(c.spawn),destination=scene.objects[0].approach;assert.ok(spawn);walk.start(scene.walkModel,spawn);assert.equal(walk.navigate(destination),true,c.id);
  for(let i=0;i<4800&&distance(walk.position,destination)>.65;i++){s.update(.05,{player:walk.position});walk.update(.05);for(const a of s.agents)if(!a.hidden)assert.ok(distance(walk.position,a.actor.state.position)>=a.radius+.32+.024,c.id);}
  assert.ok(distance(walk.position,destination)<.65,`${c.id} final ${walk.position}`);assert.equal(walk.groundState.isGrounded,true);walk.dispose();scene.dispose();
 }
});


test('moving people remain body-clickable outside their original batch bounds and offstage rendering stays finite',()=>{
 const scene=createHistoricalScene('exodus',null,{segment:'bricks'}),person=scene.people[0];person.state.position=[-68,.03,-22];scene.animate(0,null);scene.updateRaycastBounds();scene.scene.updateMatrixWorld(true);
 const meshes=[];scene.scene.traverseVisible(o=>{if(o.isMesh)meshes.push(o);});const target=new Vector3(-68,1.48,-22),ray=new Raycaster(target.clone().add(new Vector3(0,0,3)),new Vector3(0,0,-1));
 const hit=ray.intersectObjects(meshes,false).find(h=>h.object.userData.actorInstances?.[h.instanceId]===person.id);assert.ok(hit,'rendered person remains a ray target after moving outside initial crowd extent');scene.dispose();
 const crossing=createHistoricalScene('exodus',null,{segment:'crossing'}),agent=crossing.npcSystem.agents.find(a=>!a.actor.id);agent.actor.state.position=[520,.03,6.6];crossing.animate(.05,[4,1.68,0],null,()=>false);assert.equal(agent.hidden,true);const matrix=new Matrix4();
 crossing.scene.traverse(o=>{if(o.isInstancedMesh)for(let i=0;i<o.count;i++){o.getMatrixAt(i,matrix);assert.ok(matrix.elements.every(Number.isFinite));assert.ok(matrix.determinant()>0);}});crossing.dispose();
});
