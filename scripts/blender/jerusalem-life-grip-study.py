"""Bounded fixed-length carrier grip study. No source/build/asset edits.

blender --background --threads 4 --python scripts/blender/jerusalem-life-grip-study.py

Deterministic angular differential evolution uses conservative inflated-tube
clearance, then creates the builder's actual weighted skin tubes in a temporary
scene and tests their evaluated vertices against an actual closed handle BVH.
This is a static authored-pose study, not continuous-motion approval.
"""
import hashlib
import json
import math
import pathlib
import runpy

import bpy
import numpy as np
from mathutils import Vector

ROOT = pathlib.Path(__file__).resolve().parents[2]
BUILDER = ROOT/'scripts/blender/jerusalem-life.py'
W = np.array([.30, -.16, 1.005])
A = np.array([.205, 0, 1.35])
HANDLE = {'center': [.315, -.24, .875], 'radius_x': .07, 'radius_z': .068, 'tube_radius': .010}
LENGTHS = [.07235582221761747, .08311917532156703, .079722825623539, .06550594828762853]


def elbow_and_axis():
    # Source arm/forearm lengths read numerically from the reviewed fourth pose.
    # Preserve the common relaxed adult arm, not the fourth carrier's already
    # shortened forearm. The latter is a pose-authoring artifact, not a target.
    reviewed = json.loads((ROOT/'.qa/jerusalem-life/reviewer-anatomy-fourth/resident/audit.json').read_text())
    side = reviewed['sides']['R']
    elbow, wrist = np.array(side['elbow_world']), np.array(side['wrist_world'])
    l1, l2 = np.linalg.norm(elbow-A), np.linalg.norm(wrist-elbow)
    axis = W-A
    distance = np.linalg.norm(axis)
    axis /= distance
    pole = np.array([-.1, 1, -.15])
    pole -= axis*np.dot(pole, axis)
    pole /= np.linalg.norm(pole)
    along = (l1*l1-l2*l2+distance*distance)/(2*distance)
    E = A+axis*along+pole*math.sqrt(max(0, l1*l1-along*along))
    D = W-E
    D /= np.linalg.norm(D)
    return E, D, [l1, l2]


def ellipse_centerline_distance(points):
    """Nearest upper ellipse point; all studied fingers stay at the top arc."""
    cx, cy, cz = HANDLE['center']
    rx, rz = HANDLE['radius_x'], HANDLE['radius_z']
    x, y, z = points[..., 0]-cx, points[..., 1]-cy, points[..., 2]-cz
    theta = np.arctan2(z/rz, x/rx)
    theta = np.clip(theta, .15, math.pi-.15)
    for _ in range(7):
        c, s = np.cos(theta), np.sin(theta)
        ex, ez = rx*c, rz*s
        tx, tz = -rx*s, rz*c
        f = (ex-x)*tx+(ez-z)*tz
        df = tx*tx+tz*tz+(ex-x)*(-rx*c)+(ez-z)*(-rz*s)
        theta -= np.clip(f/np.maximum(df, 1e-7), -.3, .3)
    return np.sqrt((rx*np.cos(theta)-x)**2+y*y+(rz*np.sin(theta)-z)**2)


def paths_from_angles(angles, base, lengths):
    angle = np.cumsum(angles, axis=-1)*math.pi/180
    deltas = np.zeros((len(angles), 3, 3))
    deltas[:, :, 1] = -np.cos(angle)*lengths
    deltas[:, :, 2] = -np.sin(angle)*lengths
    return np.concatenate((np.broadcast_to(base, (len(angles), 1, 3)),
                           base+np.cumsum(deltas, axis=1)), axis=1)


def samples(paths):
    rows = []
    for i in range(31):
        q = i/10
        j = min(2, int(q))
        u = q-j
        rows.append(paths[:, j]*(1-u)+paths[:, j+1]*u)
    return np.stack(rows, axis=1)


