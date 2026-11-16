import * as THREE from 'three';
// Original low-detail loading/error geometry. The inspected Blender assets replace it.
export function createPassionObject(id){
 const root=new THREE.Group(),mats={};for(const [id,color]of Object.entries({stone:'#b0a78f',clay:'#a77e60',bread:'#ac8b57',crumb:'#d1b785',wood:'#75644f',leaf:'#7e8969'}))mats[id]=new THREE.MeshStandardMaterial({color,roughness:1});
 const add=(g,m,x,y,z,p=root)=>{const o=new THREE.Mesh(g,mats[m]);o.position.set(x,y,z);p.add(o);return o;},box=(x,y,z,w,h,d,m='stone',p=root)=>add(new THREE.BoxGeometry(w,h,d),m,x,y,z,p);
 if(id==='passion-table'){
  box(0,.0125,0,1.15,.025,.8);const points=[[0,0],[.032,0],[.038,.014],[.06,.105],[.06,.115],[.05,.115],[.048,.105],[.025,.014],[0,.014]].map(p=>new THREE.Vector2(...p));add(new THREE.LatheGeometry(points,40),'clay',-.38,.025,-.15);
  add(new THREE.CylinderGeometry(.12,.125,.045,40),'bread',-.18,.0475,.13);for(const [x,a]of [[.17,Math.PI/2],[.37,-Math.PI/2]]){const o=add(new THREE.CylinderGeometry(.12,.125,.045,32,1,false,0,Math.PI),'bread',x,.0475,.015);o.rotation.y=a;}
 }else if(id==='passion-context'){
  box(0,.0125,0,1.15,.025,.8);for(const [i,[x,z]]of [[-.275,-.19],[.275,-.19],[-.275,.19],[.275,.19]].entries()){const top=[.06,.08,.10,.065][i];box(x,(.025+top)/2,z,.46,top-.025,.30);if(i===0){for(const [px,pz]of [[-.36,-.22],[-.325,-.22],[-.29,-.22],[-.18,-.12]])add(new THREE.CylinderGeometry(.012,.012,.01,16),'wood',px,top+.005,pz);}else if(i===3){box(x,top+.04,z,.012,.08,.012,'wood');box(x,top+.057,z,.055,.012,.012,'wood');}else{for(const sign of [-1,1])box(x+sign*.12,top+.02,z,.035,.04,.15);box(x,top+.02,z-.07,.24,.04,.035);}}
 }else{
  box(0,.0175,0,1.15,.035,.80);box(-.375,.2175,-.115,.05,.365,.55);box(.375,.2175,-.115,.05,.365,.55);box(0,.2175,-.365,.70,.365,.05);box(0,.425,-.115,.80,.05,.55);box(.24,.0725,-.095,.22,.075,.39);
  const front=new THREE.Group();front.name='passion-tomb-modern-front-section';root.add(front);for(const sign of [-1,1])box(sign*.256,.2425,.185,.288,.415,.05,'stone',front);box(0,.3575,.185,.224,.185,.05,'stone',front);
 }
 root.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;o.userData.objectId=id;}});return root;
}
