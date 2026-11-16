// Unregistered draft for island 16. No scene/controller/media is enabled by this file.
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export const nehemiahFloor=(s,x,z)=>.65+(s==='scroll'?.24:.65)*smooth((z+14)/40);
export const nehemiahPosition=(s,x,z,h=0)=>[x,nehemiahFloor(s,x,z)+h,z];
export const nehemiahSegments=[
 {id:'wall',number:1,name:'從夜察到不同工段',reference:'尼希米記 2:11–20；3',passage:'Nehemiah 2:11-20;3',person:'nehemiah-wall-resident',heading:'先察看與商量，再讀較後的修建',intro:'先回看少數人的夜間察看，再分開閱讀後來的公開提出與第三章工段。教具不是完整夜巡路線；三個時刻不合成同一個工地現場。'},
 {id:'gate',number:2,name:'修建、守望與後續安門',reference:'尼希米記 4；6:1、15–16；7:1–4',passage:'Nehemiah 4;6:1;6:15-16;7:1-4',person:'nehemiah-watch-resident',heading:'工作與警戒並讀，完成也要分階段',intro:'讀第四章分工與疲乏，再分開第六章無破口但尚未安門、城牆完工，以及第七章安門管理。工程完成不表示房屋和每戶生活問題都已解決。'},
 {id:'scroll',number:3,name:'廣場上的誦讀與講解',reference:'尼希米記 8:1–12',passage:'Nehemiah 8:1-12',person:'nehemiah-listening-resident',heading:'打開書卷，也幫助人聽明白',intro:'七月一日的公開誦讀中，以斯拉與利未人有不同職分。理解、哭泣、安慰和食物分享連著讀；翌日查考及後續住棚節另作延伸。'},
].map(s=>({...s,spawn:nehemiahPosition(s.id,17,24),target:[0,4,-6],overview:[41,29,45],extent:120,shadow:72,plan:94}));
export const nehemiahSegmentById=new Map(nehemiahSegments.map(s=>[s.id,s]));
// Intended reading states only: generic phase UI, geometry and state isolation still need implementation.
export const nehemiahReadingPhases={
 wall:[{id:'survey',name:'少數人的夜察',passage:'Nehemiah 2:11-16'},{id:'proposal',name:'較後公開提出',passage:'Nehemiah 2:17-20'},{id:'sections',name:'再讀各處工段',passage:'Nehemiah 3'}],
 gate:[{id:'watch',name:'工程中的警戒',passage:'Nehemiah 4'},{id:'unfinished-gates',name:'牆無破口，門尚未安',passage:'Nehemiah 6:1'},{id:'wall-complete',name:'城牆完工',passage:'Nehemiah 6:15-16'},{id:'gates',name:'後續安門與管理',passage:'Nehemiah 7:1-4'}],
};
export const nehemiahObjects=[
 {id:'nehemiah-wall',segment:'wall',stop:'wall',name:'厚牆、門洞與石木構造組',description:'觀察牆片厚度、真正貫穿的門洞及石木構件，再移開現代比較層。這是局部構造教具，不認證原城門、原城牆、王池受阻點或完整夜巡道路。',observation:'尼2先記少數人察看及後來公開提出，尼3另記許多群體的工段；教具組裝不表示夜察時大家已同時開工。',passage:'Nehemiah 2:11-20;3'},
 {id:'nehemiah-watch',segment:'gate',stop:'gate',name:'分工、警戒與完成階段的比較盤',description:'分開的真凹槽與厚托片，並讀工作、守望及不同完成階段；中性形狀作閱讀標記，不能由槽數推算人口、輪班或工程日數。',observation:'尼4:16–18的不同描述要並讀；半高、未安門、牆完工與安門管理有先後，不把每位居民固定成同一個持刀砌石姿勢。',passage:'Nehemiah 4:6;4:15-23;6:1;6:15-16;7:1-4'},
 {id:'nehemiah-reading',segment:'scroll',stop:'scroll',name:'木臺、展卷與聆聽講解的比較組',description:'可移開一側查看厚臺板與支撐，旁有真卷曲、無古字的原創展卷及現代職分標記。木臺高度、卷材、軸數與布局皆為教學選擇，不是以斯拉原卷或原臺。',observation:'以斯拉誦讀，利未人幫助明白，尼希米是省長。不要把所有職分合為一人，也不用猜測每位聽眾的識字、年齡或當日讀音。',passage:'Nehemiah 8:1-12'},
].map(o=>({...o,position:nehemiahPosition(o.segment,-5,7,.82),approach:nehemiahPosition(o.segment,-5,9.4),lookAt:nehemiahPosition(o.segment,-5,7,1.5)}));
