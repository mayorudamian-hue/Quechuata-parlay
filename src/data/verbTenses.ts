import { GrammarRule } from '../types/quechua';

/**
 * Gramática verbal del quechua cochabambino: UNA sola fuente de verdad para
 *  1) el recuadro de la interfaz (VerbTensesGuide),
 *  2) el motor de contingencia (bankEngine) y
 *  3) la IA (se envía como regla gramatical en el traductor).
 *
 * Las celdas con `confirm: true` NO figuran en el banco de sufijos o se derivan por analogía:
 * el motor las usa solo como último recurso (marcadas como baja confianza) y la IA las recibe
 * como "por confirmar". Un quechuista debe validarlas antes de tratarlas como normativas.
 */

export type PersonKey = '1SG' | '2SG' | '3SG' | '1PL.INCL' | '1PL.EXCL' | '2PL' | '3PL';

export const PERSON_KEYS: PersonKey[] = ['1SG', '2SG', '3SG', '1PL.INCL', '1PL.EXCL', '2PL', '3PL'];

export const PERSON_LABELS: Record<PersonKey, { short: string; pronoun: string }> = {
  '1SG': { short: '1.ª sg', pronoun: 'noqa' },
  '2SG': { short: '2.ª sg', pronoun: 'qan' },
  '3SG': { short: '3.ª sg', pronoun: 'pay' },
  '1PL.INCL': { short: '1.ª pl incl.', pronoun: 'noqanchej' },
  '1PL.EXCL': { short: '1.ª pl excl.', pronoun: 'noqayku' },
  '2PL': { short: '2.ª pl', pronoun: 'qankuna' },
  '3PL': { short: '3.ª pl', pronoun: 'paykuna' },
};

export interface TenseCell {
  /** Terminación personal (con guion inicial) o null si la forma no existe / no está documentada. */
  suf: string | null;
  /** true = no está en el banco de sufijos o se derivó por analogía. */
  confirm?: boolean;
}

export interface VerbTense {
  id: 'presente' | 'progresivo' | 'pasado-testimonial' | 'pasado-narrativo' | 'futuro' | 'potencial' | 'imperativo' | 'habitual';
  name: string;
  /** Etiqueta Leipzig de la marca de tiempo/aspecto. */
  gloss: string;
  /** Marca que va entre la raíz y la terminación ('' si no hay). */
  marker: string;
  usage: string;
  example: { quechua: string; morphology: string; gloss: string; spanish: string };
  cells: Record<PersonKey, TenseCell>;
}

const ok = (suf: string | null): TenseCell => ({ suf });
const maybe = (suf: string | null): TenseCell => ({ suf, confirm: true });

/** Terminaciones del presente simple (todas documentadas en el banco). */
const PRESENT: Record<PersonKey, TenseCell> = {
  '1SG': ok('-ni'), '2SG': ok('-nki'), '3SG': ok('-n'), '1PL.INCL': ok('-nchij'),
  '1PL.EXCL': ok('-yku'), '2PL': ok('-nkichij'), '3PL': ok('-nku'),
};
const asConfirm = (cells: Record<PersonKey, TenseCell>): Record<PersonKey, TenseCell> =>
  Object.fromEntries(PERSON_KEYS.map((k) => [k, { suf: cells[k].suf, confirm: true }])) as Record<PersonKey, TenseCell>;

