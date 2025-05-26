import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Vote on a message
export const voteMessage = mutation({
  args: {
    chatId: v.id("chats"),
    messageId: v.string(),
    isUpvoted: v.boolean(),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, { chatId, messageId, isUpvoted, userId }) => {
    // Check if vote already exists
    const existingVote = await ctx.db
      .query("votes")
      .withIndex("by_message", (q) => q.eq("messageId", messageId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();
    
    if (existingVote) {
      // Update existing vote
      await ctx.db.patch(existingVote._id, { isUpvoted });
    } else {
      // Create new vote
      await ctx.db.insert("votes", {
        chatId,
        messageId,
        isUpvoted,
        userId,
      });
    }
    
    return null;
  },
});

// Get votes by chat ID
export const getVotesByChatId = query({
  args: {
    chatId: v.id("chats"),
  },
  returns: v.array(v.object({
    _id: v.id("votes"),
    _creationTime: v.number(),
    chatId: v.id("chats"),
    messageId: v.string(),
    isUpvoted: v.boolean(),
    userId: v.id("users"),
  })),
  handler: async (ctx, { chatId }) => {
    return await ctx.db
      .query("votes")
      .withIndex("by_chat", (q) => q.eq("chatId", chatId))
      .collect();
  },
});

// Get vote by message ID and user ID
export const getVoteByMessageAndUser = query({
  args: {
    messageId: v.string(),
    userId: v.id("users"),
  },
  returns: v.union(
    v.object({
      _id: v.id("votes"),
      _creationTime: v.number(),
      chatId: v.id("chats"),
      messageId: v.string(),
      isUpvoted: v.boolean(),
      userId: v.id("users"),
    }),
    v.null()
  ),
  handler: async (ctx, { messageId, userId }) => {
    const vote = await ctx.db
      .query("votes")
      .withIndex("by_message", (q) => q.eq("messageId", messageId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();
    
    return vote || null;
  },
});