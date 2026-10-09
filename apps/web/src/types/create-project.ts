import { z } from 'zod';
import { createProjectSchema } from '../schemas/create-project';
export type CreateProjectForm = z.infer<typeof createProjectSchema>;
