'use client';
import type { RiskListProps } from '../types/risk-list-props';
import type { EstimateInsightsProps } from '../types/estimate-insights-props';
import { texts } from '../content/estimate-insights';

import { useAnalyzeRisks, useExplainEstimate, useExportEstimate } from '../hooks/use-estimates';
import { RISK_STYLES as riskStyles } from '../constants/risks';
function RiskList({ risks }: RiskListProps) {
  if (!risks.length) return <p className="mt-3 text-sm text-slate-500">{texts.noRisksRecorded}</p>;
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
export function EstimateInsights({ projectId, estimate }: EstimateInsightsProps) {
  const explain = useExplainEstimate(estimate.id);
  const analyze = useAnalyzeRisks(estimate.id);
  const exportPdf = useExportEstimate(projectId, estimate.id, estimate.version);
  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">{texts.clientReport}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {texts.exportsThisSavedVersionItsProjectSnapshotRecommendations}
            </p>
          </div>
          <button
            className="rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
            disabled={exportPdf.isPending}
            onClick={() => exportPdf.mutate()}
          >
            {exportPdf.isPending ? texts.exportingPDF : texts.exportPDF}
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
          <h2 className="font-semibold">{texts.whyThisEstimate}</h2>
          <p className="mt-2 text-sm text-slate-500">
            {texts.getAConciseExplanationOfThisVersionS}
          </p>
          <button
            className="mt-3 rounded border px-3 py-2 text-sm disabled:opacity-50"
            disabled={explain.isPending}
            onClick={() => explain.mutate()}
          >
            {explain.isPending ? texts.explaining : texts.explainEstimate}
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
          <h2 className="font-semibold">{texts.technologyRecommendations}</h2>
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
              {texts.noTechnologyRecommendationsRecordedForThisVersion}
            </p>
          )}
        </section>
      </div>
      <section className="rounded-xl border bg-white p-4">
        <h2 className="font-semibold">{texts.savedRisks}</h2>
        <RiskList risks={estimate.risks} />
        <button
          className="mt-4 rounded border px-3 py-2 text-sm disabled:opacity-50"
          disabled={analyze.isPending}
          onClick={() => analyze.mutate()}
        >
          {analyze.isPending ? texts.analyzingRisks : texts.analyzeRisks}
        </button>
        <p className="mt-2 text-xs text-slate-500">
          {texts.additionalAnalysisUsesTheSavedProjectDescriptionIt}
        </p>
        {analyze.isError && (
          <p role="alert" className="mt-3 text-red-600">
            {analyze.error.message}
          </p>
        )}
        {analyze.data && (
          <div aria-live="polite" className="mt-4">
            <h3 className="font-medium">{texts.additionalRiskAnalysis}</h3>
            <RiskList risks={analyze.data.risks} />
          </div>
        )}
      </section>
    </div>
  );
}
