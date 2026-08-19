// ONYX FIT v0.1 — training engine v2: prescriptions, progression, rest, history, stats
const STORAGE='onyx_v01';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const fmt=s=>{s=Math.max(0,Math.floor(Number(s)||0));return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`};
const readDb=()=>{try{return JSON.parse(localStorage.getItem(STORAGE)||'{}')||{}}catch{return{}}};
const writeDb=db=>{try{localStorage.setItem(STORAGE,JSON.stringify(db))}catch{}};
const state={mode:'session',active:false,paused:false,elapsed:0,startAt:0,tick:null,rest:0,restTotal:0,restPaused:false,restTick:null,restMinimized:false,workoutIndex:0,exerciseIndex:0,setIndex:0,sets:[],prs:[]};

function programData(){const db=readDb();return Array.isArray(db.program)?db.program.filter(Boolean):[]}
function safeHistory(){const h=readDb().history;return Array.isArray(h)?h.filter(x=>x&&typeof x==='object'&&typeof x.workout==='string'&&Array.isArray(x.sets)):[]}
function currentWorkout(){return programData()[state.workoutIndex]}
function currentExerciseRaw(){const w=currentWorkout();return Array.isArray(w?.exercises)?w.exercises[state.exerciseIndex]:null}
function exerciseName(ex){return typeof ex==='string'?ex:String(ex?.name||ex?.exercise||'Exercice')}
function prescription(ex){
  const name=exerciseName(ex);const fallback=window.OnyxProgram?.prescription?.(name)||{sets:3,repMin:8,repMax:12,targetRpe:8,restSeconds:60,unit:'reps'};
  if(!ex||typeof ex!=='object')return fallback;
  return {
    sets:Math.max(1,Number(ex.sets)||fallback.sets||3),
    repMin:Math.max(1,Number(ex.repMin)||fallback.repMin||8),
    repMax:Math.max(1,Number(ex.repMax)||fallback.repMax||12),
    targetRpe:Math.min(10,Math.max(1,Number(ex.targetRpe)||fallback.targetRpe||8)),
    restSeconds:Math.max(15,Number(ex.restSeconds??ex.rest)||fallback.restSeconds||60),
    unit:ex.unit||fallback.unit||'reps'
  };
}
function allHistoricSets(exercise){return safeHistory().flatMap(h=>h.sets.filter(s=>s&&s.exercise===exercise).map(s=>({...s,date:h.date,workout:h.workout})))}
function lastSessionExercise(workout,exercise){
  const hist=safeHistory().filter(h=>h.workout===workout).reverse();
  for(const h of hist){const sets=h.sets.filter(s=>s&&s.exercise===exercise);if(sets.length)return{date:h.date,sets:sets.map(s=>({weight:+s.weight||0,reps:+s.reps||0,rpe:+s.rpe||0,set:+s.set||0}))}}
  return null;
}
function suggestedTarget(raw,last){
  const p=prescription(raw),range=`${p.repMin}–${p.repMax}`;
  if(!last?.sets?.length)return{weight:'—',reps:range,rpe:p.targetRpe,text:`Première référence : vise ${range} reps autour de RPE ${p.targetRpe}.`};
  const valid=last.sets.filter(s=>s.reps>0);const best=[...(valid.length?valid:last.sets)].sort((a,b)=>(b.weight-a.weight)||(b.reps-a.reps))[0];
  let weight=best.weight||0;const hitTop=last.sets.length>=p.sets&&last.sets.slice(0,p.sets).every(s=>s.reps>=p.repMax&&(s.rpe===0||s.rpe<=p.targetRpe+.5));
  const tooHard=last.sets.some(s=>s.rpe>=9.5&&s.reps<p.repMin);
  if(hitTop&&weight>0)weight=Math.round((weight+2)*2)/2;else if(tooHard&&weight>0)weight=Math.max(0,Math.round((weight-1)*2)/2);
  return{weight:weight?`${weight} kg`:'—',reps:range,rpe:p.targetRpe,text:hitTop?'Objectif atteint la dernière fois : petite hausse de charge proposée.':tooHard?'Dernière séance trop proche de l’échec : baisse légère proposée.':`Garde la charge et essaie de progresser dans la plage ${range} reps.`};
}

function init(){
  const screen=$('#workoutScreen');if(!screen||screen.dataset.onyxTrainingV5==='1')return;
  screen.dataset.onyxTrainingV5='1';screen.dataset.onyxTrainingV4='1';
  const h=screen.querySelector('h1');if(!h)return;
  screen.querySelectorAll('.training-tabs,#trainingStatsBox').forEach(x=>x.remove());
  h.insertAdjacentHTML('afterend','<div class="training-tabs"><button class="chip on" id="trainingTabSession">Séance</button><button class="chip" id="trainingTabStats">Stats</button></div><div id="trainingStatsBox" hidden></div>');
  $('#trainingTabSession').onclick=()=>switchMode('session');$('#trainingTabStats').onclick=()=>switchMode('stats');switchMode('session');
}
function switchMode(mode){state.mode=mode;$('#trainingTabSession')?.classList.toggle('on',mode==='session');$('#trainingTabStats')?.classList.toggle('on',mode==='stats');const box=$('#workoutBox'),stats=$('#trainingStatsBox');if(box)box.hidden=mode==='stats';if(stats)stats.hidden=mode!=='stats';if(mode==='stats')renderStats();else if(!state.active)renderSessionPicker()}
function renderSessionPicker(){
  const root=$('#workoutBox'),program=programData();if(!root)return;
  if(!program.length){root.innerHTML='<div class="card"><h2>Aucune séance disponible</h2><p class="muted">Crée ton programme dans Profil → Nouveau programme.</p></div>';return}
  if(state.workoutIndex>=program.length)state.workoutIndex=0;
  root.innerHTML=`<div class="card onyx-session-picker"><div class="eyebrow">CHOISIS TA SÉANCE</div><h2>Quelle séance aujourd’hui ?</h2><div class="session-choice-list">${program.map((w,i)=>`<button class="session-choice ${i===state.workoutIndex?'on':''}" data-workout-index="${i}"><b>${esc(w.name||`Séance ${i+1}`)}</b><span>${w.exercises?.length||0} exercices</span></button>`).join('')}</div><button class="btn primary big full" id="startWorkoutBtn">DÉMARRER LA SÉANCE</button></div>`;
  $$('[data-workout-index]').forEach(b=>b.onclick=()=>{state.workoutIndex=+b.dataset.workoutIndex||0;renderSessionPicker()});$('#startWorkoutBtn').onclick=startWorkout;
}
function startWorkout(){const w=currentWorkout();if(!w?.exercises?.length)return;state.active=true;state.paused=false;state.elapsed=0;state.startAt=Date.now();state.exerciseIndex=0;state.setIndex=0;state.sets=[];state.prs=[];clearInterval(state.tick);state.tick=setInterval(updateClock,500);ensureFloating();renderCurrentSet();updateClock()}
function updateClock(){if(state.active&&!state.paused)state.elapsed=Math.floor((Date.now()-state.startAt)/1000);$$('.js-session-clock').forEach(x=>x.textContent=fmt(state.elapsed));updateFloating()}
function toggleSessionPause(){if(!state.active)return;if(state.paused){state.paused=false;state.startAt=Date.now()-state.elapsed*1000;if(state.rest>0&&state.restPaused){state.restPaused=false;startRestTick()}}else{state.elapsed=Math.floor((Date.now()-state.startAt)/1000);state.paused=true;if(state.restTick){clearInterval(state.restTick);state.restTick=null;state.restPaused=true}}updateClock();if(!state.restMinimized)renderRest()}
function ensureFloating(){let b=$('#globalPause');if(!b){b=document.createElement('div');b.id='globalPause';b.className='global-pause-bar';document.body.appendChild(b)}updateFloating()}
function updateFloating(){const b=$('#globalPause');if(!b)return;b.innerHTML=`${state.rest>0?`<button class="floating-rest" id="floatingRestBtn">⏱ ${fmt(state.rest)}</button>`:''}<button class="floating-pause" id="floatingPauseBtn">${state.paused?'▶ Reprendre':'Ⅱ Pause'}</button>`;$('#floatingPauseBtn')?.addEventListener('click',toggleSessionPause);$('#floatingRestBtn')?.addEventListener('click',()=>{state.restMinimized=false;renderRest()})}
function removeFloating(){$('#globalPause')?.remove()}

function renderCurrentSet(){
  const root=$('#workoutBox'),w=currentWorkout(),raw=currentExerciseRaw();if(!root)return;if(!w||raw==null){endWorkout();return}
  const ex=exerciseName(raw),p=prescription(raw),last=lastSessionExercise(String(w.name||''),ex),target=suggestedTarget(raw,last);const lastText=last?.sets?.length?last.sets.map((s,i)=>`S${i+1} ${s.weight}kg×${s.reps} @${s.rpe||'—'}`).join(' · '):'Aucune donnée';
  const unitLabel=p.unit==='sec'?'secondes':'répétitions';
  root.innerHTML=`<div class="card exercise pro-exercise"><div class="session-mini"><div><span>CHRONO SÉANCE</span><strong class="js-session-clock">${fmt(state.elapsed)}</strong></div><span class="pill">Exercice ${state.exerciseIndex+1}/${w.exercises.length}</span></div><div class="eyebrow">${esc(w.name||'Séance')}</div><h1>${esc(ex)}</h1><p class="muted">Série ${state.setIndex+1}/${p.sets} · Objectif ${p.repMin}–${p.repMax} ${unitLabel} · RPE ${p.targetRpe} · Repos ${fmt(p.restSeconds)}</p><div class="exercise-tools"><button class="btn" id="techniqueBtn">◎ TECHNIQUE</button><button class="btn" id="exerciseHistoryBtn">↗ HISTORIQUE</button></div><div class="last-performance stacked"><span>DERNIÈRE SÉANCE</span><b>${esc(lastText)}</b></div><div class="target-card"><span>OBJECTIF CONSEILLÉ</span><strong>${target.weight} · ${target.reps} ${unitLabel} · RPE ${target.rpe}</strong><p>${esc(target.text)}</p></div><div class="setGrid"><label>Poids (kg)<input id="proWeight" type="number" step="0.5" inputmode="decimal" placeholder="${last?.sets?.[state.setIndex]?.weight??last?.sets?.[0]?.weight??0}"></label><label>${p.unit==='sec'?'Secondes':'Répétitions'}<input id="proReps" type="number" inputmode="numeric" placeholder="${last?.sets?.[state.setIndex]?.reps??p.repMin}"></label><label>RPE<input id="proRpe" type="number" min="1" max="10" step="0.5" inputmode="decimal" placeholder="${last?.sets?.[state.setIndex]?.rpe||p.targetRpe}"></label></div><button class="btn primary big full" id="proValidateSet">VALIDER LA SÉRIE</button></div>`;
  $('#proValidateSet').onclick=validateSet;$('#techniqueBtn').onclick=()=>showTechnique(ex);$('#exerciseHistoryBtn').onclick=()=>openExerciseStats(String(w.name||''),ex);updateClock();
}
function validateSet(){
  const raw=currentExerciseRaw();if(raw==null)return;const ex=exerciseName(raw),p=prescription(raw),weight=+($('#proWeight')?.value)||0,reps=+($('#proReps')?.value)||0,rpe=+($('#proRpe')?.value)||p.targetRpe;
  const old=allHistoricSets(ex),oldMaxW=Math.max(0,...old.map(s=>+s.weight||0)),oldMaxR=Math.max(0,...old.map(s=>+s.reps||0));const prWeight=weight>oldMaxW&&weight>0,prReps=reps>oldMaxR&&reps>0;
  if(prWeight||prReps){state.prs.push({exercise:ex,weight,reps,type:prWeight&&prReps?'Charge + reps':prWeight?'Charge':'Répétitions'});showPR(ex,weight,reps)}
  state.sets.push({exercise:ex,weight,reps,rpe,set:state.setIndex+1,prescription:{sets:p.sets,repMin:p.repMin,repMax:p.repMax,targetRpe:p.targetRpe,restSeconds:p.restSeconds,unit:p.unit}});
  state.setIndex++;if(state.setIndex>=p.sets){state.setIndex=0;state.exerciseIndex++}startRest(p.restSeconds);
}
function showPR(ex,w,r){let t=$('#prToast');if(!t){t=document.createElement('div');t.id='prToast';t.className='pr-toast';document.body.appendChild(t)}t.innerHTML=`<b>⚡ NOUVEAU PR</b><span>${esc(ex)} · ${w} kg × ${r}</span>`;setTimeout(()=>t?.remove(),3000)}
function showTechnique(ex){let m=$('#techniqueModal');if(!m){m=document.createElement('div');m.id='techniqueModal';m.className='technique-modal';document.body.appendChild(m)}m.innerHTML=`<div class="technique-sheet"><button class="technique-close" id="techClose">×</button><div class="eyebrow">TECHNIQUE</div><h2>${esc(ex)}</h2><div class="tech-block"><h3>Repères</h3><p>Position stable, amplitude contrôlée et mouvement sans douleur inhabituelle.</p><p>Garde la charge maîtrisée et arrête la série si la technique se dégrade.</p></div></div>`;$('#techClose').onclick=()=>m.remove();m.onclick=e=>{if(e.target===m)m.remove()}}
function openExerciseStats(workout,exercise){const root=$('#trainingStatsBox');if(root){root.dataset.workout=workout;root.dataset.exercise=exercise}switchMode('stats');renderStats()}

function startRest(sec){state.rest=Math.max(1,sec);state.restTotal=state.rest;state.restPaused=false;state.restMinimized=false;startRestTick();renderRest();updateFloating()}
function startRestTick(){clearInterval(state.restTick);state.restTick=setInterval(()=>{if(!state.paused&&!state.restPaused){state.rest--;if(state.rest<=0){finishRest();return}if(!state.restMinimized)renderRest();updateFloating()}},1000)}
function toggleRestPause(){state.restPaused=!state.restPaused;if(state.restPaused){clearInterval(state.restTick);state.restTick=null}else if(!state.paused)startRestTick();if(!state.restMinimized)renderRest();updateFloating()}
function finishRest(){clearInterval(state.restTick);state.restTick=null;state.rest=0;state.restPaused=false;state.restMinimized=false;$('#restFullscreen')?.remove();updateFloating();try{navigator.vibrate?.([120,60,120])}catch{}renderCurrentSet()}
function minimizeRest(){state.restMinimized=true;$('#restFullscreen')?.remove();updateFloating()}
function renderRest(){if(state.rest<=0||state.restMinimized)return;let o=$('#restFullscreen');if(!o){o=document.createElement('div');o.id='restFullscreen';o.className='rest-fullscreen';document.body.appendChild(o)}const pct=state.restTotal?Math.max(0,Math.min(100,state.rest/state.restTotal*100)):0;o.innerHTML=`<div class="rest-panel"><button class="rest-minimize" id="restMinimize">⌄</button><div class="eyebrow">RÉCUPÉRATION</div><span class="rest-onyx"></span><div class="rest-progress"><i style="width:${pct}%"></i></div><div class="rest-big">${fmt(state.rest)}</div><p class="muted">Respire. Tu peux naviguer dans l’app, le chrono continue.</p><div class="rest-controls"><button class="btn" id="restMinus">−15 s</button><button class="btn primary" id="restToggle">${state.paused||state.restPaused?'REPRENDRE':'PAUSE'}</button><button class="btn" id="restPlus">+15 s</button></div><button class="btn ghost full" id="skipRest">PASSER LE REPOS</button></div>`;$('#restMinus').onclick=()=>{state.rest=Math.max(1,state.rest-15);renderRest();updateFloating()};$('#restPlus').onclick=()=>{state.rest+=15;state.restTotal=Math.max(state.restTotal,state.rest);renderRest();updateFloating()};$('#restToggle').onclick=()=>state.paused?toggleSessionPause():toggleRestPause();$('#skipRest').onclick=finishRest;$('#restMinimize').onclick=minimizeRest}

function endWorkout(){
  clearInterval(state.tick);clearInterval(state.restTick);state.tick=state.restTick=null;$('#restFullscreen')?.remove();removeFloating();const db=readDb(),w=currentWorkout();db.history=Array.isArray(db.history)?db.history:[];const id=`train_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;db.history.push({id,date:new Date().toISOString(),workout:String(w?.name||'Séance'),duration:state.elapsed,sets:[...state.sets],completed:true,interrupted:false});writeDb(db);state.active=false;
  const volume=state.sets.reduce((a,s)=>a+(+s.weight||0)*(+s.reps||0),0),bestW=Math.max(0,...state.sets.map(s=>+s.weight||0)),bestR=Math.max(0,...state.sets.map(s=>+s.reps||0));const root=$('#workoutBox');if(root)root.innerHTML=`<div class="card workout-finished"><div class="eyebrow">SÉANCE TERMINÉE</div><h1>Bien joué 🔥</h1><div class="finish-kpis"><div><span>Durée</span><b>${fmt(state.elapsed)}</b></div><div><span>Volume</span><b>${Math.round(volume)} kg</b></div><div><span>Charge max</span><b>${bestW} kg</b></div><div><span>Reps max</span><b>${bestR}</b></div></div>${state.prs.length?`<div class="finish-prs"><div class="eyebrow">RECORDS</div>${state.prs.map(p=>`<div>⚡ ${esc(p.exercise)} — ${p.weight} kg × ${p.reps}</div>`).join('')}</div>`:''}<button class="btn primary full" id="backToSessions">RETOUR AUX SÉANCES</button></div>`;$('#backToSessions')?.addEventListener('click',renderSessionPicker)
}
function formatDate(v){const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('fr-FR')}
function renderStats(){
  const root=$('#trainingStatsBox');if(!root)return;const hist=safeHistory();if(!hist.length){root.innerHTML='<div class="card"><h2>Statistiques</h2><p class="muted">Valide quelques séries pour débloquer tes statistiques.</p></div>';return}
  const workouts=[...new Set(hist.map(h=>h.workout).filter(Boolean))],selectedWorkout=workouts.includes(root.dataset.workout)?root.dataset.workout:workouts[0],wh=hist.filter(h=>h.workout===selectedWorkout),exercises=[...new Set(wh.flatMap(h=>h.sets.map(s=>s?.exercise).filter(Boolean)))];if(!exercises.length){root.innerHTML='<div class="card"><h2>Aucune série enregistrée</h2></div>';return}
  const selectedExercise=exercises.includes(root.dataset.exercise)?root.dataset.exercise:exercises[0];const sessions=wh.map(h=>{const sets=h.sets.filter(s=>s?.exercise===selectedExercise).map(s=>({weight:+s.weight||0,reps:+s.reps||0,rpe:+s.rpe||0,set:+s.set||0}));if(!sets.length)return null;const weights=sets.map(s=>s.weight),reps=sets.map(s=>s.reps);return{date:h.date,completed:h.completed!==false,sets,weight:Math.max(...weights),weightMin:Math.min(...weights),reps:Math.max(...reps),repsMin:Math.min(...reps),volume:sets.reduce((a,s)=>a+s.weight*s.reps,0)}}).filter(Boolean);const bestWeight=Math.max(0,...sessions.map(s=>s.weight)),bestReps=Math.max(0,...sessions.map(s=>s.reps)),totalVolume=sessions.reduce((a,s)=>a+s.volume,0);
  root.innerHTML=`<div class="card stats-card detailed-stats"><div class="eyebrow">PROGRESSION DÉTAILLÉE</div><h2>${esc(selectedWorkout)} → ${esc(selectedExercise)}</h2><div class="grid2"><label>Séance<select id="statsWorkout">${workouts.map(x=>`<option ${x===selectedWorkout?'selected':''}>${esc(x)}</option>`).join('')}</select></label><label>Exercice<select id="statsExercise">${exercises.map(x=>`<option ${x===selectedExercise?'selected':''}>${esc(x)}</option>`).join('')}</select></label></div><div class="stat-kpis"><div><span>MEILLEURE CHARGE</span><strong>${bestWeight} kg</strong></div><div><span>MAX RÉPÉTITIONS</span><strong>${bestReps}</strong></div><div><span>VOLUME TOTAL</span><strong>${Math.round(totalVolume)} kg</strong></div><div><span>SÉANCES</span><strong>${sessions.length}</strong></div></div><div class="history-card"><h3>Historique</h3>${sessions.slice().reverse().map((s,i)=>`<details class="day-history" ${i===0?'open':''}><summary><span>${formatDate(s.date)} ${s.completed?'':'· interrompue'}</span><b>${s.weightMin}–${s.weight} kg · ${s.repsMin}–${s.reps} reps</b></summary>${s.sets.map((x,j)=>`<div class="set-history"><span>Série ${x.set||j+1}</span><b>${x.weight} kg × ${x.reps}</b><em>RPE ${x.rpe||'—'}</em></div>`).join('')}</details>`).join('')}</div></div>`;$('#statsWorkout').onchange=e=>{root.dataset.workout=e.target.value;root.dataset.exercise='';renderStats()};$('#statsExercise').onchange=e=>{root.dataset.exercise=e.target.value;renderStats()}
}

window.OnyxTrainingV2={state,saveSnapshot(){return{active:state.active,elapsed:state.elapsed,workout:currentWorkout()?.name||'',sets:[...state.sets]}}};
const obs=new MutationObserver(()=>{const screen=$('#workoutScreen');if(screen&&screen.dataset.onyxTrainingV5!=='1')init();if(screen&&screen.dataset.onyxTrainingV5==='1'&&state.mode==='session'&&!state.active){const root=$('#workoutBox');if(root&&!root.querySelector('.onyx-session-picker')&&!root.querySelector('.workout-finished'))renderSessionPicker()}});obs.observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('DOMContentLoaded',()=>setTimeout(init,80));setTimeout(init,180);
