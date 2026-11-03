import { LexicalRoot, SuffixRule, CorpusPhrase, CriticalDoubt, GrammarRule } from '../types/quechua';

export const SEED_ROOTS: LexicalRoot[] = [
  // Verbos
  {
    id: 'root-1',
    quechua: 'kay',
    spanish: 'ser, estar, haber',
    category: 'verbo',
    dialectNote: 'En Cochabamba se usa con el sufijo progresivo -sha- (kashani, kashanki, kashan), nunca con -chka-.',
    verified: true,
    frequency: 45,
    examples: ['Kashanipunichu?', 'Wasiypi kashani', 'Allillanchu kashanki?']
  },
  {
    id: 'root-2',
    quechua: 'mikhuy',
    spanish: 'comer',
    category: 'verbo',
    dialectNote: 'Muy frecuente en frases cotidianas de mercado y comida típica (ch\'arki, t\'anta, lawa).',
    verified: true,
    frequency: 32,
    examples: ['Mikhushani-raj', 'Sumaqta mikhuypuni', 'Imatataj mikhunki?']
  },
  {
    id: 'root-3',
    quechua: 'parlay',
    spanish: 'hablar, conversar',
    category: 'verbo',
    dialectNote: 'Préstamo hispano plenamente integrado a la morfología quechua en Cochabamba (en lugar del quechua sureño rimay).',
    verified: true,
    frequency: 28,
    examples: ['Qhichwata parlashani', 'Qanwan parlariyta munani', 'Parlarikusun']
  },
  {
    id: 'root-4',
    quechua: 'ruway',
    spanish: 'hacer, elaborar',
    category: 'verbo',
    dialectNote: 'En Cochabamba predomina ruway sobre ruray.',
    verified: true,
    frequency: 26,
    examples: ['Imatataj ruwashanki?', 'Trabajota ruwani', 'Ruwanapunin']
  },
  {
    id: 'root-5',
    quechua: 'jamuy',
    spanish: 'venir',
    category: 'verbo',
    dialectNote: 'En Cochabamba se escribe con "j" inicial (jamuy, jatun, jallp\'a).',
    verified: true,
    frequency: 24,
    examples: ['Paqarin jamusaqpuni', 'Wasiymanta jamushani', 'Jamuy kayman']
  },
  {
    id: 'root-6',
    quechua: 'ripuy',
    spanish: 'irse, marcharse',
    category: 'verbo',
    dialectNote: 'Formado con el reflexivo/translocativo -pu sobre riy (ir). Indica marcharse a su lugar.',
    verified: true,
    frequency: 20,
    examples: ['Ripushaniña', 'Llajtaman ripunqa', 'Ama riychu-raj']
  },
  {
    id: 'root-7',
    quechua: 'munay',
    spanish: 'querer, desear, amar',
    category: 'verbo',
    dialectNote: 'También usado como adjetivo "munay" o "munaycha" (bonito/agradable).',
    verified: true,
    frequency: 22,
    examples: ['Qhichwata yachakuyta munani', 'Sumaq kawsayta munanchij']
  },
  {
    id: 'root-8',
    quechua: 'llank\'ay',
    spanish: 'trabajar',
    category: 'verbo',
    dialectNote: 'Coexiste con el préstamo "trabajay". Lleva la oclusiva lateral glotalizada ll- y velar eyectiva k\'.',
    verified: true,
    frequency: 18,
    examples: ['Chajrapi llank\'ashani', 'Paqarin llank\'aj jamusaq']
  },
  {
    id: 'root-9',
    quechua: 'yachay',
    spanish: 'saber, conocer / vivir',
    category: 'verbo',
    dialectNote: 'Con -ku (yachakuy) significa "aprender" o "acostumbrarse".',
    verified: true,
    frequency: 21,
    examples: ['Mana yachanichu', 'Qhichwata yachakushani']
  },

  // Sustantivos
  {
    id: 'root-10',
    quechua: 'wasi',
    spanish: 'casa, hogar',
    category: 'sustantivo',
    dialectNote: 'Base nominal universal. Admite la concatenación completa de sufijos posesivos y de caso.',
    verified: true,
    frequency: 38,
    examples: ['Wasiypi kashani', 'Wasiman ripuni', 'Wasiykichijpi']
  },
  {
    id: 'root-11',
    quechua: 'tata',
    spanish: 'padre, señor, don',
    category: 'sustantivo',
    dialectNote: 'Voz predilecta en Cochabamba y valles bolivianos para "padre" y tratamiento de respeto.',
    verified: true,
    frequency: 25,
    examples: ['Allinllachu tata?', 'Tataywan parlashani']
  },
  {
    id: 'root-12',
    quechua: 'mama',
    spanish: 'madre, señora, doña',
    category: 'sustantivo',
    dialectNote: 'Tratamiento de respeto universal en el quechua boliviano.',
    verified: true,
    frequency: 27,
    examples: ['Mamaypa wasin', 'Allinllachu mama?']
  },
  {
    id: 'root-13',
    quechua: 'wawa',
    spanish: 'hijo/a, niño/a',
    category: 'sustantivo',
    dialectNote: 'En el quechua boliviano aplica a niños o hijos en general.',
    verified: true,
    frequency: 19,
    examples: ['Wawas yachaywasipi kashanku', 'Wawayta munakuni']
  },
  {
    id: 'root-14',
    quechua: 'llajta',
    spanish: 'pueblo, ciudad, tierra natal',
    category: 'sustantivo',
    dialectNote: 'En ortografía boliviana con "j" intervocálica o final de sílaba (llajta).',
    verified: true,
    frequency: 23,
    examples: ['Cochabamba llajtapi', 'Llajtanchij sumaq kashan']
  },
  {
    id: 'root-15',
    quechua: 'jallp\'a',
    spanish: 'tierra, suelo, terreno',
    category: 'sustantivo',
    dialectNote: 'Ortografía oficial boliviana con "j" inicial y "p\'" eyectiva.',
    verified: true,
    frequency: 14,
    examples: ['Jallp\'ata tarpunki', 'Kay jallp\'api kawsanchij']
  },
  {
    id: 'root-16',
    quechua: 't\'anta',
    spanish: 'pan',
    category: 'sustantivo',
    dialectNote: 'Con "t\'" glotalizada inicial.',
    verified: true,
    frequency: 16,
    examples: ['T\'antata mikhushani', 'Chay t\'antata rantimuy']
  },
  {
    id: 'root-17',
    quechua: 'ch\'isi',
    spanish: 'tarde-noche, anochecer',
    category: 'sustantivo',
    dialectNote: 'Muy usado en saludos: "Allin ch\'isi" (buenas tardes/noches).',
    verified: true,
    frequency: 17,
    examples: ['Allin ch\'isi kachun', 'Ch\'isipi jamusaq']
  },
  {
    id: 'root-18',
    quechua: 'paqarin',
    spanish: 'mañana (día siguiente)',
    category: 'sustantivo',
    dialectNote: 'Uso temporal: "mañana iré" (paqarin risaq).',
    verified: true,
    frequency: 15,
    examples: ['Paqarin llank\'asaq', 'Paqarinkama!']
  },
  {
    id: 'root-atoj',
    quechua: 'atoj',
    spanish: 'zorro',
    category: 'sustantivo',
    dialectNote: 'Con "j" final boliviana (atoj). En plural añade -kuna (atojkuna) por terminar en consonante.',
    verified: true,
    frequency: 16,
    examples: ['Atojkuna chajrapi kashanku', 'Chay jatun atoj']
  },

  // Adjetivos
  {
    id: 'root-19',
    quechua: 'jatun',
    spanish: 'grande',
    category: 'adjetivo',
    dialectNote: 'Escrito con "j" en Cochabamba (en contraste con "hatun" de Perú).',
    verified: true,
    frequency: 20,
    examples: ['Jatun wasi', 'Jatun llajta']
  },
  {
    id: 'root-20',
    quechua: 'sumaq',
    spanish: 'bueno, rico, hermoso, agradable',
    category: 'adjetivo',
    dialectNote: 'Admite sufijación adverbial: sumaqta (bien, ricamente).',
    verified: true,
    frequency: 30,
    examples: ['Sumaq mikhuna', 'Sumaqta parlashanki']
  },
  {
    id: 'root-21',
    quechua: 'chiri',
    spanish: 'frío',
    category: 'adjetivo',
    dialectNote: 'Funciona como adjetivo y sustantivo (chiri kashan = hace frío).',
    verified: true,
    frequency: 12,
    examples: ['Chiri kashan', 'Chiri yaku']
  },

  // Pronombres y partículas
  {
    id: 'root-22',
    quechua: 'noqa',
    spanish: 'yo',
    category: 'pronombre',
    dialectNote: 'Pronombre de primera persona singular. En Cochabamba con o/u según norma oficial boliviana (noqa / nuqa).',
    verified: true,
    frequency: 35,
    examples: ['Noqamin kani', 'Noqapis rillasaqtaj']
  },
  {
    id: 'root-23',
    quechua: 'qan',
    spanish: 'tú, vos',
    category: 'pronombre',
    dialectNote: 'Pronombre de segunda persona singular.',
    verified: true,
    frequency: 31,
    examples: ['Qantaj?', 'Qanwan kashani']
  },
  {
    id: 'root-24',
    quechua: 'pay',
    spanish: 'él, ella',
    category: 'pronombre',
    dialectNote: 'Tercera persona singular no diferenciada por género.',
    verified: true,
    frequency: 22,
    examples: ['Pay jamushan', 'Paypa wasin']
  },
  {
    id: 'root-mana',
    quechua: 'mana',
    spanish: 'no (partícula negativa declarativa)',
    category: 'partícula',
    dialectNote: 'Se usa exclusivamente para negación de hechos o estados en estructura discontinua mana + ...-chu.',
    verified: true,
    frequency: 40,
    examples: ['Mana yachanichu', 'Mana qullqi kanchu', 'Mana kusisqachu kashani']
  },
  {
    id: 'root-ama',
    quechua: 'ama',
    spanish: 'no (partícula prohibitiva imperativa)',
    category: 'partícula',
    dialectNote: 'Se usa exclusivamente para órdenes negativas o prohibiciones con imperativo: ama + [verbo-y] + -chu.',
    verified: true,
    frequency: 30,
    examples: ['Ama waqaychu', 'Ama phiñakuychu', 'Ama llojsiychu', 'Ama chayta ujyaychu']
  },
  {
    id: 'root-waqay',
    quechua: 'waqay',
    spanish: 'llorar',
    category: 'verbo',
    dialectNote: 'Común en expresiones afectivas: "Ama waqaychu" (no llores).',
    verified: true,
    frequency: 18,
    examples: ['Ama waqaychu', 'Wawa waqashan']
  },
  {
    id: 'root-phiñakuy',
    quechua: 'phiñakuy',
    spanish: 'enojarse, molestarse',
    category: 'verbo',
    dialectNote: 'Con la aspirada ph- y reflexivo -ku: "Ama phiñakuychu" (no te enojes).',
    verified: true,
    frequency: 16,
    examples: ['Ama phiñakuychu', 'Tatay phiñakun']
  },
  {
    id: 'root-ujyay',
    quechua: 'ujyay',
    spanish: 'beber, tomar líquidos',
    category: 'verbo',
    dialectNote: 'Forma cochabambina con "j" (ujyay / ubyay en vez del cuzqueño upyay / upiyay).',
    verified: true,
    frequency: 17,
    examples: ['Ama chayta ujyaychu', 'Yakuta ujyani']
  },
  {
    id: 'root-llojsiy',
    quechua: 'llojsiy',
    spanish: 'salir',
    category: 'verbo',
    dialectNote: 'Ortografía oficial boliviana con "j" en la coda (llojsiy en lugar de lloqsiy).',
    verified: true,
    frequency: 19,
    examples: ['Ama llojsiychu', 'Wasimanta llojsini']
  },
  {
    id: 'root-qullqi',
    quechua: 'qullqi',
    spanish: 'dinero, plata',
    category: 'sustantivo',
    dialectNote: 'En Cochabamba también se escribe y pronuncia qolqe / qullqi.',
    verified: true,
    frequency: 25,
    examples: ['Mana qullqi kanchu', 'Qullqiy tiyan']
  },
  {
    id: 'root-kusisqa',
    quechua: 'kusisqa',
    spanish: 'alegre, contento/a, feliz',
    category: 'adjetivo',
    dialectNote: 'Participio de kusiy: "Mana kusisqachu kashani" (no estoy feliz).',
    verified: true,
    frequency: 20,
    examples: ['Mana kusisqachu kashani', 'Kusisqa jamuni']
  },
  {
    id: 'root-sichus',
    quechua: 'sichus',
    spanish: 'si (conjunción condicional)',
    category: 'partícula',
    dialectNote: 'Préstamo hispano quechuizado (si + -chus). Introduce de forma explícita la cláusula condicional en (Sichus) ... chayqa.',
    verified: true,
    frequency: 24,
    examples: ['Sichus munanki chayqa', 'Sichus sajra munayninchejta atipayta munanchej chayqa']
  },
  {
    id: 'root-sajra',
    quechua: 'sajra',
    spanish: 'malo, malvado, perverso, feo',
    category: 'adjetivo',
    dialectNote: 'Ortografía oficial boliviana con "j" (sajra) en lugar del cusqueño "saqra".',
    verified: true,
    frequency: 18,
    examples: ['Sajra runa', 'Sajra munayninchej']
  },
  {
    id: 'root-atipay',
    quechua: 'atipay',
    spanish: 'vencer, ganar, superar, triunfar',
    category: 'verbo',
    dialectNote: 'Verbo transitivo de victoria y superación. "Atipayta munani" (quiero vencer).',
    verified: true,
    frequency: 15,
    examples: ['Atipayta munanchej', 'Llajta atipan']
  },
  {
    id: 'root-kasukuy',
    quechua: 'kasukuy',
    spanish: 'obedecer, acatar, hacer caso',
    category: 'verbo',
    dialectNote: 'Verbo común en quechua boliviano con reflexivo -ku ("hacerse caso / obedecer").',
    verified: true,
    frequency: 21,
    examples: ['Jehová Diosta kasukunki chayqa', 'Tataykita kasukuy']
  },
  {
    id: 'root-ashkha',
    quechua: 'ashkha',
    spanish: 'mucho, bastante, abundante, gran cantidad',
    category: 'adjetivo',
    dialectNote: 'Forma estándar cochabambina con aspirada -shkh- (en contraste con el cusqueño "achka").',
    verified: true,
    frequency: 32,
    examples: ['Ashkha runas jamunku', 'Ashkha bendicionesta japʼinki']
  },
  {
    id: 'root-japiy',
    quechua: 'japʼiy',
    spanish: 'agarrar, tomar, recibir, aprehender',
    category: 'verbo',
    dialectNote: 'Con "j" inicial boliviana y oclusiva bilabial eyectiva pʼ (japʼiy / jap\'iy).',
    verified: true,
    frequency: 25,
    examples: ['Bendicionesta japʼinki', 'Makiyta japʼiy']
  }
];

