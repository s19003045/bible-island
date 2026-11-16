import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createVessel} from '../src/vessels.js';
import {createHistoricalScene} from '../src/historical-scenes.js';
import {setArtifactSeparation,artifactFraming} from '../src/artifact-inspection.js';
import {blenderModels} from '../src/blender-manifest.js';
import {exodusSegments} from '../src/exodus-exploration.js';

const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});globalThis.document={createElement:()=>({getContext:()=>ctx})};
async function asset(id){const b=await readFile(new URL('../public/models/'+id+'.glb',import.meta.url));return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');}
function meshes(root){const all=[];root.traverse(o=>{if(o.isMesh)all.push(o);});return all;}
const down=(x,y,z,objects)=>new THREE.Raycaster(new THREE.Vector3(x,y,z),new THREE.Vector3(0,-1,0)).intersectObjects(objects,false);

test('actual brick mould is open underneath and lifts without pulling the formed mud brick into the air',async()=>{
  const root=(await asset('brick-mould')).scene;root.updateMatrixWorld(true);const frame=root.getObjectByName('brick-frame');assert.ok(frame);
  assert.equal(down(-.24,.8,0,meshes(frame)).length,0,'no hidden mould bottom');
  const mud=meshes(root).filter(o=>o.material.name==='exodus-unfired-mud');assert.ok(mud.length);
  const fixed=mud.map(o=>new THREE.Box3().setFromObject(o));
  const brick=down(-.24,.8,0,mud)[0];assert.ok(brick&&Math.abs(brick.point.y-.094)<.001);
  const before=frame.getWorldPosition(new THREE.Vector3());setArtifactSeparation(root,'brick-frame',[0,.18,0]);
  assert.ok(Math.abs(frame.getWorldPosition(new THREE.Vector3()).y-before.y-.18)<1e-6);
  mud.forEach((o,i)=>assert.ok(new THREE.Box3().setFromObject(o).equals(fixed[i])));
  setArtifactSeparation(root,'brick-frame',[0,0,0]);assert.ok(frame.getWorldPosition(new THREE.Vector3()).distanceTo(before)<1e-6);
});

test('actual kneading vessel has an inner floor and the cloth stays outside its rim before a reversible reveal',async()=>{
  const root=(await asset('passover-kit')).scene;root.updateMatrixWorld(true);
  const bowl=root.getObjectByName('kneading-vessel'),wrap=root.getObjectByName('kneading-wrap');assert.ok(bowl&&wrap);
  const bowlMeshes=meshes(bowl),clothMeshes=meshes(wrap).filter(o=>o.material.name==='exodus-wrapping-cloth');assert.ok(clothMeshes.length);
  const floor=down(.255,.4,-.055,bowlMeshes)[0];assert.ok(Math.abs(floor.point.y-.044)<.001,'open bowl has a true inner bottom');
  // Double-sided ray intersection checks geometry from inside, irrespective of
  // the material's front-face rendering policy.
  for(const o of [...bowlMeshes,...clothMeshes])o.material.side=THREE.DoubleSide;
  for(const y of [.11,.17,.185])for(let j=0;j<16;j++){
    const a=j*Math.PI/8,ray=new THREE.Raycaster(new THREE.Vector3(.255,y,-.055),new THREE.Vector3(Math.cos(a),0,Math.sin(a)));
    const vessel=ray.intersectObjects(bowlMeshes,false).at(-1),cloth=ray.intersectObjects(clothMeshes,false)[0];
    assert.ok(vessel&&cloth);assert.ok(cloth.distance>vessel.distance+.001,`cloth does not intersect rim at ${y}/${j}`);
  }
  const before=wrap.getWorldPosition(new THREE.Vector3()),fixed=new THREE.Box3().setFromObject(bowl);
  const settings=blenderModels['passover-kit'];
  setArtifactSeparation(root,'kneading-wrap',settings.articulation.offset);assert.ok(wrap.getWorldPosition(new THREE.Vector3()).distanceTo(before)>.4);
  const framing=artifactFraming(new THREE.Box3().setFromObject(root),1.5),target=new THREE.Vector3(.255,.044,-.055);
  const camera=framing.center.clone().add(new THREE.Vector3(...settings.inspectionView).normalize().multiplyScalar(framing.distance));
  const visible=new THREE.Raycaster(camera,target.clone().sub(camera).normalize()).intersectObjects(meshes(root),false)[0];
  assert.ok(bowlMeshes.includes(visible?.object)&&visible.point.distanceTo(target)<.005,'initial inspection view sees the inner floor after unwrapping');
  assert.ok(new THREE.Box3().setFromObject(bowl).equals(fixed));setArtifactSeparation(root,'kneading-wrap',[0,0,0]);
  assert.ok(wrap.getWorldPosition(new THREE.Vector3()).distanceTo(before)<1e-6);
});

test('actual narrative cutaway has two closed rippled water volumes, a clear dry corridor and grounded teaching figures',async()=>{
  const root=(await asset('crossing-ground')).scene;root.updateMatrixWorld(true);
  for(const [name,sign] of [['left',-1],['right',1]]){
    const group=root.getObjectByName('water-'+name);assert.ok(group);
    const water=meshes(group).find(o=>o.material.name==='crossing-water-volume');assert.ok(water.material.transparent&&water.material.opacity<.8);
    const box=new THREE.Box3().setFromObject(water);assert.ok(box.min.y>.035&&box.max.y<.392);
    assert.ok(sign<0?box.max.z<-.17:box.min.z>.17,'dry passage is outside both volumes');
    const geometry=water.geometry,p=geometry.attributes.position,ids=[],vertices=new Map(),edges=new Map();
    for(let i=0;i<p.count;i++){
      const key=[p.getX(i),p.getY(i),p.getZ(i)].map(n=>Math.round(n*1e6)).join(',');
      if(!vertices.has(key))vertices.set(key,vertices.size);ids.push(vertices.get(key));
    }
    const index=geometry.index;
    for(let i=0;i<index.count;i+=3){const t=[ids[index.getX(i)],ids[index.getX(i+1)],ids[index.getX(i+2)]];
      for(let k=0;k<3;k++){const a=t[k],b=t[(k+1)%3];if(a===b)continue;const key=[Math.min(a,b),Math.max(a,b)].join(':');edges.set(key,(edges.get(key)||0)+1);}}
    assert.ok([...edges.values()].every(n=>n===2),'water has no open boundary edges');
  }
  assert.ok(Math.abs(down(0,.8,0,meshes(root))[0].point.y-.036)<.001);
  const figures=root.children.filter(o=>o.userData.component==='modern-direction-figure');assert.equal(figures.length,3);
  for(const figure of figures)assert.ok(Math.abs(new THREE.Box3().setFromObject(figure).min.y-.036)<.0001);
});

test('Exodus loads each physical prop in its own chapter and keeps the crossing convoy separate from its static inspection cutaway',async()=>{
  const loaded=new Map(),load=id=>{if(!loaded.has(id))loaded.set(id,asset(id));return loaded.get(id);};
  for(const chapter of exodusSegments){
    const built=createHistoricalScene('exodus',null,{segment:chapter.id,blenderAssets:true,assetLoader:load});
    assert.equal(built.objects.length,1);const object=built.objects[0];assert.ok(built.walkModel.path(chapter.spawn,object.approach).length>1);
    if(chapter.id==='crossing'){
      assert.equal(object.root,null,'static miniature is not substituted for life-size moving people');
      const inspection=createVessel(object.id,{blenderAssets:true,assetLoader:load});assert.equal(await inspection.userData.assetReady,true);
      const positions=built.npcSystem.agents.map(a=>a.actor.state.position[0]);
      for(let i=0;i<40;i++)built.npcSystem.update(.05,{player:chapter.spawn});
      assert.ok(built.npcSystem.agents.some((a,i)=>a.actor.state.position[0]>positions[i]));inspection.userData.releaseBlender();
    }else{
      assert.equal(await object.root.userData.assetReady,true);assert.equal(object.root.userData.modelSource,'blender');
      object.root.traverse(o=>{if(o.isMesh)assert.ok(built.occluders.includes(o));});
    }
    built.dispose();
  }
  for(const [id,part,offset] of [['brick-mould','brick-frame',[0,.18,0]],['passover-kit','kneading-wrap',[0,.17,.08]]])assert.ok(setArtifactSeparation(createVessel(id),part,offset));
});
