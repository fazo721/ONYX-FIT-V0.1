import './app-viewport.css';

function resetScreenScroll(){
  document.querySelectorAll('.screen').forEach(s=>{if(s.classList.contains('active')){s.scrollTop=0;const inner=s.querySelector('.nut-shell,#profileBox,#workoutBox>.card');if(inner)inner.scrollTop=0}})
}

document.addEventListener('click',e=>{
  if(e.target.closest('[data-nav],.profile-tabs .chip,.training-tabs .chip')) requestAnimationFrame(resetScreenScroll);
});

window.addEventListener('resize',()=>document.documentElement.style.setProperty('--app-vh',window.innerHeight+'px'));
document.documentElement.style.setProperty('--app-vh',window.innerHeight+'px');
