import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {createHistoricalScene} from '../src/historical-scenes.js';
import {tabernaclePOIs,tabernacleSpawn,tabernacleAllowed,tabernacleObjects} from '../src/tabernacle-exploration.js';
import {peopleByIsland} from '../src/people-data.js';
import {personForMode,freshLearning,learningRecord} from '../src/learning-model.js';
import {readExploration,observeObject,writeExploration} from '../src/exploration-progress.js';
import {walkMarkup} from '../src/walk-ui.js';
import {freshMission} from '../src/walk-data.js';
import {scriptureLinks} from '../src/scripture.js';
const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});globalThis.document={createElement:()=>({getContext:()=>ctx})};
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);

test('camp routes reach craft tables, basin and priest without entering the sanctuary or walking through tables',()=>{
 const scene=createHistoricalScene('tabernacle',null),model=scene.walkModel;
 assert.equal(scene.objects.length,3);assert.ok(model.valid(...[tabernacleSpawn[0],tabernacleSpawn[2]]));
 assert.equal(model.valid(-6,0),false);assert.equal(model.valid(31,6),false);assert.equal(model.valid(31,-6),false);
 for(const poi of tabernaclePOIs)for(const p of poi.slots)assert.ok(model.valid(p[0],p[2]),poi.id);
 for(const target of [...tabernacleObjects.map(o=>o.approach),[6,.02,-2.2]]){
  const route=model.path(tabernacleSpawn,target);assert.ok(route.length>1);let position=[...tabernacleSpawn];
  for(const point of route){let steps=0;while(distance(point,position)>.12){const d=distance(point,position),amount=Math.min(.06,d),next=model.move(position,(point[0]-position[0])/d*amount,(point[2]-position[2])/d*amount);assert.ok(distance(next,position)>.00001,'route must be physically traversable');position=next;assert.ok(++steps<1000);}}
  assert.ok(distance(position,target)<.45);
 }
 assert.ok(model.move([1,.02,0],-10,0)[0]>.5,'sanctuary boundary remains closed');scene.dispose();
});

test('all camp agents keep independent POI journeys, their role areas and social distance for 120 seconds',()=>{
 const scene=createHistoricalScene('tabernacle',null),s=scene.npcSystem,visits=new Map(s.agents.map(a=>[a.key,new Set()]));let social=0;
 assert.equal(s.agents.length,31);assert.equal(new Set(s.agents.map(a=>a.seed)).size,31);
 for(let i=0;i<2400;i++){
  s.update(.05,{player:tabernacleSpawn});
  for(const [j,a] of s.agents.entries()){
   const p=a.actor.state.position;assert.ok(tabernacleAllowed(a,p),a.key);assert.ok(scene.walkModel.valid(p[0],p[2],p[1]));
   if(a.poi)visits.get(a.key).add(a.poi.id);if(a.partner)social++;
   assert.ok(distance(p,tabernacleSpawn)>=a.radius+.32+.024);
   for(const b of s.agents.slice(j+1))assert.ok(distance(p,b.actor.state.position)>=a.radius+b.radius+.024);
  }
  for(const poi of s.pois)assert.ok(s.reservations.get(poi.id).size<=poi.capacity);
 }
 assert.ok(social>0);assert.ok([...visits.values()].every(v=>v.size>1));
 s.suspend();assert.ok([...s.reservations.values()].every(r=>r.size===0));
 for(let i=0;i<200;i++)s.update(.05);assert.ok(s.agents.some(a=>a.poi),'cached scene can resume after releasing reservations');scene.dispose();
});

test('camp recorded lines match the exact general and child scripts and have valid local cue intervals',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../src/voice-manifest.json',import.meta.url)));
 for(const person of peopleByIsland.tabernacle){
  const entry=manifest[person.id],expected={greeting:person.greeting};
  for(const t of person.topics){expected[t.id]=t.answer;if(t.followup)expected[t.id+'-followup']=t.followup.answer;}
  const child=personForMode(person,'tabernacle','child');expected['child-greeting']=child.greeting;
  for(const t of child.topics){expected['child-'+t.id]=t.answer;expected['child-'+t.id+'-followup']=t.followup.answer;}
  assert.deepEqual(Object.keys(entry.clips).sort(),Object.keys(expected).sort());
  assert.ok(statSync(new URL('../public/'+entry.src,import.meta.url)).size>100000);let end=0;
  for(const [key,cue] of Object.entries(entry.clips)){assert.equal(cue.text,expected[key]);assert.ok(cue.start>=end-.06&&cue.end>cue.start&&cue.end<=entry.duration);end=cue.end;}
 }
 for(const o of tabernacleObjects)assert.ok(scriptureLinks(o.passage).every(p=>p.url.endsWith('.CSBT')));
});

test('object observations persist separately and cannot award reading completion or unlock another island',()=>{
 const original={},records=observeObject(observeObject(original,'tabernacle','woven-sample'),'tabernacle','woven-sample');assert.deepEqual(original,{});assert.deepEqual(records,{tabernacle:['woven-sample']});
 assert.equal(observeObject(records,'tabernacle','stone-vessel'),records);
 let saved;const storage={setItem(k,v){saved=v;},getItem(){return saved;}};writeExploration(storage,records);assert.deepEqual(readExploration(storage),records);
 for(const bad of [null,{getItem(){throw Error('blocked');}},{getItem(){return 'null';}},{getItem(){return 'bad json';}}])assert.deepEqual(readExploration(bad),{});
 assert.deepEqual(learningRecord(freshLearning(),'tabernacle','child').completed,[]);
 for(const mode of ['general','child','study']){
  const markup=walkMarkup({selected:'tabernacle',mode,mission:freshMission(),explorationSeen:records});assert.ok(markup.includes('id="walk-learning-return"'));assert.ok(markup.includes('1 / 3'));assert.ok(!markup.includes('id="walk-guide"'));assert.ok(markup.includes('id="music-toggle"'));
 }
});
