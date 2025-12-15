---
title: "Compressed NFTs: Collections, Verification, and Building a Claim Page"
description: "Taking our cNFT minting system to production: creating verified collections, building a web-based claim flow, and preparing for mainnet deployment."
tags: ["solana", "nft", "web3", "javascript", "svelte"]
series: "build-a-cnft-mint-on-solana"
seriesOrder: 2
pubDate: "2025-12-09T12:00:00Z"
---

## Compressed NFTs: Collections, Verification, and Building a Claim Page

In [Part 1](/articles/building-compressed-nfts-solana-generative-svg), we built a complete cNFT minting system — generative SVG artwork, Merkle tree creation, and minting scripts. That's enough to mint thousands of NFTs from the command line, but most projects need more:

- A **verified collection** so NFTs group together in wallets and marketplaces
- A **web interface** where users connect their wallet and claim
- **Holder verification** to gate minting to specific token holders
- **Mainnet readiness** with proper error handling and cost management

This post covers all of that. By the end, you'll have a production-ready claim page that verifies wallet ownership and mints cNFTs on demand.

## Creating a Verified Collection

Right now, our cNFTs show up as individual items in wallets. To group them as a proper collection, we need to:

1. Create a Collection NFT (a regular NFT that represents the collection)
2. Set it as the collection authority on our Merkle tree
3. Reference it when minting

### Why Collections Matter

Collections aren't just cosmetic. They enable:

- **Grouping in wallets** — Phantom and others show collection NFTs together
- **Marketplace listings** — Magic Eden, Tensor, etc. list by collection
- **Royalty enforcement** — Some marketplaces only enforce royalties for verified collections
- **Discoverability** — Users can browse your collection as a unit

### Creating the Collection NFT

The collection itself is a standard (non-compressed) NFT. We'll use Metaplex's Token Metadata program:

```bash
bun add @metaplex-foundation/mpl-token-metadata
```

```js
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createNft,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  generateSigner,
  keypairIdentity,
  percentAmount,
} from "@metaplex-foundation/umi";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";

const umi = createUmi("https://api.devnet.solana.com")
  .use(mplTokenMetadata())
  .use(irysUploader({ address: "https://devnet.irys.xyz" }));

// Load your wallet
const secretKey = new Uint8Array(await Bun.file("./wallet.json").json());
const keypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
umi.use(keypairIdentity(keypair));
```

First, upload the collection metadata:

```js
// Collection image (can be a representative SVG or a logo)
const collectionImage = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#0d0221"/>
  <circle cx="100" cy="100" r="60" fill="none" stroke="#ff00ff" stroke-width="2"/>
  <circle cx="100" cy="100" r="40" fill="none" stroke="#00ffff" stroke-width="2"/>
  <circle cx="100" cy="100" r="20" fill="#ff00ff"/>
  <text x="100" y="180" text-anchor="middle" fill="white" font-size="12">GENV</text>
</svg>`;

const imageFile = createGenericFile(
  Buffer.from(collectionImage),
  "collection.svg",
  { contentType: "image/svg+xml" }
);
const [imageUri] = await umi.uploader.upload([imageFile]);

const collectionMetadata = {
  name: "Generative Collection",
  symbol: "GENV",
  description:
    "A collection of generative animated artworks, unique to each wallet.",
  image: imageUri,
  external_url: "https://yoursite.com",
  properties: {
    files: [{ uri: imageUri, type: "image/svg+xml" }],
    category: "image",
  },
};

const metadataUri = await umi.uploader.uploadJson(collectionMetadata);
console.log("Collection metadata:", metadataUri);
```

Now create the collection NFT:

```js
const collectionMint = generateSigner(umi);

await createNft(umi, {
  mint: collectionMint,
  name: "Generative Collection",
  symbol: "GENV",
  uri: metadataUri,
  sellerFeeBasisPoints: percentAmount(5), // 5% royalties
  isCollection: true, // This marks it as a collection NFT
}).sendAndConfirm(umi);

console.log("Collection NFT:", collectionMint.publicKey);

// Save for later use
await Bun.write(
  "collection-config.json",
  JSON.stringify(
    {
      collectionMint: collectionMint.publicKey,
      metadataUri,
    },
    null,
    2
  )
);
```

Key points:

- `isCollection: true` — Marks this NFT as a collection parent
- `sellerFeeBasisPoints` — Royalties for secondary sales (500 = 5%)
- Save the mint address — you'll need it for every cNFT mint

### Minting cNFTs into the Collection

Update your mint script to reference the collection:

```js
import { findCollectionAuthorityRecordPda } from "@metaplex-foundation/mpl-bubblegum";

// Load collection config
const collectionConfig = await Bun.file("collection-config.json").json();

