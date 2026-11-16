import * as THREE from 'three';
// Original lightweight loading/error fallback; canonical Blender comparisons replace this.
export function createLettersObject(id){
 const root=new THREE.Group(),mats={};for(const [name,color]of Object.entries({stone:'#b2b3a3',paper:'#c8b98c',wood:'#7c6550',wax:'#5b4a37',clay:'#9c7659'}))mats[name]=new THREE.MeshStandardMaterial({color,roughness:1});
 const add=(g,m,x,y,z,p=root)=>{const o=new THREE.Mesh(g,mats[m]);o.position.set(x,y,z);p.add(o);return o;},box=(x,y,z,w,h,d,m='stone',p=root)=>add(new THREE.BoxGeometry(w,h,d),m,x,y,z,p);
 box(0,.0125,0,1.15,.025,.8);
 if(id==='letters-materials'){
  for(let i=0;i<10;i++)box(-.32,.028,-.145+i*.026,.35,.006,.026,'paper');
  const upper=new THREE.Group();upper.name='letters-materials-modern-upper-fiber-layer';root.add(upper);for(let i=0;i<10;i++)box(-.4775+i*.035,.034,-.028,.035,.006,.26,'paper',upper);
  box(.13,.029,-.18,.24,.008,.16,'wood');box(.32,.031,.14,.26,.012,.18,'wood');for(const x of [.1975,.4425])box(x,.047,.14,.015,.02,.18,'wood');for(const z of [.0575,.2225])box(.32,.047,z,.23,.02,.015,'wood');box(.32,.039,.14,.23,.004,.15,'wax');
  const profile=[[0,0],[.025,0],[.0275,.006],[.0275,.05],[.0215,.05],[.0215,.006],[0,.006]].map(p=>new THREE.Vector2(...p));add(new THREE.LatheGeometry(profile,32),'clay',-.3,.025,.23);
  box(-.02,.029,.22,.22,.008,.009,'wood');box(-.02,.029,.29,.22,.008,.008,'wood');
 }else if(id==='letters-delivery'){
  for(const x of [-.36,.36])box(x,.04,0,.34,.03,.45);
  for(const z of [-.08,.08])add(new THREE.CylinderGeometry(.025,.025,.02,20),'wood',-.36,.065,z);box(.36,.065,0,.12,.02,.22,'wood');box(0,.033,0,.2,.016,.035,'wood');const arrow=add(new THREE.ConeGeometry(.04,.07,3),'wood',.13,.033,0);arrow.rotation.z=-Math.PI/2;box(0,.027,.26,.28,.004,.16,'paper');
 }else{
  const slope=.22,angle=-Math.atan(slope),normal=new THREE.Vector3(0,Math.cos(angle),Math.sin(angle));
  const support=(x,z)=>{const w=.25,d=.04,b=.055,top=v=>.17+slope*v;const v=[-w/2,b,z-d/2,w/2,b,z-d/2,w/2,b,z+d/2,-w/2,b,z+d/2,-w/2,top(z-d/2),z-d/2,w/2,top(z-d/2),z-d/2,w/2,top(z+d/2),z+d/2,-w/2,top(z+d/2),z+d/2],g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex([0,2,1,0,3,2,4,5,6,4,6,7,0,1,5,0,5,4,1,2,6,1,6,5,2,3,7,2,7,6,3,0,4,3,4,7]);g.computeVertexNormals();add(g,'wood',x,0,0);};
  for(const x of [-.31,.31]){box(x,.04,0,.32,.03,.4,'wood');support(x,-.12);support(x,.12);const panel=box(x,.17+normal.y*.0075,normal.z*.0075,.3,.015,.36,'wood');panel.rotation.x=angle;const paper=box(x,.17+normal.y*.018,normal.z*.018,.25,.006,.28,'paper');paper.rotation.x=angle;box(x,.035,.29,.10,.02,.09,'wood');}
  box(0,.033,0,.16,.016,.03,'wood');for(const sign of [-1,1]){const o=add(new THREE.ConeGeometry(.03,.06,3),'wood',sign*.10,.033,0);o.rotation.z=-sign*Math.PI/2;}
 }
 root.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;o.userData.objectId=id;}});return root;
}
