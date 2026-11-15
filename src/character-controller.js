// Metres / seconds. Physics feet stay on the collision surface; only the visual root is damped.
export const characterDefaults=Object.freeze({maxStepHeight:.35,maxSlopeAngle:45,groundSnapDistance:.45,
  groundSnapSpeed:3,bodyHeight:1.7,skin:.015,uphillSpeedFactor:.8,visualSmoothTime:.08,downSmoothTime:.055});
const lengthXZ=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);

// Critically damped, timestep-independent spring. No head bob, overshoot, or input-driven Y noise.
export function smoothVertical(current,target,velocity,smoothTime,dt) {
  if(dt<=0)return {value:current,velocity};
  const omega=2/Math.max(.001,smoothTime),offset=current-target,e=Math.exp(-omega*dt),c=velocity+omega*offset;
  return {value:target+(offset+c*dt)*e,velocity:(velocity-omega*c*dt)*e};
}
export function createCharacterController(model,{config={},constrainMove=(from,to)=>to}={}) {
  const settings={...characterDefaults,...model.config,...config};
  let position=[0,0,0],visualY=0,visualVelocity=0,stairMemory=0;
  const state={isGrounded:false,groundNormal:[0,1,0],slopeAngle:0,isClimbingStairs:false,verticalDirection:0,
    animation:'idle',speedFactor:1,groundSnapApplied:false,verticalVelocity:0,onStairs:false};
  function readGround(referenceY=position[1]) {return model.sampleGround(position[0],position[2],referenceY);}
  function contact(ground) {
    state.isGrounded=!!ground&&Math.abs(position[1]-ground.height)<.025;
    state.groundNormal=ground?.normal||[0,1,0];state.slopeAngle=ground?.slopeAngle||0;state.onStairs=ground?.kind==='stairs';
  }
  return {
    config:settings,state,
    get position(){return [...position];},get visualPosition(){return [position[0],visualY,position[2]];},
    reset(spawn){position=[...spawn];const ground=readGround();if(ground)position[1]=ground.height;visualY=position[1];visualVelocity=0;stairMemory=0;
      Object.assign(state,{isClimbingStairs:false,verticalDirection:0,animation:'idle',speedFactor:1,groundSnapApplied:false,verticalVelocity:0});contact(ground);},
    speedFactor(dx,dz){
      const d=Math.hypot(dx,dz);if(!d)return 1;
      const ahead=model.moveDetailed(position,dx/d*.12,dz/d*.12,{isGrounded:state.isGrounded,config:settings});
      return ahead.position[1]>position[1]+.001?settings.uphillSpeedFactor:1;
    },
    update(dt,dx=0,dz=0) {
      if(dt<=0)return false;
      const before=[...position],previousVisual=visualY;
      const result=model.moveDetailed(position,dx,dz,{isGrounded:state.isGrounded,config:settings});
      position=constrainMove(before,result.position);const ground=readGround();contact(ground);
      const dy=position[1]-before[1],moved=lengthXZ(before,position)>.00001;
      state.groundSnapApplied=state.isGrounded&&dy<-.00001;
      state.verticalVelocity=state.groundSnapApplied?-Math.max(settings.groundSnapSpeed,-dy/dt):dy>0?dy/dt:0;
      const isStep=result.stepped&&moved,stairs=ground?.kind==='stairs';
      if(moved&&Math.abs(dy)>.00001&&(stairs||isStep))stairMemory=.18;else stairMemory=Math.max(0,stairMemory-dt);
      state.isClimbingStairs=moved&&stairMemory>0;
      state.verticalDirection=Math.abs(dy)>.00001?Math.sign(dy):state.isClimbingStairs?state.verticalDirection:0;
      state.animation=!moved?'idle':state.isClimbingStairs?(state.verticalDirection>0?'stairs-up':'stairs-down'):'walk';
      state.speedFactor=moved&&dy>.00001?settings.uphillSpeedFactor:1;
      const smooth=smoothVertical(visualY,position[1],visualVelocity,position[1]<visualY?settings.downSmoothTime:settings.visualSmoothTime,dt);
      visualY=smooth.value;visualVelocity=smooth.velocity;
      if(Math.abs(visualY-position[1])<.00001&&Math.abs(visualVelocity)<.0001){visualY=position[1];visualVelocity=0;}
      return moved||Math.abs(dy)>.00001||Math.abs(visualY-previousVisual)>.000001;
    },
  };
}
