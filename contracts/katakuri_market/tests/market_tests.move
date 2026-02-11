#[test_only]
module katakuri_market::market_tests {
    use sui::coin;
    use sui::sui::SUI;
    use sui::test_scenario;
    use std::string;
    use katakuri_market::market::{Self, Market, AdminCap, Position};

    const ADMIN: address = @0xA;
    const USER1: address = @0xB;
    fun setup_market(scenario: &mut test_scenario::Scenario) {
        scenario.next_tx(ADMIN);
        {
            let outcomes = vector[
                string::utf8(b"Fighter A"),
                string::utf8(b"Fighter B"),
            ];
            let fund = coin::mint_for_testing<SUI>(1_000_000, scenario.ctx());
            market::create_market<SUI>(
                string::utf8(b"Who will win?"),
                outcomes,
                fund,
                100, // 1% fee
                scenario.ctx(),
            );
        };
    }

    #[test]
    fun test_create_market() {
        let mut scenario = test_scenario::begin(ADMIN);
        setup_market(&mut scenario);

        // Admin should have AdminCap
        scenario.next_tx(ADMIN);
        {
            let cap = scenario.take_from_sender<AdminCap>();
            scenario.return_to_sender(cap);
        };

        // Market should be shared
        scenario.next_tx(ADMIN);
        {
            let market = scenario.take_shared<Market<SUI>>();
            let (question, outcomes, b, resolved, winner) = market::get_market_info(&market);
            assert!(question == string::utf8(b"Who will win?"));
            assert!(outcomes.length() == 2);
            assert!(b > 0);
            assert!(!resolved);
            assert!(winner.is_none());
            assert!(market::get_balance(&market) == 1_000_000);
            test_scenario::return_shared(market);
        };

        scenario.end();
    }

    #[test]
    fun test_buy_shares() {
        let mut scenario = test_scenario::begin(ADMIN);
        setup_market(&mut scenario);

        // User1 buys shares on outcome 0
        scenario.next_tx(USER1);
        {
            let mut market = scenario.take_shared<Market<SUI>>();
            let payment = coin::mint_for_testing<SUI>(100_000, scenario.ctx());
            market::buy(&mut market, 0, payment, 0, scenario.ctx());
            test_scenario::return_shared(market);
        };

        // User1 should have a Position
        scenario.next_tx(USER1);
        {
            let position = scenario.take_from_sender<Position>();
            scenario.return_to_sender(position);
        };

        // Market balance should have increased
        scenario.next_tx(USER1);
        {
            let market = scenario.take_shared<Market<SUI>>();
            assert!(market::get_balance(&market) > 1_000_000);
            test_scenario::return_shared(market);
        };

        scenario.end();
    }

    #[test]
    fun test_sell_shares() {
        let mut scenario = test_scenario::begin(ADMIN);
        setup_market(&mut scenario);

        // User1 buys shares
        scenario.next_tx(USER1);
        {
            let mut market = scenario.take_shared<Market<SUI>>();
            let payment = coin::mint_for_testing<SUI>(100_000, scenario.ctx());
            market::buy(&mut market, 0, payment, 0, scenario.ctx());
            test_scenario::return_shared(market);
        };

        // User1 sells position
        scenario.next_tx(USER1);
        {
            let mut market = scenario.take_shared<Market<SUI>>();
            let position = scenario.take_from_sender<Position>();
            market::sell(&mut market, position, scenario.ctx());
            test_scenario::return_shared(market);
        };

        // User1 should have received a refund coin
        scenario.next_tx(USER1);
        {
            let refund = scenario.take_from_sender<coin::Coin<SUI>>();
            assert!(coin::value(&refund) > 0);
            scenario.return_to_sender(refund);
        };

        scenario.end();
    }

    #[test]
    fun test_resolve_and_redeem() {
        let mut scenario = test_scenario::begin(ADMIN);
        setup_market(&mut scenario);

        // User1 buys shares on outcome 0
        scenario.next_tx(USER1);
        {
            let mut market = scenario.take_shared<Market<SUI>>();
            let payment = coin::mint_for_testing<SUI>(100_000, scenario.ctx());
            market::buy(&mut market, 0, payment, 0, scenario.ctx());
            test_scenario::return_shared(market);
        };

        // Admin resolves market, outcome 0 wins
        scenario.next_tx(ADMIN);
        {
            let mut market = scenario.take_shared<Market<SUI>>();
            let cap = scenario.take_from_sender<AdminCap>();
            market::resolve(&cap, &mut market, 0);

            let (_q, _o, _b, resolved, winner) = market::get_market_info(&market);
            assert!(resolved);
            assert!(*winner.borrow() == 0);

            scenario.return_to_sender(cap);
            test_scenario::return_shared(market);
        };

        // User1 redeems winning position
        scenario.next_tx(USER1);
        {
            let mut market = scenario.take_shared<Market<SUI>>();
            let position = scenario.take_from_sender<Position>();
            market::redeem(&mut market, position, scenario.ctx());
            test_scenario::return_shared(market);
        };

        // User1 should have received payout
        scenario.next_tx(USER1);
        {
            let payout = scenario.take_from_sender<coin::Coin<SUI>>();
            assert!(coin::value(&payout) > 0);
            scenario.return_to_sender(payout);
        };

        scenario.end();
    }

