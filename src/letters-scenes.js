import * as THREE from 'three';
import {createWalkModel} from './walk-model.js';
import {createNPCSystem} from './npc-system.js';
import {createVessel} from './vessels.js';
import {lettersFloor,lettersWalkConfig,lettersPOIs,lettersSpawnCandidates} from './letters-exploration.js';
export function createLettersWalkModel(boxes,segment,phase){const c=lettersWalkConfig(segment,phase);return createWalkModel(boxes,c.surfaces,(x,z)=>lettersFloor(c.space,x,z),{proxies:[],navigationStep:.55});}
export function buildLettersScene(k,scene,segment,phase){
 const c=lettersWalkConfig(segment,phase),space=c.space,owned=new Set(),floor=(x,z)=>lettersFloor(space,x,z),mat=o=>{const m=new THREE.MeshStandardMaterial(o);owned.add(m);return m;};
 const marker=name=>{const g=new THREE.Group();g.name=name;scene.add(g);return g;},block=(x,y,z,w,h,d)=>k.collisionBoxes.push({min:[x-w/2,y-.03,z-d/2],max:[x+w/2,y+h,z+d/2]});
 const height=(x,z)=>{const edge=THREE.MathUtils.smoothstep(Math.max(Math.abs(x)-43,Math.abs(z)-45),0,130),b=floor(THREE.MathUtils.clamp(x,-47,47),THREE.MathUtils.clamp(z,-49,49));return b+edge*(4+13*Math.sin(x*.018+z*.015)**2+3*Math.sin(z*.03)**2);};
 for(const [size,n,near]of [[1600,180,false],[100,200,true]]){
  const g=new THREE.PlaneGeometry(size,size,n,n);g.rotateX(-Math.PI/2);const p=g.attributes.position,colors=[],idx=[];for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),col=new THREE.Color(space==='dispatch'?'#aaa38d':'#b4aa93');col.offsetHSL(.008*Math.sin(x*.13),.015*Math.sin(z*.11),.035*Math.sin(x*.13)*Math.cos(z*.08)+.014*Math.sin(x*1.3+z*.9));p.setY(i,height(x,z)-(near?0:.04));colors.push(col.r,col.g,col.b);}for(let i=0;i<g.index.count;i+=3){const a=[g.index.getX(i),g.index.getX(i+1),g.index.getX(i+2)],x=a.reduce((s,j)=>s+p.getX(j),0)/3,z=a.reduce((s,j)=>s+p.getZ(j),0)/3;if(!near&&Math.abs(x)<45&&Math.abs(z)<45)continue;if(near&&space==='writing'&&Math.abs(x)<9.5&&z>-21.5&&z<-3)continue;idx.push(...a);}g.setIndex(idx);g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();const m=new THREE.Mesh(g,mat({vertexColors:true,roughness:1}));m.name=near?'letters-public-ground':'letters-layered-landscape';m.receiveShadow=true;scene.add(m);
 }
 function path(points,width){const curve=new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,0,z))),v=[],f=[];for(let i=0;i<=120;i++){const p=curve.getPoint(i/120),t=curve.getTangent(i/120);for(const sign of [-1,1]){const x=p.x+sign*t.z*width/2,z=p.z-sign*t.x*width/2;v.push(x,height(x,z)+.006,z);}if(i){const j=(i-1)*2;f.push(j,j+2,j+3,j,j+3,j+1);}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(f);g.computeVertexNormals();const m=new THREE.Mesh(g,mat({color:'#c1b395',roughness:1}));m.name='letters-selected-public-path';m.receiveShadow=true;scene.add(m);}
 function house(x,z,w=8,d=7,h=3.2){const y=Math.max(...[-w/2,w/2].flatMap(dx=>[-d/2,d/2].map(dz=>height(x+dx,z+dz))));k.house(x,y,z,w,d,h,'plaster');block(x,y-4,z,w+.3,h+4.6,d+.3);}
 function tree(x,z,a=1){const y=height(x,z);k.beam('trunk',[x,y,z],[x+.08,y+2.7*a,z],.15*a);for(let i=0;i<7;i++){const b=i*2.4,end=[x+Math.cos(b)*1.5*a,y+(2.8+i%3*.22)*a,z+Math.sin(b)*1.5*a];k.beam('trunk',[x,y+1.6*a,z],end,.055*a);for(let j=0;j<70;j++)k.part('leaf','leaf',end[0]+(k.rand()-.5)*1.9*a,end[1]+(k.rand()-.5)*.8*a,end[2]+(k.rand()-.5)*1.9*a,.15*a,1,1,k.rand(),k.rand()*6.28,k.rand());}block(x,y,z,.55,3.5*a,.55);}
 function shade(x,z,w=6,d=3){const top=Math.max(...[-w/2,w/2].flatMap(dx=>[-d/2,d/2].map(dz=>height(x+dx,z+dz))))+2.4;for(const dx of [-w/2,w/2])for(const dz of [-d/2,d/2]){const b=height(x+dx,z+dz)-.02;k.cyl('wood',x+dx,(b+top)/2,z+dz,.06,top-b);block(x+dx,b,z+dz,.18,top-b,.18);}for(let i=0;i<=Math.ceil(d/.18);i++)k.box('reed',x,top,z-d/2+i*d/Math.ceil(d/.18),w+.2,.05,.12);}
 function bench(x,z,w=3){const y=Math.max(height(x-w/2,z),height(x+w/2,z))+.5;k.box('wood',x,y,z,w,.12,.6);for(const dx of [-w*.36,w*.36]){const b=height(x+dx,z)-.02;k.box('wood',x+dx,(b+y-.06)/2,z,.12,y-.06-b,.5);}block(x,height(x,z),z,w,.62,.7);}
 function wall(x,z,l,axis='x',h=.8){const y=height(x,z);k.wall(x,y,z,l,h,.45,axis,'stone',.75,.3);block(x,y,z,axis==='x'?l:.45,h,axis==='z'?l:.45);}
 function jars(x,z){for(let i=0;i<3;i++)k.jar(x+i*.48,height(x+i*.48,z),z,.24+i*.035);block(x+.5,height(x,z),z,1.8,.6,.8);}
 function light(x,z){const p=new THREE.PointLight('#ffd5a4',9,9,2);p.position.set(x,height(x,z)+1.2,z);p.name='letters-modern-reading-light';scene.add(p);}
 marker('letters-space-'+space);marker('letters-reading-moment-'+c.phase);
 path([[21,47],[17,23],[11,12],[10,-2],[17,-25],[33,-48]],2.8);path([[-42,11],[-15,10],[-5,9],[11,12],[33,13],[52,20]],2.2);
 shade(-15,17,6,2.8);bench(-15,23,3.6);bench(25,19,3);jars(26,0);
 function visibleRoom(x,z,w,d,h,{publicRoom=false}={}){
  const y=publicRoom?floor(x,z):height(x,z),t=.5;
  k.box('stone',x,y-.09,z,w+.2,.18,d+.2);k.wall(x,y,z-d/2,w,h,t,'x','stone',.85,.34);
  for(const sign of [-1,1]){k.wall(x+sign*w/2,y,z,d,h,t,'z','stone',.85,.34);block(x+sign*w/2,y,z,t,h,d);}
  block(x,y,z-d/2,w,h,t);const opening=publicRoom?5:3.4;
  for(const sign of [-1,1]){const px=x+sign*(w+opening)/4;k.wall(px,y,z+d/2,(w-opening)/2,h,t,'x','stone',.85,.34);block(px,y,z+d/2,(w-opening)/2,h,t);}
  k.box('wood',x,y+2.5,z+d/2,opening+.4,.18,.65);k.box('plaster',x,y+(2.6+h)/2,z+d/2,opening,h-2.6,t);block(x,y+2.4,z+d/2,opening,h-2.4,t);
  for(let i=0;i<11;i++)k.box('wood',x-w*.46+i*w*.092,y+h+.05,z,.15,.16,d+.1);
  k.box('sand',x,y+h+.20,z,w+.2,.16,d+.2);
  return y;
 }
 if(space==='writing'){
  // Selected document-work room; not Paul's or Tertius' original desk or writing city.
  const y=visibleRoom(0,-12.5,20,19,3.7,{publicRoom:true});marker('letters-selected-public-interior');
  // A blank ordinary working surface and container; detailed materials are a separate modern comparison.
  k.box('wood',-5,y+.73,-16,3.2,.12,1.1);for(const x of [-6.3,-3.7])for(const z of [-16.4,-15.6])k.box('wood',x,y+.335,z,.1,.67,.1);block(-5,y,-16,3.2,.85,1.1);k.box('linen',-5,y+.797,-16,.6,.014,.38);k.jar(-3,y,-17,.20);
  for(const [x,z]of [[-7,-17],[7,-17],[-7,-7],[7,-7]]){k.box('linen',x,y+.025,z,1.2,.05,.7);k.jar(x,y,z-1,.25);}
  house(-32,-24,10,9,3.6);house(36,-25,10,10,4.2);wall(-26,3,27,'z',.8);wall(33,5,25,'z',.8);tree(-29,25,.95);tree(39,21,1.1);jars(-17,-6);
 }else if(space==='listening'){
  visibleRoom(2,-29,22,12,3.7);house(-32,-25,10,10,4.1);house(35,-27,10,9,3.8);wall(-25,4,28,'z',1);wall(33,3,27,'z',1);
  shade(15,-10,8,4);bench(15,-12,5);bench(-15,-4,4);jars(-18,-8);tree(-29,23,1.1);tree(39,18,1);
  const group=marker('letters-selected-listening-comparison');group.userData.readingFocus=c.phase;group.userData.direction=c.phase==='exchange'?'receivers-laodicea-return-letter':'communal-life';
  // Ordinary gathering support, not an original pulpit, measured reception plan or fixed audience.
  for(const [x,z]of [[-17,-16],[17,-18],[7,-19]]){bench(x,z,3.8);}const r=marker('letters-two-places-not-one-room');r.userData.otherEnd='Laodicea-reading-instruction';
 }else{
  // Syrian Antioch background is selected urban life; no measured letters plan or miniature map.
  marker('letters-new-document-colossians');visibleRoom(0,-30,25,13,4.3);house(-34,-25,10,11,4.6);house(39,-26,10,10,4.2);
  const y=height(29,-3);for(let i=0;i<7;i++){const z=-16+i*4.6,b=height(29,z);k.cyl('stone',29,b+2.25,z,.23,4.5);k.box('stone',29,b+4.5,z,.7,.22,.7);}k.box('stone',29,y+4.75,-2.2,.8,.4,29);block(29,y,-2.2,.6,5,29);
  wall(-25,3,29,'z',.9);tree(-31,23,1.1);tree(40,24,1.2);jars(-18,-7);shade(16,-8,8,4);bench(15,-6,4);
  const focus=marker('letters-message-'+c.phase);focus.userData.relationship='sent-companion-news-comfort';
 }
 for(let row=0;row<3;row++)for(let i=0;i<5;i++){const x=-48+i*24+(row%2)*7,z=-65-row*20+(i%2)*5;house(x,z,7+k.rand()*3,6+k.rand()*3,3+k.rand()*.9);if((row+i)%3===0)tree(x-5,z+7,.8);}
 const ty=floor(-5,7);k.box('wood',-5,ty+.77,7,1.8,.1,1.25);for(const x of [-5.72,-4.28])for(const z of [6.55,7.45]){const b=height(x,z)-.02,top=ty+.72;k.box('wood',x,(b+top)/2,z,.075,top-b,.075);}block(-5,ty,7,1.8,.83,1.25);
 [[-14,2],[-10,2],[0,2],[8,2],[18,2],[24,2],[-14,18],[-9,18],[0,18],[8,18],[18,18],[24,18]].forEach(([x,z],i)=>k.person(x,floor(x,z),z,i,0,i%6===0?1.12:1.7,{role:'letters-resident'}));
 return {height,moment:c.moment,space,night:false,dispose(){for(const m of owned)m.dispose();owned.clear();}};
}
export function attachLettersExploration(scene,k,segment,phase,{blenderAssets=false,onReady=()=>{},assetLoader}={}){
 const c=lettersWalkConfig(segment,phase),walkModel=createLettersWalkModel([...k.collisionBoxes],c.id,c.phase),npcSystem=createNPCSystem({actors:k.actors,model:walkModel,pois:lettersPOIs(c.id,c.phase),seed:241117+c.number*1091+c.phase.length*61,spawnCandidates:lettersSpawnCandidates(c.id,c.phase),spawnExclusion:c.spawn,allowRetreat:true});
 const objects=c.objects.map(d=>{const root=createVessel(d.id,{blenderAssets,onReady,assetLoader});root.position.fromArray(d.position);scene.add(root);return {...d,root};});return {walkModel,npcSystem,objects};
}
