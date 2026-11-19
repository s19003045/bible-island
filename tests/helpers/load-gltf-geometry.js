import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DataTexture} from 'three';

// CPU geometry tests have no browser image decoder. Preserve texture slots
// with a placeholder; PNG payloads and rendered appearance are checked apart.
export function geometryLoader(){
  return new GLTFLoader().register(()=>({name:'CPU_GEOMETRY_TEXTURE',loadTexture(){
    const texture=new DataTexture(new Uint8Array([255,255,255,255]),1,1);texture.needsUpdate=true;return Promise.resolve(texture);
  }}));
}
