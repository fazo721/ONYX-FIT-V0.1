// ONYX FIT v0.1 — standalone Onyx asset library.
// The app now prefers individual character renders instead of rough crops from a poster sheet.
const BASE='/ONYX-FIT-V0.1/assets/';

// Newly uploaded standalone renders.
// 2408… = recovery (bottle + towel)
// 972… / DB30… = coach + neutral companion variants uploaded together.
const ASSETS={
  recovery: BASE+'24087065-2705-4E2C-B8C1-659D82AB9D57.png',
  coach: BASE+'972F4DDC-2B10-4407-9FF0-48CD21DB0815.png',
  neutral: BASE+'DB30F8FC-5142-4C84-852C-FA768EECAEA2.png',
  alt1: BASE+'A8705DFA-0D1F-41B3-96C4-9B8A5B7FEA5F.png',
  alt2: BASE+'A8D5E34D-2BBF-4621-AD4F-02E3E25C7B4E.png',
  alt3: BASE+'E79F9844-1798-4B78-B62B-35D9B795B130.png'
};

function standalone(src,kind='neutral',alt='Onyx'){
  const img=document.createElement('img');
  img.className='onyx-art onyx-standalone '+kind;
  img.src=src;
  img.alt=alt;
  img.draggable=false;
  img.loading='eager';
  return img;
}

function image(kind='home',alt='Onyx'){
  let src=ASSETS.neutral;
  if(kind==='recovery'||kind==='rest')src=ASSETS.recovery;
  else if(kind==='checkin'||kind==='coach'||kind==='onboarding'||kind==='victory')src=ASSETS.coach;
  else if(kind==='workout'||kind==='effort'||kind==='ready'||kind==='motivation')src=ASSETS.neutral;
  return standalone(src,kind,alt);
}

function inferKind(box){
  if(box.classList.contains('coach')||box.closest('#weeklyModal')||box.closest('.checkin-preview')) return 'checkin';
  if(box.closest('#onboardingScreen')) return 'onboarding';
  if(box.closest('#workoutScreen')) return 'workout';
  if(box.closest('#foodScreen')) return 'nutrition';
  return 'home';
}

function upgrade(root=document){
  root.querySelectorAll('.mascot').forEach(box=>{
    if(box.dataset.onyxUpgraded==='standalone')return;
    const legacy=box.querySelector('.onyx-svg, img.onyx-art, .onyx-master-crop');
    if(!legacy)return;
    const kind=inferKind(box);
    box.innerHTML='';
    box.appendChild(image(kind));
    box.dataset.onyxUpgraded='standalone';
  });
}

// Expose a tiny library so other isolated modules (training, home coach, etc.)
// can request the same approved character without duplicating filenames.
window.ONYX_VISUALS={
  asset:kind=>{
    if(kind==='recovery'||kind==='rest')return ASSETS.recovery;
    if(kind==='coach'||kind==='checkin'||kind==='victory')return ASSETS.coach;
    return ASSETS.neutral;
  },
  create:image,
  assets:ASSETS
};

const obs=new MutationObserver(()=>upgrade());
obs.observe(document.documentElement,{subtree:true,childList:true});
window.addEventListener('DOMContentLoaded',()=>upgrade());
setTimeout(()=>upgrade(),50);
