import { MINUS } from '../engine/format'
import { sign } from '../engine/rational'
import type { Terms } from '../engine/terms'
import type { Analysis } from '../engine/types'
import './Waterfall.css'

type Props = {
  analysis: Analysis
  terms: Terms
}

type Bar = {
  key: 'rate' | 'composition' | 'net'
  label: string
  note: string
  value: string
  from: number
  to: number
  tone: 'improve' | 'decline' | 'composition' | 'net' | 'neutral'
  connectorAt?: number
}

const VIEW_WIDTH = 100
const PAD = 6

/**
 * Horizontal waterfall: within-group change from zero, then the mix shift
 * continuing from there, then the overall change from zero. Labels and values
 * are HTML text; the SVG bars are decorative and hidden from assistive tech.
 */
export function Waterfall({ analysis, terms }: Props) {
  const { rateEffect: r, net: n } = analysis.decompositionPoints
  const { display, decomposition } = analysis
  const low = Math.min(0, r, n)
  const high = Math.max(0, r, n)
  const span = high - low || 1
  const x = (v: number) => PAD + ((v - low) / span) * (VIEW_WIDTH - 2 * PAD)

  const rateSign = sign(decomposition.rateEffect)
  const bars: Bar[] = [
    {
      key: 'rate',
      label: `Change within ${terms.groups}`,
      note: `Each ${terms.group}'s own ${terms.metric}, weighted by its size`,
      value: display.rateEffect,
      from: 0,
      to: r,
      tone: rateSign > 0 ? 'improve' : rateSign < 0 ? 'decline' : 'neutral',
    },
    {
      key: 'composition',
      label: `Shift in the mix of ${terms.groups}`,
      note: `How the ${terms.unit} moved between ${terms.groups}`,
      value: display.compositionEffect,
      from: r,
      to: n,
      tone: 'composition',
      connectorAt: r,
    },
    {
      key: 'net',
      label: 'Overall change',
      note: `The headline: ${display.previousRate} → ${display.currentRate}`,
      value: display.net,
      from: 0,
      to: n,
      tone: 'net',
      connectorAt: n,
    },
  ]

  const compositionNegative = sign(decomposition.compositionEffect) < 0
  const relation = display.approximate ? '≈' : '='

  return (
    <figure className="waterfall">
      <ol className="waterfall__rows">
        {bars.map((bar) => {
          const left = Math.min(x(bar.from), x(bar.to))
          const width = Math.max(Math.abs(x(bar.to) - x(bar.from)), 0.4)
          return (
            <li key={bar.key} className={`waterfall__row waterfall__row--${bar.key}`}>
              <div className="waterfall__text">
                <span className="waterfall__label">{bar.label}</span>
                <span className="waterfall__note">{bar.note}</span>
              </div>
              <span className={`waterfall__value num waterfall__value--${bar.tone}`}>
                {bar.value}
                <span className="waterfall__unit" aria-hidden="true">
                  {' '}
                  pts
                </span>
                <span className="visually-hidden"> points</span>
              </span>
              <svg
                className="waterfall__chart"
                viewBox={`0 0 ${VIEW_WIDTH} 20`}
                preserveAspectRatio="none"
                aria-hidden="true"
                focusable="false"
              >
                <line className="waterfall__zero" x1={x(0)} x2={x(0)} y1="0" y2="20" vectorEffect="non-scaling-stroke" />
                {bar.connectorAt !== undefined && (
                  <line
                    className="waterfall__connector"
                    x1={x(bar.connectorAt)}
                    x2={x(bar.connectorAt)}
                    y1="0"
                    y2="4"
                    vectorEffect="non-scaling-stroke"
                  />
                )}
                <rect className={`waterfall__bar waterfall__bar--${bar.tone}`} x={left} y="4" width={width} height="12" />
              </svg>
            </li>
          )
        })}
      </ol>
      <figcaption className="waterfall__equation num" data-testid="equation">
        <span className={`waterfall__term waterfall__term--${bars[0]!.tone}`}>{display.rateEffect}</span>{' '}
        {compositionNegative ? MINUS : '+'}{' '}
        <span className="waterfall__term waterfall__term--composition">
          {display.compositionEffect.replace(/^[+−]/, '')}
        </span>{' '}
        {relation} <span className="waterfall__term waterfall__term--net">{display.net}</span>
        <span className="waterfall__equation-unit"> percentage points</span>
      </figcaption>
    </figure>
  )
}
