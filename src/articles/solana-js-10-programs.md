---
title: "Understanding Solana Programs (Smart Contracts)"
description: "What Solana programs are, how they differ from Ethereum contracts, and the mental model for interacting with them."
tags: ["solana", "javascript", "web3", "programs", "smart-contracts"]
pubDate: "2025-12-04T13:30:00Z"
series: "solana-for-js-devs"
seriesOrder: 10
---

We've been using the System Program to transfer SOL. But Solana has hundreds of programs you can interact with. Let's understand how they work.

## Programs vs Smart Contracts

On Ethereum, "smart contracts" store both code AND state in the same place. On Solana, they're separated:

```
Ethereum:                     Solana:
┌─────────────────┐          ┌─────────────────┐
│  Smart Contract │          │    Program      │
│  ─────────────  │          │   (Code only)   │
│  Code           │          └────────┬────────┘
│  +              │                   │
│  State          │                   ▼
└─────────────────┘          ┌─────────────────┐
                             │    Accounts     │
                             │   (State only)  │
                             └─────────────────┘
```

**Programs** are stateless executables. They contain logic but store nothing.

**Accounts** store data. Programs read from and write to accounts.

This separation is why Solana is fast - it can parallelize transactions that touch different accounts.

## Built-in Programs

Solana has several native programs:

| Program          | Address                                        | Purpose                        |
| ---------------- | ---------------------------------------------- | ------------------------------ |
| System Program   | `11111111111111111111111111111111`             | Create accounts, transfer SOL  |
| Token Program    | `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`  | SPL token operations           |
| Associated Token | `ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL` | Derive token account addresses |
| Memo Program     | `MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr`  | Attach memos to transactions   |

You've already used the System Program (SOL transfers) and Token Program (USDC transfers).

## Anatomy of an Instruction

When you call a program, you send an "instruction":

```typescript
interface TransactionInstruction {
  programId: PublicKey; // Which program to call
  keys: AccountMeta[]; // Which accounts to use
  data: Buffer; // What to do (encoded)
}

interface AccountMeta {
  pubkey: PublicKey;
  isSigner: boolean; // Must sign the transaction?
  isWritable: boolean; // Will be modified?
}
```

Example - a SOL transfer instruction:

```typescript
import { SystemProgram, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

const transferInstruction = SystemProgram.transfer({
  fromPubkey: senderPublicKey,
  toPubkey: recipientPublicKey,
  lamports: 0.1 * LAMPORTS_PER_SOL,
});

// Under the hood, this creates:
// {
//   programId: SystemProgram.programId,  // 1111...
//   keys: [
//     { pubkey: sender, isSigner: true, isWritable: true },
//     { pubkey: recipient, isSigner: false, isWritable: true }
//   ],
//   data: <encoded transfer amount>
// }
```

## Program Derived Addresses (PDAs)

Programs often need to own accounts. But programs can't sign transactions. Solution: PDAs.

A PDA is an address derived from:

1. Seeds (any bytes you choose)
2. The program's address

```typescript
import { PublicKey } from "@solana/web3.js";

// Derive a PDA
const [pda, bump] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("user-account"), // Seed 1: string
    userPublicKey.toBuffer(), // Seed 2: user's key
  ],
  programId // The program
);

// The PDA is deterministic - same inputs always give same address
// The bump is a number that makes the PDA valid
```

PDAs are used for:

- Associated Token Accounts (your USDC account)
- Program-owned data accounts
- Authority accounts that programs control

## Finding Token Accounts

The Associated Token Program uses PDAs to derive token account addresses:

```typescript
import { getAssociatedTokenAddress } from "@solana/spl-token";

// This derives a PDA under the hood
const usdcAccount = await getAssociatedTokenAddress(
  USDC_MINT, // Which token
  walletPublicKey // Whose account
);

// Same wallet + same mint = always same address
// No need to store it - just derive it when needed
```

## Reading Program Accounts

Many programs store data in specific account formats. Here's how to read a Token account:

```typescript
import { getAccount } from "@solana/spl-token";

const tokenAccount = await getAccount(connection, tokenAccountAddress);

console.log("Mint:", tokenAccount.mint.toBase58());
console.log("Owner:", tokenAccount.owner.toBase58());
console.log("Amount:", tokenAccount.amount); // BigInt
```

For custom programs, you need to know how to decode their account data.

## The Solana Programming Model

Think of it like a database with special rules:

```
                    ┌─────────────────┐
Transaction ───────▶│    Runtime      │
                    │                 │
                    │  1. Load accts  │
                    │  2. Run program │
                    │  3. Save accts  │
                    └─────────────────┘
                            │
           ┌────────────────┼────────────────┐
           ▼                ▼                ▼
    ┌──────────┐     ┌──────────┐     ┌──────────┐
    │ Account  │     │ Account  │     │ Account  │
    │   (RW)   │     │   (RO)   │     │   (RW)   │
    └──────────┘     └──────────┘     └──────────┘
```

The runtime:

1. Loads accounts specified in the instruction
2. Runs the program with those accounts
3. Saves any modified accounts

This is why you specify `isWritable` - the runtime needs to know what might change.

## Cross-Program Invocation (CPI)

Programs can call other programs:

```
Your Transaction
       │
       ▼
┌──────────────┐
│ Your Program │
│              │──CPI──▶┌──────────────┐
│              │        │ Token Program │
│              │◀───────│              │
└──────────────┘        └──────────────┘
```

This is how complex DeFi protocols work - your program calls the Token Program to move tokens, calls an Oracle program for prices, etc.

## Common Programs You'll Use

**SPL Token Program** - Fungible tokens (USDC, etc.)

```typescript
import { createTransferInstruction } from "@solana/spl-token";
```

**Metaplex** - NFTs

```typescript
// Various Metaplex SDKs
```

**Marinade** - Liquid staking

```typescript
// marinade-finance SDK
```

**Jupiter** - Token swaps

```typescript
import { Jupiter } from "@jup-ag/core";
```

## What You Don't Need to Know (Yet)

For x402 and most web app development, you don't need to:

- Write Solana programs (Rust/Anchor)
- Understand the BPF bytecode format
- Deploy your own programs

You just need to interact with existing programs, which is all JavaScript.

## What You Learned

- Programs are stateless code, accounts hold state
- Instructions tell programs what to do with which accounts
- PDAs let programs own accounts deterministically
- Token accounts are just PDAs derived from wallet + mint
- Programs can call other programs (CPI)

## Next Up

Let's put this into practice - interacting with the Token Program to check balances and transfer tokens in our Svelte app.

---

**Resources:**

- [Solana Cookbook](https://solana.com/developers/cookbook)
- [SPL Token Docs](https://spl.solana.com/token)
