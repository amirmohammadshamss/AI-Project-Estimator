import type { Project } from '../hooks/use-projects';

export interface ProjectEditFormProps {
  project: Project;
  onCancel: () => void;
  onSaved: () => void;
}
