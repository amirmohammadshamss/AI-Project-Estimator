import type { UseFormRegister } from 'react-hook-form';
import type { ManualEstimateForm } from '../components/manual-estimate-schema';

export interface ManualEstimateFeatureProps {
  index: number;
  register: UseFormRegister<ManualEstimateForm>;
  canRemove: boolean;
  onRemove: () => void;
}
