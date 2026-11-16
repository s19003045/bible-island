import * as THREE from 'three';
// Loading/error fallback. Semantic layers match the authored Blender comparisons.
export function createKingdomsObject(id){
 const root=new THREE.Group(),wood=new THREE.MeshStandardMaterial({color:'#b59b72',roughness:.8}),stone=new THREE.MeshStandardMaterial({color:'#c6c5b7',roughness:.95}),gold=new THREE.MeshStandardMaterial({color:'#bb9a4e',metalness:.5,roughness:.55}),clay=new THREE.MeshStandardMaterial({color:'#9f7b58',roughness:.9}),glass=new THREE.MeshStandardMaterial({color:'#8ba6a5',transparent:true,opacity:.45});
 const group=(parent,name)=>{const g=new THREE.Group();g.name=name;parent.add(g);return g;};
 function box(p,x,y,z,w,h,d,m=wood){const q=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);q.position.set(x,y,z);p.add(q);return q;}
 function ball(p,x,y,z,w,h,d,m){const q=new THREE.Mesh(new THREE.SphereGeometry(1,16,10),m);q.position.set(x,y,z);q.scale.set(w,h,d);p.add(q);return q;}
 function beam(p,a,b,r,m=wood){const v=new THREE.Vector3(...b).sub(new THREE.Vector3(...a)),q=new THREE.Mesh(new THREE.CylinderGeometry(r,r,v.length(),8),m);q.position.copy(new THREE.Vector3(...a).addScaledVector(v,.5));q.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());p.add(q);}
 function bowl(p,x,y,z,r,h,m){const q=new THREE.Mesh(new THREE.LatheGeometry([[0,0],[r*.6,0],[r,h],[r-.012,h],[r*.6-.012,.02],[0,.02]].map(v=>new THREE.Vector2(...v)),32),m);q.position.set(x,y,z);p.add(q);return q;}
 if(id==='kingdom-assembly'){
  box(root,0,.014,0,1.3,.028,.9);for(const z of [-.43,.43])box(root,0,.045,z,1.3,.062,.04);for(const x of [-.63,.63])box(root,x,.045,0,.04,.062,.82);
  for(let i=0;i<4;i++){const x=-.45+i*.3;box(root,x,.05,0,.24,.02,.23,stone);}
  const date=group(root,'kingdom-assembly-modern-date-layer');for(let i=0;i<3;i++){box(date,-.4+i*.4,.05,.3,.3,.015,.14,glass);ball(date,-.4+i*.4,.075,.3,.032,.012,.032,stone);}
  for(const x of [-.4,.4])box(root,x,.13,-.3,.3,.15,.025,stone);
 }else if(id==='kingdom-sites'){
  const modern=group(root,'kingdom-sites-modern-comparison-layer');for(const [i,x] of [-.37,.37].entries()){const base=group(root,`kingdom-sites-${i}-separate-base`);box(base,x,.025,0,.56,.05,.86,stone);box(modern,x,.2,-.29,.47,.28,.015,glass);const calf=group(root,`kingdom-sites-${i}-calf`);ball(calf,x,.31,0,.15,.115,.23,gold);ball(calf,x,.35,.23,.09,.08,.11,gold);ball(calf,x,.32,.30,.09,.04,.05,gold);for(const dx of [-.1,.1])for(const dz of [-.14,.14]){beam(calf,[x+dx,.27,dz],[x+dx,.075,dz],.024,gold);for(const toe of [-.013,.013])ball(calf,x+dx+toe,.075,dz+.015,.013,.025,.035,gold);}}
 }else{
  box(root,0,.015,0,1.3,.03,.9,stone);const gate=group(root,'kingdom-measures-public-gate');for(const x of [-.43,-.02])for(let i=0;i<5;i++)ball(gate,x,.09+i*.11,-.28,.068,.059,.075,stone);box(gate,-.225,.64,-.28,.62,.08,.16,stone);
  const extension=group(root,'kingdom-measures-amos8-extension');bowl(extension,-.43,.03,.15,.14,.25,clay);box(extension,.31,.055,.1,.46,.05,.48);beam(extension,[.31,.08,.1],[.31,.56,.1],.018);beam(extension,[.04,.54,.1],[.58,.54,.1],.015);
  for(const x of [.07,.55]){bowl(extension,x,.27,.1,.10,.04,gold);for(let i=0;i<3;i++){const a=i*Math.PI*2/3;beam(extension,[x,.54,.1],[x+Math.cos(a)*.09,.31,.1+Math.sin(a)*.09],.0025);}}
  for(let i=0;i<3;i++)ball(extension,-.07+i*.09,.055,.36,.025,.025+i*.008,.025,stone);
  const modern=group(extension,'kingdom-measures-modern-capacity-layer');bowl(modern,-.43,.28,.15,.13,.12,glass);
 }
 root.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;o.userData.objectId=id;}});return root;
}
