export interface SafeUser {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}
