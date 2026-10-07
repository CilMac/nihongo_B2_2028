/* Index pédagogique local. Aucune réécriture des corpus sources. */
(function(root){
 'use strict';
 const norm=s=>String(s??'').normalize('NFKC').replace(/ō/g,'ou').replace(/Ō/g,'Ou').normalize('NFD').replace(/([a-zA-Z])[\u0300-\u036f]+/g,'$1').normalize('NFC').toLowerCase().replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-96)).replace(/[’‘]/g,"'");
 const compact=s=>norm(s).replace(/[ \t]+/g,'');
 const patterns=new Map();
 function matches(text,term,exact=false,normalized=false){
  const hay=normalized?text:norm(text),needle=normalized?term:norm(term);if(/^n\d+(?:-[st]\d+)?$/i.test(needle))exact=true;
  if(!/[a-z]/i.test(needle))return compact(hay).includes(compact(needle));
  const escaped=needle.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/ +/g,'[ \t]+');
  const key=needle+'|'+exact;if(!patterns.has(key)){if(patterns.size>512)patterns.clear();patterns.set(key,new RegExp('(^|[^\\p{L}\\p{N}])'+escaped+(exact?'(?=$|[^\\p{L}\\p{N}])':''),'u'));}return patterns.get(key).test(hay);
 }
 const sources={lecons:'Leçons',dictionnaire:'Dictionnaire',grammaire:'Grammaire',guide:'Guide de conversation',complements:'Compléments',atelier:'Atelier',decorticage:'Décorticage',expressions:'Expressions'};
 const kinds={mot:'Mots',phrase:'Phrases',explication:'Explications',tableau:'Tableaux',exercice:'Exercices'};
 const concepts=[
 ['destination','aller','direction','déplacement'],['durée','temps','heure','depuis','jusqu’à'],['invitation','inviter','proposer','rencontre'],['restaurant','repas','manger','menu','addition'],['paiement','payer','addition','prix','argent'],['politesse','poli','honorifique','humble'],['transport','train','gare','bus','avion'],['logement','hôtel','chambre','réservation'],['salutation','saluer','bonjour','bonsoir'],['santé','médecin','malade','douleur'],['négation','négatif','nier'],['passé','hier','autrefois']
 ];
 // Intentions explicites : elles orientent vers les explications existantes, sans inventer de réponse.
 const topics=[
  {label:'に ou で : lieu et action',pattern:/^(?:(?:difference entre|quand utiliser|particules?) )?(?:ni|に) (?:ou|et|vs|と) (?:de|で)$|^(?:ou se passe une action|lieu d une action)$/,ids:['G08','G09','G10','grammar:particles'],words:['に','で']},
  {label:'は et が : thème et sujet',pattern:/^(?:(?:difference entre|difference|quand utiliser|particules?) )?(?:wa|は) (?:(?:ou|et|vs|と) )?(?:ga|が)$/,ids:['G07'],words:['は','が']},
  {label:'Groupes de verbes',pattern:/^(?:(?:les |quels sont les )?(?:types?|groupes?) de verbes?|verbes? (?:de type|du groupe|de groupe|types?|groupes?)|godan|ichidan)$/,ids:['G05','G16','G25'],title:/\bverbes?\b|\bconjugaison\b/,words:['godan','ichidan','groupe','verbe']},
  {label:'Adverbes',pattern:/^(?:les |qu est ce qu un )?adverbes?$/,ids:[],title:/\badverbes?\b/,words:['adverbe']},
  {label:'Adjectifs en i et en na',pattern:/^(?:types? d adjectifs?|groupes? d adjectifs?|adjectifs?(?: en)? i (?:ou|et) na|adjectifs? de type)$/,ids:['G13','G14'],words:['adjectif']},
  {label:'Forme en te',pattern:/^(?:(?:comment |construire |former |faire )*(?:la )?)forme (?:en )?(?:te|て)$/,ids:['G16'],words:['forme','て']},
  {label:'Dire ce que l’on veut faire',pattern:/^(?:(?:comment dire )?je (?:veux|voudrais)|exprimer (?:un souhait|une envie))$/,ids:['G19'],words:['たい','vouloir']}
 ];
 // Les précisions restent des contraintes, jamais des mots à supprimer.
 function recognizeQuestion(key){
  const core=key.replace(/\b(peux|pouvez|faut|dois)-(tu|vous|il|je)\b/g,'$1 $2').replace(/^(?:peux tu |pouvez vous )?(?:m expliquer |expliquer |explique moi )/,'').replace(/^(?:quelle est |c est quoi )/,'').replace(/^la difference /,'difference ').replace(/\b(?:employer|employe|utilise)\b/g,'utiliser').replace(/plutot que/g,'ou').replace(/\b(?:premier|1er)\b/g,'1').replace(/\b(?:deuxieme|second|2e|2eme)\b/g,'2').replace(/\b(?:troisieme|3e|3eme)\b/g,'3');
  const pair=/^(?:(?:difference (?:entre )?|quand utiliser |quand (?:faut il |dois je )?utiliser |particules? ))?(ni|に|de|で|wa|は|ga|が) (?:ou |et |vs |et la particule )?(ni|に|de|で|wa|は|ga|が)$/.exec(core);
  if(pair){const ids={ni:'ni','に':'ni',de:'de','で':'de',wa:'wa','は':'wa',ga:'ga','が':'ga'},a=ids[pair[1]],b=ids[pair[2]];if(a!==b){if([a,b].every(v=>['ni','de'].includes(v)))return topics[0];if([a,b].every(v=>['wa','ga'].includes(v)))return topics[1];}}
  const group=/^(?:les )?(?:verbes? (?:du |de |de type |de groupe |du groupe )?(?:groupe )?([123])(?: groupe)?|(?:groupe|type) ([123]) (?:de )?verbes?|verbes? (ichidan|godan)|(?:ichidan|godan))$/.exec(core);
  if(group){const n=group[1]||group[2]||(core.includes('ichidan')?'2':'1');return {label:'Verbes du groupe '+n,ids:[],title:/\bverbes?\b|\bconjugaison\b|forme en te/,words:['groupe '+n],required:[new RegExp('\\bgroupe '+n+'\\b|\\b'+({1:'godan',2:'ichidan',3:'irreguliers?'})[n]+'\\b')]};}
  if(/^(?:(?:comment (?:former|faire|conjuguer)|conjuguer) (?:un verbe )?(?:a |au |a la )?)?(?:forme )?(?:(?:negatif|negative) (?:au )?passe|passe negatif)(?: (?:d un verbe|des verbes|poli|polie))?$/.test(core))return {label:'Passé négatif des verbes',ids:['G05'],words:['passé','négatif'],required:[/passe/,/negati|negation/]};
  const simple=[
   [/^(?:comment (?:dire|exprimer) )?(?:il y a|l existence|la presence)$/, 'Dire qu’il y a quelque chose ou quelqu’un','G08'],
   [/^(?:comment (?:dire|exprimer) )?(?:parce que|une raison|la cause)$/, 'Exprimer une raison','G24'],
   [/^(?:comment (?:dire|exprimer) )?(?:je pense que|son opinion|une opinion)$/, 'Dire ce que l’on pense','G26'],
   [/^(?:comment (?:dire|exprimer) )?(?:pouvoir|je peux|la capacite)$/, 'Dire ce que l’on sait faire','G28'],
   [/^(?:comment (?:dire|exprimer) )?(?:une action en cours|en train de)$/, 'Action en cours ou état','G18'],
   [/^(?:comment )?(?:faire une demande|demander poliment|dire s il vous plait)$/, 'Demander de faire quelque chose','G17'],
   [/^(?:comment )?(?:proposer une activite|faire une invitation|inviter quelqu un)$/, 'Proposer de faire quelque chose ensemble','G15']
  ];
  const found=simple.find(([p])=>p.test(core));if(found)return {label:found[1],ids:[found[2]],words:[]};
  return topics.find(t=>t.pattern.test(core));
 }
 const stopwords=new Set('l d c j s t il elle ils elles je tu vous nous de du des le la les un une et ou en au aux a ce cette ces dans pour par avec sur est sont comment quelle quelles quels quel entre difference utiliser expliquer explique moi peux tu que qu'.split(' '));
 const questionKey=q=>norm(q).replace(/[’']/g,' ').replace(/[?!.,;:]/g,' ').replace(/\s+/g,' ').trim();
 function searchPlan(q,mode){
  const quoted=q.includes('"'),key=questionKey(q);
  const topic=mode!=='exact'&&!quoted?recognizeQuestion(key):null;
  const raw=terms(q,mode);
  const clean=mode==='exact'||quoted?raw:key.split(' ').filter(Boolean);
  const useful=clean.length>1&&!quoted&&mode!=='exact'?clean.filter(t=>!stopwords.has(t)):clean;
  return {topic,tokens:topic?topic.words.map(norm):useful.length?useful:clean};
 }
 function topicMatch(d,topic){
  if(d.source!=='grammaire'||!['explication','tableau'].includes(d.kind))return false;
  const relevant=topic.ids.some(id=>d.id===id||d.id.startsWith(id+':'))||!!(topic.title&&topic.title.test(norm(d.title)));
  return relevant&&(!topic.required||topic.required.every(re=>d.parts.some(p=>!p.secret&&re.test(norm(p.text)))));
 }
 const ignore=new Set(['id','type','source','sources','reference','url','affichage','origine','origin','ordre','version','date','consulte_le','romaji_disponible','prerequis','lecons','grammarCards','accepted','acceptedOrders','bonne_reponse','value','row','counts','known','partial','stale','wordId','ruleId','baseWord','structureOrigin','literalOrigin','annotations']);
 const jpKeys=new Set(['jp','kana','Japonais','Kana','mot','japanese']);
 const roKeys=new Set(['romaji','Romaji','pronunciation']);
 function fragments(value,key='',secret=false,out=[]){
  if(value==null)return out;
  if(typeof value==='string'){
   if(value.trim()&&!/^https?:/.test(value))out.push({text:value,reading:key==='kana'||key==='Kana',lang:jpKeys.has(key)?'ja':roKeys.has(key)?'romaji':/[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(value)&&!/[a-zA-ZÀ-ÿ]/.test(value)?'ja':'fr',secret});
  }else if(Array.isArray(value))value.forEach(v=>fragments(v,key,secret,out));
  else if(typeof value==='object')for(const [k,v] of Object.entries(value))if(!ignore.has(k))fragments(v,k,secret,out);
  return out;
 }
 function refs(v){return [...new Set((JSON.stringify(v).match(/\bN\d+(?=-|"|\b)/g)||[]).map(n=>Number(n.slice(1))))].sort((a,b)=>a-b);}
 function build(data){
  const docs=[];
  function add(d){
   const seen=new Set();d.parts=d.parts.filter(p=>{const key=p.lang+'|'+p.secret+'|'+p.text;if(seen.has(key))return false;seen.add(key);return true;});
   if(!d.parts.length)return;
   d.lessons=d.lessons||[];d.category=d.category||'';d.chapter=d.chapter||'';d.kinds=d.kinds||[d.kind];d.themes=d.themes||[];
   d.keys={all:norm([d.title,d.location,...d.lessons.map(n=>'N'+n),...d.parts.map(p=>p.text),...(d.source==='expressions'?(d.searchParts||[]).map(p=>p.text):[])].join('\n'))};
   for(const lang of ['ja','romaji','fr'])d.keys[lang]=norm([...d.parts,...(d.searchParts||[])].filter(p=>p.lang===lang).map(p=>p.text).join('\n'));
   d.titleKey=compact(d.title);d.signature=d.kind==='phrase'&&['lecons','dictionnaire'].includes(d.source)&&d.audioRef?d.audioRef+'|'+compact(d.parts.filter(p=>p.lang==='ja').map(p=>p.text).join('|'))+'|'+compact(d.parts.filter(p=>p.lang==='fr').map(p=>p.text).join('|')):d.id;docs.push(d);
  }
  for(const r of data.lessons)add({id:'lesson:'+r.Leçon+'-'+r.Ligne,source:'lecons',kind:'phrase',title:r.Leçon+' · '+r.Ligne,location:'Leçon '+r.Leçon.slice(1),href:'#lecons/'+r.Leçon+'/'+r.Ligne,anchor:r.Ligne,favorite:r.Leçon+'-'+r.Ligne,audioRef:r.Leçon+'-'+r.Ligne,lessons:[Number(r.Leçon.slice(1))],parts:fragments({jp:r.Japonais,kana:r.Kana,romaji:r.Romaji,fr:r.Français})});
  for(const v of data.vocab){
   const base={source:'dictionnaire',category:v.categorie_grammaticale,href:'#dictionnaire/'+v.id,anchor:v.id,favorite:v.id,lessons:refs(v),location:'Dictionnaire · '+v.source};
   add({...base,id:v.id,kind:'mot',title:v.mot+' · '+v.fr,parts:fragments({mot:v.mot,kana:v.kana,romaji:v.romaji,fr:v.fr,forme_base:v.forme_base,forme_exemple:v.forme_exemple,variantes_source:v.variantes_source,note:v.note})});
   for(const [i,e] of [v.exemple,...(v.exemples_supplementaires||[])].filter(Boolean).entries())add({...base,id:v.id+':example:'+i,kind:'phrase',exampleIndex:i,title:'Exemple · '+v.mot,lessons:refs(e.source||v.source),parts:fragments(e),reveal:'details',audioRef:(e.source||v.source).match(/N\d+-S\d+/)?.[0]});
  }
  for(const f of data.grammar.fiches){
   const base={source:'grammaire',location:f.id+' · '+f.titre,href:'#grammaire/'+f.id,favorite:f.id,lessons:refs(f.lecons),category:f.famille};
   for(const [key,value] of Object.entries(f)){
    if(ignore.has(key)||['exercice','exercices','famille','niveau'].includes(key))continue;
    add({...base,id:f.id+':'+key,kind:key==='vocabulaire'?'mot':['tableau','synthese','formation'].includes(key)?'tableau':key==='exemples'||key==='constructions'?'phrase':'explication',title:f.titre+' · '+key.replace(/_/g,' '),parts:fragments(value),target:key});
   }
   for(const [i,q] of (f.exercices||[f.exercice]).filter(Boolean).entries())add({...base,id:f.id+':exercise:'+i,kind:'exercice',title:q.consigne,parts:[...fragments({consigne:q.consigne,options:q.options.map(o=>({jp:o.jp,kana:o.kana,romaji:o.romaji}))}),...fragments({options:q.options,explication:q.explication,reponse:q.options.find(o=>o.id===q.bonne_reponse)},'',true)],exerciseIndex:i,target:'exercice'});
  }
  add({id:'grammar:particles',source:'grammaire',kind:'tableau',title:'Les particules en un coup d’œil',location:'Grammaire · tableau des particules',href:'#grammaire/particules',parts:fragments(data.grammar.tableau_particules)});
  for(const r of data.foundations||[])add(r);
  for(const r of data.complements)add({id:'complement:'+r.Leçon+'-'+r.Ligne,source:'complements',kind:'phrase',title:r.Leçon+' · '+r.Ligne,location:'Compléments · Leçon '+r.Leçon.slice(1),href:'#lecons/'+r.Leçon,complement:r.Leçon+'-'+r.Ligne,lessons:[Number(r.Leçon.slice(1))],audioRef:r.Leçon+'-'+r.Ligne,parts:fragments({jp:r.Japonais,kana:r.Kana,romaji:r.Romaji,fr:r.Français,note:data.complementNotes?.[r.Leçon+'-'+r.Ligne]})});
  for(const g of data.guide)add(g);
  for(const e of data.expressions||[])add(e);
  for(const q of [...data.exercises,...(data.generatedExercises||[])])add({id:'exercise:'+q.id,source:'atelier',kind:'exercice',title:q.title,location:'Atelier · '+q.activity,href:'#atelier/recherche/'+encodeURIComponent(q.id),lessons:refs(q.sources),category:({particles:'Particules',constructions:'Constructions',vocab:'Vocabulaire',grammar:'Formes verbales'})[q.type],parts:[...fragments({prompt:q.prompt,texts:q.texts,given:q.given,options:q.options?.map(o=>{const {fr,...rest}=o;return rest;}),groups:q.groups}),...fragments({explication:q.explanation,translation:q.translation,reponses:q.accepted?.map(a=>{const o=q.options?.find(o=>o.id===a||o.value===a);return o?o.text||o.label||{jp:o.jp,kana:o.kana,romaji:o.romaji,fr:o.fr}:a;}),ordre:q.acceptedOrders?.map(order=>order.map(id=>q.groups.find(g=>g.id===id)).filter(Boolean)),choix:q.options},'',true)],exercise:q});
  for(const [group,values] of Object.entries(data.annotations))if(['rules','samples'].includes(group))for(const [i,v] of values.entries())add({id:'analysis:'+group+':'+i,source:'decorticage',kind:'explication',title:v.label||v.meaning||v.id,location:'Décorticage · '+(v.id||''),href:/^N\d+-S/.test(v.id)?'#lecons/'+v.id.replace('-','/'):'#grammaire/recherche/'+encodeURIComponent('analysis:'+group+':'+i),lessons:refs(v.id),parts:fragments(v)});
  for(const {row,result} of data.analyses||[])add({id:'analysis:'+row.Leçon+'-'+row.Ligne,source:'decorticage',kind:'explication',title:row.Leçon+' · '+row.Ligne+' · Décorticage',location:'Décorticage · '+(result.partial?'Analyse partielle, à interpréter dans le contexte':'Analyse locale'),href:'#lecons/'+row.Leçon+'/'+row.Ligne,anchor:row.Ligne,reveal:'details',lessons:[Number(row.Leçon.slice(1))],parts:fragments({structure:result.structure,literal:result.literal,note:result.note,segments:result.segments.map(({jp,kana,romaji,fr,explanation,base,form,gloss})=>({jp,kana,romaji,fr,explanation,base,form,gloss}))})});
  return docs;
 }
 function terms(query,mode){const q=query.trim();return (mode==='exact'?[q.replace(/^"|"$/g,'')]:[...q.matchAll(/"([^"]+)"|(\S+)/g)].map(m=>m[1]||m[2])).filter(Boolean).map(norm);}
 function query(docs,state){
  const plan=searchPlan(state.q||'',state.mode),tokens=plan.tokens,quoted=new Set([...String(state.q||'').matchAll(/"([^"]+)"/g)].map(m=>norm(m[1])));
  const aliases=new Map(tokens.map(t=>[t,[t]]));
  if(state.mode==='notion')for(const token of tokens){
   const alternatives=concepts.filter(c=>c.some(t=>norm(t)===token)).flat().map(norm);
   if(token.length>2)for(const d of docs)if(d.source==='dictionnaire'&&d.kind==='mot'&&d.parts.some(p=>matches(p.text,token,true)))alternatives.push(...d.parts.filter(p=>['ja','romaji'].includes(p.lang)).map(p=>norm(p.text)));
   aliases.set(token,[...new Set([token,...alternatives])].slice(0,60));
  }
  const favs=new Set(state.favorites||[]);const match=[];
  for(const d of docs){
   const hay=d.keys[state.lang||'all'];
   const literal=tokens.every(t=>matches(hay,t,state.mode==='exact'||quoted.has(t)||t.length<=3,true)||(!plan.topic&&state.mode!=='exact'&&!quoted.has(t)&&t.length>4&&t.endsWith('s')&&matches(hay,t.slice(0,-1),false,true)));
   const semantic=plan.topic&&['all','fr'].includes(state.lang||'all')&&topicMatch(d,plan.topic);
   const direct=!plan.topic&&literal;
   const related=!!semantic||(!plan.topic&&!direct&&state.mode==='notion'&&tokens.every(t=>aliases.get(t).some(e=>matches(hay,e,false,true))));
   if(!direct&&!related)continue;
   if(state.scope!=='all'&&state.scope){const lo=state.scope==='through'?1:Number(state.from||1),hi=state.scope==='lesson'?lo:Number(state.to||98);if(!d.lessons.length||!d.lessons.every(n=>n>=lo&&n<=hi))continue;}
   if(state.category&&d.category!==state.category||state.chapter&&d.chapter!==state.chapter||state.theme&&!d.themes.includes(state.theme))continue;
   if(state.onlyFavorites&&!favs.has(d.favorite||'corpus:'+d.id))continue;
   const score=(semantic?220+(d.kind==='explication'?20:0)+(/:(explication|synthese)$/.test(d.id)?15:0):0)+(direct?100:0)+(!plan.topic&&tokens.length>1&&matches(hay,questionKey(state.q||''),true,true)?50:0)+tokens.reduce((s,t)=>s+(d.titleKey===compact(t)?40:matches(d.title,t)?15:0),0)+(d.kind==='mot'?3:0);
   match.push({d,score,related:!!related});
  }
  const counts={sources:{},kinds:{}},sourceSets={},kindSets={};
  for(const {d} of match){
   if(!state.kind||d.kinds.includes(state.kind))(sourceSets[d.source]||=new Set()).add(plan.topic?(d.href||d.id):(d.signature||d.id));
   if(!state.source||d.source===state.source)for(const k of d.kinds)(kindSets[k]||=new Set()).add(plan.topic?(d.href||d.id):(d.signature||d.id));
  }
  for(const [k,v] of Object.entries(sourceSets))counts.sources[k]=v.size;
  for(const [k,v] of Object.entries(kindSets))counts.kinds[k]=v.size;
  const filtered=match.filter(({d})=>(!state.source||d.source===state.source)&&(!state.kind||d.kinds.includes(state.kind))).sort((a,b)=>b.score-a.score||(Number(b.d.source==='lecons')-Number(a.d.source==='lecons'))||a.d.id.localeCompare(b.d.id,'fr',{numeric:true}));
  const groups=new Map();for(const item of filtered){const key=plan.topic?(item.d.href||item.d.id):(item.d.signature||item.d.id);if(!groups.has(key))groups.set(key,{...item,alternatives:[]});else{const group=groups.get(key);if(group.d.href!==item.d.href&&!group.alternatives.some(d=>d.href===item.d.href))group.alternatives.push({id:item.d.id,href:item.d.href,title:item.d.title,location:item.d.location,source:item.d.source,anchor:item.d.anchor,reveal:item.d.reveal,exampleIndex:item.d.exampleIndex});}}
  const results=[...groups.values()],offset=state.offset||0;
  return {intent:plan.topic?.label||'',total:results.length,counts,items:results.slice(offset,offset+30).map(({d,related,alternatives})=>{const {keys,titleKey,signature,...record}=d;const example=plan.topic&&!plan.topic.required?docs.find(e=>e.source==='grammaire'&&e.href===d.href&&e.target==='exemples'):null;return {...record,related,alternatives,exampleParts:example?example.parts.filter(p=>!p.secret).slice(0,4):[]};}),tokens,suggestions:[...(!results.length&&!plan.topic?topics.filter(t=>tokens.some(w=>w.length>3&&matches(t.label,w.replace(/s$/,'')))).map(t=>t.label):[]),...concepts.filter(c=>c.some(t=>norm(t).includes(norm(state.q||'')))&&(state.q||'').length>1).map(c=>c[0])].slice(0,6)};
 }
 const api={norm,compact,matches,fragments,build,query,sources,kinds,concepts};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CorpusSearchEngine=api;
})(globalThis);
