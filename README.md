# MathPath

High-school mathematics for grades 9, 10, 11, and 12. Students enroll in the one grade they are in. Teachers apply, interview, and sit a per-grade assessment before they can teach. Kony and Sisay are the admins, once their emails are on the allowlist.

## Design system

The source of truth is `src/styles/tokens.css`. It holds color, type scale, spacing, radius, elevation, motion, and focus. `src/app/globals.css` maps those tokens into Tailwind and the shared controls. Components do not invent a second palette.

Identity: MathPath is viridian fountain-pen ink on graphite paper. The mark is a single stroked curve, the shape of a path, drawn next to the word in Fraunces. Manrope carries the interface. Grade numerals use Fraunces so the number reads as the subject, and the rest of the app stays a working tool. Surfaces are flat with a hairline. The only raised mark is a solid offset on a pressed primary button. There are no gradients.

Skills used, installed from [skills.sh](https://skills.sh):

- `frontend-design` from anthropics/skills, for a subject-specific layout that is not a template.
- `color-palette` from arnavpuri/designskills, for the OKLCH scale and contrast checks.
- `type-pair` from dragoon0x/optik, for the pairing rules and the banned-font list.
- `taste-typography` from madebymustafa/design-taste, for the type scale, measure, and weights.
- `web-design-guidelines` from vercel-labs/agent-skills, for labels, focus, forms, and zoom.

Fonts: **Fraunces** for the wordmark, the home headline, and grade numerals. **Manrope** for interface text and section titles.

Palette, solid colors only, from OKLCH hue 172 and chroma 0.085 (neutrals use chroma 0.012):

| Role | Token | Hex |
| --- | --- | --- |
| Paper | `--color-bg` | `#f3f6f5` |
| Ink | `--color-fg` | `#1b211f` |
| Headings | `--brand-900` | `#00261d` |
| Primary button | `--brand-700` | `#015543` |
| Primary hover | `--brand-800` | `#033d2f` |
| Quiet highlight | `--brand-50` | `#e5fbf3` |
| Success text | `--success-700` | `#02572a` |
| Warning text | `--warning-800` | `#452e02` |
| Error text | `--error-700` | `#831a1d` |

## Scripts

```bash
npm install
npm run dev
npm test
npm run lint
npm run build
```

The dev server is [http://localhost:3000](http://localhost:3000).

## Run it locally

1. `cp .env.example .env.local`
2. Leave Supabase and Google empty.
3. `npm run dev`

That is demo mode. Sample accounts live in a gitignored `.data/store.json` file, created on first use. Password for every sample account: `demo-password`.

| Email | What you can open |
| --- | --- |
| `student@example.com` | Student dashboard, enrolled in Grade 9 |
| `applicant@example.com` | Application status, submitted |
| `interview@example.com` | Application with an interview on the calendar |
| `candidate@example.com` | Assessment ready for an admin decision (92, 88, 86, 74) |
| `teacher@example.com` | Approved for grades 9 and 10, teaching grade 9 |
| `studio.admin@example.com` | Admin only if listed in `ADMIN_EMAILS` |

To open the admin desk in demo mode, set this in `.env.local` and restart:

```
ADMIN_EMAILS=studio.admin@example.com
```

Those addresses are documentation examples, not inboxes. Replace the allowlist with Kony's and Sisay's emails when you have them. An empty allowlist is valid: nobody is an admin.

Demo mode is for this machine. Do not deploy it. In production the demo sign-in refuses to run unless you set `DEMO_SESSION_SECRET` to something that is not the built-in local value, and you should connect Supabase instead.

## Supabase

When `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are all set, auth and data use Supabase. The anon key stays on the server. The service role is used only in server actions after the same authorization checks as demo mode.

Apply the migration:

```bash
supabase db push
```

Or paste `supabase/migrations/20261113160000_initial_schema.sql` into the SQL editor. `supabase/seed.sql` loads the same sample people into a local Supabase database. Row level security is on. Writes go through the service role after the server checks the role. Authorization uses `app_metadata`, not editable user metadata.

Admin access is the `ADMIN_EMAILS` allowlist, checked on each request. It is not a self-serve role.

## Google

See [GOOGLE_SETUP.md](GOOGLE_SETUP.md). Without credentials, schedule a lesson with a pasted Meet link and save assignments in the app. The screens say "Google not connected yet".

## Architecture

- Next.js App Router and TypeScript. Request checks live in `src/proxy.ts` (Next.js 16's name for middleware) and again in server actions via `authorize`.
- Hiring transitions, the 70 / 85 grade rules, one active student grade, and teaching opt-in are pure functions in `src/domain`, covered by `npm test`.
- Demo data and Supabase are two stores behind the same methods.
- Calendar Meet links and Classroom courses sit in `src/lib/google.ts`. Tests pass a fake `fetch`.

## Routes

Public: `/`, `/students/sign-in`, `/students/sign-up`, `/teachers/sign-in`, `/teachers/apply`, `/teachers/apply/status`.

Student: `/students/dashboard`, `/students/enroll`, `/students/sessions`, `/students/sessions/[id]`, `/students/assignments`.

Approved teacher: `/teachers/dashboard`, `/teachers/grades`, `/teachers/sessions`, `/teachers/sessions/new`, `/teachers/assignments`.

Admin: `/admin`, `/admin/applications`, `/admin/applications/[id]`, `/admin/interviews`, `/admin/interviews/[id]`, `/admin/assessments`, `/admin/assessments/[id]`, `/admin/teachers`, `/admin/students`, `/admin/sessions`, `/admin/settings`.

## What is stubbed

- Admin emails. `ADMIN_EMAILS` is an empty allowlist in `.env.example`.
- Google Cloud credentials. Adapters no-op with a visible not-connected state.
- A Supabase project. The app runs on the local sample store until the three Supabase variables are set.

## What is left

- Real admin addresses.
- A Google Cloud OAuth client and a refresh token.
- A hosted Supabase project, then `supabase db push`.
- A production deploy, only after you ask for it.
