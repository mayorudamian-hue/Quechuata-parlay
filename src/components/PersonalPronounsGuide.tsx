import React from 'react';
import { ArrowRightLeft, BookOpen } from 'lucide-react';

const pronouns = [
  { person: '1.ª singular', form: 'noqa', spanish: 'yo', note: 'Hablante único.' },
  { person: '2.ª singular', form: 'qan', spanish: 'tú / vos / usted', note: 'Oyente único.' },
  { person: '3.ª singular', form: 'pay', spanish: 'él / ella', note: 'Sin distinción de género.' },
  { person: '1.ª plural inclusiva', form: 'noqanchej', spanish: 'nosotros (tú y yo)', note: 'Incluye al oyente; grafía cochabambina con j.' },
  { person: '1.ª plural exclusiva', form: 'noqayku', spanish: 'nosotros (sin ti)', note: 'Excluye al oyente.' },
  { person: '2.ª plural', form: 'qankuna', spanish: 'ustedes / vosotros', note: 'qan + pluralizador -kuna.' },
  { person: '3.ª plural', form: 'paykuna', spanish: 'ellos / ellas', note: 'pay + pluralizador -kuna; sin género.' },
];

const examples = [
  { quechua: 'Noqanchej risaqchij.', spanish: 'Nosotros (tú y yo) iremos.' },
  { quechua: 'Noqayku jamushayku.', spanish: 'Nosotros (sin incluirte) vamos a venir.' },
  { quechua: 'Qankuna imata ruwashankichij?', spanish: '¿Qué están haciendo ustedes?' },
  { quechua: 'Paykuna wasiypi kashanku.', spanish: 'Ellos/ellas están en la casa.' },
];

export const PersonalPronounsGuide: React.FC = () => (
  <section className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/70 p-5 dark:border-amber-900/60 dark:bg-amber-950/20" aria-labelledby="personal-pronouns-title">
    <div className="flex items-start gap-3">
      <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden="true" />
      <div>
        <h2 id="personal-pronouns-title" className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">Pronombres personales cochabambinos</h2>
        <p className="mt-1 text-sm text-stone-700 dark:text-stone-300">
          La primera persona plural distingue si se incluye o no a la persona interlocutora. <strong>Pay</strong> no expresa género; la grafía local usa <strong>-nchej / -nchij</strong>, no la forma peruana <strong>-nchik</strong>.
        </p>
      </div>
    </div>

    <div className="overflow-x-auto rounded-lg border border-stone-200 dark:border-stone-800">
      <table className="w-full min-w-[620px] text-left text-sm">
        <thead className="bg-white text-xs uppercase tracking-wide text-stone-500 dark:bg-stone-900 dark:text-stone-400">
          <tr>
            <th scope="col" className="px-3 py-2">Persona</th>
            <th scope="col" className="px-3 py-2">Quechua</th>
            <th scope="col" className="px-3 py-2">Español</th>
            <th scope="col" className="px-3 py-2">Nota</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-200 bg-white dark:divide-stone-800 dark:bg-stone-950">
          {pronouns.map((pronoun) => (
            <tr key={pronoun.form}>
              <th scope="row" className="px-3 py-2 font-medium text-stone-700 dark:text-stone-300">{pronoun.person}</th>
              <td className="px-3 py-2 font-mono font-semibold text-amber-800 dark:text-amber-400">{pronoun.form}</td>
              <td className="px-3 py-2 text-stone-800 dark:text-stone-200">{pronoun.spanish}</td>
              <td className="px-3 py-2 text-stone-600 dark:text-stone-400">{pronoun.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-800 dark:text-stone-200">
        <ArrowRightLeft className="h-4 w-4 text-amber-700 dark:text-amber-400" aria-hidden="true" />
        Ejemplos para probar en el traductor
      </h3>
      <ul className="grid gap-2 sm:grid-cols-2">
        {examples.map((example) => (
          <li key={example.quechua} className="rounded-lg border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-950">
            <p className="font-mono text-sm font-semibold text-stone-900 dark:text-stone-100">{example.quechua}</p>
            <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">{example.spanish}</p>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-stone-500 dark:text-stone-400">Frases didácticas ilustrativas; verificar con un hablante experto antes de tratarlas como formas normativas.</p>
    </div>
  </section>
);
