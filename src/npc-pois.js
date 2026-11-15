import {walkFloor} from './walk-data.js';
// Typological first-century activities, placed on the existing public navigation mesh.
// Slots are explicit standing places: a reservation includes travel AND dwell time.
const poi=(id,name,action,weight,slots,lookAt,tags=['resident','carrier','vendor'])=>({
  id,name,action,weight,capacity:slots.length,slots:slots.map(([x,z])=>[x,walkFloor(x,z),z]),lookAt,
  tags:tags.includes('resident')?['resident','carrier',...(slots[0][1]<-8?['resident-north']:slots[0][1]>20?['resident-south']:['resident-street','vendor'])]:tags,
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

// Most residents have local errands; a few travellers connect the neighbourhoods.
// The first frame is authored across the three streets, before any NPC is visible.
export function prepareJerusalemResidents(actors,model){
  const background=actors.filter(a=>!a.id);
  background.forEach((a,i)=>{
    const zone=i<12?'north':i<24?'south':i<45?'street':'roaming',index=i<12?i:i<24?i-12:i-24;
    const x=zone==='north'||zone==='south'?-68+index*7.5:zone==='street'?-69+index*4.35:-44+(i-45)*26,z=zone==='north'?-16:zone==='south'?30:((index%2)*2-1)*1.1;
    a.role=zone==='roaming'?'resident':`resident-${zone}`;a.state.position=[x,model.heightAt(x,z),z];
  });
}
export function jerusalemAllowed(a,p,model){
  if(Math.abs(p[1]-model.heightAt(p[0],p[2]))>=.06)return false;
  return a.role==='resident-street'?Math.abs(p[2])<=2.2:a.role==='resident-north'?Math.abs(p[2]+16)<=1.2:a.role==='resident-south'?Math.abs(p[2]-30)<=1.2:true;
}
