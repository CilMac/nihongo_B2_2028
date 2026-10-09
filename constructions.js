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
 // BEGIN CONSOLIDATION 01-24
/* Source éditoriale C46–C63. Insérée dans constructions.js par construire_consolidation.cjs.
   Les helpers choice/order sont ceux du module. Dialogues créés, non citations. */
choice('C46','Dialoguer','Refuser une boisson','Au petit-déjeuner, on te propose de la bière. Réponds que tu n’en bois pas.',['N3-S05','N3-S06','N3-S07','N3-S08'],['G02','G05'],[
 '飲みます。|のみます。|nomimasu.|J’en bois.',
 '飲みません。|のみません。|nomimasen.|Je n’en bois pas.',
 'コーヒーを飲みますか。|コーヒーをのみますか。|koohii o nomimasu ka.|Voulez-vous du café ?'
],1,'La question porte déjà sur la bière : 飲みません suffit, sans répéter ビールを. 飲みます accepterait ; la troisième réponse poserait une nouvelle question. La forme en ません exprime ici la négation.','ビールを飲みますか。|ビールをのみますか。|biiru o nomimasu ka.|Voulez-vous de la bière ?');
choice('C47','Dialoguer','Répondre sur le contenu de la valise','À la douane, indique que la valise contient des vêtements et des livres.',['N4-S04','N4-S05','N4-S06','N4-S10'],['G08','G12'],[
 'トランクの中にあります。|トランクのなかにあります。|toranku no naka ni arimasu.|C’est dans la valise.',
 'ありません。|ありません。|arimasen.|Il n’y en a pas.',
 '服と本があります。|ふくとほんがあります。|fuku to hon ga arimasu.|Il y a des vêtements et des livres.'
],2,'何が demande ce qui est présent. 服と本 donne cette information, et が accompagne l’ensemble. Répéter seulement le lieu ne répond pas à « quoi ? ». ありません nierait la présence.','トランクの中に何がありますか。|トランクのなかになにがありますか。|toranku no naka ni nani ga arimasu ka.|Qu’y a-t-il dans la valise ?');
choice('C48','Dialoguer','Répondre sur un achat','Tu vas acheter des chaussettes. Réponds à la question sur ton achat, en nommant cet objet.',['N5-S01','N5-S02','N5-S04','N5-S05','N5-S08'],['G02','G06'],[
 '靴下を買います。|くつしたをかいます。|kutsushita o kaimasu.|Je vais acheter des chaussettes.',
 'デパートへ行きます。|デパートへいきます。|depaato e ikimasu.|Je vais au grand magasin.',
 'ここに靴下があります。|ここにくつしたがあります。|koko ni kutsushita ga arimasu.|Il y a des chaussettes ici.'
],0,'何を demande l’objet de 買います. On remplace 何 par 靴下 et on conserve を. La destination du déplacement et la présence des chaussettes sont d’autres informations.','何を買いますか。|なにをかいますか。|nani o kaimasu ka.|Qu’allez-vous acheter ?');
choice('C49','Dialoguer','Répondre sur un horaire','Tu te lèves habituellement à onze heures. Donne cette heure de lever.',['N11-S01','N11-S02','N11-S05','N11-S06'],['G02','G09','G05'],[
 '夜中の三時に寝ます。|よなかのさんじにねます。|yonaka no sanji ni nemasu.|Je me couche à trois heures du matin.',
 '十一時に起きます。|じゅういちじにおきます。|juuichiji ni okimasu.|Je me lève à onze heures.',
 '今日は十時に起きました。|きょうはじゅうじにおきました。|kyou wa juuji ni okimashita.|Aujourd’hui, je me suis levé à dix heures.'
],1,'十一時に répond à 何時に : に marque ici une heure précise. 寝ます parle du coucher ; 起きました raconte un lever passé à une autre heure.','朝何時に起きますか。|あさなんじにおきますか。|asa nanji ni okimasu ka.|À quelle heure vous levez-vous le matin ?');
choice('C50','Dialoguer','Répondre à une question au passé','Ton ami n’est pas venu au rendez-vous. Réponds à la question en niant sa venue passée.',['N13-S04','N13-S05'],['G02','G05'],[
 '来ません。|きません。|kimasen.|Il ne vient pas / ne viendra pas.',
 '来ました。|きました。|kimashita.|Il est venu.',
 '来ませんでした。|きませんでした。|kimasen deshita.|Il n’est pas venu.'
],2,'来ませんでした nie une venue passée. 来ません est la négation au non-passé ; 来ました affirme la venue. Le sujet, connu dans cet échange, n’a pas besoin d’être répété.','来ましたか。|きましたか。|kimashita ka.|Il est venu ?');
choice('C51','Dialoguer','Répondre sur la distance','On te demande si c’est loin. Tu veux dire que ce n’est pas loin, sans donner d’itinéraire.',['N20-S03','N20-S04','N20-S06'],['G02','G13'],[
 '遠くありません。|とおくありません。|tooku arimasen.|Ce n’est pas loin.',
 '遠いです。|とおいです。|tooi desu.|C’est loin.',
 '本屋の隣です。|ほんやのとなりです。|honya no tonari desu.|C’est à côté de la librairie.'
],0,'遠い devient 遠くありません à cette forme négative polie. La troisième réponse situe le lieu, mais n’affirme pas qu’il est proche. 遠いです dit le contraire du sens demandé.','遠いですか。|とおいですか。|tooi desu ka.|Est-ce loin ?');
choice('C52','Transformer','Passer du refus à l’acceptation','Au petit-déjeuner, change le refus en réponse affirmative : « J’en bois. »',['N3-S05','N3-S06','N3-S08'],['G05'],[
 '飲みますか。|のみますか。|nomimasu ka.|En buvez-vous ?',
 '飲みます。|のみます。|nomimasu.|J’en bois.',
 '飲みません。|のみません。|nomimasen.|Je n’en bois pas.'
],1,'On remplace ません par ます pour passer de la négation à l’affirmation au non-passé. Ajouter か formerait une question. La boisson reste implicite dans cet échange.','飲みません。|のみません。|nomimasen.|Je n’en bois pas.');
choice('C53','Transformer','Questionner sur un objet','À partir de l’annonce, demande si la personne va acheter un appareil photo.',['N7-S03','N7-S04'],['G02','G05','G06'],[
 'カメラを買いません。|カメラをかいません。|kamera o kaimasen.|Je n’achète pas d’appareil photo.',
 'カメラを買います。|カメラをかいます。|kamera o kaimasu.|Je vais acheter un appareil photo.',
 'カメラを買いますか。|カメラをかいますか。|kamera o kaimasu ka.|Allez-vous acheter un appareil photo ?'
],2,'La question garde カメラを買います et ajoute か à la fin. Il n’y a pas d’inversion du verbe et de l’objet. La personne concernée se comprend dans le contexte.','カメラを買います。|カメラをかいます。|kamera o kaimasu.|Je vais acheter un appareil photo.');
choice('C54','Transformer','Raconter son lever','Transforme cette habitude en récit d’un lever passé : « Je me suis levé à onze heures. »',['N11-S02','N11-S06'],['G05','G09'],[
 '十一時に起きました。|じゅういちじにおきました。|juuichiji ni okimashita.|Je me suis levé à onze heures.',
 '十一時に起きます。|じゅういちじにおきます。|juuichiji ni okimasu.|Je me lève à onze heures.',
 '十時に起きました。|じゅうじにおきました。|juuji ni okimashita.|Je me suis levé à dix heures.'
],0,'起きます devient 起きました au passé affirmatif poli. 十一時に ne change pas : la transformation porte sur le temps du verbe, pas sur l’heure.','十一時に起きます。|じゅういちじにおきます。|juuichiji ni okimasu.|Je me lève à onze heures.');
choice('C55','Transformer','Corriger une absence passée','La première information était fausse : l’ami est bien venu. Transforme en affirmation passée.',['N13-S04','N13-S05'],['G05'],[
 '来ません。|きません。|kimasen.|Il ne vient pas / ne viendra pas.',
 '来ました。|きました。|kimashita.|Il est venu.',
 '来ませんでした。|きませんでした。|kimasen deshita.|Il n’est pas venu.'
],1,'Le contraire affirmatif passé de 来ませんでした est 来ました. On ne conserve pas ません. 来ません reste négatif et ne situe plus la venue au passé.','来ませんでした。|きませんでした。|kimasen deshita.|Il n’est pas venu.');
choice('C56','Transformer','Affirmer une qualité','Change le jugement pour dire : « Ce film est intéressant. »',['N21-S09','N6-S09','N8-S07'],['G04','G13'],[
 'この映画はおもしろかったです。|このえいがはおもしろかったです。|kono eiga wa omoshirokatta desu.|Ce film était intéressant.',
 'この映画はおもしろくありません。|このえいがはおもしろくありません。|kono eiga wa omoshiroku arimasen.|Ce film n’est pas intéressant.',
 'この映画はおもしろいです。|このえいがはおもしろいです。|kono eiga wa omoshiroi desu.|Ce film est intéressant.'
],2,'On retrouve la forme affirmative おもしろいです à partir de おもしろくありません. Le thème この映画は est conservé. おもしろかったです serait un jugement au passé.','この映画はおもしろくありません。|このえいがはおもしろくありません。|kono eiga wa omoshiroku arimasen.|Ce film n’est pas intéressant.');
choice('C57','Transformer','Poser une question sur le logement','Transforme l’affirmation en question neutre : « Est-ce pratique ? »',['N24-S04','N24-S08'],['G02','G14'],[
 '便利ですか。|べんりですか。|benri desu ka.|Est-ce pratique ?',
 '便利です。|べんりです。|benri desu.|C’est pratique.',
 '何階ですか。|なんがいですか。|nangai desu ka.|À quel étage est-ce ?'
],0,'On ajoute か après です : 便利ですか. 便利 est un adjectif en な, mais on ne met pas な devant です. La question 何階ですか porte sur l’étage, pas sur le caractère pratique.','便利です。|べんりです。|benri desu.|C’est pratique.');
order('C58','Reconstruire une question sur un achat','Construis : « Qu’allez-vous acheter ? »',['N5-S04'],['G02','G06'],[
 '何を|なにを|nani o|quoi, objet','買いますか|かいますか|kaimasu ka|allez-vous acheter'
],[[0,1]],'Qu’allez-vous acheter ?','何を est placé avant 買いますか. を reste avec le mot interrogatif et か ferme la question ; le français et le japonais n’utilisent pas le même ordre.');
order('C59','Situer des vêtements','Construis : « Il y a des vêtements dans la valise. »',['N4-S04','N4-S06'],['G03','G08'],[
 'トランクの中に|トランクのなかに|toranku no naka ni|dans la valise','服が|ふくが|fuku ga|des vêtements, sujet','あります|あります|arimasu|il y a'
],[[0,1,2],[1,0,2]],'Il y a des vêtements dans la valise.','に marque le lieu de présence et が ce qui est présent. Les deux groupes peuvent échanger leur place avant あります ; la présentation lieu puis objet est courante.');
order('C60','Associer destination et transport','Construis : « Je vais au grand magasin en train. »',['N5-S02','N6-S06'],['G09','G10'],[
 'デパートへ|デパートへ|depaato e|au grand magasin','電車で|でんしゃで|densha de|en train','行きます|いきます|ikimasu|je vais'
],[[0,1,2],[1,0,2]],'Je vais au grand magasin en train.','へ indique la destination et se prononce e ; で indique ici le moyen de transport. Changer l’ordre de ces deux groupes ne change pas leur rôle.');
order('C61','Commander deux boissons','Au café, construis : « Un café et une bière, s’il vous plaît. »',['N12-S07'],['G12','G06','G17'],[
 'コーヒーとビールを|コーヒーとビールを|koohii to biiru o|un café et une bière','ください|ください|kudasai|donnez-moi, s’il vous plaît'
],[[0,1]],'Un café et une bière, s’il vous plaît.','と relie les deux boissons. を accompagne toute la liste, suivie de ください. On garde ici la liste réunie pour travailler la construction de la demande.');
order('C62','Attendre quelqu’un','Construis : « J’ai attendu un ami devant le grand magasin. »',['N13-S01'],['G06','G10','G05'],[
 '友達を|ともだちを|tomodachi o|un ami, objet','デパートの前で|デパートのまえで|depaato no mae de|devant le grand magasin','待ちました|まちました|machimashita|j’ai attendu'
],[[0,1,2],[1,0,2]],'J’ai attendu un ami devant le grand magasin.','待ちます se construit avec を pour la personne attendue, même s’il s’agit d’une personne. で situe l’action. Les deux groupes peuvent être intervertis avant le verbe au passé.');
order('C63','Décrire son lieu de vie','Construis : « J’habite à Tokyo. »',['N15-S02'],['G09','G18'],[
 '東京に|とうきょうに|toukyou ni|à Tokyo','住んでいます|すんでいます|sunde imasu|j’habite'
],[[0,1]],'J’habite à Tokyo.','住んでいます décrit ici l’état de résidence. Le lieu où l’on habite est marqué par に. On ne remplace pas に par で sous prétexte que Tokyo est un lieu.');
 // END CONSOLIDATION 01-24
 // BEGIN LECON 25
