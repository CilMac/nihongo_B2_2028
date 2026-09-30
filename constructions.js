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

 // Deuxième lot : consolidation jusqu’à la leçon 24.
 choice("C16","Choisir","Demander ce que l’on achète","Tu connais le lieu de la sortie, mais pas l’achat prévu. Demande : « Qu’allez-vous acheter ? »",["N5-S01", "N5-S04", "N7-S03"],["G02", "G06", "G09"],["どこへ行きますか。|どこへいきますか。|doko e ikimasu ka.|Où allez-vous ?", "何を買いますか。|なにをかいますか。|nani o kaimasu ka.|Qu’allez-vous acheter ?", "カメラを買いますか。|カメラをかいますか。|kamera o kaimasu ka.|Allez-vous acheter un appareil photo ?"],1,"何を remplace l’objet inconnu de 買います. どこへ demande la destination ; la question avec カメラ porte déjà sur un objet précis.",null);
 choice("C17","Choisir","Situer une personne","Annonce simplement : « Il y a un enfant. »",["N15-S04", "N4-S06", "N8-S02"],["G08", "G05"],["子供がいます。|こどもがいます。|kodomo ga imasu.|Il y a un enfant.", "本があります。|ほんがあります。|hon ga arimasu.|Il y a un livre.", "友達が来ます。|ともだちがきます。|tomodachi ga kimasu.|Un ami vient."],0,"います sert ici à annoncer la présence d’un enfant. あります accompagne un objet comme 本 ; 来ます annonce la venue d’un ami, pas simplement sa présence.",null);
 choice("C18","Choisir","Indiquer un instrument","Tu précises comment tu manges : « Je mange avec une fourchette. »",["N9-S08", "N9-S09", "N3-S03"],["G10", "G06"],["パンを食べます。|パンをたべます。|pan o tabemasu.|Je mange du pain.", "フォークをください。|フォークをください。|fooku o kudasai.|Une fourchette, s’il vous plaît.", "フォークで食べます。|フォークでたべます。|fooku de tabemasu.|Je mange avec une fourchette."],2,"フォークで indique l’instrument utilisé pour manger. フォークをください demande une fourchette ; パンを indique ce que l’on mange.",null);
 choice("C19","Choisir","Donner une heure","Réponds précisément : « Je me lève à onze heures. »",["N11-S01", "N11-S02", "N11-S05"],["G09", "G05"],["何時に起きますか。|なんじにおきますか。|nanji ni okimasu ka.|À quelle heure vous levez-vous ?", "十一時に起きます。|じゅういちじにおきます。|juuichiji ni okimasu.|Je me lève à onze heures.", "三時に寝ます。|さんじにねます。|sanji ni nemasu.|Je me couche à trois heures."],1,"十一時に donne l’heure précise du lever. 何時に la demande. 寝ます parle du coucher : le verbe change aussi le sens de la phrase.",null);
 choice("C20","Choisir","Distinguer lieu de vie et lieu de travail","Tu présentes ton lieu de résidence : « J’habite à Tokyo. »",["N15-S02", "N14-S03", "N5-S02"],["G18", "G10", "G09"],["東京へ行きます。|とうきょうへいきます。|toukyou e ikimasu.|Je vais à Tokyo.", "デパートで働いています。|デパートではたらいています。|depaato de hataraite imasu.|Je travaille dans un grand magasin.", "東京に住んでいます。|とうきょうにすんでいます。|toukyou ni sunde imasu.|J’habite à Tokyo."],2,"住んでいます décrit la situation durable d’habiter quelque part ; le lieu est suivi de に. 行きます décrit un déplacement et 働いています une activité professionnelle.",null);
 choice("C21","Choisir","Demander à voir un livre","À la librairie, demande : « Montrez-moi ce livre, s’il vous plaît. »",["N18-S06", "N18-S10", "N18-S13", "N17-S11"],["G17", "G04", "G21"],["この本を見せてください。|このほんをみせてください。|kono hon o misete kudasai.|Montrez-moi ce livre, s’il vous plaît.", "これにします。|これにします。|kore ni shimasu.|Je prends celui-ci.", "これをください。|これをください。|kore o kudasai.|Donnez-moi celui-ci, s’il vous plaît."],0,"見せてください demande à voir. これにします annonce le choix ; これをください demande l’objet. この doit accompagner un nom, ici 本.",null);
 choice("C22","Choisir","Relier un type et un nom","Choisis le groupe qui signifie « un livre de cuisine ».",["N18-S06", "N19-S02", "N21-S10"],["G03", "G13"],["この写真|このしゃしん|kono shashin|cette photo", "料理の本|りょうりのほん|ryouri no hon|un livre de cuisine", "古い本|ふるいほん|furui hon|un vieux livre"],1,"Dans 料理の本, le nom principal est 本. 料理 précise le sujet du livre grâce à の. 古い décrit son ancienneté ; この写真 désigne une photo.",null);
 choice("C23","Choisir","Choisir une activité de sortie","Propose : « Et si nous allions pique-niquer ? »",["N16-S03", "N14-S10", "N5-S02"],["G15", "G22"],["買物に行きましょう。|かいものにいきましょう。|kaimono ni ikimashou.|Allons faire des achats.", "デパートへ行きます。|デパートへいきます。|depaato e ikimasu.|Je vais au grand magasin.", "ピクニックに行きましょうか。|ピクニックにいきましょうか。|pikunikku ni ikimashou ka.|Et si nous allions pique-niquer ?"],2,"ピクニックに donne le but du déplacement ; 行きましょうか soumet la sortie à l’autre personne. Les deux autres phrases concernent un autre projet.",null);
 choice("C24","Choisir","Décrire un film au passé","Tu as vu le film hier. Dis : « C’était intéressant. »",["N8-S07", "N6-S09", "N21-S09"],["G13"],["おもしろかったです。|おもしろかったです。|omoshirokatta desu.|C’était intéressant.", "おもしろいです。|おもしろいです。|omoshiroi desu.|C’est intéressant.", "おもしろくありません。|おもしろくありません。|omoshiroku arimasen.|Ce n’est pas intéressant."],0,"Le passé de おもしろい est おもしろかった. Avec です, la phrase reste polie. おもしろくありません nie l’intérêt du film, sans exprimer ici le passé.",null);
 choice("C25","Choisir","Dire aussi","Quelqu’un annonce qu’il travaille au grand magasin. Dis que son ami y travaille aussi.",["N14-S03", "N14-S04", "N8-S02"],["G12", "G18", "G07"],["友達が来ます。|ともだちがきます。|tomodachi ga kimasu.|Un ami vient.", "友達もデパートで働いています。|ともだちもデパートではたらいています。|tomodachi mo depaato de hataraite imasu.|Un ami travaille lui aussi au grand magasin.", "友達が来ました。|ともだちがきました。|tomodachi ga kimashita.|Un ami est venu."],1,"も ajoute l’ami aux personnes qui travaillent dans ce lieu. Le contexte fournit l’information commune ; 来ます et 来ました parlent d’une venue.",null);
 choice("C26","Transformer","Poser une question sur une action","Transforme l’affirmation en question : « Mangez-vous du pain ? »",["N3-S03", "N3-S04", "N3-S10"],["G02", "G05"],["パンを食べません。|パンをたべません。|pan o tabemasen.|Je ne mange pas de pain.", "パンを食べます。|パンをたべます。|pan o tabemasu.|Je mange du pain.", "パンを食べますか。|パンをたべますか。|pan o tabemasu ka.|Mangez-vous du pain ?"],2,"On ajoute か après 食べます pour poser la question polie, sans changer l’ordre des mots. 食べません est une négation.","パンを食べます。|パンをたべます。|pan o tabemasu.|Je mange du pain.");
 choice("C27","Transformer","Nier ce que l’on mange","Transforme en négation : « Je ne mange pas de pain. »",["N3-S03", "N3-S04", "N3-S10"],["G05"],["パンを食べません。|パンをたべません。|pan o tabemasen.|Je ne mange pas de pain.", "パンを食べますか。|パンをたべますか。|pan o tabemasu ka.|Mangez-vous du pain ?", "パンを食べます。|パンをたべます。|pan o tabemasu.|Je mange du pain."],0,"La terminaison ます devient ません. La négation porte sur manger ; le groupe パンを reste l’objet.","パンを食べます。|パンをたべます。|pan o tabemasu.|Je mange du pain.");
 choice("C28","Transformer","Raconter un film regardé","Transforme au passé : « J’ai regardé un film. »",["N8-S05", "N10-S05", "N7-S10"],["G05"],["映画を見ません。|えいがをみません。|eiga o mimasen.|Je ne regarde pas de film.", "映画を見ました。|えいがをみました。|eiga o mimashita.|J’ai regardé un film.", "映画を見ます。|えいがをみます。|eiga o mimasu.|Je regarde un film."],1,"見ます devient 見ました. Le groupe 映画を ne change pas ; c’est la terminaison du verbe qui situe l’action dans le passé.","映画を見ます。|えいがをみます。|eiga o mimasu.|Je regarde un film.");
 choice("C29","Transformer","Nier une venue passée","Transforme en négation passée : « Un ami n’est pas venu. »",["N8-S02", "N13-S05"],["G05", "G07"],["友達が来ます。|ともだちがきます。|tomodachi ga kimasu.|Un ami vient.", "友達が来ました。|ともだちがきました。|tomodachi ga kimashita.|Un ami est venu.", "友達が来ませんでした。|ともだちがきませんでした。|tomodachi ga kimasen deshita.|Un ami n’est pas venu."],2,"来ました devient 来ませんでした. Les lectures sont kimashita et kimasen deshita : le passé négatif conserve でした après ません.","友達が来ました。|ともだちがきました。|tomodachi ga kimashita.|Un ami est venu.");
 choice("C30","Transformer","Parler du prochain lever","Transforme au non-passé : « Je me lève à onze heures. »",["N11-S02", "N11-S06", "N13-S05"],["G05", "G09"],["十一時に起きます。|じゅういちじにおきます。|juuichiji ni okimasu.|Je me lève à onze heures.", "十一時に起きました。|じゅういちじにおきました。|juuichiji ni okimashita.|Je me suis levé à onze heures.", "十一時に起きませんでした。|じゅういちじにおきませんでした。|juuichiji ni okimasen deshita.|Je ne me suis pas levé à onze heures."],0,"起きました devient 起きます. La forme du non-passé convient à une habitude ou, selon le contexte, à une action à venir.","十一時に起きました。|じゅういちじにおきました。|juuichiji ni okimashita.|Je me suis levé à onze heures.");
 choice("C31","Transformer","Nier une présence","Transforme pour dire : « Il n’y a pas de livre. »",["N4-S06", "N4-S10", "N15-S04"],["G08"],["本があります。|ほんがあります。|hon ga arimasu.|Il y a un livre.", "本がありません。|ほんがありません。|hon ga arimasen.|Il n’y a pas de livre.", "子供がいます。|こどもがいます。|kodomo ga imasu.|Il y a un enfant."],1,"あります devient ありません pour nier la présence de l’objet. います s’emploie ici pour un enfant et ne répond pas à la transformation demandée.","本があります。|ほんがあります。|hon ga arimasu.|Il y a un livre.");
 choice("C32","Transformer","Nier une description","Transforme pour dire : « Ce n’est pas intéressant. »",["N6-S09", "N8-S07", "N21-S09"],["G13"],["おもしろいです。|おもしろいです。|omoshiroi desu.|C’est intéressant.", "おもしろかったです。|おもしろかったです。|omoshirokatta desu.|C’était intéressant.", "おもしろくありません。|おもしろくありません。|omoshiroku arimasen.|Ce n’est pas intéressant."],2,"Pour cette négation polie, on remplace le い final par くありません : おもしろくありません. おもしろかったです exprime un passé affirmatif.","おもしろいです。|おもしろいです。|omoshiroi desu.|C’est intéressant.");
 choice("C33","Transformer","Mettre une description au passé","Transforme pour dire : « C’était intéressant. »",["N6-S09", "N8-S07", "N21-S09"],["G13"],["おもしろかったです。|おもしろかったです。|omoshirokatta desu.|C’était intéressant.", "おもしろくありません。|おもしろくありません。|omoshiroku arimasen.|Ce n’est pas intéressant.", "おもしろいです。|おもしろいです。|omoshiroi desu.|C’est intéressant."],0,"Le い final devient かった : おもしろかった. です ajoute la politesse ; on ne met pas ici でした après おもしろい.","おもしろいです。|おもしろいです。|omoshiroi desu.|C’est intéressant.");
 choice("C34","Transformer","Passer de l’annonce à la proposition","Transforme pour proposer : « Regardons un film. »",["N8-S05", "N10-S05", "N1-S02", "N3-S08"],["G15", "G05"],["映画を見ます。|えいがをみます。|eiga o mimasu.|Je regarde un film.", "映画を見ましょう。|えいがをみましょう。|eiga o mimashou.|Regardons un film.", "映画を見ません。|えいがをみません。|eiga o mimasen.|Je ne regarde pas de film."],1,"見ます devient 見ましょう pour proposer l’action commune. La forme négative 見ません ne fait pas cette proposition.","映画を見ます。|えいがをみます。|eiga o mimasu.|Je regarde un film.");
 choice("C35","Transformer","Interroger sur une présence","Transforme pour demander : « Y a-t-il un enfant ? »",["N15-S04", "N4-S05", "N8-S02"],["G02", "G08"],["子供がいます。|こどもがいます。|kodomo ga imasu.|Il y a un enfant.", "友達が来ます。|ともだちがきます。|tomodachi ga kimasu.|Un ami vient.", "子供がいますか。|こどもがいますか。|kodomo ga imasu ka.|Y a-t-il un enfant ?"],2,"La question se forme en ajoutant か après います. Le groupe 子供が et l’ordre des mots restent identiques.","子供がいます。|こどもがいます。|kodomo ga imasu.|Il y a un enfant.");
 order("C36","Acheter un livre de cuisine","Construis : « J’achète un livre de cuisine. »",["N18-S06", "N5-S05"],["G03", "G06", "G05"],["料理の本を|りょうりのほんを|ryouri no hon o|un livre de cuisine, objet", "買います|かいます|kaimasu|j’achète"],[[0, 1]],"J’achète un livre de cuisine.","料理の précise le type de 本. L’ensemble 料理の本を est placé avant 買います ; の relie les noms et を marque l’objet.");
 order("C37","Téléphoner demain","Construis : « Demain, je téléphonerai à un ami. »",["N13-S10", "N2-S07"],["G23", "G05"],["明日|あした|ashita|demain", "友達に|ともだちに|tomodachi ni|à un ami", "電話をします|でんわをします|denwa o shimasu|je téléphone"],[[0, 1, 2], [1, 0, 2]],"Demain, je téléphonerai à un ami.","明日 et 友達に peuvent échanger leur place devant 電話をします. に marque ici le destinataire de l’appel ; les deux ordres sont acceptés.");
 order("C38","Attendre devant la gare","Construis : « J’ai attendu une heure devant la gare. »",["N13-S01", "N14-S07"],["G10", "G05"],["駅の前で|えきのまえで|eki no mae de|devant la gare", "一時間|いちじかん|ichijikan|pendant une heure", "待ちました|まちました|machimashita|j’ai attendu"],[[0, 1, 2], [1, 0, 2]],"J’ai attendu une heure devant la gare.","で situe l’action d’attendre. 一時間 donne sa durée sans に. Les deux groupes peuvent précéder 待ちました dans l’un ou l’autre ordre.");
 order("C39","Préciser le moyen et l’objet","Construis : « Je mange du pain avec une fourchette. »",["N3-S03", "N9-S08"],["G06", "G10"],["フォークで|フォークで|fooku de|avec une fourchette", "パンを|パンを|pan o|du pain", "食べます|たべます|tabemasu|je mange"],[[0, 1, 2], [1, 0, 2]],"Je mange du pain avec une fourchette.","で accompagne l’instrument ; を accompagne ce que l’on mange. Les groupes peuvent être intervertis avant le verbe, qui reste à la fin.");
 order("C40","Acheter un vieux livre","Construis : « J’achète un vieux livre. »",["N21-S10","N5-S05"],["G13","G06"],["古い|ふるい|furui|vieux","本を|ほんを|hon o|un livre, objet","買います|かいます|kaimasu|j’achète"],[[0,1,2]],"J’achète un vieux livre.","古い se place directement devant 本 : on n’ajoute ni の ni な. Le groupe 古い本を précède le verbe 買います.");
 order("C41","Demander à voir des livres","Construis : « Montrez-moi des livres de cuisine, s’il vous plaît. »",["N18-S06"],["G03", "G17"],["料理の本を|りょうりのほんを|ryouri no hon o|des livres de cuisine", "見せてください|みせてください|misete kudasai|montrez-moi, s’il vous plaît"],[[0, 1]],"Montrez-moi des livres de cuisine, s’il vous plaît.","料理の本を désigne ce que l’on demande à voir. 見せてください réunit la forme en て et ください ; on garde cette demande à la fin.");
 order("C42","Partir de la gare","Construis : « Je marche de la gare jusqu’au grand magasin. »",["N6-S07", "N5-S02"],["G11"],["駅から|えきから|eki kara|de la gare", "デパートまで|デパートまで|depaato made|jusqu’au grand magasin", "歩きます|あるきます|arukimasu|je marche"],[[0, 1, 2], [1, 0, 2]],"Je marche de la gare jusqu’au grand magasin.","から marque le départ et まで la limite. On présente habituellement le départ avant la limite ; l’ordre inverse reste possible avec ces particules et est accepté.");
 order("C43","Annoncer son choix complet","Construis : « Pour moi, ce sera un café et une pâtisserie. » En commençant par « pour moi ».",["N14-S08", "N12-S07"],["G01", "G12", "G21"],["私は|わたしは|watashi wa|pour moi", "コーヒーとお菓子に|コーヒーとおかしに|koohii to okashi ni|un café et une pâtisserie, choix", "します|します|shimasu|je décide"],[[0, 1, 2]],"Pour moi, ce sera un café et une pâtisserie.","La consigne place 私は en tête. と relie les deux éléments choisis ; にします annonce la décision. に s’attache ici à l’ensemble du choix.");
 choice("C44","Relier","Expliquer pourquoi on renonce","Complète pour dire : « Comme c’est cher, je n’achète pas d’appareil photo. »",["N7-S03", "N7-S04", "N22-S09", "N24-S11"],["G24", "G05", "G06"],["カメラを買いません。|カメラをかいません。|kamera o kaimasen.|Je n’achète pas d’appareil photo.", "カメラを買います。|カメラをかいます。|kamera o kaimasu.|J’achète un appareil photo.", "カメラを買いました。|カメラをかいました。|kamera o kaimashita.|J’ai acheté un appareil photo."],0,"La raison 高いですから est suivie de la décision négative 買いません. Les autres suites sont grammaticales, mais ne disent pas que l’on renonce à cet achat.","高いですから、|たかいですから、|takai desu kara,|Comme c’est cher…");
 choice("C45","Relier","Donner une raison puis son choix","Complète pour dire : « Comme c’est intéressant, je regarderai ce film. »",["N6-S09", "N8-S05", "N21-S09", "N22-S09", "N24-S11"],["G24", "G05", "G04"],["この映画を見ません。|このえいがをみません。|kono eiga o mimasen.|Je ne regarderai pas ce film.", "この映画を見ます。|このえいがをみます。|kono eiga o mimasu.|Je regarderai ce film.", "この映画を見ました。|このえいがをみました。|kono eiga o mimashita.|J’ai regardé ce film."],1,"見ます annonce ici l’action à venir, motivée par おもしろいですから. 見ません exprimerait un refus et 見ました raconterait une action passée.","おもしろいですから、|おもしろいですから、|omoshiroi desu kara,|Comme c’est intéressant…");
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
