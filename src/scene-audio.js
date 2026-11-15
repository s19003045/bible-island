import voices from './voice-manifest.json';
import {Vector3} from 'three';

// Original synthesized ambience; no claim to reproduce the sound of an ancient city.
export function createSceneAudio(onState=()=>{}) {
  let ctx=null,master=null,ambient=null,speech=null,enabled=false,active=false,hidden=false,token=0,source=null,voicePosition=null,playing=null,lastEffect=0;
  const buffers=new Map(),pending=new Map();const volume={environment:.6,voice:.9};let noise=null;
  const report=(status,text='')=>onState({enabled,status,text,volume:{...volume}});
  function panner(position,bus) {
    const p=ctx.createPanner();p.panningModel='HRTF';p.distanceModel='inverse';p.refDistance=4;p.maxDistance=55;p.rolloffFactor=1.2;
    p.positionX.value=position[0];p.positionY.value=position[1];p.positionZ.value=position[2];p.connect(bus);return p;
  }
  function build() {
    if(ctx)return;
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw new Error('此裝置無法開啟音訊，仍可閱讀字幕。');ctx=new AC();
    master=ctx.createGain();master.gain.value=.72;master.connect(ctx.destination);ambient=ctx.createGain();ambient.connect(master);speech=ctx.createGain();speech.connect(master);
    noise=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);const data=noise.getChannelData(0);let b=0;for(let i=0;i<data.length;i++){b=(b+(Math.random()*2-1)*.02)/1.02;data[i]=b*3;}
    function loop(position,frequency,gain) {const s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();s.buffer=noise;s.loop=true;f.type='bandpass';f.frequency.value=frequency;f.Q.value=.5;g.gain.value=gain;s.connect(f);f.connect(g);g.connect(position?panner(position,ambient):ambient);s.start();}
    loop(null,230,.16);loop([-48,14,5],1100,.045);mix();
  }
  function mix() {if(!ctx)return;const now=ctx.currentTime;ambient.gain.setTargetAtTime(enabled&&active&&!hidden?volume.environment*(playing?.3:1):0,now,.18);speech.gain.setTargetAtTime(enabled&&!hidden?volume.voice:0,now,.04);}
  function stopVoice() {token++;if(source){try{source.stop();}catch{}source=null;}playing=null;voicePosition=null;mix();report(enabled?'ready':'off');}
  async function enable(value=true) {
    enabled=value;
    if(!value){stopVoice();mix();return false;}
    try{build();await ctx.resume();if(ctx.state!=='running')throw new Error('點一下聲音按鈕以繼續播放。');mix();report('ready');return true;}
    catch(e){enabled=false;mix();report('unavailable',e.message);return false;}
  }
  async function bufferFor(person) {
    if(buffers.has(person))return buffers.get(person);
    if(!pending.has(person))pending.set(person,(async()=>{const response=await fetch(new URL(voices[person].src,document.baseURI));if(!response.ok)throw new Error('配音暫時無法載入，請使用字幕或稍後重播。');const b=await ctx.decodeAudioData(await response.arrayBuffer());buffers.set(person,b);return b;})().finally(()=>pending.delete(person)));
    return pending.get(person);
  }
  return {
    get enabled(){return enabled;},get playing(){return playing;},enable,stopVoice,
    setActive(value){active=value;mix();if(!value)stopVoice();},
    setHidden(value){hidden=value;if(value)stopVoice();mix();},
    setVolume(kind,value){if(!(kind in volume))return;volume[kind]=Math.max(0,Math.min(1,Number(value)));if(kind==='voice'&&volume.voice===0)stopVoice();mix();report(enabled?'ready':'off');},
    async speak(person,key,position) {
      stopVoice();const cue=voices[person]?.clips[key];if(!enabled||!cue||!volume.voice)return;
      const generation=token;report('loading','正在載入角色語音…');
      try {
        await ctx.resume();const buffer=await bufferFor(person);if(generation!==token||!enabled||hidden)return;
        source=ctx.createBufferSource();source.buffer=buffer;const node=panner(position||[0,1.6,0],speech);source.connect(node);voicePosition=node;playing={person,key,text:cue.text};mix();
        source.onended=()=>{node.disconnect();if(generation!==token)return;source=null;playing=null;voicePosition=null;mix();report('ready');};
        source.start(0,cue.start,Math.min(cue.end-cue.start,buffer.duration-cue.start));report('playing',cue.text);
      }catch(e){if(generation===token){playing=null;mix();report('unavailable',e.message);}}
    },
    update(camera,people,now) {
      if(!ctx||!enabled||hidden)return;
      const l=ctx.listener,direction=camera.getWorldDirection(_direction);l.positionX.value=camera.position.x;l.positionY.value=camera.position.y;l.positionZ.value=camera.position.z;
      l.forwardX.value=direction.x;l.forwardY.value=direction.y;l.forwardZ.value=direction.z;l.upX.value=0;l.upY.value=1;l.upZ.value=0;
      if(voicePosition&&playing){const p=people.find(p=>p.id===playing.person)?.state.position;if(p){voicePosition.positionX.value=p[0];voicePosition.positionY.value=p[1]+1.5;voicePosition.positionZ.value=p[2];}}
      if(active&&now-lastEffect>5200){lastEffect=now;const o=ctx.createOscillator(),g=ctx.createGain(),t=ctx.currentTime;o.type='sine';o.frequency.setValueAtTime(2100,t);o.frequency.exponentialRampToValueAtTime(3100,t+.12);o.frequency.exponentialRampToValueAtTime(2300,t+.28);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.018,t+.05);g.gain.exponentialRampToValueAtTime(.0001,t+.32);const p=panner([-11,13,9],ambient);o.connect(g);g.connect(p);o.start();o.stop(t+.34);o.onended=()=>{g.disconnect();p.disconnect();};}
    },
    footstep(position) {
      if(!ctx||!enabled||!active||hidden||!volume.environment||ctx.state!=='running')return;
      const s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain(),t=ctx.currentTime;s.buffer=noise;f.type='lowpass';f.frequency.value=(Math.abs(position[2])<2.3?1500:600)+Math.random()*300;g.gain.setValueAtTime(.55*volume.environment,t);g.gain.exponentialRampToValueAtTime(.0001,t+.13);s.connect(f);f.connect(g);g.connect(master);s.start(0,Math.random(),.14);s.onended=()=>{f.disconnect();g.disconnect();};
      const o=ctx.createOscillator(),thud=ctx.createGain();o.frequency.setValueAtTime(130,t);o.frequency.exponentialRampToValueAtTime(65,t+.08);thud.gain.setValueAtTime(.08*volume.environment,t);thud.gain.exponentialRampToValueAtTime(.0001,t+.1);o.connect(thud);thud.connect(master);o.start();o.stop(t+.11);o.onended=()=>thud.disconnect();
    },
    dispose(){stopVoice();ctx?.close();},
  };
}
const _direction=new Vector3();
