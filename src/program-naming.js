// ONYX FIT — noms de séances basés sur les groupes musculaires réellement travaillés
const STORAGE='onyx_v01';

const RULES=[
  {re:/développé couché|developpe couche|pompe|écarté|ecarte|pec deck|chest press/i,primary:'Pectoraux',secondary:'Triceps'},
  {re:/développé incliné|developpe incline/i,primary:'Pectoraux',secondary:'Épaules'},
  {re:/développé épaules|developpe epaules|militaire|élévation latérale|elevation laterale|oiseau/i,primary:'Épaules',secondary:'Triceps'},
  {re:/tirage vertical|traction|lat pulldown/i,primary:'Dos',secondary:'Biceps'},
  {re:/rowing|tirage horizontal|row/i,primary:'Dos',secondary:'Biceps'},
  {re:/face pull/i,primary:'Épaules',secondary:'Dos'},
  {re:/curl/i,primary:'Biceps'},
  {re:/triceps|extension.*poulie|barre au front|dips/i,primary:'Triceps'},
  {re:/squat|leg press|presse à cuisses|presse a cuisses|leg extension/i,primary:'Quadriceps',secondary:'Fessiers'},
  {re:/soulevé de terre roumain|souleve de terre roumain|leg curl|ischio/i,primary:'Ischios',secondary:'Fessiers'},
  {re:/hip thrust|glute|fessier/i,primary:'Fessiers',secondary:'Ischios'},
  {re:/fente|bulgare|split squat/i,primary:'Quadriceps',secondary:'Fessiers'},
  {re:/mollet/i,primary:'Mollets'},
  {re:/planche|gainage|abdo|crunch/i,primary:'Abdos'}
];

const GENERIC=/^(haut|bas|jambes|séance|seance|jour|upper|lower|full body)(\s*\d+)?$/i;

function exName(ex){return typeof ex==='string'?ex:String(ex?.name||ex?.exercise||'')}
function scoreWorkout(workout){
  const score={};
  for(const ex of workout?.exercises||[]){
    const name=exName(ex);const r=RULES.find(x=>x.re.test(name));if(!r)continue;
    score[r.primary]=(score[r.primary]||0)+2;
    if(r.secondary)score[r.secondary]=(score[r.secondary]||0)+1;
  }
  return score;
}

function smartName(workout){
  const s=scoreWorkout(workout),v=k=>s[k]||0;
  const legs=v('Quadriceps')+v('Ischios')+v('Fessiers')+v('Mollets');
  const upper=v('Pectoraux')+v('Dos')+v('Épaules')+v('Biceps')+v('Triceps');
  if(legs>upper*1.35){
    if(v('Fessiers')>=v('Quadriceps')&&v('Ischios')>=2)return 'Fessiers / Ischios';
    if(v('Quadriceps')>=3&&v('Fessiers')>=2)return 'Jambes / Fessiers';
    return 'Jambes';
  }
  if(upper>legs*1.35){
    const push=v('Pectoraux')+v('Triceps')+v('Épaules');
    const pull=v('Dos')+v('Biceps');
    if(v('Pectoraux')>=3&&push>pull*1.2)return 'Pecs / Triceps';
    if(v('Dos')>=3&&pull>push*1.2)return 'Dos / Biceps';
    if(v('Épaules')>=3&&v('Pectoraux')<3)return 'Épaules / Triceps';
    if(Math.abs(push-pull)<=3)return 'Haut du corps';
    return push>pull?'Pecs / Épaules / Triceps':'Dos / Biceps';
  }
  if(upper&&legs)return 'Full Body';
  const ranked=Object.entries(s).sort((a,b)=>b[1]-a[1]);
  if(ranked.length>=2)return `${ranked[0][0]} / ${ranked[1][0]}`;
  return ranked[0]?.[0]||'Séance';
}

function applyNames(){
  let db;try{db=JSON.parse(localStorage.getItem(STORAGE)||'{}')}catch{return}
  if(!Array.isArray(db.program)||!db.program.length)return;
  let changed=false;
  db.program=db.program.map((w,i)=>{
    if(!w)return w;
    const current=String(w.name||'').trim();
    const generated=smartName(w);
    if(!current||GENERIC.test(current)){
      changed=changed||current!==generated;
      return {...w,name:generated,autoName:true};
    }
    return w;
  });
  if(changed){localStorage.setItem(STORAGE,JSON.stringify(db));document.dispatchEvent(new CustomEvent('onyx:program-renamed',{detail:{program:db.program}}));}
}

window.OnyxProgramNaming={smartName,scoreWorkout,applyNames};
applyNames();
window.addEventListener('onyx:program-created',()=>setTimeout(applyNames,0));
window.addEventListener('onyx:program-migrated',()=>setTimeout(applyNames,0));
document.addEventListener('onyx:db-updated',()=>setTimeout(applyNames,0));
setTimeout(applyNames,700);
