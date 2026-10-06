'use strict';
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize = Romaji.searchKey;
const defaults={kana:true,romaji:true,fr:true,font:'serif',size:28,dictionaryCompact:true,rate:.86,gap:2000,voice:'',audioMode:'synthetic',lesson:'N1'};
let settings={...defaults}, favorites=new Set(), lessons=[], vocab=[], grammar=[], grammarParticles=null, lessonIds=[];
try{settings={...defaults,...JSON.parse(localStorage.getItem('nihongo-settings')||'{}')};favorites=new Set(JSON.parse(localStorage.getItem('nihongo-favorites')||'[]'));}catch{}
let audioRun=0,audioTimer,voices=[],currentUtterance;const speech=window.speechSynthesis;
let search='',onlyFavorites=false,page=0,dictionaryCategory='';const pageSize=24;const answers=new Map();
let decorticage, decorticageData;
let lessonCompact=false;
let dictionaryReturn=null, analysisReturn=null;
let favoritesRevision=0;
const vocabSearchKeys=new WeakMap();
function vocabularySearchKey(word){
 if(!vocabSearchKeys.has(word))vocabSearchKeys.set(word,normalize([word.mot,word.kana,word.romaji,word.fr,word.forme_base].join(' ')));
 return vocabSearchKeys.get(word);
}
function save(){try{localStorage.setItem('nihongo-settings',JSON.stringify(settings));localStorage.setItem('nihongo-favorites',JSON.stringify([...favorites]));}catch{$('#audio-status').textContent='Le stockage local est indisponible : vos réglages restent actifs pour cette visite.';}}
function applySettings(){for(const k of ['kana','romaji','fr']){document.body.classList.toggle('hide-'+k,!settings[k]);$('#show-'+k).checked=!!settings[k];}document.body.classList.toggle('rounded',settings.font==='rounded');document.documentElement.style.setProperty('--jp-size',settings.size+'px');for(const k of ['font','size','rate','gap'])$('#'+k).value=settings[k];$('#size-value').textContent=settings.size+' px';$('#rate-value').textContent=Number(settings.rate).toFixed(2)+' ×';}
function updateVoices(){voices=speech?speech.getVoices().filter(v=>/^ja(?:-|_)/i.test(v.lang)||v.lang==='ja'):[];$('#voice').innerHTML='<option value="">Automatique · préférence japonaise</option>'+voices.map(v=>`<option value="${esc(v.voiceURI)}">${esc(v.name)}</option>`).join('');$('#voice').value=settings.voice;$('#voice').disabled=!voices.length;if(!speech)$('#audio-status').textContent='La synthèse vocale n’est pas disponible dans ce navigateur.';}
function audioButton(text,ref=''){return `<button class="audio" data-speak="${esc(text)}" data-audio-ref="${esc(ref)}" aria-label="Écouter en japonais">▶ Écouter</button>`;}
function star(id){return `<button class="favorite" data-favorite="${esc(id)}" aria-pressed="${favorites.has(id)}" title="${favorites.has(id)?'Retirer des':'Ajouter aux'} favoris" aria-label="${favorites.has(id)?'Retirer des':'Ajouter aux'} favoris">${favorites.has(id)?'★':'☆'}</button>`;}
function jp(text){return esc(text).replace(/\p{Script=Han}+/gu,'<span class="kanji">$&</span>');}
function block(t,{audio=true,fr=true,repeatJapanese=false}={}) {
 const audioRef=sentenceAudioRef(t);
 const sameText = String(t.jp).normalize('NFC').replace(/\s/g, '') === String(t.kana).normalize('NFC').replace(/\s/g, '');
 const japanese = sameText&&!repeatJapanese ? `<span class="kana-idem" lang="fr" title="Identique au texte kana">---</span><span class="jp-fallback">${jp(t.jp)}</span>` : jp(t.jp);
 return `<div class="language-block"><button type="button" class="kana kana-audio" lang="ja" data-speak="${esc(t.audioKana || t.kana)}" data-audio-ref="${esc(audioRef)}" aria-label="Écouter : ${esc(t.kana)}">${esc(t.kana)}<span class="sound-note" aria-hidden="true"> ♪</span></button><p class="jp" lang="ja">${japanese}</p><p class="romaji">${esc(Romaji.display(t.romaji))}</p>${fr?`<p class="fr">${esc(t.fr)}</p>`:''}${audio?audioButton(t.kana,audioRef):''}</div>`;
}
function intro(k,title,description){return `<div class="intro"><div class="eyebrow">${k}</div><div class="intro-heading"><h1>${esc(title)}</h1><button type="button" class="quick-guide-link" data-open-quick-guide aria-haspopup="dialog" aria-controls="quick-guide">Comment utiliser le site</button></div><p>${esc(description)}</p></div>`;}
function route(){
 const [tab='lecons',id,line]=location.hash.slice(1).split('/');
 let decoded='';
 try{decoded=decodeURIComponent(id||'');}catch{/* Une adresse tronquée revient à la vue par défaut du module. */}
 return {tab:['lecons','dictionnaire','grammaire','atelier','guide'].includes(tab)?tab:'lecons',id:decoded,line};
}
function render(){window.closeNavigationCommands?.();stopAudio();const r=route();document.querySelectorAll('[data-tab]').forEach(x=>{if(x.dataset.tab===r.tab)x.setAttribute('aria-current','page');else x.removeAttribute('aria-current');});if(r.tab==='lecons')renderLessons(r);else if(r.tab==='dictionnaire')renderDictionary(r);else if(r.tab==='atelier')renderAtelier(r);else if(r.tab==='guide')renderGuide(r);else renderGrammar(r);renderAtelierReturn(r);renderDictionaryReturn(r);renderAnalysisReturn(r);window.updateNavigationTab?.();}
function renderLessons(r){const id=lessonIds.includes(r.id)?r.id:lessonIds.includes(settings.lesson)?settings.lesson:lessonIds[0];settings.lesson=id;save();const rows=lessons.filter(x=>x.Leçon===id);const index=lessonIds.indexOf(id);const related=LessonLinks.find(rows,grammar);$('#main').innerHTML=intro('ÉCOUTER · LIRE · RÉPÉTER','Leçons','Retrouvez les dialogues, une phrase après l’autre.')+`<div class="toolbar"><div class="lesson-selector"><button data-lesson="${lessonIds[index-1]||''}" ${index===0?'disabled':''} aria-label="Leçon précédente">←</button><label for="lesson-select">Leçon</label><select id="lesson-select">${lessonIds.map(n=>`<option value="${n}" ${n===id?'selected':''}>${esc(lessonLabel(n))}</option>`).join('')}</select><button data-lesson="${lessonIds[index+1]||''}" ${index===lessonIds.length-1?'disabled':''} aria-label="Leçon suivante">→</button></div><button class="audio" id="play-lesson">▶ Écouter la leçon</button><span class="muted">${rows.length} phrases</span><label for="lesson-display">Affichage <select id="lesson-display"><option value="normal" ${!lessonCompact?'selected':''}>Normal</option><option value="compact" ${lessonCompact?'selected':''}>Compact · sans décorticage</option></select></label><nav class="lesson-shortcuts" aria-label="Pratiquer cette leçon"><a href="#dictionnaire/${id}" aria-label="Vocabulaire de la leçon ${Number(id.slice(1))}">Vocabulaire →</a><a href="#atelier/${id}/lesson" aria-label="M’entraîner sur la leçon ${Number(id.slice(1))}">M’entraîner →</a></nav></div><div class="lesson-layout${lessonCompact?' lesson-compact':''}"><div class="stack">${rows.map(l=>`<article class="card" id="${l.Ligne}"><div class="card-head"><span class="number">${id} · ${l.Ligne}</span><div class="card-actions">${star(id+'-'+l.Ligne)}${audioButton(l.Kana,id+'-'+l.Ligne)}</div></div>${block({source:id+'-'+l.Ligne,jp:l.Japonais,kana:l.Kana,romaji:l.Romaji,fr:l.Français},{audio:false})}${decorticageEntry(l)}</article>`).join('')}</div><aside class="panel aside" tabindex="0" aria-label="Autour de la leçon"><div class="eyebrow">AUTOUR DE LA LEÇON</div><h3>Pratiquer</h3><a href="#dictionnaire/${id}">Voir le vocabulaire de cette leçon →</a><a href="#atelier/${id}/lesson">M’entraîner sur cette leçon →</a><a href="#atelier/${id}/through">Réviser jusqu’à cette leçon →</a><h3>Grammaire à retrouver</h3>${lessonGrammarLinks(related)}<p class="muted">Écoutez, puis répétez à voix haute. La pause entre les phrases se règle dans les réglages.</p></aside></div><div id="extra-audio"></div>`;renderExtraAudio();$('#lesson-display').onchange=e=>{lessonCompact=e.target.value==='compact';$('.lesson-layout').classList.toggle('lesson-compact',lessonCompact);};$('#lesson-select').onchange=e=>location.hash='lecons/'+e.target.value;$('#play-lesson').onclick=()=>speak(rows.map(l=>({text:l.Kana,ref:l.Leçon+'-'+l.Ligne})));if(r.line){const el=document.getElementById(r.line);el?.classList.add('highlight');el?.scrollIntoView({block:'center'});}}
function sourceLink(source){const m=source?.match(/(N\d+)-(S\d+)/);return m?`<a href="#lecons/${m[1]}/${m[2]}">${esc(m[1].replace('N','Leçon '))} · ${m[2]}</a>`:esc(source);}
function baseForm(v){
 const base = vocab.find(entry => entry.mot === v.forme_base);
 return base ? `<details><summary>Forme de dictionnaire</summary>${block({jp:base.mot,kana:base.kana,romaji:base.romaji,fr:base.fr})}</details>` : '';
}
function dictionaryMain(v){
 const same=v.mot.replace(/\s/g,'')===v.kana.replace(/\s/g,'');
 let html=block({jp:v.mot,kana:v.kana,romaji:v.romaji,fr:v.fr},{audio:false,repeatJapanese:true}).replace('language-block','language-block dictionary-main');
 if(same)html=html.replace('<p class="jp"','<p class="jp dictionary-identical"');
 return html;
}
function vocabCard(v){return `<article class="card dictionary-card" id="${v.id}"><div class="card-head"><span class="number">${esc(v.type||'VOCABULAIRE')}</span><div class="card-actions">${star(v.id)}${audioButton(v.kana)}</div></div>${dictionaryMain(v)}${v.forme_base?baseForm(v):''}${v.note?`<p class="note">${esc(v.note)}</p>`:''}<details><summary>Exemple dans la leçon</summary><div data-vocab-example="0">${block({...v.exemple,source:v.source})}<p class="muted">${sourceLink(v.source)}</p></div>${(v.exemples_supplementaires||[]).map((e,i)=>`<div data-vocab-example="${i+1}" class="example-block">${block(e)}<p class="muted">${sourceLink(e.source)}</p></div>`).join('')}</details></article>`;}
function renderDictionary(r){const selected=r.id.startsWith('vocab-')?vocab.find(v=>v.id===r.id):null;const filter=lessonIds.includes(r.id)?r.id:'';
 const range=r.id==='plage';
 const bounds=(r.line||'').split('-').filter(n=>lessonIds.includes(n));
 const from=range?(bounds[0]||lessonIds[0]):filter;
 const to=range?(bounds[1]||lessonIds[lessonIds.length-1]):filter;
 const low=Math.min(Number(from?.slice(1)),Number(to?.slice(1)));
 const high=Math.max(Number(from?.slice(1)),Number(to?.slice(1)));
 const categories=[...new Set(vocab.map(v=>v.categorie_grammaticale||'À préciser'))].sort((a,b)=>a.localeCompare(b,'fr'));
 const options=value=>lessonIds.map(n=>`<option value="${n}" ${n===value?'selected':''}>Leçon ${n.slice(1)}</option>`).join('');
 $('#main').innerHTML=intro('COMPRENDRE · RETROUVER','Le dictionnaire','Le sens des mots, leurs formes et leurs exemples en contexte.')+`<div class="toolbar dictionary-filters"><input id="vocab-search" type="search" placeholder="Un mot en japonais, romaji ou français…" aria-label="Rechercher dans le dictionnaire" value="${esc(search)}"><select id="vocab-lesson" aria-label="Filtrer par leçon"><option value="">Toutes les leçons</option><option value="plage" ${range?'selected':''}>Plage de leçons…</option>${lessonIds.map(n=>`<option value="${n}" ${filter===n?'selected':''}>${esc(lessonLabel(n))}</option>`).join('')}</select><span class="dictionary-range" ${range?'':'hidden'}><label>De <select id="vocab-from" aria-label="Première leçon">${options('N'+low)}</select></label><label>à <select id="vocab-to" aria-label="Dernière leçon">${options('N'+high)}</select></label></span><select id="vocab-category" aria-label="Catégorie grammaticale"><option value="">Toutes les catégories</option>${categories.map(c=>`<option value="${esc(c)}" ${dictionaryCategory===c?'selected':''}>${esc(c[0].toUpperCase()+c.slice(1))}</option>`).join('')}</select><label><input type="checkbox" id="favorites-only" ${onlyFavorites?'checked':''}> Mes favoris</label></div><div class="dictionary-view-bar"><p class="muted" id="result-count" role="status"></p><button id="dictionary-compact" role="switch" aria-checked="${settings.dictionaryCompact}" aria-controls="vocab-results">Mode compressé <span aria-hidden="true">${settings.dictionaryCompact?'ON':'OFF'}</span></button></div><div id="vocab-results" class="grid ${settings.dictionaryCompact?'dictionary-compact':''}"></div><div id="pagination"></div>`;function results(){const query=normalize(search);let list=selected?[selected]:vocab.filter(v=>(!(filter||range)||[v.source,...(v.exemples_supplementaires||[]).map(e=>e.source)].some(s=>{const n=Number(/\bN(\d+)-/.exec(s||'')?.[1]);return n>=low&&n<=high;}))&&(!dictionaryCategory||(v.categorie_grammaticale||'À préciser')===dictionaryCategory)&&(!onlyFavorites||favorites.has(v.id))&&(!query||vocabularySearchKey(v).includes(query)));const max=Math.max(0,Math.ceil(list.length/pageSize)-1);page=Math.min(page,max);$('#result-count').textContent=`${list.length} mot${list.length>1?'s':''}${selected?' · accès depuis une fiche':''}`;$('#vocab-results').innerHTML=list.length?list.slice(page*pageSize,(page+1)*pageSize).map(vocabCard).join(''):'<p class="panel empty">Aucun mot trouvé. Essayez un autre terme ou retirez un filtre.</p>';$('#pagination').innerHTML=selected?'<a data-context-return href="#dictionnaire">← Tout le dictionnaire</a>':`<div class="pager"><button id="prev-page" ${page===0?'disabled':''}>← Précédent</button><span>${page+1} / ${max+1}</span><button id="next-page" ${page===max?'disabled':''}>Suivant →</button></div>`;if(!selected){$('#prev-page').onclick=()=>{page--;results();$('#vocab-search').scrollIntoView();};$('#next-page').onclick=()=>{page++;results();$('#vocab-search').scrollIntoView();};}}$('#vocab-search').oninput=e=>{search=e.target.value;page=0;if(selected){location.hash='dictionnaire';}else results();};$('#favorites-only').onchange=e=>{onlyFavorites=e.target.checked;page=0;if(selected)location.hash='dictionnaire';else results();};$('#vocab-lesson').onchange=e=>{page=0;location.hash=e.target.value==='plage'?'dictionnaire/plage/'+lessonIds[0]+'-'+lessonIds[lessonIds.length-1]:'dictionnaire/'+e.target.value;};$('#vocab-category').onchange=e=>{dictionaryCategory=e.target.value;page=0;if(selected)location.hash='dictionnaire';else results();};
 for(const id of ['vocab-from','vocab-to'])$('#'+id).onchange=()=>{
  let first=$('#vocab-from').value,last=$('#vocab-to').value;
  if(Number(first.slice(1))>Number(last.slice(1))){if(id==='vocab-from')last=first;else first=last;}
  page=0;location.hash='dictionnaire/plage/'+first+'-'+last;
 };
 $('#vocab-results').refreshResults=results;
 $('#dictionary-compact').onclick=()=>{settings.dictionaryCompact=!settings.dictionaryCompact;save();$('#vocab-results').classList.toggle('dictionary-compact',settings.dictionaryCompact);$('#dictionary-compact').setAttribute('aria-checked',settings.dictionaryCompact);$('#dictionary-compact span').textContent=settings.dictionaryCompact?'ON':'OFF';};results();}
