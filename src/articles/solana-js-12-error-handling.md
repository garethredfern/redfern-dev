---
title: "Error Handling and Transaction Confirmation"
description: "Handle Solana errors gracefully, implement proper confirmation patterns, and build resilient transaction flows."
tags: ["solana", "javascript", "web3", "errors", "transactions"]
pubDate: "2025-12-04T14:30:00Z"
series: "solana-for-js-devs"
seriesOrder: 12
---

Solana transactions fail. Networks are unreliable. Users reject signatures. Let's build robust error handling.

## Common Error Types

### 1. User Rejection

User clicked "Reject" in their wallet:

```typescript
try {
  const signedTx = await wallet.signTransaction(tx);
} catch (err) {
  if (err.message.includes("User rejected")) {
    // Don't retry - user said no
    return { error: "Transaction cancelled" };
  }
  throw err;
}
```

### 2. Insufficient Funds

Not enough SOL for fees or not enough tokens:

```typescript
try {
  await sendTransaction(tx);
} catch (err) {
  if (
    err.message.includes("insufficient funds") ||
    err.message.includes("Insufficient")
  ) {
    return { error: "Insufficient balance" };
  }
  throw err;
}
```

### 3. Blockhash Expired

Transaction took too long:

```typescript
try {
  await sendTransaction(tx);
} catch (err) {
  if (
    err.message.includes("block height exceeded") ||
    err.message.includes("Blockhash not found")
  ) {
    // Rebuild with fresh blockhash and retry
    return await retryWithFreshBlockhash();
  }
  throw err;
}
```

### 4. Network Errors

RPC node unreachable:

```typescript
try {
  await connection.getLatestBlockhash();
} catch (err) {
  if (
    err.message.includes("fetch failed") ||
    err.message.includes("NetworkError")
  ) {
    return { error: "Network unavailable. Please try again." };
  }
  throw err;
}
```

## A Robust Transaction Function

Here's a pattern for reliable transaction sending:

```typescript
// src/lib/utils/transactions.ts
import {
  Transaction,
  Connection,
  TransactionSignature,
  Commitment,
} from "@solana/web3.js";

interface TransactionResult {
  success: boolean;
  signature?: TransactionSignature;
  error?: string;
}

export async function sendAndConfirmWithRetry(
  connection: Connection,
  transaction: Transaction,
  signTransaction: (tx: Transaction) => Promise<Transaction>,
  options: {
    maxRetries?: number;
    commitment?: Commitment;
  } = {}
): Promise<TransactionResult> {
  const { maxRetries = 3, commitment = "confirmed" } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Always get fresh blockhash
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash(commitment);

      transaction.recentBlockhash = blockhash;

      // Sign
      const signedTx = await signTransaction(transaction);

      // Send
      const signature = await connection.sendRawTransaction(
        signedTx.serialize(),
        {
          skipPreflight: false,
          preflightCommitment: commitment,
        }
      );

      // Confirm with timeout
      const confirmation = await connection.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight,
        },
        commitment
      );

      if (confirmation.value.err) {
        throw new Error(
          `Transaction failed: ${JSON.stringify(confirmation.value.err)}`
        );
      }

      return { success: true, signature };
    } catch (err) {
      lastError = err as Error;

      // Don't retry user rejections
      if (lastError.message.includes("User rejected")) {
        return { success: false, error: "Transaction cancelled" };
      }

      // Don't retry insufficient funds
      if (lastError.message.includes("insufficient")) {
        return { success: false, error: "Insufficient balance" };
      }

      // Retry on blockhash/network errors
      if (attempt < maxRetries - 1) {
        console.log(`Attempt ${attempt + 1} failed, retrying...`);
        await sleep(1000 * (attempt + 1)); // Exponential backoff
        continue;
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || "Transaction failed",
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

## Simulating Before Sending

Always simulate to catch errors before bothering the user:

```typescript
async function simulateTransaction(
  connection: Connection,
  transaction: Transaction
): Promise<{ success: boolean; error?: string; logs?: string[] }> {
  try {
    const simulation = await connection.simulateTransaction(transaction);

    if (simulation.value.err) {
      // Parse the error
      const errorMessage = parseSimulationError(simulation.value.err);
      return {
        success: false,
        error: errorMessage,
        logs: simulation.value.logs ?? undefined,
      };
    }

    return {
      success: true,
      logs: simulation.value.logs ?? undefined,
    };
  } catch (err) {
    return {
      success: false,
      error: (err as Error).message,
    };
  }
}

function parseSimulationError(err: any): string {
  if (typeof err === "string") return err;

  // Common Solana program errors
  if (err.InstructionError) {
    const [index, instructionError] = err.InstructionError;

    if (typeof instructionError === "object") {
      if (instructionError.Custom !== undefined) {
        return `Program error ${instructionError.Custom} at instruction ${index}`;
      }
    }

    return `Instruction ${index} failed: ${JSON.stringify(instructionError)}`;
  }

  return JSON.stringify(err);
}
```

## Error Display Component

A Svelte component for user-friendly error display:

```svelte
<!-- src/lib/components/TransactionStatus.svelte -->
<script lang="ts">
  let {
    status,
    signature = null,
    error = null
  }: {
    status: 'idle' | 'signing' | 'sending' | 'confirming' | 'success' | 'error';
    signature?: string | null;
    error?: string | null;
  } = $props();

  const messages = {
    idle: '',
    signing: 'Please approve in your wallet...',
    sending: 'Sending transaction...',
    confirming: 'Confirming on chain...',
    success: 'Transaction confirmed!',
    error: 'Transaction failed'
  };
