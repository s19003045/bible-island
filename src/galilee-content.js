import {scriptureSource} from './scripture.js';
import {galileePosition} from './galilee-exploration.js';
export const galileeHistorical={edition:'湖岸、聚集與家屋',category:'分章閱讀，也明示回看',scale:'成人約1.70m · 船段是局部比較，屋面教具約1:10',extent:135,shadow:76,fogNear:160,fogFar:500,target:[2,4,-18],overview:[-44,34,57],human:{target:[-4,2,7],offset:[7,.4,7]},plan:100,close:[8,5,10],cutaway:false,stops:Object.fromEntries(['boat','synagogue','house'].map(s=>[s,galileePosition(s,-5,7,1)])),facts:['湖邊兩對兄弟的撒網與修網有區別；可4的晚上渡湖是較後的另一段。','可1會堂核心是教導、權柄與人的反應；今日較晚白石遺構不是當時完整建築。','可2拆通屋頂之後，還要連讀赦罪、經文士心中所想、耶穌的回應及拿墊子出去。'],limits:'三章為原創閱讀觀察區，不是同日相鄰的測繪地圖。古船原物定年約公元前100至公元100、館方說約8米，不能認成耶穌或門徒所有；局部船段的曲線、尺寸、可移肋及支承是選定現代教具，不是原船精密縮尺。IAA木材研究本輪只讀摘要，12植物屬不改成精確12樹種，沒有取得全部榫釘或修補技術圖。完整情境船另為原創背景，水面、天候、網目、服裝、數量與航行設備不作原航次認證。玩家在安全岸上觀察，不用倒數或翻船衡量信心。可1安息日教導不補成讀特定卷書；原創聚集空間不認證一世紀完整會堂，較晚白石會堂、黑石基礎及不同分期分開研究，石色不是年代公式。可2未給房主與四人名字，不因紀念傳統認證原宅；SBF文字與圖注已讀，但本輪未目視原平面，不把四世紀拱和後期住居全移入一世紀。屋面升起是現代剖示，不是原有活動天窗；場景開口也只作閱讀示意。傷病、信心與汙靈敘事保留文本和詮釋層，不拿來診斷或責怪現代身障者、精神疾病或抽搐者。角色是無名綜合居民，不冒充具名人物面容或全部事件目擊者；中文配音及環境聲是現代設計。',sources:[
 {title:'湖岸的工作與呼召 · CSBT',...scriptureSource('Mark 1:16-20'),note:'撒網與稍前行修網分開；保留父親西庇太與雇工們的處境。'},
 {title:'安息日教導與眾人反應 · CSBT',...scriptureSource('Mark 1:21-28'),note:'未指正在讀特定書卷；後面1:29的住家是另一個轉場。'},
 {title:'門前、屋頂及權柄的問答 · CSBT',...scriptureSource('Mark 2:1-12'),note:'過些日子又到迦百農；四人抬來，拆通之後仍連讀後半段。'},
 {title:'另讀較後的晚上渡湖 · CSBT',...scriptureSource('Mark 4:35-41'),note:'其他船、船尾枕頭、叫醒、平靜與最後問句；不與可1合成同一航次。'},
 {title:'Yigal Allon Centre：The Ancient Boat',url:'https://yigal-allon-centre.org.il/en/the-museum/the-ancient-boat/',note:'館方展覽正文及舊頁定年已讀；約8米為原物概數，不認證船主。本輪未成功目視原物圖，不精密臨摹。'},
 {title:'IAA：Identification of the Wood in the Ancient Boat',url:'https://publications.iaa.org.il/atiqot/vol50/iss1/13/',note:'Werker，‘Atiqot50(2005)。只讀摘要：船板、肋、龍骨及木連接部件，鑑別12植物屬；未讀全部技術圖。'},
 {title:'IAA：Conservation of the Ancient Boat',url:'https://publications.iaa.org.il/atiqot/vol50/iss1/12/',note:'Cohen，‘Atiqot50(2005)。摘要區分木材、腐朽及保存；下載全文403，不能由現代展架推定古代構件。'},
 {title:'INPA：Kfar Nahum National Park',url:'https://en.parks.org.il/reserve-park/kfar-nahum-capernaum-national-park/',note:'官方頁正文已讀，今日會堂屬較晚／拜占庭時期；不能當可1完整原室。'},
 {title:'SBF：Cafàrnao — La Domus Ecclesia',url:'https://sbf.custodia.org/sites/default/files/2025-12/Luca%20-%20Cafarnao%203%20Domus%20Ecclesia%202025.pdf',note:'Luca2025教學綜述，七頁文字／圖注已讀，圖形未目視；住居、後來聚集改建與八角堂分期，不認證可2屋主。'},
]};
const T=(id,question,answer,reference,passage,stop,followup)=>({id,question,answer,reference,passage,stop,followup});
const P=(id,name,role,s,greeting,topics)=>({id,name,role,era:'加利利閱讀窗口 · 無名綜合居民',position:galileePosition(s,3,13),style:1,motion:'idle',greeting,topics});
export const galileePeople=[
 P('galilee-shore-resident','湖岸工作的居民','網具、木構與不同航程','boat','先朝湖岸看看，再觀察船段內側的支承。馬可讓我們遇見正在撒網和修網的人，也留下他們怎樣回應呼召；較後的風浪段落，則帶來另一組需要仔細聽的問句。',[
  T('work','兩對兄弟，正在做一樣的工作嗎？','西門和安得烈正在撒網。稍前行，才見雅各和約翰在船上修網；父親西庇太和雇工們也在敘事中。工作動作和相遇的先後值得分清，不能把每個人都排成同一艘滿載出航的船。','馬可福音1:16–20','Mark 1:16-20','boat',{question:'出土古船年代相近，就能認定是他們的船嗎？',answer:'年代相近讓它成為很有價值的比較，但沒有替船主簽名。館方的原物有發現與保存歷史；我們看的局部船段則是新做的構造教具，不是那艘船的完整複製，更不是某次航行的證物。'}),
  T('journey','修網後面，就接著是這場風浪嗎？','要跳到較後的第四章另讀。那裡接在教導之後，晚上離開群眾，有其他船同行。第一章的呼召和第四章的渡湖不是一趟連續航程；看見相似的船與湖岸，還要留意章次和處境。','馬可福音1:16–20；4:35–36','Mark 1:16-20;4:35-36','boat'),
  T('questions','平靜之後，為什麼還要讀最後的問句？','風浪中有門徒的害怕、叫醒和呼求，也有耶穌的回應。平靜不是閱讀的終點；後面仍有對門徒的話，和他們關於耶穌身分的提問。岸上水面的變化是閱讀氣氛，不能代替這些人的聲音。','馬可福音4:37–41','Mark 4:37-41','boat'),
 ]),
 P('galilee-gathering-resident','聚集空間旁的居民','教導、權柄與分期比較','synagogue','先看看人可以怎樣聚集和往來，再回到安息日的教導。這個閱讀窗口會讓我們聽見驚訝、斥責與談論；眼前石材的深淺，還需要和建築的年代問題分開理解。',[
  T('teaching','這一段是在記讀哪一卷書嗎？','馬可說耶穌在迦百農的會堂教導，人對他的教導感到驚訝。這一段沒有點出正在讀哪卷書；我們可以從聚集空間想像聆聽，仍要把注意力留給教導、權柄和後面人的反應。','馬可福音1:21–22','Mark 1:21-22','synagogue',{question:'今日宏偉的白石會堂，就是這一刻的原建築嗎？',answer:'今日可見遺構有自己的建造和使用分期，官方資料把宏偉會堂放在較晚階段。它能幫助研究地方的歷史，卻不能直接當成馬可第一章的完整原室；深色石頭也不會自動替所有構件斷代。'}),
  T('response','教導之後，敘事怎樣繼續？','接著讀到被汙靈附身的人、耶穌斥責汙靈和汙靈出來，再聽眾人的驚訝和談論。這不是只有建築背景的一段；人物導讀幫助分清先後，不讓玩家攻擊誰，也不拿這段去替現代疾病貼上怪物標籤。','馬可福音1:23–28','Mark 1:23-28','synagogue'),
  T('stones','兩盤不同顏色的石頭，能直接排出年代嗎？','先看材料，再看研究如何判斷建築分期。顏色和年代是兩個問題，同一地方也可能有改建和再利用。兩盤原創石材只是並置比較，不能疊成一份已證實的一世紀會堂剖面。','馬可福音1:21–28','Mark 1:21-28','synagogue'),
 ]),
 P('galilee-house-resident','家屋外緣的居民','通達、屋面與完整故事','house','從門前走到屋面比較處，看看接近一個人會遇到什麼障礙。接著還要回到房子裡的話語與回應：拆通屋頂並不是結尾，馬可讓我們繼續讀到那人起身拿墊子出去。',[
  T('access','四人為什麼沒有直接從門前抬近？','馬可先說人聚集，連門前也沒有空間。四人抬著癱瘓的人來，難以靠近，後來從上方拆通屋頂並縋下。這些動作讓人留意他們的處境；模型能比較通達，卻沒有替四人或屋主補名字。','馬可福音2:1–4','Mark 2:1-4','house',{question:'抬起教具屋頂，表示古代原有這樣的活動蓋嗎？',answer:'抬起整層是我們觀看室內、梁和牆的現代方式。經文記屋頂被拆通，沒有交代原有天窗、鉸鏈或滑輪。這間縮尺比較屋也不是原宅測繪，不能從它補出所有人的操作步驟。'}),
  T('authority','拆通屋頂後，還有哪些話不能漏讀？','接著有赦罪的話、經文士心中所想，以及耶穌對他們的回應。最後那人起來拿墊子出去，眾人驚訝並歸榮耀給神。若只完成一個屋頂工程謎題，就會漏掉權柄的問題與整段故事的回應。','馬可福音2:5–12','Mark 2:5-12','house'),
  T('home','看到古代住居，就能知道這是誰的房子嗎？','考古能研究住居形式、材料和不同時期的變化，認定特定屋主卻還需要別的依據。馬可這一段沒有給房主名字；後來紀念傳統與改建也要分開，不能把眼前模型叫作已找到的原宅。','馬可福音2:1–12','Mark 2:1-12','house'),
 ]),
];
export const galileeStopCopy={boat:{child:'先分清撒網和修網，再問居民風浪屬哪一章。抬起船段曲肋，看看它原來接在哪裡。',study:'可1與可4分時閱讀；IAA摘要的部件及木材鑑別，和教具曲線／支承／可移肋的現代選擇分開。'},synagogue:{child:'看看並置的兩盤石材，再問居民眾人對什麼感到驚訝；石色不能直接說出建築年代。',study:'可1的教導與反應、較晚遺構的研究分期、原創聚集空間分層對讀，不搬入特定讀卷。'},house:{child:'從門前想到屋頂，抬開教具看梁和室內，再讀那人最後拿起什麼出去。',study:'分清通達、拆通、赦罪與權柄回應；現代抬頂不證明古代有天窗，住居研究不直接認證可2屋主。'}};
export const galileeLearning={opening:'先聽人正在做什麼、怎樣提問和回應，再用船段、石材與屋面幫助觀察。章次會前進，也會明示回看；相似的湖岸或房屋不把不同時刻壓成一天。',closing:'帶著工作、聚集和通達的理解再讀經文。物件讓生活更具體，完整故事中的聲音與回應，仍要繼續聽。',compare:'nativity',child:[
 {id:'boat',stop:'boat',actor:'galilee-shore-resident',question:'可1稍前行看見雅各和約翰時，他們正在做什麼？',options:['正和群眾聽會堂教導','在船上修網','已在第四章的風浪中渡湖'],correct:1,hint:'先看船段的支承，再朝湖岸工作處望；請居民分清撒網、稍前行修網和較後渡湖。',explanation:'可1:19記船上修網；撒網是前面另一對兄弟的動作，風浪在較後的可4。'},
 {id:'synagogue',stop:'synagogue',actor:'galilee-gathering-resident',question:'可1:21–22的人先對什麼感到驚訝？',options:['耶穌的教導','石材比較台的顏色','屋頂的活動蓋'],correct:0,hint:'看看聚集的空間和兩盤石材，再問居民：這一段先讓人聽見什麼？',explanation:'先讀教導與權柄，再連讀後面的事件及反應；石材模型不能代替故事核心。'},
 {id:'house',stop:'house',actor:'galilee-house-resident',question:'可2最後，那人起來拿著什麼出去？',options:['兩盤石材','一艘船的曲肋','他的墊子'],correct:2,hint:'移開屋面看通達，再請居民帶你讀故事後半；屋頂被拆通還不是結尾。',explanation:'可2:11–12把起身、拿墊子和出去連在一起，仍要連讀話語、心中問題和眾人的反應。'},
 ],study:[
 {id:'boat',stop:'boat',claim:'IAA古船木材研究摘要鑑別出12個植物屬，主要為雪松類與橡木類。',kind:'research',basis:'Werker在‘Atiqot50(2005)的摘要，記木材鑑別與不同部件；本輪只讀摘要。',limit:'不是精確12樹種或宗教數字象徵，也未由摘要核驗全部榫釘、曲率和修補技術圖。',reference:'Mark 1:16-20;4:35-41'},
 {id:'synagogue',stop:'synagogue',claim:'可1:21–22先記安息日的教導，以及人對教導的驚訝。',kind:'text',basis:'直接對讀可1:21–22，再接23–28的事件、談論與消息傳開。',limit:'本段沒有說正在讀哪卷書，也沒有給完整一世紀會堂施工圖。',reference:'Mark 1:21-28'},
 {id:'house',stop:'house',claim:'整層屋面和梁能向上抬起，是本教具選定的現代剖示方式。',kind:'reconstruction',basis:'可2:4記拆通屋頂及縋下；教具另以可移整層幫助看室內和承托。',limit:'不證明原有活動蓋、天窗、鉸鏈或滑輪，不認證屋主和四人身分。',reference:'Mark 2:1-12'},
 ]};
