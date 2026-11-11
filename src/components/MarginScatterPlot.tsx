import React, { useState, useMemo } from 'react';
import { SimulationResult, CompanyFinancialInput, LegacyTaxRates, ReformTaxRates } from '../types/tax';
import { calculateTaxSimulation, formatBRL, formatPercent } from '../lib/taxCalculations';
import { Target, Activity, AlertTriangle, CheckCircle2, Info, TrendingDown, TrendingUp, Percent, DollarSign } from 'lucide-react';

interface MarginScatterPlotProps {
  simulation: SimulationResult;
  input: CompanyFinancialInput;
  legacyRates: LegacyTaxRates;
  reformRates: ReformTaxRates;
}

export const MarginScatterPlot: React.FC<MarginScatterPlotProps> = ({
  simulation,
  input,
  legacyRates,
  reformRates,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{
    rate: number;
    marginPercent: number;
    operatingResult: number;
    taxesPaid: number;
    isCurrent?: boolean;
    isBreakevenZero?: boolean;
    isParity?: boolean;
  } | null>(null);

  const [yAxisMode, setYAxisMode] = useState<'percent' | 'currency'>('percent');

  const { legacy, reform } = simulation;
  const isRevenueValid = input.revenue >= 1000;
  const currentRevenue = Math.max(1000, input.revenue);
  const rawLegacyMargin = currentRevenue > 0 ? (legacy.operatingResult / currentRevenue) * 100 : 0;
  const legacyMargin = Math.max(-100, Math.min(100, isFinite(rawLegacyMargin) ? rawLegacyMargin : 0));
  const rawCurrentReformMargin = currentRevenue > 0 ? (reform.operatingResult / currentRevenue) * 100 : 0;
  const currentReformMargin = Math.max(-100, Math.min(100, isFinite(rawCurrentReformMargin) ? rawCurrentReformMargin : 0));

  // Cálculo analítico do ponto de equilíbrio (linearidade do resultado em função da alíquota)
  const { breakevenZeroRate, parityRate, sensitivityPerPoint, scatterPoints } = useMemo(() => {
    if (!isRevenueValid) {
      return {
        breakevenZeroRate: null,
        parityRate: null,
        sensitivityPerPoint: 0,
        scatterPoints: [],
      };
    }

    const cbsRatio = reformRates.referenceRate > 0 ? reformRates.cbsShare / reformRates.referenceRate : 0.332;
    const ibsRatio = reformRates.referenceRate > 0 ? reformRates.ibsShare / reformRates.referenceRate : 0.668;

    const computeAt = (rateVal: number) => {
      const simRates: ReformTaxRates = {
        ...reformRates,
        referenceRate: rateVal,
        cbsShare: rateVal * cbsRatio,
        ibsShare: rateVal * ibsRatio,
      };
      return calculateTaxSimulation(input, legacyRates, simRates);
    };

    const sim10 = computeAt(10);
    const sim30 = computeAt(30);

    const res10 = sim10.reform.operatingResult;
    const res30 = sim30.reform.operatingResult;
    const slope = (res10 - res30) / 20; // R$ de perda de resultado operacional para cada 1% de aumento na alíquota

    // Breakeven 1: Margem = 0% (Resultado = 0)
    let beZero: number | null = null;
    if (Math.abs(slope) > 1 && isFinite(slope)) {
      const calculatedZero = 10 + (res10 / slope);
      if (isFinite(calculatedZero) && calculatedZero > 0 && calculatedZero < 150) {
        beZero = Number(calculatedZero.toFixed(1));
      }
    }

    // Breakeven 2: Paridade com o Sistema Atual (Resultado = legacy.operatingResult)
    let beParity: number | null = null;
    if (Math.abs(slope) > 1 && isFinite(slope)) {
      const calculatedParity = 10 + ((res10 - legacy.operatingResult) / slope);
      if (isFinite(calculatedParity) && calculatedParity > 0 && calculatedParity < 150) {
        beParity = Number(calculatedParity.toFixed(1));
      }
    }

    // Sensibilidade: impacto de 1 p.p. na margem (%)
    const sensitivity = currentRevenue > 0 && isFinite(slope) ? (slope / currentRevenue) * 100 : 0;

    // Gerar pontos de dispersão (faixa de 14% a 38% com passo de 1.5% + pontos chave)
    const rawRates = [
      14, 16, 18, 20, 22, 24, 25, 26, 26.5, 27, 28, 29, 30, 31, 32, 34, 36, 38
    ];

    // Incluir alíquota atual se não estiver
    if (!rawRates.includes(reformRates.referenceRate)) {
      rawRates.push(reformRates.referenceRate);
    }

    // Incluir breakeven se estiver na faixa de interesse (10% a 45%)
    if (beZero !== null && beZero >= 12 && beZero <= 42) {
      rawRates.push(Number(beZero.toFixed(1)));
    }
    if (beParity !== null && beParity >= 12 && beParity <= 42) {
      rawRates.push(Number(beParity.toFixed(1)));
    }

    const uniqueRates = Array.from(new Set(rawRates)).sort((a, b) => a - b);

    const points = uniqueRates.map((rateVal) => {
      const sim = computeAt(rateVal);
      const opResult = sim.reform.operatingResult;
      const rawMargin = currentRevenue > 0 ? (opResult / currentRevenue) * 100 : 0;
      const marginPct = Math.max(-100, Math.min(100, isFinite(rawMargin) ? rawMargin : 0));
      const isCurrent = Math.abs(rateVal - reformRates.referenceRate) < 0.1;
      const isBreakevenZero = beZero !== null && Math.abs(rateVal - beZero) < 0.2;
      const isParity = beParity !== null && Math.abs(rateVal - beParity) < 0.2;

      return {
        rate: rateVal,
        marginPercent: marginPct,
        operatingResult: opResult,
        taxesPaid: sim.reform.netTaxesPaid,
        isCurrent,
        isBreakevenZero,
        isParity,
      };
    });

    return {
      breakevenZeroRate: beZero,
      parityRate: beParity,
      sensitivityPerPoint: sensitivity,
      scatterPoints: points,
    };
  }, [input, legacyRates, reformRates, legacy.operatingResult, currentRevenue, isRevenueValid]);

  // Limites do Gráfico SVG
  const minRate = 14;
  const maxRate = 38;

  const margins = scatterPoints.map((p) => p.marginPercent);
  const minMargin = Math.max(-100, Math.min(...margins, legacyMargin, -2));
  const maxMargin = Math.min(100, Math.max(...margins, legacyMargin, 2));

  // Espaço com padding para os eixos (limitado a faixa segura)
  const yDomainMin = Math.floor(minMargin - 2);
  const yDomainMax = Math.ceil(maxMargin + 2);
  const yRange = Math.max(1, yDomainMax - yDomainMin);

  // Linhas de grade horizontais (useMemo chamado incondicionalmente no topo)
  const yTicks = useMemo(() => {
    if (yRange <= 0 || !isFinite(yRange)) return [0];
    const rawStep = Math.max(1, Math.ceil(yRange / 5));
    let step = 1;
    if (rawStep > 25) step = 50;
    else if (rawStep > 15) step = 25;
    else if (rawStep > 8) step = 10;
    else if (rawStep > 3) step = 5;
    else if (rawStep > 1) step = 2;

    const ticks: number[] = [];
    const startVal = Math.ceil(yDomainMin / step) * step;
    let count = 0;
    for (let v = startVal; v <= yDomainMax && count < 12; v += step) {
      ticks.push(v);
      count++;
    }
    return ticks.length > 0 ? ticks : [0];
  }, [yDomainMin, yDomainMax, yRange]);

  // Se a receita for zero ou menor que 1.000, exibe estado orientativo sem travar a interface
  // (Renderizado APÓS todos os hooks do componente)
  if (!isRevenueValid) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm text-center space-y-2">
        <Target className="w-7 h-7 text-indigo-500 mx-auto opacity-75" />
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Análise de Sensibilidade & Ponto de Equilíbrio (Breakeven)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Digite a <strong>Receita Bruta Anual</strong> no painel de parâmetros para calcular a evolução da margem e o ponto de equilíbrio.
        </p>
      </div>
    );
  }

  // Dimensões do SVG
  const svgWidth = 700;
  const svgHeight = 280;
  const padLeft = 60;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 40;

  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  const getX = (rate: number) => {
    const clamped = Math.max(minRate, Math.min(maxRate, rate));
    return padLeft + ((clamped - minRate) / (maxRate - minRate)) * chartW;
  };

  const getY = (marginVal: number) => {
    return padTop + chartH - ((marginVal - yDomainMin) / yRange) * chartH;
  };

  // Coordenada Y da linha de Margem Zero (Breakeven)
  const zeroY = getY(0);
  const legacyY = getY(legacyMargin);
  const currentX = getX(reformRates.referenceRate);

  // Caminho da curva de dispersão / linha de tendência
  const linePath = scatterPoints
    .filter((p) => p.rate >= minRate && p.rate <= maxRate)
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(p.rate).toFixed(1)} ${getY(p.marginPercent).toFixed(1)}`)
    .join(' ');

  const xTicks = [15, 20, 25, 26.5, 30, 35];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-5">
      
      {/* Top Bar do Gráfico */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Análise de Sensibilidade & Ponto de Equilíbrio (Breakeven)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Evolução da margem líquida conforme a alíquota da Reforma varia de 14% a 38% (sem repasse de preços)
          </p>
        </div>

        {/* Alternador de exibição Y */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
          <button
            onClick={() => setYAxisMode('percent')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              yAxisMode === 'percent'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Margem Líquida (%)
          </button>
          <button
            onClick={() => setYAxisMode('currency')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              yAxisMode === 'currency'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Resultado (R$)
          </button>
        </div>
      </div>

      {/* 4 Cards com Indicadores Estratégicos de Breakeven */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        
        {/* Margem Atual */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Margem Regime Atual</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-base font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {formatPercent(legacyMargin)}
            </span>
            <span className="text-[10px] font-mono text-slate-400 tabular-nums">
              ({formatBRL(legacy.operatingResult)})
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">Benchmark de lucratividade</span>
        </div>

        {/* Margem Reforma na Alíquota Atual */}
        <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-800/60">
          <span className="text-[11px] text-indigo-600 dark:text-indigo-300 block font-medium">
            Margem Reforma ({reformRates.referenceRate.toFixed(1)}%)
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-base font-bold font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">
              {formatPercent(currentReformMargin)}
            </span>
            <span className="text-[10px] font-mono text-indigo-500/80 tabular-nums">
              ({formatBRL(reform.operatingResult)})
            </span>
          </div>
          <span className="text-[10px] text-indigo-500/80 block mt-0.5">
            {currentReformMargin >= legacyMargin ? 'Melhoria de ' : 'Retração de '}
            {Math.abs(currentReformMargin - legacyMargin).toFixed(2)} p.p.
          </span>
        </div>

        {/* Ponto de Paridade Tributária */}
        <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60">
          <span className="text-[11px] text-emerald-700 dark:text-emerald-300 block font-medium">
            Paridade com Sistema Atual
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
              {parityRate !== null && isFinite(parityRate) ? `${parityRate.toFixed(1)}%` : 'Sem Paridade'}
            </span>
          </div>
          <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 block mt-0.5">
            {parityRate !== null && isFinite(parityRate)
              ? reformRates.referenceRate > parityRate
                ? `Acima da paridade (+${(reformRates.referenceRate - parityRate).toFixed(1)} p.p.)`
                : `Abaixo da paridade (-${(parityRate - reformRates.referenceRate).toFixed(1)} p.p.)`
              : input.taxRegime === 'simples_nacional' && input.simplesModel !== 'hibrido'
              ? 'Regime DAS fixo (Por Dentro)'
              : 'Sem ponto de paridade nesta faixa'}
          </span>
        </div>

        {/* Ponto de Equilíbrio Operacional (Breakeven Zero) */}
        <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60">
          <span className="text-[11px] text-amber-700 dark:text-amber-300 block font-medium">
            Alíquota Máx. Suportável (0%)
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-base font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums">
              {breakevenZeroRate !== null && isFinite(breakevenZeroRate) ? `${breakevenZeroRate.toFixed(1)}%` : 'Inviolável'}
            </span>
          </div>
          <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 block mt-0.5">
            {breakevenZeroRate !== null && isFinite(breakevenZeroRate)
              ? breakevenZeroRate > reformRates.referenceRate
                ? `Folga segura de +${(breakevenZeroRate - reformRates.referenceRate).toFixed(1)} p.p.`
                : 'Alerta: Em déficit operacional'
              : input.taxRegime === 'simples_nacional' && input.simplesModel !== 'hibrido'
              ? 'Imune às variações do IVA'
              : reform.operatingResult > 0
              ? 'Margem positiva em toda a faixa'
              : 'Déficit operacional'}
          </span>
        </div>

      </div>

      {/* Gráfico de Dispersão SVG Interativo */}
      <div className="relative border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 p-2 sm:p-4">
        
        {/* Tooltip Flutuante */}
        {hoveredPoint && (
          <div
            className="absolute z-20 px-3 py-2 bg-slate-900/95 dark:bg-slate-800/95 text-white text-xs rounded-xl shadow-xl border border-slate-700 backdrop-blur-xs pointer-events-none transition-all duration-150 tabular-nums"
            style={{
              left: `${Math.min(svgWidth - 190, Math.max(70, getX(hoveredPoint.rate)))}px`,
              top: `${Math.max(10, getY(hoveredPoint.marginPercent) - 75)}px`,
            }}
          >
            <div className="font-bold flex items-center gap-1.5 text-indigo-300 border-b border-slate-700 pb-1 mb-1">
              <span>Alíquota da Reforma: {hoveredPoint.rate.toFixed(1)}%</span>
              {hoveredPoint.isCurrent && <span className="text-[9px] bg-blue-500/30 text-blue-300 px-1.5 rounded">Atual</span>}
              {hoveredPoint.isBreakevenZero && <span className="text-[9px] bg-amber-500/30 text-amber-300 px-1.5 rounded">Breakeven</span>}
              {hoveredPoint.isParity && <span className="text-[9px] bg-emerald-500/30 text-emerald-300 px-1.5 rounded">Paridade</span>}
            </div>
            <div className="space-y-0.5 text-[11px]">
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Margem Líquida:</span>
                <strong className={hoveredPoint.marginPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {formatPercent(hoveredPoint.marginPercent, 2)}
                </strong>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Resultado Líquido:</span>
                <span>{formatBRL(hoveredPoint.operatingResult)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Tributos Líquidos:</span>
                <span>{formatBRL(hoveredPoint.taxesPaid)}</span>
              </div>
            </div>
          </div>
        )}

        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto select-none overflow-visible">
          
          {/* Zona de Lucro (Verde suave acima da linha zero) */}
          {zeroY <= padTop + chartH && (
            <rect
              x={padLeft}
              y={padTop}
              width={chartW}
              height={Math.max(0, zeroY - padTop)}
              fill="rgba(16, 185, 129, 0.04)"
            />
          )}

          {/* Zona de Prejuízo (Vermelho suave abaixo da linha zero) */}
          {zeroY >= padTop && (
            <rect
              x={padLeft}
              y={zeroY}
              width={chartW}
              height={Math.max(0, padTop + chartH - zeroY)}
              fill="rgba(239, 68, 68, 0.04)"
            />
          )}

          {/* Linhas de Grade Horizontais */}
          {yTicks.map((tick) => {
            const yPos = getY(tick);
            if (yPos < padTop || yPos > padTop + chartH) return null;
            return (
              <g key={tick}>
                <line
                  x1={padLeft}
                  y1={yPos}
                  x2={padLeft + chartW}
                  y2={yPos}
                  stroke="currentColor"
                  strokeOpacity="0.08"
                  strokeWidth="1"
                  className="text-slate-400 dark:text-slate-600"
                />
                <text
                  x={padLeft - 8}
                  y={yPos + 3.5}
                  textAnchor="end"
                  fontSize="9"
                  fontFamily="monospace"
                  fill="currentColor"
                  className="text-slate-400 dark:text-slate-500 tabular-nums"
                >
                  {yAxisMode === 'percent'
                    ? `${tick}%`
                    : Math.abs((tick / 100) * currentRevenue) >= 1_000_000
                    ? `R$ ${(((tick / 100) * currentRevenue) / 1_000_000).toFixed(1).replace('.', ',')}M`
                    : formatBRL((tick / 100) * currentRevenue)}
                </text>
              </g>
            );
          })}

          {/* Linha Zero (Ponto de Equilíbrio Operacional) */}
          {zeroY >= padTop && zeroY <= padTop + chartH && (
            <g>
              <line
                x1={padLeft}
                y1={zeroY}
                x2={padLeft + chartW}
                y2={zeroY}
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <text
                x={padLeft + chartW - 5}
                y={zeroY - 4}
                textAnchor="end"
                fontSize="8.5"
                fontWeight="bold"
                fill="#f59e0b"
                fontFamily="sans-serif"
              >
                Ponto de Equilíbrio (Margem 0%)
              </text>
            </g>
          )}

          {/* Linha da Margem do Regime Atual (Benchmark) */}
          {legacyY >= padTop && legacyY <= padTop + chartH && (
            <g>
              <line
                x1={padLeft}
                y1={legacyY}
                x2={padLeft + chartW}
                y2={legacyY}
                stroke="#64748b"
                strokeWidth="1.2"
                strokeDasharray="2 2"
              />
              <text
                x={padLeft + 6}
                y={legacyY - 4}
                fontSize="8.5"
                fontWeight="600"
                fill="#64748b"
                fontFamily="sans-serif"
              >
                Margem Atual ({legacyMargin.toFixed(1)}%)
              </text>
            </g>
          )}

          {/* Linha Vertical da Alíquota Atual da Reforma */}
          <line
            x1={currentX}
            y1={padTop}
            x2={currentX}
            y2={padTop + chartH}
            stroke="#6366f1"
            strokeWidth="1.2"
            strokeDasharray="3 3"
          />

          {/* Linha Contínua da Curva de Dispersão / Sensibilidade */}
          <path
            d={linePath}
            fill="none"
            stroke="#4f46e5"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Pontos de Dispersão (Scatter Dots) */}
          {scatterPoints
            .filter((p) => p.rate >= minRate && p.rate <= maxRate)
            .map((p) => {
              const cx = getX(p.rate);
              const cy = getY(p.marginPercent);
              const isHovered = hoveredPoint?.rate === p.rate;

              return (
                <g
                  key={p.rate}
                  className="cursor-pointer group"
                  onMouseEnter={() => setHoveredPoint(p)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  {/* Círculo invisível ampliado para toque/mouse fácil */}
                  <circle cx={cx} cy={cy} r="10" fill="transparent" />

                  {/* Ponto atual em destaque com halo */}
                  {p.isCurrent && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r="9"
                      fill="rgba(99, 102, 241, 0.25)"
                      className="animate-pulse"
                    />
                  )}

                  {/* Marcador especial se for Breakeven 0% */}
                  {p.isBreakevenZero && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r="7.5"
                      fill="rgba(245, 158, 11, 0.3)"
                    />
                  )}

                  {/* Ponto principal */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={p.isCurrent ? 5.5 : p.isBreakevenZero || p.isParity ? 4.5 : isHovered ? 4.5 : 3}
                    fill={
                      p.isCurrent
                        ? '#4f46e5'
                        : p.isBreakevenZero
                        ? '#f59e0b'
                        : p.isParity
                        ? '#10b981'
                        : p.marginPercent >= 0
                        ? '#6366f1'
                        : '#ef4444'
                    }
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                </g>
              );
            })}

          {/* Eixo X: Rótulos das Alíquotas */}
          {xTicks.map((rateTick) => {
            const xPos = getX(rateTick);
            const isRef = Math.abs(rateTick - reformRates.referenceRate) < 0.1;
            return (
              <g key={rateTick}>
                <line
                  x1={xPos}
                  y1={padTop + chartH}
                  x2={xPos}
                  y2={padTop + chartH + 5}
                  stroke="currentColor"
                  strokeWidth="1"
                  className={isRef ? 'text-indigo-600' : 'text-slate-300 dark:text-slate-600'}
                />
                <text
                  x={xPos}
                  y={padTop + chartH + 16}
                  textAnchor="middle"
                  fontSize="9.5"
                  fontWeight={isRef ? 'bold' : 'normal'}
                  fill="currentColor"
                  fontFamily="monospace"
                  className={isRef ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'}
                >
                  {rateTick}%
                </text>
              </g>
            );
          })}

          {/* Rótulo do Eixo X */}
          <text
            x={padLeft + chartW / 2}
            y={svgHeight - 6}
            textAnchor="middle"
            fontSize="10"
            fontWeight="600"
            fill="currentColor"
            className="text-slate-600 dark:text-slate-300"
          >
            Alíquota de Referência da Reforma - IVA Dual CBS + IBS (%)
          </text>
        </svg>

      </div>

      {/* Diagnóstico Executivo de Sensibilidade */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-slate-600 dark:text-slate-300 leading-relaxed">
            <strong className="text-slate-900 dark:text-white">Sensibilidade da Margem: </strong>
            Cada variação de <strong>1,0 p.p.</strong> na alíquota da Reforma altera a margem líquida em aproximadamente{' '}
            <strong className="text-indigo-600 dark:text-indigo-400 font-mono tabular-nums">
              {Math.abs(sensitivityPerPoint).toFixed(2)} p.p.
            </strong>{' '}
            ({formatBRL((Math.abs(sensitivityPerPoint) / 100) * currentRevenue)}/ano).
            {breakevenZeroRate !== null && isFinite(breakevenZeroRate) && breakevenZeroRate > reformRates.referenceRate ? (
              <span className="block sm:inline sm:ml-1 text-emerald-700 dark:text-emerald-400">
                A empresa possui margem segura até a alíquota atingir <strong>{breakevenZeroRate.toFixed(1)}%</strong> sem repassar aumentos para o preço de venda.
              </span>
            ) : null}
          </div>
        </div>

        {/* Legenda rápida */}
        <div className="flex items-center gap-3 text-[11px] shrink-0 self-end sm:self-auto text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
            Alíquota Atual ({reformRates.referenceRate.toFixed(1)}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            Breakeven (0%)
          </span>
        </div>
      </div>

    </div>
  );
};
