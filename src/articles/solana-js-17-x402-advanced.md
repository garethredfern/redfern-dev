---
title: "Advanced x402: Pricing Strategies and Session Management"
description: "Implement dynamic pricing, session tokens for repeat access, and usage tracking for your x402 APIs."
tags: ["solana", "javascript", "x402", "pricing", "sessions"]
pubDate: "2025-12-04T17:00:00Z"
series: "solana-for-js-devs"
seriesOrder: 17
---

Basic x402 works: pay per request, get content. But real products need more - subscription-like sessions, dynamic pricing, usage tracking.

Let's build these patterns.

## Session Tokens

Paying for every single request is annoying. Better: pay once, get a session token for multiple requests.

```typescript
// server.ts - Session-based x402

interface Session {
  walletAddress: string;
  createdAt: number;
  expiresAt: number;
  requestsRemaining: number;
}

// In-memory sessions (use Redis in production)
const sessions = new Map<string, Session>();

// Create a session token
function createSessionToken(walletAddress: string): string {
  const token = crypto.randomUUID();

  sessions.set(token, {
    walletAddress,
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    requestsRemaining: 100, // 100 requests per session
  });

  return token;
}

// Verify session
function verifySession(token: string): Session | null {
  const session = sessions.get(token);

  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }
  if (session.requestsRemaining <= 0) {
    return null;
  }

  return session;
}

// Use a request from the session
function useSessionRequest(token: string): boolean {
  const session = sessions.get(token);
  if (!session || session.requestsRemaining <= 0) return false;

  session.requestsRemaining--;
  return true;
}
```

### Session-Aware Endpoint

```typescript
const server = Bun.serve({
  port: 3000,

  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/api/premium") {
      // Check for existing session
      const sessionToken = req.headers.get("x-session-token");

      if (sessionToken) {
        const session = verifySession(sessionToken);

        if (session && useSessionRequest(sessionToken)) {
          // Valid session - serve content without payment
          return Response.json({
            message: "Session access granted",
            remainingRequests: session.requestsRemaining,
            data: {
              /* your content */
            },
          });
        }
      }

      // No valid session - require payment
      const paymentHeader = req.headers.get("x-payment");

      if (!paymentHeader) {
        return Response.json(
          {
            x402Version: 1,
            accepts: [
              {
                scheme: "exact",
                network: "solana-devnet",
                maxAmountRequired: "100000", // $0.10 for session
                description: "24-hour access (100 requests)",
                payTo: TREASURY_ADDRESS,
                // ... other fields
              },
            ],
          },
          { status: 402 }
        );
      }

      // Verify payment
      const isValid = await verifyPayment(paymentHeader);

      if (isValid) {
        // Extract wallet from payment
        const walletAddress = extractWalletFromPayment(paymentHeader);
        const newSessionToken = createSessionToken(walletAddress);

        return Response.json(
          {
            message: "Payment received! Session created.",
            sessionToken: newSessionToken,
            expiresIn: "24 hours",
            totalRequests: 100,
            data: {
              /* your content */
            },
          },
          {
            headers: {
              "X-Session-Token": newSessionToken,
            },
          }
        );
      }

      return Response.json({ error: "Invalid payment" }, { status: 402 });
    }

    return new Response("Not found", { status: 404 });
  },
});
```

### Client-Side Session Handling

```typescript
// Svelte store for session management
// src/lib/stores/session.ts

import { writable, get } from "svelte/store";
import { browser } from "$app/environment";

interface SessionState {
  token: string | null;
  expiresAt: number | null;
  remainingRequests: number | null;
}

function createSessionStore() {
  const stored = browser ? localStorage.getItem("x402-session") : null;
  const initial: SessionState = stored
    ? JSON.parse(stored)
    : {
        token: null,
        expiresAt: null,
        remainingRequests: null,
      };

  const { subscribe, set, update } = writable<SessionState>(initial);

  // Persist to localStorage
  subscribe((state) => {
    if (browser) {
      if (state.token) {
        localStorage.setItem("x402-session", JSON.stringify(state));
      } else {
        localStorage.removeItem("x402-session");
      }
    }
  });

  return {
    subscribe,

    setSession(token: string, expiresAt: number, remainingRequests: number) {
      set({ token, expiresAt, remainingRequests });
    },

    updateRemaining(remaining: number) {
      update((s) => ({ ...s, remainingRequests: remaining }));
    },

    clear() {
      set({ token: null, expiresAt: null, remainingRequests: null });
    },

    isValid(): boolean {
      const state = get({ subscribe });
      if (!state.token || !state.expiresAt) return false;
      if (Date.now() > state.expiresAt) {
        this.clear();
        return false;
      }
      return (state.remainingRequests ?? 0) > 0;
    },
  };
}

export const session = createSessionStore();
```

