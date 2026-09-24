// Affichage uniquement : liste revue sur le corpus actuel, pas de règle globale ou → ō.
// Exceptions laissées intactes : omou, kayou, sasou, sonoue, ouwasa, sandouitchi.
// Les mots nouveaux doivent être vérifiés avant ajout. Les autres voyelles sont inchangées.
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
  `.trim().split(/\s+/));

  function display(text) {
    return String(text ?? '').normalize('NFC').replace(/[A-Za-zÀ-ÖØ-öø-ÿĀ-ž]+(?:['’][A-Za-zÀ-ÖØ-öø-ÿĀ-ž]+)*/g, word => {
      if (!reviewedWords.has(word.toLowerCase().replace(/’/g, "'"))) return word;
      return word.replace(/ou/gi, pair => pair[0] === 'O' ? 'Ō' : 'ō');
    });
  }

  // Restaurer « ou » avant d'enlever les accents, y compris pour un macron décomposé.
  function searchKey(text) {
    return String(text ?? '').normalize('NFC').replace(/ō/g, 'ou').replace(/Ō/g, 'Ou')
      .normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  }

  const api = Object.freeze({ display, searchKey });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Romaji = api;
})(globalThis);
