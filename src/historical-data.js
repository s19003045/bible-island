import { scriptureSource as bible } from './scripture.js';

// Metres throughout. A 0.45 m cubit is a declared modelling convention, not a resolved historical unit.
export const CUBIT = .45;
export const HUMAN_HEIGHT = 1.70;
export const dimensions = {
  tabernacle: { court: [100 * CUBIT, 50 * CUBIT], screen: 5 * CUBIT, tent: [30 * CUBIT, 10 * CUBIT, 10 * CUBIT], altar: [5 * CUBIT, 3 * CUBIT, 5 * CUBIT], ark: [2.5 * CUBIT, 1.5 * CUBIT, 1.5 * CUBIT] },
  solomon: { house: [60 * CUBIT, 30 * CUBIT, 20 * CUBIT], inner: 20 * CUBIT, porch: 10 * CUBIT, chamberHeight: 5 * CUBIT, chamberWidths: [5 * CUBIT, 6 * CUBIT, 7 * CUBIT], pillar: 18 * CUBIT, capital: 5 * CUBIT, sea: [10 * CUBIT, 5 * CUBIT] },
  herod: { facade: [100 * CUBIT, 100 * CUBIT], holy: [40 * CUBIT, 40 * CUBIT, 20 * CUBIT], inner: 20 * CUBIT },
};
export const historicalScenes = {
  tabernacle: {
    edition: '曠野的會幕與營地', category: '依經文尺度重建', scale: '外院 45 × 22.5 m · 成人 1.70 m',
    extent: 150, shadow: 65, target: [0, 1, 0], overview: [48, 31, 48], human: { target: [-3, 2.2, 0], offset: [22, -.45, 7] },
    plan: 83, close: [5, 4, 7],
    stops: { altar: [12, 1.35, 0], basin: [4, 1.1, 0], lampstand: [-6, 1.5, 1.45], incense: [-10, 1.3, 0], ark: [-12.75, 1.1, 0] },
    facts: ['院子長 100 肘、寬 50 肘，帷子高 5 肘；按每肘 0.45 m 換算。', '銅祭壇為 5 × 5 × 3 肘；燈臺在南側，桌子在北側。', '帳幕以木板骨架、幔子與多層織物呈現；剖面保留聖所與至聖所的界線。'],
    limits: '帳幕 30 × 10 肘的平面採常見復原方案；古代肘長、覆蓋物材質譯法、織紋與構造細部未完全確定。洗濯盆尺寸、器物間距、營地地形與帳棚數量是視覺推定，並非考古實測。剖面不代表百姓可自由進入。自由行走僅為指定營地與外院教學觀察區；入口帷幕收攏、工位與通道是本版的展示取捨，不代表某日實況或任何身分皆可自由進入。',
    sources: [{ title: '出埃及記 25–27、30、40 章', ...bible('Exodus 25-27;30;40'), note: '院幕、板架、器物尺度、方位與配置的主要文字依據。' }, { title: '民數記 2–3 章', ...bible('Numbers 2-3'), note: '會幕周圍安營的敘事；模型未聲稱復原各支派的實際人口與營界。' }],
  },
  solomon: {
    edition: '第一聖殿的院落與殿宇', category: '依經文尺度重建', scale: '殿身 27 × 9 × 13.5 m · 成人 1.70 m',
    extent: 180, shadow: 85, target: [0, 5, 0], overview: [66, 37, 57], human: { target: [0, 7, 0], offset: [34, -5, 20] }, plan: 112, close: [12, 9, 15],
    stops: { pillars: [15, 8, 0], sea: [22, 3, 12], sanctuary: [-7, 5, 0] },
    facts: ['殿身長 60、寬 20、高 30 肘；內殿為邊長 20 肘的空間。', '兩根銅柱柱身高 18 肘、柱頂 5 肘；銅海直徑 10 肘、盆高 5 肘，十二牛分四向承托。', '石造外部、香柏木內襯與金飾分開建模；側屋以三層呈現。'],
    limits: '殿身尺寸採列王紀上；前廊高度、銅柱位置和細部、外院範圍、祭壇方案及山坡聚落均有復原取捨。銅海高度按盆身量取，不含推定牛座。不是已出土第一聖殿的實測模型。',
    sources: [{ title: '列王紀上 6–7 章', ...bible('1 Kings 6-7'), note: '殿身、內殿、側屋、銅柱、銅海及其承托牛像。' }, { title: '歷代志下 3–4 章', ...bible('2 Chronicles 3-4'), note: '對讀前廊、祭壇及洗濯用途；與列王紀的記載存在需辨識的差異。' }],
  },
  herod: {
    edition: '希律擴建後的第二聖殿', category: '古代文獻參照復原', scale: '殿前立面約 45 m 高 · 成人 1.70 m',
    extent: 330, shadow: 155, target: [12, 15, 0], overview: [155, 104, 155], human: { target: [-2, 25, 0], offset: [92, -15.3, 45] }, plan: 285, close: [22, 18, 28],
    stops: { steps: [68, 7, 108], portico: [25, 15, -86], temple: [-17, 23, 0] },
    facts: ['殿宇立面採古代文獻中高、寬各 100 肘的描述；此版換算為約 45 m。', '高台、分層院落、欄界、階梯與柱廊分別呈現；殿宇內不放置約櫃。', '人物保持 1.70 m 的參照尺寸，以院落中的步行者顯示建築量體。'],
    limits: '這是聖殿核心與外院的教學截景，不是整座聖殿山的測量圖。約瑟夫斯與後編《米示拿》的記述在尺度和細節上有差異；柱廊外圈、地坪、院界與門樓配置為選擇性復原，不能指定為西元 30 年某日的完整現況。',
    sources: [{ title: '約瑟夫斯《猶太戰記》卷五，第五章', url: 'https://sacred-texts.com/jud/josephus/war-5.htm', note: '院落、柱廊、殿宇立面與內部空間的古代描述；是文本證詞，並非現代測繪。' }, { title: '《米示拿・Middot》4–5 章', url: 'https://www.sefaria.org/Mishnah_Middot.4?lang=bi', note: '對讀殿宇與院落尺度；成書晚於第二聖殿毀壞，使用時需保留差異。' }, { title: '以色列博物館：耶路撒冷模型', url: 'https://www.imj.org.il/en/wings/shrine-book/model-jerusalem-second-temple-period', note: '模型呈現西元 66 年；不能直接把完整城市狀態套用到耶穌活動年代。' }],
  },
  exodus: {
    edition: '從勞役聚落到渡海敘事', category: '三段敘事並置 · 非連續地理', scale: '成人 1.70 m · 海岸與通道為敘事示意',
    extent: 290, shadow: 110, target: [8, 2, 0], overview: [-103, 52, 66], human: { target: [35, 2.1, 0], offset: [-35, -.4, 5.5] }, plan: 190, close: [12, 7, 15],
    stops: { bricks: [-48, 1, -26], passover: [-35, 1.5, 21], crossing: [30, 2, 0] },
    facts: ['以泥磚、草料、磚模與曬場呈現出埃及記中的製磚勞役。', '住家可看見門框、行囊與簡單生活器物；步行隊伍採正常成人及兒童比例。', '海中乾地與兩側水面按出埃及記 14 章敘事呈現。'],
    limits: '製磚、逾越節住家與渡海是不同時間、地點的分段敘事，在同一畫面中並置方便閱讀，不代表它們彼此相鄰。未指定法老、年代、渡海海域或海牆高度；人物數量不代表出埃及人口。',
    sources: [{ title: '出埃及記 1、5、12–14 章', ...bible('Exodus 1;5;12-14'), note: '製磚、出發準備及渡海場景的敘事依據；未提供可直接套用的完整地形測量。' }, { title: '出埃及路線的不同提案', url: 'https://www.biblegateway.com/learn/topics-themes/commentaries/exodus-route-from-egypt/', note: '列出常見研究提案與地點辨識的不確定性，作為對讀材料。' }],
  },
  jerusalem: {
    edition: '第一世紀山城的街區生活', category: '考古類型參照復原', scale: '成人 1.70 m · 家屋、街巷與谷地分層',
    extent: 360, shadow: 115, target: [10, 7, -12], overview: [-120, 77, 130], human: { target: [-23, 10, 0], offset: [42, -.3, 1.5] }, plan: 255, close: [13, 8, 16],
    stops: { house: [-28, 13, 19], gate: [27, 8, 0], valley: [105, -2, -15] },
    facts: ['平屋頂、內院、外梯、石牆、儲水設施與石器，提供第一世紀生活的空間背景。', '階梯街道、露台住區、城門截段、谷地與東側山坡，形成前中後景。', '以晚第二聖殿時期住家與潔淨設施的考古資料作類型參考。'],
    limits: '街區是類型復原，並未逐戶重建考古遺址；房屋、城門、街道與谷地間距是構圖推定。東側山坡提示汲淪谷與橄欖山方向，並非全城等比例測繪。沒有使用現代舊城牆、後世圓頂或基督教教堂作新約背景。',
    sources: [{ title: 'Jerusalem: The Upper City during the Second Temple Period', url: 'https://www.gov.il/en/pages/jerusalem-the-upper-city-during-the-second-temple-period', note: '考古發掘中的內院住宅、潔淨池、石製器皿與生活遺存。' }, { title: '以色列文物局：耶路撒冷 Tif’eret Yisra’el 發掘報告', url: 'https://hadashot.iaa.org.il/Report_Detail_Eng.aspx?id=25692', note: '分辨第二聖殿晚期住區及潔淨設施，與後來羅馬、拜占庭層位。' }, { title: '約翰福音 18；路加福音 19', ...bible('John 18;Luke 19'), note: '谷地與山路的經文閱讀入口；模型未指認每個事件發生點。' }],
  },
};
