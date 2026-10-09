import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { ProjectsService } from '../projects/projects.service';
import { EstimatesService } from '../estimates/estimates.service';
import { DEMO_PROJECTS } from './demo-data';
export async function seedDemo(
  prisma: PrismaService,
  users: UsersService,
  projects: ProjectsService,
  estimates: EstimatesService,
  options: { email: string; password?: string; ai: boolean },
) {
  z.string().email().parse(options.email);
  const user = await prisma.user.findUnique({ where: { email: options.email } });
  if (!user && (!options.password || options.password.length < 12))
    throw new Error('Set DEMO_PASSWORD to at least 12 characters for a new demo account.');
  const userId = user?.id ?? (await users.create(options.email, options.password!, 'Demo User')).id;
  let created = 0;
  for (const data of DEMO_PROJECTS) {
    const existing = await prisma.project.findFirst({ where: { userId, name: data.name } });
    const project =
      existing ??
      (await projects.create(userId, { name: data.name, description: data.description }));
    if (await prisma.estimate.findFirst({ where: { projectId: project.id } })) continue;
    if (project.status === 'ARCHIVED') continue;
    if (options.ai)
      await estimates.generate(userId, project.id, { hourlyRate: 75, currency: 'USD' });
    else
      await estimates.create(userId, project.id, {
        hourlyRate: 75,
        currency: 'USD',
        summary:
          'Illustrative manual sample estimate for exploring the application. Replace these reference hours with your own project assessment.',
        features: data.features,
      });
    created++;
  }
  return created;
}
