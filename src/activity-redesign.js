import './activity-redesign.css';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];

const TYPES=[
 {name:'Course',icon:'🏃',asset:'/ONYX-FIT-V0.1/assets/activity-run.webp',met:9.8,sub:'Course à pied'},
 {name:'Vélo',icon:'🚴',asset:'/ONYX-FIT-V0.1/assets/activity-bike.webp',met:7.5,sub:'Vélo route'},
 {name:'VTT',icon:'⛰️',asset:'/ONYX-FIT-V0.1/assets/activity-vtt.webp',met:8.8,sub:'Vélo tout terrain'},
 {name:'Natation',icon:'🏊',asset:'/ONYX-FIT-V0.1/assets/activity-swim.webp',met:8.0,sub:'Natation'},
 {name:'Randonnée',icon:'🥾',asset:'/ONYX-FIT-V0.1/assets/activity-hike.webp',met:6.0,sub:'Randonnée'},
 {name:'Cani-cross',icon:'🐾',asset:'/ONYX-FIT-V0.1/assets/activity-canicross.webp',met:10.0,sub:'Course avec chien'}
];
let selected='VTT';

function read(){try{return JSON.parse(localStorage.getItem('onyx_v01')||'{}')||{}}catch{return{}}}
function write(db){localStorage.setItem('onyx_v01',JSON.stringify(db));document.dispatchEvent(new CustomEvent('onyx:db-updated'))}
function today(){return new Date().toISOString().slice(0,10)}
function burnEstimate(type,min,weight){const met=TYPES.find(x=>x.name===type)?.met||5;return Math.max(0,Math.round(met*3.5*(+weight||80)/200*(+min||0)))}
function todays(db){return (Array.isArray(db.activities)?db.activities:[]).filter(x=>x.date===today())}
function activityIcon(type){return TYPES.find(x=>x.name===type)?.icon||'⚡'}
function uid(){return crypto.randomUUID?.()||String(Date.now()+Math.random())}

function historyHtml(db){
 const arr=todays(db).slice().reverse();
 if(!arr.length)return `<div class="activity-history-card empty"><b>Aucune activité aujourd’hui</b><span>Ta première activité apparaîtra ici.</span></div>`;
 return arr.map(x=>`<article class="activity-history-card"><button class="activity-delete" data-del-act="${x.id||''}" aria-label="Supprimer">⌫</button><div class="history-icon">${activityIcon(x.type)}</div><div class="history-main"><b>${x.type||'Activité'}</b><span>${x.time||''}</span></div><div class="history-foot"><span>◷ ${+x.duration||+x.minutes||0} min</span><strong>🔥 ${Math.round(+x.kcal||0)} kcal</strong></div></article>`).join('')
}

