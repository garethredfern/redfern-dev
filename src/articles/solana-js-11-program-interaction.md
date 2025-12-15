---
title: "Interacting with Programs from Svelte"
description: "Build Svelte components that interact with Solana programs - token balances, transfers, and real-time updates."
tags: ["solana", "svelte", "web3", "tokens", "components"]
pubDate: "2025-12-04T14:00:00Z"
series: "solana-for-js-devs"
seriesOrder: 11
---

Let's build real Svelte components that interact with Solana programs. We'll create a token balance display, a transfer form, and real-time updates.

## Token Balance Store

First, a store that tracks token balances:

```typescript
// src/lib/stores/tokens.ts
import { writable, derived, get } from "svelte/store";
import { wallet, connection } from "./wallet";
import {
  getAssociatedTokenAddress,
  getAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";

// Known tokens on devnet
export const TOKENS = {
  USDC: {
    mint: new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"),
    symbol: "USDC",
    decimals: 6,
  },
};

interface TokenBalance {
  mint: string;
  symbol: string;
  balance: number;
  uiBalance: string;
  ata: string;
}

function createTokenStore() {
  const { subscribe, set, update } = writable<TokenBalance[]>([]);

  let refreshInterval: ReturnType<typeof setInterval> | null = null;

  async function fetchBalances() {
    const $wallet = get(wallet);
    const $connection = get(connection);

    if (!$wallet.publicKey) {
      set([]);
      return;
    }

    const balances: TokenBalance[] = [];

    for (const [key, token] of Object.entries(TOKENS)) {
      try {
        const ata = await getAssociatedTokenAddress(
          token.mint,
          $wallet.publicKey
        );

        const account = await getAccount($connection, ata);
        const balance = Number(account.amount);
        const uiBalance = (balance / Math.pow(10, token.decimals)).toFixed(2);

        balances.push({
          mint: token.mint.toBase58(),
          symbol: token.symbol,
          balance,
          uiBalance,
          ata: ata.toBase58(),
        });
      } catch (err) {
        // Account doesn't exist = 0 balance
        const ata = await getAssociatedTokenAddress(
          token.mint,
          $wallet.publicKey
        );

        balances.push({
          mint: token.mint.toBase58(),
          symbol: token.symbol,
          balance: 0,
          uiBalance: "0.00",
          ata: ata.toBase58(),
        });
      }
    }

    set(balances);
  }

  return {
    subscribe,

    refresh: fetchBalances,

    startPolling(intervalMs = 10000) {
      this.stopPolling();
      fetchBalances();
      refreshInterval = setInterval(fetchBalances, intervalMs);
    },

    stopPolling() {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
      }
    },
  };
}

export const tokenBalances = createTokenStore();

// Derived store for specific token
export function getTokenBalance(symbol: string) {
  return derived(
    tokenBalances,
    ($balances) => $balances.find((b) => b.symbol === symbol) ?? null
  );
}
```

## Token Balance Component

Display token balances:

```svelte
<!-- src/lib/components/TokenBalances.svelte -->
<script lang="ts">
  import { wallet } from '$lib/stores/wallet';
  import { tokenBalances } from '$lib/stores/tokens';

  // Start/stop polling based on wallet connection
  $effect(() => {
    if ($wallet.connected) {
      tokenBalances.startPolling();
    } else {
      tokenBalances.stopPolling();
    }

    // Cleanup on unmount
    return () => {
      tokenBalances.stopPolling();
    };
  });
</script>

{#if $wallet.connected}
  <div class="token-list">
    <h3>Token Balances</h3>

    {#if $tokenBalances.length === 0}
      <p class="loading">Loading...</p>
    {:else}
      {#each $tokenBalances as token}
        <div class="token-row">
          <span class="symbol">{token.symbol}</span>
          <span class="balance">{token.uiBalance}</span>
        </div>
      {/each}
    {/if}

    <button class="refresh" onclick={() => tokenBalances.refresh()}>
      Refresh
    </button>
  </div>
{/if}

<style>
  .token-list {
    background: #1a1a2e;
    border-radius: 0.75rem;
    padding: 1.5rem;
    min-width: 200px;
  }

  h3 {
    margin: 0 0 1rem 0;
    font-size: 0.9rem;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .token-row {
    display: flex;
    justify-content: space-between;
    padding: 0.75rem 0;
    border-bottom: 1px solid #333;
  }

  .token-row:last-of-type {
    border-bottom: none;
  }

  .symbol {
    font-weight: 600;
    color: #14F195;
  }

  .balance {
    font-family: 'SF Mono', monospace;
    color: #fff;
  }

  .loading {
    color: #666;
    font-style: italic;
  }

  .refresh {
    margin-top: 1rem;
    width: 100%;
    padding: 0.5rem;
    background: #333;
    border: none;
    border-radius: 0.5rem;
    color: #888;
    cursor: pointer;
  }

  .refresh:hover {
    background: #444;
    color: #fff;
  }
</style>
```

