import * as THREE from 'three';

// Fit a bounding sphere, so the whole artifact stays visible after ANY rotation.
export function artifactFraming(bounds,aspect=1,fov=35) {
  const box=bounds.isEmpty()?new THREE.Box3(new THREE.Vector3(-.3,0,-.3),new THREE.Vector3(.3,.6,.3)):bounds;
  const center=box.getCenter(new THREE.Vector3()),radius=Math.max(.05,box.getSize(new THREE.Vector3()).length()/2);
  const vertical=fov*Math.PI/360,horizontal=Math.atan(Math.tan(vertical)*Math.max(.1,aspect));
  return {center,radius,distance:radius/Math.sin(Math.min(vertical,horizontal))*1.08};
}

export function setBoardSeparation(root,amount=0) {
  const part=root.getObjectByName('joint-board');if(!part?.parent)return false;
  part.userData.assembledPosition ||= part.position.toArray();
  root.updateWorldMatrix(true,true);
  const up=new THREE.Vector3(0,1,0).transformDirection(root.matrixWorld);
  const destination=part.parent.localToWorld(new THREE.Vector3(...part.userData.assembledPosition)).addScaledVector(up,THREE.MathUtils.clamp(amount,0,.20));
  part.position.copy(part.parent.worldToLocal(destination));part.updateMatrixWorld(true);return true;
}
