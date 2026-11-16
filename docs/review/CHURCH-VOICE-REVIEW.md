# 第23島配音交接

2026-11-17。三人各一份連續原創中文稿，實際personForMode派生每人一般5cue／親子3cue，共24cue。Root與有界文字覆核完整逐字確認後才生成，確切拼接稿490／492／532字；腳本SHA256為`92322699b187d401fb70904ae24d714e065c788562fedc8db4d8fab882e94f2a`。安提阿teaching已採較自然的教導措辭，核定後未再改稿。

| 角色 | 公開ACTIVE聲音 | WAV服務回傳秒數 | canonical MP3秒數 | bytes |
|---|---|---:|---:|---:|
| 陪伴聆聽的居民 | Haoran · 4f8c25eb83f4488d82c2a2e38dc0a9d3 | 85.20215419501133 | 85.272 | 1,364,781 |
| 準備共餐的居民 | Shuxian · 6c364011f30747c9a0a89eec3787cadc | 93.05049886621315 | 93.120 | 1,490,349 |
| 安提阿的接待居民 | Guoliang · 1ddd191b2454466e9527983c9dcb4c14 | 97.19526077097505 | 97.248 | 1,556,397 |

三份首次生成皆成功，無重試、試音或替代take。實際工具`create_speech_without_player`；傳language zh、speed1、withTimestamps true，省略model與outputFormat，由服務預設WAV輸出。2026-11-17當次公開zh清單確認ACTIVE，沒有使用私人聲音或克隆。

原始WAV保留忽略的`.qa`，canonical `public/audio/church/*.mp3`為單聲道24kHz／128kbps，FFmpeg轉碼保持1×速度／音高，未裁語音或伸縮時長。逐字核對服務original_characters拼接與送出稿完全相同；每cue使用實際首尾字元時碼，前20ms／後40ms保護並以音檔時長夾限，未平均分配時間。完整確切請求、聲音身分、字元／word時間碼、原WAV與MP3 SHA256及cue映射在`CHURCH-VOICE-PROVENANCE.json`。

尚未宣稱完整真人聽驗或古代讀音認證；返回文字相符不能代替聲音悅耳度。需特別真人聽驗約珥、腓尼基、阿伽布斯、各地名與特定章節範圍，「約三千」約數、「整年」時間、長老的長及盛裝的盛。瀏覽器實際播放／取消驗證接續追加，未由檔案產出推定已播放通過。
