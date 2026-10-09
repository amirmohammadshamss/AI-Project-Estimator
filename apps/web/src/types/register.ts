import { z } from 'zod';
import { registerSchema } from '../schemas/register';
export type RegisterForm = z.infer<typeof registerSchema>;
