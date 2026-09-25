/* Règles générales : lectures et lemmes attestés dans le dictionnaire local. */
(function(root) {
 'use strict';
 const key = s => String(s || '').normalize('NFC').replace(/\s/g,'');
 const split = s => String(s || '').match(/[^\s。、！？!?]+|[。、！？!?]/gu) || [];
 const punct = s => /^[。、！？!?]$/u.test(s);
 const particles = {
  'へ':['e','direction','Indique une direction après un lieu.'],
  'を':['o','objet ou parcours','Peut marquer l’objet d’une action ou un lieu parcouru ; son rôle dépend du verbe.'],
  'は':['wa','thème','Présente le thème ou un contraste.'],
  'が':['ga','rôle à préciser','Peut marquer un sujet ou relier des propositions ; le contexte est nécessaire.'],
  'に':['ni','rôle à préciser','Peut indiquer notamment un lieu, un moment, une destination ou un destinataire.'],
  'で':['de','rôle à préciser','Peut marquer notamment le lieu d’une action ou un moyen.'],
  'の':['no','relation à préciser','Peut relier des noms ; d’autres usages existent.'],
  'と':['to','rôle à préciser','Peut relier des noms, indiquer un accompagnement ou introduire une citation.'],
  'も':['mo','aussi','Ajoute un élément, avec une nuance qui dépend du contexte.'],
  'か':['ka','question ou alternative','Peut marquer une question ou une alternative.'],
  'ね':['ne','accord partagé','Invite à partager un constat ou exprime un accord.'],
  'よ':['yo','information soulignée','Présente une information à l’interlocuteur avec insistance.']
 };
 const endings = [
  ['ませんでした','masen deshita','négatif passé poli'],
  ['ましょう','mashou','proposition polie'],
  ['ました','mashita','passé poli'],
  ['ません','masen','négatif non-passé poli'],
  ['ます','masu','non-passé poli']
 ];
 function create(vocabulary) {
  const index = new Map(), stems = new Map();
  for (const w of vocabulary) {
   const k=key(w.mot); if(!index.has(k))index.set(k,[]); index.get(k).push(w);
   if(w.forme_base) for(const [ending,roman] of endings) {
    const r=String(w.romaji || '').replace(/\.$/,'');
    if(!k.endsWith(ending) || !key(w.kana).endsWith(ending) || !r.endsWith(roman))continue;
    const stem=k.slice(0,-ending.length), entry={base:w.forme_base,kana:key(w.kana).slice(0,-ending.length),romaji:r.slice(0,-roman.length)};
    if(!stems.has(stem))stems.set(stem,[]);stems.get(stem).push(entry);break;
   }
  }
  function lookup(surface,reading) {
   const all=index.get(key(surface)) || [];
   const matches=reading ? all.filter(w=>key(w.kana)===key(reading)) : all;
   return matches.length===1 ? matches[0] : null;
  }
  function analyze(row) {
   const japanese=split(row.Japonais), readings=split(row.Kana);
   const aligned=japanese.length===readings.length;
   const segments=[], literal=[];
   for(let i=0;i<japanese.length;) {
    if(punct(japanese[i])) {literal.push(japanese[i]==='、'?',':'.');i++;continue;}
    let span=1, surface=japanese[i], reading=aligned ? readings[i] : '';
    // Longest dictionary group, never crossing a punctuation boundary.
    let word=lookup(surface,reading);
    if(!particles[surface]) for(let n=Math.min(4,japanese.length-i);n>1;n--) {
     const chunk=japanese.slice(i,i+n);if(chunk.some(punct))continue;
     const r=aligned ? readings.slice(i,i+n).join(' ') : '';
     const candidate=lookup(chunk.join(' '),r);
     if(candidate){span=n;surface=chunk.join(' ');reading=r;word=candidate;break;}
    }
    const particle=particles[surface];
    let base=word?.forme_base || '', form='', formKana='', formRomaji='';
    for(const [ending,roman,label] of endings) {
     if(!key(surface).endsWith(ending))continue;
     const options=stems.get(key(surface).slice(0,-ending.length)) || [];
     const valid=options.filter(s=>!reading || key(s.kana+ending)===key(reading));
     const unique=[...new Map(valid.map(s=>[s.base,s])).values()];
     if(unique.length===1){base=unique[0].base;form=label;formKana=unique[0].kana+ending;formRomaji=unique[0].romaji+roman;}
     break;
    }
    const baseWord=lookup(base);
    const origin=particle || form ? 'rule' : word ? 'dictionary' : 'unknown';
    const fr=particle ? `[${particle[1]}]` : form && baseWord ? baseWord.fr : word?.fr || 'Sens non déterminé.';
    const part={jp:surface,kana:reading || formKana || word?.kana || '',romaji:particle?.[0] || formRomaji || word?.romaji || '',
     audioKana:({'へ':'え','は':'わ','を':'お'})[surface] || '',fr,
     explanation:particle?.[2] || (form ? `Forme ${form}. La personne et le sens dans le dialogue dépendent du contexte.` : ''),
     origin,base,baseWord,wordId:word?.id,known:origin!=='unknown',form,
     gloss:particle ? `[${particle[1]}]` : (fr.split(/[;；]/)[0].replace(/\s*\([^)]*\)/g,'').trim() + (form ? ` [${form}]` : ''))};
    segments.push(part);literal.push(part.known ? part.gloss : '[élément non reconnu]');i+=span;
   }
   // Only certify a few unambiguous, single-clause shapes with known verbs.
   const content=segments.map(s=>s.jp), end=segments.at(-1)?.jp==='か' ? -2 : -1;
   const verb=segments.at(end), question=end===-2;
   const single=japanese.filter(t=>/[。！？!?]/.test(t)).length<=1 && !japanese.includes('、');
   const lexical=s=>s && s.known && !particles[s.jp] && !s.form;
   let structure=null;
   if(single && verb?.form && segments.length===(question?4:3) && lexical(segments[0])) {
    if(content[1]==='へ' && ['行く','来る','帰る'].includes(verb.base))
     structure='Destination → particule de direction → verbe de déplacement';
    if(content[1]==='を' && ['食べる','飲む','買う','読む','見る','書く'].includes(verb.base)) {
     structure='Objet de l’action → particule de l’objet → verbe';
     segments[1].fr='[objet]';segments[1].gloss='[objet]';
     segments[1].explanation='Marque ici ce qui est mangé, bu, acheté, lu, regardé ou écrit.';
    }
   }
   if(structure && question){segments.at(-1).gloss='[question]';segments.at(-1).fr='[question]';segments.at(-1).explanation='Marque ici la question en fin de phrase.';}
   if(structure)structure+=(question?' → question.':'.')+' Le sujet est sous-entendu ; la traduction de la leçon donne le sens en contexte.';
   // Reassemble after assigning contextual roles. Keep sentence punctuation.
   let j=0;
   const assembled=literal.map(item=>item==='.' || item===',' ? item : segments[j++].known ? segments[j-1].gloss : item).join(' ');
   const counts={rule:0,dictionary:0,annotation:0,unknown:0};segments.forEach(s=>counts[s.origin]++);
   return {segments,structure,structureOrigin:structure?'rule':null,literal:assembled,literalOrigin:'automatic',
    note:structure ? '' : 'Lecture indicative : les sens du dictionnaire ne suffisent pas à déterminer toutes les relations de cette phrase. Les rôles incertains restent à préciser.',
    partial:!structure || segments.some(s=>!s.known || !s.kana || !s.romaji),counts};
  }
  return {analyze};
 }
 const api={create};if(typeof module!=='undefined' && module.exports)module.exports=api;else root.DecorticageAuto=api;
})(globalThis);
