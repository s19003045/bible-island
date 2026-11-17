#!/usr/bin/env node
/** Four original modern reading scores. No samples, network, historical-performance claim or runtime writes. */
import {mkdirSync,readFileSync,writeFileSync,openSync,closeSync,unlinkSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const SOURCE=fileURLToPath(import.meta.url),ROOT=resolve(dirname(SOURCE),'../..'),SR=48000;
const sha=b=>createHash('sha256').update(b).digest('hex');
const db=x=>x>0?20*Math.log10(x):-160;
const frequency=m=>440*2**((m-69)/12);
function random(seed){let x=seed>>>0;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296;};}
function peak(x){let p=0;for(const v of x)p=Math.max(p,Math.abs(v));return p;}
function edge(x,attack=.003,release=.025){let a=Math.min(x.length,Math.round(attack*SR)),r=Math.min(x.length,Math.round(release*SR));
  for(let i=0;i<a;i++)x[i]*=Math.sin(i/a*Math.PI/2)**2;for(let i=0;i<r;i++)x[x.length-1-i]*=Math.sin(i/r*Math.PI/2)**2;return x;}
function unit(x){const p=peak(x)||1;for(let i=0;i<x.length;i++)x[i]/=p;return x;}
function pluck(midi,seconds,seed,muted=false){const x=new Float32Array(Math.round(seconds*SR)),rnd=random(seed),brightness=muted?.26:.48;
  const delay=SR/frequency(midi)-.5*(1-brightness),n=Math.ceil(delay),fraction=n-delay,ring=new Float64Array(n);let previous=0,exc=0;
  for(let i=0;i<n;i++){exc=.65*exc+.35*(rnd()*2-1);ring[i]=exc;}const mean=ring.reduce((a,v)=>a+v,0)/n;for(let i=0;i<n;i++)ring[i]-=mean;
  for(let i=0,j=0;i<x.length;i++,j=(j+1)%n){const v=ring[j]*(1-fraction)+ring[(j+1)%n]*fraction,filtered=(v+previous)*.5;previous=v;
    ring[j]=(brightness*v+(1-brightness)*filtered)*(muted?.993:.997);x[i]=v*Math.exp(-i/(SR*seconds*(muted?.55:.85)));}
  return unit(edge(x,.003,.04));}
function air(midi,seconds,seed,low=false){const x=new Float32Array(Math.round(seconds*SR)),rnd=random(seed),base=frequency(midi);let phase=0,breath=0;
  for(let i=0;i<x.length;i++){const t=i/SR;phase+=2*Math.PI*base*(1+(t>.25?.0017*Math.sin(2*Math.PI*4.2*t):0))/SR;
    breath=.86*breath+.14*(rnd()*2-1);const env=Math.min(1,t/.14)*Math.min(1,(seconds-t)/.22);
    x[i]=env*(Math.sin(phase)+.20*Math.sin(2*phase+.03)+.065*Math.sin(3*phase)+breath*(low?.055:.10));}
  return edge(x,.005,.02);}
function sustained(midi,seconds,seed,open=false){const x=new Float32Array(Math.round(seconds*SR)),rnd=random(seed),base=frequency(midi),phases=[rnd()*2,rnd()*2];
  // A deliberately synthetic warm harmonic ensemble, not a recording of a named ancient instrument.
  for(let i=0;i<x.length;i++){const t=i/SR,env=Math.sin(Math.min(1,t/.65)*Math.PI/2)**2*Math.sin(Math.min(1,(seconds-t)/1.0)*Math.PI/2)**2;
    const wobble=1+.026*Math.sin(2*Math.PI*.31*t+phases[0]),phase=2*Math.PI*base*t;
    let a=0;for(let h=1;h<=5;h++)a+=Math.sin(phase*h+phases[h%2])*(h===1?1:(open?.26:.14)/h);
    const b=Math.sin(2*Math.PI*base*1.0014*t+phases[1])*.22;
    x[i]=env*wobble*(a+b)*.65;}
  return edge(x,.03,.04);}
