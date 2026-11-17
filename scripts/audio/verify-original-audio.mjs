#!/usr/bin/env node
// Independent inspection of the written PCM files; no app or voice asset reads/writes.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const dir=resolve(process.argv[2]||join(root,'.qa/audio-upgrade'));
const manifest=JSON.parse(readFileSync(join(dir,'manifest.json'),'utf8'));
function wav(file){const b=readFileSync(file);let p=12,fmt,data;
  while(p+8<=b.length){const id=b.toString('ascii',p,p+4),size=b.readUInt32LE(p+4);if(id==='fmt ')fmt={channels:b.readUInt16LE(p+10),rate:b.readUInt32LE(p+12),bits:b.readUInt16LE(p+22)};if(id==='data')data=b.subarray(p+8,p+8+size);p+=8+size+(size%2);}
  if(!fmt||!data)throw new Error('Invalid WAV: '+file);
  const stride=fmt.bits/8*fmt.channels,frames=data.length/stride,channels=Array.from({length:fmt.channels},()=>new Float64Array(frames));
  for(let i=0;i<frames;i++)for(let ch=0;ch<fmt.channels;ch++)channels[ch][i]=data.readIntLE(i*stride+ch*fmt.bits/8,fmt.bits/8)/(2**(fmt.bits-1));
  return{...fmt,frames,channels};
}
function fft(real,imag){const n=real.length;for(let i=1,j=0;i<n;i++){let bit=n>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;if(i<j){[real[i],real[j]]=[real[j],real[i]];[imag[i],imag[j]]=[imag[j],imag[i]];}}
  for(let size=2;size<=n;size*=2){const angle=-2*Math.PI/size;
    for(let start=0;start<n;start+=size)for(let j=0;j<size/2;j++){const c=Math.cos(angle*j),s=Math.sin(angle*j),i=start+j,k=i+size/2,tr=real[k]*c-imag[k]*s,ti=real[k]*s+imag[k]*c;real[k]=real[i]-tr;imag[k]=imag[i]-ti;real[i]+=tr;imag[i]+=ti;}}
}
function inspect(x,rate){let square=0,weighted=0,p=0,zcr=0;for(let i=0;i<x.length;i++){const q=x[i]*x[i];square+=q;weighted+=q*i/rate;p=Math.max(p,Math.abs(x[i]));if(i&&x[i]*x[i-1]<0)zcr++;}
  const n=8192,re=new Float64Array(n),im=new Float64Array(n),samples=Math.min(n,x.length);
  for(let i=0;i<samples;i++)re[i]=x[i]*(.5-.5*Math.cos(2*Math.PI*i/(samples-1)));fft(re,im);
  let energy=0,frequency=0;const bands=[0,0,0,0];
  for(let i=1;i<n/2;i++){const f=i*rate/n,q=re[i]**2+im[i]**2;energy+=q;frequency+=f*q;bands[f<200?0:f<1000?1:f<4000?2:3]+=q;}
  let cumulative=0,t90=0;for(let i=0;i<x.length;i++){cumulative+=x[i]*x[i];if(cumulative>=square*.9){t90=i/rate;break;}}
  return{durationSeconds:x.length/rate,peakDbFS:20*Math.log10(p),rmsDbFS:10*Math.log10(square/x.length),
    temporalEnergyCentroidSeconds:weighted/square,energy90Seconds:t90,zeroCrossingsPerSecond:zcr/(x.length/rate),
    attackSpectrumCentroidHz:frequency/energy,attackBandEnergy:{below200:bands[0]/energy,from200to1000:bands[1]/energy,from1000to4000:bands[2]/energy,above4000:bands[3]/energy},
    first:x[0],last:x[x.length-1],clippedSamples:x.reduce((a,v)=>a+(Math.abs(v)>=1),0)};
}
const effects=manifest.effects.map(entry=>{const file=entry.files.find(x=>x.path.endsWith('.wav')),w=wav(join(dir,file.path));return{id:entry.id,category:entry.category,material:entry.material,sha256:file.sha256,...inspect(w.channels[0],w.rate)};});
const groups=Object.fromEntries([...new Set(effects.map(e=>e.category+':'+e.material))].map(key=>{
  const items=effects.filter(e=>e.category+':'+e.material===key);
  return[key,{count:items.length,uniquePcmHashes:new Set(items.map(x=>x.sha256)).size,
    meanAttackSpectrumCentroidHz:items.reduce((n,x)=>n+x.attackSpectrumCentroidHz,0)/items.length,
    meanEnergy90Seconds:items.reduce((n,x)=>n+x.energy90Seconds,0)/items.length}];}));
const musicLoops=(manifest.moods||[]).map(entry=>{const file=entry.files.find(x=>x.path.endsWith('.wav')),w=wav(join(dir,file.path));
  const seams=w.channels.map(x=>{let q=0,p=0;for(let i=1;i<x.length;i++){const d=Math.abs(x[i]-x[i-1]);q+=d*d;p=Math.max(p,d);}const delta=Math.abs(x[0]-x.at(-1)),slope=Math.sqrt(q/(x.length-1));return{boundaryJumpDbFS:20*Math.log10(delta||1e-8),boundaryToSlopeRms:delta/slope,maxInteriorSlope:p,pass:delta<Math.max(.0025,slope*4)};});
  let peak=0,clipped=0;for(const x of w.channels)for(const value of x){peak=Math.max(peak,Math.abs(value));if(Math.abs(value)>=1)clipped++;}
  const correctLength=w.frames===entry.frames&&Math.abs(entry.loopEnd*w.rate-w.frames)<.01;
  return{id:entry.id,frames:w.frames,durationSeconds:w.frames/w.rate,channels:w.channels.length,rate:w.rate,bits:w.bits,peakDbFS:20*Math.log10(peak),clippedSamples:clipped,seams,
    pass:correctLength&&w.channels.length===2&&w.rate===48000&&clipped===0&&seams.every(s=>s.pass)};});
const allFiles=[...manifest.music.files,...manifest.effects.flatMap(x=>x.files),...(manifest.moods||[]).flatMap(x=>x.files)];
const hashMismatches=allFiles.filter(x=>createHash('sha256').update(readFileSync(join(dir,x.path))).digest('hex')!==x.sha256).map(x=>x.path);
const report={scope:'Written PCM and manifest inspection; no human-listening or browser-runtime certification',
  effects,groups,musicLoops,checkedAudioFileCount:allFiles.length,hashMismatches,allEffectsCleanEndpoints:effects.every(e=>e.first===0&&e.last===0),
  stoneExtensionPresent:!manifest.extensions?.stoneInteractions||groups['interaction:stone']?.count===4,
  pass:hashMismatches.length===0&&effects.every(e=>e.clippedSamples===0&&e.first===0&&e.last===0)&&Object.values(groups).every(g=>g.count===4&&g.uniquePcmHashes===4)&&(!manifest.extensions?.stoneInteractions||groups['interaction:stone']?.count===4)&&musicLoops.every(x=>x.pass)};
writeFileSync(join(dir,'pcm-verification.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({groups,musicLoops,checkedAudioFileCount:allFiles.length,hashMismatches,allEffectsCleanEndpoints:report.allEffectsCleanEndpoints,pass:report.pass},null,2));
if(!report.pass)process.exitCode=1;
