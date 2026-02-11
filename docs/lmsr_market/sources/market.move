module lmsr_market::market {
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use std::string::String;
    use lmsr_market::math;

    /// Error codes
    const EMarketResolved: u64 = 1;
    const EMarketNotResolved: u64 = 2;
    const EInsufficientPayment: u64 = 4;
    const EEmptyOutcomes: u64 = 5;
    const EOutcomeIndexOutOfBounds: u64 = 6;
    const EInvalidPosition: u64 = 7;
    const EInsufficientLiquidity: u64 = 8;

    /// Market object (Shared)
    public struct Market<phantom T> has key {
        id: UID,
        question: String,
        outcomes: vector<String>,
        b: u64,                     // Liquidity param b (in T units)
        q_values: vector<u64>,      // Shares outstanding for each outcome
        balance: Balance<T>,        // Liquidity + User funds
        fee_balance: Balance<T>,    // Accumulated fees
        fee_bps: u64,               // Fee in basis points (100 = 1%)
        resolved: bool,
        winner: Option<u64>,
    }

    /// Admin capability
    public struct AdminCap has key, store {
        id: UID,
        market_id: ID,
    }

    /// User position
    public struct Position has key, store {
        id: UID,
        market_id: ID,
        outcome_index: u64,
        shares: u64,
    }

    // --- Initialization ---

    #[allow(lint(self_transfer))]
    public fun create_market<T>(
        question: String,
        outcomes: vector<String>,
        initial_fund: Coin<T>,
        fee_bps: u64,
        ctx: &mut TxContext
    ) {
        let n = outcomes.length();
        assert!(n >= 2, EEmptyOutcomes);

        let fund_val = coin::value(&initial_fund);
        let fund_q64 = math::to_q64(fund_val);
        let n_q64 = math::to_q64(n);
        let ln_n = math::ln(n_q64);
        
        let b_q64 = math::div(fund_q64, ln_n);
        let b = math::from_q64(b_q64);

        assert!(b > 0, EInsufficientLiquidity);

        let mut q_values = vector[];
        let mut i = 0;
        while (i < n) {
            q_values.push_back(0);
            i = i + 1;
        };

        let market_uid = object::new(ctx);
        let market_id = object::uid_to_inner(&market_uid);

        let market = Market {
            id: market_uid,
            question,
            outcomes,
            b,
            q_values,
            balance: coin::into_balance(initial_fund),
            fee_balance: balance::zero(),
            fee_bps,
            resolved: false,
            winner: std::option::none(),
        };

        transfer::share_object(market);
        
        transfer::public_transfer(AdminCap {
            id: object::new(ctx),
            market_id,
        }, ctx.sender());
    }

    // --- Core Logic Helper ---
    
    fun calculate_cost(q_values: &vector<u64>, b: u64): u128 {
        let n = q_values.length();
        let b_q64 = math::to_q64(b);
        
        let mut sum_exp: u128 = 0;
        let mut i = 0;
        while (i < n) {
            let q = q_values[i];
            let q_ratio = math::div(math::to_q64(q), b_q64);
            let exp_val = math::exp(q_ratio);
            sum_exp = sum_exp + exp_val;
            i = i + 1;
        };

        let ln_sum = math::ln(sum_exp);
        math::mul(b_q64, ln_sum)
    }

    // --- Trading Functions ---

    #[allow(lint(self_transfer))]
    public fun buy<T>(
        market: &mut Market<T>,
        outcome_index: u64,
        mut payment: Coin<T>,
        min_shares_out: u64,
        ctx: &mut TxContext
    ) {
        assert!(!market.resolved, EMarketResolved);
        assert!(outcome_index < market.outcomes.length(), EOutcomeIndexOutOfBounds);

        let payment_val = coin::value(&payment);
        assert!(payment_val > 0, EInsufficientPayment);

        // 1. Deduct Fee
        let fee_val = (payment_val as u128) * (market.fee_bps as u128) / 10000;
        let net_invest = payment_val - (fee_val as u64);
        
        let fee_coin = coin::split(&mut payment, (fee_val as u64), ctx);
        balance::join(&mut market.fee_balance, coin::into_balance(fee_coin));
        balance::join(&mut market.balance, coin::into_balance(payment));

        // 2. Calculate Shares
        let c_old_q64 = calculate_cost(&market.q_values, market.b);
        let net_q64 = math::to_q64(net_invest);
        let c_new_q64 = c_old_q64 + net_q64;
        
        let b_q64 = math::to_q64(market.b);
        let term1_exp = math::exp(math::div(c_new_q64, b_q64));
        
        let mut sum_other: u128 = 0;
        let mut i = 0;
        let n = market.q_values.length();
        while (i < n) {
            if (i != outcome_index) {
                let q = market.q_values[i];
                sum_other = sum_other + math::exp(math::div(math::to_q64(q), b_q64));
            };
            i = i + 1;
        };

        let exp_new_q = if (term1_exp > sum_other) { term1_exp - sum_other } else { 0 };
        
        let new_ratio = math::ln(exp_new_q);
        let new_q_total = math::from_q64(math::mul(new_ratio, b_q64));
        
        let current_q = market.q_values[outcome_index];
        let shares_to_mint = if (new_q_total > current_q) { new_q_total - current_q } else { 0 };
        
        assert!(shares_to_mint >= min_shares_out, EInsufficientPayment);

        // Update state
        let q_ref = &mut market.q_values[outcome_index];
        *q_ref = *q_ref + shares_to_mint;

        // Mint Position
        let position = Position {
            id: object::new(ctx),
            market_id: object::uid_to_inner(&market.id),
            outcome_index,
            shares: shares_to_mint,
        };
        transfer::public_transfer(position, ctx.sender());
    }

    #[allow(lint(self_transfer))]
    public fun sell<T>(
        market: &mut Market<T>,
        position: Position,
        ctx: &mut TxContext
    ) {
        assert!(!market.resolved, EMarketResolved);
        assert!(position.market_id == object::uid_to_inner(&market.id), EInvalidPosition);

        let Position { id, market_id: _, outcome_index, shares } = position;
        object::delete(id);

        let c_old_q64 = calculate_cost(&market.q_values, market.b);
        
        let q_ref = &mut market.q_values[outcome_index];
        *q_ref = *q_ref - shares; 
        
        let c_new_q64 = calculate_cost(&market.q_values, market.b);
        
        let gross_refund_q64 = if (c_old_q64 > c_new_q64) { c_old_q64 - c_new_q64 } else { 0 };
        let gross_refund = math::from_q64(gross_refund_q64);

        let fee_val = (gross_refund as u128) * (market.fee_bps as u128) / 10000;
        let net_refund = gross_refund - (fee_val as u64);

        let refund_coin = coin::take(&mut market.balance, net_refund, ctx);
        let fee_coin = coin::take(&mut market.balance, (fee_val as u64), ctx);
        balance::join(&mut market.fee_balance, coin::into_balance(fee_coin));
        
        transfer::public_transfer(refund_coin, ctx.sender());
    }

    public fun resolve<T>(
        _cap: &AdminCap,
        market: &mut Market<T>,
        winner_index: u64
    ) {
        assert!(!market.resolved, EMarketResolved);
        assert!(winner_index < market.outcomes.length(), EOutcomeIndexOutOfBounds);
        
        market.resolved = true;
        market.winner = std::option::some(winner_index);
    }

    #[allow(lint(self_transfer))]
    public fun redeem<T>(
        market: &mut Market<T>,
        position: Position,
        ctx: &mut TxContext
    ) {
        assert!(market.resolved, EMarketNotResolved);
        assert!(position.market_id == object::uid_to_inner(&market.id), EInvalidPosition);

        let Position { id, market_id: _, outcome_index, shares } = position;
        object::delete(id);

        let winner = *std::option::borrow(&market.winner);
        
        if (outcome_index == winner) {
            let payout = coin::take(&mut market.balance, shares, ctx);
            transfer::public_transfer(payout, ctx.sender());
        }
    }

    #[allow(lint(self_transfer))]
    public fun claim_fees<T>(
        _cap: &AdminCap,
        market: &mut Market<T>,
        ctx: &mut TxContext
    ) {
        let amount = balance::value(&market.fee_balance);
        let coin = coin::take(&mut market.fee_balance, amount, ctx);
        transfer::public_transfer(coin, ctx.sender());
    }

    public fun add_liquidity<T>(
        _cap: &AdminCap,
        market: &mut Market<T>,
        fund: Coin<T>
    ) {
        assert!(!market.resolved, EMarketResolved);
        let val = coin::value(&fund);
        
        let n = market.outcomes.length();
        let fund_q64 = math::to_q64(val);
        let ln_n = math::ln(math::to_q64(n));
        let added_b = math::from_q64(math::div(fund_q64, ln_n));
        
        market.b = market.b + added_b;
        balance::join(&mut market.balance, coin::into_balance(fund));
    }
    
    #[allow(lint(self_transfer))]
    public fun claim_surplus<T>(
        _cap: &AdminCap,
        market: &mut Market<T>,
        ctx: &mut TxContext
    ) {
        assert!(market.resolved, EMarketNotResolved);
        let val = balance::value(&market.balance);
        let coin = coin::take(&mut market.balance, val, ctx);
        transfer::public_transfer(coin, ctx.sender());
    }
}
