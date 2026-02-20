import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const ONLINE_THRESHOLD = 60000;

export const getMessages = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("messages").order("asc").collect();
  },
});

export const sendMessage = mutation({
  args: { alias: v.string(), text: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", {
      alias: args.alias,
      text: args.text.trim(),
      createdAt: Date.now(),
    });
  },
});

export const ping = mutation({
  args: { alias: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("presence")
      .withIndex("by_alias", (q) => q.eq("alias", args.alias))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { lastSeen: Date.now() });
    } else {
      await ctx.db.insert("presence", { alias: args.alias, lastSeen: Date.now() });
    }
  },
});

export const getOnlineCount = query({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - ONLINE_THRESHOLD;
    const all = await ctx.db.query("presence").collect();
    return all.filter((p) => p.lastSeen > cutoff).length;
  },
});
