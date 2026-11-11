import React, { useState } from 'react';
import { SimulationResult, CompanyFinancialInput, ReformTaxRates } from '../types/tax';
import { 
  formatBRL, 
  formatPercent, 
  SECTOR_PRESETS,
  calculateSplitPaymentImpact,
  calculateTransitionTimeline 
} from '../lib/taxCalculations';
import { 
  X, 
  Printer, 
  FileSpreadsheet, 
  Copy, 
  Check, 
  Download, 
  FileText, 
  Loader2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Calendar,
  DollarSign,
  Layers,
  ShieldCheck,
  Building2,
  Briefcase,
  HelpCircle,
  Lightbulb
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  simulation: SimulationResult;
  input: CompanyFinancialInput;
  reformRates: ReformTaxRates;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  simulation,
  input,
  reformRates,
}) => {
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [activeView, setActiveView] = useState<'parecer' | 'dre'>('parecer');

  if (!isOpen) return null;

  const { legacy, reform, comparison } = simulation;
  const splitImpact = calculateSplitPaymentImpact(simulation);
  const timeline = calculateTransitionTimeline(simulation, input.revenue, reformRates);
  const sectorLabel = SECTOR_PRESETS[input.sector]?.label || input.sector;

  // Geração do Parecer Consultivo e Diagnóstico Estratégico
  const generateExecutiveInsights = () => {
    const isCargaAumento = comparison.taxBurdenDifferenceBrl > 500;
    const isCargaReducao = comparison.taxBurdenDifferenceBrl < -500;
    const isServico = ['servicos_geral', 'servicos_regulamentados', 'servicos_reduzidos'].includes(input.sector);
    const comprasSimplesPct = reformRates.purchasesFromSimplesPercent;
    const priceAdjustment = comparison.priceAdjustmentRequiredToMaintainProfit;

    // 1. Diagnóstico de Carga
    let cargaDiagnostico = '';
    if (isCargaAumento) {
      if (isServico) {
        cargaDiagnostico = `Aumento projetado de carga tributária de ${formatBRL(comparison.taxBurdenDifferenceBrl)}/ano (+${formatPercent(comparison.taxBurdenDifferencePercentPoints)} p.p.). O setor de serviços possui alta concentração de custos em folha de pagamento (${formatBRL(input.payroll)}), rubrica que constitucionalmente NÃO gera créditos de IBS ou CBS. Com a alíquota padrão unificada de ${reformRates.referenceRate.toFixed(1)}% incidindo sobre a receita bruta, o crédito obtido nas compras não neutraliza o aumento nominal.`;
      } else {
        cargaDiagnostico = `Aumento projetado de carga tributária de ${formatBRL(comparison.taxBurdenDifferenceBrl)}/ano (+${formatPercent(comparison.taxBurdenDifferencePercentPoints)} p.p.). A nova alíquota combinada do IVA Dual (${reformRates.referenceRate.toFixed(1)}%) supera a alíquota efetiva histórica da empresa (${formatPercent(legacy.effectiveTaxBurdenPercent)}).`;
      }
    } else if (isCargaReducao) {
      cargaDiagnostico = `Economia tributária líquida estimada em ${formatBRL(Math.abs(comparison.taxBurdenDifferenceBrl))}/ano (-${formatPercent(Math.abs(comparison.taxBurdenDifferencePercentPoints))} p.p.). A empresa é diretamente beneficiada pelo princípio da não-cumulatividade plena, auferindo ${formatBRL(reform.totalCredits)} em créditos amplos e imediatos sobre insumos, mercadorias, energia, máquinas e serviços contratados.`;
    } else {
      cargaDiagnostico = `Impacto de arrecadação praticamente neutro (variação inferior a R$ 500/ano). Os débitos de IBS e CBS sobre o faturamento equilibram-se com os novos créditos fiscais obtidos nas aquisições.`;
    }

    // 2. Precificação e Repasse
    let precificacao = '';
    if (priceAdjustment > 0.1) {
      precificacao = `Para preservar integralmente o resultado operacional líquido atual (${formatBRL(legacy.operatingResult)}), a empresa precisará reajustar seus preços finais em +${formatPercent(priceAdjustment)}. No novo regime, o imposto é calculado "por fora" (${reformRates.referenceRate.toFixed(1)}% sobre o preço líquido de venda), o que torna a tributação 100% transparente para clientes corporativos (B2B), que se creditam do valor integral pago.`;
    } else if (priceAdjustment < -0.1) {
      precificacao = `A desoneração fiscal abre espaço para redução de até ${formatPercent(Math.abs(priceAdjustment))} no preço de venda ou para a expansão direta da margem operacional em +${formatBRL(Math.abs(comparison.operatingResultDifferenceBrl))}/ano, aumentando a atratividade comercial frente à concorrência.`;
    } else {
      precificacao = `Não há necessidade de repasse ou reajuste de preços na transição para manter o nível atual de margem operacional.`;
    }

    // 3. Fornecedores do Simples Nacional
    let fornecedores = '';
    if (comprasSimplesPct > 0) {
      const perdaCredito = reform.simplesCreditReductionImpact || 0;
      fornecedores = `Aproximadamente ${comprasSimplesPct}% das compras da empresa são originadas de optantes do Simples Nacional. Pelo PLP 68/2024, compras do Simples transferem apenas crédito equivalente ao recolhimento efetivo (~4,5%), gerando uma perda de crédito estimada em ${formatBRL(perdaCredito)}/ano em comparação com fornecedores do regime normal (${reformRates.referenceRate.toFixed(1)}%). Recomenda-se negociar desconto compensatório com esses fornecedores ou reavaliar o mix de suprimentos.`;
    } else {
      fornecedores = `100% das aquisições da empresa decorrem de fornecedores enquadrados no regime regular, permitindo o aproveitamento integral e irrestrito de créditos de IBS e CBS à alíquota cheia (${reformRates.referenceRate.toFixed(1)}%).`;
    }

    // 4. Split Payment & Capital de Giro
    const split = `Com a implantação do Split Payment inteligente, aproximadamente ${formatBRL(splitImpact.annualWithheldAtSourceBrl)}/ano serão retidos e repassados ao Fisco no momento exato da liquidação financeira (cartões, Pix e boletos). Isso extingue o "float" histórico de ~45 dias entre o faturamento e o pagamento das guias, imobilizando cerca de ${formatBRL(splitImpact.cashFloatLossBrl)} de liquidez imediata, com custo de financiamento bancário estimado em ${formatBRL(splitImpact.annualFinancingCostBrl)}/ano.`;

    return { cargaDiagnostico, precificacao, fornecedores, split };
  };

  const insights = generateExecutiveInsights();

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    const rev = input.revenue > 0 ? input.revenue : 1;
    const calcPct = (val: number) => `${((Math.abs(val) / rev) * 100).toFixed(2)}%`;
    const calcPP = (diff: number) => `${((diff / rev) * 100).toFixed(2)} p.p.`;

    const rows = [
      ['TRIBUTABR - RELATÓRIO EXECUTIVO E CONSULTIVO DA REFORMA TRIBUTÁRIA'],
      ['Emenda Constitucional nº 132/2023 | PLP 68/2024 | PLP 108/2024'],
      ['Data de Emissão', new Date().toLocaleString('pt-BR')],
      [''],
      ['1. IDENTIFICAÇÃO DA EMPRESA'],
      ['Razão Social / Nome', input.companyName || 'Empresa em Análise'],
      ['Estado (UF Domicílio Fiscal)', input.stateUF || 'SP'],
      ['Setor Econômico', sectorLabel],
      ['Regime Tributário Atual', input.taxRegime.toUpperCase()],
      ['Faturamento Bruto Anual', input.revenue],
      [''],
      ['2. INDICADORES COMPARATIVOS GERAIS'],
      ['Métrica', 'Sistema Atual (Legado)', 'Reforma Tributária (IBS+CBS)', 'Variação Nominal (R$)', 'Variação (p.p.)'],
      ['Carga Tributária Efetiva', `${legacy.effectiveTaxBurdenPercent.toFixed(2)}%`, `${reform.effectiveTaxBurdenPercent.toFixed(2)}%`, comparison.taxBurdenDifferenceBrl, `${comparison.taxBurdenDifferencePercentPoints.toFixed(2)} p.p.`],
      ['Total de Tributos Pagos', legacy.netTaxesPaid, reform.netTaxesPaid, comparison.taxBurdenDifferenceBrl, ''],
      ['Créditos Fiscais Recuperados', legacy.totalCredits, reform.totalCredits, reform.totalCredits - legacy.totalCredits, ''],
      ['Resultado Operacional Final', legacy.operatingResult, reform.operatingResult, comparison.operatingResultDifferenceBrl, ''],
      ['Ajuste de Preço Sugerido', '-', `${comparison.priceAdjustmentRequiredToMaintainProfit.toFixed(2)}%`, '', ''],
      [''],
      ['3. DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO (DRE) COMPARATIVA'],
      ['Rubrica da DRE', 'Atual (R$)', 'Atual (% AV)', 'Reforma (R$)', 'Reforma (% AV)', 'Variação (R$)', 'Variação (p.p.)'],
      ['1. Receita Operacional Bruta', legacy.grossRevenue, '100,00%', reform.grossRevenue, '100,00%', 0, '0,00 p.p.'],
      ['(-) Tributos Brutos sobre Vendas', legacy.totalDebits, calcPct(legacy.totalDebits), reform.totalDebits, calcPct(reform.totalDebits), reform.totalDebits - legacy.totalDebits, calcPP(reform.totalDebits - legacy.totalDebits)],
      ['  · ICMS / IBS Subnacional', legacy.icmsDebit, calcPct(legacy.icmsDebit), reform.ibsDebit, calcPct(reform.ibsDebit), reform.ibsDebit - legacy.icmsDebit, calcPP(reform.ibsDebit - legacy.icmsDebit)],
      ['  · ISS Municipal (Extinto no IBS)', legacy.issDebit, calcPct(legacy.issDebit), 0, '0,00%', -legacy.issDebit, calcPP(-legacy.issDebit)],
      ['  · PIS/COFINS / CBS Federal', legacy.pisDebit + legacy.cofinsDebit, calcPct(legacy.pisDebit + legacy.cofinsDebit), reform.cbsDebit, calcPct(reform.cbsDebit), reform.cbsDebit - (legacy.pisDebit + legacy.cofinsDebit), calcPP(reform.cbsDebit - (legacy.pisDebit + legacy.cofinsDebit))],
      ['  · IPI / Imposto Seletivo Extrafiscal', legacy.ipiDebit, calcPct(legacy.ipiDebit), reform.selectiveDebit, calcPct(reform.selectiveDebit), reform.selectiveDebit - legacy.ipiDebit, calcPP(reform.selectiveDebit - legacy.ipiDebit)],
      ['2. Receita Operacional Líquida', legacy.netRevenue, calcPct(legacy.netRevenue), reform.grossRevenue - reform.totalDebits, calcPct(reform.grossRevenue - reform.totalDebits), (reform.grossRevenue - reform.totalDebits) - legacy.netRevenue, calcPP((reform.grossRevenue - reform.totalDebits) - legacy.netRevenue)],
      ['(-) Insumos, Mercadorias, Energia & Terceiros', input.cogsAndInputs + input.capitalGoodsAndEnergy + input.servicesHired, calcPct(input.cogsAndInputs + input.capitalGoodsAndEnergy + input.servicesHired), input.cogsAndInputs + input.capitalGoodsAndEnergy + input.servicesHired, calcPct(input.cogsAndInputs + input.capitalGoodsAndEnergy + input.servicesHired), 0, '0,00 p.p.'],
      ['(+) Créditos Fiscais Recuperados (Não-Cumulatividade)', legacy.totalCredits, calcPct(legacy.totalCredits), reform.totalCredits, calcPct(reform.totalCredits), reform.totalCredits - legacy.totalCredits, calcPP(reform.totalCredits - legacy.totalCredits)],
      ['(-) Folha de Pagamento & Encargos Sociais', input.payroll, calcPct(input.payroll), input.payroll, calcPct(input.payroll), 0, '0,00 p.p.'],
      ['(-) Outras Despesas Operacionais', input.otherOperationalExpenses, calcPct(input.otherOperationalExpenses), input.otherOperationalExpenses, calcPct(input.otherOperationalExpenses), 0, '0,00 p.p.'],
      ['Total de Tributos Líquidos Efetivos Recolhidos', legacy.netTaxesPaid, `${legacy.effectiveTaxBurdenPercent.toFixed(2)}%`, reform.netTaxesPaid, `${reform.effectiveTaxBurdenPercent.toFixed(2)}%`, comparison.taxBurdenDifferenceBrl, `${comparison.taxBurdenDifferencePercentPoints.toFixed(2)} p.p.`],
      ['(=) Resultado Operacional Líquido Final', legacy.operatingResult, calcPct(legacy.operatingResult), reform.operatingResult, calcPct(reform.operatingResult), comparison.operatingResultDifferenceBrl, calcPP(comparison.operatingResultDifferenceBrl)],
      [''],
      ['4. CRONOGRAMA DE TRANSIÇÃO (2026 A 2033)'],
      ['Ano', 'Fase / Status', 'PIS/COFINS', 'CBS Federal', 'ICMS/ISS', 'IBS Subnacional', 'Carga Estimada (R$)'],
      ...timeline.map((t) => [
        t.year,
        t.description,
        t.legacyPISCOFINSStatus,
        t.cbsStatus,
        `${t.legacyICMSISSPercent}%`,
        t.ibsStatus,
        t.effectiveCombinedTaxEstimatedBrl,
      ]),
      [''],
      ['5. PARECER EXECUTIVO E RECOMENDAÇÕES'],
      ['Diagnóstico de Carga', insights.cargaDiagnostico],
      ['Estratégia de Precificação', insights.precificacao],
      ['Cadeia de Fornecedores', insights.fornecedores],
      ['Split Payment e Capital de Giro', insights.split],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(';')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_estrategico_reforma_${(input.companyName || 'empresa').toLowerCase().replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = () => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;

      // ==========================================
      // PÁGINA 1: SUMÁRIO EXECUTIVO & DIAGNÓSTICO
      // ==========================================

      // 1. Header Banner Institucional
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pageWidth, 26, 'F');

      // Accent border azul
      doc.setFillColor(37, 99, 235); // blue-600
      doc.rect(0, 26, pageWidth, 1.5, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('TRIBUTABR | Relatório de Inteligência Tributária e Estratégia Fiscal', margin, 11.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(191, 219, 254);
      doc.text('Análise Técnica e Comparativa da Reforma Tributária sobre o Consumo (EC nº 132/2023 & PLP 68/2024)', margin, 18.5);

      // 2. Quadro de Identificação da Empresa & Metadados Fiscais
      let currentY = 32;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, currentY, pageWidth - margin * 2, 24, 2, 2, 'FD');

      const regimeLabels: Record<string, string> = {
        lucro_real: 'Lucro Real (Não-Cumulativo)',
        lucro_presumido: 'Lucro Presumido (Cumulativo)',
        simples_nacional: 'Simples Nacional (Regime Especial)',
      };
      const regimeLabel = regimeLabels[input.taxRegime] || input.taxRegime;

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('EMPRESA / RAZÃO SOCIAL:', margin + 4, currentY + 5.5);
      doc.text('ESTADO (UF DOMICÍLIO):', margin + 75, currentY + 5.5);
      doc.text('DATA DE EMISSÃO:', margin + 125, currentY + 5.5);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(input.companyName || 'Empresa em Análise', margin + 4, currentY + 10.5);
      doc.text(`${input.stateUF || 'SP'} (ICMS Modal)`, margin + 75, currentY + 10.5);
      doc.text(new Date().toLocaleDateString('pt-BR'), margin + 125, currentY + 10.5);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('SETOR ECONÔMICO:', margin + 4, currentY + 16.5);
      doc.text('REGIME ATUAL:', margin + 75, currentY + 16.5);
      doc.text('RECEITA BRUTA ANUAL:', margin + 125, currentY + 16.5);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(sectorLabel, margin + 4, currentY + 21);
      doc.text(regimeLabel, margin + 75, currentY + 21);
      doc.setTextColor(37, 99, 235);
      doc.text(formatBRL(input.revenue), margin + 125, currentY + 21);

      currentY += 29;

      // 3. Indicadores Principais (KPIs Cards)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('Indicadores Estratégicos Consolidados', margin, currentY);
      currentY += 4;

      const cardWidth = (pageWidth - margin * 2 - 9) / 4;
      const cardHeight = 22;

      const kpis = [
        {
          title: 'CARGA SISTEMA ATUAL',
          value: formatPercent(legacy.effectiveTaxBurdenPercent),
          sub: `${formatBRL(legacy.netTaxesPaid)}/ano`,
          color: [71, 85, 105],
        },
        {
          title: 'CARGA IVA DUAL (IBS+CBS)',
          value: formatPercent(reform.effectiveTaxBurdenPercent),
          sub: `${formatBRL(reform.netTaxesPaid)}/ano`,
          color: [37, 99, 235],
        },
        {
          title: 'VARIAÇÃO ANUAL DE CAIXA',
          value: `${comparison.taxBurdenDifferenceBrl > 0 ? '+' : ''}${formatBRL(comparison.taxBurdenDifferenceBrl)}`,
          sub: `${comparison.taxBurdenDifferencePercentPoints > 0 ? '+' : ''}${formatPercent(comparison.taxBurdenDifferencePercentPoints)} p.p. (${comparison.cashTaxIncreaseOrSavings})`,
          color: comparison.taxBurdenDifferenceBrl > 0 ? [220, 38, 38] : [16, 185, 129],
        },
        {
          title: 'CRÉDITOS FISCAIS DE ENTRADA',
          value: formatBRL(reform.totalCredits),
          sub: `${comparison.priceAdjustmentRequiredToMaintainProfit > 0 ? '+' : ''}${formatPercent(comparison.priceAdjustmentRequiredToMaintainProfit)} aj. de preço`,
          color: [16, 185, 129],
        },
      ];

      kpis.forEach((kpi, index) => {
        const cardX = margin + index * (cardWidth + 3);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

        doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
        doc.roundedRect(cardX, currentY, cardWidth, 1.5, 1, 1, 'F');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(100, 116, 139);
        doc.text(kpi.title, cardX + 2.5, currentY + 5.5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
        doc.text(kpi.value, cardX + 2.5, currentY + 11.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(71, 85, 105);
        doc.text(kpi.sub, cardX + 2.5, currentY + 17.5);
      });

      currentY += cardHeight + 8;

      // 4. Seção Explicativa: Parecer Técnico e Diagnóstico de Impacto
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('Parecer Consultivo & Diagnóstico Estratégico', margin, currentY);
      currentY += 4.5;

      const renderInsightBox = (
        title: string, 
        bodyText: string, 
        badgeText: string, 
        badgeColor: [number, number, number]
      ) => {
        const boxWidth = pageWidth - margin * 2;
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        const splitLines = doc.splitTextToSize(bodyText, boxWidth - 10);
        const boxHeight = 12 + splitLines.length * 3.5;

        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(margin, currentY, boxWidth, boxHeight, 1.5, 1.5, 'FD');

        // Borda lateral esquerda colorida
        doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
        doc.roundedRect(margin, currentY, 2, boxHeight, 1, 1, 'F');

        // Título e Badge
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text(title, margin + 5, currentY + 6);

        doc.setFontSize(7);
        doc.setTextColor(badgeColor[0], badgeColor[1], badgeColor[2]);
        doc.text(badgeText, boxWidth + margin - doc.getTextWidth(badgeText) - 5, currentY + 6);

        // Corpo do texto explicativo
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        doc.text(splitLines, margin + 5, currentY + 11);

        currentY += boxHeight + 4;
      };

      // Bloco 1: Carga e Resultado
      renderInsightBox(
        '1. Diagnóstico de Carga Tributária e Causa-Raiz',
        insights.cargaDiagnostico,
        comparison.taxBurdenDifferenceBrl > 0 ? 'Aumento de Tributos' : 'Redução de Tributos',
        comparison.taxBurdenDifferenceBrl > 0 ? [220, 38, 38] : [16, 185, 129]
      );

      // Bloco 2: Precificação e Repasse
      renderInsightBox(
        '2. Estratégia de Precificação, Markup e Alíquota "Por Fora"',
        insights.precificacao,
        comparison.priceAdjustmentRequiredToMaintainProfit > 0 ? 'Reajuste Recomendado' : 'Margem Preservada',
        [37, 99, 235]
      );

      // Bloco 3: Fornecedores do Simples
      renderInsightBox(
        '3. Gestão da Cadeia de Suprimentos & Fornecedores do Simples',
        insights.fornecedores,
        reformRates.purchasesFromSimplesPercent > 0 ? 'Atenção aos Créditos' : 'Crédito Integral 100%',
        reformRates.purchasesFromSimplesPercent > 0 ? [217, 119, 6] : [16, 185, 129]
      );

      // Bloco 4: Split Payment
      renderInsightBox(
        '4. Impacto do Split Payment no Capital de Giro e Tesouraria',
        insights.split,
        'Retenção em D+0 / D+2',
        [100, 116, 139]
      );

      // ==========================================
      // PÁGINA 2: DEMONSTRAÇÃO DO RESULTADO (DRE)
      // ==========================================
      doc.addPage();

      // Header de Continuação da Página 2
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 16, 'F');
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 16, pageWidth, 1, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('TRIBUTABR | Demonstração do Resultado do Exercício (DRE) Comparativa', margin, 11);

      currentY = 24;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('DRE Comparativa Detalhada com Análise Vertical (%)', margin, currentY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        'Confronto linha a linha entre a tributação atual e o modelo do IVA Dual (EC 132/2023), valores em Reais (R$) e proporção sobre a Receita Bruta.',
        margin,
        currentY + 4
      );

      currentY += 8;

      const rev = input.revenue > 0 ? input.revenue : 1;
      const calcPct = (val: number) => `${((Math.abs(val) / rev) * 100).toFixed(2)}%`;
      const calcPP = (diff: number) => `${((diff / rev) * 100).toFixed(2)} p.p.`;

      const tableRows = [
        ['1. Receita Operacional Bruta', formatBRL(legacy.grossRevenue), '100,00%', formatBRL(reform.grossRevenue), '100,00%', 'R$ 0,00', '0,00 p.p.'],
        ['(-) Tributos Brutos sobre Vendas', formatBRL(legacy.totalDebits), calcPct(legacy.totalDebits), formatBRL(reform.totalDebits), calcPct(reform.totalDebits), formatBRL(reform.totalDebits - legacy.totalDebits), calcPP(reform.totalDebits - legacy.totalDebits)],
        ['    · ICMS / IBS Subnacional (Estados & Municípios)', formatBRL(legacy.icmsDebit), calcPct(legacy.icmsDebit), formatBRL(reform.ibsDebit), calcPct(reform.ibsDebit), formatBRL(reform.ibsDebit - legacy.icmsDebit), calcPP(reform.ibsDebit - legacy.icmsDebit)],
        ['    · ISS Municipal (incorporado integralmente ao IBS)', formatBRL(legacy.issDebit), calcPct(legacy.issDebit), 'R$ 0,00', '0,00%', formatBRL(-legacy.issDebit), calcPP(-legacy.issDebit)],
        ['    · PIS & COFINS / CBS Federal (União)', formatBRL(legacy.pisDebit + legacy.cofinsDebit), calcPct(legacy.pisDebit + legacy.cofinsDebit), formatBRL(reform.cbsDebit), calcPct(reform.cbsDebit), formatBRL(reform.cbsDebit - (legacy.pisDebit + legacy.cofinsDebit)), calcPP(reform.cbsDebit - (legacy.pisDebit + legacy.cofinsDebit))],
        ['    · IPI Indústria / Imposto Seletivo Extrafiscal', formatBRL(legacy.ipiDebit), calcPct(legacy.ipiDebit), formatBRL(reform.selectiveDebit), calcPct(reform.selectiveDebit), formatBRL(reform.selectiveDebit - legacy.ipiDebit), calcPP(reform.selectiveDebit - legacy.ipiDebit)],
        ['2. Receita Operacional Líquida', formatBRL(legacy.netRevenue), calcPct(legacy.netRevenue), formatBRL(reform.grossRevenue - reform.totalDebits), calcPct(reform.grossRevenue - reform.totalDebits), formatBRL((reform.grossRevenue - reform.totalDebits) - legacy.netRevenue), calcPP((reform.grossRevenue - reform.totalDebits) - legacy.netRevenue)],
        ['(-) Insumos, Mercadorias, Energia & Bens de Capital', formatBRL(input.cogsAndInputs + input.capitalGoodsAndEnergy + input.servicesHired), calcPct(input.cogsAndInputs + input.capitalGoodsAndEnergy + input.servicesHired), formatBRL(input.cogsAndInputs + input.capitalGoodsAndEnergy + input.servicesHired), calcPct(input.cogsAndInputs + input.capitalGoodsAndEnergy + input.servicesHired), 'R$ 0,00', '0,00 p.p.'],
        ['(+) Créditos Fiscais Recuperados (Não-Cumulatividade Plena)', formatBRL(legacy.totalCredits), calcPct(legacy.totalCredits), formatBRL(reform.totalCredits), calcPct(reform.totalCredits), formatBRL(reform.totalCredits - legacy.totalCredits), calcPP(reform.totalCredits - legacy.totalCredits)],
        ['    ↳ Perda de crédito por compras de fornecedores do Simples', '-', '-', formatBRL(reform.simplesCreditReductionImpact), calcPct(reform.simplesCreditReductionImpact), formatBRL(-reform.simplesCreditReductionImpact), calcPP(-reform.simplesCreditReductionImpact)],
        ['(-) Folha de Pagamento & Encargos Sociais (Sem crédito)', formatBRL(input.payroll), calcPct(input.payroll), formatBRL(input.payroll), calcPct(input.payroll), 'R$ 0,00', '0,00 p.p.'],
        ['(-) Outras Despesas Operacionais e Administrativas', formatBRL(input.otherOperationalExpenses), calcPct(input.otherOperationalExpenses), formatBRL(input.otherOperationalExpenses), calcPct(input.otherOperationalExpenses), 'R$ 0,00', '0,00 p.p.'],
        ['Total de Tributos Líquidos Efetivos Recolhidos', formatBRL(legacy.netTaxesPaid), `${legacy.effectiveTaxBurdenPercent.toFixed(2)}%`, formatBRL(reform.netTaxesPaid), `${reform.effectiveTaxBurdenPercent.toFixed(2)}%`, formatBRL(comparison.taxBurdenDifferenceBrl), `${comparison.taxBurdenDifferencePercentPoints.toFixed(2)} p.p.`],
        ['(=) Resultado Operacional Líquido Final', formatBRL(legacy.operatingResult), calcPct(legacy.operatingResult), formatBRL(reform.operatingResult), calcPct(reform.operatingResult), formatBRL(comparison.operatingResultDifferenceBrl), calcPP(comparison.operatingResultDifferenceBrl)],
      ];

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['Conta da DRE / Rubrica Fiscal', 'Atual (R$)', '% AV', 'Reforma (R$)', '% AV', 'Variação (R$)', 'Var. (p.p.)']],
        body: tableRows,
        theme: 'grid',
        styles: {
          fontSize: 7.2,
          cellPadding: 2,
          textColor: [30, 41, 59],
          lineColor: [226, 232, 240],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'left',
        },
        columnStyles: {
          0: { cellWidth: 62, fontStyle: 'normal' },
          1: { halign: 'right', cellWidth: 22 },
          2: { halign: 'right', cellWidth: 14 },
          3: { halign: 'right', cellWidth: 22 },
          4: { halign: 'right', cellWidth: 14 },
          5: { halign: 'right', cellWidth: 25 },
          6: { halign: 'right', cellWidth: 23 },
        },
        didParseCell: (data) => {
          const rowIdx = data.row.index;
          if (data.section === 'body') {
            if (rowIdx === 0 || rowIdx === 1 || rowIdx === 6 || rowIdx === 12 || rowIdx === 13) {
              data.cell.styles.fontStyle = 'bold';
              if (rowIdx === 12) {
                data.cell.styles.fillColor = [241, 245, 249];
                if (data.column.index === 5 || data.column.index === 6) {
                  data.cell.styles.textColor = comparison.taxBurdenDifferenceBrl > 0 ? [185, 28, 28] : [16, 149, 106];
                }
              } else if (rowIdx === 13) {
                data.cell.styles.fillColor = [238, 242, 255];
                if (data.column.index === 3 || data.column.index === 4) {
                  data.cell.styles.textColor = [67, 56, 202];
                }
              }
            } else if (rowIdx === 9) {
              data.cell.styles.textColor = [217, 119, 6]; // Linha Simples Nacional alerta
            }
          }
        },
      });

      // @ts-ignore
      let dreFinalY = doc.lastAutoTable?.finalY || 180;

      // Bloco Metodológico e Normativo
      currentY = dreFinalY + 8;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, currentY, pageWidth - margin * 2, 45, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text('Fundamentos Contábeis e Legais da Nova DRE (CPC 26 & EC 132/2023)', margin + 4, currentY + 6);

      const notasContabeis = [
        '• Não-cumulatividade Plena (Crédito Financeiro): Fim do conceito restrito de crédito físico do ICMS e PIS/COFINS. Toda e qualquer aquisição necessária à atividade econômica gera crédito de IBS e CBS, inclusive bens de capital, energia, telecomunicações e serviços tomados.',
        '• Princípio do Destino: A arrecadação do IBS pertence integralmente ao Estado e Município do consumidor final da mercadoria ou tomador do serviço, eliminando a guerra fiscal interestadual e a complexidade da substituição tributária (ST).',
        '• Cálculo "Por Fora": O IBS e a CBS não compõem a sua própria base de cálculo nem a base de cálculo um do outro. A alíquota nominal incide diretamente sobre o preço líquido faturado, conferindo transparência absoluta ao cliente.',
        '• Folha de Pagamento: Encargos trabalhistas e salários continuam isentos de crédito de IVA, o que explica a elevação proporcional de carga em empresas intensivas em recursos humanos.',
      ];

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      let notaY = currentY + 12;
      notasContabeis.forEach((nota) => {
        const lines = doc.splitTextToSize(nota, pageWidth - margin * 2 - 8);
        doc.text(lines, margin + 4, notaY);
        notaY += lines.length * 3.5 + 1;
      });

      // ===================================================
      // PÁGINA 3: CRONOGRAMA DE TRANSIÇÃO E PLANO DE AÇÃO
      // ===================================================
      doc.addPage();

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 16, 'F');
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 16, pageWidth, 1, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('TRIBUTABR | Cronograma de Transição 2026–2033 & Plano de Ação', margin, 11);

      currentY = 24;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('Cronograma Evolutivo de Convivência dos Sistemas Fiscais', margin, currentY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        'Projeção ano a ano da extinção progressiva dos tributos legados e entrada em vigor do IVA Dual.',
        margin,
        currentY + 4
      );

      currentY += 8;

      const timelineRows = timeline.map((t) => [
        t.year.toString(),
        t.description,
        t.legacyPISCOFINSStatus,
        t.cbsStatus,
        `${t.legacyICMSISSPercent}%`,
        t.ibsStatus,
        formatBRL(t.effectiveCombinedTaxEstimatedBrl),
      ]);

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['Ano', 'Fase da Transição', 'PIS/COFINS', 'CBS Federal', 'ICMS/ISS', 'IBS Subnac.', 'Carga Estimada']],
        body: timelineRows,
        theme: 'grid',
        styles: {
          fontSize: 7.2,
          cellPadding: 2,
          textColor: [30, 41, 59],
          lineColor: [226, 232, 240],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'left',
        },
        columnStyles: {
          0: { cellWidth: 14, fontStyle: 'bold', halign: 'center' },
          1: { cellWidth: 50 },
          2: { cellWidth: 26, halign: 'center' },
          3: { cellWidth: 26, halign: 'center' },
          4: { cellWidth: 20, halign: 'center' },
          5: { cellWidth: 20, halign: 'center' },
          6: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
        },
      });

      // @ts-ignore
      let timelineFinalY = doc.lastAutoTable?.finalY || 120;
      currentY = timelineFinalY + 8;

      // Matriz de Recomendações Práticas e Próximos Passos
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text('Checklist Executivo & Recomendações Práticas', margin, currentY);
      currentY += 5;

      const recomendacoes = [
        {
          pilar: 'ÁREA COMERCIAL & CONTRATOS:',
          texto: 'Revisar contratos de fornecimento de médio e longo prazo para incluir cláusula de transição tributária automática. Estruturar a nova tabela de preços com base no valor líquido acrescido do IBS/CBS faturado "por fora".',
        },
        {
          pilar: 'COMPRAS & CADEIA DE SUPRIMENTOS:',
          texto: `Mapear todos os fornecedores cadastrados no Simples Nacional (${reformRates.purchasesFromSimplesPercent}% do volume atual). Avaliar a renegociação de preços compensando a perda de crédito fiscal ou a migração para fornecedores do regime normal.`,
        },
        {
          pilar: 'TECNOLOGIA DA INFORMAÇÃO & ERP:',
          texto: 'Adequar os sistemas de gestão fiscal para a convivência simultânea de 5 tributos durante a janela de transição subnacional (2029 a 2032). Integrar as rotinas de faturamento e conciliação bancária à plataforma nacional do Split Payment.',
        },
        {
          pilar: 'TESOURARIA & GESTÃO DE CAIXA:',
          texto: `Simular a necessidade de capital de giro adicional em virtude da retenção imediata de impostos na liquidação (Split Payment), compensando a perda de liquidez do float de 45 dias com linhas de crédito estruturadas.`,
        },
      ];

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, currentY, pageWidth - margin * 2, 60, 1.5, 1.5, 'FD');

      let recY = currentY + 6;
      recomendacoes.forEach((rec) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(37, 99, 235);
        doc.text(rec.pilar, margin + 4, recY);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(71, 85, 105);
        const lines = doc.splitTextToSize(rec.texto, pageWidth - margin * 2 - 8);
        doc.text(lines, margin + 4, recY + 4);
        recY += lines.length * 3.5 + 5;
      });

      // Numeração e Rodapé Uniforme em Todas as Páginas
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(
          'TRIBUTABR · Inteligência Fiscal e Simulador da Reforma Tributária (EC 132/2023 · PLP 68/2024)',
          margin,
          pageHeight - 6
        );
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 18, pageHeight - 6);
      }

      const fileName = `relatorio_executivo_reforma_${(input.companyName || 'empresa').toLowerCase().replace(/\s+/g, '_')}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCopySummary = () => {
    const text = `TRIBUTABR - RELATÓRIO EXECUTIVO DA REFORMA TRIBUTÁRIA
