import * as THREE from 'three';
// Original loading/error geometry; accepted Blender assets replace this when ready.
export function createParablesObject(id){
 const root=new THREE.Group(),stone=new THREE.MeshStandardMaterial({color:'#b1aa92',roughness:1}),earth=new THREE.MeshStandardMaterial({color:'#856d4d',roughness:1}),rock=new THREE.MeshStandardMaterial({color:'#a8a18b',roughness:1}),clay=new THREE.MeshStandardMaterial({color:'#a77c5d',roughness:.96}),plant=new THREE.MeshStandardMaterial({color:'#86865c',roughness:1}),wood=new THREE.MeshStandardMaterial({color:'#74634e',roughness:1});
 const mesh=(g,m,x=0,y=0,z=0,p=root)=>{const o=new THREE.Mesh(g,m);o.position.set(x,y,z);p.add(o);return o;},box=(x,y,z,w,h,d,m=stone,p=root)=>mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z,p);
 if(id==='parables-soil'){
  box(0,.015,0,1.15,.03,.75);for(const [i,x] of [-.405,-.135,.135,.405].entries()){box(x,.07,0,.24,.08,.60,i===1?rock:earth);if(i===1){const layer=new THREE.Group();layer.name='parables-soil-modern-shallow-layer';root.add(layer);box(x,.12,0,.24,.02,.60,earth,layer);mesh(new THREE.CylinderGeometry(.004,.004,.12,8),plant,x,.19,0,layer);}else if(i>1){mesh(new THREE.CylinderGeometry(.004,.004,.15,8),plant,x,.185,0);}}
 }else if(id==='parables-flock'){
  box(0,.025,0,1.15,.05,.75);for(let r=0;r<9;r++)for(let c=0;c<11;c++)mesh(new THREE.CylinderGeometry(.021,.021,.018,24),stone,-.48+c*.058,.059,-.29+r*.07);mesh(new THREE.CylinderGeometry(.021,.021,.018,24),stone,.44,.059,0);
 }else{
  box(0,.015,0,1.15,.03,.80);const vessel=(x,z,h,r,bottom=.03)=>{const pts=[[0,0],[r*.5,0],[r*.5,.012],[r,h*.4],[r*.7,h],[r*.7-.008,h],[r-.008,h*.4],[r*.5-.008,.02],[0,.02]].map(p=>new THREE.Vector2(...p));mesh(new THREE.LatheGeometry(pts,48),clay,x,bottom,z);};vessel(-.36,0,.06,.065);vessel(-.08,.14,.23,.07);box(.30,.048,-.04,.28,.036,.25,wood);mesh(new THREE.CylinderGeometry(.016,.016,.4,24),wood,.3,.266,-.04);vessel(.30,-.04,.06,.04,.466);mesh(new THREE.CylinderGeometry(.028,.02,.08,24),plant,.3,.526,-.04);
 }
 root.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;o.userData.objectId=id;}});return root;
}
