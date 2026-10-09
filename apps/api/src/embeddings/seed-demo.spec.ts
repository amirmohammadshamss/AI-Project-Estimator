import { seedDemo } from './seed-demo';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { ProjectsService } from '../projects/projects.service';
import { EstimatesService } from '../estimates/estimates.service';
describe('Demo seeding', () => {
  const prisma = {
    user: { findUnique: jest.fn() },
    project: { findFirst: jest.fn() },
    estimate: { findFirst: jest.fn() },
  };
  const users = { create: jest.fn() };
  const projects = { create: jest.fn() };
  const estimates = { generate: jest.fn(), create: jest.fn() };
  const run = (ai = false, password?: string) =>
    seedDemo(
      prisma as unknown as PrismaService,
      users as unknown as UsersService,
      projects as unknown as ProjectsService,
      estimates as unknown as EstimatesService,
      { email: 'demo@example.com', ai, password },
    );
  beforeEach(() => {
    jest.resetAllMocks();
    prisma.user.findUnique.mockResolvedValue({ id: 'owner' });
    prisma.project.findFirst.mockResolvedValue(null);
    prisma.estimate.findFirst.mockResolvedValue(null);
    projects.create.mockResolvedValue({ id: 'project', status: 'DRAFT' });
  });
  it('creates manual samples without AI or altering existing credentials', async () => {
    expect(await run()).toBe(2);
    expect(estimates.create).toHaveBeenCalledTimes(2);
    expect(estimates.generate).not.toHaveBeenCalled();
    expect(users.create).not.toHaveBeenCalled();
  });
  it('retains existing versions on repeated runs', async () => {
    prisma.project.findFirst.mockResolvedValue({ id: 'existing', status: 'ESTIMATED' });
    prisma.estimate.findFirst.mockResolvedValue({ id: 'version' });
    expect(await run()).toBe(0);
    expect(projects.create).not.toHaveBeenCalled();
    expect(estimates.create).not.toHaveBeenCalled();
  });
  it('uses the real generation service in AI mode', async () => {
    await run(true);
    expect(estimates.generate).toHaveBeenCalledTimes(2);
  });
  it('requires explicit credentials before creating a new user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(run()).rejects.toThrow('DEMO_PASSWORD');
    expect(users.create).not.toHaveBeenCalled();
  });
});
