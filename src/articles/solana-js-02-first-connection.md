---
title: "Your First Solana Connection: Hello Blockchain"
description: "Connect to Solana from Node.js and read your first data from the blockchain. No wallet needed - just JavaScript."
tags: ["solana", "javascript", "web3", "tutorial"]
pubDate: "2025-12-04T09:30:00Z"
link: "solana-js-02-first-connection"
series: "solana-for-js-devs"
seriesOrder: 2
---

Time to write some code. We're going to connect to Solana and read data from the blockchain. No wallet, no tokens, no complexity - just JavaScript talking to a distributed database.

## The Libraries

Solana's JavaScript ecosystem recently went through a major upgrade. Here's what you need to know:

**@solana/web3.js (v1.x)** - The legacy library. Still works, lots of tutorials use it, but it's in maintenance mode.

**@solana/kit** - The new modular approach. Tree-shakable, faster, modern JavaScript patterns. This is where active development happens.

**gill** - A convenience wrapper around @solana/kit that simplifies common operations. Great for learning.

We'll use `gill` because it has the cleanest API for getting started, but I'll point out when we're using patterns from the underlying libraries.

## Setup

We'll use Bun instead of Node - it's faster, has native TypeScript support, and better DX. If you don't have it:

```bash
curl -fsSL https://bun.sh/install | bash
```

Create a new project:

```bash
mkdir solana-learning
cd solana-learning
bun init -y
bun add gill
```

That's it. No `"type": "module"` needed - Bun handles ESM natively.

## Your First Connection

Create `index.ts`:

```typescript
import { createSolanaClient } from "gill";

// Connect to devnet (Solana's test network)
const { rpc } = createSolanaClient({
  urlOrMoniker: "devnet",
});

// Get the current slot (like a block number)
const slot = await rpc.getSlot().send();
console.log("Current slot:", slot);
```

Run it:

```bash
bun index.ts
```

You should see something like:

```
Current slot: 298547123
```

That's it. You just read data from a globally distributed network with three lines of code.

## Understanding What Just Happened

Let's break this down:

```javascript
const { rpc } = createSolanaClient({
  urlOrMoniker: "devnet",
});
```

This creates a connection to Solana's devnet - a test network where everything works like mainnet but tokens have no value. Perfect for learning.

The `urlOrMoniker` accepts:

- `"devnet"` - Test network with free tokens
- `"mainnet"` - Real network with real value
- `"testnet"` - Another test network (less used)
- `"localnet"` - Local validator for development
- Any full RPC URL for production use

```javascript
const slot = await rpc.getSlot().send();
```

Notice the `.send()` at the end. The new Solana libraries use a builder pattern - you construct the request, then explicitly send it. This enables batching and better TypeScript types.

## Reading More Data

Let's get some actually useful information:

```javascript
import { createSolanaClient } from "gill";

const { rpc } = createSolanaClient({
  urlOrMoniker: "devnet",
});

// Get latest blockhash (needed for transactions)
const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
console.log("Latest blockhash:", latestBlockhash.blockhash);

// Get cluster health
const health = await rpc.getHealth().send();
console.log("Cluster health:", health);

// Get current epoch info
const epochInfo = await rpc.getEpochInfo().send();
console.log("Current epoch:", epochInfo.epoch);
console.log("Slot in epoch:", epochInfo.slotIndex, "/", epochInfo.slotsInEpoch);
```

## Reading Account Data

Now let's read data from an actual account. On Solana, everything is an account - wallets, programs, data storage.

```javascript
import { createSolanaClient, address } from "gill";

const { rpc } = createSolanaClient({
  urlOrMoniker: "devnet",
});

// A well-known devnet account (Solana's system program)
const systemProgram = address("11111111111111111111111111111111");

const accountInfo = await rpc.getAccountInfo(systemProgram).send();
console.log("Account info:", accountInfo);
```

You'll see `null` for the data because the system program is special - it's a native program built into the runtime.

Let's try a real account with data:

```javascript
import { createSolanaClient, address } from "gill";

const { rpc } = createSolanaClient({
  urlOrMoniker: "devnet",
});

// The USDC mint address on devnet
const usdcMint = address("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

const accountInfo = await rpc.getAccountInfo(usdcMint).send();

if (accountInfo.value) {
  console.log("Owner:", accountInfo.value.owner);
  console.log("Lamports:", accountInfo.value.lamports);
  console.log("Data length:", accountInfo.value.data.length, "bytes");
}
```

## Checking a Wallet Balance

The most common read operation - checking how much SOL an address has:

```javascript
import { createSolanaClient, address, lamportsToSol } from "gill";

const { rpc } = createSolanaClient({
  urlOrMoniker: "devnet",
});

// Any wallet address
const wallet = address("DRpbCBMxVnDK7maPgWxXSa4Z4A8e3MQbSpWhdMpVRwFD");

const balance = await rpc.getBalance(wallet).send();

console.log("Balance in lamports:", balance.value);
console.log("Balance in SOL:", lamportsToSol(balance.value));
```

**Quick note on lamports:** SOL is divided into 1 billion lamports (like how dollars have cents). 1 SOL = 1,000,000,000 lamports.

## Error Handling

Network calls can fail. Here's how to handle it:

```javascript
import { createSolanaClient, address } from "gill";

const { rpc } = createSolanaClient({
  urlOrMoniker: "devnet",
});

try {
  const balance = await rpc.getBalance(address("invalid-address")).send();
} catch (error) {
  console.error("RPC error:", error.message);
}
```

## The RPC Methods You'll Use Most

Here's a quick reference of the methods that matter:

| Method                            | What it does                   |
| --------------------------------- | ------------------------------ |
| `getBalance(address)`             | Get SOL balance                |
| `getAccountInfo(address)`         | Get full account data          |
| `getLatestBlockhash()`            | Get blockhash for transactions |
| `getTransaction(signature)`       | Get transaction details        |
| `getTokenAccountBalance(address)` | Get SPL token balance          |
| `getSlot()`                       | Current slot number            |

## Production Considerations

Using `"devnet"` or `"mainnet"` connects to public RPC endpoints. These are rate-limited and not suitable for production.

For real apps, you'll want an RPC provider:

- Helius
- QuickNode
- Triton
- Alchemy

Just replace the moniker with a full URL:

```javascript
const { rpc } = createSolanaClient({
  urlOrMoniker: "https://your-provider.com/your-api-key",
});
```

## What's Different from Traditional APIs

A few things that might feel unfamiliar:

**No authentication** - The blockchain is public. Anyone can read any data. You don't need API keys to read.

**Immutable history** - Once data is written, it's there forever. You can query historical state.

**Deterministic addresses** - Accounts have addresses derived from cryptographic keys or program seeds. No UUIDs.

**Pay to write** - Reading is free, but writing costs transaction fees.

## What You Learned

- How to connect to Solana using gill
- The difference between devnet and mainnet
- Reading basic chain data (slots, blockhashes)
- Reading account information
- Checking wallet balances
- SOL vs lamports

## Next Up

We have a connection, but we can't do anything yet - we don't have a wallet. Next post, we'll create keypairs, understand addresses, and get some devnet SOL to play with.

---

Next: [Wallets and Keypairs](/articles/solana-js-03-wallets-keypairs)
