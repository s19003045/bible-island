import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createHistoricalScene} from '../src/historical-scenes.js';
import {setArtifactSeparation} from '../src/artifact-inspection.js';
import {solomonObjects,solomonSpawn} from '../src/solomon-exploration.js';

const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});globalThis.document={createElement:()=>({getContext:()=>ctx})};
async function asset(id){const b=await readFile(new URL('../public/models/'+id+'.glb',import.meta.url));return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');}

test('actual sea geometry has twelve cattle facing in four triplets, a supported bowl and separate bowl/support heights',async()=>{
  const g=(await asset('solomon-sea')).scene;g.updateMatrixWorld(true);
  const bulls=g.children.filter(o=>o.userData.component==='cast-ox'),shell=g.children.find(o=>o.isMesh);assert.equal(bulls.length,12);assert.ok(shell);
  const axes={north:[0,0,-1],south:[0,0,1],east:[1,0,0],west:[-1,0,0]};
  for(const [name,axis] of Object.entries(axes)){
    const triplet=bulls.filter(o=>o.userData.cardinal===name);assert.equal(triplet.length,3);
    for(const ox of triplet){
      const forward=new THREE.Vector3(1,0,0).applyQuaternion(ox.getWorldQuaternion(new THREE.Quaternion()));assert.ok(forward.dot(new THREE.Vector3(...axis))>.9999);
      const position=ox.getWorldPosition(new THREE.Vector3());assert.ok(position.dot(forward)>.24,'hindquarters face toward the centre');
      const point=ox.localToWorld(new THREE.Vector3(.015,.4,0)),meshes=[];ox.traverse(o=>{if(o.isMesh)meshes.push(o);});
      const back=new THREE.Raycaster(point,new THREE.Vector3(0,-1,0)).intersectObjects(meshes,false)[0];assert.ok(back);
      const bottom=new THREE.Raycaster(new THREE.Vector3(point.x,.23,point.z),new THREE.Vector3(0,1,0)).intersectObject(shell,false)[0];assert.ok(bottom);
      assert.ok(Math.abs(back.point.y-bottom.point.y)<.006,'bowl rests on each ox shoulder instead of floating');
    }
  }
  const box=new THREE.Box3().setFromObject(shell);assert.ok(Math.abs(box.max.y-box.min.y-.45)<.001);assert.ok(Math.abs(box.getSize(new THREE.Vector3()).x-.9)<.003);
  const inside=new THREE.Raycaster(new THREE.Vector3(.05,1,0),new THREE.Vector3(0,-1,0)).intersectObject(shell,false)[0];assert.ok(Math.abs(inside.point.y-.265)<.003,'continuous open bowl, not a lid');
});

// Count connected fruit surfaces in the REAL exported mesh, independently of
// report metadata or a declared count. Calyx, shell and network have other bounds.
function connectedFruitCount(mesh){
  const g=mesh.geometry,p=g.attributes.position,parent=Array.from({length:p.count},(_,i)=>i),find=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
  const indices=g.index?.array||Array.from({length:p.count},(_,i)=>i);
  for(let i=0;i<indices.length;i+=3){const a=find(indices[i]);parent[find(indices[i+1])]=a;parent[find(indices[i+2])]=a;}
  const components=new Map(),v=new THREE.Vector3();
  for(let i=0;i<p.count;i++){const root=find(i);if(!components.has(root))components.set(root,new THREE.Box3());v.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);components.get(root).expandByPoint(v);}
  return [...components.values()].filter(box=>{const size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());return Math.abs(size.y-.022)<.0005&&Math.abs(size.x-.016)<.003&&Math.abs(size.z-.016)<.003&&[.315,.425].some(y=>Math.abs(center.y-y)<.001);}).length;
}

test('the exported capital actually contains two hundred fruit bodies',async()=>{
  const g=(await asset('pillar-capital')).scene;g.updateMatrixWorld(true);let count=0;g.traverse(o=>{if(o.isMesh)count+=connectedFruitCount(o);});assert.equal(count,200);
});

test('cedar facing separates from actual masonry without translating the stone body or accumulating offsets',async()=>{
  const root=(await asset('temple-masonry')).scene;root.updateMatrixWorld(true);
  const facing=root.getObjectByName('cedar-facing'),stone=root.children.find(o=>o.isMesh);assert.ok(facing&&stone);
  const before=facing.getWorldPosition(new THREE.Vector3()),stoneBounds=new THREE.Box3().setFromObject(stone);
  assert.ok(setArtifactSeparation(root,'cedar-facing',[0,0,.18]));assert.ok(Math.abs(facing.getWorldPosition(new THREE.Vector3()).z-before.z-.18)<1e-6);
  setArtifactSeparation(root,'cedar-facing',[0,0,.18]);assert.ok(Math.abs(facing.getWorldPosition(new THREE.Vector3()).z-before.z-.18)<1e-6);
  assert.ok(new THREE.Box3().setFromObject(stone).equals(stoneBounds));setArtifactSeparation(root,'cedar-facing',[0,0,0]);assert.ok(facing.getWorldPosition(new THREE.Vector3()).distanceTo(before)<1e-6);
});

test('actual world capitals, sea and teaching displays all load Blender models while preserving public routes',async()=>{
  const loaded=new Map();const load=id=>{if(!loaded.has(id))loaded.set(id,asset(id));return loaded.get(id);};
  const built=createHistoricalScene('solomon',null,{blenderAssets:true,assetLoader:load}),roots=[];built.scene.traverse(o=>{if(o.userData.assetReady)roots.push(o);});
  assert.equal(roots.length,5);assert.ok((await Promise.all(roots.map(o=>o.userData.assetReady))).every(Boolean));
  assert.ok(roots.every(o=>o.userData.modelSource==='blender'));
  const sea=built.objects.find(o=>o.id==='solomon-sea').root;assert.equal(sea.scale.x,5);assert.ok(Math.abs(new THREE.Box3().setFromObject(sea).max.y-3.8)<.01);
  const capitals=roots.filter(o=>o.name.startsWith('solomon-full-capital'));assert.equal(capitals.length,2);
  for(const c of capitals)assert.ok(Math.abs(new THREE.Box3().setFromObject(c).max.y-11.65)<.01,'full capital height follows 5 chosen cubits, excluding the shaft overlap');
  for(const o of solomonObjects)assert.ok(built.walkModel.path(solomonSpawn,o.approach).length>1,o.id);
  assert.equal(built.walkModel.valid(22,12),false);assert.equal(built.walkModel.valid(-4,0),false);
  for(const root of roots)root.traverse(o=>{if(o.isMesh)assert.ok(built.occluders.includes(o));});built.dispose();
});
