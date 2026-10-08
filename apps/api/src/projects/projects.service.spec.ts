import { DashboardCacheService } from '../dashboard/dashboard-cache.service';
import { NotFoundException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { ActivityAction } from '../activity/activity-actions';

describe('ProjectsService', () => {
  let prisma: {
    project: {
      create: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };
  const dashboardCache = { invalidate: jest.fn() };
  let activityService: { log: jest.Mock };
  let projectsService: ProjectsService;

  const ownerId = 'user-1';
  const otherUserId = 'user-2';
  const project = {
    id: 'project-1',
    userId: ownerId,
    name: 'Food Delivery Platform',
    description: 'A mobile and web food delivery platform.',
    status: 'DRAFT',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    dashboardCache.invalidate.mockClear();
    prisma = {
      project: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    activityService = { log: jest.fn() };
    projectsService = new ProjectsService(
      prisma as unknown as PrismaService,
      activityService as unknown as ActivityService,
      dashboardCache as unknown as DashboardCacheService,
    );
  });

  it('creates a project scoped to the user and logs PROJECT_CREATED', async () => {
    prisma.project.create.mockResolvedValue(project);

    const result = await projectsService.create(ownerId, {
      name: project.name,
      description: project.description,
    });

    expect(prisma.project.create).toHaveBeenCalledWith({
      data: { userId: ownerId, name: project.name, description: project.description },
    });
    expect(activityService.log).toHaveBeenCalledWith(
      ownerId,
      project.id,
      ActivityAction.PROJECT_CREATED,
      { name: project.name },
    );
    expect(result).toEqual(project);
    expect(dashboardCache.invalidate).toHaveBeenCalledWith(ownerId);
  });

  it('returns a project owned by the requesting user', async () => {
    prisma.project.findFirst.mockResolvedValue(project);

    const result = await projectsService.findOneForUser(ownerId, project.id);

    expect(prisma.project.findFirst).toHaveBeenCalledWith({
      where: { id: project.id, userId: ownerId },
    });
    expect(result).toEqual(project);
  });

  it("throws NotFoundException for another user's project instead of leaking its existence", async () => {
    prisma.project.findFirst.mockResolvedValue(null);

    await expect(projectsService.findOneForUser(otherUserId, project.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('blocks update of a project the user does not own', async () => {
    prisma.project.findFirst.mockResolvedValue(null);

    await expect(
      projectsService.update(otherUserId, project.id, { name: 'Hijacked' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.project.update).not.toHaveBeenCalled();
    expect(dashboardCache.invalidate).not.toHaveBeenCalled();
  });

  it('logs only the fields that were actually provided, ignoring undefined DTO keys', async () => {
    prisma.project.findFirst.mockResolvedValue(project);
    prisma.project.update.mockResolvedValue({ ...project, name: 'Updated Name' });

    await projectsService.update(ownerId, project.id, {
      name: 'Updated Name',
      description: undefined,
    });

    expect(dashboardCache.invalidate).toHaveBeenCalledWith(ownerId);
    expect(activityService.log).toHaveBeenCalledWith(
      ownerId,
      project.id,
      ActivityAction.PROJECT_UPDATED,
      { fields: ['name'] },
    );
  });

  it('archives a project and logs PROJECT_ARCHIVED', async () => {
    prisma.project.findFirst.mockResolvedValue(project);
    prisma.project.update.mockResolvedValue({ ...project, status: 'ARCHIVED' });

    const result = await projectsService.archive(ownerId, project.id);

    expect(prisma.project.update).toHaveBeenCalledWith({
      where: { id: project.id },
      data: { status: 'ARCHIVED' },
    });
    expect(activityService.log).toHaveBeenCalledWith(
      ownerId,
      project.id,
      ActivityAction.PROJECT_ARCHIVED,
    );
    expect(result.status).toBe('ARCHIVED');
    expect(dashboardCache.invalidate).toHaveBeenCalledWith(ownerId);
  });

  it('blocks deletion of a project the user does not own', async () => {
    prisma.project.findFirst.mockResolvedValue(null);

    await expect(projectsService.remove(otherUserId, project.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.project.delete).not.toHaveBeenCalled();
  });

  it('deletes a project owned by the requesting user', async () => {
    prisma.project.findFirst.mockResolvedValue(project);
    prisma.project.delete.mockResolvedValue(project);

    await projectsService.remove(ownerId, project.id);

    expect(prisma.project.delete).toHaveBeenCalledWith({ where: { id: project.id } });
    expect(dashboardCache.invalidate).toHaveBeenCalledWith(ownerId);
  });
});
