# Human motion rollout source

These 28 models preserve the original Bible Island character identities, body proportions, garment mesh coordinates, material colours and accessories. Each original V2 GLB and the shared `assets/blender/bible-assets.blend` remain inputs. The three Jerusalem pilot models also remain independent and unchanged.

## Reproduce

Use Blender 4.5 LTS and the repository root:

```sh
blender --background --threads 4 --python scripts/blender/human-motion-rollout.py -- --models resident-child,resident-carrier,priest-bearer,return-elder
blender --background --python scripts/blender/human-motion-rollout.py -- --index-only
blender --background --threads 4 --python scripts/blender/human-motion-review.py -- --models resident-child,roman-woman,priest-bearer,brick-laborer
```

Omit `--models` to build all 28 original `motionVersion:2` character definitions. Distinct model batches can run independently; each writes only its own GLB, editable blend and detailed metadata. Run `--index-only` after every batch finishes. It validates actual bytes against metadata and creates the thin `build-report.json`; detailed frame samples remain in each `<model>-motion.json`. Each editable source contains one character scene and all nine animation actions, so every Git/Sites object stays below 32 MiB.

## Motion source and adaptations

The base walk is a real human recording: CMU subject 07, trial 01. The older character uses CMU 07_04 slow walk. The tracked BVH/ASF/AMC, official CMU permissions, conversion permissions, integrity comparison and SHA provenance are in `assets/blender/jerusalem-pilot/reference/`. Added T-pose frame zero is excluded. Walk crop rows 55..186 and slow-walk rows 226..397 are inclusive zero-based indices. Source samples are 120 Hz. Root drift is removed and the endpoints are corrected to match exactly before retargeting to each model's original leg lengths.

Child, water-carrying and elder performances are authored retargeted adaptations of an adult performer. They are not motion capture of children, laden carriers or elders. Starts, stops, turns, attention, speech gestures and garment response are authored adaptations, not new recorded performances. Character path steering, ground IK, gaze, asynchronous blinking, footstep audio and scene permissions are runtime responsibilities.

The rig has genuinely weighted upper spine, chest, clavicles, toes, eyes, eyelids and free-finger segments. Free arm/forearm weights blend around elbows. Clothing uses height-dependent leg following and delayed hem/mantle animation. Short tunics lift with the leading thigh, avoiding a flat rectangular knee cutting through the front panel. Long robes additionally follow the actual posed calf cross-section. This is weighted clothing animation, not fabric simulation.

Some original coarse skin cylinders extend slightly through their covering sleeves or robes. Separate child joints apply radial clearance only to the hidden covered skin. Original mesh coordinates, visible feet, hands, limb lengths and clothing silhouettes remain unchanged. Those deformed covered skin vertices remain included in the garment audit. Bare arms and uncovered calf geometry do not receive sleeve clearance.

The carrier preserves its original right-hand jug grip throughout all clips. The bearer preserves both original arm poses and its existing right-hand closed grasp. Its original left hand is lowered; a second closed grip has not been invented. The pole belongs to scene staging. A Walk clip being present is not permission for a bearer stationed in the river to walk.

## Runtime contract

`id` is `human-<original-model-id>`; `baseModelId` preserves the original ID. `file` is relative to `public/`. Metadata provides actual height, ankle height, cycle distance/duration, profile, entry phase, transition durations, walk/transition contact ranges, attention axes and SHA of both exported GLB and editable source. The nine clip names retain the original contract. Walk and transitions bake at 120 Hz; longer authored gestures bake at 30 Hz and export with Blender's 120 Hz sampling.

`secondaryCloth.excludeBones` contains `hemL` and `hemR` for every garment, since their baked motion maintains knee/calf coverage. Additional runtime cloth damping must respect that exclusion. Other cloth helpers are limited by `secondaryCloth.maxAngle` (0.02 rad long robes, 0.035 rad shorter clothing). Eyes/lids have neutral baked tracks; the runtime owns independent attention/blink timers.

## Checks and limits

The builder compares the complete original geometry/material signature before and after skinning. Every model has 121 fractional Walk phases plus 13 fractional samples per other clip evaluated using the actual skinned meshes. Complete foot and toe vertices are checked with a -0.5 mm penetration threshold; the baked reserve is 2.4 mm to absorb interpolation, while runtime IK handles final support contact. Loop endpoints are checked in joint position and rotation. Bound hands are checked relative to the chest across all nine clips.

Covered leg checks use 41 evaluated Walk phases against the actual garment BVH. Front/back rays must find distinct opposing garment walls at least 35 mm times the leg scale apart, with outward normals facing the corresponding ray origins. A work apron and the tunic front are both forward-facing layers; they are not treated as an enclosing garment. A single back panel below a lifted open front hem is not a closed clothing envelope. The test includes the actual deformed calf, knee or thigh points still covered at that height, with tolerance 0.5 mm times leg scale. Per-model metadata records the actual number of points and any stride adaptation. Representative rendered evidence is reviewed separately; numerical contact tests alone do not certify visual garment quality.

The original teaching models remain visibly stylized; this upgrade improves articulation, weight transfer, continuity, clothing clearance and role-specific movement. It does not add photorealistic geometry or a facial performance capture system.

## Release evidence

`build-report.json` is the validated thin asset index. `review-final.json` and `review-final.md` record the independent provenance check and actual visual findings, including the two short/open garments without closed-envelope numerical coverage. Five selected contact sheets are retained in `review/`; larger intermediate renders and abandoned diagnostic builds remain outside the release under ignored `.qa/`.
