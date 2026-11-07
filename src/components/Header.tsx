import React, { useRef, useState } from 'react';
import { useQuechua } from '../context/QuechuaContext';
import { 
  BookOpen, 
  AlertTriangle, 
  FileCheck2, 
  Languages, 
  MessageSquare, 
  Sun, 
  Moon, 
  Download, 
  Upload,
  RotateCcw,
  Wand2
} from 'lucide-react';

export const Header: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    doubts, 
    darkMode, 
    setDarkMode, 
    exportDatasetJSON, 
    importDatasetJSON,
    resetToDefaults
  } = useQuechua();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const pendingDoubtsCount = doubts.filter((d) => d.status === 'pending').length;
  const queuedConsultCount = doubts.filter((d) => d.status === 'queued_for_expert').length;

  const [headerToast, setHeaderToast] = useState<{ show: boolean; msg: string; type: 'success' | 'error' }>({
    show: false,
    msg: '',
    type: 'success',
  });
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importDatasetJSON(content);
        if (success) {
          setHeaderToast({ show: true, msg: 'Base de datos importada correctamente.', type: 'success' });
        } else {
          setHeaderToast({ show: true, msg: 'Error: archivo JSON no compatible.', type: 'error' });
        }
        setTimeout(() => setHeaderToast({ show: false, msg: '', type: 'success' }), 4000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#12161E]/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          
          {/* Zone 1: Brand title, single element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('bank')}
              className="text-left group flex items-baseline gap-2 focus:outline-none"
            >
              <span className="font-display font-extrabold text-xl tracking-tight text-stone-900 dark:text-stone-100">
                Qhawana
              </span>
              <span className="text-xs font-medium text-amber-700 dark:text-amber-500 hidden sm:inline">
                Quechua Cochabambino
              </span>
            </button>
          </div>

          {/* Zone 2: 5 single-line clean nav links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              onClick={() => setActiveTab('bank')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'bank'
                  ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-50 font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <BookOpen className="w-4 h-4 text-stone-500" />
              <span>Banco Lingüístico</span>
            </button>

            <button
              onClick={() => setActiveTab('generator')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'generator'
                  ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-950 dark:text-amber-200 font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <Wand2 className="w-4 h-4 text-amber-600 dark:text-amber-500" />
              <span>Generador de Corpus</span>
            </button>

            <button
              onClick={() => setActiveTab('doubts')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'doubts'
                  ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-50 font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500" />
              <span>Términos Críticos</span>
              {pendingDoubtsCount > 0 && (
                <span className="ml-1 text-xs px-1.5 py-0.2 font-mono font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 rounded">
                  {pendingDoubtsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('consultation')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'consultation'
                  ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-50 font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <FileCheck2 className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
              <span>Lista del Quechuista</span>
              {queuedConsultCount > 0 && (
                <span className="ml-1 text-xs px-1.5 py-0.2 font-mono font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 rounded">
                  {queuedConsultCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('translator')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'translator'
                  ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-50 font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <Languages className="w-4 h-4 text-blue-600 dark:text-blue-500" />
              <span>Traductor & Glosa</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'chat'
                  ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-50 font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Conversación</span>
            </button>
          </nav>

          {/* Zone 3: 1 primary action or clean utility buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />
            
            <button
              onClick={exportDatasetJSON}
              title="Descargar base de datos (JSON)"
              className="p-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              title="Importar base de datos (JSON)"
              className="p-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <Upload className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowResetConfirm(true)}
              title="Restaurar base inicial cochabambina"
              className="p-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <div className="h-4 w-[1px] bg-stone-300 dark:bg-stone-700 mx-1" />

            <button
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              className="p-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Row */}
        <div className="md:hidden flex items-center justify-between overflow-x-auto py-2 border-t border-stone-200 dark:border-stone-800 gap-2">
          <button
            onClick={() => setActiveTab('bank')}
            className={`px-3 py-1 text-xs font-medium rounded whitespace-nowrap ${
              activeTab === 'bank' ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900' : 'text-stone-600 dark:text-stone-400'
            }`}
          >
            Banco
          </button>
          <button
            onClick={() => setActiveTab('generator')}
            className={`px-3 py-1 text-xs font-medium rounded whitespace-nowrap ${
              activeTab === 'generator' ? 'bg-amber-600 text-white' : 'text-stone-600 dark:text-stone-400'
            }`}
          >
            Generador
          </button>
          <button
            onClick={() => setActiveTab('doubts')}
            className={`px-3 py-1 text-xs font-medium rounded whitespace-nowrap ${
              activeTab === 'doubts' ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900' : 'text-stone-600 dark:text-stone-400'
            }`}
          >
            Términos Críticos ({pendingDoubtsCount})
          </button>
          <button
            onClick={() => setActiveTab('consultation')}
            className={`px-3 py-1 text-xs font-medium rounded whitespace-nowrap ${
              activeTab === 'consultation' ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900' : 'text-stone-600 dark:text-stone-400'
            }`}
          >
            Quechuista ({queuedConsultCount})
          </button>
          <button
            onClick={() => setActiveTab('translator')}
            className={`px-3 py-1 text-xs font-medium rounded whitespace-nowrap ${
              activeTab === 'translator' ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900' : 'text-stone-600 dark:text-stone-400'
            }`}
          >
            Traductor
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1 text-xs font-medium rounded whitespace-nowrap ${
              activeTab === 'chat' ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900' : 'text-stone-600 dark:text-stone-400'
            }`}
          >
            Conversación
          </button>
        </div>

      </div>

      {/* In-app Toast Banner */}
      {headerToast.show && (
        <div className={`px-4 py-2.5 text-xs font-medium text-center transition-colors ${
          headerToast.type === 'success' 
            ? 'bg-emerald-600 text-white' 
            : 'bg-red-600 text-white'
        }`}>
          {headerToast.msg}
        </div>
      )}

      {/* In-app Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-700 dark:text-amber-400 shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-stone-900 dark:text-stone-100">
                  ¿Restaurar base de datos inicial?
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Variante Quechua Cochabambino
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              Esta acción restaurará el corpus normativo precargado con las raíces, la matriz de sufijos (incluyendo el progresivo <code className="font-mono bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded text-amber-700 dark:text-amber-400">-sha-</code>) y las reglas gramaticales iniciales.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  resetToDefaults();
                  setShowResetConfirm(false);
                  setHeaderToast({ show: true, msg: 'Base de datos restaurada al corpus inicial cochabambino.', type: 'success' });
                  setTimeout(() => setHeaderToast({ show: false, msg: '', type: 'success' }), 4000);
                }}
                className="px-4 py-2 text-xs font-semibold bg-amber-700 hover:bg-amber-800 text-white rounded-lg transition-colors"
              >
                Sí, restaurar base inicial
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
