import {angleDelta} from './people-motion.js';

const distance=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function npcSeed(text) {let n=2166136261;for(const c of String(text)){n^=c.charCodeAt(0);n=Math.imul(n,16777619);}return n>>>0;}
export function seededNPC(seed) {let n=seed>>>0;return ()=>{n=(n+0x6D2B79F5)>>>0;let t=Math.imul(n^(n>>>15),1|n);t^=t+Math.imul(t^(t>>>7),61|t);return ((t^(t>>>14))>>>0)/4294967296;};}
const ranged=(a,min,max)=>min+a.random()*(max-min);
const turn=(m,target,dt)=>{const d=angleDelta(m.yaw,target);m.yaw+=clamp(d*(1-Math.exp(-5*dt)),-2.2*dt,2.2*dt);};

// Every decision, social check, dwell, cooldown, animation phase and PRNG belongs to one agent.
// The shared update is only a physics integrator, never a behaviour clock or random walk.
export function createNPCSystem({actors,pois,model,playerModel=model,seed=78431,onEvent=()=>{},spawnCandidates:customSpawns=null,allowedPosition=()=>true,spawnExclusion=[20,0,0],allowRetreat=false,socialProbability=.2}) {
  const reservations=new Map(pois.map(p=>[p.id,new Map()]));
  const agents=actors.map((actor,index)=>{
    const key=actor.id||`resident-${index}`,individualSeed=npcSeed(`${seed}:${key}`),random=seededNPC(individualSeed);
    const speedFactor=.85+random()*.3;
    const a={key,actor,seed:individualSeed,random,speedFactor,speed:.8*speedFactor,radius:actor.collisionRadius??.29*(actor.scale||1),
      role:actor.role||(actor.id==='householder'?'householder':actor.id==='street-vendor'?'vendor':actor.id==='water-carrier'?'carrier':'resident'),
      state:'rest',action:'Idle',age:0,timer:.4+(index+random())/actors.length*4.5,socialCheck:.25+random()*1.7,
      cooldown:3+random()*12,velocity:[0,0],path:[],poi:null,slot:null,lastPOI:null,partner:null,chatLeft:0,
      lane:(random()-.5)*.34,lookPhase:random()*Math.PI*2,blockedFor:0,visits:new Map(),held:false,wasAttending:false,attentionLeft:0};
    actor.state.autonomous=true;actor.state.animationSpeed=speedFactor;actor.state.time=random()*80;actor.state.behavior=a;
    return a;
  });
  // Rehome the illustrative background silhouettes onto valid public surfaces before first render.
  // Authored dialogue characters retain their location whenever it is physically valid.
  const spawnCandidates=customSpawns?[...customSpawns]:[];
  if(!customSpawns)for(let x=-71;x<=24;x+=2.4)for(const z of [-1.15,1.15])spawnCandidates.push([x,model.heightAt(x,z),z]);
  if(!customSpawns)for(const z of [-16,30])for(let x=-70;x<=20;x+=3)spawnCandidates.push([x,model.heightAt(x,z),z]);
  const placed=[];
  for(const a of [...agents].sort((a,b)=>Number(!!b.actor.id)-Number(!!a.actor.id))) {
    const origin=a.actor.state.position;
    const free=p=>model.valid(p[0],p[2])&&allowedPosition(a,p)&&(!spawnExclusion||distance(p,spawnExclusion)>1.5)&&placed.every(b=>distance(p,b.actor.state.position)>a.radius+b.radius+.35);
    if(!free(origin)) {
      const options=spawnCandidates.filter(free).sort((p,q)=>distance(p,origin)-distance(q,origin));
      if(!options.length)throw new Error(`No safe spawn for ${a.key}`);
      a.actor.state.position=[...options[0]];
    } else a.actor.state.position=[origin[0],model.heightAt(origin[0],origin[2]),origin[2]];
    placed.push(a);
  }
  function emit(a,type,extra={}){onEvent({agent:a.key,time:a.age,type,...extra});}
  function release(a){if(a.poi)reservations.get(a.poi.id).delete(a.key);a.poi=null;a.slot=null;}
  function traverse(from,to) {const end=model.move(from,to[0]-from[0],to[2]-from[2]);return distance(end,to)<.015;}
  function clearRetreat(from,to,obstacle,radius){
    if(!obstacle)return true;const dx=to[0]-from[0],dz=to[2]-from[2],length=dx*dx+dz*dz,t=length?clamp(((obstacle.position[0]-from[0])*dx+(obstacle.position[2]-from[2])*dz)/length,0,1):0;
    return Math.hypot(from[0]+dx*t-obstacle.position[0],from[2]+dz*t-obstacle.position[2])>=radius+obstacle.radius+.02;
  }
  function freeSlots(p,a,player) {
    const used=reservations.get(p.id);if(used.size>=p.capacity)return [];
    return p.slots.map((position,index)=>({position,index})).filter(s=>![...used.values()].includes(s.index)&&
      (!player||distance(s.position,player)>a.radius+.65)&&agents.every(b=>b===a||distance(s.position,b.actor.state.position)>a.radius+b.radius+.08));
  }
  function choose(a,player,retreatFrom=null) {
    const previous=a.poi?.id||a.lastPOI;
    let candidates=pois.filter(p=>p.id!==previous&&p.tags.includes(a.role)).map(p=>{
      const slots=freeSlots(p,a,player),d=Math.min(...p.slots.map(s=>distance(s,a.actor.state.position)));
      const preference=a.role==='carrier'&&p.id==='water-view'?3:a.role==='vendor'&&p.id.startsWith('market')?4:1;
      return {p,slots,weight:p.weight*preference/(retreatFrom?(1+d/8)**2:1+d/25)/(1+(a.visits.get(p.id)||0)*.3)};
    }).filter(c=>c.slots.length);
    while(candidates.length) {
      let roll=a.random()*candidates.reduce((n,c)=>n+c.weight,0),index=candidates.length-1;
      for(let i=0;i<candidates.length;i++){roll-=candidates[i].weight;if(roll<=0){index=i;break;}}
      const {p,slots}=candidates.splice(index,1)[0],slot=slots[Math.floor(a.random()*slots.length)];
      const origin=a.actor.state.position,avoid=retreatFrom?[{position:retreatFrom.position,radius:a.radius+retreatFrom.radius+.02}]:[];
      const path=model.path(origin,slot.position,{avoid});if(!path.length||!path.every(p=>allowedPosition(a,p)))continue;
      if(retreatFrom){const probe=path.find(q=>distance(q,origin)>.5);if(!probe||distance(probe,retreatFrom.position)<distance(origin,retreatFrom.position)+.12)continue;}
      // Do not walk backwards to a rounded start node when replanning.
      if(path.length>1&&traverse(origin,path[1])&&clearRetreat(origin,path[1],retreatFrom,a.radius))path.shift();
      if(!clearRetreat(origin,path[0],retreatFrom,a.radius))continue;
      if(traverse(path.at(-1),slot.position))path.push([...slot.position]);
      release(a);a.poi=p;a.slot=slot;reservations.get(p.id).set(a.key,slot.index);
      a.path=path;a.retreatFrom=retreatFrom?{position:[...retreatFrom.position],radius:retreatFrom.radius}:null;a.state='travel';a.action='Walk';a.blockedFor=0;emit(a,retreatFrom?'yield':'depart',{poi:p.id});return true;
    }
    // A full POI never attracts a queue of unreserved NPCs. Wait locally, then decide again.
    if(!retreatFrom){a.timer=ranged(a,1.3,3.5);a.state='rest';a.action='LookAround';}return false;
  }
  function arrive(a) {
    a.state='rest';a.retreatFrom=null;a.action=a.poi.action;a.timer=ranged(a,...a.poi.dwell);a.lastPOI=a.poi.id;
    a.visits.set(a.poi.id,(a.visits.get(a.poi.id)||0)+1);a.path=[];emit(a,'arrive',{poi:a.poi.id,action:a.action});
  }
  function endChat(a,interrupted=false) {
    const b=a.partner;if(!b)return;
    for(const n of [a,b]){n.partner=null;n.chatLeft=0;n.cooldown=ranged(n,20,42);n.socialCheck=ranged(n,.6,1.7);
      n.lastPOI=n.poi?.id||n.lastPOI;release(n);n.path=[];n.state='rest';n.action='LookAround';n.timer=ranged(n,.5,1.8);emit(n,'chat-end',{interrupted});}
  }
  const wandering=a=>!a.held&&!a.partner&&(a.state==='travel'||a.state==='rest'&&a.action!=='Interact');
  function social(a,player) {
    a.socialCheck=ranged(a,.7,1.7);if(socialProbability<=0||a.cooldown>0||!wandering(a)||player&&distance(player,a.actor.state.position)<2)return;
    const b=agents.filter(b=>b!==a&&b.cooldown<=0&&wandering(b)&&Math.abs(a.actor.state.position[1]-b.actor.state.position[1])<.6&&distance(a.actor.state.position,b.actor.state.position)<1.65&&
      (!player||distance(player,b.actor.state.position)>2)&&traverse(a.actor.state.position,b.actor.state.position)).sort((b,c)=>distance(a.actor.state.position,b.actor.state.position)-distance(a.actor.state.position,c.actor.state.position))[0];
    if(!b)return;
    // Exactly one 20% attempt for this encounter. Even a miss consumes BOTH cooldowns.
    const accepted=a.random()<socialProbability;for(const n of [a,b])n.cooldown=ranged(n,8,16);
    emit(a,'social-attempt',{other:b.key,accepted});if(!accepted)return;
    const duration=ranged(a,3,6);
    for(const [n,other] of [[a,b],[b,a]]){n.partner=other;n.state='chat';n.action='Chat';n.chatLeft=duration;n.velocity=[0,0];emit(n,'chat-start',{other:other.key,duration});}
  }
  function steering(a,player,dt) {
    const m=a.actor.state,p=m.position;
    while(a.path.length&&distance(p,a.path[0])<.13)a.path.shift();
    // Look ahead along a collision-free portion of the path. Otherwise separation could
    // pull someone past a tiny grid waypoint, then make them turn back into oncoming traffic.
    if(a.retreatFrom&&distance(p,a.retreatFrom.position)>3)a.retreatFrom=null;
    while(a.path.length>1&&distance(p,a.path[1])<1.2&&traverse(p,a.path[1])&&clearRetreat(p,a.path[1],a.retreatFrom,a.radius))a.path.shift();
    if(!a.path.length){if(a.poi&&distance(p,a.slot.position)<.28)arrive(a);else {a.timer=ranged(a,.6,1.5);a.state='rest';}return [0,0];}
    const target=a.path[0],tx=target[0]-p[0],tz=target[2]-p[2],length=Math.hypot(tx,tz),nx=tx/length,nz=tz/length;
    const remaining=distance(p,a.slot.position),speed=a.speed*clamp(remaining/.8,.25,1);
    // Individual lateral preference prevents a shared centreline without inventing random headings.
    let vx=nx*speed+nz*a.lane,vz=nz*speed-nx*a.lane;
    const neighbours=agents.filter(b=>b!==a).map(b=>({p:b.actor.state.position,v:b.velocity,r:b.radius,key:b.seed}));
    if(player)neighbours.push({p:player,v:[0,0],r:.32,key:0});
    for(const b of neighbours) {
      const dx=p[0]-b.p[0],dz=p[2]-b.p[2],d=Math.hypot(dx,dz),R=1.55+a.radius;
      if(d>R||Math.abs(p[1]-b.p[1])>1.7)continue;
      const safe=a.radius+b.r+.12,force=Math.max(0,(R-d)/R)*.6;
      if(d>.001){vx+=dx/d*force;vz+=dz/d*force;}
      const rvx=vx-b.v[0],rvz=vz-b.v[1],v2=rvx*rvx+rvz*rvz;
      const t=v2>1e-5?clamp(-(dx*rvx+dz*rvz)/v2,0,1.4):0;
      const predicted=Math.hypot(dx+rvx*t,dz+rvz*t);
      if(t>0&&predicted<safe+.25){const strength=(1-predicted/(safe+.25))*.85;vx+=nz*strength;vz-=nx*strength;}
    }
    const magnitude=Math.hypot(vx,vz),cap=a.speed;if(magnitude>cap){vx*=cap/magnitude;vz*=cap/magnitude;}
    const blend=1-Math.exp(-4*dt);return [a.velocity[0]+(vx-a.velocity[0])*blend,a.velocity[1]+(vz-a.velocity[1])*blend];
  }
  function dynamicMove(from,to,radius,exclude=null,player=null) {
    const navigation=exclude?model:playerModel;
    const dx=to[0]-from[0],dz=to[2]-from[2],steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.035));let p=[...from];
    const blocked=q=>exclude&&!allowedPosition(exclude,q)||agents.some(b=>b!==exclude&&Math.abs(q[1]-b.actor.state.position[1])<1.7&&distance(q,b.actor.state.position)<radius+b.radius+.025)||
      player&&Math.abs(q[1]-player[1])<1.7&&distance(q,player)<radius+.32+.025;
    for(let i=0;i<steps;i++) {
      const next=navigation.move(p,dx/steps,dz/steps);
      if(!blocked(next)){p=next;continue;}
      const x=navigation.move(p,dx/steps,0),z=navigation.move(p,0,dz/steps);
      if(!blocked(x)&&distance(x,p)>.0001)p=x;else if(!blocked(z))p=z;
    }
    return p;
  }
  function step(dt,player,camera) {
    for(const a of agents) {
      const m=a.actor.state;a.age+=dt;a.cooldown-=dt;a.socialCheck-=dt;
      const noticed=!!m.attending;
      if(noticed&&!a.wasAttending)a.attentionLeft=ranged(a,2.5,4);
      if(noticed)a.attentionLeft=Math.max(0,a.attentionLeft-dt);
      a.wasAttending=noticed;
      // A brief greeting must not freeze someone forever just because the player stands nearby.
      a.held=!!m.talking||(noticed&&a.attentionLeft>0);
      if(a.held&&a.partner)endChat(a,true);
    }
    // Decision work is staggered by each agent's own countdown, never a group tick.
    for(const a of agents) {
      const m=a.actor.state;m.time+=dt*a.speedFactor;
      if(a.held){a.velocity=[0,0];m.stride=Math.max(0,m.stride-dt*5);if(camera)turn(m,Math.atan2(camera[0]-m.position[0],camera[2]-m.position[2]),dt);continue;}
      if(a.partner){a.chatLeft-=dt;if(a.chatLeft<=0)endChat(a);else {turn(m,Math.atan2(a.partner.actor.state.position[0]-m.position[0],a.partner.actor.state.position[2]-m.position[2]),dt);a.velocity=[0,0];m.stride=Math.max(0,m.stride-dt*5);continue;}}
      if(a.state==='rest'){a.timer-=dt;if(a.timer<=0)choose(a,player);}
      if(a.socialCheck<=0)social(a,player);
    }
    // Snapshot forces, then swept collision against the latest positions: no penetrations.
    const velocities=agents.map(a=>!a.held&&!a.partner&&a.state==='travel'?steering(a,player,dt):[0,0]);
    agents.forEach((a,i)=>{
      const m=a.actor.state,p=m.position,[vx,vz]=velocities[i];
      if(!a.held&&!a.partner&&a.state==='travel') {
        const next=dynamicMove(p,[p[0]+vx*dt,p[1],p[2]+vz*dt],a.radius,a,player),d=distance(p,next);
        a.velocity=[(next[0]-p[0])/dt,(next[2]-p[2])/dt];m.position=next;
        if(d>.00005)turn(m,Math.atan2(a.velocity[0],a.velocity[1]),dt);
        a.blockedFor=d<.002?a.blockedFor+dt:0;
        if(a.blockedFor>rangedThreshold(a)){
          a.blockedFor=0;
          const nearPlayer=allowRetreat&&player&&distance(p,player)<1.35&&Math.abs(p[1]-player[1])<1.7;
          const neighbour=allowRetreat&&!nearPlayer&&agents.filter(b=>b!==a&&distance(p,b.actor.state.position)<1.35&&Math.abs(p[1]-b.actor.state.position[1])<1.7).sort((b,c)=>distance(p,b.actor.state.position)-distance(p,c.actor.state.position))[0];
          const obstruction=nearPlayer?{position:player,radius:.32}:neighbour?{position:neighbour.actor.state.position,radius:neighbour.radius}:null;
          // Back out along a real route to another free POI, rather than keep
          // selecting destinations on the far side of an impassable encounter.
          if(!obstruction||!choose(a,player,obstruction)){a.lastPOI=a.poi?.id;release(a);a.state='rest';a.action='LookAround';a.timer=ranged(a,.3,1.4);a.path=[];}
        }
      } else {a.velocity=[0,0];if(!a.held&&!a.partner&&a.poi){const q=a.poi.lookAt;const yaw=Math.atan2(q[0]-p[0],q[1]-p[2])+(a.action==='LookAround'?Math.sin(m.time*.45+a.lookPhase)*.35:0);turn(m,yaw,dt);}}
      const actual=Math.hypot(...a.velocity)/a.speed;m.stride+=(clamp(actual,0,1)-m.stride)*(1-Math.exp(-8*dt));
      m.socialTalking=!!a.partner;m.idleAction=a.held?'Idle':a.action;
    });
  }
  // A fixed per-instance patience value, not a random draw every frame.
  const rangedThreshold=a=>2.5+(a.seed%1900)/1000;
  return {
    agents,pois,reservations,
    update(dt,{player=null,camera=null}={}){if(dt<=0)return;let left=Math.min(dt,.25);while(left>1e-8){const delta=Math.min(left,1/30);step(delta,player,camera);left-=delta;}},
    constrainPlayer(from,to){return dynamicMove(from,to,.32);},
    safePlayerSpawn(preferred){
      const free=p=>model.valid(p[0],p[2])&&agents.every(a=>distance(p,a.actor.state.position)>a.radius+.32+.1);
      if(free(preferred))return [preferred[0],model.heightAt(preferred[0],preferred[2]),preferred[2]];
      const options=[];for(let dx=-6;dx<=6;dx+=.4)for(let dz=-6;dz<=6;dz+=.4){const p=[preferred[0]+dx,0,preferred[2]+dz];if(free(p)){p[1]=model.heightAt(p[0],p[2]);options.push(p);}}
      options.sort((a,b)=>distance(a,preferred)-distance(b,preferred));return options[0]||null;
    },
    suspend(){for(const a of agents){
      a.lastPOI=a.poi?.id||a.lastPOI;release(a);a.partner=null;a.path=[];a.retreatFrom=null;a.state='rest';a.action='Idle';a.velocity=[0,0];a.timer=ranged(a,.4,4.9);
      a.held=false;a.wasAttending=false;Object.assign(a.actor.state,{talking:false,attending:false,socialTalking:false,stride:0});
    }},
    dispose(){for(const a of agents){release(a);a.partner=null;}},
  };
}
