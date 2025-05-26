import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { api } from "./_generated/api";
import { chatAgent } from "./agents";

const http = httpRouter();

// Authentication middleware
http.use({
  path: "/api/auth",
  method: "POST",
  handler: auth,
});

// Guest authentication endpoint
http.route({
  path: "/api/auth/guest",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const guestUser = await ctx.runMutation(api.users.createGuestUser);
      
      return new Response(JSON.stringify({
        user: {
          id: guestUser.id,
          email: guestUser.email,
          type: 'guest',
        }
      }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Guest auth error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to create guest user" }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }),
});

// Chat endpoint for streaming
http.route({
  path: "/api/chat",
  method: "POST", 
  handler: httpAction(async (ctx, request) => {
    const { id, message, selectedChatModel, selectedVisibilityType, userId } = (await request.json()) as {
      id: string;
      message: any;
      selectedChatModel?: string;
      selectedVisibilityType?: "public" | "private";
      userId?: string;
    };

    try {
      // Get or create chat
      let chat = await ctx.runQuery(api.chats.getChatById, { id: id as any });
      let threadId: string;

      if (!chat) {
        // Create new chat and thread
        const { threadId: newThreadId } = await chatAgent.createThread(ctx, {
          userId: userId || "anonymous",
          title: message.content || "New Chat",
        });
        
        // Save chat with thread reference
        const chatId = await ctx.runMutation(api.chats.createChat, {
          title: message.content || "New Chat",
          userId: userId as any,
          visibility: selectedVisibilityType || "private",
          threadId: newThreadId,
        });
        
        threadId = newThreadId;
      } else {
        threadId = chat.threadId || "";
      }

      // Continue conversation in thread
      const { thread } = await chatAgent.continueThread(ctx, { threadId });
      const result = await thread.streamText({ 
        prompt: message.content || message.parts?.[0]?.text || "",
      });
      
      return result.toTextStreamResponse();
    } catch (error) {
      console.error("Chat error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to process chat request" }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }),
});

// Chat GET endpoint for retrieving messages
http.route({
  path: "/api/chat",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const chatId = url.searchParams.get("chatId");

    if (!chatId) {
      return new Response(
        JSON.stringify({ error: "Missing chatId parameter" }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    try {
      const chat = await ctx.runQuery(api.chats.getChatById, { id: chatId as any });
      
      if (!chat || !chat.threadId) {
        return new Response(
          JSON.stringify({ error: "Chat or thread not found" }),
          { 
            status: 404,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      const messages = await ctx.runQuery(api.agents.getMessages, { 
        threadId: chat.threadId 
      });

      return new Response(JSON.stringify({ messages }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Chat GET error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to get chat messages" }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }),
});

// Chat DELETE endpoint
http.route({
  path: "/api/chat",
  method: "DELETE",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response(
        JSON.stringify({ error: "Missing id parameter" }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    try {
      await ctx.runMutation(api.chats.deleteChatById, { id: id as any });

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Chat DELETE error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to delete chat" }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }),
});

// Vote endpoint (POST for voting)
http.route({
  path: "/api/vote",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const { chatId, messageId, type, userId } = (await request.json()) as {
      chatId: string;
      messageId: string;
      type: "up" | "down";
      userId: string;
    };

    try {
      await ctx.runMutation(api.votes.voteMessage, {
        chatId: chatId as any,
        messageId,
        isUpvoted: type === "up",
        userId: userId as any,
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Vote error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to vote" }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }),
});

// Vote endpoint (GET for retrieving votes)
http.route({
  path: "/api/vote",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const chatId = url.searchParams.get("chatId");

    if (!chatId) {
      return new Response(
        JSON.stringify({ error: "Missing chatId parameter" }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    try {
      const votes = await ctx.runQuery(api.votes.getVotesByChatId, {
        chatId: chatId as any,
      });

      return new Response(JSON.stringify(votes), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Vote GET error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to get votes" }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }),
});

// Document endpoint
http.route({
  path: "/api/document",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const { title, content, kind, userId } = (await request.json()) as {
      title: string;
      content?: string;
      kind: "text" | "code" | "image" | "sheet";
      userId: string;
    };

    try {
      const documentId = await ctx.runMutation(api.documents.createDocument, {
        title,
        content,
        kind,
        userId: userId as any,
      });

      return new Response(JSON.stringify({ id: documentId }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Document error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to create document" }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }),
});

// History endpoint
http.route({
  path: "/api/history",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Missing userId parameter" }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    try {
      const chats = await ctx.runQuery(api.chats.getChatsByUserId, {
        userId: userId as any,
        paginationOpts: { numItems: 50, cursor: null },
      });

      return new Response(JSON.stringify(chats), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("History error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to get chat history" }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }),
});

// Suggestions endpoint
http.route({
  path: "/api/suggestions",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const { documentId, originalText, suggestedText, description, userId } = (await request.json()) as {
      documentId: string;
      originalText: string;
      suggestedText: string;
      description?: string;
      userId: string;
    };

    try {
      const suggestionId = await ctx.runMutation(api.suggestions.createSuggestion, {
        documentId: documentId as any,
        originalText,
        suggestedText,
        description,
        userId: userId as any,
      });

      return new Response(JSON.stringify({ id: suggestionId }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Suggestions error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to create suggestion" }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }),
});

// File upload endpoint
http.route({
  path: "/api/files/upload",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const formData = await request.formData();
      const file = formData.get("file") as File;
      
      if (!file) {
        return new Response(
          JSON.stringify({ error: "No file provided" }),
          { 
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      // Store file in Convex storage
      const blob = new Blob([await file.arrayBuffer()], { type: file.type });
      const storageId = await ctx.storage.store(blob);
      const fileUrl = await ctx.storage.getUrl(storageId);

      return new Response(JSON.stringify({ 
        id: storageId,
        url: fileUrl,
        name: file.name,
        type: file.type,
        size: file.size,
      }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("File upload error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to upload file" }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }),
});

export default http;