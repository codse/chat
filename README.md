# Getting Started

## Prerequisites

- Node.js 18+ 
- pnpm 8+

## Installation

1. Clone the repository
2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
Create a `.env.local` & `.env` file in the root directory with:

```env
# .env.local
CONVEX_DEPLOYMENT=your_deployment_id
CONVEX_URL=your_convex_url
```

```env
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

1. In `convex` dashboard, set `CLERK_FRONTEND_API_URL` and `OPENROUTER_API_KEY` in the environment variables.

2. Start the development server:
```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

## Project Structure

- `src/` - Source code
  - `components/` - React components
  - `routes/` - TanStack Router routes
  - `lib/` - Utility functions
- `convex/` - Convex backend functions and schema


## Tech Stack

- [TanStack Start](https://tanstack.com/start) - Framework
- [TanStack Router](https://tanstack.com/router) - Routing
- [TanStack Query](https://tanstack.com/query) - Data fetching
- [Convex](https://www.convex.dev/) - Backend
- [React](https://react.dev/) - UI library
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Lucide](https://lucide.dev/) - Icons
- [Shadcn UI](https://ui.shadcn.com/) - UI components
- [Prompt kit](https://www.prompt-kit.com/) - Chat UI
- [Clerk](https://clerk.com/) - Authentication
- [OpenRouter](https://openrouter.ai/) - AI API
- [Vercel AI SDK](https://sdk.vercel.ai/) - AI SDK
