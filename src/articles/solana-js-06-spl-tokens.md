---
title: "Working with SPL Tokens (USDC)"
description: "Learn to work with SPL tokens - the standard for fungible tokens on Solana. Check balances, create token accounts, and transfer USDC."
tags: ["solana", "javascript", "web3", "tokens", "usdc"]
pubDate: "2025-12-04T11:30:00Z"
series: "solana-for-js-devs"
seriesOrder: 6
---

SOL is Solana's native currency, but most real-world applications use tokens - especially stablecoins like USDC. The x402 protocol we're building toward uses USDC for payments.

Let's learn how tokens work on Solana.

## SPL Tokens

SPL (Solana Program Library) tokens are Solana's standard for fungible tokens. Think ERC-20 on Ethereum, but with a different architecture.

Key concepts:

**Mint** - The token's "definition." Stores total supply, decimals, and who can mint more.

**Token Account** - Holds a balance of a specific token for a specific owner. You need one per token type.

**Associated Token Account (ATA)** - A standardized token account address derived from your wallet + the mint. Makes it easy to find someone's token account.

```
                    ┌─────────────────┐
                    │   USDC Mint     │
                    │  (Token config) │
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
    ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
    │ Alice's ATA │   │ Bob's ATA   │   │ Carol's ATA │
    │ Balance: 50 │   │ Balance: 25 │   │ Balance: 100│
    └─────────────┘   └─────────────┘   └─────────────┘
```

## Installing Token Libraries

We need the SPL Token library:

```bash
npm install @solana/spl-token
```

## Checking Token Balances

Let's check a USDC balance:

```javascript
import { createSolanaClient, address } from "gill";
import { getAssociatedTokenAddress } from "@solana/spl-token";

const { rpc } = createSolanaClient({ urlOrMoniker: "devnet" });

// USDC mint on devnet
const USDC_MINT = address("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

// Your wallet
const walletAddress = address("YOUR_WALLET_ADDRESS");

// Calculate the ATA address
const ataAddress = await getAssociatedTokenAddress(USDC_MINT, walletAddress);

console.log("Token account address:", ataAddress.toBase58());

// Check if it exists and get balance
const accountInfo = await rpc.getAccountInfo(ataAddress).send();

if (accountInfo.value) {
  // Get parsed balance
  const tokenBalance = await rpc.getTokenAccountBalance(ataAddress).send();
  console.log("USDC Balance:", tokenBalance.value.uiAmount);
} else {
  console.log("No USDC token account (balance: 0)");
}
```

## Getting All Token Balances

To see all tokens a wallet holds:

```javascript
import { createSolanaClient, address } from "gill";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

const { rpc } = createSolanaClient({ urlOrMoniker: "devnet" });
const walletAddress = address("YOUR_WALLET_ADDRESS");

const tokenAccounts = await rpc
  .getTokenAccountsByOwner(
    walletAddress,
    { programId: TOKEN_PROGRAM_ID },
    { encoding: "jsonParsed" }
  )
  .send();

console.log(`Found ${tokenAccounts.value.length} token accounts:\n`);

for (const account of tokenAccounts.value) {
  const parsed = account.account.data.parsed.info;
  const amount = parsed.tokenAmount;

  console.log("Mint:", parsed.mint);
  console.log("Balance:", amount.uiAmount, `(${amount.decimals} decimals)`);
  console.log("---");
}
```

## Creating a Token Account

Before you can receive a token, you need a token account. The standard is to use Associated Token Accounts (ATAs):

```javascript
import { createSolanaClient, loadKeypairSignerFromFile, address } from "gill";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

const { rpc, sendAndConfirmTransaction } = createSolanaClient({
  urlOrMoniker: "devnet",
});

const wallet = await loadKeypairSignerFromFile("./dev-wallet.json");
const USDC_MINT = address("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

// Calculate ATA address
const ataAddress = await getAssociatedTokenAddress(USDC_MINT, wallet.address);

// Check if it already exists
const existingAccount = await rpc.getAccountInfo(ataAddress).send();

if (existingAccount.value) {
  console.log("Token account already exists:", ataAddress.toBase58());
} else {
  console.log("Creating token account...");

  // Create the ATA
  const createAtaIx = createAssociatedTokenAccountInstruction(
    wallet.address, // payer
    ataAddress, // ata address
    wallet.address, // owner
    USDC_MINT, // mint
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const signature = await sendAndConfirmTransaction({
    transaction: {
      instructions: [createAtaIx],
      feePayer: wallet,
    },
    signers: [wallet],
  });

  console.log("Created token account:", ataAddress.toBase58());
  console.log("Transaction:", signature);
}
```

Creating an ATA costs about 0.002 SOL (for rent-exemption).

## Transferring Tokens

To send tokens between accounts:

