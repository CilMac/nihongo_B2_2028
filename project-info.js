/* Onglets accessibles ; synthèse technique incluse dans la page. */
(()=>{
 const dialog=document.getElementById('project-info'),body=dialog.querySelector('.info-body');
 const tabs=[...dialog.querySelectorAll('[role=tab]')];
 const positions={current:0,start:0,history:0};let active='current';
 function select(name,focus=false){
  if(!['current','start','history'].includes(name))return;
  positions[active]=body.scrollTop;active=name;
  for(const tab of tabs){const selected=tab.id==='info-tab-'+name;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;document.getElementById(tab.getAttribute('aria-controls')).hidden=!selected;}
  body.scrollTop=positions[name];if(focus)document.getElementById('info-tab-'+name).focus();
 }
 tabs.forEach((tab,i)=>{
  tab.onclick=()=>select(tab.id.replace('info-tab-',''));
  tab.onkeydown=event=>{
   let next;if(event.key==='ArrowRight')next=(i+1)%tabs.length;else if(event.key==='ArrowLeft')next=(i+tabs.length-1)%tabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else return;
   event.preventDefault();select(tabs[next].id.replace('info-tab-',''),true);
  };
 });
 document.getElementById('info-panel-start').addEventListener('click',event=>{if(event.target.closest('a[href^="#"]'))dialog.close();});
 window.ProjectInfo={select};
})();
