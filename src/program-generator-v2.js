// ONYX FIT — intelligent program generator v2
const KEY='onyx_v01';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return{}}};
const write=db=>localStorage.setItem(KEY,JSON.stringify(db));

const EX={
 benchDb:{name:'Développé couché haltères',muscles:['Pectoraux','Triceps'],req:['Haltères']},
 benchBar:{name:'Développé couché barre',muscles:['Pectoraux','Triceps'],req:['Barre olympique','Disques','Rack / cage']},
 incline:{name:'Développé incliné haltères',muscles:['Pectoraux','Triceps','Épaules'],req:['Haltères','Banc inclinable']},
 pushup:{name:'Pompes',muscles:['Pectoraux','Triceps'],req:[]},
 fly:{name:'Écarté haltères',muscles:['Pectoraux'],req:['Haltères']},
 latPull:{name:'Tirage vertical poulie',muscles:['Dos','Biceps'],any:['Poulie haute','Double poulie']},
 rowDb:{name:'Rowing haltère',muscles:['Dos','Biceps'],req:['Haltères']},
 rowCable:{name:'Rowing poulie basse',muscles:['Dos','Biceps'],any:['Poulie basse','Double poulie']},
 pullup:{name:'Tractions',muscles:['Dos','Biceps'],req:['Barre de traction']},
 face:{name:'Face pull',muscles:['Épaules','Dos'],any:['Poulie haute','Double poulie']},
 ohp:{name:'Développé épaules haltères',muscles:['Épaules','Triceps'],req:['Haltères']},
 latRaise:{name:'Élévations latérales',muscles:['Épaules'],req:['Haltères']},
 curl:{name:'Curl haltères',muscles:['Biceps'],req:['Haltères']},
 hammer:{name:'Curl marteau',muscles:['Biceps'],req:['Haltères']},
 tri:{name:'Extension triceps poulie',muscles:['Triceps'],any:['Poulie haute','Double poulie']},
 goblet:{name:'Goblet squat',muscles:['Jambes','Fessiers'],req:['Haltères']},
 squat:{name:'Squat barre',muscles:['Jambes','Fessiers'],req:['Barre olympique','Disques','Rack / cage']},
 bulgarian:{name:'Fentes bulgares',muscles:['Jambes','Fessiers'],req:[]},
 rdl:{name:'Soulevé de terre roumain haltères',muscles:['Ischios','Fessiers'],req:['Haltères']},
 hip:{name:'Hip thrust',muscles:['Fessiers','Ischios'],req:['Banc inclinable']},
 press:{name:'Leg press',muscles:['Jambes','Fessiers'],req:['Leg press']},
 calf:{name:'Mollets debout',muscles:['Jambes'],req:[]},
 plank:{name:'Planche',muscles:['Abdos'],req:[]}
};

const SPLITS={
 2:[['Full Body A','full'],['Full Body B','full']],
 3:[['Pecs / Triceps','push'],['Dos / Biceps','pull'],['Jambes / Fessiers','legs']],
 4:[['Pecs / Triceps','push'],['Jambes / Fessiers','legs'],['Dos / Biceps','pull'],['Haut du corps','upper']],
 5:[['Pecs / Triceps','push'],['Dos / Biceps','pull'],['Jambes / Fessiers','legs'],['Haut du corps','upper'],['Jambes / Fessiers B','legsB']],
 6:[['Pecs / Triceps A','push'],['Dos / Biceps A','pull'],['Jambes / Fessiers A','legs'],['Pecs / Triceps B','pushB'],['Dos / Biceps B','pullB'],['Jambes / Fessiers B','legsB']]
};

const POOLS={
 push:['benchBar','benchDb','incline','pushup','ohp','latRaise','fly','tri'],
 pushB:['incline','benchDb','pushup','ohp','fly','latRaise','tri'],
 pull:['pullup','latPull','rowCable','rowDb','face','curl','hammer'],
 pullB:['rowDb','rowCable','latPull','pullup','face','hammer','curl'],
 legs:['squat','press','goblet','bulgarian','rdl','hip','calf','plank'],
 legsB:['rdl','hip','bulgarian','press','squat','goblet','calf','plank'],
 upper:['benchDb','incline','latPull','rowDb','ohp','face','curl','tri'],
 full:['squat','press','goblet','benchDb','pushup','latPull','rowDb','rdl','hip','ohp','plank']
};

