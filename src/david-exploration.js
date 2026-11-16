// David chapters: distinct narrative periods and mutually exclusive ark moments.
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export function davidFloor(s,x,z){return s==='sheep'?.55+.9*smooth((z+15)/40):s==='city'?.6+1.5*smooth((-z+8)/36):.6+.7*smooth((x+9)/32);}
export const davidPosition=(s,x,z,h=0)=>[x,davidFloor(s,x,z)+h,z];
const surfaces=[{id:'david-public-observation-route',x1:-15,x2:29,z1:-18,z2:30}];
export const davidArkPhases=[
 {id:'cart',name:'新車與中止',reference:'撒母耳記下 6:1–10',passage:'2 Samuel 6:1-10',heading:'先讀遷移為何中止',intro:'先有新車運送，烏撒之死使大衛懼怕，遷移中止。讀文字中的轉折，再看這一時刻；後面的三個月與抬入城尚未發生。'},
 {id:'pause',name:'停留三個月',reference:'撒母耳記下 6:10–12',passage:'2 Samuel 6:10-12',heading:'把停留的時間讀出來',intro:'約櫃在迦特人俄別·以東家停留三個月。這是敘事中的一段時間，不是隊伍沿同一路線不停走過幾秒；家屋形制與位置仍屬原創。'},
 {id:'carry',name:'後來由抬者前進',reference:'撒母耳記下 6:12–16',passage:'2 Samuel 6:12-16;Exodus 25:10-22;1 Chronicles 15:11-15',heading:'再看後一段的運送方式',intro:'後段改記抬約櫃的人前進；六步不是六位抬者。若觀察肩扛與固定杠，分別對讀代上 15 與出 25，不把跨卷細節都說成撒下 6 的工程圖。'},
 {id:'tent',name:'安放在帳篷中',reference:'撒母耳記下 6:17–19；7 章',passage:'2 Samuel 6:17-19;7',heading:'帳篷的安放與未來建殿分開',intro:'約櫃安放在大衛預備的帳篷中。下一章另讀拿單、建殿與家室應許的對話；眼前尚未完成所羅門的殿，帳篷也沒有被給出完整院落平面。'},
];
export const davidSegments=[
 {id:'sheep',number:1,name:'羊群、召回與受膏',reference:'撒母耳記上 16:1–13',passage:'1 Samuel 16:1-13',person:'david-pasture-resident',heading:'從還在放羊，讀到被召回',intro:'先看牧養生活與盛油犄角，再讀耶西的兒子們和撒母耳的來訪。這一段不等於大衛已在耶路撒冷登基，核心經文也沒有牧場彈琴的場面。'},
 {id:'city',number:2,name:'山脊、堡壘與建造',reference:'撒母耳記下 5:6–12',passage:'2 Samuel 5:6-12',person:'david-building-resident',heading:'看山城，也辨認木石工序',intro:'閱讀住進堡壘、建造周圍，以及提爾王希蘭送來的木材、木匠和石匠。山脊與構造為原創比較，不能指認現存宮殿或攻城水道。'},
 {id:'ark',number:3,name:'遷移、停留與安放',reference:'撒母耳記下 6–7 章',passage:'2 Samuel 6-7',person:'david-arrival-guide',heading:'分時讀新車、中止、抬入與帳篷',intro:'同一章中也有不同時刻。按時間卡讀新車、三個月停留、後段抬櫃與帳篷安放，再另讀下一章的建殿與家室應許。'},
].map(s=>({...s,spawn:davidPosition(s.id,17,24),startLookAt:davidPosition(s.id,-5,7,1),surfaces,target:[0,4,-6],overview:[41,29,45],human:{target:davidPosition(s.id,-4,7,1.4),offset:[7,.4,7]},extent:120,shadow:72,plan:94}));
export const davidSegmentById=new Map(davidSegments.map(s=>[s.id,s]));
export const davidObjects=[
 {id:'david-shepherd',segment:'sheep',stop:'sheep',name:'牧養生活與盛油犄角',description:'一隻原創生活羊和普通盛油犄角分開陳列，連回仍在放羊、召回與受膏的先後。羊的品種、性別、毛色、數量和角容器外形不是經文規格，也不是號角機關。',observation:'撒上 16:1–13 的核心沒有琴，彈琴是14–23節的後續。先讀誰仍在放羊，誰被召來；不要由身高、容貌或民族外貌猜誰應當作王。',passage:'1 Samuel 16:1-23'},
 {id:'david-city',segment:'city',stop:'city',name:'山脊與木石構造',description:'原創山脊、堡壘量體與石材木梁接合，幫助比較住城與建造。可拆的是現代構造層，沒有重建一份已確認的大衛宮殿測繪圖。',observation:'分清撒上16的受膏、撒下5先前在希伯崙的膏立，以及攻取堡壘後的建造。各時期水系、梯壘與大型石構不能拼成一張大衛時代全圖。',passage:'1 Samuel 16:1-13;2 Samuel 5:1-12'},
 {id:'david-ark',segment:'ark',stop:'ark',name:'運送與安放的分時比較',description:'現代教具按時刻顯示新車、三個月停留、後段帶杠運送與帳篷安放。車、櫃、覆布、人物數量與帳篷形制是原創補足，不是已找到的約櫃或工程圖。',observation:'各時刻互斥顯示，不把遷移中止與三個月省成一次歡樂行列。環與固定杠對讀出25，肩扛對讀代上15；六步不是六人。撒下7的未來殿宇只作另讀。',passage:'2 Samuel 6-7;Exodus 25:10-22;1 Chronicles 15:11-15'},
].map(o=>({...o,position:davidPosition(o.segment,-5,7,.82),approach:davidPosition(o.segment,-5,9.4),lookAt:davidPosition(o.segment,-5,7,1.5)}));
export function davidWalkConfig(segment='sheep',phase='cart'){
 const s=davidSegmentById.get(segment)||davidSegments[0],moment=s.id==='ark'?(davidArkPhases.find(p=>p.id===phase)||davidArkPhases[0]):null;
 return {...s,objects:davidObjects.filter(o=>o.segment===s.id),segments:davidSegments,segment:s.id,phases:moment?davidArkPhases:null,phase:moment?.id||null,moment,title:s.name,heading:moment?.heading||s.heading,intro:moment?.intro||s.intro,shortTitle:`${s.number} / 3 · ${s.name}`,era:'DAVID / 分章與分時敘事',destinations:true,recordedChild:true,teachingInspection:true,enter:'開啟聲音，走進本段',inspectionNote:'原創生活、構造與分時教具；不是大衛原宮殿、原牧場或約櫃。',hint:'沿公共觀察路線，分清故事先後。第三章也有中止與停留；時間卡不能當作同時發生的相鄰景點。',region:p=>s.id==='sheep'?(p[0]<0?'牧養生活觀察區':'召回與受膏的導讀區'):s.id==='city'?(p[2]<0?'山脊與構造比較':'木石工作觀察區'):(p[0]<0?'分時教具觀察區':'遷移與等待的導讀區')};
}
export function davidPOIs(s){const P=(id,name,action,slots,lookAt)=>({id:'david-'+id,name,action,tags:['david-resident'],weight:action==='Interact'?1.4:1,capacity:slots.length,slots:slots.map(([x,z])=>davidPosition(s,x,z)),lookAt,dwell:action==='Interact'?[7,18]:[4,14]});return [P('west','教具旁的觀察','Interact',[[-9,3],[-7.6,3]],[-5,7]),P('rest','公共停留處','Idle',[[-12,21],[-10.6,21]],[-22,15]),P('north','遠處外望','LookAround',[[-9,-13],[-7.6,-13]],[-18,-28]),P('court','同行相遇','Idle',[[4,17],[5.4,17]],[0,3]),P('east','生活準備','Interact',[[23,4],[24.4,4]],[33,5]),P('shade','公共歇息區','Idle',[[23,25],[24.4,25]],[12,10]),P('look','背景觀察','LookAround',[[23,-12],[24.4,-12]],[31,-25]),P('south','往來通道','LookAround',[[0,27],[1.4,27]],[2,8])];}
export function davidSpawnCandidates(s){const out=[];for(let x=-13;x<29;x+=2)for(let z=-16;z<30;z+=2)out.push(davidPosition(s,x,z));return out;}
