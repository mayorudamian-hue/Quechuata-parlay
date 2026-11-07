import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));

const hasGeminiApiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '');

// Initialize GoogleGenAI server-side with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Circuit breaker for API quota exhaustion (e.g. 429 RESOURCE_EXHAUSTED)
let quotaExhaustedUntil = 0;

function isQuotaExhausted(): boolean {
  return Date.now() < quotaExhaustedUntil;
}

function tripQuotaCircuitBreaker(delaySeconds = 1800) {
  quotaExhaustedUntil = Date.now() + delaySeconds * 1000;
  console.log(`[Qhawana] Límite de cuota detectado. Circuito activado: motor lingüístico local operativo.`);
}

// Retry helper for API transient failures (503/UNAVAILABLE) - fails fast on 429
async function callWithRetry<T>(fn: () => Promise<T>, maxRetries = 1, delayMs = 600): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const errorMsg = String((err as Error)?.message || '');
      // Fast-fail immediately on quota exhaustion
      if (
        errorMsg.includes('429') || 
        errorMsg.includes('RESOURCE_EXHAUSTED') || 
        errorMsg.includes('quota') || 
        errorMsg.includes('Quota') ||
        errorMsg.includes('rate-limits')
      ) {
        tripQuotaCircuitBreaker();
        throw err;
      }
      const isTransient = errorMsg.includes('503') || errorMsg.includes('UNAVAILABLE');
      if (attempt < maxRetries && isTransient) {
        await new Promise((res) => setTimeout(res, delayMs * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

// Helper to execute Gemini with graceful model fallback
async function runGeminiWithFallback<T>(execute: (model: string) => Promise<T>): Promise<T> {
  if (isQuotaExhausted()) {
    throw new Error('QUOTA_CIRCUIT_OPEN');
  }
  try {
    return await execute('gemini-flash-latest');
  } catch (err: unknown) {
    const errorMsg = String((err as Error)?.message || '');
    if (
      errorMsg.includes('429') || 
      errorMsg.includes('RESOURCE_EXHAUSTED') || 
      errorMsg.includes('quota') || 
      errorMsg.includes('Quota')
    ) {
      tripQuotaCircuitBreaker();
      throw new Error('QUOTA_CIRCUIT_OPEN');
    }
    // Attempt with flash-lite
    try {
      return await execute('gemini-3.1-flash-lite');
    } catch (err2: unknown) {
      const errorMsg2 = String((err2 as Error)?.message || '');
      if (
        errorMsg2.includes('429') || 
        errorMsg2.includes('RESOURCE_EXHAUSTED') || 
        errorMsg2.includes('quota') || 
        errorMsg2.includes('Quota')
      ) {
        tripQuotaCircuitBreaker();
      }
      throw err2;
    }
  }
}

const QUECHUA_COCHABAMBA_SYSTEM_PROMPT = `
Eres el motor lingüístico y gramatical experto en Quechua Boliviano, específicamente en la VARIANTE COCHABAMBINO.
Rigen estrictamente las siguientes reglas lingüísticas y ortográficas normalizadas de Bolivia (RM 1032/84):

1. ASPECTO PROGRESIVO:
   - Se realiza fonológica y ortográficamente SIEMPRE como "-sha-" (kashani, mikhushani, parlashani, ruwashani, jamushani).
   - NUNCA uses la variante cusqueña/peruana "-chka-" (kachkani está prohibido; se debe corregir a kashani).

2. CLÍTICOS INDEPENDIENTES Y EVIDENCIALES (SLOT FINAL 5 Y 6):
   - "-min": Testimonial / Aserción de certeza directa (ej. Noqamin rini).
   - "-sina": Conjetural-reportativo distintivo de Cochabamba: "parece que", "dicen que" (ej. Jamun-sina).
   - "-chá": Dubitativo: "tal vez", "quizás" (ej. Jamunqa-chá).
   - "-raj": Continuativo temporal: "todavía, aún", escrito obligatoriamente con "j" final (ej. Mikhushani-raj).
   - "-taj": Contraste o enfático interrogativo con "j" (ej. Qan-taj?, Imatataj ruwashanki?).
   - "-puni": Enfático categórico: "siempre, definitivamente, sí o sí" (ej. Paqarin jamusaq-puni).
   - "-lla": Afectivo / limitativo / cortesía (ej. Allinllachu?).
   - "-nchij": 1ra persona plural inclusivo con "j" (ej. kashanchij, noqanchij).

3. REGLA ESTRICTA DE FORMACIÓN DEL PLURAL NOMINAL:
   - Si la palabra termina en VOCAL, se le añade una "-s" (ejemplo: wasi -> wasis, allqu -> allqus, tata -> tatas, wawa -> wawas).
   - Si la palabra termina en CONSONANTE, se le agrega el sufijo "-kuna" (ejemplo: atoj -> atojkuna, yawar -> yawarkuna).
   - Esta regla es canónica en el Quechua Cochabambino y debe respetarse estrictamente en traducciones, glosas y generación.

4. NEGACIÓN DECLARATIVA (ENUNCIATIVA):
   - Estructura discontinua obligatoria: "mana + [término a negar] + -chu".
   - Inexistencia ("No hay"): usar obligatoriamente "kanchu" (ej. "Mana qolqe kanchu" / "Mana qullqi kanchu").
   - Estados temporales y sentimientos con kay: combinar con progresivo -sha- y -chu (ej. "Mana kusisqachu kashani").
   - En 1ra persona plural usar terminación boliviana en "j": -nchij (ej. "Mana chayta ruwananchijchu tiyan").

5. NEGACIÓN IMPERATIVA Y PROHIBICIÓN:
   - NUNCA usar mana para órdenes negativas o prohibiciones.
   - Emplear exclusivamente la partícula "ama" + [verbo imperativo] + "-chu" (ej. "Ama waqaychu", "Ama phiñakuychu", "Ama chayta ujyaychu", "Ama llojsiychu").

6. GRAFÍA Y FONOLOGÍA BOLIVIANA (RM 1032/84):
   - Grafía con "j" en inicial de raíz aspirada y en coda: "jatun", "jallp'a", "jamuy", "llajta", "llank'ay", "atoj", "llojsiy", "ujyay".
   - Préstamos asimilados de amplio uso en el valle de Cochabamba: "parlay" (hablar), "trabajay", "merkao".

7. ANÁLISIS MORFOLÓGICO RIGUROSO (GLOSAS TIPO LEIPZIG):
   - Descomponer cada palabra en: Raíz + Sufijos concatenados.
   - Glosa gramatical (ej. wasi-s = casa-PL, atoj-kuna = zorro-PL, mana ... ka-n-chu = NEG ... haber-3SG-NEG, ama waqa-y-chu = PROHIB llorar-IMP-NEG).
   - Indicar si el término pertenece al dialecto cochabambino o si es una variante dudosa.

8. DETECCIÓN DE TÉRMINOS CRÍTICOS:
   - Identificar discrepancias bajo tres disparadores:
     * "low_confidence": Inseguridad sobre el significado o morfología en Cochabamba.
     * "dialect_variant": Formas peruanas o de otros valles (ej. -chka-, -chis, rimay, hatun, lloqsiy).
     * "out_of_glossary": Préstamos hispanos o neologismos que requieren confirmación con el quechuista.

9. ORACIONES CONDICIONALES ((SICHUS) ... CHAYQA):
   - Estructura condicional discontinua: "(Sichus) + [Oración condicional] + chayqa , [Oración principal]".
   - La partícula subordinante inicial "sichus" es OPCIONAL (frecuente en discurso formal o escrito).
   - El conector/topicalizador "chayqa" es OBLIGATORIO al cierre de la prótasis (cláusula condicional).
   - Ejemplos canónicos:
     * "Sichus sajra munayninchejta atipayta munanchej chayqa, concientes kananchej tiyan imachus debilidadninchej kasqanmanta."
     * "Jehová Diosta kasukunki chayqa, jamoj tiempopi ashkha bendicionesta japʼinki."
   - Glosa Leipzig: "sichus" = COND; "chayqa" = COND.TOP; "-nchej/-nchij" = 1PL.INCL; "ashkha" = mucho; "japʼinki" = recibir-2SG.

10. CÓPULA CERO CON EL VERBO KAY EN PRESENTE (3.ª PERSONA ATRIBUTIVA):
   - En oraciones de identidad o cualidad en tiempo presente y tercera persona, al verbo kay NO se le añade "-n" ni se dice "kan".
   - Hay elisión obligatoria (cópula cero Ø):
     * NUNCA digas: "Payqa José kan" (calco sintáctico agramatical del español "Él es José").
     * DI SIEMPRE: "Payqa José" (Él es José) o "Payqa yachachej" (Él es profesor).
   - La forma "kan" queda reservada estrictamente para existencia ("hay / existe"), ej. "Mana qolqe kanchu" (No hay dinero) o "Qolqe kan" (Hay dinero).

11. FUTURO EXCLUIDO DE NOSOTROS (1PL.EXCL):
   - Para la primera persona plural exclusiva de nosotros ("ellos y yo, pero no tú / noqayku") en tiempo futuro, en Cochabamba se usa sistemáticamente "-sajku" (con "j" boliviana) o "-sqayku":
     * "Noqayku jamusajku" / "Noqayku jamusqayku" (Nosotros vendremos sin ti).
     * "Noqayku risajku" / "Noqayku risqayku" (Nosotros iremos sin ti).
   - En contraste con el futuro inclusivo (tú y yo) que utiliza "-sunchij" ("parlasunchij").

12. SUFIJOS POSESIVOS NOMINALES Y EUFONÍA CON -NI-:
   - Sustantivo terminado en VOCAL: añade directamente los sufijos de persona:
     * -y (1SG, wasiy = mi casa), -yki (2SG, wasiyki = tu casa), -n (3SG, wasin = su casa)
     * -nchij (1PL.INCL, wasinchij = nuestra casa tú y yo)
     * -yku (1PL.EXCL, wasiyku = nuestra casa sin ti)
     * -ykichij (2PL, wasiykichij = su casa de ustedes), -nku (3PL, wasinku = su casa de ellos).
   - Sustantivo terminado en CONSONANTE: requiere obligatoriamente el interfijo eufónico "-ni-" para evitar cacofonía:
     * -ni-y (yawarniy = mi sangre), -ni-yki (yawarniyki), -ni-n (yawarnin), -ni-nchij (yawarninchij), -ni-yku (yawarniyku), -ni-ykichij (yawarniykichij), -ni-nku (yawarninku).

13. INTEGRACIÓN DE CASTELLANISMOS EN LA GRAMÁTICA QUECHUA:
   - REGLA FUNDAMENTAL: Se deben utilizar prioritariamente los términos en quechua siempre que existan en el vocabulario del banco lingüístico estándar (ej. "llank'ay" para trabajar, "yachakuy" para estudiar).
   - ADAPTACIÓN DE PRÉSTAMOS (CASTELLANISMOS): Si una palabra o verbo no tiene un equivalente directo en el banco, o se opta por el castellanismo de uso común en el valle de Cochabamba, este se somete a TODAS las reglas gramaticales y de conjugación correspondientes:
     * Verbos prestados: la raíz verbal del español adopta obligatoriamente la terminación verbal en "-y" para el infinitivo: "estudiay" (estudiar), "trabajay" (trabajar), "necesitay" (necesitar), "pensay" (pensar), "parlay" (hablar).
     * Conjugación verbal: la base verbal recibe todos los sufijos quechuas normales:
       - Progresivo: "trabajashani" (trabaja-sha-ni = estoy trabajando).
       - Persona y tiempo: "necesitanchej" (necesita-nchej = necesitamos), "estudiasunchej" (estudiaremos), "trabajarqani" (trabajé).
     * Perífrasis y subordinación:
       - "Necesitanchej estudiay" (necesita-nchej estudia-y = Necesitamos estudiar).
       - "Sichus chayta ruwanchej chayqa, allin riwasunchej" (sichus chay-ta ruwa-nchej chay-qa allin ri-wa-sunchej = Si hacemos eso, nos irá bien).
     * Glosa morfológica Leipzig: Descomponer el castellanismo en su base adaptada y sus sufijos (ej. "trabaja-sha-ni" -> "trabajar-PROG-1SG", "necesita-nchej" -> "necesitar-1PL.INCL", "estudia-y" -> "estudiar-INF").
`;

// Heuristic fallback analyzer for high availability
function generateLinguisticFallback(
  text: string, 
  direction: 'qu-es' | 'es-qu',
  knownRoots: Array<{ quechua: string; spanish: string; category?: string }> = [],
  _knownSuffixes: Array<{ suffix: string; function?: string }> = [],
  extraCorpus: Array<{ quechua: string; spanish: string; morphology?: string }> = []
) {
  const isQuechua = direction === 'qu-es';
  const cleanInput = text.trim().toLowerCase().replace(/[.,!?;:]/g, '');
  
  let translatedText = '';
  let grammaticalExplanation = '';

  // 1. Verificar coincidencia EXACTA (normalizada) con el corpus existente del usuario
  const norm = (v: string) => (v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[ʼ’‘`´]/g, "'").replace(/[^\p{L}\p{N}'\s-]/gu, ' ').replace(/\s+/g, ' ').trim();
  const normInput = norm(text);
  for (const item of extraCorpus) {
    if (isQuechua && norm(item.quechua) === normInput) {
      translatedText = item.spanish;
      break;
    } else if (!isQuechua && norm(item.spanish) === normInput) {
      translatedText = item.quechua;
      break;
    }
  }

  // 2. Patrones canónicos de reglas gramaticales cargadas (incluidos castellanismos adaptados)
  if (!translatedText) {
    if (cleanInput.includes('necesitanchej') && cleanInput.includes('estudiay')) {
      translatedText = isQuechua ? 'Necesitamos estudiar.' : 'Necesitanchej estudiay.';
      grammaticalExplanation = 'Regla de castellanismos adaptados: "necesitar" conjugado con persona 1PL.INCL (-nchej) y "estudiar" con infinitivo en -y (estudiay).';
    } else if (cleanInput.includes('necesitamos estudiar')) {
      translatedText = 'Necesitanchej estudiay.';
      grammaticalExplanation = 'Traducción con castellanismos adaptados a la morfología quechua: necesita-nchej estudia-y.';
    } else if (cleanInput.includes('chayta ruwanchej') && cleanInput.includes('riwasunchej')) {
      translatedText = isQuechua ? 'Si hacemos eso, nos irá bien.' : 'Sichus chayta ruwanchej chayqa, allin riwasunchej.';
      grammaticalExplanation = 'Oración condicional con (sichus)...chayqa. En la consecuencia: ri-wa-sunchej (ir-1OBJ-1PL.INCL.FUT = nos irá a nosotros).';
    } else if ((cleanInput.includes('si hacemos eso') && cleanInput.includes('bien')) || (cleanInput.includes('hacemos eso') && cleanInput.includes('ira bien'))) {
      translatedText = 'Sichus chayta ruwanchej chayqa, allin riwasunchej.';
      grammaticalExplanation = 'Oración condicional (sichus) ... chayqa con futuro inclusivo en -sunchej y clítico de objeto -wa-.';
    } else if (cleanInput === 'trabajashani' || cleanInput.includes('trabajashani')) {
      translatedText = isQuechua ? 'Estoy trabajando.' : 'Trabajashani.';
      grammaticalExplanation = 'Castellanismo adaptado: verbo trabajar con aspecto progresivo cochabambino -sha- y 1ra persona -ni (trabaja-sha-ni).';
    } else if (cleanInput === 'estoy trabajando' || cleanInput.includes('estoy trabajando')) {
      translatedText = 'Trabajashani.';
      grammaticalExplanation = 'Castellanismo adaptado con progresivo cochabambino -sha- (trabaja-sha-ni). Variante quechua nativa: Llank\'ashani.';
    } else if (cleanInput.includes('sajra') && cleanInput.includes('chayqa')) {
      translatedText = isQuechua 
        ? 'Si queremos vencer nuestra debilidad (deseo malo), debemos ser conscientes de qué tipo de debilidad es.' 
        : 'Sichus sajra munayninchejta atipayta munanchej chayqa, concientes kananchej tiyan imachus debilidadninchej kasqanmanta.';
      grammaticalExplanation = 'Oración condicional con (Sichus) ... chayqa y perífrasis verbal de obligación "kananchej tiyan".';
    } else if (cleanInput.includes('kasukunki') && cleanInput.includes('chayqa')) {
      translatedText = isQuechua
        ? 'Si obedeces a Jehová, en el tiempo que viene recibirás muchas bendiciones.'
        : 'Jehová Diosta kasukunki chayqa, jamoj tiempopi ashkha bendicionesta japʼinki.';
      grammaticalExplanation = 'Oración condicional con omisión opcional de sichus y marcador chayqa. Léxico boliviano: ashkha (mucho), jamoj (futuro con -j), japʼinki (eyectiva).';
    } else if (cleanInput.includes('mana chayta ruwananch')) {
      translatedText = isQuechua ? 'No tenemos que hacer eso.' : 'Mana chayta ruwananchijchu tiyan.';
      grammaticalExplanation = 'Negación declarativa mana + ...-chu con terminación inclusiva boliviana en "j" (-nchij).';
    } else if (cleanInput.includes('mana qolqe') || cleanInput.includes('mana qullqi')) {
      translatedText = isQuechua ? 'No hay dinero.' : 'Mana qullqi kanchu.';
      grammaticalExplanation = 'Negación de inexistencia con la forma obligatoria kanchu (verbo kay en 3ra persona).';
    } else if (cleanInput.includes('mana kusisqachu')) {
      translatedText = isQuechua ? 'No estoy feliz.' : 'Mana kusisqachu kashani.';
      grammaticalExplanation = 'Negación de estado emocional temporal con aspecto progresivo cochabambino -sha- (kashani).';
    } else if (cleanInput.includes('ama waqaychu')) {
      translatedText = isQuechua ? 'No llores.' : 'Ama waqaychu.';
      grammaticalExplanation = 'Negación imperativa y prohibitiva con partícula ama y enclítico -chu.';
    } else if (cleanInput.includes('ama phiñakuychu')) {
      translatedText = isQuechua ? 'No te enojes.' : 'Ama phiñakuychu.';
      grammaticalExplanation = 'Prohibición con ama + verbo reflexivo phiñakuy + -chu.';
    } else if (cleanInput.includes('ama chayta ujyaychu')) {
      translatedText = isQuechua ? 'No tomes / bebas eso.' : 'Ama chayta ujyaychu.';
      grammaticalExplanation = 'Prohibición con ama + ujyay (forma cochabambina con -j- en lugar de upyay) + -chu.';
    } else if (cleanInput.includes('ama llojsiychu')) {
      translatedText = isQuechua ? 'No salgas.' : 'Ama llojsiychu.';
      grammaticalExplanation = 'Prohibición con ama + llojsiy (ortografía boliviana RM 1032/84 con -j-) + -chu.';
    } else if (cleanInput.includes('payqa jose kan') || cleanInput.includes('payqa josé kan') || cleanInput.includes('pay jose kan')) {
      translatedText = isQuechua 
        ? 'Él es José (calco corregido: se dice "Payqa José", con cópula cero, nunca "kan")' 
        : 'Payqa José.';
      grammaticalExplanation = 'Alerta de calco sintáctico del español: En quechua cochabambino el presente atributivo de 3ra persona omite el verbo kay (cópula cero). No se dice "Payqa José kan", sino "Payqa José". La forma "kan" queda reservada para existencia ("hay").';
    } else if (cleanInput === 'payqa jose' || cleanInput === 'payqa josé' || cleanInput === 'pay jose') {
      translatedText = isQuechua ? 'Él es José.' : 'Payqa José.';
      grammaticalExplanation = 'Oración atributiva de 3.ª persona en presente con cópula cero (elisión de kay: no se usa "kan").';
    } else if (cleanInput.includes('jamusajku') || cleanInput.includes('jamusqayku')) {
      translatedText = isQuechua ? 'Nosotros (sin incluirte) vendremos.' : 'Noqayku jamusajku.';
      grammaticalExplanation = 'Futuro de 1ra persona plural exclusiva de nosotros con sufijo cochabambino -sajku / -sqayku.';
    } else if (cleanInput.includes('risajku') || cleanInput.includes('risqayku')) {
      translatedText = isQuechua ? 'Nosotros (sin incluirte) iremos.' : 'Noqayku risajku.';
      grammaticalExplanation = 'Futuro de 1ra persona plural exclusiva de nosotros con sufijo cochabambino -sajku / -sqayku.';
    } else if (cleanInput === 'wasis') {
      translatedText = isQuechua ? 'casas' : 'wasis';
      grammaticalExplanation = 'Pluralización nominal cochabambina: base en vocal (-i) añade desinencia "-s" (wasis).';
    } else if (cleanInput === 'atojkuna') {
      translatedText = isQuechua ? 'zorros' : 'atojkuna';
      grammaticalExplanation = 'Pluralización nominal cochabambina: base en consonante (-j) añade sufijo "-kuna" (atojkuna).';
    } else if (cleanInput === 'allqus') {
      translatedText = isQuechua ? 'perros' : 'allqus';
      grammaticalExplanation = 'Pluralización nominal en vocal (-u + -s).';
    } else if (cleanInput === 'yawarkuna') {
      translatedText = isQuechua ? 'sangres' : 'yawarkuna';
      grammaticalExplanation = 'Pluralización nominal en consonante (-r + -kuna).';
    } else if (cleanInput === 'wasi') {
      translatedText = isQuechua ? 'casa' : 'wasi';
      grammaticalExplanation = 'Sustantivo común: wasi (casa, hogar).';
    } else if (cleanInput.includes('wasiypi') && cleanInput.includes('kashani')) {
      translatedText = isQuechua ? 'Estoy en mi casa' : 'Wasiypi kashani';
      grammaticalExplanation = 'Estructura locativa posesiva wasi-y-pi con verbo estar en aspecto progresivo kashani.';
    } else {
      // 3. Fallback léxico palabra por palabra con el banco de raíces
      if (isQuechua) {
        const words = text.trim().split(/\s+/).map((w) => {
          const c = w.toLowerCase().replace(/[.,!?;:]/g, '');
          const match = knownRoots.find((r) => r.quechua.toLowerCase() === c || c.startsWith(r.quechua.toLowerCase()));
          return match ? match.spanish.split(',')[0].trim() : w;
        });
        translatedText = words.join(' ');
      } else {
        const words = text.trim().split(/\s+/).map((w) => {
          const c = w.toLowerCase().replace(/[.,!?;:]/g, '');
          const match = knownRoots.find((r) => r.spanish.toLowerCase().includes(c));
          return match ? match.quechua : w;
        });
        translatedText = words.join(' ');
      }
    }
  }

  if (!grammaticalExplanation) {
    if (text.includes('chayqa')) {
      grammaticalExplanation = 'Oración condicional estructurada mediante la prótasis marcada por "chayqa".';
    } else if (text.includes('mana') && text.includes('chu')) {
      grammaticalExplanation = 'Estructura de negación declarativa discontinua "mana ... -chu".';
    } else if (text.includes('ama') && text.includes('chu')) {
      grammaticalExplanation = 'Estructura de negación imperativa o prohibitiva "ama ... -chu".';
    } else if (text.includes('sha')) {
      grammaticalExplanation = 'Aspecto continuativo/progresivo cochabambino con el sufijo "-sha-".';
    } else {
      grammaticalExplanation = 'Análisis morfológico y sintáctico basado en las normas del Quechua Cochabambino.';
    }
  }

  const words = text.trim().split(/\s+/);

  const tokens = words.map((w) => {
    const clean = w.toLowerCase().replace(/[.,!?;:]/g, '');
    let root = clean;
    const suffixes: string[] = [];
    let gloss = clean;

    if (clean === 'wasis') {
      root = 'wasi';
      suffixes.push('-s');
      gloss = 'casa-PL';
    } else if (clean === 'atojkuna') {
      root = 'atoj';
      suffixes.push('-kuna');
      gloss = 'zorro-PL';
    } else if (clean === 'allqus') {
      root = 'allqu';
      suffixes.push('-s');
      gloss = 'perro-PL';
    } else if (clean === 'yawarkuna') {
      root = 'yawar';
      suffixes.push('-kuna');
      gloss = 'sangre-PL';
    } else if (clean.includes('kashani')) {
      root = 'kay';
      suffixes.push('-sha-', '-ni');
      gloss = 'ser/estar-PROG-1SG';
    } else if (clean.includes('kashanki')) {
      root = 'kay';
      suffixes.push('-sha-', '-nki');
      gloss = 'ser/estar-PROG-2SG';
    } else if (clean.includes('kashan')) {
      root = 'kay';
      suffixes.push('-sha-', '-n');
      gloss = 'ser/estar-PROG-3SG';
    } else if (clean.includes('wasiypi')) {
      root = 'wasi';
      suffixes.push('-y', '-pi');
      gloss = 'casa-1SG.POSS-LOC';
    } else if (clean.includes('allinllachu')) {
      root = 'allin';
      suffixes.push('-lla', '-chu');
      gloss = 'bien-AFECT-INTERR';
    } else if (clean.includes('mikhushani')) {
      root = 'mikhu';
      suffixes.push('-sha-', '-ni');
      gloss = 'comer-PROG-1SG';
    } else if (clean.includes('kachkani')) {
      root = 'kay';
      suffixes.push('-chka-', '-ni');
      gloss = 'ser/estar-PROG-1SG [VARIANTE NO COCHABAMBINA]';
    } else if (clean === 'mana') {
      root = 'mana';
      gloss = 'NEG';
    } else if (clean === 'ama') {
      root = 'ama';
      gloss = 'PROHIB';
    } else if (clean === 'kanchu' || clean.includes('kanchu')) {
      root = 'kay';
      suffixes.push('-n', '-chu');
      gloss = 'haber-3SG-NEG (no hay)';
    } else if (clean.includes('waqaychu')) {
      root = 'waqay';
      suffixes.push('-chu');
      gloss = 'llorar-IMP-NEG';
    } else if (clean.includes('kusisqachu')) {
      root = 'kusisqa';
      suffixes.push('-chu');
      gloss = 'feliz-NEG';
    } else if (clean.includes('llojsiychu')) {
      root = 'llojsiy';
      suffixes.push('-chu');
      gloss = 'salir-IMP-NEG';
    } else if (clean.includes('phiñakuychu')) {
      root = 'phiñakuy';
      suffixes.push('-chu');
      gloss = 'enojarse-IMP-NEG';
    } else if (clean.includes('ujyaychu')) {
      root = 'ujyay';
      suffixes.push('-chu');
      gloss = 'tomar-IMP-NEG';
    } else if (clean.includes('lloqsiy')) {
      root = 'llojsiy';
      suffixes.push('-chu');
      gloss = 'salir-IMP-NEG [GRAFÍA CUSQUEÑA]';
    } else if (clean === 'sichus') {
      root = 'sichus';
      gloss = 'COND';
    } else if (clean === 'chayqa') {
      root = 'chay';
      suffixes.push('-qa');
      gloss = 'COND.TOP (si...)';
    } else if (clean.includes('kasukunki')) {
      root = 'kasukuy';
      suffixes.push('-nki');
      gloss = 'obedecer-2SG';
    } else if (clean.includes('munanchej') || clean.includes('munanchij')) {
      root = 'munay';
      suffixes.push('-nchej');
      gloss = 'querer-1PL.INCL';
    } else if (clean.includes('kananchej')) {
      root = 'kay';
      suffixes.push('-na-', '-nchej');
      gloss = 'ser/estar-OBLIG-1PL.INCL';
    } else if (clean.includes('japʼinki') || clean.includes('japinki') || clean.includes("jap'inki")) {
      root = 'japʼiy';
      suffixes.push('-nki');
      gloss = 'recibir/agarrar-2SG';
    } else if (clean === 'ashkha') {
      root = 'ashkha';
      gloss = 'mucho/abundante';
    } else if (clean === 'sajra') {
      root = 'sajra';
      gloss = 'malo';
    } else if (clean.includes('munayninchejta')) {
      root = 'munay';
      suffixes.push('-ninchej', '-ta');
      gloss = 'deseo-1PL.INCL-ACUS';
    } else if (clean.includes('atipayta')) {
      root = 'atipay';
      suffixes.push('-ta');
      gloss = 'vencer-INF-ACUS';
    } else if (clean.includes('tiempopi')) {
      root = 'tiempo';
      suffixes.push('-pi');
      gloss = 'tiempo-LOC';
    } else if (clean === 'necesitanchej' || clean === 'necesitanchij') {
      root = 'necesitay';
      suffixes.push('-nchej');
      gloss = 'necesitar-1PL.INCL';
    } else if (clean === 'estudiay') {
      root = 'estudiay';
      suffixes.push('-y');
      gloss = 'estudiar-INF';
    } else if (clean.includes('estudiasha')) {
      root = 'estudiay';
      suffixes.push('-sha-', clean.replace(/^.*estudiasha-?/, '') || '-ni');
      gloss = 'estudiar-PROG';
    } else if (clean === 'trabajashani') {
      root = 'trabajay';
      suffixes.push('-sha-', '-ni');
      gloss = 'trabajar-PROG-1SG';
    } else if (clean.includes('trabajasha')) {
      root = 'trabajay';
      suffixes.push('-sha-');
      gloss = 'trabajar-PROG';
    } else if (clean === 'riwasunchej' || clean === 'riwasunchij') {
      root = 'riy';
      suffixes.push('-wa-', '-sunchej');
      gloss = 'ir-1OBJ-1PL.INCL.FUT';
    } else if (clean === 'ruwanchej' || clean === 'ruwanchij') {
      root = 'ruway';
      suffixes.push('-nchej');
      gloss = 'hacer-1PL.INCL';
    } else if (clean === 'wasiy') {
      root = 'wasi';
      suffixes.push('-y');
      gloss = 'casa-1SG.POSS';
    } else if (clean === 'wasiyki') {
      root = 'wasi';
      suffixes.push('-yki');
      gloss = 'casa-2SG.POSS';
    } else if (clean === 'wasin') {
      root = 'wasi';
      suffixes.push('-n');
      gloss = 'casa-3SG.POSS';
    } else if (clean === 'wasinchij' || clean === 'wasinchej') {
      root = 'wasi';
      suffixes.push('-nchij');
      gloss = 'casa-1PL.INCL.POSS';
    } else if (clean === 'wasiyku') {
      root = 'wasi';
      suffixes.push('-yku');
      gloss = 'casa-1PL.EXCL.POSS';
    } else if (clean === 'wasiykichij') {
      root = 'wasi';
      suffixes.push('-ykichij');
      gloss = 'casa-2PL.POSS';
    } else if (clean === 'wasinku') {
      root = 'wasi';
      suffixes.push('-nku');
      gloss = 'casa-3PL.POSS';
    } else if (clean === 'yawarniy') {
      root = 'yawar';
      suffixes.push('-ni-', '-y');
      gloss = 'sangre-EUF-1SG.POSS';
    } else if (clean.endsWith('rqani')) {
      const base = clean.replace(/rqani$/, '');
      root = base + 'y';
      suffixes.push('-rqa-', '-ni');
      gloss = `${base}-PAS.TEST-1SG`;
    } else if (clean.endsWith('rqanki')) {
      const base = clean.replace(/rqanki$/, '');
      root = base + 'y';
      suffixes.push('-rqa-', '-nki');
      gloss = `${base}-PAS.TEST-2SG`;
    } else if (clean.endsWith('rqa') && clean.length > 4) {
      const base = clean.replace(/rqa$/, '');
      root = base + 'y';
      suffixes.push('-rqa-');
      gloss = `${base}-PAS.TEST.3SG`;
    } else if (clean.endsWith('rqanchij')) {
      const base = clean.replace(/rqanchij$/, '');
      root = base + 'y';
      suffixes.push('-rqa-', '-nchij');
      gloss = `${base}-PAS.TEST-1PL.INCL`;
    } else if (clean.endsWith('sqani')) {
      const base = clean.replace(/sqani$/, '');
      root = base + 'y';
      suffixes.push('-sqa-', '-ni');
      gloss = `${base}-PAS.NARR-1SG`;
    } else if (clean.endsWith('sqa') && clean.length > 4) {
      const base = clean.replace(/sqa$/, '');
      root = base + 'y';
      suffixes.push('-sqa');
      gloss = `${base}-PAS.NARR.3SG/PART.PAS`;
    } else if (clean.endsWith('saq')) {
      const base = clean.replace(/saq$/, '');
      root = base + 'y';
      suffixes.push('-saq');
      gloss = `${base}-1SG.FUT`;
    } else if (clean.endsWith('sunchij')) {
      const base = clean.replace(/sunchij$/, '');
      root = base + 'y';
      suffixes.push('-sunchij');
      gloss = `${base}-1PL.INCL.FUT`;
    } else if (clean.endsWith('sajku')) {
      const base = clean.replace(/sajku$/, '');
      root = base + 'y';
      suffixes.push('-sajku');
      gloss = `${base}-1PL.EXCL.FUT`;
    } else if (clean.endsWith('sqayku')) {
      const base = clean.replace(/sqayku$/, '');
      root = base + 'y';
      suffixes.push('-sqayku');
      gloss = `${base}-1PL.EXCL.FUT`;
    } else if (clean.endsWith('saqku')) {
      const base = clean.replace(/saqku$/, '');
      root = base + 'y';
      suffixes.push('-saqku');
      gloss = `${base}-1PL.EXCL.FUT`;
    } else if (clean === 'kan') {
      root = 'kay';
      suffixes.push('-n');
      const isAttributiveCalque = /\bpayqa\s+\w+\s+kan\b/i.test(text) || /\bpay\s+\w+\s+kan\b/i.test(text);
      gloss = isAttributiveCalque 
        ? 'ser-3SG [CALCO: elidir cópula en atribución]' 
        : 'haber/existir-3SG (hay)';
    } else if (clean.endsWith('nqa') && clean.length > 4) {
      const base = clean.replace(/nqa$/, '');
      root = base + 'y';
      suffixes.push('-nqa');
      gloss = `${base}-3SG.FUT`;
    } else if (clean.endsWith('yman') && clean.length > 5) {
      const base = clean.replace(/yman$/, '');
      root = base + 'y';
      suffixes.push('-yman');
      gloss = `${base}-1SG.POT`;
    } else if (clean.endsWith('waq') && clean.length > 4) {
      const base = clean.replace(/waq$/, '');
      root = base + 'y';
      suffixes.push('-waq');
      gloss = `${base}-2SG.POT`;
    } else if (clean.endsWith('nman') && clean.length > 5) {
      const base = clean.replace(/nman$/, '');
      root = base + 'y';
      suffixes.push('-nman');
      gloss = `${base}-3SG.POT`;
    } else if (clean.endsWith('swanchij')) {
      const base = clean.replace(/swanchij$/, '');
      root = base + 'y';
      suffixes.push('-swanchij');
      gloss = `${base}-1PL.INCL.POT`;
    } else if (clean.endsWith('ychij')) {
      const base = clean.replace(/ychij$/, '');
      root = base + 'y';
      suffixes.push('-ychij');
      gloss = `${base}-IMP.2PL`;
    } else if (clean.endsWith('chun') && clean.length > 5) {
      const base = clean.replace(/chun$/, '');
      root = base + 'y';
      suffixes.push('-chun');
      gloss = `${base}-IMP.3SG`;
    } else if (clean.endsWith('spa') && clean.length > 4) {
      const base = clean.replace(/spa$/, '');
      root = base + 'y';
      suffixes.push('-spa');
      gloss = `${base}-GER`;
    } else if (clean.endsWith('jtin') && clean.length > 5) {
      const base = clean.replace(/jtin$/, '');
      root = base + 'y';
      suffixes.push('-jtin');
      gloss = `${base}-SUBORD.DIF`;
    } else {
      // Búsqueda en knownRoots
      const match = knownRoots.find((r) => r.quechua.toLowerCase() === clean);
      if (match) {
        root = match.quechua;
        gloss = `${match.quechua}-ROOT`;
      } else {
        gloss = isQuechua ? `${clean}-ROOT` : clean;
      }
    }

    const hasDoubt = clean.includes('kachka') || clean.includes('chis') || clean.includes('rimay') || clean.includes('lloqsiy');

    return {
      surface: w,
      root,
      suffixes,
      gloss,
      isRecognized: !hasDoubt,
      doubtFlag: hasDoubt ? 'dialect_variant' : undefined,
    };
  });

  const detectedDoubts: Array<{
    term: string;
    trigger: string;
    contextPhrase: string;
    occurrences: number;
    aiHypothesis: string;
    quechuistaQuestion: string;
    suggestedAction: string;
    status: string;
  }> = [];

  if (text.toLowerCase().includes('kachkani')) {
    detectedDoubts.push({
      term: 'kachkani',
      trigger: 'dialect_variant',
      contextPhrase: text,
      occurrences: 1,
      aiHypothesis: 'Variante cusqueña con sufijo progresivo -chka-',
      quechuistaQuestion: '¿Se debe estandarizar a kashani para Cochabamba?',
      suggestedAction: 'Corregir a "kashani"',
      status: 'pending',
    });
  }
  if (text.toLowerCase().includes('chis')) {
    detectedDoubts.push({
      term: 'plural -chis',
      trigger: 'dialect_variant',
      contextPhrase: text,
      occurrences: 1,
      aiHypothesis: 'Sufijo pluralizante propio del quechua cusqueño',
      quechuistaQuestion: '¿Normalizar al plural inclusivo boliviano -nchij?',
      suggestedAction: 'Estandarizar a -nchij',
      status: 'pending',
    });
  }
  if (/\bpayqa\s+\w+\s+kan\b/i.test(text) || /\bpay\s+\w+\s+kan\b/i.test(text)) {
    detectedDoubts.push({
      term: 'Payqa ... kan',
      trigger: 'dialect_variant',
      contextPhrase: text,
      occurrences: 1,
      aiHypothesis: 'Calco sintáctico del español ("Él es..."). En quechua cochabambino el presente atributivo de 3ra persona omite obligatoriamente el verbo kay (cópula cero). No se dice "Payqa José kan", sino "Payqa José". La forma "kan" se reserva para existencia ("hay").',
      quechuistaQuestion: '¿Confirmar elisión obligatoria de "kan" en oraciones atributivas de 3ra persona presente según la norma cochabambina?',
      suggestedAction: 'Eliminar "kan" para aplicar la cópula cero: "Payqa José"',
      status: 'pending',
    });
  }

  return {
    sourceText: text,
    translatedText,
    direction,
    tokens,
    grammaticalExplanation,
    detectedDoubts,
    source: 'fallback' as const,
  };
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ 
    ok: true, 
    variant: 'cochabambino', 
    hasApiKey: hasGeminiApiKey,
    quotaExhausted: isQuotaExhausted()
  });
});

// 1. Traducción y Análisis Morfológico Interlineal
app.post('/api/quechua/translate', async (req, res) => {
  const { 
    text, 
    direction = 'qu-es', 
    customRules = '', 
    extraCorpus = [], 
    knownRoots = [], 
    knownSuffixes = [] 
  } = req.body;

  if (!text || typeof text !== 'string') {
    res.status(400).json({ error: 'El texto es obligatorio.' });
    return;
  }

  // Si no hay API key o la cuota diaria está agotada, usar de inmediato el motor lingüístico nativo
  if (!hasGeminiApiKey || isQuotaExhausted()) {
    const fallback = generateLinguisticFallback(text, direction, knownRoots, knownSuffixes, extraCorpus);
    res.json(fallback);
    return;
  }

  const prompt = `
Traduce y analiza minuciosamente el siguiente texto:
Dirección: ${direction === 'qu-es' ? 'Quechua Cochabambino -> Español' : 'Español -> Quechua Cochabambino'}
Texto original: "${text}"

REGLA FUNDAMENTAL DE EXTRACCIÓN DE RAÍCES REALES (LEIPZIG GLOSSING):
- NUNCA pongas como "root" la palabra completa si tiene sufijos aglutinados.
- Debes separar la RAÍZ LÉXICA REAL de cada uno de sus sufijos:
    * Ej: "wasiypi" -> root: "wasi", suffixes: ["-y", "-pi"], gloss: "casa-1SG.POSS-LOC"
    * Ej: "kashani" -> root: "kay", suffixes: ["-sha-", "-ni"], gloss: "ser/estar-PROG-1SG"
    * Ej: "mikhushani" -> root: "mikhuy", suffixes: ["-sha-", "-ni"], gloss: "comer-PROG-1SG"
    * Ej: "parlashanki" -> root: "parlay", suffixes: ["-sha-", "-nki"], gloss: "hablar-PROG-2SG"
    * Ej: "llajtanchijpi" -> root: "llajta", suffixes: ["-nchij", "-pi"], gloss: "pueblo-1PL.INCL.POSS-LOC"
    * Ej: "ruwashan" -> root: "ruway", suffixes: ["-sha-", "-n"], gloss: "hacer-PROG-3SG"
- Si el texto origen o frases del corpus contienen guiones (ej: "wasi-y-pi ka-sha-ni"), respeta estrictamente esa segmentación: la primera parte antes del primer guión es la raíz ("wasi", "ka-/kay"), y las siguientes son los sufijos.

${knownRoots.length ? `BANCO DE RAÍCES REALES CONOCIDAS DEL USUARIO:\n${knownRoots.map((r: { quechua: string; spanish: string; category?: string }) => `${r.quechua} (${r.spanish})`).join(', ')}\n` : ''}
${knownSuffixes.length ? `BANCO DE SUFIJOS CONOCIDOS DEL USUARIO:\n${knownSuffixes.map((s: { suffix: string; function?: string }) => `${s.suffix} (${s.function || ''})`).join(', ')}\n` : ''}
${customRules ? `Reglas gramaticales vigentes:\n${customRules}\n` : ''}
${extraCorpus.length ? `TRADUCCIONES GUARDADAS POR EL USUARIO (las más parecidas al texto). Tienen PRIORIDAD sobre tu conocimiento general: si el texto es igual o similar a alguna, reutiliza su vocabulario, su ortografía y su estructura; solo cambia lo que el texto nuevo exija. Las marcadas verified:true fueron corregidas por el usuario y no se contradicen:\n${JSON.stringify(extraCorpus.slice(0, 15))}\n` : ''}
REGLA DE POLISEMIA: en el banco, una raíz puede tener varios significados separados por ";" (a veces con "(cuando ...)" indicando el contexto). Elige el significado según el contexto de la frase. Si el contexto no alcanza para decidir, o usas un significado que no figura, inclúyela en detectedDoubts con trigger "low_confidence" y lista los significados posibles en aiHypothesis.
REGLA DE PALABRAS NUEVAS: si usas o encuentras una raíz que NO está en el banco de raíces de arriba ni en las traducciones guardadas, inclúyela en detectedDoubts con trigger "out_of_glossary" y tu mejor hipótesis de significado en aiHypothesis.

Devuelve una respuesta estructurada con:
- sourceText: el texto original recibido.
- translatedText: traducción fiel al quechua cochabambino o español según la dirección.
- direction: "${direction}"
- tokens: lista de palabras del texto quechua (sea el original o la traducción generada), con:
    * surface: la palabra tal cual aparece
    * root: la raíz léxica REAL base (ej: "kay", "wasi", "mikhuy", "llajta")
    * suffixes: array de sufijos encontrados (ej: ["-sha-", "-ni"] o ["-y", "-pi"])
    * gloss: glosa morfológica interlineal precisa (ej: "estar-PROG-1SG" o "casa-1SG.POSS-LOC")
    * meaning: SOLO el significado léxico de la raíz en español, en minúsculas y sin etiquetas (ej: "casa", "comer", "pueblo"); si la raíz tiene varios significados, el que corresponde a este contexto
    * isRecognized: true si la raíz o término es estándar cochabambino
    * doubtFlag: (opcional) "low_confidence" | "dialect_variant" | "out_of_glossary" si detectas alguna anomalía o variante ajena
- grammaticalExplanation: explicación didáctica y clara de la sintaxis y sufijos utilizados.
- detectedDoubts: lista de términos que ameritan validación en el Panel de Términos Críticos.
`;

  try {
    const response = await runGeminiWithFallback(async (modelName) => {
      const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout de Gemini')), 20000));
      const responsePromise = callWithRetry(async () => {
        return await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction: QUECHUA_COCHABAMBA_SYSTEM_PROMPT,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                sourceText: { type: Type.STRING },
                translatedText: { type: Type.STRING },
                direction: { type: Type.STRING },
                tokens: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      surface: { type: Type.STRING },
                      root: { type: Type.STRING },
                      suffixes: { type: Type.ARRAY, items: { type: Type.STRING } },
                      gloss: { type: Type.STRING },
                      meaning: { type: Type.STRING },
                      isRecognized: { type: Type.BOOLEAN },
                      doubtFlag: { type: Type.STRING },
                    },
                    required: ['surface', 'root', 'suffixes', 'gloss', 'isRecognized'],
                  },
                },
                grammaticalExplanation: { type: Type.STRING },
                detectedDoubts: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      term: { type: Type.STRING },
                      trigger: { type: Type.STRING },
                      contextPhrase: { type: Type.STRING },
                      occurrences: { type: Type.INTEGER },
                      aiHypothesis: { type: Type.STRING },
                      quechuistaQuestion: { type: Type.STRING },
                      suggestedAction: { type: Type.STRING },
                    },
                    required: ['term', 'trigger', 'contextPhrase', 'aiHypothesis', 'quechuistaQuestion', 'suggestedAction'],
                  },
                },
              },
              required: ['sourceText', 'translatedText', 'direction', 'tokens', 'grammaticalExplanation', 'detectedDoubts'],
            },
          },
        });
      });

      return (await Promise.race([responsePromise, timeoutPromise])) as { text?: string };
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (_err: unknown) {
    console.log('[Qhawana] Operando mediante analizador lingüístico morfológico de contingencia.');
    const fallback = generateLinguisticFallback(text, direction, knownRoots, knownSuffixes, extraCorpus);
    res.json(fallback);
  }
});

// 1b. Glosar una frase ya traducida (p. ej. corregida a mano): raíz, sufijos y significado por palabra
app.post('/api/quechua/gloss', async (req, res) => {
  const { quechua, spanish, words = [], knownRoots = [] } = req.body;
  if (!quechua || typeof quechua !== 'string') {
    res.status(400).json({ error: 'El texto quechua es obligatorio.' });
    return;
  }
  if (!hasGeminiApiKey || isQuotaExhausted()) {
    res.status(503).json({ error: 'IA no disponible' });
    return;
  }
  const target: string[] = Array.isArray(words) && words.length ? words : quechua.split(/\s+/);
  const prompt = `
Analiza morfológicamente esta frase en quechua cochabambino y su traducción.
Quechua: "${quechua}"
Español: "${spanish || ''}"
Palabras a analizar (devuelve exactamente una entrada por cada una, en este orden): ${JSON.stringify(target)}

Para cada palabra devuelve: surface, root (raíz léxica real; verbos en infinitivo con -y), suffixes (array, ej. ["-sha-","-ni"]), gloss (glosa Leipzig, ej. "casa-1SG.POSS-LOC"), meaning (SOLO el significado léxico de la raíz en español, en minúsculas y sin etiquetas, según el contexto de la frase).
Usa la ortografía boliviana (RM 1032/84) y respeta la palabra tal como está escrita en la frase: no la "corrijas".
${knownRoots.length ? `Raíces ya conocidas (si coinciden, usa su significado):\n${knownRoots.map((r: { quechua: string; spanish: string }) => `${r.quechua} (${r.spanish})`).join(', ')}\n` : ''}`;
  try {
    const response = await runGeminiWithFallback(async (modelName) => {
      const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout de Gemini')), 20000));
      const responsePromise = callWithRetry(async () => ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction: QUECHUA_COCHABAMBA_SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tokens: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    surface: { type: Type.STRING },
                    root: { type: Type.STRING },
                    suffixes: { type: Type.ARRAY, items: { type: Type.STRING } },
                    gloss: { type: Type.STRING },
                    meaning: { type: Type.STRING },
                  },
                  required: ['surface', 'root', 'suffixes', 'gloss', 'meaning'],
                },
              },
            },
            required: ['tokens'],
          },
        },
      }));
      return (await Promise.race([responsePromise, timeoutPromise])) as { text?: string };
    });
    res.json(JSON.parse(response.text || '{"tokens":[]}'));
  } catch {
    res.status(503).json({ error: 'IA no disponible' });
  }
});

// 2. Detección y Análisis Automático de Términos Críticos en Textos / Frases
app.post('/api/quechua/analyze', async (req, res) => {
  const { phrase } = req.body;

  if (!phrase) {
    res.status(400).json({ error: 'La frase es obligatoria.' });
    return;
  }

  const detectedDoubts: Array<{
    term: string;
    trigger: string;
    contextPhrase: string;
    occurrences: number;
    aiHypothesis: string;
    quechuistaQuestion: string;
    suggestedAction: string;
    status: string;
  }> = [];

  const lower = phrase.toLowerCase();
  if (lower.includes('kachka')) {
    detectedDoubts.push({
      term: 'kachkani',
      trigger: 'dialect_variant',
      contextPhrase: phrase,
      occurrences: 1,
      aiHypothesis: 'Variante cusqueña con progresivo -chka-',
      quechuistaQuestion: '¿Corregir a "kashani" para la variedad cochabambina?',
      suggestedAction: 'Reemplazar -chka- por -sha-',
      status: 'pending',
    });
  }
  if (lower.includes('chis')) {
    detectedDoubts.push({
      term: 'plural -chis',
      trigger: 'dialect_variant',
      contextPhrase: phrase,
      occurrences: 1,
      aiHypothesis: 'Sufijo cusqueño plural de persona -chis',
      quechuistaQuestion: '¿Normalizar al plural inclusivo cochabambino -nchij / -sunchij?',
      suggestedAction: 'Estandarizar a terminación en "j"',
      status: 'pending',
    });
  }
  if (lower.includes('rimay')) {
    detectedDoubts.push({
      term: 'rimay',
      trigger: 'dialect_variant',
      contextPhrase: phrase,
      occurrences: 1,
      aiHypothesis: 'Verbo general del quechua norteño/sureño rimay',
      quechuistaQuestion: 'En Cochabamba predomina parlay. ¿Aceptar o alertar?',
      suggestedAction: 'Registrar en glosario dialectal',
      status: 'pending',
    });
  }
  if (lower.includes('lloqsiy')) {
    detectedDoubts.push({
      term: 'lloqsiy',
      trigger: 'dialect_variant',
      contextPhrase: phrase,
      occurrences: 1,
      aiHypothesis: 'Grafía con "q" en lugar de la norma boliviana con "j" (llojsiy)',
      quechuistaQuestion: '¿Normalizar a "llojsiy" según RM 1032/84?',
      suggestedAction: 'Corregir grafía a "j"',
      status: 'pending',
    });
  }

  res.json({ detectedDoubts });
});

// 3. Conversación Pedagógica en Quechua Cochabambino
app.post('/api/quechua/chat', async (req, res) => {
  const { messages, userLevel = 'intermedio', customRules = '', corpus = [], knownRoots = [] } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Se requiere el historial de mensajes.' });
    return;
  }

  // Sin IA no se inventan respuestas: antes se devolvía siempre la misma frase fija como si fuera el tutor.
  if (!hasGeminiApiKey || isQuotaExhausted()) {
    res.status(503).json({ error: 'El tutor no está disponible ahora (sin conexión con la IA o cuota agotada).' });
    return;
  }

  const history = messages.slice(-12) as Array<{ sender: string; text: string }>;
  const previousTutorLines = history.filter((m) => m.sender !== 'user').map((m) => m.text).slice(-6);

  const levelGuide: Record<string, string> = {
    'básico': 'Oraciones muy cortas (una sola), vocabulario cotidiano del banco (saludos, familia, comida, casa, números). Una idea por turno y una pregunta sencilla.',
    'intermedio': 'Una o dos oraciones. Introduce en cada turno UN sufijo o construcción nueva (-sha-, -rqa-, -taj, -raj, -puni, ama...-chu) y úsala de forma natural.',
    'avanzado': 'Dos o tres oraciones con estructuras más ricas: condicionales (sichus...chayqa), evidenciales (-mi/-si/-chá), subordinación, expresiones idiomáticas cochabambinas.',
  };

  const conversationPrompt = `
Eres un interlocutor hablante nativo y tutor de Quechua Cochabambino. Nivel del usuario: "${userLevel}".
NIVEL: ${levelGuide[userLevel] || levelGuide['intermedio']}

CÓMO CONVERSAR (importante):
- Responde a lo que el usuario DIJO realmente (retoma su tema, su palabra o su pregunta); no sueltes una respuesta genérica.
- Haz avanzar la conversación: cierra con UNA pregunta o invitación DISTINTA de las anteriores y cambia de tema con naturalidad cada pocos turnos (familia, comida, trabajo, clima, chacra, mercado, fiestas, viajes, estudios...).
- NUNCA repitas una frase o pregunta que ya dijiste. Frases que ya dijiste (no las repitas ni las parafrasees):
${previousTutorLines.length ? previousTutorLines.map((l) => `  · ${l}`).join('\n') : '  (ninguna todavía)'}
- Si el usuario escribió en español, respóndele en quechua y dile en la nota cómo se diría su frase.
- Si el usuario cometió un error (ortografía, sufijo, orden), respóndele con naturalidad y en pedagogicalNote muestra la forma correcta y por qué. Si no hubo errores, usa la nota para un dato gramatical o cultural breve sobre lo que dijiste.
- Ortografía boliviana (RM 1032/84).

${knownRoots.length ? `VOCABULARIO DEL USUARIO (úsalo con preferencia; los significados separados por ";" dependen del contexto):\n${knownRoots.map((r: { quechua: string; spanish: string }) => `${r.quechua} (${r.spanish})`).join(', ')}\n` : ''}
${customRules ? `REGLAS GRAMATICALES VIGENTES:\n${customRules}\n` : ''}
${corpus.length ? `FRASES DEL CORPUS DEL USUARIO (modelo de cómo habla; no las copies tal cual):\n${JSON.stringify(corpus.slice(0, 10))}\n` : ''}
HISTORIAL (los últimos mensajes):
${history.map((m) => `${m.sender === 'user' ? 'Usuario' : 'Tutor'}: ${m.text}`).join('\n')}

Responde al último mensaje del usuario devolviendo:
- quechuaResponse: tu respuesta en Quechua Cochabambino.
- spanishTranslation: la traducción precisa al español.
- tokens: desglose de las palabras principales con raíz (infinitivo con -y para verbos), sufijos, glosa y meaning (solo el significado léxico de la raíz).
- pedagogicalNote: la nota didáctica (ver arriba).
`;

  try {
    const response = await runGeminiWithFallback(async (modelName) => {
      const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout de Gemini')), 25000));
      const responsePromise = callWithRetry(async () => {
        return await ai.models.generateContent({
          model: modelName,
          contents: conversationPrompt,
          config: {
            systemInstruction: QUECHUA_COCHABAMBA_SYSTEM_PROMPT,
            temperature: 0.9,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                quechuaResponse: { type: Type.STRING },
                spanishTranslation: { type: Type.STRING },
                tokens: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      surface: { type: Type.STRING },
                      root: { type: Type.STRING },
                      suffixes: { type: Type.ARRAY, items: { type: Type.STRING } },
                      gloss: { type: Type.STRING },
                      meaning: { type: Type.STRING },
                      isRecognized: { type: Type.BOOLEAN },
                    },
                    required: ['surface', 'root', 'suffixes', 'gloss', 'isRecognized'],
                  },
                },
                pedagogicalNote: { type: Type.STRING },
              },
              required: ['quechuaResponse', 'spanishTranslation', 'tokens', 'pedagogicalNote'],
            },
          },
        });
      });
      return (await Promise.race([responsePromise, timeoutPromise])) as { text?: string };
    });

    const parsed = JSON.parse(response.text || '{}');
    if (!parsed.quechuaResponse) throw new Error('Respuesta vacía');
    res.json(parsed);
  } catch (_err: unknown) {
    console.log('[Qhawana Chat] La IA no respondió:', String((_err as Error)?.message || _err));
    res.status(503).json({ error: 'El tutor no pudo responder esta vez (la IA tardó demasiado o falló).' });
  }
});

// 4. Formulación de Consulta Especializada para el Quechuista
app.post('/api/quechua/expert-query', async (req, res) => {
  const { term, contextPhrase, trigger } = req.body;

  res.json({
    structuredQuestion: `¿Confirma si el término "${term}" se utiliza en el quechua cochabambino coloquial o estándar en este contexto?`,
    dialectalComparison: 'En quechua sureño general se documentan variantes fonológicas o de sufijación (ej. -chka- vs -sha-, -chis vs -nchij).',
    proposedHypothesis: `Variante dialectal o adaptación detectada bajo el criterio "${trigger || 'revisión'}" en "${contextPhrase || ''}" que requiere validación por el quechuista.`,
  });
});

// Catch-all para que ninguna ruta de /api/* caiga en el middleware de Vite sirviendo index.html (<doctype)
app.all('/api/*', (req, res) => {
  res.status(404).json({
    error: `Ruta de API no encontrada: ${req.method} ${req.path}`,
    tokens: [],
    detectedDoubts: []
  });
});

// Configure Vite integration for dev or static serving for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor Qhawana listo en http://localhost:${PORT}`);
  });
}

startServer();
