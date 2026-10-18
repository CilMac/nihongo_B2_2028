/* Conversations entre amis : lecteur des situations et aides indépendantes. */
(function(root){
 'use strict';
 const fields=['kana','romaji','fr'],labels={kana:'Kana',romaji:'Romaji',fr:'Français'};
 function validate(d){
  const fail=m=>{throw Error('Conversations : '+m);};
  if(d?.schemaVersion!==1||(d.status!=='integrated'||d.publicationApproved!==false)||!d.editorialVersion||!d.situation||!d.turns)fail('format de conversation invalide');
  const s=d.situation,participants=s.participants;
  if(!s.id||!s.title||!participants||!Array.isArray(s.levels)||!s.levels.length)fail('situation incomplète');
  const known=new Set(Object.keys(d.turns)),used=new Set(),levelIds=new Set();
  for(const [id,t] of Object.entries(d.turns)){
   if(!/^[A-Za-z0-9-]+$/.test(id)||!participants[t.speakerId])fail('interlocuteur ou identifiant invalide');
   for(const k of ['jp','kana','kanaDisplay','romaji','fr'])if(typeof t[k]!=='string'||!t[k].trim())fail(id+' : '+k+' absent');
   if(t.kanaDisplay.replace(/\s/g,'')!==t.kana.replace(/\s/g,''))fail(id+' : lecture modifiée');
   if(/\p{Script=Han}/u.test(t.kana))fail(id+' : lecture kana incomplète');
   if(t.addresseeIds&&(!Array.isArray(t.addresseeIds)||t.addresseeIds.some(x=>!participants[x])))fail('destinataire inconnu');
  }
  const refs=list=>{if(!Array.isArray(list)||!list.length||new Set(list).size!==list.length)fail('liste de répliques invalide');for(const id of list){if(!known.has(id))fail('cible inconnue '+id);used.add(id);}};
  for(const l of s.levels){
   if(!l.id||!l.title||levelIds.has(l.id)||!Array.isArray(l.branches)||!l.branches.length)fail('niveau invalide');levelIds.add(l.id);refs(l.opening);refs(l.ending);if(l.supportTurnIds?.length)refs(l.supportTurnIds);
   const ids=new Set();for(const b of l.branches){
    if(!b.id||!b.title||ids.has(b.id))fail('branche invalide');ids.add(b.id);refs(b.turnIds);
    const path=[...l.opening,...b.turnIds,...l.ending];if(new Set(path).size!==path.length)fail('réplique répétée dans le parcours');
    const clarificationIds=new Set();for(const c of b.clarifications||[]){if(!/^[A-Za-z0-9-]+$/.test(c.id)||clarificationIds.has(c.id))fail('clarification dupliquée');clarificationIds.add(c.id);refs(c.turnIds);const at=b.turnIds.indexOf(c.afterTurnId);
     if(at<0||d.turns[c.afterTurnId].speakerId!=='yuki'||c.repeatTurnId!==c.afterTurnId||c.resumeAtTurnId!==b.turnIds[at+1])fail('raccordement de clarification invalide');
    }
   }
  }
  if([...known].some(id=>!used.has(id)))fail('réplique orpheline');return d;
 }
 function createState(level,preferences){return {defaults:preferences?{...preferences}:null,levelId:level.id,branchId:level.branches[0].id,base:true,overrides:{}};}
 function visible(state,id,key){return state.overrides[id]?.[key]??state.defaults?.[key]??state.base;}
 function toggleLocal(state,id,key){if(!fields.includes(key))throw Error('Aide inconnue');state.overrides[id]={...state.overrides[id],[key]:!visible(state,id,key)};}
 function toggleAll(state){state.base=!state.base;state.defaults=null;state.overrides={};}
 function setGlobal(state,key,value){state.defaults={...Object.fromEntries(fields.map(k=>[k,state.defaults?.[k]??state.base])),[key]:value};for(const overrides of Object.values(state.overrides))delete overrides[key];}
 function applyGlobal(key,value){if(current&&location.hash.startsWith('#conversations/'))preserveReading(()=>{setGlobal(current,key,value);refreshVisibility();});}
 function selectBranch(state,id){state.branchId=id;state.overrides={};}
 function restart(state){return state;} // Le parcours repart ; aucun réglage d’aide n’est effacé.
 function path(level,branch){return [...level.opening,...branch.turnIds,...level.ending];}
 function repeatItems(data,c){return [...c.turnIds.map(id=>({text:data.turns[id].jp,syntheticOnly:true})),{text:data.turns[c.repeatTurnId].jp,syntheticOnly:true,rateFactor:.72}];}
 // Une entrée par situation ; chaque fichier reste indépendant du lecteur.
 const sources={'T01-S02':'conversations.json'};
 const loaded=new Map(),pending=new Map();
 let data=null,version=0,current=null;
 function invalidate(){version++;}
 async function load(id){
  if(!sources[id])throw Error('Situation inconnue');
  if(loaded.has(id))return loaded.get(id);
  if(!pending.has(id))pending.set(id,(async()=>{
   const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
   try{const r=await fetch(sources[id]+'?v=20261018-integration',{signal:controller.signal,cache:'no-cache'});if(!r.ok)throw Error('HTTP '+r.status);
    const result=validate(await r.json());if(result.situation.id!==id)throw Error('Identifiant de situation incohérent');loaded.set(id,result);return result;
   }finally{clearTimeout(timeout);pending.delete(id);}
  })());
  return pending.get(id);
 }
 function syncContext(){const active=location.hash.split('/')[0]==='#conversations';document.body.classList.toggle('conversations-active',active);if(!active)current=null;}
 function focusTurn(id){const el=document.getElementById('conversation-'+id);if(el){el.focus({preventScroll:true});el.scrollIntoView({block:'start'});}}
 function preserveReading(action){
  const edge=document.querySelector('.navigation-dock')?.getBoundingClientRect().bottom||0;
  const anchor=[...document.querySelectorAll('.conversation-turn')].find(el=>el.getBoundingClientRect().bottom>edge);
  const top=anchor?.getBoundingClientRect().top;action();
  if(anchor?.isConnected)window.scrollBy(0,anchor.getBoundingClientRect().top-top);
 }
 function turnHTML(id,number,prefix='conversation',clarification=null){
  const t=data.turns[id],name=data.situation.participants[t.speakerId],key=prefix+'-'+id;
  return `<article class="conversation-turn" id="${key}" data-turn="${id}" data-instance="${key}" data-speaker="${esc(t.speakerId)}" tabindex="-1" aria-label="Réplique ${number}, ${esc(name)}"><div class="conversation-turn-head"><strong><small>${number}</small> ${esc(name)}${t.addresseeIds?' → '+t.addresseeIds.map(x=>esc(data.situation.participants[x])).join(', '):''}</strong><div class="conversation-local" role="group" aria-label="Aides de la réplique ${number}">${fields.map(k=>`<button type="button" data-conversation-aid="${k}" aria-pressed="${visible(current,key,k)}" aria-controls="${key}-${k}" aria-label="${visible(current,key,k)?'Masquer':'Afficher'} ${labels[k]} pour cette réplique">${labels[k]}</button>`).join('')}<button type="button" class="audio" data-conversation-play="${id}" aria-label="Écouter la réplique ${number} en japonais">▶</button></div></div><p class="conversation-jp" lang="ja">${jp(t.jp)}</p>${fields.map(k=>k==='kana'?`<button type="button" class="conversation-kana kana-audio" id="${key}-kana" lang="ja" data-conversation-play="${id}" aria-label="Écouter : ${esc(t.kanaDisplay)}" ${visible(current,key,k)?'':'hidden'}>${esc(t.kanaDisplay)}<span aria-hidden="true"> ♪</span></button>`:`<p class="conversation-${k}" id="${key}-${k}" ${visible(current,key,k)?'':'hidden'}>${esc(t[k])}</p>`).join('')}${clarification?`<details class="conversation-clarification"><summary>Demander de répéter plus lentement</summary>${clarification.turnIds.map((rid,i)=>turnHTML(rid,'↳ '+(i+1),'repair-'+clarification.id)).join('')}<p>Yuki répète sa réplique ci-dessus, puis ${esc(data.situation.participants[data.turns[clarification.resumeAtTurnId].speakerId])} poursuit l’échange.</p><button type="button" class="audio" data-conversation-repeat="${clarification.id}">▶ Écouter la demande et la répétition lente</button> <button type="button" data-conversation-resume="${clarification.id}">Reprendre le dialogue ↓</button></details>`:''}</article>`;
 }
 function status(){
  const host=document.getElementById('conversations');if(!host)return;
  const controls=[...host.querySelectorAll('[data-conversation-aid]')],n=controls.filter(b=>b.getAttribute('aria-pressed')==='true').length;
  host.querySelector('#conversation-aid-status').textContent=n===controls.length?'Toutes les aides visibles':n===0?'Toutes les aides masquées':'Aides personnalisées';
 }
 function refreshVisibility(){document.querySelectorAll('#conversations [data-conversation-aid]').forEach(b=>{const k=b.dataset.conversationAid,key=b.closest('[data-turn]').dataset.instance,v=visible(current,key,k);b.setAttribute('aria-pressed',String(v));b.setAttribute('aria-label',(v?'Masquer':'Afficher')+' '+labels[k]+' pour cette réplique');document.getElementById(b.getAttribute('aria-controls')).hidden=!v;});status();}
 function draw(level){
  const branch=level.branches.find(b=>b.id===current.branchId),s=data.situation,ids=path(level,branch),wide=matchMedia('(min-width:1000px)').matches;
  const people=[...new Set(ids.map(id=>data.turns[id].speakerId))].map(id=>s.participants[id]).join(', ');
  document.getElementById('main').innerHTML=`<div id="conversations"><a href="#conversations">← Les situations</a>${intro('CONVERSATIONS ENTRE AMIS',s.title,s.context)}<nav class="conversation-levels" aria-label="Niveaux">${s.levels.map(l=>`<a href="#conversations/${s.id}/${l.id}" ${l===level?'aria-current="page"':''}>${esc(l.title)}</a>`).join('')}</nav><div class="conversation-layout"><details class="conversation-branches" ${wide?'open':''}><summary>Branches · <span>${esc(branch.title)}</span></summary><div class="conversation-choices">${level.branches.map(b=>`<button type="button" data-conversation-branch="${b.id}" aria-pressed="${b===branch}">${esc(b.title)}<small>${[...new Set(b.turnIds.map(id=>data.turns[id].speakerId))].map(id=>esc(s.participants[id])).join(' · ')}</small></button>`).join('')}</div><p class="muted">Début commun → branche choisie → fin commune</p></details><section class="conversation-reader" aria-label="Dialogue"><div class="conversation-tools"><button type="button" data-conversation-restart>Recommencer</button><button type="button" class="audio" data-conversation-all>▶ Tout écouter</button><button type="button" data-conversation-stop>■ Arrêter</button><span id="conversation-aid-status" role="status"></span></div><p class="muted">${esc(people)} · ${ids.length} tours · Japonais cordial</p><h2>Début commun</h2>${level.opening.map((id,i)=>turnHTML(id,i+1)).join('')}<h2 id="conversation-branch-title" tabindex="-1">${esc(branch.title)}</h2>${branch.turnIds.map((id,i)=>turnHTML(id,level.opening.length+i+1,'conversation',branch.clarifications.find(c=>c.afterTurnId===id))).join('')}<h2>Fin commune</h2>${level.ending.map((id,i)=>turnHTML(id,level.opening.length+branch.turnIds.length+i+1)).join('')}${level.supportTurnIds?.length?`<details class="conversation-clarification"><summary>Une phrase pour demander de répéter</summary>${level.supportTurnIds.map((id,i)=>turnHTML(id,'Aide '+(i+1),'support')).join('')}</details>`:''}<button type="button" data-conversation-restart>Recommencer ce dialogue ↑</button></section></div></div>`;
  status();document.getElementById('conversations').onclick=e=>{
   const b=e.target.closest('button');if(!b)return;
   if(b.dataset.conversationAid){const id=b.closest('[data-turn]').dataset.instance;preserveReading(()=>{toggleLocal(current,id,b.dataset.conversationAid);refreshVisibility();});}
   if(b.dataset.conversationBranch){stopAudio();selectBranch(current,b.dataset.conversationBranch);draw(level);const heading=document.getElementById('conversation-branch-title');heading.focus({preventScroll:true});heading.scrollIntoView({block:'start'});}
   if(b.hasAttribute('data-conversation-restart')){stopAudio();restart(current);document.querySelectorAll('.conversation-clarification').forEach(d=>d.open=false);focusTurn(level.opening[0]);}
   if(b.dataset.conversationPlay)speak([{text:data.turns[b.dataset.conversationPlay].jp,syntheticOnly:true}]);
   if(b.hasAttribute('data-conversation-stop'))stopAudio('Lecture arrêtée.');
   if(b.hasAttribute('data-conversation-all'))speak(ids.map(id=>({text:data.turns[id].jp,syntheticOnly:true})));
   if(b.hasAttribute('data-conversation-repeat')){const token=version,c=branch.clarifications.find(c=>c.id===b.dataset.conversationRepeat);speak(repeatItems(data,c),{onComplete:()=>{if(token===version&&route().tab==='conversations'&&current.branchId===branch.id)focusTurn(c.resumeAtTurnId);}});}
   if(b.hasAttribute('data-conversation-resume')){stopAudio();focusTurn(branch.clarifications.find(c=>c.id===b.dataset.conversationResume).resumeAtTurnId);}
  };
  window.updateNavigationTab?.();
 }
 async function render(r){
  const token=++version;syncContext();document.getElementById('main').innerHTML='<p class="panel" role="status">Chargement des conversations…</p>';
  const active=()=>token===version&&route().tab==='conversations';
  let datasets;
  if(r.id&&!sources[r.id]){document.getElementById('main').innerHTML='<section class="panel"><h1>Conversation introuvable</h1><a href="#conversations">Revenir aux situations</a></section>';return;}
  try{datasets=await Promise.all((r.id?[r.id]:Object.keys(sources)).map(load));}catch{if(active()){document.getElementById('main').innerHTML='<section class="panel"><h1>Conversations indisponibles</h1><p>Le contenu n’a pas pu être chargé. Les autres rubriques restent accessibles.</p><button id="conversation-retry">Réessayer</button></section>';document.getElementById('conversation-retry').onclick=()=>render(r);}return;}
  if(!active())return;data=datasets[0];const s=data.situation;
  if(!r.id){current=null;document.getElementById('main').innerHTML=`${intro('CORPUS ORIGINAL','Conversations entre amis','Des échanges préparés à deux ou trois, pour écouter, comprendre et relancer.')}<p class="muted">Lot v${esc(data.editorialVersion)} : relecture linguistique par ChatGPT (IA), sans revue native.</p>${datasets.map(d=>{const s=d.situation;return `<section class="panel"><p class="eyebrow">${esc(s.theme)}</p><h2>${esc(s.title)}</h2><p>${esc(s.context)}</p><div class="conversation-levels">${s.levels.map(l=>`<a href="#conversations/${s.id}/${l.id}">${esc(l.title)}</a>`).join('')}</div></section>`;}).join('')}`;return;}
  const level=s.levels.find(l=>l.id===(r.line||'essentiel'));
  if(r.id!==s.id||!level){document.getElementById('main').innerHTML='<section class="panel"><h1>Conversation introuvable</h1><a href="#conversations">Revenir aux situations</a></section>';return;}
  if(!current||current.situationId!==s.id||current.levelId!==level.id){current=createState(level,{kana:settings.kana,romaji:settings.romaji,fr:settings.fr});current.situationId=s.id;}draw(level);
 }
 const api={validate,createState,visible,toggleLocal,toggleAll,selectBranch,restart,path,repeatItems,setGlobal,applyGlobal,render,invalidate,syncContext};root.Conversations=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);
