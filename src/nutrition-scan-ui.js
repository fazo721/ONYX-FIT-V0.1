// ONYX FIT v0.1 — reliable camera scanner launcher in Nutrition
const $=s=>document.querySelector(s);

function injectStyle(){
  if($('#onyxNutScanStyle')) return;
  const s=document.createElement('style');
  s.id='onyxNutScanStyle';
  s.textContent=`
  .onyx-scan-launch{width:100%;margin:10px 0 2px;padding:14px 16px;border-radius:14px;border:1px solid #ff6500;background:linear-gradient(135deg,#251006,#120b08);color:#fff;font-weight:900;letter-spacing:.04em;display:flex;align-items:center;justify-content:center;gap:9px;box-shadow:0 0 0 1px #ff65001f inset,0 8px 24px #0008}
  .onyx-scan-launch span{color:#ff7a1a;font-size:1.05rem}
  .onyx-scan-or{display:flex;align-items:center;gap:10px;color:#666;font-size:.7rem;margin:10px 0}.onyx-scan-or:before,.onyx-scan-or:after{content:'';height:1px;background:#262626;flex:1}
  `;
  document.head.appendChild(s);
}

function installScanButton(){
  injectStyle();
  const screen=$('#foodScreen');
  if(!screen) return;
  if($('#nutScanBtn')) return;
  const input=$('#nutBarcode');
  if(!input) return;
  const card=input.closest('.card');
  if(!card) return;
  const btn=document.createElement('button');
  btn.id='nutScanBtn';
  btn.type='button';
  btn.className='onyx-scan-launch';
  btn.setAttribute('data-onyx-scan','1');
  btn.innerHTML='<span>▣</span> SCANNER AVEC LA CAMÉRA';
  const sep=document.createElement('div');
  sep.className='onyx-scan-or';
  sep.textContent='ou entrer le code manuellement';
  const searchRow=input.closest('.nut-search');
  if(searchRow){searchRow.before(btn);btn.after(sep)}else{card.append(btn,sep)}
}

const obs=new MutationObserver(()=>requestAnimationFrame(installScanButton));
obs.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
window.addEventListener('DOMContentLoaded',()=>setTimeout(installScanButton,220));
setTimeout(installScanButton,450);
