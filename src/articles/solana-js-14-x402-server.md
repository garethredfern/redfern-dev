---
title: "Your First x402 Server: Pay-Per-Request API"
description: "Build an Express API that requires Solana USDC payments. Return 402, verify payments, serve content."
tags: ["solana", "javascript", "x402", "express", "api"]
pubDate: "2025-12-04T15:30:00Z"
series: "solana-for-js-devs"
seriesOrder: 14
---

Time to build. We're creating an Express API that requires payment before serving content.

By the end of this post, you'll have a working x402 server that:

- Returns 402 with payment requirements
- Accepts the `X-PAYMENT` header
- Verifies payments via a facilitator
- Serves protected content

## Project Setup

We'll use Bun for the server - it's faster and has a cleaner API than Node + Express. Plus native TypeScript.

```bash
mkdir x402-server
cd x402-server
bun init -y
```

Bun has a built-in HTTP server, so we don't even need Express:

## The Minimal Server

Let's start with the simplest possible x402 server using Bun's native `Bun.serve()`:

```typescript
// server.ts

// Your Solana wallet address (receives payments)
const TREASURY_ADDRESS = "YOUR_WALLET_ADDRESS";

// USDC on Solana devnet
const USDC_DEVNET = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

// Price in USDC micro-units (1 USDC = 1,000,000)
const PRICE = "10000"; // $0.01

const server = Bun.serve({
  port: 3000,

  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/api/premium") {
      const paymentHeader = req.headers.get("x-payment");

      if (!paymentHeader) {
        // No payment - return 402 with requirements
        return Response.json(
          {
            x402Version: 1,
            accepts: [
              {
                scheme: "exact",
                network: "solana-devnet",
                maxAmountRequired: PRICE,
                resource: `http://localhost:3000/api/premium`,
                description: "Access to premium content",
                mimeType: "application/json",
                payTo: TREASURY_ADDRESS,
                maxTimeoutSeconds: 60,
                asset: {
                  address: USDC_DEVNET,
                },
                extra: {},
              },
            ],
          },
          { status: 402 }
        );
      }

      // TODO: Verify payment
      // For now, just accept any payment header

      return Response.json({
        message: "Welcome to the premium content!",
        data: {
          secret: "The answer is 42",
          timestamp: new Date().toISOString(),
        },
      });
    }

    return new Response("Not found", { status: 404 });
  },
});

console.log(`x402 server running on http://localhost:${server.port}`);
```

Run it:

```bash
bun server.ts
```

Test with curl:

```bash
# Without payment - get 402
curl http://localhost:3000/api/premium

# With payment header - get content (no verification yet)
curl -H "X-PAYMENT: fake-payment" http://localhost:3000/api/premium
```

## Adding Real Verification

Now let's verify payments using a facilitator. Bun has native `fetch`, so no extra packages needed:

```typescript
// server.ts

// Configuration
const CONFIG = {
  treasuryAddress: "YOUR_WALLET_ADDRESS",
  network: "solana-devnet",
  facilitatorUrl: "https://x402.org/facilitator",
  usdcMint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  price: "10000", // $0.01 USDC
};

// Create payment requirements
function createPaymentRequirements(resource: string) {
  return {
    x402Version: 1,
    accepts: [
      {
        scheme: "exact",
        network: CONFIG.network,
        maxAmountRequired: CONFIG.price,
        resource,
        description: "Premium API access",
        mimeType: "application/json",
        payTo: CONFIG.treasuryAddress,
        maxTimeoutSeconds: 60,
        asset: {
          address: CONFIG.usdcMint,
        },
        extra: {},
      },
    ],
  };
}

