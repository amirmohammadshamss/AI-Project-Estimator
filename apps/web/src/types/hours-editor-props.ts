import type { EstimateItem } from '../hooks/use-estimates';

export interface HoursEditorProps {
  item: EstimateItem;
  pending: boolean;
  onSave: (hours: number) => void;
}
