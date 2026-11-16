// Metre-scale public observation routes; separate chapters and mutually exclusive reading moments.
const surfaces=[{id:'nehemiah-public-observation-route',x1:-15,x2:29,z1:-18,z2:30}];
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export const nehemiahFloor=(s,x,z)=>.65+(s==='scroll'?.24:.65)*smooth((z+14)/40);
export const nehemiahPosition=(s,x,z,h=0)=>[x,nehemiahFloor(s,x,z)+h,z];
export const nehemiahSegments=[
 {id:'wall',number:1,name:'從夜察到不同工段',reference:'尼希米記 2:11–20；3',passage:'Nehemiah 2:11-20;3',person:'nehemiah-wall-resident',heading:'先察看與商量，再讀較後的修建',intro:'先回看少數人的夜間察看，再分開閱讀後來的公開提出與第三章工段。教具不是完整夜巡路線；三個時刻不合成同一個工地現場。'},
 {id:'gate',number:2,name:'修建、守望與後續安門',reference:'尼希米記 4；6:1、15–16；7:1–4',passage:'Nehemiah 4;6:1;6:15-16;7:1-4',person:'nehemiah-watch-resident',heading:'工作與警戒並讀，完成也要分階段',intro:'讀第四章分工與疲乏，再分開第六章無破口但尚未安門、城牆完工，以及第七章安門管理。工程完成不表示房屋和每戶生活問題都已解決。'},
 {id:'scroll',number:3,name:'廣場上的誦讀與講解',reference:'尼希米記 8:1–12',passage:'Nehemiah 8:1-12',person:'nehemiah-listening-resident',heading:'打開書卷，也幫助人聽明白',intro:'七月一日的公開誦讀中，以斯拉與利未人有不同職分。理解、哭泣、安慰和食物分享連著讀；翌日查考及後續住棚節另作延伸。'},
].map(s=>({...s,spawn:nehemiahPosition(s.id,17,24),startLookAt:nehemiahPosition(s.id,-5,7,1),surfaces,human:{target:nehemiahPosition(s.id,-4,7,1.4),offset:[7,.4,7]},target:[0,4,-6],overview:[41,29,45],extent:120,shadow:72,plan:94}));
export const nehemiahSegmentById=new Map(nehemiahSegments.map(s=>[s.id,s]));
// A time slice may change the wall, gates, people and light, never the meaning of the modern teaching model.
export const nehemiahReadingPhases={
 wall:[{id:'survey',name:'少數人的夜察',passage:'Nehemiah 2:11-16',heading:'先察看，不是全城已動工',intro:'先在城裡停留，再與少數人夜察；公開提出及第三章工段尚未進入這個閱讀時刻。夜色、受損牆門和少數綜合居民只是原創觀察安排，不認證隨行者或路線。',night:true},{id:'proposal',name:'較後公開提出',passage:'Nehemiah 2:17-20',heading:'察看之後，才公開說明',intro:'另讀尼希米向相關人員提出重建及眾人的回應。這是較後的商量，不把第三章所有工段放進那夜；日間光線和居民數量是閱讀安排。',night:false},{id:'sections',name:'再讀各處工段',passage:'Nehemiah 3',heading:'再翻到各處工段與不同參與者',intro:'第三章有家庭、職業、官長及女兒們的參與，也有不同回應。畫面以相鄰工作片段作比較，不當完整城周、人口統計或每處施工的實測。',night:false}],
 gate:[{id:'watch',name:'工程中的警戒',passage:'Nehemiah 4',heading:'工作、防備與疲乏並讀',intro:'先讀半高、修建與守望的壓力。各人分工、腰佩刀與工作時持兵器的描述一同保留；不把每位居民固定成相同工法，沒有殺敵操作。',night:false},{id:'unfinished-gates',name:'牆無破口，門尚未安',passage:'Nehemiah 6:1',heading:'牆已修合，仍要留意門扇',intro:'第六章開頭另記牆沒有破口、門扇卻尚未安上。畫面只呈現這種構件差別，不冒充一份原門的定年或完整施工圖。',night:false},{id:'wall-complete',name:'城牆完工',passage:'Nehemiah 6:15-16',heading:'讀到完工，也讀對時間範圍',intro:'這裡讀以祿月二十五日、五十二天及完工後的回應。工期不從王前請求與旅程開始計算；眼前不提前補出下一段安門管理，也不表示家家生活問題都已解決。',night:false},{id:'gates',name:'後續安門與管理',passage:'Nehemiah 7:1-4',heading:'再看安門與城市管理',intro:'第七章接到安門和職事安排，也仍說人少、房屋未建。這個時刻才加入原創門扇比較，不把牆、門、房屋和整個城市的生活統稱為同一種完成。',night:false}],
};
export const nehemiahObjects=[
 {id:'nehemiah-wall',segment:'wall',stop:'wall',name:'厚牆、門洞與石木構造組',description:'觀察牆片厚度、真正貫穿的門洞及石木構件，再移開現代比較層。這是局部構造教具，不認證原城門、原城牆、王池受阻點或完整夜巡道路。',observation:'尼2先記少數人察看及後來公開提出，尼3另記許多群體的工段；教具組裝不表示夜察時大家已同時開工。',passage:'Nehemiah 2:11-20;3'},
 {id:'nehemiah-watch',segment:'gate',stop:'gate',name:'分工、警戒與完成階段的比較盤',description:'分開的真凹槽與厚托片，並讀工作、守望及不同完成階段；中性形狀作閱讀標記，不能由槽數推算人口、輪班或工程日數。',observation:'尼4:16–18的不同描述要並讀；半高、未安門、牆完工與安門管理有先後，不把每位居民固定成同一個持刀砌石姿勢。',passage:'Nehemiah 4:6;4:15-23;6:1;6:15-16;7:1-4'},
 {id:'nehemiah-reading',segment:'scroll',stop:'scroll',name:'木臺、展卷與聆聽講解的比較組',description:'可移開一側查看厚臺板與支撐，旁有真卷曲、無古字的原創展卷及現代職分標記。木臺高度、卷材、軸數與布局皆為教學選擇，不是以斯拉原卷或原臺。',observation:'以斯拉誦讀，利未人幫助明白，尼希米是省長。不要把所有職分合為一人，也不用猜測每位聽眾的識字、年齡或當日讀音。',passage:'Nehemiah 8:1-12'},
].map(o=>({...o,position:nehemiahPosition(o.segment,-5,7,.82),approach:nehemiahPosition(o.segment,-5,9.4),lookAt:nehemiahPosition(o.segment,-5,7,1.5)}));

