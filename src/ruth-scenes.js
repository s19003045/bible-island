import * as THREE from 'three';
import {createWalkModel} from './walk-model.js';
import {createNPCSystem} from './npc-system.js';
import {createVessel} from './vessels.js';
import {ruthFloor,ruthObjects,ruthSegmentById,ruthPOIs,ruthSpawnCandidates} from './ruth-exploration.js';

export function buildRuthScene(k,scene,segment){
 const s=ruthSegmentById.get(segment)||ruthSegmentById.get('field'),floor=(x,z)=>ruthFloor(s.id,x,z);
 const height=(x,z)=>floor(x,z)+THREE.MathUtils.smoothstep(Math.max(Math.abs(x)-38,Math.abs(z)-42),0,110)*(5+12*Math.sin(x*.018+z*.009)**2+7*Math.cos(z*.023)**2);
 const earth=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1});
 function ground(size,divisions,near){const g=new THREE.PlaneGeometry(size,size,divisions,divisions);g.rotateX(-Math.PI/2);const p=g.attributes.position,colors=[];for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),c=new THREE.Color(s.id==='field'?'#8f956f':s.id==='floor'?'#9e9877':'#a19c83');c.offsetHSL(0,0,.035*Math.sin(x*.09)*Math.cos(z*.08)+.015*Math.sin(x*.31+z*.15));p.setY(i,height(x,z)-(near?.009:.04));colors.push(c.r,c.g,c.b);}const index=[];for(let i=0;i<g.index.count;i+=3){const ids=[g.index.getX(i),g.index.getX(i+1),g.index.getX(i+2)],x=ids.reduce((v,j)=>v+p.getX(j),0)/3,z=ids.reduce((v,j)=>v+p.getZ(j),0)/3;if(!near&&Math.abs(x)<44&&Math.abs(z)<44)continue;index.push(...ids);}g.setIndex(index);g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();const m=new THREE.Mesh(g,earth);m.name=near?'ruth-observation-ground':'ruth-original-landscape-'+s.id;m.receiveShadow=true;scene.add(m);}
 ground(1500,180,false);ground(96,128,true);
 const block=(x,y,z,w,h,d)=>k.collisionBoxes.push({min:[x-w/2,y,z-d/2],max:[x+w/2,y+h,z+d/2]});
 function path(points,width){const curve=new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,0,z))),v=[],f=[];for(let i=0;i<=100;i++){const p=curve.getPoint(i/100),t=curve.getTangent(i/100);for(const side of [-1,1]){const x=p.x+t.z*width*.5*side,z=p.z-t.x*width*.5*side;v.push(x,height(x,z)+.018,z);}if(i){const j=(i-1)*2;f.push(j,j+2,j+3,j,j+3,j+1);}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(f);g.computeVertexNormals();const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:'#c0ad8c',roughness:1}));m.name='ruth-worn-path';m.receiveShadow=true;scene.add(m);}
 path([[19,48],[15,26],[10,16],[6,6],[7,-17],[1,-31]],2.4);path([[-34,18],[-16,13],[-5,10],[15,10],[37,3]],1.8);
 function tree(x,z,scale=1){const y=height(x,z);k.beam('trunk',[x,y,z],[x+.2,y+3.2*scale,z],.18*scale);for(let i=0;i<9;i++){const a=i*2.4,end=[x+Math.cos(a)*(1.1+i%3*.35)*scale,y+(3+i%3*.38)*scale,z+Math.sin(a)*(1.1+i%3*.35)*scale];k.beam('trunk',[x,y+1.7*scale,z],end,.06*scale);for(let j=0;j<70;j++)k.part('leaf','leaf',end[0]+(k.rand()-.5)*2*scale,end[1]+(k.rand()-.5)*.8*scale,end[2]+(k.rand()-.5)*2*scale,.15*scale,1,1,k.rand(),k.rand()*6.28,k.rand());}block(x,y,z,.6,3,.6);}
 function house(x,z,w=8,d=7,h=3.3){const y=height(x,z);k.house(x,y,z,w,d,h,'stone');block(x,y-.2,z,w+2,h+1,d+2);}
 function shade(x,z){const y=height(x,z);for(const dx of [-2.2,2.2])for(const dz of [-1.5,1.5]){k.cyl('wood',x+dx,y+1.1,z+dz,.05,2.2);block(x+dx,y,z+dz,.2,2.3,.2);}for(let i=0;i<14;i++)k.box('reed',x,y+2.2,z-1.5+i*3/13,4.7,.04,.12);}
 function supplies(x,z){const y=height(x,z);k.jar(x,y,z,.45);k.jar(x+.7,y,z,.35);k.box('linen',x+1.3,y+.14,z,.65,.28,.5);block(x+.65,y,z,2.4,1.2,1.2);}
 const cropStems=[],cropHeads=[];
 function ears(cx,cz,w,d,cut=false){
  const patch=new THREE.PlaneGeometry(w,d,12,16);patch.rotateX(-Math.PI/2);const points=patch.attributes.position;for(let i=0;i<points.count;i++)points.setY(i,height(cx+points.getX(i),cz+points.getZ(i))+.012);patch.computeVertexNormals();const bed=new THREE.Mesh(patch,new THREE.MeshStandardMaterial({color:cut?'#a49a71':'#aaa16b',roughness:1}));bed.position.set(cx,0,cz);bed.name=cut?'ruth-cut-field':'ruth-standing-cereal-field';bed.receiveShadow=true;scene.add(bed);
  const rows=Math.ceil(d/.48),columns=Math.ceil(w/.44);for(let row=0;row<rows;row++)for(let i=0;i<columns;i++){const z=cz-d/2+(row+.3+k.rand()*.3)*d/rows,x=cx-w/2+(i+.3+k.rand()*.3)*w/columns,y=height(x,z),h=cut?.12+k.rand()*.1:.7+k.rand()*.35;cropStems.push([x,y+h/2,z,h]);if(!cut)cropHeads.push([x,y+h,z,k.rand()*Math.PI]);}
 }
 function finishCrops(){const dummy=new THREE.Object3D();for(const [name,data,geometry,material] of [['stems',cropStems,new THREE.CylinderGeometry(.009,.012,1,5),new THREE.MeshStandardMaterial({color:'#aa9759',roughness:1})],['heads',cropHeads,new THREE.SphereGeometry(1,6,4),new THREE.MeshStandardMaterial({color:'#c3ae70',roughness:1})]]){const m=new THREE.InstancedMesh(geometry,material,data.length);m.name='ruth-cereal-'+name;data.forEach(([x,y,z,h],i)=>{dummy.position.set(x,y,z);dummy.rotation.set(0,name==='heads'?h:0,name==='heads'?.12:0);dummy.scale.set(name==='heads'?.036:1,name==='heads'?.12:h,name==='heads'?.03:1);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);});m.receiveShadow=true;m.castShadow=false;m.computeBoundingSphere();scene.add(m);}}
 if(s.id==='field'){
  for(const [x,z,w,d,cut] of [[-44,-2,20,30,false],[-45,34,24,26,true],[43,3,22,30,false],[47,41,26,28,true],[-52,-44,30,25,false],[46,-39,27,25,false],[-25,8,12,22,false],[0,-37,23,17,false],[-11,44,22,17,true]])ears(x,z,w,d,cut);
  for(const [x,z,scale] of [[-23,17,1.2],[34,20,1],[-37,-24,1.1],[31,-29,.9],[-12,38,.9]])tree(x,z,scale);
  shade(-25,22);supplies(-24,26);house(4,-55,8,7,3.1);house(35,-23,7,6,3);house(24,-52,9,7,3.3);house(-21,-57,7,7,3);house(37,38,7,6,3);for(const [x,z] of [[-20,1],[32,-3],[-19,34],[16,37]])tree(x,z,.9);for(const [x,z] of [[-32,13],[32,8],[-23,-38]]){const y=height(x,z);k.wall(x,y,z,16,.5,.55,'z','stone',.7,.25);block(x,y,z,.8,.6,16);}
  for(const [x,z] of [[-25,-14],[34,7],[-30,29]]){const y=height(x,z);for(let j=0;j<16;j++)k.beam('reed',[x+(j%4)*.04,y,z+Math.floor(j/4)*.03],[x+.3+(j%4)*.04,y+.75,z+.2+Math.floor(j/4)*.03],.013);block(x+.2,y,z+.1,1,1.2,1);}
 }else if(s.id==='floor'){
  // Public teaching observation only. No sleeper, bed or intimate action model.
  const patch=new THREE.Mesh(new THREE.CircleGeometry(8.5,64).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({color:'#9c8c6b',roughness:1}));patch.position.set(-27,height(-27,-15)+.016,-15);patch.name='ruth-public-grain-work-ground';scene.add(patch);block(-27,height(-27,-15),-15,17,1,17);
  for(const [x,z] of [[-28,-17],[-25,-13],[-31,-12]]){const y=height(x,z);k.ball('sand',x,y+.3,z,2.5,.6,2);supplies(x-2,z);}
  house(4,-31,10,8,3.4);house(18,-43,9,8,3.2);house(-14,-46,8,7,3.3);house(36,-12,8,8,3.2);house(-31,25,7,6,3.1);shade(33,9);supplies(33,13);for(const [x,z,scale] of [[-23,6,1.2],[32,25,1],[-16,37,.9],[30,-29,1]])tree(x,z,scale);
 }else{
  const x=0,z=-27,y=height(x,z);for(const side of [-1,1]){k.wall(x+side*2.6,y,z,2,4.2,3,'x','stone',.8,.4);block(x+side*2.6,y,z,2,4.4,3);}for(const dz of [-1,0,1])k.beam('wood',[-2.1,y+4.1,z+dz],[2.1,y+4.1,z+dz],.16);
  for(const side of [-1,1]){k.wall(side*16,y-.3,z,23,3.7,1.2,'x','stone',1.1,.45);block(side*16,y-.3,z,23,4,1.2);}const gate=new THREE.Group();gate.name='ruth-original-public-gate-comparison';scene.add(gate);
  house(-20,-44,9,8,3.5);house(19,-45,10,8,3.6);house(-5,-49,8,7,3.4);house(8,-59,9,7,3.5);house(-27,-61,9,7,3.3);house(37,-30,8,7,3.2);house(-35,29,8,7,3.2);shade(35,9);supplies(33,12);
  for(const [x,z] of [[-22,-12],[32,-11]]){const y=height(x,z);k.box('stone',x,y+.43,z,4.5,.3,1.1);for(const dx of [-1.5,1.5])k.box('stone',x+dx,y+.2,z,.55,.4,.8);block(x,y,z,4.5,.8,1.1);}
  for(const [x,z,scale] of [[-25,12,1.2],[34,26,1],[-20,37,1],[-36,-30,1.1]])tree(x,z,scale);
 }
 finishCrops();
 const ty=height(-5,7);k.box('wood',-5,ty+.76,7,1.8,.1,1.25);for(const x of [-5.72,-4.28])for(const z of [6.55,7.45])k.box('wood',x,ty+.36,z,.075,.72,.075);block(-5,ty,7,1.8,.83,1.25);
 for(let i=0;i<12;i++){const x=i<6?-13+(i%3)*6:10+(i%3)*6,z=i%2?21:-2;k.person(x,floor(x,z),z,i,0,i%6===0?1.12:1.7,{role:'ruth-resident'});}
 const marker=new THREE.Group();marker.name='ruth-chapter-'+s.id;scene.add(marker);return height;
}
export function attachRuthExploration(scene,k,segment,{blenderAssets=false,onReady=()=>{},assetLoader}={}){const s=ruthSegmentById.get(segment)||ruthSegmentById.get('field'),floor=(x,z)=>ruthFloor(s.id,x,z),walkModel=createWalkModel([...k.collisionBoxes],s.surfaces,floor,{proxies:[],navigationStep:.55}),npcSystem=createNPCSystem({actors:k.actors,model:walkModel,pois:ruthPOIs(s.id),seed:22026+s.number*727,spawnCandidates:ruthSpawnCandidates(s.id),spawnExclusion:s.spawn,allowRetreat:true}),objects=ruthObjects.filter(o=>o.segment===s.id).map(d=>{const root=createVessel(d.id,{blenderAssets,onReady,assetLoader});root.position.fromArray(d.position);scene.add(root);return {...d,root};});return {walkModel,npcSystem,objects};}
