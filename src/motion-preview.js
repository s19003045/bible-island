import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createResidentInstance,loadBlenderAsset} from './blender-assets.js';
import {createNPCSystem} from './npc-system.js';
import {createWalkModel} from './walk-model.js';
import {createMotion} from './people-motion.js';
import {frameStepSeconds,frameSimulationSteps} from './frame-time.js';
import baseline from '../assets/blender/motion-baseline.json';

export function mountMotionPreview(container){
  container.innerHTML='<div class="motion-preview-labels" role="group" aria-label="比較方式"><button data-motion-show="before">先前步態</button><button data-motion-show="after">新版步態</button><button data-motion-show="both">並排比較</button></div><div class="motion-preview-stage"></div><div class="motion-preview-tools"><label>觀察人物<select id="motion-role" aria-label="觀察人物"><option value="resident">居民</option><option value="resident-carrier">提水居民</option><option value="resident-worker">工作者</option><option value="resident-child">孩童</option></select></label><button id="motion-play" aria-pressed="true">暫停</button><button id="motion-repeat">重新觀察</button><button id="motion-front">正面</button><button id="motion-side">側面</button><span id="motion-phase" role="status">正在載入人物…</span></div>';
  const stage=container.querySelector('.motion-preview-stage'),renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;stage.append(renderer.domElement);
  renderer.domElement.setAttribute('aria-label','先前與新版人物在相同路徑上起步、行走、停步與轉身的動態比較');
  const scene=new THREE.Scene();scene.background=new THREE.Color('#d5dbd4');scene.fog=new THREE.Fog('#d5dbd4',16,35);
  scene.add(new THREE.HemisphereLight('#fff9e8','#737963',2));const sun=new THREE.DirectionalLight('#fff4d8',2.4);sun.position.set(-3,8,5);scene.add(sun);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(40,40),new THREE.MeshStandardMaterial({color:'#aea994',roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.003;scene.add(ground);
  const grid=new THREE.GridHelper(40,80,'#7a806f','#a0a18e');grid.position.y=.001;scene.add(grid);
  const camera=new THREE.PerspectiveCamera(38,1,.1,70),controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.9,0);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=2.6;controls.maxDistance=18;controls.maxPolarAngle=Math.PI*.48;
  const left=new THREE.Group(),right=new THREE.Group();left.position.x=-2.3;right.position.x=2.3;scene.add(left,right);
  let instances=[],npc=null,actor=null,playing=true,disposed=false,ticket=0,raf=0,last=0,currentId='resident',comparison=window.innerWidth<640?'after':'both',sideView=false;
  const baselineLoads=new Map(),released=new Set();
  function releaseBaseline(gltf){if(released.has(gltf))return;released.add(gltf);const geometries=new Set(),materials=new Set(),skeletons=new Set();gltf.scene.traverse(o=>{if(o.isMesh){geometries.add(o.geometry);for(const material of [].concat(o.material))materials.add(material);}if(o.isSkinnedMesh)skeletons.add(o.skeleton);});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const s of skeletons)s.dispose();}
  function loadBaseline(id){if(!baselineLoads.has(id))baselineLoads.set(id,new GLTFLoader().loadAsync(baseline.models[id].src).then(gltf=>{if(disposed)releaseBaseline(gltf);return gltf;}));return baselineLoads.get(id);}
  const status=container.querySelector('#motion-phase'),play=container.querySelector('#motion-play');
  function view(side=sideView){sideView=side;const center=(comparison==='before'?left.position.x:comparison==='after'?right.position.x:0)+(actor?.state.position[0]||0),z=actor?.state.position[2]||0,distance=comparison==='both'?(stage.clientWidth/Math.max(1,stage.clientHeight)<1.4?8:5.8):3.8;const angle=(actor?.state.yaw||0)+(side?Math.PI/2:0);camera.position.set(center+Math.sin(angle)*distance,1.8,z+Math.cos(angle)*distance);controls.target.set(center,.85,z);controls.update();}
  function show(mode){comparison=mode;left.visible=mode!=='after';right.visible=mode!=='before';container.querySelectorAll('[data-motion-show]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.motionShow===mode));view();}
  container.querySelectorAll('[data-motion-show]').forEach(b=>b.onclick=()=>show(b.dataset.motionShow));
  function resize(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix();}
  const observer=new ResizeObserver(resize);observer.observe(stage);show(comparison);resize();
  function clear(){npc?.dispose();npc=null;for(const instance of instances)instance.dispose();instances=[];}
  async function select(id){
    currentId=id;const generation=++ticket;clear();status.textContent='正在載入人物…';
    try{
      const [before,after]=await Promise.all([loadBaseline(id),loadBlenderAsset(id)]);
      if(disposed||generation!==ticket)return;
      actor={id:'motion-observer',modelId:id,scale:baseline.models[id].height/1.7,state:createMotion([-.8,0,0],Math.PI/2)};
      const pois=[[-.9,-1.4],[.9,-1.4],[.9,1.4],[-.9,1.4]].map(([x,z],i)=>({id:'corner-'+i,name:'corner',action:i%2?'LookAround':'Idle',weight:1,capacity:1,slots:[[x,0,z]],lookAt:[0,0],dwell:[1.2,2.1],tags:['resident']}));
      npc=createNPCSystem({actors:[actor],pois,model:createWalkModel([],[{x1:-3,x2:3,z1:-3,z2:3}],()=>0),seed:8821,spawnExclusion:null,naturalMotion:true,socialProbability:0});npc.agents[0].timer=.25;
      instances=[createResidentInstance(before,actor,0,{motionVersion:1,metrics:baseline.models[id],groundAt:()=>0}),createResidentInstance(after,actor,0,{groundAt:()=>0})];
      left.add(instances[0].root);right.add(instances[1].root);for(const instance of instances)instance.update(0);
      container.dataset.model=id;view();last=0;
    }catch{status.textContent='人物比較暫時無法載入，仍可在場景中觀察。';}
  }
  const names={Idle:'駐足',Walk:'行走',StartWalk:'起步',StopWalk:'收步',TurnLeft:'向左轉身',TurnRight:'向右轉身',LookAround:'環顧',Interact:'互動',Talk:'交談'};
  function animate(now){
    if(disposed)return;raf=requestAnimationFrame(animate);const dt=frameStepSeconds(now,last);last=now;
    if(npc){if(playing&&!document.hidden)for(const step of frameSimulationSteps(dt))npc.update(step);for(const instance of instances)instance.update(playing&&!document.hidden?dt:0);
      const center=comparison==='before'?left.position.x:comparison==='after'?right.position.x:0,follow=new THREE.Vector3(center+actor.state.position[0],.85,actor.state.position[2]).sub(controls.target);camera.position.add(follow);controls.target.add(follow);
      const action=instances[1].root.userData.locomotion||'Idle';status.textContent=playing?names[action]||'觀察中':'已暫停，可拖曳比較';container.dataset.action=action;}
    controls.update();renderer.render(scene,camera);
  }
  play.onclick=()=>{playing=!playing;play.setAttribute('aria-pressed',playing);play.textContent=playing?'暫停':'繼續';last=0;};
  container.querySelector('#motion-repeat').onclick=()=>select(currentId);container.querySelector('#motion-role').onchange=e=>select(e.target.value);
  container.querySelector('#motion-front').onclick=()=>view(false);container.querySelector('#motion-side').onclick=()=>view(true);
  select(currentId);raf=requestAnimationFrame(animate);
  return {dispose(){disposed=true;ticket++;cancelAnimationFrame(raf);observer.disconnect();clear();for(const promise of baselineLoads.values())promise.then(releaseBaseline).catch(()=>{});baselineLoads.clear();controls.dispose();ground.geometry.dispose();ground.material.dispose();grid.geometry.dispose();grid.material.dispose();renderer.dispose();stage.replaceChildren();}};
}