export const normalizeNehemiahPhase=(segment,id)=>{const phases=nehemiahReadingPhases[segment];return phases?(phases.find(p=>p.id===id)||phases[0]).id:null;};
export const nehemiahMoment=(segment,phase)=>nehemiahReadingPhases[segment]?.find(p=>p.id===normalizeNehemiahPhase(segment,phase))||null;
export function nehemiahWalkConfig(segment='wall',phase=null){
 const s=nehemiahSegmentById.get(segment)||nehemiahSegments[0],moment=nehemiahMoment(s.id,phase);
 return {...s,objects:nehemiahObjects.filter(o=>o.segment===s.id),segments:nehemiahSegments,segment:s.id,phases:nehemiahReadingPhases[s.id]||null,phase:moment?.id||null,moment,timeLocked:true,night:moment?.night||false,title:s.name,heading:moment?.heading||s.heading,intro:moment?.intro||s.intro,shortTitle:`${s.number} / 3 · ${s.name}`,era:'NEHEMIAH / 分章與不同閱讀時刻',destinations:true,recordedChild:true,teachingInspection:true,enter:'開啟聲音，走進本段',inspectionNote:'原創局部構造與閱讀比較教具；不是原牆、原門、完整夜巡、以斯拉原臺或原卷。',hint:'沿公共觀察路線，再按時刻對讀。夜察、公開提出、修建與安門分開；改變時刻會結束當前行走與交談，觀察不自動等於讀經完成。',region:p=>p[0]<0?'構造與閱讀觀察區':'公共停留與導讀區'};
}
export function nehemiahPOIs(s,phase){const survey=s==='wall'&&normalizeNehemiahPhase(s,phase)==='survey';const P=(id,name,action,slots,lookAt)=>({id:'nehemiah-'+id,name,action:survey&&action==='Interact'?'LookAround':action,tags:['nehemiah-resident'],weight:action==='Interact'?1.4:1,capacity:slots.length,slots:slots.map(([x,z])=>nehemiahPosition(s,x,z)),lookAt,dwell:action==='Interact'?[7,18]:[4,14]});return [P('west','觀察物件旁','Interact',[[-9,3],[-7.6,3]],[-5,7]),P('rest','公共停留處','Idle',[[-12,21],[-10.6,21]],[-24,15]),P('north','牆門外望','LookAround',[[-9,-13],[-7.6,-13]],[3,-32]),P('court','同伴相遇','Idle',[[4,17],[5.4,17]],[0,3]),P('east','生活準備','Interact',[[23,4],[24.4,4]],[34,6]),P('shade','歇息區','Idle',[[23,25],[24.4,25]],[12,10]),P('look','工段與廣場外望','LookAround',[[23,-12],[24.4,-12]],s==='scroll'?[-27,-7]:[31,-30]),P('south','公共往來','LookAround',[[0,27],[1.4,27]],[2,8])];}
export function nehemiahSpawnCandidates(s){const out=[];for(let x=-13;x<29;x+=2)for(let z=-16;z<30;z+=2)out.push(nehemiahPosition(s,x,z));return out;}