def optimize_digit(index, base, total, seed):
    lengths = total*np.array([.43, .32, .25])
    radius = [.0076, .0078, .0073, .0062][index]
    t = np.linspace(0, 1, 31)
    radii = radius*(1-.28*t)+.0007*np.exp(-((t-.33)/.07)**2)+.00045*np.exp(-((t-.67)/.06)**2)
    lower, upper = np.array([10., 20., 15.]), np.array([80., 100., 100.])
    def fitness(angles):
        paths = paths_from_angles(angles, base, lengths)
        points = samples(paths)
        gap = ellipse_centerline_distance(points)-HANDLE['tube_radius']-radii
        violation = np.maximum(.00065-gap, 0)
        minimum = gap.min(axis=1)
        # Fixed length first; then prefer a close, articulated grip with fingers
        # reaching around the front and underneath, without folding backwards.
        cost = 5e8*np.sum(violation*violation, axis=1)
        cost += 2e6*(minimum-.00075)**2
        tip_target_y = -.242 if index == 3 else -.237
        cost += 2e4*(paths[:, -1, 1]-tip_target_y)**2
        cost += 2e4*np.maximum(paths[:, -1, 2]-.931, 0)**2
        cost += 2e4*np.maximum(gap[:, 20]-.004, 0)**2
        cost += 2e-5*(angles[:, 0]-30)**2
        absolute = np.cumsum(angles, axis=1)
        cost += .02*np.maximum(absolute[:, 1]-165, 0)**2
        cost += .02*np.maximum(absolute[:, 2]-230, 0)**2
        return cost
    rng = np.random.default_rng(seed)
    count = 180
    population = lower+rng.random((count, 3))*(upper-lower)
    score = fitness(population)
    for generation in range(240):
        best = population[score.argmin()]
        picks = np.array([rng.choice(count, 2, replace=False) for _ in range(count)])
        mutant = population+.65*(best-population)+.75*(population[picks[:, 0]]-population[picks[:, 1]])
        mutant = np.clip(mutant, lower, upper)
        mask = rng.random((count, 3)) < .80
        mask[np.arange(count), rng.integers(0, 3, count)] = True
        trial = np.where(mask, mutant, population)
        trial_score = fitness(trial)
        keep = trial_score < score
        population[keep], score[keep] = trial[keep], trial_score[keep]
    ordered = score.argsort()
    result = []
    for i in ordered[:12]:
        angles = population[i]
        path = paths_from_angles(angles[None, :], base, lengths)[0]
        gaps = ellipse_centerline_distance(samples(path[None, ...]))[0]-HANDLE['tube_radius']-radii
        result.append({'coordinates': path.tolist(), 'segment_lengths_m': lengths.tolist(),
                       'segment_length_sum_m': float(total), 'joint_angles_degrees': angles.tolist(),
                       'absolute_YZ_angles_degrees': np.cumsum(angles).tolist(),
                       'conservative_centerline_clearance_min_m': float(gaps.min()),
                       'fitness': float(score[i])})
    return result[0]