$('#settings-toggle').onclick=()=>{const open=$('#settings').hidden;$('#settings').hidden=!open;$('#settings-toggle').setAttribute('aria-expanded',open);};for(const k of ['kana','romaji','fr'])$('#show-'+k).onchange=e=>{settings[k]=e.target.checked;applySettings();save();};for(const k of ['font','size','rate','gap'])$('#'+k).oninput=e=>{settings[k]=['size','rate','gap'].includes(k)?Number(e.target.value):e.target.value;applySettings();save();};$('#voice').onchange=e=>{stopAudio();settings.voice=e.target.value;save();};$('#audio-mode').onchange=e=>{stopAudio();settings.audioMode=e.target.value;save();updateAudioMode();};$('#stop-audio').onclick=()=>stopAudio('Lecture arrêtée.');document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.speak)speak([{text:b.dataset.speak,ref:b.dataset.audioRef}]);if(b.dataset.lesson)location.hash='lecons/'+b.dataset.lesson;if(b.dataset.favorite){const id=b.dataset.favorite;favorites.has(id)?favorites.delete(id):favorites.add(id);favoritesRevision++;save();document.querySelectorAll('[data-favorite]').forEach(el=>{if(el.dataset.favorite===id){const pressed=favorites.has(id),label=(pressed?'Retirer des':'Ajouter aux')+' favoris';el.textContent=pressed?'★':'☆';el.setAttribute('aria-pressed',String(pressed));el.setAttribute('aria-label',label);el.title=label;}});renderFavorites();if(onlyFavorites&&route().tab==='dictionnaire')$('#vocab-results')?.refreshResults?.();}});window.addEventListener('hashchange',event=>{
 if(handleContextNavigation(event))return;
 const restore=dictionaryReturn && location.hash===dictionaryReturn.origin && new URL(event.oldURL).hash===dictionaryReturn.destination;
 page=restore?dictionaryReturn.page:0;
 if(restore){search=dictionaryReturn.search;onlyFavorites=dictionaryReturn.onlyFavorites;dictionaryCategory=dictionaryReturn.dictionaryCategory||'';}
 render();if(!route().line)window.scrollTo(0,0);
 if(analysisReturn && location.hash===analysisReturn.origin && new URL(event.oldURL).hash===analysisReturn.destination)restoreAnalysisReturn();
 if(restore){const saved=dictionaryReturn;
  for(const item of saved.cards){const card=document.getElementById(item.id);if(card)card.querySelectorAll('details').forEach((d,i)=>d.open=item.open[i]);}
  requestAnimationFrame(()=>{if(location.hash!==saved.origin)return;document.getElementById(saved.cardId)?.querySelector('a[href="'+saved.destination+'"]')?.focus({preventScroll:true});window.scrollTo(0,saved.scrollY);});
 }
});window.addEventListener('pagehide',()=>stopAudio());speech?.addEventListener('voiceschanged',updateVoices);applySettings();updateVoices();
Promise.all(['leconsJap.json','dicoLeconsJap.json','grammaireLeconsJap.json?v=20260929-ni','decorticage.json'].map(async url=>{const r=await fetch(url,{cache:'no-cache'});if(!r.ok)throw new Error(url);return r.json();})).then(([l,v,g,d])=>{decorticageData=d;decorticage=Decorticage.create(v,d);lessons=l;vocab=v;grammar=g.fiches;grammarParticles=g.tableau_particules;lessonIds=[...new Set(l.map(x=>x.Leçon))].sort((a,b)=>Number(a.slice(1))-Number(b.slice(1)));render();renderFavorites();initLocalAudio();}).catch(()=>{$('#main').innerHTML='<div class="panel"><h1>Le carnet n’a pas pu se charger</h1><p>Ouvrez le site depuis son adresse Web ou avec le serveur local indiqué dans le fichier README, puis réessayez.</p><button onclick="location.reload()">Réessayer</button></div>';});

