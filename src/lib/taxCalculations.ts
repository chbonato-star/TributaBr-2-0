import { 
  CompanyFinancialInput, 
  LegacyTaxRates, 
  ReformTaxRates, 
  SimulationResult, 
  YearlyTransitionPoint, 
  SplitPaymentAnalysis,
  EconomicSector,
  StateICMSInfo,
  SimplesComparisonAnalysis,
  SimplesReformModel
} from '../types/tax';

/**
 * Tabela oficial de alíquotas modais internas de ICMS vigentes nos 26 Estados e DF (2024-2026)
 * Inclui adicionais compulsórios para fundos de combate à pobreza (FECOP) quando incidentes na alíquota geral.
 */
export const BRAZILIAN_STATES: Record<string, StateICMSInfo> = {
  AC: { uf: 'AC', name: 'Acre', region: 'Norte', standardRate: 19.0, effectiveStandardRate: 19.0 },
  AL: { uf: 'AL', name: 'Alagoas', region: 'Nordeste', standardRate: 19.0, effectiveStandardRate: 19.0 },
  AP: { uf: 'AP', name: 'Amapá', region: 'Norte', standardRate: 18.0, effectiveStandardRate: 18.0 },
  AM: { uf: 'AM', name: 'Amazonas', region: 'Norte', standardRate: 20.0, effectiveStandardRate: 20.0 },
  BA: { uf: 'BA', name: 'Bahia', region: 'Nordeste', standardRate: 20.5, effectiveStandardRate: 20.5 },
  CE: { uf: 'CE', name: 'Ceará', region: 'Nordeste', standardRate: 20.0, effectiveStandardRate: 20.0 },
  DF: { uf: 'DF', name: 'Distrito Federal', region: 'Centro-Oeste', standardRate: 20.0, effectiveStandardRate: 20.0 },
  ES: { uf: 'ES', name: 'Espírito Santo', region: 'Sudeste', standardRate: 17.0, effectiveStandardRate: 17.0 },
  GO: { uf: 'GO', name: 'Goiás', region: 'Centro-Oeste', standardRate: 19.0, effectiveStandardRate: 19.0 },
  MA: { uf: 'MA', name: 'Maranhão', region: 'Nordeste', standardRate: 22.0, effectiveStandardRate: 22.0, notes: 'Maior alíquota modal do Brasil' },
  MT: { uf: 'MT', name: 'Mato Grosso', region: 'Centro-Oeste', standardRate: 17.0, effectiveStandardRate: 17.0 },
  MS: { uf: 'MS', name: 'Mato Grosso do Sul', region: 'Centro-Oeste', standardRate: 17.0, effectiveStandardRate: 17.0 },
  MG: { uf: 'MG', name: 'Minas Gerais', region: 'Sudeste', standardRate: 18.0, effectiveStandardRate: 18.0 },
  PA: { uf: 'PA', name: 'Pará', region: 'Norte', standardRate: 19.0, effectiveStandardRate: 19.0 },
  PB: { uf: 'PB', name: 'Paraíba', region: 'Nordeste', standardRate: 20.0, effectiveStandardRate: 20.0 },
  PR: { uf: 'PR', name: 'Paraná', region: 'Sul', standardRate: 19.5, effectiveStandardRate: 19.5 },
  PE: { uf: 'PE', name: 'Pernambuco', region: 'Nordeste', standardRate: 20.5, effectiveStandardRate: 20.5 },
  PI: { uf: 'PI', name: 'Piauí', region: 'Nordeste', standardRate: 21.0, effectiveStandardRate: 21.0 },
  RJ: { uf: 'RJ', name: 'Rio de Janeiro', region: 'Sudeste', standardRate: 18.0, fecopRate: 2.0, effectiveStandardRate: 20.0, notes: '18% base + 2% FECOP compulsório' },
  RN: { uf: 'RN', name: 'Rio Grande do Norte', region: 'Nordeste', standardRate: 18.0, effectiveStandardRate: 18.0 },
  RS: { uf: 'RS', name: 'Rio Grande do Sul', region: 'Sul', standardRate: 17.0, effectiveStandardRate: 17.0 },
  RO: { uf: 'RO', name: 'Rondônia', region: 'Norte', standardRate: 19.5, effectiveStandardRate: 19.5 },
  RR: { uf: 'RR', name: 'Roraima', region: 'Norte', standardRate: 20.0, effectiveStandardRate: 20.0 },
  SC: { uf: 'SC', name: 'Santa Catarina', region: 'Sul', standardRate: 17.0, effectiveStandardRate: 17.0 },
  SP: { uf: 'SP', name: 'São Paulo', region: 'Sudeste', standardRate: 18.0, effectiveStandardRate: 18.0 },
  SE: { uf: 'SE', name: 'Sergipe', region: 'Nordeste', standardRate: 19.0, effectiveStandardRate: 19.0 },
  TO: { uf: 'TO', name: 'Tocantins', region: 'Norte', standardRate: 20.0, effectiveStandardRate: 20.0 },
};

export const BRAZILIAN_STATES_LIST: StateICMSInfo[] = Object.values(BRAZILIAN_STATES).sort((a, b) => 
  a.name.localeCompare(b.name, 'pt-BR')
);

export function getStateICMS(uf: string): StateICMSInfo {
  return BRAZILIAN_STATES[uf.toUpperCase()] || BRAZILIAN_STATES['SP'];
}

/**
 * Perfis econômicos pré-configurados baseados em médias de mercado brasileiras
 */
