import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {blenderModels} from './blender-manifest.js';
import {createResidentGrounding} from './resident-grounding.js';
import {createResidentLocomotion} from './resident-locomotion.js';
import {createPlantedFootGrounding} from './resident-foot-plant.js';
import {prepareResidentGeometry,disposeResidentGeometry} from './resident-geometry.js';

const cache=new Map();
const loader=new GLTFLoader();
export function loadBlenderAsset(id) {
  if(!blenderModels[id])return Promise.reject(new Error(`Unknown local Blender asset: ${id}`));
  if(!cache.has(id)) {
    const promise=loader.loadAsync(blenderModels[id].src).then(gltf=>{
      gltf.scene.traverse(o=>{if(o.isMesh){o.userData.blenderShared=true;o.castShadow=false;o.receiveShadow=true;}});
      return gltf;
    }).catch(error=>{cache.delete(id);throw error;});
    cache.set(id,promise);
  }
  return cache.get(id);
}

// The caller owns the placeholder. A failed load leaves a usable local object.
export function attachBlenderObject(root,id,onReady=()=>{},load=loadBlenderAsset) {
  let disposed=false;
  const ready=load(id).then(gltf=>{
    if(disposed)return false;
    const instance=clone(gltf.scene);instance.traverse(o=>{if(o.isMesh){o.userData.objectId=id;o.userData.blenderShared=true;o.castShadow=true;}});
    const geometry=new Set(),materials=new Set();
    for(const old of [...root.children]){old.traverse(o=>{if(o.isMesh){geometry.add(o.geometry);for(const m of [].concat(o.material))materials.add(m);}});root.remove(old);}
    for(const g of geometry)g.dispose();for(const m of materials)m.dispose();
    root.add(instance);root.userData.modelSource='blender';onReady();return true;
  }).catch(error=>{console.warn(`Local model unavailable: ${id}`,error.message);return false;});
  return {ready,dispose(){disposed=true;}};
}

export const residentEligible=actor=>(actor.scale??1)>=.5;
export const residentModelFor=actor=>actor.visualAppearance?.modelId??actor.modelId??(actor.id==='water-carrier'?'resident-carrier':(actor.scale??1)<.9?'resident-child':['stone-worker','street-vendor'].includes(actor.id)?'resident-worker':'resident');

// A resident's identity belongs to the actor, never to its distance, POI or
// animation budget. Keep the original authored clothes, accessories and colours.
function residentVisualAppearance(actor,index) {
  return actor.visualAppearance??=Object.freeze({modelId:residentModelFor(actor),tone:[.91,1,.96,1.06][index%4],tunicHue:(index%3-1)*.025,tunicLightness:(index%4-1.5)*.018});
}
export function selectDetailedResidents(actors,camera,previous=new Set(),limit=8) {
  if(!camera)return [];
  return actors.filter(a=>residentEligible(a)&&a.state.visible!==false).map((a,index)=>{
    const p=a.state.position,d=Math.hypot(p[0]-camera[0],p[1]+.9-camera[1],p[2]-camera[2]);
    return {a,index,d,rank:d-(previous.has(a)?3:0)-(a.state.talking?20:0)};
  }).filter(a=>a.d<(previous.has(a)?25:22)).sort((a,b)=>a.rank-b.rank||a.index-b.index).slice(0,limit).map(e=>e.a);
}

export function residentAction(state) {
  if(state.talking||state.socialTalking)return 'Talk';
  if(state.stride>.12)return 'Walk';
  if(state.idleAction==='Interact')return 'Interact';
  return state.idleAction==='LookAround'?'LookAround':'Idle';
}

