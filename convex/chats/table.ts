import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const chatsTable = defineTable({
  title: v.string(),
  userId: v.id('users'),
  model: v.string(),
  // source = share (created from shared chat)
  // source = branch (branched from existing chat)
  // source = undefined (created by user, original chat)
  source: v.optional(v.union(v.literal('branch'), v.literal('share'))),
  // For branching conversations
  parentId: v.optional(v.id('chats')),
  // The message up to which the shared/branch conversation ends
  referenceId: v.optional(v.id('messages')),
  // backfilled = true (chat was backfilled from a shared/branch chat),
  backfilled: v.optional(v.boolean()),
  type: v.optional(
    v.union(
      v.literal('deleted'),
      v.literal('archived'),
      v.literal('pinned'),
      v.literal('private')
    )
  ),
  updateTime: v.optional(v.float64()),
  deletionFailed: v.optional(v.boolean()),
  deleteTime: v.optional(v.float64()),
  lastMessageTime: v.optional(v.float64()),
})
  .index('by_user_type_lastMessageTime', ['userId', 'type', 'lastMessageTime'])
  .index('by_type_deletionFailed_deleteTime', [
    'type',
    'deletionFailed',
    'deleteTime',
  ])
  .searchIndex('search_by_title', {
    searchField: 'title',
    filterFields: ['lastMessageTime', 'source'],
  });

export const ChatFields = chatsTable.validator.fields;
