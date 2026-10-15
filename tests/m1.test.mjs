import assert from 'node:assert/strict';
import {test,after} from 'node:test';
import {readFile} from 'node:fs/promises';
import {Window} from 'happy-dom';
import React,{act,StrictMode} from 'react';
await import('../scripts/build-m1-tests.mjs');
const {wrapIndex,missionOffset,nearestPosition,missionGeometry,missionPose,dragIntent,snapPosition}=await import('../.m1-tests/layout.mjs');
const window=new Window({url:'http://localhost'});
for(const key of ['window','document','HTMLElement','Element','Node','Event','MouseEvent','PointerEvent','KeyboardEvent','MutationObserver'])globalThis[key]=key==='window'?window:window[key];
Object.defineProperty(globalThis,'navigator',{configurable:true,value:window.navigator});
globalThis.getComputedStyle=window.getComputedStyle.bind(window);
globalThis.requestAnimationFrame=window.requestAnimationFrame.bind(window);
globalThis.cancelAnimationFrame=window.cancelAnimationFrame.bind(window);
globalThis.matchMedia=window.matchMedia.bind(window);
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
let width=1440;
window.innerHeight=900;window.innerWidth=1440;
Object.defineProperties(window.HTMLElement.prototype,{
 clientWidth:{configurable:true,get(){return this.classList?.contains('archive-viewport')||this.classList?.contains('archive-arrival')?width:360}},
 scrollWidth:{configurable:true,get(){return this.classList?.contains('archive-arrival')?1152:width}},
 offsetWidth:{configurable:true,get(){return this.classList?.contains('archive-card')?360:width}},
 offsetLeft:{configurable:true,get(){return this.classList?.contains('archive-card')?Array.from(this.parentElement.children).indexOf(this)*384:0}}
});
window.HTMLElement.prototype.scrollTo=function({left=0}={}){this.scrollLeft=left;this.dispatchEvent(new window.Event('scroll'))};
const captures=new Map();
window.HTMLElement.prototype.setPointerCapture=function(id){captures.set(id,this)};
window.HTMLElement.prototype.hasPointerCapture=function(id){return captures.get(id)===this};
window.HTMLElement.prototype.releasePointerCapture=function(id){captures.delete(id)};
const observers=new Set();
globalThis.ResizeObserver=class {constructor(callback){this.callback=callback}observe(){observers.add(this)}disconnect(){observers.delete(this)}};
window.ResizeObserver=globalThis.ResizeObserver;
const {createRoot}=await import('react-dom/client');
const {MissionArchive}=await import('../.m1-tests/MissionArchive.mjs');
let instances=[],failInit=false,opened=[];
globalThis.__m1MotionFactory=options=>{
 if(failInit)throw new Error('injected GSAP initialization failure');
 options.root.dataset.enhanced='true';let position=options.index;
 const calls=[];
 const instance={options,calls,destroyed:false,
  select(index,direction){calls.push(['select',index,direction]);position=nearestPosition(position,index,3,direction)},
  beginDrag(){calls.push(['beginDrag']);return position},
  drag(next){calls.push(['drag',next]);position=next},position:()=>position,spacing:()=>240,
  settle(){calls.push(['settle'])},resize(){calls.push(['resize'])},
  destroy(){this.destroyed=true;options.root.removeAttribute('data-enhanced')}
 };instances.push(instance);return instance;
};
const flush=()=>act(async()=>{await new Promise(resolve=>setTimeout(resolve,30))});
async function mount({reduced=false,strict=false}={}){
 instances=[];opened=[];captures.clear();
 const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
 const node=()=>React.createElement(MissionArchive,{reduced,onOpen:i=>opened.push(i)});
 await act(async()=>root.render(strict?React.createElement(StrictMode,null,node()):node()));await flush();
 return {host,root,update:async next=>{reduced=next;await act(async()=>root.render(strict?React.createElement(StrictMode,null,node()):node()));await flush()},
  cleanup:async()=>{await act(async()=>root.unmount());host.remove()}};
}
const button=(host,label)=>Array.from(host.querySelectorAll('button')).find(b=>b.getAttribute('aria-label')===label);
async function click(element){await act(async()=>element.click())}
function selected(host){return host.querySelector('.archive-position [aria-current]')?.getAttribute('aria-label')}
async function pointer(gallery,type,x,y,time,id=1,pointerType='mouse'){
 const event=new window.PointerEvent(type,{bubbles:true,cancelable:true,clientX:x,clientY:y,pointerId:id,pointerType,isPrimary:true,button:0});
 Object.defineProperty(event,'timeStamp',{value:time});await act(async()=>gallery.dispatchEvent(event));return event;
}

