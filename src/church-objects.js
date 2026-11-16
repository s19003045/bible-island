import * as THREE from 'three';
// Original lightweight loading/error geometry; canonical Blender GLBs replace it when ready.
export function createChurchObject(id){
 const root=new THREE.Group(),mats={};for(const [name,color]of Object.entries({stone:'#b0a78f',clay:'#a77e60',bread:'#ac8b57',wood:'#75644f',cloth:'#bcb294'}))mats[name]=new THREE.MeshStandardMaterial({color,roughness:1});
 const add=(g,m,x,y,z,p=root)=>{const o=new THREE.Mesh(g,mats[m]);o.position.set(x,y,z);p.add(o);return o;},box=(x,y,z,w,h,d,m='stone',p=root)=>add(new THREE.BoxGeometry(w,h,d),m,x,y,z,p);
 if(id==='church-house'){
  box(0,.0175,0,1.15,.035,.8);box(0,.155,-.2475,.65,.24,.025);box(-.3125,.155,0,.025,.24,.52);
  for(const sign of [-1,1])box(sign*.1925,.155,.2475,.265,.24,.025);box(0,.225,.2475,.12,.10,.025);
  const roof=new THREE.Group();roof.name='church-house-modern-roof-section';root.add(roof);for(const x of [-.18,.18])box(x,.285,0,.025,.020,.52,'wood',roof);box(0,.3075,0,.67,.025,.54,'stone',roof);
 }else if(id==='church-table'){
  box(0,.0125,0,1.15,.025,.8);const bowl=[[0,0],[.06,0],[.07,.014],[.13,.09],[.13,.10],[.119,.10],[.117,.089],[.057,.014],[0,.014]].map(p=>new THREE.Vector2(...p));add(new THREE.LatheGeometry(bowl,40),'clay',-.30,.025,-.12);
  const cup=[[0,0],[.025,0],[.03,.014],[.045,.09],[.045,.10],[.035,.10],[.033,.089],[.018,.014],[0,.014]].map(p=>new THREE.Vector2(...p));for(const x of [.06,.28])add(new THREE.LatheGeometry(cup,32),'clay',x,.025,-.16);add(new THREE.CylinderGeometry(.12,.125,.04,40),'bread',.12,.045,.15);
 }else{
  box(0,.015,0,1.15,.03,.8);for(const x of [-.36,.36]){box(x,.055,0,.31,.05,.52);for(const z of [-.10,.10])add(new THREE.CylinderGeometry(.025,.025,.018,20),'wood',x,.089,z);}
  box(0,.039,0,.25,.018,.035,'wood');for(const sign of [-1,1]){const g=new THREE.ConeGeometry(.042,.07,3);g.rotateZ(-sign*Math.PI/2);add(g,'wood',sign*.13,.039,0);}
  box(-.35,.095,.20,.12,.03,.09,'wood');box(.35,.12,.19,.14,.08,.10,'cloth');
 }
 root.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;o.userData.objectId=id;}});return root;
}