const tx = await mintV1(umi, {
  leafOwner: publicKey(recipientAddress),
  merkleTree: publicKey(treeConfig.treeAddress),
  metadata: {
    name: nftName,
    symbol: "GENV",
    uri: metadataUri,
    sellerFeeBasisPoints: 500, // Must match collection
    collection: {
      key: publicKey(collectionConfig.collectionMint),
      verified: false, // Will be verified in the same transaction
    },
    creators: [
      {
        address: keypair.publicKey,
        verified: false,
        share: 100,
      },
    ],
  },
  collectionMint: publicKey(collectionConfig.collectionMint),
}).sendAndConfirm(umi);
```

The `collectionMint` parameter tells Bubblegum to verify the collection in the same transaction. Without it, you'd need a separate verification step.

## Holder Verification

Many projects gate minting to holders of a specific token — "hold our NFT to get this free mint." Here's how to implement that check.

### Checking for Token Ownership

For regular SPL tokens or NFTs, we can use standard RPC calls:

```js
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";

const REQUIRED_TOKEN_MINT = "TokenMintAddressHere...";

async function holdsRequiredToken(walletAddress) {
  const connection = new Connection("https://api.devnet.solana.com");
  const wallet = new PublicKey(walletAddress);
  const mint = new PublicKey(REQUIRED_TOKEN_MINT);

  // Get the associated token account
  const ata = await getAssociatedTokenAddress(mint, wallet);

  try {
    const account = await connection.getTokenAccountBalance(ata);
    return parseInt(account.value.amount) > 0;
  } catch (e) {
    // Account doesn't exist = no tokens
    return false;
  }
}
```

### Checking for cNFT Ownership

If you're gating based on ownership of another cNFT collection, you need the DAS API:

```js
async function holdsCnftFromCollection(umi, walletAddress, collectionAddress) {
  const assets = await umi.rpc.getAssetsByOwner({
    owner: publicKey(walletAddress),
  });

  return assets.items.some((asset) =>
    asset.grouping?.some(
      (g) => g.group_key === "collection" && g.group_value === collectionAddress
    )
  );
}
```

### Integrating into the Mint Flow

```js
// Before minting
console.log("Checking eligibility...");

const isHolder = await holdsRequiredToken(recipientAddress);
if (!isHolder) {
  console.log("Wallet does not hold the required token.");
  console.log("Get one at: https://yoursite.com/token");
  process.exit(0);
}

const alreadyMinted = await checkExistingMint(
  umi,
  recipientAddress,
  treeAddress
);
if (alreadyMinted.length > 0) {
  console.log("Wallet already claimed.");
  process.exit(0);
}

// Proceed with mint...
```

## Building the Claim Page

A command-line minting script is fine for airdrops, but for claims you need a web interface. Let's build one with SvelteKit.

### Project Setup

```bash
bunx sv create cnft-claim
cd cnft-claim
bun add @solana/web3.js @solana/wallet-adapter-base
```

### The Claim Flow

1. User connects wallet
2. Frontend checks eligibility (holder verification + duplicate check)
3. If eligible, frontend calls your API to mint
4. API mints the cNFT and returns the signature
5. Frontend shows success with explorer link

### Frontend: Wallet Connection

Using the wallet store pattern from [earlier in this series](/articles/solana-js-08-wallet-component):

```svelte
<!-- src/routes/+page.svelte -->
<script>
  import { wallet } from '$lib/stores/wallet';

  let status = $state('disconnected'); // disconnected | checking | eligible | ineligible | minting | success | error
  let signature = $state(null);
  let errorMessage = $state(null);

  // Check eligibility when wallet connects
  $effect(() => {
    if ($wallet.connected && status === 'disconnected') {
      checkEligibility();
    }
  });

  async function checkEligibility() {
    status = 'checking';

    try {
      const res = await fetch(`/api/check-eligibility?wallet=${$wallet.publicKey}`);
      const data = await res.json();

      if (data.eligible) {
        status = 'eligible';
      } else {
        status = 'ineligible';
        errorMessage = data.reason;
      }
    } catch (e) {
      status = 'error';
      errorMessage = e.message;
    }
  }

  async function claim() {
    status = 'minting';

    try {
      const res = await fetch('/api/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: $wallet.publicKey.toString() }),
      });

      const data = await res.json();

      if (data.success) {
        status = 'success';
        signature = data.signature;
      } else {
        status = 'error';
        errorMessage = data.error;
      }
    } catch (e) {
      status = 'error';
      errorMessage = e.message;
    }
  }
</script>

