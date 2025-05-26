import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { generateHashedPassword } from "./utils";

// Create a new user
export const createUser = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  returns: v.id("users"),
  handler: async (ctx, { email, password }) => {
    const hashedPassword = generateHashedPassword(password);
    
    const userId = await ctx.db.insert("users", {
      email,
      password: hashedPassword,
      isGuest: false,
    });
    
    return userId;
  },
});

// Create a guest user
export const createGuestUser = mutation({
  args: {},
  returns: v.object({
    id: v.id("users"),
    email: v.string(),
  }),
  handler: async (ctx) => {
    const email = `guest-${Date.now()}`;
    const password = generateHashedPassword(`guest-${Math.random()}`);
    
    const userId = await ctx.db.insert("users", {
      email,
      password,
      isGuest: true,
    });
    
    return {
      id: userId,
      email,
    };
  },
});

// Get user by email
export const getUserByEmail = query({
  args: {
    email: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      email: v.string(),
      password: v.optional(v.string()),
      isGuest: v.optional(v.boolean()),
    }),
    v.null()
  ),
  handler: async (ctx, { email }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    
    return user || null;
  },
});

// Get user by ID
export const getUserById = query({
  args: {
    id: v.id("users"),
  },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      email: v.string(),
      password: v.optional(v.string()),
      isGuest: v.optional(v.boolean()),
    }),
    v.null()
  ),
  handler: async (ctx, { id }) => {
    const user = await ctx.db.get(id);
    return user || null;
  },
});