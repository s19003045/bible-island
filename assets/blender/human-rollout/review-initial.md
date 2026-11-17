# Initial evaluated-mesh review

Historical initial findings only. The sleeve and knee findings were subsequently
corrected and re-rendered; see [the final review](review-final.md).

Reviewed `resident-child` at Walk phases 0, .25, .5, .75 from front and side,
plus a face close-up at .25. These are actual Blender 4.5.16 Cycles renders of
the isolated editable source; no source scene was saved or exported.

Evidence: `.qa/human-rollout/review/resident-child/` (nine frames and contact sheet).
The matching audit JSON independently verifies source and GLB SHA, rig identity,
CMU capture-source tag, profile, and all nine animation names. All pass and the
source SHA remains unchanged after rendering.

Findings:

- **Inherited geometry limitation, not a retarget regression:** side phases .25
  and .5 show a rectangular skin patch protruding through the near upper sleeve
  above the elbow. A subsequent six-frame comparison of the original V2 source
  and new source (Idle 0; Walk .25/.5, identical side camera) confirms the same
  patch in original V2 Idle and Walk. Evidence is in
  `.qa/human-rollout/review/resident-child/original-comparison/`.
  This remains a visible original mesh limitation outside the calf envelope
  audit, not evidence that the new sleeve weights introduced clipping.
- Knee flexion, separate leading and trailing legs, heel/sole pitch, toe-off,
  and opposite arm motion are visible across the quartiles. Static views do not
  establish perceived naturalness of the complete moving cycle.
- Neutral eyes and lids are aligned on the face close-up; no displaced eyeball,
  inverted lid, or white/iris intersection is apparent in this neutral frame.
  This does not substitute for runtime gaze/blink verification.
- The original stylized body and clothing silhouette remain. This rollout adds
  motion and articulation, not a photorealistic replacement model.

Reproduce:

```sh
/tmp/bible-blender-runtime/blender-4.5.16-linux-x64/blender --background --threads 4 \
  --python scripts/blender/human-motion-review.py -- --models resident-child \
  --out .qa/human-rollout/review
```
