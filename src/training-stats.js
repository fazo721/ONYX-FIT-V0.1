// ONYX FIT v0.1 — guided training, recovery, technique, PRs and detailed stats
const STORAGE='onyx_v01';
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const fmt=s=>{s=Math.max(0,Math.floor(Number(s)||0));return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`};
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const readDb=()=>{try{const x=JSON.parse(localStorage.getItem(STORAGE)||'{}');return x&&typeof x==='object'?x:{}}catch{return {}}};
const writeDb=db=>{try{localStorage.setItem(STORAGE,JSON.stringify(db))}catch{}};

const state={mode:'session',active:false,paused:false,elapsed:0,startAt:0,tick:null,rest:0,restTotal:0,restPaused:false,restTick:null,restMinimized:false,workoutIndex:0,exerciseIndex:0,setIndex:0,sets:[],prs:[]};
const TECH={
  'pompes':{muscles:'Pectoraux · Triceps · Deltoïdes antérieurs',setup:'Mains légèrement plus larges que les épaules, corps gainé de la tête aux talons.',cues:['Descends la poitrine entre les mains','Garde les coudes à environ 30–45° du buste','Pousse le sol sans creuser le bas du dos'],errors:['Coudes complètement écartés','Bassin qui tombe','Amplitude raccourcie']},
  'développé couché':{muscles:'Pectoraux · Triceps · Deltoïdes antérieurs',setup:'Omoplates serrées et abaissées, pieds ancrés, poitrine haute.',cues:['Descends sous contrôle vers le bas des pectoraux','Avant-bras presque verticaux en bas','Pousse en gardant les épaules stables'],errors:['Épaules qui roulent vers l’avant','Barre/haltères trop haut vers le cou','Rebond sur la poitrine']},
  'développé incliné':{muscles:'Haut des pectoraux · Triceps · Épaules',setup:'Banc légèrement incliné, omoplates serrées, pieds stables.',cues:['Descends les haltères de chaque côté du haut des pectoraux','Garde les poignets au-dessus des coudes','Pousse sans décoller les épaules'],errors:['Inclinaison trop forte','Coudes trop ouverts','Dos qui se décolle excessivement']},
  'rowing':{muscles:'Grand dorsal · Rhomboïdes · Biceps',setup:'Dos neutre, abdos serrés, épaules loin des oreilles.',cues:['Tire le coude vers la hanche','Commence le mouvement par l’omoplate','Contrôle le retour complet'],errors:['Tourner tout le buste','Hausser l’épaule','Donner un élan avec le bas du dos']},
  'tirage':{muscles:'Grand dorsal · Biceps · Grand rond',setup:'Poitrine haute, bassin stable, épaules basses.',cues:['Tire avec les coudes','Amène la barre/poignée vers le haut du torse','Remonte en gardant le contrôle'],errors:['Tirer derrière la nuque','Se balancer fortement','Fermer les épaules vers l’avant']},
  'squat':{muscles:'Quadriceps · Fessiers · Adducteurs',setup:'Pieds stables, gainage fort, genoux dans l’axe des orteils.',cues:['Assieds-toi entre les hanches','Garde tout le pied en contact avec le sol','Remonte en poussant le sol'],errors:['Genoux qui rentrent','Talons qui décollent','Dos qui s’arrondit en bas']},
  'fente':{muscles:'Quadriceps · Fessiers · Ischios',setup:'Grand pas stable, buste haut, bassin face devant.',cues:['Descends verticalement','Genou avant dans l’axe du pied','Pousse dans le milieu du pied avant'],errors:['Pas trop court','Genou qui s’effondre vers l’intérieur','Buste qui tombe en avant']},
  'soulevé de terre':{muscles:'Ischios · Fessiers · Érecteurs du rachis',setup:'Dos neutre, charge près des jambes, lats engagés.',cues:['Recule les hanches','Garde la charge proche du corps','Serre les fessiers pour finir debout'],errors:['Arrondir le dos','Transformer le mouvement en squat','Hyperextension en haut']},
  'hip thrust':{muscles:'Fessiers · Ischios',setup:'Haut du dos sur le banc, menton légèrement rentré, pieds stables.',cues:['Monte le bassin jusqu’à aligner épaules-hanches-genoux','Rétroverse légèrement le bassin en haut','Contrôle la descente'],errors:['Hyperextension lombaire','Pieds trop loin ou trop près','Rebond en bas']},
  'curl':{muscles:'Biceps · Brachial',setup:'Coudes près du corps, épaules basses, buste fixe.',cues:['Plie le coude sans l’avancer','Contracte fort en haut','Redescends lentement'],errors:['Balancer le buste','Avancer les coudes','Lâcher la descente']},
  'triceps':{muscles:'Triceps',setup:'Épaules basses, coudes fixes près du buste.',cues:['Étends complètement le coude','Garde le haut du bras immobile','Contrôle le retour'],errors:['Coudes qui s’écartent','Buste qui donne de l’élan','Amplitude incomplète']},
  'élévation':{muscles:'Deltoïde moyen',setup:'Épaules basses, légère flexion des coudes, buste fixe.',cues:['Monte les bras jusqu’à environ l’horizontale','Conduis avec les coudes','Redescends lentement'],errors:['Hausser les épaules','Balancer le corps','Monter beaucoup trop haut']},
  'face pull':{muscles:'Deltoïdes postérieurs · Trapèzes moyens · Rotateurs externes',setup:'Poulie à hauteur du visage, buste stable.',cues:['Tire vers les yeux/les tempes','Écarte les mains en fin de mouvement','Serre les omoplates'],errors:['Coudes trop bas','Tirer vers la poitrine','Cambrer pour finir']},
  'planche':{muscles:'Abdominaux · Obliques · Gainage profond',setup:'Coudes sous les épaules, corps parfaitement aligné.',cues:['Serre fessiers et abdos','Pousse les avant-bras dans le sol','Respire sans perdre la position'],errors:['Bassin trop haut','Bas du dos qui s’effondre','Tête relevée']}
};

function programData(){const db=readDb();return Array.isArray(db.program)?db.program.filter(Boolean):[]}
function safeHistory(){const h=readDb().history;return Array.isArray(h)?h.filter(x=>x&&typeof x==='object'&&typeof x.workout==='string'&&Array.isArray(x.sets)):[]}
function currentWorkout(){return programData()[state.workoutIndex]}
function currentExerciseRaw(){const w=currentWorkout();return Array.isArray(w?.exercises)?w.exercises[state.exerciseIndex]:null}
function exerciseName(ex){return typeof ex==='string'?ex:String(ex?.name||ex?.exercise||'Exercice')}
function exerciseKey(name){const n=String(name||'').toLowerCase();return Object.keys(TECH).find(k=>n.includes(k))||''}
function techniqueFor(name){return TECH[exerciseKey(name)]||{muscles:'Muscles principaux selon l’exercice',setup:'Position stable, gainage actif et amplitude contrôlée.',cues:['Contrôle la phase descendante','Garde les articulations dans un axe naturel','Arrête la série si la technique se dégrade'],errors:['Utiliser trop d’élan','Sacrifier l’amplitude','Continuer malgré une douleur inhabituelle']}}
function exerciseRest(ex){
  if(ex&&typeof ex==='object'){const custom=Number(ex.rest??ex.restSeconds??ex.recovery);if(custom>0)return Math.round(custom)}
  const n=exerciseName(ex).toLowerCase();
  if(/curl|extension triceps|triceps|élévation|elevation|oiseau|face pull|mollet|abdo|planche|gainage/.test(n))return 45;
  if(/fente|bulgare|hip thrust|rowing|tirage|développé incliné|developpe incline|développé épaules|developpe epaules/.test(n))return 75;
  if(/squat|soulevé de terre|souleve de terre|développé couché|developpe couche|leg press/.test(n))return 90;
  return 60;
}

function initTraining(){
  const screen=$('#workoutScreen');if(!screen||screen.dataset.onyxTrainingV4==='1')return;
  screen.dataset.onyxTrainingV4='1';const h=screen.querySelector('h1');if(!h)return;
  screen.querySelectorAll('.training-tabs,#trainingStatsBox').forEach(x=>x.remove());
  h.insertAdjacentHTML('afterend',`<div class="training-tabs"><button class="chip on" id="trainingTabSession">Séance</button><button class="chip" id="trainingTabStats">Stats</button></div><div id="trainingStatsBox" hidden></div>`);
  $('#trainingTabSession').onclick=()=>switchMode('session');$('#trainingTabStats').onclick=()=>switchMode('stats');switchMode('session');
}
function switchMode(mode){
  state.mode=mode;$('#trainingTabSession')?.classList.toggle('on',mode==='session');$('#trainingTabStats')?.classList.toggle('on',mode==='stats');
  const box=$('#workoutBox'),stats=$('#trainingStatsBox');if(box)box.hidden=mode==='stats';if(stats)stats.hidden=mode!=='stats';
  if(mode==='stats')renderStats();else if(!state.active)renderSessionPicker();
}
function renderSessionPicker(){
  const root=$('#workoutBox');if(!root)return;const program=programData();
  if(!program.length){root.innerHTML='<div class="card onyx-session-picker"><h2>Aucune séance disponible</h2><p class="muted">Crée ton programme dans Profil → Nouveau programme.</p></div>';return}
  if(state.workoutIndex>=program.length)state.workoutIndex=0;
  root.innerHTML=`<div class="card onyx-session-picker"><div class="eyebrow">CHOISIS TA SÉANCE</div><h2>Quelle séance aujourd’hui ?</h2><div class="session-choice-list">${program.map((w,i)=>`<button class="session-choice ${i===state.workoutIndex?'on':''}" data-workout-index="${i}"><b>${esc(w.name||`Séance ${i+1}`)}</b><span>${Array.isArray(w.exercises)?w.exercises.length:0} exercices</span></button>`).join('')}</div><button class="btn primary big full" id="startWorkoutBtn">DÉMARRER LA SÉANCE</button></div>`;
  $$('[data-workout-index]').forEach(b=>b.onclick=()=>{state.workoutIndex=Number(b.dataset.workoutIndex)||0;renderSessionPicker()});$('#startWorkoutBtn').onclick=startWorkout;
}
function startWorkout(){
  const w=programData()[state.workoutIndex];if(!w||!Array.isArray(w.exercises)||!w.exercises.length)return;
  state.active=true;state.paused=false;state.elapsed=0;state.startAt=Date.now();state.exerciseIndex=0;state.setIndex=0;state.sets=[];state.prs=[];
  clearInterval(state.tick);state.tick=setInterval(updateSessionClock,500);ensureGlobalPause();renderCurrentSet();updateSessionClock();
}
function updateSessionClock(){if(state.active&&!state.paused)state.elapsed=Math.floor((Date.now()-state.startAt)/1000);$$('.js-session-clock').forEach(x=>x.textContent=fmt(state.elapsed));updateFloatingBar()}
function toggleSessionPause(){
  if(!state.active)return;
  if(state.paused){state.paused=false;state.startAt=Date.now()-state.elapsed*1000;if(state.rest>0&&state.restPaused){state.restPaused=false;startRestTick()}}
  else{state.elapsed=Math.floor((Date.now()-state.startAt)/1000);state.paused=true;if(state.restTick){clearInterval(state.restTick);state.restTick=null;state.restPaused=true}}
  updateSessionClock();if(!state.restMinimized)renderRestOverlay();
}
function ensureGlobalPause(){let b=$('#globalPause');if(!b){b=document.createElement('div');b.id='globalPause';b.className='global-pause-bar';document.body.appendChild(b)}updateFloatingBar()}
function updateFloatingBar(){
  const b=$('#globalPause');if(!b)return;const restPart=state.rest>0?`<button class="floating-rest" id="floatingRestBtn">⏱ ${fmt(state.rest)}</button>`:'';
  b.innerHTML=`${restPart}<button class="floating-pause" id="floatingPauseBtn">${state.paused?'▶ Reprendre':'Ⅱ Pause'}</button>`;
  $('#floatingPauseBtn')?.addEventListener('click',toggleSessionPause);$('#floatingRestBtn')?.addEventListener('click',()=>{state.restMinimized=false;renderRestOverlay()});
}
function removeGlobalPause(){$('#globalPause')?.remove()}

function lastSessionExercise(workout,exercise){
  const hist=safeHistory().filter(h=>h.workout===workout).reverse();for(const h of hist){const sets=h.sets.filter(x=>x&&x.exercise===exercise);if(sets.length)return{date:h.date,sets:sets.map(s=>({weight:Number(s.weight)||0,reps:Number(s.reps)||0,rpe:Number(s.rpe)||0,set:Number(s.set)||0}))}}return null;
}
function allHistoricSets(exercise){return safeHistory().flatMap(h=>h.sets.filter(s=>s&&s.exercise===exercise).map(s=>({...s,date:h.date,workout:h.workout}))) }
function targetFor(exercise,last){
  if(!last?.sets?.length)return{weight:'—',reps:'8–12',text:'Première référence : garde 2–3 répétitions en réserve.'};
  const best=[...last.sets].sort((a,b)=>(b.weight-a.weight)||(b.reps-a.reps))[0];let weight=best.weight,reps=best.reps;
  if(best.rpe>0&&best.rpe<=8&&best.reps>=10)weight=Math.round((weight+2)*2)/2;
  else if(best.rpe>=9.5)weight=Math.max(0,Math.round((weight-1)*2)/2);
  return{weight:`${weight} kg`,reps:`${Math.max(6,Math.min(15,reps||10))}`,text:weight>best.weight?'Tu avais de la marge : petite progression de charge proposée.':best.rpe>=9.5?'RPE très haut : priorité à une série plus propre.':'Essaie d’égaler puis dépasser légèrement la dernière séance.'};
}
function renderCurrentSet(){
  const root=$('#workoutBox'),w=currentWorkout(),raw=currentExerciseRaw();if(!root)return;if(!w||raw==null){endWorkout();return}
  const ex=exerciseName(raw),exercises=Array.isArray(w.exercises)?w.exercises:[],last=lastSessionExercise(String(w.name||''),ex),target=targetFor(ex,last);
  const lastText=last?.sets?.length?last.sets.map((s,i)=>`S${i+1} ${s.weight}kg×${s.reps}`).join(' · '):'Aucune donnée';
  root.innerHTML=`<div class="card exercise pro-exercise"><div class="session-mini"><div><span>CHRONO SÉANCE</span><strong class="js-session-clock">${fmt(state.elapsed)}</strong></div><span class="pill">Exercice ${state.exerciseIndex+1}/${exercises.length}</span></div><div class="eyebrow">${esc(w.name||'Séance')}</div><h1>${esc(ex)}</h1><p class="muted">Série ${state.setIndex+1}/3 · Repos prévu ${fmt(exerciseRest(raw))}</p><div class="exercise-tools"><button class="btn" id="techniqueBtn">◎ TECHNIQUE</button><button class="btn" id="exerciseHistoryBtn">↗ HISTORIQUE</button></div><div class="last-performance stacked"><span>DERNIÈRE SÉANCE</span><b>${esc(lastText)}</b></div><div class="target-card"><span>OBJECTIF CONSEILLÉ</span><strong>${target.weight} · ${target.reps} reps</strong><p>${esc(target.text)}</p></div><div class="setGrid"><label>Poids (kg)<input id="proWeight" type="number" step="0.5" inputmode="decimal" placeholder="${last?.sets?.[state.setIndex]?.weight??last?.sets?.[0]?.weight??0}"></label><label>Répétitions<input id="proReps" type="number" inputmode="numeric" placeholder="${last?.sets?.[state.setIndex]?.reps??last?.sets?.[0]?.reps??0}"></label><label>RPE<input id="proRpe" type="number" min="1" max="10" step="0.5" inputmode="decimal" placeholder="${last?.sets?.[state.setIndex]?.rpe||8}"></label></div><button class="btn primary big full" id="proValidateSet">VALIDER LA SÉRIE</button></div>`;
  $('#proValidateSet').onclick=validateSet;$('#techniqueBtn').onclick=()=>showTechnique(ex);$('#exerciseHistoryBtn').onclick=()=>openExerciseStats(String(w.name||''),ex);updateSessionClock();
}
function validateSet(){
  const raw=currentExerciseRaw();if(raw==null)return;const ex=exerciseName(raw),weight=Number($('#proWeight')?.value)||0,reps=Number($('#proReps')?.value)||0,rpe=Number($('#proRpe')?.value)||0;
  const old=allHistoricSets(ex),oldMaxW=Math.max(0,...old.map(s=>Number(s.weight)||0)),oldMaxR=Math.max(0,...old.map(s=>Number(s.reps)||0));
  const prWeight=weight>oldMaxW&&weight>0,prReps=reps>oldMaxR&&reps>0;if(prWeight||prReps){state.prs.push({exercise:ex,weight,reps,type:prWeight&&prReps?'Charge + reps':prWeight?'Charge':'Répétitions'});showPRToast(ex,weight,reps)}
  state.sets.push({exercise:ex,weight,reps,rpe,set:state.setIndex+1});const restSeconds=exerciseRest(raw);state.setIndex++;if(state.setIndex>=3){state.setIndex=0;state.exerciseIndex++}startRest(restSeconds);
}
function showPRToast(ex,weight,reps){let t=$('#prToast');if(!t){t=document.createElement('div');t.id='prToast';t.className='pr-toast';document.body.appendChild(t)}t.innerHTML=`<b>⚡ NOUVEAU PR</b><span>${esc(ex)} · ${weight} kg × ${reps}</span>`;setTimeout(()=>t?.remove(),3200)}

function anatomySvg(name){
  const k=exerciseKey(name),front=!/rowing|tirage|soulevé|face pull/.test(k);const hot=/squat|fente|hip thrust|soulevé/.test(k)?'legs':/curl|triceps/.test(k)?'arms':/planche/.test(k)?'core':/rowing|tirage|face pull/.test(k)?'back':'chest';
  return `<svg class="anatomy-svg" viewBox="0 0 220 300" aria-label="Schéma anatomique"><g fill="#303030" stroke="#666" stroke-width="2"><circle cx="110" cy="34" r="24"/><path d="M82 62Q110 48 138 62L150 145Q110 164 70 145Z"/><path d="M75 70L38 135L52 145L89 96Z"/><path d="M145 70L182 135L168 145L131 96Z"/><path d="M84 145L69 244L91 248L110 160Z"/><path d="M136 145L151 244L129 248L110 160Z"/></g>${hot==='chest'?'<path d="M82 78Q110 63 138 78L132 110Q110 120 88 110Z" class="anatomy-hot"/>':''}${hot==='arms'?'<path d="M72 78L40 134L54 141L88 94Z" class="anatomy-hot"/><path d="M148 78L180 134L166 141L132 94Z" class="anatomy-hot"/>':''}${hot==='core'?'<path d="M91 106L129 106L132 146Q110 154 88 146Z" class="anatomy-hot"/>':''}${hot==='back'?'<path d="M84 73Q110 61 136 73L140 132Q110 146 80 132Z" class="anatomy-hot"/>':''}${hot==='legs'?'<path d="M84 146L70 238L91 242L110 161L129 242L150 238L136 146Z" class="anatomy-hot"/>':''}<text x="110" y="280" text-anchor="middle" fill="#888" font-size="11">${front?'VUE AVANT':'VUE POSTÉRIEURE'}</text></svg>`;
}
function showTechnique(ex){
  const t=techniqueFor(ex);let m=$('#techniqueModal');if(!m){m=document.createElement('div');m.id='techniqueModal';m.className='technique-modal';document.body.appendChild(m)}
  m.innerHTML=`<div class="technique-sheet"><button class="technique-close" id="techClose">×</button><div class="eyebrow">EXÉCUTION PROPRE</div><h2>${esc(ex)}</h2><div class="technique-visual">${anatomySvg(ex)}<div><span>MUSCLES CIBLÉS</span><b>${esc(t.muscles)}</b></div></div><div class="tech-block"><h3>Position</h3><p>${esc(t.setup)}</p></div><div class="grid2 technique-grid"><div class="tech-block good"><h3>✓ À FAIRE</h3>${t.cues.map(x=>`<p>${esc(x)}</p>`).join('')}</div><div class="tech-block badbox"><h3>✕ À ÉVITER</h3>${t.errors.map(x=>`<p>${esc(x)}</p>`).join('')}</div></div><p class="tech-note">Schéma anatomique v0.1. Les visuels humains détaillés pourront remplacer ce schéma sans changer le fonctionnement.</p></div>`;
  $('#techClose').onclick=()=>m.remove();m.onclick=e=>{if(e.target===m)m.remove()};
}
function openExerciseStats(workout,exercise){
  const root=$('#trainingStatsBox');if(root){root.dataset.workout=workout;root.dataset.exercise=exercise}switchMode('stats');renderStats();
}

function recoveryOnyx(){return `<span class="rest-onyx"><span class="onyx-art onyx-master-crop recovery recovery-crop" style="--ox:925;--oy:130;--ow:330;--oh:410;--sheet-w:1536;--sheet-h:1024"><img src="/ONYX-FIT-V0.1/assets/CE7966B7-F1FF-42CE-9156-F530A22AEC18.png" alt="Onyx en récupération" draggable="false"></span></span>`}
function startRest(sec=60){state.rest=Math.max(1,sec);state.restTotal=state.rest;state.restPaused=false;state.restMinimized=false;startRestTick();renderRestOverlay();updateFloatingBar()}
function startRestTick(){clearInterval(state.restTick);state.restTick=setInterval(()=>{if(!state.paused&&!state.restPaused){state.rest--;if(state.rest<=0){finishRest();return}if(!state.restMinimized)renderRestOverlay();updateFloatingBar()}},1000)}
function toggleRestPause(){state.restPaused=!state.restPaused;if(state.restPaused){clearInterval(state.restTick);state.restTick=null}else if(!state.paused)startRestTick();if(!state.restMinimized)renderRestOverlay();updateFloatingBar()}
function minimizeRest(){state.restMinimized=true;$('#restFullscreen')?.remove();updateFloatingBar()}
function restEndSignal(){try{navigator.vibrate?.([160,80,160])}catch{};try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;const c=new A(),o=c.createOscillator(),g=c.createGain();o.frequency.value=880;g.gain.value=.04;o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.16)}catch{}}
function finishRest(){clearInterval(state.restTick);state.restTick=null;state.rest=0;state.restPaused=false;state.restMinimized=false;$('#restFullscreen')?.remove();updateFloatingBar();restEndSignal();renderCurrentSet()}
function renderRestOverlay(){
  if(state.rest<=0){$('#restFullscreen')?.remove();return}if(state.restMinimized)return;let o=$('#restFullscreen');if(!o){o=document.createElement('div');o.id='restFullscreen';o.className='rest-fullscreen';document.body.appendChild(o)}
  const pct=state.restTotal?Math.max(0,Math.min(100,state.rest/state.restTotal*100)):0;o.innerHTML=`<div class="rest-panel"><button class="rest-minimize" id="restMinimize" aria-label="Réduire le repos">⌄</button><div class="eyebrow">RÉCUPÉRATION</div>${recoveryOnyx()}<div class="rest-progress"><i style="width:${pct}%"></i></div><div class="rest-big">${fmt(state.rest)}</div><p class="muted">Respire. Tu peux naviguer dans l’app, le chrono continue.</p><div class="rest-controls"><button class="btn" id="restMinus">−15 s</button><button class="btn primary" id="restToggle">${state.paused||state.restPaused?'REPRENDRE':'PAUSE'}</button><button class="btn" id="restPlus">+15 s</button></div><button class="btn ghost full" id="skipRest">PASSER LE REPOS</button></div>`;
  $('#restMinus').onclick=()=>{state.rest=Math.max(1,state.rest-15);renderRestOverlay();updateFloatingBar()};$('#restPlus').onclick=()=>{state.rest+=15;state.restTotal=Math.max(state.restTotal,state.rest);renderRestOverlay();updateFloatingBar()};$('#restToggle').onclick=()=>state.paused?toggleSessionPause():toggleRestPause();$('#skipRest').onclick=finishRest;$('#restMinimize').onclick=minimizeRest;
}

function endWorkout(){
  clearInterval(state.tick);clearInterval(state.restTick);state.tick=state.restTick=null;$('#restFullscreen')?.remove();removeGlobalPause();const db=readDb(),w=currentWorkout();db.history=Array.isArray(db.history)?db.history:[];db.history.push({date:new Date().toISOString(),workout:String(w?.name||'Séance'),duration:state.elapsed,sets:[...state.sets]});writeDb(db);state.active=false;
  const volume=state.sets.reduce((a,s)=>a+(Number(s.weight)||0)*(Number(s.reps)||0),0),bestW=Math.max(0,...state.sets.map(s=>Number(s.weight)||0)),bestR=Math.max(0,...state.sets.map(s=>Number(s.reps)||0));const prs=state.prs.length?`<div class="finish-prs"><div class="eyebrow">NOUVEAUX RECORDS</div>${state.prs.map(p=>`<div>⚡ ${esc(p.exercise)} — ${p.weight} kg × ${p.reps}</div>`).join('')}</div>`:'';
  const root=$('#workoutBox');if(root)root.innerHTML=`<div class="card workout-finished"><div class="finish-onyx"><span class="onyx-art onyx-master-crop" style="--ox:320;--oy:585;--ow:300;--oh:360;--sheet-w:1536;--sheet-h:1024"><img src="/ONYX-FIT-V0.1/assets/CE7966B7-F1FF-42CE-9156-F530A22AEC18.png" alt="Onyx victoire"></span></div><div class="eyebrow">SÉANCE TERMINÉE</div><h1>Bien joué 🔥</h1><div class="finish-kpis"><div><span>Durée</span><b>${fmt(state.elapsed)}</b></div><div><span>Volume</span><b>${Math.round(volume)} kg</b></div><div><span>Charge max</span><b>${bestW} kg</b></div><div><span>Reps max</span><b>${bestR}</b></div></div>${prs}<button class="btn primary full" id="backToSessions">RETOUR AUX SÉANCES</button></div>`;$('#backToSessions')?.addEventListener('click',renderSessionPicker);
}

function formatDate(v){const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('fr-FR')}
function chart(points,key,title,unit){
  if(!Array.isArray(points)||!points.length)return `<div class="stat-chart"><h3>${title}</h3><p class="muted">Pas encore de données.</p></div>`;const vals=points.map(p=>Number(p[key])||0),max=Math.max(...vals,1),min=Math.min(...vals,0),range=Math.max(1,max-min),w=320,h=120,pad=18;const xy=vals.map((v,i)=>{const x=pad+(w-pad*2)*(vals.length===1?.5:i/(vals.length-1));const y=h-pad-(h-pad*2)*(v-min)/range;return[x,y]});const line=xy.map(p=>p.join(',')).join(' '),first=vals[0],last=vals[vals.length-1],delta=last-first;return `<div class="stat-chart"><div class="stat-chart-head"><div><span>${title}</span><strong>${last} ${unit}</strong></div><b class="${delta>=0?'gain':'loss'}">${delta>=0?'+':''}${delta.toFixed(1)} ${unit}</b></div><svg viewBox="0 0 ${w} ${h}"><polyline points="${line}" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>${xy.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="4" fill="currentColor"/>`).join('')}</svg></div>`}
function renderStats(){
  const root=$('#trainingStatsBox');if(!root)return;try{const hist=safeHistory();if(!hist.length){root.innerHTML='<div class="card"><h2>Statistiques</h2><p class="muted">Termine une séance pour débloquer tes courbes de progression.</p></div>';return}const workouts=[...new Set(hist.map(h=>h.workout).filter(Boolean))],selectedWorkout=workouts.includes(root.dataset.workout)?root.dataset.workout:workouts[0],wh=hist.filter(h=>h.workout===selectedWorkout),exercises=[...new Set(wh.flatMap(h=>h.sets.map(s=>s&&s.exercise).filter(Boolean)))];if(!exercises.length){root.innerHTML=`<div class="card"><h2>${esc(selectedWorkout)}</h2><p class="muted">Aucune série enregistrée.</p></div>`;return}const selectedExercise=exercises.includes(root.dataset.exercise)?root.dataset.exercise:exercises[0];const sessions=wh.map(h=>{const sets=h.sets.filter(s=>s&&s.exercise===selectedExercise).map(s=>({weight:Number(s.weight)||0,reps:Number(s.reps)||0,rpe:Number(s.rpe)||0,set:Number(s.set)||0}));if(!sets.length)return null;const weights=sets.map(s=>s.weight),reps=sets.map(s=>s.reps),volumes=sets.map(s=>s.weight*s.reps);return{date:h.date||'',sets,weight:Math.max(...weights),weightMin:Math.min(...weights),reps:Math.max(...reps),repsMin:Math.min(...reps),avgWeight:weights.reduce((a,b)=>a+b,0)/weights.length,avgReps:reps.reduce((a,b)=>a+b,0)/reps.length,volume:volumes.reduce((a,b)=>a+b,0),rpeAvg:sets.reduce((a,b)=>a+b.rpe,0)/sets.length}}).filter(Boolean);const bestWeight=Math.max(0,...sessions.map(s=>s.weight)),bestReps=Math.max(0,...sessions.map(s=>s.reps)),totalVolume=sessions.reduce((a,s)=>a+s.volume,0),avgWeight=sessions.length?sessions.reduce((a,s)=>a+s.avgWeight,0)/sessions.length:0;
  root.innerHTML=`<div class="card stats-card detailed-stats"><div class="eyebrow">PROGRESSION DÉTAILLÉE</div><h2>${esc(selectedWorkout)} → ${esc(selectedExercise)}</h2><div class="grid2"><label>Séance<select id="statsWorkout">${workouts.map(x=>`<option ${x===selectedWorkout?'selected':''}>${esc(x)}</option>`).join('')}</select></label><label>Exercice<select id="statsExercise">${exercises.map(x=>`<option ${x===selectedExercise?'selected':''}>${esc(x)}</option>`).join('')}</select></label></div><div class="stat-kpis"><div><span>MEILLEURE CHARGE</span><strong>${bestWeight} kg</strong></div><div><span>MAX RÉPÉTITIONS</span><strong>${bestReps}</strong></div><div><span>VOLUME TOTAL</span><strong>${Math.round(totalVolume)} kg</strong></div><div><span>CHARGE MOYENNE</span><strong>${avgWeight.toFixed(1)} kg</strong></div></div>${chart(sessions,'weight','Charge max','kg')}${chart(sessions,'reps','Répétitions max','reps')}<div class="history-card"><h3>Historique jour par jour</h3>${sessions.slice().reverse().map((s,i)=>`<details class="day-history" ${i===0?'open':''}><summary><span>${formatDate(s.date)}</span><b>${s.weightMin}–${s.weight} kg · ${s.repsMin}–${s.reps} reps</b></summary><div class="day-meta">Moyenne ${s.avgWeight.toFixed(1)} kg · ${s.avgReps.toFixed(1)} reps · RPE ${s.rpeAvg.toFixed(1)} · Volume ${Math.round(s.volume)} kg</div>${s.sets.map((x,j)=>`<div class="set-history"><span>Série ${x.set||j+1}</span><b>${x.weight} kg × ${x.reps}</b><em>RPE ${x.rpe||'—'} · ${Math.round(x.weight*x.reps)} kg</em></div>`).join('')}</details>`).join('')}</div></div>`;$('#statsWorkout').onchange=e=>{root.dataset.workout=e.target.value;root.dataset.exercise='';renderStats()};$('#statsExercise').onchange=e=>{root.dataset.exercise=e.target.value;renderStats()};}catch(err){console.error('ONYX stats error',err);root.innerHTML='<div class="card"><h2>Statistiques</h2><p class="muted">Une ancienne donnée est illisible, mais les nouvelles séances restent enregistrées.</p></div>'}}

const observer=new MutationObserver(()=>{const screen=$('#workoutScreen');if(screen&&screen.dataset.onyxTrainingV4!=='1')initTraining();if(screen&&screen.dataset.onyxTrainingV4==='1'&&state.mode==='session'&&!state.active){const root=$('#workoutBox');if(root&&!root.querySelector('.onyx-session-picker')&&!root.querySelector('.workout-finished'))renderSessionPicker()}});observer.observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('DOMContentLoaded',()=>setTimeout(initTraining,80));setTimeout(initTraining,180);
