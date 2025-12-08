import bcrypt from 'bcryptjs';
import * as db from '../server/db';

async function main() {
  const password = process.env.ADMIN_PASSWORD ?? 'admin1234';
  const email = process.env.ADMIN_EMAIL ?? 'admin@example.test';
  const username = process.env.ADMIN_USERNAME ?? 'admin';

  const passwordHash = await bcrypt.hash(password, 10);
  // create an openId for internal use
  const openId = `seed:${Date.now()}:${Math.random().toString(36).slice(2,9)}`;

  try {
    await db.upsertUser({
      openId,
      email,
      username,
      name: 'Admin (seed)',
      role: 'admin',
      passwordHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any);

    console.log(`Created admin user: email=${email} username=${username} password=${password}`);

    // Optionally create a published post for testing
    const postId = await db.createPost({
      userId: (await db.getUserByEmail(email))!.id,
      title: 'Welcome post (seed)',
      content: 'This is a seeded admin post for testing the dev environment.',
      contentType: 'markdown',
      excerpt: 'Seeded welcome post',
      published: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any);

    console.log(`Created sample post with id ${postId}`);
  } catch (err) {
    console.error('Seeding admin failed', err);
    process.exit(1);
  }
}

main().then(() => process.exit(0));
