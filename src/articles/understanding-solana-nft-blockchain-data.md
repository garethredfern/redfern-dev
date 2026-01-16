---
title: "Understanding Solana NFTs: A Complete Guide"
description: "Everything you see when viewing an NFT on Solana Explorer, how each piece was created, and what can be changed after minting."
tags: ["solana", "nft", "metaplex", "blockchain", "web3"]
pubDate: "2026-01-15T23:00:00Z"
---

## Understanding Solana NFTs: A Complete Guide

This document explains everything you see when viewing an NFT on Solana Explorer, how each piece was created, and what can be changed after minting.

## Table of Contents

1. [The Big Picture](#the-big-picture)
2. [Accounts Created When Minting](#accounts-created-when-minting)
3. [On-Chain vs Off-Chain Data](#on-chain-vs-off-chain-data)
4. [Explorer Fields Explained](#explorer-fields-explained)
5. [What Can Be Changed](#what-can-be-changed)
6. [How to Update NFT Data](#how-to-update-nft-data)
7. [Collection Verification](#collection-verification)
8. [Cost Breakdown](#cost-breakdown)

---

## The Big Picture

A Solana NFT is not a single piece of data. It's a **system of connected accounts** that together represent ownership and metadata of a unique digital asset.

```
┌─────────────────────────────────────────────────────────────────┐
│                        SOLANA BLOCKCHAIN                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  Mint        │    │  Metadata    │    │  Master      │       │
│  │  Account     │───▶│  Account     │───▶│  Edition     │       │
│  │              │    │  (PDA)       │    │  (PDA)       │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                   │                                    │
│         │                   │ points to                          │
│         ▼                   ▼                                    │
│  ┌──────────────┐    ┌──────────────────────────────────┐       │
│  │  Token       │    │  OFF-CHAIN (Arweave/IPFS)        │       │
│  │  Account     │    │  ┌────────────────────────────┐  │       │
│  │  (holds 1)   │    │  │  metadata.json             │  │       │
│  └──────────────┘    │  │  - name, description       │  │       │
│         │            │  │  - image URL               │  │       │
│         │ owned by   │  │  - attributes              │  │       │
│         ▼            │  └────────────────────────────┘  │       │
│  ┌──────────────┐    │  ┌────────────────────────────┐  │       │
│  │  Your        │    │  │  image.png                 │  │       │
│  │  Wallet      │    │  │  (the actual artwork)      │  │       │
│  └──────────────┘    │  └────────────────────────────┘  │       │
│                      └──────────────────────────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Key Insight**: The blockchain stores ownership and pointers. The actual image and rich metadata live off-chain on permanent storage (Arweave via Irys).

---

## Accounts Created When Minting

When you run `mint-nft.ts`, four accounts are created:

### 1. Mint Account

**What it is**: The unique identifier for your NFT. This address IS your NFT.

**Created by**: `createNft()` function in our script

```typescript
const nftMint = generateSigner(umi);
// This generates a new keypair - the public key becomes the mint address
```

**On Explorer**: This is the main address you see (e.g., `4ZsKxVKmCFZx1xcRamFkwTLrRW6gMzfkVqLUGcfobmJ5`)

**Contains**:
| Field | Value | Meaning |
|-------|-------|---------|
| Supply | 1 | Only 1 token exists (NFT = non-fungible) |
| Decimals | 0 | Cannot be divided (unlike SOL with 9 decimals) |
| Mint Authority | null | No one can mint more (frozen after creation) |
| Freeze Authority | null | No one can freeze the token |

**Why Mint Authority is null**: For a true NFT, we set `supply = 1` and then remove the mint authority so no more can ever be created. This happens automatically with `createNft()`.

---

### 2. Token Account (Associated Token Account)

**What it is**: Holds the actual token. Think of it as a "wallet slot" for this specific NFT.

**Created by**: Automatically created by `createNft()` for the recipient

**Address**: Derived deterministically from (owner wallet + mint address)

```
Token Account = PDA(owner_wallet, TOKEN_PROGRAM, mint_address)
```

**On Explorer**: Shows under "Token Accounts" or "Holders"

**Contains**:
| Field | Value | Meaning |
|-------|-------|---------|
| Mint | NFT mint address | Which token type this holds |
| Owner | Recipient wallet | Who owns this token account |
| Amount | 1 | How many tokens (always 1 for NFT) |

**Key Concept**: You don't "own" the mint. You own a token account that holds 1 unit of that mint.

---

### 3. Metadata Account (PDA)

**What it is**: Stores NFT metadata on-chain. This is where the name, symbol, and URI live.

**Created by**: Metaplex Token Metadata Program via `createNft()`

**Address**: A Program Derived Address (PDA) - deterministically calculated:

```typescript
// How Metaplex finds the metadata account
const metadataPda = findMetadataPda(umi, { mint: nftMint.publicKey });
// PDA = seeds("metadata", TOKEN_METADATA_PROGRAM, mint_address)
```

**On Explorer**: Click "Metadata" tab on the NFT page

**Contains**:
| Field | Our Value | Meaning |
|-------|-----------|---------|
| Name | "Founder #1" | Display name (max 32 chars on-chain) |
| Symbol | "TREE" | Collection symbol (max 10 chars) |
| URI | `https://arweave.net/...` | Points to off-chain JSON |
| Seller Fee Basis Points | 0 | Royalty percentage (0 = 0%) |
| Creators | [{ address, verified, share }] | Who created this + royalty split |
| Collection | { key, verified } | Which collection this belongs to |
| Is Mutable | true | Can metadata be updated? |
| Update Authority | Your wallet | Who can update metadata |
| Primary Sale Happened | false | Has this been sold? |

---

### 4. Master Edition Account (PDA)

**What it is**: Proves this is a "master" NFT (not a print/copy). Controls edition printing.

**Created by**: Automatically by `createNft()`

**Address**: Another PDA derived from the mint:

```
Master Edition PDA = seeds("metadata", TOKEN_METADATA_PROGRAM, mint, "edition")
```

**Contains**:
| Field | Value | Meaning |
|-------|-------|---------|
| Supply | 0 | Number of prints made from this master |
| Max Supply | None/0 | Maximum prints allowed (None = unlimited potential) |

**Why it exists**: Metaplex supports "editions" where you can print copies of a master NFT. For our utility NFTs, we don't use this feature, but the account is still required.

---

## On-Chain vs Off-Chain Data

### On-Chain (Stored on Solana)

Stored directly in the Metadata Account:

```
- name (truncated to 32 chars)
- symbol (truncated to 10 chars)
- uri (pointer to off-chain JSON)
- seller_fee_basis_points
- creators array
- collection reference
- is_mutable flag
- update_authority
```

**Cost**: ~0.00561 SOL rent-exempt minimum for metadata account

### Off-Chain (Stored on Arweave via Irys)

The URI points to a JSON file:

```json
{
  "name": "Founder #1",
  "symbol": "TREE",
  "description": "TreehouseHQ Owner NFT. Grants ownership of one TreehouseHQ workspace. Founder Edition.",
  "image": "https://arweave.net/abc123...",
  "external_url": "https://treehousehq.io",
  "attributes": [
    { "trait_type": "Edition", "value": "Founder" },
    { "trait_type": "Number", "value": "1" },
    { "trait_type": "Type", "value": "Owner" }
  ],
  "properties": {
    "files": [{ "uri": "https://arweave.net/abc123...", "type": "image/png" }],
    "category": "image"
  }
}
```

**Why off-chain?**
1. **Cost**: Storing a 500KB image on-chain would cost ~3.5 SOL in rent
2. **Flexibility**: JSON can contain unlimited data
3. **Permanence**: Arweave stores data forever (pay once)

**Created by**: Our script's upload step:

```typescript
// Upload image first
const [imageUri] = await umi.uploader.upload([imageFile]);

// Then upload JSON that references the image
const metadataUri = await umi.uploader.uploadJson({
  name: nftName,
  image: imageUri,
  // ... other fields
});
```

---

## Explorer Fields Explained

When you view `4ZsKxVKmCFZx1xcRamFkwTLrRW6gMzfkVqLUGcfobmJ5` on Solana Explorer:

### Overview Tab

| Field | Example | Source | Explanation |
|-------|---------|--------|-------------|
| **Address** | 4ZsKxVKm... | Mint Account | The NFT's unique identifier |
| **Owner Program** | Token Metadata Program | - | Metaplex program that manages this |
| **Balance** | 0 SOL | Mint Account | Mint accounts don't hold SOL |
| **Token** | TREE | Metadata PDA | Symbol from metadata |
| **Decimals** | 0 | Mint Account | NFTs have 0 decimals |
| **Supply** | 1 | Mint Account | Only 1 exists |

### Metadata Tab

| Field | Example | Mutable? | Explanation |
|-------|---------|----------|-------------|
| **Name** | Founder #1 | Yes* | Display name |
| **Symbol** | TREE | Yes* | Token symbol |
| **URI** | https://arweave.net/... | Yes* | Off-chain metadata URL |
| **Seller Fee** | 0% | Yes* | Royalty on secondary sales |
| **Update Authority** | SQavJPZ... | Yes | Who can modify metadata |
| **Is Mutable** | true | One-way | Can be set to false (irreversible) |
| **Primary Sale** | false | One-way | Set true after first sale |

*Only if `is_mutable = true`

### Collection Section

| Field | Example | Explanation |
|-------|---------|-------------|
| **Collection Address** | 8YK7GZH... | Which collection this belongs to |
| **Verified** | Yes (checkmark) | Collection authority confirmed membership |

### Creators Section

| Field | Example | Explanation |
|-------|---------|-------------|
| **Address** | SQavJPZ... | Creator wallet |
| **Verified** | Yes | Creator signed to confirm |
| **Share** | 100% | Royalty share (if royalties enabled) |

### Holders Tab

Shows the Token Account:

| Field | Example | Explanation |
|-------|---------|-------------|
| **Owner** | SQavJPZ... | Wallet that owns the NFT |
| **Token Account** | 7xYz... | ATA holding the token |
| **Amount** | 1 | Always 1 for NFTs |

---

## What Can Be Changed

### Always Changeable (if mutable)

| Field | How to Change | Notes |
|-------|---------------|-------|
| Name | Update metadata | Max 32 chars on-chain |
| Symbol | Update metadata | Max 10 chars |
| URI | Update metadata | Point to new JSON |
| Image | Upload new, update URI | Old image stays on Arweave |
| Attributes | Upload new JSON, update URI | |
| Description | Upload new JSON, update URI | |
| Seller Fee | Update metadata | 0-10000 basis points |
| Creators | Update metadata | Complex rules apply |
| Update Authority | Transfer authority | Can delegate to another wallet |

### One-Way Changes (cannot undo)

| Field | Change | Effect |
|-------|--------|--------|
| Is Mutable | true → false | Freezes all metadata forever |
| Primary Sale | false → true | Indicates first sale happened |
| Collection Verified | false → true | Only collection authority can do this |

### Never Changeable

| Field | Why |
|-------|-----|
| Mint Address | It's the account's public key |
| Mint Authority | Set to null on creation |
| Supply | Frozen at 1 |
| Decimals | Set at creation, immutable |
| Master Edition | Created once |

---

## How to Update NFT Data

### Update On-Chain Metadata

Create a new script `scripts/update-metadata.ts`:

```typescript
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
  mplTokenMetadata,
  updateV1,
  findMetadataPda,
} from '@metaplex-foundation/mpl-token-metadata';
import { keypairIdentity, publicKey } from '@metaplex-foundation/umi';

async function updateNftMetadata() {
  const umi = createUmi('https://api.devnet.solana.com')
    .use(mplTokenMetadata());

  // Load your keypair (must be update authority)
  const keypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
  umi.use(keypairIdentity(keypair));

  const mintAddress = publicKey('4ZsKxVKmCFZx1xcRamFkwTLrRW6gMzfkVqLUGcfobmJ5');

  await updateV1(umi, {
    mint: mintAddress,
    data: {
      name: 'New Name Here',
      symbol: 'TREE',
      uri: 'https://arweave.net/new-metadata-uri',
      sellerFeeBasisPoints: 0,
      creators: null, // keep existing
    },
  }).sendAndConfirm(umi);

  console.log('Metadata updated!');
}
```

### Update Off-Chain Data (Image/Attributes)

You cannot modify files on Arweave. Instead:

1. **Upload new files** to get new URIs
2. **Update on-chain URI** to point to new JSON

```typescript
// 1. Upload new image
const newImageBuffer = fs.readFileSync('assets/new-image.png');
const [newImageUri] = await umi.uploader.upload([{
  buffer: newImageBuffer,
  fileName: 'new-image.png',
  contentType: 'image/png',
}]);

// 2. Upload new metadata JSON
const newMetadataUri = await umi.uploader.uploadJson({
  name: 'Updated NFT Name',
  image: newImageUri,
  attributes: [
    { trait_type: 'Edition', value: 'Founder' },
    { trait_type: 'Upgraded', value: 'true' },
  ],
});

// 3. Update on-chain URI
await updateV1(umi, {
  mint: mintAddress,
  data: {
    name: 'Updated NFT Name',
    uri: newMetadataUri,
    // ... other fields
  },
}).sendAndConfirm(umi);
```

### Transfer Update Authority

To let someone else update the NFT:

```typescript
import { updateV1 } from '@metaplex-foundation/mpl-token-metadata';

await updateV1(umi, {
  mint: mintAddress,
  newUpdateAuthority: publicKey('NEW_AUTHORITY_WALLET'),
}).sendAndConfirm(umi);
```

### Make NFT Immutable (Permanent)

**Warning**: This cannot be undone!

```typescript
await updateV1(umi, {
  mint: mintAddress,
  isMutable: false,
}).sendAndConfirm(umi);
```

After this, no one can ever change the metadata again.

---

## Collection Verification

### Why Verification Matters

Anyone can create an NFT and claim it belongs to a collection. Verification proves the collection authority approved this NFT's membership.

```
Unverified: NFT says "I'm in TreehouseHQ collection" (anyone can claim)
Verified:   Collection authority signed "Yes, this NFT is in my collection"
```

### How We Verify

In our mint script:

```typescript
// 1. Create NFT with collection reference (unverified)
await createNft(umi, {
  // ...
  collection: {
    key: publicKey(collectionAddress),
    verified: false,  // Initially unverified
  },
}).sendAndConfirm(umi);

// 2. Collection authority verifies it
await verifyCollectionV1(umi, {
  metadata: findMetadataPda(umi, { mint: nftMint.publicKey }),
  collectionMint: publicKey(collectionAddress),
  authority: umi.identity,  // Must be collection update authority
}).sendAndConfirm(umi);
```

### Unverify (Remove from Collection)

```typescript
import { unverifyCollectionV1 } from '@metaplex-foundation/mpl-token-metadata';

await unverifyCollectionV1(umi, {
  metadata: findMetadataPda(umi, { mint: nftMint.publicKey }),
  collectionMint: publicKey(collectionAddress),
  authority: umi.identity,
}).sendAndConfirm(umi);
```

---

## Cost Breakdown

### One-Time Costs (rent-exempt deposits)

These are not "spent" - they're held as rent deposits and could theoretically be recovered if accounts are closed:

| Account | Size (bytes) | Rent (SOL) |
|---------|--------------|------------|
| Mint Account | 82 | ~0.00144 |
| Metadata Account | 679 | ~0.00561 |
| Master Edition | 282 | ~0.00277 |
| Token Account | 165 | ~0.00203 |
| **Total per NFT** | | **~0.0118 SOL** |

### Transaction Fees

| Operation | Fee (SOL) |
|-----------|-----------|
| Create NFT | ~0.000005 |
| Verify Collection | ~0.000005 |
| Update Metadata | ~0.000005 |

### Storage Costs (Arweave via Irys)

| Item | Typical Size | Cost |
|------|--------------|------|
| Image (500KB) | 500,000 bytes | ~0.002 SOL |
| Metadata JSON | ~1KB | ~0.00001 SOL |

### Total Cost per NFT

```
Rent deposits:     ~0.012 SOL
Transaction fees:  ~0.00001 SOL
Storage (image):   ~0.002 SOL
Storage (JSON):    ~0.00001 SOL
─────────────────────────────
Total:             ~0.014 SOL (~$2-3 at typical prices)
```

---

## Glossary

| Term | Definition |
|------|------------|
| **Mint** | The token type definition. For NFTs, supply = 1. |
| **PDA** | Program Derived Address. Deterministically calculated, no private key. |
| **ATA** | Associated Token Account. Standard token account for a wallet. |
| **Rent** | SOL deposit required to keep an account alive on Solana. |
| **Rent-Exempt** | Account has enough SOL to live forever (minimum balance). |
| **Basis Points** | 1/100th of a percent. 100 bp = 1%, 10000 bp = 100%. |
| **URI** | Uniform Resource Identifier. Link to off-chain data. |
| **Arweave** | Permanent decentralized storage network. |
| **Irys** | Service that pays Arweave fees using SOL (formerly Bundlr). |
| **Update Authority** | Wallet that can modify NFT metadata. |
| **Collection Authority** | Wallet that can verify/unverify collection membership. |

---

## Your NFT Summary

Based on our devnet test:

```
Mint Address:        4ZsKxVKmCFZx1xcRamFkwTLrRW6gMzfkVqLUGcfobmJ5
Owner:               SQavJPZYN5s5iW72Q5e652oZC9nmSwcwZgeBms15j61
Collection:          8YK7GZHykNvHKeGC7dnqC6LPVrtMDGy3Jam9h6Fhj78V
Name:                Founder #1
Symbol:              TREE
Is Mutable:          true (can update artwork later)
Royalties:           0%
Collection Verified: Yes
Network:             Devnet
```

**What you can change:**
- Name, symbol, description
- Image (upload new, update URI)
- Attributes
- Update authority (transfer to another wallet)

**What you cannot change:**
- Mint address
- That it's an NFT (supply = 1)
- History of ownership (stored in transactions)

---

## Further Reading

- [Metaplex Token Metadata Docs](https://developers.metaplex.com/token-metadata)
- [Solana Token Program](https://spl.solana.com/token)
- [Arweave Permanent Storage](https://www.arweave.org/)
- [Irys (formerly Bundlr)](https://irys.xyz/)
