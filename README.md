# 讀聖經順起來 · Bible Island

給兒童到成人的 3D 聖經主題群島。從建築、器物與古代生活背景，走回經文。

## 本版功能

- 24 座可選取的主題島、74 個有經文出處的探索點。
- 摩西會幕、所羅門聖殿、第二聖殿初期、希律擴建聖殿、出埃及、過約旦河、耶路撒冷、保羅旅程等程序化模型。
- 依五個時代組織的連續海域群島；橋、閱讀航線、五組路線、關係卡、比較與可取消跨島轉場，另有旋轉、縮放、鳥瞰及日夜控制。群山與流雲環繞中央水域；橋與航線表示閱讀關係。
- 會幕與聖殿剖面、逐站導覽、經文外連及復原依據。
- 十一座詳細島提供三種學習流程：親子觀察任務與人物提示、一般故事逐幕導覽、研讀資料對讀與跨場景比較。模式、各島各模式進度及研讀札記分別保存在目前瀏覽器。
- 其餘島嶼保留三種文字導讀，並標明完整互動流程的適用範圍；支援書卷、器物、主題搜尋與時代及舊新約篩選。
- 十一島三十三位角色的一般／研讀與親子對話皆有對應本機配音，共 264 段、36 份 MP3；學習導讀另用選按的瀏覽器中文朗讀，無可用聲音時仍可閱讀。
- 十一座詳細島皆可在指定區域第一人稱步行，沿路尋找自主 NPC、交談及觀察器物；提供地面吸附、矮階跨越、空間音效與獨立音樂控制。出埃及以製磚、預備出發、渡海三個獨立章節探索；渡海隊伍單向前進。保羅以帕弗、腓立比、以弗所分別選取三次旅程的代表片段，附各次行程摘要及赴羅馬另讀入口。亞伯拉罕以築壇、帳棚接待與井水協議分章探索，七隻母羊羔另放作挖井見證。約瑟以被帶離家鄉、儲糧與饑荒、相認及返鄉安排分章，不指定法老或王朝。西奈依嗎哪、供水與山前預備分章，不混同出 17 與民 20，也不指認現代山址。各島入口及驗證見 [五島套用計畫](docs/FOCUS-ISLAND-ROLLOUT.md)。
- localStorage 收藏與閱讀足跡；支援手機版、鍵盤、減少動態效果與 WebGL 失敗時的文字閱讀。

## 開發

需求：Node.js 18 或以上；建議 Node.js 22 LTS。

```sh
npm ci
npm run dev
```

瀏覽 http://localhost:5173 。

```sh
npm run check
npm test
npm run build
npm run preview
```

建置產物位於 `dist/`，可放在一般靜態網站主機。Vite 使用相對資源路徑，支援 GitHub Pages 的專案子目錄。

## 架構

完整的產品原則、歷史復原規範、技術架構、NPC／移動／音訊機制、三種學習流程、功能適用範圍與驗收方式，見 [實作原則與技術總整理](docs/IMPLEMENTATION-PRINCIPLES.md)。

- `src/content.js`：主題、經文、閱讀深度、熱點、空間位置與關係的單一內容來源。
- `src/world.js`：Three.js 場景、程序化模型、InstancedMesh 批次、OrbitControls、射線點選、鏡頭與環境。
- `src/main.js`：DOM 介面、篩選、導覽、深連結、收藏與 WebGL 失敗回退。
- `src/progress.js`：本機進度與導覽步驟的純函式。
- `scripts/check-content.js`：內容完整性與關係連結驗證。
- `docs/PLAN.md`：內容、互動、階段規劃與已知限制。

技術為原生 JavaScript ES Modules、Three.js 0.180.0 與 Vite 6。模型是本專案自行製作，未複製參考網站的程式或美術素材。字型優先使用系統中文字型；3D 與介面不依賴外部 CDN。

## 內容原則

