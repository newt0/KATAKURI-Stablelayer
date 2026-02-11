#[test_only]
module lmsr_market::market_tests {
    use sui::test_scenario::{Self, Scenario};
    use sui::coin::{Self, Coin, mint_for_testing};
    use sui::sui::SUI;
    use std::string::{Self, String};
    use std::debug;

    use lmsr_market::market::{Self, Market, AdminCap, Position};

    // Test addresses
    const ADMIN: address = @0xA;
    const USER1: address = @0xB;
    const USER2: address = @0xC;

    fun init_test_market(scenario: &mut Scenario) {
        let ctx = test_scenario::ctx(scenario);
        
        // Prepare arguments
        let question = string::utf8(b"Will BTC hit 100k?");
        let mut outcomes = vector[];
        outcomes.push_back(string::utf8(b"Yes"));
        outcomes.push_back(string::utf8(b"No"));
        
        // Initial fund: 500 SUI
        let fund_amount = 500_000_000_000; 
        let initial_fund = mint_for_testing<SUI>(fund_amount, ctx);
        let fee_bps = 100; // 1%

        market::create_market(
            question,
            outcomes,
            initial_fund,
            fee_bps,
            ctx
        );
    }

    #[test]
    fun test_market_flow() {
        let mut scenario = test_scenario::begin(ADMIN);
        
        // 1. Create Market
        init_test_market(&mut scenario);
        test_scenario::next_tx(&mut scenario, ADMIN);

        assert!(test_scenario::has_most_recent_for_sender<AdminCap>(&scenario), 0);
        assert!(test_scenario::has_most_recent_shared<Market<SUI>>(), 0);

        let market_obj = test_scenario::take_shared<Market<SUI>>(&scenario);
        let admin_cap = test_scenario::take_from_sender<AdminCap>(&scenario);
        
        test_scenario::return_shared(market_obj);
        test_scenario::return_to_sender(&scenario, admin_cap);
        
        test_scenario::next_tx(&mut scenario, USER1);

        // 2. USER1 Buys "Yes" shares
        {
            let mut market_val = test_scenario::take_shared<Market<SUI>>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            
            // User pays 100 SUI
            let pay_amount = 100_000_000_000; 
            let payment = mint_for_testing<SUI>(pay_amount, ctx);
            
            // Buy Outcome 0 (Yes)
            market::buy(
                &mut market_val,
                0,
                payment,
                0, // min_out
                ctx
            );
            
            test_scenario::return_shared(market_val);
        };

        test_scenario::next_tx(&mut scenario, USER1);
        
        // Check USER1 received Position
        assert!(test_scenario::has_most_recent_for_sender<Position>(&scenario), 1);
        
        // 3. USER2 Buys "No" shares
        test_scenario::next_tx(&mut scenario, USER2);
        {
            let mut market_val = test_scenario::take_shared<Market<SUI>>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            
            let pay_amount = 50_000_000_000; 
            let payment = mint_for_testing<SUI>(pay_amount, ctx);
            
            market::buy(
                &mut market_val,
                1, // No
                payment,
                0,
                ctx
            );
            
            test_scenario::return_shared(market_val);
        };

        test_scenario::next_tx(&mut scenario, USER2);
        assert!(test_scenario::has_most_recent_for_sender<Position>(&scenario), 2);

        // 4. USER1 Sells some shares (simulate by taking the position)
        test_scenario::next_tx(&mut scenario, USER1);
        {
            let mut market_val = test_scenario::take_shared<Market<SUI>>(&scenario);
            let position = test_scenario::take_from_sender<Position>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            
            // Sell it all back
            market::sell(
                &mut market_val,
                position,
                ctx
            );
            
            test_scenario::return_shared(market_val);
        };

        test_scenario::next_tx(&mut scenario, USER1);
        // User 1 should have received Coin<SUI> back
        assert!(test_scenario::has_most_recent_for_sender<Coin<SUI>>(&scenario), 3);
        
        let refund_coin = test_scenario::take_from_sender<Coin<SUI>>(&scenario);
        let refund_val = coin::value(&refund_coin);
        debug::print(&string::utf8(b"User 1 Refund Value:"));
        debug::print(&refund_val);
        
        test_scenario::return_to_sender(&scenario, refund_coin);

        // 5. Admin Adds Liquidity
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
             let mut market_val = test_scenario::take_shared<Market<SUI>>(&scenario);
             let admin_cap = test_scenario::take_from_sender<AdminCap>(&scenario);
             let ctx = test_scenario::ctx(&mut scenario);
             
             let add_fund = mint_for_testing<SUI>(100_000_000_000, ctx);
             market::add_liquidity(&admin_cap, &mut market_val, add_fund);
             
             test_scenario::return_shared(market_val);
             test_scenario::return_to_sender(&scenario, admin_cap);
        };
        
        // 6. Resolve Market (No wins)
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut market_val = test_scenario::take_shared<Market<SUI>>(&scenario);
            let admin_cap = test_scenario::take_from_sender<AdminCap>(&scenario);
            
            market::resolve(&admin_cap, &mut market_val, 1); // 1 is 'No'
            
            test_scenario::return_shared(market_val);
            test_scenario::return_to_sender(&scenario, admin_cap);
        };

        // 7. User 2 Redeems (Winner)
        test_scenario::next_tx(&mut scenario, USER2);
        {
            let mut market_val = test_scenario::take_shared<Market<SUI>>(&scenario);
            let position = test_scenario::take_from_sender<Position>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            
            market::redeem(&mut market_val, position, ctx);
            
            test_scenario::return_shared(market_val);
        };
        
        test_scenario::next_tx(&mut scenario, USER2);
        // User 2 should have Coin now
        assert!(test_scenario::has_most_recent_for_sender<Coin<SUI>>(&scenario), 4);
        let win_coin = test_scenario::take_from_sender<Coin<SUI>>(&scenario);
        debug::print(&string::utf8(b"User 2 Winnings:"));
        debug::print(&coin::value(&win_coin));
        test_scenario::return_to_sender(&scenario, win_coin);

        // 8. Admin Claims Fees
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut market_val = test_scenario::take_shared<Market<SUI>>(&scenario);
            let admin_cap = test_scenario::take_from_sender<AdminCap>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            
            market::claim_fees(&admin_cap, &mut market_val, ctx);
            
            test_scenario::return_shared(market_val);
            test_scenario::return_to_sender(&scenario, admin_cap);
        };
        
        test_scenario::next_tx(&mut scenario, ADMIN);
        // Check if admin got fees
        assert!(test_scenario::has_most_recent_for_sender<Coin<SUI>>(&scenario), 5);
        let fee_coin = test_scenario::take_from_sender<Coin<SUI>>(&scenario);
        debug::print(&string::utf8(b"Admin Fees:"));
        debug::print(&coin::value(&fee_coin));
        test_scenario::return_to_sender(&scenario, fee_coin);

        test_scenario::end(scenario);
    }
}
