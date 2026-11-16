import * as THREE from 'three';

// Fit a bounding sphere, so the whole artifact stays visible after ANY rotation.
export function artifactFraming(bounds,aspect=1,fov=35) {
  const box=bounds.isEmpty()?new THREE.Box3(new THREE.Vector3(-.3,0,-.3),new THREE.Vector3(.3,.6,.3)):bounds;
  const center=box.getCenter(new THREE.Vector3()),radius=Math.max(.05,box.getSize(new THREE.Vector3()).length()/2);
  const vertical=fov*Math.PI/360,horizontal=Math.atan(Math.tan(vertical)*Math.max(.1,aspect));
  return {center,radius,distance:radius/Math.sin(Math.min(vertical,horizontal))*1.08};
}

export function setArtifactSeparation(root,partName,offset) {
  const part=root.getObjectByName(partName);if(!part?.parent)return false;
  part.userData.assembledPosition ||= part.position.toArray();
  root.updateWorldMatrix(true,true);
  const translation=new THREE.Vector3(...offset).applyQuaternion(root.getWorldQuaternion(new THREE.Quaternion()));
  const destination=part.parent.localToWorld(new THREE.Vector3(...part.userData.assembledPosition)).add(translation);
  part.position.copy(part.parent.worldToLocal(destination));part.updateMatrixWorld(true);return true;
}
export function setBoardSeparation(root,amount=0){return setArtifactSeparation(root,'joint-board',[0,THREE.MathUtils.clamp(amount,0,.20),0]);}
export function setArtifactReadingLayer(root,partName,visible){const part=root.getObjectByName(partName);if(!part)return false;part.visible=!!visible;return true;}
