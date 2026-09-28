'use strict';
let guideData=null,guideLoading=null,guideQuery='',guideRenderRun=0;
let guideChapters=[],guideSearchIndex=[];const guideNodeIds=new WeakMap();
function guideSearchKey(text){return normalize(text).normalize('NFD').replace(/([a-z])[\u0300-\u036f]+/gi,'$1').normalize('NFC');}
async function loadGuide(){
 if(guideData)return;
 if(!guideLoading)guideLoading=fetch('guideConversationJap.json').then(r=>{if(!r.ok)throw Error('Guide indisponible');return r.json();}).then(data=>{
  guideData=data;guideChapters=[];guideSearchIndex=[];
  for(const part of data.parts){for(const chapter of part.chapters){
   guideChapters.push({part,chapter});let index=0;
   const visit=node=>{if(!node||typeof node!=='object')return;if(Array.isArray(node)){node.forEach(visit);return;}
    if(node.type){const id=`guide-${chapter.id}-${index++}`;guideNodeIds.set(node,id);const text=node.type==='paragraph'?node.text:node.title;
     if(text)guideSearchIndex.push({id,chapter,part,text,search:guideSearchKey(text)});}
    if(node.blocks)visit(node.blocks);if(node.rows)visit(node.rows);if(node.items)visit(node.items);
   };visit(chapter.content);
  }}
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
function guideNodes(nodes,context='Tableau du guide'){
 return (nodes||[]).map(node=>{
  const id=guideNodeIds.get(node)||'';
  if(node.type==='paragraph')return `<div id="${id}">${guideParagraph(node)}</div>`;
  if(node.type==='section'){
   const inside=guideNodes(node.blocks,node.title||context);
   if(!node.title)return `<div id="${id}" class="guide-group">${inside}</div>`;
   return `<details id="${id}" class="guide-section"><summary>${esc(node.title)}</summary><div class="guide-section-body">${inside}</div></details>`;
  }
  if(node.type==='table')return `<div id="${id}" class="guide-table-scroll" tabindex="0" role="region" aria-label="${esc(context)} — tableau défilant"><table class="guide-table"><caption>${esc(context)}</caption><tbody>${node.rows.map(row=>`<tr>${row.map(cell=>`<td>${guideNodes(Array.isArray(cell)?cell:[cell],context)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  if(node.type==='list'){const tag=node.ordered?'ol':'ul';return `<${tag} id="${id}" class="guide-list">${node.items.map(item=>`<li>${guideNodes(item,context)}</li>`).join('')}</${tag}>`;}
  return '';
 }).join('');
}
function guideHome(){
 const order=['Conversation','Les indispensables','Initiation','Introduction'];
 const descriptions={'Conversation':'15 thèmes pour les situations du quotidien et du voyage.','Les indispensables':'Nombres, prononciation, repères et expressions utiles.','Initiation':'21 mini-leçons, dans un parcours indépendant des 98 leçons.','Introduction':'Le guide, le pays, la langue et son écriture.'};
 return `<div id="guide-home-sections">${order.map(title=>{const part=guideData.parts.find(p=>p.title===title);if(!part)return '';return `<section class="panel guide-part"><h2>${esc(title)}</h2><p class="muted">${descriptions[title]}</p><div class="guide-chapters">${part.chapters.map(c=>`<a href="#guide/${encodeURIComponent(c.id)}">${esc(c.title)} <span aria-hidden="true">→</span></a>`).join('')}</div></section>`;}).join('')}</div>`;
}
function updateGuideSearch(){
 const target=document.getElementById('guide-results');if(!target)return;
 const terms=guideSearchKey(guideQuery.trim()).split(/\s+/).filter(Boolean);
 const home=document.getElementById('guide-home-sections');if(home)home.hidden=!!terms.length;
 if(!terms.length){target.innerHTML='';return;}
 const found=guideSearchIndex.filter(row=>terms.every(term=>row.search.includes(term)||guideSearchKey(row.chapter.title).includes(term)));
 target.innerHTML=`<p class="muted" role="status">${found.length} passages trouvés${found.length>50?' · 50 premiers affichés, précisez votre recherche':''}.</p><div class="guide-search-list">${found.slice(0,50).map(row=>`<a href="#guide/${encodeURIComponent(row.chapter.id)}/${row.id}"><strong>${esc(row.part.title)} · ${esc(row.chapter.title)}</strong><span>${esc(row.text.length>230?row.text.slice(0,230)+'…':row.text)}</span></a>`).join('')}</div>`;
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
  content=`<div class="guide-breadcrumb"><a href="#guide">← ${guideQuery?'Retour à la recherche':'Sommaire du guide'}</a><span>${esc(part.title)}</span></div>${intro('GUIDE · '+part.title,chapter.title,'')}<div class="guide-reader">${guideNodes(chapter.content,chapter.title)}${notes.length?`<details class="guide-section"><summary>Notes du chapitre</summary>${notes.map(n=>`<p><strong>Note ${esc(n.number)}.</strong> ${esc(n.text)}</p>`).join('')}</details>`:''}</div><nav class="guide-next" aria-label="Chapitres du guide">${i>0?`<a href="#guide/${siblings[i-1].id}">← ${esc(siblings[i-1].title)}</a>`:''}${i<siblings.length-1?`<a href="#guide/${siblings[i+1].id}">${esc(siblings[i+1].title)} →</a>`:''}</nav>`;
 }else{
  content=intro('CONSULTER · ÉCOUTER · PARLER','Guide de conversation','Un accès par situation, indépendant des leçons et de l’atelier.')+`<div class="toolbar"><label for="guide-search">Chercher dans le guide</label><input id="guide-search" type="search" value="${esc(guideQuery)}" placeholder="Addition, gare, réservation…"><button id="guide-clear">Effacer</button></div><div id="guide-results"></div>${guideHome()}`;
 }
 $('#main').innerHTML=`<div class="guide-module">${content}<details class="guide-about"><summary>À propos de cette édition et des lectures</summary><p>Guide Assimil de Catherine Garnier et Takahashi Nozomi, édition 2013. Texte extrait de votre EPUB ; les tableaux et leur ordre sont conservés. Les informations pratiques et historiques sont celles de cette édition.</p><p>La prononciation reprend les conventions du guide, sans conversion en romaji standard. Le réglage Romaji permet de masquer ou d’afficher ses lignes de prononciation ; Français agit sur les lignes de traduction identifiées. Les explications restent lisibles. Le guide ne fournit pas de ligne kana séparée.</p><p>Cliquez sur une expression entièrement en japonais pour l’écouter en synthèse vocale. Les lectures peuvent varier selon la voix ; les extraits japonais mêlés aux explications ne sont pas lus automatiquement.</p></details></div>`;
 if(!selected){$('#guide-search').oninput=e=>{guideQuery=e.target.value;updateGuideSearch();};$('#guide-clear').onclick=()=>{guideQuery='';$('#guide-search').value='';updateGuideSearch();$('#guide-search').focus();};updateGuideSearch();}
 if(r.line&&selected){const target=document.getElementById(r.line);if(target&&$('#main').contains(target)){let parent=target;while(parent&&parent!==$('#main')){if(parent.tagName==='DETAILS')parent.open=true;parent=parent.parentElement;}target.querySelector('.guide-literal')?.setAttribute('open','');target.classList.add('guide-match');requestAnimationFrame(()=>{if(route().tab==='guide')target.scrollIntoView({block:'center'});});}}
}
