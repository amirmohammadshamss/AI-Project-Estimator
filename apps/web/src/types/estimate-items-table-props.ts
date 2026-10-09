import type { EstimateItem } from '../hooks/use-estimates';

export interface EstimateItemsTableProps {
  items: EstimateItem[];
  currency: string;
  estimateId: string;
  editable: boolean;
  pending: boolean;
  onSave: (itemId: string, hours: number) => void;
}
