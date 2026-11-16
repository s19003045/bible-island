import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {PerspectiveCamera} from 'three';
const bundle=await build({entryPoints:[new URL('../src/scene-audio.js',import.meta.url).pathname],bundle:true,format:'esm',platform:'node',write:false,logLevel:'silent'});
const {createSceneAudio}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
function fixture(){
 const param=()=>({value:0,setTargetAtTime(n){this.value=n;},setValueAtTime(n){this.value=n;},exponentialRampToValueAtTime(n){this.value=n;},linearRampToValueAtTime(n){this.value=n;}});
 const node=()=>({connect(n){this.output=n;},disconnect(){this.disconnected=true;},start(...args){this.started=args;},stop(){this.stopped=true;}});
 let context;const fetched=[];
 class MockContext{
  constructor(){context=this;this.currentTime=0;this.sampleRate=100;this.state='running';this.destination=node();this.sources=[];this.panners=[];this.gains=[];this.filters=[];this.listener={};for(const prefix of ['position','forward','up'])for(const axis of ['X','Y','Z'])this.listener[prefix+axis]=param();}
  createGain(){const n={...node(),gain:param()};this.gains.push(n);return n;}
  createPanner(){const n={...node(),positionX:param(),positionY:param(),positionZ:param()};this.panners.push(n);return n;}
  createBuffer(channels,count,rate){return {duration:count/rate,getChannelData:()=>new Float32Array(count)};}
  createBufferSource(){const n=node();this.sources.push(n);return n;}
  createBiquadFilter(){const n={...node(),frequency:param(),Q:param()};this.filters.push(n);return n;}
  createOscillator(){return {...node(),frequency:param()};}
  async resume(){this.state='running';}async close(){this.state='closed';}
  async decodeAudioData(){return {duration:100};}
 }
 globalThis.window={AudioContext:MockContext};globalThis.document={baseURI:'http://localhost:5173/'};globalThis.fetch=async url=>{fetched.push(String(url));return {ok:true,arrayBuffer:async()=>new ArrayBuffer(1)};};
 return {get context(){return context;},fetched};
}

test('chapter audio cancels old spatial effects and speech, preserves independent mix, and mutes on page hiding',async()=>{
 const f=fixture(),events=[],audio=createSceneAudio(s=>events.push(s));audio.setScene('exodus','crossing');await audio.enable();audio.setActive(true);audio.update(new PerspectiveCamera(),[],5000);
 const wash=f.context.sources.at(-1);assert.ok(wash.started);assert.ok(f.context.panners.some(p=>p.positionX.value===35&&p.positionZ.value===9.5));
 await audio.speak('traveler','greeting',[18,1.5,-3]);const spoken=f.context.sources.at(-1);assert.equal(audio.playing.person,'traveler');
 audio.setScene('exodus','passover');assert.equal(wash.stopped,true);assert.equal(spoken.stopped,true);assert.equal(audio.playing,null);assert.ok(f.context.panners.some(p=>p.positionX.value===-35&&p.positionZ.value===24.5));
 audio.setVolume('music',0);assert.equal(audio.volumes.music,0);assert.equal(audio.volumes.environment,.6);assert.equal(audio.volumes.voice,.9);
 await audio.speak('passover-parent','greeting',[-30,1.5,28]);audio.setHidden(true);assert.equal(audio.playing,null);assert.ok(f.context.gains.slice(1,4).every(g=>g.gain.value===0),'all three buses mute while hidden');
 assert.ok(events.some(e=>e.status==='playing'&&e.text.includes('昨夜')));audio.dispose();assert.equal(f.context.state,'closed');
});

test('voice playback ignores stale completions and bounds decoded audio across repeated island switches',async()=>{
 const f=fixture(),audio=createSceneAudio();await audio.enable();audio.setActive(true);
 for(const id of ['brick-maker','passover-parent','traveler','pilgrim','stone-worker'])await audio.speak(id,'greeting',[0,1.5,0]);
 assert.equal(f.fetched.length,5);const old=f.context.sources.at(-1),callback=old.onended;
 await audio.speak('stone-worker','greeting',[0,1.5,0]);assert.equal(f.fetched.length,5,'recent voice remains cached');callback();assert.equal(audio.playing.person,'stone-worker');
 await audio.speak('brick-maker','greeting',[0,1.5,0]);assert.equal(f.fetched.length,6,'oldest decoded buffer was evicted');assert.equal(audio.playing.person,'brick-maker');audio.enable(false);assert.equal(audio.playing,null);audio.dispose();
});

