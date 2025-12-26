const createError = require("http-errors");

function roleMiddleware(allowedRoles) {
  return (req, res, next) => {
    try {
      // Kiểm tra xem user đã được xác thực chưa
      if (!req.user || !req.user.role) {
        throw createError(401, "Authentication required");
      }

      // Kiểm tra role có hợp lệ không
      if (!allowedRoles.includes(req.user.role)) {
        throw createError(403, "Insufficient permissions");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = roleMiddleware;
