import {blenderModels} from '../../src/blender-manifest.js';
export const characterClips=id=>(blenderModels[id].motionVersion>=4?Object.keys(blenderModels[id].lifeClips):blenderModels[id].motionVersion>=2?['Idle','Interact','LookAround','StartWalk','StopWalk','Talk','TurnLeft','TurnRight','Walk']:['Idle','Interact','LookAround','Talk','Walk']).sort();
