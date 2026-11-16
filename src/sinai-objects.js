import * as THREE from 'three';
// Lightweight loading/error comparisons; replaced by the shared original GLBs.
export function createSinaiObject(id){const root=new THREE.Group(),clay=new THREE.MeshStandardMaterial({color:'#a08360',roughness:1}),stone=new THREE.MeshStandardMaterial({color:'#847d6b',roughness:1}),cloth=new THREE.MeshStandardMaterial({color:'#c9c3aa',roughness:1});
 const box=(x,y,z,w,h,d,mat,parent=root)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);parent.add(m);};
 if(id==='sinai-manna'){for(const [x,z] of [[-.34,0],[.25,-.19],[.25,.19]]){const g=new THREE.LatheGeometry([[0,.01],[.11,.01],[.17,.2],[.15,.22],[.10,.04],[0,.04]].map(p=>new THREE.Vector2(...p)),32),b=new THREE.Mesh(g,clay);b.position.set(x,0,z);root.add(b);for(let i=0;i<16;i++)box(x+Math.cos(i*2.4)*.07,.05+i%3*.006,z+Math.sin(i*2.4)*.07,.013,.003,.008,cloth);}}
 else if(id==='sinai-water'){box(0,.01,0,1.1,.02,.8,clay);const rock=new THREE.Mesh(new THREE.IcosahedronGeometry(.3,1),stone);rock.position.set(-.16,.24,-.1);rock.scale.set(1,1.6,.8);root.add(rock);box(.1,.025,.23,.6,.006,.04,new THREE.MeshStandardMaterial({color:'#477c7a',roughness:.3}));}
 else{box(0,.01,0,1.4,.02,1,clay);const peak=new THREE.Mesh(new THREE.ConeGeometry(.4,.6,8),stone);peak.position.set(-.1,.31,-.22);root.add(peak);const guide=new THREE.Group();guide.name='sinai-boundary-guide';root.add(guide);box(0,.045,.08,1.3,.01,.035,new THREE.MeshBasicMaterial({color:'#347c7d'}),guide);for(const x of [-.45,-.16,.15,.44])box(x,.04,.36,.12,.06,.12,cloth);}
 root.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;o.userData.objectId=id;}});return root;
}
