'use strict';
let complementRows=null,complementWarnings={},complementLoad=null,complementError=false;
let currentComplement=null,complementRevealed=false;
const complementId=key=>key.match(/^N\d+-T\d+/)?.[0]||'';
function loadComplements(){
 if(complementLoad)return complementLoad;
 complementLoad=Promise.all(['leconsComplementsJap.json','leconsComplementsJap-notes.json'].map(async file=>{const r=await fetch(file);if(!r.ok)throw Error(file);return r.json();})).then(([rows,notes])=>{complementRows=new Map(rows.map(row=>[row.Leçon+'-'+row.Ligne,row]));complementWarnings=notes;complementError=false;}).catch(()=>{complementError=true;complementLoad=null;}).finally(renderComplementText);
 return complementLoad;
}
function selectComplement(key){
 const changed=currentComplement!==key;currentComplement=key;
 if(changed)complementRevealed=false;
 document.querySelectorAll('[data-extra-track]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.extraTrack===key)));
 renderComplementText();
}
function mountComplementText(){
 currentComplement=null;complementRevealed=false;
 const host=document.getElementById('extra-text');if(!host)return;
 host.innerHTML='<div class="extra-text-actions"><button id="extra-reveal" aria-expanded="false" aria-controls="extra-text-content" disabled>Voir le texte</button><label><input type="checkbox" id="extra-always"> Toujours afficher le texte</label></div><div id="extra-text-content" hidden></div><p id="extra-text-status" class="muted" role="status"></p>';
 document.getElementById('extra-always').checked=!!settings.complementsAlwaysText;
 document.getElementById('extra-always').onchange=e=>{settings.complementsAlwaysText=e.target.checked;complementRevealed=false;save();renderComplementText();};
 document.getElementById('extra-reveal').onclick=()=>{complementRevealed=!complementRevealed;renderComplementText();};
 loadComplements();renderComplementText();
}
function renderComplementText(){
 const host=document.getElementById('extra-text-content'),button=document.getElementById('extra-reveal'),status=document.getElementById('extra-text-status');if(!host||!button)return;
 const id=complementId(currentComplement||''),row=complementRows?.get(id);
 button.disabled=!row;button.hidden=!!settings.complementsAlwaysText;
 const visible=!!row&&(settings.complementsAlwaysText||complementRevealed);
 button.textContent=visible?'Masquer le texte':'Voir le texte';button.setAttribute('aria-expanded',String(visible));host.hidden=!visible;
 status.textContent=complementError?'Le texte n’a pas pu être chargé. L’écoute reste disponible.':!complementRows?'Chargement du texte…':currentComplement&&!row?'Texte indisponible pour cette piste.':!currentComplement?'Choisissez une piste, puis révélez son texte.':'';
 if(!visible){host.innerHTML='';return;}
 const same=row.Japonais.replace(/\s/g,'')===row.Kana.replace(/\s/g,'');
 const warnings=[...(complementWarnings[id]||[])];
 if(/non identifié|sens incertain|à confirmer|probablement/.test(row.Français))warnings.push('Le sens ou la lecture de cet élément reste à confirmer.');
 const french=row.Français.replace(/\[([^\]]+)\]/g,(_,note)=>{warnings.push(note);return '';}).trim();
 host.innerHTML=`<div class="language-block"><button type="button" class="kana kana-audio" lang="ja" id="extra-replay" aria-label="Réécouter la piste">${esc(row.Kana)}<span class="sound-note" aria-hidden="true"> ♪</span></button><p class="jp ${same?'extra-identical':''}" lang="ja">${jp(row.Japonais)}</p><p class="romaji">${esc(Romaji.display(row.Romaji))}</p><p class="fr">${esc(french)}</p></div>${Number(row.Ligne.slice(1))>200?'<p class="muted">Écriture en kana reconstituée à partir du romaji fourni avec l’audio.</p>':''}${warnings.length?`<details class="extra-warning"><summary>À vérifier</summary>${[...new Set(warnings)].map(note=>`<p>${esc(note)}</p>`).join('')}</details>`:''}`;
 document.getElementById('extra-replay').onclick=()=>{
  const file=(selectedExtraFiles||localExtraFiles)?.[currentComplement];
  if(file)speak([{extra:true,file,key:currentComplement,label:`${row.Leçon} · ${row.Ligne}`}]);
 };
}
