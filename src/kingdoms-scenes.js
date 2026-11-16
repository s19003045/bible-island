import * as THREE from 'three';
import {createWalkModel} from './walk-model.js';
import {createNPCSystem} from './npc-system.js';
import {createVessel} from './vessels.js';
import {kingdomsFloor,kingdomsSegmentById,kingdomsObjects,kingdomsPOIs,kingdomsSpawnCandidates} from './kingdoms-exploration.js';

// Original public environments. Separate chapters do not establish distances or original sites.
export function buildKingdomsScene(k,scene,segment){
 const s=kingdomsSegmentById.get(segment)||kingdomsSegmentById.get('south'),floor=(x,z)=>kingdomsFloor(s.id,x,z);
 const height=(x,z)=>floor(x,z)+THREE.MathUtils.smoothstep(Math.max(Math.abs(x)-39,Math.abs(z)-43),0,115)*(6+15*Math.sin(x*.015+z*.008)**2+8*Math.cos(z*.023)**2);
 const earth=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1});
 function ground(size,n,near){const g=new THREE.PlaneGeometry(size,size,n,n);g.rotateX(-Math.PI/2);const p=g.attributes.position,colors=[];
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),c=new THREE.Color(s.id==='north'?'#92967c':s.id==='south'?'#a49e89':'#a59b80');c.offsetHSL(0,0,.026*Math.sin(x*.12)*Math.cos(z*.11));p.setY(i,height(x,z)-(near?.008:.04));colors.push(c.r,c.g,c.b);}
  const indices=[];for(let i=0;i<g.index.count;i+=3){const ids=[g.index.getX(i),g.index.getX(i+1),g.index.getX(i+2)],x=ids.reduce((v,j)=>v+p.getX(j),0)/3,z=ids.reduce((v,j)=>v+p.getZ(j),0)/3;if(!near&&Math.abs(x)<44&&Math.abs(z)<44)continue;indices.push(...ids);}
  g.setIndex(indices);g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();const m=new THREE.Mesh(g,earth);m.name=near?'kingdoms-public-ground':'kingdoms-landscape-'+s.id;m.receiveShadow=true;scene.add(m);
 }ground(1500,180,false);ground(96,128,true);
 const block=(x,y,z,w,h,d)=>k.collisionBoxes.push({min:[x-w/2,y,z-d/2],max:[x+w/2,y+h,z+d/2]});
 function marker(name){const g=new THREE.Group();g.name=name;scene.add(g);return g;}
 function path(points,width){const curve=new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,0,z))),v=[],f=[];
  for(let i=0;i<=100;i++){const p=curve.getPoint(i/100),t=curve.getTangent(i/100);for(const side of [-1,1]){const x=p.x+t.z*width*.5*side,z=p.z-t.x*width*.5*side;v.push(x,height(x,z)+.016,z);}if(i){const j=(i-1)*2;f.push(j,j+2,j+3,j,j+3,j+1);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(f);g.computeVertexNormals();const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:'#b0a184',roughness:1}));m.name='kingdoms-public-path';m.receiveShadow=true;scene.add(m);
 }
 function house(x,z,w=8,d=7,h=3.4){const y=height(x,z);k.house(x,y,z,w,d,h,'stone');block(x,y-.2,z,w+2,h+1,d+2);}
 function tree(x,z,scale=1){const y=height(x,z);k.olive(x,y,z,scale);block(x,y,z,.7,3*scale,.7);}
 function shade(x,z,w=5){const y=height(x,z);for(const dx of [-w/2,w/2])for(const dz of [-1.7,1.7]){k.cyl('wood',x+dx,y+1.15,z+dz,.055,2.3);block(x+dx,y,z+dz,.2,2.4,.2);}for(let i=0;i<17;i++)k.box('reed',x,y+2.3,z-1.7+i*.2,w+.3,.05,.14);}
 function jars(x,z){const y=height(x,z);for(let i=0;i<3;i++)k.jar(x+i*.65,y,z,i===1?.36:.46);k.box('linen',x+.4,y+.16,z+.8,.7,.32,.6);block(x+.65,y,z+.4,2.5,1.1,1.8);}
 function bench(x,z,length=4){const y=height(x,z);k.box('stone',x,y+.46,z,length,.2,.85);for(const dx of [-length*.35,length*.35])k.box('stone',x+dx,y+.2,z,.4,.4,.7);block(x,y,z,length,.65,.85);}
 path([[19,47],[17,26],[9,17],[7,1],[2,-23],[-4,-51]],2.8);path([[-36,15],[-17,13],[-5,10],[17,10],[42,4]],2);
 // Village clusters remain outside the public collision route; none identifies an excavated town plan.
 const shift=s.id==='south'?0:s.id==='north'?11:-8;
 for(let row=0;row<3;row++)for(let col=0;col<4;col++){const x=-43+col*24+shift+(row%2)*7,z=-75-row*19,w=6+k.rand()*3,d=6+k.rand()*2,h=3+k.rand()*1.5;house(x,z,w,d,h);}
 for(const side of [-1,1])for(let i=0;i<10;i++){const x=side*(48+(i%3)*10),z=-58+i*12+shift;tree(x,z,.8+k.rand()*.5);if(i%3===0)jars(x+2,z+2);}
 // Distant terraces and differently spaced houses establish a broad, inhabited horizon.
 for(const side of [-1,1])for(let row=0;row<3;row++)for(let j=0;j<5;j++){const x=side*(51+row*14),z=-64+j*26,y=height(x,z);k.wall(x,y-.35,z,19,.65,.6,'z','stone',1.1,.3);}
 if(s.id==='south'){
  marker('kingdoms-shechem-assembly-context');
  for(const [x,z,w,d,h] of [[-27,-28,11,8,4],[1,-37,12,8,4.4],[20,-35,8,7,3.6],[-30,36,9,8,3.5],[39,27,10,8,3.8],[-9,-54,9,8,3.9],[34,-53,10,8,4.5]])house(x,z,w,d,h);
  shade(-26,9,8);shade(35,9,6);bench(-25,15,6);bench(34,16,5);jars(-28,22);jars(35,2);
  for(const [x,z,scale] of [[-23,30,1.4],[34,-15,1.1],[-32,-8,1.3],[8,39,.9],[-41,-43,1.2]])tree(x,z,scale);
  // A public sitting area suggests listening, without asserting an excavated royal seating plan.
  for(let i=0;i<3;i++)bench(-22+i*3,-11,2);
 }else if(s.id==='north'){
  marker('kingdoms-bethel-reading-context');
  path([[-28,48],[-23,30],[-20,-4],[-32,-34],[-48,-57]],2.5);
  for(const [x,z,w,d,h] of [[-33,11,8,7,3.3],[-29,-27,10,8,3.5],[6,-40,9,7,3.7],[35,-25,10,8,4],[43,29,9,8,3.3],[-20,43,8,7,3.1],[28,-54,10,8,3.9]])house(x,z,w,d,h);
  shade(35,7,7);jars(35,13);bench(-23,22,5);jars(-28,3);
  for(const [x,z,scale] of [[-24,-10,1.1],[-35,30,1.3],[34,20,1.2],[32,-7,1],[-19,-41,1],[9,39,1.1]])tree(x,z,scale);
  // No second on-site sanctuary: Dan appears only on the two-place teaching comparison.
  for(const [x,z] of [[-32,-7],[33,-41]]){const y=height(x,z);k.wall(x,y,z,13,.7,.65,'z','stone',1,.3);block(x,y,z,.8,.8,13);}
 }else{
  marker('kingdoms-later-public-gate-context');const z=-28,y=height(0,z);
  for(const side of [-1,1]){k.wall(side*4,y,z,4,4.8,4,'x','stone',.9,.4);block(side*4,y,z,4,5,4);k.wall(side*20,y,z,26,3.7,1.4,'x','stone',1.1,.45);block(side*20,y,z,26,3.9,1.4);}
  for(const dz of [-1.5,0,1.5])k.beam('wood',[-2.5,y+4.6,z+dz],[2.5,y+4.6,z+dz],.17);
  bench(-22,-12,5);bench(33,-12,5);shade(35,10,8);shade(-27,13,7);jars(33,16);jars(-26,21);
  for(const [x,z,w,d,h] of [[-24,-47,11,8,4.2],[4,-51,10,8,3.9],[24,-46,9,8,4],[-35,33,8,7,3.4],[43,33,9,8,3.7],[-7,-70,10,8,4.1]])house(x,z,w,d,h);
  for(const [x,z,scale] of [[-24,2,1.1],[34,26,1.3],[-19,39,1],[38,-40,1.1]])tree(x,z,scale);
 }
 const ty=floor(-5,7);k.box('wood',-5,ty+.76,7,1.8,.1,1.25);for(const x of [-5.72,-4.28])for(const z of [6.55,7.45])k.box('wood',x,ty+.36,z,.075,.72,.075);block(-5,ty,7,1.8,.83,1.25);
 for(let i=0;i<12;i++){const x=i<6?-13+(i%3)*6:10+(i%3)*6,z=i%2?21:-2;k.person(x,floor(x,z),z,i,0,i%6===0?1.12:1.7,{role:'kingdoms-resident'});}
 marker('kingdoms-chapter-'+s.id);return height;
}
export function attachKingdomsExploration(scene,k,segment,{blenderAssets=false,onReady=()=>{},assetLoader}={}){
 const s=kingdomsSegmentById.get(segment)||kingdomsSegmentById.get('south'),floor=(x,z)=>kingdomsFloor(s.id,x,z),walkModel=createWalkModel([...k.collisionBoxes],s.surfaces,floor,{proxies:[],navigationStep:.55}),npcSystem=createNPCSystem({actors:k.actors,model:walkModel,pois:kingdomsPOIs(s.id),seed:12026+s.number*977,spawnCandidates:kingdomsSpawnCandidates(s.id),spawnExclusion:s.spawn,allowRetreat:true}),objects=kingdomsObjects.filter(o=>o.segment===s.id).map(d=>{const root=createVessel(d.id,{blenderAssets,onReady,assetLoader});root.position.fromArray(d.position);scene.add(root);return {...d,root};});return {walkModel,npcSystem,objects};
}
