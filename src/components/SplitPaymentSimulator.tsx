import React, { useState } from 'react';
import { SimulationResult } from '../types/tax';
import { calculateSplitPaymentImpact, formatBRL, formatPercent } from '../lib/taxCalculations';
import { CreditCard, AlertCircle, ArrowRight, Wallet, Percent, DollarSign, Clock } from 'lucide-react';

interface SplitPaymentSimulatorProps {
  simulation: SimulationResult;
}

export const SplitPaymentSimulator: React.FC<SplitPaymentSimulatorProps> = ({ simulation }) => {
  const [salesReceivingDays, setSalesReceivingDays] = useState<number>(30); // Prazo médio de recebimento de clientes
  const [legacyPaymentDays, setLegacyPaymentDays] = useState<number>(45); // Prazo médio de recolhimento antigo (d+45)
  const [cdiRate, setCdiRate] = useState<number>(10.75); // Taxa Selic / CDI

  const impact = calculateSplitPaymentImpact(simulation, salesReceivingDays, legacyPaymentDays, cdiRate);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-6">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Simulador de Split Payment & Impacto no Capital de Giro
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Art. 49 a 53 do PLP 68/2024: Retenção automática e imediata de IBS e CBS na liquidação eletrônica (Pix, Cartão e Boleto)
          </p>
        </div>
      </div>

      {/* Explicação do Mecanismo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Modelo Atual */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Sistema Atual (Float Tributário Temporário)</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            A empresa emite a nota fiscal e recebe o valor integral da venda na conta. O recolhimento de ICMS, ISS e PIS/COFINS ocorre apenas entre o dia 15 e 25 do mês subsequente (em média <strong>{legacyPaymentDays} dias</strong> após a transação). Esse intervalo gera um "caixa financeiro não oneroso" que financia o giro da operação.
          </p>
        </div>

        {/* Modelo Reforma com Split Payment */}
        <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-950/20 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-300">
            <Wallet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Novo Modelo (Split Payment Obrigatório)</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            A adquirente de cartão ou banco faz a separação instantânea do imposto no momento da liquidação (D+0 a D+2). A empresa recebe apenas o valor líquido descontado do IBS/CBS. <strong>O float tributário é 100% extinto</strong>, exigindo adaptação imediata do fluxo de caixa e capital de giro.
          </p>
        </div>

      </div>

      {/* Controles de Parâmetros do Ciclo Financeiro */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        
        <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Prazo Médio de Vendas (Dias)
            </label>
            <span className="text-xs font-mono font-bold text-slate-900 dark:text-white tabular-nums">
              {salesReceivingDays} dias
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="90"
            value={salesReceivingDays}
            onChange={(e) => setSalesReceivingDays(parseInt(e.target.value) || 30)}
            className="w-full accent-blue-600 cursor-pointer"
          />
          <span className="text-[11px] text-slate-400 mt-1 block">
            Prazo médio que seus clientes levam para pagar
          </span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Prazo Atual de Pagto de Impostos
            </label>
            <span className="text-xs font-mono font-bold text-slate-900 dark:text-white tabular-nums">
              {legacyPaymentDays} dias
            </span>
          </div>
          <input
            type="range"
            min="20"
            max="60"
            value={legacyPaymentDays}
            onChange={(e) => setLegacyPaymentDays(parseInt(e.target.value) || 45)}
            className="w-full accent-blue-600 cursor-pointer"
          />
          <span className="text-[11px] text-slate-400 mt-1 block">
            Dias entre a venda e o vencimento das guias (DARF/DAE)
          </span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Taxa de Financiamento de Giro (% a.a.)
            </label>
            <span className="text-xs font-mono font-bold text-slate-900 dark:text-white tabular-nums">
              {cdiRate.toFixed(2)}%
            </span>
          </div>
          <input
            type="range"
            min="6.0"
            max="20.0"
            step="0.25"
            value={cdiRate}
            onChange={(e) => setCdiRate(parseFloat(e.target.value) || 10.75)}
            className="w-full accent-blue-600 cursor-pointer"
          />
          <span className="text-[11px] text-slate-400 mt-1 block">
            Taxa média para captar capital de giro em bancos (CDI + spread)
          </span>
        </div>

      </div>

      {/* Cartões de Impacto Calculado */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        
        <div className="bg-slate-50/80 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
            Volume Anual Retido na Fonte
          </span>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {formatBRL(impact.annualWithheldAtSourceBrl)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            IBS e CBS líquidos recolhidos diretamente
          </span>
        </div>

        <div className="bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800/60">
          <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold block mb-1">
            Redução no Capital de Giro (Float Perdido)
          </span>
          <div className="text-xl font-extrabold font-mono text-amber-600 dark:text-amber-400 tabular-nums">
            {formatBRL(impact.cashFloatLossBrl)}
          </div>
          <span className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-1 block">
            Média de liquidez que sairá do saldo diário da empresa
          </span>
        </div>

        <div className="bg-rose-50/50 dark:bg-rose-950/20 p-4 rounded-xl border border-rose-200 dark:border-rose-800/60">
          <span className="text-xs text-rose-700 dark:text-rose-400 font-semibold block mb-1">
            Custo Financeiro Adicional Estimado
          </span>
          <div className="text-xl font-extrabold font-mono text-rose-600 dark:text-rose-400 tabular-nums">
            {formatBRL(impact.annualFinancingCostBrl)}/ano
          </div>
          <span className="text-[11px] text-rose-700/80 dark:text-rose-400/80 mt-1 block">
            Custo caso precise repor o float com linhas de crédito
          </span>
        </div>

      </div>

      {/* Recomendações Estratégicas para o Split Payment */}
      <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/50 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
        <span className="font-bold text-slate-900 dark:text-white block">
          Recomendações Práticas da Controladoria:
        </span>
        <ul className="list-disc pl-4 space-y-1">
          <li><strong>Rever prazos de pagamento a fornecedores:</strong> Alinhar os prazos de saída com os novos recebimentos líquidos reduz a necessidade de alavancagem bancária.</li>
          <li><strong>Aproveitamento rápido de créditos:</strong> O split payment também prevê devolução acelerada de créditos acumulados pelo Comitê Gestor. Mantenha as notas de entrada 100% escrituradas para alimentar o saldo credor.</li>
          <li><strong>Integração com adquirentes e ERPs:</strong> Os sistemas de faturamento e conciliação bancária precisarão calcular o débito líquido em tempo real a partir de 2026/2027.</li>
        </ul>
      </div>

    </div>
  );
};