def actual_weighted_mesh_audit(helper, paths, D):
    scene = bpy.data.scenes.new('reviewer-grip-study-temporary')
    bpy.context.window.scene = scene
    data = bpy.data.armatures.new('reviewer-study-rig')
    rig = bpy.data.objects.new('reviewer-study-rig', data)
    scene.collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    hand = data.edit_bones.new('handR')
    hand.head, hand.tail = W, W+D*.11
    palm = Vector((0, D[2], -D[1]))
    if palm.z > 0:
        palm = -palm
    hand.align_roll(-palm)
    prop = data.edit_bones.new('propJug')
    prop.head, prop.tail = (.315, -.24, .55), (.315, -.24, .61)
    for j, path in enumerate(paths):
        previous = hand
        for k, suffix in enumerate('ABC'):
            bone = data.edit_bones.new('fingerR'+str(j)+suffix)
            bone.head, bone.tail, bone.parent = path[k], path[k+1], previous
            previous = bone
    bpy.ops.object.mode_set(mode='OBJECT')
    X = data.bones['handR'].matrix_local.to_3x3() @ Vector((1, 0, 0))
    material = bpy.data.materials.new('reviewer-study-skin')
    material.diffuse_color = (.5, .4, .3, 1)
    skin = helper['Surface']('carrier-arms-and-hands', material)
    for j, coords in enumerate(paths):
        radius = [.0076, .0078, .0073, .0062][j]
        path = [helper['linear_sample'](coords, i/30) for i in range(31)]
        radii = [radius*(1-.28*i/30)+.0007*math.exp(-((i/30-.33)/.07)**2)+.00045*math.exp(-((i/30-.67)/.06)**2) for i in range(31)]
        def weight(k, point, j=j):
            q = k/30*3
            index = min(2, int(q))
            u = helper['smooth']((q-index-.72)/.28)
            return helper['blend_weights']({'fingerR'+str(j)+'ABC'[index]: 1},
                                           {'fingerR'+str(j)+'ABC'[min(2, index+1)]: 1}, u)
        helper['tube'](skin, path, radii, weight, 20, frameX=X)
    skin.object(scene, rig)
    handle = helper['Surface']('carrier-jug-handle', material)
    cx, cy, cz = HANDLE['center']
    path = [(cx+HANDLE['radius_x']*math.cos(math.tau*i/64), cy,
             cz+HANDLE['radius_z']*math.sin(math.tau*i/64)) for i in range(65)]
    helper['tube'](handle, path, [(.01, .01)]*65, lambda j, p: {'propJug': 1}, 20, frameX=(0, 1, 0))
    handle.object(scene, rig)
    bpy.context.view_layer.update()
    reviewer = runpy.run_path(str(ROOT/'scripts/blender/jerusalem-life-anatomy-review.py'))
    return reviewer['evaluated_grip'](scene, bpy.context.evaluated_depsgraph_get(), 'carrier')


def main():
    source_text = BUILDER.read_text()
    loaded_sha = hashlib.sha256(source_text.encode()).hexdigest()
    helper = {'__name__': 'grip_study_readonly_helper', '__file__': str(BUILDER)}
    exec(compile(source_text, str(BUILDER), 'exec'), helper)
    E, D, arm_lengths = elbow_and_axis()
    common = W+D*.077
    digits = []
    for j, length in enumerate(LENGTHS):
        base = common.copy()
        base[0] += (j-1.5)*.0145
        digit = optimize_digit(j, base, length, 20261119+j)
        digits.append(digit)
        print('GRIP_STUDY_CANDIDATE', j, json.dumps(digit), flush=True)
    audit = actual_weighted_mesh_audit(helper, [d['coordinates'] for d in digits], D)
    report = {'scope': 'Authored static hypothetical grip; exact digit lengths, conservative centerline capsule clearance and actual evaluated LBS tube vertices. No continuous-motion claim.',
              'loaded_builder_sha256': loaded_sha, 'builder_unchanged_during_study': hashlib.sha256(BUILDER.read_bytes()).hexdigest() == loaded_sha,
              'shoulder': A.tolist(), 'wrist': W.tolist(), 'elbow': E.tolist(), 'forearm_direction': D.tolist(),
              'source_arm_segment_lengths_m': arm_lengths, 'handle': HANDLE, 'seed': 20261119,
              'digit_segment_length_ratios': [.43, .32, .25], 'digits': digits, 'actual_weighted_mesh_audit': audit,
              'thumb_scope': 'Not solved by the four-digit optimizer; thumb must remain on opposing +Y side of handle and receive its own actual surface audit. Do not reuse old-world thumb coordinates after moving wrist.',
              'not_validated': ['Thumb surface contact', 'Palm/handle overlap', 'Full triangle intersection', 'Motion and skinning away from the authored rest pose']}
    report['four_digit_vertex_gate_pass'] = all(d['inside_vertices_if_closed'] == 0 and d['nearest_surface_distance_m'] < .002
                                               for d in audit['digits'].values())
    output = ROOT/'assets/blender/jerusalem-life/review-grip-study.json'
    output.write_text(json.dumps(report, indent=2)+'\n')
    print('GRIP_STUDY_DONE', report['four_digit_vertex_gate_pass'], json.dumps(audit), flush=True)


if __name__ == '__main__':
    main()