export const SECTOR_PRESETS: Record<EconomicSector, {
  label: string;
  description: string;
  defaultInput: CompanyFinancialInput;
  defaultLegacyRates: LegacyTaxRates;
  defaultReformRates: ReformTaxRates;
}> = {
  comercio_varejo: {
    label: 'Comércio Varejista',
    description: 'Varejo em geral com alto volume de compras de mercadorias e créditos de insumos.',
    defaultInput: {
      companyName: 'Varejo Comercial Ltda.',
      stateUF: 'SP',
      sector: 'comercio_varejo',
      taxRegime: 'lucro_real',
      revenue: 12000000, // R$ 12M / ano
      cogsAndInputs: 7200000, // 60% custo de mercadoria
      capitalGoodsAndEnergy: 600000, // 5% energia, aluguel, equipamentos
      servicesHired: 480000, // 4% fretes e serviços
      payroll: 1800000, // 15% folha
      otherOperationalExpenses: 720000, // 6%
      profitMarginTarget: 10,
    },
    defaultLegacyRates: {
      icmsRate: 18.0,
      issRate: 0.0,
      pisRate: 1.65,
      cofinsRate: 7.6,
      ipiRate: 0.0,
      simplesEffectiveRate: 0,
    },
    defaultReformRates: {
      referenceRate: 26.5,
      cbsShare: 8.8,
      ibsShare: 17.7,
      cbs2027Rate: 8.8,
      specialTreatment: 'standard',
      selectiveTaxRate: 0,
      purchasesFromSimplesPercent: 20,
    },
  },

  comercio_atacado: {
    label: 'Comércio Atacadista / Distribuição',
    description: 'Atacado com forte cadeia de fornecedores e necessidade de transferência de créditos.',
    defaultInput: {
      companyName: 'Atacado & Distribuição S/A',
      stateUF: 'SP',
      sector: 'comercio_atacado',
      taxRegime: 'lucro_real',
      revenue: 35000000, // R$ 35M / ano
      cogsAndInputs: 24500000, // 70% mercadorias
      capitalGoodsAndEnergy: 1750000, // 5% galpão, frotas, energia
      servicesHired: 2100000, // 6% logística e tecnologia
      payroll: 3500000, // 10% folha
      otherOperationalExpenses: 1050000, // 3%
      profitMarginTarget: 6,
    },
    defaultLegacyRates: {
      icmsRate: 18.0,
      issRate: 0.0,
      pisRate: 1.65,
      cofinsRate: 7.6,
      ipiRate: 0.0,
      simplesEffectiveRate: 0,
    },
    defaultReformRates: {
      referenceRate: 26.5,
      cbsShare: 8.8,
      ibsShare: 17.7,
      cbs2027Rate: 8.8,
      specialTreatment: 'standard',
      selectiveTaxRate: 0,
      purchasesFromSimplesPercent: 15,
    },
  },

  servicos_geral: {
    label: 'Serviços em Geral (B2B / B2C)',
    description: 'Empresas de tecnologia, consultoria ou serviços gerais hoje no Lucro Presumido.',
    defaultInput: {
      companyName: 'Tech & Serviços Corporativos',
      stateUF: 'SP',
      sector: 'servicos_geral',
      taxRegime: 'lucro_presumido',
      revenue: 4800000, // R$ 4.8M / ano
      cogsAndInputs: 240000, // 5% insumos diretos
      capitalGoodsAndEnergy: 384000, // 8% servidores, infra, licenças
      servicesHired: 576000, // 12% serviços terceirizados
      payroll: 2160000, // 45% folha de pagamento (sem crédito)
      otherOperationalExpenses: 480000, // 10%
      profitMarginTarget: 20,
    },
    defaultLegacyRates: {
      icmsRate: 0.0,
      issRate: 5.0,
      pisRate: 0.65, // Cumulativo
      cofinsRate: 3.0, // Cumulativo
      ipiRate: 0.0,
      simplesEffectiveRate: 0,
    },
    defaultReformRates: {
      referenceRate: 26.5,
      cbsShare: 8.8,
      ibsShare: 17.7,
      cbs2027Rate: 8.8,
      specialTreatment: 'standard',
      selectiveTaxRate: 0,
      purchasesFromSimplesPercent: 30,
    },
  },

  servicos_regulamentados: {
    label: 'Profissões Regulamentadas (Redução de 30%)',
    description: 'Advocacia, contabilidade, medicina PJ, arquitetura e engenharia (art. 9º da EC 132/2023).',
    defaultInput: {
      companyName: 'Banca de Advocacia & Consultoria',
      stateUF: 'SP',
      sector: 'servicos_regulamentados',
      taxRegime: 'lucro_presumido',
      revenue: 3600000, // R$ 3.6M / ano
      cogsAndInputs: 108000, // 3%
      capitalGoodsAndEnergy: 360000, // 10% aluguel escritório e TI
      servicesHired: 540000, // 15% peritos e parceiros
      payroll: 1620000, // 45% folha e honorários
      otherOperationalExpenses: 288000, // 8%
      profitMarginTarget: 19,
    },
    defaultLegacyRates: {
      icmsRate: 0.0,
      issRate: 5.0,
      pisRate: 0.65,
      cofinsRate: 3.0,
      ipiRate: 0.0,
      simplesEffectiveRate: 0,
    },
    defaultReformRates: {
      referenceRate: 26.5,
      cbsShare: 8.8,
      ibsShare: 17.7,
      cbs2027Rate: 8.8,
      specialTreatment: 'reduced_30', // Alíquota ~18.55%
      selectiveTaxRate: 0,
      purchasesFromSimplesPercent: 25,
    },
  },

  servicos_reduzidos: {
    label: 'Saúde & Educação (Redução de 60%)',
    description: 'Clínicas médicas, hospitais e instituições de ensino com alíquota de 40% da padrão (~10.6%).',
    defaultInput: {
      companyName: 'Centro Médico & Hospitalar Integrado',
      stateUF: 'SP',
      sector: 'servicos_reduzidos',
      taxRegime: 'lucro_real',
      revenue: 18000000, // R$ 18M / ano
      cogsAndInputs: 4500000, // 25% medicamentos e materiais
      capitalGoodsAndEnergy: 1800000, // 10% equipamentos hospitalares e energia
      servicesHired: 2160000, // 12% exames e terceirizados
      payroll: 6300000, // 35% corpo clínico e enfermagem
      otherOperationalExpenses: 1080000, // 6%
      profitMarginTarget: 12,
    },
    defaultLegacyRates: {
      icmsRate: 0.0,
      issRate: 3.5,
      pisRate: 1.65,
      cofinsRate: 7.6,
      ipiRate: 0.0,
      simplesEffectiveRate: 0,
    },
    defaultReformRates: {
      referenceRate: 26.5,
      cbsShare: 8.8,
      ibsShare: 17.7,
      cbs2027Rate: 8.8,
      specialTreatment: 'reduced_60', // 40% da alíquota = ~10.6%
      selectiveTaxRate: 0,
      purchasesFromSimplesPercent: 10,
    },
  },

  industria_transformacao: {
    label: 'Indústria de Transformação',
    description: 'Indústria com incidência de IPI e ICMS que ganha créditos integrais de energia e máquinas.',
    defaultInput: {
      companyName: 'Metalmecânica Industrial S/A',
      stateUF: 'SP',
      sector: 'industria_transformacao',
      taxRegime: 'lucro_real',
      revenue: 28000000, // R$ 28M / ano
      cogsAndInputs: 14000000, // 50% matéria-prima e componentes
      capitalGoodsAndEnergy: 3360000, // 12% energia pesada, maquinário, depreciação
      servicesHired: 1680000, // 6% manutenção, fretes e logística
      payroll: 5600000, // 20% folha fabril
      otherOperationalExpenses: 1120000, // 4%
      profitMarginTarget: 8,
    },
    defaultLegacyRates: {
      icmsRate: 18.0,
      issRate: 0.0,
      pisRate: 1.65,
      cofinsRate: 7.6,
      ipiRate: 8.0,
      simplesEffectiveRate: 0,
    },
    defaultReformRates: {
      referenceRate: 26.5,
      cbsShare: 8.8,
      ibsShare: 17.7,
      cbs2027Rate: 8.8,
      specialTreatment: 'standard',
      selectiveTaxRate: 0,
      purchasesFromSimplesPercent: 15,
    },
  },

  agronegocio: {
    label: 'Agronegócio & Alimentos',
    description: 'Produtores rurais e agroindústria com alíquotas reduzidas (60% de desconto) e insumos.',
    defaultInput: {
      companyName: 'Agropecuária & Grãos do Cerrado',
      stateUF: 'SP',
      sector: 'agronegocio',
      taxRegime: 'lucro_real',
      revenue: 22000000, // R$ 22M / ano
      cogsAndInputs: 11000000, // 50% sementes, fertilizantes, defensivos
      capitalGoodsAndEnergy: 3080000, // 14% tratores, combustível, silos
      servicesHired: 1540000, // 7% colheita, frete e aviação agrícola
      payroll: 3300000, // 15% folha do campo
      otherOperationalExpenses: 880000, // 4%
      profitMarginTarget: 10,
    },
    defaultLegacyRates: {
      icmsRate: 12.0,
      issRate: 0.0,
      pisRate: 1.65,
      cofinsRate: 7.6,
      ipiRate: 0.0,
      simplesEffectiveRate: 0,
    },
    defaultReformRates: {
      referenceRate: 26.5,
      cbsShare: 8.8,
      ibsShare: 17.7,
      cbs2027Rate: 8.8,
      specialTreatment: 'reduced_60', // 40% da alíquota
      selectiveTaxRate: 0,
      purchasesFromSimplesPercent: 10,
    },
  },
};

