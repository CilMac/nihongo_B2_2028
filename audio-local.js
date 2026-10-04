'use strict';
let localAudioFiles=null,selectedAudioFiles=null,recordedPlayer=null,audioPlayback=null;
let selectedExtraFiles=null,localExtraFiles=null;
const failedRecordings=new Set();
const localAudioHost=['localhost','127.0.0.1','[::1]'].includes(location.hostname);
function updateAudioMode(){
 const mode=document.getElementById('audio-mode');
 document.getElementById('audio-mode-setting').hidden=false;
 const available=selectedAudioFiles||localAudioFiles;
 mode.querySelector('[value="recorded"]').disabled=!available;
 mode.value=available&&settings.audioMode==='recorded'?'recorded':'synthetic';
 document.getElementById('audio-mode-note').textContent=selectedAudioFiles
  ?`${Object.keys(selectedAudioFiles).length} enregistrements disponibles. Aucun fichier envoyé. À sélectionner de nouveau après rechargement.`
  :localAudioFiles?'Enregistrements du serveur local disponibles. Les mots isolés restent synthétiques.'
  :'Choisissez votre dossier fichiers_audio_complet. Les fichiers restent sur votre appareil. Sans dossier, la synthèse est utilisée.';
}
function chooseAudioFolder(files){
 files=Array.from(files);
 const extras={},found={},duplicates=new Set(),known=new Set(lessons.map(r=>r.Leçon+'-'+r.Ligne));
 for(const file of files){
  const match=/(?:^|\/)L(\d+)-[^/]+\/(S\d+)(?:-TITLE)?\.mp3$/i.exec(file.webkitRelativePath||'');
  if(!match){const extra=/(?:^|\/)L(\d+)-[^/]+\/(T\d+(?:-(?:TRANSLATE|DICTATION))?)\.mp3$/i.exec(file.webkitRelativePath||'');if(extra&&lessonIds.includes('N'+Number(extra[1]))){const id=`N${Number(extra[1])}-${extra[2].toUpperCase()}`;if(extras[id])duplicates.add(id);else extras[id]=file;}continue;}
  const id=`N${Number(match[1])}-${match[2].toUpperCase()}`;
  if(!known.has(id))continue;
  if(found[id])duplicates.add(id);else found[id]=file;
 }
 showAudioSelectionDiagnostic(files,found,extras,duplicates);
 if(!Object.keys(found).length||duplicates.size){
  document.getElementById('audio-mode-note').textContent=duplicates.size?'Plusieurs fichiers correspondent à une même phrase. Sélectionnez un seul dossier fichiers_audio_complet.':'Aucun audio de phrase reconnu. Choisissez le dossier fichiers_audio_complet contenant les dossiers L001…, L002…';
  return;
 }
 stopAudio();selectedAudioFiles=found;selectedExtraFiles=extras;failedRecordings.clear();settings.audioMode='recorded';save();updateAudioMode();renderExtraAudio();
}
function releaseRecordingURL(player){if(player?._objectURL){URL.revokeObjectURL(player._objectURL);player._objectURL=null;}}
async function initLocalAudio(){
 updateAudioMode();if(!localAudioHost)return;
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),3000);
 try{
  const response=await fetch('fichiers_audio_complet/index.json',{signal:controller.signal,cache:'no-cache'});
  if(!response.ok)throw new Error('Index absent');
  const index=await response.json();
  if(index.version!==1||!index.files||typeof index.files!=='object')throw new Error('Index invalide');
  const entries=Object.entries(index.files).filter(([id,file])=>/^N\d+-S\d+$/.test(id)&&typeof file==='string'&&/^L\d+-[^/]+\/S\d+(?:-TITLE)?\.mp3$/.test(file)&&!file.includes('..'));
  if(entries.length){localAudioFiles=Object.fromEntries(entries);localExtraFiles=Object.fromEntries(Object.entries(index.extras||{}).filter(([id,file])=>/^N\d+-T\d+(?:-(?:TRANSLATE|DICTATION))?$/.test(id)&&typeof file==='string'&&/^L\d+-[^/]+\/T\d+(?:-(?:TRANSLATE|DICTATION))?\.mp3$/.test(file)&&!file.includes('..')));}
 }catch{localAudioFiles=null;}finally{clearTimeout(timer);updateAudioMode();renderExtraAudio();}
}
// Une référence seule ne suffit pas : les exercices à trous et les fragments restent synthétiques.
function sentenceAudioRef(t){
 const ref=String(t.source||'').match(/\bN\d+-S\d+\b/)?.[0];if(!ref)return '';
 const row=lessons.find(r=>r.Leçon+'-'+r.Ligne===ref);if(!row)return '';
 const clean=s=>String(s||'').normalize('NFC').replace(/\s/g,'');
 return clean(t.jp)===clean(row.Japonais)&&clean(t.audioKana||t.kana)===clean(row.Kana)?ref:'';
}
function updatePauseButton(){
 const button=document.getElementById('pause-audio');if(!button)return;
 button.hidden=route().tab!=='lecons';button.disabled=!audioPlayback;
 const paused=!!audioPlayback?.paused;
 button.setAttribute('aria-pressed',String(paused));
 button.setAttribute('aria-label',paused?'Reprendre l’écoute':'Mettre l’écoute en pause');
 button.title=paused?'Reprendre l’écoute':'Mettre l’écoute en pause';
 const listeningPause=document.getElementById('listening-pause');
 if(listeningPause){listeningPause.disabled=!audioPlayback;listeningPause.textContent=paused?'▶ Reprendre':'Ⅱ Pause';listeningPause.setAttribute('aria-pressed',String(paused));}
 const listeningStop=document.getElementById('listening-stop');if(listeningStop)listeningStop.disabled=!audioPlayback;
 const extraButton=document.getElementById('extra-pause');if(extraButton){extraButton.disabled=!audioPlayback?.extra;extraButton.textContent=paused?'▶ Reprendre':'Ⅱ Pause';}
 const seek=document.getElementById('extra-seek');if(seek)seek.disabled=!audioPlayback?.extra||!recordedPlayer;
 button.querySelector('.audio-slash').style.display=paused?'':'none';
}
function toggleAudioPause(){
 if(!audioPlayback)return;
 if(audioPlayback.paused)audioPlayback.resume();else audioPlayback.pause();
 updatePauseButton();
}
function stopAudio(message=''){
 audioRun++;audioPlayback=null;clearTimeout(audioTimer);speech?.cancel();speech?.resume?.();currentUtterance=null;
 if(recordedPlayer){const player=recordedPlayer;recordedPlayer=null;player.onended=null;player.onerror=null;player.pause();player.removeAttribute('src');player.load();releaseRecordingURL(player);}
 $('#stop-audio').disabled=true;$('#audio-status').textContent=message;updatePauseButton();
 document.querySelectorAll('.speaking').forEach(x=>x.classList.remove('speaking'));
}
function speak(items){
 stopAudio();const run=audioRun;let index=0;
 $('#stop-audio').disabled=false;
 const active=()=>run===audioRun;
 let timerTask=null,timerDue=0,timerRemaining=0,deferred=null,resumeRecorded=null,savedStatus='';
 const schedule=(task,delay)=>{
  clearTimeout(audioTimer);timerTask=task;timerRemaining=delay;timerDue=performance.now()+delay;
  if(!audioPlayback.paused)audioTimer=setTimeout(()=>{timerTask=null;if(active())task();},delay);
 };
 const clearTimer=()=>{clearTimeout(audioTimer);timerTask=null;};
 audioPlayback={extra:!!items[0]?.extra,paused:false,pause(){
  this.paused=true;savedStatus=$('#audio-status').textContent;
  if(timerTask){timerRemaining=Math.max(0,timerDue-performance.now());clearTimeout(audioTimer);}
  if(recordedPlayer)recordedPlayer.pause();else if(currentUtterance)speech?.pause();
  $('#audio-status').textContent='Écoute en pause.';
 },resume(){
  this.paused=false;$('#audio-status').textContent=savedStatus;
  if(deferred){const task=deferred;deferred=null;task();}
  else {if(recordedPlayer)resumeRecorded?.();else if(currentUtterance)speech?.resume();
   if(timerTask)schedule(timerTask,timerRemaining);}
 }};
 updatePauseButton();
 const advance=()=>{currentUtterance=null;if(active())schedule(next,index<items.length?Number(settings.gap):0);};
 function synthetic(item,fallback=false){
  if(!active())return;
  if(audioPlayback.paused){deferred=()=>synthetic(item,fallback);return;}
  if(item.extra){const seek=document.getElementById('extra-seek');if(seek){seek.disabled=true;seek.value=0;}}
  if(!item.text){stopAudio('Le texte nécessaire à la synthèse est indisponible.');return;}
  if(!speech){stopAudio('La synthèse vocale est indisponible pour cette lecture.');return;}
  const u=new SpeechSynthesisUtterance(item.text);currentUtterance=u;u.lang='ja-JP';u.rate=Number(settings.rate);
  u.voice=voices.find(v=>v.voiceURI===settings.voice)||voices.find(v=>/kyoko|hana|haruka|mizuki|female/i.test(v.name))||voices[0]||null;
  $('#audio-status').textContent=`Écoute ${index} / ${items.length} · ${fallback?'enregistrement indisponible · ':''}synthèse · ${u.voice?.name||'voix du navigateur'}`;
  u.onend=advance;u.onerror=e=>{if(active()&&e.error!=='canceled'&&e.error!=='interrupted')stopAudio('Lecture impossible. Essayez une autre voix japonaise dans les réglages.');};
  speech.speak(u);
 }
 async function next(){
  if(!active())return;
  if(audioPlayback.paused){deferred=next;return;}
  if(index>=items.length){stopAudio('Écoute terminée.');return;}
  const raw=items[index++],item=typeof raw==='string'?{text:raw}:raw;
  if(item.extra){selectComplement(item.key);document.getElementById('extra-current').textContent=item.label;const seek=document.getElementById('extra-seek');if(seek){seek.disabled=true;seek.value=0;}}
  let file=settings.audioMode==='recorded'&&(item.extra?item.file:(selectedAudioFiles?selectedAudioFiles[item.ref]:(localAudioHost&&localAudioFiles?.[item.ref])));
  if(!file||failedRecordings.has(file)){synthetic(item,!!file);return;}
  const recordingKey=file;
  if(item.extra&&typeof file==='string'){try{const response=await fetch('fichiers_audio_complet/'+file.split('/').map(encodeURIComponent).join('/'));if(!response.ok)throw new Error();file=await response.blob();if(!active())return;}catch{if(active()){failedRecordings.add(recordingKey);synthetic(item,true);}return;}}
  const player=new Audio();recordedPlayer=player;let settled=false;
  player.preload='none';player.preservesPitch=true;
  const release=()=>{clearTimer();resumeRecorded=null;player.onended=null;player.onerror=null;releaseRecordingURL(player);if(recordedPlayer===player)recordedPlayer=null;};
  const fallback=()=>{if(settled||!active())return;settled=true;release();player.pause();player.removeAttribute('src');player.load();failedRecordings.add(recordingKey);synthetic(item,true);};
  player.onended=()=>{if(settled||!active())return;settled=true;release();advance();};player.onerror=fallback;
  if(file instanceof Blob){player._objectURL=URL.createObjectURL(file);player.src=player._objectURL;}
  else player.src='fichiers_audio_complet/'+file.split('/').map(encodeURIComponent).join('/');
  if(item.extra){document.getElementById('extra-current').textContent=item.label;player.onloadedmetadata=player.ontimeupdate=()=>{const seek=document.getElementById('extra-seek');if(seek&&Number.isFinite(player.duration)){seek.max=player.duration;seek.value=player.currentTime;seek.disabled=false;}};}
  player.defaultPlaybackRate=Number(settings.rate);player.playbackRate=Number(settings.rate);
  $('#audio-status').textContent=`Écoute ${index} / ${items.length} · enregistrement réel`;
  schedule(fallback,8000);
  resumeRecorded=()=>{
   try{Promise.resolve(player.play()).then(()=>{if(active()&&!settled){clearTimer();if(audioPlayback.paused)player.pause();}}).catch(error=>{if(active()&&!(audioPlayback.paused&&error?.name==='AbortError'))fallback();});}catch{fallback();}
  };
  resumeRecorded();
 }
 next();
}

