// Three separate narrative times. Coordinates, props and routes are teaching choices.
export const exodusFloor=()=>.03;
export const exodusObjects=[
 {id:'brick-mould',name:'磚模、泥與草料',segment:'bricks',position:[-46,.84,-24],approach:[-46,.03,-22.1],lookAt:[-46,1.12,-24],stop:'bricks',
  description:'用磚模、泥磚與草料的近景理解經文提到的工作。形制、配比、工位與尺寸都是教學示意，不是已確認的出埃及工場或出土原物。',
  observation:'草的供應被取消，磚數卻沒有減少。這些材料如何幫助理解人的負擔，而不是把勞役當成生產競賽？',passage:'Exodus 5:6-19'},
 {id:'passover-kit',name:'無酵餅、行囊與杖',segment:'passover',position:[-35,.68,21],approach:[-35,.03,23.1],lookAt:[-35,1,21],stop:'passover',
  description:'以桌上的無酵餅及預備行路的物件呈現筵席與出發的關係。食物擺法、袋子、桌子和住家格局是教學安排，並非特定家庭的考古復原。',
  observation:'閱讀束腰、穿鞋、拿杖的吩咐，再比較麵未發起與匆忙離開的敘事。哪些是經文明說，哪些是畫面的補足？',passage:'Exodus 12:8-14;12:34;12:39'},
 {id:'crossing-ground',name:'乾地與左右水牆',segment:'crossing',position:[38,.03,0],approach:[38,.03,-2.2],lookAt:[45,2,9.7],viewTarget:[45,2,9.7],stop:'crossing',sceneOnly:true,
  description:'近景以縮小剖面幫助比較乾地、左右水牆與前進方向。水高、通道寬、地面形狀及隊伍間距都是敘事示意，不是經文給出的測量值。',
  observation:'先看正在前進的人，再回到百姓害怕、呼求與走乾地的敘事；不要由模型判定現代海域或精確出埃及路線。',passage:'Exodus 14:10-22;14:29-31'},
];
export const exodusSegments=[
 {id:'bricks',number:1,name:'製磚勞役',reference:'出埃及記 5 章',passage:'Exodus 5',person:'brick-maker',spawn:[-45.7,.03,-18.3],startLookAt:[-46,1.2,-24],
  heading:'看材料，也看人的負擔',intro:'出發之前，先理解草料、磚數與被加重的勞役，留意人承受的負擔。',
  target:[-48,1,-24],overview:[29,23,31],human:{target:[-46,1.3,-24],offset:[12,.4,9]},extent:85,plan:63,
  surfaces:[{id:'brickyard',x1:-70,x2:-30,z1:-42,z2:-4}],region:()=> '製磚勞役區'},
 {id:'passover',number:2,name:'預備出發',reference:'出埃及記 12 章',passage:'Exodus 12',person:'passover-parent',spawn:[-28,.03,35],startLookAt:[-35,1.5,24.5],
  heading:'走進家屋，預備下一段路',intro:'這是預備離開的段落。從門框、筵席與行囊，回讀夜間留在家中的吩咐，再讀後來的出發。',
  target:[-35,1.2,25],overview:[23,17,25],human:{target:[-35,1.3,24.5],offset:[5,.3,8]},extent:75,plan:51,
  surfaces:[{id:'departure-home',x1:-44,x2:-23,z1:16,z2:42}],region:p=>p[2]<24.5&&p[0]<-31&&p[0]>-39?'預備筵席的家屋':'門前與同行準備區'},
 {id:'crossing',number:3,name:'走過乾地',reference:'出埃及記 14 章',passage:'Exodus 14',person:'traveler',spawn:[4,.03,-6.5],startLookAt:[38,2,0],
  heading:'跟著隊伍，看腳下與兩側',intro:'這是第三段的渡海敘事。隊伍持續向前；通道與水牆幫助閱讀，不指定現代座標。',
  target:[38,2,0],overview:[-52,27,40],human:{target:[35,1.7,0],offset:[-24,0,7]},extent:210,plan:120,fogNear:80,fogFar:360,
  surfaces:[{id:'dry-ground',x1:0,x2:100,z1:-8.3,z2:8.3}],region:()=> '海中乾地教學區'},
];
export const exodusSegmentById=new Map(exodusSegments.map(s=>[s.id,s]));
export const exodusSegmentForPerson=id=>exodusSegments.find(s=>s.person===id)?.id;
export const exodusWalkConfig=segment=>{
 const s=exodusSegmentById.get(segment);return s&&{...s,objects:exodusObjects.filter(o=>o.segment===s.id),segments:exodusSegments,segment:s.id,
  title:s.name,shortTitle:`${s.number} / 3 · ${s.name}`,era:`EXODUS / ${s.reference}`,destinations:true,recordedChild:true,teachingInspection:true,
  enter:'開啟聲音，走進本段',inspectionNote:'物件、人物與空間為教學復原；請以經文核對敘事，不由模型推算尺寸或地理。',hint:`${s.reference} · 人物、物件與空間為教學復原。切章表示不同敘事時間與地點。`};
};
const node=(id,name,action,slots,lookAt,tags,weight=1)=>({id,name,action,weight,capacity:slots.length,slots:slots.map(([x,z])=>[x,.03,z]),lookAt,tags,dwell:action==='Interact'?[8,18]:[4,12]});
const labor=['brick-worker','brick-guide'];
export const exodusBrickPOIs=[
 node('brick-mix','和泥工位','Interact',[[-47,-27.7],[-45.6,-27.7]],[-48,-26],labor,2),
 node('brick-moulds','磚模旁','Interact',[[-47,-21.1],[-45.6,-21.1]],[-47,-22],labor,2),
 node('brick-straw','草料堆外','Interact',[[-33.5,-27],[-33.5,-25.6]],[-37,-26],labor),
 node('brick-drying','曬磚處','LookAround',[[-47,-39.5],[-45.6,-39.5]],[-48,-34],labor),
 node('brick-east-rest','工場東側歇腳','Idle',[[-33,-20],[-33,-18.6],[-33,-17.2]],[-46,-24],labor),
 node('brick-east-north','材料往來處','LookAround',[[-33,-8],[-33,-9.4],[-33,-10.8]],[-41,-12],labor),
 node('brick-lane','屋間通道','Idle',[[-46.5,-16],[-46.5,-14.6],[-46.5,-13.2]],[-47,-24],labor),
 node('brick-west-lane','西側工場通道','LookAround',[[-57,-28],[-57,-26.6],[-57,-25.2]],[-52,-25],labor),
 node('brick-west-rest','工場外側停留','Idle',[[-68,-22],[-68,-20.6],[-68,-19.2]],[-58,-22],labor),
 node('brick-north-return','工場邊緣','LookAround',[[-57.5,-6],[-56.1,-6],[-54.7,-6]],[-48,-24],labor),
 node('brick-south-return','曬場旁停留','Idle',[[-58,-40],[-56.6,-40],[-55.2,-40]],[-48,-34],labor),
];
export const exodusHomePOIs=[
 node('home-parent-door','門前的家長','Idle',[[-35,27]],[-35,24.5],['departure-parent']),
 node('home-parent-table','筵席旁的解說','LookAround',[[-36.8,22.5]],[-35,21],['departure-parent']),
 node('home-parent-gather','同行者相聚','Idle',[[-32,29]],[-35,24.5],['departure-parent']),
 node('home-family-room','屋內預備','Interact',[[-37,19],[-33.2,19]],[-35,21],['departure-family']),
 node('home-family-table','桌旁觀察','LookAround',[[-35,23.2]],[-35,21],['departure-family']),
 node('home-family-door','家人到門前','Idle',[[-37,26.7],[-35.6,26.7]],[-35,24.5],['departure-family']),
 node('home-bundles','整理行囊','Interact',[[-31,27],[-29.6,27]],[-32,26],['departure-neighbor']),
 node('home-neighbors','鄰里同行處','Idle',[[-32,32],[-30.6,32],[-29.2,32]],[-35,24.5],['departure-neighbor']),
 node('home-east','門外往來','LookAround',[[-25,29],[-25,30.4],[-25,31.8]],[-35,24.5],['departure-neighbor']),
 node('home-south','巷口停留','Idle',[[-38,38],[-36.6,38],[-35.2,38]],[-35,24.5],['departure-neighbor']),
 node('home-west','門前外側','LookAround',[[-41.2,29],[-41.2,30.4],[-41.2,31.8]],[-35,24.5],['departure-neighbor']),
 node('home-return','同行準備區','Idle',[[-28,39],[-26.6,39],[-25.2,39]],[-35,24.5],['departure-neighbor']),
];
export const exodusHomeAllowed=(a,p)=>a.role!=='departure-neighbor'||p[2]>=25;
export function exodusSpawnCandidates(segment){const s=exodusSegmentById.get(segment),result=[];for(const area of s.surfaces)for(let x=area.x1+1;x<area.x2-1;x+=1.5)for(let z=area.z1+1;z<area.z2-1;z+=1.5)result.push([x,.03,z]);return result;}
// Capacity nodes are ahead along the dry-ground corridor; every NPC reserves its own slot.
export const crossingPOIs=Array.from({length:68},(_,i)=>{
 const x=-16+i*8;return {id:`crossing-${i}`,name:'前方乾地',x,action:'LookAround',weight:1,capacity:5,
  slots:[-5.6,-2.8,0,2.8,5.6].map(z=>[x,.03,z]),lookAt:[x+20,0],dwell:[.2,1.3]};
});
export const crossingNPCSurface=[{id:'forward-corridor',x1:-30,x2:532,z1:-8.3,z2:8.3}];