// Retrouver les favoris de tous les modules sans quitter la lecture en cours.
let guideFavoritesPending=false;
function renderFavorites() {
 const entries = [...favorites].map(id => {
  if(id.startsWith('corpus:')){let title=id.slice(7);try{title=JSON.parse(localStorage.getItem('nihongo-search-favorite-labels')||'{}')[title]||title;}catch{}return `<button type="button" data-corpus-favorite="${esc(id.slice(7))}">Recherche · ${esc(title)}</button>`;}
  const word = vocab.find(v => v.id === id);
  if (word) return `<a href="#dictionnaire/${word.id}">Mot : <span class="romaji">${esc(Romaji.display(word.romaji))} · </span><span class="fr">${esc(word.fr)}</span></a>`;
  const card = grammar.find(f => f.id === id);
  if (card) return `<a href="#grammaire/${id}">${id} · ${esc(card.titre)}</a>`;
  const [lesson,line] = id.split('-');
  const phrase = lessons.find(l => l.Leçon === lesson && l.Ligne === line);
  if (phrase) return `<a href="#lecons/${lesson}/${line}">${lesson} · ${line}<span class="romaji"> · ${esc(Romaji.display(phrase.Romaji))}</span><span class="fr"> · ${esc(phrase.Français)}</span></a>`;
  return '';
 }).filter(Boolean);
 const guideIds=[...favorites].filter(id=>id.startsWith('guidefav:'));
 const guideSection=guideIds.length?'<section class="guide-saved"><h3>Guide</h3>'+guideIds.map(id=>{
  const item=guideFavoriteEntries.get(id);
  return item?`<div class="guide-saved-row">${star(id)}<a href="#guide/${item.chapter}/${item.target}"><strong>${esc(item.type+' · '+item.title)}</strong><span>${esc(item.text.slice(0,200))}${item.text.length>200?'…':''}</span></a></div>`:`<div class="guide-saved-row">${star(id)}<p class="muted">${guideData?'Cet élément du Guide n’est plus disponible.':'Chargement du favori du Guide…'}</p></div>`;
 }).join('')+'</section>':'';
 $('#saved-list').innerHTML = entries.join('')+guideSection||'<p class="muted">Touchez une étoile pour retrouver ici un mot, une phrase, une fiche ou un élément du Guide.</p>';
 if(guideIds.length&&!guideData&&!guideFavoritesPending){guideFavoritesPending=true;loadGuide().then(()=>{guideFavoritesPending=false;renderFavorites();}).catch(()=>{guideFavoritesPending=false;if(!$('#saved-list .guide-saved'))return;$('#saved-list .guide-saved').innerHTML='<h3>Guide</h3><p>Le Guide n’a pas pu être chargé. Vos favoris sont conservés.</p><button id="guide-favorites-retry">Réessayer</button>';$('#guide-favorites-retry').onclick=renderFavorites;});}
}
$('#saved-toggle').onclick = () => {
 const open = $('#saved').hidden;
 $('#saved').hidden = !open;
 $('#saved-toggle').setAttribute('aria-expanded', open);
};
$('#saved-list').addEventListener('click', e => {
 if (e.target.closest('a')) {$('#saved').hidden=true;$('#saved-toggle').setAttribute('aria-expanded',false);}
});


