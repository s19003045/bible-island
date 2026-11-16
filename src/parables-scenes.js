import * as THREE from 'three';
import {createWalkModel} from './walk-model.js';
import {createNPCSystem} from './npc-system.js';
import {createVessel} from './vessels.js';
import {createDavidFlock} from './david-animals.js';
import {parablesFloor,parablesSegmentById,parablesMoment,parablesObjects,parablesPOIs,parablesSpawnCandidates} from './parables-exploration.js';
export function createParablesWalkModel(boxes,segment){const s=parablesSegmentById.get(segment)||parablesSegmentById.get('seed');return createWalkModel(boxes,s.surfaces,(x,z)=>parablesFloor(s.id,x,z),{proxies:[],navigationStep:.55});}
export function buildParablesScene(k,scene,segment,phase,assetOptions={}){
 const s=parablesSegmentById.get(segment)||parablesSegmentById.get('seed'),moment=parablesMoment(s.id,phase),floor=(x,z)=>parablesFloor(s.id,x,z),owned=new Set();
 const mat=o=>{const m=new THREE.MeshStandardMaterial(o);owned.add(m);return m;};
 const marker=name=>{const g=new THREE.Group();g.name=name;scene.add(g);return g;};
 const block=(x,y,z,w,h,d)=>k.collisionBoxes.push({min:[x-w/2,y-.03,z-d/2],max:[x+w/2,y+h,z+d/2]});
 const height=(x,z)=>{const edge=THREE.MathUtils.smoothstep(Math.max(Math.abs(x)-42,Math.abs(z)-45),0,135),base=floor(THREE.MathUtils.clamp(x,-46,46),THREE.MathUtils.clamp(z,-48,48));return base+edge*(4+13*Math.sin(x*.018+z*.015)**2+3*Math.sin(z*.03)**2);};
 for(const [size,n,near] of [[1600,180,false],[100,200,true]]){
  const g=new THREE.PlaneGeometry(size,size,n,n);g.rotateX(-Math.PI/2);const p=g.attributes.position,colors=[],idx=[];
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),c=new THREE.Color(s.id==='seed'?'#a69d78':s.id==='sheep'?'#a6a184':'#aca58d');c.offsetHSL(.008*Math.sin(x*.13),.018*Math.sin(z*.11),.04*Math.sin(x*.13)*Math.cos(z*.08)+.015*Math.sin(x*1.3+z*.9));p.setY(i,height(x,z)-(near?0:.04));colors.push(c.r,c.g,c.b);}
  for(let i=0;i<g.index.count;i+=3){const a=[g.index.getX(i),g.index.getX(i+1),g.index.getX(i+2)],x=a.reduce((v,j)=>v+p.getX(j),0)/3,z=a.reduce((v,j)=>v+p.getZ(j),0)/3;if(!near&&Math.abs(x)<45&&Math.abs(z)<45)continue;idx.push(...a);}
  g.setIndex(idx);g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();const mesh=new THREE.Mesh(g,mat({vertexColors:true,roughness:1}));mesh.name=near?'parables-public-ground':'parables-layered-landscape';mesh.receiveShadow=true;scene.add(mesh);
 }
 function path(points,width){const c=new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,0,z))),v=[],f=[];for(let i=0;i<=120;i++){const p=c.getPoint(i/120),t=c.getTangent(i/120);for(const sign of [-1,1]){const x=p.x+sign*t.z*width/2,z=p.z-sign*t.x*width/2;v.push(x,height(x,z)+.006,z);}if(i){const j=(i-1)*2;f.push(j,j+2,j+3,j,j+3,j+1);}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(f);g.computeVertexNormals();const mesh=new THREE.Mesh(g,mat({color:'#bcad8c',roughness:1}));mesh.name='parables-selected-public-path';mesh.receiveShadow=true;scene.add(mesh);}
 function tree(x,z,a=1){const y=height(x,z);k.beam('trunk',[x,y,z],[x+.08,y+2.6*a,z],.14*a);for(let i=0;i<6;i++){const b=i*2.4,end=[x+Math.cos(b)*1.45*a,y+(2.7+i%3*.22)*a,z+Math.sin(b)*1.45*a];k.beam('trunk',[x,y+1.6*a,z],end,.052*a);for(let j=0;j<65;j++)k.part('leaf','leaf',end[0]+(k.rand()-.5)*1.9*a,end[1]+(k.rand()-.5)*.8*a,end[2]+(k.rand()-.5)*1.9*a,.15*a,1,1,k.rand(),k.rand()*6.28,k.rand());}block(x,y,z,.5,3.3*a,.5);}
 function shade(x,z,w=6,d=3){const top=Math.max(...[-w/2,w/2].flatMap(dx=>[-d/2,d/2].map(dz=>height(x+dx,z+dz))))+2.35;for(const dx of [-w/2,w/2])for(const dz of [-d/2,d/2]){const b=height(x+dx,z+dz)-.02;k.cyl('wood',x+dx,(b+top)/2,z+dz,.055,top-b);block(x+dx,b,z+dz,.18,top-b,.18);}for(let i=0;i<=Math.ceil(d/.18);i++)k.box('reed',x,top,z-d/2+i*d/Math.ceil(d/.18),w+.2,.05,.12);}
 function bench(x,z,w=3.6){const y=Math.max(height(x-w/2,z),height(x+w/2,z))+.5;k.box('wood',x,y,z,w,.12,.60);for(const dx of [-w*.36,w*.36]){const b=height(x+dx,z)-.02;k.box('wood',x+dx,(b+y-.06)/2,z,.12,y-.06-b,.5);}block(x,height(x,z),z,w,.62,.7);}
 function house(x,z,w=8,d=7,h=3.2){const y=Math.max(...[-w/2,w/2].flatMap(dx=>[-d/2,d/2].map(dz=>height(x+dx,z+dz))));k.house(x,y,z,w,d,h,'plaster');block(x,y-3.6,z,w+.3,h+4.4,d+.3);}
 function wall(x,z,l,axis='x',h=.65){const y=height(x,z);k.wall(x,y,z,l,h,.45,axis,'stone',.75,.3);block(x,y,z,axis==='x'?l:.45,h,axis==='z'?l:.45);}
 function jars(x,z){for(let i=0;i<3;i++)k.jar(x+i*.48,height(x+i*.48,z),z,.24+i*.035);block(x+.5,height(x,z),z,1.8,.6,.8);}
 function rocks(x,z,w,d,number){for(let i=0;i<number;i++){const px=x+(k.rand()-.5)*w,pz=z+(k.rand()-.5)*d,y=height(px,pz),a=.25+k.rand()*.6;k.box('darkstone',px,y+a*.12,pz,a,.12+a*.2,a*.7,k.rand()*Math.PI);}}
 marker('parables-reading-moment-'+moment.id);marker('parables-'+s.id+'-context');let flock=null;
 if(s.id==='seed'){
  path([[21,45],[18,23],[12,12],[14,-3],[15,-23],[29,-49]],2.5);path([[-22,9],[-10,8],[1,9],[12,12],[33,15]],1.9);path([[-15,8],[-15,-1],[-13,-10]],1.3);
  // Unequal, selected field comparisons outside the public paths, not four original plots.
  const earth=mat({color:'#8d7957',roughness:1}),rock=mat({color:'#a99e84',roughness:1});
  for(const [x,z,w,d] of [[-31,-9,17,13],[-6,-26,23,14],[32,-21,16,21]]){const g=new THREE.PlaneGeometry(w,d,20,20);g.rotateX(-Math.PI/2);const p=g.attributes.position;for(let i=0;i<p.count;i++){const px=p.getX(i)+x,pz=p.getZ(i)+z;p.setXYZ(i,px,height(px,pz)+.012,pz);}g.computeVertexNormals();const m=new THREE.Mesh(g,earth);m.name='parables-selected-field-soil';m.receiveShadow=true;scene.add(m);}
  const g=new THREE.BoxGeometry(13,.35,8),ridge=new THREE.Mesh(g,rock);ridge.position.set(-29,height(-29,-21)-.175,-21);ridge.rotation.x=-Math.atan(.025);ridge.name='parables-thin-soil-continuous-rock-comparison';ridge.castShadow=ridge.receiveShadow=true;scene.add(ridge);
  // Sparse shallow-soil shoots and larger grain stands; heights are authored, not crop measurements.
  for(let i=0;i<430;i++){const shallow=i<45,x=shallow?-34+k.rand()*10:i<270?-17+k.rand()*22:25+k.rand()*13,z=shallow?-24+k.rand()*6:i<270?-31+k.rand()*10:-30+k.rand()*16,y=height(x,z),h=shallow?.18+k.rand()*.12:.47+k.rand()*.34;k.beam('reed',[x,y,z],[x+.04,y+h,z+.02],.009);for(const sign of [-1,1])k.beam('leaf',[x,y+h*.4,z],[x+sign*.11,y+h*.73,z+.02],.018);if(!shallow)k.cyl('sand',x+.04,y+h+.035,z+.02,.018,.10);}
  for(let i=0;i<18;i++){const x=-37+k.rand()*16,z=1+k.rand()*5,y=height(x,z);for(let j=0;j<5;j++){const a=j*1.26;k.beam('trunk',[x,y,z],[x+Math.cos(a)*.4,y+.5+k.rand()*.25,z+Math.sin(a)*.4],.014);}}
  wall(-28,1,19);wall(-7,-35,26);wall(33,-35,16);rocks(-29,-20,14,10,24);shade(24,23,5,2);bench(24,26,2.6);shade(-16,16,5,2);jars(25,13);tree(31,6,.95);tree(-23,23,.85);house(-32,31,8,7,3.1);house(39,-7,8,7,3.2);
 }else if(s.id==='sheep'){
  marker('parables-selected-level-grazing-shelf');flock=createDavidFlock(scene,assetOptions);
  path([[18,44],[15,23],[9,11],[4,-2],[6,-21],[14,-50]],2.5);path([[-17,18],[-16,7],[-16,-10],[-9,-21]],1.5);path([[-16,12],[-4,12],[9,11],[28,9],[51,14]],1.8);
  tree(-26,21,1.0);tree(30,18,.95);tree(26,-21,.85);shade(-13,25,6,2);bench(-13,27,3.5);bench(24,21,2.8);jars(27,0);house(9,-33,10,8,3.2);house(37,-31,7,6,3.0);wall(10,-26,15);wall(32,3,12,'z');rocks(-39,-8,5,22,20);rocks(34,-16,7,14,18);
  // Low, separated tussocks around the shelf retain all four hooves on its level floor.
  for(let i=0;i<125;i++){const x=-36+k.rand()*16,z=-10+k.rand()*24,y=floor(x,z);for(let j=0;j<3;j++)k.beam('leaf',[x,y,z],[x+(j-1)*.06,y+.08+k.rand()*.08,z+.04],.008);}
 }else{
  path([[15,45],[14,24],[11,8],[9,-8],[4,-22],[-6,-40]],2.8);path([[-39,7],[-16,8],[3,9],[24,10],[50,15]],2.0);
  // Separate side wings, a true door opening and non-walkable interior. No player is locked in.
  const x=13,z=-24,w=16,d=9,h=3.2,t=.45,y=Math.max(...[-w/2,w/2].flatMap(dx=>[-d/2,d/2].map(dz=>height(x+dx,z+dz))));
  k.box('darkstone',x,y-.2,z,w+.2,.4,d+.2);k.wall(x,y,z-d/2,w,h,t,'x','stone',.9,.35);block(x,y-.4,z,w+.2,h+.4,d+.2);
  for(const sign of [-1,1]){k.wall(x+sign*w/2,y,z,d,h,t,'z','stone',.9,.35);const side=(w-2.8)/2;k.wall(x+sign*(w+2.8)/4,y,z+d/2,side,h,t,'x','stone',.9,.35);}
  k.box('wood',x,y+2.35,z+d/2,3.3,.18,.65);k.box('stone',x,y+2.87,z+d/2,2.8,.66,t);for(let i=0;i<11;i++)k.box('wood',x-w*.46+i*w*.092,y+h+.07,z,.14,.14,d+.15);k.box('sand',x,y+h+.2,z,w+.18,.14,d+.18);
  const door=new THREE.Group();door.name='parables-selected-reading-door';scene.add(door);const doorMat=mat({color:'#695644',roughness:1}),closed=moment.id==='door'||moment.id==='watch';for(const sign of [-1,1]){const panel=new THREE.Mesh(new THREE.BoxGeometry(1.37,2.25,.07),doorMat);if(closed)panel.position.set(x+sign*.695,y+1.125,z+d/2+.05);else{panel.position.set(x+sign*1.41,y+1.125,z+d/2-.65);panel.rotation.y=sign*Math.PI/2;}panel.castShadow=true;door.add(panel);}door.userData.modernReadingState=closed?'closed':'open';
  const porchTop=y+2.85;for(const px of [7.5,18.5]){const b=height(px,-16.5);k.cyl('wood',px,(b+porchTop)/2,-16.5,.075,porchTop-b);block(px,b,-16.5,.22,porchTop-b,.22);}for(let i=0;i<19;i++)k.box('reed',13,porchTop,-19.5+i*.16,11.2,.055,.12);
  shade(-15,17,6,3);bench(-15,23,3.6);bench(25,19,3.1);jars(-16,-4);jars(25,-11);wall(-22,8,34,'z',.8);wall(31,8,34,'z',.8);wall(-7,29,23,'x',.8);tree(-27,19,.9);tree(36,21,.95);house(-28,-25,8,7,3.1);house(35,-27,8,7,3.4);house(-32,34,8,7,3);
  const tableY=floor(-16,-12);k.box('wood',-16,tableY+.70,-12,1.6,.09,.8);for(const dx of [-.65,.65])for(const dz of [-.27,.27]){const b=height(-16+dx,-12+dz);k.box('wood',-16+dx,(b+tableY+.655)/2,-12+dz,.07,tableY+.655-b,.07);}k.box('linen',-16,tableY+.765,-12,.8,.04,.5);block(-16,tableY,-12,1.6,.8,.8);
  // Fixed low facade light is a modern readability choice, not a recovered street-light system.
  for(const [px,pz] of [[8,-18.7],[18,-18.7],[-15,16]]){const light=new THREE.PointLight('#ffd4a0',10,9,2);light.position.set(px,height(px,pz)+1.1,pz);light.name='parables-modern-reading-light';scene.add(light);}
 }
 for(let row=0;row<2;row++)for(let j=0;j<5;j++){const x=-45+j*22+(row%2)*6,z=-68-row*22+(j%2)*3;house(x,z,7+k.rand()*2,6+k.rand()*2,3+k.rand()*.5);if((row+j)%2===0)tree(x-5,z+7,.8);}
 for(let i=0;i<9;i++)tree(49+(i%3)*9,-51+Math.floor(i/3)*29,.75+k.rand()*.25);
 const ty=floor(-5,7);k.box('wood',-5,ty+.77,7,1.8,.1,1.25);for(const x of [-5.72,-4.28])for(const z of [6.55,7.45]){const b=height(x,z)-.02,t=ty+.72;k.box('wood',x,(b+t)/2,z,.075,t-b,.075);}block(-5,ty,7,1.8,.83,1.25);
 const spawns=s.id==='seed'?[[-14,2],[-10,2],[0,2],[14,2],[18,2],[14,-12],[-14,18],[-9,18],[0,18],[8,18],[18,18],[24,18]]:[[-14,2],[-10,2],[0,2],[8,2],[18,2],[24,2],[-14,18],[-9,18],[0,18],[8,18],[18,18],[24,18]];
 spawns.forEach(([x,z],i)=>k.person(x,floor(x,z),z,i,0,i%6===0?1.12:1.7,{role:'parables-resident'}));
 return {height,moment,night:s.id==='lamp'?true:null,flock,dispose(){flock?.dispose();for(const m of owned)m.dispose();owned.clear();}};
}
export function attachParablesExploration(scene,k,segment,phase,{blenderAssets=false,onReady=()=>{},assetLoader}={}){const s=parablesSegmentById.get(segment)||parablesSegmentById.get('seed'),walkModel=createParablesWalkModel([...k.collisionBoxes],s.id),npcSystem=createNPCSystem({actors:k.actors,model:walkModel,pois:parablesPOIs(s.id),seed:211126+s.number*1091,spawnCandidates:parablesSpawnCandidates(s.id),spawnExclusion:s.spawn,allowRetreat:true}),objects=parablesObjects.filter(o=>o.segment===s.id).map(d=>{const root=createVessel(d.id,{blenderAssets,onReady,assetLoader});root.position.fromArray(d.position);scene.add(root);return {...d,root};});return {walkModel,npcSystem,objects};}
