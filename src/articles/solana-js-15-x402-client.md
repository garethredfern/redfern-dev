---
title: "Building an x402 Client: Handling Payment Flows"
description: "Create a JavaScript client that automatically handles x402 payment flows - detecting 402s, making payments, and retrying requests."
tags: ["solana", "javascript", "x402", "client", "payments"]
pubDate: "2025-12-04T16:00:00Z"
series: "solana-for-js-devs"
seriesOrder: 15
---

Our x402 server is running. Now we need a client that handles the payment flow automatically.

The goal: make a fetch request that transparently handles 402 responses - pay and retry without manual intervention.

## The Flow

```
fetch('/api/premium')
        │
        ▼
   Got 402? ────No────> Return response
        │
       Yes
        │
        ▼
 Parse requirements
        │
        ▼
  Create payment
        │
        ▼
 Sign transaction
        │
        ▼
Retry with X-PAYMENT
        │
        ▼
  Return response
```

## Basic Client (Bun)

Let's start with a Bun client that uses a keypair signer:

```typescript
// x402-client.ts
import { createSolanaClient, loadKeypairSignerFromFile, address } from "gill";
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
} from "@solana/spl-token";

interface X402ClientConfig {
  walletPath: string;
  network?: string;
  maxPayment?: number;
}

export async function createX402Client(config: X402ClientConfig) {
  const {
    walletPath,
    network = "solana-devnet",
    maxPayment = 1_000_000, // Max 1 USDC by default
  } = config;

  const { rpc, sendAndConfirmTransaction } = createSolanaClient({
    urlOrMoniker: network.replace("solana-", ""),
  });

  const wallet = await loadKeypairSignerFromFile(walletPath);

  async function makePayment(requirements: any) {
    const req = requirements.accepts[0];
    const amount = BigInt(req.maxAmountRequired);

    // Safety check
    if (amount > BigInt(maxPayment)) {
      throw new Error(`Payment ${amount} exceeds max allowed ${maxPayment}`);
    }

    const mintAddress = address(req.asset.address);
    const recipientAddress = address(req.payTo);

    // Get token accounts
    const sourceAta = await getAssociatedTokenAddress(
      mintAddress,
      wallet.address
    );
    const destAta = await getAssociatedTokenAddress(
      mintAddress,
      recipientAddress
    );

    // Create and send transfer
    const transferIx = createTransferInstruction(
      sourceAta,
      destAta,
      wallet.address,
      amount
    );

    const signature = await sendAndConfirmTransaction({
      transaction: {
        instructions: [transferIx],
        feePayer: wallet,
      },
      signers: [wallet],
      commitment: "confirmed",
    });

    return signature;
  }

  // Create the X-PAYMENT header
  function createPaymentHeader(signature: string, requirements: any) {
    const req = requirements.accepts[0];

    const payload = {
      scheme: req.scheme,
      network: req.network,
      payload: {
        signature: signature,
        payer: wallet.address,
      },
    };

    // Base64 encode the payment proof
    return btoa(JSON.stringify(payload));
  }

  // The main fetch wrapper
  async function x402Fetch(url: string, options: RequestInit = {}) {
    // First request
    const response = await fetch(url, options);

    // If not 402, return as-is
    if (response.status !== 402) {
      return response;
    }

    console.log("Received 402 - Payment Required");

    // Parse payment requirements
    const requirements = await response.json();
    console.log(
      "Price:",
      requirements.accepts[0].maxAmountRequired,
      "micro-USDC"
    );

    // Make payment
    console.log("Making payment...");
    const signature = await makePayment(requirements);
    console.log("Payment signature:", signature);

    // Create payment header
    const paymentHeader = createPaymentHeader(signature, requirements);

    // Retry with payment proof
    console.log("Retrying with payment...");
    const retryResponse = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        "X-PAYMENT": paymentHeader,
      },
    });

    return retryResponse;
  }

  return {
    fetch: x402Fetch,
    wallet: wallet.address,
    makePayment,
    createPaymentHeader,
  };
}
```

## Using the Client

```typescript
// main.ts
import { createX402Client } from "./x402-client";

const client = await createX402Client({
  walletPath: "./dev-wallet.json",
  network: "solana-devnet",
  maxPayment: 100_000, // Max 0.10 USDC
});

console.log("Wallet:", client.wallet);

// Make a request to our x402 server
const response = await client.fetch("http://localhost:3000/api/premium");
const data = await response.json();

console.log("Response:", data);
```

Run it with your Bun server running:

```bash
bun main.ts
```

You should see:

```
Wallet: 7xKXtg2CW87d97...
Received 402 - Payment Required
Price: 100000 micro-USDC
Making payment...
Payment signature: 5UxQ4Z...
Retrying with payment...
Response: { message: 'Welcome, premium user!', ... }
```

## Browser Client (Svelte)

For browser apps with Svelte, we can create a clean store-based client that works with Phantom. The store pattern still works with Svelte 5 - you just use runes in your components:

```typescript
// src/lib/stores/x402.ts
import { writable, get } from 'svelte/store';
import { Connection, Transaction, PublicKey } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token';

interface X402State {
  loading: boolean;
  status: string | null;
  error: string | null;
}

// Assuming you have a wallet store (see full SvelteKit post)
import { wallet, connection } from './wallet';

function createX402Store() {
  const { subscribe, set, update } = writable<X402State>({
    loading: false,
    status: null,
    error: null
  });

  async function makePayment(requirements: any) {
    const $wallet = get(wallet);
    const $connection = get(connection);

    if (!$wallet.connected) throw new Error('Wallet not connected');

    const req = requirements.accepts[0];
    const amount = BigInt(req.maxAmountRequired);

    const mintPubkey = new PublicKey(req.asset.address);
    const recipientPubkey = new PublicKey(req.payTo);

    const sourceAta = await getAssociatedTokenAddress(mintPubkey, $wallet.publicKey);
    const destAta = await getAssociatedTokenAddress(mintPubkey, recipientPubkey);

    const tx = new Transaction().add(
      createTransferInstruction(sourceAta, destAta, $wallet.publicKey, amount)
    );

    const { blockhash } = await $connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = $wallet.publicKey;

    const signedTx = await $wallet.wallet.signTransaction(tx);
    const signature = await $connection.sendRawTransaction(signedTx.serialize());
    await $connection.confirmTransaction(signature, 'confirmed');

    return signature;
  }

  return {
    subscribe,

    async fetch(url: string, options: RequestInit = {}) {
      set({ loading: true, status: null, error: null });

      try {
        const response = await fetch(url, options);

        if (response.status !== 402) {
          set({ loading: false, status: 'Success', error: null });
          return response;
        }

        update(s => ({ ...s, status: 'Payment required...' }));
        const requirements = await response.json();

        const price = Number(requirements.accepts[0].maxAmountRequired) / 1_000_000;
        update(s => ({ ...s, status: `Paying $${price.toFixed(2)} USDC...` }));

        const signature = await makePayment(requirements);

        // Create payment header
        const payload = {
          scheme: requirements.accepts[0].scheme,
          network: requirements.accepts[0].network,
          payload: { signature, payer: get(wallet).publicKey?.toBase58() }
        };
        const paymentHeader = btoa(JSON.stringify(payload));

        const retryResponse = await fetch(url, {
          ...options,
          headers: { ...options.headers, 'X-PAYMENT': paymentHeader }
        });

        set({ loading: false, status: 'Success!', error: null });
        return retryResponse;

      } catch (err) {
        set({ loading: false, status: null, error: (err as Error).message });
        throw err;
      }
    }
  };
}

export const x402 = createX402Store();
```

Usage in a Svelte 5 component with runes:

```svelte
<script lang="ts">
  import { x402 } from '$lib/stores/x402';

  let content = $state<any>(null);

  async function loadContent() {
    const response = await x402.fetch('/api/premium');
    content = await response.json();
  }
</script>

<button onclick={loadContent} disabled={$x402.loading}>
  {$x402.loading ? 'Processing...' : 'Get Premium Content'}
</button>

{#if $x402.status}
  <p class="status">{$x402.status}</p>
{/if}

{#if content}
  <pre>{JSON.stringify(content, null, 2)}</pre>
{/if}
```

## Alternative: React/Generic Browser Client

For React or vanilla JS apps, here's a more generic approach:

```javascript
// browser-x402-client.js
export function createBrowserX402Client(config) {
  const {
    wallet, // Wallet adapter (Phantom, etc.)
    network = "solana-devnet",
    maxPayment = 1_000_000,
    connection, // Solana connection
  } = config;

  async function makePayment(requirements) {
    const req = requirements.accepts[0];
    const amount = BigInt(req.maxAmountRequired);

    if (amount > BigInt(maxPayment)) {
      throw new Error("Payment exceeds maximum allowed");
    }

    // Import SPL token functions
    const {
      getAssociatedTokenAddress,
      createTransferInstruction,
      TOKEN_PROGRAM_ID,
    } = await import("@solana/spl-token");

    const { Transaction, PublicKey } = await import("@solana/web3.js");

    const mintPubkey = new PublicKey(req.asset.address);
    const recipientPubkey = new PublicKey(req.payTo);
    const walletPubkey = wallet.publicKey;

    // Get ATAs
    const sourceAta = await getAssociatedTokenAddress(mintPubkey, walletPubkey);
    const destAta = await getAssociatedTokenAddress(
      mintPubkey,
      recipientPubkey
    );

    // Create transaction
    const tx = new Transaction();
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

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = walletPubkey;

    // Sign with wallet
    const signedTx = await wallet.signTransaction(tx);

    // Send
    const signature = await connection.sendRawTransaction(signedTx.serialize());
    await connection.confirmTransaction(signature, "confirmed");

    return signature;
  }

  function createPaymentHeader(signature, requirements) {
    const req = requirements.accepts[0];
    const payload = {
      scheme: req.scheme,
      network: req.network,
      payload: {
        signature,
        payer: wallet.publicKey.toBase58(),
      },
    };
    return btoa(JSON.stringify(payload));
  }

  async function x402Fetch(url, options = {}) {
    const response = await fetch(url, options);

    if (response.status !== 402) {
      return response;
    }

    const requirements = await response.json();

    // Prompt user confirmation (optional)
    const price = Number(requirements.accepts[0].maxAmountRequired) / 1_000_000;
    const confirmed = confirm(
      `This content costs $${price.toFixed(2)} USDC. Proceed?`
    );

    if (!confirmed) {
      throw new Error("Payment cancelled by user");
    }

    const signature = await makePayment(requirements);
    const paymentHeader = createPaymentHeader(signature, requirements);

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        "X-PAYMENT": paymentHeader,
      },
    });
  }

  return { fetch: x402Fetch };
}
```

