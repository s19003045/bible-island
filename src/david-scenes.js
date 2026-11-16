import * as THREE from 'three';
import {createWalkModel} from './walk-model.js';
import {createNPCSystem} from './npc-system.js';
import {createVessel} from './vessels.js';
import {createDavidFlock} from './david-animals.js';
import {normalizeDavidPhase} from './artifact-phases.js';
import {davidFloor,davidObjects,davidSegmentById,davidPOIs,davidSpawnCandidates} from './david-exploration.js';

export function buildDavidScene(k,scene,segment,{phase='cart',blenderAssets=false,onReady=()=>{},assetLoader}={}){
 const s=davidSegmentById.get(segment)||davidSegmentById.get('sheep'),floor=(x,z)=>davidFloor(s.id,x,z),moment=normalizeDavidPhase(phase);
 const height=(x,z)=>{const border=Math.max(Math.abs(x)-36,Math.abs(z)-40);let y=floor(x,z);if(s.id==='sheep'){const shelf=THREE.MathUtils.smoothstep(x,-41,-37)*(1-THREE.MathUtils.smoothstep(x,-18,-16))*THREE.MathUtils.smoothstep(z,-17,-12)*(1-THREE.MathUtils.smoothstep(z,16,21));y=THREE.MathUtils.lerp(y,1.1,shelf);}return y+THREE.MathUtils.smoothstep(border,0,115)*(6+17*Math.sin(x*.017+z*.013)**2+6*Math.cos(z*.027)**2);};
 const earth=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1});
 for(const [size,segments,near] of [[1500,180,false],[100,150,true]]){
  const g=new THREE.PlaneGeometry(size,size,segments,segments);g.rotateX(-Math.PI/2);const p=g.attributes.position,c=[];for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),colour=new THREE.Color(s.id==='sheep'?'#90926d':s.id==='city'?'#a19a82':'#9a947a');p.setY(i,height(x,z)-(near?.009:.045));colour.offsetHSL(0,0,.025*Math.sin(x*.2)*Math.cos(z*.15)+.02*Math.sin(z*.06));c.push(colour.r,colour.g,colour.b);}const indices=[];for(let i=0;i<g.index.count;i+=3){const ids=[g.index.getX(i),g.index.getX(i+1),g.index.getX(i+2)],x=ids.reduce((a,j)=>a+p.getX(j),0)/3,z=ids.reduce((a,j)=>a+p.getZ(j),0)/3;if(!near&&Math.abs(x)<47&&Math.abs(z)<47)continue;indices.push(...ids);}g.setIndex(indices);g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));g.computeVertexNormals();const m=new THREE.Mesh(g,earth);m.name=near?'david-observation-ground':'david-layered-hills';m.receiveShadow=true;scene.add(m);
 }
 const block=(x,z,w,h,d)=>k.collisionBoxes.push({min:[x-w/2,height(x,z)-.15,z-d/2],max:[x+w/2,height(x,z)+h,z+d/2]});
 function path(points,width=2){const curve=new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,0,z))),v=[],f=[];for(let i=0;i<=100;i++){const p=curve.getPoint(i/100),t=curve.getTangent(i/100);for(const side of [-1,1]){const x=p.x+t.z*width*.5*side,z=p.z-t.x*width*.5*side;v.push(x,height(x,z)+.016,z);}if(i){const n=(i-1)*2;f.push(n,n+2,n+3,n,n+3,n+1);}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(f);g.computeVertexNormals();const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:'#b8a88b',roughness:1}));m.name='david-public-worn-path';m.receiveShadow=true;scene.add(m);}
 path([[21,47],[17,27],[10,16],[8,3],[10,-19],[2,-42]],2.7);path([[-42,19],[-17,14],[-5,10],[13,8],[40,3]],1.7);
 function tree(x,z,scale=1){const y=height(x,z);k.beam('trunk',[x,y,z],[x+.17,y+3.1*scale,z],.17*scale);for(let i=0;i<10;i++){const a=i*2.4,end=[x+Math.cos(a)*(1.2+i%3*.32)*scale,y+(3+i%3*.32)*scale,z+Math.sin(a)*(1.2+i%3*.32)*scale];k.beam('trunk',[x+.12,y+1.8*scale,z],end,.055*scale);for(let j=0;j<65;j++)k.part('leaf','leaf',end[0]+(k.rand()-.5)*2.2*scale,end[1]+(k.rand()-.5)*.85*scale,end[2]+(k.rand()-.5)*2.2*scale,.15*scale,1,1,k.rand(),k.rand()*6.28,k.rand());}block(x,z,.7,3,.7);}
 function house(x,z,w=7,d=7,h=3.1){const y=height(x,z);k.house(x,y,z,w,d,h,'stone');block(x,z,w+1,h+1,d+1);}
 function stock(x,z){const y=height(x,z);for(let i=0;i<3;i++)k.jar(x+i*.6,y,z,.32+i*.04);k.box('linen',x+1,y+.16,z+1,.65,.32,.65);block(x+.7,z+.4,2.7,1.3,2.4);}
 function covered(x,z,y,poles=false){k.box('linen',x,y+.35,z,1.13,.7,.68);if(poles)for(const dz of [-.44,.44])k.beam('wood',[x-1.6,y+.15,z+dz],[x+1.6,y+.15,z+dz],.045);}
 if(s.id==='sheep'){
  // The flock moves on its own protected shelf, outside the public route.
  for(const [x,z] of [[-37,1],[-18,1]])k.wall(x,1.1,z,31,.55,.5,'z','stone',.7,.23);
  for(const [x,z,scale] of [[-42,-14,1.1],[-44,24,1.2],[-12,-24,1],[31,24,1],[35,-13,1.1],[8,38,.9]])tree(x,z,scale);
  for(const [x,z] of [[3,-38],[18,-49],[-17,-51],[35,-34],[-48,-35]])house(x,z);
  for(let i=0;i<260;i++){const x=-58+k.rand()*112,z=-56+k.rand()*108;if(x>-16&&x<30&&z>-19&&z<31)continue;for(let j=0;j<3;j++)k.part('leaf','reed',x+(k.rand()-.5)*.4,height(x,z)+.12,z+(k.rand()-.5)*.4,.09,1,1,k.rand(),k.rand()*6.28,k.rand());}
  k.box('stone',-32,1.22,-9,3,.24,1);k.box('water',-32,1.351,-9,2.6,.015,.65);stock(33,7);
 }else if(s.id==='city'){
  for(const [x,z,w,d,h] of [[-21,-31,10,8,4],[-5,-42,10,9,4.7],[14,-38,8,8,3.8],[30,-34,8,8,3.9],[-34,-48,9,8,4],[9,-61,12,10,5],[33,-58,9,8,4],[-48,-26,9,8,3.5],[-27,28,8,7,3.3],[38,25,8,7,3.3]])house(x,z,w,d,h);
  for(const x of [-23,23]){const z=-25,y=height(x,z);k.wall(x,y,z,23,4.8,1.3,'x','stone',1.1,.4);block(x,z,23,5,1.4);}for(const x of [-7,7]){const z=-29,y=height(x,z);k.wall(x,y,z,5,7,6,'x','stone',1.15,.45);block(x,z,5,7,6);}
  for(const [x,z] of [[-23,8],[34,1],[31,17]]){const y=height(x,z);for(let i=0;i<6;i++)k.beam('wood',[x-3,y+.1+(i%3)*.18,z+Math.floor(i/3)*.4],[x+3,y+.1+(i%3)*.18,z+Math.floor(i/3)*.4],.11);block(x,z,6.5,.8,1.5);stock(x,z+3);}
  for(const [x,z,scale] of [[-27,22,1],[-34,-8,1],[36,-18,1],[13,38,1]])tree(x,z,scale);
 }else{
  // One time slice is built. No later tent, cart or domestic stop leaks into another.
  const group=new THREE.Group();group.name='david-moment-'+moment;scene.add(group);const x=-26,z=-12,y=height(x,z);
  if(moment==='cart'){
   k.box('wood',x,y+.8,z,2.8,.16,1.5);for(const dz of [-.95,.95]){const wheel=new THREE.Mesh(new THREE.TorusGeometry(.67,.065,10,40),new THREE.MeshStandardMaterial({color:'#836741',roughness:1}));wheel.position.set(x,y+.68,z+dz);scene.add(wheel);for(let i=0;i<8;i++){const a=i*Math.PI/4;k.beam('wood',[x,y+.68,z+dz],[x+Math.cos(a)*.64,y+.68+Math.sin(a)*.64,z+dz],.034);}}for(const dz of [-.45,.45])k.beam('wood',[x+1,y+.73,z+dz],[x+4,y+.6,z+dz],.07);covered(x,z,y+.9);block(x+1,z,6,2,2.2);
  }else if(moment==='pause'){
   house(x,z,8,8,3.3);stock(x+5,z+3);
  }else if(moment==='carry'){
   // This overview shows the later public route; the fixed-pole detail is on
   // the explicitly modern observation table. No invented count of bearers.
   path([[-37,14],[-26,-4],[-23,-16],[-8,-31]],3.3);for(const [tx,tz] of [[-34,-14],[-20,-31]])tree(tx,tz,1.1);
  }else{
   k.tent(x,y,z,2.1);covered(x,z,y+.08,true);block(x,z,16,5,9);
  }
  for(const [tx,tz] of [[33,-12],[32,27],[-24,29],[5,-41],[-48,-32]])tree(tx,tz,1.1);for(const [hx,hz] of [[12,-43],[31,-36],[-43,37],[35,43]])house(hx,hz);stock(33,7);
 }
 const y=floor(-5,7);k.box('wood',-5,y+.76,7,1.8,.1,1.25);for(const x of [-5.72,-4.28])for(const z of [6.55,7.45])k.box('wood',x,y+.36,z,.075,.72,.075);block(-5,7,1.8,.83,1.25);
 for(let i=0;i<12;i++){const x=i<6?-13+(i%3)*6:10+(i%3)*6,z=i%2?21:-2;k.person(x,floor(x,z),z,i,0,i%6===0?1.12:1.7,{role:'david-resident'});}
 const marker=new THREE.Group();marker.name='david-chapter-'+s.id;scene.add(marker);
 const flock=s.id==='sheep'?createDavidFlock(scene,{blenderAssets,onReady,assetLoader}):null;return {height,flock};
}
export function attachDavidExploration(scene,k,segment,{phase='cart',blenderAssets=false,onReady=()=>{},assetLoader}={}){
 const s=davidSegmentById.get(segment)||davidSegmentById.get('sheep'),floor=(x,z)=>davidFloor(s.id,x,z),walkModel=createWalkModel([...k.collisionBoxes],s.surfaces,floor,{proxies:[],navigationStep:.55}),npcSystem=createNPCSystem({actors:k.actors,model:walkModel,pois:davidPOIs(s.id),seed:16126+s.number*823+['cart','pause','carry','tent'].indexOf(phase)*37,spawnCandidates:davidSpawnCandidates(s.id),spawnExclusion:s.spawn,allowRetreat:true});
 const objects=davidObjects.filter(o=>o.segment===s.id).map(d=>{const root=createVessel(d.id,{phase,blenderAssets,onReady,assetLoader});root.position.fromArray(d.position);scene.add(root);return {...d,root};});return {walkModel,npcSystem,objects};
}
