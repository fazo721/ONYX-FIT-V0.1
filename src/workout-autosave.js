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
function snap(){const w=workout();if(!w)return;const old=active()||{id:`active_${Date.now()}`,startedAt:new Date().toISOString(),sets:[]};old.workout=w;old.exercise=exercise();old.set=setNo();old.elapsed=clock();old.updatedAt=new Date().toISOString();put(old)}
document.addEventListener('click',e=>{if(e.target.closest?.('#startWorkoutBtn'))setTimeout(snap,80);if(e.target.closest?.('#proValidateSet')){const old=active()||{id:`active_${Date.now()}`,startedAt:new Date().toISOString(),sets:[]};old.workout=workout();old.sets=Array.isArray(old.sets)?old.sets:[];old.sets.push({exercise:exercise(),weight:+($('#proWeight')?.value)||0,reps:+($('#proReps')?.value)||0,rpe:+($('#proRpe')?.value)||0,set:setNo()});old.elapsed=clock();old.updatedAt=new Date().toISOString();put(old);setTimeout(snap,80)}},true);
setInterval(()=>{if($('.js-session-clock'))snap()},5000);
function archiveRecovered(a){const db=read();db.history=Array.isArray(db.history)?db.history:[];if(!db.history.some(h=>h?.recoveryId===a.id)){db.history.push({id:`recovered_${Date.now()}`,recoveryId:a.id,date:a.startedAt||new Date().toISOString(),workout:a.workout||'Séance récupérée',duration:+a.elapsed||0,sets:Array.isArray(a.sets)?a.sets:[],completed:false,interrupted:true,recovered:true});localStorage.setItem(STORAGE,JSON.stringify(db))}clear()}
function offerRecovery(){const a=active();if(!a?.workout||(!a.elapsed&&!a.sets?.length))return;let box=document.createElement('div');box.id='workoutRecoveryBanner';box.innerHTML=`<div style="position:fixed;left:12px;right:12px;bottom:88px;z-index:9998;background:#111;border:1px solid #3a3a3a;border-radius:16px;padding:14px;box-shadow:0 12px 35px #000"><b>⚡ Séance non terminée retrouvée</b><p style="margin:7px 0;color:#aaa;font-size:.86rem">${a.workout} · ${a.sets?.length||0} séries · ${Math.floor((a.elapsed||0)/60)} min. Tes données ne sont pas perdues.</p><div style="display:flex;gap:8px"><button class="btn primary" id="recoverKeep">GARDER DANS L’HISTORIQUE</button><button class="btn" id="recoverDiscard">IGNORER</button></div></div>`;document.body.appendChild(box);$('#recoverKeep').onclick=()=>{archiveRecovered(a);box.remove()};$('#recoverDiscard').onclick=()=>{clear();box.remove()}}
const obs=new MutationObserver(()=>{if($('.workout-finished'))clear()});obs.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('DOMContentLoaded',()=>setTimeout(offerRecovery,500));setTimeout(offerRecovery,900);
window.OnyxWorkoutAutosave={snapshot:snap,clear,active};