// Analyse à la demande : règles générales et exemples annotés.
function decorticageEntry(row) {
 const id = `${row.Leçon}-${row.Ligne}`;
 if (!decorticage || row.Ligne === 'S00') return '';
 return `<details class="sentence-analysis" data-analysis="${id}"><summary>Décortiquer cette phrase</summary><div class="analysis-content"></div></details>`;
}
// Ajouter les repères uniquement quand les lectures correspondent au texte source.
function analysisBracketedRomaji(row,result) {
 return Romaji.bracketAnalysis(row.Romaji,result.segments);
}

function renderSimpleDecorticage(segments) {
 return `<table class="analysis-simple"><caption class="visually-hidden">Décorticage de la phrase</caption>
 <thead><tr><th scope="col">Élément</th><th scope="col" class="analysis-reading">Lecture</th><th scope="col" class="fr">Sens et rôle</th></tr></thead>
 <tbody>${segments.map(part=>{
  const role=part.form || (part.explanation || '').split(/(?<=[.!?])\s/)[0];
  const extra=part.explanation && part.explanation!==role ? (part.explanation.startsWith(role) && role ? part.explanation.slice(role.length).trim() : part.explanation) : '';
  const base=part.baseWord;
  const hasBase=base && base.mot.replace(/\s/g,'')!==part.jp.replace(/\s/g,'');
  const complement=extra || hasBase;
  return `<tr><td class="jp" lang="ja">${jp(part.jp)}</td>
  <td class="analysis-reading"><button class="kana kana-audio" lang="ja" data-speak="${esc(part.audioKana || part.kana)}" aria-label="Écouter : ${esc(part.kana)}">${esc(part.kana || 'Lecture à préciser')}<span aria-hidden="true"> ♪</span></button><span class="romaji">${esc(Romaji.display(part.romaji || 'Lecture à préciser'))}</span></td>
  <td class="analysis-meaning"><div class="fr"><span>${esc(part.fr)}</span>${role && role!==part.fr ? `<span class="analysis-simple-role">${esc(role)}</span>` : ''}</div>
  ${complement ? `<details class="analysis-extra"><summary aria-label="Complément pour ${esc(part.jp)}" title="En savoir plus"><span aria-hidden="true">⌄</span></summary>
  ${extra ? `<p class="fr">${esc(extra)}</p>` : ''}
  ${hasBase ? `<p class="muted">Forme de dictionnaire</p>${block({jp:base.mot,kana:base.kana,romaji:base.romaji,fr:base.fr},{audio:false})}` : ''}
  </details>` : ''}
  ${part.wordId ? `<a class="analysis-word-link dictionary-icon" href="#dictionnaire/${esc(part.wordId)}" aria-label="Voir ${esc(part.jp)} dans le dictionnaire" title="Voir dans le dictionnaire"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 3h15v18H6a2 2 0 0 1-2-2V3Zm0 14h15M8 3v14"/><path d="M11 7h5m-5 4h5"/></svg></a>` : ''}</td></tr>`;
 }).join('')}</tbody></table>`;
}
function renderDecorticage(row) {
 const result = decorticage.analyze(row);
 if (!result || result.stale) return '<p>Cette phrase a changé : son décorticage doit être revérifié.</p>';
 const labels = {rule:'Règle réutilisable',dictionary:'Dictionnaire',annotation:'Précision de contexte',unknown:'À compléter'};
 return `<div class="analysis-heading"><span class="analysis-state">${result.partial ? 'Décorticage partiel' : (result.literalOrigin === 'automatic' ? 'Construction reconnue' : 'Décorticage de l’échantillon')}</span></div>
 ${result.structure ? `<p>${esc(result.structure)}</p>` : ''}
 ${result.literal ? `<div class="analysis-literal"><h3>Dans l’ordre japonais</h3><p class="romaji analysis-romaji">${esc(analysisBracketedRomaji(row,result))}</p><p class="literal-gloss fr"><em>(${esc(result.literal)})</em></p><p class="muted">Lecture indicative dans l’ordre japonais ; les crochets précisent le rôle ou la forme.</p></div>` : ''}
 ${renderSimpleDecorticage(result.segments)}
 ${result.note ? `<details class="analysis-context"><summary>Précision de contexte</summary><p class="fr">${esc(result.note)}</p></details>` : ''}
 <details class="analysis-method"><summary>Sources et méthode</summary>
 <p>Le calcul se fait dans votre navigateur, sans appel à une IA. La traduction vient de la leçon. ${result.literalOrigin === 'automatic' ? 'La lecture dans l’ordre japonais est assemblée automatiquement ; certains sens et rôles demandent encore le contexte.' : 'La lecture dans l’ordre japonais a été préparée pour cet exemple.'}</p>
 <ul>${Object.entries(result.counts).filter(([,n])=>n).map(([key,n])=>`<li>${labels[key]} : ${n} groupe${n>1?'s':''}.</li>`).join('')}</ul>
 <p>Construction : ${result.structureOrigin === 'rule' ? 'modèle reconnu par une règle.' : result.structureOrigin === 'annotation' ? 'annotation préparée pour cette phrase.' : 'non couverte.'} Reconnaître les mots ne garantit pas que toute la construction soit comprise.</p>
 ${decorticageData.sources.map(source=>`<p><a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.title)}</a></p>`).join('')}</details>`;
}
document.addEventListener('toggle', event => {
 const panel = event.target;
 if (!panel.matches?.('[data-analysis]') || !panel.open || panel.dataset.loaded) return;
 const row = lessons.find(row => `${row.Leçon}-${row.Ligne}` === panel.dataset.analysis);
 if (!row) return;
 panel.querySelector('.analysis-content').innerHTML = renderDecorticage(row);
 panel.dataset.loaded = 'true';
}, true);

