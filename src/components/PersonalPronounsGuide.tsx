import React, { useState } from 'react';
import { 
  ArrowRightLeft, 
  BookOpen, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  MessageSquare, 
  Layers, 
  ArrowRight 
} from 'lucide-react';
import { useQuechua } from '../context/QuechuaContext';

const pronouns = [
  { person: '1.ª singular', form: 'noqa', spanish: 'yo', note: 'Hablante único.' },
  { person: '2.ª singular', form: 'qan', spanish: 'tú / vos / usted', note: 'Oyente único.' },
  { person: '3.ª singular', form: 'pay', spanish: 'él / ella', note: 'Sin distinción de género gramatical.' },
  { person: '1.ª plural inclusiva', form: 'noqanchej', spanish: 'nosotros (tú y yo)', note: 'Incluye al oyente; grafía cochabambina con j.' },
  { person: '1.ª plural exclusiva', form: 'noqayku', spanish: 'nosotros (sin ti)', note: 'Excluye al oyente (ellos y yo, no tú).' },
  { person: '2.ª plural', form: 'qankuna', spanish: 'ustedes / vosotros', note: 'qan + pluralizador -kuna.' },
  { person: '3.ª plural', form: 'paykuna', spanish: 'ellos / ellas', note: 'pay + pluralizador -kuna; sin género.' },
];

const possessiveSuffixes = [
  { person: '1.ª sg', vowelSuf: '-y', consSuf: '-ni-y', exampleVowel: 'wasiy (mi casa)', exampleCons: 'yawarniy (mi sangre)', meaning: 'mi / mío' },
  { person: '2.ª sg', vowelSuf: '-yki', consSuf: '-ni-yki', exampleVowel: 'wasiyki (tu casa)', exampleCons: 'yawarniyki (tu sangre)', meaning: 'tu / tuyo' },
  { person: '3.ª sg', vowelSuf: '-n', consSuf: '-ni-n', exampleVowel: 'wasin (su casa)', exampleCons: 'yawarnin (su sangre)', meaning: 'su / suyo (él/ella)' },
  { person: '1.ª pl incl.', vowelSuf: '-nchij', consSuf: '-ni-nchij', exampleVowel: 'wasinchij (nuestra casa - tú y yo)', exampleCons: 'yawarninchij (nuestra sangre)', meaning: 'nuestro (inclusivo)' },
  { person: '1.ª pl excl.', vowelSuf: '-yku', consSuf: '-ni-yku', exampleVowel: 'wasiyku (nuestra casa - sin ti)', exampleCons: 'yawarniyku (nuestra sangre)', meaning: 'nuestro (exclusivo)' },
  { person: '2.ª pl', vowelSuf: '-ykichij', consSuf: '-ni-ykichij', exampleVowel: 'wasiykichij (su casa de ustedes)', exampleCons: 'yawarniykichij', meaning: 'de ustedes' },
  { person: '3.ª pl', vowelSuf: '-nku', consSuf: '-ni-nku', exampleVowel: 'wasinku (su casa de ellos)', exampleCons: 'yawarninku', meaning: 'de ellos / ellas' },
];

const examples = [
  { 
    quechua: 'Payqa José.', 
    spanish: 'Él es José.', 
    badge: 'Presente 3.ª (Cópula Cero)',
    tip: 'No lleva -n ni kan. Cópula elidida obligatoria.'
  },
  { 
    quechua: 'Noqayku jamusajku.', 
    spanish: 'Nosotros (sin incluirte) vendremos.', 
    badge: 'Futuro Excluido (-sajku)',
    tip: 'Desinencia cochabambina canónica con "j".'
  },
  { 
    quechua: 'Noqayku risqayku.', 
    spanish: 'Nosotros (sin incluirte) iremos.', 
    badge: 'Futuro Excluido (-sqayku)',
    tip: 'Variante morfológica con -sqayku.'
  },
  { 
    quechua: 'Noqanchej risunchij.', 
    spanish: 'Nosotros (tú y yo) iremos.', 
    badge: 'Futuro Inclusivo (-sunchij)',
    tip: 'Incluye al oyente con desinencia de grupo.'
  },
  { 
    quechua: 'Paykuna wasiypi kashanku.', 
    spanish: 'Ellos/ellas están en la casa.', 
    badge: 'Progresivo 3.ª Plural',
    tip: 'Aspecto cochabambino -sha- y locativo -pi.'
  },
  { 
    quechua: 'Mana qolqe kanchu.', 
    spanish: 'No hay dinero.', 
    badge: 'Existencia (Kan)',
    tip: '"Kan" se reserva exclusivamente para existencia ("hay").'
  },
];

