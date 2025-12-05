---
title: "Connecting Wallets in the Browser"
description: "Learn how browser wallet extensions like Phantom work and how to detect and connect to them from your web app."
tags: ["solana", "javascript", "web3", "wallets", "phantom"]
pubDate: "2025-12-04T12:00:00Z"
series: "solana-for-js-devs"
seriesOrder: 7
---

So far we've worked in Bun with keypair files. But real web apps need to connect to browser wallets like Phantom or Solflare.

This is where Solana development gets interesting for frontend developers.

## How Browser Wallets Work

When you install Phantom, it injects an object into the browser's `window`:

```javascript
window.phantom.solana;
```

This object provides methods to:

- Connect (request permission)
- Get the user's public key
- Sign transactions
- Sign messages

The user's private key never leaves the extension. Your app only gets the public key and the ability to request signatures.

```
┌─────────────────┐     ┌─────────────────┐
│   Your Web App  │────▶│  Phantom Ext    │
│                 │     │                 │
│  "Sign this tx" │     │  User approves  │
│                 │◀────│  Returns sig    │
└─────────────────┘     └─────────────────┘
                              │
                              ▼
                        Private key stays
                        in the extension
```

## Detecting Phantom

First, check if Phantom is installed:

```typescript
function getPhantom() {
  if (typeof window === "undefined") return null;

  const phantom = (window as any).phantom?.solana;

  if (phantom?.isPhantom) {
    return phantom;
  }

  return null;
}

// Usage
const phantom = getPhantom();

if (!phantom) {
  console.log("Phantom not installed");
  // Could redirect to phantom.app
}
```

## Connecting

Request permission to connect:

```typescript
async function connectWallet() {
  const phantom = getPhantom();

  if (!phantom) {
    window.open("https://phantom.app/", "_blank");
    return null;
  }

  try {
    const response = await phantom.connect();
    console.log("Connected:", response.publicKey.toBase58());
    return response.publicKey;
  } catch (err) {
    console.error("Connection rejected:", err);
    return null;
  }
}
```

When you call `connect()`, Phantom shows a popup asking the user to approve. If they approve, you get their public key.

## Checking Connection State

Phantom remembers connections. Check if already connected:

```typescript
async function checkConnection() {
  const phantom = getPhantom();

  if (!phantom) return null;

  // Check if already connected
  if (phantom.isConnected && phantom.publicKey) {
    return phantom.publicKey;
  }

  // Try to reconnect silently (no popup)
  try {
    const response = await phantom.connect({ onlyIfTrusted: true });
    return response.publicKey;
  } catch {
    // User hasn't approved this site yet
    return null;
  }
}
```

The `onlyIfTrusted: true` option attempts to connect without showing a popup - it only works if the user has previously approved your site.

## Disconnecting

```typescript
async function disconnectWallet() {
  const phantom = getPhantom();

  if (phantom) {
    await phantom.disconnect();
  }
}
```

## Listening for Changes

Phantom emits events when the connection state changes:

```typescript
function setupWalletListeners() {
  const phantom = getPhantom();

  if (!phantom) return;

  phantom.on("connect", (publicKey: any) => {
    console.log("Connected:", publicKey.toBase58());
  });

  phantom.on("disconnect", () => {
    console.log("Disconnected");
  });

  phantom.on("accountChanged", (publicKey: any) => {
    if (publicKey) {
      console.log("Switched to:", publicKey.toBase58());
    } else {
      console.log("Disconnected");
    }
  });
}
```

## A Complete Vanilla JS Example

Here's a minimal HTML page that connects to Phantom:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Phantom Connect</title>
    <script src="https://unpkg.com/@solana/web3.js@latest/lib/index.iife.min.js"></script>
  </head>
  <body>
    <button id="connect">Connect Wallet</button>
    <button id="disconnect" style="display:none">Disconnect</button>
    <p id="address"></p>

    <script>
      const connectBtn = document.getElementById("connect");
      const disconnectBtn = document.getElementById("disconnect");
      const addressEl = document.getElementById("address");

      function getPhantom() {
        return window.phantom?.solana?.isPhantom ? window.phantom.solana : null;
      }

      function updateUI(publicKey) {
        if (publicKey) {
          addressEl.textContent = `Connected: ${publicKey.toBase58()}`;
          connectBtn.style.display = "none";
          disconnectBtn.style.display = "inline";
        } else {
          addressEl.textContent = "";
          connectBtn.style.display = "inline";
          disconnectBtn.style.display = "none";
        }
      }

      connectBtn.onclick = async () => {
        const phantom = getPhantom();
        if (!phantom) {
          window.open("https://phantom.app/", "_blank");
          return;
        }

        try {
          const { publicKey } = await phantom.connect();
          updateUI(publicKey);
        } catch (err) {
          console.error(err);
        }
      };

      disconnectBtn.onclick = async () => {
        const phantom = getPhantom();
        if (phantom) {
          await phantom.disconnect();
          updateUI(null);
        }
      };

      // Check on page load
      window.onload = async () => {
        const phantom = getPhantom();
        if (phantom?.isConnected) {
          updateUI(phantom.publicKey);
        }
      };
    </script>
  </body>
</html>
```

## Other Wallets

Phantom isn't the only wallet. Others include:

- **Solflare** - `window.solflare`
- **Backpack** - `window.backpack`
- **Glow** - `window.glow`

Each has slightly different APIs. This is why wallet adapter libraries exist - they normalize the interface.

## The Wallet Standard

Solana wallets are moving toward the "Wallet Standard" - a unified interface:

```typescript
// The new standard way to detect wallets
import { getWallets } from "@wallet-standard/app";

const { get } = getWallets();
const wallets = get();

// Lists all installed wallets that support the standard
wallets.forEach((wallet) => {
  console.log(wallet.name, wallet.icon);
});
```

We'll use this in the next post when building our Svelte wallet component.

## TypeScript Types

Add type safety for Phantom:

```typescript
// src/types/phantom.d.ts
import { PublicKey, Transaction } from "@solana/web3.js";

interface PhantomProvider {
  isPhantom: boolean;
  isConnected: boolean;
  publicKey: PublicKey | null;

  connect(opts?: {
    onlyIfTrusted?: boolean;
  }): Promise<{ publicKey: PublicKey }>;
  disconnect(): Promise<void>;

  signTransaction(tx: Transaction): Promise<Transaction>;
  signAllTransactions(txs: Transaction[]): Promise<Transaction[]>;
  signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }>;

  on(event: "connect", callback: (publicKey: PublicKey) => void): void;
  on(event: "disconnect", callback: () => void): void;
  on(
    event: "accountChanged",
    callback: (publicKey: PublicKey | null) => void
  ): void;
}

declare global {
  interface Window {
    phantom?: {
      solana?: PhantomProvider;
    };
  }
}
```

## What You Learned

- Browser wallets inject objects into `window`
- `connect()` requests permission and returns the public key
- Private keys never leave the wallet extension
- Users can disconnect or switch accounts
- Different wallets have different APIs (hence adapter libraries)

## Next Up

Now that we understand how wallet connections work, let's build a proper Svelte component that handles all of this with reactive state.