function lessonGrammarLinks(related){
 const link=item=>`<div class="lesson-grammar-link"><a href="#grammaire/${item.card.id}">${esc(item.card.titre)} →</a>${item.row?`<a class="grammar-evidence" href="#lecons/${item.row.Leçon}/${item.row.Ligne}">Repérer dans la phrase ${item.row.Ligne.slice(1).replace(/^0/,'')} ↗</a>`:''}</div>`;
 if(!related.length)return '<p class="muted">Aucune correspondance repérée parmi les fiches actuelles.</p><a href="#grammaire">Parcourir les fiches de grammaire →</a>';
 return related.slice(0,4).map(link).join('')+(related.length>4?`<details><summary>${related.length-4} autres points de grammaire</summary>${related.slice(4).map(link).join('')}</details>`:'');
}

function lessonLabel(id){
 const title=lessons.find(row=>row.Leçon===id&&row.Ligne==='S00')?.Français;
 return `Leçon ${id.slice(1)}${title?' — '+title:''}`;
}

// Aller-retour entre un exemple du dictionnaire et sa phrase source.
document.addEventListener('click',event=>{
 const link=event.target.closest('.dictionary-card a[href^="#lecons/"]');
 if(!link || event.button!==0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)return;
 atelierListReturn=null;
 dictionaryReturn={origin:location.hash,destination:link.getAttribute('href'),search,onlyFavorites,dictionaryCategory,page,scrollY:window.scrollY,cardId:link.closest('.dictionary-card').id,
  cards:[...document.querySelectorAll('.dictionary-card')].map(c=>({id:c.id,open:[...c.querySelectorAll('details')].map(d=>d.open)}))};
});
function renderDictionaryReturn(r){
 if(!dictionaryReturn || r.tab!=='lecons' || location.hash!==dictionaryReturn.destination)return;
 const card=document.getElementById(r.line);if(!card)return;
 const back=document.createElement('a');back.href=dictionaryReturn.origin;back.className='atelier-return';back.textContent='← Retour au dictionnaire';
 card.prepend(back);card.scrollIntoView({block:'start'});
}

