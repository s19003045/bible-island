import * as THREE from 'three';
import {createWalkModel} from './walk-model.js';
import {createNPCSystem} from './npc-system.js';
import {createVessel} from './vessels.js';
import {josephFloor,josephObjects,josephSegmentById,josephPOIs,josephSpawnCandidates} from './joseph-exploration.js';

// Original observation settings, in metres. No identified Dothan pit, Egyptian
// warehouse or house is claimed. Grain buildings compare functions, not dates.
export function buildJosephScene(k,scene,segment,{blenderAssets=false,onReady=()=>{},assetLoader}={}){
 const s=josephSegmentById.get(segment)||josephSegmentById.get('caravan'),road=s.id==='caravan',floor=(x,z)=>josephFloor(s.id,x,z);
 const height=(x,z)=>floor(x,z)+(road?THREE.MathUtils.smoothstep(Math.max(Math.abs(x)-37,Math.abs(z)-40),0,120)*(12+27*Math.sin(x*.017+z*.009)**2+6*Math.cos(z*.029)):THREE.MathUtils.smoothstep(Math.max(Math.abs(x)-90,Math.abs(z)-100),0,280)*(3+4*Math.sin(x*.011)**2));
 const earth=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1});
 function ground(size,divisions,near){const g=new THREE.PlaneGeometry(size,size,divisions,divisions);g.rotateX(-Math.PI/2);const p=g.attributes.position,colors=[];for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),color=new THREE.Color(road?'#a39a7c':s.id==='grain'?'#b29c76':'#ad9a7d');color.offsetHSL(0,0,.025*Math.sin(x*.19)*Math.cos(z*.12));p.setY(i,height(x,z)-(near?.009:.04));colors.push(color.r,color.g,color.b);}const index=[];for(let i=0;i<g.index.count;i+=3){const ids=[g.index.getX(i),g.index.getX(i+1),g.index.getX(i+2)],x=ids.reduce((v,j)=>v+p.getX(j),0)/3,z=ids.reduce((v,j)=>v+p.getZ(j),0)/3;if(!near&&Math.abs(x)<44&&Math.abs(z)<44)continue;if(near&&road&&Math.hypot(x+24,z+5)<1.8)continue;index.push(...ids);}g.setIndex(index);g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();const mesh=new THREE.Mesh(g,earth);mesh.name=near?'joseph-observation-ground':'joseph-landscape-'+s.id;mesh.receiveShadow=true;scene.add(mesh);}
 ground(1500,180,false);ground(96,128,true);
 function path(points,width){const curve=new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,0,z))),v=[],f=[];for(let i=0;i<=120;i++){const p=curve.getPoint(i/120),t=curve.getTangent(i/120);for(const side of [-1,1]){const w=width*(.49+.025*Math.sin(i*.61)),x=p.x+t.z*w*side,z=p.z-t.x*w*side;v.push(x,height(x,z)+.018,z);}if(i){const j=(i-1)*2;f.push(j,j+2,j+3,j,j+3,j+1);}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(f);g.computeVertexNormals();const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:road?'#b6a080':'#c0ac89',roughness:1}));m.name='joseph-worn-path';m.receiveShadow=true;scene.add(m);}
 path([[20,48],[15,27],[10,17],[5,6],[9,-14],[16,-36]],road?2.3:3);path([[-32,19],[-18,13],[-5,10],[10,10],[28,7],[44,1]],2);
 const block=(x,y,z,w,h,d)=>k.collisionBoxes.push({min:[x-w/2,y,z-d/2],max:[x+w/2,y+h,z+d/2]});
 function tree(x,z,scale=1,palm=false){const y=height(x,z);if(palm){const top=[x+.3,y+7*scale,z];k.beam('trunk',[x,y,z],top,.22*scale);for(let j=0;j<12;j++){const a=j*Math.PI/6,dx=Math.cos(a),dz=Math.sin(a),mid=[top[0]+dx*2*scale,top[1]+.6*scale,top[2]+dz*2*scale],end=[top[0]+dx*3.8*scale,top[1]-1.4*scale,top[2]+dz*3.8*scale];k.beam('leaf',top,mid,.045*scale);k.beam('leaf',mid,end,.035*scale);for(let q=1;q<17;q++){const t=q/17,px=THREE.MathUtils.lerp(mid[0],end[0],t),pz=THREE.MathUtils.lerp(mid[2],end[2],t),py=THREE.MathUtils.lerp(mid[1],end[1],t);for(const side of [-1,1])k.part('leaf','leaf',px+dz*side*.28*scale,py,pz-dx*side*.28*scale,1.35*(1-t*.6)*scale,.9*scale,.9*scale,.1,a+side*.65,-.3);}}}else{k.beam('trunk',[x,y,z],[x+.2,y+3.4*scale,z],.19*scale);for(let j=0;j<9;j++){const a=j*2.4,end=[x+Math.cos(a)*(1.2+j%3*.4)*scale,y+(3.3+j%3*.35)*scale,z+Math.sin(a)*(1.2+j%3*.4)*scale];k.beam('trunk',[x+.15,y+1.9*scale,z],end,.065*scale);for(let n=0;n<70;n++)k.part('leaf','leaf',end[0]+(k.rand()-.5)*2.1*scale,end[1]+(k.rand()-.5)*.8*scale,end[2]+(k.rand()-.5)*2.1*scale,(.13+k.rand()*.1)*scale,1,1,k.rand(),k.rand()*6.28,k.rand());}}block(x,y,z,.6,3,.6);}
 function shade(x,z,w=4,d=3){const y=height(x,z);for(const dx of [-w/2,w/2])for(const dz of [-d/2,d/2]){k.cyl('wood',x+dx,y+1.15,z+dz,.055,2.3);block(x+dx,y,z+dz,.2,2.4,.2);}for(let j=0;j<15;j++)k.box('reed',x,y+2.3+.06*Math.cos(j*.4),z-d/2+j*d/14,w+.25,.04,.10);for(const dz of [-d/2,d/2])k.beam('wood',[x-w/2,y+2.3,z+dz],[x+w/2,y+2.3,z+dz],.055);}
 function table(x,z,w=2,d=.8){const y=height(x,z);k.box('wood',x,y+.76,z,w,.1,d);for(const dx of [-w*.4,w*.4])for(const dz of [-d*.35,d*.35])k.box('wood',x+dx,y+.36,z+dz,.075,.72,.075);block(x,y,z,w,.83,d);return y+.82;}
 function house(x,z,w,d,h=3.4){const y=height(x,z);k.house(x,y,z,w,d,h,'mud');block(x,y-.2,z,w+2,h+1,d+2);}
 if(road){
  // Actual empty shaft with inner wall and bottom, outside the public route.
  const x=-24,z=-5,y=height(x,z),mat=new THREE.MeshStandardMaterial({color:'#847563',roughness:1,side:THREE.DoubleSide});
  const wall=new THREE.Mesh(new THREE.CylinderGeometry(1.48,1.15,3.2,48,1,true),mat);wall.position.set(x,y-1.6,z);wall.name='joseph-dry-pit-interior';wall.receiveShadow=true;scene.add(wall);
  const rim=new THREE.Mesh(new THREE.RingGeometry(1.47,2.4,64),mat);rim.rotation.x=-Math.PI/2;rim.position.set(x,y+.015,z);rim.name='joseph-dry-pit-rim';scene.add(rim);
  const bottom=new THREE.Mesh(new THREE.CircleGeometry(1.17,48),mat);bottom.rotation.x=-Math.PI/2;bottom.position.set(x,y-3.19,z);bottom.name='joseph-empty-pit-bottom';scene.add(bottom);block(x,y-3.2,z,5,4,5);
  for(const [tx,tz,scale] of [[-31,16,1],[33,-13,1.2],[8,-34,.9]]){k.tent(tx,height(tx,tz),tz,scale);block(tx,height(tx,tz),tz,7.6*scale,3,4*scale);}
  for(const [x,z,scale] of [[-20,22,1.2],[34,23,1],[-36,-25,.9],[5,-32,1.2],[-12,0,1],[47,-2,.85]])tree(x,z,scale);
  for(let i=0;i<110;i++){const x=(i%2?-1:1)*(32+k.rand()*68),z=-58+k.rand()*120;k.ball('darkstone',x,height(x,z)-.1,z,.4+k.rand()*1.5,.3+k.rand()*.8,.5+k.rand());}
  shade(-24,17,5,3);for(const [x,z] of [[-27,17],[33,-9],[-29,14]]){const y=height(x,z);k.box('hide',x,y+.25,z,1,.5,.7);k.jar(x+.85,y,z,.48);}
 }else if(s.id==='grain'){
  // Larger work-yard repeats the original cutaway's functional vocabulary,
  // without copying museum floorplans or claiming a Joseph-period warehouse.
  const store=createVessel('joseph-granary',{blenderAssets,onReady,assetLoader});store.name='joseph-grain-work-building';store.scale.setScalar(12);store.position.set(-25,height(-25,-18),-18);store.rotation.y=.12;scene.add(store);block(-25,height(-25,-18),-18,21,9,16);
  house(13,-29,12,9,4);house(37,-17,9,10,3.5);house(-37,19,8,7,3.4);shade(-23,12,5,4);shade(34,7,5,3);
  const ty=table(34,7,2.8,1.1);k.box('wood',34,ty+.025,7,.65,.035,.4);k.box('linen',34.8,ty+.04,7,.45,.04,.3); // blank record materials
  for(const [x,z] of [[-20,-5],[-23,-5],[-37,24],[33,11],[36,11]]){const y=height(x,z);for(let j=0;j<3;j++){k.ball('linen',x+j*.55,y+.32,z,.55,.65,.48);k.cyl('hide',x+j*.55,y+.63,z,.04,.05);}k.jar(x,y,z+1,.5);}
  // Varied field patches are outside the observation rectangle. No crop/year
  // is presented as the excavated field belonging to a named biblical person.
  for(const [cx,cz,w,d] of [[-62,0,25,40],[-58,58,32,30],[55,55,30,25],[63,-38,26,30]]){for(let row=0;row<14;row++){const z=cz-d/2+row*d/14;k.box('court',cx,height(cx,z)+.01,z,w,.06,.27);for(let j=0;j<26;j++){const x=cx-w/2+j*w/26,y=height(x,z);k.beam('reed',[x,y,z],[x+.05,y+.65+k.rand()*.22,z],.018);for(let q=0;q<3;q++)k.part('leaf','reed',x,y+.48+q*.09,z,.22,1,1,.1,q*1.8,.4);}}}
  for(const [x,z,scale] of [[-40,-32,1],[-39,7,.9],[37,25,.95],[12,40,.9],[55,-12,1.1],[-65,34,.9]])tree(x,z,scale,true);
 }else{
  house(1,-21,14,10,4);house(-30,-12,9,8,3.6);house(36,4,8,11,3.6);house(37,29,9,8,3.4);house(-28,30,8,7,3.2);
  // A private house beyond the observation area; no staged named family or
  // Jacob already in Egypt. The open courtyard holds preparations for travel.
  shade(2,-7,6,4);shade(-23,14,5,3);const ty=table(-23,14,2.5,1);k.jar(-23,ty,14,.35);k.box('linen',-22.3,ty+.07,14,.55,.12,.45);
  for(const [x,z] of [[-28,23],[32,-2],[5,-11],[-33,-5]]){const y=height(x,z);k.jar(x,y,z,.48);k.jar(x+.7,y,z,.35);k.box('hide',x+1.3,y+.22,z,.8,.44,.65);block(x+.6,y,z,2.4,1.2,1.3);}
  for(const [x,z,scale,palm] of [[-19,1,1.15,false],[31,-15,1,true],[-12,35,1,true],[-35,16,.9,true],[21,-31,1,false],[46,-26,.9,true]])tree(x,z,scale,palm);
  for(const x of [-19,30])k.wall(x,height(x,0),0,18,.7,.5,'z','mud',.6,.18);
 }
 // Inspection table is accessible from the south, and has actual legs.
 table(-5,7,1.8,1.25);
 for(let i=0;i<12;i++){const x=i<6?-13+(i%3)*6:10+(i%3)*6,z=i%2?21:-2;k.person(x,floor(x,z),z,i,0,i%6===0?1.12:1.7,{role:'joseph-resident',wardrobe:road?'caravan':'egypt'});}
 const marker=new THREE.Group();marker.name='joseph-chapter-'+s.id;scene.add(marker);
 return height;
}
export function attachJosephExploration(scene,k,segment,{blenderAssets=false,onReady=()=>{},assetLoader}={}){
 const s=josephSegmentById.get(segment)||josephSegmentById.get('caravan'),floor=(x,z)=>josephFloor(s.id,x,z),data=josephObjects.filter(o=>o.segment===s.id),boxes=[...k.collisionBoxes];
 const walkModel=createWalkModel(boxes,s.surfaces,floor,{proxies:[],navigationStep:.55}),npcSystem=createNPCSystem({actors:k.actors,model:walkModel,pois:josephPOIs(s.id),seed:37026+s.number*641,spawnCandidates:josephSpawnCandidates(s.id),spawnExclusion:s.spawn,allowRetreat:true});
 const objects=data.map(d=>{const root=createVessel(d.id,{blenderAssets,onReady,assetLoader});root.position.fromArray(d.position);scene.add(root);return {...d,root};});return {walkModel,npcSystem,objects};
}
