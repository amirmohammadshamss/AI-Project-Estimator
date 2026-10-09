'use client';
import { estimateDefaults } from '../constants/manual-estimate';
import type { ManualEstimateProps } from '../types/manual-estimate-props';
import { texts } from '../content/manual-estimate';
import { useRouter } from 'next/navigation';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSaveEstimate } from '../hooks/use-estimates';
import { ManualEstimateFeature } from './manual-estimate-feature';
import { manualEstimateSchema, ManualEstimateForm, emptyFeature } from './manual-estimate-schema';
import { estimateInputClass as inputClass } from '../constants/manual-estimate';
export function ManualEstimate({ projectId }: ManualEstimateProps) {
  const router = useRouter();
  const save = useSaveEstimate(projectId);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ManualEstimateForm>({
    resolver: zodResolver(manualEstimateSchema),
    defaultValues: {
      summary: '',
      ...estimateDefaults,
      features: [{ ...emptyFeature }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'features' });
  return (
    <details className="rounded border bg-white p-4">
      <summary className="cursor-pointer font-medium">{texts.createManualEstimate}</summary>
      <form
        className="mt-4 space-y-4"
        onSubmit={handleSubmit((data) =>
          save.mutate(data, {
            onSuccess: (estimate) => router.push(`/projects/${projectId}/estimate/${estimate.id}`),
          }),
        )}
      >
        <label className="block">
          {texts.summary}
          <textarea className={inputClass} {...register('summary')} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            {texts.hourlyRate}
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputClass}
              {...register('hourlyRate', { valueAsNumber: true })}
            />
          </label>
          <label>
            {texts.currencyThreeLetters}
            <input maxLength={3} className={inputClass} {...register('currency')} />
          </label>
        </div>
        {fields.map((field, i) => (
          <ManualEstimateFeature
            key={field.id}
            index={i}
            register={register}
            canRemove={fields.length > 1}
            onRemove={() => remove(i)}
          />
        ))}
        {Object.keys(errors).length > 0 && (
          <p role="alert" className="text-red-600">
            {texts.checkAllFieldsTextIsRequiredHoursMust}
          </p>
        )}
        {save.isError && (
          <p role="alert" className="text-red-600">
            {save.error.message}
          </p>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            disabled={fields.length >= 200}
            onClick={() => append({ ...emptyFeature })}
          >
            {texts.addFeature}
          </button>
          <button
            className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
            disabled={save.isPending}
          >
            {save.isPending ? texts.saving : texts.saveEstimate}
          </button>
        </div>
      </form>
    </details>
  );
}
