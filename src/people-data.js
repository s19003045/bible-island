import {lettersPeople} from './letters-content.js';
import {churchPeople} from './church-content.js';
import {passionPeople} from './passion-content.js';
import {parablesPeople} from './parables-content.js';
import {samariaPeople} from './samaria-content.js';
import {galileePeople} from './galilee-content.js';
import {nativityPeople} from './nativity-content.js';
import {intertestamentPeople} from './intertestament-content.js';
import {nehemiahPeople} from './nehemiah-content.js';
import {exilePeople} from './exile-content.js';
import {kingdomsPeople} from './kingdoms-content.js';
import {davidPeople} from './david-content.js';
import {ruthPeople} from './ruth-content.js';
import {sinaiPeople} from './sinai-content.js';
import {josephPeople} from './joseph-content.js';
import {abrahamPeople} from './abraham-content.js';
import {paulPeople} from './paul-content.js';
import {returnPeople} from './return-content.js';
import { scriptureLinks } from './scripture.js';
import {jordanPeople} from './jordan-content.js';

// Composite teaching characters. None of these lines is a quotation or a named person's testimony.
const topic = (id, question, answer, reference, passage, stop, followup) => ({id,question,answer,reference,passage,stop,followup});
const npc = (id, name, role, era, position, style, motion, greeting, topics, route = null, routeMode = 'shuttle') =>
  ({id,name,role,era,position,style,motion,greeting,topics,route,routeMode});
