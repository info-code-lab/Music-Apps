import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { insertUserSchema, type User } from '@shared/schema';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '7d';

export interface AuthRequest extends Request {
  user?: User;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(user: User): string {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  try {
    const user = await storage.getUser(decoded.id);
    if (!user) {
      return res.status(403).json({ error: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Authentication error' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

export function requireArtist(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || (req.user.role !== 'artist' && req.user.role !== 'admin')) {
    return res.status(403).json({ error: 'Artist access required' });
  }
  next();
}

export function requireRole(roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role || '')) {
      return res.status(403).json({ error: `Access denied. Required roles: ${roles.join(', ')}` });
    }
    next();
  };
}

// Rate limiting for auth endpoints
export function rateLimitAuth() {
  const attempts = new Map<string, { count: number; lastAttempt: number }>();
  const MAX_ATTEMPTS = 5;
  const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const record = attempts.get(ip);

    if (record) {
      if (now - record.lastAttempt > WINDOW_MS) {
        // Reset after window
        attempts.set(ip, { count: 1, lastAttempt: now });
      } else if (record.count >= MAX_ATTEMPTS) {
        return res.status(429).json({ 
          error: 'Too many login attempts. Please try again later.' 
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

export async function login(req: Request, res: Response) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Note: This legacy auth system is deprecated - use phone authentication instead
    return res.status(400).json({ error: 'Username/password login is deprecated. Use phone authentication instead.' });

    // This code path is no longer reached
    
    // Return user data
    const userWithoutPassword = user;
    
    res.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
}

export async function register(req: Request, res: Response) {
  try {
    const userData = insertUserSchema.parse(req.body);
    
    // Note: This legacy registration system is deprecated - use phone authentication instead
    return res.status(400).json({ error: 'Registration is deprecated. Use phone authentication instead.' });

    // This code path is no longer reached
    const token = "";
    
    // This code path is no longer reached
    const userWithoutPassword = {};
    
    res.status(201).json({
      message: 'Registration successful',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('validation')) {
      return res.status(400).json({ error: 'Invalid user data' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
}

export function getCurrentUser(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  // Return user data
  const userWithoutPassword = req.user;
  res.json(userWithoutPassword);
}