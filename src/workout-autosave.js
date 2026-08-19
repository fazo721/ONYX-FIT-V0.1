// ONYX FIT v0.1 — crash-safe active workout autosave/recovery
const STORAGE='onyx_v01', ACTIVE='onyx_active_workout_v1';
const $=s=>document.querySelector(s);
const read=()=>{try{return JSON.parse(localStorage.getItem(STORAGE)||'{}')||{}}catch{return{}}};
const active=()=>{try{return JSON.parse(localStorage.getItem(ACTIVE)||'null')}catch{return null}};
const put=x=>{try{localStorage.setItem(ACTIVE,JSON.stringify(x))}catch{}};
const clear=()=>{try{localStorage.removeItem(ACTIVE)}catch{}};
const clock=()=>{const m=String($('.js-session-clock')?.textContent||'').match(/(\d+):(\d+)/);return m?(+m[1]*60+ +m[2]):0};
const workout=()=>$('#workoutBox .pro-exercise .eyebrow')?.textContent?.trim()||'';
const exercise=()=>$('#workoutBox .pro-exercise h1')?.textContent?.trim()||'';
const setNo=()=>{const m=String($('#workoutBox .pro-exercise .muted')?.textContent||'').match(/Série\s+(\d+)/i);return m?+m[1]:1};
let tracking=false;
function snap(){if(!tracking)return;const w=workout();if(!w)return;const old=active()||{id:`active_${Date.now()}`,startedAt:new Date().toISOString(),sets:[]};old.workout=w;old.exercise=exercise();old.set=setNo();old.elapsed=clock();old.updatedAt=new Date().toISOString();put(old)}
function removeBanner(){document.querySelectorAll('#workoutRecoveryBanner').forEach(x=>x.remove())}
function stopTracking(){tracking=false;clear();removeBanner()}
function archiveRecovered(a){const db=read();db.history=Array.isArray(db.history)?db.history:[];if(!db.history.some(h=>h?.recoveryId===a.id)){db.history.push({id:`recovered_${Date.now()}`,recoveryId:a.id,date:a.startedAt||new Date().toISOString(),workout:a.workout||'Séance récupérée',duration:+a.elapsed||0,sets:Array.isArray(a.sets)?a.sets:[],completed:false,interrupted:true,recovered:true});localStorage.setItem(STORAGE,JSON.stringify(db))}stopTracking()}
function offerRecovery(){removeBanner();const a=active();const setCount=Array.isArray(a?.sets)?a.sets.length:0;const elapsed=Number(a?.elapsed)||0;if(!a?.workout||(!setCount&&elapsed<10)){if(a&&!setCount&&elapsed<10)clear();return}const box=document.createElement('div');box.id='workoutRecoveryBanner';box.innerHTML=`<div style="position:fixed;left:12px;right:12px;bottom:88px;z-index:9998;background:#111;border:1px solid #3a3a3a;border-radius:16px;padding:14px;box-shadow:0 12px 35px #000"><b>⚡ Séance non terminée retrouvée</b><p style="margin:7px 0;color:#aaa;font-size:.86rem">${a.workout} · ${setCount} séries · ${Math.floor(elapsed/60)} min. Tes données ne sont pas perdues.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn primary" id="recoverKeep" type="button">GARDER DANS L’HISTORIQUE</button><button class="btn" id="recoverDiscard" type="button">IGNORER</button></div></div>`;document.body.appendChild(box)}
document.addEventListener('click',e=>{const start=e.target.closest?.('#startWorkoutBtn');const validate=e.target.closest?.('#proValidateSet');const discard=e.target.closest?.('#recoverDiscard');const keep=e.target.closest?.('#recoverKeep');const stop=e.target.closest?.('#confirmStopWorkout,.confirm-stop-workout,#stopWorkoutConfirm');if(discard){e.preventDefault();e.stopPropagation();stopTracking();return}if(keep){e.preventDefault();e.stopPropagation();const a=active();if(a)archiveRecovered(a);else stopTracking();return}if(stop){setTimeout(stopTracking,30);return}if(start){tracking=true;setTimeout(snap,80);return}if(validate){tracking=true;const old=active()||{id:`active_${Date.now()}`,startedAt:new Date().toISOString(),sets:[]};old.workout=workout();old.sets=Array.isArray(old.sets)?old.sets:[];old.sets.push({exercise:exercise(),weight:+($('#proWeight')?.value)||0,reps:+($('#proReps')?.value)||0,rpe:+($('#proRpe')?.value)||0,set:setNo()});old.elapsed=clock();old.updatedAt=new Date().toISOString();put(old);setTimeout(snap,80)}},true);
setInterval(()=>{if(tracking&&$('.js-session-clock'))snap()},5000);
const obs=new MutationObserver(()=>{if($('.workout-finished'))stopTracking();if(!active())removeBanner()});obs.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('storage',e=>{if(e.key===ACTIVE&&!e.newValue)removeBanner()});
window.addEventListener('DOMContentLoaded',()=>setTimeout(offerRecovery,500));setTimeout(offerRecovery,900);
window.OnyxWorkoutAutosave={snapshot:snap,clear:stopTracking,active};
