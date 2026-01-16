---
title: "Testing Svelte 5 Apps: A Practical Guide to Code Structure"
description: "How to structure your Svelte code so it's actually testable, with real examples from building a wallet auth system."
tags: ["svelte", "testing", "vitest", "javascript", "architecture"]
pubDate: "2026-01-15T23:00:00Z"
---

## Testing Svelte 5 Apps: A Practical Guide to Code Structure

How to structure your Svelte code so it's actually testable, with real examples from building a wallet auth system.

---

## The Problem

You've built a feature in Svelte 5. It works great. Now you want to test it.

You write a test, and immediately hit problems:

- Your functions have side effects mixed with business logic
- Mocking is painful because everything is tangled together
- State management is tangled with API calls

This is what we had:

```ts
// auth.svelte.ts - everything in one file
let user = $state<User | null>(null);  // Svelte rune
let wallets = $state<UserWallet[]>([]);

export async function signIn() {
  // Business logic
  if (!provider) {
    authError = 'No wallet detected';
    return;
  }

  // API call
  const result = await supabase.auth.signInWithWeb3({...});

  // More business logic
  if (existingWallet && !existingWallet.is_primary) {
    const truncated = `${address.slice(0,4)}...${address.slice(-4)}`;
    // ...
  }

  // State mutation
  user = result.data.user;
}
```

Testing this is hard because:

1. `supabase` calls require complex mocking
2. Business logic (address truncation, validation) is buried in the middle
3. State mutations are mixed with async operations

---

## The Solution: Separation of Concerns

Split your code into layers, each with a single responsibility:

```
src/lib/auth/
├── logic.ts         # Pure functions (100% testable)
├── api.ts           # Database calls (mock in tests)
├── state.svelte.ts  # Reactive state (test via E2E)
└── index.ts         # Combines everything
```

### Layer 1: Pure Logic (`logic.ts`)

Pure functions have:

- **No side effects** - they don't change anything outside themselves
- **No dependencies** - no imports from Supabase, Svelte, etc.
- **Predictable output** - same input always gives same output

```ts
// logic.ts - pure functions, no imports except maybe utilities

/**
 * Truncates a wallet address for display.
 */
export function truncateAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

/**
 * Checks if a wallet can be removed (not primary).
 */
export function canRemoveWallet(wallet: { is_primary: boolean }): boolean {
  return !wallet.is_primary;
}

/**
 * Extracts signature bytes from different wallet formats.
 * Phantom returns Uint8Array, Solflare returns { signature: Uint8Array }
 */
export function extractSignatureBytes(result: unknown): Uint8Array | null {
  if (result instanceof Uint8Array) return result;
  if (result && typeof result === 'object' && 'signature' in result) {
    return new Uint8Array((result as { signature: Uint8Array }).signature);
  }
  return null;
}
```

**Testing pure functions is trivial:**

```ts
// logic.test.ts
import { truncateAddress, canRemoveWallet } from '$lib/auth/logic';

describe('truncateAddress', () => {
  it('truncates long addresses', () => {
    expect(truncateAddress('ABC123456789XYZ')).toBe('ABC1...9XYZ');
  });
});

describe('canRemoveWallet', () => {
  it('returns true for non-primary wallet', () => {
    expect(canRemoveWallet({ is_primary: false })).toBe(true);
  });

  it('returns false for primary wallet', () => {
    expect(canRemoveWallet({ is_primary: true })).toBe(false);
  });
});
```

No mocking. No setup. Just input → output.

### Layer 2: API Wrapper (`api.ts`)

Wrap all external calls (database, auth service) in simple functions:

```ts
// api.ts - thin wrappers around Supabase

import { supabase } from '$lib/supabase';

export async function getWalletByAddress(address: string) {
  const { data } = await supabase
    .from('user_wallets')
    .select('id, user_id, is_primary')
    .eq('wallet_address', address)
    .maybeSingle();
  return data;
}

export async function signOut() {
  return supabase.auth.signOut();
}
```

**Why this helps:**

- Each function does ONE thing
- Easy to mock in tests (just mock the import)
- If you switch from Supabase to something else, only this file changes

### Layer 3: Reactive State (`state.svelte.ts`)

Keep all Svelte runes in one place:

