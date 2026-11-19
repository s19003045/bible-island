"""Offline actual-skin correction for the three carrier work contact clips.

This authors finger joint poses, never changes a limb length or prop geometry.
The helper evaluates the real linear-blended weighted vertices against the
analytic centreline of the exported polygonal closed handles. Final exported
GLB surfaces are independently tested by the runtime BVH regression.
"""
import bpy,runpy,pathlib,json,math,hashlib,sys,numpy as np
from mathutils import Matrix,Vector,Quaternion
ROOT=pathlib.Path(__file__).resolve().parents[2]
M=runpy.run_path(str(ROOT/'scripts/blender/jerusalem-life-motion.py'))
META=ROOT/'assets/blender/jerusalem-life'

class Calibrator:
 def __init__(self,scene,rig,c):
  self.rig,self.c=rig,c;obj=scene.objects['carrier-arms-and-hands'];names={g.index:g.name for g in obj.vertex_groups};self.groups={}
  for v in obj.data.vertices:
   name=names[max(v.groups,key=lambda x:x.weight).group]
   if not name.startswith(('handL','fingerL','thumbL','fingerR','thumbR')):continue
   group=name[:-1] if name.startswith(('finger','thumb')) else name
   self.groups.setdefault(group,[]).append((np.array([*v.co,1]),{names[g.group]:g.weight for g in v.groups}))
  self.data={}
  for group,rows in self.groups.items():
   self.data[group]=[]
   for n in set(n for _,w in rows for n in w):
    ids=[i for i,(_,w) in enumerate(rows) if n in w];self.data[group].append((n,np.array(ids),np.array([rows[i][0] for i in ids]),np.array([rows[i][1][n] for i in ids])))
 def world(self,group,mats=None):
  out=np.zeros((len(self.groups[group]),3));r=self.rig
  for n,ids,v,w in self.data[group]:
   D=np.array((mats[n] if mats and n in mats else r.pose.bones[n].matrix)@r.data.bones[n].matrix_local.inverted());out[ids]+=(v@D.T)[:,:3]*w[:,None]
  return out
 def gap(self,points,prop):
  r=self.rig;D=r.pose.bones[prop].matrix@r.data.bones[prop].matrix_local.inverted();V=np.c_[points,np.ones(len(points))]@np.array(D.inverted()).T
  cx,cy,cz,rx,rz,radius=(.315,-.24,.875,.07,.068,.010) if prop=='propJug' else (-.244,-.40,.617,.023,.026,.0048)
  x,y,z=V[:,0]-cx,V[:,1]-cy,V[:,2]-cz;t=np.arctan2(z/rz,x/rx)
  for _ in range(7):
   co,si=np.cos(t),np.sin(t);ex,ez=rx*co,rz*si;tx,tz=-rx*si,rz*co;f=(ex-x)*tx+(ez-z)*tz;df=tx*tx+tz*tz+(ex-x)*(-rx*co)+(ez-z)*(-rz*si);t-=np.clip(f/np.where(abs(df)<1e-9,1e-9,df),-.3,.3)
  return np.sqrt((rx*np.cos(t)-x)**2+y*y+(rz*np.sin(t)-z)**2)-radius
 def finger(self,group,prop,previous=None):
  r=self.rig;names=[group+x for x in 'ABC'];parent=r.pose.bones[names[0]].parent.name;local={n:r.pose.bones[n].parent.matrix.inverted()@r.pose.bones[n].matrix for n in names};base=r.pose.bones[parent].matrix.copy();left='L' in group;thumb=group.startswith('thumb');dims=9 if thumb and left else 3
  palm=-(self.c['hand_rest']['L'].to_3x3()@Vector((0,0,1)))
  axes={n:(r.data.bones[n].matrix_local.to_3x3().inverted()@((r.data.bones[n].tail_local-r.data.bones[n].head_local).normalized().cross(palm).normalized()) if left else Vector((1,0,0))) for n in names}
  def matrices(a):
   out={parent:base};prev=parent
   for k,n in enumerate(names):
    if dims==9:Q=Quaternion((1,0,0),float(a[k*3]))@Quaternion((0,1,0),float(a[k*3+1]))@Quaternion((0,0,1),float(a[k*3+2]))
    else:Q=Quaternion(axes[n],float(a[k]))
    out[n]=out[prev]@local[n]@Q.to_matrix().to_4x4();prev=n
   return out
  def fitness(a):
   g=self.gap(self.world(group,matrices(a)),prop);v=np.maximum(.0010-g,0)
   return float(2e8*np.sum(v*v)+2e6*(g.min()-.00105)**2+np.mean(a*a)*.025+(np.mean((a-previous)**2)*12 if previous is not None else 0))
  low=np.full(dims,-.24 if left else -.32);high=np.array([1.5,1.8,1.4] if left and dims==3 else [.85]*dims if dims==9 else [.32]*3)
  initials=[np.zeros(dims)]
  if previous is not None:initials.append(previous)
  if left and not thumb:initials.extend([np.array([.5,.9,.5]),np.array([1,1.4,.8])])
  best=(1e20,None)
  for initial in initials:
   a=np.clip(initial,low,high);score=fitness(a)
   for step in ([.24,.12,.06,.025,.012,.006] if left else [.12,.06,.03,.015,.007]):
    for _ in range(12):
     better=(score,a)
     for k in range(dims):
      for sign in [-1,1]:
       b=a.copy();b[k]=np.clip(b[k]+sign*step,low[k],high[k]);cost=fitness(b)
       if cost<better[0]:better=(cost,b)
     if better[0]>=score:break
     score,a=better
   if score<best[0]:best=(score,a)
  a=best[1];mats=matrices(a)
  for n in names:r.pose.bones[n].matrix=mats[n];bpy.context.view_layer.update()
  return a,float(self.gap(self.world(group),prop).min())
 def palm(self,previous=None):
  r=self.rig;hand=r.pose.bones['handL'].matrix.copy();points=self.world('handL');prop='propDipper'
  def fitness(d):
   g=self.gap(points+d,prop)
   return np.sum(np.maximum(.0012-g,0)**2)*1e9+np.sum(d*d)*200+1e5*(g.min()-.0012)**2+(np.sum((d-previous)**2)*10000 if previous is not None else 0)
  best=(1e20,None)
  for initial in ([previous] if previous is not None else [np.array([0.,.02,0.])]):
   a=initial.copy();score=fitness(a)
   for step in [.01,.005,.002,.001,.0005]:
    for _ in range(15):
     better=(score,a)
     for k in range(3):
      for sign in [-1,1]:
       b=a.copy();b[k]=np.clip(b[k]+sign*step,.001 if k==1 else -.035,.035);cost=fitness(b)
       if cost<better[0]:better=(cost,b)
     if better[0]>=score:break
     score,a=better
   if score<best[0]:best=(score,a)
  a=best[1];W=hand.translation+Vector(a);Rh=hand.to_3x3();direction=Rh@Vector((0,1,0));normal=-(Rh@Vector((0,0,1)));A=M['parent_head'](r,'armL');E=W-direction*r.data.bones['forearmL'].length
  joint=M['arm_solve'](r,'L',W,normal,direction,max_wrist_angle=math.pi,bend_hint=E-A)
  return a,joint

