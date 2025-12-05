---
title: "Reading Data from Solana: Accounts Explained"
description: "Understanding Solana's account model - how data is stored, who owns it, and how to read it from JavaScript."
tags: ["solana", "javascript", "web3", "accounts"]
pubDate: "2025-12-04T10:30:00Z"
series: "solana-for-js-devs"
seriesOrder: 4
---

Before we send our first transaction, we need to understand how Solana stores data. This is where Solana differs most from what you're used to.

## The Account Model

In traditional databases, you have tables with rows. In Ethereum, you have contracts with internal storage. Solana does it differently.

**Everything is an account.**

Your wallet? An account. A token balance? An account. A program (smart contract)? An account. The program's data? Another account.

Each account has:

```javascript
{
  // Who can modify this account's data
  owner: "Program address",

  // The raw bytes stored in this account
  data: Uint8Array,

  // SOL balance (to pay for storage rent)
  lamports: 1000000,

  // Is this account a program?
  executable: false,

  // When rent is next due
  rentEpoch: 123
}
```

## Reading Account Info

Let's look at a real wallet account:

```javascript
import { createSolanaClient, address } from "gill";

const { rpc } = createSolanaClient({ urlOrMoniker: "devnet" });

// A random devnet wallet
const walletAddress = address("DRpbCBMxVnDK7maPgWxXSa4Z4A8e3MQbSpWhdMpVRwFD");

const accountInfo = await rpc.getAccountInfo(walletAddress).send();

if (accountInfo.value) {
  console.log("Owner:", accountInfo.value.owner);
  console.log("Lamports:", accountInfo.value.lamports);
  console.log("Data length:", accountInfo.value.data.length);
  console.log("Executable:", accountInfo.value.executable);
} else {
  console.log("Account doesn't exist (never received SOL)");
}
```

For a basic wallet, you'll see:

- Owner: `11111111111111111111111111111111` (the System Program)
- Data: empty (0 bytes)
- Executable: false

## The System Program

Every wallet is owned by the System Program. This built-in program handles:

- Creating new accounts
- Transferring SOL
- Allocating account space

The address `11111111111111111111111111111111` (32 ones) is the System Program's address. You'll see it everywhere.

## Token Accounts

Here's where it gets interesting. To hold a token (like USDC), you don't add data to your wallet. Instead, you create a separate "token account":

```
┌─────────────────┐     ┌──────────────────────┐
│   Your Wallet   │     │  Your USDC Account   │
│  (System owned) │     │   (Token Program     │
│                 │     │        owned)        │
│  SOL: 1.5       │     │  USDC: 100.00        │
│  Data: empty    │     │  Owner: Your wallet  │
└─────────────────┘     └──────────────────────┘
```

The token account is owned by the Token Program, but it stores your wallet address as the "authority" - the wallet that can spend those tokens.

Let's read a token account:

```javascript
import { createSolanaClient, address } from "gill";

const { rpc } = createSolanaClient({ urlOrMoniker: "devnet" });

// USDC mint on devnet
const usdcMint = address("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

// Get all token accounts for a wallet
const walletAddress = address("YOUR_WALLET_ADDRESS");

const tokenAccounts = await rpc
  .getTokenAccountsByOwner(
    walletAddress,
    { mint: usdcMint },
    { encoding: "jsonParsed" }
  )
  .send();

for (const account of tokenAccounts.value) {
  const parsed = account.account.data.parsed;
  console.log("Token account:", account.pubkey);
  console.log("Balance:", parsed.info.tokenAmount.uiAmount, "USDC");
}
```

## Program Accounts

Programs (smart contracts) are also accounts, but with `executable: true`:

```javascript
import { createSolanaClient, address } from "gill";

const { rpc } = createSolanaClient({ urlOrMoniker: "devnet" });

// The Token Program
const tokenProgram = address("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

const programInfo = await rpc.getAccountInfo(tokenProgram).send();

if (programInfo.value) {
  console.log("Executable:", programInfo.value.executable); // true
  console.log("Data size:", programInfo.value.data.length, "bytes");
}
```

## The Mental Model

