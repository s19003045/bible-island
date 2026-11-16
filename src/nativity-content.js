import {scriptureSource} from './scripture.js';
import {nativityPosition} from './nativity-exploration.js';
// Original, unnamed teaching residents. No portrayal of a measured biblical person's face or voice.
export const nativityHistorical={edition:'降生、成長與成年返鄉',category:'分卷、分地點與人生階段',scale:'成人約1.70m · 空槽為選定尺寸，家屋教具約1:10',extent:120,shadow:72,fogNear:150,fogFar:460,target:[0,4,-6],overview:[41,29,45],human:{target:[0,2,8],offset:[7,.4,7]},plan:94,close:[8,5,10],cutaway:false,stops:Object.fromEntries(['manger','home','tools'].map(s=>[s,nativityPosition(s,-5,7,1)])),facts:['路2有馬槽與包裹；牧人先在野外聽見，再前往看見，馬太博士不混在同一畫面。','拿撒勒成長、十二歲耶路撒冷聖殿的聽與問、返回拿撒勒分清；家屋不能證明原宅。','可6已是成年返鄉；木匠稱呼出於當地聽眾問句，並不是約瑟帶幼年耶穌做家具的操作記錄。'],limits:'三章是不同時地與人生階段，不是同一天相鄰房間。CSBT稱馬槽、客店、瑪麗亞；槽的材質、尺寸、襯墊、周圍動物及住宿屋型未完整交代，不把洞穴、獨立牛棚或親族客房之一認證為唯一原現場。空槽是物件教具，沒有嬰孩模型不表示敘事沒有孩子；不以縮小成人或可拋接包裹冒充嬰孩。原創家屋、道路、牧地、人物數量、衣裝與臉孔不認證原址、原宅、人口或具名人物實測外貌，瑪麗亞確切年齡和約瑟必是老人也未由本輪確定。野外報信與前往有先後；牧養工作不直接決定人的道德、識字或法律地位。馬太博士、進屋、禮物與後續另作分卷閱讀；三類禮物不給人數，兩歲以下的命令不確定來訪時孩子正好兩歲，也不把兒童受害或逃離設成得分暴力操作。兩卷未交代的逐日銜接不補成經文原文；星象、日期與生日未由現代模擬認證。拿撒勒研究只讀到IAA摘要及有限機構文字，未取得原文平面；多期住居、儲藏坑、後來用途與教堂不能同時裝回一世紀家屋，也不是伯利恆住宿證明。Pompei陶製小動物飼槽是另時另地功能比較，未目視原圖或量尺寸；UNESCO主誕堂條目說明紀念傳統與後期建築，不等於第一世紀出生房間已測繪。十二歲不是嬰孩或等比縮小成人；聖殿裡聽與問不改為在家屋授徒，父母焦急不做責怪或倒數遊戲。可6保留成年返鄉、會堂教導、聽眾問句及反應；不補出具名家庭的原工坊、工具箱、工資、產品或每日到西弗里的路線。木接合與屋頂拆解是現代比較方式，未被經文指定；Reading四世紀刨具不是一世紀加利利工具，London A2468的現代配柄不當古物。本輪未目視它們的照片，不從館藏尺寸臨摹。現代中文配音、環境音與創作配樂不認證古代口音或曲調。',sources:[
 {title:'路加的降生與牧人 · CSBT',...scriptureSource('Luke 2:1-20'),note:'行政行程、安放、野外聽見、前往與述說有先後；完整住宿施工圖未給。'},
 {title:'成長、節期與返回 · CSBT',...scriptureSource('Luke 2:21-52'),note:'嬰孩獻上、拿撒勒成長、十二歲耶路撒冷及返回分清。'},
 {title:'成年返鄉與當地問句 · CSBT',...scriptureSource('Mark 6:1-6'),note:'不是童年工坊實錄；木匠稱呼放在聽眾反應中閱讀。'},
 {title:'另讀馬太的敘事 · CSBT',...scriptureSource('Matthew 1:18-25;2:1-12;2:13-23'),note:'約瑟處境、博士進屋、改道及後續另讀；不混成路加降生同夜的群像。'},
 {title:'IAA：The Settlement History of Nazareth',url:'https://publications.iaa.org.il/atiqot/vol98/iss1/3/',note:'Alexandre，‘Atiqot98(2020)25–92。只讀摘要與引文，未取得原文平面；分期與儲藏脈絡不能認證原宅。'},
 {title:'Pompei：Antiquarium, Room I',url:'https://pompeiisites.org/en/boscoreale-en/antiquarium-sala-i/',note:'只讀官方展覽文字，義大利陶製庭院小動物飼槽另作功能比較；未目視原圖、取得尺寸或認證伯利恆槽具。'},
 {title:'UNESCO：Church of the Nativity and the Pilgrimage Route',url:'https://whc.unesco.org/en/list/1433/',note:'分辨信仰紀念傳統、後期建築與第一世紀場景，非本輪原住宿考古鑑定。'},
 {title:'Reading Museum：Carpenter’s plane REDMG1995.3.1',url:'https://collections.readingmuseum.org.uk/index.asp?filename=REDMG&hitsStart=7&mwsquery=%7Btotopic%7D%3D%7BSilchester+Collection%7D&page=record',note:'四世紀Silchester，鐵殘件與少量木跡；只讀物件文字，沒有臨摹完整古刨。'},
 {title:'London Museum：Chisel A2468',url:'https://www.londonmuseum.org.uk/collections/v/object-8972/chisel/',note:'羅馬時期鐵鑿，館方明說配柄為現代件；本輪未目視照片，不作耶穌原工具認證。'},
]};
const T=(id,question,answer,reference,passage,stop,followup)=>({id,question,answer,reference,passage,stop,followup});
const P=(id,name,role,s,greeting,topics)=>({id,name,role,era:'不同閱讀窗口 · 無名綜合教學居民',position:nativityPosition(s,3,13),style:1,motion:'idle',greeting,topics});
export const nativityPeople=[
 P('nativity-manger-resident','家屋外的導讀居民','馬槽、牧地與敘事先後','manger','先看看槽的內底，再把目光轉向較遠的牧地。路加先記孩子被安放，接著才轉到野外的牧人；空槽讓我們觀察物件，經文則讓我們聽見人的處境。',[
  T('manger','馬槽能告訴我們，整間住宿長什麼樣嗎？','它讓人想到敘事裡的安放和牧人尋找的記號，卻不能給整座房子的施工圖。經文沒有列出槽的材質、尺寸或房間位置；這件石質教具是新做的，不能靠它裁定洞穴、牛棚或親族家的一種說法。','路加福音2:6–12','Luke 2:6-12','manger',{question:'所以沒有嬰孩模型，就是故事沒有孩子嗎？',answer:'孩子、包裹與安放都要從經文讀清楚。這裡只展示物件，沒有用玩偶或縮小成人冒充初生嬰孩；教具展示的範圍，和敘事中發生的事，要分開理解。'}),
  T('shepherds','牧人是在槽旁聽見消息的嗎？','路加先把讀者帶到夜間的野外，牧人在那裡看守羊群、聽見消息。後來他們才商量前往、找到並述說；若把報信和看見都放在槽旁同時演，就會漏掉這些先後。','路加福音2:8–20','Luke 2:8-20','manger'),
  T('visitors','博士和牧人，要一起放在同一夜嗎？','先分別讀兩卷。路加這段說牧人，馬太另記博士進屋、禮物與後續。三類禮物沒有給出來訪人數，兩卷也沒有把所有事件排成同一夜；我們不把熟悉的佈景當成逐日行程。','路加福音2:15–20；馬太福音2:1–12','Luke 2:15-20;Matthew 2:1-12','manger'),
 ]),
 P('nativity-home-resident','院落旁的導讀居民','成長、節期與返回','home','移開屋頂，可以看看門洞和院落。這是日常空間的比較，不是已找到的原宅；讀到十二歲的節期時，還要把目光轉向另一座城，聽見尋找、聆聽與提問。',[
  T('places','成長與十二歲的故事，都發生在這間家屋嗎？','路加說到拿撒勒的成長，又記十二歲時上耶路撒冷守節。父母後來在聖殿找到耶穌，再讀到返回拿撒勒；城市、房屋與時刻要分清，不能把眼前小屋改名成聖殿。','路加福音2:39–52','Luke 2:39-52','home',{question:'找到古代家屋，就能認定是哪一家人住的嗎？',answer:'發掘可以幫助理解某些住居與不同時期，卻不能只憑一段牆或儲藏坑認出家人的名字。這件縮尺屋的房間、屋頂和擺設都是選定的比較，不是聖家原宅的測繪。'}),
  T('listening','十二歲時，他在教師中做什麼？','這段讓讀者看見他在教師中聽與問，也有父母尋找時的焦急，以及他們沒有領會的話。不要把這一幕直接改成在家屋開班授徒，或只留下誰找得快的計時遊戲。','路加福音2:41–50','Luke 2:41-50','home'),
  T('return','旅程後面，為什麼還要讀返回與成長？','返回把節期中的事件接回家庭關係和日常成長。經文沒有交代每一天的作息、全套家具或每人的年齡；模型能幫人想像生活空間，不能替這些空白編出一份已證實的日記。','路加福音2:51–52','Luke 2:51-52','home'),
 ]),
 P('nativity-work-resident','街區的導讀居民','成年返鄉與工作材料比較','tools','先看兩件木料怎樣接合，再讀馬可返鄉這一段。這裡已經是成年耶穌帶著門徒的時候；材料能幫忙理解工作，卻不能代替聽眾問了什麼、又怎樣回應。',[
  T('adult','馬可這裡是在說童年學做木工嗎？','這段已是成年耶穌帶門徒返鄉，安息日在會堂教導。當地聽眾驚訝，問到他的智慧、能力和身分；木匠這個稱呼在問句裡出現，不是約瑟正在教孩子做家具的現場記錄。','馬可福音6:1–6','Mark 6:1-6','tools',{question:'所以這種接合，就是耶穌用過的工法嗎？',answer:'不是。兩根木料的凹口和尺寸是現代教學選擇，讓人看清承托與接合。馬可沒有列出工具、接法、產品或工資；看懂教具，不等於取得他的原工具或原工坊。'}),
  T('question','為什麼不能只把木匠當成一張職業卡？','還要聽整段的問句和反應。人們提到他熟悉的家人，也對他產生排斥；職業稱呼嵌在返鄉與教導的處境中。不能只認出一件工具，就把他們的驚訝、疑問和回應全部略去。','馬可福音6:1–6','Mark 6:1-6','tools'),
  T('materials','館藏工具，可以直接補成這裡的原工具箱嗎？','先看每件物件的地點、年代和補配。另地的古刨殘件，或帶現代把手的鐵鑿，可以比較材料與保存狀況，卻不是一世紀拿撒勒的完整工具箱，更不能認定是耶穌或約瑟所有。','馬可福音6:1–3','Mark 6:1-3','tools'),
 ]),
];
export const nativityStopCopy={manger:{child:'看看空槽的內底，再向牧地方向望。先問牧人在哪裡聽見消息，別把所有來訪者放進同一夜。',study:'分開路加敘事、馬太另讀與原創槽具；CSBT用詞不等於完整住宿平面，材質與尺寸仍屬補足。'},home:{child:'移開屋頂看門洞，再問居民十二歲的聖殿事件在哪座城；模型小屋不會變成聖殿。',study:'拿撒勒、耶路撒冷與返回分清；IAA摘要的分期與儲藏脈絡不認證原宅，選定屋頂拆解不冒充經文事件。'},tools:{child:'抬起木料，換角度找兩個凹口，再問居民：馬可這時是在說童年，還是成年返鄉？',study:'可6的稱呼放回成年返鄉／會堂／聽眾反應。接合與材料另作現代比較，不認證原工具或特定工法。'}};
export const nativityLearning={opening:'先分清人在哪裡、敘事走到哪個階段，再看物件能幫助理解什麼。降生、成長與成年返鄉各有文本，不能靠熟悉的同框佈景代替閱讀。',closing:'帶著對人與日常空間的理解繼續讀。模型能讓物件更具體，也需要留下經文沒有給出的距離、樣貌與細節。',compare:'herod',child:[
 {id:'manger',stop:'manger',actor:'nativity-manger-resident',question:'路加這段的牧人，先在哪裡聽見消息？',options:['和家人同行的路上','夜間的野外','找到孩子之後的住宿處'],correct:1,hint:'先看空槽，再朝牧地方向望；請居民說說聽見與前往的先後。',explanation:'路2:8–14先記野外夜間，15節以後才讀前往；教具不能把兩處壓成同一幕。'},
 {id:'home',stop:'home',actor:'nativity-home-resident',question:'十二歲在教師中聽與問的那一段，地點在哪裡？',options:['耶路撒冷的聖殿','拿撒勒的家屋','伯利恆的住宿處'],correct:0,hint:'移開模型屋頂看日常空間，再問居民：哪一段要轉向另一座城閱讀？',explanation:'路2:41–50是耶路撒冷的事件；原創家屋不把教師搬到拿撒勒，也不是原宅。'},
 {id:'tools',stop:'tools',actor:'nativity-work-resident',question:'可6:1–6的木匠稱呼，出現在什麼處境？',options:['十二歲守節，在教師中聽與問','童年正在工坊跟約瑟做家具','成年返鄉、會堂教導與當地問句'],correct:2,hint:'抬起木料看看接合，再請居民說明馬可這時已到哪個人生階段。',explanation:'可6是成年返鄉的敘事；模型接合是現代比較，不能補成童年工坊實錄。'},
 ],study:[
 {id:'manger',stop:'manger',claim:'這件石質槽具的尺寸、輪廓與材質由現代教學選定。',kind:'reconstruction',basis:'路2:6–7記安放與馬槽，未給這件槽的材料與施工尺寸；Pompei另地飼槽只供功能比較。',limit:'不能裁定唯一原屋型、原槽材質、周邊動物或初生嬰孩的實際外貌。',reference:'Luke 2:6-12'},
 {id:'home',stop:'home',claim:'IAA拿撒勒研究摘要區分不同時期的遺跡及住居／地下儲藏脈絡。',kind:'research',basis:'Alexandre在‘Atiqot98(2020)的摘要提供分期與地下坑描述；這是特定發掘的研究資料。',limit:'本輪未取得完整論文和平面，不能認證聖家原宅，或把多期構件同時放進一世紀房屋。',reference:'Luke 2:39-52'},
 {id:'tools',stop:'tools',claim:'可6的木匠稱呼位於成年耶穌返鄉、教導與當地聽眾反應中。',kind:'text',basis:'可6:1–6可對讀門徒同行、安息日在會堂教導、問句和反應。',limit:'本段沒有列出原工具箱、接合工法、工資或童年師徒操作步驟。',reference:'Mark 6:1-6'},
 ]};
