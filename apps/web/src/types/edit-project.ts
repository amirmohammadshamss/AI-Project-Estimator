import { z } from 'zod';
import { editProjectSchema } from '../schemas/edit-project';
export type EditProjectForm = z.infer<typeof editProjectSchema>;
