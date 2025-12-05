---
title: "Deploying Your x402 App to Production"
description: "Deploy your SvelteKit frontend and Bun backend to production. Environment setup, mainnet configuration, and monitoring."
tags: ["solana", "javascript", "x402", "deployment", "production"]
pubDate: "2025-12-04T17:30:00Z"
series: "solana-for-js-devs"
seriesOrder: 18
---

We've built everything locally. Now let's deploy for real users with real payments.

## Architecture Overview

```
┌──────────────────┐     ┌──────────────────┐
│  SvelteKit App   │     │   Bun API Server │
│  (Vercel/CF)     │────▶│   (Fly.io/Rail)  │
└──────────────────┘     └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │  Solana Mainnet  │
                         │  (via RPC)       │
                         └──────────────────┘
```

We'll deploy:

- **Frontend**: SvelteKit on Vercel or Cloudflare Pages
- **API**: Bun server on Fly.io or Railway

## Production Checklist

Before deploying:

- [ ] Switch from devnet to mainnet
- [ ] Use mainnet USDC mint address
- [ ] Set up production RPC endpoint
- [ ] Configure real treasury wallet
- [ ] Set up error monitoring
- [ ] Enable HTTPS everywhere

## Mainnet Configuration

Update your environment variables:

```bash
# .env.production

# Network
SOLANA_NETWORK=solana-mainnet

# Mainnet USDC
USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v

# Your treasury wallet (receives payments)
TREASURY_ADDRESS=YourMainnetWalletAddress

# Production RPC (get from Helius, QuickNode, etc.)
RPC_URL=https://your-rpc-provider.com/api-key

# Facilitator
FACILITATOR_URL=https://x402.org/facilitator
```

## Getting a Production RPC

Public RPC endpoints are rate-limited. For production, use a dedicated provider:

**Helius** (Recommended for Solana)

```bash
RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
```

**QuickNode**

```bash
RPC_URL=https://your-endpoint.solana-mainnet.quiknode.pro/YOUR_KEY
```

**Triton**

```bash
RPC_URL=https://your-project.rpcpool.com/YOUR_KEY
```

Most have free tiers sufficient for starting out.

## Deploying the Bun API Server

### Option 1: Fly.io

Fly.io has great Bun support:

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Initialize
cd your-api-directory
fly launch
```

Create `fly.toml`:

```toml
app = "your-x402-api"
primary_region = "iad"

[build]
  builder = "paketobuildpacks/builder:base"

[env]
  PORT = "8080"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 1

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256
```

Create a `Dockerfile` for Bun:

```dockerfile
FROM oven/bun:1 as base
WORKDIR /app

# Install dependencies
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production

# Copy source
COPY . .

# Run
ENV NODE_ENV=production
EXPOSE 8080
CMD ["bun", "run", "server.ts"]
```

Set secrets:

```bash
fly secrets set TREASURY_ADDRESS=your_wallet
fly secrets set RPC_URL=your_rpc_url
fly secrets set SOLANA_NETWORK=solana-mainnet
fly secrets set USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

Deploy:

```bash
fly deploy
```

### Option 2: Railway

Railway is even simpler:

1. Connect your GitHub repo
2. Railway auto-detects Bun
3. Add environment variables in dashboard
4. Deploy

```bash
# Or use CLI
railway login
railway init
railway up
```

## Deploying SvelteKit Frontend

### Vercel

SvelteKit works great on Vercel:

```bash
# Install adapter
bun add -D @sveltejs/adapter-vercel
```

Update `svelte.config.js`:

```javascript
import adapter from "@sveltejs/adapter-vercel";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      runtime: "edge", // or 'nodejs18.x'
    }),
  },
};
```

Deploy:

```bash
# Install Vercel CLI
bun add -g vercel

# Deploy
vercel
```

Set environment variables in Vercel dashboard:

- `PUBLIC_API_URL` = your Fly.io API URL
- `PUBLIC_SOLANA_NETWORK` = solana-mainnet

### Cloudflare Pages

```bash
# Install adapter
bun add -D @sveltejs/adapter-cloudflare
```

Update `svelte.config.js`:

```javascript
import adapter from "@sveltejs/adapter-cloudflare";

export default {
  kit: {
    adapter: adapter(),
  },
};
```

Deploy via Cloudflare dashboard or Wrangler CLI.

## Environment Variables in SvelteKit

For client-side variables, prefix with `PUBLIC_`:

```bash
# .env
PUBLIC_API_URL=https://your-api.fly.dev
PUBLIC_SOLANA_NETWORK=mainnet-beta
PUBLIC_USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

Access in code:

```typescript
import { PUBLIC_API_URL, PUBLIC_SOLANA_NETWORK } from "$env/static/public";
```

## Updating the Wallet Store for Mainnet

```typescript
// src/lib/stores/wallet.ts

import { PUBLIC_SOLANA_NETWORK } from "$env/static/public";
import { Connection, clusterApiUrl } from "@solana/web3.js";

