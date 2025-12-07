---
title: "Building Compressed NFTs on Solana with Generative SVG Art"
description: "A practical guide to creating and minting compressed NFTs (cNFTs) on Solana using Metaplex Bubblegum, with animated SVG artwork generated from wallet addresses."
tags: ["solana", "nft", "web3", "javascript"]
pubDate: "2025-12-07T12:00:00Z"
---

## Building Compressed NFTs on Solana with Generative SVG Art

I've been exploring Solana development lately, specifically looking at how to create NFTs that don't cost a fortune to mint. If you've ever tried minting thousands of NFTs on any blockchain, you'll know the gas fees add up fast. Solana's compressed NFTs solve this problem elegantly, and I wanted to understand how they work by building something real.

This post walks through creating a complete cNFT minting system: from understanding what compressed NFTs actually are, to generating unique animated SVG artwork, to minting on devnet. By the end, you'll have working code you can run yourself.

## What Are Compressed NFTs?

**Short answer:** Compressed NFTs (cNFTs) store ownership data in a Merkle tree instead of individual on-chain accounts, reducing mint costs by 99%+.

**Long answer:** Traditional Solana NFTs create a new account for each token. Accounts cost rent (SOL locked up to keep the account alive), and each mint transaction has fees. When you're minting 10,000 NFTs, those costs multiply quickly.

Compressed NFTs take a different approach. Instead of one account per NFT, they store all ownership data in a single Merkle tree. A Merkle tree is a data structure where you can prove any piece of data exists without storing all the data on-chain. Only the tree's root hash lives on Solana — the actual NFT data lives off-chain but can be cryptographically verified.

Here's what that means in practice:

|                 | Traditional NFT            | Compressed NFT     |
| --------------- | -------------------------- | ------------------ |
| Storage         | Individual account per NFT | Shared Merkle tree |
| Mint cost       | ~0.01 SOL                  | ~0.00001 SOL       |
| 10,000 mints    | ~100 SOL (~$15,000)        | ~1.5 SOL (~$225)   |
| Ownership proof | On-chain account           | Merkle proof       |

The trade-off? You need an indexer (like Helius or Triton) to read cNFT data, since it's not directly on-chain. But all major wallets and marketplaces support this now.

## The Architecture

Our system has three parts:

1. **SVG Generator** — Creates unique animated artwork from a wallet address
2. **Tree Creation Script** — Sets up the Merkle tree (one-time cost)
3. **Minting Script** — Mints cNFTs to the tree

Let's build each one.

## Part 1: Generative SVG Artwork

The goal is to create artwork that's unique to each wallet address but deterministic — the same address always generates the same art. We'll use the wallet address as a seed for a pseudo-random number generator.

```js
function seededRandom(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  return function () {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff;
    return hash / 0x7fffffff;
  };
}
```

This function takes a string (the wallet address) and returns a function that produces random-looking numbers between 0 and 1. The key insight: calling `seededRandom('abc')` will always produce the same sequence of numbers. This is a linear congruential generator — one of the oldest and simplest PRNGs.

- `hash = ((hash << 5) - hash) + char` — Converts the string to a number by shifting bits and adding character codes
- `hash * 1103515245 + 12345` — The magic numbers come from the ANSI C standard for random number generation
- `& 0x7fffffff` — Keeps the number positive by masking to 31 bits

Now we can use this to pick colours, positions, and animation speeds:

```js
function generateSvg(walletAddress) {
  const random = seededRandom(walletAddress);

  const palettes = [
    { name: 'sunset', bg: '#1a0a2e', colors: ['#ff6b35', '#f7c59f', '#efefd0', '#004e89', '#1a659e'] },
    { name: 'ocean', bg: '#0a1628', colors: ['#00b4d8', '#90e0ef', '#caf0f8', '#023e8a', '#0077b6'] },
    { name: 'forest', bg: '#1a2e1a', colors: ['#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2'] },
    { name: 'neon', bg: '#0d0221', colors: ['#ff00ff', '#00ffff', '#ff006e', '#8338ec', '#3a86ff'] },
    { name: 'earth', bg: '#1c1917', colors: ['#d4a373', '#ccd5ae', '#e9edc9', '#faedcd', '#fefae0'] },
  ];

  const palette = palettes[Math.floor(random() * palettes.length)];
  const patternCount = Math.floor(random() * 4) + 5;
  const animationSpeed = 8 + Math.floor(random() * 12);
```

- `palettes` — Five colour schemes to pick from. Each has a dark background and five accent colours
- `Math.floor(random() * palettes.length)` — Picks a random palette (0-4)
- `patternCount` — How many geometric shapes to draw (5-8)
- `animationSpeed` — How fast the animation runs in seconds (8-20)

