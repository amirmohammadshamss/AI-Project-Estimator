'use client';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useGenerateEstimate } from '../hooks/use-estimates';
const schema = z.object({
  hourlyRate: z.number().min(0).max(1000000).multipleOf(0.01),
  currency: z.string().regex(/^[A-Z]{3}$/),
});
export function GenerateEstimate({ projectId }: { projectId: string }) {
  const router = useRouter();
  const generate = useGenerateEstimate(projectId);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { hourlyRate: 50, currency: 'USD' },
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
      <h3 className="font-medium">Generate an AI estimate</h3>
      <p className="text-sm text-slate-500">
        Uses the saved project description. Review the generated hours and assumptions before
        planning your project.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          Hourly rate
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
          Currency
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
          Enter a nonnegative hourly rate with at most two decimals and a three-letter uppercase
          currency.
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
        {generate.isPending ? 'Generating estimate…' : 'Generate Estimate'}
      </button>
    </form>
  );
}
