import React, { useState } from 'react';
import { useQuechua } from '../context/QuechuaContext';
import { CriticalDoubt } from '../types/quechua';
import { 
  FileCheck2, 
  Printer, 
  Download, 
  Copy, 
  Check, 
  BookOpen, 
  CheckCircle2, 
  ExternalLink,
  Filter,
  MessageSquare,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';

export const QuechuistaConsultationView: React.FC = () => {
  const { doubts, setDoubtStatus, applyCascadeCorrection, addRoot } = useQuechua();

  const [filterMode, setFilterMode] = useState<'queued' | 'all'>('queued');
  const [copied, setCopied] = useState(false);
  const [expertNotes, setExpertNotes] = useState<Record<string, string>>({});
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [activeDoubtToResolve, setActiveDoubtToResolve] = useState<CriticalDoubt | null>(null);
  const [verdictType, setVerdictType] = useState<'valid' | 'replace'>('replace');
  const [replacementTerm, setReplacementTerm] = useState('');
  const [verdictExplanation, setVerdictExplanation] = useState('');

  const consultList = doubts.filter((d) => 
    filterMode === 'queued' ? d.status === 'queued_for_expert' : d.status !== 'resolved'
  );

  const handleCopyMarkdown = () => {
    let md = `# CONSULTA LINGÜÍSTICA - QUECHUA COCHABAMBINO\n`;
    md += `Fecha: ${new Date().toLocaleDateString()}\n`;
    md += `Total de casos difíciles a consultar: ${consultList.length}\n\n`;

    consultList.forEach((item, idx) => {
      md += `### ${idx + 1}. Término: "${item.term}" (${item.occurrences} ocurrencias)\n`;
      md += `- **Disparador:** ${item.trigger}\n`;
      md += `- **Contexto:** "${item.contextPhrase}"\n`;
      md += `- **Hipótesis del Modelo:** ${item.aiHypothesis}\n`;
      md += `- **Pregunta Quirúrgica para el Quechuista:** ${item.quechuistaQuestion}\n`;
      md += `- **Dictamen del Especialista:** _____________________________________\n\n`;
    });

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Termino', 'Disparador', 'Ocurrencias', 'Frase_Contexto', 'Hipotesis_IA', 'Pregunta_Quechuista', 'Dictamen_Experto'];
    const rows = consultList.map((c) => [
      c.id,
      `"${c.term.replace(/"/g, '""')}"`,
      c.trigger,
      c.occurrences,
      `"${c.contextPhrase.replace(/"/g, '""')}"`,
      `"${c.aiHypothesis.replace(/"/g, '""')}"`,
      `"${c.quechuistaQuestion.replace(/"/g, '""')}"`,
      `"${(expertNotes[c.id] || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `consulta-quechuista-cochabamba-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleOpenResolutionModal = (doubt: CriticalDoubt) => {
    setActiveDoubtToResolve(doubt);
    setVerdictExplanation(expertNotes[doubt.id] || '');
    if (doubt.term.toLowerCase() === 'kachkani') {
      setReplacementTerm('kashani');
    } else {
      setReplacementTerm('');
    }
    setIsResolveModalOpen(true);
  };

  const handleExecuteResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDoubtToResolve) return;

    if (verdictType === 'replace' && replacementTerm.trim()) {
      applyCascadeCorrection(
        activeDoubtToResolve.term,
        replacementTerm.trim(),
        `Dictamen del quechuista: ${verdictExplanation || 'Reemplazo normalizado para Cochabamba.'}`
      );
    } else if (verdictType === 'valid') {
      addRoot({
        quechua: activeDoubtToResolve.term,
        spanish: activeDoubtToResolve.aiHypothesis.slice(0, 50) || 'Validado por quechuista',
        category: 'sustantivo',
        dialectNote: `Certificado por quechuista: ${verdictExplanation || 'Uso cochabambino legítimo'}`,
        verified: true,
        examples: [activeDoubtToResolve.contextPhrase],
      });
      setDoubtStatus(
        activeDoubtToResolve.id,
        'resolved',
        `Validado por quechuista: ${verdictExplanation || 'Confirmado para la variante cochabambina.'}`
      );
    }

    setIsResolveModalOpen(false);
    setActiveDoubtToResolve(null);
  };

  return (
    <div className="space-y-6">
      {/* Printable Sheet View for Printing */}
      <div className="hidden print:block p-8 bg-white text-stone-900 space-y-6">
        <div className="border-b-2 border-stone-800 pb-4">
          <h1 className="text-2xl font-bold uppercase tracking-wider">
            Consulta Lingüística Especializada: Quechua Cochabambino
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            Plataforma Qhawana · Batería de preguntas morfosintácticas y dialectales para el quechuista
          </p>
          <div className="mt-3 flex gap-8 text-xs font-mono">
            <div>Fecha: {new Date().toLocaleDateString()}</div>
            <div>Consultor / Experto: ___________________________</div>
            <div>Investigador: ___________________________</div>
          </div>
        </div>

        <div className="space-y-6">
          {consultList.map((item, idx) => (
            <div key={item.id} className="border-b border-stone-300 pb-4 space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-base">
                  #{idx + 1}. Término en duda: "{item.term}"
                </span>
                <span className="text-xs uppercase font-mono">
                  Disparador: {item.trigger} | Frecuencia: {item.occurrences}
                </span>
              </div>
              <div className="text-xs">
                <strong>Frase contexto:</strong> <em>"{item.contextPhrase}"</em>
              </div>
              <div className="text-xs">
                <strong>Pregunta clínica para el especialista:</strong> {item.quechuistaQuestion}
              </div>
              <div className="text-xs">
                <strong>Hipótesis de la IA:</strong> {item.aiHypothesis}
              </div>
              <div className="mt-3 p-3 border border-dashed border-stone-400 min-h-[60px] text-xs">
                <strong>Dictamen del Quechuista:</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Screen Interface Header */}
      <div className="print:hidden bg-stone-50 dark:bg-stone-900/60 p-6 rounded-xl border border-stone-200 dark:border-stone-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 rounded-md">
                <FileCheck2 className="w-4 h-4" />
              </span>
              <h1 className="font-display text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                Lista de Consulta para el Quechuista
              </h1>
            </div>
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-400 max-w-3xl">
              Reporte estructurado para presentar ante un lingüista o hablante nativo experto. Contiene exclusivamente los casos no resueltos formulados como preguntas clínicas precisas para maximizar el valor de su tiempo.
            </p>
          </div>

          {/* Action buttons: Print, CSV, Copy */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-900 text-stone-800 dark:text-stone-200 rounded-lg transition-colors shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '¡Copiado!' : 'Copiar Texto'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-900 text-stone-800 dark:text-stone-200 rounded-lg transition-colors shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Exportar Excel/CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Guardar PDF</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="mt-6 flex items-center justify-between pt-4 border-t border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Mostrar:
            </span>
            <button
              onClick={() => setFilterMode('queued')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                filterMode === 'queued'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              Solo en cola para consulta ({doubts.filter((d) => d.status === 'queued_for_expert').length})
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                filterMode === 'all'
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              Todos los no resueltos ({doubts.filter((d) => d.status !== 'resolved').length})
            </button>
          </div>

          <div className="text-xs text-stone-500">
            {consultList.length} {consultList.length === 1 ? 'caso quirúrgico preparado' : 'casos quirúrgicos preparados'}
          </div>
        </div>
      </div>

      {/* Consultation Cards List */}
      <div className="print:hidden space-y-4">
        {consultList.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800">
            <FileCheck2 className="w-8 h-8 text-stone-400 mx-auto mb-2" />
            <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
              No hay términos asignados a la lista del quechuista
            </h3>
            <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
              Ve al Panel de Términos Críticos y presiona "Añadir a Lista Quechuista" en aquellos casos donde tengas dudas estructurales o dialectales.
            </p>
          </div>
        ) : (
          consultList.map((item, index) => (
            <div
              key={item.id}
              className="bg-white dark:bg-stone-950 p-6 rounded-xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold px-2 py-1 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded">
                    #{index + 1}
                  </span>
                  <div>
                    <h3 className="font-mono text-xl font-bold text-stone-900 dark:text-stone-100">
                      "{item.term}"
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                      <span className="font-medium text-amber-700 dark:text-amber-400">
                        {item.trigger === 'dialect_variant'
                          ? 'Variante Dialectal'
                          : item.trigger === 'low_confidence'
                          ? 'Bajo Nivel de Confianza'
                          : 'Fuera de Glosario / Préstamo'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{item.occurrences} apariciones</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenResolutionModal(item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition-colors whitespace-nowrap shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Aplicar Dictamen del Experto</span>
                  </button>

                  <button
                    onClick={() => setDoubtStatus(item.id, 'pending')}
                    className="px-2.5 py-1.5 text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 rounded"
                    title="Devolver a pendientes sin cola"
                  >
                    Quitar de lista
                  </button>
                </div>
              </div>

              {/* Context Block */}
              <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-lg text-xs space-y-1.5">
                <div>
                  <span className="font-semibold text-stone-700 dark:text-stone-300">Frase de contexto:</span>{' '}
                  <span className="font-mono text-stone-900 dark:text-stone-100 italic">
                    "{item.contextPhrase}"
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-stone-700 dark:text-stone-300">Hipótesis de partida:</span>{' '}
                  <span className="text-stone-600 dark:text-stone-400">{item.aiHypothesis}</span>
                </div>
              </div>

              {/* Surgical Question for the Expert */}
              <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 rounded-lg text-xs space-y-1">
                <span className="font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider block">
                  Pregunta Quirúrgica para el Quechuista:
                </span>
                <p className="text-stone-900 dark:text-stone-100 font-medium text-sm leading-snug">
                  {item.quechuistaQuestion}
                </p>
              </div>

              {/* Note input for when interviewing the expert */}
              <div>
                <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                  Anotaciones o respuestas del especialista durante la consulta:
                </label>
                <input
                  type="text"
                  placeholder="ej. El quechuista indica que en Cochabamba se usa kashani siempre..."
                  value={expertNotes[item.id] || item.resolutionNote || ''}
                  onChange={(e) => setExpertNotes({ ...expertNotes, [item.id]: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL: REGISTRAR RESOLUCIÓN TRAS CONSULTA */}
      {/* ======================================================== */}
      {isResolveModalOpen && activeDoubtToResolve && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 w-full max-w-lg p-6 shadow-2xl">
            <h2 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
              Registrar Dictamen para "{activeDoubtToResolve.term}"
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
              ¿Qué indicó el quechuista sobre este término?
            </p>

            <form onSubmit={handleExecuteResolution} className="mt-4 space-y-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-medium text-stone-800 dark:text-stone-200 cursor-pointer">
                  <input
                    type="radio"
                    name="verdictType"
                    checked={verdictType === 'replace'}
                    onChange={() => setVerdictType('replace')}
                    className="text-amber-700"
                  />
                  <span>Reemplazar por término cochabambino correcto (en cascada)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-stone-800 dark:text-stone-200 cursor-pointer">
                  <input
                    type="radio"
                    name="verdictType"
                    checked={verdictType === 'valid'}
                    onChange={() => setVerdictType('valid')}
                    className="text-amber-700"
                  />
                  <span>Validar como legítimo cochabambino e incorporar al glosario de raíces</span>
                </label>
              </div>

              {verdictType === 'replace' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200">
                    Término exacto corregido:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. kashani"
                    value={replacementTerm}
                    onChange={(e) => setReplacementTerm(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-sm font-mono font-semibold bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                  Dictamen o fundamento del especialista:
                </label>
                <textarea
                  rows={2}
                  placeholder="ej. Confirmado: la variante -sha- es la única natural en el valle central..."
                  value={verdictExplanation}
                  onChange={(e) => setVerdictExplanation(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResolveModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition-colors"
                >
                  Confirmar Dictamen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
