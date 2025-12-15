---
title: "Signing Messages and Transactions in the Browser"
description: "Learn to sign messages for authentication and build transactions that users approve through their wallet."
tags: ["solana", "svelte", "web3", "transactions", "signing"]
pubDate: "2025-12-04T13:00:00Z"
series: "solana-for-js-devs"
seriesOrder: 9
---

We can connect wallets. Now let's use them for something real - signing messages and transactions.

## Two Types of Signing

**Message Signing** - Prove you own a wallet without spending anything. Used for authentication, off-chain signatures.

**Transaction Signing** - Approve a blockchain transaction. Costs fees, changes state.

```
Message Signing:              Transaction Signing:
┌─────────────┐              ┌─────────────┐
│ "Login msg" │              │ Transfer 1  │
│             │──sign──▶     │ SOL to Bob  │──sign──▶ Blockchain
│ No fees     │              │ Costs fees  │
└─────────────┘              └─────────────┘
```

## Signing Messages

Message signing is perfect for authentication - "prove you own this wallet":

```typescript
// src/lib/utils/signing.ts
import { wallet } from "$lib/stores/wallet";
import { get } from "svelte/store";

export async function signMessage(message: string): Promise<string | null> {
  const $wallet = get(wallet);

  if (!$wallet.connected || !$wallet.wallet) {
    throw new Error("Wallet not connected");
  }

  try {
    // Encode message as bytes
    const encodedMessage = new TextEncoder().encode(message);

    // Request signature from wallet
    const { signature } = await $wallet.wallet.signMessage(encodedMessage);

    // Convert to base58 string
    return bs58.encode(signature);
  } catch (err) {
    console.error("Signing failed:", err);
    return null;
  }
}
```

You'll need the `bs58` package:

```bash
bun add bs58
```

### Sign-In With Solana (SIWS)

A common pattern is "Sign-In With Solana" - like "Sign-In With Ethereum" but for Solana:

```typescript
// Create a sign-in message
function createSignInMessage(domain: string, address: string): string {
  const now = new Date().toISOString();
  const nonce = crypto.randomUUID();

  return `${domain} wants you to sign in with your Solana account:
${address}

Sign this message to prove you own this wallet.

URI: https://${domain}
Nonce: ${nonce}
Issued At: ${now}`;
}

// Usage in a component
async function signIn() {
  const address = get(walletAddress);
  if (!address) return;

  const message = createSignInMessage("myapp.com", address);
  const signature = await signMessage(message);

  if (signature) {
    // Send to your backend to verify
    const response = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, signature, address }),
    });

    // Handle auth response...
  }
}
```

### Verifying Signatures (Server-Side)

On your Bun server, verify the signature:

```typescript
// server.ts
import nacl from "tweetnacl";
import bs58 from "bs58";

function verifySignature(
  message: string,
  signature: string,
  publicKey: string
): boolean {
  try {
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(signature);
    const publicKeyBytes = bs58.decode(publicKey);

    return nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes
    );
  } catch {
    return false;
  }
}

// In your route handler
const isValid = verifySignature(message, signature, address);
```

## Signing Transactions

Transaction signing is where real blockchain interaction happens. Let's build a "Send SOL" component:

