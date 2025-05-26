import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // User table - converted from PostgreSQL user table
  users: defineTable({
    email: v.string(),
    password: v.optional(v.string()),
    // Add isGuest flag to distinguish guest users
    isGuest: v.optional(v.boolean()),
  }).index("by_email", ["email"]),

  // Chat/Thread table - converted from PostgreSQL chat table
  // Note: we'll use Convex agents for this but keep a minimal chat table for compatibility
  chats: defineTable({
    title: v.string(),
    userId: v.id("users"),
    visibility: v.union(v.literal("public"), v.literal("private")),
    // Reference to agent thread
    threadId: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_visibility", ["visibility"])
    .index("by_thread", ["threadId"]),

  // Document table - converted from PostgreSQL document table  
  documents: defineTable({
    title: v.string(),
    content: v.optional(v.string()),
    kind: v.union(
      v.literal("text"),
      v.literal("code"), 
      v.literal("image"),
      v.literal("sheet")
    ),
    userId: v.id("users"),
    baseId: v.optional(v.string()), // For document versioning
  })
    .index("by_user", ["userId"])
    .index("by_base_id", ["baseId"]),

  // Suggestions table - converted from PostgreSQL suggestion table
  suggestions: defineTable({
    documentId: v.id("documents"),
    originalText: v.string(),
    suggestedText: v.string(),
    description: v.optional(v.string()),
    isResolved: v.boolean(),
    userId: v.id("users"),
  })
    .index("by_document", ["documentId"])
    .index("by_user", ["userId"])
    .index("by_resolved", ["isResolved"]),

  // Vote table - for message voting
  votes: defineTable({
    chatId: v.id("chats"),
    messageId: v.string(), // Reference to agent message ID
    isUpvoted: v.boolean(),
    userId: v.id("users"),
  })
    .index("by_chat", ["chatId"])
    .index("by_message", ["messageId"])
    .index("by_user", ["userId"]),
});