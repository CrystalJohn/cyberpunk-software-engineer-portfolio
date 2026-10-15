import React,{useLayoutEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,ArrowUpRight,Crosshair} from 'lucide-react';
import {missions} from './data';
import {dragIntent,snapPosition,wrapIndex} from './coverflow-layout';
import type {CoverflowMotion} from './coverflow-controller';
import './archive.css';

const accents=['#93caff','#44e7dc','#da83ff'];
const covers=['/artwork/atelier.webp','/artwork/pbms.webp','/artwork/forgeos.webp'];
type Gesture={id:number;x:number;y:number;lastX:number;lastTime:number;origin:number;velocity:number;phase:'pending'|'horizontal'};

export function MissionArchive({reduced,onOpen}:{reduced:boolean;onOpen:(index:number)=>void}){
  const [active,setActive]=useState(0),[enhanced,setEnhanced]=useState(false);
  const root=useRef<HTMLElement>(null),viewport=useRef<HTMLDivElement>(null),track=useRef<HTMLDivElement>(null);
  const selected=useRef(0),engine=useRef<CoverflowMotion|null>(null),entered=useRef(false);
  const gesture=useRef<Gesture|null>(null),scrollTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  const suppressed=useRef<{until:number;x:number;y:number}|null>(null);

  function flatScroll(index:number){
    const list=track.current,card=list?.querySelectorAll<HTMLElement>('.archive-card')[index];
    if(list&&card)list.scrollTo({left:card.offsetLeft+card.offsetWidth/2-list.clientWidth/2,behavior:'auto'});
  }
  function commit(index:number,direction=0,scroll=true){
    const next=wrapIndex(index,missions.length);
    const focused=document.activeElement as HTMLElement|null;
    const focusedCard=focused?.closest('.archive-card');
    if(enhanced&&focusedCard&&Array.from(track.current?.children||[]).indexOf(focusedCard)!==next){
      viewport.current?.focus({preventScroll:true});
    }
    selected.current=next;setActive(next);
    if(engine.current)engine.current.select(next,direction);
    else if(scroll)flatScroll(next);
  }
  function releaseCapture(id:number){
    try{if(viewport.current?.hasPointerCapture?.(id))viewport.current.releasePointerCapture(id)}catch{/* The browser may already have released a cancelled pointer. */}
  }
  function cancelGesture(){
    const current=gesture.current;gesture.current=null;
    if(current){releaseCapture(current.id);if(current.phase==='horizontal')engine.current?.select(selected.current)}
    root.current?.removeAttribute('data-dragging');
  }

  useLayoutEffect(()=>{
    const section=root.current!,gallery=viewport.current!;
    let disposed=false,loading=false,failed=false,frame=0;
    setEnhanced(false);
    const eligible=()=>!reduced&&window.innerHeight>=560&&gallery.clientWidth>=360;
    const stop=()=>{cancelGesture();engine.current?.destroy();engine.current=null;if(!disposed){setEnhanced(false);flatScroll(selected.current)}};
    async function reconcile(){
      if(disposed)return;
      if(!eligible()){stop();return}
      if(engine.current){if(gesture.current)cancelGesture();engine.current.resize();return}
      if(loading||failed)return;
      loading=true;
      try{
        // Even an unavailable GSAP chunk must leave the ordinary project list usable.
        const {createCoverflowMotion}=await import('./coverflow-controller');
        if(disposed||!eligible())return;
        engine.current=createCoverflowMotion({root:section,viewport:gallery,index:selected.current,entered:entered.current,
          onEntered:()=>{entered.current=true}});
        setEnhanced(true);
      }catch{
        failed=true;engine.current?.destroy();engine.current=null;
        section.removeAttribute('data-enhanced');if(!disposed)setEnhanced(false);
      }finally{loading=false}
    }
    const schedule=()=>{if(!disposed&&!frame)frame=requestAnimationFrame(()=>{frame=0;void reconcile()})};
    const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(schedule):null;
    observer?.observe(gallery);
    const coarse=matchMedia('(pointer: coarse)');
    coarse.addEventListener('change',schedule);window.addEventListener('resize',schedule);
    // Font completion can change geometry, but may arrive after unmount.
    document.fonts?.ready.then(schedule).catch(()=>{});
    void reconcile();
    return()=>{
      disposed=true;cancelAnimationFrame(frame);clearTimeout(scrollTimer.current);
      observer?.disconnect();coarse.removeEventListener('change',schedule);window.removeEventListener('resize',schedule);
      stop();suppressed.current=null;
    };
  },[reduced]);

  function pointerDown(e:React.PointerEvent<HTMLDivElement>){
    if(e.isPrimary===false)return;
    suppressed.current=null;
    if(!engine.current||(e.pointerType==='mouse'&&e.button!==0)||
      (e.target as Element).closest('button:not(.archive-select),a,input,textarea,select,[contenteditable="true"]'))return;
    gesture.current={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastTime:e.timeStamp,
      origin:engine.current.position(),velocity:0,phase:'pending'};
  }
  function pointerMove(e:React.PointerEvent<HTMLDivElement>){
    const current=gesture.current,motion=engine.current;
    if(!current||!motion||current.id!==e.pointerId)return;
    const dx=e.clientX-current.x,dy=e.clientY-current.y;
    if(current.phase==='pending'){
      const intent=dragIntent(dx,dy);
      if(intent==='pending')return;
      if(intent==='vertical'){gesture.current=null;return}
      current.phase='horizontal';current.origin=motion.beginDrag();
      try{e.currentTarget.setPointerCapture(e.pointerId)}catch{/* Capture is best effort on synthetic/older pointers. */}
      root.current?.setAttribute('data-dragging','true');
    }
    e.preventDefault();
    const elapsed=Math.max(1,e.timeStamp-current.lastTime);
    current.velocity=-(e.clientX-current.lastX)/motion.spacing()/elapsed*1000;
    current.lastTime=e.timeStamp;current.lastX=e.clientX;
    motion.drag(current.origin-dx/motion.spacing());
  }
  function pointerUp(e:React.PointerEvent<HTMLDivElement>){
    const current=gesture.current;
    if(!current||current.id!==e.pointerId)return;
    gesture.current=null;root.current?.removeAttribute('data-dragging');releaseCapture(e.pointerId);
    if(current.phase==='horizontal'&&engine.current){
      const velocity=e.timeStamp-current.lastTime>100?0:current.velocity;
      const position=engine.current.position(),target=snapPosition(position,velocity);
      suppressed.current={until:Date.now()+450,x:e.clientX,y:e.clientY};
      commit(target,Math.sign(target-position));
    }
  }
  function keyDown(e:React.KeyboardEvent<HTMLDivElement>){
    if((e.target as Element).closest('input,textarea,select,[contenteditable="true"]'))return;
    const delta=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;
    if(!delta&&e.key!=='Home'&&e.key!=='End')return;
    e.preventDefault();cancelGesture();
    commit(delta?selected.current+delta:e.key==='Home'?0:missions.length-1,delta);
  }
  function fallbackScroll(){
    if(engine.current)return;
    clearTimeout(scrollTimer.current);
    scrollTimer.current=setTimeout(()=>{
      const list=track.current;if(!list||engine.current||list.scrollWidth<=list.clientWidth)return;
      const center=list.scrollLeft+list.clientWidth/2;
      const cards=Array.from(list.querySelectorAll<HTMLElement>('.archive-card'));
      const nearest=cards.reduce((best,card,i)=>Math.abs(card.offsetLeft+card.offsetWidth/2-center)<
        Math.abs(cards[best].offsetLeft+cards[best].offsetWidth/2-center)?i:best,0);
      if(nearest!==selected.current)commit(nearest,0,false);
    },80);
  }
  function openMission(index:number){commit(index);engine.current?.settle();onOpen(index)}

  return <section id="projects" ref={root} className="section mission-archive" aria-labelledby="archive-heading" data-motion-status={enhanced?'ready':'fallback'}>
    <div className="archive-backdrop" aria-hidden="true"><div className="archive-architecture"/><div className="archive-ambient"/><div className="archive-floor"/><div className="archive-orbit"/><div className="archive-glow"/><div className="archive-scan"/></div>
    <div className="archive-heading"><div className="archive-kicker"><span>03 / MISSION ARCHIVE</span><span className="archive-hud"><i/> THREE SYSTEMS. ONE ENGINEER.</span></div><h2 id="archive-heading"><span className="archive-title-text">SELECT YOUR NEXT</span><br/><span className="archive-gradient">MISSION.</span></h2><div className="archive-headline"><p>Explore the systems, experiences, and engineering challenges I’ve built.</p></div></div>
    <div className="archive-recede"><div ref={viewport} className="archive-viewport" tabIndex={0} role="region" aria-roledescription="carousel" aria-label="Engineering missions" aria-describedby="archive-instructions" onKeyDown={keyDown}
      onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp}
      onPointerCancel={cancelGesture} onLostPointerCapture={e=>{if(gesture.current?.id===e.pointerId)cancelGesture()}}
      onPointerLeave={()=>{if(gesture.current?.phase==='pending')gesture.current=null}}
      onClickCapture={e=>{const blocked=suppressed.current;if(blocked&&e.detail>0&&Date.now()<blocked.until&&
        Math.abs(e.clientX-blocked.x)<24&&Math.abs(e.clientY-blocked.y)<24){e.preventDefault();e.stopPropagation();suppressed.current=null}}}>
      <div ref={track} className="archive-arrival" onScroll={fallbackScroll}>{missions.map((m,i)=><article key={m.id} className={`archive-card archive-art-${m.art}`} data-active={active===i} role="group" aria-roledescription="slide" aria-label={`Mission ${m.id}: ${m.title}, ${i+1} of ${missions.length}`} style={{'--card-accent':accents[i%accents.length]} as React.CSSProperties}>
        <div className="archive-reflection" style={{backgroundImage:`url(${covers[i%covers.length]})`}} aria-hidden="true"/>
        <div className="archive-surface"><div className="archive-emphasis" aria-hidden="true"/>
          <img className="archive-cover" src={covers[i%covers.length]} alt={`${m.title} — AI-generated project concept artwork`} width="1086" height="1448" loading="lazy" decoding="async" draggable={false}/>
          <div className="archive-cover-shade" aria-hidden="true"/>
          <div className="archive-card-top"><span><Crosshair size={13}/> MISSION {m.id}</span><span>CONCEPT ART</span></div>
          <div className="archive-card-title"><span>{m.type}</span><h3>{m.title}</h3><p>{m.subtitle}</p></div>
          <div className="archive-info" inert={enhanced&&active!==i} aria-hidden={enhanced&&active!==i?true:undefined}><div className="tags">{m.stack.map(s=><span key={s}>{s}</span>)}</div><button className="archive-explore" onClick={()=>openMission(i)}>EXPLORE MISSION <span className="archive-sr-only">{m.title}</span><ArrowUpRight size={18}/></button></div>
        </div>
        <button className="archive-select" hidden={!enhanced||active===i} aria-label={`Select mission ${m.id}: ${m.title}`} onClick={()=>commit(i)}/>
      </article>)}</div>
      <span className="archive-axis archive-hud" aria-hidden="true">X — 00 / Y — 03 / Z — 01</span>
    </div></div>
    <div className="archive-controls" onKeyDown={keyDown}><button className="archive-arrow" aria-label="Previous mission" disabled={missions.length<2} onClick={()=>{cancelGesture();commit(selected.current-1,-1)}}><ArrowLeft size={20}/></button><div className="archive-position"><span>MISSION SELECT</span><div>{missions.map((m,i)=><button key={m.id} aria-label={`Select ${m.title}`} aria-current={active===i?'true':undefined} onClick={()=>{cancelGesture();commit(i)}}>{m.id}</button>)}</div></div><button className="archive-arrow" aria-label="Next mission" disabled={missions.length<2} onClick={()=>{cancelGesture();commit(selected.current+1,1)}}><ArrowRight size={20}/></button></div>
    <div className="archive-footer"><span className="archive-announcement" role="status" aria-live="polite" aria-atomic="true">{missions[active].title} / {active+1} OF {missions.length}</span><span id="archive-instructions" className="archive-hint">{enhanced?'DRAG / SWIPE':'SCROLL / SWIPE'} OR USE ARROWS <span>← → · HOME / END</span></span><span>ARCHIVE CONTENT / EDITABLE SHOWCASE DRAFTS</span></div>
  </section>;
}
