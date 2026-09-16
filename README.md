# Memogotchi

Spaced repetition with a thin digital-pet pulse. **v0 is study-first:** pick a subject, review due cards, grade them (SM-2), keep the pet healthy, and generate more cards for the **same topic** when the queue empties.

## Product loop

1. Onboard with one subject (honest single-player demo user)
2. Study due cards on `/` (flip → swipe grade)
3. Reviews persist SM-2 fields + pet XP/health
4. Empty queue → generate next batch for the same topic (no dead-end)

**Not in v0:** boss fights, pet chat, placement quiz, collection/stats routes, dual study UIs.

## Stack

- Next.js 14 (App Router) + React 18 + Tailwind
- Supabase (Postgres) via server actions
- Model-agnostic card generation (`lib/generation`) — default provider: xAI

## Setup

```bash
cp .env.example .env.local
# fill Supabase + XAI_API_KEY
npm install
npm run dev
```

Apply SQL under `supabase/migrations/` in order (Supabase CLI or SQL editor). Fresh installs should use the rewritten v0 migrations (profiles + `decks.topic` + `cards.content` / `next_review`).

### Environment

See `.env.example`:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key (v0 policies are open for single-player) |
| `XAI_API_KEY` | xAI API key for deck generation |
| `XAI_MODEL` | Optional model override (default `grok-2-latest`) |
| `CARD_GENERATION_PROVIDER` | Optional; default `xai` |

### Identity

v0 uses a fixed demo user id (`lib/demo-user.ts`). This is **single-player**, not multi-user. Real auth is deferred.

## Scripts

```bash
npm run dev      # local app
npm run test     # Jest (SRS, learning, generation validation)
npm run build    # production build
npm run lint
```

## Layout

- `app/page.tsx` — only product route (onboarding or home study loop)
- `lib/srs.ts`, `lib/learning.ts` — pure algorithms + tests
- `lib/generation/` — provider interface + validation + xAI adapter
- `actions/` — decks, due cards, reviews, next-deck generation, pet pulse
- `features.txt` — backlog / user feedback

## License

Private prototype.
