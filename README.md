# Hiring Portal — Frontend

A candidate hiring pipeline built with **React + TypeScript + Tailwind + Axios + TanStack Query**. Dark teal glassmorphic UI, fully responsive.

## Pages

| Page | Route | Access |
|---|---|---|
| Apply | `/` | Public — candidate submits application |
| Login | `/login` | Public — single form, role comes from server response |
| Reviewer Registration | `/register/reviewer` | Public |
| Admin Registration | `/register/admin` | Public |
| Dashboard | `/dashboard` | Logged in — candidates table |
| Candidate Details | `/candidates/:id` | Logged in |
| 404 | `*` | — |

## Roles

- **Reviewer** — view candidates, view scores, view candidate details.
- **Admin** — everything a reviewer can do, **plus**: view/update internal notes, update candidate status, create/update scores, delete candidates.

Role is read from the `user` object stored in `localStorage` after login (`user_role: "reviewer" | "admin"`).

## Auth

- JWT `access_token` / `refresh_token` + `user` saved to `localStorage` on login.
- `axiosInstance.ts` auto-attaches `Authorization: Bearer <access_token>` to every request and clears the session + redirects to `/login` on token expiry.
- `useAuthGuard()` protects the dashboard from direct URL access when logged out.

## API endpoints used

```
POST   /auth/login/
POST   /auth/create_reviewer_user/
POST   /auth/create_admin_user/
GET    /candidate/list_candidates/?page=
GET    /candidate/{id}/
DELETE /candidate/{id}/              (soft delete)
PATCH  /candidate/{id}/status/
PATCH  /candidate/{id}/               (internal_notes)
POST   /candidates/{id}/scores/
PATCH  /candidates/{id}/scores/{score_id}/
```

## Setup

```bash
npm install
cp .env.example .env   # set VITE_API_BASE_URL
npm run dev
```

## Project structure

```
src/
├── globals.css              ← all design tokens & styles — edit here for theming
├── lib/axiosInstance.ts     ← shared axios instance, interceptors, TOKEN_KEYS
├── hooks/useAuthGuard.ts
└── pages/
    ├── ApplyPage.tsx
    ├── Login.tsx                    (Reviewer + Admin login, same form)
    ├── Registration.tsx             (Reviewer + Admin registration)
    ├── Dashboard.tsx                (candidates table)
    ├── CandidateDetailsPage.tsx     (details, status, notes, scores)
    └── NotFoundPage.tsx
```

Most pages are single-file components (types, API calls, hooks, and UI combined) by design — no splitting across separate modules per feature.

## Known gaps

None currently — all core flows (apply, auth, list, details, status, notes, scores, delete) are wired to live endpoints.