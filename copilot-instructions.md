# Project: Prompt Management Application

## Description

A Next.js application for managing prompts. Users can perform CRUD operations on prompts, which can include placeholder variables. Prompts can be grouped by tags. The application allows replacing placeholder variables with custom values (free text or predefined options). It also supports CRUD operations for placeholder variable options and Google login. Users can view all prompts and filter them by tags.

## Tech Stack

- Next.js (App Router)
- TailwindCSS
- Supabase (for database and authentication)
- TypeScript
- `@supabase/ssr` for server-side auth with Next.js

## Features Implemented (Partially or Fully)

- **User Authentication:**
    - Google Login via Supabase Auth.
    - Client-side auth context (`AuthContext.tsx`).
    - Server-side session handling using `@supabase/ssr` and Next.js middleware (`src/middleware.ts`).
- **Prompt Management:**
    - Create Prompts (title, text, basic tag association via comma-separated input).
    - Read/Display Prompts.
    - Filter Prompts by Tags.
- **Tag Management:**
    - Basic tag creation during prompt creation.
    - Fetching all tags for filtering.
- **Database Schema:** Tables for prompts, tags, prompt_tags, placeholder_variables, placeholder_variable_options with RLS policies.

## Current Major Issue: User Authentication in Server Actions

The primary blocking issue is that server actions (`src/app/actions/promptActions.ts`) are unable to authenticate the user.
- **Symptom:** When server actions call `supabase.auth.getUser()`, it fails, resulting in an "Auth session missing!" error on the server and "User not authenticated. Please sign in again." on the client.
- **Impact:** Users cannot perform operations that require server-side authentication (e.g., fetching their prompts, creating new prompts).

## Authentication Troubleshooting Steps Taken So Far:

1.  **Initial Setup:**
    - Configured client-side Supabase (`src/lib/supabaseClient.ts`).
    - Implemented `AuthContext.tsx` for client-side session management and Google Sign-In.

2.  **Server-Side Auth with `@supabase/ssr`:**
    - Installed `@supabase/ssr`.
    - Created `src/middleware.ts` to use `createServerClient` from `@supabase/ssr` to manage and refresh session cookies. The middleware calls `supabase.auth.getSession()` on incoming requests.
    - Modified server actions in `src/app/actions/promptActions.ts` to use a locally defined `createServerSupabaseClient` function, which also uses `@supabase/ssr` and `cookies()` from `next/headers`.

3.  **Cookie Handling in Server Actions:**
    - Iteratively refined the cookie handling methods (`get`, `set`, `remove`) within `createServerSupabaseClient` in `promptActions.ts`:
        - Explored synchronous vs. asynchronous implementations.
        - Ensured `cookies()` promise is correctly `await`ed before accessing its methods (e.g., `const store = await cookieStorePromise; return store.get(name)?.value;`).

4.  **Detailed Logging Added:**
    - **`src/app/actions/promptActions.ts`:** Added logs within `getUser()` to see the direct error/result from `supabase.auth.getUser()`.
        - *Last observed server log:* `[promptActions:getUser] Error from supabase.auth.getUser(): Auth session missing!`
    - **`src/middleware.ts`:** Added logs to check the outcome of `supabase.auth.getSession()` within the middleware.
        - *Last observed server log:* `[Middleware] No session found or session is null after supabase.auth.getSession().`
    - **`src/contexts/AuthContext.tsx`:** Added logs within `onAuthStateChange` to observe client-side session status immediately after Google login.
        - *Awaiting results from this logging.*

## Current Hypothesis / Next Steps for Debugging (as of 2025-05-17)

- The log `[Middleware] No session found or session is null after supabase.auth.getSession().` indicates the core problem: the session is not being established or recognized even at the middleware level.
- **The immediate next step is to analyze the client-side logs from `AuthContext.tsx` (specifically from the `onAuthStateChange` listener) after a Google login attempt.** This will help determine:
    - If the client-side Supabase library successfully receives a session from Google.
    - What the `_event` and `session` objects look like on the client.
- Based on the client-side logs, further investigation will focus on:
    - **If client gets a session:** Why are the session cookies not being set correctly in the browser, or why are they not being picked up by the middleware? (Check Supabase project URL/anon key, Site URL, Redirect URIs in Supabase/Google Cloud Console, cookie domain/path issues).
    - **If client does NOT get a session:** The issue is earlier in the OAuth flow (Google Cloud Console config, Supabase Google provider config, `redirectTo` URL).

## Supabase Setup Reminders

- **Project URL & Anon Key:** Ensure `.env.local` has correct `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Google OAuth Configuration:**
    - Supabase: Authentication -> Providers -> Google (ensure enabled, Client ID, Client Secret, Redirect URI `http://localhost:3000/auth/callback` or equivalent are correct).
    - Google Cloud Console: APIs & Services -> Credentials -> OAuth 2.0 Client IDs (ensure Authorized JavaScript origins and Authorized redirect URIs match).
- **Supabase URL Configuration:** Authentication -> URL Configuration -> Site URL (should be `http://localhost:3000`).
- **Database Types:** Generated via `npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > src/types/supabase.ts`.

---
*This file will be updated by the user.*
