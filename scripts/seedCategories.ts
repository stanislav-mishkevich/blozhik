import { getDb } from '../server/db';
import { categories } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

const DEFAULT_CATEGORIES = [
  { name: 'Technology', slug: 'technology' },
  { name: 'Programming', slug: 'programming' },
  { name: 'Web Development', slug: 'web-development' },
  { name: 'Data Science', slug: 'data-science' },
  { name: 'DevOps', slug: 'devops' },
  { name: 'Design', slug: 'design' },
  { name: 'AI & Machine Learning', slug: 'ai-ml' },
  { name: 'Mobile Development', slug: 'mobile-development' },
  { name: 'Career & Education', slug: 'career-education' },
  { name: 'Tutorials', slug: 'tutorials' },
  { name: 'News & Updates', slug: 'news-updates' },
  { name: 'Lifestyle', slug: 'lifestyle' },
  { name: 'Travel & Adventure', slug: 'travel' },
  { name: 'Food & Cooking', slug: 'food' },
  { name: 'Gaming & Esports', slug: 'gaming' },
  { name: 'Health & Fitness', slug: 'health' },
  { name: 'Finance & Investing', slug: 'finance' },
  { name: 'Entertainment', slug: 'entertainment' },
  { name: 'Photography', slug: 'photography' },
  { name: 'DIY & Crafts', slug: 'diy' },
  { name: 'Business & Startups', slug: 'business' },
  { name: 'Science', slug: 'science' },
  { name: 'Sports', slug: 'sports' },
  { name: 'Fashion & Style', slug: 'fashion' },
  { name: 'Music', slug: 'music' },
  { name: 'Books & Reading', slug: 'books' },
  { name: 'Other', slug: 'other' },
];

async function seedCategories() {
  console.log('🏷️  Seeding categories...\n');

  const db = await getDb();
  if (!db) {
    throw new Error('Failed to connect to database');
  }

  try {
    for (const category of DEFAULT_CATEGORIES) {
      // Check if category exists
      const existing = await db.select().from(categories).where(eq(categories.name, category.name)).limit(1);

      if (existing.length > 0) {
        console.log(`  ⚠ Category "${category.name}" already exists, skipping...`);
        continue;
      }

      await db.insert(categories).values(category);
      console.log(`  ✓ Created category: ${category.name}`);
    }

    console.log('\n✅ Categories seeded successfully!');
    console.log(`\n📊 Total categories: ${DEFAULT_CATEGORIES.length}`);
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    throw error;
  }
}

seedCategories()
  .then(() => {
    console.log('\n👋 Seeding script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
