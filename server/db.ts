import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });

// Idempotent startup migration to ensure auth_tokens schema
async function ensureAuthTokensSchema() {
  try {
    console.log('🔄 Running auth_tokens schema migration...');
    
    // Create auth_tokens table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS auth_tokens (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id varchar NOT NULL,
        access_token text UNIQUE NOT NULL,
        refresh_token text UNIQUE NOT NULL,
        expires_at timestamp NOT NULL,
        device varchar(100),
        ip_address varchar(45),
        created_at timestamp DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Alter existing columns to support longer JWT tokens (safe operation)
    try {
      await db.execute(sql`ALTER TABLE auth_tokens ALTER COLUMN access_token TYPE text;`);
      await db.execute(sql`ALTER TABLE auth_tokens ALTER COLUMN refresh_token TYPE text;`);
      console.log('✅ Updated auth_tokens columns to support longer JWT tokens');
    } catch (error: any) {
      // Ignore if columns are already text type or table doesn't exist yet
      if (!error.message?.includes('already exists') && !error.message?.includes('does not exist')) {
        console.warn('⚠️ Column type update warning (likely safe):', error.message);
      }
    }
    
    // Create indexes if they don't exist
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_id ON auth_tokens (user_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires_at ON auth_tokens (expires_at);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_auth_tokens_access_token ON auth_tokens (access_token);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_auth_tokens_refresh_token ON auth_tokens (refresh_token);`);
    
    // Drop user_sessions table if it exists (migration from old system)
    await db.execute(sql`DROP TABLE IF EXISTS user_sessions;`);
    
    console.log('✅ Auth tokens schema migration completed successfully');
  } catch (error) {
    console.error('❌ Auth tokens schema migration failed:', error);
    throw error;
  }
}

// Initialize database and run migrations
async function initializeDatabase() {
  await ensureAuthTokensSchema();
  console.log('✅ Database connection established with auth_tokens schema');
}

// Run initialization
initializeDatabase().catch((error) => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});