    #[test]
    fun test_add_liquidity() {
        let mut scenario = test_scenario::begin(ADMIN);
        setup_market(&mut scenario);

        scenario.next_tx(ADMIN);
        {
            let mut market = scenario.take_shared<Market<SUI>>();
            let cap = scenario.take_from_sender<AdminCap>();
            let balance_before = market::get_balance(&market);
            let (_q, _o, b_before, _r, _w) = market::get_market_info(&market);

            let fund = coin::mint_for_testing<SUI>(500_000, scenario.ctx());
            market::add_liquidity(&cap, &mut market, fund);

            let balance_after = market::get_balance(&market);
            let (_q2, _o2, b_after, _r2, _w2) = market::get_market_info(&market);

            assert!(balance_after == balance_before + 500_000);
            assert!(b_after > b_before);

            scenario.return_to_sender(cap);
            test_scenario::return_shared(market);
        };

        scenario.end();
    }

    #[test]
    fun test_claim_fees() {
        let mut scenario = test_scenario::begin(ADMIN);
        setup_market(&mut scenario);

        // User1 buys shares (generates fees)
        scenario.next_tx(USER1);
        {
            let mut market = scenario.take_shared<Market<SUI>>();
            let payment = coin::mint_for_testing<SUI>(100_000, scenario.ctx());
            market::buy(&mut market, 0, payment, 0, scenario.ctx());
            test_scenario::return_shared(market);
        };

        // Admin claims fees
        scenario.next_tx(ADMIN);
        {
            let mut market = scenario.take_shared<Market<SUI>>();
            let cap = scenario.take_from_sender<AdminCap>();
            market::claim_fees(&cap, &mut market, scenario.ctx());
            scenario.return_to_sender(cap);
            test_scenario::return_shared(market);
        };

        // Admin should have received fee coin
        scenario.next_tx(ADMIN);
        {
            let fee_coin = scenario.take_from_sender<coin::Coin<SUI>>();
            // With 1% fee on 100_000, fee should be ~1000
            assert!(coin::value(&fee_coin) > 0);
            scenario.return_to_sender(fee_coin);
        };

        scenario.end();
    }

    #[test]
    #[expected_failure(abort_code = market::EMarketResolved)]
    fun test_buy_on_resolved_market() {
        let mut scenario = test_scenario::begin(ADMIN);
        setup_market(&mut scenario);

        // Resolve market
        scenario.next_tx(ADMIN);
        {
            let mut market = scenario.take_shared<Market<SUI>>();
            let cap = scenario.take_from_sender<AdminCap>();
            market::resolve(&cap, &mut market, 0);
            scenario.return_to_sender(cap);
            test_scenario::return_shared(market);
        };

        // Try to buy on resolved market
        scenario.next_tx(USER1);
        {
            let mut market = scenario.take_shared<Market<SUI>>();
            let payment = coin::mint_for_testing<SUI>(100_000, scenario.ctx());
            market::buy(&mut market, 0, payment, 0, scenario.ctx());
            test_scenario::return_shared(market);
        };

        scenario.end();
    }

    #[test]
    #[expected_failure(abort_code = market::EOutcomeIndexOutOfBounds)]
    fun test_buy_invalid_outcome() {
        let mut scenario = test_scenario::begin(ADMIN);
        setup_market(&mut scenario);

        scenario.next_tx(USER1);
        {
            let mut market = scenario.take_shared<Market<SUI>>();
            let payment = coin::mint_for_testing<SUI>(100_000, scenario.ctx());
            market::buy(&mut market, 5, payment, 0, scenario.ctx()); // Invalid index
            test_scenario::return_shared(market);
        };

        scenario.end();
    }

    #[test]
    #[expected_failure(abort_code = market::EMarketNotResolved)]
    fun test_redeem_before_resolution() {
        let mut scenario = test_scenario::begin(ADMIN);
        setup_market(&mut scenario);

        // Buy shares
        scenario.next_tx(USER1);
        {
            let mut market = scenario.take_shared<Market<SUI>>();
            let payment = coin::mint_for_testing<SUI>(100_000, scenario.ctx());
            market::buy(&mut market, 0, payment, 0, scenario.ctx());
            test_scenario::return_shared(market);
        };

        // Try to redeem before resolution
        scenario.next_tx(USER1);
        {
            let mut market = scenario.take_shared<Market<SUI>>();
            let position = scenario.take_from_sender<Position>();
            market::redeem(&mut market, position, scenario.ctx());
            test_scenario::return_shared(market);
        };

        scenario.end();
    }

    #[test]
    fun test_probabilities() {
        let mut scenario = test_scenario::begin(ADMIN);
        setup_market(&mut scenario);

        // Initially, probabilities should be equal for both outcomes
        scenario.next_tx(ADMIN);
        {
            let market = scenario.take_shared<Market<SUI>>();
            let p0 = market::get_outcome_probability(&market, 0);
            let p1 = market::get_outcome_probability(&market, 1);
            // Both should be approximately 0.5 in Q64 (= 2^63 = 9223372036854775808)
            // Allow some tolerance for fixed-point arithmetic
            assert!(p0 == p1);
            test_scenario::return_shared(market);
        };

        scenario.end();
    }

    #[test]
    fun test_estimate_buy_cost() {
        let mut scenario = test_scenario::begin(ADMIN);
        setup_market(&mut scenario);

        scenario.next_tx(ADMIN);
        {
            let market = scenario.take_shared<Market<SUI>>();
            let cost = market::estimate_buy_cost(&market, 0, 10_000);
            assert!(cost > 0);
            test_scenario::return_shared(market);
        };

        scenario.end();
    }
}