## Dynamic Pricing

Price based on usage, time of day, or demand:

```typescript
// pricing.ts

interface PricingConfig {
  basePrice: number; // Base price in micro-USDC
  peakMultiplier: number; // Multiplier during peak hours
  bulkDiscount: number; // Discount for high-volume users
}

const PRICING: Record<string, PricingConfig> = {
  "/api/basic": {
    basePrice: 10000, // $0.01
    peakMultiplier: 1.5,
    bulkDiscount: 0.8,
  },
  "/api/premium": {
    basePrice: 100000, // $0.10
    peakMultiplier: 2.0,
    bulkDiscount: 0.7,
  },
  "/api/compute": {
    basePrice: 500000, // $0.50
    peakMultiplier: 3.0,
    bulkDiscount: 0.5,
  },
};

// Track usage per wallet
const walletUsage = new Map<string, number>();

function calculatePrice(route: string, walletAddress?: string): number {
  const config = PRICING[route];
  if (!config) return 10000; // Default $0.01

  let price = config.basePrice;

  // Peak hours (UTC 14:00 - 22:00)
  const hour = new Date().getUTCHours();
  if (hour >= 14 && hour <= 22) {
    price *= config.peakMultiplier;
  }

  // Bulk discount for repeat users
  if (walletAddress) {
    const usage = walletUsage.get(walletAddress) ?? 0;
    if (usage > 100) {
      price *= config.bulkDiscount;
    }
  }

  return Math.round(price);
}

// Record usage
function recordUsage(walletAddress: string) {
  const current = walletUsage.get(walletAddress) ?? 0;
  walletUsage.set(walletAddress, current + 1);
}
```

### Time-Based Access

Charge for time periods instead of per request:

```typescript
interface TimeAccess {
  walletAddress: string;
  tier: "hour" | "day" | "week";
  expiresAt: number;
}

const TIME_PRICES = {
  hour: 50000, // $0.05
  day: 200000, // $0.20
  week: 1000000, // $1.00
};

const timeAccess = new Map<string, TimeAccess>();

function hasTimeAccess(walletAddress: string): boolean {
  const access = timeAccess.get(walletAddress);
  if (!access) return false;
  if (Date.now() > access.expiresAt) {
    timeAccess.delete(walletAddress);
    return false;
  }
  return true;
}

function grantTimeAccess(walletAddress: string, tier: "hour" | "day" | "week") {
  const durations = {
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
  };

  timeAccess.set(walletAddress, {
    walletAddress,
    tier,
    expiresAt: Date.now() + durations[tier],
  });
}
```

## Usage Analytics

Track what's being used:

```typescript
// analytics.ts

interface UsageEvent {
  timestamp: number;
  walletAddress: string;
  endpoint: string;
  amountPaid: number;
  responseTime: number;
}

const usageEvents: UsageEvent[] = [];

function trackUsage(event: UsageEvent) {
  usageEvents.push(event);

  // In production: send to analytics service
  // await analytics.track(event);
}

function getUsageStats(walletAddress?: string) {
  const events = walletAddress
    ? usageEvents.filter((e) => e.walletAddress === walletAddress)
    : usageEvents;

  const last24h = events.filter(
    (e) => e.timestamp > Date.now() - 24 * 60 * 60 * 1000
  );

  return {
    total: events.length,
    last24h: last24h.length,
    revenue: events.reduce((sum, e) => sum + e.amountPaid, 0),
    avgResponseTime:
      events.reduce((sum, e) => sum + e.responseTime, 0) / events.length,
  };
}
```

