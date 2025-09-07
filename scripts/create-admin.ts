import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema";
import bcrypt from 'bcryptjs';

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema });

async function createAdminUser() {
  try {
    console.log('Creating admin user...');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Create admin user
    const [adminUser] = await db
      .insert(schema.users)
      .values({
        username: 'admin',
        email: 'admin@harmony.com',
        password: hashedPassword,
        role: 'admin',
        status: 'active',
        bio: 'System Administrator'
      })
      .returning();
    
    console.log('Admin user created successfully!');
    console.log('Username: admin');
    console.log('Email: admin@harmony.com');
    console.log('Password: admin123');
    console.log('Role:', adminUser.role);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();