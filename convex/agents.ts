import { Agent } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";
import { action, query } from "./_generated/server";
import { components } from "./_generated/api";
import { v } from "convex/values";
import type { UsageHandler } from "@convex-dev/agent";

const usageHandler: UsageHandler = async (_ctx, args) => {
  console.log("token usage", args);
};

// Define the main chat agent
export const chatAgent = new Agent(components.agent, {
  name: "AI Assistant",
  chat: openai.chat("gpt-4o"),
  textEmbedding: openai.embedding("text-embedding-3-small"),
  instructions: `You are a helpful AI assistant in a chat application. You can:
- Answer questions and have conversations
- Help with coding and technical topics  
- Provide explanations and assistance with various tasks
- Remember context from previous messages in the conversation
- Be concise but helpful in your responses

Always maintain a friendly and professional tone.`,
  maxSteps: 5,
  usageHandler,
});

// Create a new thread
export const createThread = chatAgent.createThreadMutation();

// Generate a response in a thread
export const generateResponse = chatAgent.asTextAction({
  maxSteps: 3,
});

// Stream a response in a thread  
export const streamResponse = chatAgent.asStreamAction({
  maxSteps: 3,
});

// Get messages from a thread
export const getMessages = query({
  args: { 
    threadId: v.string(),
  },
  handler: async (ctx, { threadId }) => {
    const messages = await ctx.runQuery(
      components.agent.messages.listMessagesByThreadId,
      { threadId }
    );
    return messages;
  },
});

// Get threads for a user
export const getThreads = query({
  args: { 
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    const threads = await ctx.runQuery(
      components.agent.threads.listThreadsByUserId,
      { userId }
    );
    return threads;
  },
});

// Continue an existing thread
export const continueThread = action({
  args: {
    threadId: v.string(),
    prompt: v.string(),
  },
  returns: v.object({
    text: v.string(),
    messageId: v.string(),
  }),
  handler: async (ctx, { threadId, prompt }) => {
    const { thread } = await chatAgent.continueThread(ctx, { threadId });
    const { text, messageId } = await thread.generateText({ prompt });
    return { text, messageId };
  },
});

// Create thread and generate initial response
export const createThreadAndGenerate = action({
  args: {
    userId: v.string(),
    prompt: v.string(),
    title: v.optional(v.string()),
  },
  returns: v.object({
    threadId: v.string(),
    text: v.string(),
    messageId: v.string(),
  }),
  handler: async (ctx, { userId, prompt, title }) => {
    const { threadId, thread } = await chatAgent.createThread(ctx, {
      userId,
      title: title || "New Chat",
    });
    
    const { text, messageId } = await thread.generateText({ prompt });
    
    return { threadId, text, messageId };
  },
});