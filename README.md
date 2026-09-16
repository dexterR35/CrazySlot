# Mega Mesa PixiJS Slots

A polished, responsive Western slot-machine demo built with React, Vite, and PixiJS. The canvas renderer drives five independently animated physical reels, staggered eased stops, bounce physics, sequential payline playback, per-symbol win highlights, and particle celebrations. The game includes 20 fixed paylines, WILD substitution, TNT scatter bonuses, free spins, and a demo progressive MEGA jackpot.

## Run locally

```bash
npm install
npm run dev
```

## Verify and build

```bash
npm test
npm run build
```

The production output is written to `dist/`. The `public/_headers` file provides security headers on hosts that support the common static-host header format. On other hosts, configure the same headers at the web server or CDN.

## Game integrity scope

This is an entertainment demo with virtual credits only. Reel stops use `crypto.getRandomValues()` with rejection sampling, bets are reserved before a spin begins, the visible physical reel stops are the same stops evaluated by the paytable, and payouts settle only after the animation completes.

Real-money gaming requires a server-authoritative wallet and RNG, certified game math, jurisdiction-specific licensing, age/location controls, audit logging, and independent security review. Client-side code alone cannot provide those guarantees.