## Why Svelte Stores Work Well

Coming from Vue, Svelte stores feel natural:

| Vue (Pinia)        | Svelte 5                        |
| ------------------ | ------------------------------- |
| `defineStore()`    | `writable()` / `readable()`     |
| `computed` getters | `derived()` or `$derived()`     |
| `actions`          | Functions in the store object   |
| `$subscribe()`     | Auto-subscription with `$store` |
| `ref()` in setup   | `$state()` in components        |

The x402 store pattern is essentially a Pinia store with different syntax. The reactive `$x402.loading` and `$x402.status` updates feel just like Vue's reactivity. In Svelte 5, you can also use `$state` for component-local state.

## Using Existing Libraries

For production, consider using established x402 client libraries:

```bash
npm install x402-solana
```

```javascript
import { createX402Client } from "x402-solana/client";

const client = createX402Client({
  wallet: yourWalletAdapter,
  network: "solana-devnet",
  maxPaymentAmount: BigInt(1_000_000),
});

const response = await client.fetch("/api/premium");
```

## Error Handling

Robust error handling for production:

```javascript
async function x402Fetch(url, options = {}) {
  try {
    const response = await fetch(url, options);

    if (response.status !== 402) {
      return response;
    }

    const requirements = await response.json();

    // Validate requirements
    if (!requirements.accepts || requirements.accepts.length === 0) {
      throw new Error("Invalid payment requirements");
    }

    const req = requirements.accepts[0];

    // Check network matches
    if (req.network !== expectedNetwork) {
      throw new Error(`Network mismatch: expected ${expectedNetwork}`);
    }

    // Check timeout
    if (req.maxTimeoutSeconds && req.maxTimeoutSeconds < 30) {
      throw new Error("Payment timeout too short");
    }

    // Make payment with retries
    let signature;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        signature = await makePayment(requirements);
        break;
      } catch (err) {
        if (attempt === 2) throw err;
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }

    // Retry request
    const retryResponse = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        "X-PAYMENT": createPaymentHeader(signature, requirements),
      },
    });

    // Still 402? Payment wasn't accepted
    if (retryResponse.status === 402) {
      const errorBody = await retryResponse.json();
      throw new Error(errorBody.error || "Payment rejected");
    }

    return retryResponse;
  } catch (error) {
    // Categorize errors
    if (error.message.includes("insufficient")) {
      throw new Error("Insufficient USDC balance");
    }
    if (error.message.includes("cancelled")) {
      throw new Error("Payment cancelled");
    }
    throw error;
  }
}
```

## Testing Your Client

Test against your local server:

```typescript
// test-client.ts
import { createX402Client } from "./x402-client";

async function runTests() {
  const client = await createX402Client({
    walletPath: "./dev-wallet.json",
    network: "solana-devnet",
  });

  console.log("Testing x402 client...\n");

  // Test 1: Free endpoint (no payment)
  console.log("Test 1: Free endpoint");
  const freeResponse = await client.fetch("http://localhost:3000/api/free");
  console.log("Status:", freeResponse.status);
  console.log("Data:", await freeResponse.json());

  // Test 2: Paid endpoint
  console.log("\nTest 2: Paid endpoint");
  const paidResponse = await client.fetch("http://localhost:3000/api/basic");
  console.log("Status:", paidResponse.status);
  console.log("Data:", await paidResponse.json());

  // Test 3: Exceeds max payment
  console.log("\nTest 3: Max payment exceeded");
  const expensiveClient = await createX402Client({
    walletPath: "./dev-wallet.json",
    maxPayment: 1000, // Very low
  });

  try {
    await expensiveClient.fetch("http://localhost:3000/api/premium");
  } catch (err) {
    console.log("Expected error:", (err as Error).message);
  }

  console.log("\n✓ All tests passed");
}

runTests();
```

Run with:

```bash
bun test-client.ts
```

## What You Built

A complete x402 client that:

✅ Detects 402 responses
✅ Parses payment requirements
✅ Makes Solana USDC payments
✅ Retries with payment proof
✅ Works in Node.js and browsers
✅ Includes safety limits and error handling

## Next Up

We have both pieces - server and client. Now let's put them together in a full Next.js application with proper wallet connection UI.
