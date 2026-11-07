// Uso: npx tsx scripts/test-retrieval.ts
import assert from 'node:assert/strict';
import { findSimilarExamples } from '../src/utils/retrieval';
import type { CorpusPhrase } from '../src/types/quechua';

const make = (id: string, spanish: string, quechua: string, extra: Partial<CorpusPhrase> = {}): CorpusPhrase => ({
  id,
  spanish,
  quechua,
  morphologicalBreakdown: '',
  gloss: '',
  grammaticalNotes: '',
  tags: [],
  verified: false,
  ...extra,
});

const corpus: CorpusPhrase[] = [
  make('1', 'Voy a la escuela cada día.', "Sapa p'unchay escuelaman rini.", { provenance: 'revisado-dem' }),
  make('2', 'Voy a Oruro.', 'Oruroman rini.', { provenance: 'fuente' }),
  make('3', 'Ayer vine al pueblo.', 'Qayna llajtaman jamuni.', { verified: true }),
  make('4', 'Voy a la escuela cada día.', 'Texto generado sin revisar.', { provenance: 'ia' }),
  make('5', 'Voy a la escuela cada día.', "Sapa p'unchay escuelaman rini.", { provenance: 'revisado-dem' }), // repetida
];

// 1. La frase más parecida queda primera
const r1 = findSimilarExamples('Voy a la escuela todos los días', 'es-qu', corpus);
assert.equal(r1[0].phrase.id, '1');
assert.ok(r1[0].matched.includes('escuela'));

// 2. Las frases de procedencia "ia" no se usan como ejemplo
assert.ok(!r1.some((x) => x.phrase.provenance === 'ia'));

// 3. No se repite el mismo par
assert.equal(r1.filter((x) => x.phrase.quechua === "Sapa p'unchay escuelaman rini.").length, 1);

// 4. Sin coincidencias suficientes no devuelve nada
assert.deepEqual(findSimilarExamples('Quiero una computadora nueva', 'es-qu', corpus), []);

console.log('OK: buscador de ejemplos cercanos');
