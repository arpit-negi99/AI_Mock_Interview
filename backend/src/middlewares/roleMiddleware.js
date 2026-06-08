import { AppError } from '../utils/AppError.js';

export function allowRoles(...roles) {
  return (req, _res, next) => {
    if (!roles.includes(req.user?.role)) {
      return next(new AppError('You do not have permission to access this resource', 403));
    }
    return next();
  };
}
