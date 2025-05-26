import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Create a new document
export const createDocument = mutation({
  args: {
    title: v.string(),
    content: v.optional(v.string()),
    kind: v.union(
      v.literal("text"),
      v.literal("code"),
      v.literal("image"),
      v.literal("sheet")
    ),
    userId: v.id("users"),
  },
  returns: v.id("documents"),
  handler: async (ctx, { title, content, kind, userId }) => {
    const documentId = await ctx.db.insert("documents", {
      title,
      content,
      kind,
      userId,
    });
    
    return documentId;
  },
});

// Get document by ID
export const getDocumentById = query({
  args: {
    id: v.id("documents"),
  },
  returns: v.union(
    v.object({
      _id: v.id("documents"),
      _creationTime: v.number(),
      title: v.string(),
      content: v.optional(v.string()),
      kind: v.union(
        v.literal("text"),
        v.literal("code"),
        v.literal("image"),
        v.literal("sheet")
      ),
      userId: v.id("users"),
    }),
    v.null()
  ),
  handler: async (ctx, { id }) => {
    const document = await ctx.db.get(id);
    return document || null;
  },
});

// Get documents by user ID
export const getDocumentsByUserId = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.array(v.object({
    _id: v.id("documents"),
    _creationTime: v.number(),
    title: v.string(),
    content: v.optional(v.string()),
    kind: v.union(
      v.literal("text"),
      v.literal("code"),
      v.literal("image"),
      v.literal("sheet")
    ),
    userId: v.id("users"),
  })),
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

// Update document
export const updateDocument = mutation({
  args: {
    id: v.id("documents"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, { id, title, content }) => {
    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    
    await ctx.db.patch(id, updates);
    return null;
  },
});

// Delete document
export const deleteDocument = mutation({
  args: {
    id: v.id("documents"),
  },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    // Delete related suggestions first
    const suggestions = await ctx.db
      .query("suggestions")
      .withIndex("by_document", (q) => q.eq("documentId", id))
      .collect();
    
    for (const suggestion of suggestions) {
      await ctx.db.delete(suggestion._id);
    }
    
    // Delete the document
    await ctx.db.delete(id);
    
    return null;
  },
});

// Get all versions of documents by base ID (emulates the timestamp-based versioning)
export const getDocumentsById = query({
  args: {
    baseId: v.string(), // We'll store this as a field in documents
  },
  returns: v.array(v.object({
    _id: v.id("documents"),
    _creationTime: v.number(),
    title: v.string(),
    content: v.optional(v.string()),
    kind: v.union(
      v.literal("text"),
      v.literal("code"),
      v.literal("image"),
      v.literal("sheet")
    ),
    userId: v.id("users"),
    baseId: v.optional(v.string()),
  })),
  handler: async (ctx, { baseId }) => {
    // For now, just return documents that match the ID or have the same baseId
    // This is a simplified version of the timestamp-based versioning
    return await ctx.db
      .query("documents")
      .filter((q) => q.or(
        q.eq(q.field("_id"), baseId as any),
        q.eq(q.field("baseId"), baseId)
      ))
      .order("asc")
      .collect();
  },
});

// Save document with version support
export const saveDocument = mutation({
  args: {
    id: v.optional(v.string()),
    title: v.string(),
    content: v.optional(v.string()),
    kind: v.union(
      v.literal("text"),
      v.literal("code"),
      v.literal("image"), 
      v.literal("sheet")
    ),
    userId: v.id("users"),
    baseId: v.optional(v.string()),
  },
  returns: v.id("documents"),
  handler: async (ctx, { id, title, content, kind, userId, baseId }) => {
    const documentData = {
      title,
      content,
      kind,
      userId,
      baseId: baseId || id, // Use id as baseId if not provided
    };
    
    return await ctx.db.insert("documents", documentData);
  },
});

// Delete documents after a certain timestamp (for version cleanup)
export const deleteDocumentsByIdAfterTimestamp = mutation({
  args: {
    baseId: v.string(),
    timestamp: v.number(),
  },
  returns: v.array(v.id("documents")),
  handler: async (ctx, { baseId, timestamp }) => {
    const documentsToDelete = await ctx.db
      .query("documents")
      .filter((q) => q.and(
        q.or(
          q.eq(q.field("_id"), baseId as any),
          q.eq(q.field("baseId"), baseId)
        ),
        q.gt(q.field("_creationTime"), timestamp)
      ))
      .collect();
    
    const deletedIds: Array<any> = [];
    
    for (const doc of documentsToDelete) {
      // Delete related suggestions first
      const suggestions = await ctx.db
        .query("suggestions")
        .withIndex("by_document", (q) => q.eq("documentId", doc._id))
        .collect();
      
      for (const suggestion of suggestions) {
        await ctx.db.delete(suggestion._id);
      }
      
      await ctx.db.delete(doc._id);
      deletedIds.push(doc._id);
    }
    
    return deletedIds;
  },
});