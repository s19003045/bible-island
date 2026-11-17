import * as THREE from 'three';
import {humanProfileFor} from './human-motion-data.js';

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const angle=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
const up=new THREE.Vector3(0,1,0);

// Independent, visual-only attention/blink/secondary-motion clocks. They never
// consume the behaviour PRNG, choose a POI, or move the collision controller.
export function createHumanPerformance(root,actor,definition) {
  const profile=humanProfileFor(actor),bones=[];root.traverse(b=>{if(b.isBone)bones.push(b);});
  let seed=(actor.state.behavior?.seed??Array.from(actor.id||'pilot').reduce((h,c)=>Math.imul(h^c.charCodeAt(0),16777619),2166136261))^0x41c6ce57;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const bone=name=>root.getObjectByName(name),head=bone('head'),neck=bone('neck'),chest=bone('chest')||bone('spineUpper')||bone('spine'),hips=bone('hips');
  const eyes=['L','R'].map(s=>bone('eye'+s)),lids=['L','R'].map(s=>bone('lid'+s));
  const cloth=bones.filter(b=>/^(cloth|hem|overwrap|mantleTail)/i.test(b.name));
  const previous=new Map(),offsets=new Map(),identity=new THREE.Quaternion(),q=new THREE.Quaternion(),parentQ=new THREE.Quaternion();
  let lastClip=null,transitionAge=1,blinkWait=1.5+random()*3,blinkLeft=0,blinkDuration=.18;
  let glanceWait=2+random()*4,glanceLeft=0,glanceTarget=null,shiftWait=5+random()*6,shiftTarget=0,shift=0;
  let eyeYaw=0,eyePitch=0,headYaw=0,headPitch=0,bodyYaw=0,lastYaw=actor.state.yaw,lastSpeed=0,clothAngle=0,clothVelocity=0;
  const yawBone=(b,yaw,pitch=0)=>{
    if(!b)return;b.updateWorldMatrix(true,false);
    const world=b.getWorldQuaternion(new THREE.Quaternion()),right=new THREE.Vector3(Math.cos(actor.state.yaw),0,-Math.sin(actor.state.yaw));
    q.setFromAxisAngle(up,yaw);world.premultiply(q);q.setFromAxisAngle(right,pitch);world.premultiply(q);
    b.quaternion.copy(b.parent.getWorldQuaternion(parentQ).invert().multiply(world));b.updateWorldMatrix(false,true);
  };
  function targetFor(camera,dt) {
    const state=actor.state,agent=state.behavior,p=state.position;
    if((state.talking||agent?.held)&&camera)return {position:camera,label:'交談對象',world:true};
    if(agent?.partner){const other=agent.partner.actor;return {position:[other.state.position[0],other.state.position[1]+1.52*(other.scale||1),other.state.position[2]],label:'身旁居民'};}
    glanceWait-=dt;glanceLeft-=dt;
    if(camera&&Math.hypot(camera[0]-p[0],camera[2]-p[2])<4&&glanceWait<=0){glanceTarget=[...camera];glanceLeft=.65+random()*.65;glanceWait=5+random()*5;}
    if(glanceTarget&&glanceLeft>0)return {position:glanceTarget,label:'短暫注意旅人',world:true};
    const next=agent?.intentTarget||agent?.path?.[0];
    if(agent?.state==='travel'&&next)return {position:[next[0],p[1]+1.52*(actor.scale||1),next[2]],label:'前方路線'};
    if(agent?.poi?.lookAt)return {position:[agent.poi.lookAt[0],p[1]+1.45*(actor.scale||1),agent.poi.lookAt[1]],label:'眼前活動'};
    return {position:[p[0]+Math.sin(state.yaw)*4,p[1]+1.52*(actor.scale||1),p[2]+Math.cos(state.yaw)*4],label:'前方'};
  }
  return {
    apply(dt,motion,{camera=null}={}) {
      const state=actor.state,p=state.position,elapsed=Math.max(0,dt);
      // Preserve the outgoing pose when a clip is interrupted at either foot's
      // phase. The offset decays; continuous movement does not gain extra lag.
      if(lastClip!==motion.clip){
        for(const b of bones){const old=previous.get(b);if(old)offsets.set(b,{q:old.q.clone().multiply(b.quaternion.clone().invert()),p:old.p.clone().sub(b.position)});}
        transitionAge=0;lastClip=motion.clip;
      }
      transitionAge+=elapsed;const remaining=Math.exp(-transitionAge/.085);
      if(remaining>.001)for(const [b,offset] of offsets){b.quaternion.premultiply(q.copy(identity).slerp(offset.q,remaining));b.position.addScaledVector(offset.p,remaining);}
      const target=targetFor(camera,elapsed),headPosition=head?.getWorldPosition(new THREE.Vector3())||new THREE.Vector3(p[0],p[1]+1.5,p[2]);
      const point=new THREE.Vector3(...target.position);if(!target.world)point.add(root.getWorldPosition(new THREE.Vector3()).sub(new THREE.Vector3(...p)));
      const dx=point.x-headPosition.x,dz=point.z-headPosition.z;
      const desiredYaw=clamp(angle(state.yaw,Math.atan2(dx,dz)),-profile.headLimit,profile.headLimit),desiredPitch=clamp(-Math.atan2(point.y-headPosition.y,Math.hypot(dx,dz)),-.22,.22);
      eyeYaw+=(desiredYaw-eyeYaw)*(1-Math.exp(-18*elapsed));headYaw+=(desiredYaw-headYaw)*(1-Math.exp(-7*elapsed));bodyYaw+=(clamp(desiredYaw,-profile.torsoLimit,profile.torsoLimit)-bodyYaw)*(1-Math.exp(-2.5*elapsed));
      eyePitch+=(desiredPitch-eyePitch)*(1-Math.exp(-16*elapsed));headPitch+=(desiredPitch*.55-headPitch)*(1-Math.exp(-6*elapsed));
      yawBone(chest,bodyYaw);yawBone(neck,headYaw*.22,headPitch*.25);yawBone(head,headYaw*.65,headPitch*.75);
      for(const eye of eyes)yawBone(eye,clamp(eyeYaw-headYaw*.87-bodyYaw,-.20,.20),eyePitch-headPitch);
      blinkWait-=elapsed;if(blinkWait<=0&&blinkLeft<=0){blinkDuration=.15+random()*.08;blinkLeft=blinkDuration;blinkWait=2.8+random()*4;}
      const closed=blinkLeft>0?Math.sin(Math.PI*(1-blinkLeft/blinkDuration))**2:0;blinkLeft=Math.max(0,blinkLeft-elapsed);
      for(const lid of lids)if(lid&&closed>0){
        const world=lid.getWorldPosition(new THREE.Vector3());world.y-=closed*.008*(actor.scale||1);lid.position.copy(lid.parent.worldToLocal(world));
      }
      for(const eye of eyes)if(eye&&closed>0&&definition.attention?.eye_close_scale_bone_local){const scale=definition.attention.eye_close_scale_bone_local;eye.scale.multiply(new THREE.Vector3(...scale.map(v=>1+(v-1)*closed)));}
      // A brief posture adjustment while dwelling, without an extra destination.
      shiftWait-=elapsed;if(shiftWait<=0){shiftTarget=(random()-.5)*2;shiftWait=6+random()*9;}
      shift+=(shiftTarget*(motion.speed<.04?1:0)-shift)*(1-Math.exp(-2.4*elapsed));
      if(hips){const world=hips.getWorldPosition(new THREE.Vector3());world.addScaledVector(new THREE.Vector3(Math.cos(state.yaw),0,-Math.sin(state.yaw)),shift*.006*(actor.scale||1));hips.position.copy(hips.parent.worldToLocal(world));}
      const angular=elapsed>0?angle(lastYaw,state.yaw)/elapsed:0,accel=elapsed>0?(motion.speed-lastSpeed)/elapsed:0;
      const desiredCloth=clamp(-angular*.025-accel*.008,-profile.clothResponse,profile.clothResponse);
      let left=Math.min(.25,elapsed);while(left>1e-8){const step=Math.min(left,1/60);clothVelocity+=(60*(desiredCloth-clothAngle)-14*clothVelocity)*step;clothAngle+=clothVelocity*step;left-=step;}
      for(const b of cloth)b.rotation.x+=clothAngle;
      lastYaw=state.yaw;lastSpeed=motion.speed;
      root.userData.humanPerformance={role:actor.motionProfile,attention:target.label,eyeYaw,headYaw,bodyYaw,blink:closed,cloth:clothAngle,strideScale:motion.strideScale,source:definition.motionSource||'CMU adapted motion'};
    },
    remember(){for(const b of bones){let old=previous.get(b);if(!old){old={q:new THREE.Quaternion(),p:new THREE.Vector3()};previous.set(b,old);}old.q.copy(b.quaternion);old.p.copy(b.position);}},
  };
}