Emenda Constitucional nº 132/2023 | PLP 68/2024

DADOS DA EMPRESA:
• Empresa: ${input.companyName || 'Empresa em Análise'} (${input.stateUF || 'SP'})
• Setor: ${sectorLabel}
• Regime Atual: ${input.taxRegime.toUpperCase()}
• Faturamento Anual: ${formatBRL(input.revenue)}

INDICADORES CONSOLIDADOS:
• Carga Atual: ${formatPercent(legacy.effectiveTaxBurdenPercent)} (${formatBRL(legacy.netTaxesPaid)}/ano)
• Carga Novo Regime (IBS+CBS): ${formatPercent(reform.effectiveTaxBurdenPercent)} (${formatBRL(reform.netTaxesPaid)}/ano)
• Variação Anual de Caixa: ${comparison.taxBurdenDifferenceBrl > 0 ? '+' : ''}${formatBRL(comparison.taxBurdenDifferenceBrl)} (${comparison.taxBurdenDifferencePercentPoints > 0 ? '+' : ''}${formatPercent(comparison.taxBurdenDifferencePercentPoints)} p.p. - ${comparison.cashTaxIncreaseOrSavings})
• Créditos de Entrada Auferidos: ${formatBRL(reform.totalCredits)}/ano
• Reajuste de Preço Necessário: ${formatPercent(comparison.priceAdjustmentRequiredToMaintainProfit)}
• Resultado Operacional Atual: ${formatBRL(legacy.operatingResult)} -> Reforma: ${formatBRL(reform.operatingResult)}

