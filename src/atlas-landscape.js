import * as THREE from 'three';

// A symbolic reading basin, independent of every detailed historical scene.
const smooth=(a,b,x)=>{const t=THREE.MathUtils.clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const random=seed=>{let n=seed>>>0;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};};
export function basinShoreRadius(angle){
  const ellipse=1/Math.hypot(Math.cos(angle)/73,Math.sin(angle)/68);
  return ellipse*(1+.065*Math.sin(angle*3+.7)+.035*Math.sin(angle*7-1.2));
}
export function basinShoreDistance(x,z){return Math.hypot(x,z)-basinShoreRadius(Math.atan2(z,x));}
export function mountainHeight(x,z){
  const d=basinShoreDistance(x,z);if(d<0)return -1.5+d*.12;
  const ridge=1-Math.abs(Math.sin(x*.035+z*.017+Math.sin(z*.023)*1.4));
  const secondary=.5+.5*Math.sin(x*.067-z*.041+Math.sin(x*.019)*2);
  const hills=smooth(3,18,d)*(1-smooth(115,260,d));
  const relief=9+34*ridge*ridge+10*secondary+Math.sin(x*.22+z*.13)*.9;
  return -1.5+smooth(0,7,d)*3.1+hills*relief;
}

function cloudTexture(){
  const width=128,height=64,data=new Uint8Array(width*height*4);
  for(let j=0;j<height;j++)for(let i=0;i<width;i++){
    const x=(i/(width-1)-.5)*2,y=(j/(height-1)-.5)*2;
    let density=0;
    for(const [cx,cy,sx,sy] of [[-.52,-.08,.28,.38],[-.23,.12,.34,.56],[.12,.08,.39,.62],[.47,-.08,.3,.38]])density+=Math.exp(-((x-cx)**2/sx**2+(y-cy)**2/sy**2)*2);
    const noise=Math.sin(x*27+Math.sin(y*17))*Math.sin(y*23-x*7)*.045;
    const alpha=smooth(.09,.7,density+noise)*smooth(0,.2,1-Math.abs(x))*smooth(0,.22,1-Math.abs(y));
    const p=(j*width+i)*4;data[p]=data[p+1]=data[p+2]=255;data[p+3]=Math.round(alpha*230);
  }
  const texture=new THREE.DataTexture(data,width,height);texture.minFilter=texture.magFilter=THREE.LinearFilter;texture.needsUpdate=true;return texture;
}

export function createMountainBasin(){
  const root=new THREE.Group();root.name='atlas-mountain-basin';
  const angles=256,rings=80,vertices=[],colors=[],indices=[];
  const sand=new THREE.Color('#a9ad88'),meadow=new THREE.Color('#70865b'),forest=new THREE.Color('#455f4b'),stone=new THREE.Color('#939884');
  for(let r=0;r<=rings;r++)for(let a=0;a<=angles;a++){
    const angle=a/angles*Math.PI*2,radius=basinShoreRadius(angle)-2+r/rings*320,x=Math.cos(angle)*radius,z=Math.sin(angle)*radius,y=mountainHeight(x,z),d=basinShoreDistance(x,z);
    vertices.push(x,y,z);const c=sand.clone().lerp(meadow,smooth(2,14,d));c.lerp(forest,smooth(10,40,d)*.55);c.lerp(stone,smooth(24,38,y)*.6);c.multiplyScalar(1+Math.sin(x*.61+z*.47)*.035);colors.push(c.r,c.g,c.b);
    if(r<rings&&a<angles){const n=r*(angles+1)+a;indices.push(n,n+1,n+angles+1,n+1,n+angles+2,n+angles+1);}
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  const terrainMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1});
  const terrain=new THREE.Mesh(geometry,terrainMaterial);terrain.name='atlas-enclosing-ridges';terrain.receiveShadow=true;root.add(terrain);

  const rand=random(161126),treeCount=640,trunkGeometry=new THREE.CylinderGeometry(.12,.2,1.8,5),leafGeometry=new THREE.IcosahedronGeometry(1,1);
  const trunkMaterial=new THREE.MeshStandardMaterial({color:'#68604a',roughness:1}),leafMaterial=new THREE.MeshStandardMaterial({color:'#667d52',roughness:1});
  const trunks=new THREE.InstancedMesh(trunkGeometry,trunkMaterial,treeCount),leaves=new THREE.InstancedMesh(leafGeometry,leafMaterial,treeCount*2);
  trunks.name='atlas-mountain-tree-trunks';leaves.name='atlas-mountain-tree-canopies';const dummy=new THREE.Object3D(),color=new THREE.Color();
  for(let i=0;i<treeCount;i++){
    const a=rand()*Math.PI*2,r=basinShoreRadius(a)+10+rand()*95,x=Math.cos(a)*r,z=Math.sin(a)*r,y=mountainHeight(x,z),s=.65+rand()*.65;
    dummy.position.set(x,y+.8*s,z);dummy.scale.set(s,s,s);dummy.rotation.set(0,a,0);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);
    for(let j=0;j<2;j++){dummy.position.set(x+(j?.38:-.15)*s,y+(j?2.2:2.6)*s,z+j*.2*s);dummy.scale.set((j?1.05:1.2)*s,(j?1.5:1.8)*s,1.1*s);dummy.updateMatrix();leaves.setMatrixAt(i*2+j,dummy.matrix);color.set(j?'#58714d':'#72875b').multiplyScalar(.85+rand()*.25);leaves.setColorAt(i*2+j,color);}
  }
  trunks.computeBoundingSphere();leaves.computeBoundingSphere();root.add(trunks,leaves);

  const texture=cloudTexture(),cloudGeometry=new THREE.PlaneGeometry(1,1),cloudMaterial=new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:.82,depthWrite:false,toneMapped:false,side:THREE.DoubleSide});
  const clouds=[];
  for(let i=0;i<22;i++){
    const mesh=new THREE.Mesh(cloudGeometry,cloudMaterial);mesh.name=`atlas-drifting-cloud-${i}`;const angle=i/22*Math.PI*2+rand()*.14;
    const cloud={mesh,angle,offset:8+rand()*26,height:6+rand()*8,speed:(.0008+rand()*.0009),phase:rand()*Math.PI*2};mesh.scale.set(14+rand()*10,4+rand()*3,1);clouds.push(cloud);root.add(mesh);
  }
  function update(time,night,camera){
    cloudMaterial.color.set(night?'#8798ab':'#ffffff');cloudMaterial.opacity=night?.42:.82;
    for(const c of clouds){const a=c.angle+time*c.speed,r=basinShoreRadius(a)+c.offset,x=Math.cos(a)*r,z=Math.sin(a)*r;c.mesh.position.set(x,mountainHeight(x,z)+c.height+Math.sin(time*.035+c.phase)*.65,z);if(camera)c.mesh.quaternion.copy(camera.quaternion);else c.mesh.rotation.x=-Math.PI/3;}
  }
  update(0,false);
  return {root,terrain,clouds,update,dispose(){geometry.dispose();terrainMaterial.dispose();trunkGeometry.dispose();leafGeometry.dispose();trunkMaterial.dispose();leafMaterial.dispose();cloudGeometry.dispose();cloudMaterial.dispose();texture.dispose();}};
}
