import './navigation-cleanup.css';

const $=s=>document.querySelector(s);

function openProfile(tab='info'){
  const topProfile=$('.top [data-nav="profile"]');
  if(topProfile) topProfile.click();
  setTimeout(()=>{
    const chip=document.querySelector(`[data-tab="${tab}"]`);
    if(chip) chip.click();
  },80);
}

function closeSheet(){document.querySelector('.settings-sheet')?.remove()}

function openSheet(){
  closeSheet();
  const sheet=document.createElement('div');
  sheet.className='settings-sheet';
  sheet.innerHTML=`<div class="settings-panel" role="dialog" aria-modal="true" aria-label="Réglages ONYX FIT">
    <h3>Réglages ONYX FIT</h3>
    <p>Compte, matériel et configuration de ton programme.</p>
    <div class="settings-actions">
      <button data-settings-tab="info"><span>◎</span>Profil et informations</button>
      <button data-settings-tab="equipment"><span>◫</span>Matériel / Home gym</button>
      <button data-settings-tab="program"><span>⚡</span>Programme d'entraînement</button>
    </div>
    <button class="settings-close">FERMER</button>
  </div>`;
  document.body.appendChild(sheet);
  sheet.addEventListener('click',e=>{
    if(e.target===sheet||e.target.closest('.settings-close')) return closeSheet();
    const b=e.target.closest('[data-settings-tab]');
    if(b){const tab=b.dataset.settingsTab;closeSheet();openProfile(tab)}
  });
}

function wire(){
  const menu=$('#menu');
  if(menu&&!menu.dataset.settingsWired){
    menu.dataset.settingsWired='1';
    menu.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();openSheet()},true);
  }
}

const obs=new MutationObserver(wire);
obs.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('DOMContentLoaded',wire);
setTimeout(wire,300);
