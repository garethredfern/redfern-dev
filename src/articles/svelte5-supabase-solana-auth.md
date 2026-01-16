---
title: "Building Solana Wallet Auth with Svelte 5 and Supabase"
description: "A practical guide to building web3 authentication with multi-wallet support, covering Svelte 5 runes, Supabase Web3 auth, and Row Level Security."
tags: ["svelte", "supabase", "solana", "authentication", "web3"]
pubDate: "2026-01-15T23:00:00Z"
---

## Building Solana Wallet Auth with Svelte 5 and Supabase

A practical guide to building web3 authentication with multi-wallet support, covering Svelte 5 runes, Supabase Web3 auth, and Row Level Security.

---

## What We're Building

A web3 app where users can:

- Sign in with their Solana wallet (Phantom or Solflare)
- Connect multiple wallets to their account
- Set a primary wallet for payouts
- Have their data protected by database-level security

**Tech stack:**

- Svelte 5 (with Runes)
- SvelteKit
- Supabase (Auth + Database)
- Solana wallets
- tweetnacl for signature verification
- Tailwind CSS

---

## Part 1: Understanding the Architecture

### The Two-ID Problem

When you use Supabase auth, you end up with two different user IDs:

1. **`auth.users.id`** - Created by Supabase when someone signs in
2. **`public.users.id`** - Your own users table

Why have both? Portability. If you ever migrate away from Supabase, your user data stays intact. The `auth.users` table is managed by Supabase - you don't control it.

### Our Schema

```
auth.users (Supabase manages this)
├── id: "auth-uuid-111"
└── [wallet info, etc.]

public.users (your table)
├── id: "user-uuid-222"
├── auth_id: "auth-uuid-111"  ← links to auth.users
├── display_name
└── avatar_url

public.user_wallets
├── id
├── user_id: "user-uuid-222"  ← links to YOUR users table
├── wallet_address
├── is_primary (for payouts)
└── verified_at
```

The key insight: `user_wallets.user_id` references `public.users.id`, not `auth.users.id`.

---

## Part 2: Svelte 5 Runes Basics

Svelte 5 introduces "runes" - a new way to handle reactivity. Here's what we use:

### $state - Reactive Variables

```ts
let user = $state<User | null>(null);
let loading = $state(false);
let error = $state('');
```

These are reactive. When they change, the UI updates.

### $derived - Computed Values

```ts
const isLoggedIn = $derived(user !== null);
const primaryWallet = $derived(wallets.find((w) => w.is_primary));
```

These automatically recalculate when their dependencies change.

### $derived.by - Complex Computed Values

```ts
const displayAddress = $derived.by(() => {
  if (!user) return null;
  const address = user?.user_metadata?.custom_claims?.address;
  if (!address) return null;
  return address.slice(0, 5) + '...' + address.slice(-5);
});
```

Use `.by()` when you need a function body with logic.

### $props - Component Props

```ts
let { children } = $props();
```

### $effect - Side Effects with Cleanup

```ts
$effect(() => {
  const cleanup = initAuth();
  return cleanup; // Runs when component unmounts
});
```

---

## Part 3: The Auth Module

Create `src/lib/auth.svelte.ts` - the `.svelte.ts` extension lets you use runes in a regular TypeScript file.

### State Management

```ts
import { supabase } from '$lib/supabase';
import { browser } from '$app/environment';
import type { User } from '@supabase/supabase-js';
import type { UserWallet } from '$lib/types';

// Reactive state at module level
let user = $state<User | null>(null);
let wallets = $state<UserWallet[]>([]);
let loading = $state(false);
let authError = $state('');
```

### Exposing State Reactively

Here's a gotcha. If you export state directly:

```ts
// DON'T DO THIS
export { user, wallets };
```

Components importing this won't get reactive updates. Instead, use a getter object:

```ts
// DO THIS
export const auth = {
  get user() {
    return user;
  },
  get wallets() {
    return wallets;
  },
  get primaryWallet() {
    return wallets.find((w) => w.is_primary) ?? null;
  },
  get loading() {
    return loading;
  },
  get error() {
    return authError;
  }
};
```

