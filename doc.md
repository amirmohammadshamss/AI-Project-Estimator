# AI Project Estimator

## 1. Project Overview

Build a production quality full stack web application called **AI Project Estimator**.

The application helps freelancers, software agencies, and developers estimate software projects using AI.

A user should be able to describe a project in natural language, for example:

> Build an e commerce platform with user authentication, product management, Stripe payments, an admin dashboard, and order management.

The system analyzes the description using an LLM and converts it into a structured project estimate containing features, tasks, estimated hours, complexity, suggested technologies, and estimated cost.

The application should also use semantic search to find similar features from a predefined knowledge base and use those results to improve the AI estimation.

The project should be designed as a real production style application, not as a simple demo or CRUD tutorial.

---

# 2. Main Goals

The application should demonstrate strong full stack engineering skills including:

- Modern frontend architecture
- Backend architecture
- REST API design
- Authentication and authorization
- PostgreSQL database design
- AI integration
- Structured LLM output
- Embeddings and semantic search
- Background processing
- Caching
- Testing
- Docker
- CI/CD
- Error handling
- Logging
- Security
- Clean architecture
- TypeScript

The code should be production oriented and maintainable.

---

# 3. Technology Stack

## Frontend

Use:

- Next.js
- React
- TypeScript
- Tailwind CSS
- React Hook Form
- Zod
- TanStack Query
- Recharts

Use the latest stable versions available at implementation time.

The frontend should use a clean component based architecture.

---

# 4. Backend

Use:

- NestJS
- TypeScript
- REST APIs
- PostgreSQL
- Prisma ORM
- Redis
- OpenAI API

The backend should follow a modular architecture.

Suggested modules:

```text
auth
users
projects
estimates
features
ai
embeddings
search
activity
health
```

Keep business logic inside services rather than controllers.

Controllers should primarily handle HTTP concerns.

---

# 5. Database

Use PostgreSQL with Prisma.

The main entities should include:

## User

```text
id
email
passwordHash
name
createdAt
updatedAt
```

## Project

```text
id
userId
name
description
status
createdAt
updatedAt
```

Possible statuses:

```text
DRAFT
ESTIMATED
ARCHIVED
```

## Estimate

```text
id
projectId
version
totalHours
totalCost
currency
confidence
summary
createdAt
updatedAt
```

## EstimateItem

```text
id
estimateId
feature
description
category
complexity
estimatedHours
estimatedCost
confidence
createdAt
```

Possible complexity values:

```text
LOW
MEDIUM
HIGH
VERY_HIGH
```

## FeatureKnowledge

This table stores reusable feature knowledge used by semantic search.

```text
id
name
description
category
typicalHours
complexity
embedding
createdAt
updatedAt
```

## ActivityLog

```text
id
userId
projectId
action
metadata
createdAt
```

---

# 6. Authentication

Implement secure authentication.

Users should be able to:

- Register
- Login
- Logout
- Get current user
- Refresh authentication
- Update profile

Use secure password hashing.

Passwords must never be stored in plain text.

Implement proper validation and authentication guards.

Users must only be able to access their own projects and estimates.

---

# 7. Project Management

The dashboard should allow users to create projects.

A project contains:

```text
Project Name
Project Description
```

Example:

```text
Name:
Food Delivery Platform

Description:
A mobile and web platform where customers can order food
from restaurants, track delivery status, and pay online.
```

Users should be able to:

- Create project
- View project
- Edit project
- Delete project
- Archive project
- Generate estimate
- View estimate history

---

# 8. AI Estimation

This is the main feature of the application.

When the user clicks:

**Generate Estimate**

the backend sends the project description to the AI service.

The AI should analyze the project and generate structured JSON.

Example:

