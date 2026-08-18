// ONYX FIT v0.1 — final approved Onyx visual sheet.
const BASE='/ONYX-FIT-V0.1/assets/';
const MASTER=BASE+'CE7966B7-F1FF-42CE-9156-F530A22AEC18.png';
const SHEET_W=1536;
const SHEET_H=1024;

// Crops from the approved 5x2 Onyx sheet. We crop only the character area,
// without the poster titles/footer, so the result feels like an app asset.
const CROPS={
  home:      {x:64, y:178, w:214, h:326},
  onboarding:{x:1276,y:614,w:210,h:303},
  checkin:   {x:346,y:180,w:240,h:326},
  workout:   {x:639,y:187,w:276,h:320},
  recovery:  {x:982,y:185,w:214,h:324},
  rest:      {x:1260,y:188,w:246,h:316},
  nutrition: {x:46, y:612,w:250,h:306},
  victory:   {x:352,y:611,w:238,h:308},
  focus:     {x:665,y:611,w:230,h:306},
  motivation:{x:972,y:612,w:222,h:306},
  ready:     {x:1260,y:612,w:224,h:306},
  effort:    {x:639,y:187,w:276,h:320}
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
  frame.style.setProperty('--sheet-w',SHEET_W);
  frame.style.setProperty('--sheet-h',SHEET_H);
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
    const legacy=box.querySelector('.onyx-svg, img.onyx-art, .onyx-master-crop');
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