```ts
// state.svelte.ts - ONLY reactive state, no logic

import type { User } from '@supabase/supabase-js';

let user = $state<User | null>(null);
let loading = $state(false);
let error = $state('');

// Setters for the actions to use
export function setUser(newUser: User | null) {
  user = newUser;
}

export function setError(msg: string) {
  error = msg;
}

// Reactive object for components
export const auth = {
  get user() {
    return user;
  },
  get loading() {
    return loading;
  },
  get error() {
    return error;
  }
};
```

**Why separate this?**

- Clean separation of concerns
- Can test with real runes using `.svelte.test.ts` files (see below)
- State logic is simple and focused

### Layer 4: Orchestration (`index.ts`)

Combines everything into the public API:

```ts
// index.ts - wires logic, api, and state together

import * as api from './api';
import * as logic from './logic';
import { setUser, setError, getUser } from './state.svelte';

export async function signIn() {
  // Get wallet
  const provider = getWalletProvider();
  if (!provider) {
    setError(logic.ErrorMessages.NO_WALLET);
    return;
  }

  // Connect & authenticate
  await provider.connect();
  const result = await api.signInWithWallet(provider);

  // Check if wallet belongs to a different account
  const existing = await api.getWalletByAddress(address);
  if (existing) {
    const owner = await api.getPublicUserById(existing.user_id);
    if (!owner || owner.auth_id !== result.data.user.id) {
      // Wallet belongs to different user - block sign-in
      const primary = await api.getPrimaryWalletForUser(existing.user_id);
      setError(logic.createBlockedSignInError(primary?.wallet_address));
      return;
    }
  }

  setUser(result.data.user);
}
```

---

## Testing Strategy

Different layers need different testing approaches:

| Layer             | Test Type         | Coverage Goal                    |
| ----------------- | ----------------- | -------------------------------- |
| `logic.ts`        | Unit tests        | 100%                             |
| `api.ts`          | Integration tests | Mock Supabase, verify calls      |
| `state.svelte.ts` | Unit tests        | Use `.svelte.test.ts` with runes |
| `index.ts`        | Integration tests | Test key flows                   |

### Unit Testing Pure Logic

The easiest tests. No mocking needed:

```ts
// tests/unit/logic.test.ts
import { describe, it, expect } from 'vitest';
import { truncateAddress, canRemoveWallet, isDuplicateKeyError } from '$lib/auth/logic';

describe('truncateAddress', () => {
  it('truncates long addresses', () => {
    expect(truncateAddress('ABC123456789XYZ')).toBe('ABC1...9XYZ');
  });

  it('returns original if too short', () => {
    expect(truncateAddress('SHORT')).toBe('SHORT');
  });
});

describe('isDuplicateKeyError', () => {
  it('returns true for PostgreSQL unique violation', () => {
    expect(isDuplicateKeyError({ code: '23505' })).toBe(true);
  });

  it('returns false for other errors', () => {
    expect(isDuplicateKeyError({ code: '12345' })).toBe(false);
    expect(isDuplicateKeyError(null)).toBe(false);
  });
});
```

### Integration Testing with Mocks

For testing flows that use the API:

```ts
// tests/unit/auth.test.ts
import { vi, describe, it, expect } from 'vitest';

// Mock the API layer
vi.mock('$lib/auth/api', () => ({
  getWalletByAddress: vi.fn(),
  signInWithWallet: vi.fn(),
  getPrimaryWalletForUser: vi.fn()
}));

// Mock the wallet providers
vi.mock('$lib/wallets', () => ({
  getAvailableWallets: vi.fn(() => [])
}));

describe('signIn', () => {
  it('returns error when no wallet detected', async () => {
    const { signIn } = await import('$lib/auth');
    const result = await signIn();

    expect(result).toBe('No Solana wallet detected. Install Phantom or Solflare.');
  });
});
```

---

## Mocking Supabase: A Beginner's Guide

### What is Mocking?

When you test your code, you don't want to hit a real database. That would be:

- **Slow** - network calls add seconds to each test
- **Unreliable** - what if the database is down?
- **Dangerous** - tests might modify real data
- **Hard to control** - how do you test "database returns an error"?

**Mocking** means replacing real dependencies with fake ones that you control. Instead of calling the real Supabase, your tests call a fake version that returns exactly what you tell it to.

Think of it like a movie stunt double - same interface, but you control what happens.

### The Supabase Client Structure

Before we mock Supabase, let's understand what we're mocking. The Supabase client has this structure:

```ts
supabase.auth.signInWithWeb3()     // Authentication
supabase.auth.getSession()          // Get current session
supabase.auth.signOut()             // Sign out

supabase.from('users')              // Query builder for 'users' table
  .select('*')                      // Select columns
  .eq('id', '123')                  // WHERE id = '123'
  .single()                         // Return one row

supabase.functions.invoke('check-wallet', { body: {...} })  // Edge Functions
```

We need to mock all of these.

### Step 1: Mock the Auth Module

The auth methods are simple - they're just functions that return promises:

```ts
// Create mock functions for each auth method
const mockSupabaseAuth = {
  getSession: vi.fn(),
  signInWithWeb3: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChange: vi.fn(() => ({
    data: { subscription: { unsubscribe: vi.fn() } }
  }))
};
```

`vi.fn()` creates a "spy" function that:

- Records every call made to it
- Can be configured to return specific values
- Can be checked in assertions (`expect(mockFn).toHaveBeenCalled()`)

### Step 2: Mock the Query Builder (The Tricky Part)

Supabase queries use **method chaining**:

```ts
supabase.from('users').select('*').eq('id', '123').single();
```

Each method returns an object with more methods. To mock this, we need a "chainable" object where every method returns `this`:

```ts
// Store results we want to return, keyed by table name
const mockQueryResults: Record<string, unknown> = {};

// Create a chainable mock for a specific table
const createChainable = (table: string) => {
  const chainable: Record<string, ReturnType<typeof vi.fn>> = {};

  // Each method returns the chainable object (for chaining)
  chainable.select = vi.fn().mockReturnValue(chainable);
  chainable.insert = vi.fn().mockReturnValue(chainable);
  chainable.update = vi.fn().mockReturnValue(chainable);
  chainable.delete = vi.fn().mockReturnValue(chainable);
  chainable.eq = vi.fn().mockReturnValue(chainable);
  chainable.order = vi.fn().mockReturnValue(chainable);

  // Terminal methods return promises with our configured results
  chainable.single = vi.fn().mockImplementation(() => {
    const key = `${table}:single`;
    return Promise.resolve(mockQueryResults[key] || { data: null, error: null });
  });

  chainable.maybeSingle = vi.fn().mockImplementation(() => {
    const key = `${table}:maybeSingle`;
    return Promise.resolve(mockQueryResults[key] || { data: null, error: null });
  });

  return chainable;
};

// Mock supabase.from() to return a chainable for any table
const mockSupabaseFrom = vi.fn((table: string) => createChainable(table));
```

Now in tests, you can configure what each query returns:

```ts
// Configure: "SELECT * FROM users WHERE ... .single()" returns this user
mockQueryResults['users:single'] = {
  data: { id: 'user-123', auth_id: 'auth-456' },
  error: null
};

// Configure: "SELECT * FROM user_wallets WHERE ... .maybeSingle()" returns null
mockQueryResults['user_wallets:maybeSingle'] = {
  data: null,
  error: null
};
```

### Step 3: Mock Edge Functions

Edge Functions are simpler - just one method:

```ts
const mockFunctionsInvoke = vi.fn().mockResolvedValue({
  data: { available: true },
  error: null
});
```

### Step 4: Wire It All Together

Use `vi.mock()` to replace the real Supabase import with your mocks:

```ts
vi.mock('$lib/supabase', () => ({
  supabase: {
    auth: mockSupabaseAuth,
    from: mockSupabaseFrom,
    functions: {
      invoke: mockFunctionsInvoke
    }
  }
}));
```

When your code does `import { supabase } from '$lib/supabase'`, it gets your mock instead of the real client.

### Step 5: Reset Between Tests

**Critical**: Mocks remember state between tests. Always reset them:

```ts
beforeEach(() => {
  // Clear all mock call history
  vi.clearAllMocks();

  // Reset query results to defaults
  Object.keys(mockQueryResults).forEach((key) => delete mockQueryResults[key]);

  // Reset the chainable factory (important!)
  mockSupabaseFrom.mockImplementation((table: string) => createChainable(table));

  // Reset Edge Function to default behavior
  mockFunctionsInvoke.mockResolvedValue({
    data: { available: true },
    error: null
  });
});
```

Without this, Test B might fail because Test A modified the mock state.

### Complete Example: Testing Sign-In

Here's a full test that uses all these mocks:

```ts
describe('SI-2: Primary wallet sign-in succeeds', () => {
  it('should sign in successfully with primary wallet', async () => {
    // 1. Set up wallet provider mock
    const provider = createMockWalletProvider({ address: TEST_ADDRESSES.PRIMARY });
    mockAvailableWallets = [
      {
        id: 'phantom',
        name: 'Phantom',
        icon: '',
        getProvider: () => provider
      }
    ];

    // 2. Configure Edge Function: wallet is available
    mockFunctionsInvoke.mockResolvedValue({
      data: { available: true },
      error: null
    });

    // 3. Configure Supabase auth: sign-in succeeds
    mockSupabaseAuth.signInWithWeb3.mockResolvedValue({
      data: { user: { id: 'auth-123' } },
      error: null
    });

    // 4. Configure database queries
    // - Wallet exists and belongs to this user
    mockQueryResults['user_wallets:maybeSingle'] = {
      data: { id: 'w1', user_id: 'user-123', is_primary: true },
      error: null
    };
    // - User record exists
    mockQueryResults['users:single'] = {
      data: { id: 'user-123', auth_id: 'auth-123' },
      error: null
    };

    // 5. Run the test
    const { signIn } = await import('$lib/auth');
    const result = await signIn('phantom');

    // 6. Assert
    expect(result).toBeUndefined(); // No error = success
    expect(mockSupabaseAuth.signInWithWeb3).toHaveBeenCalled();
  });
});
```

### Testing Error Scenarios

The power of mocking is testing things that are hard to trigger in real life:

```ts
describe('Database errors', () => {
  it('should handle database connection failure', async () => {
    // Make the query fail
    mockQueryResults['user_wallets:maybeSingle'] = {
      data: null,
      error: { message: 'connection refused', code: 'ECONNREFUSED' }
    };

    const { signIn } = await import('$lib/auth');
    const result = await signIn('phantom');

    expect(result).toContain('error');
  });
});

describe('Edge Function errors', () => {
  it('should handle Edge Function network failure', async () => {
    // Make Edge Function fail
    mockFunctionsInvoke.mockResolvedValue({
      data: null,
      error: { message: 'Failed to fetch' }
    });

    const { signIn } = await import('$lib/auth');
    const result = await signIn('phantom');

    // Should fall back gracefully, not crash
    expect(result).toBeDefined();
  });

  it('should handle Edge Function throwing exception', async () => {
    // Make Edge Function throw (not just return error)
    mockFunctionsInvoke.mockRejectedValue(new Error('Function crashed'));

    const { signIn } = await import('$lib/auth');
    const result = await signIn('phantom');

    // Should catch and handle gracefully
    expect(result).toBeDefined();
  });
});
```

---

## Setting Up Vitest for SvelteKit

### 1. Install Dependencies

```bash
bun add -d vitest @testing-library/svelte jsdom
```

### 2. Configure Vitest

```ts
// vite.config.ts
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ['tests/**/*.{test,spec}.ts'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['tests/setup.ts']
  }
});
```

### 3. Create Setup File

```ts
// tests/setup.ts
import { vi } from 'vitest';

// Mock SvelteKit's environment module
vi.mock('$app/environment', () => ({
  browser: true,
  dev: true
}));
```

### 4. Add Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

### 5. Testing Svelte Runes

Svelte 5 runes (`$state`, `$derived`) work in test files - you just need to name your file with `.svelte.test.ts`:

```
state.test.ts        → ❌ runes don't work
state.svelte.test.ts → ✅ runes work!
```

**Testing state with real runes:**

```ts
// tests/unit/state.svelte.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { flushSync } from 'svelte';
import { auth, setUser, setWallets, clearWallets } from '$lib/auth/state.svelte';

describe('Auth State', () => {
  beforeEach(() => {
    setUser(null);
    setWallets([]);
  });

  it('should update user when setUser is called', () => {
    const mockUser = { id: 'test-123' } as any;
    setUser(mockUser);
    flushSync(); // Flush pending updates

    expect(auth.user).toEqual(mockUser);
  });

  it('should derive primaryWallet from wallets', () => {
    setWallets([
      { id: 'w1', is_primary: false, wallet_address: 'addr1' },
      { id: 'w2', is_primary: true, wallet_address: 'addr2' }
    ]);
    flushSync();

    expect(auth.primaryWallet?.id).toBe('w2');
  });
});
```