export const SEED_SUFFIXES: SuffixRule[] = [
  // 1. Aspecto verbal progresivo (CLAVE COCHABAMBINA)
  {
    id: 'suf-1',
    suffix: '-sha-',
    type: 'verbal',
    slotOrder: 2,
    function: 'Aspecto progresivo/continuativo: acción en curso (estar haciendo)',
    cochabambaUsage: 'En el quechua cochabambino es exclusivamente "-sha-" (kashani, ruwashani, parlashani), sustituyendo al "-chka-" del quechua sureño clásico.',
    examples: ['ka-sha-ni (estoy)', 'mikhu-sha-nki (estás comiendo)', 'ruwa-sha-n (está haciendo)']
  },

  // 2. Clíticos Independientes de Alta Relevancia Cochabambina
  {
    id: 'suf-2',
    suffix: '-min',
    type: 'independiente',
    slotOrder: 6,
    function: 'Evidencial testimonial / Aserción de certeza directa',
    cochabambaUsage: 'Aparece como "-min" tras vocal o consonante para afirmar con plena seguridad personal lo que se dice (ej. Noqamin rini).',
    examples: ['Noqa-min jamuni', 'Arí-min', 'Pay-min ruwan']
  },
  {
    id: 'suf-3',
    suffix: '-sina',
    type: 'independiente',
    slotOrder: 6,
    function: 'Evidencial conjetural-reportativo: parece que, tal vez, dicen que',
    cochabambaUsage: 'Forma distintiva cochabambina. Expresa una deducción probable o noticia indirecta ("parece que vendrá", "dicen que es así").',
    examples: ['Jamu-n-sina (parece que viene / dicen que viene)', 'Allin-sina (parece que está bien)']
  },
  {
    id: 'suf-4',
    suffix: '-chá',
    type: 'independiente',
    slotOrder: 6,
    function: 'Dubitativo / Conjetural: tal vez, quizás, probablemente',
    cochabambaUsage: 'Indica suposición personal incierta.',
    examples: ['Jamu-nqa-chá (quizás venga)', 'Wasiypi-chá (tal vez esté en mi casa)']
  },
  {
    id: 'suf-5',
    suffix: '-raj',
    type: 'independiente',
    slotOrder: 5,
    function: 'Continuativo temporal: todavía, aún',
    cochabambaUsage: 'En ortografía boliviana se escribe con "j" final. Es sumamente frecuente en respuestas y explicaciones de espera.',
    examples: ['Mikhu-sha-ni-raj (todavía estoy comiendo)', 'Mana-raj (todavía no)', 'Kashan-raj (todavía está)']
  },
  {
    id: 'suf-6',
    suffix: '-taj',
    type: 'independiente',
    slotOrder: 6,
    function: 'Contraste, interrogativo o enfático: ¿y tú?, pues, en cambio',
    cochabambaUsage: 'Clítico vital en el diálogo cochabambino: "Qan-taj?" (¿Y tú?), "Ima-ta-taj ruwashanki?" (¿Qué estás haciendo pues?).',
    examples: ['Qan-taj? (¿Y vos / y tú?)', 'Ima-ta-taj munanki? (¿Qué quieres pues?)', 'Noqa-taj risaq (yo en cambio iré)']
  },
  {
    id: 'suf-7',
    suffix: '-puni',
    type: 'independiente',
    slotOrder: 5,
    function: 'Enfático categórico de certeza: siempre, definitivamente, sí o sí',
    cochabambaUsage: 'Equivale al bolivianismo "siempre" en el sentido de seguridad absoluta: "Paqarin jamusaq-puni" (vendré definitivamente).',
    examples: ['Arí-puni (sí o sí, definitivamente)', 'Jamu-saq-puni (vendré sin falta)', 'Pay-puni (él mismo siempre)']
  },
  {
    id: 'suf-8',
    suffix: '-lla',
    type: 'independiente',
    slotOrder: 5,
    function: 'Afectivo, cortés y limitativo: sólo, nomás, con cariño',
    cochabambaUsage: 'Fundamental en la cortesía andina boliviana: "Allin-lla-chu?" (¿Bien nomás?). Suaviza cualquier afirmación o ruego.',
    examples: ['Allin-lla-chu kashanki?', 'Noqa-lla jamuni (sólo yo vine)', 'Jamuy-lla (pasa nomás)']
  },
  {
    id: 'suf-9',
    suffix: '-qa',
    type: 'independiente',
    slotOrder: 6,
    function: 'Topicalizador: en cuanto a, respecto a',
    cochabambaUsage: 'Marca el tema o tópico principal de la oración sin añadir caso sintáctico.',
    examples: ['Noqa-qa Cochabambamanta kani', 'Pay-qa mana yachanchu']
  },
  {
    id: 'suf-10',
    suffix: '-chu',
    type: 'independiente',
    slotOrder: 6,
    function: 'Interrogativo de sí/no o polarizador negativo (con mana)',
    cochabambaUsage: 'Obligatorio en preguntas polares ("Allillanchu?") y en negación ("Mana mikhunichu").',
    examples: ['Allin-lla-chu?', 'Mana yacha-ni-chu', 'Qanchu kanki?']
  },

  // 3. Sufijos Nominales (Pluralizadores, Casos y Posesivos)
  {
    id: 'suf-plural-vocal',
    suffix: '-s',
    type: 'nominal',
    slotOrder: 1,
    function: 'Pluralizador nominal en bases terminadas en vocal (ej. wasis, runas)',
    cochabambaUsage: 'En el quechua cochabambino, los sustantivos terminados en vocal forman el plural añadiendo "-s" (wasis, allqus, tutas).',
    examples: ['wasi-s (casas)', 'allqu-s (perros)', 'tata-s (padres)', 'wawa-s (niños)']
  },
  {
    id: 'suf-plural-consonante',
    suffix: '-kuna',
    type: 'nominal',
    slotOrder: 1,
    function: 'Pluralizador nominal en bases terminadas en consonante (ej. atojkuna)',
    cochabambaUsage: 'Si el sustantivo termina en consonante (como "j", "r", "n"), el plural se forma añadiendo el sufijo "-kuna" (atojkuna, yawarkuna).',
    examples: ['atoj-kuna (zorros)', 'yawar-kuna (sangres)', 'runa-kuna (variante colectiva)']
  },
  {
    id: 'suf-11',
    suffix: '-pi',
    type: 'nominal',
    slotOrder: 4,
    function: 'Locativo: en, dentro de, sobre',
    cochabambaUsage: 'Indica lugar o tiempo estacionario.',
    examples: ['Wasi-y-pi (en mi casa)', 'Cochabamba-pi (en Cochabamba)', 'Chajra-pi (en la chacra)']
  },
  {
    id: 'suf-12',
    suffix: '-manta',
    type: 'nominal',
    slotOrder: 4,
    function: 'Ablativo / Origen / Materia: de, desde, acerca de',
    cochabambaUsage: 'Indica procedencia geográfica o material del que está hecho algo.',
    examples: ['Llajta-manta (del pueblo)', 'Quri-manta (de oro)', 'Chay-manta (después, por eso)']
  },
  {
    id: 'suf-13',
    suffix: '-man',
    type: 'nominal',
    slotOrder: 4,
    function: 'Ilativo / Direccional: hacia, a',
    cochabambaUsage: 'Indica dirección o destino del movimiento.',
    examples: ['Wasi-man (hacia la casa)', 'Merkao-man (al mercado)', 'Kay-man (aquí/hacia acá)']
  },
  {
    id: 'suf-14',
    suffix: '-wan',
    type: 'nominal',
    slotOrder: 4,
    function: 'Instrumental y Sociativo: con, mediante',
    cochabambaUsage: 'Expresa compañía ("con él") o instrumento ("con la cuchara").',
    examples: ['Tata-y-wan (con mi padre)', 'Qan-wan (contigo)', 'K\'aspi-wan (con el palo)']
  },
  {
    id: 'suf-15',
    suffix: '-ta',
    type: 'nominal',
    slotOrder: 4,
    function: 'Acusativo / Objeto directo y Adverbializador',
    cochabambaUsage: 'Marca el objeto directo que recibe la acción verbal y convierte adjetivos en adverbios (sumaq -> sumaqta = bien).',
    examples: ['T\'anta-ta mikhuni (como pan)', 'Sumaq-ta parlanki (hablas bien)']
  },
  {
    id: 'suf-16',
    suffix: '-pa',
    type: 'nominal',
    slotOrder: 4,
    function: 'Genitivo: de (posesión y pertenencia)',
    cochabambaUsage: 'Expresa pertenencia sobre el poseedor (Tata-pa wasi-n = la casa de mi padre).',
    examples: ['Maria-pa wawan', 'Tatay-pa jallp\'an']
  },
  {
    id: 'suf-17',
    suffix: '-rayku',
    type: 'nominal',
    slotOrder: 4,
    function: 'Causal: por causa de, por motivo de',
    cochabambaUsage: 'Explica la razón de un hecho.',
    examples: ['Qan-rayku jamuni (vine por ti)', 'Chiri-rayku mana llojsinichu']
  },

  // 4. Sufijos Posesivos Nominales (Slot 2 de nombres)
  {
    id: 'suf-pos-1sg',
    suffix: '-y',
    type: 'nominal',
    slotOrder: 2,
    function: 'Posesivo 1ra persona singular: mi / mío (ej. wasiy = mi casa)',
    cochabambaUsage: 'Se adhiere a bases nominales terminadas en vocal. Si termina en consonante, toma el infijo de enlace eufónico "-ni-" (ej. yawar-ni-y).',
    examples: ['wasi-y (mi casa)', 'tata-y (mi padre)', 'yawar-ni-y (mi sangre)']
  },
  {
    id: 'suf-pos-2sg',
    suffix: '-yki',
    type: 'nominal',
    slotOrder: 2,
    function: 'Posesivo 2da persona singular: tu / tuyo (ej. wasiyki = tu casa)',
    cochabambaUsage: 'Se adhiere a bases nominales terminadas en vocal (tras consonante con -ni-: yawar-ni-yki).',
    examples: ['wasi-yki (tu casa)', 'mama-yki (tu madre)', 'allqu-yki (tu perro)']
  },
  {
    id: 'suf-pos-3sg',
    suffix: '-n',
    type: 'nominal',
    slotOrder: 2,
    function: 'Posesivo 3ra persona singular: su / de él o ella (ej. wasin = su casa)',
    cochabambaUsage: 'Marca la posesión de tercera persona no diferenciada por género (tras consonante: atoj-ni-n).',
    examples: ['wasi-n (su casa)', 'llajta-n (su pueblo)', 'atoj-ni-n (su zorro)']
  },
  {
    id: 'suf-pos-1pl-incl',
    suffix: '-nchij',
    type: 'nominal',
    slotOrder: 2,
    function: 'Posesivo 1ra persona plural inclusiva: nuestro (tú y yo)',
    cochabambaUsage: 'En el quechua boliviano y cochabambino se escribe con terminación "j" (-nchij o alomorfo vocal -nchej; tras consonante: -ninchij).',
    examples: ['wasi-nchij (nuestra casa incl.)', 'llajta-nchij (nuestro pueblo)', 'yawar-ni-nchij (nuestra sangre)']
  },
  {
    id: 'suf-pos-1pl-excl',
    suffix: '-yku',
    type: 'nominal',
    slotOrder: 2,
    function: 'Posesivo 1ra persona plural exclusiva: nuestro (de nosotros, pero no de ti)',
    cochabambaUsage: 'Diferencia estricta en el quechua andino entre nosotros inclusivo (-nchij) y exclusivo (-yku).',
    examples: ['wasi-yku (nuestra casa excl.)', 'llajta-yku (nuestro pueblo excl.)']
  },
  {
    id: 'suf-pos-2pl',
    suffix: '-ykichij',
    type: 'nominal',
    slotOrder: 2,
    function: 'Posesivo 2da persona plural: vuestro / su de ustedes',
    cochabambaUsage: 'Formado por la base de segunda persona -yki y el pluralizador inclusivo de persona -chij con "j".',
    examples: ['wasi-ykichij (la casa de ustedes)', 'tata-ykichij (el padre de ustedes)']
  },
  {
    id: 'suf-pos-3pl',
    suffix: '-nku',
    type: 'nominal',
    slotOrder: 2,
    function: 'Posesivo 3ra persona plural: su de ellos / de ellas',
    cochabambaUsage: 'Sufijo posesivo nominal plural de tercera persona (ej. wasinku = la casa de ellos).',
    examples: ['wasi-nku (su casa de ellos)', 'chajra-nku (su chacra de ellos)']
  },
  {
    id: 'suf-pos-eufonico',
    suffix: '-ni-',
    type: 'nominal',
    slotOrder: 2,
    function: 'Alomorfo de enlace eufónico para posesivos sobre bases terminadas en consonante',
    cochabambaUsage: 'Obligatorio cuando el sustantivo termina en consonante para permitir la concatenación del posesivo.',
    examples: ['yawar-ni-y (mi sangre)', 'atoj-ni-n (su zorro)', 'papas-ni-yku (nuestras papas)']
  },

  // 5. Flexión Verbal: Presente Simple
  {
    id: 'suf-18',
    suffix: '-ni',
    type: 'verbal',
    slotOrder: 3,
    function: 'Presente 1ra persona singular: yo (ej. mikhuni = yo como)',
    cochabambaUsage: 'Desinencia verbal de sujeto yo en presente simple y en tiempos compuestos.',
    examples: ['mikhu-ni (como)', 'ka-sha-ni (estoy)', 'yacha-ni (sé)']
  },
  {
    id: 'suf-19',
    suffix: '-nki',
    type: 'verbal',
    slotOrder: 3,
    function: 'Presente 2da persona singular: tú / vos (ej. mikhunki = tú comes)',
    cochabambaUsage: 'Desinencia verbal de sujeto tú/vos.',
    examples: ['ka-sha-nki (estás)', 'mikhu-nki (comes)', 'parla-nki (hablas)']
  },
  {
    id: 'suf-20',
    suffix: '-n',
    type: 'verbal',
    slotOrder: 3,
    function: 'Presente 3ra persona singular: él / ella (ej. mikhun = él come)',
    cochabambaUsage: 'Desinencia verbal de sujeto él/ella.',
    examples: ['ka-sha-n (está)', 'mikhu-n (come)', 'jamu-n (viene)']
  },
  {
    id: 'suf-21',
    suffix: '-nchij',
    type: 'verbal',
    slotOrder: 3,
    function: 'Presente 1ra persona plural inclusiva: nosotros (tú y yo)',
    cochabambaUsage: 'En ortografía boliviana RM 1032/84 termina en "-nchij" con "j".',
    examples: ['ka-sha-nchij (estamos incl.)', 'mikhu-nchij (comemos incl.)', 'ruwa-nchij (hacemos incl.)']
  },
  {
    id: 'suf-verb-pres-1pl-excl',
    suffix: '-yku',
    type: 'verbal',
    slotOrder: 3,
    function: 'Presente 1ra persona plural exclusiva: nosotros (él y yo, no tú)',
    cochabambaUsage: 'Desinencia verbal de sujeto exclusivo.',
    examples: ['mikhu-yku (comemos nosotros solos)', 'llank\'a-yku (trabajamos nosotros)']
  },
  {
    id: 'suf-verb-pres-2pl',
    suffix: '-nkichij',
    type: 'verbal',
    slotOrder: 3,
    function: 'Presente 2da persona plural: ustedes / vosotros (ej. mikhunkichij = ustedes comen)',
    cochabambaUsage: 'Con terminación boliviana en "j" (-nkichij en lugar del peruano -nkichis).',
    examples: ['ka-sha-nkichij (están ustedes)', 'mikhu-nkichij (ustedes comen)']
  },
  {
    id: 'suf-verb-pres-3pl',
    suffix: '-nku',
    type: 'verbal',
    slotOrder: 3,
    function: 'Presente 3ra persona plural: ellos / ellas (ej. mikhunku = ellos comen)',
    cochabambaUsage: 'Desinencia verbal de tercera persona plural.',
    examples: ['ka-sha-nku (están ellos)', 'jamu-nku (vienen)', 'parla-sha-nku (están hablando)']
  },

  // 6. Flexión Verbal: Pasado Testimonial / Experimentado (-rqa-)
  {
    id: 'suf-pas-rqa',
    suffix: '-rqa-',
    type: 'verbal',
    slotOrder: 3,
    function: 'Pasado testimonial / experimentado directo: acción presenciada o vivida personalmente',
    cochabambaUsage: 'Sufijo temporal de pasado directo: -rqa- seguido de las marcas personales de sujeto (-rqani, -rqanki, -rqa, -rqanchij, -rqayku, -rqankichij, -rqanku).',
    examples: ['ruwa-rqa-ni (hice / yo lo vi)', 'jamu-rqa (vino)', 'parla-rqa-nkichij (ustedes hablaron)']
  },

  // 7. Flexión Verbal: Pasado No Testimonial / Narrativo (-sqa-)
  {
    id: 'suf-pas-sqa',
    suffix: '-sqa-',
    type: 'verbal',
    slotOrder: 3,
    function: 'Pasado no testimonial / narrativo / reportativo: "había sido", hechos no presenciados directamente',
    cochabambaUsage: 'Indica hechos conocidos por deducción, sorpresa o relato de terceros: -sqani, -sqanki, -sqa, -sqanchij, -sqayku, -sqankichij, -sqanku.',
    examples: ['jamu-sqa (había venido / dicen que vino)', 'puñu-sqa-ni (me había dormido)', 'ruwa-sqa-nku (habían hecho)']
  },

  // 8. Flexión Verbal: Futuro
  {
    id: 'suf-fut-1sg',
    suffix: '-saq',
    type: 'verbal',
    slotOrder: 3,
    function: 'Futuro 1ra persona singular: yo haré / iré',
    cochabambaUsage: 'Desinencia de primera persona futuro (ej. jamusaq = vendré; risaq = iré).',
    examples: ['jamu-saq (vendré)', 'ri-saq (iré)', 'ruwa-saq (haré)']
  },
  {
    id: 'suf-fut-3sg',
    suffix: '-nqa',
    type: 'verbal',
    slotOrder: 3,
    function: 'Futuro 3ra persona singular: él / ella hará / vendrá',
    cochabambaUsage: 'Desinencia de tercera persona futuro (ej. jamunqa = vendrá).',
    examples: ['jamu-nqa (vendrá)', 'ka-nqa (habrá/será)', 'ruwa-nqa (hará)']
  },
  {
    id: 'suf-fut-1pl-incl',
    suffix: '-sunchij',
    type: 'verbal',
    slotOrder: 3,
    function: 'Futuro 1ra persona plural inclusiva / exhortativo: haremos / hagamos (tú y yo)',
    cochabambaUsage: 'Forma obligatoria boliviana con "j" final (-sunchij / -sunchis). Muy común en despedidas y compromisos afectivos.',
    examples: ['parlari-sunchij (conversemos / hablaremos)', 'mikhuri-sunchij (comeremos juntos)', 'puri-sunchij (caminemos)']
  },
  {
    id: 'suf-fut-1pl-excl',
    suffix: '-saqku',
    type: 'verbal',
    slotOrder: 3,
    function: 'Futuro 1ra persona plural exclusiva: nosotros haremos (sin ti)',
    cochabambaUsage: 'Desinencia de futuro exclusivo (nosotros iremos sin ti).',
    examples: ['ri-saqku (iremos nosotros)', 'ruwa-saqku (haremos nosotros)']
  },
  {
    id: 'suf-fut-3pl',
    suffix: '-nqanku',
    type: 'verbal',
    slotOrder: 3,
    function: 'Futuro 3ra persona plural: ellos / ellas harán / vendrán',
    cochabambaUsage: 'Desinencia de futuro plural de tercera persona.',
    examples: ['jamu-nqanku (vendrán ellos)', 'llank\'a-nqanku (trabajarán)']
  },

  // 9. Modo Imperativo / Exhortativo y Prohibitivo
  {
    id: 'suf-imp-2sg',
    suffix: '-y',
    type: 'verbal',
    slotOrder: 3,
    function: 'Imperativo 2da persona singular: ¡haz tú! (ej. jamuy = ¡ven!, mikhiy = ¡come!)',
    cochabambaUsage: 'Forma canónica de orden o ruego afirmativo y prohibitivo (con ama ... -chu).',
    examples: ['jamu-y (¡ven!)', 'ama waqa-y-chu (¡no llores!)', 'parla-y (¡habla!)']
  },
  {
    id: 'suf-imp-3sg',
    suffix: '-chun',
    type: 'verbal',
    slotOrder: 3,
    function: 'Imperativo 3ra persona singular: ¡que haga él / ella!',
    cochabambaUsage: 'Mandato u orden indirecta hacia una tercera persona (ej. kachun = que sea; jamuchun = que venga).',
    examples: ['Allin ch\'isi ka-chun (¡que sea una buena tarde!)', 'jamu-chun (¡que venga él!)']
  },
  {
    id: 'suf-imp-2pl',
    suffix: '-ychij',
    type: 'verbal',
    slotOrder: 3,
    function: 'Imperativo 2da persona plural: ¡hagan ustedes! (ej. jamuychij = ¡vengan!)',
    cochabambaUsage: 'Terminación oficial boliviana en "j" (-ychij en lugar del cusqueño -ychis).',
    examples: ['jamu-ychij (¡vengan ustedes!)', 'mikhuri-ychij (¡coman ustedes!)']
  },
  {
    id: 'suf-imp-3pl',
    suffix: '-chunku',
    type: 'verbal',
    slotOrder: 3,
    function: 'Imperativo 3ra persona plural: ¡que hagan ellos!',
    cochabambaUsage: 'Mandato indirecto hacia terceras personas en plural.',
    examples: ['ruwa-chunku (¡que lo hagan ellos!)', 'jamu-chunku (¡que vengan!)']
  },

  // 10. Imperfecto y Pasado Habitual
  {
    id: 'suf-impf-habitual',
    suffix: '-j ka-rqa-',
    type: 'verbal',
    slotOrder: 3,
    function: 'Imperfecto / Pasado Habitual perifrástico: solía hacer / hacía habitualmente',
    cochabambaUsage: 'Construcción con participio agentivo en -j y el verbo kay en pasado testimonial (-rqani, -rqanki, etc.).',
    examples: ['parla-j ka-rqa-ni (yo solía hablar / hablaba)', 'jamu-j ka-rqa (solía venir)']
  },

  // 11. Potencial Simple / Condicional Modal (-man)
  {
    id: 'suf-pot-1sg',
    suffix: '-yman',
    type: 'verbal',
    slotOrder: 3,
    function: 'Potencial simple 1ra persona: yo podría / haría / quisiera',
    cochabambaUsage: 'Expresa deseo hipotético o cortesía (ej. munayman = quisiera; ruwayman = podría hacer).',
    examples: ['muna-yman (quisiera)', 'ri-yman (yo podría ir)', 'parla-yman (podría hablar)']
  },
  {
    id: 'suf-pot-2sg',
    suffix: '-waq',
    type: 'verbal',
    slotOrder: 3,
    function: 'Potencial simple 2da persona: tú podrías / harías',
    cochabambaUsage: 'Sufijo sintético específico de segunda persona potencial en el quechua cochabambino.',
    examples: ['jamu-waq (podrías venir)', 'ruwa-waq (podrías hacerlo)', 'mikhuri-waq (podrías comer)']
  },
  {
    id: 'suf-pot-3sg',
    suffix: '-nman',
    type: 'verbal',
    slotOrder: 3,
    function: 'Potencial simple 3ra persona: él / ella podría / haría',
    cochabambaUsage: 'Expresa posibilidad o eventualidad de tercera persona.',
    examples: ['jamu-nman (él podría venir)', 'ka-nman (podría ser)', 'allin ka-nman (estaría bien)']
  },
  {
    id: 'suf-pot-1pl-incl',
    suffix: '-swanchij',
    type: 'verbal',
    slotOrder: 3,
    function: 'Potencial simple 1ra persona plural inclusiva: nosotros podríamos / haríamos (tú y yo)',
    cochabambaUsage: 'En el quechua boliviano termina en "-swanchij" con "j" (-swanchis en Perú).',
    examples: ['ruwa-swanchij (podríamos hacerlo juntos)', 'ri-swanchij (podríamos ir)']
  },
  {
    id: 'suf-pot-3pl',
    suffix: '-nmanku',
    type: 'verbal',
    slotOrder: 3,
    function: 'Potencial simple 3ra persona plural: ellos podrían / harían',
    cochabambaUsage: 'Posibilidad o conjetura en tercera persona plural.',
    examples: ['jamu-nmanku (ellos podrían venir)', 'ruwa-nmanku (podrían hacer)']
  },

  // 12. Subjuntivo, Subordinación y Participios Personales
  {
    id: 'suf-subord-na',
    suffix: '-na-',
    type: 'verbal',
    slotOrder: 2,
    function: 'Subjuntivo / Obligativo / Propósito: acción que debe ser realizada o para que se realice',
    cochabambaUsage: 'Base para la perífrasis de obligación "kananchej tiyan" y oraciones de propósito con -paj (mikhunaypaj).',
    examples: ['ruwa-na-nchij tiyan (tenemos que hacer)', 'jamu-na-y-paj (para que yo venga)']
  },
  {
    id: 'suf-subord-spa',
    suffix: '-spa',
    type: 'verbal',
    slotOrder: 2,
    function: 'Gerundio / Subordinador de sujeto idéntico: al hacer... / haciendo...',
    cochabambaUsage: 'Conecta dos cláusulas cuando el sujeto de ambas acciones es la misma persona.',
    examples: ['parlari-spa kusikuni (conversando me alegro)', 'mikhuspa jamuni (vengo habiendo comido)']
  },
  {
    id: 'suf-subord-jtin',
    suffix: '-jtin',
    type: 'verbal',
    slotOrder: 2,
    function: 'Subordinador de cambio de sujeto: cuando haga él... / si hace otro...',
    cochabambaUsage: 'En ortografía oficial boliviana se escribe "-jtin" con "j" (en contraste con el cusqueño "-qtin" o "-pti-").',
    examples: ['para jamu-jtin (cuando la lluvia venga)', 'tata parla-jtin (al hablar mi padre)']
  },
  {
    id: 'suf-part-agentivo-j',
    suffix: '-j',
    type: 'verbal',
    slotOrder: 2,
    function: 'Participio presente activo / Agentivo personal: el que hace habitualmente o va a hacer',
    cochabambaUsage: 'Convierte el verbo en sustantivo de actor ("el que...") o indica propósito de movimiento (paqarin llank\'aj jamusaq).',
    examples: ['llank\'a-j (trabajador / el que trabaja)', 'jamu-j tiempo (tiempo venidero/futuro)', 'mikhu-j rini (voy a comer)']
  },
  {
    id: 'suf-part-pasivo-sqa',
    suffix: '-sqa',
    type: 'verbal',
    slotOrder: 2,
    function: 'Participio pasado pasivo / Resultativo: hecho, comido, alegrado',
    cochabambaUsage: 'Indica el estado resultante de la acción (adjetivo derivado o complemento pasivo).',
    examples: ['kusisqa (contento / alegrado)', 'ruwa-sqa (hecho)', 'mikhusqa (comido)']
  }
];

