import {scriptureSource} from './scripture.js';

// These notes are shown in the existing scene-evidence dialog, beside sources.
// Clothing categories must not become claims of exact dating or recovered uniforms.
const linenSource={title:'IAA：Nahal ʽArugot 紡織物報告',url:'https://hadashot.iaa.org.il/report_detail_eng.aspx?id=25101&mag_id=124',note:'材料與織作的比較資料，含多個時期；不能把所有布片都當成第一世紀衣裝。'};
const roman={fact:'人群包含不同身高、長衣與披布類型；婦女及孩童使用相應身形與衣裝。',limits:'婦女長衣、頭背披布、髮型和衣色是類型選擇，不表示當時所有女性都包頭或穿相同衣服；畫面中的人物組成不是人口比例。',sources:[linenSource]};
export const residentClothingEvidence={
  nehemiah:{
    fact:'修牆與聆聽人群包含不同身形的居民；夜察僅少數成人，後續工段與誦讀聚集另呈現。',
    limits:'沿用歸回敘事的普通衣裝類型；袖形、披布、髮型與衣色為教學選擇，不認證波斯時期制服。無名角色不是尼希米或以斯拉肖像，人物數量不表示人口比例或經文人名清單。',
    sources:[{title:'尼希米記 2:11–16；3:1–32；8:1–12',...scriptureSource('Nehemiah 2:11-16;3:1-32;8:1-12'),note:'少數人夜察、不同群體修建及能聽明白者聚集，不能當成完整服裝裁縫圖。'}],
  },
  samaria:roman,
  galilee:roman,
  nativity:roman,
  intertestament:roman,
  jerusalem:roman,
  herod:roman,
  tabernacle:{
    fact:'一般祭司使用細麻長衣、腰帶與布冠的教學形制；營地居民另有束帶衣與覆布。',
    limits:'衣長、冠形、腰帶線紋與赤足為復原選擇，未把大祭司的胸牌、以弗得及金牌套在每位祭司身上。居民覆布與婦女衣裝不宣稱已確認的曠野服裝或年代。',
    sources:[{title:'出埃及記 28:40–43；39:27–29',...scriptureSource('Exodus 28:40-43;39:27-29'),note:'對讀一般祭司衣物與大祭司服飾；模型的剪裁、布冠及織紋仍屬選擇。'},{title:'出埃及記 35:20–35',...scriptureSource('Exodus 35:20-35'),note:'男女奉獻與織作的描述，不用作各式日常衣裝的精確裁縫圖。'}],
  },
  solomon:{
    fact:'歌者的細麻衣與工匠、院中居民的日常衣裝分開呈現。',
    limits:'細麻是獻殿敘事中的衣料；衣色、衣長、袖形、披布及工裝是教學補足，不是已出土的所羅門時代制服。歌者手勢不重演失傳樂譜，也未加入看不見的樂器。',
    sources:[{title:'歷代志下 5:12–14',...scriptureSource('2 Chronicles 5:12-14'),note:'歌者衣料、樂器與獻殿背景；未給出完整衣服剪裁或可照奏的樂譜。'}],
  },
  exodus:{
    fact:'製磚勞作者、預備出發的家庭與渡海隊伍，使用不同衣裝情境與持續自主移動的人物。',
    limits:'工作圍衣、裸露上身、赤足及家庭覆布是教學選擇；埃及製磚圖像只供生活工序比較，不用來認定出埃及年代、法老或角色身分。分段衣裝差異也不表示同一天全部換裝。',
    sources:[{title:'Met：Rekhmire 墓製磚圖像臨摹 30.4.77',url:'https://www.metmuseum.org/art/collection/search/544649',note:'館方列古代圖像約前 1479–1425 年；現代臨摹為比較資料，不能據此辨識出埃及人物。'},{title:'出埃及記 12:11',...scriptureSource('Exodus 12:11'),note:'束腰、鞋與杖的出發準備；不提供每位旅人的完整服裝式樣。'}],
  },
};
