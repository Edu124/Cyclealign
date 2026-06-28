# CycleAlign 🌸

A calming, motion-rich period & cycle tracking app for **Android and iOS**, built
with **React Native (Expo)**. Soft pastel design, an animated brand logo, on-device
cycle prediction, and **Supabase** for accounts & cloud sync.

> Founder: Vinita Thakur

## Features (this build)

- **Animated logo & splash** — glowing pastel ring with an orbiting "cycle day" marker.
- **Onboarding** — name, gender, birth date, and last period date with a live preview
  of the next predicted period.
- **Home dashboard** — animated cycle ring (current day), days-to-next-period,
  estimated ovulation, fertile window, and today's phase tip.
- **Phases** — visual timeline of Menstrual / Follicular / Ovulation / Luteal with
  your current phase highlighted and expandable wellness tips.
- **Community** — branded "Coming soon" placeholder (full feed is a later phase).
- **About Us** — founder info, mission, privacy & health notes, reset/sign-out.
- **Auth & sync** — Supabase email + Google/Apple sign-in; data synced per user with
  Row-Level Security. Runs in **local demo mode** when Supabase isn't configured.

## Tech stack

Expo (SDK 52) · expo-router · React Native Reanimated · react-native-svg ·
Supabase · Zustand · React Query · date-fns · TypeScript.

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. (Optional) Configure Supabase for accounts + cloud sync
cp .env.example .env
#   then edit .env with your project's URL and anon key.
#   Without this, the app runs fully in local demo mode.

# 3. Run the database schema (Supabase SQL editor)
#   paste the contents of supabase/migrations/0001_init.sql

# 4. Start the dev server
npm start          # then press a (Android), i (iOS), or w (web)
```

Open the project in **Expo Go** on a device, or in an Android/iOS simulator.

### Social login (optional)

In your Supabase dashboard enable the Google / Apple providers and add the redirect
URL `cyclealign://` (the app's scheme). Email/password works out of the box.

## Project structure

```
app/                 expo-router routes (launch gate, auth, onboarding, tabs)
src/
  components/        UI kit, logo, cycle visuals
  lib/
    prediction/      LocalStatisticalEngine, phases, tips  (pure, unit-tested)
    stores/          zustand stores (app state, session, onboarding draft)
    supabase.ts      client (optional — demo mode if unset)
    sync.ts          mirror local state <-> Supabase
  theme/             colors, typography, spacing
  types/             shared models
supabase/migrations/ SQL schema + RLS
assets/              generated icon / splash (see scripts/gen-assets.js)
```

## Prediction engine

All predictions are computed **on-device** from the last period date + cycle/period
lengths, refined by the mean gap of logged cycles once ≥2 exist. It lives behind a
`PredictionEngine` interface (`src/lib/prediction/engine.ts`) so a hosted AI/LLM
insights provider can be added later without touching the UI.

## Tests

```bash
npm test           # jest-expo — covers the prediction engine
npm run typecheck  # tsc --noEmit
```

## Roadmap (later phases)

- Full community feed (anonymous handles, posting, reporting, weekly topics, moderation)
- AI chat assistant & smarter insights (interface is ready)
- Symptom/mood logging UI (table already scaffolded)
- Period & fertile-window reminders (notifications)
