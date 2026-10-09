'use client';
import type { ProjectEstimatesProps } from '../types/project-estimates-props';
import { texts } from '../content/project-estimates';
import Link from 'next/link';
import { GenerateEstimate } from './generate-estimate';
import { ManualEstimate } from './manual-estimate';
import { useEstimates } from '../hooks/use-estimates';
export function ProjectEstimates({ projectId, archived }: ProjectEstimatesProps) {
  const estimates = useEstimates(projectId);
  return (
    <section className="mt-8 space-y-4">
      {!archived && <GenerateEstimate projectId={projectId} />}
      <h2 className="text-lg font-semibold">{texts.estimates}</h2>
      {estimates.isLoading && <p>{texts.loadingEstimates}</p>}
      {estimates.isError && <p role="alert">{texts.couldNotLoadEstimates}</p>}
      {estimates.data?.length === 0 && (
        <p className="text-sm text-slate-500">{texts.noEstimatesYetCreateTheFirstVersionBelow}</p>
      )}
      {estimates.data?.map((estimate) => (
        <Link
          key={estimate.id}
          href={`/projects/${projectId}/estimate/${estimate.id}`}
          className="block rounded border p-3"
        >
          {texts.version}
          {estimate.version} {texts.symbol}
          {estimate.totalHours} {texts.hours}
          {estimate.currency} {estimate.totalCost}
        </Link>
      ))}
      {!archived && <ManualEstimate projectId={projectId} />}
    </section>
  );
}