function resonator(midi,seconds,seed,bell=false){const x=new Float32Array(Math.round(seconds*SR)),rnd=random(seed),f=frequency(midi);
  const modes=bell?[[1,1,.42],[2.76,.24,.20],[5.40,.055,.09]]:[[1,1,.13],[3.93,.19,.043],[8.9,.018,.018]];
  for(const[ratio,amplitude,tau]of modes){const phase=rnd()*.08;for(let i=0;i<x.length;i++)x[i]+=Math.sin(2*Math.PI*f*ratio*i/SR+phase)*amplitude*Math.exp(-i/(SR*tau));}
  return unit(edge(x,.004,.035));}
function skin(seed,brush=false){const seconds=brush?.32:.55,x=new Float32Array(Math.round(seconds*SR)),rnd=random(seed);let lo=0,hi=0;
  if(!brush)for(const[f,a,tau]of[[109,.8,.12],[173,.3,.078],[238,.11,.046]])for(let i=0;i<x.length;i++)x[i]+=Math.sin(2*Math.PI*f*i/SR)*a*Math.exp(-i/(SR*tau));
  for(let i=0;i<x.length;i++){lo+=.18*(rnd()*2-1-lo);hi+=.035*(lo-hi);x[i]+=(lo-hi)*Math.exp(-i/(SR*(brush?.055:.009)))*(brush?.70:.13);}
  return unit(edge(x,brush?.015:.003,.04));}
function wav(path,channels,bits=24){const frames=channels[0].length,bytes=bits/8,b=Buffer.alloc(44+frames*channels.length*bytes);
  b.write('RIFF',0);b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(channels.length,22);
  b.writeUInt32LE(SR,24);b.writeUInt32LE(SR*channels.length*bytes,28);b.writeUInt16LE(channels.length*bytes,32);b.writeUInt16LE(bits,34);b.write('data',36);b.writeUInt32LE(b.length-44,40);
  const scale=2**(bits-1)-1;let pos=44;for(let i=0;i<frames;i++)for(const x of channels){const n=Math.round(x[i]*scale);if(Math.abs(n)>scale)throw new Error('PCM clipping');b.writeIntLE(n,pos,bytes);pos+=bytes;}writeFileSync(path,b);}
function ff(args,log=null){const prefix=['-hide_banner','-loglevel',log?'info':'error','-nostats','-y','-threads','1','-filter_threads','1'];
  if(!log){execFileSync('ffmpeg',[...prefix,...args],{stdio:'inherit'});return;}
  const fd=openSync(log,'w');try{execFileSync('ffmpeg',[...prefix,...args],{stdio:['ignore','ignore',fd]});}finally{closeSync(fd);}}
function loudness(path,log){ff(['-i',path,'-af','ebur128=peak=true:framelog=verbose','-f','null','-'],log);
  const s=readFileSync(log,'utf8').split('Summary:').at(-1),read=re=>Number(s.match(re)?.[1]);
  const result={integratedLUFS:read(/\bI:\s+(-?[\d.]+) LUFS/),loudnessRangeLU:read(/LRA:\s+(-?[\d.]+) LU/),truePeakDbTP:read(/Peak:\s+(-?[\d.]+) dBFS/)};
  if(Object.values(result).some(v=>!Number.isFinite(v)))throw new Error('Could not read loudness summary: '+log);return result;}
function stats(channels){let p=0,q=0,dc=0,n=0,clipped=0;for(const c of channels)for(const x of c){p=Math.max(p,Math.abs(x));q+=x*x;dc+=x;n++;if(Math.abs(x)>=1)clipped++;}
  return{peakDbFS:db(p),rmsDbFS:db(Math.sqrt(q/n)),dcMean:dc/n,clippedSamples:clipped};}
function seam(channels){return channels.map(c=>{let q=0,max=0;for(let i=1;i<c.length;i++){const d=Math.abs(c[i]-c[i-1]);q+=d*d;max=Math.max(max,d);}
  const delta=Math.abs(c[0]-c.at(-1)),rms=Math.sqrt(q/(c.length-1));return{first:c[0],last:c.at(-1),boundaryJumpDbFS:db(delta),
    ordinarySlopeRms:rms,boundaryToSlopeRms:delta/rms,maxInteriorSlope:max,pass:delta<Math.max(.0025,rms*4)};});}

