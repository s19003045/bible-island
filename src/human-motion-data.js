import {humanRolloutAssets} from './human-rollout-assets.js';
// Anonymous teaching roles, not reconstructions of named historical people.
export const humanMotionProfiles=Object.freeze({
  resident:Object.freeze({speed:1.10,lookAhead:.70,turnRadius:.72,cadenceMin:.82,cadenceMax:1.12,strideMin:.80,strideMax:1.14,headLimit:.65,torsoLimit:.12,clothResponse:.08}),
  carrier:Object.freeze({speed:.91,lookAhead:.64,turnRadius:.84,cadenceMin:.85,cadenceMax:1.10,strideMin:.85,strideMax:1.10,headLimit:.55,torsoLimit:.055,clothResponse:.045}),
  elder:Object.freeze({speed:.76,lookAhead:.60,turnRadius:.70,cadenceMin:.85,cadenceMax:1.10,strideMin:.82,strideMax:1.10,headLimit:.55,torsoLimit:.09,clothResponse:.055}),
  child:Object.freeze({speed:.87,lookAhead:.50,turnRadius:.55,cadenceMin:.85,cadenceMax:1.18,strideMin:.80,strideMax:1.14,headLimit:.65,torsoLimit:.12,clothResponse:.07}),
  bearer:Object.freeze({speed:.80,lookAhead:.70,turnRadius:.90,cadenceMin:.85,cadenceMax:1.10,strideMin:.85,strideMax:1.10,headLimit:.45,torsoLimit:0,clothResponse:.025,idleShift:0}),
});
export const jerusalemPilotRoles=Object.freeze({
  householder:Object.freeze({modelId:'jerusalem-resident',motionProfile:'resident',before:'resident',label:'一般居民'}),
  'water-carrier':Object.freeze({modelId:'jerusalem-carrier',motionProfile:'carrier',before:'resident-carrier',label:'提水居民'}),
  'street-vendor':Object.freeze({modelId:'jerusalem-elder',motionProfile:'elder',before:'resident-worker',label:'年長商販'}),
});
// A long robe can require a shorter authored stride. Match the motor to that
// actual capture distance before applying each person's 0.85–1.15 variance.
const modelProfiles=Object.fromEntries(Object.entries(humanRolloutAssets).map(([id,d])=>{
  const profile=humanMotionProfiles[d.motionProfile];
  return [id,Object.freeze({...profile,speed:Math.min(profile.speed,d.cycleDistance/d.walkDuration)})];
}));
export const humanProfileFor=actor=>modelProfiles[actor.modelId]||humanMotionProfiles[actor.motionProfile]||null;
export const upgradedModelFor=base=>humanRolloutAssets['human-'+base]?'human-'+base:base;
export function upgradedAppearance(appearance){
  const modelId=upgradedModelFor(appearance.modelId),definition=humanRolloutAssets[modelId];
  return definition?{...appearance,modelId,motionProfile:definition.motionProfile}:appearance;
}
