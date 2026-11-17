import * as THREE from 'three';
import {walkSpawn} from './walk-data.js';
import {createCharacterController} from './character-controller.js';
import {movementSettings} from './mobility.js';
export function createWalkControls(camera,canvas,{onInteract=()=>{},onStep=()=>{},onMotion=()=>{},onMessage=()=>{},onManualInput=()=>{},constrainMove=(from,to)=>to,navigationObstacles=()=>[]}={}) {
  const keys=new Set();let model=null,motor=null,active=false,blocked=false,position=[...walkSpawn],yaw=Math.PI/2,pitch=0,route=[],distance=0,drag=null,moved=false,axis=[0,0],turn=0;
  let destination=null,blockedTime=0;
  let mobility=false,runToggle=false,velocity=[0,0],movingSpeed=0;
  const apply=()=>{camera.position.set(position[0],(motor?.visualPosition[1]??position[1])+1.65,position[2]);camera.rotation.set(pitch,yaw,0,'YXZ');};
  function clear(){keys.clear();axis=[0,0];turn=0;drag=null;}
  function unlock(){if(document.pointerLockElement===canvas)document.exitPointerLock?.();}
  const typing=()=>/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName)||document.querySelector('dialog[open]');
  function keydown(e) {
    if(!active||blocked||typing()||e.ctrlKey||e.metaKey||e.altKey)return;
    if(mobility&&['ShiftLeft','ShiftRight','Space'].includes(e.code)){
      e.preventDefault();if(e.code==='Space'){if(!e.repeat){motor?.jump();route=[];onManualInput();}}else keys.add(e.code);return;
    }
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
  // Release keys and touch input on focus loss. A chosen automatic route survives
  // switching windows; the world pauses simulation while the document is hidden.
  const blur=()=>{clear();};
  function planRoute(to,obstacles=navigationObstacles()) {
    let next=model.path(position,to,{avoid:obstacles});
    // A temporarily occupied doorway keeps the goal while swept collision yields.
    if(!next.length&&obstacles.length)next=model.path(position,to);
    // A rounded start node must not pull a slowly moving player backwards.
    if(next.length>1){const target=next[1],end=model.move(position,target[0]-position[0],target[2]-position[2]);if(Math.hypot(end[0]-target[0],end[2]-target[2])<.001)next.shift();}
    // The nearest unoccupied grid node may be short of the requested goal.
    // Keep its exact final leg when statically clear; dynamic collision still
    // yields/replans until the person occupying it has moved away.
    const last=next.at(-1);
    if(last&&Math.hypot(last[0]-to[0],last[2]-to[2])>.001){const end=model.move(last,to[0]-last[0],to[2]-last[2]);if(Math.hypot(end[0]-to[0],end[2]-to[2])<.001)next.push([...to]);}
    return next;
  }
  document.addEventListener('keydown',keydown);document.addEventListener('keyup',keyup);window.addEventListener('blur',blur);document.addEventListener('visibilitychange',blur);
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',pointer);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
  return {
    get active(){return active;},get position(){return [...position];},get navigating(){return route.length>0;},get dragged(){return moved;},
    get groundState(){return motor?{...motor.state,groundNormal:[...motor.state.groundNormal],visualY:motor.visualPosition[1],physicsY:position[1],speed:movingSpeed,running:mobility&&(runToggle||keys.has('ShiftLeft')||keys.has('ShiftRight')),runToggle}:null;},
    start(walkModel,spawn=walkSpawn,{mobility:enabled=false}={}){model=walkModel;mobility=enabled;runToggle=false;velocity=[0,0];movingSpeed=0;motor=createCharacterController(model,{constrainMove,config:{jumpEnabled:mobility}});motor.reset(spawn);position=motor.position;yaw=Math.PI/2;pitch=0;route=[];active=true;blocked=false;clear();apply();canvas.focus({preventScroll:true});},
    stop(){active=false;route=[];velocity=[0,0];runToggle=false;clear();unlock();},
    block(value){blocked=value;clear();route=[];velocity=[0,0];runToggle=false;if(value)unlock();},
    jump(){if(!active||blocked||!mobility)return false;route=[];onManualInput();return motor.jump();},
    toggleRun(){if(!mobility)return false;runToggle=!runToggle;return runToggle;},
    teleport(target){if(!active||blocked||!model.valid(target[0],target[2],target[1]))return false;route=[];destination=null;velocity=[0,0];movingSpeed=0;clear();motor.reset(target);position=motor.position;apply();return true;},
    lookAt(p){const dx=p[0]-position[0],dz=p[2]-position[2];yaw=Math.atan2(-dx,-dz);pitch=THREE.MathUtils.clamp(Math.atan2(p[1]-camera.position.y,Math.hypot(dx,dz)),-1.15,1.15);apply();},
    async lock(){if(!active||blocked)return;try{await canvas.requestPointerLock?.();if(document.pointerLockElement!==canvas)onMessage('可拖曳畫面環顧，或使用方向鍵。');}catch{onMessage('這個瀏覽器可用拖曳畫面環顧。');}},
    navigate(to){
      if(!active||blocked)return false;destination=[...to];blockedTime=0;route=planRoute(to);
      if(!route.length){onMessage('這裡沒有可步行路線，請選擇可探索的地面或入口。');return false;}return true;
    },
    cancelRoute(){route=[];destination=null;blockedTime=0;velocity=[0,0];},setAxis(x,z){axis=[x,z];route=[];},setTurn(n){turn=n;},
    update(dt){
      if(!active)return false;
      if(blocked){const changed=motor.update(dt);position=motor.position;if(changed)apply();return changed;}
      let forward=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)+axis[1];
      let side=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0)+axis[0];
      const rotate=(keys.has('ArrowLeft')?1:0)-(keys.has('ArrowRight')?1:0)+turn;let changed=!!rotate;
      yaw+=rotate*dt*1.4;
      let dx=0,dz=0;
      const running=mobility&&(runToggle||keys.has('ShiftLeft')||keys.has('ShiftRight'));
      const speed=mobility?(running?movementSettings.runSpeed:movementSettings.walkSpeed):1.85;
      if(route.length&&!forward&&!side) {
        while(route.length&&Math.hypot(route[0][0]-position[0],route[0][2]-position[2])<.15)route.shift();
        if(mobility)while(route.length>1&&Math.hypot(route[1][0]-position[0],route[1][2]-position[2])<1.2){const next=route[1],p=model.move(position,next[0]-position[0],next[2]-position[2]);if(Math.hypot(p[0]-next[0],p[2]-next[2])>.001)break;route.shift();}
        if(route.length){dx=route[0][0]-position[0];dz=route[0][2]-position[2];const length=Math.hypot(dx,dz),remaining=destination?Math.hypot(destination[0]-position[0],destination[2]-position[2]):length,travel=Math.min(length,dt*Math.min(speed,mobility?Math.sqrt(2*movementSettings.deceleration*remaining):speed));dx=dx/length*travel;dz=dz/length*travel;const target=Math.atan2(-dx,-dz);yaw+=Math.atan2(Math.sin(target-yaw),Math.cos(target-yaw))*Math.min(1,dt*6);}
      } else if(forward||side) {
        route=[];const length=Math.max(1,Math.hypot(forward,side));forward/=length;side/=length;
        dx=(-Math.sin(yaw)*forward+Math.cos(yaw)*side)*dt*speed;dz=(-Math.cos(yaw)*forward-Math.sin(yaw)*side)*dt*speed;
      }
      if(dx||dz){const factor=motor.speedFactor(dx,dz);dx*=factor;dz*=factor;}
      if(mobility&&dt>0){
        const desired=[dx/dt,dz/dt],change=Math.hypot(desired[0]-velocity[0],desired[1]-velocity[1]),rate=(dx||dz)?movementSettings.acceleration:movementSettings.deceleration;
        const alpha=change?Math.min(1,rate*dt/change):1;velocity=velocity.map((v,i)=>v+(desired[i]-v)*alpha);dx=velocity[0]*dt;dz=velocity[1]*dt;
      }
      const wasGrounded=motor.state.isGrounded;
      const before=position,physicalChange=motor.update(dt,dx,dz);position=motor.position;
      movingSpeed=dt>0?Math.hypot(position[0]-before[0],position[2]-before[2])/dt:0;
      if(wasGrounded&&!motor.state.isGrounded&&motor.state.verticalVelocity>0)onMotion('jump',position,motor.state);
      if(motor.state.landed)onMotion('land',position,motor.state);
      if(dx||dz){const d=Math.hypot(position[0]-before[0],position[2]-before[2]);blockedTime=d<.001?blockedTime+dt:0;
        const attempted=Math.hypot(dx,dz),blockedDistance=Math.min(.0001,attempted*.1);
        if(attempted>.000001&&d<blockedDistance&&route.length){const staticNext=model.move(before,dx,dz);if(Math.hypot(staticNext[0]-before[0],staticNext[2]-before[2])<blockedDistance){route=[];onMessage('前方有障礙，請換個方向。');}}
        // Yield briefly to crossing traffic, then route around someone who remains in the way.
        if(blockedTime>.9&&route.length&&destination){const avoid=navigationObstacles();if(avoid.length){const next=planRoute(destination,avoid);if(next.length)route=next;}blockedTime=0;}
        if(motor.state.isGrounded){distance+=d;const stride=motor.state.isClimbingStairs?.68:running?.95:.78;if(distance>stride){distance%=stride;onStep(position,{...motor.state,running,speed:movingSpeed});}}}
      changed ||=physicalChange;
      if(changed||dx||dz)apply();return changed||!!dx||!!dz;
    },
    dispose(){this.stop();document.removeEventListener('keydown',keydown);document.removeEventListener('keyup',keyup);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',blur);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',pointer);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);},
  };
}