const definitions=[
  {id:'wilderness',title:'Paths and Open Sky / 曠野小徑',tempo:72,beats:4,bars:32,seed:0x7217a110,
    character:'Sparse low breath melody, sustained air, widely spaced plucks and occasional brushed skin; long pauses',
    instruments:['low breath/harmonic model','open plucked strings','soft harmonic air ensemble','sparse brushed membrane'],
    chords:[[40,52,59,66],[36,52,55,59],[38,54,57,64],[45,52,55,59],[40,55,59,66],[36,52,59,62],[38,54,57,64],[40,52,59,66]],
    melody:[[],[[.75,64,1.2],[2.5,67,1.0]],[[0,69,1.7],[2.75,67,.7]],[[1,64,1.7]],[],[[.5,74,1.4],[2.5,71,1.0]],[[.5,67,1.4],[2.5,64,.9]],[]]},
  {id:'lakeshore',title:'Quiet Water, Shared Shore / 湖岸微光',tempo:90,beats:3,bars:48,seed:0x9017a220,
    character:'Three-beat sway, rounded wooden/ripple resonators, gently answering wind and a soft sustained background; no literal water effects',
    instruments:['rounded wooden modal resonator','light plucked bass','gentle air melody','soft harmonic ensemble'],
    chords:[[43,55,59,62,69],[36,52,55,59,64],[40,55,59,62,67],[38,54,57,62,64],[36,55,59,64,67],[38,54,57,62,69]],
    melody:[[[.5,67,1.2]],[[.25,69,.9],[1.75,71,.8]],[],[[.5,74,1.2],[2,71,.7]],[[.5,69,1.3]],[],[[.5,67,1.5]],[]]},
  {id:'construction',title:'Hands at Work / 同心作工',tempo:96,beats:4,bars:40,seed:0x9617a330,
    character:'Dry muted low strings and warm wood/skin pulse, alternating short worklike phrases with rests; no hammer, weapon or labour command samples',
    instruments:['muted plucked strings','low plucked bass','dry wooden modal pulse','soft membrane and brush'],
    chords:[[45,57,60,64],[38,57,62,65],[43,55,59,62],[40,55,59,64],[45,57,60,67],[36,55,60,64],[43,55,59,62],[45,57,60,64]],
    riffs:[[57,60,64,62],[62,65,64,60],[59,62,67,64],[64,62,59,55],[60,64,67,64],[60,64,67,60],[59,62,64,62],[]]},
  {id:'solemn',title:'Space for Listening / 靜候聆聽',tempo:60,beats:4,bars:24,seed:0x6017a440,
    character:'Slow sustained harmonic ensemble, low plucked foundations and rare breath/wood responses; no drums, words, chant or historical ritual claim',
    instruments:['soft sustained harmonic ensemble','low open plucked string','rare low breath melody','quiet warm modal chime'],
    chords:[[35,59,62,66,73],[31,55,59,62,69],[40,55,59,64,71],[42,54,59,61,66],[31,55,59,62,69],[35,59,62,66,73]],
    melody:[[],[[1.25,59,2.1]],[],[],[],[[.5,62,1.9],[2.8,61,.9]],[],[]]},
];