document.addEventListener('click',event=>{
 const link=event.target.closest('.analysis-word-link');
 if(!link || event.button!==0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)return;
 analysisReturn={origin:location.hash,destination:link.getAttribute('href'),scrollY:scrollY,
  panelId:link.closest('[data-analysis]').dataset.analysis,
  panels:[...document.querySelectorAll('[data-analysis][open]')].map(panel=>({id:panel.dataset.analysis,open:[...panel.querySelectorAll('details')].map(d=>d.open)}))};
});
function renderAnalysisReturn(r){
 if(!analysisReturn || r.tab!=='dictionnaire' || location.hash!==analysisReturn.destination)return;
 const card=document.querySelector('.dictionary-card');if(!card)return;
 const back=document.createElement('a');back.href=analysisReturn.origin;back.className='atelier-return';back.textContent='← Retour au décorticage';card.prepend(back);
}
function restoreAnalysisReturn(){
 const saved=analysisReturn;
 for(const item of saved.panels){
  const panel=document.querySelector('[data-analysis="'+item.id+'"]');
  const row=lessons.find(r=>r.Leçon+'-'+r.Ligne===item.id);if(!panel||!row)continue;
  panel.querySelector('.analysis-content').innerHTML=renderDecorticage(row);panel.dataset.loaded='true';panel.open=true;
  panel.querySelectorAll('details').forEach((d,i)=>d.open=!!item.open[i]);
 }
 requestAnimationFrame(()=>{if(location.hash!==saved.origin)return;
  document.querySelector('[data-analysis="'+saved.panelId+'"] a[href="'+saved.destination+'"]')?.focus({preventScroll:true});window.scrollTo(0,saved.scrollY);if(saved.corpusSearch)window.CorpusSearch.open();
 });
}