/* Source éditoriale C64–C77 : tous les appuis sont dans la leçon 25.
   Les phrases et lectures recombinées sont créées pour l’entraînement. */
choice('C64','Choisir','Reconnaître la forme ordinaire','Tu prépares « avoir l’intention de publier ». Quel groupe doit précéder つもりです (tsumori desu) ?',['N25-S04','N25-S13'],['G25','G20'],[
 '出版します|しゅっぱんします|shuppan shimasu|je publie, forme polie',
 '出版する|しゅっぱんする|shuppan suru|publier, forme ordinaire',
 '出版しました|しゅっぱんしました|shuppan shimashita|j’ai publié, passé poli'
],1,'Avant つもりです, on emploie ici la forme du dictionnaire 出版する. Les deux autres groupes sont des formes polies utilisables en fin de phrase ; ils ne s’assemblent pas directement avec つもりです.');
choice('C65','Choisir','Exprimer un avis sur la longueur','Tu veux présenter explicitement ton avis : « Je pense que le roman est long. » Choisis cette tournure.',['N25-S01','N25-S11','N25-S12','N25-S09'],['G26','G27'],[
 '小説は長いです。|しょうせつはながいです。|shousetsu wa nagai desu.|Le roman est long.',
 '小説は長そうです。|しょうせつはながそうです。|shousetsu wa nagasou desu.|Le roman a l’air long.',
 '小説は長いと思います。|しょうせつはながいとおもいます。|shousetsu wa nagai to omoimasu.|Je pense que le roman est long.'
],2,'長いと思います présente explicitement une opinion. 長いです affirme le jugement ; 長そうです exprime une impression. Ces réponses peuvent convenir dans d’autres contextes, mais la consigne vise la tournure « je pense ».');
choice('C66','Choisir','Réagir à un résumé','On vient de te résumer l’histoire. Exprime précisément « Cela a l’air intéressant », sans affirmer que tu as lu le roman.',['N25-S07','N25-S08','N25-S09','N25-S11'],['G27','G26'],[
 'おもしろそうです。|おもしろそうです。|omoshirosou desu.|Cela a l’air intéressant.',
 'おもしろいです。|おもしろいです。|omoshiroi desu.|C’est intéressant.',
 'おもしろいと思います。|おもしろいとおもいます。|omoshiroi to omoimasu.|Je pense que c’est intéressant.'
],0,'おもしろそうです exprime l’impression demandée, ici à partir du résumé. と思います pourrait aussi exprimer un jugement prudent, mais la consigne demande la tournure « cela a l’air ». Le sens de そう ne se limite pas à l’apparence visible.');
choice('C67','Choisir','Distinguer total prévu et avancement','L’auteur estime la longueur finale à environ cinq cents pages. Choisis la réponse qui donne cette estimation, pas le nombre de pages déjà écrites.',['N25-S10','N25-S11','N25-S13','N25-S14','N25-S04'],['G26','G20'],[
 'まだ五ページです。|まだごページです。|mada go peeji desu.|Seulement cinq pages pour le moment.',
 '五百ページぐらいになると思います。|ごひゃくページぐらいになるとおもいます。|gohyaku peeji gurai ni naru to omoimasu.|Je pense que cela fera environ cinq cents pages.',
 '出版するつもりです。|しゅっぱんするつもりです。|shuppan suru tsumori desu.|J’ai l’intention de publier.'
],1,'五百ページぐらい est le total approximatif prévu ; なると思います le présente comme une estimation. まだ五ページです décrit l’avancement actuel. Le projet de publication ne donne pas le nombre de pages.');
choice('C68','Transformer','Passer de l’annonce au projet','Reformule pour dire explicitement : « J’ai l’intention de publier le roman. »',['N25-S01','N25-S04','N25-S13'],['G20','G25'],[
 '小説を出版しました。|しょうせつをしゅっぱんしました。|shousetsu o shuppan shimashita.|J’ai publié le roman.',
 '小説を出版しますか。|しょうせつをしゅっぱんしますか。|shousetsu o shuppan shimasu ka.|Allez-vous publier le roman ?',
 '小説を出版するつもりです。|しょうせつをしゅっぱんするつもりです。|shousetsu o shuppan suru tsumori desu.|J’ai l’intention de publier le roman.'
],2,'出版します devient 出版する devant つもりです. Le projet est explicite ; cela ne garantit pas qu’il se réalisera. La forme passée raconterait une publication déjà faite ; la question demanderait le projet à quelqu’un.','小説を出版します。|しょうせつをしゅっぱんします。|shousetsu o shuppan shimasu.|Je publierai le roman.');
choice('C69','Transformer','Présenter un jugement comme une opinion','Reformule « C’est un roman policier » en « Je pense que c’est un roman policier ».',['N25-S03','N25-S11'],['G25','G26'],[
 '推理小説だと思います。|すいりしょうせつだとおもいます。|suiri shousetsu da to omoimasu.|Je pense que c’est un roman policier.',
 '推理小説ですか。|すいりしょうせつですか。|suiri shousetsu desu ka.|Est-ce un roman policier ?',
 '推理小説です。|すいりしょうせつです。|suiri shousetsu desu.|C’est un roman policier.'
],0,'Après le nom 推理小説, la forme affirmative ordinaire conserve だ devant と : 推理小説だと思います. ですか pose une question ; です seul donne une affirmation directe.','推理小説です。|すいりしょうせつです。|suiri shousetsu desu.|C’est un roman policier.');
choice('C70','Transformer','Transformer un jugement en impression','À partir de « C’est long », exprime « Cela a l’air long ».',['N25-S12','N25-S09','N25-S11'],['G27','G26'],[
 '長いと思います。|ながいとおもいます。|nagai to omoimasu.|Je pense que c’est long.',
 '長そうです。|ながそうです。|nagasou desu.|Cela a l’air long.',
 '長いですか。|ながいですか。|nagai desu ka.|Est-ce long ?'
],1,'長い perd le い final devant そうです : 長そうです. 長いと思います présente un avis ; 長いですか demande une information.','長いです。|ながいです。|nagai desu.|C’est long.');
choice('C71','Transformer','Questionner sur une action en cours','Transforme l’annonce en question : « Écrivez-vous un roman en ce moment ? »',['N25-S01','N25-S04','N25-S13'],['G02','G18'],[
 '今小説を書いています。|いましょうせつをかいています。|ima shousetsu o kaite imasu.|J’écris un roman en ce moment.',
 'もうどのぐらい書きましたか。|もうどのぐらいかきましたか。|mou donogurai kakimashita ka.|Combien en avez-vous déjà écrit ?',
 '今小説を書いていますか。|いましょうせつをかいていますか。|ima shousetsu o kaite imasu ka.|Écrivez-vous un roman en ce moment ?'
],2,'On garde 今小説を書いています et on ajoute か. La question porte sur l’action en cours. もうどのぐらい書きましたか demande une quantité déjà écrite.','今小説を書いています。|いましょうせつをかいています。|ima shousetsu o kaite imasu.|J’écris un roman en ce moment.');
order('C72','Construire une action en cours','Construis : « J’écris un roman en ce moment. »',['N25-S01'],['G18','G06'],[
 '今|いま|ima|en ce moment','小説を|しょうせつを|shousetsu o|un roman, objet','書いています|かいています|kaite imasu|j’écris en ce moment'
],[[0,1,2],[1,0,2]],'J’écris un roman en ce moment.','今 et 小説を peuvent échanger leur place avant 書いています. を reste avec l’objet ; 書いています décrit ici une activité en cours.');
order('C73','Construire une intention de publier','Construis : « J’ai l’intention de publier le roman. »',['N25-S01','N25-S04'],['G25','G20'],[
 '小説を|しょうせつを|shousetsu o|le roman, objet','出版する|しゅっぱんする|shuppan suru|publier','つもりです|つもりです|tsumori desu|j’ai l’intention'
],[[0,1,2]],'J’ai l’intention de publier le roman.','Le groupe 小説を出版する décrit l’action envisagée. Il précède つもりです ; la forme ordinaire する et la terminaison polie です peuvent donc coexister.');
order('C74','Construire une estimation','Construis : « Je pense que cela fera environ cinq cents pages. »',['N25-S10','N25-S11'],['G25','G26'],[
 '五百ページぐらいに|ごひゃくページぐらいに|gohyaku peeji gurai ni|à environ cinq cents pages','なると|なると|naru to|que cela fera','思います|おもいます|omoimasu|je pense'
],[[0,1,2]],'Je pense que cela fera environ cinq cents pages.','五百ページぐらいになる est le contenu de l’estimation. と le relie à 思います. に appartient au groupe avec なる ; ce n’est pas ici un lieu où aller.');
order('C75','Construire une opinion sur le genre','Construis : « Je pense que c’est un roman policier. »',['N25-S03','N25-S11'],['G25','G26'],[
 '推理小説だと|すいりしょうせつだと|suiri shousetsu da to|que c’est un roman policier','思います|おもいます|omoimasu|je pense'
],[[0,1]],'Je pense que c’est un roman policier.','Le nom 推理小説 est suivi de だ dans la proposition pensée, puis と introduit cette proposition auprès de 思います. La politesse de la phrase est portée par 思います.');
choice('C76','Dialoguer','Répondre sur le projet de publication','L’auteur a un projet de publication. Réponds en exprimant explicitement cette intention.',['N25-S04','N25-S05','N25-S14'],['G20','G25'],[
 '出版するつもりです。|しゅっぱんするつもりです。|shuppan suru tsumori desu.|J’ai l’intention de publier.',
 'まだわかりません。|まだわかりません。|mada wakarimasen.|Je ne sais pas encore.',
 'まだ五ページです。|まだごページです。|mada go peeji desu.|Seulement cinq pages pour le moment.'
],0,'出版するつもりです répond par une intention explicite. まだわかりません conviendrait si la décision n’était pas prise. まだ五ページです indique un avancement, pas une intention. Le scénario de cet exercice diffère volontairement de la réponse du cours.','出版するつもりですか。|しゅっぱんするつもりですか。|shuppan suru tsumori desu ka.|Avez-vous l’intention de publier ?');
choice('C77','Dialoguer','Répondre sur ce qui est déjà écrit','Tu n’as écrit que cinq pages pour le moment. Réponds à la question sur ton avancement.',['N25-S10','N25-S11','N25-S13','N25-S14','N25-S04'],['G26','G20'],[
 '五百ページぐらいになると思います。|ごひゃくページぐらいになるとおもいます。|gohyaku peeji gurai ni naru to omoimasu.|Je pense que cela fera environ cinq cents pages.',
 'まだ五ページです。|まだごページです。|mada go peeji desu.|Seulement cinq pages pour le moment.',
 '出版するつもりです。|しゅっぱんするつもりです。|shuppan suru tsumori desu.|J’ai l’intention de publier.'
],1,'もうどのぐらい書きましたか demande ce qui a déjà été écrit. まだ五ページです répond sur l’avancement. L’estimation de cinq cents pages concerne le total futur, et l’intention de publier ne donne aucune quantité.','もうどのぐらい書きましたか。|もうどのぐらいかきましたか。|mou donogurai kakimashita ka.|Combien en avez-vous déjà écrit ?');
 // END LECON 25
 // BEGIN LECON 26
// Exercices créés ; tous les appuis, y compris ceux des distracteurs, sont dans N26.
choice('C78','Choisir','Demander le but du voyage','Tu connais la destination : la Chine. Demande ce que la personne va y faire.',['N26-S01','N26-S02','N26-S06'],['G22','G28'],[
 '中国語はできますか。|ちゅうごくごはできますか。|chuugokugo wa dekimasu ka.|Parlez-vous chinois ?',
 '中国へ何をしに行きますか。|ちゅうごくへなにをしにいきますか。|chuugoku e nani o shi ni ikimasu ka.|Qu’allez-vous faire en Chine ?',
 '中国へ行くつもりですか。|ちゅうごくへいくつもりですか。|chuugoku e iku tsumori desu ka.|Avez-vous l’intention d’aller en Chine ?'
],1,'何をしに demande le but du déplacement. 中国へ donne la destination. Les autres questions portent sur la capacité linguistique ou l’intention de partir.');
choice('C79','Choisir','Annoncer une capacité limitée','Tu parles un peu chinois. Choisis la phrase qui exprime cette capacité limitée.',['N26-S02','N26-S03','N26-S04','N26-S08'],['G28'],[
 '中国語が少しできます。|ちゅうごくごがすこしできます。|chuugokugo ga sukoshi dekimasu.|Je parle un peu chinois.',
 '中国語ができません。|ちゅうごくごができません。|chuugokugo ga dekimasen.|Je ne parle pas chinois.',
 '中国語がよくできます。|ちゅうごくごがよくできます。|chuugokugo ga yoku dekimasu.|Je parle bien chinois.'
],0,'少し signifie « un peu ». できません nie la capacité ; よく indique ici une bonne maîtrise. On évalue le sens de la phrase, pas un choix obligatoire entre が et は.');
choice('C80','Choisir','Repérer ce qui a changé','Ton fils n’est plus disponible : sa situation a changé. Quelle phrase l’exprime explicitement ?',['N26-S05','N26-S09'],['G29'],[
 '息子は暇です。|むすこはひまです。|musuko wa hima desu.|Mon fils est libre.',
 '息子は都合が悪いです。|むすこはつごうがわるいです。|musuko wa tsugou ga warui desu.|Mon fils n’est pas disponible.',
 '息子は都合が悪くなりました。|むすこはつごうがわるくなりました。|musuko wa tsugou ga waruku narimashita.|Mon fils n’est plus disponible.'
],2,'悪くなりました exprime le changement. 悪いです décrit l’état sans dire qu’il a changé ; 暇です dit que le fils est libre. 都合が悪い concerne sa disponibilité.');
choice('C81','Choisir','Proposer son aide','Tu proposes d’accompagner la personne en Chine. Choisis l’offre d’aide.',['N26-S08','N26-S10','N26-S11'],['G15'],[
 'ぜひお願いします。|ぜひおねがいします。|zehi onegai shimasu.|Oui, avec grand plaisir.',
 'お供しましょうか。|おともしましょうか。|o tomo shimashou ka.|Voulez-vous que je vous accompagne ?',
 '一緒に食事をしましょう。|いっしょにしょくじをしましょう。|issho ni shokuji o shimashou.|Prenons un repas ensemble.'
],1,'お供しましょうか propose ici une action que je ferai pour l’autre. ましょうか n’est donc pas toujours une invitation à faire ensemble la même action. お願いします accepte l’aide dans ce dialogue.');
choice('C82','Transformer','Ajouter le déplacement à l’action','Reformule pour dire que tu te déplaces afin de prendre un repas.',['N26-S06','N26-S11'],['G22'],[
 '食事をしに行きます。|しょくじをしにいきます。|shokuji o shi ni ikimasu.|Je vais prendre un repas.',
 '食事をしました。|しょくじをしました。|shokuji o shimashita.|J’ai pris un repas.',
 '食事をしましょう。|しょくじをしましょう。|shokuji o shimashou.|Prenons un repas.'
],0,'On part de します, on enlève ます, puis on ajoute に行きます : しに行きます. Le groupe 食事を garde を. しました raconte une action passée ; しましょう propose une action.','食事をします。|しょくじをします。|shokuji o shimasu.|Je prends un repas.');
choice('C83','Transformer','Passer de la capacité à sa négation','Reformule pour dire que tu ne parles pas chinois.',['N26-S02','N26-S03','N26-S08'],['G28'],[
 '中国語ができますか。|ちゅうごくごができますか。|chuugokugo ga dekimasu ka.|Parlez-vous chinois ?',
 '中国語が少しできます。|ちゅうごくごがすこしできます。|chuugokugo ga sukoshi dekimasu.|Je parle un peu chinois.',
 '中国語ができません。|ちゅうごくごができません。|chuugokugo ga dekimasen.|Je ne parle pas chinois.'
],2,'できます devient できません. 少しできます reste affirmatif : une petite capacité existe. できますか pose une question.','中国語ができます。|ちゅうごくごができます。|chuugokugo ga dekimasu.|Je parle chinois.');
choice('C84','Transformer','Passer de l’état au changement','Reformule « Je suis libre » en « Je suis devenu disponible ».',['N26-S05','N26-S09'],['G29'],[
 '暇でした。|ひまでした。|hima deshita.|J’étais libre.',
 '暇になりました。|ひまになりました。|hima ni narimashita.|Je suis devenu disponible.',
 '暇ですか。|ひまですか。|hima desu ka.|Êtes-vous libre ?'
],1,'Avec 暇, on emploie に devant なりました. 暇でした décrit un état passé ; 暇になりました exprime le changement. Cette transformation est créée pour l’exercice, elle n’est pas une citation du dialogue.','暇です。|ひまです。|hima desu.|Je suis libre.');
choice('C85','Transformer','Raconter une intention passée','Reformule en « J’avais l’intention d’aller en Chine », sans affirmer que le voyage a eu lieu.',['N26-S01'],['G20'],[
 '中国へ行くつもりでした。|ちゅうごくへいくつもりでした。|chuugoku e iku tsumori deshita.|J’avais l’intention d’aller en Chine.',
 '中国へ行きました。|ちゅうごくへいきました。|chuugoku e ikimashita.|Je suis allé en Chine.',
 '中国へ行くつもりですか。|ちゅうごくへいくつもりですか。|chuugoku e iku tsumori desu ka.|Avez-vous l’intention d’aller en Chine ?'
],0,'Le passé porte sur つもりです, qui devient つもりでした ; 行く reste à la forme du dictionnaire. Cette phrase seule ne prouve ni la réalisation ni l’abandon du voyage.','中国へ行くつもりです。|ちゅうごくへいくつもりです。|chuugoku e iku tsumori desu.|J’ai l’intention d’aller en Chine.');
order('C86','Construire le but du déplacement','Construis : « Je vais en Chine pour travailler. »',['N26-S06','N26-S07'],['G22'],[
 '中国へ|ちゅうごくへ|chuugoku e|en Chine, destination',
 '仕事をしに|しごとをしに|shigoto o shi ni|pour travailler, but',
 '行きます|いきます|ikimasu|je vais'
],[[0,1,2],[1,0,2]],'Je vais en Chine pour travailler.','Les groupes 中国へ et 仕事をしに peuvent échanger leur place avant 行きます. On garde la destination avec へ et le but avec に ; を reste attaché à 仕事.');
order('C87','Construire une capacité limitée','Construis : « Je parle un peu chinois. »',['N26-S08'],['G28'],[
 '中国語が|ちゅうごくごが|chuugokugo ga|le chinois, langue concernée',
 '少し|すこし|sukoshi|un peu',
 'できます|できます|dekimasu|je sais le parler'
],[[0,1,2],[1,0,2]],'Je parle un peu chinois.','少し et 中国語が peuvent se placer dans les deux ordres proposés avant できます. Le groupe 中国語が reste entier. 中国語は serait aussi possible avec un autre choix de thème ; cet exercice fournit が.');
order('C88','Construire un changement de disponibilité','Construis : « Mon fils n’est plus disponible. »',['N26-S05'],['G29'],[
 '息子は|むすこは|musuko wa|quant à mon fils',
 '都合が|つごうが|tsugou ga|sa disponibilité',
 '悪くなりました|わるくなりました|waruku narimashita|la situation a changé défavorablement'
],[[0,1,2]],'Mon fils n’est plus disponible.','息子は pose le thème ; 都合が悪くなりました décrit le changement de disponibilité. 悪い devient 悪く devant なりました. On construit ici l’ordre neutre du dialogue.');
order('C89','Construire une intention passée','Construis : « J’avais l’intention d’aller en Chine au printemps prochain. »',['N26-S01'],['G20'],[
 '来年の春に|らいねんのはるに|rainen no haru ni|au printemps prochain',
 '中国へ|ちゅうごくへ|chuugoku e|en Chine',
 '行くつもりでした|いくつもりでした|iku tsumori deshita|j’avais l’intention d’aller'
],[[0,1,2],[1,0,2]],'J’avais l’intention d’aller en Chine au printemps prochain.','Le moment et la destination peuvent échanger leur place. でした situe l’intention dans le passé ; le voyage envisagé peut rester à venir. Cette phrase seule ne dit pas si le projet se réalisera.');
choice('C90','Dialoguer','Répondre sans répéter la langue','Tu ne parles pas chinois. Réponds simplement à la question.',['N26-S02','N26-S03','N26-S04','N26-S08'],['G28'],[
 '少しできます。|すこしできます。|sukoshi dekimasu.|Je le parle un peu.',
 '私はできません。|わたしはできません。|watashi wa dekimasen.|Moi, je ne le parle pas.',
 'よくできます。|よくできます。|yoku dekimasu.|Je le parle bien.'
],1,'Le nom de la langue reste sous-entendu grâce à la question. できません répond négativement ; 少し et よく décrivent deux degrés de capacité.','中国語はできますか。|ちゅうごくごはできますか。|chuugokugo wa dekimasu ka.|Parlez-vous chinois ?');
choice('C91','Dialoguer','Accepter l’aide proposée','La proposition d’accompagnement t’aide : accepte-la avec plaisir.',['N26-S08','N26-S10','N26-S11'],['G15'],[
 '一緒に食事をしましょう。|いっしょにしょくじをしましょう。|issho ni shokuji o shimashou.|Prenons un repas ensemble.',
 'お供しましょうか。|おともしましょうか。|o tomo shimashou ka.|Voulez-vous que je vous accompagne ?',
 'それはたすかります。ぜひお願いします。|それはたすかります。ぜひおねがいします。|sore wa tasukarimasu. zehi onegai shimasu.|Cela m’aiderait beaucoup. Oui, avec grand plaisir.'
],2,'たすかります exprime ici que l’aide est bienvenue ; ぜひお願いします accepte l’offre. Répéter お供しましょうか ferait une nouvelle proposition, et 食事をしましょう proposerait un repas.','お供しましょうか。|おともしましょうか。|o tomo shimashou ka.|Voulez-vous que je vous accompagne ?');
 // END LECON 26
 // BEGIN REPAS SORTIE