```json
{
  "summary": "A food delivery platform with customer, restaurant and delivery workflows.",
  "features": [
    {
      "name": "User Authentication",
      "description": "Registration, login, password reset and social authentication.",
      "category": "Authentication",
      "complexity": "MEDIUM",
      "estimatedHours": 20,
      "confidence": 0.9
    },
    {
      "name": "Restaurant Management",
      "description": "Restaurant profiles, menus and availability management.",
      "category": "Business Logic",
      "complexity": "HIGH",
      "estimatedHours": 40,
      "confidence": 0.8
    }
  ],
  "suggestedStack": [
    "Next.js",
    "NestJS",
    "PostgreSQL",
    "Redis"
  ],
  "risks": [
    "Real time delivery tracking",
    "Payment integration",
    "Third party delivery APIs"
  ]
}
```

The AI response must be validated using a strict schema.

Never trust raw LLM output.

Use Zod or an equivalent schema validation mechanism.

If the AI returns invalid structured data, the backend should handle the failure gracefully.

---

# 9. Semantic Search

The application should maintain a knowledge base of common software features.

Examples:

```text
Authentication
OAuth
Google Login
Stripe Payments
Subscription Billing
Admin Dashboard
File Upload
Email Notifications
Push Notifications
Real Time Chat
Search
Recommendation System
Analytics
Role Based Access Control
```

Each feature should have an embedding.

When generating an estimate:

1. Analyze the project description.
2. Generate an embedding for the relevant text.
3. Search for similar features.
4. Retrieve the most relevant knowledge items.
5. Provide the retrieved information to the LLM.
6. Generate the final estimate.

This should behave like a lightweight RAG pipeline.

The system should return the most relevant features using similarity search.

If PostgreSQL supports vector search through pgvector, use pgvector.

Do not implement semantic search using simple string matching.

---

# 10. RAG Pipeline

The AI estimation pipeline should look approximately like this:

```text
User Project Description
        |
        v
Generate Embedding
        |
        v
Semantic Search
        |
        v
Retrieve Relevant Features
        |
        v
Build AI Context
        |
        v
LLM
        |
        v
Structured JSON
        |
        v
Schema Validation
        |
        v
Save Estimate
```

The implementation should keep the AI logic isolated inside an AI service.

Do not put OpenAI API calls directly inside controllers.

---

# 11. Cost Calculation

Allow users to define their hourly rate.

Example:

```text
Hourly Rate: $50
Estimated Hours: 185

Estimated Cost:
$9,250
```

The backend should calculate the final cost rather than asking the LLM to calculate it.

This is important because deterministic calculations should not depend on an LLM.

Use the formula:

```text
totalCost = totalHours × hourlyRate
```

The frontend should display:

```text
Estimated Hours
Hourly Rate
Estimated Cost
Confidence
```

---

# 12. Estimate Versions

Every time a user generates a new estimate, create a new version.

Example:

```text
Version 1
Version 2
Version 3
```

Users should be able to compare versions.

The old estimate must not be overwritten.

Each version should remain immutable after creation.

---

# 13. Dashboard

Create a modern professional dashboard.

The dashboard should show:

```text
Total Projects
Estimated Projects
Average Project Size
Total Estimated Hours
Average Estimate Confidence
```

Also show recent projects.

Example:

```text
Recent Projects

Food Delivery Platform
185 hours
$9,250
High confidence

SaaS Analytics Platform
240 hours
$12,000
Medium confidence
```

Use charts where appropriate.

For example:

- Estimated hours by project
- Project distribution by status
- Estimated cost over time

---

# 14. Project Details Page

The project details page should include:

## Project information

```text
Name
Description
Status
Created date
```

## Estimate summary

```text
Total Hours
Hourly Rate
Total Cost
Confidence
```

## Feature breakdown

Display each estimated feature in a table.

Columns:

```text
Feature
Category
Complexity
Hours
Cost
Confidence
```

Allow the user to edit estimated hours manually.

If the user changes an estimate manually, clearly indicate that the value was manually modified.

---

# 15. AI Explanation

The application should explain why an estimate was generated.

For example:

