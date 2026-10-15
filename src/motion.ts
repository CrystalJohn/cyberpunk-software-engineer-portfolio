import {useEffect,useRef,useState} from 'react';

export const motion = {micro:180,exit:160,reveal:480,ease:'cubic-bezier(.16,1,.3,1)',sessionKey:'john-system-boot-v2'};
export function useReducedMotion(){
  const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(()=>{const query=matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(query.matches);query.addEventListener('change',update);return()=>query.removeEventListener('change',update)},[]);
  return reduced;
}
function hasBooted(){try{return sessionStorage.getItem(motion.sessionKey)==='complete'}catch{return false}}
export function useBootSequence(reduced:boolean){
  const [stage,setStage]=useState(()=>reduced||hasBooted()?6:0);
  const complete=()=>{setStage(6);try{sessionStorage.setItem(motion.sessionKey,'complete')}catch{/* Storage can be disabled; the intro remains skippable. */}};
  useEffect(()=>{if(reduced){complete();return}if(stage===6)return;const timers=[380,850,1300,1750,2050,2700].map((time,i)=>setTimeout(()=>{if(i===5)complete();else setStage(i+1)},time));return()=>timers.forEach(clearTimeout)},[reduced,stage===6]);
  return {stage,complete};
}
export function useDecodedName(enabled:boolean,reduced:boolean){
  const [text,setText]=useState('JOHN');
  useEffect(()=>{if(!enabled||reduced){setText('JOHN');return}const glyphs='J0HNX/#01';let tick=0;const timer=setInterval(()=>{tick++;setText('JOHN'.split('').map((c,i)=>tick>=i+3?c:glyphs[(tick+i*3)%glyphs.length]).join(''));if(tick>=7)clearInterval(timer)},55);return()=>clearInterval(timer)},[enabled,reduced]);
  return text;
}
/** Content is always readable; only observed entrances receive an animation. */
export function useScrollMotion(reduced:boolean){
  useEffect(()=>{
    const targets=document.querySelectorAll<HTMLElement>('.section-heading,.mission-card,.avatar-panel,.profile-data>div,.ability-group,.timeline article,.contact-terminal');
    let observer:IntersectionObserver|undefined;
    const finish=(target:HTMLElement)=>{target.dataset.motion='active';target.classList.add('motion-entered')};
    if(reduced||!('IntersectionObserver' in window)){targets.forEach(finish);return}
    targets.forEach((el)=>{el.dataset.motion='initial';const siblings=Array.from(el.parentElement?.children||[]);el.style.setProperty('--stagger',`${Math.min(siblings.indexOf(el),3)*75}ms`)});
    observer=new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>{if(!isIntersecting)return;const el=target as HTMLElement;el.dataset.motion='entering';el.classList.add('motion-entered');observer?.unobserve(el)}),{threshold:.15,rootMargin:'0px 0px -25px 0px'});
    targets.forEach(el=>observer?.observe(el));
    const settle=(e:AnimationEvent)=>{const el=(e.target as HTMLElement).closest<HTMLElement>('[data-motion]');if(el?.dataset.motion==='entering')el.dataset.motion='active'};
    document.addEventListener('animationend',settle);
    return()=>{observer?.disconnect();document.removeEventListener('animationend',settle)};
  },[reduced]);
}
export function usePanelTransition(dependency:string|number|null,reduced:boolean){
  const ref=useRef<HTMLElement|null>(null);
  useEffect(()=>{if(reduced||dependency===null)return;const el=ref.current;if(!el?.animate)return;el.dataset.motion='entering';const animation=el.animate([{opacity:.45,transform:'translateX(9px)'},{opacity:1,transform:'translateX(0)'}],{duration:motion.reveal,easing:motion.ease});animation.onfinish=()=>{el.dataset.motion='active'};return()=>animation.cancel()},[dependency,reduced]);
  return ref;
}

