import type { Match, UserBalances, Position, ActivityEvent } from "@/types/katakuri"

export const INITIAL_BALANCES: UserBalances = {
  usdc: 10000,
  katakuriUsd: 0,
  claimableYield: 0,
}

export const INITIAL_POSITIONS: Position[] = []
export const INITIAL_ACTIVITY: ActivityEvent[] = []

export const SEED_MATCHES: Match[] = [
  {
    id: "match-1",
    title: "Tanaka vs. Yamamoto - Welterweight Championship",
    fighters: ["Kenji Tanaka", "Ryo Yamamoto"],
    status: "live",
    startAt: Date.now() - 600_000,
    currentTimeSec: 180,
    markets: [
      {
        id: "m1-ko-10s",
        matchId: "match-1",
        title: "Knockdown in next 10 seconds?",
        type: "binary",
        outcomes: ["Yes", "No"],
        status: "open",
        pricing: {
          prices: [0.25, 0.75],
          liquidityB: 100,
          q: [50, 100],
        },
      },
      {
        id: "m1-winner",
        matchId: "match-1",
        title: "Who wins the match?",
        type: "binary",
        outcomes: ["Tanaka", "Yamamoto"],
        status: "open",
        pricing: {
          prices: [0.55, 0.45],
          liquidityB: 150,
          q: [110, 100],
        },
      },
      {
        id: "m1-method",
        matchId: "match-1",
        title: "Method of victory",
        type: "multi",
        outcomes: ["KO/TKO", "Decision", "Submission"],
        status: "open",
        pricing: {
          prices: [0.4, 0.35, 0.25],
          liquidityB: 120,
          q: [80, 75, 60],
        },
      },
    ],
  },
  {
    id: "match-2",
    title: "Silva vs. Nakamura - Middleweight",
    fighters: ["Carlos Silva", "Takeshi Nakamura"],
    status: "upcoming",
    startAt: Date.now() + 3_600_000,
    currentTimeSec: 0,
    markets: [
      {
        id: "m2-winner",
        matchId: "match-2",
        title: "Who wins the match?",
        type: "binary",
        outcomes: ["Silva", "Nakamura"],
        status: "open",
        pricing: {
          prices: [0.6, 0.4],
          liquidityB: 100,
          q: [100, 80],
        },
      },
      {
        id: "m2-rounds",
        matchId: "match-2",
        title: "Does it go the distance?",
        type: "binary",
        outcomes: ["Yes", "No"],
        status: "open",
        pricing: {
          prices: [0.45, 0.55],
          liquidityB: 100,
          q: [90, 100],
        },
      },
    ],
  },
  {
    id: "match-3",
    title: "Johnson vs. Park - Lightweight",
    fighters: ["Mike Johnson", "Sung Park"],
    status: "ended",
    startAt: Date.now() - 7_200_000,
    currentTimeSec: 900,
    markets: [
      {
        id: "m3-winner",
        matchId: "match-3",
        title: "Who wins the match?",
        type: "binary",
        outcomes: ["Johnson", "Park"],
        status: "resolved",
        pricing: {
          prices: [1, 0],
          liquidityB: 100,
          q: [200, 50],
        },
        resolution: {
          resolvedOutcome: "Johnson",
          resolvedAt: Date.now() - 3_600_000,
        },
      },
    ],
  },
]