```text
Why is this estimate high?

The project contains:

• Real time communication
• Payment processing
• Role based access control
• Third party API integrations
• Admin workflows
```

The explanation should be generated by the AI but should not expose internal chain of thought.

Only provide concise, user facing reasoning and relevant factors.

---

# 16. Risk Detection

The AI should identify potential project risks.

Example:

```text
Potential Risks

High
Real time location tracking

Medium
Stripe payment integration

Medium
Third party delivery API dependency

Low
Email notification system
```

Each risk should include:

```text
title
description
severity
```

---

# 17. Technology Recommendations

The AI should recommend a technology stack based on the project.

Example:

```text
Frontend
Next.js

Backend
NestJS

Database
PostgreSQL

Cache
Redis

Payments
Stripe

Infrastructure
Docker
AWS
```

The recommendations should be generated from the project requirements rather than being hardcoded.

---

# 18. Activity Logs

Track important actions.

Examples:

```text
PROJECT_CREATED
PROJECT_UPDATED
ESTIMATE_GENERATED
ESTIMATE_UPDATED
ESTIMATE_EXPORTED
PROJECT_ARCHIVED
```

Display the activity history on the project page.

---

# 19. PDF Export

Users should be able to export an estimate as a professional PDF.

The PDF should contain:

```text
Company / User Name

Project Name

Project Description

Executive Summary

Estimated Hours

Estimated Cost

Feature Breakdown

Technology Recommendations

Risks

Confidence

Generated Date
```

The PDF should look professional and suitable for sending to a client.

---

# 20. API Design

Use RESTful APIs.

Example endpoints:

```text
POST   /auth/register
POST   /auth/login
POST   /auth/logout
POST   /auth/refresh
GET    /auth/me

GET    /projects
POST   /projects
GET    /projects/:id
PATCH  /projects/:id
DELETE /projects/:id

POST   /projects/:id/estimates
GET    /projects/:id/estimates
GET    /projects/:id/estimates/:estimateId

GET    /projects/:id/activity

GET    /dashboard/stats

POST   /estimates/:id/export
```

Use proper HTTP status codes.

Implement global exception handling.

Validate all request bodies.

---

# 21. API Documentation

Add Swagger / OpenAPI documentation.

The backend should expose:

```text
/api/docs
```

Document:

- Authentication
- Projects
- Estimates
- Dashboard
- Activity logs

Include request and response schemas.

---

# 22. Error Handling

Implement centralized error handling.

The API should return consistent errors.

Example:

```json
{
  "statusCode": 400,
  "code": "INVALID_PROJECT",
  "message": "Project description is required."
}
```

Do not expose internal stack traces to users.

Log internal errors securely.

---

# 23. Security

Implement basic production security practices.

Requirements:

- Password hashing
- JWT security
- Refresh token rotation
- Input validation
- Rate limiting
- CORS configuration
- Secure HTTP headers
- Environment variables for secrets
- No API keys committed to Git
- Authorization checks
- SQL injection protection through Prisma
- Request size limits

Never expose the OpenAI API key to the frontend.

All AI requests must go through the backend.

---

# 24. Redis

Use Redis for caching where appropriate.

Possible use cases:

- Dashboard statistics
- Semantic search results
- Rate limiting
- Temporary AI job state

Do not add Redis just for the sake of having Redis.

Only use it where it provides a clear architectural benefit.

---

# 25. Background Jobs

AI estimation can be implemented as an asynchronous job.

Preferred flow:

```text
POST /projects/:id/estimates

        |
        v

Create estimation job

        |
        v

Return job ID

        |
        v

Background worker

        |
        v

Generate embedding

        |
        v

Semantic search

        |
        v

LLM generation

        |
        v

Validate result

        |
        v

Save estimate
```

The frontend should display the estimation status:

```text
Queued
Processing
Completed
Failed
```

If implementing background jobs adds unnecessary complexity for the first version, create a clean abstraction so it can be introduced later.

---

# 26. Testing

