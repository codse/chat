import { mutation } from '@convex/_generated/server';
import { Id } from '@convex/_generated/dataModel';
import { v } from 'convex/values';
import { getUser } from '../auth';
import { getAuthUserId } from '@convex-dev/auth/server';

export const createLinkingSession = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error('User not authenticated');
    }

    return ctx.db.insert('linking', {
      userId,
    });
  },
});

export const linkAccount = mutation({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const sessionId = args.sessionId;
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    const session = await ctx.db.get(sessionId as Id<'linking'>);

    if (!session) {
      throw new Error('Session not found');
    }

    const targetUser = await getUser(ctx);
    if (targetUser?.isAnonymous || !targetUser._id) {
      // Link oauth user only.
      throw new Error('Target user is not supported');
    }

    const sourceUser = await ctx.db
      .query('users')
      .withIndex('by_id', (q) => q.eq('_id', session.userId))
      .first();

    if (!sourceUser || !sourceUser.isAnonymous) {
      // Only allow link anonymous user.
      throw new Error('Invalid linking source');
    }

    // Update the chats of anonymous user to oauth user.
    const chats = await ctx.db
      .query('chats')
      .withIndex('by_user_type_lastMessageTime', (q) =>
        q.eq('userId', sourceUser._id).eq('type', undefined)
      )
      .collect();

    await Promise.all(
      chats.map((chat) =>
        ctx.db.patch(chat._id, {
          userId: targetUser._id,
        })
      )
    );

    await ctx.db.delete(sessionId as Id<'linking'>);
  },
});
