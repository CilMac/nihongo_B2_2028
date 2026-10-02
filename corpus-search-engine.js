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
 const sources={lecons:'Leçons',dictionnaire:'Dictionnaire',grammaire:'Grammaire',guide:'Guide',complements:'Compléments',atelier:'Atelier',decorticage:'Décorticage'};
 const kinds={mot:'Mots',phrase:'Phrases',explication:'Explications',tableau:'Tableaux',exercice:'Exercices'};
 const concepts=[
 ['destination','aller','direction','déplacement'],['durée','temps','heure','depuis','jusqu’à'],['invitation','inviter','proposer','rencontre'],['restaurant','repas','manger','menu','addition'],['paiement','payer','addition','prix','argent'],['politesse','poli','honorifique','humble'],['transport','train','gare','bus','avion'],['logement','hôtel','chambre','réservation'],['salutation','saluer','bonjour','bonsoir'],['santé','médecin','malade','douleur'],['négation','négatif','nier'],['passé','hier','autrefois']
 ];
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
   d.keys={all:norm([d.title,d.location,...d.lessons.map(n=>'N'+n),...d.parts.map(p=>p.text)].join('\n'))};
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
  for(const q of [...data.exercises,...(data.generatedExercises||[])])add({id:'exercise:'+q.id,source:'atelier',kind:'exercice',title:q.title,location:'Atelier · '+q.activity,href:'#atelier/recherche/'+encodeURIComponent(q.id),lessons:refs(q.sources),category:({particles:'Particules',constructions:'Constructions',vocab:'Vocabulaire',grammar:'Formes verbales'})[q.type],parts:[...fragments({prompt:q.prompt,texts:q.texts,given:q.given,options:q.options?.map(o=>{const {fr,...rest}=o;return rest;}),groups:q.groups}),...fragments({explication:q.explanation,translation:q.translation,reponses:q.accepted?.map(a=>{const o=q.options?.find(o=>o.id===a||o.value===a);return o?o.text||o.label||{jp:o.jp,kana:o.kana,romaji:o.romaji,fr:o.fr}:a;}),ordre:q.acceptedOrders?.map(order=>order.map(id=>q.groups.find(g=>g.id===id)).filter(Boolean)),choix:q.options},'',true)],exercise:q});
  for(const [group,values] of Object.entries(data.annotations))if(['rules','samples'].includes(group))for(const [i,v] of values.entries())add({id:'analysis:'+group+':'+i,source:'decorticage',kind:'explication',title:v.label||v.meaning||v.id,location:'Décorticage · '+(v.id||''),href:/^N\d+-S/.test(v.id)?'#lecons/'+v.id.replace('-','/'):'#grammaire/recherche/'+encodeURIComponent('analysis:'+group+':'+i),lessons:refs(v.id),parts:fragments(v)});
  for(const {row,result} of data.analyses||[])add({id:'analysis:'+row.Leçon+'-'+row.Ligne,source:'decorticage',kind:'explication',title:row.Leçon+' · '+row.Ligne+' · Décorticage',location:'Décorticage · '+(result.partial?'Analyse partielle, à interpréter dans le contexte':'Analyse locale'),href:'#lecons/'+row.Leçon+'/'+row.Ligne,anchor:row.Ligne,reveal:'details',lessons:[Number(row.Leçon.slice(1))],parts:fragments({structure:result.structure,literal:result.literal,note:result.note,segments:result.segments.map(({jp,kana,romaji,fr,explanation,base,form,gloss})=>({jp,kana,romaji,fr,explanation,base,form,gloss}))})});
  return docs;
 }
 function terms(query,mode){const q=query.trim();return (mode==='exact'?[q.replace(/^"|"$/g,'')]:[...q.matchAll(/"([^"]+)"|(\S+)/g)].map(m=>m[1]||m[2])).filter(Boolean).map(norm);}
 function query(docs,state){
  const tokens=terms(state.q||'',state.mode),quoted=new Set([...String(state.q||'').matchAll(/"([^"]+)"/g)].map(m=>norm(m[1])));
  const aliases=new Map(tokens.map(t=>[t,[t]]));
  if(state.mode==='notion')for(const token of tokens){
   const alternatives=concepts.filter(c=>c.some(t=>norm(t)===token)).flat().map(norm);
   if(token.length>2)for(const d of docs)if(d.source==='dictionnaire'&&d.kind==='mot'&&d.parts.some(p=>matches(p.text,token,true)))alternatives.push(...d.parts.filter(p=>['ja','romaji'].includes(p.lang)).map(p=>norm(p.text)));
   aliases.set(token,[...new Set([token,...alternatives])].slice(0,60));
  }
  const favs=new Set(state.favorites||[]);const match=[];
  for(const d of docs){
   const hay=d.keys[state.lang||'all'];const direct=tokens.every(t=>matches(hay,t,state.mode==='exact'||quoted.has(t),true));
   const related=!direct&&state.mode==='notion'&&tokens.every(t=>aliases.get(t).some(e=>matches(hay,e,false,true)));
   if(!direct&&!related)continue;
   if(state.scope!=='all'&&state.scope){const lo=state.scope==='through'?1:Number(state.from||1),hi=state.scope==='lesson'?lo:Number(state.to||98);if(!d.lessons.length||!d.lessons.every(n=>n>=lo&&n<=hi))continue;}
   if(state.category&&d.category!==state.category||state.chapter&&d.chapter!==state.chapter||state.theme&&!d.themes.includes(state.theme))continue;
   if(state.onlyFavorites&&!favs.has(d.favorite||'corpus:'+d.id))continue;
   const score=(direct?100:0)+tokens.reduce((s,t)=>s+(d.titleKey===compact(t)?40:matches(d.title,t)?15:0),0)+(d.kind==='mot'?3:0);
   match.push({d,score,related:!!related});
  }
  const counts={sources:{},kinds:{}},sourceSets={},kindSets={};
  for(const {d} of match){
   if(!state.kind||d.kinds.includes(state.kind))(sourceSets[d.source]||=new Set()).add(d.signature||d.id);
   if(!state.source||d.source===state.source)for(const k of d.kinds)(kindSets[k]||=new Set()).add(d.signature||d.id);
  }
  for(const [k,v] of Object.entries(sourceSets))counts.sources[k]=v.size;
  for(const [k,v] of Object.entries(kindSets))counts.kinds[k]=v.size;
  const filtered=match.filter(({d})=>(!state.source||d.source===state.source)&&(!state.kind||d.kinds.includes(state.kind))).sort((a,b)=>b.score-a.score||(Number(b.d.source==='lecons')-Number(a.d.source==='lecons'))||a.d.id.localeCompare(b.d.id,'fr',{numeric:true}));
  const groups=new Map();for(const item of filtered){const key=item.d.signature||item.d.id;if(!groups.has(key))groups.set(key,{...item,alternatives:[]});else{const group=groups.get(key);if(group.d.href!==item.d.href&&!group.alternatives.some(d=>d.href===item.d.href))group.alternatives.push({id:item.d.id,href:item.d.href,title:item.d.title,location:item.d.location,source:item.d.source,anchor:item.d.anchor,reveal:item.d.reveal,exampleIndex:item.d.exampleIndex});}}
  const results=[...groups.values()],offset=state.offset||0;
  return {total:results.length,counts,items:results.slice(offset,offset+30).map(({d,related,alternatives})=>{const {keys,titleKey,signature,...record}=d;return {...record,related,alternatives};}),tokens,suggestions:concepts.filter(c=>c.some(t=>norm(t).includes(norm(state.q||'')))&&(state.q||'').length>1).map(c=>c[0]).slice(0,6)};
 }
 const api={norm,compact,matches,fragments,build,query,sources,kinds,concepts};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CorpusSearchEngine=api;
})(globalThis);
