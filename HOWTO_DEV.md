# How to Develop SPECIMENSTATS

## What Works Without Keys

- **Credentials login**: Sign up and sign in with email/password
- **Onboarding**: Complete user profile setup
- **Add sub-platinum metric**: Auto-approved entries (no video required)
- **Add platinum+ metric**: PENDING status (email becomes no-op toast in dev)
- **Gym selection**: Use fallback list when Maps API key is missing
- **Leaderboards**: View rankings and stats
- **My Specimen**: Personal dashboard and metrics
- **Animations/sounds**: ELO changes, rank updates, confetti effects

## What Needs Keys

- **Google Maps**: JS API key for interactive map functionality
- **Real SMTP**: If you want actual emails sent (dev uses no-op toast)

## Runbook

### 1. Create your local env from the template
```bash
cp .env.example .env.local
```

### 2. Open .env.local and set these four now:
```env
SESSION_MAX_AGE_SECONDS=900
SMTP_FROM="SpecimenStats <michael@natxsocial.com>"
ADMIN_EMAIL="michael@natxsocial.com"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="<your real key>"
```

### 3. Install & prep DB
```bash
npm i
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

### 4. Quick checks
```bash
npm run doctor      # should be 0 FAIL once those four are set
npm run test:fast   # runs the stable suites
```

### 5. Start dev server
```bash
npm run dev
```

## Seed Credentials (dev only)

- **Email**: `michael@natxsocial.com`
- **Password**: `Admin123!`

## Quick Smoke in the App

1. **Log in** as `michael@natxsocial.com` / `Admin123!` (or sign up new)
2. **Finish onboarding** → add a sub-platinum metric (auto-approved)
3. **Add platinum+ metric** with a video URL → PENDING (email no-op toast is fine)
4. **Reject with notes** → in-app notification; then approve → confetti + sound
5. **Go to Map** → until you paste your key, use the fallback list to set your gym, then check leaderboards

That's it. Replace the Maps key when you're ready, and you're fully dev-ready.
