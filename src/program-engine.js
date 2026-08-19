// ONYX FIT v0.1 — structured program engine
// Adds durable exercise prescriptions without touching the training UI.
const STORAGE='onyx_v01';

const RULES=[
  {match:/planche|gainage/i,sets:3,min:30,max:60,rpe:8,rest:45,unit:'sec'},
  {match:/curl|triceps|élévation|elevation|oiseau|face pull|mollet/i,sets:3,min:10,max:15,rpe:8,rest:45},
  {match:/fente|bulgare|hip thrust|rowing|tirage|incliné|incline|épaules|epaules/i,sets:3,min:8,max:12,rpe:8,rest:75},
  {match:/squat|soulevé de terre|souleve de terre|développé couché|developpe couche|leg press/i,sets:3,min:6,max:10,rpe:8,rest:90},
  {match:/.*/,sets:3,min:8,max:12,rpe:8,rest:60}
];

function prescription(name){
  const r=RULES.find(x=>x.match.test(String(name||'')))||RULES.at(-1);
  return {sets:r.sets,repMin:r.min,repMax:r.max,targetRpe:r.rpe,restSeconds:r.rest,unit:r.unit||'reps'};
}
function exerciseName(ex){return typeof ex==='string'?ex:String(ex?.name||ex?.exercise||'Exercice')}
function normalizeExercise(ex){
  const name=exerciseName(ex),base=prescription(name),old=ex&&typeof ex==='object'?ex:{};
  return {name,...base,...old,name,sets:Number(old.sets)||base.sets,repMin:Number(old.repMin)||base.repMin,repMax:Number(old.repMax)||base.repMax,targetRpe:Number(old.targetRpe)||base.targetRpe,restSeconds:Number(old.restSeconds??old.rest)||base.restSeconds};
}
function migrateProgram(){
  let db;try{db=JSON.parse(localStorage.getItem(STORAGE)||'{}')}catch{return}
  if(!db||!Array.isArray(db.program)||!db.program.length)return;
  let changed=false;
  db.program=db.program.map(w=>{
    if(!w||!Array.isArray(w.exercises))return w;
    const exercises=w.exercises.map(ex=>{const n=normalizeExercise(ex);if(typeof ex==='string'||JSON.stringify(ex)!==JSON.stringify(n))changed=true;return n});
    return {...w,exercises};
  });
  if(changed){db.programSchema=2;localStorage.setItem(STORAGE,JSON.stringify(db));window.dispatchEvent(new CustomEvent('onyx:program-migrated'));}
}

// Public read-only helper for later screens (home coach, stats, editor).
window.OnyxProgram={prescription,normalizeExercise,get(){try{return JSON.parse(localStorage.getItem(STORAGE)||'{}').program||[]}catch{return[]}}};

migrateProgram();
window.addEventListener('onyx:program-created',migrateProgram);
// main.js can recreate the program while the app is open; detect that safely.
let last='';setInterval(()=>{try{const db=JSON.parse(localStorage.getItem(STORAGE)||'{}'),sig=JSON.stringify(db.program||[]);if(sig!==last){last=sig;if((db.program||[]).some(w=>w?.exercises?.some(ex=>typeof ex==='string')))migrateProgram()}}catch{}},1500);