The geometric patterns are polygons with 6-8 sides:

```js
for (let i = 0; i < patternCount; i++) {
  const cx = 100 + (random() - 0.5) * 120;
  const cy = 100 + (random() - 0.5) * 120;
  const size = 20 + random() * 60;
  const color = palette.colors[Math.floor(random() * palette.colors.length)];
  const opacity = 0.3 + random() * 0.5;
  const sides = Math.floor(random() * 3) + 6;

  const points = [];
  for (let j = 0; j < sides; j++) {
    const angle = (j / sides) * Math.PI * 2 - Math.PI / 2;
    const px = cx + Math.cos(angle) * size;
    const py = cy + Math.sin(angle) * size;
    points.push(`${px},${py}`);
  }
```

- `cx, cy` — Centre point, randomly placed around the middle (100,100 in a 200x200 viewBox)
- `(random() - 0.5) * 120` — Gives us a range of -60 to +60 from centre
- `size` — Radius of the polygon (20-80 pixels)
- `sides` — 6, 7, or 8 sides
- The `for` loop calculates each vertex using basic trigonometry: `cos(angle) * radius` for x, `sin(angle) * radius` for y

For animations, we use CSS keyframes embedded in the SVG:

```js
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <style>
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes pulse {
      0%, 100% { opacity: 0.3; transform: scale(1); }
      50% { opacity: 0.7; transform: scale(1.05); }
    }
    @keyframes glow {
      0%, 100% { filter: drop-shadow(0 0 3px currentColor); }
      50% { filter: drop-shadow(0 0 8px currentColor); }
    }
  </style>
  ...
</svg>`;
```

CSS animations work in most wallets and marketplaces because they don't require JavaScript execution — they're purely declarative. Each shape gets a random animation delay so they don't all move in sync.

### Why SVG?

SVGs have several advantages for on-chain art:

1. **Small file size** — Our generated SVGs are ~5KB, compared to 50-500KB for PNGs
2. **Infinitely scalable** — Vector graphics look sharp at any resolution
3. **Animations without JS** — CSS keyframes work everywhere
4. **Fully on-chain** — Can be stored as a base64 data URI in the metadata

## Part 2: Creating the Merkle Tree

Before minting any cNFTs, we need to create the Merkle tree that will hold them. This is a one-time setup cost.

```js
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createTree, mplBubblegum } from "@metaplex-foundation/mpl-bubblegum";
import { generateSigner, keypairIdentity } from "@metaplex-foundation/umi";
```

We're using Metaplex's Umi framework and Bubblegum program:

- **Umi** — Metaplex's SDK for interacting with Solana. It handles serialisation, signing, and RPC calls
- **Bubblegum** — The program that manages compressed NFTs. It's deployed on Solana and we interact with it through these libraries
- `generateSigner` — Creates a new keypair for the tree address
- `keypairIdentity` — Sets up our wallet as the transaction signer

Setting up the connection:

```js
const umi = createUmi("https://api.devnet.solana.com").use(mplBubblegum());

const keypairPath = path.join(homedir(), ".config", "solana", "id.json");
const secretKey = new Uint8Array(await Bun.file(keypairPath).json());
const keypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
umi.use(keypairIdentity(keypair));
```

- `createUmi()` — Connects to the Solana devnet RPC
- `.use(mplBubblegum())` — Loads the Bubblegum plugin so we can call its instructions
- The keypair is loaded from the Solana CLI's default location (`~/.config/solana/id.json`)
- `Bun.file().json()` — Bun's native file API, cleaner than Node's fs module

Creating the tree:

```js
const merkleTree = generateSigner(umi);

const tx = await createTree(umi, {
  merkleTree,
  maxDepth: 14,
  maxBufferSize: 64,
}).sendAndConfirm(umi);
```

The tree configuration is important:

- `maxDepth: 14` — The tree can hold 2^14 = 16,384 NFTs. Deeper trees cost more to create but hold more NFTs
- `maxBufferSize: 64` — How many concurrent mints the tree can handle. Higher = more parallelism but costs more

Here's how depth relates to capacity and cost:

| Max Depth | Capacity  | Approx. Cost |
| --------- | --------- | ------------ |
| 14        | 16,384    | ~0.5 SOL     |
| 17        | 131,072   | ~1.5 SOL     |
| 20        | 1,048,576 | ~5 SOL       |

For a collection of ~3,000 NFTs, depth 14 gives us plenty of headroom.

## Part 3: Minting

With the tree created, minting is straightforward:

```js
import { mintV1, mplBubblegum } from "@metaplex-foundation/mpl-bubblegum";
import { publicKey } from "@metaplex-foundation/umi";
import { generateSvg, generateMetadata } from "./generateSvg.js";

