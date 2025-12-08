import * as db from '../server/db.js';

const COMMENTS_DATA = [
  // User 12 (designqueen) comments on techguru's posts
  { userId: 12, postId: 40, content: 'Great article! TypeScript has really transformed how I approach frontend development. The type safety is a game changer.' },
  { userId: 12, postId: 41, content: 'RSC is fascinating! Have you tried using them with Next.js 14? The performance improvements are incredible.' },
  
  // User 13 (datascientist) comments on techguru's posts
  { userId: 13, postId: 42, content: 'Nice write-up on REST APIs. How do you handle authentication in your API design? JWT or session-based?' },
  
  // User 14 (анна_иванова) comments on posts
  { userId: 14, postId: 40, content: 'Отличная статья! TypeScript действительно упрощает разработку. Использую его во всех проектах.' },
  { userId: 14, postId: 46, content: 'Полностью согласна с принципами дизайна. Особенно важна консистентность интерфейса.' },
  
  // User 15 (дмитрий_петров) comments on posts
  { userId: 15, postId: 42, content: 'В Go мы используем похожий подход для REST API. Chi роутер отлично справляется с этой задачей.' },
  { userId: 15, postId: 50, content: 'Machine Learning + Go = отличная комбинация для production. GoML библиотека хорошо работает.' },
  
  // User 11 (techguru) comments on others' posts
  { userId: 11, postId: 46, content: 'Really appreciate this perspective on UI design. As a developer, I often overlook the importance of visual hierarchy.' },
  { userId: 11, postId: 50, content: 'Python is still the king for ML. Scikit-learn and TensorFlow ecosystem is unmatched.' },
  { userId: 11, postId: 59, content: 'Interested in learning Go! How does it compare to Node.js for building microservices?' },
  
  // User 12 (designqueen) comments on various posts
  { userId: 12, postId: 50, content: 'As a designer working with data teams, I find data visualization challenging but rewarding. Any tool recommendations?' },
  { userId: 12, postId: 55, content: 'Vue 3 Composition API выглядит очень интересно! Планирую попробовать в следующем проекте.' },
  
  // User 13 (datascientist) comments on tech posts
  { userId: 13, postId: 41, content: 'Server components are perfect for data-heavy applications. We\'re migrating our analytics dashboard to use them.' },
  { userId: 13, postId: 59, content: 'Go is great for data pipelines! Much faster than Python for processing large datasets.' },
  
  // Threaded conversations (replies to comments)
  // Reply to comment 1 (designqueen's comment on TypeScript)
  { userId: 11, postId: 40, content: 'Thanks! Have you tried the new TypeScript 5.0 features? The decorators update is fantastic.', parentId: 1 },
  
  // Reply to comment 3 (datascientist's question about auth)
  { userId: 11, postId: 42, content: 'Great question! I prefer JWT with refresh tokens. Session-based can be tricky with horizontal scaling.', parentId: 3 },
  
  // Reply to comment 11 (techguru's question about Go)
  { userId: 15, postId: 59, content: 'Go имеет меньше накладных расходов и лучше подходит для CPU-intensive задач. Для I/O-bound Node.js тоже хорош.', parentId: 11 },
];

async function seedInteractions() {
  console.log('💬 Starting interactions seeding...\n');

  try {
    // Get all published posts
    const postsResults = await db.getPublishedPosts({ limit: 100 });
    const posts = Array.isArray(postsResults) ? postsResults.map(r => r.post) : [];
    
    if (posts.length === 0) {
      console.log('⚠️  No posts found. Run seedTestUsers.ts first.');
      return;
    }

    console.log(`📝 Found ${posts.length} posts\n`);

    // Get all test users (IDs 11-15)
    const testUserIds = [11, 12, 13, 14, 15];

    // ======= CREATE LIKES =======
    console.log('❤️  Creating post reactions (emoji)...\n');
    
    let reactionsCreated = 0;
    const reactionTypes = ['heart', 'laugh', 'ok', 'thumbs_down'] as const;
    
    // Each user reacts to 5-8 random posts from other users
    for (const userId of testUserIds) {
      const otherUsersPosts = posts.filter(p => p.userId !== userId);
      const shuffled = otherUsersPosts.sort(() => Math.random() - 0.5);
      const postsToReact = shuffled.slice(0, Math.floor(Math.random() * 4) + 5); // 5-8 posts
      
      for (const post of postsToReact) {
        try {
          // Pick a random reaction type, with higher probability for 'heart'
          const random = Math.random();
          let reactionType: typeof reactionTypes[number];
          if (random < 0.6) {
            reactionType = 'heart';  // 60% chance
          } else if (random < 0.8) {
            reactionType = 'laugh';  // 20% chance
          } else if (random < 0.95) {
            reactionType = 'ok';     // 15% chance
          } else {
            reactionType = 'thumbs_down'; // 5% chance
          }
          
          await db.addPostReaction({
            postId: post.id,
            userId: userId,
            reactionType: reactionType,
          });
          reactionsCreated++;
          console.log(`  ✓ User ${userId} reacted ${reactionType} to post ${post.id}: "${post.title?.substring(0, 40)}..."`);
        } catch (error) {
          console.log(`  ⚠️  Could not create reaction (userId: ${userId}, postId: ${post.id})`);
        }
      }
    }

    console.log(`\n✅ Created ${reactionsCreated} post reactions\n`);

    // ======= CREATE COMMENTS =======
    console.log('💬 Creating comments...\n');
    
    let commentsCreated = 0;
    const commentIdMap: Record<number, number> = {}; // Map array index to actual comment ID
    
    for (let i = 0; i < COMMENTS_DATA.length; i++) {
      const commentData = COMMENTS_DATA[i];
      
      try {
        // If this comment has a parentId, map it to the actual database ID
        let actualParentId = undefined;
        if (commentData.parentId) {
          actualParentId = commentIdMap[commentData.parentId - 1]; // -1 because array is 0-indexed
          if (!actualParentId) {
            console.log(`  ⚠️  Parent comment not found for reply, skipping...`);
            continue;
          }
        }
        
        const commentId = await db.createComment({
          postId: commentData.postId,
          userId: commentData.userId,
          content: commentData.content,
          parentId: actualParentId,
        });
        
        // Store the mapping
        commentIdMap[i] = commentId;
        
        commentsCreated++;
        const parentInfo = actualParentId ? ` (reply to comment ${actualParentId})` : '';
        console.log(`  ✓ Comment ${commentId} created by user ${commentData.userId} on post ${commentData.postId}${parentInfo}`);
      } catch (error: any) {
        console.log(`  ⚠️  Could not create comment: ${error.message}`);
      }
    }

    console.log(`\n✅ Created ${commentsCreated} comments\n`);

    // ======= SUMMARY =======
    console.log('✨ Interactions seeding complete!\n');
    console.log('📊 Summary:');
    console.log(`   - Post reactions created: ${reactionsCreated}`);
    console.log(`   - Comments created: ${commentsCreated}`);
    console.log(`   - Comment threads: ${COMMENTS_DATA.filter(c => c.parentId).length} replies\n`);

  } catch (error) {
    console.error('❌ Error seeding interactions:', error);
    throw error;
  }
}

seedInteractions()
  .then(() => {
    console.log('👋 Seeding script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
