import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

// Create a new chat
export const createChat = mutation({
  args: {
    title: v.string(),
    userId: v.id("users"),
    visibility: v.union(v.literal("public"), v.literal("private")),
    threadId: v.optional(v.string()),
  },
  returns: v.id("chats"),
  handler: async (ctx, { title, userId, visibility, threadId }) => {
    const chatId = await ctx.db.insert("chats", {
      title,
      userId,
      visibility,
      threadId,
    });
    
    return chatId;
  },
});

// Get chat by ID
export const getChatById = query({
  args: {
    id: v.id("chats"),
  },
  returns: v.union(
    v.object({
      _id: v.id("chats"),
      _creationTime: v.number(),
      title: v.string(),
      userId: v.id("users"),
      visibility: v.union(v.literal("public"), v.literal("private")),
      threadId: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, { id }) => {
    const chat = await ctx.db.get(id);
    return chat || null;
  },
});

// Get chats by user ID with pagination
export const getChatsByUserId = query({
  args: {
    userId: v.id("users"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { userId, paginationOpts }) => {
    return await ctx.db
      .query("chats")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .paginate(paginationOpts);
  },
});

// Delete chat by ID
export const deleteChatById = mutation({
  args: {
    id: v.id("chats"),
  },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    // Delete related votes first
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_chat", (q) => q.eq("chatId", id))
      .collect();
    
    for (const vote of votes) {
      await ctx.db.delete(vote._id);
    }
    
    
    // Delete the chat
    await ctx.db.delete(id);
    
    return null;
  },
});

// Update chat visibility
export const updateChatVisibility = mutation({
  args: {
    chatId: v.id("chats"),
    visibility: v.union(v.literal("public"), v.literal("private")),
  },
  returns: v.null(),
  handler: async (ctx, { chatId, visibility }) => {
    await ctx.db.patch(chatId, { visibility });
    return null;
  },
});

// Save/update chat (used when creating chats from agents)
export const saveChat = mutation({
  args: {
    id: v.optional(v.id("chats")),
    title: v.string(),
    userId: v.id("users"),
    visibility: v.union(v.literal("public"), v.literal("private")),
    threadId: v.optional(v.string()),
  },
  returns: v.id("chats"),
  handler: async (ctx, { id, title, userId, visibility, threadId }) => {
    if (id) {
      // Update existing chat
      await ctx.db.patch(id, { title, visibility, threadId });
      return id;
    } else {
      // Create new chat
      return await ctx.db.insert("chats", {
        title,
        userId,
        visibility,
        threadId,
      });
    }
  },
});