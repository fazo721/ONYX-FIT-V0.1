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
function dayStats(db){const arr=todays(db);return{count:arr.length,min:arr.reduce((a,x)=>a+(+x.duration||+x.minutes||0),0),kcal:arr.reduce((a,x)=>a+(+x.kcal||0),0)}}
function fmtDuration(min){const m=Math.max(0,+min||0);if(m<60)return `${m} min`;return `${Math.floor(m/60)}h${String(m%60).padStart(2,'0')}`}
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
 const db=read(),d=dayStats(db),w=+db?.profile?.weight||80,goal=800,goalPct=Math.min(100,Math.round((d.kcal/goal)*100));
 const initial=burnEstimate(selected,45,w);
 s.innerHTML=`<div class="activity-app">
  <div class="activity-topbar"><button class="activity-back" type="button" data-nav="home">‹</button><div><h1>DÉPENSES <span>QUOTIDIENNES</span></h1><button class="activity-date-label" type="button">AUJOURD'HUI⌄</button></div><label class="activity-calendar">▣<input id="activityDate" type="date" value="${today()}"></label></div>

  <section class="activity-kpis">
   <div class="activity-kpi"><i>⚡</i><div><span>ACTIVITÉS</span><b>${d.count}</b><em>Objectif : 5</em></div><div class="kpi-track"><u style="width:${Math.min(100,d.count/5*100)}%"></u></div></div>
   <div class="activity-kpi"><i>◷</i><div><span>DURÉE TOTALE</span><b>${fmtDuration(d.min)}</b><em>Objectif : 2h00</em></div><div class="kpi-track"><u style="width:${Math.min(100,d.min/120*100)}%"></u></div></div>
   <div class="activity-kpi"><i>🔥</i><div><span>KCAL DÉPENSÉES</span><b>${Math.round(d.kcal)}</b><em>Objectif : ${goal} kcal</em></div><div class="kpi-track"><u style="width:${goalPct}%"></u></div>${goalPct>=100?'<mark>🔥 OBJECTIF ATTEINT</mark>':''}</div>
  </section>

  <section class="activity-picker-wrap"><div class="section-title"><i>⚡</i><div><b>AJOUTER UNE ACTIVITÉ</b><span>Choisis ton activité</span></div></div><div class="activity-types">${TYPES.map(t=>`<button class="activity-type ${t.name===selected?'on':''}" data-act-type="${t.name}"><div class="activity-image"><img src="${t.asset}" alt="Onyx ${t.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span class="fallback">${t.icon}</span></div><div class="activity-type-label"><span>${t.icon}</span><b>${t.name}</b></div></button>`).join('')}</div><div class="carousel-dots">${TYPES.slice(0,4).map((_,i)=>`<i class="${i===2?'on':''}"></i>`).join('')}</div></section>

  <section class="activity-entry">
   <div class="chosen-row"><div class="chosen-icon">⛰️</div><div><b id="activityChosen">${selected}</b><span id="activitySub">${TYPES.find(x=>x.name===selected)?.sub||''}</span></div><button class="activity-change" type="button" id="activityChange">↔ CHANGER</button></div>
   <div class="entry-rule"></div>
   <div class="entry-line"><div class="line-icon">◷</div><div class="line-copy"><b>DURÉE</b><span>Ajuste ta durée d’activité</span></div><div class="line-stepper"><button data-step="min" data-delta="-5">−</button><strong><span id="activityMinLabel">45</span><small>min</small></strong><input id="activityMin" type="number" value="45" min="1"><button data-step="min" data-delta="5">+</button></div></div>
   <div class="entry-rule"></div>
   <div class="entry-line"><div class="line-icon">🔥</div><div class="line-copy"><b>KCAL ESTIMÉES</b><span>Basé sur ton poids (${Math.round(w)} kg)</span></div><div class="kcal-value"><strong id="activityKcalLabel">${initial}</strong><span>kcal</span><input id="activityKcal" type="number" value="${initial}" min="0"></div><button class="activity-edit-kcal" type="button" id="activityEditKcal">✎ MODIFIER</button></div>
   <div class="activity-estimate">Estimation ONYX : <b id="activityEstimate">${initial} kcal</b> · tu peux modifier si tu as une montre ou une machine.</div>
   <button class="activity-save" id="activitySave">＋ AJOUTER CETTE ACTIVITÉ</button>
  </section>

  <section class="activity-history-wrap"><div class="activity-history-head"><div><i>⚡</i><b>HISTORIQUE DU JOUR</b></div><button type="button">VOIR TOUT ›</button></div><div class="activity-history" id="activityHistory">${historyHtml(db)}</div></section>
 </div>`;
 bind();
}

function bind(){
 const db=read(),weight=+db?.profile?.weight||80,min=$('#activityMin'),kcal=$('#activityKcal'),minL=$('#activityMinLabel'),kcalL=$('#activityKcalLabel'),est=$('#activityEstimate');
 const sync=(auto=false)=>{const m=Math.max(1,+min.value||1);if(auto)kcal.value=burnEstimate(selected,m,weight);minL.textContent=m;kcalL.textContent=Math.max(0,Math.round(+kcal.value||0));est.textContent=burnEstimate(selected,m,weight)+' kcal'};
 const choose=b=>{selected=b.dataset.actType;$$('[data-act-type]').forEach(x=>x.classList.toggle('on',x===b));$('#activityChosen').textContent=selected;$('#activitySub').textContent=TYPES.find(x=>x.name===selected)?.sub||'';sync(true);b.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'})};
 $$('[data-act-type]').forEach(b=>b.onclick=()=>choose(b));
 $('#activityChange').onclick=()=>{$('.activity-types')?.scrollIntoView({behavior:'smooth',block:'nearest'})};
 $$('[data-step]').forEach(b=>b.onclick=()=>{const input=b.dataset.step==='min'?min:kcal;input.value=Math.max(b.dataset.step==='min'?1:0,(+input.value||0)+(+b.dataset.delta||0));sync(b.dataset.step==='min')});
 min.oninput=()=>sync(true);kcal.oninput=()=>sync(false);
 $('#activityEditKcal').onclick=()=>{kcal.classList.toggle('show');if(kcal.classList.contains('show'))kcal.focus()};
 $('#activitySave').onclick=()=>{const db=read();db.activities=Array.isArray(db.activities)?db.activities:[];const n=new Date();db.activities.push({id:uid(),type:selected,duration:Math.max(1,+min.value||1),kcal:Math.max(0,+kcal.value||0),date:$('#activityDate').value||today(),time:`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`,source:'manual'});write(db);refresh()};
 $$('[data-del-act]').forEach(b=>b.onclick=()=>{const db=read(),id=b.dataset.delAct;db.activities=(db.activities||[]).filter(x=>String(x.id)!==String(id));write(db);refresh()});
}
function refresh(){const s=$('#activityScreen');if(!s)return;s.dataset.activityRedesign='';render()}
const obs=new MutationObserver(()=>{const s=$('#activityScreen');if(s&&s.classList.contains('active')&&s.dataset.activityRedesign!=='1')requestAnimationFrame(render)});obs.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});window.addEventListener('DOMContentLoaded',()=>setTimeout(render,400));setTimeout(render,800);