test('one character switches between preserved original and child recordings without reusing the wrong decoded source',async()=>{
 const f=fixture(),audio=createSceneAudio();await audio.enable();
 await audio.speak('householder','greeting',[0,1.5,0]);const original=f.context.sources.at(-1),oldCallback=original.onended;
 await audio.speak('householder','child-greeting',[0,1.5,0]);const child=f.context.sources.at(-1);
 assert.equal(f.fetched.length,2);assert.ok(f.fetched[0].endsWith('/householder.mp3'));assert.ok(f.fetched[1].endsWith('/householder-child.mp3'));assert.notEqual(child.buffer,original.buffer);assert.equal(original.stopped,true);oldCallback();assert.equal(audio.playing.key,'child-greeting');
 await audio.speak('householder','child-observe-house',[0,1.5,0]);assert.equal(f.fetched.length,2);assert.equal(f.context.sources.at(-1).buffer,child.buffer);
 await audio.speak('householder','greeting',[0,1.5,0]);assert.equal(f.fetched.length,2);assert.equal(f.context.sources.at(-1).buffer,original.buffer);audio.dispose();
});

test('David time changes cancel the former moment and retain separate spatial ambience',async()=>{
 const f=fixture(),audio=createSceneAudio();audio.setScene('david','ark','cart');await audio.enable();audio.setActive(true);await audio.speak('david-arrival-guide','greeting',[3,2,13]);const old=f.context.sources.at(-1),cloth=f.context.sources[1];
 audio.setScene('david','ark','pause');assert.equal(audio.playing,null);assert.equal(old.stopped,true);assert.equal(cloth.stopped,true);assert.ok(f.context.panners.some(p=>p.positionX.value===34&&p.positionZ.value===12));
 await audio.speak('david-arrival-guide','waiting',[3,2,13]);assert.equal(f.fetched.length,1,'one accepted character recording is reused');audio.setScene('david','ark','carry');assert.equal(audio.playing,null);assert.ok(f.context.panners.some(p=>p.positionX.value===-25&&p.positionZ.value===-12));audio.setScene('david','ark','tent');assert.equal(audio.volumes.voice,.9);audio.dispose();
});

test('Samaria ten moments cancel old speech and select their own chapter ambience and exact child cue',async()=>{
 const f=fixture(),audio=createSceneAudio();await audio.enable();audio.setActive(true);let prior=null;
 for(const [chapter,phases,person,position] of [['well',['water','worship','witness','hearing'],'samaria-well-resident',[24,-9]],['road',['questions','passing','approach'],'samaria-road-resident',[22,20]],['inn',['care','entrust','promise'],'samaria-care-resident',[12,-23]]])for(const phase of phases){
  audio.setScene('samaria',chapter,phase);assert.equal(audio.playing,null);if(prior)assert.equal(prior.stopped,true);assert.ok(f.context.panners.some(p=>p.positionX.value===position[0]&&p.positionZ.value===position[1]));await audio.speak(person,'greeting',[3,2,13]);const old=f.context.sources.at(-1),complete=old.onended;await audio.speak(person,'child-greeting',[3,2,13]);assert.equal(old.stopped,true);complete();assert.equal(audio.playing.key,'child-greeting');prior=f.context.sources.at(-1);
 }
 assert.equal(f.fetched.length,3,'one accepted recording per resident is reused');audio.dispose();
});

test('Parables ten moments cancel old speech and select their own chapter ambience and exact child cue',async()=>{
 const f=fixture(),audio=createSceneAudio();await audio.enable();audio.setActive(true);let prior=null;
 for(const [chapter,phases,person,position] of [['seed',['sowing','asking','hearing'],'parables-field-resident',[24,23]],['sheep',['listeners','found','rejoicing'],'parables-pasture-resident',[-13,25]],['lamp',['preparation','midnight','door','watch'],'parables-light-resident',[13,-18]]])for(const phase of phases){
  audio.setScene('parables',chapter,phase);assert.equal(audio.playing,null);if(prior)assert.equal(prior.stopped,true);assert.ok(f.context.panners.some(p=>p.positionX.value===position[0]&&p.positionZ.value===position[1]));await audio.speak(person,'greeting',[3,2,13]);const old=f.context.sources.at(-1),complete=old.onended;await audio.speak(person,'child-greeting',[3,2,13]);assert.equal(old.stopped,true);complete();assert.equal(audio.playing.key,'child-greeting');prior=f.context.sources.at(-1);
 }
 assert.equal(f.fetched.length,3,'one accepted recording per resident is reused');audio.dispose();
});
