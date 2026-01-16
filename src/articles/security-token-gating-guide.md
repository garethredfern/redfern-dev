---
title: "Security Considerations for Token-Gated Applications"
description: "A beginner's guide to building secure NFT-based access control, covering authentication, authorization, RLS, and common pitfalls."
tags: ["solana", "security", "nft", "supabase", "web3"]
pubDate: "2026-01-15T23:00:00Z"
---

## Security Considerations for Token-Gated Applications

_A beginner's guide to building secure NFT-based access control_

---

## Introduction

Token gating is a powerful way to control access to your application based on NFT ownership. Users prove they own a specific NFT, and your app grants them access to exclusive content, features, or communities.

But with great power comes great responsibility. A poorly secured token-gated app can expose your users to attacks, let unauthorized people slip through, or even drain your API budget. This guide walks through the security considerations we addressed while building TreehouseHQ's workspace system.

**Who is this for?** Developers building their first token-gated application, or anyone curious about web3 security fundamentals.

---

## Table of Contents

1. [The Golden Rule: Never Trust the Client](#1-the-golden-rule-never-trust-the-client)
2. [Authentication vs Authorization](#2-authentication-vs-authorization)
3. [Verifying NFT Ownership](#3-verifying-nft-ownership)
4. [Protecting Your APIs](#4-protecting-your-apis)
5. [Database Security with RLS](#5-database-security-with-rls)
6. [Caching Safely](#6-caching-safely)
7. [Input Validation](#7-input-validation)
8. [Rate Limiting](#8-rate-limiting)
9. [CORS: Who Can Call Your APIs](#9-cors-who-can-call-your-apis)
10. [Security Headers](#10-security-headers)
11. [Signature Verification](#11-signature-verification)
12. [Common Pitfalls](#12-common-pitfalls)

---

## 1. The Golden Rule: Never Trust the Client

This is the most important security principle in web development, and it's especially critical for token gating.

### The Problem

```javascript
// DANGEROUS: Client-side NFT check
const hasNFT = await checkWalletForNFT(userWallet, collectionAddress);
if (hasNFT) {
  showSecretContent();
}
```

What's wrong here? The check happens in the user's browser. A malicious user can:

- Open browser DevTools
- Modify the JavaScript
- Make `hasNFT` always return `true`
- Access your gated content without owning the NFT

### The Solution

**Always verify on the server.** Your server (or Edge Function) is code that runs on machines you control. Users can't modify it.

```javascript
// SAFE: Server-side NFT check (Edge Function)
const hasNFT = await verifyNFTOnServer(userWallet, collectionAddress);
// Server makes the API call, server returns the result
// User can't tamper with this
```

### Our Implementation

We use Supabase Edge Functions for all NFT verification. The user's browser sends a request, but the actual Vybe API call happens on Supabase's servers:

```
User Browser → Edge Function → Vybe API → Edge Function → User Browser
                    ↑
            User can't access this
```

---

## 2. Authentication vs Authorization

These terms are often confused, but understanding the difference is crucial.

### Authentication: "Who are you?"

Authentication proves the user's identity. In our case:

- User connects their Solana wallet
- User signs a message with their private key
- Server verifies the signature matches the wallet address
- Now we know: "This user controls wallet ABC123..."

### Authorization: "What can you do?"

Authorization determines what an authenticated user is allowed to do:

- Do they own the required NFT? → Can access the workspace
- Are they the workspace owner? → Can manage admins
- Are they on the allowlist? → Can access as a guest

### The Flow

```
1. AUTHENTICATION
   User signs in with wallet → We know WHO they are

2. AUTHORIZATION
   Check NFT ownership → We know WHAT they can access
   Check role (owner/admin/member) → We know WHAT they can do
```

### Common Mistake

```javascript
// WRONG: Only checking authentication
if (user.isSignedIn) {
  showWorkspaceContent(); // Anyone signed in can see everything!
}

// RIGHT: Check both
if (user.isSignedIn && user.hasNFTAccess && user.role === 'admin') {
  showAdminPanel();
}
```

---

## 3. Verifying NFT Ownership

The core of token gating is checking if a user owns a specific NFT. Here's how to do it securely.

### Don't: Check on the client

```javascript
// INSECURE
const nfts = await connection.getParsedTokenAccountsByOwner(wallet);
const hasNFT = nfts.some((nft) => nft.collection === targetCollection);
```

### Do: Check on the server via a trusted API

```javascript
// SECURE: Edge Function
const response = await fetch(`https://api.vybenetwork.xyz/v4/wallets/${wallet}/nft-balance`, {
  headers: { 'X-API-Key': process.env.VYBE_API_KEY }
});
const nfts = await response.json();
const hasNFT = nfts.some((nft) => nft.collectionAddress === targetCollection);
```

### Why Use an NFT API?

You could query the Solana blockchain directly, but:

- It's slow (multiple RPC calls per wallet)
- It's complex (parsing token metadata)
- It's expensive (RPC rate limits)

APIs like Vybe Network, Helius, or SimpleHash index the blockchain and provide fast, reliable lookups.

### Check ALL User Wallets

Users often have multiple wallets. If they own the NFT in Wallet B but signed in with Wallet A, they should still get access.

```javascript
// Get all wallets linked to this user
const wallets = await getUserWallets(userId);

// Check each wallet for the NFT
for (const wallet of wallets) {
  const hasNFT = await checkNFT(wallet.address, collection);
  if (hasNFT) {
    return true; // Found it!
  }
}
return false; // No wallet has the NFT
```

---

## 4. Protecting Your APIs

Your Edge Functions are the gatekeepers. If they're not secured, nothing else matters.

### Always Require Authentication (for sensitive endpoints)

```javascript
// Edge Function
const authHeader = req.headers.get('authorization');
if (!authHeader?.startsWith('Bearer ')) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401 // Not 200!
  });
}

const { user, error } = await supabase.auth.getUser(token);
if (error || !user) {
  return new Response(JSON.stringify({ error: 'Invalid token' }), {
    status: 401
  });
}

// Now we know who's calling
```

### Use Proper HTTP Status Codes

| Code | Meaning           | When to Use               |
| ---- | ----------------- | ------------------------- |
| 200  | OK                | Request succeeded         |
| 400  | Bad Request       | Invalid input             |
| 401  | Unauthorized      | Not logged in / bad token |
| 403  | Forbidden         | Logged in but not allowed |
| 429  | Too Many Requests | Rate limited              |
| 500  | Server Error      | Something broke           |

### Why Status Codes Matter

```javascript
// BAD: Always returns 200
return new Response(
  JSON.stringify({
    success: false,
    error: 'Not authorized'
  })
);
// Client might not check the body, assumes success

// GOOD: Returns appropriate status
return new Response(JSON.stringify({ error: 'Not authorized' }), {
  status: 403
});
// Client libraries automatically handle this as an error
```

---

## 5. Database Security with RLS

Row Level Security (RLS) is your database's immune system. It ensures users can only access data they're allowed to see.

### What is RLS?

RLS adds automatic filters to every database query based on who's asking.

```sql
-- Without RLS:
SELECT * FROM workspaces;
-- Returns ALL workspaces (bad!)

-- With RLS:
SELECT * FROM workspaces;
-- Returns only workspaces the current user can access (good!)
```

### Basic RLS Pattern

```sql
-- Enable RLS on the table
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Create a policy
CREATE POLICY "Users can view their workspaces"
  ON workspaces
  FOR SELECT
  USING (
    id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );
```

### Common RLS Patterns We Use

**1. Users can only see their own data:**

```sql
CREATE POLICY "Users view own wallets"
  ON user_wallets FOR SELECT
  USING (user_id = get_current_user_id());
```

**2. Admins can manage workspace data:**

```sql
CREATE POLICY "Admins manage gating rules"
  ON workspace_gating_rules FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_admins
      WHERE wallet_address IN (
        SELECT wallet_address FROM user_wallets
        WHERE user_id = get_current_user_id()
      )
    )
  );
```

**3. No client access (server only):**

```sql
-- By not creating any policies, authenticated users are denied
-- Only service_role (Edge Functions) can access
ALTER TABLE sensitive_data ENABLE ROW LEVEL SECURITY;
-- No policies = no access for regular users
```

### RLS Gotcha: NULL Returns

When RLS blocks access, queries return `NULL` or empty results, not errors:

```javascript
// User tries to access workspace they don't own
const { data } = await supabase.from('workspaces').select('*').eq('id', 'someone-elses-workspace');

// data is null or [] - not an error!
// Your code must handle this
if (!data) {
  throw new Error('Workspace not found or access denied');
}
```

---

## 6. Caching Safely

NFT checks are slow and cost money (API calls). Caching speeds things up, but introduces security risks.

### Why Cache?

Without caching:

- User visits workspace → API call
- User refreshes page → Another API call
- User navigates → More API calls
- 100 users × 10 page views = 1000 API calls per hour

With caching:

- User visits workspace → API call → Cache result
- Next 10 visits → Use cached result
- 100 users = 100 API calls per hour (10x reduction)

### Cache Risks

**1. Stale Data**
User sells their NFT, but cache says they still have it.

_Solution:_ Short TTL (time to live). We use 1 hour.

```javascript
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const expiresAt = new Date(Date.now() + CACHE_TTL);
```

**2. Cache Poisoning**
Attacker tricks the system into caching false data.

_Solution:_ Validate before caching.

```javascript
// DANGEROUS: Cache any wallet
await cacheResult(userId, walletAddress, hasNFT);

// SAFE: Verify wallet belongs to user first
const userWallets = await getUserWallets(userId);
if (!userWallets.includes(walletAddress)) {
  console.warn('Attempted cache poisoning');
  return;
}
await cacheResult(userId, walletAddress, hasNFT);
```

**3. Cache Invalidation**
User removes a wallet, but cache still references it.

_Solution:_ Trigger to clear cache when wallets change.

```sql
CREATE FUNCTION invalidate_cache_on_wallet_removal()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM access_cache
  WHERE wallet_address = OLD.wallet_address
    AND user_id = OLD.user_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invalidate_cache
  AFTER DELETE ON user_wallets
  EXECUTE FUNCTION invalidate_cache_on_wallet_removal();
```

### Our Caching Strategy

```
1. User requests access
2. Check cache for valid (non-expired) entry
3. If cached: Return immediately
4. If not cached: Call Vybe API
5. Verify wallet ownership
6. Store result with 1-hour TTL
7. Return result
```

---

## 7. Input Validation

Never assume input is valid. Always validate.

### Validate Wallet Addresses

```javascript
// BAD: Trust user input
const wallet = req.body.wallet_address;
await checkNFT(wallet, collection);

// GOOD: Validate first
function isValidSolanaAddress(address) {
  if (!address || typeof address !== 'string') return false;
  if (address.length < 32 || address.length > 44) return false;
  if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(address)) return false;

  try {
    new PublicKey(address); // Actually parse it
    return true;
  } catch {
    return false;
  }
}

const wallet = req.body.wallet_address;
if (!isValidSolanaAddress(wallet)) {
  return errorResponse(400, 'Invalid wallet address');
}
```

### Why the Regex?

Solana uses Base58 encoding, which excludes confusing characters:

- No `0` (zero) - looks like `O`
- No `O` (letter O) - looks like `0`
- No `I` (letter I) - looks like `l`
- No `l` (letter l) - looks like `1`

### Validate on Both Sides

```
Client-side validation → Better user experience
Server-side validation → Actual security

You need BOTH.
```

Client validation gives instant feedback ("Invalid address format").
Server validation catches attackers who bypass the client.

---

## 8. Rate Limiting

Without rate limiting, attackers can:

- Drain your API budget
- Overload your servers
- Enumerate all wallets in your database
- Brute force access

### Simple In-Memory Rate Limiting

```javascript
const rateLimits = new Map();

function checkRateLimit(identifier, maxRequests = 100, windowMs = 60000) {
  const now = Date.now();
  const record = rateLimits.get(identifier);

  if (!record || now > record.resetAt) {
    rateLimits.set(identifier, { count: 1, resetAt: now + windowMs });
    return true; // Allowed
  }

  if (record.count >= maxRequests) {
    return false; // Blocked
  }

  record.count++;
  return true; // Allowed
}

// In your Edge Function
const userIp = req.headers.get('x-forwarded-for');
if (!checkRateLimit(userIp)) {
  return new Response('Rate limit exceeded', { status: 429 });
}
```

### Rate Limit by What?

| Identifier     | Use Case                   |
| -------------- | -------------------------- |
| IP Address     | Unauthenticated endpoints  |
| User ID        | Authenticated endpoints    |
| Wallet Address | Wallet-specific operations |

### Our Rate Limits

| Endpoint                | Limit        | Window     |
| ----------------------- | ------------ | ---------- |
| check-wallet            | 30 requests  | 1 minute   |
| verify-nft-ownership    | 50 requests  | 15 minutes |
| verify-workspace-access | 100 requests | 15 minutes |

---

## 9. CORS: Who Can Call Your APIs

CORS (Cross-Origin Resource Sharing) controls which websites can call your APIs from the browser.

### The Problem with Wildcard CORS

```javascript
// DANGEROUS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*' // Any website can call this!
};
```

With `*`, any website can embed your API calls. Attackers can:

- Create phishing sites that use your auth
- Drain your API quota from their domain
- Harvest data about your users

### The Solution: Whitelist Origins

```javascript
const ALLOWED_ORIGINS = [
  'https://yourapp.com',
  'https://staging.yourapp.com',
  'http://localhost:5173' // Development
];

function getCorsHeaders(request) {
  const origin = request.headers.get('origin');
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
}
```

### Don't Forget OPTIONS

Browsers send a "preflight" OPTIONS request before the actual request. Handle it:

```javascript
if (req.method === 'OPTIONS') {
  return new Response('ok', { headers: corsHeaders });
}
```

---

## 10. Security Headers

HTTP headers tell browsers how to handle your content securely.

### Content Security Policy (CSP)

Prevents XSS attacks by controlling what can run on your page.

```javascript
response.headers.set(
  'Content-Security-Policy',
  [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "connect-src 'self' https://*.supabase.co https://api.vybenetwork.xyz",
    "frame-ancestors 'none'"
  ].join('; ')
);
```

### Other Important Headers

```javascript
// Prevent clickjacking
headers.set('X-Frame-Options', 'DENY');

// Prevent MIME sniffing
headers.set('X-Content-Type-Options', 'nosniff');

// Control referrer info
headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
```

### In SvelteKit

```javascript
// src/hooks.server.ts
export const handle = async ({ event, resolve }) => {
  const response = await resolve(event);

  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  // ... more headers

  return response;
};
```

---

## 11. Signature Verification

When users link wallets, they sign a message to prove ownership. Here's how to verify it securely.

### The Flow

```
1. App generates a message: "Link wallet ABC123 to account"
2. User signs with their private key
3. App verifies signature matches the wallet's public key
4. If valid, wallet is linked
```

### Verification Code

```javascript
import nacl from 'tweetnacl';

function verifySignature(message, signature, publicKey) {
  return nacl.sign.detached.verify(new TextEncoder().encode(message), signature, publicKey);
}
```

### Preventing Replay Attacks

Without protection, an attacker could capture a signature and replay it later.

**Solution: Use nonces (one-time codes)**

```javascript
// 1. Generate unique nonce
const nonce = crypto.randomUUID();
const message = `Link wallet ${address}\nNonce: ${nonce}`;

// 2. Store nonce in database with expiry
await db.insert({
  nonce,
  userId,
  expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
});

// 3. After signature verified, check nonce
const nonceRecord = await db.find({ nonce, userId });
if (!nonceRecord || nonceRecord.expiresAt < Date.now()) {
  throw new Error('Invalid or expired nonce');
}

// 4. Delete nonce (can't be reused)
await db.delete({ nonce });
```

---

## 12. Common Pitfalls

### Pitfall 1: Owners/Admins Bypass NFT Check

**Wrong:** "They're the owner, so they always have access."

**Right:** Owners must also hold the NFT. If they sell it, they lose access.

```javascript
// WRONG
if (isOwner(user)) {
  grantAccess(); // Even if they sold the NFT!
}

// RIGHT
if (hasNFT(user)) {
  const role = isOwner(user) ? 'owner' : 'member';
  grantAccess(role);
}
// No NFT = no access, even for owners
```

### Pitfall 2: Race Conditions

**Problem:** Two requests arrive simultaneously, both think they're creating the "first" wallet.

**Solution:** Database constraints and transactions.

```sql
-- Only one primary wallet per user
CREATE TRIGGER enforce_single_primary
  BEFORE INSERT OR UPDATE ON user_wallets
  FOR EACH ROW
  WHEN (NEW.is_primary = TRUE)
  EXECUTE FUNCTION unset_other_primaries();
```

### Pitfall 3: Information Leakage

**Wrong:** Detailed error messages.

```javascript
// DANGEROUS
return { error: `User ${userId} not found in table users` };
// Reveals database structure!
```

**Right:** Generic messages.

```javascript
// SAFE
return { error: 'Authentication failed' };
// Log details server-side, return generic message
```

### Pitfall 4: Forgetting Cleanup

Caches grow forever without cleanup. Schedule regular cleanups:

```sql
-- Delete expired entries daily
CREATE FUNCTION cleanup_expired()
RETURNS void AS $$
  DELETE FROM access_cache WHERE expires_at < NOW();
  DELETE FROM nonces WHERE expires_at < NOW();
$$ LANGUAGE sql;

-- Schedule with pg_cron
SELECT cron.schedule('cleanup', '0 0 * * *', 'SELECT cleanup_expired()');
```

---

## Security Checklist

Before launching your token-gated app, verify:

### Authentication

- [ ] Wallet signatures verified server-side
- [ ] JWT tokens validated on every request
- [ ] Nonces prevent signature replay

### Authorization

- [ ] NFT ownership checked server-side
- [ ] All user wallets checked (not just the sign-in wallet)
- [ ] Roles enforced (owner/admin/member)
- [ ] Owners/admins still need NFT

### API Security

- [ ] CORS restricted to your domains
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] Proper HTTP status codes

### Database Security

- [ ] RLS enabled on all tables
- [ ] Policies for each table/operation
- [ ] Immutable fields protected by triggers
- [ ] Cache entries validated before storage

### General

- [ ] Security headers configured
- [ ] Secrets in environment variables
- [ ] Error messages don't leak info
- [ ] Cleanup jobs for expired data

---

## Conclusion

Building a secure token-gated application requires thinking about security at every layer:

1. **Client:** Validate input, but never trust it
2. **Transport:** Use HTTPS, set CORS properly
3. **Server:** Verify everything, rate limit, use proper status codes
4. **Database:** RLS policies, constraints, triggers

The most important principle: **Never trust the client.** Always verify on the server.

Security isn't a feature you add at the end—it's a mindset you apply from the start. Every function you write, ask yourself: "How could this be abused?"

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Solana Security Best Practices](https://docs.solana.com/developing/programming-model/security)
- [Web3 Security Checklist](https://github.com/Quillhash/Web3-Security-Checklist)

---

_This guide was written based on real security issues identified and fixed in the TreehouseHQ codebase. All code examples are simplified for clarity—always adapt to your specific needs._
