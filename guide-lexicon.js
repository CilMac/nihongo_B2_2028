/* Tri et recherche : normaliser les clés, jamais le texte du Guide affiché. */
(function(root){
 'use strict';
 const key=text=>String(text||'').normalize('NFD').replace(/([a-z])[\u0300-\u036f]+/gi,'$1').normalize('NFC').toLowerCase().trim().replace(/\s+/g,' ');
 const compact=text=>key(text).replace(/\s/g,'');
 const collator=new Intl.Collator('fr',{sensitivity:'base',ignorePunctuation:true,numeric:true});
 const head=(row,direction)=>direction==='ja-fr'?row.reading:row.french;
 const letter=(row,direction)=>key(head(row,direction)).replace(/^[^\p{L}\p{N}]+/u,'').match(/^[a-z]/)?.[0].toUpperCase()||'#';
 function select(rows,{direction='fr-ja',category='all',initial='all',query=''}={}){
  const terms=key(query).split(/\s+/).filter(Boolean),whole=compact(query);
  const fields=row=>direction==='ja-fr'?[row.japanese,row.reading]:[row.french];
  const candidates=rows.filter(row=>(category==='all'||row.table.chapter.id===category)&&terms.every(t=>fields(row).some(f=>compact(f).includes(compact(t)))));
  const initials=new Set(candidates.map(row=>letter(row,direction)));
  const matches=candidates.filter(row=>initial==='all'||letter(row,direction)===initial);
  const rank=row=>whole&&fields(row).some(f=>compact(f)===whole)?0:1;
  matches.sort((a,b)=>rank(a)-rank(b)||collator.compare(key(head(a,direction)),key(head(b,direction)))||collator.compare(a.id,b.id));
  return {rows:matches,initials};
 }
 const api={key,head,letter,select};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GuideLexicon=api;
})(globalThis);
