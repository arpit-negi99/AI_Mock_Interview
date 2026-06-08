import { AppError } from '../utils/AppError.js';

export function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      return next(new AppError('Validation failed', 422, result.error.flatten()));
    }

    req.validated = result.data;
    return next();
  };
}
