import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityAction } from './activity-actions';

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async log(
    userId: string,
    projectId: string,
    action: ActivityAction,
    metadata?: Prisma.InputJsonValue,
  ) {
    await this.prisma.activityLog.create({
      data: { userId, projectId, action, metadata },
    });
  }

  async listForProject(projectId: string) {
    return this.prisma.activityLog.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
