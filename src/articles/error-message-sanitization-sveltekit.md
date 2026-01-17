---
title: "Stop Leaking Secrets: A Complete Guide to Error Message Sanitization in SvelteKit"
description: "Learn how to prevent error message leakage in your SvelteKit API with a centralized sanitization utility that keeps attackers in the dark while maintaining developer experience."
tags: ["sveltekit", "security", "typescript", "api"]
pubDate: "2025-01-16T12:00:00Z"
---

# Stop Leaking Secrets: A Complete Guide to Error Message Sanitization in SvelteKit

_How we eliminated 44 security vulnerabilities across our API with a single utility function._

---

## The Problem: Your Errors Are Telling Strangers Your Secrets

Here's a pattern I see in almost every codebase I audit:

```typescript
} catch (err) {
  const message = err instanceof Error ? err.message : "Something went wrong";
  return json({ error: { message } }, { status: 500 });
}
```

Looks reasonable, right? You're being a good developer by providing helpful error messages to your users. But here's what you're actually doing: **handing attackers a map of your system's internals**.

### What Attackers Learn From Your Errors

When your database connection fails:

```
"Connection refused to postgres://admin:password@db.internal:5432/production"
```

When your API key is invalid:

```
"Authentication failed for API key sk_live_abc123... Invalid signature"
```

When a SQL query fails:

```
"syntax error at or near 'SELECT' - query: SELECT * FROM users WHERE id = '1; DROP TABLE users;--'"
```

Each of these error messages tells an attacker:

- What database you're using (and sometimes credentials)
- Your API key prefixes and structure
- Your table names and query patterns
- Whether their injection attempt was parsed

This is called **error message leakage**, and it's one of the easiest security vulnerabilities to introduce—and one of the most dangerous to ignore.

---

## The Solution: A Centralized Error Sanitization Layer

Instead of sanitizing errors ad-hoc in every catch block, we built a single utility that:

1. **Recognizes known error patterns** and returns safe, user-friendly messages
2. **Logs actual errors** only in development for debugging
3. **Returns generic messages** for unknown errors in production
4. **Maintains consistent response structure** across all endpoints

Here's the complete implementation:

```typescript
// src/lib/server/errors.ts

import { json } from "@sveltejs/kit";
import { dev } from "$app/environment";

/**
 * Known error patterns that are safe to expose to clients.
 * Each pattern maps a substring match to a safe error code and message.
 */
const KNOWN_ERROR_PATTERNS: Array<{
  pattern: string;
  code: string;
  message: string;
  status: number;
}> = [
  // Authentication errors
  {
    pattern: "Invalid signature",
    code: "INVALID_SIGNATURE",
    message: "Invalid signature",
    status: 400,
  },
  {
    pattern: "Session expired",
    code: "SESSION_EXPIRED",
    message: "Session expired",
    status: 401,
  },
  {
    pattern: "Invalid CSRF token",
    code: "CSRF_INVALID",
    message: "Invalid CSRF token",
    status: 403,
  },

  // Rate limiting
  {
    pattern: "RATE_LIMIT_EXCEEDED",
    code: "RATE_LIMITED",
    message: "Too many attempts, please try again later",
    status: 429,
  },

  // Resource errors
  {
    pattern: "NOT_FOUND",
    code: "NOT_FOUND",
    message: "Resource not found",
    status: 404,
  },
  {
    pattern: "not found",
    code: "NOT_FOUND",
    message: "Resource not found",
    status: 404,
  },

  // Add your application-specific patterns here...
];

/**
 * Result of sanitizing an error.
 */
export interface SanitizedError {
  code: string;
  message: string;
  status: number;
}

/**
 * Sanitize an error for client response.
 */
export function sanitizeError(
  err: unknown,
  defaultCode: string = "INTERNAL_ERROR",
  defaultMessage: string = "An unexpected error occurred",
  defaultStatus: number = 500
): SanitizedError {
  const errorMessage = err instanceof Error ? err.message : String(err);

  // Log actual error in development only
  if (dev) {
    console.error("[API Error]", errorMessage);
  }

  // Check against known patterns
  for (const { pattern, code, message, status } of KNOWN_ERROR_PATTERNS) {
    if (errorMessage.includes(pattern)) {
      return { code, message, status };
    }
  }

  // Unknown error - return generic message
  return {
    code: defaultCode,
    message: defaultMessage,
    status: defaultStatus,
  };
}

/**
 * Create a JSON error response with sanitized error message.
 */
export function errorResponse(
  err: unknown,
  defaultCode: string = "INTERNAL_ERROR",
  defaultMessage: string = "An unexpected error occurred",
  defaultStatus: number = 500
) {
  const { code, message, status } = sanitizeError(
    err,
    defaultCode,
    defaultMessage,
    defaultStatus
  );
  return json({ data: null, error: { code, message } }, { status });
}
```

