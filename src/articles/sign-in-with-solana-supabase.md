---
title: "Sign In With Solana: A Beginner's Guide to Web3 Authentication"
description: "Learn how wallet-based authentication works, what makes it secure, and how to implement it with Supabase — including considerations for Solana Mobile's Seeker device."
tags: ["solana", "web3", "supabase", "authentication", "bun"]
pubDate: "2025-12-18T12:00:00Z"
---

If you've spent any time in the Web3 space, you've probably clicked "Connect Wallet" on dozens of sites. But have you ever wondered what's actually happening when you sign that message? And more importantly — is it secure?

I've been exploring this recently while planning a project that needs to work on both web and Solana Mobile's Seeker device. Supabase now supports Web3 authentication out of the box, which seemed like a perfect fit. But the deeper I dug, the more I realised there's a lot going on under the hood that's worth understanding.

This post breaks down Sign In With Solana (SIWS) from first principles. No assumed knowledge. By the end, you'll understand how it works, why certain security measures exist, and how to implement it yourself.

## What Problem Are We Solving?

Traditional authentication works like this: you create an account with an email and password, the server stores a hash of your password, and when you log in, it compares what you typed against that hash.

The problem? Passwords get leaked, phished, and forgotten. Password managers help, but they're another thing to trust.

Web3 authentication flips this model. Instead of proving you know a secret (your password), you prove you _own_ something — specifically, a cryptographic key pair stored in your wallet.

**Short answer:** You sign a message with your private key, and the server verifies it with your public key.

**Long answer:** Your wallet holds a private key that only you control. When a site asks you to "sign in", it presents a message for you to sign. Your wallet uses your private key to create a digital signature — a mathematical proof that only someone with that private key could have produced. The server can then verify this signature using your public key (your wallet address), without ever seeing your private key.

This is the same cryptography that secures blockchain transactions. If it wasn't secure, people would be stealing crypto constantly.

## The SIWS Message Format

Early Web3 auth was messy. Sites would ask you to sign arbitrary messages like "Login to CoolApp" or just a random string of characters. This created problems:

1. **Inconsistent UX** — every site looked different
2. **Phishing risk** — users couldn't tell if a message was legitimate
3. **Replay attacks** — a signed message could potentially be reused

Sign In With Solana (SIWS) standardises the message format. It's based on EIP-4361 (Sign In With Ethereum) but adapted for Solana.

Here's what a SIWS message looks like:

```
example.com wants you to sign in with your Solana account:
7S3P4HxJpyyigGzodYwHtCxZyUQe9JiBMHyRWXArAaKv

I accept the Terms of Service at https://example.com/tos

URI: https://example.com/login
Version: 1
Chain ID: mainnet
Nonce: k8s9d7f2a1
Issued At: 2025-01-15T10:30:00.000Z
Expiration Time: 2025-01-15T10:40:00.000Z
```

Let's break down each part:

- **Domain line** — `example.com wants you to sign in...` tells you exactly which site is requesting access. Your wallet can verify this matches the actual site you're on.
- **Address** — your Solana wallet address (public key)
- **Statement** — human-readable text explaining what you're agreeing to
- **URI** — the specific resource you're accessing
- **Version** — always "1" for now (future-proofing)
- **Chain ID** — which Solana network (`mainnet`, `devnet`, `testnet`)
- **Nonce** — a random one-time code (more on this shortly)
- **Issued At** — when the message was created
- **Expiration Time** — when it becomes invalid

The beauty of this format is that wallets can parse it and show you a clean "Sign In" dialog instead of scary raw text. They can also warn you if something looks suspicious — like if the domain in the message doesn't match the site you're actually on.

## What Is a Nonce and Why Does It Matter?

A **nonce** (number used once) is a random value that prevents replay attacks.

**What's a replay attack?**

Imagine you sign a message to log into a site. An attacker intercepts that signed message. Without a nonce, they could send that same signed message to the server later and gain access to your account — even though they never had your private key.

**How does a nonce prevent this?**

The server generates a unique, random nonce for each login attempt and remembers it. When you sign the message containing that nonce and send it back, the server:

1. Checks the nonce matches what it generated
2. Verifies the signature is valid
3. **Immediately invalidates that nonce** — it can never be used again

If an attacker tries to replay your signed message, the nonce has already been used, so the server rejects it.

```
First login attempt:
Server generates nonce: "abc123xyz"
You sign message with nonce "abc123xyz"
Server accepts, marks "abc123xyz" as used ✓

Replay attack attempt:
Attacker sends your old signed message with nonce "abc123xyz"
Server checks: "abc123xyz" already used
Server rejects ✗
```

This is why the nonce must be:

- **Server-generated** — not chosen by the client
- **Random enough** — at least 8 alphanumeric characters
- **One-time use** — invalidated after successful verification
- **Tied to a session** — associated with the specific browser session requesting it

## The Security Considerations

Wallet-based authentication isn't perfect. Here's what you need to think about:

### 1. No Account Recovery

If a user loses their seed phrase, they lose access. Forever. No password reset, no "forgot password" email.

**Mitigation:** Let users link an email or phone number after signing in with their wallet. Supabase supports this with `linkIdentity()`.

### 2. Sybil Attacks (Bot Spam)

Creating a new wallet is free and instant. One person can generate thousands. This makes traditional bot prevention harder.

**Mitigation:** Rate limiting (Supabase defaults to 30 sign-ins per 5 minutes per IP) and CAPTCHA on sign-up.

### 3. Blind Message Attacks

This is subtle but serious. Research shows that 75% of Web3 auth implementations are vulnerable.

The attack: You're on malicious-site.com, which shows you a sign-in prompt. But the message they're asking you to sign is actually for legitimate-site.com. You sign it, thinking you're just logging into the malicious site. Now the attacker has a valid signed message for your account on the legitimate site.

**Mitigation:** SIWS includes the domain in the message, and wallets warn users if it doesn't match. But this only works if the wallet supports SIWS properly and users pay attention to warnings.

### 4. Timestamp Validation

Signed messages should expire quickly. A message signed 24 hours ago shouldn't still be valid — it increases the window for replay attacks.

**Mitigation:** Use short expiration times (5-10 minutes) and validate timestamps server-side.

### 5. Phishing Still Works

Domain binding helps, but users still need to check they're on the right site. A convincing lookalike domain (`yourapp.co` vs `yourapp.com`) with a valid SIWS message for that lookalike domain would still work.

**Mitigation:** User education, browser security features, and potentially hardware wallets that show the domain on a secure display.

## Implementing with Supabase

Supabase handles all the complexity for you — nonce generation, message construction, signature verification, user creation, and session management. How you call it depends on whether you're on web or mobile.

### Setting Up Supabase

First, enable Web3 auth in your Supabase project. In the dashboard, go to Authentication → Providers and enable "Web3 Wallet".

Or in your `supabase/config.toml`:

```toml
[auth.web3.solana]
enabled = true
```

You'll also want to configure rate limiting:

```toml
[auth.rate_limit]
web3 = 30  # 30 sign-ins per 5 minutes per IP
```

And set up your redirect URLs in the dashboard. Supabase validates that the domain in the signed message matches an allowed URL.

### Web Apps (Phantom, Solflare, etc.)

For browser-based wallets, it's one line:

```javascript
const { data, error } = await supabase.auth.signInWithWeb3({
  chain: "solana",
  statement: "Sign in to My App",
});
```

That's it. Supabase:

- Generates the nonce
- Constructs the SIWS message
- Prompts the wallet to sign
- Verifies the signature
- Creates or retrieves the user
- Issues a session

The `statement` parameter becomes the human-readable text shown in the wallet's sign-in dialog.

### Seeker / Mobile Wallet Adapter

Here's where it gets slightly more involved. Solana Mobile's Seeker uses Mobile Wallet Adapter (MWA), which has a different API pattern than browser wallets.

MWA uses a `transact()` callback:

```javascript
import { transact } from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";

await transact(async (wallet) => {
  // All wallet operations happen inside this callback
});
```

This doesn't match the `window.solana` interface that Supabase's automatic mode expects. But there's good news — MWA has built-in SIWS support, and Supabase has a manual mode that accepts a pre-signed message.

Here's the full flow:

```typescript
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js'
import { verifySignIn } from '@solana/wallet-standard-util'

const APP_IDENTITY = {
  name: 'My Seeker App',
  uri: 'https://myapp.com',
  icon: '/icon.png'
}

export async function signInWithSeeker() {
  const result = await transact(async (wallet) => {

    // Use MWA's built-in SIWS support
    const authResult = await wallet.authorize({
      chain: 'solana:mainnet',
      identity: APP_IDENTITY,
      sign_in_payload: {
        domain: 'myapp.com',
        statement: 'Sign in to My Seeker App',
        uri: 'https://myapp.com'
      }
    })

    return authResult
  })
```

