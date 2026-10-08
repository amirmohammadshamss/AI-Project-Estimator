// Reference baselines for common features, not guaranteed project-specific hours.
export const KNOWLEDGE_BASE = [
  {
    name: 'Authentication',
    description: 'Password registration, login, logout, session management and password recovery.',
    category: 'Identity',
    typicalHours: 24,
    complexity: 'MEDIUM',
  },
  {
    name: 'OAuth',
    description:
      'Connect external identity providers using OAuth authorization flows and account linking.',
    category: 'Identity',
    typicalHours: 20,
    complexity: 'MEDIUM',
  },
  {
    name: 'Google Login',
    description: 'Sign in with Google and link Google identities to user accounts.',
    category: 'Identity',
    typicalHours: 12,
    complexity: 'MEDIUM',
  },
  {
    name: 'Stripe Payments',
    description:
      'Checkout, payment processing, payment webhooks and failed-payment handling with Stripe.',
    category: 'Payments',
    typicalHours: 32,
    complexity: 'HIGH',
  },
  {
    name: 'Subscription Billing',
    description:
      'Recurring plans, upgrades, cancellations, invoicing and subscription lifecycle webhooks.',
    category: 'Payments',
    typicalHours: 48,
    complexity: 'HIGH',
  },
  {
    name: 'Admin Dashboard',
    description: 'Administrative management screens for users, content and operational workflows.',
    category: 'Administration',
    typicalHours: 40,
    complexity: 'MEDIUM',
  },
  {
    name: 'File Upload',
    description:
      'Upload files with size/type validation, object storage and download access controls.',
    category: 'Storage',
    typicalHours: 16,
    complexity: 'MEDIUM',
  },
  {
    name: 'Email Notifications',
    description:
      'Transactional email templates, delivery integration and event-based email notifications.',
    category: 'Notifications',
    typicalHours: 16,
    complexity: 'MEDIUM',
  },
  {
    name: 'Push Notifications',
    description:
      'Device registration, notification delivery, opt-in preferences and notification routing.',
    category: 'Notifications',
    typicalHours: 24,
    complexity: 'MEDIUM',
  },
  {
    name: 'Real Time Chat',
    description: 'Live messaging, conversation history, presence indicators and realtime delivery.',
    category: 'Communication',
    typicalHours: 48,
    complexity: 'HIGH',
  },
  {
    name: 'Search',
    description: 'Search content with filters, sorting, pagination and relevance ranking.',
    category: 'Discovery',
    typicalHours: 24,
    complexity: 'MEDIUM',
  },
  {
    name: 'Recommendation System',
    description:
      'Personalized content or product recommendations based on user behavior and preferences.',
    category: 'Discovery',
    typicalHours: 64,
    complexity: 'HIGH',
  },
  {
    name: 'Analytics',
    description: 'Event tracking, reporting dashboards, metrics aggregation and usage trends.',
    category: 'Reporting',
    typicalHours: 32,
    complexity: 'MEDIUM',
  },
  {
    name: 'Role Based Access Control',
    description: 'Roles, permission policies and authorization checks across protected resources.',
    category: 'Identity',
    typicalHours: 24,
    complexity: 'MEDIUM',
  },
] as const;
