// Contextual Onyx companion layer — isolated from the training engine.
const BASE='/ONYX-FIT-V0.1/assets/';
const RECOVERY=BASE+'24087065-2705-4E2C-B8C1-659D82AB9D57.png';
const COACH=BASE+'972F4DDC-2B10-4407-9FF0-48CD21DB0815.png';
const NEUTRAL=BASE+'DB30F8FC-5142-4C84-852C-FA768EECAEA2.png';

function fixRecovery(){
  const host=document.querySelector('#restFullscreen .rest-onyx');
  if(!host||host.dataset.standalone==='1')return;
  host.innerHTML=`<img class="onyx-art onyx-standalone recovery" src="${RECOVERY}" alt="Onyx en récupération">`;
  host.dataset.standalone='1';
}

function addWorkoutCompanion(){
  const card=document.querySelector('#workoutScreen .pro-exercise');
  if(!card||card.querySelector('.onyx-session-companion'))return;
  const title=card.querySelector('h1');
  if(!title)return;
  const box=document.createElement('div');
  box.className='onyx-session-companion';
  box.innerHTML=`<img src="${NEUTRAL}" alt="Onyx accompagne la séance"><span>Onyx est avec toi</span>`;
  title.insertAdjacentElement('afterend',box);
}

function fixCheckin(){
  document.querySelectorAll('#weeklyModal .mascot, .checkin-preview .mascot').forEach(host=>{
    const img=host.querySelector('img');
    if(img&&img.src!==COACH)img.src=COACH;
  });
}

function apply(){fixRecovery();addWorkoutCompanion();fixCheckin()}
const observer=new MutationObserver(apply);
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('DOMContentLoaded',()=>setTimeout(apply,100));
setTimeout(apply,250);
