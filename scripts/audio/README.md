# Original audio preparation

This directory generates original modern audio for the project's review workflow. No external samples, paid services, reconstructed ancient melody, or historical instrument identification is involved. The generator does not modify `src/`, `public/`, voice files, cue manifests, or Sites.

Run from any directory with Node 18+ and FFmpeg 6+ available:

```sh
node /home/garywu/dev/bible-island/scripts/audio/generate-original-audio.mjs
node /home/garywu/dev/bible-island/scripts/audio/generate-mood-loops.mjs
node /home/garywu/dev/bible-island/scripts/audio/verify-original-audio.mjs
```

To add or reproduce only the four stone-vessel interaction variants while leaving all original audio files untouched:

```sh
node /home/garywu/dev/bible-island/scripts/audio/stone-interactions.mjs
```

The full generator also appends this extension after the original 111 files. The extension records their before/after byte lengths and SHA-256, adds twelve audio files, and rebuilds only review galleries and metadata. `manifest.extensions.stoneInteractions` records its separate source hash; the original generator hash on an incrementally extended manifest remains the historical base-generation hash.

The default output is `/home/garywu/dev/bible-island/.qa/audio-upgrade/`. A separate review directory can be chosen with `--out /absolute/review/path`. The script uses fixed seeds and an authored score. The same source, Node, FFmpeg and platform produce repeatable audio; the output manifest records source and audio SHA-256 hashes. No installation or network access is required.

The first town composition, **Courtyard Paths / 院落之間**, is 96 seconds, 80 BPM, 32 bars in 4/4. Four phrases vary their density and swap a breath/harmonic woodwind with plucked responses. The low string, plucked accompaniment and inharmonic membrane percussion have independent envelopes. Eleven bars leave the woodwind silent. The final quiet pickup and short stereo reflections wrap into the opening; no master fade or silent padding creates the loop. It is a contemporary score for reading, not an authentic first-century performance.

`music/jerusalem-town-loop.wav` is the canonical 48 kHz stereo 24-bit PCM loop. Ogg Vorbis and MP3 delivery alternatives are provided. `manifest.json` records exact frame length, decoded codec lengths, peaks, DC, and the measured final-to-first sample transition. `previews/loop-seam-tail4-head4.wav` puts the wrap four seconds into an eight-second preview. A waveform and logarithmic spectrogram are provided. These are engineering checks; they do not certify musical taste or replace listening.

The 40 mono effects each have four independently excited variants:

| Family | Material | Model |
| --- | --- | --- |
| Footstep, landing | Earth | Low compressed contact plus scattered, separately timed grit grains |
| Footstep, landing | Stone | Brief bright contact, fast inharmonic modes and sole friction |
| Footstep, landing | Wood | Hollow plank modes, dry contact and delayed board flex |
| Jump takeoff | Neutral | Toe release, sole flex and cloth/air sweep |
| Object interaction | Ceramic | Shell modes and gentle sliding/set-down contact, without breaking |
| Object interaction | Wood | Hollow knock and short friction, without chopping |
| Object interaction | Stone | Damped dense-body modes, low contact and a short handling rub, without breaking or weapon impact |

`previews/effects-gallery.wav` concatenates all 40 variants with gaps; `effects-gallery-index.json` gives the start and duration of each. `stone-interactions-gallery.wav` provides just the four added stone touches, with a matching index and spectrum. Each effect has WAV, OGG and MP3 files. Their source structures, not merely playback pitch, distinguish materials. This is a useful initial palette for review; the source's absolute frequencies and timings do not establish archaeological acoustics.

Suggested runtime interface for the owner to implement separately:

- One music descriptor: `{id, files, durationSeconds:96, loopStart:0, loopEnd:96, sampleRate:48000}`. Decode after sound activation, use `AudioBufferSourceNode.loop`, and set the exact loop boundaries. Prefer OGG when supported, with canonical WAV as an uncompressed alternative; retain MP3 for compatibility and verify its browser decoder. Do not schedule the loop with JavaScript timers.
- Effect groups: `footstep[earth|stone|wood]`, `landing[earth|stone|wood]`, `jump.neutral`, `interaction[ceramic|wood|stone]`, each containing four buffer descriptors. Select another variant than the last; use real ground contact events and material lookup. A jump sound fires only when jumping is accepted; a landing fires only on an airborne-to-grounded transition. Do not use these as automatic contact claims for NPCs that are off screen or inactive.
- Keep the active music buffer only; it decodes to 36,864,000 bytes of stereo float PCM. Two tracks during a transition need about 73.7 MB before other audio. Release the outgoing buffer after the crossfade rather than caching all five future themes. The 40 short mono effects are much smaller.
- For listening review, try a combined music-bus gain around 0.45–0.65; this includes the preference slider rather than adding another hidden multiplier. The file is already quiet. Tune against the actual voice level and duck further under speech. Effects have at least 10 dB of source peak headroom; use separate buses, distance attenuation and a small simultaneous-source limit (for example four at gain ≤0.5). Reassess combined levels in the actual app. No mix has yet been approved through full human listening.

The separate mood generator now supplies the four subsequently authorized themes, without rewriting the town or 40 effects. Run the base generator first when preparing a completely fresh output, then the mood generator, then verification. An incremental mood run requires the existing 123 base audio files and checks their byte sizes and hashes before and after rendering.

| ID | Character | Meter / tempo | Exact loop duration |
| --- | --- | --- | --- |
| `wilderness` | Low breath melody, long pauses and widely spaced plucks | 4/4, 72 BPM | 5,120,000 frames / 106.66666666666667 seconds |
| `lakeshore` | Three-beat sway, rounded wood resonators and gentle answering air | 3/4, 90 BPM | 4,608,000 frames / 96 seconds |
| `construction` | Dry muted low strings, warm wooden/skin pulse and phrase rests | 4/4, 96 BPM | 4,800,000 frames / 100 seconds |
| `solemn` | Slow sustained harmonic ensemble, low plucks and rare responses, without drums | 4/4, 60 BPM | 4,608,000 frames / 96 seconds |

The four contemporary scores have independent chord and melody/riff event lists, arrangement and reflections; they are not town transpositions. Their files are `music/{id}-loop.{wav,ogg,mp3}`. Canonical WAV is stereo 48 kHz PCM24; OGG and MP3 are delivery alternatives. `moods-manifest.json` records the source hash, seeds, event counts, exact boundaries, actual decoded lengths, seams and FFmpeg loudness. The main `manifest.json` exposes them as `moods` while retaining the original `music` and `effects` descriptors.

Each score is linearly adjusted toward −26 LUFS while retaining at least 8 dB of measured true-peak headroom; no hard limiter or compressor obscures its envelope. `melodyRestBars` in the mood metadata counts bars without the **air** melody voice, not bars where the plucked construction riff is silent. Per-second RMS values expose dynamics and pauses. Each track has a score-event JSON, waveform, spectrum, actual FFmpeg loudness log and tail-four/head-four seam WAV in `previews/`. The rendering and verification do not certify human listening or runtime integration; those remain with the owner.
