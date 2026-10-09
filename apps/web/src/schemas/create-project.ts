import { validationTexts } from '../content/create-project-validation';
import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1, validationTexts.projectNameIsRequired).max(200),
  description: z.string().min(1, validationTexts.projectDescriptionIsRequired).max(5000),
});
