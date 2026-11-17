#!/usr/bin/env node
/**
 * Original modern music and physical/noise model effects for Bible Island.
 * No external recordings, AI service, historical-authenticity claim, or runtime writes.
 * Node >=18 + ffmpeg/ffprobe; no npm dependencies.
 */
import {mkdirSync, readFileSync, writeFileSync, unlinkSync} from 'node:fs';
import {resolve, join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {appendStoneInteractions} from './stone-interactions.mjs';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const arg=process.argv.indexOf('--out');
const OUT=resolve(arg<0?join(ROOT,'.qa/audio-upgrade'):process.argv[arg+1]);
const SR=48000, BPM=80, BEAT=60/BPM, BARS=32, DURATION=BARS*4*BEAT;
const N=Math.round(DURATION*SR), SEED=0x21a0d10;
mkdirSync(OUT,{recursive:true});
for(const sub of ['music','sfx','previews'])mkdirSync(join(OUT,sub),{recursive:true});
const manifest={schema:1,title:'Courtyard Paths / 院落之間',kind:'original-modern-score-and-effects',
  generator:'scripts/audio/generate-original-audio.mjs',generatorSha256:sha(readFileSync(fileURLToPath(import.meta.url))),
  seed:SEED,sampleRate:SR,externalSamples:[],historicalAuthenticity:false,
  rights:'Original composition, synthesis algorithms and audio created for this project; no third-party recordings or samples.',
  music:null,effects:[],verification:{humanListening:false,runtimeIntegrated:false}};

function sha(data){return createHash('sha256').update(data).digest('hex');}
function rng(seed){let a=seed>>>0;return()=>{a^=a<<13;a^=a>>>17;a^=a<<5;return(a>>>0)/4294967296;};}
function freq(midi){return 440*2**((midi-69)/12);}
function db(value){return value>0?20*Math.log10(value):-160;}
function arr(seconds){return new Float32Array(Math.ceil(seconds*SR));}
function edge(data,attack=.001,release=.008){
  const a=Math.min(Math.floor(attack*SR),data.length),r=Math.min(Math.floor(release*SR),data.length);
  for(let i=0;i<a;i++)data[i]*=Math.sin(i/a*Math.PI/2)**2;
  for(let i=0;i<r;i++)data[data.length-1-i]*=Math.sin(i/r*Math.PI/2)**2;
  return data;
}
function peak(data){let p=0;for(const x of data)p=Math.max(p,Math.abs(x));return p;}
function rms(data){let q=0;for(const x of data)q+=x*x;return Math.sqrt(q/data.length);}
function gainTo(data,target){const g=10**(target/20)/(peak(data)||1);for(let i=0;i<data.length;i++)data[i]*=g;return data;}
function sum(parts){const out=new Float32Array(Math.max(...parts.map(x=>x.data.length+Math.round((x.at||0)*SR))));
  for(const{data,at=0,gain=1}of parts){const start=Math.round(at*SR);for(let i=0;i<data.length;i++)out[start+i]+=data[i]*gain;}return out;}
function modal(seconds,modes,seed,attack=.001){
  const out=arr(seconds),random=rng(seed);
  for(const[f,a,tau]of modes){const w=2*Math.PI*f/SR,p=random()*Math.PI*.12;
    for(let i=0;i<out.length;i++){const t=i/SR;out[i]+=a*Math.sin(w*i+p)*Math.exp(-t/tau);}}
  return edge(out,attack,.025);
}
function noise(seconds,seed,{low=900,high=0,tau=.05,attack=.001,power=1}={}){
  const out=arr(seconds),random=rng(seed),lpA=1-Math.exp(-2*Math.PI*low/SR),hpA=high?1-Math.exp(-2*Math.PI*high/SR):0;
  let lo=0,hi=0;
  for(let i=0;i<out.length;i++){const x=random()*2-1;lo+=lpA*(x-lo);hi+=hpA*(lo-hi);out[i]=(lo-hi)*Math.exp(-(i/SR)/tau)*power;}
  return edge(out,attack,.02);
}
function string(midi,seconds,seed,brightness=.45){
  // Karplus–Strong loop: noise excitation, filtered round-trip loss and bridge resonances.
  const out=arr(seconds),random=rng(seed),delay=SR/freq(midi)-.5*(1-brightness);
  const len=Math.ceil(delay),fraction=len-delay,ring=new Float64Array(len);
  let exc=0;
  for(let i=0;i<ring.length;i++){exc=.65*exc+.35*(random()*2-1);ring[i]=exc;}
  const excitationMean=ring.reduce((a,x)=>a+x,0)/ring.length;
  for(let i=0;i<ring.length;i++)ring[i]-=excitationMean;
  let index=0,previous=0;
  for(let i=0;i<out.length;i++){
    const a=ring[index],b=ring[(index+1)%ring.length],interp=a*(1-fraction)+b*fraction;
    const filtered=(interp+previous)*.5;previous=interp;
    ring[index]=(brightness*interp+(1-brightness)*filtered)*.9965;
    out[i]=interp*Math.exp(-i/(SR*seconds*.9));index=(index+1)%ring.length;
  }
  edge(out,.002,.04);return gainTo(out,0);
}
function wind(midi,seconds,seed){
  // Breath excitation plus harmonics with separate onset, tremolo and a low formant.
  const out=arr(seconds),random=rng(seed),base=freq(midi);let breath=0,phase=0;
  for(let i=0;i<out.length;i++){
    const t=i/SR,vibrato=t>.20?Math.sin(2*Math.PI*4.7*t)*.0022:0;
    phase+=2*Math.PI*base*(1+vibrato)/SR;breath=.81*breath+.19*(random()*2-1);
    const envelope=Math.min(1,t/.09)*Math.min(1,(seconds-t)/.16)*(1+.025*Math.sin(2*Math.PI*3.1*t));
    const tone=Math.sin(phase)+.25*Math.sin(2*phase+.07)+.13*Math.sin(3*phase)+.035*Math.sin(5*phase);
    out[i]=envelope*(tone*.78+breath*.14);
  }
  return edge(out,.005,.025);
}
function drum(seed,light=false){return sum([
  {data:modal(.65,[[light?165:108,.8,.14],[light?267:172,.35,.095],[light?351:232,.18,.065],[light?480:308,.10,.04]],seed)},
  {data:noise(.12,seed+4,{low:light?4100:2500,high:700,tau:.014,power:.25})},
]);}

function writeWav(path,channels,bits=24){
  const frames=channels[0].length,bytes=bits/8,pcm=Buffer.alloc(44+frames*channels.length*bytes);
  pcm.write('RIFF',0);pcm.writeUInt32LE(pcm.length-8,4);pcm.write('WAVEfmt ',8);
  pcm.writeUInt32LE(16,16);pcm.writeUInt16LE(1,20);pcm.writeUInt16LE(channels.length,22);
  pcm.writeUInt32LE(SR,24);pcm.writeUInt32LE(SR*channels.length*bytes,28);
  pcm.writeUInt16LE(channels.length*bytes,32);pcm.writeUInt16LE(bits,34);pcm.write('data',36);pcm.writeUInt32LE(pcm.length-44,40);
  let o=44;const scale=bits===24?8388607:32767;
  for(let i=0;i<frames;i++)for(const channel of channels){const v=Math.round(Math.max(-1,Math.min(1,channel[i]))*scale);
    if(bits===24)pcm.writeIntLE(v,o,3);else pcm.writeInt16LE(v,o);o+=bytes;}
  writeFileSync(path,pcm);
}
function ff(args){return execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-threads','1','-filter_threads','1',...args],{stdio:'inherit'});}
function formats(wav,stereo=false){
  const ogg=wav.replace(/\.wav$/,'.ogg'),mp3=wav.replace(/\.wav$/,'.mp3');
  ff(['-i',wav,'-map_metadata','-1','-fflags','+bitexact','-flags:a','+bitexact','-c:a','libvorbis','-q:a',stereo?'5':'4',ogg]);
  ff(['-i',wav,'-map_metadata','-1','-fflags','+bitexact','-flags:a','+bitexact','-c:a','libmp3lame','-b:a',stereo?'192k':'96k',mp3]);
  return [wav,ogg,mp3].map(path=>({path:path.slice(OUT.length+1),bytes:readFileSync(path).length,sha256:sha(readFileSync(path))}));
}
function stats(channels){let p=0,energy=0,dc=0,count=0;for(const c of channels)for(const x of c){p=Math.max(p,Math.abs(x));energy+=x*x;dc+=x;count++;}
  return{peakDbFS:db(p),rmsDbFS:db(Math.sqrt(energy/count)),dcMean:dc/count,clippedSamples:channels.reduce((a,c)=>a+c.reduce((b,x)=>b+(Math.abs(x)>=1),0),0)};}

// Score is an authored event list; no copied tune, algorithmic rearrangement of a recording, or external sample.
const buses=Object.fromEntries(['strings','wind','bass','percussion'].map(k=>[k,[new Float32Array(N),new Float32Array(N)]]));
const events=[];
function event(bus,bar,beat,midi,seconds,velocity,pan,seed){
  const pos=bar*4*BEAT+beat*BEAT;events.push({bus,bar:bar+1,beat:beat+1,midi,duration:seconds,velocity,pan,seed});
  const data=bus==='wind'?wind(midi,seconds,seed):bus==='percussion'?drum(seed,midi===1):string(midi,seconds,seed,bus==='bass'?.28:.50);
  const left=Math.cos((pan+1)*Math.PI/4)*velocity,right=Math.sin((pan+1)*Math.PI/4)*velocity,start=Math.round(pos*SR);
  for(let i=0;i<data.length;i++){const j=(start+i)%N;buses[bus][0][j]+=data[i]*left;buses[bus][1][j]+=data[i]*right;}
}
// D-Dorian colour is a modern compositional choice, not a claim about first-century music.
const harmony=[
  {root:38,notes:[50,57,60,64]}, {root:43,notes:[55,59,62,69]},
  {root:36,notes:[52,55,59,62]}, {root:45,notes:[52,55,60,64]},
  {root:38,notes:[53,57,60,64]}, {root:43,notes:[50,55,59,64]},
  {root:45,notes:[52,57,60,67]}, {root:38,notes:[50,57,60,64]},
];
const melodies=[
 [[.5,74,1],[2,76,.7],[3,77,.7]], [[.5,79,1.4],[2.5,76,.8]],
 [[0,76,.9],[1.5,74,.9],[3,72,.7]], [[1,69,1.4]],
 [[.5,74,.8],[1.75,77,.8],[3,81,.7]], [[.5,79,1.2],[2.5,76,.9]],
 [[0,74,1],[1.5,72,.8],[3,69,.6]], [],
];
let serial=0;
for(let bar=0;bar<BARS;bar++){
  const phrase=Math.floor(bar/8),slot=bar%8,chord=harmony[(slot+(phrase===2?2:0))%8];
  // Phrase ends leave room; second phrase is a plucked response, fourth reduces density.
  const sparse=slot===7,level=phrase===0?.78:phrase===1?.72:phrase===2?.85:.68;
  event('bass',bar,0,chord.root,1.9,.11*level,-.10,SEED+serial++);
  if(!sparse&&slot%2===0)event('bass',bar,2.5,chord.root+12,1.1,.055*level,.12,SEED+serial++);
  for(const [i,b]of(sparse?[0,.20]:[0,.20,1.50,2.25,3.30]).entries()){
    const pitch=chord.notes[(i+(phrase%2))%chord.notes.length]+(phrase===1?12:0);
    event('strings',bar,b,pitch,1.85,.073*level*(i===0?1:.74),-.36+(i%3)*.18,SEED+serial++);
  }
  if(phrase!==1&&slot!==7){
    for(const [b,p,d]of melodies[slot])event('wind',bar,b,p+(phrase===2&&slot<3?-12:0),d*BEAT,.049*level,.28,SEED+serial++);
  }else if(phrase===1&&slot%2===0){
    for(const[b,p,d]of melodies[slot].slice(0,2))event('strings',bar,b+.35,p,1.4,.065,.27,SEED+serial++);
  }
  if(!sparse){event('percussion',bar,0,0,.65,.040*level,-.18,SEED+serial++);
    if(slot%2===0)event('percussion',bar,2.25,1,.65,.025*level,.20,SEED+serial++);}
}
// A quiet final pickup rings into the opening; no master fade or padded silent loop gap.
event('strings',31,3.0,57,2.8,.031,-.30,SEED+serial++);
event('strings',31,3.2,64,2.5,.020,.30,SEED+serial++);
event('bass',31,3.4,50,2.2,.025,-.08,SEED+serial++);
console.log(`Rendering ${BARS} bars at ${BPM} BPM (${DURATION}s), ${events.length} authored events.`);
const mix=[new Float32Array(N),new Float32Array(N)];
for(const stereo of Object.values(buses))for(let ch=0;ch<2;ch++)for(let i=0;i<N;i++)mix[ch][i]+=stereo[ch][i];
// Short sparse reflections are applied circularly: the last bar's tail is already present at the start.
const dry=mix.map(x=>x.slice()),taps=[[.061,.085],[.107,.066],[.163,.050],[.233,.037],[.359,.026],[.487,.018],[.677,.011]];
for(const[seconds,amount]of taps){const delay=Math.round(seconds*SR);for(let ch=0;ch<2;ch++){
  let state=0;const source=dry[1-ch];
  // Warm one-pole reflector with one full periodic pre-roll; no cold-start filter discontinuity.
  for(let i=0;i<N;i++)state+=.17*(source[i]-state);
  for(let i=0;i<N;i++){state+=.17*(source[i]-state);mix[ch][(i+delay)%N]+=state*amount;}
}}
// Periodic 20Hz DC blocker: one-cycle pre-roll gives a matching filter state at both ends.
for(const c of mix){let previous=0,state=0;const coefficient=Math.exp(-2*Math.PI*20/SR);
  for(let pass=0;pass<2;pass++)for(let i=0;i<N;i++){
    const x=c[i],y=x-previous+coefficient*state;previous=x;state=y;if(pass===1)c[i]=y;
  }
}
const rawPeak=Math.max(...mix.map(peak)),mixGain=10**(-9/20)/rawPeak;
for(const c of mix)for(let i=0;i<N;i++)c[i]*=mixGain;
const musicWav=join(OUT,'music/jerusalem-town-loop.wav');writeWav(musicWav,mix);
manifest.music={id:'jerusalem-town',title:manifest.title,tempoBpm:BPM,meter:'4/4',bars:BARS,durationSeconds:DURATION,
  frames:N,channels:2,loopStartFrame:0,loopEndFrame:N,loopStrategy:'periodic event tails and circular stereo reflections; no fade-to-silence seam',
  instrumentation:['Karplus–Strong plucked strings','breath/harmonic woodwind model','low plucked string','inharmonic membrane drum'],
  woodwindRestBars:BARS-new Set(events.filter(x=>x.bus==='wind').map(x=>x.bar)).size,mixGain,stats:stats(mix),files:formats(musicWav,true)};
writeFileSync(join(OUT,'score-events.json'),JSON.stringify({tempoBpm:BPM,meter:'4/4',bars:BARS,events},null,2)+'\n');

// Seam QA compares adjacent PCM frames, including the last -> first wrap, to ordinary sample slopes.
const seam=mix.map(c=>{let d2=0,max=0;for(let i=1;i<c.length;i++){const d=Math.abs(c[i]-c[i-1]);d2+=d*d;max=Math.max(max,d);}
  const jump=Math.abs(c[0]-c[c.length-1]),slopeRms=Math.sqrt(d2/(c.length-1));
  return{first:c[0],last:c[c.length-1],boundaryJump:jump,boundaryJumpDbFS:db(jump),ordinarySlopeRms:slopeRms,
    boundaryToSlopeRms:jump/(slopeRms||1),maxInteriorSlope:max,pass:jump<Math.max(.0025,slopeRms*4)};});
const snippet=mix.map(c=>{const result=new Float32Array(SR*8);result.set(c.subarray(N-SR*4));result.set(c.subarray(0,SR*4),SR*4);return result;});
writeWav(join(OUT,'previews/loop-seam-tail4-head4.wav'),snippet);
manifest.verification.seam=seam;
manifest.verification.silence={windowSeconds:1,perSecondRmsDbFS:Array.from({length:DURATION},(_,i)=>db(Math.sqrt((rms(mix[0].subarray(i*SR,(i+1)*SR))**2+rms(mix[1].subarray(i*SR,(i+1)*SR))**2)/2)))};

function foot(material,seed,heavy=false){
  const random=rng(seed),weight=heavy?1.6:1,offset=.012+random()*.018;
  if(material==='earth'){
    const grains=[];for(let k=0;k<(heavy?15:9);k++)grains.push({data:noise(.035+random()*.04,seed+k*13,{low:1600+random()*2200,high:400,tau:.008+random()*.012,power:.10}),at:offset+random()*.12,gain:1});
    return sum([{data:modal(.29,[[78+random()*12,.35,.035],[146,.17,.028]],seed),gain:weight},
      {data:noise(.26,seed+4,{low:750,high:90,tau:.050,power:.55}),at:.008,gain:weight},...grains]);
  }
  if(material==='stone')return sum([
    {data:modal(.24,[[920+random()*95,.21,.012],[1870,.15,.009],[3360,.07,.006],[118,.24,.028]],seed),gain:weight},
    {data:noise(.13,seed+9,{low:11000,high:1700,tau:.009,power:.42}),gain:weight},
    {data:noise(.14,seed+18,{low:3700,high:700,tau:.033,power:.16}),at:offset},
  ]);
  return sum([
    {data:modal(.42,[[184+random()*18,.40,.068],[428,.23,.049],[792,.11,.029],[1310,.055,.018]],seed),gain:weight},
    {data:noise(.14,seed+7,{low:5200,high:1500,tau:.012,power:.17}),gain:weight},
    {data:modal(.30,[[290+random()*30,.065,.065],[570,.035,.05]],seed+21,.004),at:offset+.015},
  ]);
}
function interaction(material,seed){const random=rng(seed);
  if(material==='ceramic')return sum([
    {data:modal(.72,[[1280+random()*70,.3,.125],[2240,.18,.075],[3570,.07,.041],[4450,.025,.020]],seed)},
    {data:noise(.06,seed+1,{low:12000,high:1800,tau:.004,power:.15})},
    {data:noise(.20,seed+2,{low:2100,high:450,tau:.044,power:.08}),at:.055},
  ]);
  return sum([
    {data:modal(.50,[[242+random()*35,.31,.085],[641,.19,.053],[1190,.07,.024]],seed)},
    {data:noise(.065,seed+4,{low:4200,high:850,tau:.009,power:.18})},
    {data:noise(.24,seed+5,{low:950,high:180,tau:.066,power:.09}),at:.06},
    {data:modal(.25,[[360,.035,.044],[493,.02,.036]],seed+6),at:.10+random()*.03},
  ]);
}
const gallery=[];
function saveFx(id,category,material,variant,data,seed,description){
  // Fixed loudness by family, not hard clipping; short clean endpoints avoid stop clicks.
  gainTo(edge(data,.0015,.025),category==='landing'?-10:category==='interaction'?-14:-15);
  const wav=join(OUT,'sfx',id+'.wav');writeWav(wav,[data],16);
  const item={id,category,material,variant,seed,description,channels:1,sampleRate:SR,frames:data.length,
    durationSeconds:data.length/SR,stats:stats([data]),files:formats(wav)};
  manifest.effects.push(item);gallery.push({id,data});
}
for(const material of ['earth','stone','wood'])for(let i=1;i<=4;i++){
  const seed=SEED+10000+manifest.effects.length*83;
  saveFx(`footstep-${material}-${i}`,'footstep',material,i,foot(material,seed),seed,
    material==='earth'?'Damped heel plus dispersed grit and low soil compression':material==='stone'?'Short bright sole contact and hard inharmonic stone modes':'Hollow plank modes, dry contact and delayed board flex');
}
for(let i=1;i<=4;i++){
  const seed=SEED+20000+i*89;
  const data=sum([{data:noise(.20,seed,{low:1800,high:350,tau:.065,attack:.016,power:.25})},
    {data:modal(.15,[[143+i*4,.08,.035],[306,.04,.02]],seed+1),at:.015},
    {data:noise(.13,seed+2,{low:4200,high:1400,tau:.027,power:.12}),at:.04}]);
  saveFx(`jump-takeoff-${i}`,'jump','neutral',i,data,seed,'Toe release, sole flex and a brief cloth/air sweep; no vocalization');
}
for(const material of ['earth','stone','wood'])for(let i=1;i<=4;i++){
  const seed=SEED+30000+manifest.effects.length*97;
  const data=sum([{data:foot(material,seed,true)},{data:foot(material,seed+43),at:.035+i*.004,gain:.50},
    {data:noise(.25,seed+7,{low:480,high:40,tau:.066,power:.18}),at:.004}]);
  saveFx(`landing-${material}-${i}`,'landing',material,i,data,seed,'Two offset foot contacts with heavier body load; no injury or combat sound');
}
for(const material of ['ceramic','wood'])for(let i=1;i<=4;i++){
  const seed=SEED+40000+manifest.effects.length*101;
  saveFx(`interact-${material}-${i}`,'interaction',material,i,interaction(material,seed),seed,
    material==='ceramic'?'Gentle vessel set-down/touch, resonant shell and sliding contact; not breaking':'Wooden object touch/set-down, hollow knock and short friction; not chopping');
}
// Labelled listening gallery: each category separated by silence, all variants retained.
const gap=SR*.45,fxFrames=gallery.reduce((n,x)=>n+x.data.length+gap,0),fxPreview=new Float32Array(fxFrames);
let cursor=0;const galleryIndex=[];
for(const{id,data}of gallery){galleryIndex.push({id,startSeconds:cursor/SR,durationSeconds:data.length/SR});fxPreview.set(data,cursor);cursor+=data.length+gap;}
writeWav(join(OUT,'previews/effects-gallery.wav'),[fxPreview],16);
writeFileSync(join(OUT,'previews/effects-gallery-index.json'),JSON.stringify(galleryIndex,null,2)+'\n');
ff(['-i',musicWav,'-lavfi','showspectrumpic=s=1600x800:legend=1:scale=log:fscale=log:color=viridis','-frames:v','1',join(OUT,'previews/town-spectrum.png')]);
ff(['-i',musicWav,'-filter_complex','showwavespic=s=1600x480:split_channels=1:colors=0x63c4c7|0xb4cb83','-frames:v','1',join(OUT,'previews/town-waveform.png')]);
ff(['-i',join(OUT,'previews/effects-gallery.wav'),'-lavfi','showspectrumpic=s=1600x800:legend=1:scale=log:fscale=log:color=viridis','-frames:v','1',join(OUT,'previews/effects-spectrum.png')]);
// Decode delivery codecs rather than assuming container duration or an encoder's delay handling.
manifest.verification.decoded=[];
for(const entry of manifest.music.files){const path=join(OUT,entry.path),rawPath=join(OUT,'previews/codec-check.f32');
  ff(['-i',path,'-f','f32le','-acodec','pcm_f32le',rawPath]);
  const raw=readFileSync(rawPath);unlinkSync(rawPath);
  const count=raw.length/4,frames=count/2,channels=[new Float32Array(frames),new Float32Array(frames)];
  for(let i=0;i<count;i++)channels[i%2][Math.floor(i/2)]=raw.readFloatLE(i*4);
  manifest.verification.decoded.push({path:entry.path,frames,durationSeconds:frames/SR,stats:stats(channels),
    boundaryJumpDbFS:channels.map(c=>db(Math.abs(c[0]-c[c.length-1]))),
    exactFrameLength:frames===N});
}
manifest.verification.pass=seam.every(x=>x.pass)&&manifest.music.stats.clippedSamples===0&&manifest.effects.every(x=>x.stats.clippedSamples===0)&&manifest.verification.decoded.every(x=>x.exactFrameLength&&x.stats.clippedSamples===0);
writeFileSync(join(OUT,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({out:OUT,musicSeconds:DURATION,eventCount:events.length,effectCount:manifest.effects.length,musicStats:manifest.music.stats,seam,decoded:manifest.verification.decoded,pass:manifest.verification.pass},null,2));
if(!manifest.verification.pass)process.exitCode=1;
// The extension is appended after the original 111 files, preserving their samples, order and hashes.
appendStoneInteractions(OUT);
