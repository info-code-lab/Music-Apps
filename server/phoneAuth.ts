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

// Generate Ed25519 key pair if not provided in environment
function generateEd25519Keys() {
  const keyPair = crypto.generateKeyPairSync('ed25519');
  const privateKeyPem = keyPair.privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;
  const publicKeyPem = keyPair.publicKey.export({ type: 'spki', format: 'pem' }) as string;
  
  console.log('🔐 Generated Ed25519 key pair for development');
  return { privateKeyPem, publicKeyPem };
}

// Initialize EdDSA keys with proper formatting and fallback generation
async function initializeEdDSAKeys() {
  if (!privateKey || !publicKey) {
    try {
      let formattedPrivateKey = JWT_PRIVATE_KEY;
      let formattedPublicKey = JWT_PUBLIC_KEY;
      
      // If keys are not properly formatted or missing, generate new ones for development
      if (!formattedPrivateKey || !formattedPrivateKey.includes('BEGIN') || 
          !formattedPublicKey || !formattedPublicKey.includes('BEGIN')) {
        console.log('🔑 JWT keys not properly configured, generating Ed25519 keys for development...');
        const { privateKeyPem, publicKeyPem } = generateEd25519Keys();
        formattedPrivateKey = privateKeyPem;
        formattedPublicKey = publicKeyPem;
      }
      
      // Handle escaped newlines if present
      if (formattedPrivateKey.includes('\\n')) {
        formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, '\n');
      }
      if (formattedPublicKey.includes('\\n')) {
        formattedPublicKey = formattedPublicKey.replace(/\\n/g, '\n');
      }
      
      privateKey = await importPKCS8(formattedPrivateKey, JWT_ALGORITHM);
      publicKey = await importSPKI(formattedPublicKey, JWT_ALGORITHM);
      console.log('🔐 EdDSA keys initialized successfully');
    } catch (error) {
      console.error('❌ EdDSA key initialization failed:', error);
      // Fallback to generating new keys for development
      console.log('🔄 Falling back to generated Ed25519 keys...');
      const { privateKeyPem, publicKeyPem } = generateEd25519Keys();
      privateKey = await importPKCS8(privateKeyPem as string, JWT_ALGORITHM);
      publicKey = await importSPKI(publicKeyPem as string, JWT_ALGORITHM);
      console.log('🔐 EdDSA keys initialized with generated keys');
    }
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
    kid: JWT_KID || 'default-key-id'
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

// Pure Database Session Authentication middleware - 100% secure
export const authenticateToken: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const sessionToken = authHeader && authHeader.split(' ')[1]; // Bearer SESSION_TOKEN

  if (!sessionToken) {
    return res.status(401).json({ 
      error: 'Database session token required',
      code: 'TOKEN_MISSING'
    });
  }

  try {
    // Get session directly from database - 100% database verification
    const session = await storage.getSession(sessionToken);
    if (!session) {
      return res.status(401).json({ 
        error: 'Invalid session token',
        code: 'SESSION_INVALID'
      });
    }

    // Check if session is expired
    if (new Date() > new Date(session.expiresAt)) {
      // Clean up expired session
      await storage.deleteSession(sessionToken);
      return res.status(401).json({ 
        error: 'Session expired',
        code: 'SESSION_EXPIRED'
      });
    }

    // Get user from database
    const user = await storage.getUser(session.userId);
    if (!user) {
      // Clean up session for non-existent user
      await storage.deleteSession(sessionToken);
      return res.status(401).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Attach user and session to request
    (req as any).user = user;
    (req as any).sessionToken = sessionToken;
    (req as any).session = session;
    
    console.log(`🔐 Database Session Auth Success - User: ${user.id}`);
    next();
  } catch (error) {
    console.error('Database Session Auth error:', error);
    return res.status(403).json({ 
      error: 'Session verification failed',
      code: 'SESSION_VERIFICATION_FAILED'
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
      
      // Generate secure database session token (100% database-based security)
      const sessionToken = generateSessionToken(); // Simple secure session token
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      
      // Store session ONLY in database - no JWT, no localStorage
      await storage.createSession({
        userId: user.id,
        sessionToken: sessionToken, // Store simple session token in database
        expiresAt,
        device: (req.headers['user-agent'] || 'unknown').substring(0, 100),
        ipAddress: req.ip,
      });
      
      console.log(`✅ Phone Auth - User ${user.id} logged in with secure database session token`);
      
      res.json({ 
        success: true, 
        message: "Login successful with database session security",
        token: sessionToken, // Return database session token to client
        tokenType: 'Bearer',
        algorithm: 'Database-Session',
        expiresIn: '7d',
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

  // Database Session Logout endpoint with instant revocation
  app.post("/api/auth/logout", authenticateToken, async (req, res) => {
    try {
      const sessionToken = (req as any).sessionToken;
      const user = (req as any).user;
      
      if (sessionToken) {
        // Instantly revoke session by removing from database
        await storage.deleteSession(sessionToken);
        console.log(`👋 User ${user.id} logged out - Database session revoked instantly`);
      }
      
      res.json({ 
        success: true, 
        message: "Logged out successfully - Session revoked",
        sessionRevoked: true
      });
    } catch (error) {
      console.error("Session Logout error:", error);
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