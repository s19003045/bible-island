import {npcSeed,seededNPC} from './npc-system.js';
import {angleDelta} from './people-motion.js';
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const turn=(state,yaw,dt)=>state.yaw+=clamp(angleDelta(state.yaw,yaw)*(1-Math.exp(-5*dt)),-2.2*dt,2.2*dt);

// A forward-only POI journey. No random heading, shared decision clock or on-screen wrap.
export function createConvoySystem({actors,pois,model,playerModel,spawn=[4,.03,-6.5],seed=14026,onEvent=()=>{}}){
 const reservations=new Map(pois.map(p=>[p.id,new Map()]));
 const agents=actors.map((actor,index)=>{
  const key=actor.id||`crossing-person-${index}`,individualSeed=npcSeed(`${seed}:${key}`),random=seededNPC(individualSeed),speedFactor=.85+random()*.3;
  const a={key,actor,seed:individualSeed,random,speedFactor,speed:.8*speedFactor,radius:actor.collisionRadius??.29*(actor.scale||1),role:'convoy',
   state:'rest',action:'LookAround',timer:.35+(index+random())/actors.length*4.5,age:0,cooldown:0,partner:null,poi:null,slot:null,lastPOI:null,
   velocity:[0,0],blockedFor:0,held:false,wasAttending:false,attentionLeft:0,visits:new Map(),lap:0,hidden:false,entryDelay:0,maxProgress:actor.id?80:520,lateralBias:random()<.5?-1:1};
  Object.assign(actor.state,{autonomous:true,animationSpeed:speedFactor,time:random()*80,behavior:a,visible:true});return a;
 });
 const placed=[];
 for(const a of [...agents].sort((a,b)=>Number(!!b.actor.id)-Number(!!a.actor.id))){
  const origin=a.actor.state.position,free=p=>model.valid(p[0],p[2])&&distance(p,spawn)>a.radius+.9&&placed.every(b=>distance(p,b.actor.state.position)>a.radius+b.radius+.3);
  const candidates=[];for(let n=0;n<10;n++)for(const z of [-6.8,-4,-1.2,1.6,4.4,6.8])candidates.push([origin[0]+n*.9,.03,z]);
  const p=free(origin)?origin:candidates.filter(free).sort((p,q)=>distance(p,origin)-distance(q,origin))[0];
  if(!p)throw new Error(`No safe convoy spawn for ${a.key}`);a.actor.state.position=[p[0],model.heightAt(p[0],p[2]),p[2]];placed.push(a);
 }
 const emit=(a,type,extra={})=>onEvent({agent:a.key,time:a.age,type,lap:a.lap,...extra});
 const range=(a,min,max)=>min+a.random()*(max-min);
 function release(a){if(a.poi)reservations.get(a.poi.id).delete(a.key);a.poi=null;a.slot=null;}
 function clearAt(p,r,exclude=null,player=null){
  return agents.every(b=>b===exclude||b.hidden||distance(p,b.actor.state.position)>=r+b.radius+.025)&&(!player||distance(p,player)>=r+.32+.025);
 }
 function choose(a,player){
  const origin=a.actor.state.position;
  const candidates=pois.filter(p=>p.id!==a.lastPOI&&p.x>origin[0]+1.6&&p.x<=Math.min(a.maxProgress,origin[0]+23))
   .map(p=>({p,slots:p.slots.map((position,index)=>({position,index})).filter(s=>![...reservations.get(p.id).values()].includes(s.index)&&clearAt(s.position,a.radius,a,player)),weight:p.weight/(1+(p.x-origin[0])/8)})).filter(p=>p.slots.length);
  if(!candidates.length){a.state='rest';a.action='LookAround';a.timer=range(a,1.1,2.8);return;}
  let roll=a.random()*candidates.reduce((n,c)=>n+c.weight,0),chosen=candidates.at(-1);for(const c of candidates){roll-=c.weight;if(roll<=0){chosen=c;break;}}
  // Individual slot preference varies lateral spacing, while every destination stays ahead.
  const slots=chosen.slots.map(s=>({...s,weight:1/(1+Math.abs(s.position[2]-origin[2])/4)}));
  roll=a.random()*slots.reduce((n,s)=>n+s.weight,0);let slot=slots.at(-1);for(const s of slots){roll-=s.weight;if(roll<=0){slot=s;break;}}
  release(a);a.poi=chosen.p;a.slot=slot;reservations.get(a.poi.id).set(a.key,slot.index);a.state='travel';a.action='Walk';emit(a,'depart',{poi:a.poi.id});
 }
 function swept(from,dx,dz,radius,exclude=null,player=null){
  let p=[...from];const count=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.035));
  for(let i=0;i<count;i++){
   const q=model.move(p,dx/count,dz/count);
   if(clearAt(q,radius,exclude,player)){p=q;continue;}
   const x=model.move(p,dx/count,0),z=model.move(p,0,dz/count);
   if(clearAt(x,radius,exclude,player)&&distance(x,p)>.000001)p=x;else if(clearAt(z,radius,exclude,player))p=z;
  }return p;
 }
 function hideAtExit(a,camera,isVisible){
  const p=a.actor.state.position;if(a.actor.id||p[0]<516||!camera||distance(p,camera)<75||isVisible(p))return;
  release(a);a.hidden=true;a.actor.state.visible=false;a.state='offstage';a.action='Idle';a.velocity=[0,0];a.entryDelay=range(a,3,13);emit(a,'exit');
 }
 function reenter(a,player,camera,isVisible){
  const options=[-6.6,-3.3,0,3.3,6.6].map(z=>[-28,.03,z]);
  const free=options.filter(p=>!isVisible(p)&&(!camera||distance(p,camera)>15)&&(!player||distance(p,player)>25)&&clearAt(p,a.radius,a,player));
  if(!free.length){a.entryDelay=range(a,1.2,3.7);return;}
  const p=free[Math.floor(a.random()*free.length)];a.actor.state.position=[...p];a.actor.state.visible=true;a.actor.state.stride=0;
  a.hidden=false;a.lap++;a.state='rest';a.action='LookAround';a.timer=range(a,.3,2.4);a.lastPOI=null;a.velocity=[0,0];emit(a,'enter');
 }
 function integrate(dt,{player,camera,isVisible}){
  for(const a of agents){const m=a.actor.state;a.age+=dt;m.time+=dt*a.speedFactor;
   if(a.hidden){a.entryDelay-=dt;if(a.entryDelay<=0)reenter(a,player,camera,isVisible);continue;}
   const noticed=!!m.attending;if(noticed&&!a.wasAttending)a.attentionLeft=range(a,2.5,4);if(noticed)a.attentionLeft=Math.max(0,a.attentionLeft-dt);a.wasAttending=noticed;
   a.held=!!m.talking||noticed&&a.attentionLeft>0;
   if(a.held){a.velocity=[0,0];m.stride=Math.max(0,m.stride-dt*5);m.idleAction='Idle';if(camera)turn(m,Math.atan2(camera[0]-m.position[0],camera[2]-m.position[2]),dt);continue;}
   if(a.state==='rest'){a.timer-=dt;if(a.timer<=0)choose(a,player);}
   if(a.state!=='travel'){m.idleAction=a.action;m.stride=Math.max(0,m.stride-dt*5);turn(m,Math.PI/2,dt);hideAtExit(a,camera,isVisible);continue;}
   const p=m.position,target=a.slot.position,dx=target[0]-p[0],dz=target[2]-p[2],length=Math.hypot(dx,dz);
   if(length<.18){a.state='rest';a.action='LookAround';a.lastPOI=a.poi.id;m.idleAction=a.action;a.timer=range(a,...a.poi.dwell);a.visits.set(a.poi.id,(a.visits.get(a.poi.id)||0)+1);a.velocity=[0,0];emit(a,'arrive',{poi:a.poi.id});continue;}
   let vx=Math.max(0,dx/length*a.speed),vz=dz/length*a.speed;
   const neighbors=agents.filter(b=>b!==a&&!b.hidden).map(b=>({position:b.actor.state.position,velocity:b.velocity,radius:b.radius}));if(player)neighbors.push({position:player,velocity:[0,0],radius:.32});
   for(const b of neighbors){const ox=p[0]-b.position[0],oz=p[2]-b.position[2],d=Math.hypot(ox,oz),R=1.8;if(d>=R)continue;
    const safe=a.radius+b.radius+.16,force=(R-d)/R*.7;if(d>.001){vx+=ox/d*force;vz+=oz/d*force;}
    // Predict a slower person ahead and pass laterally, never turn back along the corridor.
    const rvx=vx-b.velocity[0],rvz=vz-b.velocity[1],relativeSpeed2=rvx*rvx+rvz*rvz;
    const horizon=relativeSpeed2>1e-5?clamp(-(ox*rvx+oz*rvz)/relativeSpeed2,0,1.4):0,predicted=Math.hypot(ox+rvx*horizon,oz+rvz*horizon);
    if(ox<0&&(d<safe+.35||horizon>0&&predicted<safe+.2)){const side=oz>.08?1:oz<-.08?-1:a.lateralBias;vz+=side*(1-d/R)*.8;vx*=clamp((d-safe)/.65,0,1);}
   }
   vx=Math.max(0,vx);const magnitude=Math.hypot(vx,vz);if(magnitude>a.speed){vx*=a.speed/magnitude;vz*=a.speed/magnitude;}
   const blend=1-Math.exp(-4*dt);vx=a.velocity[0]+(vx-a.velocity[0])*blend;vz=a.velocity[1]+(vz-a.velocity[1])*blend;
   const next=swept(p,Math.min(Math.max(0,dx),Math.max(0,vx)*dt),vz*dt,a.radius,a,player),moved=distance(next,p);a.velocity=[(next[0]-p[0])/dt,(next[2]-p[2])/dt];m.position=next;
   if(moved>.00001)turn(m,Math.atan2(a.velocity[0],a.velocity[1]),dt);a.blockedFor=moved<.002?a.blockedFor+dt:0;
   if(a.blockedFor>2.5+(a.seed%1500)/1000){a.lastPOI=a.poi.id;release(a);a.state='rest';a.action='LookAround';a.velocity=[0,0];a.timer=range(a,.4,1.4);a.blockedFor=0;}
   m.stride+=(clamp(moved/dt/a.speed,0,1)-m.stride)*(1-Math.exp(-8*dt));m.idleAction=a.action;m.socialTalking=false;hideAtExit(a,camera,isVisible);
  }
 }
 return {agents,pois,reservations,
  update(dt,{player=null,camera=null,isVisible=()=>true}={}){let left=Math.min(.25,Math.max(0,dt));while(left>1e-8){const d=Math.min(left,1/30);integrate(d,{player,camera,isVisible});left-=d;}},
  constrainPlayer(from,to){return swept(from,to[0]-from[0],to[2]-from[2],.32);},
  safePlayerSpawn(preferred){const options=[preferred];for(const x of [2,4,6,8,10])for(const z of [-7,-4,0,4,7])options.push([x,.03,z]);return options.filter(p=>playerModel.valid(p[0],p[2])&&clearAt(p,.4)).sort((a,b)=>distance(a,preferred)-distance(b,preferred))[0]||null;},
  suspend(){for(const a of agents){release(a);a.velocity=[0,0];if(!a.hidden){a.state='rest';a.action='LookAround';a.timer=range(a,.3,2.8);}}},
  dispose(){this.suspend();},
 };
}
