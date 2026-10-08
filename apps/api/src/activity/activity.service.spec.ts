import { ActivityService } from './activity.service';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityAction } from './activity-actions';

describe('ActivityService', () => {
  let prisma: {
    activityLog: {
      create: jest.Mock;
      findMany: jest.Mock;
    };
  };
  let activityService: ActivityService;

  beforeEach(() => {
    prisma = {
      activityLog: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };
    activityService = new ActivityService(prisma as unknown as PrismaService);
  });

  it('records an activity entry scoped to the project and user', async () => {
    await activityService.log('user-1', 'project-1', ActivityAction.PROJECT_CREATED, {
      name: 'Food Delivery Platform',
    });

    expect(prisma.activityLog.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        projectId: 'project-1',
        action: ActivityAction.PROJECT_CREATED,
        metadata: { name: 'Food Delivery Platform' },
      },
    });
  });

  it('lists activity for a project ordered most-recent first', async () => {
    prisma.activityLog.findMany.mockResolvedValue([]);

    await activityService.listForProject('project-1');

    expect(prisma.activityLog.findMany).toHaveBeenCalledWith({
      where: { projectId: 'project-1' },
      orderBy: { createdAt: 'desc' },
    });
  });
});
