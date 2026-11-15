import {explorationFor} from './exploration-data.js';
export const EXPLORATION_KEY='bible-island:exploration:v1';
export function readExploration(storage){
  try{const raw=JSON.parse(storage?.getItem(EXPLORATION_KEY)||'{}'),clean={};
    for(const id of ['tabernacle','jerusalem'])if(Array.isArray(raw[id]))clean[id]=[...new Set(raw[id].filter(key=>explorationFor(id).objects.some(o=>o.id===key)))];
    return clean;
  }catch{return {};}
}
export function observeObject(records,island,id){
  if(!explorationFor(island)?.objects.some(o=>o.id===id))return records;
  return {...records,[island]:[...new Set([...(records[island]||[]),id])]};
}
export function writeExploration(storage,records){try{storage?.setItem(EXPLORATION_KEY,JSON.stringify(records));}catch{}}
