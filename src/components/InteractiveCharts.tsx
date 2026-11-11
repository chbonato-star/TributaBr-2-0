import React, { useState } from 'react';
import { SimulationResult, CompanyFinancialInput, ReformTaxRates } from '../types/tax';
import { calculateTransitionTimeline, formatBRL, formatPercent } from '../lib/taxCalculations';
import { BarChart3, TrendingUp, Layers, PieChart, Percent, DollarSign } from 'lucide-react';

interface InteractiveChartsProps {
  simulation: SimulationResult;
  input: CompanyFinancialInput;
  reformRates?: ReformTaxRates;
}

export const InteractiveCharts: React.FC<InteractiveChartsProps> = ({ simulation, input, reformRates }) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [chartValueMode, setChartValueMode] = useState<'both' | 'currency' | 'percent'>('both');
  const { legacy, reform, comparison } = simulation;
  const revenue = input.revenue > 0 ? input.revenue : 1;

  const timeline = calculateTransitionTimeline(simulation, input.revenue, reformRates);
  const maxTimelineTax = Math.max(...timeline.map((t) => t.effectiveCombinedTaxEstimatedBrl), 1);
  const maxBarValue = Math.max(legacy.totalDebits, reform.totalDebits, 1);

  // Helper de formatação de valores para os blocos do gráfico
  const formatBlockText = (name: string, val: number, heightPercent: number) => {
    const pct = (val / revenue) * 100;
    
    // Se o bloco for muito pequeno (< 14% de altura), renderiza versão compacta
    if (heightPercent < 14) {
      if (chartValueMode === 'percent') return `${name} ${formatPercent(pct, 1)}`;
      if (chartValueMode === 'currency') return `${name} ${formatBRL(val)}`;
      return `${name} ${formatPercent(pct, 1)}`;
    }

    if (chartValueMode === 'currency') {
      return (
        <div className="flex flex-col items-center leading-tight">
          <span className="font-bold">{name}</span>
          <span className="font-mono text-[10px] tabular-nums opacity-95">{formatBRL(val)}</span>
        </div>
      );
    }

    if (chartValueMode === 'percent') {
      return (
        <div className="flex flex-col items-center leading-tight">
          <span className="font-bold">{name}</span>
          <span className="font-mono text-[10px] tabular-nums opacity-95">{formatPercent(pct, 1)}</span>
        </div>
      );
    }

    // Modo 'both' (Padrão)
    return (
      <div className="flex flex-col items-center leading-tight">
        <span className="font-bold text-[10px] sm:text-xs">{name}</span>
        <span className="font-mono text-[9px] sm:text-[10px] tabular-nums font-semibold opacity-95">{formatBRL(val)}</span>
        <span className="font-mono text-[8px] sm:text-[9px] tabular-nums opacity-85">({formatPercent(pct, 1)})</span>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      
      {/* Gráfico 1: Decomposição de Tributos sobre Vendas (Atual vs Reforma) com valores explícitos */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 flex flex-col justify-between">
        <div>
          
          {/* Topo do Card com Seletor de Modo de Exibição dos Valores no Gráfico */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Composição Tributária Bruta sobre Vendas
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Valores e alíquotas nominais de saída incidentes sobre o faturamento
              </p>
            </div>

            {/* Alternador de exibição R$ / % no gráfico */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0 self-start sm:self-auto">
              <button
                onClick={() => setChartValueMode('both')}
                className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                  chartValueMode === 'both'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                R$ e %
              </button>
              <button
                onClick={() => setChartValueMode('currency')}
                className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                  chartValueMode === 'currency'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                R$
              </button>
              <button
                onClick={() => setChartValueMode('percent')}
                className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                  chartValueMode === 'percent'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                %
              </button>
            </div>
          </div>

          {/* Barras Lado a Lado com valores estampados nos blocos */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6 pt-3">
            
            {/* Barra Sistema Legado (Atual) */}
            <div className="space-y-2">
              <div className="flex justify-between items-baseline text-xs pb-1 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200">Sistema Legado</span>
                <span className="font-mono font-extrabold text-slate-900 dark:text-white tabular-nums">
                  {formatBRL(legacy.totalDebits)} <span className="text-[10px] font-normal text-slate-500">({formatPercent((legacy.totalDebits / revenue) * 100, 1)})</span>
                </span>
              </div>

              {/* Stack visual da barra atual com altura expandida e texto interno legível */}
              <div className="h-56 w-full bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex flex-col-reverse p-1.5 gap-1.5 border border-slate-200 dark:border-slate-700/60 shadow-inner">
                
                {/* ICMS */}
                {legacy.icmsDebit > 0 && (() => {
                  const h = (legacy.icmsDebit / maxBarValue) * 88;
                  return (
                    <div
                      style={{ height: `${Math.max(14, h)}%` }}
                      className="w-full bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-2xs transition-all hover:brightness-110 p-1 text-center"
                      title={`ICMS: ${formatBRL(legacy.icmsDebit)} (${formatPercent((legacy.icmsDebit / revenue) * 100, 2)} da receita)`}
                    >
                      {formatBlockText('ICMS', legacy.icmsDebit, h)}
                    </div>
                  );
                })()}

                {/* ISS */}
                {legacy.issDebit > 0 && (() => {
                  const h = (legacy.issDebit / maxBarValue) * 88;
                  return (
                    <div
                      style={{ height: `${Math.max(14, h)}%` }}
                      className="w-full bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-2xs transition-all hover:brightness-110 p-1 text-center"
                      title={`ISS: ${formatBRL(legacy.issDebit)} (${formatPercent((legacy.issDebit / revenue) * 100, 2)} da receita)`}
                    >
                      {formatBlockText('ISS', legacy.issDebit, h)}
                    </div>
                  );
                })()}

                {/* PIS / COFINS */}
                {(legacy.pisDebit + legacy.cofinsDebit) > 0 && (() => {
                  const val = legacy.pisDebit + legacy.cofinsDebit;
                  const h = (val / maxBarValue) * 88;
                  return (
                    <div
                      style={{ height: `${Math.max(14, h)}%` }}
                      className="w-full bg-cyan-700 rounded-lg flex items-center justify-center text-white shadow-2xs transition-all hover:brightness-110 p-1 text-center"
                      title={`PIS/COFINS: ${formatBRL(val)} (${formatPercent((val / revenue) * 100, 2)} da receita)`}
                    >
                      {formatBlockText('PIS/COF', val, h)}
                    </div>
                  );
                })()}

                {/* IPI */}
                {legacy.ipiDebit > 0 && (() => {
                  const h = (legacy.ipiDebit / maxBarValue) * 88;
                  return (
                    <div
                      style={{ height: `${Math.max(14, h)}%` }}
                      className="w-full bg-amber-600 rounded-lg flex items-center justify-center text-white shadow-2xs transition-all hover:brightness-110 p-1 text-center"
                      title={`IPI: ${formatBRL(legacy.ipiDebit)} (${formatPercent((legacy.ipiDebit / revenue) * 100, 2)} da receita)`}
                    >
                      {formatBlockText('IPI', legacy.ipiDebit, h)}
                    </div>
                  );
                })()}

              </div>

              {/* Lista Estruturada de Valores do Sistema Atual */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/60 text-[11px] space-y-1">
                {legacy.icmsDebit > 0 && (
                  <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" /> ICMS
                    </span>
                    <span className="font-mono tabular-nums font-semibold">
                      {formatBRL(legacy.icmsDebit)} <span className="text-slate-400 font-normal">({formatPercent((legacy.icmsDebit / revenue) * 100, 1)})</span>
                    </span>
                  </div>
                )}
                {legacy.issDebit > 0 && (
                  <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" /> ISS
                    </span>
                    <span className="font-mono tabular-nums font-semibold">
                      {formatBRL(legacy.issDebit)} <span className="text-slate-400 font-normal">({formatPercent((legacy.issDebit / revenue) * 100, 1)})</span>
                    </span>
                  </div>
                )}
                {(legacy.pisDebit + legacy.cofinsDebit) > 0 && (
                  <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="w-2 h-2 rounded-full bg-cyan-700 shrink-0" /> PIS/COFINS
                    </span>
                    <span className="font-mono tabular-nums font-semibold">
                      {formatBRL(legacy.pisDebit + legacy.cofinsDebit)} <span className="text-slate-400 font-normal">({formatPercent(((legacy.pisDebit + legacy.cofinsDebit) / revenue) * 100, 1)})</span>
                    </span>
                  </div>
                )}
                {legacy.ipiDebit > 0 && (
                  <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0" /> IPI
                    </span>
                    <span className="font-mono tabular-nums font-semibold">
                      {formatBRL(legacy.ipiDebit)} <span className="text-slate-400 font-normal">({formatPercent((legacy.ipiDebit / revenue) * 100, 1)})</span>
                    </span>
                  </div>
                )}
              </div>

            </div>

            {/* Barra Novo Sistema (Reforma IVA Dual) */}
            <div className="space-y-2">
              <div className="flex justify-between items-baseline text-xs pb-1 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200">Reforma (IBS/CBS)</span>
                <span className="font-mono font-extrabold text-slate-900 dark:text-white tabular-nums">
                  {formatBRL(reform.totalDebits)} <span className="text-[10px] font-normal text-slate-500">({formatPercent((reform.totalDebits / revenue) * 100, 1)})</span>
                </span>
              </div>

              {/* Stack visual da barra reforma com altura expandida e texto interno legível */}
              <div className="h-56 w-full bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex flex-col-reverse p-1.5 gap-1.5 border border-slate-200 dark:border-slate-700/60 shadow-inner">
                
                {/* IBS (Subnacional) */}
                {reform.ibsDebit > 0 && (() => {
                  const h = (reform.ibsDebit / maxBarValue) * 88;
                  return (
                    <div
                      style={{ height: `${Math.max(14, h)}%` }}
                      className="w-full bg-blue-700 rounded-lg flex items-center justify-center text-white shadow-2xs transition-all hover:brightness-110 p-1 text-center"
                      title={`IBS (Estados & Municípios): ${formatBRL(reform.ibsDebit)} (${formatPercent((reform.ibsDebit / revenue) * 100, 2)} da receita)`}
                    >
                      {formatBlockText('IBS (Estados/Mun.)', reform.ibsDebit, h)}
                    </div>
                  );
                })()}

                {/* CBS (Federal) */}
                {reform.cbsDebit > 0 && (() => {
                  const h = (reform.cbsDebit / maxBarValue) * 88;
                  return (
                    <div
                      style={{ height: `${Math.max(14, h)}%` }}
                      className="w-full bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-2xs transition-all hover:brightness-110 p-1 text-center"
                      title={`CBS (Federal): ${formatBRL(reform.cbsDebit)} (${formatPercent((reform.cbsDebit / revenue) * 100, 2)} da receita)`}
                    >
                      {formatBlockText('CBS (Federal)', reform.cbsDebit, h)}
                    </div>
                  );
                })()}

                {/* Imposto Seletivo */}
                {reform.selectiveDebit > 0 && (() => {
                  const h = (reform.selectiveDebit / maxBarValue) * 88;
                  return (
                    <div
                      style={{ height: `${Math.max(14, h)}%` }}
                      className="w-full bg-amber-600 rounded-lg flex items-center justify-center text-white shadow-2xs transition-all hover:brightness-110 p-1 text-center"
                      title={`Imposto Seletivo: ${formatBRL(reform.selectiveDebit)} (${formatPercent((reform.selectiveDebit / revenue) * 100, 2)} da receita)`}
                    >
                      {formatBlockText('Seletivo', reform.selectiveDebit, h)}
                    </div>
                  );
                })()}

              </div>

              {/* Lista Estruturada de Valores da Reforma */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/60 text-[11px] space-y-1">
                {reform.ibsDebit > 0 && (
                  <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="w-2 h-2 rounded-full bg-blue-700 shrink-0" /> IBS Subnacional
                    </span>
                    <span className="font-mono tabular-nums font-semibold">
                      {formatBRL(reform.ibsDebit)} <span className="text-slate-400 font-normal">({formatPercent((reform.ibsDebit / revenue) * 100, 1)})</span>
                    </span>
                  </div>
                )}
                {reform.cbsDebit > 0 && (
                  <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" /> CBS Federal
                    </span>
                    <span className="font-mono tabular-nums font-semibold">
                      {formatBRL(reform.cbsDebit)} <span className="text-slate-400 font-normal">({formatPercent((reform.cbsDebit / revenue) * 100, 1)})</span>
                    </span>
                  </div>
                )}
                {reform.selectiveDebit > 0 ? (
                  <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0" /> Imposto Seletivo
                    </span>
                    <span className="font-mono tabular-nums font-semibold">
                      {formatBRL(reform.selectiveDebit)} <span className="text-slate-400 font-normal">({formatPercent((reform.selectiveDebit / revenue) * 100, 1)})</span>
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between items-center text-slate-400 text-[10px]">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" /> Imposto Seletivo
                    </span>
                    <span className="font-mono tabular-nums">Não incidente (0%)</span>
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>

        {/* Resumo de Crédito e Saldo Líquido com Percentual */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-slate-600 dark:text-slate-400">
          <span>Crédito de entrada apropriável:</span>
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            +{formatBRL(reform.totalCredits)} ({formatPercent((reform.totalCredits / revenue) * 100, 1)} da receita · {formatPercent((reform.totalCredits / reform.totalDebits) * 100, 1)} do débito)
          </span>
        </div>
      </div>

      {/* Gráfico 2: Curva de Transição Anual 2026–2033 */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Curva de Carga Tributária Anual (2026–2033)
            </h4>
            <span className="text-xs font-mono text-slate-400 tabular-nums">Valores em R$ e %</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-4">
            Projeção ano a ano conforme as etapas de vigência da CBS e desoneração do ICMS/ISS
          </p>

          {/* Gráfico SVG Responsivo de Barras da Linha do Tempo */}
          <div className="h-56 w-full flex items-end justify-between gap-1.5 pt-4">
            {timeline.map((point) => {
              const heightPercent = Math.max(15, (point.effectiveCombinedTaxEstimatedBrl / maxTimelineTax) * 100);
              const isHovered = activeTooltip === String(point.year);

              return (
                <div
                  key={point.year}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                  onMouseEnter={() => setActiveTooltip(String(point.year))}
                  onMouseLeave={() => setActiveTooltip(null)}
                >
                  {/* Tooltip flutuante rico */}
                  {isHovered && (
                    <div className="absolute -top-14 z-20 px-2.5 py-1.5 bg-slate-900 text-white text-[10px] font-mono rounded-lg shadow-xl whitespace-nowrap pointer-events-none tabular-nums text-center border border-slate-700">
                      <div className="font-bold text-blue-400">{point.year}</div>
                      <div>{formatBRL(point.effectiveCombinedTaxEstimatedBrl)}</div>
                      <div className="text-slate-400 text-[9px]">{formatPercent(point.effectiveRatePercent, 2)} da receita</div>
                    </div>
                  )}

                  {/* Valor monetário/percentual exibido acima de anos-chave */}
                  {(point.year === 2026 || point.year === 2027 || point.year === 2033) && (
                    <span className="text-[9px] font-mono font-bold text-slate-600 dark:text-slate-300 mb-1 tabular-nums hidden sm:block">
                      {formatPercent(point.effectiveRatePercent, 1)}
                    </span>
                  )}

                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-md transition-all ${
                      point.year === 2033
                        ? 'bg-blue-600 dark:bg-blue-500'
                        : point.year === 2027
                        ? 'bg-indigo-600 dark:bg-indigo-500 ring-1 ring-indigo-400'
                        : point.year === 2026
                        ? 'bg-slate-400 dark:bg-slate-600'
                        : 'bg-blue-400 dark:bg-blue-700 hover:bg-blue-500 dark:hover:bg-blue-600'
                    }`}
                  />
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-1.5 font-semibold">
                    '{String(point.year).slice(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legenda do Gráfico de Transição */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs flex justify-between items-center text-slate-600 dark:text-slate-400">
          <span>Início: '26 (Teste)</span>
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">'27 (CBS Plena)</span>
          <span>Transição: '29-'32</span>
          <span className="font-bold text-blue-600 dark:text-blue-400">'33 (Definitivo)</span>
        </div>
      </div>

    </div>
  );
};