function render(def,out){const beat=60/def.tempo,nominal=def.bars*def.beats*beat,frames=Math.round(nominal*SR),seconds=frames/SR;
  const buses=Object.fromEntries(['pluck','bass','air','ensemble','wood','chime','skin','brush'].map(k=>[k,[new Float32Array(frames),new Float32Array(frames)]]));
  const events=[];let serial=0;
  function note(instrument,bar,b,midi,duration,velocity,pan=0){const seed=def.seed+serial++*101;
    events.push({instrument,bar:bar+1,beat:b+1,midi,duration,velocity,pan,seed});
    const data=instrument==='air'?air(midi,duration,seed,def.id==='wilderness'||def.id==='solemn'):
      instrument==='ensemble'?sustained(midi,duration,seed,def.id==='solemn'):
      instrument==='wood'||instrument==='chime'?resonator(midi,duration,seed,instrument==='chime'):
      instrument==='skin'||instrument==='brush'?skin(seed,instrument==='brush'):pluck(midi,duration,seed,def.id==='construction');
    const start=Math.round((bar*def.beats+b)*beat),offset=Math.round((bar*def.beats+b)*beat*SR),left=Math.cos((pan+1)*Math.PI/4)*velocity,right=Math.sin((pan+1)*Math.PI/4)*velocity;
    for(let i=0;i<data.length;i++){const j=(offset+i)%frames;buses[instrument][0][j]+=data[i]*left;buses[instrument][1][j]+=data[i]*right;}
  }
  for(let bar=0;bar<def.bars;bar++){
    const slot=bar%8,quiet=slot===7,chord=def.chords[(def.id==='wilderness'||def.id==='solemn'?Math.floor(bar/2):bar)%def.chords.length],root=chord[0],tones=chord.slice(1);
    if(def.id==='wilderness'){
      if(bar%2===0){note('bass',bar,0,root,3.7,.075,-.16);for(let i=0;i<3;i++)note('ensemble',bar,.12+i*.03,tones[i],beat*7.7,.014,-.5+i*.5);}
      for(const[b,i]of(quiet?[[.4,0]]:[[.4,0],[2.7,2]]))note('pluck',bar,b,tones[i],2.8,quiet?.025:.041,i?-.38:.38);
      for(const[b,p,d]of def.melody[slot])note('air',bar,b,p,d*beat,.043,.20);
      if(bar%4===0)note('brush',bar,2.25,0,.32,.012,-.23);
    }else if(def.id==='lakeshore'){
      note('bass',bar,0,root,1.5,.052,-.12);
      if(bar%4===0)for(let i=0;i<3;i++)note('ensemble',bar,.12,tones[i],beat*11.4,.010,-.45+i*.45);
      if(!quiet)for(const[b,i]of[[0,0],[.8,1],[1.6,2],[2.5,3]])note('wood',bar,b,tones[i]+12,.65,.029+(i%2)*.006,-.42+i*.28);
      else note('pluck',bar,.75,tones[1],2.4,.025,.23);
      for(const[b,p,d]of def.melody[slot])note('air',bar,b,p,d*beat,.033,.22);
    }else if(def.id==='construction'){
      const phraseLevel=Math.floor(bar/8)%2?.78:1;
      note('bass',bar,0,root,1.7,.062*phraseLevel,-.12);
      if(!quiet){note('wood',bar,0,45,.5,.021,-.20);note('wood',bar,2.25,52,.5,.015,.24);
        if(slot%2===0)note('skin',bar,0,0,.55,.020,-.10);note('brush',bar,3.25,0,.32,.009,.22);}
      for(const[b,i]of(quiet?[[.25,0]]:[[.25,0],[2.25,1]]))note('pluck',bar,b,tones[i],1.0,.033*phraseLevel,-.35+i*.65);
      const riff=def.riffs[slot];for(let i=0;i<riff.length;i++){if(slot%4===3&&i>1)break;
        note('pluck',bar,[.5,1.25,2,3.25][i],riff[i],.75,.034*phraseLevel,.24);}
    }else{
      if(bar%2===0){for(let i=0;i<4;i++)note('ensemble',bar,.05+i*.025,tones[i],7.85,.025,-.6+i*.4);
        note('bass',bar,.1,root+12,4.5,.046,-.12);}
      if(bar%4===2)note('chime',bar,2.4,tones[2],1.8,.014,.32);
      for(const[b,p,d]of def.melody[slot])note('air',bar,b,p,d*beat,.026,-.22);
    }
  }
  // Soft final pickup crosses the exact PCM boundary and belongs harmonically to the opening.
  const first=def.chords[0];note(def.id==='lakeshore'?'chime':'pluck',def.bars-1,def.beats-.55,first[1],2.8,.019,-.28);
  note('ensemble',def.bars-1,def.beats-1.25,first[2],3.6,.012,.24);
  const mix=[new Float32Array(frames),new Float32Array(frames)];
  for(const channels of Object.values(buses))for(let ch=0;ch<2;ch++)for(let i=0;i<frames;i++)mix[ch][i]+=channels[ch][i];
  const dry=mix.map(x=>x.slice()),taps=def.id==='construction'?[[.047,.05],[.089,.025],[.131,.012]]:
    def.id==='solemn'?[[.109,.085],[.227,.062],[.389,.044],[.613,.030],[.947,.016]]:
      [[.071,.070],[.143,.050],[.257,.035],[.419,.024],[.673,.013]];
  for(const[delaySeconds,level]of taps){const delay=Math.round(delaySeconds*SR);for(let ch=0;ch<2;ch++){let state=0;const input=dry[1-ch];
    for(let i=0;i<frames;i++)state+=.14*(input[i]-state);
    for(let i=0;i<frames;i++){state+=.14*(input[i]-state);mix[ch][(i+delay)%frames]+=state*level;}}}
  for(const x of mix){let previous=0,state=0;const coefficient=Math.exp(-2*Math.PI*20/SR);
    for(let pass=0;pass<2;pass++)for(let i=0;i<frames;i++){const value=x[i],y=value-previous+coefficient*state;previous=value;state=y;if(pass===1)x[i]=y;}}
  const initialGain=10**(-9/20)/Math.max(...mix.map(peak));for(const x of mix)for(let i=0;i<frames;i++)x[i]*=initialGain;
  const base=join(out,'music',`${def.id}-loop`),preview=join(out,'previews',def.id);wav(base+'.wav',mix);
  const initialLoudness=loudness(base+'.wav',preview+'-loudness-initial.txt');
  const adjustmentDb=Math.min(-26-initialLoudness.integratedLUFS,-8-initialLoudness.truePeakDbTP),adjustment=10**(adjustmentDb/20);
  for(const x of mix)for(let i=0;i<frames;i++)x[i]*=adjustment;wav(base+'.wav',mix);
  const finalLoudness=loudness(base+'.wav',preview+'-loudness.txt');
  for(const[ext,codec,options]of[['ogg','libvorbis',['-q:a','5']],['mp3','libmp3lame',['-b:a','192k']]])
    ff(['-i',base+'.wav','-map_metadata','-1','-fflags','+bitexact','-flags:a','+bitexact','-c:a',codec,...options,base+'.'+ext]);
  const files=['wav','ogg','mp3'].map(ext=>{const path=base+'.'+ext,b=readFileSync(path);return{path:path.slice(out.length+1),bytes:b.length,sha256:sha(b)};});
  const pcmStats=stats(mix),pcmSeam=seam(mix),decoded=[];
  for(const file of files){const rawPath=preview+'-codec-check.f32';ff(['-i',join(out,file.path),'-f','f32le','-acodec','pcm_f32le',rawPath]);
    const raw=readFileSync(rawPath);unlinkSync(rawPath);const n=raw.length/8,channels=[new Float32Array(n),new Float32Array(n)];
    for(let i=0;i<n;i++)for(let ch=0;ch<2;ch++)channels[ch][i]=raw.readFloatLE(i*8+ch*4);
    decoded.push({path:file.path,frames:n,durationSeconds:n/SR,stats:stats(channels),seam:seam(channels),exactFrameLength:n===frames});}
  const wrapped=mix.map(c=>{const x=new Float32Array(SR*8);x.set(c.subarray(frames-SR*4));x.set(c.subarray(0,SR*4),SR*4);return x;});
  wav(preview+'-loop-seam-tail4-head4.wav',wrapped);
  ff(['-i',base+'.wav','-filter_complex','showwavespic=s=1600x480:split_channels=1:colors=0x63c4c7|0xb4cb83','-frames:v','1',preview+'-waveform.png']);
  ff(['-i',base+'.wav','-lavfi','showspectrumpic=s=1600x800:legend=1:scale=log:fscale=log:color=viridis','-frames:v','1',preview+'-spectrum.png']);
  writeFileSync(preview+'-score-events.json',JSON.stringify({id:def.id,tempoBpm:def.tempo,meter:`${def.beats}/4`,bars:def.bars,events},null,2)+'\n');
  const perSecondRmsDbFS=[];for(let offset=0;offset<frames;offset+=SR){let q=0,count=0;for(const c of mix)for(let i=offset;i<Math.min(offset+SR,frames);i++){q+=c[i]*c[i];count++;}perSecondRmsDbFS.push(db(Math.sqrt(q/count)));}
  const result={id:def.id,title:def.title,character:def.character,instruments:def.instruments,tempoBpm:def.tempo,meter:`${def.beats}/4`,bars:def.bars,
    seed:def.seed,sampleRate:SR,channels:2,frames,durationSeconds:seconds,loopStartFrame:0,loopEndFrame:frames,loopStart:0,loopEnd:seconds,
    recommendedCombinedMusicGain:[.45,.65],eventCount:events.length,melodyRestBars:def.bars-new Set(events.filter(x=>x.instrument==='air').map(x=>x.bar)).size,
    loopStrategy:'periodic note tails, circular reflections and pre-rolled DC filter; final pickup crosses the PCM boundary; no master fade',
    stats:pcmStats,loudness:finalLoudness,initialLoudness,adjustmentDb,seam:pcmSeam,decoded,perSecondRmsDbFS,files,
    historicalAuthenticity:false,humanListening:false,runtimeIntegrated:false,
    pass:pcmStats.clippedSamples===0&&pcmSeam.every(x=>x.pass)&&finalLoudness.truePeakDbTP<=-7.8&&decoded.every(x=>x.exactFrameLength&&x.stats.clippedSamples===0&&x.seam.every(s=>s.pass))};
  console.log(JSON.stringify({id:def.id,seconds,loopEnd:seconds,eventCount:events.length,loudness:finalLoudness,seam:pcmSeam.map(x=>x.boundaryJumpDbFS),pass:result.pass}));
  return result;
}