/**
 * Motor de cálculo da simulação tributária
 */
export function calculateTaxSimulation(
  input: CompanyFinancialInput,
  legacyRates: LegacyTaxRates,
  reformRates: ReformTaxRates
): SimulationResult {
  const revenue = input.revenue;
  const isSimples = input.taxRegime === 'simples_nacional';
  const isLucroReal = input.taxRegime === 'lucro_real';

  // ----------------------------------------------------
  // 1. CÁLCULO SISTEMA LEGADO (ATUAL)
  // ----------------------------------------------------
  let legacyGross = revenue;
  let icmsDebit = 0;
  let issDebit = 0;
  let pisDebit = 0;
  let cofinsDebit = 0;
  let ipiDebit = 0;

  let icmsCredit = 0;
  let pisCredit = 0;
  let cofinsCredit = 0;
  let ipiCredit = 0;

  if (isSimples) {
    const rate = legacyRates.simplesEffectiveRate > 0 ? legacyRates.simplesEffectiveRate : 11.5;
    const dasTotal = revenue * (rate / 100);
    // Distribuição representativa do DAS
    icmsDebit = dasTotal * 0.35;
    issDebit = dasTotal * 0.25;
    pisDebit = dasTotal * 0.10;
    cofinsDebit = dasTotal * 0.20;
    ipiDebit = dasTotal * 0.10;
    // Simples Nacional não toma créditos no modelo padrão
    icmsCredit = 0;
    pisCredit = 0;
    cofinsCredit = 0;
    ipiCredit = 0;
  } else {
    // Débitos sobre faturamento
    icmsDebit = revenue * (legacyRates.icmsRate / 100);
    issDebit = revenue * (legacyRates.issRate / 100);
    pisDebit = revenue * (legacyRates.pisRate / 100);
    cofinsDebit = revenue * (legacyRates.cofinsRate / 100);
    ipiDebit = revenue * (legacyRates.ipiRate / 100);

    // Créditos da entrada
    // No Lucro Real: toma PIS/COFINS (9.25%) sobre insumos e energia, mas quase nada de serviços gerais
    // No Lucro Presumido: regime CUMULATIVO, logo créditos de PIS/COFINS = ZERO
    if (isLucroReal) {
      const creditablePurchasesPISCOFINS = input.cogsAndInputs + (input.capitalGoodsAndEnergy * 0.5);
      pisCredit = creditablePurchasesPISCOFINS * (legacyRates.pisRate / 100);
      cofinsCredit = creditablePurchasesPISCOFINS * (legacyRates.cofinsRate / 100);
    } else {
      pisCredit = 0;
      cofinsCredit = 0;
    }

    // ICMS: crédito sobre mercadorias para revenda e matéria-prima
    if (legacyRates.icmsRate > 0) {
      // Tomada de crédito geralmente na alíquota média de compra (aprox 12% a 18%)
      const icmsAverageInboundRate = Math.min(legacyRates.icmsRate, 14.0) / 100;
      icmsCredit = input.cogsAndInputs * icmsAverageInboundRate;
    }

    // IPI: crédito sobre matéria-prima da indústria
    if (legacyRates.ipiRate > 0) {
      ipiCredit = input.cogsAndInputs * (legacyRates.ipiRate / 100) * 0.7;
    }
  }

  const legacyTotalDebits = icmsDebit + issDebit + pisDebit + cofinsDebit + ipiDebit;
  const legacyTotalCredits = icmsCredit + pisCredit + cofinsCredit + ipiCredit;
  const legacyNetTaxesPaid = Math.max(0, legacyTotalDebits - legacyTotalCredits);
  const legacyEffectiveTaxBurdenPercent = revenue > 0 ? (legacyNetTaxesPaid / revenue) * 100 : 0;
  const legacyNetRevenue = revenue - legacyTotalDebits;
  const legacyTotalPurchasesCostNet = (input.cogsAndInputs + input.capitalGoodsAndEnergy + input.servicesHired) - legacyTotalCredits;
  const legacyOperatingResult = legacyNetRevenue - legacyTotalPurchasesCostNet - input.payroll - input.otherOperationalExpenses;

  // ----------------------------------------------------
  // 2. CÁLCULO SISTEMA REFORMA TRIBUTÁRIA (IBS + CBS + IS)
  // ----------------------------------------------------
  // Alíquota nominal aplicada conforme regime diferenciado
  let appliedRateFactor = 1.0;
  if (reformRates.specialTreatment === 'reduced_60') {
    appliedRateFactor = 0.40; // 60% de desconto
  } else if (reformRates.specialTreatment === 'reduced_30') {
    appliedRateFactor = 0.70; // 30% de desconto
  } else if (reformRates.specialTreatment === 'exempt') {
    appliedRateFactor = 0.0; // Isenção / Alíquota Zero
  } else if (reformRates.specialTreatment === 'specific_regime') {
    appliedRateFactor = 0.80; // Estimativa para regimes específicos
  }

  const appliedReferenceRate = reformRates.referenceRate * appliedRateFactor;
  const appliedCbsRate = reformRates.cbsShare * appliedRateFactor;
  const appliedIbsRate = reformRates.ibsShare * appliedRateFactor;
  const appliedSelectiveRate = reformRates.selectiveTaxRate;

  // No novo sistema, o cálculo é POR FORA.
  // Débito = Receita * Alíquota
  const cbsDebit = revenue * (appliedCbsRate / 100);
  const ibsDebit = revenue * (appliedIbsRate / 100);
  const selectiveDebit = revenue * (appliedSelectiveRate / 100);
  const reformTotalDebits = cbsDebit + ibsDebit + selectiveDebit;

  // Crédito Amplo (Não-cumulatividade plena):
  // Crédito sobre compras de insumos, bens de capital, energia, telecom e serviços tomados.
  // Mas se a compra vem de empresa optante pelo Simples Nacional, o crédito é limitado à alíquota do Simples.
  const totalCreditablePurchases = input.cogsAndInputs + input.capitalGoodsAndEnergy + input.servicesHired;
  const purchasesFromNormalRegime = totalCreditablePurchases * (1 - (reformRates.purchasesFromSimplesPercent / 100));
  const purchasesFromSimples = totalCreditablePurchases * (reformRates.purchasesFromSimplesPercent / 100);

  // Crédito pleno das compras de regime normal (alíquota padrão de referência ~26.5%)
  const standardInboundRate = reformRates.referenceRate / 100;
  const normalPurchasesCredits = purchasesFromNormalRegime * standardInboundRate;

  // Crédito mitigado das compras do Simples Nacional (média ~4.5% de CBS+IBS transferível)
  const simplesTransferableRate = 0.045;
  const simplesPurchasesCredits = purchasesFromSimples * simplesTransferableRate;

  // Impacto da perda de crédito decorrente de compras de fornecedores do Simples
  const theoreticalFullSimplesCredit = purchasesFromSimples * standardInboundRate;
  const simplesCreditGapLoss = Math.max(0, theoreticalFullSimplesCredit - simplesPurchasesCredits);

  const totalCreditsAvailable = normalPurchasesCredits + simplesPurchasesCredits;

  // Separação proporcional entre CBS (Federal ~33%) e IBS (Subnacional ~67%)
  const cbsProportion = reformRates.referenceRate > 0 
    ? (reformRates.cbsShare / reformRates.referenceRate) 
    : 0.332;
  const ibsProportion = reformRates.referenceRate > 0 
    ? (reformRates.ibsShare / reformRates.referenceRate) 
    : 0.668;

  const reformCbsCredit = totalCreditsAvailable * cbsProportion;
  const reformIbsCredit = totalCreditsAvailable * ibsProportion;
  const reformTotalCredits = reformCbsCredit + reformIbsCredit;

  const netCbsPaid = Math.max(0, cbsDebit - reformCbsCredit);
  const netIbsPaid = Math.max(0, ibsDebit - reformIbsCredit);
  const netSelectivePaid = selectiveDebit; // Imposto Seletivo não gera nem toma crédito
  let reformNetTaxesPaid = netCbsPaid + netIbsPaid + netSelectivePaid;
  let reformEffectiveTaxBurdenPercent = revenue > 0 ? (reformNetTaxesPaid / revenue) * 100 : 0;

  // Resultado Operacional na Reforma:
  // Faturamento líquido menos custos de aquisição líquidos de crédito, folha e outras despesas
  let reformNetPurchasesCost = totalCreditablePurchases - reformTotalCredits;
  let reformOperatingResult = (revenue - reformTotalDebits) - reformNetPurchasesCost - input.payroll - input.otherOperationalExpenses;
  let displayedReformDebits = reformTotalDebits;
  let displayedReformCredits = reformTotalCredits;

  // Tratamento específico se a empresa for optante do Simples Nacional
  if (isSimples) {
    const dasRate = legacyRates.simplesEffectiveRate > 0 ? legacyRates.simplesEffectiveRate : 8.5;
    const isHibrido = input.simplesModel === 'hibrido';

    if (!isHibrido) {
      // Simples Por Dentro (Padrão): Paga DAS unificado e não apropria créditos de compras
      const dasTotal = revenue * (dasRate / 100);
      displayedReformDebits = dasTotal;
      displayedReformCredits = 0;
      reformNetTaxesPaid = dasTotal;
      reformEffectiveTaxBurdenPercent = (dasTotal / revenue) * 100;
      reformNetPurchasesCost = totalCreditablePurchases;
      reformOperatingResult = revenue - dasTotal - reformNetPurchasesCost - input.payroll - input.otherOperationalExpenses;
    } else {
      // Simples Híbrido: Recolhe IBS/CBS por fora (não-cumulativo pleno) + fatia de IRPJ/CSLL/CPP no DAS (55%)
      const dasSegregatedDirectTaxes = revenue * ((dasRate * 0.55) / 100);
      displayedReformDebits = reformTotalDebits;
      displayedReformCredits = reformTotalCredits;
      reformNetTaxesPaid = (cbsDebit - reformCbsCredit) + (ibsDebit - reformIbsCredit) + selectiveDebit + dasSegregatedDirectTaxes;
      reformEffectiveTaxBurdenPercent = revenue > 0 ? (reformNetTaxesPaid / revenue) * 100 : 0;
      reformNetPurchasesCost = totalCreditablePurchases - reformTotalCredits;
      reformOperatingResult = (revenue - reformTotalDebits) - reformNetPurchasesCost - input.payroll - input.otherOperationalExpenses - dasSegregatedDirectTaxes;
    }
  }

  // ----------------------------------------------------
  // 3. COMPARATIVO & IMPACTO NO PREÇO
  // ----------------------------------------------------
  const taxBurdenDifferenceBrl = reformNetTaxesPaid - legacyNetTaxesPaid;
  const taxBurdenDifferencePercentPoints = reformEffectiveTaxBurdenPercent - legacyEffectiveTaxBurdenPercent;
  const operatingResultDifferenceBrl = reformOperatingResult - legacyOperatingResult;

  // Variação necessária no preço final de venda para manter exatamente o mesmo resultado operacional
  // Se o imposto subiu R$ 100k, quanto o preço precisa variar considerando a nova alíquota do IVA?
  const priceAdjustmentFactor = 1 - (appliedReferenceRate / 100);
  const additionalRevenueNeeded = priceAdjustmentFactor > 0 ? taxBurdenDifferenceBrl / priceAdjustmentFactor : taxBurdenDifferenceBrl;
  const priceAdjustmentRequiredToMaintainProfit = revenue > 0 ? (additionalRevenueNeeded / revenue) * 100 : 0;

  let cashTaxIncreaseOrSavings: 'Aumento de Carga' | 'Redução de Carga' | 'Neutro' = 'Neutro';
  if (taxBurdenDifferenceBrl > 500) {
    cashTaxIncreaseOrSavings = 'Aumento de Carga';
  } else if (taxBurdenDifferenceBrl < -500) {
    cashTaxIncreaseOrSavings = 'Redução de Carga';
  }

  return {
    legacy: {
      grossRevenue: legacyGross,
      icmsDebit,
      issDebit,
      pisDebit,
      cofinsDebit,
      ipiDebit,
      totalDebits: legacyTotalDebits,
      icmsCredit,
      pisCredit,
      cofinsCredit,
      ipiCredit,
      totalCredits: legacyTotalCredits,
      netTaxesPaid: legacyNetTaxesPaid,
      effectiveTaxBurdenPercent: legacyEffectiveTaxBurdenPercent,
      netRevenue: legacyNetRevenue,
      totalPurchasesCostNet: legacyTotalPurchasesCostNet,
      operatingResult: legacyOperatingResult,
    },
    reform: {
      appliedRatePercent: appliedReferenceRate,
      grossRevenue: revenue,
      cbsDebit: isSimples && input.simplesModel !== 'hibrido' ? displayedReformDebits * 0.33 : cbsDebit,
      ibsDebit: isSimples && input.simplesModel !== 'hibrido' ? displayedReformDebits * 0.67 : ibsDebit,
      selectiveDebit,
      totalDebits: displayedReformDebits,
      creditablePurchasesBase: totalCreditablePurchases,
      cbsCredit: displayedReformCredits > 0 ? reformCbsCredit : 0,
      ibsCredit: displayedReformCredits > 0 ? reformIbsCredit : 0,
      simplesCreditReductionImpact: simplesCreditGapLoss,
      totalCredits: displayedReformCredits,
      netCbsPaid,
      netIbsPaid,
      netSelectivePaid,
      netTaxesPaid: reformNetTaxesPaid,
      effectiveTaxBurdenPercent: reformEffectiveTaxBurdenPercent,
      operatingResult: reformOperatingResult,
    },
    comparison: {
      taxBurdenDifferenceBrl,
      taxBurdenDifferencePercentPoints,
      operatingResultDifferenceBrl,
      priceAdjustmentRequiredToMaintainProfit,
      cashTaxIncreaseOrSavings,
    },
  };
}