**Key Points:**

- Use `.svelte.test.ts` extension for rune support
- Call `flushSync()` after state changes to synchronize updates
- Real runes = no mocking needed for state layer
- See: https://svelte.dev/docs/svelte/testing#Using-runes-inside-your-test-files

**For integration tests** that import the orchestration layer (`index.ts`), you may still need to mock state if the test file is `.test.ts` (not `.svelte.test.ts`).

---

## Folder Structure

```
src/lib/
├── auth/
│   ├── logic.ts         # Pure business logic
│   ├── api.ts           # Supabase calls
│   ├── state.svelte.ts  # Reactive state
│   └── index.ts         # Public API
├── wallets.ts           # Wallet provider detection
├── types.ts             # TypeScript interfaces
└── supabase.ts          # Supabase client

tests/
├── setup.ts                  # Test setup
└── unit/
    ├── logic.test.ts         # Pure logic tests (33 tests)
    ├── auth.test.ts          # Integration tests (41 tests)
    └── state.svelte.test.ts  # State tests with real runes (14 tests)
```

---

## Key Takeaways

1. **Separate concerns** - Logic, API, State, Orchestration
2. **Pure functions are your friend** - No side effects = easy testing
3. **Use `.svelte.test.ts` for runes** - Real Svelte runes in tests!
4. **Start with logic.ts** - Get 100% coverage on pure functions first
5. **Mock at the boundary** - Mock api.ts, not individual Supabase calls

The goal isn't 100% code coverage everywhere. It's confidence that your code works. Pure logic with 100% coverage + state tests with real runes gives you that confidence.

---

## What We Achieved

| Metric            | Before              | After                  |
| ----------------- | ------------------- | ---------------------- |
| logic.ts coverage | -                   | 100% (41 tests)        |
| state.svelte.ts   | Untestable          | 100% (14 tests, runes) |
| Integration tests | ~20%                | 95% (53 tests)         |
| Wallet tests      | -                   | 100% (5 tests)         |
| Test complexity   | High (mocking hell) | Low (mostly pure)      |
| **Total tests**   | 17                  | **113**                |

The refactoring took about an hour. Writing tests for `logic.ts` took 10 minutes because they're so simple. Adding state tests with real runes took another 10 minutes. That's the power of good structure.

---

## Lessons Learned: RLS & Testing

### What is RLS?

**Row Level Security (RLS)** is a Supabase/PostgreSQL feature that controls which rows users can see or modify. For example:

```sql
-- Users can only read their own wallets
CREATE POLICY "Users can read own wallets"
ON user_wallets FOR SELECT
USING (user_id = auth.uid());
```

This means when User A queries `user_wallets`, they only see their own rows - User B's wallets are invisible.

### The Problem: RLS Returns Null, Not Errors

One bug we discovered during testing: our sign-in check queried another user's record, but **RLS policies blocked the read**, returning `null`. The original code:

```ts
if (walletOwner && walletOwner.auth_id !== authUser.id) {
  // walletOwner is null due to RLS → condition is false → bug!
}
```

The fix:

```ts
if (!walletOwner || walletOwner.auth_id !== authUser.id) {
  // Now handles RLS returning null
}
```

### Testing RLS Behavior in Unit Tests

You can't test actual RLS in unit tests (there's no real database), but you CAN test how your code handles RLS-like behavior:

```ts
describe('RLS Behavior Handling', () => {
  describe('Handle null from ownership queries', () => {
    it('should block sign-in when wallet owner lookup returns null (RLS blocked)', async () => {
      // Wallet exists in user_wallets
      mockQueryResults['user_wallets:maybeSingle'] = {
        data: { id: 'w1', user_id: 'other-user-123', is_primary: false },
        error: null
      };

      // But when we try to look up the owner, RLS blocks it → null
      mockQueryResults['users:single'] = {
        data: null, // RLS returned nothing
        error: null // No error, just empty
      };

      const { signIn } = await import('$lib/auth');
      const result = await signIn('phantom');

      // Should treat null as "belongs to someone else"
      expect(result).toContain('already linked');
    });
  });

  describe('Handle database errors gracefully', () => {
    it('should return error message on database failure', async () => {
      mockQueryResults['user_wallets:maybeSingle'] = {
        data: null,
        error: { message: 'connection refused', code: 'ECONNREFUSED' }
      };

      const { signIn } = await import('$lib/auth');
      const result = await signIn('phantom');

      expect(result).toContain('error');
    });
  });
});
```

