import { ACTIVITY_LABELS } from '../content/activity';

export function describeActivity(action: string): string {
  return ACTIVITY_LABELS[action] ?? action;
}