```svelte
<!-- src/lib/components/SendSol.svelte -->
<script lang="ts">
  import { wallet, connection } from '$lib/stores/wallet';
  import {
    Transaction,
    SystemProgram,
    PublicKey,
    LAMPORTS_PER_SOL
  } from '@solana/web3.js';

  let recipient = $state('');
  let amount = $state('');
  let sending = $state(false);
  let txSignature = $state<string | null>(null);
  let error = $state<string | null>(null);

  async function sendSol() {
    if (!$wallet.wallet || !$wallet.publicKey) return;

    sending = true;
    error = null;
    txSignature = null;

    try {
      // Validate recipient
      let recipientPubkey: PublicKey;
      try {
        recipientPubkey = new PublicKey(recipient);
      } catch {
        throw new Error('Invalid recipient address');
      }

      // Create transfer instruction
      const lamports = parseFloat(amount) * LAMPORTS_PER_SOL;

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: $wallet.publicKey,
          toPubkey: recipientPubkey,
          lamports
        })
      );

      // Get recent blockhash
      const { blockhash } = await $connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = $wallet.publicKey;

      // Request signature from wallet (shows popup)
      const signedTx = await $wallet.wallet.signTransaction(transaction);

      // Send the signed transaction
      const signature = await $connection.sendRawTransaction(
        signedTx.serialize()
      );

      // Wait for confirmation
      await $connection.confirmTransaction(signature, 'confirmed');

      txSignature = signature;
      recipient = '';
      amount = '';

    } catch (err) {
      error = (err as Error).message;
    } finally {
      sending = false;
    }
  }
</script>

<div class="send-form">
  <h3>Send SOL</h3>

  <input
    type="text"
    bind:value={recipient}
    placeholder="Recipient address"
    disabled={sending}
  />

  <input
    type="number"
    bind:value={amount}
    placeholder="Amount (SOL)"
    step="0.01"
    min="0"
    disabled={sending}
  />

  <button onclick={sendSol} disabled={sending || !recipient || !amount}>
    {sending ? 'Sending...' : 'Send SOL'}
  </button>

  {#if error}
    <p class="error">{error}</p>
  {/if}

  {#if txSignature}
    <p class="success">
      Sent!
      <a
        href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
        target="_blank"
      >
        View transaction
      </a>
    </p>
  {/if}
</div>

<style>
  .send-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 400px;
  }

  input {
    padding: 0.75rem;
    border: 1px solid #333;
    border-radius: 0.5rem;
    background: #1a1a2e;
    color: white;
    font-size: 1rem;
  }

  input::placeholder {
    color: #666;
  }

  button {
    padding: 0.75rem;
    background: #14F195;
    color: #000;
    border: none;
    border-radius: 0.5rem;
    font-weight: 600;
    cursor: pointer;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .error {
    color: #f87171;
  }

  .success {
    color: #14F195;
  }

  .success a {
    color: #9945FF;
  }
</style>
```

## The Transaction Flow

When `signTransaction()` is called:

1. Phantom shows a popup with transaction details
2. User sees what they're approving (recipient, amount, fees)
3. User clicks "Approve" or "Reject"
4. If approved, Phantom signs and returns the signed transaction
5. Your app sends it to the network

```
Your App                 Phantom                 Solana
   │                        │                       │
   │── signTransaction() ──▶│                       │
   │                        │                       │
   │                    [User sees popup]           │
   │                    [User approves]             │
   │                        │                       │
   │◀── signed tx ─────────│                       │
   │                        │                       │
   │── sendRawTransaction() ───────────────────────▶│
   │                        │                       │
   │◀── signature ─────────────────────────────────│
```

## Signing Multiple Transactions

For batch operations, sign multiple at once:

```typescript
async function batchTransfer(transfers: { to: string; amount: number }[]) {
  if (!$wallet.wallet || !$wallet.publicKey) return;

  const transactions = await Promise.all(
    transfers.map(async ({ to, amount }) => {
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: $wallet.publicKey!,
          toPubkey: new PublicKey(to),
          lamports: amount * LAMPORTS_PER_SOL,
        })
      );

      const { blockhash } = await $connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = $wallet.publicKey;

      return tx;
    })
  );

  // Sign all at once (one popup for all)
  const signedTxs = await $wallet.wallet.signAllTransactions(transactions);

  // Send all
  const signatures = await Promise.all(
    signedTxs.map((tx) => $connection.sendRawTransaction(tx.serialize()))
  );

  return signatures;
}
```

## Simulating Before Sending

Always simulate transactions before asking users to sign:

```typescript
async function simulateAndSend(transaction: Transaction) {
  // Simulate first
  const simulation = await $connection.simulateTransaction(transaction);

  if (simulation.value.err) {
    throw new Error(
      `Simulation failed: ${JSON.stringify(simulation.value.err)}`
    );
  }

  // If simulation passes, sign and send
  const signedTx = await $wallet.wallet.signTransaction(transaction);
  const signature = await $connection.sendRawTransaction(signedTx.serialize());

  return signature;
}
```

This prevents embarrassing failures where users approve a transaction that was never going to work.

## Common Errors

| Error                   | Cause                 | Solution                        |
| ----------------------- | --------------------- | ------------------------------- |
| "User rejected"         | User clicked reject   | Handle gracefully, don't retry  |
| "Blockhash expired"     | Too slow              | Fetch new blockhash, rebuild tx |
| "Insufficient funds"    | Not enough SOL        | Check balance first             |
| "Transaction too large" | Too many instructions | Split into multiple txs         |

## What You Learned

- Message signing for authentication (no fees)
- Transaction signing for blockchain operations
- Building a send form in Svelte
- The wallet popup approval flow
- Simulating before sending
- Batch signing

## Next Up

We've been working with the System Program (SOL transfers). Now let's understand Solana programs more broadly - what they are and how to interact with them.
