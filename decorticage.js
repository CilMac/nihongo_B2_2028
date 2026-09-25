/* Petit moteur déterministe : aucune requête réseau, aucune inférence de sens. */
(function(root) {
 'use strict';
 const clean = text => String(text || '').normalize('NFC').replace(/\s/g, '');
 const tokens = text => String(text).match(/[^\s。、！？!?]+|[。、！？!?]/gu) || [];
 const punctuation = text => /^[。、！？!?]$/u.test(text);
 function create(vocabulary, data) {
  const automatic = (typeof module !== 'undefined' && module.exports ? require('./decorticage-auto.js') : root.DecorticageAuto).create(vocabulary);
  const index = new Map();
  for (const word of vocabulary) {
   const key = clean(word.mot);
   if (!index.has(key)) index.set(key, []);
   index.get(key).push(word);
  }
  const rules = [...data.rules].sort((a,b) => tokens(b.match).length - tokens(a.match).length);
  function analyze(row) {
   const sample = data.samples.find(s => s.id === `${row.Leçon}-${row.Ligne}`);
   if (!sample) return automatic.analyze(row);
   // An annotation must never survive an unnoticed change in the source sentence.
   if (sample.text.normalize('NFC').trim() !== row.Japonais.normalize('NFC').trim()) return {stale:true, segments:[]};
   const jp = tokens(row.Japonais), kana = tokens(row.Kana);
   const aligned = jp.length === kana.length;
   const segments = [];
   for (let i=0; i<jp.length;) {
    if (punctuation(jp[i])) {i++; continue;}
    const rule = rules.find(r => tokens(r.match).every((t,j) => t === jp[i+j]));
    const span = rule ? tokens(rule.match).length : 1;
    const surface = jp.slice(i,i+span).join(' ');
    const reading = aligned ? kana.slice(i,i+span).join(' ') : null;
    const candidates = index.get(clean(surface)) || [];
    const exact = candidates.filter(v => reading && clean(v.kana) === clean(reading));
    const word = exact.length === 1 ? exact[0] : candidates.length === 1 ? candidates[0] : null;
    const annotation = (sample.annotations || []).find(a => a.at === i && clean(a.match) === clean(surface));
    segments.push({jp:surface, kana:rule?.kana || reading || word?.kana || '',
     audioKana:({'へ':'え','は':'わ','を':'お'})[surface] || '',
     romaji:rule?.romaji || word?.romaji || '', fr:annotation?.meaning || rule?.meaning || word?.fr || 'Sens non déterminé dans ce prototype.',
     explanation:annotation?.explanation || rule?.explanation || '',
     origin:annotation ? 'annotation' : rule ? 'rule' : word ? 'dictionary' : 'unknown',
     ruleId:rule?.id, wordId:word?.id, base:rule?.base || word?.forme_base || '',
     baseWord:index.get(clean(rule?.base || word?.forme_base || ''))?.[0] || null,
     known:!!(rule || word || annotation)});
    i += span;
   }
   // Whole-sentence templates are deliberately narrow; no guessed syntax fallback.
   let structure = null;
   if (/^(どこ|デパート) へ 行きます(?: か)?。$/.test(row.Japonais))
    structure = 'Destination → particule de direction → verbe de déplacement' + (jp.includes('か') ? ' → marque de question.' : '.') + ' Le sujet est sous-entendu ; la traduction du dialogue précise qui se déplace.';
   if (/^この 辺 に タバコ屋 が あります か。$/.test(row.Japonais))
    structure = 'Lieu → particule de localisation → chose recherchée → particule du sujet → verbe d’existence → question.';
   const structureOrigin = structure ? 'rule' : sample.structure ? 'annotation' : null;
   structure ||= sample.structure || null;
   const counts = {rule:0,dictionary:0,annotation:0,unknown:0};
   for (const segment of segments) counts[segment.origin]++;
   return {segments, structure, structureOrigin, literal:sample.literal || '', note:sample.note || '',
    partial:!structure || segments.some(s=>!s.known) || !!sample.partial, counts};
  }
  return {analyze, samples:data.samples};
 }
 const api = {create,tokens};
 if (typeof module !== 'undefined' && module.exports) module.exports = api;
 else root.Decorticage = api;
})(globalThis);