// Informations du projet : dialogue natif, navigation clavier et retour au bouton.
const projectInfo=document.getElementById('project-info');
let infoOpener=$('#info-toggle'),travelListening=false;
function openProjectInfo(opener){infoOpener=opener;projectInfo.showModal();document.body.classList.add('info-open');}
$('#info-toggle').onclick=()=>openProjectInfo($('#info-toggle'));
$('#secret-travel').addEventListener('click',event=>{if(event.target.closest('.travel-listen'))travelListening=true;});
$('#info-close').onclick=()=>projectInfo.close();
$('#info-audio-access').onclick=()=>{
 const help=$('#info-audio-help'),button=$('#info-audio-access');
 help.hidden=!help.hidden;button.setAttribute('aria-expanded',String(!help.hidden));
 if(!help.hidden)help.scrollIntoView({block:'nearest'});
};
projectInfo.addEventListener('close',()=>{document.body.classList.remove('info-open');if(travelListening){stopAudio();travelListening=false;}infoOpener.focus({preventScroll:true});});
projectInfo.addEventListener('click',event=>{if(event.target!==projectInfo)return;const r=projectInfo.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)projectInfo.close();});
projectInfo.addEventListener('keydown',event=>{
 if(event.key!=='Tab')return;
 const items=[...projectInfo.querySelectorAll('button:not(:disabled), summary, a[href], input:not(:disabled), select:not(:disabled), [tabindex="0"]')].filter(el=>el.getClientRects().length);
 const first=items[0],last=items.at(-1);
 if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
 else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
});

// Guide bilingue indépendant des aides de lecture et des informations détaillées.
const quickGuide=document.getElementById('quick-guide');
let quickGuideOpener=$('.brand');
function openQuickGuide(opener){quickGuideOpener=opener;quickGuide.showModal();quickGuide.querySelector('.info-body').scrollTop=0;document.body.classList.add('info-open');}
$('.brand').onclick=event=>{event.preventDefault();openQuickGuide(event.currentTarget);};
document.addEventListener('click',event=>{const opener=event.target.closest('[data-open-quick-guide]');if(opener)openQuickGuide(opener);});
$('#quick-guide-close').onclick=()=>quickGuide.close();
quickGuide.addEventListener('close',()=>{document.body.classList.remove('info-open');(quickGuideOpener.isConnected?quickGuideOpener:$('.brand')).focus({preventScroll:true});});
quickGuide.addEventListener('click',event=>{if(event.target!==quickGuide)return;const r=quickGuide.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)quickGuide.close();});

