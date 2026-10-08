'use client';
import type { EstimateRisk } from '@ape/types';
import {
  Estimate,
  useAnalyzeRisks,
  useExplainEstimate,
  useExportEstimate,
} from '../hooks/use-estimates';
const riskStyles = {
  HIGH: 'bg-red-100 text-red-800',
  MEDIUM: 'bg-amber-100 text-amber-800',
  LOW: 'bg-emerald-100 text-emerald-800',
};
function RiskList({ risks }: { risks: EstimateRisk[] }) {
  if (!risks.length) return <p className="mt-3 text-sm text-slate-500">No risks recorded.</p>;
  return (
    <ul className="mt-3 space-y-3">
      {risks.map((risk, index) => (
        <li key={`${risk.title}-${index}`} className="rounded border p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${riskStyles[risk.severity]}`}
            >
              {risk.severity}
            </span>
            <strong className="break-words text-sm">{risk.title}</strong>
          </div>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-600">
            {risk.description}
          </p>
        </li>
      ))}
    </ul>
  );
}
export function EstimateInsights({
  projectId,
  estimate,
}: {
  projectId: string;
  estimate: Estimate;
}) {
  const explain = useExplainEstimate(estimate.id);
  const analyze = useAnalyzeRisks(estimate.id);
  const exportPdf = useExportEstimate(projectId, estimate.id, estimate.version);
  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Client report</h2>
            <p className="mt-1 text-sm text-slate-500">
              Exports this saved version, its project snapshot, recommendations and risks.
            </p>
          </div>
          <button
            className="rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
            disabled={exportPdf.isPending}
            onClick={() => exportPdf.mutate()}
          >
            {exportPdf.isPending ? 'Exporting PDF…' : 'Export PDF'}
          </button>
        </div>
        {exportPdf.isError && (
          <p role="alert" className="mt-3 text-red-600">
            {exportPdf.error.message}
          </p>
        )}
      </section>
      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        <section className="min-w-0 rounded-xl border bg-white p-4">
          <h2 className="font-semibold">Why this estimate</h2>
          <p className="mt-2 text-sm text-slate-500">
            Get a concise explanation of this version&apos;s features, assumptions and uncertainty.
          </p>
          <button
            className="mt-3 rounded border px-3 py-2 text-sm disabled:opacity-50"
            disabled={explain.isPending}
            onClick={() => explain.mutate()}
          >
            {explain.isPending ? 'Explaining…' : 'Explain estimate'}
          </button>
          {explain.isError && (
            <p role="alert" className="mt-3 text-red-600">
              {explain.error.message}
            </p>
          )}
          {explain.data && (
            <p aria-live="polite" className="mt-3 whitespace-pre-wrap break-words text-sm">
              {explain.data.explanation}
            </p>
          )}
        </section>
        <section className="min-w-0 rounded-xl border bg-white p-4">
          <h2 className="font-semibold">Technology recommendations</h2>
          {estimate.suggestedStack.length ? (
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {estimate.suggestedStack.map((technology, index) => (
                <li
                  key={`${technology}-${index}`}
                  className="break-words rounded bg-slate-50 p-3 text-sm"
                >
                  {technology}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500">
              No technology recommendations recorded for this version.
            </p>
          )}
        </section>
      </div>
      <section className="rounded-xl border bg-white p-4">
        <h2 className="font-semibold">Saved risks</h2>
        <RiskList risks={estimate.risks} />
        <button
          className="mt-4 rounded border px-3 py-2 text-sm disabled:opacity-50"
          disabled={analyze.isPending}
          onClick={() => analyze.mutate()}
        >
          {analyze.isPending ? 'Analyzing risks…' : 'Analyze risks'}
        </button>
        <p className="mt-2 text-xs text-slate-500">
          Additional analysis uses the saved project description. It does not change the saved
          version or exported risks.
        </p>
        {analyze.isError && (
          <p role="alert" className="mt-3 text-red-600">
            {analyze.error.message}
          </p>
        )}
        {analyze.data && (
          <div aria-live="polite" className="mt-4">
            <h3 className="font-medium">Additional risk analysis</h3>
            <RiskList risks={analyze.data.risks} />
          </div>
        )}
      </section>
    </div>
  );
}
