import 'dotenv/config';
import bcrypt from 'bcryptjs';
import * as db from '../server/db';

async function main() {
  try {
    const password = 'Admin123!';
    const passwordHash = await bcrypt.hash(password, 10);

    // Try find by email or username
    const existingByEmail = await db.getUserByEmail('admin@example.test');
    const existingByUsername = await db.getUserByUsername('admin');

    if (existingByEmail) {
      await db.updateUser(existingByEmail.id, { passwordHash, role: 'admin' });
      console.log('Updated existing admin user (email): admin@example.test with new password:', password);
    } else if (existingByUsername) {
      await db.updateUser(existingByUsername.id, { passwordHash, role: 'admin' });
      console.log('Updated existing admin user (username): admin with new password:', password);
    } else {
      const openId = `email_admin_${Date.now()}`;
      await db.upsertUser({
        openId,
        email: 'admin@example.test',
        username: 'admin',
        name: 'Test Admin',
        passwordHash,
        loginMethod: 'email',
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log('Created new admin user: admin@example.test with password:', password);
    }
  } catch (err) {
    console.error('Failed to create or update admin user', err);
  } finally {
    process.exit(0);
  }
}

main();