export const dialogueNotice = '角色為綜合設計；對白依經文與歷史背景編寫，並非經文原話。';
export const peopleByIsland = {
  letters:lettersPeople,
  church:churchPeople,
  passion:passionPeople,
  parables:parablesPeople,
  samaria:samariaPeople,
  galilee:galileePeople,
  nativity:nativityPeople,
  intertestament:intertestamentPeople,
  nehemiah:nehemiahPeople,
  exile:exilePeople,
  kingdoms:kingdomsPeople,
  david:davidPeople,
  judges:ruthPeople,
  sinai:sinaiPeople,
  joseph:josephPeople,
  abraham:abrahamPeople,
  paul:paulPeople,
  'second-temple':returnPeople,
  jordan:jordanPeople,
  tabernacle: [
    npc('weaver','織作工匠','營地裡的織作與材料','會幕建成後的曠野營地',[29,0,5],2,'walk',
      '先在營地這邊歇歇吧。看看帳幕的織物、木板和繩索；要在曠野安營，許多人的手藝都派得上用場。',[
        topic('materials','這些布是誰做的？','會眾有人獻材料，也有人紡線、織作。建造帳幕不是只靠一個人；金屬、木作、織物各有需要的手藝。','出埃及記 35:20–35','Exodus 35:20-35','incense',
          {question:'所以不是每個人都做同一種工作？',answer:'是的，經文分別提到奉獻、紡線和各樣巧工。你可以先辨認布、木、金屬，再想想需要哪些不同的工序。'}),
        topic('portable','這麼大的帳幕，怎麼搬走？','它不是固定的石屋。板、座、槓與織物可以分開搬運；民數記還把帳幕、器具及架構的搬運責任分配給不同群體。','出埃及記 26；民數記 4','Exodus 26;Numbers 4','ark'),
        topic('colors','顏色和花紋都能確定嗎？','經文提到藍色、紫色、朱紅色線與細麻，也提到基路伯。但你眼前的染色深淺、織紋與每一處細節，是模型的復原選擇。','出埃及記 26:1–14','Exodus 26:1-14','incense'),
      ],[[27,0,5],[32,0,5]]),
    {...npc('priest','值事祭司','外院的準備與界線','會幕建成後的曠野營地',[7,0,-4],1,'idle',
      '我正在外院預備。從祭壇看向帳幕，中間那個銅盆很容易被忽略，卻和服事前的準備有關。',[
        topic('washing','為什麼先洗手洗腳？','經文吩咐亞倫和他的兒子，進會幕或到壇前供職時，要用盆裡的水洗手洗腳。這是祭司服事的規定，不只是走路沾了灰塵。','出埃及記 30:17–21','Exodus 30:17-21','basin',
          {question:'這就是所羅門聖殿的銅海嗎？',answer:'不是同一件器物。會幕的洗濯盆與後來聖殿的銅海，屬不同時期；經文也沒有給這個盆完整的尺寸。',reference:'出埃及記 30:17–21；列王紀上 7:23–26',passage:'Exodus 30:17-21;1 Kings 7:23-26'}),
        topic('curtain','我也能走進幔子後面嗎？','幔子把聖所和至聖所分開。利未記對大祭司進入內部有嚴格規定；你能用模型剖面觀察，不表示當時人人都能進入。','出埃及記 26:31–33；利未記 16','Exodus 26:31-33;Leviticus 16','incense'),
        topic('two-altars','兩個壇的用途一樣嗎？','院裡的銅壇用於獻祭；帳幕內、幔子前的金香壇用於燒香。先看它們的位置、材料和大小，便不容易把兩者混在一起。','出埃及記 27:1–8；30:1–10','Exodus 27:1-8;30:1-10','altar'),
      ]),headCover:true},
    npc('camp-parent','營地家長','安營與下一段路','會幕建成後的曠野營地',[30,0,-7],3,'idle',
      '孩子也會問：為什麼大家要圍著帳幕安營？一起看看營地的中心，再想想移動時需要怎樣彼此配合。',[
        topic('camp','帳棚是隨便搭的嗎？','民數記把各支派的安營位置和起行次序分別交代。這裡的幾排帳棚只幫你理解營地，不代表完整人口、數量或精確配置。','民數記 2','Numbers 2','altar',
          {question:'這座營地有把所有人都畫出來嗎？',answer:'沒有。模型裡的人與帳棚經過大幅縮減；不要用畫面上的人數去推算經文所記的群體規模。'}),
        topic('moving','什麼時候才會再出發？','出埃及記結尾把起行和雲彩的升起連在一起。安營與出發都有次序；不是每個家庭自己決定先走。','出埃及記 40:34–38','Exodus 40:34-38','ark'),
        topic('memory','能從這裡看見出埃及的海嗎？','不能把模型中不同主題的距離當作真實路程。渡海、來到西奈、建成會幕，是敘事中先後不同的階段。','出埃及記 14；19；40','Exodus 14;19;40','altar'),
      ]),
  ],
  solomon: [
    npc('bronze-worker','銅作工匠','銅海與鑄造器物','所羅門建殿與獻殿的敘事',[25,.3,17],2,'work',
      '看看那個大銅盆和下面的牛。殿前的銅器，不只是裝飾；形狀、用途和鑄造都值得仔細看。',[
        topic('sea','這個大盆為什麼叫「海」？','經文用「海」稱呼這個大型圓形銅器，並記載十二隻牛承托它。歷代志把它的用途連到祭司洗濯；它不是渡海故事裡的海。','列王紀上 7:23–26；歷代志下 4:6','1 Kings 7:23-26;2 Chronicles 4:6','sea',
          {question:'下面的牛面向哪裡？',answer:'經文描述每三隻朝向一方，共四個方向。你可以繞著模型數一數，再與經文的方位對照。'}),
        topic('hiram','經文提到哪位銅匠？','列王紀提到所羅門從推羅召來一位善於銅作的戶蘭（也譯希蘭）。別把這位工匠和同名的推羅王混為一人；我只是幫你理解銅作的情境角色。','列王紀上 7:13–14；5:1','1 Kings 7:13-14;5:1','pillars'),
        topic('pillars','兩根銅柱有名字嗎？','殿前兩柱名叫雅斤與波阿斯。經文分別描述柱身、柱頂、網子和石榴；模型的細部花紋仍有復原成分。','列王紀上 7:15–22','1 Kings 7:15-22','pillars'),
      ]),
    npc('singer','利未歌者','獻殿的群體與音樂','獻殿敘事的教學情境',[34,.3,-15],1,'idle',
      '獻殿不只有石頭與木材，也有人聚集、歌唱與感謝。從院子回望殿宇，試著留意這些人的位置。',[
        topic('music','獻殿時會有什麼聲音？','歷代志描述歌者、鈸、瑟、琴與吹號的人一同讚美。這裡的手勢只是表現歌者，沒有宣稱重現當時失傳的旋律。','歷代志下 5:12–14','2 Chronicles 5:12-14','sanctuary',
          {question:'我們聽得到當年的曲子嗎？',answer:'這段經文留下樂器與讚美的描述，沒有留下可直接照奏的完整樂譜。若日後加入配樂，也應標明是現代創作。'}),
        topic('ark','約櫃是什麼時候放進去的？','獻殿敘事描述祭司把約櫃抬進內殿、至聖所。可以把這段與會幕的約櫃對讀，看看固定殿宇怎樣延續原來的敬拜空間。','列王紀上 8:1–11','1 Kings 8:1-11','sanctuary'),
        topic('access','大家都站在同一個地方嗎？','敘事區分會眾聚集、祭司抬櫃與內殿等空間。模型把屋頂打開是方便觀察，不表示歌者與所有百姓都能進至聖所。','列王紀上 8:1–11；歷代志下 5:12','1 Kings 8:1-11;2 Chronicles 5:12','sanctuary'),
      ]),
    npc('temple-visitor','來到院中的訪客','帳幕與固定殿宇','所羅門建殿與獻殿的敘事',[18,.3,-18],3,'walk',
      '走到這裡，人看起來很小吧？不過，要理解殿宇，除了抬頭看高度，也要看它與會幕相同和不同的地方。',[
        topic('tent','聖殿和會幕最大的差別是什麼？','會幕可拆卸搬遷；這裡則是以石材和木材建造的固定殿宇。聖所與內殿等空間延續了一些分層方式，但尺寸與器物並非全部相同。','列王紀上 6；出埃及記 26','1 Kings 6;Exodus 26','sanctuary',
          {question:'裡面也只有一座燈臺嗎？',answer:'列王紀上 7:49 提到左右各五座金燈臺。別把會幕的一座七燈燈臺，直接當作所有時期殿宇的完整配置。',reference:'列王紀上 7:49',passage:'1 Kings 7:49'}),
        topic('stone','為什麼要用這麼大的石材？','列王紀描述預備石料、木材與工匠，還提到石頭在運到殿址前加工。畫面幫助想像工程規模；每一塊石的接縫並非考古實測。','列王紀上 5:13–18；6:7','1 Kings 5:13-18;6:7','pillars'),
        topic('later','這是耶穌時代看見的那座嗎？','不是。所羅門的殿與後來重建、再由希律擴建的第二聖殿，屬不同時期。讀到福音書時，要切換到新約時期的聖殿。','列王紀下 25:8–17；以斯拉記 6:14–15；約翰福音 2:20','2 Kings 25:8-17;Ezra 6:14-15;John 2:20','sanctuary'),
      ],[[18,.3,-20],[18,.3,-15]]),
  ],
  herod: [
    npc('pilgrim','節期朝聖者','上行耶路撒冷','第一世紀的節期背景',[78,8,50],2,'walk',
      '我們往院落這邊走。來到耶路撒冷，不只是看一座大建築，也與節期、家庭和一同上路的人有關。',[
        topic('festival','為什麼有這麼多人上來？','路加記載耶穌的父母每年到耶路撒冷守逾越節。節期把遠近的人帶到城裡；模型的人數只用來表現聚集，不能當作人口估算。','路加福音 2:41–45','Luke 2:41-45','steps',
          {question:'家人會一起旅行嗎？',answer:'這段敘事提到親族、熟識的人和同行的隊伍。旅途有群體的支持，也需要留意彼此是否還在隊伍中。'}),
        topic('entry','我可以一直走到最裡面嗎？','不同院區有進入界線，不能把所有人都畫成能自由進出。這裡讓你旋轉與剖看建築，是學習的觀察視角。','約瑟夫斯《猶太戰記》5.5.2','Josephus','portico'),
        topic('steps','這些階梯就是每位朝聖者走的路嗎？','階梯幫你想像步行上行，但當時有不同入口。模型也只呈現教學截景，不是完整平台與每條歷史動線的測繪。','路加福音 2:41–50；聖殿南側遺構參考','Luke 2:41-50','steps'),
      ],[[72,8,50],[84,8,50]]),
    npc('stone-worker','石作工人','石材與漫長工程','希律擴建後的第二聖殿背景',[86,8,-60],0,'work',
      '先看石塊的邊，再退後看整個平台。一座大建築需要漫長工程，也會讓第一次來的人驚訝。',[
        topic('stones','這裡的石頭真的很大嗎？','馬可記載門徒讚嘆聖殿的石頭和建築。模型用石材接縫呈現尺度；每塊石的大小與位置仍是復原，不是逐塊掃描。','馬可福音 13:1–2','Mark 13:1-2','temple',
          {question:'耶穌怎麼回應門徒？',answer:'馬可把驚嘆建築的話，接到耶穌預告其被拆毀的敘事。請回到整章閱讀；眼前角色只是工人情境，並不預先知道後來的歷史。'}),
        topic('years','這座殿花了多久？','約翰福音 2:20 提到四十六年的建造說法。這不能簡化成所有平台與附屬工程都在同一天開工、同一天完成。','約翰福音 2:19–22','John 2:19-22','temple'),
        topic('second','為什麼還叫第二聖殿？','希律對原有第二聖殿進行大規模改建，並不是把它稱為所羅門的第一聖殿。早期歸回重建與後來的擴建，要分時期看。','以斯拉記 6:14–15；約翰福音 2:20','Ezra 6:14-15;John 2:20','temple'),
      ]),
    npc('listener','柱廊中的聆聽者','行走、提問與聆聽','第一世紀的聖殿院落',[24,8,-85],3,'idle',
      '柱廊下適合停一停。經文裡，有人在聖殿行走，也有人坐著聆聽、提問；空間和對話是連在一起的。',[
        topic('teaching','人們會在這裡討論什麼？','路加描述年少的耶穌在教師中間聆聽和發問；約翰提到耶穌在所羅門廊行走。這是不同段落，不能合成同一天的一場對話。','路加福音 2:46–47；約翰福音 10:22–23','Luke 2:46-47;John 10:22-23','portico',
          {question:'這排柱子就是所羅門本人蓋的嗎？',answer:'「所羅門廊」是經文使用的名稱；不能只憑名稱就認定眼前每根柱子都保存自第一聖殿時代。模型的這排柱廊也只是空間示意。'}),
        topic('ask','我該怎麼開始讀這些場景？','先找一段經文，辨認誰在說話、對誰說、站在哪裡。再看前後文的問題與回應；不要只取一句話，忽略整段對話的處境。','路加福音 2:41–50','Luke 2:41-50','portico'),
        topic('ark','最裡面也有約櫃嗎？','這版模型沒有把會幕或第一聖殿的約櫃搬進新約聖殿。第二聖殿內殿的資料，需要和較早時期分開查考。','約瑟夫斯《猶太戰記》5.5.5','Josephus','temple'),
      ]),
  ],
  exodus: [
    npc('brick-maker','製磚勞作者','泥、草與被加重的勞役','故事第一段 · 出埃及記 5 章',[-46.5,.03,-20],2,'work',
      '這裡是出發以前的勞役場景。泥和草在手邊，但更重的負擔，是被要求完成的工作。',[
        topic('straw','草為什麼要放在製磚場？','出埃及記 5 章把製磚、草與每日數量連在一起；法老不再供草，仍要求同樣磚數。這段的重點是壓迫加重，不是介紹一份輕鬆的工藝工作。','出埃及記 5:6–19','Exodus 5:6-19','bricks',
          {question:'為什麼大家不能少做一點？',answer:'經文說督工仍催促完成原來的數量，官長也受到責打。讀這段時，要留意命令、權力和人承受的苦。'}),
        topic('pharaoh','這位法老叫什麼名字？','出埃及記在這些段落沒有交代法老的名字。研究有不同年代與人物提案，所以這裡不放某位法老的名牌或宣稱工地已被考古證實。','出埃及記 1；5','Exodus 1;5','bricks'),
        topic('sea-now','渡海的人和你是同一天嗎？','不是。這座島把勞役、逾越節和渡海並置，方便比較敘事。它們不是同時發生，也不是走出這個磚場就立刻到海邊。','出埃及記 5；12；14','Exodus 5;12;14','crossing'),
      ]),
    npc('passover-parent','預備出發的家長','家中的筵席與行囊','故事第二段 · 出埃及記 12 章',[-30,0,28],1,'idle',
      '現在到了準備離開的段落。我們從門框和桌上的物件，回看昨夜的筵席與吩咐，再預備上路。',[
        topic('ready','為什麼吃飯也要預備走路？','經文吩咐束腰、穿鞋、拿杖，趕緊吃。這些動作把筵席與即將離開的處境連起來；桌旁的行囊是協助理解的場景設計。','出埃及記 12:1–14','Exodus 12:1-14','passover',
          {question:'桌上為什麼有無酵餅？',answer:'這一夜的吩咐提到羊羔、無酵餅與苦菜。後文又提到人急忙離開、麵還沒有發起；請把吩咐與出發的敘事一同閱讀。',reference:'出埃及記 12:8、34、39',passage:'Exodus 12:8;12:34;12:39'}),
        topic('door','門框上的顏色代表什麼？','經文記載把血塗在門框和門楣，並把這事與逾越的記號相連。模型以顏色提示經文位置，沒有呈現暴力畫面。','出埃及記 12:7、12–13、21–23','Exodus 12:7-23','passover'),
        topic('children','後來孩子問起這一夜呢？','經文預想兒女會問這個禮的意思，家長要回答並述說。記念不只是保留物件，也包括把經歷解釋給下一代。','出埃及記 12:24–27','Exodus 12:24-27','passover'),
      ]),
    npc('traveler','渡海的旅人','跟著隊伍前行','故事第三段 · 出埃及記 14 章',[18,0,-3],3,'walk',
      '這一站是渡海的敘事。腳下是通道，兩邊是水；先留意隊伍前進的方向，再回頭讀人們先前的害怕。',[
        topic('fear','站在海邊時，大家不害怕嗎？','經文先描述追兵逼近、百姓懼怕與呼求，接著才描述開路與渡海。不要只看見分開的水，忘了前面困境中的反應。','出埃及記 14:10–22','Exodus 14:10-22','crossing',
          {question:'走過去的路是什麼樣子？',answer:'經文說以色列人走乾地，水在左右作牆垣。模型用通道與水牆表現這段敘事；水的高度、隊列和速度不是經文給出的測量值。'}),
        topic('location','可以確定是今天哪個海域嗎？','渡海位置與出埃及路線有不同研究提案。這裡呈現經文中的海與通道，不指定現代座標，也不把模型當作已確認的地理證據。','出埃及記 13:17–22；14','Exodus 13:17-22;14','crossing'),
        topic('after','渡海後就到會幕了嗎？','還沒有。渡海、曠野行程、西奈立約與會幕建成，是後續不同階段。從這座島讀下去，才會慢慢走到會幕的故事。','出埃及記 15；19；40','Exodus 15;19;40','crossing'),
      ],[[12,0,-3],[78,0,-3]],'forward'),
  ],
  jerusalem: [
    npc('householder','院落裡的住戶','家屋與日常生活','第一世紀耶路撒冷 · 類型復原',[-34,10.21,24],1,'idle',
      '到院子裡坐坐吧。房間、外梯與屋頂把生活分成不同空間；這不是某位聖經人物已確認的故居。',[
        topic('courtyard','為什麼房間圍著一個院子？','耶路撒冷第二聖殿時期的部分住居發掘，有內院、房間、儲藏空間與潔淨設施。這裡借用家屋類型，沒有把某一棟出土房屋完整搬過來。','耶路撒冷上城住居發掘資料','UpperCity','house',
          {question:'每個家庭都有這麼大的房子嗎？',answer:'不能這樣推論。上城部分發掘反映較富裕住居；家庭財力與街區有差異，這一棟不能代表全城每個人的生活。'}),
        topic('roof','抬癱子拆屋頂的事就在這裡嗎？','馬可福音 2 章的那件事發生在迦百農，不在耶路撒冷。這裡只能幫你比較平屋頂、樓梯與家屋空間，不能把事件移到這一戶。','馬可福音 2:1–12','Mark 2:1-12','house'),
        topic('vessels','石製器皿和陶罐有什麼不同？','第二聖殿晚期耶路撒冷出土許多石器，研究把它與潔淨觀念聯繫起來。模型同時放入石器與陶器作比較；不能由一個器皿猜定屋主身分。','耶路撒冷上城石器發掘資料','UpperCity','house'),
      ]),
    npc('water-carrier','提水的居民','山城中的步行生活','第一世紀耶路撒冷 · 類型復原',[-5,8.325,1.8],2,'walk',
      '這條路有坡度，拿著器皿時就更有感覺。先看腳下的階梯，再看看城外谷地與山坡的方向。',[
        topic('hills','耶路撒冷為什麼有那麼多上下坡？','城與周圍山谷讓出入有高低變化。約翰提到過汲淪溪，路加提到橄欖山一帶；模型壓縮距離，讓你同時看見城、谷與山。','約翰福音 18:1；路加福音 19:29、37','John 18:1;Luke 19:29-37','valley',
          {question:'那可以照這條路去找客西馬尼嗎？',answer:'這不是可導航的第一世紀街道測繪。可以用它理解方向與地勢，再查地圖、考古資料與經文，不應把模型的小路當作確定的歷史路線。'}),
        topic('water','每個人家裡都有水龍頭嗎？','模型沒有使用現代自來水設施。儲水池、容器與提水的動作，是古代城市用水的生活背景；這位角色的取水路線是教學設計。','第一世紀住居與儲水設施參考','UpperCity','house'),
        topic('gate','這個城門叫什麼？','這裡只做古代城門的類型截段，沒有指定福音書中某一座門。也沒有把今天看得到的後世舊城牆，直接當成第一世紀的城牆。','路加福音 19:28–44；場景復原說明','Luke 19:28-44','gate'),
      ],[[-8,8.52,1.8],[8,8,1.8]]),
    npc('street-vendor','年長的街邊商販','器皿、往來與節期人流','第一世紀耶路撒冷 · 類型復原',[-42,10.73,1.4],0,'idle',
      '走過來看看器皿吧。街道不只通向目的地，也有買賣、搬運與人們相遇的日常。',[
        topic('market','這裡就是耶穌潔淨聖殿的地方嗎？','不是。馬可福音 11 章把買賣與兌換銀錢的事件放在聖殿範圍；這裡是住區街道的日常商販示意，不能把兩個場景混在一起。','馬可福音 11:15–19','Mark 11:15-19','gate',
          {question:'怎麼避免把不同故事混在一起？',answer:'先核對城市、地點和段落，再看模型。聖殿院落、一般住家與街道都有不同用途；同樣有器皿或人群，不表示是同一件事。'}),
        topic('festival','節期會改變城裡的生活嗎？','前來守節的人需要同行、住宿與日常供應。路加記載家庭和同伴上耶路撒冷；街市人流是依這種背景設計，並非某一天的商販名冊。','路加福音 2:41–45','Luke 2:41-45','gate'),
        topic('price','你賣的一個罐子值多少錢？','這個模型沒有足夠資料，可以報出特定年代、容量、品質與交易條件下的確定價格。先比較材質與用途，比編一個看似精準的價錢可靠。','耶路撒冷住居器物參考；價格未定','UpperCity','house'),
      ]),
  ],
};
export const personById = (island, id) => peopleByIsland[island]?.find(p=>p.id===id);
export const dialogueSources = (passage, label) => passage === 'UpperCity'
  ? [{ label, url: 'https://www.gov.il/en/pages/jerusalem-the-upper-city-during-the-second-temple-period' }]
  : passage === 'Josephus' ? [{ label, url: 'https://sacred-texts.com/jud/josephus/war-5.htm' }]
  : scriptureLinks(passage).map((link, index, links) => ({ ...link, label: links.length === 1 && label ? label : link.label }));
export const dialogueSource = passage => dialogueSources(passage)[0].url;
