import test from 'node:test';
import assert from 'node:assert/strict';
import {createSoundtrack,createRecordedEffects} from '../src/soundtrack.js';
function fixture(){
 const sources=[],gains=[];
 const param=()=>({value:0,setValueAtTime(value){this.value=value;},setTargetAtTime(value){this.value=value;},cancelScheduledValues(){}});
 const node=()=>({connect(){},disconnect(){this.disconnected=true;},start(){this.started=true;},stop(at){this.stopped=at??true;}});
 const ctx={currentTime:10,createBufferSource(){const s={...node(),playbackRate:param()};sources.push(s);return s;},createGain(){const g={...node(),gain:param()};gains.push(g);return g;},async decodeAudioData(buffer){return {duration:96,id:buffer.id};}};
 globalThis.document={baseURI:'http://localhost/'};
 return {ctx,sources,gains,output:node()};
}
test('an old score download never plays after changing scenes, while rapid crossfades stay bounded',async()=>{
 const f=fixture(),requests=new Map(),events=[];
 globalThis.fetch=url=>new Promise(resolve=>requests.set(String(url),()=>resolve({ok:true,arrayBuffer:async()=>({id:String(url)})})));
 const player=createSoundtrack(f.ctx,f.output,e=>events.push(e));
 const a=player.select({id:'A',title:'A',src:'A',seconds:96});
 const b=player.select({id:'B',title:'B',src:'B',seconds:96});
 requests.get('http://localhost/B.ogg')();await b;assert.equal(f.sources.length,1);assert.match(f.sources[0].buffer.id,/B\.ogg$/);
 requests.get('http://localhost/A.ogg')();await a;assert.equal(f.sources.length,1,'stale A is decoded but discarded');
 for(const id of ['C','D','E']){const task=player.select({id,title:id,src:id,seconds:96});requests.get(`http://localhost/${id}.ogg`)();await task;}
 assert.equal(f.sources.filter(s=>!s.disconnected).length,2);assert.ok(f.sources[0].disconnected);
 await player.select(null);assert.equal(events.at(-1).status,'off');player.dispose();assert.ok(f.sources.every(s=>s.disconnected));
});
test('codec fallback is finite and recorded effects never replay a delayed footfall',async()=>{
 const f=fixture(),urls=[];let finish;
 globalThis.fetch=async url=>{urls.push(String(url));return {ok:!String(url).endsWith('.ogg'),arrayBuffer:async()=>({id:String(url)})};};
 const player=createSoundtrack(f.ctx,f.output);await player.select({id:'town',title:'Town',src:'town',seconds:96});
 assert.deepEqual(urls,['http://localhost/town.ogg','http://localhost/town.mp3']);assert.equal(f.sources.length,1);player.dispose();
 const effects=createRecordedEffects(f.ctx,f.output);
 globalThis.fetch=url=>new Promise(resolve=>{finish=()=>resolve({ok:true,arrayBuffer:async()=>({id:String(url)})});});
 const count=f.sources.length;assert.equal(effects.play('footstep:stone',[0,0,0]),false);finish();await Promise.resolve();await Promise.resolve();await Promise.resolve();
 assert.equal(f.sources.length,count,'a late decode cannot schedule the old physical event');effects.dispose();
});

test('chapter changes sharing a mood coalesce the in-flight score and wait for that same decode',async()=>{
 const f=fixture();let finish,requests=0;globalThis.fetch=url=>{requests++;return new Promise(resolve=>{finish=()=>resolve({ok:true,arrayBuffer:async()=>({id:String(url)})});});};
 const player=createSoundtrack(f.ctx,f.output),score={id:'town',title:'Town',src:'town',seconds:96},first=player.select(score),second=player.select(score);assert.equal(requests,1);assert.equal(first,second);finish();await second;assert.equal(f.sources.length,1);assert.equal(f.sources[0].loopEnd,96);player.dispose();
});