test('circular geometry: unique positions, continuous centre, bounded snap and tie direction',()=>{
 for(let n=1;n<=8;n++)for(let i=0;i<n;i++){
  const offsets=Array.from({length:n},(_,j)=>missionOffset(j,i,n));assert.equal(new Set(offsets).size,n);
  assert.equal(wrapIndex(i-n,n),i);assert.equal(wrapIndex(i+n,n),i);
  for(const w of [320,390,768,1440])for(const coarse of [true,false]){
   const g=missionGeometry(w,360,coarse),p=missionPose(0,g,n);assert.equal(p.scale,1);assert.ok(p.rotationY===0);assert.ok(p.z>0);
   for(const offset of offsets.filter(Boolean)){const side=missionPose(offset,g,n);assert.ok(side.scale<1&&side.z<p.z)}
  }
 }
 assert.equal(nearestPosition(0,1,2,1),1);assert.equal(nearestPosition(0,1,2,-1),-1);
 assert.equal(dragIntent(4,4),'pending');assert.equal(dragIntent(50,12),'horizontal');assert.equal(dragIntent(10,40),'vertical');
 assert.ok(Math.abs(snapPosition(.2,999)-.2)<1);assert.equal(snapPosition(.2,0),0);
});

test('initialization failure keeps every real project and detail action available',async()=>{
 failInit=true;const m=await mount();
 assert.equal(m.host.querySelector('section').dataset.motionStatus,'fallback');assert.equal(m.host.querySelectorAll('.archive-card').length,3);
 assert.ok([...m.host.querySelectorAll('.archive-info')].every(n=>!n.hasAttribute('inert')));
 const actions=[...m.host.querySelectorAll('.archive-explore')];assert.equal(actions.length,3);
 for(const action of actions)await click(action);assert.deepEqual(opened,[0,1,2]);
 await click(button(m.host,'Next mission'));assert.equal(selected(m.host),'Select ATELIER');
 await m.cleanup();failInit=false;assert.equal(observers.size,0);
});

test('buttons, direct selection, arrows/Home/End and rapid reversal share semantic selection',async()=>{
 const m=await mount(),gallery=m.host.querySelector('.archive-viewport');assert.equal(instances.length,1);
 for(let i=0;i<10;i++)await click(button(m.host,'Next mission'));assert.equal(selected(m.host),'Select PBMS');
 for(let i=0;i<10;i++)await click(button(m.host,'Previous mission'));assert.equal(selected(m.host),'Select ATELIER');
 await click(button(m.host,'Select mission 03: FORGEOS'));assert.equal(selected(m.host),'Select FORGEOS');
 for(const [key,expected] of [['Home','ATELIER'],['ArrowLeft','FORGEOS'],['End','FORGEOS'],['ArrowRight','ATELIER']]){
  await act(async()=>gallery.dispatchEvent(new window.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true})));
  assert.equal(selected(m.host),'Select '+expected);
 }
 assert.ok([...m.host.querySelectorAll('.archive-card')].every((c,i)=>c.querySelector('.archive-info').hasAttribute('inert')===(i!==0)));
 await m.cleanup();assert.ok(instances[0].destroyed);
});

