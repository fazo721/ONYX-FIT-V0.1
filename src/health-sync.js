import { Capacitor } from '@capacitor/core';
import { HealthFitness } from '@capacitor/health-fitness';

const STORAGE='onyx_v01';
const $=s=>document.querySelector(s);
const native=()=>Capacitor.isNativePlatform();
const platform=()=>Capacitor.getPlatform();
const now=()=>new Date().toISOString();

const readDb=()=>{try{return JSON.parse(localStorage.getItem(STORAGE)||'{}')||{}}catch{return{}}};
const saveDb=db=>{localStorage.setItem(STORAGE,JSON.stringify(db));window.dispatchEvent(new CustomEvent('onyx:health-updated',{detail:db.health||{}}));setTimeout(()=>window.OnyxCloudAutosync?.sync?.(),250)};
const parse=s=>{try{return typeof s==='string'?JSON.parse(s):s}catch{return s}};
const findNumber=v=>{
  const x=parse(v);
  if(typeof x==='number'&&Number.isFinite(x))return x;
  if(Array.isArray(x)){for(let i=x.length-1;i>=0;i--){const n=findNumber(x[i]);if(Number.isFinite(n))return n}}
  if(x&&typeof x==='object'){
    for(const k of ['value','Value','quantity','Quantity','sum','Sum','average','Average','result','Result']){const n=Number(x[k]);if(Number.isFinite(n))return n}
    for(const k of Object.keys(x)){const n=findNumber(x[k]);if(Number.isFinite(n))return n}
  }
  return null;
};

function injectStyle(){
  if($('#healthSyncStyle'))return;
  const s=document.createElement('style');s.id='healthSyncStyle';s.textContent=`
  .health-action{margin-top:10px;padding:12px;border:1px solid #2b2b2b;border-radius:15px;background:linear-gradient(145deg,#141414,#0b0b0b);display:flex;align-items:center;justify-content:space-between;gap:10px}.health-action b{display:block;font-size:.82rem}.health-action span{display:block;margin-top:3px;color:#868686;font-size:.62rem;line-height:1.35}.health-action button{border:1px solid #6b3212;background:#17100c;color:#ff8b49;border-radius:10px;padding:9px 11px;font-size:.62rem;font-weight:850}.health-modal{position:fixed;inset:0;z-index:24000;background:#000c;display:grid;place-items:end center;padding:10px}.health-sheet{width:min(100%,480px);max-height:88vh;overflow:auto;background:#0d0d0d;border:1px solid #303030;border-radius:22px;padding:16px}.health-sheet h2{margin:.2rem 0 .35rem}.health-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:12px 0}.health-kpi{padding:11px;border:1px solid #282828;border-radius:13px;background:#090909}.health-kpi span{display:block;color:#888;font-size:.62rem}.health-kpi b{display:block;margin-top:4px;font-size:1rem}.health-status{font-size:.72rem;color:#aaa;line-height:1.45;margin:8px 0}.health-actions{display:grid;gap:8px;margin-top:12px}.health-close{margin-top:8px;width:100%}
  `;document.head.appendChild(s)
}

function format(v,u=''){return Number.isFinite(Number(v))?`${Math.round(Number(v)*10)/10}${u}`:'—'}
function latestHealth(){return readDb().health||{}}

function modal(){
  injectStyle();$('#healthModal')?.remove();
  const h=latestHealth(),m=document.createElement('div');m.id='healthModal';m.className='health-modal';
  const source=platform()==='ios'?'Apple Santé / Apple Watch':platform()==='android'?'Health Connect / montre Android':'Application web';
  m.innerHTML=`<div class="health-sheet"><div class="eyebrow">MONTRE & SANTÉ</div><h2>${source}</h2><p class="muted">ONYX importe tes données santé et sport puis les sauvegarde avec ton compte.</p><div class="health-grid"><div class="health-kpi"><span>Pas aujourd’hui</span><b>${format(h.steps)}</b></div><div class="health-kpi"><span>Calories actives</span><b>${format(h.calories,' kcal')}</b></div><div class="health-kpi"><span>Distance</span><b>${format(h.distance,' km')}</b></div><div class="health-kpi"><span>Fréquence cardiaque</span><b>${format(h.heartRate,' bpm')}</b></div><div class="health-kpi"><span>Poids</span><b>${format(h.weight,' kg')}</b></div><div class="health-kpi"><span>Masse grasse</span><b>${format(h.bodyFat,' %')}</b></div></div><div id="healthStatus" class="health-status">${h.lastSync?`Dernière synchro : ${new Date(h.lastSync).toLocaleString('fr-FR')}`:'Aucune synchronisation pour le moment.'}</div><div class="health-actions"><button class="btn primary" id="healthConnect">${h.connected?'SYNCHRONISER MAINTENANT':'CONNECTER MA MONTRE / SANTÉ'}</button></div>${native()?'':'<p class="health-status">La connexion directe aux données Apple Santé / Health Connect nécessite la version native ONYX FIT. Le site web seul ne peut pas lire les données de la montre.</p>'}<button class="btn ghost health-close" id="healthClose">FERMER</button></div>`;
  document.body.appendChild(m);
  $('#healthClose').onclick=()=>m.remove();
  $('#healthConnect').onclick=syncAll;
}

