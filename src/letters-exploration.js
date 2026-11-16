// Teaching order across two letters, not a chronology or a measured delivery itinerary.
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export const lettersReadingPhases={
 desk:[
  {id:'address',name:'羅馬書：誰向誰寫與尚未完成的計畫',space:'writing',passage:'Romans 1:1-15;Romans 15:22-33',heading:'書名不是寫信地址，計畫不等於已完成',intro:'從自我介紹與收信者開始，再讀想往羅馬和西班牙的盼望及當前往耶路撒冷的安排。本場是非定位文書生活比較，不把保羅說成已在羅馬收信者房內，也不裁定兩卷的精確年分。',night:false},
  {id:'people',name:'推薦、問候與不同群體',space:'writing',passage:'Romans 16:1-20',heading:'名字連起關係，不是一張同屋全體照',intro:'菲比的推薦、普茜拉與阿奎拉等同工、家中群體和勸告連讀。收信一側的被問候者不能全搬到代筆桌旁；菲比攜信或朗讀全卷可另談推論，不冒充本句已明寫。',night:false},
  {id:'scribe',name:'代筆後記與書信結尾',space:'writing',passage:'Romans 16:21-27',heading:'自署、代筆與問候是不同參與',intro:'特提烏斯在22節自稱代筆，21–23節又有送出一側的問候。不能說他代筆全部書信，或由此判定保羅從未持筆；24及25–27節的古抄本譯註留在完整章入口。',night:false},
 ],
 messenger:[
  {id:'letter',name:'換讀歌羅西書：寄信與收信群體',space:'dispatch',passage:'Colossians 1:1-8;Colossians 2:1-5',heading:'已轉入另一封書信，不是前一桌的下一天',intro:'這是教學順序，不宣判羅馬書與歌羅西書寫作年代。從保羅、提摩太的問安與收信群體開始，繼續回到全卷；不把特提烏斯移成這封信已知的代筆者。',night:false},
  {id:'prayer',name:'禱告、捆鎖與有恩惠的回答',space:'dispatch',passage:'Colossians 4:2-6',heading:'文件之外，仍有人的處境與話語',intro:'讀禱告、傳講、捆鎖和回答每個人的勸告。這裡未指定監房地址、鎖鏈工程或寫信城市；生活比較也不讓玩家操作囚禁或以忍受傷害作通關。',night:false},
  {id:'sent',name:'特其庫斯、奧尼斯莫與近況',space:'dispatch',passage:'Colossians 4:7-9',heading:'被派、同行、消息與安慰分清',intro:'本段說派特其庫斯前往，奧尼斯莫同行，將使收信者明白近況並得安慰。參與送信有語境理由，原文件、封裝、交通和日數卻未給；不把人作可交易包裹，也不擅定逃跑、偷竊或法律釋奴。',night:false},
  {id:'greetings',name:'問候連起不同地方的同工',space:'dispatch',passage:'Colossians 4:10-14',heading:'名單不是所有人同坐一間房的證明',intro:'問候、接納的囑咐、禱告與勞苦各有說話位置。寫信一側和收信群體不合成桌邊合照，家屋背景也不認證某一座原始聚會屋。',night:false},
 ],
 reading:[
  {id:'house',name:'寧法與她家中的群體',space:'listening',passage:'Colossians 4:15',heading:'家中群體有具體關係，原平面仍未知',intro:'依CSBT正文讀寧法與她家中的教會，另保留古抄本「他」的譯註；不把她家無聲認成歌羅西第一個收信房間。普通生活背景不是已測繪原址或後世教堂。',night:false},
  {id:'exchange',name:'在你們那裡讀，再分清跨地指示',space:'listening',passage:'Colossians 4:16',heading:'兩處閱讀的指示，不是同廳瞬間交換',intro:'先在收信者那裡宣讀，也要在勞迪西亞讀，並讀從勞迪西亞轉來的信。關係架分兩端；不杜撰轉來信的卷名、正文或原封裝，也不把指示說成已發現照辦紀錄。',night:false},
  {id:'living',name:'服事、親筆問候與彼此生活',space:'listening',passage:'Colossians 4:17-18;Colossians 3:12-17',heading:'不是交到手中就已讀懂',intro:'讀給阿其波斯的服事提醒、保羅親筆問候與記念捆鎖，再回連群體生活、彼此教導與感謝。收到、宣讀和理解有不同層次，不能只以文件配送完成代替閱讀。',night:false},
 ],
};
export const normalizeLettersPhase=(s,id)=>(lettersReadingPhases[s]?.find(p=>p.id===id)||lettersReadingPhases[s]?.[0])?.id||null;
export const lettersMoment=(s,p)=>lettersReadingPhases[s]?.find(q=>q.id===normalizeLettersPhase(s,p))||null;
export function lettersFloor(space,x,z){if(space==='writing')return .84+.24*smooth((z+2)/35);if(space==='dispatch')return 1.12+.020*x+.12*smooth((z+10)/35);return 1.10+.022*z;}
export const lettersPosition=(space,x,z,h=0)=>[x,lettersFloor(space,x,z)+h,z];
const surfaces={writing:[{id:'writing-public-court-and-room',x1:-21,x2:29,z1:-19,z2:27}],dispatch:[{id:'dispatch-selected-public-court',x1:-21,x2:30,z1:-19,z2:27}],listening:[{id:'listening-public-porch-and-court',x1:-21,x2:29,z1:-19,z2:27}]};
export const lettersSegments=[
 {id:'desk',number:1,name:'羅馬書：書寫、代筆與問候',reference:'羅馬書 1:1–15；15:22–16:27',passage:'Romans 1:1-15;Romans 15:22-16:27',person:'letters-writing-resident',heading:'從文字辨認不同的參與',intro:'自署、代筆、推薦與問候分清；現代材料比較不是保羅或特提烏斯的原桌。'},
 {id:'messenger',number:2,name:'轉讀歌羅西書：被派、消息與安慰',reference:'歌羅西書 1:1–8；2:1–5；4:2–14',passage:'Colossians 1:1-8;Colossians 2:1-5;Colossians 4:2-14',person:'letters-dispatch-resident',heading:'換卷後，重新辨認人與話語',intro:'教學順序不等於寫作年代；被派、同行及傳達近況有文本，原路線與封裝未給。'},
 {id:'reading',number:3,name:'群體宣讀、跨地指示與生活',reference:'歌羅西書 4:15–18；3:12–17',passage:'Colossians 4:15-18;Colossians 3:12-17',person:'letters-listening-resident',heading:'閱讀不只停在收到文件',intro:'寧法、勞迪西亞、服事與記念捆鎖連回群體生活；現代關係架不冒充原講臺或已照辦紀錄。'},
];
export const lettersSegmentById=new Map(lettersSegments.map(s=>[s.id,s]));
export const lettersObjectDefinitions=[
 {id:'letters-materials',segment:'desk',stop:'desk',name:'墨寫、刻寫與紙草層次比較',description:'比較上下正交的紙草條層、空白木墨面與真凹槽蠟板，再辨認墨寫筆和尖筆。紙草每層6mm是可見性誇示，非原紙厚，也不是交替編織。',observation:'抬起上層只為看材料層次；不同材料和動作是現代功能比較，不說這一套全在羅16原桌，不複製原筆跡。',passage:'Romans 16:21-27'},
 {id:'letters-delivery',segment:'messenger',stop:'messenger',name:'被派、同行與消息的交付比較',description:'比較分離的派遣端、收信端、現代箭頭和空白文件片。普通籌是角色關係符號，不是原肖像或人口，文件形制也未認證。',observation:'讀特其庫斯被派、奧尼斯莫同行，以及近況和安慰；送信的語境推想與未給的封裝、交通、路程和時長分開。',passage:'Colossians 4:7-9'},
 {id:'letters-reading',segment:'reading',stop:'reading',name:'分地宣讀與群體生活比較架',description:'旋轉看兩個有承托的現代閱讀架和空白文件片，再依4:16分清收信者與勞迪西亞的指示。不是原講臺、兩城測繪或P46原格式。',observation:'先在你們那裡宣讀，再在勞迪西亞讀及讀轉來的信；沒有杜撰那封信的內容，指示也不等於找到全部履行紀錄。',passage:'Colossians 4:15-18;Colossians 3:12-17'},
];
export function lettersWalkConfig(segment='desk',phase=null){
 const s=lettersSegmentById.get(segment)||lettersSegments[0],moment=lettersMoment(s.id,phase),space=moment.space;
 const objects=lettersObjectDefinitions.filter(o=>o.segment===s.id).map(o=>({...o,position:lettersPosition(space,-5,7,.82),approach:lettersPosition(space,-5,9.4),lookAt:lettersPosition(space,-5,7,1.1)}));
 return {...s,space,surfaces:surfaces[space],spawn:lettersPosition(space,17,20),startLookAt:lettersPosition(space,-5,7,1),target:[-2,3,-9],overview:[-37,27,44],human:{target:lettersPosition(space,-4,7,1.4),offset:[7,.4,7]},extent:140,shadow:76,plan:100,objects,segments:lettersSegments,segment:s.id,phases:lettersReadingPhases[s.id],phase:moment.id,moment,timeLocked:true,night:false,title:s.name,heading:moment.heading,intro:moment.intro,shortTitle:`${s.number} / 3 · ${s.name}`,era:'WRITING, NEWS & COMMUNAL READING / 分卷閱讀',destinations:true,recordedChild:true,teachingInspection:true,enter:'開啟聲音，走進本段',inspectionNote:'原創材料與閱讀關係比較；不是原稿、原筆跡、原路線或原講臺。',hint:'先辨認現在讀哪封信、誰向誰說，再從物件回到消息、安慰、宣讀與生活。',region:()=>space==='writing'?'非定位文書生活比較':space==='dispatch'?'被派與消息的公共觀察':'群體聆聽的生活比較'};
}
export function lettersPOIs(segment,phase=null){const c=lettersWalkConfig(segment,phase),space=c.space,data=[
 ['objects','觀察材料與對讀','Interact',[[-10,12],[-8.6,12]],[-5,7]],['north','內外聆聽','LookAround',[[0,-13],[1.4,-13]],[0,-20]],['west','路旁停留','LookAround',[[-14,-9],[-12.6,-9]],[-27,-18]],['shade','遮蔽處歇息','Idle',[[-14,21],[-12.6,21]],[-25,20]],['court','交換近況','Idle',[[4,17],[5.4,17]],[1,3]],['east','街道外望','LookAround',[[23,6],[24.4,6]],[40,9]],['lane','日常接待','Interact',[[2,-2],[3.4,-2]],[0,-12]],['south','同行交談','Idle',[[20,23],[21.4,23]],[11,9]],
 ];return data.map(([id,name,action,slots,lookAt])=>({id:'letters-'+id,name,action,tags:['letters-resident'],weight:action==='Interact'?1.4:1,capacity:2,slots:slots.map(([x,z])=>lettersPosition(space,x,z)),lookAt,dwell:action==='Interact'?[7,18]:[4,14]}));}
export function lettersSpawnCandidates(segment,phase=null){const c=lettersWalkConfig(segment,phase),out=[];for(const r of c.surfaces)for(let x=Math.ceil(r.x1+1);x<r.x2;x+=2)for(let z=Math.ceil(r.z1+1);z<r.z2;z+=2)out.push(lettersPosition(c.space,x,z));return out;}
export const lettersObjects=lettersSegments.flatMap(s=>lettersWalkConfig(s.id).objects);