document.getElementById('pause-audio').addEventListener('click',toggleAudioPause);

document.getElementById('choose-audio-folder').onclick=()=>{document.getElementById('audio-diagnostic-report').textContent='Sélecteur demandé. En attente du retour du navigateur… Si ce message reste affiché après fermeture, aucun événement de sélection ou d’annulation n’a été reçu.';document.getElementById('audio-folder-input').click();};
document.getElementById('audio-folder-input').onchange=e=>{chooseAudioFolder(e.target.files||[]);e.target.value='';};
document.getElementById('audio-folder-input').addEventListener('cancel',()=>{document.getElementById('audio-diagnostic-report').textContent='Sélecteur fermé sans nouvelle sélection transmise (annulation ou sélection inchangée). Le choix audio précédent est conservé.';});

// Le catalogue vient du texte ; les MP3 sont une source de lecture facultative.
function renderExtraAudio(){
 const host=document.getElementById('extra-audio');if(!host)return;
 const source=selectedExtraFiles||localExtraFiles;
 const id=settings.lesson;
 if(!complementRows&&!complementError)loadComplements();
 const catalog=new Map(Object.entries(source||{}).filter(([key])=>key.startsWith(id+'-')));
 for(const [key,row] of complementRows||[]){if(row.Leçon!==id)continue;if(![...catalog.keys()].some(ref=>complementId(ref)===key))catalog.set(key,null);}
 const entries=[...catalog].sort(([a],[b])=>a.localeCompare(b,undefined,{numeric:true}));
 if(complementRows&&!entries.length){host.innerHTML='';return;}
 const opened=host.querySelector('details')?.open;
 const groups=[['Traduction',entries.filter(([key])=>Number(/-T(\d+)/.exec(key)[1])<200)],['Dictée',entries.filter(([key])=>Number(/-T(\d+)/.exec(key)[1])>=200)]];
 host.innerHTML=`<details class="panel extra-listening" ${opened?'open':''}><summary>Écoutes complémentaires</summary>${!entries.length?(complementError?'<p>Les écoutes complémentaires n’ont pas pu être chargées. Actualisez la page pour réessayer.</p>':'<p>Chargement des écoutes complémentaires…</p>'):`<p class="muted">Écouter, répéter ou essayer de traduire. Pour la dictée, vous pouvez écrire sur papier. Révélez le texte quand vous le souhaitez.</p>${groups.filter(([,items])=>items.length).map(([title,items])=>`<section><h3>${title}</h3><div class="extra-tracks">${items.map(([key])=>`<button data-extra-track="${key}">${Number(/-T(\d+)/.exec(key)[1])%100===0?'▶ Consigne':'▶ '+Number(/-T(\d+)/.exec(key)[1])%100}</button>`).join('')}</div><button data-extra-group="${title}">▶ Tout écouter avec une pause</button></section>`).join('')}<div id="extra-text"></div><div class="extra-controls"><span id="extra-current" aria-live="polite">Choisissez une piste.</span><div><button id="extra-pause" disabled>Ⅱ Pause</button> <button id="extra-stop">■ Arrêter</button></div><label>Position dans la piste <input id="extra-seek" type="range" min="0" max="1" step="0.1" value="0" disabled></label><label>Vitesse <select id="extra-rate">${[.5,.65,.8,.86,1,1.2].map(rate=>`<option value="${rate}">${rate} ×</option>`).join('')}</select></label><p class="muted">La pause entre les pistes suit les réglages des leçons.</p></div>`}</details>`;
 mountComplementText();
 const play=items=>speak(items.map(([key])=>complementAudioItem(key)));
 host.querySelectorAll('[data-extra-track]').forEach(b=>b.onclick=()=>play(entries.filter(([key])=>key===b.dataset.extraTrack)));
 host.querySelectorAll('[data-extra-group]').forEach(b=>b.onclick=()=>play(groups.find(([title])=>title===b.dataset.extraGroup)[1]));
 const rate=host.querySelector('#extra-rate');if(rate){if(![...rate.options].some(o=>Number(o.value)===Number(settings.rate)))rate.add(new Option(settings.rate+' ×',settings.rate));rate.value=settings.rate;rate.onchange=()=>{settings.rate=Number(rate.value);if(recordedPlayer)recordedPlayer.playbackRate=settings.rate;applySettings();save();};}
 host.querySelector('#extra-pause')?.addEventListener('click',toggleAudioPause);
 host.querySelector('#extra-stop')?.addEventListener('click',()=>stopAudio('Lecture arrêtée.'));
 host.querySelector('#extra-seek')?.addEventListener('input',e=>{if(recordedPlayer&&audioPlayback?.extra)recordedPlayer.currentTime=Number(e.target.value);});
}

