import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  LexicalRoot,
  SuffixRule,
  CorpusPhrase,
  CriticalDoubt,
  GrammarRule,
  DoubtStatus,
} from '../types/quechua';
import {
  SEED_ROOTS,
  SEED_SUFFIXES,
  SEED_PHRASES,
  SEED_DOUBTS,
  SEED_GRAMMAR_RULES,
} from '../data/seedData';

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

  // Raíces
  addRoot: (root: Omit<LexicalRoot, 'id' | 'frequency'>) => void;
  updateRoot: (id: string, updates: Partial<LexicalRoot>) => void;
  deleteRoot: (id: string) => void;
  toggleVerifyRoot: (id: string) => void;

  // Sufijos
  addSuffix: (suffix: Omit<SuffixRule, 'id'>) => void;
  updateSuffix: (id: string, updates: Partial<SuffixRule>) => void;
  deleteSuffix: (id: string) => void;

  // Frases
  addPhrase: (phrase: Omit<CorpusPhrase, 'id'>) => void;
  updatePhrase: (id: string, updates: Partial<CorpusPhrase>) => void;
  deletePhrase: (id: string) => void;
  toggleVerifyPhrase: (id: string) => void;

  // Dudas / Términos Críticos
  addDoubt: (doubt: Omit<CriticalDoubt, 'id' | 'createdAt'>) => void;
  updateDoubt: (id: string, updates: Partial<CriticalDoubt>) => void;
  setDoubtStatus: (id: string, status: DoubtStatus, resolutionNote?: string) => void;
  deleteDoubt: (id: string) => void;
  applyCascadeCorrection: (oldTerm: string, newTerm: string, resolutionNote?: string) => number;
  autoScanCorpus: () => number;

  // Reglas
  addGrammarRule: (rule: Omit<GrammarRule, 'id'>) => void;
  updateGrammarRule: (id: string, updates: Partial<GrammarRule>) => void;
  deleteGrammarRule: (id: string) => void;

  // Export / Import
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