Then in components:

```ts
import { auth } from '$lib/auth.svelte';

const user = $derived(auth.user); // Reactive!
```

### Wallet Provider Detection (Extensible)

Rather than hardcoding wallet detection, we create a config file that's easy to extend:

**`src/lib/wallets.ts`**

```ts
import { browser } from '$app/environment';
import type { WalletProvider, SolanaProvider } from '$lib/types';

// Wallet provider configurations - add new wallets here
export const walletProviders: WalletProvider[] = [
  {
    id: 'phantom',
    name: 'Phantom',
    icon: '👻',
    getProvider: () => {
      if (!browser) return null;
      const phantom = window.phantom?.solana;
      if (phantom?.isPhantom) return phantom;
      return null;
    }
  },
  {
    id: 'solflare',
    name: 'Solflare',
    icon: '🔆',
    getProvider: () => {
      if (!browser) return null;
      const solflare = window.solflare;
      if (solflare?.isSolflare) return solflare;
      return null;
    }
  }
  // Add more wallets here (Backpack, etc.)
];

// Get all available (installed) wallet providers
export function getAvailableWallets(): WalletProvider[] {
  return walletProviders.filter((w) => w.getProvider() !== null);
}

// Get a specific provider by ID
export function getProviderById(id: string): SolanaProvider | null {
  const wallet = walletProviders.find((w) => w.id === id);
  return wallet?.getProvider() ?? null;
}
```

**Types (`src/lib/types.ts`):**

```ts
export interface WalletProvider {
  id: string;
  name: string;
  icon: string;
  getProvider: () => SolanaProvider | null;
}

export interface SolanaProvider {
  isConnected?: boolean;
  publicKey?: { toString(): string; toBase58(): string; toBytes(): Uint8Array } | null;
  connect(): Promise<{
    publicKey: { toString(): string; toBase58(): string; toBytes(): Uint8Array };
  }>;
  disconnect(): Promise<void>;
  signMessage(message: Uint8Array): Promise<Uint8Array>;
}
```

The `browser` check is crucial - this code runs on the server during SSR where `window` doesn't exist.

**Adding a new wallet is simple** - just add another object to the array with the detection logic.

### Sign In Flow

```ts
export async function signIn() {
  loading = true;
  const provider = getProvider();

  if (!provider) {
    loading = false;
    authError = 'No Solana wallet detected. Install Phantom or Solflare.';
    return authError;
  }

  try {
    await provider.connect();
  } catch {
    loading = false;
    authError = 'Wallet connection rejected';
    return authError;
  }

  // Get wallet address before auth
  const publicKey = provider.publicKey;
  if (!publicKey) {
    loading = false;
    authError = 'Could not get wallet public key';
    return authError;
  }
  const walletAddress = publicKey.toBase58();

  // Supabase Web3 auth
  const { error, data } = await supabase.auth.signInWithWeb3({
    chain: 'solana',
    statement: 'Sign in to TreehouseHQ',
    wallet: provider
  });

  if (error) {
    loading = false;
    authError = error.message;
    return authError;
  }

  // Auto-create user and wallet records
  if (data.user) {
    await ensureUserAndWallet(data.user.id, walletAddress);
  }

  authError = '';
  loading = false;
}
```

### The Two-ID Bridge

When a user signs in, we need to:

1. Find or create their `public.users` record
2. Add their wallet to `user_wallets`

```ts
async function ensureUserAndWallet(authId: string, walletAddress: string) {
  // Get or create public.users record
  let { data: publicUser } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', authId)
    .single();

  if (!publicUser) {
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({ auth_id: authId })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create user:', error);
      return;
    }
    publicUser = newUser;
  }

  // Check if wallet already exists
  const { data: existingWallet } = await supabase
    .from('user_wallets')
    .select('id')
    .eq('wallet_address', walletAddress)
    .single();

  if (!existingWallet) {
    // Check if user has any wallets (to set is_primary)
    const { data: userWallets } = await supabase
      .from('user_wallets')
      .select('id')
      .eq('user_id', publicUser.id);

    const isPrimary = !userWallets || userWallets.length === 0;

    await supabase.from('user_wallets').insert({
      user_id: publicUser.id, // Using public.users.id, not auth.users.id!
      wallet_address: walletAddress,
      is_primary: isPrimary,
      verified_at: new Date().toISOString()
    });
  }
}
```