<main>
  <h1>Claim Your Generative NFT</h1>

  {#if !$wallet.connected}
    <button onclick={() => wallet.connect()}>
      Connect Wallet
    </button>
  {:else if status === 'checking'}
    <p>Checking eligibility...</p>
  {:else if status === 'ineligible'}
    <p>Not eligible: {errorMessage}</p>
  {:else if status === 'eligible'}
    <button onclick={claim}>
      Claim NFT
    </button>
  {:else if status === 'minting'}
    <p>Minting your NFT...</p>
  {:else if status === 'success'}
    <p>Success!</p>
    <a href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`} target="_blank">
      View on Explorer
    </a>
  {:else if status === 'error'}
    <p>Error: {errorMessage}</p>
    <button onclick={checkEligibility}>Try Again</button>
  {/if}
</main>
```

### Backend: Eligibility Check

```js
// src/routes/api/check-eligibility/+server.js
import { json } from "@sveltejs/kit";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplBubblegum } from "@metaplex-foundation/mpl-bubblegum";
import { dasApi } from "@metaplex-foundation/digital-asset-standard-api";
import { publicKey } from "@metaplex-foundation/umi";
import { HELIUS_API_KEY, TREE_ADDRESS } from "$env/static/private";

const umi = createUmi(
  `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
)
  .use(mplBubblegum())
  .use(dasApi());

export async function GET({ url }) {
  const wallet = url.searchParams.get("wallet");

  if (!wallet) {
    return json({ eligible: false, reason: "No wallet provided" });
  }

  try {
    // Check for existing mint
    const assets = await umi.rpc.getAssetsByOwner({
      owner: publicKey(wallet),
    });

    const existing = assets.items.filter(
      (asset) =>
        asset.compression?.compressed &&
        asset.compression?.tree === TREE_ADDRESS
    );

    if (existing.length > 0) {
      return json({
        eligible: false,
        reason: "Already claimed",
        existingAsset: existing[0].id,
      });
    }

    // Add holder verification here if needed
    // const isHolder = await checkHolderStatus(wallet);
    // if (!isHolder) {
    //   return json({ eligible: false, reason: 'Must hold XYZ token' });
    // }

    return json({ eligible: true });
  } catch (e) {
    console.error("Eligibility check error:", e);
    return json({ eligible: false, reason: "Error checking eligibility" });
  }
}
```

### Backend: Minting Endpoint

```js
// src/routes/api/mint/+server.js
import { json } from "@sveltejs/kit";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mintV1, mplBubblegum } from "@metaplex-foundation/mpl-bubblegum";
import {
  createGenericFile,
  keypairIdentity,
  publicKey,
} from "@metaplex-foundation/umi";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import bs58 from "bs58";
import { generateSvg } from "$lib/generateSvg";
import {
  HELIUS_API_KEY,
  TREE_ADDRESS,
  COLLECTION_MINT,
  WALLET_SECRET_KEY,
} from "$env/static/private";

const umi = createUmi(
  `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
)
  .use(mplBubblegum())
  .use(irysUploader({ address: "https://devnet.irys.xyz" }));

// Set up minting wallet
const secretKey = new Uint8Array(JSON.parse(WALLET_SECRET_KEY));
const keypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
umi.use(keypairIdentity(keypair));

export async function POST({ request }) {
  const { wallet } = await request.json();

  if (!wallet) {
    return json(
      { success: false, error: "No wallet provided" },
      { status: 400 }
    );
  }

  try {
    // Generate and upload artwork
    const svg = generateSvg(wallet);
    const nftName = `Generative #${wallet.slice(0, 8)}`;

    const svgFile = createGenericFile(Buffer.from(svg), "image.svg", {
      contentType: "image/svg+xml",
    });
    const [imageUri] = await umi.uploader.upload([svgFile]);

    const metadata = {
      name: nftName,
      symbol: "GENV",
      description: "A generative animated artwork.",
      image: imageUri,
      attributes: [
        { trait_type: "Seed", value: wallet.slice(0, 8) },
        { trait_type: "Type", value: "Animated SVG" },
      ],
      properties: {
        files: [{ uri: imageUri, type: "image/svg+xml" }],
        category: "image",
      },
    };
    const metadataUri = await umi.uploader.uploadJson(metadata);

    // Mint
    const tx = await mintV1(umi, {
      leafOwner: publicKey(wallet),
      merkleTree: publicKey(TREE_ADDRESS),
      metadata: {
        name: nftName,
        symbol: "GENV",
        uri: metadataUri,
        sellerFeeBasisPoints: 0,
        collection: {
          key: publicKey(COLLECTION_MINT),
          verified: false,
        },
        creators: [
          {
            address: keypair.publicKey,
            verified: false,
            share: 100,
          },
        ],
      },
      collectionMint: publicKey(COLLECTION_MINT),
    }).sendAndConfirm(umi);

    const signature = bs58.encode(tx.signature);

    return json({
      success: true,
      signature,
      imageUri,
      metadataUri,
    });
  } catch (e) {
    console.error("Mint error:", e);
    return json({ success: false, error: e.message }, { status: 500 });
  }
}
```

### Environment Variables

Create `.env`:

```bash
HELIUS_API_KEY=your-helius-api-key
TREE_ADDRESS=your-merkle-tree-address
COLLECTION_MINT=your-collection-nft-address
WALLET_SECRET_KEY=[1,2,3,...] # Your wallet's secret key as JSON array
```

**Security note:** Never commit `.env` to git. The minting wallet holds SOL and has authority to mint — treat its secret key like a password.

## Mainnet Deployment

Moving from devnet to mainnet requires a few changes.

### RPC Endpoints

```js
// Devnet
const umi = createUmi("https://devnet.helius-rpc.com/?api-key=...").use(
  irysUploader({ address: "https://devnet.irys.xyz" })
);

