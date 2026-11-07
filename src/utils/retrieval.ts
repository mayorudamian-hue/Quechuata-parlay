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

type Provenance = NonNullable<CorpusPhrase['provenance']>;

/** Bonus de confianza por procedencia. Las frases con procedencia "ia" nunca se usan como ejemplo. */
const PROVENANCE_BONUS: Partial<Record<Provenance, number>> = {
  'segundo-hablante': 0.08,
  fuente: 0.06,
  'revisado-dem': 0.05,
};

/** Raíz aproximada para comparar palabras (mismo criterio que wordsRelated: 5 letras). */
const stem = (w: string): string => (w.length >= 5 ? w.slice(0, 5) : w);

export interface SimilarExample {
  phrase: CorpusPhrase;
  /** Puntaje de similitud (mayor = más parecida). */
  score: number;
  /** Palabras del texto de entrada que encontraron correspondencia en la frase. */
  matched: string[];
}

/**
 * Busca en el corpus los pares más parecidos al texto, para usarlos como ejemplos al traducir.
 * Puntaje = cobertura ponderada por rareza de las palabras (las comunes pesan menos)
 *         + coincidencia de pares de palabras consecutivas (respeta el orden)
 *         + parecido de longitud + bonus de confianza por procedencia.
 * Excluye frases con procedencia "ia" y repeticiones exactas del mismo par.
 */
export function findSimilarExamples(
  text: string,
  direction: Direction,
  phrases: CorpusPhrase[],
  limit = 8
): SimilarExample[] {
  const words = tokenize(text).filter((w) => direction === 'qu-es' || !STOP_ES.has(w));
  if (!words.length) return [];
  const queryStems = words.map(stem);

  const docs = phrases
    .filter((phrase) => phrase.provenance !== 'ia')
    .map((phrase) => ({ phrase, stems: tokenize(sourceSide(phrase, direction)).map(stem) }));

  // Frecuencia documental: las palabras raras identifican mejor una frase que las comunes
  const df = new Map<string, number>();
  for (const d of docs) for (const s of new Set(d.stems)) df.set(s, (df.get(s) || 0) + 1);
  const idf = (s: string) => Math.log(1 + docs.length / (1 + (df.get(s) || 0)));

  const totalWeight = queryStems.reduce((sum, s) => sum + idf(s), 0) || 1;
  const queryBigrams = queryStems.slice(1).map((s, i) => queryStems[i] + ' ' + s);

  const scored: SimilarExample[] = [];
  for (const { phrase, stems } of docs) {
    if (!stems.length) continue;
    const present = new Set(stems);
    let weighted = 0;
    const matched: string[] = [];
    queryStems.forEach((s, i) => {
      if (present.has(s)) {
        weighted += idf(s);
        matched.push(words[i]);
      }
    });
    const coverage = weighted / totalWeight;
    if (coverage < 0.2) continue;

    const bigrams = new Set(stems.slice(1).map((s, i) => stems[i] + ' ' + s));
    const bigramHit = queryBigrams.length
      ? queryBigrams.filter((b) => bigrams.has(b)).length / queryBigrams.length
      : 0;
    const lengthRatio = Math.min(stems.length, queryStems.length) / Math.max(stems.length, queryStems.length);
    const trust = phrase.provenance ? PROVENANCE_BONUS[phrase.provenance] || 0 : phrase.verified ? 0.05 : 0;

    scored.push({ phrase, matched, score: coverage * 0.65 + bigramHit * 0.2 + lengthRatio * 0.1 + trust });
  }
  scored.sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const result: SimilarExample[] = [];
  for (const item of scored) {
    const key = normalizeText(item.phrase.spanish) + '|' + normalizeText(item.phrase.quechua);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
    if (result.length >= limit) break;
  }
  return result;
}

/** Misma firma de siempre: devuelve solo las frases (ahora con el puntaje mejorado). */
export function findRelevantPhrases(
  text: string,
  direction: Direction,
  phrases: CorpusPhrase[],
  limit = 12
): CorpusPhrase[] {
  return findSimilarExamples(text, direction, phrases, limit).map((item) => item.phrase);
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
