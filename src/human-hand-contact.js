import * as THREE from 'three';

const vector=()=>new THREE.Vector3(),quaternion=()=>new THREE.Quaternion();
function orient(bone,child,target){
  const origin=bone.getWorldPosition(vector());
  const from=child.getWorldPosition(vector()).sub(origin).normalize(),to=target.clone().sub(origin).normalize();
  const world=quaternion().setFromUnitVectors(from,to).multiply(bone.getWorldQuaternion(quaternion()));
  bone.quaternion.copy(bone.parent.getWorldQuaternion(quaternion()).invert().multiply(world));
  bone.updateWorldMatrix(true,true);
}

// Run AFTER foot grounding. Only the arm chain changes: a grounded jug stays on
// its authored plane and the collision root never participates in this solve.
// The socket orientation is authored with the actual curved palm and handle;
// positional contact alone is not sufficient evidence of a plausible wrist.
export function solveHandContact(root,{side,handSocket,targetSocket,rotationOffset=[0,0,0,1],handRotation=null,weight=1}){
  const arm=root.getObjectByName('arm'+side),forearm=root.getObjectByName('forearm'+side),hand=root.getObjectByName('hand'+side);
  const grip=root.getObjectByName(handSocket),target=root.getObjectByName(targetSocket);
  if(!arm||!forearm||!hand||!grip||!target)return null;
  root.updateWorldMatrix(true,true);
  const originals=[arm,forearm,hand].map(b=>b.quaternion.clone());
  const shoulder=arm.getWorldPosition(vector()),elbow=forearm.getWorldPosition(vector()),wrist=hand.getWorldPosition(vector());
  const l1=shoulder.distanceTo(elbow),l2=elbow.distanceTo(wrist);
  if(l1<1e-6||l2<1e-6)return null;
  const gripLocal=hand.worldToLocal(grip.getWorldPosition(vector()));
  const gripRotation=hand.getWorldQuaternion(quaternion()).invert().multiply(grip.getWorldQuaternion(quaternion()));
  const desiredRotation=target.getWorldQuaternion(quaternion());
  if(handRotation)desiredRotation.multiply(quaternion().fromArray(handRotation));
  else desiredRotation.multiply(quaternion().fromArray(rotationOffset)).multiply(gripRotation.invert());
  const desiredWrist=target.getWorldPosition(vector()).sub(gripLocal.multiply(hand.getWorldScale(vector())).applyQuaternion(desiredRotation));
  const axis=desiredWrist.clone().sub(shoulder),distance=axis.length();
  if(distance<1e-6)return null;
  axis.normalize();
  // Keep the authored elbow's bend plane. This preserves a comfortable outward
  // elbow rather than flipping sides or pulling a locked arm through the torso.
  let bend=elbow.clone().sub(shoulder);bend.addScaledVector(axis,-bend.dot(axis));
  if(bend.lengthSq()<1e-8){bend.set(side==='L'?1:-1,0,0).applyQuaternion(root.getWorldQuaternion(quaternion()));bend.addScaledVector(axis,-bend.dot(axis));}
  if(bend.lengthSq()<1e-8){bend.set(0,0,1);bend.addScaledVector(axis,-bend.dot(axis));}
  bend.normalize();
  const reach=THREE.MathUtils.clamp(distance,Math.abs(l1-l2)+1e-5,(l1+l2)*.995);
  const along=(l1*l1-l2*l2+reach*reach)/(2*reach);
  const desiredElbow=shoulder.clone().addScaledVector(axis,along).addScaledVector(bend,Math.sqrt(Math.max(0,l1*l1-along*along)));
  const reachableWrist=shoulder.clone().addScaledVector(axis,reach);
  orient(arm,forearm,desiredElbow);orient(forearm,hand,reachableWrist);
  hand.quaternion.copy(hand.parent.getWorldQuaternion(quaternion()).invert().multiply(desiredRotation));
  for(const [i,b] of [arm,forearm,hand].entries())b.quaternion.copy(originals[i].slerp(b.quaternion,THREE.MathUtils.clamp(weight,0,1)));
  root.updateWorldMatrix(true,true);
  const finalWrist=hand.getWorldPosition(vector()),forearmDirection=finalWrist.clone().sub(forearm.getWorldPosition(vector())).normalize();
  const palmDirection=grip.getWorldPosition(vector()).sub(finalWrist).normalize();
  return {side,error:grip.getWorldPosition(vector()).distanceTo(target.getWorldPosition(vector())),reachable:Math.abs(reach-distance)<1e-5,
    wristAngle:Math.acos(THREE.MathUtils.clamp(forearmDirection.dot(palmDirection),-1,1)),
    elbowAngle:Math.acos(THREE.MathUtils.clamp((l1*l1+l2*l2-reach*reach)/(2*l1*l2),-1,1))};
}

export function createHandContacts(root,definition){
  return ({clip,time=0})=>{
    const metric=definition.lifeClips?.[clip],duration=metric?.duration;
    const progress=duration?(metric.loop?((time/duration)%1+1)%1:THREE.MathUtils.clamp(time/duration,0,1)):0;
    const results=[];
    for(const contact of definition.handContacts?.[clip]||[]){
      const [start,end]=contact.window??[0,1];if(progress<start||progress>end)continue;
      const fade=contact.fade??0;
      const weight=fade?Math.min(1,(progress-start)/fade,(end-progress)/fade):1;
      const samples=contact.handRotationSamples;
      let handRotation=null;
      if(samples?.length){
        const next=samples.findIndex(([u])=>u>=progress),i=next<0?samples.length-1:Math.max(0,next-1),j=next<0?i:next;
        const t=samples[j][0]===samples[i][0]?0:(progress-samples[i][0])/(samples[j][0]-samples[i][0]);
        handRotation=quaternion().fromArray(samples[i][1]).slerp(quaternion().fromArray(samples[j][1]),t).toArray();
      }
      const result=solveHandContact(root,{...contact,handRotation,weight});if(result)results.push(result);
    }
    root.userData.handContacts=results;return results;
  };
}
