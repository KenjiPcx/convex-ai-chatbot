# Convex guidelines
## Function guidelines
### New function syntax
- ALWAYS use the new function syntax for Convex functions. For example:
      ```typescript
      import { query } from "./_generated/server";
      import { v } from "convex/values";
      export const f = query({
          args: {},
          returns: v.null(),
          handler: async (ctx, args) => {
          // Function body
          },
      });
      ```

### Http endpoint syntax
- HTTP endpoints are defined in `convex/http.ts` and require an `httpAction` decorator. For example:
      ```typescript
      import { httpRouter } from "convex/server";
      import { httpAction } from "./_generated/server";
      const http = httpRouter();
      http.route({
          path: "/echo",
          method: "POST",
          handler: httpAction(async (ctx, req) => {
          const body = await req.bytes();
          return new Response(body, { status: 200 });
          }),
      });
      ```
- HTTP endpoints are always registered at the exact path you specify in the `path` field. For example, if you specify `/api/someRoute`, the endpoint will be registered at `/api/someRoute`.

### Validators
- Below is an example of an array validator:
                            ```typescript
                            import { mutation } from "./_generated/server";
                            import { v } from "convex/values";

                            export default mutation({
                            args: {
                                simpleArray: v.array(v.union(v.string(), v.number())),
                            },
                            handler: async (ctx, args) => {
                                //...
                            },
                            });
                            ```
- Below is an example of a schema with validators that codify a discriminated union type:
                            ```typescript
                            import { defineSchema, defineTable } from "convex/server";
                            import { v } from "convex/values";

                            export default defineSchema({
                                results: defineTable(
                                    v.union(
                                        v.object({
                                            kind: v.literal("error"),
                                            errorMessage: v.string(),
                                        }),
                                        v.object({
                                            kind: v.literal("success"),
                                            value: v.number(),
                                        }),
                                    ),
                                )
                            });
                            ```
- Always use the `v.null()` validator when returning a null value. Below is an example query that returns a null value:
                                  ```typescript
                                  import { query } from "./_generated/server";
                                  import { v } from "convex/values";

                                  export const exampleQuery = query({
                                    args: {},
                                    returns: v.null(),
                                    handler: async (ctx, args) => {
                                        console.log("This query returns a null value");
                                        return null;
                                    },
                                  });
                                  ```
- Here are the valid Convex types along with their respective validators:
 Convex Type  | TS/JS type  |  Example Usage         | Validator for argument validation and schemas  | Notes                                                                                                                                                                                                 |
| ----------- | ------------| -----------------------| -----------------------------------------------| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Id          | string      | `doc._id`              | `v.id(tableName)`                              |                                                                                                                                                                                                       |
| Null        | null        | `null`                 | `v.null()`                                     | JavaScript's `undefined` is not a valid Convex value. Functions the return `undefined` or do not return will return `null` when called from a client. Use `null` instead.                             |
| Int64       | bigint      | `3n`                   | `v.int64()`                                    | Int64s only support BigInts between -2^63 and 2^63-1. Convex supports `bigint`s in most modern browsers.                                                                                              |
| Float64     | number      | `3.1`                  | `v.number()`                                   | Convex supports all IEEE-754 double-precision floating point numbers (such as NaNs). Inf and NaN are JSON serialized as strings.                                                                      |
| Boolean     | boolean     | `true`                 | `v.boolean()`                                  |
| String      | string      | `"abc"`                | `v.string()`                                   | Strings are stored as UTF-8 and must be valid Unicode sequences. Strings must be smaller than the 1MB total size limit when encoded as UTF-8.                                                         |
| Bytes       | ArrayBuffer | `new ArrayBuffer(8)`   | `v.bytes()`                                    | Convex supports first class bytestrings, passed in as `ArrayBuffer`s. Bytestrings must be smaller than the 1MB total size limit for Convex types.                                                     |
| Array       | Array]      | `[1, 3.2, "abc"]`      | `v.array(values)`                              | Arrays can have at most 8192 values.                                                                                                                                                                  |
| Object      | Object      | `{a: "abc"}`           | `v.object({property: value})`                  | Convex only supports "plain old JavaScript objects" (objects that do not have a custom prototype). Objects can have at most 1024 entries. Field names must be nonempty and not start with "$" or "_". |
| Record      | Record      | `{"a": "1", "b": "2"}` | `v.record(keys, values)`                       | Records are objects at runtime, but can have dynamic keys. Keys must be only ASCII characters, nonempty, and not start with "$" or "_".                                                               |

