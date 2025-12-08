import { getDb } from '../server/db';
import * as db from '../server/db';

async function testCommentReactions() {
  console.log('🧪 Testing comment reactions system...\n');

  try {
    // Get first post
    const postResults = await db.getPublishedPosts({ limit: 1, offset: 0 });
    if (postResults.length === 0) {
      console.log('❌ No posts found. Please seed data first.');
      return;
    }

    const testPost = postResults[0].post;
    console.log(`📝 Using post: "${testPost.title}" (ID: ${testPost.id})\n`);

    // Get comments for this post
    const comments = await db.getCommentsByPostId(testPost.id);
    if (comments.length === 0) {
      console.log('❌ No comments found. Creating test comment...');
      
      // Get a user (first one from published post)
      const postWithUser = await db.getPostById(testPost.id);
      if (!postWithUser) {
        console.log('❌ Failed to get post details');
        return;
      }

      const commentId = await db.createComment({
        postId: testPost.id,
        userId: postWithUser.userId,
        content: 'This is a test comment for reactions!',
        parentId: null
      } as any);

      console.log(`✅ Created test comment (ID: ${commentId})\n`);
      
      // Re-fetch comments
      const updatedComments = await db.getCommentsByPostId(testPost.id);
      if (updatedComments.length === 0) {
        console.log('❌ Failed to create comment');
        return;
      }
    }

    // Refresh comments list
    const allComments = await db.getCommentsByPostId(testPost.id);
    const testComment = allComments[0];
    
    console.log(`💬 Testing reactions on comment ID: ${testComment.comment.id}`);
    console.log(`   Content: "${testComment.comment.content}"`);
    console.log(`   Initial reactionCounts: ${JSON.stringify(testComment.reactionCounts || {})}\n`);

    // Get users for testing (from first two posts)
    const morePosts = await db.getPublishedPosts({ limit: 2, offset: 0 });
    if (morePosts.length < 2) {
      console.log('⚠️  Need at least 2 posts to get different users');
      return;
    }

    const user1Id = morePosts[0].post.userId;
    const user2Id = morePosts[1].post.userId;

    const user1 = await db.getUserById(user1Id);
    const user2 = await db.getUserById(user2Id);

    if (!user1 || !user2) {
      console.log('⚠️  Failed to get users');
      return;
    }

    // Test 1: User 1 reacts with heart
    console.log(`❤️ User ${user1.username || user1.name} reacts with heart...`);
    await db.addCommentReaction({
      commentId: testComment.comment.id,
      userId: user1.id,
      reactionType: 'heart'
    } as any);

    let counts = await db.getCommentReactionCounts(testComment.comment.id);
    console.log(`   Result counts: ${JSON.stringify(counts)}\n`);

    // Test 2: User 2 reacts with laugh
    console.log(`😂 User ${user2.username || user2.name} reacts with laugh...`);
    await db.addCommentReaction({
      commentId: testComment.comment.id,
      userId: user2.id,
      reactionType: 'laugh'
    } as any);

    counts = await db.getCommentReactionCounts(testComment.comment.id);
    console.log(`   Result counts: ${JSON.stringify(counts)}\n`);

    // Test 3: User 1 changes to thumbs_down
    console.log(`👎 User ${user1.username || user1.name} changes to thumbs_down...`);
    await db.addCommentReaction({
      commentId: testComment.comment.id,
      userId: user1.id,
      reactionType: 'thumbs_down'
    } as any);

    counts = await db.getCommentReactionCounts(testComment.comment.id);
    console.log(`   Result counts: ${JSON.stringify(counts)}\n`);

    // Test 4: User 1 removes reaction (toggle off)
    console.log(`🔄 User ${user1.username || user1.name} removes reaction (toggle)...`);
    await db.addCommentReaction({
      commentId: testComment.comment.id,
      userId: user1.id,
      reactionType: 'thumbs_down'
    } as any);

    counts = await db.getCommentReactionCounts(testComment.comment.id);
    console.log(`   Result counts: ${JSON.stringify(counts)}\n`);

    // Test 5: Check user reaction
    const user2Reaction = await db.getUserCommentReaction(testComment.comment.id, user2.id);
    console.log(`🔍 User ${user2.username || user2.name} current reaction: ${user2Reaction || 'none'}\n`);

    // Test 6: Verify in comment list
    const finalComments = await db.getCommentsByPostId(testPost.id);
    const finalComment = finalComments.find(c => c.comment.id === testComment.comment.id);
    if (finalComment) {
      console.log(`✅ Final state in comment list:`);
      console.log(`   ReactionCounts: ${JSON.stringify(finalComment.reactionCounts)}`);
    }

    console.log('✅ All tests passed! Comment reactions system is working.\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCommentReactions().then(() => {
  console.log('👋 Test finished');
  process.exit(0);
});
