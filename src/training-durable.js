// ONYX FIT v0.1 — durable workout draft + calorie accounting
const STORAGE='onyx_v01';
const q=s=>document.querySelector(s);
const today=()=>new Date().toISOString().slice(0,10);
function read(){try{return JSON.parse(localStorage.getItem(STORAGE)||'{}')||{}}catch{return{}}}
function write(db){try{localStorage.setItem(STORAGE,JSON.stringify(db))}catch{}}
function parseClock(v){const m=String(v||'').match(/(\d+):(\d+)/);return m?(+m[1]*60+ +m[2]):0}
function currentDuration(){return parseClock(q('.js-session-clock')?.textContent)||0}
function profileWeight(){return Number(read()?.profile?.weight)||80}
function kcalForStrength(seconds,weight=profileWeight()){
  // Moderate-to-vigorous resistance training estimate (5 MET).
  const minutes=Math.max(0,seconds)/60;
  return Math.max(0,Math.round(5*3.5*weight/200*minutes));
}
function sessionName(){return q('#workoutBox .pro-exercise .eyebrow')?.textContent?.trim()||'Séance'}
function exerciseName(){return q('#workoutBox .pro-exercise h1')?.textContent?.trim()||'Exercice'}
function setNumber(){const t=q('#workoutBox .pro-exercise .muted')?.textContent||'';const m=t.match(/Série\s+(\d+)/i);return m?Number(m[1]):1}
function makeId(){return `train_${Date.now()}_${Math.random().toString(36).slice(2,7)}`}

let draft={id:'',startedAt:'',workout:'',sets:[]};
function resetDraft(){draft={id:makeId(),startedAt:new Date().toISOString(),workout:sessionName(),sets:[]}}
function ensureDraft(){if(!draft.id)resetDraft();if(!draft.workout||draft.workout==='Séance')draft.workout=sessionName()}

// Capture the values before the training module rerenders the next set.
document.addEventListener('click',e=>{
  const b=e.target.closest?.('#proValidateSet');if(!b)return;
  ensureDraft();
  draft.sets.push({
    exercise:exerciseName(),
    weight:Number(q('#proWeight')?.value)||0,
    reps:Number(q('#proReps')?.value)||0,
    rpe:Number(q('#proRpe')?.value)||0,
    set:setNumber()
  });
},true);

function addActivity(db,{duration,id,partial}){
  db.activities=Array.isArray(db.activities)?db.activities:[];
  if(db.activities.some(a=>a?.sourceTrainingId===id))return;
  const kcal=kcalForStrength(duration);
  if(duration<=0&&kcal<=0)return;
  db.activities.push({
    date:today(),type:partial?'Musculation (interrompue)':'Musculation',
    duration:Math.max(1,Math.round(duration/60)),kcal,
    sourceTrainingId:id,partial:!!partial
  });
}

function savePartial(){
  ensureDraft();
  const duration=currentDuration();
  const db=read();db.history=Array.isArray(db.history)?db.history:[];
  if(draft.sets.length||duration>0){
    db.history.push({
      id:draft.id,date:new Date().toISOString(),workout:draft.workout||sessionName(),
      duration,sets:draft.sets.map(s=>({...s})),completed:false,interrupted:true
    });
    addActivity(db,{duration,id:draft.id,partial:true});
    write(db);
  }
  const saved={sets:draft.sets.length,duration,kcal:kcalForStrength(duration)};
  resetDraft();return saved;
}
window.OnyxTrainingDurable={savePartial,kcalForStrength};

// When a normal workout ends, its history is already saved by training-stats.js.
// Add calories once, without duplicating history.
let lastCompletedKey='';
function syncCompletedCalories(){
  if(!q('.workout-finished'))return;
  const db=read(),h=Array.isArray(db.history)?db.history:[];const last=h.at(-1);if(!last)return;
  const key=last.id||`${last.date}|${last.workout}|${last.duration}`;if(key===lastCompletedKey)return;
  lastCompletedKey=key;
  if(!last.id){last.id=makeId()}
  if(last.completed==null)last.completed=true;
  addActivity(db,{duration:Number(last.duration)||0,id:last.id,partial:false});
  write(db);
  resetDraft();
}
const obs=new MutationObserver(syncCompletedCalories);obs.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('DOMContentLoaded',()=>{resetDraft();setTimeout(syncCompletedCalories,200)});