```javascript
import {
  createSolanaClient,
  loadKeypairSignerFromFile,
  address,
  solToLamports,
} from "gill";
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";

const { rpc, sendAndConfirmTransaction } = createSolanaClient({
  urlOrMoniker: "devnet",
});

const wallet = await loadKeypairSignerFromFile("./dev-wallet.json");
const USDC_MINT = address("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

// Recipient
const recipientWallet = address("RECIPIENT_WALLET_ADDRESS");

// Get source token account (must exist and have balance)
const sourceAta = await getAssociatedTokenAddress(USDC_MINT, wallet.address);

// Get or create destination token account
const destinationAta = await getAssociatedTokenAddress(
  USDC_MINT,
  recipientWallet
);

// Amount to send (USDC has 6 decimals)
const amount = 1_000_000; // 1 USDC = 1,000,000 micro-units

// Create transfer instruction
const transferIx = createTransferInstruction(
  sourceAta, // source
  destinationAta, // destination
  wallet.address, // owner of source
  amount // amount in smallest units
);

const signature = await sendAndConfirmTransaction({
  transaction: {
    instructions: [transferIx],
    feePayer: wallet,
  },
  signers: [wallet],
});

console.log("Transfer complete:", signature);
```

## Token Decimals

Different tokens have different decimals:

| Token                | Decimals | 1 token =     |
| -------------------- | -------- | ------------- |
| USDC                 | 6        | 1,000,000     |
| SOL                  | 9        | 1,000,000,000 |
| Some NFT-like tokens | 0        | 1             |

Always check the mint's decimals:

```javascript
import { getMint } from "@solana/spl-token";

const mintInfo = await getMint(connection, USDC_MINT);
console.log("Decimals:", mintInfo.decimals); // 6 for USDC
```

Helper functions:

```javascript
// Convert human-readable to on-chain amount
function toTokenAmount(amount, decimals) {
  return Math.floor(amount * Math.pow(10, decimals));
}

// Convert on-chain amount to human-readable
function fromTokenAmount(amount, decimals) {
  return amount / Math.pow(10, decimals);
}

// Usage
const onChainAmount = toTokenAmount(1.5, 6); // 1.50 USDC → 1500000
const humanAmount = fromTokenAmount(1500000, 6); // 1500000 → 1.50
```

## Getting Devnet USDC

On devnet, you can mint test USDC using the faucet:

Option 1: Use a faucet website

- [Circle's USDC faucet](https://faucet.circle.com/)
- Select Solana Devnet
- Paste your wallet address

Option 2: Use the devnet mint authority (if available)

For x402 testing, you'll want some devnet USDC. The faucet is the easiest way.

## Complete Example: Check and Transfer

```javascript
import { createSolanaClient, loadKeypairSignerFromFile, address } from "gill";
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

async function main() {
  const { rpc, sendAndConfirmTransaction } = createSolanaClient({
    urlOrMoniker: "devnet",
  });

  const wallet = await loadKeypairSignerFromFile("./dev-wallet.json");
  const USDC_MINT = address("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
  const RECIPIENT = address("PASTE_RECIPIENT_ADDRESS");

  // Get ATAs
  const sourceAta = await getAssociatedTokenAddress(USDC_MINT, wallet.address);
  const destAta = await getAssociatedTokenAddress(USDC_MINT, RECIPIENT);

  // Check source balance
  const sourceBalance = await rpc
    .getTokenAccountBalance(sourceAta)
    .send()
    .catch(() => ({ value: { uiAmount: 0 } }));

  console.log("Your USDC balance:", sourceBalance.value.uiAmount);

  if (sourceBalance.value.uiAmount === 0) {
    console.log("No USDC to send. Get some from https://faucet.circle.com/");
    return;
  }

  // Build instructions
  const instructions = [];

  // Check if dest ATA exists, if not, create it
  const destAccount = await rpc.getAccountInfo(destAta).send();
  if (!destAccount.value) {
    console.log("Creating recipient token account...");
    instructions.push(
      createAssociatedTokenAccountInstruction(
        wallet.address,
        destAta,
        RECIPIENT,
        USDC_MINT,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );
  }

  // Add transfer
  const transferAmount = 100_000; // 0.1 USDC
  instructions.push(
    createTransferInstruction(
      sourceAta,
      destAta,
      wallet.address,
      transferAmount
    )
  );

  // Send
  console.log("Sending 0.1 USDC...");
  const signature = await sendAndConfirmTransaction({
    transaction: { instructions, feePayer: wallet },
    signers: [wallet],
  });

  console.log("✓ Transfer complete!");
  console.log(`https://explorer.solana.com/tx/${signature}?cluster=devnet`);
}

main().catch(console.error);
```

## Why This Matters for x402

The x402 protocol uses USDC for payments because:

1. **Stable value** - $1 = $1, no volatility
2. **6 decimals** - Enables micropayments (0.000001 USDC)
3. **Widely supported** - Circle's official stablecoin
4. **Fast settlement** - Transfers confirm in ~1 second

When you build an x402 server, you'll be receiving USDC transfers. When you build an x402 client, you'll be sending them.

## What You Learned

- SPL tokens use separate "token accounts" for each holder
- Associated Token Accounts (ATAs) have deterministic addresses
- Token amounts use the token's decimals (USDC = 6)
- You can bundle ATA creation + transfer in one transaction
- Devnet has test USDC available from faucets

## Next Up

We've covered the foundational server-side Solana skills. Next, we move to the browser - connecting wallet extensions like Phantom and letting users sign transactions. This is where web apps come alive.
