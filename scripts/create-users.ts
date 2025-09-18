//npm run db:push
//npx tsx scripts/create-users.ts
//npx tsx scripts/import-songs.ts
//npx tsx scripts/populate-database.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import bcrypt from "bcryptjs";
import { users } from "../shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema: { users } });

async function createUsers() {
  try {
    console.log("Creating users...");

    // Hash password for admin user
    const adminPassword = "adminp";
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 12);

    // Create admin user with username/password authentication
    await db
      .insert(users)
      .values({
        phoneNumber: "+1234567890",
        email: "admin@example.com",
        firstName: "Admin",
        lastName: "User",
        username: "admin",
        passwordHash: hashedAdminPassword,
        role: "admin",
        status: "active",
        onboardingCompleted: true,
      })
      .onConflictDoUpdate({
        target: users.username,
        set: {
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          phoneNumber: "+1234567890",
          passwordHash: hashedAdminPassword,
          role: "admin",
          status: "active",
          onboardingCompleted: true,
        },
      });

    console.log("✓ Admin user created/updated");

    // Create regular user with phone authentication
    await db
      .insert(users)
      .values({
        phoneNumber: "+1234567891",
        email: "user@example.com", 
        firstName: "Regular",
        lastName: "User",
        username: "user",
        role: "user",
        status: "active",
        onboardingCompleted: true,
      })
      .onConflictDoUpdate({
        target: users.phoneNumber,
        set: {
          email: "user@example.com",
          firstName: "Regular",
          lastName: "User", 
          username: "user",
          role: "user",
          status: "active",
          onboardingCompleted: true,
        },
      });

    console.log("✓ Regular user created/updated");

    // Create artist user
    await db
      .insert(users)
      .values({
        phoneNumber: "+1234567892",
        email: "artist@example.com",
        firstName: "Music",
        lastName: "Artist",
        username: "artist",
        role: "artist",
        status: "active",
        onboardingCompleted: true,
      })
      .onConflictDoUpdate({
        target: users.phoneNumber,
        set: {
          email: "artist@example.com",
          firstName: "Music",
          lastName: "Artist",
          username: "artist", 
          role: "artist",
          status: "active",
          onboardingCompleted: true,
        },
      });

    console.log("✓ Artist user created/updated");

    console.log("\n=== User Credentials ===");
    console.log("Admin User (Username/Password Auth):");
    console.log("  Username: admin");
    console.log("  Password: adminpass123");
    console.log("  Email: admin@example.com");
    console.log("  Phone: +1234567890");
    console.log("  Role: admin");
    console.log("  Login via: POST /api/admin/login");
    console.log("");
    console.log("Regular User (Phone Auth):");
    console.log("  Phone: +1234567891");
    console.log("  Email: user@example.com");
    console.log("  Username: user");
    console.log("  Role: user");
    console.log("  Login via: POST /api/auth/send-otp");
    console.log("");
    console.log("Artist User (Phone Auth):");
    console.log("  Phone: +1234567892");
    console.log("  Email: artist@example.com");
    console.log("  Username: artist");
    console.log("  Role: artist");
    console.log("  Login via: POST /api/auth/send-otp");
    console.log("========================================");
    console.log("Note: Admin uses username/password, Users/Artists use SMS OTP");
  } catch (error) {
    console.error("Error creating users:", error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log("\nDatabase connection closed.");
  }
}

createUsers();
