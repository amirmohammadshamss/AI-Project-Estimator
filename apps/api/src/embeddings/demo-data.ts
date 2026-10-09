export const DEMO_PROJECTS = [
  {
    name: 'Demo: Customer Portal',
    description:
      'A customer portal with secure login, profile management, notifications and an administrator dashboard.',
    features: [
      {
        name: 'Authentication',
        description: 'Login, account recovery and sessions.',
        category: 'Identity',
        complexity: 'MEDIUM',
        estimatedHours: 24,
        confidence: 0.85,
      },
      {
        name: 'Customer dashboard',
        description: 'Profile and account overview screens.',
        category: 'Interface',
        complexity: 'MEDIUM',
        estimatedHours: 32,
        confidence: 0.8,
      },
    ],
  },
  {
    name: 'Demo: Subscription Platform',
    description:
      'A subscription service with customer login, recurring billing, plan changes and operational reporting.',
    features: [
      {
        name: 'Subscription billing',
        description: 'Plans, checkout, cancellation and webhooks.',
        category: 'Payments',
        complexity: 'HIGH',
        estimatedHours: 48,
        confidence: 0.75,
      },
      {
        name: 'Reporting',
        description: 'Subscription and revenue overview screens.',
        category: 'Analytics',
        complexity: 'MEDIUM',
        estimatedHours: 24,
        confidence: 0.8,
      },
    ],
  },
];
