import * as THREE from 'three';

// Appearance only. Behaviour, collision and clocks stay with the NPC system.
export function createResidentGrounding(root,groundAt) {
  root.updateMatrixWorld(true);
  const hips=root.getObjectByName('hips'),legs=['L','R'].map(side=>{
    const thigh=root.getObjectByName('thigh'+side),shin=root.getObjectByName('shin'+side),foot=root.getObjectByName('foot'+side);
    if(!thigh||!shin||!foot)return null;
    return {thigh,shin,foot,l1:thigh.getWorldPosition(new THREE.Vector3()).distanceTo(shin.getWorldPosition(new THREE.Vector3())),l2:shin.getWorldPosition(new THREE.Vector3()).distanceTo(foot.getWorldPosition(new THREE.Vector3()))};
  });
  if(!hips||legs.some(l=>!l))return ()=>{};
  const up=new THREE.Vector3(0,1,0),position=new THREE.Vector3(),axis=new THREE.Vector3(),bend=new THREE.Vector3(),front=new THREE.Vector3(),quaternion=new THREE.Quaternion();
  function orient(bone,child,target) {
    const origin=bone.getWorldPosition(new THREE.Vector3()),current=child.getWorldPosition(new THREE.Vector3()).sub(origin).normalize(),desired=target.clone().sub(origin).normalize();
    const world=new THREE.Quaternion().setFromUnitVectors(current,desired).multiply(bone.getWorldQuaternion(new THREE.Quaternion()));
    bone.quaternion.copy(bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(world));bone.updateWorldMatrix(true,true);
  }
  return ({position:base,phase=0,walkWeight=0})=>{
    root.updateMatrixWorld(true);const scale=root.getWorldScale(position).y,targets=[];
    front.set(0,0,1).applyQuaternion(root.getWorldQuaternion(quaternion));
    for(let i=0;i<legs.length;i++){
      const leg=legs[i],target=leg.foot.getWorldPosition(new THREE.Vector3()),h=groundAt(target.x,target.z);
      const normal=new THREE.Vector3(-(groundAt(target.x+.1,target.z)-groundAt(target.x-.1,target.z))/.2,1,-(groundAt(target.x,target.z+.1)-groundAt(target.x,target.z-.1))/.2).normalize();
      if(!Number.isFinite(h)||!Number.isFinite(normal.y)||normal.y<.65)normal.copy(up);
      const u=((phase+i*.5)%1+1)%1,t=(u-.58)/.42,lift=u<.58?0:.075*Math.sin(Math.PI*t)**2*walkWeight;
      target.y=(Number.isFinite(h)?h:base[1])+.105*scale/normal.y+lift*scale;
      targets.push({target,normal,orientation:leg.foot.getWorldQuaternion(new THREE.Quaternion())});
    }
    // Lower the visible pelvis only when a rear foot on a slope needs more reach.
    let lower=0;
    for(let i=0;i<legs.length;i++){
      const leg=legs[i],hip=leg.thigh.getWorldPosition(new THREE.Vector3()),target=targets[i].target;
      const horizontal=Math.hypot(hip.x-target.x,hip.z-target.z),reach=(leg.l1+leg.l2)*.999;
      lower=Math.max(lower,hip.y-target.y-Math.sqrt(Math.max(0,reach*reach-horizontal*horizontal)));
    }
    if(lower>0){hips.getWorldPosition(position);position.y-=Math.min(lower,.15*scale);hips.position.copy(hips.parent.worldToLocal(position));hips.updateWorldMatrix(true,true);}
    for(let i=0;i<legs.length;i++){
      const leg=legs[i],{target,normal,orientation}=targets[i],hip=leg.thigh.getWorldPosition(new THREE.Vector3());
      axis.copy(target).sub(hip);const d=THREE.MathUtils.clamp(axis.length(),.01,leg.l1+leg.l2-.00001);axis.normalize();
      bend.copy(front).addScaledVector(axis,-front.dot(axis)).normalize();
      const along=(leg.l1**2-leg.l2**2+d*d)/(2*d),knee=hip.clone().addScaledVector(axis,along).addScaledVector(bend,Math.sqrt(Math.max(0,leg.l1**2-along*along)));
      orient(leg.thigh,leg.shin,knee);orient(leg.shin,leg.foot,target);
      const world=new THREE.Quaternion().setFromUnitVectors(up,normal).multiply(orientation);
      leg.foot.quaternion.copy(leg.foot.parent.getWorldQuaternion(quaternion).invert().multiply(world));leg.foot.updateWorldMatrix(true,true);
    }
  };
}