export function createResidentInstance(gltf,actor,index=0,{groundAt=()=>actor.state.position[1],motionVersion=null,metrics={},distantGeometry=new Map()}={}) {
  const appearance=residentVisualAppearance(actor,index);
  const definition={...blenderModels[residentModelFor(actor)],...metrics};
  const natural=(motionVersion??definition.motionVersion)===2&&gltf.animations.some(c=>c.name==='StartWalk');
  const root=clone(gltf.scene),materials=new Set(),mixer=new THREE.AnimationMixer(root);
  root.userData.motionVersion=natural?2:1;
  root.userData.appearance=appearance;
  const actions=new Map(gltf.animations.map(clip=>{const a=mixer.clipAction(clip);a.play();a.paused=true;a.setEffectiveWeight(0);return [clip.name,a];}));
  const weights=new Map([...actions.keys()].map(n=>[n,n==='Idle'?1:0]));
  const surfaces=[];
  root.traverse(o=>{
    if(!o.isMesh)return;
    surfaces.push({mesh:o,near:o.geometry,distant:distantGeometry.get(o.geometry)||o.geometry});
    o.userData.people=true;o.userData.actorId=actor.id||null;o.userData.blenderShared=true;
    o.frustumCulled=false; // Skinned bounds must not use the rest-pose box after a gesture.
    if(o.isSkinnedMesh){
      o.geometry.computeBoundingBox();o.boundingBox=o.geometry.boundingBox.clone().expandByScalar(.35);
      o.boundingSphere=o.boundingBox.getBoundingSphere(new THREE.Sphere());
    }
    const source=o.material;
    if(['tunic','mantle','skin'].includes(source.name)||source.name.endsWith('-cloth')) {
      o.material=source.clone();materials.add(o.material);
      o.material.color.multiplyScalar(appearance.tone);
      if(source.name==='tunic')o.material.color.offsetHSL(appearance.tunicHue,0,appearance.tunicLightness);
    }
  });
  root.scale.setScalar((actor.scale??1)*1.70/definition.height);
  const groundFeet=natural?createPlantedFootGrounding(root,groundAt):null;
  const groundDistantFeet=createResidentGrounding(root,groundAt,{ankleHeight:definition.ankleHeight??.105,liftHeight:definition.liftHeight??.075}),lastPosition=[...actor.state.position];
  const locomotion=natural?createResidentLocomotion(actor,{cycleDistance:definition.cycleDistance??.9,cycleSeconds:1.2,scale:root.scale.x}):null;
  if(natural)for(const name of ['StartWalk','StopWalk','TurnLeft','TurnRight']){const a=actions.get(name);if(a){a.setLoop(THREE.LoopOnce,1);a.clampWhenFinished=true;}}
  const bones=[];root.traverse(o=>{if(o.isBone)bones.push({bone:o,position:o.position.clone(),quaternion:o.quaternion.clone(),scale:o.scale.clone()});});
  let first=true,gaitTime=actor.state.time%1,poseElapsed=(index*.037)%(.1),previousDetail=null,previousTarget=null;
  return {root,actions,mixer,
    update(dt=0,{detailed=true,poseInterval=0,culled=false}={}){
      const state=actor.state,motion=locomotion?.update(dt),target=motion?.clip||residentAction(state);
      root.position.fromArray(state.position);root.rotation.y=state.yaw;root.visible=!culled&&state.visible!==false;
      if(detailed!==previousDetail)for(const surface of surfaces)surface.mesh.geometry=detailed?surface.near:surface.distant;
      if(!first&&dt>0)gaitTime+=Math.hypot(state.position[0]-lastPosition[0],state.position[2]-lastPosition[2])/((definition.cycleDistance??.8)*root.scale.x);
      lastPosition.splice(0,3,...state.position);
      poseElapsed+=Math.max(0,dt);
      if(culled)return;
      // Distant residents still follow their real controller every frame. Only
      // skeleton sampling is staggered; there is no second wardrobe or model.
      if(!first&&dt>0&&detailed===previousDetail&&target===previousTarget&&poseElapsed<poseInterval)return;
      const poseDt=Math.max(0,poseElapsed),blend=first?1:1-Math.exp(-poseDt*7);
      poseElapsed=detailed||!poseInterval?0:first?-((index*.037)%.05):Math.max(0,poseElapsed%poseInterval);previousDetail=detailed;previousTarget=target;
      for(const [name,action] of actions){
        const weight=weights.get(name)+((name===target?1:0)-weights.get(name))*blend;weights.set(name,weight);
        const duration=action.getClip().duration,clock=motion&&name===motion.clip?motion.time:name==='Walk'?gaitTime*duration:state.time;
        action.setEffectiveWeight(weight);action.time=natural&&['StartWalk','StopWalk','TurnLeft','TurnRight'].includes(name)?Math.min(duration-.000001,Math.max(0,clock)):(clock%duration+duration)%duration;
      }
      // Restore the pre-IK pose: AnimationMixer may skip unchanged properties.
      for(const p of bones){p.bone.position.copy(p.position);p.bone.quaternion.copy(p.quaternion);p.bone.scale.copy(p.scale);}
      mixer.update(0);
      for(const p of bones){p.position.copy(p.bone.position);p.quaternion.copy(p.bone.quaternion);p.scale.copy(p.bone.scale);}
      if(natural){root.userData.locomotion=target;root.userData.gaitPhase=motion.phase;}
      if(natural&&detailed)groundFeet({position:state.position,clip:target,time:motion.time,phase:motion.phase,dt:poseDt,reset:first||root.userData.detailLevel!=='near'});
      else groundDistantFeet({position:state.position,phase:motion?.phase??gaitTime%1,walkWeight:weights.get('Walk')||0});
      root.userData.detailLevel=detailed?'near':'distant';first=false;
    },
    dispose(){mixer.stopAllAction();mixer.uncacheRoot(root);root.removeFromParent();const skeletons=new Set();root.traverse(o=>{if(o.isSkinnedMesh)skeletons.add(o.skeleton);});for(const s of skeletons)s.dispose();for(const m of materials)m.dispose();},
  };
}

