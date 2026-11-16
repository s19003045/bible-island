const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export const galileeFloor=(s,x,z)=>(s==='synagogue'?.85:.7)+(s==='house'?.50:s==='boat'?.55:.28)*smooth((z+14)/40);
export const galileePosition=(s,x,z,h=0)=>[x,galileeFloor(s,x,z)+h,z];
const surfaces=[{id:'galilee-public-route',x1:-15,x2:29,z1:-18,z2:30}];
export const galileeSegments=[
 {id:'boat',number:1,name:'湖岸工作與較後渡湖',reference:'馬可福音 1:16–20；4:35–41',passage:'Mark 1:16-20;4:35-41',person:'galilee-shore-resident',heading:'先看不同工作，再另讀較後航程',intro:'西門和安得烈撒網，稍前行才見雅各和約翰修網。可4的傍晚渡湖是較後段落，不把呼召、修網與風浪演成同一航次。'},
 {id:'synagogue',number:2,name:'回看可1：教導與人的反應',reference:'馬可福音 1:21–28',passage:'Mark 1:21-28',person:'galilee-gathering-resident',heading:'回看迦百農安息日的聚集',intro:'從可4窗口返回時，這裡是回看可1。先教導與驚嘆，再讀斥責、出來和眾人談論；原創聚集空間不直接搬入較晚白石會堂，也不補成讀特定書卷。'},
 {id:'house',number:3,name:'家屋通達、權柄與回應',reference:'馬可福音 2:1–12',passage:'Mark 2:1-12',person:'galilee-house-resident',heading:'過些日子又到迦百農，連讀完整故事',intro:'門前人多、四人抬來、拆通屋頂之後，還有赦罪、經文士心中所想、耶穌的回應及起來拿墊子出去。不是前面會堂散會後同日隔壁的一場工程遊戲。'},
].map(s=>({...s,spawn:galileePosition(s.id,12,18),startLookAt:galileePosition(s.id,-5,7,1),surfaces,target:[2,4,-18],overview:[-44,34,57],human:{target:galileePosition(s.id,-4,7,1.4),offset:[7,.4,7]},extent:135,shadow:76,plan:100}));
export const galileeSegmentById=new Map(galileeSegments.map(s=>[s.id,s]));
export const galileeReadingPhases={
 boat:[
  {id:'casting',name:'可1：撒網與呼召',passage:'Mark 1:16-18',heading:'先看湖邊撒網的人',intro:'西門和安得烈正在撒網，聽見呼召而跟從。日常網具是工作比較；場景不指認原網目、當天漁獲或精確岸址。',night:false,waves:.025},
  {id:'mending',name:'可1：稍前行，船上修網',passage:'Mark 1:19-20',heading:'再稍前行，另一對兄弟正在修網',intro:'雅各和約翰在船上修網，父親西庇太和雇工們也在敘事中。這和前面的撒網動作有區別，不把所有人變成同一支出航隊。',night:false,waves:.025},
  {id:'depart',name:'另讀可4：晚上渡湖',passage:'Mark 4:35-36',heading:'跳讀較後章次，晚上離開群眾',intro:'可4接在教導之後，晚上離開群眾並有其他船同行。這是另一個閱讀窗口；沿岸原創船影不證明同一艘船、原航線或船員配置。',night:true,timeLocked:true,waves:.04},
  {id:'storm',name:'可4：風浪、叫醒與回應',passage:'Mark 4:37-40',heading:'在風浪中，聽見呼求與回應',intro:'連讀風浪、船尾枕頭、叫醒與耶穌的回應。水面與風聲只是現代閱讀氣氛，不認證當晚強度；玩家留在安全岸上，不以翻船或倒數判定信心。',night:true,timeLocked:true,waves:.15},
  {id:'calm',name:'可4：平靜後的問句',passage:'Mark 4:39-41',heading:'平靜之後，仍有要繼續問的問題',intro:'回讀平靜、對門徒的話及最後關於身分的提問。切換水面不是操作神蹟的按鍵；回到下一章時，要明白是在回看較前的可1。',night:true,timeLocked:true,waves:.012},
 ],
 synagogue:[
  {id:'teaching',name:'教導與驚嘆',passage:'Mark 1:21-22',heading:'安息日，在教導中聽見權柄',intro:'迦百農聚集的人對教導感到驚訝。這段未說正在讀哪一卷書；空間比較幫助想像聚集，不能取代教導與人的反應。',night:false},
  {id:'rebuke',name:'斥責與出來',passage:'Mark 1:23-26',heading:'讀斥責與出來，保留人的處境',intro:'汙靈敘事按這段文本閱讀，不把現代精神疾病或抽搐者做成可攻擊的怪物，也不靠聲光認證當日現場。普通居民提供導讀，不扮演被附身的人。',night:false},
  {id:'response',name:'談論與消息傳開',passage:'Mark 1:27-28',heading:'眾人怎樣談論，消息怎樣傳開？',intro:'經文讓讀者再聽眾人的驚訝與談論。別只記住一幢建築；今日較晚會堂遺構的分期另作資料對讀，不與這一刻直接疊合。',night:false},
 ],
 house:[
  {id:'crowd',name:'又到迦百農，人聚集',passage:'Mark 2:1-3',heading:'過些日子，又有人聚集到房子',intro:'先看門前沒有空間、四人抬來的處境。場景家屋是原創比較，沒有從模型替屋主或四人補上名字；這個窗口尚未把屋頂畫成已拆通。',night:false},
  {id:'roof',name:'拆通屋頂與縋下',passage:'Mark 2:4',heading:'門前難以靠近，從上方通達',intro:'閱讀拆通與縋下，分清通達障礙及其後故事。場景選定屋面開口只示意這一段；近景整層抬頂則是現代觀看方式，不是古代預製天窗。',night:false},
  {id:'authority',name:'赦罪、權柄與起身出去',passage:'Mark 2:5-12',heading:'繼續讀話語、心中問題與最後出去',intro:'把赦罪、經文士心中所想、耶穌的回應及那人拿墊子出去連讀。模型不判定現代傷病的原因，也不將人的身體變成搬運得分的道具。',night:false},
 ],
};
export const normalizeGalileePhase=(s,id)=>(galileeReadingPhases[s]?.find(p=>p.id===id)||galileeReadingPhases[s]?.[0])?.id||null;
export const galileeMoment=(s,p)=>galileeReadingPhases[s]?.find(q=>q.id===normalizeGalileePhase(s,p))||null;
export const galileeObjects=[
 {id:'galilee-hull',segment:'boat',stop:'boat',name:'船殼局部與木構比較',description:'抬起一道曲肋，看外殼、內底、龍骨及現代承座的接觸。這是外張U形局部教具，不是完整出土古船的縮製，也不認證耶穌或門徒的座船。',observation:'回讀撒網、稍前行修網，再另讀可4的航程、船尾枕頭和最後問句。IAA摘要支持船板、肋及龍骨等部件類別，精確曲線和可抬曲肋則是選定現代比較。',passage:'Mark 1:16-20;4:35-41'},
 {id:'galilee-stones',segment:'synagogue',stop:'synagogue',name:'石材、依據與分期比較台',description:'旋轉看兩件並置石材、真底與承盤。深淺顏色不是自動斷代公式；兩盤不疊成一世紀和後世的上下建築層，也沒有可拆的虛構原柱飾。',observation:'可1核心是教導、權柄與人的反應。今日宏偉白石會堂屬較晚階段；石材、研究分期及現代復原要分開，不能從一塊石頭還原完整原室。',passage:'Mark 1:21-28'},
 {id:'galilee-roof',segment:'house',stop:'house',name:'屋面與通達的剖示比較',description:'抬起現代屋面層，看真門洞、梁牆承托及室內空間。約1:10原創比較屋不是可2原宅測繪；整層抬起是教學剖示，不表示屋頂原本有活動蓋。',observation:'門前阻擋、拆通與縋下之後，繼續讀赦罪、心中問題及起來拿墊子出去。教具不能補出四人的名字、原宅位置、滑輪配置或每戶相同屋面。',passage:'Mark 2:1-4;2:5-12'},
].map(o=>({...o,position:galileePosition(o.segment,-5,7,.82),approach:galileePosition(o.segment,-5,9.4),lookAt:galileePosition(o.segment,-5,7,1.10)}));
export function galileeWalkConfig(segment='boat',phase=null){const s=galileeSegmentById.get(segment)||galileeSegments[0],moment=galileeMoment(s.id,phase);return {...s,objects:galileeObjects.filter(o=>o.segment===s.id),segments:galileeSegments,segment:s.id,phases:galileeReadingPhases[s.id],phase:moment.id,moment,timeLocked:moment.timeLocked===true,night:moment.night,title:s.name,heading:moment.heading,intro:moment.intro,shortTitle:`${s.number} / 3 · ${s.name}`,era:'LAKE, GATHERING & HOME / 分章與回看',destinations:true,recordedChild:true,teachingInspection:true,enter:'開啟聲音，走進本段',inspectionNote:'原創現代比較；非耶穌座船、可2原宅測繪或已認證一世紀會堂。',hint:'沿安全岸線與公共觀察區提問，再回到各段的人與回應。換章會換閱讀處境；器物觀察不自動完成讀經。',region:p=>p[0]<0?'器物與生活形式比較區':s.id==='boat'?'湖岸公共觀察區':'院落與公共往來區'};}
export function galileePOIs(s){const P=(id,name,action,slots,lookAt)=>({id:'galilee-'+id,name,action,tags:['galilee-resident'],weight:action==='Interact'?1.4:1,capacity:slots.length,slots:slots.map(([x,z])=>galileePosition(s,x,z)),lookAt,dwell:action==='Interact'?[7,18]:[4,14]});return [P('west','器物觀察','LookAround',[[-9,3],[-7.6,3]],[-5,7]),P('rest','歇息與同行','Idle',[[-12,21],[-10.6,21]],[-24,15]),P('north',s==='boat'?'湖岸工作外望':'聚落外望','LookAround',[[-9,-13],[-7.6,-13]],s==='boat'?[-29,-17]:[0,-35]),P('court','院落交談','Idle',[[4,17],[5.4,17]],[1,3]),P('east','工作與生活比較','Interact',[[23,4],[24.4,4]],[35,7]),P('shade','蔭下停留','Idle',[[23,25],[24.4,25]],[34,22]),P('look','門徑觀察','LookAround',[[23,-12],[24.4,-12]],[31,-31]),P('south','同行相遇','Idle',[[0,27],[1.4,27]],[1,8])];}
export function galileeSpawnCandidates(s){const out=[];for(let x=-13;x<29;x+=2)for(let z=-16;z<30;z+=2)out.push(galileePosition(s,x,z));return out;}
