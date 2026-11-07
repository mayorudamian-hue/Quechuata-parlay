import React, { useState } from 'react';
import { BookOpen, Info, ArrowRight, MessageSquare, ArrowRightLeft, Sparkles } from 'lucide-react';
import {
  PERSON_KEYS,
  PERSON_LABELS,
  VERB_SLOT_ORDER,
  VERB_SPECIAL_FORMS,
  VERB_TENSES,
  joinTense,
} from '../data/verbTenses';
import { useQuechua } from '../context/QuechuaContext';

export const VerbTensesGuide: React.FC = () => {
  const { sendToTranslator, sendToChat } = useQuechua();
  const [testVerb, setTestVerb] = useState('mikhuy');

  const base = testVerb.trim().replace(/y$/i, '') || 'mikhu';

  return (
    <section
      className="space-y-5 rounded-xl border border-amber-200 bg-amber-50/70 p-5 dark:border-amber-900/60 dark:bg-amber-950/20"
      aria-labelledby="verb-tenses-title"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden="true" />
          <div>
            <h2 id="verb-tenses-title" className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
              Tiempos Verbales del Quechua Cochabambino
            </h2>
            <p className="mt-1 text-sm text-stone-700 dark:text-stone-300">
              Fuente lingüística oficial que nutre tanto a la IA como al motor nativo sin conexión. Orden del verbo:{' '}
              <span className="font-mono text-xs">{VERB_SLOT_ORDER}</span>.
            </p>
          </div>
        </div>

        {/* Live verb root tester */}
        <div className="flex items-center gap-2 bg-white dark:bg-stone-900 p-2 rounded-lg border border-stone-200 dark:border-stone-800 shrink-0">
          <span className="text-xs text-stone-500 font-semibold">Probar raíz verbal:</span>
          <input
            type="text"
            value={testVerb}
            onChange={(e) => setTestVerb(e.target.value)}
            placeholder="mikhuy, jamuy..."
            className="w-24 px-2 py-1 text-xs font-mono font-bold bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded text-stone-900 dark:text-stone-100 focus:outline-none"
          />
        </div>
      </div>

      {/* Main Verb Tense Table */}
      <div className="overflow-x-auto rounded-lg border border-stone-200 dark:border-stone-800">
        <table className="w-full min-w-[950px] text-left text-sm">
          <thead className="bg-white text-xs uppercase tracking-wide text-stone-500 dark:bg-stone-900 dark:text-stone-400">
            <tr>
              <th scope="col" className="px-3 py-2">Tiempo / Aspecto</th>
              {PERSON_KEYS.map((k) => (
                <th key={k} scope="col" className="px-3 py-2">
                  {PERSON_LABELS[k].short}
                  <span className="block font-mono normal-case text-[10px] text-stone-400">{PERSON_LABELS[k].pronoun}</span>
                </th>
              ))}
              <th scope="col" className="px-3 py-2 text-right">Transferir</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 bg-white dark:divide-stone-800 dark:bg-stone-950">
            {VERB_TENSES.map((t) => (
              <React.Fragment key={t.id}>
                <tr className="hover:bg-amber-50/40 dark:hover:bg-amber-950/20">
                  <th scope="row" className="px-3 pt-2.5 align-top font-medium text-stone-800 dark:text-stone-200">
                    <span className="font-bold">{t.name}</span>
                    <span className="block font-mono text-[10px] font-normal text-stone-500">
                      {t.gloss}{t.marker ? ` · ${t.marker}` : ''}
                    </span>
                  </th>
                  {PERSON_KEYS.map((k) => {
                    const c = t.cells[k];
                    const conjugatedWithTest = c.suf ? `${base}${joinTense(t.marker, c.suf).replace(/^-/, '')}` : '';
                    
                    return (
                      <td key={k} className="px-3 pt-2.5 align-top font-mono">
                        {c.suf ? (
                          <button
                            onClick={() => sendToTranslator(conjugatedWithTest, 'qu-es')}
                            className="group text-left"
                            title={`Probar "${conjugatedWithTest}" en el traductor`}
                          >
                            <span
                              className={`block font-semibold group-hover:underline ${c.confirm ? 'text-stone-500 dark:text-stone-400' : 'text-amber-800 dark:text-amber-400'}`}
                            >
                              {joinTense(t.marker, c.suf)}
                              {c.confirm && <sup className="ml-0.5 text-amber-600">?</sup>}
                            </span>
                            <span className="block text-[10px] text-stone-400 group-hover:text-amber-700">
                              {conjugatedWithTest}
                            </span>
                          </button>
                        ) : (
                          <span className="text-stone-300 dark:text-stone-700">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-3 pt-2.5 align-top text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => sendToTranslator(t.example.quechua, 'qu-es')}
                        className="px-2 py-0.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 text-[10px] font-semibold text-stone-700 dark:text-stone-300 rounded"
                        title="Probar ejemplo en el Traductor"
                      >
                        Traductor
                      </button>
                      <button
                        onClick={() => sendToChat(t.example.quechua)}
                        className="px-2 py-0.5 bg-amber-700 hover:bg-amber-800 text-white text-[10px] font-semibold rounded"
                        title="Llevar ejemplo al Chat"
                      >
                        Chat
                      </button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td colSpan={PERSON_KEYS.length + 2} className="px-3 pb-2 text-xs text-stone-600 dark:text-stone-400 bg-stone-50/50 dark:bg-stone-900/40">
                    <span className="italic">{t.usage}</span>{' '}
                    <span className="font-mono font-semibold text-stone-900 dark:text-stone-100">{t.example.morphology}</span>
                    {' '}({t.example.gloss}) = <strong>{t.example.spanish}</strong>
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Special Verbal Forms & Constructions */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200">
          Formas no finitas y construcciones (con transferencia con un clic)
        </h3>
        <div className="overflow-x-auto rounded-lg border border-stone-200 dark:border-stone-800">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-white text-xs uppercase tracking-wide text-stone-500 dark:bg-stone-900 dark:text-stone-400">
              <tr>
                <th scope="col" className="px-3 py-2">Forma</th>
                <th scope="col" className="px-3 py-2">Nombre</th>
                <th scope="col" className="px-3 py-2">Uso</th>
                <th scope="col" className="px-3 py-2">Ejemplo</th>
                <th scope="col" className="px-3 py-2 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 bg-white dark:divide-stone-800 dark:bg-stone-950">
              {VERB_SPECIAL_FORMS.map((f) => (
                <tr key={f.form} className="hover:bg-amber-50/30 dark:hover:bg-amber-950/20">
                  <td className="px-3 py-2 font-mono font-semibold text-amber-800 dark:text-amber-400">{f.form}</td>
                  <td className="px-3 py-2 text-stone-800 dark:text-stone-200">
                    {f.name} <span className="font-mono text-[10px] text-stone-500">{f.gloss}</span>
                  </td>
                  <td className="px-3 py-2 text-stone-600 dark:text-stone-400 text-xs">{f.usage}</td>
                  <td className="px-3 py-2 text-stone-800 dark:text-stone-200 text-xs">
                    <span className="font-mono font-bold">{f.example}</span> = {f.translation}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => sendToTranslator(f.example.split(' ')[0], 'qu-es')}
                      className="px-2 py-0.5 bg-amber-700 hover:bg-amber-800 text-white rounded text-[10px] font-semibold"
                    >
                      Probar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="flex items-start gap-2 text-[11px] text-stone-500 dark:text-stone-400">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>
          Las celdas con <strong>?</strong> no están en el banco de sufijos o se derivaron por analogía; las celdas con — no tienen forma documentada.
          Valida con un quechuista antes de tratarlas como normativas.
        </span>
      </p>
    </section>
  );
};