export const SEED_PHRASES: CorpusPhrase[] = [
  {
    id: 'phrase-1',
    quechua: 'Wasiypi kashani, jamuylla.',
    spanish: 'Estoy en mi casa, pasa nomás.',
    morphologicalBreakdown: 'wasi-y-pi ka-sha-ni jamu-y-lla',
    gloss: 'casa-1SG.POSS-LOC ser/estar-PROG-1SG venir-IMP-AFECT',
    grammaticalNotes: 'Uso del progresivo cochabambino -sha- (kashani) y la cortesía con -lla.',
    tags: ['cotidiano', 'bienvenida', 'progresivo'],
    verified: true
  },
  {
    id: 'phrase-2',
    quechua: 'Allinllachu kashanki, tata?',
    spanish: '¿Estás bien nomás, señor / don?',
    morphologicalBreakdown: 'allin-lla-chu ka-sha-nki tata',
    gloss: 'bien-AFECT-INTERR ser/estar-PROG-2SG señor',
    grammaticalNotes: 'Saludo canónico de respeto en el valle cochabambino.',
    tags: ['saludo', 'cortesía', 'respeto'],
    verified: true
  },
  {
    id: 'phrase-3',
    quechua: 'Mikhushani-raj, mana riyta atinichu.',
    spanish: 'Todavía estoy comiendo, no puedo ir.',
    morphologicalBreakdown: 'mikhu-sha-ni-raj mana ri-y-ta ati-ni-chu',
    gloss: 'comer-PROG-1SG-CONT NEG ir-INF-ACUS poder-1SG-NEG',
    grammaticalNotes: 'Enlace del continuativo -raj con "j" y la construcción de verbo de habilidad atiy + infinitivo acusativo.',
    tags: ['alimentación', 'negación', 'continuativo'],
    verified: true
  },
  {
    id: 'phrase-4',
    quechua: 'Imatataj ruwashanki qan?',
    spanish: '¿Y tú qué estás haciendo?',
    morphologicalBreakdown: 'ima-ta-taj ruwa-sha-nki qan',
    gloss: 'qué-ACUS-ENF hacer-PROG-2SG tú',
    grammaticalNotes: 'Pregunta abierta con pronombre interrogativo ima- + acusativo -ta + clítico enfático -taj.',
    tags: ['conversación', 'pregunta', 'progresivo'],
    verified: true
  },
  {
    id: 'phrase-5',
    quechua: 'Paqarin jamusaqpuni llank\'aj.',
    spanish: 'Mañana vendré definitivamente a trabajar.',
    morphologicalBreakdown: 'paqarin jamu-saq-puni llank\'a-j',
    gloss: 'mañana venir-1SG.FUT-CATEG trabajar-AGENTE',
    grammaticalNotes: 'El clítico -puni confirma compromiso inequívoco. El sufijo -j marca propósito de movimiento ("a trabajar").',
    tags: ['trabajo', 'futuro', 'certeza'],
    verified: true
  },
  {
    id: 'phrase-6',
    quechua: 'Chay runa Cochabambamanta jamun-sina.',
    spanish: 'Dicen que esa persona viene de Cochabamba.',
    morphologicalBreakdown: 'chay runa Cochabamba-manta jamu-n-sina',
    gloss: 'esa persona Cochabamba-ORIG venir-3SG-REP',
    grammaticalNotes: 'El evidencial cochabambino -sina indica información no presenciada directamente ("parece que / dicen que").',
    tags: ['origen', 'evidencial', 'dialectal'],
    verified: true
  },
  {
    id: 'phrase-7',
    quechua: 'Qhichwata sumaqta yachakuyta munani.',
    spanish: 'Quiero aprender quechua muy bien.',
    morphologicalBreakdown: 'qhichwa-ta sumaq-ta yacha-ku-y-ta muna-ni',
    gloss: 'quechua-ACUS bueno-ACUS saber-REFL-INF-ACUS querer-1SG',
    grammaticalNotes: 'Adverbialización con -ta sobre sumaq y doble acusativo complementario del verbo desiderativo munay.',
    tags: ['aprendizaje', 'estudio'],
    verified: true
  },
  {
    id: 'phrase-condicional-1',
    quechua: 'Sichus sajra munayninchejta atipayta munanchej chayqa, concientes kananchej tiyan imachus debilidadninchej kasqanmanta.',
    spanish: 'Si queremos vencer nuestra debilidad (deseo malo), debemos ser conscientes de qué tipo de debilidad es.',
    morphologicalBreakdown: 'sichus sajra munay-ninchej-ta atipa-y-ta muna-nchej chayqa , concientes ka-na-nchej tiya-n ima-chus debilidad-ninchej ka-sqa-n-manta',
    gloss: 'COND malo deseo-1PL.INCL-ACUS vencer-INF-ACUS querer-1PL.INCL COND.TOP , conscientes ser-OBLIG-1PL.INCL haber-3SG qué-DUB debilidad-1PL.INCL ser-NOMZ-3SG-ABL',
    grammaticalNotes: 'Estructura condicional con "sichus" explícito y "chayqa" obligatorio al cierre de la prótasis. Perífrasis modal de obligación "kananchej tiyan".',
    tags: ['condicional', 'sichus', 'chayqa', 'oraciones-complejas'],
    verified: true
  },
  {
    id: 'phrase-condicional-2',
    quechua: 'Jehová Diosta kasukunki chayqa, jamoj tiempopi ashkha bendicionesta japʼinki.',
    spanish: 'Si obedeces a Jehová, en el tiempo que viene recibirás muchas bendiciones.',
    morphologicalBreakdown: 'Jehová Dios-ta kasu-ku-nki chayqa , jamu-j tiempo-pi ashkha bendiciones-ta japʼi-nki',
    gloss: 'Jehová Dios-ACUS obedecer-REFL-2SG COND.TOP , venir-AG tiempo-LOC mucho bendición.PL-ACUS recibir-2SG',
    grammaticalNotes: 'Condicional con omisión natural de "sichus" y marca "chayqa". Léxico cochabambino: ashkha (mucho), jamoj (-j boliviano), verbo japʼiy (recibir).',
    tags: ['condicional', 'chayqa', 'cochabambino', 'oraciones-complejas'],
    verified: true
  }
];