export const VERB_TENSES: VerbTense[] = [
  {
    id: 'presente', name: 'Presente simple', gloss: 'PRS', marker: '',
    usage: 'Acción habitual o general; la persona se marca con la terminación.',
    example: { quechua: 'Mikhuni', morphology: 'mikhu-ni', gloss: 'comer-1SG', spanish: 'Yo como' },
    cells: PRESENT,
  },
  {
    id: 'progresivo', name: 'Presente progresivo', gloss: 'PROG', marker: '-sha-',
    usage: 'Acción en curso (estar haciendo). En Cochabamba es siempre -sha-, nunca -chka-.',
    example: { quechua: 'Mikhushani', morphology: 'mikhu-sha-ni', gloss: 'comer-PROG-1SG', spanish: 'Estoy comiendo' },
    cells: PRESENT,
  },
  {
    id: 'pasado-testimonial', name: 'Pasado testimonial', gloss: 'PST.EXP', marker: '-rqa-',
    usage: 'Algo que el hablante presenció o vivió personalmente.',
    example: { quechua: 'Jamurqani', morphology: 'jamu-rqa-ni', gloss: 'venir-PST.EXP-1SG', spanish: 'Vine (lo viví yo)' },
    cells: PRESENT,
  },
  {
    id: 'pasado-narrativo', name: 'Pasado no testimonial', gloss: 'PST.NARR', marker: '-sqa-',
    usage: 'Hechos no presenciados, narrados o reportados ("había sido", "dicen que").',
    example: { quechua: 'Jamusqa', morphology: 'jamu-sqa', gloss: 'venir-PST.NARR', spanish: 'Vino (según cuentan)' },
    cells: asConfirm(PRESENT),
  },
  {
    id: 'futuro', name: 'Futuro simple', gloss: 'FUT', marker: '',
    usage: 'Acción que ocurrirá; la 1.ª pl inclusiva funciona también como exhortativo ("hagamos").',
    example: { quechua: 'Jamusaq', morphology: 'jamu-saq', gloss: 'venir-FUT.1SG', spanish: 'Vendré' },
    cells: {
      '1SG': ok('-saq'), '2SG': maybe('-nki'), '3SG': ok('-nqa'), '1PL.INCL': ok('-sunchij'),
      '1PL.EXCL': ok('-saqku'), '2PL': maybe('-nkichij'), '3PL': ok('-nqanku'),
    },
  },
  {
    id: 'potencial', name: 'Potencial / condicional', gloss: 'POT', marker: '',
    usage: 'Lo que se podría o haría; deseo cortés ("quisiera").',
    example: { quechua: 'Mikhuyman', morphology: 'mikhu-yman', gloss: 'comer-POT.1SG', spanish: 'Yo comería / quisiera comer' },
    cells: {
      '1SG': ok('-yman'), '2SG': ok('-waq'), '3SG': ok('-nman'), '1PL.INCL': ok('-swanchij'),
      '1PL.EXCL': maybe(null), '2PL': maybe('-waqchij'), '3PL': ok('-nmanku'),
    },
  },
  {
    id: 'imperativo', name: 'Imperativo', gloss: 'IMP', marker: '',
    usage: 'Órdenes. La prohibición se forma con ama … -y-chu (ver "Formas especiales").',
    example: { quechua: 'Jamuy', morphology: 'jamu-y', gloss: 'venir-IMP.2SG', spanish: '¡Ven!' },
    cells: {
      '1SG': maybe(null), '2SG': ok('-y'), '3SG': ok('-chun'), '1PL.INCL': maybe(null),
      '1PL.EXCL': maybe(null), '2PL': ok('-ychij'), '3PL': ok('-chunku'),
    },
  },
  {
    id: 'habitual', name: 'Imperfecto habitual', gloss: 'AG + PST.EXP', marker: '-j ka-rqa-',
    usage: 'Perífrasis: participio agentivo -j + kay en pasado testimonial ("solía hacer").',
    example: { quechua: 'Parlaj karqani', morphology: 'parla-j ka-rqa-ni', gloss: 'hablar-AG ser-PST.EXP-1SG', spanish: 'Yo solía hablar' },
    cells: PRESENT,
  },
];

/** Formas no finitas y construcciones frecuentes. */
export interface SpecialForm { form: string; name: string; gloss: string; usage: string; example: string; translation: string }