本網站為閱讀輔助教材；群島全景是閱讀關係示意，十一座詳細場景使用公尺尺度的程序模型與 Blender 素材。經文描述、考古參考、示意復原與經文詮釋分別標示。新約時期的希律聖殿仍屬第二聖殿；出埃及年代與路線不強制指定為單一考證結論。網站文字為自行撰寫的摘要，完整經文透過外連閱讀。

閱讀足跡與收藏僅保存在目前瀏覽器，無登入、無跨裝置同步。無流量追蹤。經文連結由讀者自行開啟第三方網站。

## 發佈

Sites 網址：[讀聖經順起來](https://bible-island.starryswift8.chatgpt.site)。維持擁有者私人權限。第十一座詳細島「西奈與曠野」已於 2026-11-16 部署；後續發布與來源證據見 [Sites 部署紀錄](docs/DEPLOYMENTS.md)。

Sites 專案識別與靜態產物設定保存在 `.openai/hosting.json`；`.sites/` 是本機發佈用的獨立來源倉庫，不提交至 GitHub。

附 `CI` 工作流程驗證內容、測試及建置。另附手動觸發的 GitHub Pages 部署流程；倉庫擁有者需先在 Settings → Pages 將來源設為 GitHub Actions，再執行該流程。未啟用 Pages 時，推送原始碼不等於網站已上線。

## 研究來源

- 經文連結統一採用 [YouVersion CSBT 中文標準譯本](https://www.bible.com/zh-TW/versions/312)。跨章、跨書卷參照提供各段的獨立連結；主題入口可展開「選擇章節」。
- [St Andrews Encyclopaedia of Theology — The Temple in the Christian Bible](https://www.saet.ac.uk/Christianity/TheTempleintheChristianBible)
- [The Israel Museum — Collection Galleries / Jerusalem Model](https://www.imj.org.il/ar/node/104)
- [Bible Gateway — Exodus route](https://www.biblegateway.com/learn/topics-themes/commentaries/exodus-route-from-egypt/)
- 各探索點列示的聖經書卷與章節。

## 詳細歷史場景試閱

會幕、所羅門聖殿、新約聖殿、出埃及、耶路撒冷、過約旦河、歸回後第二聖殿、保羅旅程、亞伯拉罕、約瑟與西奈提供公尺尺度的詳細場景與三種視角。其餘十三主題保留原版。約旦河另有分層河谷、單向隊伍、兩岸居民、三件 Blender 教具及三位情境對話角色，見 [約旦河驗收](docs/review/JORDAN-WALK.md)。復原依據、取捨與驗證記錄見 [試閱說明](docs/review/HISTORICAL-FIVE.md)。

執行 `npm run review:bundle` 可產生不依賴本機伺服器的單檔互動試閱版；預設輸出為 `.qa/five-islands-review.html`。

後續 Blender 人物／器物替換及原十九座島的完整工作清單見 [後續實作範圍](docs/BLENDER-AND-REMAINING-ISLANDS.md)。

五島十四項觀察物已有 Blender 近景，後續約旦河、歸回第二聖殿、保羅旅程、亞伯拉罕與約瑟也已接入。西奈另以每日需要、供水與山前聆聽分章，三件教具及曠野人物均接入。全站目前有二十八種人物、三十二件觀察物及一種羊，共六十一份 GLB；三十一件實體展品在場景共用，渡海剖面供近景比較。人物使用獨立骨架、距離步態與斜坡足部 IK，每場景最多八位近處細節人物，遠景沿用較輕模型；保留個別 POI、自主行為、對話及配音。器物可以旋轉，指定構造可拆合，近景重用渲染資源。服裝、面容、動物類型與身高仍有復原選擇及風格化特徵。其餘十三島繼續；可編輯來源及限制見 [Blender 素材說明](assets/blender/README.md)，最新操作與發佈證據見 [西奈驗收](docs/review/SINAI-WILDERNESS.md)。