---

## How It Works: Breaking Down the Implementation

### 1. The Pattern Registry

The heart of the system is `KNOWN_ERROR_PATTERNS`—a registry of error patterns you explicitly choose to expose:

```typescript
const KNOWN_ERROR_PATTERNS: Array<{
  pattern: string; // Substring to match in error message
  code: string; // Machine-readable code for clients
  message: string; // Human-readable message (safe to show)
  status: number; // HTTP status code
}> = [
  // ...patterns
];
```

**Why substring matching?** Error messages from databases, ORMs, and third-party services often include variable content (timestamps, IDs, stack traces). Substring matching lets you capture the semantic meaning without exact string matching.

```typescript
// This error message:
"User with id 'abc123' not found in database at 2024-01-15T10:30:00Z"

// Matches this pattern:
{ pattern: "not found", code: "NOT_FOUND", ... }
```

### 2. The Sanitization Function

`sanitizeError` does three things:

```typescript
export function sanitizeError(err: unknown, ...): SanitizedError {
  // 1. Extract the error message safely
  const errorMessage = err instanceof Error ? err.message : String(err);

  // 2. Log in development only
  if (dev) {
    console.error("[API Error]", errorMessage);
  }

  // 3. Match patterns or return generic message
  for (const { pattern, code, message, status } of KNOWN_ERROR_PATTERNS) {
    if (errorMessage.includes(pattern)) {
      return { code, message, status };
    }
  }

  return { code: defaultCode, message: defaultMessage, status: defaultStatus };
}
```

**Key insight:** The `dev` flag from `$app/environment` is determined at build time. In production builds, the logging code is completely eliminated—not just skipped, but removed from the bundle entirely.

### 3. The Response Helper

`errorResponse` is a convenience wrapper that returns a SvelteKit `Response`:

```typescript
export function errorResponse(err: unknown, ...): Response {
  const { code, message, status } = sanitizeError(...);
  return json({ data: null, error: { code, message } }, { status });
}
```

This enforces a consistent response structure across your API:

```typescript
// Success
{ data: T, error: null }

// Error
{ data: null, error: { code: string, message: string } }
```

---

## Before and After: Real-World Transformation

### Before: The Vulnerable Approach

Here's what a typical endpoint looked like before sanitization:

```typescript
// src/routes/api/wallets/+server.ts

export const POST: RequestHandler = async ({ request, cookies }) => {
  const sessionId = cookies.get("session");

  if (!sessionId) {
    return json(
      {
        data: null,
        error: { code: "UNAUTHORIZED", message: "Not authenticated" },
      },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const session = await validateSession(sessionId);

    if (!session.valid || !session.user) {
      return json(
        {
          data: null,
          error: { code: "UNAUTHORIZED", message: "Session invalid" },
        },
        { status: 401 }
      );
    }

    const result = await linkWallet(session.user.id, body.walletAddress);
    return json({ data: result, error: null });
  } catch (err) {
    // VULNERABLE: Leaks internal error details!
    const message =
      err instanceof Error ? err.message : "Failed to link wallet";

    // Attempt to handle known errors (but inconsistently)
    if (message.includes("WALLET_ALREADY_LINKED")) {
      return json(
        {
          data: null,
          error: { code: "DUPLICATE_WALLET", message: "Wallet already linked" },
        },
        { status: 400 }
      );
    }
    if (message.includes("WALLET_IN_USE")) {
      return json(
        {
          data: null,
          error: {
            code: "WALLET_IN_USE",
            message: "Wallet belongs to another user",
          },
        },
        { status: 400 }
      );
    }

    // DANGER: Unknown errors expose raw message!
    return json(
      { data: null, error: { code: "LINK_ERROR", message } }, // <-- Leak!
      { status: 500 }
    );
  }
};
```

