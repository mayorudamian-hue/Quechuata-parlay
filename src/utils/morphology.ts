import { MorphToken, LexicalRoot, SuffixRule } from '../types/quechua';

/**
 * Parsea el texto quechua junto con su desglose morfológico separado por guiones
 * (ej. "wasi-y-pi ka-sha-ni") y su glosa (ej. "casa-1SG.POSS-LOC ser/estar-PROG-1SG"),
 * extrayendo de manera determinista la RAÍZ REAL y los sufijos.
 */
export function parseMorphologicalBreakdown(
  surfaceText: string,
  morphologicalBreakdown: string,
  glossText: string,
  knownRoots: LexicalRoot[] = [],
  knownSuffixes: SuffixRule[] = []
): MorphToken[] {
  const surfaceWords = surfaceText.trim().split(/\s+/).filter(Boolean);
  const morphWords = morphologicalBreakdown.trim().split(/\s+/).filter(Boolean);
  const glossWords = glossText.trim().split(/\s+/).filter(Boolean);

  // Si tenemos desglose explícito con guiones
  if (morphWords.length > 0) {
    return morphWords.map((morphWord, index) => {
      // Limpiar signos de puntuación pegados
      const cleanMorph = morphWord.replace(/^[.,!?;:]+|[.,!?;:]+$/g, '');
      const cleanSurface = (surfaceWords[index] || morphWord.replace(/-/g, '')).replace(/^[.,!?;:]+|[.,!?;:]+$/g, '');
      const cleanGloss = glossWords[index] || '';

      // Si contiene guiones: "wasi-y-pi" -> parts: ["wasi", "y", "pi"]
      if (cleanMorph.includes('-')) {
        const parts = cleanMorph.split('-').filter(Boolean);
        const rawRoot = parts[0];
        const suffixes = parts.slice(1).map((s) => (s.startsWith('-') ? s : `-${s}`));

        // Buscar si la raíz coincide con alguna raíz conocida del banco
        const matchedRoot = knownRoots.find(
          (r) => r.quechua.toLowerCase() === rawRoot.toLowerCase() ||
                 r.quechua.toLowerCase().replace(/y$/, '') === rawRoot.toLowerCase() // ej: mikhu(y)
        );

        return {
          surface: cleanSurface,
          root: matchedRoot ? matchedRoot.quechua : rawRoot,
          suffixes,
          gloss: cleanGloss || (matchedRoot ? `${matchedRoot.spanish.split(',')[0].trim()}${suffixes.join('')}` : `${rawRoot}${suffixes.join('')}`),
          isRecognized: true,
        };
      }

      // Si no tiene guión, intentar analizar con raíces y sufijos conocidos
      return analyzeWordWithKnownDatabase(cleanSurface, knownRoots, knownSuffixes, cleanGloss);
    });
  }

  // Si no hay desglose con guiones, analizar palabra por palabra con el banco lingüístico
  return surfaceWords.map((word) => {
    const cleanWord = word.replace(/^[.,!?;:]+|[.,!?;:]+$/g, '');
    return analyzeWordWithKnownDatabase(cleanWord, knownRoots, knownSuffixes);
  });
}

/**
 * Descompone una palabra quechua basándose en la lista de raíces y sufijos conocidos del banco.
 */
export function analyzeWordWithKnownDatabase(
  word: string,
  knownRoots: LexicalRoot[],
  knownSuffixes: SuffixRule[],
  providedGloss?: string
): MorphToken {
  const lower = word.toLowerCase();

  // 1. Coincidencia exacta con raíz
  const exactRoot = knownRoots.find((r) => r.quechua.toLowerCase() === lower);
  if (exactRoot) {
    return {
      surface: word,
      root: exactRoot.quechua,
      suffixes: [],
      gloss: providedGloss || exactRoot.spanish,
      isRecognized: true,
    };
  }

  // 2. Ordenar raíces por longitud decreciente para evitar falsos positivos cortos
  const sortedRoots = [...knownRoots].sort((a, b) => b.quechua.length - a.quechua.length);

  for (const rootObj of sortedRoots) {
    const rootName = rootObj.quechua.toLowerCase();
    
    // Raíz nominal o raíz verbal (con o sin terminación de infinitivo -y, ej. mikhuy -> mikhu-)
    const rootBase = rootObj.category === 'verbo' && rootName.endsWith('y')
      ? rootName.slice(0, -1)
      : rootName;

    if (lower.startsWith(rootBase) && lower.length > rootBase.length) {
      const remainder = lower.slice(rootBase.length);
      
      // Segmentar remainder en sufijos conocidos
      const foundSuffixes: string[] = [];
      let currentRemainder = remainder;

      // Ordenar sufijos conocidos por longitud descendente
      const sortedSuffixes = [...knownSuffixes].sort((a, b) => b.suffix.length - a.suffix.length);

      let hasUnknownFragment = false;
      let safetyLoop = 0;
      while (currentRemainder.length > 0 && safetyLoop < 8) {
        safetyLoop++;
        let matchedSuffix = false;

        for (const suf of sortedSuffixes) {
          const sufClean = suf.suffix.replace(/^-|-$/g, '').toLowerCase();
          if (currentRemainder.startsWith(sufClean)) {
            foundSuffixes.push(`-${sufClean}`);
            currentRemainder = currentRemainder.slice(sufClean.length);
            matchedSuffix = true;
            break;
          }
        }

        if (!matchedSuffix) {
          // Si no empareja con sufijo conocido, tomar el fragmento restante
          if (currentRemainder.length > 0) {
            hasUnknownFragment = true;
            foundSuffixes.push(`-${currentRemainder}`);
            currentRemainder = '';
          }
        }
      }

      // Una raíz corta con un resto que no son sufijos conocidos es casi siempre un falso positivo
      if (hasUnknownFragment && rootBase.length < 4) continue;

      return {
        surface: word,
        root: rootObj.quechua,
        suffixes: foundSuffixes,
        gloss: providedGloss || `${rootObj.spanish} + [${foundSuffixes.join('')}]`,
        isRecognized: true,
      };
    }
  }

  // 3. Caso especial: si es kashani / kashanki / kashan / kashanchij
  if (lower.startsWith('kasha')) {
    const sufPart = lower.slice(2); // "sha..."
    const sufTokens = ['-sha-'];
    if (sufPart.includes('ni')) sufTokens.push('-ni');
    else if (sufPart.includes('nki')) sufTokens.push('-nki');
    else if (sufPart.includes('nchij')) sufTokens.push('-nchij');
    else if (sufPart.endsWith('n')) sufTokens.push('-n');

    return {
      surface: word,
      root: 'kay',
      suffixes: sufTokens,
      gloss: providedGloss || 'ser/estar-PROG-1SG',
      isRecognized: true,
    };
  }

  // 4. Si no se identificó raíz conocida
  return {
    surface: word,
    root: word,
    suffixes: [],
    gloss: providedGloss || word,
    isRecognized: false,
    doubtFlag: 'low_confidence',
  };
}
