/* Commandes accessibles sans dupliquer les champs ni leur état. */
(()=>{
 const shell=document.querySelector('.shell'),head=document.querySelector('.masthead'),tabs=document.querySelector('.tabs');
 const dock=document.createElement('div');dock.className='navigation-dock';shell.prepend(dock);dock.append(head,tabs);
 const display=document.createElement('button');display.id='display-toggle';display.type='button';display.className='header-icon';display.title='Affichage';display.setAttribute('aria-label','Affichage');display.setAttribute('aria-expanded','false');display.setAttribute('aria-controls','display-panel');
 display.innerHTML='<svg viewBox="0 0 24 24" width="25" height="25" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
 head.insertBefore(display,document.getElementById('saved-toggle'));
 const reading=document.querySelector('.reading-bar');reading.id='display-panel';reading.hidden=true;reading.setAttribute('role','group');reading.setAttribute('aria-label','Aides de lecture');dock.append(reading);
 function closeDisplay(focus=false){reading.hidden=true;display.setAttribute('aria-expanded','false');if(focus)display.focus({preventScroll:true});}
 display.onclick=()=>{const open=reading.hidden;reading.hidden=!open;display.setAttribute('aria-expanded',String(open));if(open)for(const id of ['saved','settings']){document.getElementById(id).hidden=true;document.getElementById(id+'-toggle').setAttribute('aria-expanded','false');}};
 document.addEventListener('click',e=>{if(!reading.contains(e.target)&&!display.contains(e.target))closeDisplay();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!reading.hidden){closeDisplay(true);}});
 document.addEventListener('focusin',e=>{if(!reading.contains(e.target)&&!display.contains(e.target))closeDisplay();});
 const button=document.createElement('button');button.id='commands-toggle';button.type='button';button.textContent='Commandes';button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls','commands-panel');dock.append(button);
 const dialog=document.createElement('dialog');dialog.id='commands-panel';dialog.setAttribute('aria-labelledby','commands-title');dialog.innerHTML='<div class="commands-heading"><h2 id="commands-title">Commandes</h2><button type="button" autofocus>Fermer ×</button></div><div class="commands-content"></div>';document.body.append(dialog);
 let moved=[],anchor=null,anchorTop=0;
 function restore(){for(const [node,placeholder] of moved){placeholder.replaceWith(node);}moved=[];const target=anchor,top=anchorTop;if(target?.isConnected)requestAnimationFrame(()=>window.scrollBy(0,target.getBoundingClientRect().top-top));anchor=null;button.setAttribute('aria-expanded','false');}
 window.closeNavigationCommands=()=>{if(dialog.open)dialog.close();restore();};
 dialog.addEventListener('close',restore);dialog.querySelector('button').onclick=()=>dialog.close();
 button.onclick=()=>{
  const bottom=dock.getBoundingClientRect().bottom;anchor=[...document.querySelectorAll('#main article,#main .panel,#main details')].find(e=>e.getBoundingClientRect().bottom>bottom && e.getBoundingClientRect().top<innerHeight);anchorTop=anchor?.getBoundingClientRect().top || 0;
  const module=document.querySelector('[data-tab][aria-current="page"]')?.textContent.replace(/[\d\s]+$/,'').trim();
  document.querySelector('#commands-title').textContent='Commandes · '+module;
  const nodes=[...document.querySelectorAll('#main>.toolbar,#main .guide-view-navigation,#guide-active-tools,#main>.atelier-setup')];
  for(const node of nodes){if(!node)continue;const placeholder=document.createElement('div');const style=getComputedStyle(node);placeholder.style.height=node.getBoundingClientRect().height+'px';placeholder.style.marginTop=style.marginTop;placeholder.style.marginBottom=style.marginBottom;placeholder.setAttribute('aria-hidden','true');node.before(placeholder);moved.push([node,placeholder]);dialog.querySelector('.commands-content').append(node);}
  button.setAttribute('aria-expanded','true');dialog.showModal();
 };
 window.updateNavigationTab=()=>{button.hidden=!document.querySelector('#main>.toolbar,#main .guide-view-navigation,#guide-active-tools,#main>.atelier-setup');const active=tabs.querySelector('[aria-current=page]');if(!active)return;const a=active.getBoundingClientRect(),t=tabs.getBoundingClientRect();if(a.right>t.right)tabs.scrollLeft+=a.right-t.right;if(a.left<t.left)tabs.scrollLeft+=a.left-t.left;};
 window.updateNavigationTab();
 const compact=()=>dock.classList.toggle('is-scrolled',window.scrollY>100);window.addEventListener('scroll',compact,{passive:true});compact();
 for(const id of ['saved-toggle','settings-toggle'])document.getElementById(id).addEventListener('click',()=>{
  const other=id==='saved-toggle'?'settings':'saved';document.getElementById(other).hidden=true;document.getElementById(other+'-toggle').setAttribute('aria-expanded','false');
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape')for(const id of ['saved','settings']){document.getElementById(id).hidden=true;document.getElementById(id+'-toggle').setAttribute('aria-expanded','false');}});
})();
