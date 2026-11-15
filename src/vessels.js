import * as THREE from 'three';
export function createVessel(id) {
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
