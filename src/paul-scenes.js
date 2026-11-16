import * as THREE from 'three';
import {createWalkModel} from './walk-model.js';
import {createNPCSystem} from './npc-system.js';
import {createVessel} from './vessels.js';
import {paulFloor,paulObjects,paulSegmentById,paulPOIs,paulSpawnCandidates} from './paul-exploration.js';

export function buildPaulScene(k,scene,segment,{blenderAssets=false,onReady=()=>{},assetLoader}={}){
 const s=paulSegmentById.get(segment)||paulSegmentById.get('ship'),floor=(x,z)=>paulFloor(s.id,x,z);
 const riverCenter=z=>-23+2*Math.sin(z/29)+2.3*Math.sin(z/101);
 const height=(x,z)=>{const edge=THREE.MathUtils.smoothstep(Math.max(x-42,-z-40,z-45),0,105);if(s.id==='ship'&&x<-14)return -2.5;const distance=Math.abs(x-riverCenter(z)),valley=s.id==='square'?THREE.MathUtils.smoothstep(distance,15,70):1;let h=floor(x,z)+edge*(10+12*Math.sin(x*.025+z*.014)**2)*valley;if(s.id==='square'){const bank=THREE.MathUtils.smoothstep(distance,3.8,8);h=THREE.MathUtils.lerp(-.9,h,bank);}if(x>=-10&&x<=34&&z>=-18&&z<=35)h-=.09;return h;};
 const geo=new THREE.PlaneGeometry(1600,1600,240,240);geo.rotateX(-Math.PI/2);const a=geo.attributes.position,colors=[];
 for(let i=0;i<a.count;i++){const x=a.getX(i),z=a.getZ(i);a.setY(i,height(x,z));const col=new THREE.Color(s.id==='square'?'#687650':'#a0977c');col.offsetHSL(0,0,.04*Math.sin(x*.073)*Math.cos(z*.043));colors.push(col.r,col.g,col.b);}
 geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 if(s.id==='square'){const keep=[],index=geo.index;for(let i=0;i<index.count;i+=3){const tri=[index.getX(i),index.getX(i+1),index.getX(i+2)];if(tri.every(j=>Math.abs(a.getX(j)-riverCenter(a.getZ(j)))>22))keep.push(...tri);}geo.setIndex(keep);}
 geo.computeVertexNormals();const ground=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));ground.name='paul-landscape-'+s.id;ground.receiveShadow=true;scene.add(ground);
 // Precise ground under the public observation route; the coarse far terrain is scenery.
 const route=new THREE.PlaneGeometry(44,53,44,53);route.rotateX(-Math.PI/2);const r=route.attributes.position;
 for(let i=0;i<r.count;i++){const x=r.getX(i)+12,z=r.getZ(i)+8.5;r.setXYZ(i,x,floor(x,z)-.025,z);}route.computeVertexNormals();
 const path=new THREE.Mesh(route,new THREE.MeshStandardMaterial({color:s.id==='square'?'#687650':'#a0977c',roughness:1}));path.name='paul-public-ground';path.receiveShadow=true;scene.add(path);
 function lane(x,z,w,d,color){const g=new THREE.PlaneGeometry(w,d,Math.ceil(w),Math.ceil(d));g.rotateX(-Math.PI/2);const p=g.attributes.position;for(let i=0;i<p.count;i++){const px=p.getX(i)+x,pz=p.getZ(i)+z;p.setXYZ(i,px,floor(px,pz)+.012,pz);}g.computeVertexNormals();const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color,roughness:1}));m.receiveShadow=true;scene.add(m);}
 lane(12,8.5,7.5,53,s.id==='square'?'#8c8c76':'#a19a87');lane(1,9,20,4.2,'#a49d87');
 if(s.id==='ship')lane(-8,8.5,4,49,'#9f9c8e');
 const marker=new THREE.Group();marker.name='paul-city-'+s.city;scene.add(marker);
 function house(x,z,w=7,d=7,h=4){const y=height(x,z);k.wall(x,y,z-d/2,w,h,.5,'x','plaster',1.2,.42);for(const side of [-1,1])k.wall(x+side*w/2,y,z,d,h,.5,'z','stone',1.1,.42);for(const side of [-1,1])k.wall(x+side*(w/4+.36),y,z+d/2,w/2-.7,h,.5,'x','plaster',1.2,.42);k.box('wood',x,y+2.45,z+d/2,1.7,.22,.65);k.box('black',x,y+1.1,z+d/2-.15,1.28,2.2,.08);for(const side of [-1,1]){k.box('black',x+side*w*.31,y+2.7,z+d/2+.27,.65,.65,.035);k.part('box','terra',x+side*w*.25,y+h+.55,z,w*.53,.16,d+.6,0,0,-side*.29);for(let j=0;j<8;j++)k.part('column','terra',x+side*w*.25,y+h+.62,z-d/2+j*d/7,.07,w*.54,.07,0,0,Math.PI/2-side*.29);}k.collisionBoxes.push({min:[x-w/2-.3,y-2,z-d/2-.3],max:[x+w/2+.3,y+h+2,z+d/2+.3]});}
 function shade(x,z,w=7){const y=floor(x,z);for(const side of [-1,1])k.cyl('wood',x+side*w/2,y+1.45,z,.065,2.9);k.box('linen',x,y+2.92,z,w,.035,3.6);k.box('wood',x,y+.72,z,3,.12,.8);for(const dx of [-1.2,1.2])k.box('wood',x+dx,y+.35,z,.1,.7,.6);k.collisionBoxes.push({min:[x-1.58,y,z-.48],max:[x+1.58,y+1.3,z+.48]});}
 // Background streets have different heights and roof lines; none is called an identified home.
 for(const [x,z,w,d,h] of [[43,26,8,8,4],[45,10,9,7,5],[42,-10,7,8,4],[-5,-29,8,7,4.2],[8,-30,8,8,5],[27,-27,9,7,4.3],[58,-21,9,8,5],[57,34,8,7,4],[-2,-48,10,9,4.5],[52,-46,9,8,5]])house(x,z,w,d,h);
 for(const [x,z] of [[-6,32],[31,31],[37,-7],[-11,-21],[42,-39],[60,12],[68,-31],[62,42]])k.olive(x,height(x,z),z,.8+k.rand()*.3);
 if(s.id==='ship'){
  const water=new THREE.Mesh(new THREE.PlaneGeometry(1800,1800).rotateX(-Math.PI/2),new THREE.MeshPhysicalMaterial({color:'#497d83',roughness:.36,metalness:.16,clearcoat:.3}));water.position.set(-914,.08,0);water.name='paphos-open-water';scene.add(water);
  for(const [z,length] of [[-31.5,55],[28,52]])k.wall(-14,-2,z,length,2.8,1.5,'z','stone',1.6,.45);k.box('wood',-20.5,.66,-1,14,.28,6);for(const x of [-26,-21,-16])for(const z of [-3.7,1.7])k.cyl('wood',x,-.25,z,.18,2.4);
  const ship=createVessel('paul-ship',{blenderAssets,onReady,assetLoader});ship.name='paphos-merchant-ship-comparison';ship.scale.setScalar(12);ship.position.set(-25,-2.32,-12);scene.add(ship);
  for(let i=0;i<16;i++)k.jar(-12+(i%4)*.75,.8,18+Math.floor(i/4)*.8,.62+(i%3)*.12);
  for(const z of [-17,19]){k.box('stone',-12,.96,z,1,1.2,1);k.beam('hide',[-12,1.45,z],[-24,.9,z<0?-15:-7],.018);}
  shade(29,17);shade(4,-15,5);for(let j=0;j<5;j++)k.box('wood',29+j*.5,floor(29,-5)+.25,-5,.45,.5,3);
  for(const z of [-4,6,17]){k.box('wood',31,floor(31,z)+.46,z,3.4,.12,.55);for(const dx of [-1.3,1.3])k.box('stone',31+dx,floor(31,z)+.2,z,.25,.4,.5);k.collisionBoxes.push({min:[29.2,floor(31,z),z-.36],max:[32.8,floor(31,z)+.6,z+.36]});}
 }else if(s.id==='square'){
  const waterVertices=[],waterFaces=[],bankVertices=[],bankFaces=[],bankColors=[],steps=280,profile=[-32,-24,-16,-10,-8,-6,-3.8,0,3.8,6,8,10,16,24,32];
  for(let i=0;i<=steps;i++){const z=-1000+i*2000/steps,center=riverCenter(z);waterVertices.push(center-3.8,-.2,z,center+3.8,-.2,z);for(const offset of profile){bankVertices.push(center+offset,height(center+offset,z)+.01,z);const color=new THREE.Color('#827f63').lerp(new THREE.Color('#687650'),THREE.MathUtils.smoothstep(Math.abs(offset),6,12));bankColors.push(color.r,color.g,color.b);}if(i){const q=(i-1)*2;waterFaces.push(q,q+2,q+3,q,q+3,q+1);for(let j=0;j<profile.length-1;j++){const b=(i-1)*profile.length+j;bankFaces.push(b,b+profile.length,b+profile.length+1,b,b+profile.length+1,b+1);}}}
  const waterGeo=new THREE.BufferGeometry();waterGeo.setAttribute('position',new THREE.Float32BufferAttribute(waterVertices,3));waterGeo.setIndex(waterFaces);waterGeo.computeVertexNormals();const water=new THREE.Mesh(waterGeo,new THREE.MeshStandardMaterial({color:'#456d67',roughness:.5,metalness:.08,side:THREE.DoubleSide}));water.name='philippi-river-teaching-course';scene.add(water);
  const bankGeo=new THREE.BufferGeometry();bankGeo.setAttribute('position',new THREE.Float32BufferAttribute(bankVertices,3));bankGeo.setAttribute('color',new THREE.Float32BufferAttribute(bankColors,3));bankGeo.setIndex(bankFaces);bankGeo.computeVertexNormals();const banks=new THREE.Mesh(bankGeo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide}));banks.name='philippi-shaped-riverbanks';banks.receiveShadow=true;scene.add(banks);
  for(const z of [-32,-20,-5,12,29,46]){const x=riverCenter(z)+7.8,y=height(x,z);k.beam('trunk',[x,y,z],[x+.15,y+4.6,z],.13);for(let b=0;b<9;b++){const angle=b*2.4,dx=Math.cos(angle)*.9,dz=Math.sin(angle)*.9;k.beam('trunk',[x,y+1.5+b*.22,z],[x+dx,y+3.8+b*.18,z+dz],.035);for(let n=0;n<75;n++)k.part('leaf','leaf',x+dx+(k.rand()-.5)*1.5,y+3.5+b*.18+k.rand(),z+dz+(k.rand()-.5)*1.4,.16+k.rand()*.12,1,1,k.rand(),k.rand()*Math.PI*2,k.rand());}}
  // A city gate outside the route, with an open visual portal, no later basilica.
  for(const x of [-3,28])k.wall(x,floor(x,-24),-24,22,6,.9,'x','stone',1.2,.42);
  for(const x of [8,17])k.wall(x,floor(x,-24),-24,4,9,5,'x','stone',1.2,.42);
  k.box('stone',12.5,8.4,-24,6,1.4,1.3);shade(28,15,6);
  for(let i=0;i<25;i++){const x=-45-(i%5)*3,z=-30+Math.floor(i/5)*14;k.box('reed',x,height(x,z)+.18,z,2.3,.36,8);}
  for(const [x,z] of [[-9,19],[-11,-5],[-10,30]])k.ball('darkstone',x,height(x,z)+.18,z,1.1,.55,.9);
 }else{
  // Earlier theatre type only: deliberately no late imperial giant vaulted corridors.
  const theatre=new THREE.Group();theatre.name='ephesus-earlier-theatre-type';scene.add(theatre);
  for(let row=0;row<18;row++)for(let j=0;j<54;j++){const t=.10+j/53*(Math.PI-.20),radius=17+row*.72;const x=14+Math.cos(t)*radius,z=-36-Math.sin(t)*radius;k.box('stone',x,1.7+row*.34,z,1.15,.34,.72,-t);}
  k.box('plaster',14,2.3,-32,28,1.3,4);for(let i=0;i<9;i++){k.cyl('light',2+i*3,5,-34,.28,4.5);k.box('stone',2+i*3,7.35,-34,.8,.24,.8);}k.box('stone',14,7.65,-34,26,.35,1);
  for(const z of [-12,-6,0,6]){k.cyl('light',36,floor(36,z)+2.4,z,.30,4.8);k.box('stone',36,floor(36,z)+4.95,z,1,.25,1);}k.box('plaster',38,6.75,-3,5,.24,25);
  shade(28,18);for(let j=0;j<7;j++)k.jar(32,floor(32,0),-6+j*.9,.6);
 }
 const object=paulObjects.find(o=>o.segment===s.id),[ox,oy,oz]=object.position;
 k.box('wood',ox,oy-.06,oz,2.2,.12,1.5);for(const side of [-1,1])k.box('wood',ox+side*.9,oy-.43,oz,.1,.74,1.2);
 // Small daily-life details sit off the walking line rather than forming toy clutter.
 for(const [x,z] of [[32,9],[32,27],[3,-16],[-8,27]]){k.jar(x,floor(x,z),z,.5);k.box('wood',x+.9,floor(x,z)+.18,z,.55,.36,.7);}
 for(let i=0;i<14;i++){const x=i<7?-7+(i%3)*6:16+(i%3)*6,z=i%2?26:0;k.person(x,floor(x,z),z,i,0,i%7===0?1.12:1.7,{role:'paul-resident'});}
 return height;
}
export function attachPaulExploration(scene,k,segment,{blenderAssets=false,onReady=()=>{},assetLoader}={}){
 const s=paulSegmentById.get(segment)||paulSegmentById.get('ship'),floor=(x,z)=>paulFloor(s.id,x,z),data=paulObjects.filter(o=>o.segment===s.id),boxes=[...k.collisionBoxes];
 for(const d of data){const [x,y,z]=d.position;boxes.push({min:[x-1.14,floor(x,z),z-.79],max:[x+1.14,y+1.6,z+.79]});}
 const model=createWalkModel(boxes,s.surfaces,floor,{proxies:[],navigationStep:.6});
 const npcSystem=createNPCSystem({actors:k.actors,model,pois:paulPOIs(s.id),seed:80426+s.number*419,spawnCandidates:paulSpawnCandidates(s.id),spawnExclusion:s.spawn,allowRetreat:true});
 const objects=data.map(d=>{const root=createVessel(d.id,{blenderAssets,onReady,assetLoader});root.position.fromArray(d.position);scene.add(root);return {...d,root};});return {walkModel:model,npcSystem,objects};
}
