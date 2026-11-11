import React, { useState } from 'react';
import { SimulationResult, CompanyFinancialInput, ReformTaxRates } from '../types/tax';
import { formatBRL, formatPercent, SECTOR_PRESETS } from '../lib/taxCalculations';
import { X, Printer, FileSpreadsheet, Copy, Check, Download, FileText, Loader2 } from 'lucide-react';
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

  if (!isOpen) return null;

  const { legacy, reform, comparison } = simulation;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    const rev = input.revenue > 0 ? input.revenue : 1;
    const calcPct = (val: number) => `${((Math.abs(val) / rev) * 100).toFixed(2)}%`;
    const calcPP = (diff: number) => `${((diff / rev) * 100).toFixed(2)} p.p.`;

    const rows = [
      ['RELATÓRIO EXECUTIVO - TRIBUTABR - SIMULAÇÃO DA REFORMA TRIBUTÁRIA'],
      ['Empresa', input.companyName],
      ['Estado (UF)', input.stateUF || 'SP'],
      ['Setor', SECTOR_PRESETS[input.sector]?.label || input.sector],
      ['Regime Atual', input.taxRegime.toUpperCase()],
      ['Data da Simulação', new Date().toLocaleDateString('pt-BR')],
      [''],
      ['RUBRICA', 'ATUAL (R$)', 'ATUAL (% AV)', 'REFORMA (R$)', 'REFORMA (% AV)', 'VARIAÇÃO (R$)', 'VARIAÇÃO (p.p.)'],
      ['Receita Bruta', legacy.grossRevenue, '100,00%', reform.grossRevenue, '100,00%', 0, '0,00 p.p.'],
      ['Débitos sobre Vendas', legacy.totalDebits, calcPct(legacy.totalDebits), reform.totalDebits, calcPct(reform.totalDebits), reform.totalDebits - legacy.totalDebits, calcPP(reform.totalDebits - legacy.totalDebits)],
      ['  - ICMS / IBS', legacy.icmsDebit, calcPct(legacy.icmsDebit), reform.ibsDebit, calcPct(reform.ibsDebit), reform.ibsDebit - legacy.icmsDebit, calcPP(reform.ibsDebit - legacy.icmsDebit)],
      ['  - ISS', legacy.issDebit, calcPct(legacy.issDebit), 0, '0,00%', -legacy.issDebit, calcPP(-legacy.issDebit)],
      ['  - PIS/COFINS / CBS', legacy.pisDebit + legacy.cofinsDebit, calcPct(legacy.pisDebit + legacy.cofinsDebit), reform.cbsDebit, calcPct(reform.cbsDebit), reform.cbsDebit - (legacy.pisDebit + legacy.cofinsDebit), calcPP(reform.cbsDebit - (legacy.pisDebit + legacy.cofinsDebit))],
      ['  - IPI / Imposto Seletivo', legacy.ipiDebit, calcPct(legacy.ipiDebit), reform.selectiveDebit, calcPct(reform.selectiveDebit), reform.selectiveDebit - legacy.ipiDebit, calcPP(reform.selectiveDebit - legacy.ipiDebit)],
      ['Receita Líquida', legacy.netRevenue, calcPct(legacy.netRevenue), reform.grossRevenue - reform.totalDebits, calcPct(reform.grossRevenue - reform.totalDebits), (reform.grossRevenue - reform.totalDebits) - legacy.netRevenue, calcPP((reform.grossRevenue - reform.totalDebits) - legacy.netRevenue)],
      ['Insumos e Compras', input.cogsAndInputs + input.capitalGoodsAndEnergy + input.servicesHired, calcPct(input.cogsAndInputs + input.capitalGoodsAndEnergy + input.servicesHired), input.cogsAndInputs + input.capitalGoodsAndEnergy + input.servicesHired, calcPct(input.cogsAndInputs + input.capitalGoodsAndEnergy + input.servicesHired), 0, '0,00 p.p.'],
      ['Créditos Fiscais Apropriados', legacy.totalCredits, calcPct(legacy.totalCredits), reform.totalCredits, calcPct(reform.totalCredits), reform.totalCredits - legacy.totalCredits, calcPP(reform.totalCredits - legacy.totalCredits)],
      ['Folha de Pagamento', input.payroll, calcPct(input.payroll), input.payroll, calcPct(input.payroll), 0, '0,00 p.p.'],
      ['Outras Despesas', input.otherOperationalExpenses, calcPct(input.otherOperationalExpenses), input.otherOperationalExpenses, calcPct(input.otherOperationalExpenses), 0, '0,00 p.p.'],
      ['Tributos Líquidos Recolhidos', legacy.netTaxesPaid, `${legacy.effectiveTaxBurdenPercent.toFixed(2)}%`, reform.netTaxesPaid, `${reform.effectiveTaxBurdenPercent.toFixed(2)}%`, comparison.taxBurdenDifferenceBrl, `${comparison.taxBurdenDifferencePercentPoints.toFixed(2)} p.p.`],
      ['Resultado Operacional Final', legacy.operatingResult, calcPct(legacy.operatingResult), reform.operatingResult, calcPct(reform.operatingResult), comparison.operatingResultDifferenceBrl, calcPP(comparison.operatingResultDifferenceBrl)],
      ['Ajuste de Preço Necessário', '', '', '', '', '', `${comparison.priceAdjustmentRequiredToMaintainProfit.toFixed(2)}%`],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(';')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `simulacao_reforma_tributaria_${input.companyName.toLowerCase().replace(/\s+/g, '_')}.csv`);
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

      // 1. Header Banner
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pageWidth, 24, 'F');

      // Accent border
      doc.setFillColor(37, 99, 235); // blue-600
      doc.rect(0, 24, pageWidth, 1.5, 'F');

      // Header Text
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('TRIBUTABR | Relatório de Impacto da Reforma Tributária', margin, 11);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(191, 219, 254);
      doc.text('Simulador Estratégico da EC nº 132/2023, PLP 68/2024 e PLP 108/2024', margin, 17.5);

      // 2. Identification Info Box
      let currentY = 31;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, currentY, pageWidth - margin * 2, 24, 2, 2, 'FD');

      const sectorLabel = SECTOR_PRESETS[input.sector]?.label || input.sector;
      const regimeLabels: Record<string, string> = {
        lucro_real: 'Lucro Real',
        lucro_presumido: 'Lucro Presumido',
        simples_nacional: 'Simples Nacional',
      };
      const regimeLabel = regimeLabels[input.taxRegime] || input.taxRegime;

      // Line 1 of metadata
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('EMPRESA:', margin + 4, currentY + 5.5);
      doc.text('ESTADO (UF):', margin + 75, currentY + 5.5);
      doc.text('DATA DE EMISSÃO:', margin + 125, currentY + 5.5);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(input.companyName || 'Empresa em Análise', margin + 4, currentY + 10.5);
      doc.text(`${input.stateUF || 'SP'} (ICMS Modal)`, margin + 75, currentY + 10.5);
      doc.text(new Date().toLocaleDateString('pt-BR'), margin + 125, currentY + 10.5);

      // Line 2 of metadata
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

      currentY += 30;

      // 3. Key Metrics (KPIs Cards)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('Indicadores-Chave de Desempenho Tributário', margin, currentY);
      currentY += 4;

      const cardWidth = (pageWidth - margin * 2 - 9) / 4;
      const cardHeight = 22;

      const kpis = [
        {
          title: 'CARGA ATUAL (PIS/COF/ICMS/ISS)',
          value: formatPercent(legacy.effectiveTaxBurdenPercent),
          sub: formatBRL(legacy.netTaxesPaid) + '/ano',
          color: [71, 85, 105],
        },
        {
          title: 'CARGA NOVO REGIME (IBS+CBS)',
          value: formatPercent(reform.effectiveTaxBurdenPercent),
          sub: formatBRL(reform.netTaxesPaid) + '/ano',
          color: [37, 99, 235],
        },
        {
          title: 'VARIAÇÃO LÍQUIDA ANUAL',
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

        // Colored top strip
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

      // 4. DRE Comparative Table
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('Demonstração do Resultado do Exercício (DRE) Comparativa', margin, currentY);
      currentY += 3;

      const rev = input.revenue > 0 ? input.revenue : 1;
      const calcPct = (val: number) => `${((Math.abs(val) / rev) * 100).toFixed(2)}%`;
      const calcPP = (diff: number) => `${((diff / rev) * 100).toFixed(2)} p.p.`;

      const tableRows = [
        ['Receita Operacional Bruta', formatBRL(legacy.grossRevenue), '100,00%', formatBRL(reform.grossRevenue), '100,00%', 'R$ 0,00', '0,00 p.p.'],
        ['(-) Débitos sobre Vendas / Faturamento', formatBRL(legacy.totalDebits), calcPct(legacy.totalDebits), formatBRL(reform.totalDebits), calcPct(reform.totalDebits), formatBRL(reform.totalDebits - legacy.totalDebits), calcPP(reform.totalDebits - legacy.totalDebits)],
        ['    - ICMS Estadual / IBS Subnacional', formatBRL(legacy.icmsDebit), calcPct(legacy.icmsDebit), formatBRL(reform.ibsDebit), calcPct(reform.ibsDebit), formatBRL(reform.ibsDebit - legacy.icmsDebit), calcPP(reform.ibsDebit - legacy.icmsDebit)],
        ['    - ISS Municipal (extinto na reforma)', formatBRL(legacy.issDebit), calcPct(legacy.issDebit), 'R$ 0,00', '0,00%', formatBRL(-legacy.issDebit), calcPP(-legacy.issDebit)],
        ['    - PIS & COFINS / CBS Federal', formatBRL(legacy.pisDebit + legacy.cofinsDebit), calcPct(legacy.pisDebit + legacy.cofinsDebit), formatBRL(reform.cbsDebit), calcPct(reform.cbsDebit), formatBRL(reform.cbsDebit - (legacy.pisDebit + legacy.cofinsDebit)), calcPP(reform.cbsDebit - (legacy.pisDebit + legacy.cofinsDebit))],
        ['    - IPI Indústria / Imposto Seletivo (IS)', formatBRL(legacy.ipiDebit), calcPct(legacy.ipiDebit), formatBRL(reform.selectiveDebit), calcPct(reform.selectiveDebit), formatBRL(reform.selectiveDebit - legacy.ipiDebit), calcPP(reform.selectiveDebit - legacy.ipiDebit)],
        ['(=) Receita Operacional Líquida', formatBRL(legacy.netRevenue), calcPct(legacy.netRevenue), formatBRL(reform.grossRevenue - reform.totalDebits), calcPct(reform.grossRevenue - reform.totalDebits), formatBRL((reform.grossRevenue - reform.totalDebits) - legacy.netRevenue), calcPP((reform.grossRevenue - reform.totalDebits) - legacy.netRevenue)],
        ['(-) Insumos, Mercadorias e Bens de Capital', formatBRL(input.cogsAndInputs + input.capitalGoodsAndEnergy + input.servicesHired), calcPct(input.cogsAndInputs + input.capitalGoodsAndEnergy + input.servicesHired), formatBRL(input.cogsAndInputs + input.capitalGoodsAndEnergy + input.servicesHired), calcPct(input.cogsAndInputs + input.capitalGoodsAndEnergy + input.servicesHired), 'R$ 0,00', '0,00 p.p.'],
        ['(+) Créditos Tributários Recuperados', formatBRL(legacy.totalCredits), calcPct(legacy.totalCredits), formatBRL(reform.totalCredits), calcPct(reform.totalCredits), formatBRL(reform.totalCredits - legacy.totalCredits), calcPP(reform.totalCredits - legacy.totalCredits)],
        ['(-) Folha de Pagamento & Encargos', formatBRL(input.payroll), calcPct(input.payroll), formatBRL(input.payroll), calcPct(input.payroll), 'R$ 0,00', '0,00 p.p.'],
        ['(-) Outras Despesas Operacionais', formatBRL(input.otherOperationalExpenses), calcPct(input.otherOperationalExpenses), formatBRL(input.otherOperationalExpenses), calcPct(input.otherOperationalExpenses), 'R$ 0,00', '0,00 p.p.'],
        ['(=) Carga Tributária Líquida Recolhida', formatBRL(legacy.netTaxesPaid), `${legacy.effectiveTaxBurdenPercent.toFixed(2)}%`, formatBRL(reform.netTaxesPaid), `${reform.effectiveTaxBurdenPercent.toFixed(2)}%`, formatBRL(comparison.taxBurdenDifferenceBrl), `${comparison.taxBurdenDifferencePercentPoints.toFixed(2)} p.p.`],
        ['(=) Resultado Operacional Final', formatBRL(legacy.operatingResult), calcPct(legacy.operatingResult), formatBRL(reform.operatingResult), calcPct(reform.operatingResult), formatBRL(comparison.operatingResultDifferenceBrl), calcPP(comparison.operatingResultDifferenceBrl)],
      ];

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['Rubrica / Linha da DRE', 'Atual (R$)', '% AV', 'Reforma (R$)', '% AV', 'Variação (R$)', 'Var. (p.p.)']],
        body: tableRows,
        theme: 'grid',
        styles: {
          fontSize: 7.2,
          cellPadding: 1.8,
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
          0: { cellWidth: 58, fontStyle: 'normal' },
          1: { halign: 'right', cellWidth: 23 },
          2: { halign: 'right', cellWidth: 14 },
          3: { halign: 'right', cellWidth: 23 },
          4: { halign: 'right', cellWidth: 14 },
          5: { halign: 'right', cellWidth: 26 },
          6: { halign: 'right', cellWidth: 24 },
        },
        didParseCell: (data) => {
          const rowIdx = data.row.index;
          if (data.section === 'body') {
            if (rowIdx === 0 || rowIdx === 1 || rowIdx === 6 || rowIdx === 11 || rowIdx === 12) {
              data.cell.styles.fontStyle = 'bold';
              if (rowIdx === 11) {
                data.cell.styles.fillColor = [241, 245, 249];
                if (data.column.index === 5 || data.column.index === 6) {
                  data.cell.styles.textColor = comparison.taxBurdenDifferenceBrl > 0 ? [185, 28, 28] : [16, 149, 106];
                }
              } else if (rowIdx === 12) {
                data.cell.styles.fillColor = [238, 242, 255];
                if (data.column.index === 3) {
                  data.cell.styles.textColor = [67, 56, 202];
                }
              }
            }
          }
        },
      });

      // 5. Notes & Legal Basis Footer on same page
      // @ts-ignore
      const finalY = doc.lastAutoTable?.finalY || 240;
      
      if (finalY < pageHeight - 25) {
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(margin, finalY + 3, pageWidth - margin * 2, 14, 1.5, 1.5, 'FD');

        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(
          'Base Normativa: Emenda Constitucional nº 132/2023, Projeto de Lei Complementar PLP 68/2024 e PLP 108/2024.',
          margin + 3,
          finalY + 7.5
        );
        doc.text(
          `Parâmetros adotados: CBS 2027 (${reformRates.cbs2027Rate.toFixed(1)}%), IBS (${reformRates.ibsShare.toFixed(1)}%), Alíquota Padrão (${reformRates.referenceRate.toFixed(1)}%), Cálculo não-cumulativo "por fora".`,
          margin + 3,
          finalY + 12
        );
      }

      // Bottom page numbering
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text('TributaBR - Inteligência Fiscal & Simulação de Reforma', margin, pageHeight - 6);
      doc.text(`Documento emitido em ${new Date().toLocaleString('pt-BR')}`, pageWidth - margin - 58, pageHeight - 6);

      const fileName = `relatorio_reforma_tributaria_${(input.companyName || 'empresa').toLowerCase().replace(/\s+/g, '_')}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCopySummary = () => {
    const text = `TributaBR - Resumo Executivo da Reforma Tributária
