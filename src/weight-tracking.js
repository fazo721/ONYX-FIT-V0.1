import './weight-tracking.css';

const $=s=>document.querySelector(s);
const KEY='onyx_v01';
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return{}}};
const save=db=>localStorage.setItem(KEY,JSON.stringify(db));
const today=()=>new Date().toISOString().slice(0,10);
const fmt=d=>{try{return new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(`${d}T12:00:00`))}catch{return d||''}};

function history(db){
  return (Array.isArray(db.body)?db.body:[])
    .filter(x=>Number(x?.weight)>0&&x?.date)
    .slice()
    .sort((a,b)=>String(b.date).localeCompare(String(a.date)));
}

function html(){
  const db=read(),arr=history(db);
  const current=Number(arr[0]?.weight||db?.profile?.weight||80);
  const previous=arr[1]?Number(arr[1].weight):null;
  const delta=previous===null?null:current-previous;
  return `<section class="weight-card" id="weightTracking">
    <div class="weight-head">
      <div><span>SUIVI DU POIDS</span><h2>${current.toFixed(1).replace('.',',')} <small>kg</small></h2>
      <p>${delta===null?'Ajoute une pesée pour suivre ton évolution.':delta===0?'Poids stable depuis la dernière pesée.':`${delta>0?'+':''}${delta.toFixed(1).replace('.',',')} kg depuis la dernière pesée.`}</p></div>
      <div class="weight-icon">⚖</div>
    </div>
    <div class="weight-form">
      <label><span>Poids</span><div><input id="manualWeight" type="number" inputmode="decimal" step="0.1" min="20" max="400" value="${current.toFixed(1)}"><b>kg</b></div></label>
      <label><span>Date</span><input id="manualWeightDate" type="date" value="${today()}"></label>
      <button id="addManualWeight" type="button">＋ AJOUTER LA PESÉE</button>
    </div>
    ${arr.length?`<div class="weight-history"><div class="weight-history-title"><b>Dernières pesées</b><span>${arr.length} mesure${arr.length>1?'s':''}</span></div>${arr.slice(0,5).map((x,i)=>`<div class="weight-row"><span>${fmt(x.date)}</span><strong>${Number(x.weight).toFixed(1).replace('.',',')} kg</strong>${i===0?'<i>ACTUEL</i>':`<button type="button" data-weight-del="${x.id}">×</button>`}</div>`).join('')}</div>`:''}
  </section>`;
}

function infoVisible(){
  const screen=$('#profileScreen'),box=$('#profileBox'),tab=document.querySelector('[data-tab="info"]');
  return !!(screen?.classList.contains('active')&&box&&tab?.classList.contains('on'));
}

function mount(){
  if(!infoVisible())return;
  const box=$('#profileBox');
  if(!box||$('#weightTracking'))return;
  box.insertAdjacentHTML('beforeend',html());
}

function redraw(){
  const old=$('#weightTracking');
  if(!old)return mount();
  old.outerHTML=html();
}

function addWeight(){
  const input=$('#manualWeight'),date=$('#manualWeightDate');
  const weight=Number(input?.value),d=date?.value||today();
  if(!Number.isFinite(weight)||weight<20||weight>400){input?.focus();return}
  const db=read();db.body=Array.isArray(db.body)?db.body:[];db.profile=db.profile||{};
  db.body=db.body.filter(x=>!(x?.source==='manual'&&x?.date===d));
  db.body.push({id:`weight-${Date.now()}`,date:d,weight:Number(weight.toFixed(1)),source:'manual'});
  const arr=history(db);if(arr[0])db.profile.weight=Number(arr[0].weight);
  save(db);redraw();
  window.dispatchEvent(new CustomEvent('onyx:weight-updated',{detail:{weight:Number(weight.toFixed(1)),date:d}}));
}

function removeWeight(id){
  const db=read();db.body=(Array.isArray(db.body)?db.body:[]).filter(x=>x?.id!==id);
  const arr=history(db);if(arr[0]){db.profile=db.profile||{};db.profile.weight=Number(arr[0].weight)}
  save(db);redraw();
}

document.addEventListener('click',e=>{
  if(e.target.closest('[data-nav="profile"], [data-tab="info"]'))setTimeout(mount,80);
  if(e.target.closest('#addManualWeight'))addWeight();
  const del=e.target.closest('[data-weight-del]');if(del)removeWeight(del.dataset.weightDel);
});

window.addEventListener('DOMContentLoaded',()=>setTimeout(mount,300));
