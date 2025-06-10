import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const chatsTable = defineTable({
  title: v.string(),
  userId: v.id('users'),
  model: v.string(),
  pinned: v.optional(v.boolean()),
  shared: v.optional(v.boolean()),
  // For branching conversations
  parentId: v.optional(v.id('chats')),
  updateTime: v.optional(v.number()),
  deleteTime: v.optional(v.number()),
})
  .index('by_parent_update_time', ['parentId', 'updateTime'])
  .index('by_shared_update_time', ['shared', 'updateTime'])
  .index('by_user_delete_time', ['userId', 'deleteTime'])
  .index('by_user_pinned_update_time', ['userId', 'pinned', 'updateTime']);
