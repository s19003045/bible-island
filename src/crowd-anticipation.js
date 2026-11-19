const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);

// A short-lived encounter commitment belongs to ONE person. No random draws,
// global decision clock, destination changes, or writes to another NPC occur here.
// Static swept probes constrain suggestions; the existing dynamic sweep remains
// the authority for capsule clearance when this intent is integrated.
export function anticipateCrowd(agent,neighbours,desired,{dt,canTraverse}) {
  const p=agent.actor.state.position,speed=Math.hypot(...desired);
  if(dt<=0||speed<1e-5)return desired;
  const forward=desired.map(v=>v/speed),horizon=2.6;
  const threats=neighbours.map(b=>{
    const dx=b.position[0]-p[0],dz=b.position[2]-p[2],gap=Math.hypot(dx,dz);
    const rv=[desired[0]-b.velocity[0],desired[1]-b.velocity[1]],v2=rv[0]**2+rv[1]**2;
    const t=v2>1e-5?clamp((dx*rv[0]+dz*rv[1])/v2,0,horizon):0;
    const clearance=agent.radius+b.radius+.18,miss=Math.hypot(dx-rv[0]*t,dz-rv[1]*t);
    const ahead=dx*forward[0]+dz*forward[1];
    return {b,gap,t,clearance,miss,ahead};
  }).filter(t=>Math.abs(t.b.position[1]-p[1])<1.7&&t.gap<4&&t.ahead>-.1&&
    (t.t>0&&t.miss<t.clearance+.25||t.gap<t.clearance+.25))
    .sort((a,b)=>a.t-b.t||a.gap-b.gap||String(a.b.key).localeCompare(String(b.b.key)));
  let encounter=agent.encounter;
  const retained=encounter&&neighbours.find(b=>b.key===encounter.key);
  if(encounter&&(!retained||agent.age>encounter.until||distance(p,retained.position)>4.5))encounter=null;
  // Prefer the committed encounter until it has passed, preventing left/right
  // indecision when another person briefly becomes the nearest neighbour.
  let threat=encounter&&threats.find(t=>t.b.key===encounter.key);
  if(encounter&&!threat&&retained){
    const ahead=(retained.position[0]-p[0])*encounter.forward[0]+(retained.position[2]-p[2])*encounter.forward[1];
    if(ahead<-.35)encounter=null;
  }
  if(!encounter&&threats.length){
    threat=threats[0];
    encounter={key:threat.b.key,forward:[...forward],right:[forward[1],-forward[0]],side:1,
      until:agent.age+3.5,wait:0,retreatRequested:false,retryAt:agent.age,
      yields:!!threat.b.player||!threat.b.travelling||String(agent.key)>String(threat.b.key)};
  }
  agent.encounter=encounter;
  if(!encounter)return desired;
  if(!threat)return desired;
  encounter.until=agent.age+1.2;
  const lateral=.65,probe=side=>[
    p[0]+encounter.right[0]*lateral*side+forward[0]*.25,p[1],
    p[2]+encounter.right[1]*lateral*side+forward[1]*.25,
  ];
  let refuge=probe(encounter.side),room=canTraverse(p,refuge);
  // Select the other side only before committing movement. Once a pass starts,
  // a newly blocked side produces a wait instead of oscillating around people.
  if(encounter.chosen===undefined){
    if(!room&&canTraverse(p,probe(-1))){encounter.side=-1;refuge=probe(-1);room=true;}
    encounter.chosen=encounter.side;
  }
  const urgent=clamp((horizon-threat.t)/horizon,0,1);
  const approaching=threat.ahead>0;
  const margin=Math.max(0,threat.gap-threat.clearance);
  // A bottleneck requires a loser to wait / back out via a legitimate POI route;
  // the winner still stops at the existing swept capsule boundary.
  const waiting=!room&&encounter.yields&&approaching;
  encounter.wait=waiting?encounter.wait+dt:0;
  encounter.status=waiting?'yield':room?'pass':'approach';
  encounter.obstacle={position:[...threat.b.position],radius:threat.b.radius};
  if(waiting&&encounter.wait>.7&&agent.age>=encounter.retryAt){
    encounter.retreatRequested=true;
    // Expensive path searches are independently staggered and bounded even if
    // a crowded scene has no free retreat destination at this instant.
    encounter.retryAt=agent.age+2+(agent.seed??0)%700/1000;
  }
  const factor=waiting?clamp(margin/1.6,0,.45):room?1-.25*urgent:clamp(margin,0,.8);
  const steer=room?Math.min(.50,speed*.65)*urgent*encounter.side:0;
  let x=desired[0]*factor+encounter.right[0]*steer,z=desired[1]*factor+encounter.right[1]*steer;
  const magnitude=Math.hypot(x,z);if(magnitude>agent.speed){x*=agent.speed/magnitude;z*=agent.speed/magnitude;}
  return [x,z];
}
