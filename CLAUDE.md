# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server at http://localhost:3000
npm run build     # TypeScript check + Vite production build
npm run lint      # Type-check only (tsc --noEmit, no ESLint)
npm run preview   # Preview production build locally
npm run clean     # Remove dist/
```

There are no tests configured in this project.

## Environment Variables

Create a `.env.local` file in the project root with:

```
GEMINI_API_KEY=your_gemini_api_key
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

`GEMINI_API_KEY` is exposed to the client via `vite.config.ts` as `process.env.GEMINI_API_KEY`. Supabase vars use the standard `VITE_` prefix for `import.meta.env`.

## Architecture

**Stack:** React 19 + TypeScript + Vite + Tailwind CSS v4 + Zustand + Supabase + Google Gemini AI

**Single-page app** with React Router v7. All routes are in [src/App.tsx](src/App.tsx):
- `/login`, `/register` — public routes
- `/`, `/calendar`, `/workout`, `/progress`, `/profile` — protected by `ProtectedRoute` which checks `useStore().user`

**State management** (`src/store.ts`): A single Zustand store (`useStore`) with `persist` middleware (localStorage key: `iron-jarvis-storage`). All app data — user profile, weight logs, exercises, routines, workout logs, set logs — lives here. The store is the source of truth for everything except auth session, which is managed via Supabase directly in `App.tsx`.

**Auth flow:** On mount, `App.tsx` calls `supabase.auth.getSession()` and subscribes to `onAuthStateChange`. On session, it calls `loadUserData(userId, email)` which fetches the user's profile from the `profiles` Supabase table and hydrates the store. Logout clears user data from the store.

**Supabase** (`src/lib/supabase.ts`): Only used for auth and the `profiles` table. All other data (routines, workouts, logs) is stored in Zustand's persisted localStorage — there is no Supabase sync for workout data.

**AI routine generation** (`src/components/AIGenerator.tsx`): Uses `@google/genai` SDK directly from the browser with the Gemini API. Sends a structured Spanish-language prompt and expects a JSON response containing a full weekly routine. On success, it calls `createRoutine()` and `addExercise()` on the store, then navigates to `/calendar`.

**UI conventions:**
- Dark theme throughout: `bg-zinc-900`, `bg-[#111111]`, `text-zinc-400`
- Accent color: violet (`violet-500`, `violet-600`)
- Animations via `motion/react` (Framer Motion)
- Icons via `lucide-react`
- The app UI and exercise names are in Spanish (Argentine Spanish)

**Path alias:** `@` resolves to the project root (configured in `vite.config.ts`), so `@/src/store` imports from the root.
