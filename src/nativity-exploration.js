// Separate reading windows; the public routes are original teaching spaces, not surveyed sites.
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
const surfaces=[{id:'nativity-public-observation-route',x1:-15,x2:29,z1:-18,z2:30}];
export const nativityFloor=(s,x,z)=>{const base=(s==='home'?.75:.65)+(s==='home'?.55:s==='manger'?.40:.25)*smooth((z+14)/40);if(s!=='manger')return base;const flat=.65+.40*smooth(21/40),blend=smooth((Math.hypot(x+5,z-7)-1.2)/1.4);return flat+(base-flat)*blend;};
export const nativityPosition=(s,x,z,h=0)=>[x,nativityFloor(s,x,z)+h,z];
export const nativitySegments=[
 {id:'manger',number:1,name:'馬槽、牧地與前往',reference:'路加福音 2:1–20',passage:'Luke 2:1-20',person:'nativity-manger-resident',heading:'分清安放、聽見與前往',intro:'先讀家庭行程與降生，再分清牧人在野外聽見、後來才前往。空槽只供物件觀察；它的材質、形狀與尺寸沒有經文施工圖，也不指定唯一住宿屋型。'},
 {id:'home',number:2,name:'成長、節期與返回',reference:'路加福音 2:39–52',passage:'Luke 2:39-52',person:'nativity-home-resident',heading:'家鄉成長，也有另地的節期同行',intro:'拿撒勒成長、十二歲到耶路撒冷、在聖殿聽與問及返回分開閱讀。原創家屋比較日常空間，不把聖殿教師搬進這間屋子。'},
 {id:'tools',number:3,name:'成年返鄉與木匠稱呼',reference:'馬可福音 6:1–6',passage:'Mark 6:1-6',person:'nativity-work-resident',heading:'先聽返鄉的問句，再另看木料',intro:'馬可此時記成年耶穌帶門徒返鄉、安息日在會堂教導及當地反應。旁置木接合只是現代構造比較，不演成約瑟教童年耶穌的原工坊。'},
].map(s=>({...s,spawn:nativityPosition(s.id,12,18),startLookAt:nativityPosition(s.id,-5,7,1),surfaces,target:[0,4,-6],overview:[41,29,45],human:{target:nativityPosition(s.id,-4,7,1.4),offset:[7,.4,7]},extent:120,shadow:72,plan:94}));
export const nativitySegmentById=new Map(nativitySegments.map(s=>[s.id,s]));
export const nativityReadingPhases={
 manger:[
  {id:'birth',name:'行程與安放',passage:'Luke 2:1-7',heading:'從行程讀到降生與安放',intro:'路加從諭令與家庭行程接到產期、包裹與馬槽。場景不演經文未記的逐家拒絕，也不預先把後來牧人或馬太博士放在槽邊。空槽是物件教具，人物與安放由經文交代。',night:false},
  {id:'field',name:'牧人在野外聽見',passage:'Luke 2:8-14',heading:'先到野外，聽見消息',intro:'本段明說牧人夜間在野外看守羊群；報信不是在槽旁發生。原創牧地與羊數不認證當年地點或群數，夜色也不給精確月份、日期或鐘點。',night:true,timeLocked:true},
  {id:'visit',name:'前往、看見與述說',passage:'Luke 2:15-20',heading:'聽見之後，才前往看見',intro:'牧人商量前往、找到、述說與返回有先後；瑪麗亞的回應也保留。畫面不把整段變成同一個凍結時刻，馬太的博士仍由另一卷入口閱讀。延續夜色是復原選擇，不由展示光線判定抵達鐘點或等待間隔。',night:true,timeLocked:true},
 ],
 home:[
  {id:'growth',name:'拿撒勒的成長',passage:'Luke 2:39-40',heading:'先讀回鄉與成長',intro:'接在前面的獻上敘事後，路加轉到拿撒勒的成長。教具家屋只比較日常空間，不能認證原宅或每戶相同；嬰孩獻上另讀2:21–38。',night:false},
  {id:'festival',name:'另地對讀：十二歲節期',passage:'Luke 2:41-50',heading:'另在耶路撒冷，聽與問',intro:'這是從拿撒勒觀察區對讀耶路撒冷的事件，眼前小屋並未變成聖殿。十二歲的耶穌在教師中聽與問，父母尋找並有焦急；不演成在家屋裡授徒或責怪家人的計時遊戲。',night:false},
  {id:'return',name:'返回與繼續成長',passage:'Luke 2:51-52',heading:'再讀返回，不把旅程壓成隔壁房間',intro:'從耶路撒冷返回拿撒勒，連讀家庭關係與繼續成長。這裡不補出每一天的日程、原宅家具或家人的確切年齡，也不靠模型計算旅程里數。',night:false},
 ],
};
export const normalizeNativityPhase=(segment,id)=>{const p=nativityReadingPhases[segment];return p?(p.find(q=>q.id===id)||p[0]).id:null;};
export const nativityMoment=(segment,phase)=>nativityReadingPhases[segment]?.find(p=>p.id===normalizeNativityPhase(segment,phase))||null;
export const nativityObjects=[
 {id:'nativity-manger',segment:'manger',stop:'manger',name:'空槽與住宿的觀察',description:'旋轉看真內底、厚壁、口沿與寬實底。這是選定材質與尺寸的原創教具；沒有嬰孩模型，不表示刪掉敘事中的孩子，包裹與安放由經文交代。槽沒有虛構蓋子或拆層。',observation:'CSBT用馬槽與客店，卻沒有給完整住宿施工圖。物件不能裁定洞穴、獨立畜舍或親族客房，也不能證明槽旁必有馬、牛或驢。牧人先在野外聽見，再前往。',passage:'Luke 2:6-7;2:8-20',elevation:0},
 {id:'nativity-home',segment:'home',stop:'home',name:'家屋與院落的縮尺比較',description:'抬起現代屋頂層，看真門洞、室內地面、院落與梁的承托。選定約1:10縮尺與布局不是IAA原平面量測，也不是約瑟或瑪麗亞的原宅。',observation:'路2有拿撒勒的成長，也有十二歲上耶路撒冷、在聖殿聽與問及返回。教具不能把不同地方合成同一房間，屋頂拆解也不是路加所記的事件。',passage:'Luke 2:39-40;2:41-50;2:51-52',elevation:.82},
 {id:'nativity-joinery',segment:'tools',stop:'tools',name:'木料與接合的現代比較',description:'抬起一根木料，從不同俯仰角看下料朝上、上料朝下的互補凹口與真厚度。半搭接、尺寸及製作側隙都是現代構造選擇，不冒充經文列出的古工具。',observation:'可6已是成年返鄉與會堂教導。木匠是當地聽眾對耶穌的稱呼；本段沒有交代約瑟教童年耶穌的工坊、工具箱、產品或工資。',passage:'Mark 6:1-6',elevation:.82},
].map(o=>({...o,position:nativityPosition(o.segment,-5,7,o.elevation),approach:nativityPosition(o.segment,-5,9.4),lookAt:nativityPosition(o.segment,-5,7,o.elevation+(o.segment==='manger'?.27:.24))}));
export function nativityWalkConfig(segment='manger',phase=null){
 const s=nativitySegmentById.get(segment)||nativitySegments[0],moment=nativityMoment(s.id,phase);
 return {...s,objects:nativityObjects.filter(o=>o.segment===s.id),segments:nativitySegments,segment:s.id,phases:nativityReadingPhases[s.id]||null,phase:moment?.id||null,moment,timeLocked:moment?.timeLocked===true,night:moment?.night||false,title:s.name,heading:moment?.heading||s.heading,intro:moment?.intro||s.intro,shortTitle:`${s.number} / 3 · ${s.name}`,era:'BIRTH, GROWTH & HOMECOMING / 不同閱讀窗口',destinations:true,recordedChild:true,teachingInspection:true,enter:'開啟聲音，走進本段',inspectionNote:'原創物件與縮尺比較；不是原槽、原住宿、聖家原宅或耶穌原工具。',hint:'沿公共觀察區提問，再按時刻對讀。牧人先後、兩座城市與人生階段分清；觀察不自動等於讀經完成。',region:p=>p[0]<0?'物件與證據比較區':'家屋外緣公共觀察區'};
}
export function nativityPOIs(s,phase){
 const field=s==='manger'&&normalizeNativityPhase(s,phase)==='field';
 const P=(id,name,action,slots,lookAt)=>({id:'nativity-'+id,name,action,tags:['nativity-resident'],weight:action==='Interact'?1.4:1,capacity:slots.length,slots:slots.map(([x,z])=>nativityPosition(s,x,z)),lookAt,dwell:action==='Interact'?[7,18]:[4,14]});
 return [P('west','物件旁觀察','LookAround',[[-9,3],[-7.6,3]],[-5,7]),P('rest','歇息與同行','Idle',[[-12,21],[-10.6,21]],[-23,15]),P('north',field?'朝牧地方向觀察':'家屋外望','LookAround',[[-9,-13],[-7.6,-13]],field?[-27,-35]:[-21,-25]),P('court','公共停留','Idle',[[4,17],[5.4,17]],[0,3]),P('east','日常物件旁','Interact',[[23,4],[24.4,4]],[35,6]),P('shade','蔭下歇息','Idle',[[23,25],[24.4,25]],[33,22]),P('look','街區與山地外望','LookAround',[[23,-12],[24.4,-12]],[31,-30]),P('south','同伴相遇','Idle',[[0,27],[1.4,27]],[2,8])];
}
export function nativitySpawnCandidates(s){const out=[];for(let x=-13;x<29;x+=2)for(let z=-16;z<30;z+=2)out.push(nativityPosition(s,x,z));return out;}
