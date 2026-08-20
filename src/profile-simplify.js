const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];

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
 if(info)info.textContent='Profil';
 if(equipment)equipment.textContent='Matériel';
 if(program)program.textContent='Programme';
 $('#programEditTab')?.setAttribute('aria-hidden','true');
 $('#accountTab')?.setAttribute('aria-hidden','true');
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
 const info=$('[data-tab="info"]'),program=$('[data-tab="program"]');
 if($('#accountTab')?.classList.contains('on')){ $$('.profile-tabs .chip').forEach(x=>x.classList.remove('on'));info?.classList.add('on'); }
 if($('#programEditTab')?.classList.contains('on')){ $$('.profile-tabs .chip').forEach(x=>x.classList.remove('on'));program?.classList.add('on'); }
}

function run(){injectStyle();normalizeTabs();syncVisibleActive();requestAnimationFrame(()=>{addProfileAccountAction();addProgramAction()})}
const obs=new MutationObserver(run);obs.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
window.addEventListener('DOMContentLoaded',()=>setTimeout(run,250));setTimeout(run,500);