Empresa: ${input.companyName} (${input.taxRegime.toUpperCase()} - UF: ${input.stateUF || 'SP'})
Receita Anual: ${formatBRL(input.revenue)}

Carga Tributária Atual: ${formatPercent(legacy.effectiveTaxBurdenPercent)} (${formatBRL(legacy.netTaxesPaid)}/ano)
Carga Tributária Reforma (IBS+CBS): ${formatPercent(reform.effectiveTaxBurdenPercent)} (${formatBRL(reform.netTaxesPaid)}/ano)
Impacto Anual: ${comparison.taxBurdenDifferenceBrl > 0 ? '+' : ''}${formatBRL(comparison.taxBurdenDifferenceBrl)} (${comparison.taxBurdenDifferencePercentPoints > 0 ? '+' : ''}${formatPercent(comparison.taxBurdenDifferencePercentPoints)} p.p.)
Créditos Recuperados: ${formatBRL(reform.totalCredits)}/ano
Ajuste de Preço Necessário p/ Manter Lucro: ${formatPercent(comparison.priceAdjustmentRequiredToMaintainProfit)}
Resultado Operacional Atual: ${formatBRL(legacy.operatingResult)} -> Reforma: ${formatBRL(reform.operatingResult)}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Exportar Relatório Gerencial da Reforma
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gere documentos executivos prontos para compartilhamento com diretoria e comitê fiscal
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumo do Relatório */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
          <div className="flex justify-between items-center font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-700">
            <span>{input.companyName} <span className="text-slate-400 font-normal">({input.stateUF || 'SP'})</span></span>
            <span className="font-mono text-blue-600 dark:text-blue-400">{formatBRL(input.revenue)}/ano</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-slate-600 dark:text-slate-300 font-mono">
            <div>
              <span className="text-slate-400 block text-[11px] font-sans">Carga Atual:</span>
              <strong className="text-slate-900 dark:text-white">{formatPercent(legacy.effectiveTaxBurdenPercent)}</strong> ({formatBRL(legacy.netTaxesPaid)})
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] font-sans">Carga Reforma (IBS+CBS):</span>
              <strong className="text-slate-900 dark:text-white">{formatPercent(reform.effectiveTaxBurdenPercent)}</strong> ({formatBRL(reform.netTaxesPaid)})
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] font-sans">Créditos Tributários Entrada:</span>
              <strong className="text-emerald-600 dark:text-emerald-400">{formatBRL(reform.totalCredits)}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] font-sans">Ajuste de Preço Necessário:</span>
              <strong className={comparison.priceAdjustmentRequiredToMaintainProfit > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                {formatPercent(comparison.priceAdjustmentRequiredToMaintainProfit)}
              </strong>
            </div>
          </div>
        </div>

        {/* Ações de Exportação */}
        <div className="space-y-3">
          {/* Botão de Destaque - Download PDF Direto */}
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Gerando Relatório PDF Estruturado...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Baixar Relatório Executivo em PDF (Métricas + DRE)</span>
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
              <span>Imprimir / Navegador</span>
            </button>

            <button
              onClick={handleCopySummary}
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600 dark:text-slate-300" />}
              <span>{copied ? 'Copiado!' : 'Copiar Resumo'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
