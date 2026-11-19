import {blenderModels} from './blender-manifest.js';

const labels={resident:'一般居民','resident-worker':'工匠','resident-child':'兒童','resident-carrier':'提水居民','roman-woman':'長衣居民','wilderness-resident':'營地居民','wilderness-woman':'營地長衣居民','wilderness-child':'營地兒童','ordinary-priest':'一般祭司','iron-resident':'長衣居民','iron-woman':'長衣居民','temple-singer':'歌唱者','bronze-artisan':'銅作工匠','brick-laborer':'製磚居民','return-mason':'建造工匠','return-elder':'長者','return-woman':'長衣居民','return-child':'兒童','port-worker':'港口工作者','paul-trader':'布料商販','asian-artisan':'工匠','patriarch-traveler':'旅人','camp-host':'營地主人','well-keeper':'井旁居民','caravan-traveler':'商隊旅人','egypt-grain-worker':'穀物工作者','egypt-householder':'住居居民'};
const pilotBefore={'jerusalem-resident':'resident','jerusalem-carrier':'resident-carrier','jerusalem-elder':'resident-worker'};
const lifeLabels={'jerusalem-life-resident':'一般居民 · 生活精修','jerusalem-life-carrier':'提水居民 · 生活精修','jerusalem-life-elder':'年長商販 · 生活精修'};
export function motionRolesForActors(actors=[]){
 const result={};
 for(const actor of [...actors].sort((a,b)=>Number(!!b.id)-Number(!!a.id))){
  const d=blenderModels[actor.modelId];if(!d||d.motionVersion<3||actor.role==='ark-bearer')continue;
  const before=d.baseModelId||pilotBefore[actor.modelId];if(!before||result[actor.modelId])continue;
  result[actor.modelId]={before,after:actor.modelId,profile:d.motionProfile,label:lifeLabels[actor.modelId]||(actor.modelId==='jerusalem-elder'?'年長商販':labels[before]||'居民')};
 }
 return result;
}
