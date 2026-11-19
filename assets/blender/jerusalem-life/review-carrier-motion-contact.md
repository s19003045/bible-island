# Carrier work-contact review

Status: **corrected and runtime verified for this pilot**. The earlier source with working-hand failures is superseded.

The final GLB is `aba81a142cbffdfb6e998273c10f1c1497e16d1d1de395c9560f666204245818`; editable source is `b7fd70c4aa4f7fea21cd78956b62249d2bddf5f01d32dbad0427c867b6a13fc8`. Only SetDown, PickUp and Fill hand authoring changed. Fill also relaxes the released right arm to a 33.34-degree elbow bend and neutral wrist; the left grasp is preserved. Resident and elder binaries were preserved.

Nine raw exported GLB working poses passed the closed-handle interior test with zero sampled penetration. All six actual runtime asset scenarios then passed, including grip proximity. Source/GLB skin clouds matched within 0.00042 mm and dipper geometry within 0.000016 mm. Root fixed a runtime transition that blended an old free-hand finger pose into a physical grasp; the wrist-only contact correction could not repair those fingers.

Nearest triangle normals on a concave ring can report a negative local sign for a point outside the closed solid. Final carrier tests use closed-solid winding and surface proximity together. The hollow bowl remains an open surface and is not classified as a solid by local normals.

This evidence covers the listed poses and controller routes. It is not exhaustive continuous triangle collision certification or user visual acceptance. Exact sampled poses, current hashes, runtime coverage and limits are in [runtime-review.json](runtime-review.json).
