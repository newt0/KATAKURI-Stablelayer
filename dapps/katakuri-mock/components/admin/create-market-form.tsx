"use client"

import { useState } from "react"
import { useMarketTransaction } from "@/hooks/sui/use-market-transaction"
import { buildCreateMarketTx } from "@/lib/sui/transactions"
import { toCoinUnits } from "@/lib/sui/utils"
import { useCurrentAccount } from "@mysten/dapp-kit"

export function CreateMarketForm() {
  const [question, setQuestion] = useState("")
  const [outcomes, setOutcomes] = useState(["", ""])
  const [initialFund, setInitialFund] = useState("10")
  const [feeBps, setFeeBps] = useState("200")
  const account = useCurrentAccount()
  const { execute, isPending } = useMarketTransaction({
    onSuccess: () => {
      setQuestion("")
      setOutcomes(["", ""])
      setInitialFund("10")
      setFeeBps("200")
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question || outcomes.some((o) => !o.trim())) return

    const fundAmount = toCoinUnits(parseFloat(initialFund) || 10)
    const fee = parseInt(feeBps) || 200

    const tx = buildCreateMarketTx(
      question,
      outcomes.filter((o) => o.trim()),
      fundAmount,
      fee
    )
    await execute(tx)
  }

  const addOutcome = () => {
    setOutcomes([...outcomes, ""])
  }

  const updateOutcome = (index: number, value: string) => {
    const newOutcomes = [...outcomes]
    newOutcomes[index] = value
    setOutcomes(newOutcomes)
  }

  const removeOutcome = (index: number) => {
    if (outcomes.length <= 2) return
    setOutcomes(outcomes.filter((_, i) => i !== index))
  }

  if (!account) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-base font-semibold text-foreground">Create Market</h2>
        <p className="mt-2 text-sm text-muted-foreground">Connect wallet to create markets</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-base font-semibold text-foreground">Create Market</h2>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Question
          </label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Will fighter A win the match?"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Outcomes
          </label>
          {outcomes.map((outcome, i) => (
            <div key={i} className="mb-2 flex gap-2">
              <input
                type="text"
                value={outcome}
                onChange={(e) => updateOutcome(i, e.target.value)}
                placeholder={`Outcome ${i + 1}`}
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
              />
              {outcomes.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOutcome(i)}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addOutcome}
            className="mt-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            + Add Outcome
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Initial Fund (SUI)
            </label>
            <input
              type="number"
              value={initialFund}
              onChange={(e) => setInitialFund(e.target.value)}
              step="0.1"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Fee (basis points)
            </label>
            <input
              type="number"
              value={feeBps}
              onChange={(e) => setFeeBps(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending || !question || outcomes.some((o) => !o.trim())}
          className="w-full rounded-md bg-foreground py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending ? "Creating..." : "Create Market"}
        </button>
      </form>
    </div>
  )
}