### Manual RLS Verification

Unit tests with mocks don't catch real RLS bugs. For critical security, create a manual verification script:

```ts
// tests/integration/rls-verification.ts
// Run with: bun run tests/integration/rls-verification.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.PUBLIC_SUPABASE_ANON_KEY!
);

async function testRLS() {
  // Sign in as User A
  await supabase.auth.signInWithPassword({
    email: 'test-user-a@example.com',
    password: 'test-password'
  });

  // Try to read User B's data (should fail or return empty)
  const { data } = await supabase.from('users').select('*').eq('id', 'USER_B_ID').single();

  if (data !== null) {
    console.error('❌ SECURITY ISSUE: User A can read User B data!');
    process.exit(1);
  }

  console.log('✅ RLS correctly blocked cross-user read');
}
```

**Takeaway:** When testing with mocks, you don't catch RLS issues. Always do manual testing with real data, and consider what happens when queries return `null` due to permissions.

---

## Edge Functions: Server-Side Logic

### The Problem: Orphan Records

Our multi-wallet auth system had a subtle bug:

1. User A signs in with wallet A, connects wallet B
2. User A signs out
3. Someone tries to sign in with wallet B
4. Supabase creates a NEW auth user for wallet B (before our code runs)
5. Our code blocks the sign-in, but the auth user already exists → **orphan record**

The issue: Supabase Web3 auth creates `auth.users` records per-wallet. By the time our code can check if the wallet belongs to another user, Supabase has already created the orphan.

### The Solution: Pre-Check with Edge Functions

**Edge Functions** are serverless functions that run on Supabase's infrastructure. They:

- Run server-side (not in the browser)
- Have access to the service role key (bypasses RLS)
- Can be called from your client code

By checking wallet ownership BEFORE calling Supabase auth, we prevent orphans.

### Creating an Edge Function

```
supabase/functions/check-wallet/index.ts
```

```ts
/**
 * Edge Function: check-wallet
 *
 * Checks if a wallet is available for sign-in.
 * Runs server-side with admin privileges to bypass RLS.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const { wallet_address } = await req.json();

  // Create admin client (bypasses RLS)
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Check if wallet exists
  const { data: existingWallet } = await supabaseAdmin
    .from('user_wallets')
    .select('id, user_id, is_primary')
    .eq('wallet_address', wallet_address)
    .maybeSingle();

  if (!existingWallet) {
    return new Response(JSON.stringify({ available: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Wallet exists - get primary wallet for error message
  const { data: primaryWallet } = await supabaseAdmin
    .from('user_wallets')
    .select('wallet_address')
    .eq('user_id', existingWallet.user_id)
    .eq('is_primary', true)
    .maybeSingle();

  return new Response(
    JSON.stringify({
      available: false,
      primary_wallet: primaryWallet?.wallet_address ?? null
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
```

### Calling from Your App

```ts
// api.ts
export async function checkWalletAvailable(walletAddress: string) {
  try {
    const { data, error } = await supabase.functions.invoke('check-wallet', {
      body: { wallet_address: walletAddress }
    });

    if (error) {
      // Fall back to allowing sign-in (will be caught later if needed)
      return { available: true };
    }

    return data;
  } catch (err) {
    return { available: true }; // Graceful fallback
  }
}
```

### Updated Sign-In Flow

```ts
export async function signIn(providerId?: string) {
  // 1. Connect wallet
  const provider = getWalletProvider(providerId);
  await provider.connect();
  const walletAddress = provider.publicKey.toBase58();

  // 2. Check BEFORE Supabase auth (prevents orphans)
  const walletCheck = await api.checkWalletAvailable(walletAddress);
  if (!walletCheck.available) {
    return fail(logic.createBlockedSignInError(walletCheck.primary_wallet));
  }

  // 3. Safe to proceed - wallet is available
  const result = await api.signInWithWallet(provider);
  // ...
}
```

### Deploying Edge Functions

1. Install Supabase CLI:

   ```bash
   brew install supabase/tap/supabase
   ```

2. Link your project:

   ```bash
   supabase login
   supabase link --project-ref your-project-id
   ```

3. Deploy the function:
   ```bash
   supabase functions deploy check-wallet
   ```

### Why Edge Functions?

