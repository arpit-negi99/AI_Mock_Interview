export function sanitizeInput(value) {
  if (typeof value === 'string') {
    return value.trim().replace(/\s+/g, ' ');
  }
  if (Array.isArray(value)) return value.map(sanitizeInput);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitizeInput(item)]));
  }
  return value;
}
