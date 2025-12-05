---
title: "What is x402? The HTTP Status Code That Changes Everything"
description: "HTTP 402 'Payment Required' finally has a real implementation. Learn how x402 enables pay-per-request APIs and micropayments on the web."
tags: ["solana", "javascript", "x402", "payments", "api"]
pubDate: "2025-12-04T15:00:00Z"
series: "solana-for-js-devs"
seriesOrder: 13
---

We've learned Solana's fundamentals. Now we get to the reason I started this journey: x402.

This protocol solves a problem I've had for years - how do you charge for digital content without the overhead eating your margins?

## The Problem

Traditional payment options for APIs and web content:

**Free tier + subscription** - High friction. Users don't want another subscription.

**API keys + usage billing** - Massive overhead. Billing dashboards, invoicing, payment failures.

**Stripe/payment processors** - 2.9% + $0.30 per transaction makes anything under $10 uneconomical.

What if charging $0.01 for an API call just... worked?

## HTTP 402: Payment Required

Back in 1997, the HTTP specification included a status code that was "reserved for future use":

```
402 Payment Required
```

The idea was simple: a server could respond with 402 to indicate "pay me first, then I'll give you the resource."

The problem? There was no standard way to specify _how_ to pay. Credit cards require accounts. PayPal requires integration. The web wasn't ready.

Until now.

## Enter x402

The x402 protocol activates HTTP 402 using cryptocurrency payments:

```
1. Client requests resource        GET /api/expensive-thing
                                          ↓
2. Server responds with 402        402 Payment Required
   + payment requirements          {"price": "$0.01", "payTo": "..."}
                                          ↓
3. Client makes payment            (Solana transfer: 0.01 USDC)
                                          ↓
4. Client retries with proof       GET /api/expensive-thing
                                   X-PAYMENT: <proof>
                                          ↓
5. Server verifies, responds       200 OK + content
```

No accounts. No OAuth. No API keys. Just HTTP.

## Why Solana?

x402 is chain-agnostic, but Solana is the natural fit:

**Speed** - 400ms transaction finality means the client isn't waiting.

**Cost** - $0.00025 per transaction makes micropayments viable.

**USDC** - Stable pricing. $0.01 is always $0.01.

On Ethereum, the transaction fee alone would exceed most micropayment amounts.

## The Protocol Flow

Let's trace through a real x402 interaction:

### Request Without Payment

```http
GET /api/premium-content HTTP/1.1
Host: example.com
```

### Server Response (402)

```http
HTTP/1.1 402 Payment Required
Content-Type: application/json

{
  "x402Version": 1,
  "accepts": [{
    "scheme": "exact",
    "network": "solana-mainnet",
    "maxAmountRequired": "10000",
    "resource": "https://example.com/api/premium-content",
    "description": "Access to premium content",
    "mimeType": "application/json",
    "payTo": "DRpbCBMxVnDK7maPgWxXSa4Z4A8e3MQbSpWhdMpVRwFD",
    "maxTimeoutSeconds": 60,
    "asset": {
      "address": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
    },
    "extra": {}
  }]
}
```

The server tells the client:

- Pay to this Solana address
- Send this much USDC (10000 = $0.01 with 6 decimals)
- Complete within 60 seconds

### Client Makes Payment

The client:

1. Creates a Solana transaction
2. Transfers the requested USDC amount
3. Gets the transaction signature

### Request With Payment Proof

```http
GET /api/premium-content HTTP/1.1
Host: example.com
X-PAYMENT: eyJzY2hlbWUiOiJleGFjdCIsIm5ldHdvcmsiOiJzb2xhbmEtbWFpbm5ldCIsInBheWxvYWQiOnsiYXV0aG9yaXphdGlvbiI6Ijh4eFhYLi4uIn19
```

The `X-PAYMENT` header contains:

- Payment scheme used
- Network (solana-mainnet/devnet)
- Transaction signature or authorization

### Server Verifies and Responds

```http
HTTP/1.1 200 OK
Content-Type: application/json
X-PAYMENT-RESPONSE: {"success": true, "network": "solana-mainnet"}

{
  "content": "Here's your premium content..."
}
```

## The Facilitator

Verifying Solana transactions requires blockchain access. Rather than every server running a validator connection, x402 uses "facilitators" - trusted verification services.

```
Client pays ──> Solana blockchain
                      │
                      ▼
Server ──> Facilitator ──> "Payment valid!"
                │
                ▼
           Return content
```

Facilitators provide:

- `/verify` - Check if a payment is valid
- `/settle` - Confirm the payment is final
- `/supported` - List supported networks/tokens

You can use public facilitators or run your own.

## Real Adoption

x402 isn't theoretical:

- **500,000+ weekly transactions** on Solana
- **40+ partners** building infrastructure
- **Major platforms** (Cloudflare, Anthropic) supporting x402
- **10,000% growth** in a single month

The killer use case? AI agents. LLMs can now pay for APIs autonomously - no human intervention, no API key management.

## Use Cases

**Pay-per-request APIs:**

- AI inference endpoints
- Data feeds and research APIs
- Compute resources

**Content monetization:**

- Premium articles
- Video content
- Downloads

**AI agent payments:**

- Autonomous API access
- Agent-to-agent transactions
- Micropayment marketplaces

## The JavaScript Ecosystem

Several libraries exist for implementing x402:

**Server-side:**

- `x402-next` - Next.js middleware
- `@faremeter/payment-solana` - Solana-native SDK
- Coinbase's reference implementation

**Client-side:**

- `x402-solana/client` - Browser/Node client
- `@faremeter/fetch` - Fetch wrapper with auto-payment

**Facilitators:**

- PayAI Network
- Coinbase's facilitator
- Self-hosted options

## What We're Building

In the next few posts, we'll build:

1. **An x402 server** - Express API that returns 402 and verifies payments
2. **An x402 client** - JavaScript that handles the payment flow automatically
3. **A full Next.js app** - Complete pay-per-request application

By the end, you'll have a working template for monetizing any API or content.

## The Bigger Picture

x402 isn't just about payments. It's about a new primitive for the web:

- **No accounts** - Users don't register, they pay
- **No trust** - Payments are verified on-chain
- **No middlemen** - Direct wallet-to-wallet transfers
- **No minimums** - $0.001 is economically viable

This enables business models that weren't possible before.

## What You Learned

- HTTP 402 "Payment Required" is finally real
- x402 uses crypto payments (primarily on Solana) to gate resources
- The flow: request → 402 → pay → retry with proof → 200
- Facilitators handle payment verification
- AI agents are a major driver of adoption

## Next Up

Time to write code. We'll build an x402 server from scratch - an Express API that requires payment and verifies transactions.

---

**Resources:**

- [x402 Protocol Spec](https://github.com/coinbase/x402)
- [Solana x402 Guide](https://solana.com/developers/guides/getstarted/intro-to-x402)
- [PayAI Facilitator](https://facilitator.payai.network)
