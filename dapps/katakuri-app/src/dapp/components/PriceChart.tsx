import { FC, useEffect, useRef } from 'react'

interface PriceChartProps {
  data: { time: number; price: number }[]
  color: string
}

const PriceChart: FC<PriceChartProps> = ({ data, color }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set canvas size (devicePixelRatio for retina displays)
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    const width = rect.width
    const height = rect.height

    if (data.length === 0) return

    // Find min and max prices
    const prices = data.map(d => d.price)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const priceRange = maxPrice - minPrice || 1

    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, color + '30')
    gradient.addColorStop(1, color + '05')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.moveTo(0, height)

    data.forEach((point, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((point.price - minPrice) / priceRange) * (height - 10) - 5
      if (i === 0) {
        ctx.lineTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.lineTo(width, height)
    ctx.closePath()
    ctx.fill()

    // Draw line
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.beginPath()

    data.forEach((point, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((point.price - minPrice) / priceRange) * (height - 10) - 5
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.stroke()

    // Position the pulsing dot at the end of the line
    if (dotRef.current && data.length > 0) {
      const lastPoint = data[data.length - 1]
      const x = width
      const y = height - ((lastPoint.price - minPrice) / priceRange) * (height - 10) - 5
      dotRef.current.style.left = `${x - 4}px`
      dotRef.current.style.top = `${y - 4}px`
    }
  }, [data, color])

  return (
    <div className="relative w-full h-24 bg-dark-card/50 rounded">
      <canvas ref={canvasRef} className="w-full h-full" />

      {/* Pulsing dot at end of line */}
      <div
        ref={dotRef}
        className="absolute w-2 h-2 rounded-full animate-pulse"
        style={{
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}, 0 0 12px ${color}`
        }}
      />
    </div>
  )
}

export default PriceChart
