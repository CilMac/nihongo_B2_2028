(function(root){
 'use strict';
 const compact=s=>String(s||'').replace(/\s/g,'');
 function build(lessons,vocab,analyzer,level,scope,start=1){
  if(scope==='range'&&(!Number.isInteger(start)||start<1||start>level))return {vocab:[],grammar:[],rowCount:0,invalid:true};
  const selected=lessons.filter(r=>r.Ligne!=='S00'&&(scope==='lesson'?Number(r.Leçon.slice(1))===level:Number(r.Leçon.slice(1))<=level&&(scope!=='range'||Number(r.Leçon.slice(1))>=start)));
  const byId=new Map(selected.map(r=>[r.Leçon+'-'+r.Ligne,r]));
  const words=[];
  for(const word of vocab){
   const sources=[word.source,...(word.exemples_supplementaires||[]).map(e=>e.source)];
   const source=sources.map(s=>String(s).match(/N\d+-S\d+/)?.[0]).find(id=>byId.has(id)&&compact(byId.get(id).Japonais).includes(compact(word.mot)));
   if(source&&word.kana&&word.romaji&&word.fr)words.push({type:'vocab',id:word.id,word,source,row:byId.get(source)});
  }
  const forms=[];const seen=new Set();
  for(const row of selected){
   const result=analyzer.analyze(row);
   for(const part of result.segments){
    if(!part.form||!part.baseWord||!part.kana||!part.romaji||seen.has(part.jp))continue;
    seen.add(part.jp);forms.push({type:'grammar',id:row.Leçon+'-'+row.Ligne+'-'+part.jp,part,row,source:row.Leçon+'-'+row.Ligne});
   }
  }
  const labels=[...new Set(forms.map(q=>q.part.form))];
  return {vocab:words,grammar:forms.map(q=>({...q,options:labels})),rowCount:selected.length};
 }
 function shuffle(items,random=Math.random){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
 function session(pool,type,count){
  if(type!=='mixed')return shuffle(pool[type]).slice(0,count);
  const a=shuffle(pool.vocab),b=shuffle(pool.grammar),out=[];
  while(out.length<count&&(a.length||b.length)){if(a.length)out.push(a.pop());if(out.length<count&&b.length)out.push(b.pop());}
  return shuffle(out);
 }
 const api={build,shuffle,session};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.AtelierEngine=api;
})(globalThis);
