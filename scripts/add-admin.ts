import { db } from '../server/db';
import { users } from '../shared/schema';
import { hashPassword } from '../server/auth';

async function addAdminUser() {
  try {
    console.log('Creating admin user...');
    
    const adminData = {
      username: 'admin',
      email: 'admin@harmony.com',
      password: await hashPassword('admin123'),
      role: 'admin' as const,
      status: 'active' as const,
      bio: 'System Administrator'
    };

    const [newAdmin] = await db
      .insert(users)
      .values(adminData)
      .returning();

    console.log('Admin user created successfully:');
    console.log(`ID: ${newAdmin.id}`);
    console.log(`Username: ${newAdmin.username}`);
    console.log(`Email: ${newAdmin.email}`);
    console.log(`Role: ${newAdmin.role}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

addAdminUser();