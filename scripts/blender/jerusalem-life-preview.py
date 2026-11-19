"""Read-only evaluated-mesh renders for new Jerusalem-life sources."""
import bpy,pathlib,runpy,sys,math,json,hashlib
from mathutils import Vector
ROOT=pathlib.Path(__file__).resolve().parents[2];R=runpy.run_path(str(ROOT/'scripts/blender/human-motion-review.py'))

def main():
 args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [];roles=args[args.index('--roles')+1].split(',') if '--roles' in args else ['resident','carrier','elder'];geometry='--geometry' in args;out=ROOT/'.qa/jerusalem-life/review';out.mkdir(parents=True,exist_ok=True)
 for role in roles:
  path=ROOT/('.qa/jerusalem-life/'+role+'-geometry.blend' if geometry else 'assets/blender/jerusalem-life/'+role+'.blend');before=hashlib.sha256(path.read_bytes()).hexdigest();bpy.ops.wm.open_mainfile(filepath=str(path));scene=bpy.context.scene;rig=next(o for o in scene.objects if o.type=='ARMATURE')
  for o in scene.objects:
   if o.get('work_only'):o.hide_render=True
  camera=R['studio'](scene,1.71,24);scene.render.resolution_x=600;scene.render.resolution_y=800
  folder=out/role;folder.mkdir(exist_ok=True);images=[]
  for view,pos in [('front',(0,-5.1,1.12)),('side',(5.1,-.20,1.12)),('three-quarter',(3.2,-4.1,1.12))]:
   camera.data.ortho_scale=2.08;camera.location=pos;camera.rotation_euler=(Vector((0,0,.84))-camera.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(folder/('geometry-'+view+'.png'));bpy.ops.render.render(write_still=True);images.append(scene.render.filepath)
  for label,center,scale in [('face',Vector((0,-.02,1.59)),.32),('hand',rig.data.bones['handR'].head_local+Vector((0,0,-.06)),.29)]:
   camera.data.ortho_scale=scale;camera.location=center+Vector((.25,-1.5,.09));camera.rotation_euler=(center-camera.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(folder/('geometry-'+label+'.png'));bpy.ops.render.render(write_still=True);images.append(scene.render.filepath)
  assert before==hashlib.sha256(path.read_bytes()).hexdigest();(folder/'render.json').write_text(json.dumps({'source':str(path.relative_to(ROOT)),'source_sha256':before,'images':images,'source_unchanged':True},indent=2));print('LIFE_PREVIEW',role,images,flush=True)
if __name__=='__main__':main()
