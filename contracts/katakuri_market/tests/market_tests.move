#[test_only]
module katakuri_market::market_tests {
    use sui::test_scenario::{Self, Scenario};
    use sui::coin::{Self, Coin, mint_for_testing};
    use sui::sui::SUI;
    use std::string;

    use katakuri_market::market::{Self, Market, AdminCap, Position};

    // Test addresses
    const ADMIN: address = @0xA;
    const USER1: address = @0xB;
    const USER2: address = @0xC;

    // ============================================================
    // Helper: Create a standard 2-outcome market
    // ============================================================
    fun create_test_market(scenario: &mut Scenario) {
        let ctx = test_scenario::ctx(scenario);

        let question = string::utf8(b"Will BTC hit 100k?");
        let outcomes = vector[
            string::utf8(b"Yes"),
            string::utf8(b"No"),
        ];

        // Initial fund: 500 SUI (in MIST)
        let fund_amount = 500_000_000_000;
        let initial_fund = mint_for_testing<SUI>(fund_amount, ctx);
        let fee_bps = 100; // 1%

        market::create_market(
            question,
            outcomes,
            initial_fund,
            fee_bps,
            ctx,
        );
    }

    // ============================================================
    // Test 1: Market creation and AdminCap issuance
    // ============================================================
    #[test]
    fun test_create_market() {
        let mut scenario = test_scenario::begin(ADMIN);

        create_test_market(&mut scenario);
        test_scenario::next_tx(&mut scenario, ADMIN);

        // AdminCap should be transferred to ADMIN
        assert!(test_scenario::has_most_recent_for_sender<AdminCap>(&scenario), 0);
        // Market should be shared
        assert!(test_scenario::has_most_recent_shared<Market<SUI>>(), 0);

        // Verify market info via getter
        let market_obj = test_scenario::take_shared<Market<SUI>>(&scenario);
        let (question, outcomes, b, resolved, winner) = market::get_market_info(&market_obj);
        assert!(question == string::utf8(b"Will BTC hit 100k?"), 0);
        assert!(outcomes.length() == 2, 0);
        assert!(b > 0, 0);
        assert!(!resolved, 0);
        assert!(winner.is_none(), 0);

        // Verify balance
        let balance = market::get_balance(&market_obj);
        assert!(balance == 500_000_000_000, 0);

        test_scenario::return_shared(market_obj);
        test_scenario::end(scenario);
    }

    // ============================================================
    // Test 2: Buy shares and verify Position
    // ============================================================
    #[test]
    fun test_buy_shares() {
        let mut scenario = test_scenario::begin(ADMIN);

        create_test_market(&mut scenario);
        test_scenario::next_tx(&mut scenario, USER1);

        // USER1 buys "Yes" shares
        {
            let mut market = test_scenario::take_shared<Market<SUI>>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);

            let pay_amount = 100_000_000_000; // 100 SUI
            let payment = mint_for_testing<SUI>(pay_amount, ctx);

            market::buy(
                &mut market,
                0, // outcome_index = Yes
                payment,
                0, // min_shares_out
                ctx,
            );

            test_scenario::return_shared(market);
        };

        test_scenario::next_tx(&mut scenario, USER1);

        // USER1 should have a Position
        assert!(test_scenario::has_most_recent_for_sender<Position>(&scenario), 0);

        // Market balance should have increased
        let market = test_scenario::take_shared<Market<SUI>>(&scenario);
        let balance = market::get_balance(&market);
        assert!(balance > 500_000_000_000, 0); // initial + user payment (minus fees)

