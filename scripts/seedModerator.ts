import bcrypt from 'bcryptjs';
import * as db from '../server/db';

async function main() {
  const password = process.env.MODERATOR_PASSWORD ?? 'moderator1234';
  const email = process.env.MODERATOR_EMAIL ?? 'moderator@example.test';
  const username = process.env.MODERATOR_USERNAME ?? 'moderator';

  const passwordHash = await bcrypt.hash(password, 10);
  const openId = `seed:mod:${Date.now()}:${Math.random().toString(36).slice(2,9)}`;

  try {
    await db.upsertUser({
      openId,
      email,
      username,
      name: 'Test Moderator',
      role: 'moderator',
      passwordHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any);

    console.log(`✅ Created moderator user:`);
    console.log(`   Email: ${email}`);
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: moderator`);

  } catch (err) {
    console.error('❌ Failed to create moderator:', err);
    process.exit(1);
  }
}

main().then(() => {
  console.log('\n✨ Done!');
  process.exit(0);
});
