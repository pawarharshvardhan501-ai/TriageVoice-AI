import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { dbService } from '../config/db.js';
import { validateBody, LoginSchema, RegisterSchema } from '../middleware/validate.js';
import { authenticateToken } from '../middleware/auth.js';

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_clinical_jwt_key_98765';
const ADMIN_REGISTRATION_KEY = process.env.ADMIN_REGISTRATION_KEY || 'triage-admin-secure-2025';

/**
 * POST /api/auth/login
 * Clinical staff authentication
 */
router.post('/login', validateBody(LoginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await dbService.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid clinical credentials.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid clinical credentials.'
      });
    }

    const payload = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    return res.json({
      success: true,
      message: 'Authentication successful',
      token,
      user: payload
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error during authentication.' });
  }
});

/**
 * POST /api/auth/register
 * Create medical staff account (Protected via Admin Key)
 */
router.post('/register', validateBody(RegisterSchema), async (req, res) => {
  try {
    const { email, password, full_name, role, admin_key } = req.body;

    // Verify admin key or existing admin token
    if (admin_key !== ADMIN_REGISTRATION_KEY) {
      // Check if bearer token is provided and user is admin
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      let isAuthorizedAdmin = false;

      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          if (decoded.role === 'ADMIN') isAuthorizedAdmin = true;
        } catch (_) {}
      }

      if (!isAuthorizedAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Valid admin registration key required to register new clinical staff.'
        });
      }
    }

    const existingUser = await dbService.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'A staff account with this email address already exists.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = await dbService.createUser({
      email,
      password_hash,
      full_name,
      role
    });

    return res.status(201).json({
      success: true,
      message: 'Clinical staff member registered successfully.',
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create staff account.' });
  }
});

/**
 * GET /api/auth/me
 * Retrieve authenticated profile
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await dbService.findUserByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User profile not found.' });
    }
    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        created_at: user.created_at
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch user profile.' });
  }
});

export default router;
