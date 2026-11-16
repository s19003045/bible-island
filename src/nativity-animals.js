import * as THREE from 'three';
import {createDavidFlock} from './david-animals.js';
// Reuse the authored sheep rig/gait, not a new breed or a biblical animal count.
// Local POI coordinates stay within this translated, level, observation-only pasture.
export const nativityPasture={x1:-42,x2:-25,z1:-42,z2:-18,height:1.1};
export function createNativityFlock(scene,options){
 const group=new THREE.Group();group.name='nativity-original-reading-flock';group.position.set(-6,0,-32);scene.add(group);
 const flock=createDavidFlock(group,options);
 return {...flock,group,offset:[-6,0,-32],dispose(){flock.dispose();group.removeFromParent();}};
}
