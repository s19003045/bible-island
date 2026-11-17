import {humanProfileFor} from './human-motion-data.js';
import {residentFootContact} from './resident-locomotion.js';

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const wrap=n=>((n%1)+1)%1;
const angle=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
const smooth=n=>{n=clamp(n,0,1);return n*n*(3-2*n);};
function inverse(fn,n){let low=0,high=1;for(let i=0;i<22;i++){const middle=(low+high)/2;if(fn(middle)<n)low=middle;else high=middle;}return (low+high)/2;}

// Distance matching + bounded stride warping. This observer NEVER writes root
// position/yaw, behaviour timers, POI reservations or the NPC random generator.
export function createHumanLocomotion(actor,definition,{scale=1}={}) {
  const profile=humanProfileFor(actor),distance=definition.cycleDistance*scale,duration=definition.walkDuration;
  let position=[...actor.state.position],arc=actor.state.walkDistance,yaw=actor.state.yaw;
  let phase=wrap(actor.visualMotion?.phase??actor.state.time),clip='Idle',time=0,travel=0,turnTravel=0,first=true,strideScale=1,filteredSpeed=0;
  const phases=definition.walkContact||null,entry=definition.walkEntryPhase??.05;
  const save=(speed)=>{actor.visualMotion={phase:wrap(phase),arc:actor.state.walkDistance};return {clip,time,phase:wrap(phase),speed,strideScale,turnRate:actor.state.behavior?.turnRate||0};};
  return {
    update(dt){
      const state=actor.state,moved=Number.isFinite(arc)&&Number.isFinite(state.walkDistance)?Math.max(0,state.walkDistance-arc):Math.hypot(state.position[0]-position[0],state.position[2]-position[2]);
      const rotation=angle(yaw,state.yaw),speed=dt>0?moved/dt:0;
      position=[...state.position];arc=state.walkDistance;yaw=state.yaw;
      if(first){clip=state.talking||state.socialTalking?'Talk':state.stride>.12?'Walk':state.idleAction==='Interact'?'Interact':state.idleAction==='LookAround'?'LookAround':'Idle';time=clip==='Walk'?phase*duration:state.time;first=false;return save(speed);}
      if(dt<=0)return save(filteredSpeed);
      filteredSpeed+=(speed-filteredSpeed)*(1-Math.exp(-7*dt));
      const reference=distance/duration,ratio=filteredSpeed/reference,cadence=clamp(ratio,profile.cadenceMin,profile.cadenceMax);
      const wanted=clip==='Walk'?clamp(ratio/cadence,profile.strideMin,profile.strideMax):1;
      strideScale+=(wanted-strideScale)*(1-Math.exp(-6*dt));
      if(state.talking||state.socialTalking){clip='Talk';time=state.time;}
      else if(speed>.035){
        if(!['StartWalk','Walk'].includes(clip)){clip='StartWalk';travel=0;time=0;}
        if(clip==='StartWalk'){
          travel+=moved;const startDistance=distance*(definition.startDistanceFraction??.25);
          if(travel>=startDistance){clip='Walk';phase=entry+(travel-startDistance)/(distance*strideScale);}
          else time=(definition.startDuration??.6)*inverse(u=>2*u**3-u**4,travel/startDistance);
        }else phase+=moved/(distance*strideScale);
        if(clip==='Walk')time=wrap(phase)*duration;
      }else if(Math.abs(rotation)/dt>.16){
        const turn=rotation>0?'TurnRight':'TurnLeft';if(clip!==turn){clip=turn;turnTravel=0;}
        turnTravel+=Math.abs(rotation);time=(definition.turnDuration??1.2)*(.12+.76*inverse(smooth,(turnTravel/(Math.PI/4))%1));
      }else if(['Walk','StartWalk'].includes(clip)){clip='StopWalk';time=0;}
      else if(clip==='StopWalk'){time+=dt*(state.animationSpeed||1);if(time>=(definition.stopDuration??.6)){clip='Idle';time=state.time;}}
      else if(['TurnLeft','TurnRight'].includes(clip)){time+=dt*(state.animationSpeed||1);if(time>=(definition.turnDuration??1.2)){clip='Idle';time=state.time;}}
      else {clip=state.idleAction==='Interact'?'Interact':state.idleAction==='LookAround'?'LookAround':'Idle';time=state.time;}
      return save(filteredSpeed);
    },
    contact(clip,time,side,phase){
      const segments=clip==='Walk'?phases?.[side]:definition.clipContacts?.[clip]?.[side];
      if(!segments)return residentFootContact(clip,time,side,phase);
      const duration=clip==='StartWalk'?definition.startDuration:clip==='StopWalk'?definition.stopDuration:definition.turnDuration;
      const p=clip==='Walk'?wrap(phase):clamp(time/duration,0,.999999);
      for(const segment of segments){const [start,end,contact]=segment;if(start<=end?p>=start&&p<end:p>=start||p<end)return contact;}
      return 'swing';
    },
  };
}
