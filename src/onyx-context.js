// Contextual Onyx companion layer — isolated from the training engine.
const BASE='/ONYX-FIT-V0.1/assets/';
const COACH=BASE+'972F4DDC-2B10-4407-9FF0-48CD21DB0815.png';
const WORKOUT=BASE+'DB30F8FC-5142-4C84-852C-FA768EECAEA2.png';
const RECOVERY=BASE+'A8705DFA-0D1F-41B3-96C4-9B8A5B7FEA5F.png';

function addWorkoutCompanion(){
  const card=document.querySelector('#workoutScreen .pro-exercise');
  if(!card||card.querySelector('.onyx-session-companion'))return;
  const title=card.querySelector('h1');
  if(!title)return;
  const box=document.createElement('div');
  box.className='onyx-session-companion';
  box.style.cssText='display:flex;align-items:center;gap:10px;margin:8px 0 10px;padding:8px 10px;border:1px solid #262626;border-radius:14px;background:#0b0b0b;overflow:hidden;max-width:100%;';
  const img=document.createElement('img');
  img.src=WORKOUT;
  img.alt='Onyx accompagne la séance';
  img.style.cssText='display:block;width:72px;height:72px;max-width:72px;max-height:72px;object-fit:contain;flex:0 0 72px;border-radius:12px;';
  const text=document.createElement('span');
  text.textContent='Onyx est avec toi';
  text.style.cssText='font-size:.78rem;color:#aaa;min-width:0;';
  box.append(img,text);
  title.insertAdjacentElement('afterend',box);
}

function fixRecovery(){
  const host=document.querySelector('#restFullscreen .rest-onyx');
  if(!host)return;
  let img=host.querySelector('img.onyx-recovery-individual');
  if(!img){
    host.innerHTML='';
    img=document.createElement('img');
    img.className='onyx-recovery-individual';
    img.alt='Onyx en récupération';
    host.appendChild(img);
  }
  if(!img.src.endsWith('/assets/A8705DFA-0D1F-41B3-96C4-9B8A5B7FEA5F.png')) img.src=RECOVERY;
  img.style.cssText='display:block;width:min(250px,58vw);height:min(250px,58vw);max-width:250px;max-height:250px;object-fit:contain;object-position:center;pointer-events:none;margin:0 auto;border-radius:22px;';
  host.style.cssText='display:grid;place-items:center;margin:12px auto 6px;overflow:hidden;max-width:280px;max-height:270px;pointer-events:none;';
}

function fixCheckin(){
  document.querySelectorAll('#weeklyModal .mascot, .checkin-preview .mascot').forEach(host=>{
    const img=host.querySelector('img');
    if(img&&img.src!==COACH)img.src=COACH;
  });
}

function apply(){
  addWorkoutCompanion();
  fixRecovery();
  fixCheckin();
}

const observer=new MutationObserver(apply);
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('DOMContentLoaded',()=>setTimeout(apply,100));
setTimeout(apply,250);
