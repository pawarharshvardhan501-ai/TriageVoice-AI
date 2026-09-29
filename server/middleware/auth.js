import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_clinical_jwt_key_98765';

/**
 * Verifies JWT token and attaches user payload to req.user
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access denied: Authentication token required for clinical operations.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired clinical session token. Please log in again.'
    });
  }
};

/**
 * Restricts access to specific clinical staff roles
 * @param {string[]} allowedRoles - e.g. ['ADMIN', 'DOCTOR', 'NURSE']
 */
export const requireRole = (allowedRoles = []) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: `Access denied: Action requires one of the following roles: ${allowedRoles.join(', ')}`
    });
  }

  next();
};