### Function registration
- Use `internalQuery`, `internalMutation`, and `internalAction` to register internal functions. These functions are private and aren't part of an app's API. They can only be called by other Convex functions. These functions are always imported from `./_generated/server`.
- Use `query`, `mutation`, and `action` to register public functions. These functions are part of the public API and are exposed to the public Internet. Do NOT use `query`, `mutation`, or `action` to register sensitive internal functions that should be kept private.
- You CANNOT register a function through the `api` or `internal` objects.
- ALWAYS include argument and return validators for all Convex functions. This includes all of `query`, `internalQuery`, `mutation`, `internalMutation`, `action`, and `internalAction`. If a function doesn't return anything, include `returns: v.null()` as its output validator.
- If the JavaScript implementation of a Convex function doesn't have a return value, it implicitly returns `null`.

### Function calling
- Use `ctx.runQuery` to call a query from a query, mutation, or action.
- Use `ctx.runMutation` to call a mutation from a mutation or action.
- Use `ctx.runAction` to call an action from an action.
- ONLY call an action from another action if you need to cross runtimes (e.g. from V8 to Node). Otherwise, pull out the shared code into a helper async function and call that directly instead.
- Try to use as few calls from actions to queries and mutations as possible. Queries and mutations are transactions, so splitting logic up into multiple calls introduces the risk of race conditions.
- All of these calls take in a `FunctionReference`. Do NOT try to pass the callee function directly into one of these calls.
- When using `ctx.runQuery`, `ctx.runMutation`, or `ctx.runAction` to call a function in the same file, specify a type annotation on the return value to work around TypeScript circularity limitations. For example,
                            ```
                            export const f = query({
                              args: { name: v.string() },
                              returns: v.string(),
                              handler: async (ctx, args) => {
                                return "Hello " + args.name;
                              },
                            });

                            export const g = query({
                              args: {},
                              returns: v.null(),
                              handler: async (ctx, args) => {
                                const result: string = await ctx.runQuery(api.example.f, { name: "Bob" });
                                return null;
                              },
                            });
                            ```

### Function references
- Function references are pointers to registered Convex functions.
- Use the `api` object defined by the framework in `convex/_generated/api.ts` to call public functions registered with `query`, `mutation`, or `action`.
- Use the `internal` object defined by the framework in `convex/_generated/api.ts` to call internal (or private) functions registered with `internalQuery`, `internalMutation`, or `internalAction`.
- Convex uses file-based routing, so a public function defined in `convex/example.ts` named `f` has a function reference of `api.example.f`.
- A private function defined in `convex/example.ts` named `g` has a function reference of `internal.example.g`.
- Functions can also registered within directories nested within the `convex/` folder. For example, a public function `h` defined in `convex/messages/access.ts` has a function reference of `api.messages.access.h`.

### Api design
- Convex uses file-based routing, so thoughtfully organize files with public query, mutation, or action functions within the `convex/` directory.
- Use `query`, `mutation`, and `action` to define public functions.
- Use `internalQuery`, `internalMutation`, and `internalAction` to define private, internal functions.

### Pagination
- Paginated queries are queries that return a list of results in incremental pages.
- You can define pagination using the following syntax:

                            ```ts
                            import { v } from "convex/values";
                            import { query, mutation } from "./_generated/server";
                            import { paginationOptsValidator } from "convex/server";
                            export const listWithExtraArg = query({
                                args: { paginationOpts: paginationOptsValidator, author: v.string() },
                                handler: async (ctx, args) => {
                                    return await ctx.db
                                    .query("messages")
                                    .filter((q) => q.eq(q.field("author"), args.author))
                                    .order("desc")
                                    .paginate(args.paginationOpts);
                                },
                            });
                            ```
                            Note: `paginationOpts` is an object with the following properties:
                            - `numItems`: the maximum number of documents to return (the validator is `v.number()`)
                            - `cursor`: the cursor to use to fetch the next page of documents (the validator is `v.union(v.string(), v.null())`)
- A query that ends in `.paginate()` returns an object that has the following properties:
                            - page (contains an array of documents that you fetches)
                            - isDone (a boolean that represents whether or not this is the last page of documents)
                            - continueCursor (a string that represents the cursor to use to fetch the next page of documents)


## Validator guidelines
- `v.bigint()` is deprecated for representing signed 64-bit integers. Use `v.int64()` instead.
- Use `v.record()` for defining a record type. `v.map()` and `v.set()` are not supported.

## Schema guidelines
- Always define your schema in `convex/schema.ts`.
- Always import the schema definition functions from `convex/server`:
- System fields are automatically added to all documents and are prefixed with an underscore. The two system fields that are automatically added to all documents are `_creationTime` which has the validator `v.number()` and `_id` which has the validator `v.id(tableName)`.
- Always include all index fields in the index name. For example, if an index is defined as `["field1", "field2"]`, the index name should be "by_field1_and_field2".
- Index fields must be queried in the same order they are defined. If you want to be able to query by "field1" then "field2" and by "field2" then "field1", you must create separate indexes.