// Retours contextuels : conserver les vues et leurs gestionnaires pendant une excursion.
// Le stockage est limité à la visite et à 20 étapes pour borner la mémoire.
const navigationTrail=[];
let navigationPending=null;
const contextReturn=document.createElement('nav');
contextReturn.id='context-return';contextReturn.hidden=true;
contextReturn.setAttribute('aria-label','Retour au point de départ');
$('#main').before(contextReturn);
function updateContextReturn(){
 const previous=navigationTrail.at(-1);
 contextReturn.hidden=!previous;
 contextReturn.replaceChildren();
 if(!previous)return;
 const link=document.createElement('a');link.href=previous.hash||'#lecons';
 link.setAttribute('aria-label',previous.label);link.title=previous.label;
 const arrow=document.createElement('span');arrow.textContent='←';arrow.setAttribute('aria-hidden','true');
 const label=document.createElement('span');label.className='context-return-label';label.textContent=previous.label;
 link.append(arrow,label);link.dataset.contextBack='true';
 contextReturn.append(link);
}
function captureContext(link){
 const tab=route().tab;
 const label=link.closest('#corpus-search')?'Retour à la recherche':link.closest('.analysis-word-link')?'Retour au décorticage':link.closest('.atelier-catalog')?'Retour à la liste':
  {lecons:'Retour à la leçon',dictionnaire:'Retour au dictionnaire',grammaire:'Retour à la grammaire',atelier:'Retour à l’atelier',guide:guideQuery&&!route().id?'Retour à la recherche':'Retour au guide'}[tab];
 return {hash:location.hash,nodes:[...$('#main').childNodes],scrollY:window.scrollY,focus:link,label,
  corpusSearch:!!link.closest('#corpus-search'),
  navigationCompact:document.querySelector('.navigation-dock')?.classList.contains('is-scrolled'),
  scrolls:[...$('#main').querySelectorAll('*')].filter(el=>el.scrollTop||el.scrollLeft).map(el=>[el,el.scrollTop,el.scrollLeft]),
  search,onlyFavorites,page,dictionaryCategory,guideQuery,guideView,guideFilter,guideLexiconState:{...guideLexiconState},guideVocabCategory,guideVocabSection,lesson:settings.lesson,
  atelierSettings:{...atelierSettings},atelierSession,currentComplement,complementRevealed,favoritesRevision};
}
document.addEventListener('click',event=>{
 const link=event.target.closest('a[href^="#"]');
 if(!link||event.button!==0||event.metaKey||event.ctrlKey||event.altKey||event.shiftKey||link.target==='_blank'||event.defaultPrevented)return;
 const destination=link.hash;
 if(!/^#(lecons|dictionnaire|grammaire|atelier|guide)(\/|$)/.test(destination)||destination===location.hash)return;
 if(link.closest('#commands-panel'))window.closeNavigationCommands?.();
 const ancestor=navigationTrail.findLastIndex(item=>(item.hash||'#lecons')===destination);
 if(link.dataset.contextBack||(link.hasAttribute('data-context-return')&&ancestor>=0)){
  navigationPending={destination,restore:link.dataset.contextBack?navigationTrail.length-1:ancestor};
 }else if(link.closest('#main')||link.closest('#saved-list')||link.closest('#corpus-search')){
  navigationPending={destination,source:captureContext(link)};
 }else{
  navigationTrail.length=0;navigationPending=null;updateContextReturn();
 }
},true);
function handleContextNavigation(event){
 const pending=navigationPending;navigationPending=null;
 if(pending?.destination===location.hash){
  // Ces parcours sont désormais pris en charge ensemble, sans retours concurrents.
  dictionaryReturn=null;analysisReturn=null;atelierListReturn=null;
  if(pending.source){navigationTrail.push(pending.source);if(navigationTrail.length>20)navigationTrail.shift();updateContextReturn();return false;}
  return restoreContext(pending.restore);
 }
 // Le bouton Précédent du navigateur retrouve lui aussi la vue conservée.
 const previous=navigationTrail.at(-1);
 if(previous&&(previous.hash||'#lecons')===(location.hash||'#lecons'))return restoreContext(navigationTrail.length-1);
 navigationTrail.length=0;updateContextReturn();return false;
}
function restoreContext(index){
 if(index<0)return false;
 const saved=navigationTrail[index];navigationTrail.splice(index);
 window.closeNavigationCommands?.();
 stopAudio();guideRenderRun++; // Invalider un éventuel chargement du guide encore en cours.
 dictionaryReturn=null;analysisReturn=null;atelierListReturn=null;
 search=saved.search;onlyFavorites=saved.onlyFavorites;page=saved.page;dictionaryCategory=saved.dictionaryCategory;guideQuery=saved.guideQuery;guideView=saved.guideView;guideFilter=saved.guideFilter;guideLexiconState={...saved.guideLexiconState};guideVocabCategory=saved.guideVocabCategory;guideVocabSection=saved.guideVocabSection;
 const rebuildAtelier=route().tab==='atelier'&&saved.atelierSession!==atelierSession;
 if(route().tab==='atelier'&&!rebuildAtelier)atelierSettings=saved.atelierSettings;
 currentComplement=saved.currentComplement;complementRevealed=saved.complementRevealed;
 settings.lesson=saved.lesson;save();
 if(rebuildAtelier)renderAtelier({});else $('#main').replaceChildren(...saved.nodes);
 // Les favoris changent parfois pendant l'excursion : recalculer la liste,
 // tout en gardant les exemples ouverts pour les mots encore présents.
 if(route().tab==='dictionnaire'&&onlyFavorites&&saved.favoritesRevision!==favoritesRevision){
  const cards=[...document.querySelectorAll('.dictionary-card')].map(card=>({id:card.id,open:[...card.querySelectorAll('details')].map(d=>d.open)}));
  $('#vocab-results')?.refreshResults?.();
  for(const card of cards)document.getElementById(card.id)?.querySelectorAll('details').forEach((d,i)=>d.open=card.open[i]);
 }
 document.querySelectorAll('[data-tab]').forEach(el=>{if(el.dataset.tab===route().tab)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
 // Les favoris et préférences peuvent avoir changé dans la vue consultée.
 $('#main').querySelectorAll('[data-favorite]').forEach(el=>el.outerHTML=star(el.dataset.favorite));
 $('#vocab-results')?.classList.toggle('dictionary-compact',settings.dictionaryCompact);
 const compact=$('#dictionary-compact');if(compact){compact.setAttribute('aria-checked',settings.dictionaryCompact);compact.querySelector('span').textContent=settings.dictionaryCompact?'ON':'OFF';}
 updateContextReturn();
 window.updateNavigationTab?.();
 requestAnimationFrame(()=>{if((location.hash||'#lecons')!==(saved.hash||'#lecons'))return;
  window.setNavigationCompact?.(saved.navigationCompact);
  for(const [el,top,left] of saved.scrolls){el.scrollTop=top;el.scrollLeft=left;}
  if(saved.focus.isConnected)saved.focus.focus({preventScroll:true});window.scrollTo(0,saved.scrollY);if(saved.corpusSearch)window.CorpusSearch.open();
 });
 return true;
}

document.addEventListener('click',e=>{const b=e.target.closest('[data-corpus-favorite]');if(b){document.getElementById('saved').hidden=true;document.getElementById('saved-toggle').setAttribute('aria-expanded','false');window.CorpusSearch.openRecord(b.dataset.corpusFavorite);}});

// Une URL de résultat peut être ouverte avant le chargement du panneau différé.
function renderCorpusRecord(id,exercise=false){
 const hash=location.hash;
 const show=()=>{if(location.hash===hash)window.CorpusSearch[exercise?'renderExercise':'renderRecord'](id);};
 if(window.CorpusSearch)show();
 else{$('#main').innerHTML='<p class="panel">Chargement du passage…</p>';window.addEventListener('corpus-search-ready',show,{once:true});}
}
