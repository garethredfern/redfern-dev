---
title: "Building a Wallet Connect Component"
description: "Create a reusable Svelte wallet connection component with reactive state, auto-reconnect, and clean UX."
tags: ["solana", "svelte", "web3", "wallets", "component"]
pubDate: "2025-12-04T12:30:00Z"
series: "solana-for-js-devs"
seriesOrder: 8
---

Let's build a proper wallet connection system in Svelte. We'll create a reactive store and a reusable component that handles:

- Detecting installed wallets
- Connecting/disconnecting
- Auto-reconnecting on page load
- Displaying connection state

Coming from Vue, Svelte's stores will feel familiar - they're like Pinia but simpler.

## The Wallet Store

First, create a store that manages wallet state:

```typescript
// src/lib/stores/wallet.ts
import { writable, derived } from "svelte/store";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { browser } from "$app/environment";

// Types
interface WalletState {
  connected: boolean;
  connecting: boolean;
  publicKey: PublicKey | null;
  wallet: PhantomProvider | null;
}

interface PhantomProvider {
  isPhantom: boolean;
  isConnected: boolean;
  publicKey: PublicKey | null;
  connect(opts?: {
    onlyIfTrusted?: boolean;
  }): Promise<{ publicKey: PublicKey }>;
  disconnect(): Promise<void>;
  signTransaction(tx: any): Promise<any>;
  signAllTransactions(txs: any[]): Promise<any[]>;
  signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }>;
  on(event: string, callback: (...args: any[]) => void): void;
  off(event: string, callback: (...args: any[]) => void): void;
}

// Helper to get Phantom
function getPhantom(): PhantomProvider | null {
  if (!browser) return null;
  const phantom = (window as any).phantom?.solana;
  return phantom?.isPhantom ? phantom : null;
}

// Create the store
function createWalletStore() {
  const { subscribe, set, update } = writable<WalletState>({
    connected: false,
    connecting: false,
    publicKey: null,
    wallet: null,
  });

  // Event handlers
  function handleConnect(publicKey: PublicKey) {
    update((state) => ({
      ...state,
      connected: true,
      connecting: false,
      publicKey,
    }));
  }

  function handleDisconnect() {
    set({
      connected: false,
      connecting: false,
      publicKey: null,
      wallet: null,
    });
  }

  function handleAccountChanged(publicKey: PublicKey | null) {
    if (publicKey) {
      update((state) => ({ ...state, publicKey }));
    } else {
      handleDisconnect();
    }
  }

  return {
    subscribe,

    // Initialize - call on app mount
    init() {
      if (!browser) return;

      const phantom = getPhantom();
      if (!phantom) return;

      // Set up listeners
      phantom.on("connect", handleConnect);
      phantom.on("disconnect", handleDisconnect);
      phantom.on("accountChanged", handleAccountChanged);

      // Check if already connected
      if (phantom.isConnected && phantom.publicKey) {
        set({
          connected: true,
          connecting: false,
          publicKey: phantom.publicKey,
          wallet: phantom,
        });
      }
    },

    // Connect with popup
    async connect() {
      const phantom = getPhantom();

      if (!phantom) {
        window.open("https://phantom.app/", "_blank");
        return;
      }

      update((state) => ({ ...state, connecting: true }));

      try {
        const { publicKey } = await phantom.connect();
        set({
          connected: true,
          connecting: false,
          publicKey,
          wallet: phantom,
        });
      } catch (err) {
        update((state) => ({ ...state, connecting: false }));
        console.error("Failed to connect:", err);
      }
    },

    // Try to reconnect silently
    async reconnect() {
      const phantom = getPhantom();
      if (!phantom) return;

      try {
        const { publicKey } = await phantom.connect({ onlyIfTrusted: true });
        set({
          connected: true,
          connecting: false,
          publicKey,
          wallet: phantom,
        });
      } catch {
        // User hasn't approved - that's fine
      }
    },

    // Disconnect
    async disconnect() {
      const phantom = getPhantom();
      if (phantom) {
        await phantom.disconnect();
      }
      handleDisconnect();
    },

    // Check if Phantom is installed
    isPhantomInstalled() {
      return getPhantom() !== null;
    },
  };
}

export const wallet = createWalletStore();

// Derived stores for convenience
export const connected = derived(wallet, ($wallet) => $wallet.connected);
export const publicKey = derived(wallet, ($wallet) => $wallet.publicKey);
export const walletAddress = derived(
  wallet,
  ($wallet) => $wallet.publicKey?.toBase58() ?? null
);

// Connection store
export const connection = derived(
  wallet,
  () => new Connection(clusterApiUrl("devnet"), "confirmed")
);
```

## The Wallet Button Component

Now create a reusable button component:

