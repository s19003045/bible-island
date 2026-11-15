# 讀聖經順起來 · Bible Island

給兒童到成人的 3D 聖經主題群島。從建築、器物與古代生活背景，走回經文。

## 本版功能

- 24 座可選取的主題島、74 個有經文出處的探索點。
- 摩西會幕、所羅門聖殿、第二聖殿初期、希律擴建聖殿、出埃及、過約旦河、耶路撒冷、保羅旅程等程序化模型。
- 3D 旋轉、縮放、鳥瞰、鏡頭移動、標籤、主題關係線、白天／夜晚與環境動畫控制。
- 會幕與聖殿剖面、逐站導覽、經文外連及復原依據。
- 親子、一般與深入研讀模式；書卷、器物、主題搜尋；時代及舊新約篩選。
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

- `src/content.js`：主題、經文、閱讀深度、熱點、空間位置與關係的單一內容來源。
- `src/world.js`：Three.js 場景、程序化模型、InstancedMesh 批次、OrbitControls、射線點選、鏡頭與環境。
- `src/main.js`：DOM 介面、篩選、導覽、深連結、收藏與 WebGL 失敗回退。
- `src/progress.js`：本機進度與導覽步驟的純函式。
- `scripts/check-content.js`：內容完整性與關係連結驗證。
- `docs/PLAN.md`：內容、互動、階段規劃與已知限制。

技術為原生 JavaScript ES Modules、Three.js 0.180.0 與 Vite 6。模型是本專案自行製作，未複製參考網站的程式或美術素材。字型優先使用系統中文字型；3D 與介面不依賴外部 CDN。

## 內容原則

本網站為閱讀輔助教材，模型為微縮教學示意。經文描述、考古參考、示意復原與經文詮釋分別標示。新約時期的希律聖殿仍屬第二聖殿；出埃及年代與路線不強制指定為單一考證結論。網站文字為自行撰寫的摘要，完整經文透過外連閱讀。

閱讀足跡與收藏僅保存在目前瀏覽器，無登入、無跨裝置同步。無流量追蹤。經文連結由讀者自行開啟第三方網站。

## 發佈

附 `CI` 工作流程驗證內容、測試及建置。另附手動觸發的 GitHub Pages 部署流程；倉庫擁有者需先在 Settings → Pages 將來源設為 GitHub Actions，再執行該流程。未啟用 Pages 時，推送原始碼不等於網站已上線。

## 研究來源

- [St Andrews Encyclopaedia of Theology — The Temple in the Christian Bible](https://www.saet.ac.uk/Christianity/TheTempleintheChristianBible)
- [The Israel Museum — Collection Galleries / Jerusalem Model](https://www.imj.org.il/ar/node/104)
- [Bible Gateway — Exodus route](https://www.biblegateway.com/learn/topics-themes/commentaries/exodus-route-from-egypt/)
- 各探索點列示的聖經書卷與章節。