The project must include tests.

## Backend

Use Jest.

Test:

- Authentication
- Project creation
- Authorization
- Estimate generation
- Cost calculation
- AI response validation
- Semantic search
- Error handling

## Frontend

Test important components and user flows.

## End to End

Use Playwright.

At minimum test:

```text
Register
Login
Create project
Generate estimate
View estimate
Export estimate
```

Mock the AI API during tests.

Tests must not require a real OpenAI API key.

---

# 27. Docker

Provide Docker support.

The application should be runnable with:

```text
docker compose up
```

Docker Compose should include:

```text
web
api
postgres
redis
```

Provide a development configuration and make it easy to run locally.

---

# 28. Environment Variables

Provide a `.env.example`.

Example:

```text
DATABASE_URL=
REDIS_URL=

JWT_SECRET=
JWT_REFRESH_SECRET=

OPENAI_API_KEY=

NEXT_PUBLIC_API_URL=
```

Never commit `.env`.

---

# 29. CI/CD

Create GitHub Actions workflows.

The CI pipeline should:

```text
Install dependencies
Run lint
Run type checking
Run unit tests
Run integration tests
Build frontend
Build backend
```

The pipeline should fail if any important step fails.

---

# 30. Code Quality

Use strict TypeScript.

Avoid:

```text
any
```

unless absolutely necessary.

Use:

- ESLint
- Prettier
- TypeScript strict mode
- Clear naming
- Small functions
- Dependency injection
- Separation of concerns

Do not create unnecessary abstractions.

Prefer readable and maintainable code over over engineering.

---

# 31. Frontend UX

The UI should look like a modern SaaS product.

Design principles:

- Clean
- Minimal
- Professional
- Responsive
- Mobile friendly
- Accessible
- Fast

Important pages:

```text
/login
/register
/dashboard
/projects
/projects/[id]
/projects/[id]/estimate/[estimateId]
/settings
```

Include:

- Loading states
- Skeleton loaders
- Empty states
- Error states
- Toast notifications
- Confirmation dialogs

Do not make the interface look like a generic AI chatbot.

The product should feel like a real business application.

---

# 32. Responsive Design

The application must work on:

```text
Desktop
Tablet
Mobile
```

The dashboard should adapt to smaller screens.

Tables should become horizontally scrollable or transform into mobile friendly cards.

---

# 33. Seed Data

Create database seed scripts.

Include realistic example data such as:

```text
Authentication
Google OAuth
Stripe Payments
Subscription Billing
Admin Dashboard
Real Time Chat
File Upload
Email Notifications
Push Notifications
Search
Analytics
Role Based Access Control
```

Create several demo projects and estimates.

---

# 34. README

Create a high quality README.

The README should include:

## Project Overview

Explain what the application does.

## Features

List the major features.

## Architecture

Include an architecture diagram.

Example:

```text
                    ┌──────────────┐
                    │   Next.js    │
                    │   Frontend   │
                    └──────┬───────┘
                           │
                           │ REST
                           ▼
                    ┌──────────────┐
                    │   NestJS     │
                    │     API      │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
        PostgreSQL       Redis       AI Service
              │                         │
              │                         ▼
              │                    OpenAI API
              │
              ▼
           pgvector
```

## Local Development

Explain how to run the project.

## Environment Variables

Document every required environment variable.

## Database Setup

Explain migrations and seed commands.

## Testing

Explain how to run tests.

## Docker

Explain how to run the application using Docker Compose.

## API Documentation

Explain where Swagger is available.

## Architecture Decisions

Explain important technical decisions.

## Future Improvements

Include realistic future improvements.

---

# 35. GitHub Repository

The repository should look professional.

Use meaningful commits.

Examples:

```text
feat: initialize monorepo
feat: add authentication
feat: implement project management
feat: add AI estimation pipeline
feat: add semantic search
feat: add estimate versioning
feat: add dashboard analytics
feat: add PDF export
test: add estimation service tests
ci: add GitHub Actions workflow
docs: add architecture documentation
```

