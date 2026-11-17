const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const delta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));

// Pure pursuit along the RESERVED, collision-checked POI path. It rounds free
// corners instead of inventing destinations or cutting through an obstacle.
export function humanPathTarget(agent,traverse) {
  const origin=agent.actor.state.position,profile=agent.humanProfile;
  let remaining=profile.lookAhead+Math.hypot(...agent.velocity)*.30,from=origin,best=agent.path[0];
  for(const to of agent.path){
    const length=Math.hypot(to[0]-from[0],to[2]-from[2]);
    if(length<1e-6){from=to;continue;}
    const t=Math.min(1,remaining/length),candidate=from.map((v,i)=>v+(to[i]-v)*t);
    if(!traverse(origin,candidate))break;
    best=candidate;remaining-=length;if(remaining<=0)break;from=to;
  }
  return best;
}

export function humanSteering(agent,vx,vz,dt) {
  const speed=Math.hypot(vx,vz);if(speed<1e-7)return [0,0];
  const state=agent.actor.state,target=Math.atan2(vx,vz);
  // Anticipate the route with the head; redirect the travelling body gradually.
  const previous=agent.desiredYaw??state.yaw;
  agent.desiredYaw=previous+clamp(delta(previous,target)*(1-Math.exp(-8*dt)),-3.2*dt,3.2*dt);
  const difference=delta(state.yaw,agent.desiredYaw),angle=Math.abs(delta(state.yaw,target));
  const turnSpeed=clamp((Math.cos(angle)+.30)/1.30,0,1);
  const travelYaw=state.yaw+clamp(difference,-.20,.20);
  // A tight turn needs a planted turn. Gentle bends retain forward momentum.
  const magnitude=Math.min(agent.speed,speed)*turnSpeed;
  const x=Math.sin(travelYaw)*magnitude,z=Math.cos(travelYaw)*magnitude,blend=1-Math.exp(-5.5*dt);
  return [agent.velocity[0]+(x-agent.velocity[0])*blend,agent.velocity[1]+(z-agent.velocity[1])*blend];
}

export function turnHumanBody(agent,dt) {
  const state=agent.actor.state,difference=delta(state.yaw,agent.desiredYaw),speed=Math.hypot(...agent.velocity);
  const rate=speed>.06?clamp(speed/agent.humanProfile.turnRadius,.9,1.9):1.7;
  const change=clamp(difference*(1-Math.exp(-5*dt)),-rate*dt,rate*dt);
  state.yaw+=change;agent.turnRate=change/dt;
}