- `transact()` opens a connection to the Seed Vault (the Seeker's built-in wallet).
- `authorize()` with `sign_in_payload` triggers SIWS — the wallet constructs the message, shows a sign-in prompt, and returns the signed result.
- The wallet handles nonce generation internally.

```typescript
  // The wallet returns the signed message and signature
  const { sign_in_result } = result

  // Convert the signature to base64 for Supabase
  const signature = btoa(String.fromCharCode(...sign_in_result.signature))

  // Decode the signed message back to a string
  const message = new TextDecoder().decode(sign_in_result.signedMessage)

  // Pass to Supabase in manual mode
  const { data, error } = await supabase.auth.signInWithWeb3({
    chain: 'solana',
    message,
    signature
  })

  if (error) throw error

  return { user: data.user, session: data.session }
}
```

- `sign_in_result` contains the signature and the message that was signed.
- We convert to the formats Supabase expects (base64 signature, string message).
- Supabase's manual mode verifies the signature and creates the session.

The key insight: **you don't need a custom backend**. MWA handles message construction and nonce generation. Supabase handles signature verification and session management. They meet in the middle with the manual mode API.

### What If the Wallet Doesn't Support SIWS?

Some older wallets might not support `sign_in_payload`. In that case, you'd fall back to constructing the message yourself:

```typescript
const result = await transact(async (wallet) => {
  // Authorize without SIWS
  const authResult = await wallet.authorize({
    chain: "solana:mainnet",
    identity: APP_IDENTITY,
  });

  const address = authResult.accounts[0].address;

  // Construct the SIWS message manually
  const nonce = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const now = new Date();
  const expiry = new Date(now.getTime() + 10 * 60 * 1000);

  const message = [
    `myapp.com wants you to sign in with your Solana account:`,
    address,
    "",
    "Sign in to My Seeker App",
    "",
    `URI: https://myapp.com`,
    "Version: 1",
    "Chain ID: mainnet",
    `Nonce: ${nonce}`,
    `Issued At: ${now.toISOString()}`,
    `Expiration Time: ${expiry.toISOString()}`,
  ].join("\n");

  // Sign it manually
  const encodedMessage = new TextEncoder().encode(message);
  const [signatureBytes] = await wallet.signMessages({
    addresses: [address],
    payloads: [encodedMessage],
  });

  const signature = btoa(String.fromCharCode(...signatureBytes));

  return { message, signature };
});
```

- We generate our own nonce client-side. This is less secure than server-generated nonces, but Supabase still validates the signature and tracks used messages to prevent replay attacks.
- The message format must match the SIWS spec exactly — including the blank lines.

## Without Supabase: Rolling Your Own

If you're not using Supabase, you'll need to handle nonce management and signature verification yourself. Here's a minimal backend in Bun that shows what's involved.

**Why would you do this?** Maybe you're using a different database, need custom session logic, or want to understand what's happening under the hood.

### The Backend

```bash
mkdir solana-auth-api
cd solana-auth-api
bun init -y
bun add @noble/ed25519
```

```typescript
// index.ts
import { verify } from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha512";

// Required for ed25519 verification
import * as ed from "@noble/ed25519";
ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));

const nonceStore = new Map<string, { nonce: string; createdAt: number }>();

