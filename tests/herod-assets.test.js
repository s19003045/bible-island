import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createHistoricalScene} from '../src/historical-scenes.js';
import {createVessel} from '../src/vessels.js';
import {setArtifactSeparation} from '../src/artifact-inspection.js';
import {herodObjects,herodSpawn} from '../src/herod-exploration.js';
import {blenderModels} from '../src/blender-manifest.js';

const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});
globalThis.document={createElement:()=>({getContext:()=>ctx})};
async function asset(id){const b=await readFile(new URL('../public/'+blenderModels[id].src,import.meta.url));return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');}
function meshes(root){const all=[];root.traverse(o=>{if(o.isMesh)all.push(o);});return all;}

test('exported Herod stones have physically recessed margins and separate along the actual joint after rotation',async()=>{
  const root=(await asset('herod-stone')).scene;root.updateMatrixWorld(true);
  const left=root.getObjectByName('ashlar-left'),right=root.getObjectByName('ashlar-right');assert.ok(left&&right);
  const front=x=>new THREE.Raycaster(new THREE.Vector3(x,.214,1),new THREE.Vector3(0,0,-1)).intersectObjects(meshes(left),false)[0];
  const boss=front(-.22),margin=front(-.422);assert.ok(boss&&margin);
  assert.ok(boss.point.z-margin.point.z>.012,'margin is real relief below the central face');
  assert.ok(boss.face.normal.z>.99&&margin.face.normal.z>.99);
  root.rotation.y=.65;root.updateMatrixWorld(true);
  const before=right.getWorldPosition(new THREE.Vector3()),fixed=new THREE.Box3().setFromObject(left);
  const expected=new THREE.Vector3(.16,0,0).applyQuaternion(root.quaternion);
  assert.ok(setArtifactSeparation(root,'ashlar-right',[.16,0,0]));
  assert.ok(right.getWorldPosition(new THREE.Vector3()).sub(before).distanceTo(expected)<1e-6);
  assert.ok(new THREE.Box3().setFromObject(left).equals(fixed));
  setArtifactSeparation(root,'ashlar-right',[.16,0,0]);setArtifactSeparation(root,'ashlar-right',[0,0,0]);
  assert.ok(right.getWorldPosition(new THREE.Vector3()).distanceTo(before)<1e-6);
});

test('actual boundary diagram contains fourteen ascending surfaces and its low rail separates independently of the wall',async()=>{
  const root=(await asset('herod-boundary')).scene;root.updateMatrixWorld(true);const all=meshes(root);
  for(let j=0;j<14;j++){
    const hit=new THREE.Raycaster(new THREE.Vector3(0,.8,.11-j*.018),new THREE.Vector3(0,-1,0)).intersectObjects(all,false)[0];
    assert.ok(hit);assert.ok(Math.abs(hit.point.y-(.088+(j+1)*.012))<.0001,`actual tread ${j+1}`);
  }
  const layer=root.getObjectByName('boundary-layer'),fixed=root.children.filter(o=>o.isMesh).map(o=>[o,new THREE.Box3().setFromObject(o)]);
  assert.ok(layer);const before=layer.getWorldPosition(new THREE.Vector3());
  setArtifactSeparation(root,'boundary-layer',[0,0,.14]);assert.ok(Math.abs(layer.getWorldPosition(new THREE.Vector3()).z-before.z-.14)<1e-6);
  for(const [o,box] of fixed)assert.ok(new THREE.Box3().setFromObject(o).equals(box));
  setArtifactSeparation(root,'boundary-layer',[0,0,0]);assert.ok(layer.getWorldPosition(new THREE.Vector3()).distanceTo(before)<1e-6);
});

test('exported portico comparison has two distinct rows of solid shaped leaves and a correctly sized load-bearing assembly',async()=>{
  const root=(await asset('herod-capital')).scene;root.updateMatrixWorld(true);
  const leaves=root.children.filter(o=>o.userData.component==='acanthus-leaf');assert.equal(leaves.length,16);
  for(const row of [0,1]){
    const current=leaves.filter(o=>o.name.startsWith('acanthus-row-'+row));assert.equal(current.length,8);
    for(const leaf of current){
      const bounds=new THREE.Box3().setFromObject(leaf),size=bounds.getSize(new THREE.Vector3());
      assert.ok(Math.abs(bounds.min.y-(.251+row*.11))<.001);
      assert.ok(size.y>.23&&Math.min(size.x,size.z)>.025,'carved surface has real extent, not an empty label');
      assert.ok(meshes(leaf).some(m=>m.geometry.index.count>1000));
    }
  }
  const size=new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());assert.ok(Math.abs(size.y-.76)<.001);
  const top=new THREE.Raycaster(new THREE.Vector3(.2,1,0),new THREE.Vector3(0,-1,0)).intersectObjects(meshes(root),false)[0];
  assert.ok(Math.abs(top.point.y-.76)<.001);
});

test('all three actual Herod scene displays use Blender geometry while sacred boundaries and approach routes stay intact',async()=>{
  const loaded=new Map();const load=id=>{if(!loaded.has(id))loaded.set(id,asset(id));return loaded.get(id);};
  const built=createHistoricalScene('herod',null,{blenderAssets:true,assetLoader:load});
  assert.equal(built.objects.length,3);assert.ok((await Promise.all(built.objects.map(o=>o.root.userData.assetReady))).every(Boolean));
  for(const d of herodObjects){
    const root=built.objects.find(o=>o.id===d.id).root;assert.equal(root.userData.modelSource,'blender');
    assert.ok(built.walkModel.path(herodSpawn,d.approach).length>1,d.id);
    root.traverse(o=>{if(o.isMesh)assert.ok(built.occluders.includes(o));});
  }
  const boundary=built.objects.find(o=>o.id==='herod-boundary').root;
  setArtifactSeparation(boundary,'boundary-layer',[0,0,.14]);built.roof.visible=false;
  assert.equal(built.walkModel.valid(70,0),false);assert.equal(built.walkModel.valid(81,46.5),false);
  assert.equal(built.walkModel.valid(94,-60),false);built.dispose();
  for(const [id,part,offset] of [['herod-stone','ashlar-right',[.16,0,0]],['herod-boundary','boundary-layer',[0,0,.14]]]){
    const fallback=createVessel(id);assert.ok(setArtifactSeparation(fallback,part,offset),'unavailable GLB keeps working controls');
  }
});
