# Qhawana: Entrenador y Banco Lingüístico de Quechua Cochabambino

Plataforma integral para documentar, estructurar y enriquecer un corpus lingüístico de quechua boliviano (variedad de Cochabamba), instruyendo dinámicamente al modelo Gemini mediante in-context learning con matriz de sufijos rigurosa, glosario de raíces, análisis morfológico interlineal, panel de términos críticos y generación de consultas para quechuistas.

## Decisiones Críticas y Confirmaciones del Usuario

> [!IMPORTANT]
> Se mantiene el plan integrando correcciones y rigor lingüístico estricto de la variedad de Cochabamba (alfabeto normalizado boliviano RM 1032/84):

- **Rigor Ortográfico y Fonológico Cochabambino**:
  - Sistema trivocálico base (/a, i, u/) con alófonos [e, o] condicionados por oclusivas posvelares (/q, qh, q'/).
  - Serie pentavocálica de oclusivas: simples (*p, t, ch, k, q*), aspiradas (*ph, th, chh, kh, qh*) y eyectivas/glotalizadas (*p', t', ch', k', q'*).
  - Ortografía normalizada cochabambina (ej. *jatun* con 'j', *jallp'a*, *kachkani* para progresivo/estado, sin erratas morfológicas).
- **Glosas Morfológicas Interlineales Rigurosas (Normas de Leipzig adaptadas)**:
  - Formato estandarizado: `Palabra / Morfemas descompuestos / Glosa gramatical / Traducción`.
  - Ejemplo riguroso: *Wasi-y-pi kachkani* (`wasi-y-pi ka-chka-ni` / `casa-1SG.POSS-LOC ser/estar-PROG-1SG` / "Estoy en mi casa").
- **Matriz de Sufijos con Orden Estricto de Concatenación (Slot Grammar)**:
  - Raíz + Sufijos derivativos (nominales o verbalizadores/deverbales) + Sufijos flexivos (persona, número, caso, tiempo, aspecto, modo) + Clíticos/Independientes (tópico `-qa`, evidenciales `-mi/-min`, `-si/-sin`, `-chá`, interrogativo/negativo `-chu`, continuativo `-raq`, limitativo `-lla`, etc.).
- **Panel de Términos Críticos en 3 Ejes**:
  - 1. *Baja Confianza*: Dudas estructurales o semánticas del modelo.
  - 2. *Variantes Dialectales*: Diferencias entre Cochabamba y Cusco-Collao, Ayacucho o Quechua Central (ej. términos o giros que no corresponden al uso cochabambino).
  - 3. *Fuera de Glosario / Préstamos*: Castellanismos quechuizados o neologismos pendientes de normalización.
- **Validación en Cascada & Lista para el Quechuista**:
  - Agrupación por frecuencia para corregir o validar una palabra dudosa y propagarla automáticamente en todo el corpus.
  - Exportador quirúrgico para el especialista en formato limpio (impresión formateada, CSV/Excel, Markdown).

---

## 1. Visión General y Propósito

### Qué hace la aplicación
Qhawana ("El mirador / observador") permite construir y gobernar un corpus de Quechua Cochabambino de máxima fidelidad y entrenar al modelo en tiempo real:
1. **Banco Lingüístico Cochabambino**:
   - *Glosario de Raíces*: Sustantivos, verbos, adjetivos, pronombres y partículas de la variante cochabambina con notas de uso real y dialectal.
   - *Matriz de Sufijos*: Catálogo completo con su posición relativa (*slot order*), función morfosintáctica y ejemplos reales.
   - *Corpus de Frases Cotidianas*: Frases bilingües con descomposición morfema por morfema y glosas gramaticales.
2. **Instrucción Contextual Dinámica (In-Context RAG)**:
   - Gemini recibe en cada petición las reglas gramaticales vigentes, el orden estricto de sufijación y ejemplos análogos del corpus validado.
3. **Panel de Términos Críticos & Sesión de Validación**:
   - Detección proactiva de términos dudosos, dialectalismos ajenos o préstamos no consensuados.
   - Herramienta de resolución en cascada por frecuencia.
4. **Lista de Consulta para el Quechuista**:
   - Tarjetas de duda clínica para consultar a lingüistas o hablantes nativos expertos, con contexto, hipótesis morfológica y espacio para el dictamen del especialista.
5. **Módulos de Traducción y Conversación**:
   - Traductor Quechua-Español con analizador morfológico interactivo.
   - Chat conversacional en quechua cochabambino con correcciones pedagógicas y desglose léxico.

---

## 2. Experiencia de Usuario y Diseño Visual

### Navegación y Vistas
- **1. Banco Lingüístico**: Pestañas para *Raíces*, *Sufijos*, *Frases* y *Gramática General*, con filtros por categoría gramatical, estado de validación y búsqueda instantánea.
- **2. Panel de Términos Críticos**: Listado de dudas agrupadas por frecuencia con badge de disparador (*Baja confianza*, *Variante dialectal*, *Fuera de glosario*), modal de validación en cascada y botón directo de "Añadir a lista del quechuista".
- **3. Lista de Consulta para el Quechuista**: Vista de impresión y exportación (PDF/CSV/Markdown) con preguntas quirúrgicas estructuradas.
- **4. Traductor Morfológico**: Entrada de texto con salida bilingüe y desglose interactivo de cada palabra en raíz + sufijos + significado.
- **5. Conversación Quechua**: Chat en tiempo real guiado en quechua cochabambino, con traducción al pasar el cursor (o botón revelar) y tips gramaticales.

### Estilo Visual y Tipografía
- **Aesthetic Direction**: Entorno de investigación lingüística limpio, contemporáneo y solemne.
- **Paleta**: Canvas blanco mineral suave (`#FAF9F6`) o pizarra profunda (`#0F141C`), bordes finos de 1px (`#E5E3DC` / `#232D3B`), acentos en terracota andino sobrio (`#B85028`) y verde ciprés (`#2E7253`) para elementos validados.
- **Tipografía**:
  - Títulos y navegación: `Plus Jakarta Sans`.
  - Contenido y explicaciones: `DM Sans`.
  - Quechua y glosa morfológica: `JetBrains Mono` con alineación tabular para estudiar la morfología palabra por palabra.

---

## 3. Arquitectura Técnica y Datos

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                         │
│                                                                        │
│  ┌───────────────────────┐  ┌───────────────────────────────────────┐  │
│  │   Banco Lingüístico   │  │       Panel Términos Críticos         │  │
│  │ - Raíces cochabambinas│  │ - Filtro: Confianza / Dialecto / Glosa│  │
│  │ - Matriz de sufijos   │  │ - Sesión de validación por frecuencia │  │
│  │ - Corpus con glosas   │  │ - Lista de consulta para Quechuista   │  │
│  └───────────┬───────────┘  └───────────────────┬───────────────────┘  │
│              │                                  │                      │
│              ▼                                  ▼                      │
│  ┌───────────────────────┐  ┌───────────────────────────────────────┐  │
│  │ Traductor & Analizador│  │       Conversación y Práctica         │  │
│  │ - Glosa morfológica   │  │ - Chat interactivo cochabambino       │  │
│  │ - Detección de dudas  │  │ - Correcciones gramaticales en vivo   │  │
│  └───────────┬───────────┘  └───────────────────┬───────────────────┘  │
│              │                                  │                      │
└──────────────┼──────────────────────────────────┼──────────────────────┘
               │  HTTP POST /api/quechua/*        │
               ▼                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      BACKEND (server.ts - Express)                     │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ POST /api/quechua/translate      - Traducción + glosa morfológica│  │
│  │ POST /api/quechua/analyze-doubts - Detección de 3 disparadores   │  │
│  │ POST /api/quechua/chat           - Conversación cochabambina     │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│                                     ▼                                  │
│                       GoogleGenAI (gemini-3.8-flash)                   │
└────────────────────────────────────────────────────────────────────────┘
```

### Esquema de Datos del Corpus
- `LexicalRoot`: `{ id, quechua, spanish, category, dialectNote, verified, examples }`
- `SuffixRule`: `{ id, suffix, type ('nominal'|'verbal'|'independiente'), slotOrder (1-6), function, cochabambaUsage, examples }`
- `CorpusPhrase`: `{ id, quechua, spanish, morphologicalBreakdown, gloss, notes, tags }`
- `CriticalDoubt`: `{ id, term, trigger ('low_confidence'|'dialect_variant'|'out_of_glossary'), contextPhrase, occurrences, aiHypothesis, quechuistaQuestion, status ('pending'|'resolved'|'queued_for_expert'), resolutionNote }`