// Generate artwork for this wallet
const svg = generateSvg(recipientAddress);
const svgBase64 = Buffer.from(svg).toString("base64");
const dataUri = `data:image/svg+xml;base64,${svgBase64}`;
```

The SVG gets converted to a base64 data URI. This means the entire image is embedded in the metadata — no external hosting required.

```js
const tx = await mintV1(umi, {
  leafOwner: publicKey(recipientAddress),
  merkleTree: publicKey(treeConfig.treeAddress),
  metadata: {
    name: `Generative #${recipientAddress.slice(0, 8)}`,
    symbol: "GENV",
    uri: dataUri,
    sellerFeeBasisPoints: 0,
    collection: null,
    creators: [
      {
        address: keypair.publicKey,
        verified: false,
        share: 100,
      },
    ],
  },
}).sendAndConfirm(umi);
```

Breaking down the mint parameters:

- `leafOwner` — Who receives the NFT. This is the wallet we're minting to
- `merkleTree` — The tree we created in step 2
- `metadata.uri` — Normally this would be an Arweave/IPFS link, but we're using a data URI for simplicity
- `sellerFeeBasisPoints: 0` — No royalties (100 basis points = 1%)
- `creators` — Who created this NFT. Required for marketplace compatibility

### A Note on Metadata Storage

For devnet testing, embedding the SVG as a data URI works fine. For production, you'd typically:

1. Upload the SVG to Arweave (permanent storage) or IPFS
2. Create a JSON metadata file pointing to that image
3. Upload the JSON to Arweave/IPFS
4. Use that JSON URI in the mint

[Irys](https://irys.xyz/) (formerly Bundlr) makes Arweave uploads easy and relatively cheap — about $0.01-0.02 per file for small SVGs.

## Running It Yourself

Here's the full workflow:

```bash
# Create project
mkdir cnft-test && cd cnft-test

# Initialise and install dependencies
bun init -y
bun add @metaplex-foundation/mpl-bubblegum \
        @metaplex-foundation/umi \
        @metaplex-foundation/umi-bundle-defaults \
        @solana/web3.js bs58

# Make sure Solana CLI is on devnet
solana config set --url devnet

# Get some devnet SOL (need ~0.5 for tree creation)
solana airdrop 2

# Check it worked
solana balance
```

Then create the three files (generateSvg.js, 1-create-tree.js, 2-mint-cnft.js) and run:

```bash
# Create the tree (one-time, ~0.5 SOL)
bun 1-create-tree.js

# Mint to yourself
bun 2-mint-cnft.js YOUR_WALLET_ADDRESS

# Or mint to someone else
bun 2-mint-cnft.js THEIR_WALLET_ADDRESS
```

The first mint might take 10-15 seconds. Subsequent mints are faster as the tree is already warmed up.

## Viewing Your cNFT

Compressed NFTs won't show up immediately in all wallets because they require indexing. Your options:

1. **Phantom** — Usually picks them up within a minute on devnet
2. **Solana Explorer** — Search for the transaction signature
3. **Helius API** — Query `getAssetsByOwner` for instant results

If you're building a production app, Helius or Triton provide specialised RPC endpoints that index cNFTs in real-time.

## Cost Breakdown

For a collection of 3,000 NFTs:

| Item                       | Cost          |
| -------------------------- | ------------- |
| Merkle tree (depth 14)     | ~0.5 SOL      |
| 3,000 mints @ 0.00001 SOL  | ~0.03 SOL     |
| Arweave storage (via Irys) | ~$30-50       |
| **Total**                  | **~$100-150** |

Compare that to traditional NFTs at ~0.01 SOL each: 3,000 × 0.01 = 30 SOL (~$4,500).

## What's Next

This is a foundation for a real project — commemorative NFTs for event attendees. The next steps would be:

1. **Holder verification** — Check the recipient owns a specific NFT before minting
2. **Web UI** — A simple page where people can connect their wallet and mint
3. **Production art** — Replace the generic palettes with proper branded artwork
4. **Mainnet deployment** — Same code, just change the RPC URL

The beauty of cNFTs is that the minting cost is essentially free once the tree exists. You could mint to 10,000 wallets and it'd cost less than a cup of coffee.

---

_This is part of my journey learning Solana development. Next up: building the holder verification and web minting interface._

**Code:** All code is copy-paste ready. If something doesn't work, let me know.

#solana #nft #web3 #javascript #bun
