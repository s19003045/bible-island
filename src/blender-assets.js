import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {blenderModels} from './blender-manifest.js';

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

export const residentEligible=actor=>(actor.scale||1)>=.9&&actor.id!=='water-carrier';
export function selectDetailedResidents(actors,camera,previous=new Set(),limit=8) {
  if(!camera)return [];
  return actors.filter(a=>residentEligible(a)&&a.state.visible!==false).map((a,index)=>{
    const p=a.state.position,d=Math.hypot(p[0]-camera[0],p[1]+.9-camera[1],p[2]-camera[2]);
    return {a,index,d,rank:d*(previous.has(a)?.86:1)-(a.state.talking?20:0)};
  }).filter(a=>a.d<(previous.has(a)?25:22)).sort((a,b)=>a.rank-b.rank||a.index-b.index).slice(0,limit).map(e=>e.a);
}

export function residentAction(state) {
  if(state.talking||state.socialTalking)return 'Talk';
  if(state.stride>.12)return 'Walk';
  if(state.idleAction==='Interact')return 'Interact';
  return state.idleAction==='LookAround'?'LookAround':'Idle';
}

export function createResidentInstance(gltf,actor,index=0) {
  const root=clone(gltf.scene),materials=new Set(),mixer=new THREE.AnimationMixer(root);
  const actions=new Map(gltf.animations.map(clip=>{const a=mixer.clipAction(clip);a.play();a.paused=true;a.setEffectiveWeight(0);return [clip.name,a];}));
  const weights=new Map([...actions.keys()].map(n=>[n,n==='Idle'?1:0]));
  const tones=[.91,1,.96,1.06],tone=tones[index%tones.length];
  root.traverse(o=>{
    if(!o.isMesh)return;
    o.userData.people=true;o.userData.actorId=actor.id||null;o.userData.blenderShared=true;
    o.frustumCulled=false; // Skinned bounds must not use the rest-pose box after a gesture.
    if(o.isSkinnedMesh){
      o.geometry.computeBoundingBox();o.boundingBox=o.geometry.boundingBox.clone().expandByScalar(.35);
      o.boundingSphere=o.boundingBox.getBoundingSphere(new THREE.Sphere());
    }
    const source=o.material;
    if(['tunic','mantle','skin'].includes(source.name)) {
      o.material=source.clone();materials.add(o.material);
      o.material.color.multiplyScalar(tone);
      if(source.name==='tunic')o.material.color.offsetHSL((index%3-1)*.025,0,(index%4-1.5)*.018);
    }
  });
  root.scale.setScalar((actor.scale||1)*1.70/blenderModels.resident.height);
  let first=true;
  return {root,actions,mixer,
    update(dt=0){
      const state=actor.state,target=residentAction(state),blend=first?1:1-Math.exp(-Math.max(0,dt)*7);
      for(const [name,action] of actions){
        const weight=weights.get(name)+((name===target?1:0)-weights.get(name))*blend;weights.set(name,weight);
        action.setEffectiveWeight(weight);action.time=(state.time%action.getClip().duration+action.getClip().duration)%action.getClip().duration;
      }
      mixer.update(0);root.position.fromArray(state.position);root.rotation.y=state.yaw;root.visible=state.visible!==false;first=false;
    },
    dispose(){mixer.stopAllAction();mixer.uncacheRoot(root);root.removeFromParent();for(const m of materials)m.dispose();},
  };
}

// Each instance samples its existing NPC clock. This renderer never picks POIs,
// starts behaviour timers or modifies movement, collision, dialogue or progression.
export function mountBlenderResidents(scene,actors,onReady=()=>{}) {
  let disposed=false,template=null;const visible=new Map();
  const ready=loadBlenderAsset('resident').then(gltf=>{if(!disposed){template=gltf;onReady();}return !disposed;}).catch(error=>{console.warn('Resident detail unavailable',error.message);return false;});
  return {ready,visible,
    update(camera,dt){
      if(!template||disposed)return;
      const selected=new Set(selectDetailedResidents(actors,camera,new Set(visible.keys())));
      for(const [actor,instance] of visible)if(!selected.has(actor)){actor.blenderVisual=false;instance.dispose();visible.delete(actor);}
      for(const actor of selected){
        if(!visible.has(actor)){const instance=createResidentInstance(template,actor,actors.indexOf(actor));visible.set(actor,instance);scene.add(instance.root);}
        actor.blenderVisual=true;visible.get(actor).update(dt);
      }
    },
    dispose(){disposed=true;for(const [actor,instance] of visible){actor.blenderVisual=false;instance.dispose();}visible.clear();},
  };
}

export async function disposeBlenderAssets() {
  const loaded=await Promise.allSettled([...cache.values()]);cache.clear();
  const geometry=new Set(),materials=new Set(),textures=new Set();
  for(const result of loaded)if(result.status==='fulfilled')result.value.scene.traverse(o=>{if(o.isMesh){geometry.add(o.geometry);for(const m of [].concat(o.material)){materials.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value);}}});
  for(const g of geometry)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();
}
