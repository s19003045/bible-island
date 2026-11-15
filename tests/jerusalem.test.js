import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {PerspectiveCamera} from 'three';
import {MISSION_KEY,readMission,writeMission,freshMission,missionStage,vesselDefinitions,walkSpawn} from '../src/walk-data.js';
import {peopleByIsland} from '../src/people-data.js';
import {personForMode} from '../src/learning-model.js';
import {walkMarkup} from '../src/walk-ui.js';
import {createHistoricalScene} from '../src/historical-scenes.js';
import {createWalkControls} from '../src/walk-controls.js';
const context=new Proxy({},{get:()=>()=>{},set:()=>true});globalThis.document=Object.assign(new EventTarget(),{createElement:()=>({getContext:()=>context}),querySelector:()=>null,activeElement:null});globalThis.window=new EventTarget();
const hash=data=>createHash('sha256').update(data).digest('hex');
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);

test('Jerusalem reads every legacy mission stage, keeps its storage key and cannot award completion from corrupt saves',()=>{
 const records=[freshMission(),{listen:true,observed:[],ask:false,complete:false},{listen:true,observed:['clay-vessel','stone-vessel'],ask:false,complete:false},{listen:true,observed:['clay-vessel','stone-vessel'],ask:true,complete:false},{listen:true,observed:['clay-vessel','stone-vessel'],ask:true,complete:true}];
 const memory=new Map([['bible-island:learning:v1','existing note'],['bible-island:progress:v1','existing favourites']]),storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)};
 for(const [index,record] of records.entries()){memory.set(MISSION_KEY,JSON.stringify(record));assert.deepEqual(readMission(storage),record);assert.equal(missionStage(readMission(storage)),index);assert.equal(writeMission(storage,record),true);assert.deepEqual(readMission(storage),record);}
 assert.equal(memory.get('bible-island:learning:v1'),'existing note');assert.equal(memory.get('bible-island:progress:v1'),'existing favourites');
 memory.set(MISSION_KEY,JSON.stringify({listen:false,observed:['unknown','clay-vessel','clay-vessel'],ask:true,complete:true}));assert.deepEqual(readMission(storage),{listen:false,observed:['clay-vessel'],ask:true,complete:false});
 for(const bad of [null,{getItem(){throw Error('blocked');}},{getItem(){return '{';}}])assert.deepEqual(readMission(bad),freshMission());assert.equal(writeMission(null,freshMission()),false);assert.equal(writeMission({setItem(){throw Error('full');}},freshMission()),false);
});

test('original Jerusalem voice files and cue contracts stay unchanged while all nine child cues have exact separate assets',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../src/voice-manifest.json',import.meta.url))),original={
  householder:['8c4560bf8b08ab55ccbfc4aad796ea7bb35d93cb431128f07aedc5049b8c98e4','629c61b1fb226737e12ed4f057f3761bae2724f0569c1579bfc5c81cc78cf7f8'],
  'water-carrier':['97eb72a7116f21e0e76b0858b6ecdeab26ba9ed59932f529edd3565fa474a877','acfdc6038879232d9f5ba43041521f98d4a07c6ab7cf9c4c366be072dc96e007'],
  'street-vendor':['0309042d6f668efc8cb1e5d859dc2183e8ed608dcc802dcfda197010ce168ec3','dc3ad794585946724d0f24c72487c20eef3b1bab5b3e32717cf40a864fd2459f'],
 };
 for(const person of peopleByIsland.jerusalem){
  const entry=manifest[person.id],legacy={...entry,clips:Object.fromEntries(Object.entries(entry.clips).filter(([key])=>!key.startsWith('child-')))};assert.equal(hash(JSON.stringify(legacy)),original[person.id][0]);assert.equal(hash(readFileSync(new URL('../public/'+entry.src,import.meta.url))),original[person.id][1]);
  const child=personForMode(person,'jerusalem','child'),expected={'child-greeting':child.greeting};for(const topic of child.topics){expected['child-'+topic.id]=topic.answer;expected['child-'+topic.id+'-followup']=topic.followup.answer;}
  const cues=Object.entries(entry.clips).filter(([key])=>key.startsWith('child-'));assert.deepEqual(cues.map(([key])=>key).sort(),Object.keys(expected).sort());let end=0;
  for(const [key,cue] of cues){assert.equal(cue.text,expected[key]);assert.ok(cue.src.endsWith(person.id+'-child.mp3'));assert.notEqual(cue.src,entry.src);assert.ok(statSync(new URL('../public/'+cue.src,import.meta.url)).size>100000);assert.ok(cue.start>=end&&cue.end>cue.start&&cue.end<=cue.duration);end=cue.end;}
 }
});

test('Jerusalem keeps its four-stage general mission and gives child/study the same objects and return route as other islands',()=>{
 for(const mode of ['child','study']){const html=walkMarkup({selected:'jerusalem',mode,mission:freshMission(),explorationSeen:{jerusalem:['clay-vessel','stone-vessel']}});assert.match(html,/器物觀察 2 \/ 2/);assert.equal((html.match(/data-walk-object=/g)||[]).length,2);assert.equal((html.match(/data-walk-person=/g)||[]).length,3);assert.match(html,/id="walk-learning-return"/);assert.doesNotMatch(html,/id="walk-guide"/);}
 const html=walkMarkup({selected:'jerusalem',mode:'general',mission:freshMission()});assert.match(html,/小旅程/);assert.match(html,/1 \/ 4/);assert.match(html,/id="walk-guide"/);for(const object of vesselDefinitions)assert.equal(object.stop,'house');
});

test('guided courtyard approach still passes through 50 mature POI people while staying grounded and separated',()=>{
 for(const warmup of [0,60]){const scene=createHistoricalScene('jerusalem',null),system=scene.npcSystem;assert.equal(system.agents.length,50);assert.equal(system.pois.length,24);assert.equal(system.pois.reduce((n,p)=>n+p.capacity,0),57);for(let i=0;i<warmup*20;i++)system.update(.05);
 const canvas=Object.assign(new EventTarget(),{focus(){}}),walk=createWalkControls(new PerspectiveCamera(),canvas,{constrainMove:(a,b)=>system.constrainPlayer(a,b),navigationObstacles:()=>system.agents.map(a=>({position:a.actor.state.position,radius:a.radius+.32+.07}))});
 const spawn=system.safePlayerSpawn(walkSpawn),target=vesselDefinitions[0].approach;assert.ok(spawn);walk.start(scene.walkModel,spawn);assert.equal(walk.navigate(target),true);
 for(let i=0;i<4800&&distance(walk.position,target)>.65;i++){system.update(.05,{player:walk.position});walk.update(.05);assert.equal(walk.groundState.isGrounded,true);for(const a of system.agents){const p=a.actor.state.position;assert.ok(distance(walk.position,p)>=a.radius+.32+.024);assert.ok(Math.abs(p[1]-scene.walkModel.heightAt(p[0],p[2]))<.06,'separation must not push street people up exterior stair edges');}}
 assert.ok(distance(walk.position,target)<.65,`${warmup}: ${walk.position}`);walk.dispose();system.suspend();assert.ok([...system.reservations.values()].every(v=>v.size===0));scene.dispose();}
});