// Use environment-based RPC
function getRpcUrl(): string {
  if (PUBLIC_SOLANA_NETWORK === "mainnet-beta") {
    // Use your production RPC
    return import.meta.env.VITE_RPC_URL || clusterApiUrl("mainnet-beta");
  }
  return clusterApiUrl("devnet");
}

export const connection = derived(
  wallet,
  () => new Connection(getRpcUrl(), "confirmed")
);
```

## CORS Configuration

Update your Bun server for production CORS:

```typescript
const ALLOWED_ORIGINS = [
  "https://your-app.vercel.app",
  "https://your-domain.com",
];

const server = Bun.serve({
  port: process.env.PORT || 3000,

  async fetch(req) {
    const origin = req.headers.get("origin");

    const corsHeaders: Record<string, string> = {
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, X-PAYMENT, X-Session-Token",
    };

    // Check origin
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      corsHeaders["Access-Control-Allow-Origin"] = origin;
    }

    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Your route handling...
    const response = await handleRequest(req);

    // Add CORS headers to response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  },
});
```

## Health Checks

Add a health endpoint for monitoring:

```typescript
if (url.pathname === "/health") {
  // Check RPC connection
  try {
    const slot = await connection.getSlot();
    return Response.json({
      status: "healthy",
      slot,
      network: process.env.SOLANA_NETWORK,
    });
  } catch {
    return Response.json(
      { status: "unhealthy", error: "RPC connection failed" },
      { status: 503 }
    );
  }
}
```

## Error Monitoring

Add Sentry or similar:

```bash
bun add @sentry/bun
```

```typescript
import * as Sentry from "@sentry/bun";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

// In your error handling
try {
  // ...
} catch (err) {
  Sentry.captureException(err);
  throw err;
}
```

## Logging

Structured logging for production:

```typescript
function log(level: "info" | "warn" | "error", message: string, data?: object) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data,
  };

  console.log(JSON.stringify(entry));
}

// Usage
log("info", "Payment received", {
  wallet: walletAddress,
  amount: price,
  endpoint: url.pathname,
});
```

## Database for Sessions (Production)

Replace in-memory sessions with Redis:

```bash
bun add redis
```

```typescript
import { createClient } from "redis";

const redis = createClient({
  url: process.env.REDIS_URL,
});

await redis.connect();

async function createSession(walletAddress: string): Promise<string> {
  const token = crypto.randomUUID();

  await redis.setEx(
    `session:${token}`,
    86400, // 24 hours
    JSON.stringify({
      walletAddress,
      createdAt: Date.now(),
      requestsRemaining: 100,
    })
  );

  return token;
}

async function getSession(token: string): Promise<Session | null> {
  const data = await redis.get(`session:${token}`);
  return data ? JSON.parse(data) : null;
}
```

## Security Checklist

- [ ] HTTPS only (enforced by hosting provider)
- [ ] CORS restricted to your domains
- [ ] Rate limiting enabled
- [ ] No secrets in client-side code
- [ ] Treasury wallet secured (hardware wallet recommended)
- [ ] RPC API key not exposed to frontend
- [ ] Input validation on all endpoints

## Monitoring Your Revenue

Create a simple dashboard endpoint:

```typescript
if (url.pathname === "/admin/stats" && isAuthorized(req)) {
  const stats = await getUsageStats();

  return Response.json({
    last24h: {
      requests: stats.last24h,
      revenue: stats.revenue / 1_000_000, // Convert to USDC
    },
    allTime: {
      requests: stats.total,
      revenue: stats.totalRevenue / 1_000_000,
    },
    topEndpoints: stats.byEndpoint,
  });
}
```

## Going Live Checklist

1. **Test on devnet thoroughly**
2. **Switch environment to mainnet**
3. **Deploy API server**
4. **Deploy frontend**
5. **Test with small mainnet payment ($0.01)**
6. **Monitor logs for errors**
7. **Set up alerts for failures**
8. **Announce your launch!**

## What You Built

Congratulations! You've built a complete x402 payment system:

✅ Solana wallet connection in Svelte
✅ USDC payments for API access
✅ Session management for repeat users
✅ Dynamic pricing
✅ Production deployment

This is a real, monetizable product. The same architecture powers AI agent payments, premium APIs, and content paywalls across the x402 ecosystem.

## What's Next

Ideas to extend your x402 app:

- **Subscription tiers** - Weekly/monthly access tokens
- **Referral system** - Discounts for bringing new users
- **Usage dashboard** - Let users see their payment history
- **Webhook notifications** - Alert on payments received
- **Multi-token support** - Accept SOL, USDT, etc.

## Resources

- [x402 Protocol Spec](https://github.com/coinbase/x402)
- [Solana Developer Docs](https://solana.com/developers)
- [SvelteKit Docs](https://kit.svelte.dev)
- [Bun Docs](https://bun.sh/docs)

---

**Series complete!** You went from zero Solana knowledge to deploying a production payment system. That's a real skill.

Build something cool. Ship it. Get paid.

🟢 Vue developer
🟠 Learned Svelte
⚡ Built on Solana
💰 x402 payments live