function render(){
 const s=$('#activityScreen');if(!s||s.dataset.activityRedesign==='1')return;
 s.dataset.activityRedesign='1';
 const db=read(),w=+db?.profile?.weight||80;
 const initial=burnEstimate(selected,45,w),sel=TYPES.find(x=>x.name===selected)||TYPES[0];
 s.innerHTML=`<div class="activity-app activity-app-compact">
  <div class="activity-topbar"><button class="activity-back" type="button" data-nav="home">‹</button><div><h1>DÉPENSES <span>QUOTIDIENNES</span></h1><button class="activity-date-label" type="button">AUJOURD'HUI⌄</button></div><label class="activity-calendar">▣<input id="activityDate" type="date" value="${today()}"></label></div>

  <section class="activity-picker-wrap"><div class="section-title"><i>⚡</i><div><b>AJOUTER UNE ACTIVITÉ</b><span>Choisis ton activité</span></div></div><div class="activity-types">${TYPES.map(t=>`<button class="activity-type ${t.name===selected?'on':''}" data-act-type="${t.name}"><div class="activity-image"><img src="${t.asset}" alt="Onyx ${t.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span class="fallback">${t.icon}</span></div><div class="activity-type-label"><span>${t.icon}</span><b>${t.name}</b></div></button>`).join('')}</div></section>

  <section class="activity-entry">
   <div class="chosen-row"><div class="chosen-icon" id="activityChosenIcon">${sel.icon}</div><div><b id="activityChosen">${selected}</b><span id="activitySub">${sel.sub}</span></div><button class="activity-change" type="button" id="activityChange">↔ CHANGER</button></div>
   <div class="entry-rule"></div>
   <div class="entry-line"><div class="line-icon">◷</div><div class="line-copy"><b>DURÉE</b><span>Ajuste ta durée d’activité</span></div><div class="line-stepper"><button data-step="min" data-delta="-5">−</button><strong><span id="activityMinLabel">45</span><small>min</small></strong><input id="activityMin" type="number" value="45" min="1"><button data-step="min" data-delta="5">+</button></div></div>
   <div class="entry-rule"></div>
   <div class="entry-line kcal-line"><div class="line-icon">🔥</div><div class="line-copy"><b>KCAL</b><span>Estimation selon ton poids (${Math.round(w)} kg), modifiable</span></div><label class="kcal-inline"><input id="activityKcal" inputmode="numeric" type="number" value="${initial}" min="0" aria-label="Calories dépensées"><span>kcal</span></label></div>
   <div class="activity-estimate">Estimation ONYX : <b id="activityEstimate">${initial} kcal</b> · remplace-la directement par la valeur de ta montre si besoin.</div>
   <button class="activity-save" id="activitySave">＋ AJOUTER CETTE ACTIVITÉ</button>
  </section>

  <section class="activity-history-wrap"><div class="activity-history-head"><div><i>⚡</i><b>HISTORIQUE DU JOUR</b></div><button type="button">VOIR TOUT ›</button></div><div class="activity-history" id="activityHistory">${historyHtml(db)}</div></section>
 </div>`;
 bind();
}

function bind(){
 const db=read(),weight=+db?.profile?.weight||80,min=$('#activityMin'),kcal=$('#activityKcal'),minL=$('#activityMinLabel'),est=$('#activityEstimate');
 const sync=(auto=false)=>{const m=Math.max(1,+min.value||1);const estimate=burnEstimate(selected,m,weight);if(auto)kcal.value=estimate;minL.textContent=m;est.textContent=estimate+' kcal'};
 const choose=b=>{selected=b.dataset.actType;const type=TYPES.find(x=>x.name===selected)||TYPES[0];$$('[data-act-type]').forEach(x=>x.classList.toggle('on',x===b));$('#activityChosen').textContent=selected;$('#activitySub').textContent=type.sub;$('#activityChosenIcon').textContent=type.icon;sync(true);b.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'})};
 $$('[data-act-type]').forEach(b=>b.onclick=()=>choose(b));
 $('#activityChange').onclick=()=>{$('.activity-types')?.scrollIntoView({behavior:'smooth',block:'nearest'})};
 $$('[data-step]').forEach(b=>b.onclick=()=>{min.value=Math.max(1,(+min.value||0)+(+b.dataset.delta||0));sync(true)});
 min.oninput=()=>sync(true);
 kcal.oninput=()=>{kcal.value=Math.max(0,+kcal.value||0)};
 $('#activitySave').onclick=()=>{const db=read();db.activities=Array.isArray(db.activities)?db.activities:[];const n=new Date();db.activities.push({id:uid(),type:selected,duration:Math.max(1,+min.value||1),kcal:Math.max(0,+kcal.value||0),date:$('#activityDate').value||today(),time:`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`,source:'manual'});write(db);refresh()};
 $$('[data-del-act]').forEach(b=>b.onclick=()=>{const db=read(),id=b.dataset.delAct;db.activities=(db.activities||[]).filter(x=>String(x.id)!==String(id));write(db);refresh()});
}
function refresh(){const s=$('#activityScreen');if(!s)return;s.dataset.activityRedesign='';render()}
const obs=new MutationObserver(()=>{const s=$('#activityScreen');if(s&&s.classList.contains('active')&&s.dataset.activityRedesign!=='1')requestAnimationFrame(render)});obs.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});window.addEventListener('DOMContentLoaded',()=>setTimeout(render,400));setTimeout(render,800);
