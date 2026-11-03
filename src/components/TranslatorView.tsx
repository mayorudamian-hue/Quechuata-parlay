import React, { useState } from 'react';
import { useQuechua } from '../context/QuechuaContext';
import { TranslationResult, MorphToken } from '../types/quechua';
import { parseMorphologicalBreakdown, analyzeWordWithKnownDatabase } from '../utils/morphology';
import { 
  ArrowRightLeft, 
  Sparkles, 
  AlertTriangle, 
  Plus, 
  Check, 
  HelpCircle, 
  Info,
  Loader2,
  BookOpen,
  Pencil,
  CheckCircle2,
  Edit3
} from 'lucide-react';

export const TranslatorView: React.FC = () => {
  const { roots, suffixes, phrases, grammarRules, addDoubt, addPhrase, setActiveTab } = useQuechua();

  const [direction, setDirection] = useState<'qu-es' | 'es-qu'>('es-qu');
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [addedDoubtsMap, setAddedDoubtsMap] = useState<Record<string, boolean>>({});
  const [addedToCorpus, setAddedToCorpus] = useState(false);
  const [isManualInputOpen, setIsManualInputOpen] = useState(false);

  // Manual Input Form State
  const [manualSource, setManualSource] = useState('');
  const [manualTranslation, setManualTranslation] = useState('');
  const [manualMorph, setManualMorph] = useState('');
  const [manualGloss, setManualGloss] = useState('');
  const [manualNotes, setManualNotes] = useState('');

  // In-place editing of current result
  const [isEditingResult, setIsEditingResult] = useState(false);
  const [editedTranslatedText, setEditedTranslatedText] = useState('');
  const [editedExplanation, setEditedExplanation] = useState('');

  const samplePrompts = direction === 'es-qu' ? [
    'Estoy en mi casa descansando',
    '¿Estás bien nomás, señor?',
    'Mañana vendré definitivamente a trabajar',
    'Todavía estoy comiendo, no puedo ir',
    '¿Y tú qué estás haciendo?'
  ] : [
    'Wasiypi kashani, jamuylla',
    'Allinllachu kashanki, tata?',
    'Mikhushani-raj, mana riyta atinichu',
    'Imatataj ruwashanki qan?',
    'Paqarin jamusaqpuni llank\'aj'
  ];

  const handleTranslate = async (textToTranslate?: string) => {
    const text = (textToTranslate || inputText).trim();
    if (!text) return;

    setLoading(true);
    setErrorMsg('');
    setAddedToCorpus(false);
    setIsEditingResult(false);

    try {
      const customRules = grammarRules.map((r) => `${r.title}: ${r.cochabambaSpecificity}`).join('\n');
      const extraCorpus = phrases.slice(0, 10).map((p) => ({
        quechua: p.quechua,
        spanish: p.spanish,
        morphology: p.morphologicalBreakdown,
      }));

      const res = await fetch('/api/quechua/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          direction,
          customRules,
          extraCorpus,
          knownRoots: roots.slice(0, 60).map((r) => ({ quechua: r.quechua, spanish: r.spanish, category: r.category })),
          knownSuffixes: suffixes.map((s) => ({ suffix: s.suffix, function: s.function, slot: s.slotOrder })),
        }),
      });

      let data: TranslationResult;
      const contentType = res.headers.get('content-type') || '';

      if (!contentType.includes('application/json')) {
        console.log('Aplicando motor morfológico local...');
        const words = text.trim().split(/\s+/);
        const localTokens = words.map((w) => analyzeWordWithKnownDatabase(w, roots, suffixes));
        data = {
          sourceText: text,
          translatedText: 'Análisis morfológico con banco local',
          direction,
          tokens: localTokens,
          grammaticalExplanation: 'Análisis morfológico generado directamente desde las raíces y reglas gramaticales del banco.',
          detectedDoubts: [],
        };
      } else {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Error del servidor (${res.status})`);
        }
        data = await res.json();
      }

      // Refinar tokens asegurando raíces reales si el modelo dejó la palabra aglutinada
      const refinedTokens: MorphToken[] = data.tokens.map((token) => {
        if (token.root.toLowerCase() === token.surface.toLowerCase() && token.suffixes.length === 0) {
          return analyzeWordWithKnownDatabase(token.surface, roots, suffixes, token.gloss);
        }
        return token;
      });

      data.tokens = refinedTokens;
      setResult(data);
      setEditedTranslatedText(data.translatedText);
      setEditedExplanation(data.grammaticalExplanation);

      // Auto-registrar términos críticos detectados en el Panel
      if (data.detectedDoubts && data.detectedDoubts.length > 0) {
        const autoMap: Record<string, boolean> = {};
        data.detectedDoubts.forEach((d) => {
          addDoubt({
            term: d.term,
            trigger: (d.trigger as any) || 'low_confidence',
            contextPhrase: d.contextPhrase || text,
            occurrences: d.occurrences || 1,
            aiHypothesis: d.aiHypothesis || 'Detectado automáticamente durante la traducción.',
            quechuistaQuestion: d.quechuistaQuestion || `¿Es correcto el uso de "${d.term}" en Cochabamba?`,
            suggestedAction: d.suggestedAction || 'Revisar término en el panel de términos críticos.',
            status: 'pending',
          });
          autoMap[d.term] = true;
        });
        setAddedDoubtsMap((prev) => ({ ...prev, ...autoMap }));
      }
    } catch (err: unknown) {
      const error = err as Error;
      const words = text.trim().split(/\s+/);
      const localTokens = words.map((w) => analyzeWordWithKnownDatabase(w, roots, suffixes));
      setResult({
        sourceText: text,
        translatedText: 'Análisis morfológico local activo',
        direction,
        tokens: localTokens,
        grammaticalExplanation: 'Se aplicó el desglosador morfológico local con las raíces y sufijos del banco léxico.',
        detectedDoubts: [],
      });
      setErrorMsg(`Aviso: ${error.message || 'Se aplicó análisis con el banco local.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenManualModal = () => {
    setManualSource(inputText.trim());
    setManualTranslation('');
    setManualMorph('');
    setManualGloss('');
    setManualNotes('');
    setIsManualInputOpen(true);
  };

  const handleSaveManualTranslation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSource.trim() || !manualTranslation.trim()) return;

    const quechuaStr = direction === 'qu-es' ? manualSource.trim() : manualTranslation.trim();
    const spanishStr = direction === 'qu-es' ? manualTranslation.trim() : manualSource.trim();

    // 1. Extraer de manera determinista las RAÍCES REALES a partir de la separación del usuario
    const tokens = parseMorphologicalBreakdown(
      quechuaStr,
      manualMorph.trim() || quechuaStr,
      manualGloss.trim() || spanishStr,
      roots,
      suffixes
    );

    // 2. Incorporar al corpus para instruir inmediatamente al modelo
    addPhrase({
      quechua: quechuaStr,
      spanish: spanishStr,
      morphologicalBreakdown: manualMorph.trim() || tokens.map(t => t.suffixes.length ? `${t.root}-${t.suffixes.join('-')}` : t.root).join(' '),
      gloss: manualGloss.trim() || tokens.map(t => t.gloss).join(' '),
      grammaticalNotes: manualNotes.trim() || 'Traducción manual añadida por el usuario para instruir al modelo con raíces reales.',
      tags: ['traduccion-manual', 'validado'],
      verified: true,
    });

    setResult({
      sourceText: manualSource.trim(),
      translatedText: manualTranslation.trim(),
      direction,
      tokens,
      grammaticalExplanation: manualNotes.trim() || 'Traducción manual certificada por el usuario e incorporada al corpus con raíces reales.',
      detectedDoubts: [],
    });

    setAddedToCorpus(true);
    setIsManualInputOpen(false);
    setErrorMsg('');
  };

  const handleSaveEditedResult = () => {
    if (!result) return;
    const updatedResult: TranslationResult = {
      ...result,
      translatedText: editedTranslatedText.trim(),
      grammaticalExplanation: editedExplanation.trim(),
    };
    setResult(updatedResult);
    setIsEditingResult(false);

    // Save edited version to corpus
    const quechuaStr = direction === 'qu-es' ? updatedResult.sourceText : updatedResult.translatedText;
    const spanishStr = direction === 'qu-es' ? updatedResult.translatedText : updatedResult.sourceText;
    const morphologyStr = updatedResult.tokens.map((t) => (t.suffixes.length ? `${t.root}-${t.suffixes.join('-')}` : t.root)).join(' ');
    const glossStr = updatedResult.tokens.map((t) => t.gloss).join(' ');

    addPhrase({
      quechua: quechuaStr,
      spanish: spanishStr,
      morphologicalBreakdown: morphologyStr,
      gloss: glossStr,
      grammaticalNotes: updatedResult.grammaticalExplanation,
      tags: ['correccion-manual', 'validado'],
      verified: true,
    });
    setAddedToCorpus(true);
  };

  const handleAddDetectedDoubt = (doubt: TranslationResult['detectedDoubts'][0]) => {
    addDoubt({
      ...doubt,
      status: 'pending',
    });
    setAddedDoubtsMap((prev) => ({ ...prev, [doubt.term]: true }));
  };

  const handleSaveToCorpus = () => {
    if (!result) return;
    const quechuaStr = direction === 'qu-es' ? result.sourceText : result.translatedText;
    const spanishStr = direction === 'qu-es' ? result.translatedText : result.sourceText;
    const morphologyStr = result.tokens.map((t) => (t.suffixes.length ? `${t.root}-${t.suffixes.join('-')}` : t.root)).join(' ');
    const glossStr = result.tokens.map((t) => t.gloss).join(' ');

    addPhrase({
      quechua: quechuaStr,
      spanish: spanishStr,
      morphologicalBreakdown: morphologyStr,
      gloss: glossStr,
      grammaticalNotes: result.grammaticalExplanation,
      tags: ['traduccion', 'validado'],
      verified: true,
    });
    setAddedToCorpus(true);
  };

  return (
    <div className="space-y-6">
      {/* Header and Direction Toggle */}
      <div className="bg-stone-50 dark:bg-stone-900/60 p-6 rounded-xl border border-stone-200 dark:border-stone-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Traductor & Analizador Morfológico Cochabambino
            </h1>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
              Instrucción contextual dinámica con tus <span className="font-semibold text-stone-800 dark:text-stone-200">{phrases.length} frases</span>, <span className="font-semibold text-stone-800 dark:text-stone-200">{suffixes.length} reglas de sufijos</span> y <span className="font-semibold text-stone-800 dark:text-stone-200">{roots.length} raíces</span> registradas.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-stone-950 p-1.5 rounded-lg border border-stone-200 dark:border-stone-800 shrink-0">
            <span className="text-xs font-semibold px-2 py-1 text-stone-800 dark:text-stone-200">
              {direction === 'es-qu' ? 'Español' : 'Quechua Cochabamba'}
            </span>
            <button
              onClick={() => {
                setDirection(direction === 'es-qu' ? 'qu-es' : 'es-qu');
                setResult(null);
                setIsEditingResult(false);
              }}
              title="Invertir dirección"
              className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-600 dark:text-stone-400 transition-colors"
            >
              <ArrowRightLeft className="w-4 h-4 text-amber-700 dark:text-amber-500" />
            </button>
            <span className="text-xs font-semibold px-2 py-1 text-amber-800 dark:text-amber-400">
              {direction === 'es-qu' ? 'Quechua Cochabamba' : 'Español'}
            </span>
          </div>
        </div>

        {/* Input Box */}
        <div className="mt-6 space-y-3">
          <textarea
            rows={3}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleTranslate();
              }
            }}
            placeholder={
              direction === 'es-qu'
                ? 'Escribe en español (ej. "Todavía estoy comiendo en mi casa y no puedo ir")...'
                : 'Qillqay qhichwapi (ej. "Wasiypi kashani-raj, jamuylla")...'
            }
            className="w-full p-4 text-base bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Quick test phrases */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-stone-500">Probar:</span>
              {samplePrompts.slice(0, 3).map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputText(sample);
                    handleTranslate(sample);
                  }}
                  className="px-2.5 py-1 text-xs bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-md text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 transition-colors"
                >
                  {sample}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {/* Button to add manual translation */}
              <button
                onClick={handleOpenManualModal}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold rounded-lg transition-colors border border-stone-300 dark:border-stone-700"
                title="Si el modelo no da la traducción o prefieres definirla tú mismo para instruirlo"
              >
                <Plus className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                <span>Agregar Traducción Manual</span>
              </button>

              <button
                onClick={() => handleTranslate()}
                disabled={loading || !inputText.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analizando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Traducir con IA</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error state */}
      {errorMsg && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-800 dark:text-red-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>{errorMsg}</div>
          <button
            onClick={handleOpenManualModal}
            className="px-3 py-1 bg-white dark:bg-stone-900 text-amber-800 dark:text-amber-400 font-semibold rounded border border-red-300 dark:border-red-800 text-xs shrink-0"
          >
            Ingresar traducción manual ahora
          </button>
        </div>
      )}

      {/* Translation Result View */}
      {result && (
        <div className="space-y-6 animate-fade-in">
          {/* Main Translated Text Box */}
          <div className="bg-white dark:bg-stone-950 p-6 rounded-xl border border-stone-200 dark:border-stone-800 space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between border-b border-stone-100 dark:border-stone-900 pb-3 gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Resultado de Traducción {direction === 'es-qu' ? '(Quechua Cochabambino)' : '(Español)'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditingResult(!isEditingResult)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                  <span>{isEditingResult ? 'Cancelar edición' : 'Corregir traducción'}</span>
                </button>

                <button
                  onClick={handleSaveToCorpus}
                  disabled={addedToCorpus}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 rounded-md transition-colors"
                >
                  {addedToCorpus ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>¡Guardado en el Corpus!</span>
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Guardar en Corpus</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* View or Edit Main Text */}
            {isEditingResult ? (
              <div className="space-y-3 p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
                <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200">
                  Modifica la traducción según la norma cochabambina:
                </label>
                <input
                  type="text"
                  value={editedTranslatedText}
                  onChange={(e) => setEditedTranslatedText(e.target.value)}
                  className="w-full p-2.5 text-base font-bold font-display bg-white dark:bg-stone-900 border border-amber-300 dark:border-amber-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                />

                <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
                  Añade una aclaración o nota gramatical para instruir al modelo:
                </label>
                <textarea
                  rows={2}
                  value={editedExplanation}
                  onChange={(e) => setEditedExplanation(e.target.value)}
                  className="w-full p-2 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                />

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsEditingResult(false)}
                    className="px-3 py-1.5 text-xs text-stone-600 dark:text-stone-400"
                  >
                    Descartar
                  </button>
                  <button
                    onClick={handleSaveEditedResult}
                    className="flex items-center gap-1 px-4 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Guardar Corrección en el Corpus</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-xl font-bold font-display text-stone-900 dark:text-stone-100 leading-relaxed">
                {result.translatedText}
              </div>
            )}

            <div className="text-xs text-stone-500 italic">
              Texto origen: "{result.sourceText}"
            </div>

            {addedToCorpus && (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Esta frase forma parte ahora de tu corpus activo. El modelo la tomará como ejemplo inmediato en futuras traducciones y conversaciones.
                </span>
              </div>
            )}
          </div>

          {/* Interlinear Morphological Gloss (Palabra por palabra) */}
          <div className="bg-white dark:bg-stone-950 p-6 rounded-xl border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-stone-900 dark:text-stone-100">
                Análisis Morfológico Interlineal (Glosa Leipzig)
              </h2>
              <span className="text-xs text-stone-500">
                Descomposición exacta de raíces y sufijos aglutinados
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {result.tokens.map((token, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border transition-all ${
                    token.doubtFlag
                      ? 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                      : 'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800'
                  }`}
                >
                  <div className="font-mono text-base font-bold text-stone-900 dark:text-stone-100">
                    {token.surface}
                  </div>

                  <div className="mt-2 space-y-1 text-xs">
                    <div className="flex items-baseline justify-between text-stone-500">
                      <span>Raíz:</span>
                      <span className="font-mono font-semibold text-amber-800 dark:text-amber-400">
                        {token.root}
                      </span>
                    </div>

                    {token.suffixes.length > 0 && (
                      <div className="flex items-baseline justify-between text-stone-500">
                        <span>Sufijos:</span>
                        <span className="font-mono text-stone-800 dark:text-stone-200">
                          {token.suffixes.join(', ')}
                        </span>
                      </div>
                    )}

                    <div className="pt-1 border-t border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 font-mono text-xs">
                      {token.gloss}
                    </div>

                    {token.doubtFlag && (
                      <div className="mt-1 text-xs text-amber-700 dark:text-amber-400 font-medium">
                        ⚠️ Término dudoso detectado
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Grammatical explanation note */}
            {result.grammaticalExplanation && (
              <div className="mt-4 p-4 bg-stone-50 dark:bg-stone-900 rounded-lg text-xs space-y-1">
                <span className="font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider block">
                  Explicación Gramatical:
                </span>
                <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                  {result.grammaticalExplanation}
                </p>
              </div>
            )}
          </div>

          {/* Detected Critical Doubts Banner */}
          {result.detectedDoubts && result.detectedDoubts.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/40 p-6 rounded-xl border border-amber-200 dark:border-amber-800 space-y-4">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h3 className="font-display font-bold text-base">
                  {result.detectedDoubts.length} Término(s) Crítico(s) Detectado(s) por el Modelo
                </h3>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <p className="text-xs text-amber-900 dark:text-amber-200">
                  El modelo detectó e incorporó automáticamente estos términos a tu Panel de Términos Críticos para tu Sesión de Validación o consulta con el quechuista.
                </p>
                <button
                  onClick={() => setActiveTab('doubts')}
                  className="px-3 py-1.5 text-xs font-semibold bg-amber-800 hover:bg-amber-900 text-white rounded-md shrink-0 self-start sm:self-auto transition-colors"
                >
                  Abrir Panel de Términos Críticos →
                </button>
              </div>

              <div className="space-y-3">
                {result.detectedDoubts.map((doubt, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-white dark:bg-stone-900 rounded-lg border border-amber-200 dark:border-amber-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-stone-900 dark:text-stone-100">
                          "{doubt.term}"
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-medium">
                          {doubt.trigger}
                        </span>
                      </div>
                      <p className="text-stone-600 dark:text-stone-400">
                        {doubt.aiHypothesis}
                      </p>
                      <p className="text-stone-800 dark:text-stone-200 font-medium">
                        Sugerencia: {doubt.suggestedAction}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Registrado en el Panel
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: INGRESAR TRADUCCIÓN MANUAL Y ENTRENAR */}
      {/* ======================================================== */}
      {isManualInputOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-500 mb-2">
              <Plus className="w-5 h-5" />
              <h2 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
                Ingresar Traducción Manual y Entrenar al Modelo
              </h2>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              Si la IA no sabe cómo traducir esta frase o tú conoces la variante cochabambina exacta, ingrésala aquí. Se guardará en el corpus y el modelo la usará como contexto para aprender de inmediato.
            </p>

            <form onSubmit={handleSaveManualTranslation} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200">
                  Texto Origen {direction === 'es-qu' ? '(Español)' : '(Quechua Cochabambino)'}
                </label>
                <input
                  type="text"
                  required
                  value={manualSource}
                  onChange={(e) => setManualSource(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200">
                  Traducción Manual {direction === 'es-qu' ? '(Quechua Cochabambino)' : '(Español)'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={direction === 'es-qu' ? 'ej. Wasiypi kashani, jamuylla.' : 'ej. Estoy en mi casa, pasa nomás.'}
                  value={manualTranslation}
                  onChange={(e) => setManualTranslation(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm font-semibold bg-stone-50 dark:bg-stone-950 border border-amber-300 dark:border-amber-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                  Desglose de Morfemas (opcional)
                </label>
                <input
                  type="text"
                  placeholder="ej. wasi-y-pi ka-sha-ni jamu-y-lla"
                  value={manualMorph}
                  onChange={(e) => setManualMorph(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-xs font-mono bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                  Glosa Gramatical (opcional)
                </label>
                <input
                  type="text"
                  placeholder="ej. casa-1SG.POSS-LOC ser/estar-PROG-1SG venir-IMP-AFECT"
                  value={manualGloss}
                  onChange={(e) => setManualGloss(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-xs font-mono bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                  Explicación o Nota Gramatical para Instruir al Modelo
                </label>
                <textarea
                  rows={2}
                  placeholder="ej. En Cochabamba se usa kashani con el sufijo progresivo -sha-..."
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsManualInputOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-amber-700 hover:bg-amber-800 text-white rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar en Corpus e Instruir al Modelo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
