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
Create `.env.local` & `.env` files in the root directory with:

```env
# .env
VITE_APP_URL=http://localhost:3000
```

4. Run `npx convex dev` and use local deployment. It will create `.env.local` file for you.
   
```env
# .env.local
CONVEX_DEPLOYMENT=your-deployment-id
CONVEX_URL=your-convex-url
```

5. Run the Convex Auth CLI to configure authentication:
   - When prompted for SITE_URL, enter `http://localhost:3000`
   - For all other prompts, select 'Yes' to continue

6. Set up Convex environment variables, either through the dashboard or the CLI.

This is used for free models. Alternatively, you can set up keys using BYOK dialog from app's sidebar.

```bash
npx convex env set OPENROUTER_API_KEY <your-openrouter-api-key>
```

If you'd like to use Google login:

```bash
npx convex env set AUTH_GOOGLE_SECRET <your-google-secret>
npx convex env set AUTH_GOOGLE_ID <your-google-client-id>
```

7. Start the development server:
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
- [Convex Auth](https://convex.dev/docs/auth) - Authentication
- [React](https://react.dev/) - UI library
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Lucide](https://lucide.dev/) - Icons
- [Shadcn UI](https://ui.shadcn.com/) - UI components
- [Prompt kit](https://www.prompt-kit.com/) - Chat UI
- [OpenRouter](https://openrouter.ai/) - AI API
- [Vercel AI SDK](https://sdk.vercel.ai/) - AI SDK
