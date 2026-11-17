"""Read-only, evaluated-mesh renders of each isolated human rollout source.

blender --background --threads 4 --python scripts/blender/human-motion-review.py -- \
  --models resident-child,roman-woman --out .qa/human-rollout/review

The source .blend and GLB files are never saved, mutated or exported. Front/side
walk quartiles are rendered from the evaluated skinned meshes. Priest bearer
also receives front/side Idle frames: anatomical Walk is not scene permission.
"""
import argparse, hashlib, json, math, pathlib, struct, sys
import bpy
from mathutils import Vector

ROOT = pathlib.Path(__file__).resolve().parents[2]


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def cli():
    parser = argparse.ArgumentParser()
    parser.add_argument('--models', required=True)
    parser.add_argument('--out', default='.qa/human-rollout/review')
    parser.add_argument('--samples', type=int, default=20)
    parser.add_argument('--check-only', action='store_true')
    parser.add_argument('--original-comparison', action='store_true')
    parser.add_argument('--phases', default='0,.25,.5,.75')
    parser.add_argument('--views', default='front,side')
    parser.add_argument('--clips', default='Walk')
    parser.add_argument('--no-face', action='store_true')
    return parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])


def provenance(model, meta, source):
    glb = ROOT / 'public' / meta['file']
    data = glb.read_bytes()
    length, chunk_type = struct.unpack_from('<II', data, 12)
    assert chunk_type == 0x4e4f534a, 'Missing glTF JSON chunk'
    gltf = json.loads(data[20:20+length])
    extras = [(n.get('name'), n['extras']) for n in gltf['nodes']
              if 'base_model_id' in n.get('extras', {})]
    checks = {
        'source_sha256_matches_metadata': digest(source) == meta['editable_source']['sha256'],
        'glb_sha256_matches_metadata': digest(glb) == meta['sha256'],
        'glb_bytes_match_metadata': len(data) == meta['bytes'],
        'one_rig_identity': len(extras) == 1,
        'base_model_id_matches': len(extras) == 1 and extras[0][1]['base_model_id'] == model,
        'capture_source_matches': len(extras) == 1 and extras[0][1]['capture_source'] == meta['capture_source'],
        'motion_profile_matches': len(extras) == 1 and extras[0][1]['motion_profile'] == meta['motionProfile'],
        'nine_animation_names': [a['name'] for a in gltf['animations']] == meta['animations'],
    }
    return {'checks': checks, 'pass': all(checks.values()),
            'source_sha256': digest(source), 'glb_sha256': digest(glb),
            'glb_rig_extras': extras, 'animation_names': [a['name'] for a in gltf['animations']]}


def select_action(scene, rig, name):
    tracks = list(rig.animation_data.nla_tracks)
    for track in tracks:
        track.mute = True
    track = next(t for t in tracks if t.name == name)
    strip = track.strips[0]
    action = strip.action
    rig.animation_data.action = action
    return float(strip.action_frame_start), float(strip.action_frame_end)


def set_phase(scene, start, end, phase):
    frame = start + (end-start)*phase
    scene.frame_set(math.floor(frame), subframe=frame % 1)
    bpy.context.evaluated_depsgraph_get().update()


def studio(scene, height, samples):
    world = bpy.data.worlds.new('human-review-world')
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs[0].default_value = (.33, .37, .41, 1)
    world.node_tree.nodes['Background'].inputs[1].default_value = .5
    scene.world = world
    for pos, power, size in [((2,-3,4),500,4),((-3,-1,2),170,3),((1,3,3),260,3)]:
        data = bpy.data.lights.new('review-softbox', 'AREA')
        data.energy = power
        data.shape = 'DISK'
        data.size = size
        obj = bpy.data.objects.new('review-softbox', data)
        scene.collection.objects.link(obj)
        obj.location = pos
        obj.rotation_euler = (Vector((0,0,height*.5))-obj.location).to_track_quat('-Z','Y').to_euler()
    mesh = bpy.data.meshes.new('review-floor')
    mesh.from_pydata([(-5,-5,-.002),(5,-5,-.002),(5,5,-.002),(-5,5,-.002)], [], [(0,1,2,3)])
    floor = bpy.data.objects.new('review-floor', mesh)
    scene.collection.objects.link(floor)
    mat = bpy.data.materials.new('review-sand')
    mat.diffuse_color = (.27,.24,.19,1)
    floor.data.materials.append(mat)
    data = bpy.data.cameras.new('review-camera')
    camera = bpy.data.objects.new('review-camera', data)
    scene.collection.objects.link(camera)
    scene.camera = camera
    data.type = 'ORTHO'
    data.ortho_scale = height*1.22
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = samples
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 420
    scene.render.resolution_y = 560
    scene.render.resolution_percentage = 100
    scene.view_settings.view_transform = 'AgX'
    scene.render.image_settings.file_format = 'PNG'
    scene.render.film_transparent = False
    return camera


