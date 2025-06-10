import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const usersTable = defineTable({
  clerkId: v.string(),
  deleteTime: v.optional(v.number()),
  favoriteModels: v.array(v.string()),
}).index('by_clerk_id', ['clerkId']);
