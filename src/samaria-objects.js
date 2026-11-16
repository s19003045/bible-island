import * as THREE from 'three';
// Loading/error geometry; accepted Blender teaching objects replace these on readiness.
export function createSamariaObject(id){
 const root=new THREE.Group(),base=new THREE.MeshStandardMaterial({color:'#b6b1a3',roughness:1}),clay=new THREE.MeshStandardMaterial({color:'#a47758',roughness:.96}),earth=new THREE.MeshStandardMaterial({color:'#ac9777',roughness:1}),metal=new THREE.MeshStandardMaterial({color:'#a7a69a',roughness:.5,metalness:.65}),cloth=new THREE.MeshStandardMaterial({color:'#c1b99f',roughness:1});
 const mesh=(g,m,x=0,y=0,z=0,p=root)=>{const o=new THREE.Mesh(g,m);o.position.set(x,y,z);p.add(o);return o;},box=(x,y,z,w,h,d,m=base,p=root)=>mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z,p);
 function container(x,z,h,r,foot,p=root,cut=false){
  const points=[[0,0],[foot,0],[foot,.014],[r*.83,h*.19],[r,h*.47],[r*.94,h*.66],[r*.66,h*.84],[r*.58,h],[r*.58-.012,h],[r*.66-.014,h*.84],[r*.94-.014,h*.66],[r-.014,h*.47],[r*.83-.014,h*.19],[foot-.016,.025],[0,.025]];
  const lathe=new THREE.LatheGeometry(points.map(p=>new THREE.Vector2(...p)),72,cut?Math.PI/2:0,cut?Math.PI:Math.PI*2);const o=mesh(lathe,clay,x,.025,z,p);
  if(cut){const shape=new THREE.Shape(points.map(([r,y])=>new THREE.Vector2(r,y)));for(const sign of [-1,1]){const cap=new THREE.ShapeGeometry(shape);cap.scale(sign,1,1);if(sign<0){const idx=cap.index;for(let i=0;i<idx.count;i+=3){const a=idx.getX(i);idx.setX(i,idx.getX(i+2));idx.setX(i+2,a);}cap.computeVertexNormals();}mesh(cap,clay,x,.025,z,p);}}
  return o;
 }
 if(id==='samaria-jar'){
  box(0,.0125,0,1.05,.025,.72);const front=new THREE.Group();front.name='samaria-jar-modern-front-section';root.add(front);
  // Lathe angles pi/2..3pi/2 form rear Z<=0; rotation yields the matching front half.
  container(-.12,0,.36,.155,.09,root,true);const frontMesh=container(.12,0,.36,.155,.09,front,true);frontMesh.rotation.y=Math.PI;frontMesh.position.x=-.12;
  // Caps belong to their corresponding half; front copies are rotated as a complete group.
  front.children.forEach(o=>{if(o===frontMesh)return;o.position.x=-.12;o.rotation.y=Math.PI;});
  const handle=mesh(new THREE.TorusGeometry(.073,.008,10,48),clay,-.12,.22,-.16);handle.rotation.y=Math.PI/2;
 }else if(id==='samaria-road'){
  box(0,.0125,0,1.1,.025,.72);const shape=new THREE.Shape([[-.55,.025],[.55,.025],[.55,.08],[-.55,.30]].map(p=>new THREE.Vector2(...p))),g=new THREE.ExtrudeGeometry(shape,{depth:.72,bevelEnabled:false});g.translate(0,0,-.36);mesh(g,earth);
  const normal=new THREE.Vector3(.2,1,0).normalize();for(const [x,z] of [[-.30,.18],[0,-.16],[.30,.02]]){const p=new THREE.Vector3(x,.19-.2*x,z).addScaledVector(normal,.007),o=mesh(new THREE.CylinderGeometry(.025,.025,.014,40),metal,...p.toArray());o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),normal);}
 }else{
  box(0,.0125,0,1.1,.025,.75);box(0,.034,.17,.62,.018,.33);for(const x of [-.3025,.3025])box(x,.0555,.17,.015,.025,.33);for(const z of [.0125,.3275])box(0,.0555,z,.59,.025,.015);
  for(const x of [-.14,.14])mesh(new THREE.CylinderGeometry(.05,.05,.01,48),metal,x,.048,.17);
  container(-.35,-.185,.2,.065,.03);container(-.12,-.185,.235,.075,.035);box(.29,.0425,-.185,.28,.035,.2,cloth);
 }
 root.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;o.userData.objectId=id;}});return root;
}
