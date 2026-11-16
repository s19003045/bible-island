// Mutually exclusive teaching moments. Never display four superposed journeys.
export const davidPhaseIds=['cart','pause','carry','tent'];
export const normalizeDavidPhase=id=>davidPhaseIds.includes(id)?id:'cart';
export function setDavidArtifactPhase(root,phase){
 const selected=normalizeDavidPhase(phase);let found=0;
 for(const id of davidPhaseIds){const group=root.getObjectByName('david-ark-phase-'+id);if(group){group.visible=id===selected;found++;}}
 root.userData.narrativePhase=selected;return found===4;
}
