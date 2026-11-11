import React from 'react';
import { EconomicSector } from '../types/tax';
import { SECTOR_PRESETS } from '../lib/taxCalculations';
import { ShoppingBag, Truck, Briefcase, Scale, Stethoscope, Factory, Wheat } from 'lucide-react';

interface PresetSelectorProps {
  selectedSector: EconomicSector;
  onSelectSector: (sector: EconomicSector) => void;
}

const sectorIcons: Record<EconomicSector, React.ReactNode> = {
  comercio_varejo: <ShoppingBag className="w-4 h-4" />,
  comercio_atacado: <Truck className="w-4 h-4" />,
  servicos_geral: <Briefcase className="w-4 h-4" />,
  servicos_regulamentados: <Scale className="w-4 h-4" />,
  servicos_reduzidos: <Stethoscope className="w-4 h-4" />,
  industria_transformacao: <Factory className="w-4 h-4" />,
  agronegocio: <Wheat className="w-4 h-4" />,
};

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  selectedSector,
  onSelectSector,
}) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Selecione o Ramo de Atividade ou Cenário
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Carregue automaticamente estruturas de custos e alíquotas reais baseadas na média setorial brasileira
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
        {(Object.keys(SECTOR_PRESETS) as EconomicSector[]).map((sectorKey) => {
          const preset = SECTOR_PRESETS[sectorKey];
          const isSelected = selectedSector === sectorKey;

          return (
            <button
              key={sectorKey}
              onClick={() => onSelectSector(sectorKey)}
              className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? 'border-blue-600 dark:border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 shadow-sm ring-1 ring-blue-600/20 dark:ring-blue-500/30'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  {sectorIcons[sectorKey]}
                </span>
                <span className={`text-xs font-bold leading-tight ${isSelected ? 'text-blue-900 dark:text-blue-200' : 'text-slate-800 dark:text-slate-200'}`}>
                  {preset.label}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-snug">
                {preset.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
