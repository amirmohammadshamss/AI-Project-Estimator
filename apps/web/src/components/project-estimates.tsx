'use client';
import Link from 'next/link';
import { GenerateEstimate } from './generate-estimate';
import { useRouter } from 'next/navigation';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEstimates, useSaveEstimate } from '../hooks/use-estimates';

const schema = z.object({
  summary: z.string().trim().min(1).max(10000),
  hourlyRate: z.number().min(0).max(1000000).multipleOf(0.01),
  currency: z.string().regex(/^[A-Z]{3}$/),
  features: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(200),
        description: z.string().trim().min(1).max(5000),
        category: z.string().trim().min(1).max(200),
        complexity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH']),
        estimatedHours: z.number().min(0.01).max(1000000).multipleOf(0.01),
        confidence: z.number().min(0).max(1),
      }),
    )
    .min(1)
    .max(200),
});
type Form = z.infer<typeof schema>;
const feature: Form['features'][number] = {
  name: '',
  description: '',
  category: '',
  complexity: 'MEDIUM',
  estimatedHours: 1,
  confidence: 0.8,
};
const inputClass = 'w-full rounded border border-slate-300 px-3 py-2 text-sm';

export function ProjectEstimates({
  projectId,
  archived,
}: {
  projectId: string;
  archived: boolean;
}) {
  const router = useRouter();
  const estimates = useEstimates(projectId);
  const save = useSaveEstimate(projectId);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { summary: '', hourlyRate: 50, currency: 'USD', features: [{ ...feature }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'features' });
  return (
    <section className="mt-8 space-y-4">
      {!archived && <GenerateEstimate projectId={projectId} />}
      <h2 className="text-lg font-semibold">Estimates</h2>
      {estimates.isLoading && <p>Loading estimates…</p>}
      {estimates.isError && <p role="alert">Could not load estimates.</p>}
      {estimates.data?.length === 0 && (
        <p className="text-sm text-slate-500">No estimates yet. Create the first version below.</p>
      )}
      {estimates.data?.map((estimate) => (
        <Link
          key={estimate.id}
          href={`/projects/${projectId}/estimate/${estimate.id}`}
          className="block rounded border p-3"
        >
          Version {estimate.version} · {estimate.totalHours} hours · {estimate.currency}{' '}
          {estimate.totalCost}
        </Link>
      ))}
      {!archived && (
        <details className="rounded border bg-white p-4">
          <summary className="cursor-pointer font-medium">Create manual estimate</summary>
          <form
            className="mt-4 space-y-4"
            onSubmit={handleSubmit((data) =>
              save.mutate(data, {
                onSuccess: (estimate) =>
                  router.push(`/projects/${projectId}/estimate/${estimate.id}`),
              }),
            )}
          >
            <label className="block">
              Summary
              <textarea className={inputClass} {...register('summary')} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label>
                Hourly rate
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={inputClass}
                  {...register('hourlyRate', { valueAsNumber: true })}
                />
              </label>
              <label>
                Currency (three letters)
                <input maxLength={3} className={inputClass} {...register('currency')} />
              </label>
            </div>
            {fields.map((field, i) => (
              <fieldset key={field.id} className="space-y-3 rounded border p-3">
                <legend>Feature {i + 1}</legend>
                <label className="block">
                  Name
                  <input className={inputClass} {...register(`features.${i}.name`)} />
                </label>
                <label className="block">
                  Description
                  <textarea className={inputClass} {...register(`features.${i}.description`)} />
                </label>
                <label className="block">
                  Category
                  <input className={inputClass} {...register(`features.${i}.category`)} />
                </label>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label>
                    Complexity
                    <select className={inputClass} {...register(`features.${i}.complexity`)}>
                      {['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'].map((value) => (
                        <option key={value}>{value}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Hours
                    <input
                      className={inputClass}
                      type="number"
                      min="0.01"
                      max="1000000"
                      step="0.01"
                      {...register(`features.${i}.estimatedHours`, { valueAsNumber: true })}
                    />
                  </label>
                  <label>
                    Confidence (0–1)
                    <input
                      className={inputClass}
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      {...register(`features.${i}.confidence`, { valueAsNumber: true })}
                    />
                  </label>
                </div>
                {fields.length > 1 && (
                  <button type="button" onClick={() => remove(i)}>
                    Remove feature
                  </button>
                )}
              </fieldset>
            ))}
            {Object.keys(errors).length > 0 && (
              <p role="alert" className="text-red-600">
                Check all fields: text is required, hours must be positive, confidence must be
                between 0 and 1, and currency must contain three uppercase letters.
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
                onClick={() => append({ ...feature })}
              >
                Add feature
              </button>
              <button
                className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
                disabled={save.isPending}
              >
                {save.isPending ? 'Saving…' : 'Save estimate'}
              </button>
            </div>
          </form>
        </details>
      )}
    </section>
  );
}
