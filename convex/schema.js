import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  messages: defineTable({
    alias: v.string(),
    text: v.string(),
    createdAt: v.number(),
  }),
  presence: defineTable({
    alias: v.string(),
    lastSeen: v.number(),
  }).index("by_alias", ["alias"]),
});