// Each instance samples its existing NPC clock. This renderer never picks POIs,
// starts behaviour timers or modifies movement, collision, dialogue or progression.
export function mountBlenderResidents(scene,actors,onReady=()=>{},{assetLoader=loadBlenderAsset,groundAt}={}) {
  let disposed=false;const templates=new Map(),visible=new Map(),instances=new Map(),geometry=new Map();
  const residents=actors.filter(residentEligible);
  // Hide the old generic bodies while the actual character loads. Otherwise a
  // woman, priest or carrier first appears wearing an unrelated generic robe.
  for(const actor of residents){residentVisualAppearance(actor,actors.indexOf(actor));actor.blenderVisual=true;}
  const ready=Promise.all([...new Set(actors.filter(residentEligible).map(residentModelFor))].map(async id=>{
    try{const gltf=await assetLoader(id);if(disposed)return false;
      try{const lod=await prepareResidentGeometry(gltf);if(disposed)return false;geometry.set(id,lod);}
      catch(error){console.warn('Resident geometry optimisation unavailable: '+id,error.message);}
      if(disposed)return false;
      templates.set(id,gltf);onReady();return true;}
    catch(error){if(!disposed){for(const actor of residents)if(residentModelFor(actor)===id)actor.blenderVisual=false;onReady();}console.warn('Resident detail unavailable: '+id,error.message);return false;}
  })).then(results=>results.every(Boolean));
  return {ready,visible,instances,
    update(camera,dt){
      if(!templates.size||disposed)return;
      const selected=new Set(selectDetailedResidents(actors,camera,new Set(visible.keys())).filter(actor=>templates.has(residentModelFor(actor))));
      visible.clear();
      for(const actor of residents){
        const id=residentModelFor(actor);if(!templates.has(id))continue;
        const p=actor.state.position,d=camera?Math.hypot(p[0]-camera[0],p[1]+.9-camera[1],p[2]-camera[2]):Infinity;
        // Beyond useful viewing distance, cull the SAME instance rather than
        // restoring a differently dressed primitive. Re-entry reuses its rig.
        if(actor.state.visible===false||d>90){instances.get(actor)?.update(dt,{detailed:false,culled:true});continue;}
        if(!instances.has(actor)){const instance=createResidentInstance(templates.get(id),actor,actors.indexOf(actor),{groundAt,distantGeometry:geometry.get(id)});instance.root.userData.modelId=id;instances.set(actor,instance);scene.add(instance.root);}
        const instance=instances.get(actor),detailed=selected.has(actor);
        if(detailed)visible.set(actor,instance);
        instance.update(dt,{detailed,poseInterval:detailed?0:d<25?.05:.1});
      }
    },
    dispose(){disposed=true;for(const actor of residents)actor.blenderVisual=false;for(const instance of instances.values())instance.dispose();instances.clear();visible.clear();},
  };
}

export async function disposeBlenderAssets() {
  const loaded=await Promise.allSettled([...cache.values()]);cache.clear();
  await Promise.allSettled(loaded.filter(r=>r.status==='fulfilled').map(r=>disposeResidentGeometry(r.value)));
  const geometry=new Set(),materials=new Set(),textures=new Set();
  for(const result of loaded)if(result.status==='fulfilled')result.value.scene.traverse(o=>{if(o.isMesh){geometry.add(o.geometry);for(const m of [].concat(o.material)){materials.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value);}}});
  for(const g of geometry)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();
}