// Mainnet
const umi = createUmi("https://mainnet.helius-rpc.com/?api-key=...").use(
  irysUploader()
); // Defaults to mainnet Irys
```

### Costs to Budget

| Item                           | Devnet         | Mainnet                |
| ------------------------------ | -------------- | ---------------------- |
| Merkle tree (depth 14)         | Free (airdrop) | ~0.5 SOL (~$75)        |
| Collection NFT                 | Free           | ~0.01 SOL (~$1.50)     |
| Per-mint transaction           | Free           | ~0.00001 SOL (~$0.002) |
| Arweave upload (5KB SVG)       | ~$0.001        | ~$0.001                |
| Arweave upload (metadata JSON) | ~$0.0005       | ~$0.0005               |

For 1,000 mints: ~$77 total (mostly the tree creation).

### Pre-flight Checklist

Before going live:

1. **Fund the minting wallet** — Enough SOL for tree + expected mints + buffer
2. **Test the full flow on devnet** — Multiple times, different wallets
3. **Fund Irys** — Upload costs come from your wallet, ensure it has enough
4. **Set up monitoring** — Log errors, track mint counts
5. **Rate limiting** — Prevent spam on your mint endpoint
6. **Error handling** — What happens if Arweave upload fails? If the mint fails?

### Rate Limiting Example

```js
// Simple in-memory rate limit (use Redis in production)
const mintAttempts = new Map();

export async function POST({ request, getClientAddress }) {
  const ip = getClientAddress();
  const now = Date.now();

  // Allow 3 attempts per minute
  const attempts = mintAttempts.get(ip) || [];
  const recentAttempts = attempts.filter((t) => now - t < 60000);

  if (recentAttempts.length >= 3) {
    return json(
      {
        success: false,
        error: "Too many attempts. Try again in a minute.",
      },
      { status: 429 }
    );
  }

  mintAttempts.set(ip, [...recentAttempts, now]);

  // ... rest of mint logic
}
```

## Revoking Tree Authority

Once your mint is complete, you may want to "close" it — prevent any new mints. This is done by revoking the tree authority:

```js
import { setTreeDelegate } from "@metaplex-foundation/mpl-bubblegum";
import { publicKey } from "@metaplex-foundation/umi";

// Set delegate to a burn address (no one can mint)
const BURN_ADDRESS = "burn1111111111111111111111111111111111111111";

await setTreeDelegate(umi, {
  merkleTree: publicKey(TREE_ADDRESS),
  newDelegate: publicKey(BURN_ADDRESS),
}).sendAndConfirm(umi);

console.log("Tree authority revoked. No more mints possible.");
```

**Warning:** This is irreversible. Only do this when you're certain the mint is complete.

## What We Built

Starting from Part 1's command-line minting, we now have:

- **Verified collection** — NFTs grouped properly in wallets/marketplaces
- **Holder verification** — Gate mints to token holders
- **Web claim page** — Users connect wallet and claim in-browser
- **Production API** — Eligibility checks, minting, error handling
- **Mainnet readiness** — Cost estimates, security considerations

The total cost to run a 1,000-mint collection on mainnet is under $100 — orders of magnitude cheaper than traditional NFTs.

## Next Steps

Some ideas if you want to take this further:

- **Snapshot + airdrop** — Take a snapshot of holders and airdrop to all of them
- **Merkle allowlist** — Use a Merkle tree for allowlist verification (gas-efficient)
- **Dynamic traits** — Generate different trait combinations and store rarity data
- **Reveal mechanism** — Mint with placeholder, reveal real art later
- **Secondary market integration** — List on Magic Eden, Tensor

---

_The code in this post is production-ready but simplified for clarity. Add proper error handling, logging, and monitoring before deploying to mainnet._
