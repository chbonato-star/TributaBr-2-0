import React, { useState } from 'react';
import { SimulationResult, CompanyFinancialInput } from '../types/tax';
import { formatBRL, formatPercent } from '../lib/taxCalculations';
import { Info, Percent, DollarSign, Eye } from 'lucide-react';

interface DRETableProps {
  simulation: SimulationResult;
  input: CompanyFinancialInput;
}

export const DRETable: React.FC<DRETableProps> = ({ simulation, input }) => {
  const [displayMode, setDisplayMode] = useState<'both' | 'currency' | 'percent'>('both');
  const { legacy, reform, comparison } = simulation;
  const revenue = input.revenue > 0 ? input.revenue : 1;

  // Helper para renderizar célula de valor com suporte a R$ e %
  const renderCell = (
    value: number,
    isDeduction: boolean = false,
    highlightClass?: string
  ) => {
    const absVal = Math.abs(value);
    const pct = (absVal / revenue) * 100;
    const sign = isDeduction && absVal > 0 ? '-' : '';

    if (displayMode === 'currency') {
      return (
        <span className={`font-mono tabular-nums ${highlightClass || ''}`}>
          {sign}{formatBRL(absVal)}
        </span>
      );
    }

    if (displayMode === 'percent') {
      return (
        <span className={`font-mono tabular-nums font-semibold ${highlightClass || ''}`}>
          {sign}{formatPercent(pct, 2)}
        </span>
      );
    }

    // Modo 'both' (Padrão: Valor monetário + % da Receita Bruta na linha de baixo)
    return (
      <div className="flex flex-col items-end leading-tight">
        <span className={`font-mono tabular-nums ${highlightClass || ''}`}>
          {sign}{formatBRL(absVal)}
        </span>
        <span className="text-[10px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
          {sign}{formatPercent(pct, 2)}
        </span>
      </div>
    );
  };

  // Helper para renderizar a coluna de variação (R$ e p.p. / %)
  const renderVariation = (diffBrl: number, baseLegacy: number, invertColors = false) => {
    const diffPctPoints = (diffBrl / revenue) * 100;
    const isPositive = diffBrl > 0;
    const isZero = Math.abs(diffBrl) < 1;

    const color = isZero
      ? 'text-slate-400'
      : invertColors
      ? isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
      : isPositive ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400';

    if (displayMode === 'currency') {
      return (
        <span className={`font-mono tabular-nums font-bold ${color}`}>
          {isZero ? 'R$ 0' : `${isPositive ? '+' : ''}${formatBRL(diffBrl)}`}
        </span>
      );
    }

    if (displayMode === 'percent') {
      return (
        <span className={`font-mono tabular-nums font-bold ${color}`}>
          {isZero ? '0,00 p.p.' : `${isPositive ? '+' : ''}${formatPercent(diffPctPoints, 2)} p.p.`}
        </span>
      );
    }

    // Modo 'both' (Padrão: R$ no topo e p.p. embaixo)
    return (
      <div className="flex flex-col items-end leading-tight">
        <span className={`font-mono tabular-nums font-bold ${color}`}>
          {isZero ? 'R$ 0' : `${isPositive ? '+' : ''}${formatBRL(diffBrl)}`}
        </span>
        <span className={`text-[10px] font-mono tabular-nums font-semibold ${color}`}>
          {isZero ? '0,00 p.p.' : `${isPositive ? '+' : ''}${formatPercent(diffPctPoints, 2)} p.p.`}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      
      {/* Topo da Tabela com Seletor de Modo de Exibição (R$ e %) */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            DRE Comparativa Detalhada com Análise Vertical (%)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Confronto linha a linha entre a tributação atual e o IVA Dual, com valores em Reais (R$) e percentuais sobre a Receita Bruta (%)
          </p>
        </div>

        {/* Seletor Segmentado: Ambos (R$ e %) | Apenas R$ | Apenas % */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0 self-start md:self-auto">
          <button
            onClick={() => setDisplayMode('both')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              displayMode === 'both'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Ambos (R$ e %)
          </button>
          <button
            onClick={() => setDisplayMode('currency')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              displayMode === 'currency'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Apenas R$
          </button>
          <button
            onClick={() => setDisplayMode('percent')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              displayMode === 'percent'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Apenas %
          </button>
        </div>
      </div>

      {/* Grid Tabular Responsivo com números tabulares */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
              <th className="py-3 px-4 min-w-[260px]">Conta da DRE / Rubrica Fiscal</th>
              <th className="py-3 px-4 text-right min-w-[150px]">
                Sistema Legado {displayMode === 'both' ? '(R$ e % AV)' : displayMode === 'currency' ? '(R$)' : '(%)'}
              </th>
              <th className="py-3 px-4 text-right min-w-[150px]">
                Reforma IBS+CBS {displayMode === 'both' ? '(R$ e % AV)' : displayMode === 'currency' ? '(R$)' : '(%)'}
              </th>
              <th className="py-3 px-4 text-right min-w-[140px]">
                {displayMode === 'both' ? 'Variação Líquida (R$ e p.p.)' : displayMode === 'currency' ? 'Variação Líquida (R$)' : 'Variação Líquida (p.p.)'}
              </th>
              <th className="py-3 px-4 text-right min-w-[100px]">Impacto Relativo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
            
            {/* 1. Receita Bruta */}
            <tr className="font-semibold bg-slate-50/40 dark:bg-slate-800/20">
              <td className="py-3 px-4 text-slate-900 dark:text-white">
                1. Receita Operacional Bruta
              </td>
              <td className="py-3 px-4 text-right">
                {renderCell(legacy.grossRevenue)}
              </td>
              <td className="py-3 px-4 text-right">
                {renderCell(reform.grossRevenue)}
              </td>
              <td className="py-3 px-4 text-right">
                {renderVariation(0, legacy.grossRevenue)}
              </td>
              <td className="py-3 px-4 text-right font-mono text-slate-400 tabular-nums">
                0,0%
              </td>
            </tr>

            {/* 2. Deduções da Receita Bruta (Tributos sobre a Venda) */}
            <tr className="text-slate-600 dark:text-slate-300 italic bg-rose-50/20 dark:bg-rose-950/10">
              <td className="py-2.5 px-4 pl-8">
                (-) Tributos Brutos sobre Vendas
              </td>
              <td className="py-2.5 px-4 text-right">
                {renderCell(legacy.totalDebits, true, 'text-rose-600 dark:text-rose-400 font-medium')}
              </td>
              <td className="py-2.5 px-4 text-right">
                {renderCell(reform.totalDebits, true, 'text-rose-600 dark:text-rose-400 font-medium')}
              </td>
              <td className="py-2.5 px-4 text-right">
                {renderVariation(reform.totalDebits - legacy.totalDebits, legacy.totalDebits)}
              </td>
              <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-500">
                {legacy.totalDebits > 0 ? `${formatPercent(((reform.totalDebits - legacy.totalDebits) / legacy.totalDebits) * 100, 1)}` : '-'}
              </td>
            </tr>

            {/* Detalhamento dos débitos legados vs reforma */}
            <tr className="text-slate-500 dark:text-slate-400 text-[11px]">
              <td className="py-1 px-4 pl-12">
                · ICMS / IBS (Subnacional - Estados & Municípios)
              </td>
              <td className="py-1 px-4 text-right">
                {renderCell(legacy.icmsDebit)}
              </td>
              <td className="py-1 px-4 text-right">
                {renderCell(reform.ibsDebit, false, 'text-blue-600 dark:text-blue-400 font-semibold')}
              </td>
              <td className="py-1 px-4 text-right">
                {renderVariation(reform.ibsDebit - legacy.icmsDebit, legacy.icmsDebit)}
              </td>
              <td className="py-1 px-4 text-right font-mono tabular-nums text-slate-400">
                {legacy.icmsDebit > 0 ? `${formatPercent(((reform.ibsDebit - legacy.icmsDebit) / legacy.icmsDebit) * 100, 1)}` : 'Novo'}
              </td>
            </tr>

            <tr className="text-slate-500 dark:text-slate-400 text-[11px]">
              <td className="py-1 px-4 pl-12">
                · ISS (Municipal)
              </td>
              <td className="py-1 px-4 text-right">
                {renderCell(legacy.issDebit)}
              </td>
              <td className="py-1 px-4 text-right font-mono text-slate-400 tabular-nums">
                (Incorporado no IBS)
              </td>
              <td className="py-1 px-4 text-right">
                {renderVariation(-legacy.issDebit, legacy.issDebit)}
              </td>
              <td className="py-1 px-4 text-right font-mono tabular-nums text-slate-400">
                -100,0%
              </td>
            </tr>

            <tr className="text-slate-500 dark:text-slate-400 text-[11px]">
              <td className="py-1 px-4 pl-12">
                · PIS/COFINS / CBS (Federal)
              </td>
              <td className="py-1 px-4 text-right">
                {renderCell(legacy.pisDebit + legacy.cofinsDebit)}
              </td>
              <td className="py-1 px-4 text-right">
                {renderCell(reform.cbsDebit, false, 'text-blue-600 dark:text-blue-400 font-semibold')}
              </td>
              <td className="py-1 px-4 text-right">
                {renderVariation(reform.cbsDebit - (legacy.pisDebit + legacy.cofinsDebit), legacy.pisDebit + legacy.cofinsDebit)}
              </td>
              <td className="py-1 px-4 text-right font-mono tabular-nums text-slate-400">
                {(legacy.pisDebit + legacy.cofinsDebit) > 0 
                  ? `${formatPercent(((reform.cbsDebit - (legacy.pisDebit + legacy.cofinsDebit)) / (legacy.pisDebit + legacy.cofinsDebit)) * 100, 1)}` 
                  : 'Novo'}
              </td>
            </tr>

            {legacy.ipiDebit > 0 || reform.selectiveDebit > 0 ? (
              <tr className="text-slate-500 dark:text-slate-400 text-[11px]">
                <td className="py-1 px-4 pl-12">
                  · IPI / Imposto Seletivo (Extrafiscal)
                </td>
                <td className="py-1 px-4 text-right">
                  {renderCell(legacy.ipiDebit)}
                </td>
                <td className="py-1 px-4 text-right">
                  {renderCell(reform.selectiveDebit, false, 'text-amber-600 dark:text-amber-400')}
                </td>
                <td className="py-1 px-4 text-right">
                  {renderVariation(reform.selectiveDebit - legacy.ipiDebit, legacy.ipiDebit)}
                </td>
                <td className="py-1 px-4 text-right font-mono tabular-nums text-slate-400">-</td>
              </tr>
            ) : null}

            {/* 3. Receita Líquida */}
            <tr className="font-semibold bg-slate-50/20 dark:bg-slate-800/10">
              <td className="py-2.5 px-4 text-slate-900 dark:text-white">
                2. Receita Operacional Líquida
              </td>
              <td className="py-2.5 px-4 text-right">
                {renderCell(legacy.netRevenue)}
              </td>
              <td className="py-2.5 px-4 text-right">
                {renderCell(reform.grossRevenue - reform.totalDebits)}
              </td>
              <td className="py-2.5 px-4 text-right">
                {renderVariation((reform.grossRevenue - reform.totalDebits) - legacy.netRevenue, legacy.netRevenue, true)}
              </td>
              <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-500">
                {legacy.netRevenue > 0 ? `${formatPercent((((reform.grossRevenue - reform.totalDebits) - legacy.netRevenue) / legacy.netRevenue) * 100, 1)}` : '-'}
              </td>
            </tr>

            {/* 4. Custos e Insumos Brutos */}
            <tr className="text-slate-600 dark:text-slate-300">
              <td className="py-2 px-4 pl-8">
                (-) Insumos, Mercadorias, Energia & Terceiros
              </td>
              <td className="py-2 px-4 text-right">
                {renderCell(input.cogsAndInputs + input.capitalGoodsAndEnergy + input.servicesHired, true)}
              </td>
              <td className="py-2 px-4 text-right">
                {renderCell(input.cogsAndInputs + input.capitalGoodsAndEnergy + input.servicesHired, true)}
              </td>
              <td className="py-2 px-4 text-right">
                {renderVariation(0, input.cogsAndInputs)}
              </td>
              <td className="py-2 px-4 text-right font-mono text-slate-400 tabular-nums">
                0,0%
              </td>
            </tr>

            {/* 5. (+) Créditos Tributários Recuperados */}
            <tr className="font-medium bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300">
              <td className="py-2.5 px-4 pl-8 flex items-center gap-1.5">
                <span>(+) Créditos Fiscais Recuperados (Entrada)</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                  (Não-cumulatividade ampla)
                </span>
              </td>
              <td className="py-2.5 px-4 text-right">
                {renderCell(legacy.totalCredits, false, 'text-emerald-600 dark:text-emerald-400 font-semibold')}
              </td>
              <td className="py-2.5 px-4 text-right">
                {renderCell(reform.totalCredits, false, 'text-emerald-600 dark:text-emerald-400 font-extrabold')}
              </td>
              <td className="py-2.5 px-4 text-right">
                {renderVariation(reform.totalCredits - legacy.totalCredits, legacy.totalCredits, true)}
              </td>
              <td className="py-2.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 tabular-nums font-bold">
                {legacy.totalCredits > 0 ? `+${formatPercent(((reform.totalCredits - legacy.totalCredits) / legacy.totalCredits) * 100, 0)}` : 'Novo'}
              </td>
            </tr>

            {/* Impacto redutor do Simples Nacional nos créditos */}
            {reform.simplesCreditReductionImpact > 0 ? (
              <tr className="text-amber-700 dark:text-amber-400 text-[11px] bg-amber-50/30 dark:bg-amber-950/10">
                <td className="py-1 px-4 pl-12 flex items-center gap-1">
                  <span>↳ Perda de crédito por compras do Simples Nacional</span>
                  <span className="text-amber-600">({input.sector.includes('servicos') ? 'alerta' : 'atenção'})</span>
                </td>
                <td className="py-1 px-4 text-right font-mono text-slate-400 tabular-nums">-</td>
                <td className="py-1 px-4 text-right">
                  {renderCell(reform.simplesCreditReductionImpact, true, 'text-amber-600 dark:text-amber-400')}
                </td>
                <td className="py-1 px-4 text-right">
                  {renderVariation(-reform.simplesCreditReductionImpact, 1)}
                </td>
                <td className="py-1 px-4 text-right font-mono tabular-nums text-slate-400">-</td>
              </tr>
            ) : null}

            {/* 6. Despesas com Pessoal (Folha) */}
            <tr className="text-slate-600 dark:text-slate-300">
              <td className="py-2 px-4 pl-8">
                (-) Folha de Pagamento & Encargos Sociais
              </td>
              <td className="py-2 px-4 text-right">
                {renderCell(input.payroll, true)}
              </td>
              <td className="py-2 px-4 text-right">
                {renderCell(input.payroll, true)}
              </td>
              <td className="py-2 px-4 text-right">
                {renderVariation(0, input.payroll)}
              </td>
              <td className="py-2 px-4 text-right font-mono text-slate-400 tabular-nums">
                0,0%
              </td>
            </tr>

            {/* 7. Outras Despesas */}
            <tr className="text-slate-600 dark:text-slate-300">
              <td className="py-2 px-4 pl-8">
                (-) Outras Despesas Operacionais
              </td>
              <td className="py-2 px-4 text-right">
                {renderCell(input.otherOperationalExpenses, true)}
              </td>
              <td className="py-2 px-4 text-right">
                {renderCell(input.otherOperationalExpenses, true)}
              </td>
              <td className="py-2 px-4 text-right">
                {renderVariation(0, input.otherOperationalExpenses)}
              </td>
              <td className="py-2 px-4 text-right font-mono text-slate-400 tabular-nums">
                0,0%
              </td>
            </tr>

            {/* 8. Resumo da Carga Tributária Líquida */}
            <tr className="font-bold bg-blue-50/50 dark:bg-blue-950/20 text-blue-950 dark:text-blue-200 border-t-2 border-slate-300 dark:border-slate-700">
              <td className="py-3 px-4">
                Total de Tributos Líquidos Efetivos Recolhidos
              </td>
              <td className="py-3 px-4 text-right">
                {renderCell(legacy.netTaxesPaid, false, 'text-slate-900 dark:text-white font-bold')}
              </td>
              <td className="py-3 px-4 text-right">
                {renderCell(reform.netTaxesPaid, false, 'text-slate-900 dark:text-white font-bold')}
              </td>
              <td className="py-3 px-4 text-right">
                {renderVariation(comparison.taxBurdenDifferenceBrl, legacy.netTaxesPaid)}
              </td>
              <td className={`py-3 px-4 text-right font-mono tabular-nums font-bold ${
                comparison.taxBurdenDifferenceBrl > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {legacy.netTaxesPaid > 0 ? `${formatPercent((comparison.taxBurdenDifferenceBrl / legacy.netTaxesPaid) * 100, 1)}` : '-'}
              </td>
            </tr>

            {/* Carga Efetiva % */}
            <tr className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-50/40 dark:bg-slate-800/30">
              <td className="py-2.5 px-4 pl-8">
                Carga Tributária Efetiva (% sobre Receita Bruta)
              </td>
              <td className="py-2.5 px-4 text-right">
                {displayMode === 'currency' ? (
                  <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatBRL(legacy.netTaxesPaid)}
                  </span>
                ) : displayMode === 'percent' ? (
                  <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatPercent(legacy.effectiveTaxBurdenPercent)}
                  </span>
                ) : (
                  <div className="flex flex-col items-end leading-tight">
                    <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                      {formatPercent(legacy.effectiveTaxBurdenPercent)}
                    </span>
                    <span className="text-[10px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {formatBRL(legacy.netTaxesPaid)}
                    </span>
                  </div>
                )}
              </td>
              <td className="py-2.5 px-4 text-right">
                {displayMode === 'currency' ? (
                  <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatBRL(reform.netTaxesPaid)}
                  </span>
                ) : displayMode === 'percent' ? (
                  <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatPercent(reform.effectiveTaxBurdenPercent)}
                  </span>
                ) : (
                  <div className="flex flex-col items-end leading-tight">
                    <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                      {formatPercent(reform.effectiveTaxBurdenPercent)}
                    </span>
                    <span className="text-[10px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {formatBRL(reform.netTaxesPaid)}
                    </span>
                  </div>
                )}
              </td>
              <td className="py-2.5 px-4 text-right">
                {renderVariation(comparison.taxBurdenDifferenceBrl, legacy.netTaxesPaid)}
              </td>
              <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold">
                {comparison.cashTaxIncreaseOrSavings}
              </td>
            </tr>

            {/* 9. Resultado Operacional Líquido */}
            <tr className="font-extrabold text-sm bg-slate-100 dark:bg-slate-800/90 text-slate-900 dark:text-white border-t border-slate-300 dark:border-slate-700">
              <td className="py-3 px-4">
                (=) Resultado Operacional Bruto Final
              </td>
              <td className="py-3 px-4 text-right">
                {renderCell(legacy.operatingResult, false, legacy.operatingResult >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400')}
              </td>
              <td className="py-3 px-4 text-right">
                {renderCell(reform.operatingResult, false, reform.operatingResult >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400')}
              </td>
              <td className="py-3 px-4 text-right">
                {renderVariation(comparison.operatingResultDifferenceBrl, legacy.operatingResult, true)}
              </td>
              <td className={`py-3 px-4 text-right font-mono tabular-nums font-extrabold ${
                comparison.operatingResultDifferenceBrl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {legacy.operatingResult > 0 ? `${formatPercent((comparison.operatingResultDifferenceBrl / legacy.operatingResult) * 100, 1)}` : '-'}
              </td>
            </tr>

          </tbody>
        </table>
      </div>

      {/* Nota Explicativa de Rodapé */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
        <span>
          <strong>Análise Vertical (% AV):</strong> Cada percentual exibido representa a proporção exata daquela rubrica em relação à Receita Operacional Bruta ({formatBRL(input.revenue)}). No novo sistema (IBS e CBS), o cálculo é efetuado "por fora", e a apropriação ampla de créditos nas aquisições reduz o custo efetivo de insumos, bens de capital e serviços.
        </span>
      </div>

    </div>
  );
};