PARECER CONSULTIVO:
1. Diagnóstico de Carga:
${insights.cargaDiagnostico}

2. Estratégia de Precificação & Repasse:
${insights.precificacao}

3. Cadeia de Fornecedores do Simples Nacional:
${insights.fornecedores}

4. Impacto do Split Payment no Caixa:
${insights.split}

Documento emitido em ${new Date().toLocaleString('pt-BR')}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-3xl w-full p-6 space-y-5 max-h-[92vh] overflow-y-auto">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Exportar Relatório Estratégico da Reforma Tributária
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Relatório consultivo multipáginas com parecer executivo, DRE detalhada, impacto no caixa e cronograma 2026–2033
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumo de Identificação */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-slate-900 dark:text-white text-sm block">
              {input.companyName || 'Empresa em Análise'}
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              {sectorLabel} · {input.stateUF || 'SP'} · Regime {input.taxRegime.toUpperCase()}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 block font-mono">Receita Anual</span>
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
              {formatBRL(input.revenue)}
            </span>
          </div>
        </div>

        {/* Seletor Segmentado de Visualização Prévia */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveView('parecer')}
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeView === 'parecer'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            Parecer Consultivo & Diagnóstico
          </button>
          <button
            onClick={() => setActiveView('dre')}
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeView === 'dre'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            Resumo de Indicadores & DRE
          </button>
        </div>

        {/* Conteúdo Dinâmico da Aba Ativa */}
        {activeView === 'parecer' ? (
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1 text-xs">
            
            {/* Bloco 1: Carga */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 space-y-1">
              <div className="flex justify-between items-center font-bold text-slate-900 dark:text-white">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                  1. Diagnóstico de Carga e Causa-Raiz
                </span>
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                  comparison.taxBurdenDifferenceBrl > 0 
                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300' 
                    : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                }`}>
                  {comparison.cashTaxIncreaseOrSavings}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                {insights.cargaDiagnostico}
              </p>
            </div>

            {/* Bloco 2: Precificação */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 space-y-1">
              <div className="flex justify-between items-center font-bold text-slate-900 dark:text-white">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  2. Estratégia de Precificação & Repasse "Por Fora"
                </span>
                <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400">
                  {comparison.priceAdjustmentRequiredToMaintainProfit > 0 ? `+${formatPercent(comparison.priceAdjustmentRequiredToMaintainProfit)}` : '0,00%'}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                {insights.precificacao}
              </p>
            </div>

            {/* Bloco 3: Fornecedores */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 space-y-1">
              <div className="flex justify-between items-center font-bold text-slate-900 dark:text-white">
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-amber-600" />
                  3. Impacto de Fornecedores do Simples Nacional
                </span>
                <span className="text-[11px] font-mono text-amber-600">
                  {reformRates.purchasesFromSimplesPercent}% do volume
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                {insights.fornecedores}
              </p>
            </div>

            {/* Bloco 4: Split Payment */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 space-y-1">
              <div className="flex justify-between items-center font-bold text-slate-900 dark:text-white">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  4. Split Payment & Float de Caixa
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Retenção Imediata
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                {insights.split}
              </p>
            </div>

          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3 text-slate-600 dark:text-slate-300 font-mono">
              <div>
                <span className="text-slate-400 block text-[11px] font-sans">Carga Atual (PIS/COF/ICMS/ISS):</span>
                <strong className="text-slate-900 dark:text-white">{formatPercent(legacy.effectiveTaxBurdenPercent)}</strong> ({formatBRL(legacy.netTaxesPaid)}/ano)
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-sans">Carga Reforma (IBS+CBS):</span>
                <strong className="text-slate-900 dark:text-white">{formatPercent(reform.effectiveTaxBurdenPercent)}</strong> ({formatBRL(reform.netTaxesPaid)}/ano)
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-sans">Créditos de Aquisições:</span>
                <strong className="text-emerald-600 dark:text-emerald-400">{formatBRL(reform.totalCredits)}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-sans">Ajuste de Preço Necessário:</span>
                <strong className={comparison.priceAdjustmentRequiredToMaintainProfit > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                  {formatPercent(comparison.priceAdjustmentRequiredToMaintainProfit)}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-sans">Resultado Operacional Atual:</span>
                <strong className="text-slate-900 dark:text-white">{formatBRL(legacy.operatingResult)}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-sans">Resultado Operacional Reforma:</span>
                <strong className="text-slate-900 dark:text-white">{formatBRL(reform.operatingResult)}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Botão de Destaque - Download PDF Direto */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-sm shadow-md transition-all cursor-pointer"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Gerando Relatório Completo (3 Páginas com DRE, Parecer e Cronograma)...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Baixar Relatório Executivo Completo em PDF (DRE, Parecer & Cronograma)</span>
              </>
            )}
          </button>

          {/* Botões Secundários */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              onClick={handleDownloadCSV}
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Baixar Planilha CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              <span>Imprimir Relatório</span>
            </button>

            <button
              onClick={handleCopySummary}
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600 dark:text-slate-300" />}
              <span>{copied ? 'Parecer Copiado!' : 'Copiar Parecer'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
