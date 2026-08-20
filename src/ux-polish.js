import './ux-polish.css';

let toastTimer;
function toast(text){
 let t=document.querySelector('.onyx-toast');
 if(!t){t=document.createElement('div');t.className='onyx-toast';document.body.appendChild(t)}
 t.textContent=text;t.classList.remove('on');requestAnimationFrame(()=>t.classList.add('on'));
 clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('on'),1500);
}

document.addEventListener('pointerdown',e=>{
 const hit=e.target.closest('button,.btn,.chip,.session-choice');if(!hit)return;
 const r=document.createElement('i');r.className='onyx-ripple';r.style.left=e.clientX+'px';r.style.top=e.clientY+'px';document.body.appendChild(r);setTimeout(()=>r.remove(),520);
},{passive:true});

document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 const text=(b.textContent||'').trim().replace(/\s+/g,' ');
 if(/AJOUTER|ENREGISTRER|SAUVEGARDER|VALIDER/i.test(text)) toast('⚡ '+(text.includes('AJOUT')?'Ajouté':'C’est enregistré'));
});

const obs=new MutationObserver(()=>{
 document.querySelectorAll('.card').forEach((el,i)=>{if(!el.dataset.onyxAnimated){el.dataset.onyxAnimated='1';el.style.animationDelay=Math.min(i*22,110)+'ms'}});
});
obs.observe(document.documentElement,{childList:true,subtree:true});
