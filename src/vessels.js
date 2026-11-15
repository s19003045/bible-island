import * as THREE from 'three';
export function createVessel(id) {
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
function createSolomonObject(id) {
  const group=new THREE.Group(),bronze=new THREE.MeshStandardMaterial({color:'#89724f',metalness:.7,roughness:.43}),stone=new THREE.MeshStandardMaterial({color:'#bcb097',roughness:.96}),cedar=new THREE.MeshStandardMaterial({color:'#725039',roughness:.88});
  const add=(geometry,material,x,y,z)=>{const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);group.add(m);return m;};
  const box=(w,h,d,x,y,z,mat)=>add(new THREE.BoxGeometry(w,h,d),mat,x,y,z);
  const sphere=new THREE.SphereGeometry(1,12,8);
  if(id==='pillar-capital') {
    add(new THREE.CylinderGeometry(.14,.15,.2,32),bronze,0,.1,0);
    add(new THREE.LatheGeometry([[.13,.18],[.23,.26],[.3,.39],[.24,.5],[.17,.58],[.31,.76]].map(p=>new THREE.Vector2(...p)),48),bronze,0,0,0);
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
    for(let n=0;n<5;n++)box(.15,.6,.035,-.3+n*.155,.3,-.17,cedar);
    for(const y of [.07,.52])box(.84,.045,.045,0,y,-.21,cedar);
  }
  group.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.userData.objectId=id;}});group.userData.objectId=id;return group;
}
function createCraftObject(id) {
  const group=new THREE.Group(),wood=new THREE.MeshStandardMaterial({color:'#69503b',roughness:.92}),silver=new THREE.MeshStandardMaterial({color:'#aba89d',metalness:.65,roughness:.4});
  const box=(w,h,d,x,y,z,mat)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);group.add(m);};
  if(id==='woven-sample') {
    box(.94,.045,.045,0,.035,0,wood);box(.94,.045,.045,0,.69,0,wood);
    for(const x of [-.45,.45])box(.045,.7,.045,x,.35,0,wood);
    const colors=['#c9c1a7','#3f5160','#534456','#76392d'];
    colors.forEach((color,i)=>{const mat=new THREE.MeshStandardMaterial({color,roughness:1,side:THREE.DoubleSide});box(.215,.57,.012,-.325+i*.215,.35,0,mat);});
    const thread=new THREE.MeshStandardMaterial({color:'#c6b79c',roughness:1});
    for(let i=0;i<34;i++)box(.004,.57,.005,-.418+i*.025,.35,.009,thread);
    for(let i=0;i<22;i++)box(.855,.004,.004,0,.08+i*.025,.013,thread);
  } else if(id==='board-joint') {
    box(.65,.14,.34,0,.07,0,silver);box(.43,.61,.075,0,.49,0,wood);
    for(const x of [-.13,.13])box(.08,.2,.075,x,.18,0,wood);
    box(.6,.055,.06,0,.58,.08,wood);
  } else {
    const bronze=new THREE.MeshStandardMaterial({color:'#92734c',metalness:.65,roughness:.4});
    const bowl=new THREE.Mesh(new THREE.LatheGeometry([[.04,0],[.16,.06],[.18,.16],[.1,.24],[.08,.33],[.32,.38],[.46,.6],[.48,.74],[.44,.74],[.42,.61],[.29,.42],[.04,.4]].map(p=>new THREE.Vector2(...p)),48),bronze);group.add(bowl);
  }
  group.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.userData.objectId=id;}});return group;
}
export function mountVesselViewer(container,id) {
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(container.clientWidth||300,220);renderer.setClearColor('#e8e6d9',1);renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,(container.clientWidth||300)/220,.01,10);camera.position.set(1.15,.9,1.35);camera.lookAt(0,.35,0);
  scene.add(new THREE.HemisphereLight('#fff9e7','#665340',2.5));const light=new THREE.DirectionalLight('#ffffff',3);light.position.set(2,3,2);scene.add(light);
  const vessel=createVessel(id);scene.add(vessel);container.appendChild(renderer.domElement);const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','可旋轉的器物近景；拖曳或按左右方向鍵觀察');let drag=null;
  function render(){renderer.render(scene,camera);}function down(e){drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);canvas.focus();}function move(e){if(drag?.id!==e.pointerId)return;vessel.rotation.y+=(e.clientX-drag.x)*.012;vessel.rotation.x=THREE.MathUtils.clamp(vessel.rotation.x+(e.clientY-drag.y)*.006,-.45,.45);drag.x=e.clientX;drag.y=e.clientY;render();}const up=()=>drag=null;
  function key(e){if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();vessel.rotation.y+=(e.key==='ArrowLeft'?1:-1)*.18;render();}}
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('keydown',key);
  const observer=new ResizeObserver(()=>{const width=container.clientWidth;if(!width)return;renderer.setSize(width,220);camera.aspect=width/220;camera.updateProjectionMatrix();render();});observer.observe(container);render();
  return {rotate(amount){vessel.rotation.y+=amount;render();},dispose(){observer.disconnect();scene.traverse(o=>{o.geometry?.dispose();if(o.material)o.material.dispose();});renderer.dispose();canvas.remove();}};
}
