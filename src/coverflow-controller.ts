import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {missionGeometry,missionOffset,missionPose,nearestPosition} from './coverflow-layout';

export interface CoverflowMotion {
  select:(index:number,direction?:number,instant?:boolean)=>void;
  beginDrag:()=>number;
  drag:(position:number)=>void;
  position:()=>number;
  spacing:()=>number;
  settle:()=>void;
  resize:()=>void;
  destroy:()=>void;
}
export interface MotionOptions {
  root:HTMLElement;viewport:HTMLElement;index:number;entered:boolean;
  onEntered:()=>void;
}
const accents=['#93caff','#44e7dc','#da83ff'];

/** One renderer writes card poses. The 3D scene itself is never opacity-animated. */
export function createCoverflowMotion({root,viewport,index,entered,onEntered}:MotionOptions):CoverflowMotion {
  gsap.registerPlugin(ScrollTrigger);
  const cards=Array.from(root.querySelectorAll<HTMLElement>('.archive-card'));
  if(!cards.length||viewport.clientWidth<=0)throw new Error('Coverflow needs measurable cards.');
  const nodes=[root,...cards,...Array.from(root.querySelectorAll<HTMLElement>('.archive-surface,.archive-info,.archive-emphasis,.archive-reflection,.archive-backdrop,.archive-scan,.archive-floor,.archive-glow'))];
  const snapshots=new Map(nodes.map(node=>[node,node.getAttribute('style')]));
  const previousEnhanced=root.getAttribute('data-enhanced');
  let destroyed=false,context:gsap.Context|undefined,transition:gsap.core.Timeline|undefined,entry:gsap.core.Timeline|undefined;
  let geometry=measure();
  const model={position:index,intro:entered?0:1};
  const setters=cards.map(card=>({
    x:gsap.quickSetter(card,'x','px'),y:gsap.quickSetter(card,'y','px'),z:gsap.quickSetter(card,'z','px'),
    rotate:gsap.quickSetter(card,'rotationY','deg'),scale:gsap.quickSetter(card,'scale'),
    surface:gsap.quickSetter(card.querySelector('.archive-surface'),'opacity'),
    info:gsap.quickSetter(card.querySelector('.archive-info'),'opacity'),
    emphasis:gsap.quickSetter(card.querySelector('.archive-emphasis'),'opacity'),
    reflection:gsap.quickSetter(card.querySelector('.archive-reflection'),'opacity')
  }));
  function measure(){return missionGeometry(viewport.clientWidth,cards[0].offsetWidth,matchMedia('(pointer: coarse)').matches)}
  function render(){
    if(destroyed)return;
    cards.forEach((card,i)=>{
      const pose=missionPose(missionOffset(i,model.position,cards.length),geometry,cards.length),s=setters[i];
      s.x(pose.x);s.y(pose.y+model.intro*22);s.z(pose.z-model.intro*180);s.rotate(pose.rotationY);s.scale(pose.scale);
      s.surface(pose.surfaceOpacity*(1-model.intro));s.info(pose.info);s.emphasis(pose.emphasis);
      s.reflection(pose.surfaceOpacity*.16*(1-model.intro));
      card.style.zIndex=String(pose.zIndex);
    });
  }
  function finishEntry(){
    if(entry){entry.scrollTrigger?.kill();entry.kill();entry=undefined}
    if(model.intro){model.intro=0;onEntered();render()}
  }
  function destroy(){
    if(destroyed)return;
    destroyed=true;transition?.kill();entry?.scrollTrigger?.kill();entry?.kill();context?.revert();
    for(const [node,style] of snapshots){if(style===null)node.removeAttribute('style');else node.setAttribute('style',style)}
    if(previousEnhanced===null)root.removeAttribute('data-enhanced');else root.setAttribute('data-enhanced',previousEnhanced);
  }
  try {
    context=gsap.context(()=>{},root);
    let setupFailed=false,setupError:unknown;
    context.add(()=>{
      try {
      root.dataset.enhanced='true';
      gsap.set(cards,{force3D:true});
      geometry=measure();render();
      if(!entered){
        entry=gsap.timeline({onStart:onEntered,scrollTrigger:{id:'mission-archive-entry',trigger:root,start:'top 76%',once:true}})
          .addLabel('scan',0)
          .fromTo(root.querySelector('.archive-scan'),{opacity:0,y:-160},{opacity:.6,y:290,duration:.6,ease:'power3.out'},'scan')
          .to(root.querySelector('.archive-scan'),{opacity:0,duration:.18},.58)
          .addLabel('depth',.1)
          .to(model,{intro:0,duration:.86,ease:'power3.out',onUpdate:render},'depth');
      }
      // Exit belongs only to decorative environment; interactive cards never recede/fade.
      gsap.to(root.querySelectorAll('.archive-floor,.archive-glow'),{opacity:.3,ease:'none',scrollTrigger:{
        id:'mission-archive-atmosphere',trigger:root,start:'bottom 75%',end:'bottom 15%',scrub:true}});
      } catch(error){setupFailed=true;setupError=error}
    });
    // Let context.add restore GSAP's global context before propagating failure.
    if(setupFailed)throw setupError;
  } catch(error){destroy();throw error}
  return {
    select(next,direction=0,instant=false){
      if(destroyed)return;
      finishEntry();transition?.kill();
      const target=nearestPosition(model.position,next,cards.length,direction);
      transition=gsap.timeline({defaults:{duration:instant?0:.76,ease:'power3.inOut'}})
        .to(model,{position:target,onUpdate:render},0)
        .to(root,{'--mission-accent':accents[next%accents.length]},0);
    },
    beginDrag(){finishEntry();transition?.kill();return model.position},
    drag(position){if(!destroyed){model.position=position;render()}},
    position:()=>model.position,spacing:()=>geometry.spacing,
    settle(){finishEntry();transition?.progress(1);transition?.kill();render()},
    resize(){if(!destroyed){geometry=measure();render()}},
    destroy
  };
}
