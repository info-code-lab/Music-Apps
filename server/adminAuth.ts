import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { storage } from './storage';
import { insertAdminUserSchema, type User } from '@shared/schema';
import { z } from 'zod';

const JWT_SECRET = process.env.JWT_SECRET || (() => {
  console.error('⚠️  WARNING: JWT_SECRET not set in environment variables! Using fallback.');
  return 'insecure-fallback-key-change-in-production';
})();
const JWT_EXPIRES_IN = '7d';

// Admin login schema
const adminLoginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

// Admin registration schema (extends insert schema)
const adminRegisterSchema = insertAdminUserSchema.extend({
  password: z.string().min(8, "Password must be at least 8 characters")
}).transform(async (data) => {
  // Hash the password before returning
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(data.password, salt);
  return {
    ...data,
    passwordHash,
    role: 'admin' as const
  };
});

function generateAdminToken(user: User): string {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role,
      type: 'admin' // Mark as admin token
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export async function adminLogin(req: Request, res: Response) {
  try {
    const { username, password } = adminLoginSchema.parse(req.body);

    // Get user by username
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Check if user has password hash
    if (!user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateAdminToken(user);
    
    // Return user data without password hash
    const { passwordHash: _, ...userWithoutPassword } = user;
    
    res.json({
      message: 'Admin login successful',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Admin login error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: 'Admin login failed' });
  }
}

export async function adminRegister(req: Request, res: Response) {
  try {
    // Security: Check if any admin already exists - only allow first admin creation
    const existingAdmins = await storage.getUsersByRole('admin');
    if (existingAdmins && existingAdmins.length > 0) {
      return res.status(403).json({ 
        error: 'Admin registration is disabled. Admin users already exist.' 
      });
    }
    
    // Extract password from body to transform it
    const { password, ...userData } = req.body;
    
    // Validate password requirements
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }
    
    // Validate basic data structure
    const basicData = insertAdminUserSchema.parse({
      ...userData,
      passwordHash: 'placeholder' // Will be replaced by actual hash
    });
    
    // Check if admin already exists
    if (!basicData.username) {
      return res.status(400).json({ error: 'Username is required for admin users' });
    }
    const existingUser = await storage.getUserByUsername(basicData.username);
    if (existingUser) {
      return res.status(400).json({ error: 'Admin user already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Create admin user
    const newAdmin = await storage.createUser({
      ...basicData,
      passwordHash,
      role: 'admin'
    } as any); // Temporary cast until storage interface is updated

    const token = generateAdminToken(newAdmin);
    
    // Return user data without password hash
    const { passwordHash: _, ...adminWithoutPassword } = newAdmin;
    
    res.status(201).json({
      message: 'Admin registration successful',
      token,
      user: adminWithoutPassword
    });
  } catch (error) {
    console.error('Admin registration error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: 'Admin registration failed' });
  }
}

// Rate limiting for admin auth endpoints
export function rateLimitAdminAuth() {
  const attempts = new Map<string, { count: number; lastAttempt: number }>();
  const MAX_ATTEMPTS = 5;
  const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

  return (req: Request, res: Response, next: any) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const record = attempts.get(ip);

    if (record) {
      if (now - record.lastAttempt > WINDOW_MS) {
        // Reset after window
        attempts.set(ip, { count: 1, lastAttempt: now });
      } else if (record.count >= MAX_ATTEMPTS) {
        return res.status(429).json({ 
          error: 'Too many admin login attempts. Please try again later.' 
        });
      } else {
        record.count++;
        record.lastAttempt = now;
      }
    } else {
      attempts.set(ip, { count: 1, lastAttempt: now });
    }

    next();
  };
}