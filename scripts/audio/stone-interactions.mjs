#!/usr/bin/env node
/** Incremental original stone-vessel touch/set-down palette; preserves all existing audio files. */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const SOURCE=fileURLToPath(import.meta.url),ROOT=resolve(dirname(SOURCE),'../..'),SR=48000,SEED=0x21a0d10;
const hash=b=>createHash('sha256').update(b).digest('hex');
function random(seed){let s=seed>>>0;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296;};}
function edge(x,a=.003,r=.025){for(let i=0,n=Math.round(a*SR);i<n;i++)x[i]*=Math.sin(i/n*Math.PI/2)**2;
  for(let i=0,n=Math.round(r*SR);i<n;i++)x[x.length-1-i]*=Math.sin(i/n*Math.PI/2)**2;return x;}
function resonance(duration,modes,seed){const x=new Float64Array(Math.round(duration*SR)),rnd=random(seed);
  for(const[f,level,tau]of modes){const phase=rnd()*.1;for(let i=0;i<x.length;i++)x[i]+=level*Math.sin(2*Math.PI*f*i/SR+phase)*Math.exp(-i/(SR*tau));}return edge(x);}
function friction(duration,seed,low,high,tau,level){const x=new Float64Array(Math.round(duration*SR)),rnd=random(seed),a=1-Math.exp(-2*Math.PI*low/SR),b=1-Math.exp(-2*Math.PI*high/SR);let lo=0,hi=0;
  for(let i=0;i<x.length;i++){lo+=a*(rnd()*2-1-lo);hi+=b*(lo-hi);x[i]=(lo-hi)*level*Math.exp(-i/(SR*tau));}return edge(x,.002,.015);}
