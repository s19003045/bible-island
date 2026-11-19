import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from 'three';
import {geometryLoader} from './helpers/load-gltf-geometry.js';
import {blenderModels} from '../src/blender-manifest.js';
import {createResidentInstance} from '../src/blender-assets.js';
import {createMotionCourse} from '../src/motion-course.js';
import {handSurfacePoints,localSurfaceContacts,closedSurfaceComponents} from './helpers/hand-surfaces.js';
import {articulatedFootPoints,sampleVertices} from './helpers/human-geometry.js';

const roles=['resident','carrier','elder'],cache=new Map();
async function asset(role){
  if(!cache.has(role)){
    const d=blenderModels['jerusalem-life-'+role];assert.ok(d,'life pilot must be integrated');
    const b=await readFile(new URL('../public/'+d.src,import.meta.url));cache.set(role,await geometryLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),''));
  }
  return cache.get(role);
}
const actor=role=>({id:{resident:'householder',carrier:'water-carrier',elder:'street-vendor'}[role],modelId:'jerusalem-life-'+role,motionProfile:role,scale:1.71/1.7,
  state:{position:[0,0,0],yaw:0,time:0,walkDistance:0,stride:0,visible:true,idleAction:'Idle'}});

test('carrier working fingers stay outside the actual closed jug and dipper handles',async()=>{
  const a=actor('carrier'),instance=createResidentInstance(await asset('carrier'),a),root=instance.root;
  const points=handSurfacePoints(root),dipper=root.getObjectByName('carrier-dipper'),components=closedSurfaceComponents(dipper.geometry);
  assert.equal(components.length,1,'extract the closed handle, excluding the open bowl');
  for(const [clip,progresses,target,side] of [
    ['SetDown',[.4,.7],'carrier-jug-handle','R'],['PickUp',[.3,.6],'carrier-jug-handle','R'],
    ['Fill',[.2,.6,.8],'carrier-dipper','L'],['Pour',[.4,.6],'carrier-jug-handle','R'],
  ])for(const progress of progresses){
    a.state.activity={clip,progress,aligning:false,paused:false};a.state.time+=.1;instance.update(.1);
    const mesh=root.getObjectByName(target),rows=localSurfaceContacts(root,mesh,points.filter(p=>p[2].includes(side)),target==='carrier-dipper'?components[0]:mesh.geometry.index,{closedSolid:true});
    for(const [name,row] of Object.entries(rows))assert.ok(row.penetration<=.0005,`${clip}/${progress}/${name} handle penetration ${row.penetration}`);
    assert.ok(rows['thumb'+side].gap<.004,`${clip}/${progress} thumb must support the handle`);
    assert.ok(Object.entries(rows).some(([name,row])=>name.startsWith('finger')&&row.gap<.004),`${clip}/${progress} fingers must actually hold the handle`);
  }
  instance.dispose();
});

test('three real life exports contain distinct transition, stair and role work clips with articulated hands',async()=>{
  const common=['StartWalkL','StartWalkR','StopWalkL','StopWalkR','TurnLeft45','TurnRight45','TurnLeft90','TurnRight90','TurnLeft180','TurnRight180','StairUp','StairDown','Listen'];
  for(const role of roles){
    const gltf=await asset(role),d=blenderModels['jerusalem-life-'+role],names=gltf.animations.map(c=>c.name);
    for(const name of [...common,...({resident:['Receive','CarrySmall','PlaceSmall'],carrier:['SetDown','Fill','PickUp','Pour'],elder:['Arrange','Offer']}[role])]){
      assert.ok(names.includes(name),role+' '+name);const c=gltf.animations.find(c=>c.name===name);assert.ok(Math.abs(c.duration-d.lifeClips[name].duration)<1/60);
      assert.ok(c.tracks.length>0);assert.ok(d.lifeClips[name].contacts.L.length&&d.lifeClips[name].contacts.R.length);
    }
    for(const side of ['L','R'])for(const name of ['arm','forearm','hand','handGrip','thumb'])assert.ok(gltf.scene.getObjectByName(name+side+(name==='thumb'?'A':'')),role+' articulated '+name+side);
    if(role==='resident')for(const bone of d.carryBones)assert.ok(!/^(root|hips|thigh|shin|foot|toe)/.test(bone),'carry overlay mask cannot replace walking legs');
  }
});

