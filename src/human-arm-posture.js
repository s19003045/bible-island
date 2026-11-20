import * as THREE from 'three';

const clamp=THREE.MathUtils.clamp;
const v=()=>new THREE.Vector3(),q=()=>new THREE.Quaternion();

// The life rigs already contain anatomically authored hands and contact IK.
// Older era-specific rigs keep their own bodies/clothes. Adapt their FREE arms
// using measured bone directions, rather than swapping everyone to an adult rig.
export function createArmPosture(root,definition){
  if(definition.motionVersion!==3)return null;
  const locked=new Set(definition.motionProfile==='bearer'?['R']:definition.motionProfile==='carrier'?['R']:[]);
  root.updateWorldMatrix(true,true);
  const chains=['L','R'].filter(side=>!locked.has(side)).map(side=>{
    const arm=root.getObjectByName('arm'+side),forearm=root.getObjectByName('forearm'+side),hand=root.getObjectByName('hand'+side);
    if(!arm||!forearm||!hand)return null;
    const inverse=hand.getWorldQuaternion(q()).invert();
    const fingers=[];
    hand.traverse(b=>{if(!/^finger[LR]\d[AB]$/.test(b.name))return;
      // Local +Y follows each exported finger bone. Curl toward the original
      // palm (+Z in model space); mirrored hands must not curl on a guessed X.
      const palm=v().set(0,0,1).applyQuaternion(root.getWorldQuaternion(q())).applyQuaternion(b.getWorldQuaternion(q()).invert());
      const digit=Number(b.name.at(-2)),towardPinky=side==='L'?3-digit:digit;
      fingers.push({bone:b,rest:b.quaternion.clone(),axis:v().set(0,1,0).cross(palm).normalize(),angle:(b.name.endsWith('A')?14:28)+towardPinky*2});
    });
    return {side,arm,forearm,hand,fingers,palmLocal:v().set(0,0,1).applyQuaternion(root.getWorldQuaternion(q())).applyQuaternion(inverse),last:new Map()};
  }).filter(Boolean);
  let gesture=0;
  function aim(bone,child,direction){
    const from=child.getWorldPosition(v()).sub(bone.getWorldPosition(v())).normalize();
    const world=q().setFromUnitVectors(from,direction).multiply(bone.getWorldQuaternion(q()));
    bone.quaternion.copy(bone.parent.getWorldQuaternion(q()).invert().multiply(world));bone.updateWorldMatrix(false,true);
  }
  return (dt,motion)=>{
    const wantsGesture=['Talk','Interact'].includes(motion.clip)?1:0;
    gesture+=(wantsGesture-gesture)*(1-Math.exp(-10*Math.max(0,dt)));
    const worldQ=root.getWorldQuaternion(q()),inverse=worldQ.clone().invert(),diagnostics=[];
    for(const c of chains){
      const sign=c.side==='L'?-1:1;
      const upper=c.forearm.getWorldPosition(v()).sub(c.arm.getWorldPosition(v())).normalize().applyQuaternion(inverse);
      const lower=c.hand.getWorldPosition(v()).sub(c.forearm.getWorldPosition(v())).normalize().applyQuaternion(inverse);
      // Preserve the captured forward/back swing; remove the wide, raised elbow
      // stance. Long sleeves and children use their actual bone lengths.
      const swing=clamp(upper.z,-.32,.32);
      const relaxedUpper=v().set(sign*clamp(Math.abs(upper.x),.12,.23),-1,swing).normalize();
      const relaxedLower=v().set(sign*.035,-1,clamp(lower.z,-.23,.38)+.10).normalize();
      aim(c.arm,c.forearm,relaxedUpper.lerp(upper,gesture).normalize().applyQuaternion(worldQ));
      aim(c.forearm,c.hand,relaxedLower.lerp(lower,gesture).normalize().applyQuaternion(worldQ));
      // Keep the palm pointing along the forearm, with the palm facing the thigh
      // at rest. A speaking gesture may open it partially toward the listener.
      const down=c.hand.getWorldPosition(v()).sub(c.forearm.getWorldPosition(v())).normalize();
      const palm=v().set(-sign,0,.55*gesture).normalize().applyQuaternion(worldQ);
      palm.addScaledVector(down,-palm.dot(down)).normalize();
      const z=palm.clone().negate(),x=down.clone().cross(z).normalize();z.crossVectors(x,down).normalize();
      const handWorld=q().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x,down,z));
      c.hand.quaternion.copy(c.hand.parent.getWorldQuaternion(q()).invert().multiply(handWorld));
      // Spread the axial twist through the forearm instead of a single sharply
      // twisted wrist. Rotation around the forearm leaves wrist position intact.
      const foreWorld=c.forearm.getWorldQuaternion(q()),relative=foreWorld.clone().invert().multiply(handWorld);
      const twist=q().set(0,relative.y,0,relative.w).normalize();
      c.forearm.quaternion.multiply(q().slerp(twist,.65));c.forearm.updateWorldMatrix(false,true);
      c.hand.quaternion.copy(c.hand.parent.getWorldQuaternion(q()).invert().multiply(handWorld));
      for(const {bone,rest,axis,angle} of c.fingers)bone.quaternion.copy(rest).multiply(q().setFromAxisAngle(axis,THREE.MathUtils.degToRad(angle)*(1-.35*gesture)));
      // Smooth corrections in local joint space; root turns remain immediate and
      // authoritative. This state belongs to this instance, never a shared clock.
      for(const b of [c.arm,c.forearm,c.hand]){const last=c.last.get(b);if(last&&dt>0)b.quaternion.copy(last.slerp(b.quaternion,1-Math.exp(-18*dt)));else c.last.set(b,b.quaternion.clone());}
      root.updateWorldMatrix(true,true);
      diagnostics.push({side:c.side,palm:c.palmLocal.clone().applyQuaternion(c.hand.getWorldQuaternion(q())).toArray()});
    }
    root.userData.armPosture={version:1,freeSides:chains.map(c=>c.side),protectedSides:[...locked],hands:diagnostics};
  };
}
