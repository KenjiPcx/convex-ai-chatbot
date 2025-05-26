<a href="https://chat.vercel.ai/">
  <img alt="Next.js 15 and Convex-powered AI chatbot." src="app/(chat)/opengraph-image.png">
  <h1 align="center">Convex AI Chatbot</h1>
</a>

<p align="center">
    A modern AI chatbot built with Next.js 15, Convex, and Convex Agents for real-time AI conversations with persistent memory.
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#architecture"><strong>Architecture</strong></a> ·
  <a href="#running-locally"><strong>Running locally</strong></a> ·
  <a href="#deployment"><strong>Deploy</strong></a>
</p>
<br/>

## Features

- **🚀 Real-time AI Chat**
  - [Convex Agents](https://labs.convex.dev/agent) with persistent memory and context
  - Streaming responses powered by OpenAI GPT-4
  - Automatic conversation history and recall

- **⚡ Modern Stack**
  - [Next.js 15](https://nextjs.org) with App Router and React Server Components
  - [Convex](https://convex.dev) for real-time database and AI agents
  - [Convex Auth](https://labs.convex.dev/auth) for seamless authentication
  - TypeScript-first with generated types

- **🎨 Beautiful UI**
  - [shadcn/ui](https://ui.shadcn.com) components
  - [Tailwind CSS](https://tailwindcss.com) styling
  - [Radix UI](https://radix-ui.com) primitives for accessibility
  - Dark/light mode support

- **📱 Full-Featured Chat**
  - File uploads and attachments
  - Message voting and feedback
  - Document creation and editing
  - Real-time collaborative features

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App  │    │  Convex HTTP    │    │ Convex Agents   │
│                 │────│   Actions       │────│   + Memory      │
│  (React UI)     │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐    ┌─────────────────┐
         └──────────────│ Convex Database │    │    OpenAI       │
                        │                 │    │   GPT-4o        │
                        │ (Reactive)      │    │                 │
                        └─────────────────┘    └─────────────────┘
```

### Key Benefits

- **Real-time Everything**: Database subscriptions and live updates
- **AI-First Architecture**: Built specifically for LLM applications
- **Zero Infrastructure**: Serverless and fully managed
- **Type Safety**: End-to-end TypeScript with generated schemas

## Running locally

### Prerequisites

1. **Node.js 18+** and **pnpm**
2. **Convex account** (free at [convex.dev](https://convex.dev))
3. **OpenAI API key** for AI functionality

### Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd convex-ai-chatbot
   pnpm install
   ```

2. **Set up Convex:**
   ```bash
   npx convex init
   ```

3. **Configure environment variables:**
   
   Copy `.env.example` to `.env.local` and fill in:
   ```bash
   # Required
   CONVEX_DEPLOYMENT=your-deployment-name
   NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
   OPENAI_API_KEY=your-openai-api-key
   
   # Optional
   XAI_API_KEY=your-xai-api-key
   ```

4. **Deploy Convex schema and functions:**
   ```bash
   pnpm run convex:deploy
   ```

5. **Start development servers:**
   ```bash
   # Terminal 1: Start Convex
   pnpm run convex:dev
   
   # Terminal 2: Start Next.js
   pnpm run dev
   ```

Your app will be running at [localhost:3000](http://localhost:3000).

## Deployment

### Deploy to Convex + Vercel

1. **Deploy Convex backend:**
   ```bash
   pnpm run convex:deploy
   ```

2. **Deploy Next.js frontend to Vercel:**
   ```bash
   vercel deploy
   ```

3. **Set environment variables in Vercel:**
   - `CONVEX_DEPLOYMENT`
   - `NEXT_PUBLIC_CONVEX_URL`
   - `OPENAI_API_KEY`

## Project Structure

```
├── app/                    # Next.js App Router
├── components/             # React components
├── convex/                 # Convex backend
│   ├── schema.ts          # Database schema
│   ├── agents.ts          # AI agents
│   ├── http.ts            # HTTP endpoints
│   └── *.ts               # Functions & mutations
├── hooks/                  # React hooks
└── lib/                    # Utilities
```

## Migration from PostgreSQL + NextAuth

This project was migrated from a traditional PostgreSQL + NextAuth + AI SDK setup to Convex. See [`MIGRATION.md`](./MIGRATION.md) for the complete migration guide and benefits.

## Contributing

We welcome contributions! Please see our contributing guidelines for more details.

## License

This project is licensed under the MIT License.