test('actual work poses keep hand contacts and props steady when dialogue interrupts a grounded activity',async()=>{
  for(const role of roles){
    const a=actor(role),gltf=await asset(role),d=blenderModels[a.modelId],instance=createResidentInstance(gltf,a),root=instance.root;
    for(const [clip,contacts] of Object.entries(d.handContacts).filter(([name,c])=>c.length&&!d.lifeClips[name].loop)){
      for(const u of [.2,.4,.6,.8]){
        a.state.activity={clip,progress:u,aligning:false,paused:false};a.state.time+=.1;instance.update(.1);
        for(const result of root.userData.handContacts){assert.ok(result.error<.012,`${role}/${clip}/${u} hand gap ${result.error}`);assert.ok(result.wristAngle<.70,`${role}/${clip}/${u} wrist angle ${result.wristAngle}`);}
        const propNames=[...new Set(contacts.map(c=>c.targetSocket))],positions=propNames.map(n=>root.getObjectByName(n).getWorldPosition(new THREE.Vector3()));
        a.state.talking=true;a.state.dialogueCue={mode:'speaking',vocal:true};a.state.activity.paused=true;
        for(let i=0;i<10;i++){a.state.time+=.05;instance.update(.05,{camera:[2,1.6,3]});}
        for(const [i,n] of propNames.entries())assert.ok(root.getObjectByName(n).getWorldPosition(new THREE.Vector3()).distanceTo(positions[i])<.0001,`${role}/${clip}/${u}/${n} dialogue prop drift ${root.getObjectByName(n).getWorldPosition(new THREE.Vector3()).distanceTo(positions[i])}`);
        for(const result of root.userData.handContacts)assert.ok(result.error<.012,role+' interrupted hand gap '+result.error);
        a.state.talking=false;delete a.state.dialogueCue;
      }
    }
    instance.dispose();
  }
});

test('distance-driven life gait keeps real foot surfaces above flat and sloping ground',async()=>{
  for(const role of roles)for(const slope of [0,.2,-.2]){
    const a=actor(role),d=blenderModels[a.modelId],ground=(_x,z)=>slope*z,instance=createResidentInstance(await asset(role),a,0,{groundAt:ground});
    const feet=['L','R'].map(side=>articulatedFootPoints(instance.root,side));assert.ok(feet.every(p=>p.length>20));
    a.state.behavior={state:'travel',startAge:1,motionIntent:{remaining:8,slope},desiredYaw:0};
    for(let i=0;i<90;i++){
      const z=i*d.cycleDistance/60;a.state.position=[0,ground(0,z),z];a.state.walkDistance=z;a.state.time=i*d.walkDuration/60;
      instance.update(d.walkDuration/60);
      for(const points of feet){const low=Math.min(...sampleVertices(instance.root,points).map(p=>p.y-ground(p.x,p.z)));assert.ok(low>-.002,`${role} slope ${slope} sole penetration ${low}`);}
    }
    instance.dispose();
  }
});


test('actual held props keep both contact and wrist alignment through travel, stairs, turns and interruptions',async()=>{
  for(const role of ['carrier','resident'])for(const scenario of ['turn','stairs','talk']){
    const a={...actor(role),id:'motion-observer'},course=createMotionCourse(a,scenario),instance=createResidentInstance(await asset(role),a,0,{groundAt:course.footFloor});
    if(role==='resident')a.state.carriedItem={id:'parcel',clip:'CarrySmall'};
    let checked=0;const seen=new Set();
    for(let frame=0;frame<1800;frame++){
      course.update(1/60);instance.update(1/60,{camera:[1.5,1.6,0]});seen.add(instance.root.userData.locomotion);
      for(const r of instance.root.userData.handContacts){checked++;assert.ok(r.error<.012,`${role}/${scenario}/${instance.root.userData.locomotion}/${frame} grip gap ${r.error}`);assert.ok(r.wristAngle<.70,`${role}/${scenario}/${frame} wrist ${r.wristAngle}`);}
    }
    assert.ok(checked>1000);assert.ok(seen.has('Walk'),role+'/'+scenario+' '+[...seen].join(','));if(scenario==='stairs')assert.ok(seen.has('StairUp')&&seen.has('StairDown'));if(scenario==='talk')assert.ok(seen.has('Talk')||seen.has('Listen'));
    instance.dispose();course.dispose();
  }
});


test('carrying overlay preserves actual palm and digit surfaces against the parcel after stair grounding',async()=>{
  const a={...actor('resident'),id:'motion-observer'},course=createMotionCourse(a,'stairs'),instance=createResidentInstance(await asset('resident'),a,0,{groundAt:course.footFloor});
  a.state.carriedItem={id:'parcel',clip:'CarrySmall'};
  const root=instance.root,prop=root.getObjectByName('household-parcel'),points=handSurfacePoints(root);assert.ok(points.length>4000);
  for(let frame=0;frame<=510;frame++){
    course.update(1/60);instance.update(1/60);if(![150,270,390,510].includes(frame))continue;
    const rows=localSurfaceContacts(root,prop,points);
    for(const [name,row] of Object.entries(rows))assert.ok(row.penetration<=.0005,`${frame} ${name} penetrates parcel ${row.penetration}`);
    for(const side of ['L','R']){assert.ok(rows['thumb'+side].gap<.002,'thumb supports parcel');assert.ok(rows['hand'+side].gap<.004,'palm remains close to parcel');}
  }
  instance.dispose();course.dispose();
});