test('drag follows pointer, snaps on release; vertical gestures and cancel preserve selection',async()=>{
 const m=await mount(),gallery=m.host.querySelector('.archive-viewport'),motion=instances[0];
 await pointer(gallery,'pointerdown',300,150,0);await pointer(gallery,'pointermove',170,151,100);
 assert.equal(captures.get(1),gallery);assert.ok(motion.calls.some(c=>c[0]==='drag'&&c[1]>0));
 assert.equal(selected(m.host),'Select ATELIER'); // semantics commit on release, not every frame
 await pointer(gallery,'pointerup',100,151,150);assert.equal(selected(m.host),'Select PBMS');assert.equal(captures.size,0);
 const before=motion.calls.length;
 await pointer(gallery,'pointerdown',200,100,200,2,'touch');await pointer(gallery,'pointermove',195,180,240,2,'touch');
 await pointer(gallery,'pointerup',195,190,250,2,'touch');assert.equal(motion.calls.length,before);
 await pointer(gallery,'pointerdown',250,150,300,3,'touch');await pointer(gallery,'pointermove',110,152,350,3,'touch');
 await act(async()=>gallery.dispatchEvent(new window.PointerEvent('pointercancel',{pointerId:3,bubbles:true})));
 assert.equal(selected(m.host),'Select PBMS');assert.equal(captures.size,0);
 await m.cleanup();
});

test('drag click suppression does not block next real pointer or keyboard detail action',async()=>{
 const m=await mount(),gallery=m.host.querySelector('.archive-viewport');
 await pointer(gallery,'pointerdown',300,150,0);await pointer(gallery,'pointermove',120,150,100);await pointer(gallery,'pointerup',120,150,120);
 const action=m.host.querySelector('.archive-card[data-active=true] .archive-explore');
 await act(async()=>action.dispatchEvent(new window.MouseEvent('click',{bubbles:true,cancelable:true,detail:1,clientX:120,clientY:150})));
 assert.equal(opened.length,0);
 await click(action);assert.equal(opened.length,1); // detail=0 keyboard/programmatic activation
 await m.cleanup();
});

test('focus moves before a focused card action becomes inert; controls retain their focus',async()=>{
 const m=await mount(),action=m.host.querySelector('.archive-card[data-active=true] .archive-explore'),gallery=m.host.querySelector('.archive-viewport');
 action.focus();await act(async()=>action.dispatchEvent(new window.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true})));
 assert.equal(document.activeElement,gallery);
 const next=button(m.host,'Next mission');next.focus();await click(next);assert.equal(document.activeElement,next);
 await m.cleanup();
});

test('reduced/short/narrow fallback and live mode rebuild preserve active project',async()=>{
 const m=await mount();await click(button(m.host,'Select FORGEOS'));
 const gallery=m.host.querySelector('.archive-viewport');await pointer(gallery,'pointerdown',300,150,0);await pointer(gallery,'pointermove',180,150,80);assert.equal(captures.size,1);
 await m.update(true);assert.equal(captures.size,0);
 assert.equal(m.host.querySelector('section').dataset.motionStatus,'fallback');assert.equal(selected(m.host),'Select FORGEOS');
 assert.ok([...m.host.querySelectorAll('.archive-info')].every(n=>!n.hasAttribute('inert')));
 await m.update(false);assert.equal(instances.at(-1).options.index,2);
 window.innerHeight=390;await act(async()=>window.dispatchEvent(new window.Event('resize')));await flush();
 assert.equal(m.host.querySelector('section').dataset.motionStatus,'fallback');assert.equal(selected(m.host),'Select FORGEOS');
 window.innerHeight=900;width=320;await act(async()=>window.dispatchEvent(new window.Event('resize')));await flush();assert.equal(m.host.querySelector('section').dataset.motionStatus,'fallback');
 width=1440;await act(async()=>window.dispatchEvent(new window.Event('resize')));await flush();assert.equal(m.host.querySelector('section').dataset.motionStatus,'ready');
 await m.cleanup();assert.equal(observers.size,0);
});

test('StrictMode mount/unmount restores owned resources without removing unrelated observer',async()=>{
 const sentinel=new ResizeObserver(()=>{});sentinel.observe(document.body);
 const m=await mount({strict:true});assert.equal(instances.filter(i=>!i.destroyed).length,1);assert.equal(observers.size,2);
 await m.cleanup();assert.ok(instances.every(i=>i.destroyed));assert.equal(observers.size,1);sentinel.disconnect();
});

test('native fallback scrolling updates shared selection and preserves all detail actions',async()=>{
 width=390;const m=await mount({reduced:true}),list=m.host.querySelector('.archive-arrival');
 await act(async()=>{list.scrollLeft=390;list.dispatchEvent(new window.Event('scroll'));await new Promise(resolve=>setTimeout(resolve,100))});
 assert.equal(selected(m.host),'Select PBMS');assert.ok([...m.host.querySelectorAll('.archive-info')].every(n=>!n.hasAttribute('inert')));
 await click(m.host.querySelectorAll('.archive-explore')[1]);assert.deepEqual(opened,[1]);
 await m.cleanup();width=1440;
});

