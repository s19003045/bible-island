import {scriptureSource} from './scripture.js';
import {jordanFloor} from './jordan-exploration.js';
export const jordanHistorical={
 edition:'約旦河的乾地、兩岸與記念',category:'敘事與河谷類型復原',scale:'成人約 1.70 m · 河谷與行程壓縮示意',extent:220,shadow:100,target:[2,2,4],overview:[-72,48,68],human:{target:[-12,1.5,0],offset:[-26,2,17]},plan:140,close:[13,8,16],cutaway:false,
 stops:{river:[0,.1,0],ark:[0,1.4,-15],stones:[41,jordanFloor(41)+.8,22]},
 facts:['約書亞記 3 章記收割時河水漫岸、上游遠處水被截斷、百姓走乾地；這與出埃及記的左右水牆描述不同。','抬約櫃的祭司在河中乾地站住；百姓受吩咐與約櫃保持約二千肘，不可靠近。','4:1–8、19–24 記從河中帶十二石到宿營地及吉甲；4:9 另記河中十二石，兩處不可混同。'],
 limits:'河寬、岸坡、沉積、營地、人數與吉甲位置都是教學補足；未指定渡口、出埃及年代、亞當城考古辨識或自然機制。場景把不同敘事時刻並置，前進人群不是人口統計。約二千肘按本專案一肘 0.45 m 約為 900 m；CSBT 註腳另採 0.457 m。畫面壓縮距離，玩家路線不是古代跟隨約櫃的實測路線。約櫃旁不開放步行，覆布與服裝依搬運規範作類型選擇，不演示打開或觸摸聖物。吉甲十二石的形狀、堆疊及地點不是已發掘原物。',
 sources:[{title:'約書亞記 3:1–17',...scriptureSource('Joshua 3:1-17'),note:'先後、二千肘、漫岸、遠處上游截水及站立的祭司。'},{title:'約書亞記 4:1–24',...scriptureSource('Joshua 4:1-24'),note:'分清帶往吉甲與河中兩處石頭，並讀下一代提問。'},{title:'民數記 4:5–6',...scriptureSource('Numbers 4:5-6'),note:'搬運遮蓋的比較，約書亞記未逐項重述；不確定皮革名稱不指定動物。'},{title:'出埃及記 14:21–22；約書亞記 4:23–24',...scriptureSource('Exodus 14:21-22;Joshua 4:23-24'),note:'敘事彼此連結，水的空間描述仍須各自辨識。'}],
};
const topic=(id,question,answer,reference,passage,stop,followup)=>({id,question,answer,reference,passage,stop,followup});
const person=(id,name,role,x,z,greeting,topics)=>({id,name,role,era:'約書亞記 3–4 章 · 綜合教學角色',position:[x,jordanFloor(x),z],style:1,motion:'idle',greeting,topics});
export const jordanPeople=[
 person('jordan-priest','隨隊的祭司','次序、距離與約櫃',-39,17,'先在岸邊讀清楚吩咐。前面不是一場搬運競賽；誰先行、在哪裡站住，以及百姓保持的距離，都和這段故事有關。',[
  topic('distance','為什麼不能緊跟約櫃？','官長吩咐百姓與約櫃保持約二千肘，好辨認從未走過的路。這個畫面把距離壓縮了，不能用畫面步數取代經文的尺度。','約書亞記 3:1–4','Joshua 3:1-4','ark',{question:'那我能跑到約櫃旁邊嗎？',answer:'教學路線不開放靠近約櫃，也沒有觸摸或開蓋操作。岸邊的覆布教具可以旋轉比較，兩者要分清。'}),
  topic('standing','祭司為什麼站在河中？','經文描述抬約櫃的祭司在河中乾地站住，等百姓都過去，後來才按吩咐上岸。這裡選擇其中一幕，沒有把所有步驟同時重演。','約書亞記 3:17；4:10–18','Joshua 3:17;4:10-18','river'),
  topic('cover','為什麼看到的是覆布？','民數記的搬運規範提到先遮蓋見證櫃，再放頂罩和藍布。約書亞記沒有重述每層細節；這個模型借規範作比較，不宣稱拍下了過河當日。','民數記 4:5–6','Numbers 4:5-6','ark'),
 ]),
 person('jordan-traveler','河岸的旅人','水、乾地與前行',-20,19,'從這裡往河床看。先留意兩岸的高低，再看隊伍腳下；這不是另一座有左右水牆的渡海模型。',[
  topic('water','上游的水停在哪裡？','約書亞記說，從上游流下的水遠遠在亞當城一帶停住，往鹽海的水被截斷。畫面不在隊伍兩側堆起水牆，也不指定現代哪一個渡口。','約書亞記 3:14–17','Joshua 3:14-17','river',{question:'和過紅海完全一樣嗎？',answer:'兩段都提到走乾地，約書亞記也回顧紅海；但水的描述各有脈絡。要分別閱讀，不能把所有畫面細節互相搬用。'}),
  topic('harvest','收割季節為什麼重要？','這段特別說收割時約旦河漫過河岸。它讓讀者理解眼前的阻隔；模型中的岸高、河寬和植物卻沒有經文給出的完整測量。','約書亞記 3:15','Joshua 3:15','river'),
  topic('route','這條路能當歷史地圖嗎？','不能。東岸準備、河床和西岸記念被壓縮到一個觀察區，讓你對讀先後。人物數量與走到吉甲的時間，也不能從這裡計算。','約書亞記 4:19–24','Joshua 4:19-24','stones'),
 ]),
 person('jordan-parent','講述故事的家長','十二石與孩子的問題',46,18,'石頭不只讓人數一數。故事特別想到日後孩子會問什麼，也想到大人要怎樣把走過的路說清楚。',[
  topic('twelve','為什麼帶十二塊石頭？','每支派選一人，從祭司站立的地方各取一塊石頭，帶到宿營地。十二石成為記念的標記；這不是搶石頭或比力氣的比賽。','約書亞記 4:1–8','Joshua 4:1-8','stones',{question:'孩子問起時，要說什麼？',answer:'要把百姓曾走乾地過約旦河的事告訴孩子，並回顧紅海。重點是記住並述說經歷，石頭本身沒有讓人過河的能力。'}),
  topic('two-places','河裡和吉甲的是同一組嗎？','先分清段落。第四章先說從河中帶石頭到宿營地，後來說立在吉甲；第九節另提河中十二石。這裡只用西岸這組提示吉甲，不把兩處合併。','約書亞記 4:8–9、19–20','Joshua 4:8-9;4:19-20','stones'),
  topic('found','這些就是找回來的原石嗎？','不是。它們是新做的教學模型，沒有古代銘文或已確認的遺址身分。石形、大小和堆法都需要與經文說的記念用途分開。','約書亞記 4:20–24','Joshua 4:20-24','stones'),
 ]),
];
export const jordanLearning={
 opening:'先看河谷與乾地，再核對約櫃的先行和距離，最後到西岸十二石，分清過河與後來的記念。',closing:'乾地、約櫃與十二石連起前行和記憶；模型幫助觀察，地點、尺寸與不同時刻仍須回到經文。',compare:'exodus',
 child:[
  {id:'river',stop:'river',actor:'jordan-traveler',question:'這段經文說百姓踩著什麼過河？',options:['乾地','一座現代橋','海上大船'],correct:0,hint:'看人們腳下，並與出埃及的畫面比較；不要替約旦河兩側加上經文未說的貼身水牆。',explanation:'約書亞記 3:17 記百姓從乾地過去；河床形狀和尺寸仍是模型補足。'},
  {id:'ark',stop:'ark',actor:'jordan-priest',question:'百姓跟隨約櫃時，應怎樣？',options:['跑去打開櫃蓋','按吩咐保持距離','人人搶著搬'],correct:1,hint:'看岸邊的抬槓教具，再讀官長的吩咐。前行有次序，觀察也要分清是否可以靠近。',explanation:'約書亞記 3:4 吩咐保持約二千肘，不可靠近；畫面距離經過壓縮。'},
  {id:'stones',stop:'stones',actor:'jordan-parent',question:'日後孩子問起十二石，要做什麼？',options:['比誰搬得多','說石頭有魔法','述說走乾地過河的事'],correct:2,hint:'數一數這組石頭，再問家長：為什麼故事特別想到下一代的問題？',explanation:'約書亞記 4:21–24 把石頭、孩子的提問與講述過河連在一起。'},
 ],
 study:[
  {id:'river',stop:'river',claim:'畫面中的約旦河應像渡海一樣，在隊伍左右立起貼近的水牆。',kind:'reconstruction',basis:'約書亞記 3:16 將上游截水放在遠處；出埃及記 14:22 另有左右水牆的描述。',limit:'兩段都記乾地，卻不能直接互換水體配置；本版河床與岸坡也是教學復原。',reference:'Joshua 3:14-17;Exodus 14:21-22'},
  {id:'ark',stop:'ark',claim:'約書亞記吩咐百姓與約櫃保持約二千肘。',kind:'text',basis:'約書亞記 3:4 可核對距離、不可接近及辨認道路的吩咐。',limit:'本專案一肘取 0.45 m，約為 900 m；CSBT 註腳取 0.457 m。畫面壓縮距離，不是精確路線。',reference:'Joshua 3:1-8'},
  {id:'stones',stop:'stones',claim:'西岸這十二塊石頭就是經考古證實的吉甲原物及原堆法。',kind:'reconstruction',basis:'約書亞記 4:1–9、19–24 提供兩處石頭與記念的敘事。',limit:'未確認本模型的石種、尺寸、堆疊與地點；要分清河中與帶往宿營地的兩處記載。',reference:'Joshua 4:1-9;4:19-24'},
 ],
};
