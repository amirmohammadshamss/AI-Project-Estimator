import { z } from 'zod';
import { loginSchema } from '../schemas/login';
export type LoginForm = z.infer<typeof loginSchema>;