// Verify payment with facilitator
async function verifyPayment(paymentHeader: string, paymentRequirements: any) {
  try {
    const response = await fetch(`${CONFIG.facilitatorUrl}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentHeader,
        paymentRequirements: paymentRequirements.accepts[0],
      }),
    });

    const result = (await response.json()) as { valid: boolean };
    return result.valid === true;
  } catch (error) {
    console.error("Verification error:", error);
    return false;
  }
}

const server = Bun.serve({
  port: 3000,

  async fetch(req) {
    const url = new URL(req.url);

    // CORS headers
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, X-PAYMENT",
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    if (url.pathname === "/api/premium") {
      const paymentHeader = req.headers.get("x-payment");
      const resource = req.url;
      const paymentRequirements = createPaymentRequirements(resource);

      if (!paymentHeader) {
        return Response.json(paymentRequirements, {
          status: 402,
          headers,
        });
      }

      // Verify the payment
      const isValid = await verifyPayment(paymentHeader, paymentRequirements);

      if (!isValid) {
        return Response.json(
          {
            error: "Invalid payment",
            ...paymentRequirements,
          },
          { status: 402, headers }
        );
      }

      // Payment verified - serve content
      return Response.json(
        {
          message: "Payment verified! Here is your premium content.",
          data: {
            secret: "The answer is 42",
            timestamp: new Date().toISOString(),
          },
        },
        {
          headers: {
            ...headers,
            "X-PAYMENT-RESPONSE": JSON.stringify({
              success: true,
              network: CONFIG.network,
            }),
          },
        }
      );
    }

    return new Response("Not found", { status: 404, headers });
  },
});

console.log(`x402 server running on http://localhost:${server.port}`);
console.log(`Treasury: ${CONFIG.treasuryAddress}`);
```

## Creating Reusable Middleware

For multiple endpoints, let's create a helper function:

```typescript
// x402.ts

interface X402Config {
  treasuryAddress: string;
  network?: string;
  facilitatorUrl?: string;
  usdcMint?: string;
}

interface RouteConfig {
  price: number;
  description?: string;
}

export function createX402Handler(config: X402Config) {
  const {
    treasuryAddress,
    network = "solana-devnet",
    facilitatorUrl = "https://x402.org/facilitator",
    usdcMint = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  } = config;

  return function withPayment(
    routeConfig: RouteConfig,
    handler: (req: Request) => Response | Promise<Response>
  ) {
    return async (req: Request): Promise<Response> => {
      const paymentHeader = req.headers.get("x-payment");

      const paymentRequirements = {
        x402Version: 1,
        accepts: [
          {
            scheme: "exact",
            network,
            maxAmountRequired: String(routeConfig.price),
            resource: req.url,
            description: routeConfig.description || "API access",
            mimeType: "application/json",
            payTo: treasuryAddress,
            maxTimeoutSeconds: 60,
            asset: { address: usdcMint },
            extra: {},
          },
        ],
      };

      if (!paymentHeader) {
        return Response.json(paymentRequirements, { status: 402 });
      }

      // Verify payment
      try {
        const response = await fetch(`${facilitatorUrl}/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentHeader,
            paymentRequirements: paymentRequirements.accepts[0],
          }),
        });

        const result = (await response.json()) as { valid: boolean };

        if (!result.valid) {
          return Response.json(
            {
              error: "Payment verification failed",
              ...paymentRequirements,
            },
            { status: 402 }
          );
        }

        // Call the actual handler
        return handler(req);
      } catch (error) {
        console.error("x402 verification error:", error);
        return Response.json(
          { error: "Payment verification failed" },
          { status: 500 }
        );
      }
    };
  };
}
```

Use it like this:

```typescript
// server.ts
import { createX402Handler } from "./x402";

const withPayment = createX402Handler({
  treasuryAddress: "YOUR_WALLET_ADDRESS",
});

// Define your handlers
const cheapHandler = withPayment(
  { price: 10000, description: "Basic access" },
  () => Response.json({ tier: "basic", data: "..." })
);

const premiumHandler = withPayment(
  { price: 100000, description: "Premium access" },
  () => Response.json({ tier: "premium", data: "..." })
);

const expensiveHandler = withPayment(
  { price: 1000000, description: "Enterprise access" },
  () => Response.json({ tier: "enterprise", data: "..." })
);

// Router
const server = Bun.serve({
  port: 3000,

  async fetch(req) {
    const url = new URL(req.url);

    switch (url.pathname) {
      case "/api/cheap":
        return cheapHandler(req);
      case "/api/premium":
        return premiumHandler(req);
      case "/api/expensive":
        return expensiveHandler(req);
      case "/api/free":
        return Response.json({ tier: "free", data: "..." });
      default:
        return new Response("Not found", { status: 404 });
    }
  },
});

console.log(`Server running on http://localhost:${server.port}`);
```

## Testing Without a Real Wallet

For development, you might want to bypass payment verification:

```javascript
const x402 = createX402Middleware({
  treasuryAddress: "YOUR_WALLET_ADDRESS",
  network: "solana-devnet",
  // Add bypass option for development
  bypassVerification: process.env.NODE_ENV === "development",
});
```

Update the middleware to check this flag and skip verification if set.

## Complete Working Server

Here's the full implementation with Bun:

```typescript
// server.ts

// Configuration (use Bun.env for environment variables)
const CONFIG = {
  treasuryAddress: Bun.env.TREASURY_ADDRESS || "YOUR_WALLET_ADDRESS",
  network: Bun.env.SOLANA_NETWORK || "solana-devnet",
  facilitatorUrl: Bun.env.FACILITATOR_URL || "https://x402.org/facilitator",
  usdcMint: Bun.env.USDC_MINT || "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  port: Number(Bun.env.PORT) || 3000,
};

// Verify payment with facilitator
async function verifyPayment(paymentHeader: string, paymentRequirements: any) {
  const response = await fetch(`${CONFIG.facilitatorUrl}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      paymentHeader,
      paymentRequirements: paymentRequirements.accepts[0],
    }),
  });
  const result = (await response.json()) as { valid: boolean };
  return result.valid;
}

// Create payment requirements
function createRequirements(
  price: number,
  description: string,
  resource: string
) {
  return {
    x402Version: 1,
    accepts: [
      {
        scheme: "exact",
        network: CONFIG.network,
        maxAmountRequired: String(price),
        resource,
        description,
        mimeType: "application/json",
        payTo: CONFIG.treasuryAddress,
        maxTimeoutSeconds: 60,
        asset: { address: CONFIG.usdcMint },
        extra: {},
      },
    ],
  };
}

// x402 wrapper
function requirePayment(
  price: number,
  description: string,
  handler: () => object
) {
  return async (req: Request): Promise<Response> => {
    const paymentHeader = req.headers.get("x-payment");
    const requirements = createRequirements(price, description, req.url);

    if (!paymentHeader) {
      return Response.json(requirements, { status: 402 });
    }

    try {
      const isValid = await verifyPayment(paymentHeader, requirements);

      if (!isValid) {
        return Response.json(
          { error: "Invalid payment", ...requirements },
          { status: 402 }
        );
      }

      return Response.json(handler(), {
        headers: {
          "X-PAYMENT-RESPONSE": JSON.stringify({
            success: true,
            network: CONFIG.network,
          }),
        },
      });
    } catch {
      return Response.json({ error: "Verification failed" }, { status: 500 });
    }
  };
}

// Routes
const routes: Record<string, (req: Request) => Response | Promise<Response>> = {
  "/": () =>
    Response.json({
      name: "x402 Demo API",
      endpoints: {
        "/api/free": "Free endpoint",
        "/api/basic": "Requires $0.01 USDC",
        "/api/premium": "Requires $0.10 USDC",
      },
    }),

  "/api/free": () =>
    Response.json({
      message: "This is free content!",
      timestamp: new Date().toISOString(),
    }),

  "/api/basic": requirePayment(10000, "Basic API access", () => ({
    message: "Thanks for paying! Here is basic content.",
    data: {
      fact: "Solana can process 65,000 transactions per second.",
      tier: "basic",
    },
  })),

  "/api/premium": requirePayment(100000, "Premium API access", () => ({
    message: "Welcome, premium user!",
    data: {
      secrets: ["The answer is 42", "Blockchain is just a linked list"],
      tier: "premium",
      bonus: "Premium users get extra data",
    },
  })),
};

// Server
const server = Bun.serve({
  port: CONFIG.port,

  async fetch(req) {
    const url = new URL(req.url);

    // CORS
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type, X-PAYMENT",
        },
      });
    }

    const handler = routes[url.pathname];
    if (handler) {
      const response = await handler(req);
      // Add CORS to all responses
      response.headers.set("Access-Control-Allow-Origin", "*");
      return response;
    }

    return new Response("Not found", { status: 404 });
  },
});

console.log(`
x402 Server Running
==================
URL: http://localhost:${server.port}
Network: ${CONFIG.network}
Treasury: ${CONFIG.treasuryAddress}
Facilitator: ${CONFIG.facilitatorUrl}
`);
```

## Environment Variables

Create a `.env` file (Bun loads this automatically):

```bash
TREASURY_ADDRESS=your_solana_wallet_address
SOLANA_NETWORK=solana-devnet
FACILITATOR_URL=https://x402.org/facilitator
USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
PORT=3000
```

Run the server:

```bash
bun server.ts
```

## Why Bun?

Coming from Node.js, here's what's better:

| Node.js                       | Bun                    |
| ----------------------------- | ---------------------- |
| Need Express for routing      | `Bun.serve()` built-in |
| Need `node-fetch` for fetch   | Native `fetch`         |
| Need `dotenv` for .env        | Auto-loads `.env`      |
| `package.json` type: module   | ESM by default         |
| Need `ts-node` for TypeScript | Native TS support      |
| ~200ms cold start             | ~20ms cold start       |

For an x402 server where response time matters, Bun's speed advantage is real.

## What You Built

You now have a working x402 server that:

✅ Returns 402 with payment requirements for protected routes
✅ Accepts `X-PAYMENT` headers
✅ Verifies payments through a facilitator
✅ Serves content after verification
✅ Supports multiple price tiers

## Next Up

We have a server. Now we need a client that can:

1. Detect the 402 response
2. Parse payment requirements
3. Make the Solana payment
4. Retry with the proof

That's the next post.
