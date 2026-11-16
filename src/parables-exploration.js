// Original life comparisons; the three parables are not one historical place.
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export function parablesFloor(id,x,z){
 if(id==='seed')return 1.10+.025*z;
 if(id==='sheep')return 1.10+(.018*(x+19)+.10*smooth((z+14)/40))*smooth((x+19)/5);
 return .75+.40*smooth((z+14)/40);
}
export const parablesPosition=(s,x,z,h=0)=>[x,parablesFloor(s,x,z)+h,z];
const surfaces={
 seed:[{id:'field-main-path',x1:-21,x2:28,z1:4,z2:27},{id:'field-observation',x1:-18,x2:8,z1:-13,z2:8},{id:'field-upper-path',x1:9,x2:21,z1:-24,z2:8}],
 sheep:[{id:'pasture-public-paths',x1:-18,x2:29,z1:-20,z2:26}],
 lamp:[{id:'light-courtyard',x1:-21,x2:29,z1:-14,z2:27},{id:'light-lane',x1:-18,x2:18,z1:-26,z2:-10}],
};
export const parablesSegments=[
 {id:'seed',number:1,name:'撒種：從聆聽讀到解明',reference:'馬可福音 4:1–20',passage:'Mark 4:1-20',person:'parables-field-resident',heading:'從看見地表，回到如何聽見與接受',intro:'田地是比喻生活的原創比較，不是耶穌講道的原址。先分清湖中船上的講述、後來的詢問和解明；薄土、岩床與植物不能替我們判定誰是好人或壞人。'},
 {id:'sheep',number:2,name:'迷羊：從接待讀到同樂',reference:'路加福音 15:1–7',passage:'Luke 15:1-7',person:'parables-pasture-resident',heading:'找到之後，還有回家同樂與解說',intro:'從聆聽與抱怨進到尋回的比喻，再讀朋友、鄰居與悔改的喜樂。少量原創羊作生活觀察，不稱為全體一百；九十九留在曠野，沒有補成已關進羊圈。'},
 {id:'lamp',number:3,name:'燈火：遲延、預備與結語',reference:'馬太福音 25:1–13',passage:'Matthew 25:1-13',person:'parables-light-resident',heading:'她們都睡著，敘事的差別在哪裡？',intro:'分時讀預備與遲延、半夜呼喊、交談、進門與後來請求，最後回到未知時刻與警醒。照明類型是有界線的原創比較，不把某件陶燈或火把認成故事原物。'},
].map(s=>({...s,spawn:parablesPosition(s.id,17,20),startLookAt:parablesPosition(s.id,-5,7,1),surfaces:surfaces[s.id],target:s.id==='seed'?[-7,3,-9]:s.id==='sheep'?[-11,3,-10]:[5,3,-12],overview:s.id==='seed'?[-38,26,43]:s.id==='sheep'?[-43,27,41]:[-38,29,45],human:{target:parablesPosition(s.id,-4,7,1.4),offset:[7,.4,7]},extent:140,shadow:76,plan:100}));
export const parablesSegmentById=new Map(parablesSegments.map(s=>[s.id,s]));
export const parablesReadingPhases={
 seed:[
  {id:'sowing',name:'湖邊講述與四種落處',passage:'Mark 4:1-9',heading:'先聽故事，也分清講述所在',intro:'耶穌在湖中的船上教導，眾人在岸邊。這裡的田野另作生活比較；故事中的路邊、岩石地、荊棘與好土壤有不同處境，沒有給四區等面積或唯一農法。',night:false},
  {id:'asking',name:'後來的詢問與比喻原因',passage:'Mark 4:10-12',heading:'故事之後，還有不容易省略的詢問',intro:'跟隨者和十二使徒在後來的處境詢問，經文談到奧祕與以賽亞引文。這段不能被四格土壤遊戲取代，也不讓玩家把居民判為永遠的外人。',night:false},
  {id:'hearing',name:'解明：聽見、接受與結實',passage:'Mark 4:13-20',heading:'從物件回到話語與人的處境',intro:'解明談話語如何被聽見，及患難、逼迫、憂慮、財富與欲望的作用。三十、六十和一百倍是比喻的數字，不拿來給孩子或信仰排高低分。',night:false},
 ],
 sheep:[
  {id:'listeners',name:'接待、聆聽與抱怨',passage:'Luke 15:1-3',heading:'先聽比喻回應了什麼問題',intro:'稅吏與罪人接近聆聽，法利賽人與經文士抱怨耶穌的接待和同桌。居民是無名生活比較角色，不用族群衣色或今日身分標籤替代這段處境。',night:false},
  {id:'found',name:'留下九十九、尋找直到找到',passage:'Luke 15:4-5',heading:'注意尋找、找到與快樂扛回',intro:'九十九留在曠野，一隻被尋找直到找到，然後快樂地被扛在肩上。沒有補出骨折、懸崖、狼戰或看守九十九的另一牧人，也不把玩家抓羊當作故事結局。',night:false},
  {id:'rejoicing',name:'回家同樂與悔改的喜樂',passage:'Luke 15:6-7',heading:'尋回之後，還有邀請與解說',intro:'朋友與鄰居被邀請同樂，結語轉向悔改與天上的喜樂。數量盤只幫助閱讀一百、九十九與一，不能取代接待、回應或誰需要悔改的詮釋討論。',night:false},
 ],
 lamp:[
  {id:'preparation',name:'預備、遲延與她們都睡著',passage:'Matthew 25:1-5',heading:'先讀燈與油，也看見十人都打盹',intro:'五聰明與五愚拙的預備不同，新郎遲延時她們都打盹睡著。不能把警醒做成禁止睡覺的耐力比賽，也不由童女稱呼補出確切年齡或服色。',night:true},
  {id:'midnight',name:'半夜呼喊、修整與交談',passage:'Matthew 25:6-9',heading:'聽見呼喊後，再讀她們的對話',intro:'半夜有人呼喊，十人醒來修整燈，接著求油與回答。呼喊者未指名；這段對話不是普遍不分享的規則，也不由照明模型定出油的唯一象徵。',night:true},
  {id:'door',name:'進門、關門與後來請求',passage:'Matthew 25:10-12',heading:'保留敘事的先後與嚴肅回應',intro:'有人去買時新郎來，預備者進入，門關上，後來其餘者來請求開門。經文沒有詳述交易是否完成；場景不讓玩家把同伴困在門外，也沒有驚嚇通關。',night:true},
  {id:'watch',name:'結語：未知時刻與警醒',passage:'Matthew 25:13',heading:'回到結語，而非計算油量或日期',intro:'警醒與不知道那日子和時刻相連，應回讀整段，亦可另看太24:36–44。模型的油瓶、火把概念與陶燈都不能用來預測日期或量測一個人的信仰。',night:true},
 ],
};
export const normalizeParablesPhase=(s,id)=>(parablesReadingPhases[s]?.find(p=>p.id===id)||parablesReadingPhases[s]?.[0])?.id||null;
export const parablesMoment=(s,p)=>parablesReadingPhases[s]?.find(q=>q.id===normalizeParablesPhase(s,p))||null;
export const parablesObjects=[
 {id:'parables-soil',segment:'seed',stop:'seed',name:'落處、土淺與根的剖示',description:'旋轉比較踏實路邊、薄土覆岩、荊棘與較深土層。根線、土深和並置布局是現代剖示，不是四塊等面積原田，也不認證穀種或古代產量。',observation:'可4先有講述、後來的詢問與解明。薄土和岩床幫助理解故事，再回讀話語、聽見、接受與結實；不把孩子判成壞土或按倍數排名。',passage:'Mark 4:1-20'},
 {id:'parables-flock',segment:'sheep',stop:'sheep',name:'一百、九十九與一的閱讀盤',description:'比較固定九十九枚與另一枚同尺寸中性籌，總數一百。這是現代閱讀法，不是古代計數器或牧場座標，沒有演出一隻已被重新放回九十九中。',observation:'九十九留在曠野，尋找到一隻後，故事還有扛回、回家邀人同樂與第7節解說。眼前少量動態羊只是生活示意，不冒充整個比喻羊群。',passage:'Luke 15:1-7'},
 {id:'parables-light',segment:'lamp',stop:'lamp',name:'照明類型、油瓶與預備比較',description:'旋轉看小陶燈、供油火把概念與獨立油瓶的開口、內底和現代支架。原創形制用來比較功能；lampas的研究分歧保留，不認證太25的唯一原器。',observation:'燈與油的敘事仍要連讀遲延、十人都睡、半夜醒來、交談、進門和結語。器物沒有替我們決定油的唯一神學象徵，也不提供燃燒時間或再來日期。',passage:'Matthew 25:1-13'},
].map(o=>({...o,position:parablesPosition(o.segment,-5,7,.82),approach:parablesPosition(o.segment,-5,9.4),lookAt:parablesPosition(o.segment,-5,7,1.1)}));
export function parablesWalkConfig(segment='seed',phase=null){const s=parablesSegmentById.get(segment)||parablesSegments[0],moment=parablesMoment(s.id,phase);return {...s,objects:parablesObjects.filter(o=>o.segment===s.id),segments:parablesSegments,segment:s.id,phases:parablesReadingPhases[s.id],phase:moment.id,moment,timeLocked:s.id==='lamp',night:moment.night,title:s.name,heading:moment.heading,intro:moment.intro,shortTitle:`${s.number} / 3 · ${s.name}`,era:'HEARING, FINDING & PREPARATION / 三段獨立比喻',destinations:true,recordedChild:true,teachingInspection:true,enter:'開啟聲音，走進本段',inspectionNote:'原創現代比較；非比喻原址、原計數器或已確定的婚禮原燈。',hint:'觀察生活物件與羊群，再回到講述處境、敘事與解說。',region:p=>s.id==='seed'?'田邊觀察與公共路線':s.id==='sheep'?'曠野與牧地比較區':'燈火準備與門前公共區'};}
export function parablesPOIs(s){
 const data=s==='seed'?[
  ['soil','剖面觀察','Interact',[[-10,10],[-8.6,10]],[-5,7]],['path','路邊停留','LookAround',[[-15,1],[-13.6,1]],[-29,-6]],['thin','土層外望','LookAround',[[-12,-8],[-10.6,-8]],[-30,-19]],['crop','穀作比較','LookAround',[[12,-16],[13.4,-16]],[-7,-25]],['shade','棚旁歇息','Idle',[[23,21],[24.4,21]],[33,23]],['lane','田間往來','Interact',[[14,1],[15.4,1]],[18,-12]],['south','同行相遇','Idle',[[0,23],[1.4,23]],[1,8]],['court','院落交談','Idle',[[4,17],[5.4,17]],[1,3]],
 ]:s==='sheep'?[
  ['flock','牧地外望','LookAround',[[-16,-9],[-14.6,-9]],[-31,-4]],['count','閱讀盤比較','Interact',[[-10,12],[-8.6,12]],[-5,7]],['ridge','遠坡外望','LookAround',[[23,-12],[24.4,-12]],[36,-23]],['court','歇腳交談','Idle',[[4,17],[5.4,17]],[1,3]],['shade','樹蔭停留','Idle',[[-14,21],[-12.6,21]],[-27,21]],['home','家屋外望','LookAround',[[5,-14],[6.4,-14]],[9,-32]],['lane','小路往來','Interact',[[23,6],[24.4,6]],[34,-3]],['south','同行相遇','Idle',[[20,23],[21.4,23]],[11,9]],
 ]:[
  ['light','照明比較','Interact',[[-10,12],[-8.6,12]],[-5,7]],['door','門前觀察','LookAround',[[10,-9],[11.4,-9]],[13,-20]],['lane','巷道往來','Interact',[[-10,-20],[-8.6,-20]],[-17,-29]],['shade','前廊歇息','Idle',[[-14,21],[-12.6,21]],[-25,20]],['court','院落交談','Idle',[[4,17],[5.4,17]],[1,3]],['east','街角外望','LookAround',[[23,6],[24.4,6]],[40,9]],['north','容器與日常','LookAround',[[-13,-10],[-11.6,-10]],[-25,-18]],['south','同行相遇','Idle',[[20,23],[21.4,23]],[11,9]],
 ];
 return data.map(([id,name,action,slots,lookAt])=>({id:'parables-'+id,name,action,tags:['parables-resident'],weight:action==='Interact'?1.4:1,capacity:slots.length,slots:slots.map(([x,z])=>parablesPosition(s,x,z)),lookAt,dwell:action==='Interact'?[7,18]:[4,14]}));
}
export function parablesSpawnCandidates(s){const out=[];for(const r of parablesSegmentById.get(s).surfaces)for(let x=Math.ceil(r.x1+1);x<r.x2;x+=2)for(let z=Math.ceil(r.z1+1);z<r.z2;z+=2)out.push(parablesPosition(s,x,z));return out;}