export const PersonalPronounsGuide: React.FC = () => {
  const { sendToTranslator, sendToChat } = useQuechua();
  const [activeSubTab, setActiveSubTab] = useState<'pronouns' | 'possessives'>('pronouns');

  return (
    <section className="space-y-5 rounded-xl border border-amber-200 bg-amber-50/70 p-5 dark:border-amber-900/60 dark:bg-amber-950/20" aria-labelledby="personal-pronouns-title">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden="true" />
          <div>
            <h2 id="personal-pronouns-title" className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
              Pronombres Personales y Sufijos Posesivos Cochabambinos
            </h2>
            <p className="mt-0.5 text-xs text-stone-700 dark:text-stone-300">
              Norma boliviana (RM 1032/84). Distingue el inclusivo (<strong>noqanchej</strong>) del exclusivo (<strong>noqayku</strong>), y cópula cero en 3.ª persona presente.
            </p>
          </div>
        </div>

        {/* Toggle between Pronouns & Possessive Suffixes */}
        <div className="flex items-center gap-1 bg-white dark:bg-stone-900 p-1 rounded-lg border border-stone-200 dark:border-stone-800 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('pronouns')}
            className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
              activeSubTab === 'pronouns'
                ? 'bg-amber-700 text-white'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            Pronombres y Cópula Cero
          </button>
          <button
            onClick={() => setActiveSubTab('possessives')}
            className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
              activeSubTab === 'possessives'
                ? 'bg-amber-700 text-white'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            Sufijos Posesivos (-y, -yki, -n...)
          </button>
        </div>
      </div>

      {/* Reglas Críticas de Presente y Futuro */}
      <div className="grid gap-3 md:grid-cols-2">
        {/* Regla 1: Verbo kay y cópula cero */}
        <div className="rounded-lg border border-rose-200 bg-white/90 p-4 shadow-xs dark:border-rose-900/50 dark:bg-stone-900/80">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-semibold text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Presente 3.ª Persona: Cópula Cero en Verbo Kay</span>
          </div>
          <p className="mt-2 text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
            En el presente de tercera persona atributivo y de identidad, al verbo <strong>kay</strong> <u>no se le pone -n</u>. Hay elisión obligatoria:
          </p>
          <div className="mt-2.5 space-y-1.5 text-xs font-mono">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1.5 rounded-sm line-through">
              <span>❌ Payqa José kan.</span>
            </div>
            <div className="flex items-center justify-between gap-2 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1.5 rounded-sm font-semibold">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>✅ Payqa José. (Él es José)</span>
              </span>
              <button
                onClick={() => sendToTranslator('Payqa José.', 'qu-es')}
                className="text-[10px] px-2 py-0.5 bg-emerald-700 text-white rounded hover:bg-emerald-800 transition-colors"
              >
                Probar
              </button>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-stone-500 dark:text-stone-400">
            * La forma <strong>kan</strong> se reserva exclusivamente para existencia ("hay / existe"), por ejemplo: <em>Mana qolqe kanchu</em> (No hay dinero).
          </p>
        </div>

        {/* Regla 2: Futuro excluido de nosotros */}
        <div className="rounded-lg border border-blue-200 bg-white/90 p-4 shadow-xs dark:border-blue-900/50 dark:bg-stone-900/80">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-semibold text-sm">
            <Sparkles className="h-4 w-4 shrink-0" />
            <span>Futuro Excluido de Nosotros (Noqayku)</span>
          </div>
          <p className="mt-2 text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
            En el quechua cochabambino, el futuro exclusivo de 1.ª persona plural ("nosotros sin ti") utiliza obligatoriamente:
          </p>
          <div className="mt-2.5 space-y-1.5 text-xs font-mono">
            <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1.5 rounded-sm text-blue-800 dark:text-blue-300 font-semibold">
              <span>• -sajku: <span className="font-normal">Noqayku jamusajku (Nosotros vendremos)</span></span>
              <button
                onClick={() => sendToTranslator('Noqayku jamusajku.', 'qu-es')}
                className="text-[10px] px-2 py-0.5 bg-blue-700 text-white rounded hover:bg-blue-800 transition-colors"
              >
                Probar
              </button>
            </div>
            <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1.5 rounded-sm text-blue-800 dark:text-blue-300 font-semibold">
              <span>• -sqayku: <span className="font-normal">Noqayku risqayku (Nosotros iremos)</span></span>
              <button
                onClick={() => sendToTranslator('Noqayku risqayku.', 'qu-es')}
                className="text-[10px] px-2 py-0.5 bg-blue-700 text-white rounded hover:bg-blue-800 transition-colors"
              >
                Probar
              </button>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-stone-500 dark:text-stone-400">
            * A diferencia del futuro inclusivo que utiliza <strong>-sunchij</strong> (<em>parlasunchij</em> = hablaremos tú y yo).
          </p>
        </div>
      </div>

      {/* SUBTAB 1: Pronombres */}
      {activeSubTab === 'pronouns' && (
        <div className="overflow-x-auto rounded-lg border border-stone-200 dark:border-stone-800">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-white text-xs uppercase tracking-wide text-stone-500 dark:bg-stone-900 dark:text-stone-400">
              <tr>
                <th scope="col" className="px-3 py-2">Persona</th>
                <th scope="col" className="px-3 py-2">Quechua</th>
                <th scope="col" className="px-3 py-2">Español</th>
                <th scope="col" className="px-3 py-2">Particularidad Cochabambina</th>
                <th scope="col" className="px-3 py-2 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 bg-white dark:divide-stone-800 dark:bg-stone-950">
              {pronouns.map((pronoun) => (
                <tr key={pronoun.form} className="hover:bg-amber-50/30 dark:hover:bg-amber-950/20">
                  <th scope="row" className="px-3 py-2 font-medium text-stone-700 dark:text-stone-300">{pronoun.person}</th>
                  <td className="px-3 py-2 font-mono font-semibold text-amber-800 dark:text-amber-400">{pronoun.form}</td>
                  <td className="px-3 py-2 text-stone-800 dark:text-stone-200">{pronoun.spanish}</td>
                  <td className="px-3 py-2 text-stone-600 dark:text-stone-400 text-xs">{pronoun.note}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => sendToTranslator(pronoun.form, 'qu-es')}
                        className="px-2 py-0.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 text-[10px] font-semibold text-stone-700 dark:text-stone-300 rounded"
                        title="Probar en Traductor"
                      >
                        Traducir
                      </button>
                      <button
                        onClick={() => sendToChat(pronoun.form)}
                        className="px-2 py-0.5 bg-amber-700 hover:bg-amber-800 text-white text-[10px] font-semibold rounded"
                        title="Llevar a la conversación"
                      >
                        Chat
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SUBTAB 2: Sufijos Posesivos */}
      {activeSubTab === 'possessives' && (
        <div className="space-y-3">
          <div className="p-3 bg-white dark:bg-stone-950 rounded-lg border border-stone-200 dark:border-stone-800 text-xs text-stone-700 dark:text-stone-300 space-y-1">
            <span className="font-bold text-amber-800 dark:text-amber-400">Regla Fonológica de Posesión:</span>
            <p>
              • Base en <strong>vocal</strong> (ej. <em>wasi</em> = casa): se añaden directamente los sufijos posesivos: <em>wasi-y, wasi-yki, wasi-n, wasi-nchij, wasi-yku, wasi-ykichij, wasi-nku</em>.
            </p>
            <p>
              • Base en <strong>consonante</strong> (ej. <em>yawar</em> = sangre, <em>atoj</em> = zorro): se intercala el infijo eufónico <strong>-ni-</strong> para evitar choque consonántico: <em>yawar-ni-y, atoj-ni-n</em>.
            </p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-stone-200 dark:border-stone-800">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-white text-xs uppercase tracking-wide text-stone-500 dark:bg-stone-900 dark:text-stone-400">
                <tr>
                  <th className="px-3 py-2">Persona</th>
                  <th className="px-3 py-2 font-mono">En Vocal</th>
                  <th className="px-3 py-2 font-mono">En Consonante (-ni-)</th>
                  <th className="px-3 py-2">Ejemplo (wasi / yawar)</th>
                  <th className="px-3 py-2 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 bg-white dark:divide-stone-800 dark:bg-stone-950 font-mono text-xs">
                {possessiveSuffixes.map((suf) => (
                  <tr key={suf.person} className="hover:bg-amber-50/30 dark:hover:bg-amber-950/20">
                    <td className="px-3 py-2 font-sans font-medium text-stone-700 dark:text-stone-300">{suf.person}</td>
                    <td className="px-3 py-2 font-bold text-amber-800 dark:text-amber-400">{suf.vowelSuf}</td>
                    <td className="px-3 py-2 font-bold text-blue-800 dark:text-blue-400">{suf.consSuf}</td>
                    <td className="px-3 py-2 font-sans text-stone-800 dark:text-stone-200">
                      <span className="font-mono text-stone-900 dark:text-stone-100">{suf.exampleVowel}</span>
                      <span className="block text-[10px] text-stone-500">{suf.exampleCons}</span>
                    </td>
                    <td className="px-3 py-2 text-right font-sans">
                      <button
                        onClick={() => sendToTranslator(suf.exampleVowel.split(' ')[0], 'qu-es')}
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
      )}

      {/* Ejemplos Didácticos */}
      <div className="space-y-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-800 dark:text-stone-200">
          <ArrowRightLeft className="h-4 w-4 text-amber-700 dark:text-amber-400" aria-hidden="true" />
          Ejemplos con transferencia directa al Traductor y al Chat
        </h3>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {examples.map((example) => (
            <li key={example.quechua} className="rounded-lg border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-950 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 bg-amber-100/70 dark:bg-amber-900/40 dark:text-amber-300 px-1.5 py-0.5 rounded-sm">
                    {example.badge}
                  </span>
                </div>
                <p className="font-mono text-sm font-semibold text-stone-900 dark:text-stone-100">{example.quechua}</p>
                <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">{example.spanish}</p>
                <p className="mt-1.5 text-[11px] text-stone-500 italic dark:text-stone-400 border-t border-stone-100 dark:border-stone-850 pt-1.5">
                  {example.tip}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-stone-100 dark:border-stone-850 flex items-center justify-end gap-1.5">
                <button
                  onClick={() => sendToTranslator(example.quechua, 'qu-es')}
                  className="px-2 py-1 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 text-[10px] font-semibold text-stone-800 dark:text-stone-200 rounded flex items-center gap-1"
                >
                  <ArrowRightLeft className="w-2.5 h-2.5 text-amber-600" />
                  <span>Traductor</span>
                </button>
                <button
                  onClick={() => sendToChat(example.quechua)}
                  className="px-2 py-1 bg-amber-700 hover:bg-amber-800 text-white text-[10px] font-semibold rounded flex items-center gap-1"
                >
                  <MessageSquare className="w-2.5 h-2.5" />
                  <span>Chat</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
