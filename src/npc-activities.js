const angle=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
const range=(random,value)=>Array.isArray(value)?value[0]+random()*(value[1]-value[0]):value;

// A routine selects meaningful destinations from the same reserved POIs. It
// never places or teleports a character, changes collision radii, or supplies a
// second navigation clock. All elapsed time is local to that actor's activity.
export function createNPCActivities(plans,{clipDuration=(_actor,_clip)=>null,onEvent=()=>{}}={}) {
  const records=new Map();
  const record=a=>{
    const plan=plans[a.key];if(!plan)return null;
    if(!records.has(a.key))records.set(a.key,{plan,actor:a.actor,stop:0,phase:0,activity:null,resume:null,completed:0});
    return records.get(a.key);
  };
  const station=(a,r)=>r.plan.stops[r.stop].pois.includes(a.poi?.id);
  const publish=(a,r)=>{a.actor.state.activity=r.activity;};
  function enterPhase(a,r) {
    const stop=r.plan.stops[r.stop],phase=r.phases[r.phase];
    const duration=clipDuration(a.actor,phase.clip)??range(a.random,phase.duration);
    if(!(duration>0&&Number.isFinite(duration)))throw Error(`Invalid activity duration: ${a.key}/${phase.clip}`);
    const target=typeof stop.target==='function'?stop.target(a):stop.target;
    const p=a.actor.state.position,heading=target?Math.atan2(target[0]-p[0],target[2]-p[2]):a.actor.state.yaw;
    r.activity={routine:r.plan.id,station:a.poi.id,phase:phase.id,clip:phase.clip,elapsed:0,duration,progress:0,
      label:phase.label,target:target?[...target]:null,prop:phase.prop??null,locked:phase.locked!==false,
      aligning:Math.abs(angle(a.actor.state.yaw,heading))>.005,paused:false,completed:false};
    publish(a,r);onEvent({agent:a.key,type:'activity-phase',phase:phase.id,station:a.poi.id});
  }
  return {
    candidates(a,candidates){const r=record(a);return r?candidates.filter(c=>r.plan.stops[r.stop].pois.includes(c.p.id)):candidates;},
    revisit(a,poi){return record(a)?.resume?.station===poi.id;},
    precise(a,poi){const r=record(a);return !!r&&r.plan.stops[r.stop].pois.includes(poi?.id);},
    arrive(a){
      const r=record(a);if(!r||!station(a,r))return false;
      if(r.resume?.station===a.poi.id){r.activity=r.resume;r.resume=null;r.activity.paused=false;r.activity.aligning=true;publish(a,r);}
      else{const phases=r.plan.stops[r.stop].phases;r.phases=typeof phases==='function'?phases(a.actor):phases;r.phase=0;enterPhase(a,r);}return true;
    },
    update(a,dt){
      const r=record(a),activity=r?.activity;if(!activity)return false;
      activity.paused=!!a.held||!!a.partner;
      if(activity.paused||dt<=0)return true;
      const p=a.actor.state.position,target=activity.target;
      const heading=target?Math.atan2(target[0]-p[0],target[2]-p[2]):a.actor.state.yaw;
      activity.aligning=Math.abs(angle(a.actor.state.yaw,heading))>.005;
      // Alignment finishes before any reach. An interruption preserves exact
      // progress (including a jug left on the ground), then resumes that pose.
      if(activity.aligning)return true;
      activity.elapsed=Math.min(activity.duration,activity.elapsed+dt);
      activity.progress=activity.elapsed/activity.duration;
      if(activity.elapsed<activity.duration)return true;
      const stop=r.plan.stops[r.stop];
      const phase=r.phases[r.phase];
      if(Object.hasOwn(phase,'carry')){
        if(phase.carry)a.actor.state.carriedItem={...phase.carry};else delete a.actor.state.carriedItem;
        onEvent({agent:a.key,type:'activity-handoff',phase:phase.id,carried:phase.carry?.id??null});
      }
      if(++r.phase<r.phases.length){enterPhase(a,r);return true;}
      activity.completed=true;r.completed++;r.stop=(r.stop+1)%r.plan.stops.length;r.activity=null;
      delete a.actor.state.activity;
      onEvent({agent:a.key,type:'activity-complete',station:a.poi.id,completed:r.completed});
      return false;
    },
    locked(a){return !!record(a)?.activity?.locked&&!record(a)?.activity?.aligning;},
    busy(a){return !!record(a)?.activity;},
    cancel(a){const r=record(a);if(r?.activity){r.resume=r.activity;r.activity=null;}delete a.actor.state.activity;},
    inspect(a){const r=record(a);return r?{routine:r.plan.id,stop:r.stop,completed:r.completed,phase:r.activity?.phase??null}:null;},
    dispose(){for(const r of records.values()){delete r.actor.state.activity;delete r.actor.state.carriedItem;}records.clear();},
  };
}
