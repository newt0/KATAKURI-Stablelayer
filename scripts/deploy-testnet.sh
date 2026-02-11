#!/bin/bash
# =============================================================================
# KATAKURI Market - Testnet Deploy Script
# =============================================================================
# Usage:
#   ./scripts/deploy-testnet.sh
#
# Prerequisites:
#   1. Install Sui CLI: cargo install --locked sui
#   2. Import wallet:
#      sui keytool import "suiprivkey1qp9gg35c7mxfwvew3593tvl7rv3k5x4url6lhj4v4jtqundjd5drx4zz3aa" ed25519
#   3. Switch to wallet:
#      sui client switch --address 0xedd88de5d680a478c65635cadfadced5e1214f8616bfc129794d932f594ed179
#   4. Ensure testnet is active:
#      sui client switch --env testnet
#   5. Check gas:
#      sui client gas
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR/../contracts/katakuri_market"
OUTPUT_FILE="$SCRIPT_DIR/deploy-output.json"

echo "=========================================="
echo " KATAKURI Market - Testnet Deployment"
echo "=========================================="

# Verify environment
echo ""
echo "[1/4] Verifying environment..."
sui --version || { echo "ERROR: sui CLI not found. Install with: cargo install --locked sui"; exit 1; }

ACTIVE_ENV=$(sui client active-env 2>/dev/null || echo "unknown")
echo "  Active environment: $ACTIVE_ENV"
if [ "$ACTIVE_ENV" != "testnet" ]; then
    echo "  Switching to testnet..."
    sui client switch --env testnet
fi

ACTIVE_ADDR=$(sui client active-address 2>/dev/null || echo "unknown")
echo "  Active address: $ACTIVE_ADDR"

# Check gas
echo ""
echo "[2/4] Checking gas balance..."
sui client gas
echo ""

# Build
echo "[3/4] Building contract..."
cd "$PROJECT_DIR"
sui move build
echo "  Build successful!"

# Publish
echo ""
echo "[4/4] Publishing to testnet..."
PUBLISH_OUTPUT=$(sui client publish --gas-budget 200000000 --json 2>&1)
echo "$PUBLISH_OUTPUT" > "$OUTPUT_FILE"

# Extract package ID
PACKAGE_ID=$(echo "$PUBLISH_OUTPUT" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for change in data.get('objectChanges', []):
    if change.get('type') == 'published':
        print(change['packageId'])
        break
" 2>/dev/null || echo "PARSE_ERROR")

if [ "$PACKAGE_ID" = "PARSE_ERROR" ]; then
    echo "  WARNING: Could not parse package ID from output."
    echo "  Check $OUTPUT_FILE for full output."
    echo ""
    echo "  Raw output (last 20 lines):"
    echo "$PUBLISH_OUTPUT" | tail -20
else
    echo ""
    echo "=========================================="
    echo " DEPLOYMENT SUCCESSFUL!"
    echo "=========================================="
    echo ""
    echo "  Package ID:  $PACKAGE_ID"
    echo "  Explorer:    https://suiscan.xyz/testnet/object/$PACKAGE_ID"
    echo ""
    echo "  Full output: $OUTPUT_FILE"
    echo ""
    echo "  Save this Package ID for E2E testing:"
    echo "    export KATAKURI_PACKAGE=$PACKAGE_ID"
fi
