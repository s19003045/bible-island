import * as THREE from 'three';

export function articulatedFootPoints(root,side){
 const foot=root.getObjectByName('foot'+side),points=[];
 root.traverse(mesh=>{
  if(!mesh.isSkinnedMesh)return;
  const bones=new Set(mesh.skeleton.bones.map((bone,i)=>{while(bone&&bone!==foot)bone=bone.parent;return bone===foot?i:-1;}).filter(i=>i>=0));
  const {position,skinIndex,skinWeight}=mesh.geometry.attributes;
  for(let i=0;i<position.count;i++){let weight=0;for(let k=0;k<4;k++)if(bones.has(skinIndex.getComponent(i,k)))weight+=skinWeight.getComponent(i,k);if(weight>.999)points.push([mesh,i]);}
 });
 return points;
}
export function sampleVertices(root,points){root.updateMatrixWorld(true);return points.map(([mesh,i])=>mesh.localToWorld(mesh.getVertexPosition(i,new THREE.Vector3())));}
export function wardrobePointSets(root){
 const surfaces=new Map();
 root.traverse(mesh=>{if(!mesh.isMesh)return;const name=mesh.material.name.replace(/\.\d+$/,''),p=mesh.geometry.attributes.position,c=mesh.geometry.attributes.color;let set=surfaces.get(name);if(!set)surfaces.set(name,set=new Set());for(let i=0;i<p.count;i++)set.add([p.getX(i),p.getY(i),p.getZ(i),c.getX(i),c.getY(i),c.getZ(i)].map(n=>Math.round(n*1e5)).join(','));});
 return surfaces;
}
