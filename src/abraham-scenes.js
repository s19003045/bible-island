import * as THREE from 'three';
import {createWalkModel} from './walk-model.js';
import {createNPCSystem} from './npc-system.js';
import {createVessel} from './vessels.js';
import {abrahamFloor,abrahamObjects,abrahamSegmentById,abrahamPOIs,abrahamSpawnCandidates} from './abraham-exploration.js';
export function buildAbrahamScene(k,scene,segment,{blenderAssets=false,onReady=()=>{},assetLoader}={}){
 const s=abrahamSegmentById.get(segment)||abrahamSegmentById.get('altar'),floor=(x,z)=>abrahamFloor(s.id,x,z);
 const height=(x,z)=>floor(x,z)+THREE.MathUtils.smoothstep(Math.max(Math.abs(x)-34,Math.abs(z)-39),0,95)*(8+19*Math.sin(x*.019+z*.011)**2+4*Math.cos(z*.036));
 const g=new THREE.PlaneGeometry(1500,1500,220,220);g.rotateX(-Math.PI/2);const a=g.attributes.position,c=[];
 for(let i=0;i<a.count;i++){const x=a.getX(i),z=a.getZ(i);a.setY(i,height(x,z)-.06);const col=new THREE.Color(s.id==='well'?'#a19774':s.id==='tent'?'#939070':'#98907b');col.offsetHSL(0,0,Math.sin(x*.11)*Math.cos(z*.08)*.04);c.push(col.r,col.g,col.b);}
 g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));g.computeVertexNormals();const terrain=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));terrain.name='abraham-hill-country-'+s.id;terrain.receiveShadow=true;scene.add(terrain);
 const near=new THREE.PlaneGeometry(46,52,92,104);near.rotateX(-Math.PI/2);const n=near.attributes.position,nearColors=[];for(let i=0;i<n.count;i++){const x=n.getX(i)+5,z=n.getZ(i)+5;n.setXYZ(i,x,floor(x,z)-.009,z);const col=new THREE.Color(s.id==='well'?'#a19774':s.id==='tent'?'#939070':'#98907b');col.offsetHSL(0,0,Math.sin(x*.11)*Math.cos(z*.08)*.04);nearColors.push(col.r,col.g,col.b);}near.setAttribute('color',new THREE.Float32BufferAttribute(nearColors,3));near.computeVertexNormals();const m=new THREE.Mesh(near,terrain.material);m.name='abraham-camp-ground';m.receiveShadow=true;scene.add(m);
 function wornPath(points,width){const curve=new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,0,z))),v=[],faces=[];for(let i=0;i<=100;i++){const t=i/100,p=curve.getPoint(t),d=curve.getTangent(t);for(const side of [-1,1]){const w=width*(.48+.035*Math.sin(i*.4)),x=p.x+d.z*w*side,z=p.z-d.x*w*side;v.push(x,height(x,z)+.014,z);}if(i){const q=(i-1)*2;faces.push(q,q+2,q+3,q,q+3,q+1);}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(faces);g.computeVertexNormals();const p=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:'#a99678',roughness:1}));p.receiveShadow=true;p.name='abraham-worn-camp-path';scene.add(p);}
 wornPath([[18,38],[12,23],[8,10],[4,-4],[8,-24],[14,-40]],2.2);wornPath([[-33,21],[-19,13],[-5,10],[7,10],[24,8],[38,2]],1.8);wornPath([[-28,-11],[-15,-4],[-5,3],[1,10]],1.3);
 // Sparse vegetation and small stones sit below step height; large outcrops
 // remain outside the walking region. Counts and species are teaching choices.
 for(let i=0;i<320;i++){const x=-72+k.rand()*144,z=-65+k.rand()*135;if(x>-18&&x<28&&z>-20&&z<30)continue;const y=height(x,z);for(let j=0;j<4;j++)k.part('leaf',i%4?'reed':'leaf',x+(k.rand()-.5)*.6,y+.15+k.rand()*.18,z+(k.rand()-.5)*.6,.1+k.rand()*.12,1,1,k.rand()*1.3,k.rand()*Math.PI*2,k.rand());}
 for(const [x,z] of [[-22,30],[33,28],[-33,1],[33,-23],[-4,-26],[30,37]])for(let i=0;i<5;i++){const px=x+(k.rand()-.5)*3,pz=z+(k.rand()-.5)*2;k.ball('darkstone',px,height(px,pz)-.15,pz,.7+k.rand(),.5+k.rand()*.6,.7+k.rand());}
 // Ridge tents are a chosen woven shelter type, not a dated surviving design.
 for(const [x,z,scale] of [[-27,-9,1.1],[32,-4,1.15],[-24,-27,.95],[28,-27,.9],[40,23,1],[-34,27,.9],[7,-32,1.15],[-48,3,.8],[51,-20,.9]]){const y=height(x,z);k.tent(x,y,z,scale);k.collisionBoxes.push({min:[x-3.8*scale,y-.1,z-1.9*scale],max:[x+3.8*scale,y+2.4*scale,z+1.9*scale]});}
 if(s.id==='tent'){const x=9,z=-9,y=floor(x,z),scale=1.5;k.tent(x,y,z,scale);k.collisionBoxes.push({min:[x-3.8*scale,y-.1,z-1.9*scale],max:[x+3.8*scale,y+2.4*scale,z+1.9*scale]});}
 function shadeTree(x,z,scale=1){const y=height(x,z);k.beam('trunk',[x,y,z],[x+.25,y+3.5*scale,z],.23*scale);for(let j=0;j<11;j++){const t=j*2.399,dx=Math.cos(t)*(1.4+(j%3)*.35)*scale,dz=Math.sin(t)*(1.4+(j%3)*.35)*scale,end=[x+dx,y+(3.5+(j%3)*.4)*scale,z+dz];k.beam('trunk',[x+.2,y+(1.7+j*.09)*scale,z],end,.065*scale);for(let q=0;q<100;q++)k.part('leaf','leaf',end[0]+(k.rand()-.5)*2.5*scale,end[1]+(k.rand()-.5)*.9*scale,end[2]+(k.rand()-.5)*2.5*scale,(.13+k.rand()*.11)*scale,1,1,k.rand(),k.rand()*Math.PI*2,k.rand());}k.collisionBoxes.push({min:[x-.35,y,z-.35],max:[x+.6,y+3,z+.35]});}
 for(const [x,z,scale] of [[-12,1,1.5],[-23,15,1.2],[33,14,1],[-9,-30,1.1],[41,-35,1],[-41,-20,1.2],[20,38,1.1],[-23,40,.8],[-57,29,1],[57,12,.9]])shadeTree(x,z,scale);
 // A low dry-stone boundary, baskets, fire site and supplies enrich the camp edge.
 for(const x of [-20,30])k.wall(x,height(x,13),13,13,.56,.55,'z','darkstone',.8,.28);
 for(const [x,z] of [[-26,-5],[31,-1],[-23,-24],[28,-24],[7,-28],[33,21]]){const y=height(x,z);k.jar(x,y,z,.5);k.jar(x+.75,y,z+.2,.37);k.box('hide',x+1.5,y+.17,z,.7,.33,.5);}
 for(let j=0;j<70;j++){const x=(j%2?-1:1)*(35+k.rand()*55),z=-65+k.rand()*135;k.ball('darkstone',x,height(x,z)-.1,z,.35+k.rand()*.9,.25+k.rand()*.4,.45+k.rand()*.6);}
 const object=abrahamObjects.find(o=>o.segment===s.id);
 if(s.id==='tent'){const [x,y,z]=object.position;k.box('wood',x,y-.06,z,1.5,.12,1.15);for(const dx of [-.58,.58])k.box('wood',x+dx,y-.4,z,.08,.68,.85);}
 // Exactly seven separately positioned ewes: a witness group, not sacrifice.
 const animals=[];
 if(s.id==='well')for(let i=0;i<7;i++){const x=-11+(i%3)*1.45,z=-7+Math.floor(i/3)*1.75,root=createVessel('abraham-ewe',{blenderAssets,onReady,assetLoader});root.name='well-witness-ewe-'+(i+1);root.position.set(x,floor(x,z),z);root.rotation.y=.4+i*.87;root.scale.setScalar(.88+(i%4)*.035);scene.add(root);const animal={root,phase:(i*1.618)%6.28};animals.push(animal);k.collisionBoxes.push({min:[x-.57,floor(x,z),z-.65],max:[x+.57,floor(x,z)+.85,z+.65]});}
 const marker=new THREE.Group();marker.name='abraham-chapter-'+s.id;marker.userData.witnessCount=animals.length;scene.add(marker);
 for(let i=0;i<12;i++){const x=i<6?-14+(i%3)*6:10+(i%3)*6,z=i%2?21:-2;k.person(x,floor(x,z),z,i,0,i%6===0?1.12:1.7,{role:'abraham-resident'});}
 return {height,animals};
}
export function animateAbrahamAnimals(animals,dt){for(const a of animals){a.phase+=dt*(.5+a.root.scale.x*.3);const head=a.root.getObjectByName('ewe-head'),tail=a.root.getObjectByName('ewe-tail');if(head){head.rotation.x=Math.sin(a.phase)*.07;head.rotation.y=Math.sin(a.phase*.57)*.1;}if(tail)tail.rotation.x=Math.sin(a.phase*1.7)*.15;}}
export function attachAbrahamExploration(scene,k,segment,{blenderAssets=false,onReady=()=>{},assetLoader}={}){
 const s=abrahamSegmentById.get(segment)||abrahamSegmentById.get('altar'),floor=(x,z)=>abrahamFloor(s.id,x,z),data=abrahamObjects.filter(o=>o.segment===s.id),boxes=[...k.collisionBoxes];
 for(const d of data){const [x,y,z]=d.position;boxes.push({min:[x-.8,floor(x,z),z-.65],max:[x+.8,y+1,z+.65]});}
 const walkModel=createWalkModel(boxes,s.surfaces,floor,{proxies:[],navigationStep:.55});const npcSystem=createNPCSystem({actors:k.actors,model:walkModel,pois:abrahamPOIs(s.id),seed:12026+s.number*431,spawnCandidates:abrahamSpawnCandidates(s.id),spawnExclusion:s.spawn,allowRetreat:true});
 const objects=data.map(d=>{const root=createVessel(d.id,{blenderAssets,onReady,assetLoader});root.position.fromArray(d.position);scene.add(root);return {...d,root};});return {walkModel,npcSystem,objects};
}
