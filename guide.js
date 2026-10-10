'use strict';
let guideData=null,guideLoading=null,guideQuery='',guideRenderRun=0;
let guideView='rubriques',guideFilter='all';
let guideTables=[],guideVocabulary=[];
const guideFavoriteEntries=new Map();
const guideExpressionByNode=new WeakMap(),guideFavoriteAliases=new Map();
let guideDisplayIndex=[];
function guideCanonicalFavorite(id){return guideFavoriteAliases.get(id)||id;}
function guideHasFavorite(id){
 const key=guideCanonicalFavorite(id);
 return favorites.has(key)||[...guideFavoriteAliases].some(([alias,target])=>target===key&&favorites.has(alias));
}
function toggleGuideFavorite(id){
 const key=guideCanonicalFavorite(id),selected=guideHasFavorite(key);
 favorites.delete(key);
 for(const [alias,target] of guideFavoriteAliases)if(target===key)favorites.delete(alias);
 if(!selected)favorites.add(key);
}
// Associer uniquement des groupes explicitement structurés, jamais des voisins devinés.
function buildGuideExpressions(){
 guideFavoriteAliases.clear();
 const rowByNode=new Map(guideSearchIndex.map(row=>[row.node,row]));
 const visit=nodes=>{
  if(!Array.isArray(nodes))return;
  const paragraphs=nodes.every(n=>n.type==='paragraph'&&!n.runs);
  const french=nodes.filter(n=>n.style==='mentioned');
  const japanese=nodes.filter(n=>n.japanese&&/[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(n.text||'')&&!/[a-zA-ZÀ-ÖØ-öø-ÿ]/.test(n.text||''));
  const reading=nodes.filter(n=>n.style==='foreign');
  const literal=nodes.filter(n=>n.style==='literal');
  if(paragraphs&&french.length===1&&japanese.length===1&&reading.length===1&&literal.length<=1&&nodes.length===3+literal.length&&nodes.every(n=>rowByNode.has(n))){
   const first=rowByNode.get(nodes[0]),text=guidePlainText(nodes);
   const expression={...first,type:'Expression',text,search:guideSearchKey(text),nodes,french:french[0],japanese:japanese[0],reading:reading[0]};
   const key=guideFavoriteKey(first.chapter.id,first.id);
   for(const node of nodes){guideExpressionByNode.set(node,expression);guideFavoriteAliases.set(guideFavoriteKey(first.chapter.id,guideNodeIds.get(node)),key);}
  }
  for(const node of nodes){
   // Les lignes des tableaux ont déjà leur favori commun et leur rendu spécifique.
   if(node.type==='table')continue;
   if(node.blocks)visit(node.blocks);
   if(node.items)node.items.forEach(visit);
  }
 };
 for(const {chapter} of guideChapters)visit(chapter.content);
 guideDisplayIndex=guideSearchIndex.flatMap(row=>{
  const expression=guideExpressionByNode.get(row.node);
  return expression?(expression.id===row.id?[expression]:[]):[row];
 });
}
function guideExpressionCard(row){
 const key=guideFavoriteKey(row.chapter.id,row.id);
 return `<article class="guide-theme-entry guide-expression-card">${guideFavoriteStar(key)}<div class="guide-expression-content"><span class="pill">Expression</span>${guideParagraph(row.french,true)}${guideParagraph(row.japanese)}${guideParagraph(row.reading,true)}${row.nodes.filter(n=>n.style==='literal').map(n=>guideParagraph(n,true)).join('')}<small>${esc([row.part.title,row.chapter.title,...row.path].join(' → '))}</small><a href="#guide/${row.chapter.id}/${row.id}">Voir dans le guide →</a></div></article>`;
}
function guideFavoriteKey(chapter,id){return 'guidefav:'+chapter+':'+id;}
function guideFavoriteStar(id){return guideFavoriteEntries.has(id)?star(id):'';}

let guideVocabCategory='all',guideVocabSection='all';
let guideLexiconState={direction:'fr-ja',category:'all',initial:'all'};
let guideChapters=[],guideSearchIndex=[];const guideNodeIds=new WeakMap();
// Libellés dont les morceaux ont été accolés lors de l’extraction du Guide.
const guideSeparatedLabels={
 'version nom':['version nom','Emploi comme pronom'],
 'version adjectif':['version adjectif','Emploi devant un nom'],
 'version adverbe':['version adverbe','Indication de lieu'],
 'prêters/sh':['prêter','Repère : s / sh'],
 'marcherk':['marcher','Repère : k'],
 'nagerg':['nager','Repère : g'],
 'lirem':['lire','Repère : m'],
 'attendret/ts/ch':['attendre','Repère : t / ts / ch'],
 'acheterpas de consonne[note 1]':['acheter','Pas de consonne [note 1]'],
 'rentrerr':['rentrer','Repère : r'],
 'manger(Type 1)':['manger','Type 1'],
 'allervenir':['aller / venir','']
};
const guideLabelHelp={
 'version nom':'Remplace le nom de la chose : kore, sore, are (« ceci, cela »). Exemple : これは本です。 Kore wa hon desu. — Ceci est un livre.',
 'version adjectif':'Se place devant un nom, qu’il faut ajouter : kono, sono, ano. Exemple : この本 — kono hon — ce livre-ci. On ne dit pas kono tout seul.',
 'version adverbe':'Désigne un lieu : koko, soko, asoko (« ici, là, là-bas »). Exemple : ここにいます。 Koko ni imasu. — Je suis ici.',
 'prêters/sh':'s / sh : la consonne change selon la forme. kasu → kashimasu.',
 'marcherk':'k : la consonne se retrouve dans aruku → arukimasu. La forme en て est aruite.',
 'nagerg':'g : la consonne se retrouve dans oyogu → oyogimasu. La forme en て est oyoide.',
 'lirem':'m : la consonne se retrouve dans yomu → yomimasu. La forme en て est yonde.',
 'attendret/ts/ch':'t / ts / ch : les consonnes varient selon la forme. matsu → machimasu → matte.',
 'acheterpas de consonne[note 1]':'Pas de consonne entre les voyelles dans kau → kaimasu. La forme en て est katte. Voir aussi la note 1 du chapitre.',
 'rentrerr':'r : la consonne se retrouve dans kaeru → kaerimasu. La forme en て est kaette.',
 'manger(Type 1)':'Type 1, selon le classement du Guide : on garde la base tabe et on change la terminaison. taberu → tabemasu → tabete → tabeta.'
};
// Le français et la prononciation sont distincts dans les fragments source.
function guideDemonstrativeParts(node){
 if(!['これ','それ','あれ','この','その','あの','ここ','そこ','あそこ'].includes(node?.japanese)||!node.runs)return null;
 const reading=node.runs.filter(r=>r.style==='foreign').map(r=>r.text).join(' ');
 const french=node.runs.filter(r=>r.style==='mentioned').map(r=>r.text).join(' ');
 return reading&&french?{reading,french}:null;
}
// Métadonnées de présentation : ne modifient ni la source ni ses identifiants.
function guideTableHeading(node,chapter){
 const verb=['Sens / verbe','Forme polie en ます','Forme du dictionnaire','Forme en て','Forme en た'];
 const special={
  'tpc-5':['Repère','Information'],
  'tpc-13':['Temps / affirmation ou négation','Terminaison verbale polie','Forme de です'],
  'tpc-22':verb,'tpc-23':verb,
  'tpc-28':['Forme','Japonais et prononciation'],
  'tpc-31':['Notation du guide','Comment prononcer']
 };
 // La source omet la case supérieure gauche de ces trois tableaux.
 const existing={'tpc-24':'Emploi','tpc-29':'Sens','tpc-30':'Nombre'};
 if(existing[chapter])return {labels:[existing[chapter]],sourceHeader:node.rows[0],rows:node.rows.slice(1)};
 const labels=special[chapter]||(node.rows.every(row=>row.length===3)?['Français','Japonais','Prononciation']:[]);
 return {labels,rows:node.rows};
}
// Gloses françaises des formes grammaticales sans traduction dans leur cellule.
// Les tableaux de vocabulaire ont déjà leur colonne française ; les nombres et
// démonstratifs possèdent déjà leur sens dans la source.
function guideTableFrench(chapter,row,rowIndex,column){
 if(column===0)return '';
 if(chapter==='tpc-28')return [
  'C’est intéressant / amusant. (Forme polie.)',
  'C’est intéressant / amusant. (Forme simple.)',
  'Ce n’est pas intéressant / amusant. (Forme polie.)',
  'Intéressant / amusant et… ; comme c’est intéressant / amusant… (Selon la suite.)'
 ][rowIndex]||'';
 if(chapter==='tpc-13')return (column===1?[
  'Terminaison polie : action présente, habituelle ou future.',
  'Terminaison polie : ne… pas (présent ou futur).',
  'Terminaison polie : action passée.',
  'Terminaison polie : ne… pas (passé).'
 ]:[
  'C’est… / ce sera… (Selon le contexte.)',
  'Ce n’est pas… / ce ne sera pas…',
  'C’était…',
  'Ce n’était pas…'
 ])[rowIndex]||'';
 if(chapter==='tpc-29')return (rowIndex===0?[
  '', 'Aller / venir. (Formes polies ordinaires.)',
  'Aller / venir / être là. (Forme honorifique : personne dont on parle avec respect.)',
  'Aller / venir. (Forme humble : soi-même ou son groupe.)'
 ]:[
  '', 'C’est… (Forme polie ordinaire.)',
  'C’est… (Forme honorifique : personne dont on parle avec respect.)',
  'C’est… (Forme très polie.)'
 ])[column]||'';
 if(['tpc-22','tpc-23'].includes(chapter)){
  const forms={
   manger:['mange','mangerai','mangé'],faire:['fais','ferai','fait'],
   venir:['viens','viendrai','venu(e)'],prêter:['prête','prêterai','prêté'],
   marcher:['marche','marcherai','marché'],nager:['nage','nagerai','nagé'],
   lire:['lis','lirai','lu'],attendre:['attends','attendrai','attendu'],
   acheter:['achète','achèterai','acheté'],rentrer:['rentre','rentrerai','rentré(e)'],
   aller:['vais','irai','allé(e)']
  };
  const verb=Object.keys(forms).find(v=>guidePlainText(row[0]).startsWith(v));
  if(!verb)return '';
  const [present,future,past]=forms[verb],aux=['venir','rentrer','aller'].includes(verb)?'Je suis ':'J’ai ';
  if(column===1||column===2)return `Je ${present} / je ${future}. (${column===1?'Poli':'Simple'} ; sujet selon le contexte.)`;
  if(column===3)return `${verb[0].toUpperCase()+verb.slice(1)} — forme de liaison ; le sens dépend de la suite.`;
  if(column===4)return aux+past+'. (Forme simple du passé ; sujet selon le contexte.)';
 }
 return '';
}
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
  buildGuideExpressions();
  buildGuideVocabulary();
  guideFavoriteEntries.clear();
  for(const row of guideSearchIndex){
   if(!['paragraph','table'].includes(row.node.type))continue;
   const key=guideFavoriteKey(row.chapter.id,row.id);
   guideFavoriteEntries.set(key,{key,chapter:row.chapter.id,target:row.id,type:row.type,title:[row.chapter.title,...row.path].join(' → '),text:row.text});
  }
  for(const row of guideDisplayIndex.filter(row=>row.nodes)){
   const key=guideFavoriteKey(row.chapter.id,row.id);
   guideFavoriteEntries.set(key,{key,chapter:row.chapter.id,target:row.id,type:'Expression',title:[row.chapter.title,...row.path].join(' → '),text:row.text});
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
function guideParagraph(node,marked=false){
 const text=String(node.text||'');
 const japanese=/[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(text)&&!/[a-zA-ZÀ-ÖØ-öø-ÿ]/.test(text);
 const pronunciation=node.style==='foreign'&&!node.runs;
 const translation=node.style==='mentioned'&&!node.runs;
 const cls=japanese?'guide-japanese':pronunciation?'romaji guide-pronunciation':translation?'fr guide-translation':'';
 // Le texte original reste la référence : les champs extraits peuvent fusionner des phrases.
 const content=japanese?jp(text):marked?guideMarked(text):esc(text);
 if(japanese)return `<p class="${cls}" lang="ja"><button class="guide-speak" data-speak="${esc(text.replace(/\s*\/\s*/g,'、'))}" aria-label="Écouter : ${esc(text)}">${content}<span aria-hidden="true"> ♪</span></button></p>`;
 if(node.style==='literal'&&!node.runs)return `<details class="guide-literal"><summary>Mot à mot</summary><p class="fr">${content}</p></details>`;
 return `<p class="${cls}">${content}</p>`;
}
function guideNodes(nodes,context='Tableau du guide',inTable=false,separateSections=false){
 const expression=!inTable&&nodes?.length?guideExpressionByNode.get(nodes[0]):null;
 if(expression&&expression.nodes.length===nodes.length&&nodes.every((node,i)=>node===expression.nodes[i])){
  return `<div class="guide-expression guide-favorite-block">${guideFavoriteStar(guideFavoriteKey(expression.chapter.id,expression.id))}${nodes.map(node=>`<div id="${guideNodeIds.get(node)}">${guideParagraph(node)}</div>`).join('')}</div>`;
 }
 return (nodes||[]).map(node=>{
  const id=guideNodeIds.get(node)||'';
  const chapter=id.match(/^guide-(tpc-\d+)-/)?.[1];
  const favorite=guideFavoriteStar(guideFavoriteKey(chapter,id));
  const demonstrative=inTable&&chapter==='tpc-24'?guideDemonstrativeParts(node):null;
  if(demonstrative)return `<div id="${id}"><p><span lang="ja">${guideMarked(node.japanese)}</span> <span class="guide-pronunciation">${guideMarked(demonstrative.reading)}</span></p><p class="guide-table-french" lang="fr">${guideMarked(demonstrative.french)}</p></div>`;
  if(inTable&&node.type==='paragraph'&&guideSeparatedLabels[node.text]){
   const [label,note]=guideSeparatedLabels[node.text];
   return `<div id="${id}">${note?`<details class="guide-label-help"><summary aria-label="${esc(label)} : explication">${guideMarked(label)} <span class="guide-label-info" aria-hidden="true">ⓘ</span></summary><p>${esc(guideLabelHelp[node.text]||note)}</p></details>`:`<p>${guideMarked(label)}</p>`}</div>`;
  }
  if(node.type==='paragraph')return `<div id="${id}" class="${inTable?'':'guide-favorite-block'}">${!inTable?favorite:''}${guideParagraph(node)}</div>`;
  if(node.type==='section'){
   // Dans les journées, les notes et exercices sont des rubriques sœurs du dialogue.
   const siblings=separateSections?(node.blocks||[]).filter(n=>n.type==='section'&&n.title):[];
   const inside=guideNodes((node.blocks||[]).filter(n=>!siblings.includes(n)),node.title||context,inTable);
   if(!node.title)return `<div id="${id}" class="guide-group">${inside}</div>`;
   return `<details id="${id}" class="guide-section"><summary>${esc(node.title)}</summary><div class="guide-section-body">${inside}</div></details>${guideNodes(siblings,context,inTable)}`;
  }
  if(node.type==='table'){
   const heading=guideTableHeading(node,chapter);
   const headers=heading.labels.map(label=>`<th scope="col">${esc(label)}</th>`).join('')+(heading.sourceHeader?heading.sourceHeader.map((cell,index)=>`<th scope="col">${guideNodes(Array.isArray(cell)?cell:[cell],context,true)}${chapter==='tpc-24'?`<p class="guide-demonstrative-distance">${['Près de moi','Près de mon interlocuteur','Là-bas, loin de nous deux'][index]}</p>`:''}</th>`).join(''):'');
   return `<div id="${id}" class="guide-table-scroll" tabindex="0" role="region" aria-label="${esc(context)} — tableau défilant"><table class="guide-table"><caption>${esc(context)} ${favorite}</caption><thead><tr>${headers}</tr></thead><tbody>${heading.rows.map((row,rowIndex)=>{const nodes=row.flatMap(c=>Array.isArray(c)?c:[c]);const anchor=nodes.find(n=>n.japanese)||nodes.find(n=>guideNodeIds.has(n));const rowStar=anchor?guideFavoriteStar(guideFavoriteKey(chapter,guideNodeIds.get(anchor))):'';return `<tr>${row.map((cell,i)=>`<td>${i===0&&nodes.some(n=>guideSeparatedLabels[n.text])?`<div class="guide-label-cell"><div>${guideNodes(Array.isArray(cell)?cell:[cell],context,true)}</div>${rowStar}</div>`:`${i===0?rowStar:''}${guideNodes(Array.isArray(cell)?cell:[cell],context,true)}`}${guideTableFrench(chapter,row,rowIndex,i)?`<p class="guide-table-french" lang="fr">${esc(guideTableFrench(chapter,row,rowIndex,i))}</p>`:''}</td>`).join('')}</tr>`;}).join('')}</tbody></table></div>`;
  }
  if(node.type==='list'){const tag=node.ordered?'ol':'ul';return `<${tag} id="${id}" class="guide-list">${node.items.map(item=>`<li${item.some(n=>n.type==='paragraph'&&n.japanese)&&item.some(n=>n.style==='mentioned'&&!n.runs)?' class="guide-phrase"':''}>${guideNodes(item,context,inTable)}</li>`).join('')}</${tag}>`;}
  return '';
 }).join('');
}
function guideHome(){
 const order=['Introduction','Initiation','Conversation','Les indispensables'];
 const descriptions={'Conversation':'15 thèmes pour les situations du quotidien et du voyage.','Les indispensables':'Nombres, prononciation, repères et expressions utiles.','Initiation':'21 mini-leçons, dans un parcours indépendant des 98 leçons.','Introduction':'Le guide, le pays, la langue et son écriture.'};
 return `<div id="guide-home-sections">${order.map(title=>{const part=guideData.parts.find(p=>p.title===title);if(!part)return '';return `<details class="panel guide-part" open><summary>${esc(title)}</summary><p class="muted">${descriptions[title]}</p><div class="guide-chapters">${part.chapters.map(c=>`<a href="#guide/${encodeURIComponent(c.id)}">${esc(c.title)} <span aria-hidden="true">→</span></a>`).join('')}</div></details>`;}).join('')}</div>`;
}
function guidePlainText(node){
 if(Array.isArray(node))return node.map(guidePlainText).filter(Boolean).join(' · ');
 if(!node||typeof node!=='object')return '';
 const demonstrative=guideDemonstrativeParts(node);
 if(demonstrative)return [node.japanese,demonstrative.reading,demonstrative.french].join(' · ');
 return (guideSeparatedLabels[node.text]?.filter(Boolean).join(' — ')||node.text)||[node.title,guidePlainText(node.blocks),guidePlainText(node.rows),guidePlainText(node.items)].filter(Boolean).join(' · ');
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
 // Une répétition exacte dans le même chapitre n'ajoute pas une seconde entrée.
 // Les contextes de chapitres différents restent accessibles par leurs catégories.
 const entryKey=v=>JSON.stringify([v.table.chapter.id,...[v.french,v.japanese,v.reading].map(t=>String(t).normalize('NFC').trim().replace(/\s+/g,' '))]);
 const existing=new Set(guideVocabulary.map(entryKey));
 for(const row of guideDisplayIndex.filter(row=>row.nodes)){
  const entry={id:row.id+'-expression',sourceId:row.id,table:row,section:row.path.at(-1)||row.chapter.title,
   japanese:row.japanese.text,spoken:row.japanese.text.replace(/\s*\/\s*/g,'、'),reading:row.reading.text,french:row.french.text};
  entry.search=guideSearchKey([entry.french,entry.japanese,entry.reading,row.chapter.title,entry.section].join(' '));
  const key=entryKey(entry);if(existing.has(key))continue;
  existing.add(key);guideVocabulary.push(entry);
 }
 guideViewLabels.vocabulaire.count=guideViewLabels.lexique.count=String(guideVocabulary.length);

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
 target.innerHTML=`<p class="muted" role="status">${rows.length} ${rows.length===1?'entrée':'entrées'} · mots et expressions</p><p class="muted guide-vocab-note">Mots des tableaux et expressions complètes du Guide. Prononciation et traductions conservées telles qu’elles figurent dans la source ; certains textes extraits comportent des espacements irréguliers. Le lien permet de consulter le contexte et les notes.</p>${rows.length?content:'<p class="panel">Aucun mot trouvé. Changez la recherche ou la catégorie.</p>'}`;
}
function updateGuideSearch(){
 const target=document.getElementById('guide-results');if(!target)return;
 const terms=guideSearchKey(guideQuery.trim()).split(/\s+/).filter(Boolean);
 const tables=guideView==='tableaux',vocabulary=guideView==='vocabulaire',themes=guideView==='themes',lexicon=guideView==='lexique';
 $('#guide-home-sections').hidden=tables||vocabulary||themes||lexicon||!!terms.length;
 $('#guide-vocab-category-filter').hidden=!vocabulary;
 $('#guide-vocab-section-filter').hidden=true;
 $('#guide-table-filter').hidden=!tables;
 $('#guide-lexicon-controls').hidden=!lexicon;
 $('#guide-search').placeholder=lexicon?(guideLexiconState.direction==='fr-ja'?'Un mot ou une expression en français…':'Japonais ou prononciation du Guide…'):'Addition, gare, réservation…';
 updateGuideControlsHeading();
 document.querySelectorAll('[data-guide-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.guideView===guideView)));
 if(lexicon){updateGuideLexicon();return;}
 if(themes){updateGuideThemes();return;}
 if(vocabulary){updateGuideVocabulary();return;}
 if(!terms.length&&!tables){target.innerHTML='';return;}
 const found=(tables?guideTables:guideDisplayIndex).filter(row=>(!tables||guideFilter==='all'||row.category===guideFilter)&&terms.every(term=>row.search.includes(term)||row.context.includes(term)));
 found.sort((a,b)=>terms.reduce((sum,t)=>sum+(b.context.includes(t)?3:0)-(a.context.includes(t)?3:0),0));
 const shown=found.slice(0,tables?113:60);
 const renderResult=row=>{
  if(row.nodes)return guideExpressionCard(row);
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
 if(r.id==='recherche'){renderCorpusRecord(r.line);return;}
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
  content=`<div class="guide-breadcrumb"><a data-context-return href="#guide">← ${guideView==='lexique'?'Retour au lexique':guideView==='themes'?'Retour aux thèmes':guideView==='vocabulaire'?'Retour au vocabulaire':guideView==='tableaux'?'Retour aux tableaux':guideQuery?'Retour à la recherche':'Sommaire du guide'}</a><span>${esc(part.title)}</span></div>${intro('GUIDE · '+part.title,chapter.title,'')}<div class="guide-reader">${guideNodes(chapter.content,chapter.title,false,part.title==='Initiation')}${notes.length?`<details class="guide-section"><summary>Notes du chapitre</summary>${notes.map(n=>`<p><strong>Note ${esc(n.number)}.</strong> ${esc(n.text)}</p>`).join('')}</details>`:''}</div><nav class="guide-next" aria-label="Chapitres du guide">${i>0?`<a href="#guide/${siblings[i-1].id}">← ${esc(siblings[i-1].title)}</a>`:''}${i<siblings.length-1?`<a href="#guide/${siblings[i+1].id}">${esc(siblings[i+1].title)} →</a>`:''}</nav>`;
 }else{
  content=intro('CONSULTER · ÉCOUTER · PARLER','Guide de conversation','Un accès par situation, indépendant des leçons et de l’atelier.')+`<div class="toolbar"><label for="guide-search">Chercher dans le guide</label><input id="guide-search" type="search" value="${esc(guideQuery)}" placeholder="Addition, gare, réservation…"><button id="guide-clear">Effacer</button></div><div class="guide-tools" role="group" aria-label="Explorer le guide"><button type="button" data-guide-view="rubriques" aria-pressed="true">Rubriques</button><button type="button" data-guide-view="tableaux" aria-pressed="false">Tableaux · 113</button><button type="button" data-guide-view="vocabulaire" aria-pressed="false">Vocabulaire · ${guideVocabulary.length}</button><button type="button" data-guide-view="lexique" aria-pressed="false">Lexique · ${guideVocabulary.length}</button><button type="button" data-guide-view="themes" aria-pressed="false">Thèmes · 13</button><label id="guide-table-filter" hidden>Catégorie <select id="guide-category"><option value="all">Tous les tableaux</option><option value="grammar">Notes de grammaire</option><option value="numbers">Nombres et temps</option><option value="conversation">Conversation et vocabulaire</option><option value="other">Autres repères</option></select></label><label id="guide-vocab-category-filter" hidden>Catégorie <select id="guide-vocab-category"><option value="all">Toutes les catégories</option>${guideVocabCategories().map(({chapter})=>`<option value="${chapter.id}">${esc(chapter.title)} · ${guideVocabulary.filter(v=>v.table.chapter.id===chapter.id).length}</option>`).join('')}</select></label><label id="guide-vocab-section-filter" hidden>Sous-catégorie <select id="guide-vocab-section"></select></label></div><div id="guide-lexicon-controls" hidden><div class="toolbar"><label>Sens <select id="guide-lexicon-direction"><option value="fr-ja">Français → Japonais</option><option value="ja-fr">Japonais → Français</option></select></label><label>Catégorie <select id="guide-lexicon-category"><option value="all">Toutes les catégories</option>${guideVocabCategories().map(({chapter})=>`<option value="${chapter.id}">${esc(chapter.title)}</option>`).join('')}</select></label></div><p id="guide-lexicon-order" class="muted"></p><div id="guide-lexicon-alphabet" class="guide-lexicon-alphabet" role="group" aria-label="Filtrer par initiale"></div></div><div id="guide-results"></div>${guideHome()}`;
 }
 $('#main').innerHTML=`<div class="guide-module">${content}<details class="guide-about"><summary>À propos du guide et des lectures</summary><p>Le Guide de conversation rassemble des expressions et des repères pour les situations du quotidien et du voyage. Les informations pratiques et historiques peuvent ne plus être à jour.</p><p>La prononciation reprend les conventions du guide, sans conversion en romaji standard. Le réglage Romaji permet de masquer ou d’afficher ses lignes de prononciation ; Français agit sur les lignes de traduction identifiées. Les explications restent lisibles. Le guide ne fournit pas de ligne kana séparée.</p><p>Cliquez sur une expression entièrement en japonais pour l’écouter en synthèse vocale. Les lectures peuvent varier selon la voix ; les extraits japonais mêlés aux explications ne sont pas lus automatiquement.</p></details></div>`;
 if(!selected){organizeGuideControls();$('#guide-lexicon-direction').value=guideLexiconState.direction;$('#guide-lexicon-category').value=guideLexiconState.category;$('#guide-lexicon-direction').onchange=e=>{guideLexiconState.direction=e.target.value;guideLexiconState.initial='all';updateGuideSearch();};$('#guide-lexicon-category').onchange=e=>{guideLexiconState.category=e.target.value;guideLexiconState.initial='all';updateGuideSearch();};$('#guide-vocab-category').value=guideVocabCategory;$('#guide-vocab-category').onchange=e=>{guideVocabCategory=e.target.value;guideVocabSection='all';updateGuideSearch();};$('#guide-vocab-section').onchange=e=>{guideVocabSection=e.target.value;updateGuideSearch();};$('#guide-category').value=guideFilter;$('#guide-category').onchange=e=>{guideFilter=e.target.value;updateGuideSearch();};document.querySelectorAll('[data-guide-view]').forEach(b=>b.onclick=()=>{guideView=b.dataset.guideView;updateGuideSearch();});$('#guide-search').oninput=e=>{guideQuery=e.target.value;if(guideView==='lexique')guideLexiconState.initial='all';updateGuideSearch();};$('#guide-clear').onclick=()=>{guideQuery='';if(guideView==='lexique')guideLexiconState.initial='all';$('#guide-search').value='';updateGuideSearch();$('#guide-search').focus();};updateGuideSearch();}
 if(r.line&&selected){const target=document.getElementById(r.line);if(target&&$('#main').contains(target)){let parent=target;while(parent&&parent!==$('#main')){if(parent.tagName==='DETAILS')parent.open=true;parent=parent.parentElement;}target.querySelector('.guide-literal')?.setAttribute('open','');target.classList.add('guide-match');requestAnimationFrame(()=>{if(route().tab==='guide')target.scrollIntoView({block:'center'});});}}
 window.updateNavigationTab?.();
}

function updateGuideLexicon(){
 const state=guideLexiconState,reverse=state.direction==='ja-fr';
 const result=GuideLexicon.select(guideVocabulary,{...state,query:guideQuery});
 $('#guide-lexicon-order').textContent=reverse?'Ordre alphabétique de la prononciation du Guide. Recherche en japonais ou dans cette prononciation.':'Ordre alphabétique français. Recherche dans les mots et expressions français.';
 const alphabet=['all',...'ABCDEFGHIJKLMNOPQRSTUVWXYZ',...(result.initials.has('#')||state.initial==='#'?['#']:[])];
 $('#guide-lexicon-alphabet').innerHTML=alphabet.map(letter=>`<button type="button" data-lexicon-letter="${letter}" aria-pressed="${state.initial===letter}" ${letter!=='all'&&!result.initials.has(letter)&&state.initial!==letter?'disabled':''}>${letter==='all'?'Toutes':letter}</button>`).join('');
 $('#guide-lexicon-alphabet').querySelectorAll('button').forEach(b=>b.onclick=()=>{guideLexiconState.initial=b.dataset.lexiconLetter;updateGuideLexicon();document.querySelector(`[data-lexicon-letter="${guideLexiconState.initial}"]`)?.focus({preventScroll:true});});
 const entry=v=>{
  const french=`<p class="fr lexicon-french">${guideMarked(v.french)}</p>`;
  const reading=`<p class="romaji guide-pronunciation">${guideMarked(v.reading)}</p>`;
  const japanese=`<button class="guide-speak guide-japanese" lang="ja" data-speak="${esc(v.spoken)}" aria-label="Écouter : ${esc(v.spoken)}">${guideMarked(v.japanese)} <span aria-hidden="true">♪</span></button>`;
  return `<article class="guide-lexicon-row" data-lexicon-id="${esc(v.id)}">${reverse?`<div>${reading}${japanese}</div>${french}`:`${french}<div>${japanese}${reading}</div>`}<div class="guide-vocab-source">${guideFavoriteStar(guideFavoriteKey(v.table.chapter.id,v.sourceId))}<small>${esc(v.table.chapter.title)} · ${esc(v.section)}</small><a href="#guide/${v.table.chapter.id}/${v.sourceId}">Voir dans le guide →</a></div></article>`;
 };
 $('#guide-results').innerHTML=`<p class="muted" role="status">${result.rows.length} ${result.rows.length===1?'entrée':'entrées'}${state.initial!=='all'?' · lettre '+esc(state.initial):''} · mots et expressions</p><p class="muted">Prononciation du Guide conservée, sans conversion en romaji standard. Les accents et la casse sont ignorés pour le tri et la recherche ; les textes affichés restent ceux du Guide.</p>${result.rows.length?`<div class="guide-lexicon-list">${result.rows.map(entry).join('')}</div>`:'<p class="panel">Aucun résultat. Essayez une autre recherche, une autre catégorie ou « Toutes » dans les lettres.</p>'}`;
}

// Les accès choisissent une vue ; ses commandes restent dans un panneau identifié.
const guideViewLabels={
 rubriques:{label:'Chapitres',count:'',title:'Les chapitres du Guide',description:'Parcourir le Guide dans l’ordre de ses rubriques : introduction, initiation, conversation et indispensables.',search:'Chercher dans tout le Guide',family:'browse'},
 themes:{label:'Situations et thèmes',count:'13',title:'Le Guide par situation et par thème',description:'Repas, transports, logement, rencontres… Choisissez une situation pour retrouver les passages utiles.',search:'Chercher dans les situations et thèmes',family:'browse'},
 tableaux:{label:'Tableaux',count:'113',title:'Les tableaux du Guide',description:'Consulter les tableaux de conversation, de vocabulaire et de grammaire. Filtrez-les par catégorie.',search:'Chercher dans les tableaux',family:'browse'},
 vocabulaire:{label:'Vocabulaire',count:'',title:'Le vocabulaire par catégorie',description:'Parcourir les mots et expressions regroupés par sujet. Pour un classement alphabétique, choisissez Lexique A–Z.',search:'Chercher dans le vocabulaire',family:'words'},
 lexique:{label:'Lexique A–Z',count:'',title:'Le lexique français ↔ japonais',description:'Retrouver un mot ou une expression par ordre alphabétique, en français ou dans la prononciation du Guide.',search:'Chercher dans le lexique',family:'words'}
};
function organizeGuideControls(){
 const navigation=$('.guide-tools'),search=$('#guide-search').closest('.toolbar');
 const buttons=new Map([...navigation.querySelectorAll('[data-guide-view]')].map(b=>[b.dataset.guideView,b]));
 const panel=document.createElement('section');panel.id='guide-active-tools';panel.setAttribute('aria-labelledby','guide-active-title');
 panel.innerHTML='<div class="guide-controls-heading"><div><h2 id="guide-active-title"></h2><p id="guide-active-description"></p></div><div class="guide-active-filters"></div></div>';
 const filters=panel.querySelector('.guide-active-filters');
 for(const id of ['guide-table-filter','guide-vocab-category-filter','guide-vocab-section-filter'])filters.append(document.getElementById(id));
 filters.querySelector('#guide-table-filter').firstChild.textContent='Catégorie de tableaux ';
 filters.querySelector('#guide-vocab-category-filter').firstChild.textContent='Catégorie de vocabulaire ';
 navigation.replaceChildren();navigation.classList.add('guide-view-navigation');
 const primary=document.createElement('div');primary.className='guide-primary-views guide-view-buttons';
 for(const view of ['rubriques','themes','vocabulaire','tableaux','lexique']){
  const b=buttons.get(view),meta=guideViewLabels[view];
  b.dataset.family=meta.family;b.innerHTML=esc(meta.label);
  primary.append(b);
 }
 navigation.append(primary);
 navigation.after(panel);panel.append(search,$('#guide-lexicon-controls'));
}
function updateGuideControlsHeading(){
 const meta=guideViewLabels[guideView];
 $('#guide-active-tools').dataset.family=meta.family;
 $('#guide-active-title').textContent=meta.title;
 $('#guide-active-description').textContent=meta.description;
 document.querySelector('label[for="guide-search"]').textContent=meta.search;
}
