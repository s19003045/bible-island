import {walkSurfaces,walkFloor} from './walk-data.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const key=(x,z)=>`${x},${z}`;
export function createWalkModel(boxes=[],surfaces=walkSurfaces,floor=walkFloor) {
  const radius=.24,cell=4,grid=new Map(),step=.4;
  for(const b of boxes)for(let x=Math.floor(b.min[0]/cell);x<=Math.floor(b.max[0]/cell);x++)for(let z=Math.floor(b.min[2]/cell);z<=Math.floor(b.max[2]/cell);z++) {
    const k=key(x,z);if(!grid.has(k))grid.set(k,[]);grid.get(k).push(b);
  }
  function heightAt(x,z) {
    return surfaces.some(s=>x>=s.x1+radius&&x<=s.x2-radius&&z>=s.z1+radius&&z<=s.z2-radius)?floor(x,z):null;
  }
  function valid(x,z) {
    const y=heightAt(x,z);if(y===null)return false;
    const seen=new Set();
    for(let gx=Math.floor((x-radius)/cell);gx<=Math.floor((x+radius)/cell);gx++)for(let gz=Math.floor((z-radius)/cell);gz<=Math.floor((z+radius)/cell);gz++)for(const b of grid.get(key(gx,gz))||[]) {
      if(seen.has(b))continue;seen.add(b);
      if(b.max[1]<=y+.27||b.min[1]>=y+1.7)continue;
      if((x-clamp(x,b.min[0],b.max[0]))**2+(z-clamp(z,b.min[2],b.max[2]))**2<radius*radius)return false;
    }
    return true;
  }
  function move(position,dx,dz) {
    let [x,,z]=position;const count=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.12));
    for(let i=0;i<count;i++) {
      const nx=x+dx/count,nz=z+dz/count;
      if(valid(nx,nz)){x=nx;z=nz;}else if(valid(nx,z))x=nx;else if(valid(x,nz))z=nz;
    }
    return [x,heightAt(x,z)??position[1],z];
  }
  const nodes=new Map();let built=false;
  function makeGraph() {
    if(built)return;built=true;
    for(const s of surfaces)for(let ix=Math.ceil((s.x1+radius)/step);ix<=Math.floor((s.x2-radius)/step);ix++)for(let iz=Math.ceil((s.z1+radius)/step);iz<=Math.floor((s.z2-radius)/step);iz++) {
      const x=ix*step,z=iz*step;if(valid(x,z))nodes.set(key(ix,iz),{ix,iz,x,z});
    }
  }
  function nearest(p) {
    let best=null,d=Infinity;for(const n of nodes.values()){const v=(p[0]-n.x)**2+(p[2]-n.z)**2;if(v<d){d=v;best=n;}}return best;
  }
  function path(from,to) {
    makeGraph();const start=nearest(from),end=nearest(to);if(!start||!end)return [];
    if(Math.hypot(end.x-to[0],end.z-to[2])>3.8)return [];
    const first=key(start.ix,start.iz),last=key(end.ix,end.iz),open=new Set([first]),g=new Map([[first,0]]),came=new Map();
    const heuristic=n=>Math.hypot(n.x-end.x,n.z-end.z);
    while(open.size) {
      let current=null,score=Infinity;
      for(const k of open){const v=g.get(k)+heuristic(nodes.get(k));if(v<score){score=v;current=k;}}
      if(current===last) {
        const result=[];let k=last;while(k){const n=nodes.get(k);result.push([n.x,floor(n.x,n.z),n.z]);k=came.get(k);}return result.reverse();
      }
      open.delete(current);const n=nodes.get(current);
      for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) {
        const k=key(n.ix+dx,n.iz+dz),next=nodes.get(k);if(!next)continue;
        // No diagonal clipping through the corners of narrow passages.
        if(dx&&dz&&(!nodes.has(key(n.ix+dx,n.iz))||!nodes.has(key(n.ix,n.iz+dz))))continue;
        const tentative=g.get(current)+Math.hypot(dx,dz)*step;
        if(tentative<(g.get(k)??Infinity)){came.set(k,current);g.set(k,tentative);open.add(k);}
      }
    }
    return [];
  }
  return {heightAt,valid,move,path,radius};
}
