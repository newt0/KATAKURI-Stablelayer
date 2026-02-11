import { FC } from 'react'
import { formatProbability } from '../utils'

interface ProbabilityBarProps {
  outcomes: string[]
  probabilities: number[]
}

const COLORS = [
  'bg-blue-500',
  'bg-red-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-purple-500',
]

const ProbabilityBar: FC<ProbabilityBarProps> = ({
  outcomes,
  probabilities,
}) => {
  return (
    <div className="w-full space-y-2">
      {/* Stacked bar */}
      <div className="flex h-8 w-full overflow-hidden rounded-full">
        {outcomes.map((outcome, i) => {
          const pct = (probabilities[i] ?? 0) * 100
          return (
            <div
              key={outcome}
              className={`${COLORS[i % COLORS.length]} flex items-center justify-center text-xs font-bold text-white transition-all duration-500`}
              style={{ width: `${Math.max(pct, 5)}%` }}
              title={`${outcome}: ${formatProbability(probabilities[i] ?? 0)}`}
            >
              {pct >= 15 ? formatProbability(probabilities[i] ?? 0) : ''}
            </div>
          )
        })}
      </div>
      {/* Labels */}
      <div className="flex justify-between gap-2">
        {outcomes.map((outcome, i) => (
          <div key={outcome} className="flex items-center gap-1 text-sm">
            <span
              className={`inline-block h-3 w-3 rounded-full ${COLORS[i % COLORS.length]}`}
            />
            <span className="truncate">{outcome}</span>
            <span className="font-semibold">
              {formatProbability(probabilities[i] ?? 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ProbabilityBar
