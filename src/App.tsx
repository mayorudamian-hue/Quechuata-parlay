import React from 'react';
import { QuechuaProvider, useQuechua } from './context/QuechuaContext';
import { Header } from './components/Header';
import { LexicalBankView } from './components/LexicalBankView';
import { CriticalTermsPanel } from './components/CriticalTermsPanel';
import { QuechuistaConsultationView } from './components/QuechuistaConsultationView';
import { TranslatorView } from './components/TranslatorView';
import { ConversationView } from './components/ConversationView';
import { PersonalPronounsGuide } from './components/PersonalPronounsGuide';
import { VerbTensesGuide } from './components/VerbTensesGuide';

function AppContent() {
  const { activeTab } = useQuechua();

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#0E1217] text-stone-900 dark:text-stone-100 flex flex-col transition-colors selection:bg-amber-200 selection:text-amber-950">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'bank' && <LexicalBankView />}
        {activeTab === 'doubts' && <CriticalTermsPanel />}
        {activeTab === 'consultation' && <QuechuistaConsultationView />}
        {activeTab === 'translator' && (
          <div className="space-y-6">
            <TranslatorView />
            <PersonalPronounsGuide />
            <VerbTensesGuide />
          </div>
        )}
        {activeTab === 'chat' && <ConversationView />}
      </main>

      <footer className="print:hidden border-t border-stone-200 dark:border-stone-850 py-6 bg-white dark:bg-[#12161E] text-xs text-stone-500 dark:text-stone-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-800 dark:text-stone-200">Qhawana</span>
            <span>·</span>
            <span>Norma Oficial del Quechua Boliviano (RM 1032/84)</span>
            <span>·</span>
            <span>Variedad Cochabambina (-sha-, -min, -sina, -raj, -taj, -puni)</span>
          </div>
          <div>Entrenador contextual e investigación morfológica para quechua andino</div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <QuechuaProvider>
      <AppContent />
    </QuechuaProvider>
  );
}
