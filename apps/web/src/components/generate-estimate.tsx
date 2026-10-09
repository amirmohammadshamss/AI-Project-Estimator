'use client';
import { estimateDefaults } from '../constants/manual-estimate';
import type { GenerateEstimateProps } from '../types/generate-estimate-props';
import { texts } from '../content/generate-estimate';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useGenerateEstimate } from '../hooks/use-estimates';
import type { GenerateEstimateForm } from '../types/generate-estimate';
import { schema } from '../schemas/generate-estimate';

export function GenerateEstimate({ projectId }: GenerateEstimateProps) {
  const router = useRouter();
  const generate = useGenerateEstimate(projectId);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GenerateEstimateForm>({
    resolver: zodResolver(schema),
    defaultValues: { ...estimateDefaults },
  });
  return (
    <form
      className="space-y-3 rounded border bg-white p-4"
      onSubmit={handleSubmit((data) =>
        generate.mutate(data, {
          onSuccess: (estimate) => router.push(`/projects/${projectId}/estimate/${estimate.id}`),
        }),
      )}
    >
      <h3 className="font-medium">{texts.generateAnAIEstimate}</h3>
      <p className="text-sm text-slate-500">
        {texts.usesTheSavedProjectDescriptionReviewTheGenerated}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          {texts.hourlyRate}
          <input
            className="block w-full rounded border px-3 py-2"
            type="number"
            min="0"
            max="1000000"
            step="0.01"
            disabled={generate.isPending}
            {...register('hourlyRate', { valueAsNumber: true })}
          />
        </label>
        <label>
          {texts.currency}
          <input
            className="block w-full rounded border px-3 py-2"
            maxLength={3}
            disabled={generate.isPending}
            {...register('currency')}
          />
        </label>
      </div>
      {Object.keys(errors).length > 0 && (
        <p role="alert" className="text-red-600">
          {texts.enterANonnegativeHourlyRateWithAtMost}
        </p>
      )}
      {generate.isError && (
        <p role="alert" aria-live="assertive" className="text-red-600">
          {generate.error.message}
        </p>
      )}
      <button
        disabled={generate.isPending}
        className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
      >
        {generate.isPending ? texts.generatingEstimate : texts.generateEstimate}
      </button>
    </form>
  );
}
