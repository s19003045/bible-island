# 人體動作 rollout：最終素材審查

已獨立檢查 **28 個模型的來源與輸出身分**，並實際檢視 **11 種代表人物、91 張 Blender 評估蒙皮渲染**。最終取樣姿勢未見先前的袖口露膚方塊、短衫膝蓋穿出方塊或長袍小腿穿出。

完整 SHA、實際幀路徑、取樣相位、模型逐項結果及範圍：[review-final.json](review-final.json)。

## 實際審查範圍

| 模型 | 實際畫面 | GLB SHA-256（前 12 碼；完整值見 JSON） |
|---|---|---|
| `resident-child` | 9 張：正／側面 Walk 0、0.25、0.5、0.75；中性臉部近照 | `89b3f654fabe` |
| `resident-carrier` | 9 張：正／側面 Walk 0、0.25、0.5、0.75；中性臉部近照 | `7b61cbc30d30` |
| `roman-woman` | 9 張：正／側面 Walk 0、0.25、0.5、0.75；中性臉部近照 | `a96706a07a52` |
| `priest-bearer` | 11 張：正／側面 Walk 0、0.25、0.5、0.75；中性臉部近照；正／側面 Idle 0 | `d7f4bbb8342f` |
| `brick-laborer` | 9 張：正／側面 Walk 0、0.25、0.5、0.75；中性臉部近照 | `745136ad0615` |
| `return-elder` | 9 張：正／側面 Walk 0、0.25、0.5、0.75；中性臉部近照 | `c13e75a147b8` |
| `wilderness-child` | 9 張：正／側面 Walk 0、0.25、0.5、0.75；中性臉部近照 | `786279abc420` |
| `asian-artisan` | 9 張：正／側面 Walk 0、0.25、0.5、0.75；中性臉部近照 | `65bad523b733` |
| `egypt-householder` | 9 張：正／側面 Walk 0、0.25、0.5、0.75；中性臉部近照 | `bbabaf496e52` |
| `port-worker` | 4 張：正／側面 Walk 0、0.5 | `3e4ce6e0ba5e` |
| `bronze-artisan` | 4 張：正／側面 Walk 0、0.5 | `6870c9142ef6` |

所有畫面以 Blender **4.5.16**、Cycles 20 samples、AgX、原始材質渲染，使用實際評估後的蒙皮網格，沒有只畫骨架替代人物。審查程式不儲存來源、不重新匯出 GLB。

## 已發現並修正的問題

- 側面取樣發現袖子上有皮膚方塊；同角度比較原 V2 後確認是舊網格問題。under-sleeve 輔助變形讓布下皮膚留在袖內，原衣服幾何與顏色不變。
- 正面取樣發現新步態使膝蓋穿過短衫形成方塊；下擺的 hips→thigh 權重轉移已修正，保留完整步幅。兒童、提水者、短裙裸足工人均以最終輸出重新渲染確認。
- Asian artisan 的初版衣層稽核把圍裙與前短衫兩個朝前面當成前後包覆，錯誤縮短步幅。稽核已要求前後朝外法線；最終重新建置恢復 stride factor 0.92、每循環 1.3142862231633672 m，無重試縮步。
- 提水者的右手／水罐、祭司的原右肩握持與垂下左臂在取樣中維持原綁定；沒有新增不實左手握持。祭司 Walk 僅作解剖動作檢視，場景中的站立／行走仍由歷史階段決定。

## 保留的可審查畫面

只將五張 contact sheet 複製到來源倉庫，其餘原始單張與稽核保留在 ignored `.qa/human-rollout/`。

- [兒童](review/child.png)
- [提水者](review/carrier.png)
- [羅馬時期長袍人物](review/roman-long-robe.png)
- [祭司搬運者：Walk 與 Idle](review/priest-bearer.png)
- [裸足工人](review/barefoot-worker.png)

## 獨立來源檢查

全 28 款逐項通過：GLB／可編輯來源 SHA 與 metadata 相符、GLB 位元組數、單一角色身分、base model ID、CMU 來源與動作類型、九個動畫名稱、可編輯骨骼清單及其身分／捕捉來源。另比對原 V2 GLB 與共用來源 SHA，原始資產未變。全程檢查來源檔在審查前後相同。

對照建置報告：`assets/blender/human-rollout/build-report.json`，SHA-256 `7e912fc64a2186652b6d90a7060dd40fb024e45a16bca2c9e7966c944cefc7e2`。足底／循環／握持／衣層的數值稽核由建置器產生；本審查另做來源身分驗證與實際畫面檢視。

## 結論的適用範圍

- 原始教學人物仍具有簡化的手腳、頭髮與衣服幾何；這次是動作與關節升級，並非寫實人物替換或布料物理模擬。
- 四個步態相位與靜態圖不能代替完整循環的真人感評估；地形 IK、起停轉身銜接、眨眼／注視、碰撞及場景效能需在 runtime 另外驗收。
- 眼睛／眼皮檢視為中性姿勢，沒有在素材圖中假稱已驗證 runtime 眨眼。兒童、提水者與長者是成人 CMU 資料的角色化改編，不是相應年齡或負重者的真人捕捉。
- `port-worker` 與 `bronze-artisan` 的有效封閉衣層點數為 0；已額外檢視正／側面相位 0、0.5，不能因此宣稱它們獲得全循環數值衣層覆蓋。

## 重現

```sh
/tmp/bible-blender-runtime/blender-4.5.16-linux-x64/blender --background --threads 2 \
  --python scripts/blender/human-motion-review.py -- --models all \
  --check-only --out .qa/human-rollout/provenance-final

/tmp/bible-blender-runtime/blender-4.5.16-linux-x64/blender --background --threads 2 \
  --python scripts/blender/human-motion-review.py -- \
  --models resident-child,resident-carrier,brick-laborer \
  --out .qa/human-rollout/review-final
```
