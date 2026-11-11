import React, { useState, useEffect } from 'react';
import { 
  CompanyFinancialInput, 
  LegacyTaxRates, 
  ReformTaxRates, 
  TaxRegime, 
  SpecialTreatment 
} from '../types/tax';
import { 
  BRAZILIAN_STATES_LIST, 
  getStateICMS 
} from '../lib/taxCalculations';
import { ChevronDown, ChevronUp, Sliders, DollarSign, Building2, Percent, MapPin, RotateCcw, Sparkles } from 'lucide-react';

const formatNumberWithDots = (val: number): string => {
  if (isNaN(val) || val === 0) return '0';
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(val);
};

interface CurrencyInputFieldProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  helperText: string;
  helperAlert?: boolean;
  placeholder?: string;
}

export const CurrencyInputField: React.FC<CurrencyInputFieldProps> = ({
  label,
  value,
  onChange,
  helperText,
  helperAlert,
  placeholder = '0',
}) => {
  const [textValue, setTextValue] = useState<string>(() => (value > 0 ? formatNumberWithDots(value) : '0'));
  const [isFocused, setIsFocused] = useState<boolean>(false);

  useEffect(() => {
    if (!isFocused) {
      setTextValue(value > 0 ? formatNumberWithDots(value) : (value === 0 ? '0' : ''));
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Remove centavos comuns se colados (ex: ,00 ou .00)
    const cleanRaw = raw.replace(/,00$/, '').replace(/\.00$/, '');
    const digitsOnly = cleanRaw.replace(/\D/g, '');

    if (digitsOnly === '') {
      setTextValue('');
      onChange(0);
      return;
    }

    const num = parseInt(digitsOnly, 10);
    const clampedNum = Math.min(num, 999_999_999_999);
    setTextValue(formatNumberWithDots(clampedNum));
    onChange(clampedNum);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    e.target.select();
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!textValue || textValue.trim() === '') {
      setTextValue('0');
      onChange(0);
    } else {
      const num = parseInt(textValue.replace(/\D/g, ''), 10) || 0;
      setTextValue(formatNumberWithDots(num));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs font-mono font-medium">
          R$
        </div>
        <input
          type="text"
          inputMode="numeric"
          value={textValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2 text-sm font-mono font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 tabular-nums transition-colors"
        />
      </div>
      <span className={`text-[11px] mt-1 block ${helperAlert ? 'text-rose-500 dark:text-rose-400 font-medium' : 'text-slate-400'}`}>
        {helperText}
      </span>
    </div>
  );
};

interface InputPanelProps {
  input: CompanyFinancialInput;
  legacyRates: LegacyTaxRates;
  reformRates: ReformTaxRates;
  onInputChange: (input: CompanyFinancialInput) => void;
  onLegacyRatesChange: (rates: LegacyTaxRates) => void;
  onReformRatesChange: (rates: ReformTaxRates) => void;
}

export const InputPanel: React.FC<InputPanelProps> = ({
  input,
  legacyRates,
  reformRates,
  onInputChange,
  onLegacyRatesChange,
  onReformRatesChange,
}) => {
  const [showAdvancedLegacy, setShowAdvancedLegacy] = useState(false);

  const currentState = getStateICMS(input.stateUF || 'SP');

  const updateNumberField = (field: keyof CompanyFinancialInput, val: number) => {
    onInputChange({
      ...input,
      [field]: Math.max(0, val),
    });
  };

  const handleStateChange = (newUf: string) => {
    const stateInfo = getStateICMS(newUf);
    onInputChange({
      ...input,
      stateUF: newUf,
    });
    // Se o setor utiliza ICMS (comércio, indústria, agro ou se a alíquota atual de ICMS > 0)
    const isPureService = ['servicos_geral', 'servicos_regulamentados', 'servicos_reduzidos'].includes(input.sector);
    if (!isPureService || legacyRates.icmsRate > 0) {
      onLegacyRatesChange({
        ...legacyRates,
        icmsRate: stateInfo.effectiveStandardRate,
      });
    }
  };

  const handleApplyStateICMS = () => {
    onLegacyRatesChange({
      ...legacyRates,
      icmsRate: currentState.effectiveStandardRate,
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-6">
      
      {/* Cabeçalho do Painel & Seletores de Regime e Estado */}
      <div className="pb-4 border-b border-slate-100 dark:border-slate-800 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Parâmetros Financeiros & Fiscais da Empresa
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ajuste os valores para recalcular instantaneamente os créditos e o impacto financeiro da EC 132/2023
            </p>
          </div>

          {/* Regime Tributário Atual */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {(['lucro_real', 'lucro_presumido', 'simples_nacional'] as TaxRegime[]).map((regime) => {
              const isSelected = input.taxRegime === regime;
              const labels: Record<TaxRegime, string> = {
                lucro_real: 'Lucro Real',
                lucro_presumido: 'Lucro Presumido',
                simples_nacional: 'Simples Nacional',
              };

              return (
                <button
                  key={regime}
                  onClick={() => onInputChange({ 
                    ...input, 
                    taxRegime: regime,
                    simplesModel: regime === 'simples_nacional' ? (input.simplesModel || 'por_dentro') : input.simplesModel
                  })}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {labels[regime]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Seletor de Opção do Simples Nacional na Reforma (Por Dentro vs. Híbrido) */}
        {input.taxRegime === 'simples_nacional' && (
          <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                Opção do Simples Nacional na Reforma (EC nº 132/2023 - Art. 146-A):
              </span>
              <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                {(input.simplesModel || 'por_dentro') === 'por_dentro'
                  ? 'Por Dentro: Mantém o DAS unificado, sem créditos nas compras e transferindo crédito reduzido (~4,5%) aos clientes PJ.'
                  : 'Híbrido: Recolhe IBS/CBS por fora (não-cumulativo pleno), transferindo 100% de crédito aos clientes e tomando crédito de insumos.'}
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-800 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => onInputChange({ ...input, simplesModel: 'por_dentro' })}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  (input.simplesModel || 'por_dentro') === 'por_dentro'
                    ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Por Dentro (Padrão)
              </button>
              <button
                type="button"
                onClick={() => onInputChange({ ...input, simplesModel: 'hibrido' })}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  input.simplesModel === 'hibrido'
                    ? 'bg-blue-600 text-white shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Híbrido (IBS/CBS Por Fora)
              </button>
            </div>
          </div>
        )}

        {/* Barra de Localização Fiscal (UF) e Alíquota Estadual */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 sm:px-3 sm:py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              Estado (UF) de Origem:
            </span>
            <div className="relative inline-block">
              <select
                value={input.stateUF || 'SP'}
                onChange={(e) => handleStateChange(e.target.value)}
                className="appearance-none font-semibold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white pl-2.5 pr-8 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
              >
                {BRAZILIAN_STATES_LIST.map((st) => (
                  <option key={st.uf} value={st.uf}>
                    {st.uf} - {st.name} ({st.region})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <span>Alíquota modal vigente:</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                {currentState.effectiveStandardRate.toFixed(1)}%
              </span>
              {currentState.fecopRate && (
                <span className="text-slate-400 text-[10px]">({currentState.standardRate}% + {currentState.fecopRate}% FECOP)</span>
              )}
            </div>

            {currentState.notes && (
              <span className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/50">
                {currentState.notes}
              </span>
            )}
          </div>

          {legacyRates.icmsRate !== currentState.effectiveStandardRate && (
            <button
              onClick={handleApplyStateICMS}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer"
              title="Ajustar taxa de ICMS legada para a alíquota padrão deste estado"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Sincronizar ICMS com {currentState.uf} ({currentState.effectiveStandardRate.toFixed(1)}%)</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid de Inputs Financeiros com Formatação e Digitação Fluida */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <CurrencyInputField
          label="Receita Bruta Anual (R$)"
          value={input.revenue}
          onChange={(val) => updateNumberField('revenue', val)}
          helperText="Base anual para cálculo do débito de IBS e CBS"
          placeholder="10.000.000"
        />

        <CurrencyInputField
          label="Insumos & Mercadorias p/ Revenda (R$)"
          value={input.cogsAndInputs}
          onChange={(val) => updateNumberField('cogsAndInputs', val)}
          helperText="Gera crédito integral no novo regime"
          placeholder="6.000.000"
        />

        <CurrencyInputField
          label="Máquinas, Energia & Aluguéis (R$)"
          value={input.capitalGoodsAndEnergy}
          onChange={(val) => updateNumberField('capitalGoodsAndEnergy', val)}
          helperText="Crédito imediato (100%) no IBS/CBS (fim da restrição do ICMS)"
          placeholder="500.000"
        />

        <CurrencyInputField
          label="Serviços Tomados Tributados (R$)"
          value={input.servicesHired}
          onChange={(val) => updateNumberField('servicesHired', val)}
          helperText="Fretes, TI, contabilidade, publicidade, consultoria"
          placeholder="400.000"
        />

        <CurrencyInputField
          label="Folha de Pagamento + Encargos (R$)"
          value={input.payroll}
          onChange={(val) => updateNumberField('payroll', val)}
          helperText="Atenção: Folha NÃO gera crédito de IBS/CBS"
          helperAlert={true}
          placeholder="1.500.000"
        />

        <CurrencyInputField
          label="Outras Despesas Operacionais (R$)"
          value={input.otherOperationalExpenses}
          onChange={(val) => updateNumberField('otherOperationalExpenses', val)}
          helperText="Despesas gerais, seguros e financeiras"
          placeholder="600.000"
        />
      </div>

      {/* Seção da Reforma Tributária (Parâmetros Regulamentares) */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Configurações da Reforma (IVA Dual: IBS + CBS)
          </h4>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Regulamentação PLP 68/2024
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Alíquota de Referência Padrão com Slider */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Alíquota Padrão de Referência
              </label>
              <span className="text-xs font-bold font-mono text-blue-600 dark:text-blue-400 tabular-nums">
                {reformRates.referenceRate.toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min="24.0"
              max="29.0"
              step="0.1"
              value={reformRates.referenceRate}
              onChange={(e) => {
                const newRef = parseFloat(e.target.value);
                const cbs = Number((newRef * 0.332).toFixed(2));
                const ibs = Number((newRef - cbs).toFixed(2));
                onReformRatesChange({
                  ...reformRates,
                  referenceRate: newRef,
                  cbsShare: cbs,
                  ibsShare: ibs,
                });
              }}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 font-mono">
              <span>CBS: {reformRates.cbsShare}%</span>
              <span>IBS: {reformRates.ibsShare}%</span>
            </div>
          </div>

          {/* Regime Especial / Redução de Alíquota */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tratamento Diferenciado / Benefício
            </label>
            <select
              value={reformRates.specialTreatment}
              onChange={(e) => onReformRatesChange({
                ...reformRates,
                specialTreatment: e.target.value as SpecialTreatment,
              })}
              className="w-full px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="standard">Alíquota Padrão (100% = {reformRates.referenceRate}%)</option>
              <option value="reduced_60">Redução de 60% (Saúde, Educação, Agro = {(reformRates.referenceRate * 0.4).toFixed(1)}%)</option>
              <option value="reduced_30">Redução de 30% (Profissões Regulamentadas = {(reformRates.referenceRate * 0.7).toFixed(1)}%)</option>
              <option value="exempt">Alíquota Zero / Isenção (Cesta Básica Nacional = 0%)</option>
              <option value="specific_regime">Regime Específico (Combustíveis, Financeiro, etc.)</option>
            </select>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Conforme artigos 8º e 9º da EC 132/2023
            </span>
          </div>

          {/* Alíquota da CBS para 2027 (Entrada em Vigor) */}
          <div className="bg-blue-50/60 dark:bg-blue-950/30 p-3.5 rounded-xl border border-blue-200 dark:border-blue-800/60">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-blue-900 dark:text-blue-200">
                Alíquota CBS para 2027 (Vigência)
              </label>
              <span className="text-xs font-extrabold font-mono text-blue-600 dark:text-blue-400 tabular-nums">
                {(reformRates.cbs2027Rate ?? reformRates.cbsShare).toFixed(2)}%
              </span>
            </div>
            <input
              type="range"
              min="5.0"
              max="12.0"
              step="0.1"
              value={reformRates.cbs2027Rate ?? reformRates.cbsShare}
              onChange={(e) => {
                const newCbs2027 = parseFloat(e.target.value) || 8.8;
                onReformRatesChange({
                  ...reformRates,
                  cbs2027Rate: newCbs2027,
                  cbsShare: newCbs2027,
                  referenceRate: Number((newCbs2027 + reformRates.ibsShare).toFixed(2)),
                });
              }}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Atalhos:</span>
              <button
                type="button"
                onClick={() => onReformRatesChange({
                  ...reformRates,
                  cbs2027Rate: 8.8,
                  cbsShare: 8.8,
                  referenceRate: Number((8.8 + reformRates.ibsShare).toFixed(2)),
                })}
                className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-500 cursor-pointer"
              >
                8,8% (Fazenda)
              </button>
              <button
                type="button"
                onClick={() => onReformRatesChange({
                  ...reformRates,
                  cbs2027Rate: 7.6,
                  cbsShare: 7.6,
                  referenceRate: Number((7.6 + reformRates.ibsShare).toFixed(2)),
                })}
                className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-500 cursor-pointer"
              >
                7,6% (Histórico)
              </button>
              <button
                type="button"
                onClick={() => onReformRatesChange({
                  ...reformRates,
                  cbs2027Rate: 8.4,
                  cbsShare: 8.4,
                  referenceRate: Number((8.4 + reformRates.ibsShare).toFixed(2)),
                })}
                className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-500 cursor-pointer"
              >
                8,4% (Senado)
              </button>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 block leading-tight">
              A partir de 2027, PIS/COFINS são extintos e a CBS entra em vigor integralmente
            </span>
          </div>

          {/* Compras do Simples Nacional */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                % Compras de Optantes do Simples
              </label>
              <span className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                {reformRates.purchasesFromSimplesPercent}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={reformRates.purchasesFromSimplesPercent}
              onChange={(e) => onReformRatesChange({
                ...reformRates,
                purchasesFromSimplesPercent: parseInt(e.target.value) || 0,
              })}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Gera crédito proporcional (~4,5%), reduzindo o crédito total
            </span>
          </div>

        </div>
      </div>

      {/* Alíquotas Legadas (Atual) - Expansível */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={() => setShowAdvancedLegacy(!showAdvancedLegacy)}
          className="flex items-center justify-between w-full py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5" />
            Alíquotas do Sistema Atual (ICMS, ISS, PIS, COFINS, IPI)
          </span>
          {showAdvancedLegacy ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showAdvancedLegacy && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-500">ICMS Médio (%)</label>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono font-medium">
                  {currentState.uf}: {currentState.effectiveStandardRate.toFixed(1)}%
                </span>
              </div>
              <input
                type="number"
                step="0.5"
                value={legacyRates.icmsRate}
                onChange={(e) => onLegacyRatesChange({ ...legacyRates, icmsRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">ISS Municipal (%)</label>
              <input
                type="number"
                step="0.5"
                value={legacyRates.issRate}
                onChange={(e) => onLegacyRatesChange({ ...legacyRates, issRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">PIS (%)</label>
              <input
                type="number"
                step="0.05"
                value={legacyRates.pisRate}
                onChange={(e) => onLegacyRatesChange({ ...legacyRates, pisRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">COFINS (%)</label>
              <input
                type="number"
                step="0.1"
                value={legacyRates.cofinsRate}
                onChange={(e) => onLegacyRatesChange({ ...legacyRates, cofinsRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">IPI Indústria (%)</label>
              <input
                type="number"
                step="0.5"
                value={legacyRates.ipiRate}
                onChange={(e) => onLegacyRatesChange({ ...legacyRates, ipiRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
