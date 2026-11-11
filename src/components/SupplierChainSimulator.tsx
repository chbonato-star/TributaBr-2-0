import React, { useState } from 'react';
import { CompanyFinancialInput, ReformTaxRates } from '../types/tax';
import { formatBRL, formatPercent } from '../lib/taxCalculations';
import { Network, ArrowRight, ShieldAlert, CheckCircle, Scale, AlertTriangle } from 'lucide-react';

interface SupplierChainSimulatorProps {
  input: CompanyFinancialInput;
  reformRates: ReformTaxRates;
  onUpdateSimplesPercent: (percent: number) => void;
}

export const SupplierChainSimulator: React.FC<SupplierChainSimulatorProps> = ({
  input,
  reformRates,
  onUpdateSimplesPercent,
}) => {
  const [purchaseValueSample, setPurchaseValueSample] = useState<number>(100000); // Ex: compra de R$ 100.000
  const standardRate = reformRates.referenceRate; // 26.5%
  const simplesCreditPassThrough = 4.5; // Média estimada de crédito transferido pelo Simples (~4.5%)

  // Cenário A: Compra de Fornecedor no Regime Normal (IBS + CBS Pleno)
  const creditNormalRegime = purchaseValueSample * (standardRate / 100);
  const netCostNormalRegime = purchaseValueSample - creditNormalRegime;

  // Cenário B: Compra de Fornecedor no Simples Nacional Padrão
  const creditSimplesRegime = purchaseValueSample * (simplesCreditPassThrough / 100);
  const netCostSimplesRegime = purchaseValueSample - creditSimplesRegime;

  // Diferença / Desvantagem de crédito
  const creditGap = creditNormalRegime - creditSimplesRegime;
  const breakEvenDiscountRequired = ((purchaseValueSample - (purchaseValueSample - creditGap)) / purchaseValueSample) * 100;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-6">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Network className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Análise da Cadeia de Fornecedores: Regime Normal vs. Simples Nacional
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Impacto do art. 28 da EC 132/2023: Transferência restrita de créditos fiscais nas compras de optantes do Simples
          </p>
        </div>
      </div>

      {/* Explicação da Regra */}
      <div className="p-4 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 text-xs text-slate-700 dark:text-slate-300 space-y-2">
        <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-200">
          <Scale className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>O Dilema das Compras no B2B na Reforma Tributária</span>
        </div>
        <p className="leading-relaxed">
          No novo sistema, empresas do <strong>Lucro Real ou Presumido</strong> que comprarem de fornecedores enquadrados no regime normal tomam <strong>crédito integral de {standardRate}%</strong> sobre a nota fiscal. Porém, ao comprar de uma empresa optante pelo <strong>Simples Nacional</strong> que não optou por recolher IBS/CBS por fora, o crédito aproveitável fica restrito ao montante efetivamente pago no DAS (em média <strong>{simplesCreditPassThrough}%</strong>).
        </p>
      </div>

      {/* Simulador Interativo de Compra Unitária */}
      <div className="bg-slate-50 dark:bg-slate-800/40 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Valor de Compra Simulado (R$)
            </label>
            <div className="relative w-48">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-slate-400 font-mono">
                R$
              </span>
              <input
                type="number"
                value={purchaseValueSample}
                onChange={(e) => setPurchaseValueSample(Math.max(1000, parseFloat(e.target.value) || 0))}
                className="w-full pl-9 pr-3 py-1.5 text-xs font-mono font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white tabular-nums"
              />
            </div>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            Alíquota Padrão IBS+CBS: <strong className="font-mono">{standardRate}%</strong> | Crédito Médio Simples: <strong className="font-mono">{simplesCreditPassThrough}%</strong>
          </div>
        </div>

        {/* Comparativo de 2 Caixas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          
          {/* Caixa 1: Compra de Regime Normal */}
          <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Fornecedor no Regime Normal (IBS/CBS Pleno)
              </span>
              <span className="text-[11px] font-mono font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded">
                Crédito 100%
              </span>
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Valor Faturado na NF:</span>
                <span className="tabular-nums">{formatBRL(purchaseValueSample)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                <span>(-) Crédito Fiscal Gerado ({standardRate}%):</span>
                <span className="tabular-nums">-{formatBRL(creditNormalRegime)}</span>
              </div>
              <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800 flex justify-between font-bold text-slate-900 dark:text-white">
                <span>Custo Efetivo Líquido p/ sua empresa:</span>
                <span className="text-sm tabular-nums">{formatBRL(netCostNormalRegime)}</span>
              </div>
            </div>
          </div>

          {/* Caixa 2: Compra de Optante do Simples Nacional */}
          <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/30 dark:bg-amber-950/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Fornecedor no Simples Nacional
              </span>
              <span className="text-[11px] font-mono font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded">
                Crédito Restrito ~{simplesCreditPassThrough}%
              </span>
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Valor Faturado na NF:</span>
                <span className="tabular-nums">{formatBRL(purchaseValueSample)}</span>
              </div>
              <div className="flex justify-between text-amber-700 dark:text-amber-400 font-semibold">
                <span>(-) Crédito Fiscal Gerado ({simplesCreditPassThrough}%):</span>
                <span className="tabular-nums">-{formatBRL(creditSimplesRegime)}</span>
              </div>
              <div className="pt-2 border-t border-amber-200 dark:border-amber-800 flex justify-between font-bold text-slate-900 dark:text-white">
                <span>Custo Efetivo Líquido p/ sua empresa:</span>
                <span className="text-sm text-rose-600 dark:text-rose-400 tabular-nums">{formatBRL(netCostSimplesRegime)}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Veredito do Gap de Crédito */}
        <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-slate-500 dark:text-slate-400 block">
              Diferença de Crédito (Perda Fiscal na Compra):
            </span>
            <span className="text-base font-mono font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">
              {formatBRL(creditGap)} a mais de custo líquido
            </span>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-slate-500 dark:text-slate-400 block">
              Desconto necessário do Simples para igualar custo:
            </span>
            <span className="text-sm font-mono font-bold text-amber-600 dark:text-amber-400 tabular-nums">
              {formatPercent(breakEvenDiscountRequired)} de desconto comercial
            </span>
          </div>
        </div>

      </div>

      {/* Impacto no Total Anual da Empresa */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            Impacto no Portfólio Atual de Compras da sua Empresa
          </span>
          <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
            {reformRates.purchasesFromSimplesPercent}% vindo do Simples
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={reformRates.purchasesFromSimplesPercent}
          onChange={(e) => onUpdateSimplesPercent(parseInt(e.target.value) || 0)}
          className="w-full accent-blue-600 cursor-pointer"
        />

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Quanto maior a fatia de fornecedores do Simples Nacional sem opção pelo recolhimento do IVA por fora, menor será o crédito fiscal acumulado da sua empresa, aumentando o imposto líquido a recolher no final do mês.
        </p>
      </div>

    </div>
  );
};