```svelte
<!-- src/lib/components/WalletButton.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { wallet, walletAddress } from '$lib/stores/wallet';

  // Truncate address for display
  function truncate(address: string): string {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }

  onMount(() => {
    wallet.init();
    wallet.reconnect();
  });
</script>

<div class="wallet-button">
  {#if $wallet.connected && $walletAddress}
    <div class="connected">
      <span class="address">{truncate($walletAddress)}</span>
      <button class="disconnect" on:click={() => wallet.disconnect()}>
        Disconnect
      </button>
    </div>
  {:else}
    <button
      class="connect"
      on:click={() => wallet.connect()}
      disabled={$wallet.connecting}
    >
      {#if $wallet.connecting}
        Connecting...
      {:else}
        Connect Wallet
      {/if}
    </button>
  {/if}
</div>

<style>
  .wallet-button {
    display: inline-block;
  }

  .connect {
    background: linear-gradient(135deg, #9945FF 0%, #14F195 100%);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.1s;
  }

  .connect:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  .connect:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .connected {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: #1a1a2e;
    padding: 0.5rem 0.75rem 0.5rem 1rem;
    border-radius: 0.5rem;
    border: 1px solid #333;
  }

  .address {
    font-family: 'SF Mono', Monaco, monospace;
    color: #14F195;
    font-size: 0.9rem;
  }

  .disconnect {
    background: transparent;
    color: #888;
    border: 1px solid #444;
    padding: 0.4rem 0.75rem;
    border-radius: 0.25rem;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .disconnect:hover {
    color: #fff;
    border-color: #666;
  }
</style>
```

## Using the Component

In your page or layout:

```svelte
<!-- src/routes/+page.svelte -->
<script>
  import WalletButton from '$lib/components/WalletButton.svelte';
  import { wallet, walletAddress } from '$lib/stores/wallet';
</script>

<header>
  <h1>My Solana App</h1>
  <WalletButton />
</header>

<main>
  {#if $wallet.connected}
    <p>Welcome! Your address is {$walletAddress}</p>
    <!-- Show authenticated content -->
  {:else}
    <p>Please connect your wallet to continue.</p>
  {/if}
</main>
```

## Adding Balance Display

Let's extend the component to show SOL balance:

```svelte
<!-- src/lib/components/WalletButton.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { wallet, walletAddress, connection } from '$lib/stores/wallet';
  import { LAMPORTS_PER_SOL } from '@solana/web3.js';

  let balance: number | null = null;

  function truncate(address: string): string {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }

  async function fetchBalance() {
    if (!$wallet.publicKey) {
      balance = null;
      return;
    }

    try {
      const lamports = await $connection.getBalance($wallet.publicKey);
      balance = lamports / LAMPORTS_PER_SOL;
    } catch (err) {
      console.error('Failed to fetch balance:', err);
      balance = null;
    }
  }

  // Fetch balance when connected
  $: if ($wallet.connected) {
    fetchBalance();
  } else {
    balance = null;
  }

  onMount(() => {
    wallet.init();
    wallet.reconnect();
  });
</script>

<div class="wallet-button">
  {#if $wallet.connected && $walletAddress}
    <div class="connected">
      {#if balance !== null}
        <span class="balance">{balance.toFixed(2)} SOL</span>
      {/if}
      <span class="address">{truncate($walletAddress)}</span>
      <button class="disconnect" on:click={() => wallet.disconnect()}>
        ×
      </button>
    </div>
  {:else}
    <button
      class="connect"
      on:click={() => wallet.connect()}
      disabled={$wallet.connecting}
    >
      {$wallet.connecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  {/if}
</div>

<style>
  /* ... previous styles ... */

  .balance {
    color: #888;
    font-size: 0.85rem;
    padding-right: 0.5rem;
    border-right: 1px solid #333;
  }
</style>
```

## Comparison to Vue

If you're coming from Vue, here's how Svelte compares:

| Vue 3                     | Svelte                      |
| ------------------------- | --------------------------- |
| `ref(false)`              | `writable(false)`           |
| `computed(() => ...)`     | `derived(store, ...)`       |
| `watch(source, callback)` | `$: if (condition) { ... }` |
| `onMounted(() => ...)`    | `onMount(() => ...)`        |
| `<template v-if="">`      | `{#if }{/if}`               |
| `:class="{ active }"`     | `class:active`              |
| `@click="handler"`        | `on:click={handler}`        |

The mental model is very similar. Svelte just has less boilerplate.

## Handling Multiple Wallets

To support multiple wallets (Phantom, Solflare, etc.), you'd extend the store:

```typescript
// Detect all available wallets
function getAvailableWallets() {
  const wallets = [];

  if ((window as any).phantom?.solana?.isPhantom) {
    wallets.push({ name: "Phantom", provider: (window as any).phantom.solana });
  }

  if ((window as any).solflare?.isSolflare) {
    wallets.push({ name: "Solflare", provider: (window as any).solflare });
  }

  // Add more wallets...

  return wallets;
}
```

For production apps, consider using the `@solana/wallet-adapter` libraries which handle all of this.

## What You Learned

- How to create a Svelte store for wallet state
- Building a reusable wallet button component
- Auto-reconnecting on page load
- Fetching and displaying balances
- Reactive updates with `$:` syntax

## Next Up

We can connect wallets. Now let's use them - signing messages and transactions in the browser.
