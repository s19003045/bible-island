import * as THREE from 'three';
import {attachBlenderObject,loadBlenderAsset} from './blender-assets.js';
import {blenderModels} from './blender-manifest.js';

// Station props share the character's exact exported geometry and coordinate
// frame. Ownership, not camera distance, controls which copy is visible.
export function mountLifeProps(workstations,actors,{assetLoader=loadBlenderAsset,onReady=()=>{}}={}){
  const roots=new Map(),controllers=[];
  function mount(station,kind){
    const id='jerusalem-life-'+kind;if(!blenderModels[id])return;
    const root=new THREE.Group();root.name=station+'-'+kind;workstations.groups.get(station).add(root);roots.set(station,root);
    controllers.push(attachBlenderObject(root,id,onReady,assetLoader));
  }
  for(const station of ['courtyard-north','courtyard-south'])mount(station,'parcel');
  mount('life-cistern','dipper');
  for(const station of ['life-market-display','life-market-stock'])mount(station,'goods');
  let parcelStation='courtyard-north';
  const resident=actors.find(a=>a.id==='householder'),carrier=actors.find(a=>a.id==='water-carrier'),vendor=actors.find(a=>a.id==='street-vendor');
  const working=a=>a?.state.activity&&!a.state.activity.aligning;
  function update(){
    if(working(resident))parcelStation=resident.state.activity.station;
    for(const station of ['courtyard-north','courtyard-south']){
      const root=roots.get(station);if(root)root.visible=station===parcelStation&&!working(resident)&&!resident?.state.carriedItem;
    }
    const dipper=roots.get('life-cistern');if(dipper)dipper.visible=!(working(carrier)&&carrier.state.activity.clip==='Fill');
    for(const station of ['life-market-display','life-market-stock']){
      const root=roots.get(station);if(root)root.visible=!(working(vendor)&&vendor.state.activity.station===station);
    }
  }
  update();return {roots,ready:Promise.all(controllers.map(c=>c.ready)),update,dispose(){for(const c of controllers)c.dispose();for(const root of roots.values())root.removeFromParent();}};
}

