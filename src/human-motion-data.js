// Jerusalem pilot only. These are anonymous teaching roles, not reconstructions
// of named historical people's appearance, age or manner of walking.
export const humanMotionProfiles=Object.freeze({
  resident:Object.freeze({speed:1.10,lookAhead:.70,turnRadius:.72,cadenceMin:.82,cadenceMax:1.12,strideMin:.80,strideMax:1.14,headLimit:.65,torsoLimit:.12,clothResponse:.08}),
  carrier:Object.freeze({speed:.91,lookAhead:.64,turnRadius:.84,cadenceMin:.85,cadenceMax:1.10,strideMin:.85,strideMax:1.10,headLimit:.55,torsoLimit:.055,clothResponse:.045}),
  elder:Object.freeze({speed:.76,lookAhead:.60,turnRadius:.70,cadenceMin:.85,cadenceMax:1.10,strideMin:.82,strideMax:1.10,headLimit:.55,torsoLimit:.09,clothResponse:.055}),
});
export const jerusalemPilotRoles=Object.freeze({
  householder:Object.freeze({modelId:'jerusalem-resident',motionProfile:'resident',before:'resident',label:'一般居民'}),
  'water-carrier':Object.freeze({modelId:'jerusalem-carrier',motionProfile:'carrier',before:'resident-carrier',label:'提水居民'}),
  'street-vendor':Object.freeze({modelId:'jerusalem-elder',motionProfile:'elder',before:'resident-worker',label:'年長商販'}),
});
export const humanProfileFor=actor=>humanMotionProfiles[actor.motionProfile]||null;
