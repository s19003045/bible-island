import * as THREE from 'three';
import {walkSpawn} from './walk-data.js';
import {createCharacterController} from './character-controller.js';
export function createWalkControls(camera,canvas,{onInteract=()=>{},onStep=()=>{},onMessage=()=>{},onManualInput=()=>{},constrainMove=(from,to)=>to}={}) {
  const keys=new Set();let model=null,motor=null,active=false,blocked=false,position=[...walkSpawn],yaw=Math.PI/2,pitch=0,route=[],distance=0,drag=null,moved=false,axis=[0,0],turn=0;
  const apply=()=>{camera.position.set(position[0],(motor?.visualPosition[1]??position[1])+1.65,position[2]);camera.rotation.set(pitch,yaw,0,'YXZ');};
  function clear(){keys.clear();axis=[0,0];turn=0;drag=null;}
  function unlock(){if(document.pointerLockElement===canvas)document.exitPointerLock?.();}
  const typing=()=>/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName)||document.querySelector('dialog[open]');
  function keydown(e) {
    if(!active||blocked||typing()||e.ctrlKey||e.metaKey||e.altKey)return;
    if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyE'].includes(e.code)) {
      e.preventDefault();if(e.code==='KeyE'){if(!e.repeat)onInteract();return;}keys.add(e.code);route=[];onManualInput();
    }
  }
  const keyup=e=>keys.delete(e.code);
  const down=e=>{if(!active||blocked)return;canvas.focus({preventScroll:true});drag={id:e.pointerId,x:e.clientX,y:e.clientY};moved=false;canvas.setPointerCapture?.(e.pointerId);};
  function pointer(e) {
    if(!active||blocked)return;
    const locked=document.pointerLockElement===canvas;if(!locked&&drag?.id!==e.pointerId)return;
    const dx=locked?e.movementX:e.clientX-drag.x,dy=locked?e.movementY:e.clientY-drag.y;
    if(Math.abs(dx)+Math.abs(dy)>1)moved=true;
    yaw-=dx*.003;pitch=THREE.MathUtils.clamp(pitch-dy*.003,-1.15,1.15);
    if(drag){drag.x=e.clientX;drag.y=e.clientY;}apply();
  }
  const up=()=>{drag=null;};
  const blur=()=>{clear();route=[];};
  document.addEventListener('keydown',keydown);document.addEventListener('keyup',keyup);window.addEventListener('blur',blur);document.addEventListener('visibilitychange',blur);
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',pointer);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
  return {
    get active(){return active;},get position(){return [...position];},get navigating(){return route.length>0;},get dragged(){return moved;},
    get groundState(){return motor?{...motor.state,groundNormal:[...motor.state.groundNormal],visualY:motor.visualPosition[1],physicsY:position[1]}:null;},
    start(walkModel,spawn=walkSpawn){model=walkModel;motor=createCharacterController(model,{constrainMove});motor.reset(spawn);position=motor.position;yaw=Math.PI/2;pitch=0;route=[];active=true;blocked=false;clear();apply();canvas.focus({preventScroll:true});},
    stop(){active=false;route=[];clear();unlock();},
    block(value){blocked=value;clear();route=[];if(value)unlock();},
    lookAt(p){const dx=p[0]-position[0],dz=p[2]-position[2];yaw=Math.atan2(-dx,-dz);pitch=Math.atan2(p[1]-camera.position.y,Math.hypot(dx,dz));apply();},
    async lock(){if(!active||blocked)return;try{await canvas.requestPointerLock?.();if(document.pointerLockElement!==canvas)onMessage('可拖曳畫面環顧，或使用方向鍵。');}catch{onMessage('這個瀏覽器可用拖曳畫面環顧。');}},
    navigate(to){
      if(!active||blocked)return false;route=model.path(position,to);
      // Replanning must not pull a slowly moving player back to the nearest grid node.
      // Skip that node only if swept movement can safely reach its successor.
      if(route.length>1){const next=route[1],end=model.move(position,next[0]-position[0],next[2]-position[2]);if(Math.hypot(end[0]-next[0],end[2]-next[2])<.001)route.shift();}
      if(!route.length){onMessage('這裡沒有可步行路線，請選街道或院落入口。');return false;}return true;
    },
    cancelRoute(){route=[];},setAxis(x,z){axis=[x,z];route=[];},setTurn(n){turn=n;},
    update(dt){
      if(!active)return false;
      if(blocked){const changed=motor.update(dt);position=motor.position;if(changed)apply();return changed;}
      let forward=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)+axis[1];
      let side=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0)+axis[0];
      const rotate=(keys.has('ArrowLeft')?1:0)-(keys.has('ArrowRight')?1:0)+turn;let changed=!!rotate;
      yaw+=rotate*dt*1.4;
      let dx=0,dz=0;
      if(route.length&&!forward&&!side) {
        while(route.length&&Math.hypot(route[0][0]-position[0],route[0][2]-position[2])<.15)route.shift();
        if(route.length){dx=route[0][0]-position[0];dz=route[0][2]-position[2];const length=Math.hypot(dx,dz),speed=Math.min(length,dt*1.85);dx=dx/length*speed;dz=dz/length*speed;const target=Math.atan2(-dx,-dz);yaw+=Math.atan2(Math.sin(target-yaw),Math.cos(target-yaw))*Math.min(1,dt*6);}
      } else if(forward||side) {
        route=[];const length=Math.max(1,Math.hypot(forward,side));forward/=length;side/=length;
        dx=(-Math.sin(yaw)*forward+Math.cos(yaw)*side)*dt*1.85;dz=(-Math.cos(yaw)*forward-Math.sin(yaw)*side)*dt*1.85;
      }
      if(dx||dz){const factor=motor.speedFactor(dx,dz);dx*=factor;dz*=factor;}
      const before=position,physicalChange=motor.update(dt,dx,dz);position=motor.position;
      if(dx||dz){const d=Math.hypot(position[0]-before[0],position[2]-before[2]);if(d<.0001&&route.length){const staticNext=model.move(before,dx,dz);if(Math.hypot(staticNext[0]-before[0],staticNext[2]-before[2])<.0001){route=[];onMessage('前方有障礙，請換個方向。');}}distance+=d;const stride=motor.state.isClimbingStairs?.68:.78;if(distance>stride){distance%=stride;onStep(position,motor.state);}}
      changed ||=physicalChange;
      if(changed||dx||dz)apply();return changed||!!dx||!!dz;
    },
    dispose(){this.stop();document.removeEventListener('keydown',keydown);document.removeEventListener('keyup',keyup);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',blur);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',pointer);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);},
  };
}
