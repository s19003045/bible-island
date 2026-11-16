// Authored clothing choices, independent of behaviour seeds, clocks and POIs.
// Every fourth unnamed adult adds visual variety, not a population/gender estimate.
export function residentAppearance(island,options,index,height=1.7) {
  const child=height<1.4,woman=!options.id&&index%4===1;
  if(['jerusalem','herod'].includes(island)) {
    const modelId=options.id==='water-carrier'?'resident-carrier':child?'resident-child':woman?'roman-woman':['stone-worker','street-vendor'].includes(options.id)?'resident-worker':'resident';
    return {modelId,height:!child&&woman?1.64:height};
  }
  if(child)return {modelId:'wilderness-child',height};
  if(island==='tabernacle')return {modelId:options.id==='priest'?'ordinary-priest':woman?'wilderness-woman':'wilderness-resident',height:options.id==='priest'?1.725:woman?1.64:height};
  if(island==='solomon')return {modelId:options.id==='singer'?'temple-singer':options.id==='bronze-worker'?'bronze-artisan':woman?'iron-woman':'iron-resident',height:woman?1.64:height};
  if(island==='exodus') {
    const labor=options.id==='brick-maker'||options.role==='brick-worker';
    return {modelId:labor?'brick-laborer':woman?'wilderness-woman':'wilderness-resident',height:!labor&&woman?1.64:height};
  }
  return {modelId:'resident',height};
}
export const residentClearance=actor=>((actor.modelId==='resident-carrier'||actor.id==='water-carrier')?.49:.33)*(actor.scale??1);
