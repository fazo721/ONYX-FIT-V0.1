// Contextual Onyx companion layer — isolated from the training engine.
// Important: the recovery overlay is intentionally left to training-stats.js,
// which owns its timer, controls and proven working recovery visual.
const BASE='/ONYX-FIT-V0.1/assets/';
const COACH=BASE+'972F4DDC-2B10-4407-9FF0-48CD21DB0815.png';
const NEUTRAL=BASE+'DB30F8FC-5142-4C84-852C-FA768EECAEA2.png';

function addWorkoutCompanion(){
  const card=document.querySelector('#workoutScreen .pro-exercise');
  if(!card||card.querySelector('.onyx-session-companion'))return;
  const title=card.querySelector('h1');
  if(!title)return;
  const box=document.createElement('div');
  box.className='onyx-session-companion';
  box.style.cssText='display:flex;align-items:center;gap:10px;margin:8px 0 10px;padding:8px 10px;border:1px solid #262626;border-radius:14px;background:#0b0b0b;overflow:hidden;max-width:100%;';
  const img=document.createElement('img');
  img.src=NEUTRAL;
  img.alt='Onyx accompagne la séance';
  img.style.cssText='display:block;width:72px;height:72px;max-width:72px;max-height:72px;object-fit:contain;flex:0 0 72px;border-radius:12px;';
  const text=document.createElement('span');
  text.textContent='Onyx est avec toi';
  text.style.cssText='font-size:.78rem;color:#aaa;min-width:0;';
  box.append(img,text);
  title.insertAdjacentElement('afterend',box);
}

function fixCheckin(){
  document.querySelectorAll('#weeklyModal .mascot, .checkin-preview .mascot').forEach(host=>{
    const img=host.querySelector('img');
    if(img&&img.src!==COACH)img.src=COACH;
  });
}

function apply(){
  addWorkoutCompanion();
  fixCheckin();
}

const observer=new MutationObserver(apply);
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('DOMContentLoaded',()=>setTimeout(apply,100));
setTimeout(apply,250);