/**
 * Simula a evolução da transição ano a ano de 2026 a 2033
 */
export function calculateTransitionTimeline(
  simulation: SimulationResult,
  revenue: number,
  reformRates?: ReformTaxRates
): YearlyTransitionPoint[] {
  const legacyTaxes = simulation.legacy.netTaxesPaid;
  const reformTaxes = simulation.reform.netTaxesPaid;
  const cbs2027 = reformRates?.cbs2027Rate ?? reformRates?.cbsShare ?? 8.8;

  // Em 2027: PIS e COFINS são extintos. ICMS, ISS e IPI permanecem a 100%.
  // A CBS entra em vigor integralmente na alíquota ajustada para 2027.
  const legacyWithoutPisCofins = Math.max(0, 
    (simulation.legacy.icmsDebit + simulation.legacy.issDebit + simulation.legacy.ipiDebit) - 
    (simulation.legacy.icmsCredit + simulation.legacy.ipiCredit)
  );

  const cbsScale = (reformRates?.cbsShare && reformRates.cbsShare > 0) ? (cbs2027 / reformRates.cbsShare) : 1.0;
  const netCbs2027 = Math.max(0, simulation.reform.netCbsPaid * cbsScale);
  const ibsTest2027 = revenue * 0.001; // 0,1% IBS teste
  const selective2027 = simulation.reform.netSelectivePaid;
  const tax2027 = legacyWithoutPisCofins + netCbs2027 + ibsTest2027 + selective2027;

  const points: YearlyTransitionPoint[] = [
    {
      year: 2026,
      description: 'Ano de teste oficial. Alíquotas simbólicas (0,9% CBS e 0,1% IBS), compensáveis com PIS/COFINS.',
      cbsStatus: '0,9% (compensável)',
      ibsStatus: '0,1% (compensável)',
      legacyPISCOFINSStatus: '100% em vigor (compensando 0,9%)',
      legacyICMSISSPercent: 100,
      testCBSRate: 0.9,
      testIBSRate: 0.1,
      effectiveCombinedTaxEstimatedBrl: legacyTaxes,
      effectiveRatePercent: simulation.legacy.effectiveTaxBurdenPercent,
    },
    {
      year: 2027,
      description: `Extinção definitiva de PIS e COFINS. Entrada em vigor integral da CBS (${cbs2027.toFixed(2).replace('.', ',')}%) e Imposto Seletivo. IPI zerado (exceto Zona Franca).`,
      cbsStatus: `${cbs2027.toFixed(2).replace('.', ',')}% (vigência plena)`,
      ibsStatus: '0,1% (continuação do teste)',
      legacyPISCOFINSStatus: 'Extintos definitivamente',
      legacyICMSISSPercent: 100,
      testCBSRate: cbs2027,
      testIBSRate: 0.1,
      effectiveCombinedTaxEstimatedBrl: tax2027,
      effectiveRatePercent: revenue > 0 ? (tax2027 / revenue) * 100 : 0,
    },
    {
      year: 2028,
      description: 'Ano de estabilização da CBS e consolidação do Comitê Gestor do IBS.',
      cbsStatus: `${cbs2027.toFixed(2).replace('.', ',')}% (integral em vigor)`,
      ibsStatus: '0,1% (teste preparatório)',
      legacyPISCOFINSStatus: 'Extintos',
      legacyICMSISSPercent: 100,
      testCBSRate: cbs2027,
      testIBSRate: 0.1,
      effectiveCombinedTaxEstimatedBrl: (legacyWithoutPisCofins * 0.98) + netCbs2027 + ibsTest2027 + selective2027,
      effectiveRatePercent: revenue > 0 ? (((legacyWithoutPisCofins * 0.98) + netCbs2027 + ibsTest2027 + selective2027) / revenue) * 100 : 0,
    },
    {
      year: 2029,
      description: 'Início da transição gradativa do ICMS e ISS: 90% das alíquotas do ICMS/ISS e 10% do IBS.',
      cbsStatus: `${cbs2027.toFixed(2).replace('.', ',')}% (integral)`,
      ibsStatus: '10% da alíquota plena do IBS',
      legacyPISCOFINSStatus: 'Extintos',
      legacyICMSISSPercent: 90,
      testCBSRate: cbs2027,
      testIBSRate: 1.77,
      effectiveCombinedTaxEstimatedBrl: (legacyWithoutPisCofins * 0.90) + netCbs2027 + (simulation.reform.netIbsPaid * 0.10) + selective2027,
      effectiveRatePercent: revenue > 0 ? (((legacyWithoutPisCofins * 0.90) + netCbs2027 + (simulation.reform.netIbsPaid * 0.10) + selective2027) / revenue) * 100 : 0,
    },
    {
      year: 2030,
      description: 'Redução do ICMS/ISS para 80% e expansão do IBS para 20%.',
      cbsStatus: `${cbs2027.toFixed(2).replace('.', ',')}% (integral)`,
      ibsStatus: '20% da alíquota plena do IBS',
      legacyPISCOFINSStatus: 'Extintos',
      legacyICMSISSPercent: 80,
      testCBSRate: cbs2027,
      testIBSRate: 3.54,
      effectiveCombinedTaxEstimatedBrl: (legacyWithoutPisCofins * 0.80) + netCbs2027 + (simulation.reform.netIbsPaid * 0.20) + selective2027,
      effectiveRatePercent: revenue > 0 ? (((legacyWithoutPisCofins * 0.80) + netCbs2027 + (simulation.reform.netIbsPaid * 0.20) + selective2027) / revenue) * 100 : 0,
    },
    {
      year: 2031,
      description: 'Redução do ICMS/ISS para 70% e avanço do IBS para 30%.',
      cbsStatus: `${cbs2027.toFixed(2).replace('.', ',')}% (integral)`,
      ibsStatus: '30% da alíquota plena do IBS',
      legacyPISCOFINSStatus: 'Extintos',
      legacyICMSISSPercent: 70,
      testCBSRate: cbs2027,
      testIBSRate: 5.31,
      effectiveCombinedTaxEstimatedBrl: (legacyWithoutPisCofins * 0.70) + netCbs2027 + (simulation.reform.netIbsPaid * 0.30) + selective2027,
      effectiveRatePercent: revenue > 0 ? (((legacyWithoutPisCofins * 0.70) + netCbs2027 + (simulation.reform.netIbsPaid * 0.30) + selective2027) / revenue) * 100 : 0,
    },
    {
      year: 2032,
      description: 'Último ano da transição: ICMS/ISS em 60% e IBS em 40%.',
      cbsStatus: `${cbs2027.toFixed(2).replace('.', ',')}% (integral)`,
      ibsStatus: '40% da alíquota plena do IBS',
      legacyPISCOFINSStatus: 'Extintos',
      legacyICMSISSPercent: 60,
      testCBSRate: cbs2027,
      testIBSRate: 7.08,
      effectiveCombinedTaxEstimatedBrl: (legacyWithoutPisCofins * 0.60) + netCbs2027 + (simulation.reform.netIbsPaid * 0.40) + selective2027,
      effectiveRatePercent: revenue > 0 ? (((legacyWithoutPisCofins * 0.60) + netCbs2027 + (simulation.reform.netIbsPaid * 0.40) + selective2027) / revenue) * 100 : 0,
    },
    {
      year: 2033,
      description: 'Plena vigência do modelo definitivo da Reforma. Extinção total do ICMS, ISS e do antigo IPI.',
      cbsStatus: `${cbs2027.toFixed(2).replace('.', ',')}% (definitiva)`,
      ibsStatus: '100% integral definitiva',
      legacyPISCOFINSStatus: 'Extintos',
      legacyICMSISSPercent: 0,
      testCBSRate: cbs2027,
      testIBSRate: 17.7,
      effectiveCombinedTaxEstimatedBrl: reformTaxes,
      effectiveRatePercent: simulation.reform.effectiveTaxBurdenPercent,
    },
  ];

  return points;
}

