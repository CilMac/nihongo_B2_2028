'use strict';
function renderGrammarTable(f){
 const cell=t=>`<div class="demo-cell"><button class="demo-jp" lang="ja" data-speak="${esc(t.kana)}" aria-label="Écouter : ${esc(t.kana)}">${jp(t.jp)}</button>${t.jp!==t.kana?`<span class="kana">${esc(t.kana)}</span>`:''}<span class="romaji">${esc(Romaji.display(t.romaji))}</span><span class="fr">${esc(t.fr)}</span></div>`;
 $('#main').innerHTML=`<div class="grammar-table-detail"><p><a href="#grammaire">← Les fiches de grammaire</a></p>${intro(f.id+' · REPÈRE PRATIQUE',f.titre,f.objectif)}<div class="demo-actions">${star(f.id)}</div>
 <section class="panel"><div class="demo-table-scroll" tabindex="0" role="region" aria-label="Tableau des démonstratifs, défilement horizontal sur petit écran"><table class="demo-table"><caption class="visually-hidden">Les démonstratifs selon la distance et l’usage</caption><thead><tr><th scope="col">Pour désigner</th>${f.tableau.colonnes.map(c=>`<th scope="col">${esc(c)}</th>`).join('')}</tr></thead><tbody>${f.tableau.lignes.map(r=>`<tr><th scope="row">${esc(r.titre)}</th>${r.cellules.map(c=>`<td>${cell(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
 <p class="demo-scroll-hint muted">Faites glisser le tableau pour voir toutes les colonnes.</p><div class="demo-rules">${f.reperes.map(t=>`<p>${esc(t)}</p>`).join('')}</div>
 <details><summary>Quelques nuances utiles</summary>${f.nuances.map(t=>`<p>${esc(t)}</p>`).join('')}</details></section>
 <section class="panel demo-examples"><h2>Dans tes leçons</h2>${f.exemples.map(e=>`<div class="example-block">${block(e,{audio:false})}<p>${sourceLink(e.source)} · ${esc(e.commentaire)}</p></div>`).join('')}</section>
 <section class="panel" id="demo-practice"><h2>À toi de choisir</h2><div id="demo-question"></div></section>
 <details><summary>Sources</summary>${f.sources.map(s=>`<p><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.organisme+' — '+s.section)}</a></p>`).join('')}</details></div>`;
 let index=0;
 const renderQuestion=()=>{
  const q=f.exercices[index],key=f.id+'-table-'+index,chosen=answers.get(key);
  $('#demo-question').innerHTML=`<p class="muted">${index+1} / ${f.exercices.length}</p><p>${esc(q.consigne)}</p><div class="demo-options">${q.options.map(o=>`<button data-demo-answer="${o.id}" aria-pressed="${chosen===o.id}" ${chosen?'disabled':''}><span lang="ja" class="jp">${jp(o.jp)}</span>${o.kana!==o.jp?`<span class="kana">${esc(o.kana)}</span>`:''}<span class="romaji">${esc(Romaji.display(o.romaji))}</span></button>`).join('')}</div><div id="demo-feedback" role="status">${chosen?`<p class="feedback ${chosen===q.bonne_reponse?'':'error'}"><strong>${chosen===q.bonne_reponse?'Bonne réponse.':'À reprendre.'}</strong> ${esc(q.explication)}</p><div class="demo-solutions">${q.options.map(o=>`<p><span lang="ja">${esc(o.jp)}</span><span class="romaji"> · ${esc(Romaji.display(o.romaji))}</span><span class="fr"> : ${esc(o.fr)}</span></p>`).join('')}</div>`:''}</div><div class="pager"><button id="demo-prev" aria-label="Exercice précédent" ${index===0?'disabled':''}>←</button><button id="demo-next">${index===f.exercices.length-1?'Recommencer':'Suivant →'}</button></div>`;
  document.querySelectorAll('[data-demo-answer]').forEach(b=>b.onclick=()=>{answers.set(key,b.dataset.demoAnswer);renderQuestion();});
  $('#demo-prev').onclick=()=>{index--;renderQuestion();};
  $('#demo-next').onclick=()=>{if(index===f.exercices.length-1){f.exercices.forEach((_,i)=>answers.delete(f.id+'-table-'+i));index=0;}else index++;renderQuestion();};
 };
 renderQuestion();
}
