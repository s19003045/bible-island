// Authored clothing choices, independent of behaviour seeds, clocks and POIs.
// Every fourth unnamed adult adds visual variety, not a population/gender estimate.
export function residentAppearance(island,options,index,height=1.7) {
  const child=height<1.4,woman=!options.id&&index%4===1;
  if(['jerusalem','herod'].includes(island)) {
    const modelId=options.id==='water-carrier'?'resident-carrier':child?'resident-child':woman?'roman-woman':['stone-worker','street-vendor'].includes(options.id)?'resident-worker':'resident';
    return {modelId,height:!child&&woman?1.64:height};
  }
  if(island==='nativity'){const female=woman||options.id==='nativity-home-resident';return {modelId:child?'resident-child':female?'roman-woman':options.id==='nativity-work-resident'?'resident-worker':'resident',height:child?height:female?1.64:height};}
  if(island==='intertestament'){const female=woman||options.id==='intertestament-coin-resident';return {modelId:child?'resident-child':female?'roman-woman':options.id==='intertestament-road-resident'?'resident-worker':'resident',height:child?height:female?1.64:height};}
  if(island==='nehemiah'){const female=woman||options.id==='nehemiah-listening-resident';return {modelId:child?'return-child':female?'return-woman':options.id==='nehemiah-watch-resident'?'return-elder':'return-mason',height:child?height:female?1.65:height};}
  if(island==='exile'){const female=woman||options.id==='exile-waterbank-resident';return {modelId:child?'wilderness-child':female?'iron-woman':'iron-resident',height:child?height:female?1.64:height};}
  if(island==='kingdoms'){const female=woman||options.id==='kingdoms-assembly-resident';return {modelId:child?'wilderness-child':female?'iron-woman':'iron-resident',height:child?height:female?1.64:height};}
  if(island==='david'){const female=woman||options.id==='david-pasture-resident';return {modelId:child?'wilderness-child':options.id==='david-building-resident'?'bronze-artisan':female?'iron-woman':'iron-resident',height:child?height:female?1.64:height};}
  if(island==='judges'){const female=woman||options.id==='ruth-field-resident';return {modelId:child?'wilderness-child':female?'wilderness-woman':'wilderness-resident',height:child?height:female?1.64:height};}
  if(island==='sinai'){const female=woman||options.id==='sinai-camp-parent';return {modelId:child?'wilderness-child':female?'wilderness-woman':'wilderness-resident',height:child?height:female?1.64:height};}
  if(island==='joseph'){const female=woman||options.id==='joseph-family-host',road=options.id==='joseph-road-traveler'||options.wardrobe==='caravan';return {modelId:child?'wilderness-child':road?(female?'camp-host':'caravan-traveler'):female?'egypt-householder':'egypt-grain-worker',height:child?height:female?1.64:height};}
  if(island==='abraham'){const female=woman||options.id==='abraham-camp-host';return {modelId:child?'wilderness-child':female?'camp-host':options.id==='abraham-well-keeper'?'well-keeper':'patriarch-traveler',height:child?height:female?1.64:height};}
  if(island==='paul'){const female=woman||options.id==='paul-cloth-trader';return {modelId:child?'resident-child':options.id==='paul-port-worker'?'port-worker':options.id==='paul-metal-worker'?'asian-artisan':female?'paul-trader':index%3===0?'resident-worker':'resident',height:child?height:female?1.64:height};}
  if(island==='second-temple'){const female=woman||options.id==='return-parent';return {modelId:child?'return-child':options.id==='return-elder'?'return-elder':female?'return-woman':'return-mason',height:child?height:female?1.64:height};}
  if(child)return {modelId:'wilderness-child',height};
  if(island==='jordan'){const female=woman||options.id==='jordan-parent';return {modelId:options.role==='ark-bearer'?'priest-bearer':options.id==='jordan-priest'?'ordinary-priest':female?'wilderness-woman':'wilderness-resident',height:options.role==='ark-bearer'?1.735:female?1.64:height};}
  if(island==='tabernacle')return {modelId:options.id==='priest'?'ordinary-priest':woman?'wilderness-woman':'wilderness-resident',height:options.id==='priest'?1.725:woman?1.64:height};
  if(island==='solomon')return {modelId:options.id==='singer'?'temple-singer':options.id==='bronze-worker'?'bronze-artisan':woman?'iron-woman':'iron-resident',height:woman?1.64:height};
  if(island==='exodus') {
    const labor=options.id==='brick-maker'||options.role==='brick-worker';
    return {modelId:labor?'brick-laborer':woman?'wilderness-woman':'wilderness-resident',height:!labor&&woman?1.64:height};
  }
  return {modelId:'resident',height};
}
export const residentClearance=actor=>((actor.modelId==='resident-carrier'||actor.id==='water-carrier')?.49:.33)*(actor.scale??1);
