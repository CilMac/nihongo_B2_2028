/* Expressions : copies éditoriales autonomes, commandes communes au carnet. */
(function(root){
 'use strict';
 const collections={
  quotidien:{title:'Quotidien',subtitle:'La vie quotidienne entre proches',file:'expressions-quotidien.json',prefix:'Q'},
  familier:{title:'Familier & dramas',subtitle:'Comprendre les réactions et les tournures familières',file:'expressions-familier.json',prefix:'F'}
 };
 const required=['id','japanese','kana','romaji','fr','category','register','usage','note'];
 function validate(data,key){
  if(!collections[key]||!data||!Array.isArray(data.entries)||!data.entries.length)throw Error('Collection invalide');
  const ids=new Set();
  for(const e of data.entries){
   if(!e||required.some(k=>typeof e[k]!=='string'||!e[k].trim())||!new RegExp('^'+collections[key].prefix+'\\d{3}$').test(e.id)||ids.has(e.id)||!['courant','familier','très familier'].includes(e.register)||![1,2,3].includes(e.intensity)||(e.caution!==undefined&&typeof e.caution!=='string'))throw Error('Entrée invalide');
   ids.add(e.id);
  }
  return data.entries;
 }
 // Les équivalences sont construites depuis le romaji de chaque entrée :
 // un ō peut rechercher koohii ou kyou sans réécrire le texte affiché.
 function key(text){return String(text??'').normalize('NFKC').normalize('NFD').replace(/([a-zA-Z])[\u0300-\u036f]+/g,'$1').normalize('NFC').toLowerCase().replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-96)).replace(/[’‘]/g,"'");}
 function romajiAliases(text){return [...new Set([text,text.replace(/ou|oo/g,'ō').replace(/uu/g,'ū').replace(/aa/g,'ā').replace(/ee/g,'ē').replace(/ii/g,'ī')])];}
 function searchText(e){return key([e.japanese,e.kana,...romajiAliases(e.romaji),e.fr,e.category,e.register,e.usage,e.note,e.caution||''].join('\n'));}
 function matches(e,query){const text=searchText(e);return key(query).trim().split(/\s+/).filter(Boolean).every(t=>text.includes(t)||text.replace(/\s/g,'').includes(t));}
 const favorite=(collection,id)=>'expression:'+collection+':'+id;
 const href=(collection,id='')=>'#expressions/'+collection+(id?'/'+id:'');
 function records(key,entries){const c=collections[key];return entries.map(e=>({
  id:favorite(key,e.id),source:'expressions',kind:'phrase',title:e.japanese,location:'Expression · '+c.title+' · '+e.category,
  entry:e,collection:key,category:e.category,href:href(key,e.id),anchor:'expression-'+e.id,favorite:favorite(key,e.id),
  caution:e.caution||'',register:e.register,audioText:e.japanese,
  parts:[{lang:'ja',text:e.japanese},{lang:'ja',text:e.kana,reading:true},{lang:'romaji',text:e.romaji},...['fr','usage','note','category','register','caution'].filter(k=>e[k]).map(k=>({lang:'fr',text:e[k]}))],
  searchParts:romajiAliases(e.romaji).slice(1).map(text=>({lang:'romaji',text}))
 }));}
 const cache={},pending={};let renderVersion=0;
 const views={quotidien:{query:'',category:'',onlyFavorites:false},familier:{query:'',category:'',onlyFavorites:false}};
 async function load(collection){
  if(cache[collection])return cache[collection];
  if(pending[collection])return pending[collection];
  pending[collection]=(async()=>{
   const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
   try{const r=await fetch(collections[collection].file+'?v=20261007',{cache:'no-cache',signal:controller.signal});if(!r.ok)throw Error('HTTP '+r.status);const entries=validate(await r.json(),collection);return cache[collection]={entries,error:false};}
   catch{return cache[collection]={entries:[],error:true};}
   finally{clearTimeout(timeout);delete pending[collection];}
  })();return pending[collection];
 }
 async function loadAll(){await Promise.all(Object.keys(collections).map(load));return Object.entries(collections).flatMap(([key])=>records(key,cache[key].entries));}
 function failed(){return Object.keys(collections).filter(k=>cache[k]?.error);}
 function card(e,collection,{searchId=''}={}){
  const identity=searchId?'data-corpus-id="'+esc(searchId)+'"':'id="expression-'+esc(e.id)+'"';
  return `<article class="card expression-card${searchId?' corpus-card':''}" ${identity}>
   ${searchId?`<p class="corpus-location">Expression · ${esc(collections[collection].title)}</p>`:''}
   <div class="card-head"><span class="number">${esc(e.category)}</span><div class="card-actions">${star(favorite(collection,e.id))}<button type="button" class="expression-listen" data-speak="${esc(e.japanese)}" aria-label="Écouter en synthèse : ${esc(e.japanese)}">▶</button></div></div>
   ${block({jp:e.japanese,kana:e.kana,romaji:e.romaji,fr:e.fr},{audio:false,audioText:e.japanese})}
   <p class="expression-register"><span class="pill">${esc(e.register)}</span></p>
   ${e.caution?`<p class="expression-caution"><strong>À savoir :</strong> ${esc(e.caution)}</p>`:''}
   <details><summary>Contexte et nuance</summary><p>${esc(e.usage)}</p><p>${esc(e.note)}</p></details>
   ${searchId?`<p class="corpus-actions"><a href="${href(collection,e.id)}" data-corpus-open="${esc(searchId)}">Ouvrir le passage →</a></p>`:''}
  </article>`;
 }
 async function render(r){
  const version=++renderVersion,collection=collections[r.id]?r.id:'quotidien',c=collections[collection],requestedHash=location.hash;
  const active=()=>version===renderVersion&&location.hash===requestedHash&&route().tab==='expressions';
  const main=document.getElementById('main');
  main.innerHTML=intro('COMPRENDRE · ÉCHANGER','Expressions',c.subtitle)+'<p class="panel expression-loading" role="status">Chargement des expressions…</p>';
  const result=await load(collection);renderFavorites();if(!active())return;
  window.closeNavigationCommands?.();
  const selected=r.line?result.entries.find(e=>e.id===r.line):null;
  const view=views[collection];
  main.innerHTML=intro('COMPRENDRE · ÉCHANGER','Expressions',c.subtitle)+`<div class="toolbar expressions-tools"><div class="expression-collections" role="group" aria-label="Collection d’expressions">${Object.entries(collections).map(([key,c])=>`<button type="button" data-expression-collection="${key}" aria-pressed="${collection===key}">${esc(c.title)}</button>`).join('')}</div>${r.line?'':`<input id="expression-search" type="search" aria-label="Rechercher une expression" placeholder="Japonais, romaji, français ou situation…" value="${esc(view.query)}"><select id="expression-category" aria-label="Catégorie d’expressions"><option value="">Toutes les catégories</option>${[...new Set(result.entries.map(e=>e.category))].sort((a,b)=>a.localeCompare(b,'fr')).map(cat=>`<option value="${esc(cat)}" ${view.category===cat?'selected':''}>${esc(cat)}</option>`).join('')}</select><label><input type="checkbox" id="expression-favorites" ${view.onlyFavorites?'checked':''}> Mes favoris</label>`}</div><p class="muted expression-help">${collection==='quotidien'?'Des phrases surtout familières, à employer entre proches.':'Des réactions à comprendre en contexte. Le registre et le ton comptent ; aucune citation de série.'} Écoute en synthèse vocale.</p>${r.line?`<p><a data-context-return href="${href(collection)}">← Toutes les expressions · ${esc(c.title)}</a></p>`:''}<p id="expression-count" class="muted" role="status"></p><div id="expression-results" class="grid"></div>`;
  const host=document.getElementById('expression-results');
  function results(){
   if(!host.isConnected||route().tab!=='expressions')return;
   if(result.error){document.getElementById('expression-count').textContent='Collection indisponible';host.innerHTML=`<div class="panel empty"><p>La collection ${esc(c.title)} n’a pas pu être chargée. L’autre collection et les autres rubriques restent accessibles.</p><button type="button" id="expression-retry">Réessayer</button></div>`;document.getElementById('expression-retry').onclick=()=>{delete cache[collection];render(r);root.dispatchEvent(new Event('expressions-retry'));};return;}
   const list=r.line?(selected?[selected]:[]):result.entries.filter(e=>(!view.category||e.category===view.category)&&(!view.onlyFavorites||favorites.has(favorite(collection,e.id)))&&matches(e,view.query));
   document.getElementById('expression-count').textContent=list.length+' expression'+(list.length>1?'s':'')+' · '+c.title;
   host.innerHTML=list.length?list.map(e=>card(e,collection)).join(''):`<p class="panel empty">${r.line?'Cette expression est introuvable. Revenez à la collection.':'Aucune expression trouvée. Essayez un autre terme ou retirez un filtre.'}</p>`;
  }
  host.refreshResults=results;results();
  main.querySelectorAll('[data-expression-collection]').forEach(b=>b.onclick=()=>{location.hash=href(b.dataset.expressionCollection);});
  if(!r.line){document.getElementById('expression-search').oninput=e=>{view.query=e.target.value;results();};document.getElementById('expression-category').onchange=e=>{view.category=e.target.value;results();};document.getElementById('expression-favorites').onchange=e=>{view.onlyFavorites=e.target.checked;results();};}
  window.updateNavigationTab?.();
  if(selected){const target=document.getElementById('expression-'+selected.id);target.classList.add('highlight');requestAnimationFrame(()=>{if(active())target.scrollIntoView({block:'center'});});}
 }
 function favoritesHTML(){
  const ids=[...favorites].filter(id=>id.startsWith('expression:'));if(!ids.length)return '';
  const missing=new Set();
  const html=ids.map(id=>{const [,collection,entryId]=id.split(':');if(!collections[collection])return `<p>Favori Expressions indisponible : ${esc(id)}</p>`;
   if(!cache[collection])missing.add(collection);
   const e=cache[collection]?.entries.find(e=>e.id===entryId);
   return `<div class="guide-saved-row">${star(id)}<a href="${href(collection,entryId)}"><strong>Expression · ${esc(collections[collection].title)}</strong><span>${e?`${esc(e.japanese)} · ${esc(e.fr)}`:cache[collection]?'Expression indisponible — favori conservé.':'Chargement du favori…'}</span></a></div>`;
  }).join('');
  if(missing.size)Promise.all([...missing].map(load)).then(()=>renderFavorites());
  return '<section class="expression-saved"><h3>Expressions</h3>'+html+'</section>';
 }
 const api={collections,validate,matches,records,romajiAliases,load,loadAll,failed,retryFailed:async()=>{for(const key of failed())delete cache[key];const records=await loadAll();renderFavorites();return records;},render,card,favoritesHTML,invalidate:()=>{renderVersion++;},refreshFavorites:()=>{
  const input=document.getElementById('expression-favorites'),host=document.getElementById('expression-results');
  if(!input?.checked||!host)return;
  const open=[...host.querySelectorAll('article')].filter(el=>el.querySelector('details')?.open).map(el=>el.id);
  host.refreshResults?.();for(const id of open){const details=document.getElementById(id)?.querySelector('details');if(details)details.open=true;}
 }};
 root.Expressions=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);