const generateNonce = (): string => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let nonce = "";
  for (let i = 0; i < 16; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
};
```

- `nonceStore` holds active nonces in memory. In production, use Redis or a database.
- `generateNonce()` creates a random 16-character string.
- `@noble/ed25519` is a lightweight library for Solana's signature scheme.

```typescript
const server = Bun.serve({
  port: 3000,

  async fetch(req) {
    const url = new URL(req.url)

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-session-id',
    }

    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }
```

- `Bun.serve()` creates an HTTP server with a simple fetch-based API.
- CORS headers allow frontend apps on different domains to call this API.

```typescript
// GET /nonce - Generate a new nonce for a session
if (url.pathname === "/nonce" && req.method === "GET") {
  const sessionId = req.headers.get("x-session-id");

  if (!sessionId) {
    return Response.json(
      { error: "x-session-id header required" },
      { status: 400, headers: corsHeaders }
    );
  }

  const nonce = generateNonce();

  nonceStore.set(sessionId, {
    nonce,
    createdAt: Date.now(),
  });

  // Clean up expired nonces (older than 5 minutes)
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  for (const [key, value] of nonceStore) {
    if (value.createdAt < fiveMinutesAgo) {
      nonceStore.delete(key);
    }
  }

  return Response.json({ nonce }, { headers: corsHeaders });
}
```

- The session ID ties the nonce to a specific client. The frontend generates this (usually a UUID).
- We store a timestamp so we can expire old nonces.
- Cleanup runs on each request — simple but effective.

```typescript
    // POST /verify - Verify a signed SIWS message
    if (url.pathname === '/verify' && req.method === 'POST') {
      const sessionId = req.headers.get('x-session-id')
      const body = await req.json()
      const { message, signature } = body

      if (!sessionId || !message || !signature) {
        return Response.json(
          { error: 'Missing required fields' },
          { status: 400, headers: corsHeaders }
        )
      }

      // Check nonce exists and hasn't expired
      const stored = nonceStore.get(sessionId)

      if (!stored) {
        return Response.json(
          { error: 'No nonce found. Request a new one.' },
          { status: 401, headers: corsHeaders }
        )
      }

      if (Date.now() - stored.createdAt > 5 * 60 * 1000) {
        nonceStore.delete(sessionId)
        return Response.json(
          { error: 'Nonce expired.' },
          { status: 401, headers: corsHeaders }
        )
      }

      // Verify nonce matches
      const nonceMatch = message.match(/Nonce: ([A-Za-z0-9]+)/)
      if (!nonceMatch || nonceMatch[1] !== stored.nonce) {
        return Response.json(
          { error: 'Nonce mismatch' },
          { status: 401, headers: corsHeaders }
        )
      }

      // CRITICAL: Invalidate nonce before verification
      // Prevents replay even if verification fails
      nonceStore.delete(sessionId)
```

- We check the nonce exists, hasn't expired, and matches what's in the message.
- **Important:** Delete the nonce immediately, before verifying the signature. This ensures a nonce can never be reused, even if someone finds a way to make verification fail.

```typescript
      // Extract address from message
      const addressMatch = message.match(/account:\n([1-9A-HJ-NP-Za-km-z]{32,44})/)
      if (!addressMatch) {
        return Response.json(
          { error: 'Could not extract address from message' },
          { status: 400, headers: corsHeaders }
        )
      }
      const address = addressMatch[1]

      // Verify the signature
      try {
        const messageBytes = new TextEncoder().encode(message)
        const signatureBytes = Uint8Array.from(atob(signature), c => c.charCodeAt(0))
        const publicKeyBytes = bs58Decode(address)

        const isValid = await verify(signatureBytes, messageBytes, publicKeyBytes)

        if (!isValid) {
          return Response.json(
            { error: 'Invalid signature' },
            { status: 401, headers: corsHeaders }
          )
        }
      } catch (e) {
        return Response.json(
          { error: 'Signature verification failed' },
          { status: 401, headers: corsHeaders }
        )
      }

      // Success! Create a session, JWT, or whatever your app needs
      return Response.json({
        success: true,
        address,
        // In a real app, return a JWT or session token here
      }, { headers: corsHeaders })
    }

    return Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders })
  }
})

// Helper: decode base58 (Solana addresses)
function bs58Decode(str: string): Uint8Array {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  const bytes: number[] = []
  for (const char of str) {
    let carry = ALPHABET.indexOf(char)
    for (let i = 0; i < bytes.length; i++) {
      carry += bytes[i] * 58
      bytes[i] = carry & 0xff
      carry >>= 8
    }
    while (carry > 0) {
      bytes.push(carry & 0xff)
      carry >>= 8
    }
  }
  for (const char of str) {
    if (char !== '1') break
    bytes.push(0)
  }
  return new Uint8Array(bytes.reverse())
}

console.log(`Server running at http://localhost:${server.port}`)
```

- We extract the wallet address from the message and decode it from base58.
- `@noble/ed25519` verifies the signature against the message and public key.
- On success, you'd typically create a JWT or session token. That part depends on your app.

Run it:

```bash
bun run index.ts
```

This is significantly more work than using Supabase, but now you understand what's happening. Supabase does all of this for you, plus user management, session refresh, and database integration.

## Summary: Which Path Do You Need?

| Scenario                 | What to use                                      |
| ------------------------ | ------------------------------------------------ |
| Web app with Supabase    | `signInWithWeb3()` — one line, done              |
| Seeker app with Supabase | MWA's `sign_in_payload` + Supabase manual mode   |
| Both web and Seeker      | Same Supabase backend, different frontend code   |
| No Supabase              | Build your own nonce management and verification |

The good news: whether someone signs in on web or Seeker, the same wallet address gets the same Supabase user account. Your database, RLS policies, and application logic work identically.

## The Honest Assessment

Wallet-based auth is genuinely useful. No passwords to leak, no email verification flows, instant onboarding for anyone with a wallet. For Web3-native users, it's a better experience.

But it's not a silver bullet:

- **Recovery is hard** — lost keys mean lost access
- **Bot prevention is harder** — free wallet creation means more spam potential
- **Users need to understand it** — signing prompts can still be phished if users don't read them
- **Not everyone has a wallet** — you're limiting your audience

For a Solana-focused app where your users already have wallets, it makes sense. For a general-purpose app, you probably want wallet auth as an _option_ alongside email/password.

Supabase lets you do both, and link them together. That's probably the right approach for most projects.

---

_This is part of my exploration into Solana mobile development. Next up: I'll be looking at what it takes to build a full Seeker app with Supabase as the backend._

**Code examples:** All code is copy-paste ready (with your own Supabase credentials). If something doesn't work, let me know.