// Exercices créés, appuis requis pour chaque mot et construction.
order('C92','Choisir une boisson','Au café, annonce ton choix : « Je prendrai un café. »',['N3-S05','N12-S05'],['G21'],[
 'コーヒーに|コーヒーに|koohii ni|un café comme choix','します|します|shimasu|je décide de prendre'
],[[0,1]],'Je prendrai un café.','Le groupe コーヒーに précède します. Ici に marque le choix, pas une destination.');
order('C93','Choisir une boisson et une pâtisserie','Annonce : « Pour moi, ce sera un café et une pâtisserie. »',['N14-S08'],['G21','G12'],[
 '私は|わたしは|watashi wa|pour moi','コーヒーとお菓子に|コーヒーとおかしに|koohii to okashi ni|un café et une pâtisserie comme choix','します|します|shimasu|je décide de prendre'
],[[0,1,2],[1,0,2]],'Pour moi, ce sera un café et une pâtisserie.','と réunit les deux éléments ; に porte sur l’ensemble choisi. 私は pose le thème. Le choix peut aussi être placé avant 私は, avec davantage de contraste ; します reste à la fin.');
order('C94','Préparer l’heure de la sortie','Tu sais que la personne va au café. Demande : « À quelle heure vas-tu au café ? »',['N11-S01','N12-S03','N2-S07'],['G02','G09'],[
 '何時に|なんじに|nanji ni|à quelle heure','喫茶店へ|きっさてんへ|kissaten e|au café','行きますか|いきますか|ikimasu ka|vas-tu ?'
],[[0,1,2],[1,0,2]],'À quelle heure vas-tu au café ?','何時に demande l’heure ; 喫茶店へ indique la destination. Ces groupes peuvent changer de place avant 行きますか.');
order('C95','Proposer le cinéma demain','Propose : « Allons au cinéma ensemble demain. »',['N2-S07','N8-S03','N1-S02'],['G09','G12','G15'],[
 '明日|あした|ashita|demain','一緒に|いっしょに|issho ni|ensemble','映画に|えいがに|eiga ni|au cinéma','行きましょう|いきましょう|ikimashou|allons'
],[[0,1,2,3],[0,2,1,3],[1,0,2,3],[1,2,0,3],[2,0,1,3],[2,1,0,3]],'Allons au cinéma ensemble demain.','Le moment, l’accompagnement et la destination peuvent être organisés de plusieurs façons avant 行きましょう. Les particules restent avec leur groupe ; ましょう exprime la proposition.');
order('C96','Proposer un repas chinois','Propose : « Et si nous mangions chinois ce soir ? »',['N9-S01'],['G06','G15'],[
 '今晩|こんばん|konban|ce soir','中華料理を|ちゅうかりょうりを|chuuka ryouri o|de la cuisine chinoise','食べましょうか|たべましょうか|tabemashou ka|et si nous mangions ?'
],[[0,1,2],[1,0,2]],'Et si nous mangions chinois ce soir ?','を désigne ce qu’on propose de manger ; ましょうか sollicite ici l’accord pour manger ensemble. Le moment peut précéder ou suivre le groupe de l’aliment. Le cours écrit 今晚 ; cet exercice créé emploie 今晩, de même lecture.');
order('C97','Proposer un pique-nique ensemble','Propose : « Et si nous allions pique-niquer ensemble ? »',['N16-S03','N5-S03'],['G09','G12','G15'],[
 '一緒に|いっしょに|issho ni|ensemble','ピクニックに|ピクニックに|pikunikku ni|pique-niquer','行きましょうか|いきましょうか|ikimashou ka|et si nous allions ?'
],[[0,1,2],[1,0,2]],'Et si nous allions pique-niquer ensemble ?','一緒に précise l’accompagnement ; ピクニックに exprime ici l’activité pour laquelle on se déplace. Les deux groupes peuvent permuter avant le verbe.');
order('C98','Accepter une prochaine invitation','Tu ne peux pas venir au concert. La personne propose de te réinviter une prochaine fois. Réponds : « Oui, avec grand plaisir. »',['N19-S09','N19-S10','N19-S11','N19-S17','N19-S18'],['G15'],[
 'ぜひ|ぜひ|zehi|avec grand plaisir','お願いします|おねがいします|onegai shimasu|je vous en prie'
],[[0,1]],'Oui, avec grand plaisir.','ぜひ renforce le souhait exprimé par お願いします. Ici, tu acceptes la proposition d’une invitation future ; tu ne reviens pas sur ton indisponibilité pour ce concert.');
order('C99','Décliner une sortie','On t’invite au concert, mais tu n’es pas disponible. Construis : « Je suis vraiment désolé, mais je ne suis pas disponible. »',['N19-S09','N19-S10','N19-S11'],['G15'],[
 'とてもざんねんですが|とてもざんねんですが|totemo zannen desu ga|je suis vraiment désolé, mais','都合が|つごうが|tsugou ga|ma disponibilité','わるいです|わるいです|warui desu|ne convient pas'
],[[0,1,2]],'Je suis vraiment désolé, mais je ne suis pas disponible.','Le premier groupe atténue le refus ; le が après です relie les deux idées avec « mais ». Dans 都合が, が indique ce dont on décrit l’état : ici la disponibilité, et non la valeur morale de la personne.');
order('C100','Commander les deux boissons','Le choix est fait. Commande : « Alors, un café et une bière, s’il vous plaît. »',['N12-S07'],['G12','G17'],[
 'じゃあ|じゃあ|jaa|alors','コーヒーとビールを|コーヒーとビールを|koohii to biiru o|un café et une bière','ください|ください|kudasai|s’il vous plaît'
],[[0,1,2]],'Alors, un café et une bière, s’il vous plaît.','と réunit les boissons et を marque ce qui est demandé. ください suit ici des noms ; ce n’est pas une demande d’action en forme てください. じゃあ introduit la décision.');
order('C101','Choisir où aller ensemble','Vous avez décidé de sortir ensemble. Demande : « Où pourrions-nous aller ensemble ? »',['N16-S07','N5-S03'],['G02','G09','G15'],[
 'どこへ|どこへ|doko e|où','一緒に|いっしょに|issho ni|ensemble','行きましょうか|いきましょうか|ikimashou ka|pourrions-nous aller ?'
],[[0,1,2],[1,0,2]],'Où pourrions-nous aller ensemble ?','どこへ interroge la destination ; 一緒に maintient l’idée d’une sortie commune. La terminaison ましょうか invite ici à décider ensemble.');
 definitions.slice(-10).forEach(q=>q.theme='repas-sortie');
 // END REPAS SORTIE
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
