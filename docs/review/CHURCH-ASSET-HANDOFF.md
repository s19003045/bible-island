# 第23島正式教具交接

2026-11-17。Root完整讀正式handoff並親看由canonical public GLB新渲染的25角（三張總覽），接受三件。家屋為三面牆、真入口與右側現代局部剖示；兩梁及屋頂面為同一組升起。共餐為普通開口碗、兩只同杯與整餅；關係盤為現代兩端比較，方向另由窗口文字說明。全為原創教學選擇，不認證原屋、原物、人數、禮儀或原路線。

| ID | triangles | bytes | GLB SHA256 |
|---|---:|---:|---|
| church-house |1304|72664|b8004512dd09ca1edfaa63a46097617640e38b1e2567595d6ecb66a7457b5b43|
| church-table |19292|444396|0cf0674b08a7c9cbe2c7ae2131b925d6e6e5cfac19d8ef98bfb1c92f39f6449c|
| church-relations |1492|53228|2906097d1a55deed489524970085163067a0df6ec686f39967e2fbacd6acd749|

正式來源`assets/blender/bible-assets.blend` SHA256 `3457f5f8b44dec9a5255745f4cae0571d12210787caf442d001a67056b0bfc85`，98非空場景／98GLB，28人類骨架各5動作及羊3動作。建置一次；原95件最終GLB bytes與原報告條目完全保留。36件重匯UV尾數差已逐accessor、JSON與非UV證明後恢復；其餘59件原byte一致。

新三件與核定隔離原型BIN、accessors、材質及語義節點精確一致；只差自動mesh名稱。正式來源重開及fresh GLB QA failures=[]，實際triangle閉合／正材積／承托／有限COM、碗杯局部壁厚與底厚、家屋20路徑樣本均保存。屋頂三後代全頂點Y+.16m、固定0、還原0；有限幾何檢查不是結構載重或製造認證。

證據留於忽略目錄`.qa/church-official/`：handoff.json、geometry.json、preview-provenance.json、contact-provenance.json及process-records.json。builder43538／舊件比對3689／source QA1473／正式渲染85738／總覽52593全exit0，無剩餘素材程序。應用整合與Sites操作另見CHURCH-CHAPTERS.md。
