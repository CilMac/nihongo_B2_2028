/* Liens de lecture : repérages conservateurs, indépendants d’un niveau acquis. */
(function(root){
 'use strict';
 const token=s=>String(s).match(/[^\s。、！？!?]+/gu)||[];
 function find(rows,cards){
  const checks={
   G02:r=>/(?:です|ます|ました|ません|でした|ませんでした)\s*か[。！？!?]?\s*$/.test(r.Kana),
   G04:r=>token(r.Japonais).some(t=>['これ','それ','あれ','この','その','あの'].includes(t)),
   G05:r=>/(?:ます|ません|ました|ませんでした)(?:\s*(?:か|ね|よ))?[。！？!?]?\s*$/.test(r.Kana),
   G07:r=>token(r.Japonais).some((t,i,a)=>t==='は'&&a[i-1]!=='で'),
   G08:r=>token(r.Kana).some((t,i,a)=>['あります','ありません','います','いません'].includes(t)&&(!a[i-1]||!/[てで]$/.test(a[i-1]))),
   G09:r=>/へ\s+(?:行|来|帰)/.test(r.Japonais),
   G11:r=>/\sから\s.+\sまで(?:\s|[。！？!?]|$)/.test(r.Japonais),
   G15:r=>/ましょう(?:\s*か)?[。！？!?]?\s*$/.test(r.Kana),
   G17:r=>/[てで]\s*ください/.test(r.Kana),
   G18:r=>/[てで]\s+い(?:ます|ました|ません)/.test(r.Kana),
   G19:r=>/たい\s*です/.test(r.Kana),
   G20:r=>token(r.Japonais).includes('つもり')
  };
  const lesson=rows[0]?.Leçon;
  return cards.map(card=>{
   // Existing explicit references retain priority and their exact source when available.
   const explicit=card.lecons.includes(lesson);
   const example=card.exemples.find(e=>e.source.startsWith(lesson+'-'));
   const direct=example&&rows.find(r=>r.Ligne===example.source.split('-')[1]);
   const detected=rows.find(r=>r.Ligne!=='S00'&&checks[card.id]?.(r));
   return explicit||detected?{card,row:direct||detected||null,explicit}:null;
  }).filter(Boolean).sort((a,b)=>Number(b.explicit)-Number(a.explicit));
 }
 const api={find};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LessonLinks=api;
})(globalThis);
