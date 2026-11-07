import { LexicalRoot, CorpusPhrase } from '../types/quechua';

export type SentencePattern =
  | 'all'
  | 'progresivo'
  | 'pasado_directo'
  | 'futuro_cochabamba'
  | 'copula_cero'
  | 'existencia'
  | 'pregunta_polar'
  | 'pregunta_info'
  | 'condicional'
  | 'prohibicion'
  | 'negacion_decl'
  | 'potencial'
  | 'posesivo_eufonico'
  | 'castellanismo';

export type DailyDomain =
  | 'all'
  | 'hogar_familia'
  | 'mercado_comida'
  | 'chajra_trabajo'
  | 'movimiento_viaje'
  | 'salud_emociones'
  | 'dialogo_cortesia';

export interface GeneratedSentence {
  id: string;
  quechua: string;
  spanish: string;
  morphologicalBreakdown: string;
  gloss: string;
  grammaticalNotes: string;
  pattern: SentencePattern;
  patternLabel: string;
  domain: DailyDomain;
  domainLabel: string;
  usedRoots: { id: string; quechua: string; spanish: string; category: string }[];
  usedSuffixes: string[];
}

export const PATTERN_LABELS: Record<SentencePattern, { name: string; desc: string; marker: string }> = {
  all: { name: 'Todos los patrones', desc: 'Muestreo aleatorio representativo', marker: 'Variado' },
  progresivo: { name: 'Aspecto Progresivo (-sha-)', desc: 'Acciones en curso cotidianas (nunca -chka-)', marker: '-sha-' },
  pasado_directo: { name: 'Pasado Testimonial (-rqa-)', desc: 'Acciones vivenciadas directamente hoy o ayer', marker: '-rqa-' },
  futuro_cochabamba: { name: 'Futuro Inclusivo/Exclusivo', desc: 'Inclusivo en -sunchij y exclusivo en -sajku', marker: '-sunchij / -sajku' },
  copula_cero: { name: 'Cópula Cero (Verbo Kay)', desc: 'Identidad y atribución en 3SG sin "kan"', marker: 'Payqa ... Ø' },
  existencia: { name: 'Existencia (Kan / Mana kanchu)', desc: 'Haber / no haber cosas o recursos', marker: 'kan / kanchu' },
  pregunta_polar: { name: 'Preguntas Polares (-chu)', desc: 'Preguntas de confirmación sí / no', marker: '-chu?' },
  pregunta_info: { name: 'Preguntas Informativas', desc: 'Con pronombres interrogativos e interrogativo -taj', marker: 'Ima...taj?' },
  condicional: { name: 'Condicionales (Sichus... chayqa)', desc: 'Estructuras de condición de la vida diaria', marker: 'sichus... chayqa' },
  prohibicion: { name: 'Prohibición Imperativa (Ama... -chu)', desc: 'Advertencias y órdenes negativas con ama', marker: 'ama... -chu' },
  negacion_decl: { name: 'Negación Declarativa (Mana... -chu)', desc: 'Enunciados negativos con mana', marker: 'mana... -chu' },
  potencial: { name: 'Modo Potencial (-man)', desc: 'Cortesía, deseos e hipótesis en -man / -waq', marker: '-man' },
  posesivo_eufonico: { name: 'Posesivo Eufónico (-ni-)', desc: 'Inserción obligatoria de -ni- tras consonante', marker: '-ni-' },
  castellanismo: { name: 'Castellanismos en -y', desc: 'Préstamos verbales flexionados con sufijos quechuas', marker: 'Verbo-y' },
};

export const DOMAIN_LABELS: Record<DailyDomain, { name: string; desc: string }> = {
  all: { name: 'Todos los dominios', desc: 'Cotidiano general de Cochabamba' },
  hogar_familia: { name: 'Hogar y Familia', desc: 'Wasi, tata, mama, wawa, quehaceres' },
  mercado_comida: { name: 'Mercado y Alimentos', desc: 'Qhatu, t\'anta, aycha, rantiy, qullqi' },
  chajra_trabajo: { name: 'Chacra y Labores', desc: 'Chajra, jallp\'a, llank\'ay, tarpuy, ruway' },
  movimiento_viaje: { name: 'Movimiento y Traslado', desc: 'Riy, jamuy, llojsiy, ñan, llajta, mayu' },
  salud_emociones: { name: 'Salud y Emociones', desc: 'Allin, kusisqa, onqoy, chiri, llakiy' },
  dialogo_cortesia: { name: 'Diálogo y Cortesía', desc: 'Napaykuy, allillanchu, tapuy, parla' },
};

/* ───────────────────── Utilidades Morfológicas ───────────────────── */

