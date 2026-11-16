import voices from './voice-manifest.json';
import {Vector3} from 'three';

// Original synthesized ambience; no claim to reproduce the sound of an ancient city.
export function createSceneAudio(onState=()=>{},preferences={}) {
  let ctx=null,master=null,ambient=null,speech=null,music=null,musicGain=null,enabled=false,active=false,hidden=false,token=0,source=null,voicePosition=null,playing=null,nextEffect=0;
  const buffers=new Map(),pending=new Map();const volume={environment:.6,voice:.9,music:.16};let noise=null,island='jerusalem',ambientNodes=[],transients=new Set();
  for(const key of Object.keys(volume))if(Number.isFinite(preferences[key]))volume[key]=Math.max(0,Math.min(1,preferences[key]));
  const profiles={...Object.fromEntries([['table',['preparation','meal'],{cloth:[-3,3,-23],bird:[-30,5,-15],tone:420,ground:'earth',quiet:true}],['garden',['prayer','arrest','council','governor','cross'],{cloth:[-15,3,16],bird:[-30,5,-4],tone:280,ground:'earth',quiet:true}],['tomb',['burial','spices','morning'],{cloth:[-5,3,8],bird:[-28,5,12],tone:350,ground:'earth',quiet:true}]].flatMap(([chapter,phases,profile])=>phases.map(phase=>[`passion:${chapter}:${phase}`,profile]))),...Object.fromEntries([['seed',['sowing','asking','hearing'],{cloth:[24,3,23],bird:[-30,5,-15],tone:510,ground:'earth'}],['sheep',['listeners','found','rejoicing'],{cloth:[-13,3,25],bird:[-30,5,-4],tone:460,ground:'earth'}],['lamp',['preparation','midnight','door','watch'],{cloth:[13,3,-18],bird:[-28,5,12],tone:330,ground:'earth',quiet:true}]].flatMap(([chapter,phases,profile])=>phases.map(phase=>[`parables:${chapter}:${phase}`,profile]))),...Object.fromEntries([['well',['water','worship','witness','hearing'],{cloth:[24,3,-9],bird:[-19,5,13],tone:470,ground:'earth',effect:'water'}],['road',['questions','passing','approach'],{cloth:[22,4,20],bird:[31,6,19],tone:360,ground:'earth',quiet:true}],['inn',['care','entrust','promise'],{cloth:[12,4,-23],bird:[-28,5,7],tone:530,ground:'earth',effect:'home'}]].flatMap(([chapter,phases,profile])=>phases.map(phase=>[`samaria:${chapter}:${phase}`,profile]))),'galilee:boat:casting':{cloth:[26,2,4],bird:[-25,5,-20],tone:560,ground:'earth',effect:'water'},'galilee:boat:mending':{cloth:[26,2,4],bird:[-25,5,-20],tone:560,ground:'earth',effect:'water'},'galilee:boat:depart':{cloth:[26,2,4],bird:[-25,5,-20],tone:330,ground:'earth',effect:'water',quiet:true},'galilee:boat:storm':{cloth:[26,2,4],bird:[-25,5,-20],tone:460,ground:'earth',effect:'water'},'galilee:boat:calm':{cloth:[26,2,4],bird:[-25,5,-20],tone:330,ground:'earth',effect:'water',quiet:true},'galilee:synagogue:teaching':{cloth:[26,2,4],bird:[-25,5,-20],tone:620,ground:'earth'},'galilee:synagogue:rebuke':{cloth:[26,2,4],bird:[-25,5,-20],tone:620,ground:'earth'},'galilee:synagogue:response':{cloth:[26,2,4],bird:[-25,5,-20],tone:620,ground:'earth'},'galilee:house:crowd':{cloth:[26,2,4],bird:[-25,5,-20],tone:520,ground:'earth',effect:'home'},'galilee:house:roof':{cloth:[26,2,4],bird:[-25,5,-20],tone:520,ground:'earth',effect:'home'},'galilee:house:authority':{cloth:[26,2,4],bird:[-25,5,-20],tone:520,ground:'earth',effect:'home'},'nativity:manger:birth':{cloth:[35,3,12],bird:[-26,6,27],tone:470,ground:'earth'},'nativity:manger:field':{cloth:[35,3,12],bird:[-33,2,-30],tone:270,ground:'earth',quiet:true},'nativity:manger:visit':{cloth:[35,3,12],bird:[-33,2,-30],tone:320,ground:'earth',quiet:true},'nativity:home:growth':{cloth:[-25,3,7],bird:[-47,5,1],tone:510,ground:'earth',effect:'home'},'nativity:home:festival':{cloth:[-25,3,7],bird:[-47,5,1],tone:510,ground:'earth',effect:'home'},'nativity:home:return':{cloth:[-25,3,7],bird:[-47,5,1],tone:510,ground:'earth',effect:'home'},'nativity:tools':{cloth:[-26,3,8],bird:[34,5,-8],tone:610,ground:'earth',effect:'work'},'intertestament:road':{cloth:[35,3,9],bird:[-34,6,29],tone:560,ground:'earth'},'intertestament:coin':{cloth:[-25,3,9],bird:[34,6,-10],tone:640,ground:'stone'},'intertestament:scroll':{cloth:[35,3,9],bird:[-23,6,-9],tone:580,ground:'earth'},'nehemiah:wall:survey':{cloth:[-27,2,12],bird:[-27,6,-12],tone:290,ground:'earth',quiet:true},'nehemiah:wall:proposal':{cloth:[35,3,9],bird:[-24,6,27],tone:490,ground:'earth'},'nehemiah:wall:sections':{cloth:[-26,2,-8],bird:[35,6,-11],tone:700,ground:'earth',effect:'work'},'nehemiah:gate:watch':{cloth:[-26,2,-8],bird:[32,6,-19],tone:650,ground:'earth',effect:'work'},'nehemiah:gate:unfinished-gates':{cloth:[34,3,12],bird:[12,6,-30],tone:540,ground:'earth'},'nehemiah:gate:wall-complete':{cloth:[34,3,12],bird:[12,6,-30],tone:590,ground:'earth'},'nehemiah:gate:gates':{cloth:[34,3,12],bird:[9,4,-30],tone:570,ground:'earth',effect:'home'},'nehemiah:scroll':{cloth:[-28,2,-6],bird:[-24,6,27],tone:480,ground:'earth'},'exile:road':{cloth:[-26,3,10],bird:[-22,6,30],tone:400,ground:'earth'},'exile:canal':{cloth:[-33,1,7],bird:[-25,6,2],tone:440,ground:'earth',effect:'water'},'exile:home':{cloth:[-26,3,9],bird:[-43,6,10],tone:490,ground:'earth',effect:'home'},'kingdoms:south':{cloth:[-26,3,9],bird:[-23,6,30],tone:570,ground:'earth'},'kingdoms:north':{cloth:[35,3,7],bird:[-24,6,-10],tone:630,ground:'earth',effect:'home'},'kingdoms:prophet':{cloth:[35,3,10],bird:[34,6,26],tone:700,ground:'earth',effect:'work'},'david:sheep':{cloth:[-24,3,19],bird:[-30,5,3],tone:520,ground:'earth'},'david:city':{cloth:[33,3,8],bird:[36,6,-28],tone:760,ground:'earth',effect:'work'},'david:ark:cart':{cloth:[-25,3,-12],bird:[-32,5,16],tone:400,ground:'earth'},'david:ark:pause':{cloth:[34,3,12],bird:[-25,5,17],tone:480,ground:'earth',effect:'home'},'david:ark:carry':{cloth:[-25,3,-12],bird:[-32,5,16],tone:530,ground:'earth'},'david:ark:tent':{cloth:[-25,3,-12],bird:[-32,5,16],tone:450,ground:'earth'},'judges:field':{cloth:[-25,3,15],bird:[-23,6,17],tone:650,ground:'earth',effect:'home'},'judges:floor':{cloth:[33,3,9],bird:[-23,6,6],tone:570,ground:'earth',effect:'work'},'judges:gate':{cloth:[35,3,9],bird:[-25,6,12],tone:720,ground:'earth'},'sinai:manna':{cloth:[-27,3,18],bird:[-20,4,28],tone:510,ground:'earth',effect:'home'},'sinai:water':{cloth:[-25,2,-10],bird:[32,5,-8],tone:410,ground:'earth',effect:'water'},'sinai:mountain':{cloth:[-24,3,4],bird:[-31,6,35],tone:350,ground:'earth'},'joseph:caravan':{cloth:[-24,3,17],bird:[-20,7,22],tone:480,ground:'earth'},'joseph:grain':{cloth:[34,3,7],bird:[37,8,25],tone:730,ground:'earth',effect:'work'},'joseph:family':{cloth:[2,3,-7],bird:[-19,7,1],tone:580,ground:'earth',effect:'home'},'abraham:altar':{cloth:[7,3,-30],bird:[-12,8,1],tone:520,ground:'earth'},'abraham:tent':{cloth:[9,3,-9],bird:[-12,8,1],tone:610,ground:'earth',effect:'home'},'abraham:well':{cloth:[-5,1,7],bird:[-23,7,15],tone:450,ground:'earth',effect:'water'},'paul:ship':{cloth:[-12,2,0],bird:[-16,7,-5],tone:420,ground:'stone',effect:'water'},'paul:square':{cloth:[-5,1,9],bird:[-17,6,15],tone:540,ground:'earth',effect:'water'},'paul:letter':{cloth:[28,2,18],bird:[40,8,-25],tone:930,ground:'stone',effect:'work'},'second-temple:foundation':{cloth:[-20,2,20],bird:[-36,7,38],tone:660,ground:'earth'},'second-temple:work':{cloth:[-17,2,-4],bird:[36,7,38],tone:760,ground:'earth',effect:'work'},'second-temple:dedication':{cloth:[21,2,20],bird:[36,7,38],tone:620,ground:'earth'},jordan:{cloth:[0,1,-55],bird:[30,7,-35],tone:430,ground:'earth',effect:'water'},'exodus:bricks':{cloth:[-46,1,-24],bird:[-68,5,-10],tone:720,ground:'earth',effect:'work'},'exodus:passover':{cloth:[-35,1.4,24.5],bird:[-45,5,40],tone:580,ground:'earth',effect:'home'},'exodus:crossing':{cloth:[35,2,9.5],bird:[110,8,-12],tone:360,ground:'earth',effect:'water'},herod:{cloth:[78,10,54],bird:[112,18,-25],tone:960,ground:'stone'},jerusalem:{cloth:[-48,14,5],bird:[-11,13,9],tone:1100,ground:'stone'},tabernacle:{cloth:[31,1.4,6],bird:[43,3,-12],tone:680,ground:'earth'},solomon:{cloth:[32,1.4,-12],bird:[45,6,18],tone:900,ground:'stone'}};
  const report=(status,text='')=>onState({enabled,status,text,volume:{...volume}});
  function panner(position,bus) {
    const p=ctx.createPanner();p.panningModel='HRTF';p.distanceModel='inverse';p.refDistance=4;p.maxDistance=55;p.rolloffFactor=1.2;
    p.positionX.value=position[0];p.positionY.value=position[1];p.positionZ.value=position[2];p.connect(bus);return p;
  }
  function build() {
    if(ctx)return;
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw new Error('此裝置無法開啟音訊，仍可閱讀字幕。');ctx=new AC();
    master=ctx.createGain();master.gain.value=.72;master.connect(ctx.destination);ambient=ctx.createGain();ambient.connect(master);speech=ctx.createGain();speech.connect(master);musicGain=ctx.createGain();musicGain.connect(master);
    noise=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);const data=noise.getChannelData(0);let b=0;for(let i=0;i<data.length;i++){b=(b+(Math.random()*2-1)*.02)/1.02;data[i]=b*3;}
    rebuildAmbience();buildMusic();mix();
  }
  function stopTransients(){for(const nodes of transients){try{nodes[0].stop();}catch{}for(const n of nodes)n.disconnect();}transients.clear();}
  function rebuildAmbience() {
    stopTransients();
    for(const n of ambientNodes){try{n.stop?.();}catch{}n.disconnect();}ambientNodes=[];
    const profile=profiles[island]||profiles.jerusalem;
    function loop(position,frequency,gain) {
      const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),level=ctx.createGain();
      source.buffer=noise;source.loop=true;filter.type='bandpass';filter.frequency.value=frequency;filter.Q.value=.5;level.gain.value=gain;
      source.connect(filter);filter.connect(level);const node=position?panner(position,ambient):ambient;level.connect(node);source.start();
      ambientNodes.push(source,filter,level);if(node!==ambient)ambientNodes.push(node);
    }
    loop(null,230,profile.quiet?.085:.16);loop(profile.cloth,profile.tone,profile.quiet?.025:.045);nextEffect=0;
  }
  function buildMusic() {
    // Original modern ambient score. No sampled recordings or historical authenticity claim.
    const seconds=48,buffer=ctx.createBuffer(1,ctx.sampleRate*seconds,ctx.sampleRate),data=buffer.getChannelData(0);
    const notes=[146.832,174.614,195.998,220,195.998,174.614,164.814,146.832];
    for(let i=0;i<data.length;i++) {
      const t=i/ctx.sampleRate,n=Math.floor(t/6),phase=(t%6)/6,env=Math.sin(Math.PI*phase)**2;
      const fundamental=notes[n],tone=Math.sin(2*Math.PI*fundamental*t)*.22+Math.sin(2*Math.PI*fundamental*1.5*t)*.065+Math.sin(2*Math.PI*fundamental*2*t)*.035;
      data[i]=tone*env;
    }
    music=ctx.createBufferSource();music.buffer=buffer;music.loop=true;music.connect(musicGain);music.start();
  }

  function mix() {if(!ctx)return;const now=ctx.currentTime;ambient.gain.setTargetAtTime(enabled&&active&&!hidden?volume.environment*(playing?.3:1):0,now,.18);speech.gain.setTargetAtTime(enabled&&!hidden?volume.voice:0,now,.04);musicGain.gain.setTargetAtTime(enabled&&active&&!hidden?volume.music*(playing?.18:1):0,now,.3);}
  function stopVoice() {token++;if(source){try{source.stop();}catch{}source=null;}playing=null;voicePosition=null;mix();report(enabled?'ready':'off');}
  async function enable(value=true) {
    enabled=value;
    if(!value){stopVoice();mix();return false;}
    try{build();await ctx.resume();if(ctx.state!=='running')throw new Error('點一下聲音按鈕以繼續播放。');mix();report('ready');return true;}
    catch(e){enabled=false;mix();report('unavailable',e.message);return false;}
  }
  async function bufferFor(person,cue) {
    const url=cue.src||voices[person].src;
    if(buffers.has(url)){const cached=buffers.get(url);buffers.delete(url);buffers.set(url,cached);return cached;}
    if(!pending.has(url))pending.set(url,(async()=>{const response=await fetch(new URL(url,document.baseURI));if(!response.ok)throw new Error('配音暫時無法載入，請使用字幕或稍後重播。');const b=await ctx.decodeAudioData(await response.arrayBuffer());buffers.set(url,b);while(buffers.size>4)buffers.delete(buffers.keys().next().value);return b;})().finally(()=>pending.delete(url)));
    return pending.get(url);
  }
  return {
    get volumes(){return {...volume};},get enabled(){return enabled;},get playing(){return playing;},enable,stopVoice,
    setScene(id,segment=null,phase=null){const key=segment?`${id}:${segment}${phase?`:${phase}`:''}`:id;if(key===island)return;stopVoice();island=key;if(ctx)rebuildAmbience();},
    setActive(value){active=value;mix();if(!value)stopVoice();},
    setHidden(value){hidden=value;if(value)stopVoice();mix();},
    setVolume(kind,value){if(!(kind in volume))return;volume[kind]=Math.max(0,Math.min(1,Number(value)));if(kind==='voice'&&volume.voice===0)stopVoice();mix();report(enabled?'ready':'off');},
    async speak(person,key,position) {
      stopVoice();const cue=voices[person]?.clips[key];if(!enabled||!cue||!volume.voice)return;
      const generation=token;report('loading','正在載入角色語音…');
      try {
        await ctx.resume();const buffer=await bufferFor(person,cue);if(generation!==token||!enabled||hidden)return;
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
      if(active&&now>nextEffect){
        const profile=profiles[island]||profiles.jerusalem;nextEffect=now+(profile.effect==='work'?1800+Math.random()*3200:4000+Math.random()*5000);
        if(profile.effect){
          const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),g=ctx.createGain(),t=ctx.currentTime,water=profile.effect==='water',duration=water?1.4:.14;
          source.buffer=noise;filter.type='bandpass';filter.frequency.value=water?420:profile.effect==='work'?680:1450;filter.Q.value=water?.35:1.3;
          g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(water?.025:.035,t+(water?.45:.015));g.gain.exponentialRampToValueAtTime(.0001,t+duration);
          const p=panner(profile.cloth,ambient),nodes=[source,filter,g,p];transients.add(nodes);source.connect(filter);filter.connect(g);g.connect(p);source.start(0,Math.random()*.4,duration);source.onended=()=>{transients.delete(nodes);filter.disconnect();g.disconnect();p.disconnect();};
        }else if(!profile.quiet){const o=ctx.createOscillator(),g=ctx.createGain(),t=ctx.currentTime;o.type='sine';o.frequency.setValueAtTime(2100,t);o.frequency.exponentialRampToValueAtTime(3100,t+.12);o.frequency.exponentialRampToValueAtTime(2300,t+.28);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.018,t+.05);g.gain.exponentialRampToValueAtTime(.0001,t+.32);const p=panner((profiles[island]||profiles.jerusalem).bird,ambient);o.connect(g);g.connect(p);o.start();o.stop(t+.34);o.onended=()=>{g.disconnect();p.disconnect();};}
      }
    },
    footstep(position) {
      if(!ctx||!enabled||!active||hidden||!volume.environment||ctx.state!=='running')return;
      const s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain(),t=ctx.currentTime;s.buffer=noise;f.type='lowpass';f.frequency.value=((profiles[island]||profiles.jerusalem).ground==='earth'?480:['solomon','herod'].includes(island)||Math.abs(position[2])<2.3?1500:600)+Math.random()*300;g.gain.setValueAtTime(.55,t);g.gain.exponentialRampToValueAtTime(.0001,t+.13);s.connect(f);f.connect(g);g.connect(ambient);s.start(0,Math.random(),.14);s.onended=()=>{f.disconnect();g.disconnect();};
      const o=ctx.createOscillator(),thud=ctx.createGain();o.frequency.setValueAtTime(130,t);o.frequency.exponentialRampToValueAtTime(65,t+.08);thud.gain.setValueAtTime(.08,t);thud.gain.exponentialRampToValueAtTime(.0001,t+.1);o.connect(thud);thud.connect(ambient);o.start();o.stop(t+.11);o.onended=()=>thud.disconnect();
    },
    dispose(){stopVoice();stopTransients();for(const n of ambientNodes){try{n.stop?.();}catch{}n.disconnect();}music?.stop();ctx?.close();},
  };
}
const _direction=new Vector3();
