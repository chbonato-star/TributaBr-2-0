export type EconomicSector = 
  | 'comercio_varejo' 
  | 'comercio_atacado' 
  | 'servicos_geral' 
  | 'servicos_regulamentados' 
  | 'servicos_reduzidos' 
  | 'industria_transformacao' 
  | 'agronegocio';

export type TaxRegime = 'lucro_real' | 'lucro_presumido' | 'simples_nacional';

export type SpecialTreatment = 
  | 'standard' 
  | 'reduced_60' 
  | 'reduced_30' 
  | 'exempt' 
  | 'specific_regime';

export interface StateICMSInfo {
  uf: string;
  name: string;
  region: 'Norte' | 'Nordeste' | 'Centro-Oeste' | 'Sudeste' | 'Sul';
  standardRate: number;
  fecopRate?: number;
  effectiveStandardRate: number;
  notes?: string;
}

export type SimplesReformModel = 'por_dentro' | 'hibrido';

export interface CompanyFinancialInput {
  companyName: string;
  stateUF: string; // UF de domicílio fiscal (ex: 'SP', 'RJ', 'MG')
  sector: EconomicSector;
  taxRegime: TaxRegime;
  simplesModel?: SimplesReformModel; // Para optantes do Simples: 'por_dentro' (padrão) ou 'hibrido' (IBS/CBS por fora)
  revenue: number; // Faturamento Bruto Anual
  cogsAndInputs: number; // Insumos / Mercadorias para Revenda / Matéria-prima
  capitalGoodsAndEnergy: number; // Máquinas, Bens de Capital, Energia Elétrica, Aluguéis e Telecom
  servicesHired: number; // Serviços tomados tributados
  payroll: number; // Folha de pagamento e encargos (não gera crédito de IBS/CBS)
  otherOperationalExpenses: number; // Outras despesas administrativas
  profitMarginTarget: number; // % Margem operacional esperada
}

export interface SimplesDREColumn {
  grossRevenue: number;
  consumptionTaxesPaid: number; // Débito de tributos sobre vendas/consumo
  netRevenue: number; // Receita Operacional Líquida (Receita Bruta - Débito Consumo)
  grossPurchases: number; // Total compras (insumos, energia, terceiros)
  creditsAppropriated: number; // Créditos apropriados sobre compras (R$ 0 no Por Dentro vs 100% no Híbrido)
  netCostPurchases: number; // Custo líquido de aquisições (grossPurchases - creditsAppropriated)
  grossProfit: number; // Lucro Bruto Operacional (netRevenue - netCostPurchases)
  payroll: number; // Folha de Pagamento & Encargos
  otherOperationalExpenses: number; // Outras Despesas Operacionais
  directTaxesPaid: number; // IRPJ, CSLL e CPP/INSS patronal no Simples
  totalTaxesPaid: number; // Total efetivo de tributos pagos
  effectiveTaxBurdenPercent: number; // Carga tributária efetiva (% sobre receita)
  operatingResult: number; // Resultado Operacional Líquido Final
  netMarginPercent: number; // Margem Líquida Operacional (%)
  creditPassedToClientsRate: number; // Alíquota de crédito repassada a clientes PJ (%)
  creditPassedToClientsBrl: number; // Volume de crédito gerado para PJ (R$)
}

export interface SimplesComparisonAnalysis {
  dasEffectiveRate: number; // Ex: 8.5%
  dasConsumptionSharePercent: number; // Ex: 45% (parcela ICMS/ISS/PIS/COFINS substituída por IBS/CBS)
  dasDirectTaxesSharePercent: number; // Ex: 55% (IRPJ, CSLL, CPP retidos no DAS)
  b2bSalesPercent: number; // Ex: 50% de vendas para empresas PJ
  
  porDentro: SimplesDREColumn & {
    dasTotalPaid: number;
    b2bClientDisadvantageBrl: number; // Perda de crédito dos clientes PJ vs IVA normal
  };
  
  hibrido: SimplesDREColumn & {
    dasSegregatedPaid: number; // Apenas IRPJ, CSLL e CPP mantidos no Simples
    appliedIvaRate: number; // Ex: 26.5%
    cbsIbsDebits: number;
    cbsIbsCredits: number;
    netCbsIbsPaid: number;
    b2bClientGainBrl: number; // Ganho de crédito transferido vs Por Dentro
  };
  
