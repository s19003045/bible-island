import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createResidentInstance,loadBlenderAsset} from './blender-assets.js';
import {blenderModels} from './blender-manifest.js';
import {createMotionCourse,motionScenarios} from './motion-course.js';
import {frameStepSeconds,frameSimulationSteps} from './frame-time.js';
import {motionRolesForActors} from './motion-preview-data.js';

const names={Idle:'駐足',Walk:'行走',StartWalk:'起步',StopWalk:'收步',TurnLeft:'向左轉身',TurnRight:'向右轉身',LookAround:'環顧',Interact:'互動',Talk:'交談'};
export function mountMotionPreview(container,{characters=[]}={}){
  const roles=motionRolesForActors(characters);
  if(!Object.keys(roles).length){container.textContent='此場景人物仍在載入，請稍後重新開啟比較。';return {dispose(){}};}
  container.innerHTML=`<div class="motion-preview-labels" role="group" aria-label="比較方式"><button data-motion-show="before">先前步態</button><button data-motion-show="after">真人參考步態</button><button data-motion-show="both">並排比較</button></div><div class="motion-preview-stage"><div class="motion-lane-labels" aria-hidden="true"><span>先前步態</span><span>真人參考步態</span></div></div><div class="motion-preview-tools"><label>觀察人物<select id="motion-role" aria-label="觀察人物">${Object.entries(roles).map(([id,r])=>`<option value="${id}">${r.label}</option>`).join('')}</select></label><label>測試路線<select id="motion-course" aria-label="測試路線">${Object.entries(motionScenarios).map(([id,label])=>`<option value="${id}">${label}</option>`).join('')}</select></label><button id="motion-play" aria-pressed="true">暫停</button><button id="motion-repeat">重新觀察</button><button id="motion-front">正面</button><button id="motion-side">側面</button><span id="motion-phase" role="status">正在載入人物…</span></div>`;
  const stage=container.querySelector('.motion-preview-stage'),renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;stage.append(renderer.domElement);
  renderer.domElement.setAttribute('aria-label','先前與真人參考步態在同一路徑上的動態比較，可拖曳旋轉視角');
  const scene=new THREE.Scene();scene.background=new THREE.Color('#d5dbd4');scene.fog=new THREE.Fog('#d5dbd4',16,35);
  scene.add(new THREE.HemisphereLight('#fff9e8','#737963',2));const sun=new THREE.DirectionalLight('#fff4d8',2.4);sun.position.set(-3,8,5);scene.add(sun);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(40,40),new THREE.MeshStandardMaterial({color:'#aea994',roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.003;scene.add(ground);
  const grid=new THREE.GridHelper(40,80,'#7a806f','#a0a18e');grid.position.y=.001;scene.add(grid);
  const camera=new THREE.PerspectiveCamera(38,1,.1,70),controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.9,0);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=2.6;controls.maxDistance=18;controls.maxPolarAngle=Math.PI*.48;
  const left=new THREE.Group(),right=new THREE.Group();scene.add(left,right);
  let instances=[],fixtures=[],course=null,actor=null,playing=true,disposed=false,ticket=0,raf=0,last=0,currentId=Object.keys(roles)[0],scenario='straight',comparison=window.innerWidth<640?'after':'both',sideView=false;
  const status=container.querySelector('#motion-phase'),play=container.querySelector('#motion-play');
  function view(side=sideView){sideView=side;const center=actor?.state.position[0]||0,z=actor?.state.position[2]||0,y=actor?.state.position[1]||0,distance=3.8;const angle=(actor?.state.yaw||0)+(side?Math.PI/2:0);camera.position.set(center+Math.sin(angle)*distance,y+1.8,z+Math.cos(angle)*distance);controls.target.set(center,y+.85,z);controls.update();}
  function show(mode){comparison=mode;container.dataset.comparison=mode;left.visible=mode!=='after';right.visible=mode!=='before';container.querySelectorAll('[data-motion-show]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.motionShow===mode));view();}
  container.querySelectorAll('[data-motion-show]').forEach(b=>b.onclick=()=>show(b.dataset.motionShow));
  function resize(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix();}
  const observer=new ResizeObserver(resize);observer.observe(stage);show(comparison);resize();
  function clear(){course?.dispose();course=null;for(const instance of instances)instance.dispose();instances=[];for(const mesh of fixtures){mesh.removeFromParent();mesh.geometry.dispose();mesh.material.dispose();}fixtures=[];}
  function block(group,x,y,z,w,h,d){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:'#aaa18d',roughness:1}));mesh.position.set(x,y+h/2,z);group.add(mesh);fixtures.push(mesh);}
  function buildFixtures(){for(const group of [left,right]){for(const b of course.boxes)block(group,0,0,0,b.max[0]-b.min[0],2,b.max[2]-b.min[2]);if(scenario==='stairs'){for(let i=0;i<6;i++)block(group,0,0,-1.2+(i+.5)*.4,3.2,(i+1)*.09,.4);block(group,0,0,2.6,3.2,.54,2.8);}}}
  async function select(id){
    currentId=id;const generation=++ticket;clear();status.textContent='正在載入人物…';const role=roles[id];
    try{
      const [before,after,neighbour]=await Promise.all([loadBlenderAsset(role.before),loadBlenderAsset(role.after),scenario==='avoid'?loadBlenderAsset('resident'):null]);
      if(disposed||generation!==ticket)return;
      actor={id:'motion-observer',modelId:role.after,motionProfile:role.profile,scale:blenderModels[role.after].height/1.7};course=createMotionCourse(actor,scenario);
      // Separate visual clocks observe a common motor, without sharing gait phase.
      const beforeActor={...actor,modelId:role.before,motionProfile:undefined},afterActor={...actor};
      const groundFor=group=>(x,z)=>course.footFloor(x-group.position.x,z-group.position.z);
      instances=[createResidentInstance(before,beforeActor,0,{motionVersion:2,metrics:blenderModels[role.before],groundAt:groundFor(left)}),createResidentInstance(after,afterActor,0,{groundAt:groundFor(right)})];
      left.add(instances[0].root);right.add(instances[1].root);
      if(neighbour)for(const group of [left,right]){const instance=createResidentInstance(neighbour,{...course.extra},0,{groundAt:groundFor(group)});instances.push(instance);group.add(instance.root);}
      buildFixtures();for(const instance of instances)instance.update(0);container.dataset.model=role.after;container.dataset.course=scenario;view();last=0;
    }catch(error){console.warn('Motion preview failed',error);status.textContent='人物比較暫時無法載入，仍可在場景中觀察。';}
  }
  function animate(now){
    if(disposed)return;raf=requestAnimationFrame(animate);const dt=frameStepSeconds(now,last);last=now;
    if(course){const active=playing&&!document.hidden;if(active)for(const step of frameSimulationSteps(dt))course.update(step);
      const follow=new THREE.Vector3(actor.state.position[0],.85+actor.state.position[1],actor.state.position[2]).sub(controls.target);camera.position.add(follow);controls.target.add(follow);
      scene.updateMatrixWorld(true);for(const instance of instances)instance.update(active?dt:0,{camera:camera.position.toArray()});
      const action=instances[1].root.userData.locomotion||'Idle';status.textContent=playing?names[action]||'觀察中':'已暫停，可拖曳比較';container.dataset.action=action;}
    controls.update();
    const w=stage.clientWidth,h=stage.clientHeight;
    if(comparison==='both'){
      // Two independent viewports share one camera and motor. Separate depth
      // buffers keep stairs and walls in one lane from hiding the other actor.
      renderer.setScissorTest(true);camera.aspect=w/2/Math.max(1,h);camera.updateProjectionMatrix();
      left.visible=true;right.visible=false;renderer.setViewport(0,0,w/2,h);renderer.setScissor(0,0,w/2,h);renderer.render(scene,camera);
      left.visible=false;right.visible=true;renderer.setViewport(w/2,0,w/2,h);renderer.setScissor(w/2,0,w/2,h);renderer.render(scene,camera);
    }else {renderer.setScissorTest(false);renderer.setViewport(0,0,w,h);camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix();left.visible=comparison==='before';right.visible=comparison==='after';renderer.render(scene,camera);}
  }
  play.onclick=()=>{playing=!playing;play.setAttribute('aria-pressed',playing);play.textContent=playing?'暫停':'繼續';last=0;};
  container.querySelector('#motion-repeat').onclick=()=>select(currentId);container.querySelector('#motion-role').onchange=e=>select(e.target.value);container.querySelector('#motion-course').onchange=e=>{scenario=e.target.value;select(currentId);};
  container.querySelector('#motion-front').onclick=()=>view(false);container.querySelector('#motion-side').onclick=()=>view(true);
  select(currentId);raf=requestAnimationFrame(animate);
  return {dispose(){disposed=true;ticket++;cancelAnimationFrame(raf);observer.disconnect();clear();controls.dispose();ground.geometry.dispose();ground.material.dispose();grid.geometry.dispose();grid.material.dispose();renderer.dispose();stage.replaceChildren();}};
}
