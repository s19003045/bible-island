import * as THREE from 'three';
import {createWalkModel} from './walk-model.js';
import {createNPCSystem} from './npc-system.js';
import {createConvoySystem} from './convoy-system.js';
import {createVessel} from './vessels.js';
import {jordanFloor,jordanSpawn,jordanSurfaces,jordanCampSurface,jordanConvoySurface,jordanPOIs,jordanConvoyPOIs,jordanSpawnCandidates,jordanObjects} from './jordan-exploration.js';

export function buildJordanScene(k,scene,p){
 const height=(x,z)=>jordanFloor(x)+THREE.MathUtils.smoothstep(Math.max(Math.abs(x)-75,Math.abs(z)-42),0,130)*(8+Math.abs(Math.sin(x*.021+z*.014))*30+Math.sin(x*.057-z*.031)*5);
 const geo=new THREE.PlaneGeometry(880,880,360,260);geo.rotateX(-Math.PI/2);const a=geo.attributes.position,colors=[];
 for(let i=0;i<a.count;i++){
  const x=a.getX(i),z=a.getZ(i);a.setY(i,height(x,z));
  const riverbed=Math.abs(x)<10+Math.sin(z*.025)*2,c=new THREE.Color(riverbed?'#8b7350':Math.abs(x)<26?'#8d8365':'#737d5b');c.offsetHSL(0,0,Math.sin(x*.075+Math.sin(z*.031)*2)*Math.cos(z*.053-x*.019)*.026+Math.sin(z*.03)*.025+(!riverbed&&Math.abs(x)<24?Math.sin(height(x,z)*8)*.012:0));colors.push(c.r,c.g,c.b);
 }
 geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.computeVertexNormals();const ground=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));ground.name='jordan-continuous-valley';ground.receiveShadow=true;scene.add(ground);
 // A short visible upstream reach hints at the river; the remote stoppage is
 // deliberately NOT modelled as an adjacent dam, nor as two Exodus water walls.
 const waterGeo=new THREE.PlaneGeometry(16,160,20,80);waterGeo.rotateX(-Math.PI/2);const wp=waterGeo.attributes.position;
 for(let i=0;i<wp.count;i++)wp.setY(i,Math.sin(wp.getX(i)*.7+wp.getZ(i)*.22)*.035);
 waterGeo.computeVertexNormals();const water=new THREE.Mesh(waterGeo,p.water);water.name='jordan-upstream-comparison-water';water.position.set(0,.28,-130);scene.add(water);
 for(let i=0;i<135;i++){
  const side=i%2?1:-1,z=-95+k.rand()*185,x=side*(26+k.rand()*22),y=height(x,z);
  if(z>9&&z<30||Math.abs(z)<9)continue;
  for(let n=0;n<8;n++)k.beam('reed',[x+(n%3)*.18,y,z+Math.floor(n/3)*.16],[x+(n%3)*.18+.15,y+.8+k.rand()*.9,z+Math.floor(n/3)*.16],.014);
 }
 for(let i=0;i<75;i++){const x=(i%2?1:-1)*(72+k.rand()*100),z=-90+k.rand()*210;k.ball('darkstone',x,height(x,z)-.12,z,1+k.rand()*2,.5+k.rand(),1+k.rand()*2);}
 for(const x of [-34,35])for(const z of [-43,-30,36,47])k.olive(x,height(x,z),z,.75+k.rand()*.25);
 for(const [x,z] of [[-49,-17],[-40,-18],[-50,34],[-34,37],[48,37],[59,39]])k.tent(x,jordanFloor(x),z,.85);
 for(const d of jordanObjects.filter(o=>o.id!=='jordan-stones')){k.box('wood',d.position[0],d.position[1]-.055,d.position[2],1.8,.10,1.25);for(const side of [-1,1])k.box('wood',d.position[0]+side*.71,d.position[1]-.43,d.position[2],.08,.75,1);}
 for(let i=0;i<14;i++){const x=-48+(i%7)*15,z=13+Math.floor(i/7)*12;k.person(x,jordanFloor(x),z,i,0,i%9===0?1.12:1.7,{role:x<0?'east-resident':'west-resident'});}
 for(let i=0;i<20;i++){const x=-26+(i%10)*6.2,z=-4.8+Math.floor(i/10)*8.8;k.person(x,jordanFloor(x),z,i,Math.PI/2,i%8===0?1.12:1.7,{role:'jordan-procession'});}
 // The fixed bearers represent the text's standing phase. Only bank composite
 // characters are interlocutors; the Ark is never an inventory or openable item.
 for(const side of [-1,1])for(const z of [-16.15,-13.85])k.person(side*.635,.05,z,0,side<0?0:Math.PI,1.7,{role:'ark-bearer'});
 return height;
}

export function attachJordanExploration(scene,k,{blenderAssets=false,onReady=()=>{},assetLoader}={}){
 const boxes=[...k.collisionBoxes,{min:[-4,-.2,-20],max:[4,4,-9]}];
 for(const d of jordanObjects){const [x,y,z]=d.position;boxes.push({min:[x-(d.id==='jordan-stones'?1.65:.95),jordanFloor(x),z-(d.id==='jordan-stones'?1.1:.67)],max:[x+(d.id==='jordan-stones'?1.65:.95),y+1.5,z+(d.id==='jordan-stones'?1.1:.67)]});}
 const options={proxies:[],navigationStep:.8},walkModel=createWalkModel(boxes,jordanSurfaces,jordanFloor,options);
 const campModel=createWalkModel(boxes,jordanCampSurface,jordanFloor,options),convoyModel=createWalkModel(boxes,jordanConvoySurface,jordanFloor,options);
 const camp=createNPCSystem({actors:k.actors.filter(a=>a.role==='east-resident'||a.role==='west-resident'),model:campModel,playerModel:walkModel,pois:jordanPOIs,seed:30426,spawnCandidates:jordanSpawnCandidates,spawnExclusion:jordanSpawn,allowRetreat:true});
 const convoy=createConvoySystem({actors:k.actors.filter(a=>a.role==='jordan-procession'),pois:jordanConvoyPOIs,model:convoyModel,playerModel:walkModel,spawn:jordanSpawn,seed:31726});
 const objects=jordanObjects.map(d=>{const root=createVessel(d.id,{blenderAssets,onReady,assetLoader});root.position.fromArray(d.position);scene.add(root);return {...d,root};});
 const coveredArk=createVessel('jordan-carrying',{blenderAssets,onReady,assetLoader});coveredArk.name='jordan-covered-ark-standing';coveredArk.scale.setScalar(2);coveredArk.position.set(0,1.17,-15);scene.add(coveredArk);
 const npcSystem={agents:[...camp.agents,...convoy.agents],pois:[...camp.pois,...convoy.pois],reservations:new Map([...camp.reservations,...convoy.reservations]),
  update:(dt,options)=>{camp.update(dt,options);convoy.update(dt,options);},constrainPlayer:(from,to)=>camp.constrainPlayer(from,convoy.constrainPlayer(from,to)),constrainAirPlayer:(from,to)=>camp.constrainAirPlayer(from,convoy.constrainAirPlayer(from,to)),safePlayerSpawn:p=>camp.safePlayerSpawn(p),suspend:()=>{camp.suspend();convoy.suspend();},dispose:()=>{camp.dispose();convoy.dispose();}};
 return {walkModel,npcSystem,objects};
}
