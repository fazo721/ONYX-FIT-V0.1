// ONYX FIT v0.1 — automatic cloud synchronization
const DATA_KEY='onyx_v01';
const ACCOUNT_KEY='onyx_account_v1';
const SYNC_INTERVAL=15000;
let lastSnapshot=localStorage.getItem(DATA_KEY)||'';
let syncing=false;
let pending=false;

function account(){try{return JSON.parse(localStorage.getItem(ACCOUNT_KEY)||'{}')||{}}catch{return {}}}
function canSync(){const a=account();return !!(a?.userId&&a?.mode==='supabase'&&window.OnyxAccount?.configured?.()&&navigator.onLine)}

async function syncIfChanged(force=false){
  const now=localStorage.getItem(DATA_KEY)||'';
  if(!canSync()) { lastSnapshot=now; return false; }
  if(!force&&now===lastSnapshot)return false;
  if(syncing){pending=true;return false}
  syncing=true;
  try{
    const ok=await window.OnyxAccount.sync('merge');
    if(ok)lastSnapshot=localStorage.getItem(DATA_KEY)||'';
    return !!ok;
  }catch(e){console.warn('ONYX cloud autosync',e);return false}
  finally{
    syncing=false;
    if(pending){pending=false;setTimeout(()=>syncIfChanged(),400)}
  }
}

// Polling is intentionally lightweight and avoids patching localStorage globally.
setInterval(()=>syncIfChanged(),SYNC_INTERVAL);
window.addEventListener('online',()=>setTimeout(()=>syncIfChanged(true),500));
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')syncIfChanged();});
window.addEventListener('pagehide',()=>syncIfChanged());
window.addEventListener('onyx:cloud-synced',()=>{lastSnapshot=localStorage.getItem(DATA_KEY)||''});
window.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{lastSnapshot=localStorage.getItem(DATA_KEY)||'';syncIfChanged(true)},1800));

window.OnyxCloudAutosync={sync:()=>syncIfChanged(true)};
