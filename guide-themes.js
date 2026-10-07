'use strict';
// Sélection éditoriale par chapitre et rubrique du Guide, sans modifier le corpus.
// Une chaîne sélectionne tout le chapitre ; un tableau précise les rubriques.
const guideThemeDefinitions=[
 {id:'contacts',title:'Saluer et se faire comprendre',sources:['tpc-35','tpc-34']},
 {id:'presentation',title:'Se présenter et parler de soi',sources:[['tpc-36',['Se rencontrer','Première rencontre avec un interlocuteur japonais','Se présenter ou présenter quelqu’un','Vous vous présentez vous-même','Dire d’où l’on vient','Les pays','Le lieu de travail','Dire son âge','La famille','Emploi, occupation, études','Pourquoi le Japon ?','Religions, traditions','Sentiments et opinions']]]},
 {id:'rencontres',title:'Inviter et organiser une rencontre',sources:['tpc-37',['tpc-48',['Fixer un rendez-vous (au téléphone)']],['tpc-38',['Dire l’heure','Dire une date']]]},
 {id:'repas',title:'Manger et boire',sources:['tpc-45','tpc-46']},
 {id:'transports',title:'Voyager et prendre les transports',sources:[['tpc-41',['Contrôle des passeports et douane','Informations utiles pour tout voyage','En avion','En autocar et en train','En bateau','En taxi','À vélo','Location de voitures','Circuler en voiture']],['tpc-42',['Transports urbains']]]},
 {id:'orientation',title:'Trouver son chemin et comprendre les panneaux',sources:['tpc-40',['tpc-42',['Pour trouver son chemin']],['tpc-32',['L’espace']]]},
 {id:'logement',title:'Se loger',sources:['tpc-44']},
 {id:'achats',title:'Acheter et payer',sources:['tpc-47',['tpc-41',['Change']],['tpc-42',['À la banque']],['tpc-44',['Régler la note']]]},
 {id:'temps',title:'Parler de l’heure, des dates et de la météo',sources:['tpc-38','tpc-30',['tpc-32',['Le temps']],['tpc-36',['Le temps qu’il fait']]]},
 {id:'sorties',title:'Visiter, sortir et profiter de la nature',sources:['tpc-43',['tpc-42',['Visite d’expositions, musées, sites','Musées, expositions','Sites remarquables','Autres curiosités','Sorties au cinéma et au théâtre, concerts']]]},
 {id:'aide',title:'Demander de l’aide et parler de sa santé',sources:['tpc-39','tpc-49']},
 {id:'services',title:'Téléphoner, utiliser les services et travailler',sources:[['tpc-42',['À la poste','Au téléphone','Internet','L’ administration','Chez le coiffeur','Une originalité japonaise']],['tpc-48',['Fixer un rendez-vous (au téléphone)','Visiter l’entreprise','Vocabulaire de l’entreprise']]]},
 {id:'japonais',title:'Comprendre et prononcer le japonais',sources:['tpc-7','tpc-8','tpc-31','tpc-33'],grammar:true}
];
function guideThemeRows(theme,index=guideSearchIndex){
 return index.filter(row=>['paragraph','table'].includes(row.node.type)&&(
  theme.sources.some(source=>typeof source==='string'?row.chapter.id===source:row.chapter.id===source[0]&&row.path.some(part=>source[1].includes(part)))||theme.grammar&&row.category==='grammar'));
}
function updateGuideThemes(){
 const terms=guideSearchKey(guideQuery.trim()).split(/\s+/).filter(Boolean);
 let total=0,groups=0;
 const content=guideThemeDefinitions.map(theme=>{
  const rows=guideThemeRows(theme,guideDisplayIndex).filter(row=>terms.every(term=>guideSearchKey(theme.title).includes(term)||row.search.includes(term)||row.context.includes(term)));
  if(!rows.length)return '';total+=rows.length;groups++;
  return `<details class="guide-theme guide-table-group" data-guide-theme="${theme.id}" ${terms.length?'open':''}><summary><strong>${guideMarked(theme.title)}</strong> <span class="pill">${rows.length}</span></summary><div class="guide-theme-results">${rows.map(row=>{
   if(row.nodes)return guideExpressionCard(row);
   const origin=[row.part.title,row.chapter.title,...row.path].join(' → ');
   const label=row.node.type==='table'?row.title:row.text.slice(0,90)+(row.text.length>90?'…':'');
   return `<article class="guide-theme-entry">${guideFavoriteStar(guideFavoriteKey(row.chapter.id,row.id))}<a href="#guide/${row.chapter.id}/${row.id}"><span class="pill">${row.type}</span><strong>${guideMarked(label)}</strong><small>${esc(origin)}</small>${row.node.type==='table'?`<span>${guideMarked(guidePreview(row))}</span>`:''}</a></article>`;
  }).join('')}</div></details>`;
 }).join('');
 $('#guide-results').innerHTML=`<p class="muted" role="status">${groups} ${groups===1?'thème':'thèmes'} · ${total} ${total===1?'résultat':'résultats'}${total?' (un élément peut figurer dans plusieurs thèmes)':''}</p>${content||'<p class="panel">Aucun résultat. Essayez un autre mot ou effacez la recherche.</p>'}`;
}
