'use strict';
let atelierSettings={level:null,start:1,scope:'through',type:'mixed',count:10,generatorLevel:'1',generatorScope:'through_lesson'};
let atelierSession=null;
let atelierListReturn=null;
let atelierPoolCache=null;
let generatorCatalog=null;
const atelierActivityNames={generated:'Phrases surprises',mixed:'Vocabulaire et formes verbales',listening:'Écouter et comprendre',vocab:'Vocabulaire',particles:'Particules',constructions:'Constructions grammaticales',grammar:'Formes verbales'};
function atelierInProgress(){return !!atelierSession && !atelierSession.ended && atelierSession.index<atelierSession.questions.length;}
function focusAtelierWork(){
 window.closeNavigationCommands?.();
 const target=$('#atelier-work');target.scrollIntoView({block:'start'});
 const heading=target.querySelector('h2');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}
}
function updateAtelierSessionControls(){
 const active=atelierInProgress(),s=atelierSession;
 const resume=$('#atelier-resume');if(!resume)return;
 resume.hidden=!active;
 $('#atelier-setup-title').hidden=!s;
 $('#atelier-start').textContent=s?'Commencer une nouvelle séance':'Commencer';
 if(active){
  const config=s.settings,scope=config.type==='generated'?(config.generatorScope==='explore'?'Tout explorer':'Jusqu’à la leçon '+config.level):config.scope==='lesson'?'Leçon '+config.level:config.scope==='range'?'Leçons '+config.start+' à '+config.level:'Leçons 1 à '+config.level;
  $('#atelier-current').textContent=atelierActivityNames[config.type]+' · '+scope+(config.type==='generated'?' · '+s.generatedCount+' phrase(s) parcourue(s)':' · '+(s.index+1)+' / '+s.questions.length);
 }
}
function confirmAtelierReplacement(launch){
 window.closeNavigationCommands?.();
 let dialog=$('#atelier-replace');
 if(!dialog){
  dialog=document.createElement('dialog');dialog.id='atelier-replace';dialog.setAttribute('aria-labelledby','atelier-replace-title');dialog.setAttribute('aria-describedby','atelier-replace-description');
  dialog.innerHTML='<h2 id="atelier-replace-title">Remplacer la séance en cours ?</h2><p id="atelier-replace-description">Votre progression dans cette séance sera perdue. Les nouveaux choix serviront à commencer une autre séance.</p><form method="dialog" class="atelier-options"><button value="cancel" autofocus>Garder ma séance</button><button value="replace">Remplacer et commencer</button></form>';
  document.body.append(dialog);
  window.addEventListener('hashchange',()=>{if(dialog.open)dialog.close('cancel');});
 }
 dialog.returnValue='';
 dialog.addEventListener('close',()=>{
  if(route().tab!=='atelier')return;
  if(dialog.returnValue==='replace')launch();else $('#atelier-start')?.focus({preventScroll:true});
 },{once:true});
 dialog.showModal();
}
// Écouter, révéler une aide, choisir ou consulter le contexte engage la séance.
document.addEventListener('click',event=>{
 if(atelierInProgress()&&event.target.closest('#atelier-work')&&event.target.closest('button,a,summary'))atelierSession.started=true;
},true);
function getAtelierPool(){
 if(!atelierPoolCache||atelierPoolCache.lessons!==lessons||atelierPoolCache.vocab!==vocab){
  atelierPoolCache={lessons,vocab,analyzer:DecorticageAuto.create(vocab),key:null,pool:null};
 }
 const {level,scope,start}=atelierSettings;
 const key=[level,scope,scope==='range'?start:1].join(':');
 if(atelierPoolCache.key!==key){
  atelierPoolCache.pool=AtelierEngine.build(lessons,vocab,atelierPoolCache.analyzer,level,scope,start);
  atelierPoolCache.key=key;
 }
 return atelierPoolCache.pool;
}
function renderAtelier(r={}){
 if(r.id==='recherche'){renderCorpusRecord(r.line,true);return;}
 if(lessonIds.includes(r.id)&&['lesson','through'].includes(r.line)){
  const nextLevel=Number(r.id.slice(1));
  atelierSettings.level=nextLevel;atelierSettings.scope=r.line;
 }
 const level=atelierSettings.level||Number(settings.lesson.slice(1))||1;
 atelierSettings.level=level;
 const lessonOptions=lessonIds.map(id=>`<option value="${id.slice(1)}" ${Number(id.slice(1))===level?'selected':''}>${esc(lessonLabel(id).replace(' — Sans titre',''))}</option>`).join('');
 $('#main').innerHTML=intro('PRATIQUER · COMPRENDRE','L’atelier','Choisissez quoi réviser, puis commencez votre séance.')+`<section class="panel atelier-setup"><div id="atelier-resume" hidden><strong>Séance en cours</strong><p id="atelier-current"></p><button type="button" id="atelier-continue">Continuer ma séance</button></div><h2 id="atelier-setup-title" hidden>Préparer la prochaine séance</h2><div class="atelier-settings">
 <div class="atelier-setting-row"><label for="atelier-type">Quoi réviser ?</label><select id="atelier-type"><option value="mixed">Vocabulaire et formes verbales</option><option value="generated">Phrases surprises</option><option value="listening">Écouter et comprendre</option><option value="vocab">Vocabulaire</option><option value="particles">Particules</option><option value="constructions">Constructions grammaticales</option><option value="grammar">Formes verbales</option></select></div>
 <div class="atelier-setting-row"><label for="atelier-scope">Quelles leçons ?</label><div class="atelier-lesson-controls"><select id="atelier-scope"><option value="through">Depuis la première</option><option value="lesson">Une seule leçon</option><option value="range">Une plage</option></select><div class="atelier-bounds"><label id="atelier-start-label" hidden>De<select id="atelier-from" aria-label="Première leçon">${lessonOptions}</select></label><label><span id="atelier-level-label">à</span><select id="atelier-level" aria-label="Leçon de fin">${lessonOptions}</select></label></div></div></div>
 <div class="atelier-setting-row"><label for="atelier-count">Combien de questions ?</label><select id="atelier-count"><option value="5">5 questions</option><option value="10">10 questions</option><option value="20">20 questions</option></select></div></div>
 <div id="generator-settings" hidden><label for="generator-level">Constructions à explorer</label> <select id="generator-level"><option value="1">Constructions courtes</option><option value="2">Constructions enrichies</option><option value="3">Toutes les constructions</option></select><p><label for="generator-scope">Vocabulaire et constructions</label> <select id="generator-scope"><option value="through_lesson">Jusqu’à ma leçon</option><option value="explore">Tout explorer</option></select></p><p id="generator-lesson-row"><label for="generator-lesson">Ma leçon</label> <select id="generator-lesson">${lessonOptions}</select></p><p id="generator-scope-help"></p></div><p class="muted" id="atelier-description"></p><div class="atelier-launch"><button id="atelier-start" class="audio">Commencer</button><p id="atelier-pool" role="status"></p></div>
 <details id="atelier-content"><summary>Voir le contenu à réviser</summary><div class="atelier-catalogs"><details id="atelier-vocab-list"><summary></summary><div class="atelier-catalog"></div></details><details id="atelier-grammar-list"><summary></summary><div class="atelier-catalog"></div></details><details id="atelier-particles-list"><summary></summary><div class="atelier-catalog"></div></details><details id="atelier-constructions-list"><summary></summary><div class="atelier-catalog"></div></details></div></details></section><section id="atelier-work" class="panel atelier-work" aria-label="Séance d’entraînement" hidden></section>`;
 for(const field of ['scope','type','count'])$('#atelier-'+field).value=atelierSettings[field];
 $('#atelier-from').value=atelierSettings.start;
 const targetCountLabel=listening=>{
  $('label[for="atelier-count"]').textContent=listening?'Combien de répliques ?':'Combien de questions ?';
  for(const option of $('#atelier-count').options)option.textContent=option.value+(listening?' répliques':' questions');
 };
 let currentPool;
 const fillList=(kind)=>{
  const detail=$('#atelier-'+kind+'-list');
  if(detail.open&&currentPool)detail.querySelector('.atelier-catalog').innerHTML=atelierCatalog(currentPool[kind]);
 };
 for(const kind of ['vocab','grammar','particles','constructions'])$('#atelier-'+kind+'-list').ontoggle=()=>{if(!$('#atelier-'+kind+'-list .atelier-catalog').children.length)fillList(kind);};
 const setup=$('#atelier-type');
 let generatorLoading=false,generatorError=false;
 $('#generator-level').value=atelierSettings.generatorLevel;
 $('#generator-scope').value=atelierSettings.generatorScope;
 const refresh=()=>{
  const generated=atelierSettings.type==='generated';
  $('#generator-settings').hidden=!generated;
  $('#atelier-scope').closest('.atelier-setting-row').hidden=generated;
  $('#atelier-count').closest('.atelier-setting-row').hidden=generated;
  if(generated){
   $('#atelier-content').hidden=true;
   $('#atelier-description').textContent='Découvrez une phrase composée au hasard, ou gardez sa construction pour essayer une autre variante. Kana, romaji, traduction et explication à la demande ; sans score.';
   const scope={mode:atelierSettings.generatorScope,lesson:atelierSettings.level};
   $('#generator-lesson-row').hidden=scope.mode==='explore';
   $('#generator-scope-help').textContent=scope.mode==='explore'?'Toutes les variantes du groupe, y compris les mots non reliés aux leçons.':'Seules les phrases dont la construction et les mots ont des appuis vérifiés jusqu’à cette leçon sont proposés.';
   const available=generatorCatalog?PhraseGenerator.eligible(generatorCatalog,atelierSettings.generatorLevel,scope).reduce((n,t)=>n+t.variants.length,0):0;
   $('#atelier-start').disabled=!available;
   $('#atelier-pool').textContent=generatorCatalog ? (available?available+' phrases possibles dans ce périmètre':'Aucune phrase disponible à ce stade dans ce groupe. Choisissez une leçon plus avancée ou Tout explorer.') : generatorError?'Chargement impossible. Changez d’activité puis réessayez.':'Chargement des phrases…';
   if(!generatorCatalog&&!generatorLoading&&!generatorError){
    generatorLoading=true;
    PhraseGenerator.load().then(c=>{generatorCatalog=c;}).catch(()=>{generatorError=true;}).finally(()=>{generatorLoading=false;if($('#atelier-type')===setup)refresh();});
   }
   return null;
  }
  generatorError=false;
  const pool=getAtelierPool(),changed=pool!==currentPool;
  currentPool=pool;
  $('#atelier-start-label').hidden=atelierSettings.scope!=='range';
  $('#atelier-level-label').textContent=atelierSettings.scope==='lesson'?'Leçon':'à';
  $('#atelier-level').setAttribute('aria-label',atelierSettings.scope==='lesson'?'Leçon à réviser':'Dernière leçon');
  $('#atelier-description').textContent={listening:'Écoutez une réplique du cours, puis révélez le japonais et la traduction à votre rythme. Kana et romaji accessibles dès le début ; pas de score.',vocab:'Retrouvez le sens du mot, puis révélez la réponse.',grammar:'Reconnaissez les formes des verbes.',constructions:'Complétez des mini-dialogues, transformez, ordonnez ou reliez des phrases. Chaque exercice exige ses passages d’appui dans les leçons choisies.',particles:'Complétez ou comparez les phrases pour choisir la bonne particule.',mixed:'Alternez vocabulaire et formes verbales.'}[atelierSettings.type];
  for(const [kind,label] of [['vocab','mots ou expressions'],['grammar','formes verbales'],['particles','exercices sur les particules'],['constructions','exercices de constructions grammaticales']]){
   $('#atelier-'+kind+'-list summary').textContent=`${pool[kind].length} ${label}`;
   if(changed){
    if(!$('#atelier-'+kind+'-list').open)$('#atelier-'+kind+'-list .atelier-catalog').innerHTML='';
    fillList(kind);
   }
  }
  const listening=atelierSettings.type==='listening';
  $('#atelier-content').hidden=listening;
  targetCountLabel(listening);
  const available=atelierSettings.type==='mixed'?pool.vocab.length+pool.grammar.length:pool[atelierSettings.type].length;
  const count=Math.min(available,atelierSettings.count);
  $('#atelier-pool').textContent=`${available} ${listening?'réplique':'exercice'}${available>1?'s':''} disponible${available>1?'s':''}${available<atelierSettings.count&&available?` · séance de ${count} ${listening?'réplique':'question'}${count>1?'s':''}`:''}`;
  $('#atelier-start').disabled=!available;
  if(pool.invalid)$('#atelier-pool').textContent='La première leçon doit précéder ou être égale à la dernière.';
  else if(!available)$('#atelier-pool').textContent='Aucun exercice disponible avec ces choix. Changez les leçons ou l’activité.';
  return pool;
 };
 for(const field of ['level','scope','type','count'])$('#atelier-'+field).onchange=e=>{
  atelierSettings[field]=['level','count'].includes(field)?Number(e.target.value):e.target.value;
  $('#generator-lesson').value=atelierSettings.level;refresh();
 };
 $('#generator-scope').onchange=e=>{atelierSettings.generatorScope=e.target.value;refresh();};
 $('#generator-lesson').onchange=e=>{atelierSettings.level=Number(e.target.value);$('#atelier-level').value=e.target.value;refresh();};
 $('#generator-level').onchange=e=>{atelierSettings.generatorLevel=e.target.value;refresh();};
 $('#atelier-from').onchange=e=>{atelierSettings.start=Number(e.target.value);refresh();};
 $('#atelier-continue').onclick=focusAtelierWork;
 $('#atelier-start').onclick=()=>{
  const pool=refresh(),config={...atelierSettings};
  if($('#atelier-start').disabled)return;
  const launch=()=>{
   window.closeNavigationCommands?.();stopAudio();
   const generator=config.type==='generated'?PhraseGenerator.create(generatorCatalog,config.generatorLevel,undefined,{mode:config.generatorScope,lesson:config.level}):null;
   atelierSession={generator,generatedCount:generator?1:0,settings:config,questions:generator?[generator.draw()]:AtelierEngine.session(pool,config.type,config.count),index:0,results:[],revealed:false,choice:null,started:false};
   renderAtelierQuestion();focusAtelierWork();
  };
  if(atelierInProgress()&&(atelierSession.started||atelierSession.index>0||atelierSession.revealed))confirmAtelierReplacement(launch);else launch();
 };
 refresh();renderAtelierQuestion();
 if(atelierListReturn && JSON.stringify(atelierSettings)===atelierListReturn.settings){
  $('#atelier-content').open=true;
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
 updateAtelierSessionControls();
 const target=$('#atelier-work'),s=atelierSession;
 target.hidden=!s;
 if(!s){target.innerHTML='';return;}
 if(s.settings.type==='generated'){renderGeneratedQuestion(target,s);return;}
 if(s.index>=s.questions.length&&s.questions[0]?.type==='listening'){
  target.innerHTML=`<h2 tabindex="-1">Séance terminée</h2><p>${s.index} réplique${s.index>1?'s':''} parcourue${s.index>1?'s':''}.</p><p>Cette séance d’écoute n’attribue aucun score. Vous pouvez reprendre les passages dans leur dialogue.</p><p>${s.questions.map(q=>sourceLink(q.source)).join(' · ')}</p><button id="atelier-again">Nouvelle séance</button>`;
  $('#atelier-again').onclick=()=>$('#atelier-start').click();return;
 }
 if(s.index>=s.questions.length){
  const good=s.results.filter(r=>r.good).length,hasVocab=s.questions.some(q=>q.type==='vocab');
  target.innerHTML=`<h2>Séance terminée</h2><p>${good} réponse${good>1?'s':''} réussie${good>1?'s':''}${hasVocab?` ou déclarée${good>1?'s':''} connue${good>1?'s':''}`:''} sur ${s.questions.length}.</p><p class="muted">${hasVocab?'Le vocabulaire est autoévalué ; ce résultat est un repère d’entraînement.':'Ce résultat est un repère d’entraînement.'}</p><h3>À reprendre</h3>${s.results.some(r=>!r.good)?s.results.filter(r=>!r.good).map(r=>`<p>${sourceLink(r.q.source)} · ${esc(r.q.type==='vocab'?r.q.word.fr:['particles','constructions'].includes(r.q.type)?r.q.title:r.q.part.form)}</p>`).join(''):'<p>Aucun élément marqué à revoir dans cette séance.</p>'}<button id="atelier-again">Nouvelle séance</button>`;
  $('#atelier-again').onclick=()=>$('#atelier-start').click();return;
 }
 if(s.questions[s.index].type==='listening'){renderListeningQuestion(target,s);return;}
 if(s.questions[s.index].type==='constructions'){renderConstructionQuestion(target,s);return;}
 if(s.questions[s.index].type==='particles'){renderParticleQuestion(target,s);return;}
 const q=s.questions[s.index],isVocab=q.type==='vocab',word=isVocab?{jp:q.word.mot,kana:q.word.kana,romaji:q.word.romaji}:q.part;
 target.innerHTML=`<p class="eyebrow">${isVocab?'Vocabulaire':'Grammaire'} · ${s.index+1} / ${s.questions.length}</p><h2>${isVocab?'Quel est le sens de ce mot ou de cette expression ?':'Quelle est la forme de ce verbe ?'}</h2>${block(word,{audio:false,fr:false})}
 ${isVocab||q.options.length<2?`<button id="atelier-reveal">${s.revealed?'Réponse affichée':'Voir la réponse'}</button>`:`<div class="atelier-options">${AtelierEngine.shuffle(q.options).map(option=>`<button data-form="${esc(option)}" ${s.revealed?'disabled':''}>${esc(option)}</button>`).join('')}</div>`}
 <div id="atelier-feedback" role="status"></div>`;
 const reveal=(choice=null)=>{
  if(s.revealed)return;s.revealed=true;s.choice=choice;
  const answer=isVocab?q.word.fr:q.part.form;
  const explanation=isVocab?'Le sens du mot est distinct de la traduction de la réplique. Comparez avec son emploi ci-dessous.':q.part.explanation;
  $('#atelier-feedback').innerHTML=`<div class="feedback${choice && choice!==answer ? ' feedback-error' : ''}"><h3>${choice?(choice===answer?'Bonne réponse !':'À reprendre'):'La réponse'}</h3><p>${esc(answer)}</p><p>${esc(explanation)}</p><details><summary>Revoir la phrase de la leçon</summary>${block({source:q.source,jp:q.row.Japonais,kana:q.row.Kana,romaji:q.row.Romaji,fr:q.row.Français},{audio:false})}${sourceLink(q.source)}</details></div><div class="atelier-options">${choice?'<button id="atelier-next">Continuer</button>':'<button id="atelier-known">Je savais</button><button id="atelier-review">À revoir</button>'}</div>`;
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
  if(['particles','constructions'].includes(q.type))return `<li><p>${esc(q.activity+' · '+q.title)}</p>${q.sources.map(sourceLink).join(' · ')}</li>`;
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

function renderGeneratedQuestion(target,s){
 if(s.ended){
  target.innerHTML=`<h2 tabindex="-1">Exploration terminée</h2><p>${s.generatedCount} phrases parcourues, sans score.</p><button id="atelier-again">Nouvelle exploration</button>`;
  $('#atelier-again').onclick=()=>$('#atelier-start').click();return;
 }
 const q=s.questions[0];
 if(!s.generatedReading)s.generatedReading={kana:true,romaji:false,fr:false,explanation:false};
 const reading=s.generatedReading;
 const same=q.jp.replace(/\s/g,'')===q.kana.replace(/\s/g,'');
 target.innerHTML=`<p class="eyebrow">Phrase composée · ${s.settings.generatorScope==='explore'?'Tout explorer':'Jusqu’à la leçon '+s.settings.level} · ${s.generatedCount}</p><h2 tabindex="-1">${esc(q.title)}</h2><p>${esc(q.context)}</p>
 <div class="atelier-options">${[['kana','les kana'],['romaji','le romaji'],['fr','la traduction']].map(([key,label])=>`<button data-generated-reading="${key}" aria-expanded="${reading[key]}" aria-controls="generated-${key}">${reading[key]?'Masquer':'Afficher'} ${label}</button>`).join('')}</div>
 <div id="generated-text">
 <p id="generated-kana" class="listening-kana" lang="ja" ${reading.kana?'':'hidden'}><button class="generated-kana-audio" data-speak="${esc(q.jp)}" aria-label="Écouter la phrase">${esc(q.kana)} ♪</button></p>
 <p class="listening-japanese" lang="ja">${same&&reading.kana?'<span class="kana-idem" lang="fr">---</span>':jp(q.jp)}</p>
 <p id="generated-romaji" class="listening-romaji" ${reading.romaji?'':'hidden'}>${esc(Romaji.display(q.romaji))}</p>
 <p id="generated-fr" ${reading.fr?'':'hidden'}>${esc(q.fr)}</p></div>
 <button data-speak="${esc(q.jp)}">▶ Écouter</button><p class="muted">Écoute par synthèse vocale. Les aides sont indépendantes du menu œil.</p>
 <details id="generated-explanation" ${reading.explanation?'open':''}><summary>Comprendre la construction</summary><ul>${q.segments.map(part=>`<li><span lang="ja">${esc(part.jp)}</span> — ${esc(part.role)}</li>`).join('')}</ul>${[...new Set(q.notes)].map(note=>`<p>${esc(note)}</p>`).join('')}<p class="muted">La traduction est une proposition adaptée à cette situation.</p>${q.sourceRefs.length?`<p>Appuis dans le cours (la phrase ci-dessus est composée) : ${q.sourceRefs.map(sourceLink).join(' · ')}</p>`:''}${q.grammarCards.length?`<p>Fiches utiles : ${q.grammarCards.map(id=>`<a href="#grammaire/${id}">${esc(grammar.find(f=>f.id===id)?.titre||id)}</a>`).join(' · ')}</p>`:''}</details>
 <div class="atelier-options"><button id="generated-surprise">Surprise !</button><button id="generated-same">Encore avec cette construction</button><button id="generated-end">Terminer</button></div>
 <p id="generated-status" role="status"></p><button id="generated-reset" hidden>Recommencer les variantes</button>`;
 target.querySelectorAll('[data-generated-reading]').forEach(b=>b.onclick=()=>{
  const key=b.dataset.generatedReading;reading[key]=!reading[key];renderGeneratedQuestion(target,s);
  target.querySelector(`[data-generated-reading="${key}"]`).focus({preventScroll:true});
 });
 $('#generated-explanation').ontoggle=e=>{reading.explanation=e.target.open;};
 const draw=sameConstruction=>{
  const next=s.generator.draw(sameConstruction);stopAudio();
  if(!next){
   $('#generated-status').textContent=sameConstruction?'Les variantes de cette construction ont déjà été proposées récemment. Choisissez une surprise ou recommencez les variantes.':'Toutes les variantes disponibles ont été proposées récemment.';
   $('#generated-reset').hidden=false;
   $('#generated-reset').onclick=()=>{s.generator.resetHistory();draw(sameConstruction);};return;
  }
  s.questions=[next];s.generatedCount++;s.generatedReading={...reading,fr:false,explanation:false};
  renderAtelierQuestion();target.querySelector('h2').focus({preventScroll:true});
 };
 $('#generated-surprise').onclick=()=>draw(false);
 $('#generated-same').onclick=()=>draw(true);
 $('#generated-end').onclick=()=>{stopAudio();s.ended=true;renderAtelierQuestion();target.querySelector('h2').focus({preventScroll:true});};
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
  $('#atelier-feedback').innerHTML=`<div class="feedback${good ? '' : ' feedback-error'}"><h3>${good?'Bonne réponse !':'À reprendre'}</h3><p><strong>${esc(labels)}</strong></p><p>${esc(q.explanation)}</p>
  ${q.accepted.length>1?'<p>Ces deux réponses sont acceptées dans cette phrase.</p>':''}
  <details><summary>Revoir les phrases sources</summary>${q.sources.map(id=>{const row=lessons.find(r=>r.Leçon+'-'+r.Ligne===id);return block({source:id,jp:row.Japonais,kana:row.Kana,romaji:row.Romaji,fr:row.Français},{audio:false})+sourceLink(id);}).join('')}</details>
  ${q.grammarCards?.length?`<p>Comprendre la construction : ${q.grammarCards.map(id=>`<a href="#grammaire/${id}">${esc(grammar.find(f=>f.id===id)?.titre||id)}</a>`).join(' · ')}</p>`:''}
  <p><a href="${esc(q.reference)}" target="_blank" rel="noopener">Référence : Fondation du Japon</a></p></div><button id="atelier-next">Continuer</button>`;
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

function renderConstructionQuestion(target,s){
 const q=s.questions[s.index],ordering=q.activity==='Ordonner';
 if(!s.constructionState||s.constructionState.id!==q.id)s.constructionState={id:q.id,items:AtelierEngine.shuffle(ordering?q.groups:q.options),selected:[]};
 const state=s.constructionState;
 const textBlock=(item,showFrench)=>block(item,{audio:false,fr:showFrench});
 const card=(item,action)=>`<div class="construction-choice">${textBlock(item,s.revealed)}${action}</div>`;
 target.innerHTML=`<p class="eyebrow">Constructions grammaticales · ${esc(q.activity)} · ${s.index+1} / ${s.questions.length}</p><h2>${esc(q.prompt)}</h2><p class="muted">${esc(q.origin)}</p>
 ${q.given?`<div class="construction-given"><h3>${ordering?'Phrase':q.activity==='Dialoguer'?'Votre interlocuteur':q.activity==='Transformer'?'Phrase de départ':'Début de la phrase'}</h3>${block(q.given,{audio:false})}</div>`:''}
 ${ordering?`<p class="muted">Ajoute les groupes dans l’ordre, avec le verbe à la fin. Tu peux retirer un groupe ou recommencer avant de vérifier.</p><h3>Ta phrase</h3><ol id="construction-selected" class="construction-selected" aria-label="Groupes dans l’ordre choisi">${state.selected.map((id,i)=>`<li>${card(q.groups.find(g=>g.id===id),`<button data-construction-remove="${i}" ${s.revealed?'disabled':''} aria-label="Retirer le groupe ${i+1}">Retirer</button>`)}</li>`).join('')}</ol>${state.selected.length?'':'<p class="muted">Choisis le premier groupe ci-dessous.</p>'}<h3>Groupes disponibles</h3><div class="construction-options">${state.items.map(item=>card(item,`<button data-construction-add="${item.id}" ${s.revealed||state.selected.includes(item.id)?'disabled':''}>${state.selected.includes(item.id)?'Ajouté':'Ajouter'}</button>`)).join('')}</div><div class="atelier-options"><button id="construction-check" ${s.revealed||state.selected.length!==q.groups.length?'disabled':''}>Vérifier ma phrase</button><button id="construction-reset" ${s.revealed||!state.selected.length?'disabled':''}>Recommencer</button></div>`:
 `<div class="construction-options">${state.items.map((item,i)=>card(item,`<button data-construction-choice="${item.id}" aria-label="Choisir la réponse ${i+1}" aria-pressed="${s.choice===item.id}" ${s.revealed?'disabled':''}>Choisir</button>`)).join('')}</div>`}
 <div id="atelier-feedback" role="status"></div>`;
 const refresh=(selector)=>{renderConstructionQuestion(target,s);if(selector)target.querySelector(selector)?.focus({preventScroll:true});};
 const submit=answer=>{stopAudio();s.choice=answer;s.revealed=true;refresh('#atelier-feedback h3');};
 target.querySelectorAll('[data-construction-choice]').forEach(b=>b.onclick=()=>{if(!s.revealed)submit(b.dataset.constructionChoice);});
 target.querySelectorAll('[data-construction-add]').forEach(b=>b.onclick=()=>{
  stopAudio();if(s.revealed||state.selected.includes(b.dataset.constructionAdd))return;
  state.selected.push(b.dataset.constructionAdd);refresh(state.selected.length===q.groups.length?'#construction-check':'[data-construction-add]:not(:disabled)');
 });
 target.querySelectorAll('[data-construction-remove]').forEach(b=>b.onclick=()=>{
  stopAudio();if(s.revealed)return;const [id]=state.selected.splice(Number(b.dataset.constructionRemove),1);refresh(`[data-construction-add="${id}"]`);
 });
 if(ordering){
  $('#construction-reset').onclick=()=>{if(s.revealed)return;stopAudio();state.selected=[];refresh('[data-construction-add]');};
  $('#construction-check').onclick=()=>{if(!s.revealed&&state.selected.length===q.groups.length)submit([...state.selected]);};
 }
 if(s.revealed){
  const good=Constructions.isCorrect(q,s.choice);
  const answers=ordering?q.acceptedOrders.map(order=>Constructions.sentence(q,order)):q.options.filter(o=>q.accepted.includes(o.id));
  $('#atelier-feedback').innerHTML=`<div class="feedback${good?'':' feedback-error'}"><h3 tabindex="-1">${good?'Bonne réponse !':'À reprendre'}</h3><p>${esc(q.explanation)}</p><h4>${ordering?(answers.length>1?'Ces deux ordres sont acceptés':'Un ordre attendu'):'La réponse attendue'}</h4>${answers.map(t=>textBlock(t,true)).join('')}
  <p>Revoir la fiche : ${q.grammarCards.map(id=>`<a href="#grammaire/${id}">${esc(grammar.find(f=>f.id===id)?.titre||id)}</a>`).join(' · ')}</p>
  <details><summary>Retrouver les constructions dans le cours</summary><p class="muted">Ces passages servent d’appui. Les phrases de l’exercice ont été créées pour l’entraînement.</p>${q.sources.map(id=>{const r=lessons.find(r=>r.Leçon+'-'+r.Ligne===id);return sourceLink(id)+block({source:id,jp:r.Japonais,kana:r.Kana,romaji:r.Romaji,fr:r.Français},{audio:false});}).join('')}</details></div><button id="atelier-next">Continuer</button>`;
  $('#atelier-next').onclick=()=>{stopAudio();s.results.push({q,good});s.index++;s.revealed=false;s.choice=null;s.constructionState=null;renderAtelierQuestion();$('#atelier-work h2')?.setAttribute('tabindex','-1');$('#atelier-work h2')?.focus({preventScroll:true});};
 }
}


function renderListeningQuestion(target,s){
 const q=s.questions[s.index],r=q.row;
 if(s.listeningState?.id!==q.id)s.listeningState={id:q.id,jp:false,kana:false,romaji:false,fr:false};
 const state=s.listeningState;
 const labels={jp:'le japonais',kana:'les kana',romaji:'le romaji',fr:'la traduction'};
 const same=String(r.Japonais).replace(/\s/g,'')===String(r.Kana).replace(/\s/g,'');
 target.innerHTML=`<p class="eyebrow">Écouter et comprendre · ${s.index+1} / ${s.questions.length}</p><h2 tabindex="-1">Écoutez et cherchez le sens.</h2>
 <p>Réécoutez autant que nécessaire, puis répétez à voix haute. Les aides ci-dessous se révèlent séparément, indépendamment du menu œil.</p>
 <div class="atelier-options"><button id="listening-play">▶ Écouter / réécouter</button><button id="listening-pause" disabled>Ⅱ Pause</button><button id="listening-stop" disabled>■ Arrêter</button></div>
 <div class="atelier-options">${Object.entries(labels).map(([key,label])=>`<button data-listening-reveal="${key}" aria-expanded="${state[key]}" aria-controls="listening-text">${state[key]?'Masquer':'Afficher'} ${label}</button>`).join('')}</div>
 <div id="listening-text" aria-live="polite">
 ${state.kana?`<p class="listening-kana" lang="ja">${esc(r.Kana)}</p>`:''}
 ${state.jp?`<p class="listening-japanese" lang="ja">${same&&state.kana?'<span class="kana-idem" lang="fr" title="Identique au texte kana">---</span>':jp(r.Japonais)}</p>`:''}
 ${state.romaji?`<p class="listening-romaji">${esc(Romaji.display(r.Romaji))}</p>`:''}
 ${state.fr?`<p>${esc(r.Français)}</p>`:''}
 ${!state.jp&&!state.kana&&!state.romaji&&!state.fr?'<p class="muted">Le texte est masqué. Vous pouvez afficher une aide à tout moment.</p>':''}</div>
 <p class="muted">Une réplique peut dépendre du dialogue. Retrouver son contexte : ${sourceLink(q.source)}</p>
 <button id="atelier-next">Réplique suivante →</button>`;
 $('#listening-play').onclick=()=>speak([{text:r.Kana,ref:q.source}]);
 $('#listening-stop').onclick=()=>stopAudio('Lecture arrêtée.');
 $('#listening-pause').onclick=toggleAudioPause;
 target.querySelectorAll('[data-listening-reveal]').forEach(b=>b.onclick=()=>{
  const key=b.dataset.listeningReveal;state[key]=!state[key];renderListeningQuestion(target,s);
  target.querySelector(`[data-listening-reveal="${key}"]`).focus({preventScroll:true});
 });
 $('#atelier-next').onclick=()=>{stopAudio();s.index++;s.listeningState=null;renderAtelierQuestion();target.querySelector('h2')?.focus({preventScroll:true});};
 updatePauseButton();
}