function stone(variant,seed){const rnd=random(seed),base=435+rnd()*65,bodyDecay=.026+rnd()*.010;
  const x=new Float64Array(Math.round((.36+variant*.018)*SR));
  const add=(data,at=0,gain=1)=>{const offset=Math.round(at*SR);for(let i=0;i<data.length&&i+offset<x.length;i++)x[i+offset]+=data[i]*gain;};
  // Dense damped body: unlike the thin ceramic shell or the sustained wooden cavity.
  add(resonance(.32,[[base,.43,bodyDecay],[base*1.79,.18,bodyDecay*.56],[base*2.86,.065,.009],[base*4.37,.018,.005]],seed));
  add(resonance(.18,[[117+rnd()*23,.14,.016],[252,.035,.012]],seed+17));
  add(friction(.08,seed+31,6500,1800,.005,.14));
  add(friction(.20,seed+47,1800+rnd()*700,240,.039+rnd()*.012,.16),.014+rnd()*.009);
  // Small settling contact is not breakage, debris, weapon impact or a repeated hammer strike.
  add(resonance(.14,[[base*.87,.055,.013],[base*1.46,.018,.009]],seed+61),.032+rnd()*.015);
  edge(x,.003,.03);let p=0;for(const v of x)p=Math.max(p,Math.abs(v));const gain=10**(-14/20)/p;
  for(let i=0;i<x.length;i++)x[i]*=gain;return x;
}
function pcmWav(pcm,channels=1){const b=Buffer.alloc(44+pcm.length);b.write('RIFF',0);b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(channels,22);b.writeUInt32LE(SR,24);b.writeUInt32LE(SR*channels*2,28);b.writeUInt16LE(channels*2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(pcm.length,40);pcm.copy(b,44);return b;}
function encodeWav(data){const b=Buffer.alloc(data.length*2);for(let i=0;i<data.length;i++)b.writeInt16LE(Math.round(data[i]*32767),i*2);return pcmWav(b);}
function readPcm(path){const b=readFileSync(path);let p=12,channels,rate,bits;
  while(p+8<=b.length){const name=b.toString('ascii',p,p+4),size=b.readUInt32LE(p+4);if(name==='fmt '){channels=b.readUInt16LE(p+10);rate=b.readUInt32LE(p+12);bits=b.readUInt16LE(p+22);}if(name==='data'){if(channels!==1||rate!==SR||bits!==16)throw new Error('Gallery expects 48k mono PCM16: '+path);return b.subarray(p+8,p+8+size);}p+=8+size+(size%2);}throw new Error('Invalid WAV: '+path);}
function ff(args){execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-threads','1','-filter_threads','1',...args],{stdio:'inherit'});}
function stats(x){let peak=0,energy=0,dc=0;for(const v of x){peak=Math.max(peak,Math.abs(v));energy+=v*v;dc+=v;}return{peakDbFS:20*Math.log10(peak),rmsDbFS:10*Math.log10(energy/x.length),dcMean:dc/x.length,clippedSamples:x.reduce((a,v)=>a+(Math.abs(v)>=1),0)};}

export function appendStoneInteractions(out){
  const manifestPath=join(out,'manifest.json'),manifest=JSON.parse(readFileSync(manifestPath,'utf8'));
  const legacyEffects=manifest.effects.filter(x=>!(x.category==='interaction'&&x.material==='stone'));
  const legacyFiles=[...manifest.music.files,...legacyEffects.flatMap(x=>x.files)];
  if(legacyFiles.length!==111)throw new Error(`Expected the original 111 files, found ${legacyFiles.length}`);
  const before=legacyFiles.map(f=>{const b=readFileSync(join(out,f.path));const actual={path:f.path,bytes:b.length,sha256:hash(b)};
    if(actual.sha256!==f.sha256||actual.bytes!==f.bytes)throw new Error('Pre-existing audio differs from manifest: '+f.path);return actual;});
  writeFileSync(join(out,'stone-preservation-before.json'),JSON.stringify({files:before},null,2)+'\n');
  mkdirSync(join(out,'sfx'),{recursive:true});mkdirSync(join(out,'previews'),{recursive:true});
  const added=[];
  for(let variant=1;variant<=4;variant++){
    const seed=SEED+50000+variant*113,id=`interact-stone-${variant}`,data=stone(variant,seed),wav=join(out,'sfx',id+'.wav');
    writeFileSync(wav,encodeWav(data));
    const paths=[wav,wav.replace(/\.wav$/,'.ogg'),wav.replace(/\.wav$/,'.mp3')];
    ff(['-i',wav,'-map_metadata','-1','-fflags','+bitexact','-flags:a','+bitexact','-c:a','libvorbis','-q:a','4',paths[1]]);
    ff(['-i',wav,'-map_metadata','-1','-fflags','+bitexact','-flags:a','+bitexact','-c:a','libmp3lame','-b:a','96k',paths[2]]);
    added.push({id,category:'interaction',material:'stone',variant,seed,
      description:'Gentle dense stone-vessel touch/set-down: damped body modes, low contact, short handling friction and a small settling contact; no breaking, weapon or hammer sound',
      channels:1,sampleRate:SR,frames:data.length,durationSeconds:data.length/SR,stats:stats(data),
      files:paths.map(path=>{const b=readFileSync(path);return{path:path.slice(out.length+1),bytes:b.length,sha256:hash(b)};})});
  }
  manifest.effects=[...legacyEffects,...added];
  // Copy PCM bytes, preserving all original 36 gallery segments without a second quantization.
  const gallery=(entries,name)=>{let frames=0;const chunks=[],index=[],silence=Buffer.alloc(Math.round(SR*.45)*2);
    for(const item of entries){const pcm=readPcm(join(out,item.files.find(f=>f.path.endsWith('.wav')).path));index.push({id:item.id,startSeconds:frames/SR,durationSeconds:pcm.length/2/SR});chunks.push(pcm,silence);frames+=pcm.length/2+silence.length/2;}
    writeFileSync(join(out,'previews',name+'.wav'),pcmWav(Buffer.concat(chunks)));
    writeFileSync(join(out,'previews',name+'-index.json'),JSON.stringify(index,null,2)+'\n');};
  gallery(manifest.effects,'effects-gallery');gallery(added,'stone-interactions-gallery');
  ff(['-i',join(out,'previews/effects-gallery.wav'),'-lavfi','showspectrumpic=s=1600x800:legend=1:scale=log:fscale=log:color=viridis','-frames:v','1',join(out,'previews/effects-spectrum.png')]);
  ff(['-i',join(out,'previews/stone-interactions-gallery.wav'),'-lavfi','showspectrumpic=s=1200x640:legend=1:scale=log:fscale=log:color=viridis','-frames:v','1',join(out,'previews/stone-interactions-spectrum.png')]);
  const preserved=before.map(f=>{const b=readFileSync(join(out,f.path));return{...f,unchanged:b.length===f.bytes&&hash(b)===f.sha256};});
  const preservation={originalAudioFiles:before.length,unchanged:preserved.filter(x=>x.unchanged).length,
    changed:preserved.filter(x=>!x.unchanged).map(x=>x.path),addedAudioFiles:added.flatMap(x=>x.files).length,
    totalAudioFiles:before.length+added.flatMap(x=>x.files).length,pass:preserved.every(x=>x.unchanged)};
  manifest.extensions={...manifest.extensions,stoneInteractions:{generator:'scripts/audio/stone-interactions.mjs',generatorSha256:hash(readFileSync(SOURCE)),
    currentBaseGeneratorSha256:hash(readFileSync(join(ROOT,'scripts/audio/generate-original-audio.mjs'))),
    seed:SEED+50000,variationCount:4,preservation,humanListening:false,runtimeIntegrated:false}};
  manifest.verification.pass=manifest.verification.pass&&preservation.pass&&added.every(x=>x.stats.clippedSamples===0);
  writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
  writeFileSync(join(out,'stone-preservation.json'),JSON.stringify(preservation,null,2)+'\n');
  console.log(JSON.stringify({stoneInteractions:4,totalEffects:manifest.effects.length,preservation},null,2));
  if(!preservation.pass)throw new Error('Original audio preservation failed');
  return preservation;
}

if(process.argv[1]&&resolve(process.argv[1])===SOURCE){const at=process.argv.indexOf('--out');appendStoneInteractions(resolve(at<0?join(ROOT,'.qa/audio-upgrade'):process.argv[at+1]));}
