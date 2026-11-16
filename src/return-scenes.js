import * as THREE from 'three';
import {createWalkModel} from './walk-model.js';
import {createNPCSystem} from './npc-system.js';
import {createVessel} from './vessels.js';
import {returnFloor,returnObjects,returnSegmentById,returnPOIs,returnSpawnCandidates} from './return-exploration.js';
export function buildReturnScene(k,scene,segment){
 const chapter=returnSegmentById.get(segment)||returnSegmentById.get('foundation');
 const height=(x,z)=>returnFloor(x,z)+THREE.MathUtils.smoothstep(Math.max(Math.abs(x)-36,Math.abs(z)-43),0,75)*(14+12*Math.sin(x*.025+z*.018)**2+6*Math.sin(z*.04));
 const g=new THREE.PlaneGeometry(500,500,140,140);g.rotateX(-Math.PI/2);const a=g.attributes.position,c=[];
 for(let i=0;i<a.count;i++){const x=a.getX(i),z=a.getZ(i);a.setY(i,height(x,z));const col=new THREE.Color(Math.abs(x)<34&&z>-30&&z<37?'#9f8e70':'#88836a');col.offsetHSL(0,0,Math.sin(x*.055+z*.018)*Math.cos(z*.037)*.035);c.push(col.r,col.g,col.b);}
 g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));g.computeVertexNormals();const ground=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));ground.name='return-terraced-ground';ground.receiveShadow=true;scene.add(ground);
 // Separate states of the same teaching footprint, never all stages in one frame.
 const stage=chapter.number,base=returnFloor(0,0);const marker=new THREE.Group();marker.name=`return-stage-${chapter.id}`;scene.add(marker);
 k.box('court',0,base-.10,-8,18,.2,30);
 const wallH=stage===1?.65:stage===2?3.6:8;
 k.wall(-6,base,-9,24,wallH,.8,'z','light',1.6,.42);k.wall(6,base,-9,24,wallH,.8,'z','light',1.6,.42);k.wall(0,base,-21,12,wallH,.8,'x','light',1.6,.42);
 if(stage>1){k.wall(-4.1,base,3,3.8,wallH,.8,'x','light',1.6,.42);k.wall(4.1,base,3,3.8,wallH,.8,'x','light',1.6,.42);if(stage===3){k.box('stone',0,base+5.8,3,4.4,4.4,.8);k.box('black',0,base+1.8,3.02,4.3,3.6,.82);for(let i=0;i<9;i++)k.box('wood',0,base+8.05,-20+i*2.7,12.8,.25,.25);k.box('plaster',0,base+8.24,-9,12.8,.22,24.8);}}
 else for(let i=0;i<15;i++)k.box('darkstone',-4.8+(i%5)*2.4,base+.15,-18+Math.floor(i/5)*6,1.8,.3,1.3);
 // The altar's chosen form and size illustrate sequence, not an excavated object.
 k.box('stone',0,base+.9,9,3.4,1.8,3.4);k.box('darkstone',0,base+1.85,9,3.6,.14,3.6);
 if(stage===2)for(const x of [-9.2,9.2]){
  for(const z of [-18,-12,-6,0]){k.beam('wood',[x,base,z],[x,base+5.1,z],.085);k.beam('wood',[x,base,z],[x,base+4.4,z+4],.06);}
  for(const y of [1.8,3.9])k.box('wood',x,base+y,-9,1.5,.12,20);
 }
 // Materials are outside the player lane; workers do not mime non-existent tools.
 for(let i=0;i<14;i++){const x=-20+(i%4)*1.3,z=-5+Math.floor(i/4)*1.1;k.box('darkstone',x,returnFloor(x,z)+.28,z,1.15,.55,.9);}
 for(let i=0;i<5;i++)k.box('wood',21+i*.45,base+.14,-2, .32,.28,7);
 for(let i=0;i<5;i++){k.box('terra',-18+i*.75,base+.3,10,.45,.6,.45);k.jar(16+i*.65,base,9,.48);}
 for(const [x,z,w,d] of [[-42,26,7,6],[-43,13,6,7],[-39,-5,7,6],[-44,-26,8,6],[41,28,7,6],[43,13,6,7],[39,-8,8,7],[44,-27,7,6],[-61,-11,8,7],[59,-20,7,6]])k.house(x,height(x,z),z,w,d,3.2,'mud');
 for(const x of [-33,33])k.wall(x,returnFloor(x,0),-3,42,1.1,.7,'z','darkstone',1.5,.38);
 for(const [x,z] of [[-21,-45],[18,-48],[-54,-43],[54,-47]])k.house(x,height(x,z),z,7,6,3.1,'mud');
 for(const [x,z] of [[-35,38],[36,38],[-37,-37],[37,-36],[-57,26],[58,29],[-42,-41],[44,-42],[-49,36],[50,37],[-68,-25],[69,-29]])k.olive(x,height(x,z),z,.85);
 for(let i=0;i<38;i++){const x=(i%2?1:-1)*(48+k.rand()*45),z=-60+k.rand()*120;k.ball('darkstone',x,height(x,z)-.15,z,.7+k.rand(),.6+k.rand()*.5,.8+k.rand());}
 const object=returnObjects.find(o=>o.segment===chapter.id);k.box('wood',object.position[0],object.position[1]-.06,object.position[2],1.9,.12,1.3);for(const side of [-1,1])k.box('wood',object.position[0]+side*.74,object.position[1]-.43,object.position[2],.09,.74,1);
 for(let i=0;i<12;i++){const x=i<6?-25+(i%3)*7:12+(i%3)*6,z=i%2?29:12;k.person(x,returnFloor(x,z),z,i,0,i%6===0?1.12:1.7,{role:'return-resident'});}
 return height;
}
export function attachReturnExploration(scene,k,segment,{blenderAssets=false,onReady=()=>{},assetLoader}={}){
 const chapter=returnSegmentById.get(segment)||returnSegmentById.get('foundation'),data=returnObjects.filter(o=>o.segment===chapter.id);
 const boxes=[...k.collisionBoxes,{min:[-8,0,-23],max:[8,13,11]},{min:[-20.7,1.25,-5.6],max:[-15.4,2.1,-.8]},{min:[20.6,1.25,-5.7],max:[23.2,1.7,1.7]}];
 for(const d of data){const [x,y,z]=d.position;boxes.push({min:[x-.99,returnFloor(x,z),z-.69],max:[x+.99,y+1.2,z+.69]});}
 const walkModel=createWalkModel(boxes,chapter.surfaces,returnFloor,{proxies:[],navigationStep:.55});
 const pois=returnPOIs.map(p=>({...p,weight:p.id===`return-${chapter.id==='foundation'?'west-table':'east-table'}`?1.6:p.weight}));
 const npcSystem=createNPCSystem({actors:k.actors,model:walkModel,pois,seed:63026+chapter.number*571,spawnCandidates:returnSpawnCandidates,spawnExclusion:chapter.spawn,allowRetreat:true});
 const objects=data.map(d=>{const root=createVessel(d.id,{blenderAssets,onReady,assetLoader});root.position.fromArray(d.position);scene.add(root);return {...d,root};});
 return {walkModel,npcSystem,objects};
}
