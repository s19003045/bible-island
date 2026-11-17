# Jerusalem human-motion reference

These source files preserve the human motion-capture reference used for the Jerusalem resident, water-carrier and elder pilot. CMU subject 07 trials 01 (walk) and 04 (slow walk) were captured at 120 Hz. The pilot can adapt these motions for its characters; trial 04 is a slow walk, not evidence that the performer was elderly. Any carrying pose, age-specific posture, procedural IK, or cloth motion is an authored adaptation.

## Rights and credits

CMU [official FAQ](https://mocap.cs.cmu.edu/faqs.php) permits copying, modification and redistribution without permission. The [original data homepage](https://mocap.cs.cmu.edu/) describes the dataset as free for all uses. Bruce Hahne [BVH conversion release](https://sites.google.com/a/cgspeed.com/cgspeed/motion-capture/the-motionbuilder-friendly-bvh-conversion-release-of-cmus-motion-capture-database) permits use worldwide for any purpose. The unmodified accompanying `READMEFIRST.txt` records his terms and CMU acknowledgment. This permissive grant is not represented as CC0 or a standard SPDX license.

The data used in this project was obtained from mocap.cs.cmu.edu. The database was created with funding from NSF EIA-0196217. BVH conversion by Bruce Hahne, cgspeed.com, 2010 release. Download mirror: una-dinosauria/cmu-mocap; pinned revision and exact hashes are in `provenance.json`.

## Reproduction

Use the local unmodified `07_01.bvh` and `07_04.bvh` as inputs. Frame 1 is an added T-pose and must not play as motion. Official ASF/AMC files are retained for provenance. CMU original units convert with `(1 / 0.45) * 2.54 / 100` metres per source unit. Source forward is approximately +Z, up is +Y. Current asset coordinates are +Z up and front -Y. Preserve source rotations through explicit rest-pose/axis mapping and remove world root motion when exporting in-place clips.

Suggested single cycles are recorded in `provenance.json`; retargeter may choose refined boundaries after visual inspection and must report actual frames used. Source data has noise and support-foot floor drift, so do not claim raw motion alone guarantees foot locking. Use geometric contact correction, a cleaned cycle seam, and comparison at normal playback speed.