test('real GSAP controller restores styles/triggers and preserves an unrelated trigger in simulated DOM',async()=>{
 const {createCoverflowMotion,gsap,ScrollTrigger}=await import('../.m1-tests/real-controller.mjs');
 gsap.registerPlugin(ScrollTrigger);
 const sentinel=document.createElement('div');document.body.append(sentinel);
 const unrelated=ScrollTrigger.create({trigger:sentinel,start:0,end:100});
 const baseline=ScrollTrigger.getAll().length;
 const section=document.createElement('section');section.style.setProperty('--mission-accent','#93caff');
 section.innerHTML='<div class="archive-backdrop"></div><div class="archive-scan"></div><div class="archive-floor"></div><div class="archive-glow"></div><div class="archive-viewport"><div class="archive-arrival">'+[0,1,2].map(i=>'<article class="archive-card" style="--card-accent: red"><div class="archive-reflection"></div><div class="archive-surface"><div class="archive-info"></div><div class="archive-emphasis"></div></div></article>').join('')+'</div></div>';
 document.body.append(section);
 const cards=[...section.querySelectorAll('.archive-card')],before=cards.map(c=>c.getAttribute('style'));
 const engine=createCoverflowMotion({root:section,viewport:section.querySelector('.archive-viewport'),index:0,entered:true,onEntered(){}});
 assert.equal(ScrollTrigger.getAll().length,baseline+1);
 engine.select(1,1,true);engine.settle();
 assert.ok(Math.abs(engine.position()-1)<.01);
 engine.beginDrag();engine.drag(1.4);assert.equal(engine.position(),1.4);
 const interrupted=engine.position();engine.select(2,-1);assert.equal(engine.position(),interrupted);engine.settle();assert.equal(wrapIndex(Math.round(engine.position()),3),2);
 for(const [index,direction] of [[0,1],[2,-1],[1,-1],[0,-1]])engine.select(index,direction);
 engine.settle();assert.equal(wrapIndex(Math.round(engine.position()),3),0);
 assert.equal(section.querySelector('.archive-arrival').style.opacity,'');
 assert.ok(section.querySelector('.archive-surface').style.opacity!=='');
 engine.destroy();engine.destroy();
 assert.equal(ScrollTrigger.getAll().length,baseline);assert.ok(ScrollTrigger.getAll().includes(unrelated));
 assert.equal(section.hasAttribute('data-enhanced'),false);assert.deepEqual(cards.map(c=>c.getAttribute('style')),before);
 assert.ok([...section.querySelectorAll('.archive-surface,.archive-info,.archive-emphasis')].every(n=>!n.hasAttribute('style')));
 // Exercise entry and mid-initialization rollback with real GSAP, still without rendering.
 const entryEngine=createCoverflowMotion({root:section,viewport:section.querySelector('.archive-viewport'),index:0,entered:false,onEntered(){}});
 assert.ok(ScrollTrigger.getAll().length>=baseline+1);entryEngine.beginDrag();entryEngine.destroy();assert.equal(ScrollTrigger.getAll().length,baseline);
 const originalTimeline=gsap.timeline;gsap.timeline=()=>{throw new Error('injected timeline setup failure')};
 try{assert.throws(()=>createCoverflowMotion({root:section,viewport:section.querySelector('.archive-viewport'),index:0,entered:false,onEntered(){}}),/injected/)}finally{gsap.timeline=originalTimeline}
 assert.equal(section.hasAttribute('data-enhanced'),false);assert.deepEqual(cards.map(c=>c.getAttribute('style')),before);
 assert.equal(ScrollTrigger.getAll().length,baseline);
 section.remove();unrelated.kill();sentinel.remove();ScrollTrigger.disable();gsap.ticker.sleep();
});

after(async()=>{await window.happyDOM.abort();console.log('Evidence scope: simulated DOM/adapter tests; no browser layout, GPU, native gesture or accessibility pass is implied.')});
