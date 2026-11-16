import {createSamariaObject} from './samaria-objects.js';
import {createGalileeObject} from './galilee-objects.js';
import {createNativityObject} from './nativity-objects.js';
import {createIntertestamentObject} from './intertestament-objects.js';
import {createNehemiahObject} from './nehemiah-objects.js';
import {createExileObject} from './exile-objects.js';
import {createKingdomsObject} from './kingdoms-objects.js';
import {createDavidObject} from './david-objects.js';
import {setDavidArtifactPhase} from './artifact-phases.js';
import {createRuthObject} from './ruth-objects.js';
import {createSinaiObject} from './sinai-objects.js';
import {createJosephObject} from './joseph-objects.js';
import {createAbrahamObject} from './abraham-objects.js';
import {createPaulObject} from './paul-objects.js';
import * as THREE from 'three';
import {attachBlenderObject} from './blender-assets.js';
import {blenderModels} from './blender-manifest.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {artifactFraming,setArtifactSeparation,setArtifactReadingLayer} from './artifact-inspection.js';
import {createInspectionRuntime} from './inspection-runtime.js';

const inspectionRuntime=createInspectionRuntime(generation=>{
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor('#e8e6d9',1);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.domElement.dataset.rendererGeneration=String(generation);
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),environment=pmrem.fromScene(room,.04);room.dispose();pmrem.dispose();
  return {renderer,environment,dispose(){environment.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();}};
});
export function disposeVesselViewerResources(){inspectionRuntime.dispose();}
export function createVessel(id,{blenderAssets=false,onReady=()=>{},assetLoader,phase='cart'}={}) {
  const root=createProceduralVessel(id);
  root.userData.objectId=id;root.name=`observation:${id}`;
  const applyPhase=()=>{if(id==='david-ark')setDavidArtifactPhase(root,phase);};applyPhase();
  if(blenderAssets&&blenderModels[id]?.type==='object') {
    const detail=attachBlenderObject(root,id,()=>{applyPhase();onReady();},assetLoader);root.userData.releaseBlender=()=>detail.dispose();root.userData.assetReady=detail.ready;
  }
  return root;
}
function createProceduralVessel(id) {
  if(['samaria-jar','samaria-road','samaria-care'].includes(id))return createSamariaObject(id);
  if(['galilee-hull','galilee-stones','galilee-roof'].includes(id))return createGalileeObject(id);
  if(['nativity-manger','nativity-home','nativity-joinery'].includes(id))return createNativityObject(id);
  if(['intertestament-road','intertestament-coin','intertestament-languages'].includes(id))return createIntertestamentObject(id);
  if(['nehemiah-wall','nehemiah-watch','nehemiah-reading'].includes(id))return createNehemiahObject(id);
  if(['exile-sequence','exile-waterbank','exile-dwelling'].includes(id))return createExileObject(id);
  if(['kingdom-assembly','kingdom-sites','kingdom-measures'].includes(id))return createKingdomsObject(id);
  if(['david-shepherd','david-city','david-ark'].includes(id))return createDavidObject(id);
  if(['ruth-gleaning','ruth-grain','ruth-witness'].includes(id))return createRuthObject(id);
  if(['sinai-manna','sinai-water','sinai-boundary'].includes(id))return createSinaiObject(id);
  if(['joseph-cargo','joseph-granary','joseph-provisions'].includes(id))return createJosephObject(id);
  if(['abraham-altar','abraham-hospitality','abraham-well','abraham-ewe'].includes(id))return createAbrahamObject(id);
  if(['paul-ship','paul-textiles','paul-silverwork'].includes(id))return createPaulObject(id);
  if(['return-masonry','return-scroll','return-vessels'].includes(id))return createReturnObject(id);
  if(['jordan-bed','jordan-carrying','jordan-stones'].includes(id))return createJordanObject(id);
  if(['brick-mould','passover-kit','crossing-ground'].includes(id))return createExodusObject(id);
  if(['herod-stone','herod-boundary','herod-capital'].includes(id))return createHerodObject(id);
  if(['pillar-capital','solomon-sea','temple-masonry'].includes(id))return createSolomonObject(id);
  if(['woven-sample','board-joint','tabernacle-basin'].includes(id))return createCraftObject(id);
  const clay=id==='clay-vessel',group=new THREE.Group();
  const profile=clay?[[0,0],[.09,0],[.16,.06],[.23,.19],[.22,.31],[.15,.4],[.085,.44],[.08,.51],[.10,.52],[.105,.55],[.075,.55],[.065,.5],[.075,.44],[.14,.39],[.20,.3],[.21,.19],[.14,.08],[.07,.035],[0,.035]]:[[0,0],[.11,0],[.145,.045],[.15,.27],[.165,.3],[.165,.325],[.14,.325],[.13,.28],[.12,.055],[0,.055]];
  const material=new THREE.MeshStandardMaterial({color:clay?'#a56d4c':'#d4cbb3',roughness:clay?.88:.96});
  const body=new THREE.Mesh(new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),48),material);group.add(body);
  if(clay)for(const side of [-1,1]){const handle=new THREE.Mesh(new THREE.TorusGeometry(.105,.021,8,32),material);handle.position.set(side*.12,.39,0);group.add(handle);}
  // Fine horizontal tooling marks, shared with the inspectable object rather than a second representation.
  for(let i=0;i<6;i++){const radius=clay?.218-Math.abs(i-2)*.004:.15;const mark=new THREE.Mesh(new THREE.TorusGeometry(radius,.0013,3,40),new THREE.MeshStandardMaterial({color:clay?'#805237':'#b2aa94',roughness:1}));mark.rotation.x=Math.PI/2;mark.position.y=clay?.16+i*.023:.08+i*.035;group.add(mark);}
  group.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.userData.objectId=id;}});group.userData.objectId=id;return group;
}
function createReturnObject(id){
 const root=new THREE.Group(),stone=new THREE.MeshStandardMaterial({color:'#a1967e',roughness:1}),wood=new THREE.MeshStandardMaterial({color:'#765234',roughness:.97}),paper=new THREE.MeshStandardMaterial({color:'#c0a878',roughness:1});
 const box=(parent,x,y,z,w,h,d,mat)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);parent.add(m);};
 if(id==='return-masonry'){
  for(let r=0;r<3;r++)for(let c=0;c<3;c++)box(root,(c-1)*.45+(r%2?.06:0),.075+r*.15,0,.438,.144,.42,stone);
  const layer=new THREE.Group();layer.name='return-timber-layer';root.add(layer);for(const z of [-.13,.13])box(layer,.03,.48,z,1.47,.066,.11,wood);
 }else if(id==='return-scroll'){
  box(root,0,.026,0,1.08,.004,.46,paper);
  const roll=new THREE.Mesh(new THREE.CylinderGeometry(.059,.059,.54,32),paper);roll.rotation.x=Math.PI/2;roll.position.set(.06,.064,.67);root.add(roll);
 }else for(const [x,scale,color] of [[-.30,1,'#b98a33'],[.31,.84,'#aaa79d']]){
  const p=[[0,0],[.12,0],[.17,.06],[.24,.25],[.24,.28],[.215,.28],[.20,.16],[.15,.075],[0,.038]];const bowl=new THREE.Mesh(new THREE.LatheGeometry(p.map(([r,y])=>new THREE.Vector2(r*scale,y*scale)),48),new THREE.MeshStandardMaterial({color,metalness:.85,roughness:.35}));bowl.position.x=x;root.add(bowl);
 }
 root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.userData.objectId=id;}});return root;
}
function createJordanObject(id){
 const g=new THREE.Group(),stone=new THREE.MeshStandardMaterial({color:'#97917b',roughness:1}),blue=new THREE.MeshStandardMaterial({color:'#31566b',roughness:.98}),wood=new THREE.MeshStandardMaterial({color:'#735039',roughness:.96});
 const add=(geometry,material,x,y,z)=>{const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);g.add(m);return m;};
 if(id==='jordan-stones')for(let i=0;i<12;i++){const m=add(new THREE.IcosahedronGeometry(1,2),stone,(i%4-1.5)*.66,.20,(Math.floor(i/4)-1)*.58);m.scale.set(.26,.20+(i%4)*.025,.23);}
 if(id==='jordan-carrying'){
  add(new THREE.BoxGeometry(.363,.363,.587),blue,0,.1815,0);
  for(const x of [-.215,.215]){const pole=add(new THREE.CylinderGeometry(.012,.012,1.66,16),wood,x,.1325,0);pole.rotation.x=Math.PI/2;}
 }
 if(id==='jordan-bed'){
  const geo=new THREE.PlaneGeometry(1.54,.68,60,4);geo.rotateX(-Math.PI/2);const p=geo.attributes.position;
  for(let i=0;i<p.count;i++){const t=THREE.MathUtils.clamp((Math.abs(p.getX(i))-.21)/.35,0,1);p.setY(i,.065+.23*t*t*(3-2*t));}geo.computeVertexNormals();add(geo,stone,0,0,0);
 }
 g.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;o.userData.objectId=id;}});return g;
}
function createExodusObject(id){
 const g=new THREE.Group(),wood=new THREE.MeshStandardMaterial({color:'#756047',roughness:.96}),mud=new THREE.MeshStandardMaterial({color:'#987d60',roughness:1}),straw=new THREE.MeshStandardMaterial({color:'#b2a17b',roughness:1});
 let part=g;
 const add=(geo,mat,x,y,z)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);part.add(m);return m;};
 const box=(w,h,d,x,y,z,mat)=>add(new THREE.BoxGeometry(w,h,d),mat,x,y,z);
 if(id==='brick-mould'){
  part=new THREE.Group();part.name='brick-frame';g.add(part);
  for(const z of [-.137,.137])box(.464,.12,.034,-.24,.06,z,wood);for(const x of [-.455,-.025])box(.034,.12,.24,x,.06,0,wood);
  box(.19,.048,.046,-.55,.06,.137,wood);part=g;
  box(.392,.094,.23,-.24,.047,0,mud);box(.38,.108,.23,.285,.054,0,mud);
  for(let i=0;i<24;i++){const reed=box(.002,.002,.04+(i%4)*.006,-.37+(i%6)*.045+(i>=12?.52:0),i>=12?.109:.095,-.07+Math.floor((i%12)/6)*.12,straw);reed.rotation.y=i*2.4;}
 }else if(id==='passover-kit'){
  const bread=new THREE.MeshStandardMaterial({color:'#bd9c6c',roughness:1}),cloth=new THREE.MeshStandardMaterial({color:'#9c9277',roughness:1}),rope=new THREE.MeshStandardMaterial({color:'#665946',roughness:1});
  for(let i=0;i<3;i++){const b=add(new THREE.CylinderGeometry(.17,.18,.025,40),bread,-.27+i*.025,.025+i*.027,-.06);b.rotation.z=(i-1)*.025;for(let n=0;n<12;n++)box(.008,.002,.008,-.38+(n%4)*.07,.039+i*.027,-.15+Math.floor(n/4)*.075,wood);}
  const bowl=add(new THREE.LatheGeometry([[0,.025],[.10,.025],[.15,.15],[.14,.17],[.12,.15],[.08,.05],[0,.05]].map(p=>new THREE.Vector2(...p)),32),wood,.31,0,-.04);
  part=new THREE.Group();part.name='kneading-wrap';g.add(part);
  const bundle=add(new THREE.SphereGeometry(1,24,16),cloth,.31,.15,-.04);bundle.scale.set(.2,.15,.17);
  const strap=add(new THREE.TorusGeometry(.155,.009,8,40),rope,.31,.15,-.04);strap.rotation.y=Math.PI/2;
  part=g;
  const staff=add(new THREE.CylinderGeometry(.012,.016,1.13,12),wood,0,.022,.25);staff.rotation.z=Math.PI/2;
 }else{
  box(1,.04,.7,0,.02,0,mud);const water=new THREE.MeshPhysicalMaterial({color:'#52777a',transparent:true,opacity:.72,roughness:.25,metalness:.15});
  for(const side of [-1,1]){box(1,.33,.23,0,.205,side*.235,water);for(let i=0;i<7;i++){const ripple=add(new THREE.SphereGeometry(1,16,8),water,-.43+i*.145,.36,side*.235);ripple.scale.set(.11,.025,.1);}}
  for(let i=0;i<3;i++){const x=-.3+i*.29,body=add(new THREE.CylinderGeometry(.011,.017,.061,10),wood,x,.075,(i%2-.5)*.055);add(new THREE.SphereGeometry(.009,10,8),wood,x,.118,(i%2-.5)*.055);for(const dx of [-.006,.006])box(.005,.025,.008,x+dx,.043,(i%2-.5)*.055,wood);}
 }
 g.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;o.userData.objectId=id;}});g.userData.objectId=id;return g;
}
function createHerodObject(id){
 const g=new THREE.Group(),stone=new THREE.MeshStandardMaterial({color:'#c5baa2',roughness:.94}),shade=new THREE.MeshStandardMaterial({color:'#a59b86',roughness:1});
 let part=g;
 const box=(w,h,d,x,y,z,mat=stone)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);part.add(m);return m;};
 if(id==='herod-stone'){
  for(let i=0;i<2;i++){
   part=new THREE.Group();part.name=i?'ashlar-right':'ashlar-left';g.add(part);
   const x=(i-.5)*.46;box(.45,.4,.38,x,.2,0,shade);box(.37,.32,.015,x,.2,.198);
   for(let j=0;j<16;j++){const line=box(.0015,.27,.001,x-.155+j*.021,.2,.207,shade);line.rotation.z=.07;}
  }
  part=g;
  box(.92,.035,.42,0,.018,0);
 }else if(id==='herod-boundary'){
  box(.94,.04,.64,0,.02,0);part=new THREE.Group();part.name='boundary-layer';g.add(part);
  for(let i=0;i<6;i++)box(.025,.23,.025,-.42+i*.168,.155,.22);
  for(const y of [.07,.25])box(.9,.025,.03,0,y,.22);
  part=g;
  for(const x of [-.31,.31])box(.29,.43,.07,x,.255,-.13);box(.21,.13,.07,0,.405,-.13);
  for(let i=0;i<3;i++)box(.15,.025,.06,0,.045+i*.025,.1-i*.06);
 }else{
  const add=(geo,x,y,z)=>{const m=new THREE.Mesh(geo,stone);m.position.set(x,y,z);g.add(m);return m;};
  add(new THREE.CylinderGeometry(.11,.125,.3,32),0,.15,0);
  add(new THREE.LatheGeometry([[.11,.3],[.14,.33],[.18,.43],[.22,.55]].map(p=>new THREE.Vector2(...p)),48),0,0,0);
  for(let i=0;i<12;i++){const a=i*Math.PI/6,leaf=add(new THREE.SphereGeometry(1,12,8),Math.cos(a)*.17,.43,Math.sin(a)*.17);leaf.scale.set(.035,.12,.055);leaf.rotation.y=-a;}
  box(.48,.07,.48,0,.58,0);box(.58,.06,.58,0,.65,0);
 }
 g.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;o.userData.objectId=id;}});g.userData.objectId=id;return g;
}
function createSolomonObject(id) {
  const group=new THREE.Group(),bronze=new THREE.MeshStandardMaterial({color:'#89724f',metalness:.7,roughness:.43}),stone=new THREE.MeshStandardMaterial({color:'#bcb097',roughness:.96}),cedar=new THREE.MeshStandardMaterial({color:'#725039',roughness:.88});
  const add=(geometry,material,x,y,z)=>{const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);group.add(m);return m;};
  const box=(w,h,d,x,y,z,mat)=>add(new THREE.BoxGeometry(w,h,d),mat,x,y,z);
  const sphere=new THREE.SphereGeometry(1,12,8);
  if(id==='pillar-capital') {
    add(new THREE.CylinderGeometry(.14,.15,.2,32),bronze,0,.1,0);
    add(new THREE.LatheGeometry([[.23,.18],[.23,.20],[.3,.31],[.3,.39],[.24,.5],[.17,.58],[.34,.80]].map(p=>new THREE.Vector2(...p)),48),bronze,0,0,0);
    for(const y of [.3,.4,.5]){const ring=add(new THREE.TorusGeometry(.265,.008,6,64),bronze,0,y,0);ring.rotation.x=Math.PI/2;}
    const fruit=new THREE.InstancedMesh(sphere,bronze,200),transform=new THREE.Object3D();group.add(fruit);
    for(let row=0;row<2;row++)for(let n=0;n<100;n++){
      const a=(n+row*.5)/100*Math.PI*2;transform.position.set(Math.cos(a)*.28,.32+row*.12,Math.sin(a)*.28);transform.scale.setScalar(.012);transform.updateMatrix();fruit.setMatrixAt(row*100+n,transform.matrix);
    }
    for(let n=0;n<20;n++){const a=n/20*Math.PI*2,net=box(.008,.25,.008,Math.cos(a)*.25,.41,Math.sin(a)*.25,bronze);net.rotation.z=.2*Math.sin(a);}
  } else if(id==='solomon-sea') {
    for(let side=0;side<4;side++)for(let n=-1;n<=1;n++) {
      const a=side*Math.PI/2,ox=new THREE.Group();ox.position.set(Math.cos(a)*.27+Math.sin(a)*n*.11,0,Math.sin(a)*.27-Math.cos(a)*n*.11);ox.rotation.y=-a;group.add(ox);
      const part=(x,y,z,sx,sy,sz)=>{const m=new THREE.Mesh(sphere,bronze);m.position.set(x,y,z);m.scale.set(sx,sy,sz);ox.add(m);};
      part(0,.135,0,.13,.06,.043);part(.12,.17,0,.045,.047,.031);part(.157,.15,0,.03,.022,.026);
      for(const x of [-.075,.075])for(const z of [-.03,.03]){const leg=new THREE.Mesh(new THREE.CylinderGeometry(.008,.006,.105,8),bronze);leg.position.set(x,.058,z);ox.add(leg);}
      for(const z of [-.034,.034]){const horn=new THREE.Mesh(new THREE.ConeGeometry(.007,.045,8),bronze);horn.position.set(.12,.215,z);horn.rotation.z=-.3;ox.add(horn);}
    }
    add(new THREE.LatheGeometry([[.14,.25],[.26,.3],[.38,.48],[.45,.7],[.425,.7],[.355,.49],[.24,.33],[.14,.29]].map(p=>new THREE.Vector2(...p)),64),bronze,0,0,0);
    const water=add(new THREE.CircleGeometry(.405,64),new THREE.MeshStandardMaterial({color:'#5e7b77',roughness:.25,transparent:true,opacity:.7,side:THREE.DoubleSide}),0,.66,0);water.rotation.x=-Math.PI/2;
  } else {
    for(let row=0;row<2;row++)for(let n=0;n<3;n++)box(.255,.2,.25,-.27+n*.27+(row?.06:0),.1+row*.205,0,stone);
    const facing=new THREE.Group();facing.name='cedar-facing';group.add(facing);
    for(let n=0;n<5;n++)facing.add(box(.15,.6,.035,-.3+n*.155,.3,.17,cedar));
    for(const y of [.07,.52])facing.add(box(.84,.045,.045,0,y,.21,cedar));
  }
  group.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.userData.objectId=id;}});group.userData.objectId=id;return group;
}
function createCraftObject(id) {
  const group=new THREE.Group(),wood=new THREE.MeshStandardMaterial({color:'#69503b',roughness:.92}),silver=new THREE.MeshStandardMaterial({color:'#aba89d',metalness:.65,roughness:.4});
  const box=(w,h,d,x,y,z,mat)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);group.add(m);return m;};
  if(id==='woven-sample') {
    box(.94,.045,.045,0,.035,0,wood);box(.94,.045,.045,0,.69,0,wood);
    for(const x of [-.45,.45])box(.045,.7,.045,x,.35,0,wood);
    const colors=['#c9c1a7','#3f5160','#534456','#76392d'];
    colors.forEach((color,i)=>{const mat=new THREE.MeshStandardMaterial({color,roughness:1,side:THREE.DoubleSide});box(.215,.57,.012,-.325+i*.215,.35,0,mat);});
    const thread=new THREE.MeshStandardMaterial({color:'#c6b79c',roughness:1});
    for(let i=0;i<34;i++)box(.004,.57,.005,-.418+i*.025,.35,.009,thread);
    for(let i=0;i<22;i++)box(.855,.004,.004,0,.08+i*.025,.013,thread);
  } else if(id==='board-joint') {
    const board=new THREE.Group();board.name='joint-board';group.add(board);
    board.add(box(.44,.61,.078,0,.535,0,wood));
    const gold=new THREE.MeshStandardMaterial({color:'#c39b48',metalness:.8,roughness:.36});
    board.add(box(.272,.61,.006,.081,.535,.043,gold));board.add(box(.59,.031,.03,0,.602,-.059,gold));
    for(const x of [-.13,.13]){
      board.add(box(.074,.11,.063,x,.175,0,wood));
      box(.237,.05,.25,x,.025,0,silver);
      for(const f of [-.079,.079])box(.237,.10,.092,x,.10,f,silver);
      for(const side of [-1,1])box(.079,.10,.066,x+side*.079,.10,0,silver);
    }
  } else {
    const bronze=new THREE.MeshStandardMaterial({color:'#92734c',metalness:.65,roughness:.4});
    const bowl=new THREE.Mesh(new THREE.LatheGeometry([[0,0],[.225,0],[.245,.025],[.24,.072],[.155,.102],[.117,.142],[.102,.3],[.104,.55],[.118,.64],[.155,.684],[.25,.738],[.35,.855],[.425,1.02],[.465,1.18],[.48,1.215],[.482,1.232],[.471,1.24],[.451,1.235],[.442,1.218],[.435,1.18],[.399,1.025],[.325,.866],[.23,.762],[.135,.712],[0,.712]].map(p=>new THREE.Vector2(...p)),64),bronze);group.add(bowl);
  }
  group.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.userData.objectId=id;}});return group;
}
export function mountVesselViewer(container,id,{phase='cart'}={}) {
  let object=null,scene=null,observer=null,canvas=null,disposed=false;
  const lease=inspectionRuntime.acquire(()=>cleanup());
  const {renderer,environment}=lease.resource;renderer.setSize(container.clientWidth||300,container.clientHeight||280);
  scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(35,(container.clientWidth||300)/(container.clientHeight||280),.01,10);
  scene.environment=environment.texture;scene.environmentIntensity=.65;
  scene.add(new THREE.HemisphereLight('#fff9e7','#665340',2.5));const light=new THREE.DirectionalLight('#ffffff',3);light.position.set(2,3,2);scene.add(light);
  const vessel=new THREE.Group(),articulation=blenderModels[id]?.articulation,readingLayer=blenderModels[id]?.readingLayer;let exploded=false,extensionVisible=true;
  object=createVessel(id,{blenderAssets:true,phase,onReady:()=>{separate();fit();render();}});vessel.add(object);scene.add(vessel);container.appendChild(renderer.domElement);canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','可旋轉的器物近景；拖曳或按上下左右方向鍵觀察');let drag=null;
  function separate(){if(articulation)setArtifactSeparation(object,articulation.part,exploded?articulation.offset:[0,0,0]);if(readingLayer)setArtifactReadingLayer(object,readingLayer.part,extensionVisible);}
  function fit(){
    const rotation=vessel.rotation.clone();vessel.rotation.set(0,0,0);object.position.set(0,0,0);scene.updateMatrixWorld(true);
    const bounds=new THREE.Box3();object.traverseVisible(o=>{if(o.isMesh){o.geometry.computeBoundingBox();bounds.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));}});
    const framing=artifactFraming(bounds,camera.aspect,camera.fov);
    object.position.copy(framing.center).negate();vessel.rotation.copy(rotation);
    camera.position.fromArray(blenderModels[id]?.inspectionView||[1.15,.9,1.35]).normalize().multiplyScalar(framing.distance);camera.far=Math.max(10,framing.distance+framing.radius*3);camera.lookAt(0,0,0);camera.updateProjectionMatrix();
  }
  function render(){if(!disposed)renderer.render(scene,camera);}function down(e){drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);canvas.focus();}function move(e){if(drag?.id!==e.pointerId)return;vessel.rotation.y+=(e.clientX-drag.x)*.012;vessel.rotation.x=THREE.MathUtils.clamp(vessel.rotation.x+(e.clientY-drag.y)*.006,-1.2,1.2);drag.x=e.clientX;drag.y=e.clientY;render();}function up(){drag=null;}
  function key(e){if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft'||e.key==='ArrowRight')vessel.rotation.y+=(e.key==='ArrowLeft'?1:-1)*.18;else vessel.rotation.x=THREE.MathUtils.clamp(vessel.rotation.x+(e.key==='ArrowUp'?1:-1)*.15,-1.2,1.2);render();}}
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('keydown',key);
  observer=new ResizeObserver(()=>{const width=container.clientWidth,height=container.clientHeight||280;if(disposed||!width)return;renderer.setSize(width,height);camera.aspect=width/height;fit();render();});observer.observe(container);fit();render();
  function cleanup(){if(disposed)return;disposed=true;object?.userData.releaseBlender?.();observer?.disconnect();canvas?.removeEventListener('pointerdown',down);canvas?.removeEventListener('pointermove',move);canvas?.removeEventListener('pointerup',up);canvas?.removeEventListener('pointercancel',up);canvas?.removeEventListener('keydown',key);scene?.traverse(o=>{if(o.userData.blenderShared)return;o.geometry?.dispose();if(o.material)o.material.dispose();});canvas?.remove();renderer.renderLists.dispose();}
  return {rotate(amount){vessel.rotation.y+=amount;render();},setExploded(value){exploded=!!value;separate();fit();render();},setReadingLayer(value){extensionVisible=!!value;separate();fit();render();},dispose(){lease.release();}};
}
