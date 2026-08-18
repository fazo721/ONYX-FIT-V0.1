// ONYX FIT v0.1 — validated ONYX master board integration.
const BASE='/ONYX-FIT-V0.1/assets/';
const MASTER=BASE+'18FDB08E-B760-44C6-8B36-2884EE6C707E.png';

// Crop presets are expressed against the 1536×1536 validated character board.
// They let v0.1 use the real Onyx immediately without redrawing him.
const CROPS={
  home:      {x:1030,y:20,w:485,h:700},
  onboarding:{x:1030,y:20,w:485,h:700},
  checkin:   {x:1030,y:20,w:485,h:700},
  workout:   {x:1000,y:965,w:270,h:315},
  nutrition: {x:1270,y:965,w:250,h:315},
  victory:   {x:740,y:640,w:250,h:260},
  effort:    {x:20,y:630,w:245,h:280},
  recovery:  {x:250,y:630,w:245,h:280}
};

function image(kind='home',alt='Onyx'){
  const c=CROPS[kind]||CROPS.home;
  const frame=document.createElement('span');
  frame.className='onyx-art onyx-master-crop '+kind;
  frame.setAttribute('role','img');
  frame.setAttribute('aria-label',alt);
  frame.style.setProperty('--ox',c.x);
  frame.style.setProperty('--oy',c.y);
  frame.style.setProperty('--ow',c.w);
  frame.style.setProperty('--oh',c.h);
  const img=document.createElement('img');
  img.src=MASTER;
  img.alt='';
  img.draggable=false;
  frame.appendChild(img);
  return frame;
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
    if(box.dataset.onyxUpgraded)return;
    const legacy=box.querySelector('.onyx-svg, img.onyx-art');
    if(!legacy)return;
    const kind=inferKind(box);
    box.innerHTML='';
    box.appendChild(image(kind));
    box.dataset.onyxUpgraded='1';
  });
}

const obs=new MutationObserver(()=>upgrade());
obs.observe(document.documentElement,{subtree:true,childList:true});
window.addEventListener('DOMContentLoaded',()=>upgrade());
setTimeout(()=>upgrade(),50);
