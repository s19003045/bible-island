// Modern original recordings. No ancient performance or archaeological sound claim.
export const scores={town:{id:'town',title:'院落之間',src:'audio/original/music/jerusalem-town-loop',seconds:96},wilderness:{id:'wilderness',title:'曠野的路',src:'audio/original/music/wilderness-loop',seconds:320/3},lakeshore:{id:'lakeshore',title:'水岸微光',src:'audio/original/music/lakeshore-loop',seconds:96},construction:{id:'construction',title:'一起建造',src:'audio/original/music/construction-loop',seconds:100},solemn:{id:'solemn',title:'預備與聆聽',src:'audio/original/music/solemn-loop',seconds:96}};
export function scoreForScene(key){
  const [island,chapter]=key.split(':');
  const overrides={'exodus:bricks':'construction','exodus:passover':'solemn','sinai:mountain':'solemn','abraham:well':'lakeshore','paul:ship':'lakeshore','david:city':'construction','david:ark':'solemn','judges:floor':'solemn','judges:gate':'town','exile:canal':'lakeshore','exile:home':'town','nehemiah:scroll':'solemn','galilee:synagogue':'solemn','galilee:house':'town','samaria:road':'wilderness','samaria:inn':'town','parables:lamp':'solemn','church:table':'town','church:road':'wilderness','joseph:grain':'construction','joseph:family':'town','nativity:home':'town'};
  const moods={tabernacle:'solemn',solomon:'solemn','second-temple':'construction',herod:'solemn',exodus:'wilderness',jordan:'lakeshore',jerusalem:'town',paul:'town',abraham:'wilderness',joseph:'wilderness',sinai:'wilderness',judges:'wilderness',david:'wilderness',kingdoms:'town',exile:'solemn',nehemiah:'construction',intertestament:'town',nativity:'solemn',galilee:'lakeshore',samaria:'lakeshore',parables:'wilderness',passion:'solemn',church:'solemn',letters:'solemn'};
  return scores[overrides[`${island}:${chapter}`]||moods[island]]||null;
}

// At most two live sources during a crossfade, and one retained decoded score.
// An old download can finish, but can never start after the listener changes scenes.
export function createSoundtrack(ctx,output,onState=()=>{}) {
  let generation=0,requested=null,current=null,cached=null,disposed=false,loading=false,pendingTask=null;
  const live=new Set();
  function retire(entry,fade=.65){
    if(!entry||entry.retired)return;entry.retired=true;
    const now=ctx.currentTime;entry.gain.gain.cancelScheduledValues?.(now);
    entry.gain.gain.setTargetAtTime(0,now,Math.max(.01,fade/4));
    try{entry.source.stop(now+fade);}catch{}
  }
  function select(score){
    if(disposed||score?.id===requested?.id&&(current||loading))return pendingTask;
    requested=score;const ticket=++generation;loading=!!score;
    if(!score){retire(current);current=null;cached=null;onState({status:'off',title:''});return;}
    onState({status:'loading',title:score.title});
    pendingTask=(async()=>{
    try{
      let buffer=cached?.id===score.id?cached.buffer:null;
      if(!buffer){
        let failure;
        for(const extension of ['ogg','mp3'])try{
          const response=await fetch(new URL(`${score.src}.${extension}`,document.baseURI));
          if(!response.ok)throw new Error('配樂暫時無法載入');
          buffer=await ctx.decodeAudioData(await response.arrayBuffer());break;
        }catch(error){failure=error;}
        if(!buffer)throw failure;
      }
      if(disposed||ticket!==generation)return;
      cached={id:score.id,buffer};
      // Repeated rapid switches must not accumulate fading sources.
      while(live.size>=2){const oldest=live.values().next().value;try{oldest.source.stop();}catch{}oldest.source.disconnect();oldest.gain.disconnect();live.delete(oldest);}
      const source=ctx.createBufferSource(),gain=ctx.createGain(),entry={source,gain,retired:false};
      source.buffer=buffer;source.loop=true;source.loopStart=0;source.loopEnd=Math.min(score.seconds,buffer.duration);
      gain.gain.setValueAtTime(0,ctx.currentTime);gain.gain.setTargetAtTime(1,ctx.currentTime,.18);
      source.connect(gain);gain.connect(output);live.add(entry);
      source.onended=()=>{live.delete(entry);source.disconnect();gain.disconnect();};
      retire(current);current=entry;source.start();onState({status:'playing',title:score.title});
    }catch(error){if(ticket===generation&&!disposed){retire(current);current=null;onState({status:'unavailable',title:score.title,text:error.message});}}
    finally{if(ticket===generation)loading=false;}
    })();
    return pendingTask;
  }
  return {select,dispose(){disposed=true;generation++;for(const entry of live){try{entry.source.stop();}catch{}entry.source.disconnect();entry.gain.disconnect();}live.clear();cached=null;current=null;}};
}

