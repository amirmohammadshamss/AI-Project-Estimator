'use client';

import { ProjectEstimates } from '../../../components/project-estimates';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useArchiveProject,
  useDeleteProject,
  useProject,
  useProjectActivity,
  useUpdateProject,
} from '../../../hooks/use-projects';
import { StatusBadge } from '../../../components/status-badge';
import { ConfirmDialog } from '../../../components/confirm-dialog';
import { describeActivity } from '../../../lib/activity-labels';
import { ApiError } from '../../../lib/api-client';

const editProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required.').max(200),
  description: z.string().min(1, 'Project description is required.').max(5000),
});

type EditProjectForm = z.infer<typeof editProjectSchema>;

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const router = useRouter();

  const { data: project, isLoading, isError } = useProject(projectId);
  const { data: activity } = useProjectActivity(projectId);
  const updateProject = useUpdateProject(projectId);
  const archiveProject = useArchiveProject(projectId);
  const deleteProject = useDeleteProject();

  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isConfirmingArchive, setIsConfirmingArchive] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditProjectForm>({ resolver: zodResolver(editProjectSchema) });

  const startEditing = () => {
    if (!project) return;
    reset({ name: project.name, description: project.description });
    setIsEditing(true);
  };

  const onSubmit = (data: EditProjectForm) => {
    updateProject.mutate(data, {
      onSuccess: () => setIsEditing(false),
    });
  };

  if (isLoading) {
    return (
      <main className="mx-auto max-w-3xl p-6 sm:p-8">
        <p className="text-sm text-slate-500">Loading project…</p>
      </main>
    );
  }

  if (isError || !project) {
    return (
      <main className="mx-auto max-w-3xl p-6 sm:p-8">
        <p className="text-sm text-red-600">
          Project not found, or you don&apos;t have access to it.
        </p>
        <Link href="/projects" className="mt-4 inline-block text-sm text-slate-900 underline">
          Back to projects
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-6 sm:p-8">
      <Link href="/projects" className="text-sm text-slate-500 hover:text-slate-700">
        ← Back to projects
      </Link>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">{project.name}</h1>
              <StatusBadge status={project.status} />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Created {new Date(project.createdAt).toLocaleDateString()}
            </p>
          </div>
          {!isEditing && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={startEditing}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
              >
                Edit
              </button>
              {project.status !== 'ARCHIVED' && (
                <button
                  type="button"
                  onClick={() => setIsConfirmingArchive(true)}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
                >
                  Archive
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
                Project name
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
              <label
                htmlFor="description"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Project description
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
                  : 'Could not save changes.'}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={updateProject.isPending}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {updateProject.isPending ? 'Saving…' : 'Save changes'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <p className="mt-4 whitespace-pre-wrap text-sm text-slate-600">{project.description}</p>
        )}
      </div>

      <ProjectEstimates projectId={projectId} archived={project.status === 'ARCHIVED'} />

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Activity</h2>
        {!activity && <p className="mt-2 text-sm text-slate-500">Loading activity…</p>}
        {activity && activity.length === 0 && (
          <p className="mt-2 text-sm text-slate-500">No activity recorded yet.</p>
        )}
        {activity && activity.length > 0 && (
          <ol className="mt-3 space-y-2 border-l border-slate-200 pl-4">
            {activity.map((entry) => (
              <li key={entry.id} className="relative">
                <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-slate-400" />
                <p className="text-sm font-medium text-slate-900">
                  {describeActivity(entry.action)}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(entry.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>

      <ConfirmDialog
        open={isConfirmingArchive}
        title="Archive this project?"
        description="Archived projects are kept read-only but can still be viewed later."
        confirmLabel="Archive"
        isConfirming={archiveProject.isPending}
        onCancel={() => setIsConfirmingArchive(false)}
        onConfirm={() =>
          archiveProject.mutate(undefined, { onSuccess: () => setIsConfirmingArchive(false) })
        }
      />

      <ConfirmDialog
        open={isConfirmingDelete}
        title="Delete this project?"
        description="This permanently removes the project and its activity history. This cannot be undone."
        confirmLabel="Delete"
        isConfirming={deleteProject.isPending}
        onCancel={() => setIsConfirmingDelete(false)}
        onConfirm={() =>
          deleteProject.mutate(projectId, { onSuccess: () => router.push('/projects') })
        }
      />
    </main>
  );
}
