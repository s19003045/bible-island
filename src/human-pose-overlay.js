import * as THREE from 'three';

// Explicitly masked, authored upper-body poses. They are sampled after the base
// locomotion mixer, so carrying cannot dilute the legs' planted gait or blend a
// second root translation into the collision-authoritative path.
export function createPoseOverlay(root,clip,boneNames){
  if(!clip)return ()=>{};
  const allowed=new Set(boneNames||[]),tracks=[];
  for(const track of clip.tracks){
    const binding=THREE.PropertyBinding.parseTrackName(track.name),name=binding.nodeName;
    if(!allowed.has(name)||/^(root|hips|thigh|shin|foot|toe|eye|lid)/.test(name))continue;
    const bone=root.getObjectByName(name),property=bone?.[binding.propertyName];
    if(!property?.fromArray)continue;
    tracks.push({property,quaternion:binding.propertyName==='quaternion',interpolant:track.createInterpolant()});
  }
  return (time,weight=1)=>{
    const t=((time%clip.duration)+clip.duration)%clip.duration;
    for(const track of tracks){
      const value=track.interpolant.evaluate(t);
      if(weight>=1)track.property.fromArray(value);
      else if(track.quaternion)track.property.slerp(new THREE.Quaternion().fromArray(value),weight);
      else track.property.lerp(new THREE.Vector3().fromArray(value),weight);
    }
  };
}
