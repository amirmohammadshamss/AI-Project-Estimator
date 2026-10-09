'use client';
import type { EstimateItemsTableProps } from '../types/estimate-items-table-props';
import { texts } from '../content/estimate-items-table';

import { HoursEditor } from './hours-editor';
export function EstimateItemsTable({
  items,
  currency,
  estimateId,
  editable,
  pending,
  onSave,
}: EstimateItemsTableProps) {
  return (
    <div className="overflow-x-auto rounded border bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            {[
              texts.feature,
              texts.category,
              texts.complexity,
              texts.hours,
              texts.cost,
              texts.confidence,
            ].map((label) => (
              <th key={label} className="p-3">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t">
              <td className="p-3">
                <strong>{item.name}</strong>
                <p>{item.description}</p>
                {item.manuallyModified && (
                  <span className="text-amber-700">{texts.manuallyEdited}</span>
                )}
              </td>
              <td className="p-3">{item.category}</td>
              <td className="p-3">{item.complexity}</td>
              <td className="p-3">
                {editable ? (
                  <HoursEditor
                    key={`${estimateId}-${item.id}`}
                    item={item}
                    pending={pending}
                    onSave={(hours) => onSave(item.id, hours)}
                  />
                ) : (
                  item.estimatedHours
                )}
              </td>
              <td className="p-3">
                {currency} {item.estimatedCost}
              </td>
              <td className="p-3">
                {Math.round(item.confidence * 100)}
                {texts.symbol}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
