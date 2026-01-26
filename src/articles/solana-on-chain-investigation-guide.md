---
title: "Reverse Engineering a Solana Program: A Beginner's Guide"
description: "How to decode an unknown staking program using only on-chain data, transaction history, and patience. A step-by-step walkthrough of reading raw bytes off the blockchain."
tags: ["solana", "reverse-engineering", "on-chain", "staking", "web3"]
pubDate: "2026-01-26T09:00:00Z"
---

## Reverse Engineering a Solana Program: A Beginner's Guide

How to decode an unknown staking program using only on-chain data, transaction history, and patience.

---

## Prerequisites

This guide assumes you're comfortable with:

- **Solana basics** — accounts, programs, transactions, and how they relate
- **SPL tokens** — token accounts, mints, and decimals
- **PDAs** — what Program Derived Addresses are and why programs use them
- **Base58 encoding** — Solana's address format (similar to Bitcoin's)
- **Command line** — running `curl` and basic Python scripts

If any of these are unfamiliar, the [Solana docs](https://solana.com/docs) cover them well.

---

## Before You Start: Check for an IDL

Before manually decoding bytes, check if the program has a published Anchor IDL — it could save you the entire investigation:

```bash
# Try fetching the program's IDL (Anchor programs only)
anchor idl fetch PROGRAM_ADDRESS --provider.cluster mainnet

# Or check the IDL account directly
curl -X POST "RPC_URL" -d '{
  "method": "getAccountInfo",
  "params": ["IDL_ACCOUNT_ADDRESS", {"encoding": "base64"}]
}'
```

If an IDL exists, it gives you the full account layout and instruction definitions for free. This guide covers what to do when there isn't one.

---

## What We Started With

- A wallet address: `7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU`
- A program address: `SKRskrmtL83pcL4YqLWt6iPefDqwXQWHSw9S9vz94BZ`
- A question: "Why haven't I received any staking rewards?"

No source code. No documentation. No ABI. Just raw bytes on-chain.

---

## The Toolbox

Before diving in, here's what you need:

| Tool                                      | What It Does                                                           |
| ----------------------------------------- | ---------------------------------------------------------------------- |
| **Helius Enhanced Transactions API**      | Returns human-readable transaction history with parsed token transfers |
| **Solana RPC (`getAccountInfo`)**         | Fetches raw binary data from any on-chain account                      |
| **Solana RPC (`getTokenAccountBalance`)** | Gets SPL token balance for a token account                             |
| **Python/Node**                           | For decoding binary data (base64 → bytes → u64/pubkeys)                |
| **Base58 decoder**                        | Converts Solana addresses to/from raw bytes                            |

You can use any Solana RPC provider (Helius, QuickNode, Alchemy, etc). The Enhanced Transactions API is Helius-specific and saves a lot of time vs raw `getTransaction` calls.

---

## Step 1: Start With Transaction History

**The principle:** Account data on its own is just meaningless bytes. But transactions show those bytes in action — alongside things you already recognize (your wallet address, the Token Program, token transfers with real amounts). The things you can already identify help you decode the things you can't. Start here.

### What to do:

Fetch the wallet's transaction history filtered to the program you care about:

```bash
curl "https://api.helius.xyz/v0/addresses/YOUR_WALLET/transactions?api-key=KEY&limit=50"
```

### What to look for:

Each transaction contains:

- **`instructions[]`** — the program calls made, with their accounts and data
- **`tokenTransfers[]`** — any SPL tokens that moved (mint, amount, from, to)
- **`timestamp`** / **`slot`** — when it happened

Filter to only transactions that include your target program:

```python
for tx in transactions:
    for ix in tx['instructions']:
        if ix['programId'] == 'SKRskrmtL83pcL4YqLWt6iPefDqwXQWHSw9S9vz94BZ':
            print(ix['accounts'])  # <- this is gold
            print(ix['data'])      # <- instruction data (discriminator + args)
```

### What we found:

The user had 17 staking transactions. Each staking instruction had 12 accounts in a consistent pattern:

```
[0]  3vZ67GJ1TkPGVm7pFLZkzYmVwgHEkJoGq1pNFsMXy3MV   <- ???
[1]  4HQy82s9CHTv1GsYKnANHMiHfhcqesYkK6sB3RDSYyqw   <- ???
[2]  DPJ58trLsF9yPrBa2pk6UaRkvqW8hWUYjawe788WBuqr   <- ???
[3]  7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU   <- user's wallet!
[4]  7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU   <- same (fee payer)
[5]  9dKtcYMpbMK2BaRqFzgHJkR5DBodNbJvAiNi3e3fqMLP   <- ???
[6]  8isViKbwhuhFhsv2t8vaFL74pKCqaFPQXo1KkeQwZbB8   <- ???
[7]  SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3   <- token mint!
[8]  TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA     <- Token Program
[9]  11111111111111111111111111111111                   <- System Program
[10] Hy7LRZK5GnpVHQzcGNHF9qPUgtjRDXS2BUiQps7ePnkG   <- ???
[11] SKRskrmtL83pcL4YqLWt6iPefDqwXQWHSw9S9vz94BZ    <- the program itself
```

We immediately know accounts [3]/[4] (wallet), [7] (token mint), [8] (Token Program), [9] (System Program), [11] (staking program). The unknowns need investigation.

---

## Step 2: Identify Accounts by Their Behavior

**The principle:** You can learn what an account IS by looking at what happens TO it.

### Token transfers reveal token accounts:

From the `tokenTransfers` array, we can see:

- Tokens flow FROM account[5] TO account[6] during stake operations
- Account[5] is the user's token account (tokens leave it)
- Account[6] is the pool's token account (tokens arrive there)

### Cross-reference with other users:

This is the crucial step that most beginners miss. **Look at OTHER people's transactions with the same program.**

### How to find other users:

Query the program's own transaction history — not yours:

```bash
# Fetch recent transactions for the PROGRAM (not your wallet)
curl "https://api.helius.xyz/v0/addresses/PROGRAM_ADDRESS/transactions?api-key=KEY&limit=50"
```

Pick a transaction from a different wallet and inspect it:

```bash
curl -X POST "RPC_URL" -d '{
  "method": "getTransaction",
  "params": ["SOME_OTHER_USERS_TX_SIGNATURE", {"encoding": "json"}]
}'
```

When we checked another user's staking transaction, we found:

```
[0]  8xy6aPFwP9ccGUhbovqfZWEAXLGfK3KVUp6yQrFm75uQ   <- DIFFERENT!
[1]  4HQy82s9CHTv1GsYKnANHMiHfhcqesYkK6sB3RDSYyqw   <- same
[2]  DPJ58trLsF9yPrBa2pk6UaRkvqW8hWUYjawe788WBuqr   <- same
[3]  6yUWA672zFJmpEFgnFiwGiX4BpBWuTdYB36baW1J8BFi   <- their wallet
```

This tells us:

- **Account[0]** is different per user = **per-user PDA** (their staking record)
- **Account[1]** is the same for everyone = **pool account** (shared state)
- **Account[2]** is the same for everyone = **shared staker/guardian PDA**

This distinction (per-user vs shared) is critical and you can ONLY discover it by comparing across multiple users.

---

## Step 3: Decode Instruction Discriminators

**The principle:** Solana programs identify which function to call using the first 8 bytes of instruction data. These are called "discriminators."

### What to do:

The instruction `data` field is base58-encoded. Decode it to hex and look at the first 8 bytes:

```python
def base58_to_hex(b58_string):
    ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
    result = 0
    for char in b58_string:
        result = result * 58 + ALPHABET.index(char)
    hex_str = hex(result)[2:]
    if len(hex_str) % 2:
        hex_str = '0' + hex_str
    return hex_str

# First 16 hex chars = 8 bytes = discriminator
discriminator = base58_to_hex(instruction_data)[:16]
```

### Group transactions by discriminator:

| Discriminator      | Account Count | Token Direction | Instruction       |
| ------------------ | ------------- | --------------- | ----------------- |
| `ceb0ca12c8d1b36c` | 12            | user → pool     | **Stake**         |
| `5a5f6b2acd7c32e1` | 8             | none            | **Unstake**       |
| `404135e37d9903a7` | 7             | none            | **CancelUnstake** |
| `b712469c946da122` | 8             | pool → user     | **Claim**         |

How did we name them?

- **Token direction** is the biggest clue: tokens going INTO the pool = deposit/stake, tokens coming OUT = withdrawal/claim
- **Account count** helps distinguish: more accounts usually means more complex operations (stake needs token accounts, mints, etc)
- **Program logs** (if available) sometimes literally say the instruction name: `"Instruction: Stake"`

---

## Step 4: Fetch and Decode Account Data

**The principle:** Every on-chain account is just a blob of bytes. The program that owns it knows the layout, but you have to figure it out.

### Fetch the raw bytes:

```bash
curl -X POST "RPC_URL" -d '{
  "method": "getAccountInfo",
  "params": ["ACCOUNT_ADDRESS", {"encoding": "base64"}]
}'
```

The response gives you:

- `data` — base64-encoded bytes (the actual content)
- `owner` — which program owns this account
- `lamports` — SOL balance (rent)
- `space` — byte size of the account

### Decode base64 to a byte array:

```python
import base64, struct

raw = base64.b64decode(response['result']['value']['data'][0])
print(f"Account size: {len(raw)} bytes")
```

### The standard Anchor/Solana account layout:

Most Solana programs follow a pattern:

```
[0-7]    Discriminator (8 bytes) — identifies the account type
[8]      Bump (1 byte) — PDA derivation bump seed
[9-40]   First pubkey (32 bytes)
[41-72]  Second pubkey (32 bytes)
[73-104] Third pubkey (32 bytes)
[105+]   Data fields (u64s, usually 8 bytes each)
```

But you don't KNOW this layout in advance. You discover it.

> **Note:** This layout is specific to Anchor-based programs. Native Solana programs (written without Anchor) can use any byte layout — no discriminator, no bump, fields in any order. If the pubkey alignment trick (Step 5) doesn't work with the Anchor assumptions, try different offsets from scratch.

---

## Step 5: The Pubkey Alignment Trick

**The principle:** If you know what pubkeys SHOULD be in an account, you can use them to find the correct byte alignment.

This was the breakthrough moment in our investigation. The account data looked like random bytes until we tried different starting offsets for pubkey decoding:

```python
# Try reading 32-byte pubkeys starting at different offsets
for start in [8, 9, 10]:
    for i in range(3):
        offset = start + i * 32
        pubkey_bytes = raw[offset:offset+32]
        pubkey = base58_encode(pubkey_bytes)
        print(f"  offset {offset}: {pubkey}")
```

When we tried offset 9 (i.e., 8-byte discriminator + 1-byte bump), the pubkeys decoded to:

```
offset 9:  4HQy82s9CHTv1GsYKnANHMiHfhcqesYkK6sB3RDSYyqw  <- Pool Account!
offset 41: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU  <- User's Wallet!
offset 73: DPJ58trLsF9yPrBa2pk6UaRkvqW8hWUYjawe788WBuqr  <- Guardian PDA!
```

Matching known addresses = correct alignment confirmed.

---

## Step 6: Decode Data Fields

**The principle:** After the pubkeys, expect u64 integers (8 bytes each, little-endian). Use context to figure out what they mean.

```python
# Data starts after disc(8) + bump(1) + pubkeys(3*32) = offset 105
staked = struct.unpack_from('<Q', raw, 105)[0]  # Little-endian unsigned 64-bit
pending = struct.unpack_from('<Q', raw, 113)[0]
field3 = struct.unpack_from('<Q', raw, 121)[0]

# Apply token decimals (SPL tokens usually have 6 or 9)
print(f"Staked: {staked / 1_000_000} tokens")
```

### How to identify what each field means:

1. **Match against known values:** The user staked ~2.5M SKR. If a field reads 2,500,000.000 after dividing by 10^6, that's probably the staked amount.

2. **Check for zero/non-zero patterns:** A field that's 0 when no unstake is pending and non-zero when there is → probably the pending unstake amount.

3. **Look for timestamps:** Unix timestamps are ~1.7 billion right now. If a u64 is in that range, it might be a timestamp.

4. **Compare across multiple accounts:** If a field has the same value in all users' accounts, it's probably a global reference (reward index, config value). If it differs, it's user-specific.

---

## Step 7: Discover the Reward Formula

**The principle:** Compare values across the pool account and user accounts to find mathematical relationships.

We found a field at offset 121 in user accounts and offset 137 in the pool account with suspiciously similar values near 1.0 (when interpreted with 9 decimal places):

```
Pool account [137]:  1.001442316  (global reward index)
User1 account [121]: 1.000250000  (user's snapshot)
User2 account [121]: 1.000041614  (user's snapshot)
```

The formula clicked when we calculated:

```
pendingRewards = stakedAmount * (globalIndex - userIndex)
               = 2,500,000.000 * (1.001442316 - 1.000250000)
               = 2,980.79 SKR
```

This is a standard "reward-per-share" accumulator pattern used by many DeFi protocols (Compound, Aave, Sushiswap MasterChef all use variants).

---

## Step 8: Verify Everything

**The principle:** Cross-check your decoded values against observable reality.

| Check                        | Expected         | Decoded                | Match? |
| ---------------------------- | ---------------- | ---------------------- | ------ |
| User's staked amount         | ~2.5M (from app) | 2,500,000.000          | Yes    |
| Pool token balance           | 3.92B (from RPC) | 3,922,095,491 (cached) | Yes    |
| Wallet in user account       | `7xKXtg...`      | `7xKXtg...`            | Yes    |
| Pool address in user account | `4HQy82s9...`    | `4HQy82s9...`          | Yes    |
| Seconds per period           | 48h = 172,800    | 172,800                | Yes    |

---

## Common Patterns to Recognize

### PDAs (Program Derived Addresses)

Accounts owned by programs are usually PDAs. They have a "bump" byte stored at offset 8. The bump is used in the PDA derivation: `findProgramAddress(seeds, programId)`.

- Different bumps (255, 254, 253...) across user accounts confirms they're individually derived PDAs
- Same address across all users = shared/global account

### The Reward Index Pattern

Very common in staking/lending:

```
globalIndex += rewardsThisPeriod / totalStaked
userPendingReward = userStaked * (globalIndex - userSavedIndex)
```

When user interacts (stake/unstake/claim):

1. Calculate and settle their pending rewards
2. Update their saved index to current global index

### Account Size as a Type Indicator

Different account types have different byte sizes:

- Pool account: 193 bytes
- Per-user staker: 169 bytes
- Guardian/shared staker: 188 bytes

You can use `space` from `getAccountInfo` to quickly categorize unknown accounts.

### Discriminator as Account Type

The first 8 bytes identify what KIND of account it is:

- `ee972b030b973fb0` = Pool
- `6635a36b098a5799` = Per-user staker
- `85eeffd6d70bbd17` = Guardian/shared staker

If you see a discriminator you don't recognize, search transaction history for other accounts with the same size and owner program.

---

## The Investigation Flow (Summary)

```
1. Get transaction history for your wallet
         ↓
2. Find all instructions involving the target program
         ↓
3. Group by discriminator → discover instruction types
         ↓
4. Map token transfer direction → name the instructions
         ↓
5. Compare account lists across multiple users
         ↓
6. Identify shared vs per-user accounts
         ↓
7. Fetch account data (getAccountInfo)
         ↓
8. Try byte alignments until pubkeys match known addresses
         ↓
9. Decode remaining fields as u64s
         ↓
10. Match decoded values to known amounts
         ↓
11. Compare fields across accounts to find formulas
         ↓
12. Verify everything cross-checks
```

---

## Mistakes I Made (And How to Avoid Them)

### 1. Assumed account[2] was per-user

My initial assumption was that account index [2] in staking instructions was the per-user staker PDA. It was actually the **shared guardian** used by ALL users.

**Fix:** Always check at least 2-3 different users' transactions before concluding which accounts are per-user vs shared.

### 2. Used wrong byte alignment

I initially read u64 values at 8-byte-aligned offsets (0, 8, 16, 24...) without accounting for the 1-byte bump after the discriminator. This gave nonsensical values.

**Fix:** Use the pubkey alignment trick (Step 5). If you know any pubkey that should be in the account, scan for it at different offsets. When it matches, you've found the correct alignment.

### 3. Forgot programs can be upgraded

The discriminator for "Stake" changed between older transactions and newer ones (`ceb0ca12...` → `229259c4...`). This happens when a program is upgraded and its instruction layout changes.

**Fix:** Check transactions from different time periods. If discriminators change, the program was upgraded. Support both variants.

### 4. Confused shares with tokens

The pool uses a share-based system where share_value = pool_balance / total_shares. I initially confused raw share counts with token amounts.

**Fix:** Always check the scale. If a value seems wildly wrong (1.6B when you expected 2.5M), you might be reading the wrong offset, wrong decimals, or confusing shares with tokens.

---

## Tools for Your Own Investigations

### Quick Account Inspection (Python one-liner)

```bash
curl -s -X POST "RPC_URL" -d '{
  "jsonrpc":"2.0","id":1,
  "method":"getAccountInfo",
  "params":["ACCOUNT_ADDRESS",{"encoding":"base64"}]
}' | python3 -c "
import json, sys, base64, struct
data = json.load(sys.stdin)
raw = base64.b64decode(data['result']['value']['data'][0])
print(f'Size: {len(raw)} bytes')
print(f'Discriminator: {raw[0:8].hex()}')
print(f'Bump: {raw[8]}')
for i in range(105, len(raw)-7, 8):
    val = struct.unpack_from('<Q', raw, i)[0]
    if val > 0:
        print(f'  offset {i}: {val} ({val/1_000_000:,.6f} as 6-dec)')
"
```

### Base58 Encode (for reading pubkeys from raw bytes)

```python
ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

def b58encode(data: bytes) -> str:
    n = int.from_bytes(data, 'big')
    result = []
    while n > 0:
        n, r = divmod(n, 58)
        result.append(ALPHABET[r])
    for byte in data:
        if byte == 0:
            result.append('1')
        else:
            break
    return ''.join(reversed(result))

# Read pubkey at offset 9:
pubkey = b58encode(raw[9:41])
```

### Compare Two Accounts

```python
# Fetch two users' per-user accounts and compare field by field
# Fields that match = shared/global values
# Fields that differ = user-specific data
for offset in range(105, min(len(raw1), len(raw2))-7, 8):
    v1 = struct.unpack_from('<Q', raw1, offset)[0]
    v2 = struct.unpack_from('<Q', raw2, offset)[0]
    marker = " <-- SAME" if v1 == v2 else ""
    print(f"offset {offset}: user1={v1}, user2={v2}{marker}")
```

### End-to-End Investigation Script

A single script that ties all the steps together. Plug in an account address and it dumps everything you need to start investigating:

```python
import json, base64, struct, urllib.request

ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
RPC_URL = "https://api.mainnet-beta.solana.com"  # or your provider

def b58encode(data: bytes) -> str:
    n = int.from_bytes(data, 'big')
    result = []
    while n > 0:
        n, r = divmod(n, 58)
        result.append(ALPHABET[r])
    for byte in data:
        if byte == 0:
            result.append('1')
        else:
            break
    return ''.join(reversed(result))

def fetch_account(address):
    payload = json.dumps({
        "jsonrpc": "2.0", "id": 1,
        "method": "getAccountInfo",
        "params": [address, {"encoding": "base64"}]
    }).encode()
    req = urllib.request.Request(RPC_URL, data=payload,
        headers={"Content-Type": "application/json"})
    resp = json.loads(urllib.request.urlopen(req).read())
    return resp['result']['value']

def decode_account(address):
    info = fetch_account(address)
    if not info:
        print(f"Account {address} not found")
        return
    raw = base64.b64decode(info['data'][0])
    print(f"\n=== {address} ===")
    print(f"Owner:  {info['owner']}")
    print(f"Size:   {len(raw)} bytes")
    print(f"Disc:   {raw[0:8].hex()}")
    if len(raw) > 8:
        print(f"Bump:   {raw[8]}")
    # Try Anchor layout: pubkeys at offset 9
    print("\n-- Pubkeys (assuming Anchor layout) --")
    for i in range(3):
        offset = 9 + i * 32
        if offset + 32 <= len(raw):
            print(f"  offset {offset}: {b58encode(raw[offset:offset+32])}")
    # Data fields after pubkeys
    data_start = 9 + 3 * 32  # 105
    print("\n-- u64 fields --")
    for i in range(data_start, len(raw) - 7, 8):
        val = struct.unpack_from('<Q', raw, i)[0]
        if val > 0:
            print(f"  offset {i}: {val:>20} | 6-dec: {val/1e6:>16,.6f} | 9-dec: {val/1e9:>16,.9f}")

# Usage: decode_account("YOUR_ACCOUNT_ADDRESS")
decode_account("PASTE_ADDRESS_HERE")
```

---

## What We Answered

After all this work, we answered the original question:

> "Why haven't I received any rewards?"

**Answer:** You HAVE rewards accumulating (2,980.79 SKR). The reward index mechanism is working — it's just that inflation only started 24 hours ago, so the accumulated amount is small. The app hasn't updated its UI to show pending rewards yet, but the on-chain math is already tracking them for you.

The entire investigation — from "I don't see rewards" to "here's exactly how rewards are calculated and you have 2,980.79 pending" — was done purely by reading bytes off the blockchain.
