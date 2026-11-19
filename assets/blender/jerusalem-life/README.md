# Jerusalem life: three-role pilot

The frozen pilot improves the Jerusalem householder, water-carrier and older street vendor. It is ready for user review; extending the new treatment to other islands requires that review. Prior character GLBs and shared Blender sources remain intact.

| Role | Clips | GLB bytes | SHA-256 |
|---|---:|---:|---|
| resident | 26 | 6,460,020 | `163db386541e169abd73155b1098d0ffb4b8bc22b5f00f2b7e53278c44679dae` |
| carrier | 26 | 6,622,196 | `aba81a142cbffdfb6e998273c10f1c1497e16d1d1de395c9560f666204245818` |
| elder | 24 | 5,924,412 | `6b241f61b776577a832e04ebb00bb252633ed00f471633c2b4103726e7d14654` |

The three editable `.blend` files are each below 32 MiB. Actors are 1.71 m with runtime scale 1, keeping hands, table tops and basin props in the same metre coordinates. Static parcel, dipper and vendor-goods exports use the actual actor prop meshes; their hashes and bounds are in the role metadata.

## Authoring and runtime contract

Real weighted clavicles, shoulders, articulated fingers/thumbs, natural resting palms and softly bent elbows replace the former mannequin hand placement. The new meshes have near-view face/eyes/jaw details, cloth thickness/folds and sleeve-opening repair revision2 while preserving role, hair and wardrobe palette. Water-carrier work changes actual finger/arm poses instead of extending limbs or moving grounded vessels to conceal errors.

The base gait is retargeted from actual adult CMU07 recordings; the older vendor uses07_04 slow-walk. Recorded yaw timing and stair swing references support authored planted turns and stair adaptations. Starts/stops and work actions are authored from studied references, rather than claimed as recordings of ancient work or elderly people. Cloth is skinned secondary motion, not fabric simulation. Jaw opening indicates speech delivery, not phoneme lip synchronization.

Every role retains the original nine clip names and adds separate L/R starts/stops, planted 45/90/180-degree turns, StairUp/StairDown and Listen. Resident adds Inspect/Receive/CarrySmall/PlaceSmall, carrier adds SetDown/Fill/PickUp/Pour, and vendor adds Arrange/Offer.

- Each `*-motion.json` defines actual duration/distance, entry/exit gait phase, stable foot contacts, distance/yaw progress, hand windows and orientation samples. Detailed samples are kept once per role, not copied into the thin report.
- `handGripL/R` are actual hand-local markers. Targets are `jugGripR`, `dipperGripL` and `parcelGripL/R`. Orientation samples are XYZW: targetWorldQuaternion×sampleOffset gives the **hand bone** world rotation; the hand-local marker transform is separately documented.
- CarrySmall layers upper-body/prop tracks over locomotion. Its whitelist must include **propParcel, parcelGripL and parcelGripR**. Physically contacting fingers retain their authored pose during transitions, while free hands retain inertial motion.
- Root-independent props stay anchored when foot grounding lowers the body; runtime corrects the arm toward the real socket afterward. Activity time follows the controller phase, and dialogue freezes/resumes the same work posture and prop state.
- Table surface is localY=.750; parcel centre is[0,.772,.45] with actual lower surface.750. Ground jug anchor is[.28,0,.40], dipper rest[-.20,.57,.40]. Full bounds/targets are in metadata. Fill visibly transfers water; inactive station props persist. Stairs use their own.8m cycle distance.

## Verification

`build-report.json` records91 actual binary, weight, clip, source and preservation checks. `runtime-review.json` records six passing actual runtime scenarios: rig/clip contract, interrupted work contacts, flat/±.2 slopes, six 30-second held-object routes, parcel palm/digit surfaces and carrier working grips.

Resident parcel samples over six controller poses reached.4419mm maximum local depth, with no vertices over.5mm. Nine final raw-GLB carrier work poses had zero detected closed-handle interior penetration. Source and GLB hand skin clouds agreed within .00042 mm and dipper geometry within .000016 mm. A true closed solid winding test plus proximity avoids false penetration signs from nearest face normals on concave rings. The open hollow bowl is not treated as a solid by local normals.

These finite pose/route samples are not a continuous all-triangle intersection proof or final user aesthetic acceptance. `review-carrier-motion-contact.*` supersedes the failed earlier source review; intermediate drafts and its numerical history are retained in ignored `.qa/jerusalem-life/authoring-history/`.

## Reproduction and sources

Use Blender 4.5 LTS with `--background --threads 4 --python-exit-code 1`. `jerusalem-life.py -- --geometry-only` creates isolated geometry drafts; `jerusalem-life-motion.py -- --roles ROLE --clips NAME,...` bakes clips. `--reuse --clips` replaces only selected actions. `jerusalem-life-carrier-grip-calibration.py` regenerates the offline contact authoring; rebake SetDown/Fill/PickUp afterward. `jerusalem-life-export.py -- --roles ROLE --status runtime-verified-pilot` packages that role. Run `python3 scripts/blender/jerusalem-life-verify.py` for the thin structural report and `node --test tests/jerusalem-life-assets.test.js` for runtime gates.

Packed materials are in `materials/`. Original motion, licensing, units, converter caveats and measured crops are in `reference/`; these CMU/Hahne inputs permit copying/modification/redistribution under the recorded terms and are not labelled CC0. Existing CMU07 inputs remain in the preceding pilot reference folder. No child or other-island models are included in this pilot.
