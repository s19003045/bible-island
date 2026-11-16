// Prepared next-island scenes; not registered in the live application yet.
import * as THREE from 'three';
import {createWalkModel} from './walk-model.js';
import {createNPCSystem} from './npc-system.js';
import {createVessel} from './vessels.js';
import {ruthFloor,ruthObjects,ruthSegmentById,ruthPOIs,ruthSpawnCandidates} from './ruth-exploration.js';

export function buildRuthScene(k,scene,segment){
 const s=ruthSegmentById.get(segment)||ruthSegmentById.get('field'),floor=(x,z)=>ruthFloor(s.id,x,z);
 const height=(x,z)=>floor(x,z)+THREE.MathUtils.smoothstep(Math.max(Math.abs(x)-38,Math.abs(z)-42),0,110)*(5+12*Math.sin(x*.018+z*.009)**2+7*Math.cos(z*.023)**2);
 const earth=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1});
 function ground(size,divisions,near){const g=new THREE.PlaneGeometry(size,size,divisions,divisions);g.rotateX(-Math.PI/2);const p=g.attributes.position,colors=[];for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),c=new THREE.Color(s.id==='field'?'#a69f7d':s.id==='floor'?'#aa9b7e':'#aaa28c');c.offsetHSL(0,0,.025*Math.sin(x*.19)*Math.cos(z*.17));p.setY(i,height(x,z)-(near?.009:.04));colors.push(c.r,c.g,c.b);}const index=[];for(let i=0;i<g.index.count;i+=3){const ids=[g.index.getX(i),g.index.getX(i+1),g.index.getX(i+2)],x=ids.reduce((v,j)=>v+p.getX(j),0)/3,z=ids.reduce((v,j)=>v+p.getZ(j),0)/3;if(!near&&Math.abs(x)<44&&Math.abs(z)<44)continue;index.push(...ids);}g.setIndex(index);g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();const m=new THREE.Mesh(g,earth);m.name=near?'ruth-observation-ground':'ruth-original-landscape-'+s.id;m.receiveShadow=true;scene.add(m);}
 ground(1500,180,false);ground(96,128,true);
 const block=(x,y,z,w,h,d)=>k.collisionBoxes.push({min:[x-w/2,y,z-d/2],max:[x+w/2,y+h,z+d/2]});
 function path(points,width){const curve=new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,0,z))),v=[],f=[];for(let i=0;i<=100;i++){const p=curve.getPoint(i/100),t=curve.getTangent(i/100);for(const side of [-1,1]){const x=p.x+t.z*width*.5*side,z=p.z-t.x*width*.5*side;v.push(x,height(x,z)+.018,z);}if(i){const j=(i-1)*2;f.push(j,j+2,j+3,j,j+3,j+1);}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(f);g.computeVertexNormals();const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:'#c0ad8c',roughness:1}));m.name='ruth-worn-path';m.receiveShadow=true;scene.add(m);}
 path([[19,48],[15,26],[10,16],[6,6],[7,-17],[1,-31]],2.4);path([[-34,18],[-16,13],[-5,10],[15,10],[37,3]],1.8);
 function tree(x,z,scale=1){const y=height(x,z);k.beam('trunk',[x,y,z],[x+.2,y+3.2*scale,z],.18*scale);for(let i=0;i<9;i++){const a=i*2.4,end=[x+Math.cos(a)*(1.1+i%3*.35)*scale,y+(3+i%3*.38)*scale,z+Math.sin(a)*(1.1+i%3*.35)*scale];k.beam('trunk',[x,y+1.7*scale,z],end,.06*scale);for(let j=0;j<70;j++)k.part('leaf','leaf',end[0]+(k.rand()-.5)*2*scale,end[1]+(k.rand()-.5)*.8*scale,end[2]+(k.rand()-.5)*2*scale,.15*scale,1,1,k.rand(),k.rand()*6.28,k.rand());}block(x,y,z,.6,3,.6);}
 function house(x,z,w=8,d=7,h=3.3){const y=height(x,z);k.house(x,y,z,w,d,h,'stone');block(x,y-.2,z,w+2,h+1,d+2);}
 function shade(x,z){const y=height(x,z);for(const dx of [-2.2,2.2])for(const dz of [-1.5,1.5]){k.cyl('wood',x+dx,y+1.1,z+dz,.05,2.2);block(x+dx,y,z+dz,.2,2.3,.2);}for(let i=0;i<14;i++)k.box('reed',x,y+2.2,z-1.5+i*3/13,4.7,.04,.12);}
 function supplies(x,z){const y=height(x,z);k.jar(x,y,z,.45);k.jar(x+.7,y,z,.35);k.box('linen',x+1.3,y+.14,z,.65,.28,.5);block(x+.65,y,z,2.4,1.2,1.2);}
 function ears(cx,cz,w,d,cut=false){for(let row=0;row<12;row++){const z=cz-d/2+row*d/12;for(let i=0;i<24;i++){const x=cx-w/2+i*w/24+(k.rand()-.5)*.2,y=height(x,z),h=cut?.15:.65+k.rand()*.45;k.beam('reed',[x,y,z],[x+.04,y+h,z],.012);if(!cut)for(let q=0;q<7;q++){const a=q*2.4;k.part('leaf','reed',x+Math.cos(a)*.035,y+h+q*.022,z+Math.sin(a)*.035,.1,1,1,.1,a,.3);k.beam('reed',[x,y+h+q*.02,z],[x+Math.cos(a)*.065,y+h+.15+q*.02,z+Math.sin(a)*.065],.003);}}}}
 if(s.id==='field'){
  for(const [x,z,w,d,cut] of [[-44,-2,20,30,false],[-45,34,24,26,true],[43,3,22,30,false],[47,41,26,28,true],[-52,-44,30,25,false],[46,-39,27,25,false]])ears(x,z,w,d,cut);
  for(const [x,z,scale] of [[-23,17,1.2],[34,20,1],[-37,-24,1.1],[31,-29,.9],[-12,38,.9]])tree(x,z,scale);
  shade(-25,15);supplies(-24,12);house(4,-33,8,7,3.1);house(35,-23,7,6,3);
  for(const [x,z] of [[-25,-14],[34,7],[-30,29]]){const y=height(x,z);for(let j=0;j<16;j++)k.beam('reed',[x+(j%4)*.04,y,z+Math.floor(j/4)*.03],[x+.3+(j%4)*.04,y+.75,z+.2+Math.floor(j/4)*.03],.013);block(x+.2,y,z+.1,1,1.2,1);}
 }else if(s.id==='floor'){
  // Public teaching observation only. No sleeper, bed or intimate action model.
  const patch=new THREE.Mesh(new THREE.CircleGeometry(8.5,64).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({color:'#9c8c6b',roughness:1}));patch.position.set(-27,height(-27,-15)+.016,-15);patch.name='ruth-public-grain-work-ground';scene.add(patch);block(-27,height(-27,-15),-15,17,1,17);
  for(const [x,z] of [[-28,-17],[-25,-13],[-31,-12]]){const y=height(x,z);k.ball('sand',x,y+.3,z,2.5,.6,2);supplies(x-2,z);}
  house(4,-31,10,8,3.4);house(36,-12,8,8,3.2);house(-31,25,7,6,3.1);shade(33,9);supplies(33,13);for(const [x,z,scale] of [[-23,6,1.2],[32,25,1],[-16,37,.9],[30,-29,1]])tree(x,z,scale);
 }else{
  const x=0,z=-27,y=height(x,z);for(const side of [-1,1]){k.wall(x+side*2.6,y,z,2,4.2,3,'x','stone',.8,.4);block(x+side*2.6,y,z,2,4.4,3);}for(const dz of [-1,0,1])k.beam('wood',[-2.1,y+4.1,z+dz],[2.1,y+4.1,z+dz],.16);
  for(const side of [-1,1]){k.wall(side*16,y-.3,z,23,3.7,1.2,'x','stone',1.1,.45);block(side*16,y-.3,z,23,4,1.2);}const gate=new THREE.Group();gate.name='ruth-original-public-gate-comparison';scene.add(gate);
  house(-20,-44,9,8,3.5);house(19,-45,10,8,3.6);house(37,-30,8,7,3.2);house(-35,29,8,7,3.2);shade(35,9);supplies(33,12);
  for(const [x,z] of [[-22,-12],[32,-11]]){const y=height(x,z);k.box('stone',x,y+.43,z,4.5,.3,1.1);for(const dx of [-1.5,1.5])k.box('stone',x+dx,y+.2,z,.55,.4,.8);block(x,y,z,4.5,.8,1.1);}
  for(const [x,z,scale] of [[-25,12,1.2],[34,26,1],[-20,37,1],[-36,-30,1.1]])tree(x,z,scale);
 }
 const ty=height(-5,7);k.box('wood',-5,ty+.76,7,1.8,.1,1.25);for(const x of [-5.72,-4.28])for(const z of [6.55,7.45])k.box('wood',x,ty+.36,z,.075,.72,.075);block(-5,ty,7,1.8,.83,1.25);
 for(let i=0;i<12;i++){const x=i<6?-13+(i%3)*6:10+(i%3)*6,z=i%2?21:-2;k.person(x,floor(x,z),z,i,0,i%6===0?1.12:1.7,{role:'ruth-resident'});}
 const marker=new THREE.Group();marker.name='ruth-chapter-'+s.id;scene.add(marker);return height;
}
export function attachRuthExploration(scene,k,segment,{blenderAssets=false,onReady=()=>{},assetLoader}={}){const s=ruthSegmentById.get(segment)||ruthSegmentById.get('field'),floor=(x,z)=>ruthFloor(s.id,x,z),walkModel=createWalkModel([...k.collisionBoxes],s.surfaces,floor,{proxies:[],navigationStep:.55}),npcSystem=createNPCSystem({actors:k.actors,model:walkModel,pois:ruthPOIs(s.id),seed:22026+s.number*727,spawnCandidates:ruthSpawnCandidates(s.id),spawnExclusion:s.spawn,allowRetreat:true}),objects=ruthObjects.filter(o=>o.segment===s.id).map(d=>{const root=createVessel(d.id,{blenderAssets,onReady,assetLoader});root.position.fromArray(d.position);scene.add(root);return {...d,root};});return {walkModel,npcSystem,objects};}
