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
  let position=[0,0,0],visualY=0,visualVelocity=0,stairMemory=0,jumpBuffer=0,coyote=0,airborne=false,airVelocity=0;
  const gravity=settings.gravity??10.8,jumpHeight=settings.jumpHeight??.6;
  const state={isGrounded:false,groundNormal:[0,1,0],slopeAngle:0,isClimbingStairs:false,verticalDirection:0,
    animation:'idle',speedFactor:1,groundSnapApplied:false,verticalVelocity:0,onStairs:false,jumpPhase:'grounded',landed:false};
  function readGround(referenceY=position[1]) {return model.sampleGround(position[0],position[2],referenceY);}
  function contact(ground) {
    state.isGrounded=!!ground&&Math.abs(position[1]-ground.height)<.025;
    state.groundNormal=ground?.normal||[0,1,0];state.slopeAngle=ground?.slopeAngle||0;state.onStairs=ground?.kind==='stairs';
  }
  return {
    config:settings,state,
    get position(){return [...position];},get visualPosition(){return [position[0],visualY,position[2]];},
    reset(spawn){position=[...spawn];const ground=readGround();if(ground)position[1]=ground.height;visualY=position[1];visualVelocity=0;stairMemory=0;jumpBuffer=0;coyote=0;airborne=false;airVelocity=0;
      Object.assign(state,{isClimbingStairs:false,verticalDirection:0,animation:'idle',speedFactor:1,groundSnapApplied:false,verticalVelocity:0,jumpPhase:'grounded',landed:false});contact(ground);},
    jump(){if(!settings.jumpEnabled)return false;jumpBuffer=.12;return true;},
    speedFactor(dx,dz){
      if(airborne)return 1;
      const d=Math.hypot(dx,dz);if(!d)return 1;
      const ahead=model.moveDetailed(position,dx/d*.12,dz/d*.12,{isGrounded:state.isGrounded,config:settings});
      return ahead.position[1]>position[1]+.001?settings.uphillSpeedFactor:1;
    },
    update(dt,dx=0,dz=0) {
      if(dt<=0)return false;
      const before=[...position],previousVisual=visualY;
      state.landed=false;
      if(settings.jumpEnabled){
        coyote=state.isGrounded?.1:Math.max(0,coyote-dt);
        if(jumpBuffer>0&&(state.isGrounded||coyote>0)){
          airborne=true;airVelocity=Math.sqrt(2*gravity*jumpHeight);jumpBuffer=0;coyote=0;state.isGrounded=false;
        }
        jumpBuffer=Math.max(0,jumpBuffer-dt);
      }
      if(airborne){
        const count=Math.max(1,Math.ceil(Math.min(dt,.25)*120)),slice=Math.min(dt,.25)/count;
        for(let i=0;i<count;i++){
          const origin=[...position],result=model.moveAir(position,dx/count,airVelocity*slice-.5*gravity*slice*slice,dz/count,settings);
          position=constrainMove(origin,result.position,{airborne:true});airVelocity-=gravity*slice;
          if(result.ceiling)airVelocity=Math.min(0,airVelocity);
          const ground=readGround();
          if(airVelocity<=0&&result.landed&&ground&&Math.abs(position[1]-ground.height)<.025){
            airborne=false;airVelocity=0;state.landed=true;contact(ground);break;
          }
        }
        state.isGrounded=!airborne;state.isClimbingStairs=false;state.onStairs=false;
        state.groundSnapApplied=false;state.verticalVelocity=airVelocity;state.verticalDirection=Math.sign(airVelocity);
        state.jumpPhase=airborne?(airVelocity>0?'rising':'falling'):'grounded';state.animation=airborne?(airVelocity>0?'jump':'fall'):'land';
        // Follow ballistic height directly: ground smoothing would create a
        // visible hover at touchdown. Small stair smoothing remains below.
        visualY=position[1];visualVelocity=0;
        return Math.hypot(...position.map((v,i)=>v-before[i]))>1e-8||state.landed;
      }
      const result=model.moveDetailed(position,dx,dz,{isGrounded:state.isGrounded,config:settings});
      if(settings.jumpEnabled&&(dx||dz)&&Math.hypot(result.position[0]-before[0]-dx,result.position[2]-before[2]-dz)>.00001){
        const trial=model.moveAir(position,dx,0,dz,settings),g=model.sampleGround(trial.position[0],trial.position[2],position[1],settings);
        // Only short, authored drops may leave ground without a jump. A cliff
        // or a missing floor continues to stop the player at the boundary.
        const progress=q=>(q[0]-before[0])*dx+(q[2]-before[2])*dz;
        if(g&&progress(trial.position)>progress(result.position)+1e-9&&position[1]-g.height>settings.groundSnapDistance&&position[1]-g.height<=1.1){
          const next=constrainMove(position,trial.position,{airborne:true});
          if(lengthXZ(position,next)>.00001){position=next;airborne=true;airVelocity=0;
            state.isGrounded=false;state.jumpPhase='falling';state.animation='fall';return true;}
        }
      }
      position=constrainMove(before,result.position);const ground=readGround();contact(ground);
      const dy=position[1]-before[1],moved=lengthXZ(before,position)>.00001;
      state.groundSnapApplied=state.isGrounded&&dy<-.00001;
      state.verticalVelocity=state.groundSnapApplied?-Math.max(settings.groundSnapSpeed,-dy/dt):dy>0?dy/dt:0;
      const isStep=result.stepped&&moved,stairs=ground?.kind==='stairs';
      if(moved&&Math.abs(dy)>.00001&&(stairs||isStep))stairMemory=.18;else stairMemory=Math.max(0,stairMemory-dt);
      state.isClimbingStairs=moved&&stairMemory>0;
      state.verticalDirection=Math.abs(dy)>.00001?Math.sign(dy):state.isClimbingStairs?state.verticalDirection:0;
      state.animation=!moved?'idle':state.isClimbingStairs?(state.verticalDirection>0?'stairs-up':'stairs-down'):'walk';
      state.jumpPhase='grounded';
      state.speedFactor=moved&&dy>.00001?settings.uphillSpeedFactor:1;
      const smooth=smoothVertical(visualY,position[1],visualVelocity,position[1]<visualY?settings.downSmoothTime:settings.visualSmoothTime,dt);
      visualY=smooth.value;visualVelocity=smooth.velocity;
      if(Math.abs(visualY-position[1])<.00001&&Math.abs(visualVelocity)<.0001){visualY=position[1];visualVelocity=0;}
      return moved||Math.abs(dy)>.00001||Math.abs(visualY-previousVisual)>.000001;
    },
  };
}
