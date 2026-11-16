import * as THREE from 'three';
// Local loading/error comparisons. Match the same main movable layers as the original Blender assets.
export function createNehemiahObject(id){
 const root=new THREE.Group(),wood=new THREE.MeshStandardMaterial({color:'#9c805a',roughness:.95}),stone=new THREE.MeshStandardMaterial({color:'#aba38e',roughness:1}),teal=new THREE.MeshStandardMaterial({color:'#668387',roughness:.9}),sheet=new THREE.MeshStandardMaterial({color:'#d8d2bd',roughness:1});
 const group=(p,name)=>{const g=new THREE.Group();g.name=name;p.add(g);return g;};
 function box(p,x,y,z,w,h,d,m=wood){const q=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);q.position.set(x,y,z);p.add(q);return q;}
 function shell(p,x,y,z,w,d,h,t){box(p,x,y+t/2,z,w,t,d);for(const sign of [-1,1]){box(p,x+sign*(w-t)/2,y+h/2,z,t,h,d);box(p,x,y+h/2,z+sign*(d-t)/2,w-2*t,h,t);}}
 box(root,0,.012,0,id==='nehemiah-reading'?1.1:1.2,.024,id==='nehemiah-wall'?.8:.7);
 if(id==='nehemiah-wall'){
  const layer=group(root,'nehemiah-wall-modern-section-layer');for(const sign of [-1,1]){box(root,sign*.32,.23,0,.36,.412,.15,stone);box(layer,sign*.32,.454,0,.36,.024,.17,teal);for(let i=0;i<3;i++)box(layer,sign*.32+(i-1)*.105,.492,0,.10,.052,.13,stone);}box(root,0,.392,0,.24,.088,.15,stone);box(root,0,.343,.01,.26,.025,.2);box(root,.49,.17,.17,.018,.29,.22);box(root,-.32,.049,.25,.3,.05,.08,stone);
 }else if(id==='nehemiah-watch'){
  const layer=group(root,'nehemiah-watch-modern-comparison-layer');for(let i=0;i<3;i++){const x=-.4+i*.4;shell(root,x,.024,.02,.35,.36,.07,.018);box(layer,x,.067,.02,.304,.014,.314,teal);if(i===0){for(let j=0;j<3;j++)box(layer,x,.095+j*.012,.02+j*.045,.24,.025,.035);}else if(i===1){box(layer,x,.10,.02,.24,.05,.18,stone);box(layer,x-.04,.145,.02,.14,.04,.15,stone);}else{const marker=box(layer,x,.14,.02,.12,.12,.024,stone);marker.rotation.z=.45;box(layer,x,.082,.02,.18,.015,.14);}}
  box(layer,0,.044,-.26,1.08,.02,.12,teal);for(let i=0;i<4;i++)box(layer,-.4+i*.27,.07,-.26,.17,.032+(i%2)*.016,.085,stone);
 }else{
  const layer=group(root,'nehemiah-reading-modern-support-layer');box(root,-.13,.26,-.04,.66,.022,.4);for(const x of [-.40,.14])for(const z of [-.19,.11])box(root,x,.137,z,.028,.226,.028);box(layer,-.13,.26,.225,.66,.022,.12);for(const x of [-.40,.14])box(layer,x,.137,.225,.028,.226,.028);box(root,-.13,.282,-.04,.44,.02,.23,teal);box(root,-.13,.295,-.04,.32,.005,.20,sheet);
  for(const sign of [-1,1]){const points=[],normals=[];for(let i=0;i<=90;i++){const a=i/90*Math.PI*3,r=.024+i/90*.021;points.push([Math.cos(a)*r,Math.sin(a)*r]);const d=.021/(Math.PI*3),dx=d*Math.cos(a)-r*Math.sin(a),dy=d*Math.sin(a)+r*Math.cos(a),l=Math.hypot(dx,dy);normals.push([-dy/l,dx/l]);}const shape=new THREE.Shape();for(let i=0;i<points.length;i++){const p=points[i],n=normals[i],x=p[0]+n[0]*.0015,y=p[1]+n[1]*.0015;i?shape.lineTo(x,y):shape.moveTo(x,y);}for(let i=points.length-1;i>=0;i--){const p=points[i],n=normals[i];shape.lineTo(p[0]-n[0]*.0015,p[1]-n[1]*.0015);}shape.closePath();const roll=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.20,bevelEnabled:false}),sheet);roll.position.set(-.13+sign*.19,.34,-.14);root.add(roll);}
  for(let i=0;i<3;i++){const x=.35,z=-.20+i*.2;box(root,x,.045,z,.12,.042,.12,teal);box(root,x,.10,z,.045+(i===1?.035:0),.07,.045,stone);}
 }
 root.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;o.userData.objectId=id;}});return root;
}