function showAudioSelectionDiagnostic(files,found,extras,duplicates){
 const mp3=files.filter(file=>/\.mp3$/i.test(file.name));
 const paths=files.filter(file=>!!file.webkitRelativePath);
 const valid=Object.keys(found).length>0&&!duplicates.size;
 let result=valid?'Sélection acceptée : enregistrements réels activés.':duplicates.size?'Sélection refusée : références en double.':!files.length?'Le navigateur a transmis une liste vide.':!mp3.length?'Aucun fichier portant l’extension .mp3 reçu.':!paths.length?'MP3 reçus sans chemin de dossier : impossible de retrouver leur leçon.':'Aucune phrase reconnue : les chemins ne correspondent pas aux leçons attendues.';
 const sample=(mp3.length?mp3:files).slice(0,3).map((file,i)=>`Exemple ${i+1}
Nom : ${file.name}
Chemin relatif : ${file.webkitRelativePath||'(absent)'}
Taille : ${file.size} octets
Type : ${file.type||'(non fourni)'}`);
 document.getElementById('audio-diagnostic-report').textContent=[
  `Fichiers reçus : ${files.length}`,`MP3 reçus : ${mp3.length}`,`Fichiers avec chemin relatif : ${paths.length}`,`Fichiers de taille nulle : ${files.filter(file=>file.size===0).length}`,
  `Phrases reconnues : ${Object.keys(found).length}`,`Compléments reconnus : ${Object.keys(extras).length}`,`Références en double : ${duplicates.size}`,'',result,'',...sample,
  '', 'Exemple : un fichier S01.mp3 dans un dossier de leçon commençant par L001',
  'Ce diagnostic examine les noms et chemins ; il ne confirme pas encore que le contenu audio peut être lu.'
 ].join('\n');
 if(!valid)document.getElementById('audio-diagnostic').open=true;
}