| Approach          | Pros                 | Cons                          |
| ----------------- | -------------------- | ----------------------------- |
| Client-side check | Simple               | RLS blocks cross-user queries |
| Public RLS policy | No server needed     | Security risk (exposes data)  |
| **Edge Function** | Secure, bypasses RLS | Extra deployment step         |

Edge Functions are the right tool when you need server-side logic that:

- Bypasses RLS safely (uses service role)
- Validates data before expensive operations
- Keeps sensitive logic out of client code

### Testing Edge Functions

In unit tests, mock the Edge Function call:

```ts
vi.mock('$lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn().mockResolvedValue({
        data: { available: true },
        error: null
      })
    }
  }
}));
```

For real testing, use `supabase functions serve` to run locally.

---

## Common Pitfalls (And How to Avoid Them)

### Pitfall 1: Mock State Leaking Between Tests

**The Problem:**

```ts
// Test 1
mockSupabaseFrom.mockReturnValue({
  select: () => ({ single: () => Promise.resolve({ data: { id: '123' } }) })
});

// Test 2 - FAILS because mockSupabaseFrom still has Test 1's mock!
```

**The Fix:** Reset mocks in `beforeEach`:

```ts
beforeEach(() => {
  vi.clearAllMocks();
  mockSupabaseFrom.mockImplementation((table) => createChainable(table));
});
```

### Pitfall 2: Forgetting to Await Async Operations

**The Problem:**

```ts
it('should update user', () => {
  signIn(); // Forgot await!
  expect(mockState.user).not.toBeNull(); // Fails - async hasn't completed
});
```

**The Fix:** Always `await` async functions and make the test `async`:

```ts
it('should update user', async () => {
  await signIn();
  expect(mockState.user).not.toBeNull();
});
```

### Pitfall 3: Testing Implementation Instead of Behavior

**The Problem:**

```ts
it('should call supabase.from with users', async () => {
  await signIn();
  expect(mockSupabaseFrom).toHaveBeenCalledWith('users'); // Too implementation-specific
});
```

If you refactor to use a different table structure, this test breaks even though the behavior is the same.

**The Fix:** Test outcomes, not internals:

```ts
it('should set user after successful sign-in', async () => {
  await signIn();
  expect(mockState.user).not.toBeNull(); // Tests behavior, not implementation
});
```

### Pitfall 4: Not Testing the Unhappy Path

**The Problem:** Only testing success cases:

```ts
it('should sign in successfully', async () => {
  /* ... */
});
// What about: wallet rejected? signature failed? network error?
```

**The Fix:** Test error scenarios too:

```ts
describe('signIn', () => {
  it('should succeed with valid wallet', async () => {
    /* ... */
  });
  it('should fail when wallet connection rejected', async () => {
    /* ... */
  });
  it('should fail when signature rejected', async () => {
    /* ... */
  });
  it('should handle network errors gracefully', async () => {
    /* ... */
  });
  it('should handle Edge Function failures', async () => {
    /* ... */
  });
});
```

### Pitfall 5: Dynamic Imports with Cached Mocks

**The Problem:** Vitest caches module imports. If you change mocks between tests, the cached import might use old mocks:

```ts
// Test 1
vi.mock('$lib/wallets', () => ({ getAvailableWallets: () => [] }));
const { signIn } = await import('$lib/auth'); // Cached

// Test 2
vi.mock('$lib/wallets', () => ({ getAvailableWallets: () => [phantom] })); // Ignored!
const { signIn } = await import('$lib/auth'); // Uses cached version with empty wallets
```

**The Fix:** Use mutable variables that you change between tests:

```ts
// At top of file
let mockAvailableWallets = [];

vi.mock('$lib/wallets', () => ({
  getAvailableWallets: () => mockAvailableWallets // References the variable
}));

// In tests
beforeEach(() => {
  mockAvailableWallets = []; // Reset to default
});

it('should work with phantom', async () => {
  mockAvailableWallets = [phantomWallet]; // Change the variable
  const { signIn } = await import('$lib/auth');
  // Now signIn sees phantomWallet
});
```

### Pitfall 6: Svelte Runes in Wrong File Type

**The Problem:**

```ts
// state.test.ts
let count = $state(0); // Error: $state is not defined
```

**The Fix:** Use `.svelte.test.ts` extension for files that use runes:

```ts
// state.svelte.test.ts
let count = $state(0); // Works!
```

