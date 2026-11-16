# Samaria 實際24cue：生成前文字覆核

2026-11-17。完整讀 `.qa/samaria-voice-script.json` 的24個cue及三份完整拼接`text`，對照目前 `src/samaria-content.js`、`src/learning-model.js`、已註冊的content／people／learning資料，以及既有研究與本島內容覆核。沒有擴搜、改app／媒體／Git／Sites或生成音檔；本輪只新增此報告。

**結論：此確切稿在經文、史料與親子衍生文字上無必要修正，可供根代理完整親讀後決定三位角色各一次固定聲音生成。** 這是文字適用性結論，不代替根代理的下一步決策，也不是聲音已生成／可聽驗收。

## 確切受審檔與逐字一致性

- 受審檔：`.qa/samaria-voice-script.json`，11,954 bytes。
- SHA-256：`ea3fb449f7310b3ad45edac3e0b55bddab240ce416e35bddf76dbeef261d56b5`。
- 從目前 `peopleByIsland.samaria` 和真實 `personForMode(person,'samaria','child')` 唯讀重算，核對每人id／name、8個key的順序及完整text；三人全部一致。
- 三份speech `text`均精確等於各自8段cue文字以兩個換行（`\n\n`）串接，沒有多漏段、標點／字詞差異或誤將其他角色內容接入。以下字數為Unicode字元數，含標點及拼接換行。

| 角色id | 逐一核對的key順序 | cue／speech字數 |
| --- | --- | --- |
| `samaria-well-resident` | `greeting` → `water` → `water-followup` → `witness` → `jar` → `child-greeting` → `child-observe-well` → `child-observe-well-followup` | 8／549 |
| `samaria-road-resident` | `greeting` → `questions` → `questions-followup` → `approach` → `slope` → `child-greeting` → `child-observe-road` → `child-observe-road-followup` | 8／557 |
| `samaria-care-resident` | `greeting` → `care` → `care-followup` → `entrust` → `promise` → `child-greeting` → `child-observe-inn` → `child-observe-inn-followup` | 8／586 |

## 新增親子9cue的內容核對

| 三段 | 核對結果 |
| --- | --- |
| 井旁：greeting／hint／followup | 描述水罐的口與內底，不把故事章名當器物形狀。hint的第三十九到四十二節是口語化節數，沒有變成人數或時間；followup明說現代前半剖面，再連到進城邀人及城人親耳聽見。不把剖示當摔罐、原古機構或考古原物 |
| 道路：greeting／hint／followup | 先看近遠與閱讀盤相同標記，再比較看見後的行動；旋轉、坡高和相對位置屬教具觀察。標記明示中性，不以族群安排善惡，不認證古地圖、三人原足跡或把耶利哥路搬到井旁；沒有暴力／救援搬運操作 |
| 旅店：greeting／hint／followup | 兩枚圓片與容器、布料可觀察，並分當日照顧、第二天交付和將來承諾。放大圓片不稱原得拿利；回來償還仍指向未來，沒有演成已回程、付款即康復或固定兩晚，末句仍回到怎樣成為鄰人 |

三題自訂`task.greeting`／`task.followup`均實際由`personForMode`採用，hint也逐字相符。本報告核對的是Samaria實際衍生結果，沒有把舊島fallback或全站回歸宣告為本輪已驗。

## 一般15cue及拼接語義核對

- 井旁保留旅途求水、活水、敬拜與彌賽亞；門徒回來在婦人放罐邀人之前，其間食物／收割對話與較後見證／親耳聽見／兩天沒有合成最初中午的一刻。未從時間推定排擠、婚姻原因或身分；一般追問的否定句沒有被剪掉或反轉為指控。
- 道路保留律法師第一問、耶穌反問、律法師回答、律法師再問與末段反問的關係；經文敘事與比喻有轉場。祭司／利未人的未給動機仍是未知，不補診斷、現代族群特徵或服色性格。
- 旅店保留接近／照顧、第二天兩銀幣、額外費用及回來的承諾，並讀到誰成為鄰人／去如此做。油酒只屬故事照顧，不變成今日醫療操作指示。
- 館舍說明已是鄂圖曼旅舍與拜占庭馬賽克等材料；沒有以博物館名稱確認比喻原店。罐剖示、坡盤、兩圓片均保留原創現代比較的層級，沒有新增未看館圖的形制認證或古物引文。文字為自撰摘要，未見大段重製CSBT或館方原文。

此結果只適用上述hash的字稿；若再改cue／拼接文字，須重新對照相應變更。未核聲音可用性、生成結果、發音／真人聽驗、逐字時碼、實際UI、井緣／坡路、模型、模式流程或部署；**非外部歷史專家簽核，也不表示第20島已發布或完成。**
