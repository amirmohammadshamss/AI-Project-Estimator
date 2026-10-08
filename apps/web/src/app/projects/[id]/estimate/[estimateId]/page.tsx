'use client';
import { EstimateInsights } from '../../../../../components/estimate-insights';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  useEditHours,
  useEstimate,
  useEstimates,
  EstimateItem,
} from '../../../../../hooks/use-estimates';
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
  if (estimate.isLoading) return <main className="p-8">Loading estimate…</main>;
  if (!estimate.data || estimate.isError)
    return (
      <main className="p-8">
        <p>Estimate not found or unavailable.</p>
        <Link href={`/projects/${id}`}>Back to project</Link>
      </main>
    );
  const data = estimate.data;
  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6 sm:p-8">
      <Link href={`/projects/${id}`} className="underline">
        ← Back to project
      </Link>
      <h1 className="text-2xl font-semibold">Estimate · Version {data.version}</h1>
      <p className="font-medium">{data.projectName}</p>
      <p className="whitespace-pre-wrap text-sm text-slate-600">{data.projectDescription}</p>
      <h2 className="text-lg font-semibold">Executive summary</h2>
      <p className="whitespace-pre-wrap">{data.summary}</p>
      <dl className="grid grid-cols-2 gap-4 rounded border bg-white p-4 sm:grid-cols-4">
        {[
          ['Hours', data.totalHours],
          ['Hourly rate', `${data.currency} ${data.hourlyRate}`],
          ['Total cost', `${data.currency} ${data.totalCost}`],
          ['Confidence', `${Math.round(data.confidence * 100)}%`],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-sm text-slate-500">{label}</dt>
            <dd className="font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-sm text-slate-500">
        Saving hours creates a new version. Previous versions remain available. Only the latest
        version can be edited.
      </p>
      {edit.isError && (
        <p role="alert" className="text-red-600">
          {edit.error.message}
        </p>
      )}
      <div className="overflow-x-auto rounded border bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              {['Feature', 'Category', 'Complexity', 'Hours', 'Cost', 'Confidence'].map((label) => (
                <th key={label} className="p-3">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.items.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="p-3">
                  <strong>{item.name}</strong>
                  <p>{item.description}</p>
                  {item.manuallyModified && <span className="text-amber-700">Manually edited</span>}
                </td>
                <td className="p-3">{item.category}</td>
                <td className="p-3">{item.complexity}</td>
                <td className="p-3">
                  {editable ? (
                    <HoursEditor
                      key={`${estimateId}-${item.id}`}
                      item={item}
                      pending={edit.isPending}
                      onSave={(hours) =>
                        edit.mutate(
                          { itemId: item.id, estimatedHours: hours },
                          {
                            onSuccess: (next) => router.push(`/projects/${id}/estimate/${next.id}`),
                          },
                        )
                      }
                    />
                  ) : (
                    item.estimatedHours
                  )}
                </td>
                <td className="p-3">
                  {data.currency} {item.estimatedCost}
                </td>
                <td className="p-3">{Math.round(item.confidence * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <EstimateInsights key={estimateId} projectId={id} estimate={data} />
    </main>
  );
}
function HoursEditor({
  item,
  pending,
  onSave,
}: {
  item: EstimateItem;
  pending: boolean;
  onSave: (hours: number) => void;
}) {
  const [hours, setHours] = useState(item.estimatedHours);
  return (
    <form
      className="flex gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(Number(hours));
      }}
    >
      <input
        aria-label={`Hours for ${item.name}`}
        className="w-24 rounded border px-2 py-1"
        type="number"
        min="0.01"
        max="1000000"
        step="0.01"
        required
        value={hours}
        onChange={(event) => setHours(event.target.value)}
      />
      <button disabled={pending} className="rounded border px-2">
        Save
      </button>
    </form>
  );
}
