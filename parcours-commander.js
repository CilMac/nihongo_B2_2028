/* Parcours éditorial autonome : aucune injection dans les pools de révision. */
(function(root){
 'use strict';
 let data=null,loading=null,renderVersion=0;
 const sessions=new Map();
 const shuffle=items=>{const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const particleAliases={o:'を',wo:'を',ni:'に',de:'で',to:'と',wa:'は',ha:'は',ga:'が',no:'の','0':'∅','aucune':'∅','rien':'∅','∅':'∅'};
 function normalizeParticle(value){const v=String(value??'').normalize('NFKC').trim().toLowerCase();return particleAliases[v]||v;}
 function accepts(q,answer){
  if(q.mode==='order')return q.orders.some(order=>same(order,answer));
  if(q.mode==='gaps')return Array.isArray(answer)&&same(q.answers,answer.map(normalizeParticle));
  if(q.mode==='amount')return String(answer??'').normalize('NFKC').replace(/[\s,¥円]/g,'')===q.answer;
  return normalizeParticle(answer)===q.answer;
 }
 async function load(){
  if(data)return data;
  if(!loading)loading=fetch('parcours-commander.json?v=20261012-difficulte').then(r=>{if(!r.ok)throw Error('Chargement impossible');return r.json();}).then(d=>{data=d;return d;}).catch(e=>{loading=null;throw e;});
  return loading;
 }
 function sentence(id,translation=true){return block(data.phrases[id],{fr:translation,audio:true});}
 function stimulus(id){const p=data.phrases[id];return `<p class="practice-gap" lang="ja">${esc(p.jp)}</p><p class="kana">${esc(p.kana)}</p><p class="romaji">${esc(Romaji.display(p.romaji))}</p><button type="button" class="practice-listen" data-speak="${esc(p.kana)}">▶ Écouter</button>`;}
 function session(step){if(!sessions.has(step.id))sessions.set(step.id,{index:0,answers:{}});return sessions.get(step.id);}
 function state(step){
  const s=session(step),q=step.exercises[s.index];
  if(!s.answers[q.id]){
   const bank=q.mode==='order'?q.bank.map((_,i)=>i):q.options||[];
   let shuffled=shuffle(bank);
   if(q.mode==='order'&&accepts(q,shuffled))shuffled=shuffled.slice(1).concat(shuffled[0]);
   s.answers[q.id]={answer:q.mode==='order'?[]:q.mode==='gaps'?['','']:null,bank:shuffled,done:false,correct:false,shown:false,aids:false};
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
 function stepHTML(step){return `<section class="panel"><h2>${esc(step.title)}</h2><p>${esc(step.context)}</p><button id="practice-go" type="button">Aller aux 12 exercices ↓</button><details id="practice-explanation"><summary>Comprendre avant de pratiquer</summary>${step.notes.map(t=>`<p>${esc(ExplanationReadings.explain(t))}</p>`).join('')}<p><a href="#grammaire/G30">Retrouver la fiche G30 →</a></p></details><details><summary>Les phrases repères</summary><div class="practice-examples">${step.phrases.map(id=>`<article><small>Repère ${Number(id.slice(1))}</small>${sentence(id)}</article>`).join('')}</div></details><details><summary>Préparer les autres formulations de cette étape</summary><p>Ces formulations complètent les repères pour comprendre les questions et les réponses des exercices.</p><div class="practice-examples">${step.support.map(id=>`<article>${sentence(id)}</article>`).join('')}</div></details><details><summary>Un dialogue accompagné</summary><div class="practice-dialogue">${step.dialogue.map(([role,id])=>`<article><strong>${esc(role)}</strong>${sentence(id)}</article>`).join('')}</div></details></section><section id="practice-work" class="panel" aria-label="Exercices du parcours"></section>`;}
 function chunkButton(chunk,index,selected=false){return `<button type="button" data-${selected?'remove':'chunk'}="${index}"><span lang="ja">${esc(chunk.jp)}</span><span class="kana">${esc(chunk.kana)}</span><span class="romaji">${esc(Romaji.display(chunk.romaji))}</span></button>`;}
 function renderWork(step){
  const s=session(step),q=step.exercises[s.index],a=state(step),p=data.phrases[q.target];
  let task='';
  const input=(index=null)=>`<label>${index===null?(q.mode==='amount'?'Montant en yens':'Votre particule'):'Emplacement '+(index+1)} <input type="text" ${index===null?'id="practice-input"':`data-gap="${index}"`} value="${esc(index===null?a.answer||'':a.answer[index])}" autocomplete="off" autocapitalize="off" spellcheck="false" ${q.mode==='amount'?'inputmode="numeric"':''}></label>`;
  if(q.mode==='order'){
   task=`<p>${esc(q.constraint)}</p><div class="practice-answer" aria-label="Votre phrase">${a.answer.length?a.answer.map((i,pos)=>chunkButton(q.bank[i],pos,true)).join(''):'Votre phrase apparaîtra ici.'}</div><div class="practice-bank">${a.bank.filter(i=>!a.answer.includes(i)).map(i=>chunkButton(q.bank[i],i)).join('')}</div><p>Les éléments non utilisés restent dans la banque. Touchez un élément assemblé pour le retirer.</p>`;
  }else if(['particle','after','gaps'].includes(q.mode)){
   task=`<p class="practice-gap" lang="ja">${esc(q.masked.jp)}</p><div class="practice-reading"><p class="kana">${esc(q.masked.kana)}</p><p class="romaji">${esc(Romaji.display(q.masked.romaji))}</p></div><p>Écrivez en kana ou en romaji (par exemple « no » pour の). Pour aucune particule, écrivez 0.</p>${q.mode==='gaps'?[0,1].map(i=>input(i)).join(''):input()}`;
  }else task=input();
  const isReady=()=>q.mode==='order'?a.answer.length>0:q.mode==='gaps'?a.answer.every(v=>v.trim()):Boolean(String(a.answer||'').trim());
  const ready=isReady();
  const totals=stats(step);
  document.getElementById('practice-work').innerHTML=`<p class="eyebrow">${esc(q.activity)} · ${s.index+1} / 12</p><h2 id="practice-question-title" tabindex="-1">${esc(ExplanationReadings.explain(q.prompt))}</h2>${q.source?`<aside class="practice-stimulus"><strong>Phrase de départ à transformer</strong>${stimulus(q.source)}</aside>`:''}${q.context?(q.mode==='amount'?`<p><button type="button" class="practice-listen" data-speak="${esc(data.phrases[q.context].kana)}">▶ Écouter le montant</button></p><details><summary>Voir le montant en japonais</summary>${stimulus(q.context)}</details>`:`<aside class="practice-stimulus"><strong>Le personnel</strong>${stimulus(q.context)}<details><summary>Traduire la réplique</summary><p>${esc(data.phrases[q.context].fr)}</p></details></aside>`):''}${q.wrong?`<aside class="practice-stimulus"><strong>Réponse à corriger</strong>${stimulus(q.wrong)}</aside>`:''}<button id="practice-aids" type="button" aria-pressed="${a.aids}">${a.aids?'Masquer':'Afficher'} les lectures (kana et romaji)</button><fieldset class="practice-task" ${a.done?'disabled':''}><legend class="muted">À vous</legend>${task}<button id="practice-check" class="audio" ${!ready?'disabled':''}>Vérifier</button></fieldset>${!a.done?'<button id="practice-show">Voir le corrigé</button>':''}<div id="practice-feedback" class="${a.done?(a.shown?'feedback practice-consulted':a.correct?'feedback':'feedback error'):''}" tabindex="-1" aria-live="polite">${a.done?`<h3>${a.shown?'Corrigé consulté':a.correct?'Réponse correcte':'À reprendre'}</h3>${sentence(q.target)}<p>${esc(ExplanationReadings.explain(q.explanation))}</p>${q.mode==='order'&&q.orders.length>1?`<details><summary>Autre ordre accepté</summary>${q.orders.slice(1).map(o=>block({jp:o.map(i=>q.bank[i].jp).join(''),kana:o.map(i=>q.bank[i].kana).join(''),romaji:o.map(i=>q.bank[i].romaji).join(' '),fr:p.fr})).join('')}</details>`:''}<button id="practice-again">Réessayer cet exercice</button>`:''}</div><div class="practice-navigation"><button id="practice-prev" ${s.index===0?'disabled':''}>← Précédent</button><button id="practice-next" ${s.index===11?'disabled':''}>Suivant →</button><a href="#practice-explanation" id="practice-help">Revoir l’explication ↑</a></div><p role="status">${totals.done} / 12 exercices corrigés · ${totals.correct} réussis sans afficher le corrigé (aides autorisées).</p>${totals.done===12?`<aside class="practice-complete"><h3>Les 12 exercices ont été parcourus</h3><p>Vous pouvez reprendre les réponses à corriger ou choisir une autre situation.</p><a href="#atelier/pratique">Choisir une situation →</a></aside>`:''}`;
  const work=document.getElementById('practice-work');
  work.querySelectorAll('[data-chunk]').forEach(b=>b.onclick=()=>{a.answer.push(Number(b.dataset.chunk));renderWork(step);document.querySelector('.practice-answer [data-remove]:last-child')?.focus();});
  work.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{a.answer.splice(Number(b.dataset.remove),1);renderWork(step);document.querySelector('.practice-bank [data-chunk]')?.focus();});
  function changed(){document.getElementById('practice-check').disabled=!isReady();}
  work.querySelectorAll('[data-gap]').forEach(input=>input.oninput=()=>{a.answer[Number(input.dataset.gap)]=input.value;changed();});
  const field=document.getElementById('practice-input');
  if(field)field.oninput=()=>{a.answer=field.value;changed();};
  work.classList.toggle('practice-no-readings',!a.aids&&!a.done);
  document.getElementById('practice-aids').onclick=()=>{a.aids=!a.aids;renderWork(step);document.getElementById('practice-aids').focus();};
  function finish(show){a.done=true;a.shown=show;a.correct=!show&&accepts(q,a.answer);renderWork(step);document.getElementById('practice-feedback').focus();updateProgress(step);}
  document.getElementById('practice-check').onclick=()=>{if(isReady()&&!a.done)finish(false);};
  document.getElementById('practice-show')?.addEventListener('click',()=>finish(true));
  document.getElementById('practice-again')?.addEventListener('click',()=>{delete s.answers[q.id];renderWork(step);updateProgress(step);focusWork();});
  document.getElementById('practice-prev').onclick=()=>{if(s.index>0){s.index--;renderWork(step);focusWork();}};
  document.getElementById('practice-next').onclick=()=>{if(s.index<11){s.index++;renderWork(step);focusWork();}};
  document.getElementById('practice-help').onclick=e=>{e.preventDefault();const help=document.getElementById('practice-explanation');help.open=true;help.scrollIntoView({block:'start'});help.querySelector('summary').focus();};
 }
 function updateProgress(step){const label=document.querySelector(`.practice-steps a[href="#atelier/pratique/${step.id}"] small`);if(label)label.textContent=stats(step).done+' / 12 corrigés';}
 const api={render,accepts};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ParcoursCommander=api;
})(globalThis);
