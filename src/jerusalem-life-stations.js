import * as THREE from 'three';
import {walkFloor,stairCollisionProxies} from './walk-data.js';
import {jerusalemPOIs} from './npc-pois.js';
import {createNPCActivities} from './npc-activities.js';

// Teaching placements in the existing public neighbourhood, not excavated
// coordinates or a reconstruction of a named person's home / shop.
export const lifeStations=Object.freeze([
  {id:'courtyard-north',label:'院落整理桌',role:'householder',kind:'counter',x:-34,z:23.2,yaw:Math.PI/2,existing:true},
  {id:'courtyard-south',label:'院落收納處',role:'householder',kind:'counter',x:-34.5,z:29.5,yaw:Math.PI/2,existing:true},
  {id:'life-cistern',label:'儲水取用處',role:'carrier',kind:'cistern',x:-7,z:1.1,yaw:0},
  {id:'life-water-delivery',label:'街旁供水處',role:'carrier',kind:'delivery',x:-15,z:1.1,yaw:0},
  {id:'life-market-display',label:'器皿展示攤',role:'vendor',kind:'counter',x:-55.8,z:.9,yaw:0},
  {id:'life-market-stock',label:'攤邊整理處',role:'vendor',kind:'counter',x:-51.6,z:.9,yaw:0},
].map(s=>Object.freeze({...s,y:walkFloor(s.x,s.z)+.04})));

export function stationPoint(station,[x,y,z]) {
  return [station.x+x*Math.cos(station.yaw)+z*Math.sin(station.yaw),station.y+y,station.z-x*Math.sin(station.yaw)+z*Math.cos(station.yaw)];
}
export const lifeStationProxies=lifeStations.map(s=>({id:s.id+'-work-pad',kind:'landing',x1:s.x-.72,x2:s.x+.72,z1:s.z-.65,z2:s.z+.65,
  axis:'z',start:s.z-.65,end:s.z+.65,baseHeight:s.y,rise:0}));
export const lifeGroundProxies=[...lifeStationProxies,...stairCollisionProxies];
export function lifeFloor(x,z) {
  const pad=lifeStationProxies.find(p=>x>=p.x1&&x<=p.x2&&z>=p.z1&&z<=p.z2);
  return pad?pad.baseHeight:walkFloor(x,z);
}
export function lifePOIs(){
  const all=jerusalemPOIs.map(p=>({...p,slots:p.slots.map(([x,,z])=>[x,lifeFloor(x,z),z])}));
  for(const s of lifeStations.filter(s=>!s.existing))all.push({id:s.id,name:s.label,action:'Interact',weight:1,capacity:1,
    slots:[[s.x,s.y,s.z]],lookAt:stationPoint(s,[0,0,1]).filter((_,i)=>i!==1),tags:[s.role],dwell:[3,6]});
  return all;
}

const phase=(id,clip,duration,label,prop=null)=>({id,clip,duration,label,prop});
export function createJerusalemActivities(options={}){
  const stop=(id,phases)=>{const s=lifeStations.find(s=>s.id===id);return {pois:[id],target:stationPoint(s,[0,.75,.45]),phases};};
  const receive=()=>({...phase('receive','Receive',3.1,'拿起物品','parcel'),carry:{id:'parcel',clip:'CarrySmall'}});
  const place=()=>({...phase('place','PlaceSmall',3.1,'放妥物品','parcel'),carry:null});
  return createNPCActivities({
    householder:{id:'household-errand',stops:[
      stop('courtyard-north',actor=>[...(actor.state.carriedItem?[place()]:[]),phase('inspect','Inspect',3.4,'查看物品'),receive()]),
      stop('courtyard-south',[place(),phase('rest','Listen',4.8,'稍作停留'),receive()]),
    ]},
    'water-carrier':{id:'water-delivery',stops:[
      stop('life-cistern',[phase('set-down','SetDown',3.6,'放下水罐','jug'),phase('fill','Fill',4.8,'盛取儲水','jug-ground'),phase('pick-up','PickUp',3.4,'提起水罐','jug')]),
      stop('life-water-delivery',[phase('pour','Pour',2.8,'倒水供用','jug')]),
    ]},
    'street-vendor':{id:'market-work',stops:[
      stop('life-market-display',[phase('arrange','Arrange',4.6,'整理器皿'),phase('offer','Offer',3.4,'展示器皿'),phase('listen','Listen',4.8,'留意來往的人')]),
      stop('life-market-stock',[phase('arrange-stock','Arrange',4.6,'整理備用品')]),
    ]},
  },options);
}

export {lifeHistoricalNote} from './jerusalem-life-content.js';

// Modest level work pads make the authored prop contact plane identical to the
// physical ground, including the jug bottom. They are visible stone, not an
// invisible correction which lifts a prop above a sloping street.
export function buildLifeStations(scene,palette){
  const groups=new Map(),boxes=[];
  for(const s of lifeStations){
    const root=new THREE.Group();root.name=s.id;root.position.set(s.x,s.y,s.z);root.rotation.y=s.yaw;scene.add(root);groups.set(s.id,root);
    const mesh=(name,geometry,material,position)=>{const m=new THREE.Mesh(geometry,material);m.name=name;m.position.fromArray(position);m.castShadow=true;m.receiveShadow=true;root.add(m);return m;};
    mesh('level-work-pad',new THREE.BoxGeometry(1.44,.12,1.3),palette.stone,[0,-.06,0]);
    if(s.kind==='counter'){
      mesh('working-counter',new THREE.BoxGeometry(.8,.065,.24),palette.wood,[0,.7175,.45]);
      for(const x of [-.32,.32])mesh('counter-leg',new THREE.BoxGeometry(.07,.70,.07),palette.wood,[x,.35,.45]);
      const points=[stationPoint(s,[-.4,0,.33]),stationPoint(s,[.4,.76,.57])];
      boxes.push({min:points[0].map((v,i)=>Math.min(v,points[1][i])),max:points[0].map((v,i)=>Math.max(v,points[1][i]))});
    }else{
      // An open small basin for drawing / receiving water. Its actual dipped
      // vessel is mounted from the same exported geometry as the character.
      const basin=new THREE.LatheGeometry([new THREE.Vector2(.055,0),new THREE.Vector2(.105,.07),new THREE.Vector2(.12,.11),new THREE.Vector2(.105,.11),new THREE.Vector2(.09,.075),new THREE.Vector2(.045,.02)],32);
      const [bx,bz]=s.kind==='delivery'?[.24,.45]:[-.20,.40];
      mesh('water-basin',basin,palette.terra,[bx,.45,bz]);
      const water=mesh('basin-water',new THREE.CircleGeometry(.094,32),palette.water,[bx,.52,bz]);water.rotation.x=-Math.PI/2;
      mesh('basin-stone-support',new THREE.BoxGeometry(.18,.45,.18),palette.stone,[bx,.225,bz]);
      const points=[stationPoint(s,[bx-.12,0,bz-.12]),stationPoint(s,[bx+.12,.57,bz+.12])];
      boxes.push({min:points[0].map((v,i)=>Math.min(v,points[1][i])),max:points[0].map((v,i)=>Math.max(v,points[1][i]))});
    }
  }
  return {groups,boxes};
}
