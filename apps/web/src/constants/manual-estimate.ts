import type { ManualEstimateForm } from '../types/manual-estimate';

export const emptyFeature: ManualEstimateForm['features'][number] = {
  name: '',
  description: '',
  category: '',
  complexity: 'MEDIUM',
  estimatedHours: 1,
  confidence: 0.8,
};

export const estimateInputClass = 'w-full rounded border border-slate-300 px-3 py-2 text-sm';
export const COMPLEXITIES = ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'] as const;

export const estimateDefaults = { hourlyRate: 50, currency: 'USD' };
