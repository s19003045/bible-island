import * as THREE from 'three';
import {createWalkModel} from './walk-model.js';
import {createNPCSystem} from './npc-system.js';
import {createVessel} from './vessels.js';
import {samariaFloor,samariaWell,samariaSegmentById,samariaMoment,samariaObjects,samariaPOIs,samariaSpawnCandidates} from './samaria-exploration.js';
export function createSamariaWalkModel(boxes,segment){const s=samariaSegmentById.get(segment)||samariaSegmentById.get('well');return createWalkModel(boxes,s.surfaces,(x,z)=>samariaFloor(s.id,x,z),{proxies:[],navigationStep:.55});}
export function buildSamariaScene(k,scene,segment,phase){
 const s=samariaSegmentById.get(segment)||samariaSegmentById.get('well'),moment=samariaMoment(s.id,phase),floor=(x,z)=>samariaFloor(s.id,x,z),owned=new Set();
 const material=o=>{const m=new THREE.MeshStandardMaterial(o);owned.add(m);return m;};
 const marker=name=>{const g=new THREE.Group();g.name=name;scene.add(g);return g;};
 const block=(x,y,z,w,h,d)=>k.collisionBoxes.push({min:[x-w/2,y-.03,z-d/2],max:[x+w/2,y+h,z+d/2]});
 const height=(x,z)=>{const edge=THREE.MathUtils.smoothstep(Math.max(Math.abs(x)-39,Math.abs(z)-43),0,135),distanceToPublic=Math.min(...s.surfaces.map(r=>Math.hypot(Math.max(r.x1-x,0,x-r.x2),Math.max(r.z1-z,0,z-r.z2)))),distanceToRoad=Math.abs(z+(x>19?.49*(x-19):0)),roadRelief=s.id==='road'?THREE.MathUtils.smoothstep(Math.min(distanceToPublic,x>-95&&x<115?distanceToRoad:Infinity),2,17)*(2.4+7*Math.sin(x*.071-z*.034)**2+2*Math.abs(Math.sin(x*.19+z*.14))):0;return floor(THREE.MathUtils.clamp(x,-45,45),THREE.MathUtils.clamp(z,-48,48))+roadRelief+edge*(s.id==='road'?(6+16*Math.sin(x*.019+z*.028)**2-4*Math.sin(x*.01-z*.024)):(5+12*Math.sin(x*.018+z*.015)**2));};
 const well=samariaWell,wy=floor(well.x,well.z);
 for(const [size,n,near] of [[1600,180,false],[100,200,true]]){
  const g=new THREE.PlaneGeometry(size,size,n,n);g.rotateX(-Math.PI/2);const p=g.attributes.position,colors=[],indices=[];
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),c=new THREE.Color(s.id==='road'?'#b5a78d':'#a8a58a');c.offsetHSL(.006*Math.sin(x*.13),.018*Math.sin(z*.11),.04*Math.sin(x*.13)*Math.cos(z*.08)+.015*Math.sin(x*1.3+z*.9));p.setY(i,height(x,z)-(near?0:.04));colors.push(c.r,c.g,c.b);}
  for(let i=0;i<g.index.count;i+=3){const a=[g.index.getX(i),g.index.getX(i+1),g.index.getX(i+2)],x=a.reduce((v,j)=>v+p.getX(j),0)/3,z=a.reduce((v,j)=>v+p.getZ(j),0)/3;if(!near&&Math.abs(x)<45&&Math.abs(z)<45)continue;if(near&&s.id==='well'&&x>-8&&x<-4&&z>-7&&z<-3)continue;indices.push(...a);}
  g.setIndex(indices);g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();const mesh=new THREE.Mesh(g,material({vertexColors:true,roughness:1}));mesh.name=near?'samaria-public-ground':'samaria-layered-landscape';mesh.receiveShadow=true;scene.add(mesh);
 }
 function path(points,width){const curve=new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,0,z))),v=[],f=[];for(let i=0;i<=120;i++){const p=curve.getPoint(i/120),t=curve.getTangent(i/120);for(const sign of [-1,1]){const x=p.x+sign*t.z*width/2,z=p.z-sign*t.x*width/2;v.push(x,height(x,z)+.005,z);}if(i){const j=(i-1)*2;f.push(j,j+2,j+3,j,j+3,j+1);}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(f);g.computeVertexNormals();const mesh=new THREE.Mesh(g,material({color:s.id==='road'?'#c6b698':'#b8aa8b',roughness:1}));mesh.name='samaria-selected-public-path';mesh.receiveShadow=true;scene.add(mesh);}
 function tree(x,z,a=1){const y=height(x,z);k.beam('trunk',[x,y,z],[x+.08,y+2.6*a,z],.14*a);for(let i=0;i<6;i++){const b=i*2.4,end=[x+Math.cos(b)*1.45*a,y+(2.7+i%3*.22)*a,z+Math.sin(b)*1.45*a];k.beam('trunk',[x,y+1.6*a,z],end,.052*a);for(let j=0;j<65;j++)k.part('leaf','leaf',end[0]+(k.rand()-.5)*1.9*a,end[1]+(k.rand()-.5)*.8*a,end[2]+(k.rand()-.5)*1.9*a,.15*a,1,1,k.rand(),k.rand()*6.28,k.rand());}block(x,y,z,.5,3.3*a,.5);}
 function shade(x,z,w=6,d=3){const top=Math.max(...[-w/2,w/2].flatMap(dx=>[-d/2,d/2].map(dz=>height(x+dx,z+dz))))+2.35;for(const dx of [-w/2,w/2])for(const dz of [-d/2,d/2]){const bottom=height(x+dx,z+dz)-.02;k.cyl('wood',x+dx,(bottom+top)/2,z+dz,.055,top-bottom);block(x+dx,bottom,z+dz,.18,top-bottom,.18);}for(let i=0;i<=Math.ceil(d/.18);i++)k.box('reed',x,top,z-d/2+i*d/Math.ceil(d/.18),w+.2,.05,.12);}
 function bench(x,z,w=3.6){const y=Math.max(height(x-w/2,z),height(x+w/2,z))+.5;k.box('wood',x,y,z,w,.12,.60);for(const dx of [-w*.36,w*.36]){const b=height(x+dx,z)-.02;k.box('wood',x+dx,(b+y-.06)/2,z,.12,y-.06-b,.5);}block(x,height(x,z),z,w,.62,.7);}
 function house(x,z,w=8,d=7,h=3.2){const y=Math.max(...[-w/2,w/2].flatMap(dx=>[-d/2,d/2].map(dz=>height(x+dx,z+dz))));k.house(x,y,z,w,d,h,'plaster');block(x,y-3.6,z,w+.3,h+4.4,d+.3);return y;}
 function jars(x,z){for(let i=0;i<3;i++)k.jar(x+i*.48,height(x+i*.48,z),z,.24+i*.035);block(x+.5,height(x,z),z,1.8,.6,.8);}
 marker('samaria-reading-moment-'+moment.id);
 if(s.id==='well'){
  marker('samaria-well-context');
  // Exact square replacement preserves the near-grid edge; the circular shaft remains open.
  const shape=new THREE.Shape();shape.moveTo(-2,-2);shape.lineTo(2,-2);shape.lineTo(2,2);shape.lineTo(-2,2);shape.closePath();const hole=new THREE.Path();hole.absarc(0,0,well.innerRadius,0,Math.PI*2,true);shape.holes.push(hole);const patch=new THREE.ShapeGeometry(shape,96);patch.rotateX(-Math.PI/2);patch.translate(well.x,wy,well.z);const ground=new THREE.Mesh(patch,material({color:'#aaa58b',roughness:1}));ground.name='samaria-well-ground-with-true-hole';ground.receiveShadow=true;scene.add(ground);
  const profile=[[well.innerRadius,-well.selectedDepth],[well.outerRadius,-well.selectedDepth],[well.outerRadius,well.rimHeight],[well.innerRadius,well.rimHeight],[well.innerRadius,-well.selectedDepth]].map(([r,y])=>new THREE.Vector2(r,y));const shaft=new THREE.Mesh(new THREE.LatheGeometry(profile,96),material({color:'#aa9b7e',roughness:1}));shaft.position.set(well.x,wy,well.z);shaft.name='samaria-open-well-rim-and-shaft';shaft.castShadow=shaft.receiveShadow=true;scene.add(shaft);
  const water=new THREE.Mesh(new THREE.CircleGeometry(well.innerRadius,96),material({color:'#486760',roughness:.42,metalness:.1}));water.rotation.x=-Math.PI/2;water.position.set(well.x,wy-well.selectedDepth+.04,well.z);water.name='samaria-selected-depth-well-water';scene.add(water);shaft.userData.selectedDimensions={depth:well.selectedDepth,innerRadius:well.innerRadius,rimHeight:well.rimHeight};block(well.x,wy-well.selectedDepth,well.z,well.outerRadius*2,well.selectedDepth+well.rimHeight,well.outerRadius*2);
  path([[13,45],[12,24],[10,10],[8,-4],[10,-36],[16,-80]],2.5);path([[-28,0],[-17,-1],[-10,-1],[2,0],[12,3],[34,6]],1.8);
  tree(-19,13,1.05);shade(24,-9,5);shade(-16,-13,4,2);bench(-16,-13,3.1);bench(-20,20);jars(-13,-9);
  for(const [x,z] of [[-28,-28],[-12,-37],[10,-37],[29,-33],[38,23],[-34,32]])house(x,z,8+(x%3),7,3.05+(Math.abs(x)%4)*.15);
  for(const [x,z,a] of [[-30,5,.85],[33,-1,.95],[18,35,.85],[-22,24,.8],[-20,-17,.8],[-14,-17,.75]])tree(x,z,a);
  for(const [x,z,w] of [[-17,-19,11],[23,-19,7]]){const y=height(x,z);k.wall(x,y,z,w,.62,.4,'x','stone',.7,.30);block(x,y,z,w,.62,.4);}
  // Irregular stone colours on the continuous selected curb; no masonry date is inferred.
  const curbColors=[];const a=shaft.geometry.attributes.position;
  for(let i=0;i<a.count;i++){const theta=Math.atan2(a.getX(i),a.getZ(i)),course=Math.floor((a.getY(i)+3)*5),tone=.89+.10*Math.sin(Math.floor(theta*8)+course*13);curbColors.push(tone,tone*.98,tone*.95);}
  shaft.geometry.setAttribute('color',new THREE.Float32BufferAttribute(curbColors,3));shaft.material.vertexColors=true;shaft.material.needsUpdate=true;
 }else if(s.id==='road'){
  marker('samaria-road-context');marker('samaria-walkable-descending-road');
  path([[-70,-2],[-32,-1],[-16,0],[0,0],[19,0],[42,-9],[90,-35]],4.3);path([[21,24],[20,13],[20,0],[23,-15]],2.4);path([[-12,16],[-2,13],[7,9],[12,0]],1.7);
  // Original fractured outcrops frame the public route; they do not specify the ancient road.
  const rock=material({color:'#91816a',roughness:1,flatShading:true});
  for(const [i,[x,z,w,h,d]] of [[-29,-13,9,5,6],[-18,-12,7,4,5],[-7,-15,11,6,6],[5,-17,8,5,5],[33,-19,10,6,7],[-21,27,8,4,6],[-9,30,10,5,7],[3,29,7,4,5],[16,31,9,5,6],[32,29,8,6,7],[-39,6,12,7,8],[39,3,11,6,8]].entries()){
   const y=height(x,z),g=new THREE.IcosahedronGeometry(1,3),v=g.attributes.position;for(let j=0;j<v.count;j++){const noise=.91+.16*Math.sin(v.getX(j)*13+v.getY(j)*7+v.getZ(j)*11+i*1.7);v.setXYZ(j,v.getX(j)*w*.5*noise,v.getY(j)*h*.5*noise,v.getZ(j)*d*.5*noise);}g.computeVertexNormals();const mesh=new THREE.Mesh(g,rock);mesh.name='samaria-original-dry-rock-face';mesh.position.set(x,y+h*.15,z);mesh.rotation.y=i*.63;mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh);block(x,y-h*.45,z,w,h*1.1,d);
  }
  for(let i=0;i<25;i++){const x=-32+(i%9)*8.1,z=i%2?-20-(i%4)*1.8:31+(i%3)*3.1,y=height(x,z);k.box('darkstone',x,y+.05,z,.4+(i%4)*.22,.1+(i%3)*.07,.3+(i%3)*.16,i*.73);}
  shade(22,20,5,2);bench(24,14,2.6);tree(31,19,.85);tree(-21,13,.70);for(const [x,z] of [[-34,-31],[37,32]])house(x,z,7,6,3.0);
 }else{
  marker('samaria-inn-context');
  path([[12,45],[13,25],[13,7],[12,-22]],3.0);path([[-33,6],[-16,7],[4,9],[26,9],[54,12],[95,29]],2.9);
  // Selected courtyard facade: a real open doorway and a roof supported by walls/posts.
  const x=12,z=-29,w=16,d=10,h=3.3,t=.45,y=Math.max(...[-w/2,w/2].flatMap(dx=>[-d/2,d/2].map(dz=>height(x+dx,z+dz)))),bottom=y-.45;
  k.box('darkstone',x,(bottom+y)/2,z,w+.2,y-bottom,d+.2);k.box('sand',x,y-.042,z,w,.09,d);k.wall(x,y,z-d/2,w,h,t,'x','stone',.9,.35);block(x,y,z-d/2,w,h,t);
  for(const sign of [-1,1]){k.wall(x+sign*w/2,y,z,d,h,t,'z','stone',.9,.35);block(x+sign*w/2,y,z,t,h,d);const side=(w-2.6)/2,px=x+sign*(w+2.6)/4;k.wall(px,y,z+d/2,side,h,t,'x','stone',.9,.35);block(px,y,z+d/2,side,h,t);}
  k.box('wood',x,y+2.33,z+d/2,3.05,.18,.65);k.box('stone',x,y+2.87,z+d/2,2.6,.86,t);block(x,y+2.42,z+d/2,2.6,.86,t);for(let i=0;i<12;i++)k.box('wood',x-w*.46+i*w*.92/11,y+h+.08,z,.14,.16,d+.18);k.box('sand',x,y+h+.24,z,w+.18,.16,d+.18);marker('samaria-inn-original-open-entry');
  const porchTop=y+3.1;for(const dx of [-5,5]){const b=height(x+dx,-20.8);k.cyl('wood',x+dx,(b+porchTop)/2,-20.8,.09,porchTop-b);block(x+dx,b,-20.8,.25,porchTop-b,.25);}for(let i=0;i<20;i++)k.box('reed',x,porchTop,-24+i*.17,11,.07,.12);
  shade(-15,17,6,3);shade(-16,-3,4,5);bench(-15,23);bench(25,19,3.1);jars(-15,-17);jars(25,-11);
  for(const [px,pz,length,axis] of [[-20,7,40,'z'],[30,8,38,'z'],[-8,28,22,'x'],[25,28,10,'x']]){const b=height(px,pz);k.wall(px,b,pz,length,.85,.5,axis,'stone',.75,.29);block(px,b,pz,axis==='x'?length:.5,.85,axis==='z'?length:.5);}
  const workY=height(-16,-9);k.box('wood',-16,workY+.72,-9,1.5,.10,.75);for(const dx of [-.6,.6])for(const dz of [-.26,.26])k.box('wood',-16+dx,workY+.34,-9+dz,.07,.68,.07);k.box('linen',-16,workY+.81,-9,.8,.08,.5);block(-16,workY,-9,1.5,.88,.75);
  for(const [px,pz] of [[-29,-21],[36,-29],[-32,32],[41,33]])house(px,pz,8,7,3.1);for(const [px,pz] of [[-28,7],[34,17],[2,35]])tree(px,pz,.95);
 }
 if(s.id!=='road'){
  for(let row=0;row<2;row++)for(let j=0;j<5;j++){const x=-45+j*22+(row%2)*6,z=-68-row*22+(j%2)*3;house(x,z,7+k.rand()*2,6+k.rand()*2,3+k.rand()*.5);k.wall(x+3,height(x+3,z+7),z+7,12,.65,.4,'x','darkstone',.7,.28);if((row+j)%2===0)tree(x-5,z+7,.8);}
  for(let i=0;i<11;i++)tree(47+(i%3)*9,-51+Math.floor(i/3)*29,.75+k.rand()*.25);
 }
 for(let i=0;i<70;i++){const x=i%2?33+(i%7)*1.4:-27-(i%6)*.9,z=-41+(i*5.71)%85,y=height(x,z);k.box('stone',x,y+.025,z,.13+(i%4)*.05,.05,.11+(i%3)*.05,i*.19);}
 const ty=floor(-5,7);k.box('wood',-5,ty+.77,7,1.8,.1,1.25);for(const x of [-5.72,-4.28])for(const z of [6.55,7.45]){const b=height(x,z)-.02,t=ty+.72;k.box('wood',x,(b+t)/2,z,.075,t-b,.075);}block(-5,ty,7,1.8,.83,1.25);
 const spawns=s.id==='road'?[[-13,0],[-10,0],[-7,0],[-3,0],[3,0],[6,0],[-11,17],[-8,17],[20,-12],[23,-12],[20,13],[23,13]]:[[-14,2],[-10,2],[0,2],[8,2],[18,2],[24,2],[-14,18],[-9,18],[0,18],[8,18],[18,18],[24,18]];
 spawns.forEach(([x,z],i)=>k.person(x,floor(x,z),z,i,0,i%6===0?1.12:1.7,{role:'samaria-resident'}));
 return {height,moment,night:null,dispose(){for(const m of owned)m.dispose();owned.clear();}};
}
export function attachSamariaExploration(scene,k,segment,phase,{blenderAssets=false,onReady=()=>{},assetLoader}={}){const s=samariaSegmentById.get(segment)||samariaSegmentById.get('well'),walkModel=createSamariaWalkModel([...k.collisionBoxes],s.id),npcSystem=createNPCSystem({actors:k.actors,model:walkModel,pois:samariaPOIs(s.id),seed:20026+s.number*1091,spawnCandidates:samariaSpawnCandidates(s.id),spawnExclusion:s.spawn,allowRetreat:true}),objects=samariaObjects.filter(o=>o.segment===s.id).map(d=>{const root=createVessel(d.id,{blenderAssets,onReady,assetLoader});root.position.fromArray(d.position);scene.add(root);return {...d,root};});return {walkModel,npcSystem,objects};}
