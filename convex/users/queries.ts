import { v } from 'convex/values';
import { internalQuery, query } from '../_generated/server';
import justPick from 'just-pick';
import { Doc } from '@convex/_generated/dataModel';

const convertUser = (user: Doc<'users'> | null) => {
  if (!user) {
    return null;
  }

  return justPick(user, ['_id', 'clerkId', 'favoriteModels']);
};

export const getUserProfile = query({
  args: v.object({
    userId: v.optional(v.id('users')),
    clerkId: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    if (args.userId) {
      const user = await ctx.db.get(args.userId);
      return convertUser(user);
    }

    const clerkId = args.clerkId;
    if (clerkId && typeof clerkId === 'string') {
      const user = await ctx.db
        .query('users')
        .withIndex('by_clerk_id', (q) => q.eq('clerkId', clerkId))
        .first();
      return convertUser(user);
    }

    return null;
  },
});

export const getCurrentUser = internalQuery({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first();

    return convertUser(user);
  },
});
