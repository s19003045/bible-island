import {walkSurfaces,walkFloor,stairCollisionProxies,proxyHeight} from './walk-data.js';
import {characterDefaults} from './character-controller.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const key=(x,z)=>`${x},${z}`;
export function createWalkModel(boxes=[],surfaces=walkSurfaces,floor=walkFloor,options={}) {
  const config={...characterDefaults,...options},radius=options.radius??.24,cell=4,grid=new Map(),step=.4;
  const proxies=options.proxies||(floor===walkFloor?stairCollisionProxies:[]);
  for(const b of boxes)for(let x=Math.floor(b.min[0]/cell);x<=Math.floor(b.max[0]/cell);x++)for(let z=Math.floor(b.min[2]/cell);z<=Math.floor(b.max[2]/cell);z++) {
    const k=key(x,z);if(!grid.has(k))grid.set(k,[]);grid.get(k).push(b);
  }
  const inBounds=(x,z)=>surfaces.some(s=>x>=s.x1+radius&&x<=s.x2-radius&&z>=s.z1+radius&&z<=s.z2-radius);
  function nearby(x,z) {
    const seen=new Set();
    for(let gx=Math.floor((x-radius)/cell);gx<=Math.floor((x+radius)/cell);gx++)for(let gz=Math.floor((z-radius)/cell);gz<=Math.floor((z+radius)/cell);gz++)for(const b of grid.get(key(gx,gz))||[])seen.add(b);
    return [...seen].filter(b=>(x-clamp(x,b.min[0],b.max[0]))**2+(z-clamp(z,b.min[2],b.max[2]))**2<radius*radius);
  }
  function baseGround(x,z) {
    if(!inBounds(x,z))return null;
    const proxy=proxies.find(p=>x>=p.x1&&x<=p.x2&&z>=p.z1&&z<=p.z2);
    let height=floor(x,z),dx=0,dz=0;
    if(!Number.isFinite(height))return null;
    if(proxy){height=proxyHeight(proxy,x,z);const slope=proxy.rise/(proxy.end-proxy.start);if(proxy.axis==='x')dx=slope;else dz=slope;}
    else {
      const e=.025;
      // At a discrete ledge use the top-face tangent, not a fictitious vertical ramp normal.
      const derivative=(a,b)=>Math.abs(a-b)>.05?(Math.min(Math.abs(a),Math.abs(b))<.00001?0:Math.abs(a)>Math.abs(b)?a:b):(a+b)/2;
      const xm=floor(x-e,z),xp=floor(x+e,z),zm=floor(x,z-e),zp=floor(x,z+e);
      dx=Number.isFinite(xm)&&Number.isFinite(xp)?derivative((height-xm)/e,(xp-height)/e):0;
      dz=Number.isFinite(zm)&&Number.isFinite(zp)?derivative((height-zm)/e,(zp-height)/e):0;
    }
    const length=Math.hypot(dx,1,dz),normal=[-dx/length,1/length,-dz/length];
    return {height,normal,slopeAngle:Math.acos(clamp(normal[1],-1,1))*180/Math.PI,kind:proxy?.kind||'ground',proxyId:proxy?.id||null,riserHeight:proxy?.riserHeight||0};
  }
  function sampleGround(x,z,referenceY=null,settings=config) {
    const ground=baseGround(x,z);if(!ground)return null;
    const ceiling=(referenceY??ground.height)+settings.maxStepHeight;
    for(const b of nearby(x,z))if(b.max[1]>ground.height+.00001&&b.max[1]<=ceiling+.00001&&b.min[1]<=ground.height+settings.maxStepHeight) {
      ground.height=b.max[1];ground.normal=[0,1,0];ground.slopeAngle=0;ground.kind='step';ground.proxyId=null;
    }
    return ground;
  }
  function clearBody(x,z,y,settings=config) {
    return !nearby(x,z).some(b=>b.max[1]>y+settings.skin&&b.min[1]<y+settings.bodyHeight-settings.skin);
  }
  function valid(x,z,referenceY=null) {
    const g=sampleGround(x,z,referenceY);return !!g&&g.riserHeight<=config.maxStepHeight+.00001&&g.slopeAngle<=config.maxSlopeAngle+.00001&&clearBody(x,z,g.height);
  }
  function transition(from,x,z,settings,grounded) {
    const g=sampleGround(x,z,from[1],settings);if(!g)return null;
    const dy=g.height-from[1];
    if(dy>settings.maxStepHeight+.00001||dy<-(grounded?settings.groundSnapDistance:settings.maxStepHeight)-.00001)return null;
    if(g.riserHeight>settings.maxStepHeight+.00001||g.slopeAngle>settings.maxSlopeAngle+.00001||!clearBody(x,z,g.height,settings))return null;
    // Step-up also sweeps the lifted capsule at its original XZ: no popping through a low ceiling.
    if(dy>.00001&&!clearBody(from[0],from[2],g.height,settings))return null;
    return {position:[x,g.height,z],ground:g,stepped:Math.abs(dy)>.00001&&(g.kind==='step'||g.slopeAngle<.01)};
  }
  function moveDetailed(position,dx,dz,{isGrounded=true,config:overrides={}}={}) {
    const settings={...config,...overrides},count=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.08));let p=[...position],stepped=false;
    for(let i=0;i<count;i++) {
      let result=transition(p,p[0]+dx/count,p[2]+dz/count,settings,isGrounded);
      if(!result&&Math.abs(dx)>.000001)result=transition(p,p[0]+dx/count,p[2],settings,isGrounded);
      if(!result&&Math.abs(dz)>.000001)result=transition(p,p[0],p[2]+dz/count,settings,isGrounded);
      if(result){p=result.position;stepped ||=result.stepped;}
    }
    const ground=sampleGround(p[0],p[2],p[1],settings);
    return {position:p,ground,stepped,isGrounded:!!ground&&Math.abs(p[1]-ground.height)<.025};
  }
  const move=(position,dx,dz)=>moveDetailed(position,dx,dz).position;
  const heightAt=(x,z)=>sampleGround(x,z)?.height??null;
  const nodes=new Map();let built=false;
  function makeGraph() {
    if(built)return;built=true;
    for(const s of surfaces)for(let ix=Math.ceil((s.x1+radius)/step);ix<=Math.floor((s.x2-radius)/step);ix++)for(let iz=Math.ceil((s.z1+radius)/step);iz<=Math.floor((s.z2-radius)/step);iz++) {
      const x=ix*step,z=iz*step;if(valid(x,z))nodes.set(key(ix,iz),{ix,iz,x,z});
    }
  }
  function nearest(p) {let best=null,d=Infinity;for(const n of nodes.values()){const v=(p[0]-n.x)**2+(p[2]-n.z)**2;if(v<d){d=v;best=n;}}return best;}
  const edges=new Map();
  function connected(a,b) {
    const k=`${a.ix},${a.iz}:${b.ix},${b.iz}`;if(edges.has(k))return edges.get(k);
    const from=[a.x,heightAt(a.x,a.z),a.z],to=move(from,b.x-a.x,b.z-a.z),ok=Math.hypot(to[0]-b.x,to[2]-b.z)<.001;edges.set(k,ok);return ok;
  }
  function path(from,to) {
    makeGraph();const start=nearest(from),end=nearest(to);if(!start||!end)return [];
    if(Math.hypot(end.x-to[0],end.z-to[2])>3.8)return [];
    const first=key(start.ix,start.iz),last=key(end.ix,end.iz),open=new Set([first]),g=new Map([[first,0]]),came=new Map();
    const heuristic=n=>Math.hypot(n.x-end.x,n.z-end.z);
    while(open.size) {
      let current=null,score=Infinity;for(const k of open){const v=g.get(k)+heuristic(nodes.get(k));if(v<score){score=v;current=k;}}
      if(current===last) {const result=[];let k=last;while(k){const n=nodes.get(k);result.push([n.x,heightAt(n.x,n.z),n.z]);k=came.get(k);}return result.reverse();}
      open.delete(current);const n=nodes.get(current);
      for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) {
        const k=key(n.ix+dx,n.iz+dz),next=nodes.get(k);if(!next)continue;
        if(dx&&dz&&(!nodes.has(key(n.ix+dx,n.iz))||!nodes.has(key(n.ix,n.iz+dz))))continue;
        if(!connected(n,next))continue;
        const tentative=g.get(current)+Math.hypot(dx,dz)*step;
        if(tentative<(g.get(k)??Infinity)){came.set(k,current);g.set(k,tentative);open.add(k);}
      }
    }
    return [];
  }
  return {heightAt,sampleGround,valid,move,moveDetailed,path,radius,config,proxies};
}
