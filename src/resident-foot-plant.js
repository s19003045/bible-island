import * as THREE from 'three';
import {residentFootContact} from './resident-locomotion.js';

// Extract the actual rigid foot geometry from the exported skinned mesh once. No
// guessed ankle height overwrites heel/toe pitch or the authored swing clearance.
export function createPlantedFootGrounding(root,groundAt){
  root.updateMatrixWorld(true);
  const hips=root.getObjectByName('hips'),up=new THREE.Vector3(0,1,0),front=new THREE.Vector3(0,0,1);
  const legs=['L','R'].map(side=>{
    const thigh=root.getObjectByName('thigh'+side),shin=root.getObjectByName('shin'+side),foot=root.getObjectByName('foot'+side);
    if(!thigh||!shin||!foot)return null;
    const vertices=[],inverse=foot.matrixWorld.clone().invert();
    root.traverse(mesh=>{
      if(!mesh.isSkinnedMesh)return;const index=mesh.skeleton.bones.indexOf(foot);if(index<0)return;
      const {position,skinIndex,skinWeight}=mesh.geometry.attributes;
      for(let i=0;i<position.count;i++)for(let j=0;j<4;j++)if(skinIndex.getComponent(i,j)===index&&skinWeight.getComponent(i,j)>.999){
        // GLB node defaults can already be a baked pose. Read the actual bound
        // skin position before converting to the foot's rigid local space.
        vertices.push({local:mesh.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(mesh.matrixWorld).applyMatrix4(inverse),rest:new THREE.Vector3().fromBufferAttribute(position,i).applyMatrix4(mesh.bindMatrix)});break;
      }
    });
    if(!vertices.length)return null;
    const bottom=Math.min(...vertices.map(v=>v.rest.y)),sole=vertices.filter(v=>v.rest.y<bottom+.012);
    const minZ=Math.min(...vertices.map(v=>v.rest.z)),maxZ=Math.max(...vertices.map(v=>v.rest.z));
    const center=points=>points.reduce((a,p)=>a.add(p.local),new THREE.Vector3()).multiplyScalar(1/points.length);
    const lowest=points=>{const low=Math.min(...points.map(p=>p.rest.y));return points.filter(p=>p.rest.y<low+.002);};
    const pivots={flat:center(sole),heel:center(lowest(vertices.filter(p=>p.rest.z<minZ+.015))),toe:center(lowest(vertices.filter(p=>p.rest.z>maxZ-.015)))};
    // A curved bare heel can sit above the toe in the rest pose and become the
    // lowest point after heel roll or slope alignment. Keep every foot vertex
    // for collision, rather than treating a rest-Y slice as the complete sole.
    return {side,thigh,shin,foot,sole:vertices.map(v=>v.local),pivots,anchor:null,contact:null,
      l1:thigh.getWorldPosition(new THREE.Vector3()).distanceTo(shin.getWorldPosition(new THREE.Vector3())),
      l2:shin.getWorldPosition(new THREE.Vector3()).distanceTo(foot.getWorldPosition(new THREE.Vector3()))};
  });
  if(!hips||legs.some(l=>!l))return ()=>{};
  function orient(bone,child,target){
    const origin=bone.getWorldPosition(new THREE.Vector3()),current=child.getWorldPosition(new THREE.Vector3()).sub(origin).normalize(),desired=target.clone().sub(origin).normalize();
    const world=new THREE.Quaternion().setFromUnitVectors(current,desired).multiply(bone.getWorldQuaternion(new THREE.Quaternion()));
    bone.quaternion.copy(bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(world));bone.updateWorldMatrix(true,true);
  }
  return ({position:base,clip='Idle',time=0,phase=0,dt=0,reset=false})=>{
    root.updateMatrixWorld(true);const scale=root.getWorldScale(new THREE.Vector3()).y,targets=[];
    front.set(0,0,1).applyQuaternion(root.getWorldQuaternion(new THREE.Quaternion()));
    for(const leg of legs){
      const foot=leg.foot,ankle=foot.getWorldPosition(new THREE.Vector3()),orientation=foot.getWorldQuaternion(new THREE.Quaternion());
      const points=leg.sole.map(p=>p.clone().applyMatrix4(foot.matrixWorld)),minY=Math.min(...points.map(p=>p.y));
      const contact=residentFootContact(clip,time,leg.side,phase),pivot=leg.pivots[contact==='swing'?'flat':contact].clone().applyMatrix4(foot.matrixWorld);
      const h=groundAt(pivot.x,pivot.z),floor=Number.isFinite(h)?h:base[1];
      const normal=new THREE.Vector3(-(groundAt(pivot.x+.1,pivot.z)-groundAt(pivot.x-.1,pivot.z))/.2,1,-(groundAt(pivot.x,pivot.z+.1)-groundAt(pivot.x,pivot.z-.1))/.2).normalize();
      if(!Number.isFinite(normal.y)||normal.y<.65)normal.copy(up);
      if(reset||leg.contact!==contact||contact==='swing')leg.anchor=null;
      if(contact!=='swing'&&!leg.anchor)leg.anchor=new THREE.Vector3(pivot.x,floor,pivot.z);
      const worldOrientation=new THREE.Quaternion().setFromUnitVectors(up,normal).multiply(orientation),target=ankle.clone();
      const pivotOffset=leg.pivots[contact==='swing'?'flat':contact].clone().multiplyScalar(scale).applyQuaternion(worldOrientation);
      if(leg.anchor){
        const orientedPivot=target.clone().add(pivotOffset),shift=leg.anchor.clone().sub(orientedPivot);
        // A controller discontinuity/reposition cannot drag a planted leg across
        // the scene. Genuine long moves reacquire a safe support instead.
        if(Math.hypot(shift.x,shift.z)>.27*scale){leg.anchor.set(orientedPivot.x,floor,orientedPivot.z);shift.copy(leg.anchor).sub(orientedPivot);}
        target.x+=shift.x;target.z+=shift.z;
      }
      // Solve against the final tilted sole, rather than first grounding a flat
      // foot and then rotating it through a slope. Swing retains baked clearance.
      let lift=-Infinity;
      for(const point of leg.sole){const offset=point.clone().multiplyScalar(scale).applyQuaternion(worldOrientation),height=groundAt(target.x+offset.x,target.z+offset.z);lift=Math.max(lift,(Number.isFinite(height)?height:base[1])-target.y-offset.y);}
      target.y+=lift+(contact==='swing'?Math.max(0,minY-base[1]):0);
      leg.contact=contact;targets.push({leg,target,worldOrientation});
    }
    let lower=0;
    for(const {leg,target}of targets){const hip=leg.thigh.getWorldPosition(new THREE.Vector3()),horizontal=Math.hypot(hip.x-target.x,hip.z-target.z),reach=(leg.l1+leg.l2)*.998;lower=Math.max(lower,hip.y-target.y-Math.sqrt(Math.max(0,reach*reach-horizontal*horizontal)));}
    if(lower>0){const p=hips.getWorldPosition(new THREE.Vector3());p.y-=Math.min(lower,.12*scale);hips.position.copy(hips.parent.worldToLocal(p));hips.updateWorldMatrix(true,true);}
    for(const {leg,target,worldOrientation}of targets){
      const hip=leg.thigh.getWorldPosition(new THREE.Vector3()),axis=target.clone().sub(hip),d=THREE.MathUtils.clamp(axis.length(),.01,leg.l1+leg.l2-.00001);axis.normalize();
      const bend=front.clone().addScaledVector(axis,-front.dot(axis)).normalize(),along=(leg.l1**2-leg.l2**2+d*d)/(2*d);
      const knee=hip.clone().addScaledVector(axis,along).addScaledVector(bend,Math.sqrt(Math.max(0,leg.l1**2-along*along)));
      orient(leg.thigh,leg.shin,knee);orient(leg.shin,leg.foot,target);
      leg.foot.quaternion.copy(leg.foot.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(worldOrientation));leg.foot.updateWorldMatrix(true,true);
    }
  };
}