Think of it like this:

| Traditional DB  | Solana Equivalent              |
| --------------- | ------------------------------ |
| Table           | Program                        |
| Row             | Account                        |
| Primary key     | Account address                |
| Schema          | Program's expected data format |
| CRUD operations | Program instructions           |

The key difference: the "table" (program) doesn't store data internally. Instead, it reads and writes to separate account "rows" that it owns.

## Reading Multiple Accounts

Often you need data from several accounts at once:

```javascript
import { createSolanaClient, address } from "gill";

const { rpc } = createSolanaClient({ urlOrMoniker: "devnet" });

const addresses = [
  address("Address1..."),
  address("Address2..."),
  address("Address3..."),
];

const accounts = await rpc.getMultipleAccounts(addresses).send();

accounts.value.forEach((account, index) => {
  if (account) {
    console.log(`Account ${index}:`, account.lamports, "lamports");
  } else {
    console.log(`Account ${index}: doesn't exist`);
  }
});
```

## Decoding Account Data

Raw account data is just bytes. Programs define how to interpret those bytes. For well-known programs, libraries handle this:

```javascript
import { createSolanaClient, address } from "gill";

const { rpc } = createSolanaClient({ urlOrMoniker: "devnet" });

// Use jsonParsed encoding for known account types
const tokenAccount = address("SOME_TOKEN_ACCOUNT");

const info = await rpc
  .getAccountInfo(tokenAccount, { encoding: "jsonParsed" })
  .send();

if (info.value && info.value.data.parsed) {
  const parsed = info.value.data.parsed;
  console.log("Program:", parsed.program); // "spl-token"
  console.log("Type:", parsed.type); // "account"
  console.log("Mint:", parsed.info.mint);
  console.log("Owner:", parsed.info.owner);
  console.log("Balance:", parsed.info.tokenAmount.uiAmount);
}
```

The RPC node recognizes common programs (Token Program, System Program, etc.) and can parse their account data into JSON.

## Watching Accounts

You can subscribe to account changes using WebSockets:

```javascript
import { createSolanaClient, address } from "gill";

const { rpc, rpcSubscriptions } = createSolanaClient({
  urlOrMoniker: "devnet",
});

const walletAddress = address("YOUR_WALLET_ADDRESS");

// Subscribe to changes
const subscription = await rpcSubscriptions
  .accountNotifications(walletAddress)
  .subscribe();

for await (const notification of subscription) {
  console.log("Account changed!");
  console.log("New lamports:", notification.value.lamports);
}
```

This is useful for building real-time UIs that update when balances change.

## Rent and Account Storage

Accounts cost SOL to exist - this is called "rent." The more data an account stores, the more rent it needs.

```javascript
import { createSolanaClient } from "gill";

const { rpc } = createSolanaClient({ urlOrMoniker: "devnet" });

// Calculate rent for a given data size
const dataSize = 165; // bytes (token account size)
const rent = await rpc.getMinimumBalanceForRentExemption(dataSize).send();

console.log("Rent-exempt minimum:", rent, "lamports");
console.log("In SOL:", rent / 1e9);
```

In practice, accounts are made "rent-exempt" by depositing enough SOL upfront. The minimum for a token account is about 0.002 SOL.

## Key Takeaways

1. **Everything is an account** - wallets, tokens, programs, data
2. **Accounts have owners** - the program that controls the account
3. **Data is just bytes** - programs define how to interpret them
4. **Token balances are separate accounts** - not stored in your wallet
5. **Programs are executable accounts** - they contain bytecode, not data

## Common Account Types You'll Encounter

| Account Type  | Owner          | Data Contains                 |
| ------------- | -------------- | ----------------------------- |
| Wallet        | System Program | Nothing (just SOL)            |
| Token Account | Token Program  | Balance, mint, authority      |
| Mint          | Token Program  | Supply, decimals, authorities |
| Program       | BPF Loader     | Executable bytecode           |
| PDA           | Any program    | Program-defined data          |

## Next Up

Now that we understand how data is stored, we're ready to modify it. Next post: sending your first transaction - transferring SOL between wallets.
