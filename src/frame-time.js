// Preserve real movement speed down to 1 FPS without replaying long suspension gaps.
// Suspension/hidden time is discarded; visible slow frames use bounded small steps.
export function frameStepSeconds(now,last) {
  if(!Number.isFinite(now)||!Number.isFinite(last)||last<=0)return 0;
  const elapsed=(now-last)/1000;
  return Math.max(0,elapsed>1?.25:elapsed);
}
export function* frameSimulationSteps(dt) {
  const elapsed=Number.isFinite(dt)?Math.max(0,Math.min(1,dt)):0;
  if(!elapsed)return;
  // Equal subdivisions avoid a microscopic remainder after a 16.7ms frame.
  const count=Math.ceil(elapsed*60),step=elapsed/count;
  for(let i=0;i<count;i++)yield step;
}
