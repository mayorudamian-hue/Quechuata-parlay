import React, { useState, useEffect, useMemo } from 'react';
import { useQuechua } from '../context/QuechuaContext';
import { ChatMessage, CorpusPhrase } from '../types/quechua';
import { findRelevantPhrases, findRelevantRoots, formatMeanings, normalizeText } from '../utils/retrieval';
import { IntegratedContentDrawer } from './IntegratedContentDrawer';
import { 
  Send, 
  MessageSquare, 
  Sparkles, 
  Info, 
  Eye, 
  EyeOff, 
  RotateCcw,
  Loader2,
  ChevronDown,
  ChevronUp,
  ArrowRightLeft,
  BookOpen,
  Check,
  Layers,
  Flame,
  CheckCircle2
} from 'lucide-react';

type PracticeTheme = 'general' | 'verbs' | 'negation' | 'conditional' | 'pronouns' | 'corpus';

export const ConversationView: React.FC = () => {
  const { 
    grammarRules, 
    phrases, 
    roots,
    pendingChatPrompt,
    clearPendingChat,
    sendToTranslator,
    upsertPhrase
  } = useQuechua();

  const [userLevel, setUserLevel] = useState<'básico' | 'intermedio' | 'avanzado'>('intermedio');
  const [practiceTheme, setPracticeTheme] = useState<PracticeTheme>('general');
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [revealedTranslations, setRevealedTranslations] = useState<Record<string, boolean>>({});
  const [expandedTokens, setExpandedTokens] = useState<Record<string, boolean>>({});
  const [savedMessageIds, setSavedMessageIds] = useState<Record<string, boolean>>({});
  const [isContentDrawerOpen, setIsContentDrawerOpen] = useState(false);

  // Modo práctica sin IA
  const [offlineMode, setOfflineMode] = useState(false);
  const [drill, setDrill] = useState<{ phrase: CorpusPhrase; asking: 'es-qu' | 'qu-es' } | null>(null);
  const [recentDrillIds, setRecentDrillIds] = useState<string[]>([]);
  const [score, setScore] = useState({ ok: 0, total: 0 });

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'model',
      quechuaText: 'Allinllachu kashanki! Noqa Qhawanapi qanwan parlarikuyta munani. Imatataj ruwashanki kunan ch\'isipi?',
      spanishTranslation: '¡¿Estás bien nomás?! Yo en Qhawana quiero conversar contigo. ¿Qué estás haciendo ahora al atardecer?',
      tokens: [
        { surface: 'Allinllachu', root: 'allin', suffixes: ['-lla', '-chu'], gloss: 'bien-AFECT-INTERR', isRecognized: true },
        { surface: 'kashanki', root: 'kay', suffixes: ['-sha-', '-nki'], gloss: 'ser/estar-PROG-2SG', isRecognized: true },
        { surface: 'parlarikuyta', root: 'parlay', suffixes: ['-ri-', '-ku-', '-y-', '-ta'], gloss: 'hablar-INTENS-REFL-INF-ACUS', isRecognized: true },
        { surface: 'ruwashanki', root: 'ruway', suffixes: ['-sha-', '-nki'], gloss: 'hacer-PROG-2SG', isRecognized: true },
      ],
      pedagogicalNote: 'En Cochabamba iniciamos con "Allinllachu" (afectivo) y el progresivo verbal es estrictamente "-sha-" (kashanki, ruwashanki), no "-chka-".',
      timestamp: 'Ahora',
    },
  ]);

  // Auto-consume pending chat prompt from Translator or Guides
  useEffect(() => {
    if (pendingChatPrompt) {
      setInputMessage(pendingChatPrompt);
      clearPendingChat();
    }
  }, [pendingChatPrompt]);

  // Dynamic starters according to selected practice theme
  const dynamicStarters = useMemo(() => {
    switch (practiceTheme) {
      case 'verbs':
        return [
          'Mikhushani wasiypi',
          'Paqarin jamusajku llank\'aj',
          'Qanwan parlarqani qayna',
          'Mikhuyman qanwan kuska',
          'Ama waqaychu'
        ];
      case 'negation':
        return [
          'Mana qolqe kanchu',
          'Mana kusisqachu kashani',
          'Mana chayta ruwananchijchu tiyan',
          'Ama phiñakuychu',
          'Ama chayta ujyaychu'
        ];
      case 'conditional':
        return [
          'Jehová Diosta kasukunki chayqa, bendicionesta jap\'inki',
          'Sichus jamunki chayqa, mikhusun',
          'Sichus llank\'anki chayqa, qolqeta jap\'inki',
          'Kusisqa kanki chayqa, takiy'
        ];
      case 'pronouns':
        return [
          'Payqa José',
          'Noqayku jamusajku',
          'Noqanchej risunchij',
          'Wasiykiman jamuni',
          'Paykuna wasiypi kashanku'
        ];
      case 'corpus':
        return phrases.slice(0, 5).map(p => p.quechua);
      default:
        return [
          'Allinllachu kashanki, tata?',
          'Wasiypi kashani, qhichwata yachakushani',
          'Imatataj mikhunki paqarin?',
          'Paqarin jamusaqpuni llank\'aj',
          'Cochabamba llajtapi tiyakuni'
        ];
    }
  }, [practiceTheme, phrases]);

  // Helper to create ChatMessage
  const makeMsg = (sender: 'user' | 'model', text: string, extra: Partial<ChatMessage> = {}): ChatMessage => ({
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    sender,
    quechuaText: text,
    spanishTranslation: '',
    timestamp: 'Ahora',
    ...extra,
  });

  const pickNextDrill = (excludeIds: string[]) => {
    const usable = phrases.filter((p) => p.quechua.trim() && p.spanish.trim());
    if (!usable.length) return null;
    const fresh = usable.filter((p) => !excludeIds.includes(p.id));
    const pool = fresh.length ? fresh : usable;
    const verified = pool.filter((p) => p.verified);
    const source = verified.length && Math.random() < 0.7 ? verified : pool;
    const phrase = source[Math.floor(Math.random() * source.length)];
    return { phrase, asking: (Math.random() < 0.5 ? 'es-qu' : 'qu-es') as 'es-qu' | 'qu-es' };
  };

  const questionText = (d: { phrase: CorpusPhrase; asking: 'es-qu' | 'qu-es' }) =>
    d.asking === 'es-qu'
      ? `Traduce al quechua:\n«${d.phrase.spanish}»`
      : `Traduce al español:\n«${d.phrase.quechua}»`;

  const startOfflineMode = () => {
    const first = pickNextDrill([]);
    const base = messages.filter((m) => !m.isError);
    if (!first) {
      setMessages([...base, makeMsg('model', 'No hay frases en tu corpus para practicar. Guarda algunas en el Traductor y vuelve.', { isError: true })]);
      return;
    }
    setOfflineMode(true);
    setDrill(first);
    setRecentDrillIds([first.phrase.id]);
    setScore({ ok: 0, total: 0 });
    setMessages([
      ...base,
      makeMsg('model', 'Modo práctica sin IA: te pregunto frases de tu corpus. Escribe "pasar" si no la sabes.'),
      makeMsg('model', questionText(first)),
    ]);
  };

  const exitOfflineMode = () => {
    setOfflineMode(false);
    setDrill(null);
  };

  const answerDrill = (answer: string) => {
    if (!drill) return;
    const expected = drill.asking === 'es-qu' ? drill.phrase.quechua : drill.phrase.spanish;
    const given = normalizeText(answer);
    const want = normalizeText(expected);
    const skipped = ['pasar', 'no se', 'paso', 'otra'].includes(given);

    const a = new Set(given.split(' ').filter(Boolean));
    const b = new Set(want.split(' ').filter(Boolean));
    const common = [...a].filter((w) => b.has(w)).length;
    const similarity = a.size + b.size - common > 0 ? common / (a.size + b.size - common) : 0;

    let feedback: string;
    let gotIt = false;
    if (skipped) {
      feedback = `Era: «${expected}»`;
    } else if (given === want) {
      gotIt = true;
      feedback = '¡Correcto! ✔';
    } else if (similarity >= 0.6) {
      feedback = `Casi. En tu corpus está así: «${expected}»`;
    } else {
      feedback = `No coincide con tu corpus. Está guardada como: «${expected}»`;
    }

    const notes = drill.phrase.grammaticalNotes && !gotIt ? drill.phrase.grammaticalNotes : '';
    const nextRecent = [...recentDrillIds, drill.phrase.id].slice(-5);
    const next = pickNextDrill(nextRecent);

    const out: ChatMessage[] = [
      makeMsg('user', answer),
      makeMsg('model', feedback, notes ? { spanishTranslation: drill.asking === 'es-qu' ? drill.phrase.spanish : drill.phrase.quechua, pedagogicalNote: notes } : {}),
    ];
    if (next) out.push(makeMsg('model', questionText(next)));

    setScore((prev) => ({ ok: prev.ok + (gotIt ? 1 : 0), total: prev.total + (skipped ? 0 : 1) }));
    setRecentDrillIds(nextRecent.concat(next ? [next.phrase.id] : []).slice(-6));
    setDrill(next);
    setMessages((prev) => [...prev.filter((m) => !m.isError), ...out]);
  };

  const requestReply = async (history: ChatMessage[], lastText: string) => {
    setLoading(true);
    try {
      const real = history.filter((m) => !m.isError);
      const payloadMessages = real.slice(-12).map((m) => ({ sender: m.sender, text: m.quechuaText }));

      const relevantPhrases = findRelevantPhrases(lastText, 'qu-es', phrases, 8);
      const verifiedSample = phrases.filter((p) => p.verified).sort(() => Math.random() - 0.5).slice(0, 4);
      const corpus = [...relevantPhrases, ...verifiedSample]
        .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i)
        .slice(0, 12)
        .map((p) => ({ quechua: p.quechua, spanish: p.spanish }));
      const relevantRoots = findRelevantRoots(lastText, 'qu-es', roots, relevantPhrases, 70);

      // Add practice focus instructions to customRules
      const themeNotes: Record<PracticeTheme, string> = {
        general: 'Enfoque: conversación natural cotidiana cochabambina.',
        verbs: 'Enfoque especial: enfatizar tiempos verbales cochabambinos (-sha- progresivo, -rqa- pasado testimonial, -sajku/-sqayku futuro excluido, -sunchij inclusivo).',
        negation: 'Enfoque especial: ejercitar negación declarativa (mana...-chu, kanchu, kashani) e imperativa (ama...-chu).',
        conditional: 'Enfoque especial: ejercitar oraciones condicionales ((sichus) ... chayqa).',
        pronouns: 'Enfoque especial: ejercitar pronombres personales, distinción inclusivo/exclusivo, y cópula cero en 3.ª presente con kay.',
        corpus: 'Enfoque especial: reutilizar y afianzar las frases guardadas en el corpus.',
      };

      const customRules = [
        themeNotes[practiceTheme],
        ...grammarRules.map((r) => `${r.title}: ${r.cochabambaSpecificity}`),
      ].join('\n');

      const res = await fetch('/api/quechua/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          userLevel,
          customRules,
          corpus,
          knownRoots: relevantRoots.map((r) => ({ quechua: r.quechua, spanish: formatMeanings(r) })),
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) throw new Error('El servidor del tutor no está disponible.');
      const data = await res.json();
      if (!res.ok || !data.quechuaResponse) throw new Error(data.error || 'El tutor no pudo responder.');

      const modelMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'model',
        quechuaText: data.quechuaResponse,
        spanishTranslation: data.spanishTranslation,
        tokens: data.tokens,
        pedagogicalNote: data.pedagogicalNote,
        timestamp: 'Ahora',
      };
      setMessages([...real, modelMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        sender: 'model',
        quechuaText: (err as Error)?.message || 'El tutor no pudo responder.',
        spanishTranslation: '',
        timestamp: 'Ahora',
        isError: true,
      };
      setMessages([...history.filter((m) => !m.isError), errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputMessage).trim();
    if (!textToSend || loading) return;

    if (offlineMode) {
      answerDrill(textToSend);
      setInputMessage('');
      return;
    }

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      quechuaText: textToSend,
      spanishTranslation: '',
      timestamp: 'Ahora',
    };

    const updatedHistory = [...messages.filter((m) => !m.isError), userMsg];
    setMessages(updatedHistory);
    setInputMessage('');
    await requestReply(updatedHistory, textToSend);
  };

  const handleRetry = async () => {
    if (loading) return;
    const history = messages.filter((m) => !m.isError);
    const lastUser = [...history].reverse().find((m) => m.sender === 'user');
    if (!lastUser) return;
    await requestReply(history, lastUser.quechuaText);
  };

  const handleSaveToCorpusFromChat = (msg: ChatMessage) => {
    if (!msg.quechuaText || !msg.spanishTranslation) return;
    upsertPhrase('qu-es', {
      quechua: msg.quechuaText,
      spanish: msg.spanishTranslation,
      morphologicalBreakdown: (msg.tokens || []).map(t => t.surface).join(' ') || msg.quechuaText,
      gloss: (msg.tokens || []).map(t => t.gloss).join(' ') || '',
      grammaticalNotes: msg.pedagogicalNote || 'Frase generada por el tutor en conversación guiada.',
      tags: ['conversacion', practiceTheme],
      verified: true,
    });
    setSavedMessageIds(prev => ({ ...prev, [msg.id]: true }));
  };

  const toggleReveal = (id: string) => {
    setRevealedTranslations((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleExpandTokens = (id: string) => {
    setExpandedTokens((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {/* Header and Level / Topic Selector */}
      <div className="bg-stone-50 dark:bg-stone-900/60 p-5 sm:p-6 rounded-xl border border-stone-200 dark:border-stone-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Conversación Guiada en Quechua Cochabambino
            </h1>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
              Práctica interactiva contextualizada con tus tiempos verbales, pronombres y reglas lingüísticas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Content Drawer Toggle */}
            <button
              onClick={() => setIsContentDrawerOpen(!isContentDrawerOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                isContentDrawerOpen
                  ? 'bg-amber-700 text-white border-amber-800'
                  : 'bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-200 border-stone-300 dark:border-stone-700 hover:border-amber-500'
              }`}
              title="Abrir conjugador de verbos, pronombres, posesivos y reglas mid-chat"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>{isContentDrawerOpen ? 'Cerrar Banco' : 'Banco & Conjugador'}</span>
            </button>

            {/* Level Selector */}
            <div className="flex items-center gap-1 bg-white dark:bg-stone-950 p-1 rounded-lg border border-stone-200 dark:border-stone-800">
              {(['básico', 'intermedio', 'avanzado'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setUserLevel(lvl)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded capitalize transition-colors ${
                    userLevel === lvl
                      ? 'bg-amber-700 text-white'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                if (window.confirm('¿Reiniciar la conversación?')) {
                  setMessages([messages[0]]);
                  exitOfflineMode();
                }
              }}
              title="Reiniciar chat"
              className="p-2 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Thematic Focus Pills */}
        <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wide mr-1 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-600" /> Enfoque didáctico:
          </span>
          {[
            { id: 'general', label: 'General' },
            { id: 'verbs', label: 'Tiempos Verbales (-sha-, -rqa-, -sajku...)' },
            { id: 'negation', label: 'Negación (mana/ama...-chu, kanchu)' },
            { id: 'conditional', label: 'Condicional ((Sichus)...chayqa)' },
            { id: 'pronouns', label: 'Pronombres & Posesivos' },
            { id: 'corpus', label: 'Corpus Guardado' },
          ].map((theme) => (
            <button
              key={theme.id}
              onClick={() => setPracticeTheme(theme.id as PracticeTheme)}
              className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-colors ${
                practiceTheme === theme.id
                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800'
                  : 'bg-white dark:bg-stone-950 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800 hover:border-amber-300'
              }`}
            >
              {theme.label}
            </button>
          ))}
        </div>
      </div>

      {/* Integrated Content Drawer */}
      <IntegratedContentDrawer
        isOpen={isContentDrawerOpen}
        onClose={() => setIsContentDrawerOpen(false)}
        onInsertText={(text) => {
          setInputMessage(text);
        }}
        contextMode="chat"
      />

      {offlineMode && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex flex-wrap items-center justify-between gap-2">
          <span>
            Modo práctica sin IA · Aciertos: <span className="font-mono font-semibold">{score.ok}/{score.total}</span>
          </span>
          <button
            onClick={exitOfflineMode}
            className="px-2.5 py-1 font-semibold bg-amber-800 hover:bg-amber-900 text-white rounded-md"
          >
            Volver a la conversación con IA
          </button>
        </div>
      )}

      {/* Messages Feed */}
      <div className="space-y-4 max-h-[600px] overflow-y-auto p-1">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const isRevealed = revealedTranslations[msg.id] ?? false;
          const isExpanded = expandedTokens[msg.id] ?? false;
          const isSaved = savedMessageIds[msg.id] ?? false;

          if (msg.isError) {
            return (
              <div key={msg.id} className="flex flex-col items-start space-y-2">
                <div className="max-w-2xl p-4 rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-xs text-red-800 dark:text-red-300 space-y-2">
                  <div>{msg.quechuaText}</div>
                  <button
                    onClick={handleRetry}
                    disabled={loading}
                    className="px-3 py-1 bg-white dark:bg-stone-900 text-amber-800 dark:text-amber-400 font-semibold rounded border border-red-300 dark:border-red-800"
                  >
                    Reintentar
                  </button>
                  <button
                    onClick={startOfflineMode}
                    disabled={loading}
                    className="ml-2 px-3 py-1 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 font-semibold rounded border border-stone-300 dark:border-stone-700"
                  >
                    Practicar con mi corpus (sin IA)
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-2`}
            >
              <div
                className={`max-w-2xl p-5 rounded-2xl border transition-all ${
                  isUser
                    ? 'bg-amber-700 text-white border-amber-800 rounded-br-xs'
                    : 'bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 border-stone-200 dark:border-stone-800 rounded-bl-xs shadow-xs'
                }`}
              >
                {/* Speaker indicator */}
                <div className="flex items-center justify-between text-xs opacity-75 mb-2 gap-4">
                  <span className="font-semibold uppercase tracking-wider">
                    {isUser ? 'Qan (Tú)' : 'Yachacheq (Tutor Cochabambino)'}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>

                {/* Main Quechua text */}
                <div className="text-base font-medium font-display leading-relaxed whitespace-pre-line">
                  {msg.quechuaText}
                </div>

                {/* Cross-View Actions Bar on Every Message */}
                <div className="mt-3 pt-2.5 border-t border-black/10 dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Send to Translator button */}
                    <button
                      onClick={() => sendToTranslator(msg.quechuaText, 'qu-es')}
                      className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded transition-colors ${
                        isUser
                          ? 'bg-amber-800 hover:bg-amber-900 text-amber-100'
                          : 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-900 text-stone-700 dark:text-stone-300'
                      }`}
                      title="Analizar morfología y glosa de esta frase en el Traductor"
                    >
                      <ArrowRightLeft className="w-3 h-3 text-amber-400" />
                      <span>Analizar en Traductor</span>
                    </button>

                    {/* Save to Corpus button (for tutor replies) */}
                    {!isUser && msg.spanishTranslation && (
                      <button
                        onClick={() => handleSaveToCorpusFromChat(msg)}
                        disabled={isSaved}
                        className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded transition-colors ${
                          isSaved
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                            : 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-900 text-stone-700 dark:text-stone-300'
                        }`}
                        title="Guardar esta frase del tutor en tu corpus"
                      >
                        {isSaved ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>¡Guardada!</span>
                          </>
                        ) : (
                          <>
                            <BookOpen className="w-3 h-3 text-amber-600" />
                            <span>Guardar en Corpus</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Toggle translations and tokens for model messages */}
                  {!isUser && msg.spanishTranslation && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleReveal(msg.id)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:underline"
                      >
                        {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{isRevealed ? 'Ocultar' : 'Traducir'}</span>
                      </button>

                      {msg.tokens && msg.tokens.length > 0 && (
                        <button
                          onClick={() => toggleExpandTokens(msg.id)}
                          className="flex items-center gap-1 text-[11px] text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
                        >
                          <span>Morfología</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Model response extras: Spanish translation, tokens and pedagogical tip */}
                {!isUser && (
                  <>
                    {isRevealed && msg.spanishTranslation && (
                      <p className="mt-2 text-xs text-stone-600 dark:text-stone-400 italic bg-stone-50 dark:bg-stone-900 p-2.5 rounded-lg border border-stone-200 dark:border-stone-800">
                        "{msg.spanishTranslation}"
                      </p>
                    )}

                    {/* Morphological Breakdown Chips */}
                    {isExpanded && msg.tokens && (
                      <div className="mt-2 pt-2 flex flex-wrap gap-1.5 border-t border-stone-100 dark:border-stone-850">
                        {msg.tokens.map((token, i) => (
                          <button
                            key={i}
                            onClick={() => sendToTranslator(token.surface, 'qu-es')}
                            className="p-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-900 rounded text-xs font-mono border border-stone-200 dark:border-stone-800 text-left transition-colors"
                            title="Haz clic para analizar esta palabra en el Traductor"
                          >
                            <span className="font-bold text-stone-900 dark:text-stone-100">{token.surface}</span>
                            <span className="text-amber-700 dark:text-amber-400 ml-1">[{token.root}]</span>
                            <div className="text-[10px] text-stone-500">{token.gloss}</div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Pedagogical Tip */}
                    {msg.pedagogicalNote && (
                      <div className="mt-2 p-2.5 bg-amber-50/70 dark:bg-amber-950/30 rounded-lg text-xs text-amber-900 dark:text-amber-200 border border-amber-200/60 dark:border-amber-900/40">
                        <span className="font-bold block mb-0.5">Nota didáctica:</span>
                        {msg.pedagogicalNote}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 p-4 text-xs text-stone-500 italic">
            <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
            <span>El tutor está formulando la respuesta en Quechua Cochabambino...</span>
          </div>
        )}
      </div>

      {/* Dynamic Starters based on theme */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-stone-500">
          <span>Frases sugeridas para practicar ({practiceTheme}):</span>
          <span className="text-[11px] italic">Clic para enviar al tutor</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {dynamicStarters.map((starter, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(starter)}
              disabled={loading || offlineMode}
              className="px-2.5 py-1 text-xs bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-md text-stone-700 dark:text-stone-300 hover:border-amber-500 hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
            >
              {starter}
            </button>
          ))}
        </div>
      </div>

      {/* Input Bar */}
      <div className="bg-white dark:bg-stone-950 p-3 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSendMessage();
            }
          }}
          disabled={loading}
          placeholder={offlineMode ? 'Escribe tu traducción (o "pasar")...' : "Escribe en quechua o español para conversar (ej. 'Allinllachu kashanki, imatataj munanki?')..."}
          className="flex-1 px-3 py-2 text-sm bg-transparent border-none text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none"
        />

        <button
          onClick={() => handleSendMessage()}
          disabled={loading || !inputMessage.trim()}
          className="p-2.5 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white rounded-lg transition-colors shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
