import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from 'three';
import {geometryLoader} from './helpers/load-gltf-geometry.js';
import {blenderModels} from '../src/blender-manifest.js';
import {createResidentInstance,mountBlenderResidents,selectDetailedResidents} from '../src/blender-assets.js';
import {prepareResidentGeometry,disposeResidentGeometry} from '../src/resident-geometry.js';
import {createHistoricalScene} from '../src/historical-scenes.js';

const cache=new Map();
function asset(id){if(!cache.has(id))cache.set(id,(async()=>{const b=await readFile(new URL('../public/'+blenderModels[id].src,import.meta.url));return geometryLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');})());return cache.get(id);}
const actor=(id,x=0)=>({id,modelId:'resident',scale:1,state:{position:[x,0,0],yaw:0,time:.23,stride:0,walkDistance:0,visible:true,idleAction:'Idle'}});
function wardrobe(root){const result=[];root.traverse(m=>{if(m.isMesh)result.push([m.name,m.material.uuid,m.material.name,m.material.color.toArray()]);});return result;}

test('all 28 real character exports retain their original cloth/prop surfaces and skin/colour buffers in the cheaper geometry',async()=>{
 let count=0;
 for(const [id,definition] of Object.entries(blenderModels))if(definition.type==='character'&&definition.motionVersion===2){
  const gltf=await asset(id),lod=await prepareResidentGeometry(gltf);let near=0,distant=0;
  gltf.scene.traverse(mesh=>{if(!mesh.isMesh)return;const original=mesh.geometry,reduced=lod.get(original)||original;near+=original.index.count;distant+=reduced.index.count;
   for(const name of ['position','color','normal','skinIndex','skinWeight'])assert.equal(reduced.attributes[name],original.attributes[name],id+' keeps original '+name);
   assert.equal(reduced.index.count%3,0);assert.ok(reduced.index.count>0);for(const i of reduced.index.array)assert.ok(i>=0&&i<original.attributes.position.count);
   if(reduced!==original)assert.ok(reduced.userData.residentLODError<=.003001);
  });
  assert.ok(distant<near*.55,id+' distant triangle budget');count++;
 }
 assert.equal(count,28);
});

test('repeated distance, crowd-budget and conversation changes never swap a resident wardrobe or rig',async()=>{
 const people=Array.from({length:10},(_,i)=>actor('person-'+i,i)),scene=new THREE.Scene(),details=mountBlenderResidents(scene,people,()=>{},{assetLoader:asset});
 await details.ready;details.update([0,1.6,1],0);
 const target=people[9],instance=details.instances.get(target),appearance=target.visualAppearance,outfit=wardrobe(instance.root),head=instance.root.getObjectByName('head');
 assert.ok(instance);assert.equal(instance.root.userData.detailLevel,'distant');
 for(let i=0;i<6;i++){
  target.state.talking=true;details.update([0,1.6,1],0);assert.equal(details.visible.get(target),instance);assert.equal(instance.root.userData.detailLevel,'near');
  assert.equal(instance.root.getObjectByName('head'),head);assert.deepEqual(wardrobe(instance.root),outfit);assert.equal(target.visualAppearance,appearance);
  target.state.talking=false;details.update([200,1.6,200],0);assert.equal(instance.root.visible,false);assert.equal(target.blenderVisual,true);
  details.update([0,1.6,1],0);assert.equal(details.instances.get(target),instance);assert.equal(instance.root.userData.detailLevel,'distant');assert.deepEqual(wardrobe(instance.root),outfit);
  assert.ok(details.visible.size<=8);assert.equal(details.instances.size,people.length);
 }
 const ray=new THREE.Raycaster(new THREE.Vector3(9,1.2,3),new THREE.Vector3(0,0,-1));scene.updateMatrixWorld(true);
 assert.ok(ray.intersectObject(instance.root,true).some(h=>h.object.userData.actorId===target.id),'distant real body remains clickable');
 let released=0;instance.root.traverse(m=>{if(m.isMesh&&m.material.name==='tunic')m.material.addEventListener('dispose',()=>released++);});
 details.dispose();assert.equal(released,1);assert.equal(scene.children.length,0);assert.equal(details.instances.size,0);assert.ok(people.every(a=>a.blenderVisual===false));
});

test('detail-budget hysteresis resists distance jitter but admits a much closer newcomer',()=>{
 const people=Array.from({length:8},(_,i)=>actor('existing-'+i,3+i)),newcomer=actor('newcomer',10.01),previous=new Set(people);
 for(const x of [-.1,0,.1])assert.deepEqual(new Set(selectDetailedResidents([...people,newcomer],[x,1.6,0],previous)),previous);
 newcomer.state.position[0]=.1;assert.ok(selectDetailedResidents([...people,newcomer],[0,1.6,0],previous).includes(newcomer));
});

test('distant skeleton sampling keeps each real position current and preserves paused gait/clothes on promotion',async()=>{
 const gltf=await asset('resident'),a=actor('walker'),lod=await prepareResidentGeometry(gltf);a.state.stride=1;
 const instance=createResidentInstance(gltf,a,3,{distantGeometry:lod});instance.update(0,{detailed:false,poseInterval:.05});
 const outfit=wardrobe(instance.root);let previous=instance.root.getObjectByName('thighL').quaternion.clone(),changes=0;
 for(let i=0;i<60;i++){
  a.state.position[2]+=.012;a.state.walkDistance+=.012;a.state.time+=1/60;instance.update(1/60,{detailed:false,poseInterval:.05});
  assert.deepEqual(instance.root.position.toArray(),a.state.position);const q=instance.root.getObjectByName('thighL').quaternion;if(q.angleTo(previous)>1e-5)changes++;previous.copy(q);
 }
 assert.ok(changes>=15&&changes<=22,'20 Hz rather than 60 full pose evaluations: '+changes);
 const phase=a.visualMotion.phase,time=a.state.time;instance.update(0,{detailed:true});assert.equal(a.visualMotion.phase,phase);assert.equal(a.state.time,time);assert.deepEqual(wardrobe(instance.root),outfit);instance.dispose();
});

test('loading never displays the old generic outfit; failures restore a usable fallback and disposed loads stay silent',async()=>{
 let finish,callbacks=0;const a=actor('pending'),details=mountBlenderResidents(new THREE.Scene(),[a],()=>callbacks++,{assetLoader:()=>new Promise(resolve=>finish=resolve)});
 assert.equal(a.blenderVisual,true);details.dispose();finish(await asset('resident'));assert.equal(await details.ready,false);assert.equal(a.blenderVisual,false);assert.equal(callbacks,0);assert.equal(details.instances.size,0);
 const warn=console.warn;console.warn=()=>{};
 try{const b=actor('offline'),fallback=mountBlenderResidents(new THREE.Scene(),[b],()=>{},{assetLoader:async()=>{throw new Error('offline');}});assert.equal(await fallback.ready,false);assert.equal(b.blenderVisual,false);fallback.dispose();}finally{console.warn=warn;}
});

test('actual Jerusalem primitive bodies stay hidden after real models leave the near-detail budget',async()=>{
 const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});globalThis.document={createElement:()=>({getContext:()=>ctx})};
 const city=createHistoricalScene('jerusalem',null,{blenderAssets:true,assetLoader:asset});await city.detailedResidents.ready;
 const target=city.people.find(a=>a.id==='water-carrier'),p=target.state.position;
 for(const camera of [[p[0],p[1]+1.6,p[2]+3],[p[0]+40,p[1]+1.6,p[2]],[300,100,300]]){
  city.pose(0,camera);assert.equal(target.blenderVisual,true);
  for(const part of target.parts)if(part.bone!=='ground'){const matrix=new THREE.Matrix4();part.mesh.getMatrixAt(part.index,matrix);assert.ok(Math.abs(matrix.determinant())<1e-10,'generic clothing remains hidden');}
 }
 city.dispose();
});

test('shared distant geometry is released separately without disposing the original GLB buffers',async()=>{
 const source=await asset('resident-child'),lod=await prepareResidentGeometry(source);let reducedDisposed=0,originalDisposed=0;
 for(const [original,reduced] of lod){original.addEventListener('dispose',()=>originalDisposed++);reduced.addEventListener('dispose',()=>reducedDisposed++);}
 await disposeResidentGeometry(source);assert.equal(reducedDisposed,lod.size);assert.equal(originalDisposed,0);
});
