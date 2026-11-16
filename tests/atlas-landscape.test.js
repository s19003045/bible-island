import test from 'node:test';
import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3,Raycaster} from 'three';
import {themes,themeById} from '../src/content.js';
import {atlasFrame,atlasJourneys} from '../src/atlas-data.js';
import {basinShoreRadius,basinShoreDistance,mountainHeight,createMountainBasin} from '../src/atlas-landscape.js';

test('the mountain basin encloses every azimuth without flooding islands or forming a flat background plate',()=>{
 const basin=createMountainBasin(),positions=basin.terrain.geometry.attributes.position,normals=basin.terrain.geometry.attributes.normal;
 assert.ok(positions.count<26000);assert.ok([...positions.array,...normals.array].every(Number.isFinite));
 assert.ok([...Array(normals.count).keys()].filter(i=>normals.getY(i)>0).length>normals.count*.99);
 for(const t of themes)for(let i=0;i<24;i++){const a=i/24*Math.PI*2,x=t.position[0]+Math.cos(a)*(t.radius+3),z=t.position[1]+Math.sin(a)*(t.radius+3);assert.ok(basinShoreDistance(x,z)<-3,t.id);assert.ok(mountainHeight(x,z)<-.13,t.id);}
 const peaks=[];for(let i=0;i<48;i++){const a=i/48*Math.PI*2,shore=basinShoreRadius(a),heights=[12,20,30,40,55].map(d=>mountainHeight(Math.cos(a)*(shore+d),Math.sin(a)*(shore+d)));peaks.push(Math.max(...heights));assert.ok(Math.max(...heights)>8,'low passes remain raised land');assert.ok(mountainHeight(Math.cos(a)*(shore-2),Math.sin(a)*(shore-2))<-.13);}assert.ok(Math.max(...peaks)>40);assert.ok(peaks.filter(h=>h>20).length>=32);
 basin.dispose();
});

test('authored overview and curated journey cameras keep terrain out of all island sight lines',()=>{
 const basin=createMountainBasin();basin.root.updateMatrixWorld(true);
 for(const aspect of [390/772,768/936,1823/1172])for(const journey of atlasJourneys){
  const list=journey.stops.length?journey.stops.map(id=>themeById.get(id)):themes,frame=atlasFrame(list,aspect),camera=new PerspectiveCamera(39,aspect,.1,1800);camera.position.fromArray(frame.center).add(new Vector3(...frame.offset));camera.lookAt(new Vector3(...frame.center));camera.updateMatrixWorld();
  for(const t of list){const target=new Vector3(t.position[0],1.5,t.position[1]),direction=target.clone().sub(camera.position),ray=new Raycaster(camera.position,direction.clone().normalize(),.1,direction.length()-.5);assert.equal(ray.intersectObject(basin.terrain).length,0,`${journey.id}/${t.id}/${aspect}`);}
 }
 basin.dispose();
});

test('clouds drift above the actual ridges, face the camera, freeze with scene time and release all shared resources',()=>{
 const basin=createMountainBasin(),camera=new PerspectiveCamera();camera.position.set(40,70,100);camera.lookAt(0,0,0);camera.updateMatrixWorld();
 const resources=new Set();basin.root.traverse(o=>{if(o.geometry)resources.add(o.geometry);if(o.material){resources.add(o.material);if(o.material.map)resources.add(o.material.map);}});const disposed=new Map([...resources].map(r=>[r,0]));for(const r of resources)r.addEventListener('dispose',()=>disposed.set(r,disposed.get(r)+1));
 basin.update(0,false,camera);const first=basin.clouds.map(c=>c.mesh.position.clone());
 for(const time of [60,3600]){basin.update(time,false,camera);for(const [i,c] of basin.clouds.entries()){const p=c.mesh.position;assert.ok(p.y>mountainHeight(p.x,p.z)+5);assert.ok(p.distanceTo(first[i])>1);assert.ok(c.mesh.quaternion.angleTo(camera.quaternion)<1e-7);}}
 const stopped=basin.clouds.map(c=>c.mesh.position.toArray());basin.update(3600,true,camera);assert.deepEqual(basin.clouds.map(c=>c.mesh.position.toArray()),stopped);assert.equal(basin.clouds[0].mesh.material.opacity,.42);
 const map=basin.clouds[0].mesh.material.map.image;assert.ok(map.data.some((v,i)=>i%4===3&&v>180));assert.equal(map.data[3],0);
 basin.dispose();assert.ok([...disposed.values()].every(n=>n===1));
});
