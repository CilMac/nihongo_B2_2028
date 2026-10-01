/* Tri et recherche : normaliser les clés, jamais le texte du Guide affiché. */
(function(root){
 'use strict';
 const key=text=>String(text||'').normalize('NFD').replace(/([a-z])[\u0300-\u036f]+/gi,'$1').normalize('NFC').toLowerCase().trim().replace(/\s+/g,' ');
 const compact=text=>key(text).replace(/\s/g,'');
 const collator=new Intl.Collator('fr',{sensitivity:'base',ignorePunctuation:true,numeric:true});
 const head=(row,direction)=>direction==='ja-fr'?row.reading:row.french;
 const initialLetter=text=>text.replace(/^[^\p{L}\p{N}]+/u,'').match(/^[a-z]/)?.[0].toUpperCase()||'#';
 const letter=(row,direction='fr-ja')=>prepare(row).initials[direction==='ja-fr'?'ja-fr':'fr-ja'];
 const index=new WeakMap();
 function prepare(row){
  let entry=index.get(row);
  if(!entry||entry.french!==row.french||entry.reading!==row.reading||entry.japanese!==row.japanese){
   const french=key(row.french),reading=key(row.reading);
   entry={french:row.french,reading:row.reading,japanese:row.japanese,
    heads:{'fr-ja':french,'ja-fr':reading},
    initials:{'fr-ja':initialLetter(french),'ja-fr':initialLetter(reading)},
    fields:{'fr-ja':[compact(row.french)],'ja-fr':[compact(row.japanese),compact(row.reading)]}};
   index.set(row,entry);
  }
  return entry;
 }
 function select(rows,{direction='fr-ja',category='all',initial='all',query=''}={}){
  direction=direction==='ja-fr'?'ja-fr':'fr-ja';
  const terms=key(query).split(/\s+/).filter(Boolean),whole=compact(query);
  const fields=row=>prepare(row).fields[direction];
  const candidates=rows.filter(row=>(category==='all'||row.table.chapter.id===category)&&terms.every(t=>fields(row).some(f=>f.includes(t))));
  const initials=new Set(candidates.map(row=>prepare(row).initials[direction]));
  const matches=candidates.filter(row=>initial==='all'||prepare(row).initials[direction]===initial);
  const rank=row=>whole&&fields(row).includes(whole)?0:1;
  matches.sort((a,b)=>rank(a)-rank(b)||collator.compare(prepare(a).heads[direction],prepare(b).heads[direction])||collator.compare(a.id,b.id));
  return {rows:matches,initials};
 }
 const api={key,head,letter,select};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GuideLexicon=api;
})(globalThis);
