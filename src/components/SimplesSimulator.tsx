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
  Sparkles,
  Info
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

      {/* DRE Comparativa Detalhada com Análise Vertical (%) - Conforme Modelo da Imagem */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-0">
        
        {/* Topo da Tabela com Seletor de Modo de Exibição (R$ e %) */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              DRE Comparativa Detalhada com Análise Vertical (%)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Confronto linha a linha entre o Simples "Por Dentro" (DAS Unificado) e o Simples "Híbrido" (IBS/CBS Por Fora - Art. 146-A CF), com valores em Reais (R$) e percentuais sobre a Receita Bruta (%)
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

        {/* Grid Tabular Responsivo idêntico à DRE Geral */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4 min-w-[260px]">CONTA DA DRE / RUBRICA FISCAL</th>
                <th className="py-3 px-4 text-right min-w-[155px]">
                  SIMPLES "POR DENTRO" {displayMode === 'both' ? '(R$ E % AV)' : displayMode === 'currency' ? '(R$)' : '(%)'}
                </th>
                <th className="py-3 px-4 text-right min-w-[155px]">
                  SIMPLES "HÍBRIDO" {displayMode === 'both' ? '(R$ E % AV)' : displayMode === 'currency' ? '(R$)' : '(%)'}
                </th>
                <th className="py-3 px-4 text-right min-w-[145px]">
                  {displayMode === 'both' ? 'VARIAÇÃO LÍQUIDA (R$ E P.P.)' : displayMode === 'currency' ? 'VARIAÇÃO LÍQUIDA (R$)' : 'VARIAÇÃO LÍQUIDA (P.P.)'}
                </th>
                <th className="py-3 px-4 text-right min-w-[110px]">IMPACTO RELATIVO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              
              {/* 1. Receita Operacional Bruta */}
              <tr className="font-semibold bg-slate-50/40 dark:bg-slate-800/20">
                <td className="py-3 px-4 text-slate-900 dark:text-white">
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
                <td className="py-3 px-4 text-right font-mono text-slate-400 tabular-nums">
                  0,0%
                </td>
              </tr>

              {/* 2. Deduções da Receita Bruta (Tributos sobre Vendas) */}
              <tr className="text-slate-600 dark:text-slate-300 italic bg-rose-50/20 dark:bg-rose-950/10">
                <td className="py-2.5 px-4 pl-8 not-italic">
                  (-) Tributos Brutos sobre Vendas
                </td>
                <td className="py-2.5 px-4 text-right not-italic">
                  {renderCell(porDentro.totalDebits, true, 'text-rose-600 dark:text-rose-400 font-medium')}
                </td>
                <td className="py-2.5 px-4 text-right not-italic">
                  {renderCell(hibrido.totalDebits, true, 'text-rose-600 dark:text-rose-400 font-medium')}
                </td>
                <td className="py-2.5 px-4 text-right not-italic">
                  {renderVariation(hibrido.totalDebits - porDentro.totalDebits)}
                </td>
                <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-500 not-italic">
                  {porDentro.totalDebits > 0 
                    ? formatPercent(((hibrido.totalDebits - porDentro.totalDebits) / porDentro.totalDebits) * 100, 1) 
                    : '-'}
                </td>
              </tr>

              {/* Detalhamento dos tributos sobre vendas */}
              <tr className="text-slate-500 dark:text-slate-400 text-[11px]">
                <td className="py-1 px-4 pl-12">
                  · ICMS / IBS (Subnacional - Estados & Municípios)
                </td>
                <td className="py-1 px-4 text-right">
                  {renderCell(porDentro.icmsDebit)}
                </td>
                <td className="py-1 px-4 text-right">
                  {renderCell(hibrido.icmsDebit, false, 'text-blue-600 dark:text-blue-400 font-semibold')}
                </td>
                <td className="py-1 px-4 text-right">
                  {renderVariation(hibrido.icmsDebit - porDentro.icmsDebit)}
                </td>
                <td className="py-1 px-4 text-right font-mono tabular-nums text-slate-400">
                  {porDentro.icmsDebit > 0 
                    ? formatPercent(((hibrido.icmsDebit - porDentro.icmsDebit) / porDentro.icmsDebit) * 100, 1) 
                    : 'Novo IBS'}
                </td>
              </tr>

              <tr className="text-slate-500 dark:text-slate-400 text-[11px]">
                <td className="py-1 px-4 pl-12">
                  · ISS (Municipal)
                </td>
                <td className="py-1 px-4 text-right">
                  {porDentro.issDebit > 0 ? renderCell(porDentro.issDebit) : <span className="font-mono text-slate-400">R$ 0</span>}
                </td>
                <td className="py-1 px-4 text-right font-mono text-slate-400 tabular-nums">
                  (Incorporado no IBS)
                </td>
                <td className="py-1 px-4 text-right">
                  {renderVariation(-porDentro.issDebit)}
                </td>
                <td className="py-1 px-4 text-right font-mono tabular-nums text-slate-400">
                  {porDentro.issDebit > 0 ? '-100,0%' : '-'}
                </td>
              </tr>

              <tr className="text-slate-500 dark:text-slate-400 text-[11px]">
                <td className="py-1 px-4 pl-12">
                  · PIS/COFINS / CBS (Federal)
                </td>
                <td className="py-1 px-4 text-right">
                  {renderCell(porDentro.pisCofinsDebit)}
                </td>
                <td className="py-1 px-4 text-right">
                  {renderCell(hibrido.pisCofinsDebit, false, 'text-blue-600 dark:text-blue-400 font-semibold')}
                </td>
                <td className="py-1 px-4 text-right">
                  {renderVariation(hibrido.pisCofinsDebit - porDentro.pisCofinsDebit)}
                </td>
                <td className="py-1 px-4 text-right font-mono tabular-nums text-slate-400">
                  {porDentro.pisCofinsDebit > 0 
                    ? formatPercent(((hibrido.pisCofinsDebit - porDentro.pisCofinsDebit) / porDentro.pisCofinsDebit) * 100, 1) 
                    : 'Nova CBS'}
                </td>
              </tr>

              <tr className="text-slate-500 dark:text-slate-400 text-[11px]">
                <td className="py-1 px-4 pl-12">
                  · IPI / Imposto Seletivo (Extrafiscal)
                </td>
                <td className="py-1 px-4 text-right">
                  {porDentro.selectiveDebit > 0 ? renderCell(porDentro.selectiveDebit) : <span className="font-mono text-slate-400">R$ 0</span>}
                </td>
                <td className="py-1 px-4 text-right">
                  {hibrido.selectiveDebit > 0 ? renderCell(hibrido.selectiveDebit, false, 'text-amber-600') : <span className="font-mono text-slate-400">R$ 0</span>}
                </td>
                <td className="py-1 px-4 text-right">
                  {renderVariation(hibrido.selectiveDebit - porDentro.selectiveDebit)}
                </td>
                <td className="py-1 px-4 text-right font-mono tabular-nums text-slate-400">-</td>
              </tr>

              <tr className="text-slate-500 dark:text-slate-400 text-[11px] bg-amber-50/20 dark:bg-amber-950/10">
                <td className="py-1 px-4 pl-12 font-medium text-amber-800 dark:text-amber-300">
                  · Parcela IRPJ, CSLL e CPP no Simples Nacional
                </td>
                <td className="py-1 px-4 text-right text-amber-700 dark:text-amber-300">
                  {renderCell(porDentro.directTaxesPaid)}
                </td>
                <td className="py-1 px-4 text-right text-amber-700 dark:text-amber-300">
                  {renderCell(hibrido.directTaxesPaid)}
                </td>
                <td className="py-1 px-4 text-right">
                  {renderVariation(0)}
                </td>
                <td className="py-1 px-4 text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">
                  Preservada no DAS
                </td>
              </tr>

              {/* 3. Receita Operacional Líquida */}
              <tr className="font-semibold bg-slate-50/20 dark:bg-slate-800/10">
                <td className="py-2.5 px-4 text-slate-900 dark:text-white">
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
                <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-500">
                  {porDentro.netRevenue > 0 
                    ? formatPercent(((hibrido.netRevenue - porDentro.netRevenue) / porDentro.netRevenue) * 100, 1) 
                    : '-'}
                </td>
              </tr>

              {/* 4. Custos e Insumos Brutos */}
              <tr className="text-slate-600 dark:text-slate-300">
                <td className="py-2 px-4 pl-8">
                  (-) Insumos, Mercadorias, Energia & Terceiros
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
                <td className="py-2 px-4 text-right font-mono text-slate-400 tabular-nums">
                  0,0%
                </td>
              </tr>

              {/* 5. (+) Créditos Tributários Recuperados */}
              <tr className="font-medium bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300">
                <td className="py-2.5 px-4 pl-8 flex items-center gap-1.5">
                  <span>(+) Créditos Fiscais Recuperados (Entrada)</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-sans">
                    (Não-cumulatividade ampla)
                  </span>
                </td>
                <td className="py-2.5 px-4 text-right text-slate-400 font-sans">
                  R$ 0,00 (Vedado)
                </td>
                <td className="py-2.5 px-4 text-right">
                  {renderCell(hibrido.creditsAppropriated, false, 'text-emerald-600 dark:text-emerald-400 font-extrabold')}
                </td>
                <td className="py-2.5 px-4 text-right">
                  {renderVariation(hibrido.creditsAppropriated, true)}
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 tabular-nums font-bold">
                  Crédito 100%
                </td>
              </tr>

              {/* Sublinha de Crédito repassado ao cliente B2B */}
              <tr className="text-blue-700 dark:text-blue-400 text-[11px] bg-blue-50/30 dark:bg-blue-950/10">
                <td className="py-1 px-4 pl-12 flex items-center gap-1">
                  <span>↳ Crédito entregue ao cliente PJ (Vendas B2B {b2bSalesPercent}%)</span>
                </td>
                <td className="py-1 px-4 text-right font-mono">
                  {renderCell(porDentro.creditPassedToClientsBrl, false, 'text-amber-600 dark:text-amber-400')}
                </td>
                <td className="py-1 px-4 text-right font-mono">
                  {renderCell(hibrido.creditPassedToClientsBrl, false, 'text-blue-600 dark:text-blue-400 font-semibold')}
                </td>
                <td className="py-1 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  +{formatBRL(hibrido.b2bClientGainBrl)}
                </td>
                <td className="py-1 px-4 text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-bold">
                  +{formatPercent(hibrido.creditPassedToClientsRate - porDentro.creditPassedToClientsRate)} p.p.
                </td>
              </tr>

              {/* 6. Despesas com Pessoal (Folha) */}
              <tr className="text-slate-600 dark:text-slate-300">
                <td className="py-2 px-4 pl-8">
                  (-) Folha de Pagamento & Encargos Sociais
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
                <td className="py-2 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 tabular-nums font-medium">
                  Isenção CPP 20%
                </td>
              </tr>

              {/* 7. Outras Despesas */}
              <tr className="text-slate-600 dark:text-slate-300">
                <td className="py-2 px-4 pl-8">
                  (-) Outras Despesas Operacionais
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
                  {renderCell(porDentro.totalTaxesPaid, false, 'text-amber-600 dark:text-amber-400 font-bold')}
                </td>
                <td className="py-3 px-4 text-right">
                  {renderCell(hibrido.totalTaxesPaid, false, 'text-blue-600 dark:text-blue-400 font-bold')}
                </td>
                <td className="py-3 px-4 text-right">
                  {renderVariation(hibrido.totalTaxesPaid - porDentro.totalTaxesPaid)}
                </td>
                <td className={`py-3 px-4 text-right font-mono tabular-nums font-bold ${
                  hibrido.totalTaxesPaid > porDentro.totalTaxesPaid ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {porDentro.totalTaxesPaid > 0 
                    ? `${formatPercent(((hibrido.totalTaxesPaid - porDentro.totalTaxesPaid) / porDentro.totalTaxesPaid) * 100, 1)}` 
                    : '-'}
                </td>
              </tr>

              {/* Carga Efetiva % */}
              <tr className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-50/40 dark:bg-slate-800/30">
                <td className="py-2.5 px-4 pl-8">
                  Carga Tributária Efetiva (% sobre Receita Bruta)
                </td>
                <td className="py-2.5 px-4 text-right">
                  {displayMode === 'currency' ? (
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                      {formatBRL(porDentro.totalTaxesPaid)}
                    </span>
                  ) : displayMode === 'percent' ? (
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                      {formatPercent(porDentro.effectiveTaxBurdenPercent)}
                    </span>
                  ) : (
                    <div className="flex flex-col items-end leading-tight">
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                        {formatPercent(porDentro.effectiveTaxBurdenPercent)}
                      </span>
                      <span className="text-[10px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        {formatBRL(porDentro.totalTaxesPaid)}
                      </span>
                    </div>
                  )}
                </td>
                <td className="py-2.5 px-4 text-right">
                  {displayMode === 'currency' ? (
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                      {formatBRL(hibrido.totalTaxesPaid)}
                    </span>
                  ) : displayMode === 'percent' ? (
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                      {formatPercent(hibrido.effectiveTaxBurdenPercent)}
                    </span>
                  ) : (
                    <div className="flex flex-col items-end leading-tight">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                        {formatPercent(hibrido.effectiveTaxBurdenPercent)}
                      </span>
                      <span className="text-[10px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        {formatBRL(hibrido.totalTaxesPaid)}
                      </span>
                    </div>
                  )}
                </td>
                <td className="py-2.5 px-4 text-right">
                  {renderVariation(hibrido.totalTaxesPaid - porDentro.totalTaxesPaid)}
                </td>
                <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold">
                  {hibrido.totalTaxesPaid > porDentro.totalTaxesPaid ? 'Aumento de Carga' : 'Economia Tributária'}
                </td>
              </tr>

              {/* 9. Resultado Operacional Líquido */}
              <tr className="font-extrabold text-sm bg-slate-100 dark:bg-slate-800/90 text-slate-900 dark:text-white border-t border-slate-300 dark:border-slate-700">
                <td className="py-3 px-4">
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
                <td className={`py-3 px-4 text-right font-mono tabular-nums font-extrabold ${
                  comparison.operatingResultDifferenceBrl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {comparison.operatingResultDifferenceBrl >= 0 ? 'Ganho Híbrido' : 'Economia Por Dentro'}
                </td>
              </tr>

            </tbody>
          </table>
        </div>

        {/* Nota Explicativa de Rodapé */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
          <span>
            <strong>Análise Vertical (% AV) e Fundamento Legal (Art. 146-A CF & PLP 68/2024):</strong> Na coluna <em>Simples "Por Dentro"</em>, a empresa recolhe a guia integral do DAS ({dasRate.toFixed(2)}% = {formatBRL(porDentro.dasTotalPaid)}), sem apropriação de créditos de compras e com repasse restrito de crédito (~4,5%). No <em>Simples "Híbrido"</em>, a empresa apura IBS e CBS pelo regime regular ({reformRates.referenceRate}%) com crédito pleno nas compras ({formatBRL(hibrido.creditsAppropriated)}), mantendo os tributos diretos (IRPJ, CSLL e CPP) protegidos no Simples Nacional e transferindo crédito integral de 100% aos clientes corporativos (B2B).
          </span>
        </div>

      </div>

    </div>
  );
};