---

## Part 4: Connecting Additional Wallets

Users can link multiple wallets. Each requires a signature to prove ownership.

### The Wallet Picker Problem

When you call `provider.connect()`, the wallet extension (Phantom/Solflare) returns whichever wallet is currently active. If the user only has one wallet, or doesn't manually switch, they'll keep getting the same wallet address.

**The fix:** Disconnect before connecting. This forces the wallet picker to appear.

```ts
// Disconnect first - forces the wallet picker to show
await provider.disconnect();
await provider.connect(); // Now the picker appears
```

**Important:** `provider.disconnect()` only disconnects the browser extension connection. It does NOT log the user out of Supabase. The Supabase session lives in cookies/localStorage - completely separate from the wallet extension state.

### The Connect Flow

```ts
export async function connectWallet() {
  if (!user) {
    authError = 'Must be signed in to connect a wallet';
    return authError;
  }

  loading = true;
  const provider = getProvider();

  // ... provider checks ...

  // Disconnect first to force wallet picker to appear
  try {
    await provider.disconnect();
  } catch {
    // Ignore disconnect errors
  }

  try {
    await provider.connect();
  } catch {
    loading = false;
    authError = 'Wallet connection rejected';
    return authError;
  }

  const walletAddress = provider.publicKey.toBase58();

  // Check if already connected
  if (wallets.some((w) => w.wallet_address === walletAddress)) {
    loading = false;
    authError = 'This wallet is already linked to your account';
    return authError;
  }

  // Create message and request signature
  const message = `Link wallet ${walletAddress} to TreehouseHQ account`;
  const encodedMessage = getUtf8Encoder().encode(message);

  let signature: Uint8Array;
  try {
    signature = await provider.signMessage(encodedMessage);
  } catch {
    loading = false;
    authError = 'Message signing rejected';
    return authError;
  }

  // Verify signature
  const walletAddressObj = address(walletAddress);
  const isValid = await verifySignature(walletAddressObj, signature, encodedMessage);

  if (!isValid) {
    loading = false;
    authError = 'Signature verification failed';
    return authError;
  }

  // Insert wallet
  // ... get publicUser.id first ...

  await supabase.from('user_wallets').insert({
    user_id: publicUser.id,
    wallet_address: walletAddress,
    is_primary: wallets.length === 0,
    verified_at: new Date().toISOString()
  });

  await loadWallets();
  loading = false;
}
```

### Signature Verification with tweetnacl

We use `tweetnacl` for signature verification - it's the standard library used across the Solana ecosystem:

```ts
import nacl from 'tweetnacl';

const message = `Link wallet ${walletAddress} to TreehouseHQ account`;
const encodedMessage = new TextEncoder().encode(message);

// Get signature from wallet - handle different wallet formats
let signatureResult = await provider.signMessage(encodedMessage);

// Phantom returns Uint8Array directly, Solflare returns { signature: Uint8Array }
let sigBytes: Uint8Array;
if (signatureResult instanceof Uint8Array) {
  sigBytes = signatureResult;
} else if (
  signatureResult &&
  typeof signatureResult === 'object' &&
  'signature' in signatureResult
) {
  sigBytes = new Uint8Array(signatureResult.signature);
}

// Verify the signature
const msgBytes = new Uint8Array(encodedMessage);
const pubKeyBytes = new Uint8Array(publicKey.toBytes());
const isValid = nacl.sign.detached.verify(msgBytes, sigBytes, pubKeyBytes);
```

This proves the user controls the private key for that wallet address.

**Why tweetnacl over @solana/kit?**

