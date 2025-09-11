//npm run db:push
//npx tsx scripts/create-users.ts
//npx tsx scripts/import-songs.ts
//npx tsx scripts/populate-database.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
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

    // Create admin user with phone authentication
    await db
      .insert(users)
      .values({
        phoneNumber: "+1234567890",
        email: "admin@example.com",
        firstName: "Admin",
        lastName: "User",
        username: "admin",
        role: "admin",
        status: "active",
        onboardingCompleted: true,
      })
      .onConflictDoUpdate({
        target: users.phoneNumber,
        set: {
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          username: "admin",
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

    console.log("\n=== User Credentials (Phone Authentication) ===");
    console.log("Admin User:");
    console.log("  Phone: +1234567890");
    console.log("  Email: admin@example.com");
    console.log("  Username: admin");
    console.log("  Role: admin");
    console.log("");
    console.log("Regular User:");
    console.log("  Phone: +1234567891");
    console.log("  Email: user@example.com");
    console.log("  Username: user");
    console.log("  Role: user");
    console.log("");
    console.log("Artist User:");
    console.log("  Phone: +1234567892");
    console.log("  Email: artist@example.com");
    console.log("  Username: artist");
    console.log("  Role: artist");
    console.log("========================================");
    console.log("Note: Authentication is done via SMS OTP to phone numbers");
  } catch (error) {
    console.error("Error creating users:", error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log("\nDatabase connection closed.");
  }
}

createUsers();
