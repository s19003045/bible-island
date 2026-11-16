import {exileSegmentById} from './exile-exploration.js';
import {buildExileScene,attachExileExploration} from './exile-scenes.js';
import {kingdomsSegmentById} from './kingdoms-exploration.js';
import {buildKingdomsScene,attachKingdomsExploration} from './kingdoms-scenes.js';
import {davidSegmentById} from './david-exploration.js';
import {buildDavidScene,attachDavidExploration} from './david-scenes.js';
import {normalizeDavidPhase} from './artifact-phases.js';
import {ruthSegmentById} from './ruth-exploration.js';
import {buildRuthScene,attachRuthExploration} from './ruth-scenes.js';
import {sinaiSegmentById} from './sinai-exploration.js';
import {buildSinaiScene,attachSinaiExploration} from './sinai-scenes.js';
import {josephSegmentById} from './joseph-exploration.js';
import {buildJosephScene,attachJosephExploration} from './joseph-scenes.js';
import {abrahamSegmentById} from './abraham-exploration.js';
import {buildAbrahamScene,attachAbrahamExploration,animateAbrahamAnimals} from './abraham-scenes.js';
import {paulSegmentById} from './paul-exploration.js';
import {buildPaulScene,attachPaulExploration} from './paul-scenes.js';
import {returnSegmentById} from './return-exploration.js';
import {buildReturnScene,attachReturnExploration} from './return-scenes.js';
import * as THREE from 'three';
import { dimensions, historicalScenes, HUMAN_HEIGHT } from './historical-data.js';
import { peopleByIsland } from './people-data.js';
import { createMotion, advanceMotion } from './people-motion.js';
import { walkSurfaces,walkFloor,vesselDefinitions,stairCollisionProxies } from './walk-data.js';
import { createVessel } from './vessels.js';
import { createWalkModel } from './walk-model.js';
import {buildExodusScene,attachExodusExploration} from './exodus-scenes.js';
import {exodusSegmentById,exodusSegments} from './exodus-exploration.js';
import {createNPCSystem} from './npc-system.js';
import {jerusalemPOIs,prepareJerusalemResidents,jerusalemAllowed} from './npc-pois.js';
import {tabernacleSurfaces,tabernacleFloor,tabernaclePOIs,tabernacleAllowed,tabernacleSpawnCandidates,tabernacleObjects} from './tabernacle-exploration.js';
import {herodSurfaces,herodFloor,herodProxies,herodPOIs,herodAllowed,herodSpawnCandidates,herodObjects,herodSpawn} from './herod-exploration.js';
import {solomonSurfaces,solomonFloor,solomonProxies,solomonPOIs,solomonAllowed,solomonSpawnCandidates,solomonObjects,solomonSpawn} from './solomon-exploration.js';
import {explorationFor} from './exploration-data.js';
import {mountBlenderResidents} from './blender-assets.js';
import {residentAppearance,residentClearance} from './resident-appearance.js';
import {exodusFloor} from './exodus-exploration.js';
import {buildJordanScene,attachJordanExploration} from './jordan-scenes.js';

