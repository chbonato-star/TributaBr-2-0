import React from 'react';
import { SimulationResult } from '../types/tax';
import { formatBRL, formatPercent } from '../lib/taxCalculations';
import { ArrowUpRight, ArrowDownRight, Minus, TrendingUp, DollarSign, Layers, ShieldCheck, Tag } from 'lucide-react';

interface ComparisonKPIsProps {
  simulation: SimulationResult;
}

export const ComparisonKPIs: React.FC<ComparisonKPIsProps> = ({ simulation }) => {
  const { legacy, reform, comparison } = simulation;
  const isTaxIncrease = comparison.taxBurdenDifferenceBrl > 0;
  const isNeutral = Math.abs(comparison.taxBurdenDifferenceBrl) < 100;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
      
      {/* KPI 1: Carga Tributária Efetiva */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-medium">Carga Tributária Efetiva</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
              {formatPercent(reform.effectiveTaxBurdenPercent)}
            </span>
            <span className="text-xs font-mono text-slate-400 line-through tabular-nums">
              {formatPercent(legacy.effectiveTaxBurdenPercent)}
            </span>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">Variação líquida</span>
          <span className={`font-mono font-bold flex items-center gap-0.5 tabular-nums ${
            isNeutral ? 'text-slate-500' : isTaxIncrease ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            {isNeutral ? (
              <Minus className="w-3.5 h-3.5" />
            ) : isTaxIncrease ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5" />
            )}
            {formatPercent(Math.abs(comparison.taxBurdenDifferencePercentPoints))} p.p.
          </span>
        </div>
      </div>

      {/* KPI 2: Impostos Líquidos a Pagar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-medium">Tributos Líquidos Anuais</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
              {formatBRL(reform.netTaxesPaid)}
            </span>
          </div>
          <div className="text-xs font-mono text-slate-400 mt-0.5 tabular-nums">
            Atual: {formatBRL(legacy.netTaxesPaid)}
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">Impacto anual</span>
          <span className={`font-mono font-bold tabular-nums ${
            isNeutral ? 'text-slate-500' : isTaxIncrease ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            {isTaxIncrease ? '+' : ''}{formatBRL(comparison.taxBurdenDifferenceBrl)}
          </span>
        </div>
      </div>

      {/* KPI 3: Créditos Fiscais Apropriados */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-medium">Créditos de Entrada (IBS/CBS)</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
              {formatBRL(reform.totalCredits)}
            </span>
          </div>
          <div className="text-xs font-mono text-slate-400 mt-0.5 tabular-nums">
            Crédito atual: {formatBRL(legacy.totalCredits)}
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">Ganho em créditos</span>
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            +{formatBRL(Math.max(0, reform.totalCredits - legacy.totalCredits))}
          </span>
        </div>
      </div>

      {/* KPI 4: Resultado Operacional Bruto */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-medium">Resultado Operacional</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl font-extrabold font-mono tabular-nums ${
              reform.operatingResult >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {formatBRL(reform.operatingResult)}
            </span>
          </div>
          <div className="text-xs font-mono text-slate-400 mt-0.5 tabular-nums">
            Atual: {formatBRL(legacy.operatingResult)}
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">Variação final</span>
          <span className={`font-mono font-bold tabular-nums ${
            comparison.operatingResultDifferenceBrl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {comparison.operatingResultDifferenceBrl >= 0 ? '+' : ''}{formatBRL(comparison.operatingResultDifferenceBrl)}
          </span>
        </div>
      </div>

      {/* KPI 5: Ajuste de Preço Necessário */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-medium">Repasse ao Preço de Venda</span>
            <Tag className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl font-extrabold font-mono tabular-nums ${
              comparison.priceAdjustmentRequiredToMaintainProfit > 0
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {comparison.priceAdjustmentRequiredToMaintainProfit > 0 ? '+' : ''}
              {formatPercent(comparison.priceAdjustmentRequiredToMaintainProfit)}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            P/ manter mesmo lucro líquido
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
          {comparison.priceAdjustmentRequiredToMaintainProfit > 0
            ? 'Exige repasse comercial'
            : 'Permite ganho de competitividade'}
        </div>
      </div>

    </div>
  );
};
