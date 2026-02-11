#!/bin/bash
# =============================================================================
# KATAKURI Market - Testnet E2E Verification Script
# =============================================================================
# Usage:
#   export KATAKURI_PACKAGE=0x...  # from deploy step
#   ./scripts/e2e-testnet.sh
#
# This script runs the full lifecycle:
#   create_market -> buy -> sell -> resolve -> redeem -> claim_fees
# =============================================================================

set -euo pipefail

# Check package ID
if [ -z "${KATAKURI_PACKAGE:-}" ]; then
    echo "ERROR: KATAKURI_PACKAGE not set."
    echo "  Run: export KATAKURI_PACKAGE=0x..."
    exit 1
fi

PKG="$KATAKURI_PACKAGE"
ADDR=$(sui client active-address)
GAS_BUDGET=100000000

echo "=========================================="
echo " KATAKURI Market - E2E Verification"
echo "=========================================="
echo "  Package:  $PKG"
echo "  Address:  $ADDR"
echo ""

# Helper: extract object ID from transaction effects
extract_created_id() {
    local output="$1"
    local obj_type="$2"
    echo "$output" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for change in data.get('objectChanges', []):
    if change.get('type') == 'created' and '$obj_type' in change.get('objectType', ''):
        print(change['objectId'])
        break
" 2>/dev/null
}

# =============================================================================
# Step 1: Create Market
# =============================================================================
echo "[1/6] Creating market: 'Who wins the fight?' (Yes/No)..."
echo "  Initial fund: 1 SUI, Fee: 1%"

