import * as THREE from 'three';
import {atlasBounds,coastRadius} from './atlas-data.js';
import {createMountainBasin,basinShoreDistance} from './atlas-landscape.js';
export const atlasSkyColor=night=>night?'#304d55':'#b9cec5';
export function createAtlasEnvironment(themes){
  const size=384,bounds=[-140,-130,280,260],data=new Uint8Array(size*size*4);
  // One static shore-distance texture avoids 24 trigonometric island tests per screen pixel.
  for(let z=0;z<size;z++)for(let x=0;x<size;x++){
    const wx=bounds[0]+x/(size-1)*bounds[2],wz=bounds[1]+z/(size-1)*bounds[3];let nearest=Math.min(8,-basinShoreDistance(wx,wz));
    for(const t of themes){const dx=wx-t.position[0],dz=wz-t.position[1],d=Math.hypot(dx,dz);if(d-t.radius>nearest+.5)continue;nearest=Math.min(nearest,d-coastRadius(t.radius,Math.atan2(dz,dx),t.number));}
    const i=(z*size+x)*4;data[i]=Math.round(Math.max(0,Math.min(1,nearest/8))*255);data[i+1]=data[i+2]=0;data[i+3]=255;
  }
  const shore=new THREE.DataTexture(data,size,size);shore.minFilter=shore.magFilter=THREE.LinearFilter;shore.needsUpdate=true;
  const material=new THREE.ShaderMaterial({toneMapped:false,uniforms:{uTime:{value:0},uDark:{value:0},uShore:{value:shore},uBounds:{value:new THREE.Vector4(...bounds)},uHorizon:{value:new THREE.Color(atlasSkyColor(false))},uDeep:{value:new THREE.Color('#426f72')},uShallow:{value:new THREE.Color('#8da993')}},
    vertexShader:'varying vec3 vWorld; void main(){vec4 p=modelMatrix*vec4(position,1.);vWorld=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}',
    fragmentShader:`varying vec3 vWorld;uniform float uTime;uniform float uDark;uniform sampler2D uShore;uniform vec4 uBounds;uniform vec3 uHorizon;uniform vec3 uDeep;uniform vec3 uShallow;
    void main(){
      vec2 p=vWorld.xz,uv=(p-uBounds.xy)/uBounds.zw;
      float inside=step(0.,uv.x)*step(uv.x,1.)*step(0.,uv.y)*step(uv.y,1.);
      float depth=mix(8.,texture2D(uShore,uv).r*8.,inside);
      float swell=sin(p.x*.31+uTime*.22)*sin(p.y*.23-uTime*.17);
      float ripple=sin(p.x*2.4+sin(p.y*.6)+uTime*.28)*sin(p.y*2.1-uTime*.19);
      vec3 color=mix(uShallow,uDeep,smoothstep(.25,3.7,depth));
      color+=swell*.009+pow(max(0.,ripple),16.)*.018;
      float foam=(1.-smoothstep(.15,.65,depth))*smoothstep(-.1,.35,depth)*(.4+.6*sin(p.x*1.9+p.y*1.5-uTime*.45));
      color+=foam*.075;color*=1.-uDark*.55;
      float haze=smoothstep(135.,520.,distance(cameraPosition,vWorld));color=mix(color,uHorizon,haze);
      gl_FragColor=vec4(color,1.);
      #include <colorspace_fragment>
    }`});
  const water=new THREE.Mesh(new THREE.PlaneGeometry(atlasBounds.waterSize,atlasBounds.waterSize),material);water.name='atlas-continuous-ocean';water.rotation.x=-Math.PI/2;water.position.y=-.13;water.frustumCulled=false;
  const landscape=createMountainBasin(),root=new THREE.Group();root.name='atlas-mountain-lake-environment';root.add(water,landscape.root);
  return {root,water,landscape,update(time,night,camera){material.uniforms.uTime.value=time;material.uniforms.uDark.value=night?1:0;material.uniforms.uHorizon.value.set(atlasSkyColor(night));landscape.update(time,night,camera);},dispose(){water.geometry.dispose();material.dispose();shore.dispose();landscape.dispose();}};
}