export function generateMoodLoops(out){mkdirSync(join(out,'music'),{recursive:true});mkdirSync(join(out,'previews'),{recursive:true});
  const basePath=join(out,'manifest.json'),base=JSON.parse(readFileSync(basePath,'utf8'));
  const oldFiles=[...base.music.files,...base.effects.flatMap(x=>x.files)],before=oldFiles.map(f=>{const b=readFileSync(join(out,f.path));if(sha(b)!==f.sha256||b.length!==f.bytes)throw new Error('Existing file differs: '+f.path);return{...f};});
  if(before.length!==123)throw new Error('Expected original town plus 40 effects (123 audio files)');
  const moods=definitions.map(def=>render(def,out));
  const changed=before.filter(f=>{const b=readFileSync(join(out,f.path));return b.length!==f.bytes||sha(b)!==f.sha256;}).map(x=>x.path);
  const provenance={schema:1,generator:'scripts/audio/generate-mood-loops.mjs',generatorSha256:sha(readFileSync(SOURCE)),sampleRate:SR,
    rights:'Original modern compositions and generated physical/harmonic/noise models for this project. No third-party samples or recordings.',
    externalSamples:[],historicalAuthenticity:false,humanListening:false,runtimeIntegrated:false,moods,
    preservation:{oldAudioFiles:before.length,unchanged:before.length-changed.length,changed},pass:!changed.length&&moods.every(x=>x.pass)};
  writeFileSync(join(out,'moods-manifest.json'),JSON.stringify(provenance,null,2)+'\n');
  writeFileSync(join(out,'moods-preservation.json'),JSON.stringify(provenance.preservation,null,2)+'\n');
  base.moods=moods;base.extensions={...base.extensions,moodLoops:{generator:provenance.generator,generatorSha256:provenance.generatorSha256,
    tracks:4,preservation:provenance.preservation,pass:provenance.pass,humanListening:false,runtimeIntegrated:false}};
  writeFileSync(basePath,JSON.stringify(base,null,2)+'\n');
  if(!provenance.pass)process.exitCode=1;return provenance;
}
if(process.argv[1]&&resolve(process.argv[1])===SOURCE){const at=process.argv.indexOf('--out');generateMoodLoops(resolve(at<0?join(ROOT,'.qa/audio-upgrade'):process.argv[at+1]));}