def main():
 source=ROOT/'.qa/jerusalem-life/carrier-motion-draft.blend';bpy.ops.wm.open_mainfile(filepath=str(source));scene=bpy.context.scene;rig=next(o for o in scene.objects if o.type=='ARMATURE');rig.animation_data.action=None
 for t in rig.animation_data.nla_tracks:t.mute=True
 c=M['config'](scene,rig,'carrier');c['skip_grip_calibration']=True;m=M['new_motion'](c,{});cal=Calibrator(scene,rig,c);path=META/'carrier-grip-calibration.json';result=json.loads(path.read_text())['clips'] if path.exists() else {};selected=sys.argv[sys.argv.index('--clips')+1].split(',') if '--clips' in sys.argv else ['SetDown','PickUp','Fill']
 for name in selected:
  rows=[];previous={};lastShift=None
  for i in range(41):
   u=i/40;M['pose_clip'](scene,rig,m,name,u,M['clip_spec'](name,m));side='L' if name=='Fill' else 'R';q=1-u if name=='PickUp' else u;active=.10<=u<=.90 if side=='L' else .025<=q<=.80
   row={'u':u,'fingers':{},'minimum_clearance_m':{},'handShiftBlender':[0,0,0]}
   if active:
    if side=='L':
     shift,joint=cal.palm(lastShift);lastShift=shift;row['handShiftBlender']=[float(x) for x in shift];row['wristAngleRadians']=joint['wrist_angle_rad'];row['minimum_clearance_m']['handL']=float(cal.gap(cal.world('handL'),'propDipper').min())
     for group in cal.groups:
      if group.startswith(('fingerL','thumbL')):
       for suffix in 'ABC':rig.pose.bones[group+suffix].rotation_quaternion=Quaternion()
     bpy.context.view_layer.update()
    for group in cal.groups:
     if not group.startswith(('finger'+side,'thumb'+side)):continue
     a,minimum=cal.finger(group,'propDipper' if side=='L' else 'propJug',previous.get(group));previous[group]=a;row['minimum_clearance_m'][group]=minimum
     for suffix in 'ABC':row['fingers'][group+suffix]=list(rig.pose.bones[group+suffix].rotation_quaternion)
   rows.append(row);print('CALIBRATE',name,u,min(row['minimum_clearance_m'].values(),default=0),flush=True)
  result[name]=rows
 path.write_text(json.dumps({'schema_version':1,'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'method':'Authored per-phase real weighted-mesh hand clearance and physical joint-flexion calibration; final GLB independently BVH-tested. Quaternions are Blender WXYZ bone-local.','clips':result},indent=2)+'\n')
 print('CALIBRATION',path,flush=True)
if __name__=='__main__':main()
