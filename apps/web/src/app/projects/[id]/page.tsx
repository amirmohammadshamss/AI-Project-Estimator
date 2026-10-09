'use client';
import { texts } from '../../../content/project-page';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useProject } from '../../../hooks/use-projects';
import { ProjectDetails } from '../../../components/project-details';
import { ProjectActivity } from '../../../components/project-activity';
import { ProjectEstimates } from '../../../components/project-estimates';

export default function ProjectDetailPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const { data: project, isLoading, isError } = useProject(projectId);
  if (isLoading) {
    return (
      <main className="mx-auto max-w-3xl p-6 sm:p-8">
        <p className="text-sm text-slate-500">{texts.loadingProject}</p>
      </main>
    );
  }

  if (isError || !project) {
    return (
      <main className="mx-auto max-w-3xl p-6 sm:p-8">
        <p className="text-sm text-red-600">{texts.projectNotFoundOrYouDonTHave}</p>
        <Link href="/projects" className="mt-4 inline-block text-sm text-slate-900 underline">
          {texts.backToProjects}
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-6 sm:p-8">
      <Link href="/projects" className="text-sm text-slate-500 hover:text-slate-700">
        {texts.backToProjects2}
      </Link>
      <ProjectDetails project={project} />
      <ProjectEstimates projectId={projectId} archived={project.status === 'ARCHIVED'} />
      <ProjectActivity projectId={projectId} />
    </main>
  );
}
