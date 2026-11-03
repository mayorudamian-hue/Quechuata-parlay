import React, { useState } from 'react';
import { useQuechua } from '../context/QuechuaContext';
import { ChatMessage } from '../types/quechua';
import { 
  Send, 
  MessageSquare, 
  Sparkles, 
  Info, 
  Eye, 
  EyeOff, 
  RotateCcw,
  Volume2,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const ConversationView: React.FC = () => {
  const { grammarRules, phrases } = useQuechua();

  const [userLevel, setUserLevel] = useState<'básico' | 'intermedio' | 'avanzado'>('intermedio');
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [revealedTranslations, setRevealedTranslations] = useState<Record<string, boolean>>({});
  const [expandedTokens, setExpandedTokens] = useState<Record<string, boolean>>({});

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

  const quickStarters = [
    'Allinllachu kashanki, tata?',
    'Wasiypi kashani, qhichwata yachakushani',
    'Imatataj mikhunki paqarin?',
    'Paqarin jamusaqpuni llank\'aj',
    'Cochabamba llajtapi tiyakuni'
  ];

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputMessage).trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      quechuaText: textToSend,
      spanishTranslation: '',
      timestamp: 'Ahora',
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInputMessage('');
    setLoading(true);

    try {
      const payloadMessages = updatedHistory.map((m) => ({
        sender: m.sender,
        text: m.quechuaText,
      }));

      const res = await fetch('/api/quechua/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          userLevel,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json') || !res.ok) {
        throw new Error('Servicio de conversación en reconexión');
      }

      const data = await res.json();

      const modelMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'model',
        quechuaText: data.quechuaResponse,
        spanishTranslation: data.spanishTranslation,
        tokens: data.tokens,
        pedagogicalNote: data.pedagogicalNote,
        timestamp: 'Ahora',
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err) {
      console.log('Conversación en modo local:', (err as Error)?.message || 'reconexión');
      const fallbackMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'model',
        quechuaText: 'Wasiypi kashani, sumaqta parlariykusunchij. Allillanpuni kachun!',
        spanishTranslation: 'Estoy en mi casa, conversemos con cariño. ¡Que esté todo definitivamente bien!',
        pedagogicalNote: 'Recuerda usar "-puni" para confirmar certeza categórica y "-sha-" para el progresivo.',
        timestamp: 'Ahora',
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const toggleReveal = (id: string) => {
    setRevealedTranslations((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleExpandTokens = (id: string) => {
    setExpandedTokens((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {/* Header and Level Selector */}
      <div className="bg-stone-50 dark:bg-stone-900/60 p-6 rounded-xl border border-stone-200 dark:border-stone-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Conversación Guiada en Quechua Cochabambino
            </h1>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
              Práctica conversacional inmersiva entrenada con tus reglas gramaticales y vocabulario cochabambino.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-white dark:bg-stone-950 p-1 rounded-lg border border-stone-200 dark:border-stone-800">
              {(['básico', 'intermedio', 'avanzado'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setUserLevel(lvl)}
                  className={`px-3 py-1 text-xs font-semibold rounded capitalize transition-colors ${
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
                }
              }}
              title="Reiniciar chat"
              className="p-2 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="space-y-4 max-h-[600px] overflow-y-auto p-1">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const isRevealed = revealedTranslations[msg.id] ?? false;
          const isExpanded = expandedTokens[msg.id] ?? false;

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
                <div className="flex items-center justify-between text-xs opacity-75 mb-2">
                  <span className="font-semibold uppercase tracking-wider">
                    {isUser ? 'Qan (Tú)' : 'Yachacheq (Tutor Cochabambino)'}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>

                {/* Main Quechua text */}
                <div className="text-base font-medium font-display leading-relaxed">
                  {msg.quechuaText}
                </div>

                {/* Model response extras: Spanish translation, tokens and pedagogical tip */}
                {!isUser && msg.spanishTranslation && (
                  <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-850 space-y-2">
                    {/* Toggle Translation Button */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => toggleReveal(msg.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline"
                      >
                        {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{isRevealed ? 'Ocultar traducción' : 'Revelar traducción al español'}</span>
                      </button>

                      {msg.tokens && msg.tokens.length > 0 && (
                        <button
                          onClick={() => toggleExpandTokens(msg.id)}
                          className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
                        >
                          <span>Morfología</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>

                    {isRevealed && (
                      <p className="text-xs text-stone-600 dark:text-stone-400 italic bg-stone-50 dark:bg-stone-900 p-2.5 rounded-lg border border-stone-200 dark:border-stone-800">
                        "{msg.spanishTranslation}"
                      </p>
                    )}

                    {/* Morphological Breakdown Chips */}
                    {isExpanded && msg.tokens && (
                      <div className="pt-2 flex flex-wrap gap-1.5">
                        {msg.tokens.map((token, i) => (
                          <div
                            key={i}
                            className="p-1.5 bg-stone-100 dark:bg-stone-900 rounded text-xs font-mono border border-stone-200 dark:border-stone-800"
                          >
                            <span className="font-bold text-stone-900 dark:text-stone-100">{token.surface}</span>
                            <span className="text-amber-700 dark:text-amber-400 ml-1">[{token.root}]</span>
                            <div className="text-[10px] text-stone-500">{token.gloss}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Pedagogical Tip */}
                    {msg.pedagogicalNote && (
                      <div className="p-2.5 bg-amber-50/70 dark:bg-amber-950/30 rounded-lg text-xs text-amber-900 dark:text-amber-200 border border-amber-200/60 dark:border-amber-900/40">
                        <span className="font-bold block mb-0.5">Nota didáctica:</span>
                        {msg.pedagogicalNote}
                      </div>
                    )}
                  </div>
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

      {/* Quick response pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-stone-500 mr-1">Frases sugeridas:</span>
        {quickStarters.map((starter, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(starter)}
            disabled={loading}
            className="px-2.5 py-1 text-xs bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-md text-stone-700 dark:text-stone-300 hover:border-amber-500 transition-colors"
          >
            {starter}
          </button>
        ))}
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
          placeholder="Escribe en quechua o español para conversar (ej. 'Allinllachu kashanki, imatataj munanki?')..."
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
