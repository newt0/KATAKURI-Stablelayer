module lmsr_market::math {
    /// Fixed point scale: 2^64
    const Q64: u128 = 0x10000000000000000; 

    /// Convert u64 integer to Q64 fixed point
    public fun to_q64(x: u64): u128 {
        (x as u128) << 64
    }

    /// Convert Q64 to u64 (truncating)
    public fun from_q64(x: u128): u64 {
        (x >> 64) as u64
    }

    /// Multiply two Q64 numbers
    public fun mul(x: u128, y: u128): u128 {
        let hi = (x as u256) * (y as u256);
        ((hi >> 64) as u128)
    }

    /// Divide two Q64 numbers
    public fun div(x: u128, y: u128): u128 {
        let hi = (x as u256) << 64;
        ((hi / (y as u256)) as u128)
    }

    /// Natural logarithm ln(x) for x in Q64
    public fun ln(x: u128): u128 {
        assert!(x > 0, 0);
        if (x == Q64) { return 0 };
        
        let mut res: u128 = 0;
        let mut v = x;
        
        // Handle integer part via MSB (simplified loop)
        if (v >= Q64) {
            while (v >= Q64 * 2) {
                v = v / 2;
                res = res + 12786308645202655660; // ln(2) in Q64
            };
        } else {
             while (v < Q64) {
                v = v * 2;
                res = res - 12786308645202655660; // ln(2) in Q64
            };
        };

        let ln2 = 12786308645202655660u128;
        
        // Iterative approach for "fractional part of log2"
        let mut term = ln2 / 2;
        let mut i = 0;
        while (i < 20) { // 20 bits precision
            v = mul(v, v);
            if (v >= Q64 * 2) {
                res = res + term;
                v = v / 2;
            };
            term = term / 2;
            i = i + 1;
        };
        
        res
    }

    /// Exponential exp(x) for x in Q64
    public fun exp(x: u128): u128 {
        if (x == 0) { return Q64 };
        
        let ln2 = 12786308645202655660u128;
        // y was unused
        
        let k = div(x, ln2);
        let int_k = from_q64(k);
        let rem = x - mul(to_q64(int_k), ln2); // rem is remainder
        
        // e^rem via Taylor series
        let mut res = Q64;
        let mut term = rem;
        
        res = res + term;
        
        term = mul(term, rem) / 2;
        res = res + term;
        
        term = mul(term, rem) / 3;
        res = res + term;
        
        term = mul(term, rem) / 4;
        res = res + term;

        term = mul(term, rem) / 5;
        res = res + term;
        
        term = mul(term, rem) / 6;
        res = res + term;

        // Check for overflow before shift
        if (int_k > 60) { return 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF }; // Cap
        
        res = res << (int_k as u8);
        res
    }
}
