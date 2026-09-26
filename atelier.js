'use strict';
let atelierSettings={level:null,start:1,scope:'through',type:'mixed',count:10};
let atelierSession=null;
let atelierListReturn=null;
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
 <label>Activités<select id="atelier-type"><option value="mixed">Vocabulaire et grammaire</option><option value="vocab">Vocabulaire</option><option value="particles">Grammaire · particules</option><option value="grammar">Grammaire · formes verbales</option></select></label>
 <label>Longueur<select id="atelier-count"><option value="5">5 questions</option><option value="10">10 questions</option><option value="20">20 questions</option></select></label></div>
 <p class="muted">Vocabulaire : retrouvez le sens, puis révélez la réponse. Grammaire : travaillez les formes verbales ou les particules. Le mélange associe vocabulaire et formes verbales. Les particules disposent d’un premier ensemble d’exemples sélectionnés, des leçons 3 à 14.</p>
 <p id="atelier-pool" role="status"></p><div class="atelier-catalogs"><details id="atelier-vocab-list"><summary></summary><div class="atelier-catalog"></div></details><details id="atelier-grammar-list"><summary></summary><div class="atelier-catalog"></div></details><details id="atelier-particles-list"><summary></summary><div class="atelier-catalog"></div></details></div><button id="atelier-start" class="audio">Commencer une séance</button></section><section id="atelier-work" class="panel atelier-work" aria-label="Séance d’entraînement"></section>`;
 for(const field of ['scope','type','count'])$('#atelier-'+field).value=atelierSettings[field];
 $('#atelier-from').value=atelierSettings.start;
 let currentPool;
 const fillList=(kind)=>{
  const detail=$('#atelier-'+kind+'-list');
  if(detail.open)detail.querySelector('.atelier-catalog').innerHTML=atelierCatalog(currentPool[kind]);
 };
 for(const kind of ['vocab','grammar','particles'])$('#atelier-'+kind+'-list').ontoggle=()=>{if(!$('#atelier-'+kind+'-list .atelier-catalog').children.length)fillList(kind);};
 const refresh=()=>{
  const pool=AtelierEngine.build(lessons,vocab,DecorticageAuto.create(vocab),atelierSettings.level,atelierSettings.scope,atelierSettings.start);
  currentPool=pool;
  $('#atelier-start-label').hidden=atelierSettings.scope!=='range';
  for(const [id,order] of [['atelier-scope',-3],['atelier-from',-2],['atelier-level',-1]])$('#'+id).closest('label').style.order=atelierSettings.scope==='range'?order:'';
  $('#atelier-level-label').textContent=atelierSettings.scope==='range'?'Jusqu’à la leçon':'Leçon';
  for(const [kind,label] of [['vocab','mots ou expressions'],['grammar','formes verbales'],['particles','exercices sur les particules']]){
   $('#atelier-'+kind+'-list summary').textContent=`${pool[kind].length} ${label}`;
   fillList(kind);
  }
  $('#atelier-pool').textContent=`${pool.vocab.length} mots ou expressions · ${pool.grammar.length} formes verbales · ${pool.particles.length} exercices sur les particules disponibles.`;
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
 if(atelierListReturn && JSON.stringify(atelierSettings)===atelierListReturn.settings){
  for(const saved of atelierListReturn.lists){
   const detail=document.getElementById(saved.id);
   detail.open=saved.open;fillList(detail.id.replace('atelier-','').replace('-list',''));
   detail.querySelector('.atelier-catalog').scrollTop=saved.scroll;
  }
  const saved=atelierListReturn;
  requestAnimationFrame(()=>{if(route().tab!=='atelier')return;
   document.querySelectorAll('#'+saved.listId+' .atelier-catalog a')[saved.linkIndex]?.focus({preventScroll:true});
   window.scrollTo(0,saved.scrollY);
  });
 }
}
function renderAtelierQuestion(){
 const target=$('#atelier-work'),s=atelierSession;
 if(!s){target.innerHTML='<p class="muted">Les aides de lecture, dont le romaji, restent disponibles. Les résultats de cette première version sont conservés pendant la séance, sans historique enregistré.</p>';return;}
 if(s.index>=s.questions.length){
  const good=s.results.filter(r=>r.good).length;
  target.innerHTML=`<h2>Séance terminée</h2><p>${good} réponse${good>1?'s':''} réussie${good>1?'s':''} ou déclarée${good>1?'s':''} connue${good>1?'s':''} sur ${s.questions.length}.</p><p class="muted">Le vocabulaire est autoévalué ; ce résultat est un repère d’entraînement.</p><h3>À reprendre</h3>${s.results.some(r=>!r.good)?s.results.filter(r=>!r.good).map(r=>`<p>${sourceLink(r.q.source)} · ${esc(r.q.type==='vocab'?r.q.word.fr:r.q.type==='particles'?r.q.title:r.q.part.form)}</p>`).join(''):'<p>Aucun élément marqué à revoir dans cette séance.</p>'}<button id="atelier-again">Nouvelle séance</button>`;
  $('#atelier-again').onclick=()=>$('#atelier-start').click();return;
 }
 if(s.questions[s.index].type==='particles'){renderParticleQuestion(target,s);return;}
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
 const ordered=items[0].type==='vocab' ? [...items].sort((a,b)=>a.source.localeCompare(b.source,'en',{numeric:true})) : items;
 return '<ul>'+ordered.map(q=>{
  if(q.type==='particles')return `<li><p>${esc(q.activity+' · '+q.title)}</p>${q.sources.map(sourceLink).join(' · ')}</li>`;
  const t=q.type==='vocab'?{jp:q.word.mot,kana:q.word.kana,romaji:q.word.romaji,fr:q.word.fr}:q.part;
  const same=String(t.jp).replace(/\s/g,'')===String(t.kana).replace(/\s/g,'');
  return `<li class="catalog-item"><div class="language-block catalog-reading"><span class="catalog-japanese">
  <button class="kana kana-audio" lang="ja" data-speak="${esc(t.audioKana || t.kana)}" aria-label="Écouter : ${esc(t.kana)}">${esc(t.kana)}<span class="sound-note" aria-hidden="true"> ♪</span></button>
  <span class="jp${same?' catalog-identical':''}" lang="ja">${jp(t.jp)}</span></span>
  <span class="romaji">${esc(Romaji.display(t.romaji))}</span>
  <span class="fr">${esc(t.fr || '')}</span></div>
  <div class="catalog-meta">${q.type==='grammar'?`<span>${esc(q.part.form)}</span>`:''}${sourceLink(q.source)}</div></li>`;
 }).join('')+'</ul>';
}

function renderParticleQuestion(target,s){
 const q=s.questions[s.index];
 // Keep the same option order after navigation or a reading-setting change.
 if(!s.particleOptions||s.particleOptions.id!==q.id)s.particleOptions={id:q.id,items:AtelierEngine.shuffle(q.options)};
 const optionText=t=>`<span class="language-block particle-label"><span class="jp" lang="ja">${jp(t.jp)}</span><span class="kana">${esc(t.kana)}</span><span class="romaji">${esc(Romaji.display(t.romaji))}</span></span>`;
 target.innerHTML=`<p class="eyebrow">Particules · ${esc(q.activity)} · ${s.index+1} / ${s.questions.length}</p><h2>${esc(q.prompt)}</h2>
 ${q.texts.map((t,i)=>`<div class="particle-example">${q.texts.length>1?`<h3>Phrase ${i?'B':'A'}</h3>`:''}${block({...t,audioKana:t.kana.replace('［…］','、')},{audio:false})}</div>`).join('')}
 ${q.activity==='Compléter'?'<p class="muted">Le blanc est aussi masqué dans les lectures. L’écoute marque une pause à cet endroit.</p>':''}
 <div class="atelier-options">${s.particleOptions.items.map((o,i)=>`<button data-particle-choice="${i}">${o.text?optionText(o.text):esc(o.label)}</button>`).join('')}</div><div id="atelier-feedback" role="status"></div>`;
 const reveal=choice=>{
  s.revealed=true;s.choice=choice;
  const good=q.accepted.includes(choice);
  const labels=q.options.filter(o=>q.accepted.includes(o.value)).map(o=>o.text?o.text.jp+' ('+o.text.romaji+')':o.label).join(' ou ');
  $('#atelier-feedback').innerHTML=`<div class="feedback"><h3>${good?'Bonne réponse !':'À reprendre'}</h3><p><strong>${esc(labels)}</strong></p><p>${esc(q.explanation)}</p>
  ${q.accepted.length>1?'<p>Ces deux réponses sont acceptées dans cette phrase.</p>':''}
  <details><summary>Revoir les phrases sources</summary>${q.sources.map(id=>{const row=lessons.find(r=>r.Leçon+'-'+r.Ligne===id);return block({jp:row.Japonais,kana:row.Kana,romaji:row.Romaji,fr:row.Français},{audio:false})+sourceLink(id);}).join('')}</details>
  <p><a href="${esc(q.reference)}" target="_blank" rel="noopener">Référence : notes grammaticales Irodori</a></p></div><button id="atelier-next">Continuer</button>`;
  target.querySelectorAll('[data-particle-choice]').forEach(b=>{b.disabled=true;b.setAttribute('aria-pressed',String(s.particleOptions.items[Number(b.dataset.particleChoice)].value===choice));});
  $('#atelier-next').onclick=()=>{stopAudio();s.results.push({q,good});s.index++;s.revealed=false;s.choice=null;renderAtelierQuestion();};
 };
 target.querySelectorAll('[data-particle-choice]').forEach(b=>b.onclick=()=>{stopAudio();if(!s.revealed)reveal(s.particleOptions.items[Number(b.dataset.particleChoice)].value);});
 if(s.revealed)reveal(s.choice);
}

// Retenir le point de départ avant de consulter une phrase depuis une liste.
document.addEventListener('click',event=>{
 const link=event.target.closest('.atelier-catalog a[href^="#lecons/"]');
 if(!link || event.button!==0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)return;
 dictionaryReturn=null;
 const list=link.closest('.atelier-catalogs > details');
 atelierListReturn={destination:link.getAttribute('href'),settings:JSON.stringify(atelierSettings),
  scrollY:window.scrollY,listId:list.id,linkIndex:[...list.querySelectorAll('.atelier-catalog a')].indexOf(link),
  lists:[...document.querySelectorAll('.atelier-catalogs > details')].map(d=>({id:d.id,open:d.open,scroll:d.querySelector('.atelier-catalog').scrollTop}))};
});
function renderAtelierReturn(r){
 if(!atelierListReturn || r.tab!=='lecons' || location.hash!==atelierListReturn.destination)return;
 const card=document.getElementById(r.line);if(!card)return;
 const back=document.createElement('a');back.href='#atelier';back.className='atelier-return';back.textContent='← Retour à la liste';
 card.prepend(back);card.scrollIntoView({block:'start'});
}
