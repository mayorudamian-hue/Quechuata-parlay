import React from 'react';
import { BookOpen, Info } from 'lucide-react';
import {
  PERSON_KEYS,
  PERSON_LABELS,
  VERB_SLOT_ORDER,
  VERB_SPECIAL_FORMS,
  VERB_TENSES,
  joinTense,
} from '../data/verbTenses';

export const VerbTensesGuide: React.FC = () => (
  <section
    className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/70 p-5 dark:border-amber-900/60 dark:bg-amber-950/20"
    aria-labelledby="verb-tenses-title"
  >
    <div className="flex items-start gap-3">
      <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden="true" />
      <div>
        <h2 id="verb-tenses-title" className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
          Tiempos verbales del quechua cochabambino
        </h2>
        <p className="mt-1 text-sm text-stone-700 dark:text-stone-300">
          Este cuadro es la fuente que usan la IA y el motor sin IA. Orden del verbo:{' '}
          <span className="font-mono text-xs">{VERB_SLOT_ORDER}</span>.
        </p>
      </div>
    </div>

    <div className="overflow-x-auto rounded-lg border border-stone-200 dark:border-stone-800">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="bg-white text-xs uppercase tracking-wide text-stone-500 dark:bg-stone-900 dark:text-stone-400">
          <tr>
            <th scope="col" className="px-3 py-2">Tiempo</th>
            {PERSON_KEYS.map((k) => (
              <th key={k} scope="col" className="px-3 py-2">
                {PERSON_LABELS[k].short}
                <span className="block font-mono normal-case text-[10px] text-stone-400">{PERSON_LABELS[k].pronoun}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-200 bg-white dark:divide-stone-800 dark:bg-stone-950">
          {VERB_TENSES.map((t) => (
            <React.Fragment key={t.id}>
              <tr>
                <th scope="row" className="px-3 pt-2 align-top font-medium text-stone-800 dark:text-stone-200">
                  {t.name}
                  <span className="block font-mono text-[10px] font-normal text-stone-500">
                    {t.gloss}{t.marker ? ` · ${t.marker}` : ''}
                  </span>
                </th>
                {PERSON_KEYS.map((k) => {
                  const c = t.cells[k];
                  return (
                    <td key={k} className="px-3 pt-2 align-top font-mono font-semibold">
                      {c.suf ? (
                        <span
                          className={c.confirm ? 'text-stone-500 dark:text-stone-400' : 'text-amber-800 dark:text-amber-400'}
                          title={c.confirm ? 'Por confirmar con un quechuista' : undefined}
                        >
                          {joinTense(t.marker, c.suf)}
                          {c.confirm && <sup className="ml-0.5 text-amber-600">?</sup>}
                        </span>
                      ) : (
                        <span className="text-stone-300 dark:text-stone-700">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td colSpan={PERSON_KEYS.length + 1} className="px-3 pb-2 text-xs text-stone-600 dark:text-stone-400">
                  {t.usage}{' '}
                  <span className="font-mono text-stone-800 dark:text-stone-200">{t.example.morphology}</span>
                  {' '}({t.example.gloss}) = {t.example.spanish}
                </td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>

    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200">Formas no finitas y construcciones</h3>
      <div className="overflow-x-auto rounded-lg border border-stone-200 dark:border-stone-800">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="bg-white text-xs uppercase tracking-wide text-stone-500 dark:bg-stone-900 dark:text-stone-400">
            <tr>
              <th scope="col" className="px-3 py-2">Forma</th>
              <th scope="col" className="px-3 py-2">Nombre</th>
              <th scope="col" className="px-3 py-2">Uso</th>
              <th scope="col" className="px-3 py-2">Ejemplo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 bg-white dark:divide-stone-800 dark:bg-stone-950">
            {VERB_SPECIAL_FORMS.map((f) => (
              <tr key={f.form}>
                <td className="px-3 py-2 font-mono font-semibold text-amber-800 dark:text-amber-400">{f.form}</td>
                <td className="px-3 py-2 text-stone-800 dark:text-stone-200">
                  {f.name} <span className="font-mono text-[10px] text-stone-500">{f.gloss}</span>
                </td>
                <td className="px-3 py-2 text-stone-600 dark:text-stone-400">{f.usage}</td>
                <td className="px-3 py-2 text-stone-800 dark:text-stone-200">
                  <span className="font-mono">{f.example}</span> = {f.translation}
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
        Valida con un quechuista antes de tratarlas como normativas. Para corregir el cuadro, edita <code>src/data/verbTenses.ts</code>.
      </span>
    </p>
  </section>
);
