import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const usersTable = defineTable({
  name: v.optional(v.string()),
  image: v.optional(v.string()),
  email: v.optional(v.string()),
  emailVerificationTime: v.optional(v.number()),
  phone: v.optional(v.string()),
  phoneVerificationTime: v.optional(v.number()),
  isAnonymous: v.optional(v.boolean()),
  messagesLeft: v.optional(v.number()),
  messagesPerDay: v.optional(v.number()),
})
  .index('email', ['email'])
  .index('phone', ['phone']);
