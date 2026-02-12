import { FC } from 'react'

interface MarketOverviewProps {
  totalPool: number
  outcomes: string[]
  probabilities: number[]
  colors: string[]
}

const MarketOverview: FC<MarketOverviewProps> = ({
  totalPool,
  outcomes,
  probabilities,
  colors
}) => {
  return (
    <div className="bg-dark-card p-6 space-y-6">
      {/* Total Pool */}
      <div className="text-center py-2">
        <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
          Total Pool
        </div>
        <div className="text-3xl font-bold text-white mb-1">
          {totalPool.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} SUI
        </div>
      </div>

      <div className="h-px bg-dark-border"></div>

      {/* Market Prediction */}
      <div className="space-y-3">
        <div className="text-xs text-gray-500 text-center uppercase tracking-wide mb-3">
          Market Prediction
        </div>

        {/* Each outcome's probability */}
        <div className="space-y-2">
          {outcomes.map((outcome, i) => (
            <div key={i} className="flex justify-between items-center">
              <span className="text-sm text-white font-medium">{outcome}</span>
              <span className="text-lg font-bold" style={{ color: colors[i] }}>
                {(probabilities[i] * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>

        {/* Progress bar (multi-color support) */}
        <div className="flex h-4 rounded-full overflow-hidden shadow-inner">
          {outcomes.map((_, i) => (
            <div
              key={i}
              className="transition-all duration-300"
              style={{
                width: `${probabilities[i] * 100}%`,
                backgroundColor: colors[i]
              }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MarketOverview
