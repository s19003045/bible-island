// Selected public reading spaces; relationships between cities are not a traversable ancient map.
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export const churchReadingPhases={
 gathering:[
  {id:'hear',name:'聚集、聽見與不同反應',space:'house',passage:'Acts 2:1-13',heading:'從驚奇繼續聽下去',intro:'房子中的聚集與後來聚來聽見的人分清；好像狂風的響聲、舌頭像火焰按文本閱讀，不改成風暴或火焰收集。這處房屋是選定空間比較，未認證與徒1同一樓房或120人的名單。',night:false},
  {id:'speech',name:'彼得開始講解：約珥引文',space:'house',passage:'Acts 2:14-21',heading:'辨認誰講話、引用誰的話',intro:'彼得和其他十一個使徒站起來，解釋眾人的疑惑並引用約珥。早上九點是15節講話中的時間；引文中的宇宙景象不全部做成當日實況。',night:false},
  {id:'witness',name:'耶穌與復活的見證',space:'house',passage:'Acts 2:22-36',heading:'留意講論如何走向宣告',intro:'連讀耶穌、死亡、復活與大衛經文的論述，再讀主與基督的宣告。空間模型不能替代論證，也不新增已確認的大衛原墓位置。',night:false},
  {id:'response',name:'聽眾提問與回應',space:'house',passage:'Acts 2:37-41',heading:'聽見之後，眾人問了什麼？',intro:'讀眾人的提問、彼得的勸告與領受後的回應。約三千是那天增加的人，不是原屋容量；不補唯一受洗池、固定隊列、方式或完成時長。',night:false},
 ],
 table:[
  {id:'practice',name:'教導、契合、掰餅與禱告',space:'meals',passage:'Acts 2:42-43',heading:'共同生活不只是一頓飯',intro:'這裡已進到後續持續生活的概述。普通器具幫助觀察，仍須連讀教導、契合、掰餅、禱告與敬畏；不是按鍵產生神蹟或一套已認證的固定儀程。',night:false},
  {id:'need',name:'按各人的需要分享',space:'meals',passage:'Acts 2:44-45',heading:'相同數量，不一定照顧到不同需要',intro:'如實讀變賣、共有與按需要分配；延伸對讀徒5:4的處置權，以及徒6:1供應中被忽略的寡婦。分享不改成強制沒收、捐物排名或沒有問題的均分樂園。',night:false},
  {id:'daily',name:'聖殿、各家與持續日常',space:'meals',passage:'Acts 2:46-47',heading:'把公共聚集與家中生活連起來',intro:'天天在聖殿、各家掰餅和用飯、讚美與增長一同閱讀。這處院落不等於聖殿，也不是五旬節同一天的一次宴席；日光只是本窗選定，非原用餐鐘點。',night:false},
 ],
 road:[
  {id:'scattered',name:'較後：患難中的分散與傳講',space:'antioch',passage:'Acts 11:19-21',heading:'已轉到較後敘事與敘利亞安提阿',intro:'回讀司提反與逼迫背景，再讀往腓尼基、塞浦路斯和安提阿的分散與傳講。不是休閒旅遊或五旬節同日轉場，也不是皮西迪亞地區的同名城。關係盤由散出端指向外地，不認證每人的原路線。',night:false},
  {id:'teaching',name:'巴拿巴、掃羅與整年教導',space:'antioch',passage:'Acts 11:22-26',heading:'先來的人、後來相遇與長期教導',intro:'耶路撒冷派巴拿巴；後來他到塔爾蘇找掃羅，再帶回安提阿，兩人整年教導。關係盤聚焦安提阿的長期生活，不把巴拿巴說成唯一創立者，也不把一年變成玩家走幾步的時間。',night:false},
  {id:'aid',name:'消息、按能力供應與送交長老',space:'antioch',passage:'Acts 11:27-30',heading:'援助方向是安提阿往猶太地',intro:'先讀阿伽布斯預告與敘述者的饑荒回顧，再讀各按能力供應，由巴拿巴與掃羅送交長老。箭頭此刻指回猶太地；不是同一群人原路往返、固定包裹內容或當日瞬間送達。',night:false},
 ],
};
export const normalizeChurchPhase=(s,id)=>(churchReadingPhases[s]?.find(p=>p.id===id)||churchReadingPhases[s]?.[0])?.id||null;
export const churchMoment=(s,p)=>churchReadingPhases[s]?.find(q=>q.id===normalizeChurchPhase(s,p))||null;
export function churchFloor(space,x,z){if(space==='house')return .82+.28*smooth((z+2)/35);if(space==='antioch')return 1.1+.018*x+.16*smooth((z+10)/35);return .86+.012*x+.18*smooth((z+12)/35);}
export const churchPosition=(space,x,z,h=0)=>[x,churchFloor(space,x,z)+h,z];
const surfaces={house:[{id:'house-public-interior-and-court',x1:-21,x2:29,z1:-19,z2:27}],meals:[{id:'meals-public-court',x1:-21,x2:29,z1:-19,z2:27}],antioch:[{id:'antioch-selected-public-court',x1:-21,x2:30,z1:-19,z2:27}]};
export const churchSegments=[
 {id:'gathering',number:1,name:'聚集、聆聽與回應',reference:'使徒行傳 2:1–41',passage:'Acts 2:1-41',person:'church-listener-resident',heading:'從聽見讀到講解與回應',intro:'聚集、聽見、彼得講話與眾人的回應分窗連讀；家屋是內外空間比較，不是已確認原樓房。'},
 {id:'table',number:2,name:'持續生活與按需要分享',reference:'使徒行傳 2:42–47',passage:'Acts 2:42-47',person:'church-meals-resident',heading:'食物、教導、禱告與照顧',intro:'後續生活的概述與五旬節當天分開，普通器物帶回群體中的不同需要。'},
 {id:'road',number:3,name:'較後分散、教導與安提阿援助',reference:'使徒行傳 11:19–30',passage:'Acts 11:19-30',person:'church-antioch-resident',heading:'關係跨地方，時間也拉長',intro:'敘利亞安提阿與耶路撒冷、猶太地分開；關係盤不是古地圖，一年教導和援助也不是同日往返。'},
];
export const churchSegmentById=new Map(churchSegments.map(s=>[s.id,s]));
export const churchObjectDefinitions=[
 {id:'church-house',segment:'gathering',stop:'gathering',name:'家屋內外與現代屋頂剖示',description:'旋轉看厚地板、入口和內外空間，再抬起現代屋頂比較。約1:20原創局部，不是五旬節原樓房、原座次或已知容量。',observation:'入口與房內外的關係幫助分清聚集者、聽見的人、講解與回應；仍須讀完整彼得講話，不能由幾個標記推成120或3000人的房間。',passage:'Acts 2:1-41'},
 {id:'church-table',segment:'table',stop:'table',name:'共餐器具與日常照顧比較',description:'看普通碗與杯的真口、內底及一份完整餅。器形、材質、尺寸和套數是現代選定，不是使徒原餐具或固定菜單。',observation:'把食物帶回教導、契合、禱告與按需要分享。兩只杯不是參加人數，碗的大小也不能替每個人決定相同份量。',passage:'Acts 2:42-47;Acts 5:4;Acts 6:1'},
 {id:'church-relations',segment:'road',stop:'road',name:'分散、教導與援助關係盤',description:'兩端、雙向箭頭、教導片與援助包是現代閱讀圖，不是古地圖。左為散出／猶太地合併閱讀端，右為敘利亞安提阿；請按時刻看方向文字。',observation:'分散向外、在安提阿整年教導、援助往猶太地依次分清。兩群不是全部去向或同一群人原路往返；包的內容、數量與輸送路線未經認證。',passage:'Acts 11:19-30'},
];
export function churchWalkConfig(segment='gathering',phase=null){
 const s=churchSegmentById.get(segment)||churchSegments[0],moment=churchMoment(s.id,phase),space=moment.space;
 const objects=churchObjectDefinitions.filter(o=>o.segment===s.id).map(o=>({...o,position:churchPosition(space,-5,7,.82),approach:churchPosition(space,-5,9.4),lookAt:churchPosition(space,-5,7,1.1)}));
 return {...s,space,surfaces:surfaces[space],spawn:churchPosition(space,17,20),startLookAt:churchPosition(space,-5,7,1),target:[-2,3,-9],overview:[-37,27,44],human:{target:churchPosition(space,-4,7,1.4),offset:[7,.4,7]},extent:140,shadow:76,plan:100,objects,segments:churchSegments,segment:s.id,phases:churchReadingPhases[s.id],phase:moment.id,moment,timeLocked:true,night:false,title:s.name,heading:moment.heading,intro:moment.intro,shortTitle:`${s.number} / 3 · ${s.name}`,era:'GATHERING, DAILY LIFE & ANTIOCH / 分時閱讀',destinations:true,recordedChild:true,teachingInspection:true,enter:'開啟聲音，走進本段',inspectionNote:'原創現代生活與關係比較；不是原屋、原餐具、古地圖或完整原人數。',hint:'分清當天與後續生活、不同地方和消息先後；物件觀察之後，繼續聽經文中的講解與回應。',region:()=>space==='house'?'家屋內外的公共觀察':space==='meals'?'日常共餐院落比較':'敘利亞安提阿公共生活比較'};
}
export function churchPOIs(segment,phase=null){const c=churchWalkConfig(segment,phase),space=c.space,data=[
 ['objects','觀察與對讀','Interact',[[-10,12],[-8.6,12]],[-5,7]],['north','內外聆聽','LookAround',[[0,-13],[1.4,-13]],[0,-20]],['west','路旁停留','LookAround',[[-14,-9],[-12.6,-9]],[-27,-18]],['shade','遮蔽處歇息','Idle',[[-14,21],[-12.6,21]],[-25,20]],['court','日常相遇','Idle',[[4,17],[5.4,17]],[1,3]],['east','街道外望','LookAround',[[23,6],[24.4,6]],[40,9]],['lane','往來與接待','Interact',[[2,-2],[3.4,-2]],[0,-12]],['south','同行交談','Idle',[[20,23],[21.4,23]],[11,9]],
 ];return data.map(([id,name,action,slots,lookAt])=>({id:'church-'+id,name,action,tags:['church-resident'],weight:action==='Interact'?1.4:1,capacity:2,slots:slots.map(([x,z])=>churchPosition(space,x,z)),lookAt,dwell:action==='Interact'?[7,18]:[4,14]}));}
export function churchSpawnCandidates(segment,phase=null){const c=churchWalkConfig(segment,phase),out=[];for(const r of c.surfaces)for(let x=Math.ceil(r.x1+1);x<r.x2;x+=2)for(let z=Math.ceil(r.z1+1);z<r.z2;z+=2)out.push(churchPosition(c.space,x,z));return out;}
export const churchObjects=churchSegments.flatMap(s=>churchWalkConfig(s.id).objects);
