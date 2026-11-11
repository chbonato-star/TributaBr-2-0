import React from 'react';
import { SimulationResult, CompanyFinancialInput, ReformTaxRates } from '../types/tax';
import { formatBRL, formatPercent } from '../lib/taxCalculations';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, Info, ArrowRight } from 'lucide-react';

interface ImpactAlertProps {
  simulation: SimulationResult;
  input: CompanyFinancialInput;
  reformRates: ReformTaxRates;
}

export const ImpactAlert: React.FC<ImpactAlertProps> = ({
  simulation,
  input,
  reformRates,
}) => {
  const { legacy, reform, comparison } = simulation;
  const isTaxIncrease = comparison.taxBurdenDifferenceBrl > 500;
  const isTaxDecrease = comparison.taxBurdenDifferenceBrl < -500;
  const isNeutral = !isTaxIncrease && !isTaxDecrease;

  if (isTaxIncrease) {
    return (
      <div className="rounded-2xl border border-rose-200 dark:border-rose-900/70 bg-rose-50/70 dark:bg-rose-950/30 p-4 sm:p-5 shadow-2xs space-y-3 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                  Diagnóstico de Impacto Fiscal
                </span>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-rose-200/80 dark:bg-rose-900/50 text-rose-900 dark:text-rose-200">
                  +{formatPercent(comparison.taxBurdenDifferencePercentPoints)} p.p.
                </span>
              </div>
              <h4 className="text-base font-extrabold text-rose-950 dark:text-rose-100 mt-0.5">
                Aumento de Carga Tributária Estimado: +{formatBRL(comparison.taxBurdenDifferenceBrl)}/ano
              </h4>
              <p className="text-xs text-rose-800 dark:text-rose-300/90 mt-1 max-w-3xl leading-relaxed">
                Sob o novo regime da Reforma Tributária (IBS + CBS a {reform.appliedRatePercent.toFixed(1)}%), sua carga efetiva passará de{' '}
                <strong className="font-mono tabular-nums">{formatPercent(legacy.effectiveTaxBurdenPercent)}</strong> para{' '}
                <strong className="font-mono tabular-nums">{formatPercent(reform.effectiveTaxBurdenPercent)}</strong> da Receita Bruta.
              </p>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-rose-200/80 dark:border-rose-800/60 shrink-0 text-left sm:text-right">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
              Repasse Necessário no Preço
            </span>
            <span className="text-lg font-mono font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">
              +{formatPercent(comparison.priceAdjustmentRequiredToMaintainProfit)}
            </span>
            <span className="text-[10px] text-slate-400 block">
              p/ manter o mesmo lucro líquido
            </span>
          </div>
        </div>

        {/* Fatores Determinantes & Recomendações */}
        <div className="pt-3 border-t border-rose-200/60 dark:border-rose-900/50 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-rose-900 dark:text-rose-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong>Principal Causa:</strong>{' '}
              {input.payroll > input.cogsAndInputs
                ? 'Alto peso da Folha de Pagamento, que não gera créditos de IBS e CBS, contrastando com alíquotas nominais mais altas no IVA Dual.'
                : 'Aumento na alíquota nominal de saída sem volume suficiente de créditos fiscais compensatórios na entrada.'}
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong>Ação Estratégica:</strong> Rever compras de fornecedores (preferir regime normal com crédito pleno de {reformRates.referenceRate}%) e renegociar contratos de fornecimento e precificação de venda.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isTaxDecrease) {
    return (
      <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/70 bg-emerald-50/70 dark:bg-emerald-950/30 p-4 sm:p-5 shadow-2xs space-y-3 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 shrink-0">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Diagnóstico de Impacto Fiscal
                </span>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-200/80 dark:bg-emerald-900/50 text-emerald-900 dark:text-emerald-200">
                  {formatPercent(comparison.taxBurdenDifferencePercentPoints)} p.p.
                </span>
              </div>
              <h4 className="text-base font-extrabold text-emerald-950 dark:text-emerald-100 mt-0.5">
                Economia Tributária Estimada: {formatBRL(Math.abs(comparison.taxBurdenDifferenceBrl))}/ano
              </h4>
              <p className="text-xs text-emerald-800 dark:text-emerald-300/90 mt-1 max-w-3xl leading-relaxed">
                Sob o novo regime da Reforma Tributária, sua carga efetiva recuará de{' '}
                <strong className="font-mono tabular-nums">{formatPercent(legacy.effectiveTaxBurdenPercent)}</strong> para{' '}
                <strong className="font-mono tabular-nums">{formatPercent(reform.effectiveTaxBurdenPercent)}</strong> da Receita Bruta.
              </p>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 shrink-0 text-left sm:text-right">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
              Ganho no Resultado Líquido
            </span>
            <span className="text-lg font-mono font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
              +{formatBRL(Math.abs(comparison.operatingResultDifferenceBrl))}
            </span>
            <span className="text-[10px] text-slate-400 block">
              expansão de margem operacional
            </span>
          </div>
        </div>

        {/* Fatores Determinantes & Recomendações */}
        <div className="pt-3 border-t border-emerald-200/60 dark:border-emerald-900/50 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-emerald-900 dark:text-emerald-200">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong>Principal Causa:</strong> A não-cumulatividade plena permitiu recuperar{' '}
              <strong className="font-mono tabular-nums">+{formatBRL(reform.totalCredits)}</strong> em créditos fiscais de insumos, máquinas, energia elétrica e serviços tomados.
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong>Oportunidade Comercial:</strong> Espaço para redução estratégica de preços com ganho de participação de mercado ou retenção da margem para novos investimentos em bens de capital.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Cenário Neutro
  return (
    <div className="rounded-2xl border border-blue-200 dark:border-blue-900/70 bg-blue-50/60 dark:bg-blue-950/30 p-4 sm:p-5 shadow-2xs space-y-2 transition-colors">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 shrink-0">
          <Minus className="w-5 h-5" />
        </div>
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
            Diagnóstico de Impacto Fiscal
          </span>
          <h4 className="text-base font-extrabold text-blue-950 dark:text-blue-100">
            Neutralidade Fiscal: Carga Tributária Praticamente Inalterada
          </h4>
          <p className="text-xs text-blue-800 dark:text-blue-300/90 mt-0.5">
            A nova alíquota do IVA Dual e os créditos tomados na entrada equilibram com precisão os tributos que foram extintos, mantendo a carga efetiva estável em <strong className="font-mono tabular-nums">{formatPercent(reform.effectiveTaxBurdenPercent)}</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};
