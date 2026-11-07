import React, { useState, useMemo } from 'react';
import { useQuechua } from '../context/QuechuaContext';
import { 
  BookOpen, 
  Sparkles, 
  Layers, 
  ArrowRight, 
  Check, 
  Copy, 
  Search, 
  X, 
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { 
  VERB_TENSES, 
  PERSON_KEYS, 
  PERSON_LABELS, 
  joinTense,
  VERB_SPECIAL_FORMS 
} from '../data/verbTenses';

interface IntegratedContentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertText?: (text: string) => void;
  contextMode: 'translator' | 'chat';
}

type TabType = 'verbs' | 'pronouns' | 'rules' | 'corpus' | 'roots';

const SAMPLE_VERBS = [
  { root: 'mikhuy', base: 'mikhu', spanish: 'comer' },
  { root: 'jamuy', base: 'jamu', spanish: 'venir' },
  { root: 'parlay', base: 'parla', spanish: 'hablar' },
  { root: 'ruway', base: 'ruwa', spanish: 'hacer' },
  { root: 'llank\'ay', base: 'llank\'a', spanish: 'trabajar' },
  { root: 'samay', base: 'sama', spanish: 'descansar' },
  { root: 'takiy', base: 'taki', spanish: 'cantar' },
  { root: 'riypuni', base: 'ri', spanish: 'ir' },
  { root: 'munay', base: 'muna', spanish: 'querer' },
];

