// Contextual Onyx companion layer — isolated from the training engine.
const BASE='/ONYX-FIT-V0.1/assets/';
const COACH=BASE+'972F4DDC-2B10-4407-9FF0-48CD21DB0815.png';
const WORKOUT=BASE+'DB30F8FC-5142-4C84-852C-FA768EECAEA2.png';
const RECOVERY=BASE+'18FDB08E-B760-44C6-8B36-2884EE6C707E.png';

function addWorkoutCompanion(){
  const card=document.querySelector('#workoutScreen .pro-exercise');
  if(!card||card.querySelector('.onyx-session-companion'))return;
  const title=card.querySelector('h1');
  if(!title)return;

  const box=document.createElement('div');
  box.className='onyx-session-companion';
  box.style.cssText='display:flex;justify-content:flex-end;align-items:flex-end;height:92px;margin:-6px 2px 2px 0;overflow:visible;pointer-events:none;';

  const img=document.createElement('img');
  img.src=WORKOUT;
  img.alt='Onyx pendant la séance';
  img.style.cssText='display:block;width:92px;height:92px;max-width:92px;max-height:92px;object-fit:contain;object-position:center bottom;filter:drop-shadow(0 8px 18px #ff5a0022);';

  box.appendChild(img);
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

  if(!img.src.endsWith('/assets/18FDB08E-B760-44C6-8B36-2884EE6C707E.png')) img.src=RECOVERY;
  img.style.cssText='display:block;width:min(270px,64vw);height:min(270px,64vw);max-width:270px;max-height:270px;object-fit:contain;object-position:center;pointer-events:none;margin:0 auto;filter:drop-shadow(0 10px 24px #ff5a0022);';
  host.style.cssText='display:grid;place-items:center;margin:10px auto 4px;overflow:visible;max-width:300px;pointer-events:none;';
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
