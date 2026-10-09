'use client';
import { texts } from '../../content/projects-page';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateProject, useProjects } from '../../hooks/use-projects';
import { StatusBadge } from '../../components/status-badge';
import { ApiError } from '../../lib/api-client';

import { createProjectSchema } from '../../schemas/create-project';
import type { CreateProjectForm } from '../../types/create-project';

export default function ProjectsPage() {
  const { data: projects, isLoading, isError } = useProjects();
  const createProject = useCreateProject();
  const [isCreating, setIsCreating] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProjectForm>({ resolver: zodResolver(createProjectSchema) });

  const onSubmit = (data: CreateProjectForm) => {
    createProject.mutate(data, {
      onSuccess: () => {
        reset();
        setIsCreating(false);
      },
    });
  };

  return (
    <main className="mx-auto max-w-3xl p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{texts.projects}</h1>
        <button
          type="button"
          onClick={() => setIsCreating((v) => !v)}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          {isCreating ? texts.cancel : texts.newProject}
        </button>
      </div>

      {isCreating && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
              {texts.projectName}
            </label>
            <input
              id="name"
              type="text"
              placeholder={texts.foodDeliveryPlatform}
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
              rows={4}
              placeholder={texts.aMobileAndWebPlatformWhereCustomersCan}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              {...register('description')}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>
          {createProject.isError && (
            <p className="text-sm text-red-600">
              {createProject.error instanceof ApiError
                ? createProject.error.message
                : texts.couldNotCreateTheProject}
            </p>
          )}
          <button
            type="submit"
            disabled={createProject.isPending}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {createProject.isPending ? texts.creating : texts.createProject}
          </button>
        </form>
      )}

      <div className="mt-6">
        {isLoading && <p className="text-sm text-slate-500">{texts.loadingProjects}</p>}
        {isError && (
          <p className="text-sm text-red-600">{texts.couldNotLoadYourProjectsPleaseTryAgain}</p>
        )}
        {!isLoading && !isError && projects?.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
            <p className="text-sm text-slate-500">{texts.youDonTHaveAnyProjectsYetCreate}</p>
          </div>
        )}
        {projects && projects.length > 0 && (
          <ul className="space-y-3">
            {projects.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/projects/${project.id}`}
                  className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="font-medium text-slate-900">{project.name}</h2>
                    <StatusBadge status={project.status} />
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{project.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