## Typescript guidelines
- You can use the helper typescript type `Id` imported from './_generated/dataModel' to get the type of the id for a given table. For example if there is a table called 'users' you can use `Id<'users'>` to get the type of the id for that table.
- If you need to define a `Record` make sure that you correctly provide the type of the key and value in the type. For example a validator `v.record(v.id('users'), v.string())` would have the type `Record<Id<'users'>, string>`. Below is an example of using `Record` with an `Id` type in a query:
                    ```ts
                    import { query } from "./_generated/server";
                    import { Doc, Id } from "./_generated/dataModel";

                    export const exampleQuery = query({
                        args: { userIds: v.array(v.id("users")) },
                        returns: v.record(v.id("users"), v.string()),
                        handler: async (ctx, args) => {
                            const idToUsername: Record<Id<"users">, string> = {};
                            for (const userId of args.userIds) {
                                const user = await ctx.db.get(userId);
                                if (user) {
                                    users[user._id] = user.username;
                                }
                            }

                            return idToUsername;
                        },
                    });
                    ```
- Be strict with types, particularly around id's of documents. For example, if a function takes in an id for a document in the 'users' table, take in `Id<'users'>` rather than `string`.
- Always use `as const` for string literals in discriminated union types.
- When using the `Array` type, make sure to always define your arrays as `const array: Array<T> = [...];`
- When using the `Record` type, make sure to always define your records as `const record: Record<KeyType, ValueType> = {...};`
- Always add `@types/node` to your `package.json` when using any Node.js built-in modules.

## Full text search guidelines
- A query for "10 messages in channel '#general' that best match the query 'hello hi' in their body" would look like:

const messages = await ctx.db
  .query("messages")
  .withSearchIndex("search_body", (q) =>
    q.search("body", "hello hi").eq("channel", "#general"),
  )
  .take(10);

## Query guidelines
- Do NOT use `filter` in queries. Instead, define an index in the schema and use `withIndex` instead.
- Convex queries do NOT support `.delete()`. Instead, `.collect()` the results, iterate over them, and call `ctx.db.delete(row._id)` on each result.
- Use `.unique()` to get a single document from a query. This method will throw an error if there are multiple documents that match the query.
- When using async iteration, don't use `.collect()` or `.take(n)` on the result of a query. Instead, use the `for await (const row of query)` syntax.
### Ordering
- By default Convex always returns documents in ascending `_creationTime` order.
- You can use `.order('asc')` or `.order('desc')` to pick whether a query is in ascending or descending order. If the order isn't specified, it defaults to ascending.
- Document queries that use indexes will be ordered based on the columns in the index and can avoid slow table scans.


## Mutation guidelines
- Use `ctx.db.replace` to fully replace an existing document. This method will throw an error if the document does not exist.
- Use `ctx.db.patch` to shallow merge updates into an existing document. This method will throw an error if the document does not exist.

## Action guidelines
- Always add `"use node";` to the top of files containing actions that use Node.js built-in modules.
- Never use `ctx.db` inside of an action. Actions don't have access to the database.
- Below is an example of the syntax for an action:
                    ```ts
                    import { action } from "./_generated/server";

                    export const exampleAction = action({
                        args: {},
                        returns: v.null(),
                        handler: async (ctx, args) => {
                            console.log("This action does not return anything");
                            return null;
                        },
                    });
                    ```

## Scheduling guidelines
### Cron guidelines
- Only use the `crons.interval` or `crons.cron` methods to schedule cron jobs. Do NOT use the `crons.hourly`, `crons.daily`, or `crons.weekly` helpers.
- Both cron methods take in a FunctionReference. Do NOT try to pass the function directly into one of these methods.
- Define crons by declaring the top-level `crons` object, calling some methods on it, and then exporting it as default. For example,
                            ```ts
                            import { cronJobs } from "convex/server";
                            import { internal } from "./_generated/api";
                            import { internalAction } from "./_generated/server";

                            const empty = internalAction({
                              args: {},
                              returns: v.null(),
                              handler: async (ctx, args) => {
                                console.log("empty");
                              },
                            });

                            const crons = cronJobs();

                            // Run `internal.crons.empty` every two hours.
                            crons.interval("delete inactive users", { hours: 2 }, internal.crons.empty, {});

                            export default crons;
                            ```
- You can register Convex functions within `crons.ts` just like any other file.
- If a cron calls an internal function, always import the `internal` object from '_generated/api`, even if the internal function is registered in the same file.


