'use client';
import { texts } from '../../../../../content/estimate-page';
import { EstimateItemsTable } from '../../../../../components/estimate-items-table';
import { EstimateInsights } from '../../../../../components/estimate-insights';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEditHours, useEstimate, useEstimates } from '../../../../../hooks/use-estimates';
import { useProject } from '../../../../../hooks/use-projects';

export default function EstimatePage() {
  const { id, estimateId } = useParams<{ id: string; estimateId: string }>();
  const router = useRouter();
  const estimate = useEstimate(id, estimateId);
  const versions = useEstimates(id);
  const project = useProject(id);
  const edit = useEditHours(id, estimateId);
  const editable =
    Boolean(project.data) &&
    project.data?.status !== 'ARCHIVED' &&
    versions.data?.[0]?.id === estimateId;
  if (estimate.isLoading) return <main className="p-8">{texts.loadingEstimate}</main>;
  if (!estimate.data || estimate.isError)
    return (
      <main className="p-8">
        <p>{texts.estimateNotFoundOrUnavailable}</p>
        <Link href={`/projects/${id}`}>{texts.backToProject}</Link>
      </main>
    );
  const data = estimate.data;
  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6 sm:p-8">
      <Link href={`/projects/${id}`} className="underline">
        {texts.backToProject2}
      </Link>
      <h1 className="text-2xl font-semibold">
        {texts.estimateVersion}
        {data.version}
      </h1>
      <p className="font-medium">{data.projectName}</p>
      <p className="whitespace-pre-wrap text-sm text-slate-600">{data.projectDescription}</p>
      <h2 className="text-lg font-semibold">{texts.executiveSummary}</h2>
      <p className="whitespace-pre-wrap">{data.summary}</p>
      <dl className="grid grid-cols-2 gap-4 rounded border bg-white p-4 sm:grid-cols-4">
        {[
          [texts.hours, data.totalHours],
          [texts.hourlyRate, `${data.currency} ${data.hourlyRate}`],
          [texts.totalCost, `${data.currency} ${data.totalCost}`],
          [texts.confidence, `${Math.round(data.confidence * 100)}%`],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-sm text-slate-500">{label}</dt>
            <dd className="font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-sm text-slate-500">
        {texts.savingHoursCreatesANewVersionPreviousVersions}
      </p>
      {edit.isError && (
        <p role="alert" className="text-red-600">
          {edit.error.message}
        </p>
      )}
      <EstimateItemsTable
        items={data.items}
        currency={data.currency}
        estimateId={estimateId}
        editable={editable}
        pending={edit.isPending}
        onSave={(itemId, hours) =>
          edit.mutate(
            { itemId, estimatedHours: hours },
            {
              onSuccess: (next) => router.push(`/projects/${id}/estimate/${next.id}`),
            },
          )
        }
      />
      <EstimateInsights key={estimateId} projectId={id} estimate={data} />
    </main>
  );
}
