import * as THREE from 'three';
import {createWalkModel} from './walk-model.js';
import {createNPCSystem} from './npc-system.js';
import {createVessel} from './vessels.js';
import {passionFloor,passionWalkConfig,passionPOIs,passionSpawnCandidates} from './passion-exploration.js';
export function createPassionWalkModel(boxes,segment,phase){const c=passionWalkConfig(segment,phase);return createWalkModel(boxes,c.surfaces,(x,z)=>passionFloor(c.space,x,z),{proxies:[],navigationStep:.55});}
export function buildPassionScene(k,scene,segment,phase){
 const c=passionWalkConfig(segment,phase),space=c.space,owned=new Set(),floor=(x,z)=>passionFloor(space,x,z),mat=o=>{const m=new THREE.MeshStandardMaterial(o);owned.add(m);return m;};
 const marker=name=>{const g=new THREE.Group();g.name=name;scene.add(g);return g;},block=(x,y,z,w,h,d)=>k.collisionBoxes.push({min:[x-w/2,y-.03,z-d/2],max:[x+w/2,y+h,z+d/2]});
 const height=(x,z)=>{const edge=THREE.MathUtils.smoothstep(Math.max(Math.abs(x)-43,Math.abs(z)-45),0,130),b=floor(THREE.MathUtils.clamp(x,-47,47),THREE.MathUtils.clamp(z,-49,49));return b+edge*(4+13*Math.sin(x*.018+z*.015)**2+3*Math.sin(z*.03)**2);};
 for(const [size,n,near]of [[1600,180,false],[100,200,true]]){
  const g=new THREE.PlaneGeometry(size,size,n,n);g.rotateX(-Math.PI/2);const p=g.attributes.position,colors=[],idx=[];for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),col=new THREE.Color(space==='garden'?'#a4a086':space==='cross'?'#aaa08b':'#b4aa93');col.offsetHSL(.008*Math.sin(x*.13),.015*Math.sin(z*.11),.035*Math.sin(x*.13)*Math.cos(z*.08)+.014*Math.sin(x*1.3+z*.9));p.setY(i,height(x,z)-(near?0:.04));colors.push(col.r,col.g,col.b);}for(let i=0;i<g.index.count;i+=3){const a=[g.index.getX(i),g.index.getX(i+1),g.index.getX(i+2)],x=a.reduce((s,j)=>s+p.getX(j),0)/3,z=a.reduce((s,j)=>s+p.getZ(j),0)/3;if(!near&&Math.abs(x)<45&&Math.abs(z)<45)continue;idx.push(...a);}g.setIndex(idx);g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();const m=new THREE.Mesh(g,mat({vertexColors:true,roughness:1}));m.name=near?'passion-public-ground':'passion-layered-landscape';m.receiveShadow=true;scene.add(m);
 }
 function path(points,width){const curve=new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,0,z))),v=[],f=[];for(let i=0;i<=120;i++){const p=curve.getPoint(i/120),t=curve.getTangent(i/120);for(const sign of [-1,1]){const x=p.x+sign*t.z*width/2,z=p.z-sign*t.x*width/2;v.push(x,height(x,z)+.006,z);}if(i){const j=(i-1)*2;f.push(j,j+2,j+3,j,j+3,j+1);}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(f);g.computeVertexNormals();const m=new THREE.Mesh(g,mat({color:'#c1b395',roughness:1}));m.name='passion-selected-public-path';m.receiveShadow=true;scene.add(m);}
 function house(x,z,w=8,d=7,h=3.2){const y=Math.max(...[-w/2,w/2].flatMap(dx=>[-d/2,d/2].map(dz=>height(x+dx,z+dz))));k.house(x,y,z,w,d,h,'plaster');block(x,y-4,z,w+.3,h+4.6,d+.3);}
 function tree(x,z,a=1){const y=height(x,z);k.beam('trunk',[x,y,z],[x+.08,y+2.7*a,z],.15*a);for(let i=0;i<7;i++){const b=i*2.4,end=[x+Math.cos(b)*1.5*a,y+(2.8+i%3*.22)*a,z+Math.sin(b)*1.5*a];k.beam('trunk',[x,y+1.6*a,z],end,.055*a);for(let j=0;j<70;j++)k.part('leaf','leaf',end[0]+(k.rand()-.5)*1.9*a,end[1]+(k.rand()-.5)*.8*a,end[2]+(k.rand()-.5)*1.9*a,.15*a,1,1,k.rand(),k.rand()*6.28,k.rand());}block(x,y,z,.55,3.5*a,.55);}
 function shade(x,z,w=6,d=3){const top=Math.max(...[-w/2,w/2].flatMap(dx=>[-d/2,d/2].map(dz=>height(x+dx,z+dz))))+2.4;for(const dx of [-w/2,w/2])for(const dz of [-d/2,d/2]){const b=height(x+dx,z+dz)-.02;k.cyl('wood',x+dx,(b+top)/2,z+dz,.06,top-b);block(x+dx,b,z+dz,.18,top-b,.18);}for(let i=0;i<=Math.ceil(d/.18);i++)k.box('reed',x,top,z-d/2+i*d/Math.ceil(d/.18),w+.2,.05,.12);}
 function bench(x,z,w=3){const y=Math.max(height(x-w/2,z),height(x+w/2,z))+.5;k.box('wood',x,y,z,w,.12,.6);for(const dx of [-w*.36,w*.36]){const b=height(x+dx,z)-.02;k.box('wood',x+dx,(b+y-.06)/2,z,.12,y-.06-b,.5);}block(x,height(x,z),z,w,.62,.7);}
 function wall(x,z,l,axis='x',h=.8){const y=height(x,z);k.wall(x,y,z,l,h,.45,axis,'stone',.75,.3);block(x,y,z,axis==='x'?l:.45,h,axis==='z'?l:.45);}
 function jars(x,z){for(let i=0;i<3;i++)k.jar(x+i*.48,height(x+i*.48,z),z,.24+i*.035);block(x+.5,height(x,z),z,1.8,.6,.8);}
 function light(x,z){const p=new THREE.PointLight('#ffd5a4',9,9,2);p.position.set(x,height(x,z)+1.2,z);p.name='passion-modern-reading-light';scene.add(p);}
 function rockBlock(x,y,z,w,h,d){
  const g=new THREE.BoxGeometry(w,h,d,3,2,3),p=g.attributes.position,colors=[],amp=Math.min(w,h,d)*.06;
  for(let i=0;i<p.count;i++){const a=p.getX(i),b=p.getY(i),c=p.getZ(i),n=Math.sin(a*2.1+b*1.7+c*1.3)+.4*Math.sin(a*5.1-c*3.2);p.setXYZ(i,a+amp*n*.30,b+amp*Math.sin(a*1.8+c*2.3)*.45,c+amp*n*.35);const col=new THREE.Color('#a79e88');col.offsetHSL(0,.007*Math.sin(c*3),.035*Math.sin(a*2+b*3+c));colors.push(col.r,col.g,col.b);}
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();const m=new THREE.Mesh(g,mat({vertexColors:true,roughness:1,flatShading:true}));m.position.set(x,y,z);m.name='passion-original-weathered-rock-comparison';m.castShadow=m.receiveShadow=true;scene.add(m);return m;
 }
 marker('passion-space-'+space);marker('passion-reading-moment-'+c.phase);
 path([[19,46],[16,24],[11,12],[9,0],[10,-18],[20,-47]],2.6);path([[-40,9],[-15,10],[-5,9],[11,12],[31,11],[52,17]],2);shade(-15,17,6,2.8);bench(-15,23,3.6);bench(25,19,3);jars(26,0);
 if(space==='table'){
  // Visible upstairs living space is a selected comparison; its interior is outside the public walk.
  const x=1,z=-30,w=18,d=11,b=height(x,z)+.15,t=.45,upper=b+3.15,h=2.8;
  k.box('darkstone',x,b-.2,z,w+.2,.4,d+.2);for(const y of [b,upper]){k.wall(x,y,z-d/2,w,h,t,'x','stone',.85,.35);for(const sign of [-1,1])k.wall(x+sign*w/2,y,z,d,h,t,'z','stone',.85,.35);}
  // Front wall has a real opening; beams, roof and table are separate volumes.
  for(const sign of [-1,1])k.wall(x+sign*(w+5)/4,upper,z+d/2,(w-5)/2,h,t,'x','stone',.85,.35);
  k.box('wood',x,upper+2.25,z+d/2,5.4,.18,.65);k.box('stone',x,upper+2.62,z+d/2,5,.36,t);
  for(const y of [upper-.08,upper+h+.08]){for(let i=0;i<12;i++)k.box('wood',x-w*.46+i*w*.084,y,z,.14,.14,d+.12);k.box('sand',x,y+.14,z,w+.15,.14,d+.15);}
  k.box('wood',x,upper+.38,z+1,2.4,.10,1.2);for(const dx of [-.98,.98])for(const dz of [.52,1.48])k.box('wood',x+dx,upper+.165,z+dz,.1,.33,.1);k.box('linen',x,upper+.45,z+1,1.2,.035,.7);
  block(x,b-.5,z,w+.2,7,d+.2);wall(-25,1,32,'z');house(36,-25,9,9);house(-32,-28,8,7);jars(-16,-5);tree(-27,22,.9);light(-3,-23);
 }else if(space==='garden'){
  for(const [x,z,a]of [[-30,-4,1.3],[-28,-20,1.1],[-9,-28,1.3],[8,-29,1.2],[27,-18,1.1],[37,5,1.2],[37,27,.95],[-29,28,1.1]])tree(x,z,a);
  wall(-25,6,40,'z',.7);wall(8,-34,30,'x',.7);house(47,-36,10,8);house(-42,-43,8,8);for(let i=0;i<22;i++){const x=-37+k.rand()*13,z=-28+k.rand()*45,y=height(x,z);k.box('darkstone',x,y+.12,z,.35+k.rand()*.6,.24,.35+k.rand()*.4,k.rand()*3);}light(-15,16);
 }else if(space==='council'){
  // Higher building and lower outside court are distinct, without reenacting an identified trial room.
  house(1,-29,22,13,5.2);house(-30,-24,9,10,4.1);house(35,-25,10,10,4.2);wall(-24,7,32,'z',1.8);wall(32,7,32,'z',1.8);const y=height(22,-4);k.cyl('darkstone',22,y+.10,-4,.48,.2);block(22,y,-4,1.1,.3,1.1);tree(37,24,.9);jars(-17,-8);light(22,-4);light(0,-20);
 }else if(space==='governor'){
  const x=3,z=-32,w=31,d=13,y=height(x,z),h=6.3;k.box('stone',x,y+.65,z,w,1.3,d);k.wall(x,y+1.3,z-d/2,w,h,.7,'x','stone',1.1,.4);for(const sign of [-1,1])k.wall(x+sign*w/2,y+1.3,z,d,h,.7,'z','stone',1.1,.4);for(let i=0;i<7;i++){const px=x-12+i*4;k.cyl('stone',px,y+3.7,z+4.9,.3,4.8);k.box('stone',px,y+6.15,z+4.9,.9,.24,.9);}k.box('stone',x,y+6.55,z+4.9,29,.55,1.3);block(x,y-1,z,w,9,d+1);for(let i=0;i<6;i++)k.box('stone',x,y+.1+i*.2,-23.8-i*.45,12,.2,.5);block(x,y,-24.8,12,1.4,3.6);house(-35,-28,9,9,4.3);house(41,-30,9,9,4);wall(-26,7,33,'z');tree(38,23,.9);
 }else if(space==='cross'){
  // Three unoccupied, noninteractive modern reading silhouettes, not reconstructed execution hardware.
  const symbols=marker('passion-modern-distant-cross-symbols');symbols.userData.modernReadingOnly=true;const wood=mat({color:'#685d50',roughness:1});for(const [x,z,h]of [[-10,-37,3.1],[0,-42,3.5],[10,-36,3.1]]){const y=height(x,z);for(const [w,hh,dx,dy]of [[.17,h,0,h/2],[1.2,.15,0,h*.74]]){const m=new THREE.Mesh(new THREE.BoxGeometry(w,hh,.16),wood);m.position.set(x+dx,y+dy,z);m.castShadow=true;symbols.add(m);}}
  wall(-24,9,28,'z',.6);for(let i=0;i<36;i++){const x=-35+k.rand()*13,z=-26+k.rand()*45;k.box('darkstone',x,height(x,z)+.13,z,.3+k.rand()*.65,.26,.3+k.rand()*.6,k.rand()*3);}tree(40,24,.8);house(48,-50,9,8);light(-5,8);
 }else if(space==='tomb'){
  const x=0,z=-28,y=height(x,z),w=12,d=8,h=4.5,t=1.1;
  // Non-locating rock-cut type: real opening, side platform, roof and floor. Interior not walkable.
  k.box('darkstone',x,y-.2,z,w+.2,.4,d+.2);rockBlock(x,y+h/2,z-d/2,w,h,t);for(const sign of [-1,1])rockBlock(x+sign*w/2,y+h/2,z,t,h,d);rockBlock(x,y+h-.35,z,w,.7,d);for(const sign of [-1,1])rockBlock(x+sign*3.8,y+h/2,z+d/2,4.4,h,t);rockBlock(x,y+3.55,z+d/2,3.2,1.9,t);k.box('stone',x+3.7,y+.45,z,2.2,.9,5.1);
  const stone=new THREE.Group();stone.name='passion-selected-tomb-entrance-state';stone.userData.modernReadingState=c.phase==='burial'?'covered':'already-open';scene.add(stone);const coverGeo=new THREE.IcosahedronGeometry(1.9,2),cp=coverGeo.attributes.position;for(let i=0;i<cp.count;i++){const a=cp.getX(i),b=cp.getY(i),q=cp.getZ(i),f=1+.08*Math.sin(a*2+b*3-q*2)+.045*Math.cos(a*4-q*3);cp.setXYZ(i,a*f,b*f,q*f);}coverGeo.computeVertexNormals();const cover=new THREE.Mesh(coverGeo,mat({color:'#9d9784',roughness:1,flatShading:true}));cover.scale.set(.95,.85,.48);cover.position.set(c.phase==='burial'?0:4.4,y+1.5,z+d/2+1.2);cover.castShadow=true;stone.add(cover);block(x,y-1,z,w+2,h+2,d+4);
  for(let i=0;i<14;i++){const px=-14+k.rand()*28,pz=-34-k.rand()*8,b=height(px,pz),rh=2.6+k.rand()*3;rockBlock(px,b+rh*.40,pz,2.5+k.rand()*3,rh,3.1+k.rand()*2);}path([[-12,8],[-8,-5],[-4,-15],[-2,-19]],1.5);tree(-29,3,1);tree(36,14,1);wall(34,3,16,'z',.7);house(40,-41,8,8);light(-5,8);
 }else{
  marker('passion-spices-selected-road-not-a-shop');path([[10,-15],[-4,-25],[-18,-39]],2.2);house(-31,-26,9,8);house(3,-32,9,8);house(37,-29,8,8);tree(-29,1,1);tree(38,17,1);wall(-25,13,24,'z',.7);jars(-17,-6);
 }
 for(let row=0;row<2;row++)for(let i=0;i<5;i++){const x=-48+i*23+(row%2)*5,z=-69-row*23+(i%2)*3;house(x,z,7+k.rand()*2,6+k.rand()*2,3+k.rand()*.6);if((row+i)%2===0)tree(x-5,z+7,.8);}
 const ty=floor(-5,7);k.box('wood',-5,ty+.77,7,1.8,.1,1.25);for(const x of [-5.72,-4.28])for(const z of [6.55,7.45]){const b=height(x,z)-.02,top=ty+.72;k.box('wood',x,(b+top)/2,z,.075,top-b,.075);}block(-5,ty,7,1.8,.83,1.25);
 [[-14,2],[-10,2],[0,2],[8,2],[18,2],[24,2],[-14,18],[-9,18],[0,18],[8,18],[18,18],[24,18]].forEach(([x,z],i)=>k.person(x,floor(x,z),z,i,0,i%6===0?1.12:1.7,{role:'passion-resident'}));
 return {height,moment:c.moment,space,night:c.night,dispose(){for(const m of owned)m.dispose();owned.clear();}};
}
export function attachPassionExploration(scene,k,segment,phase,{blenderAssets=false,onReady=()=>{},assetLoader}={}){
 const c=passionWalkConfig(segment,phase),walkModel=createPassionWalkModel([...k.collisionBoxes],c.id,c.phase),npcSystem=createNPCSystem({actors:k.actors,model:walkModel,pois:passionPOIs(c.id,c.phase),seed:221117+c.number*1091+c.phase.length*61,spawnCandidates:passionSpawnCandidates(c.id,c.phase),spawnExclusion:c.spawn,allowRetreat:true});
 const objects=c.objects.map(d=>{const root=createVessel(d.id,{blenderAssets,onReady,assetLoader});root.position.fromArray(d.position);scene.add(root);return {...d,root};});return {walkModel,npcSystem,objects};
}
