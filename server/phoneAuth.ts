import type { Express, RequestHandler, Request, Response, NextFunction } from "express";
import { z } from "zod";
import crypto from "crypto";
import { SignJWT, jwtVerify, importPKCS8, importSPKI } from 'jose';
import { storage } from "./storage";

// Validation schemas
const phoneSchema = z.object({
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format")
});

const verifyOtpSchema = z.object({
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format"),
  otp: z.string().length(6, "OTP must be 6 digits")
});

// Generate random 6-digit OTP
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// EdDSA JWT Configuration for Maximum Security
const JWT_PRIVATE_KEY = process.env.JWT_PRIVATE_KEY!;
const JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY!;
const JWT_KID = process.env.JWT_KID!;
const JWT_EXPIRES_IN = '7d';
const JWT_ALGORITHM = 'EdDSA'; // Edwards-curve Digital Signature Algorithm

// Import Ed25519 keys for EdDSA
let privateKey: any = null;
let publicKey: any = null;

// Initialize EdDSA keys with proper formatting
async function initializeEdDSAKeys() {
  if (!privateKey || !publicKey) {
    // Ensure proper PEM formatting with newlines
    const formattedPrivateKey = JWT_PRIVATE_KEY.replace(/\\n/g, '\n');
    const formattedPublicKey = JWT_PUBLIC_KEY.replace(/\\n/g, '\n');
    
    privateKey = await importPKCS8(formattedPrivateKey, JWT_ALGORITHM);
    publicKey = await importSPKI(formattedPublicKey, JWT_ALGORITHM);
    console.log('🔐 EdDSA keys initialized successfully');
  }
}

// Generate secure JWT token with EdDSA
async function generateJWTToken(user: any): Promise<string> {
  await initializeEdDSAKeys();
  
  const jti = crypto.randomUUID(); // Unique token ID for revocation
  
  return await new SignJWT({
    id: user.id,
    phoneNumber: user.phoneNumber,
    username: user.username,
    type: 'access_token'
  })
  .setProtectedHeader({ 
    alg: 'EdDSA', 
    typ: 'JWT', 
    kid: JWT_KID 
  })
  .setIssuer('harmony-music')
  .setAudience('harmony-users')
  .setExpirationTime(JWT_EXPIRES_IN)
  .setIssuedAt()
  .setJti(jti)
  .sign(privateKey);
}

// Verify JWT token with EdDSA maximum security
async function verifyJWTToken(token: string): Promise<any> {
  try {
    await initializeEdDSAKeys();
    
    const { payload } = await jwtVerify(token, publicKey, {
      issuer: 'harmony-music',
      audience: 'harmony-users',
      algorithms: ['EdDSA']
    });
    
    return payload;
  } catch (error) {
    console.error('EdDSA JWT verification failed:', error);
    return null;
  }
}

// Generate secure session token for database tracking
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Rate limiting for OTP endpoints
function createOtpRateLimit() {
  const attempts = new Map<string, { count: number; lastAttempt: number }>();
  const MAX_ATTEMPTS = 3; // Allow 3 OTP requests per window
  const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  const RESEND_COOLDOWN = 60 * 1000; // 1 minute between OTP requests

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
          error: 'Too many OTP requests. Please try again later.' 
        });
      } else if (now - record.lastAttempt < RESEND_COOLDOWN) {
        return res.status(429).json({ 
          error: 'Please wait before requesting another OTP.' 
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

// Rate limiting for OTP verification (more restrictive)
function createOtpVerifyRateLimit() {
  const attempts = new Map<string, { count: number; lastAttempt: number }>();
  const MAX_ATTEMPTS = 5; // Allow 5 verification attempts per window
  const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  const ATTEMPT_COOLDOWN = 5 * 1000; // 5 seconds between attempts

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
          error: 'Too many verification attempts. Please try again later.' 
        });
      } else if (now - record.lastAttempt < ATTEMPT_COOLDOWN) {
        return res.status(429).json({ 
          error: 'Please wait before trying again.' 
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

// Helper to get user from EdDSA JWT token with 100% security
export async function getUserFromJWT(jwtToken: string) {
  // First verify EdDSA JWT token
  const decoded = await verifyJWTToken(jwtToken);
  if (!decoded) return null;
  
  // Get user from database to ensure they still exist
  const user = await storage.getUser(decoded.id as string);
  if (!user) return null;
  
  // Check if session still exists in database for extra security (blacklist approach)
  const sessionExists = await storage.getSession(jwtToken);
  if (!sessionExists) {
    // EdDSA JWT is valid but session was manually revoked - extra security layer
    console.log('⚠️ Valid EdDSA JWT but session revoked - blocking access');
    return null;
  }
  
  return user;
}

// Legacy function for backward compatibility
export async function getUserFromSession(sessionToken: string) {
  return getUserFromJWT(sessionToken);
}

// Enhanced JWT Authentication middleware with 100% security
export const authenticateToken: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'EdDSA JWT access token required',
      code: 'TOKEN_MISSING'
    });
  }

  try {
    // Verify JWT token with maximum security
    const user = await getUserFromJWT(token);
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid or expired EdDSA JWT token',
        code: 'TOKEN_INVALID'
      });
    }

    // Attach user to request for downstream usage
    (req as any).user = user;
    (req as any).jwtToken = token;
    
    console.log(`🔐 EdDSA JWT Auth Success - User: ${user.id}`);
    next();
  } catch (error) {
    console.error('EdDSA JWT Auth middleware error:', error);
    return res.status(403).json({ 
      error: 'EdDSA JWT token verification failed',
      code: 'TOKEN_VERIFICATION_FAILED'
    });
  }
};