## Token Transfer Component

A form to send USDC:

```svelte
<!-- src/lib/components/SendToken.svelte -->
<script lang="ts">
  import { wallet, connection } from '$lib/stores/wallet';
  import { tokenBalances, TOKENS } from '$lib/stores/tokens';
  import {
    getAssociatedTokenAddress,
    createTransferInstruction,
    createAssociatedTokenAccountInstruction,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  } from '@solana/spl-token';
  import { Transaction, PublicKey } from '@solana/web3.js';

  let { tokenSymbol = 'USDC' } = $props();

  let recipient = $state('');
  let amount = $state('');
  let sending = $state(false);
  let error = $state<string | null>(null);
  let success = $state<string | null>(null);

  let token = $derived(TOKENS[tokenSymbol as keyof typeof TOKENS]);
  let balance = $derived($tokenBalances.find(t => t.symbol === tokenSymbol));

  async function send() {
    if (!$wallet.wallet || !$wallet.publicKey || !token) return;

    sending = true;
    error = null;
    success = null;

    try {
      // Validate recipient
      let recipientPubkey: PublicKey;
      try {
        recipientPubkey = new PublicKey(recipient);
      } catch {
        throw new Error('Invalid recipient address');
      }

      // Calculate amount in smallest units
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error('Invalid amount');
      }
      const amountInSmallestUnit = BigInt(
        Math.floor(amountNum * Math.pow(10, token.decimals))
      );

      // Check balance
      if (balance && amountInSmallestUnit > BigInt(balance.balance)) {
        throw new Error('Insufficient balance');
      }

      // Get ATAs
      const sourceAta = await getAssociatedTokenAddress(
        token.mint,
        $wallet.publicKey
      );
      const destAta = await getAssociatedTokenAddress(
        token.mint,
        recipientPubkey
      );

      // Build transaction
      const tx = new Transaction();

      // Check if destination ATA exists
      const destAccount = await $connection.getAccountInfo(destAta);
      if (!destAccount) {
        // Create it (sender pays)
        tx.add(
          createAssociatedTokenAccountInstruction(
            $wallet.publicKey,  // payer
            destAta,            // ata to create
            recipientPubkey,    // owner of new ata
            token.mint,         // token mint
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
          $wallet.publicKey,
          amountInSmallestUnit
        )
      );

      // Get blockhash and sign
      const { blockhash } = await $connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = $wallet.publicKey;

      const signedTx = await $wallet.wallet.signTransaction(tx);
      const signature = await $connection.sendRawTransaction(signedTx.serialize());
      await $connection.confirmTransaction(signature, 'confirmed');

      success = signature;
      recipient = '';
      amount = '';

      // Refresh balances
      tokenBalances.refresh();

    } catch (err) {
      error = (err as Error).message;
    } finally {
      sending = false;
    }
  }
</script>

<div class="send-form">
  <h3>Send {tokenSymbol}</h3>

  {#if balance}
    <p class="available">Available: {balance.uiBalance} {tokenSymbol}</p>
  {/if}

  <input
    type="text"
    bind:value={recipient}
    placeholder="Recipient wallet address"
    disabled={sending}
  />

  <div class="amount-row">
    <input
      type="number"
      bind:value={amount}
      placeholder="0.00"
      step="0.01"
      min="0"
      disabled={sending}
    />
    <span class="symbol">{tokenSymbol}</span>
  </div>

  <button
    onclick={send}
    disabled={sending || !recipient || !amount || !$wallet.connected}
  >
    {sending ? 'Sending...' : `Send ${tokenSymbol}`}
  </button>

  {#if error}
    <p class="error">{error}</p>
  {/if}

  {#if success}
    <p class="success">
      Sent!
      <a
        href={`https://explorer.solana.com/tx/${success}?cluster=devnet`}
        target="_blank"
      >
        View →
      </a>
    </p>
  {/if}
