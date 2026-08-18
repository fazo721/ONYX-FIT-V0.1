// ONYX FIT v0.1 — safe training flow + navigable recovery + detailed stats
const STORAGE='onyx_v01';
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const fmt=s=>{s=Math.max(0,Math.floor(Number(s)||0));return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`};
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const readDb=()=>{try{const x=JSON.parse(localStorage.getItem(STORAGE)||'{}');return x&&typeof x==='object'?x:{}}catch{return {}}};
const writeDb=db=>{try{localStorage.setItem(STORAGE,JSON.stringify(db))}catch{}};

const state={mode:'session',active:false,paused:false,elapsed:0,startAt:0,tick:null,rest:0,restTotal:0,restPaused:false,restTick:null,restMinimized:false,workoutIndex:0,exerciseIndex:0,setIndex:0,sets:[]};

function programData(){const db=readDb();return Array.isArray(db.program)?db.program.filter(Boolean):[]}

function initTraining(){
  const screen=$('#workoutScreen');
  if(!screen||screen.dataset.onyxTrainingV3==='1')return;
  screen.dataset.onyxTrainingV3='1';
  const h=screen.querySelector('h1');if(!h)return;
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
  if(box)box.hidden=mode==='stats';if(stats)stats.hidden=mode!=='stats';
  if(mode==='stats')renderStats();else if(!state.active)renderSessionPicker();
}
function renderSessionPicker(){
  const root=$('#workoutBox');if(!root)return;const program=programData();
  if(!program.length){root.innerHTML='<div class="card onyx-session-picker"><h2>Aucune séance disponible</h2><p class="muted">Crée ton programme dans Profil → Nouveau programme.</p></div>';return}
  if(state.workoutIndex>=program.length)state.workoutIndex=0;
  root.innerHTML=`<div class="card onyx-session-picker"><div class="eyebrow">CHOISIS TA SÉANCE</div><h2>Quelle séance aujourd’hui ?</h2><div class="session-choice-list">${program.map((w,i)=>`<button class="session-choice ${i===state.workoutIndex?'on':''}" data-workout-index="${i}"><b>${esc(w.name||`Séance ${i+1}`)}</b><span>${Array.isArray(w.exercises)?w.exercises.length:0} exercices</span></button>`).join('')}</div><button class="btn primary big full" id="startWorkoutBtn">DÉMARRER LA SÉANCE</button></div>`;
  $$('[data-workout-index]').forEach(b=>b.onclick=()=>{state.workoutIndex=Number(b.dataset.workoutIndex)||0;renderSessionPicker()});
  $('#startWorkoutBtn').onclick=startWorkout;
}
function startWorkout(){
  const w=programData()[state.workoutIndex];if(!w||!Array.isArray(w.exercises)||!w.exercises.length)return;
  state.active=true;state.paused=false;state.elapsed=0;state.startAt=Date.now();state.exerciseIndex=0;state.setIndex=0;state.sets=[];
  clearInterval(state.tick);state.tick=setInterval(updateSessionClock,500);ensureGlobalPause();renderCurrentSet();updateSessionClock();
}
function updateSessionClock(){
  if(state.active&&!state.paused)state.elapsed=Math.floor((Date.now()-state.startAt)/1000);
  $$('.js-session-clock').forEach(x=>x.textContent=fmt(state.elapsed));updateFloatingBar();
}
function toggleSessionPause(){
  if(!state.active)return;
  if(state.paused){state.paused=false;state.startAt=Date.now()-state.elapsed*1000;if(state.rest>0&&state.restPaused){state.restPaused=false;startRestTick()}}
  else{state.elapsed=Math.floor((Date.now()-state.startAt)/1000);state.paused=true;if(state.restTick){clearInterval(state.restTick);state.restTick=null;state.restPaused=true}}
  updateSessionClock();if(!state.restMinimized)renderRestOverlay();
}
function ensureGlobalPause(){let b=$('#globalPause');if(!b){b=document.createElement('div');b.id='globalPause';b.className='global-pause-bar';document.body.appendChild(b)}updateFloatingBar()}
function updateFloatingBar(){
  const b=$('#globalPause');if(!b)return;
  const restPart=state.rest>0?`<button class="floating-rest" id="floatingRestBtn">⏱ ${fmt(state.rest)}</button>`:'';
  b.innerHTML=`${restPart}<button class="floating-pause" id="floatingPauseBtn">${state.paused?'▶ Reprendre':'Ⅱ Pause'}</button>`;
  $('#floatingPauseBtn')?.addEventListener('click',toggleSessionPause);
  $('#floatingRestBtn')?.addEventListener('click',()=>{state.restMinimized=false;renderRestOverlay()});
}
function removeGlobalPause(){$('#globalPause')?.remove()}
function currentWorkout(){return programData()[state.workoutIndex]}
function currentExerciseRaw(){const w=currentWorkout();return Array.isArray(w?.exercises)?w.exercises[state.exerciseIndex]:null}
function exerciseName(ex){return typeof ex==='string'?ex:String(ex?.name||ex?.exercise||'Exercice')}
function exerciseRest(ex){
  if(ex&&typeof ex==='object'){const custom=Number(ex.rest??ex.restSeconds??ex.recovery);if(custom>0)return Math.round(custom)}
  const n=exerciseName(ex).toLowerCase();
  if(/curl|extension triceps|triceps|élévation|elevation|oiseau|face pull|mollet|abdo|planche|gainage/.test(n))return 45;
  if(/fente|bulgare|hip thrust|rowing|tirage|développé incliné|developpe incline|développé épaules|developpe epaules/.test(n))return 75;
  if(/squat|soulevé de terre|souleve de terre|développé couché|developpe couche|leg press/.test(n))return 90;
  return 60;
}
function renderCurrentSet(){
  const root=$('#workoutBox'),w=currentWorkout(),raw=currentExerciseRaw();if(!root)return;if(!w||raw==null){endWorkout();return}
  const ex=exerciseName(raw),exercises=Array.isArray(w.exercises)?w.exercises:[],last=lastPerformance(String(w.name||''),ex);
  root.innerHTML=`<div class="card exercise pro-exercise"><div class="session-mini"><div><span>CHRONO SÉANCE</span><strong class="js-session-clock">${fmt(state.elapsed)}</strong></div><span class="pill">Exercice ${state.exerciseIndex+1}/${exercises.length}</span></div><div class="eyebrow">${esc(w.name||'Séance')}</div><h1>${esc(ex)}</h1><p class="muted">Série ${state.setIndex+1}/3 · Repos prévu ${fmt(exerciseRest(raw))}</p>${last?`<div class="last-performance"><span>DERNIÈRE FOIS</span><b>${last.weight} kg · ${last.reps} reps · RPE ${last.rpe||'—'}</b></div>`:''}<div class="setGrid"><label>Poids (kg)<input id="proWeight" type="number" step="0.5" inputmode="decimal" placeholder="${last?.weight??0}"></label><label>Répétitions<input id="proReps" type="number" inputmode="numeric" placeholder="${last?.reps??0}"></label><label>RPE<input id="proRpe" type="number" min="1" max="10" step="0.5" inputmode="decimal" placeholder="${last?.rpe??8}"></label></div><button class="btn primary big full" id="proValidateSet">VALIDER LA SÉRIE</button></div>`;
  $('#proValidateSet').onclick=validateSet;updateSessionClock();
}
function validateSet(){
  const raw=currentExerciseRaw();if(raw==null)return;const ex=exerciseName(raw);
  const weight=Number($('#proWeight')?.value)||0,reps=Number($('#proReps')?.value)||0,rpe=Number($('#proRpe')?.value)||0;
  state.sets.push({exercise:ex,weight,reps,rpe,set:state.setIndex+1});const restSeconds=exerciseRest(raw);
  state.setIndex++;if(state.setIndex>=3){state.setIndex=0;state.exerciseIndex++}startRest(restSeconds);
}
function recoveryOnyx(){return `<span class="rest-onyx"><span class="onyx-art onyx-master-crop recovery recovery-crop" style="--ox:982;--oy:185;--ow:214;--oh:324;--sheet-w:1536;--sheet-h:1024"><img src="/ONYX-FIT-V0.1/assets/CE7966B7-F1FF-42CE-9156-F530A22AEC18.png" alt="Onyx en récupération" draggable="false"></span></span>`}
function startRest(sec=60){state.rest=Math.max(1,sec);state.restTotal=state.rest;state.restPaused=false;state.restMinimized=false;startRestTick();renderRestOverlay();updateFloatingBar()}
function startRestTick(){clearInterval(state.restTick);state.restTick=setInterval(()=>{if(!state.paused&&!state.restPaused){state.rest--;if(state.rest<=0){finishRest();return}if(!state.restMinimized)renderRestOverlay();updateFloatingBar()}},1000)}
function toggleRestPause(){state.restPaused=!state.restPaused;if(state.restPaused){clearInterval(state.restTick);state.restTick=null}else if(!state.paused)startRestTick();if(!state.restMinimized)renderRestOverlay();updateFloatingBar()}
function minimizeRest(){state.restMinimized=true;$('#restFullscreen')?.remove();updateFloatingBar()}
function finishRest(){clearInterval(state.restTick);state.restTick=null;state.rest=0;state.restPaused=false;state.restMinimized=false;$('#restFullscreen')?.remove();updateFloatingBar();renderCurrentSet()}
function renderRestOverlay(){
  if(state.rest<=0){$('#restFullscreen')?.remove();return}if(state.restMinimized)return;
  let o=$('#restFullscreen');if(!o){o=document.createElement('div');o.id='restFullscreen';o.className='rest-fullscreen';document.body.appendChild(o)}
  const pct=state.restTotal?Math.max(0,Math.min(100,state.rest/state.restTotal*100)):0;
  o.innerHTML=`<div class="rest-panel"><button class="rest-minimize" id="restMinimize" aria-label="Réduire le repos">⌄</button><div class="eyebrow">RÉCUPÉRATION</div>${recoveryOnyx()}<div class="rest-progress"><i style="width:${pct}%"></i></div><div class="rest-big">${fmt(state.rest)}</div><p class="muted">Respire. Tu peux naviguer dans l’app, le chrono continue.</p><div class="rest-controls"><button class="btn" id="restMinus">−15 s</button><button class="btn primary" id="restToggle">${state.paused||state.restPaused?'REPRENDRE':'PAUSE'}</button><button class="btn" id="restPlus">+15 s</button></div><button class="btn ghost full" id="skipRest">PASSER LE REPOS</button></div>`;
  $('#restMinus').onclick=()=>{state.rest=Math.max(1,state.rest-15);renderRestOverlay();updateFloatingBar()};
  $('#restPlus').onclick=()=>{state.rest+=15;state.restTotal=Math.max(state.restTotal,state.rest);renderRestOverlay();updateFloatingBar()};
  $('#restToggle').onclick=()=>state.paused?toggleSessionPause():toggleRestPause();$('#skipRest').onclick=finishRest;$('#restMinimize').onclick=minimizeRest;
}
function endWorkout(){
  clearInterval(state.tick);clearInterval(state.restTick);state.tick=state.restTick=null;$('#restFullscreen')?.remove();removeGlobalPause();
  const db=readDb(),w=currentWorkout();db.history=Array.isArray(db.history)?db.history:[];db.history.push({date:new Date().toISOString(),workout:String(w?.name||'Séance'),duration:state.elapsed,sets:[...state.sets]});writeDb(db);state.active=false;
  const root=$('#workoutBox');if(root)root.innerHTML=`<div class="card workout-finished"><div class="eyebrow">SÉANCE TERMINÉE</div><h1>Bien joué 🔥</h1><p>${esc(w?.name||'Séance')} · ${fmt(state.elapsed)} · ${state.sets.length} séries validées</p><button class="btn primary full" id="backToSessions">RETOUR AUX SÉANCES</button></div>`;$('#backToSessions')?.addEventListener('click',renderSessionPicker);
}
function safeHistory(){const h=readDb().history;return Array.isArray(h)?h.filter(x=>x&&typeof x==='object'&&typeof x.workout==='string'&&Array.isArray(x.sets)):[]}
function lastPerformance(workout,exercise){const hist=safeHistory().filter(h=>h.workout===workout).reverse();for(const h of hist){const s=[...h.sets].reverse().find(x=>x&&x.exercise===exercise);if(s)return{weight:Number(s.weight)||0,reps:Number(s.reps)||0,rpe:Number(s.rpe)||0}}return null}
function renderStats(){
  const root=$('#trainingStatsBox');if(!root)return;
  try{
    const hist=safeHistory();if(!hist.length){root.innerHTML='<div class="card"><h2>Statistiques</h2><p class="muted">Termine une séance pour débloquer tes courbes de progression.</p></div>';return}
    const workouts=[...new Set(hist.map(h=>h.workout).filter(Boolean))];if(!workouts.length){root.innerHTML='<div class="card"><h2>Statistiques</h2><p class="muted">Aucune donnée exploitable pour le moment.</p></div>';return}
    const selectedWorkout=workouts.includes(root.dataset.workout)?root.dataset.workout:workouts[0],wh=hist.filter(h=>h.workout===selectedWorkout);
    const exercises=[...new Set(wh.flatMap(h=>h.sets.map(s=>s&&s.exercise).filter(Boolean)))];if(!exercises.length){root.innerHTML=`<div class="card"><h2>${esc(selectedWorkout)}</h2><p class="muted">Aucune série enregistrée dans cette séance.</p></div>`;return}
    const selectedExercise=exercises.includes(root.dataset.exercise)?root.dataset.exercise:exercises[0];
    const sessions=wh.map(h=>{const sets=h.sets.filter(s=>s&&s.exercise===selectedExercise).map(s=>({weight:Number(s.weight)||0,reps:Number(s.reps)||0,rpe:Number(s.rpe)||0,set:Number(s.set)||0}));if(!sets.length)return null;const weights=sets.map(s=>s.weight),reps=sets.map(s=>s.reps),volumes=sets.map(s=>s.weight*s.reps);return{date:h.date||'',sets,weight:Math.max(...weights),weightMin:Math.min(...weights),reps:Math.max(...reps),repsMin:Math.min(...reps),avgWeight:weights.reduce((a,b)=>a+b,0)/weights.length,avgReps:reps.reduce((a,b)=>a+b,0)/reps.length,volume:volumes.reduce((a,b)=>a+b,0),rpeAvg:sets.reduce((a,b)=>a+b.rpe,0)/sets.length}}).filter(Boolean);
    const bestWeight=Math.max(...sessions.map(s=>s.weight),0),bestReps=Math.max(...sessions.map(s=>s.reps),0),totalVolume=sessions.reduce((a,s)=>a+s.volume,0),avgWeight=sessions.length?sessions.reduce((a,s)=>a+s.avgWeight,0)/sessions.length:0;
    root.innerHTML=`<div class="card stats-card detailed-stats"><div class="eyebrow">PROGRESSION DÉTAILLÉE</div><h2>${esc(selectedWorkout)} → ${esc(selectedExercise)}</h2><div class="grid2"><label>Séance<select id="statsWorkout">${workouts.map(x=>`<option value="${esc(x)}" ${x===selectedWorkout?'selected':''}>${esc(x)}</option>`).join('')}</select></label><label>Exercice<select id="statsExercise">${exercises.map(x=>`<option value="${esc(x)}" ${x===selectedExercise?'selected':''}>${esc(x)}</option>`).join('')}</select></label></div><div class="stat-kpis"><div><span>MEILLEURE CHARGE</span><strong>${bestWeight} kg</strong></div><div><span>MAX RÉPÉTITIONS</span><strong>${bestReps}</strong></div><div><span>VOLUME TOTAL</span><strong>${Math.round(totalVolume)} kg</strong></div><div><span>CHARGE MOYENNE</span><strong>${avgWeight.toFixed(1)} kg</strong></div></div>${chart(sessions,'weight','Charge max','kg')}${chart(sessions,'reps','Répétitions max','reps')}<div class="history-card"><h3>Historique jour par jour</h3>${sessions.slice().reverse().map(s=>`<details class="day-history"><summary><span>${formatDate(s.date)}</span><b>${s.weightMin}-${s.weight} kg · ${s.repsMin}-${s.reps} reps</b></summary><div class="day-meta">Moy. ${s.avgWeight.toFixed(1)} kg · ${s.avgReps.toFixed(1)} reps · Volume ${Math.round(s.volume)} kg · RPE ${s.rpeAvg.toFixed(1)}</div>${s.sets.map((set,i)=>`<div class="set-history"><span>Série ${set.set||i+1}</span><b>${set.weight} kg · ${set.reps} reps</b><em>RPE ${set.rpe||'—'} · ${Math.round(set.weight*set.reps)} kg</em></div>`).join('')}</details>`).join('')}</div></div>`;
    $('#statsWorkout').onchange=e=>{root.dataset.workout=e.target.value;root.dataset.exercise='';renderStats()};$('#statsExercise').onchange=e=>{root.dataset.exercise=e.target.value;renderStats()};
  }catch(err){console.error('ONYX stats error',err);root.innerHTML='<div class="card"><h2>Statistiques</h2><p class="muted">Impossible de lire une ancienne donnée. Les nouvelles séances continueront à être enregistrées normalement.</p></div>'}
}
function formatDate(v){const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('fr-FR')}
function chart(points,key,title,unit){if(!Array.isArray(points)||!points.length)return `<div class="stat-chart"><h3>${title}</h3><p class="muted">Pas encore de données.</p></div>`;const vals=points.map(p=>Number(p[key])||0),max=Math.max(...vals,1),min=Math.min(...vals,0),range=Math.max(1,max-min),w=320,h=120,pad=18;const xy=vals.map((v,i)=>{const x=pad+(w-pad*2)*(vals.length===1?.5:i/(vals.length-1));const y=h-pad-(h-pad*2)*(v-min)/range;return[x,y]});const line=xy.map(p=>p.join(',')).join(' '),first=vals[0],last=vals[vals.length-1],delta=last-first;return `<div class="stat-chart"><div class="stat-chart-head"><div><span>${title}</span><strong>${last} ${unit}</strong></div><b class="${delta>=0?'gain':'loss'}">${delta>=0?'+':''}${delta.toFixed(1)} ${unit}</b></div><svg viewBox="0 0 ${w} ${h}" aria-label="Évolution ${esc(title)}"><polyline points="${line}" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>${xy.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="4" fill="currentColor"/>`).join('')}</svg></div>`}

const observer=new MutationObserver(()=>{const screen=$('#workoutScreen');if(screen&&screen.dataset.onyxTrainingV3!=='1')initTraining();if(screen&&screen.dataset.onyxTrainingV3==='1'&&state.mode==='session'&&!state.active){const root=$('#workoutBox');if(root&&!root.querySelector('.onyx-session-picker')&&!root.querySelector('.workout-finished'))renderSessionPicker()}});
observer.observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('DOMContentLoaded',()=>setTimeout(initTraining,80));setTimeout(initTraining,180);