export const SEED_DOUBTS: CriticalDoubt[] = [
  {
    id: 'doubt-1',
    term: 'kachkani',
    trigger: 'dialect_variant',
    contextPhrase: 'Wasiypi kachkani (encontrado en traducciones externas)',
    occurrences: 14,
    aiHypothesis: 'Forma general del quechua sureño (Cuzco-Collao/Ayacucho) con sufijo progresivo -chka-.',
    quechuistaQuestion: '¿Es preferible desestimar sistemáticamente "-chka-" en favor de "-sha-" (kashani) para el contexto estricto de Cochabamba?',
    suggestedAction: 'Corregir en cascada a "kashani" y normalizar las 14 ocurrencias.',
    status: 'pending',
    createdAt: '2026-11-02T12:00:00Z'
  },
  {
    id: 'doubt-2',
    term: 'tiyampun',
    trigger: 'out_of_glossary',
    contextPhrase: 'Pay tiyampun parlanapaj (prestamo castellanizado)',
    occurrences: 9,
    aiHypothesis: 'Préstamo hispano "tiempo" verbalizado con morfología quechua (-mpu transitivo benefactivo + -n).',
    quechuistaQuestion: '¿Se acepta "tiyampun" en quechua coloquial cochabambino o el hablante estándar prefiere "tiempo tiyapun" o "horasnin tiyan"?',
    suggestedAction: 'Consultar al quechuista antes de validar en el banco oficial.',
    status: 'queued_for_expert',
    createdAt: '2026-11-02T14:30:00Z'
  },
  {
    id: 'doubt-3',
    term: 'parlarisunchis',
    trigger: 'dialect_variant',
    contextPhrase: 'Paqarin parlarisunchis (sufijo plural -chis de Perú)',
    occurrences: 6,
    aiHypothesis: 'Uso del sufijo pluralizante -chis (propio del quechua cusqueño) en lugar del plural boliviano -nchij / -sunchij.',
    quechuistaQuestion: '¿Confirma que la desinencia boliviana obligatoria para 1ra persona plural del futuro exhortativo es -sunchij con "j"?',
    suggestedAction: 'Corregir a "parlarisunchij" para mantener cohesión ortográfica boliviana.',
    status: 'pending',
    createdAt: '2026-11-02T15:10:00Z'
  },
  {
    id: 'doubt-4',
    term: 'ch\'allarikuyku',
    trigger: 'low_confidence',
    contextPhrase: 'Chajrapi ch\'allarikuyku carnavalespi',
    occurrences: 4,
    aiHypothesis: 'Verbo de ofrenda y libación ritual ch\'allay con aspecto intensivo/cortés -ri, reflexivo -ku y plural exclusivo -yku.',
    quechuistaQuestion: '¿En la tradición cochabambina contemporánea se distingue estrictamente el exclusivo -yku del inclusivo -nchij en rituales comunitarios?',
    suggestedAction: 'Marcar en lista de consulta para profundizar con el quechuista.',
    status: 'queued_for_expert',
    createdAt: '2026-11-02T16:00:00Z'
  }
];

