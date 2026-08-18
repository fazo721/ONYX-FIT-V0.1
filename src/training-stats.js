// ONYX FIT v0.1 — training timer + rest timer + statistics
const STORAGE='onyx_v01';
const state={startedAt:null,elapsed:0,paused:false,tick:null,rest:0,restTick:null,statsMode:false};
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const readDb=()=>{try{return JSON.parse(localStorage.getItem(STORAGE)||'{}')}catch{return {}}};
const fmt=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

function ensureTrainingHeader(){
  const screen=$('#workoutScreen');
  if(!screen||screen.dataset.statsEnhanced)return;
  screen.dataset.statsEnhanced='1';
  const h=screen.querySelector('h1');
  if(!h)return;
  const tabs=document.createElement('div');
  tabs.className='training-tabs';
  tabs.innerHTML='<button class="chip on" id="trainingTabSession">Séance</button><button class="chip" id="trainingTabStats">Stats</button>';
  h.insertAdjacentElement('afterend',tabs);
  const stats=document.createElement('div');
  stats.id='trainingStatsBox';
  stats.hidden=true;
  tabs.insertAdjacentElement('afterend',stats);
  $('#trainingTabSession').onclick=()=>showMode(false);
  $('#trainingTabStats').onclick=()=>showMode(true);
}
function showMode(stats){
  state.statsMode=stats;
  const box=$('#workoutBox'),s=$('#trainingStatsBox');
  if(box)box.hidden=stats;
  if(s)s.hidden=!stats;
  $('#trainingTabSession')?.classList.toggle('on',!stats);
  $('#trainingTabStats')?.classList.toggle('on',stats);
  if(stats)renderStats();
}

function ensureWorkoutTimer(){
  const box=$('#workoutBox .exercise');
  if(!box||box.querySelector('.session-timer'))return;
  const timer=document.createElement('div');
  timer.className='session-timer';
  timer.innerHTML='<div><span>CHRONO SÉANCE</span><strong id="sessionTimerValue">00:00</strong></div><button class="btn" id="sessionTimerPause">PAUSE</button>';
  box.prepend(timer);
  if(state.startedAt===null){state.startedAt=Date.now();state.paused=false;startSessionTick()}
  $('#sessionTimerPause').onclick=toggleSessionPause;
  updateSessionTimer();
}
function startSessionTick(){clearInterval(state.tick);state.tick=setInterval(()=>{if(!state.paused)updateSessionTimer()},1000)}
function updateSessionTimer(){
  if(state.startedAt!==null&&!state.paused)state.elapsed=Math.floor((Date.now()-state.startedAt)/1000);
  const el=$('#sessionTimerValue');if(el)el.textContent=fmt(state.elapsed);
  const b=$('#sessionTimerPause');if(b)b.textContent=state.paused?'REPRENDRE':'PAUSE';
}
function toggleSessionPause(){
  if(state.paused){state.startedAt=Date.now()-state.elapsed*1000;state.paused=false;startSessionTick()}
  else{state.elapsed=Math.floor((Date.now()-state.startedAt)/1000);state.paused=true;clearInterval(state.tick)}
  updateSessionTimer();
}

function startRestTimer(seconds=90){
  state.rest=seconds;clearInterval(state.restTick);
  state.restTick=setInterval(()=>{state.rest=Math.max(0,state.rest-1);renderRest();if(!state.rest)clearInterval(state.restTick)},1000);
  renderRest();
}
function renderRest(){
  const box=$('#workoutBox .exercise');if(!box)return;
  let r=box.querySelector('.rest-timer');
  if(!r){r=document.createElement('div');r.className='rest-timer';const anchor=box.querySelector('.setGrid');anchor?.insertAdjacentElement('beforebegin',r)}
  r.innerHTML=`<div><span>REPOS</span><strong>${fmt(state.rest)}</strong></div><div class="rest-actions"><button class="btn" data-rest="-15">−15s</button><button class="btn" id="restPause">${state.restTick?'PAUSE':'REPRENDRE'}</button><button class="btn" data-rest="15">+15s</button></div>`;
  r.querySelectorAll('[data-rest]').forEach(b=>b.onclick=()=>{state.rest=Math.max(0,state.rest+(+b.dataset.rest));renderRest()});
  const p=r.querySelector('#restPause');if(p)p.onclick=()=>{if(state.restTick){clearInterval(state.restTick);state.restTick=null}else{state.restTick=setInterval(()=>{state.rest=Math.max(0,state.rest-1);renderRest();if(!state.rest){clearInterval(state.restTick);state.restTick=null}},1000)}renderRest()};
}
function bindValidate(){
  const b=$('#validateSet');if(!b||b.dataset.restBound)return;b.dataset.restBound='1';
  b.addEventListener('click',()=>setTimeout(()=>startRestTimer(90),30));
}