  comparison: {
    taxDifferenceBrl: number; // hibrido - porDentro
    operatingResultDifferenceBrl: number; // hibrido - porDentro
    b2bBreakevenPercent: number; // % de vendas B2B onde o modelo Híbrido se torna mais vantajoso comercialmente
    recommendedModel: 'por_dentro' | 'hibrido';
    rationale: string;
  };
}

export interface LegacyTaxRates {
  icmsRate: number; // Ex: 18%
  issRate: number; // Ex: 5%
  pisRate: number; // Ex: 1.65% (Real) ou 0.65% (Presumido)
  cofinsRate: number; // Ex: 7.6% (Real) ou 3.0% (Presumido)
  ipiRate: number; // Ex: 10%
  simplesEffectiveRate: number; // Para quem é Simples Nacional
}

export interface ReformTaxRates {
  referenceRate: number; // Alíquota padrão estimada (ex: 26.5%)
  cbsShare: number; // Parcela Federal (ex: 8.8%)
  ibsShare: number; // Parcela Estados/Municípios (ex: 17.7%)
  cbs2027Rate: number; // Alíquota específica da CBS a partir de 2027 (default 8.8%)
  specialTreatment: SpecialTreatment;
  selectiveTaxRate: number; // Imposto Seletivo (0% a 25%)
  purchasesFromSimplesPercent: number; // % das compras vindas do Simples Nacional
}

export interface LegacyDRE {
  grossRevenue: number;
  icmsDebit: number;
  issDebit: number;
  pisDebit: number;
  cofinsDebit: number;
  ipiDebit: number;
  totalDebits: number;
  
  icmsCredit: number;
  pisCredit: number;
  cofinsCredit: number;
  ipiCredit: number;
  totalCredits: number;
  
  netTaxesPaid: number;
  effectiveTaxBurdenPercent: number;
  netRevenue: number;
  totalPurchasesCostNet: number;
  operatingResult: number;
}

export interface ReformDRE {
  appliedRatePercent: number;
  grossRevenue: number;
  cbsDebit: number;
  ibsDebit: number;
  selectiveDebit: number;
  totalDebits: number;
  
  creditablePurchasesBase: number;
  cbsCredit: number;
  ibsCredit: number;
  simplesCreditReductionImpact: number;
  totalCredits: number;
  
  netCbsPaid: number;
  netIbsPaid: number;
  netSelectivePaid: number;
  netTaxesPaid: number;
  effectiveTaxBurdenPercent: number;
  operatingResult: number;
}

export interface SimulationResult {
  legacy: LegacyDRE;
  reform: ReformDRE;
  comparison: {
    taxBurdenDifferenceBrl: number; // reform.netTaxesPaid - legacy.netTaxesPaid
    taxBurdenDifferencePercentPoints: number; // reform % - legacy %
    operatingResultDifferenceBrl: number;
    priceAdjustmentRequiredToMaintainProfit: number; // % variação necessária no preço
    cashTaxIncreaseOrSavings: 'Aumento de Carga' | 'Redução de Carga' | 'Neutro';
  };
}

export interface YearlyTransitionPoint {
  year: number;
  description: string;
  cbsStatus: string;
  ibsStatus: string;
  legacyPISCOFINSStatus: string;
  legacyICMSISSPercent: number; // 2026: 100%, 2027: 100%, 2028: 100%, 2029: 90%, 2030: 80%, 2031: 70%, 2032: 60%, 2033: 0%
  testCBSRate: number; // 2026: 0.9%
  testIBSRate: number; // 2026: 0.1%
  effectiveCombinedTaxEstimatedBrl: number;
  effectiveRatePercent: number;
}

export interface SplitPaymentAnalysis {
  averageSalesDays: number; // Prazo médio de recebimento de clientes
  averageLegacyTaxPaymentDays: number; // Prazo médio do recolhimento antigo (d+40 a d+50)
  annualWithheldAtSourceBrl: number; // Volume anual retido no ato da liquidação
  cashFloatLossBrl: number; // Perda média diária/mensal de caixa disponível (float)
  annualFinancingCostBrl: number; // Custo estimado de CDI/capital de giro para cobrir o float (ex: 11% a.a.)
}
