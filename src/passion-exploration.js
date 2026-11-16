// Independent reading spaces, not a continuous map of the last journey.
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export const passionReadingPhases={
 table:[
  {id:'preparation',name:'兩位門徒與晚餐預備',space:'table',passage:'Mark 14:12-16',heading:'先讀差派與預備，再到晚上同席',intro:'馬可記兩位門徒、提水罐的人、主人和樓上大房間，沒有在這裡點名兩位門徒。院落與房間是選定生活比較，不認證原屋主、地址、座位或原杯。',night:false},
  {id:'meal',name:'晚上同席、餅杯的話與離開',space:'table',passage:'Mark 14:17-26',heading:'物件帶回同席的人與耶穌的話',intro:'十二使徒來，同席時有出賣的話和憂傷，接著讀餅、杯、耶穌的話與唱詩離開。器具是原創比較，不以拿杯或掰餅操作模擬禮儀通關。',night:true},
 ],
 garden:[
  {id:'prayer',name:'離席後的話語與園中禱告',space:'garden',passage:'Mark 14:27-42',heading:'分清路上話語、同行與稍往前',intro:'27–31節先連讀離席後的話，32節才到客西馬尼。園中有眾門徒、三位門徒與稍往前的層次，返回與睡著仍要讀；選定距離沒有換成已知公尺。',night:true},
  {id:'arrest',name:'被捕、離散與逃離',space:'garden',passage:'Mark 14:43-52',heading:'仍在園中，卻進到另一段行動與回應',intro:'猶大、被派來的人、親吻、被捕和逃離分清。傷耳動作留在文字，馬可本段沒有指名持刀者和受傷者；無名導讀居民不是參與追捕的人，玩家不操作武器。',night:true},
  {id:'council',name:'另到夜間大祭司處與院落',space:'council',passage:'Mark 14:53-72',heading:'閱讀已轉地點，聽見不同人的話',intro:'這裡已離開客西馬尼。分清議會中的證詞與耶穌回答，以及較下院落彼得的不認、雞兩遍與痛哭；不把所有人放在同一火盆旁，也不把他卷姓名當作馬可本句已指名。',night:true},
  {id:'governor',name:'再轉清晨：彼拉多與被帶出',space:'governor',passage:'Mark 15:1-20',heading:'清晨的交付，不是前一窗的同一庭院',intro:'商議後交給彼拉多，接著有問答、巴拉巴、交付和士兵戲弄，20節被帶出去。羅馬總督的決定與士兵行動保留，不從他卷無聲搬入洗手或希律段，也不把群眾擴成跨世代族群罪責。',night:false},
  {id:'cross',name:'刑場遠觀：黑暗、死亡與見證',space:'cross',passage:'Mark 15:21-41',heading:'從被帶出回讀，停留在死亡與見證',intro:'回讀西門被迫背、各各他與上午九點，再讀中午到三點的黑暗、死亡、幔子、百夫長與遠處婦女。本窗暗色聚焦33–41節，不把前段全部說成同一黑夜；模型不解釋黑暗成因，也不讓玩家處刑。',night:true},
 ],
 tomb:[
  {id:'burial',name:'預備日傍晚：確認與安放',space:'tomb',passage:'Mark 15:42-47',heading:'這時讀安放，尚未到較後空墓的信息',intro:'約瑟請求，彼拉多向百夫長確認，再讀細麻布、岩鑿墓、石頭與婦女看見安放處。傍晚光線為現代閱讀選擇，不認證原墓、石形或工程，不加入骨盒，也不從他卷借頭巾與布條位置。',night:true},
  {id:'spices',name:'安息日過後：買香料的準備',space:'road',passage:'Mark 16:1',heading:'停在準備的時刻，不搶先演成已到墓中',intro:'三位婦女買香料準備去膏抹，這裡用普通道路作轉場，沒有給原店、確切買的鐘點或完成時長。馬可的順序與路加另列比較；日間外觀只是本窗選定，不冒充正文指定鐘點。',night:false},
  {id:'morning',name:'第一日太陽剛出：信息與驚恐',space:'tomb',passage:'Mark 16:2-8',heading:'讀到信息、加利利指向與當時的回應',intro:'途中問石頭，到時已移開；墓內右側白袍年輕人傳復活的信息，吩咐告訴門徒和彼得並指向加利利，8節有驚恐離去。這是按馬可閱讀，不混入他卷衛兵、移石天使、彼得進墓或較後顯現；玩家移開現代剖板不是復活原因。',night:false},
 ],
};
export const normalizePassionPhase=(s,id)=>(passionReadingPhases[s]?.find(p=>p.id===id)||passionReadingPhases[s]?.[0])?.id||null;
export const passionMoment=(s,p)=>passionReadingPhases[s]?.find(q=>q.id===normalizePassionPhase(s,p))||null;
export function passionFloor(space,x,z){
 if(space==='garden')return 1.1+.025*x+.05*Math.sin(z*.045);
 if(space==='cross')return 1.5+.045*x+.05*Math.sin(z*.045);
 if(space==='tomb')return 1.10+.022*x+.03*smooth((z+14)/40);
 if(space==='road')return 1.10+.025*z;
 return .75+.40*smooth((z+14)/40);
}
export const passionPosition=(space,x,z,h=0)=>[x,passionFloor(space,x,z)+h,z];
const surfaces={table:[{id:'meal-public-court',x1:-22,x2:29,z1:-20,z2:27}],garden:[{id:'garden-public-paths',x1:-20,x2:29,z1:-22,z2:26}],council:[{id:'night-lower-court',x1:-20,x2:29,z1:-16,z2:27}],governor:[{id:'governor-public-front',x1:-22,x2:30,z1:-16,z2:27}],cross:[{id:'cross-distant-public-observation',x1:-20,x2:30,z1:-20,z2:27}],tomb:[{id:'tomb-public-approach',x1:-21,x2:29,z1:-17,z2:27}],road:[{id:'spices-reading-road',x1:-20,x2:29,z1:-20,z2:27}]};
export const passionSegments=[
 {id:'table',number:1,name:'預備與同席：聽見餅杯的話',reference:'馬可福音 14:12–26',passage:'Mark 14:12-26',person:'passion-meal-resident',heading:'從預備讀到同席、憂傷與離開',intro:'原創生活比較不認證最後晚餐原屋、家具或器具，物件仍要帶回同席的人與耶穌的話。'},
 {id:'garden',number:2,name:'從園中到受審、十架與見證',reference:'馬可福音 14:27–15:41',passage:'Mark 14:27-15:41',person:'passion-journey-resident',heading:'保留舊探索鍵，分清不同場域與時刻',intro:'園地、夜間大祭司處、清晨彼拉多處與刑場遠觀是不同閱讀背景，切換時真正換空間；不是沿同一個園子走幾步就到另一處。'},
 {id:'tomb',number:3,name:'安放、較後準備與清晨的信息',reference:'馬可福音 15:42–16:8',passage:'Mark 15:42-16:8',person:'passion-tomb-resident',heading:'分清安放與後來到達、信息與回應',intro:'三時刻按馬可閱讀。墓穴類型是非定位原創剖示，香料轉場沒有原店或確切鐘點；神學信息不由模型作物理實驗。'},
];
export const passionSegmentById=new Map(passionSegments.map(s=>[s.id,s]));
export const passionObjectDefinitions=[
 {id:'passion-table',segment:'table',stop:'table',name:'餅、杯與同席的現代比較',description:'旋轉看杯的真口、內底與麵包完整及分開的比較。原創形制、材質和並置是選定生活觀察，不是原杯、固定菜單或已知原座次。',observation:'物件帶回同席、憂傷、耶穌的話與唱詩離開；這裡沒有以拿杯、掰餅操作代替閱讀或模擬禮儀通關。',passage:'Mark 14:12-26'},
 {id:'passion-context',segment:'garden',stop:'garden',name:'同行、分開與轉場的閱讀盤',description:'比較園地、夜間院落、清晨總督府與刑場的分離場域片。站位、片的高低和距離是現代閱讀選擇，並非原足跡、古地圖或十架工程。',observation:'先分清說話與行動的人，再讀同行與獨處、被捕與離散、不同審問者、死亡與見證；不能把四處合成客西馬尼同一個院子。',passage:'Mark 14:27-15:41'},
 {id:'passion-tomb',segment:'tomb',stop:'tomb',name:'墓穴類型與現代前部剖示',description:'旋轉看入口、真內腔、底部和一側平台，再移開現代前部剖示。約1:10原創類型比較，不認證原址、原墓尺寸、原石形或滑軌。',observation:'分清預備日安放、較後買香料與第一日到墓的信息。剖板不是原墓石，玩家操作不使復活發生，也不補入馬可沒有描述的他卷布條位置。',passage:'Mark 15:42-16:8'},
];
export function passionWalkConfig(segment='table',phase=null){
 const s=passionSegmentById.get(segment)||passionSegments[0],moment=passionMoment(s.id,phase),space=moment.space;
 const objects=passionObjectDefinitions.filter(o=>o.segment===s.id).map(o=>({...o,position:passionPosition(space,-5,7,.82),approach:passionPosition(space,-5,9.4),lookAt:passionPosition(space,-5,7,1.1)}));
 return {...s,space,surfaces:surfaces[space],spawn:passionPosition(space,17,20),startLookAt:passionPosition(space,-5,7,1),target:[-3,3,-10],overview:[-38,29,46],human:{target:passionPosition(space,-4,7,1.4),offset:[7,.4,7]},extent:140,shadow:76,plan:100,objects,segments:passionSegments,segment:s.id,phases:passionReadingPhases[s.id],phase:moment.id,moment,timeLocked:true,night:moment.night,title:s.name,heading:moment.heading,intro:moment.intro,shortTitle:`${s.number} / 3 · ${s.name}`,era:'MEAL, SUFFERING & MORNING / 按馬可分時閱讀',destinations:true,recordedChild:true,teachingInspection:true,enter:'開啟聲音，走進本段',inspectionNote:'原創現代比較；不是原杯、原站位、十架工程或已確認原墓。',hint:'留意不同時刻、場域與人的話；觀察之後回到完整文本，物件不替我們解釋超越事件。',region:()=>space==='garden'?'園地公共觀察路線':space==='council'?'較下院落生活比較':space==='governor'?'清晨公共前庭比較':space==='cross'?'刑場有距離的公共觀察':space==='tomb'?'墓外公共道路比較':space==='road'?'較後準備的道路轉場':'同席生活的公共院落'};
}
export function passionPOIs(segment,phase=null){const c=passionWalkConfig(segment,phase),space=c.space,data=[
 ['objects','物件閱讀','Interact',[[-10,12],[-8.6,12]],[-5,7]],['north','前方外望','LookAround',[[10,-9],[11.4,-9]],[13,-27]],['west','路旁停留','LookAround',[[-14,-9],[-12.6,-9]],[-27,-18]],['shade','遮蔽處歇息','Idle',[[-14,21],[-12.6,21]],[-25,20]],['court','安靜交談','Idle',[[4,17],[5.4,17]],[1,3]],['east','道路外望','LookAround',[[23,6],[24.4,6]],[40,9]],['lane','日常往來','Interact',[[2,-9],[3.4,-9]],[0,-22]],['south','同行相遇','Idle',[[20,23],[21.4,23]],[11,9]],
 ];return data.map(([id,name,action,slots,lookAt])=>({id:'passion-'+id,name,action,tags:['passion-resident'],weight:action==='Interact'?1.4:1,capacity:2,slots:slots.map(([x,z])=>passionPosition(space,x,z)),lookAt,dwell:action==='Interact'?[7,18]:[4,14]}));}
export function passionSpawnCandidates(segment,phase=null){const c=passionWalkConfig(segment,phase),out=[];for(const r of c.surfaces)for(let x=Math.ceil(r.x1+1);x<r.x2;x+=2)for(let z=Math.ceil(r.z1+1);z<r.z2;z+=2)out.push(passionPosition(c.space,x,z));return out;}

export const passionObjects=passionSegments.flatMap(s=>passionWalkConfig(s.id).objects);
