import * as THREE from 'three';
// Lightweight loading/error geometry; canonical Blender meshes replace these when ready.
export function createGalileeObject(id){
 const root=new THREE.Group(),wood=new THREE.MeshStandardMaterial({color:'#927453',roughness:.95}),base=new THREE.MeshStandardMaterial({color:'#b6b1a3',roughness:1}),earth=new THREE.MeshStandardMaterial({color:'#ac9777',roughness:1}),dark=new THREE.MeshStandardMaterial({color:'#55564e',roughness:1}),light=new THREE.MeshStandardMaterial({color:'#c3b7a1',roughness:1});
 const box=(p,x,y,z,w,h,d,m=wood)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);p.add(mesh);return mesh;};
 const group=name=>{const g=new THREE.Group();g.name=name;root.add(g);return g;};
 if(id==='galilee-hull'){
  box(root,0,.0125,0,1.1,.025,.72,base);for(const x of [-.32,.32])box(root,x,.04,0,.06,.03,.10);box(root,0,.08,0,.96,.05,.04);
  const profile=(z,offset)=>{const a=Math.max(0,Math.abs(z)-.08),slope=a?Math.sign(z)*.65*a/(.22*.22):0,n=Math.hypot(slope,1);return [z-offset*slope/n,.125+.325*(a/.22)**2+offset/n];};
  const strip=(name,extent,a,b,length,x,parent)=>{const samples=96,zs=Array.from({length:samples+1},(_,i)=>-extent+2*extent*i/samples),points=[...zs.map(z=>profile(z,a)),...[...zs].reverse().map(z=>profile(z,b))],shape=new THREE.Shape(points.map(p=>new THREE.Vector2(...p))),g=new THREE.ExtrudeGeometry(shape,{depth:length,bevelEnabled:false});g.translate(0,0,-length/2);g.rotateY(Math.PI/2);const mesh=new THREE.Mesh(g,wood);mesh.position.x=x;mesh.name=name;parent.add(mesh);};
  strip('galilee-hull-closed-shell',.3,0,-.02,1.02,0,root);strip('galilee-hull-fixed-frame',.29136,0,.03,.035,-.28,root);strip('galilee-hull-removable-frame',.29136,0,.03,.035,0,group('galilee-hull-modern-removable-frame'));
 }else if(id==='galilee-roof'){
  box(root,0,.0125,0,1.1,.025,.85,base);box(root,0,.0325,0,.94,.015,.70,earth);box(root,0,.20,-.335,.94,.32,.03,earth);box(root,-.455,.20,0,.03,.32,.64,earth);
  for(const x of [-.2625,.2625])box(root,x,.20,.335,.415,.32,.03,earth);box(root,0,.26,.335,.16,.03,.03);box(root,0,.3175,.335,.11,.085,.03,earth);
  const roof=group('galilee-roof-modern-cutaway-layer');for(const x of [-.38,-.19,0,.19,.38])box(roof,x,.375,0,.028,.03,.74);box(roof,0,.395,0,.98,.01,.74,wood);box(roof,0,.41,0,.98,.02,.74,earth);box(roof,0,.421,0,.98,.002,.74,light);
 }else{
  box(root,0,.0125,0,1.05,.025,.66,base);
  for(const [i,x] of [-.255,.255].entries()){
   box(root,x,.033,0,.44,.016,.50);for(const dx of [-.212,.212])box(root,x+dx,.0555,0,.016,.029,.50);for(const z of [-.242,.242])box(root,x,.0555,z,.408,.029,.016);box(root,x,.086,0,.31,.09,.34,i?light:dark);
  }
 }
 root.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;o.userData.objectId=id;}});return root;
}
