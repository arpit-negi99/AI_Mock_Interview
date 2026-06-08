function clean(value) {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !key.startsWith('$') && !key.includes('.'))
        .map(([key, item]) => [key, clean(item)]),
    );
  }
  return value;
}

export function sanitizeMiddleware(req, _res, next) {
  if (req.body && typeof req.body === 'object') req.body = clean(req.body);
  if (req.params && typeof req.params === 'object') req.params = clean(req.params);
  next();
}
