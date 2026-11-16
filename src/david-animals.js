import * as THREE from 'three';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {loadBlenderAsset} from './blender-assets.js';
import {createWalkModel} from './walk-model.js';
import {createNPCSystem} from './npc-system.js';
// A separate, level grazing shelf keeps the four-hoof gait in ground contact.
// Animal numbers, coat and breed are original scene choices, not biblical counts.
export function createDavidFlock(scene,{blenderAssets=false,assetLoader=loadBlenderAsset,onReady=()=>{}}={}){
 const ground=1.1,actors=Array.from({length:7},(_,i)=>({id:'david-flock-'+i,role:'flock',collisionRadius:.62,scale:1,state:{position:[-33+(i%3)*4,ground,-6+Math.floor(i/3)*7],yaw:i*.73,time:0,stride:0,visible:true}}));
 const model=createWalkModel([],[{id:'grazing-shelf',x1:-36,x2:-19,z1:-10,z2:14}],()=>ground,{proxies:[],navigationStep:.6});
 const pois=[['water','Idle',[-33,-7],[-31,-7]],['graze-west','Interact',[-33,4],[-31,4]],['graze-east','Interact',[-23,-5],[-21,-5]],['rest','Idle',[-25,11],[-23,11]],['look','LookAround',[-27,1],[-25,1]]].map(([id,action,...slots])=>({id:'flock-'+id,action,tags:['flock'],weight:action==='Interact'?2:1,capacity:slots.length,slots:slots.map(([x,z])=>[x,ground,z]),lookAt:[-28,2],dwell:action==='Interact'?[5,13]:[3,9]}));
 const system=createNPCSystem({actors,model,pois,seed:161326,spawnExclusion:null,spawnCandidates:actors.map(a=>a.state.position),allowRetreat:true,socialProbability:0});for(const a of system.agents)a.speed=.28*a.speedFactor;
 let disposed=false;const animals=actors.map(actor=>{
  const root=new THREE.Group(),body=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),new THREE.MeshStandardMaterial({color:'#c1bb9e',roughness:1}));body.scale.set(.22,.32,.5);body.position.y=.68;root.add(body);for(const x of [-.16,.16])for(const z of [-.32,.32]){const leg=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.42,6),body.material);leg.position.set(x,.21,z);root.add(leg);}scene.add(root);return {actor,root,mixer:null,actions:new Map(),last:[...actor.state.position],gait:actor.state.time%1.2};
 });
 const ready=blenderAssets?assetLoader('david-flock-sheep').then(gltf=>{
  if(disposed)return false;for(const a of animals){for(const child of [...a.root.children]){child.traverse(o=>{if(o.geometry)o.geometry.dispose();});a.root.remove(child);}const visual=clone(gltf.scene);visual.traverse(o=>{if(o.isMesh){o.userData.blenderShared=true;o.frustumCulled=false;o.castShadow=true;o.receiveShadow=true;}});a.root.add(visual);a.mixer=new THREE.AnimationMixer(visual);for(const clip of gltf.animations){const action=a.mixer.clipAction(clip);action.play();action.paused=true;action.setEffectiveWeight(0);a.actions.set(clip.name,action);}a.root.userData.modelSource='blender';}onReady();return true;
 }).catch(error=>{console.warn('Local flock detail unavailable: '+error.message);return false;}):Promise.resolve(false);
 return {animals,system,ready,update(dt){
  system.update(dt);for(const a of animals){const state=a.actor.state,distance=Math.hypot(state.position[0]-a.last[0],state.position[2]-a.last[2]);a.gait+=distance/.24*1.2;a.last=[...state.position];a.root.position.fromArray(state.position);a.root.rotation.y=state.yaw;const walking=Math.min(1,state.stride),grazing=state.idleAction==='Interact'?1-walking:0;for(const [name,action] of a.actions){action.time=(name==='Walk'?a.gait:state.time)%action.getClip().duration;action.setEffectiveWeight(name==='Walk'?walking:name==='Graze'?grazing:1-walking-grazing);}a.mixer?.update(0);}
 },dispose(){disposed=true;system.dispose();for(const a of animals){a.mixer?.stopAllAction();a.mixer?.uncacheRoot(a.mixer.getRoot());a.root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.dispose();if(o.geometry&&!o.userData.blenderShared)o.geometry.dispose();});a.root.removeFromParent();}}};
}
