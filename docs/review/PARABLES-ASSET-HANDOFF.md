# 第21島三件正式 Blender 素材交接

2026-11-17。Root 已親看修正版隔離三張總覽共25視角並接受。這份交接記錄本次正式素材整合；正式圖片仍交 root 親看，應用註冊與發布由 root 另行處理，不宣稱第21島已完成。

唯一一次正式 builder 已成功輸出92份 GLB；正式來源92個非空素材場景、28套人物骨架各5動作（140）與羊骨架3動作保持。沒有新增人物或動物骨架。

- 正式來源：[/home/garywu/dev/bible-island/assets/blender/bible-assets.blend](/home/garywu/dev/bible-island/assets/blender/bible-assets.blend)，SHA256 `79c97e95db6c4d5cda2cede7e49c48a14266210df4ea1fd615bd4acfb57af292`。
- [可重跑新腳本](/home/garywu/dev/bible-island/scripts/blender/parables-props.py)；只在新 exec 周圍設定 `PARABLES_OFFICIAL_BUILD=True`，finally 移除；正式三件 `prototype_only=false`，預設隔離仍 true。
- [完整交接 JSON](/home/garywu/dev/bible-island/.qa/parables-official/handoff.json)、[正式來源＋fresh GLB 幾何](/home/garywu/dev/bible-island/.qa/parables-official/geometry.json)、[25圖來源鏈](/home/garywu/dev/bible-island/.qa/parables-official/preview-provenance.json)、[三總覽來源鏈](/home/garywu/dev/bible-island/.qa/parables-official/contact-provenance.json)。
- 舊89基線備份 `/tmp/parables-before-official/`；[逐 accessor 重匯差異](/home/garywu/dev/bible-island/.qa/parables-official/existing-glb-rebuild-diff.json)、[最終89份原 bytes 保留](/home/garywu/dev/bible-island/.qa/parables-official/existing-glb-final-preservation.json)。

| 素材 | 長 × 寬 × 高（m） | 三角形 | bytes | 正式 GLB SHA256 |
| --- | --- | ---: | ---: | --- |
| `parables-soil` | 1.150 × 0.750 × 0.29955 | 12,084 | 290,832 | `9bce0b9276b26d2e084fe1fe48eb89a3a8974094c97c25757b8f8b0ae6e1be30` |
| `parables-flock` | 1.150 × 0.750 × 0.09000 | 19,236 | 476,996 | `6af67a00ec980763903a142e12041925e080c58342a3f5d43f0ceded7846152e` |
| `parables-light` | 1.150 × 0.800 × 0.62000 | 13,644 | 336,860 | `935c2cd9505b82cf1b2cf301d5e56091594e34a7e7b9255e7bfc455411df1d3a` |

三件底高均0。每件低於30,000三角形／1.6MB，source→GLB bbox最大誤差均0。所有實體材質體閉合、連通分件正體積、法線一致；植物每件底足對自己的土面作實際三角面正面積接觸檢查。接觸使用評估網格實際 loop triangles、相反法線的同平面裁切與射線，AABB只篩候選。

`parables-soil-modern-shallow-layer` 是唯一操作層：薄土與兩苗所有後代 glTF Y +0.14m，固定件0、全頂點移動／還原和20段路徑採樣通過。薄土20mm、岩層102mm與深土130mm是現代選定尺寸；根線只在剖面頂點色表達現代示意，不計作實體根／古代量測。植物是原創簡化穀作／荊棘示意，未認證品種。

`parables-flock` 靜態精確99＋獨立1：100枚相同42mm直徑、25mm高籌，11×9排法為現代閱讀法，沒有把一枚移回99。逐連通分件與真底面承托檢驗，全4,950對實際凸投影足跡最小淨距約14mm；不是以節點標記冒充實際數量，也不是古代計數器或封閉羊圈。

`parables-light` 是原創未點火功能比較：開口延唇燈、普通空油瓶、桿／開口供油杯／吸油束與明確現代凹座。燈與瓶內底14mm、杯底14mm、現代座底30mm；桿底／杯底／吸油束底皆有真平面承接，座側向徑隙0.5mm。瓶與座內底圖仍暗，依配對射線而非照片宣稱看清。`lamp-section` 的黑色截邊是 near-plane 相機裁切檢視，沒有新增黑色 cap 幾何，不當作材質斷面或黑孔。器形不是Met精確放大或Lund／Peppard提供的完整原器工程，也不認證強度、容量、燃燒時間或點火流程。

隔離初驗抓到兩個真接觸缺陷並定點修正：荊棘莖首段先垂直8mm，吸油束底圈R26→18mm置於R20mm杯內平底。失敗源／GLB／量測保留在 [/home/garywu/dev/bible-island/.qa/parables-prototype/before-contact-fixes](/home/garywu/dev/bible-island/.qa/parables-prototype/before-contact-fixes)。Root 接受的就是修正版；正式三件所有BIN bytes、語意節點、材質與extras與接受版相同，只有Blender自動mesh datablock尾號差異，見[完整對照](/home/garywu/dev/bible-island/.qa/parables-official/accepted-prototype-exact-geometry-compare.json)。

舊89重匯出53件完全相同、36件僅UV尾數，變動52,822 components，最大 `2.980232238769531e-7`；exact JSON、geometry、nodes、skin、animations及所有非UV bytes皆相同。證明後還原36原檔，最終89／89原 bytes／hash與舊報告條目完全保持，正式 `.blend` 留全部92場景。

正式實際 GLB 總覽：[soil（9角）](/home/garywu/dev/bible-island/.qa/parables-official/parables-soil-overview.png)、[flock（6角）](/home/garywu/dev/bible-island/.qa/parables-official/parables-flock-overview.png)、[light（10角）](/home/garywu/dev/bible-island/.qa/parables-official/parables-light-overview.png)。所有相機、裁切距離、隱藏狀態、source／GLB／PNG SHA皆在來源鏈。圖中的QA隱藏與near-plane裁切不是額外runtime拆層或古代操作。

程序終態見完整JSON：官方builder40181、舊89比對65511、正式source＋freshGLB QA93530及後續render／總覽均已收exit0，沒有live handle。20離散路徑、有限射線／法線厚度取樣與表面穿透掃描不是完整連續碰撞或材料強度證明。未改app、manifest、音檔、Git或Sites。

Root補記：已親看正式三張實際GLB總覽共25視角並接受三件；保留內底暗處／配對射線與有限取樣限制。應用manifest已另由root註冊，不能由素材交接推定已發布或全部人工驗收。
