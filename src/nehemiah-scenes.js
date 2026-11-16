import * as THREE from 'three';
import {createWalkModel} from './walk-model.js';
import {createNPCSystem} from './npc-system.js';
import {createVessel} from './vessels.js';
import {nehemiahFloor,nehemiahSegmentById,nehemiahMoment,nehemiahObjects,nehemiahPOIs,nehemiahSpawnCandidates} from './nehemiah-exploration.js';

// Original observation setting: no claim to excavated walls, gate coordinates or a complete night circuit.
export function buildNehemiahScene(k,scene,segment,phase){
 const s=nehemiahSegmentById.get(segment)||nehemiahSegmentById.get('wall'),moment=nehemiahMoment(s.id,phase),night=!!moment?.night;
 const floor=(x,z)=>nehemiahFloor(s.id,x,z),height=(x,z)=>floor(x,z)+THREE.MathUtils.smoothstep(Math.max(Math.abs(x)-43,Math.abs(z)-47),0,150)*(7+14*Math.sin(x*.014+z*.012)**2);
 const owned=new Set(),material=o=>{const m=new THREE.MeshStandardMaterial(o);owned.add(m);return m;};
 const earth=material({vertexColors:true,roughness:1});
 for(const [size,n,near] of [[1500,180,false],[100,140,true]]){const g=new THREE.PlaneGeometry(size,size,n,n);g.rotateX(-Math.PI/2);const p=g.attributes.position,c=[],indices=[];
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),col=new THREE.Color(s.id==='scroll'?'#a79c85':'#9b977d');p.setY(i,height(x,z)-(near?.009:.045));col.offsetHSL(0,0,.025*Math.sin(x*.2)*Math.cos(z*.13));c.push(col.r,col.g,col.b);}
  for(let i=0;i<g.index.count;i+=3){const ids=[g.index.getX(i),g.index.getX(i+1),g.index.getX(i+2)],x=ids.reduce((a,j)=>a+p.getX(j),0)/3,z=ids.reduce((a,j)=>a+p.getZ(j),0)/3;if(!near&&Math.abs(x)<46&&Math.abs(z)<46)continue;indices.push(...ids);}
  g.setIndex(indices);g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));g.computeVertexNormals();const mesh=new THREE.Mesh(g,earth);mesh.name=near?'nehemiah-public-ground':'nehemiah-layered-city-hills';mesh.receiveShadow=true;scene.add(mesh);
 }
 const block=(x,y,z,w,h,d)=>k.collisionBoxes.push({min:[x-w/2,y-.15,z-d/2],max:[x+w/2,y+h,z+d/2]});
 const marker=name=>{const g=new THREE.Group();g.name=name;scene.add(g);return g;};
 function path(points,width){const curve=new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,0,z))),v=[],f=[];for(let i=0;i<=90;i++){const p=curve.getPoint(i/90),t=curve.getTangent(i/90);for(const sign of [-1,1]){const x=p.x+sign*t.z*width/2,z=p.z-sign*t.x*width/2;v.push(x,height(x,z)+.015,z);}if(i){const j=(i-1)*2;f.push(j,j+2,j+3,j,j+3,j+1);}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(f);g.computeVertexNormals();const mesh=new THREE.Mesh(g,material({color:'#b8a78a',roughness:1}));mesh.name='nehemiah-public-path';mesh.receiveShadow=true;scene.add(mesh);}
 function wall(x,z,length,h,depth=.95){const y=height(x,z);k.box('sand',x,y+h/2,z,length-.005,h-.02,depth*.91);k.wall(x,y,z,length,h,depth,'x','stone',.83,.34);block(x,y,z,length,h+.15,depth+.1);}
 function house(x,z,w=8,d=7,h=3.3){const y=height(x,z),t=.42,door=1.2;k.box('stone',x,y-.12,z,w+.25,.24,d+.25);k.wall(x,y,z-d/2,w,h,t,'x','stone',.7,.3);for(const sign of [-1,1]){k.wall(x+sign*(w/2-t/2),y,z,d,h,t,'z','sand',.64,.27);k.wall(x+sign*(w+door)/4,y,z+d/2,(w-door)/2,h,t,'x','sand',.64,.27);}k.box('plaster',x,y+2.25+(h-2.25)/2,z+d/2,door+.04,h-2.25,t);k.box('wood',x,y+2.2,z+d/2,door+.3,.15,.56);k.box('black',x,y+1,z+d/2-.26,door,2,.02);
  for(let i=0;i<7;i++)k.box('wood',x-w*.43+i*w*.86/6,y+h,z,.13,.15,d+.1);k.box('sand',x,y+h+.12,z,w+.2,.14,d+.2);for(const sign of [-1,1]){k.box('plaster',x+sign*w/2,y+h+.34,z,.23,.35,d);k.box('black',x+sign*w*.31,y+2.5,z+d/2+.23,.34,.36,.02);}for(const dz of [-d/2,d/2])k.box('plaster',x,y+h+.34,z+dz,w,.35,.23);block(x,y,z,w+1,h+.9,d+1);wall(x+w*.25,z+d/2+2.8,w*.65,.65,.32);k.jar(x+w*.3,y,z+d/2+1.4,.4);k.jar(x+w*.3+.55,y,z+d/2+1.4,.3);
 }
 function unfinishedHouse(x,z,w=8,d=7,h=1.2){const y=height(x,z);k.box('stone',x,y-.05,z,w+.15,.1,d+.15);for(const sign of [-1,1]){k.wall(x+sign*w/2,y,z,d,h+(sign>0?.25:0),.42,'z','stone',.7,.3);k.wall(x+sign*(w+1.3)/4,y,z+d/2,(w-1.3)/2,h*.6,.42,'x','stone',.7,.3);}k.wall(x,y,z-d/2,w,h+.45,.42,'x','stone',.7,.3);for(let j=0;j<3;j++)k.box('stone',x-w*.3+j*.5,y+.13,z+d*.65,.43,.26,.4,j*.22);block(x,y,z,w+1,h+1,d+1);}
 function tree(x,z,scale=1){const y=height(x,z);k.beam('trunk',[x,y,z],[x+.12,y+3*scale,z],.16*scale);for(let i=0;i<8;i++){const a=i*2.4,e=[x+Math.cos(a)*1.6*scale,y+(2.8+i%3*.3)*scale,z+Math.sin(a)*1.6*scale];k.beam('trunk',[x,y+1.7*scale,z],e,.05*scale);for(let j=0;j<45;j++)k.part('leaf','leaf',e[0]+(k.rand()-.5)*2*scale,e[1]+(k.rand()-.5)*.8*scale,e[2]+(k.rand()-.5)*2*scale,.15*scale,1,1,k.rand(),k.rand()*6.28,k.rand());}block(x,y,z,.7,3.3*scale,.7);}
 function stores(x,z,work=false){const y=height(x,z);for(let i=0;i<3;i++)k.jar(x+i*.55,y,z,.32+i*.05);k.box('linen',x+.5,y+.14,z+1,.7,.28,.6);if(work){for(let i=0;i<5;i++)k.box('stone',x+2+(i%2)*.7,y+.17+Math.floor(i/2)*.3,z,.6,.3,.5);for(let i=0;i<4;i++)k.beam('wood',[x-1,y+.15+i*.13,z-1],[x+2,y+.15+i*.13,z-1],.065);}block(x+.6,y,z,work?5:2.5,1.5,3);}
 function shade(x,z){const y=height(x,z);for(const dx of [-2.5,2.5])for(const dz of [-1.5,1.5]){k.cyl('wood',x+dx,y+1.1,z+dz,.055,2.2);block(x+dx,y,z+dz,.18,2.3,.18);}for(let i=0;i<16;i++)k.box('reed',x,y+2.2,z-1.5+i*.2,5.3,.05,.14);}
 path([[17,43],[17,25],[9,17],[7,2],[4,-28]],2.5);path([[-31,15],[-17,13],[-5,10],[15,10],[42,2]],1.8);
 const wallState=s.id==='wall'?(moment.id==='sections'?'work':'damaged'):s.id==='gate'?(moment.id==='watch'?'half':moment.id==='gates'?'gates':'complete'):'gates';
 marker('nehemiah-wall-state-'+wallState);marker('nehemiah-chapter-'+s.id);if(moment)marker('nehemiah-moment-'+moment.id);
 const gateZ=-32,full=5.4,wallHeight=wallState==='half'?2.7:wallState==='damaged'?2.2:wallState==='work'?3.5:full;
 for(const [left,right] of [[-67,-2.1],[10.1,77]])for(let a=left,i=0;a<right;a+=12,i++){const b=Math.min(right,a+12),x=(a+b)/2,h=wallState==='damaged'?1.1+(i%3)*.7:wallState==='work'?2.4+(i%3)*.6:wallHeight;wall(x,gateZ,(b-a)*(wallState==='damaged'?.72:1)+.01,h,1.35);}
 const gy=height(4,gateZ);for(const x of [-1,9]){k.wall(x,gy,gateZ,2.2,wallState==='damaged'?3.1:full+.5,2.8,'x','stone',.9,.34);block(x,gy,gateZ,2.4,full+.7,3);}
 if(wallState==='damaged'){for(const x of [1,2.2,6.7]){k.box('wood',x,gy+.15,gateZ+.7,1.8,.22,.32,.2);k.box('black',x,gy+.18,gateZ+.85,.9,.02,.15);}marker('nehemiah-damaged-gate-materials');}
 else{k.box('wood',4,gy+4.5,gateZ,8.2,.3,1.8);if(wallState==='gates'){const gate=marker('nehemiah-installed-door-leaves');for(const x of [.65,7.35]){const mesh=new THREE.Mesh(new THREE.BoxGeometry(.18,3.7,3.3),material({color:'#816744',roughness:.9}));mesh.position.set(x,gy+1.85,gateZ+1.1);mesh.castShadow=true;gate.add(mesh);block(x,gy,gateZ+1.1,.3,3.8,3.5);for(let i=0;i<7;i++)k.box('wood',x,gy+1.85,gateZ-.5+i*.48,.23,3.7,.025);}}else marker('nehemiah-door-leaves-not-shown');}
 if(wallState==='damaged'||wallState==='work'||wallState==='half'){const rubble=marker('nehemiah-rubble-work-context');for(let i=0;i<35;i++){const x=-42+k.rand()*18,z=-22-k.rand()*4,y=height(x,z),mesh=new THREE.Mesh(new THREE.DodecahedronGeometry(.18+k.rand()*.25,0),material({color:i%2?'#a8a28a':'#908875',roughness:1}));mesh.position.set(x,y+.13,z);mesh.scale.y=.65;mesh.rotation.set(k.rand(),k.rand(),k.rand());mesh.castShadow=true;rubble.add(mesh);}block(-33,height(-33,-24),-24,20,1.2,7);}
 for(const [x,z,w,d,h] of [[-29,34,8,7,3.2],[41,28,9,7,3.4],[-35,-51,9,8,3.5],[-13,-58,8,7,3.4],[15,-57,9,8,3.6],[38,-52,9,7,3.2],[-47,-73,10,8,3.5],[2,-78,8,7,3.1],[31,-79,11,8,3.6]]){if(z<-45&&s.id!=='wall')unfinishedHouse(x,z,w,d,.8+k.rand()*.8);else house(x,z,w,d,h);}
 for(let row=0;row<3;row++)for(let col=0;col<4;col++){const x=-35+col*25+(row%2)*6,z=-106-row*20,w=6+k.rand()*3,d=6+k.rand()*2;if((row+col)%3||s.id!=='wall')unfinishedHouse(x,z,w,d,.7+k.rand());else house(x,z,w,d,3+k.rand()*.8);}marker('nehemiah-unfinished-dwellings-and-open-ground');
 for(const [x,z,scale] of [[-24,27,1.1],[34,-8,1],[-27,-10,.9],[15,39,1],[41,-15,1],[-44,4,1.15]])tree(x,z,scale);
 shade(35,9);shade(-26,12);stores(34,16,!night&&s.id!=='scroll');stores(-27,21,!night&&s.id!=='scroll');
 if(s.id==='scroll'){
  const platform=marker('nehemiah-original-reading-platform'),x=-28,z=-6,y=height(x,z),deck=new THREE.Mesh(new THREE.BoxGeometry(9,.18,6),material({color:'#9c8058',roughness:.95}));deck.position.set(x,y+1.1,z);deck.castShadow=deck.receiveShadow=true;platform.add(deck);
  for(const dx of [-3.7,0,3.7])for(const dz of [-2.4,2.4])k.box('wood',x+dx,y+.52,z+dz,.22,1.04,.22);for(const dx of [-3.7,3.7])k.beam('wood',[x+dx,y+.2,z-2.3],[x+dx,y+1,z+2.3],.07);
  block(x,y,z,9.4,1.35,6.4);marker('nehemiah-reading-and-explanation-context');
 }else if(s.id==='wall'&&moment.id==='sections'||s.id==='gate'&&moment.id==='watch'){stores(-26,-8,true);marker('nehemiah-separate-work-section-context');}
 const ty=floor(-5,7);k.box('wood',-5,ty+.76,7,1.8,.1,1.25);for(const x of [-5.72,-4.28])for(const z of [6.55,7.45])k.box('wood',x,ty+.36,z,.075,.72,.075);block(-5,ty,7,1.8,.83,1.25);
 const count=night?3:s.id==='wall'&&moment.id==='proposal'?8:s.id==='scroll'?14:s.id==='gate'&&moment.id!=='watch'?8:12;
 for(let i=0;i<count;i++){const x=i<6?-13+(i%3)*6:10+(i%3)*6,z=i%2?21:-2;k.person(x,floor(x,z),z,i,0,!night&&i%6===0?1.12:1.7,{role:'nehemiah-resident'});}
 return {height,night,phase:moment?.id||null,dispose(){for(const m of owned)m.dispose();owned.clear();}};
}
export function attachNehemiahExploration(scene,k,segment,{phase=null,blenderAssets=false,onReady=()=>{},assetLoader}={}){
 const s=nehemiahSegmentById.get(segment)||nehemiahSegmentById.get('wall'),floor=(x,z)=>nehemiahFloor(s.id,x,z),walkModel=createWalkModel([...k.collisionBoxes],s.surfaces,floor,{proxies:[],navigationStep:.55}),moment=nehemiahMoment(s.id,phase),seedPart=['survey','proposal','sections','watch','unfinished-gates','wall-complete','gates'].indexOf(moment?.id);
 const npcSystem=createNPCSystem({actors:k.actors,model:walkModel,pois:nehemiahPOIs(s.id,phase),seed:17026+s.number*1103+Math.max(0,seedPart)*71,spawnCandidates:nehemiahSpawnCandidates(s.id),spawnExclusion:s.spawn,allowRetreat:true});
 const objects=nehemiahObjects.filter(o=>o.segment===s.id).map(d=>{const root=createVessel(d.id,{blenderAssets,onReady,assetLoader});root.position.fromArray(d.position);scene.add(root);return {...d,root};});return {walkModel,npcSystem,objects};
}