## File storage guidelines
- Convex includes file storage for large files like images, videos, and PDFs.
- The `ctx.storage.getUrl()` method returns a signed URL for a given file. It returns `null` if the file doesn't exist.
- Do NOT use the deprecated `ctx.storage.getMetadata` call for loading a file's metadata.

                    Instead, query the `_storage` system table. For example, you can use `ctx.db.system.get` to get an `Id<"_storage">`.
                    ```
                    import { query } from "./_generated/server";
                    import { Id } from "./_generated/dataModel";

                    type FileMetadata = {
                        _id: Id<"_storage">;
                        _creationTime: number;
                        contentType?: string;
                        sha256: string;
                        size: number;
                    }

                    export const exampleQuery = query({
                        args: { fileId: v.id("_storage") },
                        returns: v.null();
                        handler: async (ctx, args) => {
                            const metadata: FileMetadata | null = await ctx.db.system.get(args.fileId);
                            console.log(metadata);
                            return null;
                        },
                    });
                    ```
- Convex storage stores items as `Blob` objects. You must convert all items to/from a `Blob` when using Convex storage.


# Examples:
## Example: chat-app

### Task
```
Create a real-time chat application backend with AI responses. The app should:
- Allow creating users with names
- Support multiple chat channels
- Enable users to send messages to channels
- Automatically generate AI responses to user messages
- Show recent message history

The backend should provide APIs for:
1. User management (creation)
2. Channel management (creation)
3. Message operations (sending, listing)
4. AI response generation using OpenAI's GPT-4

Messages should be stored with their channel, author, and content. The system should maintain message order
and limit history display to the 10 most recent messages per channel.

```

### Analysis
1. Task Requirements Summary:
- Build a real-time chat backend with AI integration
- Support user creation
- Enable channel-based conversations
- Store and retrieve messages with proper ordering
- Generate AI responses automatically

2. Main Components Needed:
- Database tables: users, channels, messages
- Public APIs for user/channel management
- Message handling functions
- Internal AI response generation system
- Context loading for AI responses

3. Public API and Internal Functions Design:
Public Mutations:
- createUser:
  - file path: convex/index.ts
  - arguments: {name: v.string()}
  - returns: v.object({userId: v.id("users")})
  - purpose: Create a new user with a given name
- createChannel:
  - file path: convex/index.ts
  - arguments: {name: v.string()}
  - returns: v.object({channelId: v.id("channels")})
  - purpose: Create a new channel with a given name
- sendMessage:
  - file path: convex/index.ts
  - arguments: {channelId: v.id("channels"), authorId: v.id("users"), content: v.string()}
  - returns: v.null()
  - purpose: Send a message to a channel and schedule a response from the AI

Public Queries:
- listMessages:
  - file path: convex/index.ts
  - arguments: {channelId: v.id("channels")}
  - returns: v.array(v.object({
    _id: v.id("messages"),
    _creationTime: v.number(),
    channelId: v.id("channels"),
    authorId: v.optional(v.id("users")),
    content: v.string(),
    }))
  - purpose: List the 10 most recent messages from a channel in descending creation order

Internal Functions:
- generateResponse:
  - file path: convex/index.ts
  - arguments: {channelId: v.id("channels")}
  - returns: v.null()
  - purpose: Generate a response from the AI for a given channel
- loadContext:
  - file path: convex/index.ts
  - arguments: {channelId: v.id("channels")}
  - returns: v.array(v.object({
    _id: v.id("messages"),
    _creationTime: v.number(),
    channelId: v.id("channels"),
    authorId: v.optional(v.id("users")),
    content: v.string(),
  }))
- writeAgentResponse:
  - file path: convex/index.ts
  - arguments: {channelId: v.id("channels"), content: v.string()}
  - returns: v.null()
  - purpose: Write an AI response to a given channel

4. Schema Design:
- users
  - validator: { name: v.string() }
  - indexes: <none>
- channels
  - validator: { name: v.string() }
  - indexes: <none>
- messages
  - validator: { channelId: v.id("channels"), authorId: v.optional(v.id("users")), content: v.string() }
  - indexes
    - by_channel: ["channelId"]

5. Background Processing:
- AI response generation runs asynchronously after each user message
- Uses OpenAI's GPT-4 to generate contextual responses
- Maintains conversation context using recent message history


### Implementation

#### package.json
```typescript
{
  "name": "chat-app",
  "description": "This example shows how to build a chat app without authentication.",
  "version": "1.0.0",
  "dependencies": {
    "convex": "^1.17.4",
    "openai": "^4.79.0"
  },
  "devDependencies": {
    "typescript": "^5.7.3"
  }
}
```