def render_model(model, args, out):
    meta_path = ROOT / 'assets/blender/human-rollout' / (model+'-motion.json')
    meta = json.loads(meta_path.read_text())
    source = ROOT / meta['editable_source']['file']
    before = digest(source)
    report = provenance(model, meta, source)
    if not report['pass']:
        raise RuntimeError('Provenance mismatch for '+model+': '+str(report['checks']))
    bpy.ops.wm.open_mainfile(filepath=str(source))
    scene = next(s for s in bpy.data.scenes if any(o.type == 'ARMATURE' for o in s.objects))
    bpy.context.window.scene = scene
    rig = next(o for o in scene.objects if o.type == 'ARMATURE')
    report['source_scene'] = scene.name
    report['actual_bone_names'] = list(rig.data.bones.keys())
    report['checks']['editable_bones_match_metadata'] = report['actual_bone_names'] == meta['bones']
    report['checks']['editable_rig_identity_matches'] = rig.get('base_model_id') == model
    report['checks']['editable_capture_source_matches'] = rig.get('capture_source') == meta['capture_source']
    report['pass'] = all(report['checks'].values())
    if not report['pass']:
        raise RuntimeError('Editable source mismatch for '+model+': '+str(report['checks']))
    report['renders'] = []
    if not args.check_only:
        height = meta['height_m']
        camera = studio(scene, height, args.samples)
        folder = out / model
        folder.mkdir(parents=True, exist_ok=True)
        clips = [(name,[float(x) for x in args.phases.split(',')])
                 for name in args.clips.split(',')]
        if model == 'priest-bearer' and 'Idle' not in args.clips.split(','):
            clips.append(('Idle',[0]))
        for clip, phases in clips:
            start, end = select_action(scene, rig, clip)
            for view, pos in [('front',(0,-height*3,height*.65)),
                              ('side',(height*3,-height*.10,height*.65))]:
                if view not in args.views.split(','):
                    continue
                camera.location = pos
                camera.rotation_euler = (Vector((0,0,height*.49))-camera.location).to_track_quat('-Z','Y').to_euler()
                for phase in phases:
                    set_phase(scene, start, end, phase)
                    path = folder / (clip.lower()+'-'+view+'-'+str(round(phase*100))+'.png')
                    scene.render.filepath = str(path)
                    bpy.ops.render.render(write_still=True)
                    report['renders'].append(str(path.relative_to(ROOT)))
        # Eyes/lids and held hand warrant closer inspection than full-body frames.
        if not args.no_face:
            start, end = select_action(scene, rig, 'Walk')
            set_phase(scene, start, end, .25)
            head = rig.matrix_world @ rig.pose.bones['head'].head
            camera.data.ortho_scale = height*.34
            camera.location = head + Vector((0,-height*2,height*.04))
            camera.rotation_euler = (head-camera.location).to_track_quat('-Z','Y').to_euler()
            path = folder / 'face-front-25.png'
            scene.render.filepath = str(path)
            bpy.ops.render.render(write_still=True)
            report['renders'].append(str(path.relative_to(ROOT)))
    report['source_unchanged_after_render'] = digest(source) == before
    report['review_status'] = 'Rendered; visual findings recorded separately after image inspection.'
    (out/(model+'-audit.json')).write_text(json.dumps(report,indent=2)+'\n')
    print('HUMAN_REVIEW_DONE',model,len(report['renders']),report['pass'],flush=True)


def original_comparison(model, args, out):
    meta = json.loads((ROOT/'assets/blender/human-rollout'/(model+'-motion.json')).read_text())
    original = ROOT/'public'/meta['original_file']
    data = original.read_bytes()
    n, _ = struct.unpack_from('<II',data,12)
    scene_name = json.loads(data[20:20+n])['scenes'][0]['name']
    sources = [('new',ROOT/meta['editable_source']['file'],None),
               ('original-v2',ROOT/'assets/blender/bible-assets.blend',scene_name)]
    report = {'model':model,'renders':[],'sources_unchanged':{}}
    folder = out/model/'original-comparison'
    folder.mkdir(parents=True,exist_ok=True)
    for label, source, wanted_scene in sources:
        before = digest(source)
        bpy.ops.wm.open_mainfile(filepath=str(source))
        scene = (bpy.data.scenes[wanted_scene] if wanted_scene else
                 next(s for s in bpy.data.scenes if any(o.type=='ARMATURE' for o in s.objects)))
        bpy.context.window.scene = scene
        rig = next(o for o in scene.objects if o.type=='ARMATURE')
        height = meta['height_m']
        camera = studio(scene,height,args.samples)
        for view,pos in [('front',(0,-height*3,height*.65)),
                         ('side',(height*3,-height*.10,height*.65))]:
            if view not in args.views.split(','):
                continue
            camera.location = pos
            camera.rotation_euler = (Vector((0,0,height*.49))-camera.location).to_track_quat('-Z','Y').to_euler()
            for clip,phases in [('Idle',[0]),('Walk',[float(x) for x in args.phases.split(',')])]:
                start,end = select_action(scene,rig,clip)
                for phase in phases:
                    set_phase(scene,start,end,phase)
                    path = folder/(label+'-'+clip.lower()+'-'+view+'-'+str(round(phase*100))+'.png')
                    scene.render.filepath = str(path)
                    bpy.ops.render.render(write_still=True)
                    report['renders'].append(str(path.relative_to(ROOT)))
        report['sources_unchanged'][label] = digest(source)==before
    (out/(model+'-original-comparison-audit.json')).write_text(json.dumps(report,indent=2)+'\n')
    print('HUMAN_ORIGINAL_COMPARISON_DONE',model,len(report['renders']),flush=True)


def main():
    args = cli()
    out = pathlib.Path(args.out)
    if not out.is_absolute():
        out = ROOT / out
    out.mkdir(parents=True, exist_ok=True)
    models = (sorted(p.name.removesuffix('-motion.json') for p in
                     (ROOT/'assets/blender/human-rollout').glob('*-motion.json'))
              if args.models == 'all' else args.models.split(','))
    for model in models:
        if args.original_comparison:
            original_comparison(model.strip(), args, out)
        else:
            render_model(model.strip(), args, out)


if __name__ == '__main__':
    main()
