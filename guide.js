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
  const explicit=guideEditorial.expressions[guideNodeIds.get(nodes[0])]?.explicitGroup;
  const paragraphs=nodes.every(n=>n.type==='paragraph'&&(!n.runs||explicit));
  const french=nodes.filter(n=>n.style==='mentioned');
  if(explicit&&!french.length)french.push({type:'paragraph',style:'mentioned',text:''});
  const japanese=nodes.filter(n=>n.japanese&&/[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(n.text||'')&&(!/[a-zA-ZÀ-ÖØ-öø-ÿ]/.test(n.text||'')||['guide-tpc-49-7','guide-tpc-42-438','guide-tpc-35-73'].includes(guideNodeIds.get(n))));
  const reading=nodes.filter(n=>n.style==='foreign');
  const literal=nodes.filter(n=>n.style==='literal');
  if(paragraphs&&french.length===1&&japanese.length===1&&reading.length===1&&literal.length<=1&&(nodes.length===3+literal.length||explicit)&&nodes.every(n=>rowByNode.has(n))){
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
// Trois groupes relus : séparation éditoriale explicite, sans toucher aux dialogues.
const guideReviewedExpressions={
 'guide-tpc-36-177':['Je suis célibataire. / Je suis marié(e).','独身 です。 / 結婚 して います。','dokushin’ dès(u) / kèk’kon shité imas(u)'],
 'guide-tpc-36-307':['Je suis employé(e) chez Toyota. / Je suis au chômage.','トヨタ の 社員 です。 / 失業者 です。','toyota no sha.in dès(u) / shitsugyôsha dès(u)'],
 'guide-tpc-36-311':['Je suis photographe. / Je suis retraité(e).','写真家 です。 / 退職 しました。','shashin’ka dès(u) / taïshoku shimash(i)ta']
};
function guideExpressionVariants(row){
 const edit=guideEditorial.expressions[row.id];
 if(edit)return edit.parts.map((part,i)=>({french:guideEditorialClone(row.french,part[0],'mentioned',row.id+'-fr-'+i),japanese:guideEditorialClone(row.japanese,part[1],undefined,row.id+'-ja-'+i),reading:guideEditorialClone(row.reading,part[2],'foreign',row.id+'-rd-'+i)}));

 const source=guideReviewedExpressions[row.id],nodes=[row.french,row.japanese,row.reading];
 if(!source||!nodes.every((n,i)=>n.text===source[i])){const adapted=nodes.map(guideAdaptNode);return adapted.some((n,i)=>n!==nodes[i])?[{...row,french:adapted[0],japanese:adapted[1],reading:adapted[2]}]:[row];}
 const parts=source.map(text=>text.split(' / '));
 return [0,1].map(i=>({french:{...row.french,text:parts[0][i]},japanese:{...row.japanese,text:parts[1][i],japanese:parts[1][i]},reading:{...row.reading,text:parts[2][i]}}));
}
function guideExpressionVariantBody(row,anchors=false){
 const edit=guideEditorial.expressions[row.id],kind=edit?.kind;
 const variants=guideExpressionVariants(row),literal=row.nodes.find(n=>n.style==='literal');
 const gloss=literal?.text.split(/\s*\/\s*/);
 const splitGloss=gloss?.length===variants.length;
 const body=variants.map((v,i)=>`<div class="guide-expression-variant">${kind==='dialogue'?`<small class="guide-role">${i===0?'Question':'Réponse'}</small>`:kind==='sequence'?`<small class="guide-role">Phrase ${i+1} · même prise de parole</small>`:''}${['french','japanese','reading'].map(role=>guideParagraph(v[role],role!=='japanese')).join('')}${splitGloss?guideParagraph(guideEditorialClone(literal,gloss[i],'literal',row.id+'-literal-'+i),true):''}</div>`).join('');
 return (anchors?row.nodes.map(n=>`<span id="${guideNodeIds.get(n)}"></span>`).join(''):'')+body+guideEditorialNote(row.id)+row.nodes.filter(n=>n.style==='literal'&&!splitGloss).map(n=>guideParagraph(n,true)).join('');
}
function guideExpressionCard(row){
 const key=guideFavoriteKey(row.chapter.id,row.id);
 const body=guideExpressionVariants(row).length>1?guideExpressionVariantBody(row):`${guideParagraph(row.french,true)}${guideParagraph(row.japanese)}${guideParagraph(row.reading,true)}`;
 return `<article class="guide-theme-entry guide-expression-card">${guideFavoriteStar(key)}<div class="guide-expression-content"><span class="pill">Expression</span>${body}${guideExpressionVariants(row).length>1?'':row.nodes.filter(n=>n.style==='literal').map(n=>guideParagraph(n,true)).join('')}<small>${esc([row.part.title,row.chapter.title,...row.path].join(' → '))}</small><a href="#guide/${row.chapter.id}/${row.id}">Voir dans le guide →</a></div></article>`;
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
  if(column===1||column===2)return `Je ${present} / je ${future}.`;
  if(column===3)return `${verb[0].toUpperCase()+verb.slice(1)}…`;
  if(column===4)return aux+past+'.';
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
  for(const row of guideSearchIndex){row.text=guidePlainText(row.node);row.search=guideSearchKey(row.text);}
  buildGuideExpressions();
  for(const row of guideDisplayIndex){const extra=row.nodes?guideExpressionVariants(row).flatMap(v=>[v.french.text,v.japanese.text,v.reading.text]).join(' '):guideAdaptNode(row.node).text||'';row.search=guideSearchKey(row.text+' '+extra);if(row.nodes)row.text=extra;}
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
function guideNoteMarkup(text,node,format=guideMarked){
 return String(text).split(/(\[note \d+\])/gi).map(part=>{
  const match=part.match(/^\[note (\d+)\]$/i);if(!match)return format(part);
  const note=guideData?.footnotes.find(n=>String(n.number)===match[1]);if(!note)return format(part);
  const id=(typeof node==='string'?node:guideNodeIds.get(node)||'guide')+'-note-'+match[1];
  return `<button type="button" class="guide-note-call" popovertarget="${id}" aria-label="Lire la note ${match[1]}">[${match[1]}]</button><span popover id="${id}" class="guide-note-popover" lang="fr"><strong>Note ${match[1]}</strong><span>${esc(ExplanationReadings.explain(note.text))}</span><button type="button" popovertarget="${id}" popovertargetaction="hide">Fermer</button></span>`;
 }).join('');
}
function guideReadingText(node){
 return node.runs&&node.runs.every(r=>!r.style||['foreign','stage'].includes(r.style))?node.runs.map(r=>r.text).join(' '):node.text;
}
function guideParagraph(node,marked=false){
 const id=guideNodeIds.get(node);return guideParagraphContent(guideAdaptNode(node),marked)+guideEditorialNote(id);
}
function guideParagraphContent(node,marked=false){
 const text=String(node.text||''),clean=text.replace(/\[note \d+\]/gi,'').trim();
 const japanese=/[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(guideSpoken(clean))&&!/[a-zA-ZÀ-ÖØ-öø-ÿ]/.test(guideSpoken(clean));
 const pronunciation=!/[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(clean)&&['foreign','stage'].includes(node.style)&&(!node.runs||node.runs.every(r=>!r.style||['foreign','stage'].includes(r.style)));
 const translation=node.style==='mentioned'&&(!node.runs||node.runs.every(r=>!r.style||['mentioned','note_call'].includes(r.style)));
 const format=marked?guideMarked:esc;
 if(japanese){
  if(guideUncertainAlternatives.has(guideNodeIds.get(node)))return `<div class="guide-term-alternatives">${clean.split('/').map(t=>guideParagraphContent({...node,text:t.trim()},marked)).join('')}</div>`;
  const notes=(text.match(/\[note \d+\]/gi)||[]).join(' ');
  return `<p class="guide-japanese" lang="ja"><button class="guide-speak" data-speak="${esc(guideSpoken(clean))}" aria-label="Écouter : ${esc(clean)}">${jp(clean)}<span aria-hidden="true"> ♪</span></button>${guideNoteMarkup(notes,node)}</p>`;
 }
 if(node.style==='literal'&&!node.runs)return `<details class="guide-literal"><summary>Mot à mot</summary><p class="fr">${guideNoteMarkup(text,node,format)}</p></details>`;
 if(pronunciation||translation)return `<p class="${pronunciation?'romaji guide-pronunciation':'fr guide-translation'}">${guideNoteMarkup(pronunciation?guideReadingText(node):text,node,format)}</p>`;
 const content=node.runs?node.runs.map(r=>{
  const fragment=guideNoteMarkup(r.text,node,format);
  if(r.style==='highlight')return `<strong>${fragment}</strong>`;
  if(['foreign','stage'].includes(r.style))return `<span class="romaji guide-pronunciation guide-inline-reading">${fragment}</span>`;
  if(r.style==='mentioned')return `<span class="fr guide-inline-translation">${fragment}</span>`;
  if(/[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(r.text)&&!/[a-zA-ZÀ-ÖØ-öø-ÿ]/.test(r.text))return `<span class="guide-japanese" lang="ja"><button class="guide-speak" data-speak="${esc(r.text)}" aria-label="Écouter : ${esc(r.text)}">${fragment} ♪</button></span>`;
  return fragment;
 }).join(''):guideNoteMarkup(text,node,format);
 return ExplanationReadings.html(`<p>${content}</p>`);
}
// Liste fermée des 20 correspondances relues ; aucune découpe globale des barres.
const guideReviewedPairs={
 "tpc-36": [
  "ma mère / mon père",
  "votre mère / votre père",
  "mon fils / ma fille",
  "votre fils /votre fille",
  "ma sœur aînée /mon frère aîné",
  "votre sœur aînée /votre frère aîné",
  "ma sœur cadette /mon frère cadet",
  "votre sœur cadette / votre frère cadet",
  "mon neveu / ma nièce",
  "votre neveu / votre nièce",
  "mon oncle / ma tante",
  "votre oncle / votre tante",
  "mon grand-père /ma grand-mère",
  "votre grand-père /votre grand-mère",
  "mon mari / ma femme",
  "votre mari / votre femme",
  "pluie / grosse pluie"
 ],
 "tpc-37": [
  "droite / côté droit",
  "gauche / côté gauche"
 ],
 "tpc-42": [
  "théâtre (art / lieu)"
 ]
};
// Adaptations éditoriales de lignes composites ; le JSON et ses ancres restent intacts.
function guideTableVariants(cells,chapter){
 const prepared=guideEditorial.tables[guideNodeIds.get(cells[0])];
 if(prepared)return prepared.map((row,j)=>row.map((text,i)=>guideEditorialClone(cells[i],text,i===0?'mentioned':i===2?'foreign':undefined,guideNodeIds.get(cells[i])+'-variant-'+j)));
 const adapted=cells.map(guideAdaptNode);
 if(adapted.some((n,i)=>n!==cells[i]))return [adapted];
 if(cells.length!==3||!cells.every(c=>c?.type==='paragraph'))return [cells];
 let rows=null;
 if(guideReviewedPairs[chapter]?.includes(cells[0].text)){
  const parts=cells.map(c=>c.text.split('/').map(s=>s.trim()));
  if(chapter==='tpc-42')parts[0]=['théâtre (art)','théâtre (lieu)'];
  if(parts.every(p=>p.length===2))rows=[0,1].map(i=>parts.map(p=>p[i]));
 }
 // Correction ponctuelle de transcription, sans modifier le paragraphe original.
 if(chapter==='tpc-47'&&cells[0].text==='rayon des livres étrangers'&&cells[1].text==='洋書 売り場 / >洋書 コーナー'){
  return [[cells[0],{...cells[1],text:'洋書 売り場 / 洋書 コーナー'},cells[2]]];
 }
 if(chapter==='tpc-32'&&cells.every(c=>c.text.includes(' / '))){
  const parts=cells.map(c=>c.text.split(' / '));if(parts.every(p=>p.length===2))rows=[0,1].map(i=>parts.map(p=>p[i]));
 }
 if(chapter==='tpc-34'){
  if(cells[0].text.startsWith('Bonjour !'))rows=[
   ['Bonjour ! (le matin)','おはようございます。','ohayô goza.imas(u)'],
   ['Bonjour ! (dans la journée)','こんにちは。','kon’nichi wa'],
   ['Bonsoir !','こんばんは。','kom’ban’ wa']];
  if(cells[0].text.startsWith('Au revoir !'))rows=[
   ['Au revoir !','では また。','dé wa mata'],
   ['À plus ! (familier)','じゃ また。','ja mata'],
   ['Au revoir ! (formule de départ)','じゃ どうも。','ja dômo']];
  if(cells[0].text==='Je voudrais (+ nom)')rows=[
   ['Je voudrais… (+ nom)','ᐧᐧᐧを ください。','… o kudasaï'],
   ['… s’il vous plaît (+ nom)','ᐧᐧᐧを お願いします。','… o onéga.i shimas(u)']];
 }
 if(!rows)return [cells];
 return rows.map(row=>row.map((text,i)=>({type:'paragraph',text,style:i===0?'mentioned':i===2?'foreign':undefined,...(i===1?{japanese:text}:{})})));
}
function guideNodes(nodes,context='Tableau du guide',inTable=false,separateSections=false){
 const expression=!inTable&&nodes?.length?guideExpressionByNode.get(nodes[0]):null;
 if(expression&&expression.nodes.length===nodes.length&&nodes.every((node,i)=>node===expression.nodes[i])){
  return `<div class="guide-expression guide-favorite-block">${guideFavoriteStar(guideFavoriteKey(expression.chapter.id,expression.id))}${guideExpressionVariants(expression).length>1?guideExpressionVariantBody(expression,true):nodes.map(node=>`<div id="${guideNodeIds.get(node)}">${guideParagraph(node)}</div>`).join('')}</div>`;
 }
 return (nodes||[]).map(node=>{
  const id=guideNodeIds.get(node)||'';
  const chapter=id.match(/^guide-(tpc-\d+)-/)?.[1];
  const favorite=guideFavoriteStar(guideFavoriteKey(chapter,id));
  const demonstrative=inTable&&chapter==='tpc-24'?guideDemonstrativeParts(node):null;
  if(demonstrative)return `<div id="${id}"><p><span lang="ja">${guideMarked(node.japanese)}</span> <span class="romaji guide-pronunciation">${guideMarked(demonstrative.reading)}</span></p><p class="fr guide-table-french" lang="fr">${guideMarked(demonstrative.french)}</p></div>`;
  if(inTable&&node.type==='paragraph'&&guideSeparatedLabels[node.text]){
   const [label,note]=guideSeparatedLabels[node.text];
   return `<div id="${id}">${note?`<details class="guide-label-help"><summary aria-label="${esc(label)} : explication">${guideMarked(label)} <span class="guide-label-info" aria-hidden="true">ⓘ</span></summary><p>${guideNoteMarkup(guideLabelHelp[node.text]||note,node)}</p></details>`:`<p>${guideMarked(label)}</p>`}</div>`;
  }
  if(node.type==='paragraph')return `<div id="${id}" class="${inTable?'':'guide-favorite-block'}">${!inTable?favorite:''}${guideParagraph(node)}</div>`;
  if(node.type==='section'){
   // Dans les journées, les notes et exercices sont des rubriques sœurs du dialogue.
   const siblings=separateSections?(node.blocks||[]).filter(n=>n.type==='section'&&n.title):[];
   const inside=guideNodes((node.blocks||[]).filter(n=>!siblings.includes(n)),node.title||context,inTable);
   if(!node.title)return `<div id="${id}" class="guide-group">${inside}</div>`;
   return `<details id="${id}" class="guide-section"><summary>${esc(node.title)}</summary><div class="guide-section-body">${inside}</div></details>${guideNodes(siblings,context,inTable)}`;
  }
  if(node.type==='table')return guideRenderTable(node,chapter,id,context,favorite);
  if(node.type==='list'){const tag=node.ordered?'ol':'ul';return `<${tag} id="${id}" class="guide-list">${node.items.map(item=>`<li${item.some(n=>n.type==='paragraph'&&n.japanese)&&item.some(n=>n.style==='mentioned'&&!n.runs)?' class="guide-phrase"':''}>${guideNodes(item,context,inTable)}</li>`).join('')}</${tag}>`;}
  return '';
 }).join('');
}
function guideRenderTable(node,chapter,id,context,favorite){
 const info=guideTables.find(t=>t.node===node),heading=guideTableHeading(node,chapter),title=info?.title||context;
 const distance=['Près de moi','Près de mon interlocuteur','Là-bas, loin de nous deux'];
 const labels=[...heading.labels,...(heading.sourceHeader||[]).map((c,i)=>guidePlainText(c)+(chapter==='tpc-24'?' — '+distance[i]:''))];
 const headers=heading.labels.map(label=>`<th scope="col">${esc(label)}</th>`).join('')+(heading.sourceHeader||[]).map((cell,i)=>`<th scope="col">${guideNodes(Array.isArray(cell)?cell:[cell],context,true)}${chapter==='tpc-24'?`<p class="guide-demonstrative-distance">${distance[i]}</p>`:''}</th>`).join('');
 const cards=['conversation','numbers'].includes(info?.category)||['tpc-22','tpc-23','tpc-24'].includes(chapter)||['tpc-32','tpc-33','tpc-34'].includes(chapter);
 const rows=heading.rows.flatMap((row,rowIndex)=>{
  const nodes=row.flatMap(c=>Array.isArray(c)?c:[c]),anchor=nodes.find(n=>n.japanese)||nodes.find(n=>guideNodeIds.has(n));
  return guideTableVariants(row,chapter).map((cells,variantIndex)=>{
   const rowStar=variantIndex===0&&anchor?guideFavoriteStar(guideFavoriteKey(chapter,guideNodeIds.get(anchor))):'';
   const split=cells!==row;
   return `<tr>${cells.map((cell,i)=>{
    const content=split?`${variantIndex===0?`<span id="${guideNodeIds.get(row[i])}"></span>`:''}${guideParagraph(cell,true)}${variantIndex===0&&i===0?guideEditorialNote(guideNodeIds.get(row[0])):''}`:guideNodes(Array.isArray(cell)?cell:[cell],context,true);
    const labelCell=i===0&&nodes.some(n=>guideSeparatedLabels[n.text]);
    const french=guideTableFrench(chapter,row,rowIndex,i);
    return `<td data-label="${esc(labels[i]||'')}">${labelCell?`<div class="guide-label-cell"><div>${content}</div>${rowStar}</div>`:`${i===0?rowStar:''}${content}`}${french?`<p class="fr guide-table-french" lang="fr">${esc(french)}</p>`:''}</td>`;
   }).join('')}</tr>`;
  });
 }).join('');
 return `${['tpc-22','tpc-23'].includes(chapter)?'<p class="guide-table-explanation">Les traductions utilisent « je » comme exemple ; le sujet et le temps présent ou futur dépendent du contexte. La forme en て (te) relie le verbe à la suite.</p>':''}<div id="${id}" class="guide-table-scroll${cards?' guide-table-cards':''}" tabindex="0" role="region" aria-label="${esc(title)} — tableau"><table class="guide-table"><caption>${esc(title)} ${favorite}</caption><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></div>`;
}
function guideHome(){
 const order=['Introduction','Initiation','Conversation','Les indispensables'];
 const descriptions={'Conversation':'15 thèmes pour les situations du quotidien et du voyage.','Les indispensables':'Nombres, prononciation, repères et expressions utiles.','Initiation':'21 mini-leçons, dans un parcours indépendant des 98 leçons.','Introduction':'Le guide, le pays, la langue et son écriture.'};
 return `<div id="guide-home-sections">${order.map(title=>{const part=guideData.parts.find(p=>p.title===title);if(!part)return '';return `<details class="panel guide-part" open><summary>${esc(title)}</summary><p class="muted">${descriptions[title]}</p><div class="guide-chapters">${part.chapters.map(c=>`<a href="#guide/${encodeURIComponent(c.id)}">${esc(c.title)} <span aria-hidden="true">→</span></a>`).join('')}</div></details>`;}).join('')}</div>`;
}
function guidePlainText(node){
 if(Array.isArray(node))return node.map(guidePlainText).filter(Boolean).join(' · ');
 if(!node||typeof node!=='object')return '';
 node=guideAdaptNode(node);
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
 if(row.type==='Tableau'&&!guideQuery.trim())return `${row.node.rows.length-(guideTableHeading(row.node,row.chapter.id).sourceHeader?1:0)} lignes · ouvrir pour consulter`;
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
  table.node.rows.forEach((original,index)=>{
   guideTableVariants(original,table.chapter.id).forEach((cells,variantIndex)=>{
    if(cells.length!==3||!cells.every(c=>c&&c.type==='paragraph'))return;
    const [fr,ja,reading]=cells;
    if(fr.style!=='mentioned'||!ja.japanese||!['foreign','stage'].includes(reading.style)||/[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(reading.text||''))return;
    const spoken=guideSpoken(ja.text).replace(/\((?:nom|verbe) \+\)/gi,'…').trim();
    if(!fr.text?.trim()||!reading.text?.trim()||!/[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(spoken)||/[a-zA-ZÀ-ÖØ-öø-ÿ]/.test(spoken))return;
    const section=table.path.at(-1)||'Autres mots et expressions';
    guideVocabulary.push({id:table.id+'-v'+index+(variantIndex?'-'+variantIndex:''),sourceId:guideNodeIds.get(original[1]),table,section,japanese:ja.text,spoken,reading:reading.text,displayReading:guideReadingText(reading),french:fr.text,
     termParts:guideUncertainAlternatives.has(guideNodeIds.get(original[1]))?ja.text.split(/\s*\/\s*/):null,note:guideEditorial.nodes[guideNodeIds.get(original[0])]?.note,editorial:cells!==original,search:guideSearchKey([fr.text,ja.text,reading.text,table.chapter.title,section].join(' '))});
   });
  });
 }
 // Une répétition exacte dans le même chapitre n'ajoute pas une seconde entrée.
 // Les contextes de chapitres différents restent accessibles par leurs catégories.
 const entryKey=v=>JSON.stringify([v.table.chapter.id,...[v.french,v.japanese,v.reading].map(t=>String(t).normalize('NFC').trim().replace(/\s+/g,' '))]);
 const existing=new Set(guideVocabulary.map(entryKey));
 for(const row of guideDisplayIndex.filter(row=>row.nodes)){
  const grouped=['dialogue','sequence'].includes(guideEditorial.expressions[row.id]?.kind);
  (grouped?[row]:guideExpressionVariants(row)).forEach((variant,index)=>{
  const entry={id:row.id+(index?'-'+index:'')+'-expression',sourceId:row.id,table:row,section:row.path.at(-1)||row.chapter.title,
   japanese:variant.japanese.text,spoken:guideSpoken(variant.japanese.text),reading:variant.reading.text,french:variant.french.text,editorial:variant!==row};
  entry.note=guideEditorial.nodes[row.id]?.note;
  if(grouped){entry.parts=guideExpressionVariants(row);entry.french=entry.parts.map(p=>p.french.text).join(' / ');entry.japanese=entry.parts.map(p=>p.japanese.text).join(' / ');entry.reading=entry.parts.map(p=>p.reading.text).join(' / ');entry.editorial=true;}
  entry.search=guideSearchKey([entry.french,entry.japanese,entry.reading,row.chapter.title,entry.section].join(' '));
  const key=entryKey(entry);if(existing.has(key))return;
  existing.add(key);guideVocabulary.push(entry);
  });
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
 const entry=v=>v.parts?guideGroupedVocabulary(v):`<article class="guide-vocab-row"><div>${guideVocabularyJapanese(v)}${guideNoteMarkup((v.japanese.match(/\[note \d+\]/gi)||[]).join(' '),v.sourceId)}<p class="romaji guide-pronunciation">${guideMarked(v.displayReading||v.reading)}</p></div><p class="fr">${guideNoteMarkup(v.french,v.sourceId)}</p><div class="guide-vocab-source">${guideFavoriteStar(guideFavoriteKey(v.table.chapter.id,v.sourceId))}<small>${esc(v.section)}</small>${guideVocabularyNote(v)}<a href="#guide/${v.table.chapter.id}/${v.sourceId}">Voir dans le guide →</a></div></article>`;
 let content;
 if(guideVocabCategory==='all')content=guideVocabCategories().map(({chapter})=>{
  const matches=rows.filter(v=>v.table.chapter.id===chapter.id);if(!matches.length)return '';
  return `<details class="guide-vocab-group guide-table-group" ${terms.length?'open':''}><summary><strong>${esc(chapter.title)}</strong> <span class="pill">${matches.length}</span></summary><div class="guide-vocab-list">${matches.map(entry).join('')}</div></details>`;
 }).join('');else content=`<div class="guide-vocab-list">${rows.map(entry).join('')}</div>`;
 target.innerHTML=`<p class="muted" role="status">${rows.length} ${rows.length===1?'entrée':'entrées'} · mots et expressions</p><p class="muted guide-vocab-note">Mots des tableaux et expressions complètes du Guide. Conventions de prononciation de la source conservées ; les formulations relues sont détaillées et les corrections éditoriales signalées. Le lien permet de consulter le contexte et les notes.</p>${rows.length?content:'<p class="panel">Aucun mot trouvé. Changez la recherche ou la catégorie.</p>'}`;
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
  if(v.parts)return guideGroupedVocabulary(v,true);
  const french=`<p class="fr lexicon-french">${guideNoteMarkup(v.french,v.sourceId)}</p>`;
  const reading=`<p class="romaji guide-pronunciation">${guideMarked(v.displayReading||v.reading)}</p>`;
  const japanese=`${guideVocabularyJapanese(v)}${guideNoteMarkup((v.japanese.match(/\[note \d+\]/gi)||[]).join(' '),v.sourceId)}`;
  return `<article class="guide-lexicon-row" data-lexicon-id="${esc(v.id)}">${reverse?`<div>${reading}${japanese}</div>${french}`:`${french}<div>${japanese}${reading}</div>`}<div class="guide-vocab-source">${guideFavoriteStar(guideFavoriteKey(v.table.chapter.id,v.sourceId))}<small>${esc(v.table.chapter.title)} · ${esc(v.section)}</small>${guideVocabularyNote(v)}<a href="#guide/${v.table.chapter.id}/${v.sourceId}">Voir dans le guide →</a></div></article>`;
 };
 $('#guide-results').innerHTML=`<p class="muted" role="status">${result.rows.length} ${result.rows.length===1?'entrée':'entrées'}${state.initial!=='all'?' · lettre '+esc(state.initial):''} · mots et expressions</p><p class="muted">Prononciation du Guide conservée, sans conversion en romaji standard. Les accents et la casse sont ignorés pour le tri et la recherche ; les adaptations éditoriales sont partagées avec le lecteur du Guide.</p>${result.rows.length?`<div class="guide-lexicon-list">${result.rows.map(entry).join('')}</div>`:'<p class="panel">Aucun résultat. Essayez une autre recherche, une autre catégorie ou « Toutes » dans les lettres.</p>'}`;
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

// Presentation overlay: source JSON, stable anchors and favorite keys are never rewritten.
function guideEditorialClone(node,text,style,id){
 const clone={...node,text,style,runs:undefined};
 if(style===undefined)clone.japanese=text;
 guideNodeIds.set(clone,id);return clone;
}
function guideAdaptNode(node){
 if(!node||typeof node!=='object')return node;
 const id=guideNodeIds.get(node),edit=guideEditorial.nodes[id];
 if(!edit||(!edit.text&&!edit.replace&&!edit.removeArtifact))return node;
 const transform=t=>{let value=String(t||'');if(edit.removeArtifact)value=value.replaceAll('>','');for(const [from,to]of edit.replace||[])value=value.replaceAll(from,to);return value;};
 const clone={...node,text:edit.text??transform(node.text)};
 if(node.runs)clone.runs=edit.text?undefined:node.runs.map(r=>({...r,text:transform(r.text)}));
 guideNodeIds.set(clone,id);return clone;
}
function guideSpoken(text){
 return String(text).replace(/\[note \d+\]/gi,'').replace(/すみませんᐧᐧᐧ(?= ATM)/g,'すみません。').replace(/。 (?=ATM)/g,'。').replace(/ATM（エイティーエム）/g,'エイティーエム').replace(/MRI\s*\(エム アール アイ\)/g,'エム アール アイ').replace(/WiFi\s*ワイファイ/g,'ワイファイ').replace(/\bB(?= 型)/g,'ビー').replace(/\s*\/\s*/g,'、').trim();
}
function guideEditorialNote(id){
 const note=guideEditorial.nodes[id]?.note;
 return note?`<aside class="guide-editorial-note"><strong>Repère de lecture</strong> ${esc(ExplanationReadings.explain(note))}</aside>`:'';
}
function guideVocabularyNote(v){return v.note?`<aside class="guide-editorial-note">${esc(ExplanationReadings.explain(v.note))}</aside>`:'';}
function guideGroupedVocabulary(v,lexicon=false){
 return `<article class="${lexicon?'guide-lexicon-row':'guide-vocab-row'} guide-grouped-entry"${lexicon?` data-lexicon-id="${esc(v.id)}"`:''}><div>${guideExpressionVariantBody(v.table)}</div><div class="guide-vocab-source">${guideFavoriteStar(guideFavoriteKey(v.table.chapter.id,v.sourceId))}<small>${esc(v.table.chapter.title)} · ${esc(v.section)}</small><a href="#guide/${v.table.chapter.id}/${v.sourceId}">Voir dans le guide →</a></div></article>`;
}

const guideUncertainAlternatives=new Set(['guide-tpc-42-420','guide-tpc-42-423','guide-tpc-43-34','guide-tpc-48-68','guide-tpc-48-89']);
function guideVocabularyJapanese(v){
 return (v.termParts||[v.japanese]).map(text=>`<button class="guide-speak guide-japanese" lang="ja" data-speak="${esc(v.termParts?guideSpoken(text):v.spoken)}" aria-label="Écouter : ${esc(text)}">${guideMarked(text.replace(/\[note \d+\]/gi,''))} <span aria-hidden="true">♪</span></button>`).join('<br>');
}

// BEGIN GENERATED GUIDE EDITORIAL
const guideEditorial={"expressions":{"guide-tpc-9-3":{"kind":"dialogue","parts":[["Vous vous levez tôt ?","早く 起きます か。","hayaku okimas(u) ka"],["Je ne me lève pas tôt.","早く 起きません。","hayaku okimasèn’"]]},"guide-tpc-9-7":{"kind":"dialogue","parts":[["Est-ce que vous sortez ?","出掛けます か。","dékakémas(u) ka"],["Je sors.","出かけます。","dékakémas(u)"]]},"guide-tpc-9-11":{"kind":"dialogue","parts":[["Quand rentrez-vous ?","いつ 帰ります か。","itsu kaérimas(u) ka"],["Je rentre tôt.","早く 帰ります。","hayaku kaérimas(u)"]]},"guide-tpc-10-3":{"kind":"dialogue","parts":[["Où allez-vous ?","どこ に 行きます か。","doko ni ikimas(u) ka"],["Je vais à la librairie.","本屋 に 行きます。","hon’ya ni ikimas(u)"]]},"guide-tpc-10-7":{"kind":"dialogue","parts":[["Vous achetez des journaux ?","新聞 を 買います か。","shim’bun’ o ka.imas(u) ka"],["Oui.","はい、買います。","haï ka.imas(u)"]]},"guide-tpc-10-11":{"kind":"dialogue","parts":[["Vous achetez des livres ?","本 を 買います か。","hon’ o ka.imas(u) ka"],["Non.","いえ、買いません。","i.ié ka.imasèn’"]]},"guide-tpc-11-7":{"kind":"variants","parts":[["Oui. C’est un musée.","はい、美術館、です。","haï bijutsukan’ dès(u)"],["Oui. c’est ça.","はい、 そう です。","haï sô dès(u)"]]},"guide-tpc-35-41":{"kind":"variants","parts":[["Merci.","どうも。","dômo"],["Merci.","ありがとう。","arigatô"]]},"guide-tpc-35-47":{"kind":"variants","parts":[["Merci beaucoup !","どうも ありがとう。","dômo arigatô"],["Merci beaucoup !","ありがとう ございます。","arigatô goza.imas(u)"]]},"guide-tpc-35-83":{"kind":"variants","parts":[["Toutes mes excuses pour le retard !","遅く なって すみません。","osoku nat’té sumimasèn’"],["Toutes mes excuses pour le retard !","お 待たせ いたしました。","o matasé itashimash(i)ta"]]},"guide-tpc-35-112":{"kind":"dialogue","parts":[["Vous êtes français(e) ?","フランス人 です か。","furan’sujin’ dès(u) ka"],["Oui, je suis français(e).","はい、フランス人 です。","haï furan’sujin’ dès(u)"]]},"guide-tpc-36-46":{"kind":"sequence","parts":[["Heureux de vous connaître.","はじめまして。","hajimémash(i)té"],["Je suis Monsieur Martin.","マルタン です。","marutan’ dès(u)"]]},"guide-tpc-36-141":{"kind":"variants","parts":[["Quel âge avez-vous ?","何歳 です か。","nan’saï dès(u) ka"],["Quel âge avez-vous ?","お いくつ です か。","o ikutsu dès(u) ka"]]},"guide-tpc-37-27":{"kind":"sequence","parts":[["Oui, certainement.","ええ、 是非。","é.é zéhi"],["Merci beaucoup.","ありがとう ございます。","arigatô gozai.mas(u)"]]},"guide-tpc-38-4":{"kind":"dialogue","parts":[["Quelle heure est-il ?","今 何時 です か。","ima nan’ji dès(u) ka"],["Il est quatre heures.","四 時 です","yo ji dès(u)"]]},"guide-tpc-38-9":{"kind":"dialogue","parts":[["À quelle heure arrivez-vous ?","何時 に 着きます か。","nan’ji ni tsukimas(u) ka"],["À six heures de l’après-midi.","午後 の 六時 に 着きます。","gogo no rokuji ni tsukimas(u)"]]},"guide-tpc-39-8":{"kind":"variants","parts":[["Je ne me sens pas bien.","気分 が 悪い です。","kibun’ ga warui dès(u)"],["Je suis perdu(e).","迷子 に なりました。","maïgo ni narimash(i)ta"]]},"guide-tpc-41-138":{"kind":"dialogue","parts":[["Pour combien de personnes ?","何名 さま です か。","nan’mèï sama dès(u) ka"],["Nous sommes quatre.","４人 です。","yo.nin’ des(u)"]]},"guide-tpc-41-289":{"kind":"sequence","parts":[["J’ai le mal de mer.","船酔い しました。","funayo.i shimash(i)ta"],["Vous auriez un médicament ?","薬 を お願い します。","kusuri o onéga.i shimas(u)"]]},"guide-tpc-42-328":{"kind":"sequence","parts":[["Allô !","もしもし","moshimoshi"],["Je suis Mme Meunier.","ムニエ です がᐧᐧᐧ","munié dè(s)u ga"]]},"guide-tpc-45-55":{"kind":"dialogue","parts":[["Vous êtes combien ?","何名 さま です か。","nan’mèï sama dès(u) ka"],["Nous sommes quatre.","四人 です。","yo.nin’ dès(u)"]]},"guide-tpc-45-63":{"kind":"variants","parts":[["Oui.","はい、吸います。","haï suimas(u)"],["Non.","いいえ、吸いません。","i.ié suimasèn’"]]},"guide-tpc-45-76":{"kind":"variants","parts":[["Je suis au régime.","ダイエット を して います。","daïèt’to o shité imas(u)"],["Je suis végétarien(ne).","ベジタリアン です。","béjitarian’ dès(u)"]]},"guide-tpc-47-299":{"kind":"variants","parts":[["Qu’est-ce que c’est, ça ?","これ は 何 です か。","koré wa nan’ dès(u) ka"],["Avez-vous des cartes postales ?","絵葉書 が あります か。","éhagaki ga arimas(u) ka"]]},"guide-tpc-49-2":{"kind":"variants","parts":[["Je ne me sens pas bien.","気分 が わるい です。","kibun’ ga waru.i dès(u)"],["J’ai de la fièvre.","熱 が あります。","nètsu ga arimas(u)"]]},"guide-tpc-49-259":{"kind":"sequence","parts":[["Quand seront-elles prêtes ?","いつ まで に できます か。","itsu madé ni dékimas(u) ka"],["C’est urgent.","急いで います。","iso.idé imas(u)"]]},"guide-tpc-19-3":{"kind":"variants","parts":[["Vous parlez le japonais ?","日本語 が できます か。","nihon’go ga dékimas(u) ka"],["Vous comprenez le japonais ?","日本語 が わかります か。","nihon’go ga wakarimas(u) ka"]]},"guide-tpc-19-7":{"kind":"variants","parts":[["Je le parle un peu.","少し できます。","s(u)koshi dékimas(u)"],["Je le comprends un peu.","少し わかります。","s(u)koshi wakarimas(u)"]]},"guide-tpc-35-166":{"kind":"variants","parts":[["Vous connaissez le français ?","フランス語 が できます か。","furan’sugo ga dékimas(u) ka"],["Vous comprenez le français ?","フランス語 が わかります か。","furan’sugo ga wakarimas(u) ka"]]},"guide-tpc-35-172":{"kind":"variants","parts":[["Ça ici, qu’est-ce que c’est ?","これ は 何 です か。","koré wa nan’ dès(u) ka"],["Ça là, qu’est-ce que c’est ?","それ は 何 です か。","soré wa nan’ dès(u) ka"],["Ça là-bas, qu’est-ce que c’est ?","あれ は 何 です か。","aré wa nan’ dès(u) ka"]]},"guide-tpc-35-182":{"kind":"variants","parts":[["Encore une fois, s’il vous plaît.","もう 一度 お願い します。","mô ichido onéga.i shimas(u)"],["Plus lentement, s’il vous plaît.","もっと ゆっくり お願い します。","mot’to yuk’kuri onéga.i shimas(u)"]]},"guide-tpc-36-136":{"kind":"variants","parts":[["Je viens de l’Université de Lyon.","リヨン 大学 から 来ました。","rion daïgaku kara kimash(i)ta"],["Je viens de… (nom de l’entreprise).","ᐧᐧᐧ会社 から 来ました。","… kaïsha kara kimash(i)ta"]]},"guide-tpc-37-110":{"kind":"variants","parts":[["À quelle heure nous retrouvons-nous ?","何時 に 会いましょう か。","nan’ji ni a.imashô ka"],["Où nous retrouvons-nous ?","どこ で 会いましょう か。","doko dé a.imashô ka"]]},"guide-tpc-38-188":{"kind":"variants","parts":[["Ça prendra à peu près 3 jours.","三日 ぐらい かかります。","mik’ka guraï kakarimas(u)"],["Ça prendra à peu près 2 heures.","二 時間 ぐらい かかります。","ni jikan’ guraï kakarimas(u)"],["Ça prendra à peu près 20 minutes.","二十分 ぐらい かかります。","nijup’pun’ guraï kakarimas(u)"]]},"guide-tpc-39-16":{"kind":"variants","parts":[["Appelez un médecin.","医者 を 呼んで ください。","isha o yon’dè kudasaï"],["Appelez la police.","警察 を 呼んで ください。","kèïsatsu o yon’dè kudasaï"],["Appelez une ambulance.","救急車 を 呼んで ください。","kyûkyûsha o yon’dè kudasaï"]]},"guide-tpc-39-23":{"kind":"variants","parts":[["J’ai oublié ma serviette.","鞄 を 忘れました。","kaban’ o wasurémash(i)ta"],["J’ai oublié mon portable.","携帯 を 忘れました。","kèïtaï o wasurémash(i)ta"],["J’ai oublié mon appareil photo.","カメラ を 忘れました。","kaméra o wasurémash(i)ta"],["J’ai oublié mon ordinateur.","パソコン を 忘れました。","pasokon’ o wasurémash(i)ta"],["J’ai oublié mon parapluie.","傘 を 忘れました。","kasa o wasurémash(i)ta"]]},"guide-tpc-39-27":{"kind":"variants","parts":[["J’ai perdu mon sac.","バッグ を なくしました。","bag’gu o nakushimash(i)ta"],["J’ai perdu ma clé.","鍵 を なくしました。","kagi o nakushimash(i)ta"],["J’ai perdu mon passeport.","パスポート を なくしました。","pasupôto o nakushimash(i)ta"],["J’ai perdu ma carte de crédit.","クレジット カード を なくしました。","kuréjit’to kâdo o nakushimash(i)ta"],["J’ai perdu mon billet d’avion.","飛行機 の チケット を なくしました。","hikôki no chikèt’to o nakushimash(i)ta"]]},"guide-tpc-41-8":{"kind":"variants","parts":[["Ouvrez votre serviette.","鞄 を あけて ください。","kaban’ o akété kudasaï"],["Ouvrez votre valise.","スーツケース を あけて ください。","sûtsukêsu o akété kudasaï"],["Ouvrez ces sacs.","袋 を あけて ください。","fukuro o akété kudasaï"]]},"guide-tpc-41-12":{"kind":"variants","parts":[["Vous avez des cigarettes dans vos bagages ?","タバコ が 入って います か。","tabako ga ha.it’té imas(u) ka"],["Vous avez du parfum dans vos bagages ?","香水 が 入って います か。","kôsui ga ha.it’té imas(u) ka"],["Vous avez de l’alcool dans vos bagages ?","アルコール が 入って います か。","arukôru ga ha.it’té imas(u) ka"]]},"guide-tpc-41-16":{"kind":"variants","parts":[["Il y a des vêtements.","服 が 入って います。","fuku ga ha.it’té imas(u)"],["Il y a des cadeaux.","おみやげ が 入って います。","omiyagé ga ha.it’té imas(u)"],["Il y a des livres.","本 が 入って います。","hon’ ga ha.it’té imas(u)"],["Il y a mon ordinateur.","コンピューター が 入って います。","kom’pyûtâ ga ha.it’té imas(u)"],["Il y a de la nourriture.","食べ物 が 入って います。","tabémono ga ha.it’té imas(u)"]]},"guide-tpc-41-32":{"kind":"variants","parts":[["Deux semaines.","２週間 です。","nishûkan’ dès(u)"],["Trois mois.","３か月 です。","san’kagètsu dès(u)"]]},"guide-tpc-41-134":{"kind":"variants","parts":[["Je voudrais aller à Ôsaka.","大阪 へ 行きたい ん です がᐧᐧᐧ","ôsaka é ikitaï n dès(u) ga"],["Je voudrais aller à Sapporo.","札幌 へ 行きたい ん です がᐧᐧᐧ","sap’poro é ikitaï n dès(u) ga"],["Je voudrais aller à Kagoshima.","鹿児島 へ 行きたい ん です がᐧᐧᐧ","kagoshima é ikitaï n dès(u) ga"]]},"guide-tpc-41-183":{"kind":"variants","parts":[["Côté fenêtre, s’il vous plaît.","窓側 を お願い します。","madogawa o onéga.i shimas(u)"],["Côté couloir, s’il vous plaît.","通路側 を お願い します。","tsûrogawa o onéga.i shimas(u)"]]},"guide-tpc-41-306":{"kind":"variants","parts":[["Arrêtez-moi ici, s’il vous plaît.","ここ で 止めて ください。","koko dé tomété kudasaï"],["Arrêtez-moi devant ce bâtiment, s’il vous plaît.","この 建物 の 前 で 止めて ください。","kono tatémono no maé dé tomété kudasaï"]]},"guide-tpc-41-348":{"kind":"variants","parts":[["Je voudrais louer une voiture.","自動車 を 借りたい ん です がᐧᐧᐧ","jidôsha o karitaï n dès(u) ga"],["Je voudrais louer une voiture.","車 を 借りたい ん です がᐧᐧᐧ","kuruma o karitaï n dès(u) ga"]]},"guide-tpc-42-18":{"kind":"variants","parts":[["Vaudrait-il mieux y aller en bus ?","バス に 乗った 方 が いい でしょう か。","basu ni not’ta hô ga i.i déshô ka"],["Vaudrait-il mieux y aller en métro ?","地下鉄 に 乗った 方 が いい でしょう か。","chikatètsu ni not’ta hô ga i.i déshô ka"]]},"guide-tpc-42-67":{"kind":"variants","parts":[["Où se trouve la gare de train la plus proche ?","一番 近い 電車 の 駅 は どこ に あります か。","ichiban’ chikaï dèn’sha no éki wa doko ni arimas(u) ka"],["Où se trouve la station de métro la plus proche ?","一番 近い 地下鉄 の 駅 は どこ に あります か。","ichiban’ chikaï chikatètsu no éki wa doko ni arimas(u) ka"],["Où se trouve l’arrêt de bus le plus proche ?","一番 近い バス停 は どこ に あります か。","ichiban’ chikaï basutèï wa doko ni arimas(u) ka"]]},"guide-tpc-42-79":{"kind":"variants","parts":[["Non, c’est le troisième.","いいえ、三つ目 です。","i.ié mit’tsumé dès(u)"],["Non, c’est le troisième.","いいえ、三番目 です。","i.ié sam’bam’mé dès(u)"]]},"guide-tpc-42-275":{"kind":"variants","parts":[["Quel est le plus rapide ?","一番 速い の は どれ です か。","ichiban’ hayaï no wa doré dès(u) ka"],["Quel est le moins cher ?","一番 安い の は どれ です か。","ichiban’ yasui no wa doré dès(u) ka"]]},"guide-tpc-42-465":{"kind":"variants","parts":[["Un shampoing, s’il vous plaît.","シャンプー お願い します。","sham’pû onéga.i shimas(u)"],["Une coupe, s’il vous plaît.","カット お願い します。","kat’to onéga.i shimas(u)"],["Une mise en plis, s’il vous plaît.","セット お願い します。","sèt’to onéga.i shimas(u)"],["Une permanente, s’il vous plaît.","パーマ お願い します。","pâma onéga.i shimas(u)"]]},"guide-tpc-42-481":{"kind":"variants","parts":[["Vous n’auriez pas une couleur plus claire ?","もっと 明るい 色 が ない ん です か。","mot’to akarui iro ga naï n dès(u) ka"],["Vous n’auriez pas une couleur plus foncée ?","もっと 濃い 色 が ない ん です か。","mot’to ko.i iro ga naï n dès(u) ka"]]},"guide-tpc-43-5":{"kind":"variants","parts":[["J’aimerais voir un match de baseball.","野球 の 試合 が 見たい ん です がᐧᐧᐧ","yakyû no shia.i ga mitaï n dès(u) ga"],["J’aimerais voir un combat de sumô.","お 相撲 が 見たい ん です がᐧᐧᐧ","o sumô ga mitaï n dès(u) ga"]]},"guide-tpc-43-9":{"kind":"variants","parts":[["Je voudrais faire du golf.","ゴルフ が したい ん です がᐧᐧᐧ","gorufu ga shitaï n dès(u) ga"],["Je voudrais faire du tennis.","テニス が したい ん です がᐧᐧᐧ","ténisu ga shitaï n dès(u) ga"]]},"guide-tpc-43-256":{"kind":"variants","parts":[["J’ai peur des araignées.","蜘蛛 が こわい です。","kumo ga kowaï dès(u)"],["Je déteste les araignées.","蜘蛛 が きらい です。","kumo ga kiraï dès(u)"]]},"guide-tpc-44-56":{"kind":"variants","parts":[["Je voudrais annuler ma réservation.","予約 を キャンセル したい ん です けどᐧᐧᐧ","yoyaku o kyan’sèru shitaï n dès(u) kédo"],["Je voudrais modifier ma réservation.","予約 を 変更 したい ん です けどᐧᐧᐧ","yoyaku o hèn’kô shitaï n dès(u) kédo"]]},"guide-tpc-45-68":{"kind":"variants","parts":[["Une table non-fumeurs, s’il vous plaît.","禁煙席 お願い します。","kin’èn’séki onéga.i shimas(u)"],["Une table fumeurs, s’il vous plaît.","喫煙席 お願い します。","kitsuèn’séki onéga.i shimas(u)"]]},"guide-tpc-45-80":{"kind":"variants","parts":[["Où sont les toilettes ?","トイレ は どこ です か。","to.iré wa doko dès(u) ka"],["Où sont les toilettes ?","お 手洗い は どこ です か。","o téaraï wa doko dès(u) ka"]]},"guide-tpc-46-4":{"kind":"variants","parts":[["Deux whiskys, s’il vous plaît.","ウイスキー を ２つ ください。","wisukî o f(u)tatsu kudasaï"],["Deux vodkas, s’il vous plaît.","ウオッカ を ２つ ください。","wok’ka o f(u)tatsu kudasaï"]]},"guide-tpc-47-20":{"kind":"variants","parts":[["Où se trouve le rayon chaussures ?","靴 売り場 は どこ に あります か。","kutsu uriba wa doko ni arimas(u) ka"],["À quel étage se trouve le rayon chaussures ?","靴 売り場 は 何階 に あります か。","kutsu uriba wa nan’kaï ni arimas(u) ka"]]},"guide-tpc-47-32":{"kind":"variants","parts":[["L’avez-vous dans une autre couleur ?","他 の 色 が あります か。","hoka no iro ga arimas(u) ka"],["L’avez-vous dans une autre taille ?","他 の 大きさ が あります か。","hoka no o.okisa ga arimas(u) ka"]]},"guide-tpc-47-143":{"kind":"variants","parts":[["C’est un peu grand.","ちょっと 大きい です。","chot’to o.oki.i desu"],["C’est un peu petit.","ちょっと 小さい です。","chot’to chi.isaï desu"]]},"guide-tpc-48-9":{"kind":"variants","parts":[["Je suis en ce moment à Tôkyô.","今 東京 に います。","ima tôkyô ni imas(u)"],["Je suis en ce moment au Japon.","今 日本 に います。","ima nihon’ ni imas(u)"]]},"guide-tpc-49-10":{"kind":"variants","parts":[["J’ai été piqué(e) par une méduse.","クラゲ に 刺されました。","kuragé ni sasarémash(i)ta"],["J’ai été piqué(e) par un insecte.","虫 に 刺されました。","mushi ni sasarémash(i)ta"]]},"guide-tpc-49-107":{"kind":"variants","parts":[["J’ai mal à la tête.","頭 が 痛い です。","atama ga itaï dès(u)"],["J’ai mal à la gorge.","喉 が 痛い です。","nodo ga itaï dès(u)"],["J’ai mal au ventre.","お腹 が 痛い です。","onaka ga itaï dès(u)"]]},"guide-tpc-49-232":{"kind":"variants","parts":[["J’ai perdu un plombage.","詰め物 が とれました。","tsumémono ga torémash(i)ta"],["J’ai perdu une couronne.","クラウン が とれました。","kuraun’ ga torémash(i)ta"]]},"guide-tpc-36-185":{"kind":"variants","parts":[["Je suis venu(e) voir mon fils.","息子 に 会い に 来ました。","musuko ni a.i ni kimash(i)ta"],["Je suis venu(e) voir ma fille.","娘 に 会い に 来ました。","musumé ni a.i ni kimash(i)ta"],["Je suis venu(e) voir mes petits-enfants.","孫 に 会い に 来ました。","mago ni a.i ni kimash(i)ta"]]},"guide-tpc-41-330":{"kind":"variants","parts":[["Je voudrais louer un vélo.","自転車 を 借りたい ん です がᐧᐧᐧ","jitèn’sha o karitaï n dès(u) ga"],["Je voudrais louer un vélo électrique.","電動 自転車 を 借りたい ん です がᐧᐧᐧ","dèn’dô jitèn’sha o karitaï n dès(u) ga"]]},"guide-tpc-45-142":{"kind":"variants","parts":[["L’addition, s’il vous plaît !","お 会計 お願い します。","o kaïkèï onéga.i shimas(u)"],["L’addition séparément, s’il vous plaît !","お 会計 別々 に お願い します。","o kaïkèï bètsubètsu ni onéga.i shimas(u)"]]},"guide-tpc-35-16":{"kind":"variants","parts":[["Au revoir !","では また。","déwa mata"],["À demain !","では また 明日。","déwa mata ash(i)ta"],["À la prochaine fois !","では また 今度。","déwa mata kon’do"],["À la semaine prochaine !","では また 来週。","déwa mata raïshû"],["À plus ! (familier)","じゃ また。","ja mata"]]},"guide-tpc-45-136":{"kind":"variants","parts":[["Oui, merci.","はい。お願い します。","haï onéga.i shimas(u)"],["Oui, c’est tout, merci.","はい。いい です。お願い します。","haï i.i dès(u) onéga.i shimas(u)"]]},"guide-tpc-49-6":{"kind":"variants","parts":[["Je me suis blessé(e).","怪我 を しました。","kéga o shimash(i)ta"],["Je suis du groupe B.","私 は B 型 です。","watashi wa bî gata dès(u)"]]},"guide-tpc-35-10":{"kind":"variants","parts":[["Bonjour ! (dans la journée)","こんにち は。","kon’nichi wa"],["Bonsoir !","こんばん は。","kom’ban’ wa"]],"explicitGroup":true},"guide-tpc-35-73":{"kind":"variants","parts":[["Excusez-moi.","すみません。","sumimasèn’"],["Pardon.","ごめん なさい。","gomèn’ nasaï"]],"explicitGroup":true},"guide-tpc-35-106":{"kind":"variants","parts":[["Pour dire oui","はい","haï"],["Pour dire non","いいえ","i.ié"]],"explicitGroup":true}},"nodes":{"guide-tpc-15-4":{"text":"toshokan’ wa éki kara too.i dès(u) ka"},"guide-tpc-20-7":{"removeArtifact":true},"guide-tpc-39-28":{"removeArtifact":true},"guide-tpc-42-382":{"removeArtifact":true},"guide-tpc-43-173":{"removeArtifact":true},"guide-tpc-44-119":{"removeArtifact":true},"guide-tpc-10-11":{"note":"La source écrit いえ et transcrit i.ié (いいえ). Cette différence est conservée ; la première phrase est bien une question."},"guide-tpc-44-56":{"note":"Lecture corrigée : 変更 se lit hèn’kô. La source imprimée omettait le h initial."},"guide-tpc-41-8":{"note":"Graphie corrigée : スーツケース, sûtsukêsu (valise)."},"guide-tpc-42-18":{"note":"Le japonais pose une question : でしょうか. La traduction française a été remise à la forme interrogative."},"guide-tpc-42-149":{"note":"Correspondance incertaine dans la source : プログラム désigne un programme. Ne pas apprendre brochure/dépliant comme deux équivalents exacts de cette paire."},"guide-tpc-44-186":{"note":"Correspondance à nuancer : ちり紙 désigne du papier fin à usage hygiénique ; ce n’est pas une désignation univoque du papier toilette."},"guide-tpc-42-229":{"note":"Modèle : remplacer les points par le nom du groupe ou de l’artiste. La formule n’est pas une phrase autonome à réciter telle quelle."},"guide-tpc-36-16":{"note":"Modèle : remplacer X par le nom de la personne. Le X n’est pas un mot japonais."},"guide-tpc-36-136":{"note":"Dans la seconde formule, compléter le nom de l’entreprise avant 会社."},"guide-tpc-36-152":{"note":"Modèle à compléter : l’indication française est une consigne, elle ne fait pas partie de la phrase japonaise."},"guide-tpc-38-240":{"note":"Modèle à compléter : l’indication française est une consigne, elle ne fait pas partie de la phrase japonaise."},"guide-tpc-38-243":{"note":"Modèle à compléter : l’indication française est une consigne, elle ne fait pas partie de la phrase japonaise."},"guide-tpc-38-246":{"note":"Modèle à compléter : l’indication française est une consigne, elle ne fait pas partie de la phrase japonaise."},"guide-tpc-38-249":{"note":"Modèle à compléter : l’indication française est une consigne, elle ne fait pas partie de la phrase japonaise."},"guide-tpc-41-198":{"note":"Modèle à compléter : l’indication française est une consigne, elle ne fait pas partie de la phrase japonaise."},"guide-tpc-41-267":{"note":"Modèle à compléter : l’indication française est une consigne, elle ne fait pas partie de la phrase japonaise."},"guide-tpc-33-34":{"note":"Modèle à compléter : l’indication française est une consigne, elle ne fait pas partie de la phrase japonaise."},"guide-tpc-25-22":{"note":"Repère corrigé : les femmes utilisent aussi les formes neutres, notamment entre proches. Le choix dépend de la relation, de la situation et du registre ; ces formes ne sont pas réservées aux hommes."},"guide-tpc-47-253":{"note":"Repère historique : le service taspo a pris fin le 31 mars 2026. Le passage est conservé pour comprendre la source de 2013, pas comme une démarche actuelle."},"guide-tpc-47-259":{"note":"Repère historique : le service taspo a pris fin le 31 mars 2026. Le passage est conservé pour comprendre la source de 2013, pas comme une démarche actuelle."},"guide-tpc-42-64":{"note":"Repère de 2013 : les cartes, réseaux et services de transport évoluent. Vérifier les conditions actuelles auprès de l’opérateur avant le voyage."},"guide-tpc-45-68":{"note":"Formulation conservée de la source de 2013 : elle ne garantit pas l’existence de places fumeurs dans l’établissement."},"guide-tpc-49-281":{"note":"Correction éditoriale probable du terme visé : 調剤薬局 (chôzaï yak’kyoku), pharmacie dispensant les médicaments sur ordonnance, au lieu de 調整 薬局.","replace":[["調整 薬局","調剤薬局"],["chôsèï","chôzaï"]]},"guide-tpc-33-8":{"note":"何 se lit notamment nan’ dans 何ですか et nani dans 何が. La lecture dépend de la construction, pas d’une règle unique."},"guide-tpc-36-290":{"note":"工場 : kôjô et kôba sont deux lectures. Kôba peut évoquer un atelier ou une petite usine ; ce n’est pas une séparation absolue."},"guide-tpc-48-127":{"note":"工場 : kôjô et kôba sont deux lectures ; la taille du lieu ne fournit pas une règle absolue."},"guide-tpc-38-44":{"note":"Deux lectures conservées pour dix minutes : jup’pun’ et jip’pun’."},"guide-tpc-36-316":{"note":"俳優 désigne un acteur et peut aussi être un terme général, sans exclusion des femmes. 女優 précise actrice."},"guide-tpc-36-352":{"note":"看護士 et 看護婦 sont des désignations historiques de la source. Le terme actuel commun aux femmes et aux hommes est 看護師 (kan’goshi)."},"guide-tpc-42-419":{"note":"署名 et サイン se recouvrent pour signature, mais leurs emplois ne sont pas interchangeables dans tous les contextes."},"guide-tpc-42-422":{"note":"Le visa et l’autorisation d’entrée sont des notions distinctes. La paire de la source ne constitue pas une équivalence administrative exacte."},"guide-tpc-43-33":{"note":"ゴーグル est un terme plus large pour des lunettes de protection ; le contexte précise leur usage."},"guide-tpc-43-189":{"note":"さけ et しゃけ sont deux formes pour saumon ; ne pas en déduire une règle cru/cuit."},"guide-tpc-48-67":{"note":"売上高 et 取引高 ne sont pas des synonymes comptables exacts : ventes et volume des transactions doivent être distingués selon le contexte."},"guide-tpc-48-88":{"note":"産業 couvre les activités économiques au sens large ; 工業 désigne plus précisément l’industrie de fabrication."},"guide-tpc-30-15":{"note":"Lectures conservées : leur emploi dépend du nombre et de la construction ; le compteur peut imposer une lecture particulière."},"guide-tpc-30-24":{"note":"Lectures conservées : leur emploi dépend du nombre et de la construction ; le compteur peut imposer une lecture particulière."},"guide-tpc-30-30":{"note":"Lectures conservées : leur emploi dépend du nombre et de la construction ; le compteur peut imposer une lecture particulière."},"guide-tpc-30-38":{"text":"—","note":"Non indiqué dans ce tableau."},"guide-tpc-30-41":{"text":"—","note":"Non indiqué dans ce tableau."},"guide-tpc-30-44":{"text":"—","note":"Non indiqué dans ce tableau."},"guide-tpc-35-73":{"note":"Deux formules d’excuse : leur emploi dépend de la situation et de la relation. ごめんなさい convient notamment aux excuses personnelles ; elles ne sont pas interchangeables partout."},"guide-tpc-35-123":{"text":"i.ié sô dé wa arimasèn’"},"guide-tpc-20-8":{"replace":[["sugu / ushiro","sugu ushiro"]]},"guide-tpc-48-47":{"replace":[["いらしゃいます","いらっしゃいます"]]}},"tables":{"guide-tpc-36-316":[["acteur","俳優","haïyû"],["actrice","女優","joyû"]],"guide-tpc-36-352":[["infirmier","看護士","kan’goshi"],["infirmière","看護婦","kan’gofu"],["infirmier / infirmière (terme actuel)","看護師","kan’goshi"]],"guide-tpc-41-386":[["parking","駐車場","chûshajô"],["parking","パーキング","pâkin’gu"]],"guide-tpc-42-248":[["concert","音楽会","ongak(u)kai"],["concert","コンサート","konsâto"]],"guide-tpc-43-189":[["saumon","さけ","saké"],["saumon","しゃけ","shaké"]],"guide-tpc-47-73":[["soldes","バーゲン","bâgèn’"],["soldes","セール","sééru"]],"guide-tpc-47-95":[["rayon des livres étrangers","洋書 売り場","yôsho uriba"],["rayon des livres étrangers","洋書 コーナー","yôsho kônâ"]],"guide-tpc-49-93":[["Ma tension est trop élevée.","血圧 が 高い です。","kètsuatsu ga takaï dès(u)"],["Ma tension est trop basse.","血圧 が 低い です。","kètsuatsu ga hiku.i dès(u)"]],"guide-tpc-49-220":[["prendre le pouls","脈拍 を 計ります","myakuhaku o hakarimas(u)"],["prendre la tension","血圧 を 計ります","kètsuatsu o hakarimas(u)"],["prendre la température","体温 を 計ります","taïon o hakarimas(u)"]]}};
// END GENERATED GUIDE EDITORIAL