export const IntegratedContentDrawer: React.FC<IntegratedContentDrawerProps> = ({
  isOpen,
  onClose,
  onInsertText,
  contextMode,
}) => {
  const { 
    roots, 
    grammarRules, 
    phrases, 
    sendToTranslator, 
    sendToChat 
  } = useQuechua();

  const [activeTab, setActiveTab] = useState<TabType>('verbs');
  const [selectedVerb, setSelectedVerb] = useState('mikhuy');
  const [customVerbInput, setCustomVerbInput] = useState('');
  const [selectedTenseId, setSelectedTenseId] = useState(VERB_TENSES[1].id); // Progresivo por defecto (-sha-)
  
  // Possessive noun tester
  const [testNoun, setTestNoun] = useState('wasi');
  
  // Corpus and root filters
  const [corpusSearch, setCorpusSearch] = useState('');
  const [rootSearch, setRootSearch] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleApply = (text: string) => {
    if (onInsertText) {
      onInsertText(text);
    } else if (contextMode === 'translator') {
      sendToTranslator(text, 'qu-es');
    } else {
      sendToChat(text);
    }
  };

  // Verb conjugation logic
  const currentVerbBase = useMemo(() => {
    const raw = customVerbInput.trim() || selectedVerb;
    return raw.replace(/y$/i, '').trim();
  }, [customVerbInput, selectedVerb]);

  const currentTense = useMemo(() => {
    return VERB_TENSES.find((t) => t.id === selectedTenseId) || VERB_TENSES[0];
  }, [selectedTenseId]);

  // Possessive suffixes logic
  const isVowelEnding = useMemo(() => {
    const clean = testNoun.trim().toLowerCase();
    if (!clean) return true;
    return /[aeiouáéíóú]$/i.test(clean);
  }, [testNoun]);

  const possessiveRows = useMemo(() => {
    const base = testNoun.trim() || 'wasi';
    const euphonic = isVowelEnding ? '' : 'ni';
    
    return [
      { key: '1SG', person: '1.ª sg (mío)', suf: isVowelEnding ? '-y' : '-ni-y', form: `${base}${euphonic}y`, spanish: `mi ${base}` },
      { key: '2SG', person: '2.ª sg (tuyo)', suf: isVowelEnding ? '-yki' : '-ni-yki', form: `${base}${euphonic}yki`, spanish: `tu ${base}` },
      { key: '3SG', person: '3.ª sg (suyo de él/ella)', suf: isVowelEnding ? '-n' : '-ni-n', form: `${base}${euphonic}n`, spanish: `su ${base}` },
      { key: '1PL.INCL', person: '1.ª pl incl. (nuestro - tú y yo)', suf: isVowelEnding ? '-nchij' : '-ni-nchij', form: `${base}${euphonic}nchij`, spanish: `nuestro/a ${base} (inclusivo)` },
      { key: '1PL.EXCL', person: '1.ª pl excl. (nuestro - sin ti)', suf: isVowelEnding ? '-yku' : '-ni-yku', form: `${base}${euphonic}yku`, spanish: `nuestro/a ${base} (exclusivo)` },
      { key: '2PL', person: '2.ª pl (de ustedes)', suf: isVowelEnding ? '-ykichij' : '-ni-ykichij', form: `${base}${euphonic}ykichij`, spanish: `su ${base} (de ustedes)` },
      { key: '3PL', person: '3.ª pl (de ellos/ellas)', suf: isVowelEnding ? '-nku' : '-ni-nku', form: `${base}${euphonic}nku`, spanish: `su ${base} (de ellos)` },
    ];
  }, [testNoun, isVowelEnding]);

  // Filtered corpus
  const filteredPhrases = useMemo(() => {
    if (!corpusSearch.trim()) return phrases.slice(0, 15);
    const q = corpusSearch.toLowerCase();
    return phrases.filter(p => 
      p.quechua.toLowerCase().includes(q) || 
      p.spanish.toLowerCase().includes(q) ||
      (p.grammaticalNotes && p.grammaticalNotes.toLowerCase().includes(q))
    ).slice(0, 20);
  }, [phrases, corpusSearch]);

  // Filtered roots
  const filteredRoots = useMemo(() => {
    if (!rootSearch.trim()) return roots.slice(0, 20);
    const q = rootSearch.toLowerCase();
    return roots.filter(r => 
      r.quechua.toLowerCase().includes(q) || 
      r.spanish.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q)
    ).slice(0, 25);
  }, [roots, rootSearch]);

  if (!isOpen) return null;

  return (
    <div className="bg-white dark:bg-stone-900 border border-amber-200 dark:border-amber-900/60 rounded-xl shadow-lg overflow-hidden transition-all">
      {/* Header Bar */}
      <div className="bg-amber-700 dark:bg-amber-800 text-white px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-5 h-5 text-amber-200" />
          <div>
            <h3 className="font-display font-bold text-sm tracking-wide">
              Banco de Contenidos & Gramática Cochabambina
            </h3>
            <p className="text-[11px] text-amber-100/80">
              Integración total con el {contextMode === 'translator' ? 'Traductor' : 'Chat'}: conjuga, consulta y transfiere con 1 clic
            </p>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="p-1 hover:bg-amber-600 dark:hover:bg-amber-700 rounded-lg text-amber-100 transition-colors"
          title="Cerrar panel de contenidos"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('verbs')}
          className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'verbs'
              ? 'border-amber-700 text-amber-800 dark:text-amber-400 bg-white dark:bg-stone-900 font-bold'
              : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Tiempos Verbales & Conjugador</span>
        </button>

        <button
          onClick={() => setActiveTab('pronouns')}
          className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'pronouns'
              ? 'border-amber-700 text-amber-800 dark:text-amber-400 bg-white dark:bg-stone-900 font-bold'
              : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-blue-600" />
          <span>Pronombres & Sufijos Posesivos</span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'rules'
              ? 'border-amber-700 text-amber-800 dark:text-amber-400 bg-white dark:bg-stone-900 font-bold'
              : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-emerald-600" />
          <span>Reglas Clave (Plural, Negación, Condicional)</span>
        </button>

        <button
          onClick={() => setActiveTab('corpus')}
          className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'corpus'
              ? 'border-amber-700 text-amber-800 dark:text-amber-400 bg-white dark:bg-stone-900 font-bold'
              : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-purple-600" />
          <span>Corpus de Frases ({phrases.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('roots')}
          className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'roots'
              ? 'border-amber-700 text-amber-800 dark:text-amber-400 bg-white dark:bg-stone-900 font-bold'
              : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
          }`}
        >
          <Search className="w-3.5 h-3.5 text-stone-500" />
          <span>Glosario de Raíces ({roots.length})</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="p-4 sm:p-5 max-h-[460px] overflow-y-auto">
        {/* ======================================================== */}
        {/* TAB 1: TIEMPOS VERBALES & CONJUGADOR EN VIVO */}
        {/* ======================================================== */}
        {activeTab === 'verbs' && (
          <div className="space-y-4">
            <div className="bg-amber-50/60 dark:bg-amber-950/20 p-3.5 rounded-lg border border-amber-200 dark:border-amber-900/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider block">
                  Conjugador Cochabambino en Vivo
                </span>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Selecciona o escribe cualquier verbo en infinitivo para generar su conjugación estandarizada en los 8 tiempos.
                </p>
              </div>

              {/* Sample verb buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                {SAMPLE_VERBS.slice(0, 5).map((v) => (
                  <button
                    key={v.root}
                    onClick={() => {
                      setSelectedVerb(v.root);
                      setCustomVerbInput('');
                    }}
                    className={`px-2 py-1 text-xs font-mono rounded border transition-colors ${
                      selectedVerb === v.root && !customVerbInput
                        ? 'bg-amber-700 text-white border-amber-800'
                        : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-amber-400'
                    }`}
                  >
                    {v.root}
                  </button>
                ))}
              </div>
            </div>

            {/* Verb & Tense Selector Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Verbo a conjugar (infinitivo o raíz):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customVerbInput || selectedVerb}
                    onChange={(e) => {
                      setCustomVerbInput(e.target.value);
                      setSelectedVerb(e.target.value);
                    }}
                    placeholder="ej. mikhuy, jamuy, parlay..."
                    className="flex-1 px-3 py-1.5 text-xs font-mono font-bold bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <select
                    value={selectedVerb}
                    onChange={(e) => {
                      setSelectedVerb(e.target.value);
                      setCustomVerbInput('');
                    }}
                    className="px-2 py-1.5 text-xs bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-700 dark:text-stone-300"
                  >
                    {SAMPLE_VERBS.map((v) => (
                      <option key={v.root} value={v.root}>
                        {v.root} ({v.spanish})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Tiempo o aspecto verbal:
                </label>
                <select
                  value={selectedTenseId}
                  onChange={(e) => setSelectedTenseId(e.target.value as any)}
                  className="w-full px-3 py-1.5 text-xs font-semibold bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {VERB_TENSES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.gloss}{t.marker ? ` · ${t.marker}` : ''})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Current Tense Information Banner */}
            <div className="p-3 bg-stone-50 dark:bg-stone-950 rounded-lg border border-stone-200 dark:border-stone-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-bold text-stone-900 dark:text-stone-100">
                  {currentTense.name}
                </span>{' '}
                <span className="text-stone-600 dark:text-stone-400">
                  — {currentTense.usage}
                </span>
              </div>
              <div className="font-mono text-[11px] text-amber-800 dark:text-amber-400 shrink-0">
                Ej: {currentTense.example.morphology} = {currentTense.example.spanish}
              </div>
            </div>

            {/* Conjugation Matrix for the Selected Tense */}
            <div className="overflow-x-auto rounded-lg border border-stone-200 dark:border-stone-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100 dark:bg-stone-950 uppercase text-[10px] text-stone-600 dark:text-stone-400">
                  <tr>
                    <th className="px-3 py-2">Persona</th>
                    <th className="px-3 py-2">Pronombre</th>
                    <th className="px-3 py-2">Terminación</th>
                    <th className="px-3 py-2 font-bold text-amber-900 dark:text-amber-300">Forma Conjugada</th>
                    <th className="px-3 py-2 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-stone-800 bg-white dark:bg-stone-900">
                  {PERSON_KEYS.map((pk) => {
                    const cell = currentTense.cells[pk];
                    const label = PERSON_LABELS[pk];
                    
                    // Special case: verbo kay en presente 3ra persona = cópula cero!
                    const isKayPresent3SG = (currentVerbBase === 'ka' || currentVerbBase === 'kay') && currentTense.id === 'presente' && pk === '3SG';
                    
                    let conjugated = cell.suf 
                      ? `${currentVerbBase}${joinTense(currentTense.marker, cell.suf).replace(/^-/, '')}`
                      : '—';
                    
                    if (isKayPresent3SG) {
                      conjugated = 'Ø (cópula cero; no lleva -n)';
                    } else if (currentTense.id === 'futuro' && pk === '1PL.EXCL') {
                      // cochabambino canónico: -sajku o -sqayku
                      conjugated = `${currentVerbBase}sajku / ${currentVerbBase}sqayku`;
                    } else if (currentTense.id === 'habitual') {
                      // imperfecto habitual: parla-j ka-rqa-ni
                      const pSuf = cell.suf ? cell.suf.replace(/^-/, '') : '';
                      conjugated = `${currentVerbBase}j karqa${pSuf ? (pSuf === 'n' ? '' : pSuf) : ''}`;
                    }

                    const transferText = isKayPresent3SG 
                      ? `Payqa ${label.pronoun}` 
                      : `${label.pronoun} ${conjugated.split(' / ')[0]}`;

                    return (
                      <tr key={pk} className="hover:bg-amber-50/40 dark:hover:bg-amber-950/20">
                        <td className="px-3 py-2 font-medium text-stone-700 dark:text-stone-300">
                          {label.short}
                        </td>
                        <td className="px-3 py-2 font-mono text-stone-500">
                          {label.pronoun}
                        </td>
                        <td className="px-3 py-2 font-mono text-stone-600 dark:text-stone-400">
                          {cell.suf ? joinTense(currentTense.marker, cell.suf) : '—'}
                          {cell.confirm && <sup className="text-amber-600 ml-0.5" title="Por confirmar">?</sup>}
                        </td>
                        <td className="px-3 py-2 font-mono font-bold text-amber-800 dark:text-amber-400">
                          {conjugated}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleCopy(transferText, `c-${pk}`)}
                              className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-500"
                              title="Copiar al portapapeles"
                            >
                              {copiedKey === `c-${pk}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleApply(transferText)}
                              className="px-2 py-0.5 bg-amber-700 hover:bg-amber-800 text-white rounded text-[10px] font-semibold flex items-center gap-1"
                              title={`Insertar en ${contextMode === 'translator' ? 'Traductor' : 'Conversación'}`}
                            >
                              <span>Usar</span>
                              <ArrowRight className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Special Verbal Forms chips */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wide block">
                Formas no finitas del verbo (clic para insertar):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {VERB_SPECIAL_FORMS.map((f) => {
                  const exampleApplied = `${currentVerbBase}${f.form.replace(/^-/, '')}`;
                  return (
                    <button
                      key={f.form}
                      onClick={() => handleApply(exampleApplied)}
                      className="px-2.5 py-1 bg-stone-100 dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-amber-950/60 rounded text-xs border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 flex items-center gap-1.5 transition-colors"
                      title={`${f.name} (${f.gloss}): ${f.usage}`}
                    >
                      <span className="font-mono font-semibold text-amber-700 dark:text-amber-400">{f.form}</span>
                      <span className="text-[10px] text-stone-500">({f.name})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: PRONOMBRES & SUFIJOS POSESIVOS */}
        {/* ======================================================== */}
        {activeTab === 'pronouns' && (
          <div className="space-y-4">
            {/* Pronoun Table with Key Distinction */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                  1. Pronombres Personales Cochabambinos
                </span>
                <span className="text-[11px] text-stone-500">
                  Distingue inclusivo (-nchij) vs exclusivo (-yku)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {[
                  { form: 'noqa', person: '1.ª sg', spanish: 'yo', rule: 'Hablante único' },
                  { form: 'qan', person: '2.ª sg', spanish: 'tú / vos', rule: 'Oyente único' },
                  { form: 'pay', person: '3.ª sg', spanish: 'él / ella', rule: 'Cópula cero: "Payqa José" (sin kan)' },
                  { form: 'noqanchej', person: '1.ª pl incl.', spanish: 'nosotros (tú y yo)', rule: 'Incluye al oyente; grafía en -j' },
                  { form: 'noqayku', person: '1.ª pl excl.', spanish: 'nosotros (sin ti)', rule: 'Excluye al oyente; futuro en -sajku' },
                  { form: 'qankuna', person: '2.ª pl', spanish: 'ustedes', rule: 'qan + plural -kuna' },
                  { form: 'paykuna', person: '3.ª pl', spanish: 'ellos / ellas', rule: 'pay + plural -kuna' },
                ].map((p) => (
                  <div
                    key={p.form}
                    className="p-3 bg-stone-50 dark:bg-stone-950 rounded-lg border border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-sm font-bold text-amber-800 dark:text-amber-400">
                          {p.form}
                        </span>
                        <span className="text-[10px] text-stone-500 font-medium">
                          ({p.person})
                        </span>
                      </div>
                      <div className="text-xs text-stone-800 dark:text-stone-200">
                        {p.spanish}
                      </div>
                      <div className="text-[10px] text-stone-500 italic mt-0.5">
                        {p.rule}
                      </div>
                    </div>

                    <button
                      onClick={() => handleApply(p.form)}
                      className="px-2 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded text-[10px] font-semibold shrink-0"
                    >
                      Usar
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Possessive Suffixes for Nouns */}
            <div className="pt-3 border-t border-stone-200 dark:border-stone-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider block">
                    2. Sufijos Posesivos Nominales
                  </span>
                  <p className="text-xs text-stone-600 dark:text-stone-400">
                    Si el sustantivo termina en consonante, se inserta obligatoriamente el interfijo eufónico <strong>-ni-</strong> (ej. <em>yawar-ni-y</em> = mi sangre).
                  </p>
                </div>

                {/* Quick Noun Tester */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs text-stone-500">Probar sustantivo:</span>
                  <input
                    type="text"
                    value={testNoun}
                    onChange={(e) => setTestNoun(e.target.value)}
                    placeholder="wasi, allqu, yawar..."
                    className="px-2.5 py-1 text-xs font-mono font-bold bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded text-stone-900 dark:text-stone-100 w-28 focus:outline-none"
                  />
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-stone-200 dark:border-stone-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-100 dark:bg-stone-950 uppercase text-[10px] text-stone-600 dark:text-stone-400">
                    <tr>
                      <th className="px-3 py-2">Persona</th>
                      <th className="px-3 py-2">Sufijo</th>
                      <th className="px-3 py-2 font-bold text-blue-900 dark:text-blue-300">Ejemplo con "{testNoun}"</th>
                      <th className="px-3 py-2">Significado</th>
                      <th className="px-3 py-2 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 dark:divide-stone-800 bg-white dark:bg-stone-900 font-mono">
                    {possessiveRows.map((row) => (
                      <tr key={row.key} className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20">
                        <td className="px-3 py-2 font-sans font-medium text-stone-700 dark:text-stone-300">
                          {row.person}
                        </td>
                        <td className="px-3 py-2 text-blue-800 dark:text-blue-400 font-semibold">
                          {row.suf}
                        </td>
                        <td className="px-3 py-2 font-bold text-stone-900 dark:text-stone-100">
                          {row.form}
                        </td>
                        <td className="px-3 py-2 font-sans text-stone-600 dark:text-stone-400">
                          {row.spanish}
                        </td>
                        <td className="px-3 py-2 text-right font-sans">
                          <button
                            onClick={() => handleApply(row.form)}
                            className="px-2 py-0.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-[10px] font-semibold"
                          >
                            Usar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: REGLAS CLAVE (PLURAL, NEGACIÓN, CONDICIONAL) */}
        {/* ======================================================== */}
        {activeTab === 'rules' && (
          <div className="space-y-3.5">
            {/* Rule 1: Plural nominal */}
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                  Regla de Plural Nominal (-s vs -kuna)
                </span>
                <span className="text-[11px] text-stone-500 font-mono">
                  Vocal + -s · Consonante + -kuna
                </span>
              </div>
              <p className="text-xs text-stone-700 dark:text-stone-300">
                Si la palabra termina en vocal, se le añade <strong>-s</strong> (<em>wasis, allqus, tatas</em>). Si termina en consonante, se le agrega <strong>-kuna</strong> (<em>atojkuna, yawarkuna</em>).
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { qu: 'wasis', es: 'casas' },
                  { qu: 'allqus', es: 'perros' },
                  { qu: 'atojkuna', es: 'zorros' },
                  { qu: 'yawarkuna', es: 'sangres' },
                ].map((ex) => (
                  <button
                    key={ex.qu}
                    onClick={() => handleApply(ex.qu)}
                    className="px-2.5 py-1 bg-white dark:bg-stone-900 border border-amber-200 dark:border-amber-800 rounded text-xs font-mono font-semibold text-stone-800 dark:text-stone-200 hover:border-amber-500"
                  >
                    {ex.qu} <span className="text-[10px] text-stone-500 font-normal">({ex.es})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Rule 2: Negación Declarativa vs Imperativa */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 space-y-1.5">
                <span className="text-xs font-bold text-rose-900 dark:text-rose-200 uppercase tracking-wider block">
                  Negación Declarativa (mana ... -chu)
                </span>
                <p className="text-xs text-stone-700 dark:text-stone-300">
                  Para enunciados. En existencia usar <strong>kanchu</strong>. En estados temporales con kay usar <strong>-sha- + -chu</strong>.
                </p>
                <div className="space-y-1 pt-1 font-mono text-xs">
                  <button
                    onClick={() => handleApply('Mana qolqe kanchu')}
                    className="w-full text-left p-1.5 bg-white dark:bg-stone-900 rounded border border-rose-200 dark:border-rose-800 hover:border-rose-400"
                  >
                    <span className="font-bold text-rose-800 dark:text-rose-400">Mana qolqe kanchu.</span>
                    <span className="block text-[10px] font-sans text-stone-500">No hay dinero (inexistencia obligatoria).</span>
                  </button>
                  <button
                    onClick={() => handleApply('Mana kusisqachu kashani')}
                    className="w-full text-left p-1.5 bg-white dark:bg-stone-900 rounded border border-rose-200 dark:border-rose-800 hover:border-rose-400"
                  >
                    <span className="font-bold text-rose-800 dark:text-rose-400">Mana kusisqachu kashani.</span>
                    <span className="block text-[10px] font-sans text-stone-500">No estoy feliz (estado progresivo).</span>
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 space-y-1.5">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider block">
                  Negación Imperativa / Prohibición (ama ... -chu)
                </span>
                <p className="text-xs text-stone-700 dark:text-stone-300">
                  NUNCA uses mana para órdenes negativas o advertencias. Emplea exclusivamente <strong>ama + [verbo imperativo] + -chu</strong>.
                </p>
                <div className="space-y-1 pt-1 font-mono text-xs">
                  <button
                    onClick={() => handleApply('Ama waqaychu')}
                    className="w-full text-left p-1.5 bg-white dark:bg-stone-900 rounded border border-amber-200 dark:border-amber-800 hover:border-amber-400"
                  >
                    <span className="font-bold text-amber-800 dark:text-amber-400">Ama waqaychu.</span>
                    <span className="block text-[10px] font-sans text-stone-500">No llores (orden prohibitiva).</span>
                  </button>
                  <button
                    onClick={() => handleApply('Ama chayta ujyaychu')}
                    className="w-full text-left p-1.5 bg-white dark:bg-stone-900 rounded border border-amber-200 dark:border-amber-800 hover:border-amber-400"
                  >
                    <span className="font-bold text-amber-800 dark:text-amber-400">Ama chayta ujyaychu.</span>
                    <span className="block text-[10px] font-sans text-stone-500">No tomes/bebas eso (ujyay con j).</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Rule 3: Condicional ((Sichus) ... chayqa) */}
            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wider">
                  3. Oraciones Condicionales: (Sichus) ... chayqa
                </span>
                <span className="text-[11px] text-stone-500 font-mono">
                  sichus (opcional) + cláusula + chayqa (obligatorio)
                </span>
              </div>
              <p className="text-xs text-stone-700 dark:text-stone-300">
                Para expresar condición ("si..."), se coloca <strong>chayqa</strong> al final de la condición. La partícula inicial <em>sichus</em> es opcional.
              </p>
              <div className="space-y-1.5 font-mono text-xs">
                <button
                  onClick={() => handleApply('Jehová Diosta kasukunki chayqa, jamoj tiempopi ashkha bendicionesta japʼinki.')}
                  className="w-full text-left p-2 bg-white dark:bg-stone-900 rounded-lg border border-blue-200 dark:border-blue-800 hover:border-blue-400 transition-colors"
                >
                  <span className="font-bold text-blue-900 dark:text-blue-300">
                    Jehová Diosta kasukunki chayqa, jamoj tiempopi ashkha bendicionesta japʼinki.
                  </span>
                  <span className="block text-[11px] font-sans text-stone-600 dark:text-stone-400 mt-0.5">
                    "Si obedeces a Jehová, en el tiempo que viene recibirás muchas bendiciones."
                  </span>
                </button>
              </div>
            </div>

            {/* Rule 4: Integración de Castellanismos */}
            <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 dark:from-amber-950/30 dark:via-stone-900 dark:to-stone-900 space-y-3 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                    4. Integración de Castellanismos en la Gramática Quechua
                  </span>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 w-fit">
                  Préstamos hispanos + Infinitivo en -y + Sufijación completa
                </span>
              </div>

              <div className="text-xs text-stone-700 dark:text-stone-300 space-y-1.5 leading-relaxed">
                <p>
                  En el quechua de Cochabamba, los préstamos del español (castellanismos) se adaptan fonética y morfológicamente integrándose por completo al sistema de sufijos quechua.
                </p>
                <p className="text-[11px] text-stone-600 dark:text-stone-400">
                  <strong>Regla de prioridad:</strong> se deben utilizar los términos en quechua siempre que existan en el vocabulario estándar; sin embargo, si una palabra o verbo no tiene un equivalente directo o se opta por el castellanismo, este se somete a todas las reglas gramaticales y de conjugación correspondientes, como la terminación verbal en <strong>-y</strong> para los infinitivos de origen español (<em>estudiay</em>, <em>trabajay</em>, <em>necesitay</em>, <em>pensay</em>, <em>parlay</em>) antes de recibir otros sufijos.
                </p>
              </div>

              {/* Interactive test cases requested by user */}
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 block">
                  Ejemplos canónicos cochabambinos (clic para enviar al {contextMode === 'translator' ? 'Traductor' : 'Chat'}):
                </span>

                <div className="space-y-2">
                  {/* Case 1: Necesitanchej estudiay */}
                  <div className="p-2.5 bg-white dark:bg-stone-950 rounded-lg border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-amber-400 transition-colors">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-900 dark:text-amber-200">
                          Necesitanchej estudiay.
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded font-mono">
                          necesita-nchej estudia-y
                        </span>
                      </div>
                      <div className="text-xs text-stone-700 dark:text-stone-300">
                        "Necesitamos estudiar."
                      </div>
                      <div className="text-[10px] text-stone-500">
                        Préstamo verbal flexionado (1PL incl. -nchej) + infinitivo quechuizado en -y (estudia-y).
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                      <button
                        onClick={() => handleCopy('Necesitanchej estudiay.', 'cast-1')}
                        className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-500"
                        title="Copiar"
                      >
                        {copiedKey === 'cast-1' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleApply('Necesitanchej estudiay.')}
                        className="px-2 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded text-[10px] font-semibold flex items-center gap-1"
                      >
                        <span>Usar</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>

                  {/* Case 2: Sichus chayta ruwanchej chayqa, allin riwasunchej */}
                  <div className="p-2.5 bg-white dark:bg-stone-950 rounded-lg border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-amber-400 transition-colors">
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-900 dark:text-amber-200">
                          Sichus chayta ruwanchej chayqa, allin riwasunchej.
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded font-mono">
                          sichus chay-ta ruwa-nchej chay-qa allin ri-wa-sunchej
                        </span>
                      </div>
                      <div className="text-xs text-stone-700 dark:text-stone-300">
                        "Si hacemos eso, nos irá bien."
                      </div>
                      <div className="text-[10px] text-stone-500">
                        Estructura condicional sichus...chayqa con objeto directo (-ta) y futuro de beneficio objetivo (ri-wa-sunchej).
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                      <button
                        onClick={() => handleCopy('Sichus chayta ruwanchej chayqa, allin riwasunchej.', 'cast-2')}
                        className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-500"
                        title="Copiar"
                      >
                        {copiedKey === 'cast-2' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleApply('Sichus chayta ruwanchej chayqa, allin riwasunchej.')}
                        className="px-2 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded text-[10px] font-semibold flex items-center gap-1"
                      >
                        <span>Usar</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>

                  {/* Case 3: Trabajashani */}
                  <div className="p-2.5 bg-white dark:bg-stone-950 rounded-lg border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-amber-400 transition-colors">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-900 dark:text-amber-200">
                          Trabajashani.
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded font-mono">
                          trabaja-sha-ni
                        </span>
                      </div>
                      <div className="text-xs text-stone-700 dark:text-stone-300">
                        "Estoy trabajando."
                      </div>
                      <div className="text-[10px] text-stone-500">
                        Verbo prestado trabajar adaptado a raíz verbal con progresivo cochabambino (-sha-) y 1SG (-ni).
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                      <button
                        onClick={() => handleCopy('Trabajashani.', 'cast-3')}
                        className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-500"
                        title="Copiar"
                      >
                        {copiedKey === 'cast-3' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleApply('Trabajashani.')}
                        className="px-2 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded text-[10px] font-semibold flex items-center gap-1"
                      >
                        <span>Usar</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: CORPUS DE FRASES */}
        {/* ======================================================== */}
        {activeTab === 'corpus' && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                value={corpusSearch}
                onChange={(e) => setCorpusSearch(e.target.value)}
                placeholder="Buscar frase en quechua, español o etiqueta..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              {filteredPhrases.map((phrase) => (
                <div
                  key={phrase.id}
                  className="p-3 bg-stone-50 dark:bg-stone-950 rounded-lg border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-amber-400 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="font-mono text-xs font-bold text-stone-900 dark:text-stone-100">
                      {phrase.quechua}
                    </div>
                    <div className="text-xs text-stone-600 dark:text-stone-400">
                      {phrase.spanish}
                    </div>
                    {phrase.grammaticalNotes && (
                      <div className="text-[10px] text-amber-800 dark:text-amber-400 italic">
                        {phrase.grammaticalNotes}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                    <button
                      onClick={() => handleCopy(phrase.quechua, `ph-${phrase.id}`)}
                      className="p-1 hover:bg-stone-200 dark:hover:bg-stone-800 rounded text-stone-500"
                      title="Copiar texto quechua"
                    >
                      {copiedKey === `ph-${phrase.id}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleApply(phrase.quechua)}
                      className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded text-xs font-semibold"
                    >
                      Usar en {contextMode === 'translator' ? 'Traductor' : 'Chat'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: GLOSARIO DE RAÍCES */}
        {/* ======================================================== */}
        {activeTab === 'roots' && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                value={rootSearch}
                onChange={(e) => setRootSearch(e.target.value)}
                placeholder="Buscar raíz en quechua o español..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {filteredRoots.map((root) => (
                <div
                  key={root.id}
                  className="p-2.5 bg-stone-50 dark:bg-stone-950 rounded-lg border border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-amber-800 dark:text-amber-400 truncate">
                        {root.quechua}
                      </span>
                      <span className="text-[9px] px-1 py-0.2 bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded uppercase">
                        {root.category}
                      </span>
                    </div>
                    <div className="text-xs text-stone-700 dark:text-stone-300 truncate">
                      {root.spanish}
                    </div>
                  </div>

                  <button
                    onClick={() => handleApply(root.quechua)}
                    className="px-2 py-1 bg-stone-200 hover:bg-amber-700 hover:text-white dark:bg-stone-800 rounded text-[10px] font-semibold text-stone-800 dark:text-stone-200 shrink-0 transition-colors"
                  >
                    Usar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
