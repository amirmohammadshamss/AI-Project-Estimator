export interface EstimateItem {
  id: string;
  name: string;
  description: string;
  category: string;
  complexity: string;
  estimatedHours: string;
  estimatedCost: string;
  confidence: number;
  manuallyModified: boolean;
}
export interface Estimate {
  id: string;
  version: number;
  summary: string;
  projectName: string;
  projectDescription: string;
  createdAt: string;
  suggestedStack: string[];
  risks: import('@ape/types').EstimateRisk[];
  hourlyRate: string;
  currency: string;
  totalHours: string;
  totalCost: string;
  confidence: number;
  items: EstimateItem[];
}
export interface ManualEstimate {
  summary: string;
  hourlyRate: number;
  currency: string;
  features: {
    name: string;
    description: string;
    category: string;
    complexity: string;
    estimatedHours: number;
    confidence: number;
  }[];
}