</div>

<style>
  .send-form {
    background: #1a1a2e;
    border-radius: 0.75rem;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  h3 {
    margin: 0;
    color: #fff;
  }

  .available {
    color: #888;
    font-size: 0.9rem;
    margin: 0;
  }

  input {
    padding: 0.75rem 1rem;
    background: #0f0f1a;
    border: 1px solid #333;
    border-radius: 0.5rem;
    color: #fff;
    font-size: 1rem;
  }

  input:focus {
    outline: none;
    border-color: #14F195;
  }

  .amount-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .amount-row input {
    flex: 1;
  }

  .amount-row .symbol {
    color: #888;
    font-weight: 600;
  }

  button {
    padding: 1rem;
    background: #14F195;
    color: #000;
    border: none;
    border-radius: 0.5rem;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .error {
    color: #f87171;
    margin: 0;
  }

  .success {
    color: #14F195;
    margin: 0;
  }

  .success a {
    color: #9945FF;
  }
</style>
```

## Real-Time Updates with WebSockets

For instant updates, subscribe to account changes:

```typescript
// src/lib/stores/tokens.ts - add to the store

async function subscribeToBalances() {
  const $wallet = get(wallet);
  const $connection = get(connection);

  if (!$wallet.publicKey) return;

  const subscriptionIds: number[] = [];

  for (const token of Object.values(TOKENS)) {
    const ata = await getAssociatedTokenAddress(token.mint, $wallet.publicKey);

    const subId = $connection.onAccountChange(
      ata,
      (accountInfo) => {
        // Account changed - refresh balances
        fetchBalances();
      },
      "confirmed"
    );

    subscriptionIds.push(subId);
  }

  return () => {
    // Cleanup function
    subscriptionIds.forEach((id) => {
      $connection.removeAccountChangeListener(id);
    });
  };
}
```

## Putting It Together

A complete token management page:

```svelte
<!-- src/routes/tokens/+page.svelte -->
<script>
  import WalletButton from '$lib/components/WalletButton.svelte';
  import TokenBalances from '$lib/components/TokenBalances.svelte';
  import SendToken from '$lib/components/SendToken.svelte';
  import { wallet } from '$lib/stores/wallet';
</script>

<svelte:head>
  <title>Token Manager</title>
</svelte:head>

<div class="container">
  <header>
    <h1>Token Manager</h1>
    <WalletButton />
  </header>

  {#if $wallet.connected}
    <main>
      <div class="grid">
        <TokenBalances />
        <SendToken tokenSymbol="USDC" />
      </div>
    </main>
  {:else}
    <div class="connect-prompt">
      <p>Connect your wallet to manage tokens</p>
    </div>
  {/if}
</div>

<style>
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  h1 {
    margin: 0;
  }

  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }

  .connect-prompt {
    text-align: center;
    padding: 4rem;
    color: #888;
  }

  @media (max-width: 640px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
</style>
```

## What You Learned

- Creating Svelte stores for token data
- Polling vs WebSocket subscriptions
- Building transfer forms with proper validation
- Checking and creating Associated Token Accounts
- Reactive updates when balances change

## Next Up

Things go wrong. Let's look at proper error handling and transaction confirmation patterns.