export const QuechuaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<'bank' | 'doubts' | 'consultation' | 'translator' | 'chat'>('bank');

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DARK_MODE);
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const [roots, setRoots] = useState<LexicalRoot[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ROOTS);
      if (saved) {
        const parsed: LexicalRoot[] = JSON.parse(saved);
        const existingIds = new Set(parsed.map((r) => r.id));
        const missing = SEED_ROOTS.filter((r) => !existingIds.has(r.id));
        return missing.length > 0 ? [...parsed, ...missing] : parsed;
      }
      return SEED_ROOTS;
    } catch {
      return SEED_ROOTS;
    }
  });

  const [suffixes, setSuffixes] = useState<SuffixRule[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SUFFIXES);
      if (saved) {
        const parsed: SuffixRule[] = JSON.parse(saved);
        const existingIds = new Set(parsed.map((s) => s.id));
        const missing = SEED_SUFFIXES.filter((s) => !existingIds.has(s.id));
        return missing.length > 0 ? [...parsed, ...missing] : parsed;
      }
      return SEED_SUFFIXES;
    } catch {
      return SEED_SUFFIXES;
    }
  });

  const [phrases, setPhrases] = useState<CorpusPhrase[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PHRASES);
      if (saved) {
        const parsed: CorpusPhrase[] = JSON.parse(saved);
        const existingIds = new Set(parsed.map((p) => p.id));
        const missing = SEED_PHRASES.filter((p) => !existingIds.has(p.id));
        return missing.length > 0 ? [...parsed, ...missing] : parsed;
      }
      return SEED_PHRASES;
    } catch {
      return SEED_PHRASES;
    }
  });

  const [doubts, setDoubts] = useState<CriticalDoubt[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DOUBTS);
      return saved ? JSON.parse(saved) : SEED_DOUBTS;
    } catch {
      return SEED_DOUBTS;
    }
  });

  const [grammarRules, setGrammarRules] = useState<GrammarRule[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RULES);
      if (saved) {
        const parsed: GrammarRule[] = JSON.parse(saved);
        const existingIds = new Set(parsed.map((r) => r.id));
        const missing = SEED_GRAMMAR_RULES.filter((r) => !existingIds.has(r.id));
        return missing.length > 0 ? [...parsed, ...missing] : parsed;
      }
      return SEED_GRAMMAR_RULES;
    } catch {
      return SEED_GRAMMAR_RULES;
    }
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ROOTS, JSON.stringify(roots));
    } catch (e) {
      console.warn('Error saving roots', e);
    }
  }, [roots]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SUFFIXES, JSON.stringify(suffixes));
    } catch (e) {
      console.warn('Error saving suffixes', e);
    }
  }, [suffixes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PHRASES, JSON.stringify(phrases));
    } catch (e) {
      console.warn('Error saving phrases', e);
    }
  }, [phrases]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DOUBTS, JSON.stringify(doubts));
    } catch (e) {
      console.warn('Error saving doubts', e);
    }
  }, [doubts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(grammarRules));
    } catch (e) {
      console.warn('Error saving grammarRules', e);
    }
  }, [grammarRules]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DARK_MODE, JSON.stringify(darkMode));
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.warn('Error saving dark mode', e);
    }
  }, [darkMode]);

  // Root operations
  const addRoot = (newRoot: Omit<LexicalRoot, 'id' | 'frequency'>) => {
    const item: LexicalRoot = {
      ...newRoot,
      id: `root-${Date.now()}`,
      frequency: 1,
    };
    setRoots((prev) => [item, ...prev]);
  };

  const updateRoot = (id: string, updates: Partial<LexicalRoot>) => {
    setRoots((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const deleteRoot = (id: string) => {
    setRoots((prev) => prev.filter((r) => r.id !== id));
  };

  const toggleVerifyRoot = (id: string) => {
    setRoots((prev) => prev.map((r) => (r.id === id ? { ...r, verified: !r.verified } : r)));
  };

  // Suffix operations
  const addSuffix = (newSuffix: Omit<SuffixRule, 'id'>) => {
    const item: SuffixRule = {
      ...newSuffix,
      id: `suf-${Date.now()}`,
    };
    setSuffixes((prev) => [...prev, item]);
  };

  const updateSuffix = (id: string, updates: Partial<SuffixRule>) => {
    setSuffixes((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const deleteSuffix = (id: string) => {
    setSuffixes((prev) => prev.filter((s) => s.id !== id));
  };

  // Phrase operations
  const addPhrase = (newPhrase: Omit<CorpusPhrase, 'id'>) => {
    const item: CorpusPhrase = {
      ...newPhrase,
      id: `phrase-${Date.now()}`,
    };
    setPhrases((prev) => [item, ...prev]);
  };

  const updatePhrase = (id: string, updates: Partial<CorpusPhrase>) => {
    setPhrases((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deletePhrase = (id: string) => {
    setPhrases((prev) => prev.filter((p) => p.id !== id));
  };

  const toggleVerifyPhrase = (id: string) => {
    setPhrases((prev) => prev.map((p) => (p.id === id ? { ...p, verified: !p.verified } : p)));
  };

  // Doubt operations
  const addDoubt = (newDoubt: Omit<CriticalDoubt, 'id' | 'createdAt'>) => {
    // Check if exists
    const existing = doubts.find((d) => d.term.toLowerCase() === newDoubt.term.toLowerCase());
    if (existing) {
      setDoubts((prev) =>
        prev.map((d) => (d.id === existing.id ? { ...d, occurrences: d.occurrences + 1 } : d))
      );
      return;
    }
    const item: CriticalDoubt = {
      ...newDoubt,
      id: `doubt-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setDoubts((prev) => [item, ...prev]);
  };

  const updateDoubt = (id: string, updates: Partial<CriticalDoubt>) => {
    setDoubts((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
  };

  const setDoubtStatus = (id: string, status: DoubtStatus, resolutionNote?: string) => {
    setDoubts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status, resolutionNote: resolutionNote ?? d.resolutionNote } : d))
    );
  };

  const deleteDoubt = (id: string) => {
    setDoubts((prev) => prev.filter((d) => d.id !== id));
  };

  // Sesión de Validación: Corrección en Cascada unificada a todo el corpus
  const applyCascadeCorrection = (oldTerm: string, newTerm: string, resolutionNote?: string): number => {
    let replacedCount = 0;
    const regex = new RegExp(`\\b${oldTerm}\\b`, 'gi');

    // 1. Reemplazar en Corpus de Frases
    setPhrases((prev) =>
      prev.map((p) => {
        let changed = false;
        let newQuechua = p.quechua;
        let newMorph = p.morphologicalBreakdown;

        if (regex.test(p.quechua)) {
          newQuechua = p.quechua.replace(regex, newTerm);
          changed = true;
        }
        if (regex.test(p.morphologicalBreakdown)) {
          newMorph = p.morphologicalBreakdown.replace(regex, newTerm);
          changed = true;
        }

        if (changed) {
          replacedCount++;
          return {
            ...p,
            quechua: newQuechua,
            morphologicalBreakdown: newMorph,
            grammaticalNotes: p.grammaticalNotes
              ? `${p.grammaticalNotes} [Normalizado en cascada: ${oldTerm} -> ${newTerm}]`
              : `[Normalizado en cascada: ${oldTerm} -> ${newTerm}]`,
          };
        }
        return p;
      })
    );

    // 2. Marcar la duda como resuelta
    setDoubts((prev) =>
      prev.map((d) => {
        if (d.term.toLowerCase() === oldTerm.toLowerCase()) {
          return {
            ...d,
            status: 'resolved' as DoubtStatus,
            resolutionNote: resolutionNote || `Corregido en cascada a "${newTerm}".`,
          };
        }
        return d;
      })
    );

    return replacedCount;
  };

  // Escaneo automático del corpus según los 3 disparadores
  const autoScanCorpus = (): number => {
    let addedCount = 0;

    phrases.forEach((phrase) => {
      const qLower = phrase.quechua.toLowerCase();

      // 1. Disparador 2: Variante Dialectal Peruana -chka- (prohibido en Cochabamba)
      if (qLower.includes('chka')) {
        const words = phrase.quechua.split(/\s+/);
        const badWord = words.find((w) => w.toLowerCase().includes('chka')) || 'chka';
        const cleanWord = badWord.replace(/[.,!?;:]/g, '');
        const suggestedWord = cleanWord.replace(/chka/gi, 'sha');

        const existing = doubts.find((d) => d.term.toLowerCase() === cleanWord.toLowerCase());
        if (!existing) {
          addDoubt({
            term: cleanWord,
            trigger: 'dialect_variant',
            contextPhrase: phrase.quechua,
            occurrences: 1,
            aiHypothesis: `Variante cusqueña con sufijo progresivo -chka-. En Cochabamba se realiza obligatoriamente como -sha-.`,
            quechuistaQuestion: `¿Confirma el reemplazo de "${cleanWord}" por "${suggestedWord}" para reflejar el quechua cochabambino auténtico?`,
            suggestedAction: `Reemplazar por "${suggestedWord}" mediante corrección en cascada.`,
            status: 'pending',
          });
          addedCount++;
        }
      }

      // 2. Disparador 2: Variante Dialectal -chis en lugar de -nchij / -kichij
      if (qLower.includes('chis') && !qLower.includes('chish')) {
        const words = phrase.quechua.split(/\s+/);
        const badWord = words.find((w) => w.toLowerCase().includes('chis')) || 'chis';
        const cleanWord = badWord.replace(/[.,!?;:]/g, '');
        const suggestedWord = cleanWord.replace(/chis/gi, 'nchij');

        const existing = doubts.find((d) => d.term.toLowerCase() === cleanWord.toLowerCase());
        if (!existing) {
          addDoubt({
            term: cleanWord,
            trigger: 'dialect_variant',
            contextPhrase: phrase.quechua,
            occurrences: 1,
            aiHypothesis: `Variante de pluralizador (-chis). En Cochabamba rige -nchij (1PL.INCL) o -kichij (2PL).`,
            quechuistaQuestion: `¿Debe sustituirse "${cleanWord}" por la forma cochabambina con terminación en "j"?`,
            suggestedAction: `Normalizar con terminación boliviana en "j".`,
            status: 'pending',
          });
          addedCount++;
        }
      }

      // 3. Disparador 2: Grafía con "h" en lugar de "j" boliviana (RM 1032/84)
      if (/\b(hatun|hallp'a|hamuy)\b/i.test(qLower)) {
        const match = qLower.match(/\b(hatun|hallp'a|hamuy)\b/i);
        if (match) {
          const badWord = match[0];
          const suggestedWord = badWord.replace(/^h/i, 'j');
          const existing = doubts.find((d) => d.term.toLowerCase() === badWord.toLowerCase());
          if (!existing) {
            addDoubt({
              term: badWord,
              trigger: 'dialect_variant',
              contextPhrase: phrase.quechua,
              occurrences: 1,
              aiHypothesis: `Grafía con "h" inicial propia de normas peruanas. En Bolivia rige la RM 1032/84 con "j" inicial ("${suggestedWord}").`,
              quechuistaQuestion: `¿Estandarizar a "${suggestedWord}" según el alfabeto oficial boliviano?`,
              suggestedAction: `Corregir en cascada a "${suggestedWord}".`,
              status: 'pending',
            });
            addedCount++;
          }
        }
      }

      // 4. Disparador 1: Bajo Nivel de Confianza (Frases marcadas no verificadas)
      if (!phrase.verified) {
        const existing = doubts.find((d) => d.contextPhrase === phrase.quechua);
        if (!existing) {
          const firstWord = phrase.quechua.split(/\s+/)[0].replace(/[.,!?;:]/g, '');
          addDoubt({
            term: firstWord,
            trigger: 'low_confidence',
            contextPhrase: phrase.quechua,
            occurrences: 1,
            aiHypothesis: `Frase registrada en el corpus pero clasificada como "En revisión / no verificada".`,
            quechuistaQuestion: `¿La expresión "${phrase.quechua}" es natural y correcta en Cochabamba?`,
            suggestedAction: `Revisar traducción ("${phrase.spanish}") con un hablante nativo.`,
            status: 'pending',
          });
          addedCount++;
        }
      }
    });

    return addedCount;
  };

  // Grammar rule operations
  const addGrammarRule = (newRule: Omit<GrammarRule, 'id'>) => {
    const item: GrammarRule = {
      ...newRule,
      id: `rule-${Date.now()}`,
    };
    setGrammarRules((prev) => [...prev, item]);
  };

  const updateGrammarRule = (id: string, updates: Partial<GrammarRule>) => {
    setGrammarRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const deleteGrammarRule = (id: string) => {
    setGrammarRules((prev) => prev.filter((r) => r.id !== id));
  };

  // Backup & Restore
  const exportDatasetJSON = () => {
    const payload = {
      version: '2.0-cochabamba',
      exportedAt: new Date().toISOString(),
      dialect: 'Quechua Boliviano (Cochabamba)',
      roots,
      suffixes,
      phrases,
      doubts,
      grammarRules,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qhawana-corpus-cochabamba-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importDatasetJSON = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.roots && Array.isArray(parsed.roots)) setRoots(parsed.roots);
      if (parsed.suffixes && Array.isArray(parsed.suffixes)) setSuffixes(parsed.suffixes);
      if (parsed.phrases && Array.isArray(parsed.phrases)) setPhrases(parsed.phrases);
      if (parsed.doubts && Array.isArray(parsed.doubts)) setDoubts(parsed.doubts);
      if (parsed.grammarRules && Array.isArray(parsed.grammarRules)) setGrammarRules(parsed.grammarRules);
      return true;
    } catch (e) {
      console.error('Error importing JSON data', e);
      return false;
    }
  };

  const resetToDefaults = () => {
    setRoots(SEED_ROOTS);
    setSuffixes(SEED_SUFFIXES);
    setPhrases(SEED_PHRASES);
    setDoubts(SEED_DOUBTS);
    setGrammarRules(SEED_GRAMMAR_RULES);
  };

  return (
    <QuechuaContext.Provider
      value={{
        roots,
        suffixes,
        phrases,
        doubts,
        grammarRules,
        activeTab,
        setActiveTab,
        darkMode,
        setDarkMode,
        addRoot,
        updateRoot,
        deleteRoot,
        toggleVerifyRoot,
        addSuffix,
        updateSuffix,
        deleteSuffix,
        addPhrase,
        updatePhrase,
        deletePhrase,
        toggleVerifyPhrase,
        addDoubt,
        updateDoubt,
        setDoubtStatus,
        deleteDoubt,
        applyCascadeCorrection,
        autoScanCorpus,
        addGrammarRule,
        updateGrammarRule,
        deleteGrammarRule,
        exportDatasetJSON,
        importDatasetJSON,
        resetToDefaults,
      }}
    >
      {children}
    </QuechuaContext.Provider>
  );
};

export const useQuechua = () => {
  const context = useContext(QuechuaContext);
  if (!context) {
    throw new Error('useQuechua must be used within a QuechuaProvider');
  }
  return context;
};