/**
 * Calcula o impacto do Split Payment no capital de giro e fluxo de caixa
 */
export function calculateSplitPaymentImpact(
  simulation: SimulationResult,
  averageReceivingDays: number = 30,
  averageLegacyTaxPaymentDays: number = 45,
  cdiAnnualRate: number = 10.75
): SplitPaymentAnalysis {
  const annualWithheldAtSource = simulation.reform.netTaxesPaid;
  
  // O float legado representa o imposto que ficava na conta da empresa entre a venda e o recolhimento (em média 45 dias)
  // No Split Payment, a retenção é imediata no D+0 ou D+2 da transação eletrônica.
  // Dias de caixa perdidos = 45 dias médios
  const daysOfCashFloatLoss = Math.max(10, averageLegacyTaxPaymentDays - 2);
  
  // Volume médio de caixa retido permanentemente que a empresa deixa de gerir
  const cashFloatLossBrl = (annualWithheldAtSource / 365) * daysOfCashFloatLoss;
  
  // Custo de suprir esse caixa via capital de giro bancário (CDI + spread)
  const annualFinancingCostBrl = cashFloatLossBrl * (cdiAnnualRate / 100);

  return {
    averageSalesDays: averageReceivingDays,
    averageLegacyTaxPaymentDays,
    annualWithheldAtSourceBrl: annualWithheldAtSource,
    cashFloatLossBrl,
    annualFinancingCostBrl,
  };
}

