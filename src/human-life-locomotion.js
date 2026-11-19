const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const wrap=n=>((n%1)+1)%1;
const angle=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));

// Invert the baked displacement / angular progress curve. Samples are normalised
// [time, progress] pairs. Plateaux preserve planted preparation / recovery phases.
export function timeForProgress(samples,progress) {
  const p=clamp(progress,0,1);if(!samples?.length)return p;
  if(p<=samples[0][1])return samples[0][0];
  for(let i=1;i<samples.length;i++)if(samples[i][1]>=p){
    const [ta,pa]=samples[i-1],[tb,pb]=samples[i];return pa===pb?tb:ta+(tb-ta)*(p-pa)/(pb-pa);
  }
  return samples.at(-1)[0];
}

// Reads collision-authoritative motion and authored clip metrics. No root
// translation/yaw, POI choice, random draw or behaviour timer is written here.
// Only the three life-pilot assets opt in after their real clip metadata exists.
export function createLifeLocomotion(actor,definition,{scale=1}={}) {
  const clips=definition.lifeClips;
  if(!clips?.Walk)throw Error('Life locomotion requires exported clip metrics');
  let phase=wrap(actor.visualMotion?.phase??actor.state.time),arc=actor.state.walkDistance??0;
  let p=[...actor.state.position],yaw=actor.state.yaw,clip='Idle',time=0,speed=0;
  let travelled=0,turnTravel=0,turnExtent=0,stopDistance=0,previousMovement=false;
  const duration=name=>clips[name]?.duration??1;
  const cycle=(clips.Walk.distance||definition.cycleDistance)*scale;
  const nearestSide=prefix=>['L','R'].sort((a,b)=>{
    const da=Math.abs(angle(phase*Math.PI*2,(clips[prefix+a]?.entryPhase??0)*Math.PI*2));
    const db=Math.abs(angle(phase*Math.PI*2,(clips[prefix+b]?.entryPhase??.5)*Math.PI*2));return da-db;
  })[0];
  const result=()=>{actor.visualMotion={phase,arc};return {clip,time,phase,speed,strideScale:1,turnRate:actor.state.behavior?.turnRate||0};};
  return {
    update(dt){
      if(dt<=0)return result();
      const s=actor.state,a=s.behavior,moved=Number.isFinite(s.walkDistance)?Math.max(0,s.walkDistance-arc):Math.hypot(s.position[0]-p[0],s.position[2]-p[2]);
      const rotation=angle(yaw,s.yaw),instant=moved/dt;
      speed+=(instant-speed)*(1-Math.exp(-8*dt));arc=s.walkDistance??arc+moved;p=[...s.position];yaw=s.yaw;
      const activity=s.activity;
      if(activity&&!activity.aligning&&clips[activity.clip]){
        clip=activity.clip;time=activity.progress*duration(clip);previousMovement=false;return result();
      }
      if(s.talking||s.socialTalking){
        clip=s.dialogueCue?.mode==='listening'&&clips.Listen?'Listen':'Talk';time=s.time;previousMovement=false;return result();
      }
      const turning=Math.abs(rotation)/dt>.16;
      if(turning&&instant<.045){
        const sign=rotation>0?'Right':'Left';
        if(!clip.startsWith('Turn'+sign)){
          const remaining=Math.abs(angle(s.yaw,a?.desiredYaw??s.yaw));
          const degrees=remaining>Math.PI*.66?180:remaining>Math.PI*.33?90:45;
          clip=`Turn${sign}${degrees}`;turnExtent=degrees*Math.PI/180;turnTravel=0;
        }
        turnTravel+=Math.abs(rotation);const metric=clips[clip];
        time=duration(clip)*timeForProgress(metric?.angularProgress,clamp(turnTravel/turnExtent,0,1));previousMovement=false;return result();
      }
      const preparing=a?.state==='travel'&&a.startAge<.16;
      if(preparing||instant>.02){
        const remaining=a?.motionIntent?.remaining;
        const stopping=Number.isFinite(remaining)&&remaining<(clips['StopWalk'+nearestSide('StopWalk')]?.distance??.30)*scale;
        if(stopping){
          if(!clip.startsWith('StopWalk')){clip='StopWalk'+nearestSide('StopWalk');stopDistance=(clips[clip].distance||.30)*scale;}
          time=duration(clip)*timeForProgress(clips[clip].progress,1-remaining/stopDistance);
        }else if(!previousMovement||clip.startsWith('StartWalk')){
          if(!clip.startsWith('StartWalk')){clip='StartWalk'+nearestSide('StartWalk');travelled=0;}
          travelled+=moved;const metric=clips[clip],d=(metric.distance||definition.cycleDistance*.25)*scale;
          if(travelled>=d){phase=wrap((metric.exitPhase??0)+(travelled-d)/cycle);clip='Walk';time=phase*duration(clip);}
          else time=preparing?Math.min(a.startAge,duration(clip)*.2):duration(clip)*timeForProgress(metric.progress,travelled/d);
        }else{
          const slope=a?.motionIntent?.slope??0;
          clip=Math.abs(slope)>.10?(slope>0?'StairUp':'StairDown'):'Walk';
          if(!clips[clip])clip='Walk';
          phase=wrap(phase+moved/((clips[clip].distance||definition.cycleDistance)*scale));time=phase*duration(clip);
        }
        previousMovement=true;return result();
      }
      if(clip.startsWith('StopWalk')||clip.startsWith('Turn')){
        time=Math.min(duration(clip),time+dt*(s.animationSpeed||1));
        if(time<duration(clip))return result();
      }
      // Unexpected collision stops still settle from the current support phase.
      if(previousMovement&&!clip.startsWith('StopWalk')){clip='StopWalk'+nearestSide('StopWalk');time=duration(clip)*.75;previousMovement=false;return result();}
      previousMovement=false;clip=s.idleAction==='LookAround'?'LookAround':s.idleAction==='Interact'?'Interact':'Idle';time=s.time;return result();
    },
    contact(name,t,side,currentPhase){
      const metric=clips[name];if(!metric)return 'flat';
      const progress=metric.loop?wrap(t/metric.duration):clamp(t/metric.duration,0,.999999);
      for(const [start,end,contact] of metric.contacts?.[side]||[]){if(start<=end?progress>=start&&progress<end:progress>=start||progress<end)return contact;}
      return metric.contacts?.[side]?.length?'swing':'flat';
    },
  };
}
