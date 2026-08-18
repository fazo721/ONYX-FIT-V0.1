// ONYX FIT v0.1 — visuels officiels Onyx validés.
const BASE='/ONYX-FIT-V0.1/assets/';
function image(kind,alt='Onyx'){
  const i=document.createElement('img');
  i.src=BASE+(kind==='checkin'?'onyx-coach.svg':'onyx-official.svg');
  i.alt=alt;
  i.className='onyx-art '+kind;
  return i;
}
function upgrade(root=document){
  root.querySelectorAll('.onyx-svg').forEach(svg=>{
    const box=svg.closest('.mascot');
    if(!box||box.dataset.onyxUpgraded)return;
    let kind='home';
    if(box.classList.contains('coach')||box.closest('#weeklyModal')||box.closest('.checkin-preview')) kind='checkin';
    else if(box.closest('#onboardingScreen')) kind='onboarding';
    else if(box.closest('#workoutScreen')) kind='workout';
    else if(box.closest('#foodScreen')) kind='nutrition';
    box.innerHTML='';
    box.appendChild(image(kind));
    box.dataset.onyxUpgraded='1';
  });
}
const obs=new MutationObserver(()=>upgrade());
obs.observe(document.documentElement,{subtree:true,childList:true});
window.addEventListener('DOMContentLoaded',()=>upgrade());
setTimeout(()=>upgrade(),50);
