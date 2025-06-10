import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const messagesTable = defineTable({
  chatId: v.id('chats'),
  role: v.union(v.literal('user'), v.literal('assistant'), v.literal('system')),
  content: v.string(),
  reasoning: v.optional(v.string()),
  attachments: v.optional(
    v.array(
      v.object({
        fileId: v.id('_storage'),
        fileName: v.string(),
        fileType: v.string(),
        fileSize: v.number(),
      })
    )
  ),
  model: v.optional(v.string()),
  status: v.optional(
    v.union(v.literal('pending'), v.literal('completed'), v.literal('thinking'))
  ),
  endReason: v.optional(
    v.union(
      v.literal('stop'),
      v.literal('error'),
      v.literal('complete'),
      v.literal('length'),
      v.literal('content-filter'),
      v.literal('tool-calls'),
      v.literal('other'),
      v.literal('unknown')
    )
  ),
  updateTime: v.optional(v.number()),
  deleteTime: v.optional(v.number()),
})
  .index('by_chat_update_time', ['chatId', 'updateTime'])
  .index('by_delete_time', ['deleteTime']);

export const Message = messagesTable.validator.fields;