Do not make one giant commit containing the entire project.

---

# 36. Monorepo

Use a monorepo structure.

Recommended:

```text
apps/
  web/
  api/

packages/
  shared/
  types/
  config/
```

Use a modern package manager such as pnpm.

If using Turborepo provides a clear benefit, use it.

Otherwise keep the monorepo simple.

---

# 37. Important Engineering Requirements

Do not build this as a tutorial project.

The final result should look like something a professional software engineer could show during a technical interview.

The implementation should prioritize:

```text
Correctness
Maintainability
Security
Testing
Good architecture
Clear documentation
Good UX
```

Do not blindly add technologies just to make the stack look impressive.

Every major technology should have a practical reason for being included.

---

# 38. AI Service Architecture

Create a dedicated AI abstraction.

For example:

```text
AiService
    |
    +── generateEstimate()
    |
    +── generateEmbedding()
    |
    +── explainEstimate()
    |
    +── detectRisks()
```

The rest of the application should not depend directly on the OpenAI SDK.

This makes the system easier to test and allows the AI provider to be replaced later.

---

# 39. Deterministic vs AI Logic

Clearly separate deterministic business logic from AI generated data.

The AI can determine:

```text
Features
Complexity
Estimated hours
Risks
Technology recommendations
Confidence
```

The backend should determine:

```text
Authentication
Authorization
Total cost
Database persistence
Estimate versioning
Permissions
Validation
Activity logs
```

Do not let the LLM make decisions that should be handled by deterministic application logic.

---

# 40. Final Acceptance Criteria

The project is considered complete when a new developer can clone the repository and run:

```text
pnpm install

docker compose up
```

Then open the application and:

```text
1. Register an account
2. Login
3. Create a project
4. Enter a project description
5. Generate an AI estimate
6. View generated features
7. View estimated hours
8. View estimated cost
9. View risks
10. View technology recommendations
11. Edit an estimate
12. Generate another estimate version
13. Compare versions
14. View activity history
15. Export the estimate as PDF
```

All important functionality must have automated tests.

The project must have no hardcoded secrets.

The application should handle API failures and AI failures gracefully.

The final GitHub repository should be polished enough to be included in a professional Full Stack Developer portfolio.

---

# 41. Implementation Strategy

Build the project incrementally.

Do not attempt to implement everything in one step.

Recommended order:

### Phase 1

Project setup

Monorepo

Next.js

NestJS

PostgreSQL

Prisma

Docker

ESLint

Prettier

TypeScript configuration

### Phase 2

Authentication

Users

JWT

Authorization

### Phase 3

Projects

CRUD

Project dashboard

Activity logs

### Phase 4

Estimate domain

Estimate versions

Estimate items

Cost calculation

### Phase 5

AI integration

OpenAI abstraction

Structured output

Validation

Error handling

### Phase 6

Semantic search

Embeddings

pgvector

Knowledge base

RAG pipeline

### Phase 7

Dashboard

Charts

Analytics

### Phase 8

PDF export

### Phase 9

Testing

Unit tests

Integration tests

End to end tests

### Phase 10

CI/CD

GitHub Actions

Production build

Documentation

Final cleanup

---

# 42. Development Rules

Before implementing each major feature:

1. Understand the existing architecture.
2. Reuse existing abstractions where appropriate.
3. Do not duplicate business logic.
4. Keep TypeScript strict.
5. Add tests for important business logic.
6. Update documentation when architecture changes.
7. Do not introduce dependencies without a clear reason.
8. Do not expose secrets.
9. Handle errors explicitly.
10. Keep the code production quality.

If there are multiple reasonable architectural choices, choose the simplest solution that satisfies the requirements and document the decision.

Do not over engineer the application.

The final result should be a realistic AI powered SaaS application that demonstrates strong Full Stack engineering skills rather than simply demonstrating an API call to an LLM.
