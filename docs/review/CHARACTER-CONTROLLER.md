# 角色移動控制器：石階與接地

這輪升級耶路撒冷第一人稱控制器。`src/character-controller.js` 分開保存物理腳底 `position` 與視覺根節點 `visualPosition`；相機使用後者加上 1.65 m 視高，NPC 避讓、互動距離與導航則繼續使用物理位置。沒有新增第三人稱主角模型；已提供可供骨架動畫使用的狀態，現有第一人稱步頻也會依樓梯狀態調整。

## 設定

預設值集中在 `characterDefaults`，建立 walk model 時可覆寫：

| 參數 | 預設 | 行為 |
| --- | --- | --- |
| `maxStepHeight` | 0.35 m | 前方低階可自動抬升，過高的障礙保持阻擋 |
| `maxSlopeAngle` | 45° | 由地面法線判斷，不能用連續小步爬過陡坡 |
| `groundSnapDistance` | 0.45 m | 接地時下探並吸附下降地面；更大的落差停在邊緣 |
| `groundSnapSpeed` | 3 m/s | 下行接地的向下速度偏置 |
| `bodyHeight` / `skin` | 1.70 / 0.015 m | 抬升前檢查全身與頭頂空間 |
| `uphillSpeedFactor` | 0.8 | 上階／上坡時的水平速度倍率 |
| `visualSmoothTime` | 0.08 s | 上行視覺根節點的臨界阻尼時間 |
| `downSmoothTime` | 0.055 s | 下行較快收斂，避免視覺長時間懸浮 |

## 四項機制

1. **自動跨階**：水平移動拆成最長 0.08 m 的分段。接近低障礙時偵測可站立的頂面，檢查高度、上升路徑與頭頂空間，再抬升物理腳底並繼續前進；保留牆面滑動。超高台階、牆與低天花板不會被當作可跨越物件。
2. **坡度與吸附**：讀取地面法線並和向上方向比較。下降時只在安全探測範圍內直接約束到地面，維持 `isGrounded`，不先離地再等待重力落下。這是運動學控制器的 Ground Snap，不是剛體引擎的牛頓力；本輪沒有跳躍或大落差墜落操作。
3. **視覺／物理分離**：主街與新增入口石階有明確標記的坡面 collision proxy，畫面仍是逐級石材。其他障礙保留原有碰撞，沒有全場忽略樓梯附近的牆。代理記錄實際踢面高度，也受 `maxStepHeight` 限制。相機使用不超調的臨界阻尼 Y 平滑，停止移動或進入對話後仍會收斂。
4. **狀態與步頻**：提供 `isGrounded`、`groundNormal`、`slopeAngle`、`onStairs`、`isClimbingStairs`、`verticalDirection`、`groundSnapApplied` 及 `animation`（`idle` / `walk` / `stairs-up` / `stairs-down`）。上下階有短暫狀態遲滯，避免每個平踏面都反覆切換；上行速度為一般行走的 0.8 倍，下行保留一般速度。第一人稱沒有額外頭部晃動。

導航圖的連線亦使用實際移動檢查，避免 A* 規劃穿越過高階差或陡坡的路線。NPC 與玩家仍共享防重疊，並補上不同高度角色的社交判斷，避免隔著樓層交談。

## 可以實際試走的位置

入口主街左側（約 x=21、z=2–8.6）新增五級 0.24 m 石階與小平台，坡面約 25.6°。這是供步行與場景觀察的類型設計，沒有宣稱是已確認的古代遺址。主街仍連到原有任務路線，石階平台不取代住戶院落。

## 驗證

2026-11-15：37 項自動測試通過。新增覆蓋合法矮階、超高階、可覆寫高度限制、低天花板、30/44/46/60° 斜坡、代理踢面高度、下降持續接地、視覺高度無超調、30/60/144 FPS 平滑、上行 0.8 倍速度、對話時鏡頭收斂及實際石階完整上下路線；同時保留 50 NPC 的 120 秒碰撞與 POI 模擬。

瀏覽器以實際鍵盤操作確認上行 `stairs-up`、下行 `stairs-down`，兩者 `isGrounded=true`；下行 `groundSnapApplied=true`。坡面法線約 `(0, 0.9015, -0.4327)`，上行一次取樣的物理腳底 8.564 m、視覺腳底 8.513 m，下行取樣的物理腳底 8.669 m、視覺腳底 8.678 m。這些是一次實測取樣，不是所有設備的最大誤差保證。

概念參考：[Unity Step Offset](https://docs.unity.com/en-us/engine/6000.6/script-reference/unityengine/charactercontroller/stepoffset)、[Godot CharacterBody3D Ground Snap 與坡度設定](https://docs.godotengine.org/en/stable/classes/class_characterbody3d.html)。本專案使用自有 Three.js 運動學控制器，沒有引入 Unity 或 Godot 執行環境。

本輪僅本機試閱，尚未更新 Sites。
