const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
function inverse(fn,value){let lo=0,hi=1;for(let i=0;i<24;i++){const mid=(lo+hi)/2;if(fn(mid)<value)lo=mid;else hi=mid;}return (lo+hi)/2;}
const angle=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));

// Appearance consumes the controller's real displacement. It never translates an
// actor a second time, starts POI timers, or changes learning/interaction state.
export function createResidentLocomotion(actor,{cycleDistance=.9,cycleSeconds=1.2,scale=1}={}){
  let previous=[...actor.state.position],yaw=actor.state.yaw,previousArc=actor.state.walkDistance,phase=actor.state.time%1;
  let clip=actor.state.stride>.12?'Walk':'Idle',time=0,travel=0,turnTravel=0,first=true;
  const strideLength=cycleDistance*scale,startDistance=strideLength/4;
  if(actor.visualMotion&&Number.isFinite(previousArc))phase=actor.visualMotion.phase+(previousArc-actor.visualMotion.arc)/strideLength;
  const snapshot=(speed)=>{actor.visualMotion={phase:((phase%1)+1)%1,arc:actor.state.walkDistance};return {clip,time,phase:((phase%1)+1)%1,speed};};
  return {
    update(dt){
      const state=actor.state,distance=Number.isFinite(state.walkDistance)&&Number.isFinite(previousArc)?Math.max(0,state.walkDistance-previousArc):Math.hypot(state.position[0]-previous[0],state.position[2]-previous[2]),dyaw=angle(yaw,state.yaw),speed=dt>0?distance/dt:0;
      previous=[...state.position];yaw=state.yaw;previousArc=state.walkDistance;
      if(first){
        clip=state.talking||state.socialTalking?'Talk':state.stride>.12?'Walk':state.idleAction==='Interact'?'Interact':state.idleAction==='LookAround'?'LookAround':'Idle';
        time=clip==='Walk'?((phase%1+1)%1)*cycleSeconds:state.time;
        first=false;return snapshot(speed);
      }
      if(dt>0){
        const moving=speed>.035,held=state.talking||state.socialTalking;
        if(held){clip='Talk';time=state.time;}
        else if(moving){
          if(!['StartWalk','Walk'].includes(clip)){clip='StartWalk';travel=0;time=0;}
          if(clip==='StartWalk'){
            travel+=distance;
            // Distance matching uses the baked accelerating root curve as a
            // reference. The collision controller remains the one root owner.
            if(travel>=startDistance){clip='Walk';phase=.05+(travel-startDistance)/strideLength;}
            else time=.6*inverse(u=>2*u**3-u**4,travel/startDistance);
          }else phase+=distance/strideLength;
          if(clip==='Walk')time=((phase%1+1)%1)*cycleSeconds;
        }else if(Math.abs(dyaw)/dt>.16){
          const target=dyaw>0?'TurnRight':'TurnLeft';
          if(clip!==target){clip=target;turnTravel=0;}
          turnTravel+=Math.abs(dyaw);
          time=1.2*(.12+.76*inverse(smooth,(turnTravel/(Math.PI/4))%1));
        }else if(['Walk','StartWalk'].includes(clip)){clip='StopWalk';time=0;}
        else if(clip==='StopWalk'){
          time=Math.min(.6,time+dt*(state.animationSpeed||1));
          if(time>=.6){clip=state.idleAction==='Interact'?'Interact':state.idleAction==='LookAround'?'LookAround':'Idle';time=state.time;}
        }else if(clip==='TurnLeft'||clip==='TurnRight'){
          time=Math.min(1.2,time+dt*(state.animationSpeed||1));if(time>=1.2){clip='Idle';time=state.time;}
        }else {clip=state.idleAction==='Interact'?'Interact':state.idleAction==='LookAround'?'LookAround':'Idle';time=state.time;}
      }
      return snapshot(speed);
    }
  };
}

// Contact stages preserve the baked heel/toe roll. Transitions from an arbitrary
// live stride are retargeted by world stance anchors, rather than claiming that
// every blend has the bake's special phase-.05 endpoint continuity.
export function residentFootContact(clip,time,side,phase=0){
  const offset=side==='R'?.5:0;
  if(clip==='Walk'){const p=((phase+offset)%1+1)%1;return p<.08?'heel':p<.43?'flat':p<.60?'toe':'swing';}
  if(clip==='StartWalk'){const u=time/.6;return side==='L'?(u<.2?'toe':u<.9?'swing':'heel'):(u>.55?'toe':'flat');}
  if(clip==='StopWalk'){const u=time/.6;return side==='L'?(u<.3?'heel':'flat'):(u<.1?'toe':u<.9?'swing':'heel');}
  if(clip==='TurnLeft'||clip==='TurnRight'){
    const first=clip==='TurnRight'?'R':'L',u=time/1.2,[a,b]=side===first?[.14,.46]:[.55,.87];return u>a&&u<b?'swing':'flat';
  }
  return 'flat';
}