- `@solana/kit`'s `verifySignature` expects a `CryptoKey` object (from `generateKeyPair()`), not raw public key bytes from a wallet
- `tweetnacl` works directly with `Uint8Array` bytes, which is what wallets provide
- It's the established pattern used by QuickNode, Phantom docs, and most Solana dApps

---

## Part 5: Row Level Security (RLS)

Supabase RLS lets you define security rules at the database level. Even if someone bypasses your app, the database enforces the rules.

### The Helper Function

Remember the two-ID problem? RLS policies only have access to `auth.uid()` (the auth ID), but our tables use `public.users.id`.

Create a helper function to bridge them:

```sql
create or replace function get_current_user_id()
returns uuid as $$
  select id from users where auth_id = auth.uid()
$$ language sql security definer stable;
```

This function:

- Takes no input (uses `auth.uid()` internally)
- Returns the `public.users.id` for the logged-in user
- `security definer` means it runs with elevated privileges (can query users table)
- `stable` tells Postgres the result doesn't change within a query (enables caching)

### Writing Policies

```sql
-- Enable RLS on the table
alter table user_wallets enable row level security;

-- Users can see their own wallets
create policy "Users can view own wallets"
  on user_wallets for select
  using (user_id = get_current_user_id());

-- Allow authenticated users to check if a wallet exists (needed for sign-in validation)
create policy "Authenticated users can lookup wallets by address"
  on user_wallets for select
  using (auth.role() = 'authenticated');

-- Users can only insert wallets for themselves
create policy "Users can insert own wallets"
  on user_wallets for insert
  with check (user_id = get_current_user_id());

-- Users can only update their own wallets
create policy "Users can update own wallets"
  on user_wallets for update
  using (user_id = get_current_user_id());

-- Users can only delete their own NON-PRIMARY wallets
create policy "Users can delete own non-primary wallets"
  on user_wallets for delete
  using (user_id = get_current_user_id() and is_primary = false);
```

### Policy Breakdown

- **`for select`** - Applies when reading data
- **`for insert`** - Applies when creating data
- **`for update`** - Applies when modifying data
- **`for delete`** - Applies when removing data
- **`using (condition)`** - Which existing rows can be accessed
- **`with check (condition)`** - What new/modified data is allowed

The delete policy has an extra condition: `is_primary = false`. Users can't delete their primary wallet - they must first set another wallet as primary.

---

## Part 6: The Component

### Layout Setup

In `+layout.svelte`, initialize auth:

```svelte
<script lang="ts">
  import { initAuth } from '$lib/auth.svelte';

  let { children } = $props();

  $effect(() => {
    const cleanup = initAuth();
    return cleanup;
  });
</script>

<div class="flex min-h-screen flex-col">
  <SiteHeader />
  <main class="grow p-5">
    {@render children()}
  </main>
  <SiteFooter />
</div>
```

### The Header Component

```svelte
<script lang="ts">
  import {
    auth,
    signIn,
    signOut,
    connectWallet,
    removeWallet,
    setPrimaryWallet
  } from '$lib/auth.svelte';

  const user = $derived(auth.user);
  const wallets = $derived(auth.wallets);
  const primaryWallet = $derived(auth.primaryWallet);

  let showWalletMenu = $state(false);

  const truncateAddress = (address: string) => {
    return address.slice(0, 5) + '...' + address.slice(-5);
  };

  const displayAddress = $derived.by(() => {
    if (primaryWallet) return truncateAddress(primaryWallet.wallet_address);
    if (!user) return null;
    const address = user?.user_metadata?.custom_claims?.address;
    if (!address) return null;
    return truncateAddress(address);
  });
</script>

<header>
  {#if user}
    <button onclick={() => (showWalletMenu = !showWalletMenu)}>
      {displayAddress}
    </button>

    {#if showWalletMenu}
      <div class="dropdown">
        {#each wallets as wallet (wallet.id)}
          <div>
            <button onclick={() => setPrimaryWallet(wallet.id)}>
              {truncateAddress(wallet.wallet_address)}
              {#if wallet.is_primary}
                <span>Primary</span>
              {/if}
            </button>

            {#if !wallet.is_primary}
              <button onclick={() => removeWallet(wallet.id)}> Remove </button>
            {/if}
          </div>
        {/each}

        <button onclick={connectWallet}> + Connect Wallet </button>

        <button onclick={signOut}> Sign Out </button>
      </div>
    {/if}
  {:else}
    <button onclick={signIn}> Sign in </button>
  {/if}
</header>
```

