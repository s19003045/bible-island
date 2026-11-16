import * as THREE from 'three';
// Lightweight readable fallback while the local Blender exports load.
export function createPaulObject(id){
 const root=new THREE.Group(),wood=new THREE.MeshStandardMaterial({color:'#6f5033',roughness:.96}),cloth=new THREE.MeshStandardMaterial({color:'#c5baa1',side:THREE.DoubleSide,roughness:1}),purple=new THREE.MeshStandardMaterial({color:'#633958',roughness:1}),silver=new THREE.MeshStandardMaterial({color:'#a9a89d',metalness:.8,roughness:.38}),iron=new THREE.MeshStandardMaterial({color:'#56544c',metalness:.5,roughness:.7});
 const box=(parent,x,y,z,w,h,d,m)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);parent.add(o);return o;};
 const tube=(a,b,r,m)=>{const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,A.distanceTo(B),10),m);o.position.copy(A).add(B).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),B.sub(A).normalize());root.add(o);};
 if(id==='paul-ship'){
  const points=[],faces=[];for(let i=0;i<=32;i++)for(let j=0;j<=16;j++){const x=-.9+i*1.8/32,t=x/.9,a=-Math.PI/2+j*Math.PI/16;points.push(x,.025+.115*Math.abs(t)**4+.29*(1-Math.cos(a)),.29*Math.max(.003,1-t*t)**.56*Math.sin(a));}
  for(let i=0;i<32;i++)for(let j=0;j<16;j++){const q=i*17+j;faces.push(q,q+1,q+18,q,q+18,q+17);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));g.setIndex(faces);g.computeVertexNormals();const m=wood.clone();m.side=THREE.DoubleSide;root.add(new THREE.Mesh(g,m));
  const deck=new THREE.Group();deck.name='paul-ship-deck';root.add(deck);for(const z of [-.19,.19])box(deck,0,.303,z,1.2,.015,.10,wood);
  tube([0,.06,0],[0,1.12,0],.015,wood);tube([.01,1.02,-.51],[.01,1.02,.51],.01,wood);
  const sail=new THREE.Mesh(new THREE.PlaneGeometry(.96,.46,8,8),cloth);sail.rotation.y=Math.PI/2;sail.position.set(.03,.78,0);root.add(sail);
 }else if(id==='paul-textiles'){
  for(let i=0;i<3;i++){const o=box(root,0,.03+i*.027,0,1.06,.014,.50,i?purple:cloth);o.rotation.z=.015*(i-1);}for(const x of [-.21,.21]){tube([x,0,.43],[x,.23,.43],.008,wood);const o=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,.13,24),purple);o.position.set(x,.11,.43);root.add(o);}
 }else{
  const p=[[0,0],[.07,0],[.11,.14],[.1,.17],[.079,.17],[.072,.045],[0,.035]];const pot=new THREE.Mesh(new THREE.LatheGeometry(p.map(v=>new THREE.Vector2(...v)),32),new THREE.MeshStandardMaterial({color:'#8c6045',roughness:1}));pot.position.set(-.39,0,.13);root.add(pot);
  box(root,.05,.055,-.17,.19,.08,.055,iron);tube([.05,.05,-.17],[.05,.05,.31],.014,wood);for(const s of [-1,1])tube([.28+s*.035,.025,-.22],[.29+s*.053,.025,.27],.009,iron);
  box(root,-.14,.025,-.34,.25,.05,.18,silver);for(const x of [-.23,-.05])tube([x,.05,-.30],[x,.23,-.30],.012,silver);tube([-.27,.24,-.3],[-.14,.34,-.3],.015,silver);tube([-.14,.34,-.3],[-.01,.24,-.3],.015,silver);
 }
 root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.userData.objectId=id;}});return root;
}
