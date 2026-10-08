/* Onglets accessibles et historique chargé uniquement à la demande. */
(()=>{
 const dialog=document.getElementById('project-info'),body=dialog.querySelector('.info-body');
 const tabs=[...dialog.querySelectorAll('[role=tab]')];
 const positions={current:0,start:0,history:0};let active='current',loading=null,history=null;
 const status=document.getElementById('info-history-status'),content=document.getElementById('info-history-content'),filter=document.getElementById('info-history-filter');
 const key=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 function applyFilter(){
  const terms=key(filter.value).trim().split(/\s+/).filter(Boolean);let count=0;
  for(const section of content.children){const match=terms.every(term=>section.dataset.search.includes(term));section.hidden=!match;if(match)count++;}
  status.textContent=count+' section'+(count>1?'s':'')+' sur '+history.sections.length;
 }
 async function load(){
  if(history||loading)return;
  status.textContent='Chargement de l’historique…';
  loading=(async()=>{
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
   try{
    const response=await fetch('project-history.json?v=20261008',{cache:'no-cache',signal:controller.signal});
    if(!response.ok)throw Error('Historique indisponible');
    const data=await response.json();if(!Array.isArray(data.sections))throw Error('Historique invalide');
    const fragment=document.createDocumentFragment();
    for(const entry of data.sections){
     if(typeof entry.title!=='string'||typeof entry.html!=='string'||typeof entry.text!=='string')throw Error('Section invalide');
     const details=document.createElement('details'),summary=document.createElement('summary'),article=document.createElement('div');
     details.dataset.search=key(entry.title+' '+entry.text);summary.textContent=entry.title;article.className='history-article';article.innerHTML=entry.html;
     details.append(summary,article);fragment.append(details);
    }
    history=data;content.replaceChildren(fragment);applyFilter();
   }catch{
    status.textContent='L’historique n’a pas pu être chargé.';
    const retry=document.createElement('button');retry.textContent='Réessayer';retry.onclick=()=>{content.replaceChildren();load();};content.replaceChildren(retry);
   }finally{clearTimeout(timer);loading=null;}
  })();await loading;
 }
 function select(name,focus=false){
  if(!['current','start','history'].includes(name))return;
  positions[active]=body.scrollTop;active=name;
  for(const tab of tabs){const selected=tab.id==='info-tab-'+name;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;document.getElementById(tab.getAttribute('aria-controls')).hidden=!selected;}
  body.scrollTop=positions[name];if(focus)document.getElementById('info-tab-'+name).focus();
  if(name==='history')load();
 }
 tabs.forEach((tab,i)=>{
  tab.onclick=()=>select(tab.id.replace('info-tab-',''));
  tab.onkeydown=event=>{
   let next;if(event.key==='ArrowRight')next=(i+1)%tabs.length;else if(event.key==='ArrowLeft')next=(i+tabs.length-1)%tabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else return;
   event.preventDefault();select(tabs[next].id.replace('info-tab-',''),true);
  };
 });
 filter.oninput=()=>{if(history)applyFilter();};
 document.getElementById('info-panel-start').addEventListener('click',event=>{if(event.target.closest('a[href^="#"]'))dialog.close();});
 window.ProjectInfo={select};
})();
