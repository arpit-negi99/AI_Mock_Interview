import { format, formatDistanceToNow } from 'date-fns';

export function formatDate(date, pattern = 'MMM d, yyyy') {
  return date ? format(new Date(date), pattern) : 'Not available';
}

export function formatRelativeTime(date) {
  return date ? `${formatDistanceToNow(new Date(date))} ago` : 'Not available';
}

export function percent(value) {
  return `${Math.round(Number(value || 0))}%`;
}
