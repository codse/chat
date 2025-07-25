import { v } from 'convex/values';
import { query } from '../_generated/server';
import schema from '@convex/schema';
import { stream } from 'convex-helpers/server/stream';
import { IndexRange } from 'convex/server';
import { getUser } from '@convex/auth';
import { checkChatPermissions } from './permissions';

export const listChats = query({
  args: {
    mode: v.optional(v.union(v.literal('pinned'), v.literal('recent'))),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (!user?._id) {
      return {
        chats: null,
      };
    }

    const chats = await stream(ctx.db, schema)
      .query('chats')
      .withIndex('by_user_type_lastMessageTime', (q): IndexRange => {
        if (args.mode === 'pinned') {
          return q.eq('userId', user._id).eq('type', 'pinned');
        }
        return q.eq('userId', user._id).eq('type', undefined);
      })
      .order('desc')
      .filterWith(async (chat) => !chat.deleteTime && chat.source !== 'share')
      .collect();

    return {
      chats,
    };
  },
});

export const getChat = query({
  args: { chatId: v.id('chats') },
  handler: async (ctx, args) => {
    const result = await checkChatPermissions(ctx, args.chatId);
    if (result.isErr()) {
      throw result.error;
    }

    const { chat } = result.value;
    return chat;
  },
});

export const searchChats = query({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (!user?._id) {
      return [];
    }

    if (!args.query?.length) {
      return await ctx.db
        .query('chats')
        .withIndex('by_user_type_lastMessageTime', (q) =>
          q.eq('userId', user._id).eq('type', undefined)
        )
        .filter((q) =>
          q.and(
            q.neq('type', 'deleted'),
            q.neq('type', 'private'),
            q.neq('source', 'share')
          )
        )
        .order('desc')
        .take(15);
    }

    const results = await ctx.db
      .query('chats')
      .withSearchIndex('search_by_title', (q) =>
        q.search('title', args.query).eq('userId', user._id)
      )
      .filter((q) =>
        q.and(
          q.neq('type', 'deleted'),
          q.neq('type', 'private'),
          q.neq('source', 'share')
        )
      )
      .take(15);
    return results;
  },
});
