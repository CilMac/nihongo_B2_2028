'use strict';
let atelierSettings={level:null,start:1,scope:'through',type:'mixed',count:10};
let atelierSession=null;
function renderAtelier(r={}){
 if(lessonIds.includes(r.id)&&['lesson','through'].includes(r.line)){
  const nextLevel=Number(r.id.slice(1));
  if(atelierSettings.level!==nextLevel||atelierSettings.scope!==r.line)atelierSession=null;
  atelierSettings.level=nextLevel;atelierSettings.scope=r.line;
 }
 const level=atelierSettings.level||Number(settings.lesson.slice(1))||1;
 atelierSettings.level=level;
 $('#main').innerHTML=intro('PRATIQUER · COMPRENDRE','L’atelier','Choisissez votre leçon et entraînez-vous à votre rythme.')+`<section class="panel"><div class="atelier-settings">
 <label><span id="atelier-level-label">Leçon</span><select id="atelier-level">${lessonIds.map(id=>`<option value="${id.slice(1)}" ${Number(id.slice(1))===level?'selected':''}>${esc(lessonLabel(id))}</option>`).join('')}</select></label>
 <label>Périmètre<select id="atelier-scope"><option value="through">Tout jusqu’à cette leçon</option><option value="lesson">Cette leçon uniquement</option><option value="range">Une plage de leçons</option></select></label>
 <label id="atelier-start-label" hidden>De la leçon<select id="atelier-from">${lessonIds.map(id=>`<option value="${id.slice(1)}">${esc(lessonLabel(id))}</option>`).join('')}</select></label>
 <label>Activités<select id="atelier-type"><option value="mixed">Vocabulaire et grammaire</option><option value="vocab">Vocabulaire</option><option value="grammar">Grammaire · formes verbales</option></select></label>
 <label>Longueur<select id="atelier-count"><option value="5">5 questions</option><option value="10">10 questions</option><option value="20">20 questions</option></select></label></div>
 <p class="muted">Vocabulaire : retrouvez le sens, puis révélez la réponse. Grammaire : reconnaissez les formes verbales polies rencontrées dans votre périmètre.</p>
 <p id="atelier-pool" role="status"></p><div class="atelier-catalogs"><details id="atelier-vocab-list"><summary></summary><div class="atelier-catalog"></div></details><details id="atelier-grammar-list"><summary></summary><div class="atelier-catalog"></div></details></div><button id="atelier-start" class="audio">Commencer une séance</button></section><section id="atelier-work" class="panel atelier-work" aria-label="Séance d’entraînement"></section>`;
 for(const field of ['scope','type','count'])$('#atelier-'+field).value=atelierSettings[field];
 $('#atelier-from').value=atelierSettings.start;
 let currentPool;
 const fillList=(kind)=>{
  const detail=$('#atelier-'+kind+'-list');
  if(detail.open)detail.querySelector('.atelier-catalog').innerHTML=atelierCatalog(currentPool[kind]);
 };
 for(const kind of ['vocab','grammar'])$('#atelier-'+kind+'-list').ontoggle=()=>fillList(kind);
 const refresh=()=>{
  const pool=AtelierEngine.build(lessons,vocab,DecorticageAuto.create(vocab),atelierSettings.level,atelierSettings.scope,atelierSettings.start);
  currentPool=pool;
  $('#atelier-start-label').hidden=atelierSettings.scope!=='range';
  for(const [id,order] of [['atelier-scope',-3],['atelier-from',-2],['atelier-level',-1]])$('#'+id).closest('label').style.order=atelierSettings.scope==='range'?order:'';
  $('#atelier-level-label').textContent=atelierSettings.scope==='range'?'Jusqu’à la leçon':'Leçon';
  for(const [kind,label] of [['vocab','mots ou expressions'],['grammar','formes verbales']]){
   $('#atelier-'+kind+'-list summary').textContent=`${pool[kind].length} ${label} — afficher la liste`;
   fillList(kind);
  }
  $('#atelier-pool').textContent=`${pool.vocab.length} mots ou expressions · ${pool.grammar.length} formes verbales disponibles.`;
  const available=atelierSettings.type==='mixed'?pool.vocab.length+pool.grammar.length:pool[atelierSettings.type].length;
  $('#atelier-start').disabled=!available;
  if(pool.invalid)$('#atelier-pool').textContent='La première leçon doit précéder ou être égale à la dernière.';
  else if(!available)$('#atelier-pool').textContent+=' Aucun exercice de ce type dans ce périmètre : choisissez une autre activité ou une autre leçon.';
  return pool;
 };
 for(const field of ['level','scope','type','count'])$('#atelier-'+field).onchange=e=>{
  stopAudio();atelierSettings[field]=['level','count'].includes(field)?Number(e.target.value):e.target.value;
  atelierSession=null;refresh();renderAtelierQuestion();
 };
 $('#atelier-from').onchange=e=>{stopAudio();atelierSettings.start=Number(e.target.value);atelierSession=null;refresh();renderAtelierQuestion();};
 $('#atelier-start').onclick=()=>{stopAudio();atelierSession={questions:AtelierEngine.session(refresh(),atelierSettings.type,atelierSettings.count),index:0,results:[],revealed:false,choice:null};renderAtelierQuestion();};
 refresh();renderAtelierQuestion();
}
function renderAtelierQuestion(){
 const target=$('#atelier-work'),s=atelierSession;
 if(!s){target.innerHTML='<p class="muted">Les aides de lecture, dont le romaji, restent disponibles. Les résultats de cette première version sont conservés pendant la séance, sans historique enregistré.</p>';return;}
 if(s.index>=s.questions.length){
  const good=s.results.filter(r=>r.good).length;
  target.innerHTML=`<h2>Séance terminée</h2><p>${good} réponse${good>1?'s':''} réussie${good>1?'s':''} ou déclarée${good>1?'s':''} connue${good>1?'s':''} sur ${s.questions.length}.</p><p class="muted">Le vocabulaire est autoévalué ; ce résultat est un repère d’entraînement.</p><h3>À reprendre</h3>${s.results.some(r=>!r.good)?s.results.filter(r=>!r.good).map(r=>`<p>${sourceLink(r.q.source)} · ${esc(r.q.type==='vocab'?r.q.word.fr:r.q.part.form)}</p>`).join(''):'<p>Aucun élément marqué à revoir dans cette séance.</p>'}<button id="atelier-again">Nouvelle séance</button>`;
  $('#atelier-again').onclick=()=>$('#atelier-start').click();return;
 }
 const q=s.questions[s.index],isVocab=q.type==='vocab',word=isVocab?{jp:q.word.mot,kana:q.word.kana,romaji:q.word.romaji}:q.part;
 target.innerHTML=`<p class="eyebrow">${isVocab?'Vocabulaire':'Grammaire'} · ${s.index+1} / ${s.questions.length}</p><h2>${isVocab?'Quel est le sens de ce mot ou de cette expression ?':'Quelle est la forme de ce verbe ?'}</h2>${block(word,{audio:false,fr:false})}
 ${isVocab||q.options.length<2?`<button id="atelier-reveal">${s.revealed?'Réponse affichée':'Voir la réponse'}</button>`:`<div class="atelier-options">${AtelierEngine.shuffle(q.options).map(option=>`<button data-form="${esc(option)}" ${s.revealed?'disabled':''}>${esc(option)}</button>`).join('')}</div>`}
 <div id="atelier-feedback" role="status"></div>`;
 const reveal=(choice=null)=>{
  if(s.revealed)return;s.revealed=true;s.choice=choice;
  const answer=isVocab?q.word.fr:q.part.form;
  const explanation=isVocab?'Le sens du mot est distinct de la traduction de la réplique. Comparez avec son emploi ci-dessous.':q.part.explanation;
  $('#atelier-feedback').innerHTML=`<div class="feedback"><h3>${choice?(choice===answer?'Bonne réponse !':'À reprendre'):'La réponse'}</h3><p>${esc(answer)}</p><p>${esc(explanation)}</p><details><summary>Revoir la phrase de la leçon</summary>${block({jp:q.row.Japonais,kana:q.row.Kana,romaji:q.row.Romaji,fr:q.row.Français},{audio:false})}${sourceLink(q.source)}</details></div><div class="atelier-options">${choice?'<button id="atelier-next">Continuer</button>':'<button id="atelier-known">Je savais</button><button id="atelier-review">À revoir</button>'}</div>`;
  target.querySelectorAll('[data-form],#atelier-reveal').forEach(b=>b.disabled=true);
  const next=good=>{stopAudio();s.results.push({q,good});s.index++;s.revealed=false;s.choice=null;renderAtelierQuestion();};
  if(choice)$('#atelier-next').onclick=()=>next(choice===answer);
  else{$('#atelier-known').onclick=()=>next(true);$('#atelier-review').onclick=()=>next(false);}
 };
 if($('#atelier-reveal'))$('#atelier-reveal').onclick=()=>reveal();
 target.querySelectorAll('[data-form]').forEach(b=>b.onclick=()=>reveal(b.dataset.form));
 // Restore an answered question when returning from another module.
 if(s.revealed){const choice=s.choice;s.revealed=false;reveal(choice);}
}

function atelierCatalog(items){
 if(!items.length)return '<p class="muted">Aucun élément dans ce périmètre.</p>';
 return '<ul>'+items.map(q=>{
  const t=q.type==='vocab'?{jp:q.word.mot,kana:q.word.kana,romaji:q.word.romaji,fr:q.word.fr}:q.part;
  return `<li>${block(t,{audio:false})}${q.type==='grammar'?`<p>${esc(q.part.form)}</p>`:''}<p>${sourceLink(q.source)}</p></li>`;
 }).join('')+'</ul>';
}