const isVowelEnding = (word: string): boolean => {
  const clean = word.trim().toLowerCase().replace(/['ʼ]/g, '');
  return /[aeiouáéíóú]$/i.test(clean);
};

export const getVerbStem = (verbInfinitive: string): string => {
  const clean = verbInfinitive.trim();
  if (clean.toLowerCase().endsWith('y') && clean.length > 2) {
    return clean.slice(0, -1);
  }
  return clean;
};

export interface NounInflectionOptions {
  plural?: boolean;
  possessive?: '1SG' | '2SG' | '3SG' | '1PL.INCL' | '1PL.EXCL' | '2PL' | '3PL';
  caseSuffix?: 'ACC' | 'LOC' | 'ALL' | 'ABL' | 'COM' | 'GEN' | 'CAUS';
  clitic?: 'TOP' | 'DIR' | 'LIM' | 'CONT' | 'CONTR' | 'ASEV' | 'DUB' | 'INTERR';
}

export const inflectNoun = (
  rootNoun: string,
  rootSpanish: string,
  options: NounInflectionOptions
): { surface: string; breakdown: string; gloss: string } => {
  const base = rootNoun.trim();
  const vowel = isVowelEnding(base);

  const parts: string[] = [base];
  const glossParts: string[] = [rootSpanish.split(/[,;(]/)[0].trim().replace(/\s+/g, '.')];

  // 1. Plural
  if (options.plural) {
    if (vowel) {
      parts.push('s');
      glossParts.push('PL');
    } else {
      parts.push('kuna');
      glossParts.push('PL');
    }
  }

  // 2. Possessive with euphonic -ni- after consonant
  if (options.possessive) {
    const endsInVowelNow = options.plural ? false : vowel;
    if (!endsInVowelNow) {
      parts.push('ni');
      glossParts.push('EUF');
    }

    const posMap: Record<string, { suf: string; gl: string }> = {
      '1SG': { suf: 'y', gl: '1SG.POSS' },
      '2SG': { suf: 'yki', gl: '2SG.POSS' },
      '3SG': { suf: 'n', gl: '3SG.POSS' },
      '1PL.INCL': { suf: 'nchij', gl: '1PL.INCL.POSS' },
      '1PL.EXCL': { suf: 'yku', gl: '1PL.EXCL.POSS' },
      '2PL': { suf: 'ykichij', gl: '2PL.POSS' },
      '3PL': { suf: 'nku', gl: '3PL.POSS' },
    };
    const p = posMap[options.possessive];
    if (p) {
      parts.push(p.suf);
      glossParts.push(p.gl);
    }
  }

  // 3. Case suffixes
  if (options.caseSuffix) {
    const caseMap: Record<string, { suf: string; gl: string }> = {
      ACC: { suf: 'ta', gl: 'ACC' },
      LOC: { suf: 'pi', gl: 'LOC' },
      ALL: { suf: 'man', gl: 'ALL' },
      ABL: { suf: 'manta', gl: 'ABL' },
      COM: { suf: 'wan', gl: 'COM' },
      GEN: { suf: 'pa', gl: 'GEN' },
      CAUS: { suf: 'rayku', gl: 'CAUS' },
    };
    const c = caseMap[options.caseSuffix];
    if (c) {
      parts.push(c.suf);
      glossParts.push(c.gl);
    }
  }

  // 4. Clitic
  if (options.clitic) {
    const cliticMap: Record<string, { suf: string; gl: string }> = {
      TOP: { suf: 'qa', gl: 'TOP' },
      DIR: { suf: 'min', gl: 'EVID.DIR' },
      LIM: { suf: 'lla', gl: 'LIM' },
      CONT: { suf: 'raj', gl: 'CONT' },
      CONTR: { suf: 'taj', gl: 'CONTR' },
      ASEV: { suf: 'puni', gl: 'ASEV' },
      DUB: { suf: 'chá', gl: 'DUB' },
      INTERR: { suf: 'chu', gl: 'INTERR' },
    };
    const cl = cliticMap[options.clitic];
    if (cl) {
      parts.push(cl.suf);
      glossParts.push(cl.gl);
    }
  }

  const surface = parts.join('');
  const breakdown = parts.join('-');
  const gloss = glossParts.join('-');

  return { surface, breakdown, gloss };
};

export interface VerbInflectionOptions {
  tense: 'presente' | 'progresivo' | 'pasado_exp' | 'pasado_narr' | 'futuro' | 'potencial' | 'imperativo';
  person: '1SG' | '2SG' | '3SG' | '1PL.INCL' | '1PL.EXCL' | '2PL' | '3PL';
  negativeInterrogative?: boolean;
  clitic?: 'CONT' | 'CONTR' | 'ASEV' | 'LIM' | 'DIR';
}

export const inflectVerb = (
  rootVerb: string,
  rootSpanish: string,
  options: VerbInflectionOptions
): { surface: string; breakdown: string; gloss: string } => {
  const stem = getVerbStem(rootVerb);
  const baseGloss = rootSpanish.split(/[,;(]/)[0].trim().replace(/\s+/g, '.');

  const parts: string[] = [stem];
  const glossParts: string[] = [baseGloss];

  const p = options.person;

  switch (options.tense) {
    case 'presente': {
      const presEnds: Record<string, string> = {
        '1SG': 'ni',
        '2SG': 'nki',
        '3SG': 'n',
        '1PL.INCL': 'nchij',
        '1PL.EXCL': 'yku',
        '2PL': 'nkichij',
        '3PL': 'nku',
      };
      parts.push(presEnds[p] || 'n');
      glossParts.push(p);
      break;
    }
    case 'progresivo': {
      // Strictly -sha- for Cochabamba!
      parts.push('sha');
      glossParts.push('PROG');
      const presEnds: Record<string, string> = {
        '1SG': 'ni',
        '2SG': 'nki',
        '3SG': 'n',
        '1PL.INCL': 'nchij',
        '1PL.EXCL': 'yku',
        '2PL': 'nkichij',
        '3PL': 'nku',
      };
      parts.push(presEnds[p] || 'n');
      glossParts.push(p);
      break;
    }
    case 'pasado_exp': {
      parts.push('rqa');
      glossParts.push('PST.EXP');
      const pstEnds: Record<string, string> = {
        '1SG': 'ni',
        '2SG': 'nki',
        '3SG': '',
        '1PL.INCL': 'nchij',
        '1PL.EXCL': 'yku',
        '2PL': 'nkichij',
        '3PL': 'nku',
      };
      const end = pstEnds[p];
      if (end) {
        parts.push(end);
      }
      glossParts.push(p);
      break;
    }
    case 'pasado_narr': {
      parts.push('sqa');
      glossParts.push('PST.NARR');
      const pstEnds: Record<string, string> = {
        '1SG': 'ni',
        '2SG': 'nki',
        '3SG': '',
        '1PL.INCL': 'nchij',
        '1PL.EXCL': 'yku',
        '2PL': 'nkichij',
        '3PL': 'nku',
      };
      const end = pstEnds[p];
      if (end) {
        parts.push(end);
      }
      glossParts.push(p);
      break;
    }
    case 'futuro': {
      const futEnds: Record<string, { suf: string; gl: string }> = {
        '1SG': { suf: 'saq', gl: 'FUT.1SG' },
        '2SG': { suf: 'nki', gl: 'FUT.2SG' },
        '3SG': { suf: 'nqa', gl: 'FUT.3SG' },
        '1PL.INCL': { suf: 'sunchij', gl: 'FUT.1PL.INCL' },
        '1PL.EXCL': { suf: 'sajku', gl: 'FUT.1PL.EXCL' }, // Canonical Cochabambino
        '2PL': { suf: 'nkichij', gl: 'FUT.2PL' },
        '3PL': { suf: 'nqanku', gl: 'FUT.3PL' },
      };
      const f = futEnds[p];
      parts.push(f.suf);
      glossParts.push(f.gl);
      break;
    }
    case 'potencial': {
      const potEnds: Record<string, { suf: string; gl: string }> = {
        '1SG': { suf: 'yman', gl: 'POT.1SG' },
        '2SG': { suf: 'waq', gl: 'POT.2SG' },
        '3SG': { suf: 'nman', gl: 'POT.3SG' },
        '1PL.INCL': { suf: 'swanchij', gl: 'POT.1PL.INCL' },
        '1PL.EXCL': { suf: 'saqkuman', gl: 'POT.1PL.EXCL' },
        '2PL': { suf: 'waqchij', gl: 'POT.2PL' },
        '3PL': { suf: 'nmanku', gl: 'POT.3PL' },
      };
      const pt = potEnds[p];
      parts.push(pt.suf);
      glossParts.push(pt.gl);
      break;
    }
    case 'imperativo': {
      const impEnds: Record<string, { suf: string; gl: string }> = {
        '2SG': { suf: 'y', gl: 'IMP.2SG' },
        '3SG': { suf: 'chun', gl: 'IMP.3SG' },
        '1PL.INCL': { suf: 'sunchij', gl: 'IMP.1PL.INCL' },
        '2PL': { suf: 'ychij', gl: 'IMP.2PL' },
        '3PL': { suf: 'chunku', gl: 'IMP.3PL' },
        '1SG': { suf: 'y', gl: 'IMP.2SG' },
        '1PL.EXCL': { suf: 'sunchij', gl: 'IMP.1PL.INCL' },
      };
      const im = impEnds[p];
      parts.push(im.suf);
      glossParts.push(im.gl);
      break;
    }
  }

  // Polar question or negative polar clitic -chu
  if (options.negativeInterrogative) {
    parts.push('chu');
    glossParts.push('NEG/INTERR');
  }

  // Clitic
  if (options.clitic) {
    const cliticMap: Record<string, { suf: string; gl: string }> = {
      CONT: { suf: 'raj', gl: 'CONT' },
      CONTR: { suf: 'taj', gl: 'CONTR' },
      ASEV: { suf: 'puni', gl: 'ASEV' },
      LIM: { suf: 'lla', gl: 'LIM' },
      DIR: { suf: 'min', gl: 'EVID.DIR' },
    };
    const c = cliticMap[options.clitic];
    if (c) {
      parts.push(c.suf);
      glossParts.push(c.gl);
    }
  }

  const surface = parts.join('');
  const breakdown = parts.join('-');
  const gloss = glossParts.join('-');

  return { surface, breakdown, gloss };
};

/* ───────────────────── Generación Inteligente de Corpus ───────────────────── */

const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const findRootByQuechua = (roots: LexicalRoot[], quechua: string): LexicalRoot | undefined =>
  roots.find((r) => r.quechua.toLowerCase() === quechua.toLowerCase());

export function generateCorpusSentence(
  roots: LexicalRoot[],
  preferredPattern?: SentencePattern,
  preferredDomain?: DailyDomain
): GeneratedSentence {
  const allPatterns: SentencePattern[] = [
    'progresivo',
    'pasado_directo',
    'futuro_cochabamba',
    'copula_cero',
    'existencia',
    'pregunta_polar',
    'pregunta_info',
    'condicional',
    'prohibicion',
    'negacion_decl',
    'potencial',
    'posesivo_eufonico',
    'castellanismo',
  ];

  const pattern: SentencePattern =
    preferredPattern && preferredPattern !== 'all' ? preferredPattern : pickRandom(allPatterns);

  const verbs = roots.filter((r) => r.category === 'verbo');
  const nouns = roots.filter((r) => r.category === 'sustantivo');
  const adjs = roots.filter((r) => r.category === 'adjetivo');

  // Fallback safe selections if category filtered is small
  const safeVerb = verbs.length ? pickRandom(verbs) : { id: 'root-mikhuy', quechua: 'mikhuy', spanish: 'comer', category: 'verbo' as const, dialectNote: '', verified: true, frequency: 20, examples: [] };
  const safeNoun = nouns.length ? pickRandom(nouns) : { id: 'root-wasi', quechua: 'wasi', spanish: 'casa', category: 'sustantivo' as const, dialectNote: '', verified: true, frequency: 20, examples: [] };
  const safeAdj = adjs.length ? pickRandom(adjs) : { id: 'root-sumaq', quechua: 'sumaq', spanish: 'bueno, hermoso', category: 'adjetivo' as const, dialectNote: '', verified: true, frequency: 20, examples: [] };

  const id = `gen-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  // 1. Progresivo (-sha-)
  if (pattern === 'progresivo') {
    const v = pickRandom(verbs.filter((x) => !['kay', 'tiyay'].includes(x.quechua.toLowerCase())) || [safeVerb]);
    const n = pickRandom(nouns.filter((x) => ['wasi', 'chajra', 'llajta', 'qhatu', 'mayu', 'yachaywasi', 'jallp\'a'].includes(x.quechua.toLowerCase())) || [safeNoun]);
    const person = pickRandom(['1SG', '2SG', '3SG', '1PL.INCL', '3PL'] as const);

    const pronMap: Record<string, { qu: string; es: string }> = {
      '1SG': { qu: 'Noqa', es: 'Yo' },
      '2SG': { qu: 'Qan', es: 'Tú' },
      '3SG': { qu: 'Pay', es: 'Él/Ella' },
      '1PL.INCL': { qu: 'Noqanchej', es: 'Nosotros' },
      '3PL': { qu: 'Paykuna', es: 'Ellos/Ellas' },
    };
    const pr = pronMap[person];

    const nInf = inflectNoun(n.quechua, n.spanish, {
      possessive: person === '1SG' ? '1SG' : undefined,
      caseSuffix: 'LOC',
    });

    const vInf = inflectVerb(v.quechua, v.spanish, {
      tense: 'progresivo',
      person,
    });

    const vSp = v.spanish.split(/[,;(]/)[0].trim().toLowerCase();
    const nSp = n.spanish.split(/[,;(]/)[0].trim().toLowerCase();

    const quechua = `${pr.qu} ${nInf.surface} ${vInf.surface}.`;
    const spanish = `${pr.es} estoy ${vSp}ando/iendo en ${person === '1SG' ? 'mi' : 'la'} ${nSp}.`.replace('estoy', person === '2SG' ? 'estás' : person === '3SG' ? 'está' : person === '1PL.INCL' ? 'estamos' : person === '3PL' ? 'están' : 'estoy');
    const morphologicalBreakdown = `${pr.qu.toLowerCase()} ${nInf.breakdown} ${vInf.breakdown}`;
    const gloss = `${person} ${nInf.gloss} ${vInf.gloss}`;

    return {
      id,
      quechua,
      spanish,
      morphologicalBreakdown,
      gloss,
      grammaticalNotes: 'Aspecto progresivo cochabambino con el sufijo obligatorio -sha- (nunca -chka-).',
      pattern,
      patternLabel: PATTERN_LABELS[pattern].name,
      domain: 'hogar_familia',
      domainLabel: DOMAIN_LABELS.hogar_familia.name,
      usedRoots: [v, n],
      usedSuffixes: ['-sha-', '-pi', person === '1SG' ? '-y' : '', vInf.surface.endsWith('nchij') ? '-nchij' : '-ni'].filter(Boolean),
    };
  }

  // 2. Pasado testimonial (-rqa-)
  if (pattern === 'pasado_directo') {
    const v = pickRandom(verbs.filter((x) => ['llank\'ay', 'ruway', 'jamuy', 'mikhuy', 'rantiy', 'tarpuy', 'parlay', 'takiy', 'samariy'].includes(x.quechua.toLowerCase())) || [safeVerb]);
    const companion = pickRandom(nouns.filter((x) => ['tata', 'mama', 'wawa', 'masi', 'pana', 'tura', 'wayna', 'sipas'].includes(x.quechua.toLowerCase())) || [safeNoun]);
    const place = pickRandom(nouns.filter((x) => ['chajra', 'wasi', 'qhatu', 'llajta', 'pampa'].includes(x.quechua.toLowerCase())) || [safeNoun]);

    const compInf = inflectNoun(companion.quechua, companion.spanish, {
      possessive: '1SG',
      caseSuffix: 'COM',
    });
    const placeInf = inflectNoun(place.quechua, place.spanish, {
      caseSuffix: 'LOC',
    });
    const vInf = inflectVerb(v.quechua, v.spanish, {
      tense: 'pasado_exp',
      person: '1PL.EXCL', // -rqayku
    });

    const vSp = v.spanish.split(/[,;(]/)[0].trim().toLowerCase();
    const compSp = companion.spanish.split(/[,;(]/)[0].trim().toLowerCase();
    const placeSp = place.spanish.split(/[,;(]/)[0].trim().toLowerCase();

    const quechua = `Qayna ch'isi ${compInf.surface} ${placeInf.surface} ${vInf.surface}.`;
    const spanish = `Ayer en la noche ${vSp}amos con mi ${compSp} en la ${placeSp} (nosotros sin ti).`;
    const morphologicalBreakdown = `qayna ch'isi ${compInf.breakdown} ${placeInf.breakdown} ${vInf.breakdown}`;
    const gloss = `ayer tarde/noche ${compInf.gloss} ${placeInf.gloss} ${vInf.gloss}`;

    return {
      id,
      quechua,
      spanish,
      morphologicalBreakdown,
      gloss,
      grammaticalNotes: 'Pasado testimonial directo -rqa- que indica una acción presenciada personalmente por los hablantes.',
      pattern,
      patternLabel: PATTERN_LABELS[pattern].name,
      domain: 'chajra_trabajo',
      domainLabel: DOMAIN_LABELS.chajra_trabajo.name,
      usedRoots: [v, companion, place],
      usedSuffixes: ['-rqa-', '-yku', '-wan', '-pi', '-y'],
    };
  }

  // 3. Futuro cochabambino (-sunchij / -sajku)
  if (pattern === 'futuro_cochabamba') {
    const isInclusive = Math.random() < 0.5;
    const v = pickRandom(verbs.filter((x) => ['riy', 'jamuy', 'parlay', 'mikhuy', 'rantiy', 'tinkuy', 'kusirikuy'].includes(x.quechua.toLowerCase())) || [safeVerb]);
    const dest = pickRandom(nouns.filter((x) => ['qhatu', 'llajta', 'wasi', 'yachaywasi', 'mayu'].includes(x.quechua.toLowerCase())) || [safeNoun]);

    const destInf = inflectNoun(dest.quechua, dest.spanish, { caseSuffix: 'ALL' });
    const person = isInclusive ? '1PL.INCL' : '1PL.EXCL';
    const vInf = inflectVerb(v.quechua, v.spanish, { tense: 'futuro', person });

    const pron = isInclusive ? 'Noqanchej' : 'Noqayku';
    const pronGloss = isInclusive ? '1PL.INCL' : '1PL.EXCL';
    const vSp = v.spanish.split(/[,;(]/)[0].trim().toLowerCase();
    const destSp = dest.spanish.split(/[,;(]/)[0].trim().toLowerCase();

    const quechua = `Paqarin ${pron} ${destInf.surface} ${vInf.surface}.`;
    const spanish = `Mañana nosotros ${isInclusive ? '(tú y yo)' : '(sin ti)'} iremos/iremos a ${vSp} hacia ${destSp}.`;
    const morphologicalBreakdown = `paqarin ${pron.toLowerCase()} ${destInf.breakdown} ${vInf.breakdown}`;
    const gloss = `mañana ${pronGloss} ${destInf.gloss} ${vInf.gloss}`;

    return {
      id,
      quechua,
      spanish,
      morphologicalBreakdown,
      gloss,
      grammaticalNotes: isInclusive
        ? 'Futuro inclusivo en -sunchij (incluye al oyente en la acción futura).'
        : 'Futuro exclusivo cochabambino canónico en -sajku (excluye al oyente: "nosotros sin ti").',
      pattern,
      patternLabel: PATTERN_LABELS[pattern].name,
      domain: 'movimiento_viaje',
      domainLabel: DOMAIN_LABELS.movimiento_viaje.name,
      usedRoots: [v, dest],
      usedSuffixes: [isInclusive ? '-sunchij' : '-sajku', '-man'],
    };
  }

  // 4. Cópula Cero de Kay en 3SG
  if (pattern === 'copula_cero') {
    const roles = [
      { qu: 'yachachej', es: 'profesor/a', notes: 'Participio agentivo en -j' },
      { qu: 'allin runa', es: 'buena persona', notes: 'Modificador adjetivo + nombre' },
      { qu: 'michej', es: 'pastor/a de ovejas', notes: 'Participio agentivo de michiy' },
      { qu: 'yachaqe', es: 'estudiante', notes: 'Sustantivo derivado de saber' },
      { qu: 'tata José', es: 'don José', notes: 'Sustantivo de respeto' },
      { qu: 'mama Maria', es: 'doña María', notes: 'Sustantivo de respeto' },
    ];
    const role = pickRandom(roles);

    const quechua = `Payqa ${role.qu}.`;
    const spanish = `Él/Ella es ${role.es}.`;
    const morphologicalBreakdown = `pay-qa ${role.qu} [Ø]`;
    const gloss = `3SG-TOP ${role.qu.replace(/\s+/g, '.')} [SER.PRS.3SG.CERO]`;

    return {
      id,
      quechua,
      spanish,
      morphologicalBreakdown,
      gloss,
      grammaticalNotes: 'Regla crítica cochabambina: Cópula cero obligatoria en presente 3ra persona de kay. NUNCA se dice "*Payqa ... kan". La forma "kan" se reserva para existencia ("hay").',
      pattern,
      patternLabel: PATTERN_LABELS[pattern].name,
      domain: 'dialogo_cortesia',
      domainLabel: DOMAIN_LABELS.dialogo_cortesia.name,
      usedRoots: [{ id: 'pron-pay', quechua: 'pay', spanish: 'él, ella', category: 'pronombre' }],
      usedSuffixes: ['-qa', 'Ø (cópula cero)'],
    };
  }

  // 5. Existencia con kan / mana kanchu
  if (pattern === 'existencia') {
    const isNegative = Math.random() < 0.6;
    const resource = pickRandom(nouns.filter((x) => ['qullqi', 't\'anta', 'yaku', 'ch\'arki', 'lawa', 'para', 'jampi'].includes(x.quechua.toLowerCase())) || [safeNoun]);
    const rSp = resource.spanish.split(/[,;(]/)[0].trim().toLowerCase();

    const quechua = isNegative
      ? `Mana ${resource.quechua} kanchu.`
      : `Wasiypi ${resource.quechua} kan.`;
    const spanish = isNegative
      ? `No hay ${rSp}.`
      : `En mi casa hay ${rSp}.`;
    const morphologicalBreakdown = isNegative
      ? `mana ${resource.quechua} ka-n-chu`
      : `wasi-y-pi ${resource.quechua} ka-n`;
    const gloss = isNegative
      ? `NEG ${rSp} haber-3SG-NEG`
      : `casa-1SG.POSS-LOC ${rSp} haber-3SG`;

    return {
      id,
      quechua,
      spanish,
      morphologicalBreakdown,
      gloss,
      grammaticalNotes: 'Uso canónico de "kan": expresa exclusivamente existencia real ("hay") o inexistencia con mana ... -chu ("no hay").',
      pattern,
      patternLabel: PATTERN_LABELS[pattern].name,
      domain: 'mercado_comida',
      domainLabel: DOMAIN_LABELS.mercado_comida.name,
      usedRoots: [resource, { id: 'root-kay', quechua: 'kay', spanish: 'haber, existir', category: 'verbo' }],
      usedSuffixes: isNegative ? ['-n', '-chu'] : ['-n', '-y', '-pi'],
    };
  }

  // 6. Pregunta polar (-chu)
  if (pattern === 'pregunta_polar') {
    const v = pickRandom(verbs.filter((x) => ['jamuy', 'mikhuy', 'parlay', 'yachay', 'llank\'ay', 'samay'].includes(x.quechua.toLowerCase())) || [safeVerb]);
    const vSp = v.spanish.split(/[,;(]/)[0].trim().toLowerCase();

    const options = [
      {
        qu: 'Allillanchu kashanki?',
        es: '¿Estás bien nomás?',
        breakdown: 'allin-lla-n-chu ka-sha-nki',
        gloss: 'bien-LIM-3SG.POSS-INTERR ser/estar-PROG-2SG',
        notes: 'Saludo cochabambino cortés por excelencia.',
      },
      {
        qu: `Paqarin ${v.quechua}ta munankichu?`,
        es: `¿Quieres ${vSp} mañana?`,
        breakdown: `paqarin ${v.quechua}-ta muna-nki-chu`,
        gloss: `mañana ${vSp}-ACC querer-2SG-INTERR`,
        notes: 'Pregunta de cortesía polar en segunda persona.',
      },
      {
        qu: 'Wasiykipi kashankichu?',
        es: '¿Estás en tu casa?',
        breakdown: 'wasi-yki-pi ka-sha-nki-chu',
        gloss: 'casa-2SG.POSS-LOC ser/estar-PROG-2SG-INTERR',
        notes: 'Pregunta polar locativa con progresivo -sha-.',
      },
    ];

    const chosen = pickRandom(options);

    return {
      id,
      quechua: chosen.qu,
      spanish: chosen.es,
      morphologicalBreakdown: chosen.breakdown,
      gloss: chosen.gloss,
      grammaticalNotes: chosen.notes,
      pattern,
      patternLabel: PATTERN_LABELS[pattern].name,
      domain: 'dialogo_cortesia',
      domainLabel: DOMAIN_LABELS.dialogo_cortesia.name,
      usedRoots: [v],
      usedSuffixes: ['-chu', '-sha-', '-nki'],
    };
  }

  // 7. Pregunta informativa (Ima...taj / May...taj)
  if (pattern === 'pregunta_info') {
    const v = pickRandom(verbs.filter((x) => ['ruway', 'rantiy', 'mikhuy', 'mask\'ay', 'munay'].includes(x.quechua.toLowerCase())) || [safeVerb]);
    const vSp = v.spanish.split(/[,;(]/)[0].trim().toLowerCase();

    const questions = [
      {
        qu: 'Imatataj ruwashanki?',
        es: '¿Qué estás haciendo pues?',
        breakdown: 'ima-ta-taj ruwa-sha-nki',
        gloss: 'qué-ACC-CONTR hacer-PROG-2SG',
        notes: 'Pregunta informativa con acusativo -ta y clítico de realce/interrogativo -taj.',
      },
      {
        qu: 'Maymantataj jamushanki?',
        es: '¿De dónde estás viniendo?',
        breakdown: 'may-manta-taj jamu-sha-nki',
        gloss: 'dónde-ABL-CONTR venir-PROG-2SG',
        notes: 'Pregunta de origen con ablativo -manta y -taj.',
      },
      {
        qu: `Imatataj qhatupi ${getVerbStem(v.quechua)}nki?`,
        es: `¿Qué ${vSp}s en el mercado?`,
        breakdown: `ima-ta-taj qhatu-pi ${getVerbStem(v.quechua)}-nki`,
        gloss: `qué-ACC-CONTR mercado-LOC ${vSp}-2SG`,
        notes: 'Interrogativa con objeto directo en foco.',
      },
      {
        qu: 'Pitantaj mask\'ashanki?',
        es: '¿A quién estás buscando?',
        breakdown: 'pi-ta-n-taj mask\'a-sha-nki',
        gloss: 'quién-ACC-3SG.POSS-CONTR buscar-PROG-2SG',
        notes: 'Pregunta personal sobre objeto humano.',
      },
    ];

    const q = pickRandom(questions);

    return {
      id,
      quechua: q.qu,
      spanish: q.es,
      morphologicalBreakdown: q.breakdown,
      gloss: q.gloss,
      grammaticalNotes: q.notes,
      pattern,
      patternLabel: PATTERN_LABELS[pattern].name,
      domain: 'dialogo_cortesia',
      domainLabel: DOMAIN_LABELS.dialogo_cortesia.name,
      usedRoots: [v],
      usedSuffixes: ['-taj', '-ta', '-sha-', '-nki'],
    };
  }

  // 8. Condicional ((Sichus) ... chayqa)
  if (pattern === 'condicional') {
    const v1 = pickRandom(verbs.filter((x) => ['llank\'ay', 'ruway', 'kasukuy', 'parlay', 'yachakuy'].includes(x.quechua.toLowerCase())) || [safeVerb]);
    const v2 = pickRandom(verbs.filter((x) => ['jap\'iy', 'atipay', 'kusikuy', 'kawsay'].includes(x.quechua.toLowerCase())) || [safeVerb]);

    const v1Sp = v1.spanish.split(/[,;(]/)[0].trim().toLowerCase();
    const v2Sp = v2.spanish.split(/[,;(]/)[0].trim().toLowerCase();

    const quechua = `Sichus allinta ${getVerbStem(v1.quechua)}nki chayqa, sumaqta ${getVerbStem(v2.quechua)}nki.`;
    const spanish = `Si ${v1Sp}as bien, ${v2Sp}arás con agrado.`;
    const morphologicalBreakdown = `sichus allin-ta ${getVerbStem(v1.quechua)}-nki chay-qa sumaq-ta ${getVerbStem(v2.quechua)}-nki`;
    const gloss = `COND bueno-ADV ${v1Sp}-2SG COND-TOP bueno-ADV ${v2Sp}-2SG`;

    return {
      id,
      quechua,
      spanish,
      morphologicalBreakdown,
      gloss,
      grammaticalNotes: 'Estructura condicional cochabambina con partícula inicial sichus (opcional) y chayqa obligatorio al final de la cláusula de condición.',
      pattern,
      patternLabel: PATTERN_LABELS[pattern].name,
      domain: 'hogar_familia',
      domainLabel: DOMAIN_LABELS.hogar_familia.name,
      usedRoots: [v1, v2, safeAdj],
      usedSuffixes: ['-nki', '-ta', '-qa'],
    };
  }

  // 9. Prohibición imperativa (Ama ... -chu)
  if (pattern === 'prohibicion') {
    const v = pickRandom(verbs.filter((x) => ['waqay', 'phiñakuy', 'llojsiy', 'ujyay', 'sayk\'uy', 'chinkachiy', 'pantay'].includes(x.quechua.toLowerCase())) || [safeVerb]);
    const vSp = v.spanish.split(/[,;(]/)[0].trim().toLowerCase();

    const quechua = `Ama ${v.quechua}chu!`;
    const spanish = `¡No ${vSp}as! (prohibición / ruego)`;
    const morphologicalBreakdown = `ama ${getVerbStem(v.quechua)}-y-chu`;
    const gloss = `PROH ${vSp}-IMP.2SG-PROH`;

    return {
      id,
      quechua,
      spanish,
      morphologicalBreakdown,
      gloss,
      grammaticalNotes: 'Regla imperativa: NUNCA usar mana para órdenes negativas o advertencias. Se emplea exclusivamente ama + [verbo imperativo en -y] + -chu.',
      pattern,
      patternLabel: PATTERN_LABELS[pattern].name,
      domain: 'salud_emociones',
      domainLabel: DOMAIN_LABELS.salud_emociones.name,
      usedRoots: [v],
      usedSuffixes: ['-y', '-chu'],
    };
  }

  // 10. Negación declarativa (Mana ... -chu)
  if (pattern === 'negacion_decl') {
    const v = pickRandom(verbs.filter((x) => ['yachay', 'rikuy', 'mikhuy', 'ripuy', 'parlay', 'munay'].includes(x.quechua.toLowerCase())) || [safeVerb]);
    const n = pickRandom(nouns.filter((x) => ['t\'anta', 'aycha', 'qullqi', 'chay'].includes(x.quechua.toLowerCase())) || [safeNoun]);
    const vSp = v.spanish.split(/[,;(]/)[0].trim().toLowerCase();
    const nSp = n.spanish.split(/[,;(]/)[0].trim().toLowerCase();

    const quechua = `Mana ${n.quechua}ta ${getVerbStem(v.quechua)}nichu.`;
    const spanish = `No ${vSp}o ${nSp}.`;
    const morphologicalBreakdown = `mana ${n.quechua}-ta ${getVerbStem(v.quechua)}-ni-chu`;
    const gloss = `NEG ${nSp}-ACC ${vSp}-1SG-NEG`;

    return {
      id,
      quechua,
      spanish,
      morphologicalBreakdown,
      gloss,
      grammaticalNotes: 'Estructura negativa discontinua declarativa mana + ... -chu para negar hechos en presente simple.',
      pattern,
      patternLabel: PATTERN_LABELS[pattern].name,
      domain: 'hogar_familia',
      domainLabel: DOMAIN_LABELS.hogar_familia.name,
      usedRoots: [v, n],
      usedSuffixes: ['-ta', '-ni', '-chu'],
    };
  }

  // 11. Potencial simple (-man / -waq)
  if (pattern === 'potencial') {
    const v = pickRandom(verbs.filter((x) => ['munay', 'jamuy', 'parlay', 'yanapay', 'ruway'].includes(x.quechua.toLowerCase())) || [safeVerb]);
    const vSp = v.spanish.split(/[,;(]/)[0].trim().toLowerCase();

    const quechua = `Qanwan parlariyta ${getVerbStem(v.quechua)}yman.`;
    const spanish = `Quisiera/podría ${vSp} contigo.`;
    const morphologicalBreakdown = `qan-wan parla-ri-y-ta ${getVerbStem(v.quechua)}-y-man`;
    const gloss = `2SG-COM hablar-INTENS-INF-ACC ${vSp}-1SG-POT`;

    return {
      id,
      quechua,
      spanish,
      morphologicalBreakdown,
      gloss,
      grammaticalNotes: 'Modo potencial en -man: expresa cortesía, deseo atenuado ("yo quisiera/podría") en diálogos respetuosos.',
      pattern,
      patternLabel: PATTERN_LABELS[pattern].name,
      domain: 'dialogo_cortesia',
      domainLabel: DOMAIN_LABELS.dialogo_cortesia.name,
      usedRoots: [v],
      usedSuffixes: ['-wan', '-ri-', '-y', '-ta', '-yman'],
    };
  }

  // 12. Posesivo eufónico (-ni- tras consonante)
  if (pattern === 'posesivo_eufonico') {
    const consonantNouns = nouns.filter((x) => !isVowelEnding(x.quechua) && x.quechua.length > 2);
    const n = consonantNouns.length ? pickRandom(consonantNouns) : { id: 'root-yawar', quechua: 'yawar', spanish: 'sangre', category: 'sustantivo' as const, dialectNote: '', verified: true, frequency: 20, examples: [] };
    const nSp = n.spanish.split(/[,;(]/)[0].trim().toLowerCase();

    const quechua = `Tataypa ${n.quechua}nin allin kashan.`;
    const spanish = `El/la ${nSp} de mi padre está bien.`;
    const morphologicalBreakdown = `tata-y-pa ${n.quechua}-ni-n allin ka-sha-n`;
    const gloss = `padre-1SG.POSS-GEN ${nSp}-EUF-3SG.POSS bien ser/estar-PROG-3SG`;

    return {
      id,
      quechua,
      spanish,
      morphologicalBreakdown,
      gloss,
      grammaticalNotes: 'Regla eufónica estricta: Cuando un sustantivo termina en consonante (como -r, -j, -n), se intercala obligatoriamente el interfijo -ni- antes del sufijo posesivo.',
      pattern,
      patternLabel: PATTERN_LABELS[pattern].name,
      domain: 'hogar_familia',
      domainLabel: DOMAIN_LABELS.hogar_familia.name,
      usedRoots: [n],
      usedSuffixes: ['-pa', '-ni-', '-n', '-sha-'],
    };
  }

  // 13. Castellanismos integrados en -y
  // Default to castellanismo
  const castellanismoPairs = [
    {
      qu: 'Necesitanchej estudiay.',
      es: 'Necesitamos estudiar.',
      breakdown: 'necesita-nchej estudia-y',
      gloss: 'necesitar-1PL.INCL estudiar-INF',
      notes: 'Verbos prestados del español con infinitivo en -y y flexión inclusiva en -nchej.',
    },
    {
      qu: 'Wasiypi trabajashani.',
      es: 'Estoy trabajando en mi casa.',
      breakdown: 'wasi-y-pi trabaja-sha-ni',
      gloss: 'casa-1SG.POSS-LOC trabajar-PROG-1SG',
      notes: 'Verbo de préstamo español "trabajar" quechuizado con progresivo cochabambino -sha-.',
    },
    {
      qu: 'Sichus chayta ruwanchej chayqa, allin riwasunchej.',
      es: 'Si hacemos eso, nos irá bien.',
      breakdown: 'sichus chay-ta ruwa-nchej chay-qa allin ri-wa-sunchej',
      gloss: 'COND eso-ACC hacer-1PL.INCL COND.TOP bien ir-1OBJ-FUT.1PL.INCL',
      notes: 'Condicional cotidiana con objeto benefactivo -wa- y futuro inclusivo -sunchej.',
    },
  ];

  const chosenCast = pickRandom(castellanismoPairs);
  return {
    id,
    quechua: chosenCast.qu,
    spanish: chosenCast.es,
    morphologicalBreakdown: chosenCast.breakdown,
    gloss: chosenCast.gloss,
    grammaticalNotes: chosenCast.notes,
    pattern: 'castellanismo',
    patternLabel: PATTERN_LABELS.castellanismo.name,
    domain: 'hogar_familia',
    domainLabel: DOMAIN_LABELS.hogar_familia.name,
    usedRoots: [safeVerb, safeNoun],
    usedSuffixes: ['-nchej', '-sha-', '-y', '-pi'],
  };
}

export function generateCorpusBatch(
  roots: LexicalRoot[],
  count: number = 10,
  preferredPattern?: SentencePattern,
  preferredDomain?: DailyDomain
): GeneratedSentence[] {
  const result: GeneratedSentence[] = [];
  const seenQuechua = new Set<string>();

  for (let i = 0; i < count * 2 && result.length < count; i++) {
    const s = generateCorpusSentence(roots, preferredPattern, preferredDomain);
    if (!seenQuechua.has(s.quechua)) {
      seenQuechua.add(s.quechua);
      result.push(s);
    }
  }

  return result;
}

export function convertSentenceToCorpusPhrase(s: GeneratedSentence): Omit<CorpusPhrase, 'id'> {
  return {
    quechua: s.quechua,
    spanish: s.spanish,
    morphologicalBreakdown: s.morphologicalBreakdown,
    gloss: s.gloss,
    grammaticalNotes: s.grammaticalNotes,
    tags: ['cotidiano', s.pattern, s.domain],
    verified: true,
  };
}
