import * as THREE from 'three';
// Local loading/error geometry. The original Blender exports replace these when ready.
export function createIntertestamentObject(id){
 const root=new THREE.Group(),wood=new THREE.MeshStandardMaterial({color:'#9e8058',roughness:.96}),stone=new THREE.MeshStandardMaterial({color:'#b0a389',roughness:1}),teal=new THREE.MeshStandardMaterial({color:'#63858a',roughness:.95}),sheet=new THREE.MeshStandardMaterial({color:'#d5cdb8',roughness:1}),silver=new THREE.MeshStandardMaterial({color:'#b3b4ae',metalness:.65,roughness:.55});
 const group=(name,p=root)=>{const g=new THREE.Group();g.name=name;p.add(g);return g;};
 const box=(p,x,y,z,w,h,d,m=wood)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);p.add(o);return o;};
 const shell=(p,x,y,z,w,d,h,t)=>{box(p,x,y+t/2,z,w,t,d,teal);for(const sign of [-1,1]){box(p,x+sign*(w-t)/2,y+h/2,z,t,h,d,teal);box(p,x,y+h/2,z+sign*(d-t)/2,w-2*t,h,t,teal);}};
 if(id==='intertestament-road'){
  box(root,0,.011,0,1.2,.022,.7);box(root,0,.0535,0,1.08,.063,.32,stone);for(const sign of [-1,1])box(root,sign*.363,.1225,0,.354,.075,.32,stone);
  for(const z of [-.218,.218]){box(root,0,.0385,z,1.08,.033,.091,stone);for(const sign of [-1,1])box(root,0,.09,z+sign*.0365,1.08,.07,.018,stone);}
  const layer=group('intertestament-road-modern-cutaway-layer');box(layer,0,.09,0,.33,.01,.29,teal);box(layer,0,.12,0,.33,.05,.29,stone);for(let i=0;i<9;i++)box(layer,-.11+(i%3)*.11,.151,Math.floor(i/3)*.09-.09,.085,.012,.07,stone);
  box(root,.34,.038,-.30,.25,.032,.065,stone);box(root,-.41,.09,.30,.16,.135,.006,teal);
 }else if(id==='intertestament-coin'){
  box(root,0,.01,0,.65,.02,.45);const disc=new THREE.Mesh(new THREE.CylinderGeometry(.115,.115,.014,64),silver);disc.rotation.x=Math.PI/2;disc.position.y=.185;root.add(disc);
  const face=new THREE.Shape();face.moveTo(-.026,-.060);face.lineTo(.025,-.060);face.lineTo(.016,-.026);face.lineTo(.037,-.007);face.lineTo(.022,.007);face.lineTo(.029,.028);face.lineTo(.015,.055);face.lineTo(-.016,.060);face.lineTo(-.035,.033);face.lineTo(-.031,-.004);face.closePath();const profile=new THREE.Mesh(new THREE.ExtrudeGeometry(face,{depth:.003,bevelEnabled:false}),silver);profile.position.set(0,.185,.006);root.add(profile);
  for(let i=0;i<3;i++)box(root,0,.155+i*.03,-.008,.105-i*.02,.012,.004,silver);for(const x of [-.042,.042])box(root,x,.048,0,.018,.056,.035,teal);box(root,.23,.067,.10,.075,.094,.006,teal);
 }else{
  box(root,0,.011,0,1.1,.022,.7);shell(root,0,.022,.14,.99,.31,.055,.015);const layer=group('intertestament-languages-modern-audience-layer');
  for(let i=0;i<2;i++){const x=-.25+i*.5;box(root,x,.041,.14,.34,.012,.20,wood);box(layer,x,.053,.14,.43,.012,.26,teal);box(layer,x-.13,.077,.14,.055,.036,.055,stone);box(layer,x+.01,.064,.14,.20,.01,.018,stone);box(layer,x+.14,.08,.14,.025,.042,i?.15:.06,stone);}
  box(root,-.15,.046,-.19,.48,.048,.20,wood);box(root,-.15,.073,-.19,.42,.006,.18,sheet);box(root,.33,.035,-.21,.25,.026,.16,wood);box(root,.33,.05,-.21,.24,.003,.15,sheet);
  const points=[],normals=[];for(let i=0;i<=100;i++){const a=i/100*Math.PI*3,r=.014+i/100*.014,d=.014/(Math.PI*3),dx=d*Math.cos(a)-r*Math.sin(a),dy=d*Math.sin(a)+r*Math.cos(a),n=Math.hypot(dx,dy);points.push([r*Math.cos(a),r*Math.sin(a)]);normals.push([-dy/n,dx/n]);}const shape=new THREE.Shape();for(let i=0;i<points.length;i++){const p=points[i],n=normals[i];i?shape.lineTo(p[0]+n[0]*.00125,p[1]+n[1]*.00125):shape.moveTo(p[0]+n[0]*.00125,p[1]+n[1]*.00125);}for(let i=points.length-1;i>=0;i--){const p=points[i],n=normals[i];shape.lineTo(p[0]-n[0]*.00125,p[1]-n[1]*.00125);}shape.closePath();const roll=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.18,bevelEnabled:false}),sheet);roll.position.set(-.36,.103,-.28);root.add(roll);box(root,-.36,.064,-.19,.04,.04,.20,wood);
 }
 root.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;o.userData.objectId=id;}});return root;
}
