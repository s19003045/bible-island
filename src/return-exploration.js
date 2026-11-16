// A three-chapter teaching reconstruction of Ezra 3–6. Coordinates and forms
// are chosen for readable human-scale observation, not a Temple Mount survey.
export function returnFloor(x,z){const t=Math.max(0,Math.min(1,(32-z)/8));return .05+1.2*t*t*(3-2*t);}
const pos=(x,z,h=0)=>[x,returnFloor(x,z)+h,z];
export const returnObjects=[
 {id:'return-masonry',name:'石層與木料構造教具',segment:'foundation',position:pos(-20,20,.78),approach:pos(-20,22.2),lookAt:pos(-20,20,1.15),stop:'foundation',
  description:'以三層大石與一層木料作可拆合的局部構造教具，對讀以斯拉記 6:3–4 的王令記錄及 5:8 的施工報告。這不是出土牆段；不能由教具推算完整殿高、寬度或確定的抗震工法。',
  observation:'先分辨石頭與木料，再問：王令中的建造要求，是否等於已實測的完成建築？教具的尺寸、接縫和木種屬於補足。',passage:'Ezra 3:7-13;5:8;6:3-4'},
 {id:'return-scroll',name:'王令、查卷與復工',segment:'work',position:pos(21,18,.78),approach:pos(21,20.2),lookAt:pos(21,18,1.08),stop:'work',
  description:'封存卷與展開的文書比較查卷、報告與復工。卷面沒有偽造古代王令、印章或字跡；材質、捆法和陳列為現代教學安排。以斯拉記 6 章記在亞馬塔找到記錄，不表示這份模型就是那件原卷。',
  observation:'把省長的詢問、尋找早先命令的檔案與王的回覆分開。第四章穿插後來王朝的城市阻力，不能照段落順序連成同一年的聖殿施工日誌。',passage:'Ezra 4:1-24;5:1-17;6:1-12;Haggai 1:1-15'},
 {id:'return-vessels',name:'歸還器皿與守節',segment:'dedication',position:pos(21,20,.78),approach:pos(21,22.2),lookAt:pos(21,20,1.15),stop:'dedication',
  description:'兩件原創金銀色器皿提示歸還與清點，不對應某件已辨識的出土殿器。器形、大小、金屬工法及光澤都是比較選擇；近景可看見口緣、器壁和內底，沒有把它們變成可以帶走的獎品。',
  observation:'以斯拉記 1 章的器皿歸還，早於 6 章的完工、奉獻與逾越節。陳列幫助對讀先後，不表示所有器皿在奉獻當日才送達。',passage:'Ezra 1:7-11;6:13-22'},
];
const surfaces=[{id:'public-approach',x1:-30,x2:30,z1:7,z2:39},{id:'west-observation-lane',x1:-30,x2:-10,z1:-27,z2:7},{id:'east-observation-lane',x1:10,x2:30,z1:-27,z2:7}];
export const returnSegments=[
 {id:'foundation',number:1,name:'祭壇與奠基',reference:'以斯拉記 3 章',passage:'Ezra 3',person:'return-elder',spawn:pos(-22,28),startLookAt:pos(-18,17,1),heading:'先看祭壇，再看殿基',intro:'祭壇先恢復，殿宇尚未完成。到奠基旁，聽經文中的歡呼與哭泣如何並存。',target:[0,3,-3],overview:[37,31,42],human:{target:pos(-19,21,1.3),offset:[7,.4,8]},extent:100,shadow:65,plan:85,surfaces},
 {id:'work',number:2,name:'受阻與復工',reference:'以斯拉記 4–6；哈該書 1 章',passage:'Ezra 4-6;Haggai 1',person:'return-builder',spawn:pos(24,27),startLookAt:pos(19,17,1),heading:'材料之外，還有哪些阻力？',intro:'石料與木料來到工地，工程仍受到阻力。分別閱讀先知的勸勉、省長的詢問與查卷回覆。',target:[0,4,-3],overview:[40,30,42],human:{target:pos(20,19,1.3),offset:[7,.4,8]},extent:100,shadow:65,plan:85,surfaces},
 {id:'dedication',number:3,name:'完工與守節',reference:'以斯拉記 6:13–22',passage:'Ezra 6:13-22',person:'return-parent',spawn:pos(24,28),startLookAt:pos(19,19,1),heading:'建築完成，群體繼續生活',intro:'從完工走向奉獻、服事安排與逾越節；比較早先歸還的器皿，留意不同事件的先後。',target:[0,5,-4],overview:[42,31,44],human:{target:pos(21,21,1.3),offset:[6,.4,8]},extent:100,shadow:65,plan:85,surfaces},
];
export const returnSegmentById=new Map(returnSegments.map(s=>[s.id,s]));
export function returnWalkConfig(segment='foundation'){
 const s=returnSegmentById.get(segment)||returnSegments[0];return {...s,objects:returnObjects.filter(o=>o.segment===s.id),segments:returnSegments,segment:s.id,title:s.name,shortTitle:`${s.number} / 3 · ${s.name}`,era:`RETURN / ${s.reference}`,destinations:true,recordedChild:true,teachingInspection:true,
  enter:'開啟聲音，走進本段',inspectionNote:'器具為現代教學比較，不是出土原物；切章表示另一段敘事時間，建築體量與院落安排仍屬推定。',hint:'本段與其他章節是不同時刻；殿宇體量、院落與服裝為教學復原。觀察區不代表古代任何身分皆可進入聖所。',region:p=>p[2]>24?'上行與聚集區':p[0]<-10?'西側工藝觀察區':p[0]>10?'東側閱讀與生活區':'祭壇前公共觀察區'};
}
const node=(id,name,action,points,lookAt)=>({id,name,action,tags:['return-resident'],weight:action==='Interact'?1.4:1,capacity:points.length,slots:points.map(([x,z])=>pos(x,z)),lookAt,dwell:action==='Interact'?[7,17]:[4,12]});
export const returnPOIs=[
 node('return-west-table','石作觀察桌旁','Interact',[[-22,16],[-20.6,16],[-19.2,16]],[-20,20]),
 node('return-west-material','木石材料旁','LookAround',[[-25,5],[-23.6,5],[-22.2,5]],[-18,-4]),
 node('return-west-rest','西側休息處','Idle',[[-25,31],[-23.6,31],[-22.2,31]],[0,10]),
 node('return-west-foundation','地基外側','LookAround',[[-16,-12],[-16,-10.6],[-16,-9.2]],[0,-10]),
 node('return-approach','上行聚集處','Idle',[[-6,33],[-4.6,33],[-3.2,33]],[0,9]),
 node('return-front','祭壇前觀察','LookAround',[[-6,17],[-4.6,17],[-3.2,17]],[0,9]),
 node('return-east-table','文書與器皿旁','Interact',[[22,15],[23.4,15],[24.8,15]],[21,19]),
 node('return-east-neighbors','同行者相聚處','Idle',[[20,31],[21.4,31],[22.8,31]],[0,12]),
 node('return-east-foundation','東側建造觀察','LookAround',[[17,-10],[17,-8.6],[17,-7.2]],[0,-10]),
 node('return-east-material','材料往來處','Interact',[[26,2],[26,3.4],[26,4.8]],[21,0]),
];
export const returnSpawnCandidates=[];for(const s of surfaces)for(let x=s.x1+1;x<s.x2-1;x+=2)for(let z=s.z1+1;z<s.z2-1;z+=2)returnSpawnCandidates.push(pos(x,z));
