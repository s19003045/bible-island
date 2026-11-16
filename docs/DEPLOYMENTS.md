# Sites 部署紀錄

專案：`appgprj_6af95ea0dac4819182957156725483aa`。
正式網址：[Bible Island](https://bible-island.starryswift8.chatgpt.site)。保留既有擁有者私人權限，沒有擴大分享。

## 2026-11-16：五島整合基準

- 本機來源：`c68a767`，與 Sites 來源逐檔比對，共 106 個追蹤檔案。
- Sites source commit：`b767256d6aeb746c1aa0556ce046f0dfca61f070`。
- Saved version：`appgprj_6af95ea0dac4819182957156725483aa~appgver_c5a6c91d10648191b1beeff5f96b0232`。
- Deployment：`appgdep_6afa4ae927148191ad659f5848e4b47f`。
- 平台結果：`succeeded`，`2026-11-16T00:14:48.617425+00:00`。
- 透過 Sites 官方 source workflow 建置、推送及封裝，再以 owner-private 發佈工具部署。套件站安裝連線逾時後，核對 lockfile 相同，重用已驗證的 Three.js 0.180.0／Vite 6.4.6／esbuild 0.25.12 本機相依；未更換版本。
- 正式頁已開啟，顯示新閱讀路線介面；畫面保存在本機忽略產物 `.qa/sites-baseline-published.png`。

此紀錄採發佈後追加；已部署的舊來源不因紀錄追加而被回寫。後續群山、Blender 素材及其餘島嶼各自驗證與發布，不以本次成功推定全部已完成。

## 2026-11-16：環山湖盆與移動白雲

- 本機來源：`2329571`，與 Sites 來源逐檔比對，共 111 個追蹤檔案。
- Sites source commit：`03304151e9f0aeea352e8b85361db57e250350be`。
- Saved version：`appgprj_6af95ea0dac4819182957156725483aa~appgver_d4f479a840f08191978ac92493972b0f`。
- Deployment：`appgdep_6afa510dfe0c8191a8ca4661651eb3e9`。
- 平台結果：`succeeded`，`2026-11-16T00:40:59.296150+00:00`。
- 96 項測試、內容檢查、正式建置與試閱封裝通過。正式頁可見環山湖盆、林木、流雲與收合閱讀路線卡，瀏覽器無 console error；截圖 `.qa/mountains-sites-published.png`。
- 保留既有私人分享範圍。此版本尚未包含 Blender 素材或其餘十九座詳細島嶼。

## 2026-11-16：Blender 首批素材整合

- 本機來源：`86e59b5`，與 Sites 來源逐檔比對，共 122 個追蹤檔案。
- Sites source commit：`9975a908656daf558baf028da148de60555a2ff7`。
- Saved version：`appgprj_6af95ea0dac4819182957156725483aa~appgver_46427bdd94588191867da16f91720b5b`。
- Deployment：`appgdep_6afa579eef8c8191a138f39714c216ea`。
- 平台結果：`succeeded`，`2026-11-16T01:08:59.530607+00:00`。
- 已通過 100 項回歸、內容／語法檢查、正式建置與單檔試閱；封裝包含三份本機 GLB。本機畫面已確認耶路撒冷住戶與兩件器皿，見 [首批驗收](review/BLENDER-FIRST-PASS.md)。
- 正式頁已重新載入核對新腳本與 Blender 住戶造型，對話仍可使用，console error／warning 為空；截圖 `.qa/blender-sites-published.png`。
- 沿用既有擁有者私人權限。這是管線與初步替換：其他職分、年代、器具及十九座詳細島嶼仍持續進行。

## 2026-11-16：會幕 Blender 器具與拆合近景

- 本機來源：`a9a78de`，與 Sites 來源逐檔比對，共 129 個追蹤檔案。
- Sites source commit：`72d7bba4852e3695965e26899d6ccd06c6b387c0`。
- Saved version：`appgprj_6af95ea0dac4819182957156725483aa~appgver_10fa17f588e88191bc5a3aba125ec21e`。
- Deployment：`appgdep_6afa6057af7481918b01e9049ebb0f17`。
- 平台結果：`succeeded`，`2026-11-16T01:46:14.927123+00:00`。
- 104 項測試、內容／語法、正式建置與離線封裝通過；三件會幕觀察物及近景共用 GLB。板座拆合、方向鍵、手機尺寸與史料界線說明已在本機操作，見 [會幕器具驗收](review/BLENDER-TABERNACLE.md)。
- 正式頁已取得新 `index-CU7PYsbh.js`，由探索點清單檢視新洗濯盆本體，console error／warning 為空；截圖 `.qa/tabernacle-basin-sites.png`。
- 保留既有擁有者私人權限。此版已有五件 Blender 觀察物；其他九件、人物細化與十九座詳細島嶼仍待接續。

## 2026-11-16：所羅門 Blender 器具與近景資源重用

- 本機來源：`d02245f`，與 Sites 來源逐檔比對，共 137 個追蹤檔案。
- Sites source commit：`7c8ecad5dd53f91a0026332a8b720c5ac1783330`。
- Saved version：`appgprj_6af95ea0dac4819182957156725483aa~appgver_c590b3aa92088191ace9432d0c364ef7`。
- Deployment：`appgdep_6afa6aab8994819183c74a236d966213`。
- 平台結果：`succeeded`，`2026-11-16T02:30:22.173894+00:00`。
- 111 項測試、內容／語法、正式建置與離線封裝通過；所羅門三件觀察物以及場景銅海／兩座大柱頂共用 GLB。近景拆合、背景暫停／恢復及重開時 renderer 重用均已在本機實際操作，見 [所羅門器具驗收](review/BLENDER-SOLOMON.md)。
- 正式頁已重新載入，DOM 取得新 `index-D4VKyUMe.js`；選擇銅海探索點後，可見新盆體、牛座及後方兩座柱頂，導讀與 CSBT 連結仍可操作，console error／warning 為空。截圖 `.qa/solomon-sea-sites.png`，拍攝後已恢復名稱顯示。
- 保留既有擁有者私人權限。此版已有八件 Blender 觀察物；希律／出埃及六件、人物細化與十九座詳細島嶼仍待接續。

## 2026-11-16：希律 Blender 教具

- 本機來源：`9aa33e4`，與 Sites 來源逐檔比對，共 143 個追蹤檔案。
- Sites source commit：`952144957e681d44657b29ecb29f41e429bb9b52`。
- Saved version：`appgprj_6af95ea0dac4819182957156725483aa~appgver_0233041dc35081919c198a0171937f03`。
- Deployment：`appgdep_6afa6fd12ab08191a363edefe32acc33`。
- 平台結果：`succeeded`，`2026-11-16T02:52:14.240187+00:00`。
- 115 項測試、內容／語法、正式建置與離線封裝通過。希律三件觀察物接入場景／近景；石塊接縫與院界低欄可拆合，內院限制保持有效，見 [希律器具驗收](review/BLENDER-HEROD.md)。
- 正式頁重新載入取得 `index-BdJHuZeQ.js`；石作角色對話與語音入口可用，console error／warning 為空，截圖 `.qa/herod-sites-published.png`。本機工作桌可見新雙石塊加工面，截圖 `.qa/herod-stone-local.png`。本輪未完成三件近景的全程手動走訪，不將對話截圖當成該項驗收；兩個分頁已恢復場景全景與人物動畫。
- 保留既有擁有者私人權限。此版已有十一件 Blender 觀察物；出埃及三件、人物細化與十九座詳細島嶼仍待接續。

## 2026-11-16：出埃及 Blender 器具與渡海剖面

- 本機來源：`d7143d3`，與 Sites 來源逐檔比對，共 149 個追蹤檔案。
- Sites source commit：`e1ec95eb3f4cc92726a2764fecb0a5b571eefa33`。
- Saved version：`appgprj_6af95ea0dac4819182957156725483aa~appgver_1cfff23c3e9c819187c93eb029eaa221`。
- Deployment：`appgdep_6afa76a646788191a8fd943ca392ceb7`。
- 平台結果：`succeeded`，`2026-11-16T03:21:23.766950+00:00`。
- 119 項測試、內容／語法、正式建置與離線封裝通過。五島十四項觀察物都有 Blender 近景，其中十三項同時在場景使用；渡海剖面不取代大場景水體與動態隊伍，見 [出埃及器具驗收](review/BLENDER-EXODUS.md)。
- 正式頁曾重新載入並取得 `index-DneE-ZEX.js`；後續以同批可視性修正版本接續檢查。
- 保留既有擁有者私人權限。NPC 細化／年代職分變體、十九座詳細島嶼與尚未完成的手動驗收仍持續。

同批布包可視性修正已另行發佈：

- 本機來源：`88f09e7`，149 個追蹤來源逐檔相符。
- Sites source commit：`b12179b322930b0886322e1a3539dd8313b8a8c7`。
- Saved version：`appgprj_6af95ea0dac4819182957156725483aa~appgver_d36c05c763248191beb0f8891435e5cf`。
- Deployment：`appgdep_6afa788a33ac8191bf5a80c3835b536d`。
- 平台結果：`succeeded`，`2026-11-16T03:29:26.099429+00:00`。
- 修正布包移開距離與初始視角，新增預設相機到碗內底的實際幾何視線檢查；完整 119 項回歸、內容、建置與離線試閱再次通過。正式頁已重新載入並取得 `index-DEfqkT4J.js`。
- 正式頁的製磚場導讀、章節及 CSBT 入口可用，console error／warning 為空。畫面 `.qa/exodus-sites-published.png`；新教具在該視角被房屋遮擋，不以此截圖宣稱正式頁三件近景皆已逐一驗收。暫時收起的標籤已恢復，閱讀模式及人物動畫偏好保持原值。

## 2026-11-16：成人細化、步態與上下坡接地

- 本機來源：`99a1acb`，154 個追蹤來源逐檔相符。
- Sites source commit：`1f01468f7bc95440656fae0793c5f1ad5d447884`。
- Saved version：`appgprj_6af95ea0dac4819182957156725483aa~appgver_2e8764e72f1081918b3eb4da03e786e6`。
- Deployment：`appgdep_6afa83f89c008191902acf8b617fd547`。
- 平台結果：`succeeded`，`2026-11-16T04:18:15.914048+00:00`。
- 一般成人及工藝成人接入耶路撒冷、希律場景。改善臉孔、衣袖、手腳、皮底，步態依實際距離前進，足部 IK 貼合碰撞地面；保留原有 POI／獨立決策、避讓與偶發交談。
- 完整 123 項回歸、內容、語法、正式建置、離線試閱與 Blender 來源重新開啟通過，詳見 [成人驗收](review/BLENDER-RESIDENT-REFINEMENT.md)。正式產物為 `index-9UVA9uk5.js`。
- 正式頁重新載入並核對該腳本，可見新石作成人；選擇問題後，回答與 `MRK.13.1-2.CSBT` 連結更新，console error／warning 為空，截圖 `.qa/resident-herod-refined-sites.png`。檢查後本機／正式頁恢復全景與自主活動，閱讀偏好不變。
- 保留既有擁有者私人權限。婦女／孩童、持物、舊約人物、十九座詳細島嶼及先前未完成的手動驗收仍持續。

## 2026-11-16：孩童比例與持壺居民

- 本機來源：`0ab2a4b`，160 個追蹤來源逐檔相符。
- Sites source commit：`80957767b62429f10b70707b1cab33855fa74fa2`。
- Saved version：`appgprj_6af95ea0dac4819182957156725483aa~appgver_eab7f76da72c8191ad4a12bfe8ee2fe3`。
- Deployment：`appgdep_6afa8b83cc088191bbdedcb49a2eb6ca`。
- 平台結果：`succeeded`，`2026-11-16T04:50:25.880405+00:00`。
- 耶路撒冷原有四位孩童使用獨立臉部／身形與短步幅；提水居民使用彎肘、彎指與空心陶壺，五種動畫維持握持。原有對話／錄音與 CSBT 不變。
- 完整 128 項回歸、內容／語法、建置、39,867 KiB 離線試閱與十八場景／四骨架的 Blender 來源開啟檢查通過。開發伺服器另修正啟動後新增 GLB 未登錄的問題，以真正 Vite、檔案與 HTTP 回歸檢查。見 [孩童與持物驗收](review/BLENDER-CHILD-AND-CARRIER.md)。
- 正式產物為 `index-DYrjaM5a.js`，四種人物加十四件觀察物，共十八份 GLB，另有十八份 MP3。
- 正式頁重新載入核對該腳本後，可見新提水人物、側壺與握把；地勢提問的回答及 `JHN.18.1.CSBT`／`LUK.19.29-37.CSBT` 入口正常，console error／warning 為空，截圖 `.qa/carrier-jerusalem-sites.png`。兩個檢視分頁已恢復全景與自主活動，閱讀偏好不變。
- 保留既有擁有者私人權限。婦女服裝、舊約年代／職分、十九座詳細島嶼及尚未完成的手動驗收仍持續。

## 2026-11-16：五島年代與職分人物整合

- 本機來源：`69fec85ac8b641f01af891315ca6749e11e5e584`，175 個追蹤來源逐檔相符。
- Sites source commit：`e0f3c742f7b6c9accb476bc1aa67a4db7e7d25de`。
- Saved version：`appgprj_6af95ea0dac4819182957156725483aa~appgver_7f413cabee78819186dafa1a3160194c`。
- Deployment：`appgdep_6afa977e89ec8191af268aeafd9d7495`。
- 平台結果：`succeeded`，`2026-11-16T05:41:36.740197+00:00`。
- 新增十種婦女／曠野／祭司／第一聖殿／歌者／工匠／製磚人物，五座詳細島近處人物皆選相應 GLB。保留十五位人物台詞、十八份 MP3 與 120 段提示。所羅門增加三處院邊 POI，避免較寬人物使停留點飽和；導覽回歸沿用正式入口的安全落點。
- 完整 133 項回歸、內容／語法、正式建置與 56,371 KiB 離線試閱通過。最終 Blender 來源重開確認二十八個非空場景、十四份獨立骨架、每套五條動作；長袖彎肘裂縫修正後重新匯出及檢視。見 [人物驗收](review/BLENDER-PERIOD-CHARACTERS.md)。
- 正式產物為 `index-D06M0F0n.js`，共二十八份 GLB 及十八份 MP3。正式頁重新載入後由 DOM 核對該入口；可見新版祭司的布冠、連續長袖、腰帶及赤足，洗濯問題顯示對應回答與 `EXO.30.17-21.CSBT`，且經文可用鍵盤到達。console error／warning 為空，截圖 `.qa/period-priest-sites.png` 主要記錄人物與對話介面，完整回答／連結另由可存取樹核對，未宣稱全部同框。本機與正式頁已恢復場景全景及自主動畫，閱讀模式分別保持研讀／一般。
- 保留既有擁有者私人權限；十九座詳細島與先前未完成的手動驗收持續進行。

## 2026-11-16：約旦河第六座詳細島

- 本機來源：`6421781e6bdf20205d2858d7fc9dd6922134e7af`，189 個追蹤來源逐檔相符。
- Sites source commit：`bd921dc099f956611291f0232f8cbdde1e23beb3`。
- Saved version：`appgprj_6af95ea0dac4819182957156725483aa~appgver_5386ddb6b8808191bd4f277d96d0e3aa`。
- Deployment：`appgdep_6afaa35e2174819198656e36ae214800`。
- 平台結果：`succeeded`，`2026-11-16T06:32:16.165771+00:00`。
- 正式網址：[過約旦河](https://bible-island.starryswift8.chatgpt.site/#island=jordan)，維持擁有者私人權限。發佈前已重新確認只有擁有者、沒有群組或外部訪客；沒有擴大分享。
- 河谷、兩岸居民與單向隊伍接入第六座詳細島，新增三件 Blender 教具及持槓祭司。37 位自主居民／隊伍另有四位站立持槓祭司，三位可交談角色各有一般／親子對話，新增三份 MP3／24 段 cue。全站共 32 份 GLB、21 份 MP3、18 位可交談角色與 144 段錄音。
- 完整 140 項回歸通過；最終相對地面鏡頭與地表色差調整後，約旦河專測 7／7 通過。內容／語法、正式建置、62,936 KiB 離線試閱與 Blender 來源重開檢查通過。見 [約旦河驗收](review/JORDAN-WALK.md)。
- 正式產物 `index-C6kbM7TB.js` 已由頁面 DOM 核對；祭司問答顯示二千肘及距離壓縮說明，連到 `JOS.3.1-4.CSBT`；新祭司布冠、長衣、腰帶與赤足可見，console warning／error 為空。截圖 `.qa/jordan-priest-sites.png` 記人物與對話介面，完整回答及連結另由可存取樹核對，未宣稱全部同框。正式全景 `.qa/jordan-overview-sites.png`；本機恢復研讀，正式頁保持一般閱讀，兩頁全景／人物自主動畫與名稱顯示已恢復。
- 本機已實際走到覆布及河床剖面並旋轉近景，觀察紀錄 2／3；自動行走由東岸進入河中區。預覽執行較慢，西岸十二石完整手動走訪／近景仍待補驗。親子提示成功播放及結束只證明播放管線，完整真人聽驗仍待完成。獨立歷史審稿、實體手機驗收、既有希律近景／渡海剖面手動補驗，以及其他十八座詳細島嶼繼續進行；沒有將整個 Goal 標為完成。
