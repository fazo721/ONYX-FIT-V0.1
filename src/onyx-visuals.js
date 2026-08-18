// ONYX FIT v0.1 — remplace automatiquement la mascotte SVG provisoire par les visuels Onyx validés.
const BASE='/ONYX-FIT-V0.1/assets/';
const visuals={
  onboarding:'onyx_onboarding.png',
  home:'onyx_home.png',
  workout:'onyx_workout.png',
  checkin:'onyx_home.png',
  nutrition:'onyx_nutrition.png',
  rest:'onyx_rest.png'
};
function image(name,alt='Onyx'){const i=document.createElement('img');i.src=BASE+visuals[name];i.alt=alt;i.className='onyx-art '+name;return i}
function upgrade(root=document){
  root.querySelectorAll('.onyx-svg').forEach(svg=>{
    const box=svg.closest('.mascot');if(!box||box.dataset.onyxUpgraded)return;
    let kind='home';
    if(box.classList.contains('coach')||box.closest('#weeklyModal')||box.closest('.checkin-preview')) kind='checkin';
    else if(box.closest('#onboardingScreen')) kind='onboarding';
    else if(box.closest('#workoutScreen')) kind='workout';
    else if(box.closest('#foodScreen')) kind='nutrition';
    box.innerHTML='';box.appendChild(image(kind));box.dataset.onyxUpgraded='1';
  });
}
const obs=new MutationObserver(()=>upgrade());
obs.observe(document.documentElement,{subtree:true,childList:true});
window.addEventListener('DOMContentLoaded',()=>upgrade());
setTimeout(()=>upgrade(),50);
