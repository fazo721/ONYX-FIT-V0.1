const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let scheduled=false;

function injectStyle(){
 if($('#profileSimplifyStyle'))return;
 const s=document.createElement('style');s.id='profileSimplifyStyle';s.textContent=`
 .profile-tabs{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:5px!important;overflow:visible!important}
 .profile-tabs .chip{min-width:0!important;width:100%!important;padding:0 8px!important;white-space:nowrap!important}
 #programEditTab,#accountTab{display:none!important}
 .profile-subaction{margin-top:10px;padding:12px;border:1px solid #292929;border-radius:15px;background:linear-gradient(145deg,#141414,#0b0b0b);display:flex;align-items:center;justify-content:space-between;gap:10px}
 .profile-subaction>div{min-width:0}.profile-subaction b{display:block;font-size:.82rem}.profile-subaction span{display:block;margin-top:3px;color:#7f7f7f;font-size:.62rem;line-height:1.35}.profile-subaction button{flex:0 0 auto;border:1px solid #6b3212;background:#17100c;color:#ff8b49;border-radius:10px;padding:9px 11px;font-size:.62rem;font-weight:850}
 @media(max-width:380px){.profile-tabs .chip{font-size:.7rem!important;padding:0 5px!important}.profile-subaction{padding:10px}.profile-subaction button{padding:8px}}
 `;document.head.appendChild(s)
}

function normalizeTabs(){
 const tabs=$('.profile-tabs');if(!tabs)return;
 const info=tabs.querySelector('[data-tab="info"]'),equipment=tabs.querySelector('[data-tab="equipment"]'),program=tabs.querySelector('[data-tab="program"]');
 if(info&&info.textContent!=='Profil')info.textContent='Profil';
 if(equipment&&equipment.textContent!=='Matériel')equipment.textContent='Matériel';
 if(program&&program.textContent!=='Programme')program.textContent='Programme';
 const edit=$('#programEditTab'),account=$('#accountTab');
 if(edit&&edit.getAttribute('aria-hidden')!=='true')edit.setAttribute('aria-hidden','true');
 if(account&&account.getAttribute('aria-hidden')!=='true')account.setAttribute('aria-hidden','true');
}

function addProfileAccountAction(){
 const box=$('#profileBox'),info=$('[data-tab="info"]');if(!box||!info||!info.classList.contains('on')||box.querySelector('.profile-account-action'))return;
 const action=document.createElement('div');action.className='profile-subaction profile-account-action';
 action.innerHTML=`<div><b>Compte & synchronisation</b><span>Connexion, sécurité et sauvegarde de tes données.</span></div><button type="button">OUVRIR</button>`;
 action.querySelector('button').onclick=()=>$('#accountTab')?.click();
 box.appendChild(action);
}

function addProgramAction(){
 const box=$('#profileBox'),program=$('[data-tab="program"]');if(!box||!program||!program.classList.contains('on')||box.querySelector('.profile-program-action'))return;
 const action=document.createElement('div');action.className='profile-subaction profile-program-action';
 action.innerHTML=`<div><b>Programme actuel</b><span>Modifie les séances, exercices, séries, répétitions, RPE et repos.</span></div><button type="button">MODIFIER</button>`;
 action.querySelector('button').onclick=()=>$('#programEditTab')?.click();
 box.appendChild(action);
}

function syncVisibleActive(){
 const info=$('[data-tab="info"]'),program=$('[data-tab="program"]'),account=$('#accountTab'),edit=$('#programEditTab');
 if(account?.classList.contains('on')){
   if(!info?.classList.contains('on')){$$('.profile-tabs .chip.on').forEach(x=>x.classList.remove('on'));info?.classList.add('on')}
 }
 if(edit?.classList.contains('on')){
   if(!program?.classList.contains('on')){$$('.profile-tabs .chip.on').forEach(x=>x.classList.remove('on'));program?.classList.add('on')}
 }
}

function run(){scheduled=false;injectStyle();normalizeTabs();syncVisibleActive();addProfileAccountAction();addProgramAction()}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(run)}
const obs=new MutationObserver(schedule);
obs.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('DOMContentLoaded',()=>setTimeout(schedule,250));setTimeout(schedule,500);
