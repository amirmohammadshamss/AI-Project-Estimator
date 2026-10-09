'use client';
import type { ProjectEditFormProps } from '../types/project-edit-form-props';
import { texts } from '../content/project-edit-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUpdateProject } from '../hooks/use-projects';
import { ApiError } from '../lib/api-client';

import { editProjectSchema } from '../schemas/edit-project';
import type { EditProjectForm } from '../types/edit-project';

export function ProjectEditForm({ project, onCancel, onSaved }: ProjectEditFormProps) {
  const updateProject = useUpdateProject(project.id);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditProjectForm>({
    resolver: zodResolver(editProjectSchema),
    defaultValues: { name: project.name, description: project.description },
  });
  const onSubmit = (data: EditProjectForm) => updateProject.mutate(data, { onSuccess: onSaved });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
          {texts.projectName}
        </label>
        <input
          id="name"
          type="text"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          {...register('name')}
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
      </div>
      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-slate-700">
          {texts.projectDescription}
        </label>
        <textarea
          id="description"
          rows={5}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          {...register('description')}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>
      {updateProject.isError && (
        <p className="text-sm text-red-600">
          {updateProject.error instanceof ApiError
            ? updateProject.error.message
            : texts.couldNotSaveChanges}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={updateProject.isPending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {updateProject.isPending ? texts.saving : texts.saveChanges}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
        >
          {texts.cancel}
        </button>
      </div>
    </form>
  );
}
