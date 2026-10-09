import { randomUUID } from 'crypto';
import { Prisma, User, Project, Estimate, EstimateItem, ActivityLog } from '@prisma/client';

type Where = {
  id?: string;
  userId?: string;
  projectId?: string;
  project?: { userId: string };
  email?: string;
};
type Find = {
  where?: Where;
  select?: Record<string, unknown>;
  include?: Record<string, unknown>;
  orderBy?: unknown;
};
type SavedEstimate = Estimate & { items: EstimateItem[] };
export class MemoryPrisma {
  private users: User[] = [];
  private projects: Project[] = [];
  private estimates: SavedEstimate[] = [];
  private logs: ActivityLog[] = [];
  private projectMatches(project: Project, where: Where = {}) {
    return (
      (!where.id || project.id === where.id) && (!where.userId || project.userId === where.userId)
    );
  }
  private estimateMatches(estimate: SavedEstimate, where: Where = {}) {
    return (
      (!where.id || estimate.id === where.id) &&
      (!where.projectId || estimate.projectId === where.projectId) &&
      (!where.project ||
        this.projects.some(
          (project) =>
            project.id === estimate.projectId && project.userId === where.project!.userId,
        ))
    );
  }
  private view(estimate: SavedEstimate, include?: Record<string, unknown>) {
    if (!include?.project)
      return { ...estimate, items: [...estimate.items].sort((a, b) => a.position - b.position) };
    const project = this.projects.find((row) => row.id === estimate.projectId)!;
    const user = this.users.find((row) => row.id === project.userId)!;
    return { ...estimate, project: { ...project, user: { name: user.name, email: user.email } } };
  }
  user = {
    findUnique: async ({ where }: { where: Where }) =>
      this.users.find(
        (user) =>
          (!where.id || user.id === where.id) && (!where.email || user.email === where.email),
      ) ?? null,
    create: async ({ data }: { data: { email: string; passwordHash: string; name?: string } }) => {
      const now = new Date();
      const user = {
        id: randomUUID(),
        ...data,
        name: data.name ?? null,
        createdAt: now,
        updatedAt: now,
      };
      this.users.push(user);
      return user;
    },
    update: async ({ where, data }: { where: Where; data: { name?: string } }) => {
      const user = this.users.find((row) => row.id === where.id)!;
      if (data.name !== undefined) user.name = data.name;
      user.updatedAt = new Date();
      return user;
    },
  };
  project = {
    create: async ({ data }: { data: { userId: string; name: string; description: string } }) => {
      const now = new Date();
      const project: Project = {
        id: randomUUID(),
        ...data,
        status: 'DRAFT',
        createdAt: now,
        updatedAt: now,
      };
      this.projects.push(project);
      return project;
    },
    findFirst: async ({ where }: Find) =>
      this.projects.find((project) => this.projectMatches(project, where)) ?? null,
    findMany: async ({ where, select }: Find) =>
      this.projects
        .filter((project) => this.projectMatches(project, where))
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .map((project) =>
          select?.estimates
            ? {
                ...project,
                estimates: this.estimates
                  .filter((estimate) => estimate.projectId === project.id)
                  .sort((a, b) => b.version - a.version)
                  .slice(0, 1),
              }
            : project,
        ),
    update: async ({ where, data }: { where: Where; data: Partial<Project> }) => {
      const project = this.projects.find((row) => row.id === where.id)!;
      Object.assign(
        project,
        Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)),
        { updatedAt: new Date() },
      );
      return project;
    },
    delete: async ({ where }: Find) => {
      const project = this.projects.find((row) => row.id === where?.id)!;
      this.projects = this.projects.filter((row) => row.id !== where?.id);
      this.estimates = this.estimates.filter((row) => row.projectId !== where?.id);
      this.logs = this.logs.filter((row) => row.projectId !== where?.id);
      return project;
    },
    groupBy: async ({ where }: Find) =>
      ['DRAFT', 'ESTIMATED', 'ARCHIVED'].map((status) => ({
        status,
        _count: {
          _all: this.projects.filter(
            (project) => this.projectMatches(project, where) && project.status === status,
          ).length,
        },
      })),
  };
  estimate = {
    findFirst: async ({ where, include }: Find) => {
      const row = this.estimates
        .filter((estimate) => this.estimateMatches(estimate, where))
        .sort((a, b) => b.version - a.version)[0];
      return row ? this.view(row, include) : null;
    },
    findMany: async ({ where, include }: Find) =>
      this.estimates
        .filter((estimate) => this.estimateMatches(estimate, where))
        .sort((a, b) => b.version - a.version)
        .map((estimate) => this.view(estimate, include)),
    create: async ({
      data,
    }: {
      data: Omit<Estimate, 'id' | 'createdAt' | 'risks'> & {
        risks: Prisma.InputJsonValue;
        items: {
          create: (Omit<EstimateItem, 'id' | 'estimateId' | 'createdAt' | 'estimatedHours'> & {
            estimatedHours: number;
          })[];
        };
      };
    }) => {
      const id = randomUUID();
      const createdAt = new Date();
      const row: SavedEstimate = {
        ...data,
        id,
        createdAt,
        hourlyRate: new Prisma.Decimal(data.hourlyRate),
        risks: data.risks as Prisma.JsonValue,
        items: data.items.create.map((item) => ({
          ...item,
          id: randomUUID(),
          estimateId: id,
          createdAt,
          estimatedHours: new Prisma.Decimal(item.estimatedHours),
        })),
      };
      this.estimates.push(row);
      return row;
    },
    aggregate: async ({
      where,
    }: {
      where: { id: { in: string[] }; project: { userId: string } };
    }) => {
      const rows = this.estimates.filter(
        (row) =>
          where.id.in.includes(row.id) && this.estimateMatches(row, { project: where.project }),
      );
      const hours = rows.reduce((sum, row) => sum.add(row.totalHours), new Prisma.Decimal(0));
      return {
        _sum: { totalHours: rows.length ? hours : null },
        _avg: {
          totalHours: rows.length ? hours.div(rows.length) : null,
          confidence: rows.length
            ? rows.reduce((sum, row) => sum + row.confidence, 0) / rows.length
            : null,
        },
        _count: { _all: rows.length },
      };
    },
  };
  activityLog = {
    create: async ({
      data,
    }: {
      data: { userId: string; projectId: string; action: string; metadata?: Prisma.InputJsonValue };
    }) => {
      const row: ActivityLog = {
        ...data,
        id: randomUUID(),
        metadata: (data.metadata as Prisma.JsonValue) ?? null,
        createdAt: new Date(),
      };
      this.logs.push(row);
      return row;
    },
    findMany: async ({ where }: Find) =>
      this.logs
        .filter((row) => row.projectId === where?.projectId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
  };
  async $transaction<T>(callback: (tx: MemoryPrisma) => Promise<T>): Promise<T> {
    return callback(this);
  }
  async $runCommandRaw() {
    throw new Error('Use the mongodb provider');
  }
  async $queryRawUnsafe() {
    return [{ ok: 1 }];
  }
  async $queryRaw(strings: TemplateStringsArray) {
    if (strings.join('?').includes('FeatureKnowledge'))
      return [
        {
          id: 'reference-auth',
          name: 'Authentication',
          description: 'Secure identity and sessions',
          category: 'Identity',
          typicalHours: 12,
          complexity: 'MEDIUM',
          similarity: 1,
        },
      ];
    return [{ ok: 1 }];
  }
}
export class MemoryRedis {
  private values = new Map<string, { value: string; expires?: number }>();
  async get(key: string) {
    const row = this.values.get(key);
    if (row?.expires && row.expires < Date.now()) {
      this.values.delete(key);
      return null;
    }
    return row?.value ?? null;
  }
  async set(key: string, value: string, _mode?: string, ttl?: number) {
    this.values.set(key, { value, expires: ttl ? Date.now() + ttl * 1000 : undefined });
    return 'OK';
  }
  async del(key: string) {
    return Number(this.values.delete(key));
  }
  async incr(key: string) {
    const value = Number(await this.get(key)) + 1;
    await this.set(key, String(value));
    return value;
  }
  async eval(
    _script: string,
    _keyCount: number,
    key: string,
    expected: string,
    next: string,
    ttl: number,
  ) {
    const row = this.values.get(key);
    // Compare and replace synchronously to model a single Redis Lua operation.
    if (!row || row.value !== expected || (row.expires && row.expires < Date.now())) return 0;
    this.values.set(key, { value: next, expires: Date.now() + ttl * 1000 });
    return 1;
  }
  async ping() {
    return 'PONG';
  }
}
