import React, { useState } from 'react';
import { SimulationResult, CompanyFinancialInput, ReformTaxRates } from '../types/tax';
import { calculateTransitionTimeline, formatBRL, formatPercent } from '../lib/taxCalculations';
import { Calendar, CheckCircle2, AlertTriangle, ArrowRight, Clock, Sliders } from 'lucide-react';

interface TransitionTimelineProps {
  simulation: SimulationResult;
  input: CompanyFinancialInput;
  reformRates?: ReformTaxRates;
  onReformRatesChange?: (rates: ReformTaxRates) => void;
}

export const TransitionTimeline: React.FC<TransitionTimelineProps> = ({ 
  simulation, 
  input, 
  reformRates,
  onReformRatesChange,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(2027);
  const timelinePoints = calculateTransitionTimeline(simulation, input.revenue, reformRates);

  const currentPoint = timelinePoints.find((p) => p.year === selectedYear) || timelinePoints[0];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-6">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Cronograma Oficial de Transição (2026 a 2033)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Simulação da convivência progressiva entre os tributos atuais e o novo modelo (EC nº 132/2023)
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Clock className="w-3.5 h-3.5 text-blue-500" />
          <span>Período de Transição: 8 anos</span>
        </div>
      </div>

      {/* Seletor Visual dos Anos (Stepper Interativo) */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {timelinePoints.map((point) => {
          const isSelected = point.year === selectedYear;
          const isCriticalMilestone = point.year === 2026 || point.year === 2027 || point.year === 2029 || point.year === 2033;

          return (
            <button
              key={point.year}
              onClick={() => setSelectedYear(point.year)}
              className={`p-2.5 rounded-xl text-center border transition-all cursor-pointer flex flex-col items-center justify-center ${
                isSelected
                  ? 'border-blue-600 dark:border-blue-500 bg-blue-50/80 dark:bg-blue-950/50 shadow-xs ring-1 ring-blue-600/30'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <span className={`text-xs font-mono font-bold ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
                {point.year}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate w-full">
                {point.year === 2026 && 'Ano de Teste'}
                {point.year === 2027 && `CBS ${point.testCBSRate.toFixed(1).replace('.', ',')}%`}
                {point.year === 2028 && 'Teste IBS'}
                {point.year === 2029 && '90% ICMS/ISS'}
                {point.year === 2030 && '80% ICMS/ISS'}
                {point.year === 2031 && '70% ICMS/ISS'}
                {point.year === 2032 && '60% ICMS/ISS'}
                {point.year === 2033 && 'Definitivo'}
              </span>
              {isCriticalMilestone && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Painel do Ano Selecionado */}
      <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/70 p-4 sm:p-5 space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-blue-600 text-white">
                Ano {currentPoint.year}
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {currentPoint.year === 2026 && 'Fase de Teste e Calibração dos Sistemas'}
                {currentPoint.year === 2027 && 'Vigência da CBS e Extinção do PIS/COFINS'}
                {currentPoint.year === 2028 && 'Consolidação e Transição dos Estados'}
                {currentPoint.year >= 2029 && currentPoint.year <= 2032 && 'Transição Gradual do ICMS/ISS para o IBS'}
                {currentPoint.year === 2033 && 'Plena Vigência do Novo IVA Dual (Definitivo)'}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5">
              {currentPoint.description}
            </p>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
              Tributo Estimado neste Ano
            </span>
            <span className="text-lg font-mono font-extrabold text-slate-900 dark:text-white tabular-nums">
              {formatBRL(currentPoint.effectiveCombinedTaxEstimatedBrl)}
            </span>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 block tabular-nums">
              Carga Efetiva: {formatPercent(currentPoint.effectiveRatePercent)}
            </span>
          </div>
        </div>

        {/* 3 Cartões de Status dos Tributos neste ano */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Federal: CBS & PIS/COFINS
            </span>
            <div className="text-xs font-bold text-slate-900 dark:text-white mb-1">
              CBS: {currentPoint.cbsStatus}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
              PIS/COFINS: {currentPoint.legacyPISCOFINSStatus}
            </p>

            {/* Ajuste rápido da alíquota CBS para 2027 */}
            {selectedYear === 2027 && onReformRatesChange && reformRates && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-blue-700 dark:text-blue-300">Ajustar Alíquota CBS 2027:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    {(reformRates.cbs2027Rate ?? reformRates.cbsShare).toFixed(2)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="5.0"
                  max="12.0"
                  step="0.1"
                  value={reformRates.cbs2027Rate ?? reformRates.cbsShare}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 8.8;
                    onReformRatesChange({
                      ...reformRates,
                      cbs2027Rate: val,
                      cbsShare: val,
                      referenceRate: Number((val + reformRates.ibsShare).toFixed(2)),
                    });
                  }}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onReformRatesChange({
                      ...reformRates,
                      cbs2027Rate: 8.8,
                      cbsShare: 8.8,
                      referenceRate: Number((8.8 + reformRates.ibsShare).toFixed(2)),
                    })}
                    className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 cursor-pointer"
                  >
                    8,8% (Fazenda)
                  </button>
                  <button
                    type="button"
                    onClick={() => onReformRatesChange({
                      ...reformRates,
                      cbs2027Rate: 7.6,
                      cbsShare: 7.6,
                      referenceRate: Number((7.6 + reformRates.ibsShare).toFixed(2)),
                    })}
                    className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 cursor-pointer"
                  >
                    7,6% (Histórico)
                  </button>
                  <button
                    type="button"
                    onClick={() => onReformRatesChange({
                      ...reformRates,
                      cbs2027Rate: 8.4,
                      cbsShare: 8.4,
                      referenceRate: Number((8.4 + reformRates.ibsShare).toFixed(2)),
                    })}
                    className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 cursor-pointer"
                  >
                    8,4% (Senado)
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Subnacional: IBS
            </span>
            <div className="text-xs font-bold text-slate-900 dark:text-white mb-1">
              Status: {currentPoint.ibsStatus}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Alíquota estimada de teste/proporcional: {currentPoint.testIBSRate}%
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Legado Estadual/Municipal: ICMS e ISS
            </span>
            <div className="text-xs font-bold text-slate-900 dark:text-white mb-1">
              Parcela em vigor: {currentPoint.legacyICMSISSPercent}%
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {currentPoint.legacyICMSISSPercent === 100 
                ? 'Alíquotas estaduais e municipais integrais'
                : currentPoint.legacyICMSISSPercent === 0
                ? 'Extintos definitivamente em todo o território nacional'
                : `Redução progressiva de ${100 - currentPoint.legacyICMSISSPercent}% das alíquotas`}
            </p>
          </div>

        </div>

      </div>

      {/* Tabela de Visão Geral dos Anos */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
              <th className="py-2.5 px-3">Ano</th>
              <th className="py-2.5 px-3">PIS / COFINS</th>
              <th className="py-2.5 px-3">CBS (Federal)</th>
              <th className="py-2.5 px-3">ICMS / ISS</th>
              <th className="py-2.5 px-3">IBS (Estados/Mun.)</th>
              <th className="py-2.5 px-3 text-right">Tributo Est. Empresa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-slate-700 dark:text-slate-300">
            {timelinePoints.map((p) => (
              <tr 
                key={p.year}
                onClick={() => setSelectedYear(p.year)}
                className={`cursor-pointer transition-colors ${
                  p.year === selectedYear ? 'bg-blue-50/50 dark:bg-blue-950/30 font-bold text-blue-900 dark:text-blue-300' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                }`}
              >
                <td className="py-2 px-3 font-bold">{p.year}</td>
                <td className="py-2 px-3 font-sans">{p.year === 2026 ? '100% (compensa 0,9%)' : 'Extinto'}</td>
                <td className="py-2 px-3 font-bold text-blue-600 dark:text-blue-400">
                  {p.year === 2026 ? '0,90% (teste)' : `${p.testCBSRate.toFixed(2).replace('.', ',')}% (plena)`}
                </td>
                <td className="py-2 px-3">{p.legacyICMSISSPercent}%</td>
                <td className="py-2 px-3">{p.testIBSRate.toFixed(2)}%</td>
                <td className="py-2 px-3 text-right font-bold tabular-nums">{formatBRL(p.effectiveCombinedTaxEstimatedBrl)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};