---

## Testing Wallet Providers

Wallet providers (like Phantom, Solflare) have their own quirks. Here's how we test them:

### Creating a Mock Wallet Provider

```ts
function createMockWalletProvider(options = {}) {
  const {
    address = 'ABC123...',
    shouldRejectConnect = false,
    shouldRejectSign = false,
    signatureFormat = 'phantom' // 'phantom' returns Uint8Array, 'solflare' returns { signature }
  } = options;

  const mockPublicKey = {
    toString: () => address,
    toBase58: () => address,
    toBytes: () => new Uint8Array(32)
  };

  const fakeSignature = new Uint8Array(64).fill(1);

  return {
    isConnected: false,
    publicKey: null,

    connect: vi.fn().mockImplementation(async () => {
      if (shouldRejectConnect) throw new Error('User rejected');
      provider.publicKey = mockPublicKey;
      provider.isConnected = true;
      return { publicKey: mockPublicKey };
    }),

    disconnect: vi.fn().mockResolvedValue(undefined),

    signMessage: vi.fn().mockImplementation(async () => {
      if (shouldRejectSign) throw new Error('User rejected signature');
      // Different wallets return signatures in different formats!
      return signatureFormat === 'solflare' ? { signature: fakeSignature } : fakeSignature;
    })
  };
}
```

### Testing Different Wallet Behaviors

```ts
describe('Wallet Provider Handling', () => {
  it('should handle Phantom signature format (Uint8Array)', async () => {
    const provider = createMockWalletProvider({ signatureFormat: 'phantom' });
    // ... test that Uint8Array signature works
  });

  it('should handle Solflare signature format ({ signature })', async () => {
    const provider = createMockWalletProvider({ signatureFormat: 'solflare' });
    // ... test that { signature } format works
  });

  it('should handle user rejecting wallet connection', async () => {
    const provider = createMockWalletProvider({ shouldRejectConnect: true });
    mockAvailableWallets = [{ id: 'phantom', getProvider: () => provider }];

    const result = await signIn('phantom');

    expect(result).toContain('rejected');
  });
});
```

### Disconnect Before Connect (Wallet Picker)

One interesting pattern: to show the wallet picker (letting users choose which wallet to connect), you need to `disconnect` first, then `connect`:

```ts
it('should disconnect before connect to force wallet picker', async () => {
  const provider = createMockWalletProvider();
  mockAvailableWallets = [{ id: 'phantom', getProvider: () => provider }];

  await connectWallet('phantom');

  // Verify order: disconnect called first
  const disconnectOrder = provider.disconnect.mock.invocationCallOrder[0];
  const connectOrder = provider.connect.mock.invocationCallOrder[0];

  expect(disconnectOrder).toBeLessThan(connectOrder);
});
```

---

## Security Testing Checklist

Before shipping, verify these with tests:

| Security Check            | Test Type   | What to Verify                        |
| ------------------------- | ----------- | ------------------------------------- |
| Signature verification    | Unit        | Invalid signatures rejected           |
| Address validation        | Unit        | Only valid Solana addresses accepted  |
| RLS behavior              | Integration | Queries return null for blocked data  |
| Edge Function errors      | Unit        | Graceful fallback on failure          |
| Linked wallet blocking    | Unit        | Can't sign in with non-primary wallet |
| Primary wallet protection | Unit        | Can't delete primary wallet           |
| Duplicate key handling    | Unit        | Graceful handling of race conditions  |

### Running Security Checks

```bash
# Run all tests
bun run test:run

# Check for vulnerabilities in dependencies
bunx npm-audit

# Manual RLS verification (requires test users in Supabase)
bun run tests/integration/rls-verification.ts
```

---

## Final Stats

| Metric                   | Count   |
| ------------------------ | ------- |
| Pure logic tests         | 41      |
| Auth integration tests   | 53      |
| State tests (with runes) | 14      |
| Wallet provider tests    | 5       |
| **Total**                | **113** |

| Coverage                   | Status      |
| -------------------------- | ----------- |
| logic.ts                   | 100%        |
| Business rules             | 95% (42/44) |
| Dependency vulnerabilities | 0           |

The key insight: by separating concerns (logic, API, state, orchestration), most of our tests are simple pure function tests. The complex mocking is isolated to integration tests, and real Svelte runes work in `.svelte.test.ts` files.