export const SEED_GRAMMAR_RULES: GrammarRule[] = [
  {
    id: 'rule-1',
    title: 'Aspecto Progresivo Cochabambino (-sha-)',
    category: 'Morfología Verbal',
    description: 'En el quechua cochabambino, el aspecto continuo ("estar haciendo") se realiza fonológica y ortográficamente como -sha-, a diferencia de la variedad cusqueña que conserva -chka-.',
    cochabambaSpecificity: 'Obligatorio en Cochabamba: kashani, mikhushani, ruwashani, jamushani.',
    examples: [
      { quechua: 'Kashani', spanish: 'Estoy', morphology: 'ka-sha-ni', gloss: 'estar-PROG-1SG' },
      { quechua: 'Mikhushani', spanish: 'Estoy comiendo', morphology: 'mikhu-sha-ni', gloss: 'comer-PROG-1SG' },
      { quechua: 'Parlashanku', spanish: 'Están conversando', morphology: 'parla-sha-nku', gloss: 'hablar-PROG-3PL' }
    ]
  },
  {
    id: 'rule-2',
    title: 'Clíticos Independientes: -min, -sina, -chá, -raj, -taj, -puni',
    category: 'Clíticos y Evidencialidad',
    description: 'Los sufijos independientes se ubican siempre al final de la palabra aglutinada (slot 5 y 6). Transmiten actitud epistémica, contraste y temporalidad.',
    cochabambaSpecificity: '-min marca testimonio directo; -sina es la marca típica cochabambina de deducción/reporte; -chá dubitativo; -raj ("todavía") y -taj ("pues/y...") se escriben con "j"; -puni ("siempre/categórico").',
    examples: [
      { quechua: 'Noqamin rini', spanish: 'Yo mismo voy (de certeza)', morphology: 'noqa-min ri-ni', gloss: 'yo-DIR ir-1SG' },
      { quechua: 'Jamun-sina', spanish: 'Parece que viene / dicen que viene', morphology: 'jamu-n-sina', gloss: 'venir-3SG-REP' },
      { quechua: 'Mikhushani-raj', spanish: 'Todavía estoy comiendo', morphology: 'mikhu-sha-ni-raj', gloss: 'comer-PROG-1SG-CONT' },
      { quechua: 'Qan-taj?', spanish: '¿Y tú?', morphology: 'qan-taj', gloss: 'tú-ENF' },
      { quechua: 'Arí-puni', spanish: 'Definitivamente sí', morphology: 'arí-puni', gloss: 'sí-CATEG' }
    ]
  },
  {
    id: 'rule-3',
    title: 'Orden Estricto de Concatenación Aglutinante',
    category: 'Sintaxis de la Palabra',
    description: 'El quechua es una lengua de sufijación pura. En los nombres: Raíz + Posesivo + Caso + Independiente. En los verbos: Raíz + Derivativo + Aspecto (-sha-) + Flexión de tiempo/sujeto + Clítico independiente.',
    cochabambaSpecificity: 'Un sufijo independiente como -taj o -puni nunca puede preceder a un sufijo de caso como -pi o de flexión de persona.',
    examples: [
      { quechua: 'Wasi-y-pi-taj', spanish: '¿Y en mi casa?', morphology: 'wasi (raíz) + -y (pos) + -pi (caso) + -taj (indep)' },
      { quechua: 'Ruwa-sha-n-puni', spanish: 'Definitivamente lo está haciendo', morphology: 'ruwa (raíz) + -sha (prog) + -n (3sg) + -puni (categ)' }
    ]
  },
  {
    id: 'rule-4',
    title: 'Ortografía Oficial Boliviana (RM 1032/84)',
    category: 'Fonología y Grafía',
    description: 'Uso de "j" en posición inicial de palabras aspiradas (jatun, jamuy, jallp\'a) y en coda silábica (llajta, -raj, -taj, -nchij). Tres vocales fonémicas (a, i, u) con apertura facultativa ante posvelares.',
    cochabambaSpecificity: 'Evitar la "h" peruana (hatun -> jatun) y la desinencia cusqueña "-chka-" (-sha-) o "-chis" (-nchij).',
    examples: [
      { quechua: 'jatun wasi', spanish: 'casa grande' },
      { quechua: 'llajtanchij', spanish: 'nuestro pueblo' }
    ]
  },
  {
    id: 'rule-plural-cochabamba',
    title: 'Formación del Plural: -s (vocal) / -kuna (consonante)',
    category: 'Morfología Nominal (Pluralización)',
    description: 'Regla para formar el plural nominal en quechua cochabambino: si la palabra termina en vocal, se le añade una -s (ejemplo: wasis); si termina en consonante, se le agrega el sufijo -kuna (ejemplo: atojkuna).',
    cochabambaSpecificity: 'Diferenciación fonológica cochabambina: en bases vocálicas se usa sistemáticamente la desinencia "-s" (wasis, allqus, tutas, wawas) y en bases consonánticas el sufijo aglutinante "-kuna" (atojkuna, yawarkuna). En contraste con otras variantes del quechua que aplican "-kuna" indistintamente.',
    examples: [
      { quechua: 'wasis', spanish: 'casas (termina en vocal -i + -s)', morphology: 'wasi-s', gloss: 'casa-PL' },
      { quechua: 'atojkuna', spanish: 'zorros (termina en consonante -j + -kuna)', morphology: 'atoj-kuna', gloss: 'zorro-PL' },
      { quechua: 'allqus', spanish: 'perros (termina en vocal -u + -s)', morphology: 'allqu-s', gloss: 'perro-PL' },
      { quechua: 'yawarkuna', spanish: 'sangres (termina en consonante -r + -kuna)', morphology: 'yawar-kuna', gloss: 'sangre-PL' }
    ]
  },
  {
    id: 'rule-negacion-declarativa',
    title: '1. Negación Declarativa (mana + ...-chu)',
    category: 'Sintaxis y Polaridad (Negación Declarativa)',
    description: 'Para negar una declaración o aserción, se utiliza la estructura discontinua mana + ...-chu. La partícula mana se coloca al inicio y el sufijo -chu se añade al final de la palabra exacta que se desea negar (normalmente el verbo principal o la acción). Fórmula: mana + [Palabra/Verbo a negar] + -chu. Casos especiales con el verbo kay (ser/estar/haber): 1) Inexistencia ("No hay"): se utiliza obligatoriamente la forma "kanchu" (tercera persona de kay). 2) Estados temporales y sentimientos: se utiliza la raíz de continuidad kasha- acompañada del sufijo -chu (ej. Mana kusisqachu kashani).',
    cochabambaSpecificity: 'En Cochabamba, la negación declarativa siempre requiere la presencia del clítico -chu. Para "no hay" se usa kanchu (ej. Mana qolqe kanchu). En estados temporales se combina con el progresivo cochabambino -sha- (kashani), nunca con -chka-. En 1ra persona plural se escribe con terminación oficial boliviana en "j": -nchij (Mana chayta ruwananchijchu tiyan).',
    examples: [
      { quechua: 'Mana chayta ruwananchijchu tiyan', spanish: 'No tenemos que hacer eso', morphology: 'mana chay-ta ruwa-na-nchij-chu tiya-n', gloss: 'NEG eso-ACUS hacer-OBLIG-1PL.INCL-NEG haber-3SG' },
      { quechua: 'Mana qolqe kanchu', spanish: 'No hay dinero (inexistencia con verbo kay)', morphology: 'mana qolqe ka-n-chu', gloss: 'NEG dinero ser/haber-3SG-NEG' },
      { quechua: 'Mana kusisqachu kashani', spanish: 'No estoy feliz (estado temporal con kasha-)', morphology: 'mana kusisqa-chu ka-sha-ni', gloss: 'NEG feliz-NEG ser/estar-PROG-1SG' },
      { quechua: 'Mana yachanichu', spanish: 'No sé / No conozco', morphology: 'mana yacha-ni-chu', gloss: 'NEG saber-1SG-NEG' }
    ]
  },
  {
    id: 'rule-negacion-imperativa',
    title: '2. Negación Imperativa y Prohibición (ama + ...-chu)',
    category: 'Modalidad Imperativa y Prohibición',
    description: 'Para dar una orden negativa, prohibir una acción o decir "¡No hagas eso!", NO se usa mana. En su lugar, se emplea la partícula ama combinada obligatoriamente con el sufijo -chu en el verbo imperativo. Fórmula: ama + [Verbo en imperativo] + -chu.',
    cochabambaSpecificity: 'Diferenciación estricta y obligatoria entre mana (declarativo) y ama (prohibitivo). En Cochabamba la ortografía oficial boliviana (RM 1032/84) escribe con "j" los verbos que en Perú llevan "q" o "p" (ej. "ama llojsiychu" en lugar de "ama lloqsiychu"; "ama chayta ujyaychu" en lugar de "upyaychu").',
    examples: [
      { quechua: 'Ama waqaychu', spanish: 'No llores', morphology: 'ama waqa-y-chu', gloss: 'PROHIB llorar-IMP-NEG' },
      { quechua: 'Ama phiñakuychu', spanish: 'No te enojes', morphology: 'ama phiña-ku-y-chu', gloss: 'PROHIB enojar-REFL-IMP-NEG' },
      { quechua: 'Ama chayta ujyaychu', spanish: 'No tomes / bebas eso', morphology: 'ama chay-ta ujya-y-chu', gloss: 'PROHIB eso-ACUS tomar-IMP-NEG' },
      { quechua: 'Ama llojsiychu', spanish: 'No salgas', morphology: 'ama llojsi-y-chu', gloss: 'PROHIB salir-IMP-NEG' }
    ]
  },
  {
    id: 'rule-condicional-chayqa',
    title: '3. Oraciones Condicionales: (Sichus) ... chayqa',
    category: 'Sintaxis Compleja (Subordinación Condicional)',
    description: 'Para expresar una condición (equivalente al "si..." condicional en español), se utiliza la estructura (Sichus) ... chayqa. La oración se divide en dos partes: la condición (prótasis) y la consecuencia (apódosis).\n• Fórmula: (Sichus) + [Oración condicional] + chayqa , [Oración principal]\n• Nota clave: La partícula inicial sichus es opcional (a veces no es necesaria en el quechua natural). Sin embargo, el conector/sufijo chayqa es obligatorio al final de la primera frase para marcar el cierre de la condición.',
    cochabambaSpecificity: 'En el quechua de Cochabamba y Bolivia, "sichus" deriva del préstamo hispano "si" con el sufijo dubitativo-conjetural "-chus". En el habla espontánea cotidiana, es sumamente habitual prescindir de "sichus" y marcar la subordinación condicional exclusivamente con el conector topicalizador "chayqa". La cláusula integra rasgos cochabambinos característicos: terminación verbal inclusiva -nchej / -nchij (munanchej), ortografía con "j" (sajra, jamoj, atipay), léxico regional (ashkha en lugar del cusqueño achka) y grafía eyectiva (japʼinki).',
    examples: [
      {
        quechua: 'Sichus sajra munayninchejta atipayta munanchej chayqa, concientes kananchej tiyan imachus debilidadninchej kasqanmanta.',
        spanish: 'Si queremos vencer nuestra debilidad (deseo malo), debemos ser conscientes de qué tipo de debilidad es.',
        morphology: 'sichus sajra munay-ninchej-ta atipa-y-ta muna-nchej chayqa , concientes ka-na-nchej tiya-n ima-chus debilidad-ninchej ka-sqa-n-manta',
        gloss: 'COND malo deseo-1PL.INCL-ACUS vencer-INF-ACUS querer-1PL.INCL COND.TOP , conscientes ser-OBLIG-1PL.INCL haber-3SG qué-DUB debilidad-1PL.INCL ser-NOMZ-3SG-ABL'
      },
      {
        quechua: 'Jehová Diosta kasukunki chayqa, jamoj tiempopi ashkha bendicionesta japʼinki.',
        spanish: 'Si obedeces a Jehová, en el tiempo que viene, muchas bendiciones recibirás (agarrarás).',
        morphology: 'Jehová Dios-ta kasu-ku-nki chayqa , jamu-j tiempo-pi ashkha bendiciones-ta japʼi-nki',
        gloss: 'Jehová Dios-ACUS obedecer-REFL-2SG COND.TOP , venir-AG tiempo-LOC mucho bendición.PL-ACUS recibir-2SG'
      },
      {
        quechua: 'Qullqiy kanqa chayqa, wasita rantisaq.',
        spanish: 'Si tengo dinero (si habrá dinero), compraré una casa.',
        morphology: 'qullqi-y ka-nqa chayqa , wasi-ta ranti-saq',
        gloss: 'dinero-1SG.POSS ser/haber-3SG.FUT COND.TOP , casa-ACUS comprar-1SG.FUT'
      }
    ]
  },
  {
    id: 'rule-posesivos-nominales',
    title: '4. Sufijos Posesivos Nominales y Alomorfo Eufónico -ni-',
    category: 'Morfología Nominal (Posesivos)',
    description: 'En quechua cochabambino la posesión se indica mediante sufijos adheridos a la base nominal (Slot 2). Si la raíz termina en consonante, se inserta obligatoriamente el sufijo eufónico de enlace "-ni-".\n\nPARADIGMA COMPLETO:\n• 1ra Persona Singular (mi / mío): -y (en vocal: wasi-y / en consonante: yawar-ni-y)\n• 2da Persona Singular (tu / tuyo): -yki (wasi-yki / yawar-ni-yki)\n• 3ra Persona Singular (su / de él o ella): -n (wasi-n / yawar-ni-n)\n• 1ra Persona Plural Inclusiva (nuestro tú y yo): -nchij (wasi-nchij / yawar-ni-nchij)\n• 1ra Persona Plural Exclusiva (nuestro él y yo, no tú): -yku (wasi-yku / yawar-ni-yku)\n• 2da Persona Plural (vuestro / de ustedes): -ykichij (wasi-ykichij / yawar-ni-ykichij)\n• 3ra Persona Plural (su de ellos / ellas): -nku (wasi-nku / yawar-ni-nku)',
    cochabambaSpecificity: 'En Cochabamba y la norma boliviana RM 1032/84, las terminaciones de plural de persona se escriben con "j" (-nchij, -ykichij, -nchej). El ligador "-ni-" es estrictamente obligatorio tras consonante (ej. atoj-ni-y, nunca *atojy).',
    examples: [
      { quechua: 'Wasiy', spanish: 'Mi casa', morphology: 'wasi-y', gloss: 'casa-1SG.POSS' },
      { quechua: 'Wasiyki', spanish: 'Tu casa', morphology: 'wasi-yki', gloss: 'casa-2SG.POSS' },
      { quechua: 'Wasin', spanish: 'Su casa (de él/ella)', morphology: 'wasi-n', gloss: 'casa-3SG.POSS' },
      { quechua: 'Wasinchij', spanish: 'Nuestra casa (inclusivo: tú y yo)', morphology: 'wasi-nchij', gloss: 'casa-1PL.INCL.POSS' },
      { quechua: 'Wasiyku', spanish: 'Nuestra casa (exclusivo: ellos y yo, sin ti)', morphology: 'wasi-yku', gloss: 'casa-1PL.EXCL.POSS' },
      { quechua: 'Wasiykichij', spanish: 'Vuestra casa (de ustedes)', morphology: 'wasi-ykichij', gloss: 'casa-2PL.POSS' },
      { quechua: 'Wasinku', spanish: 'Su casa (de ellos/ellas)', morphology: 'wasi-nku', gloss: 'casa-3PL.POSS' },
      { quechua: 'Yawarniy', spanish: 'Mi sangre (raíz en consonante -r con alomorfo -ni-)', morphology: 'yawar-ni-y', gloss: 'sangre-EUF-1SG.POSS' }
    ]
  },
  {
    id: 'rule-tiempos-verbales',
    title: '5. Paradigma de Tiempos Verbales: Presente, Pasados (-rqa- / -sqa-) y Futuro',
    category: 'Morfología Verbal (Tiempos)',
    description: 'La flexión temporal y de persona en el quechua cochabambino distingue cuatro tiempos cardinales:\n\n1. PRESENTE:\n• 1SG: -ni (mikhuni = yo como)\n• 2SG: -nki (mikhunki = tú comes)\n• 3SG: -n (mikhun = él come)\n• 1PL.INCL: -nchij (mikhunchij = comemos juntos)\n• 1PL.EXCL: -yku (mikhuyku = comemos nosotros solos)\n• 2PL: -nkichij (mikhunkichij = ustedes comen)\n• 3PL: -nku (mikhunku = ellos comen)\n\n2. PASADO TESTIMONIAL DIRECTO (-rqa-):\nAcción presenciada o experimentada personalmente.\n• 1SG: -rqani (ruwarqani = hice)\n• 2SG: -rqanki (ruwarqanki = hiciste)\n• 3SG: -rqa (ruwarqa = hizo)\n• 1PL.INCL: -rqanchij (ruwarqanchij = hicimos juntos)\n• 1PL.EXCL: -rqayku (ruwarqayku = hicimos nosotros)\n• 2PL: -rqankichij (ruwarqankichij = hicieron ustedes)\n• 3PL: -rqanku (ruwarqanku = hicieron ellos)\n\n3. PASADO NO TESTIMONIAL / NARRATIVO (-sqa-):\nAcción no vista directamente, deducida o reportada (\"había sido/hecho\").\n• 1SG: -sqani (puñusqani = me había dormido)\n• 2SG: -sqanki (jamusqanki = habías venido)\n• 3SG: -sqa (jamusqa = había venido / dicen que vino)\n• 1PL.INCL: -sqanchij\n• 1PL.EXCL: -sqayku\n• 2PL: -sqankichij\n• 3PL: -sqanku\n\n4. FUTURO:\n• 1SG: -saq (jamusaq = vendré)\n• 2SG: -nki (jamunki = vendrás)\n• 3SG: -nqa (jamunqa = vendrá)\n• 1PL.INCL (Exhortativo): -sunchij (parlasunchij = hablaremos/hablemos)\n• 1PL.EXCL: -saqku (risaqku = iremos sin ti)\n• 2PL: -nkichij (jamunkichij = vendrán ustedes)\n• 3PL: -nqanku (jamunqanku = vendrán ellos)',
    cochabambaSpecificity: 'El futuro inclusivo en Cochabamba se realiza obligatoriamente como -sunchij con "j" (nunca -sunchis). El pasado testimonial -rqa- se distingue rígidamente del evidencial -sqa- en la narración andina.',
    examples: [
      { quechua: 'Ruwani', spanish: 'Hago (presente 1sg)', morphology: 'ruwa-ni', gloss: 'hacer-1SG' },
      { quechua: 'Ruwarqani', spanish: 'Hice (pasado testimonial 1sg, lo viví)', morphology: 'ruwa-rqa-ni', gloss: 'hacer-PAS.TEST-1SG' },
      { quechua: 'Ruwasqa', spanish: 'Había hecho (pasado no testimonial 3sg, deducido)', morphology: 'ruwa-sqa', gloss: 'hacer-PAS.NARR.3SG' },
      { quechua: 'Ruwasaq', spanish: 'Haré (futuro 1sg)', morphology: 'ruwa-saq', gloss: 'hacer-1SG.FUT' },
      { quechua: 'Parlasunchij', spanish: 'Hablaremos / Conversemos juntos (futuro inclusivo)', morphology: 'parla-sunchij', gloss: 'hablar-1PL.INCL.FUT' }
    ]
  },
  {
    id: 'rule-modo-imperativo-potencial',
    title: '6. Modo Imperativo, Imperfecto Habitual y Potencial Simple (-man)',
    category: 'Modalidad Verbal (Imperativo y Potencial)',
    description: '1. IMPERATIVO (Órdenes y exhortaciones afirmativas o prohibitivas con ama...-chu):\n• 2SG: -y (¡haz! ej. jamuy, mikhiy, ama waqaychu)\n• 3SG: -chun (¡que haga! ej. jamuchun, allin p\'unchay kachun)\n• 1PL.INCL: -na / -sunchij (¡hagamos! ej. jamuychisunchij)\n• 2PL: -ychij (¡hagan ustedes! ej. jamuychij)\n• 3PL: -chunku (¡que hagan ellos! ej. ruwachunku)\n\n2. IMPERFECTO / HABITUAL PASADO:\nAcción repetida o habitual en el pasado (\"solía hacer\").\n• Estructura perifrástica: Raíz + -j (agentivo) + kay en pasado (karqani, karqanki, karqa...).\n• Ejemplo: parla-j ka-rqa-ni = \"yo solía hablar / hablaba habitualmente\".\n• O aspecto continuativo pasado: mikhu-sha-rqa-ni = \"estaba comiendo / comía\".\n\n3. POTENCIAL SIMPLE / CONDICIONAL MODAL (-man):\nExpresa posibilidad, cortesía, deseo o hipótesis (\"yo podría / haría\").\n• 1SG: -yman (munayman = yo quisiera / podría querer)\n• 2SG: -waq (jamuwaq = tú podrías venir / vendrías)\n• 3SG: -nman (allin kanman = estaría bien / podría ser)\n• 1PL.INCL: -swanchij (ruwaswanchij = podríamos hacerlo juntos)\n• 1PL.EXCL: -saqkuman (risaqkuman = nosotros podríamos ir sin ti)\n• 2PL: -waqchij (ruwawaqchij = ustedes podrían hacerlo)\n• 3PL: -nmanku (jamunmanku = ellos podrían venir)',
    cochabambaSpecificity: 'La segunda persona potencial -waq es sintética e icónica en Cochabamba ("jamuwaq" = podrías venir). En imperativo plural se escribe con "j" (-ychij, jamás -ychis).',
    examples: [
      { quechua: 'Jamuy!', spanish: '¡Ven! (imperativo 2sg)', morphology: 'jamu-y', gloss: 'venir-IMP.2SG' },
      { quechua: 'Jamuychij!', spanish: '¡Vengan ustedes! (imperativo 2pl)', morphology: 'jamu-ychij', gloss: 'venir-IMP.2PL' },
      { quechua: 'Munayman', spanish: 'Quisiera / Yo podría desear (potencial 1sg)', morphology: 'muna-y-man', gloss: 'querer-1SG.POT' },
      { quechua: 'Jamuwaq', spanish: 'Podrías venir (potencial 2sg)', morphology: 'jamu-waq', gloss: 'venir-2SG.POT' },
      { quechua: 'Allin kanman', spanish: 'Estaría bien / Podría ser (potencial 3sg)', morphology: 'allin ka-n-man', gloss: 'bueno ser-3SG.POT' },
      { quechua: 'Parlaj karqani', spanish: 'Yo solía hablar / hablaba (imperfecto habitual)', morphology: 'parla-j ka-rqa-ni', gloss: 'hablar-AG ser-PAS.TEST-1SG' }
    ]
  },
  {
    id: 'rule-subordinacion-participios',
    title: '7. Subjuntivo, Subordinadores (-na-, -spa, -jtin) y Participios (-j, -sqa)',
    category: 'Sintaxis Compleja (Subordinación y Formas No Finitas)',
    description: '1. SUBJUNTIVO Y OBLIGACIÓN (-na-):\nNominalizador de acción obligatoria o subordinada. Con sufijo posesivo y perífrasis tiyan: \"ruwa-na-nchij tiyan\" (tenemos que hacer). Con dativo/benefactivo -paj para finalidad: \"jamu-na-y-paj\" (para que yo venga).\n\n2. GERUNDIO / SUJETO IDÉNTICO (-spa):\nUne dos cláusulas donde el sujeto no cambia: \"parlari-spa kusikuni\" (hablando me alegro).\n\n3. SUBORDINADOR TEMPORAL / CAMBIO DE SUJETO (-jtin):\nIndica \"cuando / al momento que\" con cambio de sujeto: \"tata jamu-jtin, parlasunchij\" (cuando mi padre venga, hablaremos).\n\n4. PARTICIPIO PRESENTE PERSONAL / AGENTIVO (-j):\nIndica la persona que realiza la acción habitualmente (\"el que...\") o finalidad inmediata de movimiento: \"llank\'a-j\" (trabajador / el que trabaja), \"jamu-j tiempo\" (tiempo venidero), \"mikhuj rini\" (voy a comer).\n\n5. PARTICIPIO PASADO / PASIVO (-sqa):\nIndica el estado resultante o pasivo de la acción: \"ruwa-sqa\" (hecho), \"kusisqa\" (contento/alegre), \"t\'anta mikhusqa\" (pan comido).',
    cochabambaSpecificity: 'En Bolivia la grafía oficial es con "j": -jtin (RM 1032/84), rechazando la grafía peruana con "q" (-qtin). El participio agentivo -j es la base del futuro venidero "jamoj tiempo".',
    examples: [
      { quechua: 'Ruwananchij tiyan', spanish: 'Tenemos que hacer (subjuntivo/obligación con -na-)', morphology: 'ruwa-na-nchij tiya-n', gloss: 'hacer-NOMZ-1PL.INCL.POSS haber-3SG' },
      { quechua: 'Mikhunaypaj', spanish: 'Para que yo coma (propósito con -na- + -y + -paj)', morphology: 'mikhu-na-y-paj', gloss: 'comer-NOMZ-1SG.POSS-DAT' },
      { quechua: 'Parlarispamin kusikuni', spanish: 'Conversando ciertamente me alegro (sujeto idéntico con -spa)', morphology: 'parla-ri-spa-min kusi-ku-ni', gloss: 'hablar-INTENS-GER-DIR alegrar-REFL-1SG' },
      { quechua: 'Para jamujtin', spanish: 'Cuando la lluvia venga (cambio de sujeto con -jtin)', morphology: 'para jamu-jtin', gloss: 'lluvia venir-SUBORD.DIF' },
      { quechua: 'Llank\'aj runas', spanish: 'Gente trabajadora (participio activo/agentivo con -j)', morphology: 'llank\'a-j runa-s', gloss: 'trabajar-AG persona-PL' }
    ]
  }
];
