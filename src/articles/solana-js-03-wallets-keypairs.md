---
title: "Wallets and Keypairs: The Solana Identity System"
description: "Understanding public keys, private keys, and wallets. Create your first Solana keypair and get devnet SOL."
tags: ["solana", "javascript", "web3", "wallets"]
pubDate: "2025-12-04T10:00:00Z"
link: "solana-js-03-wallets-keypairs"
series: "solana-for-js-devs"
seriesOrder: 3
---

In the last post, we read data from Solana. Now we need an identity to write data - a wallet.

If you've ever dealt with JWT tokens, API keys, or SSH keys, the concepts here will feel familiar. Just with different terminology.

## The Mental Model

A Solana "wallet" is really just a keypair:

**Private key** - A secret number that proves you own an account. Never share it.

**Public key** - Derived from the private key. This is your "address" - the identifier others use to send you tokens.

It's exactly like SSH keys. The private key stays on your machine. The public key can be shared freely.

```
Private Key ──derives──> Public Key (Address)
    │
    └── Signs transactions to prove ownership
```

## Creating a Keypair

Let's generate one:

```javascript
import { generateKeyPair } from "gill";

// Generate a new random keypair
const keypair = await generateKeyPair();

console.log("Address:", keypair.address);
// Something like: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
```

That address is now yours. It doesn't exist "on the blockchain" until someone sends it tokens or you use it in a transaction - but it's mathematically valid.

## Keypairs vs Signers

The new Solana libraries introduce a concept called "signers" - objects that can sign transactions. A `KeyPairSigner` is a signer backed by a private key:

```javascript
import { generateKeyPairSigner } from "gill";

const signer = await generateKeyPairSigner();

console.log("Address:", signer.address);
// Can sign transactions with signer.signTransactions()
```

The difference matters:

- **Keypair** - Raw cryptographic key material
- **KeyPairSigner** - A keypair wrapped with signing capabilities

For most web development, you'll work with signers.

## Saving and Loading Keypairs

⚠️ **Security warning:** Never commit private keys to git. Never log them. Never send them over the network.

For development, you can save keypairs to a JSON file (like the Solana CLI does):

```javascript
import {
  generateKeyPairSigner,
  loadKeypairSignerFromFile,
  getBase58Codec,
} from "gill";
import { writeFileSync, existsSync } from "fs";

const WALLET_PATH = "./dev-wallet.json";

async function getOrCreateWallet() {
  if (existsSync(WALLET_PATH)) {
    // Load existing wallet
    return loadKeypairSignerFromFile(WALLET_PATH);
  }

  // Create new wallet
  const signer = await generateKeyPairSigner();

  // Save as JSON array of bytes (Solana CLI format)
  const secretKey = signer.keyPair.secretKey;
  writeFileSync(WALLET_PATH, JSON.stringify(Array.from(secretKey)));

  console.log("Created new wallet:", signer.address);
  return signer;
}

const wallet = await getOrCreateWallet();
console.log("Wallet address:", wallet.address);
```

Add `dev-wallet.json` to your `.gitignore` immediately:

```bash
echo "dev-wallet.json" >> .gitignore
```

## Getting Devnet SOL

Your wallet exists but has no SOL. Let's fix that with an airdrop - free test tokens from the faucet.

```javascript
import {
  createSolanaClient,
  generateKeyPairSigner,
  lamportsToSol,
  solToLamports,
} from "gill";

const { rpc } = createSolanaClient({ urlOrMoniker: "devnet" });
const wallet = await generateKeyPairSigner();

console.log("Wallet:", wallet.address);

// Request 1 SOL airdrop
const signature = await rpc
  .requestAirdrop(
    wallet.address,
    solToLamports(1) // 1 SOL in lamports
  )
  .send();

console.log("Airdrop signature:", signature);

// Wait a moment for confirmation
await new Promise((r) => setTimeout(r, 2000));

// Check balance
const balance = await rpc.getBalance(wallet.address).send();
console.log("Balance:", lamportsToSol(balance.value), "SOL");
```

Run this and you should see:

```
Wallet: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
Airdrop signature: 5UxQ...
Balance: 1 SOL
```

You now have 1 SOL on devnet to experiment with.

## Web Faucets

The programmatic airdrop is rate-limited. If you hit limits, use web faucets:

- [Sol Faucet](https://faucet.solana.com)
- Paste your wallet address, select devnet, click "Airdrop"

## Understanding Addresses

Solana addresses are Base58-encoded public keys. They're:

- 32-44 characters long
- Case-sensitive
- Contain no ambiguous characters (no 0, O, I, l)

```javascript
import { address, isAddress } from "gill";

// Create an address from a string
const addr = address("7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU");

// Validate an address
console.log(isAddress("7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU")); // true
console.log(isAddress("not-valid")); // false
```

## Keypair Security Mental Model

Think of keypairs like this:

| Concept               | What it's like               |
| --------------------- | ---------------------------- |
| Private key           | Password + username combined |
| Public key            | Email address                |
| Signing a transaction | Logging in                   |
| Wallet                | Password manager             |

The key insight: there's no "forgot password" flow. If you lose your private key, those tokens are gone forever. If someone else gets your private key, they control the account completely.

## Environment Variables for Production

For real applications, use environment variables:

```javascript
// Load from environment
const privateKeyBytes = JSON.parse(process.env.SOLANA_PRIVATE_KEY);
const keypair = await createKeyPairFromBytes(privateKeyBytes);
```

## A Complete Example

Here's a script that creates or loads a wallet and ensures it has devnet SOL:

```javascript
import {
  createSolanaClient,
  loadKeypairSignerFromFile,
  generateKeyPairSigner,
  lamportsToSol,
  solToLamports,
} from "gill";
import { writeFileSync, existsSync } from "fs";

const WALLET_PATH = "./dev-wallet.json";
const MIN_BALANCE = 0.5; // SOL

async function main() {
  const { rpc } = createSolanaClient({ urlOrMoniker: "devnet" });

  // Load or create wallet
  let wallet;
  if (existsSync(WALLET_PATH)) {
    wallet = await loadKeypairSignerFromFile(WALLET_PATH);
    console.log("Loaded wallet:", wallet.address);
  } else {
    wallet = await generateKeyPairSigner();
    const secretKey = wallet.keyPair.secretKey;
    writeFileSync(WALLET_PATH, JSON.stringify(Array.from(secretKey)));
    console.log("Created wallet:", wallet.address);
  }

  // Check balance
  const balance = await rpc.getBalance(wallet.address).send();
  const solBalance = lamportsToSol(balance.value);
  console.log("Balance:", solBalance, "SOL");

  // Airdrop if needed
  if (solBalance < MIN_BALANCE) {
    console.log("Requesting airdrop...");
    try {
      await rpc.requestAirdrop(wallet.address, solToLamports(1)).send();
      console.log("Airdrop requested! Wait a few seconds and run again.");
    } catch (e) {
      console.log(
        "Airdrop failed (rate limited). Use https://faucet.solana.com"
      );
    }
  }
}

main().catch(console.error);
```

## What You Learned

- Keypairs are public/private key pairs (like SSH keys)
- The public key is your address
- Signers are keypairs that can sign transactions
- Devnet has free test SOL via airdrops
- Never share or commit private keys

## Next Up

We have a wallet with SOL. Now let's understand what we can actually read from the blockchain - the account model that makes Solana unique.

---

Next: [Reading Data from Solana: Accounts Explained](/articles/solana-js-04-accounts-explained)
