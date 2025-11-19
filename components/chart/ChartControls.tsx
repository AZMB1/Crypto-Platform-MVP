'use client'

/**
 * ChartControls Component
 * 
 * UI controls for timeframe switching and indicator toggles.
 * Typography-forward design with compact horizontal layout.
 */

import type { ChartTimeframe, IndicatorConfig } from '@/types/chart'

interface ChartControlsProps {
  currentTimeframe: ChartTimeframe
  onTimeframeChange: (timeframe: ChartTimeframe) => void
  indicators: IndicatorConfig[]
  onIndicatorToggle: (type: string) => void
}

const TIMEFRAMES: ChartTimeframe[] = ['1h', '4h', '1d', '1w', '1m']

const INDICATOR_LABELS: Record<string, string> = {
  sma: 'SMA',
  ema: 'EMA',
  rsi: 'RSI',
  volume: 'Volume',
}

/**
 * ChartControls - Timeframe selector and indicator toggles
 * 
 * Layout: [1h] [4h] [1d] [1w] [1m]  |  □ SMA  □ EMA  □ RSI  □ Volume
 */
export function ChartControls({
  currentTimeframe,
  onTimeframeChange,
  indicators,
  onIndicatorToggle,
}: ChartControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-zinc-900 border-b border-zinc-800">
      {/* Timeframe selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-zinc-400">Timeframe:</span>
        <div className="flex gap-1">
          {TIMEFRAMES.map((timeframe) => (
            <button
              key={timeframe}
              onClick={() => onTimeframeChange(timeframe)}
              className={`
                px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                ${
                  currentTimeframe === timeframe
                    ? 'bg-zinc-700 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-750 hover:text-zinc-200'
                }
              `}
              aria-pressed={currentTimeframe === timeframe}
              aria-label={`Switch to ${timeframe} timeframe`}
            >
              {timeframe}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-zinc-800" />

      {/* Indicator toggles */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-zinc-400">Indicators:</span>
        <div className="flex gap-3">
          {indicators.map((indicator) => (
            <label
              key={indicator.type}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div className="relative">
                <input
                  type="checkbox"
                  checked={indicator.enabled}
                  onChange={() => onIndicatorToggle(indicator.type)}
                  className="
                    w-4 h-4 rounded border-2 border-zinc-600
                    bg-zinc-800 checked:bg-blue-600 checked:border-blue-600
                    focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900
                    transition-colors cursor-pointer
                  "
                  aria-label={`Toggle ${INDICATOR_LABELS[indicator.type]} indicator`}
                />
                {indicator.enabled && (
                  <svg
                    className="absolute inset-0 w-4 h-4 text-white pointer-events-none"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 5L6.5 10.5L4 8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <span
                className={`
                  text-sm font-medium transition-colors
                  ${
                    indicator.enabled
                      ? 'text-white'
                      : 'text-zinc-400 group-hover:text-zinc-300'
                  }
                `}
              >
                {INDICATOR_LABELS[indicator.type] ?? indicator.type}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

