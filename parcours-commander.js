/* Parcours éditorial autonome : aucune injection dans les pools de révision. */
(function(root){
 'use strict';
 let data=null,loading=null,renderVersion=0;
 const sessions=new Map();
 const labels={C:'Construire',P:'Particules',D:'Dialoguer',R:'Corriger'};
 const shuffle=items=>{const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 function accepts(q,answer){
  if(q.mode==='order')return q.orders.some(order=>same(order,answer));
  if(q.mode==='gaps')return same(q.answers,answer);
  return answer===(q.mode==='choice'?q.target:q.answer);
 }
 async function load(){
  if(data)return data;
  if(!loading)loading=fetch('parcours-commander.json?v=20261012').then(r=>{if(!r.ok)throw Error('Chargement impossible');return r.json();}).then(d=>{data=d;return d;}).catch(e=>{loading=null;throw e;});
  return loading;
 }
 function sentence(id,translation=true){return block(data.phrases[id],{fr:translation,audio:true});}
 function session(step){if(!sessions.has(step.id))sessions.set(step.id,{index:0,answers:{}});return sessions.get(step.id);}
 function state(step){
  const s=session(step),q=step.exercises[s.index];
  if(!s.answers[q.id]){
   const bank=q.mode==='order'?data.phrases[q.target].chunks.map((_,i)=>i):q.options||[];
   let shuffled=shuffle(bank);
   if(q.mode==='order'&&accepts(q,shuffled))shuffled=shuffled.slice(1).concat(shuffled[0]);
   s.answers[q.id]={answer:q.mode==='order'?[]:q.mode==='gaps'?['','']:null,bank:shuffled,done:false,correct:false,shown:false};
  }
  return s.answers[q.id];
 }
 function stats(step){const entries=Object.values(session(step).answers);return {done:entries.filter(a=>a.done).length,correct:entries.filter(a=>a.done&&a.correct&&!a.shown).length};}
 function focusWork(){const el=document.getElementById('practice-question-title');el?.focus();}
 async function render(id){
  const version=++renderVersion;
  document.getElementById('main').innerHTML=intro('PARCOURS PRATIQUE','Commander et compter','Chargement du parcours…');
  try{await load();}catch{
   if(version!==renderVersion||route().id!=='pratique')return;
   document.getElementById('main').innerHTML='<section class="panel"><h1>Parcours indisponible</h1><p>Le contenu n’a pas pu être chargé.</p><button id="practice-retry">Réessayer</button><a href="#atelier">Retour à l’Atelier</a></section>';
   document.getElementById('practice-retry').onclick=()=>render(id);return;
  }
  if(version!==renderVersion||route().tab!=='atelier'||route().id!=='pratique')return;
  const step=data.steps.find(s=>s.id===id);
  const nav=`<nav class="practice-steps" aria-label="Étapes du parcours">${data.steps.map((s,i)=>`<a href="#atelier/pratique/${s.id}" ${s===step?'aria-current="step"':''}>${i+1}. ${esc(s.title)}<small>${stats(s).done} / 12 corrigés</small></a>`).join('')}</nav>`;
  document.getElementById('main').innerHTML=`<a href="#atelier">← Retour à l’Atelier</a>${intro('PARCOURS PRATIQUE','Commander et compter','Six situations pour comprendre, construire et répondre. Accessible quelle que soit votre leçon ; les nouveautés sont expliquées ici.')}<p>40 phrases repères · 6 dialogues accompagnés · 72 exercices. Votre séance reste disponible pendant cette visite ; elle n’est pas enregistrée après fermeture ou rechargement.</p>${nav}${step?stepHTML(step):`<section class="panel"><h2>De l’accueil au paiement</h2><p>Choisissez une situation ci-dessus. Lisez ses explications, écoutez les exemples, puis pratiquez. Vous pouvez revenir aux explications pendant les exercices et changer d’étape sans perdre votre séance en cours.</p><a class="audio" href="#atelier/pratique/accueil">Commencer par l’accueil →</a><p>Ce parcours complète <a href="#grammaire/G30">G30 — Commander et compter</a> et <a href="#grammaire/G17">G17 — Demander</a>. Ses exercices ne sont pas ajoutés aux révisions filtrées par leçon.</p></section>`}<details class="panel"><summary>Sources et méthode</summary><p>Exemples rédigés pour le carnet, avec reprises du socle existant. Les formulations de soutien préparent les dialogues et les exercices ; elles ne sont pas comptées dans les 40 repères. Écoute par synthèse vocale.</p>${data.sources.map(s=>`<p><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a></p>`).join('')}</details>`;
  if(step){renderWork(step);document.getElementById('practice-go').onclick=()=>{document.getElementById('practice-work').scrollIntoView({block:'start'});focusWork();};}
 }
 function stepHTML(step){return `<section class="panel"><h2>${esc(step.title)}</h2><p>${esc(step.context)}</p><button id="practice-go" type="button">Aller aux 12 exercices ↓</button><details id="practice-explanation" open><summary>Comprendre avant de pratiquer</summary>${step.notes.map(t=>`<p>${esc(t)}</p>`).join('')}<p><a href="#grammaire/G30">Retrouver la fiche G30 →</a></p></details><details open><summary>Les phrases repères</summary><div class="practice-examples">${step.phrases.map(id=>`<article><small>Repère ${Number(id.slice(1))}</small>${sentence(id)}</article>`).join('')}</div></details><details><summary>Préparer les autres formulations de cette étape</summary><p>Ces formulations complètent les repères pour comprendre les questions et les réponses des exercices.</p><div class="practice-examples">${step.support.map(id=>`<article>${sentence(id)}</article>`).join('')}</div></details><details open><summary>Un dialogue accompagné</summary><div class="practice-dialogue">${step.dialogue.map(([role,id])=>`<article><strong>${esc(role)}</strong>${sentence(id)}</article>`).join('')}</div></details></section><section id="practice-work" class="panel" aria-label="Exercices du parcours"></section>`;}
 function chunkButton(chunk,index,selected=false){return `<button type="button" data-${selected?'remove':'chunk'}="${index}"><span lang="ja">${esc(chunk.jp)}</span><span class="kana">${esc(chunk.kana)}</span><span class="romaji">${esc(Romaji.display(chunk.romaji))}</span></button>`;}
 function renderWork(step){
  const s=session(step),q=step.exercises[s.index],a=state(step),p=data.phrases[q.target];
  let task='';
  if(q.mode==='order'){
   task=`<p>Choisissez les blocs dans l’ordre. Touchez un bloc assemblé pour le retirer.</p><div class="practice-answer" aria-label="Votre phrase">${a.answer.length?a.answer.map((i,pos)=>chunkButton(p.chunks[i],pos,true)).join(''):'Votre phrase apparaîtra ici.'}</div><div class="practice-bank">${a.bank.filter(i=>!a.answer.includes(i)).map(i=>chunkButton(p.chunks[i],i)).join('')}</div>`;
  }else if(['particle','after'].includes(q.mode)){
   const display=q.mode==='after'?p.jp.replace(q.fragment,q.fragment+'［…］'):p.jp.replace(q.fragment,'［…］');
   const kana=q.mode==='after'?p.kana.replace(data.phrases[q.target].chunks[1].kana,data.phrases[q.target].chunks[1].kana+'［…］'):p.kana.replace(q.fragment,'［…］');
   task=`<p class="practice-gap" lang="ja">${esc(display)}</p><p class="kana">${esc(q.masked.kana)}</p><p class="romaji">${esc(Romaji.display(q.masked.romaji))}</p><p>Choisissez la particule. ∅ signifie : ne rien ajouter.</p><div class="practice-options">${a.bank.map(x=>`<button type="button" data-choice="${esc(x)}" aria-pressed="${a.answer===x}">${esc(x)}</button>`).join('')}</div>`;
  }else if(q.mode==='gaps'){
   task=`<p lang="ja">${esc(q.masked.jp)}</p><p class="kana">${esc(q.masked.kana)}</p><p class="romaji">${esc(Romaji.display(q.masked.romaji))}</p><p>∅ signifie : ne rien ajouter. Les deux réponses sont vérifiées ensemble.</p>${[0,1].map(i=>`<label>Emplacement ${i+1} <select data-gap="${i}"><option value="">Choisir…</option>${q.options.map(x=>`<option ${a.answer[i]===x?'selected':''} value="${esc(x)}">${esc(x)}</option>`).join('')}</select></label>`).join('')}`;
  }else{
   task=`<div class="practice-options">${a.bank.map(id=>`<button type="button" data-choice="${esc(id)}" aria-pressed="${a.answer===id}">${q.mode==='amount'?esc(id):`<span lang="ja">${esc(data.phrases[id].jp)}</span><span class="kana">${esc(data.phrases[id].kana)}</span><span class="romaji">${esc(Romaji.display(data.phrases[id].romaji))}</span>`}</button>`).join('')}</div>`;
  }
  const ready=q.mode==='order'?a.answer.length===p.chunks.length:q.mode==='gaps'?a.answer.every(Boolean):a.answer!==null;
  const totals=stats(step);
  document.getElementById('practice-work').innerHTML=`<p class="eyebrow">${esc(labels[q.kind])} · ${s.index+1} / 12</p><h2 id="practice-question-title" tabindex="-1">${esc(q.prompt)}</h2>${q.context?(q.mode==='amount'?`<p><button type="button" class="practice-listen" data-speak="${esc(data.phrases[q.context].kana)}">▶ Écouter le montant</button></p><details><summary>Voir le montant en japonais</summary>${sentence(q.context,false)}</details>`:`<aside class="practice-stimulus"><strong>Le personnel</strong>${sentence(q.context)}</aside>`):''}${q.wrong?`<aside class="practice-stimulus"><strong>Réponse à corriger</strong>${sentence(q.wrong,false)}</aside>`:''}<fieldset class="practice-task" ${a.done?'disabled':''}><legend class="muted">À vous</legend>${task}<button id="practice-check" class="audio" ${!ready?'disabled':''}>Vérifier</button></fieldset>${!a.done?'<button id="practice-show">Voir le corrigé</button>':''}<div id="practice-feedback" tabindex="-1" aria-live="polite">${a.done?`<h3>${a.shown?'Corrigé consulté':a.correct?'Réponse correcte':'À reprendre'}</h3>${sentence(q.target)}<p>${esc(q.explanation)}</p>${q.mode==='order'&&q.orders.length>1?`<details><summary>Autre ordre accepté</summary>${q.orders.slice(1).map(o=>block({jp:o.map(i=>p.chunks[i].jp).join(''),kana:o.map(i=>p.chunks[i].kana).join(''),romaji:o.map(i=>p.chunks[i].romaji).join(' '),fr:p.fr})).join('')}</details>`:''}<button id="practice-again">Réessayer cet exercice</button>`:''}</div><div class="practice-navigation"><button id="practice-prev" ${s.index===0?'disabled':''}>← Précédent</button><button id="practice-next" ${s.index===11?'disabled':''}>Suivant →</button><a href="#practice-explanation" id="practice-help">Revoir l’explication ↑</a></div><p role="status">${totals.done} / 12 exercices corrigés · ${totals.correct} réussis sans afficher le corrigé.</p>${totals.done===12?`<aside class="practice-complete"><h3>Les 12 exercices ont été parcourus</h3><p>Vous pouvez reprendre les réponses à corriger ou choisir une autre situation.</p><a href="#atelier/pratique">Choisir une situation →</a></aside>`:''}`;
  const work=document.getElementById('practice-work');
  work.querySelectorAll('[data-chunk]').forEach(b=>b.onclick=()=>{a.answer.push(Number(b.dataset.chunk));renderWork(step);document.querySelector('.practice-answer [data-remove]:last-child')?.focus();});
  work.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{a.answer.splice(Number(b.dataset.remove),1);renderWork(step);document.querySelector('.practice-bank [data-chunk]')?.focus();});
  work.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{a.answer=b.dataset.choice;renderWork(step);document.querySelector('[data-choice][aria-pressed=true]')?.focus();});
  work.querySelectorAll('[data-gap]').forEach(select=>select.onchange=()=>{const i=Number(select.dataset.gap);a.answer[i]=select.value;renderWork(step);document.querySelectorAll('[data-gap]')[i]?.focus();});
  function finish(show){a.done=true;a.shown=show;a.correct=!show&&accepts(q,a.answer);renderWork(step);document.getElementById('practice-feedback').focus();updateProgress(step);}
  document.getElementById('practice-check').onclick=()=>{if(ready&&!a.done)finish(false);};
  document.getElementById('practice-show')?.addEventListener('click',()=>finish(true));
  document.getElementById('practice-again')?.addEventListener('click',()=>{delete s.answers[q.id];renderWork(step);updateProgress(step);focusWork();});
  document.getElementById('practice-prev').onclick=()=>{if(s.index>0){s.index--;renderWork(step);focusWork();}};
  document.getElementById('practice-next').onclick=()=>{if(s.index<11){s.index++;renderWork(step);focusWork();}};
  document.getElementById('practice-help').onclick=e=>{e.preventDefault();const help=document.getElementById('practice-explanation');help.open=true;help.scrollIntoView({block:'start'});help.querySelector('summary').focus();};
 }
 function updateProgress(step){const label=document.querySelector(`.practice-steps a[href="#atelier/pratique/${step.id}"] small`);if(label)label.textContent=stats(step).done+' / 12 corrigés';}
 const api={render,accepts};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ParcoursCommander=api;
})(globalThis);
