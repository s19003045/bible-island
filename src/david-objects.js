import * as THREE from 'three';
import {setDavidArtifactPhase} from './artifact-phases.js';
// Local loading fallback. The blue supports belong to modern teaching diagrams.
export function createDavidObject(id,phase='cart'){
 const root=new THREE.Group(),stone=new THREE.MeshStandardMaterial({color:'#a29579',roughness:1}),wood=new THREE.MeshStandardMaterial({color:'#8e6c46',roughness:1}),cloth=new THREE.MeshStandardMaterial({color:'#b6b6a0',roughness:1}),guide=new THREE.MeshStandardMaterial({color:'#477f7d',roughness:1});
 const box=(parent,x,y,z,w,h,d,mat=stone)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);parent.add(m);return m;};
 const base=parent=>box(parent,0,.015,0,1.3,.03,.9);
 const covered=(parent,y,poles=false)=>{box(parent,0,y+.13,0,.53,.26,.32,cloth);if(poles)for(const z of [-.2,.2]){const pole=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,1.1,12),wood);pole.rotation.z=Math.PI/2;pole.position.set(0,y+.04,z);parent.add(pole);}};
 if(id==='david-shepherd'){
  base(root);const sheep=new THREE.Mesh(new THREE.SphereGeometry(1,20,12),cloth);sheep.scale.set(.26,.15,.14);sheep.position.set(-.26,.32,0);root.add(sheep);for(const x of [-.43,-.08])for(const z of [-.09,.09])box(root,x,.14,z,.035,.23,.035,cloth);box(root,.01,.34,0,.13,.13,.09,cloth);
  const horn=new THREE.Mesh(new THREE.LatheGeometry([[0,0],[.015,.03],[.065,.19],[.08,.26],[.069,.26],[.05,.19],[.008,.04],[0,.03]].map(p=>new THREE.Vector2(...p)),24),wood);horn.position.set(.4,.04,0);horn.rotation.z=-.25;root.add(horn);
 }else if(id==='david-city'){
  base(root);for(let i=0;i<8;i++)box(root,-.38+(i%3)*.16,.08+Math.floor(i/3)*.05,-.2,.14,.13,.15);for(const x of [.13,.45])box(root,x,.1,.12,.17,.18,.2);const layer=new THREE.Group();layer.name='david-city-timber-layer';root.add(layer);box(layer,.28,.24,.12,.6,.08,.12,wood);box(layer,.28,.32,.12,.12,.08,.5,wood);
 }else{
  for(const moment of ['cart','pause','carry','tent']){
   const g=new THREE.Group();g.name='david-ark-phase-'+moment;root.add(g);base(g);
   if(moment==='cart'){box(g,0,.17,0,.9,.07,.48,wood);for(const z of [-.31,.31]){const w=new THREE.Mesh(new THREE.TorusGeometry(.14,.018,8,24),wood);w.position.set(0,.17,z);g.add(w);}covered(g,.21);}
   if(moment==='pause'){for(const x of [-.42,.42])box(g,x,.25,0,.04,.45,.55);box(g,0,.25,-.3,.88,.45,.04);box(g,0,.05,0,.65,.04,.45,guide);covered(g,.07);}
   if(moment==='carry'){for(const x of [-.47,.47])for(const z of [-.2,.2])box(g,x,.12,z,.015,.19,.015,guide);covered(g,.17,true);}
   if(moment==='tent'){for(const x of [-.5,.5])box(g,x,.26,-.03,.02,.5,.7,cloth);box(g,0,.26,-.38,1,.5,.02,cloth);for(const side of [-1,1]){const roof=box(g,side*.25,.55,0,.57,.02,.8,cloth);roof.rotation.z=side*-.4;}covered(g,.04,true);}
  }
  setDavidArtifactPhase(root,phase);
 }
 root.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;o.userData.objectId=id;}});return root;
}
