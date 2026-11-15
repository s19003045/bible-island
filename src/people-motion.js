const TAU = Math.PI * 2;
const clamp = n => Math.max(0,Math.min(1,n));
const smooth = n => {n=clamp(n);return n*n*(3-2*n);};
export const angleDelta = (from,to) => Math.atan2(Math.sin(to-from),Math.cos(to-from));

// Metre-scale, authored two-point routes. Dwell and turn at the ends rather than teleporting.
export function sampleWalk(route,time,speed=.65,mode='shuttle') {
  const [a,b]=route, distance=Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]);
  if(distance<.001) return {position:[...a],yaw:0,stride:0};
  const travel=distance/speed, dwell=2.4, cycle=2*(travel+dwell);
  const t=mode==='forward' ? Math.max(0,Math.min(travel,time)) : ((time%cycle)+cycle)%cycle, heading=Math.atan2(b[0]-a[0],b[2]-a[2]);
  let f,yaw=heading,stride=0;
  if(t<travel) {f=(1-Math.cos(Math.PI*t/travel))/2;stride=Math.sin(Math.PI*t/travel);}
  else if(mode==='forward') {f=1;}
  else if(t<travel+dwell) {f=1;yaw+=Math.PI*smooth((t-travel)/dwell);}
  else if(t<2*travel+dwell) {const u=(t-travel-dwell)/travel;f=(1+Math.cos(Math.PI*u))/2;yaw+=Math.PI;stride=Math.sin(Math.PI*u);}
  else {f=0;yaw+=Math.PI+Math.PI*smooth((t-2*travel-dwell)/dwell);}
  return {position:a.map((v,i)=>v+(b[i]-v)*f),yaw,stride};
}
export function createMotion(position,yaw=0,route=null,seed=0,routeMode='shuttle') {
  let routeTime=0;
  if(route) {
    const [a,b]=route, delta=b.map((v,i)=>v-a[i]),length=Math.hypot(...delta);
    const f=length ? clamp(position.reduce((sum,v,i)=>sum+(v-a[i])*delta[i],0)/(length*length)) : 0;
    routeTime=Math.acos(1-2*f)/Math.PI*length/.65;
  }
  return {position:[...position],yaw,route,routeMode,routeTime,time:seed*1.79,talking:false,stride:0};
}
export function advanceMotion(m,dt,cameraPosition) {
  if(dt<=0) return m;
  m.time+=dt;
  let targetYaw=m.yaw;
  if(m.talking||m.attending) {
    m.stride=Math.max(0,m.stride-dt*4);
    if(cameraPosition) targetYaw=Math.atan2(cameraPosition[0]-m.position[0],cameraPosition[2]-m.position[2]);
  } else if(m.route) {
    m.routeTime+=dt;
    const sample=sampleWalk(m.route,m.routeTime,.65,m.routeMode);
    m.position=sample.position;m.stride=sample.stride;targetYaw=sample.yaw;
  }
  m.yaw+=angleDelta(m.yaw,targetYaw)*Math.min(1,dt*5);
  m.yaw=((m.yaw%TAU)+TAU)%TAU;
  return m;
}
