import * as THREE from 'three';
import {createWalkModel} from './walk-model.js';
import {createNPCSystem} from './npc-system.js';
import {createVessel} from './vessels.js';
import {intertestamentFloor,intertestamentSegmentById,intertestamentObjects,intertestamentPOIs,intertestamentSpawnCandidates} from './intertestament-exploration.js';

// Three original observation settings. No surveyed travel road, temple courtyard or barracks identification.
export function buildIntertestamentScene(k,scene,segment){
 const s=intertestamentSegmentById.get(segment)||intertestamentSegmentById.get('road'),road=s.id==='road',floor=(x,z)=>intertestamentFloor(s.id,x,z);
 const height=(x,z)=>floor(x,z)+THREE.MathUtils.smoothstep(Math.max(Math.abs(x)-39,Math.abs(z)-44),0,140)*(5+13*Math.sin(x*.015+z*.011)**2)-(road?.90*(1-THREE.MathUtils.smoothstep(Math.abs(x+25),1,2.4))*(1-THREE.MathUtils.smoothstep(Math.abs(z+6),57,64)):0);
 const owned=new Set(),material=options=>{const m=new THREE.MeshStandardMaterial(options);owned.add(m);return m;},earth=material({vertexColors:true,roughness:1});
 for(const [size,n,near] of [[1500,160,false],[100,120,true]]){const g=new THREE.PlaneGeometry(size,size,n,n);g.rotateX(-Math.PI/2);const p=g.attributes.position,colors=[],indices=[];
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),c=new THREE.Color(road?'#99977a':s.id==='coin'?'#aea18a':'#aaa18e');c.offsetHSL(0,0,.027*Math.sin(x*.12)*Math.cos(z*.09));p.setY(i,height(x,z)-(near?.008:.04));colors.push(c.r,c.g,c.b);}
  for(let i=0;i<g.index.count;i+=3){const ids=[g.index.getX(i),g.index.getX(i+1),g.index.getX(i+2)],x=ids.reduce((a,j)=>a+p.getX(j),0)/3,z=ids.reduce((a,j)=>a+p.getZ(j),0)/3;if(!near&&Math.abs(x)<45&&Math.abs(z)<45)continue;indices.push(...ids);}
  g.setIndex(indices);g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();const m=new THREE.Mesh(g,earth);m.name=near?'intertestament-public-ground':'intertestament-landscape-'+s.id;m.receiveShadow=true;scene.add(m);
 }
 const marker=name=>{const g=new THREE.Group();g.name=name;scene.add(g);return g;},block=(x,y,z,w,h,d)=>k.collisionBoxes.push({min:[x-w/2,y-.15,z-d/2],max:[x+w/2,y+h,z+d/2]});
 function path(points,width,color='#baaa8d'){const curve=new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,0,z))),v=[],f=[];for(let i=0;i<=90;i++){const p=curve.getPoint(i/90),t=curve.getTangent(i/90);for(const sign of [-1,1]){const x=p.x+sign*t.z*width/2,z=p.z-sign*t.x*width/2;v.push(x,height(x,z)+.016,z);}if(i){const j=(i-1)*2;f.push(j,j+2,j+3,j,j+3,j+1);}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(f);g.computeVertexNormals();const m=new THREE.Mesh(g,material({color,roughness:1}));m.name='intertestament-public-path';m.receiveShadow=true;scene.add(m);}
 function wall(x,y,z,w,h,d=.42){k.box('sand',x,y+h/2,z,w,h,d*.92);k.wall(x,y,z,w,h,d,'x','stone',.70,.30);}
 function house(x,z,w=8,d=7,h=3.3){const corners=[height(x-w/2,z-d/2),height(x+w/2,z-d/2),height(x-w/2,z+d/2),height(x+w/2,z+d/2)],bottom=Math.min(...corners)-.1,y=Math.max(...corners)+.03,t=.42,door=1.2;
  k.box('stone',x,(bottom+y)/2,z,w+.25,y-bottom,d+.25);k.box('plaster',x,y+h/2,z-d/2,w,h,t);for(const sign of [-1,1]){k.box('plaster',x+sign*(w/2-t/2),y+h/2,z,t,h,d);wall(x+sign*(w+door)/4,y,z+d/2,(w-door)/2,h,t);}k.box('plaster',x,y+2.25+(h-2.25)/2,z+d/2,door+.04,h-2.25,t);k.box('wood',x,y+2.2,z+d/2,door+.3,.15,.56);k.box('black',x,y+1,z+d/2-.26,door,2,.02);
  for(let i=0;i<7;i++)k.box('wood',x-w*.43+i*w*.86/6,y+h,z,.13,.15,d+.1);k.box('sand',x,y+h+.12,z,w+.2,.14,d+.2);for(const sign of [-1,1]){k.box('plaster',x+sign*w/2,y+h+.34,z,.23,.35,d);k.box('black',x+sign*w*.31,y+2.5,z+d/2+.23,.34,.36,.02);}for(const dz of [-d/2,d/2])k.box('plaster',x,y+h+.34,z+dz,w,.35,.23);block(x,bottom,z,w+1,h+1+y-bottom,d+1);
  wall(x+w*.25,y,z+d/2+2.8,w*.65,.65,.32);block(x+w*.25,y,z+d/2+2.8,w*.65,.8,.42);k.jar(x+w*.3,y,z+d/2+1.4,.4);k.jar(x+w*.3+.55,y,z+d/2+1.4,.3);
 }
 function tree(x,z,scale=1){const y=height(x,z);k.beam('trunk',[x,y,z],[x+.1,y+3*scale,z],.16*scale);for(let i=0;i<7;i++){const a=i*2.4,end=[x+Math.cos(a)*1.6*scale,y+(2.8+i%3*.3)*scale,z+Math.sin(a)*1.6*scale];k.beam('trunk',[x,y+1.7*scale,z],end,.05*scale);for(let j=0;j<38;j++)k.part('leaf','leaf',end[0]+(k.rand()-.5)*2*scale,end[1]+(k.rand()-.5)*.8*scale,end[2]+(k.rand()-.5)*2*scale,.15*scale,1,1,k.rand(),k.rand()*6.28,k.rand());}block(x,y,z,.7,3.3*scale,.7);}
 function shade(x,z,w=5){const y=height(x,z);for(const dx of [-w/2,w/2])for(const dz of [-1.5,1.5]){k.cyl('wood',x+dx,y+1.1,z+dz,.055,2.2);block(x+dx,y,z+dz,.18,2.3,.18);}for(let i=0;i<16;i++)k.box('reed',x,y+2.2,z-1.5+i*.2,w+.3,.05,.14);}
 function stores(x,z){const y=height(x,z);for(let i=0;i<3;i++)k.jar(x+i*.55,y,z,.32+i*.05);k.box('linen',x+.5,y+.14,z+1,.7,.28,.6);block(x+.6,y,z,2.7,1.4,3);}
 function bench(x,z,w=4){const y=height(x,z);k.box('wood',x,y+.48,z,w,.12,.60);for(const dx of [-w*.36,w*.36])k.box('wood',x+dx,y+.21,z,.12,.42,.50);block(x,y,z,w,.6,.7);}
 function arcade(x,z,count=5){const y=height(x,z),width=(count-1)*4+1;for(let i=0;i<count;i++){const xx=x+(i-(count-1)/2)*4;k.cyl('stone',xx,y+.125,z,.40,.25);k.cyl('plaster',xx,y+1.85,z,.25,3.2);k.box('stone',xx,y+3.55,z,.70,.20,.70);block(xx,y,z,.9,4,.9);}k.box('wood',x,y+3.8,z,width,.30,.68);for(let i=0;i<count;i++)k.box('wood',x+(i-(count-1)/2)*4,y+4,z+1,.12,.1,3);k.box('sand',x,y+4.13,z+1,width+.2,.16,3.2);block(x,y+3.65,z+1,width+.2,.6,3.2);}
 path([[12,45],[12,24],[8,16],[6,1],[1,-29],[-8,-62]],road?3.1:2.7,road?'#b5a181':'#c3b69c');path([[-14,13],[-5,10],[17,10],[43,4]],1.8);
 if(road){
  marker('intertestament-rural-road-context');marker('intertestament-original-dry-drainage');
  for(const [x,z,w,d,h] of [[-37,5,8,7,3.1],[-36,-30,10,7,3.4],[37,-22,9,7,3.3],[42,29,8,7,3.2],[-35,36,8,7,3.2],[19,-58,10,8,3.4]])house(x,z,w,d,h);
  for(const x of [-27.7,-22.3])for(let i=0;i<32;i++){const z=-53+i*3,y=height(x,z);k.box('stone',x,y+.07,z,.35,.14,.65,(k.rand()-.5)*.5);}
  for(let row=0;row<3;row++)for(let j=0;j<5;j++){const x=-49-row*12,z=-48+j*24,y=height(x,z);k.wall(x,y-.1,z,17,.55,.6,'z','stone',1.1,.30);}
  shade(35,9,7);bench(34,20,5);stores(34,15);shade(-34,17,6);for(const [x,z,a] of [[-34,29,1.1],[34,-7,1],[-36,-10,.9],[16,39,1.1],[46,-40,1]])tree(x,z,a);
 }else if(s.id==='coin'){
  marker('intertestament-generic-public-forecourt');
  for(const [x,z,w,d,h] of [[-29,-27,10,8,3.6],[-7,-40,11,8,3.8],[19,-37,10,7,3.6],[40,29,9,7,3.4],[-28,36,8,7,3.3],[45,-29,9,8,3.7]])house(x,z,w,d,h);
  arcade(1,-26,6);for(const x of [-25,35]){shade(x,9,7);stores(x,15);bench(x,22,4);}for(const [x,z,a] of [[-24,30,1],[34,-10,.9],[16,39,1.1],[-38,-9,1]])tree(x,z,a);
  // Selected surface patches are shallow; the public collision proxy remains smooth.
  for(let i=0;i<15;i++){const x=3+(i%3)*1.1,z=-8+Math.floor(i/3)*1.2;k.box('stone',x,floor(x,z)-.003,z,.98,.024,1.08);}
 }else{
  marker('intertestament-speaking-audiences-context');marker('intertestament-original-background-steps');
  for(const [x,z,w,d,h] of [[-30,-27,10,8,3.6],[35,-30,11,8,3.8],[-29,36,8,7,3.4],[42,29,9,7,3.4],[-27,-65,10,8,3.7],[34,-66,10,8,3.6]])house(x,z,w,d,h);
  const x=1,z=-38,y=height(x,z);for(let i=0;i<14;i++){const h=(i+1)*.24;k.box('stone',x,y+h/2,z-i*.42,10,h,.43);}wall(x,y,z-6.1,17,4.0,2.4);for(const xx of [-5.2,7.2])k.box('stone',xx,y+1.8,z-2.8,.55,3.6,6.8);block(x,y,z-2.8,17.5,5,9);
  arcade(0,-56,6);shade(-25,9,6);shade(35,9,6);bench(-25,20,5);stores(-25,25);stores(34,15);for(const [xx,zz,a] of [[-23,-9,1],[34,-10,.9],[16,39,1.1],[-35,29,1]])tree(xx,zz,a);
 }
 for(let row=0;row<3;row++)for(let col=0;col<4;col++)house(-32+col*25+(row%2)*6,-91-row*21,6+k.rand()*3,6+k.rand()*2,3+k.rand()*.7);
 for(let i=0;i<9;i++)tree(55+(i%3)*9,-61+i*12,.8+k.rand()*.3);
 const ty=floor(-5,7);k.box('wood',-5,ty+.77,7,1.8,.1,1.25);for(const xx of [-5.72,-4.28])for(const zz of [6.55,7.45]){const bottom=height(xx,zz)-.04,top=ty+.72;k.box('wood',xx,(bottom+top)/2,zz,.075,top-bottom,.075);}block(-5,ty,7,1.8,.83,1.25);
 for(let i=0;i<12;i++){const x=i<6?-13+(i%3)*6:10+(i%3)*6,z=i%2?21:-2;k.person(x,floor(x,z),z,i,0,i%6===0?1.12:1.7,{role:'intertestament-resident'});}
 marker('intertestament-chapter-'+s.id);return {height,dispose(){for(const m of owned)m.dispose();owned.clear();}};
}
export function attachIntertestamentExploration(scene,k,segment,{blenderAssets=false,onReady=()=>{},assetLoader}={}){
 const s=intertestamentSegmentById.get(segment)||intertestamentSegmentById.get('road'),floor=(x,z)=>intertestamentFloor(s.id,x,z),walkModel=createWalkModel([...k.collisionBoxes],s.surfaces,floor,{proxies:[],navigationStep:.55}),npcSystem=createNPCSystem({actors:k.actors,model:walkModel,pois:intertestamentPOIs(s.id),seed:17026+s.number*1091,spawnCandidates:intertestamentSpawnCandidates(s.id),spawnExclusion:s.spawn,allowRetreat:true}),objects=intertestamentObjects.filter(o=>o.segment===s.id).map(d=>{const root=createVessel(d.id,{blenderAssets,onReady,assetLoader});root.position.fromArray(d.position);scene.add(root);return {...d,root};});return {walkModel,npcSystem,objects};
}
