// ONYX FIT v0.1 — safe training flow + fullscreen recovery + robust stats
const STORAGE='onyx_v01';
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const fmt=s=>{s=Math.max(0,Math.floor(Number(s)||0));return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`};
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const readDb=()=>{try{const x=JSON.parse(localStorage.getItem(STORAGE)||'{}');return x&&typeof x==='object'?x:{}}catch{return {}}};
const writeDb=db=>{try{localStorage.setItem(STORAGE,JSON.stringify(db))}catch{}};

const state={
  mode:'session',active:false,paused:false,elapsed:0,startAt:0,tick:null,
  rest:0,restPaused:false,restTick:null,workoutIndex:0,exerciseIndex:0,setIndex:0,sets:[]
};

function programData(){
  const db=readDb();
  return Array.isArray(db.program)?db.program.filter(Boolean):[];
}

function initTraining(){
  const screen=$('#workoutScreen');
  if(!screen||screen.dataset.onyxTrainingV2==='1')return;
  screen.dataset.onyxTrainingV2='1';
  const h=screen.querySelector('h1');
  if(!h)return;
  h.insertAdjacentHTML('afterend',`<div class="training-tabs"><button class="chip on" id="trainingTabSession">Séance</button><button class="chip" id="trainingTabStats">Stats</button></div><div id="trainingStatsBox" hidden></div>`);
  $('#trainingTabSession').onclick=()=>switchMode('session');
  $('#trainingTabStats').onclick=()=>switchMode('stats');
  switchMode('session');
}

function switchMode(mode){
  state.mode=mode;
  $('#trainingTabSession')?.classList.toggle('on',mode==='session');
  $('#trainingTabStats')?.classList.toggle('on',mode==='stats');
  const box=$('#workoutBox'),stats=$('#trainingStatsBox');
  if(box)box.hidden=mode==='stats';
  if(stats)stats.hidden=mode!=='stats';
  if(mode==='stats')renderStats(); else if(!state.active)renderSessionPicker();
}

function renderSessionPicker(){
  const root=$('#workoutBox');if(!root)return;
  const program=programData();
  if(!program.length){
    root.innerHTML='<div class="card onyx-session-picker"><h2>Aucune séance disponible</h2><p class="muted">Crée ton programme dans Profil → Nouveau programme.</p></div>';
    return;
  }
  if(state.workoutIndex>=program.length)state.workoutIndex=0;
  root.innerHTML=`<div class="card onyx-session-picker"><div class="eyebrow">CHOISIS TA SÉANCE</div><h2>Quelle séance aujourd’hui ?</h2><div class="session-choice-list">${program.map((w,i)=>`<button class="session-choice ${i===state.workoutIndex?'on':''}" data-workout-index="${i}"><b>${esc(w.name||`Séance ${i+1}`)}</b><span>${Array.isArray(w.exercises)?w.exercises.length:0} exercices</span></button>`).join('')}</div><button class="btn primary big full" id="startWorkoutBtn">DÉMARRER LA SÉANCE</button></div>`;
  $$('[data-workout-index]').forEach(b=>b.onclick=()=>{state.workoutIndex=Number(b.dataset.workoutIndex)||0;renderSessionPicker()});
  $('#startWorkoutBtn').onclick=startWorkout;
}

function startWorkout(){
  const program=programData(),w=program[state.workoutIndex];
  if(!w||!Array.isArray(w.exercises)||!w.exercises.length)return;
  state.active=true;state.paused=false;state.elapsed=0;state.startAt=Date.now();state.exerciseIndex=0;state.setIndex=0;state.sets=[];
  clearInterval(state.tick);state.tick=setInterval(updateSessionClock,500);
  ensureGlobalPause();renderCurrentSet();updateSessionClock();
}

function updateSessionClock(){
  if(state.active&&!state.paused)state.elapsed=Math.floor((Date.now()-state.startAt)/1000);
  $$('.js-session-clock').forEach(x=>x.textContent=fmt(state.elapsed));
  const b=$('#globalPause');if(b)b.textContent=state.paused?'▶ Reprendre':'Ⅱ Pause';
}

function toggleSessionPause(){
  if(!state.active)return;
  if(state.paused){
    state.paused=false;state.startAt=Date.now()-state.elapsed*1000;
    if(state.rest>0&&state.restPaused){state.restPaused=false;startRestTick()}
  }else{
    state.elapsed=Math.floor((Date.now()-state.startAt)/1000);state.paused=true;
    if(state.restTick){clearInterval(state.restTick);state.restTick=null;state.restPaused=true}
  }
  updateSessionClock();renderRestOverlay();
}

function ensureGlobalPause(){
  let b=$('#globalPause');
  if(!b){b=document.createElement('button');b.id='globalPause';b.className='global-pause';b.onclick=toggleSessionPause;document.body.appendChild(b)}
  updateSessionClock();
}
function removeGlobalPause(){$('#globalPause')?.remove()}

function currentWorkout(){return programData()[state.workoutIndex]}
function currentExercise(){const w=currentWorkout();return Array.isArray(w?.exercises)?w.exercises[state.exerciseIndex]:null}

function renderCurrentSet(){
  const root=$('#workoutBox'),w=currentWorkout(),ex=currentExercise();if(!root)return;
  if(!w||ex==null){endWorkout();return}
  const exercises=Array.isArray(w.exercises)?w.exercises:[];
  root.innerHTML=`<div class="card exercise pro-exercise"><div class="session-mini"><div><span>CHRONO SÉANCE</span><strong class="js-session-clock">${fmt(state.elapsed)}</strong></div><span class="pill">Exercice ${state.exerciseIndex+1}/${exercises.length}</span></div><div class="eyebrow">${esc(w.name||'Séance')}</div><h1>${esc(ex)}</h1><p class="muted">Série ${state.setIndex+1}/3</p><div class="setGrid"><label>Poids (kg)<input id="proWeight" type="number" step="0.5" inputmode="decimal" placeholder="0"></label><label>Répétitions<input id="proReps" type="number" inputmode="numeric" placeholder="0"></label><label>RPE<input id="proRpe" type="number" min="1" max="10" step="0.5" inputmode="decimal" placeholder="8"></label></div><button class="btn primary big full" id="proValidateSet">VALIDER LA SÉRIE</button></div>`;
  $('#proValidateSet').onclick=validateSet;updateSessionClock();
}

function validateSet(){
  const ex=currentExercise();if(ex==null)return;
  const weight=Number($('#proWeight')?.value)||0,reps=Number($('#proReps')?.value)||0,rpe=Number($('#proRpe')?.value)||0;
  state.sets.push({exercise:String(ex),weight,reps,rpe,set:state.setIndex+1});
  state.setIndex++;
  if(state.setIndex>=3){state.setIndex=0;state.exerciseIndex++}
  startRest(90);
}

function recoveryOnyx(){
  return `<span class="rest-onyx"><span class="onyx-art onyx-master-crop recovery" style="--ox:982;--oy:185;--ow:214;--oh:324;--sheet-w:1536;--sheet-h:1024"><img src="/ONYX-FIT-V0.1/assets/CE7966B7-F1FF-42CE-9156-F530A22AEC18.png" alt="Onyx en récupération" draggable="false"></span></span>`;
}
function startRest(sec=90){state.rest=Math.max(1,sec);state.restPaused=false;startRestTick();renderRestOverlay()}
function startRestTick(){
  clearInterval(state.restTick);
  state.restTick=setInterval(()=>{if(!state.paused&&!state.restPaused){state.rest--;if(state.rest<=0){finishRest();return}renderRestOverlay()}},1000);
}
function toggleRestPause(){
  state.restPaused=!state.restPaused;
  if(state.restPaused){clearInterval(state.restTick);state.restTick=null}else if(!state.paused)startRestTick();
  renderRestOverlay();
}
function finishRest(){clearInterval(state.restTick);state.restTick=null;state.rest=0;state.restPaused=false;$('#restFullscreen')?.remove();renderCurrentSet()}
function renderRestOverlay(){
  if(state.rest<=0){$('#restFullscreen')?.remove();return}
  let o=$('#restFullscreen');if(!o){o=document.createElement('div');o.id='restFullscreen';o.className='rest-fullscreen';document.body.appendChild(o)}
  o.innerHTML=`<div class="rest-panel"><div class="eyebrow">RÉCUPÉRATION</div>${recoveryOnyx()}<div class="rest-big">${fmt(state.rest)}</div><p class="muted">Respire. La prochaine série arrive juste après.</p><div class="rest-controls"><button class="btn" id="restMinus">−15 s</button><button class="btn primary" id="restToggle">${state.paused||state.restPaused?'REPRENDRE':'PAUSE'}</button><button class="btn" id="restPlus">+15 s</button></div><button class="btn ghost full" id="skipRest">PASSER LE REPOS</button></div>`;
  $('#restMinus').onclick=()=>{state.rest=Math.max(1,state.rest-15);renderRestOverlay()};
  $('#restPlus').onclick=()=>{state.rest+=15;renderRestOverlay()};
  $('#restToggle').onclick=()=>state.paused?toggleSessionPause():toggleRestPause();
  $('#skipRest').onclick=finishRest;
}

function endWorkout(){
  clearInterval(state.tick);clearInterval(state.restTick);state.tick=state.restTick=null;$('#restFullscreen')?.remove();removeGlobalPause();
  const db=readDb(),w=currentWorkout();db.history=Array.isArray(db.history)?db.history:[];
  db.history.push({date:new Date().toISOString(),workout:String(w?.name||'Séance'),duration:state.elapsed,sets:[...state.sets]});writeDb(db);
  state.active=false;
  const root=$('#workoutBox');
  if(root)root.innerHTML=`<div class="card workout-finished"><div class="eyebrow">SÉANCE TERMINÉE</div><h1>Bien joué 🔥</h1><p>${esc(w?.name||'Séance')} · ${fmt(state.elapsed)} · ${state.sets.length} séries validées</p><button class="btn primary full" id="backToSessions">RETOUR AUX SÉANCES</button></div>`;
  $('#backToSessions')?.addEventListener('click',renderSessionPicker);
}

function safeHistory(){
  const h=readDb().history;
  return Array.isArray(h)?h.filter(x=>x&&typeof x==='object'&&typeof x.workout==='string'&&Array.isArray(x.sets)):[];
}
function renderStats(){
  const root=$('#trainingStatsBox');if(!root)return;
  try{
    const hist=safeHistory();
    if(!hist.length){root.innerHTML='<div class="card"><h2>Statistiques</h2><p class="muted">Termine une séance pour débloquer tes courbes de progression.</p></div>';return}
    const workouts=[...new Set(hist.map(h=>h.workout).filter(Boolean))];
    if(!workouts.length){root.innerHTML='<div class="card"><h2>Statistiques</h2><p class="muted">Aucune donnée exploitable pour le moment.</p></div>';return}
    const selectedWorkout=workouts.includes(root.dataset.workout)?root.dataset.workout:workouts[0];
    const wh=hist.filter(h=>h.workout===selectedWorkout);
    const exercises=[...new Set(wh.flatMap(h=>h.sets.map(s=>s&&s.exercise).filter(Boolean)))];
    if(!exercises.length){root.innerHTML=`<div class="card"><h2>${esc(selectedWorkout)}</h2><p class="muted">Aucune série enregistrée dans cette séance.</p></div>`;return}
    const selectedExercise=exercises.includes(root.dataset.exercise)?root.dataset.exercise:exercises[0];
    const points=wh.map(h=>{
      const sets=h.sets.filter(s=>s&&s.exercise===selectedExercise);
      const weights=sets.map(s=>Number(s.weight)||0),reps=sets.map(s=>Number(s.reps)||0);
      return {date:h.date||'',weight:weights.length?Math.max(...weights):0,reps:reps.length?Math.max(...reps):0};
    }).filter(p=>p.weight||p.reps);
    root.innerHTML=`<div class="card stats-card"><div class="eyebrow">PROGRESSION</div><h2>${esc(selectedWorkout)} → ${esc(selectedExercise)}</h2><div class="grid2"><label>Séance<select id="statsWorkout">${workouts.map(x=>`<option value="${esc(x)}" ${x===selectedWorkout?'selected':''}>${esc(x)}</option>`).join('')}</select></label><label>Exercice<select id="statsExercise">${exercises.map(x=>`<option value="${esc(x)}" ${x===selectedExercise?'selected':''}>${esc(x)}</option>`).join('')}</select></label></div>${chart(points,'weight','Charge maximale','kg')}${chart(points,'reps','Répétitions max','reps')}<div class="stats-summary">${points.slice(-6).reverse().map(p=>`<div class="row"><b>${formatDate(p.date)}</b><span>${p.weight} kg · ${p.reps} reps</span></div>`).join('')}</div></div>`;
    $('#statsWorkout').onchange=e=>{root.dataset.workout=e.target.value;root.dataset.exercise='';renderStats()};
    $('#statsExercise').onchange=e=>{root.dataset.exercise=e.target.value;renderStats()};
  }catch(err){
    console.error('ONYX stats error',err);
    root.innerHTML='<div class="card"><h2>Statistiques</h2><p class="muted">Impossible de lire une ancienne donnée. Les nouvelles séances continueront à être enregistrées normalement.</p></div>';
  }
}
function formatDate(v){const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('fr-FR')}
function chart(points,key,title,unit){
  if(!Array.isArray(points)||!points.length)return `<div class="stat-chart"><h3>${title}</h3><p class="muted">Pas encore de données.</p></div>`;
  const vals=points.map(p=>Number(p[key])||0),max=Math.max(...vals,1),min=Math.min(...vals,0),range=Math.max(1,max-min),w=320,h=120,pad=18;
  const xy=vals.map((v,i)=>{const x=pad+(w-pad*2)*(vals.length===1?.5:i/(vals.length-1));const y=h-pad-(h-pad*2)*(v-min)/range;return [x,y]});
  const line=xy.map(p=>p.join(',')).join(' '),first=vals[0],last=vals[vals.length-1],delta=last-first;
  return `<div class="stat-chart"><div class="stat-chart-head"><div><span>${title}</span><strong>${last} ${unit}</strong></div><b class="${delta>=0?'gain':'loss'}">${delta>=0?'+':''}${delta.toFixed(1)} ${unit}</b></div><svg viewBox="0 0 ${w} ${h}" aria-label="Évolution ${esc(title)}"><polyline points="${line}" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>${xy.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="4" fill="currentColor"/>`).join('')}</svg></div>`;
}

// Main app can redraw #workoutBox. We only restore the picker when needed,
// and never mutate repeatedly once our UI is present.
const observer=new MutationObserver(()=>{
  const screen=$('#workoutScreen');
  if(screen&&screen.dataset.onyxTrainingV2!=='1')initTraining();
  if(screen&&screen.dataset.onyxTrainingV2==='1'&&state.mode==='session'&&!state.active){
    const root=$('#workoutBox');if(root&&!root.querySelector('.onyx-session-picker')&&!root.querySelector('.workout-finished'))renderSessionPicker();
  }
});
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('DOMContentLoaded',()=>setTimeout(initTraining,80));
setTimeout(initTraining,180);
