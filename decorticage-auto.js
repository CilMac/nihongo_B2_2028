/* Analyse locale : lectures attestées, groupes réutilisables et constructions bornées. */
(function(root) {
 'use strict';
 const key = s => String(s || '').normalize('NFC').replace(/\s/g,'');
 const readingKey = s => key(s).replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60));
 const split = s => String(s || '').match(/[^\s。、！？!?]+|[。、！？!?]/gu) || [];
 const punct = s => /^[。、！？!?]$/u.test(s);
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
  '作る':'fabriquer','する':'faire','ある':'il y a / se trouver','いる':'être présent / se trouver'
 };
 const teMeanings = {
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
 const places=set('ここ そこ あそこ どこ 中 前 後ろ 上 下 隣 外 左 右 東京 学校 家 デパート 喫茶店 バー 公園 図書館 会社 空港 駅 海 工場 部屋');
 const times=set('今 今日 昨日 明日 今朝 今晩 今晚 朝 夜 午前 午後 夜中 毎朝 来週 先週');
 const vehicles=set('バス 電車 地下鉄 新幹線 飛行機 タクシー 船 自転車 車');
 const instruments=set('箸 お箸 フォーク スプーン ナイフ');
 const activities=set('買物 買い物 散歩 食事 観光 仕事');
 const choices=set('何 どれ コーヒー 紅茶 お茶 ビール 水 カレー うどん お菓子 菓子');
 const adverbs=set('まず それから それでは じゃあ でも 今 今日 昨日 明日 今朝 今晩 今晚 朝 夜 午前 午後 夜中 毎朝 来週 先週 また 一緒 たくさん どう');
 const objectVerbs=set('食べる 飲む 買う 読む 見る 書く 待つ 持つ 知る 作る');
 const movement=set('行く 来る 帰る 歩く');
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
   return {kana:key(w.kana),romaji:w.romaji || '',fr:w.fr,gloss:short(w.fr),category:w.categorie_grammaticale,
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
   let result=[];
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
   for(const [ending,roman,label] of endings.filter(e=>e[0]!=='ましょう')) {
    const auxiliary='い'+ending;if(!k.endsWith(auxiliary))continue;
    const te=k.slice(0,-auxiliary.length);
    for(const w of index.get(te) || []) {
     if(!/[てで]$/.test(te)||w.categorie_grammaticale!=='verbe'||!teMeanings[w.forme_base])continue;
     const [fr,explanation]=teMeanings[w.forme_base];
     const aspect=['住む','知る'].includes(w.forme_base)?'état':w.forme_base==='持つ'?'possession ou action':'activité';
     result.push({...lexical(w),kana:key(w.kana)+auxiliary,romaji:w.romaji+' i'+roman,fr,gloss:`${fr} [${aspect} ; ${label}]`,
      form:`forme en て + いる · ${label}`,te:true,origin:'rule',explanation});
    }
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
  function segment(row) {
   const jp=split(row.Japonais),kanaTokens=split(row.Kana),sourceKana=key(row.Kana),kana=readingKey(row.Kana);
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
      // A conjunction must not absorb a separately written particle inside a
      // nominal phrase (e.g. adjectif + な + ところ + が).
      if(n>1&&c.category==='conjonction'&&chunk.some(t=>particles[t])&&i>0&&!punct(jp[i-1]))continue;
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
      if(/[。、！？!?]/u.test(kana.slice(pos,end)))break;
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
  function explain(segments,jp) {
   let end=segments.length-1;
   const finals=[];while(end>=0&&['か','ね','よ'].includes(segments[end].jp)){finals.unshift(segments[end--]);}
   if(!['','か','ね','よ','よね','かね'].includes(finals.map(s=>s.jp).join('')))return null;
   const verb=segments[end],prefix=segments.slice(0,end);
   const introduction=['はい','いいえ'].includes(prefix[0]?.jp)&&jp[prefix[0].end]==='、'?prefix.shift():null;
   // A single supported finite predicate. Complex clauses receive lexical groups only.
   if(!verb?.form||!verbs[verb.base]||prefix.some(s=>s.form||s.base||!s.known)||jp.some((t,i)=>punct(t)&&i!==jp.length-1&&!(introduction&&t==='、'&&i===introduction.end)))return null;
   const groups=[];let buffer=[];
   const delimiters=set('は も が を に へ で から まで');
   for(const s of prefix) {
    if(delimiters.has(s.jp)){if(!buffer.length)return null;groups.push({parts:buffer,particle:s});buffer=[];}
    else buffer.push(s);
   }
   if(buffer.length)groups.push({parts:buffer,particle:null});
   const actions=introduction?[`« ${introduction.jp} » : réponse`]:[];let valid=true;
   const pending=[]; // Commit roles only once every group has passed the bounded grammar.
   const mark=(s,label,why)=>pending.push(()=>role(s,label,why));
   const nounPhrase = parts => {
    if(!parts.length)return false;
    for(let i=0;i<parts.length;i++) {
     const s=parts[i];
     if(s.jp==='の'||s.jp==='と') {
      if(!nominal(parts[i-1])||!nominal(parts[i+1]))return false;
      mark(s,s.jp==='の'?'relation entre noms':'énumération',s.jp==='の'?`« ${parts[i-1].jp} » précise « ${parts[i+1].jp} ». La relation dépend de ces noms.`:'Relie les éléments de cette liste.');
     } else if(!nominal(s)||i>0&&nominal(parts[i-1]))return false;
    }
    return true;
   };
   const existential=['ある','いる'].includes(verb.base)&&!verb.te;
   for(const group of groups) {
    const parts=[...group.parts],p=group.particle;
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
    if(!p){if(parts.length)valid=false;continue;}
    if(!nounPhrase(parts)){valid=false;continue;}
    const last=parts.at(-1),k=key(last.jp),place=isPlace(last),time=isTime(last),label=parts.map(s=>s.jp).join(' ');
    let r='',why='';
    if(p.jp==='は'){r='thème';why=`Présente « ${label} » comme thème de la phrase.`;}
    if(p.jp==='も'){r='aussi';why=`Ajoute « ${label} » à ce qui est déjà évoqué ; le dialogue donne l’autre élément.`;}
    if(p.jp==='が'&&existential){r='élément présent';why=`Indique ce dont on dit qu’il est présent, avec ${verb.jp}.`;}
    if(p.jp==='を'&&objectVerbs.has(verb.base)){r='objet';why=`Indique ce sur quoi porte l’action exprimée par ${verb.jp}.`;}
    if(p.jp==='へ'&&movement.has(verb.base)&&place){r='direction';why=`Indique la direction du déplacement vers « ${label} ».`;}
    if(p.jp==='に') {
     if(last.quantity==='clock'&&['起きる','寝る','行く','来る','帰る','働く'].includes(verb.base)){r='heure';why=`Situe ${verb.jp} à l’heure indiquée ; ce groupe ne donne pas une durée.`;}
     else if(place&&existential){r='lieu de présence';why=`Indique où se trouve l’être ou la chose avec ${verb.jp}.`;}
     else if(place&&verb.base==='住む'){r='lieu de résidence';why=`Indique où l’on habite avec ${verb.jp}.`;}
     else if(activities.has(k)&&['行く','来る'].includes(verb.base)){r='but du déplacement';why=`« ${label} » est l’activité pour laquelle on se déplace.`;}
     else if(place&&movement.has(verb.base)){r='destination';why=`Indique le lieu que vise le déplacement : « ${label} ».`;}
     else if(verb.base==='する'&&!prefix.some(s=>s.jp==='を')&&parts.filter(nominal).every(s=>choices.has(key(s.jp)))){r='choix';why=`Avec ${verb.jp}, indique ce que l’on choisit.`;pending.push(()=>{verb.fr='choisir';verb.gloss=`choisir [${verb.form}]`;verb.explanation='Avec le groupe en に, する exprime ici un choix.';});}
    }
    if(p.jp==='で') {
     if(vehicles.has(k)&&movement.has(verb.base)){r='moyen de transport';why=`« ${label} » est le transport utilisé pour ce déplacement.`;}
     else if(instruments.has(k)&&verb.base==='食べる'){r='instrument';why=`« ${label} » est l’instrument utilisé pour manger.`;}
     else if(place&&['働く','待つ','食べる','飲む','読む','書く','買う','作る'].includes(verb.base)){r='lieu de l’action';why=`Indique où se déroule l’action exprimée par ${verb.jp}.`;}
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
   if(!valid)return null;
   pending.forEach(f=>f());
   for(const s of finals)if(s.jp==='か')role(s,'question','Termine ici la proposition interrogative.');
   return [...actions,`« ${verb.jp} » : ${verb.fr}`,...finals.map(s=>s.jp==='か'?'question':s.jp==='ね'?'accord sollicité':'information soulignée')].join(' → ')+'. La personne et les éléments sous-entendus se comprennent avec le dialogue.';
  }
  function analyze(row) {
   const {jp,segments,sourceAligned}=segment(row);
   const structure=sourceAligned?explain(segments,jp):null;
   // Keep punctuation in source order after grouping, without losing an unknown token.
   const output=[];let i=0;
   for(const s of segments){while(i<s.start){if(punct(jp[i]))output.push(jp[i]==='、'?',':/[？?]/.test(jp[i])?'?':/[！!]/.test(jp[i])?'!':'.');i++;}output.push(s.gloss||short(s.fr));i=s.end;}
   while(i<jp.length){if(punct(jp[i]))output.push(jp[i]==='、'?',':/[？?]/.test(jp[i])?'?':/[！!]/.test(jp[i])?'!':'.');i++;}
   const counts={rule:0,dictionary:0,annotation:0,unknown:0};segments.forEach(s=>counts[s.origin]++);
   return {segments,structure,structureOrigin:structure?'rule':null,literal:output.join(' ').replace(/\s+([,.!?])/g,'$1'),literalOrigin:'automatic',
    note:structure?'Lecture dans l’ordre japonais. La traduction de la leçon précise le sens dans le dialogue.':!sourceAligned?'Le texte japonais et sa lecture ne permettent pas un alignement sûr. Seules les lectures lexicales attestées sont proposées ; la construction reste à vérifier.':'Les groupes reconnus aident à lire la phrase, mais ses relations ne sont pas toutes établies. Les sens lexicaux et les rôles incertains restent à vérifier dans le contexte.',
    partial:!structure||segments.some(s=>!s.known||!s.kana||!s.romaji),counts};
  }
  return {analyze};
 }
 const api={create};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DecorticageAuto=api;
})(globalThis);
