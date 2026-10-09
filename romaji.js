// Affichage uniquement : liste revue sur le corpus actuel, pas de règle globale ou → ō.
// Exceptions laissées intactes : omou, kayou, sasou, sonoue, ouwasa, sandouitchi.
// Les mots nouveaux et les frontières de syllabes restent protégés par cette liste.
// Référence : https://www.loc.gov/catdir/cpso/romanization/japanese.pdf § 2.5.
(function (root) {
  'use strict';
  const reviewedWords = new Set(`
    aikyou aimashou arigatou benkyou benkyousaseru bessou biyouin bouken boushi byouin byouki chihou
    chiryou chou choudo choushi choushoku choutei chuugakkou daihyouteki daijoubu darou denwachou
    deshou dou doubutsu doubutsuen doumo douryou doushite douzo douzou doyoubi ensou fudousan'yasan
    fudousanyasan fuutou gaikokuryokou gakkou genkou getsuyoubi ginkou gochisou gokurou gosaburou
    gyouji hachijou hachikou hairimashou hajimemashou hantou harou hidesaburou hijou hikoujou
    hikouki hirakimashou hitsuyou hokkaidou hokousha hontou hou houkou houmen houryuuji houseki
    hyoujiban hyoushi ichiyou idou idousuru ijou ikaiyou ikimashou ikou imouto inazou inshou
    inshoubukakatta isshou isshoukenmei ittou jidousha joou jou joubu jouhou jouhoukagaku
    jouhoushori jouken joukyou jousan joutai jouzu juuyou juuyouna kaerimashou kaimashou kakemashou
    kakkou kankou kankoukyaku kankyoumondai kanpouyaku kaou karimashou katou katsudou kayoubi kekkou
    kenpou kimashou kin'youbi kinou kinyoubi kiyou kojinkyouju kokkaigijidou kokudou konochoushidato
    koshou kouban kouen kougou kougyou kouin koujou koukou koukuu koukyo kourin kouseibusshitsu
    koushitsu kousokudouro kousui koutsuu kouza kurou kuukou kyokashou kyou kyouikuka kyoukasho
    kyoumi kyousou kyouto kyuujuumanchouen machimashou mainichinoyouni makuranosoushi mashou
    mimashou minitsukesasemashou mitsukemashou miyou mokuyoubi mokuzou mou moudokoka moushimasu
    moushiwake mousugu mukou muzukashisou myouji naiyou nan'youbi nanyoubi narawaseyou narou
    nasaranaidedouzo nasasou nemusou nichijoukaiwa nichiyoubi nijuuittou nitou norimashou nougyou
    noujou obentou obousan ohayou ohyakushousan ojousan okimashou okinawaryokou okujou omedetou
    omoshirosou oosouji oryouri osechiryouri oshougatsu oshouyu osoushiki osumou otanjoubi otousan
    oubei ousetsuma reibou reitou reizouko renshuujou rikkouhosha risou ryokou ryokouyou ryou
    ryoukin ryouri ryoushin santou sasoimashou satou satousan sayou sechiryouri seiyou seizou sensou
    sentou shakousei shakouteki shikimou shimashou shinkonryokou shisouka shitsugyousha shiyou
    shiyouryou shokudou shokugyou shoubai shougakkou shougatsu shougo shougun shoukai shoukaishite
    shounagon shourai shousetsu shoushaman shoushin shoushou shoutoku shouwa shouyu shujinkou shunou
    shutchou shuugakuryokou shuyoukoku sotsugyou sotsugyousuru sou soudesune soujiki souko
    souridaijin souseki soushiki sousureba sousuruto suiyoubi sumou tabemashou taishou taiyou
    tanjoubi tanomimashou tatemashou tenkiyohou tenkiyohoudato tennou torimashou tou toudai toudaiji
    toukyou toukyouto toushoudaiji tsugou tsukemashou tsukesasemashou tsukeyou tsuukou undou
    ureshisou wasuresou wasureyou yameyou yarou you youchien youji youka youkoso yuujou yuukou
    yuuryou zenjidou zou
    apaato baa baagen bideogeemu biiru chikyuu chokoreeto chuugakusei chuugoku chuugokugo
    chuugokujin chuuka chuurippu daunroodo depaato dezaato esukareetaa fooku fukushuu
    futsuu fuukei gareeji gyuunyuu hachijuu haiyuu happii hiiroo hoomu intaanetto
    isshuu isshuukan jaa joryuu joyuu juu juubun juuden juugo juugofun juugojikan
    juugonichi juugosai juuichigatsu juuichiji juuji juumai juuni juunigatsu juuninen
    juuninichi juuninin juurokkai juusho juusu kaabu kaado kakushuu karee keeki kenkyuu
    kiiroi konkuriito konkuriitodate konpyuuta konsaato konshuu koohii kooto kukkii
    kuriimu kuuki kyuu kyuuchuu kyuukei kyuunen kyuunin kyuushuu maa maajan maishuu
    manee meekaa meeru meetoru messeeji nanajuu nee neesan nihonjuu nijuu nijuuhachi
    nijuuhassai nijuuyon nijuuyonsai nitchuu nyuugaku nyuuin nyuukyo nyuusu obaa
    ojiisan okaasan oniisan oodoori oogesa ooi ooki ookii ookiku oosaka ooshima
    oosutoraria oosutoria ooyorokobi oozei paatii peeji piinattsu raamen raishuu
    rakkii renshuu riyuu ryuugakusei saa saabisu sakkaa sakunenjuu sanjuugofun
    sanjuuichinichi sanjuukyuu sanjuumai sansuu saraishuu sarariiman sekaijuu senshuu
    shawaa sheekusupia shiidii shiizun shinshuu shoppingusentaa shuumatsu shuushoku
    suichuumegane sukii supiido supootsu suunen suupaa suupu taaminaru takushii
    teeburu tochuu tooi tooka tookereba tooku tooremasen toori toorimasu tooru
    tootta tootte torakutaa tsurii tsuuro tsuuyaku uchuu uiikuendo uiin wiikuendo
    wiin yakyuu yonjuu yooroppa yoyuu yuube yuubin yuubinkyoku yuugata yuujin
    yuumei yuushoku yuuyake
  `.trim().split(/\s+/));

  function display(text) {
    return String(text ?? '').normalize('NFC').replace(/[A-Za-zÀ-ÖØ-öø-ÿĀ-ž]+(?:['’][A-Za-zÀ-ÖØ-öø-ÿĀ-ž]+)*/g, word => {
      if (!reviewedWords.has(word.toLowerCase().replace(/’/g, "'"))) return word;
      return word.replace(/ou/gi, pair=>pair[0]==='O'?'Ō':'ō').replace(/aa|ii|uu|ee|oo/gi, pair => {
        const macron={a:'ā',i:'ī',u:'ū',e:'ē',o:'ō'}[pair[0].toLowerCase()];
        return pair[0]===pair[0].toUpperCase()?macron.toUpperCase():macron;
      });
    });
  }

  // Restaurer « ou » avant d'enlever les accents, y compris pour un macron décomposé.
  function searchKey(text) {
    return display(text).replace(/[āīūēō]/gi, vowel => ({'ā':'aa','ī':'ii','ū':'uu','ē':'ee','ō':'ou'}[vowel.toLowerCase()]))
      .normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  }

  // Align from both ends: a missing reading in the middle must not hide safe
  // grammatical markers elsewhere. Join/split spaces without rewriting the source.
  function bracketAnalysis(text, segments) {
    const source=display(text), words=[...source.matchAll(/[\p{L}\p{M}’'ʼ-]+/gu)];
    const compact=s=>searchKey(s).replace(/\s/g,'');
    const readings=segments.map(part=>(display(part.romaji || '').match(/[\p{L}\p{M}’'ʼ-]+/gu)||[]).join(''));
    const spans=new Map();
    function match(partIndex,wordIndex,direction) {
      const target=compact(readings[partIndex]);
      if(!target)return null;
      let value='',start=wordIndex,end=wordIndex;
      while(wordIndex>=0&&wordIndex<words.length) {
        const word=words[wordIndex];
        value=direction===1?value+compact(word[0]):compact(word[0])+value;
        start=Math.min(start,wordIndex);end=Math.max(end,wordIndex);
        // Joining words is safe only across spaces, never across a clause boundary.
        const left=direction===1?end-1:start,right=left+1;
        if(end>start&&/[^\s]/u.test(source.slice(words[left].index+words[left][0].length,words[right].index)))return null;
        if(value===target)return {start,end};
        if(direction===1?!target.startsWith(value):!target.endsWith(value))return null;
        wordIndex+=direction;
      }
      return null;
    }
    function remember(part,index,range) {
      if(part.particle||part.category==='particule'||/^\[[\s\S]+\]$/.test((part.gloss || part.fr || '').trim()))spans.set(index,range);
    }
    let firstPart=0,firstWord=0;
    while(firstPart<segments.length&&firstWord<words.length) {
      const range=match(firstPart,firstWord,1);if(!range)break;
      remember(segments[firstPart],firstPart,range);firstPart++;firstWord=range.end+1;
    }
    let lastPart=segments.length-1,lastWord=words.length-1;
    while(lastPart>=firstPart&&lastWord>=firstWord) {
      const range=match(lastPart,lastWord,-1);if(!range||range.start<firstWord)break;
      remember(segments[lastPart],lastPart,range);lastPart--;lastWord=range.start-1;
    }
    let output=source;
    for(const {start,end} of [...spans.values()].sort((a,b)=>b.start-a.start)) {
      const from=words[start].index,to=words[end].index+words[end][0].length;
      output=output.slice(0,from)+'['+output.slice(from,to)+']'+output.slice(to);
    }
    return output;
  }

  const api = Object.freeze({ display, searchKey, bracketAnalysis });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Romaji = api;
})(globalThis);