export const effectGroups=Object.fromEntries([
  ...['earth','stone','wood'].flatMap(material=>['footstep','landing'].map(category=>[`${category}:${material}`,Array.from({length:4},(_,i)=>`${category}-${material}-${i+1}`)])),
  ['jump',Array.from({length:4},(_,i)=>`jump-takeoff-${i+1}`)],
  ...['ceramic','wood','stone'].map(material=>[`interaction:${material}`,Array.from({length:4},(_,i)=>`interact-${material}-${i+1}`)])
]);

export function createRecordedEffects(ctx,output,{panner,onError=()=>{}}={}) {
  const cache=new Map(),pending=new Map(),last=new Map(),live=new Set();let generation=0,disposed=false;
  async function load(id){
    if(cache.has(id))return cache.get(id);
    if(!pending.has(id))pending.set(id,(async()=>{
      let failure;
      for(const extension of ['ogg','mp3'])try{
        const response=await fetch(new URL(`audio/original/sfx/${id}.${extension}`,document.baseURI));
        if(!response.ok)throw new Error('音效暫時無法載入');
        const buffer=await ctx.decodeAudioData(await response.arrayBuffer());
        if(!disposed)cache.set(id,buffer);return buffer;
      }catch(error){failure=error;}
      throw failure;
    })().finally(()=>pending.delete(id)));
    return pending.get(id);
  }
  const preload=(groups)=>Promise.allSettled([...new Set(groups.flatMap(key=>effectGroups[key]||[]))].map(load));
  function play(key,position,{gain=1,rate=1}={}){
    if(disposed)return false;const ids=effectGroups[key];if(!ids)return false;
    const previous=last.get(key)??-1,index=(previous+1+Math.floor(Math.random()*(ids.length-1)))%ids.length;last.set(key,index);
    const buffer=cache.get(ids[index]);
    // Never replay a late footfall after its physical event has passed.
    if(!buffer){const ticket=generation;load(ids[index]).catch(error=>{if(ticket===generation&&!disposed)onError(error.message);});return false;}
    if(live.size>=10)return false;
    const source=ctx.createBufferSource(),level=ctx.createGain(),spatial=panner?.(position,output)||output;
    source.buffer=buffer;if(source.playbackRate)source.playbackRate.value=rate;level.gain.value=gain;
    source.connect(level);level.connect(spatial);const entry={source,level,spatial};live.add(entry);
    source.onended=()=>{live.delete(entry);source.disconnect();level.disconnect();if(spatial!==output)spatial.disconnect();};source.start();return true;
  }
  function stop(){generation++;for(const entry of live){try{entry.source.stop();}catch{}entry.source.disconnect();entry.level.disconnect();if(entry.spatial!==output)entry.spatial.disconnect();}live.clear();}
  return {play,preload,stop,dispose(){disposed=true;stop();cache.clear();}};
}