</script>

{#if status !== 'idle'}
  <div class="status" class:success={status === 'success'} class:error={status === 'error'}>
    <div class="message">
      {#if status === 'signing' || status === 'sending' || status === 'confirming'}
        <span class="spinner"></span>
      {/if}

      {#if status === 'error' && error}
        {error}
      {:else}
        {messages[status]}
      {/if}
    </div>

    {#if status === 'success' && signature}
      <a
        href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`}
        target="_blank"
        class="link"
      >
        View on Explorer →
      </a>
    {/if}
  </div>
{/if}

<style>
  .status {
    padding: 1rem;
    border-radius: 0.5rem;
    background: #1a1a2e;
    border: 1px solid #333;
  }

  .status.success {
    border-color: #14F195;
    background: rgba(20, 241, 149, 0.1);
  }

  .status.error {
    border-color: #f87171;
    background: rgba(248, 113, 113, 0.1);
  }

  .message {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid #333;
    border-top-color: #14F195;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .link {
    display: block;
    margin-top: 0.75rem;
    color: #9945FF;
    text-decoration: none;
  }

  .link:hover {
    text-decoration: underline;
  }
</style>
```

## Transaction Hook Pattern

Combine everything into a reusable pattern:

```typescript
// src/lib/stores/transaction.ts
import { writable, get } from "svelte/store";
import { connection, wallet } from "./wallet";
import type { Transaction } from "@solana/web3.js";

type TxStatus =
  | "idle"
  | "signing"
  | "sending"
  | "confirming"
  | "success"
  | "error";

interface TransactionState {
  status: TxStatus;
  signature: string | null;
  error: string | null;
}

export function createTransactionStore() {
  const { subscribe, set, update } = writable<TransactionState>({
    status: "idle",
    signature: null,
    error: null,
  });

  return {
    subscribe,

    reset() {
      set({ status: "idle", signature: null, error: null });
    },

    async send(transaction: Transaction): Promise<boolean> {
      const $wallet = get(wallet);
      const $connection = get(connection);

      if (!$wallet.wallet || !$wallet.publicKey) {
        set({
          status: "error",
          signature: null,
          error: "Wallet not connected",
        });
        return false;
      }

      try {
        // Get blockhash
        const { blockhash, lastValidBlockHeight } =
          await $connection.getLatestBlockhash("confirmed");

        transaction.recentBlockhash = blockhash;
        transaction.feePayer = $wallet.publicKey;

        // Simulate first
        const simulation = await $connection.simulateTransaction(transaction);
        if (simulation.value.err) {
          throw new Error(
            `Simulation failed: ${JSON.stringify(simulation.value.err)}`
          );
        }

        // Sign
        set({ status: "signing", signature: null, error: null });
        const signedTx = await $wallet.wallet.signTransaction(transaction);

        // Send
        set({ status: "sending", signature: null, error: null });
        const signature = await $connection.sendRawTransaction(
          signedTx.serialize(),
          { skipPreflight: true }
        );

        // Confirm
        set({ status: "confirming", signature, error: null });
        const confirmation = await $connection.confirmTransaction(
          { signature, blockhash, lastValidBlockHeight },
          "confirmed"
        );

        if (confirmation.value.err) {
          throw new Error("Transaction failed on chain");
        }

        set({ status: "success", signature, error: null });
        return true;
      } catch (err) {
        const error = (err as Error).message;

        // User-friendly error messages
        let friendlyError = error;
        if (error.includes("User rejected")) {
          friendlyError = "Transaction cancelled";
        } else if (error.includes("insufficient")) {
          friendlyError = "Insufficient balance";
        } else if (error.includes("block height")) {
          friendlyError = "Transaction expired. Please try again.";
        }

        set({ status: "error", signature: null, error: friendlyError });
        return false;
      }
    },
  };
}

export const transaction = createTransactionStore();
```

## Using the Transaction Store

```svelte
<script lang="ts">
  import { transaction } from '$lib/stores/transaction';
  import TransactionStatus from '$lib/components/TransactionStatus.svelte';
  import { Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
  import { wallet } from '$lib/stores/wallet';

  async function sendSol() {
    transaction.reset();

    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: $wallet.publicKey!,
        toPubkey: recipientPubkey,
        lamports: 0.1 * LAMPORTS_PER_SOL
      })
    );

    const success = await transaction.send(tx);

    if (success) {
      // Refresh balances, show success, etc.
    }
  }
</script>

<button onclick={sendSol} disabled={$transaction.status !== 'idle'}>
  Send 0.1 SOL
</button>

<TransactionStatus
  status={$transaction.status}
  signature={$transaction.signature}
  error={$transaction.error}
/>
```

## What You Learned

- Common Solana error types and how to handle them
- Simulating transactions before sending
- Retry patterns with exponential backoff
- User-friendly error messages
- Status tracking through the transaction lifecycle
- Building reusable transaction utilities

## Next Up

We've covered the foundations. Now we bring it all together with x402 - building pay-per-request APIs and clients.
