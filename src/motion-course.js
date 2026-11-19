import {createNPCSystem} from './npc-system.js';
import {createWalkModel} from './walk-model.js';
import {createMotion} from './people-motion.js';
import {residentClearance} from './resident-appearance.js';
import {beginDialogueLine,advanceDialogue} from './dialogue-performance.js';

export const motionScenarios={straight:'街道直行',curve:'繞過街角',turn:'停步折返',stairs:'階梯上落',avoid:'與居民錯身',talk:'停下交談',hands:'站姿與雙手'};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
// Both visual versions observe one motor with real POI reservations and steering.
export function createMotionCourse(actor,scenario='straight'){
  const stairs=scenario==='stairs',curve=scenario==='curve';
  const floor=(_x,z)=>stairs?clamp((z+1.2)/2.4,0,1)*.54:0;
  const footFloor=(_x,z)=>stairs?Math.ceil(clamp((z+1.2)/2.4,0,1)*6-1e-7)*.09:0;
  const boxes=curve?[{min:[-.8,0,-.75],max:[.8,2,.75]}]:[];
  const model=createWalkModel(boxes,[{x1:-3,x2:3,z1:-4,z2:4}],floor,{navigationStep:.3});
  actor.state=createMotion([0,0,-2.6],0);
  actor.collisionRadius??=residentClearance(actor);
  const poi=(id,x,z)=>({id,name:id,action:'LookAround',weight:1,capacity:1,slots:[[x,floor(x,z),z]],lookAt:[x,z+2],dwell:scenario==='turn'?[1.8,2.1]:[.8,1.1],tags:['resident']});
  const pois=[poi('north',0,2.6),poi('south',0,-2.6)];
  const extra=scenario==='avoid'?{id:'crossing-neighbour',modelId:'resident',state:createMotion([.16,0,.1],Math.PI)}:null;
  const system=createNPCSystem({actors:extra?[actor,extra]:[actor],pois,model,seed:8821,spawnExclusion:null,naturalMotion:true,socialProbability:0,allowRetreat:true,anticipation:/^jerusalem-life-/.test(actor.modelId)});
  const a=system.agents[0];a.timer=scenario==='hands'?Infinity:.15;a.lane=0;
  // The stationary partner gives both versions the same separation obstacle.
  if(extra)extra.state.talking=true;
  let age=0;
  return {system,actor,extra,boxes,floor,footFloor,
    update(dt){age+=dt;const talking=scenario==='talk'&&age%17>6&&age%17<10;if(talking&&!actor.state.talking)beginDialogueLine(actor,'請留意我的行走與停步。','greeting');actor.state.talking=talking;advanceDialogue(actor,dt);system.update(dt,{camera:[1.5,1.6,0]});},
    dispose(){system.dispose();},
  };
}