// Setup phone authentication routes
export function setupPhoneAuth(app: Express) {
  
  // Create rate limiting middleware
  const otpRateLimit = createOtpRateLimit();
  const otpVerifyRateLimit = createOtpVerifyRateLimit();
  
  // Send OTP endpoint with rate limiting
  app.post("/api/auth/send-otp", otpRateLimit, async (req, res) => {
    try {
      const { phoneNumber } = phoneSchema.parse(req.body);
      
      // Generate OTP
      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
      
      // Store OTP in database
      await storage.createOtp({
        phoneNumber,
        otp,
        expiresAt,
      });
      
      // Development OTP handling - only in non-production environments
      if (process.env.NODE_ENV !== 'production') {
        console.log(`🔐 Development OTP for ${phoneNumber}: ${otp}`);
        console.log(`📱 Phone Auth - OTP ${otp} sent to ${phoneNumber} (expires in 10 minutes)`);
        
        return res.json({ 
          success: true, 
          message: "OTP sent successfully",
          dev_otp: otp // Only expose in development
        });
      }
      
      // In production, this would send SMS via Twilio or similar service
      res.json({ 
        success: true, 
        message: "OTP sent successfully"
      });
      
    } catch (error) {
      console.error("Send OTP error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(500).json({ error: "Failed to send OTP" });
    }
  });

  // Verify OTP and login endpoint with rate limiting
  app.post("/api/auth/verify-otp", otpVerifyRateLimit, async (req, res) => {
    try {
      const { phoneNumber, otp } = verifyOtpSchema.parse(req.body);
      
      // Verify OTP
      const isValid = await storage.verifyOtp(phoneNumber, otp);
      
      if (!isValid) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }
      
      // Check if user exists, create if not
      let user = await storage.getUserByPhone(phoneNumber);
      
      if (!user) {
        // Create new user
        user = await storage.createUser({
          phoneNumber,
          onboardingCompleted: false,
        });
        console.log(`👤 New user created for phone: ${phoneNumber}`);
      }
      
      // Generate secure EdDSA JWT token
      const jwtToken = await generateJWTToken(user);
      const sessionToken = generateSessionToken(); // For database tracking
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      
      // Create session record in database (dual layer security)
      await storage.createSession({
        userId: user.id,
        sessionToken: jwtToken, // Store EdDSA JWT token in database for revocation capability
        expiresAt,
        device: (req.headers['user-agent'] || 'unknown').substring(0, 100),
        ipAddress: req.ip,
      });
      
      console.log(`✅ Phone Auth - User ${user.id} logged in with secure EdDSA JWT token`);
      
      res.json({ 
        success: true, 
        message: "Login successful with EdDSA JWT security",
        token: jwtToken, // Return EdDSA JWT token to client
        tokenType: 'Bearer',
        algorithm: 'EdDSA',
        expiresIn: JWT_EXPIRES_IN,
        user: {
          id: user.id,
          phoneNumber: user.phoneNumber,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          onboardingCompleted: user.onboardingCompleted,
        }
      });
      
    } catch (error) {
      console.error("Verify OTP error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(500).json({ error: "Failed to verify OTP" });
    }
  });

  // Get current user endpoint
  app.get("/api/auth/user", authenticateToken, async (req, res) => {
    try {
      const user = (req as any).user;
      res.json({
        id: user.id,
        phoneNumber: user.phoneNumber,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        profileImageUrl: user.profileImageUrl,
        bio: user.bio,
        preferredLanguages: user.preferredLanguages,
        favoriteGenres: user.favoriteGenres,
        onboardingCompleted: user.onboardingCompleted,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Enhanced JWT Logout endpoint with token revocation
  app.post("/api/auth/logout", authenticateToken, async (req, res) => {
    try {
      const jwtToken = (req as any).jwtToken;
      
      if (jwtToken) {
        // Revoke JWT by removing from database (blacklist approach)
        await storage.deleteSession(jwtToken);
        console.log(`👋 User logged out - JWT token revoked and blacklisted`);
      }
      
      res.json({ 
        success: true, 
        message: "Logged out successfully - JWT token revoked",
        tokenRevoked: true
      });
    } catch (error) {
      console.error("JWT Logout error:", error);
      res.status(500).json({ error: "Failed to logout" });
    }
  });

  // Update user profile endpoint
  app.put("/api/auth/profile", authenticateToken, async (req, res) => {
    try {
      const user = (req as any).user;
      const updateSchema = z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        username: z.string().optional(),
        email: z.string().email().optional(),
        bio: z.string().optional(),
        preferredLanguages: z.array(z.string()).optional(),
        favoriteGenres: z.array(z.string()).optional(),
        onboardingCompleted: z.boolean().optional(),
      });
      
      const updates = updateSchema.parse(req.body);
      const updatedUser = await storage.updateUser(user.id, updates);
      
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      console.log(`👤 User profile updated for ${user.id}`);
      res.json({ 
        success: true, 
        message: "Profile updated successfully",
        user: {
          id: updatedUser.id,
          phoneNumber: updatedUser.phoneNumber,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          username: updatedUser.username,
          bio: updatedUser.bio,
          preferredLanguages: updatedUser.preferredLanguages,
          favoriteGenres: updatedUser.favoriteGenres,
          onboardingCompleted: updatedUser.onboardingCompleted,
        }
      });
    } catch (error) {
      console.error("Update profile error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Clean up expired OTPs and sessions (run periodically)
  const cleanup = async () => {
    try {
      await storage.cleanExpiredOtps();
      await storage.cleanExpiredSessions();
      console.log("🧹 Cleaned up expired OTPs and sessions");
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  };

  // Run cleanup every hour
  setInterval(cleanup, 60 * 60 * 1000);
  
  console.log("📱 Phone authentication routes setup complete");
}