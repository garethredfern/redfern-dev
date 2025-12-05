---
title: "Your First Transaction: Sending SOL"
description: "Send your first Solana transaction - transferring SOL from one wallet to another. Understanding blockhashes, signatures, and confirmation."
tags: ["solana", "javascript", "web3", "transactions"]
pubDate: "2025-12-04T11:00:00Z"
series: "solana-for-js-devs"
seriesOrder: 5
---

We can read data. We have a wallet with SOL. Time to write to the blockchain - let's send some SOL.

## The Anatomy of a Transaction

A Solana transaction contains:

1. **Recent blockhash** - A timestamp that expires (prevents replay attacks)
2. **Instructions** - What you want to do (transfer, create account, etc.)
3. **Signatures** - Proof that the account owners approved this

```
Transaction
├── Recent Blockhash (expires in ~2 minutes)
├── Fee Payer (who pays the transaction fee)
├── Instructions[]
│   └── Program ID, Accounts, Data
└── Signatures[]
```

## A Simple Transfer

Let's send 0.1 SOL to another address:

```javascript
import {
  createSolanaClient,
  loadKeypairSignerFromFile,
  address,
  solToLamports,
  createTransferInstruction,
} from "gill";

const { rpc, sendAndConfirmTransaction } = createSolanaClient({
  urlOrMoniker: "devnet",
});

// Load your wallet
const wallet = await loadKeypairSignerFromFile("./dev-wallet.json");
console.log("From:", wallet.address);

// Destination address
const destination = address("PASTE_ANY_DEVNET_ADDRESS_HERE");

// Create the transfer instruction
const transferIx = createTransferInstruction({
  from: wallet,
  to: destination,
  lamports: solToLamports(0.1),
});

// Send and confirm
const signature = await sendAndConfirmTransaction({
  transaction: {
    instructions: [transferIx],
    feePayer: wallet,
  },
  signers: [wallet],
  commitment: "confirmed",
});

console.log("Transaction signature:", signature);
console.log(
  `Explorer: https://explorer.solana.com/tx/${signature}?cluster=devnet`
);
```

Run this and you'll see your transaction on the Solana Explorer.

## Breaking Down What Happened

### 1. Creating the Instruction

```javascript
const transferIx = createTransferInstruction({
  from: wallet,
  to: destination,
  lamports: solToLamports(0.1),
});
```

This creates an instruction for the System Program to transfer lamports. Under the hood, it's:

- Program: System Program (`11111111111111111111111111111111`)
- Accounts: [sender, receiver]
- Data: Transfer instruction with amount

### 2. Building the Transaction

```javascript
{
  instructions: [transferIx],
  feePayer: wallet,
}
```

The transaction bundles instructions together. The `feePayer` pays the network fee (typically 0.000005 SOL).

### 3. Signing

```javascript
signers: [wallet];
```

The wallet's private key signs the transaction, proving ownership of the sending account.

### 4. Sending and Confirming

```javascript
await sendAndConfirmTransaction({...})
```

This:

1. Gets a recent blockhash
2. Signs the transaction
3. Sends it to the network
4. Waits for confirmation

## Understanding Confirmation Levels

Solana has three confirmation levels:

| Level       | What it means              | Speed  |
| ----------- | -------------------------- | ------ |
| `processed` | Seen by one validator      | ~400ms |
| `confirmed` | Confirmed by supermajority | ~1-2s  |
| `finalized` | Cannot be rolled back      | ~30s   |

For most apps, `confirmed` is the right balance:

```javascript
const signature = await sendAndConfirmTransaction({
  // ...
  commitment: "confirmed", // default
});
```

## Manual Transaction Building

Sometimes you need more control. Here's the step-by-step version:

```javascript
import {
  createSolanaClient,
  loadKeypairSignerFromFile,
  address,
  solToLamports,
  createTransferInstruction,
  createTransaction,
  signTransaction,
  sendTransaction,
} from "gill";

const { rpc } = createSolanaClient({ urlOrMoniker: "devnet" });

const wallet = await loadKeypairSignerFromFile("./dev-wallet.json");
const destination = address("DESTINATION_ADDRESS");

// Step 1: Get recent blockhash
const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

// Step 2: Create instruction
const transferIx = createTransferInstruction({
  from: wallet,
  to: destination,
  lamports: solToLamports(0.1),
});

// Step 3: Build transaction
const transaction = createTransaction({
  version: 0, // Use versioned transactions
  feePayer: wallet.address,
  blockhash: latestBlockhash.blockhash,
  lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
  instructions: [transferIx],
});

// Step 4: Sign
const signedTx = await signTransaction([wallet], transaction);

// Step 5: Send
const signature = await rpc.sendTransaction(signedTx).send();

console.log("Sent! Signature:", signature);

// Step 6: Confirm (optional but recommended)
const confirmation = await rpc
  .confirmTransaction(signature, { commitment: "confirmed" })
  .send();

