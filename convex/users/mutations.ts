import { v } from 'convex/values';
import { internalMutation } from '../_generated/server';
import { Doc } from '@convex/_generated/dataModel';

export const syncClerkUser = internalMutation({
  args: {
    data: v.object({
      clerkId: v.string(),
      deleted: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const { clerkId } = args.data;
    if (!clerkId) {
      throw new Error('Invalid data');
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', clerkId))
      .unique();

    if (user) {
      const updates: Partial<Doc<'users'>> = {};
      if (args.data.deleted) {
        updates.deleteTime = Date.now();
      }
      await ctx.db.patch(user._id, updates);
    } else {
      await ctx.db.insert('users', {
        clerkId,
        favoriteModels: [],
      });
    }
  },
});
