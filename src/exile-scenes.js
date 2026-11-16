import * as THREE from 'three';
import {createWalkModel} from './walk-model.js';
import {createNPCSystem} from './npc-system.js';
import {createVessel} from './vessels.js';
import {exileFloor,exileSegmentById,exileObjects,exilePOIs,exileSpawnCandidates} from './exile-exploration.js';

// Original chapter environments, not a continuous deportation route or surveyed Babylonian settlement.
export function buildExileScene(k,scene,segment){
 const s=exileSegmentById.get(segment)||exileSegmentById.get('road'),floor=(x,z)=>exileFloor(s.id,x,z),upland=s.id==='road';
 const height=(x,z)=>floor(x,z)+(upland?THREE.MathUtils.smoothstep(Math.max(Math.abs(x)-39,Math.abs(z)-43),0,115)*(7+15*Math.sin(x*.015+z*.008)**2):THREE.MathUtils.smoothstep(Math.max(Math.abs(x)-44,Math.abs(z)-50),0,250)*1.4)-(s.id==='canal'&&z>-115&&z<95?1.2*(1-THREE.MathUtils.smoothstep(Math.abs(x+43),7,12)):0);
 const ownedMaterials=new Set(),material=options=>{const m=new THREE.MeshStandardMaterial(options);ownedMaterials.add(m);return m;};
 const materials=material({vertexColors:true,roughness:1});
 function ground(size,n,near){const g=new THREE.PlaneGeometry(size,size,n,n);g.rotateX(-Math.PI/2);const p=g.attributes.position,colors=[];
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),c=new THREE.Color(upland?'#a49c82':s.id==='canal'?'#929981':'#a2997c');c.offsetHSL(0,0,.03*Math.sin(x*.11)*Math.cos(z*.13));p.setY(i,height(x,z)-(near?.008:.04));colors.push(c.r,c.g,c.b);}
  const indices=[];for(let i=0;i<g.index.count;i+=3){const ids=[g.index.getX(i),g.index.getX(i+1),g.index.getX(i+2)],x=ids.reduce((v,j)=>v+p.getX(j),0)/3,z=ids.reduce((v,j)=>v+p.getZ(j),0)/3;if(!near&&Math.abs(x)<44&&Math.abs(z)<44)continue;indices.push(...ids);}
  g.setIndex(indices);g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();const m=new THREE.Mesh(g,materials);m.name=near?'exile-public-ground':'exile-landscape-'+s.id;m.receiveShadow=true;scene.add(m);
 }ground(1500,200,false);ground(96,128,true);
 const block=(x,y,z,w,h,d)=>k.collisionBoxes.push({min:[x-w/2,y,z-d/2],max:[x+w/2,y+h,z+d/2]});
 function marker(name){const g=new THREE.Group();g.name=name;scene.add(g);return g;}
 function path(points,width){const curve=new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,0,z))),v=[],f=[];for(let i=0;i<=100;i++){const p=curve.getPoint(i/100),t=curve.getTangent(i/100);for(const side of [-1,1]){const x=p.x+t.z*width*.5*side,z=p.z-t.x*width*.5*side;v.push(x,height(x,z)+.016,z);}if(i){const j=(i-1)*2;f.push(j,j+2,j+3,j,j+3,j+1);}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(f);g.computeVertexNormals();const m=new THREE.Mesh(g,material({color:'#b7a788',roughness:1}));m.name='exile-public-path';m.receiveShadow=true;scene.add(m);}
 function house(x,z,w=8,d=7,h=3.4){const y=height(x,z),t=.42,door=1.2;
  // Ordinary original earth/plaster construction; not an identified house, ownership or dated plan.
  k.box('sand',x,y-.12,z,w+.25,.24,d+.25);k.box('plaster',x,y+h/2,z-d/2,w,h,t);for(const side of [-1,1]){k.box('plaster',x+side*(w/2-t/2),y+h/2,z,t,h,d);k.wall(x+side*(w+door)/4,y,z+d/2,(w-door)/2,h,t,'x','sand',.55,.22);}k.box('plaster',x,y+2.25+(h-2.25)/2,z+d/2,door+.05,h-2.25,t);k.box('wood',x,y+2.18,z+d/2,door+.25,.14,.6);k.box('black',x,y+1,z+d/2-.25,door,2,.02);
  for(let i=0;i<6;i++)k.box('wood',x-w*.44+i*w*.88/5,y+h,z,.1,.16,d);k.box('sand',x,y+h+.13,z,w+.2,.16,d+.2);for(const side of [-1,1]){k.box('plaster',x+side*w/2,y+h+.35,z,.22,.35,d);k.box('black',x+side*w*.31,y+2.5,z+d/2+.23,.35,.38,.02);for(const dx of [-.11,.11])k.box('wood',x+side*w*.31+dx,y+2.5,z+d/2+.25,.022,.38,.03);}for(const dz of [-d/2,d/2])k.box('plaster',x,y+h+.35,z+dz,w,.35,.22);block(x,y-.2,z,w+1,h+1,d+1);
  k.wall(x+w*.35,y,z+d/2+2.5,w*.55,.65,.32,'x','sand',.55,.22);block(x+w*.35,y,z+d/2+2.5,w*.55,.8,.4);
  for(let i=0;i<5;i++)k.beam('wood',[x+w/2+.4,y+.12+(i%2)*.1,z-.6+i*.2],[x+w/2+.4,y+.12+(i%2)*.1,z+.8+i*.2],.06);
  k.jar(x+w*.35,y,z+d/2+1.4,.42);k.jar(x+w*.35+.6,y,z+d/2+1.4,.32);
 }
 function tree(x,z,scale=1){const y=height(x,z);k.beam('trunk',[x,y,z],[x+.08,y+3*scale,z],.17*scale);for(let i=0;i<7;i++){const a=i*2.4,end=[x+Math.cos(a)*1.6*scale,y+(2.7+i%3*.35)*scale,z+Math.sin(a)*1.6*scale];k.beam('trunk',[x,y+1.6*scale,z],end,.055*scale);for(let j=0;j<45;j++)k.part('leaf','leaf',end[0]+(k.rand()-.5)*2*scale,end[1]+(k.rand()-.5)*.8*scale,end[2]+(k.rand()-.5)*2*scale,.16*scale,1,1,k.rand(),k.rand()*6.28,k.rand());}block(x,y,z,.7,3*scale,.7);}
 function shade(x,z,w=5){const y=height(x,z);for(const dx of [-w/2,w/2])for(const dz of [-1.6,1.6]){k.cyl('wood',x+dx,y+1.1,z+dz,.05,2.2);block(x+dx,y,z+dz,.18,2.3,.18);}for(let i=0;i<17;i++)k.box('reed',x,y+2.2,z-1.6+i*.2,w+.3,.04,.13);}
 function supplies(x,z){const y=height(x,z);for(let i=0;i<3;i++)k.jar(x+i*.6,y,z,i===1?.3:.42);k.box('linen',x+.4,y+.14,z+.7,.7,.28,.5);block(x+.6,y,z+.35,2.4,1.1,1.7);}
 function bench(x,z,len=4){const y=height(x,z);k.box('wood',x,y+.47,z,len,.12,.65);for(const dx of [-len*.35,len*.35])k.box('wood',x+dx,y+.22,z,.12,.44,.5);block(x,y,z,len,.6,.65);}
 path([[18,45],[17,27],[9,17],[7,1],[2,-24],[-5,-55]],2.4);path([[-30,15],[-17,13],[-5,10],[17,10],[43,4]],1.8);
 let water=null,waterTime=0;
 if(s.id==='road'){
  marker('exile-sequence-context');
  for(const [x,z,w,d,h] of [[-28,-29,10,8,3.5],[3,-40,11,8,3.7],[23,-37,9,7,3.3],[-31,36,8,7,3.2],[40,28,9,8,3.5],[-14,-61,8,7,3.4],[30,-63,9,8,3.5]])house(x,z,w,d,h);
  shade(-26,10,7);shade(35,8,5);bench(-24,17,5);supplies(-27,23);supplies(35,13);
  for(const [x,z,size] of [[-22,30,1.2],[34,-14,1],[-33,-8,1.1],[9,39,.9],[-42,-45,1.1]])tree(x,z,size);
  for(let row=0;row<3;row++)for(let j=0;j<5;j++){const x=-47-row*13,z=-59+j*24,y=height(x,z);k.wall(x,y-.2,z,17,.55,.6,'z','stone',1.1,.3);}
  for(let i=0;i<6;i++){const x=-38+i*1.3,z=-15,y=height(x,z);k.box('stone',x,y+.3,z,1,.5,.7,k.rand()*.6);}
 }else if(s.id==='canal'){
  marker('exile-generic-waterbank-context');
  const waterMaterial=material({color:'#4c7979',roughness:.3,metalness:.1}),g=new THREE.PlaneGeometry(18,194,20,100);g.rotateX(-Math.PI/2);const p=g.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,.015*Math.sin(p.getX(i)*1.2+p.getZ(i)*.25));g.computeVertexNormals();water=new THREE.Mesh(g,waterMaterial);water.position.set(-43,.30,-9);water.name='exile-original-background-water';water.receiveShadow=true;scene.add(water);
  const reeds=[];for(const x of [-54.5,-31.5])for(let i=0;i<95;i++){const z=-104+i*2.05+(k.rand()-.5),y=height(x,z);for(let j=0;j<3;j++)reeds.push([x+(k.rand()-.5)*.7,y,z+(k.rand()-.5)*.7,.7+k.rand()*.6]);}
  const dummy=new THREE.Object3D(),m=new THREE.InstancedMesh(new THREE.CylinderGeometry(.012,.02,1,5),material({color:'#83845a',roughness:1}),reeds.length);reeds.forEach(([x,y,z,h],i)=>{dummy.position.set(x,y+h/2,z);dummy.rotation.z=(k.rand()-.5)*.12;dummy.scale.set(1,h,1);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);});m.name='exile-bank-reeds';m.receiveShadow=true;m.computeBoundingSphere();scene.add(m);
  for(const [x,z,w,d,h] of [[-22,-39,8,7,3.2],[7,-48,9,7,3.3],[35,-33,8,7,3.1],[44,30,8,7,3.3],[24,-67,9,7,3.4]])house(x,z,w,d,h);
  shade(35,9,7);supplies(34,15);bench(-24,20,4);for(const [x,z,size] of [[-25,2,1.2],[-26,34,1],[34,25,1.1],[32,-10,1],[-25,-19,.9],[13,39,1]])tree(x,z,size);
 }else{
  marker('exile-letter-and-orchard-context');
  for(const [x,z,w,d,h] of [[-25,-30,10,8,3.5],[1,-39,9,7,3.3],[21,-35,11,8,3.8],[40,30,9,7,3.4],[-29,36,8,7,3.2],[-18,-61,10,8,3.6],[29,-62,9,8,3.3]])house(x,z,w,d,h);
  shade(-26,9,7);shade(35,9,7);bench(-24,18,5);supplies(-26,23);supplies(34,15);
  const soil=material({color:'#8b7858',roughness:1});for(let row=0;row<3;row++)for(let j=0;j<4;j++){const x=-43-row*8,z=-33+j*18,y=height(x,z),patch=new THREE.Mesh(new THREE.BoxGeometry(5.5,.04,9),soil);patch.position.set(x,y+.01,z);patch.name='exile-original-orchard-ground';patch.receiveShadow=true;scene.add(patch);tree(x,z,.85+k.rand()*.3);}
  for(const [x,z,size] of [[34,-12,1],[-21,2,1.1],[16,39,1]])tree(x,z,size);
 }
 // Layered ordinary settlement in the middle distance, without imperial spectacle.
 for(let row=0;row<3;row++)for(let col=0;col<4;col++)house(-26+col*24+(row%2)*6,-88-row*18,6+k.rand()*3,6+k.rand()*2,3+k.rand());
 for(let i=0;i<12;i++)tree(53+(i%3)*8,-62+i*11,.8+k.rand()*.4);
 const ty=floor(-5,7);k.box('wood',-5,ty+.76,7,1.8,.1,1.25);for(const x of [-5.72,-4.28])for(const z of [6.55,7.45])k.box('wood',x,ty+.36,z,.075,.72,.075);block(-5,ty,7,1.8,.83,1.25);
 for(let i=0;i<12;i++){const x=i<6?-13+(i%3)*6:10+(i%3)*6,z=i%2?21:-2;k.person(x,floor(x,z),z,i,0,i%6===0?1.12:1.7,{role:'exile-resident'});}
 marker('exile-chapter-'+s.id);
 return {height,animate(dt){if(!water||!dt)return;waterTime+=dt;const p=water.geometry.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,.015*Math.sin(p.getX(i)*1.2+p.getZ(i)*.25+waterTime*.55));p.needsUpdate=true;},dispose(){for(const m of ownedMaterials)m.dispose();ownedMaterials.clear();}};
}
export function attachExileExploration(scene,k,segment,{blenderAssets=false,onReady=()=>{},assetLoader}={}){
 const s=exileSegmentById.get(segment)||exileSegmentById.get('road'),floor=(x,z)=>exileFloor(s.id,x,z),walkModel=createWalkModel([...k.collisionBoxes],s.surfaces,floor,{proxies:[],navigationStep:.55}),npcSystem=createNPCSystem({actors:k.actors,model:walkModel,pois:exilePOIs(s.id),seed:15026+s.number*983,spawnCandidates:exileSpawnCandidates(s.id),spawnExclusion:s.spawn,allowRetreat:true}),objects=exileObjects.filter(o=>o.segment===s.id).map(d=>{const root=createVessel(d.id,{blenderAssets,onReady,assetLoader});root.position.fromArray(d.position);scene.add(root);return {...d,root};});return {walkModel,npcSystem,objects};
}