        test_scenario::return_shared(market);
        test_scenario::end(scenario);
    }

    // ============================================================
    // Test 3: Sell shares and verify refund
    // ============================================================
    #[test]
    fun test_sell_shares() {
        let mut scenario = test_scenario::begin(ADMIN);

        create_test_market(&mut scenario);
        test_scenario::next_tx(&mut scenario, USER1);

        // USER1 buys shares
        {
            let mut market = test_scenario::take_shared<Market<SUI>>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            let payment = mint_for_testing<SUI>(100_000_000_000, ctx);
            market::buy(&mut market, 0, payment, 0, ctx);
            test_scenario::return_shared(market);
        };

        test_scenario::next_tx(&mut scenario, USER1);

        // USER1 sells position
        {
            let mut market = test_scenario::take_shared<Market<SUI>>(&scenario);
            let position = test_scenario::take_from_sender<Position>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);

            market::sell(&mut market, position, ctx);

            test_scenario::return_shared(market);
        };

        test_scenario::next_tx(&mut scenario, USER1);

        // USER1 should have received Coin<SUI> as refund
        assert!(test_scenario::has_most_recent_for_sender<Coin<SUI>>(&scenario), 0);

        let refund = test_scenario::take_from_sender<Coin<SUI>>(&scenario);
        let refund_val = coin::value(&refund);
        // Refund should be > 0 (after fees)
        assert!(refund_val > 0, 0);

        test_scenario::return_to_sender(&scenario, refund);
        test_scenario::end(scenario);
    }

    // ============================================================
    // Test 4: Resolve market and redeem winning position
    // ============================================================
    #[test]
    fun test_resolve_and_redeem() {
        let mut scenario = test_scenario::begin(ADMIN);

        create_test_market(&mut scenario);
        test_scenario::next_tx(&mut scenario, USER1);

        // USER1 buys "Yes" shares
        {
            let mut market = test_scenario::take_shared<Market<SUI>>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            let payment = mint_for_testing<SUI>(100_000_000_000, ctx);
            market::buy(&mut market, 0, payment, 0, ctx);
            test_scenario::return_shared(market);
        };

        test_scenario::next_tx(&mut scenario, USER2);

        // USER2 buys "No" shares
        {
            let mut market = test_scenario::take_shared<Market<SUI>>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            let payment = mint_for_testing<SUI>(50_000_000_000, ctx);
            market::buy(&mut market, 1, payment, 0, ctx);
            test_scenario::return_shared(market);
        };

        // Admin resolves: "Yes" wins (outcome 0)
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut market = test_scenario::take_shared<Market<SUI>>(&scenario);
            let admin_cap = test_scenario::take_from_sender<AdminCap>(&scenario);

            market::resolve(&admin_cap, &mut market, 0);

            test_scenario::return_shared(market);
            test_scenario::return_to_sender(&scenario, admin_cap);
        };

        // USER1 redeems (winner)
        test_scenario::next_tx(&mut scenario, USER1);
        {
            let mut market = test_scenario::take_shared<Market<SUI>>(&scenario);
            let position = test_scenario::take_from_sender<Position>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);

            market::redeem(&mut market, position, ctx);

            test_scenario::return_shared(market);
        };

        test_scenario::next_tx(&mut scenario, USER1);
        // USER1 should have received payout
        assert!(test_scenario::has_most_recent_for_sender<Coin<SUI>>(&scenario), 0);

        let payout = test_scenario::take_from_sender<Coin<SUI>>(&scenario);
        assert!(coin::value(&payout) > 0, 0);
        test_scenario::return_to_sender(&scenario, payout);

        test_scenario::end(scenario);
    }

    // ============================================================
    // Test 5: Add liquidity
    // ============================================================
    #[test]
    fun test_add_liquidity() {
        let mut scenario = test_scenario::begin(ADMIN);

        create_test_market(&mut scenario);
        test_scenario::next_tx(&mut scenario, ADMIN);

        // Get initial b and add liquidity in same tx
        {
            let mut market = test_scenario::take_shared<Market<SUI>>(&scenario);
            let (_, _, initial_b, _, _) = market::get_market_info(&market);
            let admin_cap = test_scenario::take_from_sender<AdminCap>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);

            let extra_fund = mint_for_testing<SUI>(100_000_000_000, ctx);
            market::add_liquidity(&admin_cap, &mut market, extra_fund);

            // b should have increased
            let (_, _, new_b, _, _) = market::get_market_info(&market);
            assert!(new_b > initial_b, 0);

            // Balance should have increased
            let balance = market::get_balance(&market);
            assert!(balance == 600_000_000_000, 0);

            test_scenario::return_shared(market);
            test_scenario::return_to_sender(&scenario, admin_cap);
        };

        test_scenario::end(scenario);
    }

    // ============================================================
    // Test 6: Claim fees
    // ============================================================
    #[test]
    fun test_claim_fees() {
        let mut scenario = test_scenario::begin(ADMIN);

        create_test_market(&mut scenario);
        test_scenario::next_tx(&mut scenario, USER1);

        // USER1 buys to generate fees
        {
            let mut market = test_scenario::take_shared<Market<SUI>>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            let payment = mint_for_testing<SUI>(100_000_000_000, ctx);
            market::buy(&mut market, 0, payment, 0, ctx);
            test_scenario::return_shared(market);
        };

        // Admin claims fees
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut market = test_scenario::take_shared<Market<SUI>>(&scenario);
            let admin_cap = test_scenario::take_from_sender<AdminCap>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);

            market::claim_fees(&admin_cap, &mut market, ctx);

            test_scenario::return_shared(market);
            test_scenario::return_to_sender(&scenario, admin_cap);
        };

        test_scenario::next_tx(&mut scenario, ADMIN);

        // Admin should have fee coins
        assert!(test_scenario::has_most_recent_for_sender<Coin<SUI>>(&scenario), 0);
        let fee_coin = test_scenario::take_from_sender<Coin<SUI>>(&scenario);
        // 1% of 100 SUI = 1 SUI
        assert!(coin::value(&fee_coin) == 1_000_000_000, 0);
        test_scenario::return_to_sender(&scenario, fee_coin);

        test_scenario::end(scenario);
    }

    // ============================================================
    // Test 7: Error case — buy on resolved market
    // ============================================================
    #[test]
    #[expected_failure(abort_code = katakuri_market::market::EMarketResolved)]
    fun test_error_buy_on_resolved_market() {
        let mut scenario = test_scenario::begin(ADMIN);

        create_test_market(&mut scenario);
        test_scenario::next_tx(&mut scenario, ADMIN);

        // Resolve market
        {
            let mut market = test_scenario::take_shared<Market<SUI>>(&scenario);
            let admin_cap = test_scenario::take_from_sender<AdminCap>(&scenario);

            market::resolve(&admin_cap, &mut market, 0);

            test_scenario::return_shared(market);
            test_scenario::return_to_sender(&scenario, admin_cap);
        };

        test_scenario::next_tx(&mut scenario, USER1);

        // Try to buy — should fail
        {
            let mut market = test_scenario::take_shared<Market<SUI>>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            let payment = mint_for_testing<SUI>(100_000_000_000, ctx);

            market::buy(&mut market, 0, payment, 0, ctx);

            test_scenario::return_shared(market);
        };

        test_scenario::end(scenario);
    }

    // ============================================================
    // Test 8: Error case — redeem on unresolved market
    // ============================================================
    #[test]
    #[expected_failure(abort_code = katakuri_market::market::EMarketNotResolved)]
    fun test_error_redeem_on_unresolved_market() {
        let mut scenario = test_scenario::begin(ADMIN);

        create_test_market(&mut scenario);
        test_scenario::next_tx(&mut scenario, USER1);

        // Buy shares
        {
            let mut market = test_scenario::take_shared<Market<SUI>>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            let payment = mint_for_testing<SUI>(100_000_000_000, ctx);
            market::buy(&mut market, 0, payment, 0, ctx);
            test_scenario::return_shared(market);
        };

        test_scenario::next_tx(&mut scenario, USER1);

        // Try to redeem without resolving — should fail
        {
            let mut market = test_scenario::take_shared<Market<SUI>>(&scenario);
            let position = test_scenario::take_from_sender<Position>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);

            market::redeem(&mut market, position, ctx);

            test_scenario::return_shared(market);
        };

        test_scenario::end(scenario);
    }

    // ============================================================
    // Test 9: Getter — get_outcome_probability
    // ============================================================
    #[test]
    fun test_get_outcome_probability() {
        let mut scenario = test_scenario::begin(ADMIN);

        create_test_market(&mut scenario);
        test_scenario::next_tx(&mut scenario, ADMIN);

        let market = test_scenario::take_shared<Market<SUI>>(&scenario);

        // With no shares bought, probabilities should be roughly equal (1/2 each)
        // Q64 representation of 0.5 = 2^63 = 9223372036854775808
        let prob_0 = market::get_outcome_probability(&market, 0);
        let prob_1 = market::get_outcome_probability(&market, 1);

        // Both should be approximately 0.5 in Q64
        let half_q64: u128 = 1u128 << 63; // 0.5 in Q64
        let tolerance: u128 = 1u128 << 60; // ~6% tolerance

        assert!(prob_0 > half_q64 - tolerance && prob_0 < half_q64 + tolerance, 0);
        assert!(prob_1 > half_q64 - tolerance && prob_1 < half_q64 + tolerance, 0);

        test_scenario::return_shared(market);
        test_scenario::end(scenario);
    }

    // ============================================================
    // Test 10: Getter — estimate_buy_cost
    // ============================================================
    #[test]
    fun test_estimate_buy_cost() {
        let mut scenario = test_scenario::begin(ADMIN);

        create_test_market(&mut scenario);
        test_scenario::next_tx(&mut scenario, ADMIN);

        let market = test_scenario::take_shared<Market<SUI>>(&scenario);

        // Estimate cost to buy some shares
        let shares = 50_000_000_000; // 50 SUI worth of shares
        let cost = market::estimate_buy_cost(&market, 0, shares);

        // Cost should be > 0
        assert!(cost > 0, 0);
        // Cost should be less than shares (since we're buying at fair price initially)
        assert!(cost < shares, 0);

        test_scenario::return_shared(market);
        test_scenario::end(scenario);
    }

    // ============================================================
    // Test 11: Full lifecycle (integration test)
    // ============================================================
    #[test]
    fun test_full_lifecycle() {
        let mut scenario = test_scenario::begin(ADMIN);

        // 1. Create
        create_test_market(&mut scenario);
        test_scenario::next_tx(&mut scenario, ADMIN);
        assert!(test_scenario::has_most_recent_for_sender<AdminCap>(&scenario), 0);

        // 2. USER1 buys Yes
        test_scenario::next_tx(&mut scenario, USER1);
        {
            let mut market = test_scenario::take_shared<Market<SUI>>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            let payment = mint_for_testing<SUI>(100_000_000_000, ctx);
            market::buy(&mut market, 0, payment, 0, ctx);
            test_scenario::return_shared(market);
        };

        // 3. USER2 buys No
        test_scenario::next_tx(&mut scenario, USER2);
        {
            let mut market = test_scenario::take_shared<Market<SUI>>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            let payment = mint_for_testing<SUI>(50_000_000_000, ctx);
            market::buy(&mut market, 1, payment, 0, ctx);
            test_scenario::return_shared(market);
        };

        // 4. USER1 sells
        test_scenario::next_tx(&mut scenario, USER1);
        {
            let mut market = test_scenario::take_shared<Market<SUI>>(&scenario);
            let position = test_scenario::take_from_sender<Position>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            market::sell(&mut market, position, ctx);
            test_scenario::return_shared(market);
        };

        test_scenario::next_tx(&mut scenario, USER1);
        assert!(test_scenario::has_most_recent_for_sender<Coin<SUI>>(&scenario), 0);

        // 5. Admin adds liquidity
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut market = test_scenario::take_shared<Market<SUI>>(&scenario);
            let admin_cap = test_scenario::take_from_sender<AdminCap>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            let extra = mint_for_testing<SUI>(100_000_000_000, ctx);
            market::add_liquidity(&admin_cap, &mut market, extra);
            test_scenario::return_shared(market);
            test_scenario::return_to_sender(&scenario, admin_cap);
        };

        // 6. Resolve: No wins (index 1)
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut market = test_scenario::take_shared<Market<SUI>>(&scenario);
            let admin_cap = test_scenario::take_from_sender<AdminCap>(&scenario);
            market::resolve(&admin_cap, &mut market, 1);
            test_scenario::return_shared(market);
            test_scenario::return_to_sender(&scenario, admin_cap);
        };

        // 7. USER2 redeems (winner)
        test_scenario::next_tx(&mut scenario, USER2);
        {
            let mut market = test_scenario::take_shared<Market<SUI>>(&scenario);
            let position = test_scenario::take_from_sender<Position>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            market::redeem(&mut market, position, ctx);
            test_scenario::return_shared(market);
        };

        test_scenario::next_tx(&mut scenario, USER2);
        assert!(test_scenario::has_most_recent_for_sender<Coin<SUI>>(&scenario), 0);

        // 8. Admin claims fees
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut market = test_scenario::take_shared<Market<SUI>>(&scenario);
            let admin_cap = test_scenario::take_from_sender<AdminCap>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            market::claim_fees(&admin_cap, &mut market, ctx);
            test_scenario::return_shared(market);
            test_scenario::return_to_sender(&scenario, admin_cap);
        };

        test_scenario::next_tx(&mut scenario, ADMIN);
        assert!(test_scenario::has_most_recent_for_sender<Coin<SUI>>(&scenario), 0);

        // 9. Admin claims surplus
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut market = test_scenario::take_shared<Market<SUI>>(&scenario);
            let admin_cap = test_scenario::take_from_sender<AdminCap>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            market::claim_surplus(&admin_cap, &mut market, ctx);
            test_scenario::return_shared(market);
            test_scenario::return_to_sender(&scenario, admin_cap);
        };

        test_scenario::end(scenario);
    }

    // ============================================================
    // Test 12: Error — create market with < 2 outcomes
    // ============================================================
    #[test]
    #[expected_failure(abort_code = katakuri_market::market::EEmptyOutcomes)]
    fun test_error_too_few_outcomes() {
        let mut scenario = test_scenario::begin(ADMIN);
        let ctx = test_scenario::ctx(&mut scenario);

        let question = string::utf8(b"One outcome?");
        let outcomes = vector[string::utf8(b"Only")];
        let fund = mint_for_testing<SUI>(500_000_000_000, ctx);

        market::create_market(question, outcomes, fund, 100, ctx);

        test_scenario::end(scenario);
    }
}
