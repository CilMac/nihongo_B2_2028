'use strict';
let localAudioFiles=null,recordedPlayer=null,audioPlayback=null;
const failedRecordings=new Set();
const localAudioHost=['localhost','127.0.0.1','[::1]'].includes(location.hostname);
function updateAudioMode(){
 const mode=document.getElementById('audio-mode');
 document.getElementById('audio-mode-setting').hidden=!localAudioHost;
 mode.querySelector('[value="recorded"]').disabled=!localAudioFiles;
 mode.value=localAudioFiles&&settings.audioMode==='recorded'?'recorded':'synthetic';
 document.getElementById('audio-mode-note').textContent=localAudioFiles?'Les mots isolés et les phrases sans enregistrement utilisent la synthèse.':'Enregistrements locaux indisponibles : lecture par synthèse.';
}
async function initLocalAudio(){
 updateAudioMode();if(!localAudioHost)return;
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),3000);
 try{
  const response=await fetch('fichiers_audio_phrases/index.json',{signal:controller.signal,cache:'no-cache'});
  if(!response.ok)throw new Error('Index absent');
  const index=await response.json();
  if(index.version!==1||!index.files||typeof index.files!=='object')throw new Error('Index invalide');
  const entries=Object.entries(index.files).filter(([id,file])=>/^N\d+-S\d+$/.test(id)&&typeof file==='string'&&/^L\d+-[^/]+\/S\d+(?:-TITLE)?\.mp3$/.test(file)&&!file.includes('..'));
  if(entries.length)localAudioFiles=Object.fromEntries(entries);
 }catch{localAudioFiles=null;}finally{clearTimeout(timer);updateAudioMode();}
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
 button.querySelector('.audio-slash').style.display=paused?'':'none';
}
function toggleAudioPause(){
 if(!audioPlayback)return;
 if(audioPlayback.paused)audioPlayback.resume();else audioPlayback.pause();
 updatePauseButton();
}
function stopAudio(message=''){
 audioRun++;audioPlayback=null;clearTimeout(audioTimer);speech?.cancel();speech?.resume?.();currentUtterance=null;
 if(recordedPlayer){const player=recordedPlayer;recordedPlayer=null;player.onended=null;player.onerror=null;player.pause();player.removeAttribute('src');player.load();}
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
 audioPlayback={paused:false,pause(){
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
  if(!speech){stopAudio('La synthèse vocale est indisponible pour cette lecture.');return;}
  const u=new SpeechSynthesisUtterance(item.text);currentUtterance=u;u.lang='ja-JP';u.rate=Number(settings.rate);
  u.voice=voices.find(v=>v.voiceURI===settings.voice)||voices.find(v=>/kyoko|hana|haruka|mizuki|female/i.test(v.name))||voices[0]||null;
  $('#audio-status').textContent=`Écoute ${index} / ${items.length} · ${fallback?'enregistrement indisponible · ':''}synthèse · ${u.voice?.name||'voix du navigateur'}`;
  u.onend=advance;u.onerror=e=>{if(active()&&e.error!=='canceled'&&e.error!=='interrupted')stopAudio('Lecture impossible. Essayez une autre voix japonaise dans les réglages.');};
  speech.speak(u);
 }
 function next(){
  if(!active())return;
  if(audioPlayback.paused){deferred=next;return;}
  if(index>=items.length){stopAudio('Écoute terminée.');return;}
  const raw=items[index++],item=typeof raw==='string'?{text:raw}:raw;
  const file=settings.audioMode==='recorded'&&localAudioHost&&localAudioFiles?.[item.ref];
  if(!file||failedRecordings.has(file)){synthetic(item,!!file);return;}
  const player=new Audio();recordedPlayer=player;let settled=false;
  player.preload='none';player.preservesPitch=true;
  const release=()=>{clearTimer();resumeRecorded=null;player.onended=null;player.onerror=null;if(recordedPlayer===player)recordedPlayer=null;};
  const fallback=()=>{if(settled||!active())return;settled=true;release();player.pause();player.removeAttribute('src');player.load();failedRecordings.add(file);synthetic(item,true);};
  player.onended=()=>{if(settled||!active())return;settled=true;release();advance();};player.onerror=fallback;
  player.src='fichiers_audio_phrases/'+file.split('/').map(encodeURIComponent).join('/');
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
