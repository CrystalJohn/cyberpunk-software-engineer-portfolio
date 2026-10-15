export function wrapIndex(index:number,count:number){
  return count>0?((index%count)+count)%count:0;
}
/** Signed circular distance, including fractional visual positions. */
export function missionOffset(index:number,position:number,count:number){
  if(count<=1)return 0;
  return wrapIndex(index-position+count/2,count)-count/2;
}
export function nearestPosition(position:number,index:number,count:number,direction=0){
  if(count<=1)return 0;
  const target=wrapIndex(index,count);
  let next=target+Math.round((position-target)/count)*count;
  if(Math.abs(Math.abs(next-position)-count/2)<.0001&&direction){
    next=position+Math.sign(direction)*count/2;
  }
  return next;
}
export function missionGeometry(width:number,cardWidth:number,coarse=false){
  const narrow=width<600;
  return {spacing:Math.min(width*(narrow?.58:.25),narrow?240:325),
    depth:narrow?115:185,rotation:coarse?20:narrow?24:34,
    centerZ:narrow?32:64,cardWidth};
}
export function missionPose(offset:number,geometry:ReturnType<typeof missionGeometry>,count=3){
  const distance=Math.abs(offset),focus=Math.max(0,1-distance);
  // A third card changes sides only at the outer circular seam; hide its surface there.
  const seam=count>2?Math.max(0,Math.min(1,(count/2-distance)/.28)):1;
  return {x:offset*geometry.spacing,y:distance*24,z:geometry.centerZ-distance*geometry.depth,
    rotationY:-Math.sign(offset)*geometry.rotation*Math.min(1,distance),
    scale:Math.max(.62,1-distance*.14),surfaceOpacity:(.72+.28*focus)*seam,
    emphasis:focus,info:Math.max(0,1-distance*2.2),zIndex:Math.round(100-distance*20)};
}
export function dragIntent(dx:number,dy:number){
  if(Math.max(Math.abs(dx),Math.abs(dy))<8)return 'pending';
  return Math.abs(dx)>Math.abs(dy)*1.25?'horizontal':'vertical';
}
export function snapPosition(position:number,velocity:number){
  const projected=position+Math.max(-.45,Math.min(.45,velocity*.16));
  return Math.round(projected);
}
