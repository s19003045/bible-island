import * as THREE from 'three';
// Loading/error fallback for the same modern comparisons and movable layers.
export function createExileObject(id){
 const root=new THREE.Group(),wood=new THREE.MeshStandardMaterial({color:'#9e8259',roughness:.9}),soil=new THREE.MeshStandardMaterial({color:'#917456',roughness:1}),wall=new THREE.MeshStandardMaterial({color:'#b09c78',roughness:1}),teal=new THREE.MeshStandardMaterial({color:'#4f8086',roughness:.8}),water=new THREE.MeshStandardMaterial({color:'#3e747a',roughness:.25}),leaf=new THREE.MeshStandardMaterial({color:'#677849',roughness:1});
 const group=(parent,name)=>{const g=new THREE.Group();g.name=name;parent.add(g);return g;};
 function box(p,x,y,z,w,h,d,m=wood){const q=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);q.position.set(x,y,z);p.add(q);return q;}
 function shell(p,x,y,z,w,d,h,t,m=wood){box(p,x,y+t/2,z,w,t,d,m);for(const side of [-1,1]){box(p,x+side*(w-t)/2,y+h/2,z,t,h,d,m);box(p,x,y+h/2,z+side*(d-t)/2,w-2*t,h,t,m);}}
 if(id==='exile-sequence'){
  box(root,0,.015,0,1.2,.03,.9);const layer=group(root,'exile-sequence-modern-event-layer');for(let i=0;i<4;i++){const x=-.43+(i%2)*.58,z=-.22+Math.floor(i/2)*.44;shell(root,x,.03,z,.5,.36,.075,.018);box(layer,x,.061,z,.454,.018,.314,teal);const marker=new THREE.Mesh(new THREE.CylinderGeometry(.04+i*.005,.04+i*.005,.018,16),i%2?wood:wall);marker.position.set(x,.079,z);layer.add(marker);}
 }else if(id==='exile-waterbank'){
  box(root,0,.04,0,1.2,.08,.75,soil);box(root,0,.16,-.27,1.2,.24,.21,soil);const cut=group(root,'exile-waterbank-modern-cutaway-layer');box(cut,0,.16,.27,1.2,.24,.21,soil);box(root,0,.115,0,1.16,.07,.30,water);
 }else{
  box(root,0,.02,0,1.2,.04,.9,soil);box(root,-.25,.065,-.03,.62,.05,.65,wall);box(root,-.25,.29,-.34,.62,.42,.04,wall);for(const side of [-1,1])box(root,-.25+side*.29,.29,-.03,.04,.42,.65,wall);for(const [x,w] of [[-.45,.22],[-.05,.18]])box(root,x,.29,.28,w,.42,.04,wall);box(root,-.25,.465,.28,.2,.07,.04,wall);const roof=group(root,'exile-dwelling-roof-layer');box(roof,-.25,.53,-.03,.7,.04,.72,wood);shell(root,.35,.04,-.08,.4,.65,.07,.025,soil);for(const z of [-.25,.1]){box(root,.35,.22,z,.024,.3,.024);const crown=new THREE.Mesh(new THREE.SphereGeometry(.1,12,8),leaf);crown.position.set(.35,.4,z);root.add(crown);}box(root,.37,.065,.35,.3,.012,.13,teal);
 }
 root.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;o.userData.objectId=id;}});return root;
}
