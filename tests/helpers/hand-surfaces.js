import * as THREE from 'three';

export function handSurfacePoints(root){
  const points=[];
  root.traverse(mesh=>{
    if(!mesh.isSkinnedMesh||!mesh.name.includes('arms-and-hands'))return;
    const {position,skinIndex,skinWeight}=mesh.geometry.attributes;
    for(let i=0;i<position.count;i++)for(let j=0;j<4;j++){
      const name=mesh.skeleton.bones[skinIndex.getComponent(i,j)]?.name;
      if(/^(hand|finger|thumb)[LR]/.test(name)&&skinWeight.getComponent(i,j)>.5){points.push([mesh,i,name.replace(/[ABC]$/,'')]);break;}
    }
  });
  return points;
}

// Nearest evaluated triangle normals give a local surface penetration sample.
// Closed handles additionally use solid-angle winding; open surfaces retain
// local-normal samples. Neither mode claims continuous collision proof.
export function localSurfaceContacts(root,target,points,triangleIndices=target.geometry.index,{closedSolid=false}={}){
  root.updateMatrixWorld(true);
  const vertices=Array.from({length:target.geometry.attributes.position.count},(_,i)=>target.localToWorld(target.getVertexPosition(i,new THREE.Vector3())));
  const index=triangleIndices,triangles=[];let volume=0;
  for(let i=0;i<index.count;i+=3){
    const [p,q,r]=[0,1,2].map(k=>vertices[index.getX(i+k)]),triangle=new THREE.Triangle(p,q,r);
    triangles.push({triangle,normal:triangle.getNormal(new THREE.Vector3())});volume+=p.dot(q.clone().cross(r))/6;
  }
  const rows={},near=new THREE.Vector3(),diff=new THREE.Vector3();
  const bounds=closedSolid?new THREE.Box3().setFromPoints(triangles.flatMap(({triangle})=>[triangle.a,triangle.b,triangle.c])):null;
  function inside(point){
    // Solid-angle winding avoids ambiguous single-face normals at concave edges.
    let angle=0;const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),cross=new THREE.Vector3();
    for(const {triangle} of triangles){
      a.copy(triangle.a).sub(point);b.copy(triangle.b).sub(point);c.copy(triangle.c).sub(point);
      const la=a.length(),lb=b.length(),lc=c.length();
      angle+=2*Math.atan2(a.dot(cross.crossVectors(b,c)),la*lb*lc+a.dot(b)*lc+b.dot(c)*la+c.dot(a)*lb);
    }
    return Math.abs(angle)>Math.PI*2;
  }
  for(const [mesh,i,name] of points){
    const p=mesh.localToWorld(mesh.getVertexPosition(i,new THREE.Vector3()));let min=Infinity,signed=0;
    for(const {triangle,normal} of triangles){triangle.closestPointToPoint(p,near);const d=near.distanceToSquared(p);if(d<min){min=d;signed=diff.copy(p).sub(near).dot(normal)*Math.sign(volume);}}
    const row=rows[name]??={samples:0,gap:Infinity,penetration:0};row.samples++;row.gap=Math.min(row.gap,Math.sqrt(min));
    const penetration=closedSolid?(bounds.containsPoint(p)&&inside(p)?Math.sqrt(min):0):-signed;
    if(penetration>row.penetration){row.penetration=penetration;row.worstPoint=p.toArray();}
  }
  return rows;
}

// Weld exporter seams before separating a bowl's open shell from its closed handle.
export function closedSurfaceComponents(geometry){
  const p=geometry.attributes.position,index=geometry.index;
  const keys=Array.from({length:p.count},(_,i)=>[p.getX(i),p.getY(i),p.getZ(i)].map(v=>v.toFixed(6)).join(','));
  const parent=new Map(keys.map(k=>[k,k]));
  function find(k){if(parent.get(k)!==k)parent.set(k,find(parent.get(k)));return parent.get(k);}
  for(let i=0;i<index.count;i+=3){const first=find(keys[index.getX(i)]);for(let j=1;j<3;j++)parent.set(find(keys[index.getX(i+j)]),first);}
  const groups=new Map();
  for(let i=0;i<index.count;i+=3){const key=find(keys[index.getX(i)]);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(...[0,1,2].map(j=>index.getX(i+j)));}
  return [...groups.values()].filter(tris=>{
    const edges=new Map();
    for(let i=0;i<tris.length;i+=3)for(let j=0;j<3;j++){const edge=[keys[tris[i+j]],keys[tris[i+(j+1)%3]]].sort().join('|');edges.set(edge,(edges.get(edge)||0)+1);}
    return [...edges.values()].every(count=>count===2);
  }).map(tris=>new THREE.Uint32BufferAttribute(tris,1));
}
