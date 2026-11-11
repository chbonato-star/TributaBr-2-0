import React, { useState } from 'react';
import { CompanyFinancialInput, LegacyTaxRates, ReformTaxRates } from '../types/tax';
import { calculateSimplesComparison, formatBRL, formatPercent } from '../lib/taxCalculations';
import { 
  Building2, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  Scale, 
  TrendingUp, 
  TrendingDown, 
  ArrowRight, 
  ShieldCheck, 
  Users, 
  Briefcase, 
  Sliders,
  Sparkles
} from 'lucide-react';

interface SimplesSimulatorProps {
  input: CompanyFinancialInput;
  legacyRates: LegacyTaxRates;
  reformRates: ReformTaxRates;
  onApplyModel?: (model: 'por_dentro' | 'hibrido') => void;
}

export const SimplesSimulator: React.FC<SimplesSimulatorProps> = ({
  input,
  legacyRates,
  reformRates,
  onApplyModel,
}) => {
  // Parâmetros de simulação específicos do Simples
  const [b2bSalesPercent, setB2bSalesPercent] = useState<number>(50); // 50% B2B, 50% B2C
  const [dasRate, setDasRate] = useState<number>(() => {
    return legacyRates.simplesEffectiveRate > 0 ? legacyRates.simplesEffectiveRate : 8.5;
  });
  const [consumptionShare, setConsumptionShare] = useState<number>(45); // 45% do DAS é ICMS/ISS/PIS/COFINS

  const analysis = calculateSimplesComparison(
    input,
    legacyRates,
    reformRates,
    b2bSalesPercent,
    dasRate,
    consumptionShare
  );

  const { porDentro, hibrido, comparison } = analysis;
  const isHibridoRecommended = comparison.recommendedModel === 'hibrido';
  const [displayMode, setDisplayMode] = useState<'both' | 'currency' | 'percent'>('both');
  const revenue = input.revenue > 0 ? input.revenue : 1;

  // Helper para renderizar células numéricas com suporte a R$ e % AV
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

    // Modo 'both' (R$ + % sobre a Receita Bruta na linha inferior)
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

  // Helper para renderizar a variação entre Híbrido e Por Dentro
  const renderVariation = (diffBrl: number, invertColors = false) => {
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

    // Modo 'both' (R$ no topo e p.p. embaixo)
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
    <div className="space-y-6">
      
      {/* Banner Explicativo - Contexto Legal da EC 132/2023 */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              Simples Nacional na Reforma Tributária: Por Dentro vs. Híbrido
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Análise comparativa da opção constitucional do Art. 146-A da CF (EC 132/2023) e PLP 68/2024
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold font-mono">
              Art. 146-A CF/88
            </span>
            <span className="px-2.5 py-1 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-semibold font-mono">
              PLP 68/2024
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          A Reforma Tributária garante às micro e pequenas empresas o direito de <strong>escolher como recolherão o IBS e a CBS</strong>.
          No modelo <strong>Por Dentro</strong>, o optante continua pagando a guia única do DAS, mas transfere crédito reduzido aos seus clientes PJ (~4,5%).
          No modelo <strong>Híbrido</strong>, a empresa opta por recolher o IBS e a CBS por fora no regime não-cumulativo ({reformRates.referenceRate}%),
          tomando crédito integral nas compras e transferindo 100% de crédito para seus clientes corporativos, sem perder o enquadramento no Simples para IRPJ, CSLL e CPP/INSS patronal.
        </p>
      </div>

      {/* Painel de Calibração da Simulação */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Parâmetros do Perfil Comercial & Tributário da Empresa
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Slider 1: % Vendas B2B vs B2C */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                Vendas para Empresas (B2B)
              </label>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm tabular-nums">
                {b2bSalesPercent}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={b2bSalesPercent}
              onChange={(e) => setB2bSalesPercent(parseInt(e.target.value) || 0)}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>0% (Consumidor B2C)</span>
              <span>100% (Corporativo B2B)</span>
            </div>
          </div>

          {/* Slider 2: Alíquota Efetiva do DAS */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-600" />
                Alíquota Efetiva do DAS Atual
              </label>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm tabular-nums">
                {dasRate.toFixed(2)}%
              </span>
            </div>
            <input
              type="range"
              min="4.0"
              max="16.0"
              step="0.25"
              value={dasRate}
              onChange={(e) => setDasRate(parseFloat(e.target.value) || 4.0)}
              className="w-full accent-amber-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Faixa Inicial (4%)</span>
              <span>Sublimite (16%)</span>
            </div>
          </div>

          {/* Slider 3: Parcela de Tributos sobre Consumo no DAS */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                Fatia de Consumo no DAS (ICMS/ISS/PIS/COFINS)
              </label>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm tabular-nums">
                {consumptionShare}%
              </span>
            </div>
            <input
              type="range"
              min="30"
              max="60"
              step="2"
              value={consumptionShare}
              onChange={(e) => setConsumptionShare(parseInt(e.target.value) || 45)}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>30% (Serviços puros)</span>
              <span>60% (Comércio/Indústria)</span>
            </div>
          </div>

        </div>
      </div>

      {/* Veredito Estratégico & Recomendação */}
      <div className={`p-5 rounded-2xl border ${
        isHibridoRecommended 
          ? 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' 
          : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
      } space-y-3`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {isHibridoRecommended ? (
              <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            )}
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Recomendação Estratégica do Simulador:
              </span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                {isHibridoRecommended ? 'Modelo Recomendado: SIMPLES HÍBRIDO (IBS/CBS Por Fora)' : 'Modelo Recomendado: SIMPLES POR DENTRO (DAS Unificado Padrão)'}
              </h4>
            </div>
          </div>

          {onApplyModel && (
            <button
              onClick={() => onApplyModel(comparison.recommendedModel)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
            >
              <span>Aplicar no Simulador Principal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          {comparison.rationale}
        </p>

        {/* Indicador de Ponto de Virada (Breakeven B2B) */}
        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-slate-600 dark:text-slate-400">
            Ponto de Virada Comercial (Breakeven B2B): 
            <strong className="font-mono text-slate-900 dark:text-white ml-1.5">
              {comparison.b2bBreakevenPercent}% de vendas para PJ
            </strong>
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            {b2bSalesPercent >= comparison.b2bBreakevenPercent 
              ? `Vendas B2B atuais (${b2bSalesPercent}%) acima do breakeven: Híbrido compensa comercialmente`
              : `Vendas B2B atuais (${b2bSalesPercent}%) abaixo do breakeven: Por Dentro preserva mais caixa`}
          </span>
        </div>
      </div>

      {/* Comparativo Lado a Lado: Por Dentro vs. Híbrido */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* CARD 1: Simples Por Dentro (Padrão) */}
        <div className={`bg-white dark:bg-slate-900 rounded-2xl border ${
          !isHibridoRecommended 
            ? 'border-amber-300 dark:border-amber-700 shadow-md ring-1 ring-amber-400/30' 
            : 'border-slate-200 dark:border-slate-800'
        } p-5 space-y-4`}>
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Opção Tradicional
              </span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Simples "Por Dentro" (Padrão)
              </h4>
            </div>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              DAS Unificado
            </span>
          </div>

          {/* Indicadores Principais */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
              <span className="text-slate-400 text-[11px] block">Tributo Total Pago (DAS)</span>
              <span className="text-sm font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                {formatBRL(porDentro.dasTotalPaid)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{dasRate.toFixed(2)}% da receita bruta</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
              <span className="text-slate-400 text-[11px] block">Margem Líquida</span>
              <span className="text-sm font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                {formatPercent(porDentro.netMarginPercent)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{formatBRL(porDentro.operatingResult)}/ano</span>
            </div>
          </div>

          {/* Detalhamento das Características */}
          <div className="space-y-2.5 text-xs">
            
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800 font-mono">
              <span className="text-slate-600 dark:text-slate-400 font-sans">Créditos Apropriados nas Compras:</span>
              <strong className="text-slate-400">R$ 0,00 (Sem crédito)</strong>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800 font-mono">
              <span className="text-slate-600 dark:text-slate-400 font-sans">Crédito Gerado para Clientes PJ:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {porDentro.creditPassedToClientsRate.toFixed(2)}% ({formatBRL(porDentro.creditPassedToClientsBrl)})
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800 font-mono">
              <span className="text-slate-600 dark:text-slate-400 font-sans">Desvantagem de Crédito do Cliente PJ:</span>
              <strong className="text-rose-600 dark:text-rose-400">
                -{formatBRL(porDentro.b2bClientDisadvantageBrl)}/ano
              </strong>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800 font-mono">
              <span className="text-slate-600 dark:text-slate-400 font-sans">Desconto Médio Necessário p/ B2B:</span>
              <span className="text-amber-600 font-bold">
                ~{(reformRates.referenceRate - porDentro.creditPassedToClientsRate).toFixed(1)}% na nota fiscal
              </span>
            </div>

          </div>

          {/* Pontos Fortes e Fracos */}
          <div className="pt-2 space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Simplicidade máxima: apenas uma guia mensal de arrecadação (DAS).</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Excelente para B2C: consumidor final pessoa física não toma crédito.</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Risco de perda de clientes B2B que exigirão crédito de {reformRates.referenceRate}%.</span>
            </div>
          </div>

        </div>

        {/* CARD 2: Simples Híbrido (IBS/CBS Por Fora) */}
        <div className={`bg-white dark:bg-slate-900 rounded-2xl border ${
          isHibridoRecommended 
            ? 'border-blue-400 dark:border-blue-600 shadow-md ring-1 ring-blue-500/30' 
            : 'border-slate-200 dark:border-slate-800'
        } p-5 space-y-4`}>
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Opção Estratégica EC 132/2023
              </span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Simples "Híbrido" (IBS/CBS Por Fora)
              </h4>
            </div>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              IVA Não-Cumulativo
            </span>
          </div>

          {/* Indicadores Principais */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
              <span className="text-slate-400 text-[11px] block">Tributo Total Recolhido</span>
              <span className="text-sm font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                {formatBRL(hibrido.totalTaxesPaid)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                DAS Direto ({formatBRL(hibrido.dasSegregatedPaid)}) + IVA ({formatBRL(hibrido.netCbsIbsPaid)})
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
              <span className="text-slate-400 text-[11px] block">Margem Líquida</span>
              <span className="text-sm font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                {formatPercent(hibrido.netMarginPercent)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{formatBRL(hibrido.operatingResult)}/ano</span>
            </div>
          </div>

          {/* Detalhamento das Características */}
          <div className="space-y-2.5 text-xs">
            
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800 font-mono">
              <span className="text-slate-600 dark:text-slate-400 font-sans">Créditos Apropriados nas Compras:</span>
              <strong className="text-emerald-600 dark:text-emerald-400">
                +{formatBRL(hibrido.cbsIbsCredits)} (100% integral)
              </strong>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800 font-mono">
              <span className="text-slate-600 dark:text-slate-400 font-sans">Crédito Gerado para Clientes PJ:</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {hibrido.creditPassedToClientsRate.toFixed(2)}% ({formatBRL(hibrido.creditPassedToClientsBrl)})
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800 font-mono">
              <span className="text-slate-600 dark:text-slate-400 font-sans">Ganho Competitivo p/ Cliente PJ:</span>
              <strong className="text-emerald-600 dark:text-emerald-400">
                +{formatBRL(hibrido.b2bClientGainBrl)}/ano transferidos
              </strong>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800 font-mono">
              <span className="text-slate-600 dark:text-slate-400 font-sans">Paridade com Grandes Empresas:</span>
              <span className="text-emerald-600 font-bold">
                100% idêntico a Lucro Real/Presumido
              </span>
            </div>

          </div>

          {/* Pontos Fortes e Fracos */}
          <div className="pt-2 space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Mantém isenção de INSS patronal (CPP) do Simples na folha de pagamento.</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Gera crédito cheio ({reformRates.referenceRate}%), blindando clientes corporativos.</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Exige controle contábil de débitos e créditos fiscais de IBS/CBS.</span>
            </div>
          </div>

        </div>

      </div>

      {/* DRE Comparativa Completa: Simples Por Dentro vs. Simples Híbrido */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-0">
        
        {/* Topo da DRE com Seletor de Modo de Exibição */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Demonstração do Resultado do Exercício (DRE): Por Dentro vs. Híbrido
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Estrutura contábil oficial (CPC 26) decompondo a fatia de consumo e tributos diretos do Simples Nacional
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

        {/* Tabela Tabular com Alinhamento Numérico */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4 min-w-[260px]">Conta da DRE / Rubrica Contábil</th>
                <th className="py-3 px-4 text-right min-w-[155px]">
                  Simples "Por Dentro" {displayMode === 'both' ? '(R$ e % AV)' : displayMode === 'currency' ? '(R$)' : '(%)'}
                </th>
                <th className="py-3 px-4 text-right min-w-[155px]">
                  Simples "Híbrido" {displayMode === 'both' ? '(R$ e % AV)' : displayMode === 'currency' ? '(R$)' : '(%)'}
                </th>
                <th className="py-3 px-4 text-right min-w-[145px]">
                  {displayMode === 'both' ? 'Variação Líquida (R$ e p.p.)' : displayMode === 'currency' ? 'Variação Líquida (R$)' : 'Variação Líquida (p.p.)'}
                </th>
                <th className="py-3 px-4 text-right min-w-[110px]">Impacto no Modelo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200 font-mono">
              
              {/* 1. Receita Operacional Bruta */}
              <tr className="font-semibold bg-slate-50/40 dark:bg-slate-800/20">
                <td className="py-3 px-4 font-sans text-slate-900 dark:text-white">
                  1. Receita Operacional Bruta
                </td>
                <td className="py-3 px-4 text-right">
                  {renderCell(porDentro.grossRevenue)}
                </td>
                <td className="py-3 px-4 text-right">
                  {renderCell(hibrido.grossRevenue)}
                </td>
                <td className="py-3 px-4 text-right">
                  {renderVariation(0)}
                </td>
                <td className="py-3 px-4 text-right text-slate-400 tabular-nums font-sans">
                  Base 100%
                </td>
              </tr>

              {/* 2. Tributos sobre Vendas / Consumo */}
              <tr className="text-slate-600 dark:text-slate-300 bg-rose-50/20 dark:bg-rose-950/10">
                <td className="py-2.5 px-4 pl-8 font-sans">
                  (-) Tributos sobre Vendas (Consumo)
                </td>
                <td className="py-2.5 px-4 text-right">
                  {renderCell(porDentro.consumptionTaxesPaid, true, 'text-rose-600 dark:text-rose-400 font-medium')}
                </td>
                <td className="py-2.5 px-4 text-right">
                  {renderCell(hibrido.consumptionTaxesPaid, true, 'text-rose-600 dark:text-rose-400 font-medium')}
                </td>
                <td className="py-2.5 px-4 text-right">
                  {renderVariation(hibrido.consumptionTaxesPaid - porDentro.consumptionTaxesPaid)}
                </td>
                <td className="py-2.5 px-4 text-right font-sans text-[11px] text-slate-500">
                  {hibrido.consumptionTaxesPaid > porDentro.consumptionTaxesPaid ? 'Maior Débito' : 'Menor Débito'}
                </td>
              </tr>

              {/* Detalhamento da Parcela de Consumo */}
              <tr className="text-slate-500 dark:text-slate-400 text-[11px]">
                <td className="py-1 px-4 pl-12 font-sans">
                  · Parcela ICMS, ISS, PIS e COFINS no DAS ({consumptionShare}% da taxa)
                </td>
                <td className="py-1 px-4 text-right text-amber-600 dark:text-amber-400">
                  {renderCell(porDentro.consumptionTaxesPaid)}
                </td>
                <td className="py-1 px-4 text-right text-slate-400">
                  (Substituído por IBS/CBS)
                </td>
                <td className="py-1 px-4 text-right">
                  {renderVariation(-porDentro.consumptionTaxesPaid)}
                </td>
                <td className="py-1 px-4 text-right font-sans text-slate-400">
                  Extinto no Híbrido
                </td>
              </tr>

              <tr className="text-slate-500 dark:text-slate-400 text-[11px]">
                <td className="py-1 px-4 pl-12 font-sans">
                  · Débito Pleno de IBS ({reformRates.ibsShare}%) + CBS ({reformRates.cbsShare}%)
                </td>
                <td className="py-1 px-4 text-right text-slate-400">
                  (Não optou por fora)
                </td>
                <td className="py-1 px-4 text-right text-blue-600 dark:text-blue-400 font-semibold">
                  {renderCell(hibrido.cbsIbsDebits)}
                </td>
                <td className="py-1 px-4 text-right">
                  {renderVariation(hibrido.cbsIbsDebits)}
                </td>
                <td className="py-1 px-4 text-right font-sans text-blue-600 dark:text-blue-400">
                  Alíquota {reformRates.referenceRate}%
                </td>
              </tr>

              {/* 3. Receita Operacional Líquida */}
              <tr className="font-semibold bg-slate-50/20 dark:bg-slate-800/10">
                <td className="py-2.5 px-4 font-sans text-slate-900 dark:text-white">
                  2. Receita Operacional Líquida
                </td>
                <td className="py-2.5 px-4 text-right">
                  {renderCell(porDentro.netRevenue, false, 'text-slate-900 dark:text-white font-bold')}
                </td>
                <td className="py-2.5 px-4 text-right">
                  {renderCell(hibrido.netRevenue, false, 'text-slate-900 dark:text-white font-bold')}
                </td>
                <td className="py-2.5 px-4 text-right">
                  {renderVariation(hibrido.netRevenue - porDentro.netRevenue, true)}
                </td>
                <td className="py-2.5 px-4 text-right font-sans text-slate-500">
                  {formatPercent(((hibrido.netRevenue - porDentro.netRevenue) / porDentro.netRevenue) * 100, 1)}
                </td>
              </tr>

              {/* 4. Custos Operacionais / Compras */}
              <tr className="text-slate-600 dark:text-slate-300">
                <td className="py-2 px-4 pl-8 font-sans">
                  (-) Custos de Insumos, Mercadorias, Energia & Terceiros
                </td>
                <td className="py-2 px-4 text-right">
                  {renderCell(porDentro.grossPurchases, true)}
                </td>
                <td className="py-2 px-4 text-right">
                  {renderCell(hibrido.grossPurchases, true)}
                </td>
                <td className="py-2 px-4 text-right">
                  {renderVariation(0)}
                </td>
                <td className="py-2 px-4 text-right font-sans text-slate-400">
                  Mesmo custo bruto
                </td>
              </tr>

              {/* 5. Créditos Fiscais sobre Aquisições */}
              <tr className="font-medium bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300">
                <td className="py-2.5 px-4 pl-8 font-sans flex items-center gap-1.5">
                  <span>(+) Créditos Fiscais sobre Compras (IBS/CBS)</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-sans">
                    (Não-cumulatividade)
                  </span>
                </td>
                <td className="py-2.5 px-4 text-right text-slate-400 font-sans">
                  R$ 0,00 (Vedado)
                </td>
                <td className="py-2.5 px-4 text-right text-emerald-600 dark:text-emerald-400 font-extrabold">
                  {renderCell(hibrido.creditsAppropriated, false, 'text-emerald-600 dark:text-emerald-400 font-extrabold')}
                </td>
                <td className="py-2.5 px-4 text-right">
                  {renderVariation(hibrido.creditsAppropriated, true)}
                </td>
                <td className="py-2.5 px-4 text-right font-sans text-emerald-600 dark:text-emerald-400 font-bold">
                  Crédito 100%
                </td>
              </tr>

              {/* 6. Lucro Bruto Operacional */}
              <tr className="font-semibold bg-slate-50/40 dark:bg-slate-800/30">
                <td className="py-2.5 px-4 font-sans text-slate-900 dark:text-white">
                  3. Lucro Bruto Operacional (Margem de Contribuição)
                </td>
                <td className="py-2.5 px-4 text-right">
                  {renderCell(porDentro.grossProfit, false, 'font-bold text-slate-900 dark:text-white')}
                </td>
                <td className="py-2.5 px-4 text-right">
                  {renderCell(hibrido.grossProfit, false, 'font-bold text-slate-900 dark:text-white')}
                </td>
                <td className="py-2.5 px-4 text-right">
                  {renderVariation(hibrido.grossProfit - porDentro.grossProfit, true)}
                </td>
                <td className="py-2.5 px-4 text-right font-sans text-slate-500">
                  {porDentro.grossProfit > 0 ? formatPercent(((hibrido.grossProfit - porDentro.grossProfit) / porDentro.grossProfit) * 100, 1) : '-'}
                </td>
              </tr>

              {/* 7. Folha de Pagamento */}
              <tr className="text-slate-600 dark:text-slate-300">
                <td className="py-2 px-4 pl-8 font-sans">
                  (-) Folha de Pagamento & Encargos (CPP Isenta no Simples)
                </td>
                <td className="py-2 px-4 text-right">
                  {renderCell(porDentro.payroll, true)}
                </td>
                <td className="py-2 px-4 text-right">
                  {renderCell(hibrido.payroll, true)}
                </td>
                <td className="py-2 px-4 text-right">
                  {renderVariation(0)}
                </td>
                <td className="py-2 px-4 text-right font-sans text-emerald-600 dark:text-emerald-400">
                  Isenção 20% CPP
                </td>
              </tr>

              {/* 8. Outras Despesas */}
              <tr className="text-slate-600 dark:text-slate-300">
                <td className="py-2 px-4 pl-8 font-sans">
                  (-) Outras Despesas Operacionais Administrativas
                </td>
                <td className="py-2 px-4 text-right">
                  {renderCell(porDentro.otherOperationalExpenses, true)}
                </td>
                <td className="py-2 px-4 text-right">
                  {renderCell(hibrido.otherOperationalExpenses, true)}
                </td>
                <td className="py-2 px-4 text-right">
                  {renderVariation(0)}
                </td>
                <td className="py-2 px-4 text-right font-sans text-slate-400">
                  Idêntico
                </td>
              </tr>

              {/* 9. Tributos Diretos Retidos no Simples (IRPJ, CSLL e CPP) */}
              <tr className="text-slate-700 dark:text-slate-300 bg-amber-50/20 dark:bg-amber-950/10">
                <td className="py-2.5 px-4 pl-8 font-sans">
                  (-) Tributos Diretos do Simples (IRPJ, CSLL e CPP/INSS)
                </td>
                <td className="py-2.5 px-4 text-right">
                  {renderCell(porDentro.directTaxesPaid, true, 'text-amber-700 dark:text-amber-300 font-semibold')}
                </td>
                <td className="py-2.5 px-4 text-right">
                  {renderCell(hibrido.directTaxesPaid, true, 'text-amber-700 dark:text-amber-300 font-semibold')}
                </td>
                <td className="py-2.5 px-4 text-right">
                  {renderVariation(0)}
                </td>
                <td className="py-2.5 px-4 text-right font-sans text-slate-400">
                  Paridade exata ({100 - consumptionShare}%)
                </td>
              </tr>

              {/* 10. Resultado Operacional Líquido Final */}
              <tr className="font-extrabold text-sm bg-slate-100 dark:bg-slate-800/90 text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700">
                <td className="py-3 px-4 font-sans">
                  (=) Resultado Operacional Líquido Final
                </td>
                <td className="py-3 px-4 text-right">
                  {renderCell(porDentro.operatingResult, false, porDentro.operatingResult >= 0 ? 'text-slate-900 dark:text-white font-extrabold' : 'text-rose-600 font-extrabold')}
                </td>
                <td className="py-3 px-4 text-right">
                  {renderCell(hibrido.operatingResult, false, hibrido.operatingResult >= 0 ? 'text-slate-900 dark:text-white font-extrabold' : 'text-rose-600 font-extrabold')}
                </td>
                <td className="py-3 px-4 text-right">
                  {renderVariation(comparison.operatingResultDifferenceBrl, true)}
                </td>
                <td className={`py-3 px-4 text-right font-sans font-extrabold ${
                  comparison.operatingResultDifferenceBrl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {comparison.operatingResultDifferenceBrl >= 0 ? 'Ganho Híbrido' : 'Economia Por Dentro'}
                </td>
              </tr>

              {/* Linha Resumo 1: Total Efetivo de Tributos Recolhidos */}
              <tr className="font-bold bg-blue-50/50 dark:bg-blue-950/20 text-blue-950 dark:text-blue-200 border-t border-slate-200 dark:border-slate-700">
                <td className="py-2.5 px-4 font-sans">
                  Total Efetivo de Tributos Recolhidos aos Cofres Públicos
                </td>
                <td className="py-2.5 px-4 text-right text-amber-600 dark:text-amber-400">
                  {renderCell(porDentro.totalTaxesPaid, false, 'text-amber-600 dark:text-amber-400 font-bold')}
                </td>
                <td className="py-2.5 px-4 text-right text-blue-600 dark:text-blue-400">
                  {renderCell(hibrido.totalTaxesPaid, false, 'text-blue-600 dark:text-blue-400 font-bold')}
                </td>
                <td className="py-2.5 px-4 text-right">
                  {renderVariation(hibrido.totalTaxesPaid - porDentro.totalTaxesPaid)}
                </td>
                <td className="py-2.5 px-4 text-right font-sans text-slate-500">
                  {hibrido.totalTaxesPaid > porDentro.totalTaxesPaid ? `+${formatBRL(hibrido.totalTaxesPaid - porDentro.totalTaxesPaid)}` : 'Mais econômico'}
                </td>
              </tr>

              {/* Linha Resumo 2: Crédito Transferido para Clientes PJ */}
              <tr className="bg-slate-50/70 dark:bg-slate-800/50 font-semibold">
                <td className="py-2.5 px-4 font-sans text-slate-900 dark:text-white">
                  Crédito Fiscal Entregue ao Cliente PJ (% e R$)
                </td>
                <td className="py-2.5 px-4 text-right text-amber-600 dark:text-amber-400 font-bold">
                  {displayMode === 'currency' ? (
                    formatBRL(porDentro.creditPassedToClientsBrl)
                  ) : displayMode === 'percent' ? (
                    formatPercent(porDentro.creditPassedToClientsRate)
                  ) : (
                    <div className="flex flex-col items-end leading-tight">
                      <span>{formatBRL(porDentro.creditPassedToClientsBrl)}</span>
                      <span className="text-[10px] text-slate-500 font-normal">{formatPercent(porDentro.creditPassedToClientsRate)}</span>
                    </div>
                  )}
                </td>
                <td className="py-2.5 px-4 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                  {displayMode === 'currency' ? (
                    formatBRL(hibrido.creditPassedToClientsBrl)
                  ) : displayMode === 'percent' ? (
                    formatPercent(hibrido.creditPassedToClientsRate)
                  ) : (
                    <div className="flex flex-col items-end leading-tight">
                      <span>{formatBRL(hibrido.creditPassedToClientsBrl)}</span>
                      <span className="text-[10px] text-emerald-600 font-normal">{formatPercent(hibrido.creditPassedToClientsRate)}</span>
                    </div>
                  )}
                </td>
                <td className="py-2.5 px-4 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                  +{formatBRL(hibrido.b2bClientGainBrl)}
                </td>
                <td className="py-2.5 px-4 text-right font-sans text-emerald-600 dark:text-emerald-400 font-bold">
                  +{formatPercent(hibrido.creditPassedToClientsRate - porDentro.creditPassedToClientsRate)} p.p.
                </td>
              </tr>

            </tbody>
          </table>
        </div>

        {/* Nota Metodológica Explicativa da DRE */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
          <span>
            <strong>Fundamento Contábil e Legal (Art. 146-A CF & PLP 68/2024):</strong> Na coluna <em>Simples "Por Dentro"</em>, a guia única do DAS de {dasRate.toFixed(2)}% ({formatBRL(porDentro.dasTotalPaid)}) é formalmente decomposta: a parcela de tributos sobre consumo ({consumptionShare}% = {formatBRL(porDentro.consumptionTaxesPaid)}) é deduzida da Receita Bruta para apurar a Receita Líquida, e a parcela direta de IRPJ, CSLL e CPP ({100 - consumptionShare}% = {formatBRL(porDentro.directTaxesPaid)}) é subtraída abaixo do lucro bruto operacional. No <em>Simples "Híbrido"</em>, o optante apura IBS/CBS por fora com não-cumulatividade plena ({reformRates.referenceRate}%), recolhendo apenas os tributos diretos pelo Simples e repassando crédito total aos seus compradores corporativos.
          </span>
        </div>

      </div>

    </div>
  );
};