function historyData(){return readDb().history||[]}
function esc(v=''){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function renderStats(){
  const root=$('#trainingStatsBox');if(!root)return;
  const hist=historyData();
  if(!hist.length){root.innerHTML='<div class="card"><h2>Statistiques</h2><p class="muted">Termine ta première séance pour débloquer tes courbes de progression.</p></div>';return}
  const workouts=[...new Set(hist.map(h=>h.workout))];
  const selectedWorkout=root.dataset.workout||workouts[0];
  const wh=hist.filter(h=>h.workout===selectedWorkout);
  const exercises=[...new Set(wh.flatMap(h=>(h.sets||[]).map(s=>s.exercise)))];
  const selectedExercise=exercises.includes(root.dataset.exercise)?root.dataset.exercise:exercises[0];
  const points=wh.map(h=>{
    const sets=(h.sets||[]).filter(s=>s.exercise===selectedExercise);
    return {date:h.date,weight:sets.length?Math.max(...sets.map(s=>+s.weight||0)):0,reps:sets.length?Math.max(...sets.map(s=>+s.reps||0)):0,volume:sets.reduce((a,s)=>a+(+s.weight||0)*(+s.reps||0),0)}
  }).filter(p=>p.weight||p.reps);
  root.innerHTML=`<div class="card stats-card"><div class="eyebrow">PROGRESSION</div><h2>${esc(selectedWorkout)} → ${esc(selectedExercise||'Exercice')}</h2><div class="grid2"><label>Séance<select id="statsWorkout">${workouts.map(x=>`<option ${x===selectedWorkout?'selected':''}>${esc(x)}</option>`).join('')}</select></label><label>Exercice<select id="statsExercise">${exercises.map(x=>`<option ${x===selectedExercise?'selected':''}>${esc(x)}</option>`).join('')}</select></label></div>${chart(points,'weight','Charge maximale','kg')}${chart(points,'reps','Répétitions max','reps')}<div class="stats-summary">${points.slice(-6).reverse().map(p=>`<div class="row"><b>${new Date(p.date).toLocaleDateString('fr-FR')}</b><span>${p.weight} kg · ${p.reps} reps</span></div>`).join('')}</div></div>`;
  $('#statsWorkout').onchange=e=>{root.dataset.workout=e.target.value;root.dataset.exercise='';renderStats()};
  $('#statsExercise').onchange=e=>{root.dataset.exercise=e.target.value;renderStats()};
}
function chart(points,key,title,unit){
  if(!points.length)return `<div class="stat-chart"><h3>${title}</h3><p class="muted">Pas encore de données.</p></div>`;
  const vals=points.map(p=>+p[key]||0),max=Math.max(...vals,1),min=Math.min(...vals,0),range=Math.max(1,max-min),w=320,h=120,pad=18;
  const xy=vals.map((v,i)=>{const x=pad+(w-pad*2)*(points.length===1?.5:i/(points.length-1));const y=h-pad-(h-pad*2)*(v-min)/range;return [x,y]});
  const line=xy.map(x=>x.join(',')).join(' '),last=vals.at(-1),first=vals[0],delta=last-first;
  return `<div class="stat-chart"><div class="stat-chart-head"><div><span>${title}</span><strong>${last} ${unit}</strong></div><b class="${delta>=0?'gain':'loss'}">${delta>=0?'+':''}${delta.toFixed(1)} ${unit}</b></div><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Évolution ${title}"><polyline points="${line}" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>${xy.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="4" fill="currentColor"/>`).join('')}</svg></div>`
}

const obs=new MutationObserver(()=>{ensureTrainingHeader();ensureWorkoutTimer();bindValidate();if(state.statsMode)showMode(true)});
obs.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('DOMContentLoaded',()=>{ensureTrainingHeader();ensureWorkoutTimer();bindValidate()});
setTimeout(()=>{ensureTrainingHeader();ensureWorkoutTimer();bindValidate()},150);
