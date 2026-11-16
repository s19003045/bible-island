import * as THREE from 'three';
export function createJosephObject(id){const root=new THREE.Group(),cloth=new THREE.MeshStandardMaterial({color:'#b9aa8a',roughness:1}),clay=new THREE.MeshStandardMaterial({color:'#a48764',roughness:1}),wood=new THREE.MeshStandardMaterial({color:'#66513a',roughness:1});
 const box=(x,y,z,w,h,d,mat=cloth,parent=root)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);parent.add(m);return m;};
 if(id==='joseph-granary'){box(0,.025,0,1.4,.05,1,clay);for(const x of [-.65,.65])box(x,.25,-.1,.07,.45,.72,clay);box(0,.25,-.45,1.3,.45,.07,clay);box(0,.25,.25,1.3,.45,.07,clay);box(0,.25,-.1,.06,.45,.65,clay);for(const x of [-.32,.32])box(x,.13,-.1,.55,.16,.6,cloth);const roof=new THREE.Group();roof.name='joseph-granary-roof';root.add(roof);box(0,.5,-.1,1.4,.05,.8,clay,roof);box(.35,.06,.39,.3,.06,.16,wood);}
 else{for(const x of [-.29,.27]){const sack=new THREE.Mesh(new THREE.SphereGeometry(.24,24,16),cloth);sack.position.set(x,.2,0);sack.scale.set(1,.8,.9);root.add(sack);}if(id==='joseph-cargo'){const wrap=new THREE.Group();wrap.name='joseph-cargo-wrap';root.add(wrap);box(0,.38,0,.9,.025,.65,cloth,wrap);}else{for(let i=0;i<3;i++)box(.28,.05+i*.035,.2,.35,.03,.25);box(-.3,.2,.25,.2,.25,.18,clay);}}
 root.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;o.userData.objectId=id;}});return root;
}
