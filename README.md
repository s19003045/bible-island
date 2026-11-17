# 讀聖經順起來 · Bible Island

給兒童到成人的3D聖經主題群島，從建築、器物與古代生活背景走回經文。

[正式Sites](https://bible-island.starryswift8.chatgpt.site)維持擁有者私人權限。24座詳細島、74探索點；最新發佈版本、來源、驗證及實際操作證據見[部署紀錄](docs/DEPLOYMENTS.md)。

## 功能

- 群山、流雲與連續水域環繞群島；橋與閱讀航線、關係卡、搜尋、篩選及跨島轉場表示閱讀關係，不冒充古代地圖。
- 24座島均有成人公尺尺度的詳細場景、鳥瞰／人物尺度／平面視角、可行走公共區、器物觀察、自主NPC與情境對話。章節與時刻按文本分開地方、先後和文類。
- 三種不同學習流程：一般閱讀逐幕回讀；親子先觀察、人物提示再作答；深入研讀先核對資料、辨別依據並記札記。各島各模式進度獨立，器物觀察不等於讀經完成。
- NPC採每個實例獨立種子與計時、加權POI、容量預約、分離避讓、平滑朝向及偶發短談；全島真人參考步態、腳趾支撐、視線與眨眼保留各時代衣裝。各島可比較新舊步態。
- 全島公共探索區提供快跑、跳躍、矮階跨越、坡度限制、地面吸附及視覺高度平滑；跳躍仍遵守實際碰撞及歷史場景的公共邊界。
- 132份本機GLB：原28種人物、3份耶路撒冷試點及28份全島升級人物、71件觀察物與2種羊。獨立骨架與動作、距離步態、斜坡足部IK及同衣裝近遠景分級；指定教具能拆層／還原。可編輯來源在assets/blender/，全島新人物各有獨立blend。
- 72位可交談角色、576個對應一般／親子cue、75份本機MP3；五首原創循環配樂、環境音、玩家與附近NPC腳步、跳躍／落地及器物音效，四類音量可分開調整。學習導讀可選瀏覽器中文朗讀，無語音時保留字幕。
- 經文外連統一YouVersion 312 CSBT；跨章跨卷各有入口。收藏、足跡與札記只存目前瀏覽器，無跨裝置同步或流量追蹤。支援鍵盤、窄螢幕、減少動態與WebGL失敗時文字閱讀。

最新四島見[比喻](docs/review/PARABLES-CHAPTERS.md)、[同席苦難與清晨](docs/review/PASSION-CHAPTERS.md)、[聚集日常與安提阿](docs/review/CHURCH-CHAPTERS.md)、[書信](docs/review/LETTERS-CHAPTERS.md)。逐島入口及範圍見[完整工作表](docs/BLENDER-AND-REMAINING-ISLANDS.md)。

本次完整交付、最後七項人工補驗與限制見[交付紀錄](docs/FINAL-DELIVERY.md)。

## 開發與驗證

需求Node.js18以上，建議22LTS。

```sh
npm ci
npm run dev
npm run check
npm test
npm run build
npm run preview
```

開發入口http://localhost:5173，建置輸出dist/。採原生JavaScript ES Modules、Three.js0.180.0與Vite6；相對資源路徑可供靜態主機使用，不依賴外部模型服務或CDN。`npm run review:bundle -- .qa/review.html`可產生自包含離線試閱；目前24島包在.qa/twenty-four-islands-review.html。

全來源回歸結果依版本記於[部署紀錄](docs/DEPLOYMENTS.md)；全島動作、聲音與移動的範圍及驗證方法見[全島延伸](docs/ALL-ISLAND-HUMAN-MOTION.md)。各島文件分開記錄程式驗證與實際瀏覽器操作，未完成項及觀察環境限制如實保留。

## 原則與架構

[實作原則與技術](docs/IMPLEMENTATION-PRINCIPLES.md)涵蓋證據分層、模式、NPC、移動與音訊。[Blender來源說明](assets/blender/README.md)與逐島素材交接列原創幾何、研究界線與驗證。

- src/content.js與各島content／exploration模組：主題、經文、關係、章節、時刻及公共路線。
- src/world.js、historical-scenes.js與各島scenes：Three.js、批次幾何、鏡頭、場景及詳細素材載入。
- src/main.js、learning-model.js與narrative-chapters.js：互動、三模式、進度、札記及深連結。
- npc-system.js、walk-controls.js與character-controller.js：自主行為、玩家路線及地面控制。
- scene-audio.js、voice-manifest.json與blender-manifest.js：本機媒體、cue及觀察控制。

模型與文字為本專案原創，未複製參考網站程式或美術。真人參考步態採CMU可修改及再散布的成人捕捉資料，兒童、承重、長者與長衣動作為作者改編，來源及授權存檔隨專案保留。經文描述、考古／文獻研究、現代復原和詮釋分層；不把模型當原物認證，不強指定出埃及年代、路線或未確認原址。人物仍有風格化選擇；獨立歷史專家簽核、完整真人聽驗與實體手機效能未宣稱完成。

## 發布

.openai/hosting.json保留Sites識別與dist靜態設定；.sites/是忽略的獨立發布檢出，憑證不存檔。Sites發布使用精確推送來源與相符建置封裝。CI驗證內容、測試及建置；另有手動GitHub Pages流程，須由倉庫設定啟用。推送原始碼不等於Pages已上線。
