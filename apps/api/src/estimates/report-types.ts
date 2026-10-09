import { Prisma } from '@prisma/client';
export type ReportEstimate = Prisma.EstimateGetPayload<{
  include: { items: true; project: { include: { user: { select: { name: true; email: true } } } } };
}>;
