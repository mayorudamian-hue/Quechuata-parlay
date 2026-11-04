/**
 * Motor de contingencia: traduce y glosa (Leipzig) usando SOLO el banco lingüístico
 * (frases del corpus, raíces con sus significados y sufijos). Se usa cuando la IA no
 * responde (sin cuota, timeout, error de red). No inventa léxico: lo que no está en el
 * banco queda entre [corchetes] y se registra como duda para el quechuista.
 */
import { CorpusPhrase, CriticalDoubt, LexicalRoot, MorphToken, SuffixRule, TranslationResult } from '../types/quechua';
import { normalizeText } from './retrieval';
import { parseMorphologicalBreakdown } from './morphology';
import { PersonKey, tenseCell, VerbTense } from '../data/verbTenses';

export interface LinguisticBank {
  roots: LexicalRoot[];
  suffixes: SuffixRule[];
  phrases: CorpusPhrase[];
}
type Dir = 'qu-es' | 'es-qu';
type Kind = 'V' | 'N';

/* ───────────────────────── utilidades ───────────────────────── */

const qNorm = (s: string) => (s || '').toLowerCase().replace(/[ʼ’‘`´]/g, "'").replace(/[^\p{L}\p{N}'-]/gu, '');
const strip = (w: string) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
const same = (s: string) => s;
const loose = (s: string) => s.replace(/e/g, 'i').replace(/o/g, 'u'); // e/i, o/u alternan en la grafía boliviana
const isVowel = (c: string) => 'aeiou'.includes(c);
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const meaningsOf = (r: LexicalRoot): string[] =>
  [r.spanish, ...(r.senses || []).map((s) => s.meaning)]
    .flatMap((m) => (m || '').split(/[;,]/))
    .map((m) => m.replace(/\([^)]*\)/g, '').trim())
    .filter(Boolean);

/** Glosa léxica Leipzig: hasta 2 significados, las palabras de un mismo significado unidas con "." */
const lexGloss = (r: LexicalRoot) =>
  meaningsOf(r).slice(0, 2).map((m) => m.replace(/\s+/g, '.')).join('/') || r.quechua;

/* ───────────────────── índices del banco (con caché) ───────────────────── */

interface RootForm { root: LexicalRoot; form: string; full: boolean; kind: Kind }
interface SufForm { rule: SuffixRule; clean: string; slot: number; kind: Kind | 'I'; open: boolean }

const rootCache = new WeakMap<LexicalRoot[], RootForm[]>();
const sufCache = new WeakMap<SuffixRule[], SufForm[]>();

function getRootForms(roots: LexicalRoot[]): RootForm[] {
  let c = rootCache.get(roots);
  if (c) return c;
  c = [];
  for (const root of roots) {
    const full = qNorm(root.quechua).replace(/-/g, '');
    if (!full) continue;
    const kind: Kind = root.category === 'verbo' ? 'V' : 'N';
    c.push({ root, form: full, full: true, kind });
    if (kind === 'V' && full.endsWith('y') && full.length > 2) c.push({ root, form: full.slice(0, -1), full: false, kind });
  }
  c.sort((a, b) => b.form.length - a.form.length || Number(b.root.verified) - Number(a.root.verified));
  rootCache.set(roots, c);
  return c;
}

function getSufForms(suffixes: SuffixRule[]): SufForm[] {
  let c = sufCache.get(suffixes);
  if (c) return c;
  c = [];
  for (const rule of suffixes) {
    const clean = qNorm(rule.suffix.replace(/^-|-$/g, ''));
    if (!clean || /\s/.test(rule.suffix.trim())) continue; // las perífrasis ("-j ka-rqa-") no se segmentan aquí
    c.push({ rule, clean, slot: rule.slotOrder || 0, kind: rule.type === 'verbal' ? 'V' : rule.type === 'nominal' ? 'N' : 'I', open: rule.suffix.endsWith('-') });
  }
  c.sort((a, b) => b.clean.length - a.clean.length);
  sufCache.set(suffixes, c);
  return c;
}

/* ───────────────────── etiquetas Leipzig de los sufijos ───────────────────── */

const NOM_LAB: Record<string, string> = {
  s: 'PL', kuna: 'PL', pi: 'LOC', manta: 'ABL', man: 'ALL', wan: 'COM', ta: 'ACC', pa: 'GEN', rayku: 'CAUS',
  y: '1SG.POSS', yki: '2SG.POSS', n: '3SG.POSS', nchij: '1PL.INCL.POSS', yku: '1PL.EXCL.POSS', ykichij: '2PL.POSS', nku: '3PL.POSS', ni: 'EUF',
};
const VERB_LAB: Record<string, string> = {
  sha: 'PROG', ni: '1SG', nki: '2SG', n: '3SG', nchij: '1PL.INCL', yku: '1PL.EXCL', nkichij: '2PL', nku: '3PL',
  rqa: 'PST.EXP', saq: 'FUT.1SG', nqa: 'FUT.3SG', sunchij: 'FUT.1PL.INCL', saqku: 'FUT.1PL.EXCL', nqanku: 'FUT.3PL',
  y: 'IMP.2SG', chun: 'IMP.3SG', ychij: 'IMP.2PL', chunku: 'IMP.3PL',
  yman: 'POT.1SG', waq: 'POT.2SG', nman: 'POT.3SG', swanchij: 'POT.1PL.INCL', nmanku: 'POT.3PL',
  na: 'OBLIG', spa: 'SS', jtin: 'DS', j: 'AG',
};
const IND_LAB: Record<string, string> = {
  min: 'EVID.DIR', sina: 'EVID.CONJ', 'chá': 'DUB', raj: 'CONT', taj: 'CONTR', puni: 'ASEV', lla: 'LIM', qa: 'TOP',
};

function suffixLabel(sf: SufForm, neg?: boolean): string {
  const c = sf.clean;
  if (c === 'chu') return neg === undefined ? 'NEG/INTERR' : neg ? 'NEG' : 'INTERR';
  if (c === 'sqa' && sf.kind === 'V') return sf.open ? 'PST.NARR' : 'PTCP.PST';
  const table = sf.kind === 'V' ? VERB_LAB : sf.kind === 'N' ? NOM_LAB : IND_LAB;
  if (table[c]) return table[c];
  // sufijo agregado por el usuario: etiqueta provisional tomada de su función
  const fromFn = (sf.rule.function || '').split(/[:(,/]/)[0].trim().split(/\s+/).slice(0, 2).join('.').toUpperCase();
  return fromFn || c.toUpperCase();
}

/* ───────────────────── segmentación morfológica (qu) ───────────────────── */

function suffixParses(rem: string, kind: Kind, sufs: SufForm[], fold: (s: string) => string, minSlot: number, prev: string, depth = 0): SufForm[][] {
  if (!rem) return [[]];
  if (depth > 6) return [];
  const out: SufForm[][] = [];
  const fr = fold(rem);
  for (const sf of sufs) {
    if (sf.kind !== 'I' && sf.kind !== kind) continue;
    const eff = sf.kind === 'N' && sf.slot <= 2 ? 1 : sf.slot; // plural y posesivo: ambos órdenes
    if (eff < minSlot || sf.rule.id === prev) continue;
    if (!fr.startsWith(fold(sf.clean))) continue;
    for (const rest of suffixParses(rem.slice(sf.clean.length), kind, sufs, fold, eff, sf.rule.id, depth + 1)) out.push([sf, ...rest]);
    if (out.length > 12) break;
  }
  return out;
}

export interface ParsedWord {
  token: MorphToken;
  labels: string[];
  root?: LexicalRoot;
  kind: Kind;
  rules: SuffixRule[];
}

/** Descompone una palabra quechua en raíz + sufijos con glosa Leipzig, usando solo el banco. */
export function segmentWord(raw: string, bank: Pick<LinguisticBank, 'roots' | 'suffixes'>, neg?: boolean): ParsedWord {
  const surface = strip(raw);
  const w = qNorm(surface).replace(/-/g, '');
  const forms = getRootForms(bank.roots);
  const sufs = getSufForms(bank.suffixes);

  type Cand = { rf: RootForm; parse: SufForm[] };
  let best: Cand | null = null;
  for (const fold of [same, loose]) {
    const fw = fold(w);
    for (const rf of forms) {
      if (rf.form.length < 2) continue;
      if (best && rf.form.length < best.rf.form.length) break;
      if (!fw.startsWith(fold(rf.form))) continue;
      const rest = w.slice(rf.form.length);
      let parses = suffixParses(rest, rf.kind, sufs, fold, 0, '');
      // infinitivo (raíz completa en -y) + caso nominal: riy-ta, mikhuy-pi
      if (!parses.length && rf.kind === 'V' && rf.full) parses = suffixParses(rest, 'N', sufs, fold, 4, '');
      if (!parses.length) continue;
      let cand = rf;
      let parse = parses.reduce((a, b) => (b.length < a.length ? b : a));
      // waqay-chu = waqa-y (IMP) + -chu: si tras la raíz completa solo hay clíticos, la -y es el imperativo
      if (rf.kind === 'V' && rf.full && parse.length && parse.every((sf) => sf.kind === 'I')) {
        const imp = sufs.find((sf) => sf.kind === 'V' && sf.clean === 'y');
        const stemForm = forms.find((f) => f.root === rf.root && !f.full);
        if (imp && stemForm) { cand = stemForm; parse = [imp, ...parse]; }
      }
      if (!best || cand.form.length > best.rf.form.length || parse.length < best.parse.length) best = { rf: cand, parse };
    }
    if (best) break;
  }

  if (best) {
    const labels = best.parse.map((sf) => suffixLabel(sf, neg));
    const root = best.rf.root;
    if (best.rf.kind === 'V' && best.rf.full && best.parse.length && best.parse[0].kind === 'N') labels.unshift('INF');
    return {
      token: {
        surface, root: root.quechua, suffixes: best.parse.map((sf) => sf.rule.suffix),
        gloss: [lexGloss(root), ...labels].join('-'), meaning: meaningsOf(root)[0], isRecognized: true,
      },
      labels, root, kind: best.rf.kind, rules: best.parse.map((sf) => sf.rule),
    };
  }

  // Raíz reconocida pero con un resto que no es sufijo conocido → baja confianza
  const fw = loose(w);
  const part = forms.find((rf) => rf.form.length >= 4 && fw.startsWith(loose(rf.form)) && w.length - rf.form.length <= 6);
  if (part) {
    const tail = w.slice(part.form.length);
    return {
      token: {
        surface, root: part.root.quechua, suffixes: [`-${tail}`], gloss: `${lexGloss(part.root)}-?`,
        meaning: meaningsOf(part.root)[0], isRecognized: true, doubtFlag: 'low_confidence',
      },
      labels: [], root: part.root, kind: part.kind, rules: [],
    };
  }

  return {
    token: { surface, root: surface, suffixes: [], gloss: surface, isRecognized: false, doubtFlag: 'out_of_glossary' },
    labels: [], kind: 'N', rules: [],
  };
}

/* ───────────────────── conjugador español (regular + irregulares comunes) ───────────────────── */

const ENDINGS: Record<string, { pres: string[]; pret: string[]; subj: string[]; imp: string[] }> = {
  ar: { pres: ['o', 'as', 'a', 'amos', 'an', 'an'], pret: ['é', 'aste', 'ó', 'amos', 'aron', 'aron'], subj: ['e', 'es', 'e', 'emos', 'en', 'en'], imp: ['', 'a', '', '', 'en', ''] },
  er: { pres: ['o', 'es', 'e', 'emos', 'en', 'en'], pret: ['í', 'iste', 'ió', 'imos', 'ieron', 'ieron'], subj: ['a', 'as', 'a', 'amos', 'an', 'an'], imp: ['', 'e', '', '', 'an', ''] },
  ir: { pres: ['o', 'es', 'e', 'imos', 'en', 'en'], pret: ['í', 'iste', 'ió', 'imos', 'ieron', 'ieron'], subj: ['a', 'as', 'a', 'amos', 'an', 'an'], imp: ['', 'e', '', '', 'an', ''] },
};
const FUT_END = ['é', 'ás', 'á', 'emos', 'án', 'án'];
const COND_END = ['ía', 'ías', 'ía', 'íamos', 'ían', 'ían'];
const IRR: Record<string, { pres?: string; pret?: string; fut?: string; imp?: string; ger?: string; part?: string }> = {
  ser: { pres: 'soy eres es somos son son', pret: 'fui fuiste fue fuimos fueron fueron', imp: 'sé', part: 'sido' },
  estar: { pres: 'estoy estás está estamos están están', pret: 'estuve estuviste estuvo estuvimos estuvieron estuvieron', imp: 'está' },
  ir: { pres: 'voy vas va vamos van van', pret: 'fui fuiste fue fuimos fueron fueron', imp: 've', ger: 'yendo' },
  haber: { pres: 'he has ha hemos han han', fut: 'habr' },
  hacer: { pres: 'hago haces hace hacemos hacen hacen', pret: 'hice hiciste hizo hicimos hicieron hicieron', fut: 'har', imp: 'haz', part: 'hecho' },
  venir: { pres: 'vengo vienes viene venimos vienen vienen', pret: 'vine viniste vino vinimos vinieron vinieron', fut: 'vendr', imp: 'ven' },
  tener: { pres: 'tengo tienes tiene tenemos tienen tienen', pret: 'tuve tuviste tuvo tuvimos tuvieron tuvieron', fut: 'tendr', imp: 'ten' },
  decir: { pres: 'digo dices dice decimos dicen dicen', pret: 'dije dijiste dijo dijimos dijeron dijeron', fut: 'dir', imp: 'di', part: 'dicho' },
  poder: { pres: 'puedo puedes puede podemos pueden pueden', pret: 'pude pudiste pudo pudimos pudieron pudieron', fut: 'podr', ger: 'pudiendo' },
  querer: { pres: 'quiero quieres quiere queremos quieren quieren', pret: 'quise quisiste quiso quisimos quisieron quisieron', fut: 'querr' },
  saber: { pres: 'sé sabes sabe sabemos saben saben', pret: 'supe supiste supo supimos supieron supieron', fut: 'sabr' },
  dar: { pres: 'doy das da damos dan dan', pret: 'di diste dio dimos dieron dieron' },
  ver: { pres: 'veo ves ve vemos ven ven', part: 'visto' },
  salir: { pres: 'salgo sales sale salimos salen salen', fut: 'saldr', imp: 'sal' },
  dormir: { pres: 'duermo duermes duerme dormimos duermen duermen', ger: 'durmiendo' },
  volver: { pres: 'vuelvo vuelves vuelve volvemos vuelven vuelven', part: 'vuelto' },
};
const verbType = (inf: string) => (/(ar)$/.test(inf) ? 'ar' : /(er)$/.test(inf) ? 'er' : /(ir|ír)$/.test(inf) ? 'ir' : null);
const looksInfinitive = (m: string) => !/\s/.test(m) && /^[a-záéíóúñü]*(ar|er|ir|ír)(se)?$/i.test(m);
const REFL = ['me', 'te', 'se', 'nos', 'se', 'se'];

type EsTense = 'pres' | 'pret' | 'fut' | 'cond' | 'imp' | 'subj';
function esConj(infFull: string, tense: EsTense, p: number): string {
  if (/(ar|er|ir|ír)se$/.test(infFull) && !/\s/.test(infFull)) {
    const base = esConj(infFull.slice(0, -2), tense, p);
    return tense === 'imp' && p === 1 ? base + 'te' : `${REFL[p]} ${base}`;
  }
  const [inf, ...rest] = infFull.split(' ');
  const t = verbType(inf);
  const irr = IRR[inf];
  let form = inf;
  if (t) {
    const stem = inf.slice(0, -2);
    const E = ENDINGS[t];
    if (tense === 'pres') form = irr?.pres ? irr.pres.split(' ')[p] : stem + E.pres[p];
    else if (tense === 'pret') form = irr?.pret ? irr.pret.split(' ')[p] : stem + E.pret[p];
    else if (tense === 'fut') form = (irr?.fut || inf.replace('ír', 'ir')) + FUT_END[p];
    else if (tense === 'cond') form = (irr?.fut || inf.replace('ír', 'ir')) + COND_END[p];
    else if (tense === 'subj') form = stem + E.subj[p];
    else if (tense === 'imp') form = p === 1 && irr?.imp ? irr.imp : p === 1 || p === 4 ? stem + E.imp[p] : 'que ' + stem + E.subj[p];
  }
  return [form, ...rest].join(' ');
}
const esGerund = (infFull: string) => {
  const [inf, ...rest] = infFull.split(' ');
  const t = verbType(inf);
  const g = IRR[inf]?.ger || (t ? inf.slice(0, -2) + (t === 'ar' ? 'ando' : 'iendo') : inf);
  return [g, ...rest].join(' ');
};
const esParticiple = (infFull: string) => {
  const [inf, ...rest] = infFull.split(' ');
  const t = verbType(inf);
  const g = IRR[inf]?.part || (t ? inf.slice(0, -2) + (t === 'ar' ? 'ado' : 'ido') : inf);
  return [g, ...rest].join(' ');
};
const pluralEs = (m: string) => {
  const [first, ...rest] = m.split(' ');
  const pl = /[aeiouáéíóú]$/.test(first) ? first + 's' : first.endsWith('z') ? first.slice(0, -1) + 'ces' : first + 'es';
  return [pl, ...rest].join(' ');
};

const PERSONS = ['1SG', '2SG', '3SG', '1PL.INCL', '2PL', '3PL'];
const personIdx = (p: string) => (p === '1PL.EXCL' ? 3 : PERSONS.indexOf(p));

/* ───────────────────── generación de español (qu → es) ───────────────────── */

const CASE_ES: Record<string, string> = { LOC: 'en', ABL: 'de', ALL: 'a', COM: 'con', ACC: '', GEN: 'de', CAUS: 'por causa de' };
const CLIT_PRE: Record<string, string> = { CONT: 'todavía', ASEV: 'definitivamente', 'EVID.CONJ': 'parece que', DUB: 'quizás' };

function possEs(person: string, base: string, pl: boolean): string {
  const k = person.replace('.POSS', '');
  if (k.startsWith('1PL')) return (base.split(' ')[0].endsWith('a') ? 'nuestra' : 'nuestro') + (pl ? 's' : '');
  const w = k === '1SG' ? 'mi' : k === '2SG' ? 'tu' : 'su';
  return pl ? w + 's' : w;
}

function renderNounEs(p: ParsedWord): string {
  const base0 = ((p.root ? meaningsOf(p.root)[0] : '') || p.token.root).replace(/\/[a-z]$/, '');
  let pl = false, poss = '', prep = '', pre = '', post = '', no = '';
  for (const l of p.labels) {
    if (l === 'NEG') no = 'no';
    else if (l === 'PL') pl = true;
    else if (l.endsWith('.POSS')) poss = l;
    else if (l in CASE_ES) prep = CASE_ES[l];
    else if (CLIT_PRE[l]) pre = CLIT_PRE[l];
    else if (l === 'LIM') post = 'nomás';
  }
  const base = pl ? pluralEs(base0) : base0;
  if (prep === 'con' && /^(yo|tú|tu|vos)$/i.test(base0)) return [no, pre, /^yo$/i.test(base0) ? 'conmigo' : 'contigo', post].filter(Boolean).join(' ');
  return [no, pre, prep, poss ? possEs(poss, base0, pl) : '', base, post].filter(Boolean).join(' ');
}

interface Ctx { neg: boolean; proh: boolean }

function renderVerbEs(p: ParsedWord, ctx: Ctx): { text: string; hasNeg: boolean } {
  const root = p.root!;
  let infinitive = meaningsOf(root).find(looksInfinitive) || meaningsOf(root)[0] || p.token.root;
  let person = -1, mood: 'inf' | 'pres' | 'pret' | 'fut' | 'pot' | 'imp' = 'inf';
  let prog = false, oblig = false, ss = false, ds = false, ag = false, ptcp = false, hasNeg = false;
  const pre: string[] = [], post: string[] = [];
  for (const l of p.labels) {
    if (l in CASE_ES) { if (CASE_ES[l]) pre.push(CASE_ES[l]); continue; }
    const m = l.match(/^(FUT|POT|IMP)\.(.+)$/);
    if (m) { mood = m[1] === 'FUT' ? 'fut' : m[1] === 'POT' ? 'pot' : 'imp'; person = personIdx(m[2]); }
    else if (PERSONS.includes(l) || l === '1PL.EXCL') { person = personIdx(l); if (mood === 'inf') mood = 'pres'; }
    else if (l === 'PROG') prog = true;
    else if (l.startsWith('PST')) { mood = 'pret'; if (l === 'PST.NARR') pre.push('(según dicen)'); }
    else if (l === 'OBLIG') oblig = true;
    else if (l === 'SS') ss = true;
    else if (l === 'DS') ds = true;
    else if (l === 'AG') ag = true;
    else if (l === 'PTCP.PST') ptcp = true;
    else if (l === 'NEG' || (l === 'NEG/INTERR' && ctx.neg)) hasNeg = true;
    else if (CLIT_PRE[l]) pre.push(CLIT_PRE[l]);
    else if (l === 'LIM') post.push('nomás');
  }
  const isKay = root.quechua === 'kay';
  let core: string;
  if (isKay && person >= 0 && (mood === 'pres' || mood === 'pret')) {
    core = prog ? esConj('estar', mood, person) : person === 2 && hasNeg ? 'hay' : esConj('ser', mood, person);
  } else if (ss) core = esGerund(infinitive);
  else if (ds) core = 'al ' + infinitive;
  else if (ag) core = 'el que ' + esConj(infinitive, 'pres', 2);
  else if (ptcp) core = esParticiple(infinitive);
  else if (oblig) core = (person >= 0 ? esConj('deber', 'pres', person) : 'se debe') + ' ' + infinitive;
  else if (person < 0 && mood === 'inf') core = infinitive;
  else if (mood === 'imp') core = ctx.proh && person === 1 ? esConj(infinitive, 'subj', 1) : esConj(infinitive, 'imp', person);
  else if (mood === 'pot') core = esConj(infinitive, 'cond', person);
  else if (mood === 'fut' || mood === 'pret') core = esConj(infinitive, mood, person);
  else if (prog) core = esConj('estar', 'pres', person) + ' ' + esGerund(infinitive);
  else core = esConj(infinitive, 'pres', person);
  return { text: [...pre, hasNeg || (ctx.proh && mood === 'imp') ? 'no' : '', core, ...post].filter(Boolean).join(' '), hasNeg };
}

/* ───────────────────── frases del corpus (coincidencia por tramos) ───────────────────── */

interface PhraseEntry { words: string[]; phrase: CorpusPhrase }
const phraseCache = new WeakMap<CorpusPhrase[], { qu: PhraseEntry[]; es: PhraseEntry[] }>();

function getPhraseIndex(phrases: CorpusPhrase[]) {
  let c = phraseCache.get(phrases);
  if (c) return c;
  const build = (side: 'quechua' | 'spanish', norm: (s: string) => string) =>
    phrases
      .map((phrase) => ({ words: phrase[side].trim().split(/\s+/).map((w) => norm(strip(w)).replace(/-/g, '')).filter(Boolean), phrase }))
      .filter((e) => e.words.length > 0)
      .sort((a, b) => b.words.length - a.words.length || Number(b.phrase.verified) - Number(a.phrase.verified));
  c = { qu: build('quechua', qNorm), es: build('spanish', normalizeText) };
  phraseCache.set(phrases, c);
  return c;
}

function phraseAt(nw: string[], i: number, entries: PhraseEntry[]): PhraseEntry | null {
  for (const e of entries) {
    if (i + e.words.length > nw.length) continue;
    if (e.words.length === 1 && !e.phrase.verified) continue; // una palabra suelta solo si fue verificada
    if (e.words.every((w, k) => w === nw[i + k])) return e;
  }
  return null;
}
const trimPunct = (s: string) => s.replace(/^[¿¡\s]+|[?!.\s]+$/g, '');

/* ───────────────────── dudas y explicación ───────────────────── */

type DoubtDraft = Omit<CriticalDoubt, 'id' | 'createdAt'>;
const doubt = (term: string, trigger: DoubtDraft['trigger'], context: string, hypo: string, q: string): DoubtDraft => ({
  term, trigger, contextPhrase: context, occurrences: 1, aiHypothesis: hypo, quechuistaQuestion: q,
  suggestedAction: 'Revisar y, si es correcto, agregarlo al Banco Lingüístico.', status: 'pending',
});

function explain(tokens: MorphToken[], suffixes: SuffixRule[], recognized: number, total: number, method: string, dir: Dir = 'qu-es'): string {
  const fn = (s: string) => (s.split(/[:(]/)[0] || '').trim();
  const lines = tokens
    .filter((t) => t.isRecognized && t.suffixes.length)
    .map((t) => {
      const parts = t.suffixes.map((s) => {
        const rule = suffixes.find((r) => r.suffix === s);
        return rule ? `${s} (${fn(rule.function)})` : s;
      });
      return `• ${t.surface} = ${t.root}${t.meaning ? ` “${t.meaning}”` : ''} + ${parts.join(' + ')}`;
    });
  return [
    `Traducción aproximada armada sin IA con tu banco lingüístico (${method}): se reconocieron ${recognized} de ${total} palabras. Revísala antes de guardarla.`,
    ...lines,
    ...(dir === 'es-qu' ? ['Nota: este modo no marca el objeto directo (-ta) ni resuelve "de" como genitivo (-pa); revisa esos casos a mano.'] : []),
  ].join('\n');
}

/* ───────────────────── quechua → español ───────────────────── */

function quToEs(text: string, bank: LinguisticBank) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const nw = words.map((w) => qNorm(strip(w)).replace(/-/g, ''));
  const neg = nw.includes('mana') || nw.includes('ama');
  const proh = nw.includes('ama');
  const idx = getPhraseIndex(bank.phrases).qu;
  const ctx: Ctx = { neg, proh };

  interface Piece { text: string; kay?: boolean; nominal?: boolean; interrog?: boolean; negWord?: boolean; hasNeg?: boolean }
  const pieces: Piece[] = [];
  const tokens: MorphToken[] = [];
  const doubts: DoubtDraft[] = [];
  let recognized = 0, usedPhrase = false;

  for (let i = 0; i < words.length; ) {
    const hit = phraseAt(nw, i, idx);
    if (hit) {
      const q = /\?/.test(hit.phrase.spanish);
      pieces.push({ text: trimPunct(hit.phrase.spanish), interrog: q });
      tokens.push(...parseMorphologicalBreakdown(hit.phrase.quechua, hit.phrase.morphologicalBreakdown || hit.phrase.quechua, hit.phrase.gloss || '', bank.roots, bank.suffixes));
      recognized += hit.words.length; usedPhrase = true; i += hit.words.length;
      continue;
    }
    const p = segmentWord(words[i], bank, neg);
    tokens.push(p.token);
    if (!p.token.isRecognized) {
      pieces.push({ text: `[${p.token.surface}]` });
      doubts.push(doubt(p.token.surface, 'out_of_glossary', text, 'Palabra ausente del banco lingüístico.', `¿Qué significa "${p.token.surface}" en Cochabamba?`));
    } else {
      recognized++;
      if (p.token.doubtFlag === 'low_confidence') doubts.push(doubt(p.token.surface, 'low_confidence', text, `Raíz "${p.token.root}" + resto no reconocido ${p.token.suffixes.join('')}.`, `¿Qué sufijo es "${p.token.suffixes.join('')}" aquí?`));
      const n = nw[i];
      if (n === 'ama') pieces.push({ text: '', negWord: true });
      else if (n === 'mana') pieces.push({ text: 'no', negWord: true });
      else if (p.kind === 'V') {
        const v = renderVerbEs(p, ctx);
        pieces.push({ text: v.text, kay: p.root?.quechua === 'kay', hasNeg: v.hasNeg, interrog: p.labels.includes('INTERR') });
      } else pieces.push({ text: renderNounEs(p), nominal: true, hasNeg: p.labels.includes('NEG'), interrog: p.labels.includes('INTERR') });
    }
    if (/chka|chis\b/.test(nw[i])) doubts.push(doubt(nw[i], 'dialect_variant', text, 'Posible variante no cochabambina (-chka- / -chis).', '¿Se estandariza a -sha- / -nchij?'));
    i++;
  }

  // "mana" ya se expresa con el "no" del verbo/predicado negado que le sigue
  pieces.forEach((pc, k) => { if (pc.negWord && pc.text === 'no' && pieces[k + 1]?.hasNeg) pc.text = ''; });
  // Predicado nominal + kay: en español va primero el verbo ("no estoy feliz", "estoy en mi casa")
  for (let k = 1; k < pieces.length; k++) {
    if (pieces[k].kay && pieces[k - 1].nominal) {
      const pred = pieces[k - 1];
      const moveNo = pred.text.startsWith('no ');
      if (moveNo) pred.text = pred.text.slice(3);
      pieces[k].text = (moveNo && !pieces[k].text.startsWith('no ') ? 'no ' : '') + pieces[k].text;
      [pieces[k - 1], pieces[k]] = [pieces[k], pieces[k - 1]];
    }
  }

  const question = pieces.some((pc) => pc.interrog) || /\?\s*$/.test(text);
  let out = pieces.map((pc) => pc.text).filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  out = cap(out);
  out = question ? `¿${out}?` : /[.!]\s*$/.test(text) ? `${out}.` : out;
  return { translatedText: out, tokens, doubts, recognized, total: words.length, method: usedPhrase ? 'frases del corpus + palabras' : 'palabra por palabra' };
}

/* ───────────────────── español → quechua ───────────────────── */

interface EsIndex {
  nouns: Map<string, LexicalRoot>;
  nounsNorm: Map<string, LexicalRoot>;
  verbs: Map<string, { root: LexicalRoot; tense: 'inf' | 'ger' | EsTense; p: number; lemma: string }>;
  verbsNorm: Map<string, { root: LexicalRoot; tense: 'inf' | 'ger' | EsTense; p: number; lemma: string }>;
}
const esCache = new WeakMap<LexicalRoot[], EsIndex>();

function getEsIndex(roots: LexicalRoot[]): EsIndex {
  let c = esCache.get(roots);
  if (c) return c;
  c = { nouns: new Map(), nounsNorm: new Map(), verbs: new Map(), verbsNorm: new Map() };
  const sorted = [...roots].sort((a, b) => Number(b.verified) - Number(a.verified));
  for (const root of sorted) {
    for (const m of meaningsOf(root)) {
      const key = m.toLowerCase();
      if (root.category === 'verbo') {
        if (!looksInfinitive(m)) continue;
        const add = (form: string, tense: EsIndex['verbs'] extends Map<string, infer V> ? (V extends { tense: infer T } ? T : never) : never, p: number) => {
          const f = form.toLowerCase();
          if (!c!.verbs.has(f)) c!.verbs.set(f, { root, tense, p, lemma: key });
          const n = normalizeText(f);
          if (!c!.verbsNorm.has(n)) c!.verbsNorm.set(n, { root, tense, p, lemma: key });
        };
        add(m, 'inf', -1);
        add(esGerund(m), 'ger', -1);
        for (const tense of ['pres', 'pret', 'fut', 'cond'] as EsTense[]) for (const p of [0, 1, 2, 3, 5, 4]) add(esConj(m, tense, p), tense, p);
        add(esConj(m, 'imp', 1), 'imp', 1);
      } else {
        const g = key.match(/^(.+)\/a$/); // "hijo/a" → hijo, hija
        for (const k of g ? [g[1], g[1].replace(/o$/, 'a')] : [key]) {
          if (!c.nouns.has(k)) c.nouns.set(k, root);
          const n = normalizeText(k);
          if (!c.nounsNorm.has(n)) c.nounsNorm.set(n, root);
        }
      }
    }
  }
  esCache.set(roots, c);
  return c;
}

const ES_PREP: Record<string, string> = { en: 'LOC', con: 'COM', desde: 'ABL', de: 'ABL', a: 'ALL', hacia: 'ALL', para: 'ALL' };
const ES_POSS: Record<string, string> = { mi: '1SG', mis: '1SG', tu: '2SG', tus: '2SG', su: '3SG', sus: '3SG', nuestro: '1PL.INCL', nuestra: '1PL.INCL', nuestros: '1PL.INCL', nuestras: '1PL.INCL' };
const ES_SKIP = new Set(['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'yo', 'usted', 'ustedes', 'el', 'ella', 'ellos', 'ellas', 'nosotros', 'nosotras']);
const ES_CLITIC: Record<string, { suf: string; label: string; target: 'next' | 'prev' }> = {
  todavia: { suf: '-raj', label: 'CONT', target: 'next' }, aun: { suf: '-raj', label: 'CONT', target: 'next' },
  definitivamente: { suf: '-puni', label: 'ASEV', target: 'next' }, siempre: { suf: '-puni', label: 'ASEV', target: 'next' },
  quizas: { suf: '-chá', label: 'DUB', target: 'next' }, nomas: { suf: '-lla', label: 'LIM', target: 'prev' },
};
const ES_WH = new Set(['que', 'quien', 'quienes', 'como', 'donde', 'cuando', 'cual', 'cuales', 'cuanto', 'cuanta', 'cuantos', 'cuantas', 'porque']);
const SUF_POSS: Record<string, string> = { '1SG': '-y', '2SG': '-yki', '3SG': '-n', '1PL.INCL': '-nchij', '1PL.EXCL': '-yku', '2PL': '-ykichij', '3PL': '-nku' };
const SUF_CASE: Record<string, string> = { LOC: '-pi', ABL: '-manta', ALL: '-man', COM: '-wan', GEN: '-pa', CAUS: '-rayku' };

interface QPiece { root?: LexicalRoot; base: string; sufs: string[]; labels: string[]; finite?: boolean; kay?: boolean; unknown?: string; uncertain?: boolean }

const surfaceOf = (pc: QPiece) => pc.base + pc.sufs.map((s) => s.replace(/^-|-$/g, '')).join('');

function pieceToToken(pc: QPiece): MorphToken {
  if (pc.unknown) return { surface: pc.unknown, root: pc.unknown, suffixes: [], gloss: pc.unknown, isRecognized: false, doubtFlag: 'out_of_glossary' };
  const r = pc.root!;
  return {
    surface: surfaceOf(pc), root: r.quechua, suffixes: pc.sufs, gloss: [lexGloss(r), ...pc.labels].join('-'),
    meaning: meaningsOf(r)[0], isRecognized: true, doubtFlag: pc.uncertain ? 'low_confidence' : undefined,
  };
}

function verbPiece(root: LexicalRoot, tense: 'inf' | 'ger' | EsTense, p: number, prog: boolean): QPiece {
  const stem = root.quechua.endsWith('y') && root.quechua.length > 2 ? root.quechua.slice(0, -1) : root.quechua;
  const pc: QPiece = { root, base: stem, sufs: [], labels: [], finite: true, kay: root.quechua === 'kay' };
  const P = PERSONS[p] as PersonKey;
  // Terminaciones tomadas del cuadro de tiempos (src/data/verbTenses.ts); si falta la celda se usa el presente y se marca duda.
  const ending = (id: VerbTense['id']): string => {
    const c = tenseCell(id, P);
    if (!c.suf || c.confirm) pc.uncertain = true;
    return c.suf || tenseCell('presente', P).suf!;
  };
  if (tense === 'inf') { pc.base = root.quechua; pc.finite = false; }
  else if (tense === 'ger') { pc.sufs = ['-spa']; pc.labels = ['SS']; pc.finite = false; }
  else if (tense === 'pres') { if (prog) { pc.sufs.push('-sha-'); pc.labels.push('PROG'); } pc.sufs.push(ending(prog ? 'progresivo' : 'presente')); pc.labels.push(P); }
  else if (tense === 'pret') { pc.sufs = ['-rqa-', ending('pasado-testimonial')]; pc.labels = ['PST.EXP', P]; }
  else if (tense === 'fut') { pc.sufs = [ending('futuro')]; pc.labels = [`FUT.${P}`]; }
  else if (tense === 'cond') { pc.sufs = [ending('potencial')]; pc.labels = [`POT.${P}`]; }
  else if (tense === 'imp') { const ip: PersonKey = p === 4 ? '2PL' : '2SG'; pc.sufs = [tenseCell('imperativo', ip).suf!]; pc.labels = [`IMP.${ip}`]; }
  return pc;
}

function esToQu(text: string, bank: LinguisticBank) {
  const idx = getEsIndex(bank.roots);
  const words = text.trim().split(/\s+/).filter(Boolean);
  const raw = words.map((w) => strip(w).toLowerCase());
  const nw = words.map((w) => normalizeText(w));
  const phr = getPhraseIndex(bank.phrases).es;
  const wh = nw.some((w) => ES_WH.has(w));
  const asked = /^¿/.test(text.trim()) || /\?\s*$/.test(text);
  const findNoun = (k: number): { root: LexicalRoot; len: number; plural: boolean } | null => {
    for (const len of [3, 2, 1]) {
      if (k + len > nw.length) continue;
      const key = nw.slice(k, k + len).join(' ');
      const rawKey = raw.slice(k, k + len).join(' ');
      const hit = idx.nouns.get(rawKey) || idx.nounsNorm.get(key);
      if (hit) return { root: hit, len, plural: false };
      if (len === 1 && key.length > 3) {
        const sing = key.endsWith('es') && idx.nounsNorm.get(key.slice(0, -2)) ? key.slice(0, -2) : key.endsWith('s') ? key.slice(0, -1) : '';
        const h2 = sing && idx.nounsNorm.get(sing);
        if (h2) return { root: h2, len, plural: true };
      }
    }
    return null;
  };
  const findVerb = (k: number) => idx.verbs.get(raw[k]) || idx.verbsNorm.get(nw[k]);

  const chunks: Array<{ pieces: QPiece[]; literal?: { text: string; tokens: MorphToken[] } }> = [];
  const doubts: DoubtDraft[] = [];
  let recognized = 0, usedPhrase = false, negPending = false, pendingPoss = '', pendingPrep = '';
  let pendingClitics: Array<{ suf: string; label: string }> = [];
  let lastMain: QPiece | null = null;

  const cur: QPiece[] = [];
  const flush = () => { if (cur.length) chunks.push({ pieces: cur.splice(0) }); };

  for (let k = 0; k < words.length; ) {
    // 1. frase del corpus
    const hit = phraseAt(nw, k, phr);
    if (hit) {
      flush();
      chunks.push({ pieces: [], literal: { text: trimPunct(hit.phrase.quechua), tokens: parseMorphologicalBreakdown(hit.phrase.quechua, hit.phrase.morphologicalBreakdown || hit.phrase.quechua, hit.phrase.gloss || '', bank.roots, bank.suffixes) } });
      recognized += hit.words.length; usedPhrase = true; k += hit.words.length; continue;
    }
    const w = nw[k];
    if (w === 'no') { negPending = true; k++; recognized++; continue; }
    if (ES_SKIP.has(raw[k]) || raw[k] === 'tú' || (w === 'tu' && !findNoun(k + 1))) { k++; recognized++; continue; }
    if (ES_CLITIC[w]) {
      const c = ES_CLITIC[w];
      if (c.target === 'prev' && cur.length) { const t = cur[cur.length - 1]; t.sufs.push(c.suf); t.labels.push(c.label); }
      else if (cur.length && cur[cur.length - 1].finite && !cur[cur.length - 1].unknown) { const t = cur[cur.length - 1]; t.sufs.push(c.suf); t.labels.push(c.label); }
      else pendingClitics.push({ suf: c.suf, label: c.label });
      k++; recognized++; continue;
    }
    if (ES_POSS[w] && findNoun(k + 1)) { pendingPoss = ES_POSS[w]; k++; recognized++; continue; }
    if (ES_PREP[w] && k + 1 < words.length) {
      const nextVerb = findVerb(k + 1);
      if (nextVerb && nextVerb.tense === 'inf') { k++; recognized++; continue; } // "a trabajar": se queda el infinitivo
      if (findNoun(k + 1) || ES_POSS[nw[k + 1]]) { pendingPrep = ES_PREP[w]; k++; recognized++; continue; }
    }
    // 2. verbo
    const v = w === 'hay' ? { root: bank.roots.find((r) => r.quechua === 'kay'), tense: 'pres' as const, p: 2, lemma: 'haber' } : findVerb(k);
    if (v && v.root) {
      let prog = false, len = 1;
      if (v.lemma === 'estar' && v.tense === 'pres') {
        const g = k + 1 < words.length ? findVerb(k + 1) : undefined;
        if (g && g.tense === 'ger') { cur.push(verbPiece(g.root, 'pres', v.p, true)); len = 2; prog = true; }
        else { cur.push(verbPiece(v.root, 'pres', v.p, true)); prog = true; }
      }
      if (!prog) cur.push(verbPiece(v.root, v.tense, v.p < 0 ? 2 : v.p, false));
      const pc = cur[cur.length - 1];
      if (pc.finite) lastMain = pc;
      if (pc.finite) for (const c of pendingClitics.splice(0)) { pc.sufs.push(c.suf); pc.labels.push(c.label); }
      if (negPending && pc.finite) { chunks.push({ pieces: [{ base: 'mana', sufs: [], labels: [], root: bank.roots.find((r) => qNorm(r.quechua) === 'mana') }] }); pc.sufs.push('-chu'); pc.labels.push('NEG'); negPending = false; }
      recognized += len; k += len; continue;
    }
    // 3. sustantivo / adjetivo / partícula
    const n = findNoun(k);
    if (n) {
      const base = n.root.quechua;
      const pc: QPiece = { root: n.root, base, sufs: [], labels: [] };
      const vowelEnd = isVowel(base.slice(-1).toLowerCase());
      let endsVowel = vowelEnd;
      if (n.plural) { pc.sufs.push(vowelEnd ? '-s' : '-kuna'); pc.labels.push('PL'); endsVowel = vowelEnd ? false : true; }
      if (pendingPoss) { if (!endsVowel) { pc.sufs.push('-ni-'); pc.labels.push('EUF'); } pc.sufs.push(SUF_POSS[pendingPoss]); pc.labels.push(`${pendingPoss}.POSS`); }
      if (pendingPrep) { pc.sufs.push(SUF_CASE[pendingPrep]); pc.labels.push(pendingPrep); }
      for (const c of pendingClitics.splice(0)) { pc.sufs.push(c.suf); pc.labels.push(c.label); }
      pendingPoss = ''; pendingPrep = '';
      const nextN = k + n.len < words.length ? findNoun(k + n.len) : null;
      if (nextN && nextN.root.category === 'adjetivo' && n.root.category !== 'adjetivo') {
        cur.push({ root: nextN.root, base: nextN.root.quechua, sufs: [], labels: [] }, pc); // el adjetivo va antes
        recognized += n.len + nextN.len; k += n.len + nextN.len; continue;
      }
      cur.push(pc); recognized += n.len; k += n.len; continue;
    }
    // 4. desconocida
    cur.push({ base: '', sufs: [], labels: [], unknown: `[${words[k].replace(/[¿?¡!.,;:]/g, '')}]` });
    doubts.push(doubt(strip(words[k]), 'out_of_glossary', text, 'No hay equivalente quechua en el banco para esta palabra.', `¿Cómo se dice "${strip(words[k])}" en quechua cochabambino?`));
    k++;
  }
  flush();
  if (negPending) { const last = chunks.flatMap((c) => c.pieces).pop(); if (last && !last.unknown) { last.sufs.push('-chu'); last.labels.push('NEG'); } }
  // Pregunta sí/no: -chu en el último verbo (o en la última palabra)
  if (asked && !wh && !chunks.some((c) => c.pieces.some((p) => p.labels.includes('NEG')))) {
    const all = chunks.flatMap((c) => c.pieces).filter((p) => !p.unknown);
    const target = lastMain || all[all.length - 1];
    if (target) { target.sufs.push('-chu'); target.labels.push('INTERR'); }
  }
  // Los verbos principales (finitos) van al final de la oración quechua; el resto conserva su orden
  const flat: Array<{ text: string; token: MorphToken }> = [];
  const fixed: typeof flat = [], finals: typeof flat = [];
  for (const c of chunks) {
    if (c.literal) { fixed.push({ text: c.literal.text, token: c.literal.tokens[0] }); for (const t of c.literal.tokens.slice(1)) fixed.push({ text: '', token: t }); continue; }
    for (const pc of c.pieces) {
      const entry = pc.unknown ? { text: pc.unknown, token: pieceToToken(pc) } : { text: surfaceOf(pc), token: pieceToToken(pc) };
      (pc.finite && !pc.unknown && pc.root?.quechua !== 'mana' ? finals : fixed).push(entry);
    }
  }
  flat.push(...fixed, ...finals);
  const hasLiteralOnly = chunks.every((c) => c.literal) && chunks.length === 1;
  const body = hasLiteralOnly ? chunks[0].literal!.text : flat.map((e) => e.text).filter(Boolean).join(' ');
  const out = cap(body).replace(/\s+/g, ' ').trim();
  const translatedText = asked ? `¿${out}?` : /[.!]\s*$/.test(text) ? `${out}.` : out;
  return {
    translatedText, tokens: flat.map((e) => e.token).filter(Boolean), doubts, recognized, total: words.length,
    method: usedPhrase ? 'frases del corpus + palabras' : 'palabra por palabra',
  };
}

/* ───────────────────── API pública ───────────────────── */

/** Traduce y glosa usando solo el banco lingüístico. Sustituye a la IA cuando no está disponible. */
export function translateWithBank(text: string, direction: Dir, bank: LinguisticBank): TranslationResult {
  const r = direction === 'qu-es' ? quToEs(text, bank) : esToQu(text, bank);
  const rec = Math.min(r.recognized, r.total);
  return {
    sourceText: text,
    translatedText: r.translatedText,
    direction,
    tokens: r.tokens,
    grammaticalExplanation: explain(r.tokens, bank.suffixes, rec, r.total, r.method, direction),
    detectedDoubts: r.doubts,
    source: 'fallback',
    fallbackInfo: { recognized: rec, total: r.total, method: r.method },
  };
}
