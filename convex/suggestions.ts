import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Create a new suggestion
export const createSuggestion = mutation({
  args: {
    documentId: v.id("documents"),
    originalText: v.string(),
    suggestedText: v.string(),
    description: v.optional(v.string()),
    userId: v.id("users"),
  },
  returns: v.id("suggestions"),
  handler: async (ctx, { documentId, originalText, suggestedText, description, userId }) => {
    const suggestionId = await ctx.db.insert("suggestions", {
      documentId,
      originalText,
      suggestedText,
      description,
      isResolved: false,
      userId,
    });
    
    return suggestionId;
  },
});

// Get suggestions by document ID
export const getSuggestionsByDocumentId = query({
  args: {
    documentId: v.id("documents"),
  },
  returns: v.array(v.object({
    _id: v.id("suggestions"),
    _creationTime: v.number(),
    documentId: v.id("documents"),
    originalText: v.string(),
    suggestedText: v.string(),
    description: v.optional(v.string()),
    isResolved: v.boolean(),
    userId: v.id("users"),
  })),
  handler: async (ctx, { documentId }) => {
    return await ctx.db
      .query("suggestions")
      .withIndex("by_document", (q) => q.eq("documentId", documentId))
      .order("desc")
      .collect();
  },
});

// Update suggestion resolution status
export const updateSuggestionResolution = mutation({
  args: {
    id: v.id("suggestions"),
    isResolved: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, { id, isResolved }) => {
    await ctx.db.patch(id, { isResolved });
    return null;
  },
});

// Delete suggestion
export const deleteSuggestion = mutation({
  args: {
    id: v.id("suggestions"),
  },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
    return null;
  },
});

// Save multiple suggestions at once
export const saveSuggestions = mutation({
  args: {
    suggestions: v.array(v.object({
      documentId: v.id("documents"),
      originalText: v.string(),
      suggestedText: v.string(),
      description: v.optional(v.string()),
      userId: v.id("users"),
    })),
  },
  returns: v.array(v.id("suggestions")),
  handler: async (ctx, { suggestions }) => {
    const suggestionIds: Array<any> = [];
    
    for (const suggestion of suggestions) {
      const id = await ctx.db.insert("suggestions", {
        ...suggestion,
        isResolved: false,
      });
      suggestionIds.push(id);
    }
    
    return suggestionIds;
  },
});