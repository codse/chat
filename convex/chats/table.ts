import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const chatsTable = defineTable({
  title: v.string(),
  userId: v.id('users'),
  model: v.string(),
  pinned: v.optional(v.boolean()),
  // source = share (created from shared chat)
  // source = branch (branched from existing chat)
  // source = undefined (created by user, original chat)
  source: v.optional(v.union(v.literal('branch'), v.literal('share'))),
  // For branching conversations
  parentId: v.optional(v.id('chats')),
  // backfilled = true (chat was backfilled from a shared/branch chat),
  referenceId: v.optional(v.id('messages')),
  backfilled: v.optional(v.boolean()),
  updateTime: v.optional(v.number()),
  deleteTime: v.optional(v.number()),
  lastMessageTime: v.optional(v.number()),
})
  .index('by_user_pinned_lastMessageTime', [
    'userId',
    'pinned',
    'lastMessageTime',
  ])
  .searchIndex('search_by_title', {
    searchField: 'title',
    filterFields: ['lastMessageTime', 'source'],
  });

export const ChatFields = chatsTable.validator.fields;
