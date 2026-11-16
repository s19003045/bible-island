import * as THREE from 'three';
// Local loading/error geometry. Formal Blender meshes replace it when ready.
export function createNativityObject(id){
 const root=new THREE.Group(),stone=new THREE.MeshStandardMaterial({color:'#b3ac94',roughness:1}),wood=new THREE.MeshStandardMaterial({color:'#9b8058',roughness:.96}),plaster=new THREE.MeshStandardMaterial({color:'#c8bca0',roughness:1}),base=new THREE.MeshStandardMaterial({color:'#b8b6a8',roughness:1});
 const box=(p,x,y,z,w,h,d,m=wood)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);p.add(o);return o;};
 const group=name=>{const g=new THREE.Group();g.name=name;root.add(g);return g;};
 if(id==='nativity-manger'){
  // One connected exterior->rim->interior->floor shell, no lid or hidden lining.
  const n=96,vs=[],fs=[];for(const [w,d,y] of [[1.1,.64,0],[1.1,.64,.48],[.99,.53,.48],[.99,.53,.06]])for(let i=0;i<n;i++){const a=i/n*Math.PI*2,c=Math.cos(a),s=Math.sin(a);vs.push(Math.sign(c)*Math.sqrt(Math.abs(c))*w/2,y,Math.sign(s)*Math.sqrt(Math.abs(s))*d/2);}
  // Front faces point out of the solid, including into the cavity and below the base.
  for(let j=0;j<3;j++)for(let i=0;i<n;i++){const a=j*n+i,b=j*n+(i+1)%n;fs.push(a,b+n,b,a,a+n,b+n);}for(let i=1;i<n-1;i++){fs.push(0,i,i+1);fs.push(3*n,3*n+i+1,3*n+i);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vs,3));g.setIndex(fs);g.computeVertexNormals();const mesh=new THREE.Mesh(g,stone);mesh.name='nativity-manger-continuous-empty-shell';root.add(mesh);
 }else if(id==='nativity-home'){
  box(root,0,.0125,0,1.1,.025,.8,base);box(root,-.17,.0325,0,.66,.015,.66,plaster);box(root,.36,.0325,0,.34,.015,.66,plaster);
  for(const x of [-.4875,.1475])box(root,x,.20,0,.025,.32,.66,plaster);box(root,-.17,.20,-.3175,.61,.32,.025,plaster);
  for(const x of [-.3625,.0225])box(root,x,.20,.3175,.225,.32,.025,plaster);box(root,-.17,.26,.3175,.15,.03,.025,wood);box(root,-.17,.3175,.3175,.15,.085,.025,plaster);
  const roof=group('nativity-home-modern-roof-layer');for(const z of [-.24,-.08,.08,.24])box(roof,-.17,.37,z,.66,.02,.025);box(roof,-.17,.39,0,.69,.02,.70,plaster);
  const jar=new THREE.Mesh(new THREE.CylinderGeometry(.012,.018,.045,16),wood);jar.position.set(-.37,.0625,-.19);root.add(jar);
 }else{
  box(root,0,.015,0,.95,.03,.62,base);
  const prism=(p,name,points,depth,rotate=false)=>{const shape=new THREE.Shape(points.map(v=>new THREE.Vector2(...v))),g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false});g.translate(0,0,-depth/2);const m=new THREE.Mesh(g,wood);m.name=name;if(rotate)m.rotation.y=Math.PI/2;p.add(m);};
  prism(root,'nativity-joinery-fixed-lower-timber',[[-.39,.03],[.39,.03],[.39,.19],[.077,.19],[.077,.11],[-.077,.11],[-.077,.19],[-.39,.19]],.15);
  const upper=group('nativity-joinery-modern-upper-timber');prism(upper,'nativity-joinery-upper-true-bottom-notch',[[-.23,.03],[-.077,.03],[-.077,.11],[.077,.11],[.077,.03],[.23,.03],[.23,.19],[-.23,.19]],.15,true);
 }
 root.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;o.userData.objectId=id;}});return root;
}