export const VERB_SPECIAL_FORMS: SpecialForm[] = [
  { form: '-y', name: 'Infinitivo', gloss: 'INF', usage: 'Forma de diccionario del verbo (raíz + -y).', example: 'mikhuy', translation: 'comer' },
  { form: '-spa', name: 'Gerundio / mismo sujeto', gloss: 'SS', usage: 'Subordinada con el mismo sujeto que el verbo principal.', example: 'sama-spa kashani', translation: 'estoy descansando (mientras estoy)' },
  { form: '-jtin', name: 'Cambio de sujeto', gloss: 'DS', usage: 'Subordinada con sujeto distinto al principal.', example: 'jamu-jtin', translation: 'cuando (él) venga' },
  { form: '-j', name: 'Participio agentivo', gloss: 'AG', usage: 'El que hace habitualmente o va a hacer.', example: 'llank\'a-j', translation: 'el que trabaja' },
  { form: '-sqa', name: 'Participio pasivo', gloss: 'PTCP.PST', usage: 'Resultado de la acción.', example: 'kusi-sqa', translation: 'alegrado, contento' },
  { form: '-na-', name: 'Obligativo / propósito', gloss: 'OBLIG', usage: 'Acción que debe hacerse; suele ir con tiyan.', example: 'ka-na-nchej tiyan', translation: 'debemos ser' },
  { form: 'mana … -chu', name: 'Negación', gloss: 'NEG', usage: 'Se niega con mana antes y -chu al final de la palabra negada.', example: 'mana mikhu-ni-chu', translation: 'no como' },
  { form: 'ama … -y-chu', name: 'Prohibición', gloss: 'PROH', usage: 'ama + raíz + -y + -chu.', example: 'ama waqa-y-chu', translation: 'no llores' },
  { form: '-chu', name: 'Pregunta sí/no', gloss: 'INTERR', usage: 'Sin mana, -chu al final convierte la oración en pregunta.', example: 'mikhu-nki-chu?', translation: '¿comes?' },
];

/** Orden de los sufijos en el verbo (para guiar a la IA y al lector). */
export const VERB_SLOT_ORDER = 'raíz verbal + (-sha- progresivo) + (-rqa- / -sqa- pasado) + terminación de persona o tiempo (-ni, -saq, -yman…) + clíticos (-raj, -puni, -lla, -min, -sina, -chá, -taj, -qa) + -chu';

/** Une marca y terminación para mostrarlas: "-sha-" + "-ni" → "-shani". */
export function joinTense(marker: string, suf: string): string {
  if (!marker) return suf;
  return /\s/.test(marker) ? `${marker}${suf.replace(/^-/, '')}` : `${marker.replace(/-$/, '')}${suf.replace(/^-/, '')}`;
}

export const tenseById = (id: VerbTense['id']) => VERB_TENSES.find((t) => t.id === id)!;
export const tenseCell = (id: VerbTense['id'], person: PersonKey): TenseCell => tenseById(id).cells[person];

/** Texto compacto con toda la gramática verbal, para pasárselo a la IA. */
export function verbTensesPrompt(): string {
  const rows = VERB_TENSES.map((t) => {
    const forms = PERSON_KEYS.map((k) => {
      const c = t.cells[k];
      return c.suf ? `${k}: ${joinTense(t.marker, c.suf)}${c.confirm ? ' (por confirmar)' : ''}` : null;
    }).filter(Boolean).join(', ');
    return `- ${t.name} [${t.gloss}]${t.marker ? ` marca ${t.marker}` : ''}: ${forms}. Ej.: ${t.example.morphology} = ${t.example.spanish}.`;
  });
  const special = VERB_SPECIAL_FORMS.map((s) => `- ${s.name} [${s.gloss}] ${s.form}: ${s.usage} Ej.: ${s.example} = ${s.translation}.`);
  return [
    `Orden de sufijos del verbo: ${VERB_SLOT_ORDER}.`,
    'Tiempos y personas (usa exactamente estas terminaciones; las marcadas "por confirmar" úsalas solo si no hay alternativa y márcalas como duda):',
    ...rows,
    'Formas no finitas y construcciones:',
    ...special,
  ].join('\n');
}

/** Regla gramatical sembrada: así la IA la recibe automáticamente junto con las demás reglas. */
export const VERB_TENSES_RULE: GrammarRule = {
  id: 'rule-verb-tenses-cochabamba',
  title: 'Tiempos verbales y persona (quechua cochabambino)',
  category: 'Morfología Verbal (Tiempos)',
  description: 'Cuadro de los tiempos, aspectos y modos del verbo con sus terminaciones por persona, más formas no finitas, negación y prohibición.',
  cochabambaSpecificity: verbTensesPrompt(),
  examples: VERB_TENSES.map((t) => ({
    quechua: t.example.quechua, spanish: t.example.spanish, morphology: t.example.morphology, gloss: t.example.gloss,
  })),
};
