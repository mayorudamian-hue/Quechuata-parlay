import { parseSenses, sensesToText } from '../utils/retrieval';
import React, { useState } from 'react';
import { useQuechua } from '../context/QuechuaContext';
import { 
  GrammarCategory, 
  SuffixType, 
  LexicalRoot, 
  SuffixRule, 
  CorpusPhrase,
  GrammarRule
} from '../types/quechua';
import { 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  Tag, 
  Sparkles, 
  Trash2, 
  BookMarked, 
  Layers, 
  FileText,
  HelpCircle,
  ArrowRight,
  Pencil,
  AlertTriangle,
  Send,
  Check
} from 'lucide-react';

export const LexicalBankView: React.FC = () => {
  const { 
    roots, 
    suffixes, 
    phrases, 
    grammarRules,
    addRoot, 
    updateRoot,
    deleteRoot, 
    toggleVerifyRoot,
    addSuffix, 
    updateSuffix,
    deleteSuffix,
    addPhrase, 
    updatePhrase,
    deletePhrase, 
    toggleVerifyPhrase,
    addGrammarRule,
    updateGrammarRule,
    deleteGrammarRule,
    applyCascadeCorrection,
    addDoubt,
    setActiveTab
  } = useQuechua();

  const [activeSubTab, setActiveSubTab] = useState<'roots' | 'suffixes' | 'phrases' | 'grammar'>('roots');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSuffixType, setSelectedSuffixType] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string>('');
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'root' | 'suffix' | 'phrase' | 'rule'; id: string; name: string } | null>(null);

  // Modal States - Add
  const [isAddRootOpen, setIsAddRootOpen] = useState(false);
  const [newRoot, setNewRoot] = useState<Omit<LexicalRoot, 'id' | 'frequency'>>({
    quechua: '',
    spanish: '',
    category: 'verbo',
    dialectNote: '',
    verified: true,
    examples: [],
  });
  const [newRootExampleInput, setNewRootExampleInput] = useState('');

  const [isAddSuffixOpen, setIsAddSuffixOpen] = useState(false);
  const [newSuffix, setNewSuffix] = useState<Omit<SuffixRule, 'id'>>({
    suffix: '',
    type: 'verbal',
    slotOrder: 2,
    function: '',
    cochabambaUsage: '',
    examples: [],
  });
  const [newSuffixExampleInput, setNewSuffixExampleInput] = useState('');

  const [isAddPhraseOpen, setIsAddPhraseOpen] = useState(false);
  const [newPhrase, setNewPhrase] = useState<Omit<CorpusPhrase, 'id'>>({
    quechua: '',
    spanish: '',
    morphologicalBreakdown: '',
    gloss: '',
    grammaticalNotes: '',
    tags: ['cotidiano'],
    verified: true,
  });
  const [newTagInput, setNewTagInput] = useState('');

  // Modal States - Edit Root
  const [editingRoot, setEditingRoot] = useState<LexicalRoot | null>(null);
  const [editRootQuechua, setEditRootQuechua] = useState('');
  const [editRootSpanish, setEditRootSpanish] = useState('');
  const [editRootCategory, setEditRootCategory] = useState<GrammarCategory>('sustantivo');
  const [editRootNote, setEditRootNote] = useState('');
  const [editRootSenses, setEditRootSenses] = useState('');
  const [editRootVerified, setEditRootVerified] = useState(true);
  const [applyCascadeToCorpus, setApplyCascadeToCorpus] = useState(true);

  // Modal States - Edit Suffix
  const [editingSuffix, setEditingSuffix] = useState<SuffixRule | null>(null);
  const [editSuffixStr, setEditSuffixStr] = useState('');
  const [editSuffixType, setEditSuffixType] = useState<SuffixType>('verbal');
  const [editSuffixSlot, setEditSuffixSlot] = useState(2);
  const [editSuffixFunction, setEditSuffixFunction] = useState('');
  const [editSuffixUsage, setEditSuffixUsage] = useState('');
  const [editSuffixExamplesInput, setEditSuffixExamplesInput] = useState('');
  const [applySuffixCascade, setApplySuffixCascade] = useState(true);

  // Modal States - Edit Phrase
  const [editingPhrase, setEditingPhrase] = useState<CorpusPhrase | null>(null);
  const [editPhraseQuechua, setEditPhraseQuechua] = useState('');
  const [editPhraseSpanish, setEditPhraseSpanish] = useState('');
  const [editPhraseMorph, setEditPhraseMorph] = useState('');
  const [editPhraseGloss, setEditPhraseGloss] = useState('');
  const [editPhraseNotes, setEditPhraseNotes] = useState('');
  const [editPhraseVerified, setEditPhraseVerified] = useState(true);

  // Modal States - Add Grammar Rule
  const [isAddGrammarOpen, setIsAddGrammarOpen] = useState(false);
  const [newGrammarTitle, setNewGrammarTitle] = useState('');
  const [newGrammarCategory, setNewGrammarCategory] = useState('Morfología Nominal');
  const [newGrammarDescription, setNewGrammarDescription] = useState('');
  const [newGrammarSpecificity, setNewGrammarSpecificity] = useState('');
  const [newGrammarExamplesInput, setNewGrammarExamplesInput] = useState('');

  // Modal States - Edit Grammar Rule
  const [editingGrammarRule, setEditingGrammarRule] = useState<GrammarRule | null>(null);
  const [editGrammarTitle, setEditGrammarTitle] = useState('');
  const [editGrammarCategory, setEditGrammarCategory] = useState('');
  const [editGrammarDescription, setEditGrammarDescription] = useState('');
  const [editGrammarSpecificity, setEditGrammarSpecificity] = useState('');
  const [editGrammarExamplesInput, setEditGrammarExamplesInput] = useState('');

  const parseGrammarExamples = (input: string) => {
    return input
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [mainPart, restMorph, restGloss] = line.split('|').map((s) => s.trim());
        let quechua = '';
        let spanish = '';
        if (mainPart.includes('=')) {
          const parts = mainPart.split('=');
          quechua = parts[0]?.trim() || '';
          spanish = parts.slice(1).join('=').trim() || '';
        } else if (mainPart.includes(':')) {
          const parts = mainPart.split(':');
          quechua = parts[0]?.trim() || '';
          spanish = parts.slice(1).join(':').trim() || '';
        } else {
          quechua = mainPart;
          spanish = '';
        }
        return {
          quechua,
          spanish,
          morphology: restMorph || undefined,
          gloss: restGloss || undefined,
        };
      });
  };

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Filtering
  const filteredRoots = roots.filter((r) => {
    const matchesSearch = 
      r.quechua.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.spanish.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.dialectNote.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'all' || r.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const filteredRules = grammarRules.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.cochabambaSpecificity.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredSuffixes = suffixes.filter((s) => {
    const matchesSearch = 
      s.suffix.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.function.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.cochabambaUsage.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedSuffixType === 'all' || s.type === selectedSuffixType;
    return matchesSearch && matchesType;
  }).sort((a, b) => a.slotOrder - b.slotOrder);

  const filteredPhrases = phrases.filter((p) => {
    const matchesSearch = 
      p.quechua.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.spanish.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.morphologicalBreakdown.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.gloss.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Root Handlers
  const handleSaveRoot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoot.quechua.trim() || !newRoot.spanish.trim()) return;
    const examples = newRootExampleInput
      ? newRootExampleInput.split('\n').map((s) => s.trim()).filter(Boolean)
      : [];
    addRoot({ ...newRoot, examples });
    setNewRoot({
      quechua: '',
      spanish: '',
      category: 'sustantivo',
      dialectNote: '',
      verified: true,
      examples: [],
    });
    setNewRootExampleInput('');
    setIsAddRootOpen(false);
    showNotification(`Raíz "${newRoot.quechua}" guardada en el banco.`);
  };

  const handleOpenEditRoot = (root: LexicalRoot) => {
    setEditingRoot(root);
    setEditRootQuechua(root.quechua);
    setEditRootSpanish(root.spanish);
    setEditRootCategory(root.category);
    setEditRootNote(root.dialectNote);
    setEditRootSenses(sensesToText(root.senses));
    setEditRootVerified(root.verified);
    setApplyCascadeToCorpus(true);
  };

  const handleSaveEditedRoot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoot || !editRootQuechua.trim()) return;

    const oldQuechua = editingRoot.quechua.trim();
    const newQuechua = editRootQuechua.trim();
    const termChanged = oldQuechua.toLowerCase() !== newQuechua.toLowerCase();

    updateRoot(editingRoot.id, {
      quechua: newQuechua,
      spanish: editRootSpanish.trim(),
      category: editRootCategory,
      dialectNote: editRootNote.trim(),
      senses: parseSenses(editRootSenses),
      verified: editRootVerified,
    });

    if (termChanged && applyCascadeToCorpus) {
      const count = applyCascadeCorrection(
        oldQuechua,
        newQuechua,
        `Corrección de raíz léxica: "${oldQuechua}" -> "${newQuechua}"`
      );
      showNotification(`Raíz actualizada y corrección en cascada aplicada a ${count} frases del corpus.`);
    } else {
      showNotification(`Raíz "${newQuechua}" actualizada.`);
    }

    setEditingRoot(null);
  };

  const handleReportRootAsDoubt = (root: LexicalRoot) => {
    toggleVerifyRoot(root.id);
    addDoubt({
      term: root.quechua,
      trigger: 'dialect_variant',
      contextPhrase: root.examples[0] || `Raíz registrada: ${root.quechua} (${root.spanish})`,
      occurrences: root.frequency || 1,
      aiHypothesis: `Marcada como no correcta por el usuario. Significado previo: "${root.spanish}". Nota: ${root.dialectNote || 'Pendiente de revisión dialectal.'}`,
      quechuistaQuestion: `¿Es "${root.quechua}" la forma correcta en Quechua Cochabambino o corresponde a otra variante (Cuzco/Ayacucho) o error ortográfico?`,
      suggestedAction: `Revisar y definir término estándar para Cochabamba.`,
      status: 'pending',
    });
    showNotification(`"${root.quechua}" se desvalidó y se envió al Panel de Términos Críticos.`);
  };

  // Suffix Handlers
  const handleSaveSuffix = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSuffix.suffix.trim() || !newSuffix.function.trim()) return;
    const examples = newSuffixExampleInput
      ? newSuffixExampleInput.split('\n').map((s) => s.trim()).filter(Boolean)
      : [];
    addSuffix({ ...newSuffix, examples });
    setNewSuffix({
      suffix: '',
      type: 'independiente',
      slotOrder: 5,
      function: '',
      cochabambaUsage: '',
      examples: [],
    });
    setNewSuffixExampleInput('');
    setIsAddSuffixOpen(false);
    showNotification(`Sufijo "${newSuffix.suffix}" añadido a la matriz.`);
  };

  const handleOpenEditSuffix = (suffix: SuffixRule) => {
    setEditingSuffix(suffix);
    setEditSuffixStr(suffix.suffix);
    setEditSuffixType(suffix.type);
    setEditSuffixSlot(suffix.slotOrder);
    setEditSuffixFunction(suffix.function);
    setEditSuffixUsage(suffix.cochabambaUsage);
    setEditSuffixExamplesInput(suffix.examples.join('\n'));
    setApplySuffixCascade(true);
  };

  const handleSaveEditedSuffix = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSuffix || !editSuffixStr.trim()) return;

    const oldSuffixClean = editingSuffix.suffix.replace(/-/g, '').trim();
    const newSuffixClean = editSuffixStr.replace(/-/g, '').trim();
    const suffixChanged = oldSuffixClean.toLowerCase() !== newSuffixClean.toLowerCase();

    const examples = editSuffixExamplesInput
      ? editSuffixExamplesInput.split('\n').map((s) => s.trim()).filter(Boolean)
      : [];

    updateSuffix(editingSuffix.id, {
      suffix: editSuffixStr.trim(),
      type: editSuffixType,
      slotOrder: editSuffixSlot,
      function: editSuffixFunction.trim(),
      cochabambaUsage: editSuffixUsage.trim(),
      examples,
    });

    if (suffixChanged && applySuffixCascade) {
      const count = applyCascadeCorrection(
        oldSuffixClean,
        newSuffixClean,
        `Normalización de sufijo: "${editingSuffix.suffix}" -> "${editSuffixStr}"`
      );
      showNotification(`Sufijo actualizado y normalizado en ${count} frases del corpus.`);
    } else {
      showNotification(`Sufijo "${editSuffixStr}" actualizado en la matriz.`);
    }

    setEditingSuffix(null);
  };

  const handleReportSuffixAsDoubt = (suffix: SuffixRule) => {
    addDoubt({
      term: suffix.suffix,
      trigger: 'dialect_variant',
      contextPhrase: suffix.examples[0] || `Sufijo ${suffix.suffix} (Slot ${suffix.slotOrder})`,
      occurrences: 5,
      aiHypothesis: `Duda sobre la pertinencia o uso del sufijo "${suffix.suffix}" en la variedad de Cochabamba. Función: ${suffix.function}`,
      quechuistaQuestion: `¿El sufijo "${suffix.suffix}" corresponde a la norma viva del quechua cochabambino o debe ajustarse a otra variante o grafía?`,
      suggestedAction: `Consultar orden estricto de aparición y compatibilidad con quechuista.`,
      status: 'pending',
    });
    showNotification(`Duda sobre "${suffix.suffix}" enviada al Panel de Términos Críticos.`);
  };

  // Phrase Handlers
  const handleSavePhrase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhrase.quechua.trim() || !newPhrase.spanish.trim()) return;
    const tags = newTagInput
      ? newTagInput.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
      : ['cotidiano'];
    addPhrase({ ...newPhrase, tags });
    setNewPhrase({
      quechua: '',
      spanish: '',
      morphologicalBreakdown: '',
      gloss: '',
      grammaticalNotes: '',
      tags: ['cotidiano'],
      verified: true,
    });
    setNewTagInput('');
    setIsAddPhraseOpen(false);
    showNotification('Frase incorporada al corpus.');
  };

  const handleOpenEditPhrase = (phrase: CorpusPhrase) => {
    setEditingPhrase(phrase);
    setEditPhraseQuechua(phrase.quechua);
    setEditPhraseSpanish(phrase.spanish);
    setEditPhraseMorph(phrase.morphologicalBreakdown);
    setEditPhraseGloss(phrase.gloss);
    setEditPhraseNotes(phrase.grammaticalNotes);
    setEditPhraseVerified(phrase.verified);
  };

  const handleSaveEditedPhrase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPhrase || !editPhraseQuechua.trim()) return;

    updatePhrase(editingPhrase.id, {
      quechua: editPhraseQuechua.trim(),
      spanish: editPhraseSpanish.trim(),
      morphologicalBreakdown: editPhraseMorph.trim(),
      gloss: editPhraseGloss.trim(),
      grammaticalNotes: editPhraseNotes.trim(),
      verified: editPhraseVerified,
    });

    setEditingPhrase(null);
    showNotification('Frase del corpus actualizada correctamente.');
  };

  // Grammar Rule Handlers
  const handleSaveGrammarRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGrammarTitle.trim() || !newGrammarDescription.trim()) return;

    const examples = parseGrammarExamples(newGrammarExamplesInput);

    addGrammarRule({
      title: newGrammarTitle.trim(),
      category: newGrammarCategory.trim() || 'Morfología General',
      description: newGrammarDescription.trim(),
      cochabambaSpecificity: newGrammarSpecificity.trim() || 'Uso vivo en Cochabamba.',
      examples,
    });

    setNewGrammarTitle('');
    setNewGrammarCategory('Morfología Nominal');
    setNewGrammarDescription('');
    setNewGrammarSpecificity('');
    setNewGrammarExamplesInput('');
    setIsAddGrammarOpen(false);
    showNotification(`Regla gramatical "${newGrammarTitle}" guardada.`);
  };

  const handleOpenEditGrammarRule = (rule: GrammarRule) => {
    setEditingGrammarRule(rule);
    setEditGrammarTitle(rule.title);
    setEditGrammarCategory(rule.category);
    setEditGrammarDescription(rule.description);
    setEditGrammarSpecificity(rule.cochabambaSpecificity);
    setEditGrammarExamplesInput(
      rule.examples
        .map((ex: { quechua: string; spanish: string; morphology?: string; gloss?: string }) =>
          `${ex.quechua} = ${ex.spanish}${ex.morphology ? ` | ${ex.morphology}` : ''}${ex.gloss ? ` | ${ex.gloss}` : ''}`
        )
        .join('\n')
    );
  };

  const handleSaveEditedGrammarRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGrammarRule || !editGrammarTitle.trim() || !editGrammarDescription.trim()) return;

    const examples = parseGrammarExamples(editGrammarExamplesInput);

    updateGrammarRule(editingGrammarRule.id, {
      title: editGrammarTitle.trim(),
      category: editGrammarCategory.trim(),
      description: editGrammarDescription.trim(),
      cochabambaSpecificity: editGrammarSpecificity.trim(),
      examples,
    });

    setEditingGrammarRule(null);
    showNotification(`Regla "${editGrammarTitle}" actualizada.`);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage('')} className="text-emerald-700 hover:text-emerald-900">
            Cerrar
          </button>
        </div>
      )}

      {/* Top Banner and Navigation of Bank */}
      <div className="bg-stone-50 dark:bg-stone-900/60 p-6 rounded-xl border border-stone-200 dark:border-stone-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Banco Lingüístico de Quechua Cochabambino
            </h1>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
              Corpus normativo de raíces, matriz de sufijos aglutinantes con orden de concatenación y glosas morfológicas.
            </p>
          </div>

          {/* Sub-tab switcher */}
          <div className="flex items-center gap-1 bg-stone-200/80 dark:bg-stone-800 p-1 rounded-lg shrink-0">
            <button
              onClick={() => setActiveSubTab('roots')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeSubTab === 'roots'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-50 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              1. Raíces ({roots.length})
            </button>
            <button
              onClick={() => setActiveSubTab('suffixes')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeSubTab === 'suffixes'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-50 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              2. Matriz de Sufijos ({suffixes.length})
            </button>
            <button
              onClick={() => setActiveSubTab('phrases')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeSubTab === 'phrases'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-50 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              3. Corpus Cotidiano ({phrases.length})
            </button>
            <button
              onClick={() => setActiveSubTab('grammar')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeSubTab === 'grammar'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-50 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              4. Reglas Gramaticales ({grammarRules.length})
            </button>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Buscar en ${
                activeSubTab === 'roots'
                  ? 'raíces o traducción...'
                  : activeSubTab === 'suffixes'
                  ? 'sufijos o función gramatical...'
                  : activeSubTab === 'phrases'
                  ? 'frases o desglose morfológico...'
                  : 'reglas y gramática...'
              }`}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {activeSubTab === 'roots' && (
            <>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 text-xs bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-800 dark:text-stone-200"
              >
                <option value="all">Todas las categorías</option>
                <option value="verbo">Verbos</option>
                <option value="sustantivo">Sustantivos</option>
                <option value="adjetivo">Adjetivos</option>
                <option value="pronombre">Pronombres</option>
                <option value="adverbio">Adverbios</option>
              </select>

              <button
                onClick={() => setIsAddRootOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Raíz</span>
              </button>
            </>
          )}

          {activeSubTab === 'suffixes' && (
            <>
              <select
                value={selectedSuffixType}
                onChange={(e) => setSelectedSuffixType(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 text-xs bg-white dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-800 dark:text-stone-200"
              >
                <option value="all">Todos los tipos de sufijos</option>
                <option value="verbal">Verbales (-sha-, flexión)</option>
                <option value="nominal">Nominales (casos, posesivos)</option>
                <option value="independiente">Independientes (-min, -sina, -raj, -taj)</option>
              </select>

              <button
                onClick={() => setIsAddSuffixOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Sufijo</span>
              </button>
            </>
          )}

          {activeSubTab === 'phrases' && (
            <button
              onClick={() => setIsAddPhraseOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Frase al Corpus</span>
            </button>
          )}

          {activeSubTab === 'grammar' && (
            <button
              onClick={() => setIsAddGrammarOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Regla Gramatical</span>
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* SUB-TAB 1: RAÍCES LÉXICAS */}
      {/* ======================================================== */}
      {activeSubTab === 'roots' && (
        <div className="bg-white dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-xs text-stone-500 dark:text-stone-400">
              Mostrando <span className="font-mono font-medium text-stone-800 dark:text-stone-200">{filteredRoots.length}</span> raíces léxicas.
              <span className="ml-2 text-amber-700 dark:text-amber-400 font-medium">
                Tip: Haz clic en el estado o usa el lápiz para corregir una palabra no correcta y actualizarla en cascada.
              </span>
            </div>
            <div className="text-xs text-stone-500">
              Ortografía oficial boliviana RM 1032/84
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 dark:bg-stone-900 text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-6">Raíz Quechua</th>
                  <th className="py-3 px-6">Significado en Español</th>
                  <th className="py-3 px-6">Categoría</th>
                  <th className="py-3 px-6">Particularidad Cochabambina</th>
                  <th className="py-3 px-6 text-center">Frecuencia</th>
                  <th className="py-3 px-6 text-center">Estado de Validación</th>
                  <th className="py-3 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                {filteredRoots.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-stone-500">
                      No se encontraron raíces con el filtro actual.
                    </td>
                  </tr>
                ) : (
                  filteredRoots.map((root) => (
                    <tr key={root.id} className="hover:bg-stone-50 dark:hover:bg-stone-900/40 transition-colors">
                      <td className="py-3.5 px-6 font-mono font-semibold text-stone-900 dark:text-stone-100">
                        {root.quechua}
                      </td>
                      <td className="py-3.5 px-6 text-stone-700 dark:text-stone-300 font-medium">
                        {root.spanish}
                        {(root.senses || []).map((sense, i) => (
                          <div key={i} className={`mt-0.5 text-xs font-normal ${sense.verified === false ? 'text-amber-700 dark:text-amber-400' : 'text-stone-500 dark:text-stone-400'}`}>
                            ◦ {sense.meaning}{sense.context ? ` — ${sense.context}` : ''}{sense.verified === false ? ' (sin verificar)' : ''}
                          </div>
                        ))}
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="text-xs text-stone-600 dark:text-stone-400">
                          {root.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-xs text-stone-500 dark:text-stone-400 max-w-xs">
                        {root.dialectNote}
                      </td>
                      <td className="py-3.5 px-6 text-center font-mono text-xs tabular-nums text-stone-600 dark:text-stone-400">
                        {root.frequency}
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <button
                          onClick={() => toggleVerifyRoot(root.id)}
                          title="Haz clic para alternar entre Validado y En revisión"
                          className="inline-flex items-center gap-1 text-xs focus:outline-none hover:underline"
                        >
                          {root.verified ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-medium inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Validado
                            </span>
                          ) : (
                            <span className="text-amber-700 dark:text-amber-400 font-medium inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                              <Clock className="w-3.5 h-3.5" /> En revisión
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditRoot(root)}
                            title="Editar palabra o corregir en cascada"
                            className="text-stone-500 hover:text-amber-700 dark:hover:text-amber-400 p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleReportRootAsDoubt(root)}
                            title="Desvalidar y enviar a Términos Críticos para investigar"
                            className="text-stone-500 hover:text-red-600 dark:hover:text-red-400 p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setDeleteTarget({ type: 'root', id: root.id, name: root.quechua })}
                            title="Eliminar raíz"
                            className="text-stone-400 hover:text-red-600 dark:hover:text-red-400 p-1 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 2: MATRIZ DE SUFIJOS (SLOT GRAMMAR) */}
      {/* ======================================================== */}
      {activeSubTab === 'suffixes' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg text-xs text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-bold">Regla de Concatenación Cochabambina (Slot Grammar):</span> El Quechua aglutina en orden estricto de izquierda a derecha:
              <span className="font-mono ml-2 font-semibold">
                [RAÍZ] → [SLOT 1-2 Derivativos/Aspecto (-sha-)] → [SLOT 3-4 Casos/Posesivos/Flexión] → [SLOT 5-6 Clíticos Independientes (-min, -sina, -raj, -taj, -puni)]
              </span>
            </div>
            <div className="text-[11px] text-stone-500 shrink-0">
              Usa el lápiz (✏️) en cualquier tarjeta para editar un sufijo o su orden.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSuffixes.map((suffix) => (
              <div
                key={suffix.id}
                className="bg-white dark:bg-stone-950 p-5 rounded-xl border border-stone-200 dark:border-stone-800 flex flex-col justify-between hover:border-amber-500/50 transition-all shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-lg font-bold text-amber-700 dark:text-amber-400">
                      {suffix.suffix}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                      <span className="capitalize">{suffix.type}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono font-medium">Slot {suffix.slotOrder}</span>
                    </div>
                  </div>

                  <p className="mt-2 text-sm font-medium text-stone-800 dark:text-stone-200">
                    {suffix.function}
                  </p>

                  <div className="mt-3 p-2.5 bg-stone-50 dark:bg-stone-900 rounded-md text-xs text-stone-600 dark:text-stone-400">
                    <span className="font-semibold text-stone-800 dark:text-stone-200 block mb-1">
                      Uso en Cochabamba:
                    </span>
                    {suffix.cochabambaUsage}
                  </div>

                  {suffix.examples.length > 0 && (
                    <div className="mt-3">
                      <span className="text-xs text-stone-500 block mb-1">Ejemplos:</span>
                      <ul className="space-y-1">
                        {suffix.examples.map((ex, idx) => (
                          <li key={idx} className="font-mono text-xs text-stone-700 dark:text-stone-300">
                            • {ex}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-900 flex items-center justify-between">
                  <button
                    onClick={() => handleReportSuffixAsDoubt(suffix)}
                    title="Enviar discrepancia sobre este sufijo al Panel de Términos Críticos"
                    className="text-stone-400 hover:text-amber-700 dark:hover:text-amber-400 p-1 transition-colors flex items-center gap-1 text-xs"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Duda dialectal</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditSuffix(suffix)}
                      title="Editar sufijo, su orden (Slot) o función"
                      className="p-1 text-stone-500 hover:text-amber-700 dark:hover:text-amber-400 rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setDeleteTarget({ type: 'suffix', id: suffix.id, name: suffix.suffix })}
                      title="Eliminar sufijo"
                      className="text-stone-400 hover:text-red-600 p-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 3: CORPUS DE FRASES COTIDIANAS CON GLOSAS */}
      {/* ======================================================== */}
      {activeSubTab === 'phrases' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {filteredPhrases.map((phrase) => (
              <div
                key={phrase.id}
                className="bg-white dark:bg-stone-950 p-5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="space-y-1.5 flex-1">
                    {/* Frase Quechua */}
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-bold text-lg text-stone-900 dark:text-stone-100">
                        {phrase.quechua}
                      </h3>
                      {phrase.verified && (
                        <span title="Frase certificada cochabambina" className="text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" />
                        </span>
                      )}
                    </div>

                    {/* Traducción al Español */}
                    <p className="text-stone-700 dark:text-stone-300 text-sm italic">
                      "{phrase.spanish}"
                    </p>

                    {/* Desglose Morfológico Interlineal */}
                    <div className="mt-3 p-3 bg-stone-50 dark:bg-stone-900 rounded-lg space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-semibold text-amber-800 dark:text-amber-400 uppercase tracking-wider w-20 shrink-0">
                          Morfemas:
                        </span>
                        <span className="font-mono text-xs font-semibold text-stone-800 dark:text-stone-200">
                          {phrase.morphologicalBreakdown}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-semibold text-blue-800 dark:text-blue-400 uppercase tracking-wider w-20 shrink-0">
                          Glosa:
                        </span>
                        <span className="font-mono text-xs text-stone-600 dark:text-stone-400">
                          {phrase.gloss}
                        </span>
                      </div>
                    </div>

                    {phrase.grammaticalNotes && (
                      <p className="text-xs text-stone-500 dark:text-stone-400 pt-1">
                        <span className="font-semibold text-stone-700 dark:text-stone-300">Nota:</span>{' '}
                        {phrase.grammaticalNotes}
                      </p>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
                    <div className="flex flex-wrap gap-1">
                      {phrase.tags.map((tag, i) => (
                        <span key={i} className="text-xs text-stone-500 dark:text-stone-400">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditPhrase(phrase)}
                        title="Editar frase o corregir glosa morfológica"
                        className="p-1.5 text-stone-500 hover:text-amber-700 dark:hover:text-amber-400 rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => toggleVerifyPhrase(phrase.id)}
                        className={`text-xs px-2.5 py-1 rounded transition-colors ${
                          phrase.verified
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300'
                        }`}
                      >
                        {phrase.verified ? 'Verificada' : 'Marcar verificada'}
                      </button>

                      <button
                        onClick={() => setDeleteTarget({ type: 'phrase', id: phrase.id, name: phrase.quechua })}
                        className="text-stone-400 hover:text-red-600 p-1 rounded"
                        title="Eliminar frase del corpus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 4: REGLAS GRAMATICALES */}
      {/* ======================================================== */}
      {activeSubTab === 'grammar' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg text-xs text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-bold">Reglas Lingüísticas y Gramaticales de Cochabamba:</span> Normas fonológicas, morfológicas y sintácticas activas que rigen el motor de traducción y el desglose interlineal.
            </div>
            <button
              onClick={() => setIsAddGrammarOpen(true)}
              className="px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white font-medium rounded text-xs inline-flex items-center gap-1 shrink-0 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Nueva Regla
            </button>
          </div>

          {filteredRules.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-500 text-sm">
              No se encontraron reglas gramaticales con el criterio de búsqueda actual.
            </div>
          ) : (
            filteredRules.map((rule) => (
              <div
                key={rule.id}
                className="bg-white dark:bg-stone-950 p-6 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-amber-500/50 transition-all shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
                      {rule.title}
                    </h3>
                    <span className="inline-block mt-1 text-xs font-medium px-2.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                      {rule.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleOpenEditGrammarRule(rule)}
                      title="Editar regla gramatical"
                      className="p-1.5 text-stone-500 hover:text-amber-700 dark:hover:text-amber-400 rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ type: 'rule', id: rule.id, name: rule.title })}
                      title="Eliminar regla"
                      className="p-1.5 text-stone-400 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="mt-3 text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                  {rule.description}
                </p>

                <div className="mt-3 p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 rounded-lg text-xs text-amber-900 dark:text-amber-200">
                  <span className="font-bold">Particularidad de Cochabamba:</span> {rule.cochabambaSpecificity}
                </div>

                {rule.examples.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <span className="text-xs font-semibold text-stone-500">Ejemplos ilustrativos:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {rule.examples.map((ex, i) => (
                        <div key={i} className="p-2.5 bg-stone-50 dark:bg-stone-900 rounded border border-stone-100 dark:border-stone-800">
                          <div className="font-mono text-xs font-bold text-stone-900 dark:text-stone-100">
                            {ex.quechua}
                          </div>
                          <div className="text-xs text-stone-600 dark:text-stone-400 italic">
                            {ex.spanish}
                          </div>
                          {ex.morphology && (
                            <div className="text-xs font-mono text-amber-700 dark:text-amber-400 mt-1">
                              {ex.morphology}
                            </div>
                          )}
                          {ex.gloss && (
                            <div className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
                              {ex.gloss}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDITAR RAÍZ (CON OPCIÓN DE CASCADA) */}
      {/* ======================================================== */}
      {editingRoot && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-500 mb-2">
              <Pencil className="w-5 h-5" />
              <h2 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
                Editar y Corregir Raíz Léxica
              </h2>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              Si esta palabra estaba validada por error, puedes corregir su ortografía, cambiar su significado o marcarla como "En revisión".
            </p>

            <form onSubmit={handleSaveEditedRoot} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200">
                  Término en Quechua
                </label>
                <input
                  type="text"
                  required
                  value={editRootQuechua}
                  onChange={(e) => setEditRootQuechua(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm font-mono font-semibold bg-stone-50 dark:bg-stone-950 border border-amber-300 dark:border-amber-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                  Significado en Español
                </label>
                <input
                  type="text"
                  required
                  value={editRootSpanish}
                  onChange={(e) => setEditRootSpanish(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                    Categoría
                  </label>
                  <select
                    value={editRootCategory}
                    onChange={(e) => setEditRootCategory(e.target.value as GrammarCategory)}
                    className="mt-1 w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                  >
                    <option value="verbo">Verbo</option>
                    <option value="sustantivo">Sustantivo</option>
                    <option value="adjetivo">Adjetivo</option>
                    <option value="pronombre">Pronombre</option>
                    <option value="adverbio">Adverbio</option>
                    <option value="partícula">Partícula</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                    Estado de Validación
                  </label>
                  <select
                    value={editRootVerified ? 'true' : 'false'}
                    onChange={(e) => setEditRootVerified(e.target.value === 'true')}
                    className="mt-1 w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                  >
                    <option value="true">Validado en Cochabamba</option>
                    <option value="false">En revisión / No validado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                  Nota Dialectal / Justificación de la corrección
                </label>
                <textarea
                  rows={2}
                  value={editRootNote}
                  onChange={(e) => setEditRootNote(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                  Otros significados según el contexto (uno por línea: significado | cuándo se usa)
                </label>
                <textarea
                  rows={3}
                  placeholder={"ej.\nsentarse | con persona como sujeto\nvivir, habitar | con lugar"}
                  value={editRootSenses}
                  onChange={(e) => setEditRootSenses(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              {editingRoot.quechua.toLowerCase() !== editRootQuechua.toLowerCase() && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg">
                  <label className="flex items-center gap-2 text-xs font-semibold text-amber-900 dark:text-amber-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applyCascadeToCorpus}
                      onChange={(e) => setApplyCascadeToCorpus(e.target.checked)}
                      className="rounded text-amber-700"
                    />
                    <span>
                      Reemplazar en cascada "{editingRoot.quechua}" → "{editRootQuechua}" en todas las frases del corpus
                    </span>
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRoot(null)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-amber-700 hover:bg-amber-800 text-white rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDITAR SUFIJO EN LA MATRIZ */}
      {/* ======================================================== */}
      {editingSuffix && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-500 mb-2">
              <Pencil className="w-5 h-5" />
              <h2 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
                Editar Sufijo en la Matriz
              </h2>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              Ajusta la forma del sufijo, su orden de concatenación (Slot 1 al 6), su función o su comportamiento específico en Cochabamba.
            </p>

            <form onSubmit={handleSaveEditedSuffix} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200">
                    Forma del Sufijo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. -sha-, -raj, -min"
                    value={editSuffixStr}
                    onChange={(e) => setEditSuffixStr(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-sm font-mono font-semibold bg-stone-50 dark:bg-stone-950 border border-amber-300 dark:border-amber-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200">
                    Orden de Concatenación (Slot 1-6)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    required
                    value={editSuffixSlot}
                    onChange={(e) => setEditSuffixSlot(parseInt(e.target.value) || 1)}
                    className="mt-1 w-full px-3 py-2 text-sm font-mono bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                  Tipo de Sufijo
                </label>
                <select
                  value={editSuffixType}
                  onChange={(e) => setEditSuffixType(e.target.value as SuffixType)}
                  className="mt-1 w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                >
                  <option value="verbal">Verbal (aspecto, tiempo, persona)</option>
                  <option value="nominal">Nominal (caso, posesivo, número)</option>
                  <option value="independiente">Independiente (clíticos, evidenciales)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                  Función Gramatical
                </label>
                <input
                  type="text"
                  required
                  value={editSuffixFunction}
                  onChange={(e) => setEditSuffixFunction(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                  Comportamiento en Cochabamba
                </label>
                <textarea
                  rows={2}
                  value={editSuffixUsage}
                  onChange={(e) => setEditSuffixUsage(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                  Ejemplos (uno por línea)
                </label>
                <textarea
                  rows={2}
                  value={editSuffixExamplesInput}
                  onChange={(e) => setEditSuffixExamplesInput(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-xs font-mono bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              {editingSuffix.suffix.replace(/-/g, '').toLowerCase() !== editSuffixStr.replace(/-/g, '').toLowerCase() && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg">
                  <label className="flex items-center gap-2 text-xs font-semibold text-amber-900 dark:text-amber-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applySuffixCascade}
                      onChange={(e) => setApplySuffixCascade(e.target.checked)}
                      className="rounded text-amber-700"
                    />
                    <span>
                      Reemplazar en cascada "{editingSuffix.suffix}" → "{editSuffixStr}" en todas las frases del corpus
                    </span>
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSuffix(null)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-amber-700 hover:bg-amber-800 text-white rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Sufijo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDITAR FRASE DEL CORPUS */}
      {/* ======================================================== */}
      {editingPhrase && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 w-full max-w-lg p-6 shadow-2xl">
            <h2 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
              Editar Frase del Corpus
            </h2>
            <form onSubmit={handleSaveEditedPhrase} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                  Frase Quechua
                </label>
                <input
                  type="text"
                  required
                  value={editPhraseQuechua}
                  onChange={(e) => setEditPhraseQuechua(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm font-semibold bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                  Traducción Español
                </label>
                <input
                  type="text"
                  required
                  value={editPhraseSpanish}
                  onChange={(e) => setEditPhraseSpanish(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                  Descomposición de Morfemas
                </label>
                <input
                  type="text"
                  value={editPhraseMorph}
                  onChange={(e) => setEditPhraseMorph(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-xs font-mono bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                  Glosa Gramatical
                </label>
                <input
                  type="text"
                  value={editPhraseGloss}
                  onChange={(e) => setEditPhraseGloss(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-xs font-mono bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                  Nota Explicativa
                </label>
                <textarea
                  rows={2}
                  value={editPhraseNotes}
                  onChange={(e) => setEditPhraseNotes(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-stone-700 dark:text-stone-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editPhraseVerified}
                    onChange={(e) => setEditPhraseVerified(e.target.checked)}
                    className="rounded text-amber-700"
                  />
                  <span>Frase certificada en Quechua Cochabambino</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPhrase(null)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-amber-700 hover:bg-amber-800 text-white rounded-lg transition-colors"
                >
                  Guardar Frase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: AGREGAR RAÍZ */}
      {/* ======================================================== */}
      {isAddRootOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 w-full max-w-lg p-6 shadow-xl">
            <h2 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
              Registrar Nueva Raíz Léxica
            </h2>
            <form onSubmit={handleSaveRoot} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                  Raíz Quechua (con ortografía boliviana)
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. mikhuy, jatun, kawsay"
                  value={newRoot.quechua}
                  onChange={(e) => setNewRoot({ ...newRoot, quechua: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                  Significado en Español
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. comer, grande, vivir"
                  value={newRoot.spanish}
                  onChange={(e) => setNewRoot({ ...newRoot, spanish: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                    Categoría Gramatical
                  </label>
                  <select
                    value={newRoot.category}
                    onChange={(e) => setNewRoot({ ...newRoot, category: e.target.value as GrammarCategory })}
                    className="mt-1 w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                  >
                    <option value="verbo">Verbo</option>
                    <option value="sustantivo">Sustantivo</option>
                    <option value="adjetivo">Adjetivo</option>
                    <option value="pronombre">Pronombre</option>
                    <option value="adverbio">Adverbio</option>
                    <option value="partícula">Partícula</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                    Estado inicial
                  </label>
                  <select
                    value={newRoot.verified ? 'true' : 'false'}
                    onChange={(e) => setNewRoot({ ...newRoot, verified: e.target.value === 'true' })}
                    className="mt-1 w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                  >
                    <option value="true">Validado en Cochabamba</option>
                    <option value="false">Pendiente de revisión</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                  Nota Dialectal / Particularidad en Cochabamba
                </label>
                <textarea
                  rows={2}
                  placeholder="ej. En Cochabamba se usa habitualmente con el sufijo progresivo -sha-..."
                  value={newRoot.dialectNote}
                  onChange={(e) => setNewRoot({ ...newRoot, dialectNote: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                  Ejemplos (uno por línea)
                </label>
                <textarea
                  rows={2}
                  placeholder="Wasiypi kashani&#10;Allillanchu kashanki?"
                  value={newRootExampleInput}
                  onChange={(e) => setNewRootExampleInput(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-xs font-mono bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddRootOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-amber-700 hover:bg-amber-800 text-white rounded-lg transition-colors"
                >
                  Guardar Raíz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: AGREGAR SUFIJO */}
      {/* ======================================================== */}
      {isAddSuffixOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 w-full max-w-lg p-6 shadow-xl">
            <h2 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
              Registrar Nuevo Sufijo en la Matriz
            </h2>
            <form onSubmit={handleSaveSuffix} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                    Sufijo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. -sha-, -min, -raj"
                    value={newSuffix.suffix}
                    onChange={(e) => setNewSuffix({ ...newSuffix, suffix: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-sm font-mono bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                    Orden de Concatenación (Slot 1 a 6)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    required
                    value={newSuffix.slotOrder}
                    onChange={(e) => setNewSuffix({ ...newSuffix, slotOrder: parseInt(e.target.value) || 1 })}
                    className="mt-1 w-full px-3 py-2 text-sm font-mono bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                  Tipo de Sufijo
                </label>
                <select
                  value={newSuffix.type}
                  onChange={(e) => setNewSuffix({ ...newSuffix, type: e.target.value as SuffixType })}
                  className="mt-1 w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                >
                  <option value="verbal">Verbal (aspecto, tiempo, persona)</option>
                  <option value="nominal">Nominal (caso, posesivo, número)</option>
                  <option value="independiente">Independiente (clíticos, evidenciales)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                  Función Gramatical
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Aspecto progresivo continuativo"
                  value={newSuffix.function}
                  onChange={(e) => setNewSuffix({ ...newSuffix, function: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                  Comportamiento en Cochabamba
                </label>
                <textarea
                  rows={2}
                  placeholder="ej. En Cochabamba reemplaza a -chka- y se concatena directamente a la raíz..."
                  value={newSuffix.cochabambaUsage}
                  onChange={(e) => setNewSuffix({ ...newSuffix, cochabambaUsage: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddSuffixOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-amber-700 hover:bg-amber-800 text-white rounded-lg transition-colors"
                >
                  Guardar Sufijo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: AGREGAR FRASE AL CORPUS */}
      {/* ======================================================== */}
      {isAddPhraseOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 w-full max-w-lg p-6 shadow-xl">
            <h2 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
              Añadir Frase Cotidiana con Análisis Morfológico
            </h2>
            <form onSubmit={handleSavePhrase} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                  Frase en Quechua Cochabambino
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Wasiypi kashani, jamuylla."
                  value={newPhrase.quechua}
                  onChange={(e) => setNewPhrase({ ...newPhrase, quechua: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm font-semibold bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                  Traducción al Español
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Estoy en mi casa, pasa nomás."
                  value={newPhrase.spanish}
                  onChange={(e) => setNewPhrase({ ...newPhrase, spanish: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                  Descomposición de Morfemas (separados con guiones)
                </label>
                <input
                  type="text"
                  placeholder="ej. wasi-y-pi ka-sha-ni jamu-y-lla"
                  value={newPhrase.morphologicalBreakdown}
                  onChange={(e) => setNewPhrase({ ...newPhrase, morphologicalBreakdown: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-xs font-mono bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                  Glosa Gramatical
                </label>
                <input
                  type="text"
                  placeholder="ej. casa-1SG.POSS-LOC ser/estar-PROG-1SG venir-IMP-AFECT"
                  value={newPhrase.gloss}
                  onChange={(e) => setNewPhrase({ ...newPhrase, gloss: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-xs font-mono bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                  Explicación o Nota Gramatical
                </label>
                <textarea
                  rows={2}
                  placeholder="ej. En Cochabamba se usa -sha- para el aspecto progresivo en vez de -chka-..."
                  value={newPhrase.grammaticalNotes}
                  onChange={(e) => setNewPhrase({ ...newPhrase, grammaticalNotes: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                  Etiquetas (separadas por coma)
                </label>
                <input
                  type="text"
                  placeholder="ej. saludo, mercado, cortesía, progresivo"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddPhraseOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-amber-700 hover:bg-amber-800 text-white rounded-lg transition-colors"
                >
                  Incorporar al Corpus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: AGREGAR REGLA GRAMATICAL */}
      {/* ======================================================== */}
      {isAddGrammarOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
              Añadir Nueva Regla Gramatical
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Define una regla lingüística, fonológica o morfológica para el Quechua Cochabambino.
            </p>

            <form onSubmit={handleSaveGrammarRule} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Título de la Regla *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Formación del Plural: -s (vocal) / -kuna (consonante)"
                  value={newGrammarTitle}
                  onChange={(e) => setNewGrammarTitle(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Categoría Lingüística
                </label>
                <input
                  type="text"
                  placeholder="ej. Morfología Nominal (Pluralización)"
                  value={newGrammarCategory}
                  onChange={(e) => setNewGrammarCategory(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Descripción General de la Regla *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="ej. Si la palabra termina en vocal, se le añade una -s (wasis); si termina en consonante, se le agrega el sufijo -kuna (atojkuna)."
                  value={newGrammarDescription}
                  onChange={(e) => setNewGrammarDescription(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Particularidad / Uso Específico en Cochabamba
                </label>
                <textarea
                  rows={2}
                  placeholder="ej. En Cochabamba la desinencia -s es obligatoria tras vocal para pluralizar, a diferencia de otras variantes."
                  value={newGrammarSpecificity}
                  onChange={(e) => setNewGrammarSpecificity(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Ejemplos Ilustrativos (un ejemplo por línea)
                </label>
                <p className="text-[11px] text-stone-500 mb-1">
                  Formato: <code className="font-mono bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded">quechua = español | morfología | glosa</code>
                </p>
                <textarea
                  rows={3}
                  placeholder="wasis = casas | wasi-s | casa-PL&#10;atojkuna = zorros | atoj-kuna | zorro-PL"
                  value={newGrammarExamplesInput}
                  onChange={(e) => setNewGrammarExamplesInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddGrammarOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-amber-700 hover:bg-amber-800 text-white rounded-lg transition-colors"
                >
                  Guardar Regla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDITAR REGLA GRAMATICAL */}
      {/* ======================================================== */}
      {editingGrammarRule && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-500 mb-2">
              <Pencil className="w-5 h-5" />
              <h2 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
                Editar Regla Gramatical
              </h2>
            </div>

            <form onSubmit={handleSaveEditedGrammarRule} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Título de la Regla *
                </label>
                <input
                  type="text"
                  required
                  value={editGrammarTitle}
                  onChange={(e) => setEditGrammarTitle(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Categoría Lingüística
                </label>
                <input
                  type="text"
                  value={editGrammarCategory}
                  onChange={(e) => setEditGrammarCategory(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Descripción General *
                </label>
                <textarea
                  rows={3}
                  required
                  value={editGrammarDescription}
                  onChange={(e) => setEditGrammarDescription(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Particularidad / Uso en Cochabamba
                </label>
                <textarea
                  rows={2}
                  value={editGrammarSpecificity}
                  onChange={(e) => setEditGrammarSpecificity(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Ejemplos Ilustrativos
                </label>
                <p className="text-[11px] text-stone-500 mb-1">
                  Formato: <code className="font-mono bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded">quechua = español | morfología | glosa</code>
                </p>
                <textarea
                  rows={3}
                  value={editGrammarExamplesInput}
                  onChange={(e) => setEditGrammarExamplesInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingGrammarRule(null)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-amber-700 hover:bg-amber-800 text-white rounded-lg transition-colors"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMACIÓN DE ELIMINACIÓN */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 w-full max-w-sm p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-stone-900 dark:text-stone-100">
                  ¿Confirmar eliminación?
                </h3>
                <p className="text-xs text-stone-500 capitalize">
                  {deleteTarget.type === 'root'
                    ? 'Raíz léxica'
                    : deleteTarget.type === 'suffix'
                    ? 'Sufijo de matriz'
                    : deleteTarget.type === 'phrase'
                    ? 'Frase del corpus'
                    : 'Regla gramatical'}
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300">
              ¿Estás seguro de que deseas eliminar <span className="font-mono font-bold text-stone-900 dark:text-stone-100">"{deleteTarget.name}"</span>? Esta acción no se puede deshacer.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteTarget.type === 'root') {
                    deleteRoot(deleteTarget.id);
                    setToastMessage(`Raíz "${deleteTarget.name}" eliminada.`);
                  } else if (deleteTarget.type === 'suffix') {
                    deleteSuffix(deleteTarget.id);
                    setToastMessage(`Sufijo "${deleteTarget.name}" eliminado de la matriz.`);
                  } else if (deleteTarget.type === 'phrase') {
                    deletePhrase(deleteTarget.id);
                    setToastMessage(`Frase eliminada del corpus.`);
                  } else if (deleteTarget.type === 'rule') {
                    deleteGrammarRule(deleteTarget.id);
                    setToastMessage(`Regla "${deleteTarget.name}" eliminada.`);
                  }
                  setDeleteTarget(null);
                  setTimeout(() => setToastMessage(''), 3500);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
