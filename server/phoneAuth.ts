import type { Express, RequestHandler } from "express";
import { z } from "zod";
import crypto from "crypto";
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

// Generate secure session token
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Helper to get user from session
export async function getUserFromSession(sessionToken: string) {
  const session = await storage.getSession(sessionToken);
  if (!session) return null;
  
  const user = await storage.getUser(session.userId);
  return user || null;
}

// Authentication middleware
export const authenticateToken: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const user = await getUserFromSession(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    (req as any).user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Setup phone authentication routes
export function setupPhoneAuth(app: Express) {
  
  // Send OTP endpoint
  app.post("/api/auth/send-otp", async (req, res) => {
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
      
      // For development: Log OTP to console
      console.log(`🔐 OTP for ${phoneNumber}: ${otp}`);
      console.log(`📱 Phone Auth - OTP ${otp} sent to ${phoneNumber} (expires in 10 minutes)`);
      
      // In production, this would send SMS via Twilio or similar service
      res.json({ 
        success: true, 
        message: "OTP sent successfully",
        // For development only - remove in production
        dev_otp: otp
      });
      
    } catch (error) {
      console.error("Send OTP error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(500).json({ error: "Failed to send OTP" });
    }
  });

  // Verify OTP and login endpoint
  app.post("/api/auth/verify-otp", async (req, res) => {
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
      
      // Create session
      const sessionToken = generateSessionToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      
      await storage.createSession({
        userId: user.id,
        sessionToken,
        expiresAt,
        device: req.headers['user-agent'] || 'unknown',
        ipAddress: req.ip,
      });
      
      console.log(`✅ Phone Auth - User ${user.id} logged in successfully`);
      
      res.json({ 
        success: true, 
        message: "Login successful",
        token: sessionToken,
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

  // Logout endpoint
  app.post("/api/auth/logout", authenticateToken, async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];
      
      if (token) {
        await storage.deleteSession(token);
        console.log(`👋 User logged out, session token deleted`);
      }
      
      res.json({ success: true, message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
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