const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export function samariaFloor(s,x,z){
 if(s==='road')return 2.4-.075*x+.06*Math.sin(z*.08);
 if(s==='inn')return .75+.40*smooth((z+14)/40);
 const natural=.65+.25*smooth((z+14)/40),centre=.65+.25*smooth(9/40),blend=smooth((Math.hypot(x+6,z+5)-3)/1.4);
 return centre+(natural-centre)*blend;
}
export const samariaPosition=(s,x,z,h=0)=>[x,samariaFloor(s,x,z)+h,z];
export const samariaWell={x:-6,z:-5,innerRadius:.72,outerRadius:1.10,rimHeight:.82,selectedDepth:3};
const yards={
 well:[{id:'well-public-court',x1:-24,x2:28,z1:-20,z2:26}],
 road:[{id:'road-downhill',x1:-19,x2:28,z1:-6,z2:6},{id:'road-west-observation',x1:-15,x2:10,z1:3,z2:20},{id:'road-east-observation',x1:13,x2:28,z1:-15,z2:22}],
 inn:[{id:'inn-courtyard',x1:-19,x2:29,z1:-17,z2:27},{id:'inn-shaded-entry',x1:6,x2:18,z1:-25,z2:-13}],
};
export const samariaSegments=[
 {id:'well',number:1,name:'井旁：求水、敬拜與聽見',reference:'約翰福音 4:1–42',passage:'John 4:1-42',person:'samaria-well-resident',heading:'從旅途的求水，讀到城人的親耳聽見',intro:'這章讀約翰記的旅途敘事。從約中午的井旁對話，經過進城邀人、門徒的食物與收割，再到住了兩天；不壓成同一時刻。'},
 {id:'road',number:2,name:'另讀比喻：看見之後靠近',reference:'路加福音 10:25–37',passage:'Luke 10:25-37',person:'samaria-road-resident',heading:'先讀問題，再走進比喻的道路',intro:'閱讀轉到路加：律法師問，耶穌反問，接著律法師再問誰是鄰人。比喻中的路從耶路撒冷下耶利哥，沒有搬到撒馬利亞；坡路為原創觀察空間。'},
 {id:'inn',number:3,name:'續讀比喻：照顧、託付與承諾',reference:'路加福音 10:33–37',passage:'Luke 10:33-37',person:'samaria-care-resident',heading:'照顧不是只有付款，故事還有最後的問句',intro:'續讀同一比喻的當日照顧、第二天託付和未來責任，再回到誰成為鄰人。不是第二個考古事件，也不把回來的承諾演成已經履行。'},
].map(s=>({...s,spawn:samariaPosition(s.id,s.id==='road'?19:12,18),startLookAt:samariaPosition(s.id,-5,7,1),surfaces:yards[s.id],target:s.id==='road'?[1,3,-3]:s.id==='well'?[-3,3,-10]:[5,3,-12],overview:s.id==='road'?[-35,22,35]:s.id==='well'?[-38,29,46]:[-37,30,47],human:{target:samariaPosition(s.id,-4,7,1.4),offset:[7,.4,7]},extent:140,shadow:76,plan:100}));
export const samariaSegmentById=new Map(samariaSegments.map(s=>[s.id,s]));
export const samariaReadingPhases={
 well:[
  {id:'water',name:'旅途、求水與活水',passage:'John 4:1-15',heading:'在約中午的旅途中，先聽求水的話',intro:'耶穌因旅途困倦坐在井旁，門徒去買食物；對話從求水進到活水。水罐與井幫助理解生活，不補稱婦人已裝滿、耶穌已喝水或婦人因被排擠才在此時來。',night:false},
  {id:'worship',name:'關係、敬拜與彌賽亞',passage:'John 4:16-26',heading:'話題推進到敬拜，也聽見身分的回應',intro:'連讀關係的對話、先知、這座山與耶路撒冷、敬拜以及彌賽亞。模型沒有從丈夫的話補出妓女身分，也不把不同時期的完整山上聖所搬到井旁。',night:false},
  {id:'witness',name:'放下水罐、邀人與收割',passage:'John 4:27-38',heading:'看她進城，也聽門徒與耶穌接下來的對話',intro:'門徒回來後，婦人放下水罐進城邀人；這其間有食物與收割的對話。罐放下不等於被摔碎，這段也不是只剩一件器具的機構操作。',night:false},
  {id:'hearing',name:'從見證到親耳聽見、兩天',passage:'John 4:39-42',heading:'城人先聽見見證，後來親自聽見',intro:'分清因婦人的見證而信，以及後來親耳聽見；耶穌住了兩天。這是較後閱讀窗口，不讓所有人同在最初中午的一口井邊完成全部故事。',night:false},
 ],
 road:[
  {id:'questions',name:'律法師先問、耶穌反問',passage:'Luke 10:25-28',heading:'先聽誰發問，也分清誰回答',intro:'律法師先問如何承受永生；耶穌問律法上寫的是什麼、怎樣讀，律法師回答愛神與愛鄰人。比喻之前的問答不能省去，也不把說話者對調。',night:false},
  {id:'passing',name:'再問鄰人：看見與經過',passage:'Luke 10:29-32',heading:'第二個問題帶出道路上的比喻',intro:'律法師再問誰是鄰人，耶穌講一人從耶路撒冷下耶利哥及祭司、利未人經過。文本沒有交代兩人內心動機；中性站位不把族群分成可攻擊的善惡隊。',night:false},
  {id:'approach',name:'看見、憐憫與主動靠近',passage:'Luke 10:33-34',heading:'同樣看見，接下來的行動有什麼不同？',intro:'撒瑪利亞人看見而動了慈心，靠近、處理傷處，用自己的牲口帶到旅店照顧。牲口種類未給；玩家沿安全坡路觀察相對位置，不演操作傷者的救援競賽。',night:false},
 ],
 inn:[
  {id:'care',name:'當日：靠近並持續照顧',passage:'Luke 10:33-34',heading:'從靠近延續到旅店裡的照顧',intro:'油、酒、包紮、自己的牲口和旅店照顧都在比喻中。普通容器與布料幫助想像日常用途，不將敘事變成現代傷口處置教學。',night:false},
  {id:'entrust',name:'第二天：兩個銀幣與託付',passage:'Luke 10:35',heading:'把第二天的交付與前一天分清',intro:'第二天交付兩個銀幣並請店主照顧；教具用兩枚放大中性圓片看清數量。不是已驗原幣，也不從數量推成固定房價、兩晚住宿或康復保證。',night:false},
  {id:'promise',name:'未來承諾與誰成為鄰人',passage:'Luke 10:35-37',heading:'承諾還指向未來，問句轉向如何成為鄰人',intro:'額外費用與回來償還仍是承諾，故事沒有演出他已回來。耶穌最後問誰成為鄰人，律法師回答施憐憫的人，再聽去如此做；回連最初25–29節。',night:false},
 ],
};
export const normalizeSamariaPhase=(s,id)=>(samariaReadingPhases[s]?.find(p=>p.id===id)||samariaReadingPhases[s]?.[0])?.id||null;
export const samariaMoment=(s,p)=>samariaReadingPhases[s]?.find(q=>q.id===normalizeSamariaPhase(s,p))||null;
export const samariaObjects=[
 {id:'samaria-jar',segment:'well',stop:'well',name:'水罐內外與現代剖示',description:'旋轉看真口、內底和固定後把手，再移開現代前半剖面。原創罐形及尺寸用來理解取水生活，不是婦人的原罐，也不是她把罐打碎的動畫。',observation:'從求水進到活水、敬拜與彌賽亞，再讀放下水罐、進城邀人及城人親耳聽見。罐沒有替我們補出她被排擠、已盛水或拆罐的情節。',passage:'John 4:1-42'},
 {id:'samaria-road',segment:'road',stop:'road',name:'坡路、繞行與靠近閱讀盤',description:'旋轉看連續高差和三枚相同的中性站位。坡度、路線與站位都是現代教具選定，沒有還原三人的原足跡，也不用服色區分族群性格。',observation:'先回讀律法師與耶穌的問答，再比較看見而經過、看見而靠近，最後繼續讀誰成為鄰人。比喻的耶路撒冷下耶利哥路不等於井旁地圖。',passage:'Luke 10:25-37'},
 {id:'samaria-care',segment:'inn',stop:'inn',name:'照顧、託付與責任比較組',description:'旋轉看普通容器、布料、真底承盤及兩枚放大中性圓片。物件用來比較照顧與第二天交付，沒有認證原旅店、原瓶型或故事中的兩枚古幣。',observation:'當日照顧、第二天託付和將來額外費用的承諾有時間差。付款不是康復倒數；故事最後還問誰成為鄰人，並帶出如何去做。',passage:'Luke 10:33-37'},
].map(o=>({...o,position:samariaPosition(o.segment,-5,7,.82),approach:samariaPosition(o.segment,-5,9.4),lookAt:samariaPosition(o.segment,-5,7,1.1)}));
export function samariaWalkConfig(segment='well',phase=null){const s=samariaSegmentById.get(segment)||samariaSegments[0],moment=samariaMoment(s.id,phase);return {...s,objects:samariaObjects.filter(o=>o.segment===s.id),segments:samariaSegments,segment:s.id,phases:samariaReadingPhases[s.id],phase:moment.id,moment,timeLocked:false,night:false,title:s.name,heading:moment.heading,intro:moment.intro,shortTitle:`${s.number} / 3 · ${s.name}`,era:'WELL, ROAD & CARE / 敘事與比喻的轉場',destinations:true,recordedChild:true,teachingInspection:true,enter:'開啟聲音，走進本段',inspectionNote:'原創閱讀比較；不是約4原罐、原井測繪、比喻原路或原旅店。',hint:'靠近居民與生活教具，再回完整問答和回應。分章與時刻會換閱讀焦點；觀察不自動完成讀經。',region:p=>s.id==='road'?(p[2]<3?'下降道路觀察區':'路旁公共停留區'):s.id==='well'?'井旁與村路公共區':'旅店公共院落'};}
export function samariaPOIs(s){
 const P=(id,name,action,slots,lookAt)=>({id:'samaria-'+id,name,action,tags:['samaria-resident'],weight:action==='Interact'?1.4:1,capacity:slots.length,slots:slots.map(([x,z])=>samariaPosition(s,x,z)),lookAt,dwell:action==='Interact'?[7,18]:[4,14]});
 const road=[['upper','高處外望','LookAround',[[-14,-2],[-12.6,-2]],[-33,-4]],['bend','路旁觀察','LookAround',[[-2,-3.5],[-.6,-3.5]],[4,-15]],['court','路旁相遇','Idle',[[4,17],[5.4,17]],[1,3]],['west','器物比較','Interact',[[-10,12],[-8.6,12]],[-5,7]],['middle','沿路交談','Idle',[[9,2],[10.4,2]],[0,-2]],['lower','下降路段','LookAround',[[23,-10],[24.4,-10]],[43,-18]],['rest','低處歇息','Idle',[[23,18],[24.4,18]],[34,22]],['east','行旅往來','Interact',[[23,8],[24.4,8]],[32,4]]];
 const well=[['well','井緣觀察','LookAround',[[-8.7,-4],[-8.7,-2.6]],[-6,-5]],['village','村路外望','LookAround',[[6,-14],[7.4,-14]],[8,-36]],['west','器物比較','Interact',[[-10,10],[-8.6,10]],[-5,7]],['shade','樹蔭停留','Idle',[[-19,18],[-17.6,18]],[-29,13]],['court','院落交談','Idle',[[4,17],[5.4,17]],[1,3]],['path','道路往來','Interact',[[23,4],[24.4,4]],[34,-3]],['south','同行相遇','Idle',[[0,23],[1.4,23]],[1,8]],['east','山坡外望','LookAround',[[23,22],[24.4,22]],[38,27]]];
 const inn=[['door','遮蔽入口','LookAround',[[10,-20],[11.4,-20]],[12,-28]],['porch','院前往來','Interact',[[10,-9],[11.4,-9]],[12,-25]],['west','器物比較','Interact',[[-10,12],[-8.6,12]],[-5,7]],['shade','庭側歇息','Idle',[[-14,21],[-12.6,21]],[-25,20]],['court','院落交談','Idle',[[4,17],[5.4,17]],[1,3]],['east','道路外望','LookAround',[[23,6],[24.4,6]],[40,9]],['north','容器與日常','LookAround',[[-13,-12],[-11.6,-12]],[-25,-18]],['south','同行相遇','Idle',[[20,23],[21.4,23]],[11,9]]];
 return (s==='road'?road:s==='inn'?inn:well).map(v=>P(...v));
}
export function samariaSpawnCandidates(s){const out=[];for(const r of samariaSegmentById.get(s).surfaces)for(let x=Math.ceil(r.x1+1);x<r.x2;x+=2)for(let z=Math.ceil(r.z1+1);z<r.z2;z+=2)out.push(samariaPosition(s,x,z));return out;}
