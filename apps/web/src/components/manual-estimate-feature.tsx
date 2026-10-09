'use client';
import type { ManualEstimateFeatureProps } from '../types/manual-estimate-feature-props';
import { texts } from '../content/manual-estimate-feature';

import { estimateInputClass as inputClass, COMPLEXITIES } from '../constants/manual-estimate';
export function ManualEstimateFeature({
  index: i,
  register,
  canRemove,
  onRemove,
}: ManualEstimateFeatureProps) {
  return (
    <fieldset className="space-y-3 rounded border p-3">
      <legend>
        {texts.feature}
        {i + 1}
      </legend>
      <label className="block">
        {texts.name}
        <input className={inputClass} {...register(`features.${i}.name`)} />
      </label>
      <label className="block">
        {texts.description}
        <textarea className={inputClass} {...register(`features.${i}.description`)} />
      </label>
      <label className="block">
        {texts.category}
        <input className={inputClass} {...register(`features.${i}.category`)} />
      </label>
      <div className="grid gap-3 sm:grid-cols-3">
        <label>
          {texts.complexity}
          <select className={inputClass} {...register(`features.${i}.complexity`)}>
            {COMPLEXITIES.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          {texts.hours}
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
          {texts.confidence01}
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
      {canRemove && (
        <button type="button" onClick={onRemove}>
          {texts.removeFeature}
        </button>
      )}
    </fieldset>
  );
}
