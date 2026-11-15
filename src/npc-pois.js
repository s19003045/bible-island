import {walkFloor} from './walk-data.js';
// Typological first-century activities, placed on the existing public navigation mesh.
// Slots are explicit standing places: a reservation includes travel AND dwell time.
const poi=(id,name,action,weight,slots,lookAt,tags=['resident','carrier','vendor'])=>({
  id,name,action,weight,capacity:slots.length,slots:slots.map(([x,z])=>[x,walkFloor(x,z),z]),lookAt,tags,
  dwell:action==='Interact'?[7,15]:action==='LookAround'?[4,10]:[3,8],
});
export const jerusalemPOIs=[
  poi('west-rest','上坡歇腳處','Idle',1.1,[[-70,-1.1],[-70,.1],[-70,1.3]],[-74,0]),
  poi('olive-view','望向屋旁橄欖樹','LookAround',1,[[-63.6,1.6],[-62.4,1.6]],[-62,4]),
  poi('market-west','西側器皿攤前','Interact',1.6,[[-55,1.3],[-53.8,1.3],[-52.6,1.3]],[-54,5.2]),
  poi('market-east','東側器皿攤前','Interact',1.5,[[-50,1.3],[-48.8,1.3]],[-49,5.2]),
  poi('merchant-corner','街角招呼處','Idle',1.2,[[-42.6,1.2],[-41.4,1.2]],[-42,4]),
  poi('street-shade','街旁停步處','LookAround',1,[[-32,-1.2],[-30.8,-1.2]],[-32,-4]),
  poi('crossroads','中段路口','Idle',1.2,[[-21,1.2],[-19.8,1.2]],[-21,6]),
  poi('gate-view','城門方向','LookAround',.8,[[21,-1.2],[22.2,-1.2],[23.4,-1.2]],[30,0]),
  poi('lower-rest','下坡歇腳處','Idle',1.2,[[7,-1.2],[8.2,-1.2],[9.4,-1.2]],[10,-5]),
  poi('doorway-view','街屋門前','LookAround',1,[[-4,-1.2],[-2.8,-1.2],[-1.6,-1.2]],[-3,-5]),
  poi('east-shade','入口街旁','Idle',.9,[[15,1.2],[16.2,1.2],[17.4,1.2]],[16,5]),
  poi('north-west','北巷轉角','LookAround',.7,[[-59,-16],[-57.8,-16]],[-59,-20]),
  poi('north-east','北巷屋前','Idle',.7,[[-12,-16],[-10.8,-16]],[-12,-20]),
  poi('north-middle','北巷鄰里','LookAround',.8,[[-40,-16],[-38.8,-16],[-37.6,-16]],[-39,-20]),
  poi('north-rest','北巷坡邊','Idle',.7,[[-28,-16],[-26.8,-16],[-25.6,-16]],[-27,-20]),
  poi('north-entry','北巷入口','LookAround',.6,[[4,-16],[5.2,-16],[6.4,-16]],[5,-20]),
  poi('south-west','南巷歇腳處','Idle',.8,[[-57,30],[-55.8,30]],[-57,35]),
  poi('south-middle','南巷屋前','LookAround',.8,[[-47,30],[-45.8,30],[-44.6,30]],[-46,35]),
  poi('south-east','南巷樹影','Idle',.7,[[-3,30],[-1.8,30],[-.6,30]],[-2,35]),
  poi('south-entry','南巷轉角','LookAround',.6,[[12,30],[13.2,30],[14.4,30]],[13,35]),
  poi('water-view','儲水設施方向','LookAround',1,[[-15,30],[-13.8,30]],[-13,35]),
  poi('courtyard-north','院落器物旁','Interact',1,[[-34,23.2]],[-33.4,25.6],['householder']),
  poi('courtyard-door','院落房門前','LookAround',1,[[-34.6,26.8]],[-38,26.8],['householder']),
  poi('courtyard-south','院落入口','Idle',1,[[-34.5,29.5]],[-34,24],['householder']),
];
