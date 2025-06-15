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
        fileSize: v.float64(),
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
  updateTime: v.optional(v.float64()),
}).index('by_chat_update_time', ['chatId', 'updateTime']);

export const MessageFields = messagesTable.validator.fields;
