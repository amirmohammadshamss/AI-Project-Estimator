import { messages } from '../content/projects-projects.service';
import { DashboardCacheService } from '../dashboard/dashboard-cache.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Project } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { ActivityAction } from '../activity/activity-actions';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: ActivityService,
    private readonly dashboardCache: DashboardCacheService,
  ) {}

  async create(userId: string, dto: CreateProjectDto): Promise<Project> {
    const project = await this.prisma.project.create({
      data: { userId, name: dto.name, description: dto.description },
    });

    await this.dashboardCache.invalidate(userId);
    await this.activityService.log(userId, project.id, ActivityAction.PROJECT_CREATED, {
      name: project.name,
    });

    return project;
  }

  async findAllForUser(userId: string): Promise<Project[]> {
    return this.prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Scoping every lookup by userId (rather than fetching by id and checking
   * ownership after) means a mismatched owner surfaces as a 404, not a 403 —
   * callers can't distinguish "doesn't exist" from "not yours" (doc.md §6).
   */
  async findOneForUser(userId: string, projectId: string): Promise<Project> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      throw new NotFoundException(messages.projectNotFound);
    }

    return project;
  }

  async update(userId: string, projectId: string, dto: UpdateProjectDto): Promise<Project> {
    await this.findOneForUser(userId, projectId);

    const project = await this.prisma.project.update({
      where: { id: projectId },
      data: dto,
    });

    const updatedFields = Object.entries(dto)
      .filter(([, value]) => value !== undefined)
      .map(([key]) => key);

    await this.dashboardCache.invalidate(userId);
    await this.activityService.log(userId, project.id, ActivityAction.PROJECT_UPDATED, {
      fields: updatedFields,
    });

    return project;
  }

  async archive(userId: string, projectId: string): Promise<Project> {
    await this.findOneForUser(userId, projectId);

    const project = await this.prisma.project.update({
      where: { id: projectId },
      data: { status: 'ARCHIVED' },
    });

    await this.dashboardCache.invalidate(userId);
    await this.activityService.log(userId, project.id, ActivityAction.PROJECT_ARCHIVED);

    return project;
  }

  async remove(userId: string, projectId: string): Promise<void> {
    await this.findOneForUser(userId, projectId);
    await this.prisma.project.delete({ where: { id: projectId } });
    await this.dashboardCache.invalidate(userId);
  }
}