#### tsconfig.json
```typescript
{
  "compilerOptions": {
    "target": "ESNext",
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "skipLibCheck": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "exclude": ["convex"],
  "include": ["**/src/**/*.tsx", "**/src/**/*.ts", "vite.config.ts"]
}
```

#### convex/index.ts
```typescript
import {
  query,
  mutation,
  internalQuery,
  internalMutation,
  internalAction,
} from "./_generated/server";
import { v } from "convex/values";
import OpenAI from "openai";
import { internal } from "./_generated/api";

/**
 * Create a user with a given name.
 */
export const createUser = mutation({
  args: {
    name: v.string(),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", { name: args.name });
  },
});

/**
 * Create a channel with a given name.
 */
export const createChannel = mutation({
  args: {
    name: v.string(),
  },
  returns: v.id("channels"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("channels", { name: args.name });
  },
});

/**
 * List the 10 most recent messages from a channel in descending creation order.
 */
export const listMessages = query({
  args: {
    channelId: v.id("channels"),
  },
  returns: v.array(
    v.object({
      _id: v.id("messages"),
      _creationTime: v.number(),
      channelId: v.id("channels"),
      authorId: v.optional(v.id("users")),
      content: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .order("desc")
      .take(10);
    return messages;
  },
});

/**
 * Send a message to a channel and schedule a response from the AI.
 */
export const sendMessage = mutation({
  args: {
    channelId: v.id("channels"),
    authorId: v.id("users"),
    content: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const channel = await ctx.db.get(args.channelId);
    if (!channel) {
      throw new Error("Channel not found");
    }
    const user = await ctx.db.get(args.authorId);
    if (!user) {
      throw new Error("User not found");
    }
    await ctx.db.insert("messages", {
      channelId: args.channelId,
      authorId: args.authorId,
      content: args.content,
    });
    await ctx.scheduler.runAfter(0, internal.index.generateResponse, {
      channelId: args.channelId,
    });
    return null;
  },
});

const openai = new OpenAI();

export const generateResponse = internalAction({
  args: {
    channelId: v.id("channels"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const context = await ctx.runQuery(internal.index.loadContext, {
      channelId: args.channelId,
    });
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: context,
    });
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in response");
    }
    await ctx.runMutation(internal.index.writeAgentResponse, {
      channelId: args.channelId,
      content,
    });
    return null;
  },
});

export const loadContext = internalQuery({
  args: {
    channelId: v.id("channels"),
  },
  returns: v.array(
    v.object({
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const channel = await ctx.db.get(args.channelId);
    if (!channel) {
      throw new Error("Channel not found");
    }
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .order("desc")
      .take(10);

    const result = [];
    for (const message of messages) {
      if (message.authorId) {
        const user = await ctx.db.get(message.authorId);
        if (!user) {
          throw new Error("User not found");
        }
        result.push({
          role: "user" as const,
          content: `${user.name}: ${message.content}`,
        });
      } else {
        result.push({ role: "assistant" as const, content: message.content });
      }
    }
    return result;
  },
});

export const writeAgentResponse = internalMutation({
  args: {
    channelId: v.id("channels"),
    content: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", {
      channelId: args.channelId,
      content: args.content,
    });
    return null;
  },
});
```

#### convex/schema.ts
```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  channels: defineTable({
    name: v.string(),
  }),

  users: defineTable({
    name: v.string(),
  }),

  messages: defineTable({
    channelId: v.id("channels"),
    authorId: v.optional(v.id("users")),
    content: v.string(),
  }).index("by_channel", ["channelId"]),
});
```

#### src/App.tsx
```typescript
export default function App() {
  return <div>Hello World</div>;
}
```

## Example: agents

### Convex AI Agent Component

LLM-friendly documentation for the Convex AI Agent component, providing a structured overview for developers integrating AI agents with Convex.

---

#### Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Creating an Agent](#creating-an-agent)
6. [Using the Agent](#using-the-agent)

   * [Starting a Thread](#starting-a-thread)
   * [Continuing a Thread](#continuing-a-thread)
   * [Generating Text and Objects](#generating-text-and-objects)
7. [Tool Integration](#tool-integration)
8. [Playground UI](#playground-ui)
9. [Workflows](#workflows)
10. [Advanced Features](#advanced-features)
11. [Troubleshooting](#troubleshooting)

---

### Overview

The Convex AI Agent component wraps the Convex backend in an LLM-friendly API for building AI-driven chatbots and agents. It provides:

* **Threaded Conversations**: Manage per-user or per-thread chat history.
* **RAG Support**: Hybrid text and vector search for context retrieval.
* **Tool Calls**: Integrate custom tools via the Convex SDK and AI SDK.
* **Workflows**: Durable, long-lived workflows with Convex Workflows.
* **Real-time Updates**: Reactive updates from functions and workflows.

## Prerequisites

* A Convex project with `npm create convex` or a quickstart.
* Node.js and npm installed.
* OpenAI API key for LLM and embeddings.

## Installation

```bash
npm install @convex-dev/agent
```

Add the component to your Convex app in `convex/convex.config.ts`:

```ts
import { defineApp } from "convex/server";
import agent from "@convex-dev/agent/convex.config";

const app = defineApp();
app.use(agent);
export default app;
```

### Configuration

Configure the Agent in your code:

```ts
import { Agent } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";
import { components } from "./_generated/api";

const supportAgent = new Agent(components.agent, {
  chat: openai.chat("gpt-4o-mini"),
  textEmbedding: openai.embedding("text-embedding-3-small"),
  instructions: "You are a helpful assistant.",
  tools: {},
  contextOptions: {},
  storageOptions: {},
  maxSteps: 1,
  maxRetries: 3,
});
```

### Creating an Agent

Define tools and system instructions:

```ts
import { tool } from "ai";
import { createTool } from "@convex-dev/agent";

const myConvexTool = createTool({
  description: "My Convex tool",
  args: z.object({ key: z.string() }),
  handler: async (ctx, args) => {
    // Custom logic using ctx.runQuery or runMutation
    return "result";
  },
});

const agent = new Agent(components.agent, {
  chat: openai.chat("gpt-4o-mini"),
  tools: { myConvexTool },
  textEmbedding: openai.embedding("text-embedding-3-small"),
});
```

### Using the Agent

#### Starting a Thread

```ts
export const createThread = action({
  args: { prompt: v.string(), userId: v.string() },
  handler: async (ctx, { prompt, userId }) => {
    const { threadId, thread } = await supportAgent.createThread(ctx, { userId });
    const result = await thread.generateText({ prompt });
    return { threadId, initialResponse: result.text };
  },
});
```

#### Continuing a Thread

```ts
export const continueThread = action({
  args: { prompt: v.string(), threadId: v.string() },
  handler: async (ctx, { prompt, threadId }) => {
    const { thread } = await supportAgent.continueThread(ctx, { threadId });
    return (await thread.generateText({ prompt })).text;
  },
});
```

#### Generating Text and Objects

* **Text**: `thread.generateText({ prompt })`
* **Structured Object**: `thread.generateObject({ prompt, schema })`

### Tool Integration

Use `createTool` or AI SDK `tool` to wrap Convex queries:

```ts
const ideaSearch = createTool({
  description: "Search ideas",
  args: z.object({ query: z.string() }),
  handler: async (ctx, args) => {
    return ctx.runQuery(api.ideas.searchIdeas, args);
  },
});
```

Pass tools at constructor, createThread, generateText, etc.

### Playground UI

Run locally with:

```bash
npx @convex-dev/agent-playground
```

or use the hosted demo on GitHub pages.

### Workflows

Integrate with Convex Workflows:

```ts
export const supportAgentWorkflow = workflow.define({
  args: { prompt: v.string(), userId: v.string() },
  handler: async (step, { prompt, userId }) => {
    const { threadId } = await step.runMutation(internal.example.createThread, { userId, title: "Support" });
    const suggestion = await step.runAction(internal.example.getSupport, { threadId, prompt, userId });
    await step.runMutation(internal.example.sendUserMessage, { userId, message: suggestion });
  },
});
```

### Advanced Features

* **Context Options**: customize search and recent messages
* **Storage Options**: control message persistence
* **Embeddings Management**: generate, update, and delete vectors
* **Token Usage**: implement `usageHandler` for billing or logs

### Troubleshooting

* Avoid circular dependencies by typing handler returns.
* Check `maxSteps` for tool call loops.
* Review contextOptions to include/exclude tool messages.

### Actual agent examples

```typescript
import { paginationOptsValidator, PaginationResult } from "convex/server";
import { WorkflowManager } from "@convex-dev/workflow";
import { Agent, createTool } from "@convex-dev/agent";
import type { ThreadDoc, UsageHandler } from "@convex-dev/agent";
import { components, internal } from "./_generated/api";
import { openai } from "@ai-sdk/openai";
import { action, httpAction, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { z } from "zod";
import { getGeocoding, getWeather } from "./weather";
import { tool } from "ai";

const usageHandler: UsageHandler = async (_ctx, args) => {
  console.log("token usage", args);
};

// Define an agent similarly to the AI SDK
export const weatherAgent = new Agent(components.agent, {
  name: "Weather Agent",
  chat: openai.chat("gpt-4o-mini"),
  textEmbedding: openai.embedding("text-embedding-3-small"),
  instructions:
    "You describe the weather for a location as if you were a TV weather reporter.",
  tools: {
    getWeather,
    getGeocoding,
  },
  maxSteps: 3,
  usageHandler,
});

export const fashionAgent = new Agent(components.agent, {
  name: "Fashion Agent",
  chat: openai.chat("gpt-4o-mini"),
  textEmbedding: openai.embedding("text-embedding-3-small"),
  instructions:
    "You give fashion advice for a place a user is visiting, based on the weather.",
  tools: {
    getUserPreferences: createTool({
      description: "Get clothing preferences for a user",
      args: z.object({
        search: z.string().describe("Which preferences are requested"),
      }),
      handler: async (ctx, args) => {
        console.log("getting user preferences", args);
        return {
          userId: ctx.userId,
          threadId: ctx.threadId,
          search: args.search,
          information: `The user likes to look stylish`,
        };
      },
    }),
  },
  maxSteps: 5,
  usageHandler,
});

// Create a thread from within a mutation and generate text
export const createThreadAndGenerateText = action({
  args: { location: v.string(), userId: v.optional(v.string()) },
  handler: async (ctx, { location, userId }) => {
    const { threadId, thread } = await weatherAgent.createThread(ctx, {
      userId,
      title: `Weather in ${location}`,
    });
    // Use the thread object from within an action to generate text:
    const result = await thread.generateText({
      prompt: `What is the weather in ${location}?`,
    });
    return { threadId, text: result.text };
  },
});

export const continueThread = action({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    // This includes previous message history from the thread automatically.
    const { thread } = await fashionAgent.continueThread(ctx, { threadId });
    const { text, messageId } = await thread.generateText({
      prompt: `What should I wear  based on the weather?`,
    });
    return { text, messageId };
  },
});

/**
 * Expose the agents as actions
 */
export const createThread = weatherAgent.createThreadMutation();
export const getForecast = weatherAgent.asTextAction({
  maxSteps: 3,
});
export const getFashionAdvice = fashionAgent.asObjectAction({
  schema: z.object({
    hat: z.string(),
    tops: z.string(),
    bottoms: z.string(),
    shoes: z.string(),
  }),
});
type Outfit = { hat: string; tops: string; bottoms: string; shoes: string };

/**
 * Use agent actions in a workflow
 * Note: you can also call regular actions that call agents within the action
 */

const workflow = new WorkflowManager(components.workflow);

export const weatherAgentWorkflow = workflow.define({
  args: { location: v.string() },
  handler: async (step, { location }): Promise<Outfit> => {
    const { threadId } = await step.runMutation(internal.example.createThread, {
      userId: "123",
    });
    const weather = await step.runAction(internal.example.getForecast, {
      threadId,
      prompt: `What is the weather in ${location}?`,
    });
    const { object: fashionSuggestion } = await step.runAction(
      internal.example.getFashionAdvice,
      { threadId, prompt: `What should I wear based on the weather?` },
    );
    console.log({ weather, fashionSuggestion });
    return fashionSuggestion;
  },
});

export const startWorkflow = mutation({
  args: { location: v.string() },
  handler: async (ctx, { location }): Promise<string> => {
    const workflowId = await workflow.start(
      ctx,
      internal.example.weatherAgentWorkflow,
      { location },
    );
    return workflowId;
  },
});

/**
 * Query & subscribe to messages & threads
 */

export const getThreads = query({
  args: { userId: v.string(), paginationOpts: paginationOptsValidator },
  handler: async (
    ctx,
    { userId, paginationOpts },
  ): Promise<PaginationResult<ThreadDoc>> => {
    const results = await ctx.runQuery(
      components.agent.threads.listThreadsByUserId,
      { userId, paginationOpts },
    );
    return results;
  },
});

export const listMessagesByThreadId = query({
  args: { threadId: v.string(), paginationOpts: paginationOptsValidator },
  handler: async (ctx, { threadId, paginationOpts }) => {
    const messages = await ctx.runQuery(
      components.agent.messages.listMessagesByThreadId,
      { threadId, paginationOpts },
    );
    return messages;
  },
});

export const getInProgressMessages = query({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    const { page } = await ctx.runQuery(
      components.agent.messages.listMessagesByThreadId,
      { threadId, statuses: ["pending"] },
    );
    return page;
  },
});

/**
 * Streaming
 */

export const streamText = action({
  args: { prompt: v.string() },
  handler: async (ctx, { prompt }) => {
    const { threadId, thread } = await weatherAgent.createThread(ctx, {});
    const result = await thread.streamText({ prompt });
    for await (const chunk of result.textStream) {
      console.log(chunk);
    }
    return {
      threadId,
      text: await result.text,
      toolCalls: await result.toolCalls,
      toolResults: await result.toolResults,
    };
  },
});

// Registered in http.ts
export const streamHttpAction = httpAction(async (ctx, request) => {
  const { threadId, prompt } = (await request.json()) as {
    threadId?: string;
    prompt: string;
  };
  const { thread } = threadId
    ? await weatherAgent.continueThread(ctx, { threadId })
    : await weatherAgent.createThread(ctx, {});
  const result = await thread.streamText({ prompt });
  return result.toTextStreamResponse();
});

/**
 * Manual search
 */

export const searchMessages = action({
  args: {
    text: v.string(),
    userId: v.optional(v.string()),
    threadId: v.optional(v.string()),
  },
  handler: async (ctx, { text, userId, threadId }) => {
    return weatherAgent.fetchContextMessages(ctx, {
      userId,
      threadId,
      messages: [{ role: "user", content: text }],
      contextOptions: {
        searchOtherThreads: true,
        recentMessages: 0,
        searchOptions: {
          textSearch: true,
          vectorSearch: true,
          messageRange: { before: 0, after: 0 },
          limit: 10,
        },
      },
    });
  },
});

/**
 * Generate an object
 */

export const generateObject = action({
  args: { prompt: v.string() },
  handler: async (ctx, { prompt }) => {
    const { threadId, thread } = await weatherAgent.createThread(ctx, {});
    const result = await thread.streamObject({
      schema: z.object({
        location: z.string(),
        weather: z.string(),
      }),
      prompt,
    });
    for await (const chunk of result.partialObjectStream) {
      console.log(chunk);
    }
    return { threadId, object: result.object };
  },
});

export const runAgentAsTool = action({
  args: {},
  handler: async (ctx) => {
    const agentWithTools = new Agent(components.agent, {
      chat: openai.chat("gpt-4o-mini"),
      textEmbedding: openai.embedding("text-embedding-3-small"),
      instructions: "You are a helpful assistant.",
      tools: {
        doSomething: tool({
          description: "Call this function when asked to do something",
          parameters: z.object({}),
          execute: async (args, options) => {
            console.log("doingSomething", options.toolCallId);
            return "hello";
          },
        }),
        doSomethingElse: tool({
          description: "Call this function when asked to do something else",
          parameters: z.object({}),
          execute: async (args, options) => {
            console.log("doSomethingElse", options.toolCallId);
            return "hello";
          },
        }),
      },
      maxSteps: 20,
    });
    const agentWithToolsAsTool = createTool({
      description:
        "agentWithTools which can either doSomething or doSomethingElse",
      args: z.object({
        whatToDo: z.union([
          z.literal("doSomething"),
          z.literal("doSomethingElse"),
        ]),
      }),
      handler: async (ctx, args) => {
        // Create a nested thread to call the agent with tools
        const { thread } = await agentWithTools.createThread(ctx, {
          userId: ctx.userId,
        });
        const result = await thread.generateText({
          messages: [
            {
              role: "assistant",
              content: `I'll do this now: ${args.whatToDo}`,
            },
          ],
        });
        return result.text;
      },
    });
    const dispatchAgent = new Agent(components.agent, {
      chat: openai.chat("gpt-4o-mini"),
      textEmbedding: openai.embedding("text-embedding-3-small"),
      instructions:
        "You can call agentWithToolsAsTool as many times as told with the argument whatToDo.",
      tools: { agentWithToolsAsTool },
      maxSteps: 5,
    });

    const { thread } = await dispatchAgent.createThread(ctx);
    console.time("overall");
    const result = await thread.generateText({
      messages: [
        {
          role: "user",
          content:
            "Call fastAgent with whatToDo set to doSomething three times and doSomethingElse one time",
        },
      ],
    });
    console.timeEnd("overall");
    return result.text;
  },
});

export const askAboutImage = action({
  args: {
    prompt: v.string(),
    data: v.bytes(),
    mimeType: v.string(),
  },
  handler: async (ctx, { prompt, data, mimeType }) => {
    const storageId = await ctx.storage.store(
      new Blob([data], { type: mimeType }),
    );
    const url = (await ctx.storage.getUrl(storageId))!;
    const { thread } = await weatherAgent.createThread(ctx, {});
    const result = await thread.generateText({
      prompt,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", image: new URL(url), mimeType },
            { type: "text", text: prompt },
          ],
        },
      ],
    });
    return result.text;
  },
});
```