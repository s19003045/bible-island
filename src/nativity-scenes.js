import * as THREE from 'three';
import {createWalkModel} from './walk-model.js';
import {createNPCSystem} from './npc-system.js';
import {createVessel} from './vessels.js';
import {createNativityFlock,nativityPasture} from './nativity-animals.js';
import {nativityFloor,nativitySegmentById,nativityObjects,nativityPOIs,nativitySpawnCandidates,nativityMoment} from './nativity-exploration.js';

// Three different original reading environments. No identified lodging, family home or workshop.
export function buildNativityScene(k,scene,segment,{phase,blenderAssets=false,onReady=()=>{},assetLoader}={}){
 const s=nativitySegmentById.get(segment)||nativitySegmentById.get('manger'),moment=nativityMoment(s.id,phase),field=s.id==='manger'&&moment.id==='field',floor=(x,z)=>nativityFloor(s.id,x,z);
 const height=(x,z)=>{let h=floor(x,z)+THREE.MathUtils.smoothstep(Math.max(Math.abs(x)-39,Math.abs(z)-44),0,140)*(5+12*Math.sin(x*.013+z*.019)**2);if(field){const p=nativityPasture,d=Math.max(p.x1-x,x-p.x2,p.z1-z,z-p.z2,0);h=THREE.MathUtils.lerp(p.height,h,THREE.MathUtils.smoothstep(d,0,5));}return h;};
 const owned=new Set(),mat=o=>{const m=new THREE.MeshStandardMaterial(o);owned.add(m);return m;};
 for(const [size,n,near] of [[1500,160,false],[100,140,true]]){
  const g=new THREE.PlaneGeometry(size,size,n,n);g.rotateX(-Math.PI/2);const p=g.attributes.position,colors=[],indices=[];
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),c=new THREE.Color(s.id==='manger'?'#a3a083':s.id==='home'?'#aaa082':'#afa58e');c.offsetHSL(0,0,.025*Math.sin(x*.12)*Math.cos(z*.08));p.setY(i,height(x,z)-(near?0:.04));colors.push(c.r,c.g,c.b);}
  for(let i=0;i<g.index.count;i+=3){const ids=[g.index.getX(i),g.index.getX(i+1),g.index.getX(i+2)],x=ids.reduce((a,j)=>a+p.getX(j),0)/3,z=ids.reduce((a,j)=>a+p.getZ(j),0)/3;if(!near&&Math.abs(x)<45&&Math.abs(z)<45)continue;indices.push(...ids);}
  g.setIndex(indices);g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();const m=new THREE.Mesh(g,mat({vertexColors:true,roughness:1}));m.name=near?'nativity-public-ground':'nativity-layered-landscape';m.receiveShadow=true;scene.add(m);
 }
 const marker=name=>{const g=new THREE.Group();g.name=name;scene.add(g);return g;};
 const block=(x,bottom,z,w,h,d)=>k.collisionBoxes.push({min:[x-w/2,bottom-.08,z-d/2],max:[x+w/2,bottom+h,z+d/2]});
 function path(points,width){const curve=new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,0,z))),v=[],f=[];for(let i=0;i<=90;i++){const p=curve.getPoint(i/90),t=curve.getTangent(i/90);for(const sign of [-1,1]){const x=p.x+sign*t.z*width/2,z=p.z-sign*t.x*width/2;v.push(x,height(x,z)+.004,z);}if(i){const j=(i-1)*2;f.push(j,j+2,j+3,j,j+3,j+1);}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(f);g.computeVertexNormals();const m=new THREE.Mesh(g,mat({color:'#bbaa8a',roughness:1}));m.name='nativity-public-path';m.receiveShadow=true;scene.add(m);}
 function wall(x,y,z,w,h,d=.42){k.box('sand',x,y+h/2,z,w,h,d*.92);k.wall(x,y,z,w,h,d,'x','stone',.70,.30);}
 function house(x,z,w=8,d=7,h=3.1){
  const corners=[height(x-w/2,z-d/2),height(x+w/2,z-d/2),height(x-w/2,z+d/2),height(x+w/2,z+d/2)],bottom=Math.min(...corners)-.1,y=Math.max(...corners)+.02,t=.40,door=1.10;
  k.box('stone',x,(bottom+y)/2,z,w+.15,y-bottom,d+.15);k.box('sand',x,y+.045,z,w,.09,d);
  k.box('plaster',x,y+h/2,z-d/2,w,h,t);for(const sign of [-1,1]){k.box('plaster',x+sign*(w/2-t/2),y+h/2,z,t,h,d);wall(x+sign*(w+door)/4,y,z+d/2,(w-door)/2,h,t);}
  // A true clear opening and supported lintel. The dark interior is behind, not across, the doorway.
  k.box('wood',x,y+2.125,z+d/2,door+.40,.15,t+.12);k.box('plaster',x,y+2.20+(h-2.20)/2,z+d/2,door,h-2.20,t);
  k.box('wood',x-w*.23,y+.42,z-d*.12,1.4,.10,.6);for(const dx of [-.5,.5])k.box('wood',x-w*.23+dx,y+.205,z-d*.12,.09,.41,.50);k.jar(x+w*.22,y+.09,z-d*.15,.32);
  for(let i=0;i<6;i++)k.box('wood',x-w*.42+i*w*.84/5,y+h+.075,z,.13,.15,d+.08);k.box('sand',x,y+h+.22,z,w+.14,.14,d+.14);for(const sign of [-1,1])k.box('plaster',x+sign*w/2,y+h+.47,z,.22,.36,d);for(const dz of [-d/2,d/2])k.box('plaster',x,y+h+.47,z+dz,w,.36,.22);
  block(x,bottom,z,w+.4,h+.8+y-bottom,d+.4);return y;
 }
 function tree(x,z,a=1){const y=height(x,z);k.beam('trunk',[x,y,z],[x+.1,y+2.7*a,z],.15*a);for(let i=0;i<6;i++){const b=i*2.4,end=[x+Math.cos(b)*1.5*a,y+(2.8+i%3*.2)*a,z+Math.sin(b)*1.5*a];k.beam('trunk',[x,y+1.7*a,z],end,.055*a);for(let j=0;j<34;j++)k.part('leaf','leaf',end[0]+(k.rand()-.5)*2*a,end[1]+(k.rand()-.5)*.8*a,end[2]+(k.rand()-.5)*2*a,.15*a,1,1,k.rand(),k.rand()*6.28,k.rand());}block(x,y,z,.6,3.3*a,.6);}
 function shade(x,z,w=6){const y=height(x,z);for(const dx of [-w/2,w/2])for(const dz of [-1.5,1.5]){k.cyl('wood',x+dx,y+1.1,z+dz,.055,2.2);block(x+dx,y,z+dz,.18,2.3,.18);}for(let i=0;i<16;i++)k.box('reed',x,y+2.2,z-1.5+i*.2,w+.3,.05,.14);}
 function bench(x,z,w=4){const y=height(x,z);k.box('wood',x,y+.48,z,w,.12,.60);for(const dx of [-w*.36,w*.36])k.box('wood',x+dx,y+.21,z,.12,.42,.50);block(x,y,z,w,.6,.7);}
 function stores(x,z){const y=height(x,z);for(let i=0;i<3;i++)k.jar(x+i*.5,y,z,.28+i*.04);k.box('linen',x+.4,y+.13,z+1,.7,.26,.6);block(x+.5,y,z,2.5,1.3,3);}
 path([[13,46],[12,26],[7,15],[5,2],[1,-32],[-5,-72]],2.8);path([[-14,12],[-5,10],[18,10],[46,7]],1.8);
 if(s.id==='manger'){
  marker('nativity-luke-birth-reading-context');marker('nativity-reading-moment-'+moment.id);
  for(const [x,z,w,d,h] of [[-26,-5,9,7,3.1],[37,1,9,7,3.3],[27,-30,8,7,3.2],[-38,32,9,7,3.2],[38,32,8,7,3.2]])house(x,z,w,d,h);
  shade(35,12,6);bench(34,23,5);stores(35,18);shade(-27,17,6);bench(-25,26,4);
  for(const [x,z,a] of [[-26,27,1],[-23,-11,.9],[34,-12,1],[14,39,1.1],[-45,9,.9]])tree(x,z,a);
  if(field)marker('nativity-separate-night-pasture');
 }else if(s.id==='home'){
  marker('nativity-nazareth-daily-life-comparison');marker('nativity-reading-moment-'+moment.id);
  for(const [x,z,w,d,h] of [[-28,-15,10,8,3.2],[35,-8,9,7,3.2],[-30,31,10,8,3.3],[39,31,8,7,3.1],[7,-39,10,8,3.3]])house(x,z,w,d,h);
  // A real courtyard edge at adult scale; it does not enlarge the 1:10 teaching house.
  for(const [x,z,w] of [[-25,7,7],[35,8,6]]){shade(x,z,w);bench(x,z+12,w*.7);stores(x,z+6);}
  for(let row=0;row<2;row++)for(let col=0;col<4;col++)tree(-47-row*9,-31+col*16,.85+col*.07);
  for(const [x,z,a] of [[34,22,1],[-25,27,.9],[17,39,1.1]])tree(x,z,a);
  if(moment.id==='festival')marker('nativity-other-city-reading-not-a-temple-house');
 }else{
  marker('nativity-adult-homecoming-context');marker('nativity-modern-material-comparison');
  for(const [x,z,w,d,h] of [[-29,-18,9,8,3.4],[36,-19,10,8,3.5],[-29,33,10,8,3.2],[40,31,9,8,3.2]])house(x,z,w,d,h);
  const y=house(5,-43,20,12,4.2);for(let i=0;i<5;i++){const x=-3+i*4;k.cyl('stone',x,y+1.65,-34,.20,3.3);k.box('wood',x,y+3.36,-35,.16,.12,3);block(x,y,-34,.55,3.5,.55);}k.box('sand',5,y+3.5,-35,18,.16,3.5);
  for(const x of [-26,35]){shade(x,8,6);bench(x,24,4);stores(x,17);}
  const by=height(-26,11);for(let i=0;i<4;i++)k.box('wood',-26,by+.08+i*.16,11,2.4,.16,.24);block(-26,by,11,2.4,.70,.35);
  for(const [x,z,a] of [[-24,-5,.9],[34,-8,1],[-25,29,1],[16,39,1.1]])tree(x,z,a);
 }
 // Foreground routes, middle courtyards and far houses/terraces have distinct silhouettes.
 for(let row=0;row<3;row++)for(let j=0;j<4;j++)house(-37+j*26+(row%2)*7,-82-row*21,6+k.rand()*3,6+k.rand()*2,3+k.rand()*.6);
 for(const x of [-55,57])for(let j=0;j<5;j++){const z=-43+j*24;wall(x,height(x,z)-.06,z,17,.65,.5);}
 for(let j=0;j<7;j++)tree(55+(j%2)*10,-58+j*17,.8+k.rand()*.3);
 const ty=floor(-5,7);
 if(s.id==='manger')block(-5,ty,7,1.1,.48,.64);
 else {k.box('wood',-5,ty+.77,7,1.8,.1,1.25);for(const x of [-5.72,-4.28])for(const z of [6.55,7.45]){const bottom=height(x,z)-.02,top=ty+.72;k.box('wood',x,(bottom+top)/2,z,.075,top-bottom,.075);}block(-5,ty,7,1.8,.83,1.25);}
 for(let i=0;i<12;i++){const x=i<6?-13+(i%3)*6:10+(i%3)*6,z=i%2?21:-2;k.person(x,floor(x,z),z,i,0,i%6===0?1.12:1.7,{role:'nativity-resident'});}
 const flock=field?createNativityFlock(scene,{blenderAssets,onReady,assetLoader}):null;
 return {height,flock,moment,night:moment?.timeLocked?moment.night:null,dispose(){flock?.dispose();for(const m of owned)m.dispose();owned.clear();}};
}
export function attachNativityExploration(scene,k,segment,{phase,blenderAssets=false,onReady=()=>{},assetLoader}={}){
 const s=nativitySegmentById.get(segment)||nativitySegmentById.get('manger'),floor=(x,z)=>nativityFloor(s.id,x,z),walkModel=createWalkModel([...k.collisionBoxes],s.surfaces,floor,{proxies:[],navigationStep:.55}),npcSystem=createNPCSystem({actors:k.actors,model:walkModel,pois:nativityPOIs(s.id,phase),seed:18026+s.number*1091+(phase==='field'?211:0),spawnCandidates:nativitySpawnCandidates(s.id),spawnExclusion:s.spawn,allowRetreat:true}),objects=nativityObjects.filter(o=>o.segment===s.id).map(d=>{const root=createVessel(d.id,{blenderAssets,onReady,assetLoader});root.position.fromArray(d.position);scene.add(root);return {...d,root};});return {walkModel,npcSystem,objects};
}
