import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  LexicalRoot,
  SuffixRule,
  CorpusPhrase,
  CriticalDoubt,
  GrammarRule,
  DoubtStatus,
  MorphToken,
} from '../types/quechua';
import { normalizeText, rootExists, findRoot, meaningCovered } from '../utils/retrieval';
import {
  SEED_ROOTS,
  SEED_SUFFIXES,
  SEED_PHRASES,
  SEED_DOUBTS,
  SEED_GRAMMAR_RULES,
} from '../data/seedData';
import {
  PERSONAL_PRONOUNS_PHRASES,
  PERSONAL_PRONOUNS_RULE,
  SEED_PERSONAL_PRONOUNS,
} from '../data/personalPronouns';
import { VERB_TENSES_RULE } from '../data/verbTenses';

interface QuechuaContextType {
  roots: LexicalRoot[];
  suffixes: SuffixRule[];
  phrases: CorpusPhrase[];
  doubts: CriticalDoubt[];
  grammarRules: GrammarRule[];
  activeTab: 'bank' | 'doubts' | 'consultation' | 'translator' | 'chat';
  setActiveTab: (tab: 'bank' | 'doubts' | 'consultation' | 'translator' | 'chat') => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  addRoot: (root: Omit<LexicalRoot, 'id' | 'frequency'>) => void;
  updateRoot: (id: string, updates: Partial<LexicalRoot>) => void;
  deleteRoot: (id: string) => void;
  toggleVerifyRoot: (id: string) => void;
  addSuffix: (suffix: Omit<SuffixRule, 'id'>) => void;
  updateSuffix: (id: string, updates: Partial<SuffixRule>) => void;
  deleteSuffix: (id: string) => void;
  addPhrase: (phrase: Omit<CorpusPhrase, 'id'>) => void;
  updatePhrase: (id: string, updates: Partial<CorpusPhrase>) => void;
  deletePhrase: (id: string) => void;
  toggleVerifyPhrase: (id: string) => void;
  upsertPhrase: (direction: 'qu-es' | 'es-qu', phrase: Omit<CorpusPhrase, 'id'>) => 'created' | 'updated';
  learnFromTranslation: (tokens: MorphToken[], context: { quechua: string; spanish: string }) => { roots: string[]; senses: string[] };
  addDoubt: (doubt: Omit<CriticalDoubt, 'id' | 'createdAt'>) => void;
  updateDoubt: (id: string, updates: Partial<CriticalDoubt>) => void;
  setDoubtStatus: (id: string, status: DoubtStatus, resolutionNote?: string) => void;
  deleteDoubt: (id: string) => void;
  applyCascadeCorrection: (oldTerm: string, newTerm: string, resolutionNote?: string) => number;
  autoScanCorpus: () => number;
  addGrammarRule: (rule: Omit<GrammarRule, 'id'>) => void;
  updateGrammarRule: (id: string, updates: Partial<GrammarRule>) => void;
  deleteGrammarRule: (id: string) => void;
  exportDatasetJSON: () => void;
  importDatasetJSON: (jsonData: string) => boolean;
  resetToDefaults: () => void;
}

const QuechuaContext = createContext<QuechuaContextType | undefined>(undefined);
const STORAGE_KEYS = {
  ROOTS: 'qhawana_roots_v2',
  SUFFIXES: 'qhawana_suffixes_v2',
  PHRASES: 'qhawana_phrases_v2',
  DOUBTS: 'qhawana_doubts_v2',
  RULES: 'qhawana_rules_v2',
  DARK_MODE: 'qhawana_dark_mode',
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined') return fallback;
    const saved = window.localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}

function mergeSeeds<T extends { id: string }>(saved: T[], seeds: T[]): T[] {
  const ids = new Set(saved.map((item) => item.id));
  const missing = seeds.filter((item) => !ids.has(item.id));
  return missing.length ? [...saved, ...missing] : saved;
}

const DEFAULT_ROOTS = [...SEED_ROOTS, ...SEED_PERSONAL_PRONOUNS];
const DEFAULT_PHRASES = [...SEED_PHRASES, ...PERSONAL_PRONOUNS_PHRASES];
const DEFAULT_GRAMMAR_RULES = [...SEED_GRAMMAR_RULES, PERSONAL_PRONOUNS_RULE, VERB_TENSES_RULE];
const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
type NewDoubt = Omit<CriticalDoubt, 'id' | 'createdAt'>;

