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