---

## Part 7: Key Lessons Learned

### 1. Svelte 5 Rune Reactivity

Don't export `$state` directly. Use getter objects:

```ts
// Bad - consumers won't get updates
export { user };

// Good - consumers get reactive updates
export const auth = {
  get user() {
    return user;
  }
};
```

### 2. SSR Guards

Always check for `browser` before accessing `window`:

```ts
import { browser } from '$app/environment';

function getProvider() {
  if (!browser) return null;
  // Now safe to access window
}
```

### 3. The Two-ID Pattern

When using Supabase with a separate users table:

- `auth.uid()` = Supabase's user ID
- `public.users.id` = Your user ID
- Bridge them with a helper function for RLS

### 4. RLS is Your Friend

Even simple policies catch bugs and prevent data leaks:

```sql
using (user_id = get_current_user_id())
```

This one line ensures users can only access their own data.

### 5. Signature Verification

Use `tweetnacl` for signature verification - it's the Solana ecosystem standard:

```ts
import nacl from 'tweetnacl';
const isValid = nacl.sign.detached.verify(msgBytes, sigBytes, pubKeyBytes);
```

### 6. Primary Wallet Enforcement

Only allow sign-in with the primary wallet. If someone tries to sign in with a linked (non-primary) wallet, show a helpful error:

```ts
// In signIn(), after signInWithWeb3 succeeds:
const { data: existingWallet } = await supabase
  .from('user_wallets')
  .select('id, user_id, is_primary')
  .eq('wallet_address', walletAddress)
  .maybeSingle();

if (existingWallet && !existingWallet.is_primary) {
  // Get the primary wallet address for the error message
  const { data: primaryWallet } = await supabase
    .from('user_wallets')
    .select('wallet_address')
    .eq('user_id', existingWallet.user_id)
    .eq('is_primary', true)
    .maybeSingle();

  const truncated = primaryWallet?.wallet_address
    ? `${primaryWallet.wallet_address.slice(0, 4)}...${primaryWallet.wallet_address.slice(-4)}`
    : 'your primary wallet';

  await supabase.auth.signOut();
  authError = `This wallet is linked to an existing account. Please sign in with your primary wallet: ${truncated}`;
  return authError;
}
```

**Why enforce this?** Without it, Supabase creates a new `auth.users` record for each wallet. This causes confusion where the same person could have multiple accounts. By blocking linked wallet sign-in, we maintain one account per user.

### 7. Error Handling

Always handle wallet rejections - users frequently cancel signature requests:

```ts
try {
  await provider.signMessage(message);
} catch {
  authError = 'Message signing rejected';
  return;
}
```

---

## Quick Reference

### Supabase Setup

1. Enable Web3 provider in Authentication settings
2. Create `users` table with `auth_id` column
3. Create `user_wallets` table with `user_id` referencing `users`
4. Create `get_current_user_id()` helper function
5. Enable RLS and create policies

### Dependencies

```bash
bun add @supabase/supabase-js tweetnacl
```

### File Structure

```
src/
├── lib/
│   ├── auth.svelte.ts    # Auth state and functions
│   ├── wallets.ts        # Wallet provider configs (extensible)
│   ├── supabase.ts       # Supabase client
│   └── types.ts          # TypeScript interfaces
└── routes/
    ├── +layout.svelte    # Init auth, render layout
    └── SiteHeader.svelte # Wallet UI
```

---

## What's Next

This covers authentication. Next steps:

- Workspace management (multi-tenant)
- Projects and tasks
- Bounties and submissions
- NFT gating for access control

Each builds on this foundation of authenticated users with verified wallets.