function available(ex,equipment){
 const eq=new Set(equipment||[]);
 if(ex.req?.some(r=>!eq.has(r)))return false;
 if(ex.any?.length&&!ex.any.some(r=>eq.has(r)))return false;
 return true;
}
function focusScore(ex,focus){return (focus||[]).reduce((n,f)=>n+(ex.muscles||[]).some(m=>m===f||(f==='Bras'&&['Biceps','Triceps'].includes(m)))?2:0,0)}
function exerciseCount(duration){return duration<=35?4:duration<=50?5:duration<=70?6:7}
function prescription(name,goal,index){
 let sets=3,repMin=8,repMax=12,rpe=8,restSeconds=75,unit='reps';
 const compound=/Développé couché|Squat barre|Leg press|Tirage vertical|Rowing|Tractions|Soulevé de terre|Hip thrust|Goblet squat/i.test(name);
 if(/Planche/i.test(name))return {sets:3,repMin:30,repMax:60,targetRpe:8,restSeconds:45,unit:'sec'};
 if(goal==='muscle'){sets=compound?4:3;repMin=compound?6:10;repMax=compound?10:15;rpe=8;restSeconds=compound?105:60}
 else if(goal==='cut'){sets=3;repMin=compound?8:12;repMax=compound?12:15;rpe=8;restSeconds=compound?75:45}
 else if(goal==='maintain'){sets=compound?3:2;repMin=compound?6:10;repMax=compound?10:15;rpe=7.5;restSeconds=compound?90:60}
 else {sets=compound?3:3;repMin=compound?7:10;repMax=compound?12:15;rpe=8;restSeconds=compound?90:60}
 if(index>=5&&sets>2)sets--;
 return {sets,repMin,repMax,targetRpe:rpe,restSeconds,unit};
}
function pickFor(type,p,duration){
 const count=exerciseCount(duration),equipment=p.equipment||[],focus=p.focus||[];
 let ids=[...(POOLS[type]||POOLS.full)].filter(id=>available(EX[id],equipment));
 if(type==='full'&&ids.length<count){const fallback=['pushup','bulgarian','calf','plank'];for(const id of fallback)if(!ids.includes(id))ids.push(id)}
 ids=ids.map((id,pos)=>({id,pos,score:focusScore(EX[id],focus)})).sort((a,b)=>b.score-a.score||a.pos-b.pos).map(x=>x.id);
 const chosen=[];const usedPrimary=new Set();
 for(const id of ids){const ex=EX[id];const primary=ex.muscles?.[0]||id;if(chosen.length<count-1&&usedPrimary.has(primary)&&chosen.some(x=>(EX[x].muscles||[]).includes(primary)))continue;chosen.push(id);usedPrimary.add(primary);if(chosen.length>=count)break}
 for(const id of ids)if(chosen.length<count&&!chosen.includes(id))chosen.push(id);
 return chosen.slice(0,count).map((id,i)=>({name:EX[id].name,...prescription(EX[id].name,p.goal,i)}));
}
function generate(profile){
 const p={sessions:Math.max(2,Math.min(6,+profile.sessions||4)),duration:+profile.duration||60,goal:profile.goal||'recomp',focus:Array.isArray(profile.focus)?profile.focus:[],equipment:Array.isArray(profile.equipment)?profile.equipment:[]};
 const split=SPLITS[p.sessions]||SPLITS[4];
 return split.map(([name,type],i)=>({id:`generated-${Date.now()}-${i}`,name,split:type,exercises:pickFor(type,p,p.duration)}));
}
function summary(program,p){const total=program.reduce((n,w)=>n+w.exercises.length,0);return `${program.length} séances · ${total} exercices · ${p.duration||60} min environ`}

function handleCreate(e){
 const btn=e.target.closest?.('#newProgram');if(!btn)return;
 e.preventDefault();e.stopImmediatePropagation();
 const db=read();db.profile=db.profile||{};
 db.profile.sessions=+($('#pSessions')?.value)||db.profile.sessions||4;
 db.profile.duration=+($('#pDuration')?.value)||db.profile.duration||60;
 db.profile.focus=$$('[data-pfocus].on').map(x=>x.dataset.pfocus);
 const program=generate(db.profile);db.program=program;db.programSchema=3;db.programMeta={generator:'onyx-v2',createdAt:new Date().toISOString(),goal:db.profile.goal,sessions:db.profile.sessions,duration:db.profile.duration,focus:db.profile.focus,equipment:[...(db.profile.equipment||[])]};
 write(db);window.dispatchEvent(new CustomEvent('onyx:program-created',{detail:{generator:'v2'}}));
 btn.textContent='✓ PROGRAMME CRÉÉ';const note=document.createElement('p');note.className='muted onyx-program-summary';note.textContent=summary(program,db.profile);btn.after(note);setTimeout(()=>{btn.textContent='CRÉER';note.remove()},2200);
}
document.addEventListener('click',handleCreate,true);
window.OnyxProgramGenerator={generate};
