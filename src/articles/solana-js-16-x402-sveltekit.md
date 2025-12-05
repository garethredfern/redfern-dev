---
title: "x402 with SvelteKit: Full-Stack Example"
description: "Build a complete SvelteKit application with x402 payments - wallet connection, protected routes, and automatic payment handling."
tags: ["solana", "javascript", "x402", "svelte", "sveltekit"]
pubDate: "2025-12-04T16:30:00Z"
series: "solana-for-js-devs"
seriesOrder: 16
---

Time to build something real. We're creating a SvelteKit app with:

- Wallet connection (Phantom, Solflare)
- Protected API routes that require payment
- Automatic payment handling in the frontend
- A polished user experience

Coming from Vue, SvelteKit feels familiar - reactive by default, clean syntax, no virtual DOM overhead. Perfect for a payment-focused app where responsiveness matters.

## Project Setup

```bash
npx sv create x402-sveltekit
cd x402-sveltekit
npm install @solana/web3.js @solana/spl-token
```

When prompted, select TypeScript and your preferred options.

## The Wallet Store

Svelte stores are perfect for wallet state. Create a reactive wallet store:

```typescript
// src/lib/stores/wallet.ts
import { writable, derived } from "svelte/store";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { browser } from "$app/environment";

interface WalletState {
  connected: boolean;
  publicKey: PublicKey | null;
  wallet: any | null;
}

function createWalletStore() {
  const { subscribe, set, update } = writable<WalletState>({
    connected: false,
    publicKey: null,
    wallet: null,
  });

  return {
    subscribe,

    async connect() {
      if (!browser) return;

      // Check for Phantom
      const phantom = (window as any).phantom?.solana;

      if (!phantom) {
        window.open("https://phantom.app/", "_blank");
        return;
      }

      try {
        const response = await phantom.connect();
        set({
          connected: true,
          publicKey: response.publicKey,
          wallet: phantom,
        });
      } catch (err) {
        console.error("Wallet connection failed:", err);
      }
    },

    async disconnect() {
      const phantom = (window as any).phantom?.solana;
      if (phantom) {
        await phantom.disconnect();
      }
      set({ connected: false, publicKey: null, wallet: null });
    },

    // Check if already connected on page load
    async checkConnection() {
      if (!browser) return;

      const phantom = (window as any).phantom?.solana;
      if (phantom?.isConnected) {
        set({
          connected: true,
          publicKey: phantom.publicKey,
          wallet: phantom,
        });
      }
    },
  };
}

export const wallet = createWalletStore();

// Derived store for the connection
export const connection = derived(
  wallet,
  () => new Connection(clusterApiUrl("devnet"), "confirmed")
);

// Derived store for address string
export const walletAddress = derived(
  wallet,
  ($wallet) => $wallet.publicKey?.toBase58() ?? null
);
```

## x402 Payment Store

Create a store that handles x402 payment flows:

```typescript
// src/lib/stores/x402.ts
import { writable, get } from "svelte/store";
import { wallet, connection } from "./wallet";
import { Transaction, PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

interface PaymentRequirements {
  x402Version: number;
  accepts: Array<{
    scheme: string;
    network: string;
    maxAmountRequired: string;
    payTo: string;
    asset: { address: string };
    description: string;
  }>;
}

interface X402State {
  loading: boolean;
  status: string | null;
  error: string | null;
}

function createX402Store() {
  const { subscribe, set, update } = writable<X402State>({
    loading: false,
    status: null,
    error: null,
  });

  async function makePayment(
    requirements: PaymentRequirements
  ): Promise<string> {
    const $wallet = get(wallet);
    const $connection = get(connection);

    if (!$wallet.connected || !$wallet.publicKey || !$wallet.wallet) {
      throw new Error("Wallet not connected");
    }

    const req = requirements.accepts[0];
    const amount = BigInt(req.maxAmountRequired);

    const mintPubkey = new PublicKey(req.asset.address);
    const recipientPubkey = new PublicKey(req.payTo);
    const walletPubkey = $wallet.publicKey;

    // Get ATAs
    const sourceAta = await getAssociatedTokenAddress(mintPubkey, walletPubkey);
    const destAta = await getAssociatedTokenAddress(
      mintPubkey,
      recipientPubkey
    );

    const tx = new Transaction();

    // Check if destination ATA exists
    const destAccount = await $connection.getAccountInfo(destAta);
    if (!destAccount) {
      tx.add(
        createAssociatedTokenAccountInstruction(
          walletPubkey,
          destAta,
          recipientPubkey,
          mintPubkey,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );
    }

    // Add transfer
    tx.add(
      createTransferInstruction(
        sourceAta,
        destAta,
        walletPubkey,
        amount,
        [],
        TOKEN_PROGRAM_ID
      )
    );

    // Set transaction details
    const { blockhash } = await $connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = walletPubkey;

    // Sign with wallet
    const signedTx = await $wallet.wallet.signTransaction(tx);

    // Send and confirm
    const signature = await $connection.sendRawTransaction(
      signedTx.serialize()
    );
    await $connection.confirmTransaction(signature, "confirmed");

    return signature;
  }

  function createPaymentHeader(
    signature: string,
    requirements: PaymentRequirements
  ): string {
    const $wallet = get(wallet);
    const req = requirements.accepts[0];

    const payload = {
      scheme: req.scheme,
      network: req.network,
      payload: {
        signature,
        payer: $wallet.publicKey?.toBase58(),
      },
    };

    return btoa(JSON.stringify(payload));
  }

  return {
    subscribe,

    async fetch(url: string, options: RequestInit = {}): Promise<Response> {
      const $wallet = get(wallet);

      if (!$wallet.connected) {
        throw new Error("Please connect your wallet");
      }

      set({ loading: true, status: null, error: null });

      try {
        // Initial request
        const response = await fetch(url, options);

        if (response.status !== 402) {
          set({ loading: false, status: "Success", error: null });
          return response;
        }

        update((s) => ({ ...s, status: "Payment required" }));
        const requirements: PaymentRequirements = await response.json();

        // Format price
        const price =
          Number(requirements.accepts[0].maxAmountRequired) / 1_000_000;
        update((s) => ({
          ...s,
          status: `Paying $${price.toFixed(2)} USDC...`,
        }));

        // Make payment
        const signature = await makePayment(requirements);
        update((s) => ({
          ...s,
          status: "Payment confirmed, fetching content...",
        }));

        // Retry with payment header
        const paymentHeader = createPaymentHeader(signature, requirements);

        const retryResponse = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            "X-PAYMENT": paymentHeader,
          },
        });

        if (retryResponse.status === 402) {
          throw new Error("Payment was not accepted");
        }

        set({ loading: false, status: "Success!", error: null });
        return retryResponse;
      } catch (err) {
        const error = (err as Error).message;
        set({ loading: false, status: null, error });
        throw err;
      }
    },

    reset() {
      set({ loading: false, status: null, error: null });
    },
  };
}

export const x402 = createX402Store();
```

## Protected API Route

Create a SvelteKit API endpoint that requires payment:

```typescript
// src/routes/api/premium/+server.ts
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { TREASURY_ADDRESS } from "$env/static/private";

const CONFIG = {
  treasuryAddress: TREASURY_ADDRESS,
  network: "solana-devnet",
  facilitatorUrl: "https://x402.org/facilitator",
  usdcMint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  price: "10000", // $0.01 USDC
};

export const GET: RequestHandler = async ({ request }) => {
  const paymentHeader = request.headers.get("x-payment");

  const paymentRequirements = {
    x402Version: 1,
    accepts: [
      {
        scheme: "exact",
        network: CONFIG.network,
        maxAmountRequired: CONFIG.price,
        resource: request.url,
        description: "Premium content access",
        mimeType: "application/json",
        payTo: CONFIG.treasuryAddress,
        maxTimeoutSeconds: 60,
        asset: { address: CONFIG.usdcMint },
        extra: {},
      },
    ],
  };

  if (!paymentHeader) {
    return json(paymentRequirements, { status: 402 });
  }

  // Verify payment with facilitator
  try {
    const verifyResponse = await fetch(`${CONFIG.facilitatorUrl}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentHeader,
        paymentRequirements: paymentRequirements.accepts[0],
      }),
    });

    const result = await verifyResponse.json();

    if (!result.valid) {
      return json(
        { error: "Invalid payment", ...paymentRequirements },
        { status: 402 }
      );
    }
  } catch (error) {
    return json({ error: "Payment verification failed" }, { status: 500 });
  }

  // Payment verified - return premium content
  return json(
    {
      message: "Welcome to the premium zone!",
      data: {
        secret: "The answer to everything is 42",
        tips: [
          "x402 makes micropayments viable",
          "Solana transactions cost ~$0.00025",
          "SvelteKit + Solana = fast everywhere",
        ],
        generatedAt: new Date().toISOString(),
      },
    },
    {
      headers: {
        "X-PAYMENT-RESPONSE": JSON.stringify({
          success: true,
          network: CONFIG.network,
        }),
      },
    }
  );
};
```

## Wallet Connect Component

Create a reusable wallet button:

```svelte
<!-- src/lib/components/WalletButton.svelte -->
<script lang="ts">
  import { wallet, walletAddress } from '$lib/stores/wallet';
  import { onMount } from 'svelte';

  onMount(() => {
    wallet.checkConnection();
  });

  function truncateAddress(address: string): string {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }
</script>

{#if $wallet.connected && $walletAddress}
  <div class="wallet-connected">
    <span class="address">{truncateAddress($walletAddress)}</span>
    <button on:click={() => wallet.disconnect()} class="disconnect">
      Disconnect
    </button>
  </div>
{:else}
  <button on:click={() => wallet.connect()} class="connect">
    Connect Wallet
  </button>
{/if}

<style>
  .connect {
    background: #9945FF;
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    border: none;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }

  .connect:hover {
    background: #7C3AED;
  }

  .wallet-connected {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: #1a1a2e;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
  }

  .address {
    color: #9945FF;
    font-family: monospace;
  }

  .disconnect {
    background: transparent;
    color: #888;
    border: 1px solid #333;
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    cursor: pointer;
  }

  .disconnect:hover {
    color: #fff;
    border-color: #666;
  }
</style>
```

## Main Page

The home page with payment flow:

```svelte
<!-- src/routes/+page.svelte -->
<script lang="ts">
  import WalletButton from '$lib/components/WalletButton.svelte';
  import { wallet } from '$lib/stores/wallet';
  import { x402 } from '$lib/stores/x402';

  let content: any = null;

  async function loadPremiumContent() {
    content = null;

    try {
      const response = await x402.fetch('/api/premium');
      content = await response.json();
    } catch (err) {
      // Error is already in the store
    }
  }
</script>

<main>
  <h1>x402 Demo</h1>
  <p class="subtitle">Pay-per-request with Solana + SvelteKit</p>

  <!-- Wallet Connection -->
  <section class="wallet-section">
    <WalletButton />
  </section>

  <!-- Status Messages -->
  {#if $x402.status}
    <div class="status info">
      {$x402.status}
    </div>
  {/if}

  {#if $x402.error}
    <div class="status error">
      {$x402.error}
    </div>
  {/if}

  <!-- Action -->
  {#if $wallet.connected}
    <button
      on:click={loadPremiumContent}
      disabled={$x402.loading}
      class="primary-button"
    >
      {$x402.loading ? 'Processing...' : 'Get Premium Content ($0.01)'}
    </button>
  {:else}
    <p class="hint">Connect your wallet to access premium content</p>
  {/if}

  <!-- Content Display -->
  {#if content}
    <div class="content-box">
      <h2>{content.message}</h2>
      <p><strong>Secret:</strong> {content.data.secret}</p>
      <div class="tips">
        <strong>Tips:</strong>
        <ul>
          {#each content.data.tips as tip}
            <li>{tip}</li>
          {/each}
        </ul>
      </div>
    </div>
  {/if}

  <!-- How it works -->
  <section class="how-it-works">
    <h2>How it works</h2>
    <ol>
      <li>Connect your Solana wallet (with devnet USDC)</li>
      <li>Click the button to request premium content</li>
      <li>The server responds with 402 Payment Required</li>
      <li>Your wallet prompts for a $0.01 USDC payment</li>
      <li>After payment confirms, content is delivered</li>
    </ol>
  </section>
</main>

<style>
  main {
    max-width: 640px;
    margin: 0 auto;
    padding: 2rem;
  }

  h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
  }

  .subtitle {
    color: #888;
    margin-bottom: 2rem;
  }

  .wallet-section {
    margin-bottom: 2rem;
  }

  .status {
    padding: 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
  }

  .status.info {
    background: #1e3a5f;
    color: #7dd3fc;
  }

  .status.error {
    background: #5f1e1e;
    color: #fca5a5;
  }

  .primary-button {
    background: #14F195;
    color: #000;
    padding: 1rem 2rem;
    border-radius: 0.5rem;
    border: none;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: transform 0.1s, background 0.2s;
  }

  .primary-button:hover:not(:disabled) {
    background: #0fd584;
    transform: translateY(-1px);
  }

  .primary-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .hint {
    color: #888;
  }

  .content-box {
    margin-top: 2rem;
    padding: 1.5rem;
    background: #0a2f1f;
    border: 1px solid #14F195;
    border-radius: 0.5rem;
  }

  .content-box h2 {
    color: #14F195;
    margin-bottom: 1rem;
  }

  .tips ul {
    margin-top: 0.5rem;
    padding-left: 1.5rem;
  }

  .tips li {
    color: #a7f3d0;
  }

  .how-it-works {
    margin-top: 3rem;
    padding: 1.5rem;
    background: #1a1a2e;
    border-radius: 0.5rem;
  }

  .how-it-works h2 {
    margin-bottom: 1rem;
  }

  .how-it-works ol {
    padding-left: 1.5rem;
  }

  .how-it-works li {
    color: #888;
    margin-bottom: 0.5rem;
  }
</style>
```

## Environment Variables

Create `.env`:

```bash
TREASURY_ADDRESS=your_solana_wallet_address
```

## Type Declarations for Phantom

Create type declarations for the Phantom wallet:

```typescript
// src/app.d.ts
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface Platform {}
  }

  interface Window {
    phantom?: {
      solana?: {
        isPhantom: boolean;
        isConnected: boolean;
        publicKey: import("@solana/web3.js").PublicKey;
        connect(): Promise<{ publicKey: import("@solana/web3.js").PublicKey }>;
        disconnect(): Promise<void>;
        signTransaction(
          tx: import("@solana/web3.js").Transaction
        ): Promise<import("@solana/web3.js").Transaction>;
        signAllTransactions(
          txs: import("@solana/web3.js").Transaction[]
        ): Promise<import("@solana/web3.js").Transaction[]>;
      };
    };
  }
}

export {};
```

## Running the App

```bash
npm run dev
```

Visit `http://localhost:5173`, connect your Phantom wallet (with devnet USDC), and try the payment flow.

## Why Svelte for x402?

Coming from Vue, here's what I noticed:

**Reactivity is cleaner** - Stores update, components react. No `ref()` vs `reactive()` decisions.

**Less boilerplate** - The wallet store is 50 lines. The React equivalent with Context would be twice that.

**Bundle size** - Matters for payment apps where every millisecond of load time costs conversions.

**No virtual DOM overhead** - Direct DOM updates mean snappier wallet popups and status changes.

## Vue Comparison

If you're coming from Vue, here's the mental mapping:

| Vue          | Svelte                        |
| ------------ | ----------------------------- |
| `ref()`      | `let variable` (in component) |
| `reactive()` | `writable()` store            |
| `computed()` | `derived()` store             |
| `watch()`    | `$: statement`                |
| `<template>` | Just write HTML               |
| `v-if`       | `{#if}`                       |
| `v-for`      | `{#each}`                     |
| `@click`     | `on:click`                    |

The x402 store pattern works almost identically to a Pinia store.

## The Complete Flow

When a user clicks "Get Premium Content":

```
1. SvelteKit calls /api/premium
2. API returns 402 + payment requirements
3. x402 store detects 402
4. Creates USDC transfer transaction
5. Phantom wallet popup appears
6. User approves, transaction sent
7. Waits for Solana confirmation (~1s)
8. Retries /api/premium with X-PAYMENT header
9. API verifies via facilitator
10. Returns premium content
11. Svelte reactively updates UI
```

## What You Built

A production-ready SvelteKit template with:

✅ Phantom wallet connection
✅ Reactive wallet state with Svelte stores
✅ Protected API routes requiring USDC payment
✅ Automatic payment handling
✅ Clean, reactive UI updates
✅ Familiar patterns for Vue developers

## Next Steps

- Add Solflare and other wallet support
- Implement session tokens for repeated access
- Add payment history with localStorage
- Deploy to Vercel/Cloudflare Pages
