const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export function kingdomsFloor(s,x,z){return s==='south'?.6+.65*smooth((z+14)/40):s==='north'?.6+1.1*smooth((-z+8)/38):.7+.8*smooth((x+10)/36);}
export const kingdomsPosition=(s,x,z,h=0)=>[x,kingdomsFloor(s,x,z)+h,z];
const surfaces=[{id:'kingdoms-public-observation-route',x1:-15,x2:29,z1:-18,z2:30}];
export const kingdomsSegments=[
 {id:'south',number:1,name:'示劍的請求與回應',reference:'列王紀上 12:1–24',passage:'1 Kings 12:1-24',person:'kingdoms-assembly-resident',heading:'先聽請求，再讀兩組建議',intro:'故事從示劍的交涉開始：減輕負擔的請求、兩組建議、第三天的回應。分裂、返回耶路撒冷與止戰是後續；先辨認每段出現的地名，再看後來的回應。'},
 {id:'north',number:2,name:'兩處設立與王的憂慮',reference:'列王紀上 12:25–33',passage:'1 Kings 12:25-33',person:'kingdoms-route-guide',heading:'分清地名，也讀王心中的憂慮',intro:'耶羅波安在示劍與毗努伊勒的建造，及伯特利、但的兩處設立，涉及不同地點。眼前選擇伯特利的閱讀片段，但另以教具比較；不用步行距離把多城合成同一庭院。'},
 {id:'prophet',number:3,name:'城門中的公正',reference:'阿摩司書 5；8:4–6 延伸',passage:'Amos 5;8:4-6',person:'kingdoms-gate-resident',heading:'在城門旁，留意沒有被聽見的人',intro:'切換到阿摩司所處的較後世代。先讀摩5的糧稅、賄賂、城門公正與敬拜；量斗和天平再以摩8延伸觀察，分清容量、重量與人的處境。'},
].map(s=>({...s,spawn:kingdomsPosition(s.id,17,24),startLookAt:kingdomsPosition(s.id,-5,7,1),surfaces,target:[0,4,-6],overview:[41,29,45],human:{target:kingdomsPosition(s.id,-4,7,1.4),offset:[7,.4,7]},extent:120,shadow:72,plan:94}));
export const kingdomsSegmentById=new Map(kingdomsSegments.map(s=>[s.id,s]));
export const kingdomsObjects=[
 {id:'kingdom-assembly',segment:'south',stop:'south',name:'請求與三日回覆的閱讀盤',description:'三個日期籌與請求、兩組建議、回應的不同位置，幫助跟隨示劍交涉的先後。兩個地名座另分示劍與後續耶路撒冷，不是出土公文、原座席或古地圖。',observation:'三天是回來的時間，不是三位建議者。兩組建議按這一段內容比較，不把所有長者或年輕人定為善惡群體；後續止戰另讀示瑪雅的話。',passage:'1 Kings 12:1-24'},
 {id:'kingdom-sites',segment:'north',stop:'north',name:'伯特利與但的兩處比較',description:'兩個分離底座各有一個原創金色牛犢輪廓，地點和數量連回王上12。姿態、尺寸與金色處理為補足；目前來源未認證這就是已找到的兩隻原件。',observation:'兩處不是同一院落。但的聖區有不同階段與現代修復，不能把現存平台或現代金屬框全當尼八之子耶羅波安一次建造，也不能搬去認證伯特利。',passage:'1 Kings 12:25-33'},
 {id:'kingdom-measures',segment:'prophet',stop:'prophet',name:'城門、容量與重量',description:'原創城門輪廓、盛穀容器與雙盤天平分別提示公共處境、容量與重量。摩5是核心，器物比較明標摩8延伸，沒有認定阿摩司實際站過的原城門。',observation:'糧食容積與金屬重量是不同的量。摩8的謝克爾按重量理解，不能直接拿後期硬幣替代；模型形制、砝碼與容器大小不是經文給出的原器規格。',passage:'Amos 5:10-15;5:21-24;8:4-6'},
].map(o=>({...o,position:kingdomsPosition(o.segment,-5,7,.82),approach:kingdomsPosition(o.segment,-5,9.4),lookAt:kingdomsPosition(o.segment,-5,7,1.5)}));
export function kingdomsWalkConfig(segment='south'){
 const s=kingdomsSegmentById.get(segment)||kingdomsSegments[0];return {...s,objects:kingdomsObjects.filter(o=>o.segment===s.id),segments:kingdomsSegments,segment:s.id,title:s.name,shortTitle:`${s.number} / 3 · ${s.name}`,era:'TWO KINGDOMS / 分地點與世代',destinations:true,recordedChild:true,teachingInspection:true,enter:'開啟聲音，走進本段',inspectionNote:'原創閱讀與生活比較教具；不是原宮殿、金牛犢、祭壇或阿摩司原城門。',hint:'沿公共路線觀察並向居民提問。三章分開地點與世代；地名標示幫助閱讀，不以模型距離推定古代旅時。',region:p=>p[0]<0?'閱讀與器物觀察區':'公共往來與導讀區'};
}
export function kingdomsPOIs(s){const P=(id,name,action,slots,lookAt)=>({id:'kingdoms-'+id,name,action,tags:['kingdoms-resident'],weight:action==='Interact'?1.4:1,capacity:slots.length,slots:slots.map(([x,z])=>kingdomsPosition(s,x,z)),lookAt,dwell:action==='Interact'?[7,18]:[4,14]});return [P('west','教具旁的觀察','Interact',[[-9,3],[-7.6,3]],[-5,7]),P('rest','公共停留處','Idle',[[-12,21],[-10.6,21]],[-22,15]),P('north','遠處外望','LookAround',[[-9,-13],[-7.6,-13]],[-18,-28]),P('court','同行相遇','Idle',[[4,17],[5.4,17]],[0,3]),P('east','生活準備','Interact',[[23,4],[24.4,4]],[33,5]),P('shade','公共歇息區','Idle',[[23,25],[24.4,25]],[12,10]),P('look','背景觀察','LookAround',[[23,-12],[24.4,-12]],[31,-25]),P('south','往來通道','LookAround',[[0,27],[1.4,27]],[2,8])];}
export function kingdomsSpawnCandidates(s){const out=[];for(let x=-13;x<29;x+=2)for(let z=-16;z<30;z+=2)out.push(kingdomsPosition(s,x,z));return out;}
