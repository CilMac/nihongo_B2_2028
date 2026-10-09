(function(root){
 'use strict';
 function compile(config){
  if(config.schema_version!=='2.0')throw Error('Version de configuration inconnue');
  const ids=new Set(),sentences=new Set();
  const templates=config.templates.map(t=>{
   if(ids.has(t.id)||!Number.isFinite(t.weight)||t.weight<=0)throw Error('Modèle invalide');
   ids.add(t.id);
   const slots=Object.entries(t.slots),variants=[];
   const visit=(index,env)=>{
    if(index<slots.length){
     const [name,pool]=slots[index];
     if(!config.slot_pools[pool]?.length)throw Error('Liste vide');
     for(const entry of config.slot_pools[pool])visit(index+1,{...env,[name]:entry});
     return;
    }
    const value=path=>{const [slot,field]=path.split('.');const v=env[slot]?.[field];if(v===undefined)throw Error('Champ manquant : '+path);return v;};
    for(const c of t.constraints){if(c.type!=='not_equal')throw Error('Contrainte inconnue');if(value(c.left)===value(c.right))return;}
    const fill=pattern=>{
     if(typeof pattern!=='string')throw Error('Texte manquant');
     const s=pattern.replace(/\{([^}]+)\}/g,(_,path)=>String(value(path)));
     if(!s.trim()||/[{}]/.test(s))throw Error('Texte incomplet');return s;
    };
    const mappings=[t.lesson_mapping,...Object.values(env).map(e=>e.lesson_mapping)];
    const mapped=mappings.every(m=>m?.status==='reviewed'&&Number.isInteger(m.minimum_lesson)&&m.minimum_lesson>0&&m.source_refs?.length);
    const q={type:'generated',dialogue:!!t.dialogue,templateId:t.id,title:t.label,context:t.context_fr,
     minimumLesson:mapped?Math.max(...mappings.map(m=>m.minimum_lesson)):null,
     sourceRefs:mapped?[...new Set(mappings.flatMap(m=>m.source_refs))]:[],
     grammarCards:t.grammar_cards||[],
     jp:fill(t.japanese_pattern),kana:fill(t.kana_pattern),romaji:fill(t.romaji_pattern),fr:fill(t.french_pattern),
     notes:[t.notes,t.translation_note,...Object.values(env).flatMap(e=>[e.sense_note,e.usage_note])].filter(Boolean),
     segments:t.segments.map(s=>({jp:fill(s.japanese_pattern),kana:fill(s.kana_pattern),role:s.role_fr}))};
    if(q.segments.map(s=>s.jp).join('')!==q.jp||q.segments.map(s=>s.kana).join('')!==q.kana)throw Error('Segments incohérents');
    if(/[一-鿿]/u.test(q.kana)||sentences.has(q.jp.normalize('NFC')))throw Error('Lecture ou doublon invalide');
    sentences.add(q.jp.normalize('NFC'));variants.push(q);
   };
   visit(0,{});return {...t,variants};
  });
  for(const level of Object.values(config.levels))if(level.allowed_templates.some(id=>!ids.has(id)))throw Error('Niveau invalide');
  return {config,templates,total:sentences.size};
 }
 function seeded(seed){let n=2166136261;for(const c of String(seed))n=Math.imul(n^c.charCodeAt(0),16777619);return ()=>{n+=0x6D2B79F5;let t=n;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
 function eligible(catalog,level='1',scope={mode:'explore'}){
  if(!['explore','through_lesson'].includes(scope.mode))throw Error('Périmètre inconnu');
  if(scope.mode==='explore'&&catalog.free)return catalog.free.templates;
  const group=catalog.config.levels[level];if(!group)throw Error('Groupe inconnu');
  if(scope.mode==='through_lesson'&&(!Number.isInteger(scope.lesson)||scope.lesson<1||scope.lesson>98))throw Error('Leçon invalide');
  return catalog.templates.filter(t=>group.allowed_templates.includes(t.id)).map(t=>({...t,
   variants:t.variants.filter(q=>scope.mode==='explore'||(q.minimumLesson!==null&&q.minimumLesson<=scope.lesson))
  })).filter(t=>t.variants.length);
 }
 function create(catalog,level='1',seed,scope={mode:'explore'}){
  const templates=eligible(catalog,level,scope);
  const random=seed===undefined?Math.random:seeded(seed),history=[],recent=[];
  let current=null;
  return {draw(same=false){
   let candidates=templates.filter(t=>!same||t.id===current?.templateId).map(t=>({...t,available:t.variants.filter(q=>!history.includes(q.jp))})).filter(t=>t.available.length);
   if(!same){const window=Math.min(4,Math.max(0,candidates.length-1));const eligible=candidates.filter(t=>!recent.slice(-window||recent.length).includes(t.id));if(eligible.length)candidates=eligible;}
   if(!candidates.length)return null;
   let pick=random()*candidates.reduce((n,t)=>n+t.weight,0),chosen=candidates[candidates.length-1];
   for(const t of candidates){pick-=t.weight;if(pick<0){chosen=t;break;}}
   current=chosen.available[Math.floor(random()*chosen.available.length)];
   history.push(current.jp);if(history.length>8)history.shift();recent.push(chosen.id);if(recent.length>4)recent.shift();
   return current;
  },resetHistory(){history.length=0;recent.length=0;},get current(){return current;}};
 }
 let pending=null,cached=null;
 function load(){
  if(cached)return Promise.resolve(cached);
  if(pending)return pending;
  pending=(async()=>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);try{
   const configs=await Promise.all(['generateur_phrases_config.json','generateur_phrases_libres.json'].map(async file=>{
    const response=await fetch(file+'?v=20261009-repas',{cache:'no-cache',signal:controller.signal});
    if(!response.ok)throw Error('Configuration indisponible');return compile(await response.json());
   }));
   cached={...configs[0],free:configs[1]};return cached;
  }finally{clearTimeout(timer);pending=null;}})();return pending;
 }
 const api={compile,create,eligible,load};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PhraseGenerator=api;
})(typeof globalThis!=='undefined'?globalThis:this);