export const QuechuaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<QuechuaContextType['activeTab']>('bank');
  const [darkMode, setDarkMode] = useState(() => readStorage(STORAGE_KEYS.DARK_MODE, false));
  const [roots, setRoots] = useState<LexicalRoot[]>(() => mergeSeeds(readStorage(STORAGE_KEYS.ROOTS, DEFAULT_ROOTS), DEFAULT_ROOTS));
  const [suffixes, setSuffixes] = useState<SuffixRule[]>(() => mergeSeeds(readStorage(STORAGE_KEYS.SUFFIXES, SEED_SUFFIXES), SEED_SUFFIXES));
  const [phrases, setPhrases] = useState<CorpusPhrase[]>(() => mergeSeeds(readStorage(STORAGE_KEYS.PHRASES, DEFAULT_PHRASES), DEFAULT_PHRASES));
  const [doubts, setDoubts] = useState<CriticalDoubt[]>(() => readStorage(STORAGE_KEYS.DOUBTS, SEED_DOUBTS));
  const [grammarRules, setGrammarRules] = useState<GrammarRule[]>(() => mergeSeeds(readStorage(STORAGE_KEYS.RULES, DEFAULT_GRAMMAR_RULES), DEFAULT_GRAMMAR_RULES));

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const save = (key: string, value: unknown) => {
      try { window.localStorage.setItem(key, JSON.stringify(value)); }
      catch (error) { console.warn(`Error saving ${key}`, error); }
    };
    save(STORAGE_KEYS.ROOTS, roots);
    save(STORAGE_KEYS.SUFFIXES, suffixes);
    save(STORAGE_KEYS.PHRASES, phrases);
    save(STORAGE_KEYS.DOUBTS, doubts);
    save(STORAGE_KEYS.RULES, grammarRules);
  }, [roots, suffixes, phrases, doubts, grammarRules]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { window.localStorage.setItem(STORAGE_KEYS.DARK_MODE, JSON.stringify(darkMode)); }
    catch (error) { console.warn('Error saving dark mode', error); }
    if (typeof document !== 'undefined') document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const addRoot = (root: Omit<LexicalRoot, 'id' | 'frequency'>) =>
    setRoots((prev) => [{ ...root, id: makeId('root'), frequency: 1 }, ...prev]);
  const updateRoot = (id: string, updates: Partial<LexicalRoot>) =>
    setRoots((prev) => prev.map((item) => item.id === id ? { ...item, ...updates } : item));
  const deleteRoot = (id: string) => setRoots((prev) => prev.filter((item) => item.id !== id));
  const toggleVerifyRoot = (id: string) =>
    setRoots((prev) => prev.map((item) => item.id === id ? { ...item, verified: !item.verified } : item));

  const addSuffix = (suffix: Omit<SuffixRule, 'id'>) =>
    setSuffixes((prev) => [...prev, { ...suffix, id: makeId('suf') }]);
  const updateSuffix = (id: string, updates: Partial<SuffixRule>) =>
    setSuffixes((prev) => prev.map((item) => item.id === id ? { ...item, ...updates } : item));
  const deleteSuffix = (id: string) => setSuffixes((prev) => prev.filter((item) => item.id !== id));

  const addPhrase = (phrase: Omit<CorpusPhrase, 'id'>) =>
    setPhrases((prev) => [{ ...phrase, id: makeId('phrase') }, ...prev]);
  const updatePhrase = (id: string, updates: Partial<CorpusPhrase>) =>
    setPhrases((prev) => prev.map((item) => item.id === id ? { ...item, ...updates } : item));
  const deletePhrase = (id: string) => setPhrases((prev) => prev.filter((item) => item.id !== id));
  const toggleVerifyPhrase = (id: string) =>
    setPhrases((prev) => prev.map((item) => item.id === id ? { ...item, verified: !item.verified } : item));

  const addDoubt = (newDoubt: NewDoubt) => {
    setDoubts((prev) => {
      const existing = prev.find((item) => item.term.toLowerCase() === newDoubt.term.toLowerCase());
      if (existing) return prev.map((item) => item.id === existing.id ? { ...item, occurrences: item.occurrences + 1 } : item);
      return [{ ...newDoubt, id: makeId('doubt'), createdAt: new Date().toISOString() }, ...prev];
    });
  };

  /**
   * Guarda una frase; si ya existe una con el mismo texto origen la reemplaza
   * (así una corrección no deja la versión vieja compitiendo en el corpus).
   */
  const upsertPhrase = (direction: 'qu-es' | 'es-qu', phrase: Omit<CorpusPhrase, 'id'>): 'created' | 'updated' => {
    const sourceOf = (p: { quechua: string; spanish: string }) => direction === 'qu-es' ? p.quechua : p.spanish;
    const targetOf = (p: { quechua: string; spanish: string }) => direction === 'qu-es' ? p.spanish : p.quechua;
    const key = normalizeText(sourceOf(phrase));
    const existing = phrases.find((p) => normalizeText(sourceOf(p)) === key);
    if (!existing) {
      addPhrase(phrase);
      return 'created';
    }
    const changed = normalizeText(targetOf(existing)) !== normalizeText(targetOf(phrase));
    setPhrases((prev) => prev.map((p) => p.id === existing.id
      ? {
          ...p,
          ...phrase,
          grammaticalNotes: changed
            ? `${phrase.grammaticalNotes} [Corregido: antes «${targetOf(existing)}»]`
            : phrase.grammaticalNotes,
        }
      : p));
    return 'updated';
  };

  /**
   * Toma las palabras de una traducción guardada/corregida y agrega al directorio las raíces
   * que todavía no existen (sin verificar), creando además un término crítico para revisarlas.
   * Devuelve las raíces nuevas.
   */
  const learnFromTranslation = (tokens: MorphToken[], context: { quechua: string; spanish: string }): { roots: string[]; senses: string[] } => {
    const seen = new Set<string>();
    const fresh: Array<{ root: string; meaning: string }> = [];
    const newSenses: Array<{ rootId: string; root: string; meaning: string }> = [];

    const realMeaning = (token: MorphToken, key: string): string => {
      if (token.meaning && normalizeText(token.meaning) !== key) return token.meaning.trim();
      const lexical = (token.gloss || '').split('-')[0].trim();
      return lexical && normalizeText(lexical) !== key && !/^[A-Z0-9.]+$/.test(lexical) ? lexical : '';
    };

    tokens.forEach((token) => {
      const root = (token.root || '').replace(/^-+|-+$/g, '').trim();
      const key = normalizeText(root);
      if (!root || /^\d+$/.test(root) || seen.has(key)) return;
      seen.add(key);

      const existing = findRoot(root, roots);
      const given = realMeaning(token, key);

      if (existing) {
        // Raíz conocida: si aquí se usa con un significado que no tenía, se registra como otro sentido.
        if (given && !meaningCovered(given, existing)) {
          newSenses.push({ rootId: existing.id, root: existing.quechua, meaning: given });
        }
        return;
      }

      const meaning = given
        || (tokens.length === 1 && context.spanish.split(/\s+/).length <= 4
          ? context.spanish
          : `Pendiente de glosar (aparece en «${context.spanish}»)`);
      fresh.push({ root, meaning });
    });

    if (fresh.length) {
      setRoots((prev) => {
        const additions: LexicalRoot[] = fresh
          .filter((item) => !rootExists(item.root, prev))
          .map((item) => ({
            id: makeId('root'),
            quechua: item.root,
            spanish: item.meaning,
            category: item.root.endsWith('y') ? 'verbo' : 'sustantivo',
            dialectNote: 'Agregada automáticamente desde una traducción corregida; pendiente de revisión.',
            verified: false,
            frequency: 1,
            examples: [context.quechua],
          }));
        return additions.length ? [...additions, ...prev] : prev;
      });
      fresh.forEach((item) => addDoubt({
        term: item.root,
        trigger: 'out_of_glossary',
        contextPhrase: context.quechua,
        occurrences: 1,
        aiHypothesis: `Raíz nueva agregada al directorio desde una traducción guardada. Significado provisional: «${item.meaning}».`,
        quechuistaQuestion: `¿"${item.root}" es la raíz correcta y su significado es el que se usa en Cochabamba?`,
        suggestedAction: 'Revisar y marcar como verificada en el Banco Lingüístico (o corregir con la corrección en cascada).',
        status: 'pending',
      }));
    }

    if (newSenses.length) {
      setRoots((prev) => prev.map((r) => {
        const adds = newSenses.filter((n) => n.rootId === r.id && !meaningCovered(n.meaning, r));
        return adds.length
          ? { ...r, senses: [...(r.senses || []), ...adds.map((n) => ({ meaning: n.meaning, context: context.spanish, verified: false }))] }
          : r;
      }));
      newSenses.forEach((n) => addDoubt({
        term: `${n.root} («${n.meaning}»)`,
        trigger: 'low_confidence',
        contextPhrase: context.quechua,
        occurrences: 1,
        aiHypothesis: `"${n.root}" ya está en el directorio, pero aquí se usó con otro significado: «${n.meaning}». Se guardó como sentido adicional sin verificar.`,
        quechuistaQuestion: `¿"${n.root}" puede significar también «${n.meaning}»? ¿En qué contexto se usa cada significado?`,
        suggestedAction: 'Revisar los significados de la raíz en el Banco Lingüístico y precisar el contexto de cada uno.',
        status: 'pending',
      }));
    }

    return { roots: fresh.map((item) => item.root), senses: newSenses.map((n) => `${n.root} → ${n.meaning}`) };
  };

  const updateDoubt = (id: string, updates: Partial<CriticalDoubt>) =>
    setDoubts((prev) => prev.map((item) => item.id === id ? { ...item, ...updates } : item));
  const setDoubtStatus = (id: string, status: DoubtStatus, resolutionNote?: string) =>
    setDoubts((prev) => prev.map((item) => item.id === id ? { ...item, status, resolutionNote: resolutionNote ?? item.resolutionNote } : item));
  const deleteDoubt = (id: string) => setDoubts((prev) => prev.filter((item) => item.id !== id));

  const applyCascadeCorrection = (oldTerm: string, newTerm: string, resolutionNote?: string): number => {
    const term = oldTerm.trim();
    if (!term) return 0;
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(^|[^\\p{L}\\p{N}_])(${escaped})(?=$|[^\\p{L}\\p{N}_])`, 'giu');
    const replace = (value: string) => value.replace(pattern, (_match, prefix: string) => `${prefix}${newTerm}`);
    let replacedCount = 0;
    setPhrases((prev) => prev.map((phrase) => {
      const quechua = replace(phrase.quechua);
      const morphologicalBreakdown = replace(phrase.morphologicalBreakdown);
      if (quechua === phrase.quechua && morphologicalBreakdown === phrase.morphologicalBreakdown) return phrase;
      replacedCount++;
      return {
        ...phrase, quechua, morphologicalBreakdown,
        grammaticalNotes: phrase.grammaticalNotes
          ? `${phrase.grammaticalNotes} [Normalizado en cascada: ${oldTerm} -> ${newTerm}]`
          : `[Normalizado en cascada: ${oldTerm} -> ${newTerm}]`,
      };
    }));
    setDoubts((prev) => prev.map((item) => item.term.toLowerCase() === term.toLowerCase()
      ? { ...item, status: 'resolved' as DoubtStatus, resolutionNote: resolutionNote || `Corregido en cascada a "${newTerm}".` }
      : item));
    return replacedCount;
  };

  const autoScanCorpus = (): number => {
    let addedCount = 0;
    const knownTerms = new Set(doubts.map((item) => item.term.toLowerCase()));
    const knownContexts = new Set(doubts.map((item) => item.contextPhrase));
    const addScannedDoubt = (doubt: NewDoubt) => {
      const termKey = doubt.term.toLowerCase();
      if (knownTerms.has(termKey) || knownContexts.has(doubt.contextPhrase)) return;
      knownTerms.add(termKey);
      knownContexts.add(doubt.contextPhrase);
      addDoubt(doubt);
      addedCount++;
    };
    phrases.forEach((phrase) => {
      const qLower = phrase.quechua.toLowerCase();
      if (qLower.includes('chka')) {
        const badWord = phrase.quechua.split(/\\s+/).find((word) => word.toLowerCase().includes('chka')) || 'chka';
        const cleanWord = badWord.replace(/[.,!?;:]/g, '');
        const suggestedWord = cleanWord.replace(/chka/gi, 'sha');
        addScannedDoubt({ term: cleanWord, trigger: 'dialect_variant', contextPhrase: phrase.quechua, occurrences: 1,
          aiHypothesis: 'Variante cusqueña con sufijo progresivo -chka-. En Cochabamba se realiza obligatoriamente como -sha-.',
          quechuistaQuestion: `¿Confirma el reemplazo de "${cleanWord}" por "${suggestedWord}" para reflejar el quechua cochabambino auténtico?`,
          suggestedAction: `Reemplazar por "${suggestedWord}" mediante corrección en cascada.`, status: 'pending' });
      }
      if (qLower.includes('chis') && !qLower.includes('chish')) {
        const badWord = phrase.quechua.split(/\\s+/).find((word) => word.toLowerCase().includes('chis')) || 'chis';
        const cleanWord = badWord.replace(/[.,!?;:]/g, '');
        addScannedDoubt({ term: cleanWord, trigger: 'dialect_variant', contextPhrase: phrase.quechua, occurrences: 1,
          aiHypothesis: 'Variante de pluralizador (-chis). En Cochabamba rige -nchij (1PL.INCL) o -kichij (2PL).',
          quechuistaQuestion: `¿Debe sustituirse "${cleanWord}" por la forma cochabambina con terminación en "j"?`,
          suggestedAction: 'Normalizar con terminación boliviana en "j".', status: 'pending' });
      }
      const spellingMatch = qLower.match(/\\b(hatun|hallp'a|hamuy)\\b/i);
      if (spellingMatch) {
        const badWord = spellingMatch[0];
        const suggestedWord = badWord.replace(/^h/i, 'j');
        addScannedDoubt({ term: badWord, trigger: 'dialect_variant', contextPhrase: phrase.quechua, occurrences: 1,
          aiHypothesis: `Grafía con "h" inicial propia de normas peruanas. En Bolivia rige la RM 1032/84 con "j" inicial ("${suggestedWord}").`,
          quechuistaQuestion: `¿Estandarizar a "${suggestedWord}" según el alfabeto oficial boliviano?`,
          suggestedAction: `Corregir en cascada a "${suggestedWord}".`, status: 'pending' });
      }
      if (!phrase.verified) {
        const firstWord = phrase.quechua.split(/\\s+/)[0]?.replace(/[.,!?;:]/g, '') || phrase.quechua;
        addScannedDoubt({ term: firstWord, trigger: 'low_confidence', contextPhrase: phrase.quechua, occurrences: 1,
          aiHypothesis: 'Frase registrada en el corpus pero clasificada como "En revisión / no verificada".',
          quechuistaQuestion: `¿La expresión "${phrase.quechua}" es natural y correcta en Cochabamba?`,
          suggestedAction: `Revisar traducción ("${phrase.spanish}") con un hablante nativo.`, status: 'pending' });
      }
    });
    return addedCount;
  };

  const addGrammarRule = (rule: Omit<GrammarRule, 'id'>) => setGrammarRules((prev) => [...prev, { ...rule, id: makeId('rule') }]);
  const updateGrammarRule = (id: string, updates: Partial<GrammarRule>) => setGrammarRules((prev) => prev.map((item) => item.id === id ? { ...item, ...updates } : item));
  const deleteGrammarRule = (id: string) => setGrammarRules((prev) => prev.filter((item) => item.id !== id));

  const exportDatasetJSON = () => {
    const payload = { version: '2.0-cochabamba', exportedAt: new Date().toISOString(), dialect: 'Quechua Boliviano (Cochabamba)', roots, suffixes, phrases, doubts, grammarRules };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `qhawana-corpus-cochabamba-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importDatasetJSON = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.roots && Array.isArray(parsed.roots)) setRoots(mergeSeeds(parsed.roots, DEFAULT_ROOTS));
      if (parsed.suffixes && Array.isArray(parsed.suffixes)) setSuffixes(mergeSeeds(parsed.suffixes, SEED_SUFFIXES));
      if (parsed.phrases && Array.isArray(parsed.phrases)) setPhrases(mergeSeeds(parsed.phrases, DEFAULT_PHRASES));
      if (parsed.doubts && Array.isArray(parsed.doubts)) setDoubts(parsed.doubts);
      if (parsed.grammarRules && Array.isArray(parsed.grammarRules)) setGrammarRules(mergeSeeds(parsed.grammarRules, DEFAULT_GRAMMAR_RULES));
      return true;
    } catch (error) {
      console.error('Error importing JSON data', error);
      return false;
    }
  };

  const resetToDefaults = () => {
    setRoots(DEFAULT_ROOTS);
    setSuffixes(SEED_SUFFIXES);
    setPhrases(DEFAULT_PHRASES);
    setDoubts(SEED_DOUBTS);
    setGrammarRules(DEFAULT_GRAMMAR_RULES);
  };

  return (
    <QuechuaContext.Provider value={{
      roots, suffixes, phrases, doubts, grammarRules, activeTab, setActiveTab, darkMode, setDarkMode,
      addRoot, updateRoot, deleteRoot, toggleVerifyRoot,
      addSuffix, updateSuffix, deleteSuffix,
      addPhrase, updatePhrase, deletePhrase, toggleVerifyPhrase, upsertPhrase, learnFromTranslation,
      addDoubt, updateDoubt, setDoubtStatus, deleteDoubt, applyCascadeCorrection, autoScanCorpus,
      addGrammarRule, updateGrammarRule, deleteGrammarRule,
      exportDatasetJSON, importDatasetJSON, resetToDefaults,
    }}>
      {children}
    </QuechuaContext.Provider>
  );
};

export const useQuechua = () => {
  const context = useContext(QuechuaContext);
  if (!context) throw new Error('useQuechua must be used within a QuechuaProvider');
  return context;
};
