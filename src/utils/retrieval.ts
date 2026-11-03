import { CorpusPhrase, LexicalRoot } from '../types/quechua';

export type Direction = 'qu-es' | 'es-qu';

/**
 * Normaliza para comparar: minúsculas, sin tildes, sin signos y con todas las
 * variantes de apóstrofo (' ʼ ’ ‘ `) unificadas. Así "¿Estás bien?" == "estas bien"
 * y "jallp'a" == "jallpʼa".
 */
export function normalizeText(value: string): string {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[ʼ’‘`´]/g, "'")
    .replace(/[^\p{L}\p{N}'\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const tokenize = (value: string): string[] =>
  normalizeText(value).split(' ').filter(Boolean);

const STOP_ES = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'de', 'del', 'en', 'y', 'o', 'a', 'que', 'es', 'se', 'lo', 'al', 'por', 'con', 'mi', 'tu', 'su',
]);

/** Lado de la frase que coincide con el texto de entrada según la dirección. */
const sourceSide = (phrase: CorpusPhrase, direction: Direction) =>
  direction === 'qu-es' ? phrase.quechua : phrase.spanish;
const targetSide = (phrase: CorpusPhrase, direction: Direction) =>
  direction === 'qu-es' ? phrase.spanish : phrase.quechua;

/**
 * Busca una frase ya guardada cuyo texto origen sea idéntico (tras normalizar).
 * Si hay varias, prefiere la verificada y luego la más reciente (primera de la lista).
 */
export function findExactMatch(
  text: string,
  direction: Direction,
  phrases: CorpusPhrase[]
): CorpusPhrase | null {
  const key = normalizeText(text);
  if (!key) return null;
  const matches = phrases.filter((p) => normalizeText(sourceSide(p, direction)) === key);
  if (!matches.length) return null;
  return matches.find((p) => p.verified) || matches[0];
}

/** Dos palabras quechuas se consideran emparentadas si comparten raíz (prefijo largo). */
function quechuaWordsRelated(a: string, b: string): boolean {
  if (a === b) return true;
  const min = Math.min(a.length, b.length);
  if (min < 4) return false;
  const shared = Math.min(min, 5);
  return a.slice(0, shared) === b.slice(0, shared);
}

function wordsRelated(a: string, b: string, direction: Direction): boolean {
  if (direction === 'qu-es') return quechuaWordsRelated(a, b);
  // español: igualdad o mismo comienzo largo (singular/plural, conjugaciones)
  if (a === b) return true;
  const min = Math.min(a.length, b.length);
  return min >= 5 && a.slice(0, 5) === b.slice(0, 5);
}

/**
 * Devuelve las frases del corpus más parecidas al texto (no solo las 10 últimas).
 * Puntaje = proporción de palabras del texto cubiertas por la frase (+ bonus si está verificada).
 */
export function findRelevantPhrases(
  text: string,
  direction: Direction,
  phrases: CorpusPhrase[],
  limit = 12
): CorpusPhrase[] {
  const words = tokenize(text).filter((w) => direction === 'qu-es' || !STOP_ES.has(w));
  if (!words.length) return [];

  const scored = phrases
    .map((phrase) => {
      const phraseWords = tokenize(sourceSide(phrase, direction));
      if (!phraseWords.length) return { phrase, score: 0 };
      const covered = words.filter((w) => phraseWords.some((pw) => wordsRelated(w, pw, direction))).length;
      const coverage = covered / words.length;
      const density = covered / phraseWords.length;
      const score = coverage * 0.75 + density * 0.25 + (phrase.verified ? 0.05 : 0);
      return { phrase, score: covered === 0 ? 0 : score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((item) => item.phrase);
}

/**
 * Raíces del directorio que aparecen en el texto (o en las frases relevantes), para
 * pasarle a la IA el vocabulario correcto en vez de las primeras 60 raíces.
 */
export function findRelevantRoots(
  text: string,
  direction: Direction,
  roots: LexicalRoot[],
  relevantPhrases: CorpusPhrase[] = [],
  limit = 80
): LexicalRoot[] {
  const quechuaWords = new Set<string>();
  const spanishWords = new Set<string>();

  if (direction === 'qu-es') tokenize(text).forEach((w) => quechuaWords.add(w));
  else tokenize(text).forEach((w) => spanishWords.add(w));
  relevantPhrases.forEach((p) => {
    tokenize(p.quechua).forEach((w) => quechuaWords.add(w));
    tokenize(p.spanish).forEach((w) => spanishWords.add(w));
  });

  const rank = (root: LexicalRoot): number => {
    const q = normalizeText(root.quechua);
    const qBase = root.category === 'verbo' && q.endsWith('y') ? q.slice(0, -1) : q;
    let score = 0;
    for (const w of quechuaWords) {
      if (w === q || w === qBase) { score = Math.max(score, 3); }
      else if (qBase.length >= 3 && w.startsWith(qBase)) { score = Math.max(score, 2); }
    }
    const spanishTokens = tokenize([root.spanish, ...(root.senses || []).map((x) => x.meaning)].join(' '));
    for (const w of spanishWords) {
      if (STOP_ES.has(w)) continue;
      if (spanishTokens.some((t) => wordsRelated(w, t, 'es-qu'))) score = Math.max(score, 2);
    }
    return score;
  };

  const ranked = roots
    .map((root) => ({ root, score: rank(root) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || Number(b.root.verified) - Number(a.root.verified));

  // Completa con raíces verificadas frecuentes hasta el límite
  const picked = ranked.slice(0, limit).map((item) => item.root);
  if (picked.length < 30) {
    const ids = new Set(picked.map((r) => r.id));
    const filler = [...roots]
      .filter((r) => !ids.has(r.id) && r.verified)
      .sort((a, b) => (b.frequency || 0) - (a.frequency || 0))
      .slice(0, 30 - picked.length);
    picked.push(...filler);
  }
  return picked;
}

/** Busca la raíz en el directorio (con o sin -y de infinitivo). */
export function findRoot(root: string, roots: LexicalRoot[]): LexicalRoot | undefined {
  const key = normalizeText(root).replace(/-/g, '');
  if (!key) return undefined;
  const keyNoY = key.endsWith('y') ? key.slice(0, -1) : key;
  return roots.find((r) => {
    const rq = normalizeText(r.quechua).replace(/-/g, '');
    const rqNoY = rq.endsWith('y') ? rq.slice(0, -1) : rq;
    return rq === key || rqNoY === keyNoY;
  });
}

/** ¿La raíz ya está en el directorio? */
export function rootExists(root: string, roots: LexicalRoot[]): boolean {
  return !normalizeText(root) || Boolean(findRoot(root, roots));
}

/** Texto con todos los significados de una raíz, para pasárselo a la IA: "a; b (cuando ...)". */
export function formatMeanings(root: LexicalRoot): string {
  const extra = (root.senses || []).map((s) => (s.context ? `${s.meaning} (cuando ${s.context})` : s.meaning));
  return [root.spanish, ...extra].filter(Boolean).join('; ');
}

/** ¿Este significado ya está cubierto por el significado principal o por algún sentido guardado? */
export function meaningCovered(meaning: string, root: LexicalRoot): boolean {
  const mine = tokenize(meaning).filter((w) => !STOP_ES.has(w));
  if (!mine.length) return true;
  const known = tokenize([root.spanish, ...(root.senses || []).map((s) => s.meaning)].join(' '));
  return mine.some((w) => known.some((k) => wordsRelated(w, k, 'es-qu')));
}

/** Convierte "significado | contexto" (una línea por significado) en senses y viceversa. */
export function parseSenses(text: string): NonNullable<LexicalRoot['senses']> {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [meaning, ...rest] = line.split('|');
      return { meaning: meaning.trim(), context: rest.join('|').trim(), verified: true };
    })
    .filter((s) => s.meaning);
}
export const sensesToText = (senses: LexicalRoot['senses'] = []): string =>
  senses.map((s) => (s.context ? `${s.meaning} | ${s.context}` : s.meaning)).join('\n');

export { targetSide };
