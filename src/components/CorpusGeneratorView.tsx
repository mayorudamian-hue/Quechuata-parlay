import React, { useState, useMemo } from 'react';
import { useQuechua } from '../context/QuechuaContext';
import { 
  generateCorpusBatch, 
  generateCorpusSentence, 
  convertSentenceToCorpusPhrase,
  PATTERN_LABELS, 
  DOMAIN_LABELS,
  SentencePattern, 
  DailyDomain, 
  GeneratedSentence,
  inflectNoun,
  inflectVerb,
  NounInflectionOptions,
  VerbInflectionOptions
} from '../utils/corpusEngine';
import { LexicalRoot } from '../types/quechua';
import { LESSON_4_PHRASES, LESSON_4_GRAMMAR_RULE } from '../data/lesson4Corpus';
import { 
  Sparkles, 
  Wand2, 
  Plus, 
  Check, 
  Copy, 
  ArrowRight, 
  Languages, 
  MessageSquare, 
  Download, 
  Layers, 
  Search, 
  Sliders, 
  BookOpen, 
  RefreshCw,
  FileCheck2,
  CheckCircle2,
  Info,
  ChevronRight,
  BookMarked
} from 'lucide-react';

export const CorpusGeneratorView: React.FC = () => {
  const { 
    roots, 
    addPhrase, 
    sendToTranslator, 
    sendToChat 
  } = useQuechua();

  // Mode: 'batch' | 'builder' | 'coverage' | 'lesson4'
  const [activeSubTab, setActiveSubTab] = useState<'batch' | 'builder' | 'coverage' | 'lesson4'>('batch');
  const [lesson4Search, setLesson4Search] = useState('');
  const [lesson4Category, setLesson4Category] = useState<string>('all');

  // Batch Generation State
  const [selectedPattern, setSelectedPattern] = useState<SentencePattern>('all');
  const [selectedDomain, setSelectedDomain] = useState<DailyDomain>('all');
  const [batchCount, setBatchCount] = useState<number>(10);
  const [generatedList, setGeneratedList] = useState<GeneratedSentence[]>(() => {
    return generateCorpusBatch(roots, 10, 'all', 'all');
  });
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Trigger Notification Toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Generate Batch
  const handleGenerateBatch = () => {
    const list = generateCorpusBatch(roots, batchCount, selectedPattern, selectedDomain);
    setGeneratedList(list);
    showToast(`Generadas ${list.length} oraciones cotidianas con las 886 raíces.`);
  };

  // Save single sentence to Corpus
  const handleSaveToCorpus = (sentence: GeneratedSentence) => {
    const phrasePayload = convertSentenceToCorpusPhrase(sentence);
    addPhrase(phrasePayload);
    setSavedIds((prev) => ({ ...prev, [sentence.id]: true }));
    showToast('Oración guardada en el Corpus oficial.');
  };

  // Save all current batch to Corpus
  const handleSaveAllBatch = () => {
    let count = 0;
    generatedList.forEach((s) => {
      if (!savedIds[s.id]) {
        addPhrase(convertSentenceToCorpusPhrase(s));
        count++;
      }
    });
    const newSaved: Record<string, boolean> = { ...savedIds };
    generatedList.forEach((s) => (newSaved[s.id] = true));
    setSavedIds(newSaved);
    showToast(`${count} oraciones añadidas al Corpus de Qhawana.`);
  };

  // Copy sentence to clipboard
  const handleCopy = (s: GeneratedSentence) => {
    const text = `${s.quechua}\n${s.spanish}\nGlosa: ${s.gloss}\nSegmentación: ${s.morphologicalBreakdown}`;
    navigator.clipboard.writeText(text);
    setCopiedId(s.id);
    setTimeout(() => setCopiedId(null), 2500);
    showToast('Copiado al portapapeles.');
  };

  // Export batch as TSV for Anki flashcards
  const handleExportAnkiTSV = () => {
    if (!generatedList.length) return;
    const header = 'Quechua\tEspañol\tSegmentacion\tGlosa\tNotasGramaticales\tPatron\tDominio\n';
    const rows = generatedList
      .map(
        (s) =>
          `"${s.quechua}"\t"${s.spanish}"\t"${s.morphologicalBreakdown}"\t"${s.gloss}"\t"${s.grammaticalNotes}"\t"${s.patternLabel}"\t"${s.domainLabel}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/tab-separated-values;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qhawana_corpus_cotidiano_${new Date().toISOString().slice(0, 10)}.tsv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Archivo TSV descargado para importar en Anki.');
  };

  // Interactive Builder State
  const nounRoots = useMemo(() => roots.filter((r) => r.category === 'sustantivo'), [roots]);
  const verbRoots = useMemo(() => roots.filter((r) => r.category === 'verbo'), [roots]);
  const [builderSubjectNoun, setBuilderSubjectNoun] = useState<string>('tata');
  const [builderObjectNoun, setBuilderObjectNoun] = useState<string>('t\'anta');
  const [builderVerb, setBuilderVerb] = useState<string>('rantiy');
  const [builderVerbTense, setBuilderVerbTense] = useState<VerbInflectionOptions['tense']>('progresivo');
  const [builderVerbPerson, setBuilderVerbPerson] = useState<VerbInflectionOptions['person']>('1SG');
  const [builderNounPlural, setBuilderNounPlural] = useState<boolean>(false);
  const [builderNounPossessive, setBuilderNounPossessive] = useState<NounInflectionOptions['possessive']>('1SG');
  const [builderObjCase, setBuilderObjCase] = useState<NounInflectionOptions['caseSuffix']>('ACC');
  const [builderObjPlural, setBuilderObjPlural] = useState<boolean>(false);

  // Filter root search in coverage tab
  const [coverageSearch, setCoverageSearch] = useState('');
  const [coverageCategory, setCoverageCategory] = useState<string>('all');

  const filteredCoverageRoots = useMemo(() => {
    return roots.filter((r) => {
      const matchCat = coverageCategory === 'all' || r.category === coverageCategory;
      const matchSearch =
        !coverageSearch ||
        r.quechua.toLowerCase().includes(coverageSearch.toLowerCase()) ||
        r.spanish.toLowerCase().includes(coverageSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [roots, coverageCategory, coverageSearch]);

  const filteredLesson4Phrases = useMemo(() => {
    return LESSON_4_PHRASES.filter((p) => {
      const matchCat =
        lesson4Category === 'all' ||
        (lesson4Category === 'pregunta' && p.tags.includes('pregunta')) ||
        (lesson4Category === 'movimiento' &&
          (p.tags.includes('riy') ||
            p.tags.includes('jamuy') ||
            p.tags.includes('chayamuy') ||
            p.tags.includes('chayay') ||
            p.tags.includes('puriy'))) ||
        (lesson4Category === 'direccionales' && (p.tags.includes('-man') || p.tags.includes('-manta'))) ||
        (lesson4Category === 'negacion' && (p.tags.includes('negación') || p.tags.includes('mana'))) ||
        (lesson4Category === 'sin_copula' && p.tags.includes('sin cópula'));

      const term = lesson4Search.toLowerCase().trim();
      const matchSearch =
        !term ||
        p.quechua.toLowerCase().includes(term) ||
        p.spanish.toLowerCase().includes(term) ||
        p.morphologicalBreakdown.toLowerCase().includes(term) ||
        p.gloss.toLowerCase().includes(term) ||
        p.grammaticalNotes.toLowerCase().includes(term);

      return matchCat && matchSearch;
    });
  }, [lesson4Category, lesson4Search]);

  const handleExportLesson4Anki = () => {
    const header = 'Quechua\tEspañol\tSegmentacion\tGlosa\tNotasGramaticales\tTags\n';
    const rows = LESSON_4_PHRASES.map(
      (s) =>
        `"${s.quechua}"\t"${s.spanish}"\t"${s.morphologicalBreakdown}"\t"${s.gloss}"\t"${s.grammaticalNotes}"\t"${s.tags.join(', ')}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/tab-separated-values;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qhawana_corpus_leccion4_${new Date().toISOString().slice(0, 10)}.tsv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('28 fichas de la Lección 4 exportadas para Anki.');
  };

  // Real-time calculation for Interactive Builder
  const builtSentence = useMemo(() => {
    const subjRootObj = roots.find((r) => r.quechua.toLowerCase() === builderSubjectNoun.toLowerCase()) || {
      quechua: builderSubjectNoun,
      spanish: builderSubjectNoun,
    };
    const objRootObj = roots.find((r) => r.quechua.toLowerCase() === builderObjectNoun.toLowerCase()) || {
      quechua: builderObjectNoun,
      spanish: builderObjectNoun,
    };
    const verbRootObj = roots.find((r) => r.quechua.toLowerCase() === builderVerb.toLowerCase()) || {
      quechua: builderVerb,
      spanish: builderVerb,
    };

    const subj = inflectNoun(subjRootObj.quechua, subjRootObj.spanish, {
      plural: builderNounPlural,
      possessive: builderNounPossessive,
      clitic: 'TOP',
    });

    const obj = inflectNoun(objRootObj.quechua, objRootObj.spanish, {
      plural: builderObjPlural,
      caseSuffix: builderObjCase,
    });

    const v = inflectVerb(verbRootObj.quechua, verbRootObj.spanish, {
      tense: builderVerbTense,
      person: builderVerbPerson,
    });

    const surface = `${subj.surface} ${obj.surface} ${v.surface}.`;
    const breakdown = `${subj.breakdown} ${obj.breakdown} ${v.breakdown}`;
    const gloss = `${subj.gloss} ${obj.gloss} ${v.gloss}`;

    return {
      surface,
      breakdown,
      gloss,
      subjRootObj,
      objRootObj,
      verbRootObj,
    };
  }, [
    roots,
    builderSubjectNoun,
    builderObjectNoun,
    builderVerb,
    builderVerbTense,
    builderVerbPerson,
    builderNounPlural,
    builderNounPossessive,
    builderObjCase,
    builderObjPlural,
  ]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900 px-4 py-2.5 rounded-lg shadow-xl text-xs font-medium flex items-center gap-2 border border-stone-700 dark:border-stone-300 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 rounded-full">
                Motor Morfológico Combinatorio
              </span>
              <span className="px-2.5 py-0.5 text-xs font-medium bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 rounded-full">
                {roots.length} Raíces Léxicas Activas
              </span>
              <span className="px-2.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 rounded-full">
                Quechua Cochabambino (RM 1032/84)
              </span>
            </div>
            <h1 className="text-2xl font-display font-extrabold text-stone-900 dark:text-stone-50 tracking-tight">
              Generador de Corpus Cotidiano
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-400 max-w-3xl">
              Genera oraciones contextualizadas de la vida diaria utilizando las 886 raíces léxicas del banco, 
              aplicando reglas morfofonémicas de Cochabamba: aspecto progresivo <code className="font-mono text-amber-700 dark:text-amber-400 font-semibold">-sha-</code> (nunca <em>-chka-</em>), 
              cópula cero, futuro inclusivo <code className="font-mono text-amber-700 dark:text-amber-400 font-semibold">-sunchij</code>, 
              inserción eufónica de <code className="font-mono text-amber-700 dark:text-amber-400 font-semibold">-ni-</code> y castellanismos flexionados en <code className="font-mono text-amber-700 dark:text-amber-400 font-semibold">-y</code>.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveSubTab('batch')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeSubTab === 'batch'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Generador por Lotes</span>
            </button>
            <button
              onClick={() => setActiveSubTab('builder')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeSubTab === 'builder'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Constructor Interactivo</span>
            </button>
            <button
              onClick={() => setActiveSubTab('lesson4')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeSubTab === 'lesson4'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/60'
              }`}
            >
              <BookMarked className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Lección 4 (28 Fichas)</span>
            </button>
            <button
              onClick={() => setActiveSubTab('coverage')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeSubTab === 'coverage'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Cobertura Léxica ({roots.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* SUBTAB 1: GENERADOR POR LOTES */}
      {activeSubTab === 'batch' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Pattern Selector */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Patrón Gramatical
                </label>
                <select
                  value={selectedPattern}
                  onChange={(e) => setSelectedPattern(e.target.value as SentencePattern)}
                  className="w-full text-xs font-medium bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-lg px-3 py-2 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {Object.entries(PATTERN_LABELS).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val.name} ({val.marker})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                  {PATTERN_LABELS[selectedPattern]?.desc}
                </p>
              </div>

              {/* Domain Selector */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Dominio Cotidiano
                </label>
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value as DailyDomain)}
                  className="w-full text-xs font-medium bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-lg px-3 py-2 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {Object.entries(DOMAIN_LABELS).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                  {DOMAIN_LABELS[selectedDomain]?.desc}
                </p>
              </div>

              {/* Batch Size Selector */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Cantidad de Oraciones
                </label>
                <div className="flex items-center gap-1.5">
                  {[5, 10, 20].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setBatchCount(num)}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                        batchCount === num
                          ? 'bg-amber-600 border-amber-600 text-white'
                          : 'bg-stone-50 dark:bg-stone-800/80 border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                  Combinatoria aleatoria representativa
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col justify-end gap-2">
                <button
                  type="button"
                  onClick={handleGenerateBatch}
                  className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Regenerar Lote</span>
                </button>
              </div>
            </div>

            {/* Quick Batch Bar */}
            <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-stone-600 dark:text-stone-400 flex items-center gap-2">
                <span className="font-semibold text-stone-900 dark:text-stone-100">{generatedList.length}</span> oraciones generadas actualmente
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveAllBatch}
                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Guardar Todo en el Corpus</span>
                </button>

                <button
                  onClick={handleExportAnkiTSV}
                  className="px-3 py-1.5 text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar TSV (Anki)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Cards List */}
          <div className="space-y-4">
            {generatedList.map((item, index) => {
              const isSaved = savedIds[item.id];
              const isCopied = copiedId === item.id;

              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 shadow-xs transition-all hover:border-amber-300 dark:hover:border-amber-700/60"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Left: Content */}
                    <div className="space-y-3 flex-1">
                      {/* Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-bold">
                          #{index + 1}
                        </span>
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                          {item.patternLabel}
                        </span>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                          {item.domainLabel}
                        </span>
                      </div>

                      {/* Main Sentence & Translation */}
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold text-stone-900 dark:text-stone-50 tracking-wide font-sans">
                          {item.quechua}
                        </h3>
                        <p className="text-sm font-medium text-stone-600 dark:text-stone-300 italic">
                          "{item.spanish}"
                        </p>
                      </div>

                      {/* Morphological Breakdown Chips */}
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                          <span>Segmentación Morfológica y Glosa de Leipzig</span>
                        </div>
                        
                        <div className="bg-stone-50 dark:bg-stone-800/60 rounded-lg p-3 border border-stone-200 dark:border-stone-800/80 space-y-1.5 font-mono text-xs">
                          <div className="flex items-center gap-2 flex-wrap text-stone-800 dark:text-stone-200">
                            <span className="text-[10px] text-stone-400 uppercase tracking-widest font-sans">Morfemas:</span>
                            {item.morphologicalBreakdown.split(' ').map((wordToken, wIdx) => (
                              <span
                                key={wIdx}
                                className="inline-flex items-center px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs font-semibold"
                              >
                                {wordToken}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center gap-2 flex-wrap text-stone-600 dark:text-stone-400 text-[11px]">
                            <span className="text-[10px] text-stone-400 uppercase tracking-widest font-sans">Glosa:</span>
                            <span>{item.gloss}</span>
                          </div>
                        </div>
                      </div>

                      {/* Grammatical and Dialect Note */}
                      <div className="flex items-start gap-2 text-xs text-stone-600 dark:text-stone-300 bg-amber-50/50 dark:bg-stone-850 p-2.5 rounded-lg border border-amber-100 dark:border-stone-800">
                        <Info className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{item.grammaticalNotes}</span>
                      </div>

                      {/* Used Roots Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
                        <span className="text-stone-500 text-[11px]">Raíces utilizadas:</span>
                        {item.usedRoots.map((r, rIdx) => (
                          <span
                            key={rIdx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded text-[11px] font-medium"
                          >
                            <span className="font-semibold text-amber-700 dark:text-amber-400">{r.quechua}</span>
                            <span className="text-stone-400">({r.spanish})</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex lg:flex-col items-center justify-end gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-stone-100 dark:border-stone-800">
                      <button
                        onClick={() => handleSaveToCorpus(item)}
                        disabled={isSaved}
                        className={`w-full sm:w-auto px-3.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                          isSaved
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 cursor-default'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                        }`}
                      >
                        {isSaved ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        <span>{isSaved ? 'En el Corpus' : 'Añadir al Corpus'}</span>
                      </button>

                      <button
                        onClick={() => sendToTranslator(item.quechua, 'qu-es')}
                        className="w-full sm:w-auto px-3 py-2 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800/80 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Languages className="w-3.5 h-3.5" />
                        <span>Probar en Traductor</span>
                      </button>

                      <button
                        onClick={() => sendToChat(item.quechua)}
                        className="w-full sm:w-auto px-3 py-2 text-xs font-semibold rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800/80 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Practicar en Chat</span>
                      </button>

                      <button
                        onClick={() => handleCopy(item)}
                        className="w-full sm:w-auto px-3 py-2 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors flex items-center justify-center gap-1.5"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 2: CONSTRUCTOR INTERACTIVO */}
      {activeSubTab === 'builder' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-600" />
                <span>Constructor Morfológico Dinámico (Orden SOV)</span>
              </h2>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                Selecciona cualquier raíz del banco lingüístico de 886 palabras y aplica flexiones nominales y verbales para ver la síntesis en tiempo real.
              </p>
            </div>

            {/* Live Result Banner */}
            <div className="bg-stone-50 dark:bg-stone-800/80 border-2 border-dashed border-amber-300 dark:border-amber-700/60 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                  Oración Sintetizada en Vivo:
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-mono">
                  Sujeto - Objeto - Verbo (SOV)
                </span>
              </div>

              <div className="text-xl font-bold font-sans text-stone-900 dark:text-stone-50">
                {builtSentence.surface}
              </div>

              <div className="space-y-1 font-mono text-xs">
                <div className="text-stone-700 dark:text-stone-300">
                  <span className="text-[10px] text-stone-400 font-sans mr-2 uppercase">Segmentación:</span>
                  <span className="font-semibold text-amber-700 dark:text-amber-400">{builtSentence.breakdown}</span>
                </div>
                <div className="text-stone-500 dark:text-stone-400 text-[11px]">
                  <span className="text-[10px] text-stone-400 font-sans mr-2 uppercase">Glosa:</span>
                  <span>{builtSentence.gloss}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    addPhrase({
                      quechua: builtSentence.surface,
                      spanish: `(Construcción personalizada: ${builtSentence.subjRootObj.spanish} + ${builtSentence.objRootObj.spanish} + ${builtSentence.verbRootObj.spanish})`,
                      morphologicalBreakdown: builtSentence.breakdown,
                      gloss: builtSentence.gloss,
                      grammaticalNotes: 'Oración ensamblada interactivamente con el motor de morfología aglutinante.',
                      tags: ['personalizado', 'constructor'],
                      verified: true,
                    });
                    showToast('Oración personalizada guardada en el Corpus.');
                  }}
                  className="px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Guardar en el Corpus</span>
                </button>

                <button
                  onClick={() => sendToTranslator(builtSentence.surface, 'qu-es')}
                  className="px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Languages className="w-3.5 h-3.5" />
                  <span>Analizar en Traductor & Glosa</span>
                </button>
              </div>
            </div>

            {/* 3 Columns: Subject, Object, Verb */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {/* Column 1: Sujeto (Sustantivo 1) */}
              <div className="p-4 bg-stone-50/70 dark:bg-stone-850 rounded-xl border border-stone-200 dark:border-stone-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200">
                  1. Sujeto (Sustantivo + Tópico)
                </h3>

                <div>
                  <label className="block text-[11px] font-medium text-stone-500 mb-1">
                    Raíz Nominal
                  </label>
                  <select
                    value={builderSubjectNoun}
                    onChange={(e) => setBuilderSubjectNoun(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
                  >
                    {nounRoots.map((n) => (
                      <option key={n.id} value={n.quechua}>
                        {n.quechua} ({n.spanish})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs text-stone-700 dark:text-stone-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={builderNounPlural}
                      onChange={(e) => setBuilderNounPlural(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>Plural (-s / -kuna)</span>
                  </label>

                  <div>
                    <label className="block text-[11px] font-medium text-stone-500 mb-1">
                      Posesivo (con -ni- eufónico si termina en consonante)
                    </label>
                    <select
                      value={builderNounPossessive}
                      onChange={(e) => setBuilderNounPossessive(e.target.value as NounInflectionOptions['possessive'])}
                      className="w-full text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
                    >
                      <option value="1SG">1SG (-y) Mi</option>
                      <option value="2SG">2SG (-yki) Tu</option>
                      <option value="3SG">3SG (-n) Su</option>
                      <option value="1PL.INCL">1PL.INCL (-nchij) Nuestro (incl.)</option>
                      <option value="1PL.EXCL">1PL.EXCL (-yku) Nuestro (excl.)</option>
                      <option value="2PL">2PL (-ykichij) Vuestro</option>
                      <option value="3PL">3PL (-nku) Su (de ellos)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Column 2: Objeto (Sustantivo 2 + Caso) */}
              <div className="p-4 bg-stone-50/70 dark:bg-stone-850 rounded-xl border border-stone-200 dark:border-stone-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200">
                  2. Complemento / Objeto
                </h3>

                <div>
                  <label className="block text-[11px] font-medium text-stone-500 mb-1">
                    Raíz Nominal del Objeto
                  </label>
                  <select
                    value={builderObjectNoun}
                    onChange={(e) => setBuilderObjectNoun(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
                  >
                    {nounRoots.map((n) => (
                      <option key={n.id} value={n.quechua}>
                        {n.quechua} ({n.spanish})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs text-stone-700 dark:text-stone-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={builderObjPlural}
                      onChange={(e) => setBuilderObjPlural(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>Plural (-s / -kuna)</span>
                  </label>

                  <div>
                    <label className="block text-[11px] font-medium text-stone-500 mb-1">
                      Sufijo de Caso
                    </label>
                    <select
                      value={builderObjCase}
                      onChange={(e) => setBuilderObjCase(e.target.value as NounInflectionOptions['caseSuffix'])}
                      className="w-full text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
                    >
                      <option value="ACC">Acusativo (-ta) [objeto directo]</option>
                      <option value="LOC">Locativo (-pi) [en]</option>
                      <option value="ALL">Ilativo / Alativo (-man) [hacia / a]</option>
                      <option value="ABL">Ablativo (-manta) [desde / de]</option>
                      <option value="COM">Comitativo (-wan) [con]</option>
                      <option value="GEN">Genitivo (-pa) [de / posesión]</option>
                      <option value="CAUS">Causal (-rayku) [por causa de]</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Column 3: Verbo Flexionado */}
              <div className="p-4 bg-stone-50/70 dark:bg-stone-850 rounded-xl border border-stone-200 dark:border-stone-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200">
                  3. Verbo y Flexión Verbal
                </h3>

                <div>
                  <label className="block text-[11px] font-medium text-stone-500 mb-1">
                    Raíz Verbal
                  </label>
                  <select
                    value={builderVerb}
                    onChange={(e) => setBuilderVerb(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
                  >
                    {verbRoots.map((v) => (
                      <option key={v.id} value={v.quechua}>
                        {v.quechua} ({v.spanish})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-stone-500 mb-1">
                    Tiempo y Aspecto
                  </label>
                  <select
                    value={builderVerbTense}
                    onChange={(e) => setBuilderVerbTense(e.target.value as VerbInflectionOptions['tense'])}
                    className="w-full text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
                  >
                    <option value="progresivo">Progresivo (-sha-) [Cochabamba]</option>
                    <option value="presente">Presente Simple</option>
                    <option value="pasado_exp">Pasado Testimonial (-rqa-)</option>
                    <option value="pasado_narr">Pasado Narrativo (-sqa-)</option>
                    <option value="futuro">Futuro (-saq / -sunchij)</option>
                    <option value="potencial">Modo Potencial (-man)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-stone-500 mb-1">
                    Persona Sujeto
                  </label>
                  <select
                    value={builderVerbPerson}
                    onChange={(e) => setBuilderVerbPerson(e.target.value as VerbInflectionOptions['person'])}
                    className="w-full text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg p-2 text-stone-900 dark:text-stone-100"
                  >
                    <option value="1SG">1SG (Ñuqa -ni)</option>
                    <option value="2SG">2SG (Qam -nki)</option>
                    <option value="3SG">3SG (Pay -n)</option>
                    <option value="1PL.INCL">1PL.INCL (Ñuqanchij -nchij / -sunchij)</option>
                    <option value="1PL.EXCL">1PL.EXCL (Ñuqayku -yku / -sajku)</option>
                    <option value="2PL">2PL (Qamkuna -nkichij)</option>
                    <option value="3PL">3PL (Paykuna -nku)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: COBERTURA LÉXICA */}
      {activeSubTab === 'coverage' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-600" />
                  <span>Catálogo de las {roots.length} Raíces Disponibles</span>
                </h2>
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                  Cada una de estas raíces está conectada al generador morfológico, al traductor y al chat.
                </p>
              </div>

              {/* Stats badges */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="px-2.5 py-1 bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 rounded font-medium">
                  {roots.filter((r) => r.category === 'verbo').length} Verbos
                </span>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 rounded font-medium">
                  {roots.filter((r) => r.category === 'sustantivo').length} Sustantivos
                </span>
                <span className="px-2.5 py-1 bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 rounded font-medium">
                  {roots.filter((r) => r.category === 'adjetivo').length} Adjetivos
                </span>
                <span className="px-2.5 py-1 bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 rounded font-medium">
                  {roots.filter((r) => !['verbo', 'sustantivo', 'adjetivo'].includes(r.category)).length} Otros
                </span>
              </div>
            </div>

            {/* Filter and search bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={coverageSearch}
                  onChange={(e) => setCoverageSearch(e.target.value)}
                  placeholder="Buscar raíz en quechua o español..."
                  className="w-full text-xs pl-9 pr-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={coverageCategory}
                  onChange={(e) => setCoverageCategory(e.target.value)}
                  className="text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg px-3 py-2 text-stone-900 dark:text-stone-100"
                >
                  <option value="all">Todas las Categorías</option>
                  <option value="verbo">Verbos</option>
                  <option value="sustantivo">Sustantivos</option>
                  <option value="adjetivo">Adjetivos</option>
                  <option value="adverbio">Adverbios</option>
                  <option value="pronombre">Pronombres</option>
                  <option value="particula">Partículas</option>
                </select>

                <button
                  onClick={() => {
                    setCoverageSearch('');
                    setCoverageCategory('all');
                  }}
                  className="px-3 py-2 text-xs bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg"
                >
                  Limpiar
                </button>
              </div>
            </div>

            {/* Grid of Roots */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredCoverageRoots.slice(0, 120).map((r) => (
                <div
                  key={r.id}
                  className="p-3 bg-stone-50 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-800 rounded-lg text-xs space-y-1 hover:border-amber-400 dark:hover:border-amber-600 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900 dark:text-stone-50 font-sans text-sm">
                      {r.quechua}
                    </span>
                    <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
                      {r.category}
                    </span>
                  </div>
                  <p className="text-stone-600 dark:text-stone-300 text-[11px] truncate" title={r.spanish}>
                    {r.spanish}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-stone-400">
                      Frecuencia: {r.frequency || 10}
                    </span>
                    <button
                      onClick={() => {
                        sendToTranslator(r.quechua, 'qu-es');
                      }}
                      className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-0.5"
                    >
                      <span>Traductor</span>
                      <ChevronRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredCoverageRoots.length > 120 && (
              <p className="text-xs text-center text-stone-500 pt-2">
                Mostrando 120 de {filteredCoverageRoots.length} raíces coincidentes. Usa la barra de búsqueda para filtrar más.
              </p>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 4: LECCIÓN 4 (28 FICHAS DEL MANUAL DE QUECHUA COCHABAMBINO) */}
      {activeSubTab === 'lesson4' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 shadow-xs space-y-5">
            {/* Header & Rule Summary */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 rounded-full">
                    Corpus Normativo Oficial
                  </span>
                  <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-900 dark:bg-blue-950/70 dark:text-blue-300 rounded-full">
                    28 Fichas Integradas
                  </span>
                  <span className="px-2.5 py-0.5 text-xs font-medium bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 rounded-full">
                    Manual de Quechua Cochabambino
                  </span>
                </div>
                <h2 className="text-xl font-display font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                  Lección 4: Presente Singular, Sufijos <code className="text-amber-700 dark:text-amber-400 font-mono">-man</code> / <code className="text-amber-700 dark:text-amber-400 font-mono">-manta</code> y Orden de Palabras
                </h2>
                <p className="text-xs text-stone-600 dark:text-stone-400 max-w-4xl leading-relaxed">
                  {LESSON_4_GRAMMAR_RULE.description} En el diálogo cotidiano cochabambino el presente singular (<code className="font-mono text-amber-700 dark:text-amber-400">-ni</code>, <code className="font-mono text-amber-700 dark:text-amber-400">-nki</code>, <code className="font-mono text-amber-700 dark:text-amber-400">-n</code>) cubre también el pasado inmediato de relevancia directa.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleExportLesson4Anki}
                  className="px-3.5 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar 28 Fichas (Anki TSV)</span>
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={lesson4Search}
                  onChange={(e) => setLesson4Search(e.target.value)}
                  placeholder="Buscar en quechua, español, glosa o notas gramaticales..."
                  className="w-full text-xs pl-9 pr-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                <select
                  value={lesson4Category}
                  onChange={(e) => setLesson4Category(e.target.value)}
                  className="text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg px-3 py-2 text-stone-900 dark:text-stone-100 font-medium"
                >
                  <option value="all">Todas las 28 Fichas</option>
                  <option value="pregunta">Preguntas (may, mayk'aj, -chu)</option>
                  <option value="movimiento">Verbos de Movimiento (riy, jamuy, chayamuy, puriy)</option>
                  <option value="direccionales">Direccionales (-man / -manta)</option>
                  <option value="negacion">Negación (mana... -chu)</option>
                  <option value="sin_copula">Sin cópula (oraciones nominales)</option>
                </select>

                <button
                  onClick={() => {
                    setLesson4Search('');
                    setLesson4Category('all');
                  }}
                  className="px-3 py-2 text-xs bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg"
                >
                  Restablecer
                </button>
              </div>
            </div>

            {/* Fichas Count */}
            <div className="text-xs text-stone-500 flex items-center justify-between">
              <span>Mostrando {filteredLesson4Phrases.length} de 28 fichas del corpus cotidiano</span>
            </div>
          </div>

          {/* Cards List */}
          <div className="space-y-4">
            {filteredLesson4Phrases.map((phrase, idx) => {
              const isCopied = copiedId === phrase.id;

              return (
                <div
                  key={phrase.id}
                  className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 shadow-xs transition-all hover:border-amber-300 dark:hover:border-amber-700/60"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Content */}
                    <div className="space-y-3 flex-1">
                      {/* Header tags */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 font-bold">
                          Ficha {phrase.id.replace('phrase-l4-', '')}
                        </span>
                        {phrase.tags.slice(0, 4).map((t, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300"
                          >
                            {t}
                          </span>
                        ))}
                      </div>

                      {/* Main Sentence & Translation */}
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold text-stone-900 dark:text-stone-50 tracking-wide font-sans">
                          {phrase.quechua}
                        </h3>
                        <p className="text-sm font-medium text-stone-600 dark:text-stone-300 italic">
                          "{phrase.spanish}"
                        </p>
                      </div>

                      {/* Morphological Breakdown Chips */}
                      <div className="bg-stone-50 dark:bg-stone-800/60 rounded-lg p-3 border border-stone-200 dark:border-stone-800/80 space-y-1.5 font-mono text-xs">
                        <div className="flex items-center gap-2 flex-wrap text-stone-800 dark:text-stone-200">
                          <span className="text-[10px] text-stone-400 uppercase tracking-widest font-sans">Morfemas:</span>
                          {phrase.morphologicalBreakdown.split(' ').map((wordToken, wIdx) => (
                            <span
                              key={wIdx}
                              className="inline-flex items-center px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs font-semibold"
                            >
                              {wordToken}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap text-stone-600 dark:text-stone-400 text-[11px]">
                          <span className="text-[10px] text-stone-400 uppercase tracking-widest font-sans">Glosa:</span>
                          <span>{phrase.gloss}</span>
                        </div>
                      </div>

                      {/* Grammatical Note */}
                      <div className="flex items-start gap-2 text-xs text-stone-600 dark:text-stone-300 bg-amber-50/50 dark:bg-stone-850 p-2.5 rounded-lg border border-amber-100 dark:border-stone-800">
                        <Info className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{phrase.grammaticalNotes}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex lg:flex-col items-center justify-end gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-stone-100 dark:border-stone-800">
                      <button
                        onClick={() => sendToTranslator(phrase.quechua, 'qu-es')}
                        className="w-full sm:w-auto px-3 py-2 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800/80 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Languages className="w-3.5 h-3.5" />
                        <span>Probar en Traductor</span>
                      </button>

                      <button
                        onClick={() => sendToChat(phrase.quechua)}
                        className="w-full sm:w-auto px-3 py-2 text-xs font-semibold rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800/80 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Practicar en Chat</span>
                      </button>

                      <button
                        onClick={() => {
                          const text = `${phrase.quechua}\n${phrase.spanish}\nGlosa: ${phrase.gloss}\nSegmentación: ${phrase.morphologicalBreakdown}`;
                          navigator.clipboard.writeText(text);
                          setCopiedId(phrase.id);
                          setTimeout(() => setCopiedId(null), 2500);
                          showToast('Copiado al portapapeles.');
                        }}
                        className="w-full sm:w-auto px-3 py-2 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors flex items-center justify-center gap-1.5"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