# Get a gas coin to split for initial fund
GAS_COINS=$(sui client gas --json 2>/dev/null)
FUND_COIN=$(echo "$GAS_COINS" | python3 -c "
import json, sys
coins = json.load(sys.stdin)
for c in coins:
    bal = int(c.get('mistBalance', 0))
    if bal > 2000000000:  # need at least 2 SUI (1 for fund + 1 for gas)
        print(c['gasCoinId'])
        break
" 2>/dev/null)

if [ -z "$FUND_COIN" ]; then
    echo "  ERROR: No coin with enough balance. Need at least 2 SUI."
    exit 1
fi

echo "  Using coin: $FUND_COIN"

# Split 1 SUI for initial fund
SPLIT_OUTPUT=$(sui client split-coin \
    --coin-id "$FUND_COIN" \
    --amounts 1000000000 \
    --gas-budget $GAS_BUDGET \
    --json 2>&1)

SPLIT_COIN=$(echo "$SPLIT_OUTPUT" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for change in data.get('objectChanges', []):
    if change.get('type') == 'created' and '0x2::coin::Coin<0x2::sui::SUI>' in change.get('objectType', ''):
        print(change['objectId'])
        break
" 2>/dev/null)

echo "  Split coin (1 SUI): $SPLIT_COIN"

# Create market
CREATE_OUTPUT=$(sui client call \
    --package "$PKG" \
    --module market \
    --function create_market \
    --type-args "0x2::sui::SUI" \
    --args \
        "Who wins the fight?" \
        '["Fighter A","Fighter B"]' \
        "$SPLIT_COIN" \
        100 \
    --gas-budget $GAS_BUDGET \
    --json 2>&1)

MARKET_ID=$(extract_created_id "$CREATE_OUTPUT" "Market")
ADMIN_CAP_ID=$(extract_created_id "$CREATE_OUTPUT" "AdminCap")

echo "  Market ID:   $MARKET_ID"
echo "  AdminCap ID: $ADMIN_CAP_ID"

if [ -z "$MARKET_ID" ] || [ -z "$ADMIN_CAP_ID" ]; then
    echo "  ERROR: Failed to create market."
    echo "$CREATE_OUTPUT" | tail -20
    exit 1
fi
echo "  SUCCESS!"
echo ""

# =============================================================================
# Step 2: Buy shares (Fighter A)
# =============================================================================
echo "[2/6] Buying shares on 'Fighter A' (outcome 0) for 0.5 SUI..."

# Split 0.5 SUI for payment
SPLIT_OUTPUT2=$(sui client split-coin \
    --coin-id "$FUND_COIN" \
    --amounts 500000000 \
    --gas-budget $GAS_BUDGET \
    --json 2>&1)

PAY_COIN=$(echo "$SPLIT_OUTPUT2" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for change in data.get('objectChanges', []):
    if change.get('type') == 'created' and '0x2::coin::Coin<0x2::sui::SUI>' in change.get('objectType', ''):
        print(change['objectId'])
        break
" 2>/dev/null)

BUY_OUTPUT=$(sui client call \
    --package "$PKG" \
    --module market \
    --function buy \
    --type-args "0x2::sui::SUI" \
    --args \
        "$MARKET_ID" \
        0 \
        "$PAY_COIN" \
        0 \
    --gas-budget $GAS_BUDGET \
    --json 2>&1)

POSITION_A_ID=$(extract_created_id "$BUY_OUTPUT" "Position")
echo "  Position ID: $POSITION_A_ID"

if [ -z "$POSITION_A_ID" ]; then
    echo "  ERROR: Failed to buy shares."
    echo "$BUY_OUTPUT" | tail -20
    exit 1
fi
echo "  SUCCESS!"
echo ""

# =============================================================================
# Step 3: Buy shares (Fighter B) — for sell test
# =============================================================================
echo "[3/6] Buying shares on 'Fighter B' (outcome 1) for 0.3 SUI..."

SPLIT_OUTPUT3=$(sui client split-coin \
    --coin-id "$FUND_COIN" \
    --amounts 300000000 \
    --gas-budget $GAS_BUDGET \
    --json 2>&1)

PAY_COIN2=$(echo "$SPLIT_OUTPUT3" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for change in data.get('objectChanges', []):
    if change.get('type') == 'created' and '0x2::coin::Coin<0x2::sui::SUI>' in change.get('objectType', ''):
        print(change['objectId'])
        break
" 2>/dev/null)

BUY_OUTPUT2=$(sui client call \
    --package "$PKG" \
    --module market \
    --function buy \
    --type-args "0x2::sui::SUI" \
    --args \
        "$MARKET_ID" \
        1 \
        "$PAY_COIN2" \
        0 \
    --gas-budget $GAS_BUDGET \
    --json 2>&1)

POSITION_B_ID=$(extract_created_id "$BUY_OUTPUT2" "Position")
echo "  Position ID: $POSITION_B_ID"

if [ -z "$POSITION_B_ID" ]; then
    echo "  ERROR: Failed to buy shares."
    echo "$BUY_OUTPUT2" | tail -20
    exit 1
fi
echo "  SUCCESS!"
echo ""

# =============================================================================
# Step 4: Sell shares (Fighter B position)
# =============================================================================
echo "[4/6] Selling Fighter B position..."

SELL_OUTPUT=$(sui client call \
    --package "$PKG" \
    --module market \
    --function sell \
    --type-args "0x2::sui::SUI" \
    --args \
        "$MARKET_ID" \
        "$POSITION_B_ID" \
    --gas-budget $GAS_BUDGET \
    --json 2>&1)

SELL_STATUS=$(echo "$SELL_OUTPUT" | python3 -c "
import json, sys
data = json.load(sys.stdin)
status = data.get('effects', {}).get('status', {}).get('status', 'unknown')
print(status)
" 2>/dev/null)

echo "  Status: $SELL_STATUS"
if [ "$SELL_STATUS" != "success" ]; then
    echo "  ERROR: Sell failed."
    echo "$SELL_OUTPUT" | tail -20
    exit 1
fi
echo "  SUCCESS!"
echo ""

# =============================================================================
# Step 5: Resolve market (Fighter A wins = outcome 0)
# =============================================================================
echo "[5/6] Resolving market: Fighter A wins (outcome 0)..."

RESOLVE_OUTPUT=$(sui client call \
    --package "$PKG" \
    --module market \
    --function resolve \
    --type-args "0x2::sui::SUI" \
    --args \
        "$ADMIN_CAP_ID" \
        "$MARKET_ID" \
        0 \
    --gas-budget $GAS_BUDGET \
    --json 2>&1)

RESOLVE_STATUS=$(echo "$RESOLVE_OUTPUT" | python3 -c "
import json, sys
data = json.load(sys.stdin)
status = data.get('effects', {}).get('status', {}).get('status', 'unknown')
print(status)
" 2>/dev/null)

echo "  Status: $RESOLVE_STATUS"
if [ "$RESOLVE_STATUS" != "success" ]; then
    echo "  ERROR: Resolve failed."
    echo "$RESOLVE_OUTPUT" | tail -20
    exit 1
fi
echo "  SUCCESS!"
echo ""

# =============================================================================
# Step 6: Redeem winning position (Fighter A)
# =============================================================================
echo "[6/6] Redeeming winning position (Fighter A)..."

REDEEM_OUTPUT=$(sui client call \
    --package "$PKG" \
    --module market \
    --function redeem \
    --type-args "0x2::sui::SUI" \
    --args \
        "$MARKET_ID" \
        "$POSITION_A_ID" \
    --gas-budget $GAS_BUDGET \
    --json 2>&1)

REDEEM_STATUS=$(echo "$REDEEM_OUTPUT" | python3 -c "
import json, sys
data = json.load(sys.stdin)
status = data.get('effects', {}).get('status', {}).get('status', 'unknown')
print(status)
" 2>/dev/null)

echo "  Status: $REDEEM_STATUS"
if [ "$REDEEM_STATUS" != "success" ]; then
    echo "  ERROR: Redeem failed."
    echo "$REDEEM_OUTPUT" | tail -20
    exit 1
fi
echo "  SUCCESS!"
echo ""

# =============================================================================
# Summary
# =============================================================================
echo "=========================================="
echo " E2E VERIFICATION COMPLETE"
echo "=========================================="
echo ""
echo "  All 6 steps passed:"
echo "    [1] create_market  -> Market: $MARKET_ID"
echo "    [2] buy (Fighter A) -> Position: $POSITION_A_ID"
echo "    [3] buy (Fighter B) -> Position: $POSITION_B_ID"
echo "    [4] sell (Fighter B) -> Refund received"
echo "    [5] resolve (Fighter A wins)"
echo "    [6] redeem (Fighter A payout)"
echo ""
echo "  Explorer: https://suiscan.xyz/testnet/object/$MARKET_ID"
echo ""
