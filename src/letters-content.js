import {scriptureSource} from './scripture.js';
import {lettersPosition} from './letters-exploration.js';
export const lettersHistorical={edition:'書寫、消息與群體閱讀',category:'分卷閱讀 · 材料、同行與生活',scale:'成人約1.70m · 公尺尺度；房屋、教具與容量為現代選定',extent:140,shadow:76,fogNear:150,fogFar:500,target:[-2,3,-9],overview:[-37,27,44],human:{target:[-4,2.5,7],offset:[7,.4,7]},plan:100,close:[8,5,10],cutaway:false,stops:{desk:lettersPosition('writing',-5,7,1),messenger:lettersPosition('dispatch',-5,7,1),reading:lettersPosition('listening',-5,7,1)},facts:['從羅馬書轉歌羅西書是教學順序，不判定兩卷先後寫成年代或共同寫信城市。','自署、代筆、問候、被派與同行各有位置；不把所有名字合成同屋合照。','歌4:16有跨地宣讀的指示，收到、宣讀與理解仍要連回群體生活。'],limits:'本島是原創生活與文書功能比較，沒有認證保羅、特提烏斯的原稿、原桌、原筆跡或某座原收信屋。羅馬書書名不等於寫信地址；羅1與15的旅行盼望不演成已去西班牙。羅16:22特提烏斯代筆不表示他寫所有書信，也不表示保羅從未持筆；歌1:1自署與4:18親筆問候另讀，作者與年代研究不由房子裁定。菲比的推薦、服事及幫助保留，攜羅馬書或朗讀全卷作有語境理由的推想，非本句明寫。歌4:7–9分被派、同行、近況及安慰；原文件、封裝、路線、交通、日數與費用未給。捆鎖不認證監房地址。奧尼斯莫不作可交易人物，不假定必偷竊、逃跑或法律釋奴；腓利門書涉及奴役與真實不平等，不能美化成普通僱傭，亦不確證同袋同日。寧法依CSBT正文為她，腳註另有他；她家不無聲認作歌羅西初收信屋。歌4:16指示不等於已取得各地照辦紀錄，轉來書信不杜撰卷名或正文。Michigan材料展是跨年代埃及比較，Vindolanda木墨／蠟板是英國比較；未看原圖或量測原物。紙草正交兩層非編織，教具6mm層厚與抬升是現代誇示，不是原紙厚或古代剝紙機械。P46為後來冊葉抄本，不是原寄信格式或使徒親筆。空白文件、現代閱讀架與箭頭不認證原講臺、原地圖或瞬間跨城。13位居民、8POI16站位、1.70m模型與所有房屋尺寸皆現代選定，非原人數或平均身高。三人無名綜合角色，不冒充經文人物；中文配音非古代語音考證。未完成獨立歷史專家簽核。',sources:[
 {title:'羅馬書：自署、計畫、推薦與代筆 · CSBT',...scriptureSource('Romans 1;Romans 15;Romans 16'),note:'本輪完整直接讀這三章，未聲稱羅馬書全卷；完整16章含異文譯註。'},
 {title:'歌羅西書全卷 · CSBT',...scriptureSource('Colossians 1;Colossians 2;Colossians 3;Colossians 4'),note:'從問安與教導到生活、消息、宣讀指示，不只讀物流尾聲。'},
 {title:'腓利門書全章 · 延伸對讀',...scriptureSource('Philemon 1'),note:'保留接納、帳項與奴役的真實權力關係；不補成已法律釋奴、必偷竊或同一信袋。'},
 {title:'Michigan：Media for Writing in Graeco-Roman Egypt',url:'https://apps.lib.umich.edu/files/collections/papyrus/exhibits/writing/media.html',note:'已讀機構展頁文字；紙草、木墨與蠟板的功能比較，非兩封信原材質認證。'},
 {title:'Michigan：Papyrus, the Paper of the Ancient World',url:'https://apps.lib.umich.edu/files/collections/papyrus/exhibits/diversity/papyrus.html',note:'兩層紙草條交叉黏合；未看原圖，教具加厚不冒充實際紙厚。'},
 {title:'Vindolanda Trust：Writing tablets',url:'https://www.vindolanda.com/Blog/fact-file-writing-tablets?Title=fact-file-writing-tablets',note:'已讀木墨板與木質凹面蠟板說明，英國比較不當作保羅原器。'},
 {title:'RIB：Tab.Vindol.291',url:'https://romaninscriptionsofbritain.org/inscriptions/TabVindol291',note:'97–105年英國木墨邀請信，編者辨認另一手補結尾；只讀出版文字，未目視覆驗筆跡或換算未見單位的尺寸。'},
 {title:'Michigan：Reading the Papyri, P46',url:'https://apps.lib.umich.edu/files/collections/papyrus/exhibits/reading/Paul/index.html',note:'後來的冊葉抄本，不是原信或親筆；未逐頁核對本島各節存佚，也未複製圖。'},
]};
const T=(id,question,answer,reference,passage,stop,followup)=>({id,question,answer,reference,passage,stop,followup});
const P=(id,name,role,space,greeting,topics)=>({id,name,role,era:'第一世紀文書生活比較 · 無名綜合導讀居民',position:lettersPosition(space,3,13),style:1,motion:'idle',greeting,topics});
export const lettersPeople=[
 P('letters-writing-resident','文書生活的協作者','自署、代筆與問候','writing','先看紙草條層、空白木面和凹槽蠟板，想想墨寫與刻寫有什麼不同。再一起讀羅馬書，分清誰自我介紹、誰代筆、誰送上問候。工具幫助我們觀察，人的關係還要從文字慢慢讀出來。',[
  T('scribe','誰介紹自己，誰說自己代筆？','羅馬書開頭介紹保羅與收信者，結尾特提烏斯又以代筆者身分問候。自署、代筆與實際持筆不是同一問題。這一句不能推出他代寫全部書信，也不能說保羅從未動筆；這張桌子沒有認證原稿。','羅馬書1:1–7；16:21–27','Romans 1:1-7;Romans 16:21-27','desk',{question:'一份文件，可以有不同的參與者嗎？',answer:'可以，先分清文字各自說的角色。這裡有自我介紹、代筆後記和同工問候；不是每個被問候的人都坐在寫信桌旁。另地木墨信的不同手跡可作比較，但沒有替我們找到特提烏斯的原筆跡。'}),
  T('people','菲比與其他名字，只是送信名單嗎？','菲比受到推薦，也曾幫助許多人和保羅；接著讀到普茜拉、阿奎拉及不同群體。這些關係值得逐一留意。菲比攜帶或宣讀全信可以討論語境理由，這兩節卻沒有直接寫她完成那些動作。','羅馬書16:1–20','Romans 16:1-20','desk'),
  T('plans','這間屋子在哪裡，旅程都已完成了嗎？','場景沒有指定原寫信城市。保羅說盼望去羅馬，也提到西班牙與當前往耶路撒冷的安排。盼望和計畫要保留未來語氣；書名不是寫信地址，我們不能把想去的地方演成此刻已到。','羅馬書1:8–15；15:22–33','Romans 1:8-15;Romans 15:22-33','desk'),
 ]),
 P('letters-dispatch-resident','協助交換近況的居民','被派、同行與安慰','dispatch','現在換讀歌羅西書，不是前一張桌子的下一天。我陪你看被派與同行的關係，再找他們要讓收信者知道什麼。送到一份文件之外，還有人需要近況與安慰；路程、封裝和天數仍要分清知道與不知道。',[
  T('sent','特其庫斯與奧尼斯莫帶來什麼關係？','先讀派特其庫斯前往，再讀奧尼斯莫同行。他們會讓收信者明白近況，也帶來安慰。參與送信有語境理由，經文卻沒有展示原信袋、封裝或交通工具；現代箭頭只幫我們分清兩端。','歌羅西書4:7–9','Colossians 4:7-9','messenger',{question:'為什麼不能只把他們看成兩個送貨的人？',answer:'因為這裡還說到忠心、同行、消息與安慰。人不是可交付買賣的包裹；奧尼斯莫與腓利門書可另作對讀，但不能直接補成必然偷竊、逃跑或已獲法律釋奴，也沒有確定同袋同日的紀錄。'}),
  T('prayer','讀消息以前，還應留意什麼？','往前讀到禱告、傳講的機會、捆鎖和怎樣回答每個人。這封信不只是運送清單。原監房地址和寫信城市未在這些句子給出；我們不靠一條模型鎖鏈把所有處境都說定。','歌羅西書4:2–6','Colossians 4:2-6','messenger'),
  T('greetings','問候的人，是否都和收信者在同一間屋？','不是由名單就能這樣判斷。寫信一側傳來問候，有人被囑咐接納，也有人為不同地方勞苦禱告。先看誰向誰說，再回到整封信；背景居民不是這份名單的完整合照或固定人數。','歌羅西書1:1–8；4:10–14','Colossians 1:1-8;Colossians 4:10-14','messenger'),
 ]),
 P('letters-listening-resident','接待聆聽的居民','分地宣讀與群體生活','listening','一起看兩座分開的現代閱讀架，再讀先在你們那裡、也在勞迪西亞，以及轉來書信的指示。不同群體不是同一間房。收到以後，還要聆聽、理解，讓彼此教導與生活連起來。',[
  T('exchange','兩端的閱讀指示，應怎樣依序分清？','先在收信者那裡宣讀，也要在勞迪西亞讀，並讀從那裡轉來的信。這是書信的指示，不是我們找到全部照辦的紀錄。轉來的信在這一句沒有定卷名，我們也不替它編造正文。','歌羅西書4:16','Colossians 4:16','reading',{question:'宣讀和收到，為什麼還不能直接當成讀懂？',answer:'把文件拿到手，和一起留心其中的話不同。往下有服事提醒、親筆問候與記念捆鎖，再回連彼此教導、感謝與生活。閱讀架只是幫忙辨認關係，不能替群體完成理解，也不是原講臺。'}),
  T('house','寧法的家，是我們眼前這間原屋嗎？','依這個譯本正文，讀寧法與她家中的教會，腳註也保留另一種讀法。原屋平面、座次與全部聽眾沒有交代；不能把她家直接當成歌羅西第一次收信的房間，更不能套成後來大教堂。','歌羅西書4:15','Colossians 4:15','reading'),
  T('living','信末提醒，怎樣重新連回生活？','先讀給阿其波斯的服事提醒，再看保羅親筆問候和記念捆鎖。回到第三章，彼此教導、寬容與感謝仍是群體生活的一部分。不是文件一抵達，就可以跳過整封信或把別人的困難忘掉。','歌羅西書4:17–18；3:12–17','Colossians 4:17-18;Colossians 3:12-17','reading'),
 ]),
];
export const lettersStopCopy={desk:{child:'抬起現代紙草上層，分墨寫與刻寫，再找誰說自己代筆。',study:'自署、代筆與問候分清；不同材料只作功能比較，不認證兩卷原稿。'},messenger:{child:'看分離的兩端，再問被派的人、同行者和他們傳達的近況。',study:'明寫的派遣、同行、近況與安慰，和未明寫的原封裝、交通及日數分開。'},reading:{child:'轉動兩座架，再找先在哪裡讀、還要在哪裡讀。',study:'宣讀的指示與履行紀錄分開；不杜撰轉來書信卷名或正文。'}};
export const lettersLearning={opening:'先從羅馬書辨認自署、代筆與問候，再明示轉讀歌羅西書。跟著消息與安慰，讀到群體宣讀和日常生活；這是閱讀的順序，不是兩封信的寫作年表。',closing:'材料讓我們想像書寫，箭頭讓我們辨認關係；真正要繼續讀的，是人的消息、群體的聆聽和彼此生活。收到文件之後，閱讀仍在展開。',compare:'church',child:[
 {id:'desk',stop:'desk',actor:'letters-writing-resident',greeting:'一起看紙草條層和凹槽，再問居民：羅馬書結尾誰說自己代筆？',followup:'抬起現代上層再還原，留意正交黏合和刻寫凹面。這些是功能比較，回到十六章二十二節，再找代筆者的後記。',question:'觀察材料後，經文明寫的是什麼？',options:['所有書信都由同一個人代筆','特提烏斯在羅馬書結尾以代筆者身分問候','這套教具就是找到的原書桌'],correct:1,hint:'先看層次與凹面，再請居民帶你找十六章二十二節。',explanation:'這一節給代筆者的問候，不認證原稿、原桌，也沒有說他寫所有書信。'},
 {id:'messenger',stop:'messenger',actor:'letters-dispatch-resident',greeting:'一起看交付的兩端，再請居民分清被派、同行、消息和安慰。',followup:'普通籌是現代關係符號，不是可交付的人。回到四章七到九節，找他們會讓收信者知道什麼。',question:'這段怎樣說被派與同行的人？',options:['只給了固定送達天數','人可以像包裹一樣買賣','他們讓收信者明白近況，並帶來安慰'],correct:2,hint:'先觀察兩端，再問居民：除了文件，收信者還需要聽到什麼？',explanation:'近況與安慰在本段，原封裝、交通、路線與時長未交代。'},
 {id:'reading',stop:'reading',actor:'letters-listening-resident',greeting:'一起看分開的閱讀架，再請居民幫我們分清兩地宣讀的指示。',followup:'兩座架不是同一房間或瞬間傳送。讀四章十六節，找在你們那裡、勞迪西亞，以及從那裡轉來的信。',question:'兩座架要幫我們讀到什麼？',options:['在收信者那裡宣讀，也在勞迪西亞讀，並讀轉來的信','所有地方的人都在同一間屋','拿到文件就不必理解內容'],correct:0,hint:'觀察兩端後，請居民陪你依序讀四章十六節。',explanation:'是分地閱讀的指示；轉來信的卷名與全文不能由我們補造。'},
 ],study:[
 {id:'desk',stop:'desk',claim:'Vindolanda的Tab.Vindol.291是97–105年英國木墨邀請信，編者辨認補加結尾的另一手。',kind:'research',basis:'已讀RIB的support、日期、導言與校訂註解；是出版者對這一件文書的判斷。',limit:'本輪未目視覆驗筆跡，也不是使徒原信；不能借它認證特提烏斯筆跡或兩卷原材質。',reference:'Romans 16:21-27'},
 {id:'messenger',stop:'messenger',claim:'這件兩端承盤的空白文件形制、厚度與現代箭頭，是為了比較而設計。',kind:'reconstruction',basis:'尺寸、兩枚中性籌及另一端集體片均為現代選擇，非原人數或原稿交付照片。',limit:'歌4:7–9沒有給原信袋、封裝、交通、費用或送達日數，不能用教具補成已知。',reference:'Colossians 4:7-9'},
 {id:'reading',stop:'reading',claim:'歌羅西書4:16囑咐先在收信者那裡宣讀，也在勞迪西亞讀，並讀從那裡轉來的信。',kind:'text',basis:'完整讀4:15–18，把家中群體、宣讀指示、服事提醒與親筆問候分清。',limit:'指示不是已取得全部履行紀錄；不認證固定朗讀者、原屋、時間或轉來信的正式卷名。',reference:'Colossians 4:15-18'},
 ]};
