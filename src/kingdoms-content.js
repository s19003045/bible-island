import {scriptureSource} from './scripture.js';
import {kingdomsPosition} from './kingdoms-exploration.js';
export const kingdomsHistorical={edition:'從不同回應，讀到城門中的公正',category:'列王紀與阿摩司 · 不同地點與世代分章',scale:'成人約1.70m · 地名、年代與原創構造分清',extent:120,shadow:72,fogNear:160,fogFar:460,target:[0,4,-6],overview:[41,29,45],human:{target:[0,2,8],offset:[7,.4,7]},plan:94,close:[8,5,10],cutaway:false,stops:Object.fromEntries(['south','north','prophet'].map(s=>[s,kingdomsPosition(s,-5,7,1)])),facts:['王上12從示劍的交涉、第三天回應走向分裂，之後才返回耶路撒冷及止戰；交涉起點在示劍，返回耶路撒冷是後續。','尼八之子耶羅波安的建造、憂慮與伯特利／但兩處安排涉及不同地點，不是同一庭院或後來歐姆利的撒瑪利亞。','阿摩司所處的約阿施之子耶羅波安世代較晚；摩5的城門公正與摩8的量斗、天平延伸各有自己的出處。'],limits:'三章分開地點與世代，原創山地、家屋、道路、公共相遇空間、城門、衣裝與臉孔不作原址或肖像認證。北／南國是歷史政治及敘事稱呼，不直接對應現代國界、民族臉型、膚色、好壞制服；長者與年輕人的建議按本段具體內容比較。交涉開場在示劍，回耶路撒冷與止戰屬後續，不在同一路口步行穿越兩城。尼八之子與約阿施之子耶羅波安不可同場在位；一世／二世是後來辨別稱呼，摩7的伯特利祭司亞瑪謝也不混同猶大同名王。示劍、毗努伊勒、伯特利、但、提爾撒、歐姆利後建的撒瑪利亞各分時間與地點。牛犢數量和兩處來自文字，形體、大小、金色處理與基座為補足；未取得認證兩隻原件，不造確定角壇、鑄法或宮殿圖。Tel Dan聖區有不同階段、部分修復與現代展示，不把青銅時代拱門、現代不鏽鋼框或晚期銘文移成王上12一次工程。摩5:24的流水是比喻，不認證實際水道；糧稅、賄賂與城門公正屬摩5，量斗／天平另讀摩8。容量與重量分開，謝克爾不用後期硬幣代替，譯本換算不給出原器形制、全國實測標準或確定砝碼刻字。模型是現代教具，不教賄賂、造假牟利、投石、增加苦役或受害者懲罰遊戲。無名綜合角色不替具名人物自稱第一手見證；摩7各說話者與轉述分清。未逐頁讀發掘總報告或Hecht圖錄，Weights直連502僅核館方快取文字；不從摘要造細部。現代配樂與中文AI配音不冒充古代原音。',sources:[{title:'列王紀上12 · CSBT',...scriptureSource('1 Kings 12'),note:'先讀請求與不同回應，再讀兩處設立及後續。'},{title:'阿摩司的世代、城門公正與延伸',...scriptureSource('Amos 1:1;5;7:10-17;8:4-6'),note:'區分兩位同名王、說話者，以及摩5核心與摩8器物。'},{title:'NGSBA：Tel Dan發掘',url:'https://ngsba.org/excavations/tel-dan/',note:'不同聖區階段、城門與部分修復；非王上12完整工程圖。'},{title:'INPA：Tel Dan導覽第五站',url:'https://www.parks.org.il/article/tel-dan-audio-5/',note:'核對官方文字中的現代金屬展示及晚期銘文，未聽驗音檔。'},{title:'Hecht Museum：Measuring and Weighing',url:'https://mushecht2.haifa.ac.il/index.php?Itemid=178&id=214&lang=en&option=com_content&view=category',note:'容量與重量的有限比較，未取得逐頁圖錄或北國原器測繪。'},{title:'Bank of Israel：Currency Exhibition, Part1',url:'https://www.boi.org.il/en/bank-of-israel/education-and-visitors-center/the-currency-exhibit-development-of-money/part1/',note:'秤銀與石砝碼的跨地多時比較，不直接搬後期硬幣。'}]};
const T=(id,question,answer,reference,passage,stop,followup)=>({id,question,answer,reference,passage,stop,followup});
const P=(id,name,role,s,greeting,topics)=>({id,name,role,era:'列王紀／阿摩司 · 無名綜合教學角色',position:kingdomsPosition(s,3,13),style:1,motion:'idle',greeting,topics});
export const kingdomsPeople=[
 P('kingdoms-assembly-resident','交涉旁的居民','減輕負擔、建議與回應','south','先看看閱讀盤上的三個日期籌。會眾來到示劍，希望減輕負擔；羅波安請他們第三天再來。等待之間，他聽了不同的建議，我們可以跟著話語的先後讀下去。',[
 T('request','人們希望改變什麼？','他們提到先王使人承受的重軛和苦工，希望羅波安減輕負擔。這段先讓我們聽見請求，再看王怎樣詢問和回應；不是看哪一邊衣服的顏色，就先決定誰的話值得被聽見。','列王紀上12:1–5','1 Kings 12:1-5','south',{question:'盤上的三個日期籌，代表三位建議者嗎？',answer:'三個日期籌幫助讀第三天回來的時間，不是三位建議者。籌和位置都是現代閱讀方法，經文沒有給這個木盤或一張原來的座席圖。'}),
 T('advice','兩組建議有什麼不同？','長者建議以服事和好話回應民眾，同他長大的年輕人則主張更強硬的回答。閱讀時比較這一段各自說了什麼，不把所有長者或所有年輕人都排進固定的善惡隊伍。','列王紀上12:6–15','1 Kings 12:6-15','south'),
 T('places','交涉、返回與止戰，都在眼前同一座城嗎？','交涉從示劍開始。後來羅波安逃回耶路撒冷，動員之後又有示瑪雅傳達停止兄弟相爭的話。這些有不同地點和先後，模型的地名座只幫助跟讀，不是一步就能走過的兩座真城。','列王紀上12:1–24','1 Kings 12:1-24','south'),
 ]),
 P('kingdoms-route-guide','往來路線的解說者','兩處設立、地名與不同世代','north','先找伯特利和但的兩個地名，再看各自旁邊的輪廓。經文一面交代地點，一面讓讀者看見耶羅波安對人心轉向耶路撒冷的憂慮；兩處安排要放回這段敘事裡讀。',[
 T('sites','兩處金牛犢設在哪裡？','經文記一個設在伯特利，一個放在但。兩個分離底座讓我們記住不同地點；形狀和尺寸是原創補足，沒有證據說眼前兩個輪廓就是已找到的那兩隻原件。','列王紀上12:25–33','1 Kings 12:25-33','north',{question:'但現在可見的設施，全是當時一次建成的嗎？',answer:'但的聖區有不同階段，今天可見的部分也經過修復和現代展示。看見一個平台或金屬框，仍要查它屬哪個時期；不能把整套現況都放回這一章。'}),
 T('worry','王為什麼另作安排？','這段記耶羅波安擔心人們到耶路撒冷獻祭，心會重新歸向羅波安。接著記他另設敬拜場所、祭司與節期。把王的憂慮、採取的做法與敘事評語連著讀，才看得見權力和敬拜的關係。','列王紀上12:26–33','1 Kings 12:26-33','north'),
 T('names','阿摩司時代的耶羅波安，就是這位王嗎？','兩位同名王要分清父名與世代。這一章是尼八之子，阿摩司書開頭則提約阿施之子；後來常用一世、二世來區分。他們沒有在同一場景裡同時統治，撒瑪利亞的建造也有更後面的記載。','列王紀上12；16:23–24；阿摩司書1:1','1 Kings 12;16:23-24;Amos 1:1','north'),
 ]),
 P('kingdoms-gate-resident','公共事務旁的居民','城門、公正與量的比較','prophet','在城門旁停一下，想想誰的話被聽見，誰的請求被推開。阿摩司第五章把糧食稅捐、賄賂和公正帶到讀者面前；量穀和秤重的教具，則陪我們再讀第八章的延伸。',[
 T('justice','第五章為什麼提到城門？','這段談到在城門責備不義的人受到憎恨，也談受賄與窮乏人的案件被屈枉。城門輪廓幫助想像公共處境；經文沒有給這座模型的平面，也沒有認定這就是阿摩司實際站過的一個城門。','阿摩司書5:10–15','Amos 5:10-15','prophet',{question:'有敬拜活動，就代表交易和裁斷一定公平嗎？',answer:'第五章把敬拜與公義放在一起質問。留意受損的人如何被對待，再讀公正像水流的比喻；那不是在認證模型裡發現了一條古代水道。',reference:'阿摩司書5:21–24',passage:'Amos 5:21-24'}),
 T('measures','盛穀容器與砝碼，比較的是同一種量嗎？','盛穀容器讓人比較容量，砝碼和天平則比較重量。縮小量斗、加重秤砣的具體批判另在第八章；謝克爾在這裡按重量理解，不直接拿後期硬幣替代。先把兩種量分開，也留意交易中受到損害的人。','阿摩司書8:4–6 · 延伸對讀','Amos 8:4-6','prophet'),
 T('hearers','阿摩司只是在責備某一種行業或國家的人嗎？','本章呼喚以色列家聆聽。讀這些話時，要找具體的壓迫、賄賂與屈枉，不把全部買賣者或某個國家的居民判成同一種人。這一章邀請人尋求善、在城門建立公正；我們也要留意沒有力量讓人聽見自己的人。','阿摩司書5:10–15','Amos 5:10-15','prophet'),
 ]),
];
export const kingdomsLearning={opening:'先在示劍聽請求與不同回應，再讀兩處設立，最後切換到阿摩司的較後世代。地名、父名和說話者幫助把故事連起來。',closing:'公正與受損的生活處境也連到後來的流離故事。接續被擄主題時，仍分清年代和不同經文的聲音。',compare:'solomon',child:[
 {id:'south',stop:'south',actor:'kingdoms-assembly-resident',question:'羅波安請民眾什麼時候再來？',options:['第三天','有三位建議者就立刻回來','同一天已在兩城往返'],correct:0,hint:'看看三個日期籌，再問居民：日期和人數是同一回事嗎？',explanation:'王上12記第三天回來；日期籌是現代閱讀教具，不是原座席或建議者人數。'},
 {id:'north',stop:'north',actor:'kingdoms-route-guide',question:'經文記的兩處金牛犢，分別在哪裡？',options:['同一個小庭院裡','伯特利與但','後期撒瑪利亞的一個宮殿裡'],correct:1,hint:'先讀兩個地名，不用居民衣色猜陣營。兩個底座是分地點的比較。',explanation:'王上12分別記伯特利與但；兩地不是同院，教具形體也不是已找到原件的認證。'},
 {id:'prophet',stop:'prophet',actor:'kingdoms-gate-resident',question:'哪一組把容量與重量分開了？',options:['兩件都只看顏色','用後期硬幣直接當量斗','盛穀容器看容量，砝碼看重量'],correct:2,hint:'先找容器，再找天平與砝碼，請居民說說摩8的延伸比較。',explanation:'容量與重量不同；量斗、天平批判在摩8延伸，不能全標為摩5的器物清單。'},
 ],study:[
 {id:'south',stop:'south',claim:'王上12的交涉從示劍開始，後續才有返回耶路撒冷與止戰。',kind:'text',basis:'12:1、18、21–24各交代不同動作及地點，按先後對讀。',limit:'模型地名座的距離不是古代旅時、國境或兩城座席的測量。',reference:'1 Kings 12:1-24'},
 {id:'north',stop:'north',claim:'Tel Dan今天可見的聖區包含不同階段與現代修復。',kind:'research',basis:'原發掘機構分期、部分修復說明與INPA現代展示文字各有範圍。',limit:'不能因此把整套平台、現代金屬框或晚期銘文都歸給王上12的一次工程。',reference:'1 Kings 12:25-33'},
 {id:'prophet',stop:'prophet',claim:'眼前容器與雙盤天平的具體形制是現代教學補足。',kind:'reconstruction',basis:'摩8提供容量、重量與欺壓的文字，沒有完整的原器工程圖。',limit:'不能由譯本換算推算原出土器尺寸、全國標準或砝碼古字；摩5核心與摩8延伸分開。',reference:'Amos 5:10-15;8:4-6'},
 ]};
