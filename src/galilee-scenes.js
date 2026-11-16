import * as THREE from 'three';
import {createWalkModel} from './walk-model.js';
import {createNPCSystem} from './npc-system.js';
import {createVessel} from './vessels.js';
import {galileeFloor,galileeSegmentById,galileeMoment,galileeObjects,galileePOIs,galileeSpawnCandidates} from './galilee-exploration.js';

export const galileeShore=z=>-31+2.5*Math.sin(z*.027);
export function buildGalileeScene(k,scene,segment,phase){
 const s=galileeSegmentById.get(segment)||galileeSegmentById.get('boat'),moment=galileeMoment(s.id,phase),floor=(x,z)=>galileeFloor(s.id,x,z),owned=new Set();
 const material=o=>{const m=new THREE.MeshStandardMaterial(o);owned.add(m);return m;},marker=name=>{const g=new THREE.Group();g.name=name;scene.add(g);return g;};
 const height=(x,z)=>{let h=floor(x,z)+THREE.MathUtils.smoothstep(Math.max(Math.abs(x)-42,Math.abs(z)-47),0,150)*(4+10*Math.sin(x*.017+z*.013)**2);if(s.id==='boat'){const d=x-galileeShore(z);h=d<0?-.8-Math.min(6,-d*.12):THREE.MathUtils.lerp(.14,h,THREE.MathUtils.smoothstep(d,0,9));}return h;};
 const block=(x,y,z,w,h,d)=>k.collisionBoxes.push({min:[x-w/2,y-.08,z-d/2],max:[x+w/2,y+h,z+d/2]});
 for(const [size,n,near] of [[1500,160,false],[100,140,true]]){
  const g=new THREE.PlaneGeometry(size,size,n,n);g.rotateX(-Math.PI/2);const p=g.attributes.position,colors=[],indices=[];
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),c=new THREE.Color(s.id==='boat'?'#a2a58a':'#aaa18b');c.offsetHSL(.009*Math.sin(x*.17+z*.06),.025*Math.sin(z*.09),.045*Math.sin(x*.13)*Math.cos(z*.07)+.018*Math.sin(x*1.7+z*.9));p.setY(i,height(x,z)-(near?0:.04));colors.push(c.r,c.g,c.b);}
  for(let i=0;i<g.index.count;i+=3){const a=[g.index.getX(i),g.index.getX(i+1),g.index.getX(i+2)],x=a.reduce((v,j)=>v+p.getX(j),0)/3,z=a.reduce((v,j)=>v+p.getZ(j),0)/3;if(!near&&Math.abs(x)<45&&Math.abs(z)<45)continue;indices.push(...a);}
  g.setIndex(indices);g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();const mesh=new THREE.Mesh(g,material({vertexColors:true,roughness:1}));mesh.name=near?'galilee-public-ground':'galilee-layered-landscape';mesh.receiveShadow=true;scene.add(mesh);
 }
 function path(points,width){const curve=new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,0,z))),v=[],f=[];for(let i=0;i<=100;i++){const p=curve.getPoint(i/100),t=curve.getTangent(i/100);for(const sign of [-1,1]){const x=p.x+sign*t.z*width/2,z=p.z-sign*t.x*width/2;v.push(x,height(x,z)+.004,z);}if(i){const j=(i-1)*2;f.push(j,j+2,j+3,j,j+3,j+1);}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(f);g.computeVertexNormals();const mesh=new THREE.Mesh(g,material({color:'#b8a78a',roughness:1}));mesh.name='galilee-public-path';scene.add(mesh);}
 function house(x,z,w=8,d=7,h=3.1,{opening=false,main=false}={}){
  const ys=[height(x-w/2,z-d/2),height(x+w/2,z-d/2),height(x-w/2,z+d/2),height(x+w/2,z+d/2)],bottom=Math.min(...ys)-.1,y=Math.max(...ys)+.02,t=.40,door=1.1;
  k.box('darkstone',x,(bottom+y)/2,z,w+.14,y-bottom,d+.14);k.box('sand',x,y+.045,z,w,.09,d);
  k.box('plaster',x,y+h/2,z-d/2,w,h,t);for(const sign of [-1,1]){k.box('plaster',x+sign*(w/2-t/2),y+h/2,z,t,h,d);k.wall(x+sign*(w+door)/4,y,z+d/2,(w-door)/2,h,t,'x','stone',.7,.30);k.box('sand',x+sign*(w+door)/4,y+h/2,z+d/2,(w-door)/2,h,t*.92);}
  k.box('wood',x,y+2.125,z+d/2,door+.4,.15,t+.1);k.box('plaster',x,y+2.2+(h-2.2)/2,z+d/2,door,h-2.2,t);
  k.jar(x-w*.25,y+.09,z-d*.12,.28);for(let j=0;j<3;j++)k.jar(x+w*.23+j*.43,y,z+d/2+.7,.22+j*.045);k.box('wood',x-w*.28,y+.52,z+d/2+.8,1.7,.09,.6);for(const dx of [-.62,.62])k.box('wood',x-w*.28+dx,y+.24,z+d/2+.8,.075,.48,.47);k.box('wood',x+w*.2,y+.45,z-d*.1,1.2,.1,.65);for(const dx of [-.45,.45])k.box('wood',x+w*.2+dx,y+.22,z-d*.1,.08,.44,.55);
  const beamY=y+h+.075,roofY=y+h+.22;
  for(let i=0;i<8;i++){const dx=-w*.43+i*w*.86/7;if(opening&&Math.abs(dx)<1.8)continue;k.box('wood',x+dx,beamY,z,.14,.15,d+.12);}
  if(opening){
   marker('galilee-house-roof-opening');for(const dx of [-1.8,1.8])k.box('wood',x+dx,beamY,z,.16,.15,d+.12);for(const dz of [-1.35,1.35])k.box('wood',x,beamY+.12,z+dz,3.75,.09,.15);
   for(const sign of [-1,1]){k.box('sand',x+sign*(w+3.2)/4,roofY,z,(w-3.2)/2,.14,d+.14);k.box('sand',x,roofY,z+sign*(d+2.4)/4,3.2,.14,(d-2.4)/2+.07);}
  }else{k.box('sand',x,roofY,z,w+.14,.14,d+.14);if(main)marker('galilee-house-unopened-roof');}
  for(const sign of [-1,1])k.box('plaster',x+sign*w/2,y+h+.47,z,.22,.36,d);for(const dz of [-d/2,d/2])k.box('plaster',x,y+h+.47,z+dz,w,.36,.22);
  block(x,bottom,z,w+.4,h+.8+y-bottom,d+.4);return {y,roofY};
 }
 function tree(x,z,a=1){const y=height(x,z);k.beam('trunk',[x,y,z],[x+.08,y+2.6*a,z],.14*a);for(let i=0;i<6;i++){const b=i*2.4,end=[x+Math.cos(b)*1.45*a,y+(2.7+i%3*.22)*a,z+Math.sin(b)*1.45*a];k.beam('trunk',[x,y+1.6*a,z],end,.052*a);for(let j=0;j<80;j++)k.part('leaf','leaf',end[0]+(k.rand()-.5)*1.9*a,end[1]+(k.rand()-.5)*.8*a,end[2]+(k.rand()-.5)*1.9*a,.15*a,1,1,k.rand(),k.rand()*6.28,k.rand());}block(x,y,z,.6,3.2*a,.6);}
 function shade(x,z,w=6){for(const dx of [-w/2,w/2])for(const dz of [-1.5,1.5]){const y=height(x+dx,z+dz);k.cyl('wood',x+dx,y+1.1,z+dz,.055,2.2);block(x+dx,y,z+dz,.18,2.3,.18);}const y=height(x,z)+2.2;for(let i=0;i<16;i++)k.box('reed',x,y,z-1.5+i*.2,w+.2,.05,.14);}
 function bench(x,z,w=4){const top=height(x,z)+.5;k.box('wood',x,top,z,w,.12,.60);for(const dx of [-w*.36,w*.36]){const bottom=height(x+dx,z)-.01;k.box('wood',x+dx,(bottom+top-.06)/2,z,.12,top-.06-bottom,.5);}block(x,height(x,z),z,w,.60,.7);}
 function stores(x,z){const y=height(x,z);for(let i=0;i<3;i++)k.jar(x+i*.5,y,z,.26+i*.04);k.box('linen',x+.4,y+.13,z+1,.7,.26,.6);block(x+.5,y,z,2.5,1.3,3);}
 path([[13,46],[12,26],[7,15],[5,2],[3,-32],[6,-80]],2.8);path([[-15,12],[-5,10],[18,10],[46,7]],1.8);
 let water=null,time=0;
 if(s.id==='boat'){
  marker('galilee-shore-work-context');marker('galilee-reading-moment-'+moment.id);
  const v=[],f=[],nx=32,nz=96;for(let j=0;j<=nz;j++){const z=-700+j*1400/nz,edge=galileeShore(z)+.35;for(let i=0;i<=nx;i++){const x=THREE.MathUtils.lerp(edge,-1500,i/nx);v.push(x,.15,z);if(i&&j){const a=(j-1)*(nx+1)+i-1;f.push(a,a+1,a+nx+2,a,a+nx+2,a+nx+1);}}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(f);g.computeVertexNormals();water=new THREE.Mesh(g,material({color:'#567d79',roughness:.34,metalness:.15}));water.name='galilee-reading-lake';water.userData.waveAmplitude=moment.waves;water.receiveShadow=true;scene.add(water);
  // Original full-size background forms, separate from the partial Blender teaching object.
  function boat(z,angle){const root=new THREE.Group();root.name='galilee-original-background-boat';root.position.set(galileeShore(z)-2.6,-.23,z);root.rotation.y=angle;scene.add(root);const n=72,vs=[],fs=[];for(const [length,width,y] of [[5.6,.95,0],[6.6,2,.84],[6.4,1.8,.84],[5.4,.75,.14]])for(let i=0;i<n;i++){const a=i/n*Math.PI*2;vs.push(Math.cos(a)*length/2,y,Math.sin(a)*width/2*(.65+.35*Math.sin(a)**2));}for(let j=0;j<3;j++)for(let i=0;i<n;i++){const a=j*n+i,b=j*n+(i+1)%n;fs.push(a,b+n,b,a,a+n,b+n);}for(let i=1;i<n-1;i++){fs.push(0,i,i+1);fs.push(3*n,3*n+i+1,3*n+i);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vs,3));g.setIndex(fs);g.computeVertexNormals();const mesh=new THREE.Mesh(g,material({color:'#856848',roughness:.95}));mesh.castShadow=true;root.add(mesh);root.userData.originalSelectedDimensions=[6.6,2,.84];}
  boat(3,.18);boat(-20,-.08);for(const z of [-3,10]){const x=galileeShore(z)+1,y=height(x,z);k.cyl('wood',x,y+.65,z,.09,1.3);}
  const x=26,z=4,y=height(x,z),width=5.2;for(const dz of [-width/2,width/2]){const b=height(x,z+dz);k.cyl('wood',x,b+1.15,z+dz,.055,2.3);block(x,b,z+dz,.18,2.4,.18);}k.beam('wood',[x,y+2.2,z-width/2],[x,y+2.2,z+width/2],.045);for(let i=0;i<=13;i++){const dz=-width/2+i*width/13;k.beam('reed',[x,y+.45,z+dz],[x,y+2.2,z+dz],.007);}for(let i=0;i<=7;i++)k.beam('reed',[x,y+.45+i*.25,z-width/2],[x,y+.45+i*.25,z+width/2],.007);block(x,y,z,.14,2.3,width);
  for(const [x,z,w,d,h] of [[37,-15,10,8,3.2],[40,33,9,7,3.1],[-4,-41,8,7,3.2],[24,-43,10,8,3.1]])house(x,z,w,d,h);shade(36,12,7);bench(34,24,5);stores(35,18);for(const [x,z] of [[-23,28],[33,-3],[13,39]])tree(x,z,.95);
 }else if(s.id==='synagogue'){
  marker('galilee-gathering-context');marker('galilee-reading-moment-'+moment.id);const {y}=house(6,-38,20,12,4.1);for(const x of [-1,6,13]){k.cyl('wood',x,y+1.6,-29.3,.15,3.2);block(x,y,-29.3,.4,3.3,.4);}k.box('reed',6,y+3.24,-30,18,.10,3);for(const z of [-26,-22])for(const x of [-1,11])bench(x,z,5);for(const [x,z] of [[-28,-13],[38,-9],[-29,32],[39,34]])house(x,z,9,7,3.2);shade(-26,11,6);shade(35,10,6);bench(-25,25);bench(35,25);stores(35,17);for(const [x,z] of [[-24,-5],[34,-1],[13,39],[-27,29]])tree(x,z,1);
 }else{
  marker('galilee-house-access-context');marker('galilee-reading-moment-'+moment.id);house(5,-34,14,9,3.2,{opening:moment.id!=='crowd',main:true});for(const [x,z] of [[-29,-12],[38,-8],[-29,33],[40,33]])house(x,z,9,7,3.1);shade(-26,10,6);shade(35,10,6);bench(-25,25);bench(35,25);stores(35,17);for(const [x,z] of [[-24,-4],[34,0],[16,39],[-26,30]])tree(x,z,1);
 }
 for(let row=0;row<3;row++)for(let j=0;j<4;j++){const x=(s.id==='boat'?-5:-37)+j*21+(row%2)*6,z=-77-row*20+(j%2)*3;house(x,z,6+k.rand()*3,6+k.rand()*2,3+k.rand()*.6);for(const dz of [5.8,10.3])k.wall(x+3,height(x+3,z+dz),z+dz,13,.65,.35,'x','darkstone',.65,.27);k.wall(x+9.5,height(x+9.5,z+8),z+8,4.5,.65,.35,'z','darkstone',.65,.27);if((row+j)%2===0)tree(x-5,z+5,.85+k.rand()*.2);}
 for(let i=0;i<14;i++){const x=48+(i%4)*8,z=-65-Math.floor(i/4)*12;tree(x,z,.75+k.rand()*.35);}

 for(const x of [s.id==='boat'?52:-52,65])for(let j=0;j<5;j++){const z=-43+j*24;k.wall(x,height(x,z)-.06,z,16,.65,.5,'x','stone',.8,.30);}for(let j=0;j<7;j++)tree(55+(j%2)*10,-57+j*17,.8+k.rand()*.3);
 // Small original shoreline and settlement details stay outside the public collision route.
 if(s.id==='boat')for(let i=0;i<48;i++){const z=-62+i*2.5,x=galileeShore(z)+1.7+(i%4)*.7,y=height(x,z);for(let j=0;j<5;j++)k.beam('reed',[x+j*.07,y,z],[x+j*.07+.12,y+.45+(j%3)*.14,z+.1],.012);}
 for(let i=0;i<75;i++){const x=i%2?32+(i%7)*1.4:-18-(i%6)*.8,z=-44+(i*5.71)%88,y=height(x,z);k.box('stone',x,y+.025,z,.12+(i%4)*.045,.05,.10+(i%3)*.05,i*.19);}
 const ty=floor(-5,7);k.box('wood',-5,ty+.77,7,1.8,.1,1.25);for(const x of [-5.72,-4.28])for(const z of [6.55,7.45]){const b=height(x,z)-.02,t=ty+.72;k.box('wood',x,(b+t)/2,z,.075,t-b,.075);}block(-5,ty,7,1.8,.83,1.25);
 for(let i=0;i<12;i++){const x=i<6?-13+(i%3)*6:10+(i%3)*6,z=i%2?21:-2;k.person(x,floor(x,z),z,i,0,i%6===0?1.12:1.7,{role:'galilee-resident'});}
 return {height,moment,night:moment.timeLocked?moment.night:null,water,animate(dt){if(!water||dt<=0)return;time+=dt;const p=water.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),coast=THREE.MathUtils.smoothstep(galileeShore(z)-x,0,7);p.setY(i,.15+coast*moment.waves*(Math.sin(x*.19+z*.13+time*1.2)+.45*Math.sin(z*.41-time*1.7)));}p.needsUpdate=true;water.geometry.computeVertexNormals();},dispose(){for(const m of owned)m.dispose();owned.clear();}};
}
export function attachGalileeExploration(scene,k,segment,phase,{blenderAssets=false,onReady=()=>{},assetLoader}={}){const s=galileeSegmentById.get(segment)||galileeSegmentById.get('boat'),walkModel=createWalkModel([...k.collisionBoxes],s.surfaces,(x,z)=>galileeFloor(s.id,x,z),{proxies:[],navigationStep:.55}),npcSystem=createNPCSystem({actors:k.actors,model:walkModel,pois:galileePOIs(s.id),seed:19026+s.number*1091,spawnCandidates:galileeSpawnCandidates(s.id),spawnExclusion:s.spawn,allowRetreat:true}),objects=galileeObjects.filter(o=>o.segment===s.id).map(d=>{const root=createVessel(d.id,{blenderAssets,onReady,assetLoader});root.position.fromArray(d.position);scene.add(root);return {...d,root};});return {walkModel,npcSystem,objects};}
