import * as THREE from 'three';
// Loading/error fallback for the same original teaching comparisons as the GLBs.
export function createRuthObject(id){
 const root=new THREE.Group(),earth=new THREE.MeshStandardMaterial({color:'#9d8765',roughness:1}),straw=new THREE.MeshStandardMaterial({color:'#bca273',roughness:1}),teal=new THREE.MeshStandardMaterial({color:'#397d7a',roughness:1}),leather=new THREE.MeshStandardMaterial({color:'#72543a',roughness:1}),cloth=new THREE.MeshStandardMaterial({color:'#b7aa8b',roughness:1});
 function box(parent,x,y,z,w,h,d,mat){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);parent.add(m);return m;}
 function stem(parent,x,y,z,angle=0){const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=angle;parent.add(g);box(g,0,.006,0,.006,.006,.3,straw);for(let i=0;i<7;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(.016,8,5),straw);m.scale.set(.7,.5,1.6);m.position.set((i%2?1:-1)*.01,.013,-.12+i*.02);g.add(m);}}
 if(id==='ruth-gleaning'){
  box(root,0,.015,0,1.3,.03,.85,earth);for(let i=0;i<18;i++)stem(root,-.37+(i%3)*.025,.035+Math.floor(i/3)*.012,-.07,Math.floor(i/9)*.15);for(let i=0;i<5;i++)stem(root,.03+i*.06,.035,.18-i*.09,i*.8);
  // Open basket wall and real inner bottom, rather than an opaque capped cylinder.
  const bowl=new THREE.Mesh(new THREE.LatheGeometry([[0,0],[.1,0],[.15,.2],[.137,.21],[.09,.025],[0,.025]].map(p=>new THREE.Vector2(...p)),24),earth);bowl.position.set(.42,.03,-.1);root.add(bowl);for(let i=0;i<4;i++)stem(root,.42,.08+i*.012,-.1,i*.4);
 }else if(id==='ruth-grain'){
  for(const [i,key] of ['heap','chaff','kernels','ears'].entries()){const layer=new THREE.Group();layer.name=`ruth-grain-${key}-layer`;root.add(layer);const x=-.236,y=.039+i*.1,z=.245-i*.16;box(layer,x,y,z,.73,.008,.3,teal);for(const dz of [-.145,.145])box(layer,x,y+.012,z+dz,.73,.024,.009,teal);for(const dx of [-.36,.36])box(layer,x+dx,y+.012,z,.009,.024,.282,teal);if(i===3)for(let j=0;j<4;j++)stem(layer,x-.06+j*.04,y+.025,z,j*.2);else for(let j=0;j<15;j++)box(layer,x+(j%3-1)*.04,y+.03+(i===0?j%4*.012:0),z-.1+Math.floor(j/3)*.04,.025,.008,i===1?.035:.02,straw);}
  box(root,.39,.04,.05,.34,.008,.65,cloth);
 }else{
  box(root,0,.015,0,1.35,.03,.9,earth);for(const x of [-.48,-.18])box(root,x,.22,-.26,.1,.4,.14,earth);box(root,-.33,.43,-.26,.42,.04,.14,earth);for(let i=0;i<10;i++)box(root,-.55+(i%5)*.16,.065,.05+Math.floor(i/5)*.13,.045,.07,.045,teal);for(const x of [-.26,-.06])box(root,x,.065,.35,.06,.07,.06,leather);box(root,.4,.04,0,.22,.04,.48,leather);const fastening=new THREE.Group();fastening.name='ruth-witness-shoe-fastening-layer';root.add(fastening);for(const z of [-.1,.05])box(fastening,.4,.10,z,.24,.018,.035,leather);
 }
 root.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;o.userData.objectId=id;}});return root;
}
