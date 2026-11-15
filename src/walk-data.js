// A public, bounded neighbourhood. These paths are teaching routes, not a surveyed ancient street map.
export const walkSurfaces = [
  {id:'street',x1:-74,x2:26,z1:-2.2,z2:2.2},
  {id:'north',x1:-73,x2:24,z1:-17.15,z2:-14.85},
  {id:'south',x1:-73,x2:24,z1:28.85,z2:31.15},
  ...[-58,-42,-26,-10].map(x=>({id:`alley${x}`,x1:x-.78,x2:x+.78,z1:-17,z2:31})),
  {id:'courtyard',x1:-35.15,x2:-32.85,z1:22,z2:30.8},
];
export const walkSpawn = [20,8.025,0];
export function walkFloor(x,z) {
  return Math.max(8+Math.max(0,-x)*.065+.025,7+Math.max(0,-x)*.07+Math.sin(z*.025)*1.4+.04);
}
export const vesselDefinitions = [
  {id:'clay-vessel',name:'陶製水罐',material:'陶土',position:[-33.7,10.96,25.6],
    description:'留意罐腹、窄頸與提耳。這件是協助觀察古代盛裝器物的類型模型，並非某件出土器物的精確複製。',
    observation:'旋轉看看：窄頸與寬腹，可能怎樣影響盛裝與搬運？僅憑外形，不能斷定它只用來盛水。'},
  {id:'stone-vessel',name:'石製器皿',material:'淺色石材',position:[-33.15,10.96,25.6],
    description:'第二聖殿晚期耶路撒冷出土許多石製器皿，研究將它們與潔淨觀念聯繫。此模型只呈現材質與器形比較。',
    observation:'比較陶器與石器的表面、口緣及厚度。器皿提供生活線索，不能單靠它認定屋主是誰。'},
];
export const missionSteps = [
  {id:'listen',title:'找居民，聽聽山城的路',hint:'走近提水的居民，問「耶路撒冷為什麼有那麼多上下坡？」',target:{type:'person',id:'water-carrier',position:[0,8.025,0]}},
  {id:'observe',title:'到院落，比較兩件器皿',hint:'沿巷弄到院落，拿起陶器與石器，各自旋轉觀察。',target:{type:'object',id:'clay-vessel',position:[-34.7,10.28,27.6]}},
  {id:'ask',title:'向住戶請教家屋差異',hint:'與院落住戶交談，問院子的用途，再追問是否每個家庭都有這麼大的房子。',target:{type:'person',id:'householder',position:[-34.7,10.28,26.8]}},
  {id:'reflect',title:'留下你的觀察',hint:'完成一個問題，將場景中的發現連回資料依據。',target:null},
];
export const freshMission = () => ({listen:false,observed:[],ask:false,complete:false});
export function missionStage(m) {return !m.listen?0:m.observed.length<2?1:!m.ask?2:m.complete?4:3;}
export function missionEvent(m,event) {
  const next={...m,observed:[...m.observed]};
  if(event.type==='answer'&&event.person==='water-carrier'&&event.topic==='hills')next.listen=true;
  if(event.type==='inspect'&&vesselDefinitions.some(v=>v.id===event.id))next.observed=[...new Set([...next.observed,event.id])];
  if(event.type==='answer'&&event.person==='householder'&&event.topic==='courtyard'&&event.followup)next.ask=true;
  if(event.type==='reflect'&&event.correct&&missionStage(next)===3)next.complete=true;
  return next;
}
