'use client';
import type { HoursEditorProps } from '../types/hours-editor-props';
import { texts } from '../content/hours-editor';
import { useState } from 'react';

export function HoursEditor({ item, pending, onSave }: HoursEditorProps) {
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
        {texts.save}
      </button>
    </form>
  );
}
