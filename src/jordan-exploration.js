// Compressed narrative teaching layout: +X leads from the eastern camp toward
// the western bank. These axes and distances are not an archaeological survey.
export function jordanFloor(x){const t=Math.max(0,Math.min(1,(Math.abs(x)-10)/14));return .05+5.6*t*t*(3-2*t);}
export const jordanSpawn=[-46,jordanFloor(-46),20];
export const jordanSurfaces=[{id:'jordan-observation',x1:-58,x2:62,z1:-24,z2:29}];
export const jordanCampSurface=[{id:'bank-conversation-route',x1:-56,x2:60,z1:10,z2:28}];
export const jordanConvoySurface=[{id:'jordan-forward-corridor',x1:-30,x2:532,z1:-7.7,z2:7.7}];
const poi=(id,action,slots,lookAt)=>({id,name:'河岸停留與觀察',action,weight:1,capacity:slots.length,slots:slots.map(([x,z])=>[x,jordanFloor(x),z]),lookAt,tags:id.startsWith('east')?['east-resident']:id.startsWith('west')?['west-resident']:['east-resident','west-resident'],dwell:action==='Interact'?[6,14]:[4,11]});
export const jordanPOIs=[
 poi('east-preparation','Interact',[[-46,16],[-44.6,16],[-43.2,16]],[-47,22]),
 poi('east-bank-view','LookAround',[[-28,16],[-26.6,16],[-25.2,16]],[0,-15]),
 poi('east-reeds','Idle',[[-35,25],[-33.6,25],[-32.2,25]],[-10,0]),
 poi('east-lower-bank','LookAround',[[-14,15],[-12.6,15],[-11.2,15]],[0,-15]),
 poi('bed-observation','LookAround',[[0,13],[1.4,13],[2.8,13]],[0,-15]),
 poi('west-lower-bank','Idle',[[15,17],[16.4,17],[17.8,17]],[0,-15]),
 poi('west-stones-view','LookAround',[[38,17],[39.4,17],[40.8,17]],[41,22]),
 poi('west-family','Interact',[[49,23],[50.4,23],[51.8,23]],[41,22]),
 poi('west-rest','Idle',[[30,26],[31.4,26],[32.8,26]],[15,0]),
];
export const jordanConvoyPOIs=Array.from({length:68},(_,i)=>{const x=-16+i*8;return {id:`jordan-forward-${i}`,name:'前方乾地',x,action:'LookAround',weight:1,capacity:5,slots:[-5.6,-2.8,0,2.8,5.6].map(z=>[x,jordanFloor(x),z]),lookAt:[x+20,0],dwell:[.2,1.1]};});
export const jordanSpawnCandidates=[];
for(let x=-54;x<=58;x+=2)for(let z=12;z<=26;z+=2)jordanSpawnCandidates.push([x,jordanFloor(x),z]);
export const jordanObjects=[
 {id:'jordan-bed',name:'河床與兩岸剖面',position:[-30,jordanFloor(-30)+.8,21],approach:[-30,jordanFloor(-30),18.8],lookAt:[-30,jordanFloor(-30)+1.2,21],stop:'river',
  description:'現代縮小剖面比較較低河床、沉積層與兩岸高差，不採全體等比縮尺。約書亞記說上游遠處的水被截斷；這裡不造兩道貼近隊伍的水牆，也不用剖面指認現代渡口。',
  observation:'比較隊伍腳下與兩岸高差，再讀約書亞記 3:15–17。哪一部分是敘事，哪一部分是為觀察而做的剖面？',passage:'Joshua 3:14-17'},
 {id:'jordan-carrying',name:'覆布與抬槓教學模型',position:[-45,jordanFloor(-45)+.8,22],approach:[-45,jordanFloor(-45),19.8],lookAt:[-45,jordanFloor(-45)+1.2,22],stop:'ark',
  description:'現代縮小覆布模型，依民數記 4:5–6 比較搬運遮蓋與抬槓，不揭開、打開或讓玩家搬走約櫃。約書亞記未逐項重述覆布細節；套用搬運規範及藍色、布褶與固定方式均須區分。',
  observation:'看見抬槓，是否就表示人人可以靠近？對讀約書亞記 3:4 的距離吩咐；畫面壓縮間距，不能用模型步數換算經文。',passage:'Joshua 3:1-8;Numbers 4:5-6'},
 {id:'jordan-stones',name:'十二石與下一代的提問',position:[41,jordanFloor(41),22],approach:[41,jordanFloor(41),19.2],lookAt:[41,jordanFloor(41)+.8,22],stop:'stones',
  description:'十二塊各自塑形的原創石頭，在西岸教學區提示吉甲的記念；不把這個位置認定為考古發現。可旋轉分辨十二塊，沒有刻上經文未記載的支派銘文。石種、尺寸、磨蝕、堆疊及吉甲與河的模型距離均為補足。',
  observation:'哪些石頭從河中帶往宿營地？4:9 的河中十二石又是另一處記載。說給同行的人聽，不要把它們合併成同一組。',passage:'Joshua 4:1-9;4:19-24'},
];
