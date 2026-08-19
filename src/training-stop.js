// ONYX FIT v0.1 — stop current workout with explicit confirmation
const $=s=>document.querySelector(s);

function injectStyles(){
  if(document.querySelector('#onyxStopStyles'))return;
  const s=document.createElement('style');
  s.id='onyxStopStyles';
  s.textContent=`
    .stop-workout-btn{border:1px solid #7a2b2b!important;background:#211010!important;color:#ff8f8f!important;border-radius:999px!important;padding:10px 13px!important;font-weight:900!important;box-shadow:0 10px 30px #000a}
    .stop-confirm{position:fixed;inset:0;z-index:260;background:#000d;display:grid;place-items:center;padding:18px}
    .stop-confirm-card{width:min(430px,100%);background:linear-gradient(145deg,#171717,#0d0d0d);border:1px solid #3b2424;border-radius:22px;padding:18px;box-shadow:0 24px 70px #000;}
    .stop-confirm-card h2{margin:.3rem 0 .7rem}.stop-confirm-card p{color:#aaa;line-height:1.45}.stop-confirm-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:16px}.stop-confirm-actions .danger{background:#481616;border:1px solid #7e2b2b;color:#fff;font-weight:900}.stop-confirm-actions .safe{background:#1a1a1a;border:1px solid #333;color:#fff}
    @media(max-width:390px){.stop-workout-btn{padding:9px 11px!important;font-size:.76rem!important}}
  `;
  document.head.appendChild(s);
}

function showConfirm(){
  if($('#stopWorkoutConfirm'))return;
  const modal=document.createElement('div');
  modal.id='stopWorkoutConfirm';
  modal.className='stop-confirm';
  modal.innerHTML=`<div class="stop-confirm-card" role="dialog" aria-modal="true" aria-labelledby="stopTitle"><div class="eyebrow">ARRÊTER LA SÉANCE</div><h2 id="stopTitle">Tu veux vraiment arrêter ?</h2><p>Les séries déjà réalisées, le temps passé et les calories dépensées jusque-là seront conservés. Seule la partie non effectuée sera abandonnée.</p><div class="stop-confirm-actions"><button class="btn safe" id="cancelStopWorkout">CONTINUER</button><button class="btn danger" id="confirmStopWorkout">ARRÊTER</button></div></div>`;
  document.body.appendChild(modal);
  $('#cancelStopWorkout').onclick=()=>modal.remove();
  $('#confirmStopWorkout').onclick=()=>{
    try{window.OnyxTrainingDurable?.savePartial?.()}catch{}
    modal.remove();window.location.reload();
  };
  modal.onclick=e=>{if(e.target===modal)modal.remove()};
}

function ensureStopButton(){
  injectStyles();
  const bar=$('#globalPause');
  if(!bar||bar.querySelector('#stopWorkoutBtn'))return;
  const b=document.createElement('button');
  b.id='stopWorkoutBtn';
  b.className='stop-workout-btn';
  b.textContent='✕ Arrêter';
  b.onclick=showConfirm;
  bar.prepend(b);
}

const obs=new MutationObserver(ensureStopButton);
obs.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('DOMContentLoaded',()=>setTimeout(ensureStopButton,150));
setInterval(ensureStopButton,1000);