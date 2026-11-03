import React, { useState } from 'react';
import { useQuechua } from '../context/QuechuaContext';
import { DoubtTrigger, DoubtStatus, CriticalDoubt } from '../types/quechua';
import { 
  AlertTriangle, 
  Layers, 
  Send, 
  Check, 
  HelpCircle, 
  Sparkles, 
  BookPlus, 
  Trash2, 
  FileText, 
  ArrowRight,
  Filter,
  CheckCircle2
} from 'lucide-react';

export const CriticalTermsPanel: React.FC = () => {
  const { 
    doubts, 
    setDoubtStatus, 
    applyCascadeCorrection, 
    deleteDoubt, 
    addRoot, 
    setActiveTab,
    addDoubt,
    autoScanCorpus
  } = useQuechua();

  const [activeTriggerFilter, setActiveTriggerFilter] = useState<'all' | DoubtTrigger>('all');
  const [activeStatusFilter, setActiveStatusFilter] = useState<'all' | DoubtStatus>('all');
  const [selectedDoubtForCascade, setSelectedDoubtForCascade] = useState<CriticalDoubt | null>(null);
  const [cascadeCorrectionText, setCascadeCorrectionText] = useState('');
  const [cascadeNote, setCascadeNote] = useState('');
  const [isSuccessToast, setIsSuccessToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: '' });
  const [deleteDoubtTarget, setDeleteDoubtTarget] = useState<CriticalDoubt | null>(null);

  // Add manual doubt modal
  const [isAddManualOpen, setIsAddManualOpen] = useState(false);
  const [manualDoubt, setManualDoubt] = useState({
    term: '',
    trigger: 'dialect_variant' as DoubtTrigger,
    contextPhrase: '',
    occurrences: 1,
    aiHypothesis: '',
    quechuistaQuestion: '',
    suggestedAction: '',
  });

  const filteredDoubts = doubts
    .filter((d) => {
      const matchTrigger = activeTriggerFilter === 'all' || d.trigger === activeTriggerFilter;
      const matchStatus = activeStatusFilter === 'all' || d.status === activeStatusFilter;
      return matchTrigger && matchStatus;
    })
    .sort((a, b) => b.occurrences - a.occurrences);

  const pendingCount = doubts.filter((d) => d.status === 'pending').length;
  const queuedCount = doubts.filter((d) => d.status === 'queued_for_expert').length;
  const resolvedCount = doubts.filter((d) => d.status === 'resolved').length;

  const handleOpenCascadeModal = (doubt: CriticalDoubt) => {
    setSelectedDoubtForCascade(doubt);
    // Suggest initial replacement if known
    if (doubt.term.toLowerCase() === 'kachkani') {
      setCascadeCorrectionText('kashani');
    } else if (doubt.term.toLowerCase().includes('chis')) {
      setCascadeCorrectionText(doubt.term.replace(/chis/g, 'nchij'));
    } else {
      setCascadeCorrectionText('');
    }
    setCascadeNote(`Corrección ortográfica/morfológica unificada a todo el corpus.`);
  };

  const handleExecuteCascade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoubtForCascade || !cascadeCorrectionText.trim()) return;

    const count = applyCascadeCorrection(
      selectedDoubtForCascade.term,
      cascadeCorrectionText.trim(),
      cascadeNote
    );

    setIsSuccessToast({
      show: true,
      msg: `¡Corrección en cascada aplicada! Se actualizaron ${count} frases en todo el corpus para "${selectedDoubtForCascade.term}" → "${cascadeCorrectionText}".`,
    });

    setSelectedDoubtForCascade(null);
    setTimeout(() => {
      setIsSuccessToast({ show: false, msg: '' });
    }, 4500);
  };

  const handleValidateAsLegitimateRoot = (doubt: CriticalDoubt) => {
    addRoot({
      quechua: doubt.term,
      spanish: doubt.aiHypothesis.slice(0, 50) || 'Término validado en Cochabamba',
      category: 'sustantivo',
      dialectNote: `Validado desde el Panel de Términos Críticos. Contexto: ${doubt.contextPhrase}`,
      verified: true,
      examples: [doubt.contextPhrase],
    });

    setDoubtStatus(
      doubt.id,
      'resolved',
      `Término validado e incorporado directamente al Glosario Oficial de Raíces Cochabambinas.`
    );

    setIsSuccessToast({
      show: true,
      msg: `"${doubt.term}" ha sido validado e incorporado al Glosario de Raíces.`,
    });
    setTimeout(() => {
      setIsSuccessToast({ show: false, msg: '' });
    }, 4000);
  };

  const handleCreateManualDoubt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualDoubt.term.trim()) return;

    addDoubt({
      ...manualDoubt,
      status: 'pending',
    });

    setManualDoubt({
      term: '',
      trigger: 'dialect_variant',
      contextPhrase: '',
      occurrences: 1,
      aiHypothesis: '',
      quechuistaQuestion: '',
      suggestedAction: '',
    });
    setIsAddManualOpen(false);
  };

  const handleAutoScan = () => {
    const count = autoScanCorpus();
    if (count > 0) {
      setIsSuccessToast({
        show: true,
        msg: `¡Escaneo completado! Se detectaron y registraron ${count} nuevo(s) término(s) crítico(s) del corpus.`,
      });
    } else {
      setIsSuccessToast({
        show: true,
        msg: `Escaneo completado: No se encontraron nuevas discrepancias o variantes ajenas en el corpus.`,
      });
    }
    setTimeout(() => setIsSuccessToast({ show: false, msg: '' }), 4500);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {isSuccessToast.show && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-900 dark:text-emerald-200 text-sm font-medium flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{isSuccessToast.msg}</span>
          </div>
          <button
            onClick={() => setIsSuccessToast({ show: false, msg: '' })}
            className="text-xs text-emerald-700 hover:text-emerald-900 ml-4 font-semibold"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Hero Header */}
      <div className="bg-stone-50 dark:bg-stone-900/60 p-6 rounded-xl border border-stone-200 dark:border-stone-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 rounded-md">
                <AlertTriangle className="w-4 h-4" />
              </span>
              <h1 className="font-display text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                Panel de Términos Críticos & Sesión de Validación
              </h1>
            </div>
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-400 max-w-3xl">
              Agrupación automática por frecuencia y disparadores. Corrige un término dudoso una sola vez y el modelo aplicará el cambio en cascada a todo el corpus, o envíalo a la lista de consulta quirúrgica para el quechuista.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleAutoScan}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/80 dark:hover:bg-amber-900/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 rounded-lg transition-colors shadow-xs"
              title="Escanear todas las frases del corpus para detectar variantes (-chka-, -chis, etc.)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              <span>Escanear Corpus</span>
            </button>
            <button
              onClick={() => setIsAddManualOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-lg transition-colors"
            >
              + Agregar Duda Manual
            </button>
            <button
              onClick={() => setActiveTab('consultation')}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-amber-700 hover:bg-amber-800 text-white rounded-lg transition-colors shadow-xs"
            >
              <span>Ver Lista del Quechuista</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3 Metric counters */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-stone-200 dark:border-stone-800">
          <div className="flex items-center justify-between p-3 bg-white dark:bg-stone-950 rounded-lg border border-stone-200 dark:border-stone-800">
            <span className="text-xs font-medium text-stone-600 dark:text-stone-400">
              Pendientes de Validación
            </span>
            <span className="font-mono text-lg font-bold text-amber-700 dark:text-amber-400 tabular-nums">
              {pendingCount}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-white dark:bg-stone-950 rounded-lg border border-stone-200 dark:border-stone-800">
            <span className="text-xs font-medium text-stone-600 dark:text-stone-400">
              En Cola para el Quechuista
            </span>
            <span className="font-mono text-lg font-bold text-blue-700 dark:text-blue-400 tabular-nums">
              {queuedCount}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-white dark:bg-stone-950 rounded-lg border border-stone-200 dark:border-stone-800">
            <span className="text-xs font-medium text-stone-600 dark:text-stone-400">
              Resueltos en Cascada
            </span>
            <span className="font-mono text-lg font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
              {resolvedCount}
            </span>
          </div>
        </div>

        {/* Disparadores Tabs (The 3 Triggers) */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider mr-1">
            Disparador:
          </span>
          <button
            onClick={() => setActiveTriggerFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTriggerFilter === 'all'
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                : 'bg-white dark:bg-stone-950 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800 hover:bg-stone-100'
            }`}
          >
            Todos ({doubts.length})
          </button>
          <button
            onClick={() => setActiveTriggerFilter('low_confidence')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTriggerFilter === 'low_confidence'
                ? 'bg-amber-700 text-white'
                : 'bg-white dark:bg-stone-950 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800 hover:bg-stone-100'
            }`}
          >
            1. Bajo Nivel de Confianza
          </button>
          <button
            onClick={() => setActiveTriggerFilter('dialect_variant')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTriggerFilter === 'dialect_variant'
                ? 'bg-blue-700 text-white'
                : 'bg-white dark:bg-stone-950 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800 hover:bg-stone-100'
            }`}
          >
            2. Variantes Dialectales (Cuzco/Ayacucho vs Cbba)
          </button>
          <button
            onClick={() => setActiveTriggerFilter('out_of_glossary')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTriggerFilter === 'out_of_glossary'
                ? 'bg-purple-700 text-white'
                : 'bg-white dark:bg-stone-950 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800 hover:bg-stone-100'
            }`}
          >
            3. Fuera de Glosario / Préstamos
          </button>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Estado:
            </span>
            <select
              value={activeStatusFilter}
              onChange={(e) => setActiveStatusFilter(e.target.value as 'all' | DoubtStatus)}
              className="px-2.5 py-1 text-xs bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-md text-stone-800 dark:text-stone-200"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="queued_for_expert">En cola quechuista</option>
              <option value="resolved">Resueltos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Critical Doubts List (Sorted by Frequency) */}
      <div className="space-y-4">
        {filteredDoubts.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
              No hay términos críticos pendientes con este filtro
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Tu corpus cochabambino está normalizado o todos los casos están clasificados.
            </p>
          </div>
        ) : (
          filteredDoubts.map((doubt) => {
            const triggerBadge = {
              low_confidence: { label: 'Bajo nivel de confianza', color: 'text-amber-700 dark:text-amber-400' },
              dialect_variant: { label: 'Variante dialectal no cochabambina', color: 'text-blue-700 dark:text-blue-400' },
              out_of_glossary: { label: 'Palabra fuera de glosario / Préstamo', color: 'text-purple-700 dark:text-purple-400' },
            }[doubt.trigger];

            return (
              <div
                key={doubt.id}
                className={`p-6 rounded-xl border transition-all ${
                  doubt.status === 'resolved'
                    ? 'bg-stone-50/70 dark:bg-stone-900/30 border-stone-200 dark:border-stone-800 opacity-75'
                    : 'bg-white dark:bg-stone-950 border-stone-200 dark:border-stone-800 hover:border-amber-500/50 shadow-xs'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    {/* Header line with term, frequency and trigger */}
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-xl font-bold text-stone-950 dark:text-stone-50">
                        "{doubt.term}"
                      </span>

                      <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                        <span className="font-mono font-semibold tabular-nums text-stone-800 dark:text-stone-200">
                          {doubt.occurrences} {doubt.occurrences === 1 ? 'ocurrencia' : 'ocurrencias en el dataset'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className={`font-medium ${triggerBadge.color}`}>
                          {triggerBadge.label}
                        </span>
                      </div>

                      {doubt.status === 'resolved' && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
                          Resuelto
                        </span>
                      )}
                      {doubt.status === 'queued_for_expert' && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300">
                          En cola quechuista
                        </span>
                      )}
                    </div>

                    {/* Context sentence */}
                    <div className="text-xs text-stone-600 dark:text-stone-400">
                      <span className="font-semibold text-stone-800 dark:text-stone-200">Contexto registrado:</span>{' '}
                      <span className="italic">"{doubt.contextPhrase}"</span>
                    </div>

                    {/* AI Hypothesis */}
                    <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-lg text-xs space-y-1">
                      <div className="font-medium text-stone-800 dark:text-stone-200">
                        <span className="text-stone-500">Diagnóstico IA:</span> {doubt.aiHypothesis}
                      </div>
                      <div className="text-stone-600 dark:text-stone-400">
                        <span className="font-semibold text-stone-700 dark:text-stone-300">Pregunta clínica:</span>{' '}
                        {doubt.quechuistaQuestion}
                      </div>
                      {doubt.suggestedAction && (
                        <div className="text-amber-800 dark:text-amber-400 font-medium">
                          <span className="text-stone-500">Acción recomendada:</span> {doubt.suggestedAction}
                        </div>
                      )}
                    </div>

                    {doubt.resolutionNote && (
                      <div className="text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30 p-2 rounded">
                        <span className="font-semibold">Resolución:</span> {doubt.resolutionNote}
                      </div>
                    )}
                  </div>

                  {/* Actions buttons */}
                  <div className="flex flex-wrap lg:flex-col items-end gap-2 shrink-0">
                    {doubt.status !== 'resolved' && (
                      <>
                        <button
                          onClick={() => handleOpenCascadeModal(doubt)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-700 hover:bg-amber-800 text-white rounded-lg transition-colors whitespace-nowrap shadow-xs"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>Corregir en Cascada</span>
                        </button>

                        <button
                          onClick={() => handleValidateAsLegitimateRoot(doubt)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-lg transition-colors whitespace-nowrap"
                        >
                          <BookPlus className="w-3.5 h-3.5" />
                          <span>Validar para Glosario</span>
                        </button>

                        {doubt.status !== 'queued_for_expert' && (
                          <button
                            onClick={() => setDoubtStatus(doubt.id, 'queued_for_expert')}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors whitespace-nowrap"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Añadir a Lista Quechuista</span>
                          </button>
                        )}
                      </>
                    )}

                    {doubt.status === 'resolved' && (
                      <button
                        onClick={() => setDoubtStatus(doubt.id, 'pending')}
                        className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 underline"
                      >
                        Reabrir caso
                      </button>
                    )}

                    <button
                      onClick={() => setDeleteDoubtTarget(doubt)}
                      className="p-1 text-stone-400 hover:text-red-600 transition-colors"
                      title="Eliminar de la lista"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL: CORRECCIÓN EN CASCADA UNIFICADA */}
      {/* ======================================================== */}
      {selectedDoubtForCascade && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-500 mb-1">
              <Layers className="w-5 h-5" />
              <h2 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
                Sesión de Validación: Corrección en Cascada
              </h2>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              Esta corrección se propagará automáticamente en todas las frases y notas del corpus donde aparezca el término dudoso.
            </p>

            <form onSubmit={handleExecuteCascade} className="mt-4 space-y-4">
              <div className="p-3 bg-stone-50 dark:bg-stone-950 rounded-lg space-y-1 text-xs">
                <div>
                  <span className="text-stone-500">Término actual a corregir:</span>{' '}
                  <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
                    "{selectedDoubtForCascade.term}"
                  </span>
                </div>
                <div>
                  <span className="text-stone-500">Ocurrencias estimadas:</span>{' '}
                  <span className="font-mono font-medium text-amber-700 dark:text-amber-400">
                    {selectedDoubtForCascade.occurrences} veces
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200">
                  Nuevo Término o Reemplazo Correcto para Cochabamba:
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. kashani"
                  value={cascadeCorrectionText}
                  onChange={(e) => setCascadeCorrectionText(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm font-mono font-semibold bg-stone-50 dark:bg-stone-950 border border-amber-300 dark:border-amber-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                  Nota explicativa de la resolución:
                </label>
                <input
                  type="text"
                  value={cascadeNote}
                  onChange={(e) => setCascadeNote(e.target.value)}
                  placeholder="ej. Normalización de progresivo -sha- cochabambino"
                  className="mt-1 w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDoubtForCascade(null)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-amber-700 hover:bg-amber-800 text-white rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Aplicar en Cascada a Todo el Corpus</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: AÑADIR DUDA MANUAL */}
      {/* ======================================================== */}
      {isAddManualOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 w-full max-w-lg p-6 shadow-xl">
            <h2 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
              Registrar Duda o Término Crítico Manualmente
            </h2>
            <form onSubmit={handleCreateManualDoubt} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                  Palabra o Morfema Dudoso
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. rimashan, kachkani, orapi"
                  value={manualDoubt.term}
                  onChange={(e) => setManualDoubt({ ...manualDoubt, term: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm font-mono bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                  Disparador
                </label>
                <select
                  value={manualDoubt.trigger}
                  onChange={(e) => setManualDoubt({ ...manualDoubt, trigger: e.target.value as DoubtTrigger })}
                  className="mt-1 w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                >
                  <option value="dialect_variant">Variante Dialectal (Cuzco/Ayacucho/otro valle)</option>
                  <option value="low_confidence">Bajo Nivel de Confianza (Duda estructural/gramatical)</option>
                  <option value="out_of_glossary">Fuera de Glosario / Préstamo hispano</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                  Frase de Contexto
                </label>
                <input
                  type="text"
                  placeholder="ej. Paywan rimashani..."
                  value={manualDoubt.contextPhrase}
                  onChange={(e) => setManualDoubt({ ...manualDoubt, contextPhrase: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                  Hipótesis o Sospecha
                </label>
                <textarea
                  rows={2}
                  placeholder="ej. Posible forma cusqueña; en Cochabamba se dice parlashani..."
                  value={manualDoubt.aiHypothesis}
                  onChange={(e) => setManualDoubt({ ...manualDoubt, aiHypothesis: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                  Pregunta para formular al Quechuista
                </label>
                <textarea
                  rows={2}
                  placeholder="ej. ¿Se utiliza esta palabra en el quechua cochabambino coloquial o debe reemplazarse?"
                  value={manualDoubt.quechuistaQuestion}
                  onChange={(e) => setManualDoubt({ ...manualDoubt, quechuistaQuestion: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddManualOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-amber-700 hover:bg-amber-800 text-white rounded-lg"
                >
                  Registrar en el Panel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Confirmación de Eliminación de Duda */}
      {deleteDoubtTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 w-full max-w-sm p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-stone-900 dark:text-stone-100">
                  ¿Eliminar término crítico?
                </h3>
                <p className="text-xs text-stone-500">
                  Panel de Términos Críticos
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300">
              ¿Deseas descartar el registro del término <span className="font-mono font-bold text-stone-900 dark:text-stone-100">"{deleteDoubtTarget.term}"</span>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteDoubtTarget(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteDoubt(deleteDoubtTarget.id);
                  setDeleteDoubtTarget(null);
                  setIsSuccessToast({ show: true, msg: `Término "${deleteDoubtTarget.term}" eliminado del panel.` });
                  setTimeout(() => setIsSuccessToast({ show: false, msg: '' }), 3500);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
