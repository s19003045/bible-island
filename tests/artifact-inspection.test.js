import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {artifactFraming,setBoardSeparation} from '../src/artifact-inspection.js';
import {createHistoricalScene} from '../src/historical-scenes.js';
import {tabernacleObjects,tabernacleSpawn} from '../src/tabernacle-exploration.js';

const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});globalThis.document={createElement:()=>({getContext:()=>ctx})};
async function asset(id){const b=await readFile(new URL('../public/models/'+id+'.glb',import.meta.url));return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');}

test('the real board has TWO hollow silver sockets and separates along the model axis without drift',async()=>{
  const gltf=await asset('board-joint'),root=gltf.scene;root.updateMatrixWorld(true);
  const board=root.getObjectByName('joint-board'),sockets=['socket-left','socket-right'].map(n=>root.getObjectByName(n));
  assert.ok(board&&sockets.every(Boolean));assert.notEqual(sockets[0],sockets[1]);
  for(const [i,socket] of sockets.entries()){
    const meshes=[];socket.traverse(o=>{if(o.isMesh)meshes.push(o);});
    const ray=new THREE.Raycaster(new THREE.Vector3(i===0?-.13:.13,.3,0),new THREE.Vector3(0,-1,0));
    const hit=ray.intersectObjects(meshes,false)[0];assert.ok(hit);assert.ok(Math.abs(hit.point.y-.05)<.003,'opening reaches the socket floor, not a filled top');
  }
  const original=board.getWorldPosition(new THREE.Vector3()),stationary=sockets.map(o=>o.getWorldPosition(new THREE.Vector3()));
  assert.ok(setBoardSeparation(root,.18));root.updateMatrixWorld(true);
  assert.ok(Math.abs(board.getWorldPosition(new THREE.Vector3()).y-original.y-.18)<1e-6);
  setBoardSeparation(root,.18);assert.ok(Math.abs(board.getWorldPosition(new THREE.Vector3()).y-original.y-.18)<1e-6);
  for(const [i,o] of sockets.entries())assert.ok(o.getWorldPosition(new THREE.Vector3()).distanceTo(stationary[i])<1e-7);
  setBoardSeparation(root,0);assert.ok(board.getWorldPosition(new THREE.Vector3()).distanceTo(original)<1e-7);
  root.rotation.z=.7;root.updateMatrixWorld(true);const from=board.getWorldPosition(new THREE.Vector3()),up=new THREE.Vector3(0,1,0).transformDirection(root.matrixWorld);
  setBoardSeparation(root,.18);const delta=board.getWorldPosition(new THREE.Vector3()).sub(from);assert.ok(delta.distanceTo(up.multiplyScalar(.18))<1e-6);
});

test('laver interior is a real hollow wall and linen has visible over/under geometry',async()=>{
  const basin=(await asset('tabernacle-basin')).scene;basin.updateMatrixWorld(true);const meshes=[];basin.traverse(o=>{if(o.isMesh)meshes.push(o);});
  const hit=new THREE.Raycaster(new THREE.Vector3(.05,2,0),new THREE.Vector3(0,-1,0)).intersectObjects(meshes,false)[0];
  assert.ok(hit);assert.ok(Math.abs(hit.point.y-.712)<.005,'open mouth exposes inner bottom, not a lid');
  const woven=(await asset('woven-sample')).scene;woven.updateMatrixWorld(true);const thread=woven.getObjectByName('woven-sample-fine-linen');assert.ok(thread);
  const bounds=new THREE.Box3().setFromObject(thread);assert.ok(bounds.min.z<-.006&&bounds.max.z>.006,'threads cross on both sides of the fabric plane');
});

test('inspection framing keeps every corner visible across narrow/wide screens and large object rotations',()=>{
  const boxes=[new THREE.Box3(new THREE.Vector3(-.5,0,-.12),new THREE.Vector3(.5,.74,.12)),new THREE.Box3(new THREE.Vector3(-.49,0,-.49),new THREE.Vector3(.49,1.24,.49))];
  for(const bounds of boxes)for(const aspect of [.6,1,2.4]){
    const frame=artifactFraming(bounds,aspect),camera=new THREE.PerspectiveCamera(35,aspect,.01,50);
    camera.position.set(1.15,.9,1.35).normalize().multiplyScalar(frame.distance);camera.lookAt(0,0,0);camera.updateMatrixWorld(true);
    for(const [x,y] of [[0,0],[1.2,.8],[-1.2,2.8]])for(const a of [bounds.min.x,bounds.max.x])for(const b of [bounds.min.y,bounds.max.y])for(const c of [bounds.min.z,bounds.max.z]){
      const p=new THREE.Vector3(a,b,c).sub(frame.center).applyEuler(new THREE.Euler(x,y,0)).project(camera);
      assert.ok(Math.abs(p.x)<1&&Math.abs(p.y)<1&&p.z>0&&p.z<1,`${aspect}: artifact must not crop while rotating`);
    }
  }
});

test('all three actual Blender craft objects replace world geometry, refresh occluders and preserve camp approaches',async()=>{
  const built=createHistoricalScene('tabernacle',null,{blenderAssets:true,assetLoader:asset});
  const placeholders=new Set();for(const o of built.objects)o.root.traverse(n=>{if(n.isMesh)placeholders.add(n);});
  assert.deepEqual(await Promise.all(built.objects.map(o=>o.root.userData.assetReady)),[true,true,true]);
  assert.ok(built.objects.every(o=>o.root.userData.modelSource==='blender'));
  for(const old of placeholders)assert.ok(!built.occluders.includes(old),'removed placeholders no longer block sight rays');
  for(const o of built.objects)o.root.traverse(n=>{if(n.isMesh)assert.ok(built.occluders.includes(n));});
  const basin=built.objects.find(o=>o.id==='tabernacle-basin');assert.deepEqual(basin.root.position.toArray(),[4,0,0]);
  assert.ok(new THREE.Box3().setFromObject(basin.root).max.y<1.25);
  for(const d of tabernacleObjects){const path=built.walkModel.path(tabernacleSpawn,d.approach);assert.ok(path.length>1);assert.ok(built.walkModel.valid(d.approach[0],d.approach[2]));}
  assert.equal(built.walkModel.valid(4,0),false,'laver remains a solid walking obstacle');
  const state=built.people[0].state;built.converse(built.people[0].id);assert.equal(state.talking,true);built.dispose();
});