// Detailed scenes use one Three unit per metre. Geometry is batched by material, not by building.
const G = {
  box: new THREE.BoxGeometry(1, 1, 1),
  shadow: new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2),
  leaf: (() => {const g=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute([-.5,0,0,0,.04,-.18,.5,0,0,-.5,0,0,.5,0,0,0,-.01,.18],3)); g.computeVertexNormals(); return g;})(),
  column: new THREE.CylinderGeometry(.47, .5, 1, 24),
  sphere: new THREE.SphereGeometry(.5, 16, 12),
  robe: new THREE.CylinderGeometry(.33, .5, 1, 16),
  ring: new THREE.TorusGeometry(.5, .06, 6, 24),
  bowl: new THREE.LatheGeometry([[0,-.5],[.13,-.48],[.34,-.27],[.49,.3],[.5,.47],[.47,.5],[.44,.46],[.43,.3],[.3,-.22],[.1,-.38],[0,-.38]].map(([x,y]) => new THREE.Vector2(x,y)), 40),
};
const seeded = seed => () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 4294967296; };
const matCache = new Map();
function material(name, color, type = 'stone') {
  if (matCache.has(name)) return matCache.get(name);
  const rand = seeded(name.length * 137 + color.length * 9);
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d'); ctx.fillStyle = color; ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 6500; i++) {
    const a = rand() * .055; ctx.fillStyle = rand() > .5 ? `rgba(255,255,255,${a})` : `rgba(36,28,20,${a})`;
    const x = rand() * 256, y = rand() * 256;
    ctx.fillRect(x, y, type === 'wood' ? 1 : 1 + rand() * 4, type === 'wood' ? 12 + rand() * 50 : 1 + rand() * 4);
  }
  if (type === 'cloth') {
    ctx.strokeStyle = '#392c211c'; ctx.lineWidth = 1;
    for (let i = 0; i < 256; i += 3) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,256); ctx.moveTo(0,i); ctx.lineTo(256,i); ctx.stroke(); }
  }
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; map.wrapS = map.wrapT = THREE.RepeatWrapping; map.anisotropy = 4;
  const bump = map.clone(); bump.colorSpace = THREE.NoColorSpace; bump.needsUpdate = true;
  const metal = type === 'metal';
  const m = new THREE.MeshStandardMaterial({ color: metal ? '#ffffff' : new THREE.Color(color).lerp(new THREE.Color('#ffffff'),.55), map, bumpMap: bump, bumpScale: metal ? .008 : type === 'cloth' ? .008 : .035, roughness: metal ? .34 : .94, metalness: metal ? .68 : 0, side: type === 'cloth' || name==='olive-foliage' ? THREE.DoubleSide : THREE.FrontSide });
  matCache.set(name, m); return m;
}
function palette() {
  return {
    contact: new THREE.ShaderMaterial({transparent:true,depthWrite:false,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;void main(){float a=(1.-smoothstep(.14,.5,length(vUv-.5)))*.24;gl_FragColor=vec4(.07,.055,.035,a);}'}),
    stone: material('limestone', '#b7aa8f'), light: material('cut-limestone', '#d7cbb3'), darkstone: material('foundation', '#92836d'), plaster: material('lime-plaster', '#c9c0a8'),
    court: material('beaten-earth', '#93856c'), mud: material('mudbrick', '#a48a67'), sand: material('gravel-sand', '#ac9270'), path: material('beaten-path', '#bda685'),
    wood: material('acacia', '#574331', 'wood'), cedar: material('cedar', '#795439', 'wood'), gold: material('gold', '#c89a43', 'metal'), bronze: material('aged-bronze', '#8c623e', 'metal'), silver: material('silver', '#aba79c', 'metal'),
    linen: material('linen', '#c9c1a7', 'cloth'), wool: material('goat-hair', '#4e4134', 'cloth'), hide: material('outer-cover', '#76614b', 'cloth'), red: material('scarlet', '#76392d', 'cloth'), purple: material('dyed-purple', '#534456', 'cloth'), blue: material('dyed-blue', '#3f5160', 'cloth'),
    skin: material('skin', '#987052'), hair: material('hair', '#3b3027'), robe0: material('robe-earth', '#796957','cloth'), robe1: material('robe-pale', '#b6aa8f','cloth'), robe2: material('robe-ochre', '#8f7552','cloth'), robe3: material('robe-slate', '#5f6866','cloth'),
    terra: material('earthenware', '#9c6650'), leaf: material('olive-foliage', '#4c5540'), trunk: material('olive-bark', '#635b4a','wood'), reed: material('dry-grass', '#8c8256'), black: material('door-shadow', '#2e2a23'), water: new THREE.MeshPhysicalMaterial({ color: '#416d6c', roughness: .26, metalness: .22, clearcoat: .7 }),
  };
}
function builder(parent, p, seed = 31, collectCollision = false,island=null) {
  const actors = [], collisionBoxes = []; let actor = null, bone = null;
  const batches = new Map(), rand = seeded(seed), dummy = new THREE.Object3D(),hiddenScale=new THREE.Vector3(1e-6,1e-6,1e-6);
  function part(kind, mat, x, y, z, w, h, d, rx = 0, ry = 0, rz = 0) {
    const key = `${kind}/${mat}${actor ? "/people" : ""}`;
    if (!batches.has(key)) batches.set(key, { kind, mat, parts: [] });
    batches.get(key).parts.push({ x,y,z,w,h,d,rx,ry,rz, actor,bone, tone: .9 + rand() * .19 });
  }
  const box = (mat, x,y,z,w,h,d,ry = 0) => part('box',mat,x,y,z,w,h,d,0,ry);
  const cyl = (mat,x,y,z,r,h) => part('column',mat,x,y,z,r*2,h,r*2);
  const ball = (mat,x,y,z,w,h=w,d=w) => part('sphere',mat,x,y,z,w,h,d);
  function beam(mat, a,b,r = .04) {
    const from = new THREE.Vector3(...a), to = new THREE.Vector3(...b), mid = from.clone().add(to).multiplyScalar(.5);
    dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),to.sub(from).normalize()); const rot = new THREE.Euler().setFromQuaternion(dummy.quaternion);
    part('column',mat,mid.x,mid.y,mid.z,r*2,new THREE.Vector3(...a).distanceTo(new THREE.Vector3(...b)),r*2,rot.x,rot.y,rot.z);
  }
  function wall(x,y,z,length,height,depth = .65, axis = 'x', mat = 'stone', block = 1.25, course = .45) {
    // Running bond, small mortar gaps and per-stone variations remain visible at close range.
    for (let bottom = 0, row = 0; bottom < height - .001; bottom += course, row++) {
      const h = Math.min(course,height-bottom);
      if(h<=.02)continue; // A short final course must not be thinner than its mortar gap.
      for (let start = -length/2 - (row % 2 ? block/2 : 0); start < length/2; start += block) {
        const left = Math.max(-length/2,start), right = Math.min(length/2,start+block), mid = (left+right)/2;
        if (right-left <= .035) continue;
        box(mat,x+(axis==='x'?mid:0),y+bottom+h/2,z+(axis==='z'?mid:0),axis==='x'?right-left-.018:depth,h-.014,axis==='z'?right-left-.018:depth);
      }
    }
  }
  function paving(x,y,z,w,d,size = 2.4) {
    for (let a = -w/2; a < w/2 - .01; a += size) for(let b = -d/2; b < d/2 - .01; b += size) {
      const dx = Math.min(size,w/2-a), dz = Math.min(size,d/2-b);
      if (dx <= .04 || dz <= .04) continue;
      box('stone',x+a+dx/2,y-.07,z+b+dz/2,dx-.035,.16,dz-.035);
    }
  }
  function person(x,y,z,style = 0,yaw = 0,height = HUMAN_HEIGHT,options = {}) {
    const appearance=residentAppearance(island,options,actors.length,height);height=appearance.height;
    actor = {id:options.id, role:options.role,modelId:appearance.modelId,motion:options.motion || "idle", state:createMotion([x,y,z],yaw,options.route,actors.length,options.routeMode), parts:[], scale:height/HUMAN_HEIGHT};
    actor.collisionRadius=residentClearance(actor);
    actors.push(actor);
    const s = height / HUMAN_HEIGHT;
    const loc = (a,b,c) => [x+(a*Math.cos(yaw)+c*Math.sin(yaw))*s, y+b*s,z+(-a*Math.sin(yaw)+c*Math.cos(yaw))*s];
    const pp = (kind, mat,a,b,c,w,h,d) => part(kind,mat,...loc(a,b,c),w*s,h*s,d*s,0,yaw);
    // 0.225 m head; shoulders 0.43 m. Normal adult proportions rather than enlarged toy heads.
    pp('robe',`robe${style%4}`,0,.72,0,.49,1.05,.33);
    for(const side of [-1,1]) {bone=side<0?'legL':'legR';pp('column','skin',side*.10,.19,0,.065,.22,.075);} bone=null;
    pp('sphere',`robe${style%4}`,0,1.28,0,.43,.30,.29);
    pp('column','skin',0,1.43,0,.11,.12,.11);bone='head';
    bone='head';pp('sphere','skin',0,1.565,0,.17,.225,.195);
    pp('sphere','hair',0,1.65,-.01,.18,.10,.2);
    bone='legL';pp('box','wood',-.105,.055,.04,.105,.11,.25);bone='legR';pp('box','wood',.105,.055,.04,.105,.11,.25);
    for(const side of [-1,1]) {
      bone=side<0?'armL':'armR';
      pp('sphere',`robe${style%4}`,side*.195,1.265,0,.155,.16,.17);
      const shoulder = loc(side*.22,1.27,0), elbow = loc(side*.25,1.02,.04), hand = loc(side*.23,.83,.13);
      beam(`robe${style%4}`,shoulder,elbow,.065*s);bone=side<0?'forearmL':'forearmR';beam('skin',elbow,hand,.042*s);ball('skin',...hand,.075*s,.12*s,.065*s);
      if(side===1&&options.id==='water-carrier'){pp('bowl','terra',.31,.65,.14,.29,.32,.29);pp('column','terra',.31,.83,.14,.095,.08,.095);}
    }
    bone=null;pp('robe',style%2?'linen':'hide',0,1.27,0,.48,.15,.34);
    bone='head';pp('sphere','skin',0,1.56,.102,.036,.054,.045);
    for(const side of [-1,1])pp('sphere','hair',side*.039,1.59,.087,.012,.012,.008);
    pp('box','hair',0,1.515,.094,.032,.005,.006);
    if (style%3===0 || options.headCover) { pp('sphere','linen',0,1.68,0,.22,.055,.24); pp('box','linen',0,1.53,-.09,.21,.27,.04); }
    bone=null;box('hide',x,y+1.01*s,z,.32*s,.045*s,.25*s,yaw);
    bone='ground';part('shadow','contact',x,y+.035*s,z,.75*s,.01,.65*s);bone=null;
    actor=null;
  }
  function jar(x,y,z,s=.6,mat='terra') {
    part('bowl',mat,x,y+s*.48,z,s,s*.9,s); cyl(mat,x,y+s*.95,z,s*.18,s*.2);
    part('ring',mat,x,y+s*1.06,z,s*.43,s*.43,s*.43,Math.PI/2);
  }
  function olive(x,y,z,s=1) {
    beam('trunk',[x,y,z],[x+.2*s,y+2.5*s,z],.18*s);
    for(let i=0;i<7;i++) {
      const a=i*2.4,r=(i%3)*.65*s;
      const end=[x+Math.cos(a)*r,y+(2.8+rand()*.65)*s,z+Math.sin(a)*r];
      beam('trunk',[x+.12*s,y+1.6*s,z],end,.07*s);
      for(let n=0;n<100;n++) {
        const a=rand()*Math.PI*2,r=Math.sqrt(rand()),dy=(rand()-.5)*.8*s;
        part('leaf','leaf',end[0]+Math.cos(a)*r*.9*s,end[1]+dy,end[2]+Math.sin(a)*r*.75*s,(.15+rand()*.13)*s,s,s,rand()*1.2,rand()*Math.PI*2,rand()*.8);
      }
    }
  }
  function tent(x,y,z,s=1) {
    const w=5*s,d=3.2*s,h=2.2*s;
    // A ridge tent, sagging woven side panels and guy ropes; no conical toy tents.
    for(const side of [-1,1]) {
      const dx=w*.5,dy=-h*.42, length=Math.hypot(dx,dy);
      part('box','wool',x+side*w*.25,y+h*.79,z,length,.035,d,0,0,side*Math.atan2(dy,dx));
      box('wool',x+side*w*.5,y+h*.38,z,.035,h*.77,d);
      for(const q of [-.45,.45]) { beam('hide',[x+side*w*.49,y+h*.55,z+q*d],[x+side*w*.75,y+.05,z+q*d],.014); cyl('wood',x+side*w*.75,y+.08,z+q*d,.025,.16); }
    }
    for(const q of [-.46,.46]) cyl('wood',x,y+h*.5,z+q*d,.045,h);
    box('wool',x,y+h*.5,z-d*.5,w,h,.035);
    box('wool',x-w*.34,y+h*.42,z+d*.5,w*.32,h*.84,.035);
    box('wool',x+w*.34,y+h*.42,z+d*.5,w*.32,h*.84,.035);
    jar(x+w*.65,y,z,.5*s);
  }
  function house(x,y,z,w=8,d=7,h=3.6,mat='stone',roofBuilder=null,yaw=0,doorOpen=false) {
    const before = new Map([...batches].map(([key,batch])=>[key,batch.parts.length]));
    const t=.5,door=1.15;
    // Foundation descends into uneven ground instead of leaving detached floating houses.
    box('darkstone',x,y-1.8,z,w+.25,3.6,d+.25);
    wall(x,y,z-d/2,w,h,t,'x',mat);
    wall(x-w/2,y,z,d,h,t,'z',mat); wall(x+w/2,y,z,d,h,t,'z',mat);
    const side=(w-door)/2;
    wall(x-door/2-side/2,y,z+d/2,side,h,t,'x',mat); wall(x+door/2+side/2,y,z+d/2,side,h,t,'x',mat);
    box(mat,x,y+2.25+(h-2.25)/2,z+d/2,door+.1,h-2.25,t);
    box('wood',x,y+2.19,z+d/2,door+.35,.16,.65);
    box('black',x,y+1,z+d/2-.23,door,2,.04);
    if(doorOpen)box('wood',x+door/2+.15,y+1,z+d/2-.55,.07,2,door*.9);else box('wood',x,y+1,z+d/2-.2,door*.78,2,.07,.18);
    for(const sx of [-1,1]) { box('black',x+sx*w*.31,y+2.3,z+d/2+.265,.5,.65,.025); for(let n=0;n<3;n++) box('wood',x+sx*w*.31-.18+n*.18,y+2.3,z+d/2+.29,.035,.65,.04); }
    const roof = roofBuilder || { box };
    roof.box('plaster',x,y+h+.12,z,w+.25,.24,d+.25);
    for(const q of [-1,1]) { roof.box(mat,x+q*w/2,y+h+.46,z,.27,.7,d+.25); roof.box(mat,x,y+h+.46,z+q*d/2,w,.7,.27); }
    for(let i=0;i<12;i++) box(mat,x+w/2+.85,y+(i+1)*h/12/2,z+d/2-i*.32,.95,(i+1)*h/12,.34);
    if(!doorOpen){
    for(let i=0;i<5;i++) jar(x-w*.3+i*.48,y,z+d*.5+.7,.42+rand()*.25);
    box('wood',x-w*.2,y+.5,z+d*.5+1.2,1.8,.1,.6);
    for(const dx of [-.7,.7]) box('wood',x-w*.2+dx,y+.23,z+d*.5+1.2,.09,.46,.5);
    }
    if(yaw) for(const [key,batch] of batches) for(let i=before.get(key)||0;i<batch.parts.length;i++) {
      const v=batch.parts[i],dx=v.x-x,dz=v.z-z;
      v.x=x+dx*Math.cos(yaw)+dz*Math.sin(yaw);v.z=z-dx*Math.sin(yaw)+dz*Math.cos(yaw);v.ry+=yaw;
    }
  }
  function finish() {
    const root=new THREE.Matrix4(), inverse=new THREE.Matrix4();
    for(const {kind,mat,parts} of batches.values()) {
      const mesh = new THREE.InstancedMesh(G[kind],p[mat],parts.length);
      const dynamic=parts.some(v=>v.actor);
      if(dynamic) {mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;mesh.userData.people=true;}
      parts.forEach((v,i) => {
        dummy.position.set(v.x,v.y,v.z); dummy.rotation.set(v.rx,v.ry,v.rz); dummy.scale.set(v.w,v.h,v.d); dummy.updateMatrix();
        if(collectCollision && !v.actor && ['box','column','bowl'].includes(kind) && v.h>.28 && !['water','black','linen','wool','hide','reed'].includes(mat)) {
          if(!G[kind].boundingBox)G[kind].computeBoundingBox();const bounds=G[kind].boundingBox.clone().applyMatrix4(dummy.matrix);
          collisionBoxes.push({min:bounds.min.toArray(),max:bounds.max.toArray()});
        }
        mesh.setMatrixAt(i,dummy.matrix);mesh.setColorAt(i,new THREE.Color(v.tone,v.tone,v.tone));
        if(v.actor) {
          root.makeRotationY(v.actor.state.yaw);root.setPosition(...v.actor.state.position);inverse.copy(root).invert();
          v.actor.parts.push({mesh,index:i,bone:v.bone,bind:inverse.clone().multiply(dummy.matrix)});
          if(v.actor.id) {mesh.userData.actorInstances ||= {};mesh.userData.actorInstances[i]=v.actor.id;}
        }
      });
      mesh.name=`${kind}/${mat}${dynamic?'/people':''}`; mesh.castShadow=!dynamic; mesh.receiveShadow=mat!=='contact'; mesh.computeBoundingSphere(); parent.add(mesh);
    }
  }
  const root=new THREE.Matrix4(),joint=new THREE.Matrix4(),matrix=new THREE.Matrix4(),r=new THREE.Matrix4(),t=new THREE.Matrix4();
  function animate(dt,cameraPosition) {
    const touched=new Set();
    for(const a of actors) {
      const m=a.state.autonomous?a.state:advanceMotion(a.state,dt,cameraPosition),s=a.scale;
      const speaking=m.talking||m.socialTalking,working=m.autonomous?m.idleAction==='Interact':a.motion==='work';
      const stride=Math.sin(m.time*7.5)*m.stride, breath=Math.sin(m.time*1.8)*.009;
      root.makeRotationY(m.yaw);root.setPosition(m.position[0],m.position[1]+(breath+Math.abs(stride)*.018)*s,m.position[2]);
      const posing={};
      for(const bone of ['head','armL','armR','forearmL','forearmR','legL','legR','ground']) {
          let x=0,y=0,rx=0,rz=0,ry=0;
          if(bone==='head') {y=1.44;ry=Math.sin(m.time*.65)*(m.idleAction==='LookAround'?.23:.07);rx=speaking?Math.sin(m.time*2.5)*.055:0;}
          else if(bone.startsWith('arm')) {
            const side=bone==='armL'?-1:1;x=side*.22;y=1.27;
            rx=stride*side*.48;
            if(speaking) {rx=-.38+Math.sin(m.time*2.2+side)*.16;rz=side*(.12+Math.sin(m.time*1.5)*.06);}
            else if(working) {rx=-.55+Math.sin(m.time*2+side*.4)*.28;}
            else {rz=side*(.025+Math.sin(m.time*1.1+side)*.02);}
          } else if(bone.startsWith('forearm')) {
            const side=bone==='forearmL'?-1:1;x=side*.25;y=1.02;
            rx=speaking?-.6+Math.sin(m.time*2.1+side)*.22:working?-.5+Math.sin(m.time*2+side*.4)*.22:-.1;
          } else if(bone.startsWith('leg')) {const side=bone==='legL'?-1:1;x=side*.10;y=.35;rx=-stride*side*.55;}
          joint.makeTranslation(x*s,y*s,0);r.makeRotationFromEuler(new THREE.Euler(rx,ry,rz));joint.multiply(r);t.makeTranslation(-x*s,-y*s,0);joint.multiply(t);
          posing[bone]=joint.clone();
          if(bone.startsWith('forearm'))posing[bone].premultiply(posing[bone==='forearmL'?'armL':'armR']);
      }
      for(const part of a.parts) {
        matrix.copy(root);if(part.bone)matrix.multiply(posing[part.bone]);matrix.multiply(part.bind);if(m.visible===false||a.blenderVisual&&part.bone!=='ground')matrix.scale(hiddenScale);
        if(part.bone==='ground')matrix.elements[13]=m.position[1]+.035*s;
        part.mesh.setMatrixAt(part.index,matrix);touched.add(part.mesh);
      }
    }
    touched.forEach(mesh=>{mesh.instanceMatrix.needsUpdate=true;});
  }
  return { part,box,cyl,ball,beam,wall,paving,person,jar,olive,tent,house,finish,rand,actors,animate,collisionBoxes };

}
function terrain(scene,p,extent,kind,flatRadius = 70) {
  const height = (x,z) => {
    if(kind==='city') {
      const city = 7 + Math.max(0,-x)*.07;
      const valley = x < 110 ? -12+19*Math.pow(Math.max(0,110-x)/65,1.4) : -12+(x-110)*.16;
      const relief=THREE.MathUtils.smoothstep(Math.hypot(x,z),130,260)*(3+Math.sin(x*.025+z*.017)*5+Math.sin(x*.078-z*.049)*1.5);
      return (x<45 ? city+Math.sin(z*.025)*1.4 : Math.min(45,valley)+Math.sin(z*.035)*2) + relief;
    }
    const r=Math.hypot(x,z), edge=THREE.MathUtils.smoothstep(r,flatRadius,flatRadius+85);
    const rugged=7+Math.abs(Math.sin(x*.013+z*.009))*25+Math.sin(x*.045-z*.027)*9+Math.sin(x*.11+z*.089)*2.8+Math.sin(x*.23-z*.15)*.9;
    return edge*rugged + (1-edge)*(-.14+Math.sin(x*.43)*Math.sin(z*.37)*.045);
  };
  const geo=new THREE.PlaneGeometry(extent*4,extent*4,220,220); geo.rotateX(-Math.PI/2);
  const positions=geo.attributes.position, colors=[];
  for(let i=0;i<positions.count;i++) {
    const x=positions.getX(i),z=positions.getZ(i),h=height(x,z); positions.setY(i,h);
    const c=new THREE.Color(kind==='city' || kind==='judea'?'#b2b4a1':'#b9ae99'); const n=Math.sin(x*.8)*Math.sin(z*.65)*.035+Math.sin(x*.1+z*.09)*.06;
    c.offsetHSL(0,0,n); colors.push(c.r,c.g,c.b);
  }
  geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3)); geo.computeVertexNormals();
  const mat=(kind==='city' || kind==='judea' ? material('judean-earth','#ada78f') : p.sand).clone(); mat.vertexColors=true;
  const ground=new THREE.Mesh(geo,mat); ground.receiveShadow=true; scene.add(ground);
  return height;
}
function landscape(k,height,extent,city=false,excluded=[]) {
  for(let i=0;i<180;i++) {
    const a=k.rand()*Math.PI*2,r=55+k.rand()*extent;
    const x=Math.cos(a)*r,z=Math.sin(a)*r,y=height(x,z);
    if(excluded.some(s=>x>s.x1-4&&x<s.x2+4&&z>s.z1-4&&z<s.z2+4))continue;
    if(city&&x>65&&x<140) continue;
    if(city&&i%4===0) k.olive(x,y,z,.6+k.rand());
    else k.ball('darkstone',x,y-.2,z,1+k.rand()*3,.5+k.rand()*1.6,1+k.rand()*2);
  }
  // The far relief is part of the terrain mesh; no spherical "mountain" primitives.

}
function ark(k,x,y,z,s=1) {
  const [w,h,d]=dimensions.tabernacle.ark.map(v=>v*s);
  k.box('gold',x,y+h/2+.16*s,z,w,h,d); k.box('gold',x,y+h+.19*s,z,w+.07*s,.075*s,d+.07*s);
  for(const dz of [-1,1]) k.beam('gold',[x-w*.9,y+.43*s,z+dz*d*.63],[x+w*.9,y+.43*s,z+dz*d*.63],.024*s);
  for(const dx of [-1,1]) { k.ball('gold',x+dx*w*.28,y+h+.4*s,z,.12*s,.24*s,.13*s); k.part('sphere','gold',x+dx*w*.18,y+h+.52*s,z,.44*s,.035*s,.3*s,0,0,dx*.28); }
}
function menorah(k,x,y,z,s=1) {
  k.cyl('gold',x,y+.06*s,z,.25*s,.12*s); k.cyl('gold',x,y+.65*s,z,.035*s,1.2*s);
  for(let side=-1;side<=1;side+=2) for(let branch=1;branch<=3;branch++) {
    const points=[]; for(let i=0;i<=12;i++) { const a=i/12*Math.PI/2; points.push([x+side*Math.sin(a)*branch*.16*s,y+(.52+(1-Math.cos(a))*branch*.16)*s,z]); }
    for(let i=1;i<points.length;i++) k.beam('gold',points[i-1],points[i],.024*s);
    const end=points.at(-1); k.cyl('gold',end[0],y+1.23*s,z,.027*s,(1.23-(end[1]-y)/s)*s*2);
  }
  for(let i=-3;i<=3;i++) { k.part('bowl','gold',x+i*.16*s,y+1.27*s,z,.11*s,.075*s,.11*s); k.ball('gold',x+i*.16*s,y+1.32*s,z,.045*s); }
}
function altar(k,x,y,z,w,h,d,mat='bronze') {
  k.box(mat,x,y+h/2,z,w,h,d); k.box('black',x,y+h+.012,z,w*.85,.025,d*.85);
  for(const dx of [-1,1]) for(const dz of [-1,1]) k.box(mat,x+dx*w*.45,y+h+.08,z+dz*d*.45,w*.08,.23,d*.08);
  for(let i=0;i<5;i++) k.box('wood',x+(i-2)*w*.14,y+h+.06,z,w*.08,.08,d*.65,.45);
}
function tabernacle(k,roof) {
  const dim=dimensions.tabernacle,[l,w]=dim.court, h=dim.screen;
  k.box('court',0,-.06,0,l+.7,.12,w+.7);
  for(const z of [-w/2,w/2]) {
    k.box('linen',0,h/2,z,l,h,.05);
    for(let i=0;i<20;i++) {const x=-l/2+i*l/20; k.cyl('bronze',x,h/2,z,.045,h+.1); k.cyl('silver',x,h+.04,z,.07,.12); k.beam('hide',[x,h*.9,z],[x,.02,z+Math.sign(z)*1.4],.012);}
  }
  k.box('linen',-l/2,h/2,0,.045,h,w);
  for(let i=0;i<10;i++) k.cyl('bronze',-l/2,h/2,-w/2+i*w/10,.045,h+.1);
  for(const side of [-1,1]) k.box('linen',l/2,h/2,side*(w/2+4.5)/2,.045,h,w/2-4.5);
  for(let i=0;i<10;i++){const z=-w/2+i*w/10;if(Math.abs(z)>1.65)k.cyl('bronze',l/2,h/2,z,.045,h+.1);}
  for(const side of [-1,1])for(let i=0;i<6;i++)k.box(['red','blue','purple','linen'][i%4],l/2+.04,h/2,side*(1.65+(i+.5)*.475),.04,h,.465);
  // Twenty boards per long side, silver sockets and five continuous bars.
  for(const side of [-1,1]) for(let i=0;i<20;i++) {
    const x=-15+(i+.5)*.675,z=side*2.25;
    (side===1?roof:k).box('gold',x,2.25,z,.66,4.5,.15);
    for(const dx of [-.17,.17]) k.box('silver',x+dx,.1,z,.23,.2,.26);
  }
  k.box('gold',-15,2.25,0,.15,4.5,4.5);
  for(const side of [-1,1]) for(let i=0;i<5;i++) (side===1?roof:k).box('gold',-8.25,.6+i*.8,side*2.34,13.5,.075,.075);
  k.box('court',-8.25,.015,0,13.5,.025,4.5);
  for(let layer=0;layer<3;layer++) roof.box(['linen','wool','hide'][layer],-8.25,4.53+layer*.055,0,14+layer*.3,.055,4.8+layer*.3);
  for(const side of [-1,1]) roof.box('hide',-8.25,2.9,side*2.53,14.4,3.4,.035);
  for(let x=-14.5;x<-.5;x+=1.25) {
    for(const side of [-1,1]) { roof.beam('hide',[x,4.55,side*2.5],[x,.04,side*4.5],.018); roof.cyl('bronze',x,.06,side*4.5,.03,.18); }
    roof.box('hide',x,4.72,0,.025,.012,5.5);
  }
  k.box('purple',-10.5,.18,0,.05,.36,4.5);
  for(let i=0;i<4;i++) { k.cyl('gold',-10.5,2.25,-1.68+i*1.12,.06,4.5); roof.box(i%2?'purple':'blue',-10.5,2.27,-1.69+i*1.12,.05,4.5,1.13); }
  for(let i=0;i<5;i++) k.cyl('gold',-1.5,2.25,-2.1+i*1.05,.06,4.5);
  for(let i=0;i<6;i++) roof.box(['red','purple','blue'][i%3],-1.45,2.3,-1.875+i*.75,.06,4.5,.75);
  altar(k,12,0,0,...[dim.altar[0],dim.altar[1],dim.altar[2]]);
  // The laver is a separate inspectable object; retain its solid collision proxy.
  k.collisionBoxes.push({min:[3.51,0,-.49],max:[4.49,1.24,.49]});
  menorah(k,-6,0,1.45,1); k.box('gold',-6,.7,-1.45,.9,.07,.45);
  for(const dx of [-.35,.35]) for(const dz of [-.15,.15]) k.box('gold',-6+dx,.34,-1.45+dz,.045,.68,.045);
  for(let i=0;i<12;i++) k.ball('linen',-6+(i%2-.5)*.4,.78+Math.floor(i/2)*.055,-1.45,.28,.055,.28);
  altar(k,-10,0,0,.45,.9,.45,'gold'); ark(k,-12.75,0,0);
  for(let i=0;i<46;i++) {
    const a=i/46*Math.PI*2,r=36+(i%3)*10,x=Math.cos(a)*r,z=Math.sin(a)*r*.8;
    if(!(x>24&&x<45&&Math.abs(z)<12))k.tent(x,0,z,.8+(i%4)*.1); if(i%2===0) k.person(x+3,0,z+3,i,.5);
  }
  for(const [x,z,s] of [[29,3,1],[30,4,1],[27,-2,1],[11,4,0],[3,-4,1]]) k.person(x,0,z,s,Math.PI/2);
  for(let i=0;i<10;i++) k.jar(26+(i%3)*.55,0,-4-Math.floor(i/3)*.7,.5);
  // Beaten-earth teaching paths and two craft tables, with open approaches.
  k.box('path',39,-.015,0,32,.07,6);k.box('path',31,-.015,0,10,.07,23);
  for(const z of [6,-6]){k.box('wood',31,.78,z,2.3,.12,1.1);for(const x of [30.1,31.9])k.box('wood',x,.39,z,.09,.78,.85);}
  for(let i=0;i<5;i++)k.jar(34+i*.65,0,10,.35+(i%2)*.12);
  for(const z of [-18,18]){k.tent(38,0,z,1.1);k.collisionBoxes.push({min:[34.6,-.05,z-2.3],max:[41.4,2.6,z+2.3]});}
  // Thin fabric is excluded from automatic solid boxes; the navigation area handles the screen boundary.

}
function solomon(k,roof,height) {
  const dim=dimensions.solomon,[l,h,w]=dim.house;
  k.paving(3,.3,0,75,50,2.1);
  for(const z of [-25,25]) k.wall(3,.3,z,76,1.5,.65,'x','stone',1.4,.5);
  k.wall(-35,.3,0,50,1.5,.65,'z');
  const west=-19,front=west+l;
  k.box('darkstone',-5.5,.65,0,29,1.3,11);
  // Teaching platform supports the pillars; its footprint and approach stair are conjectural.
  k.box('darkstone',12.25,.65,0,8.5,1.3,10.8);
  k.box('stone',14.1,1.7,0,1.2,.8,1.2);
  k.box('cedar',32,1.02,-12,1.4,.08,1.1);
  for(const x of [31.4,32.6])k.box('cedar',x,.665,-12,.09,.71,.9);
  for(const z of [-w/2,w/2]) (z>0?roof:k).wall(-5.5,1.3,z,l,h,.7,'x','light',1.5,.55);
  k.wall(west,1.3,0,w,h,.8,'z','light',1.5,.55);
  k.box('cedar',-5.5,1.35,0,l,.1,w);
  for(const z of [-4.12,4.12]) (z>0?roof:k).box('gold',-5.5,6.8,z,l,10.9,.06);
  k.box('gold',west+.45,5.8,0,.07,9,8.2);
  k.box('gold',-10,5.8,-3.25,.18,9,2.5); k.box('gold',-10,5.8,3.25,.18,9,2.5);
  roof.box('cedar',-10,5.8,0,.1,9,4);
  roof.box('cedar',-5.5,15,0,28,.5,10.3); roof.box('plaster',-5.5,15.3,0,28,.12,10.3);
  // Three 5-cubit tiers. Floors widen 5 → 6 → 7 cubits; the outer enclosure stays aligned.
  for(const side of [-1,1]) {
    const out=7.85, wallKit=side>0?roof:k, total=dim.chamberHeight*3;
    wallKit.wall(-7,1.3,side*out,25,total,.5,'x','stone',1.25,.45);
    for(let level=0;level<3;level++) {
      const width=dim.chamberWidths[level], y=1.3+level*dim.chamberHeight, center=side*(out-width/2);
      wallKit.box('cedar',-7,y+.08,center,25,.16,width);
      // Masonry offsets form the ledges supporting the wider upper rooms.
      wallKit.box('stone',-7,y+dim.chamberHeight/2,side*(4.5+(out-width-4.5)/2),25,dim.chamberHeight,Math.max(.1,out-width-4.5));
      for(let x=-17;x<6;x+=4) wallKit.box('black',x,y+1.3,side*(out+.26),.4,.55,.035);
    }
    for(const x of [-19.5,5.5]) wallKit.wall(x,1.3,side*6.25,3.2,total,.5,'z','stone',1.25,.45);
    wallKit.box('plaster',-7,1.3+total+.13,side*6.25,26,.25,3.7);
  }
  k.wall(-19.5,1.3,0,16.2,dim.chamberHeight*3,.5,'z','stone');
  for(const z of [-3,3]) k.wall(front,1.3,z,3,13.5,.7,'z','light');
  k.wall(front,6.7,0,3,8.1,.7,'z','light');
  roof.box('cedar',front+.38,3.9,0,.1,5.2,2.8);
  // Porch remains rectangular, with stone walls rather than a Greek pediment.
  for(const z of [-4.5,4.5]) k.wall(front+2.25,1.3,z,4.5,13.5,.7,'x','light');
  roof.box('plaster',front+2.25,15.1,0,4.8,.4,9.7);
  for(const z of [-3.4,3.4]) {
    const x=front+6.2,base=1.3,r=5.4/(2*Math.PI);
    k.cyl('bronze',x,base+dim.pillar/2,z,r,dim.pillar);
    // Capitals are mounted below from the same asset as the teaching close-up.
  }
  // Sea is added below from the same continuous bowl / twelve-ox model as its teaching close-up.
  altar(k,24,.3,-2,9,4.5,9); // 2 Chronicles 4:1; dimensions do not derive from Kings.
  for(let i=0;i<12;i++) k.box('stone',24+(12-i)*.4,.3+(i+1)*.36/2,-2,1,(i+1)*.36,3);
  ark(k,-14,1.4,0,1);
  for(const z of [-2,2]) { k.cyl('gold',-14,3.4,z,.15,4.2); k.part('sphere','gold',-14,5.5,z,1,.8,4.4); }
  for(let i=0;i<10;i++) menorah(k,-4+(i%5)*1.3,1.4,i<5?-2.7:2.7,.8);
  for(let i=0;i<32;i++)k.person(11+(i%8)*3.7,.31,-20+Math.floor(i/8)*12.5,i,2);
  for(let i=0;i<16;i++) {const x=-45-k.rand()*45,z=-70+k.rand()*140,y=height(x,z); k.house(x,y,z,6+k.rand()*3,6,3.2,'stone');}
  for(let i=0;i<18;i++) {const x=45+k.rand()*40,z=-50+k.rand()*100;k.olive(x,height(x,z),z,.7);}
}
function herod(k,roof) {
  const deck=8,upper=10.8;
  k.box('darkstone',0,3.7,0,242,7.4,202);
  for(const z of [-101,101]) k.wall(0,0,z,242,8,1.5,'x','light',3.5,1.1);
  for(const x of [-121,121]) k.wall(x,0,0,202,8,1.5,'z','light',3.5,1.1);
  k.paving(0,deck,0,240,200,4);
  for(let i=0;i<28;i++) k.box('light',68,(i+1)*deck/28/2,129-i*.95,32,(i+1)*deck/28,1);
  // Public colonnades: repeated shafts, bases, capitals, entablatures and a timber/stone roof.
  for(const z of [-90,90]) {
    for(let x=-110;x<=110;x+=6) for(const dz of [-4,4]) {
      const r=.62,h=11.25;k.cyl('light',x,deck+h/2,z+dz,r,h);
      k.box('light',x,deck+.18,z+dz,1.6,.36,1.6);k.box('light',x,deck+h,z+dz,1.6,.5,1.6);
      k.part('bowl','light',x,deck+h+.2,z+dz,1.5,.8,1.5);
      for(let n=0;n<8;n++) {const a=n/8*Math.PI*2;k.part('sphere','light',x+Math.cos(a)*.55,deck+h+.2,z+dz+Math.sin(a)*.55,.23,.65,.18,0,-a);}
    }
    roof.box('cedar',0,deck+11.8,z,227,.45,12); roof.box('light',0,deck+12.2,z,229,.35,13);
  }
  for(const x of [-111,111]) {
    for(let z=-78;z<=78;z+=6) for(const dx of [-4,4]) {k.cyl('light',x+dx,deck+5.625,z,.62,11.25);k.box('light',x+dx,deck+11.25,z,1.6,.5,1.6);}
    roof.box('light',x,deck+12.2,0,13,.35,170);
  }
  // The inner sacred precinct is distinct from the illustrative outer platform's footprint.
  k.paving(-1,upper,0,110,62,2.1);
  for(const z of [-31,31]) k.wall(-1,deck,z,110,6,.85,'x','light',1.5,.6);
  k.wall(-56,deck,0,62,6,.85,'z','light',1.5,.6);
  for(const z of [-20,20]) k.wall(54,deck,z,22,7,.9,'z','light');
  k.box('gold',54,deck+6,0,1,2.4,18); k.box('gold',54,deck+3,-8.2,1,6,1);k.box('gold',54,deck+3,8.2,1,6,1);
  for(let i=0;i<15;i++) k.box('light',55+i*.5,deck+(15-i)*.186/2,0,.52,(15-i)*.186,13);
  k.paving(82,deck,0,49,61,2.4);
  for(const z of [-31,31]) k.wall(83,deck,z,52,3,.65,'x');
  // Low boundary screen (soreg), kept visibly separate from the much taller court walls.
  for(const z of [-43,43]) {
    for(let x=-65;x<108;x+=2.2) k.box('light',x,deck+.65,z,.16,1.3,.22);
    for(const h of [.2,1.25]) k.box('light',20,deck+h,z,176,.12,.28);
  }
  // Sanctuary axis west → east. Broad 100-cubit facade; no Solomon-style paired bronze pillars.
  const facade=dimensions.herod.facade,base=upper;
  k.box('light',-25,base+1,0,46,2,30);
  for(const z of [-13.5,13.5]) (z>0?roof:k).wall(-25,base+2,z,40,29,1,'x','light',2.5,.8);
  k.wall(-45,base+2,0,27,29,1,'z','light',2.5,.8);
  roof.box('light',-25,base+31,0,43,1,29);
  // Tall entrance portal cut out of the front, not a dark rectangle pasted over a solid wall.
  const front=-3,portal=11.25,ph=31.5;
  for(const side of [-1,1]) k.wall(front,base,side*(facade[0]+portal)/4,(facade[0]-portal)/2,facade[1],5,'z','light',2.5,.9);
  k.wall(front,base+ph,0,portal,facade[1]-ph,5,'z','light',2.5,.9);
  for(const side of [-1,1]) k.box('gold',front+2.55,base+ph/2,side*(portal/2+.28),.12,ph,.55);
  k.box('gold',front+2.55,base+ph,0,.12,.75,portal+1.1);
  for(let z=-21;z<=21;z+=1.2) k.cyl('gold',front,base+45.7,z,.055,1.3);
  for(let i=0;i<12;i++) k.box('light',5+i*.8,upper+(12-i)*.18/2,0,.82,(12-i)*.18,30);
  // Interior: an empty most-holy chamber, the curtain and sanctuary furnishings. No ark.
  k.box('gold',-28,base+.15,0,31,.18,9);
  k.box('gold',-41.5,base+9,0,.12,18,9);
  for(const z of [-4.5,4.5]) (z>0?roof:k).box('gold',-28,base+9,z,27,18,.12);
  roof.box('purple',-32.5,base+9,0,.08,18,9);
  roof.box('purple',-10.8,base+9,0,.08,18,9);
  menorah(k,-20,base+.3,2.8,1.3); k.box('gold',-20,base+1,-2.8,1.3,.12,.65); altar(k,-30,base,0,.6,1.3,.6,'gold');
  altar(k,27,upper,0,14.4,4.5,14.4,'light');
  for(let i=0;i<22;i++) k.box('light',27,upper+(i+1)*.2/2,17-i*.43,5,(i+1)*.2,.46);
  // Actual autonomous people stay in the bounded, connected public route.
  for(let i=0;i<24;i++) k.person(57+(i%6)*8,deck,52+Math.floor(i/6)*11,i,0,HUMAN_HEIGHT,{role:'south-visitor'});
  for(let i=0;i<7;i++){const z=108+i*3;k.person(58+(i%3)*4,herodFloor(60,z),z,i,Math.PI,HUMAN_HEIGHT,{role:'south-visitor'});}
  for(let i=0;i<8;i++) k.person(112+(i%2)*4,deck,35-i*11,i,Math.PI,HUMAN_HEIGHT,{role:'east-visitor'});
  for(let i=0;i<9;i++) k.person(23+i*9,deck,-82-(i%2)*8,i,0,HUMAN_HEIGHT,{role:'north-visitor'});
  // A flush teaching landing connects the old illustrative stair to the outer platform.
  k.box('light',68,7.91,101.75,32,.24,2.3);
  for(const x of [51.6,84.4]){k.box('light',x,8.55,101.5,.32,1.1,2.7);}
  // Matching teaching display tables are deliberately separate from sacred furnishings.
  for(const [x,z] of [[94,-60],[81,46.5],[31,-88]]){
    k.box('wood',x,8.86,z,1.35,.1,.8);for(const dx of [-.53,.53])k.box('wood',x+dx,8.44,z,.09,.78,.65);
  }
  for(let i=0;i<9;i++) {k.jar(100,deck,-45+i*.9,.75);k.box('wood',97,deck+.8,-45+i*2.2,1.7,.1,1);}
  // South-side stepped immersion pools are contextual types, not an excavation plan.
  for(const x of [-20,0,20]) {
    k.wall(x,-.1,130,8,1,.5,'x'); k.wall(x,-.1,137,8,1,.5,'x');
    for(let i=0;i<8;i++) k.box('stone',x,-1.2+i*.16,131+i*.65,7,.18,.68);
    k.box('water',x,-1.05,130.5,7,.05,2);
  }
}
function jerusalem(k,roof,height) {
  // Fill the selected public alleys with visible, continuous walking surfaces.
  for(const s of walkSurfaces.filter(s=>!['street','courtyard','entry-stairs'].includes(s.id))) {
    const alongX=s.x2-s.x1>s.z2-s.z1,len=alongX?s.x2-s.x1:s.z2-s.z1,count=Math.ceil(len/.8);
    for(let i=0;i<count;i++) {
      const a=(i+.5)/count,x=alongX?s.x1+a*len:(s.x1+s.x2)/2,z=alongX?(s.z1+s.z2)/2:s.z1+a*len;
      k.box('path',x,walkFloor(x,z)-.045,z,alongX?len/count-.015:s.x2-s.x1,.08,alongX?s.z2-s.z1:len/count-.015);
    }
  }
  // Typological first-century hill-town sector: measured humans and homes, illustrative street plan.
  const pads=[];
  for(let row=0;row<5;row++) for(let col=0;col<5;col++) {
    const x=-66+col*16,z=-51+row*23;
    if(col===3&&row===2) continue;
    const y=8+Math.max(0,-x)*.065;
    k.box('darkstone',x,y-1.4,z,14,2.8,20);
    for(const dz of [-10,10]) k.wall(x,y-1.5,z+dz,14,1.5,.6,'x','darkstone',1.5,.5);
    const h=3.1+(row%2)*.5;
    if(row===3&&col===2) {
      // The selected home has a real courtyard, rooms around it and a removable roof.
      k.paving(x,y,z,13,17,1.1);
      k.house(x-3.9,y,z,4.6,12,h,'stone',roof);k.house(x+3.9,y,z,4.6,12,h,'stone',roof);
      k.house(x,y,z-6.7,12,3.7,h,'stone',roof);
      k.jar(x,y,z+2,.9,'light');k.jar(x+.8,y,z+2,.6);k.person(x-.5,y,z+3.5,1);
      k.box('linen',x,y+2.4,z-1,3,.04,3);
      for(const dx of [-1.4,1.4])k.cyl('wood',x+dx,y+1.2,z+.3,.035,2.4);
    } else {
      k.house(x-2.8,y,z-2,6.6+k.rand(),8.5+k.rand(),h,'stone',null,row>2?Math.PI:0);
      if((row+col)%2===0) k.house(x+4,y,z-3.5,4.5,6,h+2.9,'plaster',null,Math.PI/2);
      k.paving(x+3,y,z+6,5,7,1.1);
      if(col%2===0)k.olive(x+4,y,z+6,.45);
      if(row%2===0)k.person(x+2,y,z+7,col+row,1);
      if(row!==2) { k.wall(x-3.4,y,z+9.7,6.1,1.5,.4,'x','stone',1,.45);
      k.wall(x+4.2,y,z+9.7,4.5,1.5,.4,'x','stone',1,.45);
      k.wall(x+6.7,y,z+4.5,10,1.5,.4,'z','stone',1,.45); }
      if((row+col)%3===0) {k.box('wood',x+3,y+.8,z+7,1.1,.12,.7);k.jar(x+3,y+.9,z+7,.35,'light');}

    }
    pads.push({x,y,z});
  }
  // A second, irregular residential band makes the sector part of a larger town.
  for(let i=0;i<22;i++) {
    const x=-97+(i%6)*15+(i%2)*3.5,z=-77-Math.floor(i/6)*18-(i%3)*2,y=height(x,z);
    k.house(x,y,z,6+(i%3),7,3.2+(i%2)*2.8,'stone',null,(i%4)*Math.PI/2);
  }
  // Primary stepped street runs down the hill; cross alleys break up the urban blocks.
  for(let i=0;i<110;i++) {
    const x=-77+i*.95,y=8+Math.max(0,-x)*.065;
    k.box('stone',x,y-.1,0,.94,.23,5.1);
    if(i%6===0)k.box('darkstone',x,y-.15,3.05,.9,.15,.5);
  }
  for(const z of [-39,-16,30,53]) for(let i=0;i<90;i++) {
    const x=-78+i*1.2,y=8+Math.max(0,-x)*.065;
    k.box('path',x,y-.14,z,1.18,.2,3);
  }
  // Only a generic ancient gate segment, not Jerusalem's Ottoman wall or a named Gospel gate.
  for(const z of [-25,25]) k.wall(30,4,z,44,7,1.5,'z','stone',1.5,.55);
  for(const z of [-5.5,5.5]) k.wall(30,4,z,5.5,9,5,'z','stone',1.5,.55);
  k.box('stone',30,11.5,0,5,1.3,6);
  for(const z of [-2.5,2.5]) k.box('wood',30,6.7,z,.2,5.2,2.3,.35);
  for(let i=0;i<30;i++) {const x=35+i*.72,y=8-i*.28;k.box('stone',x,y-.2,0,.75,.4,4.8);}
  for(let i=0;i<24;i++) {
    const x=59+i*1.4,y=height(x,0); k.box('path',x,y+.06,0,1.5,.13,4);
  }
  for(let i=0;i<50;i++) {const x=144+k.rand()*90,z=-95+k.rand()*190;k.olive(x,height(x,z),z,.7+k.rand()*.55);}
  // Terraced agriculture beyond the valley establishes depth and the eastward rise.
  for(let row=0;row<7;row++) for(let i=0;i<26;i++) {
    const x=145+row*11,z=-100+i*8,y=height(x,z); k.wall(x,y-.6,z,7.8,.6,.5,'z','darkstone',1.3,.3);
  }
  for(let i=0;i<28;i++) {
    const x=-63+k.rand()*85,y=8+Math.max(0,-x)*.065;
    const z=((i%2)*2-1)*(1.2+k.rand()*.8),a=Math.max(-72,x-2),b=Math.min(24,x+3);
    k.person(x,y,z,i,Math.PI/2,HUMAN_HEIGHT,{route:[[a,8+Math.max(0,-a)*.065,z],[b,8+Math.max(0,-b)*.065,z]]});
    if(i%8===0)k.person(x+.8,y,2,i+1,.4,1.1);
  }
  // Contextual water storage: rim, cover slabs and stepped pool, with no medieval well canopy.
  k.cyl('stone',-13,8.8,35,1,.8); k.cyl('black',-13,9.23,35,.65,.03);
  for(let i=0;i<8;i++)k.box('stone',-8,7.8-i*.2,40+i*.45,3,.2,.48);
  k.box('water',-8,6.35,44,3,.04,2.4);
  for(let i=0;i<5;i++) {k.box('wood',-56+i*2.3,12.9,5.2,2,.1,1);k.box('linen',-56+i*2.3,14.4,5.2,2,.04,2);k.cyl('wood',-56+i*2.3,13.6,6,.035,1.6);k.jar(-56+i*2.3,12.1,5.5,.45);}
}
export function createHistoricalScene(id, environment,{segment='all',phase=null,blenderAssets=false,onAssetsReady=()=>{},assetLoader}={}) {
  if(id==='exodus'&&segment!=='all'&&!exodusSegmentById.has(segment))segment='bricks';
  const base=historicalScenes[id];if(!base)return null;const section=id==='exile'?(exileSegmentById.get(segment)||exileSegmentById.get('road')):id==='kingdoms'?(kingdomsSegmentById.get(segment)||kingdomsSegmentById.get('south')):id==='david'?(davidSegmentById.get(segment)||davidSegmentById.get('sheep')):id==='judges'?(ruthSegmentById.get(segment)||ruthSegmentById.get('field')):id==='sinai'?(sinaiSegmentById.get(segment)||sinaiSegmentById.get('manna')):id==='joseph'?(josephSegmentById.get(segment)||josephSegmentById.get('caravan')):id==='abraham'?(abrahamSegmentById.get(segment)||abrahamSegmentById.get('altar')):id==='paul'?(paulSegmentById.get(segment)||paulSegmentById.get('ship')):id==='exodus'?exodusSegmentById.get(segment):id==='second-temple'?(returnSegmentById.get(segment)||returnSegmentById.get('foundation')):null;
  const config=section?{...base,...section}:base;
  const scene=new THREE.Scene(), p=palette();
  const sky=id==='exodus'?'#a5b2b0':'#b4bdb8';
  scene.background=new THREE.Color(sky);scene.fog=new THREE.Fog(sky,config.fogNear??config.extent*1.1,config.fogFar??config.extent*3.1);scene.environment=environment;scene.environmentIntensity=.4;
  const ambient=new THREE.HemisphereLight('#e7e9df','#75624a',1.1);scene.add(ambient);
  const sun=new THREE.DirectionalLight('#fff0d9',2.65);sun.position.set(-55,95,60);sun.castShadow=true;
  const range=config.shadow;Object.assign(sun.shadow.camera,{left:-range,right:range,top:range,bottom:-range,near:1,far:450});
  sun.shadow.mapSize.set(2048,2048);sun.shadow.normalBias=.035;sun.shadow.bias=-.00013;scene.add(sun);
  const roofGroup=new THREE.Group();scene.add(roofGroup);
  const k=builder(scene,p,id.length*113,true,id), roof=builder(roofGroup,p,83,true,id);
  const exileScene=id==='exile'?buildExileScene(k,scene,section.id):null;
  const davidScene=id==='david'?buildDavidScene(k,scene,section.id,{phase,blenderAssets,onReady:assetsChanged,assetLoader}):null;
  const sinaiScene=id==='sinai'?buildSinaiScene(k,scene,section.id):null;
  const abrahamScene=id==='abraham'?buildAbrahamScene(k,scene,section.id,{blenderAssets,onReady:assetsChanged,assetLoader}):null;
  const height=id==='exile'?exileScene.height:id==='kingdoms'?buildKingdomsScene(k,scene,section.id):id==='david'?davidScene.height:id==='judges'?buildRuthScene(k,scene,section.id):id==='sinai'?sinaiScene.height:id==='joseph'?buildJosephScene(k,scene,section.id,{blenderAssets,onReady:assetsChanged,assetLoader}):id==='abraham'?abrahamScene.height:id==='paul'?buildPaulScene(k,scene,section.id,{blenderAssets,onReady:assetsChanged,assetLoader}):id==='second-temple'?buildReturnScene(k,scene,section.id):id==='jordan'?buildJordanScene(k,scene,p):terrain(scene,p,config.extent,id==='jerusalem'?'city':['solomon','herod'].includes(id)?'judea':'desert',id==='herod'?190:id==='exodus'?220:80);if(!['jordan','second-temple','paul','abraham','joseph','sinai','judges','david','kingdoms','exile'].includes(id))landscape(k,height,config.extent,['jerusalem','solomon','herod'].includes(id),id==='exodus'?exodusSegments.flatMap(s=>s.surfaces):[]);
  if(id==='tabernacle')tabernacle(k,roof);
  else if(id==='solomon')solomon(k,roof,height);
  else if(id==='herod')herod(k,roof);
  else if(id==='exodus')buildExodusScene(k,roof,scene,p,segment);
  else if(!['jordan','second-temple','paul','abraham','joseph','sinai','judges','david','kingdoms','exile'].includes(id))jerusalem(k,roof,height);
  const roles=id==='tabernacle'?{weaver:'weaver',priest:'priest','camp-parent':'parent'}:id==='solomon'?{'bronze-worker':'bronze-worker',singer:'singer','temple-visitor':'visitor'}:id==='herod'?{pilgrim:'pilgrim','stone-worker':'stone-worker',listener:'listener'}:id==='exodus'?{'brick-maker':'brick-guide','passover-parent':'departure-parent',traveler:'crossing-guide'}:{};
  for(const person of peopleByIsland[id].filter(p=>!section||p.id===section.person)) k.person(...person.position,person.style,0,HUMAN_HEIGHT,{...person,role:id==='exile'?'exile-resident':id==='kingdoms'?'kingdoms-resident':id==='david'?'david-resident':id==='judges'?'ruth-resident':id==='sinai'?'sinai-resident':id==='joseph'?'joseph-resident':id==='abraham'?'abraham-resident':id==='paul'?'paul-resident':id==='second-temple'?'return-resident':id==='jordan'?(person.id==='jordan-parent'?'west-resident':'east-resident'):roles[person.id]});
  k.finish();roof.finish();
  const people=k.actors.filter(a=>a.id);
  let walkModel=null;const objects=[];
  if(id==='jerusalem') {
    k.collisionBoxes.push(...roof.collisionBoxes);
    // A small public stone stair, separate render treads and a smooth walk collision proxy.
    // This is a typological teaching detail, not an identified archaeological staircase.
    const flight=stairCollisionProxies.find(p=>p.id==='entry-flight'),base=flight.baseHeight;
    function stairStone(name,x,y,z,w,h,d,collision=false) {
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),p.stone);mesh.name=name;mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.collisionProxy='entry-flight';scene.add(mesh);
      if(collision)k.collisionBoxes.push({min:[x-w/2,y-h/2,z-d/2],max:[x+w/2,y+h/2,z+d/2]});
    }
    for(let i=0;i<5;i++){const top=base+(i+1)*.24,bottom=6.8;stairStone(`entry-stair-tread-${i}`,21,(top+bottom)/2,2+(i+.5)*.5,5.2,top-bottom,.505);}
    stairStone('entry-stair-landing',21,(9.225+6.8)/2,6.55,5.2,9.225-6.8,4.1);
    stairStone('entry-stair-back',21,9.55,8.6,5.2,.65,.25,true);
    for(const x of [18.4,23.6])stairStone('entry-stair-parapet',x,9.55,6.6,.25,.65,4.2,true);
    for(const definition of vesselDefinitions){const root=createVessel(definition.id,{blenderAssets,onReady:assetsChanged,assetLoader});root.position.fromArray(definition.position);scene.add(root);objects.push({...definition,root});}
    const table=new THREE.Mesh(new THREE.BoxGeometry(1.1,.08,.6),p.wood);table.position.set(-33.4,10.92,25.6);table.castShadow=true;scene.add(table);
    for(const x of [-33.85,-32.95]) {const leg=new THREE.Mesh(new THREE.BoxGeometry(.07,.7,.45),p.wood);leg.position.set(x,10.56,25.6);scene.add(leg);}
    k.collisionBoxes.push({min:[-33.98,10.21,25.27],max:[-32.82,11.5,25.93]});
    walkModel=createWalkModel(k.collisionBoxes);
  }
  if(id==='tabernacle') {
    // Solid tent footprints and court screens are navigation obstacles even when fabric is thin.
    k.collisionBoxes.push(...roof.collisionBoxes);
    for(const z of [6,-6])k.collisionBoxes.push({min:[29.85,0,z-.55],max:[32.15,1.7,z+.55]});
    for(let i=0;i<46;i++) {
      const a=i/46*Math.PI*2,r=36+(i%3)*10,x=Math.cos(a)*r,z=Math.sin(a)*r*.8,s=.8+(i%4)*.1;
      if(x>24&&x<45&&Math.abs(z)<12)continue;
      k.collisionBoxes.push({min:[x-3*s,-.05,z-2*s],max:[x+3*s,2.3*s,z+2*s]});
    }
    k.collisionBoxes.push({min:[-16,-.05,-5],max:[0,5,5]});
    walkModel=createWalkModel(k.collisionBoxes,tabernacleSurfaces,tabernacleFloor,{proxies:[]});
    for(const definition of tabernacleObjects){
      const root=createVessel(definition.id,{blenderAssets,onReady:assetsChanged,assetLoader});root.position.fromArray(definition.modelPosition||definition.position);scene.add(root);
      objects.push({...definition,root});
    }
  }
  if(id==='solomon') {
    const sea=createVessel('solomon-sea',{blenderAssets,onReady:assetsChanged,assetLoader});sea.scale.setScalar(5);sea.position.set(22,.3,12);scene.add(sea);
    for(const z of [-3.4,3.4]){
      const capital=createVessel('pillar-capital',{blenderAssets,onReady:assetsChanged,assetLoader});capital.name=`solomon-full-capital:${z}`;
      const scale=dimensions.solomon.capital/.60;capital.scale.setScalar(scale);capital.position.set(14.2,1.3+dimensions.solomon.pillar-.20*scale,z);scene.add(capital);
    }
    k.collisionBoxes.push(...roof.collisionBoxes,
      {min:[19.6,.3,9.6],max:[24.4,3.8,14.4]},
      {min:[-22,-.1,-8.3],max:[12.5,16,8.3]}, // Inner building stays observation-only, including in cutaway view.
      {min:[19.5,.3,-6.6],max:[29.5,5,2.6]}, // Ritual altar and its illustrative steps are not a public route.
      {min:[31.25,.3,-12.6],max:[32.75,1.85,-11.4]},
      {min:[13.5,1.3,-.6],max:[14.7,2.95,.6]});
    // Four rendered risers, separate from the continuous collision ramp.
    for(let i=0;i<4;i++) {
      const top=.31+(i+1)*.2475,mesh=new THREE.Mesh(new THREE.BoxGeometry(.5,top,4.4),p.stone);
      mesh.name=`solomon-court-tread-${i}`;mesh.position.set(18.25-i*.5,top/2,0);mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.collisionProxy='solomon-court-flight';scene.add(mesh);
    }
    walkModel=createWalkModel(k.collisionBoxes,solomonSurfaces,solomonFloor,{proxies:solomonProxies});
    for(const definition of solomonObjects){let root=sea;if(!definition.sceneOnly){root=createVessel(definition.id,{blenderAssets,onReady:assetsChanged,assetLoader});root.position.fromArray(definition.position);scene.add(root);}objects.push({...definition,root});}
  }
  if(id==='herod'){
    k.collisionBoxes.push(...roof.collisionBoxes);
    // Rendered risers do not compete with the continuous stair collision proxy.
    const keep=k.collisionBoxes.filter(b=>!(b.min[0]>=51.99&&b.max[0]<=84.01&&b.min[2]>=102.8&&b.max[2]<=129.51));k.collisionBoxes.splice(0,k.collisionBoxes.length,...keep);
    // Cutaway visibility never permits crossing the inner sacred precinct.
    k.collisionBoxes.push({min:[-68,8,-43.4],max:[109,60,43.4]});
    for(const d of herodObjects){const root=createVessel(d.id,{blenderAssets,onReady:assetsChanged,assetLoader});root.position.fromArray(d.position);scene.add(root);objects.push({...d,root});k.collisionBoxes.push({min:[d.position[0]-.73,8,d.position[2]-.46],max:[d.position[0]+.73,10,d.position[2]+.46]});}
    walkModel=createWalkModel(k.collisionBoxes,herodSurfaces,herodFloor,{proxies:herodProxies,navigationStep:.8});
  }
  // Separation may push a city NPC sideways against decorative exterior stairs.
  // Keep authored street journeys on their navigation surface, rather than climbing
  // successive stair edges and blocking the alley at unintended heights.
  if(id==='jerusalem')prepareJerusalemResidents(k.actors,walkModel);
  // Body clearance is independent of the camera's LOD selection.
  const npcOptions=id==='jerusalem'?{pois:jerusalemPOIs,allowRetreat:true,allowedPosition:(a,p)=>jerusalemAllowed(a,p,walkModel)}:id==='tabernacle'?{pois:tabernaclePOIs,seed:35026,spawnCandidates:tabernacleSpawnCandidates,allowedPosition:tabernacleAllowed,spawnExclusion:[26,0,0]}:id==='solomon'?{pois:solomonPOIs,seed:10726,spawnCandidates:solomonSpawnCandidates,allowedPosition:solomonAllowed,spawnExclusion:solomonSpawn}:id==='herod'?{pois:herodPOIs,seed:55026,spawnCandidates:herodSpawnCandidates,allowedPosition:herodAllowed,spawnExclusion:herodSpawn}:null;
  let npcSystem=npcOptions?createNPCSystem({actors:k.actors,model:walkModel,...npcOptions}):null;
  if(id==='exodus'){const exploration=attachExodusExploration(scene,k,roof,segment,{blenderAssets,onReady:assetsChanged,assetLoader});walkModel=exploration.walkModel;npcSystem=exploration.npcSystem;objects.push(...exploration.objects);}
  if(id==='jordan'){const exploration=attachJordanExploration(scene,k,{blenderAssets,onReady:assetsChanged,assetLoader});walkModel=exploration.walkModel;npcSystem=exploration.npcSystem;objects.push(...exploration.objects);}
  if(id==='second-temple'){const exploration=attachReturnExploration(scene,k,section.id,{blenderAssets,onReady:assetsChanged,assetLoader});walkModel=exploration.walkModel;npcSystem=exploration.npcSystem;objects.push(...exploration.objects);}
  if(id==='exile'){const exploration=attachExileExploration(scene,k,section.id,{blenderAssets,onReady:assetsChanged,assetLoader});walkModel=exploration.walkModel;npcSystem=exploration.npcSystem;objects.push(...exploration.objects);}
  if(id==='kingdoms'){const exploration=attachKingdomsExploration(scene,k,section.id,{blenderAssets,onReady:assetsChanged,assetLoader});walkModel=exploration.walkModel;npcSystem=exploration.npcSystem;objects.push(...exploration.objects);}
  if(id==='david'){const exploration=attachDavidExploration(scene,k,section.id,{phase,blenderAssets,onReady:assetsChanged,assetLoader});walkModel=exploration.walkModel;npcSystem=exploration.npcSystem;objects.push(...exploration.objects);}
  if(id==='judges'){const exploration=attachRuthExploration(scene,k,section.id,{blenderAssets,onReady:assetsChanged,assetLoader});walkModel=exploration.walkModel;npcSystem=exploration.npcSystem;objects.push(...exploration.objects);}
  if(id==='sinai'){const exploration=attachSinaiExploration(scene,k,section.id,{blenderAssets,onReady:assetsChanged,assetLoader});walkModel=exploration.walkModel;npcSystem=exploration.npcSystem;objects.push(...exploration.objects);}
  if(id==='joseph'){const exploration=attachJosephExploration(scene,k,section.id,{blenderAssets,onReady:assetsChanged,assetLoader});walkModel=exploration.walkModel;npcSystem=exploration.npcSystem;objects.push(...exploration.objects);}
  if(id==='abraham'){const exploration=attachAbrahamExploration(scene,k,section.id,{blenderAssets,onReady:assetsChanged,assetLoader});walkModel=exploration.walkModel;npcSystem=exploration.npcSystem;objects.push(...exploration.objects);}
  if(id==='paul'){const exploration=attachPaulExploration(scene,k,section.id,{blenderAssets,onReady:assetsChanged,assetLoader});walkModel=exploration.walkModel;npcSystem=exploration.npcSystem;objects.push(...exploration.objects);}
  const detailedResidents=blenderAssets?mountBlenderResidents(scene,k.actors,onAssetsReady,{assetLoader,groundAt:id==='exodus'?exodusFloor:(x,z)=>walkModel.heightAt(x,z)}):null;
  // Moving contact shadows are separate from the cached architectural shadow map.
  k.animate(0,null);
  const occluders=[];
  function refreshOccluders(){occluders.length=0;scene.updateMatrixWorld(true);scene.traverseVisible(o=>{if(o.isMesh&&!o.userData.people)occluders.push(o);});}
  function assetsChanged(){refreshOccluders();onAssetsReady();}
  refreshOccluders();
  const sight=new THREE.Raycaster();
  function conversationOffset(actor) {
    const origin=new THREE.Vector3(...actor.state.position).add(new THREE.Vector3(0,1.1,0));
    let best=null,clearance=-1;
    for(const [x,y,z] of [[-2.4,1.1,4.2],[2.4,1.1,4.2],[-4.2,1.1,-2.4],[4.2,1.1,-2.4],[-4.2,1.1,2.4],[4.2,1.1,2.4],[2.4,1.1,-4.2],[-2.4,1.1,-4.2],[0,3.5,5]]) {
      const offset=new THREE.Vector3(x,y,z),length=offset.length();
      const meshes=occluders.filter(o=>{let p=o;while(p){if(!p.visible)return false;p=p.parent;}return true;});
      sight.set(origin,offset.clone().normalize());sight.far=length+.5;
      const hit=sight.intersectObjects(meshes,false)[0],free=hit?.distance??length+.5;
      if(free>length+.3)return offset;
      if(free>clearance){clearance=free;best=offset;}
    }
    return best;
  }
  return {
    scene,roof:roofGroup,config,people,conversationOffset,walkModel,objects,occluders,npcSystem,detailedResidents,segment:section?.id||null,phase:id==='david'&&section.id==='ark'?normalizeDavidPhase(phase):null,flock:davidScene?.flock,exploration:explorationFor(id,section?.id,phase),
    animate(dt,cameraPosition,playerPosition=null,isVisible=()=>true) {exileScene?.animate(dt);davidScene?.flock?.update(dt);if(sinaiScene)sinaiScene.animate(dt,cameraPosition);if(abrahamScene)animateAbrahamAnimals(abrahamScene.animals,dt);npcSystem?.update(dt,{camera:cameraPosition,player:playerPosition,isVisible});detailedResidents?.update(cameraPosition,dt);k.animate(dt,cameraPosition);},
    updateRaycastBounds(){scene.traverse(o=>{if(o.isInstancedMesh&&o.userData.people)o.computeBoundingSphere();});},
    converse(personId) { people.forEach(a=>a.state.talking=a.id===personId); },
    attend(personId) {people.forEach(a=>a.state.attending=a.id===personId);},
    groundHeight(x,z) { return Math.max(height(x,z),id==='herod' && Math.abs(x)<121 && Math.abs(z)<101 ? 8 : -.14); },
    setTime(night) {ambient.intensity=night?.55:1.1;sun.intensity=night?.75:2.65;sun.color.set(night?'#a9bdd5':'#fff0d9');scene.background.set(night?'#394650':sky);scene.fog.color.copy(scene.background);},
    dispose() {exileScene?.dispose();davidScene?.flock?.dispose();npcSystem?.dispose();detailedResidents?.dispose();scene.traverse(o=>{o.userData.releaseBlender?.();if(o.isInstancedMesh)o.dispose();if(o.geometry&&!o.userData.blenderShared&&!Object.values(G).includes(o.geometry))o.geometry.dispose();});sun.shadow.dispose();},
  };
}
