(function(root){
 'use strict';
 // Exercices éditoriaux liés à des phrases exactes, sans réécriture du corpus.
 const reference='https://www.irodori.jpf.go.jp/assets/data/Grammar_all.pdf';
 const recipientReference='https://www.kyozai.jpf.go.jp/kyozai/material/BTS00035/ja/render.do';
 const referenceFor=page=>typeof page==='string'?page:reference+([1,11,15,23,36,37,62,90].includes(page)?'#page='+page:'');
 const readings={'を':'o','に':'ni','へ':'e','で':'de','の':'no','は':'wa','が':'ga','から':'kara','まで':'made','と':'to','も':'mo'};
 const cases=[
  ['N15-S02','に','Le lieu de résidence','東京に (toukyou ni) situe le lieu où la personne habite. Avec 住んでいます (sunde imasu), on emploie に pour ce lieu de résidence ; la terminaison ています ne suffit pas à choisir で.', ['に','で','を'],['に'],37],
  ['N19-S09','で','Le lieu où un événement a lieu','サンプラザで (sanpuraza de) situe le concert au Sunplaza. Avec cet événement, あります (arimasu) signifie « avoir lieu » ; le lieu prend で. Le corpus écrit コンサー卜 ; la graphie usuelle est コンサート (konsaato).', ['で','に','を'],['で'],36],
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
  ['N5-S08','が','Ce dont on annonce la présence','が marque ici les chaussettes dont on annonce la présence.', null,null,22],
  ['N12-S05','に','Le choix dans にします','Au café, 何にしますか (nani ni shimasu ka) demande ce que la personne choisit de prendre. Nom + にします exprime ici un choix. 何をしますか demanderait ce que la personne fait : ce serait une autre question.', ['に','を','で'],['に'],15],
  ['N14-S08','に','Le choix dans にします','コーヒーとお菓子にします (koohii to o kashi ni shimasu) annonce le choix du café et de la pâtisserie. と relie les deux éléments ; に rattache tout ce groupe à します. Ce に ne désigne pas une destination.', ['に','を','で'],['に'],15],
  ['N14-S10','に','Le but du déplacement','買物に行きましょう (kaimono ni ikimashou) propose d’aller faire des achats. Nom d’activité + に + 行きます indique ce que l’on va faire. 買物 désigne ici l’activité, pas le lieu où l’on va ; で ne peut pas remplacer ce に pour exprimer ce but.', ['に','で','を'],['に'],37],
  ['N13-S10','に','La personne à qui l’on téléphone','友達に電話をします (tomodachi ni denwa o shimasu) signifie téléphoner à un ami. に suit la personne à qui l’appel est adressé ; を accompagne 電話 dans 電話をします. Avec と, on évoquerait un échange avec l’ami plutôt que de désigner le destinataire de l’appel. Repère de lecture : le corpus écrit 今晚 ; la graphie usuelle pour こんばん (konban, ce soir) est 今晩. Le texte source est conservé.', ['に','で','を'],['に'],recipientReference]
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
   const base={type:'particles',source,row,title:role,explanation,reference:referenceFor(page),sources:[source]};
   const roles=[role,...['L’objet de l’action','La destination','L’heure de l’action','Le lien entre deux noms'].filter(x=>x!==role).slice(0,2)];
   out.push({...base,id:source+'-role',activity:'Repérer',prompt:'Quel rôle joue '+particle+' ('+readings[particle]+') dans cette phrase ?',texts:[rowText(row)],options:roles.map(x=>({value:x,label:x})),accepted:[role]});
   if(options)out.push({...base,id:source+'-gap',activity:'Compléter',prompt:'Quelle particule convient pour exprimer : '+role.toLowerCase()+' ? Plusieurs réponses peuvent convenir.',texts:[masked(row,particle)],options:options.map(x=>({value:x,text:{jp:x,kana:x,romaji:readings[x]}})),accepted});
  }
  const comparisons=[
   ['N4-S04','N14-S03','Dans quelle phrase la particule indique-t-elle le lieu d’une action ?','N14-S03','に situe l’objet avec あります ; で situe l’action de travailler.',35],
   ['N6-S04','N14-S03','Dans quelle phrase で indique-t-il un moyen de transport ?','N6-S04','Le bus est le moyen de déplacement ; le grand magasin est le lieu de travail.',40],
   ['N4-S04','N11-S02','Dans quelle phrase に indique-t-il une heure ?','N11-S02','に situe ici soit un objet dans l’espace, soit une action dans le temps.',27],
   ['N13-S01','N11-S02','Quelle phrase indique combien de temps l’attente a duré ?','N13-S01','Dans la phrase A, 一時間 (ichijikan) signifie « pendant une heure » : c’est la durée de l’attente, sans に après ce groupe. Dans la phrase B, 十一時に (juuichi ji ni) situe le lever à onze heures. Une durée répond à « pendant combien de temps ? », une heure à « à quelle heure ? ».',null],
   ['N14-S08','N14-S10','Dans quelle phrase に indique-t-il ce que l’on va faire en se déplaçant ?','N14-S10','Dans A, にします annonce un choix : café et pâtisserie. Dans B, 買物に行きましょう propose un déplacement pour faire des achats. Le verbe et le groupe placé avant に permettent de comprendre son rôle.',37],
   ['N12-S05','N11-S02','Dans quelle phrase に fait-il partie d’une expression qui demande un choix ?','N12-S05','Dans A, 何にしますか demande ce que Yamada choisit de prendre. Dans B, 十一時に indique l’heure du lever. に ne se traduit donc pas toujours de la même manière.',15],
   ['N13-S10','N14-S10','Dans quelle phrase に désigne-t-il la personne à qui l’action s’adresse ?','N13-S10','Dans A, 友達に désigne l’ami à qui l’on téléphone. Dans B, 買物に indique le but du déplacement : faire des achats. Repère de lecture : 今晚 est conservé comme dans le corpus ; la graphie usuelle de こんばん (ce soir) est 今晩.',recipientReference]
  ];
  comparisons.push(['N12-S06','N9-S03','Dans quelle phrase la particule met-elle en avant la personne dont on annonce le choix ?','N12-S06','Dans A, 私は (watashi wa) présente la personne : « pour moi, un café ». Dans B, 中華料理が (chuuka ryouri ga) désigne la chose appréciée. La phrase A est une réponse abrégée au café ; elle n’affirme pas que la personne est du café.',1]);
  comparisons.push(
   ['N5-S08','N19-S09','Dans quelle phrase あります (arimasu) annonce-t-il un événement ?','N19-S09','Dans A, les chaussettes sont présentes ici : ここに (koko ni). Dans B, le concert a lieu au Sunplaza : サンプラザで (sanpuraza de). あります ne suffit donc pas à choisir la particule du lieu. Le corpus écrit コンサー卜 ; la graphie usuelle est コンサート (konsaato).',36],
   ['N15-S02','N14-S03','Dans quelle phrase le lieu est-il celui d’une activité de travail ?','N14-S03','Dans A, 東京に住んでいます (toukyou ni sunde imasu) indique la résidence. Dans B, デパートで働いています (depaato de hataraite imasu) indique le lieu de travail. La forme en ています est présente dans les deux : c’est le sens du verbe qui distingue ces emplois.',37]
  );
  for(const [a,b,prompt,answer,explanation,page] of comparisons){
   if(!byId.has(a)||!byId.has(b))continue;
   out.push({type:'particles',id:a+'-'+b,activity:'Comparer',title:'Comparer les rôles',source:a,sources:[a,b],row:byId.get(a),prompt,explanation,reference:referenceFor(page),texts:[rowText(byId.get(a)),rowText(byId.get(b))],options:[{value:a,label:'Phrase A'},{value:b,label:'Phrase B'}],accepted:[answer]});
  }
  // Questions ciblées : plusieurs rôles sur une même phrase et contextes obligatoires.
  // La bonne réponse est la première de chaque liste éditoriale ; l’interface mélange les choix.
  const roles=[
   ['N19-S09','ni-date','に (ni)',null,['Indiquer la date du concert','Indiquer le lieu du concert','Indiquer un moyen de transport'],'土曜日に (doyoubi ni) situe le concert samedi ; サンプラザで (sanpuraza de) en donne le lieu. Ici に répond à « quand ? », で à « où ? ». Le corpus écrit コンサー卜 ; la graphie usuelle est コンサート (konsaato).',36],
   ['N11-S06','wa-topic','は (wa)',null,['Présenter aujourd’hui comme thème','Identifier la personne qui se lève','Indiquer une durée de dix heures'],'今日は (kyou wa) pose aujourd’hui comme thème. 十時に (juuji ni) indique l’heure du lever : dix heures. La personne qui s’est levée est comprise, sans être nommée. は ne désigne donc pas forcément une personne.',1],
   ['N4-S05','ga-question','が (ga)',null,['Marquer ce que la question cherche à identifier','Marquer le lieu de la valise','Relier deux objets dans une liste'],'何が (nani ga) demande ce qui est présent. Le lieu est déjà donné par トランクの中に (toranku no naka ni). La réponse du cours nomme les vêtements et les livres, suivis de が.'],
   ['N8-S02','ga-event','が (ga)','N8-S01',['Marquer la personne dont on annonce la venue','Dire où se trouve la personne','Annoncer la destination du déplacement'],'Après la question sur la journée d’hier, B raconte la venue d’un ami. 友達が (tomodachi ga) marque la personne venue. A ne demande pas « qui ? » : が peut aussi servir à présenter un événement, sans question explicite sur son sujet.'],
   ['N9-S03','ga-liking','が (ga)',null,['Désigner ce que la personne adore','Désigner la personne qui aime cuisiner','Indiquer un lieu où l’on mange'],'中華料理が (chuuka ryouri ga) désigne la cuisine chinoise, ce que la personne adore avec 大好きです (daisuki desu). 好き (suki) et 大好き (daisuki) sont des adjectifs en な ; on ne copie pas la construction française du verbe « aimer ». は pourrait donner une autre organisation du propos : il n’est pas déclaré impossible.'],
   ['N10-S09','ga-preference','が (ga)','N10-S08',['Marquer l’élément dont on demande s’il est préféré','Marquer la personne qui regarde la télévision','Indiquer le moyen utilisé pour regarder'],'Dans A, la personne cite les informations et les séries. Dans B, どちらが好きですか (dochira ga suki desu ka) demande lequel des deux types d’émissions elle préfère. が suit どちら (dochira), l’élément à identifier, et non la personne qui éprouve le goût.'],
   ['N4-S06','to','と (to)',null,['Relier les deux noms de la liste','Indiquer avec qui une personne agit','Indiquer le lieu où se trouvent les objets'],'と (to) relie ici 服 (fuku, vêtements) et 本 (hon, livres). La phrase énumère ce qui est présent. Il ne s’agit pas d’une personne avec qui l’on fait une action.'],
   ['N4-S06','ga','が (ga)',null,['Marquer ce dont on annonce la présence','Indiquer ce que l’on achète','Relier les deux noms de la liste'],'が (ga) marque ici le groupe 服と本 (fuku to hon), les vêtements et les livres dont on annonce la présence avec あります (arimasu). と (to) relie les deux noms à l’intérieur de ce groupe.'],
   ['N9-S04','mo','も (mo)','N9-S03',['Ajouter une personne qui partage le même goût','Présenter un goût opposé','Indiquer une personne qui cuisine avec l’autre'],'La phrase A exprime le goût pour la cuisine chinoise. Dans la réponse B, 私も (watashi mo, moi aussi) ajoute une personne qui partage ce goût. La suite est comprise grâce au contexte.',3],
   ['N11-S08','kara','から (kara)',null,['Indiquer le début de la période de travail','Indiquer la fin de la période de travail','Indiquer le lieu de travail'],'午後から (gogo kara) signifie « à partir de l’après-midi ». から (kara) marque ici le début de la période ; まで (made) en marque la fin.'],
   ['N11-S08','made','まで (made)',null,['Indiquer la fin de la période de travail','Indiquer le début de la période de travail','Indiquer un moyen de transport'],'夜中まで (yonaka made) signifie « jusqu’au milieu de la nuit ». まで (made) marque ici la limite de la période, et non une durée chiffrée.'],
   ['N11-S08','de','で (de)',null,['Indiquer le lieu de travail','Indiquer un instrument utilisé','Indiquer la fin de la période de travail'],'バーで (baa de) situe l’activité de travailler dans un bar. で (de) indique ici le lieu de l’activité ; les horaires sont donnés par から (kara) et まで (made).',35],
   ['N13-S01','duration','一時間 (ichijikan)',null,['La durée de l’attente : pendant une heure','L’heure du rendez-vous : à une heure','Le nombre de personnes attendues'],'一時間 (ichijikan) indique ici combien de temps la personne a attendu. Ce groupe de durée accompagne 待ちました (machimashita) sans に. Il ne signifie pas « à une heure », qui se dirait 一時に (ichiji ni).'],
   ['N14-S04','mo','も (mo)','N14-S03',['Ajouter l’ami aux personnes qui travaillent au grand magasin','Dire que l’ami travaille dans un autre lieu','Dire que seul l’ami travaille au grand magasin'],'La phrase A dit que la personne travaille dans un grand magasin. Dans B, も (mo) ajoute son ami américain : lui aussi y travaille. Cela ne dit pas qu’ils travaillent ensemble au même moment.',3]
  ];
  for(const [source,key,target,context,labels,explanation,page] of roles){
   const sources=context?[context,source]:[source];
   if(!sources.every(id=>byId.has(id)))continue;
   out.push({type:'particles',id:source+'-'+key+'-role',source,sources,row:byId.get(source),title:key==='duration'?'Distinguer durée et heure':target+' : '+labels[0].toLowerCase(),activity:'Repérer',prompt:'Quel rôle joue '+target+(context?' dans la phrase B, après la phrase A ?':' dans cette phrase ?'),texts:sources.map(id=>rowText(byId.get(id))),options:labels.map(label=>({value:label,label})),accepted:[labels[0]],explanation,reference:reference+(page?'#page='+page:'')});
  }
  const journey=byId.get('N6-S06');
  if(journey)for(const [particle,role,options,explanation] of [
   ['から','le point de départ du trajet',['から','まで','で'],'そこから (soko kara) signifie « de là ». から (kara) suit le point de départ ; 押上駅まで (Oshiage eki made) indique jusqu’où l’on va.'],
   ['まで','la limite du trajet : « jusqu’à la gare d’Oshiage »',['まで','から','で'],'押上駅まで (Oshiage eki made) indique la limite du trajet : jusqu’à la gare d’Oshiage. から (kara) indiquerait au contraire le départ. に (ni) et へ (e), non proposés ici, peuvent aussi désigner cette destination ; la consigne demande précisément « jusqu’à ».'],
   ['で','le moyen de transport',['で','に','を'],'電車で (densha de) signifie « en train ». Avec 行きます (ikimasu), で (de) indique ici le moyen utilisé pour se déplacer.']
  ]){
   out.push({type:'particles',id:'N6-S06-'+readings[particle]+'-gap',source:'N6-S06',sources:['N6-S06'],row:journey,title:role,activity:'Compléter',prompt:'Parmi ces choix, quelle particule convient pour exprimer '+role+' ?',texts:[masked(journey,particle)],options:options.map(value=>({value,text:{jp:value,kana:value,romaji:readings[value]}})),accepted:[particle],explanation,reference});
  }
  const niSheets={'N12-S05':'G21','N14-S08':'G21','N14-S10':'G22','N13-S10':'G23'};
  for(const q of out)q.grammarCards=[...new Set(q.sources.map(id=>niSheets[id]).filter(Boolean))];
  for(const q of out)if(['N11-S06-wa-topic-role','N4-S05-ga-question-role','N8-S02-ga-event-role','N9-S03-ga-liking-role','N10-S09-ga-preference-role','N12-S06-N9-S03'].includes(q.id))q.grammarCards=['G07'];
  for(const q of out)if(['N15-S02-role','N15-S02-gap','N19-S09-role','N19-S09-gap','N19-S09-ni-date-role','N5-S08-N19-S09','N15-S02-N14-S03'].includes(q.id))q.grammarCards=['G08','G10'];
  // Lot des leçons 20–23 : choix éditoriaux et distracteurs propres à chaque sens.
  const foundation='https://www.jpf.go.jp/j/urawa/j_rsorcs/textbook/dl/setsumei/setsumei_all.pdf#page=';
  const additions=[
   ['N20-S07','を','Le chemin parcouru',['Le chemin parcouru','L’objet que l’on achète','Le moyen de transport'],['を','に','で'],['G06'],113,'この道を (kono michi o) indique le chemin que l’on emprunte en allant tout droit. を ne marque pas ici un objet acheté ou consommé. Une destination répondrait à « où va-t-on ? », avec に ou へ ; la question porte sur le trajet parcouru.'],
   ['N21-S01','と','La personne qui accompagne',['La personne qui accompagne','Le moyen de transport','Une liste de deux destinations'],['と','で','を'],['G12','G10'],84,'家内と (kanai to) signifie « avec ma femme » : と indique avec qui le voyage a été fait. フランスへ (furansu e) donne la destination. Pour le moyen de transport, on utiliserait un nom de transport suivi de で.'],
   ['N23-S07','から','Le début de la période : « depuis avril »',['Le début de la période : « depuis avril »','La raison de travailler dans cette entreprise','La fin de la période de travail'],['から','まで','と'],['G11','G24'],68,'四月から (shigatsu kara) indique depuis quand la personne travaille : depuis avril. から suit ici un mois, point de départ dans le temps. Il ne donne pas la raison de ce travail. まで signifierait une limite, « jusqu’à avril », ce qui ne répond pas à la consigne.']
  ];
  for(const [source,particle,title,labels,choices,grammarCards,page,explanation] of additions){
   const row=byId.get(source);if(!row)continue;
   const base={type:'particles',source,sources:[source],row,title,grammarCards,explanation,reference:foundation+page};
   out.push({...base,id:source+'-role',activity:'Repérer',prompt:'Quel rôle joue '+particle+' ('+readings[particle]+') dans cette phrase ?',texts:[rowText(row)],options:labels.map(label=>({value:label,label})),accepted:[labels[0]]});
   out.push({...base,id:source+'-gap',activity:'Compléter',prompt:'Parmi ces choix, quelle particule exprime : '+title.toLowerCase()+' ?',texts:[masked(row,particle)],options:choices.map(value=>({value,text:{jp:value,kana:value,romaji:readings[value]}})),accepted:[particle]});
  }
  for(const [a,b,prompt,answer,grammarCards,page,explanation] of [
   ['N3-S05','N20-S07','Dans quelle phrase を indique-t-il un chemin parcouru ?','N20-S07',['G06'],113,'Dans A, le café est l’objet de boire. Dans B, cette route est le chemin parcouru avec 行きます (ikimasu). La même particule を joue deux rôles différents.'],
   ['N6-S04','N21-S01','Quelle phrase indique avec qui le déplacement a été fait ?','N21-S01',['G10','G12'],84,'A indique comment on se déplace : バスで (basu de), en bus. B indique avec qui : 家内と (kanai to), avec ma femme. Le transport et l’accompagnement peuvent être exprimés ensemble, mais chacune de ces phrases ne précise qu’une de ces informations.'],
   ['N4-S06','N21-S01','Dans quelle phrase と indique-t-il une personne qui accompagne, plutôt que de relier les noms d’une liste ?','N21-S01',['G12'],84,'Dans A, 服と本 (fuku to hon) relie vêtements et livres. Dans B, 家内と (kanai to) indique la personne qui accompagne ; フランスへ donne la destination. と ne relie donc pas ici la femme et la France dans une liste.']
  ]){
   if(!byId.has(a)||!byId.has(b))continue;
   out.push({type:'particles',id:a+'-'+b,activity:'Comparer',title:'Comparer les rôles',source:a,sources:[a,b],row:byId.get(a),prompt,explanation,grammarCards,reference:foundation+page,texts:[rowText(byId.get(a)),rowText(byId.get(b))],options:[{value:a,label:'Phrase A'},{value:b,label:'Phrase B'}],accepted:[answer]});
  }
  const context='N22-S08',reason='N22-S09',start='N23-S07';
  if(byId.has(context)&&byId.has(reason)){
   const labels=['Justifier la demande de patienter','Indiquer depuis quelle heure on attend','Marquer le lieu où l’on vérifie'];
   const explanation='A demande de patienter. B, 今調べますから (ima shirabemasu kara), donne la raison de cette demande : la personne va vérifier maintenant. から suit ici 調べます, une action présentée comme raison ; il ne marque pas un départ. La traduction du cours est conservée, même si elle ne rend pas explicitement cette liaison.';
   out.push({type:'particles',id:reason+'-kara-reason-role',activity:'Repérer',title:'から : la raison de patienter',source:reason,sources:[context,reason],row:byId.get(reason),prompt:'Quel rôle joue から (kara) dans la phrase B, après la demande de la phrase A ?',texts:[rowText(byId.get(context)),rowText(byId.get(reason))],options:labels.map(label=>({value:label,label})),accepted:[labels[0]],explanation,grammarCards:['G24'],reference:foundation+126});
   if(byId.has(start)){
    // Le second passage rassemble les deux répliques sans réécrire leurs textes.
    const passage=Object.fromEntries(['jp','kana','romaji','fr'].map(k=>[k,[context,reason].map(id=>rowText(byId.get(id))[k]).join(' ')]));
    out.push({type:'particles',id:start+'-'+reason,activity:'Comparer',title:'から : début ou raison',source:start,sources:[start,context,reason],row:byId.get(start),prompt:'Dans quel passage から explique-t-il une raison, plutôt qu’un début dans le temps ?',texts:[rowText(byId.get(start)),passage],options:[{value:start,label:'Passage A'},{value:reason,label:'Passage B · demande puis raison'}],accepted:[reason],explanation:'A contient 四月から (shigatsu kara), « depuis avril » : le début de la période de travail. Dans B, la demande de patienter est suivie de 今調べますから : la vérification justifie cette demande. Les deux répliques sont conservées pour comprendre la raison.',grammarCards:['G11','G24'],reference:foundation+126});
   }
  }
  return out;
 }
 const api={build,masked,cases};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Particules=api;
})(globalThis);
