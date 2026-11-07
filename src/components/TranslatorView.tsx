import React, { useState, useEffect } from 'react';
import { useQuechua } from '../context/QuechuaContext';
import { TranslationResult, MorphToken } from '../types/quechua';
import { parseMorphologicalBreakdown, analyzeWordWithKnownDatabase } from '../utils/morphology';
import { translateWithBank, segmentWord } from '../utils/bankEngine';
import { findExactMatch, findRelevantPhrases, findRelevantRoots, formatMeanings, normalizeText, rootExists } from '../utils/retrieval';
import { IntegratedContentDrawer } from './IntegratedContentDrawer';
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
  Edit3,
  MessageSquare
} from 'lucide-react';

export const TranslatorView: React.FC = () => {
  const { 
    roots, 
    suffixes, 
    phrases, 
    grammarRules, 
    addDoubt, 
    upsertPhrase, 
    learnFromTranslation, 
    setActiveTab,
    pendingTranslatorText,
    pendingTranslatorDirection,
    clearPendingTranslator,
    sendToChat
  } = useQuechua();

  const [direction, setDirection] = useState<'qu-es' | 'es-qu'>('es-qu');
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [addedDoubtsMap, setAddedDoubtsMap] = useState<Record<string, boolean>>({});
  const [addedToCorpus, setAddedToCorpus] = useState(false);
  const [isManualInputOpen, setIsManualInputOpen] = useState(false);
  const [isContentDrawerOpen, setIsContentDrawerOpen] = useState(false);
  const [selectedTokenDetail, setSelectedTokenDetail] = useState<MorphToken | null>(null);
  const [learnedRoots, setLearnedRoots] = useState<string[]>([]);
  const [learnedSenses, setLearnedSenses] = useState<string[]>([]);
  const [glossWithAI, setGlossWithAI] = useState(true);

  // Auto-load and execute pending translation from other views (VerbTensesGuide, Chat, etc.)
  useEffect(() => {
    if (pendingTranslatorText) {
      setInputText(pendingTranslatorText);
      if (pendingTranslatorDirection) {
        setDirection(pendingTranslatorDirection);
      }
      const textToRun = pendingTranslatorText;
      clearPendingTranslator();
      handleTranslate(textToRun);
    }
  }, [pendingTranslatorText, pendingTranslatorDirection]);

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

  /** Respaldo sin IA: traduce y glosa (Leipzig) buscando en el banco lingüístico completo. */
  const bankTranslate = (text: string): TranslationResult =>
    translateWithBank(text, direction, { roots, suffixes, phrases });

  const handleTranslate = async (textToTranslate?: string, forceAI = false) => {
    const text = (textToTranslate || inputText).trim();
    if (!text) return;

    setLoading(true);
    setErrorMsg('');
    setAddedToCorpus(false);
    setIsEditingResult(false);
    setLearnedRoots([]);
    setLearnedSenses([]);

    try {
      // 1. Si la frase ya está en el corpus, se responde desde ahí (sin gastar IA ni arriesgar otra versión).
      const exact = forceAI ? null : findExactMatch(text, direction, phrases);
      if (exact) {
        const tokens = parseMorphologicalBreakdown(
          exact.quechua,
          exact.morphologicalBreakdown || exact.quechua,
          exact.gloss || '',
          roots,
          suffixes
        );
        const fromCorpus: TranslationResult = {
          sourceText: text,
          translatedText: direction === 'qu-es' ? exact.spanish : exact.quechua,
          direction,
          tokens,
          grammaticalExplanation: exact.grammaticalNotes,
          detectedDoubts: [],
          source: 'corpus',
        };
        setResult(fromCorpus);
        setEditedTranslatedText(fromCorpus.translatedText);
        setEditedExplanation(fromCorpus.grammaticalExplanation);
        setAddedToCorpus(true);
        return;
      }

      // 2. Si no, se le da a la IA lo más parecido del corpus y las raíces pertinentes (no "las últimas 10").
      const relevantPhrases = findRelevantPhrases(text, direction, phrases, 12);
      const relevantRoots = findRelevantRoots(text, direction, roots, relevantPhrases, 80);
      const customRules = grammarRules.map((r) => `${r.title}: ${r.cochabambaSpecificity}`).join('\n');
      const extraCorpus = relevantPhrases.map((p) => ({
        quechua: p.quechua,
        spanish: p.spanish,
        morphology: p.morphologicalBreakdown,
        gloss: p.gloss,
        verified: p.verified,
      }));

      const res = await fetch('/api/quechua/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          direction,
          customRules,
          extraCorpus,
          knownRoots: relevantRoots.map((r) => ({ quechua: r.quechua, spanish: formatMeanings(r), category: r.category })),
          knownSuffixes: suffixes.map((s) => ({ suffix: s.suffix, function: s.function, slot: s.slotOrder })),
        }),
      });

      let data: TranslationResult;
      const contentType = res.headers.get('content-type') || '';

      if (!contentType.includes('application/json')) {
        data = bankTranslate(text);
      } else {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Error del servidor (${res.status})`);
        }
        data = await res.json();
        data.source = data.source || 'ai';
        // El servidor solo conoce unas pocas frases fijas: el banco completo del usuario traduce mejor.
        if (data.source === 'fallback') data = bankTranslate(text);
      }

      // Refinar tokens asegurando raíces reales si el modelo dejó la palabra aglutinada
      const refinedTokens: MorphToken[] = data.tokens.map((token) => {
        if (data.source !== 'fallback' && token.root.toLowerCase() === token.surface.toLowerCase() && token.suffixes.length === 0) {
          return analyzeWordWithKnownDatabase(token.surface, roots, suffixes, token.gloss);
        }
        return token;
      });

      data.tokens = refinedTokens;

      // Palabras que la IA usó y que no están en el directorio: se marcan y se registran como dudas
      // (aunque el modelo no las haya señalado). addDoubt no duplica un término ya registrado.
      if (data.source === 'ai') {
        const alreadyReported = new Set((data.detectedDoubts || []).map((d) => normalizeText(d.term)));
        data.tokens = data.tokens.map((token) => {
          const root = (token.root || '').replace(/^-+|-+$/g, '');
          if (!root || /^\d+$/.test(root) || root.length < 2 || rootExists(root, roots)) return token;
          if (!alreadyReported.has(normalizeText(root))) {
            addDoubt({
              term: root,
              trigger: 'out_of_glossary',
              contextPhrase: text,
              occurrences: 1,
              aiHypothesis: `La IA usó "${root}" (${token.meaning || token.gloss || 'sin glosa'}) y no está en tu directorio.`,
              quechuistaQuestion: `¿"${root}" es correcto y se usa así en Cochabamba?`,
              suggestedAction: 'Verificar y, si es correcto, agregarlo al Banco Lingüístico.',
              status: 'pending',
            });
          }
          return { ...token, doubtFlag: token.doubtFlag || 'out_of_glossary' };
        });
      }

      if (data.source === 'fallback') {
        const info = data.fallbackInfo;
        setErrorMsg(`La IA no respondió: traduje buscando en tu banco lingüístico${info ? ` (${info.recognized} de ${info.total} palabras reconocidas)` : ''}. Es una traducción aproximada; las palabras entre [corchetes] no están en el banco. Revísala antes de guardarla o vuelve a intentar con la IA.`);
      }
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
      const fb = bankTranslate(text);
      setResult(fb);
      setEditedTranslatedText(fb.translatedText);
      setEditedExplanation(fb.grammaticalExplanation);
      fb.detectedDoubts.forEach((d) => addDoubt(d));
      const info = fb.fallbackInfo;
      setErrorMsg(`No se pudo consultar a la IA (${error.message || 'sin conexión'}): traduje con tu banco lingüístico${info ? ` (${info.recognized} de ${info.total} palabras reconocidas)` : ''}. Es una traducción aproximada; revísala antes de guardarla.`);
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

  /**
   * Guarda una frase en el corpus (reemplazando la anterior si el texto origen ya existía)
   * y agrega al directorio las raíces nuevas, que quedan en Términos críticos para revisión.
   */
  const persistTranslation = (
    quechuaStr: string,
    spanishStr: string,
    tokens: MorphToken[],
    notes: string,
    tags: string[],
    verified: boolean,
    morphOverride?: string,
    glossOverride?: string
  ) => {
    upsertPhrase(direction, {
      quechua: quechuaStr,
      spanish: spanishStr,
      morphologicalBreakdown: morphOverride || tokens.map((t) => (t.suffixes.length ? `${t.root}${t.suffixes.map((x) => (x.startsWith('-') ? x : `-${x}`)).join('')}` : t.root)).join(' '),
      gloss: glossOverride || tokens.map((t) => t.gloss).join(' '),
      grammaticalNotes: notes,
      tags,
      verified,
    });
    const added = learnFromTranslation(tokens, { quechua: quechuaStr, spanish: spanishStr });
    setLearnedRoots(added.roots);
    setLearnedSenses(added.senses);
    setAddedToCorpus(true);
    return added;
  };

  /** Pide a la IA raíz, sufijos y significado de las palabras indicadas; si falla, devuelve los tokens sin cambios. */
  const glossTokensWithAI = async (
    tokens: MorphToken[],
    indices: number[],
    quechuaStr: string,
    spanishStr: string
  ): Promise<MorphToken[]> => {
    if (!indices.length) return tokens;
    setLoading(true);
    try {
      const res = await fetch('/api/quechua/gloss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quechua: quechuaStr,
          spanish: spanishStr,
          words: indices.map((i) => tokens[i].surface),
          knownRoots: findRelevantRoots(quechuaStr, 'qu-es', roots, [], 40).map((r) => ({ quechua: r.quechua, spanish: formatMeanings(r) })),
        }),
      });
      if (!res.ok) throw new Error('IA no disponible');
      const data: { tokens?: Array<{ surface: string; root: string; suffixes: string[]; gloss: string; meaning: string }> } = await res.json();
      const bySurface = new Map((data.tokens || []).map((g) => [normalizeText(g.surface), g]));
      const target = new Set(indices);
      return tokens.map((t, idx) => {
        const g = target.has(idx) ? bySurface.get(normalizeText(t.surface)) : undefined;
        return g && g.root
          ? { ...t, root: g.root, suffixes: g.suffixes || [], gloss: g.gloss || t.gloss, meaning: g.meaning || undefined, isRecognized: true }
          : t;
      });
    } catch {
      // Sin IA: se glosa con el banco (raíz + sufijos conocidos); lo que no se reconoce queda pendiente.
      const target = new Set(indices);
      let pending = 0;
      const local = tokens.map((t, idx) => {
        if (!target.has(idx)) return t;
        const seg = segmentWord(t.surface, { roots, suffixes });
        if (seg.token.isRecognized && seg.token.doubtFlag !== 'low_confidence') return { ...t, ...seg.token };
        pending++;
        return t;
      });
      setErrorMsg(pending
        ? `La IA no está disponible: glosé con tu banco lo que pude; ${pending} palabra(s) quedan "pendientes de glosar" y puedes completarlas en el Banco Lingüístico.`
        : 'La IA no está disponible: glosé las palabras nuevas con las raíces y sufijos de tu banco.');
      return local;
    } finally {
      setLoading(false);
    }
  };

  const handleSaveManualTranslation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSource.trim() || !manualTranslation.trim()) return;

    const quechuaStr = direction === 'qu-es' ? manualSource.trim() : manualTranslation.trim();
    const spanishStr = direction === 'qu-es' ? manualTranslation.trim() : manualSource.trim();

    let tokens = parseMorphologicalBreakdown(
      quechuaStr,
      manualMorph.trim() || quechuaStr,
      manualGloss.trim() || '',
      roots,
      suffixes
    );

    // Si el usuario no escribió su propia glosa, la IA glosa las palabras con raíz fuera del directorio
    if (glossWithAI && !manualGloss.trim()) {
      const indices = tokens
        .map((t, idx) => ({ t, idx }))
        .filter(({ t }) => !t.isRecognized || !rootExists(t.root, roots))
        .map(({ idx }) => idx);
      tokens = await glossTokensWithAI(tokens, indices, quechuaStr, spanishStr);
    }
    const notes = manualNotes.trim() || 'Traducción manual añadida por el usuario.';

    persistTranslation(quechuaStr, spanishStr, tokens, notes, ['traduccion-manual', 'validado'], true, manualMorph.trim() || undefined, manualGloss.trim() || undefined);

    setResult({
      sourceText: manualSource.trim(),
      translatedText: manualTranslation.trim(),
      direction,
      tokens,
      grammaticalExplanation: notes,
      detectedDoubts: [],
      source: 'corpus',
    });
    setIsManualInputOpen(false);
    setErrorMsg('');
  };

  const handleSaveEditedResult = async () => {
    if (!result) return;
    const newTranslation = editedTranslatedText.trim();
    if (!newTranslation) return;

    const quechuaStr = direction === 'qu-es' ? result.sourceText : newTranslation;
    const spanishStr = direction === 'qu-es' ? newTranslation : result.sourceText;

    // Los tokens del resultado corresponden a la traducción ANTERIOR: se vuelven a armar
    // sobre el quechua corregido, reutilizando los que siguen iguales.
    const oldByWord = new Map(result.tokens.map((t) => [normalizeText(t.surface), t]));
    const reused = new Set<number>();
    let tokens: MorphToken[] = quechuaStr
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((raw, idx) => {
        const word = raw.replace(/^[.,!?¿¡;:]+|[.,!?;:]+$/g, '');
        const old = oldByWord.get(normalizeText(word));
        if (old) reused.add(idx);
        return old || analyzeWordWithKnownDatabase(word, roots, suffixes);
      });

    // Palabras nuevas (no reutilizadas y con raíz fuera del directorio): se pide a la IA que las glose,
    // así entran al directorio con su significado en vez de "Pendiente de glosar".
    const needGloss = tokens
      .map((t, idx) => ({ t, idx }))
      .filter(({ t, idx }) => !reused.has(idx) && (!t.isRecognized || !rootExists(t.root, roots)));

    if (glossWithAI && needGloss.length > 0) {
      tokens = await glossTokensWithAI(tokens, needGloss.map(({ idx }) => idx), quechuaStr, spanishStr);
    }

    const notes = editedExplanation.trim();
    persistTranslation(quechuaStr, spanishStr, tokens, notes, ['correccion-manual', 'validado'], true);

    setResult({
      ...result,
      translatedText: newTranslation,
      grammaticalExplanation: notes,
      tokens,
      source: 'corpus',
    });
    setIsEditingResult(false);
  };

  const handleAddDetectedDoubt = (doubt: TranslationResult['detectedDoubts'][0]) => {
    addDoubt({
      ...doubt,
      status: 'pending',
    });
    setAddedDoubtsMap((prev) => ({ ...prev, [doubt.term]: true }));
  };

  // Guardar tal cual lo devolvió la IA: queda SIN verificar (para que se revise), pero ya se reutiliza.
  const handleSaveToCorpus = () => {
    if (!result) return;
    const quechuaStr = direction === 'qu-es' ? result.sourceText : result.translatedText;
    const spanishStr = direction === 'qu-es' ? result.translatedText : result.sourceText;
    persistTranslation(quechuaStr, spanishStr, result.tokens, result.grammaticalExplanation, ['traduccion-ia', 'sin-verificar'], false);
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

            <div className="flex flex-wrap items-center gap-2 ml-auto">
              {/* Button to open Integrated Content Drawer */}
              <button
                onClick={() => setIsContentDrawerOpen(!isContentDrawerOpen)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-lg transition-colors border ${
                  isContentDrawerOpen
                    ? 'bg-amber-700 text-white border-amber-800'
                    : 'bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 border-stone-300 dark:border-stone-700 hover:border-amber-500'
                }`}
                title="Abrir conjugador de verbos, pronombres, posesivos, reglas y corpus"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>{isContentDrawerOpen ? 'Cerrar Banco Rápido' : 'Consultar Banco & Conjugador'}</span>
              </button>

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

      {/* Integrated Content Drawer */}
      <IntegratedContentDrawer
        isOpen={isContentDrawerOpen}
        onClose={() => setIsContentDrawerOpen(false)}
        onInsertText={(text) => {
          setInputText(text);
          handleTranslate(text);
        }}
        contextMode="translator"
      />

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

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    const quText = direction === 'es-qu' ? result.translatedText : result.sourceText;
                    sendToChat(quText);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 rounded-md transition-colors"
                  title="Llevar esta frase quechua a la conversación guiada con el tutor"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                  <span>Practicar en Chat</span>
                </button>

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

                <label className="flex items-center gap-2 text-xs text-stone-700 dark:text-stone-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={glossWithAI}
                    onChange={(e) => setGlossWithAI(e.target.checked)}
                  />
                  Glosar con la IA las palabras nuevas de mi versión (raíz y significado)
                </label>

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

            {result.source === 'fallback' && (
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-300 flex flex-wrap items-center gap-2 justify-between">
                <span className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  Traducido sin IA, buscando en tu banco lingüístico
                  {result.fallbackInfo ? ` (${result.fallbackInfo.recognized} de ${result.fallbackInfo.total} palabras reconocidas)` : ''}.
                </span>
                <button
                  onClick={() => handleTranslate(result.sourceText, true)}
                  className="px-2.5 py-1 font-semibold bg-white dark:bg-stone-900 border border-amber-300 dark:border-amber-800 rounded-md"
                >
                  Reintentar con la IA
                </button>
              </div>
            )}

            {result.source === 'corpus' && (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 flex flex-wrap items-center gap-2 justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Traducción tomada de tu corpus: no se consultó a la IA.
                </span>
                <button
                  onClick={() => handleTranslate(result.sourceText, true)}
                  className="px-2.5 py-1 font-semibold bg-white dark:bg-stone-900 border border-emerald-300 dark:border-emerald-800 rounded-md"
                >
                  Consultar a la IA de todos modos
                </button>
              </div>
            )}

            {addedToCorpus && result.source !== 'corpus' && (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Guardada en el corpus: la próxima vez que escribas esta frase, se responderá desde aquí.</span>
              </div>
            )}

            {learnedSenses.length > 0 && (
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-900 dark:text-amber-200 flex flex-wrap items-center gap-2 justify-between">
                <span>
                  Posible(s) otro(s) significado(s) de raíces ya existentes (guardados como sentido adicional, sin verificar):{' '}
                  <span className="font-mono font-semibold">{learnedSenses.join('; ')}</span>
                </span>
                <button
                  onClick={() => setActiveTab('doubts')}
                  className="px-2.5 py-1 font-semibold bg-amber-800 hover:bg-amber-900 text-white rounded-md"
                >
                  Revisar en Términos críticos →
                </button>
              </div>
            )}

            {learnedRoots.length > 0 && (
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-900 dark:text-amber-200 flex flex-wrap items-center gap-2 justify-between">
                <span>
                  {learnedRoots.length} palabra(s) nueva(s) agregada(s) al directorio (sin verificar):{' '}
                  <span className="font-mono font-semibold">{learnedRoots.join(', ')}</span>
                </span>
                <button
                  onClick={() => setActiveTab('doubts')}
                  className="px-2.5 py-1 font-semibold bg-amber-800 hover:bg-amber-900 text-white rounded-md"
                >
                  Revisar en Términos críticos →
                </button>
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
                  className={`p-3 rounded-lg border transition-all flex flex-col justify-between ${
                    token.doubtFlag
                      ? 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                      : 'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-base font-bold text-stone-900 dark:text-stone-100">
                        {token.surface}
                      </span>
                      {token.meaning && (
                        <span className="text-[11px] text-stone-500 italic truncate max-w-[110px]" title={token.meaning}>
                          "{token.meaning}"
                        </span>
                      )}
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

                  {/* Token Quick Actions */}
                  <div className="mt-2.5 pt-2 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => {
                        setInputText(token.surface);
                        setDirection('qu-es');
                        handleTranslate(token.surface);
                      }}
                      className="px-2 py-0.5 bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 text-[10px] font-semibold text-stone-700 dark:text-stone-300 rounded"
                      title="Analizar esta sola palabra"
                    >
                      Aislar
                    </button>
                    <button
                      onClick={() => sendToChat(token.surface)}
                      className="px-2 py-0.5 bg-amber-700 hover:bg-amber-800 text-white text-[10px] font-semibold rounded"
                      title="Preguntar por esta palabra en el Chat"
                    >
                      Chat
                    </button>
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

              <label className="flex items-center gap-2 text-xs text-stone-700 dark:text-stone-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={glossWithAI}
                  onChange={(e) => setGlossWithAI(e.target.checked)}
                />
                Si dejo la glosa vacía, glosar con la IA las palabras nuevas (raíz y significado)
              </label>

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
