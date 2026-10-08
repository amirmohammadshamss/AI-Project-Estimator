import { Prisma } from '@prisma/client';
import { ReportEstimate } from '../../src/estimates/estimate-pdf.service';
export function reportFixture(): ReportEstimate {
  const createdAt = new Date('2026-10-08T12:00:00Z');
  const features = [
    [
      'Authentication',
      'Identity',
      'MEDIUM',
      24,
      'Account registration, password recovery and secure sessions.',
    ],
    [
      'Payment processing',
      'Payments',
      'HIGH',
      40,
      'Checkout, payment webhooks, reconciliation and handling of failed payments.',
    ],
    [
      'Admin dashboard',
      'Administration',
      'MEDIUM',
      32,
      'Operational screens for orders, users, refunds and reporting.',
    ],
  ] as const;
  return {
    id: 'estimate-1',
    projectId: 'project-1',
    version: 2,
    projectName: 'Delivery Operations Platform',
    projectDescription:
      'A web platform for regional delivery teams. Customers place and pay for orders while dispatchers manage assignments and monitor progress. Role-based access separates customer, driver and administrator workflows.',
    summary:
      'The estimate covers authentication, payment processing and an operational dashboard. Payment integration carries the greatest uncertainty because reconciliation and provider webhooks need careful testing. Hours include implementation and feature-level testing; deployment and ongoing support require separate planning.',
    hourlyRate: new Prisma.Decimal(100),
    currency: 'USD',
    totalHours: new Prisma.Decimal(96),
    totalCost: new Prisma.Decimal(9600),
    confidence: 0.85,
    suggestedStack: [
      'Next.js for customer and dispatcher screens',
      'NestJS for the authenticated API',
      'PostgreSQL for orders and assignments',
      'Stripe for hosted checkout and webhooks',
    ],
    risks: [
      {
        title: 'Payment webhook reliability',
        description: 'Duplicate or delayed events need idempotent processing and reconciliation.',
        severity: 'HIGH',
      },
      {
        title: 'External delivery integration',
        description: 'Provider availability and API limits may affect delivery status updates.',
        severity: 'MEDIUM',
      },
    ],
    createdAt,
    items: features.map(([name, category, complexity, hours, description], index) => ({
      id: `item-${index}`,
      estimateId: 'estimate-1',
      name,
      description,
      category,
      complexity,
      estimatedHours: new Prisma.Decimal(hours),
      estimatedCost: new Prisma.Decimal(hours * 100),
      confidence: 0.85,
      manuallyModified: index === 1,
      position: index,
      createdAt,
    })),
    project: {
      id: 'project-1',
      userId: 'user-1',
      name: 'Current project name',
      description: 'Current project description',
      status: 'ESTIMATED',
      createdAt,
      updatedAt: createdAt,
      user: { name: 'Jean Dupont', email: 'jean@example.com' },
    },
  };
}
