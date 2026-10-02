'use strict';

// Un rendu commun aux fiches, avec une matrice particulière pour les démonstratifs.
function grammarReading(t){
 const same=t.jp.replace(/\s/g,'')===t.kana.replace(/\s/g,'');
 return `<div class="grammar-reading"><button class="kana kana-audio" lang="ja" data-speak="${esc(t.audioKana||t.kana)}" aria-label="Écouter : ${esc(t.kana)}">${esc(t.kana)}<span aria-hidden="true"> ♪</span></button><span class="jp ${same?'same-reading':''}" lang="ja">${jp(t.jp)}</span><span class="romaji">${esc(Romaji.display(t.romaji))}</span></div>`;
}
function grammarReferences(sources){return sources.map(s=>`<p><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.organisme)} · ${esc(s.titre)}</a><br><small>${esc(s.section||'')}</small></p>`).join('');}
function grammarMatrix(f){
 // Garder la présentation de la matrice approuvée par CilMac.
 const cell=t=>`<div class="demo-cell"><button class="demo-jp" lang="ja" data-speak="${esc(t.kana)}" aria-label="Écouter : ${esc(t.kana)}">${jp(t.jp)} ♪</button>${t.jp!==t.kana?`<span class="kana">${esc(t.kana)}</span>`:''}<span class="romaji">${esc(Romaji.display(t.romaji))}</span><span class="fr">${esc(t.fr)}</span></div>`;
 return `<div class="demo-table-scroll" tabindex="0" role="region" aria-label="Tableau des démonstratifs"><table class="demo-table"><caption class="visually-hidden">Les démonstratifs selon la distance et l’usage</caption><thead><tr><th scope="col">Usage</th>${f.tableau.colonnes.map(c=>`<th scope="col">${esc(c)}</th>`).join('')}</tr></thead><tbody>${f.tableau.lignes.map(r=>`<tr><th scope="row">${esc(r.titre)}</th>${r.cellules.map(c=>`<td>${cell(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="demo-scroll-hint muted">Faites glisser le tableau pour voir toutes les colonnes.</p>`;
}
function grammarSummary(f){
 return `<div class="grammar-summary-scroll" tabindex="0" role="region" aria-label="Synthèse : ${esc(f.titre)}"><table class="grammar-summary-table"><caption class="visually-hidden">${esc(f.titre)}</caption><thead><tr><th scope="col">Pour…</th><th scope="col">Forme et lecture</th><th scope="col" class="fr">Sens</th></tr></thead><tbody>${f.synthese.lignes.map(r=>`<tr><th scope="row">${esc(r.usage)}</th><td>${grammarReading(r.exemple)}</td><td class="fr">${esc(r.exemple.fr)}</td></tr>`).join('')}</tbody></table></div>`;
}
function renderGrammar(r){
 if(r.id==='fondements'){renderFoundations(r);return;}
 if(r.id==='recherche'){renderCorpusRecord(r.line);return;}
 if(r.id==='particules'){renderParticlesSummary();return;}
 const f=grammar.find(f=>f.id===r.id);
 if(!f){
  $('#main').innerHTML=intro('OBSERVER · COMPRENDRE · PRATIQUER','La grammaire',grammar.length+' fiches : une synthèse pour se repérer, des exemples et un exercice pour pratiquer.')+`<a class="grammar-overview-link panel" href="#grammaire/fondements"><strong>Les fondements du japonais</strong><span>Particularités de la langue, phrases, noms et particules →</span></a><a class="grammar-overview-link panel" href="#grammaire/particules"><strong>Les particules en un coup d’œil</strong><span>Comparer leurs rôles et retrouver la bonne fiche →</span></a><div class="grid grammar-index">${grammar.map(f=>`<article class="card grammar-card"><div class="card-head"><span class="pill">${esc(f.id)} · ${esc(f.famille)}</span>${star(f.id)}</div><h2>${esc(f.titre)}</h2><p>${esc(f.objectif)}</p><a href="#grammaire/${f.id}">Voir la synthèse →</a></article>`).join('')}</div>`;
  return;
 }
 const particleSheet=grammarParticles.lignes.some(r=>r.fiche===f.id);
 const reperes=f.tableau?f.reperes:f.synthese.reperes;
 $('#main').innerHTML=`<div class="grammar-table-detail grammar-sheet" data-grammar="${f.id}"><nav class="grammar-breadcrumb" aria-label="Retour aux fiches"><a data-context-return href="#grammaire">← Les fiches de grammaire</a>${particleSheet?'<a href="#grammaire/particules">Tableau des particules</a>':''}</nav>${intro(f.id+' · '+esc(f.famille),f.titre,f.objectif)}<div class="demo-actions">${star(f.id)}</div><p class="grammar-introduction">${esc(f.explication)}</p><section class="panel grammar-synthesis">${f.tableau?grammarMatrix(f):grammarSummary(f)}<div class="demo-rules">${reperes.map(t=>`<p>${esc(t)}</p>`).join('')}</div></section>
 <section class="panel grammar-practice"><h2>À vous de jouer</h2><div id="demo-exercise"></div></section>
 <details class="panel grammar-more"><summary>Comprendre et éviter les pièges</summary><div class="grammar-constructions">${f.constructions.map(t=>block(t,{audio:false})).join('')}</div>${f.formation.map(part=>`<h3>${esc(part.texte)}</h3><div class="grammar-form-list">${part.formes.map(t=>`<div>${grammarReading(t)}<p class="fr">${esc(t.fr)}</p></div>`).join('')}</div>`).join('')}<h3>À surveiller</h3><ul>${[...f.pieges,...(f.nuances||[])].map(t=>`<li>${esc(t)}</li>`).join('')}</ul>${f.pour_aller_plus_loin?`<p>${esc(f.pour_aller_plus_loin)}</p>`:''}</details>
 <details class="panel demo-examples"><summary>Exemples dans les leçons · ${f.exemples.length}</summary>${f.exemples.map(e=>`<div class="example-block">${sourceLink(e.source)}${block(e,{audio:false})}<details><summary>Repérer la construction</summary>${block(e.cible,{audio:false})}<p>${esc(e.commentaire)}</p></details></div>`).join('')}</details>
 <details class="panel grammar-resources"><summary>Vocabulaire et références</summary>${f.prerequis.length?`<p>Avant cette fiche : ${f.prerequis.map(id=>`<a href="#grammaire/${id}">${id}</a>`).join(' · ')}</p>`:''}<div class="links">${f.vocabulaire.map(v=>`<a href="#dictionnaire/${v.id}"><span lang="ja">${esc(v.mot)}</span><span class="romaji"> · ${esc(Romaji.display(v.romaji))}</span><span class="fr"> · ${esc(v.fr)}</span></a>`).join('')}</div>${grammarReferences(f.sources)}</details>
 <nav class="pager" aria-label="Parcourir les fiches">${f.ordre>1?`<a href="#grammaire/${grammar[f.ordre-2].id}">← Fiche précédente</a>`:''}${f.ordre<grammar.length?`<a href="#grammaire/${grammar[f.ordre].id}">Fiche suivante →</a>`:''}</nav></div>`;
 renderGrammarPractice(f);
}
function renderGrammarPractice(f){
 const questions=f.exercices||[f.exercice];let index=0;
 function draw(){
  const q=questions[index],key=f.id+':'+index;
  $('#demo-exercise').innerHTML=`${questions.length>1?`<p class="muted">${index+1} / ${questions.length}</p>`:''}<p>${esc(q.consigne)}</p><div class="demo-options grammar-options">${q.options.map(o=>`<div class="choice">${grammarReading(o)}<button class="choose-answer" data-answer="${o.id}" data-demo-answer="${o.id}" aria-pressed="false">Choisir</button></div>`).join('')}</div><div id="feedback"><div id="demo-feedback" role="status"></div></div>${questions.length>1?`<div class="pager"><button id="demo-prev" ${index===0?'disabled':''}>← Précédent</button><button id="demo-next">${index===questions.length-1?'Recommencer':'Suivant →'}</button></div>`:''}`;
  function answer(id){
   answers.set(key,id);
   document.querySelectorAll('[data-answer]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.answer===id));
   const correct=id===q.bonne_reponse,solution=q.options.find(o=>o.id===q.bonne_reponse);
   $('#demo-feedback').innerHTML=`<div class="feedback ${correct?'':'error'}"><strong>${correct?'Bonne réponse !':'La bonne réponse est :'}</strong>${block(solution,{audio:false})}<p>${esc(q.explication)}</p><details class="demo-solutions"><summary>Traduction des autres propositions</summary>${q.options.filter(o=>o.id!==q.bonne_reponse).map(o=>block(o,{audio:false})).join('')}</details></div>`;
  }
  document.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>answer(b.dataset.answer));
  if(answers.has(key))answer(answers.get(key));
  if(questions.length>1){
   $('#demo-prev').onclick=()=>{index--;draw();};
   $('#demo-next').onclick=()=>{if(index===questions.length-1){questions.forEach((_,i)=>answers.delete(f.id+':'+i));index=0;}else index++;draw();};
  }
 }
 draw();
}
function renderParticlesSummary(){
 const t=grammarParticles;
 $('#main').innerHTML=`<div class="grammar-table-detail grammar-sheet"><p><a data-context-return href="#grammaire">← Les fiches de grammaire</a></p>${intro('REPÈRE PRATIQUE',t.titre,t.description)}<section class="panel grammar-synthesis"><div class="grammar-summary-scroll" tabindex="0" role="region" aria-label="Tableau des particules"><table class="grammar-summary-table particles-summary"><caption class="visually-hidden">Usages de base des particules</caption><thead><tr><th scope="col">Particule</th><th scope="col">Rôle</th><th scope="col">Exemple</th></tr></thead><tbody>${t.lignes.map(r=>`<tr><th scope="row"><div class="demo-cell"><button class="demo-jp kana-audio" lang="ja" data-speak="${esc(r.particule.kana)}" aria-label="Écouter : ${esc(r.particule.kana)}">${jp(r.particule.jp)} ♪</button><span class="romaji">${esc(r.particule.romaji)}</span></div></th><td>${esc(r.role)}<a class="particle-sheet-link" href="#grammaire/${r.fiche}">Fiche ${r.fiche} →</a></td><td>${grammarReading(r.exemple)}<p class="fr">${esc(r.exemple.fr)}</p></td></tr>`).join('')}</tbody></table></div><div class="demo-rules">${t.reperes.map(r=>`<p>${esc(r)}</p>`).join('')}</div></section><details class="panel"><summary>Références</summary>${grammarReferences(t.sources)}</details></div>`;
}

function renderFoundations(r){
 $('#main').innerHTML=`<article class="foundations"><nav class="grammar-breadcrumb"><a data-context-return href="#grammaire">← La grammaire</a><a href="#grammaire/fondements/sommaire">Parcours du manuel</a></nav>${intro('LES FONDEMENTS DU JAPONAIS','Comprendre la langue japonaise','Un manuel de référence à lire progressivement. Chapitres 1 à 3 disponibles ; la suite viendra enrichir ce parcours.')}<div class="foundations-text">${Fondements.html}</div></article>`;
 document.querySelectorAll('[data-foundation-example]').forEach(el=>{
  const ref=el.dataset.foundationExample;
  const row=lessons.find(l=>l.Leçon+'-'+l.Ligne===ref);
  if(row)el.innerHTML=block({jp:row.Japonais,kana:row.Kana,romaji:row.Romaji,fr:row.Français,source:ref},{audio:false})+sourceLink(ref);
 });
 if(r.line){const target=document.getElementById(r.line);if(target){if(target.tagName==='DETAILS')target.open=true;target.scrollIntoView({block:'start'});}}
}