/**
 * Utilitário de formatação em Reais (BRL)
 */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Utilitário de formatação de porcentagens
 */
export function formatPercent(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals).replace('.', ',')}%`;
}

/**
 * Análise comparativa completa: Simples Nacional "Por Dentro" (Padrão) vs. "Híbrido" (IBS/CBS Por Fora)
 * Baseada no Art. 146-A da CF (EC 132/2023) e PLP 68/2024
 */
export function calculateSimplesComparison(
  input: CompanyFinancialInput,
  legacyRates: LegacyTaxRates,
  reformRates: ReformTaxRates,
  b2bSalesPercent: number = 50,
  customDasRate?: number,
  customConsumptionShare?: number
): SimplesComparisonAnalysis {
  const revenue = input.revenue > 0 ? input.revenue : 1;
  const dasEffectiveRate = customDasRate !== undefined 
    ? customDasRate 
    : (legacyRates.simplesEffectiveRate > 0 ? legacyRates.simplesEffectiveRate : 8.5);
  
  // Parcela do DAS correspondente aos tributos sobre consumo (PIS, COFINS, ICMS, ISS)
  // Normalmente ~40% a 48% do DAS dependendo da faixa e anexo
  const dasConsumptionSharePercent = customConsumptionShare !== undefined ? customConsumptionShare : 45;
  const dasDirectTaxesSharePercent = 100 - dasConsumptionSharePercent;

  // 1. Cenário A: Simples Nacional "Por Dentro" (Padrão DAS Unificado)
  const dasTotalPaid = revenue * (dasEffectiveRate / 100);
  const totalPurchases = input.cogsAndInputs + input.capitalGoodsAndEnergy + input.servicesHired;

  // Parcela dos tributos sobre consumo no DAS (ICMS, ISS, PIS, COFINS):
  const porDentroConsumptionTaxesRate = dasEffectiveRate * (dasConsumptionSharePercent / 100);
  const porDentroConsumptionTaxesPaid = revenue * (porDentroConsumptionTaxesRate / 100);

  // Parcela dos tributos diretos e previdenciários no DAS (IRPJ, CSLL, CPP/INSS patronal):
  const porDentroDirectTaxesRate = dasEffectiveRate * (dasDirectTaxesSharePercent / 100);
  const porDentroDirectTaxesPaid = revenue * (porDentroDirectTaxesRate / 100);

  // Decomposição detalhada dos tributos no DAS para exibição na DRE oficial:
  const isService = ['servicos_geral', 'servicos_regulamentados', 'servicos_reduzidos'].includes(input.sector);
  const isIndustry = input.sector === 'industria_transformacao';

  let porDentroIcmsDebit = 0;
  let porDentroIssDebit = 0;
  let porDentroPisCofinsDebit = 0;
  let porDentroIpiDebit = 0;

  if (isService) {
    porDentroIssDebit = porDentroConsumptionTaxesPaid * 0.72;
    porDentroPisCofinsDebit = porDentroConsumptionTaxesPaid * 0.28;
  } else if (isIndustry) {
    porDentroIpiDebit = revenue * (dasEffectiveRate * 0.05 / 100);
    porDentroIcmsDebit = Math.max(0, porDentroConsumptionTaxesPaid - porDentroIpiDebit) * 0.72;
    porDentroPisCofinsDebit = Math.max(0, porDentroConsumptionTaxesPaid - porDentroIpiDebit) * 0.28;
  } else {
    // Comércio
    porDentroIcmsDebit = porDentroConsumptionTaxesPaid * 0.72;
    porDentroPisCofinsDebit = porDentroConsumptionTaxesPaid * 0.28;
  }

  // No Simples Por Dentro, a dedução bruta de vendas é a guia integral do DAS
  const porDentroTotalDebits = dasTotalPaid;
  const porDentroNetRevenue = revenue - porDentroTotalDebits;

  // No Simples tradicional, a empresa não apropria créditos de compras
  const porDentroCreditsAppropriated = 0;
  const porDentroNetPurchasesCost = totalPurchases;
  const porDentroGrossProfit = porDentroNetRevenue - porDentroNetPurchasesCost;

  // Resultado Operacional = Receita Líquida - Compras - Folha - Outras Despesas
  const porDentroOperatingResult = porDentroNetRevenue - totalPurchases - input.payroll - input.otherOperationalExpenses;
  const porDentroNetMarginPercent = revenue > 0 ? (porDentroOperatingResult / revenue) * 100 : 0;
  const porDentroEffectiveTaxBurdenPercent = revenue > 0 ? (dasTotalPaid / revenue) * 100 : 0;
  
  // Crédito transferido para clientes B2B (apenas a parcela de consumo recolhida no DAS)
  const creditPassedToClientsRate = porDentroConsumptionTaxesRate;
  const b2bRevenue = revenue * (b2bSalesPercent / 100);
  const porDentroCreditPassedBrl = b2bRevenue * (creditPassedToClientsRate / 100);
  
  // Desvantagem de crédito do cliente B2B comparado ao que receberia se comprasse de regime normal
  const standardIvaRate = reformRates.referenceRate; // ex: 26.5%
  const normalCreditWouldBe = b2bRevenue * (standardIvaRate / 100);
  const b2bClientDisadvantageBrl = Math.max(0, normalCreditWouldBe - porDentroCreditPassedBrl);

  // 2. Cenário B: Simples Nacional "Híbrido" (IBS e CBS "Por Fora" - Art. 146-A CF)
  // Parcela do DAS mantida (IRPJ, CSLL e CPP/INSS patronal):
  const dasSegregatedRate = dasEffectiveRate * (dasDirectTaxesSharePercent / 100);
  const dasSegregatedPaid = revenue * (dasSegregatedRate / 100);

  // IBS e CBS no regime não-cumulativo geral
  let appliedRateFactor = 1.0;
  if (reformRates.specialTreatment === 'reduced_60') appliedRateFactor = 0.40;
  else if (reformRates.specialTreatment === 'reduced_30') appliedRateFactor = 0.70;

  const appliedIvaRate = standardIvaRate * appliedRateFactor;
  const appliedIbsRate = reformRates.ibsShare * appliedRateFactor;
  const appliedCbsRate = reformRates.cbsShare * appliedRateFactor;

  const hibridoIbsDebit = revenue * (appliedIbsRate / 100);
  const hibridoIssDebit = 0; // Incorporado no IBS
  const hibridoPisCofinsDebit = revenue * (appliedCbsRate / 100);
  const hibridoSelectiveDebit = revenue * (reformRates.selectiveTaxRate / 100);
  const cbsIbsDebits = hibridoIbsDebit + hibridoPisCofinsDebit + hibridoSelectiveDebit;

  const hibridoTotalDebits = cbsIbsDebits + dasSegregatedPaid;
  const hibridoNetRevenue = revenue - hibridoTotalDebits;

  // Crédito pleno sobre compras de insumos, bens de capital, telecom, serviços
  const purchasesFromNormal = totalPurchases * (1 - (reformRates.purchasesFromSimplesPercent / 100));
  const purchasesFromSimples = totalPurchases * (reformRates.purchasesFromSimplesPercent / 100);
  const fullPurchasesCredits = (purchasesFromNormal * (standardIvaRate / 100)) + (purchasesFromSimples * 0.045);
  const netCbsIbsPaid = Math.max(0, cbsIbsDebits - fullPurchasesCredits);

  const hibridoNetPurchasesCost = totalPurchases - fullPurchasesCredits;
  const hibridoGrossProfit = hibridoNetRevenue - hibridoNetPurchasesCost;
  const hibridoTotalTaxesPaid = dasSegregatedPaid + netCbsIbsPaid;
  const hibridoOperatingResult = hibridoNetRevenue - totalPurchases + fullPurchasesCredits - input.payroll - input.otherOperationalExpenses;
  const hibridoNetMarginPercent = revenue > 0 ? (hibridoOperatingResult / revenue) * 100 : 0;
  const hibridoEffectiveTaxBurdenPercent = revenue > 0 ? (hibridoTotalTaxesPaid / revenue) * 100 : 0;

  const hibridoCreditPassedBrl = b2bRevenue * (appliedIvaRate / 100);
  const b2bClientGainBrl = Math.max(0, hibridoCreditPassedBrl - porDentroCreditPassedBrl);

  // Ponto de virada (Breakeven B2B %):
  const directTaxDiff = hibridoTotalTaxesPaid - dasTotalPaid;
  const creditGainPerB2B = (appliedIvaRate - creditPassedToClientsRate) / 100;
  let b2bBreakevenPercent = creditGainPerB2B > 0 ? (directTaxDiff / (revenue * creditGainPerB2B)) * 100 : 50;
  b2bBreakevenPercent = Math.max(5, Math.min(95, Math.round(b2bBreakevenPercent)));

  const isHibridoRecommended = b2bSalesPercent >= b2bBreakevenPercent || hibridoOperatingResult > porDentroOperatingResult;

  let rationale = '';
  if (isHibridoRecommended) {
    rationale = `O modelo HÍBRIDO é mais recomendado: com ${b2bSalesPercent}% de vendas para empresas (B2B), seus clientes corporativos receberão ${formatBRL(b2bClientGainBrl)} a mais em créditos fiscais, eliminando a desvantagem competitiva e o risco de descredenciamento por fornecedores do regime normal.`;
  } else {
    rationale = `O modelo POR DENTRO é mais vantajoso no momento: como a maior parte do faturamento é destinada a consumidores finais (B2C) ou clientes que não tomam crédito de ICMS/IBS, sua empresa economiza ${formatBRL(Math.abs(directTaxDiff))}/ano em tributos totais recolhidos.`;
  }

  return {
    dasEffectiveRate,
    dasConsumptionSharePercent,
    dasDirectTaxesSharePercent,
    b2bSalesPercent,
    porDentro: {
      grossRevenue: revenue,
      consumptionTaxesPaid: porDentroConsumptionTaxesPaid,
      netRevenue: porDentroNetRevenue,
      grossPurchases: totalPurchases,
      creditsAppropriated: porDentroCreditsAppropriated,
      netCostPurchases: porDentroNetPurchasesCost,
      grossProfit: porDentroGrossProfit,
      payroll: input.payroll,
      otherOperationalExpenses: input.otherOperationalExpenses,
      directTaxesPaid: porDentroDirectTaxesPaid,
      totalTaxesPaid: dasTotalPaid,
      effectiveTaxBurdenPercent: porDentroEffectiveTaxBurdenPercent,
      operatingResult: porDentroOperatingResult,
      netMarginPercent: porDentroNetMarginPercent,
      dasTotalPaid,
      creditPassedToClientsRate,
      creditPassedToClientsBrl: porDentroCreditPassedBrl,
      b2bClientDisadvantageBrl,
      icmsDebit: porDentroIcmsDebit,
      issDebit: porDentroIssDebit,
      pisCofinsDebit: porDentroPisCofinsDebit,
      selectiveDebit: porDentroIpiDebit,
      totalDebits: porDentroTotalDebits,
    },
    hibrido: {
      grossRevenue: revenue,
      consumptionTaxesPaid: cbsIbsDebits,
      netRevenue: hibridoNetRevenue,
      grossPurchases: totalPurchases,
      creditsAppropriated: fullPurchasesCredits,
      netCostPurchases: hibridoNetPurchasesCost,
      grossProfit: hibridoGrossProfit,
      payroll: input.payroll,
      otherOperationalExpenses: input.otherOperationalExpenses,
      directTaxesPaid: dasSegregatedPaid,
      totalTaxesPaid: hibridoTotalTaxesPaid,
      effectiveTaxBurdenPercent: hibridoEffectiveTaxBurdenPercent,
      operatingResult: hibridoOperatingResult,
      netMarginPercent: hibridoNetMarginPercent,
      dasSegregatedPaid,
      appliedIvaRate,
      cbsIbsDebits,
      cbsIbsCredits: fullPurchasesCredits,
      netCbsIbsPaid,
      b2bClientGainBrl,
      icmsDebit: hibridoIbsDebit,
      issDebit: hibridoIssDebit,
      pisCofinsDebit: hibridoPisCofinsDebit,
      selectiveDebit: hibridoSelectiveDebit,
      totalDebits: hibridoTotalDebits,
      creditPassedToClientsRate: appliedIvaRate,
      creditPassedToClientsBrl: hibridoCreditPassedBrl,
    },
    comparison: {
      taxDifferenceBrl: directTaxDiff,
      operatingResultDifferenceBrl: hibridoOperatingResult - porDentroOperatingResult,
      b2bBreakevenPercent,
      recommendedModel: isHibridoRecommended ? 'hibrido' : 'por_dentro',
      rationale,
    },
  };
}
