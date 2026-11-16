// Public teaching routes, not a claim about any ancient visitor's access rights.
export const tabernacleFloor = () => .02;
export const tabernacleSurfaces = [
  {id:'camp',x1:24,x2:55,z1:-22,z2:22},
  {id:'entrance',x1:20,x2:26,z1:-1.65,z2:1.65},
  {id:'court-observation',x1:.5,x2:22,z1:-9.4,z2:9.4},
];
export const tabernacleSpawn = [26,.02,0];
const node=(id,name,action,slots,lookAt,tags,weight=1)=>({id,name,action,weight,capacity:slots.length,
  slots:slots.map(([x,z])=>[x,.02,z]),lookAt,tags,dwell:action==='Interact'?[8,17]:[4,11]});
export const tabernaclePOIs = [
  node('weaving','織作材料旁','Interact',[[29.2,5],[30.4,5]],[31,6],['weaver'],2),
  node('thread','整理織線','Interact',[[32,4],[33.2,4]],[32,6],['weaver']),
  node('craft-rest','工位旁歇息','LookAround',[[28,7]],[31,6],['weaver']),
  node('priest-basin','洗濯盆旁準備','Interact',[[6,-2.2]],[4,0],['priest'],2),
  node('priest-altar','祭壇側邊','LookAround',[[9,-3],[14,-3]],[12,0],['priest']),
  node('priest-prepare','外院準備處','Idle',[[3,-4]],[0,0],['priest']),
  node('family-supplies','家用器物旁','Interact',[[28,-7],[29.3,-7]],[31,-6],['parent','resident']),
  node('family-rest','營地歇腳處','Idle',[[33,-10],[34.3,-10]],[30,-7],['parent','resident']),
  node('family-view','望向院幕','LookAround',[[26,-9],[26,-10.3]],[22,0],['parent','resident']),
  node('camp-north','北側帳棚前','LookAround',[[29,13],[30.3,13],[31.6,13]],[32,17],['resident']),
  node('camp-south','南側生活區','Interact',[[29,-12],[30.3,-12],[31.6,-12]],[32,-18],['resident']),
  node('camp-east','東側通道','Idle',[[42,-5],[42,-6.3],[42,-7.6]],[38,-10],['resident']),
  node('camp-shade','帳棚旁停留','Idle',[[42,8],[43.3,8],[44.6,8]],[43,12],['resident']),
  node('camp-center','營地往來','LookAround',[[37,3],[38.3,3],[39.6,3]],[31,6],['resident']),
  node('camp-gather','鄰里相遇處','Idle',[[36,-6],[37.3,-6],[38.6,-6]],[33,-6],['resident']),
  node('camp-east-rest','東側歇腳處','Idle',[[48,9],[49.3,9],[50.6,9]],[46,4],['resident']),
  node('camp-east-south','東側生活通道','LookAround',[[48,-12],[49.3,-12],[50.6,-12]],[46,-10],['resident']),
  node('camp-return','營地入口旁','LookAround',[[26,3],[26,4.3],[26,5.6]],[23,0],['resident']),
];
export const tabernacleObjects = [
  {id:'woven-sample',name:'織物與染線',position:[31,.84,6],approach:[31,.02,4.3],lookAt:[31,1.2,6],stop:'incense',
    description:'以放大的經緯交錯和染線比較材料與工序。框架與粗線是現代教具，不表示細麻原來的線徑或織造機具；色澤與織法也不是古代原物的精確復原。',
    observation:'轉動看看線的交錯與不同顏色。經文提到哪些材料？哪些細節是模型補足的？',passage:'Exodus 35:20-35;26:1-14'},
  {id:'board-joint',name:'板架與座的接合示意',position:[31,.84,-6],approach:[31,.02,-4.3],lookAt:[31,1.25,-6],stop:'ark',
    description:'只展示板架下段、兩個榫與兩個銀座，不是整塊十肘長板的等比縮小。局部金覆面打開，讓你比較木芯與包金；卯孔形狀、截短的閂與拆合距離都是教學安排。這不是考古出土原物，也沒有搬出原來的會幕構件。',
    observation:'比較板、榫與座如何配合。可拆卸的構造，會如何影響搬運與安營？',passage:'Exodus 26:15-30;Numbers 4'},
  {id:'tabernacle-basin',name:'洗濯盆近景',position:[4,.93,0],modelPosition:[4,0,0],approach:[4,.02,2],lookAt:[4,1.4,0],stop:'basin',sceneOnly:true,
    description:'會幕洗濯盆與後來所羅門聖殿的銅海不同。經文沒有交代這個盆的完整尺寸，畫面外形屬示意。',
    observation:'看器物位置，再查供職前洗手洗腳的規定；不要由盆的外形推定經文未提供的尺寸。',passage:'Exodus 30:17-21'},
];
export function tabernacleAllowed(agent,p){return agent.role==='priest'?p[0]<20:p[0]>=24;}
export const tabernacleSpawnCandidates=[];
for(let x=25;x<=53;x+=1.5)for(let z=-20;z<=20;z+=1.5)tabernacleSpawnCandidates.push([x,.02,z]);
