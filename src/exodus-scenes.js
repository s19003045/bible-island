import * as THREE from 'three';
import {HUMAN_HEIGHT} from './historical-data.js';
import {createWalkModel} from './walk-model.js';
import {createNPCSystem} from './npc-system.js';
import {createConvoySystem} from './convoy-system.js';
import {createVessel} from './vessels.js';
import {exodusSegments,exodusObjects,exodusFloor,exodusBrickPOIs,exodusHomePOIs,exodusHomeAllowed,exodusSpawnCandidates,crossingPOIs,crossingNPCSurface} from './exodus-exploration.js';

export function buildExodusScene(k,roof,scene,p,segment='all'){
 if(segment==='all'||segment==='bricks'){
  k.box('court',-48,-.04,-23,44,.12,40);
  for(let i=0;i<11;i++){const x=-63+(i%3)*11,z=-38+Math.floor(i/3)*13;k.house(x,0,z,7.5,6.5,3,'mud',i===10?roof:null);}
  for(let row=0;row<14;row++)for(let col=0;col<9;col++)k.box('mud',-51+col*.65,.09,-36+row*.43,.57,.18,.34);
  k.box('mud',-48,.02,-26,10,.04,5);
  for(let i=0;i<10;i++){const x=-52+i*.85,z=-22;k.box('wood',x,.06,z,.6,.12,.07);k.box('wood',x,.06,z+.42,.6,.12,.07);for(const dx of [-.28,.28])k.box('wood',x+dx,.06,z+.21,.06,.12,.48);}
  for(let i=0;i<80;i++){const x=-41+k.rand()*6,z=-28+k.rand()*6;k.part('column','reed',x,.12+k.rand()*.3,z,.04,.7,.04,.9,k.rand()*6);}
  k.box('wood',-46,.79,-24,1.35,.1,.9);for(const dx of [-.53,.53])k.box('wood',-46+dx,.39,-24,.09,.78,.7);
  for(let i=0;i<18;i++){const x=i<10?-46.5:-33,z=-40+(i%10)*3.2;k.person(x,.03,z,i,0,HUMAN_HEIGHT,{role:'brick-worker'});}
  for(let i=0;i<45;i++){const x=-90+k.rand()*60,z=-57-k.rand()*25;for(let q=0;q<3;q++)k.beam('reed',[x,0,z],[x+(k.rand()-.5)*.6,1+k.rand(),z+.2],.018);}
 }
 if(segment==='all'||segment==='passover'){
  k.box('court',-33.5,-.04,28,23,.12,29);
  k.house(-35,0,21,8,7,3.3,'mud',roof,0,true);
  for(const [x,z] of [[-52,32],[-23,49],[-45,51],[-56,16]])k.house(x,0,z,7.5,6.5,3,'mud');
  k.box('red',-35,2.19,24.53,1.5,.1,.08);for(const x of [-35.62,-34.38])k.box('red',x,1.08,24.53,.07,2.12,.08);
  k.box('wood',-35,.6,21,2,.12,1);
  for(let i=0;i<4;i++)k.ball('hide',-32+i*.6,.35,22,.55,.7,.5);
  k.person(-37,.03,19,1,0,HUMAN_HEIGHT,{role:'departure-family'});k.person(-33.2,.03,19,2,0,1.12,{role:'departure-family'});
  for(let i=0;i<12;i++)k.person(-40+(i%4)*4,.03,28+Math.floor(i/4)*4,i,0,HUMAN_HEIGHT,{role:'departure-neighbor'});
 }
 if(segment==='all'||segment==='crossing'){
  k.box('court',245,-.04,0,590,.12,17);
  const waterMat=p.water.clone();waterMat.color.set('#355f62');
  for(const side of [-1,1]){
   const geo=new THREE.PlaneGeometry(550,5.8,180,12),a=geo.attributes.position;
   for(let i=0;i<a.count;i++){const x=a.getX(i),y=a.getY(i);a.setZ(i,Math.sin(x*.17+y*.8)*.34+Math.sin(x*.6-y*.4)*.13);}geo.computeVertexNormals();
   const m=waterMat.clone();m.side=THREE.DoubleSide;const face=new THREE.Mesh(geo,m);face.position.set(262,2.9,side*10);scene.add(face);
   const surfaceGeo=new THREE.PlaneGeometry(550,900,160,90);surfaceGeo.rotateX(-Math.PI/2);const sp=surfaceGeo.attributes.position;
   for(let i=0;i<sp.count;i++){const x=sp.getX(i),z=sp.getZ(i);sp.setY(i,Math.sin(x*.27+z*.18)*.1+Math.sin(x*.5-z*.6)*.04);}surfaceGeo.computeVertexNormals();
   const surface=new THREE.Mesh(surfaceGeo,waterMat);surface.position.set(262,5.77,side*460);surface.receiveShadow=true;scene.add(surface);
   for(let i=0;i<65;i++){const x=-12+k.rand()*188,z=side*(9.6+k.rand()*.5);k.ball('linen',x,.08,z,.2,.025,.45);}
  }
  for(let i=0;i<58;i++){const x=-18+(i/58)*215,z=(k.rand()-.5)*12;k.person(x,.03,z,i,Math.PI/2,i%11===0?1.12:HUMAN_HEIGHT,{role:'crossing-person'});}
 }
}
export function attachExodusExploration(scene,k,roof,segment,{blenderAssets=false,onReady=()=>{},assetLoader}={}){
 const objects=[],models=new Map(),systems=[];k.collisionBoxes.push(...roof.collisionBoxes);
 if(segment==='all'||segment==='bricks')k.collisionBoxes.push({min:[-46.73,0,-24.52],max:[-45.27,1.5,-23.48]});
 if(segment==='all'||segment==='passover')k.collisionBoxes.push(
  {min:[-36,0,20.5],max:[-34,1.5,21.5]},
  {min:[-32.3,0,21.7],max:[-29.9,.75,22.3]},
  {min:[-30.7,0,20.5],max:[-29.5,4,25]});
 for(const s of exodusSegments){
  if(segment!=='all'&&segment!==s.id)continue;
  for(const d of exodusObjects.filter(o=>o.segment===s.id)){let root=null;if(!d.sceneOnly){root=createVessel(d.id,{blenderAssets,onReady,assetLoader});root.position.fromArray(d.position);scene.add(root);}objects.push({...d,root});}
  const model=createWalkModel(k.collisionBoxes,s.surfaces,exodusFloor,{proxies:[],navigationStep:s.id==='crossing'?.8:.4});models.set(s.id,model);
  const actors=k.actors.filter(a=>s.id==='bricks'?a.role==='brick-worker'||a.role==='brick-guide':s.id==='passover'?a.role?.startsWith('departure-'):a.role==='crossing-person'||a.role==='crossing-guide');
  if(s.id==='crossing'){
   const corridor=createWalkModel(k.collisionBoxes,crossingNPCSurface,exodusFloor,{proxies:[],navigationStep:.8});
   systems.push(createConvoySystem({actors,pois:crossingPOIs,model:corridor,playerModel:model,spawn:s.spawn}));
  }else systems.push(createNPCSystem({actors,model,pois:s.id==='bricks'?exodusBrickPOIs:exodusHomePOIs,seed:s.id==='bricks'?50126:12026,
   spawnCandidates:exodusSpawnCandidates(s.id),allowedPosition:s.id==='passover'?exodusHomeAllowed:()=>true,spawnExclusion:s.spawn}));
 }
 const npcSystem=systems.length===1?systems[0]:{agents:systems.flatMap(s=>s.agents),pois:systems.flatMap(s=>s.pois),reservations:new Map(systems.flatMap(s=>[...s.reservations])),
  update:(dt,options)=>systems.forEach(s=>s.update(dt,options)),suspend:()=>systems.forEach(s=>s.suspend()),dispose:()=>systems.forEach(s=>s.dispose())};
 return {objects,walkModel:models.get(segment)||null,npcSystem};
}
