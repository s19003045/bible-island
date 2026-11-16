// Unregistered authored draft. Dialogue, derived child cues and assets require review before integration/recording.
import {scriptureSource} from './scripture.js';
import {nehemiahPosition} from './nehemiah-exploration.js';
export const nehemiahHistorical={edition:'察看、修建與聆聽',category:'不同工程與閱讀時刻',scale:'成人約1.70m · 原創城緣與生活構造',extent:120,shadow:72,fogNear:160,fogFar:460,target:[0,4,-6],overview:[41,29,45],human:{target:[0,2,8],offset:[7,.4,7]},plan:94,close:[8,5,10],cutaway:false,stops:Object.fromEntries(['wall','gate','scroll'].map(s=>[s,nehemiahPosition(s,-5,7,1)])),facts:['尼2先有少數人夜察、後有公開提出；尼3各處工段另讀，不能合成同一夜全部施工。','尼4有分工、疲乏與守望；尼6的牆完成和尼7安門管理分開，五十二天不包含王前請求及整段旅程。','尼8七月一日由以斯拉誦讀、利未人講解；理解、哭泣、安慰與分享連讀，後續節期另有時刻。'],limits:'原創山地、城緣、家屋、牆門與木臺不是原址測繪；不認證現存某牆或塔由尼希米親建，不由模型推算周長、人口或工期。夜察少數人、較後公開商量及尼3眾多工段須分不同閱讀狀態。尼3不同職業、家庭與女兒們的參與不壓成單一男性工人制服。尼3指定一千肘工段不是整城周長；同名尼希米不能一律當省長。尼4:16的下屬分工不當全城精確各半，4:17與4:18並讀，不否認文本也不將全體人物永久固定成一手揮刀一手砌石。角聲作聚集背景，沒有武器拿取、殺敵、壓榨勞作或仇視現代族群的得分操作。尼6:1門扇尚未安上，6:15城牆完工，7:1安門管理與7:4仍少人／房屋未建保留。尼5的糧食、稅款、債與控訴另讀，不將債務或子女為奴轉為兒童資源遊戲。五十二天不是從尼散月請假起計，也不縮成五十二秒通關。水門廣場不是夜察谷門或聖殿至聖所；尼希米、以斯拉與利未人的職分分開。講解使人明白不直接認證人人已忘記希伯來語。臺高、卷材、軸數、文字、服裝、臉孔與讀音皆未定；現代空白展卷和中文配音不冒充原卷古字或原音。哭泣不是答錯，不要求先歡笑才完成。尼8:13以後翌日查考與節期不堆在第一日同場。考古資料限度及不同定年觀點保留，摘要未讀PDF不當已讀完整發掘報告。',sources:[{title:'夜察與各處工段 · CSBT',...scriptureSource('Nehemiah 2:11-20;3'),note:'夜察、公開提出與較後工段分開。'},{title:'工程、完工與安門 · CSBT',...scriptureSource('Nehemiah 4;6:1;6:15-16;7:1-4'),note:'不同分工和不同完成階段各自對讀。'},{title:'廣場誦讀與講解 · CSBT',...scriptureSource('Nehemiah 8:1-12'),note:'職分、理解、哭泣、安慰與食物分享。'},{title:'希伯來大學考古研究所：City of David',url:'https://archaeology.huji.ac.il/city-david',note:'機構發掘概述，未逐圖讀全套Qedem報告，不認證模型原牆。'},{title:'IAA：Siloam Pool plaster radiocarbon study',url:'https://publications.iaa.org.il/atiqot/vol101/iss1/9/',note:'只讀摘要及作者資料；PDF403，保留測值與器物／地層不一致的問題。'},{title:'Finkelstein：Jerusalem and the Wall of Nehemiah (2008)',url:'https://israelfinkelstein.wordpress.com/wp-content/uploads/2013/07/wall-of-nehemiah-jsot-2008.pdf',note:'作者論證的定年質疑，不把人口／規模估算或形成假說當全學界共識。'},{title:'City of David：Nehemiah Builds the Walls',url:'https://timeline.cityofdavid.org.il/event/nehemiah-builds-the-walls-of-jerusalem/',note:'遺址方也列小塔定年分歧，詮釋頁不等於取得完整地層報告。'}]};
const T=(id,question,answer,reference,passage,stop,followup)=>({id,question,answer,reference,passage,stop,followup});
const P=(id,name,role,s,greeting,topics)=>({id,name,role,era:'尼希米記 · 無名綜合教學角色',position:nehemiahPosition(s,3,13),style:1,motion:'idle',greeting,topics});
export const nehemiahPeople=[
 P('nehemiah-wall-resident','察看與工段的解說者','夜察、商量與不同參與者','wall','先看看牆的兩面和門洞。察看損壞、和人商量、後來分段修建，是可以分開閱讀的時刻。我們從少數人的夜察說起，再翻到不同群體參與的工段。',[
 T('survey','為什麼要先察看，再和大家商量？','尼希米到城裡待了三天，才在夜間帶少數人察看，當時還沒有向相關人員公開打算。後來他才提出重建，大家回應一起動手；不能把前後兩次不同的場面合成一次公開夜遊。','尼希米記2:11–18','Nehemiah 2:11-18','wall',{question:'沿模型走一圈，就是那晚完整的路線嗎？',answer:'這是幫助觀察牆門的原創空間。經文提一些位置，也記通行受阻，卻沒有給出完整的現代座標與周長；走完模型不能當作重走了已經測定的夜巡路線。'}),
 T('damage','察看時，牆和門有什麼問題？','第二章記牆的破壞和被火焚燒的門，到了王池附近，所騎的牲口沒有地方過去。先讀這些察看的困難；眼前真門洞能幫忙理解開口與通行，卻不是那個受阻位置留下來的原物。','尼希米記2:13–15','Nehemiah 2:13-15','wall'),
 T('sections','後來哪些人參與，都是一樣的工人嗎？','再翻到第三章，可以看見家庭、不同職業、官長和女兒們參與各處工段，也有不肯承擔的回應。這是較後的工段名錄，不是夜察少數人的名單；每段的工作和參與者也不必相同。','尼希米記3','Nehemiah 3','wall'),
 ]),
 P('nehemiah-watch-resident','工段與守望的居民','不同分工與完成階段','gate','看看比較盤上分開的托片。工作和警戒要彼此配合，但牆修到哪一步、門有沒有安上，也得分開看。相鄰的標記不是同一刻做完的全城工程。',[
 T('roles','搬運、修建和守望，是同一種工作嗎？','第四章把尼希米下屬的分工、搬運和建造時的防備放在一起讀，也記建造者腰間佩刀及吹角的人。這些描述需要並讀；盤上三個位置，不表示全城人口恰好分成三份。','尼希米記4:15–18','Nehemiah 4:15-18','gate',{question:'是不是每個人一直一手拿刀，一手放石頭？',answer:'第十七節確實同時提建牆者和搬運者工作時持兵器，前後又有不同分工和腰間佩刀的描述。把十六到十八節一起讀，比把每個人每一刻都固定成一個姿勢，更能保留敘事的層次。',reference:'尼希米記4:16–18',passage:'Nehemiah 4:16-18'}),
 T('stages','牆連起來，門和房子就都完成了嗎？','第四章先說牆連合到半高，第六章另有牆沒有破口、門扇卻尚未安上的時刻；後來記城牆完工，第七章再說安門和管理。城市裡仍有人少、房屋未建的情況，不能用一聲完成說完所有生活。','尼希米記4:6；6:1、15–16；7:1–4','Nehemiah 4:6;6:1;6:15-16;7:1-4','gate'),
 T('signal','各處工段離得遠，怎樣彼此聯絡？','尼希米提醒各段分散，聽見角聲就往那裡聚集。同章也記疲乏、灰土和日夜防備。把不同處境一起讀，才看得見人們一邊勞作、一邊面對不安的壓力。','尼希米記4:9–10、19–23','Nehemiah 4:9-10;4:19-23','gate'),
 ]),
 P('nehemiah-listening-resident','廣場上的聆聽居民','誦讀、講解與互相照顧','scroll','看看臺板下面的支撐，再看看展開的卷面。第八章讓我們留意的不只有拿著書卷的人，還有幫助大家明白的講解，以及聽見之後彼此照顧的行動。',[
 T('explain','誰帶來書卷，誰幫助大家明白？','以斯拉帶來律法書，在為此事製作的木臺上誦讀，利未人教導並講解，幫助聽眾明白；尼希米是省長。三種職分要分清，不能把誦讀和所有講解都說成尼希米一人完成。','尼希米記8:1–9','Nehemiah 8:1-9','scroll',{question:'木臺和卷子，是照那天留下的原物做的嗎？',answer:'經文給了木臺、書卷和打開誦讀的線索，沒有給完整尺寸、卷材或軸數。教具的支撐與卷曲是原創比較，沒有抄古字，也不能稱為那天留下的原臺或原卷。'}),
 T('care','為什麼聽見之後會哭，後來又吃喝分享？','民眾聽到律法的話而哭，尼希米、以斯拉和教導的人安慰他們，也提醒把食物分給無法為自己預備的人。理解、安慰與互相照顧連在一起，不用把眼淚當成答錯，或先強迫自己開心才能繼續。','尼希米記8:9–12','Nehemiah 8:9-12','scroll'),
 T('days','第一天的誦讀和後來搭棚，是同一刻嗎？','第八章先交代七月一日的聚集，後面另有第二天的查考，以及接續的節期。要分開各個時刻；第一天的廣場不必同時放滿後來的棚子，城牆完工也不是當晚立刻進入所有後續活動。','尼希米記8:1–2、13–18','Nehemiah 8:1-2;8:13-18','scroll'),
 ]),
];
export const nehemiahStopCopy={wall:{child:'看看厚牆與真門洞，再問居民尼2夜察時遇到什麼通行困難。模型能幫助觀察，但不能替經文測定原來路線。',study:'先分尼2少數人夜察、後來公開提出與尼3不同工段；牆門尺寸和石木接合屬原創補足，不認證原址或完整周長。'},gate:{child:'看分開的完成階段，再問居民牆沒有破口時，哪個構件還沒有安上；不要用槽數算人口。',study:'尼4分工、尼6未安門與完工、尼7安門管理分開。考古小塔有不同定年觀點，不能用遺址名稱直接認證尼希米親建。'},scroll:{child:'看看木臺與展卷，再問誰誦讀、誰幫助大家明白。模型沒有古字，眼淚也不是答錯的記號。',study:'尼8的木臺、誦讀與講解有文字依據；臺高、卷材與軸數未給。七月一日、翌日查考與後續節期分開。'}};
export const nehemiahLearning={opening:'從察看、商量與共同修建，再走向聆聽和理解。不同時刻、不同工作與群體內部的壓力，都值得慢慢分清。',closing:'接續兩約之間的背景時，仍分清時代與證據；城市的牆門和群體的閱讀，也不是同一種完成。',compare:'second-temple',child:[
 {id:'wall',stop:'wall',actor:'nehemiah-wall-resident',question:'尼2夜察到王池附近時，遇到什麼通行問題？',options:['所騎的牲口沒有地方過去','所有人已經一起在那裡修完城牆','模型畫出的道路已證明原址'],correct:0,hint:'先看門洞和牆體，再請居民帶你回到尼2的察看段落。',explanation:'尼2:14記牲口無處通行；模型的真開口幫助觀察，卻不認證原受阻位置。'},
 {id:'gate',stop:'gate',actor:'nehemiah-watch-resident',question:'尼6:1特別提到，牆沒有破口時，什麼尚未安上？',options:['屋頂','門扇','木臺的臺板'],correct:1,hint:'比較不同完成時刻，再問居民牆和門是不是一起完成。',explanation:'尼6:1另記門扇尚未裝上；城牆、安門和城市生活不能壓成同一個完成按鈕。'},
 {id:'scroll',stop:'scroll',actor:'nehemiah-listening-resident',question:'尼8中，誰講解並幫助民眾明白所讀的？',options:['教具本身已認證古代讀音','每件事都由尼希米獨自完成','利未人'],correct:2,hint:'先看看臺和卷，再請居民分清誦讀與講解的職分。',explanation:'以斯拉誦讀，利未人幫助人明白；尼希米是省長，不把不同工作合為一人。'},
 ],study:[
 {id:'wall',stop:'wall',claim:'這件教具的門洞尺寸與石木接合是現代教學補足。',kind:'reconstruction',basis:'尼2記牆門受損和通行問題，尼3記各工段，沒有給這件模型的完整施工圖。',limit:'局部構造不能量完整夜巡、古城周長或認證現存原門。',reference:'Nehemiah 2:11-20;3'},
 {id:'gate',stop:'gate',claim:'被指為尼希米時代的小塔，其定年仍有不同研究意見。',kind:'research',basis:'遺址方公開頁並列Mazar和其他學者定年；Finkelstein作者論文另提出考古推論質疑。',limit:'研究意見和公開詮釋頁不等於取得完整地層報告，也不能認證眼前原創教具。',reference:'Nehemiah 6:15-16;7:1-4'},
 {id:'scroll',stop:'scroll',claim:'尼8記有為誦讀製作的木臺，也有幫助民眾明白的講解。',kind:'text',basis:'8:4及8:7–8可核對木臺與利未人的教導講解。',limit:'文字依據沒有給臺高、卷材、軸數或當日讀音，不可把這些原創補足當同樣已知。',reference:'Nehemiah 8:1-12'},
 ]};
