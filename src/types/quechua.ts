export type GrammarCategory = 
  | 'sustantivo' 
  | 'verbo' 
  | 'adjetivo' 
  | 'adverbio' 
  | 'pronombre' 
  | 'partícula' 
  | 'interjección';

export type SuffixType = 'nominal' | 'verbal' | 'independiente';

export type DoubtTrigger = 'low_confidence' | 'dialect_variant' | 'out_of_glossary';

export type DoubtStatus = 'pending' | 'queued_for_expert' | 'resolved';

/** Un significado adicional de una raíz, con el contexto en que se usa. */
export interface WordSense {
  meaning: string;
  context: string;
  /** false = detectado automáticamente, pendiente de revisión */
  verified?: boolean;
}

export interface LexicalRoot {
  id: string;
  quechua: string;
  spanish: string;
  category: GrammarCategory;
  dialectNote: string;
  verified: boolean;
  frequency: number;
  examples: string[];
  /** Otros significados según el contexto (polisemia). `spanish` es el significado principal. */
  senses?: WordSense[];
}

export interface SuffixRule {
  id: string;
  suffix: string;
  type: SuffixType;
  slotOrder: number; // 1 to 6 concatenation order
  function: string;
  cochabambaUsage: string;
  examples: string[];
}

export interface MorphToken {
  surface: string;
  root: string;
  suffixes: string[];
  gloss: string;
  /** Significado léxico de la raíz en español (solo la palabra, sin etiquetas). Lo devuelve la IA. */
  meaning?: string;
  isRecognized: boolean;
  doubtFlag?: DoubtTrigger;
}

export interface CorpusPhrase {
  id: string;
  quechua: string;
  spanish: string;
  morphologicalBreakdown: string; // e.g., "wasi-y-pi ka-sha-ni"
  gloss: string; // e.g., "casa-1SG.POSS-LOC ser/estar-PROG-1SG"
  grammaticalNotes: string;
  tags: string[];
  verified: boolean;
  /** Quién respalda la frase. Si falta, se usa `verified`. 'ia' = borrador sin revisar (no se usa como ejemplo). */
  provenance?: 'segundo-hablante' | 'fuente' | 'revisado-dem' | 'ia';
}

export interface CriticalDoubt {
  id: string;
  term: string;
  trigger: DoubtTrigger;
  contextPhrase: string;
  occurrences: number;
  aiHypothesis: string;
  quechuistaQuestion: string;
  suggestedAction: string;
  status: DoubtStatus;
  resolutionNote?: string;
  createdAt: string;
}

export interface GrammarRule {
  id: string;
  title: string;
  category: string;
  description: string;
  cochabambaSpecificity: string;
  examples: {
    quechua: string;
    spanish: string;
    morphology?: string;
    gloss?: string;
  }[];
}

export interface TranslationResult {
  sourceText: string;
  translatedText: string;
  direction: 'qu-es' | 'es-qu';
  tokens: MorphToken[];
  grammaticalExplanation: string;
  detectedDoubts: Omit<CriticalDoubt, 'id' | 'createdAt'>[];
  /** De dónde salió el resultado: corpus guardado, IA o motor local de contingencia. */
  source?: 'corpus' | 'ai' | 'fallback';
  /** Solo en 'fallback': cuántas palabras pudo resolver el motor con el banco lingüístico. */
  fallbackInfo?: { recognized: number; total: number; method: string };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'model';
  quechuaText: string;
  spanishTranslation: string;
  tokens?: MorphToken[];
  pedagogicalNote?: string;
  timestamp: string;
  /** Mensaje de sistema cuando el tutor no pudo responder (no es una respuesta real). */
  isError?: boolean;
}
