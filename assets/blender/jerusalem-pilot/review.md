# Pilot asset review — 2026-11-17

Final asset build and actual evaluated-render audit completed. The Blender build
and render processes both exited successfully; no authoring/render process is
left running. This review covers the three source assets, not application UI,
deployment, or approval of all islands.

## Final files

| Role | GLB bytes | Walk seconds | Cycle travel m | Skin joints |
| --- | ---: | ---: | ---: | ---: |
| Resident | 1,808,876 | 1.091666667 | 1.314286221 | 46 |
| Carrier | 1,798,616 | 1.200000000 | 1.128571864 | 38 |
| Elder vendor | 1,770,812 | 1.425000000 | 1.131821343 | 46 |

All nine clips are present in each actual GLB. Start duration is 0.700 seconds,
stop 0.758333333 seconds, and each turn 1.283333333 seconds. Runtime entry phase
is 0.49; transition and walk support tables are provided in each role JSON.
Editable source is a separate three-scene `jerusalem-pilot.blend`, 11,673,258 bytes,
below the Sites 32 MiB Git-object limit. The original shared source and 28 GLBs
were not overwritten.

Full GLB/source hashes are in `build-report.json` and `validation-report.json`.

## Source and motion audit

- Recorded human inputs are CMU subject 07 walk 01 and slow walk 04, preserved
  with original ASF/AMC, converted BVH, licenses, pinned mirror revision, and SHA.
- The converter-added T-pose is skipped. Resident/carrier use Python source rows
  55–186 inclusive; slow-walk elder uses rows 226–397.
- Reference root translation agrees with official AMC to within 0.00005 source
  units. Permissions and the official unit conversion are recorded under
  `reference/`.
- Measured root travel/floor drift is removed before posing, and small endpoint
  corrections close captured positional/rotational differences. Shoulder-line
  yaw supplies actual axial counter-motion, distributed across three spine joints.
- Ankle recovery retains recorded toe-down movement (up to 75 degrees), plus
  independent captured forefoot articulation. This avoids the high, flat-foot
  marching appearance produced by an incorrectly signed/clipped ankle rotation.
- Capture-derived joint/foot paths are retargeted to fixed limb lengths. Carrier
  loading/stride, elder posture/stride, transitions, conversational gestures, and
  restrained delayed cloth remain authored adaptations. Neither the capture nor
  this review establishes that the performer was elderly or carrying water.
- Eye/lid channels remain neutral in all clips; independent runtime attention
  owns blinking, avoiding a blink on every short gait cycle.

## Geometry and contact audit

Original vertex positions, vertex colours, and material identities are unchanged
before/after skin redistribution, enforced by exact SHA assertions for each role.
New spine/clavicle/toe/finger/eye/lid/garment joints have real vertex weights.
The carrier's original closed right-hand grasp and jug share the same hand bone;
the held hand does not receive a free-arm swing or finger-relaxation override.

All three actual deformed soles were evaluated at 121 fractional phases. This
includes subframe interpolation between 120 Hz baked poses, not only keyframes.

| Role | Lowest evaluated sole relative to floor | Loop max joint position difference | Loop max joint rotation difference |
| --- | ---: | ---: | ---: |
| Resident | +0.244 mm | 0 m | 0 radians |
| Carrier | -0.490 mm | 0 m | 0 radians |
| Elder vendor | -0.015 mm | 0 m | 0 radians |

All are within the source-review penetration limit of 0.5 mm. The small authored
sole clearance is an interpolation reserve; runtime terrain IK remains responsible
for actual support and slope/stair contact. The parent integration separately
reported passing runtime toe-aware support/slope checks for all three assets.
This source review does not substitute for those runtime tests.

## Actual image review

The preview script rendered front and side views at phases 0, 0.25, 0.5, and 0.75
for all three roles (24 images) using the evaluated skinned meshes. The final
carrier side view shows toe-down heel recovery with the jug still attached to the
grasp. Frontal elder and resident views preserve the original clothing silhouettes
while showing different stride/cadence. Free fingers are relaxed through two
weighted joints rather than remaining straight rigid tubes.

Review outputs:

- `.qa/jerusalem-pilot/resident-side-25.png`
- `.qa/jerusalem-pilot/carrier-side-25.png`
- `.qa/jerusalem-pilot/elder-front-50.png`
- `.qa/jerusalem-pilot/sole-check.json`
- `.qa/jerusalem-pilot-build.log`
- `.qa/jerusalem-pilot-render.log`

The original low-poly teaching face and garment surfaces remain recognizable.
This motion upgrade does not turn them into scanned or photorealistic humans,
and the elder still uses the original worker face and wardrobe. The pilot is
ready for the user's normal-speed, in-scene assessment before any wider rollout.

## Metadata correction audit

The elder rig now correctly labels its capture as `CMU07_04`, matching the actual
slow-walk input. The builder selects the label by role. The existing elder GLB
changed exactly one ASCII byte inside node extras; its byte length, BIN chunk,
and entire animation JSON are identical. The existing editable source was saved
after changing that rig custom property only, without baking or exporting.
Before/after semantic SHA for all mesh vertices/weights/colours, bone rest matrices,
and every action keyframe is identical. Full evidence is in
`metadata-fix-audit.json`; previous gait/contact/loop results remain applicable.
