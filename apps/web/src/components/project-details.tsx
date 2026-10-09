'use client';
import type { ProjectDetailsProps } from '../types/project-details-props';
import { texts } from '../content/project-details';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useArchiveProject, useDeleteProject } from '../hooks/use-projects';
import { StatusBadge } from './status-badge';
import { ConfirmDialog } from './confirm-dialog';
import { ProjectEditForm } from './project-edit-form';

export function ProjectDetails({ project }: ProjectDetailsProps) {
  const projectId = project.id;
  const router = useRouter();
  const archiveProject = useArchiveProject(projectId);
  const deleteProject = useDeleteProject();
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isConfirmingArchive, setIsConfirmingArchive] = useState(false);
  const startEditing = () => setIsEditing(true);
  return (
    <>
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">{project.name}</h1>
              <StatusBadge status={project.status} />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {texts.created}
              {new Date(project.createdAt).toLocaleDateString()}
            </p>
          </div>
          {!isEditing && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={startEditing}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
              >
                {texts.edit}
              </button>
              {project.status !== 'ARCHIVED' && (
                <button
                  type="button"
                  onClick={() => setIsConfirmingArchive(true)}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
                >
                  {texts.archive}
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
              >
                {texts.delete}
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <ProjectEditForm
            project={project}
            onCancel={() => setIsEditing(false)}
            onSaved={() => setIsEditing(false)}
          />
        ) : (
          <p className="mt-4 whitespace-pre-wrap text-sm text-slate-600">{project.description}</p>
        )}
      </div>
      <ConfirmDialog
        open={isConfirmingArchive}
        title={texts.archiveThisProject}
        description={texts.archivedProjectsAreKeptReadOnlyButCan}
        confirmLabel={texts.archive}
        isConfirming={archiveProject.isPending}
        onCancel={() => setIsConfirmingArchive(false)}
        onConfirm={() =>
          archiveProject.mutate(undefined, { onSuccess: () => setIsConfirmingArchive(false) })
        }
      />

      <ConfirmDialog
        open={isConfirmingDelete}
        title={texts.deleteThisProject}
        description={texts.thisPermanentlyRemovesTheProjectAndItsActivity}
        confirmLabel={texts.delete}
        isConfirming={deleteProject.isPending}
        onCancel={() => setIsConfirmingDelete(false)}
        onConfirm={() =>
          deleteProject.mutate(projectId, { onSuccess: () => router.push('/projects') })
        }
      />
    </>
  );
}
