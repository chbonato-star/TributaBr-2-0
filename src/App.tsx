/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PresetSelector } from './components/PresetSelector';
import { InputPanel } from './components/InputPanel';
import { ComparisonKPIs } from './components/ComparisonKPIs';
import { DRETable } from './components/DRETable';
import { TransitionTimeline } from './components/TransitionTimeline';
import { SplitPaymentSimulator } from './components/SplitPaymentSimulator';
import { SupplierChainSimulator } from './components/SupplierChainSimulator';
import { InteractiveCharts } from './components/InteractiveCharts';
import { MarginScatterPlot } from './components/MarginScatterPlot';
import { SimplesSimulator } from './components/SimplesSimulator';
import { ImpactAlert } from './components/ImpactAlert';
import { ExportModal } from './components/ExportModal';
import { 
  EconomicSector, 
  CompanyFinancialInput, 
  LegacyTaxRates, 
  ReformTaxRates 
} from './types/tax';
import { calculateTaxSimulation, SECTOR_PRESETS, getStateICMS } from './lib/taxCalculations';
import { BookOpen, Shield, RefreshCw } from 'lucide-react';

export default function App() {
  // Tema Claro / Escuro
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  // Navegação por Abas
  const [activeTab, setActiveTab] = useState<string>('visao-geral');
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  // Setor Selecionado & Estados Fiscais
  const [selectedSector, setSelectedSector] = useState<EconomicSector>('comercio_varejo');
  
  const initialPreset = SECTOR_PRESETS['comercio_varejo'];
  const [input, setInput] = useState<CompanyFinancialInput>(initialPreset.defaultInput);
  const [legacyRates, setLegacyRates] = useState<LegacyTaxRates>(initialPreset.defaultLegacyRates);
  const [reformRates, setReformRates] = useState<ReformTaxRates>(initialPreset.defaultReformRates);

  // Troca de Preset preservando a UF atual se definida
  const handleSelectSector = (sector: EconomicSector) => {
    setSelectedSector(sector);
    const preset = SECTOR_PRESETS[sector];
    const currentUF = input.stateUF || 'SP';
    const stateInfo = getStateICMS(currentUF);
    const isPureService = ['servicos_geral', 'servicos_regulamentados', 'servicos_reduzidos'].includes(sector);

    setInput({
      ...preset.defaultInput,
      stateUF: currentUF,
    });
    setLegacyRates({
      ...preset.defaultLegacyRates,
      icmsRate: isPureService ? preset.defaultLegacyRates.icmsRate : stateInfo.effectiveStandardRate,
    });
    setReformRates(preset.defaultReformRates);
  };

  // Restaura dados do setor atual preservando a UF
  const handleResetCurrentSector = () => {
    const preset = SECTOR_PRESETS[selectedSector];
    const currentUF = input.stateUF || 'SP';
    const stateInfo = getStateICMS(currentUF);
    const isPureService = ['servicos_geral', 'servicos_regulamentados', 'servicos_reduzidos'].includes(selectedSector);

    setInput({
      ...preset.defaultInput,
      stateUF: currentUF,
    });
    setLegacyRates({
      ...preset.defaultLegacyRates,
      icmsRate: isPureService ? preset.defaultLegacyRates.icmsRate : stateInfo.effectiveStandardRate,
    });
    setReformRates(preset.defaultReformRates);
  };

  // Motor de cálculo executado reativamente
  const simulation = calculateTaxSimulation(input, legacyRates, reformRates);

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors flex flex-col font-sans">
      
      {/* Top Bar Navigation (Strict 3-Zone Contract) */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onOpenExport={() => setIsExportOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Banner do Contexto Legal da Reforma */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Simulação Comparativa da Reforma Tributária sobre o Consumo
                </h1>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                  EC 132/2023 · PLP 68/2024
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-3xl">
                Substituição de PIS, COFINS, IPI, ICMS e ISS pelo modelo de IVA Dual (CBS Federal + IBS Subnacional e Imposto Seletivo). Cálculo com não-cumulatividade plena e princípio do destino.
              </p>
            </div>
          </div>

          <button
            onClick={handleResetCurrentSector}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Restaurar parâmetros padrão deste setor"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restaurar Padrões</span>
          </button>
        </div>

        {/* Seletor Rápido de Setor */}
        <PresetSelector
          selectedSector={selectedSector}
          onSelectSector={handleSelectSector}
        />

        {/* Resumo de Indicadores Principais (KPIs) */}
        <ComparisonKPIs simulation={simulation} />

        {/* Renderização Condicional por Aba */}
        {activeTab === 'visao-geral' && (
          <div className="space-y-6">
            <InputPanel
              input={input}
              legacyRates={legacyRates}
              reformRates={reformRates}
              onInputChange={setInput}
              onLegacyRatesChange={setLegacyRates}
              onReformRatesChange={setReformRates}
            />

            <InteractiveCharts
              simulation={simulation}
              input={input}
              reformRates={reformRates}
            />

            <MarginScatterPlot
              simulation={simulation}
              input={input}
              legacyRates={legacyRates}
              reformRates={reformRates}
            />

            <ImpactAlert
              simulation={simulation}
              input={input}
              reformRates={reformRates}
            />

            <DRETable
              simulation={simulation}
              input={input}
            />
          </div>
        )}

        {activeTab === 'transicao' && (
          <div className="space-y-6">
            <TransitionTimeline
              simulation={simulation}
              input={input}
              reformRates={reformRates}
              onReformRatesChange={setReformRates}
            />

            <InteractiveCharts
              simulation={simulation}
              input={input}
              reformRates={reformRates}
            />
          </div>
        )}

        {activeTab === 'split-payment' && (
          <div className="space-y-6">
            <SplitPaymentSimulator
              simulation={simulation}
            />

            <ImpactAlert
              simulation={simulation}
              input={input}
              reformRates={reformRates}
            />

            <DRETable
              simulation={simulation}
              input={input}
            />
          </div>
        )}

        {activeTab === 'simples' && (
          <div className="space-y-6">
            <SimplesSimulator
              input={input}
              legacyRates={legacyRates}
              reformRates={reformRates}
              onApplyModel={(model) => {
                setInput({ ...input, taxRegime: 'simples_nacional', simplesModel: model });
                setActiveTab('visao-geral');
              }}
            />
          </div>
        )}

        {activeTab === 'fornecedores' && (
          <div className="space-y-6">
            <SupplierChainSimulator
              input={input}
              reformRates={reformRates}
              onUpdateSimplesPercent={(percent) => setReformRates({ ...reformRates, purchasesFromSimplesPercent: percent })}
            />

            <ImpactAlert
              simulation={simulation}
              input={input}
              reformRates={reformRates}
            />

            <DRETable
              simulation={simulation}
              input={input}
            />
          </div>
        )}

      </main>

      {/* Footer com Metadados Limpos e Transparência Legal */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-xs text-slate-500 dark:text-slate-400 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-400" />
            <span>TributaBR · Análise Tributária Corporativa</span>
            <span aria-hidden="true">·</span>
            <span>Regulamentação EC 132/2023 & PLP 68/2024</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Alíquota de Referência Base: {reformRates.referenceRate}%</span>
            <span aria-hidden="true">·</span>
            <span>Princípio do Destino & Crédito Amplo</span>
          </div>
        </div>
      </footer>

      {/* Modal de Exportação de Relatórios */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        simulation={simulation}
        input={input}
        reformRates={reformRates}
      />

    </div>
  );
}
