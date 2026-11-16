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

## 2026-11-16：歸回與重建，第七座詳細島

- 本機來源：`3ae2a2e727d24118f048046f3ba84ec226366f32`，208 個追蹤來源與 Sites checkout 逐檔相符。
- Sites source commit：`c972cdc796b624e75957d9bbe912595edd2e021c`。
- Saved version：`appgprj_6af95ea0dac4819182957156725483aa~appgver_bb0c7f226d188191bb4685cef9bf24ab`。
- Deployment：`appgdep_6afab3d15e548191bab941d79c36db34`。
- 平台結果：`succeeded`，`2026-11-16T07:42:28.719991+00:00`。
- 正式網址：[歸回後的第二聖殿](https://bible-island.starryswift8.chatgpt.site/#island=second-temple&chapter=foundation)，維持既有擁有者私人權限。發佈前已核對沒有新增群組或外部訪客。
- 奠基、復工、守節三章各有獨立場景、角色、觀察物與學習步驟；每章 13 位自主人物，新增四種 Blender 人物、三件教具及 24 段錄音。全站共 39 份 GLB、24 份 MP3、21 位可交談角色與 168 段 cue。
- 完整 147 項回歸通過，內容／語法與正式建置成功，離線試閱 74,628 KiB。Blender 全量匯出正常結束，來源重開確認 39 個非空場景、19 份獨立骨架、每套五條動作；最終 GLB 幾何與來源雜湊另經四項檢查。正式產物 `index-Cp4Tvlkg.js`。本機三章走訪、拆合、旋轉、觀察紀錄保存、模式與語音切換證據見 [建殿驗收](review/RETURN-TEMPLE.md)。
- 這是第七座詳細島。完整真人聽驗、獨立歷史審稿、實體手機驗收、先前希律近景／渡海剖面的手動補驗與其他十七島仍接續，Goal 保持進行中。
- 正式頁重新載入後已由 DOM 核對 `index-Cp4Tvlkg.js`。復工章只出現該章石匠，提問後顯示第四章穿插不同王朝的說明及 `EZR.4.6-24.CSBT`／`EZR.5.1-5.CSBT`；切至完工章會撤銷舊對話、替換守節家長及第三幕，場景全景按鈕恢復選取。console warning／error 為空，正式畫面 `.qa/return-dedication-sites.png` 已檢視。正式頁保持一般閱讀、全景、名稱顯示與自主動畫；本機保持研讀與安靜探索設定。完整三件近景手動走訪是在本機完成，沒有宣稱正式頁再次全走一遍。

## 2026-11-16：保羅旅程三城，第八座詳細島

- 本機來源：`060d94519233c686e0373edcb47c95ac597c36fc`，226 個追蹤來源與 Sites checkout 逐檔相符。
- Sites source commit：`18ee380fbbdf4ab1c6ed1d2f5b89be52f091fbc7`。
- Saved version：`appgprj_6af95ea0dac4819182957156725483aa~appgver_58eebcc1951c8191951cdd31a490473f`。
- Deployment：`appgdep_6afabce6b5dc8191a06be25166b29df6`。
- 平台結果：`succeeded`，`2026-11-16T08:21:13.712967+00:00`。
- 正式網址：[保羅宣教之旅](https://bible-island.starryswift8.chatgpt.site/#island=paul&chapter=ship)。保留既有擁有者私人權限，發佈前核對沒有新增群組或外部訪客。
- 三次旅程各取帕弗、腓立比、以弗所代表片段，各有自己的場景、人物、觀察物、地面及聲音位置。新增三種獨立人物、三件 Blender 器物及 24 段錄音；全站 45 份 GLB、27 份 MP3、24 位可交談角色、192 段 cue。
- 最終完整 155 項回歸通過，保羅專測 8／8；包含真正角色控制器、240 秒 NPC 避讓／容量／持續換點、碼頭地面、GLB 結構與抵達後互動視線。內容／語法、正式建置與 86,827 KiB 離線試閱通過。Blender 來源重開確認 45 個非空場景、22 份獨立骨架，各五條動作；六件新素材已渲染檢視，圍裙穿透修正後另重看。
- 正式入口產物為 `index-Dk03-vdG.js`。本機已檢視港城全景、行程與研讀入口，並以安靜模式開始步行；三件近景完整 UI 走訪／拆合仍待補驗，沒有把自動路線／射線測試寫成手動完成。詳細取捨與限制見 [保羅旅程驗收](review/PAUL-JOURNEYS.md)。
- 其餘十六島、先前未完手動補驗、完整真人聽驗、獨立歷史審稿及實體手機驗收仍接續，Goal 保持進行中。
- 正式頁已重新載入並從 DOM 核對 `index-Dk03-vdG.js`。工藝角色回答將長老告別放在米利都，顯示 `ACT.19.8-10.CSBT`／`ACT.20.16-38.CSBT`，console warning／error 為空。實際新圍裙人物畫面 `.qa/paul-artisan-sites.png` 已檢視；回答全文由可存取樹核對，截圖沒有宣稱全部同框。由交談切腓立比後，場景、布商與第二幕同步更新，全景選取恢復；行程摘要可展開，另有赴羅馬獨立入口。`.qa/paul-philippi-sites.png` 記錄第一版河道，視覺檢視發現直線岸邊後另作修正。

保羅同批河岸／遠景修正已另行發佈：

- 本機來源：`e3934fc02e3a3bba105170889a6d1e4d76055ca5`，226 個追蹤來源逐檔相符。
- Sites source commit：`554ae67850b0be219dc3d759dc7d7a3bb0f8077c`。
- Saved version：`appgprj_6af95ea0dac4819182957156725483aa~appgver_b2bb5acbe9148191a8ec6e4e95a632c7`。
- Deployment：`appgdep_6afac03ef8cc8191b53d6ae126457b92`。
- 平台結果：`succeeded`，`2026-11-16T08:35:24.450642+00:00`。
- 地面／水面邊緣延伸至霧外；腓立比以曲流水面、挖除粗地形河槽、較密的銜接河岸與分枝樹葉取代第一版直岸與橢球樹冠。另用垂直射線確認遠景粗地形不會橋接到河流上方，避免初次視覺修正產生黑色遮擋。
- 先前完整 155 項回歸通過；視覺修正後，保羅與全詳細場景專測 10／10、內容／語法、正式建置及 86,828 KiB 離線試閱通過。本機 `.qa/paul-philippi-river-final-local.png` 已檢視。最終正式入口產物 `index-CvQi4r4E.js`。
- 第一版正式頁的親子模式已確認第二題與三個未解鎖選項，未誤記為已完成；一般閱讀偏好已恢復。完整近景手動走訪／拆合與真人審聽仍接續。
- 最終正式頁重新載入後已核對 `index-CvQi4r4E.js`，console warning／error 為空；`.qa/paul-philippi-final-sites.png` 已實際檢視，河道遠景無前述黑色遮擋。正式頁保持一般閱讀／全景、自主動畫及名稱顯示；本機保持研讀／全景與安靜偏好。兩頁皆未留在自動行走或交談中。

## 2026-11-16：亞伯拉罕三章，第九座詳細島

- 本機來源：`c55e8c80ff416ae26c38f2ba0df0b2f9d0ed1b2a`，246 個追蹤來源與 Sites checkout 逐檔相符。
- Sites source commit：`cb1cfab41a75cca3fcdffffa42a651950d5450bd`。
- Saved version：`appgprj_6af95ea0dac4819182957156725483aa~appgver_6f0522c1e4d881918f5540a004f79917`。
- Deployment：`appgdep_6afac8d58c0c819193c678fdbae0d135`。
- 平台結果：`succeeded`，`2026-11-16T09:12:08.472654+00:00`。
- 正式網址：[亞伯拉罕的旅程](https://bible-island.starryswift8.chatgpt.site/#island=abraham&chapter=altar)。保留既有擁有者私人權限，發佈前核對只允許 owner、無群組及外部訪客。
- 三章按創 12、18、21 排序，保留原 stop ID；各有不同人物、觀察物、地面及空間聲音。每章 13 位自主人物；新增三種獨立 Blender 人物、三件器物、一種羊及 24 段配音。全站 52 份 GLB、30 份 MP3、27 位可交談角色與 216 段 cue。
- 完整回歸 163／163；後續地表、帳棚與山徑／岩群修正的場景／聲音專測 13／13，研讀旁註的內容／模式專測 18／18；內容、語法、正式建置及 99,820 KiB 離線試閱正常。來源重開確認 52 個非空 Blender 場景、25 份獨立骨架及五條動作，七份新素材逐張渲染檢視；旅人手布穿插另修正。正式入口 `index-D-4PlCti.js`。
- 本機全景、研讀題、單一對話入口及 CSBT 已檢視，安靜探索已實際啟動；三件器物完整 UI 走訪及正式頁結果接續記錄於 [亞伯拉罕驗收](review/ABRAHAM-JOURNEY.md)。其餘十五島、尚未完成的 UI 補驗、完整真人聽驗、獨立歷史審稿及實體手機驗收繼續，Goal 保持進行。

- 正式頁已核對 `index-D-4PlCti.js`，接待角色問答與 `GEN.18.1-8.CSBT` 正確，切井水章會結束舊對話並同步第三幕、牧群照顧者與全景。親子第三題未解鎖狀態及一般模式恢復均已看到，console warning／error 為空。畫面 `.qa/abraham-host-sites.png`、`.qa/abraham-well-sites.png` 已檢視。保羅三件近景的正式 UI 走訪、旋轉、商船拆還與各章 1／1 紀錄已全數補驗，見保羅文件；亞伯拉罕三件器物的本機完整走訪、旋轉、石壇／井圈拆還及各章 1／1 紀錄也已通過。正式站恢復一般閱讀與全景、自主動畫，本機恢復研讀與全景，兩頁未停在交談或自動行走中。


## 2026-11-16：約瑟與埃及三章，第十座詳細島

- 本機來源：`053e389fd815ff6e9cc69f8ee044bcb9a9c48a57`，265 個追蹤來源與 Sites checkout 逐檔相符。
- Sites source commit：`4116ac57031aa131cabff539126e69ec6150d339`。
- Saved version：`appgprj_6af95ea0dac4819182957156725483aa~appgver_e2b9b6bc1ec88191a8cd893df32aac79`。
- Deployment：`appgdep_6afad4b6cc308191afa971300623bc43`。
- 平台結果：`succeeded`，`2026-11-16T10:02:51.591082+00:00`。
- 正式網址：[約瑟與埃及](https://bible-island.starryswift8.chatgpt.site/#island=joseph&chapter=caravan)。沿用擁有者私人權限，無新增群組或外部訪客。
- 三章按創 37、41、45 章排序，保留原 stop ID；山路、倉院及相認後返鄉準備為不同處境。每章 13 位自主人物；新增三種獨立 Blender 人物、三件功能比較教具和 24 段配音。全站 58 份 GLB、33 份 MP3、30 位可交談角色／240 段 cue。
- 完整回歸 171／171；內容／語法、正式建置及 112,585 KiB 離線試閱通過。Blender 來源重開確認 58 個非空場景、28 套獨立骨架各五種動作，六件新素材已逐張渲染檢視。家屋小陶罐的整組碰撞修正後重新完整回歸通過。
- 正式入口 `index-DuXkRh5Z.js`，world `world-CWr5IoQz.js`、vessels `vessels-BfrbSRw8.js`。Three.js 仍有大於 500 kB 的建置提示，沒有宣稱實體手機 FPS 已驗收。
- 本機完整走訪與正式頁的瀏覽器結果另記 [約瑟驗收](review/JOSEPH-EGYPT.md)。其他十四島、未完成的 UI 補驗、完整真人聽驗、獨立歷史審稿及實體手機驗收繼續，Goal 保持進行。


### 約瑟貨包可視性修正

- 本機來源：`cf1eae60fc2333d56a57627d2548703864864370`，266 個追蹤檔逐檔相符。
- Sites source：`ea0e73987020a9f5835b59f46f16873194c82a44`；saved version：`appgprj_6af95ea0dac4819182957156725483aa~appgver_70d0d5e357308191b01db97d55be7973`。
- Deployment：`appgdep_6afad6423f2c8191a17ca69470a39917`，`succeeded`，`2026-11-16T10:09:19.956651+00:00`。
- 覆布改為旁移 .68 m、抬 .18 m，讓內部容器可見。約瑟／近景專測 12／12、內容／語法與離線封裝通過，入口 `index-B5ISoDSq.js`。正式 DOM 已核對此入口；倉院對話、售糧追問及 `GEN.41.46-57.CSBT` 正確，配音已播放並回到可重播，console warning／error 為空，未宣稱完整聽驗。
- 正式頁在暫停狀態切換近處人物時發現舊簡化模型未被替換，另修正共用暫停視角的細節更新；修正後完整回歸 172／172，保留零時間步進、獨立時鐘與無移動。


### 共用暫停視角的 Blender 人物細節

- 本機來源：`d4676e28246bf33db644293875064d46620334d2`，266 個追蹤來源逐檔相符。
- Sites source：`1df3eb91f25eca8f14f22a465afd0d5431624ce8`；saved version：`appgprj_6af95ea0dac4819182957156725483aa~appgver_01fc165d4988819197fe953bc465782f`。
- Deployment：`appgdep_6afad88d4a5c819185dfa9961a918408`，`succeeded`，`2026-11-16T10:19:06.554097+00:00`。
- 完整 172／172、內容／語法、正式建置及 112,585 KiB 離線試閱通過。入口 `index-RLjtQavZ.js`，world `world-BXgbalmM.js`、vessels `vessels-DLgfJJ1Y.js`。
- 本機在暫停狀態靠近工作解說者，已顯示真實 Blender 腰裹布、五官及裸足；`.qa/joseph-grain-paused-detail-local.png` 已檢視。正式 DOM 已核對新入口；後續手動結果另記約瑟文件。維持原私人權限，不重新生成音訊或改動其逐字時間碼。
- 正式暫停近景也已確認 Blender 人物；切第三章會結束舊對話，親子第三題維持未解鎖且進度 0／3。正式站恢復一般閱讀／家屋全景與自主動畫，console warning／error 為空；本機三件器物走訪及旋轉均已完成，糧倉另有拆還驗證，各章觀察 1／1，未誤算讀經。詳見約瑟驗收文件中的截圖及覆布修正驗證界線。


## 2026-11-16：西奈與曠野三章，第十一座詳細島

- 本機來源：`58524ae67eef4be72ef2f710c8c7f34f4a1ff2c5`，281 個追蹤檔與 Sites checkout 逐檔相符。
- Sites source commit：`e67dd40e649843876823bc2b0a87f70494d1f709`。
- Saved version：`appgprj_6af95ea0dac4819182957156725483aa~appgver_7cbf43e9f29481918c1bcdb4fb51ded4`。
- Deployment：`appgdep_6afae1b7070c8191a7bf070cf8e26e7e`。
- 平台結果：`succeeded`，`2026-11-16T10:58:14.104673+00:00`。
- 正式網址：[西奈與曠野](https://bible-island.starryswift8.chatgpt.site/#island=sinai&chapter=manna)。發布前核對 owner 權限、只允許原 owner、無群組或外部訪客；沿用原私人權限。
- 出 16、17、19–20 依序分為嗎哪／供水／山前，保留原 stop ID。每章 13 位 POI 居民，明確映射既有曠野 Blender 衣裝；新增三件 Blender 教具及 24 段配音。全站 61 份 GLB、36 份 MP3、33 位可交談角色／264 段 cue，其餘十三島繼續。
- 初版完整回歸 180／180；實際畫面發現裁峰，鏡頭與原創山體比例修正後的西奈／場景專測 11／11 通過。內容／語法、正式建置及最終 121,598 KiB 離線試閱通過。來源重開 61 個非空場景、28 套獨立骨架及五條動作，三件新教具實際渲染檢視。
- 入口 `index-D4wECbtx.js`，world `world-Ci5nfjg1.js`、vessels `vessels-C8OJbmuE.js`、three `three-Zxw-5wWh.js`。Three.js 的大於 500 kB 建置提示仍在，沒有宣稱真實手機 FPS 已驗收。
- 本機第三章、研讀題、唯一家人角色及 CSBT 已確認，校正後 `.qa/sinai-mountain-wide-local.png` 已實際檢視，營地與完整山峰同框；安靜路線走訪中。正式入口與手動近景結果接續 [西奈驗收](review/SINAI-WILDERNESS.md)，不能由發布成功推定已完成全部 UI 驗收。完整 Goal、獨立歷史審稿、真人聽驗及裝置驗收持續。

### 西奈追問的完整對讀連結

- 本機來源 `f20ec86`，283 個追蹤檔逐檔同步；Sites source `5ac2b3fa7415d2de45e91d1b50270be16117d2a5`。
- Saved version `appgprj_6af95ea0dac4819182957156725483aa~appgver_02faf47953048191be721c9d04d094e2`；deployment `appgdep_6afae433a8988191893fb457c7e812e1`，於 `2026-11-16T11:08:49.318284+00:00` 回傳 succeeded。
- 供水追問補民 20、石版追問補出 24／31，不改台詞及音檔。新增實際對話 HTML 回歸；西奈／場景專測 12／12、內容／語法、正式建置及 121,598 KiB 離線封裝通過。
- 正式 DOM 核對 `index-wCzpYEXY.js`，world `world-DKckMyY5.js`、vessels `vessels-BwYOQ63K.js`。兩組追問的多個 CSBT 連結皆已實際確認，console warning／error 為空，正式頁恢復一般閱讀／山前全景及自主動畫；`.qa/sinai-mountain-final-sites.png` 已檢視。本機山前拆還及每日份額旋轉走訪完成，供水近景接續。
- 供水 GLB 的本機走訪／旋轉／返回也已完成，三件器物各章觀察 1／1，研讀仍 0／3；山前另完成抬升圖層與還原。最新 `.qa/sinai-water-inspection-local.png` 已檢視。正式站維持一般閱讀／山前全景，本機維持深入研讀／供水全景與安靜偏好；兩頁動畫正常、未留在對話／近景／自動行走，console warning／error 皆為空。其他十三島及完整人工補驗仍在 Goal 範圍。

## 2026-11-16：士師與路得三章，第十二座詳細島

- 本機來源 `0fd2bf34240845efc987deb40f6a89b732b9574b`，297個追蹤檔與Sites checkout逐檔相符。
- Sites source `c5285585c4a6a23ec726bdc0a0bab6c930774bcb`。
- Saved version `appgprj_6af95ea0dac4819182957156725483aa~appgver_33bffdc69c44819199c72ae2d51086df`。
- Deployment `appgdep_6afaeb222d108191b125fae0b275452e`，平台於 `2026-11-16T11:38:30.244929+00:00` 回傳 `succeeded`。
- 正式網址：[士師與路得](https://bible-island.starryswift8.chatgpt.site/#island=judges&chapter=field)。發布前確認owner、原單一使用者、無群組或外部訪客，沿用原私人權限。
- 拾穗／夜與黎明／城門三章，每章13位POI居民，三位可交談角色與24段精確配音，新增三件Blender教具。全站64份GLB、39份MP3、36位角色與288段cue；其他十二島繼續。
- 完整回歸191／191，內容／語法與正式建置、129,882KiB離線試閱通過。Blender正式來源重開64非空場景、28套骨架各五種動作；新教具實際渲染／幾何／拆還已驗證。本機三件器物完整走訪、旋轉與兩件拆還完成，各章觀察1／1且不誤算讀經。
- 正式入口 `index-B8yNSFqx.js` 已經由DOM核對，world `world-B6HKSx60.js`、vessels `vessels-BBvNAIOM.js`、three `three-CKWGyh1c.js`。Three.js大於500kB的建置提示仍在，沒有宣稱實體手機FPS已驗收。
- 正式對話／模式／配音及全景結果見 [路得驗收](review/RUTH-VILLAGE.md)。獨立歷史專家審稿、完整真人聽驗與實體裝置驗收及其他十二島仍保留在完整Goal範圍。
- 正式田邊Blender人物、追問與一般／親子配音已實際確認播放狀態，三章切換正確清除舊對話；六簸箕與親屬問題的多段CSBT連結已核對。親子第三題仍未解鎖、0／3。正式恢復一般閱讀／第一章全景及自主動畫，console warning／error為空；`.qa/ruth-field-final-sites.png` 已檢視，本機保留研讀全景。詳見路得驗收的完整界線。


## 2026-11-16：撒母耳與大衛三章及約櫃四時刻

- 本機來源：`dc7438ce956f74bed999d0978219453bef18e8aa`，與 Sites 來源逐檔位元組比對，共317個追蹤檔案。
- Sites source commit：`4c2d6a84234c42c1be6d8668a1955f2593c65795`。
- Saved version：`appgprj_6af95ea0dac4819182957156725483aa~appgver_8a7bc47e6af88191b852a9c4fd94b005`。
- Deployment：`appgdep_6afaf42affa481918adfd539847ef88e`。
- 平台結果：`succeeded`，`2026-11-16T12:16:59.682948+00:00`。
- 201／201測試、內容／語法檢查、正式建置及單檔試閱通過。91模組建置1.68s，入口 `index-Cmwk0w92.js`；Three主chunk仍有既有500kB提示。
- 第十三座依牧地、王城、遷移與安放分章；約櫃另有四個互斥時刻，URL、場景、近景與音訊同步。三位角色24段配音、三件新Blender教具與獨立POI動態羊群接入。正式來源68個非空場景、28人類骨架及另1羊骨架，詳見 [大衛驗收](review/DAVID-CHAPTERS.md)。
- 原擁有者私人分享範圍保留，沒有新建Site或擴大受眾。發布後瀏覽器結果接續追加；尚餘十一座詳細島與人工補驗，總Goal保持進行中。


時間卡面板修正發布：本機 `a7c5cfcb2038fa940e6f90ca530cbb07484cdd72`；317追蹤檔逐檔相符。Sites source `76f1ac6db80e667d71dd5dc856711857545ec39b`，version `appgprj_6af95ea0dac4819182957156725483aa~appgver_d3b2521026a08191876212385b8efc41`，deployment `appgdep_6afaf610408481918b570f639fcd3237`，`succeeded`／`2026-11-16T12:25:10.378677+00:00`。入口 `index-Ddu7aViy.js`、world `world-BnJCm2-8.js`、vessels `vessels-DmBl57LE.js`、CSS `index-Gu4b_RX2.css`；來源與封裝核對，正式UI實際出現「時刻脈絡與經文」收合入口。完整201測試再通過，正式帳篷近景與1／1觀察、解說者語音播放已實際確認，讀經仍0／3。


對話入口修正發布：本機 `1ecacf820dc2d4332104c01bb9b2acea159446ea`；317追蹤檔與Sites來源逐檔相符。Sites source `846da20e804f28c7fc188543aadabd2a94110186`，version `appgprj_6af95ea0dac4819182957156725483aa~appgver_c00438ceddf88191af951c9409ca18f0`，deployment `appgdep_6afaf98841e48191a6afac96f7abdd8e`，平台於 `2026-11-16T12:39:55.794332+00:00` 回傳 `succeeded`。入口 `index-tOeuEgUH.js`、world `world-Ci28UESq.js`、vessels `vessels-jTuxxaAr.js`，CSS維持 `index-Gu4b_RX2.css`。完整201測試再次通過，最新單檔試閱139,887KiB；建置1.53s／91模組。其後下一島研究與未註冊草稿、發布後紀錄各自提交，發布來源仍以上述精確版本為準。

- 最終正式頁已重新載入核對交談期間探索入口收起，牧地豎琴問答／CSBT及`語音播放中`實際確認；`.qa/david-final-dialogue-sites.png`已檢視。console warning／error為空，恢復一般閱讀／牧地全景、動畫開啟，未留對話／近景／自動行走。三件器物走訪全部完成，其餘三個約櫃時刻近景與人工審驗仍按大衛驗收保留。


## 2026-11-16：分裂王國與先知，第十四座詳細島

- 本機來源：`d4e9e2b2f4e1bab2e4523ed3db6dde1656d1bc21`；333個追蹤檔與Sites checkout逐檔SHA256相符。
- Sites source：`caf65e30086e0a33b9646f3be9d979fd923b8bc7`。
- Saved version：27，`appgprj_6af95ea0dac4819182957156725483aa~appgver_8e570686de74819195c0aac3688ccc65`。
- Deployment：`appgdep_6afafee6bb1c8191a1cc43aa65fe7a68`，平台回傳 `succeeded`，`2026-11-16T13:02:51.220931+00:00`。
- 網址：[Bible Island](https://bible-island.starryswift8.chatgpt.site/#island=kingdoms&chapter=south)。既有owner／custom單一使用者、0群組、0外部訪客範圍保留。
- 來源helper完成推送／同版建置及封裝；95模組1.36s，入口 `index-D56y0ZZ0.js`、world `world-MUtr3RUO.js`、vessels `vessels-CyB2BwUE.js`、three `three-CLGziNgE.js`，CSS `index-Gu4b_RX2.css`。平台驗證來源SHA相同，archive124files／112,291,840bytes，content SHA256 `6201d058bbfe2a202334948fec5f88207b8e46b38c3b5ced89134f82242b26a9`。保留封裝 `/tmp/bible-island-d4e9e2b-kingdoms-sites.tar.gz`。
- 210／210全站回歸、24主題74點內容／語法與正式建置通過，離線單檔148,154KiB。新增三件Blender教具、三位角色與24cue配音，全站71GLB／45MP3／42可交談角色／336cue。詳細來源與界線見 [分裂王國驗收](review/KINGDOMS-CHAPTERS.md)。
- 本機三章均從出生點沿路走到各教具並完成近景、旋轉、拆合及還原，各章觀察1／1，研讀維持0／3；摩5核心／摩8延伸顯隱已實際檢視。正式頁已重新載入並顯示第14島：一般對話追問連摩5:21–24、語音播放中、親子專屬提示配音、研讀資料查閱前後判讀按鈕啟用均確認。正式步行近景與恢復頁面結果接續追加。
- 原Goal持續，尚餘十島；獨立歷史專家簽核、完整真人專名聽驗、實體手機性能及既有人工補驗未宣稱通過。


第14島發布後補驗：正式第三章已實際沿路步行到教具，摩5核心／摩8延伸顯隱、容量層抬升／還原及旋轉均完成，觀察1／1而研讀仍0／3；證據 `.qa/kingdoms-measures-inspection-sites.png`。正式頁最後一般閱讀／示劍全景，本機研讀／城門全景，兩頁動畫正常、無對話／近景／導航，console warning／error皆[]。後續文件及下一島研究不改本次部署的d4e9e2b來源。


## 2026-11-16：被擄與盼望，第十五座詳細島

- 本機來源 `153d765c690964e98d95ebbeed38a2687921b9fd`；349個追蹤檔與Sites checkout逐檔SHA256相同。
- Sites source `80c5de1d56049b9e3f71ff17677836cfebd74b30`。
- Saved version 28：`appgprj_6af95ea0dac4819182957156725483aa~appgver_c3ec0b3598b0819195f4c48254bd5885`。
- Deployment `appgdep_6afb0957bdec8191a87654461a17ba7c`，平台回傳 `succeeded`／`2026-11-16T13:47:20.588346+00:00`。
- 網址：[被擄與盼望](https://bible-island.starryswift8.chatgpt.site/#island=exile&chapter=road)。原owner／custom單一使用者、0群組、0外部訪客範圍保留。
- 來源helper推送後同版建置99模組／1.39s；入口 `index-D4me7EUS.js`、world `world-BN6r8owt.js`、vessels `vessels-B5Yxv7FI.js`、three `three-DCP9OO0t.js`、CSS `index-zmRD_4cI.css`。平台版本回讀source SHA相同；archive內容130files／118,292,480bytes，content SHA256 `d298661bcc60f86f8189de63cca9c7bb9ac7ac35aca7eacb565f42afa328be28`。保留壓縮封裝 `/tmp/bible-island-153d765-exile-sites.tar.gz`，77,969,090bytes，封裝檔SHA256 `9fe1a88ab572129645089a0deb3de6e3f1e35e8197e74bb8a72f2391fffcc26e`。
- 221／221全站回歸、24主題74點內容／語法、正式建置及155,964KiB單檔離線試閱通過。全站74GLB／48MP3／45可交談角色／360cue。三章不同文本處境、各13位POI居民、三件Blender教具及24cue配音見 [被擄驗收](review/EXILE-CHAPTERS.md)。
- 本機三件教具已完整沿路走訪、旋轉、拆層與還原，各章觀察1／1，研讀仍0／3，console warning／error=[]。正式一般問答追問詩137:1–6及語音播放中、親子專用提示與情境配音、研讀資料查閱前後判讀選項停用／啟用均已核對。正式水岸走訪與最終頁面狀態另追加。
- 其餘九島、獨立歷史專家簽核、完整真人專名聽驗與實體手機性能及既有人工補驗仍在原Goal範圍。


第15島發布後追加：正式水岸教具已實際沿路走訪，旋轉、移近岸、還原及雙CSBT入口均確認；觀察1／1而研讀仍0／3。`.qa/exile-waterbank-split-sites.png`已實際檢視。正式恢復一般閱讀／第一章／場景全景及自主動畫，console warning／error=[]；最終 `.qa/exile-road-final-sites.png`。本機維持研讀／住居全景及安靜偏好。後續文件與第16島未註冊草稿不改本次153d765／80c5de1來源。


## 2026-11-16：尼希米第十六座詳細島（第29版）

- 原始來源commit：`820ccfb1471e2a351584017dfe1f272e5e03c9ae`；Sites來源commit：`63b34d6dff8b69ff185500c95c6cc3f506e5f000`。365個Git追蹤來源檔逐一SHA256相等；發佈checkout原有node_modules依賴連結另保留。
- 同一Sites專案`appgprj_6af95ea0dac4819182957156725483aa`。已確認owner及custom僅擁有者，0群組／0外部訪客；沒有改分享。
- 第29版ID：`appgprj_6af95ea0dac4819182957156725483aa~appgver_6f1cadce0f188191b8d1a87d06983781`。部署`appgdep_6afb15be13a4819185c386458e4e0ab5`於`2026-11-16T14:40:21.448548+00:00`回傳succeeded。正式入口：[尼希米](https://bible-island.starryswift8.chatgpt.site/#island=nehemiah&chapter=wall&phase=survey)。終態成功未重複poll或部署。
- 封裝`/tmp/bible-island-820ccfb-nehemiah-sites.tar.gz`，82,636,080bytes，gzip SHA256=`5d83f82923a23a9b093c23618815535fd4cf77fa0514b1d93f679d19c3cebb4d`；平台內容136檔／124,620,800bytes，內容SHA256=`d31a2055f851621904c0ed4c0c2b8deeb3f0225dcc82e7476f985ca8a861d76d`。
- 231／231全站回歸、內容／語法、103模組建置及164,202KiB離線試閱通過；Sites checkout同源建置1.29s。入口`index-DAMnOVn8.js`、world`world-C002OkLG.js`、vessels`vessels-Czi51pVc.js`、three`three-BKWy6DnJ.js`、CSS`index-zmRD_4cI.css`。既有500kB級chunk提示保留。
- 三章八時刻、三件正式Blender教具、三位居民與24cue已整合。正式來源SHA256=`231ff1835fee8227aacab21463df20bf06d098da1e08f1092bf482ca5c6abdb5`；77非空場景／77GLB、28人類×5動作、另羊×3動作驗證。詳細史料、幾何及操作另記 [尼希米驗收](review/NEHEMIAH-CHAPTERS.md)。正式頁三模式、配音與近景走訪接續追加，不以發布成功視為全部人工驗收。

- 發布後人工追加：正式DOM已核對第29版入口；一般／親子對話播放、研讀資料前置及0／3隔離均實際操作，三件本機器物走訪／旋轉／拆還完成。正式最後恢復一般／wall survey全景、動畫開，兩個分頁保留且console warning／error=[]。正式三件器物沿路補驗及完整真人聽驗仍另列，沒有因發布成功或本機操作而宣稱完成。正式對話截圖僅拍到左側人物，面板與播放由可存取樹核對；具體證據及擷取限制見尼希米驗收。


## 2026-11-16：新約背景，第十七座詳細島（第30版）

- 原始來源 `7291e937f8d6aa5d3c78b2a7d3f698052b449d46`；Sites來源 `4760e855de59ce1de924775f74477912ade92ea7`。382個追蹤檔逐一SHA256相等；原有node_modules依賴連結保留。
- 同一專案 `appgprj_6af95ea0dac4819182957156725483aa`，owner／custom單一使用者、0群組／0外部訪客不變。第30版 `appgprj_6af95ea0dac4819182957156725483aa~appgver_00ae1c2b3cb88191b22fcef73164a7e2`；部署 `appgdep_6afb2305edd88191953a94d6af2bb612` 於 `2026-11-16T15:36:53.285710+00:00` 回傳succeeded，未再poll或重複發布。
- 正式入口：[新約背景](https://bible-island.starryswift8.chatgpt.site/#island=intertestament&chapter=road)。原分頁同站hash導覽仍保留第29版程式，因此已另明確reload取得新資源；新頁實際內容／模式與配音驗證接續記錄，不以URL已改當新程式載入證據。
- 107模組同源建置1.41s；入口 `index-DTfdaisw.js`、world `world-BP3SF6Kk.js`、vessels `vessels-zRv2o-_-.js`、three `three-C-ggzojZ.js`、CSS `index-zmRD_4cI.css`。既有500kB級chunk提示保留。241／241全站回歸、24主題74點內容／語法、171,577KiB離線試閱通過。
- 壓縮封裝 `/tmp/bible-island-7291e93-intertestament-sites.tar.gz`，87,206,116bytes，SHA256=`24d6cae7f47b998c8042f9839a18226475c64684fc5e1c8cef0a5996242a7220`。平台回讀142內容檔／130,283,520bytes，內容hash=`9beba1088a7190178cdcadca824d4568f998691296dbbd00d5f2f1f2c54993bc`，來源SHA與helper相符。首次helper因沙箱DNS失敗，保留已提交來源後，只以允許網路的同一helper接續推送／封裝，未重建或另建Site。
- 三章、每章13位POI居民、三件正式Blender教具及24cue配音完成；全站80GLB／54MP3／51位角色／408cue。來源與研究、幾何、配音及手動界線見 [新約背景驗收](review/INTERTESTAMENT-BACKGROUND.md)。本機道路走訪、旋轉、抬層／還原及1／1觀察完成；其他新教具與正式三模式補驗接續追加。其餘七島及人工補驗仍在總Goal。
- 2026-11-17補驗完成：三件本機及三件正式頁均從出生點沿路開啟／旋轉；道路與說話對象板各抬層／還原，銀幣查看兩面與斜側厚緣。正式三模式、錄音播放及進度前置已實際操作，最後恢復一般／road／場景全景、動畫開；兩頁warning／error=[]。正式右側截圖裁切與道路擷取失敗照實記錄，詳見驗收。第18島新檔仍未註冊，不屬第30版來源；本次沒有為內部文件和未完成草稿另建版本。


## 2026-11-17：降生與成長，第十八座詳細島（第31版）

- 原始來源 `4e7acd20c0870d4e7dee187e68d2f6279c23e253`；Sites來源 `9dee6ead940d5ff8c48abcbf1b508188b65916a4`。401個追蹤檔逐一SHA256相等，原有node_modules依賴連結保留；同源建置112模組／1.43s，入口`index-DZeVQOH-.js`、world`world-D7E4i6pb.js`、vessels`vessels-DhxplKll.js`、three`three-DWw92ymX.js`、CSS`index-zmRD_4cI.css`。
- 同一專案 `appgprj_6af95ea0dac4819182957156725483aa`；本輪已確認owner／custom單一使用者、0群組／0外部訪客，分享未改。第31版ID `appgprj_6af95ea0dac4819182957156725483aa~appgver_2fca8f9a4f9481919c0aba2dfa065e3d`。部署 `appgdep_6afb32804c508191a22acbc31338dea3` 於`2026-11-16T16:42:55.662449+00:00`返回succeeded；停止poll，沒有重複部署。平台回讀source SHA一致。
- 正式入口：[降生與成長](https://bible-island.starryswift8.chatgpt.site/#island=nativity&chapter=manger&phase=birth)。封裝`/tmp/bible-island-4e7acd2-nativity-sites.tar.gz`，91,613,617bytes，SHA256=`da4597e59174f44d6173a6df80126adf887b303b8b224bb88fad3f9903a386b9`；平台148內容檔／135,229,440bytes，內容hash=`4433a80f296e1472904e270fec7b365f15f4330de2dcf02da248843d8c505046`。憑證在準備發布時已過期，僅刷新同站短期憑證，未重新開站或變更權限。
- 251／251全站回歸、24主題74點內容／語法、建置及178,013KiB離線試閱通過。三章七閱讀窗口、各13位POI居民、牧地獨立羊群、三件正式Blender教具及24cue配音見 [降生與成長驗收](review/NATIVITY-CHAPTERS.md)。全站83GLB／57MP3／54角色／432cue；剩餘6島仍在總Goal範圍。
- 本機已核對三模式前置／0／3隔離、親子提示與一般問答錄音播放、沿路抵達並開啟木接合近景。旋轉拆層操作遇瀏覽器CDP逾時，未算人工通過。正式新程式載入與模式、配音、三教具沿路走訪接續補驗；發布成功不替代這些手動結果。

- 第31版人工追加：正式reload已核對`index-DZeVQOH-.js`；三模式前置／進度隔離、親子與一般配音播放、field／visit夜色、空槽沿路抵達／旋轉及1／1紀錄完成。本機三件教具均沿路、旋轉，家屋與接合拆還完成。正式家屋與接合兩件仍待沿路補驗；完整真人聽驗等限制保留。兩頁最後回一般／manger birth／全景、動畫開、安靜，warning／error=[]。正式近景截圖失敗及2133／1244右側裁切記在驗收；未重啟dev server或重發網站。
