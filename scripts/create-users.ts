import bcrypt from 'bcryptjs';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import { users } from "../shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema: { users } });

async function createUsers() {
  try {
    console.log('Creating users...');

    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const userPassword = await bcrypt.hash('user123', 10);

    // Create admin user
    await db.insert(users)
      .values({
        username: 'admin',
        email: 'admin@example.com',
        password: adminPassword,
        role: 'admin',
        status: 'active'
      })
      .onConflictDoUpdate({
        target: users.username,
        set: {
          email: 'admin@example.com',
          password: adminPassword,
          role: 'admin',
          status: 'active'
        }
      });

    console.log('✓ Admin user created/updated');

    // Create regular user
    await db.insert(users)
      .values({
        username: 'user',
        email: 'user@example.com',
        password: userPassword,
        role: 'user',
        status: 'active'
      })
      .onConflictDoUpdate({
        target: users.username,
        set: {
          email: 'user@example.com',
          password: userPassword,
          role: 'user',
          status: 'active'
        }
      });

    console.log('✓ Regular user created/updated');

    console.log('\n=== User Credentials ===');
    console.log('Admin User:');
    console.log('  Username: admin');
    console.log('  Email: admin@example.com');
    console.log('  Password: admin123');
    console.log('  Role: admin');
    console.log('');
    console.log('Regular User:');
    console.log('  Username: user');
    console.log('  Email: user@example.com');
    console.log('  Password: user123');
    console.log('  Role: user');
    console.log('========================');

  } catch (error) {
    console.error('Error creating users:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('\nDatabase connection closed.');
  }
}

createUsers();