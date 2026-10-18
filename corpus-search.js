/* Panneau transversal : les données et la recherche restent dans ce navigateur. */
(()=>{
 'use strict';
 const E=CorpusSearchEngine;
 const dialog=document.createElement('dialog');dialog.id='corpus-search';dialog.setAttribute('aria-labelledby','corpus-title');
 dialog.innerHTML=`<div class="corpus-top"><div class="corpus-heading"><h2 id="corpus-title">Rechercher dans tout le carnet</h2><button type="button" id="corpus-close">Fermer ×</button></div><label for="corpus-query" class="visually-hidden">Recherche globale</label><input type="search" id="corpus-query" placeholder="Un mot ou une question : ni ou de, groupes de verbes…" autocomplete="off"><div id="corpus-suggestions" aria-label="Suggestions"></div></div><div class="corpus-body"><details class="corpus-advanced"><summary>Affiner la recherche</summary><div class="corpus-modes"><label>Recherche <select id="corpus-mode"><option value="large">Pertinence · mots et questions</option><option value="exact">Expression exacte</option><option value="notion">Par notion · rapprochements suggérés</option></select></label><button type="button" id="corpus-reset">Tout réinitialiser</button></div><div id="corpus-sources" role="group" aria-label="Sources"></div><div class="corpus-basic"><label>Contenu <select id="corpus-kind"><option value="">Tous les contenus</option>${Object.entries(E.kinds).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label><label><input id="corpus-favorites" type="checkbox"> Mes favoris</label></div><div class="corpus-filters"><label>Langue <select id="corpus-lang"><option value="all">Toutes</option><option value="ja">Japonais et kana</option><option value="romaji">Romaji / prononciation du Guide</option><option value="fr">Français</option></select></label><label>Périmètre <select id="corpus-scope"><option value="all">Tout le corpus</option><option value="lesson">Une leçon</option><option value="through">Jusqu’à la leçon…</option><option value="range">Plage de leçons</option></select></label><label id="corpus-from-label" hidden>De <input id="corpus-from" type="number" min="1" max="98" value="1"></label><label id="corpus-to-label" hidden>À <input id="corpus-to" type="number" min="1" max="98" value="98"></label><label>Catégorie <select id="corpus-category"><option value="">Toutes</option></select></label><label>Chapitre du Guide <select id="corpus-chapter"><option value="">Tous</option></select></label><label>Thème du Guide <select id="corpus-theme"><option value="">Tous</option>${guideThemeDefinitions.map(t=>`<option value="${esc(t.id)}">${esc(t.title)}</option>`).join('')}</select></label></div><p class="muted">Le périmètre par leçon retient les contenus dont toutes les leçons associées sont dans la plage. Le Guide se filtre par chapitre ou thème.</p><p class="muted">Posez une question sans guillemets : les notions reconnues orientent vers les explications du carnet. Les petits mots sont écartés dans les recherches de plusieurs mots. Les guillemets imposent une expression littérale. Les variantes de kana, accents et ō/ou sont reconnues. Le mode « Par notion » utilise des associations explicites ; il n’analyse pas automatiquement les rôles des particules.</p><div class="corpus-reading" role="group" aria-label="Aides de lecture">Afficher ${['kana','romaji','fr'].map((k,i)=>`<label><input type="checkbox" id="corpus-show-${k}"> ${['Kana','Romaji','Français'][i]}</label>`).join('')}</div></details><div id="corpus-active" aria-label="Filtres actifs"></div><p id="corpus-status" role="status" aria-live="polite"></p><button id="corpus-retry" type="button" hidden>Réessayer le chargement</button><p id="corpus-expression-status" class="muted" role="status" hidden></p><div id="corpus-results"></div><div class="pager"><button id="corpus-prev" type="button">← Précédents</button><span id="corpus-page"></span><button id="corpus-next" type="button">Suivants →</button></div><details><summary>Couverture du corpus</summary><div id="corpus-coverage"></div><p class="muted">Documentation et code exclus. Le prototype « Conversations entre amis » n’est pas inclus dans cette recherche. Le parcours pratique « Commander et compter » (ses repères, dialogues et 72 exercices) n’est pas inclus dans cette recherche. Le lexique et le vocabulaire du Guide renvoient aux tableaux sources, sans recopier leurs entrées dans l’index. Les exercices de vocabulaire et de formes verbales sont également indexés à partir du périmètre complet de l’atelier.</p></details><button type="button" id="corpus-stop">■ Arrêter l’écoute</button></div>`;
 document.body.append(dialog);
 const $c=s=>dialog.querySelector(s);
 let worker,loading,serial=0,version=0,offset=0,source='',last=null,records=new Map(),timer;
 const calls=new Map();
 function request(type,payload={}){return new Promise((resolve,reject)=>{const id=++serial;calls.set(id,{resolve,reject});worker.postMessage({id,type,...payload});});}
 function failWorker(error){for(const p of calls.values())p.reject(error);calls.clear();loading=null;worker?.terminate();worker=null;}
 // Le rendu éditorial du lecteur est aussi la source de l’index et du contexte.
 function guideSearchContent(row){
  const host=document.createElement('div');
  host.innerHTML=guideNodes(row.nodes||[row.node],row.title);
  const ids=new Map([...host.querySelectorAll('[id]')].map(el=>[el.id,'corpus-'+row.id+'-'+el.id]));
  host.querySelectorAll('[id]').forEach(el=>{el.id=ids.get(el.id);});
  for(const attr of ['popovertarget','aria-controls','aria-labelledby','aria-describedby'])host.querySelectorAll('['+attr+']').forEach(el=>el.setAttribute(attr,el.getAttribute(attr).split(' ').map(id=>ids.get(id)||id).join(' ')));
  host.querySelectorAll('[data-favorite]').forEach(el=>el.remove());
  const parts=[],searchParts=[];
  const language=el=>el.closest('.romaji')?'romaji':el.closest('[lang="ja"],.guide-japanese')?'ja':'fr';
  // Les sections ont leurs propres entrées : ne pas indexer leurs descendants deux fois.
  if(row.node.type==='section'&&!row.nodes)return {parts:[{text:row.node.title,lang:'fr',secret:false}],searchParts,guideHTML:host.innerHTML};
  for(const el of host.querySelectorAll('p,aside,summary,h3,h4,th,td')){
   if(el.querySelector('p,aside,summary,h3,h4,th,td'))continue;
   const copy=el.cloneNode(true);copy.querySelectorAll('[aria-hidden="true"],rt,rp').forEach(n=>n.remove());
   const textOf=n=>n.nodeType===3?n.textContent:[...n.childNodes].map(textOf).join(' ');
   const text=textOf(copy).replace(/♪/g,'').replace(/\s+/g,' ').trim();if(text)parts.push({text,lang:language(el),secret:false});
  }
  for(const el of host.querySelectorAll('[data-speak],.romaji,[lang="ja"]')){
   const text=el.getAttribute('data-speak')||el.textContent.trim();
   if(text)searchParts.push({text,lang:el.hasAttribute('data-speak')?'ja':language(el)});
  }
  parts.forEach(p=>{p.guidePronunciation=true;});
  return {parts,searchParts,guideHTML:host.innerHTML,guideSpoken:host.querySelector('[data-speak]')?.getAttribute('data-speak')};
 }
 async function init(){
  if(loading)return loading;
  loading=(async()=>{
   $c('#corpus-status').textContent='Chargement de tous les corpus…';$c('#corpus-retry').hidden=true;
   const names=['leconsJap.json','dicoLeconsJap.json','grammaireLeconsJap.json','leconsComplementsJap.json','leconsComplementsJap-notes.json','decorticage.json'];
   const [values,,expressions]=await Promise.all([Promise.all(names.map(async name=>{const r=await fetch(name);if(!r.ok)throw Error('Source indisponible : '+name);return r.json();})),loadGuide(),Expressions.loadAll()]);
   const [rows,words,gram,extra,notes,annotations]=values;
   const guide=guideDisplayIndex.map(g=>({id:g.id,source:'guide',kind:g.type==='Tableau'?'tableau':g.type==='Expression'?'phrase':'explication',kinds:g.type==='Tableau'&&guideVocabulary.some(v=>v.table.id===g.id)?['tableau','mot']:g.type==='Tableau'?['tableau']:g.type==='Expression'?['phrase']:['explication'],title:g.title,location:[g.part.title,g.chapter.title,...g.path].join(' → '),chapter:g.chapter.title,category:g.category==='grammar'?'Grammaire':g.part.title,href:'#guide/'+g.chapter.id+'/'+g.id,anchor:g.id,favorite:guideFavoriteEntries.has(guideFavoriteKey(g.chapter.id,g.id))?guideFavoriteKey(g.chapter.id,g.id):undefined,...guideSearchContent(g),themes:guideThemeDefinitions.filter(t=>guideThemeRows(t,guideDisplayIndex).includes(g)).map(t=>t.id)}));
   for(const [i,n] of (guideData.footnotes||[]).entries())guide.push({id:'guide-note:'+i,source:'guide',kind:'explication',title:n.title,location:'Guide · notes',href:'#guide/recherche/'+encodeURIComponent('guide-note:'+i),parts:E.fragments({titre:n.title,texte:n.text})});
   worker=new Worker('corpus-search-worker.js?v=20261017-lot-c');worker.onmessage=e=>{const pending=calls.get(e.data.id);if(!pending)return;calls.delete(e.data.id);e.data.error?pending.reject(Error(e.data.error)):pending.resolve(e.data);};worker.onerror=()=>failWorker(Error('Le moteur de recherche n’a pas pu démarrer. Réessayez le chargement.'));
   const ready=await request('init',{data:{foundations:structuredClone(Fondements.records),lessons:rows,vocab:words,grammar:gram,complements:extra,complementNotes:notes,annotations,guide,expressions,exercises:[...Particules.build(rows),...Constructions.build(rows)]}});
   for(const [id,list] of [['category',ready.categories],['chapter',ready.chapters]])$c('#corpus-'+id).innerHTML='<option value="">Tous</option>'+list.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
   $c('#corpus-coverage').innerHTML='<ul>'+Object.entries(ready.coverage).map(([k,n])=>`<li>${E.sources[k]} : ${n.toLocaleString('fr-FR')} éléments indexés</li>`).join('')+'</ul>';
   const unavailable=Expressions.failed();
   $c('#corpus-expression-status').hidden=!unavailable.length;
   $c('#corpus-expression-status').innerHTML=unavailable.length?'Expressions : '+unavailable.map(k=>esc(Expressions.collections[k].title)).join(', ')+' indisponible(s). Les autres résultats restent accessibles. <button type="button" id="corpus-expression-retry">Réessayer les expressions</button>':'';
   if(unavailable.length)$c('#corpus-expression-retry').onclick=async()=>{await Expressions.retryFailed();failWorker(Error('Actualisation des expressions'));last=null;run(false);};
   return ready;
  })().catch(error=>{loading=null;$c('#corpus-status').textContent=error.message+' La recherche complète est indisponible tant que cette source manque.';$c('#corpus-retry').hidden=false;throw error;});
  return loading;
 }
 function state(){return {q:$c('#corpus-query').value,mode:$c('#corpus-mode').value,source,kind:$c('#corpus-kind').value,lang:$c('#corpus-lang').value,scope:$c('#corpus-scope').value,from:$c('#corpus-from').value,to:$c('#corpus-to').value,category:$c('#corpus-category').value,chapter:$c('#corpus-chapter').value,theme:$c('#corpus-theme').value,onlyFavorites:$c('#corpus-favorites').checked,favorites:[...new Set([...favorites,...[...favorites].map(guideCanonicalFavorite)])],offset};}
 function marked(text){
  const tokens=(last?.tokens||[]).flatMap(t=>t.split(/\s+/));
  return String(text).split(/(\s+|[·,;:!?()])/u).map(word=>tokens.some(t=>E.matches(word,t))?'<mark>'+esc(word)+'</mark>':esc(word)).join('');
 }
 function partsHTML(parts){return parts.map(p=>`<p class="${p.reading?'kana':p.lang==='ja'?'jp':p.lang==='romaji'?'romaji':'fr'}">${marked(p.lang==='romaji'&&!p.guidePronunciation?Romaji.display(p.text):p.text)}</p>`).join('');}
 function contextHTML(d){
  if(d.guideHTML)return d.guideHTML;
  const ordinary=d.parts.filter(p=>!p.secret),secret=d.parts.filter(p=>p.secret);
  return partsHTML(ordinary)+(secret.length?'<details class="corpus-correction"><summary>Révéler la correction et les traductions des choix</summary>'+partsHTML(secret)+'</details>':'');
 }
 function card(d,query=$c('#corpus-query').value){
  if(d.source==='expressions')return Expressions.card(d.entry,d.collection,{searchId:d.id,query});
  const publicParts=d.parts.filter(p=>!p.secret),matched=publicParts.filter(p=>(last.tokens||[]).some(t=>E.matches(p.text,t)));
  const preview=(matched.length?matched:publicParts).slice(0,3);
  const secretMatch=d.parts.some(p=>p.secret&&(last.tokens||[]).some(t=>E.matches(p.text,t)));
  const spoken=d.guideSpoken?{text:d.guideSpoken}:publicParts.find(p=>p.reading)||publicParts.find(p=>p.lang==='ja');
  return `<article class="corpus-card" data-corpus-id="${esc(d.id)}"><div class="corpus-result-heading"><span class="pill">${E.sources[d.source]} · ${E.kinds[d.kind]}</span>${star(d.favorite||'corpus:'+d.id)}</div><h3>${marked(d.title)}</h3><p class="corpus-location">${esc(d.location)}</p>${d.related?'<p class="corpus-related">Rapprochement suggéré par notion</p>':''}${partsHTML(preview.map(p=>({...p,text:snippet(p.text)})))}${d.exampleParts?.length?`<details><summary>Exemple de cette fiche</summary>${partsHTML(d.exampleParts)}</details>`:''}${secretMatch?'<p class="muted">Correspondance également dans la correction masquée.</p>':''}<div class="corpus-actions">${spoken?(d.complement?`<button type="button" class="audio" data-corpus-listen="${esc(d.id)}">▶ Écouter</button>`:audioButton(spoken.text,d.audioRef||'')):''}<a href="${esc(d.href)}" data-corpus-open="${esc(d.id)}">${d.source==='atelier'?'Ouvrir cet exercice':'Ouvrir le passage'} →</a></div>${d.alternatives?.length?`<details><summary>${d.alternatives.length} autre(s) accès à ce passage</summary><div class="links">${d.alternatives.map(a=>`<a href="${esc(a.href)}" data-corpus-open="${esc(a.id)}">${esc(a.title)}</a>`).join('')}</div></details>`:''}<details class="corpus-context"><summary>Voir le contexte complet${d.kind==='exercice'?' et la correction':''}</summary><div class="corpus-context-content"></div></details></article>`;
 }
 function snippet(text){if(text.length<=260)return text;const key=E.norm(text),positions=(last.tokens||[]).map(t=>key.indexOf(t)).filter(n=>n>=0),start=Math.max(0,(positions.length?Math.min(...positions):0)-65);return (start?'…':'')+text.slice(start,start+300)+(start+300<text.length?'…':'');}
 function activeFilters(){const s=state();const items=[];if(source)items.push(['source',E.sources[source]]);if($c('#corpus-mode').value!=='large')items.push(['mode',$c('#corpus-mode').selectedOptions[0].textContent]);for(const key of ['kind','lang','scope','category','chapter','theme']){const el=$c('#corpus-'+key);if(el.value&&el.value!=='all')items.push([key,el.selectedOptions[0].textContent+(key==='scope'?' '+s.from+'–'+s.to:'')]);}if(s.onlyFavorites)items.push(['favorites','Mes favoris']);$c('.corpus-advanced>summary').textContent='Affiner la recherche'+(items.length?' · '+items.length+' filtre'+(items.length>1?'s':'')+' actif'+(items.length>1?'s':''):'');$c('#corpus-active').innerHTML=items.map(([k,v])=>`<button type="button" data-clear-filter="${k}" aria-label="Retirer le filtre ${esc(v)}">${esc(v)} ×</button>`).join('');}
 async function run(reset=true){
  const current=++version;if(reset)offset=0;
  try{await init();if(current!==version)return;$c('#corpus-status').textContent='Recherche…';const response=await request('query',{state:state()});if(current!==version)return;last=response;records=new Map(response.items.flatMap(d=>[d,...(d.alternatives||[])].map(r=>[r.id,r])));
   $c('#corpus-status').textContent=`${response.total.toLocaleString('fr-FR')} résultats${response.intent?' · Notion reconnue : '+response.intent:''}${response.total?' · '+(offset+1)+'–'+Math.min(offset+30,response.total):' · Essayez un autre terme ou retirez un filtre.'}`;
   $c('#corpus-results').innerHTML=response.items.map(d=>card(d)).join('');
   $c('#corpus-sources').innerHTML=[['','Tout'],...Object.entries(E.sources)].map(([k,v])=>`<button type="button" data-source="${k}" aria-pressed="${source===k}">${v}${k?' · '+(response.counts.sources[k]||0):''}</button>`).join('');
   for(const option of $c('#corpus-kind').options)if(option.value)option.textContent=E.kinds[option.value]+' · '+(response.counts.kinds[option.value]||0);
   $c('#corpus-prev').disabled=offset===0;$c('#corpus-next').disabled=offset+30>=response.total;$c('#corpus-page').textContent=response.total?`${offset/30+1} / ${Math.ceil(response.total/30)}`:'';
   $c('#corpus-suggestions').innerHTML=response.suggestions.map(s=>`<button type="button" data-notion="${esc(s)}">Explorer : ${esc(s)}</button>`).join('');activeFilters();
  }catch(error){$c('#corpus-status').textContent=error.message;$c('#corpus-retry').hidden=false;}
 }
 let favoriteReturn=null,openingPassage=false;
 async function open(){for(const k of ['kana','romaji','fr'])$c('#corpus-show-'+k).checked=!!settings[k];stopAudio();window.closeNavigationCommands?.();if(!dialog.open)dialog.showModal();$c('#corpus-query').focus({preventScroll:true});document.getElementById('search-toggle').setAttribute('aria-expanded','true');if(!last||$c('#corpus-favorites').checked)await run(false);else{dialog.querySelectorAll('[data-favorite]').forEach(el=>el.outerHTML=star(el.dataset.favorite));}}
 $c('#corpus-close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{stopAudio();document.getElementById('search-toggle').setAttribute('aria-expanded','false');document.getElementById('search-toggle').focus({preventScroll:true});if(favoriteReturn&&!openingPassage){const back=favoriteReturn;favoriteReturn=null;back();}openingPassage=false;});
 $c('#corpus-stop').onclick=()=>stopAudio();
 $c('#corpus-query').oninput=()=>{clearTimeout(timer);++version;timer=setTimeout(()=>run(),120);};
 $c('#corpus-query').onkeydown=e=>{if(e.key==='Enter'){clearTimeout(timer);run();}};
 dialog.addEventListener('change',e=>{if(e.target.id.startsWith('corpus-show-')){settings[e.target.id.slice(12)]=e.target.checked;applySettings();save();return;}if(!e.target.closest('.corpus-context')&&e.target.id.startsWith('corpus-')){if(e.target.id==='corpus-scope'&&e.target.value==='through')$c('#corpus-to').value=Number(settings.lesson.slice(1))||1;scopeUI();run();}});
 function scopeUI(){const s=$c('#corpus-scope').value;$c('#corpus-from-label').hidden=!['range','lesson'].includes(s);$c('#corpus-to-label').hidden=!['range','through'].includes(s);}
 
 $c('#corpus-reset').onclick=()=>{source='';offset=0;for(const el of dialog.querySelectorAll('.corpus-filters select,#corpus-kind,#corpus-mode'))el.selectedIndex=0;$c('#corpus-favorites').checked=false;$c('#corpus-query').value='';scopeUI();run();};
 $c('#corpus-retry').onclick=()=>{loading=null;run();};
 $c('#corpus-prev').onclick=()=>{offset=Math.max(0,offset-30);run(false);dialog.scrollTop=0;};$c('#corpus-next').onclick=()=>{offset+=30;run(false);dialog.scrollTop=0;};
 dialog.addEventListener('toggle',e=>{if(e.target.matches('.corpus-context')&&e.target.open){const host=e.target.querySelector('.corpus-context-content');if(!host.childNodes.length){const d=records.get(e.target.closest('[data-corpus-id]').dataset.corpusId);host.innerHTML=contextHTML(d);}}},true);
 dialog.addEventListener('click',e=>{
  const listen=e.target.closest('[data-corpus-listen]');if(listen){const d=records.get(listen.dataset.corpusListen);loadComplements().then(()=>speak([complementAudioItem(d.complement)]));}
  const s=e.target.closest('[data-source]');if(s){source=s.dataset.source;run();}
  const n=e.target.closest('[data-notion]');if(n){$c('#corpus-query').value=n.dataset.notion;$c('#corpus-mode').value='notion';run();}
  const clear=e.target.closest('[data-clear-filter]');if(clear){const key=clear.dataset.clearFilter;if(key==='source')source='';else if(key==='favorites')$c('#corpus-favorites').checked=false;else $c('#corpus-'+key).selectedIndex=0;scopeUI();run();$c('#corpus-query').focus({preventScroll:true});}
  const link=e.target.closest('[data-corpus-open]');if(link&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&!e.altKey){const d=records.get(link.dataset.corpusOpen);openingPassage=true;dialog.close();searchReturnAvailable=true;syncSearchReturn();locate(d);}
  const fav=e.target.closest('[data-favorite]');if(fav?.dataset.favorite.startsWith('corpus:')){const d=records.get(fav.dataset.favorite.slice(7));if(d)try{const labels=JSON.parse(localStorage.getItem('nihongo-search-favorite-labels')||'{}');labels[d.id]=d.title;localStorage.setItem('nihongo-search-favorite-labels',JSON.stringify(labels));}catch{}}
  if(e.target.closest('[data-favorite]')&&$c('#corpus-favorites').checked)setTimeout(()=>run(),0);
 });
 document.addEventListener('click',e=>{if(e.target.closest('.tabs a,[data-expression-browse]')){searchReturnAvailable=false;syncSearchReturn();}});
 let searchReturnAvailable=false;
 function syncSearchReturn(){returnButton.hidden=!searchReturnAvailable||!document.getElementById('context-return').hidden;}
 const returnButton=document.createElement('button');returnButton.id='corpus-return';returnButton.type='button';returnButton.textContent='← Recherche';returnButton.hidden=true;returnButton.onclick=open;document.querySelector('.navigation-dock').append(returnButton);
 new MutationObserver(syncSearchReturn).observe(document.getElementById('context-return'),{attributes:true,attributeFilter:['hidden'],childList:true});
 async function locate(d){
  if(d.source==='atelier')return;
  for(let i=0;i<80;i++){
   await new Promise(resolve=>setTimeout(resolve,50));if(location.hash!==d.href)continue;
   let target=d.anchor?document.getElementById(d.anchor):null;
   if(d.complement){await loadComplements();const b=[...document.querySelectorAll('[data-extra-track]')].find(b=>b.dataset.extraTrack.startsWith(d.complement+'.')||b.dataset.extraTrack===d.complement);if(b){selectComplement(b.dataset.extraTrack);}else{currentComplement=d.complement;renderComplementText();}complementRevealed=true;renderComplementText();target=document.getElementById('extra-text');}
   if(d.source==='grammaire'){
    if(d.target==='exercice'){target=document.getElementById('demo-exercise');if(!target)continue;for(let n=0;n<(d.exerciseIndex||0);n++)document.getElementById('demo-next')?.click();}
    else{const texts=d.parts.filter(p=>!p.secret).map(p=>E.compact(p.text)).filter(t=>t.length>8);target=[...document.querySelectorAll('#main p,#main h1,#main h3,#main li,#main td,#main th,#main .grammar-resources a')].find(el=>texts.some(t=>E.compact(el.textContent).includes(t)));}
   }
   if(!target)continue;
   if(d.reveal)target.querySelectorAll('details').forEach(el=>el.open=true);
   if(d.exampleIndex!==undefined)target=target.querySelector('[data-vocab-example="'+d.exampleIndex+'"]')||target;
   for(let el=target;el&&el.id!=='main';el=el.parentElement)if(el.tagName==='DETAILS')el.open=true;
   target.classList.add('highlight');target.scrollIntoView({block:'center'});return;
  }
 }
 async function renderRecord(id){
  const requestedHash=location.hash;
  document.getElementById('main').innerHTML='<p class="panel">Chargement de l’exercice…</p>';
  try{await init();const response=await request('get',{data:decodeURIComponent(id)});if(location.hash!==requestedHash)return;const d=response.record;if(!d)throw Error('Exercice introuvable');document.getElementById('main').innerHTML=intro(E.sources[d.source]+' · RECHERCHE',d.title,d.location)+'<article class="panel">'+contextHTML(d)+'<div class="links">'+(d.exercise?.sources||[]).map(s=>sourceLink(s)).join('')+'</div></article>';window.updateNavigationTab?.();}catch(error){document.getElementById('main').innerHTML='<p class="panel">'+esc(error.message)+'</p>';}
 }
 window.addEventListener('expressions-retry',()=>{failWorker(Error('Actualisation des expressions'));last=null;if(dialog.open)run(false);});
 window.CorpusSearch={open,renderRecord,renderExercise:id=>renderRecord('exercise:'+id),async openRecord(id,onReturn=null){await open();favoriteReturn=onReturn;await init();const response=await request('get',{data:id});if(response.record){const d=response.record;records.set(d.id,d);last={tokens:[]};$c('#corpus-results').innerHTML=card(d,'');$c('#corpus-status').textContent='Favori · '+d.title;}}};
 window.dispatchEvent(new Event('corpus-search-ready'));
})();
