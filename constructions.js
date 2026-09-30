/* Exercices créés pour l’atelier, distincts des citations du cours.
   Chaque source est un appui requis dans le périmètre, y compris pour les choix. */
(function(root){
 'use strict';
 const T=s=>{const [jp,kana,romaji,fr]=s.split('|');return {jp,kana,romaji,fr};};
 const definitions=[];
 const choice=(id,activity,title,prompt,sources,grammarCards,options,answer,explanation,given)=>definitions.push({id,type:'constructions',activity,title,prompt,sources,grammarCards,options:options.map((s,i)=>({id:'c'+i,...T(s)})),accepted:['c'+answer],explanation,given:given?T(given):null});
 const order=(id,title,prompt,sources,grammarCards,groups,acceptedOrders,translation,explanation)=>definitions.push({id,type:'constructions',activity:'Ordonner',title,prompt,sources,grammarCards,groups:groups.map((s,i)=>({id:'g'+i,...T(s)})),acceptedOrders:acceptedOrders.map(a=>a.map(i=>'g'+i)),translation,explanation});
 choice('C01','Choisir','Annoncer une destination','Tu annonces où tu vas : « Je vais au grand magasin. » Choisis la phrase qui donne cette destination.',['N5-S02','N6-S04','N4-S06'],['G09','G10','G08'],[
 'デパートへ行きます。|デパートへいきます。|depaato e ikimasu.|Je vais au grand magasin.',
 'バスで行きます。|バスでいきます。|basu de ikimasu.|J’y vais en bus.',
 'デパートがあります。|デパートがあります。|depaato ga arimasu.|Il y a un grand magasin.'
 ],0,'デパートへ行きます donne la destination. バスで行きます précise le transport ; デパートがあります annonce la présence d’un grand magasin. Les trois phrases sont possibles, mais elles ne transmettent pas la même information.');
 choice('C02','Choisir','Faire un choix au café','Au café, tu annonces ton choix : « Je prendrai un café. » Choisis la construction qui exprime explicitement ce choix.',['N12-S05','N3-S05','N3-S06','N4-S06'],['G21','G06','G08'],[
 'コーヒーを飲みます。|コーヒーをのみます。|koohii o nomimasu.|Je bois du café.',
 'コーヒーにします。|コーヒーにします。|koohii ni shimasu.|Je prendrai un café.',
 'コーヒーがあります。|コーヒーがあります。|koohii ga arimasu.|Il y a du café.'
 ],1,'にします annonce ici une décision. 飲みます parle de boire ; あります indique la présence. Une phrase sur ce que l’on va boire peut aussi être comprise au café, mais la consigne demande la construction qui marque explicitement le choix.');
 choice('C03','Choisir','Situer un objet présent','Tu veux dire : « Il y a un livre dans la valise. » Choisis la phrase qui donne toute cette information.',['N4-S04','N4-S06','N4-S10'],['G08'],[
 'トランクの中に本がありません。|トランクのなかにほんがありません。|toranku no naka ni hon ga arimasen.|Il n’y a pas de livre dans la valise.',
 '本があります。|ほんがあります。|hon ga arimasu.|Il y a un livre.',
 'トランクの中に本があります。|トランクのなかにほんがあります。|toranku no naka ni hon ga arimasu.|Il y a un livre dans la valise.'
 ],2,'トランクの中に situe le livre ; 本があります en annonce la présence. ありません nierait cette présence. 本があります seul ne précise pas où est le livre.');
 choice('C04','Choisir','Dire ce que l’on va faire','Tu veux dire : « Je vais faire des achats. » Choisis la phrase qui exprime le but du déplacement.',['N14-S10','N5-S02','N6-S04'],['G22','G09','G10'],[
 '買物に行きます。|かいものにいきます。|kaimono ni ikimasu.|Je vais faire des achats.',
 'デパートへ行きます。|デパートへいきます。|depaato e ikimasu.|Je vais au grand magasin.',
 'バスで行きます。|バスでいきます。|basu de ikimasu.|J’y vais en bus.'
 ],0,'買物に indique l’activité qui motive le déplacement. Aller au grand magasin peut avoir ce but, mais cette destination ne dit pas à elle seule ce que l’on va y faire. Le bus est le moyen de transport.');
 choice('C05','Choisir','Proposer une sortie ensemble','Tu proposes : « Allons au grand magasin. » Choisis la phrase qui fait cette proposition.',['N1-S02','N5-S02','N7-S04'],['G15','G05'],[
 'デパートへ行きます。|デパートへいきます。|depaato e ikimasu.|Je vais au grand magasin.',
 'デパートへ行きません。|デパートへいきません。|depaato e ikimasen.|Je ne vais pas au grand magasin.',
 'デパートへ行きましょう。|デパートへいきましょう。|depaato e ikimashou.|Allons au grand magasin.'
 ],2,'行きましょう propose de faire le déplacement ensemble. 行きます annonce l’action ; 行きません la nie.');
 choice('C06','Transformer','Nier une action','Transforme la phrase pour dire : « Je ne bois pas de café. »',['N3-S05','N3-S06','N3-S08'],['G05','G06'],[
 'コーヒーを飲みます。|コーヒーをのみます。|koohii o nomimasu.|Je bois du café.',
 'コーヒーを飲みません。|コーヒーをのみません。|koohii o nomimasen.|Je ne bois pas de café.',
 'コーヒーを飲みますか。|コーヒーをのみますか。|koohii o nomimasu ka.|Buvez-vous du café ?'
 ],1,'飲みます devient 飲みません pour nier l’action au non-passé. Ajouter か forme une question, pas une négation.','コーヒーを飲みます。|コーヒーをのみます。|koohii o nomimasu.|Je bois du café.');
 choice('C07','Transformer','Raconter un déplacement passé','Transforme la phrase pour dire : « Je suis allé au grand magasin. »',['N5-S02','N7-S02','N7-S04'],['G05','G09'],[
 'デパートへ行きません。|デパートへいきません。|depaato e ikimasen.|Je ne vais pas au grand magasin.',
 'デパートへ行きます。|デパートへいきます。|depaato e ikimasu.|Je vais au grand magasin.',
 'デパートへ行きました。|デパートへいきました。|depaato e ikimashita.|Je suis allé au grand magasin.'
 ],2,'行きます devient 行きました pour raconter le déplacement passé. 行きません est une négation au non-passé.','デパートへ行きます。|デパートへいきます。|depaato e ikimasu.|Je vais au grand magasin.');
 choice('C08','Transformer','Nier un déplacement passé','Transforme la phrase pour dire : « Je ne suis pas allé au grand magasin. »',['N5-S02','N7-S02','N7-S04','N21-S03'],['G05','G09'],[
 'デパートへ行きませんでした。|デパートへいきませんでした。|depaato e ikimasen deshita.|Je ne suis pas allé au grand magasin.',
 'デパートへ行きません。|デパートへいきません。|depaato e ikimasen.|Je ne vais pas au grand magasin.',
 'デパートへ行きました。|デパートへいきました。|depaato e ikimashita.|Je suis allé au grand magasin.'
 ],0,'行きませんでした combine négation et passé. 行きません ne situe pas la négation dans le passé ; 行きました affirme que le déplacement a eu lieu.','デパートへ行きます。|デパートへいきます。|depaato e ikimasu.|Je vais au grand magasin.');
 choice('C09','Transformer','Passer du passé au non-passé','Transforme la phrase pour annoncer un déplacement à venir : « Je vais au grand magasin. »',['N5-S02','N7-S02','N7-S04'],['G05','G09'],[
 'デパートへ行きました。|デパートへいきました。|depaato e ikimashita.|Je suis allé au grand magasin.',
 'デパートへ行きます。|デパートへいきます。|depaato e ikimasu.|Je vais au grand magasin.',
 'デパートへ行きません。|デパートへいきません。|depaato e ikimasen.|Je ne vais pas au grand magasin.'
 ],1,'行きました devient 行きます. Le non-passé japonais peut décrire une habitude ou un futur ; ici, la consigne annonce un déplacement à venir.','デパートへ行きました。|デパートへいきました。|depaato e ikimashita.|Je suis allé au grand magasin.');
 order('C10','Construire une action simple','Construis : « Je bois du café. »',['N3-S05','N3-S06'],['G06','G05'],[
 'コーヒーを|コーヒーを|koohii o|du café, objet de boire',
 '飲みます|のみます|nomimasu|je bois'
 ],[[0,1]],'Je bois du café.','Le groupe コーヒーを précède ici le verbe 飲みます. On travaille la phrase neutre avec le verbe à la fin.');
 order('C11','Construire une phrase de présence','Construis : « Il y a un livre dans la valise. »',['N4-S04','N4-S06'],['G08','G03'],[
 'トランクの中に|トランクのなかに|toranku no naka ni|dans la valise',
 '本が|ほんが|hon ga|un livre, dont on annonce la présence',
 'あります|あります|arimasu|il y a'
 ],[[0,1,2],[1,0,2]],'Il y a un livre dans la valise.','Le lieu et le groupe 本が peuvent échanger leur place avant あります. Les deux ordres proposés sont acceptés ; les particules restent attachées à leur groupe.');
 order('C12','Placer le moment et l’objet','Construis : « Demain, j’achèterai des chaussettes. »',['N2-S07','N5-S05'],['G05','G06'],[
 '明日|あした|ashita|demain',
 '靴下を|くつしたを|kutsushita o|des chaussettes, objet de l’achat',
 '買います|かいます|kaimasu|j’achète / j’achèterai'
 ],[[0,1,2],[1,0,2]],'Demain, j’achèterai des chaussettes.','明日 et 靴下を peuvent échanger leur place avant 買います. 明日 situe cette action dans le futur ; on garde la forme polie du non-passé.');
 order('C13','Associer accompagnement et transport','Construis : « J’y vais en train avec un ami. »',['N21-S01','N6-S06','N8-S02'],['G10','G12'],[
 '友達と|ともだちと|tomodachi to|avec un ami',
 '電車で|でんしゃで|densha de|en train',
 '行きます|いきます|ikimasu|j’y vais'
 ],[[0,1,2],[1,0,2]],'J’y vais en train avec un ami.','友達と indique avec qui ; 電車で indique le transport. Les deux groupes peuvent échanger leur place avant 行きます : ces deux ordres sont acceptés.');
 choice('C14','Relier','Justifier une demande','Complète pour dire : « Je vais vérifier maintenant, alors veuillez patienter un instant. »',['N22-S08','N22-S09','N3-S08'],['G24','G17'],[
 '今調べます。|いましらべます。|ima shirabemasu.|Je vais vérifier maintenant.',
 'ちょっとお待ちください。|ちょっとおまちください。|chotto omachi kudasai.|Veuillez patienter un instant.',
 '今調べません。|いましらべません。|ima shirabemasen.|Je ne vérifie pas maintenant.'
 ],1,'La vérification est la raison, avant から. La demande de patienter vient ensuite. Les deux répliques du cours sont ici réunies dans l’ordre « raison, puis demande ».','今調べますから、|いましらべますから、|ima shirabemasu kara,|Parce que je vais vérifier maintenant…');
 choice('C15','Relier','Relier une raison à une conséquence','Complète pour dire : « Comme il y a un immeuble en face, on ne voit rien. »',['N24-S11','N24-S03','N4-S06'],['G24','G08'],[
 '何も見えません。|なにもみえません。|nanimo miemasen.|On ne voit rien.',
 '駅から歩きます。|えきからあるきます。|eki kara arukimasu.|Je marche à partir de la gare.',
 'ビルがあります。|ビルがあります。|biru ga arimasu.|Il y a un immeuble.'
 ],0,'L’immeuble en face explique pourquoi on ne voit rien. から relie la raison à cette conséquence. 駅から désigne au contraire un point de départ. 何も見えません est repris comme groupe de sens déjà rencontré, sans demander d’en maîtriser toute la construction.','向かいにビルがありますから、|むかいにビルがありますから、|mukai ni biru ga arimasu kara,|Comme il y a un immeuble en face…');
 function build(rows){
  const byId=new Map(rows.map(r=>[r.Leçon+'-'+r.Ligne,r]));
  return definitions.filter(q=>q.sources.every(id=>byId.has(id))).map(q=>({...q,source:q.sources[0],row:byId.get(q.sources[0]),origin:'Exercice créé à partir des constructions du cours.'}));
 }
 function isCorrect(q,answer){
  if(q.activity==='Ordonner')return Array.isArray(answer)&&q.acceptedOrders.some(order=>order.length===answer.length&&order.every((id,i)=>id===answer[i]));
  return q.accepted.includes(answer);
 }
 function sentence(q,order){
  const groups=order.map(id=>q.groups.find(g=>g.id===id));
  return {jp:groups.map(g=>g.jp).join('')+'。',kana:groups.map(g=>g.kana).join('')+'。',romaji:groups.map(g=>g.romaji).join(' ')+'.',fr:q.translation};
 }
 const api={build,isCorrect,sentence};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Constructions=api;
})(globalThis);