## Rate Limiting

Prevent abuse even with payments:

```typescript
// rateLimit.ts

interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
}

const rateLimits = new Map<string, RateLimitBucket>();

const RATE_LIMIT = {
  maxTokens: 60, // Max requests
  refillRate: 1, // Tokens per second
  refillInterval: 1000, // Refill check interval
};

function checkRateLimit(walletAddress: string): boolean {
  let bucket = rateLimits.get(walletAddress);

  if (!bucket) {
    bucket = { tokens: RATE_LIMIT.maxTokens, lastRefill: Date.now() };
    rateLimits.set(walletAddress, bucket);
  }

  // Refill tokens based on time passed
  const now = Date.now();
  const elapsed = now - bucket.lastRefill;
  const tokensToAdd = Math.floor(elapsed / 1000) * RATE_LIMIT.refillRate;

  bucket.tokens = Math.min(RATE_LIMIT.maxTokens, bucket.tokens + tokensToAdd);
  bucket.lastRefill = now;

  if (bucket.tokens < 1) {
    return false; // Rate limited
  }

  bucket.tokens--;
  return true;
}
```

## Complete Advanced Server

Putting it all together:

```typescript
// server.ts

const server = Bun.serve({
  port: 3000,

  async fetch(req) {
    const url = new URL(req.url);
    const startTime = Date.now();

    if (url.pathname.startsWith("/api/")) {
      // Check for session token first
      const sessionToken = req.headers.get("x-session-token");
      let walletAddress: string | undefined;

      if (sessionToken) {
        const session = verifySession(sessionToken);
        if (session && useSessionRequest(sessionToken)) {
          walletAddress = session.walletAddress;

          // Check rate limit
          if (!checkRateLimit(walletAddress)) {
            return Response.json(
              { error: "Rate limited. Slow down." },
              { status: 429 }
            );
          }

          // Track usage
          trackUsage({
            timestamp: Date.now(),
            walletAddress,
            endpoint: url.pathname,
            amountPaid: 0,
            responseTime: Date.now() - startTime,
          });

          return serveContent(url.pathname, session);
        }
      }

      // Check for time-based access
      const paymentHeader = req.headers.get("x-payment");
      if (paymentHeader) {
        walletAddress = extractWalletFromPayment(paymentHeader);

        if (walletAddress && hasTimeAccess(walletAddress)) {
          if (!checkRateLimit(walletAddress)) {
            return Response.json({ error: "Rate limited" }, { status: 429 });
          }
          return serveContent(url.pathname);
        }
      }

      // No valid access - return 402
      const price = calculatePrice(url.pathname, walletAddress);

      if (!paymentHeader) {
        return Response.json(
          {
            x402Version: 1,
            accepts: [
              {
                scheme: "exact",
                network: "solana-devnet",
                maxAmountRequired: String(price),
                description: `Access to ${url.pathname}`,
                payTo: TREASURY_ADDRESS,
                asset: { address: USDC_MINT },
                // ... other fields
              },
            ],
            pricing: {
              base: calculatePrice(url.pathname),
              current: price,
              isPeakHours: isPeakHours(),
            },
          },
          { status: 402 }
        );
      }

      // Verify and process payment
      const isValid = await verifyPayment(paymentHeader);

      if (isValid && walletAddress) {
        recordUsage(walletAddress);
        trackUsage({
          timestamp: Date.now(),
          walletAddress,
          endpoint: url.pathname,
          amountPaid: price,
          responseTime: Date.now() - startTime,
        });

        return serveContent(url.pathname);
      }

      return Response.json({ error: "Invalid payment" }, { status: 402 });
    }

    return new Response("Not found", { status: 404 });
  },
});
```

## What You Learned

- Session tokens for multi-request access
- Dynamic pricing based on time and usage
- Time-based access tiers
- Usage analytics and tracking
- Rate limiting to prevent abuse
- Combining multiple patterns

## Next Up

Time to deploy. We'll get your x402 app running in production with proper infrastructure.
