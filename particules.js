(function(root){
 'use strict';
 // Exercices éditoriaux liés à des phrases exactes, sans réécriture du corpus.
 const reference='https://www.irodori.jpf.go.jp/assets/data/Grammar_all.pdf';
 const readings={'を':'o','に':'ni','へ':'e','で':'de','の':'no','は':'wa','が':'ga'};
 const cases=[
  ['N3-S03','を','L’objet de l’action','Le pain est ce que l’on mange. を marque ici l’objet de manger.', ['を','に','で'],['を'],11],
  ['N3-S05','を','L’objet de l’action','Le café est ce que l’on boit. を marque ici l’objet de boire.', ['を','に','で'],['を'],11],
  ['N4-S04','に','Le lieu où quelque chose se trouve','に situe ici l’objet dans la valise, avec あります.', ['に','で','を'],['に'],23],
  ['N5-S02','へ','La destination','へ indique la direction ; に convient aussi pour cette destination avec 行きます.', ['へ','に','で'],['へ','に'],62],
  ['N6-S04','で','Le moyen de transport','で indique ici le moyen de transport : le bus.', ['で','に','を'],['で'],40],
  ['N9-S08','で','L’instrument utilisé','で indique ici l’instrument utilisé pour manger : la fourchette.', ['で','に','を'],['で'],90],
  ['N11-S02','に','L’heure de l’action','に rattache ici une heure précise à l’action de se lever.', ['に','で','を'],['に'],27],
  ['N14-S03','で','Le lieu où l’on agit','で situe ici l’action de travailler dans le grand magasin.', ['で','に','を'],['で'],35],
  ['N8-S05','の','Le lien entre deux noms','の relie ici l’Amérique au film : il s’agit d’un film américain.', ['の','に','で'],['の'],7],
  ['N12-S06','は','Le thème de la phrase','は présente ici la personne dont on annonce le choix : « pour moi ».', null,null,1],
  ['N5-S08','が','Ce dont on annonce la présence','が marque ici les chaussettes dont on annonce la présence.', null,null,22]
 ];
 const rowText=row=>({jp:row.Japonais,kana:row.Kana,romaji:row.Romaji,fr:row.Français});
 function masked(row,particle){
  const t=rowText(row);
  for(const key of ['jp','kana','romaji']){
   const token=key==='romaji'?readings[particle]:particle;
   const needle=' '+token+' ';
   if(!t[key].includes(needle))throw new Error('Particule non alignée : '+row.Leçon+'-'+row.Ligne);
   t[key]=t[key].replace(needle,' ［…］ ');
  }
  return t;
 }
 function build(rows){
  const byId=new Map(rows.map(r=>[r.Leçon+'-'+r.Ligne,r]));const out=[];
  for(const [source,particle,role,explanation,options,accepted,page] of cases){
   const row=byId.get(source);if(!row)continue;
   const base={type:'particles',source,row,title:role,explanation,reference:[1,11,23,62,90].includes(page)?reference+'#page='+page:reference,sources:[source]};
   const roles=[role,...['L’objet de l’action','La destination','L’heure de l’action','Le lien entre deux noms'].filter(x=>x!==role).slice(0,2)];
   out.push({...base,id:source+'-role',activity:'Repérer',prompt:'Quel rôle joue '+particle+' ('+readings[particle]+') dans cette phrase ?',texts:[rowText(row)],options:roles.map(x=>({value:x,label:x})),accepted:[role]});
   if(options)out.push({...base,id:source+'-gap',activity:'Compléter',prompt:'Quelle particule convient pour exprimer : '+role.toLowerCase()+' ? Plusieurs réponses peuvent convenir.',texts:[masked(row,particle)],options:options.map(x=>({value:x,text:{jp:x,kana:x,romaji:readings[x]}})),accepted});
  }
  const comparisons=[
   ['N4-S04','N14-S03','Dans quelle phrase la particule indique-t-elle le lieu d’une action ?','N14-S03','に situe l’objet avec あります ; で situe l’action de travailler.',35],
   ['N6-S04','N14-S03','Dans quelle phrase で indique-t-il un moyen de transport ?','N6-S04','Le bus est le moyen de déplacement ; le grand magasin est le lieu de travail.',40],
   ['N4-S04','N11-S02','Dans quelle phrase に indique-t-il une heure ?','N11-S02','に situe ici soit un objet dans l’espace, soit une action dans le temps.',27]
  ];
  for(const [a,b,prompt,answer,explanation,page] of comparisons){
   if(!byId.has(a)||!byId.has(b))continue;
   out.push({type:'particles',id:a+'-'+b,activity:'Comparer',title:'Comparer les rôles',source:a,sources:[a,b],row:byId.get(a),prompt,explanation,reference:[1,11,23,62,90].includes(page)?reference+'#page='+page:reference,texts:[rowText(byId.get(a)),rowText(byId.get(b))],options:[{value:a,label:'Phrase A'},{value:b,label:'Phrase B'}],accepted:[answer]});
  }
  return out;
 }
 const api={build,masked,cases};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Particules=api;
})(globalThis);
