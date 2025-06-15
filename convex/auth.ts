import { convexAuth } from '@convex-dev/auth/server';
import Google from '@auth/core/providers/google';
import { Anonymous } from '@convex-dev/auth/providers/Anonymous';
import { MutationCtx, query, QueryCtx } from './_generated/server';
import { PublicUser, UnauthenticatedUser } from '@/types/chat';
import { Id } from './_generated/dataModel';
import { mutation } from './_generated/server';
import { v } from 'convex/values';

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google, Anonymous],
  callbacks: {
    async createOrUpdateUser(ctx: MutationCtx, args) {
      if (args.existingUserId) {
        return args.existingUserId;
      }

      const userId = await ctx.db.insert('users', {
        ...args.profile,
        isAnonymous: args.provider.id === 'anonymous',
      });

      return userId;
    },
  },
});

export const getUser = async (
  ctx: QueryCtx,
  args: { includeCount?: boolean } = {}
): Promise<PublicUser | UnauthenticatedUser> => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return {
      isAnonymous: true,
      _id: null,
    };
  }

  const [rawUserId] = identity.subject.split('|');
  const userId = rawUserId as Id<'users'>;

  const user = await ctx.db.get(userId);
  let count = 0;

  if (args.includeCount) {
    const chats = await ctx.db
      .query('chats')
      .withIndex('by_user_type_lastMessageTime', (q) => q.eq('userId', userId))
      .collect();

    count = chats.length;
  }

  return {
    _id: userId,
    isAnonymous: user?.isAnonymous ?? true,
    chat: {
      count,
    },
    name: user?.name ?? undefined,
    email: user?.email ?? undefined,
    image: user?.image ?? identity?.pictureUrl ?? undefined,
  };
};

export const getCurrentUser = query({
  args: {
    includeCount: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<PublicUser | UnauthenticatedUser> => {
    return getUser(ctx, { includeCount: args.includeCount });
  },
});
