importScripts('romaji.js','corpus-search-engine.js?v=20261007-expressions','decorticage-auto.js','decorticage.js','particules.js','constructions.js','atelier-engine.js');
let docs=[];
onmessage=event=>{const {id,type,data,state}=event.data;try{
 if(type==='init'){const analyzer=Decorticage.create(data.vocab,data.annotations);data.analyses=data.lessons.map(row=>({row,result:analyzer.analyze(row)}));const analyses=new Map(data.analyses.map(a=>[a.row.Leçon+'-'+a.row.Ligne,a.result]));
 const pool=AtelierEngine.build(data.lessons,data.vocab,{analyze:row=>analyses.get(row.Leçon+'-'+row.Ligne)},98,'through');
 data.generatedExercises=[...pool.vocab.map(q=>({id:'vocabulary-'+q.id,type:'vocab',activity:'Vocabulaire',title:'Vocabulaire · '+q.word.mot,prompt:'Quel est le sens de ce mot ou de cette expression ?',texts:[{jp:q.word.mot,kana:q.word.kana,romaji:q.word.romaji}],explanation:q.word.fr,sources:[q.source]})),...pool.grammar.map(q=>({id:'form-'+q.id,type:'grammar',activity:'Formes verbales',title:'Forme verbale · '+q.part.jp,prompt:'Quelle est la forme de ce verbe ?',texts:[{jp:q.part.jp,kana:q.part.kana,romaji:q.part.romaji}],options:q.options.map(label=>({label})),explanation:q.part.form+' · '+q.part.baseWord.mot+' · '+q.part.baseWord.fr,sources:[q.source]}))];
 docs=CorpusSearchEngine.build(data);postMessage({id,ready:true,total:docs.length,categories:[...new Set(docs.map(d=>d.category).filter(Boolean))].sort(),chapters:[...new Set(docs.map(d=>d.chapter).filter(Boolean))].sort(),coverage:Object.fromEntries(Object.keys(CorpusSearchEngine.sources).map(s=>[s,docs.filter(d=>d.source===s).length]))});}
 else if(type==='query')postMessage({id,...CorpusSearchEngine.query(docs,state)});
 else if(type==='get'){const d=docs.find(d=>d.id===data);postMessage({id,record:d});}
}catch(error){postMessage({id,error:error.message});}};
