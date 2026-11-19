# Elder candidate build/export review

Status: candidate-needs-runtime-qa.24 clips exported, including eight replaced turn clips. All build/provenance/GLB structure/timeline checks in the JSON pass. No natural-motion, continuous contact, cloth or runtime acceptance is implied.

- GLB5,924,412bytes, SHA256 `6b241f61b776577a832e04ebb00bb252633ed00f471633c2b4103726e7d14654`.
- Editable source8,273,101bytes, SHA256 `fa7614d6539b439c7048260ae1c85c032e3676cfacdbd56a3633827d10083957`.
- Vendor rest prop35,008bytes; surface minimum glTFY0.75m.
- Actual GLB has24 expected names and correct sampled durations, cap revision2, and direct clavicle weights in medial cloth (maximum approximately0.16).
- Actual hierarchy-composed turn endpoint feet match Idle positions within0.000067mm and orientations within0.053°. This targets the repaired half-angle endpoint issue, not general gait quality.

Initial24 motion bake and later eight-turn replacement used recorded earlier code revisions; packaging used the latest recorded cap/yoke exporter. The JSON records those distinct SHA256 versions honestly. Other16 clips' raw baked data were preserved. Adult CMU07_04 is the walking source; the older role and work poses are authored adaptations, not captured elderly or historical activity.
