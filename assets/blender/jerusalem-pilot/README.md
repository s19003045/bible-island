# Jerusalem human-motion pilot

These three assets are a bounded demonstration for Jerusalem's householder,
water carrier, and elder street vendor. Other islands and the 28 original human
models are deliberately untouched.

## Rebuild

```sh
blender --background --python scripts/blender/jerusalem-pilot.py
blender --background --python scripts/blender/jerusalem-pilot-preview.py
```

Requires Blender 4.5 LTS and the existing `assets/blender/bible-assets.blend`.
All motion inputs and source/license records are tracked under `reference/`;
no network or external add-on is needed during rebuild. Outputs are the three
GLBs under `public/models/jerusalem-pilot/`, this directory's JSON contracts, and
the separate `assets/blender/jerusalem-pilot.blend` editable source.

## What is captured and what is authored

The ordinary resident and water carrier use CMU subject 07 trial 01's recorded
adult walk (BVH Python rows 55–186 inclusive). The elder uses the same subject's
recorded slow walk, trial 04 (rows 226–397). Row zero is the converter's added
T-pose and is never used as recorded motion. `reference/provenance.json` and
`source-integrity.json` document official sources, permission, checksums, units,
and agreement with the official AMC root translations.

This is a retargeted teaching character, not the scanned captured person.
The data supplies observed limb paths, spinal/shoulder counter-motion, ankle
recovery, and forefoot articulation. Carrier load compensation, shorter strides,
elder posture, start/stop/step-turn transitions, conversational gestures, and
secondary garment motion are authored adaptations. There is no claim that an
elderly person or a water carrier was captured. Cloth motion is delayed weighted
animation, not fabric simulation.

Measured one-cycle root travel and vertical floor drift are removed from the
in-place pose, with small endpoint corrections to close positions and rotations.
Actual external translation and yaw remain the collision controller's property.
Legs use the existing character's lengths with two-bone knee solves. The bake
samples at 120 Hz and reserves 1.3 mm at the sole to absorb subframe interpolation;
runtime terrain/contact IK performs the final ground contact.

## Appearance and anatomy contract

The original resident, carrier, and worker surfaces, vertex colours, materials,
wardrobe, and carrier grip/jug are unchanged. A before/after geometry-and-colour
SHA assertion enforces this. Every original core bone name remains available:
`hips`, `thighL/R`, `shinL/R`, `footL/R`, `armL/R`, `forearmL/R`, and `handL/R`.

Added joints have actual redistributed vertex weights:

- `spineUpper`, `chest`, and `clavicleL/R` distribute torso and shoulder movement.
- `toeL/R` articulate the forefoot, including the sandal. Ground probes must include
  vertices weighted to the foot **or its toe descendants**, including blended ones.
- `fingerL/R0..3A/B` bend each free finger through two joints. Carrier right hand
  retains the original closed grasp; the jug and that hand share the same bone.
- `hemL/R` and `mantleTail` provide restrained delayed garment motion.
- `eyeL/R` and `lidL/R` are weighted eye and upper-lid geometry. Every clip keeps
  those joints neutral so runtime owns independent gaze and blinking. `attention`
  metadata gives the closed-lid displacement and eye scale in bone-local space.

Blender uses Z up and -Y front; glTF uses Y up and +Z front. BVH L/R nomenclature
is mirrored to retain the project's existing L/R bone naming convention. This
mapping is explicit in the builder and does not change the wardrobe or role.

## Animation/runtime contract

Nine clips: `Walk`, `StartWalk`, `StopWalk`, `TurnLeft`, `TurnRight`, `Idle`,
`LookAround`, `Talk`, and `Interact`. Each `<role>-motion.json` contains exact
export durations, captured reference rows, stride distance, per-foot contact
intervals, transition entry phase, hierarchy, actual weighted-vertex counts,
asset checksum, and sampled bake diagnostics.

`walkContact` intervals use normalized walk phase; `clipContacts` intervals use
normalized transition clip time. `heel`, `flat`, and `toe` are kinematic support
labels, not measured ground-reaction forces. Starts/stops are authored from
captured poses and still require runtime contact matching when entering from an
arbitrary live phase. No perfectly continuous arbitrary-phase blend is claimed.

`jerusalem-pilot-preview.py` renders actual evaluated front/side poses for all
three roles and samples the evaluated, deformed sole geometry over a full cycle.
The review PNGs and `sole-check.json` are placed in `.qa/jerusalem-pilot/`.
