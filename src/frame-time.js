// Preserve real movement speed down to 4 FPS without replaying long suspension gaps.
// Suspension/hidden time is discarded; visible slow frames use bounded small steps.
export function frameStepSeconds(now,last) {
  if(!Number.isFinite(now)||!Number.isFinite(last)||last<=0)return 0;
  return Math.max(0,Math.min(.25,(now-last)/1000));
}
export function* frameSimulationSteps(dt) {
  let left=Number.isFinite(dt)?Math.max(0,Math.min(.25,dt)):0;
  while(left>1e-8){const step=Math.min(left,1/60);yield step;left-=step;}
}
