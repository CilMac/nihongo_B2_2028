'use strict';
let guideData=null,guideLoading=null,guideQuery='',guideRenderRun=0;
let guideView='rubriques',guideFilter='all';
let guideTables=[],guideVocabulary=[];
const guideFavoriteEntries=new Map();
function guideFavoriteKey(chapter,id){return 'guidefav:'+chapter+':'+id;}
function guideFavoriteStar(id){return guideFavoriteEntries.has(id)?star(id):'';}

let guideVocabCategory='all',guideVocabSection='all';
let guideChapters=[],guideSearchIndex=[];const guideNodeIds=new WeakMap();
function guideSearchKey(text){return normalize(text).normalize('NFD').replace(/([a-z])[\u0300-\u036f]+/gi,'$1').normalize('NFC');}
async function loadGuide(){
 if(guideData)return;
 if(!guideLoading)guideLoading=fetch('guideConversationJap.json').then(r=>{if(!r.ok)throw Error('Guide indisponible');return r.json();}).then(data=>{
  guideData=data;guideChapters=[];guideSearchIndex=[];guideTables=[];guideVocabulary=[];
  for(const part of data.parts){for(const chapter of part.chapters){
   guideChapters.push({part,chapter});let index=0,tableNumber=0;
   const visit=(node,path=[],inTable=false)=>{if(!node||typeof node!=='object')return;if(Array.isArray(node)){node.forEach(n=>visit(n,path,inTable));return;}
    const nextPath=node.type==='section'&&node.title?[...path,node.title]:path;
    if(node.type){const id=`guide-${chapter.id}-${index++}`;guideNodeIds.set(node,id);
     const text=node.type==='table'?guidePlainText(node):node.type==='paragraph'?node.text:node.title;
     if(text&&!inTable){
      const type=node.type==='table'?'Tableau':node.type==='paragraph'&&(['foreign','mentioned','literal'].includes(node.style)||(/[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(text)&&!/[a-zA-ZÀ-ÖØ-öø-ÿ]/.test(text)))?'Expression':'Explication';
      const tableTitles={'tpc-13':['Présent, passé et négation : verbes polis et desu'],'tpc-22':['Formes verbales : manger, faire et venir'],'tpc-23':['Formes verbales : prêter, marcher, nager, lire…','Le verbe aller : iku, itte, itta'],'tpc-24':['Démonstratifs : kore, sore, are ; lieux et déterminants'],'tpc-28':['Les formes de l’adjectif omoshiroi'],'tpc-29':['Politesse : formes honorifiques et humbles']};
      const title=node.type==='table'?(tableTitles[chapter.id]?.[tableNumber++]||nextPath.at(-1)||chapter.title):nextPath.at(-1)||chapter.title;
      const category=part.title==='Initiation'&&path.some(t=>/grammaire/i.test(t))?'grammar':/nombres|dates|temps/i.test(chapter.title)?'numbers':part.title==='Conversation'?'conversation':'other';
      const row={id,node,chapter,part,text,title,path:nextPath,type,category,search:guideSearchKey(text),context:guideSearchKey([chapter.title,...nextPath,title].join(' '))};
      guideSearchIndex.push(row);if(node.type==='table')guideTables.push(row);
     }
    }
    if(node.blocks)visit(node.blocks,nextPath,inTable);if(node.rows)visit(node.rows,nextPath,true);if(node.items)visit(node.items,nextPath,inTable);
   };visit(chapter.content);
  }}
  buildGuideVocabulary();
  guideFavoriteEntries.clear();
  for(const row of guideSearchIndex){
   if(!['paragraph','table'].includes(row.node.type))continue;
   const key=guideFavoriteKey(row.chapter.id,row.id);
   guideFavoriteEntries.set(key,{key,chapter:row.chapter.id,target:row.id,type:row.type,title:[row.chapter.title,...row.path].join(' → '),text:row.text});
  }
  for(const table of guideTables)for(const cells of table.node.rows){
   const nodes=cells.flatMap(c=>Array.isArray(c)?c:[c]);
   const anchor=nodes.find(n=>n.japanese)||nodes.find(n=>guideNodeIds.has(n));
   if(!anchor)continue;
   const target=guideNodeIds.get(anchor),key=guideFavoriteKey(table.chapter.id,target);
   guideFavoriteEntries.set(key,{key,chapter:table.chapter.id,target,type:'Expression',title:[table.chapter.title,...table.path].join(' → '),text:guidePlainText(cells)});
  }
 }).catch(error=>{guideLoading=null;throw error;});
 await guideLoading;
}
function guideParagraph(node){
 const text=String(node.text||'');
 const japanese=/[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(text)&&!/[a-zA-ZÀ-ÖØ-öø-ÿ]/.test(text);
 const pronunciation=node.style==='foreign'&&!node.runs;
 const translation=node.style==='mentioned'&&!node.runs;
 const cls=japanese?'guide-japanese':pronunciation?'romaji guide-pronunciation':translation?'fr guide-translation':'';
 // Le texte original reste la référence : les champs extraits peuvent fusionner des phrases.
 const content=japanese?jp(text):esc(text);
 if(japanese)return `<p class="${cls}" lang="ja"><button class="guide-speak" data-speak="${esc(text.replace(/\s*\/\s*/g,'、'))}" aria-label="Écouter : ${esc(text)}">${content}<span aria-hidden="true"> ♪</span></button></p>`;
 if(node.style==='literal'&&!node.runs)return `<details class="guide-literal"><summary>Mot à mot</summary><p class="fr">${content}</p></details>`;
 return `<p class="${cls}">${content}</p>`;
}
function guideNodes(nodes,context='Tableau du guide',inTable=false){
 return (nodes||[]).map(node=>{
  const id=guideNodeIds.get(node)||'';
  const chapter=id.match(/^guide-(tpc-\d+)-/)?.[1];
  const favorite=guideFavoriteStar(guideFavoriteKey(chapter,id));
  if(node.type==='paragraph')return `<div id="${id}" class="${inTable?'':'guide-favorite-block'}">${!inTable?favorite:''}${guideParagraph(node)}</div>`;
  if(node.type==='section'){
   const inside=guideNodes(node.blocks,node.title||context,inTable);
   if(!node.title)return `<div id="${id}" class="guide-group">${inside}</div>`;
   return `<details id="${id}" class="guide-section"><summary>${esc(node.title)}</summary><div class="guide-section-body">${inside}</div></details>`;
  }
  if(node.type==='table')return `<div id="${id}" class="guide-table-scroll" tabindex="0" role="region" aria-label="${esc(context)} — tableau défilant"><table class="guide-table"><caption>${esc(context)} ${favorite}</caption><tbody>${node.rows.map(row=>{const nodes=row.flatMap(c=>Array.isArray(c)?c:[c]);const anchor=nodes.find(n=>n.japanese)||nodes.find(n=>guideNodeIds.has(n));const rowStar=anchor?guideFavoriteStar(guideFavoriteKey(chapter,guideNodeIds.get(anchor))):'';return `<tr>${row.map((cell,i)=>`<td>${i===0?rowStar:''}${guideNodes(Array.isArray(cell)?cell:[cell],context,true)}</td>`).join('')}</tr>`;}).join('')}</tbody></table></div>`;
  if(node.type==='list'){const tag=node.ordered?'ol':'ul';return `<${tag} id="${id}" class="guide-list">${node.items.map(item=>`<li>${guideNodes(item,context,inTable)}</li>`).join('')}</${tag}>`;}
  return '';
 }).join('');
}
function guideHome(){
 const order=['Conversation','Les indispensables','Initiation','Introduction'];
 const descriptions={'Conversation':'15 thèmes pour les situations du quotidien et du voyage.','Les indispensables':'Nombres, prononciation, repères et expressions utiles.','Initiation':'21 mini-leçons, dans un parcours indépendant des 98 leçons.','Introduction':'Le guide, le pays, la langue et son écriture.'};
 return `<div id="guide-home-sections">${order.map(title=>{const part=guideData.parts.find(p=>p.title===title);if(!part)return '';return `<section class="panel guide-part"><h2>${esc(title)}</h2><p class="muted">${descriptions[title]}</p><div class="guide-chapters">${part.chapters.map(c=>`<a href="#guide/${encodeURIComponent(c.id)}">${esc(c.title)} <span aria-hidden="true">→</span></a>`).join('')}</div></section>`;}).join('')}</div>`;
}
function guidePlainText(node){
 if(Array.isArray(node))return node.map(guidePlainText).filter(Boolean).join(' · ');
 if(!node||typeof node!=='object')return '';
 return node.text||[node.title,guidePlainText(node.blocks),guidePlainText(node.rows),guidePlainText(node.items)].filter(Boolean).join(' · ');
}
function guideMarked(text){
 const terms=guideQuery.trim().split(/\s+/).filter(Boolean).map(guideSearchKey);
 // Travailler sur les caractères d’origine pour conserver accents et japonais.
 return String(text).split(/(\s+|[·,;:!?()])/u).map(word=>terms.some(t=>guideSearchKey(word).includes(t))?`<mark>${esc(word)}</mark>`:esc(word)).join('');
}
function guidePreview(row){
 const terms=guideQuery.trim().split(/\s+/).filter(Boolean).map(guideSearchKey);
 const pieces=row.text.split(' · ');
 const first=pieces.findIndex(p=>terms.some(t=>guideSearchKey(p).includes(t)));
 const text=pieces.slice(Math.max(0,first),Math.max(0,first)+6).join(' · ');
 return text.length>260?text.slice(0,260)+'…':text;
}
// Seules les lignes à trois cellules explicitement identifiées sont associées.
// Les tableaux grammaticaux et les cellules ambiguës restent dans le lecteur source.
function buildGuideVocabulary(){
 guideVocabulary=[];
 for(const table of guideTables){
  if(!['Conversation','Les indispensables'].includes(table.part.title))continue;
  table.node.rows.forEach((cells,index)=>{
   if(cells.length!==3||!cells.every(c=>c&&c.type==='paragraph'))return;
   const [fr,ja,reading]=cells;
   if(fr.style!=='mentioned'||!ja.japanese||reading.style!=='foreign'||/[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(reading.text||''))return;
   const spoken=ja.text.replace(/\[note \d+\]/gi,'').trim();
   if(!fr.text?.trim()||!reading.text?.trim()||!/[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(spoken)||/[a-zA-ZÀ-ÖØ-öø-ÿ]/.test(spoken))return;
   const section=table.path.at(-1)||'Autres mots et expressions';
   guideVocabulary.push({id:table.id+'-v'+index,sourceId:guideNodeIds.get(ja),table,section,japanese:ja.text,spoken,reading:reading.text,french:fr.text,
    search:guideSearchKey([fr.text,ja.text,reading.text,table.chapter.title,section].join(' '))});
  });
 }
}
function guideVocabCategories(){
 return guideChapters.filter(c=>guideVocabulary.some(v=>v.table.chapter.id===c.chapter.id));
}
function updateGuideVocabulary(){
 const target=$('#guide-results');
 const categoryRows=guideVocabulary.filter(v=>guideVocabCategory==='all'||v.table.chapter.id===guideVocabCategory);
 const sections=[...new Set(categoryRows.map(v=>v.section))];
 if(!sections.includes(guideVocabSection))guideVocabSection='all';
 $('#guide-vocab-section-filter').hidden=guideVocabCategory==='all'||sections.length<2;
 $('#guide-vocab-section').innerHTML='<option value="all">Toutes les sous-catégories</option>'+sections.map(t=>`<option value="${esc(t)}">${esc(t)} · ${categoryRows.filter(v=>v.section===t).length}</option>`).join('');
 $('#guide-vocab-section').value=guideVocabSection;
 const terms=guideSearchKey(guideQuery.trim()).split(/\s+/).filter(Boolean);
 const rows=categoryRows.filter(v=>(guideVocabSection==='all'||v.section===guideVocabSection)&&terms.every(t=>v.search.includes(t)));
 const entry=v=>`<article class="guide-vocab-row"><div><button class="guide-speak guide-japanese" lang="ja" data-speak="${esc(v.spoken)}" aria-label="Écouter : ${esc(v.spoken)}">${guideMarked(v.japanese)} <span aria-hidden="true">♪</span></button><p class="romaji guide-pronunciation">${guideMarked(v.reading)}</p></div><p class="fr">${guideMarked(v.french)}</p><div class="guide-vocab-source">${guideFavoriteStar(guideFavoriteKey(v.table.chapter.id,v.sourceId))}<small>${esc(v.section)}</small><a href="#guide/${v.table.chapter.id}/${v.sourceId}">Voir dans le guide →</a></div></article>`;
 let content;
 if(guideVocabCategory==='all')content=guideVocabCategories().map(({chapter})=>{
  const matches=rows.filter(v=>v.table.chapter.id===chapter.id);if(!matches.length)return '';
  return `<details class="guide-vocab-group guide-table-group" ${terms.length?'open':''}><summary><strong>${esc(chapter.title)}</strong> <span class="pill">${matches.length}</span></summary><div class="guide-vocab-list">${matches.map(entry).join('')}</div></details>`;
 }).join('');else content=`<div class="guide-vocab-list">${rows.map(entry).join('')}</div>`;
 target.innerHTML=`<p class="muted" role="status">${rows.length} ${rows.length===1?'entrée':'entrées'} · mots et expressions</p><p class="muted guide-vocab-note">Sélection issue des listes structurées du guide. Prononciation et traductions conservées telles qu’elles figurent dans la source ; certains textes extraits comportent des espacements irréguliers. Le lien permet de consulter le contexte et les notes.</p>${rows.length?content:'<p class="panel">Aucun mot trouvé. Changez la recherche ou la catégorie.</p>'}`;
}
function updateGuideSearch(){
 const target=document.getElementById('guide-results');if(!target)return;
 const terms=guideSearchKey(guideQuery.trim()).split(/\s+/).filter(Boolean);
 const tables=guideView==='tableaux',vocabulary=guideView==='vocabulaire',themes=guideView==='themes';
 $('#guide-home-sections').hidden=tables||vocabulary||themes||!!terms.length;
 $('#guide-vocab-category-filter').hidden=!vocabulary;
 $('#guide-vocab-section-filter').hidden=true;
 $('#guide-table-filter').hidden=!tables;
 document.querySelectorAll('[data-guide-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.guideView===guideView)));
 if(themes){updateGuideThemes();return;}
 if(vocabulary){updateGuideVocabulary();return;}
 if(!terms.length&&!tables){target.innerHTML='';return;}
 const found=(tables?guideTables:guideSearchIndex).filter(row=>(!tables||guideFilter==='all'||row.category===guideFilter)&&terms.every(term=>row.search.includes(term)||row.context.includes(term)));
 found.sort((a,b)=>terms.reduce((sum,t)=>sum+(b.context.includes(t)?3:0)-(a.context.includes(t)?3:0),0));
 const shown=found.slice(0,tables?113:60);
 const renderResult=row=>{
  const origin=[row.part.title,row.chapter.title,...row.path].join(' → ');
  const link=`#guide/${encodeURIComponent(row.chapter.id)}/${row.id}`;
  if(row.type==='Tableau')return `<details class="guide-table-result"><summary><span class="pill">Tableau</span> <strong>${guideMarked(row.title)}</strong><small>${esc(origin)}</small><span class="guide-preview">${guideMarked(guidePreview(row))}</span></summary><div class="guide-table-content" data-guide-table="${row.id}"></div><p><a href="${link}">Voir dans le chapitre →</a></p></details>`;
  return `<a href="${link}"><span class="pill">${row.type}</span><strong>${esc(origin)}</strong><span>${guideMarked(guidePreview(row))}</span></a>`;
 };
 const grouped=tables&&guideFilter==='conversation';
 const groups=new Map();
 if(grouped)for(const row of shown){if(!groups.has(row.chapter.id))groups.set(row.chapter.id,{title:row.chapter.title,rows:[]});groups.get(row.chapter.id).rows.push(row);}
 const results=grouped?[...groups].map(([id,group])=>`<details class="guide-table-group" data-guide-group="${id}" ${terms.length?'open':''}><summary><strong>${guideMarked(group.title)}</strong> <span class="pill">${group.rows.length} ${group.rows.length===1?'tableau':'tableaux'}</span></summary><div class="guide-search-list">${group.rows.map(renderResult).join('')}</div></details>`).join(''):shown.map(renderResult).join('');
 target.innerHTML=`<p class="muted" role="status">${found.length} ${tables?(found.length===1?'tableau':'tableaux'):(found.length===1?'résultat':'résultats')}${found.length>shown.length?' · premiers résultats affichés, précisez votre recherche':''}</p>${!found.length?'<p class="panel">Aucun résultat. Essayez un mot plus court ou une autre catégorie.</p>':''}<div class="guide-search-list">${results}</div>`;
 target.querySelectorAll('.guide-table-result').forEach(detail=>detail.addEventListener('toggle',()=>{
  const host=detail.querySelector('[data-guide-table]');if(!detail.open||host.childNodes.length)return;
  const row=guideTables.find(t=>t.id===host.dataset.guideTable);host.innerHTML=guideNodes([row.node],row.title);
 }));
}
async function renderGuide(r){
 const run=++guideRenderRun;
 $('#main').innerHTML='<p class="panel">Chargement du guide…</p>';
 try{await loadGuide();}catch{
  if(run!==guideRenderRun||route().tab!=='guide')return;
  $('#main').innerHTML='<section class="panel"><h1>Guide indisponible</h1><p>Le fichier du guide n’a pas pu être chargé.</p><button id="guide-retry">Réessayer</button></section>';$('#guide-retry').onclick=()=>renderGuide(route());return;
 }
 if(run!==guideRenderRun||route().tab!=='guide')return;
 const selected=guideChapters.find(({chapter})=>chapter.id===r.id);
 let content='';
 if(selected){const {chapter,part}=selected;const siblings=part.chapters,i=siblings.indexOf(chapter);
  const notes=guideData.footnotes.filter(note=>(chapter.footnote_refs||[]).some(ref=>String(ref)===String(note.number))||JSON.stringify(chapter.content).includes(`[note ${note.number}]`));
  content=`<div class="guide-breadcrumb"><a data-context-return href="#guide">← ${guideView==='themes'?'Retour aux thèmes':guideView==='vocabulaire'?'Retour au vocabulaire':guideView==='tableaux'?'Retour aux tableaux':guideQuery?'Retour à la recherche':'Sommaire du guide'}</a><span>${esc(part.title)}</span></div>${intro('GUIDE · '+part.title,chapter.title,'')}<div class="guide-reader">${guideNodes(chapter.content,chapter.title)}${notes.length?`<details class="guide-section"><summary>Notes du chapitre</summary>${notes.map(n=>`<p><strong>Note ${esc(n.number)}.</strong> ${esc(n.text)}</p>`).join('')}</details>`:''}</div><nav class="guide-next" aria-label="Chapitres du guide">${i>0?`<a href="#guide/${siblings[i-1].id}">← ${esc(siblings[i-1].title)}</a>`:''}${i<siblings.length-1?`<a href="#guide/${siblings[i+1].id}">${esc(siblings[i+1].title)} →</a>`:''}</nav>`;
 }else{
  content=intro('CONSULTER · ÉCOUTER · PARLER','Guide de conversation','Un accès par situation, indépendant des leçons et de l’atelier.')+`<div class="toolbar"><label for="guide-search">Chercher dans le guide</label><input id="guide-search" type="search" value="${esc(guideQuery)}" placeholder="Addition, gare, réservation…"><button id="guide-clear">Effacer</button></div><div class="guide-tools" role="group" aria-label="Explorer le guide"><button type="button" data-guide-view="rubriques" aria-pressed="true">Rubriques</button><button type="button" data-guide-view="tableaux" aria-pressed="false">Tableaux · 113</button><button type="button" data-guide-view="vocabulaire" aria-pressed="false">Vocabulaire · ${guideVocabulary.length}</button><button type="button" data-guide-view="themes" aria-pressed="false">Thèmes · 13</button><label id="guide-table-filter" hidden>Catégorie <select id="guide-category"><option value="all">Tous les tableaux</option><option value="grammar">Notes de grammaire</option><option value="numbers">Nombres et temps</option><option value="conversation">Conversation et vocabulaire</option><option value="other">Autres repères</option></select></label><label id="guide-vocab-category-filter" hidden>Catégorie <select id="guide-vocab-category"><option value="all">Toutes les catégories</option>${guideVocabCategories().map(({chapter})=>`<option value="${chapter.id}">${esc(chapter.title)} · ${guideVocabulary.filter(v=>v.table.chapter.id===chapter.id).length}</option>`).join('')}</select></label><label id="guide-vocab-section-filter" hidden>Sous-catégorie <select id="guide-vocab-section"></select></label></div><div id="guide-results"></div>${guideHome()}`;
 }
 $('#main').innerHTML=`<div class="guide-module">${content}<details class="guide-about"><summary>À propos de cette édition et des lectures</summary><p>Guide Assimil de Catherine Garnier et Takahashi Nozomi, édition 2013. Texte extrait de votre EPUB ; les tableaux et leur ordre sont conservés. Les informations pratiques et historiques sont celles de cette édition.</p><p>La prononciation reprend les conventions du guide, sans conversion en romaji standard. Le réglage Romaji permet de masquer ou d’afficher ses lignes de prononciation ; Français agit sur les lignes de traduction identifiées. Les explications restent lisibles. Le guide ne fournit pas de ligne kana séparée.</p><p>Cliquez sur une expression entièrement en japonais pour l’écouter en synthèse vocale. Les lectures peuvent varier selon la voix ; les extraits japonais mêlés aux explications ne sont pas lus automatiquement.</p></details></div>`;
 if(!selected){$('#guide-vocab-category').value=guideVocabCategory;$('#guide-vocab-category').onchange=e=>{guideVocabCategory=e.target.value;guideVocabSection='all';updateGuideSearch();};$('#guide-vocab-section').onchange=e=>{guideVocabSection=e.target.value;updateGuideSearch();};$('#guide-category').value=guideFilter;$('#guide-category').onchange=e=>{guideFilter=e.target.value;updateGuideSearch();};document.querySelectorAll('[data-guide-view]').forEach(b=>b.onclick=()=>{guideView=b.dataset.guideView;updateGuideSearch();});$('#guide-search').oninput=e=>{guideQuery=e.target.value;updateGuideSearch();};$('#guide-clear').onclick=()=>{guideQuery='';$('#guide-search').value='';updateGuideSearch();$('#guide-search').focus();};updateGuideSearch();}
 if(r.line&&selected){const target=document.getElementById(r.line);if(target&&$('#main').contains(target)){let parent=target;while(parent&&parent!==$('#main')){if(parent.tagName==='DETAILS')parent.open=true;parent=parent.parentElement;}target.querySelector('.guide-literal')?.setAttribute('open','');target.classList.add('guide-match');requestAnimationFrame(()=>{if(route().tab==='guide')target.scrollIntoView({block:'center'});});}}
}
