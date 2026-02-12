"use client"

import { useKatakuriStore } from "@/store/katakuri"
import { MatchCard } from "@/components/match/match-card"

export default function HomePage() {
  const matches = useKatakuriStore((s) => s.matches)

  const liveMatches = matches.filter((m) => m.status === "live")
  const upcomingMatches = matches.filter((m) => m.status === "upcoming")
  const endedMatches = matches.filter((m) => m.status === "ended")

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Matches</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Real-time prediction markets for live combat sports
        </p>
      </div>

      {liveMatches.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Live Now
          </h2>
          <div className="space-y-3">
            {liveMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </section>
      )}

      {upcomingMatches.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Upcoming
          </h2>
          <div className="space-y-3">
            {upcomingMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </section>
      )}

      {endedMatches.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Ended
          </h2>
          <div className="space-y-3">
            {endedMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