function mountAction(){
  injectStyle();const box=$('#profileBox'),info=$('[data-tab="info"]');if(!box||!info?.classList.contains('on')||box.querySelector('.health-action'))return;
  const a=document.createElement('div');a.className='health-action';a.innerHTML='<div><b>Montre connectée & Santé</b><span>Apple Watch, Apple Santé ou Health Connect : pas, cardio, sommeil, calories, poids, séances…</span></div><button type="button">OUVRIR</button>';a.querySelector('button').onclick=modal;box.appendChild(a)
}

async function requestPermissions(){
  await HealthFitness.requestHealthPermissions({
    customPermissions:'[]',
    allVariables:JSON.stringify({IsActive:true,AccessType:'READ'}),
    fitnessVariables:JSON.stringify({IsActive:false,AccessType:'READ'}),
    healthVariables:JSON.stringify({IsActive:false,AccessType:'READ'}),
    profileVariables:JSON.stringify({IsActive:false,AccessType:'READ'}),
    workoutVariables:JSON.stringify({IsActive:false,AccessType:'READ'})
  })
}

async function last(variable){
  try{return findNumber(await HealthFitness.getLastRecord({variable}))}catch{return null}
}

async function daily(variable,operation='SUM'){
  try{
    const start=new Date();start.setHours(0,0,0,0);const end=new Date();end.setHours(23,59,59,0);
    const iso=d=>d.toISOString().split('.')[0]+'Z';
    const r=await HealthFitness.getData({parameters:JSON.stringify({Variable:variable,StartDate:iso(start),EndDate:iso(end),TimeUnit:'DAY',OperationType:operation,TimeUnitLength:1,AdvancedQueryReturnType:'ALL_DATA',AdvancedQueryResultType:'RAW_DATA'})});
    return findNumber(r?.results)
  }catch{return null}
}

async function workouts(){
  if(platform()!=='ios')return [];
  try{
    const start=new Date(Date.now()-7*86400000),end=new Date(Date.now()+86400000),iso=d=>d.toISOString().split('.')[0]+'Z';
    const r=await HealthFitness.getWorkoutData({parameters:JSON.stringify({WorkoutTypeVariables:[],StartDate:iso(start),EndDate:iso(end)})});
    const v=parse(r?.results);return Array.isArray(v)?v:(v? [v]:[])
  }catch{return []}
}

async function syncAll(){
  const status=$('#healthStatus');if(status)status.textContent='Connexion et import en cours…';
  if(!native()){if(status)status.textContent='Le site web ne peut pas accéder directement à Apple Santé ou Health Connect. Il faudra installer la version native ONYX FIT.';return}
  try{
    await requestPermissions();
    const [steps,calories,distance,heartRate,weight,bodyFat,sleep,oxygen,bmr,workoutData]=await Promise.all([
      daily('STEPS'),daily('CALORIES_BURNED'),daily('DISTANCE'),last('HEART_RATE'),last('WEIGHT'),last('BODY_FAT_PERCENTAGE'),daily('SLEEP'),last('OXYGEN_SATURATION'),last('BASAL_METABOLIC_RATE'),workouts()
    ]);
    const db=readDb();db.health={...(db.health||{}),connected:true,provider:platform()==='ios'?'apple-health':'health-connect',steps,calories,distance,heartRate,weight,bodyFat,sleep,oxygen,bmr,workouts:workoutData,lastSync:now()};
    if(!Array.isArray(db.body))db.body=[];
    if(Number.isFinite(weight)){
      const d=new Date().toISOString().slice(0,10),lastBody=db.body[db.body.length-1];
      if(!(lastBody?.date===d&&lastBody?.source==='health'))db.body.push({id:`health-${Date.now()}`,date:d,weight,fat:Number.isFinite(bodyFat)?bodyFat:null,source:'health'});
      if(db.profile)db.profile.weight=weight;
    }
    saveDb(db);if(status)status.textContent='Synchronisation terminée. Les nouvelles données sont enregistrées dans ONYX et seront envoyées sur ton compte Supabase.';setTimeout(modal,350)
  }catch(e){console.error('ONYX health sync',e);if(status)status.textContent='Connexion impossible pour le moment. Vérifie les autorisations Santé de l’application.'}
}

let scheduled=false;function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;mountAction()})}
new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true});
document.addEventListener('click',e=>{if(e.target.closest('[data-nav="profile"],[data-tab="info"]'))setTimeout(schedule,100)});
window.addEventListener('DOMContentLoaded',()=>setTimeout(schedule,400));
window.OnyxHealth={open:modal,sync:syncAll};