if (confirmation.value.err) {
  console.error("Transaction failed:", confirmation.value.err);
} else {
  console.log("Transaction confirmed!");
}
```

## Multiple Instructions in One Transaction

Transactions can contain multiple instructions that execute atomically (all succeed or all fail):

```javascript
const instructions = [
  // Transfer 0.1 SOL to address A
  createTransferInstruction({
    from: wallet,
    to: addressA,
    lamports: solToLamports(0.1),
  }),
  // Transfer 0.2 SOL to address B
  createTransferInstruction({
    from: wallet,
    to: addressB,
    lamports: solToLamports(0.2),
  }),
];

await sendAndConfirmTransaction({
  transaction: { instructions, feePayer: wallet },
  signers: [wallet],
});
```

Both transfers happen in a single transaction. If one fails, neither executes.

## Transaction Fees

Every transaction costs a base fee of 5000 lamports (0.000005 SOL). Priority fees can be added for faster processing during congestion:

```javascript
import { getComputeUnitPriceInstruction } from "gill";

// Add priority fee
const priorityFeeIx = getComputeUnitPriceInstruction({
  microLamports: 1000, // Price per compute unit
});

const instructions = [priorityFeeIx, transferIx];
```

On devnet, priority fees aren't necessary. On mainnet during high traffic, they help your transaction get processed faster.

## Error Handling

Transactions can fail for many reasons:

```javascript
try {
  const signature = await sendAndConfirmTransaction({
    transaction: { instructions: [transferIx], feePayer: wallet },
    signers: [wallet],
  });
  console.log("Success:", signature);
} catch (error) {
  if (error.message.includes("insufficient funds")) {
    console.error("Not enough SOL!");
  } else if (error.message.includes("blockhash not found")) {
    console.error("Transaction expired, try again");
  } else {
    console.error("Transaction failed:", error.message);
  }
}
```

Common errors:

- **Insufficient funds** - Not enough SOL to cover transfer + fee
- **Blockhash not found** - Transaction expired before confirmation
- **Account not found** - Destination doesn't exist (for some operations)
- **Simulation failed** - The transaction would fail if executed

## Checking Transaction Status

After sending, you can check the status:

```javascript
const status = await rpc.getSignatureStatuses([signature]).send();

const result = status.value[0];
if (result === null) {
  console.log("Transaction not found (maybe still processing)");
} else if (result.err) {
  console.log("Transaction failed:", result.err);
} else {
  console.log("Confirmations:", result.confirmations);
  console.log("Status:", result.confirmationStatus);
}
```

## Getting Transaction Details

Want the full transaction details after it confirms?

```javascript
const tx = await rpc
  .getTransaction(signature, {
    maxSupportedTransactionVersion: 0,
  })
  .send();

if (tx) {
  console.log("Slot:", tx.slot);
  console.log("Block time:", new Date(tx.blockTime * 1000));
  console.log("Fee:", tx.meta.fee, "lamports");
  console.log("Success:", tx.meta.err === null);
}
```

## Complete Working Example

Here's a full script that:

1. Loads your wallet
2. Creates a new random wallet
3. Sends it some SOL
4. Verifies the transfer

```javascript
import {
  createSolanaClient,
  loadKeypairSignerFromFile,
  generateKeyPairSigner,
  solToLamports,
  lamportsToSol,
  createTransferInstruction,
} from "gill";

async function main() {
  const { rpc, sendAndConfirmTransaction } = createSolanaClient({
    urlOrMoniker: "devnet",
  });

  // Load sender wallet
  const sender = await loadKeypairSignerFromFile("./dev-wallet.json");
  console.log("Sender:", sender.address);

  // Create fresh receiver
  const receiver = await generateKeyPairSigner();
  console.log("Receiver:", receiver.address);

  // Check sender balance
  const senderBalance = await rpc.getBalance(sender.address).send();
  console.log("Sender balance:", lamportsToSol(senderBalance.value), "SOL");

  // Send 0.05 SOL
  const amount = 0.05;
  console.log(`\nSending ${amount} SOL...`);

  const signature = await sendAndConfirmTransaction({
    transaction: {
      instructions: [
        createTransferInstruction({
          from: sender,
          to: receiver.address,
          lamports: solToLamports(amount),
        }),
      ],
      feePayer: sender,
    },
    signers: [sender],
    commitment: "confirmed",
  });

  console.log("✓ Transaction confirmed!");
  console.log("Signature:", signature);

  // Verify receiver balance
  const receiverBalance = await rpc.getBalance(receiver.address).send();
  console.log(
    "\nReceiver balance:",
    lamportsToSol(receiverBalance.value),
    "SOL"
  );

  console.log(`\nView on Explorer:`);
  console.log(`https://explorer.solana.com/tx/${signature}?cluster=devnet`);
}

main().catch(console.error);
```

## What You Learned

- Transactions contain blockhash, instructions, and signatures
- Instructions tell programs what to do
- Transactions are atomic - all or nothing
- Confirmation levels: processed < confirmed < finalized
- Transaction fees are tiny (~0.000005 SOL)
- Always handle errors and check confirmation

## Next Up

Sending SOL is great, but most real apps work with tokens - USDC, custom tokens, NFTs. Next post: working with SPL tokens.
