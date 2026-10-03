/* Analyse locale : lectures attestées, groupes réutilisables et constructions bornées. */
(function(root) {
 'use strict';
 const key = s => String(s || '').normalize('NFC').replace(/\s/g,'');
 const readingKey = s => key(s).replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60));
 const split = s => String(s || '').match(/[^\s。、！？!?（）()，,]+|[。、！？!?（）()，,]/gu) || [];
 const punct = s => /^[。、！？!?（）()，,]$/u.test(s);
 const renderPunct = s => ({'、':',','，':',','。':'.','？':'?','！':'!','（':'(','）':')'})[s] || s;
 const short = s => String(s || '').replace(/\s*\([^)]*\)/g,'').split(/[;；]/)[0].trim();
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
  'から':['kara','départ ou raison','Peut marquer un point de départ ou introduire une raison.'],
  'まで':['made','limite','Marque une limite ; le groupe précédent doit être identifié.'],
  'か':['ka','question ou alternative','Peut marquer une question ou une alternative.'],
  'ね':['ne','accord partagé','Invite à partager un constat ou exprime un accord.'],
  'よ':['yo','information soulignée','Présente une information à l’interlocuteur.']
 };
 const endings = [
  ['ませんでした','masen deshita','négatif passé poli'],
  ['ましょう','mashou','proposition polie'],
  ['ました','mashita','passé poli'],
  ['ません','masen','négatif non-passé poli'],
  ['ます','masu','non-passé poli']
 ];
 // Sens courts des verbes de ce premier lot. Les lectures restent issues du dictionnaire.
 const verbs = {
  '食べる':'manger','飲む':'boire','買う':'acheter','読む':'lire','見る':'regarder','書く':'écrire',
  '行く':'aller','来る':'venir','帰る':'rentrer','歩く':'marcher','起きる':'se lever','寝る':'se coucher',
  '待つ':'attendre','働く':'travailler','住む':'habiter','持つ':'avoir / tenir','知る':'connaître',
  '作る':'fabriquer','する':'faire','ある':'il y a / se trouver','いる':'être présent / se trouver',
  '聞く':'écouter / demander','取る':'prendre','とる':'prendre','見せる':'montrer'
 };
 const teMeanings = {
  'する':['faire','La forme en て suivie de いる présente ici une activité ou une situation en cours ; le groupe nominal précise laquelle.'],
  '住む':['habiter','Avec 住む, cette construction exprime la résidence. Le temps et la négation sont portés par l’auxiliaire.'],
  '知る':['connaître','Ici, ている exprime un état de connaissance.'],
  '持つ':['avoir / tenir','Avec 持つ, ている peut exprimer la possession ou le fait de tenir quelque chose ; le dialogue précise le sens.'],
  '働く':['travailler','Avec 働く, ている peut décrire le travail habituel ou une activité en cours.'],
  '書く':['écrire','La forme en て suivie de いる présente une activité en cours ou répétée, selon le contexte.'],
  '作る':['fabriquer','La forme en て suivie de いる présente une activité en cours ou répétée, selon le contexte.'],
  '待つ':['attendre','La forme en て suivie de いる décrit une attente. Le temps et la négation sont portés par l’auxiliaire.'],
  '食べる':['manger','La forme en て suivie de いる présente une activité en cours ou répétée, selon le contexte.'],
  '飲む':['boire','La forme en て suivie de いる présente une activité en cours ou répétée, selon le contexte.'],
  '読む':['lire','La forme en て suivie de いる présente une activité en cours ou répétée, selon le contexte.'],
  '見る':['regarder','La forme en て suivie de いる présente une activité en cours ou répétée, selon le contexte.']
 };
 const set = text => new Set(text.split(' '));
 const places=set('ここ そこ あそこ どこ 中 前 後ろ 上 下 隣 外 左 右 東京 学校 家 デパート 喫茶店 バー 公園 図書館 会社 空港 駅 海 工場 部屋 店 フランス スカイツリー 東京スカイツリー');
 const times=set('今 今日 昨日 明日 あした 今朝 今晩 今晚 朝 夜 午前 午後 夜中 毎朝 来週 先週');
 const vehicles=set('バス 電車 地下鉄 新幹線 飛行機 タクシー 船 自転車 車');
 const instruments=set('箸 お箸 フォーク スプーン ナイフ');
 const activities=set('買物 買い物 散歩 食事 観光 仕事 映画');
 const choices=set('何 どれ コーヒー 紅茶 お茶 ビール 水 カレー うどん お菓子 菓子');
 const adverbs=set('まず それから それでは じゃあ でも 今 今日 昨日 明日 あした 今朝 今晩 今晚 朝 夜 午前 午後 夜中 毎朝 来週 先週 また たくさん どう 随分 とても');
 const objectVerbs=set('食べる 飲む 買う 読む 見る 書く 待つ 持つ 知る 作る する 聞く 取る とる 見せる');
 const movement=set('行く 来る 帰る 歩く');
 const people=set('友達 家内 妻 夫 父 母 先生 子供');
 const person=s=>nominal(s)&&(people.has(key(s.jp))||/さん$/.test(key(s.jp)));
 // Language + 本 can describe the language of a book, not its subject.
 const bookSubjects=set('料理 歴史 音楽');
 const relation=(left,right)=>key(right?.jp)==='本'&&bookSubjects.has(key(left?.jp))?'sujet du livre':'relation entre noms';
 const nominal = s => !!s && s.known && !s.form && !s.particle && /^(nom|nom propre|pronom)$/.test(s.category);
 const isPlace = s => !!s && (places.has(key(s.jp)) || s.place);
 const isTime = s => !!s && (s.quantity==='clock' || times.has(key(s.jp)));
 const role = (s,label,explanation) => Object.assign(s,{fr:`[${label}]`,gloss:`[${label}]`,explanation,origin:'rule',role:label});
 function create(vocabulary) {
  const index=new Map(), stems=new Map(), cache=new Map();
  for(const w of vocabulary) {
   const k=key(w.mot);if(!index.has(k))index.set(k,[]);index.get(k).push(w);
   if(w.forme_base)for(const [ending,roman] of endings) {
    const r=String(w.romaji || '').replace(/\.$/,'');
    if(!k.endsWith(ending)||!key(w.kana).endsWith(ending)||!r.endsWith(roman))continue;
    const stem=k.slice(0,-ending.length);
    if(!stems.has(stem))stems.set(stem,[]);
    stems.get(stem).push({base:w.forme_base,kana:key(w.kana).slice(0,-ending.length),romaji:r.slice(0,-roman.length),word:w});break;
   }
  }
  const uniqueWord = k => (index.get(key(k)) || []).length===1 ? index.get(key(k))[0] : null;
  function lexical(w) {
   // Short structural glosses; the full dictionary definition remains in fr.
   const glosses={'トランク':'valise','何':'quoi','本当':'vrai','そう':'ainsi','服':'vêtements','本':'livre','とても':'très',
    '道':'chemin','店':'magasin','映画':'film / cinéma','仕事':'travail','おいしい':'bon / délicieux','随分':'beaucoup'};
   return {kana:key(w.kana),romaji:w.romaji || '',fr:w.fr,gloss:glosses[key(w.mot)] || short(w.fr),category:w.categorie_grammaticale,
    base:w.forme_base || '',baseWord:uniqueWord(w.forme_base),wordId:w.id,origin:'dictionary',known:true,form:'',explanation:''};
  }
  // Limited number family: clock hours and hour durations, including source spacing variants.
  function hours(k) {
   const m=k.match(/^([一二三四五六七八九十]+|何|\d{1,2})(時間|時)(半)?$/);if(!m)return null;
   const digits='〇一二三四五六七八九';
   const kanji=n=>n<10?digits[n]:(n>=20?'二':'')+'十'+(n%10?digits[n%10]:'');
   const n=m[1]==='何'?'?':/^\d+$/.test(m[1])?Number(m[1]):Array.from({length:24},(_,i)=>i+1).find(n=>kanji(n)===m[1]);
   if(n!=='?'&&(!n||n>24))return null;
   const reads=[['',''],['いち','ichi'],['に','ni'],['さん','san'],['よ','yo'],['ご','go'],['ろく','roku'],['しち','shichi'],['はち','hachi'],['く','ku']];
   const read=n==='?'?['なん','nan']:n===10?['じゅう','juu']:n<10?reads[n]:[(n>=20?'にじゅう':'じゅう')+reads[n%10][0],(n>=20?'nijuu':'juu')+reads[n%10][1]];
   const duration=m[2]==='時間',half=!!m[3],suffix=duration?['じかん','jikan']:['じ','ji'];
   return {kana:read[0]+suffix[0]+(half?'はん':''),romaji:read[1]+suffix[1]+(half?' han':''),
    fr:n==='?'?(duration?'combien d’heures':'quelle heure'):`${n} heure${n===1?'':'s'}${half?' et demie':''}`,
    category:'nom',quantity:duration?'duration':'clock',origin:'rule',known:true,form:'',
    explanation:duration?'Un seul groupe de durée : 時間 compte les heures.':'Un seul groupe horaire : 時 indique l’heure de la journée.'};
  }
  function candidates(surface) {
   const k=key(surface);if(cache.has(k))return cache.get(k);
   // One attested mixed-script spelling, never a global katakana rewrite.
   if(/^食ベ(?:ます|ました|ません|ませんでした|ましょう)$/.test(k)) {
    const corrected=k.replace('食ベ','食べ');
    const variants=candidates(corrected).map(c=>({...c,sourceNote:`Graphie source ${k} : ベ est en katakana. Lecture rapprochée de ${corrected}, sans modifier le texte.`,
     explanation:`${c.explanation || ''} Graphie source conservée : ベ en katakana, correspondant ici à べ.`}));
    cache.set(k,variants);return variants;
   }
   let result=[];
   const compound={
    'スカイツリー':['スカイツリー','sukai tsurii','Skytree'],
    '東京スカイツリー':['とうきょうスカイツリー','toukyou sukai tsurii','Tokyo Skytree']
   }[k];
   if(compound){const [kana,romaji,fr]=compound;result.push({kana,romaji,fr,gloss:fr,category:'nom propre',place:true,origin:'rule',known:true,form:'',explanation:'Nom du lieu conservé comme un ensemble, avec lecture contrôlée par les kana.'});}
   const years=k.match(/^([一二三四五六七八九十])年前$/);
   if(years){const n='一二三四五六七八九十'.indexOf(years[1])+1;const kana=['いち','に','さん','よ','ご','ろく','なな','はち','きゅう','じゅう'][n-1]+'ねんまえ';const romaji=['ichi','ni','san','yo','go','roku','nana','hachi','kyuu','juu'][n-1]+'nen mae';const fr=n+' an'+(n>1?'s':'')+' avant';result.push({kana,romaji,fr,gloss:fr,category:'nom',relativeTime:true,origin:'rule',known:true,form:'',explanation:'Un nombre d’années suivi de 前 situe un moment antérieur, et non un emplacement.'});}
   const negative={
    'ではありません':['ではありません','de wa arimasen','ce n’est pas [poli]'],
    'ではありませんでした':['ではありませんでした','de wa arimasen deshita','ce n’était pas [poli]'],
    'じゃありません':['じゃありません','ja arimasen','ce n’est pas [poli]']
   }[k];
   if(negative){const [kana,romaji,fr]=negative;result.push({kana,romaji,fr,gloss:fr,category:'auxiliaire',negativeCopula:true,origin:'rule',known:true,form:'',explanation:'Négation de la construction nominale en です. で et は font ici partie de cette construction.'});}
   const formulas={
    'おはようございます':['おはようございます','ohayou gozaimasu','bonjour [poli]'],
    'ありがとうございます':['ありがとうございます','arigatou gozaimasu','merci [poli]'],
    'お願いします':['おねがいします','onegai shimasu','s’il vous plaît'],
    'おねがいします':['おねがいします','onegai shimasu','s’il vous plaît']
   };
   if(formulas[k]) {
    const [kana,romaji,fr]=formulas[k];
    result.push({kana,romaji,fr,gloss:fr,category:'expression',formula:true,origin:'rule',known:true,form:'',
     explanation:'Formule usuelle comprise comme un ensemble ; la traduction séparée de ses composants serait trompeuse ici.'});
   }
   if(k==='何')result.push({kana:'なん',romaji:'nan',fr:'quel / quoi',gloss:'quel / quoi',category:'pronom',origin:'rule',known:true,form:'',explanation:'Lecture なん, retenue seulement lorsqu’elle correspond aux kana de la phrase.'});
   const p=particles[k];
   if(p)result.push({kana:k,romaji:p[0],fr:`[${p[1]}]`,gloss:`[${p[1]}]`,explanation:p[2],particle:k,origin:'rule',known:true,form:'',audioKana:({'へ':'え','は':'わ','を':'お'})[k] || ''});
   const number=hours(k);if(number)result.push({...number,gloss:number.fr});
   // Treat ません でした and arbitrary spaces inside attested polite forms as one group.
   for(const [ending,roman,label] of endings) {
    if(!k.endsWith(ending))continue;
    const options=stems.get(k.slice(0,-ending.length)) || [];
    for(const s of options) {
     const present=uniqueWord(k.slice(0,-ending.length)+'ます');
     const fr=verbs[s.base] || short(uniqueWord(s.base)?.fr || present?.fr || uniqueWord(k)?.fr);
     if(!fr)continue;
     result.push({kana:s.kana+ending,romaji:s.romaji+roman,fr,gloss:`${fr} [${label}]`,base:s.base,baseWord:uniqueWord(s.base),wordId:uniqueWord(k)?.id || present?.id,
      category:'verbe',form:label,origin:'rule',known:true,explanation:`Forme ${label}. La personne et le sens dans le dialogue dépendent du contexte.`});
    }
    break;
   }
   // Only join a te-form that is itself attested, with a verified lexical interpretation.
   const iruEndings=[...endings.filter(e=>e[0]!=='ましょう').map(([e,r,l])=>['い'+e,'i'+r,l]),
    ['いる','iru','non-passé neutre'],['いた','ita','passé neutre'],['いない','inai','négatif non-passé neutre'],['いなかった','inakatta','négatif passé neutre']];
   for(const [auxiliary,roman,label] of iruEndings) {
    if(!k.endsWith(auxiliary))continue;
    const te=k.slice(0,-auxiliary.length);
    for(const w of index.get(te) || []) {
     if(!/[てで]$/.test(te)||w.categorie_grammaticale!=='verbe'||!teMeanings[w.forme_base])continue;
     // The lexicon sometimes uses a semantic base for honorific forms. Do not
     // turn なさって into a neutral exercise derived from する.
     if(w.forme_base==='する'&&key(w.kana)!=='して')continue;
     const [fr,explanation]=teMeanings[w.forme_base];
     const aspect=['住む','知る'].includes(w.forme_base)?'état':w.forme_base==='持つ'?'possession ou action':'activité';
     result.push({...lexical(w),kana:key(w.kana)+auxiliary,romaji:w.romaji+' '+roman,fr,gloss:`${fr} [${aspect} ; ${label}]`,
      form:`forme en て + いる · ${label}`,te:true,origin:'rule',explanation});
    }
   }
   // The auxiliary みる means trying, not looking. Only attested te-forms qualify.
   for(const [tail,roman,label] of [...endings.map(([e,r,l])=>['み'+e,'mi'+r,l]),['みる','miru','non-passé neutre'],['みよう','miyou','proposition neutre']]) {
    if(!k.endsWith(tail))continue;
    for(const w of index.get(k.slice(0,-tail.length)) || []) {
     if(!/[てで]$/.test(key(w.mot))||w.categorie_grammaticale!=='verbe'||!verbs[w.forme_base])continue;
     if(w.forme_base==='する'&&key(w.kana)!=='して')continue;
     const fr='essayer de '+verbs[w.forme_base];
     result.push({...lexical(w),kana:key(w.kana)+tail,romaji:w.romaji+' '+roman,fr,gloss:`${fr} [${label}]`,
      form:`forme en て + みる · ${label}`,inflection:label,trial:true,origin:'rule',explanation:'La construction en て + みる exprime un essai. Le second verbe ne signifie pas « regarder » dans ce groupe.'});
    }
   }
   for(const tail of ['ください','下さい'])if(k.endsWith(tail))for(const w of index.get(k.slice(0,-tail.length))||[]) {
    if(!/[てで]$/.test(key(w.mot))||w.categorie_grammaticale!=='verbe'||!verbs[w.forme_base]||['いる','ある'].includes(w.forme_base))continue;
    if(w.forme_base==='する'&&key(w.kana)!=='して')continue;
    const fr=verbs[w.forme_base];result.push({...lexical(w),kana:key(w.kana)+'ください',romaji:w.romaji+' kudasai',fr,gloss:fr+' [demande polie]',form:'forme en て + ください',origin:'rule',explanation:'Le verbe en て suivi de ください exprime une demande polie.'});
   }
   // A proper name + station/name honorific is a reusable nominal group.
   for(const suffix of ['駅','さん'])if(k.endsWith(suffix)) {
    const name=uniqueWord(k.slice(0,-suffix.length)),tail=uniqueWord(suffix);
    if(name?.categorie_grammaticale==='nom propre'&&tail) {
     const fr=suffix==='駅'?`gare ${/^[AEIOUYaeiouy]/.test(short(name.fr))?'d’':'de '}${short(name.fr)}`:`${short(name.fr)} [politesse]`;
     result.push({kana:key(name.kana)+key(tail.kana),romaji:name.romaji+' '+tail.romaji,fr,gloss:fr,category:'nom propre',place:suffix==='駅',origin:'rule',known:true,form:'',explanation:suffix==='駅'?'Le nom propre précise de quelle gare il s’agit.':'さん est un titre de politesse ajouté au nom de la personne.'});
    }
   }
   if(!p&&!number)for(const w of index.get(k) || [])result.push(lexical(w));
   // Same reading/base may be attested in several inflected dictionary entries.
   const seen=new Set();result=result.filter(c=>{const id=c.kana+'|'+c.base+'|'+c.form+'|'+c.fr;if(seen.has(id))return false;seen.add(id);return true;});
   // Keep rule candidates in preference to dictionary duplicates for that reading.
   result=result.filter(c=>c.origin==='rule'||!result.some(r=>r.origin==='rule'&&r.kana===c.kana));
   cache.set(k,result);return result;
  }
  function readingBoundaries(row) {
   const original=split(row.Japonais),readings=split(row.Kana);
   if(readings.length<=original.length||!original.some(t=>t.length>=8))return original;
   const source=key(row.Japonais),memo=new Map();
   // Recover missing word spaces from the supplied kana and attested readings.
   // No kanji reading is guessed; an unknown kana word can match only itself.
   function walk(pos,r) {
    const id=pos+':'+r;if(memo.has(id))return memo.get(id);
    if(r===readings.length)return pos===source.length?{cost:0,parts:[]}:null;
    let best=null;
    const accept=(surface,next,cost)=>{
     const tail=walk(pos+surface.length,next);if(!tail)return;
     const total=cost+tail.cost;
     if(!best||total<best.cost)best={cost:total,parts:[surface,...tail.parts]};
    };
    if(punct(readings[r])) {
     if(punct(source[pos])&&renderPunct(source[pos])===renderPunct(readings[r]))accept(source[pos],r+1,0);
    } else {
     if(source.startsWith(readings[r],pos))accept(readings[r],r+1,10);
     for(let len=1;len<=Math.min(40,source.length-pos);len++) {
      const surface=source.slice(pos,pos+len);if([...surface].some(punct))break;
      const options=candidates(surface);
      for(let n=1;n<=Math.min(7,readings.length-r);n++) {
       const chunk=readings.slice(r,r+n);if(chunk.some(punct))break;
       if(options.some(c=>readingKey(c.kana)===readingKey(chunk.join(''))))accept(surface,r+n,1);
      }
     }
     // An unattested span must not discard the known anchors around it.
     // These spans only provide boundaries, never a reading or a meaning.
     for(let len=1;len<=Math.min(20,source.length-pos);len++) {
      const surface=source.slice(pos,pos+len);if([...surface].some(punct))break;
      for(let n=1;n<=Math.min(3,readings.length-r);n++) {
       if(readings.slice(r,r+n).some(punct))break;
       accept(surface,r+n,1000*len+50);
      }
     }
    }
    memo.set(id,best);return best;
   }
   return walk(0,0)?.parts||original;
  }
  function segment(row) {
   const jp=readingBoundaries(row),kanaTokens=split(row.Kana),sourceKana=key(row.Kana),kana=readingKey(row.Kana);
   const boundaries=[];let offset=0;for(const t of kanaTokens){offset+=t.length;boundaries.push(offset);}
   const quantityEnds=jp.map((_,i)=>{
    let end=0;
    for(let n=1;n<=Math.min(7,jp.length-i);n++) {
     const joined=key(jp.slice(i,i+n).join(''));
     if(!/^[一二三四五六七八九十何\d時間半]+$/.test(joined))break;
     if(/^(?:[一二三四五六七八九十\d]+|何)時(?:間)?(?:半)?$/.test(joined))end=i+n;
    }
    return end;
   });
   const options=jp.map((_,i)=>{
    const out=[];if(punct(jp[i]))return out;
    for(let n=1;n<=Math.min(7,jp.length-i);n++) {
     const chunk=jp.slice(i,i+n);if(chunk.some(punct))break;
     const surface=chunk.join(' ');
     // Never turn an unsupported large hour into an unrelated smaller valid hour.
     if(quantityEnds[i]&&i+n!==quantityEnds[i])continue;
     for(const c of candidates(surface))if(c.kana) {
      // Do not read the end of a number or range as a standalone year count.
      if(c.relativeTime&&/^[一二三四五六七八九十百千万億\d]+$/.test(jp[i-1]||''))continue;
      // A conjunction must not absorb a separately written particle inside a
      // nominal phrase (e.g. adjectif + な + ところ + が).
      if(n>1&&c.category==='conjonction'&&chunk.some(t=>particles[t])&&i>0&&!punct(jp[i-1]))continue;
      if(n>1&&c.category==='expression'&&!c.formula&&chunk.some(t=>particles[t]))continue;
      out.push({...c,jp:surface,start:i,end:i+n});
     }
    }
    return out;
   });
   // Align to the kana stream, not to its spaces. Unknowns retain no guessed reading.
   const memo=new Map();let states=0;
   function walk(i,pos) {
    const id=i+':'+pos;if(memo.has(id))return memo.get(id);
    if(i===jp.length)return pos===kana.length?{cost:0,parts:[]}:null;
    if(++states>12000)return null;
    let best=null;
    const consider=(part,next,cost)=>{const tail=walk(next,pos+part.length);if(!tail)return;const total=tail.cost+cost;if(!best||total<best.cost)best={cost:total,parts:part.punct?tail.parts:[part.value,...tail.parts]};};
    if(punct(jp[i])) {
     if(kana[pos]===jp[i])consider({length:1,punct:true},i+1,0);
    } else {
     for(const c of options[i])if(kana.startsWith(readingKey(c.kana),pos)) {
      const alternatives=options[i].filter(o=>o.end===c.end&&readingKey(o.kana)===readingKey(c.kana));
      if(alternatives.length>1)continue; // Ambiguous lexical readings/senses stay unresolved.
      consider({length:c.kana.length,value:{...c,kana:sourceKana.slice(pos,pos+c.kana.length)}},c.end,1);
     }
     for(const end of boundaries.filter(b=>b>pos)) {
      if(/[。、！？!?（）()，,]/u.test(kana.slice(pos,end)))break;
      for(let next=i+1;next<=Math.min(jp.length,i+7);next++) {
       if(punct(jp[next-1]))break;
       if(quantityEnds[i]&&next!==quantityEnds[i])continue;
       consider({length:end-pos,value:{jp:jp.slice(i,next).join(' '),kana:'',romaji:'',fr:'Sens non déterminé.',gloss:'[élément non reconnu]',known:false,origin:'unknown',start:i,end:next}},next,1000*(next-i)+1);
      }
     }
    }
    memo.set(id,best);return best;
   }
   const aligned=walk(0,0);
   if(aligned)return {jp,segments:aligned.parts,sourceAligned:true};
   // A source with incompatible punctuation cannot be aligned as a whole.
   // Retain independently attested readings, without certifying its syntax.
   const same=jp.length===kanaTokens.length;
   const fallback=[];
   for(let i=0;i<jp.length;) {
    if(punct(jp[i])){i++;continue;}
    let chosen=null;
    for(const c of options[i]) {
     const possible=options[i].filter(o=>o.end===c.end&&(!same||readingKey(o.kana)===readingKey(kanaTokens.slice(i,o.end).join(''))));
     if(possible.length===1&&(!chosen||c.end>chosen.end))chosen=possible[0];
    }
    const end=chosen?.end||quantityEnds[i]||i+1;
    fallback.push(chosen||{jp:jp.slice(i,end).join(' '),start:i,end,kana:'',romaji:'',fr:'Sens non déterminé.',gloss:'[élément non reconnu]',known:false,origin:'unknown'});i=end;
   }
   return {jp,segments:fallback,sourceAligned:false};
  }
  // These bounded clauses need no finite lexical verb (formulas, copulas, names).
  function explainSimple(segments) {
   if(!segments.length||segments.some(s=>!s.known))return null;
   if(segments.length===1&&segments[0].formula)return 'Formule usuelle : '+segments[0].fr+'.';
   const parts=[...segments],finals=[];
   while(['か','ね','よ'].includes(parts.at(-1)?.jp))finals.unshift(parts.pop());
   if(!['','か','ね','よ','よね','かね'].includes(finals.map(s=>s.jp).join('')))return null;
   const predicate=parts.pop();
   if(!predicate)return null;
   const markFinals=()=>finals.forEach(s=>{if(s.jp==='か')role(s,'question','Termine ici une question.');});
   if(!finals.length&&predicate.jp==='から'&&parts.length===1&&isTime(parts[0])) {
    role(predicate,'depuis','Marque ici le point de départ dans le temps.');return 'Repère temporel → [depuis].';
   }
   if(!finals.length&&predicate.jp==='から'&&parts.length===1&&parts[0].jp==='いつ') {
    role(predicate,'depuis','Avec いつ, demande depuis quel moment.');return 'Quel moment → [depuis] : depuis quand ?';
   }
   if(key(predicate.jp)==='申します'&&parts.at(-1)?.jp==='と'&&parts.length>1&&parts.slice(0,-1).every(s=>s.category==='nom propre')) {
    role(parts.at(-1),'citation','Introduit le nom sous lequel la personne se présente.');
    predicate.fr='s’appeler';predicate.gloss='s’appeler [humble et poli]';predicate.base='申す';predicate.baseWord=uniqueWord('申す');
    predicate.explanation='Dans cette présentation, と申します donne son nom avec une forme humble et polie.';
    markFinals();return 'Nom cité → [citation] → se présenter par son nom.';
   }
   const request=['下さい','ください'].includes(key(predicate.jp));
   if(!request&&!predicate.negativeCopula&&!['です','でした'].includes(key(predicate.jp)))return null;
   const rest=[...parts];
   while(rest.length&&(['はい','いいえ','ええ','ああ'].includes(rest[0].jp)||adverbs.has(key(rest[0].jp))))rest.shift();
   // A noun/adjective predicate, optionally preceded by one simple topic.
   const pending=[];
   if(rest[0]?.jp==='本当'&&rest[1]?.jp==='に') {
    const adverb=rest.shift(),particle=rest.shift();
    pending.push(()=>{adverb.gloss='vraiment';role(particle,'manière','Avec 本当, に forme un adverbe : vraiment.');});
   }
   const topic=rest.findIndex(s=>s.jp==='は');
   const nounGroup=items=>items.length>0&&items.every((s,i)=>{
    if(s.jp==='の'||s.jp==='と') {
     if(!nominal(items[i-1])||!nominal(items[i+1]))return false;
     pending.push(()=>role(s,s.jp==='の'?relation(items[i-1],items[i+1]):'énumération','Relie les noms de ce groupe.'));return true;
    }
    return nominal(s)&&(i===0||['の','と'].includes(items[i-1].jp)||['déterminant','adjectif en i'].includes(items[i-1].category))||s.category==='déterminant'&&(i===0||['の','と'].includes(items[i-1].jp))&&(nominal(items[i+1])||items[i+1]?.category==='adjectif en i'&&nominal(items[i+2]))||s.category==='adjectif en i'&&(i===0||['の','と'].includes(items[i-1].jp)||items[i-1].category==='déterminant')&&nominal(items[i+1]);
   });
   if(request) {
    if(rest.at(-1)?.jp!=='を'||!nounGroup(rest.slice(0,-1)))return null;
    pending.forEach(f=>f());role(rest.at(-1),'objet','Indique ce que l’on demande à recevoir.');
    predicate.gloss='donnez [s’il vous plaît]';markFinals();return 'Chose demandée → [objet] → demande polie.';
   }
   if(topic!==-1) {
    if(!nounGroup(rest.slice(0,topic)))return null;
    pending.push(()=>role(rest[topic],'thème','Présente ce dont on parle.'));
   }
   const tail=rest.slice(topic+1);
   const special=tail.length===1&&['そう','まだ','けっこう','本当','いくつ'].includes(key(tail[0].jp));
   const adjective=tail.length===1&&/^adjectif en (i|na)$/.test(tail[0].category);
   if(predicate.negativeCopula ? !nounGroup(tail) : !special&&!adjective&&!nounGroup(tail))return null;
   pending.forEach(f=>f());markFinals();
   if(!predicate.negativeCopula)predicate.gloss=key(predicate.jp)==='でした'?'c’était [poli]':adjective?'[poli]':'c’est [poli]';
   if(special&&key(tail[0].jp)==='まだ') {
    tail[0].gloss='pas encore';if(!predicate.negativeCopula)predicate.gloss=key(predicate.jp)==='でした'?'[passé poli]':'[poli]';
   }
   // A negative reply selects the refusal, never a context-free kekkou => no rule.
   if(special&&key(tail[0].jp)==='けっこう'&&parts[0]?.jp==='いいえ')tail[0].gloss='cela suffit / non merci';
   return 'Présentation ou appréciation avec '+predicate.jp+(finals.some(s=>s.jp==='か')?' ; question.':'.');
  }
  function explain(segments,jp,allowPartial=false) {
   let end=segments.length-1;
   const finals=[];while(end>=0&&['か','ね','よ'].includes(segments[end].jp)){finals.unshift(segments[end--]);}
   if(!['','か','ね','よ','よね','かね'].includes(finals.map(s=>s.jp).join('')))return null;
   const verb=segments[end],prefix=segments.slice(0,end);
   const introduction=['はい','いいえ','ええ','じゃあ'].includes(prefix[0]?.jp)&&/[、，,]/.test(jp[prefix[0].end]||'')?prefix.shift():null;
   // A single supported finite predicate. Complex clauses receive lexical groups only.
   if(!verb?.form||!verbs[verb.base]||prefix.some(s=>s.form||s.base||!s.known)||jp.some((t,i)=>punct(t)&&i!==jp.length-1&&!(introduction&&/[、，,]/.test(t)&&i===introduction.end)))return null;
   // 実は is an adverbial expression; its は is not a nominal topic here.
   if(key(prefix[0]?.jp)==='実'&&prefix[1]?.jp==='は')return null;
   // Partial recovery needs a simple nominal frame too: never skip a hidden
   // predicate, quotation, conjunction or unknown group to reach the final verb.
   if(allowPartial&&prefix.some(s=>!nominal(s)&&!s.particle&&!['déterminant','adjectif en i'].includes(s.category)&&!adverbs.has(key(s.jp))&&s.quantity!=='duration'))return null;
   const groups=[];let buffer=[];
   const delimiters=set('は も が を に へ で から まで');
   for(const s of prefix) {
    if(delimiters.has(s.jp)||(s.jp==='と'&&movement.has(verb.base)&&buffer.length===1&&person(buffer[0]))){if(!buffer.length)return null;groups.push({parts:buffer,particle:s});buffer=[];}
    else buffer.push(s);
   }
   if(buffer.length)groups.push({parts:buffer,particle:null});
   // A bare noun before する can change its valency (会社を退職する:
   // leaving a company, not acting on an object). Do not infer through it.
   if(allowPartial&&buffer.some(s=>!adverbs.has(key(s.jp))&&s.quantity!=='duration'))return null;
   const actions=introduction?[`« ${introduction.jp} » : réponse`]:[];let valid=true;
   const pending=[]; // Commit roles only once every group has passed the bounded grammar.
   const mark=(s,label,why)=>pending.push(()=>role(s,label,why));
   const nounPhrase = parts => {
    if(!parts.length)return false;
    for(let i=0;i<parts.length;i++) {
     const s=parts[i];
     if(s.jp==='の'||s.jp==='と') {
      if(!nominal(parts[i-1])||!nominal(parts[i+1]))return false;
      mark(s,s.jp==='の'?relation(parts[i-1],parts[i+1]):'énumération',s.jp==='の'?`« ${parts[i-1].jp} » précise « ${parts[i+1].jp} ». La relation dépend de ces noms.`:'Relie les éléments de cette liste.');
     } else if(s.category==='déterminant'&&(i===0||['の','と'].includes(parts[i-1].jp))&&(nominal(parts[i+1])||parts[i+1]?.category==='adjectif en i'&&nominal(parts[i+2])))continue;
     else if(s.category==='adjectif en i'&&(i===0||['の','と'].includes(parts[i-1].jp)||parts[i-1].category==='déterminant')&&nominal(parts[i+1]))continue;
     else if(!nominal(s)||i>0&&nominal(parts[i-1]))return false;
    }
    return true;
   };
   const existential=['ある','いる'].includes(verb.base)&&!verb.te;
   for(const group of groups) {
    const checkpoint=pending.length;
    const parts=[...group.parts],p=group.particle;
    if(p?.jp==='に'&&parts.length===1&&key(parts[0].jp)==='一緒') {
     mark(p,'manière','Avec 一緒, に forme « ensemble » et précise comment se fait l’action.');
     actions.push('« 一緒 に » : ensemble');continue;
    }
    // A temporal noun chain can precede a separately marked activity: 今日の午後 買物に.
    if(parts.length>=4&&isTime(parts[0])&&parts[1].jp==='の'&&isTime(parts[2])&&nominal(parts[3])) {
     mark(parts[1],'relation entre noms',`« ${parts[0].jp} » précise le moment « ${parts[2].jp} ».`);
     actions.push(`« ${parts.slice(0,3).map(s=>s.jp).join(' ')} » : moment`);parts.splice(0,3);
    }
    // Free temporal/adverbial adjuncts before a marked nominal group or the verb.
    while(parts.length&&(adverbs.has(key(parts[0].jp))||parts[0].quantity==='duration')&&(!p||parts.length>1&&parts[1].jp!=='の'&&parts[1].jp!=='と')) {
     const s=parts.shift();actions.push(s.quantity==='duration'?`« ${s.jp} » : durée`:`« ${s.jp} » : repère ou précision`);
     if(s.quantity==='duration')pending.push(()=>{s.gloss=s.fr+' [durée]';});
    }
    if(!p){
     if(existential&&parts.length===1&&/^(一人|二人|\d+人)$/.test(key(parts[0].jp))) {
      actions.push(`« ${parts[0].jp} » : nombre de personnes`);continue;
     }
     if(parts.length&&!(verb.base==='する'&&parts.length===1&&['結婚','再婚'].includes(key(parts[0].jp))))valid=false;continue;
    }
    if(!nounPhrase(parts)){pending.length=checkpoint;valid=false;continue;}
    const last=parts.at(-1),k=key(last.jp),place=isPlace(last),time=isTime(last),label=parts.map(s=>s.jp).join(' ');
    let r='',why='';
    if(p.jp==='と'&&parts.length===1&&person(last)&&movement.has(verb.base)){r='accompagnement';why='Indique la personne avec qui se fait le déplacement.';}
    if(p.jp==='は'){r='thème';why=`Présente « ${label} » comme thème de la phrase.`;}
    if(p.jp==='も'){r='aussi';why=`Ajoute « ${label} » à ce qui est déjà évoqué ; le dialogue donne l’autre élément.`;}
    if(p.jp==='が'&&existential){r='élément présent';why=`Indique ce dont on dit qu’il est présent, avec ${verb.jp}.`;}
    if(p.jp==='が'&&movement.has(verb.base)){r='sujet';why=`Indique qui se déplace avec ${verb.jp}.`;}
    if(p.jp==='を'&&objectVerbs.has(verb.base)){r='objet';why=`Indique ce sur quoi porte l’action exprimée par ${verb.jp}.`;}
    if(p.jp==='へ'&&movement.has(verb.base)&&place){r='direction';why=`Indique la direction du déplacement vers « ${label} ».`;}
    if(p.jp==='に') {
     if(parts.length===1&&person(last)&&verb.base==='する'&&groups.some(g=>g.particle?.jp==='を'&&g.parts.length===1&&key(g.parts[0].jp)==='電話')){r='destinataire';why='Avec 電話をする, indique la personne à qui l’on téléphone.';}
     else if(last.relativeTime&&['する','行く','来る','帰る','買う'].includes(verb.base)){r='moment';why='Situe l’action au moment indiqué, un certain nombre d’années auparavant.';}
     else if(last.quantity==='clock'&&['起きる','寝る','行く','来る','帰る','働く'].includes(verb.base)){r='heure';why=`Situe ${verb.jp} à l’heure indiquée ; ce groupe ne donne pas une durée.`;}
     else if(place&&existential){r='lieu de présence';why=`Indique où se trouve l’être ou la chose avec ${verb.jp}.`;}
     else if(place&&verb.base==='住む'){r='lieu de résidence';why=`Indique où l’on habite avec ${verb.jp}.`;}
     else if(activities.has(k)&&['行く','来る'].includes(verb.base)){r='but du déplacement';why=`« ${label} » est l’activité pour laquelle on se déplace.`;}
     else if(place&&movement.has(verb.base)){r='destination';why=`Indique le lieu que vise le déplacement : « ${label} ».`;}
     else if(verb.base==='する'&&!prefix.some(s=>s.jp==='を')&&parts.filter(nominal).every(s=>choices.has(key(s.jp)))){r='choix';why=`Avec ${verb.jp}, indique ce que l’on choisit.`;pending.push(()=>{verb.fr='choisir';verb.gloss=`choisir [${verb.form}]`;verb.explanation='Avec le groupe en に, する exprime ici un choix.';});}
    }
    if(p.jp==='で') {
     if(/^[一二三四五六七八九十百千万億\d]+円$/.test(k)&&verb.base==='買う'){r='prix';why='Avec 買う, ce montant en yens indique le prix payé.';}
     else if(vehicles.has(k)&&movement.has(verb.base)){r='moyen de transport';why=`« ${label} » est le transport utilisé pour ce déplacement.`;}
     else if(instruments.has(k)&&verb.base==='食べる'){r='instrument';why=`« ${label} » est l’instrument utilisé pour manger.`;}
     else if(place&&['働く','待つ','食べる','飲む','読む','書く','買う','作る','聞く','する'].includes(verb.base)){r='lieu de l’action';why=`Indique où se déroule l’action exprimée par ${verb.jp}.`;}
    }
    if(['から','まで'].includes(p.jp)&&((time&&['働く','待つ','寝る'].includes(verb.base))||(place&&movement.has(verb.base)))) {
     r=p.jp==='から'?(time?'début':'départ'):(time?'fin':'limite du trajet');why=`Marque ${p.jp==='から'?'le point de départ':'la limite'} ${time?'dans le temps':'du déplacement'}.`;
    }
    if(!r){valid=false;continue;}
    if(['lieu de présence','lieu de résidence','lieu de l’action'].includes(r)) {
     const spatial={中:'intérieur',前:'devant',後ろ:'derrière',上:'dessus',下:'dessous',隣:'à côté'}[k];
     if(spatial)pending.push(()=>{last.gloss=spatial;});
    }
    mark(p,r,why);actions.push(`« ${label} ${p.jp} » : ${r}`);
   }
   if(!valid){
    if(allowPartial)pending.forEach(f=>f());
    return null;
   }
   pending.forEach(f=>f());
   if(verb.base==='聞く'&&groups.some(g=>g.particle?.jp==='を'&&key(g.parts.at(-1)?.jp)==='道')) {
    verb.fr=verb.trial?'essayer de demander':'demander';
    verb.gloss=`${verb.fr} [${verb.inflection||verb.form}]`;verb.explanation+=' Ici, 道を聞く signifie demander le chemin.';
   }
   for(const s of finals)if(s.jp==='か')role(s,'question','Termine ici la proposition interrogative.');
   return [...actions,`« ${verb.jp} » : ${verb.fr}`,...finals.map(s=>s.jp==='か'?'question':s.jp==='ね'?'accord sollicité':'information soulignée')].join(' → ')+'. La personne et les éléments sous-entendus se comprennent avec le dialogue.';
  }
  // Independent, bounded evidence can enrich a partial clause without
  // pretending that its complete structure has been established.
  function explainLocal(segments,jp) {
   if(jp.some(t=>/[「」『』“”"]/.test(t)))return;
   explain(segments,jp,true);
   const dependentNouns=set('こと 事 もの 物 の よう 様 ため 為 はず 筈 つもり 積もり ところ 所 とき 時 まま ほう 方 一番');
   for(let i=1;i<segments.length-1;i++) {
    const left=segments[i-1],s=segments[i],right=segments[i+1];
    if(s.role||!s.known||s.particle!=='の'||!nominal(left)||!nominal(right)||left.end!==s.start||s.end!==right.start)continue;
    if(dependentNouns.has(key(left.jp))||dependentNouns.has(key(right.jp)))continue;
    const label=relation(left,right);
    role(s,label,label==='sujet du livre'?`« ${left.jp} » indique ici le sujet du livre.`:`Dans ce groupe, « ${left.jp} » précise « ${right.jp} ». La nature exacte de cette relation reste dépendante du contexte.`);
   }
   for(const s of segments)if(s.role)s.roleScope='local';
  }
  function analyze(row) {
   const {jp,segments,sourceAligned}=segment(row);
   // Analyze independent sentences separately; never split a relative at a comma.
   // Parentheses delimit an aside, not a reason to make its words unknown.
   const clauses=[];let start=0;
   for(let end=0;end<=jp.length;end++)if(end===jp.length||/^[。！？!?]$/.test(jp[end])) {
    const members=segments.filter(s=>s.start>=start&&s.end<=end);
    const tokens=jp.slice(start,end).filter(t=>!/[（）()]/.test(t));
    if(members.length) {
     const local=members.map(s=>({...s}));
     // Keep token offsets exact when parentheses have been removed.
     for(let i=0;i<local.length;i++) {
      local[i].start=jp.slice(start,members[i].start).filter(t=>!/[（）()]/.test(t)).length;
      local[i].end=jp.slice(start,members[i].end).filter(t=>!/[（）()]/.test(t)).length;
     }
     // A comma is accepted only after a short reply/interjection. No inferred
     // clause boundary at arbitrary commas, nor across parentheses in mid-sentence.
     const commas=tokens.map((t,i)=>/^[、，,]$/.test(t)?i:-1).filter(i=>i>=0);
     const simplePunctuation=!commas.length||commas.length===1&&commas[0]===local[0]?.end&&['はい','いいえ','ええ','ああ','じゃあ'].includes(local[0]?.jp);
     const internalParenthesis=jp.slice(members[0].start,members.at(-1).end).some(t=>/^[（）()]$/.test(t));
     let explained=sourceAligned&&!internalParenthesis?(explain(local,tokens)||(simplePunctuation?explainSimple(local):null)):null;
     if(!explained&&sourceAligned&&!internalParenthesis&&local.at(-1)?.jp==='から') {
      const action=local.at(-2);
      if(action?.category==='verbe'&&/[てで]$/.test(key(action.jp))&&verbs[action.base]) {
       const before=local.slice(0,-1).map(s=>({...s}));
       Object.assign(before.at(-1),{form:'forme en て',fr:verbs[action.base],gloss:verbs[action.base]});
       if(explain(before,tokens.slice(0,action.end))) {
        before.forEach((s,i)=>Object.assign(local[i],s));
        role(local.at(-1),'après','Après un verbe en て, から indique que l’action précédente est accomplie avant la suite.');
        explained='Action → [après] : repère temporel pour la suite.';
       }
      }
     }
     if(!explained&&sourceAligned&&!internalParenthesis)explainLocal(local,tokens);
     if(explained||local.some(s=>s.roleScope==='local'))local.forEach((s,i)=>{const {start,end,...fields}=s;Object.assign(members[i],fields);});
     clauses.push(explained);
    }
    start=end+1;
   }
   const structure=clauses.length&&clauses.every(Boolean)?clauses.join(' / '):null;
   const resolvedClauses=clauses.filter(Boolean).length;
   const localRoles=segments.filter(s=>s.roleScope==='local').length;
   // Keep punctuation in source order after grouping, without losing an unknown token.
   const output=[];let i=0;
   for(const s of segments){while(i<s.start){if(punct(jp[i]))output.push(renderPunct(jp[i]));i++;}output.push(s.gloss||short(s.fr));i=s.end;}
   while(i<jp.length){if(punct(jp[i]))output.push(renderPunct(jp[i]));i++;}
   const counts={rule:0,dictionary:0,annotation:0,unknown:0};segments.forEach(s=>counts[s.origin]++);
   return {segments,structure,resolvedClauses,localRoles,structureOrigin:structure?'rule':null,literal:output.join(' ').replace(/\s+([,.!?)])/g,'$1').replace(/\(\s+/g,'('),literalOrigin:'automatic',
    note:(structure?'Lecture dans l’ordre japonais. La traduction de la leçon précise le sens dans le dialogue.':!sourceAligned?'Le texte japonais et sa lecture ne permettent pas un alignement sûr. Seules les lectures lexicales attestées sont proposées ; la construction reste à vérifier.':`Les groupes reconnus aident à lire la phrase, mais ses relations ne sont pas toutes établies.${resolvedClauses?' Certaines phrases de cette réplique sont analysées séparément.':''}${localRoles?' Des relations sont précisées localement, sans valider l’ensemble de la proposition.':''} Les sens lexicaux et les rôles incertains restent à vérifier dans le contexte.`)+segments.filter(s=>s.sourceNote).map(s=>' '+s.sourceNote).join(''),
    partial:!structure||segments.some(s=>!s.known||!s.kana||!s.romaji),counts};
  }
  return {analyze};
 }
 const api={create};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DecorticageAuto=api;
})(globalThis);