**Problems:**

1. Error messages leak to clients in the fallback case
2. Each endpoint duplicates the pattern-matching logic
3. Inconsistent error codes and messages across endpoints
4. Easy to forget handling new error cases
5. No logging in development for debugging

### After: The Secure Approach

```typescript
// src/routes/api/wallets/+server.ts

import { errorResponse } from "$lib/server/errors";

export const POST: RequestHandler = async ({ request, cookies }) => {
  const sessionId = cookies.get("session");

  if (!sessionId) {
    return json(
      {
        data: null,
        error: { code: "UNAUTHORIZED", message: "Not authenticated" },
      },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const session = await validateSession(sessionId);

    if (!session.valid || !session.user) {
      return json(
        {
          data: null,
          error: { code: "UNAUTHORIZED", message: "Session invalid" },
        },
        { status: 401 }
      );
    }

    const result = await linkWallet(session.user.id, body.walletAddress);
    return json({ data: result, error: null });
  } catch (err) {
    // SECURE: One line handles everything
    return errorResponse(err, "LINK_ERROR", "Failed to link wallet");
  }
};
```

**Benefits:**

1. Unknown errors return generic message, never raw error
2. Known patterns handled centrally—add once, works everywhere
3. Consistent codes and messages across all endpoints
4. Automatic development logging for debugging
5. Less code = fewer bugs

---

## Design Decisions and Trade-offs

### Why Pattern Matching Instead of Error Codes?

You might think: "Why not throw typed errors with codes and match on those?"

```typescript
// Alternative approach
class WalletAlreadyLinkedError extends Error {
  code = "WALLET_ALREADY_LINKED";
}

// In catch block
if (err instanceof WalletAlreadyLinkedError) { ... }
```

This works for errors you control, but fails for:

1. **Database errors** - PostgreSQL doesn't throw your custom classes
2. **Third-party APIs** - External services return their own error formats
3. **ORM errors** - Prisma, Drizzle, etc. have their own error types
4. **Nested errors** - Errors wrapped by middleware or utility functions

Pattern matching handles all these cases because it operates on the error _message_, not the error _type_.

### Why Not Use a Whitelist Instead?

Some frameworks use a whitelist approach: only explicitly-approved messages pass through, everything else is blocked.

```typescript
// Whitelist approach
const SAFE_MESSAGES = new Set([
  "Invalid signature",
  "Session expired",
  // ...
]);

if (SAFE_MESSAGES.has(errorMessage)) {
  return { message: errorMessage }; // Pass through as-is
}
return { message: "An error occurred" }; // Block everything else
```

The problem: error messages often contain variable parts that make exact matching impossible. You'd need to either:

- Normalize messages before checking (complex, error-prone)
- Create regex patterns (we're back to pattern matching)
- Lose useful information in safe messages

Our approach lets you **transform** error messages, not just filter them:

```typescript
// Error from database: "User with id 'abc123' not found"
// Becomes: "Resource not found"

// Error from API: "RATE_LIMIT_EXCEEDED: 5 requests per minute"
// Becomes: "Too many attempts, please try again later"
```

### Handling Priority and Overlapping Patterns

Patterns are checked in order. More specific patterns should come before general ones:

```typescript
const KNOWN_ERROR_PATTERNS = [
  // Specific first
  { pattern: "Wallet not found", code: "WALLET_NOT_FOUND", ... },

  // General last
  { pattern: "not found", code: "NOT_FOUND", ... },
];
```

If "Wallet not found" comes after "not found", every wallet error would match the generic pattern first.

---

## Extending the Pattern: Application-Specific Errors

Here's how we extended the base patterns for our Web3 authentication platform:

```typescript
const KNOWN_ERROR_PATTERNS = [
  // ... base patterns ...

  // Wallet-specific errors
  {
    pattern: "WALLET_ALREADY_LINKED",
    code: "WALLET_ALREADY_LINKED",
    message: "This wallet is already linked to your account",
    status: 400,
  },
  {
    pattern: "WALLET_IN_USE",
    code: "WALLET_IN_USE",
    message: "This wallet is linked to another account",
    status: 400,
  },
  {
    pattern: "WALLET_LIMIT_REACHED",
    code: "WALLET_LIMIT_REACHED",
    message: "Maximum wallet limit reached",
    status: 400,
  },

  // NFT verification errors
  {
    pattern: "do not own",
    code: "NOT_OWNER",
    message: "You do not own this NFT",
    status: 403,
  },

  // OAuth errors (following RFC 6749)
  {
    pattern: "invalid_request",
    code: "INVALID_REQUEST",
    message: "Invalid OAuth request",
    status: 400,
  },
  {
    pattern: "invalid_client",
    code: "INVALID_CLIENT",
    message: "Invalid client credentials",
    status: 401,
  },
];
```

---

## Integration Checklist

Ready to implement this in your project? Here's a checklist:

### 1. Create the utility file

```
src/lib/server/errors.ts
```

### 2. Audit existing catch blocks

Find all instances of error message leakage:

```bash
# Find potential leaks
grep -r "err instanceof Error ? err.message" src/routes/api/
grep -r "err.message" src/routes/api/
grep -r "error: { message" src/routes/api/
```

### 3. Build your pattern registry

Start with common patterns:

- Authentication (invalid token, expired session)
- Authorization (forbidden, not owner)
- Validation (invalid input, missing field)
- Rate limiting
- Resource not found

Add application-specific patterns as you discover them.

### 4. Replace catch blocks

```typescript
// Before
} catch (err) {
  const message = err instanceof Error ? err.message : "Operation failed";
  return json({ error: { message } }, { status: 500 });
}

// After
} catch (err) {
  return errorResponse(err, "OPERATION_ERROR", "Operation failed");
}
```

### 5. Test in development

Verify that:

- Known errors show correct messages
- Unknown errors show generic message
- Actual errors are logged to console
- HTTP status codes are correct

### 6. Test in production

Deploy and verify that:

- No internal error details leak in responses
- Error logging is disabled (or sent to proper monitoring)
- Clients receive consistent error format

---

## Advanced: Production Monitoring

In production, you'll want errors logged somewhere useful—just not to clients. Here's how to extend the pattern:

```typescript
import { json } from "@sveltejs/kit";
import { dev } from "$app/environment";

// Your monitoring service
import { captureException } from "@sentry/sveltekit";

export function sanitizeError(
  err: unknown,
  defaultCode: string = "INTERNAL_ERROR",
  defaultMessage: string = "An unexpected error occurred",
  defaultStatus: number = 500
): SanitizedError {
  const errorMessage = err instanceof Error ? err.message : String(err);

  // Development: console logging
  if (dev) {
    console.error("[API Error]", errorMessage);
  } else {
    // Production: send to monitoring (but NOT to client)
    captureException(err, {
      extra: { defaultCode, defaultMessage },
    });
  }

  // ... rest of sanitization
}
```

This gives you full error visibility in your monitoring dashboard while keeping clients in the dark about internals.

---

## Conclusion

Error message leakage is a security vulnerability hiding in plain sight. The fix isn't complicated—it just requires discipline:

1. **Never pass raw error messages to clients**
2. **Centralize error handling** in a single utility
3. **Whitelist safe patterns** instead of trying to blacklist dangerous ones
4. **Log actual errors** only in development or to secure monitoring

The `errorResponse` pattern we've built handles all of this in a single function call. No more scattered if-else chains, no more inconsistent error codes, and no more accidentally leaking your database schema to attackers.

The next time you write a catch block, remember: that helpful error message might be helping someone you didn't intend.

---

## Resources

- [OWASP Error Handling Guidelines](https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html)
- [SvelteKit Error Handling Docs](https://kit.svelte.dev/docs/errors)
- [CWE-209: Information Exposure Through Error Messages](https://cwe.mitre.org/data/definitions/209.html)
